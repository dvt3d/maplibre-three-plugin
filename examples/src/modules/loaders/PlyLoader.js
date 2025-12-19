import { SplatMesh } from '../extensions/index.js'
import { requestBuffer } from '../utils/index.js'
import { WorkerTaskProcessor } from '../tasks/index.js'

const TYPE_MAP = {
  double: 'getFloat64',
  int: 'getInt32',
  uint: 'getUint32',
  float: 'getFloat32',
  short: 'getInt16',
  ushort: 'getUint16',
  uchar: 'getUint8',
}

// pos(3f) + scale(3f) + rgba(4u8) + quat(4u8)

const ROW_LENGTH = 3 * 4 + 3 * 4 + 4 + 4
const SH_C0 = 0.28209479177387814

const MAX_HEADER_SIZE = 256 * 1024

class PlyLoader {
  constructor() {}

  /**
   *
   * @param headerText
   * @param headerEnd
   * @returns {{vertexCount: number, rowStride: number, offsets: {}, types: {}}}
   * @private
   */
  _parseHeader(headerText, headerEnd) {
    const header = headerText.slice(0, headerEnd)
    const vertexMatch = header.match(/element vertex (\d+)/)
    if (!vertexMatch) {
      throw new Error('Invalid PLY: missing vertex count')
    }
    const vertexCount = Number(vertexMatch[1])
    let rowStride = 0
    const offsets = {}
    const types = {}
    for (const line of header.split('\n')) {
      if (!line.startsWith('property')) continue
      const [, type, name] = line.split(' ')
      const dvFunc = TYPE_MAP[type] || 'getInt8'
      const byteSize = Number(dvFunc.replace(/[^\d]/g, '')) >> 3
      offsets[name] = rowStride
      types[name] = dvFunc
      rowStride += byteSize
    }
    return { vertexCount, rowStride, offsets, types }
  }

  /**
   *
   * @param arrayBuffer
   * @param header
   * @returns {ArrayBuffer}
   * @private
   */
  _parserData(arrayBuffer, offset, vertexCount, header) {
    const { rowStride, offsets, types } = header
    const dataView = new DataView(arrayBuffer, offset, vertexCount * rowStride)
    const getAttr = (row, name) =>
      dataView[types[name]](row * rowStride + offsets[name], true)
    const outBuffer = new ArrayBuffer(ROW_LENGTH * vertexCount)
    const outF32 = new Float32Array(outBuffer)
    const outU8 = new Uint8ClampedArray(outBuffer)
    const hasScale = !!types['scale_0']
    const hasColorSH = !!types['f_dc_0']
    const hasOpacity = !!types.opacity

    for (let i = 0; i < vertexCount; i++) {
      const baseF32 = (i * ROW_LENGTH) >> 2
      const baseU8 = i * ROW_LENGTH
      outF32[baseF32 + 0] = getAttr(i, 'x')
      outF32[baseF32 + 1] = getAttr(i, 'y')
      outF32[baseF32 + 2] = getAttr(i, 'z')

      if (hasScale) {
        const q0 = getAttr(i, 'rot_0')
        const q1 = getAttr(i, 'rot_1')
        const q2 = getAttr(i, 'rot_2')
        const q3 = getAttr(i, 'rot_3')
        const invLen = 1 / Math.sqrt(q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3)

        outU8[baseU8 + 28] = q0 * invLen * 128 + 128
        outU8[baseU8 + 29] = q1 * invLen * 128 + 128
        outU8[baseU8 + 30] = q2 * invLen * 128 + 128
        outU8[baseU8 + 31] = q3 * invLen * 128 + 128

        outF32[baseF32 + 3] = Math.exp(getAttr(i, 'scale_0'))
        outF32[baseF32 + 4] = Math.exp(getAttr(i, 'scale_1'))
        outF32[baseF32 + 5] = Math.exp(getAttr(i, 'scale_2'))
      } else {
        outF32[baseF32 + 3] = outF32[baseF32 + 4] = outF32[baseF32 + 5] = 0.01
        outU8[baseU8 + 28] = 255
      }

      if (hasColorSH) {
        outU8[baseU8 + 24] = (0.5 + SH_C0 * getAttr(i, 'f_dc_0')) * 255
        outU8[baseU8 + 25] = (0.5 + SH_C0 * getAttr(i, 'f_dc_1')) * 255
        outU8[baseU8 + 26] = (0.5 + SH_C0 * getAttr(i, 'f_dc_2')) * 255
      } else {
        outU8[baseU8 + 24] = getAttr(i, 'red')
        outU8[baseU8 + 25] = getAttr(i, 'green')
        outU8[baseU8 + 26] = getAttr(i, 'blue')
      }
      outU8[baseU8 + 27] = hasOpacity
        ? (1 / (1 + Math.exp(-getAttr(i, 'opacity')))) * 255
        : 255
    }

    return outBuffer
  }

