# Live results comparison

The article compares the saved model with current reported results. It requests
the House and Senate feeds from [civicAPI](https://civicapi.org) when opened,
then every 60 seconds while visible. Returning to the tab refreshes it again.
No API key, server process, scheduled rebuild or manual article edit is needed.
The provider's public API supports cross-origin browser requests.

The prediction remains the 8 November retrospective model with reconstructed
2 November inputs. Its CSV hash is stored with the browser's prediction data.
The observed results never enter model fitting, selection or calibration.

## What the scores mean

- Party matches count only explicitly called races. An uncalled lead is not a win.
- Seat totals show all 435 House districts and the 35 contested Senate seats.
  The Senate display does not include the other 65 senators or combine caucuses.
- MAE and average signed error use called, ordinary D/R races with positive
  vote counts for both parties. Observed Democratic share is `100 * D / (D + R)`.
  The baseline is scored on exactly the same rows. Positive signed error means
  the model underestimated Democratic support.
- Roster assignments count toward party accuracy but have no numerical share.
  Ranked-choice proxies, independent/minor-party transfers and Louisiana House
  party aggregates do not enter the vote-share score.
- A called race can still have ballots outstanding. Every number is provisional,
  and the display identifies the source's update time separately from the last
  successful request. A call is not certification.

## When the feed is unavailable

Each chamber updates independently. Failed, incomplete, malformed, test-election
or older responses leave the last valid data intact. The initial snapshot is
bundled with the article; successful later updates are also saved in the reader's
browser where local storage is available. Errors are visible and retries continue.
No missing count is silently interpreted as zero votes or a Republican win.

This removes routine manual result updates. It cannot guarantee provider uptime
or compatibility if the external API changes its schema or access policy.

## Files

- `website/live/core.mjs`: validation, race matching and scoring.
- `website/live/widget.mjs`: shared browser UI, refresh and fallback handling.
- `../../../src/content/live-comparison.tsx`: the portfolio's React wrapper.
- `website/live/predictions.json`: the fixed forecast, exported from the reviewed CSV.
- `data/results/live-snapshot.json`: initial observed-results snapshot, separate from training data.
- `data/results/sources.json`: source URLs, fetch times, source times and response hashes.

`python scripts/export-live-predictions.py` explicitly exports the existing
forecast. `node scripts/capture-live-results.mjs` explicitly refreshes the bundled
snapshot for a new release. Neither command is required for the live page to
keep refreshing. `npm run test:live` checks the scoring and input guards.

Attribution and API documentation: [civicAPI](https://civicapi.org/api-documentation).
The API is free for personal and commercial use with attribution, according to
its documentation. The results are not an official certified-results archive.
