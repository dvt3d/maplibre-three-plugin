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
await webpTaskProcessor.init()
await sogTaskProcessor.init()

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

        // means: two textures means_l and means_u
        const {
          rgba: positions_l,
          width,
          height,
        } = await webpTaskProcessor.call(
          'webp_decode_rgba',
          files[meta.means.files[0]]
        )
        const { rgba: positions_h } = await webpTaskProcessor.call(
          'webp_decode_rgba',
          files[meta.means.files[1]]
        )
        if (width * height < count) {
          throw new Error('SOG means texture too small for count')
        }
        // quats
        const {
          rgba: quats,
          width: qw,
          height: qh,
        } = await webpTaskProcessor.call(
          'webp_decode_rgba',
          files[meta.quats.files[0]]
        )
        if (qw * qh < count) {
          throw new Error('SOG quats texture too small for count')
        }
        // scales: labels + codebook
        const {
          rgba: scales,
          width: sw,
          height: sh,
        } = await webpTaskProcessor.call(
          'webp_decode_rgba',
          files[meta.scales.files[0]]
        )
        if (sw * sh < count) {
          throw new Error('SOG scales texture too small for count')
        }
        // colors + opacity: sh0.webp encodes 3 labels + opacity byte
        const {
          rgba: colors,
          width: cw,
          height: ch,
        } = await webpTaskProcessor.call(
          'webp_decode_rgba',
          files[meta.sh0.files[0]]
        )
        if (cw * ch < count) {
          throw new Error('SOG sh0 texture too small for count')
        }
        const outBuffer = await sogTaskProcessor.call(
          'sog_to_splat',
          metaStr,
          positions_l,
          positions_h,
          quats,
          scales,
          colors
        )
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
