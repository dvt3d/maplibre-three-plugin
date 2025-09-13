class Parse {
  /**
   *
   * @param position
   */
  static parsePosition(position) {}

  /**
   *
   * @param position
   * @param filter
   */
  static parsePositions(positions, filter) {}

  /**
   *
   * @param positions
   * @returns {*[]}
   */
  static cleanPositions(positions) {
    let result = []
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i]
      if (!result.length) {
        result.push(p.clone())
        continue
      }
      const last = result[result.length - 1]
      if (last.distanceToSquared(p) > 1e-12) result.push(p.clone())
    }

    return result
  }
}

export default Parse
