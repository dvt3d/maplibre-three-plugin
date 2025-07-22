/**
 * @author Caven Chen
 */

import { Group, Points, Float32BufferAttribute } from 'three'
import Overlay from '../Overlay.js'
import { SceneTransform } from '@dvt3d/maplibre-three-plugin'
import { Util } from '../../utils'
import PointMaterial from '../../material/types/PointMaterial.js'

class PointCollection extends Overlay {
  constructor(positions) {
    super()
    if (!positions || !positions.length) {
      throw 'positions length must be greater than 0'
    }
    this._positions = positions
    this._delegate = new Group()

    this._delegate.name = 'point-collection-root'
    this._delegate.position.copy(this._positions[0])

    this._object3d = new Points()
    this._object3d.geometry.setAttribute(
      'position',
      new Float32BufferAttribute(
        this._positions
          .map((position) => position.clone().sub(this._positions[0]).toArray())
          .flat(),
        3
      )
    )
    this._object3d.geometry.needsUpdate = true
    this._object3d.material = new PointMaterial()
    this._delegate.add(this._object3d)
    this._type = 'PointCollection'
  }

  /**
   *
   * @param positions
   */
  set positions(positions) {
    if (!positions || !positions.length) {
      throw 'positions length must be greater than 0'
    }
    this._positions = positions
    this._delegate.position.copy(this._positions[0])
    this._object3d.geometry.setAttribute(
      'position',
      new Float32BufferAttribute(
        this._positions
          .map((position) => position.clone().sub(this._positions[0]).toArray())
          .flat(),
        3
      )
    )
    this._object3d.geometry.needsUpdate = true
  }

  get positions() {
    return this._positions
  }

  get position() {
    return this._positions[0]
  }

  get positionDegrees() {
    return SceneTransform.vector3ToLngLat(this._positions[0])
  }

  /**
   *
   * @param style
   * @returns {PointCollection}
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

export default PointCollection
