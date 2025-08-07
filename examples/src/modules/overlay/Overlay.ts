/**
 * @author Caven Chen
 */

import type { EventDispatcher, Object3D } from 'three'
import { Vector3 } from 'three'
import { SceneTransform } from '../../../../src'
import { Util } from '../utils'

class Overlay {
  private _id: string
  protected _delegate!: Object3D
  protected _style: Record<string, any>
  private _show: boolean
  protected _position: Vector3
  protected _event!: EventDispatcher
  protected _type: string
  constructor() {
    this._id = Util.uuid()
    this._style = {}
    this._show = true
    this._position = new Vector3()
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
   * @returns {Overlay} Overlay
   */
  updateMatrixWorld() {
    this._delegate.updateMatrixWorld()
    return this
  }

  /**
   *
   * @param style
   */
  setStyle(style: Record<string, any>): any {
    this._style = style
    return this
  }

  /**
   *
   * @param type
   * @param callback
   * @returns {Overlay} Overlay
   */
  on<T>(type: string, callback: (v: T) => void) {
    this._event.addEventListener(type as never, callback)
    return this
  }

  /**
   *
   * @param type
   * @param callback
   * @returns {Overlay} Overlay
   */
  off<T>(type: string, callback: (v: T) => void) {
    this._event.removeEventListener(type as never, callback)
    return this
  }

  /**
   *
   * @param type
   * @param params
   * @returns {Overlay} Overlay
   */
  fire(type: string, params: any = {}) {
    this._event.dispatchEvent({
      type,
      params,
    } as never)
    return this
  }
}

export default Overlay
