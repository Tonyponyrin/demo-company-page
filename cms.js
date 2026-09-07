/* ==========================================================================
   Applies content/*.json over the DOM.

   index.html ships English copy inline. If a fetch fails, that inline copy
   stays on screen and the page still works — never throw past this boundary.

   A data-cms path must match the nesting in site.json and the field names in
   admin/config.yml exactly. A mismatch fails silently and falls back to the
   inline copy; see CLAUDE.md.
   ========================================================================== */
(function () {
  'use strict';

  var site = null;
  var products = [];
  var projects = [];

  function lang() {
    return (window.SCLang && window.SCLang.get()) || document.documentElement.lang || 'th';
  }

  /* Read "hero.slide1Image" out of the active locale. */
  function lookup(path) {
    if (!site) return undefined;
    var scope = site[lang()] || site.en || site.th;
    if (!scope) return undefined;

    return path.split('.').reduce(function (acc, key) {
      return acc && typeof acc === 'object' ? acc[key] : undefined;
    }, scope);
  }

  /* Sveltia writes managed uploads as absolute paths ("/demo-company-page/...")
     because public_folder must be absolute. The page uses relative URLs so it
     works from any path, so map them back. */
  function toRelativeAsset(value) {
    if (typeof value !== 'string' || !value) return value;
    var marker = '/assets/images';
    var at = value.indexOf(marker);
    return at === -1 ? value : '.' + value.slice(at);
  }

  function pick(entry, field) {
    if (!entry) return '';
    return entry[field + '_' + lang()] || entry[field + '_en'] || entry[field + '_th'] || '';
  }

  function byOrder(a, b) {
    return (a.order || 0) - (b.order || 0);
  }

  /* -------------------------------------------------------- text & images */

  function applySite() {
    if (!site) return;

    document.querySelectorAll('[data-cms]').forEach(function (el) {
      var value = lookup(el.dataset.cms);
      if (typeof value === 'string' && value) el.textContent = value;
    });

    document.querySelectorAll('[data-cms-content]').forEach(function (el) {
      var value = lookup(el.dataset.cmsContent);
      if (typeof value === 'string' && value) el.setAttribute('content', value);
    });

    document.querySelectorAll('[data-cms-src]').forEach(function (el) {
      var value = lookup(el.dataset.cmsSrc);
      if (typeof value === 'string' && value) el.src = toRelativeAsset(value);
    });

    document.querySelectorAll('[data-cms-alt]').forEach(function (el) {
      var value = lookup(el.dataset.cmsAlt);
      if (typeof value === 'string' && value) el.alt = value;
    });

    applyLinks();
  }

  /* Phone / LINE / Facebook appear in three places each (contact card, footer,
     sticky rail), so their hrefs are wired from one place. */
  function applyLinks() {
    var phone1 = lookup('contact.phone1');
    var phone2 = lookup('contact.phone2');
    var lineUrl = lookup('contact.lineUrl');
    var fbUrl = lookup('contact.fbUrl');
    var mapEmbed = lookup('contact.mapEmbed');

    function tel(value) {
      return 'tel:' + String(value || '').replace(/[^\d+]/g, '');
    }

    function setHref(selector, value) {
      if (!value) return;
      document.querySelectorAll(selector).forEach(function (el) { el.href = value; });
    }

    if (phone1) setHref('[data-contact-phone1], [data-footer-phone], [data-rail-phone]', tel(phone1));
    if (phone2) setHref('[data-contact-phone2]', tel(phone2));
    setHref('[data-contact-line], [data-footer-line], [data-rail-line]', lineUrl);
    setHref('[data-contact-fb], [data-footer-fb], [data-rail-fb]', fbUrl);

    if (mapEmbed) {
      document.querySelectorAll('[data-contact-map]').forEach(function (el) { el.src = mapEmbed; });
    }
  }

  /* -------------------------------------------------------------- products */

  function applyProducts() {
    if (!products.length) return;
    var ordered = products.slice().sort(byOrder);

    // Grid cards. Rendered with is-visible already applied, because the reveal
    // observer only ever saw the original markup.
    var grid = document.querySelector('[data-product-grid]');
    if (grid) {
      grid.innerHTML = '';
      ordered.forEach(function (product) {
        var card = document.createElement('a');
        card.className = 'product-card is-visible';
        card.href = '#product-' + product.anchor;

        var img = document.createElement('img');
        img.src = toRelativeAsset(product.image);
        img.alt = pick(product, 'alt') || pick(product, 'title');
        img.loading = 'lazy';

        var title = document.createElement('h3');
        title.textContent = pick(product, 'title');

        card.append(img, title);
        grid.appendChild(card);
      });
    }

    // Detail bands are static markup keyed by anchor; only their content moves.
    ordered.forEach(function (product) {
      var band = document.querySelector('[data-product-detail="' + product.anchor + '"]');
      if (!band) return;

      var fields = {
        '[data-detail-title]': pick(product, 'title'),
        '[data-detail-tagline]': pick(product, 'tagline'),
        '[data-detail-body]': pick(product, 'body'),
        '[data-detail-spec]': pick(product, 'spec')
      };

      Object.keys(fields).forEach(function (selector) {
        var el = band.querySelector(selector);
        if (el && fields[selector]) el.textContent = fields[selector];
      });

      var img = band.querySelector('[data-detail-image]');
      if (img && product.image) {
        img.src = toRelativeAsset(product.image);
        img.alt = pick(product, 'alt') || pick(product, 'title');
      }
    });

    applyProductOptions(ordered);
  }

  /* The quote dropdown is built from the product list, and each option carries
     its unit so script.js can show it beside Quantity. */
  function applyProductOptions(ordered) {
    var select = document.querySelector('[data-quote-product-select]');
    if (!select) return;

    var placeholder = select.querySelector('option[value=""]');
    var previous = select.value;

    select.innerHTML = '';
    if (placeholder) select.appendChild(placeholder);

    ordered.forEach(function (product) {
      var option = document.createElement('option');
      option.value = product.anchor;
      option.textContent = pick(product, 'title');
      if (product.unit) option.dataset.unit = product.unit;
      select.appendChild(option);
    });

    if (previous) select.value = previous;
    if (window.SCQuote) window.SCQuote.syncUnit();
  }

  /* -------------------------------------------------------------- projects */

  function applyProjects() {
    if (!projects.length) return;
    var ordered = projects.slice().sort(byOrder);

    var grid = document.querySelector('[data-works-grid]');
    if (grid) {
      grid.innerHTML = '';
      ordered.forEach(function (project) {
        var card = document.createElement('article');
        card.className = 'work-card is-visible';
        card.dataset.category = project.category || 'house';

        var img = document.createElement('img');
        img.src = toRelativeAsset(project.image);
        img.alt = pick(project, 'alt') || pick(project, 'title');
        img.loading = 'lazy';

        var body = document.createElement('div');
        body.className = 'work-body';

        var label = document.createElement('p');
        label.className = 'work-label';
        label.textContent = pick(project, 'label');

        var title = document.createElement('h3');
        title.textContent = pick(project, 'title');

        var desc = document.createElement('p');
        desc.className = 'work-desc';
        desc.textContent = pick(project, 'description');

        body.append(label, title, desc);
        card.append(img, body);
        grid.appendChild(card);
      });

      // Re-apply whichever filter is currently selected, since the cards are new.
      var active = document.querySelector('[data-filter].is-active');
      if (active && active.dataset.filter !== 'all') active.click();
    }

    var reel = document.querySelector('[data-works-reel]');
    if (reel) {
      reel.innerHTML = '';
      ordered.forEach(function (project) {
        var item = document.createElement('a');
        item.className = 'reel-item';
        item.href = '#works';

        var img = document.createElement('img');
        img.src = toRelativeAsset(project.image);
        img.alt = pick(project, 'alt') || pick(project, 'title');
        img.loading = 'lazy';

        var caption = document.createElement('span');
        caption.className = 'reel-caption';
        caption.textContent = pick(project, 'title');

        item.append(img, caption);
        reel.appendChild(item);
      });
    }
  }

  /* ------------------------------------------------------------------ load */

  function applyAll() {
    applySite();
    applyProducts();
    applyProjects();

    // Give script.js the Google Form ids without another fetch.
    window.SCContent = {
      quoteForm: (site && (site[lang()] || site.en || site.th) || {}).quoteForm || {}
    };
  }

  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw new Error(url + ' -> ' + res.status);
      return res.json();
    });
  }

  Promise.allSettled([
    getJSON('./content/site.json'),
    getJSON('./content/products.json'),
    getJSON('./content/projects.json')
  ]).then(function (results) {
    if (results[0].status === 'fulfilled') site = results[0].value;
    if (results[1].status === 'fulfilled') products = results[1].value.products || [];
    if (results[2].status === 'fulfilled') projects = results[2].value.projects || [];

    results.forEach(function (result) {
      if (result.status === 'rejected') {
        console.warn('[cms] keeping inline copy:', result.reason && result.reason.message);
      }
    });

    applyAll();
  });

  document.addEventListener('sc:languagechange', applyAll);
})();
