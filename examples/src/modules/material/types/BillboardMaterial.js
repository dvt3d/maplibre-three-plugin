/**
 * @author Caven Chen
 */
import { SpriteMaterial, TextureLoader } from 'three'

const _textureLoader = new TextureLoader()

class BillboardMaterial extends SpriteMaterial {
  constructor(options = {}) {
    super({
      depthWrite: !!options.depthWrite,
      depthTest: !!options.depthTest,
      transparent: true,
      map: _textureLoader.load(options.image),
    })
    this._image = options.image
  }

  set image(image) {
    this._image = image
    this.map = _textureLoader.load(image)
  }

  get image() {
    return this._image
  }
}
export default BillboardMaterial
