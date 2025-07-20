/**
 * @author Caven Chen
 */

import { Group, Points, Float32BufferAttribute } from 'three'
import Overlay from '../Overlay.js'
import { Creator, SceneTransform } from '@dvt3d/maplibre-three-plugin'
import { Util } from '../../utils'

class Point extends Overlay {
  constructor(position) {
    super()
    this._position = position
    this._delegate = new Group()
    this._delegate.name = 'point-root'
    this._rtcGroup = Creator.createRTCGroup(
      SceneTransform.vector3ToLngLat(this._position)
    )
    this._points = new Points()
    this._points.geometry.setAttribute(
      'position',
      new Float32BufferAttribute([0, 0, 0], 3)
    )
    this._points.geometry.needsUpdate = true
    this._rtcGroup.add(this._points)
    this._delegate.add(this._rtcGroup)
  }

  /**
   *
   * @param style
   * @returns {Point}
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

export default Point
