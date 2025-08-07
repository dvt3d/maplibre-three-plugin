/**
 * @author Caven Chen
 */

import type { Vector3 } from 'three'
import { Group, Sprite } from 'three'
import { MaterialCache } from '../../material'
import { Util } from '../../utils'
import Overlay from '../Overlay'

class Billboard extends Overlay {
  private readonly _image: string
  private readonly _object3d: Sprite
  constructor(position: Vector3, image: string) {
    super()
    if (!position) {
      // eslint-disable-next-line no-throw-literal
      throw 'position is required'
    }
    if (!image) {
      // eslint-disable-next-line no-throw-literal
      throw 'image is required'
    }
    this._position = position
    this._image = image
    this._delegate = new Group()
    this._delegate.name = 'billboard-root'
    this._object3d = new Sprite(
      MaterialCache.createMaterial({
        type: 'billboard',
        image: this._image,
      }),
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
  setStyle(style: Record<string, any>) {
    if (!style || Object.keys(style).length === 0) {
      return this
    }
    Util.merge(this._style, style)
    if (this._object3d.material) {
      Util.merge(this._object3d.material, this._style)
      this._object3d.material.needsUpdate = true
    }
    return this
  }
}

export default Billboard
