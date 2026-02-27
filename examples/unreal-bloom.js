import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { Model } from './src/index.js'

const map = window.map
map.setZoom(16)
map.setCenter([120.9819, 31])

//init three scene
const mapScene = new MTP.MapScene(map, {
  enablePostProcessing: true,
})
//add light
mapScene.addLight(new THREE.AmbientLight())

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85
)
bloomPass.threshold = 0
bloomPass.strength = 1
bloomPass.radius = 0.5
mapScene.addPass(bloomPass)
Model.fromGltfAsync({
  url: './assets/PrimaryIonDrive.glb',
  position: MTP.SceneTransform.lngLatToVector3(120.9819, 31, 100),
}).then((model) => {
  model.delegate.scale.set(2, 2, 2)
  mapScene.addObject(model)
})
