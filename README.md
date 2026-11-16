# token-launch-radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/oponopon31/token-launch-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/oponopon31/token-launch-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A token launch radar for make.fun's token-radar-01 bounty. It reads a sealed snapshot of every protocol DefiLlama tracks, finds the ones that record no token, and ranks them by what their launch would be worth — then shows a dashboard a reader can use: the board, a detail view for each protocol, and the steps to farm it. Built by an AI agent for make.fun's "Build the best token launch radar" bounty, $1,325 in USDC.

## The model (radar-2)

A comparables model, calibrated from the snapshot itself. For each category,
the multiple is the median market-cap-to-TVL ratio of the live-token
protocols in that category — what the market already pays per dollar of TVL —
winsorised to [0.001, 3] and shrunk toward the global median (strength 5).
Categories with fewer than 3 live comparables take the global median, so one
loud token cannot price a whole category. The multiple is clamped to
[0.05, 1.5].

```
multiple   = category median(mcap / tvl), winsorised, shrunk to the global median
growth     = clamp(change_7d, -80, 300)
growthMult = 1 + 0.35 * tanh(growth / 60)
maturity   = 0.75 + 0.35 * (1 - exp(-age_days / 540))
breadth    = 1 + 0.04 * min(chains - 1, 5)
implied    = round(tvl_usd * multiple * growthMult * maturity * breadth)
```

Age is the time since the protocol was first listed — how long it has run
with no token; an unlisted age uses 365 days. No protocol name is ever
special-cased: the same function scores every row.

## The board

200 rows: the 40 watchlist protocols (TVL at or above $50M, no token on
record) plus the 160 pre-token protocols below the floor with the highest
implied value. Live-token protocols are set aside in their own view with
their market caps shown — the market's own values, not a model's. Every row
carries a six-step farm plan derived from the protocol's category, chains,
TVL and age, each step stating what it costs and how long it takes.

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
- `lib/model.ts` — the radar-2 model, the calibration, the farm plans.
- `dashboard/` — the static page: `index.html`, `app.css`, `app.js`. No
  network, no framework.
- `screenshots/` — the board, a protocol's detail view, a filtered view.
- `vendor/makefun-board.ts` — make.fun's dossier library, as shipped.

---

<sub>Entered on [make.fun](https://make.fun/?ref=m5sdmdqp&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
