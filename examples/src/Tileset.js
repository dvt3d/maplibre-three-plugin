import { Group, Vector3, Matrix4, Box3, Sphere } from 'three'
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

const _box = new Box3()
const _sphere = new Sphere()

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
    this._renderer = new TilesRenderer(this._url)

    this._renderer.registerPlugin(
      new GLTFExtensionsPlugin({
        dracoLoader: options.dracoLoader,
        ktxLoader: options.ktxLoader,
      })
    )

    options.useDebug && this._renderer.registerPlugin(new DebugTilesPlugin())

    options.useUnload && this._renderer.registerPlugin(new UnloadTilesPlugin())

    options.useUpdate &&
      this._renderer.registerPlugin(new UpdateOnChangePlugin())

    options.useFade && this._renderer.registerPlugin(new TilesFadePlugin())

    if (options.ionAccessToken && options.ionAssetId) {
      this._renderer.registerPlugin(
        new CesiumIonAuthPlugin({
          apiToken: options.ionAccessToken,
          assetId: options.ionAssetId,
        })
      )
    }

    Util.merge(
      this._renderer.fetchOptions,
      DEF_OPTS.fetchOptions,
      this._options.fetchOptions || {}
    )

    Util.merge(
      this._renderer.lruCache,
      DEF_OPTS.lruCache,
      this._options.lruCache || {}
    )

    this._isLoaded = false
    this._delegate = new Group()
    this._delegate.name = 'tileset-root'
    this._center = new Vector3()
    this._size = new Vector3()
    this._centerCartographic = { lat: 0, lon: 0, height: 0 }
    this._centerDegrees = { lng: 0, lat: 0, height: 0 }
    this._renderer.addEventListener(
      'load-tile-set',
      this._onTilesLoaded.bind(this)
    )
  }

  get fetchOptions() {
    return this._renderer.fetchOptions
  }

  set lruCache(lruCache) {
    this._renderer.lruCache = lruCache
  }

  get lruCache() {
    return this._renderer.lruCache
  }

  set autoDisableRendererCulling(autoDisableRendererCulling) {
    this._renderer.autoDisableRendererCulling = autoDisableRendererCulling
  }

  get autoDisableRendererCulling() {
    return this._renderer.autoDisableRendererCulling
  }

  set errorTarget(errorTarget) {
    this._renderer.errorTarget = errorTarget
  }

  get errorTarget() {
    return this._renderer.errorTarget
  }

  get delegate() {
    return this._delegate
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
      if (this._renderer.getBoundingBox(_box)) {
        _box.getCenter(this._center)
        _box.getSize(this._size)
      } else if (this._renderer.getBoundingSphere(_sphere)) {
        this._center.copy(_sphere.center)
        this._size.set(_sphere.radius, _sphere.radius, _sphere.radius)
      } else {
        return
      }
      this._renderer.ellipsoid.getPositionToCartographic(
        this._center,
        this._centerCartographic
      )
      this._centerDegrees = {
        lng: (this._centerCartographic.lon * 180) / Math.PI,
        lat: (this._centerCartographic.lat * 180) / Math.PI,
        height: this._centerCartographic.height,
      }
      this._delegate.position.copy(
        SceneTransform.lngLatToVector3(
          this._centerDegrees.lng,
          this._centerDegrees.lat,
          this._centerDegrees.height
        )
      )
      const scale = SceneTransform.projectedUnitsPerMeter(
        this._centerDegrees.lat
      )
      this._delegate.scale.set(scale, scale, scale)
      this._delegate.rotateX(Math.PI)
      this._delegate.rotateY(Math.PI)
      this._delegate.updateMatrixWorld()

      const enuMatrix = this._renderer.ellipsoid.getEastNorthUpFrame(
        this._centerCartographic.lat,
        this._centerCartographic.lon,
        this._centerCartographic.height,
        new Matrix4()
      )
      const modelMatrix = enuMatrix.clone().invert()
      this._renderer.group.applyMatrix4(modelMatrix)
      this._renderer.group.updateMatrixWorld()
      this._delegate.add(this._renderer.group)
      this.fire('loaded')
    }
    this._renderer.removeEventListener(
      'load-tile-set',
      this._onTilesLoaded.bind(this)
    )
  }

  /**
   *
   * @param scene
   */
  update(frameState) {
    this._renderer.setCamera(frameState.scene.camera)
    this._renderer.setResolutionFromRenderer(
      frameState.scene.camera,
      frameState.scene.renderer
    )
    this._renderer.update()
  }

  /**
   *
   * @param type
   * @param callback
   * @returns {Tileset}
   */
  on(type, callback) {
    this._renderer.addEventListener(type, callback)
    return this
  }

  /**
   *
   * @param type
   * @param callback
   * @returns {Tileset}
   */
  off(type, callback) {
    this._renderer.removeEventListener(type, callback)
    return this
  }

  /**
   *
   * @param type
   * @param params
   * @returns {Tileset}
   */
  fire(type, params = {}) {
    this._renderer.dispatchEvent({
      type: type,
      params: params,
    })
    return this
  }
}

export default Tileset
