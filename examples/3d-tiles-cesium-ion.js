import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import config from './config.js'
import { ModelLoader, Tileset } from './src/index.js'

const map = window.map

const mapScene = new MTP.MapScene(map)

mapScene.addLight(new THREE.AmbientLight())

ModelLoader.setDracoLoader({
  path: 'https://cdn.jsdelivr.net/npm/three/examples/jsm/libs/draco/',
})

ModelLoader.setKtx2loader({
  path: 'https://cdn.jsdelivr.net/npm/three/examples/jsm/libs/basis/',
  renderer: mapScene.renderer,
})

let tileset = new Tileset(40866, {
  dracoLoader: ModelLoader.getDracoLoader(),
  ktxLoader: ModelLoader.getKtx2loader(),
  cesiumIon: {
    apiToken: config.cesium_key,
  },
})

tileset.autoDisableRendererCulling = true
tileset.on('loaded', () => {
  mapScene.addObject(tileset)
  tileset.setHeight(-70)
  mapScene.flyTo(tileset)
})
mapScene
  .on('preRender', (e) => {
    tileset.update(e.frameState)
  })
  .on('postRender', () => {
    map.triggerRepaint()
  })
