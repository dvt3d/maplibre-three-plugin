class Util {
  /**
   *
   * @param n
   * @param min
   * @param max
   * @returns {number}
   */
  static clamp(n, min, max) {
    return Math.min(max, Math.max(min, n))
  }

  /**
   *
   * @param fovy
   * @param aspect
   * @param near
   * @param far
   * @returns {number[]}
   */
  static makePerspectiveMatrix(fovy, aspect, near, far) {
    let f = 1.0 / Math.tan(fovy / 2)
    let nf = 1 / (near - far)
    return [
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (far + near) * nf,
      -1,
      0,
      0,
      2 * far * near * nf,
      0,
    ]
  }
}

export default Util
