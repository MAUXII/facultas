---
name: revisar-landing
description: Revisão visual crítica da landing do Facultas (rota /), quadro a quadro, antes de dizer que algo está pronto. Use sempre que mexer em src/components/marketing, em public/marketing ou quando o usuário pedir para conferir, revisar ou analisar a landing.
---

# Revisar a landing quadro a quadro

A landing é uma página de apresentação de um projeto aberto feito por e para
estudantes. Não é página de venda. Ela é feita de trilhas altas (`[data-track]`)
com uma cena em dither presa na tela; o que acontece depende do quanto se
rolou. Um print por seção não basta: o defeito costuma estar no meio do
caminho, na entrada de uma seção ou no fim de uma animação.

## 1. Preparar

- Suba o servidor (`preview_start` com `facultas`) e abra `/`.
- Recarregue a página antes de começar (recarga a quente deixa o Lenis
  confuso). Defina os atalhos de rolagem. Role pelo próprio Lenis, que em dev
  fica em `window.__lenis`; `scrollTo` nativo briga com ele e dá falso alarme
  de "página pulando":

```js
window.go = async (y) => { window.__lenis.scrollTo(y, { immediate: true }); await new Promise(r => setTimeout(r, 1400)); return Math.round(scrollY); };
window.abs = (el) => { let y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; };
window.at = (i, f) => { const s = [...document.querySelectorAll('[data-track]')][i]; return go(abs(s) + (s.offsetHeight - innerHeight) * f); };
```

## 2. Percorrer tudo, inclusive as transições

Para cada trilha, tire print em todos estes pontos, não só no meio:

- meia tela **antes** da trilha começar (a seção ainda subindo);
- `f` = 0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1;
- meia tela **depois** do fim (a seção saindo).

Para as seções que não são trilha (app, código aberto, footer), tire print
entrando, no meio e saindo. Repita a volta inteira em `mobile` (375×812) e
numa tela baixa de notebook (por exemplo 1366×640), onde título e desenho
disputam a altura, e volte para `desktop` no fim.

Quando a cena depende do tempo (caranguejo, pombo, pássaros), tire dois ou
três prints seguidos no mesmo ponto para ver o movimento, ou use `zoom` na
região.

## 3. Olhar com desconfiança

Em cada print, procure ativamente, e anote o que achar mesmo que pareça
pequeno:

- **Montagem física:** quando bichos se empilham ou se tocam, confira se
  parecem uma cena só (casco pousado nas costas, quem está atrás desenhado
  antes) ou figurinhas coladas por cima umas das outras. Conte as peças: se a
  composição pede um topo, ele está lá?
- **Recortes e sprites:** borda serrilhada, halo branco, pedaço faltando
  (pata, orelha, casco), fundo que sobrou, sprite cortado pela borda do
  quadro ou pela cortina de traços.
- **Coisa aparecendo antes da hora:** objeto parado no meio do ar, desenho
  "rabiscado" ou picotado antes da seção estar ativa, animação que já
  começou quando a seção ainda está entrando.
- **Movimento:** bicho deslizando sem mexer as patas, pulo de quadro,
  tremido entre quadros, loop que engasga, coisa que para do nada.
- **Texto:** título encostando em botão, legenda em cima de desenho,
  contraste fraco (texto claro em cena clara), quebra de linha feia.
- **Ritmo:** seção longa demais sem nada acontecendo, duas seções seguidas
  com a mesma composição, buraco vazio entre seções.
- **Tom:** qualquer coisa com cara de produto à venda (criar conta, comece
  agora, preço, fecho de marketing). O fim da página é o código aberto e o
  footer.
- **Mobile:** sobreposição, rolagem horizontal
  (`document.documentElement.scrollWidth > clientWidth`), cena pequena demais.

## 4. Melhorar, não só consertar

Para cada seção, pergunte também: o que deixaria isto mais vivo ou mais
bonito? Exemplos do que já funcionou aqui: trocar desenho feito à mão por
imagem real recortada, pedir ao ChatGPT um sprite sheet (grade 4×2, mesmo
bicho, corpo fixo, só as patas mexendo, fundo branco) para animar andando,
dividir uma composição em peças para animar uma por uma.

As imagens são geradas pelo ChatGPT do usuário pelo Claude in Chrome. Peça
uma imagem por mensagem, com o mesmo estilo descrito em todas. Para tirar a
imagem do chat, copie para a área de transferência com um botão injetado e
clicado de verdade, e salve pelo PowerShell; o download automático é
bloqueado pelo Chrome depois do primeiro.

## 5. Relatar

Liste o que achou por seção, com o ponto de rolagem, antes de dizer que está
pronto. Só diga que está bom depois de refazer a volta com tudo corrigido.
Rode `npx tsc --noEmit`, `npx next lint --dir src/components/marketing --dir src/app`,
`npx vitest run` e `npm run build` (pare o servidor de dev antes do build).
