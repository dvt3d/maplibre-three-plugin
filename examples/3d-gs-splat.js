import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import { SplatLoader } from '3dgs-loader'
import { SplatWorker, SplatMesh } from '@dvt3d/splat-mesh'

const map = window.map

map.setMaxZoom(30)

const mapScene = new MTP.MapScene(map)

mapScene.addLight(new THREE.AmbientLight())

let rtc = MTP.Creator.createMercatorRTCGroup(
  [113.03932757890647, 28.294469403362328, 2],
  [-Math.PI / 2, Math.PI / 2]
)
mapScene.addObject(rtc)

const splatLoader = new SplatLoader({
  workerLimit: 1,
  workerBaseUrl: 'https://cdn.jsdelivr.net/npm/3dgs-loader@1.2.0/dist/',
})

const data = await splatLoader.load('http://localhost:8080/ggy.splat')

const splatWorker = new SplatWorker(
  'https://cdn.jsdelivr.net/npm/@dvt3d/splat-mesh@1.1.1/dist/workers/'
)
const splatMesh = new SplatMesh()
splatMesh.threshold = -0.000001
splatMesh.attachWorker(splatWorker)
splatMesh.setVertexCount(data.numSplats)
await splatMesh.setDataFromBuffer(data.buffer)
rtc.add(splatMesh)
mapScene.flyTo(rtc)
