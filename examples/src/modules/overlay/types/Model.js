/**
 * @author Caven Chen
 */
import { Box3, Vector3 } from 'three'
import { ModelLoader } from '../../loaders/index.js'
import { Creator, SceneTransform } from '@dvt3d/maplibre-three-plugin'
import Overlay from '../Overlay.js'

const _box = new Box3()
class Model extends Overlay {
  constructor(content, options) {
    super()
    this._content = content
    this._position = options.position
    this._delegate = Creator.createRTCGroup(
      SceneTransform.vector3ToLngLat(this._position)
    )
    this._delegate.name = 'model-root'
    this._delegate.add(this._content)
    this._size = new Vector3()
    _box.setFromObject(this._content, true).getSize(this._size)
    this._castShadow = false
    this._type = 'Model'
  }

  get size() {
    return this._size
  }

  set castShadow(castShadow) {
    if (this._castShadow === castShadow) {
      return
    }
    this._castShadow = castShadow
    this._content.traverse((obj) => {
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
    if (!options.url) {
      throw 'url is required'
    }
    if (!options.position) {
      throw 'position is required'
    }
    let gltf = await ModelLoader.loadGLTF(options.url)
    let model = new Model(gltf.scene, options)
    model.castShadow = options.castShadow
    return model
  }

  /**
   *
   * @param options
   * @returns {Promise<void>}
   */
  static async fromB3dmAsync(options) {
    return
  }
}

export default Model
