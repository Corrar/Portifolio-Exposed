import * as THREE from 'three'

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv - 0.5;
    vec2 a = p - vec2(-0.07, 0.03);
    vec2 b = p - vec2(0.08, -0.09);
    float glowA = exp(-dot(a, a) * 26.0);
    float glowB = exp(-dot(b, b) * 34.0) * 0.55;

    vec3 color = (uColorA * glowA + uColorB * glowB) / max(glowA + glowB, 1e-4);
    float alpha = clamp(glowA + glowB, 0.0, 1.0) * uIntensity;
    gl_FragColor = vec4(color, alpha);

    #include <colorspace_fragment>
  }
`

/** Brilho difuso atrás do símbolo (o halo lilás do logo). */
export default class Glow {
  constructor() {
    this.light = { a: new THREE.Color('#d8c0ff'), b: new THREE.Color('#bdeaf7') }
    this.dark = { a: new THREE.Color('#7d45f0'), b: new THREE.Color('#1fb4e0') }

    this.uniforms = {
      uColorA: { value: new THREE.Color() },
      uColorB: { value: new THREE.Color() },
      uIntensity: { value: 0 },
    }

    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 4.6),
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: this.uniforms,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    )
    this.mesh.renderOrder = -1
  }

  update({ intensity, dark }) {
    this.uniforms.uIntensity.value = intensity * (0.85 + dark * 0.15)
    this.uniforms.uColorA.value.lerpColors(this.light.a, this.dark.a, dark)
    this.uniforms.uColorB.value.lerpColors(this.light.b, this.dark.b, dark)
  }
}
