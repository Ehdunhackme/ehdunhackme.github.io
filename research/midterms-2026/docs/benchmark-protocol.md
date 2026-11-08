# Benchmark protocol

Frozen before running the expanded comparison on 8 November 2026.

## Data and scope

Use the existing 3,063 historical D/R races, ending in 2024. Do not add 2026
outcomes, change the feature snapshot, or choose a model by its 2026 seat totals.
The 2026 result reporting is researched separately for the article's date context.

This is retrospective development. Earlier versions already examined the
2018–2024 results, so these are not pristine unseen test elections.

## Candidates

Compare the simple baseline, a poll/baseline blend, the old direct elastic net,
direct ridge, and corrections to the baseline using ridge, elastic net, Huber,
Bayesian ridge, random forests, extra trees, histogram gradient boosting,
Huber gradient boosting, and support-vector regression. The exact finite grids
are defined in `benchmark.py` before the first run and saved with the results.

New learned models use the same historical features, with chamber interactions.
Each chamber has equal total training weight. Polled races have two training
copies, with polling present and hidden; the copies split that race's weight.
Imputation is fitted on training data only. Scaling uses training weights.
The old elastic net keeps its original fitting implementation for comparison.

## Time splits and selection

1. Produce predictions for 2014, 2016, 2018, 2020, 2022 and 2024. Each fit uses
   only earlier elections. The first two cycles supply initial tuning history.
2. For each family in each evaluated year (2018–2024), select its settings
   using only the earlier cycles. Never let that year's outcomes select its
   own settings.
3. Rank families by mean absolute error, averaging equally over the two
   chambers and the four evaluated elections. Ties use the declared family
   order. Report RMSE, ordering accuracy, chamber scores and year-level scores
   separately; do not change the selection metric after seeing the results.
4. Select one final family by that ranking. Select its final settings using
   the completed 2014–2024 tuning cycles, then fit it to all historical data.
5. Also report a sequential selection check: before each test year, choose
   the family and settings solely from earlier cycles. This distinguishes the
   selection procedure from the retrospectively chosen winning family's score.

Close-race comparisons use the same subset for every method: races where the
simple baseline predicts a Democratic share from 45% to 55%. All errors are
in two-party vote-share percentage points. Random seeds are fixed. No random
train/test row splits or random validation-based early stopping are used.

## Uncertainty and publication

Calibrate the final family's errors using only its earlier chronological
predictions. Do not pool residuals from a different model. Suppress candidate
win probabilities for non-D/R treatments as before. Report instability across
elections and selection bias instead of claiming that the winner is universally
best. Publish the complete leaderboard and grids, including losing methods.
