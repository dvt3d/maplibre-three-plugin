import createWasm from './webp-wasm.js'

let wasm

/**
 *
 * @returns {Promise<void>}
 */
export default async function init() {
  wasm = await createWasm({
    locateFile: (path) => {
      if (path.endsWith('.wasm')) {
        return new URL(`./${path}`, import.meta.url).toString()
      }
      return path
    },
  })
}

/**
 *
 * @param rgba
 * @param width
 * @param height
 * @param stride
 * @returns {*}
 */
export function webp_encode_lossless_rgba(
  rgba,
  width,
  height,
  stride = width * 4
) {
  const inPtr = wasm._malloc(rgba.length)
  const outPtrPtr = wasm._malloc(4)
  const outSizePtr = wasm._malloc(4)
  wasm.HEAPU8.set(rgba, inPtr)
  const ok = wasm._webp_encode_lossless_rgba(
    inPtr,
    width,
    height,
    stride,
    outPtrPtr,
    outSizePtr
  )
  if (!ok) {
    throw new Error('WebP lossless encode failed')
  }
  const outPtr = wasm.HEAPU32[outPtrPtr >> 2]
  const outSize = wasm.HEAPU32[outSizePtr >> 2]
  const bytes = wasm.HEAPU8.slice(outPtr, outPtr + outSize)
  wasm._webp_free(outPtr)
  wasm._free(inPtr)
  wasm._free(outPtrPtr)
  wasm._free(outSizePtr)
  return Buffer.from(bytes)
}

/**
 *
 * @param webp
 * @returns {{rgba: *, width: *, height: *}}
 */
export function webp_decode_rgba(webp) {
  const input = webp
  const inPtr = wasm._malloc(input.length)
  const outPtrPtr = wasm._malloc(4)
  const widthPtr = wasm._malloc(4)
  const heightPtr = wasm._malloc(4)
  wasm.HEAPU8.set(input, inPtr)
  const ok = wasm._webp_decode_rgba(
    inPtr,
    input.length,
    outPtrPtr,
    widthPtr,
    heightPtr
  )
  if (!ok) {
    wasm._free(inPtr)
    wasm._free(outPtrPtr)
    wasm._free(widthPtr)
    wasm._free(heightPtr)
    throw new Error('WebP decode failed')
  }
  const outPtr = wasm.HEAPU32[outPtrPtr >> 2]
  const width = wasm.HEAPU32[widthPtr >> 2]
  const height = wasm.HEAPU32[heightPtr >> 2]
  const size = width * height * 4
  const bytes = wasm.HEAPU8.slice(outPtr, outPtr + size)
  wasm._webp_free(outPtr)
  wasm._free(inPtr)
  wasm._free(outPtrPtr)
  wasm._free(widthPtr)
  wasm._free(heightPtr)

  return { rgba: bytes, width, height }
}