  /**
   *
   * @param url
   * @param onDone
   * @param onProcess
   * @returns {PlyLoader}
   */
  loadData(url, onDone, onProcess) {
    requestBuffer(
      url,
      (buffer) => {
        const text = new TextDecoder().decode(
          buffer.subarray(0, MAX_HEADER_SIZE)
        )
        const headerEnd = text.indexOf('end_header\n')
        if (headerEnd < 0) {
          throw new Error('Invalid PLY: header too large or missing end_header')
        }
        const header = this._parseHeader(text, headerEnd)
        const vertexCount = header.vertexCount
        const outBuffer = this._parserData(
          buffer.buffer,
          headerEnd + 11,
          vertexCount,
          header
        )
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
   * @param onPrecess
   * @returns {PlyLoader}
   */
  loadDataStream(url, onDone, onPrecess) {
    fetch(url).then(async (res) => {
      const reader = res.body.getReader()
      let headerBuffer = new Uint8Array(0)
      let headerParsed = false
      let header = null
      let leftover = new Uint8Array(0) // 存残余字节
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          const { value, done } = await reader.read()
          if (done) break
          let chunk = value
          // read the header
          if (!headerParsed) {
            const buffer = new Uint8Array(headerBuffer.length + chunk.length)
            buffer.set(headerBuffer, 0)
            buffer.set(chunk, headerBuffer.length)
            const text = new TextDecoder().decode(buffer)
            const headerEnd = text.indexOf('end_header\n')
            if (headerEnd === -1) {
              if (buffer.length > MAX_HEADER_SIZE) {
                throw new Error(
                  'Invalid PLY: header too large or missing end_header'
                )
              }
              headerBuffer = buffer
              continue
            }
            header = this._parseHeader(text, headerEnd)
            headerParsed = true
            const endMatch = text.slice(headerEnd).match(/^end_header\r?\n/)
            const headerSize = headerEnd + endMatch[0].length
            chunk = buffer.subarray(headerSize)
            onDone?.(header.vertexCount)
          }

          if (header) {
            // read the data
            const dataBuffer = new Uint8Array(leftover.length + chunk.length)
            dataBuffer.set(leftover, 0)
            dataBuffer.set(chunk, leftover.length)
            const { rowStride } = header
            const vertexCount = Math.floor(dataBuffer.length / rowStride)
            if (vertexCount) {
              const vertexData = dataBuffer.subarray(0, vertexCount * rowStride)
              const outBuffer = this._parserData(
                vertexData.buffer,
                vertexData.byteOffset,
                vertexCount,
                header
              )
              onPrecess && onPrecess(outBuffer, vertexCount)
            }
            leftover = dataBuffer.subarray(
              dataBuffer.length - (dataBuffer.length % rowStride)
            )
          }
        } catch (error) {
          console.error(error)
          break
        }
      }

      if (leftover.length && header) {
        const vertexCount = Math.floor(leftover.length / header.rowStride)
        if (vertexCount) {
          const outBuffer = this._parserData(
            leftover.buffer,
            leftover.byteOffset,
            vertexCount,
            header
          )
          onPrecess && onPrecess(outBuffer, vertexCount)
        }
      }
    })
    return this
  }

  /**
   *
   * @param url
   * @param onDone
   * @param onProcess
   * @returns {PlyLoader}
   */
  load(url, onDone, onProcess = null) {
    const worker = new WorkerTaskProcessor(
      new URL('../../wasm/splat/wasm_splat.worker.min.js', import.meta.url).href
    )
    this.loadData(
      url,
      async (buffer, vertexCount) => {
        await worker.init()
        const mesh = new SplatMesh()
        mesh.worker = worker
        mesh.vertexCount = vertexCount
        await mesh.setDataFromBuffer(buffer)
        onDone && onDone(mesh)
      },
      onProcess
    )
    return this
  }

  /**
   *
   * @param url
   * @param onDone
   * @returns {PlyLoader}
   */
  loadStream(url, onDone) {
    let mesh = null
    const worker = new WorkerTaskProcessor(
      new URL('../../wasm/splat/wasm_splat.worker.min.js', import.meta.url).href
    )
    this.loadDataStream(
      url,
      async (vertexCount) => {
        await worker.init()
        mesh = new SplatMesh()
        mesh.vertexCount = vertexCount
        onDone && onDone(mesh)
      },
      async (buffer, vertexCount) => {
        if (mesh) {
          await mesh.appendDataFromBuffer(buffer, vertexCount)
        }
      }
    )
    return this
  }
}

export default PlyLoader
