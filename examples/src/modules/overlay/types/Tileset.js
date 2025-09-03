/**
 * @author Caven Chen
 */

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
import Overlay from '../Overlay.js'
import { Util } from '../../utils/index.js'
import {
  GaussianSplattingTilesetPlugin,
  GLTFGaussianSplattingExtension,
  GLTFKtx2TextureInspectorPlugin,
  GLTFSpzGaussianSplattingExtension,
} from '../../extensions/index.js'

const _box = new Box3()
const _sphere = new Sphere()

const DEF_OPTS = {
  fetchOptions: {
    mode: 'cors',
  },
  lruCache: {
    maxBytesSize: Infinity,
    minSize: 6000,
    maxSize: 8000,
  },
  cesiumIon: {
    assetId: '',
    apiToken: '',
    autoRefreshToken: true,
  },
  useDebug: false,
  useUnload: false,
  useFade: false,
  useUpdate: false,
  splatThreshold: -0.0001,
}

class Tileset extends Overlay {
  constructor(url, options = {}) {
    if (!url) {
      throw 'url is required'
    }
    super()
    this._url = url
    this._options = options
    this._renderer = new TilesRenderer(this._url)
    this._renderer.registerPlugin(
      new GLTFExtensionsPlugin({
        dracoLoader: options.dracoLoader,
        ktxLoader: options.ktxLoader,
        plugins: [
          (parser) => new GLTFGaussianSplattingExtension(parser),
          (parser) => new GLTFSpzGaussianSplattingExtension(parser),
          (parser) => new GLTFKtx2TextureInspectorPlugin(parser),
        ],
      })
    )

    if (options.ktxLoader) {
      this._renderer.manager.addHandler(/.ktx2/, options.ktxLoader)
    }

    this._renderer.registerPlugin(
      new GaussianSplattingTilesetPlugin(options.splatThreshold)
    )

    if (options.cesiumIon && options.cesiumIon.token) {
      this._renderer.registerPlugin(
        new CesiumIonAuthPlugin(
          Util.merge({}, DEF_OPTS.cesiumIon, {
            apiToken: options.cesiumIon.apiToken,
            assetId: this._url,
          })
        )
      )
    }

    options.useDebug && this._renderer.registerPlugin(new DebugTilesPlugin())

    options.useUnload && this._renderer.registerPlugin(new UnloadTilesPlugin())

    options.useUpdate &&
      this._renderer.registerPlugin(new UpdateOnChangePlugin())

    options.useFade && this._renderer.registerPlugin(new TilesFadePlugin())

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

    this._size = new Vector3()
    this._event = this._renderer

    this._type = 'Tileset'
    this.on('load-tile-set', this._onTilesLoaded.bind(this))
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

  get size() {
    return this._size
  }

  /**
   *
   * @param e
   * @private
   */
  _onTilesLoaded(e) {
    if (!this._isLoaded) {
      this._isLoaded = true
      const center = new Vector3()
      if (this._renderer.getBoundingBox(_box)) {
        _box.getCenter(center)
        _box.getSize(this._size)
      } else if (this._renderer.getBoundingSphere(_sphere)) {
        center.copy(_sphere.center)
        this._size.set(_sphere.radius, _sphere.radius, _sphere.radius)
      } else {
        return
      }

      const cartographic = { lon: 0, lat: 0, height: 0 }

      this._renderer.ellipsoid.getPositionToCartographic(center, cartographic)

      const positionDegrees = {
        lng: (cartographic.lon * 180) / Math.PI,
        lat: (cartographic.lat * 180) / Math.PI,
        height: cartographic.height,
      }

      this._position = SceneTransform.lngLatToVector3(
        positionDegrees.lng,
        positionDegrees.lat,
        positionDegrees.height
      )
      this._delegate.position.copy(this._position)

      const scale = SceneTransform.projectedUnitsPerMeter(positionDegrees.lat)

      this._delegate.scale.set(scale, scale, scale)

      if (
        !this._renderer.rootTileSet.asset.gltfUpAxis ||
        this._renderer.rootTileSet.asset.gltfUpAxis === 'Z'
      ) {
        this._delegate.rotateX(Math.PI)
      }

      this._delegate.rotateY(Math.PI)
      this._delegate.updateMatrixWorld()

      const enuMatrix = this._renderer.ellipsoid.getEastNorthUpFrame(
        cartographic.lat,
        cartographic.lon,
        cartographic.height,
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
    this._renderer.setCamera(frameState.camera)
    this._renderer.setResolutionFromRenderer(
      frameState.camera,
      frameState.renderer
    )
    this._renderer.update()
  }

  /**
   *
   * @param height
   * @returns {Tileset}
   */
  setHeight(height) {
    const positionDegrees = this.positionDegrees
    this._position = SceneTransform.lngLatToVector3(
      positionDegrees[0],
      positionDegrees[1],
      positionDegrees[2] + height
    )
    this._delegate.position.copy(this._position)
    return this
  }

  /**
   *
   * @param rotation
   * @returns {Tileset}
   */
  setRotation(rotation) {
    if (rotation[0]) {
      this._delegate.rotateX(rotation[0])
    }

    if (rotation[1]) {
      this._delegate.rotateY(rotation[1])
    }

    if (rotation[2]) {
      this._delegate.rotateZ(rotation[2])
    }

    return this
  }

  /**
   *
   * @returns {Tileset}
   */
  destroy() {
    this._renderer.dispose()
    this._renderer = null
    return this
  }
}

export default Tileset
