/* ==========================================================================
   ProBizIntel — portal interactions
   Vanilla JS. No dependencies. Bilingual EN / VI with localStorage persistence.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var STORAGE_KEY = 'pbi-lang';
  var currentLang = 'en';

  var STRINGS = {
    en: {
      matches: 'matches',
      match: 'match',
      noMatches: 'No matches for',
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
      title: 'ProBizIntel | Heavy Industrial Project Intelligence'
    },
    vi: {
      matches: 'kết quả',
      match: 'kết quả',
      noMatches: 'Không có kết quả cho',
      menuOpen: 'Mở menu',
      menuClose: 'Đóng menu',
      title: 'ProBizIntel | Trí tuệ Dự án Công nghiệp Nặng'
    }
  };

  function t(key) { return STRINGS[currentLang][key] || STRINGS.en[key]; }

  // Per-page titles: <html data-title-en="…" data-title-vi="…">
  var PAGE_TITLE = {
    en: document.documentElement.getAttribute('data-title-en'),
    vi: document.documentElement.getAttribute('data-title-vi')
  };
  function pageTitle() {
    return PAGE_TITLE[currentLang] || PAGE_TITLE.en || t('title');
  }

  /* ---------------- i18n engine ---------------- */
  var textStore = new Map();   // element -> original innerHTML
  var phStore = new Map();     // input -> original placeholder
  var ariaStore = new Map();   // element -> original aria-label

  function applyLang(lang, persist) {
    currentLang = lang === 'vi' ? 'vi' : 'en';
    document.documentElement.setAttribute('lang', currentLang);
    document.title = pageTitle();

    $$('[data-vi]').forEach(function (el) {
      if (!textStore.has(el)) textStore.set(el, el.innerHTML);
      var vi = el.getAttribute('data-vi');
      el.innerHTML = currentLang === 'vi' ? vi : textStore.get(el);
    });

    $$('[data-vi-ph]').forEach(function (el) {
      if (!phStore.has(el)) phStore.set(el, el.getAttribute('placeholder') || '');
      el.setAttribute('placeholder', currentLang === 'vi' ? el.getAttribute('data-vi-ph') : phStore.get(el));
    });

    $$('[data-vi-aria]').forEach(function (el) {
      if (!ariaStore.has(el)) ariaStore.set(el, el.getAttribute('aria-label') || '');
      el.setAttribute('aria-label', currentLang === 'vi' ? el.getAttribute('data-vi-aria') : ariaStore.get(el));
    });

    $$('.lang-btn').forEach(function (btn) {
      var active = btn.getAttribute('data-lang') === currentLang;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    if (persist !== false) {
      try { localStorage.setItem(STORAGE_KEY, currentLang); } catch (e) { /* storage blocked */ }
    }

    // refresh an active search so titles + counters follow the language
    var input = $('#portalSearch');
    if (input && input.value.trim()) applySearch(input.value);
    else if (input) applySearch('');
  }

  $$('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyLang(btn.getAttribute('data-lang'), true);
    });
  });

  var stored = null;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { stored = null; }
  var initial = stored || ((navigator.language || 'en').toLowerCase().indexOf('vi') === 0 ? 'vi' : 'en');
  applyLang(initial, false);

  /* ---------------- year ---------------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- header / scroll progress ---------------- */
  var header = $('#siteHeader');
  var progress = $('#scrollProgress');
  var toTop = $('#toTop');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var h = document.documentElement.scrollHeight - window.innerHeight;

    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (progress) progress.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';
    if (toTop) toTop.classList.toggle('is-visible', y > 700);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------------- mobile nav ---------------- */
  var menuBtn = $('#menuBtn');
  var nav = $('#nav');

  function closeNav() {
    if (!nav || !menuBtn) return;
    nav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    var label = menuBtn.getAttribute('data-vi-aria');
    if (label) menuBtn.setAttribute('aria-label', currentLang === 'vi' ? label : t('menuOpen'));
    else menuBtn.setAttribute('aria-label', t('menuOpen'));
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? t('menuClose') : t('menuOpen'));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('.nav-link')) closeNav();
    });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !menuBtn.contains(e.target)) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* ---------------- active nav ---------------- */
  var navLinks = $$('.nav-link');
  var sections = navLinks
    .map(function (link) { return document.getElementById(link.getAttribute('href').slice(1)); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var visible = new Set();
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });
      var current = null;
      sections.forEach(function (sec) { if (visible.has(sec.id) && !current) current = sec.id; });
      if (current) {
        navLinks.forEach(function (l) {
          l.classList.toggle('is-active', l.getAttribute('href') === '#' + current);
        });
      }
    }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (sec) { spy.observe(sec); });
  }

  /* ---------------- BoK tabs ---------------- */
  var tabs = $$('.tab');
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { activateTab(i); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      activateTab(next);
      tabs[next].focus();
    });
  });

  function activateTab(index) {
    tabs.forEach(function (tab, i) {
      var selected = i === index;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) {
        panel.classList.toggle('is-active', selected);
        if (selected) panel.removeAttribute('hidden');
        else panel.setAttribute('hidden', '');
      }
    });
  }
  if (tabs.length) activateTab(0);

  /* ---------------- risk filters ---------------- */
  var riskFilters = $('#riskFilters');
  var riskCards = $$('.risk-card');
  if (riskFilters && riskCards.length) {
    riskFilters.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-filter]');
      if (!btn) return;
      var filter = btn.getAttribute('data-filter');
      $$('.chip', riskFilters).forEach(function (c) { c.classList.toggle('is-active', c === btn); });
      riskCards.forEach(function (card) {
        var show = filter === 'all' || card.getAttribute('data-cat') === filter;
        card.classList.toggle('is-hidden', !show);
      });
    });
  }

  /* ---------------- search ---------------- */
  var input = $('#portalSearch');
  var clearBtn = $('#searchClear');
  var countEl = $('#searchCount');
  var emptyEl = $('#emptyState');
  var searchSections = $$('.knowledge-card');

  function sectionTitle(sec) {
    var key = currentLang === 'vi' ? 'data-title-vi' : 'data-title';
    return (sec.getAttribute(key) || sec.getAttribute('data-title') || '').toLowerCase();
  }

  function hideOrphanHeadings(sec, query) {
    if (!query) {
      $$('.sub-head', sec).forEach(function (el) { el.classList.remove('is-hidden'); });
      return;
    }
    $$('.sub-head', sec).forEach(function (head) {
      var node = head.nextElementSibling;
      var any = false;
      while (node && !node.classList.contains('sub-head')) {
        if (node.classList.contains('s-item') && !node.classList.contains('is-hidden')) { any = true; break; }
        if (node.querySelector && node.querySelector('.s-item:not(.is-hidden)')) { any = true; break; }
        node = node.nextElementSibling;
      }
      head.classList.toggle('is-hidden', !any);
    });
  }

  function applySearch(raw) {
    if (!searchSections || !searchSections.length) return;
    var query = (raw || '').trim().toLowerCase();
    var total = 0;

    searchSections.forEach(function (sec) {
      var titleHit = query && sectionTitle(sec).indexOf(query) !== -1;
      var items = $$('.s-item', sec);
      var visibleCount = 0;

      items.forEach(function (item) {
        var hit = !query || titleHit || item.textContent.toLowerCase().indexOf(query) !== -1;
        item.classList.toggle('is-hidden', !hit);
        if (hit) visibleCount++;
      });

      var show = !query || visibleCount > 0 || titleHit;
      sec.classList.toggle('is-hidden', !show);
      if (query && show) total += visibleCount;

      hideOrphanHeadings(sec, query);
    });

    if (clearBtn) clearBtn.hidden = !query;

    if (countEl) {
      if (!query) {
        countEl.innerHTML = '';
      } else if (total === 0) {
        countEl.innerHTML = t('noMatches') + ' <b>' + escapeHtml(raw.trim()) + '</b>';
      } else {
        countEl.innerHTML = '<b>' + total + '</b> ' + t(total === 1 ? 'match' : 'matches') +
          ' \u2014 \u201c' + escapeHtml(raw.trim()) + '\u201d';
      }
    }
    if (emptyEl) emptyEl.hidden = !(query && total === 0);

    if (query && riskFilters) {
      var active = $('.chip.is-active', riskFilters);
      if (active && active.getAttribute('data-filter') !== 'all') {
        active.classList.remove('is-active');
        var all = $('[data-filter="all"]', riskFilters);
        if (all) all.classList.add('is-active');
        riskCards.forEach(function (c) { c.classList.remove('is-hidden'); });
      }
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  if (input) {
    var debounce;
    input.addEventListener('input', function () {
      window.clearTimeout(debounce);
      var value = input.value;
      debounce = window.setTimeout(function () { applySearch(value); }, 90);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        input.value = '';
        applySearch('');
        input.blur();
      }
      if (e.key === 'Enter') {
        var first = $('.knowledge-card:not(.is-hidden)');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (!input) return;
      input.value = '';
      applySearch('');
      input.focus();
    });
  }

  var chips = $('#quickChips');
  if (chips && input) {
    chips.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var q = chip.getAttribute('data-q');
      input.value = q;
      applySearch(q);
      var first = $('.knowledge-card:not(.is-hidden)');
      if (first) {
        var top = first.getBoundingClientRect().top + window.scrollY - 84;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  }

  var headerSearchBtn = $('#headerSearchBtn');
  if (headerSearchBtn && input) {
    headerSearchBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(function () { input.focus({ preventScroll: true }); }, 380);
    });
  }

  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
    if (typing) return;
    if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
      if (!input) return;
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(function () { input.focus({ preventScroll: true }); }, 300);
    }
  });

  /* ---------------- reveal on scroll ---------------- */
  var revealTargets = $$('.knowledge-card');
  if ('IntersectionObserver' in window && revealTargets.length) {
    revealTargets.forEach(function (el) { el.classList.add('reveal'); });
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealTargets.forEach(function (el) { revealer.observe(el); });
  }

  /* ---------------- in-page links ---------------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });
})();
