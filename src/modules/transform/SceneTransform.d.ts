import { Vector3 } from 'three';
/**
 * Utility class for scene transformations, including coordinate conversions between
 * geographic coordinates (longitude, latitude, altitude) and Three.js Vector3.
 */
declare class SceneTransform {
    /**
     * Calculates the number of projected Mercator units per meter.
     * @returns {number} Projected Mercator units per meter
     */
    static projectedMercatorUnitsPerMeter(): number;
    /**
     * Calculates the number of projected units per meter at a specific latitude.
     * @param {number} lat - Latitude in degrees
     * @returns {number} Projected units per meter at the given latitude
     */
    static projectedUnitsPerMeter(lat: number): number;
    /**
     * Converts geographic coordinates (longitude, latitude, altitude) to a Three.js Vector3.
     * Can accept either individual parameters or an array of [lng, lat, alt].
     * @param {number|number[]} lng - Longitude in degrees or array of [lng, lat, alt]
     * @param {number} [lat] - Latitude in degrees (required if lng is not an array)
     * @param {number} [alt] - Altitude in meters (default: 0)
     * @returns {Vector3} Three.js Vector3 representing the converted coordinates
     */
    static lngLatToVector3(lng: number | number[], lat?: number, alt?: number): Vector3;
    /**
     * Converts a Three.js Vector3 to geographic coordinates (longitude, latitude, altitude).
     * @param {Vector3} v - Three.js Vector3 to convert
     * @returns {[number, number, number]} Array containing [longitude, latitude, altitude] in degrees and meters
     */
    static vector3ToLngLat(v: Vector3): [number, number, number];
}
export default SceneTransform;
