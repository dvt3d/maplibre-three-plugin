import { DEG2RAD, EARTH_CIRCUMFERENCE } from '../constants';
/**
 * Utility class providing various helper functions for map calculations and transformations.
 */
class Util {
    /**
     * Clamps a number between a minimum and maximum value.
     * @param n - The number to clamp
     * @param min - The minimum allowed value
     * @param max - The maximum allowed value
     * @returns {number} The clamped number
     */
    static clamp(n, min, max) {
        return Math.min(max, Math.max(min, n));
    }
    /**
     * Creates a perspective projection matrix.
     * @param fovy - Field of view in degrees
     * @param aspect - Aspect ratio (width/height)
     * @param near - Near clipping plane distance
     * @param far - Far clipping plane distance
     * @returns {Matrix4Tuple} The perspective matrix as a flat array of 16 numbers
     */
    static makePerspectiveMatrix(fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);
        return [
            f / aspect,
            0,
            0,
            0,
            0,
            f,
            0,
            0,
            0,
            0,
            (far + near) * nf,
            -1,
            0,
            0,
            2 * far * near * nf,
            0,
        ];
    }
    /**
     * Converts longitude to Mercator X coordinate.
     * @param lng - Longitude in degrees
     * @returns {number} Mercator X coordinate (0-1 range)
     */
    static mercatorXFromLng(lng) {
        return (180 + lng) / 360;
    }
    /**
     * Converts latitude to Mercator Y coordinate.
     * @param lat - Latitude in degrees
     * @returns {number} Mercator Y coordinate (0-1 range)
     */
    static mercatorYFromLat(lat) {
        return ((180
            - (180 / Math.PI)
                * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)))
            / 360);
    }
    /**
     * Calculates view information based on transform, center, and bounding size.
     * @param transform - Maplibre transform object containing camera properties
     * @param center - Center coordinates (array of [lng, lat, alt] or string in format "lng,lat,alt")
     * @param boundingSize - Three.js Vector3 representing the bounding box dimensions
     * @returns {{center: (number)[], cameraHeight: number, zoom: number}} View information including center coordinates, camera height, and recommended zoom level
     */
    static getViewInfo(transform, center, boundingSize) {
        const fovInRadians = transform.fov * DEG2RAD;
        const pitchInRadians = transform.pitch * DEG2RAD;
        let _center = null;
        if (Array.isArray(center)) {
            _center = { lng: center[0], lat: center[1], alt: center[2] || 0 };
        }
        if (typeof center === 'string') {
            const arr = center.split(',');
            _center = { lng: Number(arr[0]), lat: Number(arr[1]), alt: Number(arr[2]) || 0 };
        }
        const distance = Math.max(boundingSize.x, boundingSize.y, boundingSize.z)
            / (2 * Math.tan(fovInRadians / 2));
        const cameraHeight = distance * Math.cos(pitchInRadians) + _center.alt;
        const pixelAltitude = Math.abs(Math.cos(pitchInRadians) * transform.cameraToCenterDistance);
        const metersInWorldAtLat = EARTH_CIRCUMFERENCE * Math.abs(Math.cos(_center.lat * DEG2RAD));
        const worldSize = (pixelAltitude / cameraHeight) * metersInWorldAtLat;
        const zoom = Math.round(Math.log2(worldSize / transform.tileSize));
        return {
            center: [_center.lng, _center.lat],
            cameraHeight,
            zoom,
        };
    }
    /**
     * Calculates height based on zoom level, latitude, and pitch.
     * @param transform - Maplibre transform object containing camera properties
     * @param zoom - Current zoom level
     * @param lat - Latitude in degrees
     * @param pitch - Camera pitch angle in degrees
     * @returns {number} Calculated height
     */
    static getHeightByZoom(transform, zoom, lat, pitch) {
        const pixelAltitude = Math.abs(Math.cos(pitch * DEG2RAD) * transform.cameraToCenterDistance);
        const metersInWorldAtLat = EARTH_CIRCUMFERENCE * Math.abs(Math.cos(lat * DEG2RAD));
        const worldSize = 2 ** zoom * transform.tileSize;
        return (pixelAltitude * metersInWorldAtLat) / worldSize;
    }
    /**
     * Calculates zoom level based on height, latitude, and pitch.
     * @param transform - Maplibre transform object containing camera properties
     * @param height - Current height
     * @param lat - Latitude in degrees
     * @param pitch - Camera pitch angle in degrees
     * @returns {number} Calculated zoom level (rounded to nearest integer)
     */
    static getZoomByHeight(transform, height, lat, pitch) {
        const pixelAltitude = Math.abs(Math.cos(pitch * DEG2RAD) * transform.cameraToCenterDistance);
        const metersInWorldAtLat = EARTH_CIRCUMFERENCE * Math.abs(Math.cos(lat * DEG2RAD));
        const worldSize = (pixelAltitude / height) * metersInWorldAtLat;
        return Math.round(Math.log2(worldSize / transform.tileSize));
    }
}
export default Util;
