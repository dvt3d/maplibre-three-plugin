/**
 * @author Caven Chen
 */
import { ShaderMaterial, Color } from 'three'
import point_vs from '../../shaders/point_vs.glsl.js'
import point_fs from '../../shaders/point_fs.glsl.js'

class PointMaterial extends ShaderMaterial {
  constructor(options = {}) {
    super({
      vertexShader: point_vs,
      fragmentShader: point_fs,
      depthWrite: !!options.depthWrite,
      depthTest: !!options.depthTest,
      transparent: !!options.transparent,
      uniforms: {
        pixelSize: {
          value: 30,
        },
        color: { value: options.color || new Color().setStyle('#ffffff') },
        outlineWidth: {
          value: 3,
        },
        outlineColor: {
          value: options.color || new Color().setStyle('#0000ff'),
        },
      },
    })
  }

  set color(color) {
    this.uniforms.color.value.copy(color)
  }

  get color() {
    return this.uniforms.color.value
  }

  set pixelSize(pixelSize) {
    this.uniforms.pixelSize.value = pixelSize * 30
  }

  get pixelSize() {
    return this.uniforms.pixelSize.value
  }

  set outlineWidth(outlineWidth) {
    this.uniforms.outlineWidth.value = outlineWidth
  }

  get outlineWidth() {
    return this.uniforms.outlineWidth.value
  }

  set outlineColor(outlineColor) {
    this.uniforms.outlineColo.copy(outlineColor)
  }

  get outlineColor() {
    return this.uniforms.outlineColor.value
  }
}

export default PointMaterial
