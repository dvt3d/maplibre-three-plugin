import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import config from './config.js'
import { Tileset, ModelLoader } from './src/index.js'

const map = new maplibregl.Map({
  container: 'map',
  style:
    'https://api.maptiler.com/maps/basic-v2/style.json?key=' +
    config.maptiler_key,
  maxPitch: 85,
  pitch: 60,
  canvasContextAttributes: { antialias: true },
})

const mapScene = new MTP.MapScene(map)

mapScene.addLight(new THREE.AmbientLight())

ModelLoader.setDracoLoader({
  path: 'https://cdn.jsdelivr.net/npm/three/examples/jsm/libs/draco/',
})

ModelLoader.setKtx2loader({
  path: 'https://cdn.jsdelivr.net/npm/three/examples/jsm/libs/basis/',
  renderer: mapScene.renderer,
})

let ljz_url = '//resource.dvgis.cn/data/3dtiles/ljz/tileset.json'

let tileset = new Tileset(ljz_url, {
  dracoLoader: ModelLoader.getDracoLoader(),
  ktxLoader: ModelLoader.getKtx2loader(),
})

tileset.autoDisableRendererCulling = true
tileset.errorTarget = 6

tileset.on('loaded', () => {
  mapScene.addObject(tileset)
  mapScene.flyTo(tileset)
})

mapScene
  .on('preRender', (e) => {
    tileset.update(e.frameState)
  })
  .on('postRender', () => {
    map.triggerRepaint()
  })
