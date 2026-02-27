import * as THREE from 'three'
import { CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import { DivIcon } from './src/index.js'

const map = window.map

const mapScene = new MTP.MapScene(map)

mapScene.addLight(new THREE.AmbientLight())

const element = document.createElement('div')
element.className = 'div-icon-container'
document.getElementById('map-container').appendChild(element)

const domRenderer = new CSS3DRenderer({
  element: element,
})
domRenderer.setSize(mapScene.canvas.clientWidth, mapScene.canvas.clientHeight)
window.addEventListener('resize', () => {
  domRenderer.setSize(mapScene.canvas.clientWidth, mapScene.canvas.clientHeight)
})

mapScene.on('preRender', (e) => {
  domRenderer.render(e.frameState.scene, e.frameState.camera)
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

const positions = generatePosition(20)

let divIcon = undefined
positions.forEach((position) => {
  divIcon = new DivIcon(
    MTP.SceneTransform.lngLatToVector3(position[0], position[1]),
    '数维空间科技'
  )
  mapScene.addObject(divIcon)
})

mapScene.flyToPosition(
  [120.6465605955243, 31.228473719008534, 15208.762327849023],
  [0, 75, 0]
)
