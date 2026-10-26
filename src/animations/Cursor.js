import { gsap } from 'gsap'

/** Cursor customizado + botões magnéticos (somente com mouse). */
export default class Cursor {
  constructor() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    this.element = document.querySelector('.cursor')
    if (!this.element) return

    this.label = this.element.querySelector('.cursor__label')
    const dot = this.element.querySelector('.cursor__dot')
    const ring = this.element.querySelector('.cursor__ring')

    this.dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' })
    this.dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' })
    this.ringX = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' })
    this.ringY = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' })

    document.documentElement.classList.add('has-cursor')
    gsap.set([dot, ring], { x: window.innerWidth / 2, y: window.innerHeight / 2 })

    window.addEventListener('pointermove', (event) => this.move(event), { passive: true })
    document.addEventListener('pointerover', (event) => this.hover(event))
    document.documentElement.addEventListener('pointerleave', () => this.element.classList.add('is-hidden'))
    document.documentElement.addEventListener('pointerenter', () => this.element.classList.remove('is-hidden'))

    this.setMagnetic()
  }

  move({ clientX, clientY }) {
    this.dotX(clientX)
    this.dotY(clientY)
    this.ringX(clientX)
    this.ringY(clientY)
  }

  hover(event) {
    const target = event.target.closest?.('a, button, [data-cursor]')
    const label = target?.dataset.cursor

    this.element.classList.toggle('is-hover', Boolean(target) && !label)
    this.element.classList.toggle('is-label', Boolean(label))
    if (label) this.label.textContent = label
  }

  setMagnetic() {
    document.querySelectorAll('[data-magnetic]').forEach((element) => {
      const x = gsap.quickTo(element, 'x', { duration: 0.6, ease: 'power3' })
      const y = gsap.quickTo(element, 'y', { duration: 0.6, ease: 'power3' })
      const strength = element.classList.contains('contact__cta') ? 0.45 : 0.3

      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect()
        x((event.clientX - (rect.left + rect.width / 2)) * strength)
        y((event.clientY - (rect.top + rect.height / 2)) * strength)
      })

      element.addEventListener('pointerleave', () => {
        x(0)
        y(0)
      })
    })
  }
}
