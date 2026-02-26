import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import config from './config/index.js'
import { SplatWorker } from '@dvt3d/splat-mesh'
import { Tileset } from './src/index.js'

const map = window.map

const mapScene = new MTP.MapScene(map)

mapScene.addLight(new THREE.AmbientLight())

const splatWorker = new SplatWorker(
  'https://cdn.jsdelivr.net/npm/@dvt3d/splat-mesh@1.1.1/dist/workers/'
)
await splatWorker.init()

let tileset = new Tileset(3667783, {
  lruCache: {
    minSize: 60,
    maxSize: 80,
  },
  cesiumIon: {
    apiToken: config.cesium_key,
  },
  splatWorker: splatWorker,
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
