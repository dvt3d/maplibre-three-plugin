/**
 * @author Caven Chen
 */

import { Points, Float32BufferAttribute } from 'three'
import Overlay from '../Overlay.js'
import { Creator, SceneTransform } from '@dvt3d/maplibre-three-plugin'
import { Util } from '../../utils'
import PointMaterial from '../../material/types/PointMaterial.js'

class PointCollection extends Overlay {
  constructor(positions) {
    super()
    this._positions = positions
    this._delegate = Creator.createRTCGroup(
      SceneTransform.vector3ToLngLat(this._positions[0]),
      [0, 0, 0]
    )
    this._delegate.name = 'point-collection-root'
    this._object3d = new Points()
    const local_positions = this._positions.map((position) =>
      position.clone().sub(this._positions[0]).toArray()
    )
    this._object3d.geometry.setAttribute(
      'position',
      new Float32BufferAttribute(local_positions.flat(), 3)
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
    this._positions = positions
    this._delegate.position.copy(this._positions[0])
    const local_positions = this._positions.map((position) =>
      position.clone().sub(this._positions[0]).toArray()
    )
    this._object3d.geometry.setAttribute(
      'position',
      new Float32BufferAttribute(local_positions.flat(), 3)
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
