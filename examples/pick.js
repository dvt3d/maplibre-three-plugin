import * as MTP from '@dvt3d/maplibre-three-plugin'
import * as THREE from 'three'
import { Model } from './src/index.js'

const map = window.map
map.setZoom(18)
map.setCenter([148.9819, -35.3981])

//init three scene
const mapScene = new MTP.MapScene(map)

//add light
mapScene.addLight(new THREE.AmbientLight())

Model.fromGltfAsync({
  url: './assets/34M_17/34M_17.gltf',
  position: MTP.SceneTransform.lngLatToVector3(148.9819, -35.39847),
  castShadow: true,
}).then((model) => {
  mapScene.addObject(model)
})

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2(1, 1)

map.on('click', (e) => {
  mouse.x = (e.point.x / window.innerWidth) * 2 - 1
  mouse.y = -(e.point.y / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(mouse, mapScene.camera)
  const intersects = raycaster.intersectObjects(mapScene.world.children)
  console.log(intersects)
})
