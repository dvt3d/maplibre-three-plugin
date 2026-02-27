import * as MTP from '@dvt3d/maplibre-three-plugin'
import { Model } from './src/index.js'

const map = window.map
map.setZoom(18)
map.setCenter([148.9819, -35.3981])

//init three scene
const mapScene = new MTP.MapScene(map)
mapScene.renderer.shadowMap.enabled = true

//init sun
const sun = new MTP.Sun()
sun.currentTime = '2025/7/12 12:00:00'
sun.castShadow = true
sun.setShadow()
mapScene.addLight(sun)

mapScene
  .on('preRender', (e) => {
    sun.update(e.frameState)
  })
  .on('postRender', () => {
    map.triggerRepaint()
  })

const shadowGround = MTP.Creator.createShadowGround([148.9819, -35.39847])
mapScene.addObject(shadowGround)

Model.fromGltfAsync({
  url: './assets/34M_17/34M_17.gltf',
  position: MTP.SceneTransform.lngLatToVector3(148.9819, -35.39847),
  castShadow: true,
}).then((model) => {
  mapScene.addObject(model)
})
