/**
 * @author Caven Chen
 */
import { Group } from 'three'
const KHR_GAUSSIAN_SPLATTING = 'KHR_gaussian_splatting'
const KHR_GAUSSIAN_SPLATTING_COMPRESSION_SPZ_2 =
  'KHR_gaussian_splatting_compression_spz_2'

class GLTFGaussianSplattingExtension {
  constructor(parser) {
    this.parser = parser
    this.name = KHR_GAUSSIAN_SPLATTING
  }

  /**
   * @param meshIndex
   * @returns {Promise<Group<Object3DEventMap>>}
   */
  loadMesh(meshIndex) {
    const parser = this.parser
    const json = parser.json
    const extensionsUsed = json.extensionsUsed
    if (
      !extensionsUsed ||
      !extensionsUsed.includes(this.name) ||
      extensionsUsed.includes(KHR_GAUSSIAN_SPLATTING_COMPRESSION_SPZ_2)
    ) {
      return null
    }
    const meshDef = json.meshes[meshIndex]
    const primitives = meshDef.primitives
    const pending = []
    pending.push(parser.loadGeometries(primitives))
    return Promise.all(pending).then((results) => {
      const group = new Group()
      const geometries = results[0]
      const geometry = geometries[0]
      return group
    })
  }
}

export default GLTFGaussianSplattingExtension
