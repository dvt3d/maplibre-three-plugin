import type { MapScene } from '../scene/MapScene'

class ThreeLayer {
  private readonly _id: string
  private _mapScene: MapScene | null

  constructor(id: string, mapScene: MapScene) {
    this._id = id
    this._mapScene = mapScene
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
    this._mapScene!.cameraSync.syncCamera()
  }

  render() {
    this._mapScene!.render()
  }

  onRemove() {
    this._mapScene = null
  }
}

export default ThreeLayer
