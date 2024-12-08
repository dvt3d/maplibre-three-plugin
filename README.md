# maplibre-three-plugin
`maplibre-three-plugin` is a bridge plugin that cleverly connects [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) with [Three.js](https://threejs.org/), enabling developers to implement 3D rendering and animation on maps.

## Install 

```shell
npm install @dvgis/maplibre-three-plugin 
----------------------------------------
yarn add @dvgis/maplibre-three-plugin`
```

## Start
 
`maplibre-three-plugin` depends on three, please make sure three is installed before using it.

```javascript
 import maplibregl from 'maplibre-gl';
 import 'maplibre-gl/dist/maplibre-gl.css';
 import {MapScene} from '@dvgis/maplibre-three-plugin'

 const map = new maplibregl.Map({
   container: 'map', // container id
   style: 'https://demotiles.maplibre.org/style.json', // style URL
   center: [0, 0], // starting position [lng, lat]
   zoom: 1 // starting zoom
 });
 const mapScene = new MapScene(map)
```

## MapScene

### constructor(map,[options])

-   params
    - `{maplibregl.Map} map ` : map instance
    - `{Object} options ` : config

```js
{
    scene: null, 
    camera:null, 
    renderer: null, 
    preserveDrawingBuffer: false, 
    renderLoop: (ins) =>{} 
} 

```

### properties

-   `{maplibregl.Map} map` 
-   `{HttmElement} canvas` 
-   `{THREE.Scene} scene`
-   `{THREE.Camera} camera`
-   `{THREE.WebGLRenderer} renderer`
-   `{THREE.Group} world`

### methods
 
-   projectedUnitsPerMeter(lat)

-   lngLatToVector3(lng,lat,alt)

-   vector3ToLngLat(v3)











