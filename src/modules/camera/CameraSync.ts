/**
 * @Author: Caven Chen
 */
import { DEG2RAD, TILE_SIZE, WORLD_SIZE } from '../constants'
import Util from '../utils/Util'
import { type Group, Matrix4, type PerspectiveCamera } from 'three'
import type { IMap } from '../scene/MapScene'

const projectionMatrix = new Matrix4()
const cameraTranslateZ = new Matrix4()
const MAX_VALID_LATITUDE = 85.051129

class CameraSync {
  _map: IMap
  _world: Group
  _camera: PerspectiveCamera
  _translateCenter: Matrix4
  _worldSizeRatio: number
  _nearZ: number | undefined
  _farZ: number | undefined
  _onMapChange: () => void

  constructor(map: IMap, world: Group, camera: PerspectiveCamera) {
    this._map = map
    this._world = world
    this._camera = camera
    this._translateCenter = new Matrix4().makeTranslation(
      WORLD_SIZE / 2,
      -WORLD_SIZE / 2,
      0
    )
    this._worldSizeRatio = TILE_SIZE / WORLD_SIZE
    this._onMapChange = () => this.syncCamera()
    this._map.on('move', this._onMapChange)
    this._map.on('resize', this._onMapChange)
  }

  /**
   * @param frame The near and far planes of the frame MapLibre is drawing, from the custom layer's render call.
   * Between frames the last ones are kept.
   */
  syncCamera(frame?: { nearZ: number; farZ: number }): void {
    const transform = Util.getCameraState(this._map)
    const pitchInRadians = transform.pitch * DEG2RAD
    const bearingInRadians = transform.bearing * DEG2RAD

    const fovInRadians = transform.fov * DEG2RAD
    const centerOffset = transform.centerOffset
    this._camera.aspect = transform.width / transform.height

    if (frame) {
      this._nearZ = frame.nearZ
      this._farZ = frame.farZ
    }

    // set camera projection matrix
    // @ts-ignore
    projectionMatrix.elements = Util.makePerspectiveMatrix(
      fovInRadians,
      this._camera.aspect,
      this._nearZ ?? transform.height / 50,
      // before the first frame, a far plane well beyond the map center
      this._farZ ?? transform.cameraToCenterDistance * 100
    )
    this._camera.projectionMatrix = projectionMatrix

    this._camera.projectionMatrix.elements[8] =
      (-centerOffset.x * 2) / transform.width
    this._camera.projectionMatrix.elements[9] =
      (centerOffset.y * 2) / transform.height

    //set camera world Matrix
    cameraTranslateZ.makeTranslation(0, 0, transform.cameraToCenterDistance)

    const cameraWorldMatrix = new Matrix4()
      .premultiply(cameraTranslateZ)
      .premultiply(new Matrix4().makeRotationX(pitchInRadians))
      .premultiply(new Matrix4().makeRotationZ(-bearingInRadians))

    if (transform.elevation) {
      cameraWorldMatrix.elements[14] =
        transform.cameraToCenterDistance * Math.cos(pitchInRadians)
    }

    this._camera.matrixWorld.copy(cameraWorldMatrix)

    // Handle scaling and translation of objects in the map in the world's matrix transform, not the camera
    const zoomPow = transform.scale * this._worldSizeRatio
    const scale = new Matrix4().makeScale(zoomPow, zoomPow, zoomPow)
    const center = transform.center
    const lat = Util.clamp(center.lat, -MAX_VALID_LATITUDE, MAX_VALID_LATITUDE)
    const x = Util.mercatorXFromLng(center.lng) * transform.worldSize
    const y = Util.mercatorYFromLat(lat) * transform.worldSize

    const translateMap = new Matrix4().makeTranslation(-x, y, 0)
    const rotateMap = new Matrix4().makeRotationZ(Math.PI)
    this._world.matrix = new Matrix4()
      .premultiply(rotateMap)
      .premultiply(this._translateCenter)
      .premultiply(scale)
      .premultiply(translateMap)
  }

  dispose(): void {
    if (this._map) {
      this._map.off('move', this._onMapChange)
      this._map.off('resize', this._onMapChange)
    }
  }
}

export default CameraSync
