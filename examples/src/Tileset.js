import * as THREE from 'three'
import { TilesRenderer } from '3d-tiles-renderer'
import {
  GLTFExtensionsPlugin,
  UnloadTilesPlugin,
  DebugTilesPlugin,
  TilesFadePlugin,
  CesiumIonAuthPlugin,
  UpdateOnChangePlugin,
} from '3d-tiles-renderer/plugins'
import { SceneTransform } from '@dvt3d/maplibre-three-plugin'
import Util from './Util.js'

const _box = new THREE.Box3()
const _sphere = new THREE.Sphere()

const DEF_OPTS = {
  fetchOptions: {
    mode: 'cors',
  },
  lruCache: {
    maxBytesSize: Infinity,
    minSize: 0,
    maxSize: Infinity,
  },
  useDebug: false,
  useUnload: false,
  useFade: false,
  useUpdate: false,
  ionAccessToken: null,
  ionAssetId: null,
}
class Tileset {
  constructor(url, options = {}) {
    this._url = url
    this._options = options
    this._delegate = new TilesRenderer(this._url)

    this._delegate.registerPlugin(
      new GLTFExtensionsPlugin({
        dracoLoader: options.dracoLoader,
        ktxLoader: options.ktxLoader,
      })
    )

    options.useDebug && this._delegate.registerPlugin(new DebugTilesPlugin())

    options.useUnload && this._delegate.registerPlugin(new UnloadTilesPlugin())

    options.useUpdate &&
      this._delegate.registerPlugin(new UpdateOnChangePlugin())

    options.useFade && this._delegate.registerPlugin(new TilesFadePlugin())

    if (options.ionAccessToken && options.ionAssetId) {
      this._delegate.registerPlugin(
        new CesiumIonAuthPlugin({
          apiToken: options.ionAccessToken,
          assetId: options.ionAssetId,
        })
      )
    }

    Util.merge(
      this._delegate.fetchOptions,
      DEF_OPTS.fetchOptions,
      this._options.fetchOptions || {}
    )

    Util.merge(
      this._delegate.lruCache,
      DEF_OPTS.lruCache,
      this._options.lruCache || {}
    )

    this._isLoaded = false
    this._root = new THREE.Group()
    this._root.name = 'tileset-root'
    this._center = new THREE.Vector3()
    this._size = new THREE.Vector3()
    this._centerCartographic = { lat: 0, lon: 0, height: 0 }
    this._centerDegrees = { lng: 0, lat: 0, height: 0 }
    this._delegate.addEventListener(
      'load-tile-set',
      this._onTilesLoaded.bind(this)
    )
  }

  get fetchOptions() {
    return this._delegate.fetchOptions
  }

  set lruCache(lruCache) {
    this._delegate.lruCache = lruCache
  }

  get lruCache() {
    return this._delegate.lruCache
  }

  set autoDisableRendererCulling(autoDisableRendererCulling) {
    this._delegate.autoDisableRendererCulling = autoDisableRendererCulling
  }

  get autoDisableRendererCulling() {
    return this._delegate.autoDisableRendererCulling
  }

  set errorTarget(errorTarget) {
    this._delegate.errorTarget = errorTarget
  }

  get errorTarget() {
    return this._delegate.errorTarget
  }

  get root() {
    return this._root
  }

  get center() {
    return this._center
  }

  get size() {
    return this._size
  }

  get centerCartographic() {
    return this._centerCartographic
  }

  get centerDegrees() {
    return this._centerDegrees
  }

  /**
   *
   * @param e
   * @private
   */
  _onTilesLoaded(e) {
    if (!this._isLoaded) {
      this._isLoaded = true
      if (this._delegate.getBoundingBox(_box)) {
        _box.getCenter(this._center)
        _box.getSize(this._size)
      } else if (this._delegate.getBoundingSphere(_sphere)) {
        this._center.copy(_sphere.center)
        this._size.set(_sphere.radius, _sphere.radius, _sphere.radius)
      } else {
        return
      }
      this._delegate.ellipsoid.getPositionToCartographic(
        this._center,
        this._centerCartographic
      )
      this._centerDegrees = {
        lng: (this._centerCartographic.lon * 180) / Math.PI,
        lat: (this._centerCartographic.lat * 180) / Math.PI,
        height: this._centerCartographic.height,
      }
      this._root.position.copy(
        SceneTransform.lngLatToVector3(
          this._centerDegrees.lng,
          this._centerDegrees.lat,
          this._centerDegrees.height
        )
      )
      const scale = SceneTransform.projectedUnitsPerMeter(
        this._centerDegrees.lat
      )
      this._root.scale.set(scale, scale, scale)
      this._root.rotateX(Math.PI)
      this._root.rotateY(Math.PI)
      this._root.updateMatrixWorld()

      const enuMatrix = this._delegate.ellipsoid.getEastNorthUpFrame(
        this._centerCartographic.lat,
        this._centerCartographic.lon,
        this._centerCartographic.height,
        new THREE.Matrix4()
      )
      const modelMatrix = enuMatrix.clone().invert()
      this._delegate.group.applyMatrix4(modelMatrix)
      this._delegate.group.updateMatrixWorld()
      this._root.add(this._delegate.group)
      this.fire('loaded')
    }
    this._delegate.removeEventListener(
      'load-tile-set',
      this._onTilesLoaded.bind(this)
    )
  }
  /**
   *
   * @param scene
   */
  update(frameState) {
    this._delegate.setCamera(frameState.scene.camera)
    this._delegate.setResolutionFromRenderer(
      frameState.scene.camera,
      frameState.scene.renderer
    )
    this._delegate.update()
  }

  /**
   *
   * @param type
   * @param callback
   * @returns {Tileset}
   */
  on(type, callback) {
    this._delegate.addEventListener(type, callback)
    return this
  }

  /**
   *
   * @param type
   * @param callback
   * @returns {Tileset}
   */
  off(type, callback) {
    this._delegate.removeEventListener(type, callback)
    return this
  }

  /**
   *
   * @param type
   * @param params
   * @returns {Tileset}
   */
  fire(type, params = {}) {
    this._delegate.dispatchEvent({
      type: type,
      params: params,
    })
    return this
  }
}

export default Tileset
