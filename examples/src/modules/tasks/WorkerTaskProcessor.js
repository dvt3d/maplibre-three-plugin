export class WorkerTaskProcessor {
  constructor(workerUrl, { timeout = 0 } = {}) {
    this._worker = new Worker(workerUrl, { type: 'module' })
    this._seq = 0
    this._pending = new Map()
    this._timeout = timeout
    this._initPromise = null
    this._ready = false
    this._worker.onmessage = (e) => this._handleMessage(e)
    this._worker.onerror = (err) => this._handleError(err)
    this._worker.onmessageerror = (err) =>
      console.error('Worker message error:', err)
  }

  _handleMessage(e) {
    const { id, result, error } = e.data
    const pending = this._pending.get(id)
    if (!pending) return

    this._pending.delete(id)

    if (error) pending.reject(error)
    else pending.resolve(result)
  }

  /**
   *
   * @param err
   * @private
   */
  _handleError(err) {
    console.error('[WasmWorkerTaskProcessor] Worker error:', err)
    for (const [id, pending] of this._pending) {
      pending.reject('Worker crashed')
    }
    this._pending.clear()
  }

  /**
   *
   * @param args
   * @returns {*[]}
   * @private
   */
  _collectTransferables(args) {
    const out = []
    for (const a of args) {
      if (!a) continue
      if (ArrayBuffer.isView(a)) out.push(a.buffer)
      else if (a instanceof ArrayBuffer) out.push(a)
    }
    return out
  }

  /**
   *
   * @returns {Promise<*|null|boolean>}
   */
  async init() {
    if (this._ready) return true
    if (this._initPromise) return this._initPromise

    this._initPromise = new Promise((resolve, reject) => {
      const id = ++this._seq
      this._pending.set(id, { resolve, reject })

      // 发给 Worker 的初始化请求
      this._worker.postMessage({ id, fn: '__init_wasm__', args: [] })
    })

    const ok = await this._initPromise
    this._ready = true
    return ok
  }

  /**
   *
   * @param fn
   * @param args
   * @returns {Promise<unknown>}
   */
  call(fn, ...args) {
    return new Promise((resolve, reject) => {
      const id = ++this._seq
      this._pending.set(id, { resolve, reject })
      const transferables = this._collectTransferables(args)
      this._worker.postMessage({ id, fn, args }, transferables)
      if (this._timeout > 0) {
        setTimeout(() => {
          if (this._pending.has(id)) {
            this._pending.delete(id)
            reject(`Task "${fn}" timeout after ${this._timeout}ms`)
          }
        }, this._timeout)
      }
    })
  }

  /**
   *
   * @param id
   * @param reason
   */
  cancel(id, reason = 'canceled') {
    const pending = this._pending.get(id)
    if (pending) {
      pending.reject(reason)
      this._pending.delete(id)
    }

    return this
  }

  /**
   *
   * @returns {WorkerTaskProcessor}
   */
  dispose() {
    this._worker.terminate()
    this._pending.clear()

    return this
  }
}

export default WorkerTaskProcessor
