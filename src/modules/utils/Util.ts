import { DEG2RAD, EARTH_CIRCUMFERENCE } from '../constants'

class Util {
  /**
   *
   * @param n
   * @param min
   * @param max
   * @returns {number}
   */
  static clamp(n: number, min: number, max: number): number {
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
  static makePerspectiveMatrix(
    fovy: number,
    aspect: number,
    near: number,
    far: number
  ): number[] {
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

  /**
   *
   * @param lng
   * @returns {number}
   */
  static mercatorXFromLng(lng: number): number {
    return (180 + lng) / 360
  }

  /**
   *
   * @param lat
   * @returns {number}
   */
  static mercatorYFromLat(lat: number): number {
    return (
      (180 -
        (180 / Math.PI) *
          Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) /
      360
    )
  }

  /**
   *
   * @param transform
   * @param center
   * @param boundingSize
   * @returns {{center: (number|*)[], cameraHeight: number, zoom: number}}
   */
  static getViewInfo(
    transform: {
      fov: number
      pitch: number
      cameraToCenterDistance: number
      tileSize: number
    },
    center: string | number[],
    boundingSize: { x: number; y: number; z: number }
  ): { center: (number | any)[]; cameraHeight: number; zoom: number } {
    const fovInRadians = transform.fov * DEG2RAD
    const pitchInRadians = transform.pitch * DEG2RAD
    let _center: { lng: number; lat: number; alt: number } = null!
    if (Array.isArray(center)) {
      _center = { lng: center[0], lat: center[1], alt: center[2] || 0 }
    }

    if (typeof center === 'string') {
      let arr = center.split(',')
      _center = { lng: +arr[0], lat: +arr[1], alt: +arr[2] || 0 }
    }
    const distance =
      Math.max(boundingSize.x, boundingSize.y, boundingSize.z) /
      (2 * Math.tan(fovInRadians / 2))

    const cameraHeight = distance * Math.cos(pitchInRadians) + _center.alt
    const pixelAltitude = Math.abs(
      Math.cos(pitchInRadians) * transform.cameraToCenterDistance
    )
    const metersInWorldAtLat =
      EARTH_CIRCUMFERENCE * Math.abs(Math.cos(_center.lat * DEG2RAD))
    const worldSize = (pixelAltitude / cameraHeight) * metersInWorldAtLat
    const zoom = Math.round(Math.log2(worldSize / transform.tileSize))
    return {
      center: [_center.lng, _center.lat],
      cameraHeight,
      zoom,
    }
  }

  /**
   *
   * @param transform
   * @param zoom
   * @param lat
   * @param pitch
   * @returns {number}
   */
  static getHeightByZoom(
    transform: { cameraToCenterDistance: number; tileSize: number },
    zoom: number,
    lat: number,
    pitch: number
  ): number {
    const pixelAltitude = Math.abs(
      Math.cos(pitch * DEG2RAD) * transform.cameraToCenterDistance
    )
    const metersInWorldAtLat =
      EARTH_CIRCUMFERENCE * Math.abs(Math.cos(lat * DEG2RAD))
    const worldSize = Math.pow(2, zoom) * transform.tileSize
    return (pixelAltitude * metersInWorldAtLat) / worldSize
  }

  /**
   *
   * @param transform
   * @param height
   * @param lat
   * @param pitch
   * @returns {number}
   */
  static getZoomByHeight(
    transform: { cameraToCenterDistance: number; tileSize: number },
    height: number,
    lat: number,
    pitch: number
  ): number {
    const pixelAltitude = Math.abs(
      Math.cos(pitch * DEG2RAD) * transform.cameraToCenterDistance
    )
    const metersInWorldAtLat =
      EARTH_CIRCUMFERENCE * Math.abs(Math.cos(lat * DEG2RAD))
    const worldSize = (pixelAltitude / height) * metersInWorldAtLat
    return Math.round(Math.log2(worldSize / transform.tileSize))
  }
}

export default Util
