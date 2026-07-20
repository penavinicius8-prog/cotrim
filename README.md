# Cotrim Advogados Associados — Site institucional

Site estático (HTML + CSS + JS puro) implementado a partir do design no Figma,
pronto para hospedar em qualquer servidor (ex.: pasta `public_html` de uma
hospedagem compartilhada).

## Estrutura

```
index.html               Home
escritorio.html          O Escritório (história, missão, sócios, equipe)
areas-de-atuacao.html    Áreas de Atuação (17 áreas)
diferenciais.html        Diferenciais (5 diferenciais)
sedes.html               Unidades (Barra Mansa, Rio de Janeiro, Brasília)
blog.html                Blog / Editorial (lista de posts)
blogpost.html            Template de artigo do blog
radar-tribunais-superiores.html  Radar Tribunais Superiores (relatório STJ 2026)
contato.html             Contato (formulário + endereços)
css/                     global.css (header/footer/CTA compartilhados) + 1 CSS por página
js/main.js               Preloader da Home, menu mobile (submenu Autoral),
                         palavra rotativa do hero, animações e formulários
images/                  Fotos otimizadas (JPEG) e vetores (SVG)
```

## Como publicar

Suba para o `public_html` **apenas**: os arquivos `.html`, e as pastas `css/`,
`js/` e `images/`.

**Não** suba: `_raw/` (originais das imagens antes da otimização),
`files_extracted/` (skill de desenvolvimento) e `README.md`.

A fonte Inter é carregada do Google Fonts (requer internet). Não há build,
dependências ou banco de dados.

## Preloader da Home

Na **primeira visita** à Home, aparece uma tela de carregamento com o logo
centralizado que voa e encaixa no logo do cabeçalho. Só acontece uma vez (fica
gravado em `localStorage`, chave `ctmPre`) e só na Home — as outras páginas não
têm transição. Para ver de novo durante testes: abrir em aba anônima, ou limpar
os dados do site (DevTools → Application → Local Storage → remover `ctmPre`).
Atalho de preview: abrir `index.html?preload` força o preloader a rodar sempre,
sem marcar como visto.

## Pendências de conteúdo (herdadas do design)

- Formulário de contato e newsletter não têm backend — hoje apenas simulam o
  envio via JS. Integrar com o e-mail/CRM desejado (ex.: FormSubmit,
  WordPress, PHP `mail()`).
- Textos dos cards de áreas de atuação (Home), posts do editorial e corpo do
  artigo estão com *lorem ipsum*, como no Figma.
- Link do LinkedIn no rodapé é placeholder no design (`[PLACEHOLDER]`) —
  atualizar quando houver URL.
- Na página Contato, o design traz um card "SÃO PAULO" (com endereço de
  Brasília); o endereço foi omitido no card — confirmar se a unidade SP existe.
- No design da página Unidades, o bloco do Rio de Janeiro repetia o endereço de
  Barra Mansa; foi usado o endereço correto do rodapé (Travessa do Paço, 23).
- Fotos de Jaqueline Rezende Souza e Mahe Moreira Maia não existem no design
  (placeholder cinza) — substituir em `escritorio.html` quando disponíveis.
