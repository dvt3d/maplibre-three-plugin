import { Group, Box3, Vector3 } from 'three'
import ModelLoaderUtil from './ModelLoaderUtil.js'
import { Creator } from '@dvt3d/maplibre-three-plugin'

const _box = new Box3()
class Model {
  constructor(model, center) {
    this._model = model
    this._centerDegrees = center
    this._delegate = new Group()
    this._delegate.name = 'model-root'
    this._rtcGroup = Creator.createRTCGroup(this._centerDegrees)
    this._rtcGroup.add(this._model)
    this._delegate.add(this._rtcGroup)
    this._size = new Vector3()
    _box.setFromObject(this._model, true).getSize(this._size)
    this._castShadow = false
  }

  get delegate() {
    return this._delegate
  }

  get centerDegrees() {
    return this._centerDegrees
  }

  get center() {
    return this._rtcGroup.position
  }

  get size() {
    return this._size
  }

  set castShadow(castShadow) {
    if (this._castShadow === castShadow) {
      return
    }
    this._castShadow = castShadow
    this._model.traverse((obj) => {
      if (obj.isMesh) obj.castShadow = this._castShadow
    })
  }

  get castShadow() {
    return this._castShadow
  }

  /**
   *
   * @param options
   * @returns {Promise<Model>}
   */
  static async fromGltfAsync(options = {}) {
    let gltf = await ModelLoaderUtil.loadGLTF(options.url)
    let model = new Model(gltf.scene, options.center)
    model.castShadow = !!options.castShadow
    return model
  }

  /**
   *
   * @param url
   * @param center
   * @returns {Promise<void>}
   */
  static async fromB3DMAsync(url, center) {}
}

export default Model
