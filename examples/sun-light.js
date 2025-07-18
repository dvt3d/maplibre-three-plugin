import maplibregl from 'maplibre-gl'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import config from './config.js'
import Model from './src/Model.js'

const map = new maplibregl.Map({
  container: 'map-container', // container id
  style:
    'https://api.maptiler.com/maps/basic-v2/style.json?key=' +
    config.maptiler_key, // style URL
  zoom: 18,
  center: [148.9819, -35.3981],
  pitch: 60,
  canvasContextAttributes: { antialias: true },
  maxPitch: 85,
})

const mapScene = new MTP.MapScene(map)

const sun = new MTP.Sun()
mapScene.addLight(sun)

mapScene
  .on('preRender', () => {
    sun.update({
      center: map.getCenter(),
      scene: mapScene,
    })
  })
  .on('postRender', () => {
    map.triggerRepaint()
  })

Model.fromGltfAsync({
  url: './assets/34M_17/34M_17.gltf',
  center: [148.9819, -35.39847],
}).then((model) => {
  mapScene.addObject(model)
})
