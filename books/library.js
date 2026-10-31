/* ==========================================================================
   ProBizIntel — research library interactions
   Vanilla JS, no dependencies. Search + shelf filter + jump + scroll chrome.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var VI = document.documentElement.lang === 'vi';
  var L = {
    works: VI ? 'tác phẩm' : 'works',
    work: VI ? 'tác phẩm' : 'work',
    shown: VI ? 'hiển thị' : 'shown',
    noMatch: VI ? 'Không có kết quả cho' : 'No matches for'
  };

  var input = $('#libSearch');
  var clearBtn = $('#libClear');
  var countEl = $('#libCount');
  var emptyEl = $('#libEmpty');
  var jump = $('#libJump');
  var pills = $$('.cat-pill');
  var cards = $$('.work, .coll');
  var shelves = $$('.shelf');
  var total = $$('.work').length;

  function setCount(shown, query) {
    if (!countEl) return;
    if (!query) {
      countEl.innerHTML = '<b>' + total + '</b> ' + L.works;
    } else {
      countEl.innerHTML = '<b>' + shown + '</b> / ' + total + ' ' + L.works +
        ' — \u201c' + escapeHtml(query) + '\u201d';
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  var filter = 'all';
  var query = '';

  function apply() {
    var q = query.trim().toLowerCase();
    var shown = 0;

    cards.forEach(function (card) {
      var okShelf = filter === 'all' || card.getAttribute('data-shelf') === filter;
      var okText = !q || (card.getAttribute('data-text') || '').indexOf(q) !== -1;
      var ok = okShelf && okText;
      card.classList.toggle('is-filtered-out', !ok);
      if (ok) shown++;
    });

    shelves.forEach(function (sec) {
      var any = sec.querySelectorAll('.work:not(.is-filtered-out), .coll:not(.is-filtered-out)').length;
      sec.classList.toggle('is-filtered-out', any === 0);
    });

    if (clearBtn) clearBtn.hidden = !q;
    if (emptyEl) emptyEl.hidden = shown !== 0;
    setCount(shown, q);
  }

  if (input) {
    var t;
    input.addEventListener('input', function () {
      window.clearTimeout(t);
      var v = input.value;
      t = window.setTimeout(function () { query = v; apply(); }, 80);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { input.value = ''; query = ''; apply(); input.blur(); }
      if (e.key === 'Enter') {
        var first = $('.shelf:not(.is-filtered-out)');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (!input) return;
      input.value = ''; query = ''; apply(); input.focus();
    });
  }

  pills.forEach(function (p) {
    p.addEventListener('click', function () {
      pills.forEach(function (x) { x.classList.remove('is-active'); });
      p.classList.add('is-active');
      filter = p.getAttribute('data-filter');
      apply();
      var target = filter === 'all' ? $('.lib-body') : document.getElementById('shelf-' + filter);
      if (target) {
        var top = target.getBoundingClientRect().top + window.scrollY - 128;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  if (jump) {
    jump.addEventListener('change', function () {
      if (jump.value === 'all') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      var t = document.getElementById(jump.value);
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  var reset = $('#libReset');
  if (reset) {
    reset.addEventListener('click', function () {
      if (input) input.value = '';
      query = '';
      filter = 'all';
      pills.forEach(function (x) { x.classList.toggle('is-active', x.getAttribute('data-filter') === 'all'); });
      apply();
    });
  }

  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
      if (!input) return;
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(function () { input.focus({ preventScroll: true }); }, 260);
    }
  });

  /* header chrome */
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

  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  var menuBtn = $('#menuBtn');
  var nav = $('#nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !menuBtn.contains(e.target)) {
        nav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  apply();
})();
