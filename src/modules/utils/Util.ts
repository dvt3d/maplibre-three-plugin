import { DEG2RAD, EARTH_CIRCUMFERENCE, TILE_SIZE } from '../constants'
import type { IMap } from '../scene/MapScene'

// MapLibre's default vertical field of view, for versions without getVerticalFieldOfView
const DEFAULT_FOV = 36.86989764584402

/**
 * The map's camera, read through MapLibre's public API
 */
export interface ICameraState {
  center: { lng: number; lat: number }
  zoom: number
  maxZoom: number
  pitch: number
  bearing: number
  /** Vertical field of view in degrees */
  fov: number
  width: number
  height: number
  /** Offset of the padded center from the canvas center, in pixels */
  centerOffset: { x: number; y: number }
  cameraToCenterDistance: number
  tileSize: number
  worldSize: number
  scale: number
  elevation: number
}

class Util {
  /**
   * Reads the camera through the map's public API.
   * @param map
   * @returns {ICameraState}
   */
  static getCameraState(map: IMap): ICameraState {
    const canvas = map.getCanvas()
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const fov = map.getVerticalFieldOfView?.() ?? DEFAULT_FOV
    const padding = map.getPadding()
    const zoom = map.getZoom()
    const scale = Math.pow(2, zoom)
    return {
      center: map.getCenter(),
      zoom,
      maxZoom: map.getMaxZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
      fov,
      width,
      height,
      centerOffset: {
        x: (padding.left - padding.right) / 2,
        y: (padding.top - padding.bottom) / 2,
      },
      cameraToCenterDistance: (0.5 / Math.tan((fov * DEG2RAD) / 2)) * height,
      tileSize: TILE_SIZE,
      worldSize: TILE_SIZE * scale,
      scale,
      elevation: map.getCenterElevation?.() ?? 0,
    }
  }

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
      maxZoom: number
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
      zoom: Math.min(zoom, transform.maxZoom),
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
