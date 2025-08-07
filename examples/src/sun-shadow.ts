import maplibregl from 'maplibre-gl'
import * as MTP from '../../src'
import config from './config'
import { Model } from './modules'
import 'maplibre-gl/dist/maplibre-gl.css'

const map = new maplibregl.Map({
  container: 'map-container', // container id
  style:
    `https://api.maptiler.com/maps/basic-v2/style.json?key=${
      config.maptiler_key}`, // style URL
  zoom: 18,
  center: [148.9819, -35.3981],
  pitch: 60,
  canvasContextAttributes: { antialias: true },
  maxPitch: 85,
})

// init three scene
const mapScene = new MTP.MapScene(map)
mapScene.renderer.shadowMap.enabled = true

// init sun
const sun = new MTP.Sun()
sun.currentTime = '2025/7/12 12:00:00'
sun.castShadow = true
sun.setShadow()
// eslint-disable-next-line ts/ban-ts-comment
// @ts-expect-error
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
  url: '/maplibre-three-plugin/assets/34M_17/34M_17.gltf',
  position: MTP.SceneTransform.lngLatToVector3(148.9819, -35.39847),
  castShadow: true,
}).then((model) => {
  // eslint-disable-next-line ts/ban-ts-comment
  // @ts-expect-error
  mapScene.addObject(model)
})
