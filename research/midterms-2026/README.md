# Modelling the 2026 midterms

I compared **13 model families and 47 settings** on past elections, then used
the best performer to estimate all **435 House districts and 35 Senate contests**.
The project includes the data, benchmark, maps and a reproducible technical article.

Everything is included in this portfolio repository. The website imports the
live comparison directly from this folder; it does not fetch code or forecasts
from another repository.

[Read the article and live results comparison](https://dunlichan.com/writings/2026-us-midterm-election-model/).

**Written on November 8, after the election.** These are reconstructed estimates,
not a forecast published before voting. No 2026 outcomes enter model selection,
fitting or calibration. The November 2 input cutoff is not independently verified.

## What won?

A simple blend: **75% race polling + 25% partisan baseline**.
Without a matched poll, it uses the baseline alone. The baseline adds local
presidential lean to the national Democratic generic-ballot share.

| Average absolute error | Selected blend | Baseline |
| :--- | ---: | ---: |
| House | 2.63 pp | 2.72 pp |
| Senate | 2.50 pp | 3.49 pp |
| Both chambers | **2.57 pp** | 3.11 pp |

These scores give each chamber and each test election equal weight. The blend's
overall error is **17.3% lower**, although it loses to the baseline in 2020.
Most of the improvement comes from Senate races.

The comparison tests 2018, 2020, 2022 and 2024 using earlier years to fit and
tune each model. Choosing the winning family after seeing those scores adds
selection bias. A separate test that chooses the family using earlier years
only scores **2.93 pp**. These historical elections also informed earlier versions
of the project, so neither result is an untouched final test.

[Full leaderboard](results/benchmark/leaderboard.csv) ·
[Comparison rules](docs/benchmark-protocol.md) ·
[Accuracy and limitations](docs/accuracy-review.md)

## Reproduce it

Requires Python 3.13+ and Node.js 20+. Inputs are saved in the repository; the
build does not fetch changing polling feeds.

Run these commands from `research/midterms-2026/`:

```bash
python -m venv .venv
# Activate .venv using your shell's activation command.
python -m pip install -r requirements.lock
python -m pip install -e ".[dev]"
python -m election_forecast build
python -m pytest -q
npm ci
npm run article
npm run check:article
```

Open `site/index.html` for the full article. Charts, fonts and equations work
offline. The results comparison starts from a saved snapshot and refreshes from
civicAPI every minute while the page is visible. No manual result updates or
scheduled rebuilds are needed. Failed refreshes retain the last available data.
See [how the live comparison works](docs/live-results.md).
Or run `npm run preview` for a local web server.
To run only the comparison, use `python -m election_forecast benchmark`.

To update the portfolio after a model build, return to the repository root and
run `npm ci`, `npm run sync:midterms`, then `npm run build`. The sync checks the
fixed forecast hash and copies the article, figures and downloads from this
folder. It never downloads another project or refits on live results.

## Where to look

| Folder | Contents |
| :--- | :--- |
| [`results/`](results/) | All 470 estimates, selected model and benchmark scores |
| [`src/election_forecast/`](src/election_forecast/) | Benchmark, final model, calibration and figures |
| [`data/`](data/README.md) | Frozen inputs, source links and provenance |
| [`docs/`](docs/) | Comparison protocol and accuracy review |
| [`website/`](website/) | Shared live-result code imported by the portfolio |

The selected model gives **246 Democratic / 189 Republican House seats** and
**18 Democratic / 17 Republican seats among the 35 Senate contests**. These are
point-estimate leaders, not reported results or probabilities of chamber control.
Fourteen House seats are assigned from the candidate roster. Independent,
ranked-choice and runoff races require assumptions described in the article.

Generated files live in `reports/` and `site/`, which are excluded from Git.
GitHub checks rebuild the analysis, test the temporal boundaries and verify
the article in desktop and mobile Chromium. Browser tests can also be run with
`npx playwright install chromium` followed by `npm run test:browser`.

Source data and fonts retain their own terms. See [data provenance](data/README.md)
and the [MIT license](LICENSE) for the project code.
