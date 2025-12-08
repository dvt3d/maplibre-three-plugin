class SortScheduler {
  constructor(intervalTime = 1000, stableStopTime = 3000) {
    this._intervalTime = intervalTime // 两次排序最小间隔
    this._stableStopTime = stableStopTime // 稳定后继续允许排序的时间窗口
    this._isSorting = false
    this._dirty = true
    this._lastMvMatrix = null
    this._lastSortTime = 0
    this._stableSince = 0
  }

  set isSorting(v) {
    this._isSorting = v
  }
  get isSorting() {
    return this._isSorting
  }

  set dirty(v) {
    this._dirty = v
  }
  get dirty() {
    return this._dirty
  } // 修复递归 bug

  _isMatrixChanged(prev, curr) {
    if (!prev) return true
    return !prev.equals(curr)
  }

  tick(mvMatrix, triggerSort) {
    const now = performance.now()
    const changed = this._isMatrixChanged(this._lastMvMatrix, mvMatrix)
    if (changed) {
      this._stableSince = now
    } else if (this._stableSince === 0) {
      this._stableSince = now
    }
    const enoughInterval = now - this._lastSortTime >= this._intervalTime
    const withinStableWindow = now - this._stableSince < this._stableStopTime
    const shouldSort =
      !this._isSorting &&
      enoughInterval &&
      (this._dirty || changed || withinStableWindow)
    if (shouldSort) {
      this._isSorting = true
      this._dirty = false
      this._lastSortTime = now
      triggerSort()
    }
    this._lastMvMatrix = mvMatrix
    return this
  }
}

export default SortScheduler
