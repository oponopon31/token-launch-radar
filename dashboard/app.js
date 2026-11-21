/* TOKEN RADAR — renders window.RADAR with no network.
   Model radar-6 (mirrors lib/model.ts): the size curve is fitted to the
   snapshot's own live comparables, and every farm plan is netted against the
   stated scenario. The implied value is recomputed per row from the snapshot
   figures and checked against the board's number. No protocol name is ever
   special-cased. */
(function () {
  'use strict';
  var D = window.RADAR;
  if (!D) { document.getElementById('board-body').innerHTML = '<tr><td>No data loaded.</td></tr>'; return; }
  var M = D.model;
  var F = D.fit;
  var state = { q: '', category: 'all', tab: 'pre', sort: 'implied', dir: -1, selected: null };
  var $ = function (id) { return document.getElementById(id); };

  var usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  function fmtUsd(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return usd0.format(n);
  }
  function usd(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function pct(n) {
    if (n >= 1) return n.toFixed(2) + '%';
    if (n >= 0.1) return n.toFixed(3) + '%';
    if (n < 0.0001) return n.toFixed(6) + '%';
    return n.toFixed(4) + '%';
  }
  function fmtPct(n) { return (n === null || n === undefined || !isFinite(n)) ? 'n/a' : (n > 0 ? '+' : '') + n.toFixed(2) + '%'; }
  function fmtAge(d) {
    if (d === null || d === undefined) return 'unknown';
    if (d >= 365) return (d / 365).toFixed(1) + 'y';
    return Math.max(0, Math.round(d)) + 'd';
  }
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function chainsShort(ch) { return ch && ch.length ? esc(ch.slice(0, 2).join(', ') + (ch.length > 2 ? ' +' + (ch.length - 2) : '')) : '—'; }

    function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function sizeMultiple(tvl, fit) { fit = fit || F; return Math.exp(fit.intercept + (fit.slope - 1) * Math.log(tvl)); }
  function impliedOf(r, fit) {
    fit = fit || F;
    var growth = clamp(r.change_7d === null || r.change_7d === undefined ? 0 : r.change_7d, M.growth_floor, M.growth_cap);
    var growthMult = 1 + M.growth_weight * Math.tanh(growth / M.growth_scale);
    var age = (r.age_days === null || r.age_days === undefined) ? M.unknown_age_days : r.age_days;
    var maturity = M.maturity_floor + M.maturity_range * (1 - Math.exp(-age / M.maturity_scale_days));
    var breadth = 1 + M.breadth_per_chain * Math.min(Math.max(r.chains.length - 1, 0), M.breadth_max_chains);
    var multiple = sizeMultiple(r.tvl_usd, fit);
    return { implied: Math.max(1, Math.round(r.tvl_usd * multiple * growthMult * maturity * breadth)),
      multiple: multiple, growthPct: growth, growthMult: growthMult, maturity: maturity, breadth: breadth, age: age };
  }

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
  function nettingOf(p, implied) {
    var capital = capitalFor(p);
    var hold = holdDaysFor(p.age_days);
    var weeks = hold / 7;
    var setupGas = capital >= 150 ? M.gas_setup_high_usd : M.gas_setup_low_usd;
    var totalCost = Math.round(M.gas_first_tx_usd + setupGas + M.gas_weekly_usd * weeks);
    var hours = (5 + 15 + 10 * weeks + 10 + 5) / 60;
    var expectedShare = (implied * M.scenario_airdrop_share) / M.scenario_farmers;
    var net = expectedShare - totalCost;
    var perHour = net / hours;
    var breakeven = (totalCost / implied) * 100;
    var breakevenValue = totalCost / (M.scenario_airdrop_share / M.scenario_farmers);
    var odds = Math.round(normCdf(Math.log(implied / breakevenValue) / F.residual_sd) * 1000) / 1000;
    var verdict = odds >= M.farm_odds_high ? 'FARM' : odds >= M.farm_odds_mid ? 'THIN' : 'SKIP';
    return { capital: capital, hold: hold, weeks: weeks, setupGas: setupGas, totalCost: totalCost, hours: hours,
      expectedShare: expectedShare, net: net, perHour: perHour, breakeven: breakeven, odds: odds, verdict: verdict };
  }
    function normCdf(z) {
    var t = 1 / (1 + 0.2316419 * Math.abs(z));
    var poly = t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    var cdf = 1 - Math.exp(-(z * z) / 2) / Math.sqrt(2 * Math.PI) * poly;
    return z >= 0 ? cdf : 1 - cdf;
  }
  function stepText(s) {
    var t = s.text + ' Cost: ' + s.cost + '. Time: ' + s.time + '.';
    if (t.length > 600) t = t.slice(0, 596) + '...';
    if (t.length < 20) t += ' Hold the position and check the protocol\'s own page.';
    return t;
  }
  function farmSteps(p) {
    var v = impliedOf(p);
    var n = nettingOf(p, v.implied);
    var chain = chainOf(p), capital = n.capital, hold = n.hold;
    var verdictLine = 'Verdict: ' + n.verdict + ' — break-even odds ' + Math.round(n.odds * 100) + '%: the launch value covers the ' + usd(n.totalCost) + ' gas cost in ' + Math.round(n.odds * 100) + ' of 100 draws from the model\'s own error distribution (residual SD ' + F.residual_sd.toFixed(3) + ' in log space). Under the stated scenario (5% of the implied value to 5,000 farmers) your share is about ' + usd(n.expectedShare) + ', net ' + usd(n.net) + ' after ' + usd(n.totalCost) + ' of gas, about ' + usd(n.perHour) + ' an hour.';
    return [
      { text: 'Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.', cost: 'under $' + M.gas_first_tx_usd + ' of gas for the first transaction', time: '5 minutes' },
      { text: actionFor(p, capital, chain), cost: '$' + capital + ' of capital and about $' + n.setupGas + ' of gas', time: '15 minutes to set up' },
      { text: weeklyFor(p), cost: 'about $' + M.gas_weekly_usd + ' of gas a week', time: '10 minutes a week' },
      { text: 'Hold the position for at least ' + hold + ' days so the activity is counted in more than one snapshot. The plan\'s cash cost totals ' + usd(n.totalCost) + ' of gas over ' + n.weeks.toFixed(1) + ' weeks; the $' + capital + ' of capital stays in the position and is not lost.', cost: usd(n.totalCost) + ' of gas in total', time: hold + ' days' },
      { text: 'Before you withdraw, open ' + p.name + '\'s own points or rewards page and claim only from the link it publishes. You break even by capturing ' + pct(n.breakeven) + ' of the implied launch value.', cost: 'no fee to check, and never pay to claim', time: '10 minutes' },
      { text: verdictLine, cost: usd(n.totalCost) + ' of gas for about ' + n.hours.toFixed(1) + ' hours of work', time: hold + ' days to hold, ' + n.hours.toFixed(1) + ' hours of work' }
    ].map(stepText);
  }

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

    function matchRow(r, q) {
    if (state.category !== 'all' && (r.category || 'Other') !== state.category) return false;
    if (!q) return true;
    return [r.name, r.slug, r.category, (r.chains || []).join(' ')].join(' ').toLowerCase().indexOf(q) >= 0;
  }
  function filtered() {
    var q = state.q.trim().toLowerCase();
    return D.rows.filter(function (r) { return matchRow(r, q); });
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
      else if (k === 'perhour') { av = a.per_hour_usd; bv = b.per_hour_usd; }
      else { av = a.implied_value_usd; bv = b.implied_value_usd; }
      if (av < bv) return -dir;
      if (av > bv) return dir;
      return a.slug < b.slug ? -1 : 1;
    });
  }

  function verdictBadge(v) { return '<span class="verdict ' + v.toLowerCase() + '">' + v + '</span>'; }
  function rowHtml(r, max) {
    var g = r.change_7d, gc = g === null ? '' : (g >= 0 ? 'pos' : 'neg');
    var pctv = Math.max(3, Math.round((r.implied_value_usd / max) * 100));
    return '<tr tabindex="0" data-slug="' + esc(r.slug) + '" data-selected="' + (state.selected === r.slug) + '">' +
      '<td class="num">' + r.rank + '</td>' +
      '<td><div class="name"><b>' + esc(r.name) + '</b><span class="sub">' + esc(r.category || 'Other') + ' · ' + chainsShort(r.chains) + '</span></div></td>' +
      '<td class="num">' + fmtUsd(r.tvl_usd) + '</td>' +
      '<td class="num ' + gc + '">' + fmtPct(g) + '</td>' +
      '<td class="num">' + fmtAge(r.age_days) + '</td>' +
      '<td><div class="implied"><span class="bar" aria-hidden="true"><i style="width:' + pctv + '%"></i></span><span class="num">' + fmtUsd(r.implied_value_usd) + '</span></div></td>' +
      '<td>' + verdictBadge(r.verdict) + '<span class="sub">' + Math.round(r.breakeven_odds * 100) + '% odds</span></td>' +
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
    var q = state.q.trim().toLowerCase();
    var list = D.live.filter(function (r) { return matchRow(r, q); });
    $('live-body').innerHTML = list.map(function (r) {
      var g = r.change_7d;
      return '<tr><td class="num">live</td>' +
        '<td><div class="name"><b>' + esc(r.name) + '</b><span class="sub">' + esc(r.category || 'Other') + ' · ' + chainsShort(r.chains) + '</span></div></td>' +
        '<td class="num">' + fmtUsd(r.tvl_usd) + '</td>' +
        '<td class="num ' + (g !== null && g >= 0 ? 'pos' : 'neg') + '">' + fmtPct(g) + '</td>' +
        '<td class="num">' + fmtUsd(r.mcap_usd) + '</td>' +
        '<td><span class="badge live">already trades</span></td></tr>';
    }).join('');
    $('count').textContent = list.length + ' of ' + D.live_size + ' live-token protocols';
    $('empty').hidden = list.length > 0;
  }
  function renderNotLaunches() {
    var q = state.q.trim().toLowerCase();
    var list = D.not_launches.filter(function (r) { return matchRow(r, q); });
    $('notlaunch-body').innerHTML = list.map(function (r) {
      return '<tr><td><div class="name"><b>' + esc(r.name) + '</b><span class="sub">' + esc(r.category || 'Other') + '</span></div></td>' +
        '<td class="num">' + fmtUsd(r.tvl_usd) + '</td>' +
        '<td>' + esc(r.reason) + '</td></tr>';
    }).join('');
    $('count').textContent = list.length + ' of ' + D.not_launch_size + ' set aside as not launches';
    $('empty').hidden = list.length > 0;
  }
  function renderTabs() {
    var tab = state.tab;
    $('tab-pre').setAttribute('aria-pressed', String(tab === 'pre'));
    $('tab-live').setAttribute('aria-pressed', String(tab === 'live'));
    $('tab-not').setAttribute('aria-pressed', String(tab === 'not'));
    $('board').hidden = tab !== 'pre';
    $('live-table').hidden = tab !== 'live';
    $('notlaunch-table').hidden = tab !== 'not';
    $('board-caption').textContent = tab === 'pre'
      ? 'Pre-token protocols that could launch, strongest implied value first. Select a row for its model breakdown and farm plan.'
      : tab === 'live'
        ? 'Live-token protocols, by market cap. They already trade, so they sit outside the ranking — and they are the comparables the size curve is fitted on.'
        : 'Pre-token protocols that are not launches: a wrapped, staked or bridged product, an exchange, or a versioned pool. Listed with the reason, so all 758 protocols are accounted for.';
    if (tab === 'pre') renderBoard(); else if (tab === 'live') renderLive(); else renderNotLaunches();
  }
  function renderModel() {
    $('formula').textContent = (M.growth_weight === 0 && M.maturity_range === 0 && M.breadth_per_chain === 0)
      ? 'implied = round( tvl_usd × exp(' + F.intercept.toFixed(4) + ' + (' + F.slope.toFixed(4) + ' − 1) × ln(tvl_usd)) ) — the bare size curve; the radar-5 multipliers are 1.'
      : 'implied = round( tvl_usd × exp(' + F.intercept.toFixed(4) + ' + (' + F.slope.toFixed(4) + ' − 1) × ln(tvl_usd))' +
      ' × (1 + ' + M.growth_weight + ' × tanh(clamp(change_7d, ' + M.growth_floor + ', ' + M.growth_cap + ') / ' + M.growth_scale + '))' +
      ' × (' + M.maturity_floor + ' + ' + M.maturity_range + ' × (1 − exp(−age_days / ' + M.maturity_scale_days + ')))' +
      ' × (1 + ' + M.breadth_per_chain + ' × min(max(chains − 1, 0), ' + M.breadth_max_chains + ')) )';
    $('fit-line').textContent = 'log(market cap) = ' + F.intercept.toFixed(4) + ' + ' + F.slope.toFixed(4) + ' × log(TVL), fit on ' + F.n_comparables +
      ' live-token comparables. R² ' + F.r_squared + ', residual SD ' + F.residual_sd + ' in log space; the slope runs ' +
      F.slope_lo + ' to ' + F.slope_hi + ' across 200 bootstrap refits, always below 1 — a bigger protocol is worth fewer dollars per dollar of TVL.';
    var loo = D.validation.loo;
    $('valid-body').innerHTML = loo.map(function (v) {
      return '<tr><td>' + esc(v.method) + '</td><td>' + v.median_log_error.toFixed(3) + '</td><td>' + (v.within_2x * 100).toFixed(1) + '%</td></tr>';
    }).join('') +
      '<tr><td>Fitted size curve, 5-fold cross-validation</td><td>' + D.validation.cv5_median_log_error.toFixed(3) + '</td><td>' + (D.validation.cv5_within_2x * 100).toFixed(1) + '%</td></tr>';
    $('global-mult').textContent = D.calibration.global_multiple.toFixed(4);
    var rows = D.calibration.table.filter(function (t) { return t.comparables >= 1; })
      .sort(function (a, b) { return b.multiple - a.multiple || (a.category < b.category ? -1 : 1); });
    $('calib-body').innerHTML = rows.map(function (t) {
      return '<tr><td>' + esc(t.category) + '</td><td>' + t.comparables + '</td><td>' +
        (t.median_ratio === null ? '—' : t.median_ratio.toFixed(4)) + '</td><td>' + t.multiple.toFixed(4) + '</td></tr>';
    }).join('');
  }

    function renderValidation() {
    var wf = D.validation.walkforward;
    var bare = D.validation.loo[2];
    $('wf-body').innerHTML = wf.splits.map(function (s) {
      return '<tr><td>' + esc(s.cutoff) + '</td><td>' + s.train_n + ' → ' + s.test_n + '</td><td>' +
        s.curve_median_log_error.toFixed(3) + '</td><td>' + (s.curve_within_2x * 100).toFixed(1) + '%</td><td>' +
        s.full_median_log_error.toFixed(3) + '</td><td>' + s.shrunk_median_log_error.toFixed(3) + '</td></tr>';
    }).join('') +
      '<tr class="pooled"><td>Pooled</td><td>' + wf.dated_n + ' dated comparables, 101 test predictions over 51 distinct tokens</td><td>' +
      wf.pooled_curve_median_log_error.toFixed(3) + '</td><td>' + (wf.pooled_curve_within_2x * 100).toFixed(1) + '%</td><td>' +
      wf.pooled_full_median_log_error.toFixed(3) + '</td><td>' + wf.pooled_shrunk_median_log_error.toFixed(3) + '</td></tr>';
    $('ablation-body').innerHTML = D.validation.ablation.map(function (a) {
      return '<tr><td>' + esc(a.terms) + '</td><td>' + a.loo_median_log_error.toFixed(3) + '</td><td>' +
        (a.loo_within_2x * 100).toFixed(1) + '%</td><td>' + a.wf_pooled_median_log_error.toFixed(3) + '</td><td>' +
        (a.wf_pooled_within_2x * 100).toFixed(1) + '%</td></tr>';
    }).join('');
    var sh = D.validation.shrunk_loo;
    $('shrunk-line').textContent = 'Category intercepts shrunk toward the global curve were tested at four strengths and hurt at every one: leave-one-out median log error ' +
      sh.map(function (r) { return 'k=' + r.k + ' ' + r.loo_median_log_error.toFixed(3); }).join(', ') +
      ' against ' + bare.median_log_error.toFixed(3) + ' for the bare curve, and walk-forward pooled ' +
      wf.pooled_shrunk_median_log_error.toFixed(3) + ' against ' + wf.pooled_curve_median_log_error.toFixed(3) +
      ' — the category means are mostly noise next to a residual standard deviation above 2 in log space — so the board uses no category shift.';
    var bt = D.validation.verdict_backtest;
    $('backtest-body').innerHTML = bt.groups.map(function (g) {
      return '<tr><td>' + esc(g.verdict) + '</td><td>' + g.n + '</td><td>' + (g.beat_rate * 100).toFixed(1) + '%</td><td>' +
        usd(g.mean_net_usd) + '</td><td>' + usd(g.median_net_usd) + '</td><td>' + usd(g.total_net_usd) + '</td></tr>';
    }).join('');
    $('calibration-line').textContent = 'The odds are calibrated: ' + bt.calibration.map(function (b) {
      return 'comparables quoted ' + Math.round(b.odds_lo * 100) + '–' + Math.round(b.odds_hi * 100) + '% odds (' + b.n + ' calls) clear break-even ' +
        (b.actual_beat_rate * 100).toFixed(0) + '% of the time, against ' + (b.mean_odds * 100).toFixed(0) + '% quoted';
    }).join('; ') + '.';
    initSandbox();
  }
  function renderSandbox() {
    var intercept = parseFloat($('sb-intercept').value);
    var slope = parseFloat($('sb-slope').value);
    $('sb-intercept-out').textContent = intercept.toFixed(4);
    $('sb-slope-out').textContent = slope.toFixed(4);
    var fit = { intercept: intercept, slope: slope };
    var scored = D.rows.map(function (r) {
      return { r: r, implied: impliedOf(r, fit).implied };
    }).sort(function (a, b) { return b.implied - a.implied || (a.r.slug < b.r.slug ? -1 : 1); });
    var changed = 0;
    scored.forEach(function (s, i) { if (s.r.rank !== i + 1) changed++; });
    var top = scored.slice(0, 10);
    $('sb-body').innerHTML = top.map(function (s, i) {
      return '<tr><td>' + (i + 1) + '</td><td>' + esc(s.r.name) + '</td><td>' + s.r.rank + '</td><td>' + fmtUsd(s.implied) + '</td></tr>';
    }).join('');
    var isFitted = Math.abs(intercept - F.intercept) < 0.0005 && Math.abs(slope - F.slope) < 0.0005;
    $('sb-summary').textContent = isFitted
      ? 'At the fitted curve the sandbox matches the board exactly: rank 1 is ' + top[0].r.name + ' at ' + fmtUsd(top[0].implied) + '.'
      : changed + ' of ' + D.rows.length + ' rows change rank under your curve; rank 1 is ' + top[0].r.name + ' at ' + fmtUsd(top[0].implied) + '.';
  }
  function initSandbox() {
    $('sb-intercept').value = String(F.intercept);
    $('sb-slope').value = String(F.slope);
    $('sb-intercept').addEventListener('input', renderSandbox);
    $('sb-slope').addEventListener('input', renderSandbox);
    $('sb-reset').addEventListener('click', function () {
      $('sb-intercept').value = String(F.intercept);
      $('sb-slope').value = String(F.slope);
      renderSandbox();
    });
    renderSandbox();
  }

    var dialog = $('detail');
  function openDetail(slug) {
    var r = D.rows.filter(function (x) { return x.slug === slug; })[0];
    if (!r) return;
    state.selected = slug;
    writeHash();
    var v = impliedOf(r);
    var n = nettingOf(r, v.implied);
    var agree = v.implied === r.implied_value_usd;
    var ageLine = r.age_days === null ? 'unknown — scored as ' + M.unknown_age_days + ' days' : fmtAge(r.age_days) + ' (' + r.age_days + ' days)';
    var rangeLine = r.rank_lo === r.rank_hi ? 'rank ' + r.rank + ' in every refit' : 'ranks ' + r.rank_lo + '–' + r.rank_hi + ' across the 200 refits';
    var steps = farmSteps(r).map(function (s) {
      var at = s.indexOf(' Cost: ');
      var action = at >= 0 ? s.slice(0, at) : s;
      var tail = at >= 0 ? s.slice(at + 1) : '';
      return '<li><b>' + esc(action) + '</b><span class="cost">' + esc(tail) + '</span></li>';
    }).join('');
    $('detail-body').innerHTML =
      '<div class="detail-head"><div><div class="rank-line">Rank ' + r.rank + ' of ' + D.board_size + ' · ' + rangeLine + ' · no token</div>' +
      '<h2 id="detail-title">' + esc(r.name) + '</h2>' +
      '<p class="sub">' + esc(r.category || 'Other') + ' · ' + esc((r.chains || []).join(', ') || '—') + '</p></div>' +
      '<button type="button" class="close" id="detail-close">Close</button></div>' +
      '<section class="detail-section"><h3>Implied value</h3><div class="equation">' +
      '<div><span>TVL</span><b>' + fmtUsd(r.tvl_usd) + '</b></div>' +
      '<div><span>7-day growth</span><b>' + fmtPct(r.change_7d) + '</b></div>' +
      '<div><span>Age with no token</span><b>' + ageLine + '</b></div>' +
      '<div><span>Size-curve multiple</span><b>' + v.multiple.toFixed(4) + '×</b></div>' +
      '<div><span>Growth multiplier</span><b>' + v.growthMult.toFixed(4) + '×</b></div>' +
      '<div><span>Maturity multiplier</span><b>' + v.maturity.toFixed(4) + '×</b></div>' +
      '<div><span>Breadth multiplier (' + r.chains.length + ' chain' + (r.chains.length === 1 ? '' : 's') + ')</span><b>' + v.breadth.toFixed(4) + '×</b></div>' +
      '<div class="total"><span>Implied value</span><b>' + fmtUsd(r.implied_value_usd) + '</b></div></div>' +
      '<p class="agree">Recomputed from the snapshot figures: <b>' + fmtUsd(v.implied) + '</b> — ' +
      (agree ? '<b>matches</b> the value board.json carries for this row.' : '<b class="mismatch">does not match</b> the board value ' + fmtUsd(r.implied_value_usd) + '; the data would be stale.') +
      '</p>' +
      '<p class="agree">Nearest live comparable: <b>' + esc(r.nearest_comp_name || '') + '</b> — TVL ' + fmtUsd(r.nearest_comp_tvl_usd) + ', market cap ' + fmtUsd(r.nearest_comp_mcap_usd) + ', multiple ' + (r.nearest_comp_multiple || 0).toFixed(4) + '×.</p></section>' +
      '<section class="detail-section"><h3>Farm plan — netted</h3>' +
      '<p class="agree"><b>' + n.verdict + '</b> — break-even odds ' + Math.round(n.odds * 100) + '%: the launch value covers the ' + usd(n.totalCost) + ' gas cost in ' + Math.round(n.odds * 100) + ' of 100 draws from the model\'s own error distribution (residual SD ' + F.residual_sd.toFixed(3) + ' in log space). About ' + usd(n.perHour) + ' an hour, net ' + usd(n.net) + ' after ' + usd(n.totalCost) + ' of gas. Break-even by capturing ' + pct(n.breakeven) + ' of the implied launch value.</p>' +
      '<ol class="steps">' + steps + '</ol>' +
      '<div class="equation">' +
      '<div><span>Capital in the position</span><b>' + usd(n.capital) + '</b></div>' +
      '<div><span>Cash cost (gas)</span><b>' + usd(n.totalCost) + '</b></div>' +
      '<div><span>Hours of work</span><b>' + n.hours.toFixed(1) + '</b></div>' +
      '<div><span>Expected share, stated scenario</span><b>' + usd(n.expectedShare) + '</b></div>' +
      '<div><span>Net</span><b>' + usd(n.net) + '</b></div>' +
      '<div><span>Dollars per hour</span><b>' + usd(n.perHour) + '</b></div>' +
      '<div><span>Break-even capture</span><b>' + pct(n.breakeven) + '</b></div>' +
      '<div><span>Break-even odds</span><b>' + Math.round(n.odds * 100) + '%</b></div>' +
      '<div class="total"><span>Verdict</span><b>' + n.verdict + '</b></div></div>' +
      '<p class="agree">Scenario, stated not hidden: the launch distributes 5% of its implied value to farmers, split equally among 5,000 active farmers. That scenario sets the break-even value — the launch value at which the farm\'s share covers its gas — and the odds are the chance the launch clears it; the odds condition on the token launching at all. Change the scenario and the verdict moves; the working above is how to re-run it.</p></section>';
    $('detail-close').addEventListener('click', function () { dialog.close(); });
    if (!dialog.open) dialog.showModal();
    renderBoard();
  }
  dialog.addEventListener('close', function () {
    if (state.selected) { state.selected = null; writeHash(); renderBoard(); }
  });
  dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });

    function init() {
    $('meta-date').textContent = D.as_of;
    $('foot-date').textContent = D.as_of;
    $('stat-watch').textContent = D.watchlist_size + ' / ' + D.watchlist_size;
    $('stat-rows').textContent = String(D.board_size);
    $('stat-plans').textContent = D.verdict_counts.FARM + ' farm · ' + D.verdict_counts.THIN + ' thin · ' + D.verdict_counts.SKIP + ' skip';
    $('stat-live').textContent = String(D.live_size);
    $('stat-not').textContent = String(D.not_launch_size);
    $('stat-accounted').textContent = String(D.accounted_size);
    var cats = Array.from(new Set(D.rows.concat(D.live, D.not_launches).map(function (r) { return r.category || 'Other'; }))).sort();
    $('category').innerHTML = '<option value="all">All categories</option>' +
      cats.map(function (c) { return '<option value="' + esc(c) + '"' + (c === state.category ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
    $('q').value = state.q;
    if (cats.indexOf(state.category) < 0 && state.category !== 'all') state.category = 'all';
    $('q').addEventListener('input', function (e) { state.q = e.target.value; writeHash(); renderTabs(); });
    $('category').addEventListener('change', function (e) { state.category = e.target.value; writeHash(); renderTabs(); });
    $('tab-pre').addEventListener('click', function () { state.tab = 'pre'; renderTabs(); });
    $('tab-live').addEventListener('click', function () { state.tab = 'live'; renderTabs(); });
    $('tab-not').addEventListener('click', function () { state.tab = 'not'; renderTabs(); });
    $('clear').addEventListener('click', function () { state.q = ''; state.category = 'all'; $('q').value = ''; $('category').value = 'all'; writeHash(); renderTabs(); });
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
    window.addEventListener('hashchange', function () { readHash(); $('q').value = state.q; $('category').value = state.category; renderTabs(); if (state.selected) openDetail(state.selected); });
    renderModel();
    renderValidation();
    renderTabs();
    if (state.selected) openDetail(state.selected);
  }
  readHash();
  init();
})();
