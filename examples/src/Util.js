class Util {
  /**

   * Merges the properties of the `src` object (or multiple objects) into `dest` object and returns the latter.
   * @param dest
   * @param sources
   * @returns {*}
   */
  static merge(dest, ...sources) {
    let i, j, len, src
    for (j = 0, len = sources.length; j < len; j++) {
      src = sources[j]
      for (i in src) {
        dest[i] = src[i]
      }
    }
    return dest
  }
}

export default Util
