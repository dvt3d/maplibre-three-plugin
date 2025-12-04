import { requestBuffer } from '../utils/index.js'
import { SplatMesh } from '../extensions/index.js'
import { unzipSync } from 'fflate'
import WasmTaskProcessor from '../tasks/WasmTaskProcessor.js'

const webpTaskProcessor = new WasmTaskProcessor(
  new URL('../../wasm/webp/wasm_webp.min.js', import.meta.url).href
)
const sogTaskProcessor = new WasmTaskProcessor(
  new URL('../../wasm/sog/wasm_sog.min.js', import.meta.url).href
)

await Promise.all([webpTaskProcessor.init(), sogTaskProcessor.init()])

class SogLoader {
  constructor() {}

  /**
   *
   * @param url
   * @param onDone
   * @returns {SogLoader}
   */
  loadData(url, onDone, onProcess = null) {
    requestBuffer(
      url,
      async (buffer) => {
        const files = unzipSync(buffer)

        const metaBytes = files['meta.json']
        const metaStr = new TextDecoder().decode(metaBytes)
        const meta = JSON.parse(metaStr)

        const count = meta.count

        const funcName = 'webp_decode_rgba'

        const sogData = await Promise.all([
          webpTaskProcessor.call(funcName, files[meta.means.files[0]]),
          webpTaskProcessor.call(funcName, files[meta.means.files[1]]),
          webpTaskProcessor.call(funcName, files[meta.quats.files[0]]),
          webpTaskProcessor.call(funcName, files[meta.scales.files[0]]),
          webpTaskProcessor.call(funcName, files[meta.sh0.files[0]]),
        ])

        const outBuffer = new Uint8Array(count * 32)

        await sogTaskProcessor.call(
          'sog_to_splat',
          metaStr,
          sogData[0].rgba,
          sogData[1].rgba,
          sogData[2].rgba,
          sogData[3].rgba,
          sogData[4].rgba,
          outBuffer
        )

        console.log(outBuffer)
        onDone?.(outBuffer.buffer, count)
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
