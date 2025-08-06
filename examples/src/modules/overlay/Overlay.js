/**
 * @author Caven Chen
 */

import { SceneTransform } from '@dvt3d/maplibre-three-plugin'
import { EventDispatcher, Vector3 } from 'three'
import { Util } from '../utils/index.js'

class Overlay {
  constructor() {
    this._id = Util.uuid()
    this._delegate = undefined
    this._style = {}
    this._show = true
    this._position = new Vector3()
    this._event = new EventDispatcher()
    this._type = 'overlay'
  }

  get id() {
    return this._id
  }

  get type() {
    return this._type
  }

  get delegate() {
    return this._delegate
  }

  set show(show) {
    if (this._show === show) {
      return
    }
    this._show = show
    this._delegate.visible = show
  }

  get show() {
    return this._show
  }

  set position(position) {
    this._position = position
    this._delegate.position.copy(this._position)
  }

  get position() {
    return this._position
  }

  get positionDegrees() {
    return SceneTransform.vector3ToLngLat(this._position)
  }

  /**
   *
   * @returns {Overlay}
   */
  updateMatrixWorld() {
    this._delegate.updateMatrixWorld()
    return this
  }

  /**
   *
   * @param style
   * @returns {Overlay}
   */
  setStyle(style) {
    this._style = style
    return this
  }

  /**
   *
   * @param type
   * @param callback
   * @returns {Overlay}
   */
  on(type, callback) {
    this._event.addEventListener(type, callback)
    return this
  }

  /**
   *
   * @param type
   * @param callback
   * @returns {Overlay}
   */
  off(type, callback) {
    this._event.removeEventListener(type, callback)
    return this
  }

  /**
   *
   * @param type
   * @param params
   * @returns {Overlay}
   */
  fire(type, params = {}) {
    this._event.dispatchEvent({
      type,
      params,
    })
    return this
  }
}

export default Overlay
