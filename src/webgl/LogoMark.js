import * as THREE from 'three'

/**
 * Traços do símbolo da Exposed Visualls, normalizados (altura 2, centro na
 * origem, y para cima). São os mesmos pontos do <symbol id="ev-mark"> do HTML.
 */
const STROKES = {
  violet: {
    points: [[0.44, 1], [-0.488, 1], [0.36, -0.453], [0.488, -0.245]],
    gradient: { from: [-0.488, 1], to: [0.36, -0.453], colors: ['#c69af8', '#9254ee'] },
    z: -0.055,
    side: -1,
  },
  blue: {
    points: [[0.456, -1], [-0.488, -1], [0.36, 0.456], [0.488, 0.248]],
    gradient: { from: [-0.488, -1], to: [0.36, 0.456], colors: ['#22c3e6', '#5b8ff0'] },
    z: 0.055,
    side: 1,
  },
}

const HALF_WIDTH = 0.04
const DEPTH = 0.06

/** Contorno (com cantos em esquadria) de uma polilinha aberta. */
function strokeShape(points, halfWidth) {
  const pts = points.map(([x, y]) => new THREE.Vector2(x, y))
  const left = []
  const right = []

  pts.forEach((current, i) => {
    const prev = pts[i - 1]
    const next = pts[i + 1]
    const normalIn = prev && current.clone().sub(prev).normalize().rotateAround(new THREE.Vector2(), Math.PI / 2)
    const normalOut = next && next.clone().sub(current).normalize().rotateAround(new THREE.Vector2(), Math.PI / 2)

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

function createStroke({ points, gradient }, clippingPlanes, lift) {
  const geometry = new THREE.ExtrudeGeometry(strokeShape(points, HALF_WIDTH), {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.016,
    bevelSize: 0.012,
    bevelSegments: 5,
    curveSegments: 1,
  })
  geometry.translate(0, 0, -DEPTH / 2)

  // Gradiente da marca como cor de vértice, ao longo da diagonal do traço
  const from = new THREE.Vector2(...gradient.from)
  const axis = new THREE.Vector2(...gradient.to).sub(from)
  const lengthSq = axis.lengthSq()
  const colorA = new THREE.Color(gradient.colors[0])
  const colorB = new THREE.Color(gradient.colors[1])
  const color = new THREE.Color()
  const position = geometry.attributes.position
  const colors = new Float32Array(position.count * 3)
  const point = new THREE.Vector2()

  for (let i = 0; i < position.count; i++) {
    point.set(position.getX(i), position.getY(i)).sub(from)
    const t = THREE.MathUtils.clamp(point.dot(axis) / lengthSq, 0, 1)
    color.lerpColors(colorA, colorB, t).toArray(colors, i * 3)
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.2,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    iridescence: 0.3,
    iridescenceIOR: 1.3,
    envMapIntensity: 1.05,
    transparent: true,
    clippingPlanes,
  })

  // Um pouco de emissão com a própria cor mantém o tom fiel ao logo sobre o branco
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uLift = lift
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uLift;')
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += vColor.rgb * uLift;',
      )
  }

  const mesh = new THREE.Mesh(geometry, material)
  const pivot = new THREE.Group()
  pivot.add(mesh)
  return { pivot, mesh, material }
}

/** O símbolo em 3D: dois traços (violeta = marketing, azul = automação). */
export default class LogoMark {
  constructor({ clippingPlanes = [] } = {}) {
    this.group = new THREE.Group()
    this.lift = { value: 0.32 }

    this.strokes = Object.fromEntries(
      Object.entries(STROKES).map(([name, config]) => {
        const stroke = createStroke(config, clippingPlanes, this.lift)
        stroke.config = config
        stroke.pivot.position.z = config.z
        this.group.add(stroke.pivot)
        return [name, stroke]
      }),
    )
    this.strokes.blue.mesh.renderOrder = 1
  }

  /**
   * @param {number} split     0 = símbolo montado, 1 = traços separados
   * @param {number} distance  afastamento lateral máximo (unidades locais)
   * @param {number} focus     -1 destaca o violeta, 1 destaca o azul
   */
  update({ split, distance, focus, lift }) {
    this.lift.value = lift

    Object.values(this.strokes).forEach(({ pivot, material, config }) => {
      const { side } = config
      pivot.position.set(side * split * distance, -side * split * 0.12, config.z + side * split * 0.12)
      pivot.rotation.y = side * split * 0.55

      // O traço "fora de foco" vira um fantasma translúcido
      const ghost = Math.max(0, side === -1 ? focus : -focus)
      material.opacity = 1 - ghost * 0.82
      material.depthWrite = material.opacity > 0.99
      pivot.scale.setScalar(1 - ghost * 0.08)
    })
  }
}
