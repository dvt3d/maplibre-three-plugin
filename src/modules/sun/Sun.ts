/**
 * Manages sun and hemisphere lighting in a 3D scene, providing positional updates based on geographic location and time.
 * Integrates with Three.js for lighting and SunCalc for astronomical calculations.
 */
import type { IFrameState } from '../scene/MapScene'
import { Color, DirectionalLight, Group, HemisphereLight } from 'three'
import SunCalc from '../utils/SunCalc'

/**
 * Configuration options for shadow rendering.
 */
interface ShadowOptions {
  /** Blur radius for shadow edges */
  radius: number
  /** Width and height of the shadow map */
  mapSize: [number, number]
  /** Top and right boundaries of the shadow camera frustum */
  topRight: number
  /** Bottom and left boundaries of the shadow camera frustum */
  bottomLeft: number
  /** Near clipping plane of the shadow camera */
  near: number
  /** Far clipping plane of the shadow camera */
  far: number
}

/**
 * Sun lighting management class
 */
class Sun {
  /**
   * Three.js Group containing the light sources
   */
  private readonly _delegate: Group

  /**
   * Directional light representing the sun
   */
  private readonly _sunLight: DirectionalLight

  /**
   * Hemisphere light for ambient sky lighting
   */
  private readonly _hemiLight: HemisphereLight

  /**
   * Current time used for sun position calculations
   */
  private _currentTime: null | number | string | Date

  /**
   * Creates a new Sun instance
   */
  constructor() {
    this._delegate = new Group()
    this._delegate.name = 'Sun'
    this._sunLight = new DirectionalLight(0xFFFFFF, 1)
    this._hemiLight = new HemisphereLight(
      new Color(0xFFFFFF),
      new Color(0xFFFFFF),
      0.6,
    )
    this._hemiLight.color.setHSL(0.661, 0.96, 0.12)
    this._hemiLight.groundColor.setHSL(0.11, 0.96, 0.14)
    this._hemiLight.position.set(0, 0, 50)
    this._delegate.add(this._sunLight)
    this._delegate.add(this._hemiLight)
    this._currentTime = null
  }

  /**
   * Gets the Three.js Group containing the light sources
   * @returns {Group} The light sources group
   */
  get delegate(): Group {
    return this._delegate
  }

  /**
   * Sets whether the sun light casts shadows
   * @param {boolean} castShadow - Shadow casting enabled state
   */
  set castShadow(castShadow: boolean) {
    this._sunLight.castShadow = castShadow
  }

  /**
   * Gets whether the sun light casts shadows
   * @returns {boolean} Shadow casting enabled state
   */
  get castShadow(): boolean {
    return this._sunLight.castShadow
  }

  /**
   * Sets the current time for sun position calculations
   * @param {null | number | string | Date} currentTime - Time for sun position calculation
   */
  set currentTime(currentTime: null | number | string | Date) {
    this._currentTime = currentTime
  }

  /**
   * Gets the current time used for sun position calculations
   * @returns {null | number | string | Date} Current time value
   */
  get currentTime(): null | number | string | Date {
    return this._currentTime
  }

  /**
   * Gets the directional sun light
   * @returns {DirectionalLight} The sun light instance
   */
  get sunLight(): DirectionalLight {
    return this._sunLight
  }

  /**
   * Gets the hemisphere ambient light
   * @returns {HemisphereLight} The hemisphere light instance
   */
  get hemiLight(): HemisphereLight {
    return this._hemiLight
  }

  /**
   * Configures shadow properties for the sun light
   * @param {Partial<ShadowOptions>} [shadow] - Shadow configuration options
   * @returns {Sun} The Sun instance for method chaining
   */
  setShadow(shadow: Partial<ShadowOptions> = {}): Sun {
    this._sunLight.shadow.radius = shadow.radius || 2
    this._sunLight.shadow.mapSize.width = shadow.mapSize
      ? shadow.mapSize[0]
      : 8192
    this._sunLight.shadow.mapSize.height = shadow.mapSize
      ? shadow.mapSize[1]
      : 8192
    this._sunLight.shadow.camera.top = this._sunLight.shadow.camera.right
      = shadow.topRight || 1000
    this._sunLight.shadow.camera.bottom = this._sunLight.shadow.camera.left
      = shadow.bottomLeft || -1000
    this._sunLight.shadow.camera.near = shadow.near || 1
    this._sunLight.shadow.camera.far = shadow.far || 1e8
    this._sunLight.shadow.camera.visible = true
    return this
  }

  /**
   * Updates sun position and intensity based on the current time and map center
   * @param {IFrameState} frameState - Current frame state containing map center information
   */
  update(frameState: IFrameState): void {
    const WORLD_SIZE = 512 * 2000
    const date = new Date(this._currentTime || new Date().getTime())
    const center = frameState.center
    const sunPosition = SunCalc.getPosition(date, center.lat, center.lng)
    const altitude = sunPosition.altitude
    const azimuth = Math.PI + sunPosition.azimuth
    const radius = WORLD_SIZE / 2
    const alt = Math.sin(altitude)
    const altRadius = Math.cos(altitude)
    const azCos = Math.cos(azimuth) * altRadius
    const azSin = Math.sin(azimuth) * altRadius
    this._sunLight.position.set(azSin, azCos, alt)
    this._sunLight.position.multiplyScalar(radius)
    this._sunLight.intensity = Math.max(alt, 0)
    this._hemiLight.intensity = Math.max(alt * 1, 0.1)
    this._sunLight.updateMatrixWorld()
  }
}

export default Sun
