class SortScheduler {
  constructor(intervalTime = 1000, stableStopTime = 3000) {
    this._intervalTime = intervalTime
    this._stableStopTime = stableStopTime
    this._isSorting = false
    this._dirty = true
    this._lastMvMatrix = null
    this._stableSince = 0
    this._lastSortTime = 0
  }

  set isSorting(isSorting) {
    this._isSorting = isSorting
  }

  get isSorting() {
    return this._isSorting
  }

  set dirty(dirty) {
    this._dirty = dirty
  }

  get dirty() {
    return this.dirty
  }

  _isMatrixChanged(prev, curr) {
    const now = performance.now()
    if (!prev) return true
    return !prev.equals(curr)
  }

  tick(mvMatrix, fn) {
    const now = performance.now()
    const changed = this._isMatrixChanged(this._lastMvMatrix, mvMatrix)
    if (changed) {
      this._stableSince = now
    }
    const canTrigger =
      !this._isSorting &&
      now - this._lastSortTime >= this._intervalTime &&
      (this._dirty ||
        changed ||
        (this._stableSince > 0 &&
          now - this._stableSince < this._stableStopTime))

    if (canTrigger) {
      this._lastSortTime = now
      this._isSorting = true
      this._dirty = false
      fn()
    }
    this._lastMvMatrix = mvMatrix
    if (this._stableSince === 0) this._stableSince = now
    return this
  }
}

export default SortScheduler
