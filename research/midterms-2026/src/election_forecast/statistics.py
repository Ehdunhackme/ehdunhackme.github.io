"""Held-out evaluation and empirical calibration."""

import numpy as np
import pandas as pd


def score_predictions(actual, predicted, probability=None, lower=None, upper=None):
    actual, predicted = np.asarray(actual), np.asarray(predicted)
    residual = actual - predicted
    score = {
        "n": int(len(actual)),
        "mae_pp": float(np.abs(residual).mean()),
        "rmse_pp": float(np.sqrt(np.mean(residual**2))),
        "winner_accuracy": float(np.mean((actual > 50) == (predicted > 50))),
    }
    if probability is not None:
        probability = np.clip(np.asarray(probability), 1e-6, 1 - 1e-6)
        winner = (actual > 50).astype(float)
        score.update(
            {
                "brier": float(np.mean((probability - winner) ** 2)),
                "log_loss": float(
                    -np.mean(winner * np.log(probability) + (1 - winner) * np.log1p(-probability))
                ),
                "coverage_95": float(np.mean((actual >= lower) & (actual <= upper))),
                "interval_width_pp": float(np.mean(np.asarray(upper) - np.asarray(lower))),
            }
        )
    return score


def residual_distribution(history, predictions):
    """Equal weight per historical cycle; no current-cycle residuals allowed."""
    if len({row["cycle"] for row in history}) < 2:
        n = len(predictions)
        return np.full(n, np.nan), np.full(n, np.nan), np.full(n, np.nan)
    rows = pd.DataFrame(history)
    counts = rows.groupby("cycle")["error"].transform("size")
    weights = (1 / counts.to_numpy()) / rows["cycle"].nunique()
    errors = rows["error"].to_numpy()
    order = np.argsort(errors)
    quantiles = np.interp([0.025, 0.975], np.cumsum(weights[order]), errors[order])
    wins = ((np.asarray(predictions)[:, None] + errors) > 50) @ weights
    # Small finite-support smoothing prevents exact 0/1 empirical probabilities.
    smoothing = 0.5 / len(errors)
    probabilities = (wins + smoothing) / (1 + 2 * smoothing)
    return (
        probabilities,
        np.clip(predictions + quantiles[0], 0, 100),
        np.clip(predictions + quantiles[1], 0, 100),
    )


def calibrate(frame, values, residuals):
    probabilities, lower, upper = (
        np.full(len(frame), np.nan),
        np.full(len(frame), np.nan),
        np.full(len(frame), np.nan),
    )
    for chamber in ["house", "senate"]:
        for polled in [False, True]:
            idx = np.flatnonzero(
                frame.chamber.eq(chamber) & frame.poll_dem_share.notna().eq(polled)
            )
            pool = [r for r in residuals if r["chamber"] == chamber and r["polled"] == polled]
            if len({r["cycle"] for r in pool}) < 2:
                pool = [r for r in residuals if r["chamber"] == chamber]
            if len(idx):
                probabilities[idx], lower[idx], upper[idx] = residual_distribution(
                    pool, values[idx]
                )
    return probabilities, lower, upper
