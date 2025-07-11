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

//init three scene
const mapScene = new MTP.MapScene(map)
mapScene.renderer.shadowMap.enabled = true

//init sun
const sun = new Sun()
sun.currentTime = '2025/7/12 12:00:00'
sun.castShadow = true
sun.setShadow()
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

const shadowGround = MTP.Creator.createShadowGround([148.9819, -35.39847])
mapScene.world.add(shadowGround)

// add model
ModelLoaderUtil.loadGLTF('./assets/34M_17/34M_17.gltf').then((gltf) => {
  let rtcGroup = MTP.Creator.createRTCGroup([148.9819, -35.39847])
  rtcGroup.add(gltf.scene)
  rtcGroup.traverse(function (obj) {
    if (obj.isMesh) obj.castShadow = true
  })
  mapScene.world.add(rtcGroup)
})
