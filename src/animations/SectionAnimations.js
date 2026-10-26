import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/** Animações específicas de cada seção. */
export default class SectionAnimations {
  constructor({ state, reducedMotion = false }) {
    this.state = state
    this.reducedMotion = reducedMotion

    this.setHeader()
    if (reducedMotion) return

    this.setProcess()
    this.setServices()
    this.setMarquee()
    this.setCases()
    this.setStats()
  }

  /** Header: ganha fundo depois do hero e se esconde ao rolar para baixo. */
  setHeader() {
    const header = document.querySelector('.header')
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll()
        header.classList.toggle('is-scrolled', y > 80)
        header.classList.toggle('is-hidden', self.direction === 1 && y > 400)
      },
    })
  }

  /** Processo: seção fixada com scroll horizontal; o objeto 3D gira junto. */
  setProcess() {
    const section = document.querySelector('.process')
    const track = section?.querySelector('.process__track')
    if (!track) return

    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)
    const end = () => `+=${distance()}`

    this.processTween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        refreshPriority: 1,
      },
    })

    gsap.to(section.querySelector('.process__progress-bar'), {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end, scrub: 0.6 },
    })

    gsap.to(this.state, {
      orbit: Math.PI * 1.5,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end, scrub: 1.5 },
    })

    const steps = section.querySelectorAll('.step')
    gsap.from(steps, {
      y: 100,
      opacity: 0,
      duration: 1.3,
      ease: 'expo.out',
      stagger: 0.12,
      scrollTrigger: { trigger: section, start: 'top 65%', toggleActions: 'play none none reverse' },
    })

    // Profundidade: o número de cada etapa desliza mais devagar que o card
    steps.forEach((step) => {
      gsap.fromTo(
        step.querySelector('.step__index'),
        { xPercent: 30 },
        {
          xPercent: -30,
          ease: 'none',
          scrollTrigger: {
            trigger: step,
            containerAnimation: this.processTween,
            start: 'left right',
            end: 'right left',
            scrub: true,
          },
        },
      )
    })
  }

  setServices() {
    document.querySelectorAll('.services__list').forEach((list) => {
      gsap.from(list.querySelectorAll('[data-service]'), {
        y: 60,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: { trigger: list, start: 'top 80%', toggleActions: 'play none none reverse' },
      })
    })
  }

  /** Faixas infinitas: a velocidade e a direção reagem ao scroll. */
  setMarquee() {
    const rows = [...document.querySelectorAll('[data-marquee]')].map((row) => {
      const track = row.querySelector('.marquee__track')
      row.appendChild(track.cloneNode(true))
      return { row, direction: Number(row.dataset.marquee) || 1, x: 0, set: gsap.quickSetter(row, 'xPercent') }
    })
    if (!rows.length) return

    let boost = 0
    let scrollDirection = 1
    ScrollTrigger.create({
      onUpdate: (self) => {
        scrollDirection = self.direction
        boost = Math.min(Math.abs(self.getVelocity()) / 400, 8)
      },
    })

    const wrap = gsap.utils.wrap(-50, 0)
    gsap.ticker.add((_, deltaTime) => {
      const dt = Math.min(deltaTime, 100) / 1000
      boost *= 0.92
      rows.forEach((item) => {
        item.x = wrap(item.x - dt * 2.2 * item.direction * scrollDirection * (1 + boost))
        item.set(item.x)
      })
    })
  }

  setCases() {
    document.querySelectorAll('[data-case]').forEach((card) => {
      gsap.from(card, {
        y: 120,
        opacity: 0,
        duration: 1.4,
        ease: 'expo.out',
        scrollTrigger: { trigger: card, start: 'top 92%', toggleActions: 'play none none reverse' },
      })

      const media = card.querySelector('.case__media')
      gsap.fromTo(
        card.querySelector('[data-parallax]'),
        { yPercent: -9 },
        {
          yPercent: 9,
          ease: 'none',
          scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    })
  }

  setStats() {
    document.querySelectorAll('[data-count]').forEach((element) => {
      const value = Number(element.dataset.count)
      gsap.fromTo(
        element,
        { textContent: 0 },
        {
          textContent: value,
          duration: 2,
          ease: 'power2.out',
          snap: { textContent: 1 },
          scrollTrigger: { trigger: element, start: 'top 90%', once: true },
        },
      )
    })

    gsap.from('.stat', {
      y: 50,
      opacity: 0,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: '.stats', start: 'top 80%', toggleActions: 'play none none reverse' },
    })
  }
}
