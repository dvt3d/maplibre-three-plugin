import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import * as MTP from '../../src'
import config from './config'
import { Billboard } from './modules'
import 'maplibre-gl/dist/maplibre-gl.css'

const map = new maplibregl.Map({
  container: 'map',
  style:
    `https://api.maptiler.com/maps/basic-v2/style.json?key=${
      config.maptiler_key}`,
  maxPitch: 85,
  pitch: 60,
  canvasContextAttributes: { antialias: true },
})

const mapScene = new MTP.MapScene(map)

mapScene.addLight(new THREE.AmbientLight())

function generatePosition(num: number) {
  const list = []
  for (let i = 0; i < num; i++) {
    const lng = 120.38105869 + Math.random() * 0.1
    const lat = 31.10115627 + Math.random() * 0.1
    list.push([lng, lat])
  }
  return list
}

const positions = generatePosition(1000)

let billboard
positions.forEach((position) => {
  billboard = new Billboard(
    MTP.SceneTransform.lngLatToVector3(position[0], position[1]),
    '/maplibre-three-plugin/assets/icon/camera.png',
  )
  // eslint-disable-next-line ts/ban-ts-comment
  // @ts-expect-error
  mapScene.addObject(billboard)
})
// eslint-disable-next-line ts/ban-ts-comment
// @ts-expect-error
mapScene.flyTo(billboard)
