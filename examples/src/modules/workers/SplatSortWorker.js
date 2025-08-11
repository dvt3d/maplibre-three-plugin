function splatSortWorker(self) {
  const sortSplats = function sortSplats(positions, view) {
    const vertexCount = positions.length / 4
    let threshold = -0.0001
    let maxDepth = -Infinity
    let minDepth = Infinity
    let depthList = new Float32Array(vertexCount)
    let sizeList = new Int32Array(depthList.buffer)
    let validIndexList = new Int32Array(vertexCount)
    let validCount = 0
    for (let i = 0; i < vertexCount; i++) {
      let depth =
        view[0] * positions[i * 4 + 0] +
        view[1] * positions[i * 4 + 1] +
        view[2] * positions[i * 4 + 2] +
        view[3]
      if (depth < 0 && positions[i * 4 + 3] > threshold * depth) {
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
    let positions = e.data.positions
    if (positions === undefined) {
      const sortedIndexes = new Uint32Array(1)
      self.postMessage({ sortedIndexes }, [sortedIndexes.buffer])
    } else {
      const view = new Float32Array(e.data.view)
      const sortedIndexes = sortSplats(positions, view)
      self.postMessage({ sortedIndexes }, [sortedIndexes.buffer])
    }
  }
}

export default splatSortWorker.toString()
