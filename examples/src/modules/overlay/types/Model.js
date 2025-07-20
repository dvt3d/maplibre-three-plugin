/**
 * @author Caven Chen
 */
import { Group, Box3, Vector3 } from 'three'
import { ModelLoaderUtil } from '../../utils'
import { Creator, SceneTransform } from '@dvt3d/maplibre-three-plugin'
import Overlay from '../Overlay.js'

const _box = new Box3()
class Model extends Overlay {
  constructor(content, options) {
    super()
    this._content = content
    this._delegate = new Group()
    this._delegate.name = 'model-root'
    this._position = options.position
    this._rtcGroup = Creator.createRTCGroup(
      SceneTransform.vector3ToLngLat(this._position)
    )
    this._rtcGroup.add(this._content)
    this._delegate.add(this._rtcGroup)
    this._size = new Vector3()
    _box.setFromObject(this._content, true).getSize(this._size)
    this._castShadow = false
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
    let gltf = await ModelLoaderUtil.loadGLTF(options.url)
    let model = new Model(gltf.scene, options)
    model.castShadow = options.castShadow
    return model
  }

  /**
   *
   * @param options
   * @returns {Promise<void>}
   */
  static async fromB3DMAsync(options) {
    return
  }
}

export default Model
