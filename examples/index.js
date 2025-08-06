import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import { GLTFLoader } from 'three/addons'
import config from './config.js'

const map = new maplibregl.Map({
  container: 'map-container', // container id
  style:
    'https://api.maptiler.com/maps/basic-v2/style.json?key=' +
    config.maptiler_key, // style URL
  zoom: 18,
  center: [148.9819, -35.3981],
  pitch: 60,
  canvasContextAttributes: { antialias: true },
  maxPitch: 85,
})

//init three scene
const mapScene = new MTP.MapScene(map)

//add light
mapScene.addLight(new THREE.AmbientLight())

// add model
const loader = new GLTFLoader()
loader.load('./assets/34M_17/34M_17.gltf', (gltf) => {
  let rtcGroup = MTP.Creator.createRTCGroup([148.9819, -35.39847])
  rtcGroup.add(gltf.scene)
  mapScene.addObject(rtcGroup)
})
