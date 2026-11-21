# Token Radar — what this board is, and how far to trust it

Read this first. Every number below comes from the dashboard's own data file, with the method named next to it.

## The board in one paragraph

198 pre-token protocols, ranked by implied launch value, from a snapshot of
758 protocols dated 2026-11-14. The 40 watchlist protocols at or above $50M
TVL with no token on record are all covered (40 of 40), plus the 158 rankable
pre-token protocols below the floor. The other 560 are accounted for: 416
already trade and are set aside with their market caps shown, and 144
pre-token protocols are listed as not launches, each with its reason.
198 + 416 + 144 = 758. Rank 1 is Sentora Curator, TVL $2,757,585,593,
implied value $90,185,322 — just ahead of rank 2, Steakhouse Financial, at
$90,123,744. The top 10 rows sum to $533,688,425; all 198 rows sum to
$2,272,079,922. Rank 40, the last watchlist row, is Ember at $15,098,394;
rank 198 is Nucleus at $3,339,175. Verdicts split FARM 19, THIN 83, SKIP 96.

## What "implied value" means

Implied value is what a launch might be worth if the market priced it the way
it prices live protocols of its size — not a price, and not a promise of a
token. The multiple is not hand-set: it is a size curve fitted by least
squares to the 128 live-token protocols that record a market cap:

log(market cap) = 6.9646 + 0.5223 x log(TVL)

A bigger protocol is worth fewer dollars per dollar of TVL: the slope is
below 1, and it stays below 1 across 200 bootstrap refits (0.382 to 0.654).
The curve explains little — R-squared 0.194, residual standard deviation
2.077 in log space — so every implied value below carries wide error bars.
Radar-6 prices every row with the bare curve alone. Radar-5 added three
bounded priors (growth, maturity, breadth); radar-6 drops them, because the
bare curve beats the full radar-5 formula on every blind test: leave-one-out
1.224 against 1.326, 5-fold 1.266 against 1.296, pooled walk-forward 1.129
against 1.146. No protocol name is ever special-cased. One consequence: implied value is now a strictly increasing function of TVL alone, so the board's ranking is the TVL ranking and every row holds the same rank across all 200 refits; the curve's work is the dollar value and the verdict, not an ordering the blind test could not justify.

## How accurate it is — the blind test

Leave-one-out over the same 128 comparables: each held-out token is priced
by a model fit without it. Median absolute log error, then the share priced
within a factor of two. Flat global median multiple: 1.585, 29.7 percent.
Category-median multiple (radar-2): 1.625, 20.3 percent. Fitted size curve,
bare — the radar-6 board formula: 1.224, 32.0 percent. Full radar-2 formula
(category median plus priors): 1.646, 20.3 percent. Full radar-5 formula
(size curve plus priors): 1.326, 31.3 percent. Fitted size curve, 5-fold
cross-validation: 1.266, 32.0 percent. A median log error of 1.224 is a factor of about 3.4; only one token in three lands within a factor of two.

## Walk-forward validation — the curve tested on time, not shuffled

Walk-forward does not leak time: at each cutoff the curve is fit on the
listings before it and tested on the listings after it. Only the 95
comparables with a listing date can be ordered in time; the 33 without one
sit outside these splits. Bare curve, median log error and within-2x share:
2024-01-01, fit on 44, tested on 51: 1.069, 37.3 percent; 2025-01-01, fit on
64, tested on 31: 1.124, 25.8 percent; 2025-07-01, fit on 76, tested on 19:
1.605, 26.3 percent; pooled (101 predictions over 51 distinct tokens):
1.129, 31.7 percent for the bare curve; 1.146, 29.7 percent for the full
radar-5 formula. Read it honestly: the test market cap is the snapshot-date market cap, not a launch-day prediction.

## The verdict rule, backtested — new in radar-6

