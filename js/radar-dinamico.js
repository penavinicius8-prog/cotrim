/**
 * radar-dinamico.js
 * Busca a última Edição publicada no WordPress e preenche o HTML estático
 * do Radar Tribunais Superiores (radar-tribunais-superiores.html) mantendo
 * 100% do design/CSS existente — só troca o conteúdo estático pelo dinâmico.
 *
 * Convenções nos campos ACF, pro texto formatado:
 *  - Título Principal (Hero): quebras de linha = Enter no campo; para
 *    destacar um trecho em dourado (como "redesenham" no design original),
 *    envolva o trecho em **asteriscos duplos** — ex: "as decisões que
 *    **redesenham** **o contencioso brasileiro.**"
 */

// WordPress do cliente (admin.cotrimadvogados.adv.br). Usamos o formato
// ?rest_route= porque os permalinks bonitos (/wp-json/) não estão ativos —
// este formato funciona sempre, com ou sem permalink bonito.
const WP_URL = "https://admin.cotrimadvogados.adv.br/?rest_route=/wp/v2/edicoes&acf_format=standard&per_page=1&orderby=date&order=desc";

// Converte "texto **destaque** texto" em HTML com <span> + quebras de linha
function formatarTitulo(txt) {
  if (!txt) return '';
  return txt
    .split('\n')
    .map(linha => linha.replace(/\*\*(.+?)\*\*/g, '<span>$1</span>'))
    .join('<br>');
}

// Aplica a letra grande (dropcap) no primeiro parágrafo e o destaque
// dourado no último — funciona em cima do HTML real vindo do WYSIWYG,
// preservando qualquer <strong>/<em> que o usuário tenha usado.
function aplicarDropcapEditorial(container) {
  const paragrafos = container.querySelectorAll('p');
  if (!paragrafos.length) return;

  const primeiro = paragrafos[0];
  primeiro.classList.add('radar-editorial-abre');

  const walker = document.createTreeWalker(primeiro, NodeFilter.SHOW_TEXT);
  const noTexto = walker.nextNode();
  if (noTexto && noTexto.textContent.trim().length) {
    const texto = noTexto.textContent;
    const span = document.createElement('span');
    span.className = 'radar-dropcap';
    span.textContent = texto.charAt(0);
    const resto = document.createTextNode(texto.slice(1));
    noTexto.replaceWith(span, resto);
  }

  const ultimo = paragrafos[paragrafos.length - 1];
  if (ultimo !== primeiro) ultimo.classList.add('radar-editorial-fecho');
}

function tagAlertaClasse(tipo) {
  const mapa = {
    'Alerta': 'radar-imp-alerta',
    'Oportunidade': 'radar-imp-oportunidade',
    'Atenção': 'radar-imp-atencao',
    'Acompanhar': 'radar-imp-atencao',
  };
  return mapa[tipo] || 'radar-imp-atencao';
}

function renderDestaque(p, indexGlobal) {
  const d = p.dados_essenciais || {};
  const rotulos = [
    ['Tema central', p.tema_central, 'radar-icon-row-1.svg'],
    ['O que o STJ decidiu', p.o_que_decidiu, 'radar-icon-row-2.svg'],
    ['Por que isso importa', p.por_que_importa, 'radar-icon-row-3.svg'],
    ['Impacto prático', p.impacto_pratico, 'radar-icon-row-4.svg'],
    ['Tendência jurídica', p.tendencia_juridica, 'radar-icon-row-5.svg'],
  ];
  const linhas = rotulos.filter(([, texto]) => texto).map(([label, texto, icone]) => `
    <div class="radar-destaque-linha">
      <p class="radar-destaque-rotulo"><img src="images/${icone}" alt="" aria-hidden="true">${label}</p>
      <div class="radar-destaque-texto">${texto}</div>
    </div>`).join('');

  const dadosLinhas = [
    ['Processo:', d.processo], ['Relator(a):', d.relator], ['Órgão:', d.orgao],
    ['Julgamento:', d.julgamento], ['Status:', d.status],
  ].filter(([, v]) => v).map(([label, v]) => `<p><span>${label}</span> <strong>${v}</strong></p>`).join('');

  return `
    <article class="radar-destaque">
      <div class="radar-destaque-topo">
        <p class="radar-destaque-pill"><span>[${p.numero || String(indexGlobal).padStart(2, '0')}]</span>${p.tag_area || ''}</p>
        <p class="radar-destaque-marca" aria-hidden="true">${p.numero || indexGlobal}</p>
        <h3 class="radar-destaque-titulo">${p.titulo || ''}</h3>
      </div>
      ${linhas}
      <div class="radar-dados">
        <span class="radar-dados-deco-1" aria-hidden="true"></span>
        <span class="radar-dados-deco-2" aria-hidden="true"></span>
        <p class="radar-dados-titulo"><img src="images/radar-icon-balanca.svg" alt="" aria-hidden="true">Dados essenciais</p>
        <div class="radar-dados-grid">${dadosLinhas}</div>
      </div>
      ${p.o_que_monitorar ? `
      <div class="radar-monitorar">
        <img src="images/radar-icon-monitor.svg" alt="" aria-hidden="true">
        <p><strong>O que monitorar:</strong> ${p.o_que_monitorar}</p>
      </div>` : ''}
    </article>`;
}

