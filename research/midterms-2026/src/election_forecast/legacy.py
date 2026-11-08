"""Previous direct elastic-net fitting routine, retained as a benchmark competitor."""

from __future__ import annotations

import warnings

import numpy as np
import pandas as pd
from sklearn.exceptions import ConvergenceWarning
from sklearn.impute import SimpleImputer
from sklearn.linear_model import ElasticNet
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler


FEATURES = [
    "partisan_lean",
    "national_environment",
    "dem_incumbent",
    "rep_incumbent",
    "midterm",
    "president_party",
    "senate",
    "senate_lean",
    "senate_dem_incumbent",
    "senate_rep_incumbent",
    "poll_deviation",
    "has_poll",
]
OPTIONS = [{"alpha": a, "l1_ratio": r} for a in [0.01, 0.1, 1.0] for r in [0.2, 0.8]]


def design(frame, mask_polls=False):
    x = frame.copy()
    x["senate"] = x.chamber.eq("senate").astype(float)
    x["national_environment"] = x.generic_dem_share - 50
    for field in ["partisan_lean", "dem_incumbent", "rep_incumbent"]:
        target = "senate_lean" if field == "partisan_lean" else "senate_" + field
        x[target] = x.senate * x[field]
    x["has_poll"] = (x.poll_dem_share.notna() & ~np.full(len(x), mask_polls)).astype(float)
    # A missing poll contributes no polling adjustment. It is never replaced by
    # the national median race poll, which would make safe seats look competitive.
    x["poll_deviation"] = np.where(
        x.has_poll.eq(1), x.poll_dem_share - (50 + x.partisan_lean + x.national_environment), 0.0
    )
    return x[FEATURES]


def fit(train, params):
    polled = train[train.poll_dem_share.notna()]
    x = pd.concat([design(train), design(polled, mask_polls=True)], ignore_index=True)
    y = np.concatenate([train.dem_share.to_numpy(), polled.dem_share.to_numpy()])
    # Each race has total weight one. Polled races appear once with polling and
    # once without it, so this same model learns both information settings.
    weight = np.concatenate(
        [np.where(train.poll_dem_share.notna(), 0.5, 1.0), np.full(len(polled), 0.5)]
    )
    pipeline = make_pipeline(
        SimpleImputer(strategy="median", keep_empty_features=True),
        StandardScaler(),
        ElasticNet(**params, max_iter=50000, tol=1e-5),
    )
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        pipeline.fit(x, y, elasticnet__sample_weight=weight)
    if any(issubclass(w.category, ConvergenceWarning) for w in caught):
        raise RuntimeError("Elastic net did not converge")
    return pipeline


def predict(model, frame, mask_polls=False):
    values = np.clip(model.predict(design(frame, mask_polls)), 0, 100)
    if not np.isfinite(values).all():
        raise ValueError("Nonfinite forecast")
    return values
