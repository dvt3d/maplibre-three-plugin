/**
 * @author Caven Chen
 */
import { Group } from 'three'
import { SplatMesh } from '@sparkjsdev/spark'
const KHR_SPZ_GAUSSIAN_SPLATS_COMPRESSION =
  'KHR_spz_gaussian_splats_compression'
class GLTFSpzGaussianSplattingExtension {
  constructor(parser) {
    this.parser = parser
    this.name = KHR_SPZ_GAUSSIAN_SPLATS_COMPRESSION
  }

  /**
   *
   * @param meshIndex
   * @returns {Promise<Group<Object3DEventMap>>}
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
    pending.push(this.loadBufferViews(primitives))
    return Promise.all(pending).then((results) => {
      const group = new Group()
      if (!results) {
        return group
      }
      const bufferViews = results[0]
      if (!bufferViews) {
        return group
      }
      const mesh = new SplatMesh({ fileBytes: bufferViews[0], fileType: 'spz' })
      group.add(mesh)
      return group
    })
  }
  /**
   *
   * @param primitives
   * @returns {Promise<Array<Awaited<*>>>}
   */
  loadBufferViews(primitives) {
    const parser = this.parser
    const pendingBufferViews = []
    for (let i = 0; i < primitives.length; i++) {
      const primitive = primitives[i]
      const extensions = primitive.extensions
      if (extensions[this.name]) {
        pendingBufferViews.push(
          parser.getDependency('bufferView', extensions[this.name].bufferView)
        )
      }
    }
    return Promise.all(pendingBufferViews)
  }
}

export default GLTFSpzGaussianSplattingExtension
