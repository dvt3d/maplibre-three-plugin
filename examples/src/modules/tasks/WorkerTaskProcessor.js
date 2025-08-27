function defined(v) {
  return v !== undefined && v !== null
}
function urlFromScript(script) {
  const blob = new Blob([script], { type: 'application/javascript' })
  const URL_ = self.URL || self.webkitURL
  return URL_.createObjectURL(blob)
}
function isCrossOriginUrl(url) {
  try {
    const u = new URL(url, self.location?.href ?? 'http://localhost/')
    return self.location && u.origin !== self.location.origin
  } catch {
    return false
  }
}
function createWorkerUrl(workerUrl) {
  if (isCrossOriginUrl(workerUrl)) {
    const shim = `import "${workerUrl}";`
    return urlFromScript(shim)
  }
  return workerUrl
}

let _canTransferArrayBuffer

function canTransferArrayBuffer() {
  if (defined(_canTransferArrayBuffer)) {
    return Promise.resolve(_canTransferArrayBuffer)
  }
  return new Promise((resolve) => {
    const code = `
      self.onmessage = ({data}) => {
        self.postMessage({ array: data.array }, [data.array.buffer]);
      };
    `
    const w = new Worker(urlFromScript(code))
    const value = 99
    const arr = new Int8Array([value])
    try {
      w.onmessage = (e) => {
        const ok = defined(e.data?.array) && e.data.array[0] === value
        _canTransferArrayBuffer = ok
        resolve(ok)
        w.terminate()
      }
      w.postMessage({ array: arr }, [arr.buffer])
    } catch {
      _canTransferArrayBuffer = false
      resolve(false)
      w.terminate()
    }
  })
}

class WorkerTaskProcessor {
  /**
   *
   * @param workerUrl
   * @param maximumActiveTasks
   */
  constructor(workerUrl, maximumActiveTasks = Number.POSITIVE_INFINITY) {
    this._workerUrl = workerUrl
    this._maximumActiveTasks = maximumActiveTasks
    this._activeTasks = 0
    this._nextID = 0
    this._worker = undefined
    this._webAssemblyPromise = undefined
  }

  _ensureWorker() {
    if (!defined(this._worker)) {
      const url = createWorkerUrl(this._workerUrl)
      this._worker = new Worker(url, { type: 'module' })
    }
    return this._worker
  }

  /**
   *
   * @param parameters
   * @param transferableObjects
   * @returns {Promise<unknown>}
   * @private
   */
  async _runTask(parameters, transferableObjects = []) {
    const canTransfer = await canTransferArrayBuffer()
    if (!canTransfer) transferableObjects = []

    const worker = this._ensureWorker()
    const id = this._nextID++

    const promise = new Promise((resolve, reject) => {
      const listener = (ev) => {
        const data = ev.data
        if (!data || data.id !== id) return
        worker.removeEventListener('message', listener)
        if (defined(data.error)) {
          const err = new Error(data.error.message || String(data.error))
          err.name = data.error.name || 'Error'
          err.stack = data.error.stack
          reject(err)
        } else {
          resolve(data.result)
        }
      }
      worker.addEventListener('message', listener)
    })
    worker.postMessage(
      {
        id,
        parameters,
        canTransferArrayBuffer: canTransfer,
      },
      transferableObjects
    )
    return promise
  }

  /**
   *
   * @param parameters
   * @param transferableObjects
   * @returns {Promise<*>}
   */
  async scheduleTask(parameters, transferableObjects) {
    if (this._activeTasks >= this._maximumActiveTasks) {
      return undefined
    }
    this._activeTasks++
    try {
      const result = await this._runTask(parameters, transferableObjects)
      this._activeTasks--
      return result
    } catch (err) {
      this._activeTasks--
      throw err
    }
  }

  /**
   *
   * @param webAssemblyOptions
   * @returns {Promise<*>}
   */
  async initWasm(webAssemblyOptions) {
    if (defined(this._webAssemblyPromise)) return this._webAssemblyPromise
    const init = async () => {
      this._ensureWorker()
      const canTransfer = await canTransferArrayBuffer()
      const transferable = []
      if (webAssemblyOptions.wasmBinary && canTransfer) {
        transferable.push(webAssemblyOptions.wasmBinary)
      }
      const result = await this._runTask(
        { webAssemblyConfig: webAssemblyOptions },
        transferable
      )
      return result
    }
    this._webAssemblyPromise = init()
    return this._webAssemblyPromise
  }

  /**
   *
   */
  destroy() {
    if (defined(this._worker)) {
      this._worker.terminate()
      this._worker = undefined
    }
  }
}

export default WorkerTaskProcessor
