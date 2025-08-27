export default /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D heatMap;
uniform vec3 u_color;
uniform float u_opacity;
void main() {
   gl_FragColor = vec4(u_color, u_opacity) * texture2D(heatMap, vUv);
}
`
