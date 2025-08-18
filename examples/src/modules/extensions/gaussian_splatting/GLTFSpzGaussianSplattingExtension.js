/**
 * @author Caven Chen
 */
import { Group } from 'three'
import { loadSpz } from '@spz-loader/core'
import SplatMesh from './SplatMesh.js'

const rowLength = 3 * 4 + 3 * 4 + 4 + 4

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
      let group = new Group()
      const bufferViews = results[1]
      const attribute = bufferViews[0]
      let mesh = new SplatMesh(attribute.numPoints)
      mesh.setDataFromAttribute(attribute)
      group.add(mesh)
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
            .then((bufferView) => loadSpz(bufferView))
        )
      }
    }
    return Promise.all(pendingBufferViews).then((bufferViews) => {
      return bufferViews
    })
  }
}

export default GLTFSpzGaussianSplattingExtension
