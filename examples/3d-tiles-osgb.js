import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import config from './config.js'
import ModelLoaderUtil from './src/ModelLoaderUtil.js'
import Tileset from './src/Tileset.js'

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

mapScene.lights.add(new THREE.AmbientLight())

ModelLoaderUtil.setDracoLoader({
  path: 'https://cdn.jsdelivr.net/npm/three/examples/jsm/libs/draco/',
})

ModelLoaderUtil.setKtx2loader({
  path: 'https://cdn.jsdelivr.net/npm/three/examples/jsm/libs/basis/',
  renderer: mapScene.renderer,
})

let ljz_url = '//resource.dvgis.cn/data/3dtiles/dayanta/tileset.json'

let tileset = new Tileset(ljz_url, {
  dracoLoader: ModelLoaderUtil.getDracoLoader(),
  ktxLoader: ModelLoaderUtil.getKtx2loader(),
})

tileset.autoDisableRendererCulling = true
tileset.errorTarget = 6

tileset.on('loaded', () => {
  mapScene.addObject(tileset)
  tileset.setHeight(-420)
  mapScene.flyTo(tileset)
})

mapScene
  .on('preRender', () => {
    tileset.update({ scene: mapScene })
  })
  .on('postRender', () => {
    map.triggerRepaint()
  })
