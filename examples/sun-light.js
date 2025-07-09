import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import * as MTP from 'mtp'
import { GLTFLoader } from 'three/addons'

const map = new maplibregl.Map({
  container: 'map-container', // container id
  style: 'https://demotiles.maplibre.org/style.json', // style URL
  zoom: 18,
  center: [148.9819, -35.3981],
  pitch: 60,
  canvasContextAttributes: { antialias: true },
  maxPitch: 85,
})

//init three scene
const mapScene = new MTP.MapScene(map)

let sun = new THREE.DirectionalLight(0xffffff, 1)
let hemiLight = new THREE.HemisphereLight(
  new THREE.Color(0xffffff),
  new THREE.Color(0xffffff),
  0.6
)
mapScene.lights.add(sun)

sun.castShadow = true
sun.shadow.radius = 1
sun.shadow.mapSize.width = 8192
sun.shadow.mapSize.height = 8192
sun.shadow.camera.top = sun.shadow.camera.right = 1000
sun.shadow.camera.bottom = sun.shadow.camera.left = -1000
sun.shadow.camera.near = 1
sun.shadow.camera.far = 1e8
sun.shadow.camera.visible = true

hemiLight.color.setHSL(0.661, 0.96, 0.12)
hemiLight.groundColor.setHSL(0.11, 0.96, 0.14)
hemiLight.position.set(0, 0, 50)
mapScene.lights.add(hemiLight)

function updateSun(newDate = new Date()) {
  const WORLD_SIZE = 512 * 2000
  let date = new Date('2025/7/8 12:00:00')
  let mapCenter = map.getCenter()
  let sunPosition = MTP.SunCalc.getPosition(date, mapCenter.lat, mapCenter.lng)
  let altitude = sunPosition.altitude
  let azimuth = Math.PI + sunPosition.azimuth
  let radius = WORLD_SIZE / 2
  let alt = Math.sin(altitude)
  let altRadius = Math.cos(altitude)
  let azCos = Math.cos(azimuth) * altRadius
  let azSin = Math.sin(azimuth) * altRadius
  sun.position.set(azSin, azCos, alt)
  sun.position.multiplyScalar(radius)
  sun.intensity = Math.max(alt, 0)
  hemiLight.intensity = Math.max(alt * 1, 0.1)
  sun.updateMatrixWorld()
}

mapScene
  .on('preRender', () => {
    updateSun()
  })
  .on('postRender', () => {
    map.triggerRepaint()
  })

// add model
const loader = new GLTFLoader()
loader.load('./assets/34M_17/34M_17.gltf', (gltf) => {
  let rtcGroup = MTP.Creator.createRTCGroup([148.9819, -35.39847])
  rtcGroup.add(gltf.scene)
  mapScene.world.add(rtcGroup)
})
