/**
 * Manages the 3D scene integration with MapLibre GL JS, handling camera synchronization,
 * rendering, and object management within a geographic context.
 */
import type { Map as IMap, LngLat, MapEventType } from 'maplibre-gl';
import type { Light, Object3D, Object3DEventMap } from 'three';
import { Group, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';
/**
 * Configuration options for initializing a MapScene
 */
interface IMapSceneOptions {
    /** Existing Three.js Scene instance (optional) */
    scene: null | Scene;
    /** Existing Three.js PerspectiveCamera instance (optional) */
    camera: null | PerspectiveCamera;
    /** Existing Three.js WebGLRenderer instance (optional) */
    renderer: null | WebGLRenderer;
    /** Custom render loop function (optional) */
    renderLoop: null | ((mapScene: MapScene) => void);
    /** Whether to preserve the drawing buffer (optional) */
    preserveDrawingBuffer: boolean;
}
/**
 * Event types and their payloads for MapScene events
 */
interface IMapSceneEvent {
    /** Dispatched after resetting the renderer state */
    postReset: {
        frameState: IFrameState;
    };
    /** Dispatched before rendering the scene */
    preRender: {
        frameState: IFrameState;
    };
    /** Dispatched before resetting the renderer state */
    preReset: {
        frameState: IFrameState;
    };
    /** Dispatched after rendering the scene */
    postRender: {
        frameState: IFrameState;
    };
}
/**
 * Frame state information passed to event listeners
 */
export interface IFrameState {
    /** Current map center coordinates */
    center: LngLat;
    /** Three.js Scene instance */
    scene: Scene;
    /** Three.js PerspectiveCamera instance */
    camera: PerspectiveCamera;
    /** Three.js WebGLRenderer instance */
    renderer: WebGLRenderer;
}
/**
 * Extended Three.js Light interface with optional delegate
 */
interface ILight extends Light {
    /** Optional delegate light source */
    delegate?: Light;
}
/**
 * Extended Three.js Object3D interface with optional delegate and size
 */
interface IObject3D<T extends Object3DEventMap = Object3DEventMap, D = Object3D> extends Object3D<T> {
    /** Optional delegate object */
    delegate?: D;
    /** Optional size vector */
    size?: Vector3;
}
/**
 * View position information including coordinates and orientation
 */
interface IViewPosition {
    /** Geographic position [lng, lat, height] */
    position: [number, number, number];
    /** Heading angle in degrees */
    heading: number;
    /** Pitch angle in degrees */
    pitch: number;
}
/**
 * Main class for integrating Three.js with MapLibre GL JS
 */
declare class MapScene {
    /**
     * Reference to the MapLibre GL JS map instance
     */
    private readonly _map;
    /**
     * Configuration options
     */
    private _options;
    /**
     * Canvas element from the map
     */
    private readonly _canvas;
    /**
     * Three.js scene instance
     */
    private readonly _scene;
    /**
     * Three.js perspective camera instance
     */
    private readonly _camera;
    /**
     * Three.js WebGL renderer instance
     */
    private readonly _renderer;
    /**
     * Group containing all light sources
     */
    private readonly _lights;
    /**
     * Group containing all world objects
     */
    private readonly _world;
    /**
     * Event dispatcher for MapScene events
     */
    private _event;
    /**
     * Creates a new MapScene instance
     * @param {IMap} map - MapLibre GL JS map instance
     * @param {Partial<IMapSceneOptions>} [options] - Configuration options
     * @throws {string} When no map instance is provided
     */
    constructor(map: IMap, options?: Partial<IMapSceneOptions>);
    /**
     * Gets the MapLibre GL JS map instance
     * @returns {IMap} The map instance
     */
    get map(): IMap;
    /**
     * Gets the canvas element
     * @returns {HTMLCanvasElement} The canvas element
     */
    get canvas(): HTMLCanvasElement;
    /**
     * Gets the Three.js camera instance
     * @returns {PerspectiveCamera} The camera instance
     */
    get camera(): PerspectiveCamera;
    /**
     * Gets the Three.js scene instance
     * @returns {Scene} The scene instance
     */
    get scene(): Scene;
    /**
     * Gets the lights group
     * @returns {Group} The group containing all lights
     */
    get lights(): Group;
    /**
     * Gets the world group
     * @returns {Group} The group containing all world objects
     */
    get world(): Group;
    /**
     * Gets the Three.js renderer instance
     * @returns {WebGLRenderer} The renderer instance
     */
    get renderer(): WebGLRenderer;
    /**
     * Handles map render events to ensure the ThreeLayer is added
     * @private
     */
    private _onMapRender;
    /**
     * Renders the 3D scene
     * @returns {MapScene} The MapScene instance for method chaining
     */
    render(): MapScene;
    /**
     * Adds a light source to the scene
     * @param {ILight} light - The light to add
     * @returns {MapScene} The MapScene instance for method chaining
     */
    addLight(light: ILight): MapScene;
    /**
     * Removes a light source from the scene
     * @param {ILight} light - The light to remove
     * @returns {MapScene} The MapScene instance for method chaining
     */
    removeLight(light: ILight): MapScene;
    /**
     * Adds an object to the world group
     * @param {IObject3D} object - The object to add
     * @returns {MapScene} The MapScene instance for method chaining
     */
    addObject(object: IObject3D): MapScene;
    /**
     * Removes an object from the world group and disposes its resources
     * @param {IObject3D} object - The object to remove
     * @returns {MapScene} The MapScene instance for method chaining
     */
    removeObject(object: IObject3D): MapScene;
    /**
     * Gets the current view position and orientation
     * @returns {IViewPosition} The view position information
     */
    getViewPosition(): IViewPosition;
    /**
     * Flies to an object with animation
     * @param {IObject3D} target - The object to fly to
     * @param {((ev: MapEventType) => void) | null} [completed] - Callback when animation completes
     * @param {number} [duration] - Animation duration in seconds
     * @returns {MapScene} The MapScene instance for method chaining
     */
    flyTo(target: IObject3D, completed?: ((ev: MapEventType) => void) | null, duration?: number): MapScene;
    /**
     * Zooms to an object immediately
     * @param {IObject3D} target - The object to zoom to
     * @param {((ev: MapEventType) => void) | null} completed - Callback when zoom completes
     * @returns {MapScene} The MapScene instance for method chaining
     */
    zoomTo(target: IObject3D, completed: ((ev: MapEventType) => void) | null): MapScene;
    /**
     * Flies to a specific geographic position with animation
     * @param {[number, number, number]} position - Target position [lng, lat, height]
     * @param {[number, number, number]} [hpr] - Heading, pitch, roll angles
     * @param {((ev: MapEventType) => void) | null} [completed] - Callback when animation completes
     * @param {number} [duration] - Animation duration in seconds
     * @returns {MapScene} The MapScene instance for method chaining
     */
    flyToPosition(position: [number, number, number], hpr?: [number, number, number], completed?: ((ev: MapEventType) => void) | null, duration?: number): MapScene;
    /**
     * Zooms to a specific geographic position immediately
     * @param {[number, number, number]} position - Target position [lng, lat, height]
     * @param {[number, number, number]} [hpr] - Heading, pitch, roll angles
     * @param {((ev: MapEventType) => void) | null} [completed] - Callback when zoom completes
     * @param {number} [_duration] - Ignored duration parameter for API consistency
     * @returns {MapScene} The MapScene instance for method chaining
     */
    zoomToPosition(position: [number, number, number], hpr?: [number, number, number], completed?: null, _duration?: number): MapScene;
    /**
     * Adds an event listener
     * @param {keyof IMapSceneEvent} type - Event type
     * @param {(event: { frameState: IFrameState }) => void} callback - Event callback
     * @returns {MapScene} The MapScene instance for method chaining
     */
    on(type: keyof IMapSceneEvent, callback: (event: {
        frameState: IFrameState;
    }) => void): MapScene;
    /**
     * Removes an event listener
     * @param {keyof IMapSceneEvent} type - Event type
     * @param {(event: { frameState: IFrameState }) => void} callback - Event callback
     * @returns {MapScene} The MapScene instance for method chaining
     */
    off(type: keyof IMapSceneEvent, callback: (event: {
        frameState: IFrameState;
    }) => void): MapScene;
}
export default MapScene;
