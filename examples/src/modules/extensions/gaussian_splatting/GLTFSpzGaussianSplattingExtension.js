/**
 * @author Caven Chen
 */
import { Group } from 'three'
import { SpzLoader } from '3dgs-loader'
import { SplatMesh } from '@dvt3d/splat-mesh'

class GLTFSpzGaussianSplattingExtension {
  constructor(parser, worker) {
    this.parser = parser
    this.worker = worker
    this.name = 'KHR_spz_gaussian_splats_compression'
    this.spzLoader = new SpzLoader()
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
    pending.push(this.loadBufferViews(primitives))
    return Promise.all(pending).then(async (results) => {
      const group = new Group()
      const bufferViews = results[0]
      const data = bufferViews[0]
      const mesh = new SplatMesh()
      mesh.attachWorker(this.worker)
      mesh.setVertexCount(data.numSplats)
      await mesh.setDataFromBuffer(data.buffer)
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
            .then((bufferView) =>
              this.spzLoader.parseAsSplat(new Uint8Array(bufferView))
            )
        )
      }
    }
    return Promise.all(pendingBufferViews).then((bufferViews) => {
      return bufferViews
    })
  }
}

export default GLTFSpzGaussianSplattingExtension
