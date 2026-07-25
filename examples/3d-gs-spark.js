import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark'
const map = window.map

map.setMaxZoom(30)

const mapScene = new MTP.MapScene(map)

mapScene.addLight(new THREE.AmbientLight())

const spark = new SparkRenderer({ renderer: mapScene.renderer })
mapScene.addSceneObject(spark)

let rtc = MTP.Creator.createMercatorRTCGroup(
  [120, 31, 2],
  [-Math.PI / 2, Math.PI / 2]
)
mapScene.addObject(rtc)

const butterfly = new SplatMesh({
  url: 'https://sparkjs.dev/assets/splats/butterfly.spz',
})
butterfly.scale.set(100, 100, 100)
rtc.add(butterfly)
mapScene.flyTo(rtc)
