let wasmNS = null
let wasmReady = false

self.onmessage = async (ev) => {
  const { id, parameters, canTransferArrayBuffer } = ev.data || {}
  try {
    if (parameters && parameters.webAssemblyConfig) {
      const cfg = parameters.webAssemblyConfig
      const mod = await import(cfg.modulePath)
      if (cfg.wasmBinary) {
        await mod.default(cfg.wasmBinary)
      } else if (cfg.wasmBinaryFile) {
        await mod.default(cfg.wasmBinaryFile)
      } else {
        await mod.default()
      }
      wasmNS = mod
      wasmReady = true
      postMessage({ id, result: { ok: true } })
      return
    }
    if (!wasmReady) throw new Error('WASM module is not initialized yet.')
    const { call, args = [] } = parameters || {}
    if (!call || typeof call !== 'string') {
      throw new Error('parameters.call (function name) is required.')
    }
    if (!wasmNS || typeof wasmNS[call] !== 'function') {
      throw new Error(`Exported function "${call}" not found on wasm module.`)
    }
    const result = await wasmNS[call](...args)
    postMessage({ id, result })
  } catch (error) {
    postMessage({
      id,
      error: {
        name: error?.name || 'Error',
        message: error?.message || String(error),
        stack: error?.stack,
      },
    })
  }
}
