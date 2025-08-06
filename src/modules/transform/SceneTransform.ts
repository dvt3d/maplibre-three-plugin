import { Vector3 } from 'three'
import {
  DEG2RAD,
  EARTH_CIRCUMFERENCE,
  EARTH_RADIUS,
  PROJECTION_WORLD_SIZE,
  WORLD_SIZE,
} from '../constants'

/**
 * Utility class for scene transformations, including coordinate conversions between
 * geographic coordinates (longitude, latitude, altitude) and Three.js Vector3.
 */
class SceneTransform {
  /**
   * Calculates the number of projected Mercator units per meter.
   * @returns {number} Projected Mercator units per meter
   */
  static projectedMercatorUnitsPerMeter(): number {
    return Math.abs(WORLD_SIZE / EARTH_CIRCUMFERENCE)
  }

  /**
   * Calculates the number of projected units per meter at a specific latitude.
   * @param {number} lat - Latitude in degrees
   * @returns {number} Projected units per meter at the given latitude
   */
  static projectedUnitsPerMeter(lat: number): number {
    return Math.abs(WORLD_SIZE / Math.cos(DEG2RAD * lat) / EARTH_CIRCUMFERENCE)
  }

  /**
   * Converts geographic coordinates (longitude, latitude, altitude) to a Three.js Vector3.
   * Can accept either individual parameters or an array of [lng, lat, alt].
   * @param {number|number[]} lng - Longitude in degrees or array of [lng, lat, alt]
   * @param {number} [lat] - Latitude in degrees (required if lng is not an array)
   * @param {number} [alt] - Altitude in meters (default: 0)
   * @returns {Vector3} Three.js Vector3 representing the converted coordinates
   */
  static lngLatToVector3(lng: number | number[], lat: number = 0, alt: number = 0): Vector3 {
    let v = [0, 0, 0]
    if (Array.isArray(lng)) {
      v = [
        -EARTH_RADIUS * DEG2RAD * lng[0] * PROJECTION_WORLD_SIZE,
        -EARTH_RADIUS
        * Math.log(Math.tan(Math.PI * 0.25 + 0.5 * DEG2RAD * lng[1]))
        * PROJECTION_WORLD_SIZE,
      ]
      if (!lng[2]) {
        v.push(0)
      }
      else {
        v.push(lng[2] * this.projectedUnitsPerMeter(lng[1]))
      }
    }
    else {
      v = [
        -EARTH_RADIUS * DEG2RAD * lng * PROJECTION_WORLD_SIZE,
        -EARTH_RADIUS
        * Math.log(Math.tan(Math.PI * 0.25 + 0.5 * DEG2RAD * lat))
        * PROJECTION_WORLD_SIZE,
      ]
      if (!alt) {
        v.push(0)
      }
      else {
        v.push(alt * this.projectedUnitsPerMeter(lat))
      }
    }
    return new Vector3(v[0], v[1], v[2])
  }

  /**
   * Converts a Three.js Vector3 to geographic coordinates (longitude, latitude, altitude).
   * @param {Vector3} v - Three.js Vector3 to convert
   * @returns {[number, number, number]} Array containing [longitude, latitude, altitude] in degrees and meters
   */
  static vector3ToLngLat(v: Vector3): [number, number, number] {
    const result: [number, number, number] = [0, 0, 0]
    if (v) {
      result[0] = -v.x / (EARTH_RADIUS * DEG2RAD * PROJECTION_WORLD_SIZE)
      result[1]
        = (2
          * (Math.atan(Math.exp(v.y / (PROJECTION_WORLD_SIZE * -EARTH_RADIUS)))
            - Math.PI / 4))
          / DEG2RAD
      result[2] = v.z / this.projectedUnitsPerMeter(result[1])
    }
    return result
  }
}

export default SceneTransform
