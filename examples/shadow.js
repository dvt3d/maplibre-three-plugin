import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import { Model } from './src/index.js'
const map = window.map
map.setZoom(18)
map.setCenter([148.9819, -35.3981])
//init three scene
const mapScene = new MTP.MapScene(map)
mapScene.renderer.shadowMap.enabled = true
mapScene.addLight(new THREE.AmbientLight())

const dirLight = new THREE.DirectionalLight(0xffffff, 1)
dirLight.castShadow = true
dirLight.shadow.radius = 2
dirLight.shadow.mapSize.width = 8192
dirLight.shadow.mapSize.height = 8192
dirLight.shadow.camera.top = dirLight.shadow.camera.right = 1000
dirLight.shadow.camera.bottom = dirLight.shadow.camera.left = -1000
dirLight.shadow.camera.near = 1
dirLight.shadow.camera.far = 1e8
dirLight.shadow.camera.visible = true
dirLight.position.set(30, 100, 100)
dirLight.updateMatrixWorld()

mapScene.addLight(dirLight)

const shadowGround = MTP.Creator.createShadowGround([148.9819, -35.39847])
mapScene.addObject(shadowGround)

Model.fromGltfAsync({
  url: './assets/34M_17/34M_17.gltf',
  position: MTP.SceneTransform.lngLatToVector3(148.9819, -35.39847),
  castShadow: true,
}).then((model) => {
  mapScene.addObject(model)
})
