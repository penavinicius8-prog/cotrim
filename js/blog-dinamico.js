/**
 * blog-dinamico.js
 * Preenche o Blog (listagem: blog.html) e o Post individual (blogpost.html)
 * com os artigos publicados no WordPress (post type "blog_leve"), mantendo
 * 100% do design/CSS. Se a API falhar, mantém o conteúdo estático (fallback).
 *
 * WordPress:
 *  - Post type: blog_leve  → endpoint /wp/v2/blog_leve
 *  - Nativos: título, corpo (content), resumo (excerpt), imagem destacada, data, categoria
 *  - ACF: tempo_leitura (opcional, senão calcula ~200 palavras/min) e rotulo_autor
 *  - Post individual abre por: blogpost.html?slug=<slug-do-post>
 */

const WP_BLOG = "https://testeblog.levestudios.com.br/wp-json/wp/v2/blog";
const FALLBACK_IMG = "images/post-trabalhista.jpg";

/* ---------- Helpers ---------- */
function stripHtml(html) {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  return (d.textContent || '').replace(/\s+/g, ' ').trim();
}

function formatarData(iso) {
  if (!iso) return '';
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return meses[d.getMonth()] + ' ' + String(d.getDate()).padStart(2, '0') + ', ' + d.getFullYear();
}

function tempoLeitura(contentHtml, acf) {
  if (acf && acf.tempo_leitura && String(acf.tempo_leitura).trim()) return String(acf.tempo_leitura).trim();
  const palavras = stripHtml(contentHtml).split(/\s+/).filter(Boolean).length;
  const min = Math.max(1, Math.ceil(palavras / 200));
  return min + ' min de leitura';
}

function imagemDe(post) {
  const m = post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0];
  if (m && m.source_url) {
    const s = (m.media_details && m.media_details.sizes) || {};
    return ((s.large || s.medium_large || s.medium || {}).source_url) || m.source_url;
  }
  return FALLBACK_IMG;
}

function categoriaDe(post) {
  const grupos = (post._embedded && post._embedded['wp:term']) || [];
  const termo = grupos.flat().filter(Boolean)[0];
  return termo ? termo.name : '';
}

function resumoDe(post) {
  const r = stripHtml(post.excerpt && post.excerpt.rendered);
  if (r) return r;
  const c = stripHtml(post.content && post.content.rendered);
  return c.length > 180 ? c.slice(0, 180).trim() + '…' : c;
}

/* ---------- Card (usado na listagem e nos "similares") ---------- */
function renderCard(post, escuro) {
  const cat = categoriaDe(post);
  const titulo = (post.title && post.title.rendered) || '';
  return `
    <article class="ctmpost${escuro ? ' ctmpost-escuro' : ''}" data-cat="${cat}">
      <div class="ctmpost-foto-wrap">
        <img class="ctmpost-foto" src="${imagemDe(post)}" alt="${stripHtml(titulo)}">
        ${cat ? `<span class="ctmpost-tag">${cat.toLowerCase()}</span>` : ''}
      </div>
      <div class="ctmpost-meta">
        ${cat ? `<p class="ctmpost-cat">${cat}</p>` : ''}
        <p class="ctmpost-data"><img src="images/icon-calendario.svg" alt="" aria-hidden="true">${formatarData(post.date)}</p>
      </div>
      <h3 class="ctmpost-titulo">${titulo}</h3>
      <p class="ctmpost-resumo">${resumoDe(post)}</p>
      <a class="ctmpost-link" href="blogpost.html?slug=${post.slug}">ver mais →</a>
    </article>`;
}

/* ---------- LISTAGEM (blog.html) ---------- */
async function carregarListagem(grid) {
  const res = await fetch(`${WP_BLOG}?_embed&acf_format=standard&per_page=24&orderby=date&order=desc`);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const posts = await res.json();
  if (!posts.length) return; // sem posts publicados: mantém o estático
  grid.innerHTML = posts.map(p => renderCard(p, false)).join('');
  montarFiltros(posts, grid);
}

