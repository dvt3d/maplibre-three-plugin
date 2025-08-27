export default /* glsl */ `
  varying vec2 vUv;
  uniform float heightFactor;
  uniform sampler2D greyMap;
  void main() {
    vUv = uv;
    vec4 frgColor = texture2D(greyMap, uv);
    float height = heightFactor * frgColor.a;
    vec3 transformed = vec3( position.x, position.y, height);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`
