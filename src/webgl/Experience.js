import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import LogoMark from './LogoMark.js'
import Glow from './Glow.js'
import { KEYFRAMES } from './keyframes.js'

const OBJECT_WIDTH = 2.6 // largura útil (com os traços separados) em unidades de cena

const { damp, clamp, lerp } = THREE.MathUtils

/**
 * Experiência three.js: renderer transparente sobre o fundo da página,
 * o símbolo 3D, o halo e o loop. O estado (`this.state`) é animado pelo GSAP
 * e lido aqui a cada frame.
 */
export default class Experience {
  constructor({ canvas, state, anchors = {} }) {
    this.canvas = canvas
    this.anchors = anchors
    this.state = state ?? { ...KEYFRAMES.hero, split: 0, orbit: 0, reveal: 1 }
    this.pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
    this.viewport = { width: 1, height: 1, fit: 1, portrait: false }
    this.lastOpacity = -1

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

    // Plano de corte que "revela" o símbolo de baixo para cima na entrada
    this.clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)

    this.object = new THREE.Group()
    this.logo = new LogoMark({ clippingPlanes: [this.clip] })
    this.object.add(this.logo.group)
    this.scene.add(this.object)

    this.glow = new Glow()
    this.scene.add(this.glow.mesh)
  }

  resize() {
    const width = window.innerWidth
    const height = window.innerHeight

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.position.z
    this.viewport.width = visibleHeight * this.camera.aspect
    this.viewport.height = visibleHeight
    this.viewport.fit = Math.min(1, this.viewport.width / OBJECT_WIDTH)
    this.viewport.portrait = width / height < 0.9
  }

  /** Posição e escala (em unidades de cena) que encaixam o símbolo num elemento da página. */
  measureAnchor(element, fill = 0.9) {
    const rect = element.getBoundingClientRect()
    const { width, height } = this.viewport
    return {
      x: ((rect.left + rect.width / 2) / window.innerWidth - 0.5) * width,
      y: (0.5 - (rect.top + rect.height / 2) / window.innerHeight) * height,
      scale: Math.min(((rect.height / window.innerHeight) * height * fill) / 2, width * 0.42),
    }
  }

  /** Mistura a posição do keyframe com a dos elementos-âncora, conforme os pesos do estado. */
  resolvePlacement() {
    const s = this.state
    const { width, height, fit, portrait } = this.viewport
    const placement = { x: s.x * width * (portrait ? 0 : 1), y: s.y * height, scale: s.scale * fit }
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

  update(time, delta) {
    const s = this.state
    const p = this.pointer
    const { width, portrait } = this.viewport
    const dt = Math.min(delta, 0.1)

    p.x = damp(p.x, p.targetX, 2.5, dt)
    p.y = damp(p.y, p.targetY, 2.5, dt)

    const reveal = clamp(s.reveal, 0, 1)
    const revealEase = 1 - Math.pow(1 - reveal, 3)
    const placement = this.resolvePlacement()
    const scale = Math.max(0.0001, placement.scale)

    this.object.position.set(placement.x + p.x * 0.05, placement.y + Math.sin(time * 0.8) * 0.025, 0)
    this.object.scale.setScalar(scale * (0.92 + 0.08 * revealEase))
    this.object.rotation.set(
      s.rotX - p.y * 0.12 + Math.sin(time * 0.6) * 0.025,
      s.rotY + s.orbit + p.x * 0.2 + Math.sin(time * 0.45) * 0.07 - (1 - revealEase) * 0.6,
      s.rotZ,
    )

    // Afastamento dos traços limitado pela largura da tela
    const distance = Math.min(0.95, (width * 0.3) / scale)
    this.logo.update({ split: s.split, distance, focus: s.focus, lift: lerp(0.32, 0.18, s.dark) })

    this.clip.constant = reveal >= 1 ? 1e4 : this.object.position.y + (reveal * 2 - 1) * scale * 1.45

    this.glow.mesh.position.set(this.object.position.x, this.object.position.y, -0.9)
    this.glow.mesh.scale.setScalar(scale * (1 + s.split * 0.6))
    this.glow.update({ intensity: s.glow * revealEase, dark: s.dark })

    this.light.position.set(3 + p.x * 3, 3 - p.y * 3, 5)

    const opacity = s.opacity * (portrait ? lerp(0.22, 1, s.fg) : 1)
    if (Math.abs(opacity - this.lastOpacity) > 0.002) {
      this.canvas.style.opacity = opacity.toFixed(3)
      this.lastOpacity = opacity
    }

    this.renderer.render(this.scene, this.camera)
  }
}
