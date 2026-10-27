import * as THREE from 'three'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import extraBoldData from './fonts/inter-extrabold.json'
import regularData from './fonts/inter-regular.json'

/**
 * Logo da Exposed Visualls em 3D: o símbolo (dois traços) + "EX / POSED" + "VISUALLS".
 * Coordenadas em "unidades do símbolo": altura do símbolo = 2, centro do símbolo na origem.
 */

// Mesmos pontos do <symbol id="ev-mark"> do HTML
const STROKES = [
  {
    side: -1,
    points: [[0.44, 1], [-0.488, 1], [0.36, -0.453], [0.488, -0.245]],
    gradient: { from: [-0.488, 1], to: [0.36, -0.453], colors: ['#c69af8', '#9254ee'] },
    z: -0.03,
  },
  {
    side: 1,
    points: [[0.456, -1], [-0.488, -1], [0.36, 0.456], [0.488, 0.248]],
    gradient: { from: [-0.488, -1], to: [0.36, 0.456], colors: ['#22c3e6', '#5b8ff0'] },
    z: 0.03,
  },
]

const STROKE_HALF_WIDTH = 0.042
const STROKE_DEPTH = 0.08

// Posição das palavras medida no logo (o símbolo tem a altura de EX + POSED)
const WORDS = [
  { key: 'ex', text: 'EX', font: 'bold', x: 0.6, top: 0.92, cap: 0.8, tracking: -0.02, depth: 0.16 },
  { key: 'posed', text: 'POSED', font: 'bold', x: 0.6, top: -0.2, cap: 0.8, tracking: -0.02, depth: 0.16 },
  { key: 'visualls', text: 'VISUALLS', font: 'regular', alignRight: 'posed', top: -1.2, cap: 0.24, tracking: 0.1, depth: 0.05 },
]

const loader = new FontLoader()
const FONTS = { bold: loader.parse(extraBoldData), regular: loader.parse(regularData) }

const INK = new THREE.Color('#0b0b0d')
const INK_DARK = new THREE.Color('#f5f5f7')

/* -------------------------------------------------------------------------- */

/** Contorno (com cantos em esquadria) de uma polilinha aberta. */
function strokeShape(points, halfWidth) {
  const pts = points.map(([x, y]) => new THREE.Vector2(x, y))
  const left = []
  const right = []
  const origin = new THREE.Vector2()

  pts.forEach((current, i) => {
    const prev = pts[i - 1]
    const next = pts[i + 1]
    const normalIn = prev && current.clone().sub(prev).normalize().rotateAround(origin, Math.PI / 2)
    const normalOut = next && next.clone().sub(current).normalize().rotateAround(origin, Math.PI / 2)

    let offset
    if (normalIn && normalOut) {
      const miter = normalIn.clone().add(normalOut).normalize()
      offset = miter.multiplyScalar(halfWidth / Math.max(miter.dot(normalIn), 0.25))
    } else {
      offset = (normalIn ?? normalOut).clone().multiplyScalar(halfWidth)
    }

    left.push(current.clone().add(offset))
    right.push(current.clone().sub(offset))
  })

  return new THREE.Shape([...left, ...right.reverse()])
}

/** Cor de vértice ao longo de um eixo (gradiente da marca). */
function paintGradient(geometry, from, to, colors) {
  const start = new THREE.Vector2(...from)
  const axis = new THREE.Vector2(...to).sub(start)
  const lengthSq = axis.lengthSq()
  const colorA = new THREE.Color(colors[0])
  const colorB = new THREE.Color(colors[1])
  const color = new THREE.Color()
  const point = new THREE.Vector2()
  const position = geometry.attributes.position
  const values = new Float32Array(position.count * 3)

  for (let i = 0; i < position.count; i++) {
    point.set(position.getX(i), position.getY(i)).sub(start)
    const t = THREE.MathUtils.clamp(point.dot(axis) / lengthSq, 0, 1)
    color.lerpColors(colorA, colorB, t).toArray(values, i * 3)
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(values, 3))
}

/** Material com gradiente por vértice + leve emissão para manter o tom fiel sobre o branco. */
function gradientMaterial(lift, clippingPlanes) {
  const material = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    iridescence: 0.25,
    iridescenceIOR: 1.3,
    transparent: true,
    clippingPlanes,
  })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uLift = lift
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uLift;')
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += vColor.rgb * uLift;',
      )
  }
  return material
}

