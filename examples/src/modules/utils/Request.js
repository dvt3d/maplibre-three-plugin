/**
 *
 * @param url
 * @param onDone
 * @param onProcess
 * @param onError
 */
export function requestBuffer(url, onDone, onProcess = null, onError = null) {
  fetch(url)
    .then(async (res) => {
      const reader = res.body.getReader()
      const totalBytes = Number(res.headers.get('Content-Length') || 0)
      let received = 0
      const chunks = []
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        received += value.length
        totalBytes && onProcess?.(received / totalBytes)
      }
      const buffer = new Uint8Array(received)
      let offset = 0
      for (const c of chunks) {
        buffer.set(c, offset)
        offset += c.length
      }
      onDone && onDone(buffer)
    })
    .catch((e) => {
      onError && onError(e)
    })
}
