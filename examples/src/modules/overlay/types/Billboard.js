/**
 * @author Caven Chen
 */

import { Group, Sprite } from 'three'
import Overlay from '../Overlay.js'
import { Util } from '../../utils'
import { MaterialCache } from '../../material'

class Billboard extends Overlay {
  constructor(position, image) {
    super()
    this._position = position
    this._image = image
    this._delegate = new Group()
    this._delegate.name = 'billboard-root'
    this._object3d = new Sprite(
      MaterialCache.createMaterial({
        type: 'billboard',
        image: this._image,
      })
    )
    this._object3d.position.copy(this._position)
    this._delegate.add(this._object3d)
    this._type = 'Billboard'
  }

  /**
   *
   * @param style
   * @returns {Billboard}
   */
  setStyle(style) {
    Util.merge(this._style, style)
    if (this._object3d.material) {
      Util.merge(this._object3d.material, this._style)
      this._object3d.material.needsUpdate = true
    }
    return this
  }
}

export default Billboard
