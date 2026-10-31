/* ==========================================================================
   ProBizIntel — radial knowledge mind map
   Vanilla JS. Deterministic radial tree, pan + zoom, path highlighting.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var NS = 'http://www.w3.org/2000/svg';

  var DATA = {
    label: 'ProBizIntel',
    tagline: 'Knowledge Network',
    href: '../index.html',
    children: [
      {
        label: 'Industrial Practice', vi: 'Thực hành Công nghiệp', color: '#b8501e',
        href: '../index.html', children: [
          { label: 'Value Chain', vi: 'Chuỗi giá trị', href: '../index.html#chain' },
          { label: 'IT / OT / AI', vi: 'IT / OT / AI', href: '../index.html#convergence' },
          { label: 'Delivery Lifecycle', vi: 'Vòng đời triển khai', href: '../index.html#delivery' },
          { label: 'PAC&I Body of Knowledge', vi: 'Hệ tri thức PAC&I', href: '../index.html#automation' },
          { label: 'Capability Roadmap', vi: 'Lộ trình năng lực', href: '../index.html#career' },
          { label: 'Energy Capital Strategy', vi: 'Chiến lược vốn năng lượng', href: '../index.html#mba-strategy' },
          { label: 'Heavy Asset Risk', vi: 'Rủi ro tài sản nặng', href: '../index.html#risk-management' }
        ]
      },
      {
        label: 'MBA & Project Management', vi: 'MBA & Quản lý Dự án', color: '#1f6f63',
        href: '../MBAPM/index.html', children: [
          { label: 'Programme Architecture', vi: 'Kiến trúc chương trình', href: '../MBAPM/index.html#curriculum' },
          { label: 'PMBOK Matrix', vi: 'Ma trận PMBOK', href: '../MBAPM/index.html#pmbok' },
          { label: 'PMP Track', vi: 'Lộ trình PMP', href: '../MBAPM/index.html#pmp' },
          { label: 'Finance Toolkit', vi: 'Bộ công cụ tài chính', href: '../MBAPM/index.html#toolkit' },
          { label: 'Research Framework', vi: 'Khung nghiên cứu', href: '../MBAPM/index.html#framework' },
          { label: 'Reading Map', vi: 'Bản đồ đọc', href: '../MBAPM/index.html#reading' }
        ]
      },
      {
        label: 'Risk & Assurance', vi: 'Rủi ro & Đảm bảo', color: '#b23a2b',
        href: '../index.html#risk-management', children: [
          { label: 'ISO 31000', vi: 'ISO 31000', href: '../index.html#risk-management' },
          { label: 'PMBOK Risk Processes', vi: 'Quy trình rủi ro PMBOK', href: '../MBAPM/index.html#pmbok' },
          { label: 'QSRA / Monte Carlo', vi: 'QSRA / Monte Carlo', href: '../index.html#risk-management' },
          { label: 'Bow-tie Model', vi: 'Mô hình Bow-tie', href: '../index.html#risk-management' },
          { label: '59 Ranked Factors', vi: '59 yếu tố xếp hạng', href: '../MBAPM/index.html#framework' }
        ]
      },
      {
        label: 'Research Library', vi: 'Thư viện Nghiên cứu', color: '#6b5aa8',
        href: '../books/index.html', children: [
          { label: 'Strategy', vi: 'Chiến lược', href: '../books/index.html#shelf-strategy' },
          { label: 'Finance & Accounting', vi: 'Tài chính & Kế toán', href: '../books/index.html#shelf-finance' },
          { label: 'Economics', vi: 'Kinh tế học', href: '../books/index.html#shelf-economics' },
          { label: 'Project Management', vi: 'Quản lý dự án', href: '../books/index.html#shelf-project-management' },
          { label: 'Risk Management', vi: 'Quản lý rủi ro', href: '../books/index.html#shelf-risk' },
          { label: 'QLDA Workbooks', vi: 'Sổ bài tập QLDA', href: '../books/index.html#shelf-qlda' },
          { label: 'Open Shelf — free', vi: 'Kệ mở — miễn phí', href: '../books/index.html#shelf-classics' },
          { label: 'Thư viện tiếng Việt', vi: 'Vietnamese library', href: '../vi/books/index.html' }
        ]
      },
      {
        label: 'Knowledge Network', vi: 'Mạng lưới Tri thức', color: '#8a6a2f',
        href: 'https://henryphamduc.github.io/', children: [
          { label: 'Henry Phạm Đức', vi: 'Henry Phạm Đức', href: 'https://henryphamduc.github.io/' },
          { label: 'GeoInst', vi: 'GeoInst', href: 'https://geoinst.github.io/' },
          { label: 'Tennis KB', vi: 'Tennis KB', href: 'https://tenniskb.github.io/' },
          { label: 'TaichiNOW', vi: 'TaichiNOW', href: 'https://taichikb.github.io/' }
        ]
      }
    ]
  };

  var W = 1040, H = 900, CX = W / 2, CY = H / 2;
  var R1 = 176, R2 = 334;
  var TAU = Math.PI * 2;

  var svg = $('#mmSvg');
  var g = $('#mmPanzoom');
  if (!svg || !g) return;

  function lang() { return document.documentElement.lang === 'vi' ? 'vi' : 'en'; }
  function label(n) { return (lang() === 'vi' && n.vi) ? n.vi : n.label; }
  function el(name, attrs) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* ---------------- layout ---------------- */
  function layout() {
    var total = 0;
    DATA.children.forEach(function (b) { total += b.children.length; });

    var start = -Math.PI / 2;
    DATA.children.forEach(function (b) {
      var span = (b.children.length / total) * TAU;
      b._a = start + span / 2;
      b._x = CX + R1 * Math.cos(b._a);
      b._y = CY + R1 * Math.sin(b._a);
      b.children.forEach(function (c, j) {
        var a = start + span * ((j + 0.5) / b.children.length);
        c._a = a;
        c._x = CX + R2 * Math.cos(a);
        c._y = CY + R2 * Math.sin(a);
        c._parent = b;
      });
      start += span;
    });
  }

  function curve(x1, y1, a1, r1, x2, y2, a2, r2) {
    var mr = (r1 + r2) / 2;
    var c1x = CX + mr * Math.cos(a1), c1y = CY + mr * Math.sin(a1);
    var c2x = CX + mr * Math.cos(a2), c2y = CY + mr * Math.sin(a2);
    return 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
           'C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' +
           c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' +
           x2.toFixed(1) + ' ' + y2.toFixed(1);
  }

  /* ---------------- render ---------------- */
  function render() {
    layout();
    while (g.firstChild) g.removeChild(g.firstChild);

    // root
    var root = el('g', { 'class': 'mm-node mm-root' });
    root.appendChild(el('circle', { cx: CX, cy: CY, r: 47 }));
    root.appendChild(el('circle', { cx: CX, cy: CY, r: 58, 'class': 'ring' }));
    var rt = el('text', {
      x: CX, y: CY - 2, 'text-anchor': 'middle', 'dominant-baseline': 'middle'
    });
    rt.textContent = 'ProBizIntel';
    root.appendChild(rt);
    var rg = el('text', {
      x: CX, y: CY + 16, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
      'class': 'tagline'
    });
    rg.textContent = DATA.tagline;
    root.appendChild(rg);
    root.setAttribute('tabindex', '0');
    root.setAttribute('role', 'link');
    root.setAttribute('aria-label', DATA.label);
    root.addEventListener('click', function () { window.location.href = DATA.href; });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = DATA.href; }
    });
    g.appendChild(root);

    DATA.children.forEach(function (b) {
      // link root -> branch
      var l1 = el('path', { d: curve(CX, CY, 0, 47, b._x, b._y, b._a, R1), 'class': 'mm-link' });
      l1.style.stroke = b.color;
      l1.style.opacity = '.35';
      g.appendChild(l1);

      b.children.forEach(function (c) {
        var l2 = el('path', {
          d: curve(b._x, b._y, b._a, R1, c._x, c._y, c._a, R2), 'class': 'mm-link'
        });
        l2.style.stroke = b.color;
        l2.style.opacity = '.22';
        c._link = l2;
        g.appendChild(l2);
      });

      var bn = el('g', { 'class': 'mm-node branch', tabindex: '0', role: 'link' });
      bn.style.color = b.color;
      bn.appendChild(el('circle', { cx: b._x, cy: b._y, r: 20, 'class': 'halo' }));
      bn.appendChild(el('circle', { cx: b._x, cy: b._y, r: 6.5, 'class': 'dot' }));
      var right = Math.cos(b._a) >= 0;
      var t = el('text', {
        x: b._x + (right ? 14 : -14), y: b._y + 4,
        'text-anchor': right ? 'start' : 'end'
      });
      t.textContent = label(b);
      bn.appendChild(t);
      bn.setAttribute('aria-label', label(b));
      bn._node = b; bn._type = 'branch'; bn._link1 = l1;
      bindNode(bn, b.href);
      g.appendChild(bn);

      b.children.forEach(function (c) {
        var cn = el('g', { 'class': 'mm-node', tabindex: '0', role: 'link' });
        cn.style.color = b.color;
        cn.appendChild(el('circle', { cx: c._x, cy: c._y, r: 14, 'class': 'halo' }));
        cn.appendChild(el('circle', { cx: c._x, cy: c._y, r: 4, 'class': 'dot' }));
        var rr = Math.cos(c._a) >= 0;
        var ct = el('text', {
          x: c._x + (rr ? 10 : -10), y: c._y + 3.5,
          'text-anchor': rr ? 'start' : 'end'
        });
        ct.textContent = label(c);
        cn.appendChild(ct);
        cn.setAttribute('aria-label', label(c));
        cn._node = c; cn._type = 'leaf'; cn._branch = b;
        bindNode(cn, c.href);
        g.appendChild(cn);
      });
    });

    renderLegend();
    renderOutline();
    applySearch(($('#mmSearch') || {}).value || '');
  }

  function bindNode(node, href) {
    node.addEventListener('click', function (e) {
      e.stopPropagation();
      if (dragged) return;
      window.location.href = href;
    });
    node.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = href; }
    });
    node.addEventListener('mouseenter', function () { highlight(node); });
    node.addEventListener('focus', function () { highlight(node); });
    node.addEventListener('mouseleave', clearHighlight);
    node.addEventListener('blur', clearHighlight);
  }

  function highlight(node) {
    var d = node._node;
    var color = node.style.color;
    node.classList.add('is-hot');
    if (node._type === 'branch') {
      if (node._link1) { node._link1.classList.add('is-hot'); node._link1.style.opacity = '.9'; }
      d.children.forEach(function (c) {
        if (c._link) { c._link.classList.add('is-hot'); c._link.style.opacity = '.6'; }
      });
    } else {
      if (d._link) { d._link.classList.add('is-hot'); d._link.style.opacity = '.85'; }
    }
    node.style.color = color;
  }

  function clearHighlight() {
    Array.prototype.forEach.call(g.querySelectorAll('.is-hot'), function (n) {
      n.classList.remove('is-hot');
    });
    Array.prototype.forEach.call(g.querySelectorAll('path.mm-link'), function (l) {
      l.classList.remove('is-hot');
      l.style.opacity = l.getAttribute('data-base') || '';
    });
  }

  /* ---------------- legend ---------------- */
  function renderLegend() {
    var box = $('#mmLegend');
    if (!box) return;
    box.innerHTML = '';
    DATA.children.forEach(function (b) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mm-leg';
      btn.innerHTML = '<i style="background:' + b.color + '"></i>' + escapeHtml(label(b)) +
        ' <span style="opacity:.5;font-family:var(--f-mono);font-size:.68rem">' + b.children.length + '</span>';
      btn.addEventListener('click', function () { focusBranch(b); });
      box.appendChild(btn);
    });
  }

  function focusBranch(b) {
    Array.prototype.forEach.call(g.querySelectorAll('.mm-node'), function (n) {
      if (n.classList.contains('mm-root')) return;
      var keep = n._node === b || (n._type === 'leaf' && n._branch === b);
      n.classList.toggle('mm-dim', !keep);
    });
    Array.prototype.forEach.call(g.querySelectorAll('path.mm-link'), function (l) {
      l.style.opacity = '.06';
    });
    b.children.forEach(function (c) { if (c._link) c._link.style.opacity = '.5'; });
    window.setTimeout(function () {
      Array.prototype.forEach.call(g.querySelectorAll('.mm-dim'), function (n) { n.classList.remove('mm-dim'); });
      Array.prototype.forEach.call(g.querySelectorAll('path.mm-link'), function (l) {
        l.style.opacity = l.getAttribute('data-base') || '.22';
      });
    }, 1400);
  }

  /* ---------------- outline ---------------- */
  function renderOutline() {
    var box = $('#mmOutline');
    if (!box) return;
    box.innerHTML = '';
    DATA.children.forEach(function (b, i) {
      var d = document.createElement('details');
      d.className = 'mm-group';
      if (i === 0) d.open = true;
      var s = document.createElement('summary');
      s.innerHTML = '<i style="background:' + b.color + '"></i>' + escapeHtml(label(b));
      d.appendChild(s);
      var ul = document.createElement('ul');
      b.children.forEach(function (c) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = c.href;
        a.innerHTML = '<span style="flex:1 1 auto;font-family:var(--f-body);font-size:.82rem;color:inherit">' +
          escapeHtml(label(c)) + '</span>';
        li.appendChild(a);
        ul.appendChild(li);
      });
      d.appendChild(ul);
      box.appendChild(d);
    });
  }

  /* ---------------- pan / zoom ---------------- */
  var scale = 1, tx = 0, ty = 0, dragging = false, dragged = false;
  var startX = 0, startY = 0, startTx = 0, startTy = 0;

  function applyTransform() {
    g.setAttribute('transform', 'translate(' + tx + ',' + ty + ') scale(' + scale + ')');
  }

  svg.addEventListener('pointerdown', function (e) {
    dragging = true; dragged = false;
    startX = e.clientX; startY = e.clientY;
    startTx = tx; startTy = ty;
    svg.classList.add('is-dragging');
    svg.setPointerCapture(e.pointerId);
  });

  svg.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) dragged = true;
    tx = startTx + dx; ty = startTy + dy;
    applyTransform();
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    svg.classList.remove('is-dragging');
    try { svg.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    window.setTimeout(function () { dragged = false; }, 60);
  }
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  svg.addEventListener('wheel', function (e) {
    e.preventDefault();
    var rect = svg.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;
    var factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    var next = Math.min(3, Math.max(0.5, scale * factor));
    var k = next / scale;
    tx = mx - (mx - tx) * k;
    ty = my - (my - ty) * k;
    scale = next;
    applyTransform();
  }, { passive: false });

  function zoom(factor) {
    var rect = svg.getBoundingClientRect();
    var mx = rect.width / 2, my = rect.height / 2;
    var next = Math.min(3, Math.max(0.5, scale * factor));
    var k = next / scale;
    tx = mx - (mx - tx) * k;
    ty = my - (my - ty) * k;
    scale = next;
    applyTransform();
  }

  function resetView() {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
    clearDim();
  }

  function clearDim() {
    Array.prototype.forEach.call(g.querySelectorAll('.mm-dim'), function (n) { n.classList.remove('mm-dim'); });
    Array.prototype.forEach.call(g.querySelectorAll('path.mm-link'), function (l) {
      l.style.opacity = l.getAttribute('data-base') || '';
    });
  }

  var btnIn = $('#mmIn'), btnOut = $('#mmOut'), btnReset = $('#mmReset');
  if (btnIn) btnIn.addEventListener('click', function () { zoom(1.2); });
  if (btnOut) btnOut.addEventListener('click', function () { zoom(1 / 1.2); });
  if (btnReset) btnReset.addEventListener('click', resetView);

  /* ---------------- search ---------------- */
  function applySearch(raw) {
    var q = (raw || '').trim().toLowerCase();
    Array.prototype.forEach.call(g.querySelectorAll('.mm-node'), function (n) {
      if (n.classList.contains('mm-root')) return;
      var txt = label(n._node).toLowerCase();
      var hit = !q || txt.indexOf(q) !== -1 ||
        (n._type === 'leaf' && label(n._branch).toLowerCase().indexOf(q) !== -1);
      n.classList.toggle('mm-dim', !hit);
    });
    Array.prototype.forEach.call(g.querySelectorAll('path.mm-link'), function (l) {
      l.style.opacity = q ? '.08' : (l.getAttribute('data-base') || '');
    });
    var clear = $('#mmClear');
    if (clear) clear.hidden = !q;
  }

  var searchEl = $('#mmSearch');
  if (searchEl) {
    searchEl.addEventListener('input', function () { applySearch(searchEl.value); });
    searchEl.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { searchEl.value = ''; applySearch(''); searchEl.blur(); }
    });
  }
  var clearEl = $('#mmClear');
  if (clearEl) {
    clearEl.addEventListener('click', function () {
      if (!searchEl) return;
      searchEl.value = ''; applySearch(''); searchEl.focus();
    });
  }

  /* ---------------- helpers ---------------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  /* ---------------- boot ---------------- */
  // remember base link opacity for restore
  render();
  Array.prototype.forEach.call(g.querySelectorAll('path.mm-link'), function (l) {
    l.setAttribute('data-base', l.style.opacity || '.22');
  });
  applyTransform();

  // re-render labels on language switch
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.lang-btn')) {
      window.setTimeout(function () {
        render();
        Array.prototype.forEach.call(g.querySelectorAll('path.mm-link'), function (l) {
          l.setAttribute('data-base', l.style.opacity || '.22');
        });
        applyTransform();
      }, 40);
    }
  });
})();
