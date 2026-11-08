"""Article and figures for the complete-roster, single-model experiment."""

from __future__ import annotations

import json

import matplotlib.pyplot as plt
from matplotlib.patches import PathPatch, Rectangle
import numpy as np
import pandas as pd

from .charts import Figures
from .geometry import state_paths, label_center


def national_map(artist, root, forecast, chamber):
    rows = forecast[forecast.chamber.eq(chamber)]
    counts = rows.projected_party.value_counts()
    total = len(rows)
    fig = plt.figure(figsize=(5.2 if artist.mobile else 10.4, 5.1 if artist.mobile else 8.2))
    fig.text(
        0.025,
        0.98,
        f"{chamber.title()} seat projections",
        va="top",
        fontsize=15 if artist.mobile else 18,
    )
    subtitle = (
        "435 districts across all 50 states"
        if chamber == "house"
        else "All 35 contests on the 2026 ballot"
    )
    fig.text(
        0.025,
        0.91 if artist.mobile else 0.93,
        subtitle,
        va="top",
        fontsize=10 if artist.mobile else 11,
        color=artist.muted,
    )
    d, r, i = [int(counts.get(p, 0)) for p in ["DEM", "REP", "IND"]]
    bar = fig.add_axes([0.025, 0.74 if artist.mobile else 0.79, 0.95, 0.12])
    bar.set(xlim=(0, total), ylim=(0, 1))
    bar.axis("off")
    size = 11 if artist.mobile else 14
    bar.text(0, 0.96, f"Democrats  {d}", color=artist.blue, fontsize=size, va="top")
    bar.text(
        total, 0.96, f"{r}  Republicans", color=artist.red, fontsize=size, va="top", ha="right"
    )
    start = 0
    for count, color in [(d, artist.blue), (i, "#c5b271"), (r, artist.red)]:
        if count:
            bar.add_patch(Rectangle((start, 0.28), count, 0.24, facecolor=color))
        start += count
    if i:
        bar.text(d + i / 2, 0.15, f"{i} independent", ha="center", fontsize=9, color=artist.muted)
    if chamber == "house":
        bar.plot([218, 218], [0.23, 0.58], color=artist.ink, lw=1)
        bar.text(
            218, 0.08, "218 for a majority", ha="center", va="top", fontsize=9, color=artist.muted
        )
    ax = fig.add_axes([0.005, 0.105, 0.985, 0.61 if artist.mobile else 0.66])
    ax.set(xlim=(-5, 1065), ylim=(615, -5), aspect="equal")
    ax.axis("off")
    reference = pd.read_csv(root / "data/reference/state-codes.csv")
    fips = {
        str(int(row.state_fips)).zfill(2): row.state_po
        for row in reference.itertuples()
        if row.state_po != "DC"
    }
    neutral = "#353535" if artist.dark else "#e7e7e3"
    labels = []
    small = {
        "VT": (1000, 155),
        "NH": (1040, 180),
        "MA": (1040, 210),
        "RI": (1040, 240),
        "CT": (1040, 270),
        "NJ": (1040, 300),
        "DE": (1040, 330),
        "MD": (1040, 360),
    }
    states = rows.groupby("state").projected_party.value_counts().unstack(fill_value=0)
    for code, path, rings in state_paths(
        json.loads((root / "assets/maps/states-albers-10m.json").read_text())
    ):
        state = fips.get(code)
        if state is None:
            continue
        party = None
        if state in states.index:
            count = states.loc[state]
            maximum = count.max()
            leaders = count[count.eq(maximum)].index
            party = leaders[0] if len(leaders) == 1 else "TIE"
            color = {"DEM": artist.blue, "REP": artist.red, "IND": "#c5b271"}.get(party, neutral)
        else:
            color = neutral
        if party == "TIE":
            ax.add_patch(
                PathPatch(path, facecolor=artist.blue, edgecolor=artist.red, hatch="////", lw=0)
            )
            ax.add_patch(
                PathPatch(
                    path, facecolor="none", edgecolor=artist.bg, lw=0.65 if artist.mobile else 1
                )
            )
        else:
            ax.add_patch(
                PathPatch(
                    path, facecolor=color, edgecolor=artist.bg, lw=0.65 if artist.mobile else 1
                )
            )
        if chamber == "house" or state in states.index:
            center = label_center(rings)
            if state == "FL":
                center = center + np.array([22, 30])
            if state in small:
                x, y = small[state]
                ax.plot([center[0], x - 10], [center[1], y], color=artist.muted, lw=0.5)
                labels.append((x, y, state, artist.ink))
            else:
                color_text = (
                    artist.ink
                    if color == neutral and party != "TIE"
                    else "#1a1a1a"
                    if artist.dark
                    else "white"
                )
                labels.append((*center, state, color_text))
    for x, y, label, color in labels:
        ax.text(
            x,
            y,
            label,
            ha="center",
            va="center",
            fontsize=7.6 if artist.mobile else 10,
            color=color,
        )
    foot = (
        "Colour: party with more projected House seats\nStripes: equal seat counts"
        if chamber == "house"
        else "Grey: no Senate election in 2026"
    )
    fig.text(0.025, 0.05, foot, fontsize=9 if artist.mobile else 10, color=artist.muted)
    artist.save(fig, f"2026-{chamber}-map")


