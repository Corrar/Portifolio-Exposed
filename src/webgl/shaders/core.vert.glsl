uniform float uTime;
uniform float uDistort;
uniform float uFrequency;
uniform float uSpeed;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vNoise;

// #include noise

float field(vec3 p) {
  float t = uTime * uSpeed;
  float n = snoise(p * uFrequency + vec3(t, t * 0.6, -t * 0.4));
  n += 0.35 * snoise(p * uFrequency * 2.2 - vec3(t * 1.3));
  return n;
}

vec3 displace(vec3 p) {
  return p + normalize(p) * field(p) * uDistort;
}

vec3 orthogonal(vec3 v) {
  return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0) : vec3(0.0, -v.z, v.y));
}

void main() {
  vec3 p = position;
  vec3 displaced = displace(p);

  // Recalcula a normal da superfície deformada por diferenças finitas
  float eps = 0.008;
  vec3 tangent = orthogonal(normal);
  vec3 bitangent = normalize(cross(normal, tangent));
  vec3 nA = displace(p + tangent * eps);
  vec3 nB = displace(p + bitangent * eps);
  vec3 displacedNormal = normalize(cross(nA - displaced, nB - displaced));

  vNoise = field(p);

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vViewPosition = -mvPosition.xyz;
  vNormal = normalize(normalMatrix * displacedNormal);
  gl_Position = projectionMatrix * mvPosition;
}
