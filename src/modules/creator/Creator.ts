/**
 * @Author: Caven Chen
 */
import { Group, Mesh, PlaneGeometry, ShadowMaterial } from 'three'
import SceneTransform from '../transform/SceneTransform'

class Creator {
  /**
   *
   * @param center
   * @param rotation
   * @param scale
   */
  static createRTCGroup(
    center: number | number[],
    rotation: number[],
    scale: number[]
  ): Group {
    const group = new Group()
    group.name = 'rtc'
    group.position.copy(SceneTransform.lngLatToVector3(center))

    if (rotation) {
      group.rotateX(rotation[0] || 0)
      group.rotateY(rotation[1] || 0)
      group.rotateZ(rotation[2] || 0)
    } else {
      group.rotateX(Math.PI / 2)
      group.rotateY(Math.PI)
    }

    if (scale) {
      group.scale.set(scale[0] || 1, scale[1] || 1, scale[2] || 1)
    } else {
      let lat_scale = 1
      if (Array.isArray(center)) {
        lat_scale = SceneTransform.projectedUnitsPerMeter(center[1])
      }
      group.scale.set(lat_scale, lat_scale, lat_scale)
    }
    return group
  }

  /**
   *
   * @param center
   * @param rotation
   * @param scale
   */
  static createMercatorRTCGroup(
    center: number | number[],
    rotation: number[],
    scale: number[]
  ): Group {
    const group = this.createRTCGroup(center, rotation, scale)
    if (!scale) {
      let lat_scale = 1
      let mercator_scale = SceneTransform.projectedMercatorUnitsPerMeter()
      if (Array.isArray(center)) {
        lat_scale = SceneTransform.projectedUnitsPerMeter(center[1])
      }
      group.scale.set(mercator_scale, mercator_scale, lat_scale)
    }
    return group
  }

  /**
   *
   * @param center
   * @param width
   * @param height
   * @returns {Mesh}
   */
  static createShadowGround(
    center: number | number[],
    width?: number,
    height?: number
  ): Mesh {
    const geo = new PlaneGeometry(width || 100, height || 100)
    const mat = new ShadowMaterial({
      opacity: 0.5,
      transparent: true,
    })
    let mesh = new Mesh(geo, mat)
    mesh.position.copy(SceneTransform.lngLatToVector3(center))
    mesh.receiveShadow = true
    mesh.name = 'shadow-ground'
    return mesh
  }
}

export default Creator
