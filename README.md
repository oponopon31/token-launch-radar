# token-launch-radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/oponopon31/token-launch-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/oponopon31/token-launch-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A token launch radar for make.fun's token-radar-01 bounty. It reads a sealed snapshot of every protocol DefiLlama tracks, finds the ones that record no token, and ranks them by what their launch would be worth — then shows a dashboard a reader can use: the board, a detail view for each protocol, and the steps to farm it. Built by an AI agent for make.fun's "Build the best token launch radar" bounty, $1,325 in USDC.

## The model (radar-6)

A fitted size curve, calibrated from the snapshot itself. The multiple is not
a hand-set number: it is log(market cap) = 6.9646 + 0.5223 × log(TVL), fit by
least squares on the 128 live-token protocols that record a market cap. A
bigger protocol is worth fewer dollars per dollar of TVL — the slope is
below 1, and it stays below 1 across 200 bootstrap refits (0.382–0.654). The
category medians are kept only as a cross-check table on the dashboard.

```
multiple   = exp(6.9646 + (0.5223 - 1) * ln(tvl_usd))
implied    = round(tvl_usd * multiple)
```

Radar-6 prices every row with the bare curve alone. Radar-5 added three
bounded priors (growth, maturity, breadth); radar-6 drops them, because the
bare curve beats the full radar-5 formula on every blind test — leave-one-out
1.224 against 1.326, 5-fold 1.266 against 1.296, pooled walk-forward 1.129
against 1.146. No protocol name is ever special-cased: the same function
scores every row. One consequence, stated plainly: implied value is now a
strictly increasing function of TVL alone, so the board's ranking is the TVL
ranking and every row holds the same rank across all 200 refits. The curve's
work is the dollar value and the verdict, not an ordering the blind test
could not justify.

The blind test, leave-one-out over the same 128 comparables (median |log
error| / share priced within 2×): flat global median 1.585 / 29.7%,
category-median multiple 1.625 / 20.3%, fitted size curve, bare — the radar-6
board formula — 1.224 / 32.0%. The full formulas the boards actually used —
each multiple plus the bounded priors — score 1.646 / 20.3% for radar-2 and
1.326 / 31.3% for radar-5, and 5-fold cross-validation of the curve gives
1.266 / 32.0%. Growth, maturity and breadth were bounded priors, not fitted
terms: the blind test finds no stable fitted effect in them — a fitted growth
coefficient comes out negative and flips sign across folds — so fitting them
would be fitting noise, and the dashboard says so. The priors cost
out-of-sample accuracy on every blind test (1.224 bare to 1.326 with them);
radar-6 drops them, and the table shows that cost instead of hiding it.

### What radar-4 adds: walk-forward validation, ablation, and a refit sandbox

The board is unchanged — radar-4 prices every row with the same curve and
priors, because every candidate change was tested and rejected (below). What
is new is the validation behind the board. **Walk-forward validation** fits
the curve on listings before a cutoff and tests it on listings after it, at
three cutoffs, over the 95 comparables with a listing date (the 33 without
one cannot be ordered in time and sit outside the splits). Median |log
error| / within 2× for the bare curve: 1.069 / 37.3% at 2024-01-01 (44 fit,
51 tested), 1.124 / 25.8% at 2025-01-01 (64 fit, 31 tested), 1.605 / 26.3%
at 2025-07-01 (76 fit, 19 tested); pooled over all 101 test predictions
1.129 / 31.7%, and 1.146 / 29.7% for the full formula. Read it honestly:
the test market cap is the snapshot-date market cap, so this tests whether
a curve fit on older listings predicts the *current* market cap of newer
listings, not a launch-day prediction.

**Term-by-term ablation** (LOO / walk-forward pooled): curve alone 1.224 /
1.129, +growth 1.328 / 1.102, +maturity 1.326 / 2.139, +breadth 1.280 /
1.248, all three fitted 1.320 / 1.710. Every fitted term hurts
leave-one-out, and their coefficients flip sign across the time splits
(growth −1.39 → −0.71 → +0.01 on the three training sets, −2.37 on all 128;
maturity +2.14 → +6.04 → +1.24, −0.60 on all 128) — fitting them would be
fitting noise, so none is adopted. **Shrunk category shifts** (category
intercepts shrunk toward the global curve, n/(n+k)) were also tested and
rejected: LOO 1.337 (k=5) / 1.332 (k=10) / 1.292 (k=20) / 1.271 (k=50)
against 1.224 bare, and walk-forward pooled 1.169 against 1.129. The
dashboard shows all of this, plus a **live refit sandbox**: intercept and
slope sliders re-price the board in-page (bare curve — it moves values, not
ranks, since the ranking follows TVL), with a reset to the fitted curve.

### What radar-5 adds: the verdict is break-even odds, not dollars per hour

