/**
 * @author Caven Chen
 */

class GLTFGaussianSplattingExtension {
  constructor(parser) {
    this.parser = parser
    this.name = 'KHR_gaussian_splatting'
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
    return Promise.all(pending).then((results) => {})
  }
}

export default GLTFGaussianSplattingExtension