def interval_chart(artist, forecast, chamber):
    group = forecast[forecast.chamber.eq(chamber) & forecast.prediction.notna()].copy()
    if chamber == "house":
        group = group.iloc[np.argsort(abs(group.prediction - 50).to_numpy())[:25]]
    group = group.sort_values("prediction", ascending=False)
    title = "The 25 closest House projections" if chamber == "house" else "Every Senate contest"
    chunks = [
        group.iloc[x]
        for x in np.array_split(
            np.arange(len(group)), 2 if chamber == "senate" and not artist.mobile else 1
        )
    ]
    subtitle = "Left-side two-candidate share (%) · point estimates and 95% D/R error ranges"
    fig, axes = artist.canvas(title, subtitle, len(chunks), max(4, len(chunks[0]) * 0.26))
    for ax, g in zip(axes, chunks):
        y = np.arange(len(g))
        for yy, row in zip(y, g.itertuples()):
            color = {"DEM": artist.blue, "REP": artist.red, "IND": "#c5b271"}[row.projected_party]
            ax.hlines(yy, row.lower_95, row.upper_95, color=artist.neutral, lw=1.3)
            ax.scatter(row.prediction, yy, s=25, color=color, zorder=3)
            if pd.notna(row.poll_dem_share):
                ax.scatter(
                    row.poll_dem_share,
                    yy,
                    s=20,
                    facecolors=artist.bg,
                    edgecolors=artist.neutral,
                    lw=0.8,
                    zorder=2,
                )
            ax.text(94, yy, f"{row.prediction:.1f}", ha="right", va="center", fontsize=10)
        ax.set(ylim=(len(g) - 0.4, -1), xlim=(15, 96), xlabel="Two-candidate share (%)")
        labels = [row.label + ("*" if row.race_kind != "D/R" else "") for row in g.itertuples()]
        ax.set_yticks(y, labels)
        ax.axvline(50, lw=0.8, color=artist.muted, linestyle=(0, (3, 3)))
        artist.clean(ax)
        ax.set_xticks([20, 35, 50, 65, 80])
    fig.subplots_adjust(
        left=0.17 if artist.mobile else 0.08, wspace=0.3, bottom=0.65 / fig.get_figheight()
    )
    artist.save(fig, f"2026-{chamber}-intervals")


def no_poll_chart(artist, scores, masked):
    fig, axes = artist.canvas(
        "How the model performs without race polling",
        "Historical vote-share RMSE in percentage points",
        2,
        3.2,
    )
    for ax, chamber in zip(axes, ["house", "senate"]):
        normal = scores[scores.chamber.eq(chamber)]
        missing = masked[masked.chamber.eq(chamber)]
        ax.plot(
            normal.cycle,
            normal.rmse_pp,
            marker="o",
            ms=4,
            color=artist.blue,
            lw=1.5,
            label="Available polls",
        )
        ax.plot(
            missing.cycle,
            missing.rmse_pp,
            marker="o",
            ms=4,
            color=artist.neutral,
            lw=1.5,
            label="All race polls withheld",
        )
        ax.set_title(chamber.title(), loc="left", fontsize=12)
        ax.set_ylim(0, 9)
        artist.clean(ax, "y")
        ax.set_xticks(normal.cycle)
        ax.legend(frameon=False, fontsize=9, loc="upper left")
    artist.save(fig, "06-no-poll-validation")


