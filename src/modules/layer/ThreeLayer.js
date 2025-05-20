import CameraSync from '../camera/CameraSync.js'

class ThreeLayer {
  constructor(id, mapScene) {
    this._id = id
    this._mapScene = mapScene
    this._cameraSync = new CameraSync(
      this._mapScene.map,
      this._mapScene.world,
      this._mapScene.camera
    )
  }

  get id() {
    return this._id
  }

  get type() {
    return 'custom'
  }

  get renderingMode() {
    return '3d'
  }

  onAdd(map, gl) {
    this._cameraSync.syncCamera()
  }

  render() {
    this._mapScene.render()
  }
}

export default ThreeLayer
