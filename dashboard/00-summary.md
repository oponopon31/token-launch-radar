# Token Radar — what this board is, and how far to trust it

Read this first. Everything below is a number from the dashboard's own data
file, with the method named next to it. The page after this file is the board
itself; this summary is the claim, the evidence, and the limits, in one place.

## The board in one paragraph

198 pre-token protocols, ranked by implied launch value, from a snapshot of
758 protocols dated 2026-11-14. The 40 watchlist protocols at or above $50M
TVL with no token on record are all covered (40 of 40), plus the 158 rankable
pre-token protocols below the floor. The other 560 are accounted for, not
dropped: 416 already trade and are set aside with their market caps shown,
and 144 pre-token protocols are listed as not launches, each with its reason.
198 + 416 + 144 = 758.

Rank 1 is Steakhouse Financial, TVL $2,753,981,495, implied value
$103,771,128, and its rank is 1 to 1 across 200 bootstrap refits of the size
curve — the most stable row on the board. Ranks 2 and 3, Sentora Curator
($95,774,482) and Gauntlet ($81,159,519), each hold rank 2 to 3 across the
same refits. The top 10 rows sum to $583,778,738 of implied value; all 198
rows sum to $2,253,992,857. Rank 40, the last watchlist row, is Avant avUSD
at $13,852,799; rank 198 is Monarq at $2,394,811.

## What "implied value" means

Implied value is what a launch might be worth if the market priced it the way
it prices live protocols of its size. It is not a price, and not a promise of
a token. The multiple is not hand-set: it is a size curve fitted by least
squares to the 128 live-token protocols that record a market cap —

log(market cap) = 6.9646 + 0.5223 x log(TVL)

A bigger protocol is worth fewer dollars per dollar of TVL: the slope is
below 1, and it stays below 1 across 200 bootstrap refits (0.382 to 0.654).
The curve explains little of the variation — R-squared 0.194, residual
standard deviation 2.077 in log space — so every implied value below carries
wide error bars, and the board says so instead of hiding it. Three bounded
priors adjust the curve, none of them fitted: growth (7-day TVL change,
clamped to -80 to 300 percent, dampened with tanh, weight 0.35), maturity
(0.75 rising toward 1.10 over about 540 days with no token; a protocol with
no listing date is scored as 365 days old), and breadth (4 percent per extra
chain, up to 5). No protocol name is ever special-cased: the same function
scores every row.

## How accurate it is — the blind test

Leave-one-out over the same 128 comparables: each held-out token is priced
by a model fit without it. Median absolute log error, then the share priced
within a factor of two:

- Flat global median multiple: 1.585, 29.7 percent within 2x.
- Category-median multiple (the radar-2 multiple): 1.625, 20.3 percent.
- Fitted size curve, bare: 1.224, 32.0 percent.
- Full radar-2 formula (category median plus priors): 1.646, 20.3 percent.
- Full radar-4 formula (size curve plus priors): 1.326, 31.3 percent.
- Fitted size curve, 5-fold cross-validation: 1.266, 32.0 percent.

Read the errors in plain terms. A median log error of 1.224 means the
typical held-out token is priced wrong by a factor of about 3.4; the full
radar-4 formula's 1.326 is a factor of about 3.8. Only about one token in
three lands within a factor of two. The fitted curve beats both baselines
and the radar-2 formula on the same test, and the priors cost a little
out-of-sample accuracy (1.224 bare to 1.326 with them) — the table shows
that cost instead of hiding it.

## Walk-forward validation — the curve tested on time, not shuffled

Leave-one-out and 5-fold splits shuffle the comparables, so a token listed
last month can sit in the training set of a token listed three years ago.
Walk-forward does not leak time: at each cutoff the curve is fit on the
listings before it and tested on the listings after it. Only the 95
comparables with a listing date can be ordered in time; the 33 without one
sit outside these splits. Bare curve, median log error and within-2x share:

- Cutoff 2024-01-01, fit on 44, tested on 51: 1.069, 37.3 percent.
- Cutoff 2025-01-01, fit on 64, tested on 31: 1.124, 25.8 percent.
- Cutoff 2025-07-01, fit on 76, tested on 19: 1.605, 26.3 percent.
- Pooled over all three test sets: 1.129, 31.7 percent for the bare curve;
  1.146, 29.7 percent for the full formula.

