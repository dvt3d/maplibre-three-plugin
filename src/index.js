import { MapScene, SceneTransform } from './modules'

if (window.THREE) {
  window.MapScene = MapScene
  window.SceneTransform = SceneTransform
}

export { MapScene, SceneTransform }