function renderCategoriaHeader(nome, statusTexto, corClasse) {
  return `
    <div class="radar-cat ${corClasse}">
      <span class="radar-cat-tag">Categoria</span>
      <p class="radar-cat-nome"><span class="radar-cat-colchete">「</span>${nome}<span class="radar-cat-colchete">」</span></p>
      <p class="radar-cat-info"><span class="radar-cat-ponto"></span>${statusTexto}</p>
    </div>`;
}

function renderCardCompacto(p) {
  const corBarra = (p.status_tese || '').toLowerCase().includes('acompanhamento') ? 'radar-barra-gold' : 'radar-barra-azul';
  return `
    <article class="radar-card">
      <div class="radar-card-meta">
        <span class="radar-card-tema">${p.tema || ''}</span>
        <span class="radar-card-status"><span class="radar-card-status-barra ${corBarra}"></span>${p.status_tese || ''}</span>
      </div>
      <p class="radar-card-kicker">${p.area || ''}</p>
      <h3 class="radar-card-titulo">${p.titulo || ''}</h3>
      ${p.o_que_decidiu ? `<p class="radar-card-rotulo">O que decidiu</p><div class="radar-card-texto">${p.o_que_decidiu}</div>` : ''}
      ${p.impacto_pratico ? `<p class="radar-card-rotulo">Impacto prático</p><div class="radar-card-texto">${p.impacto_pratico}</div>` : ''}
    </article>`;
}

function renderCategoriaPareada(cat, corClasse) {
  const itens = cat.precedentes || [];
  const contadorTexto = itens.length === 1 ? '1 precedente' : `${itens.length} precedentes`;
  const header = renderCategoriaHeader(cat.nome_categoria, contadorTexto, corClasse);
  if (itens.length === 1) {
    // Categoria com 1 item só vira card largo (padrão "Em acompanhamento" do design original)
    const p = itens[0];
    const corBarra = (p.status_tese || '').toLowerCase().includes('acompanhamento') ? 'radar-barra-gold' : 'radar-barra-azul';
    return header + `
      <article class="radar-card radar-card-largo">
        <div class="radar-card-meta">
          <span class="radar-card-tema">${p.tema || ''}</span>
          <span class="radar-card-status"><span class="radar-card-status-barra ${corBarra}"></span>${p.status_tese || ''}</span>
        </div>
        <p class="radar-card-kicker">${p.area || ''}</p>
        <h3 class="radar-card-titulo">${p.titulo || ''}</h3>
        ${p.o_que_decidiu ? `<p class="radar-card-rotulo">O que está em jogo</p><div class="radar-card-texto">${p.o_que_decidiu}</div>` : ''}
      </article>`;
  }
  return header + `<div class="radar-cards">${itens.map(renderCardCompacto).join('')}</div>`;
}

