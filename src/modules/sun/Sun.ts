import { Group, DirectionalLight, HemisphereLight, Color } from 'three'
import SunCalc from '../utils/SunCalc'
import type { IFrameState } from '../scene/MapScene'

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
 *
 */
class Sun {
  private readonly _delegate: Group
  private readonly _sunLight: DirectionalLight
  private readonly _hemiLight: HemisphereLight
  private _currentTime: string | number | Date

  constructor() {
    this._delegate = new Group()
    this._delegate.name = 'Sun'
    this._sunLight = new DirectionalLight(0xffffff, 1)
    this._hemiLight = new HemisphereLight(
      new Color(0xffffff),
      new Color(0xffffff),
      0.6
    )
    this._hemiLight.color.setHSL(0.661, 0.96, 0.12)
    this._hemiLight.groundColor.setHSL(0.11, 0.96, 0.14)
    this._hemiLight.position.set(0, 0, 50)
    this._delegate.add(this._sunLight)
    this._delegate.add(this._hemiLight)
    this._currentTime = new Date().getTime()
  }

  get delegate() {
    return this._delegate
  }

  set castShadow(castShadow) {
    this._sunLight.castShadow = castShadow
  }

  get castShadow() {
    return this._sunLight.castShadow
  }

  set currentTime(currentTime) {
    this._currentTime = currentTime
  }

  get currentTime() {
    return this._currentTime
  }

  get sunLight() {
    return this._sunLight
  }

  get hemiLight() {
    return this._hemiLight
  }

  /**
   *
   * @param shadow
   * @returns {Sun}
   */
  setShadow(shadow: Partial<ShadowOptions> = {}): Sun {
    this._sunLight.shadow.radius = shadow.radius || 2
    this._sunLight.shadow.mapSize.width = shadow.mapSize
      ? shadow.mapSize[0]
      : 8192
    this._sunLight.shadow.mapSize.height = shadow.mapSize
      ? shadow.mapSize[1]
      : 8192
    this._sunLight.shadow.camera.top = this._sunLight.shadow.camera.right =
      shadow.topRight || 1000
    this._sunLight.shadow.camera.bottom = this._sunLight.shadow.camera.left =
      shadow.bottomLeft || -1000
    this._sunLight.shadow.camera.near = shadow.near || 1
    this._sunLight.shadow.camera.far = shadow.far || 1e8
    this._sunLight.shadow.camera.visible = true
    return this
  }

  /**
   *
   * @param frameState
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
