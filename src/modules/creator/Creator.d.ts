/**
 * @Author: Caven Chen
 */
import { Group, Mesh } from 'three';
/**
 * A utility class for creating various 3D objects and groups
 */
declare class Creator {
    /**
     * Creates a Root Transform Center (RTC) group
     * @param {number | number[]} center - The center coordinates (either as a number or [longitude, latitude] array)
     * @param {[number, number, number]} [rotation] - Optional rotation angles [x, y, z] in radians
     * @param {[number, number, number]} [scale] - Optional scale factors [x, y, z]
     * @returns {Group} The created RTC group
     */
    static createRTCGroup(center: number | number[], rotation?: [number, number, number], scale?: [number, number, number]): Group;
    /**
     * Creates an RTC group specifically for Mercator projection
     * @param {number | number[]} center - The center coordinates (either as a number or [longitude, latitude] array)
     * @param {[number, number, number]} [rotation] - Optional rotation angles [x, y, z] in radians
     * @param {[number, number, number]} [scale] - Optional scale factors [x, y, z]
     * @returns {Group} The created Mercator RTC group
     */
    static createMercatorRTCGroup(center: number | number[], rotation?: [number, number, number], scale?: [number, number, number]): Group<import("three").Object3DEventMap>;
    /**
     * Creates a shadow-receiving ground plane
     * @param {number | number[]} center - The center coordinates (either as a number or [longitude, latitude] array)
     * @param {number} [width] - The width of the ground plane (default: 100)
     * @param {number} [height] - The height of the ground plane (default: 100)
     * @returns {Mesh} The created shadow ground mesh
     */
    static createShadowGround(center: number | number[], width?: number, height?: number): Mesh;
}
export default Creator;
