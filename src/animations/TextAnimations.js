import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'

/** Revelações de texto com SplitText (linhas, palavras e caracteres). */
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
    this.heroLines = document.querySelectorAll('[data-hero-line]')
    this.heroSplits = [...this.heroLines].map((line) =>
      SplitText.create(line, { type: 'chars', mask: 'chars', charsClass: 'split-char' }),
    )
    this.heroChars = this.heroSplits.map((split) => split.chars)

    gsap.set(this.heroChars.flat(), { yPercent: 110 })
    gsap.set('[data-hero-fade], .hero__top .eyebrow, .header', { opacity: 0, y: 24 })

    // Ao sair do hero, as duas linhas do título se afastam
    const hero = document.querySelector('.hero')
    gsap
      .timeline({
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      })
      .to(this.heroLines[0], { xPercent: -18, opacity: 0.1, ease: 'none' }, 0)
      .to(this.heroLines[1], { xPercent: 18, opacity: 0.1, ease: 'none' }, 0)
  }

  /** Entrada do hero, tocada logo depois do preloader. */
  playIntro() {
    if (this.reducedMotion) return gsap.timeline()

    return gsap
      .timeline()
      .to(this.heroChars[0], { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.045 }, 0)
      .to(this.heroChars[1], { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.045 }, 0.12)
      .to('.hero__top .eyebrow, .header', { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out' }, 0.5)
      .to('[data-hero-fade]', { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1 }, 0.7)
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
            yPercent: 110,
            duration: 1.3,
            ease: 'expo.out',
            stagger: 0.1,
            scrollTrigger: { trigger: element, start: 'top 85%', toggleActions: 'play none none reverse' },
          }),
      })
    })
  }

  /** Manifesto: as palavras "acendem" conforme o scroll. */
  setWords() {
    document.querySelectorAll('[data-words]').forEach((element) => {
      SplitText.create(element, {
        type: 'words',
        wordsClass: 'split-word',
        autoSplit: true,
        onSplit: (self) =>
          gsap.fromTo(
            self.words,
            { opacity: 0.12 },
            {
              opacity: 1,
              ease: 'none',
              stagger: 0.1,
              scrollTrigger: { trigger: element, start: 'top 80%', end: 'bottom 50%', scrub: true },
            },
          ),
      })
    })
  }

  setReveals() {
    document.querySelectorAll('[data-reveal]').forEach((element) => {
      gsap.from(element, {
        y: 40,
        opacity: 0,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: element, start: 'top 88%', toggleActions: 'play none none reverse' },
      })
    })
  }
}
