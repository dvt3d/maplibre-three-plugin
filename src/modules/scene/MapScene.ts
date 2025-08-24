import {
  Group,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  EventDispatcher,
  Box3,
  Vector3,
} from 'three'
import type { Light, Object3D } from 'three'
import ThreeLayer from '../layer/ThreeLayer'
import { WORLD_SIZE } from '../constants'
import Util from '../utils/Util'
import SceneTransform from '../transform/SceneTransform'

const DEF_OPTS = {
  scene: null,
  camera: null,
  renderer: null,
  renderLoop: null,
  preserveDrawingBuffer: false,
}

export interface IMap {
  transform: any
  on(type: string, listener: () => any): any
  getCanvas(): HTMLCanvasElement
  getLayer(id: string): any
  addLayer(options: any): any
  getCenter(): { lng: number; lat: number }
  once(type: string, completed: any): void
  flyTo(param: {
    center: any[]
    zoom: number
    bearing: number
    pitch: number
    duration: number
  }): void
}

/**
 * Configuration options for initializing a MapScene
 */
interface IMapSceneOptions {
  /** Existing Three.js Scene instance (optional) */
  scene: null | Scene
  /** Existing Three.js PerspectiveCamera instance (optional) */
  camera: null | PerspectiveCamera
  /** Existing Three.js WebGLRenderer instance (optional) */
  renderer: null | WebGLRenderer
  /** Custom render loop function (optional) */
  renderLoop: null | ((mapScene: MapScene) => void)
  /** Whether to preserve the drawing buffer (optional) */
  preserveDrawingBuffer: boolean
}

/**
 * Event types and their payloads for MapScene events
 */
interface IMapSceneEvent {
  /** Dispatched after resetting the renderer state */
  postReset: { frameState: IFrameState }
  /** Dispatched before rendering the scene */
  preRender: { frameState: IFrameState }
  /** Dispatched before resetting the renderer state */
  preReset: { frameState: IFrameState }
  /** Dispatched after rendering the scene */
  postRender: { frameState: IFrameState }
}

/**
 * Frame state information passed to event listeners
 */
export interface IFrameState {
  /** Current map center coordinates */
  center: { lng: number; lat: number }
  /** Three.js Scene instance */
  scene: Scene
  /** Three.js PerspectiveCamera instance */
  camera: PerspectiveCamera
  /** Three.js WebGLRenderer instance */
  renderer: WebGLRenderer
}

/**
 * Extended Three.js Light interface with optional delegate
 */
interface ILight extends Light {
  /** Optional delegate light source */
  delegate?: Light
}

/**
 * Extended Three.js Object3D interface with optional delegate and size
 */
interface IObject3D {
  /** Optional delegate object */
  delegate: Object3D
  /** Optional size vector */
  size?: Vector3
}

