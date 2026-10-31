/* ==========================================================================
   ProBizIntel — portal interactions
   Vanilla JS. No dependencies. Progressive enhancement only.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

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
    menuBtn.setAttribute('aria-label', 'Open menu');
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
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

  /* ---------------- active nav (IntersectionObserver) ---------------- */
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
      // pick the topmost visible section in document order
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

  function clearSearchHighlights() {
    $$('.search-hit').forEach(function (el) { el.classList.remove('search-hit'); });
  }

  function hideOrphanHeadings(sec, query) {
    if (!query) {
      $$('.sub-head, .risk-toolbar, .tabs, .sequence-strip, .cred-strip, .note-strip', sec)
        .forEach(function (el) { el.classList.remove('is-hidden'); });
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
    var query = (raw || '').trim().toLowerCase();
    var total = 0;

    searchSections.forEach(function (sec) {
      var titleHit = query && (sec.getAttribute('data-title') || '').toLowerCase().indexOf(query) !== -1;
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
        countEl.innerHTML = 'No matches for <b>' + escapeHtml(raw.trim()) + '</b>';
      } else {
        countEl.innerHTML = '<b>' + total + '</b> ' + (total === 1 ? 'match' : 'matches') +
          ' for \u201c' + escapeHtml(raw.trim()) + '\u201d';
      }
    }
    if (emptyEl) emptyEl.hidden = !(query && total === 0);

    // reset category filter when a new query is typed
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

  /* ---------------- smooth in-page links (respect reduced motion) ---------------- */
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