/** Texto extrudado com espaçamento entre letras, encaixado pela altura das maiúsculas. */
function wordGeometry({ text, font, cap, tracking, depth }) {
  const data = FONTS[font].data
  const parts = []
  let cursor = 0

  for (const char of text) {
    const geometry = new THREE.ExtrudeGeometry(FONTS[font].generateShapes(char, 1), {
      depth,
      curveSegments: 5,
      bevelEnabled: true,
      bevelThickness: Math.min(0.02, depth * 0.25),
      bevelSize: 0.008,
      bevelSegments: 2,
    })
    geometry.translate(cursor, 0, 0)
    parts.push(geometry)
    cursor += data.glyphs[char].ha / data.resolution + tracking
  }

  const geometry = mergeGeometries(parts)
  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  const scale = cap / (box.max.y - box.min.y)
  geometry.translate(-box.min.x, -box.max.y, -depth / 2)
  geometry.scale(scale, scale, 1)
  geometry.computeBoundingBox()
  return geometry
}

/* -------------------------------------------------------------------------- */

export default class Logo3D {
  constructor({ clippingPlanes = [] } = {}) {
    this.group = new THREE.Group()
    this.content = new THREE.Group()
    this.group.add(this.content)
    this.lift = { value: 0.32 }

    // Símbolo
    this.strokes = STROKES.map((config) => {
      const geometry = new THREE.ExtrudeGeometry(strokeShape(config.points, STROKE_HALF_WIDTH), {
        depth: STROKE_DEPTH,
        bevelEnabled: true,
        bevelThickness: 0.016,
        bevelSize: 0.012,
        bevelSegments: 5,
        curveSegments: 1,
      })
      geometry.translate(0, 0, -STROKE_DEPTH / 2)
      paintGradient(geometry, config.gradient.from, config.gradient.to, config.gradient.colors)

      const material = gradientMaterial(this.lift, clippingPlanes)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.z = config.z
      this.content.add(mesh)
      return { mesh, material, config }
    })
    this.strokes[1].mesh.renderOrder = 1

    // Palavras
    // Sem clearcoat: as letras ocupam bastante tela, e o reflexo do ambiente já dá o brilho
    this.inkMaterial = new THREE.MeshStandardMaterial({
      color: INK,
      roughness: 0.24,
      transparent: true,
      clippingPlanes,
    })
    this.visuallsMaterial = gradientMaterial(this.lift, clippingPlanes)

    const placed = {}
    this.words = WORDS.map((word) => {
      const geometry = wordGeometry(word)
      const width = geometry.boundingBox.max.x
      const x = word.alignRight ? placed[word.alignRight].x + placed[word.alignRight].width - width : word.x
      placed[word.key] = { x, width }

      if (word.key === 'visualls') paintGradient(geometry, [0, 0], [width, 0], ['#9a6cf0', '#8fb2f4'])
      const mesh = new THREE.Mesh(geometry, word.key === 'visualls' ? this.visuallsMaterial : this.inkMaterial)
      mesh.position.set(x, word.top, 0)
      this.content.add(mesh)
      return { mesh, word }
    })

    // Centraliza o conjunto e guarda medidas para o layout
    const box = new THREE.Box3().setFromObject(this.content)
    this.size = box.getSize(new THREE.Vector3())
    this.center = box.getCenter(new THREE.Vector3())
    this.content.position.copy(this.center).negate()

    // Ponto no centro do símbolo (o halo e a separação se orientam por ele)
    this.symbol = new THREE.Object3D()
    this.content.add(this.symbol)
  }

  /**
   * @param {number} split  0 = logo montado, 1 = vista "explodida": o símbolo vai para o centro,
   *                        os traços se afastam (violeta à esquerda, azul à direita) e as letras recuam
   * @param {number} focus  -1 destaca o traço violeta (marketing), 1 o azul (automação)
   * @param {number} dark   0 = letras pretas (fundo branco), 1 = letras claras (fundo preto)
   */
  update(split, focus, dark, lift) {
    this.lift.value = lift
    this.content.position.set(-this.center.x * (1 - split), -this.center.y * (1 - split), 0)

    for (let i = 0; i < this.strokes.length; i++) {
      const { mesh, material, config } = this.strokes[i]
      const { side, z } = config
      mesh.position.set(side * split * 0.7, -side * split * 0.06, z + split * (side === -1 ? 0.5 : 0.25))
      const ghost = Math.max(0, side === -1 ? focus : -focus)
      material.opacity = 1 - ghost * 0.8
      material.depthWrite = material.opacity > 0.99
    }

    for (let i = 0; i < this.words.length; i++) {
      this.words[i].mesh.position.z = -split * (0.8 + i * 0.25)
    }
    const wordOpacity = Math.pow(1 - split, 1.6)
    this.inkMaterial.opacity = wordOpacity
    this.inkMaterial.depthWrite = wordOpacity > 0.99
    this.inkMaterial.color.lerpColors(INK, INK_DARK, dark)
    this.visuallsMaterial.opacity = wordOpacity
  }
}
