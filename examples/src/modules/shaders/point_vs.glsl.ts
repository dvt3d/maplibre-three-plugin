export default /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float pixelSize;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = pixelSize;
}
`
