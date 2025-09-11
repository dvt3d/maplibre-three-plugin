import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import config from './config.js'
import { SplatLoader } from './src/index.js'

const map = new maplibregl.Map({
  container: 'map',
  style:
    'https://api.maptiler.com/maps/basic-v2/style.json?key=' +
    config.maptiler_key,
  maxPitch: 85,
  pitch: 60,
  canvasContextAttributes: { antialias: true },
  maxZoom: 30,
  center: [120.71508193750839, 31.270782107613073],
  zoom: 18,
})

const mapScene = new MTP.MapScene(map)

mapScene.addLight(new THREE.AmbientLight())

let rtc = new THREE.Group()
rtc.position.copy(
  MTP.SceneTransform.lngLatToVector3(120.71508193750839, 31.270782107613073)
)

rtc.rotateX(-Math.PI / 2)
rtc.rotateY(Math.PI / 2)

mapScene.addObject(rtc)

const splatLoader = new SplatLoader()

splatLoader.loadStream('./assets/yqjt.splat', (mesh) => {
  mesh.threshold = -0.0000001
  rtc.add(mesh)
})

mapScene.on('postRender', () => {
  map.triggerRepaint()
})
