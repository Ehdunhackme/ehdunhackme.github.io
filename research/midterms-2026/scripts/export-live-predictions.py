"""Export the frozen forecast for the browser. Never reads observed outcomes."""

from pathlib import Path
import csv
import hashlib
import json

root = Path(__file__).resolve().parents[1]
source = root / "results/2026-estimates.csv"
rows = list(csv.DictReader(source.open(encoding="utf-8")))
races = [
    {
        "id": r["race_id"],
        "label": r["label"],
        "chamber": r["chamber"],
        "state": r["state"],
        "party": r["projected_party"],
        "share": float(r["prediction"]) if r["prediction"] else None,
        "kind": r["race_kind"],
        "fixed": bool(r["fixed_party"]),
        "left": r["left_candidate"],
        "right": r["right_candidate"],
        "baseline": min(100, max(0, float(r["partisan_lean"]) + float(r["generic_dem_share"]))),
    }
    for r in rows
]
payload = {
    "version": 1,
    "recordedOn": "2026-11-08",
    "inputCutoff": "2026-11-02",
    "sha256": hashlib.sha256(source.read_bytes().replace(b"\r\n", b"\n")).hexdigest(),
    "races": races,
}
(root / "website/live/predictions.json").write_text(
    json.dumps(payload, separators=(",", ":"), ensure_ascii=False) + "\n", encoding="utf-8"
)
print(f"Exported {len(races)} fixed model estimates")
