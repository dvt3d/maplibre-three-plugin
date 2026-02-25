/**
 * @author Caven Chen
 */
import { Group } from 'three'
import { loadSpz } from '@spz-loader/core'
import { SplatMesh } from '@dvt3d/splat-mesh'
import { SpzLoader } from '3dgs-loader'

class GLTFSpz2GaussianSplattingExtension {
  constructor(parser, worker) {
    this.parser = parser
    this.worker = worker
    this.name = 'KHR_gaussian_splatting_compression_spz_2'
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
      const attribute = bufferViews[0]
      const mesh = new SplatMesh()
      mesh.attachWorker(this.worker)
      mesh.setVertexCount(attribute.numPoints)
      // await mesh.setDataFromSpz(attribute)
      // group.add(mesh)
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
      if (
        extensions['KHR_gaussian_splatting'] &&
        extensions['KHR_gaussian_splatting'].extensions &&
        extensions['KHR_gaussian_splatting'].extensions[this.name]
      ) {
        pendingBufferViews.push(
          parser
            .getDependency(
              'bufferView',
              extensions['KHR_gaussian_splatting'].extensions[this.name]
                .bufferView
            )
            .then((bufferView) => loadSpz(bufferView))
        )
        pendingBufferViews.push(
          parser
            .getDependency(
              'bufferView',
              extensions['KHR_gaussian_splatting'].extensions[this.name]
                .bufferView
            )
            .then((bufferView) =>
              this.spzLoader.parseAsSplat(new Uint8Array(bufferView))
            )
        )
      } else {
        if (extensions[this.name]) {
          pendingBufferViews.push(
            parser
              .getDependency('bufferView', extensions[this.name].bufferView)
              .then((bufferView) => loadSpz(bufferView))
          )
        }
      }
    }
    return Promise.all(pendingBufferViews).then((bufferViews) => {
      return bufferViews
    })
  }
}

export default GLTFSpz2GaussianSplattingExtension
