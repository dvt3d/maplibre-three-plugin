const EARTH_RADIUS = 6371008.8
const EARTH_CIRCUMFERENCE = 2 * Math.PI * EARTH_RADIUS
const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI

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

  /**
   *
   * @param map
   * @param center
   * @param boundingSize
   * @returns {{center: (number|*)[], cameraHeight: number, zoom: number}}
   */
  static getViewPosition(transform, center, boundingSize) {
    const fovInRadians = transform.fov * DEG2RAD
    const pitchInRadians = transform.pitch * DEG2RAD

    const distance =
      Math.max(boundingSize.x, boundingSize.y, boundingSize.z) /
      (2 * Math.tan(fovInRadians / 2))

    const cameraHeight = distance * Math.cos(pitchInRadians)
    const pixelAltitude = Math.abs(
      Math.cos(pitchInRadians) * transform.cameraToCenterDistance
    )
    const metersInWorldAtLat =
      EARTH_CIRCUMFERENCE * Math.abs(Math.cos(center.lat * DEG2RAD))

    const worldSize = (pixelAltitude / cameraHeight) * metersInWorldAtLat
    const zoom = Math.round(Math.log(worldSize / transform.tileSize) / Math.LN2)

    return {
      center: [center.lng, center.lat],
      cameraHeight,
      zoom,
    }
  }
}

export default Util
