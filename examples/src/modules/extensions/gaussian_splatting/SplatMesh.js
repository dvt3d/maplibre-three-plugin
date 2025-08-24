import * as THREE from 'three'
import { BufferAttribute, BufferGeometry } from 'three'
import gaussian_splatting_vs_glsl from '../../shaders/gaussian_splatting_vs_glsl.js'
import gaussian_splatting_fs_glsl from '../../shaders/gaussian_splatting_fs_glsl.js'
import WasmTaskProcessor from '../../task/WasmTaskProcessor.js'
import SortScheduler from './SortScheduler.js'

const wasmTaskProcessor = new WasmTaskProcessor(
  new URL('../../../wasm/splats/wasm_spalts.js', import.meta.url).href
)
await wasmTaskProcessor.init()
const canvas = document.createElement('canvas')
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
const maxVertexes = maxTextureSize * maxTextureSize

const sortScheduler = new SortScheduler()
const baseGeometry = new BufferGeometry()
const positions = new BufferAttribute(
  new Float32Array([
    -2.0, -2.0, 0.0, 2.0, 2.0, 0.0, -2.0, 2.0, 0.0, 2.0, -2.0, 0.0, 2.0, 2.0,
    0.0, -2.0, -2.0, 0.0,
  ]),
  3
)
baseGeometry.setAttribute('position', positions)

