import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import config from './config.js'
import { Point } from './src/index.js'

const map = new maplibregl.Map({
  container: 'map',
  style:
    'https://api.maptiler.com/maps/basic-v2/style.json?key=' +
    config.maptiler_key,
  maxPitch: 85,
  pitch: 60,
  canvasContextAttributes: { antialias: true },
})

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

function computeBounds(positions) {
  let xMin = Infinity
  let xMax = -Infinity
  let yMin = Infinity
  let yMax = -Infinity
  let v_positions = []
  for (let i = 0; i < positions.length; i++) {
    let position = positions[i]
    let v = MTP.SceneTransform.lngLatToVector3(position[0], position[1])
    if (v.x < xMin) {
      xMin = v.x
    }

    if (v.x > xMax) {
      xMax = v.x
    }

    if (v.y < yMin) {
      yMin = v.y
    }
    if (v.y > yMax) {
      yMax = v.y
    }
    v_positions.push(v)
  }
  return { xMin, yMin, xMax, yMax, v_positions }
}

let point = undefined
positions.forEach((position) => {
  point = new Point(
    MTP.SceneTransform.lngLatToVector3(position[0], position[1])
  )
  mapScene.addObject(point)
})

mapScene.flyTo(point)

let bounds = computeBounds(positions)

console.log(bounds)

let geometry = new THREE.PlaneGeometry(
  Math.abs(bounds.xMax - bounds.xMin),
  Math.abs(bounds.yMax - bounds.yMin),
  300,
  300
)

let mesh = new THREE.Mesh()

mesh.geometry.dispose()

mesh.geometry = geometry

mesh.material = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.2,
})
mesh.position.set(
  (bounds.xMin + bounds.xMax) / 2,
  (bounds.yMin + bounds.yMax) / 2,
  0
)
mapScene.addObject(mesh)
