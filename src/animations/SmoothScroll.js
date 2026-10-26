import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'

/** Scroll suave (GSAP ScrollSmoother) + navegação por âncoras. */
export default class SmoothScroll {
  constructor({ reducedMotion = false, onScroll } = {}) {
    this.smoother = reducedMotion
      ? null
      : ScrollSmoother.create({
          wrapper: '#smooth-wrapper',
          content: '#smooth-content',
          smooth: 1.2,
          smoothTouch: 0.1,
          effects: true,
        })

    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => onScroll?.(self.scroll(), self.getVelocity()),
    })

    this.bindAnchors()
  }

  bindAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const id = link.getAttribute('href')
        const target = id === '#' || id === '#inicio' ? 0 : document.querySelector(id)
        if (target === null) return

        event.preventDefault()
        this.scrollTo(target)
      })
    })
  }

  scrollTo(target) {
    if (this.smoother) {
      this.smoother.scrollTo(target, true, 'top top')
      return
    }

    const y = target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: y, behavior: 'auto' })
  }

  /** Trava o scroll (usado durante o preloader). */
  lock(locked) {
    if (this.smoother) this.smoother.paused(locked)
    document.documentElement.style.overflow = locked ? 'hidden' : ''
  }
}
