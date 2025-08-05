import type { Map as IMap } from 'maplibre-gl'
import type MapScene from '../scene/MapScene'
import CameraSync from '../camera/CameraSync'

/**
 * A custom MapLibre GL layer that integrates Three.js rendering
 */
class ThreeLayer {
  /**
   * The unique identifier of the layer
   * @private
   */
  private readonly _id: string

  /**
   * Reference to the MapScene instance
   * @private
   */
  private _mapScene: MapScene | null

  /**
   * Camera synchronization handler
   * @private
   */
  private _cameraSync: CameraSync | null

  /**
   * Creates a new ThreeLayer instance
   * @param {string} id - The unique identifier for the layer
   * @param {MapScene} mapScene - The MapScene instance to associate with this layer
   */
  constructor(id: string, mapScene: MapScene) {
    this._id = id
    this._mapScene = mapScene
    this._cameraSync = new CameraSync(
      this._mapScene.map,
      this._mapScene.world,
      this._mapScene.camera,
    )
  }

  /**
   * Gets the layer's unique identifier
   * @returns {string} The layer's ID
   */
  get id(): string {
    return this._id
  }

  /**
   * Gets the layer type
   * @returns {string} The layer type ('custom')
   */
  get type(): 'custom' {
    return 'custom'
  }

  /**
   * Gets the rendering mode
   * @returns {string} The rendering mode ('3d')
   */
  get renderingMode(): '3d' {
    return '3d'
  }

  /**
   * Called when the layer is added to the map
   * @param {IMap} _map - The MapLibre map instance
   * @param {WebGL2RenderingContext} _gl - The WebGL context
   */
  onAdd(_map: IMap, _gl: WebGL2RenderingContext) {
    this._cameraSync!.syncCamera(true)
  }

  /**
   * Renders the Three.js scene
   */
  render() {
    this._mapScene!.render()
  }

  /**
   * Called when the layer is removed from the map
   */
  onRemove() {
    this._cameraSync = null
    this._mapScene = null
  }
}

export default ThreeLayer
