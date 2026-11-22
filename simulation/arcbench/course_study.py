"""Compare the two gripper strategies on the same seeded layouts."""

import json
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
from gripper_courses import GripperCourse


def trial(args):
    task, seed = args
    difficulty = 52 if task == "transfer" else 8
    course = GripperCourse(task, seed, 2, difficulty)
    row = dict(task=task, seed=seed, clearance_mm=2, difficulty_mm=difficulty)
    for method, precise in [("scripted", True), ("nominal", False)]:
        result = course.perform(precise)
        row[method] = {
            k: v for k, v in result.items() if k not in ("frames", "preview")
        }
    return row


if __name__ == "__main__":
    trials = [
        (task, seed) for task in ("transfer", "relay") for seed in range(751000, 751016)
    ]
    with ProcessPoolExecutor(4) as pool:
        rows = list(pool.map(trial, trials))
    out = Path(__file__).parent / "experiments" / "courses" / "pilot.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(rows, indent=2) + "\n", newline="\n")
    for task in ("transfer", "relay"):
        print(
            task,
            {
                key: sum(
                    r[key]["outcome"] == "reached" for r in rows if r["task"] == task
                )
                for key in ("scripted", "nominal")
            },
        )
