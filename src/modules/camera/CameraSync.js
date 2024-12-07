/**
 * @Author: Caven Chen
 */

class CameraSync {
  constructor(mapScene) {
    this._map = mapScene.map
    this._world = mapScene.world
    this._camera = mapScene.camera
    this._map
      .on('move', this.syncCamera.bind(this))
      .on('resize', this.syncCamera.bind(this))
  }

  syncCamera() {
    const transform = this._map.transform
    this._camera.aspect = transform.width / transform.height
    const fov = transform.fov
    const halfFov = transform.fov / 2
    const cameraToCenterDistance = transform.height / 2 / Math.tan(halfFov)
    let pixelsPerMeter = 1
    let mapWorldSize = transform.tileSize * transform.scale
  }
}

export default CameraSync