/* ---------- Filtro por categoria (listagem) ---------- */
function montarFiltros(posts, grid) {
  const barra = document.querySelector('.blog-filtros');
  if (!barra) return;
  const cats = [...new Set(posts.map(categoriaDe).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  if (!cats.length) { barra.innerHTML = ''; return; } // sem categorias ainda: sem filtro
  // dropdown (não cresce a barra por mais categorias que existam)
  barra.innerHTML =
    '<label class="blog-filtro-label" for="blogCat">Ler por categoria</label>' +
    '<select class="blog-filtro-select" id="blogCat">' +
      '<option value="">Todas as categorias</option>' +
      cats.map(c => `<option value="${c}">${c}</option>`).join('') +
    '</select>';
  const sel = barra.querySelector('.blog-filtro-select');
  sel.addEventListener('change', function () {
    const cat = sel.value;
    grid.querySelectorAll('.ctmpost').forEach(card => {
      card.style.display = (!cat || card.getAttribute('data-cat') === cat) ? '' : 'none';
    });
  });
}

/* ---------- Sumário "neste artigo" a partir dos títulos do conteúdo ---------- */
function montarToc(corpo) {
  const toc = document.querySelector('.post-toc');
  const lista = document.querySelector('.post-toc-lista');
  if (!toc || !lista) return;
  const titulos = corpo.querySelectorAll('h2, h3');
  if (!titulos.length) { toc.style.display = 'none'; return; }
  let html = '';
  titulos.forEach((h, i) => {
    const id = 'sec-' + (i + 1);
    h.id = id;
    html += `<li><a href="#${id}">${h.textContent}</a></li>`;
  });
  lista.innerHTML = html;
}

/* ---------- Artigos similares (outros posts) ---------- */
async function carregarSimilares(idAtual) {
  const secao = document.querySelector('.post-similares');
  const grid = document.querySelector('.post-similares .ctmpost-grid');
  if (!grid) return;
  const esconder = () => { if (secao) secao.style.display = 'none'; };
  try {
    // "misturado" — traz os posts mais recentes de qualquer categoria, menos o atual
    const res = await fetch(`${WP_BLOG}?_embed&acf_format=standard&per_page=4&orderby=date&order=desc&exclude=${idAtual}`);
    if (!res.ok) return esconder();
    const posts = (await res.json()).slice(0, 3);
    if (posts.length) grid.innerHTML = posts.map(p => renderCard(p, true)).join('');
    else esconder(); // não há outros posts ainda: esconde a seção (evita o Lorem estático)
  } catch (e) { esconder(); }
}

/* ---------- POST INDIVIDUAL (blogpost.html) ---------- */
async function carregarPost(corpo) {
  const slug = new URLSearchParams(location.search).get('slug');
  const url = slug
    ? `${WP_BLOG}?slug=${encodeURIComponent(slug)}&_embed&acf_format=standard`
    : `${WP_BLOG}?per_page=1&orderby=date&order=desc&_embed&acf_format=standard`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const posts = await res.json();
  if (!posts.length) throw new Error('Post não encontrado');
  const post = posts[0];
  const cat = categoriaDe(post);
  const acf = post.acf || {};

  // categoria (mantém a linha decorativa)
  const catEl = document.querySelector('.post-hero-cat');
  if (catEl) catEl.innerHTML = `<span class="ctm-label-line"></span>${cat || 'artigo'}`;

  // título
  const tit = document.querySelector('.post-hero-titulo');
  if (tit && post.title) tit.innerHTML = post.title.rendered;

  // subtítulo = resumo do artigo (se houver)
  const sub = document.querySelector('.post-hero-sub');
  const resumo = resumoDe(post);
  if (sub && resumo) sub.textContent = resumo;

  // meta: [autor] · [tempo de leitura] · [marca] · [data]
  const metas = document.querySelectorAll('.post-hero-meta p');
  if (metas[0]) metas[0].textContent = (acf.rotulo_autor && acf.rotulo_autor.trim()) || 'Editorial';
  if (metas[1]) metas[1].textContent = tempoLeitura(post.content && post.content.rendered, acf);
  if (metas[3]) metas[3].textContent = formatarData(post.date);

  // corpo do artigo (HTML do editor)
  if (post.content) corpo.innerHTML = post.content.rendered;

  // sumário + título da aba
  montarToc(corpo);
  document.title = stripHtml(post.title && post.title.rendered) + ' — Cotrim Advogados Associados';

  // artigos similares
  carregarSimilares(post.id);
}

/* ---------- Boot: detecta a página e carrega ---------- */
async function carregarBlog() {
  try {
    const gridLista = document.querySelector('.blog-lista .ctmpost-grid');
    const corpo = document.querySelector('.post-corpo');
    if (gridLista) await carregarListagem(gridLista);
    else if (corpo) await carregarPost(corpo);
  } catch (err) {
    console.warn('Blog dinâmico: usando conteúdo estático de fallback —', err.message);
    // Em caso de erro, a página mantém o HTML estático que já está no arquivo.
  }
}

document.addEventListener('DOMContentLoaded', carregarBlog);
