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
   * @returns {number}
   */
  static projectedMercatorUnitsPerMeter(): number {
    return this.projectedUnitsPerMeter(0)
  }

  /**
   *
   * @param lat
   * @returns {number}
   */
  static projectedUnitsPerMeter(lat: number): number {
    return Math.abs(WORLD_SIZE / Math.cos(DEG2RAD * lat) / EARTH_CIRCUMFERENCE)
  }

  /**
   *
   * @param lng
   * @param lat
   * @param alt
   * @returns {Vector3}
   */
  static lngLatToVector3(
    lng: number | number[],
    lat?: number,
    alt?: number
  ): Vector3 {
    let v: number[] = [0, 0, 0]
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
          Math.log(Math.tan(Math.PI * 0.25 + 0.5 * DEG2RAD * (lat || 0))) *
          PROJECTION_WORLD_SIZE,
      ]
      if (!alt) {
        v.push(0)
      } else {
        v.push(alt * this.projectedUnitsPerMeter(lat || 0))
      }
    }
    return new Vector3(v[0], v[1], v[2])
  }

  /**
   *
   * @param v
   * @returns {number[]}
   */
  static vector3ToLngLat(v: { x: number; y: number; z: number }): number[] {
    let result = [0, 0, 0]
    if (v) {
      result[0] = -v.x / (EARTH_RADIUS * DEG2RAD * PROJECTION_WORLD_SIZE)
      result[1] =
        (2 *
          (Math.atan(Math.exp(v.y / (PROJECTION_WORLD_SIZE * -EARTH_RADIUS))) -
            Math.PI / 4)) /
        DEG2RAD
      result[2] = v.z / this.projectedUnitsPerMeter(result[1])
    }
    return result
  }
}

export default SceneTransform
