# maplibre-three-plugin

`maplibre-three-plugin` is a bridge plugin that cleverly connects [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) with [Three.js](https://threejs.org/), enabling developers to implement 3D rendering and animation on maps.

## Install

```shell
npm install @dvgis/maplibre-three-plugin
----------------------------------------
yarn add @dvgis/maplibre-three-plugin
```

## Start

`maplibre-three-plugin` depends on three, please make sure three is installed before using it.

```javascript
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapScene } from '@dvgis/maplibre-three-plugin'

const map = new maplibregl.Map({
  container: 'map', // container id
  style: 'https://demotiles.maplibre.org/style.json', // style URL
  center: [0, 0], // starting position [lng, lat]
  zoom: 1, // starting zoom
})
const mapScene = new MapScene(map)
```

## MapScene

### constructor(map,[options])

- params
  - `{Map} map ` : map instance
  - `{Object} options ` : config

```js

// config
{
    scene: null, //THREE.Scene，if not passed in, the default scene will be used
    camera:null, //THREE.Camera, if not passed in, the default camera will be used
    renderer: null, //THREE.WebGLRenderer if not passed in, the default renderer will be used
    preserveDrawingBuffer: false,
    renderLoop: (ins) =>{} //Frame animation rendering function, if not passed in, the default function will be used，the params is an instance for MapScene
}

```

### properties

- `{Map} map` **_readonly_**
- `{HtmlElement} canvas` **_readonly_**
- `{THREE.Scene} scene` **_readonly_**
- `{THREE.Camera} camera` **_readonly_**
- `{THREE.WebGLRenderer} renderer` **_readonly_**
- `{THREE.Group} world` **_readonly_** 3D object container, all created 3D objects except lights need to be added to this container to ensure correct rendering

## SceneTransform

### methods

- projectedUnitsPerMeter(lat)

  - params

    - `{Number} lat`

  - returns

    - `Number`

- lngLatToVector3(lng,lat,alt)

  - params

    - `{Number} lng`
    - `{Number} lat`
    - `{Number} alt`

  - returns

    - `Vector3`

- vector3ToLngLat(v3)

  - params

    -`{THREE.Vector3} v3`

  - returns

    - `Object`
