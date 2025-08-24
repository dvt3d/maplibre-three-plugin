import { SplatMesh } from '../extensions/index.js'

const rowLength = 3 * 4 + 3 * 4 + 4 + 4

class SplatLoader {
  constructor() {}

  /**
   *
   * @param url
   * @param onDone
   */
  loadData(url, onDone) {
    fetch(url).then(async (res) => {
      const reader = res.body.getReader()
      const chunks = []
      let receivedLength = 0
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        receivedLength += value.length
      }
      const buffer = new Uint8Array(receivedLength)
      let offset = 0
      for (const chunk of chunks) {
        buffer.set(chunk, offset)
        offset += chunk.length
      }
      const vertexCount = Math.floor(receivedLength / rowLength)
      onDone(buffer.buffer, vertexCount)
    })
  }

  /**
   *
   * @param url
   * @param onDone
   * @returns {SplatLoader}
   */
  loadDataStream(url, onDone, onPrecess) {
    fetch(url).then(async (res) => {
      const reader = res.body.getReader()
      const totalBytes = parseInt(res.headers.get('Content-Length') || 0)
      const vertexCount = Math.floor(totalBytes / rowLength)
      onDone && onDone(vertexCount)
      let leftover = new Uint8Array(0) // 存残余字节
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          const { value, done } = await reader.read()
          if (done) break
          // 存储上一次多余的字节和这一次读取到字节
          const buffer = new Uint8Array(leftover.length + value.length)
          buffer.set(leftover, 0)
          buffer.set(value, leftover.length)
          // 计算出合并的高斯数量
          const vertexCount = Math.floor(buffer.length / rowLength)
          if (vertexCount) {
            const vertexBytes = vertexCount * rowLength
            const vertexData = buffer.subarray(0, vertexBytes) // 保证处理的数据为 N * rowLength
            onPrecess && onPrecess(vertexData.buffer, vertexCount)
          }
          // 更新leftover，存储多出来的数字节，字节长度可能不足 rowLength，需要存储下来，用于下一次计算
          leftover = buffer.subarray(
            buffer.length - (buffer.length % rowLength)
          )
        } catch (error) {
          console.error(error)
          break
        }
      }
      if (leftover.length) {
        const vertexCount = Math.floor(leftover.length / rowLength)
        if (vertexCount) {
          onPrecess && onPrecess(leftover.buffer, vertexCount)
        }
      }
    })
    return this
  }

  /**
   *
   * @param url
   * @param onDone
   * @returns {SplatLoader}
   */
  load(url, onDone) {
    this.loadData(url, async (buffer, vertexCount) => {
      const mesh = new SplatMesh()
      mesh.vertexCount = vertexCount
      await mesh.setDataFromBuffer(buffer)
      onDone && onDone(mesh)
    })
    return this
  }

  /**
   *
   * @param url
   * @param onDone
   * @returns {SplatLoader}
   */
  loadStream(url, onDone) {
    let mesh = null
    this.loadDataStream(
      url,
      (vertexCount) => {
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

export default SplatLoader
