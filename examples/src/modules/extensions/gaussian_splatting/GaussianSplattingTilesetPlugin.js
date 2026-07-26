import { SplatMesh } from '@sparkjsdev/spark'

class GaussianSplattingTilesetPlugin {
  constructor() {
    this.name = 'GAUSSIAN_SPLATTING_TILESET_PLUGIN'
    this.tiles = null
  }

  init(tiles) {
    this.tiles = tiles
    tiles.addEventListener('dispose-model', this._onDisposeModel.bind(this))
  }

  _onDisposeModel({ scene }) {
    scene.traverse((child) => {
      if (child instanceof SplatMesh) {
        child.dispose()
      }
    })
  }

  dispose() {
    const tiles = this.tiles
    tiles.removeEventListener('dispose-model', this._onDisposeModel.bind(this))
  }
}

export default GaussianSplattingTilesetPlugin
