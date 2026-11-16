/* TOKEN RADAR — renders window.RADAR with no network.
   Model radar-2 (mirrors lib/model.ts): implied value is recomputed per row
   from the snapshot figures and checked against the board's number. The farm
   plan is derived the same way, from category, chains, TVL and age — no
   protocol name is ever special-cased. */
(function () {
  'use strict';
  var D = window.RADAR;
  if (!D) { document.getElementById('board-body').innerHTML = '<tr><td>No data loaded.</td></tr>'; return; }
  var M = D.model;
  var state = { q: '', category: 'all', tab: 'pre', sort: 'implied', dir: -1, selected: null };
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- formatting ---------- */
  var usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  function fmtUsd(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return usd0.format(n);
  }
  function fmtPct(n) { return (n === null || n === undefined || !isFinite(n)) ? 'n/a' : (n > 0 ? '+' : '') + n.toFixed(2) + '%'; }
  function fmtAge(d) {
    if (d === null || d === undefined) return 'unknown';
    if (d >= 365) return (d / 365).toFixed(1) + 'y';
    return Math.max(0, Math.round(d)) + 'd';
  }
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function chainsShort(ch) { return ch && ch.length ? esc(ch.slice(0, 2).join(', ') + (ch.length > 2 ? ' +' + (ch.length - 2) : '')) : '—'; }

  /* ---------- model radar-2 ---------- */
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function multipleFor(cat) {
    if (cat === null || cat === undefined) return D.calibration.global_multiple;
    var t = D.calibration.table.filter(function (r) { return r.category === cat; })[0];
    return t ? t.multiple : D.calibration.global_multiple;
  }
  function impliedOf(r) {
    var growth = clamp(r.change_7d === null || r.change_7d === undefined ? 0 : r.change_7d, M.growth_floor, M.growth_cap);
    var growthMult = 1 + M.growth_weight * Math.tanh(growth / M.growth_scale);
    var age = (r.age_days === null || r.age_days === undefined) ? M.unknown_age_days : r.age_days;
    var maturity = M.maturity_floor + M.maturity_range * (1 - Math.exp(-age / M.maturity_scale_days));
    var breadth = 1 + M.breadth_per_chain * Math.min(Math.max(r.chains.length - 1, 0), M.breadth_max_chains);
    var multiple = multipleFor(r.category);
    return { implied: Math.max(1, Math.round(r.tvl_usd * multiple * growthMult * maturity * breadth)),
      multiple: multiple, growthPct: growth, growthMult: growthMult, maturity: maturity, breadth: breadth, age: age };
  }

  /* ---------- farm plan (mirrors lib/model.ts farmSteps) ---------- */
  function chainOf(p) { return p.chains && p.chains.length ? p.chains[0] : 'its main chain'; }
  function capitalFor(p) {
    if (p.tvl_usd >= 5e9) return 250;
    if (p.tvl_usd >= 1e9) return 150;
    if (p.tvl_usd >= 1e8) return 100;
    return 50;
  }
  function holdDaysFor(age) { if (age === null || age === undefined) return 30; if (age < 180) return 60; if (age < 365) return 45; return 30; }
  function actionFor(p, capital, chain) {
    var c = (p.category || '').toLowerCase(), n = p.name;
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) return 'Supply $' + capital + ' of USDC to ' + n + ' on ' + chain + ' and keep the position open.';
    if (c.indexOf('dex') >= 0 || c.indexOf('yield') >= 0 || c.indexOf('leveraged farm') >= 0) return 'Provide $' + capital + ' of liquidity to ' + n + '\'s main pool on ' + chain + ' and keep the position open.';
    if (c.indexOf('bridge') >= 0) return 'Bridge $' + capital + ' of USDC to ' + chain + ' through ' + n + ' and use the bridged funds in its app.';
    if (c.indexOf('staking') >= 0 || c.indexOf('restak') >= 0) return 'Stake $' + capital + ' of the chain\'s staking asset through ' + n + ' and keep the receipt.';
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0 || c.indexOf('options') >= 0) return 'Deposit $' + capital + ' of USDC as margin on ' + n + ' and open one small hedge.';
    if (c.indexOf('prediction') >= 0) return 'Fund $' + capital + ' and place one market position on ' + n + '.';
    if (c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0 || c.indexOf('risk') >= 0) return 'Deposit $' + capital + ' into a ' + n + ' vault on ' + chain + ' and keep the shares.';
    if (c.indexOf('stable') >= 0) return 'Mint or deposit $' + capital + ' of the stable asset through ' + n + ' on ' + chain + '.';
    if (c.indexOf('rwa') >= 0) return 'Mint $' + capital + ' of the protocol\'s yield-bearing asset on ' + chain + ' and hold it.';
    if (c.indexOf('insurance') >= 0) return 'Buy $' + capital + ' of cover from ' + n + ' on ' + chain + ' and keep the policy.';
    if (c.indexOf('launchpad') >= 0) return 'Commit $' + capital + ' to a ' + n + ' launch on ' + chain + ' and complete its tasks.';
    if (c.indexOf('payment') >= 0 || c.indexOf('card') >= 0) return 'Spend $' + capital + ' through ' + n + ' on ' + chain + ' and keep the receipts.';
    if (c.indexOf('nft') >= 0 || c.indexOf('marketplace') >= 0) return 'List or buy one item worth $' + capital + ' on ' + n + ' and keep the listing live.';
    if (c.indexOf('synthetic') >= 0 || c.indexOf('basis') >= 0) return 'Open a $' + capital + ' synthetic position on ' + n + ' and keep it collateralised.';
    return 'Deposit $' + capital + ' of USDC into ' + n + ' on ' + chain + ' and keep the position open.';
  }
  function weeklyFor(p) {
    var c = (p.category || '').toLowerCase();
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) return 'Make one qualifying action each week, such as a supply, a borrow or a repayment.';
    if (c.indexOf('dex') >= 0 || c.indexOf('yield') >= 0 || c.indexOf('leveraged farm') >= 0) return 'Make one qualifying action each week, such as a swap, a deposit or a claim of rewards.';
    if (c.indexOf('bridge') >= 0) return 'Make one qualifying action each week, such as a bridge, a swap or a vote.';
    if (c.indexOf('staking') >= 0 || c.indexOf('restak') >= 0) return 'Make one qualifying action each week, such as a stake, a restake or a claim of rewards.';
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0 || c.indexOf('options') >= 0) return 'Make one qualifying action each week, such as a trade, a deposit or a close.';
    if (c.indexOf('prediction') >= 0) return 'Make one qualifying action each week, such as a market position or a claim of winnings.';
    if (c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0 || c.indexOf('risk') >= 0) return 'Make one qualifying action each week, such as a deposit, a rebalance or a vote.';
    if (c.indexOf('rwa') >= 0) return 'Make one qualifying action each week, such as a mint, a transfer or a claim of yield.';
    return 'Make one qualifying action each week, such as a deposit, a borrow, a swap or a vote.';
  }
  function stepText(s) {
    var t = s.text + ' Cost: ' + s.cost + '. Time: ' + s.time + '.';
    if (t.length > 600) t = t.slice(0, 596) + '...';
    if (t.length < 20) t += ' Hold the position and check the protocol\'s own page.';
    return t;
  }
  function farmSteps(p) {
    var chain = chainOf(p), capital = capitalFor(p), hold = holdDaysFor(p.age_days);
    return [
      { text: 'Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.', cost: 'under $3 of gas for the first transaction', time: '5 minutes' },
      { text: actionFor(p, capital, chain), cost: '$' + capital + ' of capital and about $' + (capital >= 150 ? 8 : 4) + ' of gas', time: '15 minutes to set up' },
      { text: weeklyFor(p), cost: 'about $2 of gas a week', time: '10 minutes a week' },
      { text: 'Hold the position for at least ' + hold + ' days so the activity is counted in more than one snapshot.', cost: 'the $' + capital + ' stays in the position', time: hold + ' days' },
      { text: 'Before you withdraw, open ' + p.name + '\'s own points or rewards page and claim only from the link it publishes.', cost: 'no fee to check, and never pay to claim', time: '10 minutes' },
      { text: 'Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.', cost: 'nothing but the log', time: '5 minutes' }
    ].map(stepText);
  }

  /* ---------- hash deep links ---------- */
  function readHash() {
    var h = window.location.hash.replace(/^#/, '');
    if (!h) return;
    var p = new URLSearchParams(h);
    if (p.get('q')) state.q = p.get('q');
    if (p.get('category')) state.category = p.get('category');
    if (p.get('p')) state.selected = p.get('p');
  }
  function writeHash() {
    var p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.category !== 'all') p.set('category', state.category);
    if (state.selected) p.set('p', state.selected);
    var s = p.toString();
    window.history.replaceState(null, '', s ? '#' + s : window.location.pathname + window.location.search);
  }

  /* ---------- filtering / sorting ---------- */
  function filtered() {
    var q = state.q.trim().toLowerCase();
    return D.rows.filter(function (r) {
      if (state.category !== 'all' && (r.category || 'Other') !== state.category) return false;
      if (!q) return true;
      return [r.name, r.slug, r.category, (r.chains || []).join(' ')].join(' ').toLowerCase().indexOf(q) >= 0;
    });
  }
  function sorted(list) {
    var k = state.sort, dir = state.dir;
    return list.slice().sort(function (a, b) {
      var av, bv;
      if (k === 'rank') { av = a.rank; bv = b.rank; }
      else if (k === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
      else if (k === 'tvl') { av = a.tvl_usd; bv = b.tvl_usd; }
      else if (k === 'growth') { av = a.change_7d === null ? -Infinity : a.change_7d; bv = b.change_7d === null ? -Infinity : b.change_7d; }
      else if (k === 'age') { av = a.age_days === null ? Infinity : a.age_days; bv = b.age_days === null ? Infinity : b.age_days; }
      else { av = a.implied_value_usd; bv = b.implied_value_usd; }
      if (av < bv) return -dir;
      if (av > bv) return dir;
      return a.slug < b.slug ? -1 : 1;
    });
  }

  /* ---------- rendering ---------- */
  function rowHtml(r, max) {
    var g = r.change_7d, gc = g === null ? '' : (g >= 0 ? 'pos' : 'neg');
    var pct = Math.max(3, Math.round((r.implied_value_usd / max) * 100));
    return '<tr tabindex="0" data-slug="' + esc(r.slug) + '" data-selected="' + (state.selected === r.slug) + '">' +
      '<td class="num">' + r.rank + '</td>' +
      '<td><div class="name"><b>' + esc(r.name) + '</b><span class="sub">' + esc(r.category || 'Other') + ' · ' + chainsShort(r.chains) + '</span></div></td>' +
      '<td class="num">' + fmtUsd(r.tvl_usd) + '</td>' +
      '<td class="num ' + gc + '">' + fmtPct(g) + '</td>' +
      '<td class="num">' + fmtAge(r.age_days) + '</td>' +
      '<td><div class="implied"><span class="bar" aria-hidden="true"><i style="width:' + pct + '%"></i></span><span class="num">' + fmtUsd(r.implied_value_usd) + '</span></div></td>' +
      '<td><span class="badge">no token</span></td></tr>';
  }
  function renderBoard() {
    var list = sorted(filtered());
    var max = D.rows[0] ? D.rows[0].implied_value_usd : 1;
    $('board-body').innerHTML = list.map(function (r) { return rowHtml(r, max); }).join('');
    $('empty').hidden = list.length > 0;
    $('board').hidden = list.length === 0;
    $('count').textContent = list.length + ' of ' + D.board_size + ' rows';
    document.querySelectorAll('[data-arrow]').forEach(function (a) {
      a.textContent = a.getAttribute('data-arrow') === state.sort ? (state.dir < 0 ? ' ▼' : ' ▲') : '';
    });
  }
  function renderLive() {
    $('live-body').innerHTML = D.live.map(function (r) {
      var g = r.change_7d;
      return '<tr><td class="num">live</td>' +
        '<td><div class="name"><b>' + esc(r.name) + '</b><span class="sub">' + esc(r.category || 'Other') + ' · ' + chainsShort(r.chains) + '</span></div></td>' +
        '<td class="num">' + fmtUsd(r.tvl_usd) + '</td>' +
        '<td class="num ' + (g !== null && g >= 0 ? 'pos' : 'neg') + '">' + fmtPct(g) + '</td>' +
        '<td class="num">' + fmtUsd(r.mcap_usd) + '</td>' +
        '<td><span class="badge live">already trades</span></td></tr>';
    }).join('');
    $('count').textContent = D.live_size + ' live-token protocols';
    $('empty').hidden = true;
  }
  function renderTabs() {
    var pre = state.tab === 'pre';
    $('tab-pre').setAttribute('aria-pressed', String(pre));
    $('tab-live').setAttribute('aria-pressed', String(!pre));
    $('board').hidden = !pre;
    $('live-table').hidden = pre;
    $('board-caption').textContent = pre
      ? 'Pre-token protocols, strongest implied value first. Select a row for its model breakdown and farm plan.'
      : 'Live-token protocols, by market cap. They already trade, so they sit outside the ranking.';
    if (pre) renderBoard(); else renderLive();
  }
  function renderModel() {
    $('formula').textContent = 'implied = round( tvl_usd × ' + 'category_multiple' + ' × (1 + ' + M.growth_weight +
      ' × tanh(clamp(change_7d, ' + M.growth_floor + ', ' + M.growth_cap + ') / ' + M.growth_scale + '))' +
      ' × (' + M.maturity_floor + ' + ' + M.maturity_range + ' × (1 − exp(−age_days / ' + M.maturity_scale_days + ')))' +
      ' × (1 + ' + M.breadth_per_chain + ' × min(max(chains − 1, 0), ' + M.breadth_max_chains + ')) )';
    $('global-mult').textContent = D.calibration.global_multiple.toFixed(4);
    var rows = D.calibration.table.filter(function (t) { return t.comparables >= 1; })
      .sort(function (a, b) { return b.multiple - a.multiple || (a.category < b.category ? -1 : 1); });
    $('calib-body').innerHTML = rows.map(function (t) {
      return '<tr><td>' + esc(t.category) + '</td><td>' + t.comparables + '</td><td>' +
        (t.median_ratio === null ? '—' : t.median_ratio.toFixed(4)) + '</td><td>' + t.multiple.toFixed(4) + '</td></tr>';
    }).join('');
  }

  /* ---------- detail dialog ---------- */
  var dialog = $('detail');
  function openDetail(slug) {
    var r = D.rows.filter(function (x) { return x.slug === slug; })[0];
    if (!r) return;
    state.selected = slug;
    writeHash();
    var v = impliedOf(r);
    var agree = v.implied === r.implied_value_usd;
    var ageLine = r.age_days === null ? 'unknown — scored as ' + M.unknown_age_days + ' days' : fmtAge(r.age_days) + ' (' + r.age_days + ' days)';
    var steps = farmSteps(r).map(function (s) {
      var at = s.indexOf(' Cost: ');
      var action = at >= 0 ? s.slice(0, at) : s;
      var tail = at >= 0 ? s.slice(at + 1) : '';
      return '<li><b>' + esc(action) + '</b><span class="cost">' + esc(tail) + '</span></li>';
    }).join('');
    $('detail-body').innerHTML =
      '<div class="detail-head"><div><div class="rank-line">Rank ' + r.rank + ' of ' + D.board_size + ' · no token</div>' +
      '<h2 id="detail-title">' + esc(r.name) + '</h2>' +
      '<p class="sub">' + esc(r.category || 'Other') + ' · ' + esc((r.chains || []).join(', ') || '—') + '</p></div>' +
      '<button type="button" class="close" id="detail-close">Close</button></div>' +
      '<section class="detail-section"><h3>Implied value</h3><div class="equation">' +
      '<div><span>TVL</span><b>' + fmtUsd(r.tvl_usd) + '</b></div>' +
      '<div><span>7-day growth</span><b>' + fmtPct(r.change_7d) + '</b></div>' +
      '<div><span>Age with no token</span><b>' + ageLine + '</b></div>' +
      '<div><span>Category multiple (' + esc(r.category || 'Other') + ')</span><b>' + v.multiple.toFixed(4) + '×</b></div>' +
      '<div><span>Growth multiplier</span><b>' + v.growthMult.toFixed(4) + '×</b></div>' +
      '<div><span>Maturity multiplier</span><b>' + v.maturity.toFixed(4) + '×</b></div>' +
      '<div><span>Breadth multiplier (' + r.chains.length + ' chain' + (r.chains.length === 1 ? '' : 's') + ')</span><b>' + v.breadth.toFixed(4) + '×</b></div>' +
      '<div class="total"><span>Implied value</span><b>' + fmtUsd(r.implied_value_usd) + '</b></div></div>' +
      '<p class="agree">Recomputed from the snapshot figures: <b>' + fmtUsd(v.implied) + '</b> — ' +
      (agree ? '<b>matches</b> the value board.json carries for this row.' : '<b class="mismatch">does not match</b> the board value ' + fmtUsd(r.implied_value_usd) + '; the data would be stale.') +
      '</p></section>' +
      '<section class="detail-section"><h3>Farm plan — 6 steps</h3><ol class="steps">' + steps + '</ol></section>';
    $('detail-close').addEventListener('click', function () { dialog.close(); });
    if (!dialog.open) dialog.showModal();
    renderBoard();
  }
  dialog.addEventListener('close', function () {
    if (state.selected) { state.selected = null; writeHash(); renderBoard(); }
  });
  dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });

  /* ---------- wire up ---------- */
  function init() {
    $('meta-date').textContent = D.as_of;
    $('foot-date').textContent = D.as_of;
    $('stat-watch').textContent = D.watchlist_size + ' / ' + D.watchlist_size;
    $('stat-rows').textContent = String(D.board_size);
    $('stat-early').textContent = String(D.early_size);
    $('stat-live').textContent = String(D.live_size);
    var cats = Array.from(new Set(D.rows.map(function (r) { return r.category || 'Other'; }))).sort();
    $('category').innerHTML = '<option value="all">All categories</option>' +
      cats.map(function (c) { return '<option value="' + esc(c) + '"' + (c === state.category ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
    $('q').value = state.q;
    if (cats.indexOf(state.category) < 0 && state.category !== 'all') state.category = 'all';
    $('q').addEventListener('input', function (e) { state.q = e.target.value; writeHash(); renderBoard(); });
    $('category').addEventListener('change', function (e) { state.category = e.target.value; writeHash(); renderBoard(); });
    $('tab-pre').addEventListener('click', function () { state.tab = 'pre'; renderTabs(); });
    $('tab-live').addEventListener('click', function () { state.tab = 'live'; renderTabs(); });
    $('clear').addEventListener('click', function () { state.q = ''; state.category = 'all'; $('q').value = ''; $('category').value = 'all'; writeHash(); renderBoard(); });
    document.querySelectorAll('th button[data-sort]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-sort');
        if (state.sort === k) state.dir = -state.dir;
        else { state.sort = k; state.dir = (k === 'name' || k === 'rank') ? 1 : -1; }
        renderBoard();
      });
    });
    $('board-body').addEventListener('click', function (e) {
      var tr = e.target.closest('tr[data-slug]');
      if (tr) openDetail(tr.getAttribute('data-slug'));
    });
    $('board-body').addEventListener('keydown', function (e) {
      var tr = e.target.closest('tr[data-slug]');
      if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDetail(tr.getAttribute('data-slug')); }
    });
    window.addEventListener('hashchange', function () { readHash(); $('q').value = state.q; $('category').value = state.category; renderBoard(); if (state.selected) openDetail(state.selected); });
    renderModel();
    renderTabs();
    if (state.selected) openDetail(state.selected);
  }
  readHash();
  init();
})();
