import * as MTP from '../../src'
import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import config from './config'
import { PointCollection } from './modules'
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

function generatePosition(num: number) {
  const list = []
  for (let i = 0; i < num; i++) {
    const lng = 120.38105869 + Math.random() * 0.5
    const lat = 31.10115627 + Math.random() * 0.5
    list.push([lng, lat])
  }
  return list
}
mapScene.addLight(new THREE.AmbientLight())

const positions = generatePosition(10000)
const pointCollection = new PointCollection(
  positions.map(position =>
    MTP.SceneTransform.lngLatToVector3(position[0], position[1]),
  ),
)

// eslint-disable-next-line ts/ban-ts-comment
// @ts-expect-error
mapScene.addObject(pointCollection)
// eslint-disable-next-line ts/ban-ts-comment
// @ts-expect-error
mapScene.flyTo(pointCollection)
