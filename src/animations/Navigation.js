import { gsap } from 'gsap'

/** Menu do celular (abre em tela cheia, como no site da Apple). */
export default class Navigation {
  constructor({ smooth }) {
    this.smooth = smooth
    this.toggle = document.querySelector('.nav__toggle')
    this.menu = document.querySelector('.menu')
    if (!this.toggle || !this.menu) return

    const links = this.menu.querySelectorAll('a')
    this.isOpen = false
    this.timeline = gsap
      .timeline({ paused: true })
      .set(this.menu, { visibility: 'visible' })
      .to(this.menu, { opacity: 1, duration: 0.3, ease: 'power2.out' })
      .from(links, { y: 16, opacity: 0, duration: 0.45, ease: 'power3.out', stagger: 0.04 }, 0.05)

    this.toggle.addEventListener('click', () => this.setOpen(!this.isOpen))
    links.forEach((link) => link.addEventListener('click', () => this.setOpen(false)))
    window.addEventListener('keydown', (event) => event.key === 'Escape' && this.setOpen(false))
  }

  setOpen(open) {
    if (open === this.isOpen) return
    this.isOpen = open

    document.documentElement.classList.toggle('menu-open', open)
    this.toggle.setAttribute('aria-expanded', String(open))
    this.toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu')
    this.menu.setAttribute('aria-hidden', String(!open))
    this.smooth.lock(open)

    if (open) this.timeline.play()
    else this.timeline.reverse()
  }
}
