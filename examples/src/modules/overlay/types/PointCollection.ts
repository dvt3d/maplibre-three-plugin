/**
 * @author Caven Chen
 */

import type { BufferGeometry, Material, Object3DEventMap, Vector3 } from 'three'
import { Float32BufferAttribute, Group, Points } from 'three'
import { SceneTransform } from '../../../../../src'

import { PointMaterial } from '../../material'
import { Util } from '../../utils'
import Overlay from '../Overlay'

class PointCollection extends Overlay {
  private _positions: Array<Vector3>
  private readonly _object3d: Points<BufferGeometry, Material | Material[], Object3DEventMap>
  constructor(positions: Array<Vector3>) {
    if (!positions || !positions.length) {
      // eslint-disable-next-line no-throw-literal
      throw 'positions length must be greater than 0'
    }
    super()
    this._positions = positions
    this._delegate = new Group()

    this._delegate.name = 'point-collection-root'
    this._delegate.position.copy(this._positions[0])

    this._object3d = new Points()
    this._object3d.geometry.setAttribute(
      'position',
      new Float32BufferAttribute(
        this._positions
          .map(position => position.clone().sub(this._positions[0]).toArray())
          .flat(),
        3,
      ),
    )
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
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
      // eslint-disable-next-line no-throw-literal
      throw 'positions length must be greater than 0'
    }
    this._positions = positions
    this._delegate.position.copy(this._positions[0])
    this._object3d.geometry.setAttribute(
      'position',
      new Float32BufferAttribute(
        this._positions
          .map(position => position.clone().sub(this._positions[0]).toArray())
          .flat(),
        3,
      ),
    )
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
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
  setStyle(style: Record<string, any>) {
    Util.merge(this._style, style)
    if (this._object3d.material) {
      Util.merge(this._object3d.material, this._style)
      // eslint-disable-next-line ts/ban-ts-comment
      // @ts-expect-error
      this._object3d.material.needsUpdate = true
    }
    return this
  }
}

export default PointCollection
