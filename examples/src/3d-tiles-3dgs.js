import * as MTP from '@dvt3d/maplibre-three-plugin'
import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import config from './config.js'
import { Tileset } from './modules'
import 'maplibre-gl/dist/maplibre-gl.css'

const map = new maplibregl.Map({
  container: 'map',
  style:
    `https://api.maptiler.com/maps/basic-v2/style.json?key=${
      config.maptiler_key}`,
  maxPitch: 85,
  pitch: 60,
  canvasContextAttributes: { antialias: true },
})

const mapScene = new MTP.MapScene(map)

mapScene.addLight(new THREE.AmbientLight())

const url = '//resource.dvgis.cn/data/3dtiles/jiaotang-spz/tileset.json'

const tileset = new Tileset(url)

// tileset.autoDisableRendererCulling = true
tileset.errorTarget = 0.1

tileset.on('loaded', () => {
  mapScene.addObject(tileset)
  tileset.setRotation([Math.PI / 2, 0, 0])
  tileset.setHeight(20)
  mapScene.flyTo(tileset)
})

mapScene
  .on('preRender', (e) => {
    tileset.update(e.frameState)
  })
  .on('postRender', () => {
    map.triggerRepaint()
  })
