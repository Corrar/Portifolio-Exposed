# Exposed Visualls — Portfólio

Site de portfólio da **Exposed Visualls**, agência de marketing e softwares de automação.

O design parte do logo: fundo branco, tipografia preta e o gradiente violeta → ciano do símbolo como
única cor. A linguagem visual e os componentes seguem o estilo das páginas da Apple: navegação em vidro
fosco, botões em pílula, tiles arredondados e bento grid.

O protagonista é a **ampulheta do logo em 3D** (three.js): duas pirâmides de vidro unidas pelas pontas, a
violeta em cima (marketing) e a azul embaixo (automação). Ela gira devagar e acompanha o scroll: surge na
entrada, as metades se separam em "Duas forças" e se reencontram, cada metade ganha destaque na sua seção, e
no fim ela aparece sobre o fundo preto do contato. Tudo é animado com GSAP, com amortecimento extra no
three.js para os movimentos ficarem suaves.

## Stack

| Ferramenta | Uso |
| --- | --- |
| [three.js](https://github.com/mrdoob/three.js) `0.186` | Ampulheta 3D (arestas com material físico e faces de vidro), halo e corte de entrada |
| [GSAP](https://github.com/greensock/GSAP) `3.15` | ScrollTrigger, ScrollSmoother, SplitText e timelines |
| [Vite](https://vite.dev) | Servidor de desenvolvimento e build |

As bibliotecas são instaladas pelo npm. Desde a versão 3.13, todos os plugins do GSAP (incluindo
ScrollSmoother e SplitText) são gratuitos e vêm no pacote `gsap`.

**Tipografia:** em aparelhos Apple é usada a fonte do sistema (SF Pro). Nos demais, Inter (Google Fonts), a
alternativa aberta mais próxima.

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
index.html                     conteúdo do site + logo e ampulheta em SVG (<symbol id="ev-mark"> / "ev-hourglass")
src/
  main.js                      orquestra tudo (classe App) e guarda o estado da ampulheta 3D
  styles/main.css              estilos e tokens de cor/tipografia
  webgl/
    Experience.js              renderer transparente, câmera, luz, suavização, encaixe nas seções e loop
    Hourglass.js               a ampulheta: duas pirâmides com arestas em gradiente e faces de vidro
    Glow.js                    halo lilás atrás da ampulheta (como no logo)
    keyframes.js               estado da ampulheta em cada seção
  animations/
    SceneDirector.js           liga o scroll ao estado da ampulheta 3D
    SmoothScroll.js            ScrollSmoother + navegação por âncoras
    Navigation.js              menu do celular
    TextAnimations.js          revelações com SplitText
    SectionAnimations.js       "Duas forças", processo horizontal, bento, números e contato
```

## Como a ampulheta 3D acompanha o scroll

Cada seção com `data-scene="..."` no `index.html` tem um estado em `src/webgl/keyframes.js`: posição,
escala, orientação, qual metade fica em destaque (`focus`), halo, opacidade e se o fundo é escuro.

O `SceneDirector` monta uma timeline GSAP pausada com uma transição entre cada par de seções e usa o
progresso dos ScrollTriggers como "tempo" dessa timeline, com inércia. O `Experience` ainda suaviza esse
estado a cada frame (`SMOOTHING`), então nada muda de forma brusca, mesmo com scroll rápido.

Três propriedades ficam fora da tabela:

- **`split`** afasta as metades (sempre no plano da tela: violeta à esquerda, azul à direita). É animado
  pela seção fixada "Duas forças".
- **`orbit`** dá quartos de volta extras. É animado por "Duas forças" e pelo processo.
- **`reveal`** é a entrada da ampulheta.

No hero e no contato, a ampulheta se encaixa no elemento `.stage` da seção (`anchorHero` / `anchorContact`).
Assim ela rola junto com a página em qualquer tamanho de tela.

## Logo

O símbolo foi redesenhado em vetor a partir do logo enviado e fica no `<symbol id="ev-mark">` do
`index.html`, usado na navegação, no rodapé e no favicon. Se houver o arquivo vetorial oficial (SVG/AI),
vale conferir as coordenadas e as cores.

A cena 3D usa a ampulheta com os dois triângulos completos (`src/webgl/Hourglass.js`). A versão 2D dela
(`<symbol id="ev-hourglass">`) aparece quando o navegador não tem WebGL.

## Conteúdo a substituir

Os trechos abaixo são **exemplos** e estão marcados com comentários no `index.html`:

- **Cases** (`#cases`): títulos, tags e métricas. As ilustrações são feitas em CSS/SVG; troque por imagens
  reais em `public/` se preferir.
- **Números** (`.stats`): valores em `data-count`.
- **Contato** (`#contato`): e-mail, número do WhatsApp (`https://wa.me/55DDDNUMERO`) e links das redes sociais.

## Acessibilidade e desempenho

- **`prefers-reduced-motion`**: sem scroll suave nem revelações; a seção de processo vira uma grade.
- **Sem WebGL**: a ampulheta aparece em SVG no lugar da cena 3D.
- O three.js é carregado num chunk separado; o texto do hero aparece antes, e a ampulheta entra quando a
  cena fica pronta.
