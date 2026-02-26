import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import { ModelLoader, Tileset } from './src/index.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js'
import { DotScreenShader } from 'three/addons/shaders/DotScreenShader.js'

const map = window.map

const mapScene = new MTP.MapScene(map, {
  enablePostProcessing: true,
})

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

const effect1 = new ShaderPass(DotScreenShader)
effect1.uniforms['scale'].value = 4
const effect2 = new ShaderPass(RGBShiftShader)
effect2.uniforms['amount'].value = 0.0015

mapScene.addPass(effect1).addPass(effect2)

mapScene
  .on('preRender', (e) => {
    tileset.update(e.frameState)
  })
  .on('postRender', () => {
    map.triggerRepaint()
  })
