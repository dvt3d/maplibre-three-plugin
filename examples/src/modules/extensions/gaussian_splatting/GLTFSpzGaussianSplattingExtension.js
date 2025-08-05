/**
 * @author Caven Chen
 */

import { loadSpz } from '@spz-loader/core'
import { Group, Points, PointsMaterial } from 'three'

class GLTFSpzGaussianSplattingExtension {
  constructor(parser) {
    this.parser = parser
    this.name = 'KHR_spz_gaussian_splats_compression'
  }

  /**
   *
   * @param meshIndex
   * @returns {Promise<Awaited<unknown>[]>}
   */
  loadMesh(meshIndex) {
    const parser = this.parser
    const json = parser.json
    const extensionsUsed = json.extensionsUsed
    if (!extensionsUsed || !extensionsUsed.includes(this.name)) {
      return null
    }
    const meshDef = json.meshes[meshIndex]
    const primitives = meshDef.primitives
    const pending = []
    pending.push(parser.loadGeometries(primitives))
    pending.push(this.loadBufferViews(primitives))
    return Promise.all(pending).then((results) => {
      const geometries = results[0]
      const bufferViews = results[1]
      const group = new Group()
      for (let i = 0; i < geometries.length; i++) {
        const geometry = geometries[i]
        const bufferView = bufferViews[i]
        geometry.getAttribute('position').array = bufferView.positions
        const points = new Points(
          geometry,
          new PointsMaterial({
            color: 0xFF0000,
          }),
        )
        group.add(points)
      }
      return group
    })
  }

  /**
   *
   * @param primitives
   * @returns {*[]}
   */
  loadBufferViews(primitives) {
    const parser = this.parser
    const pendingBufferViews = []
    for (let i = 0; i < primitives.length; i++) {
      const primitive = primitives[i]
      const extensions = primitive.extensions
      if (extensions[this.name]) {
        pendingBufferViews.push(
          parser
            .getDependency('bufferView', extensions[this.name].bufferView)
            .then(bufferView => loadSpz(bufferView)),
        )
      }
    }
    return Promise.all(pendingBufferViews).then((bufferViews) => {
      return bufferViews
    })
  }
}

export default GLTFSpzGaussianSplattingExtension
