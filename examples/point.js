import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import config from './config.js'
import { Point } from './src'

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

const point = new Point(MTP.SceneTransform.lngLatToVector3(120, 31))

point.setStyle({
  color: new THREE.Color().setStyle('#ff0000'),
  size: 20,
})

mapScene.addObject(point)

mapScene.flyTo(point)
