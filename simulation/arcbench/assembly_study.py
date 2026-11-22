"""Paired physics pilot of the frozen waypoint controller on fresh layouts."""

from concurrent.futures import ProcessPoolExecutor
import json
from pathlib import Path
from nut_assembly import Assembly


def evaluate(setting):
    seed, clearance = setting
    bench = Assembly(seed, clearance)
    row = {"seed": seed, "clearance_mm": clearance}
    for name, gripping, recheck in [
        ("scripted", True, True),
        ("nominal", True, False),
        ("open", False, True),
    ]:
        run = bench.rollout(gripping, recheck=recheck)
        row[name] = {
            key: value for key, value in run.items() if key not in ("frames", "seconds")
        }
    return row


if __name__ == "__main__":
    settings = [(seed, gap) for gap in (3, 1) for seed in range(741000, 741032)]
    with ProcessPoolExecutor(6) as pool:
        rows = list(pool.map(evaluate, settings))
    path = Path(__file__).parent / "experiments" / "assembly" / "pilot.json"
    path.parent.mkdir(exist_ok=True)
    path.write_text(json.dumps(rows, indent=2) + "\n")
    for gap in (3, 1):
        sample = [row for row in rows if row["clearance_mm"] == gap]
        for method in ("scripted", "nominal", "open"):
            print(
                gap,
                method,
                {
                    k: sum(r[method][k] for r in sample)
                    for k in ("pinched", "lifted", "reached")
                },
            )
