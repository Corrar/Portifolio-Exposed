/**
 * Estado do logo 3D em cada seção marcada com [data-scene].
 * Entre uma seção e outra, o SceneDirector interpola os valores com GSAP.
 *
 * x / y     → posição relativa à área visível (-0.5 … 0.5)
 * scale     → escala do logo (1 ≈ 57% da altura da tela; limitada pela largura disponível)
 * rotX/Y/Z  → orientação (radianos). rotY negativo vira o logo para a esquerda, positivo para a direita
 * focus     → -1 destaca o traço violeta (marketing), 1 o azul (automação)
 * glow      → intensidade do halo
 * opacity   → visibilidade geral
 * dark      → 0 = fundo branco, 1 = fundo preto (letras claras e halo mais forte)
 * fg        → 1 quando o logo é o protagonista (no celular, os demais ficam mais discretos)
 * anchorHero / anchorContact → 1 = o logo acompanha o espaço reservado (.stage) da
 *             seção, em vez de usar x/y/scale; assim ele rola junto com a página
 *
 * `split` (vista explodida), `orbit` (giro extra) e `reveal` (entrada)
 * são animados por ScrollTriggers próprios, fora desta tabela.
 */
export const KEYFRAMES = {
  hero: {
    x: 0, y: -0.04, scale: 0.7,
    rotX: 0.04, rotY: -0.12, rotZ: 0,
    focus: 0, glow: 1, opacity: 1, dark: 0, fg: 1,
    anchorHero: 1, anchorContact: 0,
  },
  forces: {
    x: 0, y: -0.04, scale: 0.7,
    rotX: 0, rotY: 0, rotZ: 0,
    focus: 0, glow: 0.85, opacity: 1, dark: 0, fg: 1,
    anchorHero: 0, anchorContact: 0,
  },
  manifesto: {
    x: 0.41, y: 0.33, scale: 0.2,
    rotX: 0.15, rotY: -0.45, rotZ: 0,
    focus: 0, glow: 0.35, opacity: 1, dark: 0, fg: 0,
    anchorHero: 0, anchorContact: 0,
  },
  marketing: {
    x: 0.25, y: 0, scale: 0.42,
    rotX: 0.04, rotY: -0.32, rotZ: 0,
    focus: -1, glow: 0.75, opacity: 1, dark: 0, fg: 0,
    anchorHero: 0, anchorContact: 0,
  },
  automation: {
    x: -0.25, y: 0, scale: 0.42,
    rotX: -0.04, rotY: 0.32, rotZ: 0,
    focus: 1, glow: 0.75, opacity: 1, dark: 0, fg: 0,
    anchorHero: 0, anchorContact: 0,
  },
  process: {
    x: 0.37, y: 0.31, scale: 0.18,
    rotX: 0.1, rotY: -0.35, rotZ: 0,
    focus: 0, glow: 0.45, opacity: 1, dark: 0, fg: 0,
    anchorHero: 0, anchorContact: 0,
  },
  work: {
    x: 0, y: 0.6, scale: 0.5,
    rotX: 0, rotY: 0, rotZ: 0,
    focus: 0, glow: 0, opacity: 0, dark: 0, fg: 0,
    anchorHero: 0, anchorContact: 0,
  },
  stats: {
    x: 0, y: -0.75, scale: 0.6,
    rotX: 0, rotY: 0, rotZ: 0,
    focus: 0, glow: 0, opacity: 0, dark: 0, fg: 0,
    anchorHero: 0, anchorContact: 0,
  },
  contact: {
    x: 0, y: -0.75, scale: 0.6,
    rotX: 0, rotY: 0, rotZ: 0,
    focus: 0, glow: 1, opacity: 1, dark: 1, fg: 1,
    anchorHero: 0, anchorContact: 1,
  },
}
