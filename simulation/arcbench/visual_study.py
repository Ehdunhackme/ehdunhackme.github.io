"""Fit the two pose regressors, select ridge penalties on validation, then test in MuJoCo."""
import json
from concurrent.futures import ProcessPoolExecutor
import numpy as np
from nut_assembly import Assembly
from visual_pose import (ARTIFACTS, comparison_poses, estimate, mask_features, observation,
                         visual_run, weights)


def sample(seed):
    rng = np.random.default_rng(seed + 477)
    img, truth = observation(seed, int(rng.integers(48, 129)), int(rng.integers(1, 5)))
    return [mask_features(img, i) for i in (1, 2)], truth


def split(start, n):
    x, y = zip(*(sample(s) for s in range(start, start+n)))
    return np.array(x), np.array(y)


def train():
    x, y = split(811000, 1024)
    vx, vy = split(812100, 256)
    center, scale = x.mean(0), x.std(0).clip(.00001)
    prior = y.mean(0)
    coefs, penalties = [], []
    for i in range(2):
        z = (x[:,i]-center[i])/scale[i]
        val = (vx[:,i]-center[i])/scale[i]
        candidates = []
        for alpha in (.01, 1., 10., 100.):
            coef = np.linalg.solve(z.T @ z + alpha*np.eye(z.shape[1]), z.T @ (y[:,i]-prior[i]))
            residual = (prior[i] + val @ coef - vy[:,i]) * [1., 1., .025]
            candidates.append((np.mean(residual**2), alpha, coef))
        _, alpha, coef = min(candidates,key=lambda r:r[0])
        penalties.append(alpha)
        coefs.append(coef)
    ARTIFACTS.mkdir(exist_ok=True, parents=True)
    np.savez(ARTIFACTS/"model.npz",center=center,scale=scale,prior=prior,coef=coefs)
    return penalties


def trial(seed):
    model = weights()
    image, truth = observation(seed, 96, 2)
    predicted = estimate(image, model)
    bench = Assembly(seed, 2)
    row = {"seed":seed}
    coarse = estimate(observation(seed, 48, 2)[0], model)
    for task in ("pickup", "placement"):
        row[task] = {}
        controls = comparison_poses(task, predicted, model["prior"])
        controls["coarse"] = coarse
        for key, pose in controls.items():
            run = visual_run(bench, task, pose, truth, False)
            row[task][key] = {k:run[k] for k in ("outcome","pose_error_mm","lift_mm","held_s","seated_s")}
    return row


if __name__ == "__main__":
    penalties = train()
    with ProcessPoolExecutor(4) as pool:
        episodes = list(pool.map(trial, range(813000, 813032)))
    scores = {}
    for task in ("pickup", "placement"):
        scores[task] = {}
        for key in ("learned", "direct", "coarse"):
            runs = [row[task][key] for row in episodes]
            scores[task][key] = dict(success=sum(r["outcome"]=="reached" for r in runs),
                mean_pose_error_mm=round(float(np.mean([r["pose_error_mm"] for r in runs])),2))
    result = dict(train=1024, validation=256, test=len(episodes), ridge_penalties=penalties,
                  resolution=96, coarse_resolution=48, clearance_mm=2, scores=scores, episodes=episodes)
    (ARTIFACTS/"results.json").write_text(json.dumps(result, indent=2)+"\n",newline="\n")
    print(json.dumps(scores))
