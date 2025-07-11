import maplibregl from 'maplibre-gl'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import config from './config.js'
import Sun from './src/Sun.js'
import ModelLoaderUtil from './src/ModelLoaderUtil.js'

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

const sun = new Sun()
mapScene.lights.add(sun.root)

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

// add model
ModelLoaderUtil.loadGLTF('./assets/34M_17/34M_17.gltf').then((gltf) => {
  let rtcGroup = MTP.Creator.createRTCGroup([148.9819, -35.39847])
  rtcGroup.add(gltf.scene)
  mapScene.world.add(rtcGroup)
})
