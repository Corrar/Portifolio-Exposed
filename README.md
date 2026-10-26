# Exposed Visualls — Portfólio

Site de portfólio da **Exposed Visualls**, agência de marketing e softwares de automação.
Uma experiência de página única guiada pelo scroll: um objeto 3D (three.js) muda de posição,
orientação, forma e cor a cada seção, sincronizado com animações suaves do GSAP.

## Stack

| Ferramenta | Uso |
| --- | --- |
| [three.js](https://github.com/mrdoob/three.js) `0.186` | Cena 3D, shaders GLSL, bloom (pós-processamento) |
| [GSAP](https://github.com/greensock/GSAP) `3.15` | ScrollTrigger, ScrollSmoother, SplitText e timelines |
| [Vite](https://vite.dev) | Servidor de desenvolvimento e build |

> As bibliotecas são instaladas pelo npm (`npm install`), então não é preciso clonar os repositórios
> do three.js e do GSAP. Desde a versão 3.13, todos os plugins do GSAP (incluindo ScrollSmoother e SplitText)
> são gratuitos e vêm no pacote `gsap`.

## Como rodar

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # gera a versão de produção em dist/
npm run preview   # serve o dist/ localmente
```

O `dist/` é um site estático e pode ser publicado em qualquer hospedagem (Vercel, Netlify, GitHub Pages, etc.).

## Estrutura

```
index.html                     conteúdo do site (todas as seções)
src/
  main.js                      orquestra tudo (classe App)
  styles/main.css              estilos e tokens de cor/tipografia
  webgl/
    Experience.js              renderer, câmera, bloom, loop e leitura do estado
    Core.js                    núcleo orgânico (shader com ruído) + malha wireframe
    Rings.js                   anéis de giroscópio cromados com satélites
    Particles.js               campo de partículas com parallax no scroll
    keyframes.js               estado do objeto 3D em cada seção + paletas
    shaders/                   GLSL (noise, núcleo, wireframe, partículas)
  animations/
    SceneDirector.js           liga o scroll à orientação/forma do objeto 3D
    SmoothScroll.js            ScrollSmoother + navegação por âncoras
    Preloader.js               contador de carregamento
    TextAnimations.js          revelações com SplitText
    SectionAnimations.js       header, serviços, marquee, processo horizontal, cases, números
    Cursor.js                  cursor customizado e botões magnéticos
```

## Como o objeto 3D acompanha o scroll

Cada seção com `data-scene="..."` no `index.html` tem um estado correspondente em
`src/webgl/keyframes.js` (posição, escala, rotação, alinhamento dos anéis, deformação, paleta, etc.).

O `SceneDirector` monta uma timeline GSAP pausada com uma transição entre cada par de seções e usa o
progresso dos ScrollTriggers como "tempo" dessa timeline. O tempo é perseguido com inércia, então o objeto
continua deslizando suavemente mesmo depois que o scroll para.

Para mudar a coreografia, basta editar os valores em `keyframes.js`. Para adicionar uma nova cena,
crie uma seção com `data-scene="nome"` e um bloco `nome: { ... }` no mesmo arquivo.

## Conteúdo a substituir

Os trechos abaixo são **exemplos** e estão marcados com comentários no `index.html`:

- **Cases** (`#cases`): títulos, tags, métricas e capas. As capas são gradientes CSS
  (`.case__img--1` … `--4` em `main.css`); troque por imagens reais, por exemplo
  `background: url('/cases/projeto-1.jpg') center / cover;`, colocando os arquivos em `public/cases/`.
- **Números** (`.stats`): valores em `data-count`.
- **Contato** (`#contato`): e-mail, número do WhatsApp (`https://wa.me/55DDDNUMERO`) e links das redes sociais.

## Acessibilidade e desempenho

- **`prefers-reduced-motion`**: sem scroll suave, sem revelações de texto e com a seção de processo em grade.
- **Sem WebGL**: um gradiente em CSS substitui a cena 3D.
- **Qualidade adaptativa**: celulares usam geometria mais leve e não usam bloom; em desktops, se a cena não
  sustentar cerca de 35 fps, o bloom é desligado e a resolução é reduzida automaticamente.
- Para testar a qualidade manualmente, use `?quality=low` ou `?quality=high` na URL.
- O three.js é carregado num chunk separado enquanto o preloader roda.
