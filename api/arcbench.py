"""Run the published SO-101 models on a visitor's chosen layout."""
import json
import os
from http.server import BaseHTTPRequestHandler
from pathlib import Path
import sys
from urllib.parse import parse_qs, urlsplit

os.environ["MUJOCO_GL"] = "disable"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "simulation" / "arcbench"))

from runs import puck_replay, replay, shelf_replay


def simulate(query):
    def integer(key, default, low, high):
        raw = query.get(key, [str(default)])
        if len(raw) != 1 or len(raw[0]) > 12:
            raise ValueError(f"Invalid {key}.")
        try:
            value = int(raw[0])
        except ValueError:
            raise ValueError(f"Choose an integer for {key}.") from None
        if not low <= value <= high:
            raise ValueError(f"Choose {key} between {low} and {high}.")
        return value

    family = integer("family", 4, 0, 4)
    seed = integer("seed", 2402, 0, 2**31 - 1)
    if family == 4:
        return puck_replay(seed, integer("distance", 60, 45, 77))
    if family == 3:
        return shelf_replay(seed, integer("width", 110, 85, 190), integer("depth", 75, 45, 105))
    return replay(seed, family, integer("offset", 0, -55, 55), integer("angle", 0, -18, 18))


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            data = simulate(parse_qs(urlsplit(self.path).query, keep_blank_values=True, max_num_fields=7))
            status = 200
        except (ValueError, RuntimeError) as exc:
            data, status = {"error": str(exc)}, 400
        body = json.dumps(data, separators=(",", ":"), allow_nan=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "public, max-age=86400, s-maxage=604800" if status == 200 else "no-store")
        self.end_headers()
        self.wfile.write(body)