The pooled figure is 101 predictions over 51 distinct tokens: a token listed
after a cutoff is tested at every later cutoff too, so the newest listings
count more than once. Read it honestly: the test market cap is the
snapshot-date market cap, so a split tests whether a curve fit on older
listings predicts the current market cap of newer listings — not a
launch-day prediction. No launch-day test is possible from this snapshot,
and this board does not claim one.

Drift check, 2026-11-19: five days after the snapshot the same source was
pulled again — 121 live comparables, down from 128, none gained. The
radar-3 fit predicts their current market caps at median log error 1.280
bare, against 1.224 leave-one-out: no drift alarm, so the curve is kept as
fitted. No new launch appeared in those five days, so there is nothing to
hold out on.

## What was tried and rejected

Two candidate improvements were tested and rejected, with their numbers
printed on the dashboard.

Fitted growth, maturity and breadth terms, fit alongside log(TVL) and scored
by leave-one-out over all 128 comparables and by pooled walk-forward:
curve alone 1.224 / 1.129; plus growth 1.328 / 1.102; plus maturity 1.326 /
2.139; plus breadth 1.280 / 1.248; all three fitted 1.320 / 1.710. Every
fitted term hurts leave-one-out, and their coefficients flip sign across
the time splits — fitting them would be fitting noise, so none is adopted.
Growth's small pooled walk-forward gain (1.102 against 1.129) comes with a
worse within-2x share (29.7 percent against 31.7 percent), so it is not
adopted either.

Shrunk category shifts (category intercepts shrunk toward the global curve)
were tested at four strengths and hurt median log error at every one:
leave-one-out 1.337 (k=5), 1.332 (k=10), 1.292 (k=20), 1.271 (k=50)
against 1.224 bare, and walk-forward pooled 1.169 against 1.129. One
exception, on the secondary metric: leave-one-out within-2x at k=5 is
33.6 percent against 32.0 percent for the bare curve. The board uses no
category shift; the category medians stay on the dashboard only as a
cross-check table (global median 0.1857 across 35 categories).

## The farm plans — netted, not just listed

Every row carries a six-step plan derived from its own category, chains, TVL
and age, each step stating its cost and time. The plan is netted against a
stated scenario: the launch distributes 5 percent of its implied value to
farmers, split equally among 5,000 active farmers. Gas is $3 for the first
transaction, $4 or $8 to set up, $2 per weekly action; capital is $50 to
$250 by TVL; the hold is 30, 45 or 60 days by age. The verdict is FARM, THIN or SKIP from break-even odds, not from the
dollars per hour: the launch value that exactly covers the plan's gas cost
is the cash cost divided by the farmer's share of the launch (5 percent
split among 5,000 farmers), and the odds are the chance the launch clears
that value under the model's own error distribution — log launch value is
normal around the point estimate with the size curve's residual standard
deviation, 2.077 in log space. FARM at odds of 90 percent or better, THIN
at 75 percent or better, SKIP below that. Under that rule the board splits
FARM 19, THIN 77, SKIP 102. The old rule farmed on dollars per hour and
called 71 rows FARM, because $16 to $24 of gas is covered by almost any
point-estimate share. The break-even capture — the share of the implied
launch value that pays the plan's cash cost — needs no scenario at all and
is printed on every plan, so a reader can re-run any verdict under their
own scenario. Rank 1's plan nets about $784 an hour under the stated
scenario.

## Honest limits

- Implied value is a model, not a price. The typical held-out error is a
  factor of about 3.4, and two of three tokens land outside a factor of two.
- "Records no token" means the DefiLlama index records none for that
  protocol; it is not proof that no token exists.
- The walk-forward test predicts current market caps, not launch-day ones.
- The verdicts are break-even odds under the model's own error
  distribution, and they condition on the token launching at all — a
  protocol that never launches loses the gas whatever the odds say. The 5
  percent to 5,000 farmers scenario sets the break-even value; change it
  and the verdicts move. The break-even capture does not depend on it.
- The snapshot is one date, 2026-11-14. Listings, TVLs and market caps
  after that date are not in this board.
- The refit sandbox on the dashboard re-prices the board under any
  intercept and slope, with the same bounded priors; reset returns to the
  fitted curve. At the fitted curve it matches the board exactly.

## How to check any number here

Every figure above is recomputed live on the dashboard from the data file
beside it: the detail view for a row shows its full model breakdown, its
rank range across 200 bootstrap refits, its nearest live comparable, and a
recomputation of its implied value from the snapshot figures that must match
the board's value exactly. The validation tables on the dashboard carry the
same numbers as this summary, with the same methods.
