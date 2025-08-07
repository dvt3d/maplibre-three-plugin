import type { Group, Object3D } from 'three'
import { Creator, SceneTransform } from '@dvt3d/maplibre-three-plugin'
/**
 * @author Caven Chen
 */
import { Box3, Vector3 } from 'three'
import { ModelLoaderUtil } from '../../utils'
import Overlay from '../Overlay'

interface ModelOptions {
  url: string
  position: Vector3
  castShadow?: boolean
}

const _box = new Box3()
class Model extends Overlay {
  private readonly _content: Group
  private readonly _size: Vector3
  private _castShadow: boolean
  constructor(content: Group, options: ModelOptions) {
    super()
    this._content = content
    this._position = options.position
    this._delegate = Creator.createRTCGroup(
      SceneTransform.vector3ToLngLat(this._position),
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
    this._content.traverse((obj: Object3D) => {
      // eslint-disable-next-line ts/ban-ts-comment
      // @ts-expect-error
      if (obj.isMesh)
        obj.castShadow = this._castShadow
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
  static async fromGltfAsync(options: ModelOptions) {
    if (!options.url) {
      // eslint-disable-next-line no-throw-literal
      throw 'url is required'
    }
    if (!options.position) {
      // eslint-disable-next-line no-throw-literal
      throw 'position is required'
    }
    const gltf = await ModelLoaderUtil.loadGLTF(options.url)
    const model = new Model(gltf.scene, options)
    model.castShadow = !!options.castShadow
    return model
  }

  /**
   *
   * @returns {Promise<void>}
   * @param _options
   */
  static async fromB3dmAsync(_options: ModelOptions) {

  }
}

export default Model
