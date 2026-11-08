# Accuracy review

Updated 8 November 2026 after the expanded historical comparison.

## Selected model

The poll/baseline blend ranks first among 13 model families and 47 settings.
The final polling weight is 0.75. An unpolled race receives the baseline: local
presidential lean plus national Democratic generic-ballot share, clipped to 0–100.
The previous direct elastic-net model remains in the comparison, but no longer
produces the published estimates.

Selection uses mean absolute error (MAE), equally averaged over the House,
Senate and four test elections: 2018, 2020, 2022 and 2024. The winning score is
2.5666 percentage points versus 3.1054 for the baseline, a 17.3% reduction.
Each family chooses its settings from earlier cycles before predicting a test
year. Final settings use the completed tuning cycles from 2014 through 2024.

| Test year | House blend | House baseline | Senate blend | Senate baseline |
| :--- | ---: | ---: | ---: | ---: |
| 2018 | 2.55 | 2.85 | 1.77 | 4.98 |
| 2020 | 3.34 | 3.29 | 3.16 | 2.61 |
| 2022 | 2.46 | 2.56 | 2.50 | 2.93 |
| 2024 | 2.18 | 2.18 | 2.58 | 3.45 |

All entries are MAE in two-party vote-share percentage points. The blend loses
in both chambers in 2020. The 2024 House inputs contain no race polls, so the
blend and baseline are identical. Leaving out any one test election still gives
the blend first place. This sensitivity check does not supply an independent test.

## Selection and interpretation

The 2.57-point score describes a family chosen after comparing its historical
results with other families. A separate sequential selection policy chooses the
family using earlier cycles only. It selects support-vector correction in 2018,
then the blend in 2020, 2022 and 2024. Its score is 2.9272 points, about 5.7% below
the baseline. Do not substitute the winner's larger improvement for this check.

Earlier versions of the project already inspected these historical elections.
They are development data, not a pristine holdout. The finite grid and scoring
rule were fixed before this expanded run; no new candidates were added after
seeing the leaderboard. The candidate families include direct and residual
regressions, robust models, trees, boosting, support-vector regression and the
simple polling blend. A residual model learns a correction to the baseline.

The old direct elastic net retains its original fitting procedure, while its
settings are evaluated under this benchmark's common chronological MAE rule.
Its scores therefore differ from the previous article, which selected settings
using RMSE and a different initial tuning history. All methods share the same
test rows and ranking rule. New learned competitors balance training weight
between chambers and split each polled race's weight between visible and hidden
polling copies. The full grid is in the benchmark manifest.

## Close races and uncertainty

Every model is assessed on the same close-race subset: baseline predictions
from 45% to 55%. The blend orders the D/R candidates correctly in 83.7% of
343 House races and 76.3% of 38 Senate races. The baseline gets 81.3% and 63.2%.
These percentages pool races; they do not use the equal-cycle weighting of the
selection score. The Senate sample is too small to support a strong general claim.

Ranges and probabilities use the selected family's earlier chronological errors,
grouped by chamber and polling availability, with equal weight per election.
A group with fewer than two prior cycles uses its chamber's full error history.
The nominal 95% House ranges cover more than 98% in every test year and are
wide. This is not evidence of exact calibration. Shared national errors are
not simulated, so the seat bars do not give probabilities of chamber control.

## Data limits

- History includes 3,063 D/R races through 2024. It excludes uncontested,
  same-party and special elections. Some historical races lack required inputs.
- Roster and older polling reconstruction use information recorded in final
  election data. The saved inputs are not a verified real-time archive.
- The analysis was developed after the 2026 election, with reported outcomes
  known as context. No 2026 outcomes enter the numerical benchmark, fit or
  calibration. The live website now compares the fixed estimates against reported
  2026 results separately, with uncalled races excluded from winner accuracy.
- The November 2 cutoff is based on dates in files retrieved later. Availability
  in that exact form before Election Day is unverified.
- Fourteen House seats follow the candidate roster without a numerical estimate.
  Independent and minor-party transfers, first-preference RCV proxies and
  Louisiana House party totals are not validated candidate-level win models.
  Candidate-win probabilities are suppressed for these treatments.

See the [protocol](benchmark-protocol.md), [full leaderboard](../results/benchmark/leaderboard.csv),
[cycle scores](../results/benchmark/cycle-scores.csv),
[selection policy](../results/benchmark/selection-policy.csv) and
[paired close-race checks](../results/validation-benchmarks.csv).
