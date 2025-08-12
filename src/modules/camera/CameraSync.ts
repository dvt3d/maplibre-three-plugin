/**
 * @Author: Caven Chen
 */
import { DEG2RAD, TILE_SIZE, WORLD_SIZE } from '../constants'
import Util from '../utils/Util'
import { type Group, Matrix4, type PerspectiveCamera, Vector3 } from 'three'
import type { IMap } from '../scene/MapScene'

const projectionMatrix = new Matrix4()
const cameraTranslateZ = new Matrix4()
const MAX_VALID_LATITUDE = 85.051129

class CameraSync {
  private _map: IMap
  private _world: Group
  private _camera: PerspectiveCamera
  private _translateCenter: Matrix4
  private readonly _worldSizeRatio: number

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
    this._map.on('move', () => {
      this.syncCamera(false)
    })
    this._map.on('resize', () => {
      this.syncCamera(true)
    })
  }

  /**
   *
   */
  syncCamera(updateProjectionMatrix: boolean) {
    const transform = this._map.transform

    const pitchInRadians = transform.pitch * DEG2RAD
    const bearingInRadians = transform.bearing * DEG2RAD

    if (updateProjectionMatrix) {
      const fovInRadians = transform.fov * DEG2RAD
      const centerOffset = transform.centerOffset || new Vector3()
      this._camera.aspect = transform.width / transform.height

      // set camera projection matrix
      // @ts-ignore
      projectionMatrix.elements = Util.makePerspectiveMatrix(
        fovInRadians,
        this._camera.aspect,
        transform.height / 50,
        transform.farZ
      )
      this._camera.projectionMatrix = projectionMatrix

      this._camera.projectionMatrix.elements[8] =
        (-centerOffset.x * 2) / transform.width
      this._camera.projectionMatrix.elements[9] =
        (centerOffset.y * 2) / transform.height
    }

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
    let x = transform.x
    let y = transform.y
    if (!x || !y) {
      const center = transform.center
      const lat = Util.clamp(
        center.lat,
        -MAX_VALID_LATITUDE,
        MAX_VALID_LATITUDE
      )
      x = Util.mercatorXFromLng(center.lng) * transform.worldSize
      y = Util.mercatorYFromLat(lat) * transform.worldSize
    }

    const translateMap = new Matrix4().makeTranslation(-x, y, 0)
    const rotateMap = new Matrix4().makeRotationZ(Math.PI)
    this._world.matrix = new Matrix4()
      .premultiply(rotateMap)
      .premultiply(this._translateCenter)
      .premultiply(scale)
      .premultiply(translateMap)
  }
}

export default CameraSync
