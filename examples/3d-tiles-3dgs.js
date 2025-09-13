import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import config from './config.js'
import { Tileset } from './src/index.js'

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

map.showTileBoundaries = true

const mapScene = new MTP.MapScene(map)

mapScene.addLight(new THREE.AmbientLight())

let tileset = new Tileset(3667783, {
  lruCache: {
    minSize: 60,
    maxSize: 80,
  },
  cesiumIon: {
    apiToken: config.cesium_key,
  },
})

tileset.autoDisableRendererCulling = true

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
