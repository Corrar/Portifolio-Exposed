import './styles/main.css'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { SplitText } from 'gsap/SplitText'

import SmoothScroll from './animations/SmoothScroll.js'
import Navigation from './animations/Navigation.js'
import TextAnimations from './animations/TextAnimations.js'
import SectionAnimations from './animations/SectionAnimations.js'
import SceneDirector from './animations/SceneDirector.js'
import { KEYFRAMES } from './webgl/keyframes.js'

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText)
ScrollTrigger.config({ ignoreMobileResize: true })

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

class App {
  constructor() {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Estado compartilhado do logo 3D: animado pelo GSAP, lido pelo three.js
    this.state = { ...KEYFRAMES.hero, split: 0, orbit: 0, reveal: this.reducedMotion ? 1 : 0 }

    document.documentElement.classList.toggle('reduced-motion', this.reducedMotion)
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)

    document.querySelectorAll('[data-year]').forEach((el) => {
      el.textContent = new Date().getFullYear()
    })

    this.init()
  }

  async init() {
    this.smooth = new SmoothScroll({ reducedMotion: this.reducedMotion })
    this.navigation = new Navigation({ smooth: this.smooth })

    const experience = this.createExperience()
    await Promise.race([document.fonts?.ready ?? Promise.resolve(), wait(2500)])

    // Ordem importa: as seções fixadas são criadas antes do diretor da cena
    this.text = new TextAnimations({ reducedMotion: this.reducedMotion })
    this.sections = new SectionAnimations({ state: this.state, reducedMotion: this.reducedMotion })
    this.director = new SceneDirector({
      state: this.state,
      sections: [...document.querySelectorAll('[data-scene]')],
      reducedMotion: this.reducedMotion,
    })

    ScrollTrigger.refresh()
    this.text.playIntro()

    if (await experience) {
      gsap.to(this.state, { reveal: 1, duration: this.reducedMotion ? 0 : 1.8, ease: 'power3.inOut', delay: 0.2 })
    }
  }

  /** Carrega o three.js sob demanda (chunk separado). */
  async createExperience() {
    const canvas = document.querySelector('.webgl')
    if (!canvas) return false

    try {
      const { default: Experience } = await import('./webgl/Experience.js')
      this.experience = new Experience({
        canvas,
        state: this.state,
        anchors: {
          hero: document.querySelector('.hero .stage'),
          contact: document.querySelector('.contact .stage'),
        },
      })
      this.experience.update(0, 0) // compila os shaders antes da entrada
      gsap.ticker.add((time, deltaTime) => this.experience.update(time, deltaTime / 1000))
      return true
    } catch (error) {
      console.warn('[Exposed Visualls] WebGL indisponível.', error)
      document.documentElement.classList.add('no-webgl')
      return false
    }
  }
}

new App()
