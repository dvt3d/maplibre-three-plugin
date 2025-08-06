/**
 * @author Caven Chen
 */

import { CSS3DSprite } from 'three/examples/jsm/Addons.js'
import { Util } from '../../utils/index.js'
import Overlay from '../Overlay.js'

class DivIcon extends Overlay {
  constructor(position, content) {
    if (!position) {
      throw 'position is required'
    }
    if (!content) {
      throw 'content is required'
    }
    super()
    this._position = position
    this._content = content
    this._wrapper = document.createElement('div')
    this._wrapper.className = 'div-icon'

    if (typeof content === 'string') {
      this._wrapper.innerHTML = content
    }
    else if (content instanceof Element) {
      while (this._wrapper.hasChildNodes()) {
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
   * @returns {DivIcon}
   */
  setStyle(style) {
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
