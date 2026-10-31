/* ==========================================================================
   ProBizIntel — MBA / PM section tools
   NPV · IRR · payback · PI, loan amortisation, depreciation. Vanilla JS.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };

  var L = {
    en: {
      npv: 'NPV', irr: 'IRR', payback: 'Payback', dpayback: 'Disc. payback',
      pi: 'Profitability index', years: 'yrs', none: 'n/a', units: 'currency units',
      pvIn: 'PV of inflows', verdict: 'Verdict',
      accept: 'Accept — value created', reject: 'Reject — value destroyed',
      irrNote: 'IRR is solved numerically (bisection). If cash flows change sign more than once, IRR can be ambiguous — read the NPV curve instead.',
      noIrr: 'No real IRR in the range −99% to 1000%.',
      payment: 'Level payment', totalPaid: 'Total paid', totalInt: 'Total interest',
      monthly: 'per month', year: 'Year', interest: 'Interest', principal: 'Principal',
      balance: 'Balance', paid: 'Paid', opening: 'Opening',
      sl: 'Straight line', dbb: 'Double declining balance', soyd: 'Sum of years’ digits',
      annualDep: 'Annual charge', bookEnd: 'Closing book value', depTotal: 'Total depreciation',
      method: 'Method', perYear: 'per year (constant)'
    },
    vi: {
      npv: 'NPV', irr: 'IRR', payback: 'Hoàn vốn', dpayback: 'Hoàn vốn có chiết khấu',
      pi: 'Chỉ số sinh lời', years: 'năm', none: 'không có', units: 'đơn vị tiền tệ',
      pvIn: 'PV dòng tiền vào', verdict: 'Kết luận',
      accept: 'Chấp nhận — tạo ra giá trị', reject: 'Từ chối — phá hủy giá trị',
      irrNote: 'IRR được giải bằng phương pháp số (chia đôi). Nếu dòng tiền đổi dấu nhiều lần, IRR có thể không xác định — hãy đọc đường NPV.',
      noIrr: 'Không có IRR thực trong khoảng −99% đến 1000%.',
      payment: 'Trả góp đều', totalPaid: 'Tổng đã trả', totalInt: 'Tổng lãi',
      monthly: 'mỗi tháng', year: 'Năm', interest: 'Lãi', principal: 'Gốc',
      balance: 'Dư nợ', paid: 'Đã trả', opening: 'Dư đầu kỳ',
      sl: 'Đường thẳng', dbb: 'Số dư giảm dần kép', soyd: 'Tổng số năm',
      annualDep: 'Chi phí mỗi năm', bookEnd: 'Giá trị còn lại', depTotal: 'Tổng khấu hao',
      method: 'Phương pháp', perYear: 'mỗi năm (không đổi)'
    }
  };

  function lang() { return document.documentElement.lang === 'vi' ? 'vi' : 'en'; }
  function t(k) { return L[lang()][k]; }

  function money(n) {
    if (!isFinite(n)) return '—';
    var abs = Math.abs(n);
    var digits = abs >= 1000 ? 0 : 2;
    return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }
  function pct(n) { return (n * 100).toFixed(2) + '%'; }

  function num(el, fallback) {
    var v = parseFloat(String(el.value).replace(/[^0-9.\-]/g, ''));
    return isFinite(v) ? v : fallback;
  }

  /* ---------------- NPV / IRR ---------------- */
  function npvAt(rate, flows) {
    var s = 0;
    for (var i = 0; i < flows.length; i++) s += flows[i] / Math.pow(1 + rate, i);
    return s;
  }

  function solveIRR(flows) {
    var lo = -0.99, hi = 10, fLo = npvAt(lo, flows), fHi = npvAt(hi, flows);
    if (!isFinite(fLo) || !isFinite(fHi) || fLo * fHi > 0) return null;
    for (var i = 0; i < 200; i++) {
      var mid = (lo + hi) / 2, fMid = npvAt(mid, flows);
      if (Math.abs(fMid) < 1e-7) return mid;
      if (fLo * fMid <= 0) { hi = mid; fHi = fMid; } else { lo = mid; fLo = fMid; }
    }
    return (lo + hi) / 2;
  }

  function runNPV() {
    var out = $('#npvOut');
    if (!out) return;
    var c0 = num($('#npvC0'), -1000000);
    var rate = num($('#npvRate'), 10) / 100;

    var raw = $('#npvCF').value.split(/[,;\s]+/).filter(function (x) { return x !== ''; });
    var inflows = raw.map(function (x) { return parseFloat(String(x).replace(/[^0-9.\-]/g, '')) || 0; });

    var flows = [c0].concat(inflows);
    var npv = npvAt(rate, flows);
    var irr = solveIRR(flows);

    var pvIn = 0;
    for (var i = 0; i < inflows.length; i++) pvIn += inflows[i] / Math.pow(1 + rate, i + 1);

    // simple payback
    var cum = 0, pb = null, prev = 0;
    for (var j = 0; j < inflows.length; j++) {
      prev = cum; cum += inflows[j];
      if (cum >= Math.abs(c0) && inflows[j] > 0) { pb = j + (Math.abs(c0) - prev) / inflows[j]; break; }
    }
    // discounted payback
    var dcum = 0, dpb = null, dprev = 0;
    for (var k = 0; k < inflows.length; k++) {
      var d = inflows[k] / Math.pow(1 + rate, k + 1);
      dprev = dcum; dcum += d;
      if (dcum >= Math.abs(c0) && d > 0) { dpb = k + (Math.abs(c0) - dprev) / d; break; }
    }
    var pi = Math.abs(c0) > 0 ? pvIn / Math.abs(c0) : 0;
    var accept = npv > 0;

    var html = '' +
      '<div class="res-grid">' +
        cell(t('npv'), money(npv), accept ? 'is-pos' : 'is-neg') +
        cell(t('irr'), irr === null ? t('none') : pct(irr), irr !== null && irr > rate ? 'is-pos' : 'is-neg') +
        cell(t('payback'), pb === null ? t('none') : pb.toFixed(2) + ' ' + t('years'), '') +
        cell(t('dpayback'), dpb === null ? t('none') : dpb.toFixed(2) + ' ' + t('years'), '') +
        cell(t('pi'), pi.toFixed(2), pi > 1 ? 'is-pos' : 'is-neg') +
        cell(t('pvIn'), money(pvIn), '') +
      '</div>' +
      '<p class="res-note"><strong>' + t('verdict') + ':</strong> ' +
        (accept ? t('accept') : t('reject')) +
        ' &nbsp;·&nbsp; NPV = ' + money(npv) + ' ' + t('units') +
        (irr === null ? ' &nbsp;·&nbsp; ' + t('noIrr') : '') +
        '</p>' +
      '<p class="res-note">' + t('irrNote') + '</p>';

    out.innerHTML = html;
  }

  function cell(k, v, cls) {
    return '<div class="res ' + (cls || '') + '"><span class="res-k">' + k + '</span>' +
           '<span class="res-v">' + v + '</span></div>';
  }

  /* ---------------- loan ---------------- */
  function runLoan() {
    var out = $('#lnOut');
    if (!out) return;
    var P = Math.max(0, num($('#lnAmt'), 5000000));
    var annual = num($('#lnRate'), 9) / 100;
    var years = Math.max(1, Math.min(40, Math.round(num($('#lnYears'), 7))));
    var r = annual / 12, n = years * 12;

    var pay = r === 0 ? P / n : P * r / (1 - Math.pow(1 + r, -n));
    var balance = P, rows = '', totalInt = 0;

    for (var y = 1; y <= years; y++) {
      var open = balance, yInt = 0, yPrin = 0;
      for (var m = 0; m < 12; m++) {
        var interest = balance * r;
        var principal = pay - interest;
        if (principal > balance) principal = balance;
        yInt += interest; yPrin += principal;
        balance -= principal;
      }
      totalInt += yInt;
      rows += '<tr><td>' + y + '</td><td>' + money(open) + '</td><td>' + money(yInt) +
              '</td><td>' + money(yPrin) + '</td><td>' + money(Math.max(0, balance)) + '</td></tr>';
    }

    out.innerHTML =
      '<div class="res-grid">' +
        cell(t('payment'), money(pay), '') +
        cell(t('totalPaid'), money(pay * n), '') +
        cell(t('totalInt'), money(totalInt), 'is-neg') +
      '</div>' +
      '<p class="res-note">' + money(pay) + ' ' + t('monthly') + ' · ' + n + ' × ' + t('monthly') + '</p>' +
      '<div class="table-scroll"><table class="mini-table">' +
        '<thead><tr><th>' + t('year') + '</th><th>' + t('opening') + '</th><th>' + t('interest') +
        '</th><th>' + t('principal') + '</th><th>' + t('balance') + '</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table></div>';
  }

  /* ---------------- depreciation ---------------- */
  function runDep() {
    var out = $('#dpOut');
    if (!out) return;
    var cost = Math.max(0, num($('#dpCost'), 1200000));
    var salvage = Math.max(0, num($('#dpSalv'), 120000));
    var life = Math.max(2, Math.min(40, Math.round(num($('#dpLife'), 8))));
    var method = $('#dpMethod').value;

    if (salvage > cost) salvage = cost;
    var base = cost - salvage;
    var rows = '', book = cost, acc = 0, labels = { sl: t('sl'), dbb: t('dbb'), soyd: t('soyd') };

    if (method === 'sl') {
      var annual = base / life;
      for (var i = 1; i <= life; i++) {
        var dep = i === life ? cost - salvage - acc : annual;
        acc += dep; book = cost - acc;
        rows += row(i, dep, acc, book);
      }
    } else if (method === 'soyd') {
      var sum = life * (life + 1) / 2;
      for (var j = 1; j <= life; j++) {
        var frac = (life - j + 1) / sum;
        var dj = base * frac;
        if (j === life) dj = cost - salvage - acc;
        acc += dj; book = cost - acc;
        rows += row(j, dj, acc, book);
      }
    } else {
      var rate = 2 / life;
      for (var k = 1; k <= life; k++) {
        var remaining = life - k + 1;
        var dbb = book * rate;
        var slAlt = (book - salvage) / remaining;
        var dk = Math.max(slAlt, dbb);
        if (dk > book - salvage) dk = book - salvage;
        if (dk < 0) dk = 0;
        if (k === life) dk = book - salvage;
        acc += dk; book = cost - acc;
        rows += row(k, dk, acc, book);
      }
    }

    var firstYear = method === 'sl' ? base / life : null;

    out.innerHTML =
      '<div class="res-grid">' +
        cell(t('method'), labels[method], '') +
        cell(t('annualDep'), method === 'sl' ? money(firstYear) : '—', '') +
        cell(t('depTotal'), money(cost - salvage), '') +
        cell(t('bookEnd'), money(salvage), '') +
      '</div>' +
      '<div class="table-scroll"><table class="mini-table">' +
        '<thead><tr><th>' + t('year') + '</th><th>' + t('annualDep') + '</th>' +
        '<th>' + t('depTotal') + '</th><th>' + t('bookEnd') + '</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table></div>';

    function row(y, dep, accumulated, bookValue) {
      return '<tr><td>' + y + '</td><td>' + money(dep) + '</td><td>' + money(accumulated) +
             '</td><td>' + money(bookValue) + '</td></tr>';
    }
  }

  /* ---------------- wiring ---------------- */
  function runAll() { runNPV(); runLoan(); runDep(); }

  var pairs = [['#npvRun', runNPV], ['#lnRun', runLoan], ['#dpRun', runDep]];
  pairs.forEach(function (p) {
    var btn = $(p[0]);
    if (btn) btn.addEventListener('click', p[1]);
  });

  ['#npvC0', '#npvCF', '#npvRate', '#lnAmt', '#lnRate', '#lnYears', '#dpCost', '#dpSalv', '#dpLife'].forEach(function (sel) {
    var el = $(sel);
    if (!el) return;
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter') runAll(); });
  });

  var method = $('#dpMethod');
  if (method) method.addEventListener('change', runDep);

  runAll();

  // re-render labels when the language switches
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.lang-btn')) {
      window.setTimeout(runAll, 30);
    }
  });
})();
