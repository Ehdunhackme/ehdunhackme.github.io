"""Reproduce the final model and publication artifacts."""

from pathlib import Path
import argparse
import hashlib
import json
import sys
from importlib.metadata import version

import joblib
import pandas as pd

from .model import run
from .benchmark import run_benchmark
from .audit import validation_benchmarks
from .report import article, render_figures
from .statistics import score_predictions


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["build", "benchmark"])
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument(
        "--skip-figures",
        action="store_true",
        help="Fit and validate without rebuilding publication figures",
    )
    args = parser.parse_args()
    root = args.root.resolve()
    out = root / "reports"
    out.mkdir(exist_ok=True)
    hashes = json.loads((root / "data/snapshot-sha256.json").read_text())
    for relative, digest in hashes.items():
        if hashlib.sha256((root / relative).read_bytes()).hexdigest() != digest:
            raise ValueError(f"Frozen input changed: {relative}")
    history = pd.read_csv(root / "data/frozen/training-data.csv")
    target = pd.read_csv(root / "data/frozen/2026-feature-snapshots.csv")
    benchmark = run_benchmark(root)
    if args.command == "benchmark":
        print(benchmark["leaderboard"].to_string(index=False))
        return
    print(f"Applying benchmark winner to {len(target)} target contests", flush=True)
    forecast, validation, scores, masked, residuals, meta, model = run(history, target, benchmark)
    policy = []
    for (cycle, chamber, family), group in benchmark["sequential-selection"].groupby(
        ["cycle", "chamber", "family"]
    ):
        policy.append(
            {
                "cycle": int(cycle),
                "chamber": chamber,
                "family": family,
                "params": group.params.iloc[0],
                **score_predictions(group.dem_share, group.prediction),
            }
        )
    pd.DataFrame(policy).to_csv(out / "benchmark/selection-policy.csv", index=False)
    selected = {
        k: meta[k]
        for k in ["family", "family_id", "params", "kind", "cutoff", "2026_outcomes_used"]
    }
    selected["scores"] = {k: v for k, v in meta["benchmark"].items() if not isinstance(v, list)}
    (out / "selected-model.json").write_text(
        json.dumps(selected, indent=2) + "\n", encoding="utf-8"
    )
    validation_benchmarks(validation, meta["family"]).to_csv(
        out / "validation-benchmarks.csv", index=False
    )
    for frame, name in [
        (history, "training-data.csv"),
        (target, "2026-feature-snapshots.csv"),
        (forecast, "2026-estimates.csv"),
        (validation, "historical-predictions.csv"),
        (scores, "historical-cycle-scores.csv"),
        (masked, "masked-poll-scores.csv"),
    ]:
        frame.to_csv(out / name, index=False)
    history.groupby(["chamber", "cycle"]).size().rename("races").to_csv(
        out / "training-coverage.csv"
    )
    joblib.dump(model, out / "selected-model.joblib")
    if not args.skip_figures:
        render_figures(root, out, history, forecast, validation, scores, masked, meta)
        article(root, out, history, forecast, validation, scores, masked, meta)
    meta["coverage"] = forecast.groupby("chamber").size().to_dict()
    meta["python"] = sys.version
    meta["packages"] = {
        name: version(name) for name in ["numpy", "pandas", "scipy", "scikit-learn", "matplotlib"]
    }
    inputs = (
        list((root / "src").glob("**/*.py"))
        + list((root / "data").glob("**/*.csv"))
        + list((root / "assets").glob("**/*"))
    )
    meta["input_and_code_sha256"] = {
        str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
        for p in inputs
        if p.is_file()
    }
    (out / "run.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    (out / "residuals.json").write_text(json.dumps(residuals, indent=2) + "\n", encoding="utf-8")
    print(forecast.groupby(["chamber", "projected_party"]).size().to_string(), flush=True)
    print(
        "Saved results to reports/. Run npm run article to build the self-contained web article.",
        flush=True,
    )


if __name__ == "__main__":
    main()
