import { Box3, EventDispatcher, Group, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';
import { WORLD_SIZE } from '../constants';
import ThreeLayer from '../layer/ThreeLayer';
import SceneTransform from '../transform/SceneTransform';
import Util from '../utils/Util';
/**
 * Default options for MapScene initialization
 */
const DEF_OPTS = {
    scene: null,
    camera: null,
    renderer: null,
    renderLoop: null,
    preserveDrawingBuffer: false,
};
/**
 * Main class for integrating Three.js with MapLibre GL JS
 */
class MapScene {
    /**
     * Reference to the MapLibre GL JS map instance
     */
    _map;
    /**
     * Configuration options
     */
    _options;
    /**
     * Canvas element from the map
     */
    _canvas;
    /**
     * Three.js scene instance
     */
    _scene;
    /**
     * Three.js perspective camera instance
     */
    _camera;
    /**
     * Three.js WebGL renderer instance
     */
    _renderer;
    /**
     * Group containing all light sources
     */
    _lights;
    /**
     * Group containing all world objects
     */
    _world;
    /**
     * Event dispatcher for MapScene events
     */
    _event;
    /**
     * Creates a new MapScene instance
     * @param {IMap} map - MapLibre GL JS map instance
     * @param {Partial<IMapSceneOptions>} [options] - Configuration options
     * @throws {string} When no map instance is provided
     */
    constructor(map, options = {}) {
        if (!map) {
            // eslint-disable-next-line no-throw-literal
            throw 'missing  map';
        }
        this._map = map;
        this._options = {
            ...DEF_OPTS,
            ...options,
        };
        this._canvas = map.getCanvas();
        this._scene = this._options.scene || new Scene();
        this._camera
            = this._options.camera
                || new PerspectiveCamera(this._map.transform.fov, this._map.transform.width / this._map.transform.height, 0.1, 1e21);
        this._camera.matrixAutoUpdate = false;
        this._renderer
            = this._options.renderer
                || new WebGLRenderer({
                    alpha: true,
                    antialias: true,
                    preserveDrawingBuffer: this._options.preserveDrawingBuffer,
                    canvas: this._canvas,
                    context: this._canvas.getContext('webgl2'),
                });
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setSize(this._canvas.clientWidth, this._canvas.clientHeight);
        this._renderer.autoClear = false;
        // init the lights container
        this._lights = new Group();
        this._lights.name = 'lights';
        this._scene.add(this._lights);
        // init the world container
        this._world = new Group();
        this._world.name = 'world';
        this._world.userData = {
            isWorld: true,
            name: 'world',
        };
        this._world.position.set(WORLD_SIZE / 2, WORLD_SIZE / 2, 0);
        this._world.matrixAutoUpdate = false;
        this._scene.add(this._world);
        this._map.on('render', this._onMapRender.bind(this));
        this._event = new EventDispatcher();
    }
    /**
     * Gets the MapLibre GL JS map instance
     * @returns {IMap} The map instance
     */
    get map() {
        return this._map;
    }
    /**
     * Gets the canvas element
     * @returns {HTMLCanvasElement} The canvas element
     */
    get canvas() {
        return this._canvas;
    }
    /**
     * Gets the Three.js camera instance
     * @returns {PerspectiveCamera} The camera instance
     */
    get camera() {
        return this._camera;
    }
    /**
     * Gets the Three.js scene instance
     * @returns {Scene} The scene instance
     */
    get scene() {
        return this._scene;
    }
    /**
     * Gets the lights group
     * @returns {Group} The group containing all lights
     */
    get lights() {
        return this._lights;
    }
    /**
     * Gets the world group
     * @returns {Group} The group containing all world objects
     */
    get world() {
        return this._world;
    }
    /**
     * Gets the Three.js renderer instance
     * @returns {WebGLRenderer} The renderer instance
     */
    get renderer() {
        return this._renderer;
    }
    /**
     * Handles map render events to ensure the ThreeLayer is added
     * @private
     */
    _onMapRender() {
        if (!this._map.getLayer('map_scene_layer')) {
            this._map.addLayer(new ThreeLayer('map_scene_layer', this));
        }
    }
    /**
     * Renders the 3D scene
     * @returns {MapScene} The MapScene instance for method chaining
     */
    render() {
        if (this._options.renderLoop) {
            this._options.renderLoop(this);
        }
        else {
            const frameState = {
                center: this._map.getCenter(),
                scene: this._scene,
                camera: this._camera,
                renderer: this._renderer,
            };
            this._event.dispatchEvent({
                type: 'preReset',
                frameState,
            });
            this.renderer.resetState();
            this._event.dispatchEvent({
                type: 'postReset',
                frameState,
            });
            this._event.dispatchEvent({
                type: 'preRender',
                frameState,
            });
            this.renderer.render(this._scene, this._camera);
            this._event.dispatchEvent({
                type: 'postRender',
                frameState,
            });
        }
        return this;
    }
    /**
     * Adds a light source to the scene
     * @param {ILight} light - The light to add
     * @returns {MapScene} The MapScene instance for method chaining
     */
    addLight(light) {
        this._lights.add(light.delegate || light);
        return this;
    }
    /**
     * Removes a light source from the scene
     * @param {ILight} light - The light to remove
     * @returns {MapScene} The MapScene instance for method chaining
     */
    removeLight(light) {
        this._lights.remove(light.delegate || light);
        return this;
    }
    /**
     * Adds an object to the world group
     * @param {IObject3D} object - The object to add
     * @returns {MapScene} The MapScene instance for method chaining
     */
    addObject(object) {
        this._world.add(object.delegate || object);
        return this;
    }
    /**
     * Removes an object from the world group and disposes its resources
     * @param {IObject3D} object - The object to remove
     * @returns {MapScene} The MapScene instance for method chaining
     */
    removeObject(object) {
        this._world.remove(object);
        object.traverse((child) => {
            if (child.geometry)
                child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                }
                else {
                    child.material.dispose();
                }
            }
            if (child.texture)
                child.texture.dispose();
        });
        return this;
    }
    /**
     * Gets the current view position and orientation
     * @returns {IViewPosition} The view position information
     */
    getViewPosition() {
        const transform = this._map.transform;
        const center = transform.center;
        return {
            position: [
                center.lng,
                center.lat,
                Util.getHeightByZoom(transform, transform.zoom, center.lat, transform.pitch),
            ],
            heading: transform.bearing,
            pitch: transform.pitch,
        };
    }
    /**
     * Flies to an object with animation
     * @param {IObject3D} target - The object to fly to
     * @param {((ev: MapEventType) => void) | null} [completed] - Callback when animation completes
     * @param {number} [duration] - Animation duration in seconds
     * @returns {MapScene} The MapScene instance for method chaining
     */
    flyTo(target, completed = null, duration = 3) {
        if (target && target.position) {
            if (completed) {
                this._map.once('moveend', completed);
            }
            let size = target.size;
            if (!size) {
                size = new Vector3();
                new Box3().setFromObject(target.delegate || target, true).getSize(size);
            }
            const viewInfo = Util.getViewInfo(this._map.transform, SceneTransform.vector3ToLngLat(target.position), size);
            this._map.flyTo({
                center: viewInfo.center,
                zoom: viewInfo.zoom,
                duration: duration * 1000,
            });
        }
        return this;
    }
    /**
     * Zooms to an object immediately
     * @param {IObject3D} target - The object to zoom to
     * @param {((ev: MapEventType) => void) | null} completed - Callback when zoom completes
     * @returns {MapScene} The MapScene instance for method chaining
     */
    zoomTo(target, completed) {
        return this.flyTo(target, completed, 0);
    }
    /**
     * Flies to a specific geographic position with animation
     * @param {[number, number, number]} position - Target position [lng, lat, height]
     * @param {[number, number, number]} [hpr] - Heading, pitch, roll angles
     * @param {((ev: MapEventType) => void) | null} [completed] - Callback when animation completes
     * @param {number} [duration] - Animation duration in seconds
     * @returns {MapScene} The MapScene instance for method chaining
     */
    flyToPosition(position, hpr = [0, 0, 0], completed = null, duration = 3) {
        if (completed) {
            this._map.once('moveend', completed);
        }
        this._map.flyTo({
            center: [position[0], position[1]],
            zoom: Util.getZoomByHeight(this._map.transform, position[2], position[1], hpr[1] || 0),
            bearing: hpr[0],
            pitch: hpr[1],
            duration: duration * 1000,
        });
        return this;
    }
    /**
     * Zooms to a specific geographic position immediately
     * @param {[number, number, number]} position - Target position [lng, lat, height]
     * @param {[number, number, number]} [hpr] - Heading, pitch, roll angles
     * @param {((ev: MapEventType) => void) | null} [completed] - Callback when zoom completes
     * @param {number} [_duration] - Ignored duration parameter for API consistency
     * @returns {MapScene} The MapScene instance for method chaining
     */
    zoomToPosition(position, hpr = [0, 0, 0], completed = null, _duration = 3) {
        return this.flyToPosition(position, hpr, completed, 0);
    }
    /**
     * Adds an event listener
     * @param {keyof IMapSceneEvent} type - Event type
     * @param {(event: { frameState: IFrameState }) => void} callback - Event callback
     * @returns {MapScene} The MapScene instance for method chaining
     */
    on(type, callback) {
        this._event.addEventListener(type, callback);
        return this;
    }
    /**
     * Removes an event listener
     * @param {keyof IMapSceneEvent} type - Event type
     * @param {(event: { frameState: IFrameState }) => void} callback - Event callback
     * @returns {MapScene} The MapScene instance for method chaining
     */
    off(type, callback) {
        this._event.removeEventListener(type, callback);
        return this;
    }
}
export default MapScene;
