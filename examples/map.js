import maplibregl from 'maplibre-gl'
import config from './config/index.js'

const map = new maplibregl.Map({
  container: 'map-container',
  style:
    'https://api.maptiler.com/maps/basic-v2/style.json?key=' +
    config.maptiler_key,
  maxPitch: 85,
  pitch: 60,
  canvasContextAttributes: { antialias: true },
})

window.map = map
