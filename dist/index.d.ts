import * as three from 'three';
import { Scene, PerspectiveCamera, WebGLRenderer, Group, Light, Object3D, Vector3, DirectionalLight, HemisphereLight, Mesh } from 'three';
import { EffectComposer, RenderPass, ShaderPass, Pass } from 'three/addons';

interface IMap {
    transform: any;
    on(type: string, listener: () => any): any;
    getCanvas(): HTMLCanvasElement;
    getLayer(id: string): any;
    addLayer(options: any): any;
    getCenter(): {
        lng: number;
        lat: number;
    };
    once(type: string, completed: any): void;
    flyTo(param: {
        center: any[];
        zoom: number;
        bearing: number;
        pitch: number;
        duration: number;
    }): void;
    moveLayer(id: String, beforeId?: String): void;
}
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
    /**
     * Whether to preserve the drawing buffer.
     * When enabled, the canvas content will be retained after rendering,
     * which is useful for screenshots or readPixels operations.
     * Note: Enabling this may have a performance impact.
     */
    preserveDrawingBuffer: boolean;
    /**
     * Whether to enable post-processing rendering.
     * When enabled, Three.js content will be rendered through
     * an offscreen render target before being composited onto the map.
     * When disabled, Three.js renders directly into the shared MapLibre canvas
     * for maximum performance and stability.
     */
    enablePostProcessing: boolean;
}
/**
 * Frame state information passed to event listeners
 */
interface IFrameState {
    /** Current map center coordinates */
    center: {
        lng: number;
        lat: number;
    };
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
interface IObject3D {
    /** Optional delegate object */
    delegate: Object3D;
    /** Optional size vector */
    size?: Vector3;
}
declare class MapScene {
    private readonly _map;
    private _options;
    private readonly _canvas;
    private readonly _scene;
    private readonly _camera;
    private readonly _renderer;
    private readonly _lights;
    private readonly _world;
    private readonly _composer;
    private readonly _renderPass;
    private readonly _customOutPass;
    private _event;
    constructor(map: IMap, options?: Partial<IMapSceneOptions>);
    get map(): IMap;
    get canvas(): HTMLCanvasElement;
    get camera(): PerspectiveCamera;
    get scene(): Scene;
    get lights(): Group<three.Object3DEventMap>;
    get world(): Group<three.Object3DEventMap>;
    get renderer(): WebGLRenderer;
    get composer(): EffectComposer | undefined;
    get renderPass(): RenderPass | undefined;
    get customOutPass(): ShaderPass | undefined;
    /**
     *
     * @private
     */
    _onMapRender(): void;
    /**
     *
     * @returns {MapScene}
     */
    render(): MapScene;
    /**
     *
     * @param light
     * @returns {MapScene}
     */
    addLight(light: ILight): MapScene;
    /**
     *
     * @param light
     */
    removeLight(light: ILight): this;
    /**
     *
     * @param object
     * @returns {MapScene}
     */
    addObject(object: IObject3D | Object3D): MapScene;
    /**
     *
     * @param object
     * @returns {MapScene}
     */
    removeObject(object: IObject3D | Object3D): MapScene;
    /**
     *
     * @returns {{position: *[], heading: *, pitch}}
     */
    getViewPosition(): {
        position: number[];
        heading: number;
        pitch: number;
    };
    /**
     *
     * @param target
     * @param completed
     * @param duration
     * @returns {MapScene}
     */
    flyTo(target: {
        position: {
            x: number;
            y: number;
            z: number;
        };
        size?: any;
        delegate?: any;
    }, duration?: number, completed?: () => void): MapScene;
    /**
     *
     * @param target
     * @param completed
     * @returns {MapScene}
     */
    zoomTo(target: {
        position: {
            x: number;
            y: number;
            z: number;
        };
        size?: any;
        delegate?: any;
    }, completed?: () => void): MapScene;
    /**
     *
     * @returns {MapScene}
     */
    flyToPosition(position: number[], hpr?: number[], completed?: () => void, duration?: number): MapScene;
    /**
     *
     * @returns {MapScene}
     */
    zoomToPosition(position: any, hpr?: number[], completed?: () => void): MapScene;
    /**
     *
     * @param type
     * @param callback
     * @returns {MapScene}
     */
    on(type: string, callback: (event: {
        frameState: IFrameState;
    }) => void): MapScene;
    /**
     *
     * @param type
     * @param callback
     * @returns {MapScene}
     */
    off(type: string, callback: () => void): MapScene;
    /**
     *
     * @param beforeId
     * @returns {MapScene}
     */
    layerBeforeTo(beforeId?: String): MapScene;
    /**
     * @param pass
     * @returns {MapScene}
     */
    addPass(pass: Pass): MapScene;
    /**
     *
     * @param pass
     * @returns {MapScene}
     */
    removePass(pass: Pass): MapScene;
}

declare class SceneTransform {
    /**
     *
     * @returns {number}
     */
    static projectedMercatorUnitsPerMeter(): number;
    /**
     *
     * @param lat
     * @returns {number}
     */
    static projectedUnitsPerMeter(lat: number): number;
    /**
     *
     * @param lng
     * @param lat
     * @param alt
     * @returns {Vector3}
     */
    static lngLatToVector3(lng: number | number[], lat?: number, alt?: number): Vector3;
    /**
     *
     * @param v
     * @returns {number[]}
     */
    static vector3ToLngLat(v: {
        x: number;
        y: number;
        z: number;
    }): number[];
}

interface ShadowOptions {
    /** Blur radius for shadow edges */
    radius: number;
    /** Width and height of the shadow map */
    mapSize: [number, number];
    /** Top and right boundaries of the shadow camera frustum */
    topRight: number;
    /** Bottom and left boundaries of the shadow camera frustum */
    bottomLeft: number;
    /** Near clipping plane of the shadow camera */
    near: number;
    /** Far clipping plane of the shadow camera */
    far: number;
}
/**
 *
 */
declare class Sun {
    private readonly _delegate;
    private readonly _sunLight;
    private readonly _hemiLight;
    private _currentTime;
    constructor();
    get delegate(): Group<three.Object3DEventMap>;
    set castShadow(castShadow: boolean);
    get castShadow(): boolean;
    set currentTime(currentTime: string | number | Date);
    get currentTime(): string | number | Date;
    get sunLight(): DirectionalLight;
    get hemiLight(): HemisphereLight;
    /**
     *
     * @param shadow
     * @returns {Sun}
     */
    setShadow(shadow?: Partial<ShadowOptions>): Sun;
    /**
     *
     * @param frameState
     */
    update(frameState: IFrameState): void;
}

/**
 * @Author: Caven Chen
 */

declare class Creator {
    /**
     *
     * @param center
     * @param rotation
     * @param scale
     */
    static createRTCGroup(center: number[], rotation: number[], scale: number[]): Group;
    /**
     *
     * @param center
     * @param rotation
     * @param scale
     */
    static createMercatorRTCGroup(center: number[], rotation: number[], scale: number[]): Group;
    /**
     *
     * @param center
     * @param width
     * @param height
     * @returns {Mesh}
     */
    static createShadowGround(center: number[], width?: number, height?: number): Mesh;
}

export { Creator, MapScene, SceneTransform, Sun };
