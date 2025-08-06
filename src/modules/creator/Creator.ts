/**
 * @Author: Caven Chen
 */
import { Group, Mesh, PlaneGeometry, ShadowMaterial } from 'three'
import SceneTransform from '../transform/SceneTransform'

/**
 * A utility class for creating various 3D objects and groups
 */
class Creator {
  /**
   * Creates a Root Transform Center (RTC) group
   * @param {number | number[]} center - The center coordinates (either as a number or [longitude, latitude] array)
   * @param {[number, number, number]} [rotation] - Optional rotation angles [x, y, z] in radians
   * @param {[number, number, number]} [scale] - Optional scale factors [x, y, z]
   * @returns {Group} The created RTC group
   */
  static createRTCGroup(center: number | number[], rotation?: [number, number, number], scale?: [number, number, number]): Group {
    const group = new Group()
    group.name = 'rtc'
    group.position.copy(SceneTransform.lngLatToVector3(center))

    if (rotation) {
      group.rotateX(rotation[0] || 0)
      group.rotateY(rotation[1] || 0)
      group.rotateZ(rotation[2] || 0)
    }
    else {
      group.rotateX(Math.PI / 2)
      group.rotateY(Math.PI)
    }

    if (scale) {
      group.scale.set(scale[0] || 1, scale[1] || 1, scale[2] || 1)
    }
    else {
      let lat_scale = 1
      if (Array.isArray(center)) {
        lat_scale = SceneTransform.projectedUnitsPerMeter(center[1])
      }
      // todo: center must not be a string
      // else if (typeof center === 'string') {
      //   lat_scale = SceneTransform.projectedUnitsPerMeter(center.split(',')[1])
      // }
      group.scale.set(lat_scale, lat_scale, lat_scale)
    }
    return group
  }

  /**
   * Creates an RTC group specifically for Mercator projection
   * @param {number | number[]} center - The center coordinates (either as a number or [longitude, latitude] array)
   * @param {[number, number, number]} [rotation] - Optional rotation angles [x, y, z] in radians
   * @param {[number, number, number]} [scale] - Optional scale factors [x, y, z]
   * @returns {Group} The created Mercator RTC group
   */
  static createMercatorRTCGroup(center: number | number[], rotation?: [number, number, number], scale?: [number, number, number]) {
    const group = this.createRTCGroup(center, rotation, scale)
    if (!scale) {
      let lat_scale = 1
      const mercator_scale = SceneTransform.projectedMercatorUnitsPerMeter()
      if (Array.isArray(center)) {
        lat_scale = SceneTransform.projectedUnitsPerMeter(center[1])
      }
      // todo: center must not be a string
      // else if (typeof center === 'string') {
      //   lat_scale = SceneTransform.projectedUnitsPerMeter(center.split(',')[1])
      // }
      group.scale.set(mercator_scale, mercator_scale, lat_scale)
    }
    return group
  }

  /**
   * Creates a shadow-receiving ground plane
   * @param {number | number[]} center - The center coordinates (either as a number or [longitude, latitude] array)
   * @param {number} [width] - The width of the ground plane (default: 100)
   * @param {number} [height] - The height of the ground plane (default: 100)
   * @returns {Mesh} The created shadow ground mesh
   */
  static createShadowGround(center: number | number[], width: number = 100, height: number = 100): Mesh {
    const geo = new PlaneGeometry(width, height)
    const mat = new ShadowMaterial({
      opacity: 0.5,
      transparent: true,
    })
    const mesh = new Mesh(geo, mat)
    mesh.position.copy(SceneTransform.lngLatToVector3(center))
    mesh.receiveShadow = true
    mesh.name = 'shadow-ground'
    return mesh
  }
}

export default Creator
