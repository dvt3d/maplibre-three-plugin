import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import config from './config.js'
import { Tileset, WorkerTaskProcessor } from './src/index.js'

const map = new maplibregl.Map({
  container: 'map',
  style:
    'https://api.maptiler.com/maps/basic-v2/style.json?key=' +
    config.maptiler_key,
  maxPitch: 85,
  pitch: 60,
  canvasContextAttributes: { antialias: true },
  maxZoom: 30,
  center: [113.05, 28.29],
  zoom: 18,
})

const mapScene = new MTP.MapScene(map)

mapScene.addLight(new THREE.AmbientLight())

const splatWorker = new WorkerTaskProcessor(
  new URL('./src/wasm/splat/wasm_splat.worker.min.js', import.meta.url).href
)
await splatWorker.init()
let tileset = new Tileset('http://localhost:8080/3dties-ggy/tileset.json', {
  splatThreshold: -0.0000001,
  splatWorker: splatWorker,
})

tileset.autoDisableRendererCulling = true

tileset.on('loaded', () => {
  mapScene.addObject(tileset)
  tileset.position = MTP.SceneTransform.lngLatToVector3(
    113.03932921746389,
    28.294146211897612,
    10
  )
  tileset.setRotation([-Math.PI / 2, -Math.PI / 2, 0])
})

mapScene
  .on('preRender', (e) => {
    tileset.update(e.frameState)
  })
  .on('postRender', () => {
    map.triggerRepaint()
  })