def benchmark_chart(artist, meta):
    ranking = pd.DataFrame(meta["benchmark"]["leaderboard"])
    fig, (ax,) = artist.canvas(
        "Which model had the lowest error?",
        "2018–2024 · equal weight per chamber and election",
        panel_height=5.1,
    )
    names = ranking.method.str.replace(" correction", "", regex=False).replace(
        {"Histogram-boosting": "Histogram boosting", "Huber-boosting": "Huber boosting"}
    )
    y = np.arange(len(ranking))
    colors = [artist.blue] + [artist.neutral] * (len(y) - 1)
    ax.hlines(y, 0, ranking.selection_mae_pp, color=colors, lw=1.4)
    ax.scatter(ranking.selection_mae_pp, y, c=colors, s=35, zorder=3)
    for yy, value in zip(y, ranking.selection_mae_pp):
        ax.text(value + 0.13, yy, f"{value:.2f}", va="center", fontsize=10)
    ax.set_yticks(y, names, fontsize=10 if artist.mobile else 11)
    ax.set(xlim=(0, 5.2), ylim=(len(y) - 0.4, -0.7), xlabel="Mean absolute error (pp)")
    artist.clean(ax)
    ax.set_xticks([0, 2, 4])
    fig.subplots_adjust(left=0.39 if artist.mobile else 0.25, right=0.98)
    artist.save(fig, "05-benchmark-comparison")


def render_figures(root, out, history, forecast, validation, scores, masked, meta):
    for dark, mobile in [(False, False), (True, False), (True, True)]:
        artist = Figures(out, root, dark, mobile)
        for chamber in ["house", "senate"]:
            national_map(artist, root, forecast, chamber)
            interval_chart(artist, forecast, chamber)
        artist.training(history)
        benchmark_chart(artist, meta)
        artist.validation(validation)
        artist.validation(validation, True)
        no_poll_chart(artist, scores, masked)
        artist.diagnostics(validation)