Each comparable is priced by a curve fit without it, given the farm plan its own TVL and age would have earned, and checked against its actual market cap.
Under the stated scenario (5 percent of the launch value to 5,000 farmers):
FARM, 25 calls — 92.0 percent clear break-even (23 of 25), mean net $2,292,
median net $467, total net $57,297. THIN, 51 calls — 88.2 percent (45 of 51),
mean net $1,089, median net $109, total net $55,532. SKIP, 52 calls — 63.5
percent (33 of 52), mean net $778, median net $37, total net $40,477.
Following FARM and THIN and skipping SKIP nets $112,829 across 76 calls;
farming all 128 nets $153,306. The mean nets are pulled up by a few very
large market caps; the medians order the same way (FARM $467, THIN $109,
SKIP $37), which is the honest comparison. The same limit as walk-forward
applies: the "launch value" here is the snapshot-date market cap, not a
launch-day value. The odds are calibrated: quoted 50–75% odds clear
break-even 63.5% of the time (69.1% quoted, 52 calls); 75–90% quoted clear
it 88.2% (82.3% quoted, 51 calls); 90–95% quoted clear it 92.3% (92.9%
quoted, 13 calls); above 95% quoted clear it 91.7% (96.9% quoted, 12 calls).
The thresholds were swept before they were kept: moving FARM to 0.85 calls
43 comparables at 91% precision, to 0.95 calls 11 at 91% — precision barely
moves, so the thresholds are not tuned to the backtest; they stay at the
round numbers that state what FARM means (clears the gas in 9 of 10 draws).

## What was tried and rejected

Fitted growth, maturity and breadth terms, fit alongside log(TVL):
curve alone 1.224 / 1.129 (leave-one-out / pooled walk-forward); plus growth
1.328 / 1.102; plus maturity 1.326 / 2.139; plus breadth 1.280 / 1.248; all
three fitted 1.320 / 1.710. Every fitted term hurts leave-one-out, and their
coefficients flip sign across the time splits — fitting them would be fitting
noise. Shrunk category shifts hurt at every strength: leave-one-out 1.337
(k=5), 1.332 (k=10), 1.292 (k=20), 1.271 (k=50) against 1.224 bare, and
walk-forward pooled 1.169 against 1.129. A quadratic log(TVL) term was tested in radar-6 and rejected: leave-one-out ties (1.217 vs 1.224), 5-fold loses (1.293 vs 1.262), and its coefficients swing across the walk-forward training sets with no in-sample gain, so its pooled gain (1.003 vs 1.129) is not trusted. Re-weighting
the old priors one at a time was also tested and rejected: each single-weight
sweep is noise around the bare curve, and the only weight set that wins on
all three tests is all weights zero — which is radar-6.

## The farm plans — netted, not just listed

Every row carries a six-step plan derived from its own category, chains, TVL
and age, each step stating its cost and time. The plan is netted against a
stated scenario: the launch distributes 5 percent of its implied value to
farmers, split equally among 5,000 active farmers. Gas is $3 for the first
transaction, $4 or $8 to set up, $2 per weekly action; capital is $50 to
$250 by TVL; the hold is 30, 45 or 60 days by age. The verdict is FARM, THIN
or SKIP from break-even odds, not from the dollars per hour: the launch value
that exactly covers the plan's gas cost is the cash cost divided by the
farmer's share of the launch, and the odds are the chance the launch clears
that value under the model's own error distribution (residual SD 2.077). FARM at odds of 90 percent or better, THIN at
75 percent or better, SKIP below that. Under that rule the board splits
FARM 19, THIN 83, SKIP 96. Rank 1's plan nets about $680 an hour under the
stated scenario.

## Honest limits

- Implied value is a model, not a price. The typical held-out error is a
  factor of about 3.4, and two of three tokens land outside a factor of two.
- The ranking follows TVL; the curve sets the dollar value and the verdict, not the order.
- "Records no token" means the DefiLlama index records none for that
  protocol; it is not proof that no token exists.
- The walk-forward test and the verdict backtest predict current market
  caps, not launch-day ones.
- The verdicts are break-even odds under the model's own error distribution, and they condition on the token launching at all — a protocol that never launches loses the gas whatever the odds say.
- The snapshot is one date, 2026-11-14.
- The refit sandbox re-prices the board under any intercept and slope; under the bare curve it moves values, not ranks.

## How to check any number here

Every figure above is recomputed live on the dashboard from the data file
beside it: the detail view for a row shows its model breakdown, its rank
range across 200 bootstrap refits, its nearest live comparable, and a
recomputation of its implied value that must match the board's value exactly.
