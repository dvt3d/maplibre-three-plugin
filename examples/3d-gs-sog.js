import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark'
const map = window.map
map.setMaxZoom(30)
const mapScene = new MTP.MapScene(map)
mapScene.addLight(new THREE.AmbientLight())
const rtc = MTP.Creator.createMercatorRTCGroup(
  [113.03932757890647, 28.294469403362328, 2],
  [-Math.PI / 2, Math.PI / 2]
)
mapScene.addObject(rtc)
const sparkRenderer = new SparkRenderer({ renderer: mapScene.renderer })
mapScene.addSceneObject(sparkRenderer)
const splatMesh = new SplatMesh({
  url: 'http://localhost:8080/ggy.sog',
})
rtc.add(splatMesh)
mapScene.flyTo(rtc)
