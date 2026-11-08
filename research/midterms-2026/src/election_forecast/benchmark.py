"""Fixed-grid chronological comparison. Never uses target-election outcomes."""

from dataclasses import dataclass
import hashlib
import json
from importlib.metadata import version
from pathlib import Path
import warnings

import numpy as np
import pandas as pd
from sklearn.ensemble import (
    ExtraTreesRegressor,
    GradientBoostingRegressor,
    HistGradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.exceptions import ConvergenceWarning
from sklearn.impute import SimpleImputer
from sklearn.linear_model import BayesianRidge, ElasticNet, HuberRegressor, Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR

from . import legacy
from .statistics import score_predictions

SEED = 20261108
YEARS = (2014, 2016, 2018, 2020, 2022, 2024)
EVALUATION_YEARS = (2018, 2020, 2022, 2024)
FAMILIES = {
    "baseline": ("Simple baseline", [{}]),
    "poll_blend": ("Poll/baseline blend", [{"poll_weight": w} for w in [0.25, 0.5, 0.75, 1.0]]),
    "legacy_elastic": ("Direct elastic net", legacy.OPTIONS),
    "direct_ridge": ("Direct ridge", [{"alpha": a} for a in [1, 10, 100, 1000]]),
    "residual_ridge": ("Ridge correction", [{"alpha": a} for a in [1, 10, 100, 1000]]),
    "residual_elastic": (
        "Elastic-net correction",
        [{"alpha": a, "l1_ratio": r} for a in [0.01, 0.1, 1.0] for r in [0.2, 0.8]],
    ),
    "residual_huber": (
        "Huber correction",
        [{"epsilon": e, "alpha": a} for e in [1.35, 1.75] for a in [1, 100]],
    ),
    "residual_bayes": ("Bayesian-ridge correction", [{}]),
    "residual_forest": (
        "Random-forest correction",
        [{"min_samples_leaf": n, "max_depth": 6} for n in [10, 25, 50]],
    ),
    "residual_extra": (
        "Extra-trees correction",
        [{"min_samples_leaf": n, "max_depth": 6} for n in [10, 25, 50]],
    ),
    "residual_hist": (
        "Histogram-boosting correction",
        [
            {"max_leaf_nodes": leaves, "l2_regularization": l2}
            for leaves in [7, 15]
            for l2 in [1, 10]
        ],
    ),
    "residual_boost": ("Huber-boosting correction", [{"max_depth": depth} for depth in [1, 2, 3]]),
    "residual_svr": (
        "Support-vector correction",
        [{"C": c, "epsilon": e} for c in [1, 10] for e in [0.5, 1.0]],
    ),
}


def baseline(frame):
    return np.clip((frame.partisan_lean + frame.generic_dem_share).to_numpy(), 0, 100)


def design(frame, mask_polls=False):
    x = legacy.design(frame, mask_polls)
    for column in [
        "national_environment",
        "midterm",
        "president_party",
        "poll_deviation",
        "has_poll",
    ]:
        x["senate_" + column] = x.senate * x[column]
    return x


def estimator(family, params):
    if family in {"direct_ridge", "residual_ridge"}:
        return Ridge(**params)
    if family == "residual_elastic":
        return ElasticNet(**params, max_iter=50000, tol=1e-5)
    if family == "residual_huber":
        return HuberRegressor(**params, max_iter=3000, tol=1e-5)
    if family == "residual_bayes":
        return BayesianRidge(max_iter=1000)
    if family in {"residual_forest", "residual_extra"}:
        cls = RandomForestRegressor if family == "residual_forest" else ExtraTreesRegressor
        return cls(**params, n_estimators=160, max_features=1.0, random_state=SEED, n_jobs=1)
    if family == "residual_hist":
        return HistGradientBoostingRegressor(
            **params,
            max_iter=160,
            learning_rate=0.05,
            min_samples_leaf=25,
            early_stopping=False,
            random_state=SEED,
        )
    if family == "residual_boost":
        return GradientBoostingRegressor(
            **params,
            n_estimators=120,
            learning_rate=0.05,
            min_samples_leaf=20,
            loss="huber",
            random_state=SEED,
        )
    if family == "residual_svr":
        return SVR(**params, kernel="rbf", gamma="scale")
    raise ValueError(family)


@dataclass
class FittedModel:
    family: str
    params: dict
    regressor: object = None
    imputer: object = None
    scaler: object = None

    def predict(self, frame, mask_polls=False):
        base = baseline(frame)
        if self.family == "baseline":
            return base
        if self.family == "poll_blend":
            poll = frame.poll_dem_share.to_numpy()
            use_poll = np.isfinite(poll) & (not mask_polls)
            return np.clip(
                np.where(use_poll, base + self.params["poll_weight"] * (poll - base), base), 0, 100
            )
        if self.family == "legacy_elastic":
            return legacy.predict(self.regressor, frame, mask_polls)
        x = self.scaler.transform(self.imputer.transform(design(frame, mask_polls)))
        values = self.regressor.predict(x)
        if self.family.startswith("residual_"):
            values = base + values
        if not np.isfinite(values).all():
            raise ValueError("Nonfinite model estimate")
        return np.clip(values, 0, 100)


def fit(train, family, params):
    model = FittedModel(family, dict(params))
    if family in {"baseline", "poll_blend"}:
        return model
    if family == "legacy_elastic":
        model.regressor = legacy.fit(train, params)
        return model
    polled = train[train.poll_dem_share.notna()]
    frames = pd.concat([train, polled], ignore_index=True)
    x = pd.concat([design(train), design(polled, True)], ignore_index=True)
    original_weight = len(train) / (2 * train.groupby("chamber").chamber.transform("size"))
    weight = np.concatenate(
        [
            original_weight * np.where(train.poll_dem_share.notna(), 0.5, 1.0),
            original_weight.loc[polled.index] * 0.5,
        ]
    )
    y = frames.dem_share.to_numpy()
    if family.startswith("residual_"):
        y = y - baseline(frames)
    model.imputer = SimpleImputer(strategy="median", keep_empty_features=True).fit(design(train))
    imputed = model.imputer.transform(x)
    model.scaler = StandardScaler().fit(imputed, sample_weight=weight)
    model.regressor = estimator(family, params)
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always", ConvergenceWarning)
        model.regressor.fit(model.scaler.transform(imputed), y, sample_weight=weight)
    if any(issubclass(w.category, ConvergenceWarning) for w in caught):
        raise RuntimeError(f"Convergence failed: {family} {params}")
    return model


def balanced_mae(frame):
    return float(
        frame.assign(error=(frame.dem_share - frame.prediction).abs())
        .groupby(["cycle", "chamber"])
        .error.mean()
        .mean()
    )


def choose_config(scores, family, before_year):
    previous = scores[(scores.family == family) & (scores.cycle < before_year)]
    if previous.empty:
        return 0
    return int(previous.groupby("config").mae_pp.mean().sort_values(kind="stable").index[0])


def evaluate(history, families=None, progress=True):
    families = FAMILIES if families is None else families
    assert history.cycle.max() <= 2024
    assert (history.presidential_source_year < history.cycle).all()
    predictions, score_rows = [], []
    for year in YEARS:
        train = history[history.cycle < year].copy()
        test = history[history.cycle == year].copy()
        if test.empty:
            continue
        previous_scores = pd.DataFrame(
            score_rows, columns=["family", "config", "cycle", "chamber", "mae_pp", "rmse_pp"]
        )
        for family, (name, grid) in families.items():
            selected = choose_config(previous_scores, family, year)
            for config, params in enumerate(grid):
                model = fit(train, family, params)
                values = model.predict(test)
                for chamber in ["house", "senate"]:
                    mask = test.chamber.eq(chamber)
                    metrics = score_predictions(test.loc[mask, "dem_share"], values[mask])
                    score_rows.append(
                        {
                            "family": family,
                            "config": config,
                            "cycle": year,
                            "chamber": chamber,
                            "mae_pp": metrics["mae_pp"],
                            "rmse_pp": metrics["rmse_pp"],
                        }
                    )
                if config == selected:
                    rows = test.copy()
                    rows["prediction"] = values
                    rows["masked_prediction"] = model.predict(test, True)
                    rows["baseline_prediction"] = baseline(test)
                    rows["family"], rows["method"] = family, name
                    rows["config"], rows["params"] = config, json.dumps(params, sort_keys=True)
                    rows["trained_through"] = int(train.cycle.max())
                    predictions.append(rows)
            if progress:
                print(f"{year} | {name} | {len(grid)} settings", flush=True)
    return pd.concat(predictions, ignore_index=True), pd.DataFrame(score_rows)


def summarize(predictions, config_scores, families=None):
    families = FAMILIES if families is None else families
    evaluated = predictions[predictions.cycle.isin(EVALUATION_YEARS)]
    leaderboard, chamber_rows, cycle_rows = [], [], []
    for family, (name, _) in families.items():
        rows = evaluated[evaluated.family.eq(family)]
        by_chamber = {}
        for chamber, g in rows.groupby("chamber"):
            metrics = score_predictions(g.dem_share, g.prediction)
            close = g[g.baseline_prediction.between(45, 55)]
            metrics["close_n"] = len(close)
            metrics["close_order_accuracy"] = (
                score_predictions(close.dem_share, close.prediction)["winner_accuracy"]
                if len(close)
                else np.nan
            )
            metrics["mae_equal_cycles"] = balanced_mae(g)
            chamber_rows.append({"family": family, "method": name, "chamber": chamber, **metrics})
            by_chamber[chamber] = metrics["mae_equal_cycles"]
        leaderboard.append(
            {
                "family": family,
                "method": name,
                "selection_mae_pp": balanced_mae(rows),
                "house_mae_pp": by_chamber["house"],
                "senate_mae_pp": by_chamber["senate"],
                "final_config": choose_config(config_scores, family, 2026),
            }
        )
        for (year, chamber), g in rows.groupby(["cycle", "chamber"]):
            cycle_rows.append(
                {
                    "family": family,
                    "method": name,
                    "cycle": int(year),
                    "chamber": chamber,
                    **score_predictions(g.dem_share, g.prediction),
                }
            )
    leaderboard = (
        pd.DataFrame(leaderboard)
        .sort_values("selection_mae_pp", kind="stable")
        .reset_index(drop=True)
    )
    policy = []
    for year in EVALUATION_YEARS:
        prior = predictions[predictions.cycle < year]
        family = min(families, key=lambda key: balanced_mae(prior[prior.family.eq(key)]))
        rows = predictions[predictions.cycle.eq(year) & predictions.family.eq(family)].copy()
        rows["selection_scope"] = "earlier cycles only"
        policy.append(rows)
    sensitivity = []
    for omitted in EVALUATION_YEARS:
        candidates = evaluated[evaluated.cycle.ne(omitted)]
        family = min(families, key=lambda key: balanced_mae(candidates[candidates.family.eq(key)]))
        sensitivity.append(
            {"omitted_cycle": omitted, "family": family, "method": families[family][0]}
        )
    return (
        leaderboard,
        pd.DataFrame(chamber_rows),
        pd.DataFrame(cycle_rows),
        pd.concat(policy, ignore_index=True),
        pd.DataFrame(sensitivity),
    )


def fingerprint(root):
    inputs = [root / "data/frozen/training-data.csv"] + [
        Path(__file__).with_name(name) for name in ["benchmark.py", "legacy.py", "statistics.py"]
    ]
    payload = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs}
    payload["packages"] = {p: version(p) for p in ["numpy", "pandas", "scikit-learn", "scipy"]}
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()


