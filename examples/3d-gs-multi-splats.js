import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import config from './config.js'
import { SplatLoader } from './src/index.js'

const map = new maplibregl.Map({
  container: 'map',
  style:
    'https://api.maptiler.com/maps/basic-v2/style.json?key=' +
    config.maptiler_key,
  maxPitch: 85,
  pitch: 60,
  canvasContextAttributes: { antialias: true },
  maxZoom: 30,
  center: [120.56114970334647, 31.236247342246173],
  zoom: 18,
})

const mapScene = new MTP.MapScene(map)

mapScene.addLight(new THREE.AmbientLight())

let rtc = new THREE.Group()
rtc.position.copy(
  MTP.SceneTransform.lngLatToVector3(
    120.56114970334647,
    31.236247342246173,
    200
  )
)

rtc.rotateX(-Math.PI / 2)
rtc.rotateY(Math.PI / 2)

mapScene.addObject(rtc)

const splatLoader = new SplatLoader()

splatLoader.loadStream('./assets/1.splat', (mesh) => {
  mesh.threshold = -0.000001
  rtc.add(mesh)
})

splatLoader.loadStream('./assets/2.splat', (mesh) => {
  rtc.add(mesh)
})

const center = new THREE.Vector3()

mapScene
  .on('preRender', (e) => {
    const scene = e.frameState.scene
    const cameraMatrix = e.frameState.camera.matrixWorldInverse
    scene.traverse((child) => {
      if (child.isSplatMesh) {
        child.computeBounds()
        child.bounds.getCenter(center)
        center.applyMatrix4(child.matrixWorld)
        center.applyMatrix4(cameraMatrix)
        let depth = -center.z
        child.renderOrder = 1e5 - depth
      }
    })
  })
  .on('postRender', () => {
    map.triggerRepaint()
  })
