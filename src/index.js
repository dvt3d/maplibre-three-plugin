import { MapScene, SceneTransform, Creator, SunCalc } from './modules'

if (window.THREE) {
  window.MapScene = MapScene
  window.SceneTransform = SceneTransform
  window.Creator = Creator
  window.SunCalc = SunCalc
}

export { MapScene, SceneTransform, Creator, SunCalc }
