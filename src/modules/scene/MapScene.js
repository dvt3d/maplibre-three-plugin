import { Group, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three'
import CameraSync from '../camera/CameraSync.js'
import {
  DEG2RAD,
  EARTH_CIRCUMFERENCE,
  EARTH_RADIUS,
  PROJECTION_WORLD_SIZE,
  WORLD_SIZE,
} from '../constants'

const DEF_OPTS = {
  scene: null,
  camera: null,
  renderer: null,
  preserveDrawingBuffer: false,
  renderLoop: (renderer, scene, camera) => {
    renderer.resetState()
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
        preserveDrawingBuffer: this._options.preserveDrawingBuffer,
        canvas: this._canvas,
        context: this._canvas.getContext('webgl2'),
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
          this._cameraSync = new CameraSync(_this)
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
   * @param lat
   * @returns {number}
   */
  projectedUnitsPerMeter(lat) {
    return Math.abs(WORLD_SIZE / Math.cos(DEG2RAD * lat) / EARTH_CIRCUMFERENCE)
  }

  /**
   *
   * @param lng
   * @param lat
   * @param alt
   * @returns {Vector3}
   */
  lngLatToVector3(lng, lat, alt = 0) {
    let v = [0, 0, 0]
    if (Array.isArray(lng)) {
      v = [
        -EARTH_RADIUS * DEG2RAD * lng[0] * PROJECTION_WORLD_SIZE,
        -EARTH_RADIUS *
          Math.log(Math.tan(Math.PI * 0.25 + 0.5 * DEG2RAD * lng[1])) *
          PROJECTION_WORLD_SIZE,
      ]
      if (!lng[2]) {
        v.push(0)
      } else {
        v.push(lng[2] * this.projectedUnitsPerMeter(lng[1]))
      }
    } else {
      v = [
        -EARTH_RADIUS * DEG2RAD * lng * PROJECTION_WORLD_SIZE,
        -EARTH_RADIUS *
          Math.log(Math.tan(Math.PI * 0.25 + 0.5 * DEG2RAD * lat)) *
          PROJECTION_WORLD_SIZE,
      ]
      if (!alt) {
        v.push(0)
      } else {
        v.push(alt * this.projectedUnitsPerMeter(lat))
      }
    }
    return new Vector3(v[0], v[1], v[2])
  }

  /**
   *
   * @param v
   * @returns {{lng: number, alt: number, lat: number}}
   */
  vector3ToLngLat(v) {
    let result = { lng: 0, lat: 0, alt: 0 }
    if (v) {
      result.lng = -v.x / (EARTH_RADIUS * DEG2RAD * PROJECTION_WORLD_SIZE)
      result.lat =
        (2 *
          (Math.atan(Math.exp(v.y / (PROJECTION_WORLD_SIZE * -EARTH_RADIUS))) -
            Math.PI / 4)) /
        DEG2RAD
      result.alt = v.z / this.projectedUnitsPerMeter(result.lat)
    }
    return result
  }
}

export default MapScene
