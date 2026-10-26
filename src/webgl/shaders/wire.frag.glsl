uniform vec3 uColor;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vNoise;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = 1.0 - clamp(dot(normal, viewDir), 0.0, 1.0);

  gl_FragColor = vec4(uColor * (0.5 + fresnel * 0.9), uOpacity * (0.35 + fresnel * 0.65));

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
