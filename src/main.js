import './styles/main.css'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { SplitText } from 'gsap/SplitText'

import SmoothScroll from './animations/SmoothScroll.js'
import Preloader from './animations/Preloader.js'
import TextAnimations from './animations/TextAnimations.js'
import SectionAnimations from './animations/SectionAnimations.js'
import SceneDirector from './animations/SceneDirector.js'
import Cursor from './animations/Cursor.js'

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText)
ScrollTrigger.config({ ignoreMobileResize: true })

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

class App {
  constructor() {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.experience = null

    document.documentElement.classList.toggle('reduced-motion', this.reducedMotion)
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)

    document.querySelectorAll('[data-year]').forEach((el) => {
      el.textContent = new Date().getFullYear()
    })

    this.init()
  }

  async init() {
    this.smooth = new SmoothScroll({
      reducedMotion: this.reducedMotion,
      onScroll: (offset, velocity) => this.experience?.setScroll(offset, velocity),
    })
    this.smooth.lock(true)

    const preloader = new Preloader()
    const fonts = Promise.race([document.fonts?.ready ?? Promise.resolve(), wait(3000)])
    await preloader.play({ ready: Promise.all([fonts, this.createExperience()]), reducedMotion: this.reducedMotion })

    const state = this.experience?.state ?? {}

    // Ordem importa: a seção fixada (processo) é criada antes do diretor da cena
    this.text = new TextAnimations({ reducedMotion: this.reducedMotion })
    this.sections = new SectionAnimations({ state, reducedMotion: this.reducedMotion })
    if (this.experience) {
      this.director = new SceneDirector({
        state,
        sections: [...document.querySelectorAll('[data-scene]')],
        reducedMotion: this.reducedMotion,
      })
    }
    this.cursor = new Cursor()

    ScrollTrigger.refresh()
    this.smooth.lock(false)
    this.reveal(preloader)
  }

  /** Carrega o three.js sob demanda (chunk separado) enquanto o preloader roda. */
  async createExperience() {
    const canvas = document.querySelector('.webgl')
    if (!canvas) return

    try {
      const { default: Experience } = await import('./webgl/Experience.js')
      const coarse = window.matchMedia('(pointer: coarse)').matches
      const forced = new URLSearchParams(window.location.search).get('quality')
      const quality = forced === 'low' || forced === 'high' ? forced : coarse && window.innerWidth < 1024 ? 'low' : 'high'

      this.experience = new Experience({ canvas, quality })
      this.experience.update(0, 0) // compila os shaders ainda atrás do loader

      gsap.ticker.add((time, deltaTime) => this.experience.update(time, deltaTime / 1000))
    } catch (error) {
      console.warn('[Exposed Visualls] WebGL indisponível, usando fallback.', error)
      document.documentElement.classList.add('no-webgl')
      this.experience = null
    }
  }

  reveal(preloader) {
    const intro = gsap.timeline()
    intro.add(preloader.hide())

    if (this.experience) {
      intro.to(
        this.experience.state,
        { intro: 1, duration: this.reducedMotion ? 0 : 2.6, ease: 'expo.out' },
        this.reducedMotion ? 0 : '-=0.7',
      )
    }

    intro.add(this.text.playIntro(), this.reducedMotion ? 0 : '<0.15')
  }
}

new App()
