uniform float uTime;
uniform float uScroll;
uniform float uSize;
uniform float uPixelRatio;
uniform float uHeight;

attribute float aScale;
attribute float aPhase;

varying float vAlpha;

void main() {
  vec3 p = position;

  // Campo infinito: as partículas sobem com o scroll e reaparecem embaixo
  float halfHeight = uHeight * 0.5;
  p.y = mod(p.y + uScroll + halfHeight, uHeight) - halfHeight;
  p.x += sin(uTime * 0.25 + aPhase * 6.2831) * 0.2;
  p.z += cos(uTime * 0.2 + aPhase * 6.2831) * 0.2;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = uSize * aScale * uPixelRatio * (1.0 / -mvPosition.z);

  vAlpha = 0.25 + 0.75 * (0.5 + 0.5 * sin(uTime * 1.4 + aPhase * 40.0));
}
