import { Vector3 } from 'three'
import {
  DEG2RAD,
  EARTH_CIRCUMFERENCE,
  EARTH_RADIUS,
  PROJECTION_WORLD_SIZE,
  WORLD_SIZE,
} from '../constants'

class SceneTransform {
  /**
   *
   * @param lat
   * @returns {number}
   */
  static projectedUnitsPerMeter(lat) {
    return Math.abs(WORLD_SIZE / Math.cos(DEG2RAD * lat) / EARTH_CIRCUMFERENCE)
  }

  /**
   *
   * @param lng
   * @param lat
   * @param alt
   * @returns {Vector3}
   */
  static lngLatToVector3(lng, lat, alt = 0) {
    let v = [0, 0, 0]
    if (Array.isArray(lng)) {
      v = [
        -EARTH_RADIUS * DEG2RAD * lng[0] * PROJECTION_WORLD_SIZE,
        -EARTH_RADIUS *
          Math.log(Math.tan(Math.PI * 0.25 + 0.5 * DEG2RAD * lng[1])) *
          PROJECTION_WORLD_SIZE,
      ]
      if (!lng[2]) {
        v.push(0)
      } else {
        v.push(lng[2] * this.projectedUnitsPerMeter(lng[1]))
      }
    } else {
      v = [
        -EARTH_RADIUS * DEG2RAD * lng * PROJECTION_WORLD_SIZE,
        -EARTH_RADIUS *
          Math.log(Math.tan(Math.PI * 0.25 + 0.5 * DEG2RAD * lat)) *
          PROJECTION_WORLD_SIZE,
      ]
      if (!alt) {
        v.push(0)
      } else {
        v.push(alt * this.projectedUnitsPerMeter(lat))
      }
    }
    return new Vector3(v[0], v[1], v[2])
  }

  /**
   *
   * @param v
   * @returns {{lng: number, alt: number, lat: number}}
   */
  static vector3ToLngLat(v) {
    let result = { lng: 0, lat: 0, alt: 0 }
    if (v) {
      result.lng = -v.x / (EARTH_RADIUS * DEG2RAD * PROJECTION_WORLD_SIZE)
      result.lat =
        (2 *
          (Math.atan(Math.exp(v.y / (PROJECTION_WORLD_SIZE * -EARTH_RADIUS))) -
            Math.PI / 4)) /
        DEG2RAD
      result.alt = v.z / this.projectedUnitsPerMeter(result.lat)
    }
    return result
  }
}

export default SceneTransform
