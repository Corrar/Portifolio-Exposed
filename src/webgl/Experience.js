import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import Logo3D from './Logo3D.js'
import Glow from './Glow.js'
import { KEYFRAMES } from './keyframes.js'

const SMOOTH_TIME = 0.5 // segundos que o logo leva, aproximadamente, para alcançar o estado do scroll
const POINTER_SMOOTH_TIME = 0.6
const MAX_WIDTH = 0.8 // fração máxima da largura disponível que o logo pode ocupar (sobra margem para a perspectiva)

const { clamp, lerp } = THREE.MathUtils

/**
 * Mola criticamente amortecida (como o SmoothDamp da Unity): acelera e desacelera sem
 * saltos de velocidade, o que deixa o movimento fluido mesmo quando o alvo muda a cada frame.
 * A velocidade fica guardada em `velocities[key]`.
 */
function smoothDamp(current, target, velocities, key, smoothTime, dt) {
  const omega = 2 / smoothTime
  const x = omega * dt
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
  const change = current - target
  const velocity = velocities[key] ?? 0
  const temp = (velocity + omega * change) * dt
  velocities[key] = (velocity - omega * temp) * decay
  return target + (change + temp) * decay
}

/**
 * Experiência three.js: renderer transparente sobre o fundo da página,
 * o logo 3D, o halo e o loop. O estado (`this.state`) é animado pelo GSAP;
 * aqui ele segue esse estado com uma mola (`this.smooth`) e é aplicado a cada frame.
 */
export default class Experience {
  constructor({ canvas, state, anchors = {} }) {
    this.canvas = canvas
    this.anchors = anchors
    this.state = state ?? { ...KEYFRAMES.hero, split: 0, orbit: 0, reveal: 1 }
    this.smooth = { ...this.state }
    this.smoothKeys = Object.keys(this.state).filter((key) => key !== 'reveal')
    this.velocities = {}
    this.pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
    this.screen = { width: 0, height: 0, pixelRatio: 0 }
    this.viewport = { width: 1, height: 1, portrait: false }
    this.placement = { x: 0, y: 0, scale: 1 }
    this.anchor = { x: 0, y: 0, scale: 1 }
    this.lastOpacity = -1
    this.symbolPosition = new THREE.Vector3()
    this.performance = { frames: 0, time: 0, checked: false }
    this.maxPixelRatio = 2

    this.setRenderer()
    this.setScene()
    this.resize()

    // Redimensiona no máximo uma vez por frame
    let resizeQueued = false
    window.addEventListener('resize', () => {
      if (resizeQueued) return
      resizeQueued = true
      requestAnimationFrame(() => {
        resizeQueued = false
        this.resize()
      })
    })
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

  /**
   * O canvas tem a altura da maior viewport (100lvh): no celular, a barra de endereço
   * aparecendo/sumindo não muda o tamanho dele, então nada é realocado durante o scroll.
   */
  resize() {
    const width = this.canvas.clientWidth
    const height = this.canvas.clientHeight
    const pixelRatio = Math.min(window.devicePixelRatio, this.maxPixelRatio)
    const screen = this.screen
    if (width === screen.width && height === screen.height && pixelRatio === screen.pixelRatio) return
    screen.width = width
    screen.height = height
    screen.pixelRatio = pixelRatio

    this.renderer.setPixelRatio(pixelRatio)
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
    const screen = this.screen
    const anchor = this.anchor
    anchor.x = ((rect.left + rect.width / 2) / screen.width - 0.5) * width
    anchor.y = (0.5 - (rect.top + rect.height / 2) / screen.height) * height
    anchor.scale = Math.min(
      ((rect.height / screen.height) * height * fill) / this.logo.size.y,
      this.maxScale((rect.width / screen.width) * width),
    )
    return anchor
  }

  /** Soma ao posicionamento o peso de um elemento-âncora. */
  addAnchor(element, weight) {
    if (weight < 0.001 || !element) return
    const anchor = this.measureAnchor(element)
    this.placement.x += anchor.x * weight
    this.placement.y += anchor.y * weight
    this.placement.scale += anchor.scale * weight
  }

  /** Mistura a posição do keyframe com a dos elementos-âncora, conforme os pesos do estado. */
  resolvePlacement() {
    const s = this.smooth
    const { width, height, portrait } = this.viewport
    const placement = this.placement
    const free = 1 - Math.min(1, s.anchorHero + s.anchorContact)

    placement.x = s.x * width * (portrait ? 0 : 1) * free
    placement.y = s.y * height * free
    placement.scale = Math.min(s.scale, this.maxScale(width)) * free
    this.addAnchor(this.anchors.hero, s.anchorHero)
    this.addAnchor(this.anchors.contact, s.anchorContact)
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

  /** Segue o estado do GSAP com a mola: transições sem trancos, mesmo em scroll rápido. */
  updateSmooth(dt) {
    const { state, smooth, velocities, smoothKeys } = this
    for (let i = 0; i < smoothKeys.length; i++) {
      const key = smoothKeys[i]
      smooth[key] = smoothDamp(smooth[key], state[key], velocities, key, SMOOTH_TIME, dt)
    }
    smooth.reveal = state.reveal
  }

  update(time, delta) {
    const p = this.pointer
    const { portrait } = this.viewport
    const dt = Math.min(delta, 0.1)

    this.updateSmooth(dt)
    const s = this.smooth

    p.x = smoothDamp(p.x, p.targetX, this.velocities, 'pointerX', POINTER_SMOOTH_TIME, dt)
    p.y = smoothDamp(p.y, p.targetY, this.velocities, 'pointerY', POINTER_SMOOTH_TIME, dt)

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

    this.logo.update(s.split, s.focus, s.dark, lerp(0.32, 0.18, s.dark))

    const halfHeight = scale * this.logo.size.y * 0.6
    this.clip.constant = reveal >= 1 ? 1e4 : this.object.position.y + (reveal * 2 - 1) * halfHeight

    // O halo fica atrás do símbolo, como no logo
    this.object.updateMatrixWorld()
    this.logo.symbol.getWorldPosition(this.symbolPosition)
    this.glow.mesh.position.set(this.symbolPosition.x, this.symbolPosition.y, -0.9)
    this.glow.mesh.scale.setScalar(scale * (1.1 + s.split * 0.6))
    this.glow.update(s.glow * revealEase, s.dark)

    this.light.position.set(3 + p.x * 3, 3 - p.y * 3, 5)

    const opacity = clamp(s.opacity, 0, 1) * (portrait ? lerp(0.22, 1, s.fg) : 1)
    if (Math.abs(opacity - this.lastOpacity) > 0.002) {
      this.canvas.style.opacity = opacity.toFixed(3)
      this.lastOpacity = opacity
    }

    // Invisível (cases e números): não desenha, liberando a GPU para as animações da página
    if (opacity < 0.004) return
    this.renderer.render(this.scene, this.camera)
    this.monitorPerformance(delta)
  }
}
