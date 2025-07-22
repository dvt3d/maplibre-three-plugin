import BillboardMaterial from './types/BillboardMaterial.js'

const cache = {}

class MaterialCache {
  /**
   *
   * @param options
   * @returns {*}
   */
  static createMaterial(options) {
    let key = ''
    if (options.type === 'billboard') {
      key = options.type + '-' + options.image
      if (!cache[key]) {
        cache[key] = new BillboardMaterial(options)
      }
    }
    return cache[key]
  }
}

export default MaterialCache
