import {
  Group,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  EventDispatcher,
  Box3,
  Vector3,
} from 'three'
import ThreeLayer from '../layer/ThreeLayer'
import { WORLD_SIZE } from '../constants'
import Util from '../utils/Util.js'
import SceneTransform from '../transform/SceneTransform'

const DEF_OPTS = {
  scene: null,
  camera: null,
  renderer: null,
  renderLoop: null,
  preserveDrawingBuffer: false,
}

class MapScene {
  constructor(map, options = {}) {
    if (!map) {
      throw 'missing  map'
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
    this._camera.matrixAutoUpdate = false
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

    // init the lights container
    this._lights = new Group()
    this._lights.name = 'lights'
    this._scene.add(this._lights)

    // init the world container
    this._world = new Group()
    this._world.name = 'world'
    this._world.userData = {
      isWorld: true,
      name: 'world',
    }
    this._world.position.set(WORLD_SIZE / 2, WORLD_SIZE / 2, 0)
    this._world.matrixAutoUpdate = false
    this._scene.add(this._world)

    this._map.on('style.load', this._onStyleLoad.bind(this))

    this._event = new EventDispatcher()
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

  get lights() {
    return this._lights
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
    this._map.addLayer(new ThreeLayer('map_scene_layer', this))
  }

  /**
   *
   * @returns {MapScene}
   */
  render() {
    if (this._options.renderLoop) {
      this._options.renderLoop(this)
    } else {
      this._event.dispatchEvent({
        type: 'preRest',
      })
      this.renderer.resetState()
      this._event.dispatchEvent({
        type: 'postRest',
      })
      this._event.dispatchEvent({
        type: 'preRender',
      })
      this.renderer.render(this._scene, this._camera)
      this._event.dispatchEvent({
        type: 'postRender',
      })
    }
    return this
  }

  /**
   *
   * @param light
   * @returns {MapScene}
   */
  addLight(light) {
    this._lights.add(light.delegate || light)
    return this
  }

  /**
   *
   * @param light
   */
  removeLight(light) {
    this._lights.remove(light.delegate || light)
    return this
  }

  /**
   *
   * @param object
   * @returns {MapScene}
   */
  addObject(object) {
    this._world.add(object.delegate || object)
    return this
  }

  /**
   *
   * @param object
   * @returns {MapScene}
   */
  removeObject(object) {
    this._world.remove(object)
    object.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose())
        } else {
          child.material.dispose()
        }
      }
      if (child.texture) child.texture.dispose()
    })
    return this
  }

  /**
   *
   * @param target
   * @param completed
   * @param duration
   * @returns {MapScene}
   */
  flyTo(target, completed = null, duration = 3) {
    if (target && target.position) {
      if (completed) {
        this._map.once('moveend', completed)
      }
      let size = target.size
      if (!size) {
        size = new Vector3()
        new Box3().setFromObject(target.delegate || target, true).getSize(size)
      }
      const viewInfo = Util.getViewInfo(
        this._map.transform,
        SceneTransform.vector3ToLngLat(target.position),
        size
      )
      this._map.flyTo({
        center: viewInfo.center,
        zoom: viewInfo.zoom,
        duration: duration * 1000,
      })
    }
    return this
  }

  /**
   *
   * @param target
   * @param completed
   * @returns {MapScene}
   */
  zoomTo(target, completed) {
    return this.flyTo(target, completed, 0)
  }

  /**
   *
   * @param type
   * @param callback
   * @returns {MapScene}
   */
  on(type, callback) {
    this._event.addEventListener(type, callback)
    return this
  }

  /**
   *
   * @param type
   * @param callback
   * @returns {MapScene}
   */
  off(type, callback) {
    this._event.removeEventListener(type, callback)
    return this
  }
}

export default MapScene
