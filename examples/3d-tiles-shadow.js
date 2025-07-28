import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import config from './config.js'
import { ModelLoaderUtil, Tileset } from './src'

let map = new maplibregl.Map({
  container: 'map',
  style:
    'https://api.maptiler.com/maps/basic-v2/style.json?key=' +
    config.maptiler_key, // style URL
  maxPitch: 85,
  pitch: 60,
  canvasContextAttributes: { antialias: true },
})

let mapScene = new MTP.MapScene(map)

mapScene.renderer.shadowMap.enabled = true

const sun = new MTP.Sun()
sun.currentTime = '2025/7/12 8:00:00'
sun.castShadow = true
sun.setShadow()
mapScene.addLight(sun)

ModelLoaderUtil.setDracoLoader({
  path: 'https://cdn.jsdelivr.net/npm/three/examples/jsm/libs/draco/',
})
ModelLoaderUtil.setKtx2loader({
  path: 'https://cdn.jsdelivr.net/npm/three/examples/jsm/libs/basis/',
  renderer: mapScene.renderer,
})

const ljz_url = '//resource.dvgis.cn/data/3dtiles/ljz/tileset.json'
const tileset = new Tileset(ljz_url, {
  dracoLoader: ModelLoaderUtil.getDracoLoader(),
  ktxLoader: ModelLoaderUtil.getKtx2loader(),
})

tileset.autoDisableRendererCulling = true
tileset.errorTarget = 6

tileset.on('loaded', () => {
  const shadowGround = MTP.Creator.createShadowGround(
    [tileset.positionDegrees[0], tileset.positionDegrees[1]],
    1000,
    1000
  )
  mapScene.world.add(shadowGround)
  mapScene.addObject(tileset)
  mapScene.flyTo(tileset)
})

tileset.on('load-model', (e) => {
  let model = e.scene
  model.traverse(function (obj) {
    if (obj.isMesh) {
      obj.castShadow = true
    }
  })
})

mapScene
  .on('preRender', (e) => {
    sun.update(e.frameState)
    tileset.update(e.frameState)
  })
  .on('postRender', () => {
    map.triggerRepaint()
  })
