/**
 * @author Caven Chen
 */
import { SpriteMaterial, TextureLoader } from 'three'

const _textureLoader = new TextureLoader()

interface BillboardMaterialOptions {
  image: string
  depthWrite?: boolean
  depthTest?: boolean
}

class BillboardMaterial extends SpriteMaterial {
  private _image: string
  constructor(options: BillboardMaterialOptions) {
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
