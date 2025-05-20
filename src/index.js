import { MapScene, SceneTransform, Creator } from './modules'

if (window.THREE) {
  window.MapScene = MapScene
  window.SceneTransform = SceneTransform
  window.Creator = Creator
}

export { MapScene, SceneTransform, Creator }
