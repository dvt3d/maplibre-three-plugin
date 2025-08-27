class WorkerPool {
  constructor(size = 4, workerType = 'module') {
    this.size = Math.max(1, size | 0)
    this.workerType = workerType
    this._taskId = 0
    this._queue = []
    this._idle = []
    this._pending = new Map()
    this._blobURL = this._createWorkerBlobURL()
    this._workers = Array.from({ length: this.size }, () => this._spawn())
  }

  /**
   *
   * @param payload
   * @param transfer
   * @param timeout
   * @returns {Promise<unknown>}
   * @private
   */
  _enqueue(payload, { transfer = [], timeout } = {}) {
    const id = ++this._taskId
    return new Promise((resolve, reject) => {
      const task = {
        id,
        payload,
        transfer,
        resolve,
        reject,
        timeout,
        timer: null,
      }
      this._queue.push(task)
      this._pump()
    })
  }

  /**
   *
   * @private
   */
  _pump() {
    while (this._idle.length && this._queue.length) {
      const worker = this._idle.pop()
      const task = this._queue.shift()
      this._send(worker, task)
    }
  }

  /**
   *
   * @param worker
   * @param task
   * @private
   */
  _send(worker, task) {
    const { id, payload, transfer, timeout } = task

    const onMessage = (e) => {
      const msg = e.data
      if (!msg || msg.id !== id) return
      this._clearPending(id)
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)

      if (task.timer) clearTimeout(task.timer)

      if (msg.ok) {
        task.resolve(msg.result)
      } else {
        const err = new Error(msg.error?.message || 'Worker tasks failed')
        err.name = msg.error?.name || 'WorkerError'
        err.stack = msg.error?.stack || err.stack
        task.reject(err)
      }
      this._idle.push(worker)
      this._pump()
    }

    const onError = (err) => {
      this._clearPending(id)
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
      if (task.timer) clearTimeout(task.timer)
      this._respawn(worker)
      task.reject(err instanceof Error ? err : new Error(String(err)))
      this._pump()
    }

    this._pending.set(id, { worker, onMessage, onError })

    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)

    if (timeout && timeout > 0) {
      task.timer = setTimeout(() => {
        this._clearPending(id)
        worker.removeEventListener('message', onMessage)
        worker.removeEventListener('error', onError)
        this._respawn(worker)
        task.reject(new Error(`Worker task timeout after ${timeout}ms`))
        this._pump()
      }, timeout)
    }

    try {
      worker.postMessage({ id, ...payload }, transfer)
    } catch (e) {
      this._clearPending(id)
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
      this._idle.push(worker)
      task.reject(e)
      this._pump()
    }
  }

  /**
   *
   * @param id
   * @private
   */
  _clearPending(id) {
    this._pending.delete(id)
  }

  /**
   *
   * @returns {Worker}
   * @private
   */
  _spawn() {
    const worker = new Worker(this._blobURL, { type: this.workerType })
    this._idle.push(worker)
    return worker
  }

  /**
   *
   * @param badWorker
   * @private
   */
  _respawn(badWorker) {
    try {
      badWorker.terminate()
    } catch (e) {
      console.error(e)
    }
    const index = this._workers.indexOf(badWorker)
    if (index !== -1) this._workers.splice(index, 1)
    const new_worker = this._spawn()
    this._workers.push(new_worker)
  }

  /**
   *
   * @returns {string}
   * @private
   */
  _createWorkerBlobURL() {
    const workerScript = (self) => {
      const isArrayBuffer = (v) => v instanceof ArrayBuffer
      const isTyped = (v) =>
        v &&
        v.buffer instanceof ArrayBuffer &&
        typeof v.BYTES_PER_ELEMENT === 'number'
      const isMsgPort = (v) =>
        typeof MessagePort !== 'undefined' && v instanceof MessagePort
      const isOffscreen = (v) =>
        typeof OffscreenCanvas !== 'undefined' && v instanceof OffscreenCanvas
      const getTransferableObjects = (val, acc = new Set(), depth = 0) => {
        if (val == null || depth > 2) return acc
        if (isArrayBuffer(val)) {
          acc.add(val)
          return acc
        }
        if (isTyped(val)) {
          acc.add(val.buffer)
          return acc
        }
        if (isMsgPort(val) || isOffscreen(val)) {
          acc.add(val)
          return acc
        }
        if (Array.isArray(val)) {
          for (const x of val) getTransferableObjects(x, acc, depth + 1)
          return acc
        }
        if (typeof val === 'object') {
          for (const k in val) getTransferableObjects(val[k], acc, depth + 1)
        }
        return acc
      }

      self.onmessage = async (e) => {
        const { id, mode } = e.data || {}
        try {
          let args = e.data.args || []
          let fn
          if (mode === 'fn') {
            const { code } = e.data
            fn = (0, eval)('(' + code + ')')
            if (typeof fn !== 'function') {
              throw 'Provided code is not a function.'
            }
          } else if (mode === 'module') {
            const { url, exportName = 'default' } = e.data
            const mod = await import(url)
            fn = mod?.[exportName]
            if (typeof fn !== 'function') {
              throw `Export ${exportName} is not a function in module: ${url}`
            }
          } else {
            throw 'Unknown tasks mode: ' + mode
          }
          const result = await fn(...args)
          const transfers = Array.from(getTransferableObjects(result))
          self.postMessage({ id, ok: true, result }, transfers)
        } catch (error) {
          self.postMessage({
            id,
            ok: false,
            error: {
              name: error?.name || 'Error',
              message: error?.message || String(error),
              stack: error?.stack || '',
            },
          })
        }
      }
    }
    const blob = new Blob(['(', workerScript.toString(), ')(self)'], {
      type: 'application/javascript',
    })
    return URL.createObjectURL(blob)
  }

  /**
   *
   * @param fn
   * @param args
   * @param opts
   * @returns {Promise<unknown>}
   */
  run(fn, args = [], opts = {}) {
    const code = typeof fn === 'function' ? fn.toString() : String(fn)
    return this._enqueue({ mode: 'fn', code, args }, opts)
  }

  /**
   *
   * @param moduleURL
   * @param exportName
   * @param args
   * @param opts
   * @returns {Promise<unknown>}
   */
  runModule(moduleURL, exportName = 'default', args = [], opts = {}) {
    return this._enqueue(
      { mode: 'module', url: moduleURL, exportName, args },
      opts
    )
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async terminate() {
    this._queue.length = 0
    for (const w of this._workers) {
      try {
        w.terminate()
      } catch (e) {
        console.error(e)
      }
    }
    this._workers.length = 0
    if (this._blobURL) {
      URL.revokeObjectURL(this._blobURL)
      this._blobURL = null
    }
  }
}

export default WorkerPool
