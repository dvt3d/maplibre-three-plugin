export default /* glsl */ `
precision highp sampler2D;
precision highp usampler2D;

out vec4 vColor;
out vec2 vPosition;
uniform vec2 viewport;
uniform mat4 gsModelViewMatrix;

attribute uint splatIndex;
uniform sampler2D centerAndScaleTexture;
uniform usampler2D covAndColorTexture;

vec2 unpackInt16(in uint value) {
  int v = int(value);
  int v0 = v >> 16;
  int v1 = (v & 0xFFFF);
  if((v & 0x8000) != 0)
    v1 |= 0xFFFF0000;
  return vec2(float(v1), float(v0));
}

vec4 calcCovVectors(vec3 viewPos, mat3 Vrk) {
  float focal = (viewport.y / 2.0) * abs(projectionMatrix[1][1]);
  mat3 J = mat3(
    focal / viewPos.z, 0., -(focal * viewPos.x) / (viewPos.z * viewPos.z), 
    0., focal / viewPos.z, -(focal * viewPos.y) / (viewPos.z * viewPos.z), 
    0., 0., 0.
  );
  mat3 W = transpose(mat3(gsModelViewMatrix));
  mat3 T = W * J;
  mat3 cov = transpose(T) * Vrk * T;
  float diagonal1 = cov[0][0] + 0.3;
  float offDiagonal = cov[0][1];
  float diagonal2 = cov[1][1] + 0.3;
  float mid = 0.5 * (diagonal1 + diagonal2);
  float radius = length(vec2((diagonal1 - diagonal2) / 2.0, offDiagonal));
  float lambda1 = mid + radius;
  float lambda2 = max(mid - radius, 0.1);
  vec2 diagonalVector = normalize(vec2(offDiagonal, lambda1 - diagonal1));
  vec2 v1 = min(sqrt(2.0 * lambda1), 1024.0) * diagonalVector;
  vec2 v2 = min(sqrt(2.0 * lambda2), 1024.0) * vec2(diagonalVector.y, -diagonalVector.x);
  return vec4(v1,v2);
}


void main () {

  ivec2 texSize = textureSize(centerAndScaleTexture, 0);
  ivec2 texPos = ivec2(splatIndex % uint(texSize.x), splatIndex / uint(texSize.x));
  
  vec4 centerAndScaleData = texelFetch(centerAndScaleTexture, texPos, 0);
  vec4 viewPos = gsModelViewMatrix * vec4(centerAndScaleData.xyz, 1);
  
  vec4 pos2d = projectionMatrix * viewPos;
  float clip = 1.2 * pos2d.w;
  
  if (pos2d.z < -pos2d.w || pos2d.x < -clip || pos2d.x > clip
    || pos2d.y < -clip || pos2d.y > clip) {
    gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
    return;
  }
  
  uvec4 covAndColorData = texelFetch(covAndColorTexture, texPos, 0);
  vec2 cov3D_M11_M12 = unpackInt16(covAndColorData.x) * centerAndScaleData.w;
  vec2 cov3D_M13_M22 = unpackInt16(covAndColorData.y) * centerAndScaleData.w;
  vec2 cov3D_M23_M33 = unpackInt16(covAndColorData.z) * centerAndScaleData.w;
  mat3 Vrk = mat3(
    cov3D_M11_M12.x, cov3D_M11_M12.y, cov3D_M13_M22.x,
    cov3D_M11_M12.y, cov3D_M13_M22.y, cov3D_M23_M33.x,
    cov3D_M13_M22.x, cov3D_M23_M33.x, cov3D_M23_M33.y
  );

  vec4 covVectors = calcCovVectors(viewPos.xyz, Vrk);
  vPosition = position.xy;
  uint colorUint = covAndColorData.w;
  vColor = vec4(
    float(colorUint & uint(0xFF)) / 255.0,
    float((colorUint >> uint(8)) & uint(0xFF)) / 255.0,
    float((colorUint >> uint(16)) & uint(0xFF)) / 255.0,
    float(colorUint >> uint(24)) / 255.0
  );
  vec2 vCenter = vec2(pos2d) / pos2d.w;
  gl_Position = vec4( vCenter + (position.x * covVectors.zw + position.y * covVectors.xy) / viewport * 2.0, pos2d.z / pos2d.w, 1.0);
}
`
