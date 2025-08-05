import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    rollupOptions: {
      input:
        {
          'main': resolve(__dirname, 'html/index.html'),
          '3d-tiles': resolve(__dirname, 'html/3d-tiles.html'),
          '3d-tiles-3dgs': resolve(__dirname, 'html/3d-tiles-3dgs.html'),
          '3d-tiles-cesium-ion': resolve(__dirname, 'html/3d-tiles-cesium-ion.html'),
          '3d-tiles-osgb': resolve(__dirname, 'html/3d-tiles-osgb.html'),
          '3d-tiles-shadow': resolve(__dirname, 'html/3d-tiles-shadow.html'),
          '3d-tiles-spz': resolve(__dirname, 'html/3d-tiles-spz.html'),
          '3dgs-ply': resolve(__dirname, 'html/3dgs-ply.html'),
          '3dgs-splat': resolve(__dirname, 'html/3dgs-splat.html'),
          'billboard': resolve(__dirname, 'html/billboard.html'),
          'div-icon': resolve(__dirname, 'html/div-icon.html'),
          'point': resolve(__dirname, 'html/point.html'),
          'point-collection': resolve(__dirname, 'html/point-collection.html'),
          'shadow': resolve(__dirname, 'html/shadow.html'),
          'sun-light': resolve(__dirname, 'html/sun-light.html'),
          'sun-shadow': resolve(__dirname, 'html/sun-shadow.html'),
        },
    },
  },
})
