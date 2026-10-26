import * as THREE from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import noise from './shaders/noise.glsl?raw'
import coreVertex from './shaders/core.vert.glsl?raw'
import coreFragment from './shaders/core.frag.glsl?raw'
import wireFragment from './shaders/wire.frag.glsl?raw'

const vertexShader = coreVertex.replace('// #include noise', noise)

function createSphere(detail) {
  const geometry = new THREE.IcosahedronGeometry(1, detail)
  geometry.deleteAttribute('uv')
  return mergeVertices(geometry)
}

/** Núcleo orgânico: esfera deformada por ruído + malha wireframe "tech". */
export default class Core {
  constructor({ detail = 64 } = {}) {
    this.group = new THREE.Group()

    this.uniforms = {
      uTime: { value: 0 },
      uDistort: { value: 0.3 },
      uFrequency: { value: 1.2 },
      uSpeed: { value: 0.22 },
      uColorA: { value: new THREE.Color() },
      uColorB: { value: new THREE.Color() },
      uRimColor: { value: new THREE.Color() },
      uFresnelPower: { value: 2.4 },
      uIntensity: { value: 1 },
    }

    this.mesh = new THREE.Mesh(
      createSphere(detail),
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: coreFragment,
        uniforms: this.uniforms,
      }),
    )

    this.wireUniforms = {
      uTime: this.uniforms.uTime,
      uDistort: this.uniforms.uDistort,
      uFrequency: this.uniforms.uFrequency,
      uSpeed: this.uniforms.uSpeed,
      uColor: this.uniforms.uRimColor,
      uOpacity: { value: 0 },
    }

    this.wire = new THREE.Mesh(
      createSphere(4),
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: wireFragment,
        uniforms: this.wireUniforms,
        wireframe: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    this.wire.scale.setScalar(1.12)

    this.group.add(this.mesh, this.wire)
  }

  update(time, { distort, frequency, wire, colors }) {
    this.uniforms.uTime.value = time
    this.uniforms.uDistort.value = distort
    this.uniforms.uFrequency.value = frequency
    this.uniforms.uColorA.value.copy(colors.a)
    this.uniforms.uColorB.value.copy(colors.b)
    this.uniforms.uRimColor.value.copy(colors.rim)

    this.wireUniforms.uOpacity.value = wire
    this.wire.visible = wire > 0.01
  }
}
