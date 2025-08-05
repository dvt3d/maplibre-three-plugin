/**
 * @Author: Caven Chen
 * Class responsible for synchronizing Maplibre GL map camera with Three.js perspective camera.
 * Handles projection matrix updates, camera positioning, and world transformations.
 */
import type { Map as IMap } from 'maplibre-gl';
import type { Group, PerspectiveCamera } from 'three';
declare class CameraSync {
    private _map;
    private _world;
    private _camera;
    private _translateCenter;
    private readonly _worldSizeRatio;
    /**
     * Creates a new CameraSync instance.
     * @param map - The Maplibre GL map instance
     * @param world - Three.js Group containing the map objects
     * @param camera - Three.js PerspectiveCamera to synchronize with the map
     */
    constructor(map: IMap, world: Group, camera: PerspectiveCamera);
    /**
     * Synchronizes the Three.js camera with the Maplibre map view.
     * Updates projection matrix, camera position, and world transformations.
     * @param updateProjectionMatrix - Whether to update the camera's projection matrix
     */
    syncCamera(updateProjectionMatrix: boolean): void;
}
export default CameraSync;
