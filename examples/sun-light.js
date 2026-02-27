import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import { Model } from './src/index.js'

const map = window.map
map.setZoom(18)
map.setCenter([148.9819, -35.3981])

//init three scene
const mapScene = new MTP.MapScene(map)

const sun = new MTP.Sun()
mapScene.addLight(sun)

mapScene
  .on('preRender', (e) => {
    sun.update(e.frameState)
  })
  .on('postRender', () => {
    map.triggerRepaint()
  })

Model.fromGltfAsync({
  url: './assets/34M_17/34M_17.gltf',
  position: MTP.SceneTransform.lngLatToVector3(148.9819, -35.39847, 0),
}).then((model) => {
  mapScene.addObject(model)
})
