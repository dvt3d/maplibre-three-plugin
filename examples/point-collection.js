import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import { PointCollection } from './src/index.js'

const map = window.map

const mapScene = new MTP.MapScene(map)

function generatePosition(num) {
  let list = []
  for (let i = 0; i < num; i++) {
    let lng = 120.38105869 + Math.random() * 0.5
    let lat = 31.10115627 + Math.random() * 0.5
    list.push([lng, lat])
  }
  return list
}
mapScene.addLight(new THREE.AmbientLight())
const positions = generatePosition(10000)
let pointCollection = new PointCollection(
  positions.map((position) =>
    MTP.SceneTransform.lngLatToVector3(position[0], position[1])
  )
)
mapScene.addObject(pointCollection)
mapScene.flyTo(pointCollection)
