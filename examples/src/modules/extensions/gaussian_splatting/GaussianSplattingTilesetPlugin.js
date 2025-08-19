import { Vector3 } from 'three'

class GaussianSplattingTilesetPlugin {
  constructor(threshold) {
    this._threshold = threshold || -0.00001
    this.name = 'GAUSSIAN_SPLATTING_TILESET_PLUGIN'
    this.tiles = null
  }

  init(tiles) {
    this.tiles = tiles
    this._onUpdateBefore = () => {
      this.onUpdateBefore()
    }
    this._onUpdateAfter = () => {
      this.onUpdateAfter()
    }
    tiles.addEventListener('update-before', this._onUpdateBefore)
    tiles.addEventListener('update-after', this._onUpdateAfter)
  }

  onUpdateBefore() {}

  onUpdateAfter() {
    const tiles = this.tiles
    let camera = tiles.cameras[0]
    if (camera) {
      const viewMatrix = camera.matrixWorldInverse
      tiles.forEachLoadedModel((scene) => {
        scene.traverse((child) => {
          if (child.isSplatMesh) {
            child.threshold = this._threshold
            const center = new Vector3()
            child.computeBounds()
            child.bounds.getCenter(center)
            center.applyMatrix4(child.matrixWorld)
            center.applyMatrix4(viewMatrix)
            let depth = -center.z
            child.renderOrder = 1e5 - depth
          }
        })
      })
    }
  }

  dispose() {
    const tiles = this.tiles
    tiles.removeEventListener('update-before', this._onUpdateBefore)
    tiles.removeEventListener('update-after', this._onUpdateAfter)
  }
}

export default GaussianSplattingTilesetPlugin
