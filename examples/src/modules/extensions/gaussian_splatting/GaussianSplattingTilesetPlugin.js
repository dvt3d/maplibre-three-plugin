import { Vector3 } from 'three'

const _center = new Vector3()

class GaussianSplattingTilesetPlugin {
  constructor(threshold) {
    this._threshold = threshold || -0.00001
    this.name = 'GAUSSIAN_SPLATTING_TILESET_PLUGIN'
    this.tiles = null
  }

  init(tiles) {
    this.tiles = tiles
    tiles.addEventListener('update-before', this._onUpdateBefore.bind(this))
    tiles.addEventListener('update-after', this._onUpdateAfter.bind(this))
    tiles.addEventListener('dispose-model', this._onDisposeModel.bind(this))
  }

  _onUpdateBefore() {}

  _onUpdateAfter() {
    const tiles = this.tiles
    let camera = tiles.cameras[0]
    if (camera) {
      const viewMatrix = camera.matrixWorldInverse
      tiles.forEachLoadedModel((scene) => {
        scene.traverse((child) => {
          if (child.isSplatMesh) {
            child.threshold = this._threshold
            child.computeBounds()
            _center.set(0, 0, 0)
            child.bounds.getCenter(_center)
            _center.applyMatrix4(child.matrixWorld)
            _center.applyMatrix4(viewMatrix)
            let depth = -_center.z
            child.renderOrder = 1e5 - depth
          }
        })
      })
    }
  }

  _onDisposeModel({ scene }) {
    scene.traverse((child) => {
      if (child.isSplatMesh) {
        child.dispose()
      }
    })
  }

  dispose() {
    const tiles = this.tiles
    tiles.removeEventListener('update-before', this._onUpdateBefore.bind(this))
    tiles.removeEventListener('update-after', this._onUpdateAfter.bind(this))
    tiles.removeEventListener('dispose-model', this._onDisposeModel.bind(this))
  }
}

export default GaussianSplattingTilesetPlugin
