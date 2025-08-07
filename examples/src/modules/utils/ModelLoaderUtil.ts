/**
 * Utility class for loading various 3D model formats
 * using Three.js loaders with proper configuration
 */
import type { Group, WebGLRenderer } from 'three'
import type { GLTF } from 'three-stdlib'
import type { WebGPURenderer } from 'three/webgpu'
import { LoadingManager } from 'three'
import {
  DRACOLoader,
  FBXLoader,
  GLTFLoader,
  KTX2Loader,
  OBJLoader,
} from 'three-stdlib'

const loadingManager = new LoadingManager()

const dracoLoader = new DRACOLoader(loadingManager)
const ktx2loader = new KTX2Loader(loadingManager)
const gltfLoader = new GLTFLoader(loadingManager)
const fbxLoader = new FBXLoader(loadingManager)
const objLoader = new OBJLoader(loadingManager)

gltfLoader.setDRACOLoader(dracoLoader)
gltfLoader.setKTX2Loader(ktx2loader)
/**
 * Options for configuring DRACO loader
 */
interface SetDracoLoaderOptions {
  path: string
}

/**
 * Options for configuring KTX2 loader
 */
interface SetKtx2loaderOptions {
  path: string
  renderer: WebGLRenderer | WebGPURenderer
}
/**
 * Utility class providing methods for loading 3D models
 * with different formats using Three.js loaders
 */
class ModelLoaderUtil {
  /**
   * Gets the shared loading manager
   * @returns {LoadingManager} The loading manager instance
   */
  static getLoadingManager(): LoadingManager {
    return loadingManager
  }

  /**
   * Configures the DRACO loader with the specified options
   * @param {SetDracoLoaderOptions} options - DRACO loader configuration options
   * @returns {typeof ModelLoaderUtil} The ModelLoaderUtil class for chaining
   */
  static setDracoLoader(options: SetDracoLoaderOptions): typeof ModelLoaderUtil {
    options.path && dracoLoader.setDecoderPath(options.path)
    return this
  }

  /**
   * Gets the configured DRACO loader
   * @returns {DRACOLoader} The DRACO loader instance
   */
  static getDracoLoader(): DRACOLoader {
    return dracoLoader
  }

  /**
   * Configures the KTX2 loader with the specified options
   * @param {SetKtx2loaderOptions} options - KTX2 loader configuration options
   * @returns {typeof ModelLoaderUtil} The ModelLoaderUtil class for chaining
   */
  static setKtx2loader(options: SetKtx2loaderOptions): typeof ModelLoaderUtil {
    options.path && ktx2loader.setTranscoderPath(options.path)
    options.renderer && ktx2loader.detectSupport(options.renderer as WebGLRenderer)
    return this
  }

  /**
   * Gets the configured KTX2 loader
   * @returns {KTX2Loader} The KTX2 loader instance
   */
  static getKtx2loader(): KTX2Loader {
    return ktx2loader
  }

  /**
   * Loads a GLTF model from the specified URL
   * @param {string} url - URL of the GLTF model
   * @returns {Promise<GLTF>} Promise resolving to the loaded GLTF object
   */
  static loadGLTF(url: string): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      gltfLoader.load(
        url,
        (gltf) => {
          resolve(gltf)
        },
        () => {},
        () => {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject()
        },
      )
    })
  }

  /**
   * Parses GLTF data from an ArrayBuffer or string
   * @param {ArrayBuffer | string} data - GLTF data to parse
   * @param {string} path - Base path for resolving resources
   * @returns {Promise<GLTF>} Promise resolving to the parsed GLTF object
   */
  static parseGLTF(data: ArrayBuffer | string, path: string): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      gltfLoader.parse(
        data,
        path,
        (gltf) => {
          resolve(gltf)
        },
        () => {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject()
        },
      )
    })
  }

  /**
   * Loads an FBX model from the specified URL
   * @param {string} url - URL of the FBX model
   * @returns {Promise<Group>} Promise resolving to the loaded FBX object
   */
  static loadFbx(url: string): Promise<Group> {
    return new Promise((resolve, reject) => {
      fbxLoader.load(
        url,
        (fbx) => {
          resolve(fbx)
        },
        () => {},
        () => {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject()
        },
      )
    })
  }

  /**
   * Parses FBX data from an ArrayBuffer or string
   * @param {ArrayBuffer | string} data - FBX data to parse
   * @param {string} path - Base path for resolving resources
   * @returns {Promise<Group>} Promise resolving to the parsed FBX object
   */
  static parseFbx(data: ArrayBuffer | string, path: string): Promise<Group> {
    return new Promise((resolve) => {
      resolve(fbxLoader.parse(data, path))
    })
  }

  /**
   * Loads an OBJ model from the specified URL
   * @param {string} url - URL of the OBJ model
   * @returns {Promise<Group>} Promise resolving to the loaded OBJ object
   */
  static loadObj(url: string): Promise<Group> {
    return new Promise((resolve, reject) => {
      objLoader.load(
        url,
        (obj) => {
          resolve(obj)
        },
        () => {},
        () => {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject()
        },
      )
    })
  }

  /**
   * Parses OBJ data from a string
   * @param {string} data - OBJ data to parse
   * @returns {Promise<Group>} Promise resolving to the parsed OBJ object
   */
  static parseObj(data: string): Promise<Group> {
    return new Promise((resolve) => {
      resolve(objLoader.parse(data))
    })
  }
}

export default ModelLoaderUtil
