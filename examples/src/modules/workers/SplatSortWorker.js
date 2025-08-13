function SplatSortWorker(self) {
  let matrices = undefined
  const sortSplats = function sortSplats(threshold, matrices, view) {
    const vertexCount = matrices.length / 4
    let maxDepth = -Infinity
    let minDepth = Infinity
    let depthList = new Float32Array(vertexCount)
    let sizeList = new Int32Array(depthList.buffer)
    let validIndexList = new Int32Array(vertexCount)
    let validCount = 0
    for (let i = 0; i < vertexCount; i++) {
      // Sign of depth is reversed
      let depth =
        view[0] * matrices[i * 4 + 0] +
        view[1] * matrices[i * 4 + 1] +
        view[2] * matrices[i * 4 + 2] +
        view[3]

      // Skip behind of camera and small, transparent splat
      if (depth < 0 && matrices[i * 4 + 3] > threshold * depth) {
        depthList[validCount] = depth
        validIndexList[validCount] = i
        validCount++
        if (depth > maxDepth) maxDepth = depth
        if (depth < minDepth) minDepth = depth
      }
    }

    let depthInv = (256 * 256 - 1) / (maxDepth - minDepth)
    let counts = new Uint32Array(256 * 256)
    for (let i = 0; i < validCount; i++) {
      sizeList[i] = ((depthList[i] - minDepth) * depthInv) | 0
      counts[sizeList[i]]++
    }
    let starts = new Uint32Array(256 * 256)
    for (let i = 1; i < 256 * 256; i++)
      starts[i] = starts[i - 1] + counts[i - 1]
    let depthIndex = new Uint32Array(validCount)
    for (let i = 0; i < validCount; i++)
      depthIndex[starts[sizeList[i]]++] = validIndexList[i]

    return depthIndex
  }
  self.onmessage = (e) => {
    if (e.data.method == 'clear') {
      matrices = undefined
    }
    if (e.data.method == 'push') {
      const new_matrices = new Float32Array(e.data.matrices)
      if (matrices === undefined) {
        matrices = new_matrices
      } else {
        let resized = new Float32Array(matrices.length + new_matrices.length)
        resized.set(matrices)
        resized.set(new_matrices, matrices.length)
        matrices = resized
      }
    }
    if (e.data.method == 'sort') {
      if (matrices === undefined) {
        const sortedIndexes = new Uint32Array(1)
        self.postMessage({ sortedIndexes }, [sortedIndexes.buffer])
      } else {
        const view = new Float32Array(e.data.view)
        const sortedIndexes = sortSplats(
          e.data.threshold || -0.000001,
          matrices,
          view
        )
        self.postMessage({ sortedIndexes }, [sortedIndexes.buffer])
      }
    }
  }
}

export default SplatSortWorker
