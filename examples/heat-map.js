import * as MTP from '@dvt3d/maplibre-three-plugin'
import { HeatMap } from './src/index.js'

const map = window.map
const mapScene = new MTP.MapScene(map)

function generatePoints(num) {
  let list = []
  for (let i = 0; i < num; i++) {
    let lng = 120.38105869 + Math.random() * 0.05
    let lat = 31.10115627 + Math.random() * 0.05
    list.push({
      lng: lng,
      lat: lat,
      value: Math.random() * 1000,
    })
  }
  return list
}

let heatMapContainer = document.createElement('div')

map.getContainer().appendChild(heatMapContainer)

let heatMap = new HeatMap(heatMapContainer, {
  h337: window.h337,
})

heatMap.setPoints(generatePoints(1000))

mapScene.addObject(heatMap)

mapScene.flyTo(heatMap)
