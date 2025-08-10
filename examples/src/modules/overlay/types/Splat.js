import Overlay from '../Overlay.js'
import { SplatMesh } from '../../extensions/index.js'

class Splat extends Overlay {
  constructor(options = {}) {
    super()
    this._delegate = new SplatMesh(options.data, options.numVertexes)
  }

  static async fromGltfAsync() {}

  static async fromSpzAsync() {}

  static async fromSplatAsync() {}
}

export default Splat
