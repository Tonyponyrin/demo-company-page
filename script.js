/* ==========================================================================
   SC Singhawat Concrete — behaviour only.

   Five pages share this file. Everything below no-ops cleanly when the element
   it drives is absent, so each page gets only the behaviour it has markup for.

   No translated strings live here. Copy comes from content/*.json via cms.js;
   this file tracks the active language and tells cms.js when it changes.
   ========================================================================== */
(function () {
  'use strict';

  var SUPPORTED = ['th', 'en', 'zh'];
  var STORAGE_KEY = 'sc-lang';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------- language */

  function initialLanguage() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) { /* private mode: fall through to the default */ }
    return 'th';
  }

  var currentLang = initialLanguage();

  function setLanguage(lang) {
    if (SUPPORTED.indexOf(lang) === -1 || lang === currentLang) return;
    currentLang = lang;
    document.documentElement.lang = lang;

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }

    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
    });

    document.dispatchEvent(new CustomEvent('sc:languagechange', { detail: { language: lang } }));
  }

  document.documentElement.lang = currentLang;
  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.setAttribute('aria-pressed', String(btn.dataset.lang === currentLang));
    btn.addEventListener('click', function () { setLanguage(btn.dataset.lang); });
  });

  window.SCLang = { get: function () { return currentLang; }, set: setLanguage };

  /* --------------------------------------------------------------- header */

  var header = document.getElementById('site-header');
  var navToggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('site-nav');

  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* The nav markup is identical on all five pages (it is synced from
     index.html), so the current page is marked here rather than in the HTML. */
  (function markCurrentPage() {
    var file = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.site-nav a').forEach(function (a) {
      var target = a.getAttribute('href');
      if (target === file) {
        a.classList.add('is-current');
        a.setAttribute('aria-current', 'page');
      }
    });
  })();

  /* -------------------------------------------------- sticky quote button */
  /* The home hero carries its own Get Quote in the bottom-left corner, so the
     sticky one only appears once the hero is out of the way. On pages with no
     hero it is shown from the start. */

  var stickyQuote = document.querySelector('.sticky-quote');
  var hero = document.querySelector('.hero:not(.product-lead)');

  if (stickyQuote) {
    if (!hero) {
      stickyQuote.classList.add('is-shown');
    } else {
      var toggleSticky = function () {
        stickyQuote.classList.toggle('is-shown', hero.getBoundingClientRect().bottom < 120);
      };
      window.addEventListener('scroll', toggleSticky, { passive: true });
      window.addEventListener('resize', toggleSticky);
      toggleSticky();
    }
  }

  /* -------------------------------------------------------- scroll reveal */
  /* Direction comes from data-reveal in the markup — it is a client
     requirement (product text from the left, product image from the right),
     not decoration. See REQUIREMENTS.md. */

  if (reduceMotion || !('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      el.classList.add('is-visible');
    });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      revealObserver.observe(el);
    });

    /* An anchor jump (a product card, or landing on #works) can skip straight
       past sections, which the observer never sees intersecting — they would
       stay invisible for good.

       Only rescue elements that are now entirely ABOVE the viewport. Anything
       still on screen, or arriving from below, belongs to the observer:
       sweeping those would reveal them the moment their top edge crossed the
       bottom of the screen, so the slide-in would play off-screen. */
    var sweep = function () {
      document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach(function (el) {
        if (el.getBoundingClientRect().bottom <= 0) {
          el.classList.add('is-visible');
          revealObserver.unobserve(el);
        }
      });
    };
    window.addEventListener('scroll', sweep, { passive: true });
    window.addEventListener('hashchange', function () { setTimeout(sweep, 60); });
  }

  /* -------------------------------------------------- full-page scrolling */
  /* CSS scroll-snap alone is not enough: one wheel notch is a small delta, so
     the browser snaps back to the section you are already on and the page feels
     stuck. This advances exactly one section per gesture, which is what the
     "Scroll down" arrow between every wireframe frame asks for.

     Deliberately narrow: desktop widths only, never while the quote modal is
     open, and never inside a section that is taller than the screen (there the
     reader needs ordinary scrolling to reach the rest of it). Touch and
     keyboard are left entirely to the browser and the CSS snap points. */

  var snapLock = false;

  function snapTargets() {
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    // offsetTop, not getBoundingClientRect: a section carrying an unfinished
    // [data-reveal] transform reports a shifted rect, which would put every
    // snap target a few pixels off its real position.
    var tops = Array.prototype.map.call(
      document.querySelectorAll('main > section'),
      function (s) { return Math.round(s.offsetTop); }
    );
    tops.push(maxScroll); // the footer, which snaps to the bottom rather than its top
    return tops
      .filter(function (t, i, a) { return t >= 0 && t <= maxScroll && a.indexOf(t) === i; })
      .sort(function (a, b) { return a - b; });
  }

  function snapEnabled() {
    return window.innerWidth > 760 &&
      getComputedStyle(document.documentElement).scrollSnapType.indexOf('none') === -1;
  }

  function onWheel(e) {
    if (!snapEnabled()) return;
    if (document.body.classList.contains('modal-open')) return;
    if (e.ctrlKey) return;                       // pinch-zoom
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

    // Let a section that overflows the screen scroll normally until its edge.
    var section = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    section = section && section.closest('main > section');
    if (section && section.scrollHeight > window.innerHeight + 8) {
      var rect = section.getBoundingClientRect();
      var atEnd = e.deltaY > 0 ? rect.bottom <= window.innerHeight + 8 : rect.top >= -8;
      if (!atEnd) return;
    }

    if (snapLock) { e.preventDefault(); return; }

    var tops = snapTargets();
    var here = window.scrollY;
    var next = e.deltaY > 0
      ? tops.find(function (t) { return t > here + 8; })
      : tops.slice().reverse().find(function (t) { return t < here - 8; });

    if (next === undefined) return;              // already at the first or last

    e.preventDefault();
    snapLock = true;
    window.scrollTo({ top: next, behavior: reduceMotion ? 'auto' : 'smooth' });

    var release = function () { snapLock = false; };
    if ('onscrollend' in window) {
      window.addEventListener('scrollend', release, { once: true });
      setTimeout(release, 1200);                 // belt and braces if it never fires
    } else {
      setTimeout(release, reduceMotion ? 60 : 700);
    }
  }

  window.addEventListener('wheel', onWheel, { passive: false });

  /* ------------------------------------------------------------ slideshows */

  document.querySelectorAll('[data-slideshow]').forEach(function (root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll('.slide'));
    if (slides.length < 2) return;

    var index = slides.findIndex(function (s) { return s.classList.contains('is-active'); });
    if (index < 0) index = 0;

    var dotsWrap = root.querySelector('[data-slide-dots]');
    var dots = [];

    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.addEventListener('click', function () { go(i, true); });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    function paint() {
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === index); });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === index); });
    }

    var timer = null;
    var delay = parseInt(root.dataset.autoplay, 10) || 0;

    function schedule() {
      if (!delay || reduceMotion) return;
      clearTimeout(timer);
      timer = setTimeout(function () { go(index + 1); }, delay);
    }

    function go(next, fromUser) {
      index = (next + slides.length) % slides.length;
      paint();
      if (fromUser) clearTimeout(timer);
      schedule();
    }

    var prev = root.querySelector('[data-slide-prev]');
    var next = root.querySelector('[data-slide-next]');
    if (prev) prev.addEventListener('click', function () { go(index - 1, true); });
    if (next) next.addEventListener('click', function () { go(index + 1, true); });

    root.addEventListener('mouseenter', function () { clearTimeout(timer); });
    root.addEventListener('mouseleave', schedule);

    paint();
    schedule();
  });

  /* ------------------------------------------------------------- work reel */
  /* Auto-advances right to left, as sketched on frame 3. Queries its items at
     call time because cms.js rebuilds them from projects.json. */

  document.querySelectorAll('[data-reel]').forEach(function (root) {
    var track = root.querySelector('[data-reel-track]');
    if (!track) return;

    var offset = 0;
    var timer = null;
    var delay = parseInt(root.dataset.autoplay, 10) || 4000;

    function step() {
      var items = track.children;
      if (items.length < 2) return;

      var stride = items[0].getBoundingClientRect().width +
        parseFloat(getComputedStyle(track).columnGap || '0');

      offset += 1;
      if (offset >= items.length) offset = 0;

      track.style.transform = 'translateX(' + (-offset * stride) + 'px)';
    }

    function play() {
      if (reduceMotion) return;
      clearInterval(timer);
      timer = setInterval(step, delay);
    }

    root.addEventListener('mouseenter', function () { clearInterval(timer); });
    root.addEventListener('mouseleave', play);
    window.addEventListener('resize', function () { offset = 0; track.style.transform = ''; });

    play();
  });

  /* --------------------------------------------------------------- filters */
  /* Cards are re-rendered by cms.js, so the grid is queried on every click
     rather than captured once at load. */

  var filterButtons = document.querySelectorAll('[data-filter]');

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterButtons.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');

      var category = btn.dataset.filter;
      document.querySelectorAll('.work-card').forEach(function (card) {
        var show = category === 'all' || card.dataset.category === category;
        card.classList.toggle('is-hidden', !show);
      });
    });
  });

  /* ----------------------------------------------- project detail carousel */
  /* Frame 22: a project name plus prev/next arrows. cms.js fills the frames
     from projects.json and tags each works card with its index, so "click to
     see more" on a card opens that project here. */

  (function projectCarousel() {
    var root = document.querySelector('[data-project-carousel]');
    var frames = document.querySelector('[data-project-frames]');
    var nameEl = document.querySelector('[data-project-name]');
    if (!root || !frames) return;

    var index = 0;

    function show(next) {
      var items = frames.children;
      if (!items.length) return;

      index = (next + items.length) % items.length;
      Array.prototype.forEach.call(items, function (el, i) {
        el.classList.toggle('is-active', i === index);
      });
      if (nameEl && items[index].dataset.title) {
        nameEl.textContent = items[index].dataset.title;
      }
    }

    var prev = root.querySelector('[data-project-prev]');
    var next = root.querySelector('[data-project-next]');
    if (prev) prev.addEventListener('click', function () { show(index - 1); });
    if (next) next.addEventListener('click', function () { show(index + 1); });

    document.addEventListener('click', function (e) {
      var card = e.target.closest('.work-card[data-project-index]');
      if (!card) return;
      show(parseInt(card.dataset.projectIndex, 10) || 0);
      document.getElementById('project-detail').scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    });

    // cms.js calls this once it has rendered the frames.
    window.SCProjects = { show: show };
    show(0);
  })();

  /* ----------------------------------------------------------- quote forms */
  /* The same form appears twice on the home page — inline as a section and
     inside the modal — and once inside the modal on every other page. All of
     them are wired here, each scoped to its own fields. */

  var modal = document.getElementById('quote-modal');
  var lastFocus = null;

  function quoteRef() {
    var d = new Date();
    var stamp = String(d.getFullYear()).slice(2) +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0');
    return 'Q' + stamp + '-' + String(Math.floor(Math.random() * 900) + 100);
  }

  /* The unit shown beside Quantity is whatever the chosen product sells in.
     cms.js stamps data-unit onto each option when it builds the dropdown. */
  function syncUnit(form) {
    var select = form.querySelector('[data-quote-product-select]');
    var unitEl = form.querySelector('[data-quote-unit]');
    if (!select || !unitEl) return;

    var opt = select.options[select.selectedIndex];
    var unit = opt ? opt.dataset.unit : '';
    unitEl.textContent = unit || '—';
    unitEl.classList.toggle('is-set', Boolean(unit));
  }

  function quoteForms() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-quote-form]'));
  }

  function successPanelFor(form) {
    return form.parentElement
      ? form.parentElement.querySelector('[data-quote-success]')
      : null;
  }

  /* Posts to a Google Form. The response is opaque (no-cors), so we cannot read
     success or failure — the confirmation is shown optimistically. That
     trade-off is deliberate and documented in CLAUDE.md. */
  function submitQuote(e) {
    e.preventDefault();
    var form = e.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var cfg = (window.SCContent && window.SCContent.quoteForm) || {};
    var data = new FormData(form);
    var body = new URLSearchParams();
    var unitEl = form.querySelector('[data-quote-unit]');

    var map = {
      name: cfg.entryName,
      product: cfg.entryProduct,
      quantity: cfg.entryQuantity,
      site: cfg.entrySite,
      contact: cfg.entryContact
    };

    Object.keys(map).forEach(function (field) {
      var entry = map[field];
      if (!entry || entry.indexOf('PLACEHOLDER') === 0) return;
      var value = data.get(field) || '';
      if (field === 'quantity' && value && unitEl) value += ' ' + unitEl.textContent;
      body.append(entry, value);
    });

    if (cfg.formId && cfg.formId.indexOf('PLACEHOLDER') !== 0 && Array.from(body).length) {
      fetch('https://docs.google.com/forms/d/e/' + cfg.formId + '/formResponse', {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      }).catch(function () { /* opaque either way; nothing to report */ });
    } else {
      console.warn(
        '[quote] Google Form is not configured. Fill in quoteForm.formId and the ' +
        'entry ids in content/site.json — see REQUIREMENTS.md.'
      );
    }

    var panel = successPanelFor(form);
    form.hidden = true;
    if (panel) panel.hidden = false;
    form.reset();
  }

  quoteForms().forEach(function (form) {
    var select = form.querySelector('[data-quote-product-select]');
    if (select) select.addEventListener('change', function () { syncUnit(form); });

    var ref = form.querySelector('[data-quote-ref]');
    if (ref) ref.textContent = quoteRef();

    form.addEventListener('submit', submitQuote);
  });

  function openModal(preselect) {
    if (!modal) return;
    lastFocus = document.activeElement;

    var form = modal.querySelector('[data-quote-form]');
    var panel = form && successPanelFor(form);

    if (form) {
      form.hidden = false;
      var ref = form.querySelector('[data-quote-ref]');
      if (ref) ref.textContent = quoteRef();

      if (preselect) {
        var select = form.querySelector('[data-quote-product-select]');
        // If cms.js has not populated the options yet the value will not stick,
        // and syncUnit falls back to the placeholder — the correct state.
        if (select) select.value = preselect;
      }
      syncUnit(form);
    }
    if (panel) panel.hidden = true;

    modal.hidden = false;
    document.body.classList.add('modal-open');

    var first = modal.querySelector('input, select, button');
    if (first) first.focus();
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-quote-open]');
    if (opener) {
      e.preventDefault();
      openModal(opener.dataset.quoteProduct || '');
      return;
    }
    if (e.target.closest('[data-quote-close]')) {
      e.preventDefault();
      closeModal();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
    if (e.key !== 'Tab' || !modal || modal.hidden) return;

    // Keep focus inside the dialog while it is open.
    var focusables = modal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea'
    );
    var visible = Array.prototype.filter.call(focusables, function (el) {
      return el.offsetParent !== null;
    });
    if (!visible.length) return;

    var first = visible[0];
    var last = visible[visible.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* cms.js re-syncs the units after it rebuilds the product dropdowns. */
  window.SCQuote = {
    syncUnits: function () { quoteForms().forEach(syncUnit); }
  };
})();
