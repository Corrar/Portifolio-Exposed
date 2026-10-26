import * as THREE from 'three'
import vertexShader from './shaders/particles.vert.glsl?raw'
import fragmentShader from './shaders/particles.frag.glsl?raw'

const FIELD = { width: 28, height: 24, near: 3, far: -14 }

/** Campo de partículas que acompanha o scroll com profundidade (parallax). */
export default class Particles {
  constructor({ count = 1600, pixelRatio = 1 } = {}) {
    const positions = new Float32Array(count * 3)
    const scales = new Float32Array(count)
    const phases = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * FIELD.width
      positions[i * 3 + 1] = (Math.random() - 0.5) * FIELD.height
      positions[i * 3 + 2] = FIELD.far + Math.random() * (FIELD.near - FIELD.far)
      scales[i] = 0.4 + Math.random() * 1.2
      phases[i] = Math.random()
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))

    this.uniforms = {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uSize: { value: 42 },
      uPixelRatio: { value: pixelRatio },
      uHeight: { value: FIELD.height },
      uColor: { value: new THREE.Color() },
      uOpacity: { value: 0.85 },
    }

    this.points = new THREE.Points(
      geometry,
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: this.uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    this.points.frustumCulled = false
  }

  setPixelRatio(pixelRatio) {
    this.uniforms.uPixelRatio.value = pixelRatio
  }

  update(time, { scroll, color }) {
    this.uniforms.uTime.value = time
    this.uniforms.uScroll.value = scroll
    this.uniforms.uColor.value.copy(color)
  }
}
