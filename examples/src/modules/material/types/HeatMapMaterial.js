import { Color, ShaderMaterial } from 'three'
import heat_map_vs from '../../shaders/heat_map_vs_glsl.js'
import heat_map_fs from '../../shaders/heat_map_fs_glsl.js'

class HeatMapMaterial extends ShaderMaterial {
  constructor(options = {}) {
    super({
      depthWrite: true,
      depthTest: true,
      transparent: true,
      vertexShader: heat_map_vs,
      fragmentShader: heat_map_fs,
      uniforms: {
        heatMap: { value: options.colorTexture },
        greyMap: { value: options.grayTexture },
        heightFactor: { value: options.heightFactor },
        u_color: { value: options.color || new Color().setStyle('#ffffff') },
        u_opacity: { value: options.opacity ?? 1.0 },
      },
    })
  }
}

export default HeatMapMaterial
