import { MapScene, SceneTransform, Creator, Sun } from './modules'

if (window.THREE) {
  window.MapScene = MapScene
  window.SceneTransform = SceneTransform
  window.Creator = Creator
  window.Sun = Sun
}

export { MapScene, SceneTransform, Creator, Sun }
