# Token Radar — what this board is, and how far to trust it

Every number below comes from the dashboard's own data file, with the method named next to it; the tables carry the full detail.

## The board

198 pre-token protocols, ranked by implied launch value, from a snapshot of
758 protocols dated 2026-11-14. The 40 watchlist protocols at or above $50M
TVL with no token are all covered (40 of 40), plus the 158 rankable pre-token
protocols below the floor. The other 560 are accounted for: 416 already trade
and are set aside with their market caps shown, and 144 pre-token protocols
are listed as not launches, each with its reason. 198 + 416 + 144 = 758.
Rank 1 is Steakhouse Financial at $86,475,940, just ahead of rank 2,
Sentora Curator, at $85,512,930. The top 10 rows sum to $509,981,033; all 198
rows sum to $2,087,843,342. Verdicts: FARM 14, THIN 80, SKIP 104.

## Implied value

Implied value is what a launch might be worth if the market priced it the
way it prices live protocols of its size — not a price, and not a promise of
a token. The multiple is not hand-set: it is a size curve fitted by least
squares to the 128 live-token protocols that record a market cap:
log(market cap) = 6.9646 + 0.5223 x log(TVL). The slope is below 1 across 200 bootstrap refits (0.382 to 0.654). The curve explains little — R-squared 0.194, residual SD 2.077 — so every implied value carries wide error bars. Radar-7 prices every row with the
curve plus two bounded priors: growth (7-day TVL change, clamped to
−80…300%, dampened with tanh) and maturity (0.75 rising toward 1.10 over
about 540 days with no token). The third radar-5 prior, breadth (4% per
extra chain), is dropped — the per-prior table below is why. The chain count
still picks the farm plan's chain; it just stops moving the price.

## Blind test

Leave-one-out over the same 128 comparables (median absolute log error, then the share priced within a factor of two): Flat global median multiple: 1.585, 29.7%. Category
median (radar-2): 1.625, 20.3%. Fitted size curve, bare: 1.224, 32.0%. Full
radar-2 formula: 1.646, 20.3%. Full radar-5 formula (all three priors):
1.326, 31.3%. Full radar-7 formula (growth and maturity priors): 1.250,
31.3%. Fitted size curve, 5-fold cross-validation: 1.266, 32.0%. A median
log error of 1.250 is a factor of about 3.5; only one token in three lands
within a factor of two.

## Per-prior ablation — why breadth is dropped

Radar-6 dropped all three priors on the medians (bare 1.224 vs full 1.326, leave-one-out). Radar-7 re-tests that claim prior by prior — leave-one-out / pooled walk-forward
median, mean beside each median, and the board's move off the TVL ranking.
Bare: 1.224 / 1.129, mean 1.596 / 1.638, 0 of 198 rows moved. Growth only:
1.223 / 1.129, 166 moved. Maturity only: 1.275 / 1.136, 188 moved.
Breadth only: 1.343 / 1.130, 185 moved. Growth + maturity (radar-7): 1.250 /
1.123, mean 1.604 / 1.662, 182 moved, mean shift 8.0 ranks. Full radar-5:
1.326 / 1.146, 192 moved. Half strength: 1.267 / 1.145, 182 moved. The
priors do not cost the same: growth alone ties the bare curve on both
tests, breadth alone costs the most for the least reordering — and a fitted
chain-count term hurts too (1.331) — so breadth is dropped. And the median
differences are noise as much as signal: the mean barely moves between any
two structures (1.596 bare against 1.604 full, leave-one-out), and a paired
bootstrap of the median difference straddles zero on every comparison. What the priors buy is not noise: only 8 of 198 rows hold a single rank across all 200 bootstrap refits (mean rank range 16.8, median 11).

## Walk-forward validation

Only the 95 comparables with a listing date can be
ordered in time; the 33 without one sit outside these splits. Bare curve /
radar-5 full / radar-7, median log error, pooled over 101 predictions:
1.129 / 1.146 / 1.123 (per split in the table: 1.069 / 1.070 / 1.070 at
2024-01-01; 1.124 / 1.104 / 1.104 at 2025-01-01; 1.605 / 1.507 / 1.325 at
2025-07-01). The test market cap is the snapshot-date market cap, not a
launch-day prediction.

## Verdict rule, backtested

Each comparable is priced by a curve fit without it, given the farm plan its own TVL and age would have earned. Under the stated scenario (5% of the launch value to 5,000 farmers):
FARM, 22 calls — 95.5% clear break-even (21 of 22), median net $557.
THIN, 50 calls — 86.0% (43 of 50), median net $100. SKIP, 56 calls —
66.1% (37 of 56), median net $44. Following FARM and THIN and skipping
SKIP nets $100,156 across 72 calls; farming all 128 nets $153,306. The odds
are calibrated: quoted 50–75% clear it 66.1% (68.4% quoted, 56 calls);
75–90% quoted clear it 86.0% (82.6% quoted, 50 calls); 90–95% quoted clear
it 91.7% (93.4% quoted, 12 calls); above 95% quoted clear it 100% (97.1%
quoted, 10 calls). The thresholds were re-swept with the priors back in and
stay at the round numbers (FARM 0.90, THIN 0.75): moving THIN to 0.70 adds
marginal calls while its beat rate falls to 0.82. The sigma was re-checked (2.089 in-sample, 2.119 leave-one-out, against 2.077 printed); recomputing the odds on the larger sigma moves no beat rate.

## Tried and rejected

Fitted growth, maturity and breadth terms all hurt leave-one-out (curve
alone 1.224; plus growth 1.328; plus maturity 1.326; plus breadth 1.280;
all three 1.320) and their coefficients flip sign across the time splits.
Shrunk category shifts hurt at every strength (leave-one-out 1.337 / 1.332
/ 1.292 / 1.271 for k=5 / 10 / 20 / 50; walk-forward pooled 1.169). A
quadratic log(TVL) term (radar-6) ties leave-one-out (1.217), loses 5-fold
(1.293) and swings across splits with no in-sample gain, so its pooled gain (1.003) is not trusted. Radar-7 tested six second
signals beyond TVL and rejected all: category-relative TVL, log age, a
growth-by-maturity interaction, raw 7-day change, an uncapped chain count,
and TVL share within category — every one hurts leave-one-out (1.257–1.341
against 1.224 bare) and none improves pooled walk-forward, and two flip
sign across the time splits.

## Farm plans

Every row carries a six-step plan from its own category, chains, TVL and age, each step stating its cost and time, netted against a stated
scenario: the launch distributes 5% of its implied value to farmers, split
equally among 5,000 active farmers. Gas is $3 first, $4 or $8 to set up, $2 a week; capital $50 to $250 by TVL; the hold is 30, 45 or 60 days by age. The verdict is FARM, THIN or SKIP from
break-even odds: FARM at odds of 90% or better, THIN at 75% or better, SKIP
below that.

## Honest limits

- Implied value is a model, not a price. The typical held-out error is a
  factor of about 3.5, and two of three tokens land outside a factor of two.
- The ranking is not the TVL ranking, but TVL still does most of the work: the curve sets the dollar value, the priors move the order — and the priors' accuracy price is within noise on the paired tests, which is why the table prints the means beside the medians.
- "Records no token" means the DefiLlama index records none for that
  protocol; it is not proof that no token exists.
- Walk-forward and the backtest predict current market caps, not launch-day values, and the verdicts condition on the token launching at all.
