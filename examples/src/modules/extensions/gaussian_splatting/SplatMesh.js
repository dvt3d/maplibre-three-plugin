import {
  BufferAttribute,
  BufferGeometry,
  CustomBlending,
  DataTexture,
  DynamicDrawUsage,
  FloatType,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  OneFactor,
  RGBAFormat,
  RGBAIntegerFormat,
  ShaderMaterial,
  UnsignedIntType,
  Vector4,
  Frustum,
  Matrix4,
} from 'three'
import gaussian_splatting_vs_glsl from '../../shaders/gaussian_splatting_vs_glsl.js'
import gaussian_splatting_fs_glsl from '../../shaders/gaussian_splatting_fs_glsl.js'
import SortScheduler from './SortScheduler.js'
import { Util } from '../../utils/index.js'

const maxTextureSize = Util.getMaxTextureSize()
const maxVertexes = maxTextureSize * maxTextureSize

const _baseGeometry = new BufferGeometry().setAttribute(
  'position',
  new BufferAttribute(
    new Float32Array([
      -2.0, -2.0, 0.0, 2.0, 2.0, 0.0, -2.0, 2.0, 0.0, 2.0, -2.0, 0.0, 2.0, 2.0,
      0.0, -2.0, -2.0, 0.0,
    ]),
    3
  )
)

class SplatMesh extends Mesh {
  constructor() {
    super()
    this._meshId = Util.uuid()
    this._vertexCount = 0
    this._textureWidth = maxTextureSize
    this._textureHeight = 1
    this._loadedVertexCount = 0
    this._threshold = -0.00001
    this._centerAndScaleData = null
    this._centerAndScaleTexture = null
    this._rotationAndColorData = null
    this._rotationAndColorTexture = null
    this.geometry = new InstancedBufferGeometry().copy(_baseGeometry)
    this.geometry.instanceCount = 1
    this.material = new ShaderMaterial({
      uniforms: {
        viewport: { value: new Float32Array([1980, 1080]) }, // Dummy. will be overwritten
        centerAndScaleTexture: { value: null },
        covAndColorTexture: { value: null },
        gsModelViewMatrix: { value: null },
      },
      vertexShader: gaussian_splatting_vs_glsl,
      fragmentShader: gaussian_splatting_fs_glsl,
      blending: CustomBlending,
      blendSrcAlpha: OneFactor,
      depthTest: true,
      depthWrite: false,
      transparent: true,
    })
    this.material.onBeforeRender = this._onMaterialBeforeRender.bind(this)
    this.frustumCulled = false
    this._bounds = null
    this._sortScheduler = new SortScheduler()
    this._loadChain = Promise.resolve()
    this._worker = null
    this._useFrustumCulled = false
  }

  get isSplatMesh() {
    return true
  }

  set threshold(threshold) {
    this._threshold = threshold
  }

  get threshold() {
    return this._threshold
  }

  set worker(worker) {
    this._worker = worker
  }

  get worker() {
    return this._worker
  }

  get bounds() {
    return this._bounds
  }

  set vertexCount(vertexCount) {
    if (vertexCount === this._vertexCount) {
      return
    }

    this._vertexCount = Math.min(vertexCount, maxVertexes)

    this._textureHeight =
      Math.floor((this._vertexCount - 1) / this._textureWidth) + 1

    this._centerAndScaleData = new Float32Array(
      this._textureWidth * this._textureHeight * 4
    )

    if (this._centerAndScaleTexture) {
      this._centerAndScaleTexture.dispose()
    }

    this._centerAndScaleTexture = new DataTexture(
      this._centerAndScaleData,
      this._textureWidth,
      this._textureHeight,
      RGBAFormat,
      FloatType
    )

    this._rotationAndColorData = new Uint32Array(
      this._textureWidth * this._textureHeight * 4
    )

    if (this._rotationAndColorTexture) {
      this._rotationAndColorTexture.dispose()
    }

    this._rotationAndColorTexture = new DataTexture(
      this._rotationAndColorData,
      this._textureWidth,
      this._textureHeight,
      RGBAIntegerFormat,
      UnsignedIntType
    )
    this._rotationAndColorTexture.internalFormat = 'RGBA32UI'

    const splatIndexArray = new Uint32Array(
      this._textureWidth * this._textureHeight
    )
    const splatIndexes = new InstancedBufferAttribute(splatIndexArray, 1, false)
    splatIndexes.setUsage(DynamicDrawUsage)
    this.geometry.setAttribute('splatIndex', splatIndexes)
    this.material.uniforms.centerAndScaleTexture.value =
      this._centerAndScaleTexture
    this.material.uniforms.covAndColorTexture.value =
      this._rotationAndColorTexture
  }

