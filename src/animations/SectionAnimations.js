import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/** Animações específicas de cada seção. */
export default class SectionAnimations {
  constructor({ state, reducedMotion = false }) {
    this.state = state
    this.reducedMotion = reducedMotion

    // Seções fixadas primeiro: elas empurram as posições das demais
    if (!reducedMotion) {
      this.setForces()
      this.setProcess()
    }

    this.setContact()
    if (reducedMotion) return

    this.setFeatures()
    this.setTiles()
    this.setStats()
  }

  /**
   * "Duas forças": a seção fica fixada enquanto as duas metades da ampulheta se
   * separam (marketing × automação) e depois se reencontram com um quarto de volta.
   */
  setForces() {
    const section = document.querySelector('.forces')
    if (!section) return

    const left = section.querySelector('.forces__caption--left')
    const right = section.querySelector('.forces__caption--right')
    const titleA = section.querySelector('.forces__title--a')
    const titleB = section.querySelector('.forces__title--b')

    gsap
      .timeline({
        defaults: { ease: 'sine.inOut' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=240%',
          pin: true,
          scrub: 1.5,
          refreshPriority: 2,
        },
      })
      .fromTo(titleA, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0)
      .fromTo(this.state, { split: 0 }, { split: 1, duration: 1.2, immediateRender: false }, 0.2)
      .fromTo(left, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.6 }, 0.7)
      .fromTo(right, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.6 }, 0.8)
      .to([left, right], { opacity: 0, duration: 0.5 }, 1.9)
      .to(titleA, { opacity: 0, y: -20, duration: 0.5 }, 1.9)
      .to(this.state, { split: 0, duration: 1.2 }, 2)
      .fromTo(this.state, { orbit: 0 }, { orbit: Math.PI / 2, duration: 1.2, immediateRender: false }, 2)
      .fromTo(titleB, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 2.5)
      .to({}, { duration: 0.3 })
  }

  /** Processo: cards em scroll horizontal com indicador de pontos. */
  setProcess() {
    const section = document.querySelector('.process')
    const track = section?.querySelector('.process__track')
    if (!track) return

    const dots = [...section.querySelectorAll('.dots span')]
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)
    const setActive = (progress) => {
      const index = Math.min(dots.length - 1, Math.round(progress * (dots.length - 1)))
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index))
    }
    setActive(0)

    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        refreshPriority: 1,
        onUpdate: (self) => setActive(self.progress),
      },
    })

    gsap.fromTo(
      this.state,
      { orbit: Math.PI / 2 },
      {
        orbit: Math.PI,
        ease: 'none',
        immediateRender: false,
        scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, scrub: 1.2 },
      },
    )

    gsap.from(section.querySelectorAll('.card'), {
      y: 80,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: { trigger: section, start: 'top 70%', toggleActions: 'play none none reverse' },
    })
  }

  setFeatures() {
    document.querySelectorAll('.feature .list').forEach((list) => {
      gsap.from(list.querySelectorAll('[data-item]'), {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: list, start: 'top 82%', toggleActions: 'play none none reverse' },
      })
    })
  }

  /** Bento: os tiles crescem levemente ao entrar e as ilustrações se montam. */
  setTiles() {
    gsap.set('[data-tile]', { opacity: 0 })
    ScrollTrigger.batch('[data-tile]', {
      start: 'top 88%',
      onEnter: (tiles) =>
        gsap.fromTo(
          tiles,
          { opacity: 0, y: 60, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power3.out', stagger: 0.1, overwrite: true },
        ),
    })

    const once = (trigger, animation) =>
      ScrollTrigger.create({ trigger, start: 'top 75%', once: true, onEnter: () => animation.play() })

    const chat = document.querySelector('.visual--chat')
    if (chat) {
      once(
        chat,
        gsap.from(chat.querySelectorAll('.bubble'), {
          paused: true,
          y: 16,
          scale: 0.9,
          opacity: 0,
          duration: 0.6,
          ease: 'back.out(1.6)',
          stagger: 0.35,
        }),
      )
    }

    const line = document.querySelector('.chart__line')
    if (line) {
      const length = line.getTotalLength()
      gsap.set(line, { strokeDasharray: length, strokeDashoffset: length })
      once(
        line.closest('.visual'),
        gsap
          .timeline({ paused: true })
          .to(line, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut' })
          .from('.chart__area', { opacity: 0, duration: 1 }, 0.8),
      )
    }

    const bars = document.querySelectorAll('.visual--bars span')
    if (bars.length) {
      once(
        bars[0].parentElement,
        gsap.from(bars, { paused: true, scaleY: 0, duration: 1.1, ease: 'power3.out', stagger: 0.06 }),
      )
    }
  }

  setStats() {
    document.querySelectorAll('[data-count]').forEach((element) => {
      gsap.fromTo(
        element,
        { textContent: 0 },
        {
          textContent: Number(element.dataset.count),
          duration: 1.8,
          ease: 'power2.out',
          snap: { textContent: 1 },
          scrollTrigger: { trigger: element, start: 'top 90%', once: true },
        },
      )
    })

    gsap.from('[data-stat]', {
      y: 40,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: { trigger: '.stats', start: 'top 80%', toggleActions: 'play none none reverse' },
    })
  }

  /**
   * Contato: um fundo preto fixo (atrás do canvas) acompanha a seção, então o
   * a ampulheta 3D aparece sobre o preto. A navegação fica escura por cima dela.
   */
  setContact() {
    const contact = document.querySelector('.contact')
    const backdrop = document.querySelector('.backdrop')
    const nav = document.querySelector('.nav')
    if (!contact || !backdrop) return

    let last = ''
    gsap.ticker.add(() => {
      const rect = contact.getBoundingClientRect()
      const height = window.innerHeight
      const top = Math.min(Math.max(rect.top, 0), height)
      const bottom = Math.min(Math.max(height - rect.bottom, 0), height)
      const clip = `inset(${top.toFixed(1)}px 0 ${bottom.toFixed(1)}px 0)`
      if (clip !== last) {
        backdrop.style.clipPath = clip
        last = clip
      }
    })

    ScrollTrigger.create({
      trigger: contact,
      start: 'top 48px',
      end: 'bottom 48px',
      toggleClass: { targets: nav, className: 'nav--dark' },
    })
  }
}
