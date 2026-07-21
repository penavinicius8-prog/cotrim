/* ============================================================
   COTRIM ADVOGADOS — JS global
   Menu mobile, newsletter e formulário de contato.
   ============================================================ */

(function () {
  'use strict';

  var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Iniciais de um nome (ignora conectores como "da", "de", "do")
  var iniciais = function (nome) {
    var partes = (nome || '').split(/\s+/).filter(function (w) {
      return w && !/^(da|de|do|das|dos|e|di)$/i.test(w);
    });
    return partes.slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  };

  /* ---------- Preloader (Home, 1ª visita): logo central → cabeçalho ---------- */
  var pre = document.querySelector('.ctm-preloader');
  var html = document.documentElement;
  if (pre && html.classList.contains('ctm-pre-on')) {
    var previa = location.protocol === 'file:' || /preload/i.test(location.search + location.hash);
    if (!previa) { try { localStorage.setItem('ctmPre', '1'); } catch (e) {} }
    var preLogo = pre.querySelector('.ctm-preloader-logo');
    var alvo = document.querySelector('.ctm-header-logo img');
    var encerrarPre = function () {
      if (alvo) alvo.style.opacity = '1';            // revela o logo do header no exato ponto do pouso
      pre.classList.add('ctm-preloader-saindo');
      setTimeout(function () {
        html.classList.remove('ctm-pre-on');
        if (pre.parentNode) pre.parentNode.removeChild(pre);
      }, 600);
    };
    var animarPre = function () {
      if (reduz || !alvo || !preLogo) { setTimeout(encerrarPre, 450); return; }
      var pr = preLogo.getBoundingClientRect();
      var hr = alvo.getBoundingClientRect();
      if (!pr.width || !hr.width) { setTimeout(encerrarPre, 450); return; }
      var escala = hr.width / pr.width;
      var dx = (hr.left + hr.width / 2) - (pr.left + pr.width / 2);
      var dy = (hr.top + hr.height / 2) - (pr.top + pr.height / 2);
      setTimeout(function () {                       // segura no centro
        pre.classList.add('ctm-preloader-voando');   // fundo começa a sumir junto com o voo
        preLogo.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + escala + ')';
        setTimeout(encerrarPre, 950);                // voa e depois some
      }, 650);
    };
    if (document.readyState === 'complete') animarPre();
    else window.addEventListener('load', animarPre);
  }

  /* ---------- Menu mobile (hamburger) — fullscreen ---------- */
  var burger = document.querySelector('.ctm-header-burger');
  var menu = document.querySelector('.ctm-header-menu');
  var header = document.querySelector('.ctm-header');

  if (burger && menu) {
    burger.addEventListener('click', function () {
      var aberto = menu.classList.toggle('ctm-aberto');
      burger.classList.toggle('ctm-aberto', aberto);
      burger.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      if (header) header.style.backgroundColor = aberto ? '#00192d' : '';
      document.body.style.overflow = aberto ? 'hidden' : '';
    });
  }

  /* ---------- Cabeçalho fixo: transparente no topo, ganha fundo/borda ao rolar ---------- */
  if (header) {
    var aoRolar = function () {
      header.classList.toggle('ctm-header-rolado', (window.scrollY || window.pageYOffset) > 24);
    };
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
  }

  /* ---------- Palavra final rotativa (hero da home) — efeito roleta ---------- */
  var rotativa = document.querySelector('.home-hero-rotativa');
  if (rotativa && !reduz) {
    var palavras = ['estratégia', 'presença', 'resultado', 'confiança', 'história', 'Cotrim'];
    var idx = 0;
    var dur = 380;
    var trans = 'transform ' + dur + 'ms cubic-bezier(0.4,0,0.2,1), opacity ' + dur + 'ms ease';
    setInterval(function () {
      idx = (idx + 1) % palavras.length;
      // sai subindo e some
      rotativa.style.transition = trans;
      rotativa.style.transform = 'translateY(-0.85em)';
      rotativa.style.opacity = '0';
      setTimeout(function () {
        // troca a palavra e reposiciona embaixo, sem transição
        rotativa.textContent = palavras[idx];
        rotativa.style.transition = 'none';
        rotativa.style.transform = 'translateY(0.85em)';
        void rotativa.offsetWidth; // força reflow
        // entra subindo de baixo até o lugar
        rotativa.style.transition = trans;
        rotativa.style.transform = 'translateY(0)';
        rotativa.style.opacity = '1';
      }, dur);
    }, 2600);
  }

  /* ---------- Submenu "Autoral" (menu mobile) ---------- */
  var grupo = document.querySelector('.ctm-header-menu-grupo');
  var sub = document.querySelector('.ctm-header-menu-sub');
  if (grupo && sub) {
    grupo.addEventListener('click', function () {
      var aberto = sub.classList.toggle('ctm-aberto');
      grupo.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });
  }

  /* ---------- Bolinhas da missão "acendem" ao entrar na tela ---------- */
  var cards = document.querySelectorAll('.esc-missao-card');
  if (cards.length) {
    if (reduz || !('IntersectionObserver' in window)) {
      cards.forEach(function (c) { c.classList.add('esc-visivel'); });
    } else {
      var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('esc-visivel'); obs.unobserve(e.target); }
        });
      }, { threshold: 0.35 });
      cards.forEach(function (c) { obs.observe(c); });
    }
  }

  /* ---------- Iniciais nos cards de advogado sem foto ---------- */
  var vazias = document.querySelectorAll('.esc-adv-foto-vazia');
  Array.prototype.forEach.call(vazias, function (el) {
    if (el.textContent.trim()) return;
    el.textContent = iniciais(el.getAttribute('aria-label'));
  });

  /* ---------- Modal de currículo (equipe / sócios) ---------- */
  var modal = document.querySelector('.ctm-modal');
  if (modal) {
    var mFoto = modal.querySelector('.ctm-modal-foto');
    var mTag = modal.querySelector('.ctm-modal-tag');
    var mNome = modal.querySelector('.ctm-modal-nome');
    var mOab = modal.querySelector('.ctm-modal-oab');
    var mCorpo = modal.querySelector('.ctm-modal-corpo');
    var focoAnterior = null;
    var esc = function (t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; };

    var abrir = function (card) {
      var bioEl = card.querySelector('.ctm-bio');
      if (!bioEl) return;
      var nomeEl = card.querySelector('.home-equipe-card-nome, .esc-socio-nome, .esc-adv-nome');
      var oabEl = card.querySelector('.home-equipe-card-oab, .esc-socio-oab, .esc-adv-oab');
      var tagEl = card.querySelector('.home-equipe-card-tag, .esc-socio-tag');
      var img = card.querySelector('img');
      var nome = nomeEl ? nomeEl.textContent.replace(/[[\]]/g, '').trim() : '';
      var bio = bioEl.textContent.trim();

      var tag = tagEl ? tagEl.textContent.trim()
        : (/^Advogada/.test(bio) ? 'Advogada' : (/^Estagi/.test(bio) ? 'Estagiária' : 'Advogado'));
      mTag.textContent = tag;
      mNome.textContent = nome;
      mOab.textContent = oabEl ? oabEl.textContent.trim() : '';

      if (img && img.getAttribute('src')) {
        mFoto.style.backgroundImage = "url('" + img.getAttribute('src') + "')";
        mFoto.textContent = '';
      } else {
        mFoto.style.backgroundImage = 'none';
        mFoto.textContent = iniciais(nome);
      }

      var frases = bio.split(/\.\s+/).map(function (f) { return f.trim(); }).filter(Boolean);
      var lead = frases.shift() || '';
      var html = '<p class="ctm-modal-lead">' + esc(lead.replace(/\.$/, '')) + '.</p>';
      if (frases.length) {
        html += '<ul class="ctm-modal-cred">' + frases.map(function (f) {
          return '<li>' + esc(f.replace(/\.$/, '')) + '.</li>';
        }).join('') + '</ul>';
      }
      mCorpo.innerHTML = html;
      mCorpo.scrollTop = 0;

      focoAnterior = document.activeElement;
      modal.classList.add('ctm-modal-aberto');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('ctm-modal-travado');
      var x = modal.querySelector('.ctm-modal-x');
      if (x) x.focus();
    };

    var fechar = function () {
      modal.classList.remove('ctm-modal-aberto');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('ctm-modal-travado');
      if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
    };

    var botoes = document.querySelectorAll('.home-equipe-card-btn, .esc-socio-btn, .esc-adv-btn');
    Array.prototype.forEach.call(botoes, function (btn) {
      btn.addEventListener('click', function (e) {
        var card = btn.closest('article');
        if (card && card.querySelector('.ctm-bio')) { e.preventDefault(); abrir(card); }
      });
    });
    Array.prototype.forEach.call(modal.querySelectorAll('[data-fechar]'), function (el) {
      el.addEventListener('click', fechar);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('ctm-modal-aberto')) fechar();
    });
  }

  /* ---------- Accordion das áreas de atuação ---------- */
  var cabs = document.querySelectorAll('.areas-item-cab');
  Array.prototype.forEach.call(cabs, function (cab) {
    cab.addEventListener('click', function () {
      var item = cab.closest('.areas-item');
      var aberto = item.classList.toggle('aberto');
      cab.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });
  });

  /* ---------- Newsletter (footer) ---------- */
  var newsForm = document.querySelector('.ctm-footer-form');
  if (newsForm) {
    newsForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var botao = newsForm.querySelector('button');
      var input = newsForm.querySelector('input');
      if (botao && input && input.value) {
        botao.textContent = 'Inscrito ✓';
        input.value = '';
        setTimeout(function () { botao.textContent = 'Inscrever-se'; }, 4000);
      }
    });
  }

  /* ---------- Formulário de contato (página contato.html) ---------- */
  var contatoForm = document.querySelector('.contato-form');
  if (contatoForm) {
    contatoForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var botao = contatoForm.querySelector('button[type="submit"], .ctm-btn[type="submit"]');
      if (botao) {
        var original = botao.textContent;
        botao.textContent = 'Mensagem enviada ✓';
        contatoForm.reset();
        setTimeout(function () { botao.textContent = original; }, 5000);
      }
    });
  }

  /* ---------- Carrossel de áreas (home): auto-scroll contínuo + arrastar ---------- */
  var carrossel = document.querySelector('.home-areas-carrossel');
  var trilho = carrossel && carrossel.querySelector('.home-areas-track');
  if (carrossel && trilho) {
    var pausa = false, arrasta = false, baseX = 0, baseScroll = 0, moveu = false, ultimo = 0;
    var pos = 0; // posição acumulada em float (o scrollLeft do browser arredonda p/ inteiro)
    var metade = function () { return trilho.scrollWidth / 2; };      // 1 conjunto (cards são duplicados)
    var sincronizar = function () { pos = carrossel.scrollLeft; };    // realinha o float após interação

    var loop = function (ts) {
      var dt = ultimo ? ts - ultimo : 16;
      ultimo = ts;
      if (!pausa && !arrasta && !reduz) {
        var m = metade();
        pos += (m / 45000) * dt;                 // mesma cadência do marquee antigo (45s por volta)
        if (m > 0 && pos >= m) pos -= m;          // volta ao início sem emenda (metade duplicada)
        carrossel.scrollLeft = pos;               // acumula no 'pos', nunca relê o scrollLeft arredondado
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // pausa o auto quando o mouse está em cima (deixa ler / arrastar / rolar à vontade)
    carrossel.addEventListener('mouseenter', function () { pausa = true; });
    carrossel.addEventListener('mouseleave', function () { pausa = false; sincronizar(); });

    // arrastar com o mouse (no touch, o scroll nativo já resolve)
    carrossel.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      arrasta = true; moveu = false; baseX = e.clientX; baseScroll = carrossel.scrollLeft;
      carrossel.classList.add('home-areas-arrastando');
    });
    window.addEventListener('pointermove', function (e) {
      if (!arrasta) return;
      var dx = e.clientX - baseX;
      if (Math.abs(dx) > 3) moveu = true;
      carrossel.scrollLeft = baseScroll - dx;
    });
    var soltar = function () {
      if (!arrasta) return;
      arrasta = false; sincronizar();             // retoma o auto de onde o arrasto parou
      carrossel.classList.remove('home-areas-arrastando');
    };
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
    // se houve arrasto, cancela o clique que abriria o link do card
    carrossel.addEventListener('click', function (e) {
      if (moveu) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    // no touch, pausa o auto enquanto o dedo interage e retoma ao soltar
    carrossel.addEventListener('touchstart', function () { pausa = true; }, { passive: true });
    carrossel.addEventListener('touchend', function () { pausa = false; sincronizar(); });
  }

  /* ---------- Scroll suave (lerp) na rolagem do mouse/trackpad ----------
     O scroll-behavior:smooth do CSS só suaviza cliques em âncora — não a
     rolagem da roda. Aqui interpolamos a posição a cada frame pra dar a
     sensação suave também na roda. Só no desktop (ponteiro fino); no touch
     a inércia nativa já é suave. Respeita reduced-motion. */
  (function () {
    if (reduz) return;
    if (!(window.matchMedia && window.matchMedia('(pointer: fine)').matches)) return;

    var raiz = document.documentElement;
    var alvoY = window.scrollY, atualY = window.scrollY, rodando = false;
    raiz.style.scrollBehavior = 'auto'; // desliga o smooth do CSS (senão briga com o lerp por frame)

    var maxY = function () { return Math.max(0, raiz.scrollHeight - window.innerHeight); };
    var bloqueado = function () {
      return raiz.classList.contains('ctm-pre-on') ||                 // preloader
             document.body.classList.contains('ctm-modal-travado') || // modal de currículo
             document.body.style.overflow === 'hidden';               // menu mobile aberto
    };
    // deixa rolar nativamente quando o cursor está sobre uma área com scroll próprio
    var areaInternaRola = function (el, dir) {
      while (el && el.nodeType === 1 && el !== document.body) {
        var s = window.getComputedStyle(el);
        if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
          var noTopo = el.scrollTop <= 0;
          var noFim = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
          if (!((dir < 0 && noTopo) || (dir > 0 && noFim))) return true;
        }
        el = el.parentElement;
      }
      return false;
    };
    var anima = function () {
      atualY += (alvoY - atualY) * 0.09;
      if (Math.abs(alvoY - atualY) < 0.4) { atualY = alvoY; rodando = false; }
      window.scrollTo(0, Math.round(atualY));
      if (rodando) requestAnimationFrame(anima);
    };
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey) return;                               // pinch-zoom
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // gesto horizontal (ex.: carrossel) → nativo
      if (bloqueado()) return;
      if (areaInternaRola(e.target, e.deltaY)) return;     // modal/área com scroll próprio → nativo
      var my = maxY();
      if (my <= 0) return;
      e.preventDefault();
      if (!rodando) { atualY = alvoY = window.scrollY; }   // realinha ao iniciar um novo gesto
      var d = e.deltaY * (e.deltaMode === 1 ? 16 : 1);     // linhas → px (Firefox)
      alvoY = Math.max(0, Math.min(my, alvoY + d));
      if (!rodando) { rodando = true; requestAnimationFrame(anima); }
    }, { passive: false });

    // âncoras internas (ex.: sumário do artigo) usam o mesmo motor, com folga pro header fixo
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var hash = a.getAttribute('href');
      if (!hash || hash === '#') return;
      var destino;
      try { destino = document.querySelector(hash); } catch (err) { return; }
      if (!destino) return;
      e.preventDefault();
      var y = destino.getBoundingClientRect().top + window.scrollY - 80; // 80 = folga do header fixo
      atualY = window.scrollY;
      alvoY = Math.max(0, Math.min(maxY(), y));
      if (!rodando) { rodando = true; requestAnimationFrame(anima); }
    });
  })();
})();
