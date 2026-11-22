"""Fixed task splits and score for SO-101 path ranking. Costs are lower-is-better."""
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
import argparse
import os
import numpy as np
from arm import Bench, ROOT

SPLITS = {"train": (12000,4096), "validation": (82000,640), "test": (182000,800)}
_worker = None


def make_sample(seed):
    global _worker
    if _worker is None:
        _worker = Bench()
    task = _worker.draw_task(seed)
    clear,length = _worker.measure(task, 81)
    return task, clear, length


def path_cost(clear,length):
    excess = np.maximum(0, length/np.maximum(length[:, :1],1e-8)-1)
    return np.where(clear, np.minimum(.45, .12*excess), 1.0)


def score(prediction, clear, length):
    rows=np.arange(len(prediction))
    cost=path_cost(clear,length)
    return {"cost":float(cost[rows,prediction].mean()),
            "success":float(clear[rows,prediction].mean()),
            "mean_joint_length_rad":float(length[rows,prediction].mean()),
            "tasks":len(rows)}


if __name__ == "__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--workers",type=int,default=min(8,os.cpu_count() or 1))
    args=p.parse_args()
    out=ROOT/"data";out.mkdir(exist_ok=True)
    with ProcessPoolExecutor(args.workers) as pool:
        for split,(start,count) in SPLITS.items():
            dest=out/f"{split}.npz"
            samples=list(pool.map(make_sample,range(start,start+count),chunksize=12))
            tasks,clear,length=map(np.stack,zip(*samples))
            temp=dest.with_suffix(".tmp.npz")
            np.savez_compressed(temp,tasks=tasks,clear=clear,length=length,seeds=np.arange(start,start+count))
            temp.replace(dest)
            print(split,count,flush=True)

