import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
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

let url = '//resource.dvgis.cn/data/3dtiles/dayanta/tileset.json'

let tileset = new Tileset(url, {
  dracoLoader: ModelLoader.getDracoLoader(),
  ktxLoader: ModelLoader.getKtx2loader(),
})

tileset.autoDisableRendererCulling = true
tileset.errorTarget = 6

tileset.on('loaded', () => {
  mapScene.addObject(tileset)
  tileset.setHeight(-420)
  mapScene.flyTo(tileset)
})

mapScene
  .on('preRender', (e) => {
    tileset.update(e.frameState)
  })
  .on('postRender', () => {
    map.triggerRepaint()
  })
