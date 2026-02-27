import * as THREE from 'three'
import * as MTP from '@dvt3d/maplibre-three-plugin'
import { Model } from './src/index.js'

const map = window.map
map.setZoom(16)
map.setCenter([120, 31])

//init three scene
const mapScene = new MTP.MapScene(map)
//add light
mapScene.addLight(new THREE.AmbientLight())

mapScene.renderer.localClippingEnabled = true
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

Model.fromGltfAsync({
  url: './assets/PrimaryIonDrive.glb',
  position: MTP.SceneTransform.lngLatToVector3(120, 31, 10),
}).then((model) => {
  model.delegate.scale.set(2, 2, 2)
  model.delegate.traverse((o) => {
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const m of mats) {
        m.clippingPlanes = [groundPlane]
        m.clipIntersection = false
        m.clipShadows = false
        m.needsUpdate = true
      }
    }
  })
  mapScene.addObject(model)
})