def run_benchmark(root, force=False):
    out = root / "reports/benchmark"
    out.mkdir(parents=True, exist_ok=True)
    key = fingerprint(root)
    manifest = out / "manifest.json"
    if not force and manifest.exists() and json.loads(manifest.read_text())["fingerprint"] == key:
        print("Using verified benchmark cache", flush=True)
    else:
        history = pd.read_csv(root / "data/frozen/training-data.csv")
        predictions, config_scores = evaluate(history)
        leaderboard, chambers, cycles, policy, sensitivity = summarize(predictions, config_scores)
        for name, frame in [
            ("predictions", predictions),
            ("config-scores", config_scores),
            ("leaderboard", leaderboard),
            ("chamber-scores", chambers),
            ("cycle-scores", cycles),
            ("sequential-selection", policy),
            ("leave-one-cycle-out", sensitivity),
        ]:
            frame.to_csv(out / f"{name}.csv", index=False)
        manifest.write_text(
            json.dumps(
                {
                    "fingerprint": key,
                    "family_count": len(FAMILIES),
                    "configuration_count": sum(len(grid) for _, grid in FAMILIES.values()),
                    "grid": FAMILIES,
                    "seed": SEED,
                    "selection_metric": "MAE, equal weight per election and chamber",
                    "evaluation_years": EVALUATION_YEARS,
                    "sequential_selection_mae": balanced_mae(policy),
                },
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
    return {
        name: pd.read_csv(out / f"{name}.csv")
        for name in [
            "predictions",
            "config-scores",
            "leaderboard",
            "chamber-scores",
            "cycle-scores",
            "sequential-selection",
            "leave-one-cycle-out",
        ]
    }
