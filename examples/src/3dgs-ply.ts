import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import * as MTP from '../../src'
import config from './config'
import 'maplibre-gl/dist/maplibre-gl.css'

const map = new maplibregl.Map({
  container: 'map',
  style:
    `https://api.maptiler.com/maps/basic-v2/style.json?key=${
      config.maptiler_key}`,
  maxPitch: 85,
  pitch: 60,
  canvasContextAttributes: { antialias: true },
  center: [148.9819, -35.39847],
  zoom: 16,
})
const mapScene = new MTP.MapScene(map)

// add light
mapScene.addLight(new THREE.AmbientLight())
