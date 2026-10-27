import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import Logo3D from './Logo3D.js'
import Glow from './Glow.js'
import { KEYFRAMES } from './keyframes.js'

const SMOOTHING = 3.2 // quanto maior, mais rápido o logo alcança o estado animado pelo GSAP
const MAX_WIDTH = 0.8 // fração máxima da largura disponível que o logo pode ocupar (sobra margem para a perspectiva)

const { damp, clamp, lerp } = THREE.MathUtils

/**
 * Experiência three.js: renderer transparente sobre o fundo da página,
 * o logo 3D, o halo e o loop. O estado (`this.state`) é animado pelo GSAP;
 * aqui ele é suavizado mais uma vez (`this.smooth`) e aplicado a cada frame.
 */
export default class Experience {
  constructor({ canvas, state, anchors = {} }) {
    this.canvas = canvas
    this.anchors = anchors
    this.state = state ?? { ...KEYFRAMES.hero, split: 0, orbit: 0, reveal: 1 }
    this.smooth = { ...this.state }
    this.pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
    this.viewport = { width: 1, height: 1, portrait: false }
    this.lastOpacity = -1
    this.symbolPosition = new THREE.Vector3()
    this.performance = { frames: 0, time: 0, checked: false }
    this.maxPixelRatio = 2

    this.setRenderer()
    this.setScene()
    this.resize()

    window.addEventListener('resize', () => this.resize())
    window.addEventListener(
      'pointermove',
      (event) => {
        this.pointer.targetX = (event.clientX / window.innerWidth) * 2 - 1
        this.pointer.targetY = (event.clientY / window.innerHeight) * 2 - 1
      },
      { passive: true },
    )
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.toneMapping = THREE.NeutralToneMapping
    this.renderer.localClippingEnabled = true
  }

  setScene() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
    this.camera.position.set(0, 0, 8)

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture
    pmrem.dispose()

    this.light = new THREE.DirectionalLight(0xffffff, 1.4)
    this.light.position.set(3, 3, 5)
    this.scene.add(this.light)

    // Plano de corte que "revela" o logo de baixo para cima na entrada
    this.clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)

    this.object = new THREE.Group()
    this.logo = new Logo3D({ clippingPlanes: [this.clip] })
    this.object.add(this.logo.group)
    this.scene.add(this.object)

    this.glow = new Glow()
    this.scene.add(this.glow.mesh)
  }

  resize() {
    const width = window.innerWidth
    const height = window.innerHeight

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.maxPixelRatio))
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.position.z
    this.viewport.width = visibleHeight * this.camera.aspect
    this.viewport.height = visibleHeight
    this.viewport.portrait = width / height < 0.9
  }

  /** Maior escala que ainda cabe na largura disponível. */
  maxScale(availableWidth) {
    return (availableWidth * MAX_WIDTH) / this.logo.size.x
  }

  /** Posição e escala (em unidades de cena) que encaixam o logo num elemento da página. */
  measureAnchor(element, fill = 0.86) {
    const rect = element.getBoundingClientRect()
    const { width, height } = this.viewport
    return {
      x: ((rect.left + rect.width / 2) / window.innerWidth - 0.5) * width,
      y: (0.5 - (rect.top + rect.height / 2) / window.innerHeight) * height,
      scale: Math.min(
        ((rect.height / window.innerHeight) * height * fill) / this.logo.size.y,
        this.maxScale((rect.width / window.innerWidth) * width),
      ),
    }
  }

  /** Mistura a posição do keyframe com a dos elementos-âncora, conforme os pesos do estado. */
  resolvePlacement() {
    const s = this.smooth
    const { width, height, portrait } = this.viewport
    const placement = {
      x: s.x * width * (portrait ? 0 : 1),
      y: s.y * height,
      scale: Math.min(s.scale, this.maxScale(width)),
    }
    const weights = { hero: s.anchorHero, contact: s.anchorContact }
    const total = Math.min(1, weights.hero + weights.contact)
    if (total < 0.001) return placement

    placement.x *= 1 - total
    placement.y *= 1 - total
    placement.scale *= 1 - total
    Object.entries(weights).forEach(([name, weight]) => {
      const element = this.anchors[name]
      if (weight < 0.001 || !element) return
      const anchor = this.measureAnchor(element)
      placement.x += anchor.x * weight
      placement.y += anchor.y * weight
      placement.scale += anchor.scale * weight
    })
    return placement
  }

  /** Se o aparelho não sustentar ~40 fps depois da entrada, renderiza em resolução menor. */
  monitorPerformance(delta) {
    const perf = this.performance
    if (perf.checked || this.state.reveal < 1) return

    perf.frames++
    perf.time += delta
    if (perf.frames < 90) return

    perf.checked = true
    if (perf.frames / perf.time < 40 && this.renderer.getPixelRatio() > 1) {
      this.maxPixelRatio = 1
      this.resize()
    }
  }

  /** Segue o estado do GSAP com amortecimento: transições sem trancos, mesmo em scroll rápido. */
  updateSmooth(dt) {
    Object.keys(this.state).forEach((key) => {
      this.smooth[key] = key === 'reveal' ? this.state[key] : damp(this.smooth[key], this.state[key], SMOOTHING, dt)
    })
  }

  update(time, delta) {
    const p = this.pointer
    const { portrait } = this.viewport
    const dt = Math.min(delta, 0.1)

    this.updateSmooth(dt)
    const s = this.smooth

    p.x = damp(p.x, p.targetX, 1.6, dt)
    p.y = damp(p.y, p.targetY, 1.6, dt)

    const reveal = clamp(s.reveal, 0, 1)
    const revealEase = 1 - Math.pow(1 - reveal, 3)
    const placement = this.resolvePlacement()
    const scale = Math.max(0.0001, placement.scale)

    this.object.position.set(placement.x + p.x * 0.04, placement.y + Math.sin(time * 0.7) * 0.02, 0)
    this.object.scale.setScalar(scale * (0.92 + 0.08 * revealEase))

    // A orientação vem do keyframe da seção; o mouse e um balanço lento dão vida sem atrapalhar a leitura
    this.object.rotation.set(
      s.rotX - p.y * 0.08 + Math.sin(time * 0.5) * 0.015,
      s.rotY + s.orbit + p.x * 0.12 + Math.sin(time * 0.35) * 0.06 - (1 - revealEase) * 0.5,
      s.rotZ,
    )

    this.logo.update({ split: s.split, focus: s.focus, dark: s.dark, lift: lerp(0.32, 0.18, s.dark) })

    const halfHeight = scale * this.logo.size.y * 0.6
    this.clip.constant = reveal >= 1 ? 1e4 : this.object.position.y + (reveal * 2 - 1) * halfHeight

    // O halo fica atrás do símbolo, como no logo
    this.object.updateMatrixWorld()
    this.logo.symbol.getWorldPosition(this.symbolPosition)
    this.glow.mesh.position.set(this.symbolPosition.x, this.symbolPosition.y, -0.9)
    this.glow.mesh.scale.setScalar(scale * (1.1 + s.split * 0.6))
    this.glow.update({ intensity: s.glow * revealEase, dark: s.dark })

    this.light.position.set(3 + p.x * 3, 3 - p.y * 3, 5)

    const opacity = s.opacity * (portrait ? lerp(0.22, 1, s.fg) : 1)
    if (Math.abs(opacity - this.lastOpacity) > 0.002) {
      this.canvas.style.opacity = opacity.toFixed(3)
      this.lastOpacity = opacity
    }

    this.renderer.render(this.scene, this.camera)
    this.monitorPerformance(delta)
  }
}
