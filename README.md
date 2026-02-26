# maplibre-three-plugin

`maplibre-three-plugin` is a bridge plugin that cleverly
connects [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) with [Three.js](https://threejs.org/), enabling
developers to implement 3D rendering and animation on maps.

## Install

```shell
npm install @dvt3d/maplibre-three-plugin
----------------------------------------
yarn add @dvt3d/maplibre-three-plugin
```

## Quickly Start

`maplibre-three-plugin` depends on three, please make sure three is installed before using it.

```html

<div id="map-container"></div>
```

```javascript

import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import * as MTP from '@dvt3d/maplibre-three-plugin'

const map = new maplibregl.Map({
    container: 'map-container', // container id
    style: 'https://api.maptiler.com/maps/basic-v2/style.json?key=get_access_key',
    zoom: 18,
    center: [148.9819, -35.3981],
    pitch: 60,
    canvasContextAttributes: {antialias: true},
    maxPitch: 85,
})

//init three scene
const mapScene = new MTP.MapScene(map)

//add light
mapScene.addLight(new THREE.AmbientLight())

// add model
const glTFLoader = new GLTFLoader()

glTFLoader.load('./assets/34M_17/34M_17.gltf', (gltf) => {
    let rtcGroup = MTP.Creator.createRTCGroup([148.9819, -35.39847])
    rtcGroup.add(gltf.scene)
    mapScene.addObject(rtcGroup)
})
```

## Examples

|                                      ![pic](./examples/index.png)                                      |                                 ![pic](./examples/sun-light.png)                                 |                              ![pic](./examples/point.png)                              |                             ![pic](./examples/point-collection.png)                              |                                                
|:------------------------------------------------------------------------------------------------------:|:------------------------------------------------------------------------------------------------:|:--------------------------------------------------------------------------------------:|:------------------------------------------------------------------------------------------------:|
|               [model](https://dvt3d.github.io/maplibre-three-plugin/examples/index.html)               |        [sun-light](https://dvt3d.github.io/maplibre-three-plugin/examples/sun-light.html)        |       [point](https://dvt3d.github.io/maplibre-three-plugin/examples/point.html)       | [point-collection](https://dvt3d.github.io/maplibre-three-plugin/examples/point-collection.html) | 
|                                    ![pic](./examples/billboard.png)                                    |                                 ![pic](./examples/div-icon.png)                                  |                            ![pic](./examples/3d-tiles.png)                             |                               ![pic](./examples/3d-tiles-osgb.png)                               |                         
|           [billboard](https://dvt3d.github.io/maplibre-three-plugin/examples/billboard.html)           |         [div-icon](https://dvt3d.github.io/maplibre-three-plugin/examples/div-icon.html)         |    [3d-tiles](https://dvt3d.github.io/maplibre-three-plugin/examples/3d-tiles.html)    |    [3d-tiles-osgb](https://dvt3d.github.io/maplibre-three-plugin/examples/3d-tiles-osgb.html)    |         
|                               ![pic](./examples/3d-tiles-cesium-ion.png)                               |                             ![pic](./examples/3d-gs-cesium-ion.png)                              |                           ![pic](./examples/3d-gs-splat.png)                           |                                 ![pic](./examples/heat-map.png)                                  |
| [3d-tiles-cesium-ion](https://dvt3d.github.io/maplibre-three-plugin/examples/3d-tiles-cesium-ion.html) | [3d-gs-cesium-ion](https://dvt3d.github.io/maplibre-three-plugin/examples/3d-gs-cesium-ion.html) | [3d-gs-splat](https://dvt3d.github.io/maplibre-three-plugin/examples/3d-gs-splat.html) |         [heat-map](https://dvt3d.github.io/maplibre-three-plugin/examples/heat-map.html)         |

## Docs

### MapScene

#### examples

```js
const mapScene = new MapScene(map)
```

#### creation

- constructor(map,[options])
    - params
        - `{Map} map ` : map instance
        - `{Object} options ` : config

```js
// config
Object({
    /**
     * Existing THREE.Scene instance.
     * If not provided, an internal default scene will be created.
     */
    scene: null,

    /**
     * Existing THREE.Camera instance.
     * If not provided, an internal default camera will be created.
     */
    camera: null,

    /**
     * Existing THREE.WebGLRenderer instance.
     * If not provided, an internal default renderer will be created.
     */
    renderer: null,

    /**
     * Whether to preserve the drawing buffer.
     * When enabled, the canvas content will be retained after rendering,
     * which is useful for screenshots or readPixels operations.
     * Note: Enabling this may have a performance impact.
     */
    preserveDrawingBuffer: false,

    /**
     * Whether to enable post-processing rendering.
     * When enabled, Three.js content will be rendered through
     * an offscreen render target before being composited onto the map.
     * When disabled, Three.js renders directly into the shared MapLibre canvas
     * for maximum performance and stability.
     */
    enablePostProcessing: false,

    /**
     * Custom frame render loop.
     *
     * This function will be called every frame.
     * If not provided, the internal default render loop will be used.
     *
     * ⚠️ Note:
     * Providing a custom renderLoop means you take full control
     * of the render lifecycle. The built-in rendering pipeline
     * will be bypassed.
     *
     * As a result, the following internal event hooks will
     * NOT be triggered automatically:
     *
     * - preReset
     * - postReset
     * - preRender
     * - postRender
     *
     * If needed, you must manually call the corresponding logic
     * inside your custom renderLoop.
     *
     * @param {MapScene} ins - The current MapScene instance
     */
    renderLoop: (ins) => {
    }
})
```

#### event hooks

These hooks are only triggered when using the internal render loop.

- `preReset` : A hook that calls `renderer.resetState` before each animation frame
- `postReset`: A hook that calls `renderer.resetState` after each animation frame
- `preRender`: A hook that calls `renderer.render` before each animation frame
- `postRender`: A hook that calls `renderer.render` after each animation frame

#### properties

- `{maplibregl.Map} map ` : `readonly`
- `{HTMLCanvasElement} canvas ` : `readonly`
- `{THREE.Camera} camera `: `readonly`
- `{THREE.Sence} scene` : `readonly`
- `{THREE.Group} lights`: `readonly`
- `{THREE.Group} world` : `readonly`
- `{THREE.WebGLRenderer} renderer` : `readonly`
- `{EffectComposer} composer` : `readonly`
- `{RenderPass} renderPass` : `readonly`
- `{ShaderPass} customOutPass` : `readonly`

#### methods

- **_addLight(light)_**

  Add light to the scene, support custom light objects, but the custom light objects need to support the `delegate`
  property, and the `delegate` type is `THREE.Object3D`
    - params
        - `{THREE.Object3D | Sun | CustomLight } light `
    - returns
        - `this`

- **_removeLight(light)_**

  Remove light from the scene

    - params
        - `{THREE.Object3D | Sun | CustomLight } light `
    - returns
        - `this`

- **_addObject(object)_**

  Add an object to world，support custom object, but the custom object need to support the `delegate` property, and the
  `delegate` type is `THREE.Object3D`

    - params
        - `{THREE.Object3D | CustomObject} object `
    - returns
        - `this`
- **_removeObject(object)_**

  Remove an object from world

    - params
        - `{THREE.Object3D | CustomObject} object `
    - returns
        - `this`

- **_flyTo(target,[completed],[duration])_**

  Fly the map to the provided target over a period of time, the completion callback will be triggered when the flight is
  complete, the target needs to contain the `position` property

    - params
        - `{THREE.Object3D | CustomObject} target `
        - `{Function} completed `
        - `{Number} duration `
    - returns
        - `this`

- **_zoomTo(target,[completed])_**

  Zoom the map to the provided target

    - params
        - `{Ojbect} target `
        - `{Function} completed `
    - returns
        - `this`

- **_on(type,callback)_**

  Registers an event listener for the specified event type

    - params
        - `{String} type `
        - `{Function} callback `
    - returns
        - `this`

- **_off(type,callback)_**

  Removes a previously registered event listener for the specified event type

    - params
        - `{String} type `
        - `{Function} callback `
    - returns
        - `this`

- **_layerBeforeTo([beforeId])_**

  Moves the three to a different z-position, If beforeId is omitted, the layer will be appended to the end of the layers
  array and appear above all other layers on the map.

    - params
        - `{String} beforeId `
    - returns
        - `this`

- **_addPass(pass)_**

  Adds a post-processing pass to the internal EffectComposer. The pass will be inserted before the final output pass to
  ensure correct rendering order.

    - params
        - `{THREE.Pass} pass `
    - returns
        - `this`

- **_removePass(pass)_**

  Removes a previously added post-processing pass from the internal EffectComposer.

    - params
        - `{THREE.Pass} pass `
    - returns
        - `this`

### SceneTransform

#### examples

```js
const scale = new SceneTransform.projectedUnitsPerMeter(24)
```

#### static methods

- **_projectedMercatorUnitsPerMeter()_**
    - params
    - returns
        - `{Number} value`

- **_projectedUnitsPerMeter(lat)_**
    - params
        - `{Number} lat `
    - returns
        - `{Number} value`

- **_lngLatToVector3(lng, [lat], [alt] )_**
    - params
        - `{Array | Number} lng `
        - `{Number} lat `
        - `{Number} alt `
    - returns
        - `{THREE.Vector3} v`

- **_vector3ToLngLat(v)_**
    - params
        - `{THREE.Vector3} v`
    - returns
        - `{Array} value`

### Sun

#### examples

```js
const sun = new Sun()
```

#### creation

- constructor()
    - params

#### properties

- `{THREE.Group} delegate ` : `readonly`
- `{Boolean} castShadow `
- `{Date | String} currentTime `
- `{THREE.DirectionalLight} sunLight` : `readonly`
- `{THREE.HemisphereLight} hemiLight`: `readonly`

#### methods

- **_update(frameState)_**
    - params
        - `{Object} frameState`:
    - returns
        - `this`

### Creator

#### examples

```js
const rtcGroup = Creator.createRTCGroup([-1000, 0, 0])
```

#### static methods

- **_createRTCGroup(center, [rotation], [scale])_**
    - params
        - `{Array} center`
        - `{Array} rotation`: default value is [0,0,0]
        - `{Array} scale`: scale corresponding to the current latitude
    - returns
        - `{THREE.Group} group`

- **_createMercatorRTCGroup(center, [rotation], [scale])_**
    - params
        - `{Array} center`
        - `{Array} rotation`: default value is [0,0,0]
        - `{Array} scale`: scale corresponding to the current latitude
    - returns
        - `{THREE.Group} group`

- **_createShadowGround(center, [width], [height])_**
    - params
        - `{THREE.Vector3} center`
        - `{Number} width`: default value is 100
        - `{Number} height` : default value is 100
    - returns
        - `{THREE.Mesh} mesh`
