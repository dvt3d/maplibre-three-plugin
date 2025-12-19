/**
 * @author Caven Chen
 */
import { Group } from 'three'
import SplatMesh from './SplatMesh.js'

class GLTFGaussianSplattingExtension {
  constructor(parser, worker) {
    this.parser = parser
    this.worker = worker
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
    if (
      !extensionsUsed ||
      !extensionsUsed.includes(this.name) ||
      extensionsUsed.includes('KHR_gaussian_splatting_compression_spz_2')
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
      const mesh = new SplatMesh()
      mesh.vertexCount = geometry.attributes.position.count
      mesh.worker = this.worker
      mesh.setDataFromGeometry(geometry)
      group.add(mesh)
      return group
    })
  }
}

export default GLTFGaussianSplattingExtension
