/**
 * Estado da ampulheta 3D em cada seção marcada com [data-scene].
 * Entre uma seção e outra, o SceneDirector interpola os valores com GSAP.
 *
 * x / y     → posição relativa à área visível (-0.5 … 0.5)
 * scale     → escala da ampulheta
 * rotX/Y/Z  → orientação (radianos)
 * focus     → -1 destaca a metade violeta (marketing), 1 a azul (automação)
 * glow      → intensidade do halo
 * opacity   → visibilidade geral
 * dark      → 0 = fundo branco, 1 = fundo preto (ajusta o halo)
 * fg        → 1 quando a ampulheta é a protagonista (no celular, as demais ficam mais discretas)
 * anchorHero / anchorContact → 1 = a ampulheta acompanha o espaço reservado (.stage) da
 *             seção, em vez de usar x/y/scale; assim ele rola junto com a página
 *
 * `split` (separação das metades), `orbit` (giro extra) e `reveal` (entrada)
 * são animados por ScrollTriggers próprios, fora desta tabela.
 */
export const KEYFRAMES = {
  hero: {
    x: 0, y: -0.04, scale: 0.92,
    rotX: 0.06, rotY: -0.22, rotZ: 0,
    focus: 0, glow: 1, opacity: 1, dark: 0, fg: 1,
    anchorHero: 1, anchorContact: 0,
  },
  forces: {
    x: 0, y: -0.04, scale: 0.92,
    rotX: 0, rotY: 0, rotZ: 0,
    focus: 0, glow: 0.85, opacity: 1, dark: 0, fg: 1,
    anchorHero: 0, anchorContact: 0,
  },
  manifesto: {
    x: 0.43, y: 0.28, scale: 0.42,
    rotX: 0.25, rotY: 0.9, rotZ: -0.2,
    focus: 0, glow: 0.35, opacity: 1, dark: 0, fg: 0,
    anchorHero: 0, anchorContact: 0,
  },
  marketing: {
    x: 0.25, y: 0, scale: 0.88,
    rotX: -0.05, rotY: 0.42, rotZ: 0.04,
    focus: -1, glow: 0.75, opacity: 1, dark: 0, fg: 0,
    anchorHero: 0, anchorContact: 0,
  },
  automation: {
    x: -0.25, y: 0, scale: 0.88,
    rotX: 0.05, rotY: -0.42, rotZ: -0.04,
    focus: 1, glow: 0.75, opacity: 1, dark: 0, fg: 0,
    anchorHero: 0, anchorContact: 0,
  },
  process: {
    x: 0.34, y: 0.27, scale: 0.34,
    rotX: 0.15, rotY: 0.35, rotZ: 0,
    focus: 0, glow: 0.45, opacity: 1, dark: 0, fg: 0,
    anchorHero: 0, anchorContact: 0,
  },
  work: {
    x: 0, y: 0.6, scale: 0.55,
    rotX: 0, rotY: 0, rotZ: 0,
    focus: 0, glow: 0, opacity: 0, dark: 0, fg: 0,
    anchorHero: 0, anchorContact: 0,
  },
  stats: {
    x: 0, y: -0.75, scale: 0.78,
    rotX: 0, rotY: 0, rotZ: 0,
    focus: 0, glow: 0, opacity: 0, dark: 0, fg: 0,
    anchorHero: 0, anchorContact: 0,
  },
  contact: {
    x: 0, y: -0.75, scale: 0.78,
    rotX: 0, rotY: 0, rotZ: 0,
    focus: 0, glow: 1, opacity: 1, dark: 1, fg: 1,
    anchorHero: 0, anchorContact: 1,
  },
}
