import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import * as MTP from '@dvgis/maplibre-three-plugin'
import { TilesRenderer } from '3d-tiles-renderer'
import { GLTFExtensionsPlugin } from '3d-tiles-renderer/plugins'
import { DRACOLoader, KTX2Loader } from 'three/addons'

let map = new maplibregl.Map({
  container: 'map',
  style:
    'https://api.maptiler.com/maps/basic-v2/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL', // stylesheet location
  center: [0, 0],
  zoom: 19,
  maxPitch: 85,
  pitch: 60,
  canvasContextAttributes: { antialias: true },
})

let mapScene = new MTP.MapScene(map)

mapScene.renderer.shadowMap.enabled = true

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
sun.shadow.camera.visible = true
sun.shadow.camera.far = 1e8
hemiLight.color.setHSL(0.661, 0.96, 0.12)
hemiLight.groundColor.setHSL(0.11, 0.96, 0.14)
hemiLight.position.set(0, 0, 50)
mapScene.lights.add(hemiLight)

function updateSun(newDate = new Date()) {
  const WORLD_SIZE = 512 * 2000
  let date = new Date('2025/7/8 8:00:00')
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

// mapScene.lights.add(new THREE.AmbientLight())
let tilesets = []
mapScene
  .on('preRender', () => {
    updateSun()
    tilesets.forEach((tileset) => {
      tileset.setCamera(mapScene.camera)
      tileset.setResolutionFromRenderer(mapScene.camera, mapScene.renderer)
      tileset.update()
    })
  })
  .on('postRender', () => {
    map.triggerRepaint()
  })

const EARTH_RADIUS = 6371008.8
const EARTH_CIRCUMFERENCE = 2 * Math.PI * EARTH_RADIUS
const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath(
  'https://cdn.jsdelivr.net/npm/three/examples/jsm/libs/draco/'
)
const ktx2loader = new KTX2Loader()
ktx2loader.setTranscoderPath(
  'https://cdn.jsdelivr.net/npm/three/examples/jsm/libs/basis/'
)

ktx2loader.detectSupport(mapScene.renderer)

let ljz_url = '//resource.dvgis.cn/data/3dtiles/ljz/tileset.json'
const tileset = new TilesRenderer(ljz_url)
tileset.registerPlugin(
  new GLTFExtensionsPlugin({
    dracoLoader,
    ktxLoader: ktx2loader,
  })
)

tileset.fetchOptions.mode = 'cors'
tileset.autoDisableRendererCulling = true
tileset.lruCache.maxBytesSize = Infinity
tileset.lruCache.minSize = 0
tileset.lruCache.maxSize = Infinity
tileset.errorTarget = 6
const centerCartographic = { lat: 0, lon: 0, height: 0 }
let centerDegrees = { lng: 0, lat: 0, height: 0 }
let rtcGroup = null

function getViewPosition(size) {
  const transform = map.transform
  const fovInRadians = transform.fov * DEG2RAD
  const pitchInRadians = transform.pitch * DEG2RAD
  const distance =
    Math.max(size.x, size.y, size.z) / (2 * Math.tan(fovInRadians / 2))
  const cameraHeight = distance * Math.cos(pitchInRadians)
  const pixelAltitude = Math.abs(
    Math.cos(pitchInRadians) * transform.cameraToCenterDistance
  )
  const metersInWorldAtLat =
    EARTH_CIRCUMFERENCE * Math.abs(Math.cos(centerDegrees.lat * DEG2RAD))
  const worldSize = (pixelAltitude / cameraHeight) * metersInWorldAtLat
  const zoom = Math.round(Math.log(worldSize / transform.tileSize) / Math.LN2)
  return {
    center: [centerDegrees.lng, centerDegrees.lat],
    cameraHeight,
    zoom,
  }
}

tileset.addEventListener('load-tile-set', (e) => {
  if (!rtcGroup) {
    rtcGroup = new THREE.Group()
    rtcGroup.name = 'tileset-rtc'
    mapScene.world.add(rtcGroup)
    const box = new THREE.Box3()
    const sphere = new THREE.Sphere()
    let center = new THREE.Vector3()
    let size = new THREE.Vector3()
    if (tileset.getBoundingBox(box)) {
      box.getCenter(center)
      box.getSize(size)
    } else if (tileset.getBoundingSphere(sphere)) {
      center = sphere.center
      size.set(sphere.radius, sphere.radius, sphere.radius)
    } else {
      return
    }
    tileset.ellipsoid.getPositionToCartographic(center, centerCartographic)
    centerDegrees = {
      lng: centerCartographic.lon * RAD2DEG,
      lat: centerCartographic.lat * RAD2DEG,
      height: centerCartographic.height,
    }
    rtcGroup.position.copy(
      MTP.SceneTransform.lngLatToVector3(
        centerDegrees.lng,
        centerDegrees.lat,
        centerDegrees.height
      )
    )
    const scale = MTP.SceneTransform.projectedUnitsPerMeter(centerDegrees.lat)
    rtcGroup.scale.set(scale, scale, scale)
    rtcGroup.rotateX(Math.PI)
    rtcGroup.rotateY(Math.PI)
    const enuMatrix = tileset.ellipsoid.getEastNorthUpFrame(
      centerCartographic.lat,
      centerCartographic.lon,
      centerCartographic.height,
      new THREE.Matrix4()
    )
    const modelMatrix = enuMatrix.clone().invert()
    modelMatrix.decompose(
      tileset.group.position,
      tileset.group.quaternion,
      tileset.group.scale
    )
    rtcGroup.add(tileset.group)
    const shadowGround = MTP.Creator.createShadowGround(
      [centerDegrees.lng, centerDegrees.lat],
      1000,
      1000
    )
    mapScene.world.add(shadowGround)
    let view = getViewPosition(size)
    map.easeTo({
      center: view.center,
      zoom: view.zoom,
    })
  }
})

tileset.addEventListener('load-model', (e) => {
  let model = e.scene
  model.traverse(function (obj) {
    if (obj.isMesh) {
      obj.castShadow = true
    }
  })
})

tilesets.push(tileset)
