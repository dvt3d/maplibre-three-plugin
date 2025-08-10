import {
  Mesh,
  DataTexture,
  RGBAFormat,
  FloatType,
  RGBAIntegerFormat,
  UnsignedIntType,
  Vector4,
  Vector2,
  InstancedBufferAttribute,
  DynamicDrawUsage,
  Quaternion,
  Vector3,
  Matrix4,
  BufferGeometry,
  BufferAttribute,
  InstancedBufferGeometry,
  ShaderMaterial,
  CustomBlending,
  OneFactor,
} from 'three'
import gaussian_splatting_vs_glsl from '../../shaders/gaussian_splatting_vs_glsl.js'
import gaussian_splatting_fs_glsl from '../../shaders/gaussian_splatting_fs_glsl.js'

const RowLength = 3 * 4 + 3 * 4 + 4 + 4

class SplatMesh extends Mesh {
  constructor(numVertexes) {
    super()
    this._numVertexes = numVertexes
    this._maxVertexes = 0
    this._textureWidth = 0
    this._textureHight = 0
    this._centerAndScaleData = null
    this._centerAndScaleTexture = null
    this._rotationAndColorData = null
    this._rotationAndColorTexture = null

    this._splatIndexAttribute = null
    this._splatData = null

    this.frustumCulled = false
    this._isDataChanged = false
    this._splatData = null
    this._positions = null

    const baseGeometry = new BufferGeometry()
    const positions = new BufferAttribute(
      new Float32Array([
        -2.0, -2.0, 0.0, 2.0, 2.0, 0.0, -2.0, 2.0, 0.0, 2.0, -2.0, 0.0, 2.0,
        2.0, 0.0, -2.0, -2.0, 0.0,
      ]),
      3
    )
    baseGeometry.setAttribute('position', positions)
    this.geometry = new InstancedBufferGeometry().copy(baseGeometry)
    this.geometry.instanceCount = 1
    this.material = new ShaderMaterial({
      uniforms: {
        u_viewport: { value: new Float32Array([1980, 1080]) }, // Dummy. will be overwritten
        u_focal: { value: 1000.0 },
      },
      vertexShader: gaussian_splatting_vs_glsl,
      fragmentShader: gaussian_splatting_fs_glsl,
      blending: CustomBlending,
      blendSrcAlpha: OneFactor,
      depthTest: true,
      depthWrite: false,
      transparent: true,
    })
  }

  /**
   *
   * @param gl
   */
  _createSplatTexture(gl) {
    if (this._textureWidth || this._textureHight) {
      return
    }
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
    this._maxVertexes = maxTextureSize * maxTextureSize
    if (this._numVertexes > this._maxVertexes) {
      console.warn(
        'numVertexes limited to ',
        this._maxVertexes,
        this._numVertexes
      )
      this._numVertexes = this._maxVertexes
    }
    // 计算纹理大小
    this._textureWidth = maxTextureSize
    this._textureHight =
      Math.floor((this._numVertexes - 1) / maxTextureSize) + 1

    this._centerAndScaleData = new Float32Array(
      this._textureWidth * this._textureHight * 4
    )
    this._centerAndScaleTexture = new DataTexture(
      this._centerAndScaleData,
      this._textureWidth,
      this._textureHight,
      RGBAFormat,
      FloatType
    )
    this._centerAndScaleTexture.needsUpdate = true

    this._rotationAndColorData = new Uint32Array(
      this._textureWidth * this._textureHight * 4
    )
    this._rotationAndColorTexture = new DataTexture(
      this._rotationAndColorData,
      this._textureWidth,
      this._textureHight,
      RGBAIntegerFormat,
      UnsignedIntType
    )
    this._rotationAndColorTexture.internalFormat = 'RGBA32UI'
    this._rotationAndColorTexture.needsUpdate = true
  }

