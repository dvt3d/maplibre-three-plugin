import { CanvasTexture, Group, Mesh, PlaneGeometry, Vector3 } from 'three'
import { HeatMapMaterial } from '../material/index.js'
import { SceneTransform } from '@dvt3d/maplibre-three-plugin'
import { Util } from '../utils/index.js'

const DEF_OPTS = {
  h337: null,
  width: 256,
  height: 256,
  radius: 10,
  heightFactor: 10,
  pad: 0.05,
  clamp: false,
  gradient: {
    0.2: '#24d560',
    0.4: '#9cd522',
    0.6: '#f1e12a',
    0.8: '#ffbf3a',
    1.0: '#ff0000',
  },
}

class HeatMap {
  constructor(container, options = {}) {
    if (!container) {
      throw 'container is required'
    }

    if (!options.h337) {
      throw 'heatmap h337 is required'
    }

    this._options = {
      ...DEF_OPTS,
      ...options,
    }

    container.setAttribute('id', Util.uuid())
    container.style.cssText = `width:${this._options.width}px;height:${this._options.height}px;visibility:hidden;`

    this._colorMap = this._options.h337.create({
      container: container,
      backgroundColor: 'rgba(0,0,0,0)',
      radius: this._options.radius,
      gradient: this._options.gradient,
    })

    this._grayMap = this._options.h337.create({
      container: container,
      backgroundColor: 'rgba(0,0,0,0)',
      radius: this._options.radius,
      gradient: {
        0: 'black',
        1: 'white',
      },
    })

    this._colorTexture = new CanvasTexture(this._colorMap._renderer.canvas)
    this._grayTexture = new CanvasTexture(this._grayMap._renderer.canvas)

    this._delegate = new Mesh(
      new PlaneGeometry(1, 1),
      new HeatMapMaterial({
        ...this._options,
        colorTexture: this._colorTexture,
        grayTexture: this._grayTexture,
      })
    )

    this._position = new Vector3()
    this._size = new Vector3()
  }

  get delegate() {
    return this._delegate
  }

  get position() {
    return this._position
  }

  get size() {
    return this._size
  }

  /**
   *
   * @param points
   * @returns {{bounds: (number|number)[], positions: *[], minValue: number, maxValue: number, values: *[]}}
   * @private
   */
  _parse(points) {
    let xMin = Infinity
    let xMax = -Infinity
    let yMin = Infinity
    let yMax = -Infinity
    let maxValue = -Infinity
    let minValue = Infinity
    let positions = []
    let values = []
    for (let i = 0; i < points.length; i++) {
      let point = points[i]
      let v = SceneTransform.lngLatToVector3(point.lng, point.lat)

      if (v.x < xMin) {
        xMin = v.x
      }
      if (v.x > xMax) {
        xMax = v.x
      }
      if (v.y < yMin) {
        yMin = v.y
      }
      if (v.y > yMax) {
        yMax = v.y
      }
      positions.push(v)
      if (point.value < minValue) {
        minValue = point.value
      }

      if (point.value > maxValue) {
        maxValue = point.value
      }

      values.push(point.value)
    }
    return {
      bounds: [xMin, yMin, xMax, yMax],
      positions,
      minValue,
      maxValue,
      values,
    }
  }

  /**
   *
   * @param bounds
   * @returns {function(*): [number,number]}
   * @private
   */
  _generateCanvasProjector(bounds) {
    const pad = this._options.pad
    const clamp = this._options.clamp
    const [xMin, yMin, xMax, yMax] = bounds
    const px = Math.abs(xMax - xMin) * pad
    const py = Math.abs(yMax - yMin) * pad

    const x_min = xMin - px
    const x_max = xMax + px
    const y_min = yMin - py
    const y_max = yMax + py

    const invW = 1.0 / Math.abs(x_max - x_min)
    const invH = 1.0 / Math.abs(y_max - y_min)

    return (v) => {
      const u = (v.x - x_min) * invW
      const vNorm = 1.0 - (v.y - y_min) * invH
      let x = u * this._options.width
      let y = vNorm * this._options.height
      if (clamp) {
        x = Math.min(this._options.width, Math.max(0, x))
        y = Math.min(this._options.height, Math.max(0, y))
      }
      return [x, y]
    }
  }

  /**
   *
   * @param points
   * @returns {HeatMap}
   */
  setPoints(points) {
    let { bounds, positions, values, minValue, maxValue } = this._parse(points)

    let toCanvas = this._generateCanvasProjector(bounds)
    let heatMapData = positions.map((v, index) => {
      const [cx, cy] = toCanvas(v)
      return { x: Math.floor(cx), y: Math.floor(cy), value: values[index] }
    })
    this._colorMap.setData({
      min: minValue,
      max: maxValue,
      data: heatMapData,
    })
    this._grayMap.setData({
      min: minValue,
      max: maxValue,
      data: heatMapData,
    })

    this._colorTexture.needsUpdate = true
    this._grayTexture.needsUpdate = true
    this._delegate.geometry.dispose()
    const width = Math.abs(bounds[2] - bounds[0])
    const height = Math.abs(bounds[3] - bounds[1])
    this._delegate.geometry = new PlaneGeometry(width, height, 300, 300)
    this._position.set(
      (bounds[0] + bounds[2]) / 2,
      (bounds[1] + bounds[3]) / 2,
      0
    )
    this._size.set(width, height, this._options.heightFactor * maxValue)
    this._delegate.position.copy(this._position)

    return this
  }
}

export default HeatMap
