import * as THREE from 'three'
import { BufferAttribute, BufferGeometry } from 'three'
import { Util } from '../../utils/index.js'
import gaussian_splatting_vs_glsl from '../../shaders/gaussian_splatting_vs_glsl.js'
import gaussian_splatting_fs_glsl from '../../shaders/gaussian_splatting_fs_glsl.js'
import { doSplatSort } from '../../workers/SplatSortWorker.js'

const cov_indexes = [0, 1, 2, 5, 6, 10]

const _center = new THREE.Vector3()
const _scale = new THREE.Vector3()
const _quaternion = new THREE.Quaternion()

class SplatMesh extends THREE.Mesh {
  constructor(numVertexes) {
    super()
    this._numVertexes = numVertexes

    const maxTextureSize = Util.getMaxTextureSize()

    this._maxVertexes = maxTextureSize * maxTextureSize

    if (this._numVertexes > this._maxVertexes) {
      console.warn(
        'numVertexes limited to ',
        this._maxVertexes,
        this._numVertexes
      )
      this._numVertexes = this._maxVertexes
    }

    this._textureWidth = maxTextureSize

    this._textureHeight =
      Math.floor((this._numVertexes - 1) / maxTextureSize) + 1

    this._centerAndScaleData = new Float32Array(
      this._textureWidth * this._textureHeight * 4
    )

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

    this._rotationAndColorTexture = new THREE.DataTexture(
      this._rotationAndColorData,
      this._textureWidth,
      this._textureHeight,
      THREE.RGBAIntegerFormat,
      THREE.UnsignedIntType
    )
    this._rotationAndColorTexture.internalFormat = 'RGBA32UI'

    this._loadedVertexCount = 0

    this._threshold = -0.00001

    const baseGeometry = new BufferGeometry()
    const positions = new BufferAttribute(
      new Float32Array([
        -2.0, -2.0, 0.0, 2.0, 2.0, 0.0, -2.0, 2.0, 0.0, 2.0, -2.0, 0.0, 2.0,
        2.0, 0.0, -2.0, -2.0, 0.0,
      ]),
      3
    )
    baseGeometry.setAttribute('position', positions)
    this.geometry = new THREE.InstancedBufferGeometry().copy(baseGeometry)
    this.geometry.instanceCount = 1

    let splatIndexArray = new Uint32Array(
      this._textureWidth * this._textureHeight
    )
    const splatIndexes = new THREE.InstancedBufferAttribute(
      splatIndexArray,
      1,
      false
    )
    splatIndexes.setUsage(THREE.DynamicDrawUsage)

    this.geometry.setAttribute('splatIndex', splatIndexes)

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        viewport: { value: new Float32Array([1980, 1080]) }, // Dummy. will be overwritten
        focal: { value: 1000.0 }, // Dummy. will be overwritten
        centerAndScaleTexture: { value: this._centerAndScaleTexture },
        covAndColorTexture: { value: this._rotationAndColorTexture },
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

    this._isSortting = false

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

  _updateCenterAndScaleData(index, mtx, center, scale, quaternion) {
    mtx.makeRotationFromQuaternion(quaternion)
    mtx.transpose()
    mtx.scale(scale)
    let mtx_t = mtx.clone()
    mtx.transpose()
    mtx.premultiply(mtx_t)
    mtx.setPosition(center)

    let max_value = 0.0

    for (let j = 0; j < cov_indexes.length; j++) {
      if (Math.abs(mtx.elements[cov_indexes[j]]) > max_value) {
        max_value = Math.abs(mtx.elements[cov_indexes[j]])
      }
    }

    let destOffset = this._loadedVertexCount * 4 + index * 4
    this._centerAndScaleData[destOffset + 0] = center.x
    this._centerAndScaleData[destOffset + 1] = center.y
    this._centerAndScaleData[destOffset + 2] = center.z
    this._centerAndScaleData[destOffset + 3] = max_value / 32767.0

    return max_value
  }

  /**
   *
   * @param buffer
   * @param vertexCount
   * @private
   */
  _updateDataFromBuffer(buffer, vertexCount) {
    if (this._loadedVertexCount + vertexCount > this._maxVertexes) {
      console.log('vertexCount limited to ', this._maxVertexes, vertexCount)
      vertexCount = this._maxVertexes - this._loadedVertexCount
    }
    if (vertexCount <= 0) {
      return
    }
    let u_buffer = new Uint8Array(buffer)
    let f_buffer = new Float32Array(buffer)
    let new_positions = new Float32Array(vertexCount * 4)

    const rotationAndColorData_uint8 = new Uint8Array(
      this._rotationAndColorData.buffer
    )
    const rotationAndColorData_int16 = new Int16Array(
      this._rotationAndColorData.buffer
    )

    for (let i = 0; i < vertexCount; i++) {
      _center.set(
        f_buffer[8 * i + 0],
        f_buffer[8 * i + 1],
        -f_buffer[8 * i + 2]
      )
      _scale.set(
        f_buffer[8 * i + 3 + 0],
        f_buffer[8 * i + 3 + 1],
        f_buffer[8 * i + 3 + 2]
      )
      _quaternion.set(
        (u_buffer[32 * i + 28 + 1] - 128) / 128.0,
        (u_buffer[32 * i + 28 + 2] - 128) / 128.0,
        -(u_buffer[32 * i + 28 + 3] - 128) / 128.0,
        (u_buffer[32 * i + 28 + 0] - 128) / 128.0
      )
      let mtx = new THREE.Matrix4()
      let max_value = this._updateCenterAndScaleData(
        i,
        mtx,
        _center,
        _scale,
        _quaternion
      )
      let destOffset = this._loadedVertexCount * 8 + i * 4 * 2

      for (let j = 0; j < cov_indexes.length; j++) {
        rotationAndColorData_int16[destOffset + j] = parseInt(
          (mtx.elements[cov_indexes[j]] * 32767.0) / max_value
        )
      }
      // RGBA
      destOffset = this._loadedVertexCount * 16 + (i * 4 + 3) * 4
      rotationAndColorData_uint8[destOffset + 0] = u_buffer[32 * i + 24 + 0]
      rotationAndColorData_uint8[destOffset + 1] = u_buffer[32 * i + 24 + 1]
      rotationAndColorData_uint8[destOffset + 2] = u_buffer[32 * i + 24 + 2]
      rotationAndColorData_uint8[destOffset + 3] = u_buffer[32 * i + 24 + 3]

      // Store scale and transparent to remove splat in sorting process
      new_positions[i * 4 + 0] = mtx.elements[12]
      new_positions[i * 4 + 1] = mtx.elements[13]
      new_positions[i * 4 + 2] = mtx.elements[14]
      new_positions[i * 4 + 3] =
        (Math.max(_scale.x, _scale.y, _scale.z) * u_buffer[32 * i + 24 + 3]) /
        255.0
    }

    let temp = new Float32Array(this._positions.length + new_positions.length)
    temp.set(this._positions)
    temp.set(new_positions, this._positions.length)
    this._positions = temp
  }

  /**
   *
   * @param spzData
   * @private
   */
  _updateDataFromSpz(spzData) {
    let vertexCount = spzData.numPoints
    const positions = spzData.positions
    const colors = spzData.colors
    const scales = spzData.scales
    const alphas = spzData.alphas
    const rotations = spzData.rotations
    if (this._loadedVertexCount + vertexCount > this._maxVertexes) {
      console.log('vertexCount limited to ', this._maxVertexes, vertexCount)
      vertexCount = this._maxVertexes - this._loadedVertexCount
    }
    if (vertexCount <= 0) {
      return
    }
  }

  /**
   *
   * @param geometry
   * @private
   */
  _updateDataFromGeometry(geometry) {
    let vertexCount = geometry.attributes.position.count
    if (this._loadedVertexCount + vertexCount > this._maxVertexes) {
      console.log('vertexCount limited to ', this._maxVertexes, vertexCount)
      vertexCount = this._maxVertexes - this._loadedVertexCount
    }
    if (vertexCount <= 0) {
      return
    }
    const positions = geometry.attributes.position.array
    const scales = geometry.attributes._scale.array
    const colors = geometry.attributes.color.array
    const rotations = geometry.attributes._rotation.array
    let new_positions = new Float32Array(vertexCount * 4)
    const rotationAndColorData_uint8 = new Uint8Array(
      this._rotationAndColorData.buffer
    )
    const rotationAndColorData_int16 = new Int16Array(
      this._rotationAndColorData.buffer
    )

    for (let i = 0; i < vertexCount; i++) {
      _center.set(
        positions[3 * i + 0],
        positions[3 * i + 1],
        -positions[3 * i + 2]
      )
      _scale.set(scales[3 * i + 0], scales[3 * i + 1], scales[3 * i + 2])
      _quaternion.set(
        rotations[i * 4 + 1],
        rotations[i * 4 + 2],
        -rotations[i * 4 + 3],
        rotations[i * 4 + 0]
      )

      let mtx = new THREE.Matrix4()
      let max_value = this._updateCenterAndScaleData(
        i,
        mtx,
        _center,
        _scale,
        _quaternion
      )

      let destOffset = this._loadedVertexCount * 8 + i * 4 * 2
      for (let j = 0; j < cov_indexes.length; j++) {
        rotationAndColorData_int16[destOffset + j] = parseInt(
          (mtx.elements[cov_indexes[j]] * 32767.0) / max_value
        )
      }

      // RGBA
      destOffset = this._loadedVertexCount * 16 + (i * 4 + 3) * 4
      rotationAndColorData_uint8[destOffset + 0] = colors[i * 4 + 0]
      rotationAndColorData_uint8[destOffset + 1] = colors[i * 4 + 1]
      rotationAndColorData_uint8[destOffset + 2] = colors[i * 4 + 2]
      rotationAndColorData_uint8[destOffset + 3] = colors[i * 4 + 3]

      // Store scale and transparent to remove splat in sorting process
      new_positions[i * 4 + 0] = mtx.elements[12]
      new_positions[i * 4 + 1] = mtx.elements[13]
      new_positions[i * 4 + 2] = mtx.elements[14]
      new_positions[i * 4 + 3] =
        (Math.max(_scale.x, _scale.y, _scale.z) * colors[i * 4 + 3]) / 255.0
    }

    let temp = new Float32Array(this._positions.length + new_positions.length)
    temp.set(this._positions)
    temp.set(new_positions, this._positions.length)
    this._positions = temp
  }

  onBeforeRender(renderer, scene, camera, geometry, material, group) {}

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
    if (!this._isSortting) {
      this._isSortting = true
      let view = new Float32Array([
        camera_mtx[2],
        camera_mtx[6],
        camera_mtx[10],
        camera_mtx[14],
      ])
      doSplatSort(this._positions.buffer, view.buffer, this.threshold).then(
        (sortedIndexes) => {
          let indexes = new Uint32Array(sortedIndexes)
          this.geometry.attributes.splatIndex.set(indexes)
          this.geometry.attributes.splatIndex.needsUpdate = true
          this.geometry.instanceCount = indexes.length
          this._isSortting = false
        }
      )
    }

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
    if (this._positions.length / 4 >= this._numVertexes && this._bounds) {
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
  setDataFromBuffer(buffer, vertexCount) {
    this._loadedVertexCount = 0
    this._updateDataFromBuffer(buffer, vertexCount)
    this._updateTexture(vertexCount)
    return this
  }

  /**
   *
   * @param buffer
   * @param vertexCount
   * @returns {SplatMesh}
   */
  appendDataFromBuffer(buffer, vertexCount) {
    this._updateDataFromBuffer(buffer, vertexCount)
    this._updateTexture(vertexCount)
    return this
  }

  /**
   *
   * @param spzData
   * @returns {SplatMesh}
   */
  setDataFromSpz(spzData) {
    this._loadedVertexCount = 0
    return this
  }

  /**
   *
   * @param geometry
   * @returns {SplatMesh}
   */
  setDataFromGeometry(geometry) {
    this._loadedVertexCount = 0
    const vertexCount = geometry.attributes.position.count
    this._updateDataFromGeometry(geometry)
    this._updateTexture(vertexCount)
    return this
  }
}

export default SplatMesh
