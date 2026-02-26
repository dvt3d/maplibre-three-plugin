import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
const map = window.map
map.setZoom(18)

map.setCenter([148.9819, -35.3981])

//init three scene
const mapScene = new MTP.MapScene(map)
//add light
mapScene.addLight(new THREE.AmbientLight())
// add model
const loader = new GLTFLoader()
loader.load('./assets/34M_17/34M_17.gltf', (gltf) => {
  let rtcGroup = MTP.Creator.createRTCGroup([148.9819, -35.39847])
  rtcGroup.add(gltf.scene)
  mapScene.addObject(rtcGroup)
})