  get vertexCount() {
    return this._vertexCount
  }

  set useFrustumCulled(v) {
    this._useFrustumCulled = v
  }

  get useFrustumCulled() {
    return this._useFrustumCulled
  }

  /**
   *
   * @param camera
   * @returns {Matrix4}
   * @private
   */
  _getModelViewMatrix(camera) {
    let viewMatrix = camera.matrixWorld.clone().invert()
    return viewMatrix.multiply(this.matrixWorld)
  }

  /**
   *
   * @param vertexCount
   * @private
   */
  _updateTexture(vertexCount) {
    while (vertexCount > 0) {
      const xOffset = this._loadedVertexCount % this._textureWidth
      const yOffset = Math.floor(this._loadedVertexCount / this._textureWidth)

      // 每次填充的最大宽度
      const maxWidth = this._textureWidth - xOffset
      // 这一行能放多少个顶点
      const width = Math.min(vertexCount, maxWidth)
      // 如果剩余顶点超过一行，就填满一行，否则只填剩余顶点
      const height = Math.ceil(width / this._textureWidth) || 1

      const pixelsToWrite = width * height

      const dstOffset = (yOffset * this._textureWidth + xOffset) * 4
      const srcOffset = this._loadedVertexCount * 4
      const copyLength = pixelsToWrite * 4
      this._centerAndScaleTexture.image.data.set(
        this._centerAndScaleData.subarray(srcOffset, srcOffset + copyLength),
        dstOffset
      )
      this._rotationAndColorTexture.image.data.set(
        this._rotationAndColorData.subarray(srcOffset, srcOffset + copyLength),
        dstOffset
      )
      this._loadedVertexCount += pixelsToWrite
      vertexCount -= pixelsToWrite
    }
    this._centerAndScaleTexture.needsUpdate = true
    this._rotationAndColorTexture.needsUpdate = true
  }

  /**
   *
   * @param buffer
   * @param vertexCount
   * @private
   */
  async _updateDataFromBuffer(buffer, vertexCount) {
    if (!this._worker) {
      return
    }

    if (this._loadedVertexCount + vertexCount > maxVertexes) {
      vertexCount = maxVertexes - this._loadedVertexCount
    }

    if (vertexCount <= 0) {
      return
    }
    let data = await this._worker.call(
      this._loadedVertexCount === 0
        ? 'process_splats_from_buffer'
        : 'append_data_from_buffer',
      this._meshId,
      buffer,
      vertexCount
    )
    if (data && this._meshId === data.meshId) {
      this._centerAndScaleData.set(data.out_cs, this._loadedVertexCount * 4)
      this._rotationAndColorData.set(data.out_rc, this._loadedVertexCount * 4)
      this._sortScheduler.dirty = true
    }
    buffer = null
  }

  /**
   *
   * @param geometry
   * @private
   */
  async _updateDataFromGeometry(geometry) {
    if (!this._worker) {
      return
    }
    let vertexCount = Math.min(geometry.attributes.position.count, maxVertexes)
    if (vertexCount <= 0) {
      return
    }

    const data = await this._worker.call(
      'process_splats_from_geometry',
      this._meshId,
      geometry.attributes.position.array,
      geometry.attributes._scale.array,
      geometry.attributes._rotation.array,
      geometry.attributes.color.array,
      vertexCount
    )

    if (data && this._meshId === data.meshId) {
      this._centerAndScaleData.set(data.out_cs)
      this._rotationAndColorData.set(data.out_rc)
      this._sortScheduler.dirty = true
    }
    geometry.dispose()
  }

  /**
   *
   * @param spzData
   * @private
   */
  async _updateDataFromSpz(spzData) {
    if (!this._worker) {
      return
    }
    let vertexCount = Math.min(spzData.numPoints, maxVertexes)
    if (vertexCount <= 0) {
      return
    }
    const data = await this._worker.call(
      'process_splats_from_spz',
      this._meshId,
      spzData.positions,
      spzData.scales,
      spzData.rotations,
      spzData.colors,
      spzData.alphas,
      vertexCount
    )
    if (data && this._meshId === data.meshId) {
      this._centerAndScaleData.set(data.out_cs)
      this._rotationAndColorData.set(data.out_rc)
      this._sortScheduler.dirty = true
    }
    spzData = null
  }

