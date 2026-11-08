"""Compare held-out forecasts with a fixed, unfitted benchmark."""

import numpy as np
import pandas as pd

from .statistics import score_predictions


def validation_benchmarks(validation, model_name="Poll/baseline blend"):
    rows = []
    for chamber, group in validation.groupby("chamber"):
        # Local presidential lean is already relative to the national share.
        baseline = np.clip(group.partisan_lean + group.generic_dem_share, 0, 100)
        close = baseline.between(45, 55)
        for method, values in [(model_name, group.prediction), ("Simple baseline", baseline)]:
            scores = score_predictions(group.dem_share, values)
            close_scores = score_predictions(group.loc[close, "dem_share"], values[close])
            rows.append(
                {
                    "chamber": chamber,
                    "method": method,
                    **scores,
                    "close_n": int(close.sum()),
                    "close_mae_pp": close_scores["mae_pp"],
                    "close_d_r_order_accuracy": close_scores["winner_accuracy"],
                }
            )
    return pd.DataFrame(rows)
