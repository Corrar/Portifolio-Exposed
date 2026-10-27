import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { KEYFRAMES } from '../webgl/keyframes.js'

/**
 * Conecta o scroll à cena 3D.
 *
 * Monta uma timeline GSAP pausada com uma transição (duração 1) entre cada par
 * de seções [data-scene]. A soma do progresso dos ScrollTriggers de entrada
 * de cada seção vira o "tempo" da timeline. A inércia fica num lugar só: a mola
 * do Experience, que segue esse estado sem trancos (nada de recriar tweens a
 * cada evento de scroll).
 */
export default class SceneDirector {
  constructor({ state, sections }) {
    this.state = state

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
        onRefresh: () => this.sync(),
      }),
    )
    this.sync()
  }

  sync() {
    if (!this.triggers) return

    let time = 0
    for (let i = 0; i < this.triggers.length; i++) time += this.triggers[i].progress
    this.timeline.time(time)
  }
}
