import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'

/** Revelações de texto com SplitText. */
export default class TextAnimations {
  constructor({ reducedMotion = false } = {}) {
    this.reducedMotion = reducedMotion
    if (reducedMotion) return

    this.setHero()
    this.setLines()
    this.setWords()
    this.setReveals()
  }

  setHero() {
    this.heroSplit = SplitText.create('.hero__title', { type: 'lines', mask: 'lines', linesClass: 'split-line' })
    gsap.set('[data-intro-line]', { opacity: 1 })
    gsap.set(this.heroSplit.lines, { yPercent: 105 })
    gsap.set('[data-intro]', { opacity: 0, y: 24 })

    // Ao rolar, o conteúdo do hero recua e some (como nas páginas de produto da Apple)
    gsap.to('.hero__content', {
      opacity: 0,
      y: -60,
      scale: 0.96,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '55% top', scrub: true },
    })
  }

  /** Entrada do hero, tocada assim que as fontes carregam. */
  playIntro() {
    if (this.reducedMotion) return gsap.timeline()

    return gsap
      .timeline({ delay: 0.15 })
      .to(this.heroSplit.lines, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12 }, 0)
      .to('[data-intro]', { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.08 }, 0.15)
  }

  /** Títulos: cada linha sobe por trás de uma máscara. */
  setLines() {
    document.querySelectorAll('[data-lines]').forEach((element) => {
      SplitText.create(element, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 105,
            duration: 1.1,
            ease: 'expo.out',
            stagger: 0.1,
            scrollTrigger: { trigger: element, start: 'top 86%', toggleActions: 'play none none reverse' },
          }),
      })
    })
  }

  /** Manifesto: as palavras passam de cinza-claro para preto conforme o scroll. */
  setWords() {
    document.querySelectorAll('[data-words]').forEach((element) => {
      SplitText.create(element, {
        type: 'words',
        autoSplit: true,
        onSplit: (self) =>
          gsap.fromTo(
            self.words,
            { color: '#d2d2d7' },
            {
              color: '#1d1d1f',
              ease: 'none',
              stagger: 0.1,
              scrollTrigger: { trigger: element, start: 'top 78%', end: 'bottom 45%', scrub: true },
            },
          ),
      })
    })
  }

  setReveals() {
    document.querySelectorAll('[data-reveal]').forEach((element) => {
      gsap.from(element, {
        y: 30,
        opacity: 0,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 90%', toggleActions: 'play none none reverse' },
      })
    })
  }
}
