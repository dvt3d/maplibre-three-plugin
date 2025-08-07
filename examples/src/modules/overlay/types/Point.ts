/**
 * @author Caven Chen
 */

import type { BufferGeometry, Material, Object3DEventMap, Vector3 } from 'three'
import { Float32BufferAttribute, Group, Points } from 'three'
import { PointMaterial } from '../../material/index.js'
import { Util } from '../../utils/index.js'
import Overlay from '../Overlay.js'

class Point extends Overlay {
  private _object3d: Points<BufferGeometry, Material | Material[], Object3DEventMap>
  constructor(position: Vector3) {
    super()
    this._position = position
    this._delegate = new Group()
    this._delegate.name = 'point-root'
    this._delegate.position.copy(position)

    this._object3d = new Points()
    this._object3d.geometry.setAttribute(
      'position',
      new Float32BufferAttribute([0, 0, 0], 3),
    )
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    this._object3d.geometry.needsUpdate = true
    this._object3d.material = new PointMaterial()

    this._delegate.add(this._object3d)
    this._type = 'Point'
  }

  /**
   *
   * @param style
   * @returns {Point}
   */
  setStyle(style: Record<string, any>) {
    Util.merge(this._style, style)
    if (this._object3d.material) {
      // todo: point undefined
      // eslint-disable-next-line ts/ban-ts-comment
      // @ts-expect-error
      Util.merge(this._points.material, this._style)
      // eslint-disable-next-line ts/ban-ts-comment
      // @ts-expect-error
      this._object3d.material.needsUpdate = true
    }
    return this
  }
}

export default Point
