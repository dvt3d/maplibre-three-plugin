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
    this._points = new Points()
    const local_positions = this._positions.map((position) =>
      position.clone().sub(this._positions[0]).toArray()
    )
    this._points.geometry.setAttribute(
      'position',
      new Float32BufferAttribute(local_positions.flat(), 3)
    )
    this._points.geometry.needsUpdate = true
    this._points.material = new PointMaterial()
    this._delegate.add(this._points)
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
    this._points.geometry.setAttribute(
      'position',
      new Float32BufferAttribute(local_positions.flat(), 3)
    )
    this._points.geometry.needsUpdate = true
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
    if (this._points.material) {
      Util.merge(this._points.material, this._style)
      this._points.material.needsUpdate = true
    }
    return this
  }
}

export default PointCollection
