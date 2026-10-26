import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import Core from './Core.js'
import Rings from './Rings.js'
import Particles from './Particles.js'
import { KEYFRAMES, PALETTES } from './keyframes.js'

// Preto puro: é o único tom que sai idêntico com e sem pós-processamento (o tone mapping esmaga tons escuros)
const BACKGROUND = '#000000'
const OBJECT_SIZE = 5.4 // diâmetro aproximado do objeto (anéis incluídos) em unidades de cena

const { damp, clamp } = THREE.MathUtils

/**
 * Experiência three.js: renderer, câmera, cena e loop.
 * O estado (`this.state`) é animado de fora pelo GSAP (SceneDirector)
 * e lido aqui a cada frame.
 */
export default class Experience {
  constructor({ canvas, quality = 'high' }) {
    this.canvas = canvas
    this.quality = quality
    this.useBloom = quality === 'high'

    this.state = { ...KEYFRAMES.hero, orbit: 0, intro: 0 }
    this.pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
    this.scroll = { offset: 0, velocity: 0 }
    this.viewport = { width: 1, height: 1, fit: 1, portrait: false }
    this.palette = PALETTES.map((p) => ({
      a: new THREE.Color(p.a),
      b: new THREE.Color(p.b),
      rim: new THREE.Color(p.rim),
    }))
    this.colors = { a: new THREE.Color(), b: new THREE.Color(), rim: new THREE.Color(), particles: new THREE.Color() }
    this.lastDim = -1
    this.performance = { frames: 0, time: 0, checked: false }

    this.setRenderer()
    this.setScene()
    this.setPostProcessing()
    this.resize()

    this.onResize = this.resize.bind(this)
    this.onPointerMove = this.handlePointer.bind(this)
    window.addEventListener('resize', this.onResize)
    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.useBloom,
      powerPreference: 'high-performance',
    })
    this.renderer.setClearColor(BACKGROUND, 1)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
  }

  setScene() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
    this.camera.position.set(0, 0, 9)

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()

    this.object = new THREE.Group()
    this.core = new Core({ detail: this.quality === 'high' ? 64 : 28 })
    this.rings = new Rings()
    this.object.add(this.core.group, this.rings.group)
    this.scene.add(this.object)

    this.particles = new Particles({ count: this.quality === 'high' ? 1600 : 700 })
    this.scene.add(this.particles.points)
  }

  setPostProcessing() {
    if (!this.useBloom) return

    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 })
    this.composer = new EffectComposer(this.renderer, target)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.35, 0.72)
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass())
  }

  resize() {
    const width = window.innerWidth
    const height = window.innerHeight
    const pixelRatio = Math.min(window.devicePixelRatio, this.quality === 'high' ? 2 : 1.5)

    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(width, height, false)
    this.particles.setPixelRatio(pixelRatio)

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    if (this.composer) {
      this.composer.setPixelRatio(Math.min(pixelRatio, 1.5))
      this.composer.setSize(width, height)
    }

    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.position.z
    const visibleWidth = visibleHeight * this.camera.aspect
    this.viewport.width = visibleWidth
    this.viewport.height = visibleHeight
    this.viewport.fit = Math.min(1, visibleWidth / OBJECT_SIZE)
    this.viewport.portrait = width / height < 0.9
  }

  /** Se o aparelho não sustentar ~35 fps, desliga o bloom e reduz a resolução. */
  monitorPerformance(delta) {
    const perf = this.performance
    if (perf.checked || this.state.intro < 0.6) return

    perf.frames++
    perf.time += delta
    if (perf.frames < 90) return

    perf.checked = true
    if (perf.frames / perf.time >= 35 || this.quality === 'low') return

    this.composer?.dispose()
    this.composer = null
    this.quality = 'low'
    this.resize()
  }

  handlePointer(event) {
    this.pointer.targetX = (event.clientX / window.innerWidth) * 2 - 1
    this.pointer.targetY = (event.clientY / window.innerHeight) * 2 - 1
  }

  setScroll(offset, velocity) {
    this.scroll.offset = offset
    this.scroll.velocity = velocity
  }

  updateColors(palette) {
    const t = clamp(palette, 0, 1) * (this.palette.length - 1)
    const i = Math.min(Math.floor(t), this.palette.length - 2)
    const f = t - i
    const from = this.palette[i]
    const to = this.palette[i + 1]

    this.colors.a.lerpColors(from.a, to.a, f)
    this.colors.b.lerpColors(from.b, to.b, f)
    this.colors.rim.lerpColors(from.rim, to.rim, f)
    this.colors.particles.copy(this.colors.rim).lerp(this.colors.b, 0.35)
  }

  update(time, delta) {
    const s = this.state
    const { width, height, fit, portrait } = this.viewport
    const p = this.pointer
    const dt = Math.min(delta, 0.1)

    p.x = damp(p.x, p.targetX, 3, dt)
    p.y = damp(p.y, p.targetY, 3, dt)

    // A velocidade do scroll deixa a cena mais "nervosa" por alguns instantes
    this.scroll.velocity = damp(this.scroll.velocity, 0, 2.5, dt)
    const energy = clamp(Math.abs(this.scroll.velocity) / 2500, 0, 1)

    const intro = s.intro
    const introEase = 1 - Math.pow(1 - intro, 3)

    this.object.position.x = s.x * width * (portrait ? 0.12 : 1) + p.x * 0.12
    this.object.position.y = s.y * height + Math.sin(time * 0.8) * 0.06 - p.y * 0.08
    this.object.scale.setScalar(Math.max(0.0001, s.scale * fit * (0.4 + 0.6 * introEase)))

    this.object.rotation.set(
      s.rotX + p.y * 0.25,
      s.rotY + s.orbit + time * 0.08 + p.x * 0.35 + (1 - introEase) * -2.5,
      s.rotZ,
    )

    this.updateColors(s.palette)

    this.core.update(time, {
      distort: s.distort + energy * 0.22 + (1 - introEase) * 0.6,
      frequency: s.frequency,
      wire: s.wire * 0.55,
      colors: this.colors,
    })

    this.rings.update(time, dt, {
      align: s.align,
      spread: s.spread * (0.6 + 0.4 * introEase),
      speed: 1 + energy * 6,
      parentQuaternion: this.object.quaternion,
      satelliteColor: this.colors.rim,
    })

    this.particles.update(time, {
      scroll: this.scroll.offset * 0.0035,
      color: this.colors.particles,
    })

    this.camera.position.x = damp(this.camera.position.x, p.x * 0.3, 2, dt)
    this.camera.position.y = damp(this.camera.position.y, -p.y * 0.2, 2, dt)
    this.camera.lookAt(0, 0, 0)

    const dim = s.dim * (portrait ? 0.75 : 1) * introEase
    if (Math.abs(dim - this.lastDim) > 0.002) {
      this.canvas.style.opacity = dim.toFixed(3)
      this.lastDim = dim
    }

    if (this.composer) this.composer.render(dt)
    else this.renderer.render(this.scene, this.camera)

    this.monitorPerformance(delta)
  }
}
