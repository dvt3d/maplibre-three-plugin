import { requestBuffer } from '../utils/index.js'
import { parseSog } from '../../wasm/sog/sog-parse.js'
import { SplatMesh } from '../extensions/index.js'

const ROW_LENGTH = 3 * 4 + 3 * 4 + 4 + 4
const SH_C0 = 0.28209479177387814

class SogLoader {
  constructor() {}

  /**
   *
   * @param url
   * @param onDone
   * @returns {SogLoader}
   */
  loadData(url, onDone, onProcess) {
    requestBuffer(
      url,
      async (buffer) => {
        const { columns, count } = await parseSog(buffer) // DataTable
        const vertexCount = count
        const getColData = (name) =>
          columns.find((column) => column.name === name)?.data
        const x = getColData('x')
        const y = getColData('y')
        const z = getColData('z')
        const s0 = getColData('scale_0')
        const s1 = getColData('scale_1')
        const s2 = getColData('scale_2')
        const f_dc_0 = getColData('f_dc_0')
        const f_dc_1 = getColData('f_dc_1')
        const f_dc_2 = getColData('f_dc_2')
        const opacity = getColData('opacity')
        const r0 = getColData('rot_0')
        const r1 = getColData('rot_1')
        const r2 = getColData('rot_2')
        const r3 = getColData('rot_3')

        const outBuffer = new ArrayBuffer(ROW_LENGTH * vertexCount)
        const outF32 = new Float32Array(outBuffer)
        const outU8 = new Uint8ClampedArray(outBuffer)
        const hasScale = !!s0
        const hasColorSH = !!f_dc_0
        const hasOpacity = !!opacity
        for (let i = 0; i < vertexCount; i++) {
          const baseF32 = (i * ROW_LENGTH) >> 2
          const baseU8 = i * ROW_LENGTH
          outF32[baseF32 + 0] = x[i]
          outF32[baseF32 + 1] = y[i]
          outF32[baseF32 + 2] = z[i]

          if (hasScale) {
            const qx = r0[i]
            const qy = r1[i]
            const qz = r2[i]
            const qw = r3[i]
            const invLen =
              1 / Math.sqrt(qx * qx + qy * qy + qz * qz + qw * qw || 1)
            outU8[baseU8 + 28] = qx * invLen * 128 + 128
            outU8[baseU8 + 29] = qy * invLen * 128 + 128
            outU8[baseU8 + 30] = qz * invLen * 128 + 128
            outU8[baseU8 + 31] = qw * invLen * 128 + 128
            outF32[baseF32 + 3] = Math.exp(s0[i])
            outF32[baseF32 + 4] = Math.exp(s1[i])
            outF32[baseF32 + 5] = Math.exp(s2[i])
          } else {
            outF32[baseF32 + 3] =
              outF32[baseF32 + 4] =
              outF32[baseF32 + 5] =
                0.01
            outU8[baseU8 + 28] = 255
          }
          if (hasColorSH) {
            outU8[baseU8 + 24] = (0.5 + SH_C0 * f_dc_0[i]) * 255
            outU8[baseU8 + 25] = (0.5 + SH_C0 * f_dc_1[i]) * 255
            outU8[baseU8 + 26] = (0.5 + SH_C0 * f_dc_2[i]) * 255
          }
          if (hasOpacity) {
            const o = opacity[i]
            const alpha = 1 / (1 + Math.exp(-o))
            outU8[baseU8 + 27] = alpha * 255
          } else {
            outU8[baseU8 + 27] = 255
          }
        }
        onDone?.(outBuffer, vertexCount)
      },
      onProcess
    )
    return this
  }

  /**
   *
   * @param url
   * @param onDone
   * @param onProcess
   * @returns {SogLoader}
   */
  load(url, onDone, onProcess = null) {
    this.loadData(
      url,
      async (buffer, vertexCount) => {
        const mesh = new SplatMesh()
        mesh.vertexCount = vertexCount
        await mesh.setDataFromBuffer(buffer)
        onDone && onDone(mesh)
      },
      onProcess
    )
    return this
  }
}

export default SogLoader