  /**
   *
   * @param renderer
   * @param scene
   * @param camera
   * @param geometry
   * @param object
   * @param group
   * @private
   */
  _onMaterialBeforeRender(renderer, scene, camera, geometry, object, group) {
    let modelViewMatrix = this._getModelViewMatrix(camera)
    this._sortScheduler.tick(modelViewMatrix, () => {
      const camera_mtx = modelViewMatrix.elements
      const view = new Float32Array([
        camera_mtx[2],
        camera_mtx[6],
        camera_mtx[10],
        camera_mtx[14],
      ])

      let planes = new Float32Array(0)
      if (this._useFrustumCulled) {
        planes = new Float32Array(6 * 4)
        const projViewMatrix = new Matrix4()
        projViewMatrix.multiplyMatrices(
          camera.projectionMatrix,
          camera.matrixWorldInverse
        )
        const frustum = new Frustum()
        frustum.setFromProjectionMatrix(projViewMatrix)
        frustum.planes.forEach((p, i) => {
          planes[i * 4 + 0] = p.normal.x
          planes[i * 4 + 1] = p.normal.y
          planes[i * 4 + 2] = p.normal.z
          planes[i * 4 + 3] = p.constant
        })
      }
      this._worker
        .call('sort_splats', this._meshId, view, planes, this._threshold)
        .then((result) => {
          if (this._meshId === result.meshId) {
            const indexes = new Uint32Array(result.data)
            this.geometry.attributes.splatIndex.set(indexes)
            this.geometry.attributes.splatIndex.needsUpdate = true
            this.geometry.instanceCount = indexes.length
            this._sortScheduler.isSorting = false
          }
        })
    })
    const material = object.material
    material.uniforms.gsModelViewMatrix.value = modelViewMatrix
    const viewport = new Vector4()
    renderer.getCurrentViewport(viewport)
    material.uniforms.viewport.value[0] = viewport.z
    material.uniforms.viewport.value[1] = viewport.w
  }

  /**
   *
   */
  async computeBounds() {
    if (this._worker) {
      return
    }
    if (this._bounds) {
      return
    }
    const result = await this._worker.call('compute_bounds', this._meshId)
    if (this._meshId === result.meshId) {
      this._bounds = result.data
    }
  }

  /**
   *
   */
  async dispose() {
    this._bounds = null
    if (this._centerAndScaleTexture) {
      this._centerAndScaleTexture.dispose()
      this._centerAndScaleData = null
    }
    if (this._rotationAndColorTexture) {
      this._rotationAndColorTexture.dispose()
      this._rotationAndColorData = null
    }
    if (this._worker) {
      await this._worker.call('unregister_positions', this._bufferId)
    }
    this._bufferId = null
    this._sortScheduler = null
    this.geometry.dispose()
    this.material.dispose()
    this.parent = null
  }
  /**
   *
   * @param buffer
   * @param vertexCount
   * @returns {SplatMesh}
   */
  async setDataFromBuffer(buffer) {
    this._loadedVertexCount = 0
    this._loadChain = this._loadChain.then(() =>
      this._updateDataFromBuffer(buffer, this._vertexCount)
    )
    await this._loadChain
    this._updateTexture(this._vertexCount)
    return this
  }

  /**
   *
   * @param buffer
   * @param vertexCount
   * @returns {SplatMesh}
   */
  async appendDataFromBuffer(buffer, vertexCount) {
    this._loadChain = this._loadChain.then(() =>
      this._updateDataFromBuffer(buffer, vertexCount)
    )
    await this._loadChain
    this._updateTexture(vertexCount)
    return this
  }

  /**
   *
   * @param spzData
   * @returns {SplatMesh}
   */
  async setDataFromSpz(spzData) {
    this._loadedVertexCount = 0
    await this._updateDataFromSpz(spzData)
    this._updateTexture(this._vertexCount)
    return this
  }

  /**
   *
   * @param geometry
   * @returns {SplatMesh}
   */
  async setDataFromGeometry(geometry) {
    this._loadedVertexCount = 0
    await this._updateDataFromGeometry(geometry)
    this._updateTexture(this._vertexCount)
    return this
  }
}

export default SplatMesh
