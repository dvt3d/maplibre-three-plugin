import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import { SparkRenderer } from '@sparkjsdev/spark'
import { Tileset } from './src/index.js'
const map = window.map
map.setMaxZoom(30)
const mapScene = new MTP.MapScene(map)
mapScene.addLight(new THREE.AmbientLight())
const sparkRenderer = new SparkRenderer({ renderer: mapScene.renderer })
mapScene.addSceneObject(sparkRenderer)
let tileset = new Tileset('http://localhost:8080/3dgs-test/tileset.json')
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
