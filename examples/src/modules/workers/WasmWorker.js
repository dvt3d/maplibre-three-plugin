let wasmNS = null
let wasmReady = false

/** 重建参数：把 { buffer, length, type } 转回 TypedArray */
function reviveArgs(args) {
  return args.map((arg) => {
    if (
      arg &&
      arg.buffer instanceof ArrayBuffer &&
      typeof arg.length === 'number' &&
      typeof arg.type === 'string'
    ) {
      switch (arg.type) {
        case 'Float32Array':
          return new Float32Array(arg.buffer, 0, arg.length)
        case 'Uint32Array':
          return new Uint32Array(arg.buffer, 0, arg.length)
        case 'Int32Array':
          return new Int32Array(arg.buffer, 0, arg.length)
        case 'Uint8Array':
          return new Uint8Array(arg.buffer, 0, arg.length)
        case 'Int8Array':
          return new Int8Array(arg.buffer, 0, arg.length)
        case 'Uint16Array':
          return new Uint16Array(arg.buffer, 0, arg.length)
        case 'Int16Array':
          return new Int16Array(arg.buffer, 0, arg.length)
        case 'Float64Array':
          return new Float64Array(arg.buffer, 0, arg.length)
        default:
          throw new Error(`Unsupported TypedArray type: ${arg.type}`)
      }
    }
    return arg
  })
}

/** 规范化返回值：把 TypedArray 转成 { buffer, length, type } */
function normalizeResult(result) {
  if (ArrayBuffer.isView(result)) {
    return {
      buffer: result.buffer,
      length: result.length,
      type: result.constructor.name, // "Float32Array" / "Uint32Array" ...
    }
  }
  return result
}

self.onmessage = async (ev) => {
  const { id, parameters } = ev.data || {}
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

    // 重建参数
    const revived = reviveArgs(args)

    // 调用 wasm 导出函数
    const result = await wasmNS[call](...revived)

    // 规范化返回值
    const normalized = normalizeResult(result)

    // 如果是 TypedArray，则 transfer buffer
    if (normalized?.buffer instanceof ArrayBuffer) {
      postMessage({ id, result: normalized }, [normalized.buffer])
    } else {
      postMessage({ id, result: normalized })
    }
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