  /**
   *
   * @param data
   * @private
   */
  _setDataToTexture() {
    if (
      !this._centerAndScaleData ||
      !this._rotationAndColorData ||
      !this._isDataChanged
    ) {
      return
    }
    let buffer = this._splatData.buffer
    let u_buffer = new Uint8Array(buffer)
    let f_buffer = new Float32Array(buffer)
    this._positions = new Float32Array(this._numVertexes * 4)

    let rotationAndColorData_int16 = new Int16Array(
      this._rotationAndColorData.buffer
    )
    let rotationAndColorData_uint8 = new Uint8Array(
      this._rotationAndColorData.buffer
    )

    let vertexCount = Math.floor(buffer.size / RowLength)
    if (vertexCount) {
      for (let i = 0; i < vertexCount; i++) {
        let center = new Vector3(
          f_buffer[8 * i + 0],
          f_buffer[8 * i + 1],
          -f_buffer[8 * i + 2]
        )
        let scale = new Vector3(
          f_buffer[8 * i + 3],
          f_buffer[8 * i + 4],
          f_buffer[8 * i + 5]
        )

        let quaternion = new Quaternion(
          (u_buffer[32 * i + 28 + 1] - 128) / 128.0,
          (u_buffer[32 * i + 28 + 2] - 128) / 128.0,
          -(u_buffer[32 * i + 28 + 3] - 128) / 128.0,
          (u_buffer[32 * i + 28 + 0] - 128) / 128.0
        )

        // construct the covariance matrix
        let mtx = new Matrix4()
        mtx.makeRotationFromQuaternion(quaternion)
        mtx.transpose()
        mtx.scale(scale)
        let mtx_t = mtx.clone()
        mtx.transpose()
        mtx.premultiply(mtx_t)
        mtx.setPosition(center)

        //upper triangular index of covariance matrix
        let cov_indexes = [0, 1, 2, 5, 6, 10]

        let max_value = 0.0

        for (let j = 0; j < cov_indexes.length; j++) {
          if (Math.abs(mtx.elements[cov_indexes[j]]) > max_value) {
            max_value = Math.abs(mtx.elements[cov_indexes[j]])
          }
        }
        // Center and Scale
        this._centerAndScaleData[i * 4 + 0] = center.x
        this._centerAndScaleData[i * 4 + 1] = center.y
        this._centerAndScaleData[i * 4 + 2] = center.z
        this._centerAndScaleData[i * 4 + 3] = max_value / 32767.0

        // Rotation
        for (let j = 0; j < cov_indexes.length; j++) {
          rotationAndColorData_int16[i * 8 + j] = parseInt(
            (mtx.elements[cov_indexes[j]] * 32767.0) / max_value + ''
          )
        }
        // RGBA
        rotationAndColorData_uint8[(i * 4 + 3) * 4 + 0] =
          u_buffer[32 * i + 24 + 0]
        rotationAndColorData_uint8[(i * 4 + 3) * 4 + 1] =
          u_buffer[32 * i + 24 + 1]
        rotationAndColorData_uint8[(i * 4 + 3) * 4 + 2] =
          u_buffer[32 * i + 24 + 2]
        rotationAndColorData_uint8[(i * 4 + 3) * 4 + 3] =
          u_buffer[32 * i + 24 + 3]

        this._centerAndScaleTexture.image.data.set(this._centerAndScaleData)
        this._centerAndScaleTexture.needsUpdate = true

        this._rotationAndColorTexture.image.data.set(this._rotationAndColorData)
        this._rotationAndColorTexture.needsUpdate = true

        this._positions[i * 4 + 0] = mtx.elements[12]
        this._positions[i * 4 + 1] = mtx.elements[13]
        this._positions[i * 4 + 2] = mtx.elements[14]
        this._positions[i * 4 + 3] =
          (Math.max(scale.x, scale.y, scale.z) * u_buffer[32 * i + 24 + 3]) /
          255.0
      }
    }
    this._isDataChanged = false
  }

  /**
   *
   * @param camera
   * @returns {Matrix4}
   * @private
   */
  _getProjectionMatrix(camera) {
    //y flip
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
    //y flip
    viewMatrix.elements[1] *= -1.0
    viewMatrix.elements[4] *= -1.0
    viewMatrix.elements[6] *= -1.0
    viewMatrix.elements[9] *= -1.0
    viewMatrix.elements[13] *= -1.0

    const mtx = this.matrixWorld.clone()
    mtx.invert()
    //y flip
    mtx.elements[1] *= -1.0
    mtx.elements[4] *= -1.0
    mtx.elements[6] *= -1.0
    mtx.elements[9] *= -1.0
    mtx.elements[13] *= -1.0
    mtx.multiply(viewMatrix)
    mtx.invert()
    return mtx
  }

  _sortSplatIndex(modelViewMatrix) {}

  /**
   *
   * @param gl
   */
  _createSplatIndexAttribute() {
    if (this._splatIndexAttribute) {
      return this
    }
    let splatIndexArray = new Uint32Array(
      this._textureWidth * this._textureHight
    )
    this._splatIndexAttribute = new InstancedBufferAttribute(
      splatIndexArray,
      1,
      false
    )
    this._splatIndexAttribute.setUsage(DynamicDrawUsage)
    this.geometry.setAttribute('splatIndex', this._splatIndexAttribute)
  }

  /**
   *
   * @param renderer
   * @param scene
   * @param camera
   * @param geometry
   * @param object
   * @param group
   */
  _materialOnBeforeRender(renderer, scene, camera, geometry, object, group) {
    this._createSplatTexture(renderer.getContext()) //only exec one time
    this._setDataToTexture() ///only exec when the data changed
    this._createSplatIndexAttribute() //only exec one time
    let modelViewMatrix = this._getModelViewMatrix(camera)
    this._sortSplatIndex(modelViewMatrix) //only exec when the camera changed
    let projectionMatrix = this._getProjectionMatrix(camera)
    let material = object.material
    if (material) {
      material.uniforms['u_projectionMatrix'].value = projectionMatrix
      material.uniforms['u_modelViewMatrix'].value = modelViewMatrix
      let viewport = new Vector4()
      renderer.getCurrentViewport(viewport)
      material.uniforms['u_focal'].value =
        (viewport.w / 2.0) * Math.abs(projectionMatrix.elements[5])
      material.uniforms['u_viewport'].value = new Vector2(
        viewport.z,
        viewport.w
      )
    }
  }
  /**
   *
   * @param splatData
   */
  setSplatData(splatData) {
    this._splatData = splatData
    return this
  }

  /**
   *
   * @param splatData
   */
  appendSplatData(splatData) {
    // this._splatData = splatData
    return this
  }
}

export default SplatMesh
