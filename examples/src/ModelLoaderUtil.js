import {
  DRACOLoader,
  KTX2Loader,
  GLTFLoader,
  FBXLoader,
  OBJLoader,
} from 'three/addons'
import { LoadingManager } from 'three'

const loadingManager = new LoadingManager()

const dracoLoader = new DRACOLoader(loadingManager)
const ktx2loader = new KTX2Loader(loadingManager)
const gltfLoader = new GLTFLoader(loadingManager)
const fbxLoader = new FBXLoader(loadingManager)
const objLoader = new OBJLoader(loadingManager)

gltfLoader.setDRACOLoader(dracoLoader)
gltfLoader.setKTX2Loader(ktx2loader)

class ModelLoaderUtil {
  static getLoadingManager() {
    return loadingManager
  }

  /**
   *
   * @param options
   */
  static setDracoLoader(options = {}) {
    options.path && dracoLoader.setDecoderPath(options.path)
    return this
  }

  /**
   *
   * @returns {DRACOLoader}
   */
  static getDracoLoader() {
    return dracoLoader
  }

  static setKtx2loader(options = {}) {
    options.path && ktx2loader.setTranscoderPath(options.path)
    options.renderer && ktx2loader.detectSupport(options.renderer)
    return this
  }

  /**
   *
   * @param options
   * @returns {KTX2Loader}
   */
  static getKtx2loader() {
    return ktx2loader
  }

  /**
   *
   * @param url
   * @returns {Promise<unknown>}
   */
  static loadGLTF(url) {
    return new Promise((resolve, reject) => {
      gltfLoader.load(
        url,
        (gltf) => {
          resolve(gltf)
        },
        () => {},
        () => {
          reject()
        }
      )
    })
  }

  /**
   *
   * @param data
   * @param path
   * @returns {Promise<unknown>}
   */
  static parseGLTF(data, path) {
    return new Promise((resolve, reject) => {
      gltfLoader.parse(
        data,
        path,
        (gltf) => {
          resolve(gltf)
        },
        () => {
          reject()
        }
      )
    })
  }

  /**
   *
   * @param url
   * @returns {Promise<unknown>}
   */
  static loadFbx(url) {
    return new Promise((resolve, reject) => {
      fbxLoader.load(
        url,
        (fbx) => {
          resolve(fbx)
        },
        () => {},
        () => {
          reject()
        }
      )
    })
  }

  /**
   *
   * @param data
   * @param path
   * @returns {Promise<unknown>}
   */
  static parseFbx(data, path) {
    return new Promise((resolve) => {
      resolve(fbxLoader.parse(data, path))
    })
  }

  /**
   *
   * @param url
   * @returns {Promise<unknown>}
   */
  static loadObj(url) {
    return new Promise((resolve, reject) => {
      objLoader.load(
        url,
        (obj) => {
          resolve(obj)
        },
        () => {},
        () => {
          reject()
        }
      )
    })
  }

  /**
   *
   * @param data
   * @returns {Promise<unknown>}
   */
  static parseObj(data) {
    return new Promise((resolve) => {
      resolve(objLoader.parse(data))
    })
  }
}

export default ModelLoaderUtil
