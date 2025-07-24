import Overlay from '../Overlay.js'

class Polyline extends Overlay {
  constructor(positions) {
    if (!positions || !positions.length) {
      throw 'positions length must be greater than 1'
    }
    super()
    this._positions = positions
  }
}

export default Polyline
