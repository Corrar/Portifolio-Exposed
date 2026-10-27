import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

const HALF_BASE = 0.36 // meia-largura da base quadrada de cada pirâmide
const HEIGHT = 1 // altura de cada pirâmide; as pontas se encontram no centro
const RADIUS = 0.022 // espessura das arestas

/** As duas metades da ampulheta: violeta = marketing (em cima), azul = automação (embaixo). */
const HALVES = {
  top: { sign: 1, side: -1, colors: { base: '#c69af8', apex: '#8f52ee' }, tint: '#b48cf5' },
  bottom: { sign: -1, side: 1, colors: { base: '#22c3e6', apex: '#5b8ff0' }, tint: '#45c2ea' },
}

const UP = new THREE.Vector3(0, 1, 0)

function edge(a, b) {
  const direction = b.clone().sub(a)
  const geometry = new THREE.CylinderGeometry(RADIUS, RADIUS, direction.length(), 16, 1, true)
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, direction.normalize()))
  geometry.translate(...a.clone().add(b).multiplyScalar(0.5).toArray())
  return geometry
}

function joint(point) {
  const geometry = new THREE.SphereGeometry(RADIUS * 1.04, 16, 12)
  geometry.translate(point.x, point.y, point.z)
  return geometry
}

/** Uma pirâmide de base quadrada: arestas sólidas com gradiente + faces de vidro. */
function createHalf({ sign, colors, tint }, clippingPlanes, lift) {
  const apex = new THREE.Vector3(0, 0, 0)
  const corners = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([x, z]) => new THREE.Vector3(x * HALF_BASE, sign * HEIGHT, z * HALF_BASE))

  // Arestas: 4 laterais + 4 da base, com esferas nas quinas para juntas suaves
  const parts = [joint(apex)]
  corners.forEach((corner, i) => {
    parts.push(edge(apex, corner), edge(corner, corners[(i + 1) % 4]), joint(corner))
  })
  const edges = mergeGeometries(parts)

  // Gradiente da base até a ponta
  const base = new THREE.Color(colors.base)
  const tip = new THREE.Color(colors.apex)
  const color = new THREE.Color()
  const position = edges.attributes.position
  const vertexColors = new Float32Array(position.count * 3)
  for (let i = 0; i < position.count; i++) {
    const t = THREE.MathUtils.clamp(1 - Math.abs(position.getY(i)) / HEIGHT, 0, 1)
    color.lerpColors(base, tip, t).toArray(vertexColors, i * 3)
  }
  edges.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3))

  const edgeMaterial = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.2,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    iridescence: 0.3,
    iridescenceIOR: 1.3,
    transparent: true,
    clippingPlanes,
  })
  // Um pouco de emissão com a própria cor mantém o tom fiel ao logo sobre o branco
  edgeMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uLift = lift
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uLift;')
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += vColor.rgb * uLift;',
      )
  }

  const vertices = []
  corners.forEach((corner, i) => vertices.push(apex, corner, corners[(i + 1) % 4]))
  vertices.push(corners[0], corners[1], corners[2], corners[0], corners[2], corners[3])
  const faces = new THREE.BufferGeometry().setFromPoints(vertices)
  faces.computeVertexNormals()

  const faceMaterial = new THREE.MeshPhysicalMaterial({
    color: tint,
    transparent: true,
    opacity: 0.16,
    roughness: 0.08,
    metalness: 0,
    clearcoat: 1,
    envMapIntensity: 1.2,
    side: THREE.DoubleSide,
    depthWrite: false,
    clippingPlanes,
  })

  const facesMesh = new THREE.Mesh(faces, faceMaterial)
  const edgesMesh = new THREE.Mesh(edges, edgeMaterial)
  edgesMesh.renderOrder = 1

  // pivot: posição/inclinação da metade · spinner: giro em torno do próprio eixo
  const pivot = new THREE.Group()
  const spinner = new THREE.Group()
  spinner.add(facesMesh, edgesMesh)
  pivot.add(spinner)
  return { pivot, spinner, edgeMaterial, faceMaterial, faceOpacity: faceMaterial.opacity }
}

/** A ampulheta 3D: duas pirâmides de cores diferentes unidas pelas pontas. */
export default class Hourglass {
  constructor({ clippingPlanes = [] } = {}) {
    this.group = new THREE.Group()
    this.lift = { value: 0.32 }

    this.halves = Object.values(HALVES).map((config) => {
      const half = createHalf(config, clippingPlanes, this.lift)
      half.config = config
      this.group.add(half.pivot)
      return half
    })
  }

  /**
   * @param {number} split     0 = ampulheta montada, 1 = metades separadas
   * @param {number} distance  afastamento lateral máximo (unidades locais)
   * @param {number} spin      giro das metades em torno do eixo vertical
   * @param {number} focus     -1 destaca a metade violeta, 1 destaca a azul
   */
  update({ split, distance, spin, focus, lift }) {
    this.lift.value = lift

    this.halves.forEach(({ pivot, spinner, config, edgeMaterial, faceMaterial, faceOpacity }) => {
      const { side, sign } = config

      // A separação acontece no plano da tela (violeta à esquerda, azul à direita),
      // e cada metade gira no próprio eixo, começando pela quina (45°) para ler como volume
      pivot.position.set(side * split * distance, sign * split * 0.16, 0)
      pivot.rotation.z = -side * split * 0.1
      spinner.rotation.y = Math.PI / 4 + spin + side * split * 0.3

      // A metade "fora de foco" vira um fantasma translúcido
      const ghost = Math.max(0, side === -1 ? focus : -focus)
      edgeMaterial.opacity = 1 - ghost * 0.8
      edgeMaterial.depthWrite = edgeMaterial.opacity > 0.99
      faceMaterial.opacity = faceOpacity * (1 - ghost * 0.7)
    })
  }
}
