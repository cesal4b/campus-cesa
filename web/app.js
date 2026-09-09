(function () {
  'use strict';

  var PHOTO_ROOT = '../Registro fotografico/';

  function imgPath(space, phase, filename) {
    var rel;
    if (space.structure === 'phases') {
      var phaseFolder = { antes: 'ANTES', despues: 'DESPUES', durante: 'DURANTE' }[phase];
      rel = PHOTO_ROOT + space.folder + '/' + phaseFolder + '/' + filename;
    } else {
      rel = PHOTO_ROOT + space.folder + '/' + filename;
    }
    return encodeURI(rel);
  }

  var el = function (tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  };

  /* ---------- Lightbox ---------- */
  var lightboxState = { items: [], index: 0 };
  var lightboxEl, lightboxImg, lightboxCaption;

  function buildLightbox() {
    lightboxEl = el('div', 'lightbox');
    lightboxEl.setAttribute('role', 'dialog');
    lightboxEl.setAttribute('aria-modal', 'true');
    lightboxEl.innerHTML =
      '<button class="lightbox-close" aria-label="Cerrar">&#10005;</button>' +
      '<button class="lightbox-btn lightbox-prev" aria-label="Anterior">&#8249;</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button class="lightbox-btn lightbox-next" aria-label="Siguiente">&#8250;</button>';
    document.body.appendChild(lightboxEl);
    lightboxImg = lightboxEl.querySelector('img');
    lightboxCaption = lightboxEl.querySelector('figcaption');

    lightboxEl.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightboxEl.querySelector('.lightbox-prev').addEventListener('click', function () { stepLightbox(-1); });
    lightboxEl.querySelector('.lightbox-next').addEventListener('click', function () { stepLightbox(1); });
    lightboxEl.addEventListener('click', function (ev) {
      if (ev.target === lightboxEl) closeLightbox();
    });
    document.addEventListener('keydown', function (ev) {
      if (!lightboxEl.classList.contains('open')) return;
      if (ev.key === 'Escape') closeLightbox();
      if (ev.key === 'ArrowLeft') stepLightbox(-1);
      if (ev.key === 'ArrowRight') stepLightbox(1);
    });
  }

  function openLightbox(items, index) {
    lightboxState.items = items;
    lightboxState.index = index;
    renderLightbox();
    lightboxEl.classList.add('open');
  }

  function stepLightbox(delta) {
    var n = lightboxState.items.length;
    lightboxState.index = (lightboxState.index + delta + n) % n;
    renderLightbox();
  }

  function renderLightbox() {
    var item = lightboxState.items[lightboxState.index];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.caption;
    lightboxCaption.textContent = item.caption + ' — ' + (lightboxState.index + 1) + '/' + lightboxState.items.length;
  }

  function closeLightbox() {
    lightboxEl.classList.remove('open');
  }

  /* ---------- Compare slider ---------- */

  // Evita estirar fotos de baja resolución (p. ej. capturas de pantalla) más
  // allá de lo que su nitidez real permite en pantallas retina: una vez
  // cargan las imágenes, si su resolución nativa no alcanza para llenar el
  // ancho por defecto sin pixelarse, encoge el marco al ancho máximo nítido.
  function capSharpWidth(wrap, imgs) {
    var pending = imgs.length;
    var natives = [];

    function evaluate() {
      if (pending > 0) return;
      var minNative = Math.min.apply(null, natives);
      if (!minNative || !isFinite(minNative)) return;
      var dpr = window.devicePixelRatio || 1;
      var sharpWidth = (minNative / dpr) * 1.35; // margen de tolerancia antes de notarse el escalado
      var capped = Math.max(560, Math.min(1150, Math.round(sharpWidth)));
      if (capped < 1100) {
        wrap.style.maxWidth = capped + 'px';
        wrap.style.marginLeft = 'auto';
        wrap.style.marginRight = 'auto';
      }
    }

    imgs.forEach(function (img) {
      function onReady() {
        natives.push(img.naturalWidth || Infinity);
        pending -= 1;
        evaluate();
      }
      if (img.complete) onReady(); else img.addEventListener('load', onReady, { once: true });
    });
  }

  // Ajusta la proporción del marco a la de las fotos reales (la mayoría son
  // ~4:3, no panorámicas) para que la imagen llene el espacio sin dejar
  // franjas de fondo vacías ni recortar el contenido de forma agresiva.
  function matchAspect(wrap, imgs) {
    var pending = imgs.length;
    var ratios = [];

    function evaluate() {
      if (pending > 0) return;
      if (!ratios.length) return;
      var avg = ratios.reduce(function (a, b) { return a + b; }, 0) / ratios.length;
      var clamped = Math.max(1, Math.min(1.9, avg));
      wrap.style.aspectRatio = clamped.toFixed(3);
    }

    imgs.forEach(function (img) {
      function onReady() {
        if (img.naturalWidth && img.naturalHeight) {
          ratios.push(img.naturalWidth / img.naturalHeight);
        }
        pending -= 1;
        evaluate();
      }
      if (img.complete) onReady(); else img.addEventListener('load', onReady, { once: true });
    });
  }

  function buildCompare(space) {
    var beforeSrc = imgPath(space, 'antes', space.antes[0]);
    var afterSrc = imgPath(space, 'despues', space.despues[0]);

    var wrap = el('div', 'compare');
    wrap.innerHTML =
      '<span class="compare-tag tag-antes">Antes</span>' +
      '<span class="compare-tag tag-despues">Después</span>' +
      '<img class="before-img" src="' + beforeSrc + '" alt="' + space.title + ' — antes" loading="lazy">' +
      '<div class="after-wrap"><img src="' + afterSrc + '" alt="' + space.title + ' — después" loading="lazy"></div>' +
      '<div class="compare-handle"><div class="knob">&#8596;</div></div>' +
      '<input class="compare-range" type="range" min="0" max="100" value="50" aria-label="Deslizar para comparar antes y después">';

    var afterWrap = wrap.querySelector('.after-wrap');
    var handle = wrap.querySelector('.compare-handle');
    var range = wrap.querySelector('.compare-range');
    var beforeImg = wrap.querySelector('.before-img');
    var afterImg = afterWrap.querySelector('img');

    function setPos(value) {
      var pct = value + '%';
      afterWrap.style.clipPath = 'inset(0 0 0 ' + pct + ')';
      handle.style.left = pct;
    }
    setPos(50);
    range.addEventListener('input', function () { setPos(range.value); });

    capSharpWidth(wrap, [beforeImg, afterImg]);
    matchAspect(wrap, [beforeImg, afterImg]);

    return wrap;
  }

  /* ---------- Gallery grid ---------- */
  function buildGalleryGroup(space, phase, label, filenames) {
    if (!filenames || !filenames.length) return null;

    var block = el('div', 'gallery-block');
    block.appendChild(el('p', 'gallery-label', '<span class="dot"></span>' + label + ' &middot; ' + filenames.length));

    var grid = el('div', 'gallery-grid');
    var items = filenames.map(function (f) {
      return { src: imgPath(space, phase, f), caption: space.title + ' — ' + label };
    });

    filenames.forEach(function (f, i) {
      var btn = el('button', '', '<img src="' + imgPath(space, phase, f) + '" alt="' + space.title + ' — ' + label + ' ' + (i + 1) + '" loading="lazy">');
      btn.setAttribute('type', 'button');
      btn.addEventListener('click', function () { openLightbox(items, i); });
      grid.appendChild(btn);
    });

    block.appendChild(grid);
    return block;
  }

  /* ---------- Space section ---------- */
  function buildSpace(space, index, total) {
    var section = el('section', 'space');
    section.id = space.id;

    var head = el('div', 'space-head');
    var headLeft = el('div');
    headLeft.appendChild(el('div', 'space-index', String(index + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0')));
    var pilar = el('span', 'space-pilar', space.pilar);
    var titleBlock = el('div');
    titleBlock.appendChild(pilar);
    titleBlock.appendChild(el('h2', '', space.title));
    titleBlock.appendChild(el('p', 'summary', space.summary));

    var detailToggle = el('button', 'detail-toggle', 'Ver el detalle del proyecto &#8250;');
    detailToggle.setAttribute('type', 'button');
    var detailBody = el('div', 'detail-body');
    space.full.forEach(function (paragraph) {
      detailBody.appendChild(el('p', '', paragraph));
    });
    detailToggle.addEventListener('click', function () {
      var isOpen = detailBody.classList.toggle('open');
      detailToggle.innerHTML = isOpen ? 'Ocultar el detalle del proyecto &#8249;' : 'Ver el detalle del proyecto &#8250;';
    });
    titleBlock.appendChild(detailToggle);
    titleBlock.appendChild(detailBody);

    headLeft.appendChild(titleBlock);
    head.appendChild(headLeft);

    var container = el('div', 'container');
    container.appendChild(head);

    // Hero visual: comparación, imagen sola, o galería plana
    if (space.structure !== 'gallery' && space.antes && space.antes.length && space.despues && space.despues.length) {
      container.appendChild(buildCompare(space));
      var caption = el('p', 'compare-caption', 'Desliza para comparar el espacio antes y después de la intervención.');
      container.appendChild(caption);
    } else if (space.despues && space.despues.length) {
      var soloImg = el('img', 'solo-image');
      soloImg.src = imgPath(space, 'despues', space.despues[0]);
      soloImg.alt = space.title + ' — después';
      soloImg.loading = 'lazy';
      container.appendChild(soloImg);
      capSharpWidth(soloImg, [soloImg]);
      matchAspect(soloImg, [soloImg]);
    }

    var phaseGroups = el('div', 'phase-groups');
    if (space.structure === 'gallery') {
      var g = buildGalleryGroup(space, null, 'Registro fotográfico', space.images);
      if (g) phaseGroups.appendChild(g);
    } else {
      var gAntes = buildGalleryGroup(space, 'antes', 'Antes', space.antes);
      var gDurante = buildGalleryGroup(space, 'durante', 'Durante', space.durante);
      var gDespues = buildGalleryGroup(space, 'despues', 'Después', space.despues);
      [gAntes, gDurante, gDespues].forEach(function (g) { if (g) phaseGroups.appendChild(g); });
    }
    if (phaseGroups.children.length) {
      var galleryWrap = el('div', 'gallery-block');
      galleryWrap.style.marginTop = '2.5rem';
      galleryWrap.appendChild(phaseGroups);
      container.appendChild(galleryWrap);
    }

    section.appendChild(container);
    return section;
  }

  /* ---------- Hero + stats ---------- */
  function buildHero() {
    var hero = el('section', 'hero');
    var container = el('div', 'container');
    container.appendChild(el('p', 'eyebrow', CAMPUS_INTRO.eyebrow));
    container.appendChild(el('h1', '', CAMPUS_INTRO.title));
    container.appendChild(el('p', 'hero-subtitle', CAMPUS_INTRO.subtitle));
    container.appendChild(el('p', 'lead', CAMPUS_INTRO.lead));

    var cta = el('a', 'hero-cta', 'Explorar el recorrido &#8595;');
    cta.href = '#' + CAMPUS_SPACES[0].id;
    container.appendChild(cta);

    var stats = el('div', 'stats-strip');
    CAMPUS_STATS.forEach(function (s) {
      var stat = el('div', 'stat');
      stat.appendChild(el('div', 'value', s.value));
      stat.appendChild(el('div', 'label', s.label));
      stats.appendChild(stat);
    });
    container.appendChild(stats);

    hero.appendChild(container);
    return hero;
  }

  function buildIntroBody() {
    var section = el('section', 'intro');
    var container = el('div', 'container');
    container.appendChild(el('p', '', CAMPUS_INTRO.body));
    section.appendChild(container);
    return section;
  }

  function buildHeader() {
    var header = el('header', 'site-header');
    var container = el('div', 'container');

    var brand = el('a', 'brand', 'Campus CESA <span>Recorrido</span>');
    brand.href = '#top';
    container.appendChild(brand);

    var nav = el('nav', 'nav-scroll');
    CAMPUS_SPACES.forEach(function (space) {
      var pill = el('a', 'nav-pill', space.title);
      pill.href = '#' + space.id;
      pill.dataset.target = space.id;
      nav.appendChild(pill);
    });
    container.appendChild(nav);

    header.appendChild(container);
    return header;
  }

  function buildFooter() {
    var footer = el('footer', 'site-footer');
    var container = el('div', 'container');
    container.appendChild(el('p', '', 'Iniciativa Campus CESA · Dirección de Infraestructura · Recorrido fotográfico interno'));
    footer.appendChild(container);
    return footer;
  }

  function setupActiveNav() {
    var pills = Array.prototype.slice.call(document.querySelectorAll('.nav-pill'));
    var sections = CAMPUS_SPACES.map(function (s) { return document.getElementById(s.id); });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        pills.forEach(function (p) { p.classList.toggle('active', p.dataset.target === entry.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { if (s) observer.observe(s); });
  }

  function init() {
    var root = document.getElementById('app');
    root.appendChild(buildHeader());
    root.appendChild(buildHero());
    root.appendChild(buildIntroBody());

    CAMPUS_SPACES.forEach(function (space, i) {
      root.appendChild(buildSpace(space, i, CAMPUS_SPACES.length));
    });

    root.appendChild(buildFooter());

    buildLightbox();
    setupActiveNav();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
