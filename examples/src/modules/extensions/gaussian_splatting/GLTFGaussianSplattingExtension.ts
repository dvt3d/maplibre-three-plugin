/**
 * @author Caven Chen
 */

import type { GLTFLoaderPlugin, GLTFParser } from 'three-stdlib'

class GLTFGaussianSplattingExtension implements GLTFLoaderPlugin {
  private readonly parser: GLTFParser
  public name: string
  constructor(parser: GLTFParser) {
    this.parser = parser
    this.name = 'KHR_gaussian_splatting'
  }

  /**
   *
   * @param meshIndex
   * @returns {Promise<Awaited<unknown>[]>} Awaited<unknown>[]
   */
  loadMesh(meshIndex: number) {
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
    return Promise.all(pending).then(_results => meshDef)
  }
}

export default GLTFGaussianSplattingExtension
