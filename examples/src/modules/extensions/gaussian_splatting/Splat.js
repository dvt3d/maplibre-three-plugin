import { Box3, Object3D, Vector3 } from 'three'
import { isTypedArray } from 'three/src/animation/AnimationUtils.js'

const rowLength = 3 * 4 + 3 * 4 + 4 + 4
class Splat extends Object3D {
  constructor() {
    super()
    this._vertexCount = 0
    this._positions = new Float32Array(0)
    this._scales = new Float32Array(0)
    this._rotations = new Float32Array(0)
    this._colors = new Uint8Array(0)
  }

  /**
   *
   * @param buffer
   * @returns {{positions: Float32Array<ArrayBuffer>, scales: Float32Array<ArrayBuffer>, rotations: Float32Array<ArrayBuffer>, colors: Uint8Array<ArrayBuffer>}}
   * @private
   */
  _parse(buffer) {
    const f_buffer = new Float32Array(buffer)
    const u_buffer = new Uint8Array(buffer)
    const vertexCount = Math.floor(u_buffer.length / rowLength)
    const positions = new Float32Array(vertexCount * 3)
    const scales = new Float32Array(vertexCount * 3)
    const rotations = new Float32Array(vertexCount * 4)
    const colors = new Uint8Array(vertexCount * 4)

    for (let i = 0; i < vertexCount; i++) {
      positions[3 * i + 0] = f_buffer[8 * i + 0]
      positions[3 * i + 1] = f_buffer[8 * i + 1]
      positions[3 * i + 2] = f_buffer[8 * i + 2]

      scales[3 * i + 0] = f_buffer[8 * i + 3 + 0]
      scales[3 * i + 1] = f_buffer[8 * i + 3 + 1]
      scales[3 * i + 2] = f_buffer[8 * i + 3 + 2]

      rotations[4 * i + 0] = (u_buffer[32 * i + 28 + 0] - 128) / 128
      rotations[4 * i + 1] = (u_buffer[32 * i + 28 + 1] - 128) / 128
      rotations[4 * i + 2] = (u_buffer[32 * i + 28 + 2] - 128) / 128
      rotations[4 * i + 3] = (u_buffer[32 * i + 28 + 3] - 128) / 128

      colors[4 * i + 0] = u_buffer[32 * i + 24 + 0]
      colors[4 * i + 1] = u_buffer[32 * i + 24 + 1]
      colors[4 * i + 2] = u_buffer[32 * i + 24 + 2]
      colors[4 * i + 3] = u_buffer[32 * i + 24 + 3]
    }

    return { vertexCount, positions, scales, rotations, colors }
  }

  /**
   *
   * @param buffer
   * @param vertexCount
   * @returns {Splat}
   */
  setDataFromBuffer(buffer) {
    const { vertexCount, positions, scales, rotations, colors } =
      this._parse(buffer)
    this._vertexCount = vertexCount
    this._positions = positions
    this._scales = scales
    this._rotations = rotations
    this._colors = colors
    return this
  }

  /**
   *
   * @param buffer
   * @param vertexCount
   * @returns {Splat}
   */
  appendDataFromBuffer(buffer) {
    const appendTypedArray = (typedArray, src, dest) => {
      let new_typedArray = new typedArray(src.length + dest.length)
      new_typedArray.set(src)
      new_typedArray.set(dest, src.length)
      return new_typedArray
    }
    const { vertexCount, positions, scales, rotations, colors } =
      this._parse(buffer)
    this._vertexCount += vertexCount
    this._positions = appendTypedArray(Float32Array, this._positions, positions)
    this._scales = appendTypedArray(Float32Array, this._scales, scales)
    this._rotations = appendTypedArray(Float32Array, this._rotations, rotations)
    this._colors = appendTypedArray(Uint8Array, this._colors, colors)
    return this
  }

  /**
   *
   * @param attribute
   * @returns {Splat}
   */
  setDataFromAttribute(attribute) {
    return this
  }
}

export default Splat