The curve, the priors and the farm-plan steps are unchanged — radar-5
re-prices nothing. What changes is the verdict. Radar-4 called a plan FARM
at $50 an hour under the stated scenario, which farmed 71 of 198 rows:
the cash cost is only $16–$24 of gas, so almost any point-estimate share
covers it, and the break-even capture it quoted (0.000019% of implied
value) was vacuously satisfied. Radar-5 asks the harder question: under
the model's own uncertainty, how likely is the farm to pay for itself?
The break-even value is the launch value at which the farmer's share
exactly covers the plan's gas cost — cash cost divided by the farmer's
share of the launch (5% split among 5,000 farmers, so the break-even
value is the cash cost × 100,000). Log launch value is normal around the
point estimate with the size curve's residual standard deviation, 2.077
in log space, so the break-even odds are Φ(ln(implied / break-even
value) / 2.077). FARM at odds of 90% or better, THIN at 75% or better,
SKIP below that — in plain terms, FARM means the launch covers the gas
in at least 9 of 10 draws from the model's own error distribution. The
board now splits FARM 19, THIN 77, SKIP 102. Two honest limits: the odds
condition on the token launching at all, and they inherit the same wide
error bars as every implied value. The plan still prints the expected
share, the net and the dollars per hour under the stated scenario, so the
reader sees both the point estimate and the odds.

A drift check run 2026-11-19, five days after the snapshot: the radar-3
fit predicts the 121 live comparables of a fresh pull of the same source
at median |log error| 1.280 bare, against 1.224 leave-one-out — no drift
alarm, so the curve is kept as fitted. Zero comparables were gained in
those five days, so no new launch exists to hold out on.

### What radar-6 adds: the bare curve prices the board, and the verdict rule is backtested

Radar-6 drops the radar-5 priors and prices every row with the bare size
curve alone, because the bare curve beats the full radar-5 formula on all
three blind tests (leave-one-out 1.224 vs 1.326, 5-fold 1.266 vs 1.296,
pooled walk-forward 1.129 vs 1.146). The radar-5 formula survives only in
the validation tables as the comparison. The board now splits FARM 19,
THIN 83, SKIP 96 (was 19 / 77 / 102), rank 1 is Sentora Curator at
$90,185,322, just ahead of Steakhouse Financial at $90,123,744, and the
top 10 rows sum to $533,688,425. The verdict rule itself is backtested out
of sample, new in radar-6: each comparable is priced by a curve fit without
it, given the farm plan its own TVL and age would have earned, and checked
against its actual market cap. FARM calls clear break-even 23 of 25 times
(92.0%, median net $467), THIN 45 of 51 (88.2%, median net $109), SKIP 33
of 52 (63.5%, median net $37); following FARM and THIN and skipping SKIP
nets $112,829 across 76 calls. The odds are calibrated: comparables quoted
75–90% odds clear break-even 88.2% of the time (82.3% quoted), 90–95%
quoted clear it 92.3% (92.9% quoted). The thresholds were swept before they
were kept (FARM at 0.85 calls 43 at 91% precision, at 0.95 calls 11 at 91%),
so they stay at the round numbers that state what FARM means. Two more
candidates were tested and rejected in radar-6: a quadratic log(TVL) term
(leave-one-out ties at 1.217, 5-fold loses at 1.293, coefficients swing
across walk-forward training sets with no in-sample gain) and re-weighting
the old priors one at a time (each sweep is noise around the bare curve).
The same honest limit as walk-forward applies to the backtest: the "launch
value" is the snapshot-date market cap, not a launch-day value.

## The board

198 rows: the 40 watchlist protocols (TVL at or above $50M, no token on
record) plus the 158 rankable pre-token protocols below the floor — every
pre-token protocol that could launch, under the house's own watchlist
exclusions. Live-token protocols (416) are set aside in their own view with
their market caps shown — the market's own values, not a model's — and the
144 pre-token protocols that are not launches are listed with the reason, so
all 758 protocols in the snapshot are accounted for. Every row carries a
six-step farm plan derived from the protocol's category, chains, TVL and age,
each step stating what it costs and how long it takes — and the plan is
netted: cash cost and hours against a stated scenario (the launch
distributes 5% of its implied value to farmers, split equally among 5,000
active farmers), giving a verdict of FARM, THIN or SKIP from break-even
odds — the chance the launch value covers the plan's gas cost under the
model's own error distribution — with the dollars per hour and the
break-even capture printed on the plan. The detail view shows
the full model breakdown, the rank range across 200 bootstrap refits, the
nearest live comparable, and a recomputation of the implied value from the
snapshot figures that must match the board's value exactly.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

`main.ts` (Node 22, standard library only) writes `board.json`, `data.js`,
copies `dashboard/` and `screenshots/` to the output directory, and writes
`dossier.json` with the vendored make.fun library. The run is deterministic:
the same snapshot always writes the same bytes.

## Layout

- `main.ts` — the program: reads the snapshot, writes the board, the data
  and the dossier.
- `lib/model.ts` — the radar-6 model, the calibration, the farm plans.
- `dashboard/` — the static page: `index.html`, `app.css`, `app.js`. No
  network, no framework.
- `screenshots/` — the board, a protocol's detail view, a filtered view, and the validation panel with the refit sandbox.
- `vendor/makefun-board.ts` — make.fun's dossier library, as shipped.

---

<sub>Entered on [make.fun](https://make.fun/?ref=m5sdmdqp&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
