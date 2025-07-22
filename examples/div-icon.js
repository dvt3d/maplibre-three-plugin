import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import { CSS3DRenderer } from 'three/addons'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import config from './config.js'
import { DivIcon } from './src'

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

mapScene.addLight(new THREE.AmbientLight())

const element = document.createElement('div')
element.className = 'div-icon-container'
document.getElementById('map').appendChild(element)

const domRenderer = new CSS3DRenderer({
  element: element,
})
domRenderer.setSize(mapScene.canvas.clientWidth, mapScene.canvas.clientHeight)
window.addEventListener('resize', () => {
  domRenderer.setSize(mapScene.canvas.clientWidth, mapScene.canvas.clientHeight)
})

mapScene.on('preRender', () => {
  domRenderer.render(mapScene.scene, mapScene.camera)
})

function generatePosition(num) {
  let list = []
  for (let i = 0; i < num; i++) {
    let lng = 120.38105869 + Math.random() * 0.5
    let lat = 31.10115627 + Math.random() * 0.5
    list.push([lng, lat])
  }
  return list
}

const positions = generatePosition(10)

let divIcon = undefined
positions.forEach((position) => {
  divIcon = new DivIcon(
    MTP.SceneTransform.lngLatToVector3(position[0], position[1]),
    '数字视界科技'
  )
  mapScene.addObject(divIcon)
})
