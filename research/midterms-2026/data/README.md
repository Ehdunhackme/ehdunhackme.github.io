# Data provenance

`frozen/training-data.csv` contains the 3,063 historical training rows.
`frozen/2026-feature-snapshots.csv` contains all 470 target contests and no 2026
outcomes. `snapshot-sha256.json` verifies the checked-in inputs before fitting.

The reference files support reconstruction of the features:

- District presidential tables are snapshots from The Downballot / Daily Kos
  Elections. Only a presidential election earlier than the target year is used.
  Different district maps use separate source sheets. Some percentages are rounded.
- `historical-poll-features.csv` preserves the previously aggregated one-day
  polling features and national generic-ballot inputs. It is a derived input,
  not a complete raw survey archive. House 2024 polling is unavailable.
- `generic-ballot-2026.csv` preserves national polling questions used at the cutoff.
- `nominees-2026.csv` is the October 8 Clerk-document extraction. The preparation
  code corrects 28 fusion-party parsing issues and removes a party description
  from Nadia Donya Milleron's name; the source lines and all 29 fixes are
  recorded in `results/roster-corrections.json`.

`sources.json` records the URLs, retrieval timestamps and hashes for raw files
needed by the optional input-preparation path. The historical House file comes
from a commit-pinned public research mirror of MEDSL's 1976–2024 returns.
`upstream-provenance.json` retains hashes from the original preparation run.

Use `python scripts/fetch-sources.py` to retrieve raw sources into the ignored
`data/raw/` directory. Downloads must match the saved hashes. A mutable feed that
has changed is rejected rather than silently replacing the snapshot. This
optional retrieval is not needed to reproduce the checked-in forecast inputs.

The polling cutoff is a retrospective field/database-date proxy. Neither those
dates nor the source hashes prove that the same information was publicly available
before the election. Historical candidate rosters are reconstructed from returns,
and backtests remain development diagnostics.

Snapshot CSVs use LF line endings. `snapshot-sha256.json` verifies these normalized
repository files; upstream download hashes remain separate in `sources.json`.

The November 8 accuracy review also preserves Alan Aversa's No Labels party
as `NOL`, instead of calling him independent. Empty opponent slots have no party
label. Rebuilding the target snapshot changed no numeric model inputs.
