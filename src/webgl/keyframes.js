/**
 * Estados do objeto 3D para cada seção marcada com [data-scene].
 * Entre uma seção e outra, o SceneDirector interpola os valores com GSAP.
 *
 * x / y      → posição relativa à área visível (-0.5 … 0.5)
 * scale      → escala do objeto
 * rotX/Y/Z   → orientação do grupo (radianos)
 * align      → 0 = anéis em giroscópio, 1 = anéis alinhados de frente para a câmera
 * spread     → abertura dos anéis
 * distort    → amplitude da deformação do núcleo
 * frequency  → frequência do ruído do núcleo
 * palette    → 0 = quente (marketing), 0.5 = marca, 1 = frio (automação)
 * wire       → opacidade da malha "tech" ao redor do núcleo
 * dim        → brilho geral da cena (para dar leitura ao conteúdo)
 */
export const KEYFRAMES = {
  hero: {
    x: 0, y: 0, scale: 1,
    rotX: 0.3, rotY: 0, rotZ: 0.15,
    align: 0, spread: 1,
    distort: 0.32, frequency: 1.1,
    palette: 0.5, wire: 0, dim: 1,
  },
  manifesto: {
    x: -0.3, y: 0, scale: 0.72,
    rotX: -0.1, rotY: 1.4, rotZ: 0,
    align: 1, spread: 1.1,
    distort: 0.18, frequency: 1.5,
    palette: 0.4, wire: 0, dim: 0.85,
  },
  marketing: {
    x: 0.27, y: 0, scale: 0.85,
    rotX: -0.35, rotY: 2.8, rotZ: 0.35,
    align: 0.25, spread: 1.25,
    distort: 0.5, frequency: 0.9,
    palette: 0, wire: 0, dim: 1,
  },
  automation: {
    x: -0.27, y: 0, scale: 0.85,
    rotX: 0.45, rotY: 4.4, rotZ: -0.25,
    align: 0, spread: 0.92,
    distort: 0.07, frequency: 2.2,
    palette: 1, wire: 1, dim: 1,
  },
  process: {
    x: 0, y: 0.04, scale: 0.7,
    rotX: 0.1, rotY: 5.6, rotZ: 0,
    align: 0.55, spread: 1.5,
    distort: 0.22, frequency: 1.4,
    palette: 0.75, wire: 0.35, dim: 0.8,
  },
  work: {
    x: 0, y: 0, scale: 1.35,
    rotX: 0.6, rotY: 6.6, rotZ: 0.2,
    align: 0.8, spread: 1.35,
    distort: 0.15, frequency: 1.2,
    palette: 0.5, wire: 0, dim: 0.35,
  },
  stats: {
    x: 0, y: 0, scale: 1.1,
    rotX: 0.2, rotY: 7.4, rotZ: 0,
    align: 0.2, spread: 1.2,
    distort: 0.28, frequency: 1.3,
    palette: 0.6, wire: 0.5, dim: 0.55,
  },
  contact: {
    x: 0, y: 0, scale: 1.2,
    rotX: 0, rotY: 8.6, rotZ: 0,
    align: 1, spread: 1.45,
    distort: 0.42, frequency: 1,
    palette: 0.5, wire: 0, dim: 0.8,
  },
}

/** Paletas (início, meio, fim) interpoladas por `palette`. */
export const PALETTES = [
  { a: '#ff2d6f', b: '#ff9a3d', rim: '#ffc28f' },
  { a: '#5b3dff', b: '#ff3d9a', rim: '#c9b8ff' },
  { a: '#1d3cff', b: '#1fc8f0', rim: '#6fdcff' },
]