def article(root, out, history, forecast, validation, scores, masked, meta):
    from .audit import validation_benchmarks

    blocks = []

    def h(text, id):
        blocks.append({"type": "heading", "text": text, "id": id})

    def p(text):
        blocks.append({"type": "paragraph", "text": text})

    def f(slug, alt, caption):
        blocks.append({"type": "figure", "slug": slug, "alt": alt, "caption": caption})

    def eq(text, latex):
        blocks.append({"type": "equation", "text": text, "latex": latex})

    def table(frame, summary=None):
        frame = frame.astype(object).where(pd.notna(frame), "Not estimated")
        blocks.append(
            {
                "type": "table",
                "columns": list(frame.columns),
                "rows": frame.values.tolist(),
                "summary": summary,
            }
        )

    counts = forecast.groupby("chamber").projected_party.value_counts().unstack(fill_value=0)
    house, senate = counts.loc["house"], counts.loc["senate"]
    checks = validation_benchmarks(validation, meta["family"])
    fitted = checks[checks.method.eq(meta["family"])].set_index("chamber")
    fixed_count = int(forecast.fixed_party.notna().sum())
    benchmark = meta["benchmark"]
    ranking = pd.DataFrame(benchmark["leaderboard"])

    h("Model prediction", "model-prediction")
    p(
        f"The model gives Democrats {int(house.get('DEM', 0))} House seats and Republicans {int(house.get('REP', 0))}. Across the 35 Senate contests, it gives Democrats {int(senate.get('DEM', 0))} and Republicans {int(senate.get('REP', 0))}."
    )
    p(
        "I built this after Election Day using inputs dated November 2. These are retrospective estimates, not a forecast published before voting."
    )
    f(
        "2026-house-map",
        "House estimates covering all 435 districts across 50 states",
        "Colour shows which party leads in more districts within each state. Stripes mark a tie. The bar counts all 435 seats.",
    )
    f(
        "2026-senate-map",
        "Senate estimates for all 35 contests in 2026",
        "Grey states have no Senate election. The bar covers the 35 contests, not the full Senate.",
    )

    blocks.append({"type": "live"})
    h("Model description", "model-description")
    p(
        "I compared 13 model families. The best performer was a simple blend: 75% race polling and 25% partisan baseline. Without a matched poll, it uses the baseline alone."
    )
    p(
        "The model predicts the Democratic share of the two-party vote, excluding third-party votes:"
    )
    eq(
        "Democratic share of the Democratic and Republican vote",
        r"y_i = 100\,\frac{D_i}{D_i + R_i}",
    )
    p(
        "The baseline adds local presidential lean, ℓ, to the national Democratic generic-ballot share, q. Lean measures how far a district or state sits from the country. House figures use the relevant district boundaries:"
    )
    eq(
        "National generic ballot plus local presidential lean",
        r"b_i = \operatorname{clip}(q + \ell_i,\,0,\,100)",
    )
    p(
        "A matched race poll, p, receives three times the weight of the baseline:"
    )
    eq(
        "Poll and baseline blend with a fallback for unpolled races",
        r"\widehat y_i = \begin{cases}0.75p_i + 0.25b_i & \text{with a poll} \\ b_i & \text{without a poll}\end{cases}",
    )
    p(
        "I tested polling weights of 25%, 50%, 75% and 100%. Earlier-year tests selected 75% in every evaluated election and for the final model."
    )
    p(
        "Polls cover the preceding 90 days, with a 14-day half-life and square-root sample-size weighting. A pollster's total weight is capped at its strongest survey. Candidate questions must match the saved roster."
    )
    p(
        f"The training data contain {len(history):,} D/R races: {int(meta['training_by_chamber']['house']):,} House races from 2012–2024 and {int(meta['training_by_chamber']['senate']):,} Senate races from 2000–2024. Regression and tree models also used incumbency, election cycle and presidential party."
    )
    f(
        "01-training-years",
        "Historical races available for the model comparison, by year",
        "D/R races with the required inputs, with or without polling. Same-party contests, uncontested races and special elections are excluded.",
    )

    h("Comparing the models", "historical-validation")
    p(
        "The benchmark covers 13 families and 47 settings. I fixed the comparison rules before running it and ranked models by mean absolute error (MAE), in percentage points."
    )
    p(
        "For each test election, 2018, 2020, 2022 and 2024, models fit and tune on earlier years only. Tests on 2014 and 2016 provide the initial tuning history. Each election and chamber receives equal weight."
    )
    f(
        "05-benchmark-comparison",
        "Historical error for all 13 model families",
        "Average two-party vote-share error. Lower is better; blue marks the selected model. Each chamber and test election has equal weight.",
    )
    comparison = (
        ranking[["method", "selection_mae_pp", "house_mae_pp", "senate_mae_pp"]].copy().round(2)
    )
    comparison.columns = ["Model", "Overall MAE (pp)", "House MAE (pp)", "Senate MAE (pp)"]
    table(comparison, "Full benchmark results (13 models)")
    p(
        f"The blend has an average error of {benchmark['winner_mae_pp']:.2f} points, compared with {benchmark['baseline_mae_pp']:.2f} for the baseline, a reduction of {100 * benchmark['relative_improvement']:.1f}%. Most of that improvement comes from Senate races: 2.50 points versus 3.49. The House difference is much smaller, 2.63 versus 2.72."
    )
    p(
        "The blend loses to the baseline in both chambers in 2020. They tie in the 2024 House, where the saved inputs contain no race polls. The blend still ranks first when any one test election is removed, but four elections are a small sample."
    )
    p(
        f"I chose the winning family after seeing these scores. Choosing both the family and its settings from earlier years only gives {benchmark['sequential_selection_mae_pp']:.2f} points of error, rather than {benchmark['winner_mae_pp']:.2f}. These elections also informed earlier versions of the project, so neither score is an untouched final test."
    )
    p(
        f"Among close races, where the baseline predicts 45–55% Democratic support, the blend orders the candidates correctly in {100 * fitted.loc['house', 'close_d_r_order_accuracy']:.1f}% of {int(fitted.loc['house', 'close_n'])} House races and {100 * fitted.loc['senate', 'close_d_r_order_accuracy']:.1f}% of {int(fitted.loc['senate', 'close_n'])} Senate races. The baseline scores 81.3% and 63.2%. Every model uses the same subset; the Senate sample is small."
    )
    f(
        "02-historical-validation",
        "Predicted and actual Democratic two-party vote shares",
        "Past races predicted from earlier years. The diagonal marks exact predictions; outlined points put the candidates in the wrong order.",
    )
    f(
        "03-close-races",
        "Historical races where the simple baseline predicts 45 to 55 percent Democratic share",
        "Close races are selected by the baseline, not by actual results or the winning model.",
    )
    unpolled = (
        forecast[forecast.poll_dem_share.isna() & forecast.fixed_party.isna()]
        .groupby("chamber")
        .size()
    )
    p(
        f"With polling hidden, the blend becomes the baseline. It also uses the baseline for {int(unpolled.get('house', 0))} House races and {int(unpolled.get('senate', 0))} Senate races without matched polls in 2026."
    )
    f(
        "06-no-poll-validation",
        "Vote-share errors with available race polls and with polls withheld",
        "The same races and settings, with race polls available or withheld. RMSE weights large errors more heavily; it did not select the model.",
    )

    h("Race estimates and uncertainty", "race-estimates")
    p(
        "The ranges use earlier prediction errors, grouped by chamber and polling availability, with equal weight per election. Groups with fewer than two earlier cycles use the full chamber error history. Errors from 2014 and 2016 allow range checks to begin in 2018."
    )
    coverage = scores[scores.coverage_95.notna()][
        ["cycle", "chamber", "brier", "coverage_95"]
    ].copy()
    coverage["chamber"] = coverage.chamber.str.title()
    coverage["coverage_95"] = coverage.coverage_95.map(lambda x: f"{100 * x:.1f}%")
    coverage.columns = ["Election", "Chamber", "Brier score", "95% range coverage"]
    table(coverage.round(3), "Historical probability and range checks")
    p(
        "The 95% ranges contain more than 98% of House results in each test year, so they are wide rather than precisely calibrated. Brier scores assess the probability of a Democratic majority of the two-party vote. Neither check gives the chance of controlling Congress."
    )
    f(
        "2026-house-intervals",
        "Estimates for the 25 closest House races",
        "The closest 25 House races. All districts are listed below. Non-D/R shares refer to the first candidate shown against the selected opponent.",
    )
    f(
        "2026-senate-intervals",
        "Estimates for all 35 Senate contests",
        "Independent and ranked-choice races borrow D/R errors. These ranges are sensitivity checks, not validated candidate-win intervals.",
    )

    for chamber in ["senate", "house"]:
        g = forecast[forecast.chamber.eq(chamber)].sort_values("label").copy()
        for side in ["left", "right"]:
            g[f"{side}_candidate"] = g.apply(
                lambda row: (
                    f"{row[f'{side}_candidate']} ({row[f'{side}_party']})"
                    if pd.notna(row[f"{side}_candidate"])
                    else "No listed candidate"
                ),
                axis=1,
            )
        g["prediction"] = g.prediction.map(lambda x: f"{x:.1f}%" if pd.notna(x) else "From roster")
        g["range"] = g.apply(
            lambda row: (
                f"{row.lower_95:.1f}–{row.upper_95:.1f}%"
                if pd.notna(row.lower_95)
                else "Not estimated"
            ),
            axis=1,
        )
        frame = g[
            [
                "label",
                "left_candidate",
                "right_candidate",
                "prediction",
                "range",
                "projected_party",
                "input_basis",
                "race_kind",
            ]
        ]
        frame.columns = [
            "Race",
            "First candidate(s)",
            "Opponent(s)",
            "First side's share",
            "Error range",
            "Projected party",
            "Inputs",
            "Treatment",
        ]
        table(frame, f"{chamber.title()} predictions ({len(g)} races)")

    h("Ballot assumptions", "ballot-rules")
    p(
        f"In {fixed_count} House contests, all listed candidates belong to one party. Those seats are assigned from the roster, without estimating vote shares or choosing between same-party candidates."
    )
    p(
        "For independent or minor-party opponents, I borrow the missing major party's baseline and use matched polls where available. This assumption is not validated by D/R history, so candidate-win probabilities are left blank."
    )
    p(
        "Ranked-choice estimates describe first preferences, without simulating transfers. Louisiana House estimates combine candidates within each party and cannot identify a runoff winner."
    )

    h("Limitations", "data-and-limitations")
    p(
        "No 2026 outcomes enter fitting, model selection or calibration. The live comparison scores the fixed estimates separately. The November 2 cutoff relies on dates in files retrieved later; I cannot verify that every input was available in the same form before voting."
    )
    p(
        "Historical rosters come from election returns, and older polling archives selected the eventual top candidates. Some presidential percentages are rounded. The data do not recreate exactly what a forecaster knew at the time."
    )
    p(
        "The seat bars count which party leads each estimate. They do not model shared national errors or the probability of controlling Congress. The benchmark supports this blend on the saved data, not a claim that it is best for every election."
    )
    h("Error patterns", "residual-diagnostics")
    f(
        "10-residual-diagnostics",
        "Historical errors and normal Q-Q plots",
        "Positive errors mean Democratic support was underestimated. The Q-Q plots compare errors with a normal distribution.",
    )

    sources = [('Results', 'civicAPI', 'https://civicapi.org'),
 ('Results',
  'AP / ABC',
  'https://www.abc.net.au/news/2026-11-04/us-midterm-election-results-2026/107235570'),
 ('Election data',
  'Candidate roster',
  'https://clerk.house.gov/member_info/electionInfo/2026/120-nominations.pdf'),
 ('Election data', 'House returns', 'https://doi.org/10.7910/DVN/IG0UN2'),
 ('Election data', 'Senate returns', 'https://doi.org/10.7910/DVN/PEJ5QU'),
 ('Election data', 'Presidential returns', 'https://doi.org/10.7910/DVN/42MVDX'),
 ('Context',
  'District lean',
  'https://www.the-downballot.com/p/the-downballots-calculations-of-presidential'),
 ('Polling',
  'Historical archive',
  'https://github.com/fivethirtyeight/data/tree/master/pollster-ratings'),
 ('Polling', '2024 Senate', 'https://github.com/Jack-Whitcomb/All-US-Senate-polls-2006-2024'),
 ('Polling', '2026 House', 'https://www.nytimes.com/newsgraphics/polls/house.csv'),
 ('Polling', '2026 Senate', 'https://www.nytimes.com/newsgraphics/polls/senate.csv'),
 ('Context', 'Legislators', 'https://github.com/unitedstates/congress-legislators'),
 ('Context', 'Map boundaries', 'https://github.com/topojson/us-atlas'),
 ('Context',
  'Election rules',
  'https://www.sos.la.gov/elections-voting/how-candidates-are-elected')]
    payload = {
        "title": "Modelling the 2026 midterms",
        "date": "2026-11-08",
        "dateLabel": "8 Nov 2026",
        "note": "Written after Election Day",
        "blocks": blocks,
        "sources": [{"group": group, "label": label, "url": url} for group, label, url in sources],
        "reproducibility": "Code, saved inputs and benchmark results are included in this website's repository.",
    }
    assert "\u2014" not in json.dumps(payload, ensure_ascii=False)
    (out / "article.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    md = f"# {payload['title']}\n\n{payload['note']}\n\n"
    for block in blocks:
        kind = block["type"]
        if kind == "heading":
            md += f"## {block['text']}\n\n"
        elif kind == "paragraph":
            md += block["text"] + "\n\n"
        elif kind == "equation":
            md += "$$\n" + block["latex"] + "\n$$\n\n"
        elif kind == "figure":
            md += f"![{block['alt']}]({block['slug']}.png)\n\n{block['caption']}\n\n"
        elif kind == "table":
            md += (
                pd.DataFrame(block["rows"], columns=block["columns"]).to_html(index=False, border=0)
                + "\n\n"
            )
    md += "## Sources\n\n" + "\n".join(f"- [{label}]({url})" for _, label, url in sources) + "\n"
    (out / "midterms-model-blog.md").write_text(md, encoding="utf-8")
    return payload
