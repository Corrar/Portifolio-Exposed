uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uRimColor;
uniform float uFresnelPower;
uniform float uIntensity;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vNoise;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  float facing = clamp(dot(normal, viewDir), 0.0, 1.0);
  float fresnel = pow(1.0 - facing, uFresnelPower);

  // Gradiente da marca guiado pela orientação da superfície e pelo ruído
  float g = smoothstep(-0.2, 1.1, normal.y * 0.5 + 0.5 + vNoise * 0.35);
  vec3 base = mix(uColorA, uColorB, g);

  vec3 lightDir = normalize(vec3(0.5, 0.8, 0.9));
  float diffuse = clamp(dot(normal, lightDir), 0.0, 1.0);
  vec3 halfDir = normalize(lightDir + viewDir);
  float specular = pow(clamp(dot(normal, halfDir), 0.0, 1.0), 60.0);

  vec3 color = base * (0.12 + 0.8 * diffuse);
  color += uRimColor * fresnel * 1.4;
  color += vec3(1.0) * specular * 0.7;

  // Película iridescente sutil
  vec3 irid = 0.5 + 0.5 * cos(6.28318 * (fresnel * 0.9 + vNoise * 0.4 + vec3(0.0, 0.33, 0.67)));
  color = mix(color, color * irid * 1.5, 0.3 * fresnel + 0.1);

  gl_FragColor = vec4(color * uIntensity, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
