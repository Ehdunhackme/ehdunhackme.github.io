"""Supervised planar pose estimates from synthetic overhead segmentation masks."""
import base64
from functools import lru_cache
from pathlib import Path

import numpy as np
from nut_assembly import Assembly, BOARD, DECK, HALF_HEIGHT, HOLE, NUT_BOXES, layout

ARTIFACTS = Path(__file__).resolve().parent / "experiments/visual-pose"
FIELD = .230
LEFT, TOP = .12, .105


def observation(seed, pixels, clearance):
    """Orthographic object-only masks. The simulator supplies labels during training."""
    start, yaw, goal, peg_yaw = layout(seed)
    axis = (np.arange(pixels) + .5) * FIELD / pixels
    x, y = np.meshgrid(LEFT + axis, TOP - axis)
    image = np.zeros((pixels, pixels), dtype=np.uint8)
    for color, xy, angle, boxes in (
        (1, start, yaw, NUT_BOXES),
        (2, goal, peg_yaw, [([0, 0], [HOLE-clearance/1000]*2)]),
    ):
        dx, dy = x - xy[0], y - xy[1]
        u = np.cos(angle)*dx + np.sin(angle)*dy
        v = -np.sin(angle)*dx + np.cos(angle)*dy
        for center, half in boxes:
            image[(abs(u-center[0]) <= half[0]) & (abs(v-center[1]) <= half[1])] = color
    return image, np.array([[*start, yaw], [*goal, peg_yaw]])


def mask_features(image, color):
    row, col = np.nonzero(image == color)
    x = (col + .5)/image.shape[1]
    y = (row + .5)/image.shape[0]
    # Moments retain the orientation of the handle and the square peg.
    u, v = x-x.mean(), y-y.mean()
    radius = np.sqrt(np.mean(u*u + v*v))
    u, v = u/radius, v/radius
    moments = [np.mean(u**i * v**(degree-i)) for degree in (2, 3, 4)
               for i in range(degree+1)]
    return np.array([x.mean(), y.mean(), *moments])


@lru_cache(maxsize=1)
def weights():
    with np.load(ARTIFACTS/"model.npz") as raw:
        return dict(raw)


def estimate(image, model, pickup_only=False):
    output = model["prior"].copy()
    for i in range(1 if pickup_only else 2):
        features = mask_features(image, i+1)
        scaled = (features - model["center"][i]) / model["scale"][i]
        output[i] += scaled @ model["coef"][i]
    return output


def visual_run(bench, task, predicted, truth, detailed):
    def waypoint(pose):
        return np.r_[pose[:2], DECK+HALF_HEIGHT], pose[2]
    pickup = task == "pickup"
    run = bench.rollout(detailed=detailed, grasp_pose=waypoint(predicted[0]),
                        place_pose=waypoint(predicted[1]), pickup_only=pickup)
    run["outcome"] = "reached" if run["reached"] else "miss"
    target_index = 0 if pickup else 1
    position_error = predicted[target_index,:2] - truth[target_index,:2]
    run["pose_error_mm"] = round(float(1000*np.linalg.norm(position_error)), 2)
    if detailed:
        tips = np.array([frame[1] for frame in run["frames"]])
        run["distance_mm"] = round(1000*np.linalg.norm(np.diff(tips, axis=0), axis=1).sum())
    return run


def comparison_poses(task, predicted, prior):
    baseline = prior.copy()
    if task == "placement":
        # Both controllers make exactly the same image-guided pickup.
        baseline[0] = predicted[0]
    return {"learned": predicted, "direct": baseline}


@lru_cache(maxsize=3)
def visual_replay(task, seed, pixels=96, clearance=2):
    image, truth = observation(seed, pixels, clearance)
    model = weights()
    if task == "pickup":
        image[image == 2] = 0
    poses = comparison_poses(task, estimate(image, model, task=="pickup"), model["prior"])
    bench = Assembly(seed, clearance)
    runs = {name: visual_run(bench, task, prediction, truth, True)
            for name, prediction in poses.items()}
    return dict(seed=seed, family=task, board=BOARD, goal=bench.goal.tolist(),
                assembly=dict(boxes=NUT_BOXES, peg_half=bench.peg_half, peg_height=.032,
                              peg_yaw=bench.peg_yaw, deck=DECK),
                observation=dict(size=pixels, mask=base64.b64encode(image.tobytes()).decode()),
                **runs)
