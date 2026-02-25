import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import { Point } from './src/index.js'

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

const positions = generatePosition(30)

let point = undefined
positions.forEach((position) => {
  point = new Point(
    MTP.SceneTransform.lngLatToVector3(position[0], position[1])
  )
  mapScene.addObject(point)
})
mapScene.flyTo(point)
