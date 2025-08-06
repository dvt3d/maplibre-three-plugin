import type { ITransform } from 'maplibre-gl';
import type { Matrix4Tuple, Vector3 } from 'three';
/**
 * Utility class providing various helper functions for map calculations and transformations.
 */
declare class Util {
    /**
     * Clamps a number between a minimum and maximum value.
     * @param n - The number to clamp
     * @param min - The minimum allowed value
     * @param max - The maximum allowed value
     * @returns {number} The clamped number
     */
    static clamp(n: number, min: number, max: number): number;
    /**
     * Creates a perspective projection matrix.
     * @param fovy - Field of view in degrees
     * @param aspect - Aspect ratio (width/height)
     * @param near - Near clipping plane distance
     * @param far - Far clipping plane distance
     * @returns {Matrix4Tuple} The perspective matrix as a flat array of 16 numbers
     */
    static makePerspectiveMatrix(fovy: number, aspect: number, near: number, far: number): Matrix4Tuple;
    /**
     * Converts longitude to Mercator X coordinate.
     * @param lng - Longitude in degrees
     * @returns {number} Mercator X coordinate (0-1 range)
     */
    static mercatorXFromLng(lng: number): number;
    /**
     * Converts latitude to Mercator Y coordinate.
     * @param lat - Latitude in degrees
     * @returns {number} Mercator Y coordinate (0-1 range)
     */
    static mercatorYFromLat(lat: number): number;
    /**
     * Calculates view information based on transform, center, and bounding size.
     * @param transform - Maplibre transform object containing camera properties
     * @param center - Center coordinates (array of [lng, lat, alt] or string in format "lng,lat,alt")
     * @param boundingSize - Three.js Vector3 representing the bounding box dimensions
     * @returns {{center: (number)[], cameraHeight: number, zoom: number}} View information including center coordinates, camera height, and recommended zoom level
     */
    static getViewInfo(transform: ITransform, center: number[] | string, boundingSize: Vector3): {
        center: [number, number];
        cameraHeight: number;
        zoom: number;
    };
    /**
     * Calculates height based on zoom level, latitude, and pitch.
     * @param transform - Maplibre transform object containing camera properties
     * @param zoom - Current zoom level
     * @param lat - Latitude in degrees
     * @param pitch - Camera pitch angle in degrees
     * @returns {number} Calculated height
     */
    static getHeightByZoom(transform: ITransform, zoom: number, lat: number, pitch: number): number;
    /**
     * Calculates zoom level based on height, latitude, and pitch.
     * @param transform - Maplibre transform object containing camera properties
     * @param height - Current height
     * @param lat - Latitude in degrees
     * @param pitch - Camera pitch angle in degrees
     * @returns {number} Calculated zoom level (rounded to nearest integer)
     */
    static getZoomByHeight(transform: ITransform, height: number, lat: number, pitch: number): number;
}
export default Util;
