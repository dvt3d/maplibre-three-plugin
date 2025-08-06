/**
 * Manages sun and hemisphere lighting in a 3D scene, providing positional updates based on geographic location and time.
 * Integrates with Three.js for lighting and SunCalc for astronomical calculations.
 */
import type { IFrameState } from '../scene/MapScene';
import { DirectionalLight, Group, HemisphereLight } from 'three';
/**
 * Configuration options for shadow rendering.
 */
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
 * Sun lighting management class
 */
declare class Sun {
    /**
     * Three.js Group containing the light sources
     */
    private readonly _delegate;
    /**
     * Directional light representing the sun
     */
    private readonly _sunLight;
    /**
     * Hemisphere light for ambient sky lighting
     */
    private readonly _hemiLight;
    /**
     * Current time used for sun position calculations
     */
    private _currentTime;
    /**
     * Creates a new Sun instance
     */
    constructor();
    /**
     * Gets the Three.js Group containing the light sources
     * @returns {Group} The light sources group
     */
    get delegate(): Group;
    /**
     * Sets whether the sun light casts shadows
     * @param {boolean} castShadow - Shadow casting enabled state
     */
    set castShadow(castShadow: boolean);
    /**
     * Gets whether the sun light casts shadows
     * @returns {boolean} Shadow casting enabled state
     */
    get castShadow(): boolean;
    /**
     * Sets the current time for sun position calculations
     * @param {null | number | string | Date} currentTime - Time for sun position calculation
     */
    set currentTime(currentTime: null | number | string | Date);
    /**
     * Gets the current time used for sun position calculations
     * @returns {null | number | string | Date} Current time value
     */
    get currentTime(): null | number | string | Date;
    /**
     * Gets the directional sun light
     * @returns {DirectionalLight} The sun light instance
     */
    get sunLight(): DirectionalLight;
    /**
     * Gets the hemisphere ambient light
     * @returns {HemisphereLight} The hemisphere light instance
     */
    get hemiLight(): HemisphereLight;
    /**
     * Configures shadow properties for the sun light
     * @param {Partial<ShadowOptions>} [shadow] - Shadow configuration options
     * @returns {Sun} The Sun instance for method chaining
     */
    setShadow(shadow?: Partial<ShadowOptions>): Sun;
    /**
     * Updates sun position and intensity based on the current time and map center
     * @param {IFrameState} frameState - Current frame state containing map center information
     */
    update(frameState: IFrameState): void;
}
export default Sun;
