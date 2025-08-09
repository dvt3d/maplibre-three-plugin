import CameraSync from '../camera/CameraSync'
import type {MapScene} from '../scene/MapScene'

class ThreeLayer {
  private readonly _id: string
  private _mapScene: MapScene | null
  private _cameraSync: CameraSync | null

  constructor(id:string, mapScene:MapScene) {
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

  onAdd() {
    this._cameraSync!.syncCamera(true)
  }

  render() {
    this._mapScene!.render()
  }

  onRemove() {
    this._cameraSync = null
    this._mapScene = null
  }
}

export default ThreeLayer
