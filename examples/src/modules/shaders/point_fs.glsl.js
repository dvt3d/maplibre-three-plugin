export default /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec3 color;
uniform vec3 outlineColor;
uniform float outlineWidth;
void main() {
  vec2 coord = gl_PointCoord * 2.0 - 1.0;
  float r = length(coord);
  if (r > 1.0) {
   discard;
  }else if (r > ( 1.0 - outlineWidth / 10.0) ) {
      gl_FragColor = vec4(outlineColor, 1.0);
  } else {
      gl_FragColor = vec4(color, 1.0);
  }
}
`
