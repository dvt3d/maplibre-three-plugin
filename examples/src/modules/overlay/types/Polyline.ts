import type { Vector3 } from 'three'
import Overlay from '../Overlay'

class Polyline extends Overlay {
  constructor(positions: Vector3[]) {
    if (!positions || !positions.length) {
      // eslint-disable-next-line no-throw-literal
      throw 'positions length must be greater than 1'
    }
    super()
    this._positions = positions
  }
}

export default Polyline
