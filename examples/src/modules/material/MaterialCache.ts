/**
 * @author Caven Chen
 */

import BillboardMaterial from './types/BillboardMaterial'

const cache: Record<string, any> = {}

interface CacheMaterialOptions {
  type: string
  image: string
}

class MaterialCache {
  /**
   *
   * @param options
   * @returns {*} cache material
   */
  static createMaterial(options: CacheMaterialOptions) {
    let key = ''
    if (options.type === 'billboard') {
      key = `${options.type}-${options.image}`
      if (!cache[key]) {
        cache[key] = new BillboardMaterial(options)
      }
    }
    return cache[key]
  }
}

export default MaterialCache
