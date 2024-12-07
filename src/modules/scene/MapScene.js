import { Group, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three'
import CameraSync from '../camera/CameraSync.js'

const DEF_OPTS = {
  scene: null,
  camera: null,
  renderer: null,
  preserveDrawingBuffer: false,
  renderLoop: (renderer, scene, camera) => {
    renderer.render(scene, camera)
  },
}
class MapScene {
  constructor(map, options = {}) {
    if (!map) {
      throw 'miss map'
    }
    this._map = map
    this._options = {
      ...DEF_OPTS,
      ...options,
    }
    this._canvas = map.getCanvas()
    this._scene = this._options.scene || new Scene()
    this._camera =
      this._options.camera ||
      new PerspectiveCamera(
        this._map.transform.fov,
        this._map.transform.width / this._map.transform.height,
        0.1,
        1e21
      )
    this._renderer =
      this._options.renderer ||
      new WebGLRenderer({
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: options.preserveDrawingBuffer,
        canvas: this._canvas,
      })
    this._renderer.setPixelRatio(window.devicePixelRatio)
    this._renderer.setSize(this._canvas.clientWidth, this._canvas.clientHeight)
    this._renderer.autoClear = false
    this._world = new Group()
    this._world.name = 'world'
    this._scene.add(this._world)
    this._cameraSync = undefined
    this.map.on('style.load', this._onStyleLoad.bind(this))
  }

  get map() {
    return this._map
  }

  get canvas() {
    return this._canvas
  }

  get camera() {
    return this._camera
  }

  get scene() {
    return this._scene
  }

  get world() {
    return this._world
  }

  get renderer() {
    return this._renderer
  }

  /**
   *
   * @private
   */
  _onStyleLoad() {
    let _this = this
    this._map.addLayer({
      id: 'map_scene_layer',
      type: 'custom',
      renderingMode: '3d',
      onAdd: function (map, gl) {
        if (!_this._cameraSync) {
          this._cameraSync = new CameraSync(this)
          this._cameraSync.syncCamera()
        }
      },
      render: function (gl, matrix) {
        _this.render()
      },
    })
  }

  /**
   *
   * @returns {MapScene}
   */
  render() {
    this._options.renderLoop(this._renderer, this._scene, this._camera)
    return this
  }

  /**
   *
   * @param lng
   * @param lat
   * @param alt
   * @returns {Vector3}
   */
  lngLatToVector3(lng, lat, alt) {
    if (Array.isArray(lng)) {
      return new Vector3()
    } else {
      return new Vector3()
    }
  }

  /**
   *
   * @param v
   * @returns {{lng: number, alt: number, lat: number}}
   */
  vector3ToLngLat(v) {
    return { lng: 0, lat: 0, alt: 0 }
  }
}

export default MapScene