class SplatMesh extends THREE.Mesh {
  constructor() {
    super()
    this._vertexCount = 0
    this._textureWidth = 2048
    this._loadedVertexCount = 0
    this._threshold = -0.00001
    this.geometry = new THREE.InstancedBufferGeometry().copy(baseGeometry)
    this.geometry.instanceCount = 1
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        viewport: { value: new Float32Array([1980, 1080]) }, // Dummy. will be overwritten
        focal: { value: 1000.0 }, // Dummy. will be overwritten
        centerAndScaleTexture: { value: null },
        covAndColorTexture: { value: null },
        gsProjectionMatrix: { value: null },
        gsModelViewMatrix: { value: null },
      },
      vertexShader: gaussian_splatting_vs_glsl,
      fragmentShader: gaussian_splatting_fs_glsl,
      blending: THREE.CustomBlending,
      blendSrcAlpha: THREE.OneFactor,
      depthTest: true,
      depthWrite: false,
      transparent: true,
    })
    this.material.onBeforeRender = this._onMaterialBeforeRender.bind(this)
    this.frustumCulled = false
    this._positions = new Float32Array(0)
    this._bounds = null
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

    this._centerAndScaleTexture = new THREE.DataTexture(
      this._centerAndScaleData,
      this._textureWidth,
      this._textureHeight,
      THREE.RGBAFormat,
      THREE.FloatType
    )

    this._rotationAndColorData = new Uint32Array(
      this._textureWidth * this._textureHeight * 4
    )

    if (this._rotationAndColorTexture) {
      this._rotationAndColorTexture.dispose()
    }

    this._rotationAndColorTexture = new THREE.DataTexture(
      this._rotationAndColorData,
      this._textureWidth,
      this._textureHeight,
      THREE.RGBAIntegerFormat,
      THREE.UnsignedIntType
    )
    this._rotationAndColorTexture.internalFormat = 'RGBA32UI'

    const splatIndexArray = new Uint32Array(
      this._textureWidth * this._textureHeight
    )
    const splatIndexes = new THREE.InstancedBufferAttribute(
      splatIndexArray,
      1,
      false
    )
    splatIndexes.setUsage(THREE.DynamicDrawUsage)
    this.geometry.setAttribute('splatIndex', splatIndexes)

    this.material.uniforms.centerAndScaleTexture.value =
      this._centerAndScaleTexture

    this.material.uniforms.covAndColorTexture.value =
      this._rotationAndColorTexture
  }

  get vertexCount() {
    return this._vertexCount
  }

  /**
   *
   * @param camera
   * @returns {THREE.Matrix4}
   * @private
   */
  _getProjectionMatrix(camera) {
    let mtx = camera.projectionMatrix.clone()
    mtx.elements[4] *= -1
    mtx.elements[5] *= -1
    mtx.elements[6] *= -1
    mtx.elements[7] *= -1
    return mtx
  }

  /**
   *
   * @param camera
   * @returns {Matrix4}
   * @private
   */
  _getModelViewMatrix(camera) {
    const viewMatrix = camera.matrixWorld.clone()
    viewMatrix.elements[1] *= -1.0
    viewMatrix.elements[4] *= -1.0
    viewMatrix.elements[6] *= -1.0
    viewMatrix.elements[9] *= -1.0
    viewMatrix.elements[13] *= -1.0

    const mtx = this.matrixWorld.clone()
    mtx.invert()
    mtx.elements[1] *= -1.0
    mtx.elements[4] *= -1.0
    mtx.elements[6] *= -1.0
    mtx.elements[9] *= -1.0
    mtx.elements[13] *= -1.0
    mtx.multiply(viewMatrix)
    mtx.invert()
    return mtx
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
    if (this._loadedVertexCount + vertexCount > maxVertexes) {
      vertexCount = maxVertexes - this._loadedVertexCount
    }
    if (vertexCount <= 0) {
      return
    }
    const out_cs = new Float32Array(vertexCount * 4)
    const out_rc = new Uint32Array(vertexCount * 4)
    const out_position = new Float32Array(vertexCount * 4)
    await wasmTaskProcessor.call(
      'process_splats_from_buffer',
      new Uint8Array(buffer),
      new Float32Array(buffer),
      vertexCount,
      out_cs,
      out_rc,
      out_position
    )
    this._centerAndScaleData.set(out_cs, this._loadedVertexCount * 4)
    this._rotationAndColorData.set(out_rc, this._loadedVertexCount * 4)
    let temp = new Float32Array(this._positions.length + out_position.length)
    temp.set(this._positions)
    temp.set(out_position, this._positions.length)
    this._positions = temp
    sortScheduler.dirty = true
  }

  /**
   *
   * @param geometry
   * @private
   */
  async _updateDataFromGeometry(geometry) {
    let vertexCount = geometry.attributes.position.count
    if (vertexCount > maxVertexes) {
      vertexCount = maxVertexes
    }
    if (vertexCount <= 0) {
      return
    }
    const out_cs = new Float32Array(vertexCount * 4)
    const out_rc = new Uint32Array(vertexCount * 4)
    this._positions = new Float32Array(vertexCount * 4)
    await wasmTaskProcessor.call(
      'process_splats_from_geometry',
      geometry.attributes.position.array,
      geometry.attributes._scale.array,
      geometry.attributes._rotation.array,
      geometry.attributes.color.array,
      vertexCount,
      out_cs,
      out_rc,
      this._positions
    )
    this._centerAndScaleData.set(out_cs)
    this._rotationAndColorData.set(out_rc)
  }

  /**
   *
   * @param spzData
   * @private
   */
  async _updateDataFromSpz(spzData) {
    let vertexCount = spzData.numPoints
    if (this._loadedVertexCount + vertexCount > maxVertexes) {
      vertexCount = maxVertexes - this._loadedVertexCount
    }
    if (vertexCount <= 0) {
      return
    }
    const out_cs = new Float32Array(vertexCount * 4)
    const out_rc = new Uint32Array(vertexCount * 4)
    this._positions = new Float32Array(vertexCount * 4)
    await wasmTaskProcessor.call(
      'process_splats_from_spz',
      spzData.positions,
      spzData.scales,
      spzData.rotations,
      spzData.colors,
      spzData.alphas,
      vertexCount,
      out_cs,
      out_rc,
      this._positions
    )
    this._centerAndScaleData.set(out_cs)
    this._rotationAndColorData.set(out_rc)
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
    let camera_mtx = modelViewMatrix.elements
    sortScheduler.tick(modelViewMatrix, (parameters, transferableObjects) => {
      let view = new Float32Array([
        camera_mtx[2],
        camera_mtx[6],
        camera_mtx[10],
        camera_mtx[14],
      ])
      wasmTaskProcessor
        .call('sort_splats', this._positions, view, this._threshold)
        .then((sortedIndexes) => {
          let indexes = new Uint32Array(sortedIndexes)
          this.geometry.attributes.splatIndex.set(indexes)
          this.geometry.attributes.splatIndex.needsUpdate = true
          this.geometry.instanceCount = indexes.length
          sortScheduler.isSorting = false
        })
    })

    const material = object.material
    const projectionMatrix = this._getProjectionMatrix(camera)
    material.uniforms.gsProjectionMatrix.value = projectionMatrix
    material.uniforms.gsModelViewMatrix.value = modelViewMatrix
    let viewport = new THREE.Vector4()
    renderer.getCurrentViewport(viewport)
    const focal = (viewport.w / 2.0) * Math.abs(projectionMatrix.elements[5])
    material.uniforms.viewport.value[0] = viewport.z
    material.uniforms.viewport.value[1] = viewport.w
    material.uniforms.focal.value = focal
  }

  /**
   *
   */
  computeBounds() {
    if (this._positions.length / 4 >= this._vertexCount && this._bounds) {
      return
    }
    let bounds = new THREE.Box3()
    for (let i = 0; i < this._positions.length; i += 4) {
      bounds.expandByPoint(
        new THREE.Vector3(
          this._positions[i + 0],
          -this._positions[i + 1],
          this._positions[i + 2]
        )
      )
    }
    this._bounds = bounds
  }
  /**
   *
   * @param buffer
   * @param vertexCount
   * @returns {SplatMesh}
   */
  async setDataFromBuffer(buffer) {
    this._loadedVertexCount = 0
    await this._updateDataFromBuffer(buffer, this._vertexCount)
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
    await this._updateDataFromBuffer(buffer, vertexCount)
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