function renderTendencia(t, i) {
  const n = String(i + 1).padStart(2, '0');
  const icone = `radar-icon-tend-${(i % 5) + 1}.svg`;
  return `
    <article class="radar-tend">
      <p class="radar-tend-num">${n}</p>
      <img class="radar-tend-icone" src="images/${icone}" alt="">
      <h3 class="radar-tend-titulo">${t.titulo || ''}</h3>
      <p class="radar-tend-texto">${t.descricao || ''}</p>
    </article>`;
}

function renderImpacto(al, i, largo) {
  const icone = `radar-icon-imp-${(i % 5) + 1}.svg`;
  return `
    <article class="radar-imp${largo ? ' radar-imp-largo' : ''}">
      <div class="radar-imp-icone"><img src="images/${icone}" alt=""></div>
      <p class="radar-imp-tag ${tagAlertaClasse(al.tipo)}"><span></span>${al.tipo || ''}</p>
      <div class="radar-imp-corpo">
        <h3 class="radar-imp-titulo">${al.publico_alvo || ''}</h3>
        <p class="radar-imp-texto">${al.descricao || ''}</p>
      </div>
    </article>`;
}

async function carregarEdicaoDinamica() {
  try {
    const res = await fetch(WP_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const posts = await res.json();
    if (!posts.length) throw new Error('Nenhuma Edição publicada');
    const a = posts[0].acf;

    // ---------- HERO ----------
    const heroTitulo = document.querySelector('.radar-hero-titulo');
    if (heroTitulo && a.titulo_principal) heroTitulo.innerHTML = formatarTitulo(a.titulo_principal);

    const heroSub = document.querySelector('.radar-hero-sub');
    if (heroSub && a.subtitulo_hero) heroSub.textContent = a.subtitulo_hero;

    const heroIntro = document.querySelector('.radar-hero-intro');
    if (heroIntro && a.intro_hero) heroIntro.textContent = a.intro_hero;

    const heroEdicao = document.querySelector('.radar-hero-edicao p');
    if (heroEdicao) {
      const semestreTexto = a.semestre === '1' ? '1º Semestre' : '2º Semestre';
      heroEdicao.innerHTML = `<span>Edição Especial · </span><strong>${semestreTexto} ${a.ano || ''}</strong><br>Atualizado em ${a.data_atualizacao || ''}`;
    }

    // Contagem total de precedentes = destaques + itens dentro das categorias pareadas
    const totalPrecedentes =
      (a.precedentes_destaque || []).length +
      (a.categorias_pareadas || []).reduce((soma, c) => soma + (c.precedentes || []).length, 0);

    const statsItens = document.querySelectorAll('.radar-stats-item');
    if (statsItens[0]) statsItens[0].querySelector('.radar-stats-num').innerHTML = `<strong>${totalPrecedentes}</strong> PRECEDENTES`;
    const qtdTendencias = (a.tendencias || []).length;
    if (statsItens[1] && qtdTendencias) statsItens[1].querySelector('.radar-stats-num').innerHTML = `<strong>${qtdTendencias}</strong> TENDÊNCIAS`;
    if (statsItens[2]) statsItens[2].querySelector('.radar-stats-num').innerHTML = `<strong>${a.semestre === '1' ? '1º' : '2º'}</strong> SEMESTRE`;
    if (statsItens[3]) statsItens[3].querySelector('.radar-stats-num').innerHTML = `<strong>${a.orgao_foco || ''}</strong>`;

    // ---------- EDITORIAL ----------
    const editorialTitulo = document.querySelector('.radar-editorial-titulo');
    if (editorialTitulo && a.titulo_editorial) editorialTitulo.innerHTML = a.titulo_editorial.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    const editorialDir = document.querySelector('.radar-editorial-dir');
    if (editorialDir && a.texto_editorial) {
      // texto_editorial vem do WYSIWYG (já em HTML) — insere e depois
      // aplica a letra grande no primeiro parágrafo via DOM
      editorialDir.innerHTML = a.texto_editorial;
      aplicarDropcapEditorial(editorialDir);
    }

    // ---------- JULGADOS EM DESTAQUE ----------
    const julgadosInner = document.querySelector('.radar-julgados-inner');
    if (julgadosInner) {
      // Remove tudo que é conteúdo dinâmico (mantém label/h2/subtítulo do topo da seção)
      const elementosFixos = julgadosInner.querySelectorAll('.radar-label, .radar-h2, .radar-h2-sub');
      const htmlFixo = Array.from(elementosFixos).map(el => el.outerHTML).join('');

      let htmlDinamico = '';

      (a.precedentes_destaque || []).forEach((p, i) => {
        const corClasse = 'radar-cat-' + (p.cor || 'navy');
        htmlDinamico += renderCategoriaHeader(p.categoria || p.tag_area || '', p.tese_vinculante ? 'Tese vinculante' : '', corClasse);
        htmlDinamico += renderDestaque(p, i + 1);
      });

      (a.categorias_pareadas || []).forEach(cat => {
        const corClasse = 'radar-cat-' + (cat.cor || 'navy');
        htmlDinamico += renderCategoriaPareada(cat, corClasse);
      });

      julgadosInner.innerHTML = htmlFixo + htmlDinamico;
    }

    // ---------- TENDÊNCIAS ----------
    const tendGrid = document.querySelector('.radar-tend-grid');
    if (tendGrid && (a.tendencias || []).length) {
      tendGrid.innerHTML = a.tendencias.map(renderTendencia).join('');
    }

    // ---------- QUEM É IMPACTADO ----------
    const impGrid = document.querySelector('.radar-imp-grid');
    if (impGrid && (a.alertas || []).length) {
      const total = a.alertas.length;
      impGrid.innerHTML = a.alertas.map((al, i) => renderImpacto(al, i, i === total - 1 && total % 2 !== 0)).join('');
    }

    const recomTexto = document.querySelector('.radar-recom-texto');
    if (recomTexto && a.recomendacao_geral) recomTexto.innerHTML = a.recomendacao_geral;

    // ---------- CTA / FECHAMENTO ----------
    const ctaTitulo = document.querySelector('.radar-cta-titulo');
    if (ctaTitulo && a.titulo_fechamento) {
      const partes = a.titulo_fechamento.split(' ');
      const ultima = partes.pop();
      ctaTitulo.innerHTML = `${partes.join(' ')} <span>${ultima}</span>`;
    }

    const ctaSub = document.querySelector('.radar-cta-sub');
    if (ctaSub && a.texto_fechamento) ctaSub.innerHTML = a.texto_fechamento;

    // Parágrafos de apoio (embaixo do divisor dourado) — um <p> por linha
    if (a.texto_cta_final) {
      const paragrafosExistentes = document.querySelectorAll('.radar-cta-texto');
      const linhas = a.texto_cta_final.split('\n').filter(l => l.trim());
      const primeiro = paragrafosExistentes[0];
      if (primeiro) {
        const container = primeiro.parentElement;
        paragrafosExistentes.forEach(p => p.remove());
        const btn = container.querySelector('.radar-cta-btn');
        linhas.forEach(linha => {
          const p = document.createElement('p');
          p.className = 'radar-cta-texto';
          p.innerHTML = linha.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          container.insertBefore(p, btn);
        });
      }
    }

    const ctaBtn = document.querySelector('.radar-cta-btn');
    if (ctaBtn && a.botao_texto) {
      if (a.botao_link && a.botao_link !== '#') ctaBtn.href = a.botao_link; // vazio ou "#" no WP → mantém o /contato do HTML
      ctaBtn.innerHTML = `${a.botao_texto}<img src="images/radar-icon-seta.svg" alt="" aria-hidden="true">`;
    }

  } catch (err) {
    console.warn('Radar dinâmico: usando conteúdo estático de fallback —', err.message);
    // Em caso de erro, a página simplesmente mantém o HTML estático que já está no arquivo.
    // Isso é intencional: nunca deixa a página quebrada ou vazia pro visitante.
  } finally {
    // revela o conteúdo (dinâmico OU fallback) só depois de pronto — mata o flash do texto antigo
    document.documentElement.classList.remove('ctm-carregando');
  }
}

document.addEventListener('DOMContentLoaded', carregarEdicaoDinamica);
