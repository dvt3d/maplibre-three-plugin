/**
 * @author Caven Chen
 */

import type { Vector3 } from 'three'
import { CSS3DSprite } from 'three-stdlib'
import { Util } from '../../utils'
import Overlay from '../Overlay'

class DivIcon extends Overlay {
  private readonly _wrapper: HTMLElement
  constructor(position: Vector3, content: string | Element) {
    if (!position) {
      // eslint-disable-next-line no-throw-literal
      throw 'position is required'
    }
    if (!content) {
      // eslint-disable-next-line no-throw-literal
      throw 'content is required'
    }
    super()
    this._wrapper = document.createElement('div')
    this._wrapper.className = 'div-icon'

    if (typeof content === 'string') {
      this._wrapper.innerHTML = content
    }
    else if (content instanceof Element) {
      while (this._wrapper.hasChildNodes()) {
        if (this._wrapper.firstChild)
          this._wrapper.removeChild(this._wrapper.firstChild)
      }
      this._wrapper.appendChild(content)
    }
    this._delegate = new CSS3DSprite(this._wrapper)
    this._delegate.position.copy(position)
    this._type = 'DivIcon'
  }

  /**
   *
   * @param style
   * @returns {DivIcon} DivIcon
   */
  setStyle(style: Record<string, any>): DivIcon {
    if (!style || Object.keys(style).length === 0) {
      return this
    }
    Util.merge(this._style, style)
    if (style.className) {
      this._wrapper.className = 'div-icon'
      this._wrapper.classList.add(style.className)
    }
    return this
  }
}

export default DivIcon
