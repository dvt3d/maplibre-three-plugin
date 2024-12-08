/**
 * @Author: Caven Chen
 */
import { DEG2RAD, TILE_SIZE, WORLD_SIZE } from '../constants'
import Util from '../utils/Util.js'
import { Matrix4, Vector3 } from 'three'

class CameraSync {
  constructor(mapScene) {
    this._map = mapScene.map
    this._world = mapScene.world
    this._world.position.x = WORLD_SIZE / 2
    this._world.position.y = WORLD_SIZE / 2
    this._world.matrixAutoUpdate = false
    this._camera = mapScene.camera
    this._camera.matrixAutoUpdate = false
    this._translateCenter = new Matrix4().makeTranslation(
      WORLD_SIZE / 2,
      -WORLD_SIZE / 2,
      0
    )
    this._worldSizeRatio = TILE_SIZE / WORLD_SIZE
    this._map
      .on('move', this.syncCamera.bind(this))
      .on('resize', this.syncCamera.bind(this))
  }

  /**
   *
   */
  syncCamera() {
    const transform = this._map.transform
    this._camera.aspect = transform.width / transform.height
    const fov = transform.fov * DEG2RAD
    const centerOffset = transform.centerOffset || new Vector3()
    const pitchInRadians = transform.pitch * DEG2RAD

    // set camera projection matrix
    const projectionMatrix = new Matrix4()
    projectionMatrix.elements = Util.makePerspectiveMatrix(
      fov,
      this._camera.aspect,
      transform.height / 50,
      transform.farZ
    )
    this._camera.projectionMatrix = projectionMatrix

    this._camera.projectionMatrix.elements[8] =
      (-centerOffset.x * 2) / transform.width
    this._camera.projectionMatrix.elements[9] =
      (centerOffset.y * 2) / transform.height

    //set camera world Matrix
    const cameraTranslateZ = new Matrix4().makeTranslation(
      0,
      0,
      transform.cameraToCenterDistance
    )
    const cameraWorldMatrix = new Matrix4()
      .premultiply(cameraTranslateZ)
      .premultiply(new Matrix4().makeRotationX(pitchInRadians))
      .premultiply(new Matrix4().makeRotationZ(transform.bearing * DEG2RAD))

    // todo
    // if (transform.elevation) {
    //   cameraWorldMatrix.elements[14] = transform.cameraToCenterDistance / 2
    // }

    this._camera.matrixWorld.copy(cameraWorldMatrix)

    // Handle scaling and translation of objects in the map in the world's matrix transform, not the camera
    const zoomPow = transform.scale * this._worldSizeRatio
    const scale = new Matrix4().makeScale(zoomPow, zoomPow, zoomPow)

    let x = transform.x || transform.point.x
    let y = transform.y || transform.point.y
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
