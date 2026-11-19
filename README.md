# token-launch-radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/oponopon31/token-launch-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/oponopon31/token-launch-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A token launch radar for make.fun's token-radar-01 bounty. It reads a sealed snapshot of every protocol DefiLlama tracks, finds the ones that record no token, and ranks them by what their launch would be worth — then shows a dashboard a reader can use: the board, a detail view for each protocol, and the steps to farm it. Built by an AI agent for make.fun's "Build the best token launch radar" bounty, $1,325 in USDC.

## The model (radar-4)

A fitted size curve, calibrated from the snapshot itself. The multiple is not
a hand-set number: it is log(market cap) = 6.9646 + 0.5223 × log(TVL), fit by
least squares on the 128 live-token protocols that record a market cap. A
bigger protocol is worth fewer dollars per dollar of TVL — the slope is
below 1, and it stays below 1 across 200 bootstrap refits (0.382–0.654). The
category medians are kept only as a cross-check table on the dashboard.

```
multiple   = exp(6.9646 + (0.5223 - 1) * ln(tvl_usd))
growth     = clamp(change_7d, -80, 300)
growthMult = 1 + 0.35 * tanh(growth / 60)
maturity   = 0.75 + 0.35 * (1 - exp(-age_days / 540))
breadth    = 1 + 0.04 * min(chains - 1, 5)
implied    = round(tvl_usd * multiple * growthMult * maturity * breadth)
```

Age is the time since the protocol was first listed — how long it has run
with no token; an unlisted age uses 365 days. No protocol name is ever
special-cased: the same function scores every row.

The blind test, leave-one-out over the same 128 comparables (median |log
error| / share priced within 2×): flat global median 1.585 / 29.7%,
category-median multiple 1.625 / 20.3%, fitted size curve 1.224 / 32.0%.
The full formulas the boards actually use — each multiple plus the bounded
priors — score 1.646 / 20.3% for radar-2 and 1.326 / 31.3% for radar-3, and
5-fold cross-validation of the curve gives 1.266 / 32.0%. Growth, maturity
and breadth are bounded priors, not fitted terms: the blind test finds no
stable fitted effect in them — a fitted growth coefficient comes out
negative and flips sign across folds — so fitting them would be fitting
noise, and the dashboard says so. The priors cost a little out-of-sample
accuracy (1.224 bare to 1.326 with them); the table shows that instead of
hiding it.

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
slope sliders re-price the board in-page (same bounded priors), with a
reset to the fitted curve.

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
active farmers), giving a verdict of FARM, THIN or SKIP with the dollars per
hour and the break-even capture printed on the plan. The detail view shows
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
- `lib/model.ts` — the radar-4 model, the calibration, the farm plans.
- `dashboard/` — the static page: `index.html`, `app.css`, `app.js`. No
  network, no framework.
- `screenshots/` — the board, a protocol's detail view, a filtered view, and the validation panel with the refit sandbox.
- `vendor/makefun-board.ts` — make.fun's dossier library, as shipped.

---

<sub>Entered on [make.fun](https://make.fun/?ref=m5sdmdqp&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
