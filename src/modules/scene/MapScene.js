import { Group, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import ThreeLayer from '../layer/ThreeLayer'
import { WORLD_SIZE } from '../constants'

const DEF_OPTS = {
  scene: null,
  camera: null,
  renderer: null,
  preserveDrawingBuffer: false,
  renderLoop: (ins) => {
    ins.renderer.resetState()
    ins.renderer.render(ins.scene, ins.camera)
  },
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
    this._options.renderLoop(this)
    return this
  }
}

export default MapScene
