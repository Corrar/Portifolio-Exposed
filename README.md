# Exposed Visualls — Portfólio

Site de portfólio da **Exposed Visualls**, agência de marketing e softwares de automação.

O design parte do logo: fundo branco, tipografia preta e o gradiente violeta → ciano do símbolo como
única cor. A linguagem visual e os componentes seguem o estilo das páginas da Apple: navegação em vidro
fosco, botões em pílula, tiles arredondados e bento grid.

O protagonista é o **logo em 3D** (three.js): o símbolo com os dois traços (violeta = marketing, azul =
automação), "EX / POSED" e "VISUALLS", extrudados, exatamente como no logo. Ele muda de orientação conforme o
scroll:
- surge na entrada;
- em "Duas forças" se abre em camadas (os traços se afastam e as letras recuam) e se remonta;
- vira para o texto de cada seção e destaca o traço correspondente;
- termina sobre o fundo preto do contato, com as letras claras.

Tudo é animado com GSAP, com amortecimento extra no three.js para os movimentos ficarem suaves.

## Stack

| Ferramenta | Uso |
| --- | --- |
| [three.js](https://github.com/mrdoob/three.js) `0.186` | Logo 3D extrudado (material físico), halo e corte de entrada |
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
index.html                     conteúdo do site + símbolo do logo em SVG (<symbol id="ev-mark">)
src/
  main.js                      orquestra tudo (classe App) e guarda o estado do logo 3D
  styles/main.css              estilos e tokens de cor/tipografia
  webgl/
    Experience.js              renderer transparente, câmera, luz, suavização, encaixe nas seções e loop
    Logo3D.js                  o logo extrudado: os dois traços do símbolo + EX / POSED + VISUALLS
    fonts/                     Inter (OFL) só com as letras do logo, no formato de fonte do three.js
    Glow.js                    halo lilás atrás do símbolo (como no logo)
    keyframes.js               estado do logo em cada seção
  animations/
    SceneDirector.js           liga o scroll ao estado do logo 3D
    SmoothScroll.js            ScrollSmoother + navegação por âncoras
    Navigation.js              menu do celular
    TextAnimations.js          revelações com SplitText
    SectionAnimations.js       "Duas forças", processo horizontal, bento, números e contato
```

## Como o logo 3D acompanha o scroll

Cada seção com `data-scene="..."` no `index.html` tem um estado em `src/webgl/keyframes.js`: posição,
escala, orientação, qual traço fica em destaque (`focus`), halo, opacidade e se o fundo é escuro.

O `SceneDirector` monta uma timeline GSAP pausada com uma transição entre cada par de seções e usa o
progresso dos ScrollTriggers como "tempo" dessa timeline, com inércia. O `Experience` ainda suaviza esse
estado a cada frame (`SMOOTHING`), então nada muda de forma brusca, mesmo com scroll rápido.

Três propriedades ficam fora da tabela:

- **`split`** é a vista explodida da seção fixada "Duas forças": o símbolo vai para o centro, o traço
  violeta para a esquerda, o azul para a direita, e as letras recuam até sumir.
- **`orbit`** é um giro extra, animado por "Duas forças" e pelo processo. Ele sempre volta a zero, para o
  logo terminar de frente.
- **`reveal`** é a entrada do logo.

No hero e no contato, o logo se encaixa no elemento `.stage` da seção (`anchorHero` / `anchorContact`).
Assim ele rola junto com a página em qualquer tamanho de tela.

## Logo

O símbolo foi redesenhado em vetor a partir do logo enviado e fica no `<symbol id="ev-mark">` do
`index.html`, usado na navegação, no rodapé e no favicon. Se houver o arquivo vetorial oficial (SVG/AI),
vale conferir as coordenadas e as cores.

A versão 3D (`src/webgl/Logo3D.js`) usa os mesmos pontos do símbolo e as letras em Inter ExtraBold/Regular.
As fontes em `src/webgl/fonts/` contêm só os glifos do logo (licença SIL OFL 1.1). Para trocar a fonte,
converta outra fonte para o formato typeface.json do three.js com os mesmos glifos.

## Conteúdo a substituir

Os trechos abaixo são **exemplos** e estão marcados com comentários no `index.html`:

- **Cases** (`#cases`): títulos, tags e métricas. As ilustrações são feitas em CSS/SVG; troque por imagens
  reais em `public/` se preferir.
- **Números** (`.stats`): valores em `data-count`.
- **Contato** (`#contato`): e-mail, número do WhatsApp (`https://wa.me/55DDDNUMERO`) e links das redes sociais.

## Acessibilidade e desempenho

- **`prefers-reduced-motion`**: sem scroll suave nem revelações; a seção de processo vira uma grade.
- **Sem WebGL**: o logo aparece em HTML/SVG no lugar da cena 3D.
- **Aparelhos lentos**: se a cena não sustentar cerca de 40 fps, a resolução do 3D é reduzida automaticamente.
- O three.js é carregado num chunk separado; o texto do hero aparece antes, e o logo entra quando a
  cena fica pronta.
