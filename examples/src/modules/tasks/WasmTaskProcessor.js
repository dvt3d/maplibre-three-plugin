class WasmTaskProcessor {
  /**
   * @param {string} options.moduleUrl  Glue JS URL (e.g., wasm_spalts.js ESM glue)
   * @param {string} [wasmUrl]  Optional: wasm file URL (if not provided, the glue resolves automatically)
   * @param {"auto"|"path"|"bytes"} [mode="auto"]
   *        - auto: Prefer string path; if cross-origin/MIME fails, automatically fall back to bytes
   *        - path: Always pass wasmUrl as a "path string" into init
   *        - bytes: Always fetch wasmUrl and pass ArrayBuffer into init
   */
  constructor(moduleUrl, wasmUrl, mode = 'auto') {
    if (!moduleUrl) throw new Error('moduleUrl is required')
    this._moduleUrl = moduleUrl
    this._wasmUrl = wasmUrl || null
    this._mode = mode
    this._glue = null // result of import(moduleUrl)
    this._init = null // default export of glue (init)
    this._ready = false
    this._initPromise = null
  }

  // get glue() {
  //   return this.glue
  // }

  async init() {
    if (this._ready) return
    if (this._initPromise) return this._initPromise
    this._initPromise = (async () => {
      const glue = await import(this._moduleUrl)
      const initFn = glue?.default || glue?.init || glue
      if (typeof initFn !== 'function') {
        throw new Error('Invalid wasm glue: default export init() not found')
      }
      this._glue = glue
      this._init = initFn
      if (!this._wasmUrl) {
        await this._init()
      } else if (this._mode === 'path') {
        await this._init(this._wasmUrl)
      } else if (this._mode === 'bytes') {
        const resp = await fetch(this._wasmUrl)
        if (!resp.ok) throw new Error(`Failed to fetch wasm: ${resp.status}`)
        const bytes = await resp.arrayBuffer()
        await this._init(bytes)
      } else {
        try {
          await this._init(this._wasmUrl)
        } catch (e) {
          const resp = await fetch(this._wasmUrl)
          if (!resp.ok) throw new Error(`Failed to fetch wasm: ${resp.status}`)
          const bytes = await resp.arrayBuffer()
          await this._init(bytes)
        }
      }
      this._ready = true
    })()
    return this._initPromise
  }

  /**
   * Call wasm exported function (direct call on main thread)
   * Note: most of your exports write directly into output TypedArray, return value is usually undefined
   */
  async call(fnName, ...args) {
    if (!fnName || typeof fnName !== 'string') {
      throw new Error('fnName must be a string')
    }
    if (!this._ready) {
      await this.init
    }
    const ns = this._glue
    if (!ns || typeof ns[fnName] !== 'function') {
      throw new Error(`Exported function "${fnName}" not found on wasm module`)
    }
    return ns[fnName](...args) ?? null
  }

  async getMemory() {
    if (!this._ready) {
      await this.init
    }
    return this._glue.memory
  }

  /**
   * Release references (optional)
   */
  dispose() {
    this._glue = null
    this._init = null
    this._ready = false
    this._initPromise = null
  }
}

export default WasmTaskProcessor
