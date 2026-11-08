"""Retrieve public raw sources only when they match the recorded snapshot."""

from pathlib import Path
import hashlib
import json
from urllib.request import Request, urlopen

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / "data/sources.json").read_text())
for relative, record in manifest.items():
    destination = root / relative
    if destination.exists():
        payload = destination.read_bytes()
    else:
        request = Request(record["url"], headers={"User-Agent": "US-election-research/1.0"})
        with urlopen(request, timeout=45) as response:
            payload = response.read()
    if hashlib.sha256(payload).hexdigest() != record["sha256"]:
        raise ValueError(f"Source changed: {relative}. Retain the frozen feature snapshots.")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(payload)
    print(relative)