export class MapScene {
  private readonly _map: IMap
  private _options: IMapSceneOptions
  private readonly _canvas: HTMLCanvasElement
  private readonly _scene: Scene
  private readonly _camera: PerspectiveCamera
  private readonly _renderer: WebGLRenderer
  private readonly _lights: Group
  private readonly _world: Group
  private _event: EventDispatcher<IMapSceneEvent>
  constructor(map: IMap, options: Partial<IMapSceneOptions> = {}) {
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
        0.001,
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
        context: this._canvas.getContext('webgl2')!,
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
    this._map.on('render', this._onMapRender.bind(this))
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
  _onMapRender() {
    if (!this._map.getLayer('map_scene_layer')) {
      this._map.addLayer(new ThreeLayer('map_scene_layer', this))
    }
  }

  /**
   *
   * @returns {MapScene}
   */
  render(): MapScene {
    if (this._options.renderLoop) {
      this._options.renderLoop(this)
    } else {
      const frameState = {
        center: this._map.getCenter(),
        scene: this._scene,
        camera: this._camera,
        renderer: this._renderer,
      }
      this._event.dispatchEvent({
        type: 'preReset',
        frameState,
      })
      this.renderer.resetState()
      this._event.dispatchEvent({
        type: 'postReset',
        frameState,
      })
      this._event.dispatchEvent({
        type: 'preRender',
        frameState,
      })
      this.renderer.render(this._scene, this._camera)
      this._event.dispatchEvent({
        type: 'postRender',
        frameState,
      })
    }
    return this
  }

  /**
   *
   * @param light
   * @returns {MapScene}
   */
  addLight(light: ILight): MapScene {
    this._lights.add(light.delegate || light)
    return this
  }

  /**
   *
   * @param light
   */
  removeLight(light: ILight) {
    this._lights.remove(light.delegate || light)
    return this
  }

  /**
   *
   * @param object
   * @returns {MapScene}
   */
  addObject(object: IObject3D | Object3D): MapScene {
    let obj = 'delegate' in object ? object.delegate : object
    this._world.add(obj)
    return this
  }

  /**
   *
   * @param object
   * @returns {MapScene}
   */
  removeObject(object: IObject3D | Object3D): MapScene {
    let obj = 'delegate' in object ? object.delegate : object
    this._world.remove(obj)
    obj.traverse((child:any) => {
      // @ts-ignore
      if (child.geometry) child.geometry.dispose()
      // @ts-ignore
      if (child.material) {
        // @ts-ignore
        if (Array.isArray(child.material)) {
          // @ts-ignore
          child.material.forEach((m) => m.dispose())
        } else {
          // @ts-ignore
          child.material.dispose()
        }
      }
      // @ts-ignore
      if (child.texture) child.texture.dispose()
    })
    return this
  }

  /**
   *
   * @returns {{position: *[], heading: *, pitch}}
   */
  getViewPosition(): { position: number[]; heading: number; pitch: number } {
    const transform = this._map.transform
    const center = transform.center
    return {
      position: [
        center.lng,
        center.lat,
        Util.getHeightByZoom(
          transform,
          transform.zoom,
          center.lat,
          transform.pitch
        ),
      ],
      heading: transform.bearing,
      pitch: transform.pitch,
    }
  }

  /**
   *
   * @param target
   * @param completed
   * @param duration
   * @returns {MapScene}
   */
  flyTo(
    target: {
      position: { x: number; y: number; z: number }
      size?: any
      delegate?: any
    },
    duration?: number,
    completed?: () => void
  ): MapScene {
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
      // @ts-ignore
      this._map.flyTo({
        center: viewInfo.center,
        zoom: viewInfo.zoom,
        duration: (duration || 3) * 1000,
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
  zoomTo(
    target: {
      position: { x: number; y: number; z: number }
      size?: any
      delegate?: any
    },
    completed?: () => void
  ): MapScene {
    return this.flyTo(target, 0, completed)
  }

  /**
   *
   * @returns {MapScene}
   */
  flyToPosition(
    position: number[],
    hpr: number[] = [0, 0, 0],
    completed?: () => void,
    duration: number = 3
  ): MapScene {
    if (completed) {
      this._map.once('moveend', completed)
    }
    this._map.flyTo({
      center: [position[0], position[1]],
      zoom: Util.getZoomByHeight(
        this._map.transform,
        position[2],
        position[1],
        hpr[1] || 0
      ),
      bearing: hpr[0],
      pitch: hpr[1],
      duration: duration * 1000,
    })
    return this
  }

  /**
   *
   * @returns {MapScene}
   */
  zoomToPosition(
    position: any,
    hpr = [0, 0, 0],
    completed?: () => void
  ): MapScene {
    return this.flyToPosition(position, hpr, completed, 0)
  }

  /**
   *
   * @param type
   * @param callback
   * @returns {MapScene}
   */
  on(
    type: string,
    callback: (event: { frameState: IFrameState }) => void
  ): MapScene {
    // @ts-ignore
    this._event.addEventListener(type, callback)
    return this
  }

  /**
   *
   * @param type
   * @param callback
   * @returns {MapScene}
   */
  off(type: string, callback: () => void): MapScene {
    // @ts-ignore
    this._event.removeEventListener(type, callback)
    return this
  }
}
