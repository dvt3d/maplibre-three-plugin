import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import config from './config.js'
import { SplatLoader, WorkerTaskProcessor } from './src/index.js'

const map = new maplibregl.Map({
  container: 'map',
  style:
    'https://api.maptiler.com/maps/basic-v2/style.json?key=' +
    config.maptiler_key,
  maxPitch: 85,
  pitch: 60,
  canvasContextAttributes: { antialias: true },
  maxZoom: 30,
})

const mapScene = new MTP.MapScene(map)

mapScene.addLight(new THREE.AmbientLight())

let rtc = MTP.Creator.createMercatorRTCGroup(
  [113.03932757890647, 28.294469403362328, 2],
  [-Math.PI / 2, Math.PI / 2]
)
mapScene.addObject(rtc)

const splatLoader = new SplatLoader()

splatLoader.load('http://localhost:8080/ggy.splat', (mesh) => {
  mesh.threshold = -0.0000001
  rtc.add(mesh)
  mapScene.flyTo(rtc)
})

mapScene.on('postRender', () => {
  map.triggerRepaint()
})
