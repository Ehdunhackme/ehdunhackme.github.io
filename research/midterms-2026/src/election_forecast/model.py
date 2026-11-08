"""Apply the benchmark winner and calibrate with its earlier-cycle errors."""

from __future__ import annotations

import numpy as np
import pandas as pd

from .benchmark import FAMILIES, EVALUATION_YEARS, balanced_mae, evaluate, fit, summarize
from .statistics import calibrate, score_predictions


def run(history, target, benchmark=None):
    assert history.cycle.max() < target.cycle.min()
    assert history.cycle.max() <= 2024
    assert "dem_share" not in target
    if benchmark is None:
        predictions, config_scores = evaluate(history)
        leaderboard, chambers, cycles, policy, sensitivity = summarize(predictions, config_scores)
        benchmark = dict(
            zip(
                [
                    "predictions",
                    "leaderboard",
                    "chamber-scores",
                    "cycle-scores",
                    "sequential-selection",
                    "leave-one-cycle-out",
                ],
                [predictions, leaderboard, chambers, cycles, policy, sensitivity],
            )
        )
    winner = benchmark["leaderboard"].iloc[0]
    family = winner.family
    params = FAMILIES[family][1][int(winner.final_config)]
    model = fit(history, family, params)
    selected = benchmark["predictions"].loc[lambda x: x.family.eq(family)]
    validations, scores, masked_scores, residuals = [], [], [], []
    for year, rows in selected.groupby("cycle", sort=True):
        rows = rows.copy()
        probability, lower, upper = calibrate(rows, rows.prediction.to_numpy(), residuals)
        rows["p_dem_two_party_majority"] = probability
        rows["lower_95"], rows["upper_95"] = lower, upper
        if year in EVALUATION_YEARS:
            validations.append(rows)
            for chamber, g in rows.groupby("chamber"):
                args = (
                    (g.p_dem_two_party_majority, g.lower_95, g.upper_95)
                    if g.p_dem_two_party_majority.notna().all()
                    else ()
                )
                scores.append(
                    {
                        "cycle": int(year),
                        "chamber": chamber,
                        **score_predictions(g.dem_share, g.prediction, *args),
                    }
                )
                masked_scores.append(
                    {
                        "cycle": int(year),
                        "chamber": chamber,
                        **score_predictions(g.dem_share, g.masked_prediction),
                    }
                )
        residuals.extend(
            {
                "cycle": int(year),
                "chamber": r.chamber,
                "polled": bool(pd.notna(r.poll_dem_share)),
                "error": float(r.dem_share - r.prediction),
            }
            for r in rows.itertuples()
        )
    forecast = target.copy()
    forecast["prediction"] = model.predict(target)
    p, lo, hi = calibrate(target, forecast.prediction.to_numpy(), residuals)
    forecast["p_dem_two_party_majority"], forecast["lower_95"], forecast["upper_95"] = p, lo, hi
    forecast["projected_party"] = np.where(
        forecast.prediction.gt(50), forecast.left_party, forecast.right_party
    )
    forecast["projected_candidate"] = np.where(
        forecast.prediction.gt(50), forecast.left_candidate, forecast.right_candidate
    )
    for party in ["DEM", "REP"]:
        fixed = forecast.fixed_party.eq(party)
        forecast.loc[fixed, ["prediction", "lower_95", "upper_95", "p_dem_two_party_majority"]] = (
            np.nan
        )
        forecast.loc[fixed, "projected_party"] = party
        forecast.loc[fixed, "projected_candidate"] = forecast.loc[
            fixed, "left_candidate" if party == "DEM" else "right_candidate"
        ]
    forecast.loc[forecast.race_kind.ne("D/R"), "p_dem_two_party_majority"] = np.nan
    base_score = benchmark["leaderboard"].set_index("family").loc["baseline", "selection_mae_pp"]
    meta = {
        "family": FAMILIES[family][0],
        "family_id": family,
        "params": params,
        "training_rows": len(history),
        "training_by_chamber": history.groupby("chamber").size().to_dict(),
        "training_years": {
            c: sorted(map(int, g.cycle.unique())) for c, g in history.groupby("chamber")
        },
        "benchmark": {
            "family_count": len(FAMILIES),
            "configuration_count": sum(len(g) for _, g in FAMILIES.values()),
            "selection_metric": "MAE, equal weight per election and chamber",
            "winner_mae_pp": float(winner.selection_mae_pp),
            "baseline_mae_pp": float(base_score),
            "relative_improvement": float(1 - winner.selection_mae_pp / base_score),
            "sequential_selection_mae_pp": balanced_mae(benchmark["sequential-selection"]),
            **{
                name: benchmark[name].to_dict("records")
                for name in ["leaderboard", "chamber-scores", "cycle-scores", "leave-one-cycle-out"]
            },
        },
        "calibration": "Same family's earlier-cycle errors by chamber and availability of polling",
        "kind": "retrospective_development_benchmark",
        "cutoff": "2026-11-02",
        "2026_outcomes_used": False,
    }
    return (
        forecast,
        pd.concat(validations),
        pd.DataFrame(scores),
        pd.DataFrame(masked_scores),
        residuals,
        meta,
        model,
    )
