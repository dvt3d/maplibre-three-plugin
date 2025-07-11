import * as THREE from 'three'
import { SunCalc } from '@dvt3d/maplibre-three-plugin'

class Sun {
  constructor() {
    this._root = new THREE.Group()
    this._root.name = 'Sun'
    this._sunLight = new THREE.DirectionalLight(0xffffff, 1)
    this._hemiLight = new THREE.HemisphereLight(
      new THREE.Color(0xffffff),
      new THREE.Color(0xffffff),
      0.6
    )
    this._hemiLight.color.setHSL(0.661, 0.96, 0.12)
    this._hemiLight.groundColor.setHSL(0.11, 0.96, 0.14)
    this._hemiLight.position.set(0, 0, 50)
    this._root.add(this._sunLight)
    this._root.add(this._hemiLight)
    this._currentTime = null
  }

  get root() {
    return this._root
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
  setShadow(shadow = {}) {
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
  update(frameState) {
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
