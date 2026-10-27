import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { KEYFRAMES } from '../webgl/keyframes.js'

/**
 * Conecta o scroll à cena 3D.
 *
 * Monta uma timeline GSAP pausada com uma transição (duração 1) entre cada par
 * de seções [data-scene]. A soma do progresso dos ScrollTriggers de entrada
 * de cada seção vira o "tempo" da timeline, que é perseguido com inércia —
 * por isso o objeto continua deslizando suavemente depois que o scroll para.
 */
export default class SceneDirector {
  constructor({ state, sections, reducedMotion = false }) {
    this.state = state
    this.reducedMotion = reducedMotion

    const frames = sections.map((section) => KEYFRAMES[section.dataset.scene] ?? KEYFRAMES.hero)
    Object.assign(state, frames[0])

    this.timeline = gsap.timeline({ paused: true })
    for (let i = 1; i < frames.length; i++) {
      this.timeline.fromTo(
        state,
        { ...frames[i - 1] },
        { ...frames[i], duration: 1, ease: 'sine.inOut', immediateRender: false },
        i - 1,
      )
    }

    this.triggers = sections.slice(1).map((section) =>
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'top top',
        onUpdate: () => this.sync(),
        onRefresh: () => this.sync(true),
      }),
    )
    this.sync(true)
  }

  sync(immediate = false) {
    if (!this.triggers) return

    const time = this.triggers.reduce((sum, trigger) => sum + trigger.progress, 0)

    if (immediate || this.reducedMotion) {
      gsap.killTweensOf(this.timeline)
      this.timeline.time(time)
      return
    }

    gsap.to(this.timeline, { time, duration: 1.8, ease: 'power2.out', overwrite: true })
  }
}
