"""Decode the pinned Census-derived map geometry."""

import numpy as np
from matplotlib.path import Path


def state_paths(topology):
    """Decode quantized TopoJSON, preserving ring orientation and polygon holes."""
    transform = topology["transform"]
    arcs = [
        np.cumsum(arc, axis=0) * transform["scale"] + transform["translate"]
        for arc in topology["arcs"]
    ]
    for geometry in topology["objects"]["states"]["geometries"]:
        polygons = geometry["arcs"] if geometry["type"] == "MultiPolygon" else [geometry["arcs"]]
        vertices, codes, outer_rings = [], [], []
        for polygon in polygons:
            for i, ring in enumerate(polygon):
                parts = [arcs[a] if a >= 0 else arcs[~a][::-1] for a in ring]
                points = np.concatenate([a[:-1] for a in parts] + [parts[-1][-1:]])
                vertices.extend(points)
                codes.extend([Path.MOVETO] + [Path.LINETO] * (len(points) - 2) + [Path.CLOSEPOLY])
                if i == 0:
                    outer_rings.append(points)
        yield geometry["id"], Path(vertices, codes), outer_rings


def label_center(rings):
    def area(ring):
        return np.sum(ring[:-1, 0] * ring[1:, 1] - ring[1:, 0] * ring[:-1, 1]) / 2

    ring = max(rings, key=lambda r: abs(area(r)))
    cross = ring[:-1, 0] * ring[1:, 1] - ring[1:, 0] * ring[:-1, 1]
    return np.sum((ring[:-1] + ring[1:]) * cross[:, None], axis=0) / (6 * area(ring))
