import { Matrix4, Vector3 } from 'three';
import { DEG2RAD, TILE_SIZE, WORLD_SIZE } from '../constants';
import Util from '../utils/Util';
const projectionMatrix = new Matrix4();
const cameraTranslateZ = new Matrix4();
const MAX_VALID_LATITUDE = 85.051129;
class CameraSync {
    _map;
    _world;
    _camera;
    _translateCenter;
    _worldSizeRatio;
    /**
     * Creates a new CameraSync instance.
     * @param map - The Maplibre GL map instance
     * @param world - Three.js Group containing the map objects
     * @param camera - Three.js PerspectiveCamera to synchronize with the map
     */
    constructor(map, world, camera) {
        this._map = map;
        this._world = world;
        this._camera = camera;
        this._translateCenter = new Matrix4().makeTranslation(WORLD_SIZE / 2, -WORLD_SIZE / 2, 0);
        this._worldSizeRatio = TILE_SIZE / WORLD_SIZE;
        this._map.on('move', () => {
            this.syncCamera(false);
        });
        this._map.on('resize', () => {
            this.syncCamera(true);
        });
    }
    /**
     * Synchronizes the Three.js camera with the Maplibre map view.
     * Updates projection matrix, camera position, and world transformations.
     * @param updateProjectionMatrix - Whether to update the camera's projection matrix
     */
    syncCamera(updateProjectionMatrix) {
        const transform = this._map.transform;
        const pitchInRadians = transform.pitch * DEG2RAD;
        const bearingInRadians = transform.bearing * DEG2RAD;
        if (updateProjectionMatrix) {
            const fovInRadians = transform.fov * DEG2RAD;
            const centerOffset = transform.centerOffset || new Vector3();
            this._camera.aspect = transform.width / transform.height;
            // set camera projection matrix
            projectionMatrix.elements = Util.makePerspectiveMatrix(fovInRadians, this._camera.aspect, transform.height / 50, transform.farZ);
            this._camera.projectionMatrix = projectionMatrix;
            this._camera.projectionMatrix.elements[8]
                = (-centerOffset.x * 2) / transform.width;
            this._camera.projectionMatrix.elements[9]
                = (centerOffset.y * 2) / transform.height;
        }
        // set camera world Matrix
        cameraTranslateZ.makeTranslation(0, 0, transform.cameraToCenterDistance);
        const cameraWorldMatrix = new Matrix4()
            .premultiply(cameraTranslateZ)
            .premultiply(new Matrix4().makeRotationX(pitchInRadians))
            .premultiply(new Matrix4().makeRotationZ(-bearingInRadians));
        if (transform.elevation) {
            cameraWorldMatrix.elements[14]
                = transform.cameraToCenterDistance * Math.cos(pitchInRadians);
        }
        this._camera.matrixWorld.copy(cameraWorldMatrix);
        // Handle scaling and translation of objects in the map in the world's matrix transform, not the camera
        const zoomPow = transform.scale * this._worldSizeRatio;
        const scale = new Matrix4().makeScale(zoomPow, zoomPow, zoomPow);
        // todo map.transform.x||y always undefined
        let x = transform.x;
        let y = transform.y;
        if (!x || !y) {
            const center = transform.center;
            const lat = Util.clamp(center.lat, -MAX_VALID_LATITUDE, MAX_VALID_LATITUDE);
            x = Util.mercatorXFromLng(center.lng) * transform.worldSize;
            y = Util.mercatorYFromLat(lat) * transform.worldSize;
        }
        const translateMap = new Matrix4().makeTranslation(-x, y, 0);
        const rotateMap = new Matrix4().makeRotationZ(Math.PI);
        this._world.matrix = new Matrix4()
            .premultiply(rotateMap)
            .premultiply(this._translateCenter)
            .premultiply(scale)
            .premultiply(translateMap);
    }
}
export default CameraSync;
