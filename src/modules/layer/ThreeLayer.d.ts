import type { Map as IMap } from 'maplibre-gl';
import type MapScene from '../scene/MapScene';
/**
 * A custom MapLibre GL layer that integrates Three.js rendering
 */
declare class ThreeLayer {
    /**
     * The unique identifier of the layer
     * @private
     */
    private readonly _id;
    /**
     * Reference to the MapScene instance
     * @private
     */
    private _mapScene;
    /**
     * Camera synchronization handler
     * @private
     */
    private _cameraSync;
    /**
     * Creates a new ThreeLayer instance
     * @param {string} id - The unique identifier for the layer
     * @param {MapScene} mapScene - The MapScene instance to associate with this layer
     */
    constructor(id: string, mapScene: MapScene);
    /**
     * Gets the layer's unique identifier
     * @returns {string} The layer's ID
     */
    get id(): string;
    /**
     * Gets the layer type
     * @returns {string} The layer type ('custom')
     */
    get type(): 'custom';
    /**
     * Gets the rendering mode
     * @returns {string} The rendering mode ('3d')
     */
    get renderingMode(): '3d';
    /**
     * Called when the layer is added to the map
     * @param {IMap} _map - The MapLibre map instance
     * @param {WebGL2RenderingContext} _gl - The WebGL context
     */
    onAdd(_map: IMap, _gl: WebGL2RenderingContext): void;
    /**
     * Renders the Three.js scene
     */
    render(): void;
    /**
     * Called when the layer is removed from the map
     */
    onRemove(): void;
}
export default ThreeLayer;
