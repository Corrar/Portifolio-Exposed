import { gsap } from 'gsap'

/** Contador 0–100% que espera as fontes carregarem antes de revelar o site. */
export default class Preloader {
  constructor() {
    this.element = document.querySelector('.loader')
    this.count = this.element?.querySelector('[data-loader-count]')
    this.bar = this.element?.querySelector('.loader__bar span')
  }

  async play({ ready, reducedMotion = false }) {
    if (!this.element) return ready

    if (reducedMotion) {
      await ready
      this.element.style.display = 'none'
      return
    }

    const counter = { value: 0 }
    const counting = gsap.to(counter, {
      value: 100,
      duration: 1.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.count.textContent = Math.round(counter.value)
        gsap.set(this.bar, { scaleX: counter.value / 100 })
      },
    })

    await Promise.all([counting, ready])
  }

  /** Esconde o loader; retorna a timeline para sincronizar a entrada do hero. */
  hide() {
    if (!this.element || this.element.style.display === 'none') return gsap.timeline()

    return gsap
      .timeline()
      .to(this.element.querySelectorAll('.loader__inner, .loader__bar'), {
        yPercent: -40,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.in',
      })
      .to(this.element, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=0.1')
      .set(this.element, { display: 'none' })
  }
}
