import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import { Billboard } from './src/index.js'

const map = window.map
const mapScene = new MTP.MapScene(map)
mapScene.addLight(new THREE.AmbientLight())
function generatePosition(num) {
  let list = []
  for (let i = 0; i < num; i++) {
    let lng = 120.38105869 + Math.random() * 0.1
    let lat = 31.10115627 + Math.random() * 0.1
    list.push([lng, lat])
  }
  return list
}
const positions = generatePosition(1000)
let billboard = undefined
positions.forEach((position) => {
  billboard = new Billboard(
    MTP.SceneTransform.lngLatToVector3(position[0], position[1]),
    './assets/icon/camera.png'
  )
  mapScene.addObject(billboard)
})

mapScene.flyTo(billboard)
