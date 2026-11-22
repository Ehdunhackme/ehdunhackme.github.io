"""Reproduce the shelf experiment with disjoint scene seeds and paired aperture tests."""
import argparse
from concurrent.futures import ProcessPoolExecutor
from functools import lru_cache
import json
from pathlib import Path
import numpy as np
from shelf import ShelfBench,WIDTHS,rollout
from shelf_policy import describe,choose

ROOT=Path(__file__).resolve().parent
OUT=ROOT/"experiments/shelf"

@lru_cache(maxsize=1)
def bench():
    return ShelfBench()

def sample(setting):
    seed,width,depth=setting
    b=bench()
    x,p,paths=describe(b,int(seed),int(width),int(depth))
    clear=np.array([not b.hits(path) for path in paths])
    return x,p,clear

def settings(start,n,paired=False):
    rows=[]
    for seed in range(start,start+n):
        rng=np.random.default_rng(seed+78000)
        depth=int(rng.integers(45,106))
        widths=WIDTHS if paired else [int(rng.integers(85,191))]
        rows.extend((seed,w,depth) for w in widths)
    return np.array(rows)

def generate(workers):
    OUT.mkdir(parents=True,exist_ok=True)
    with ProcessPoolExecutor(workers) as pool:
        for split,params in [("train",(410000,1600)),("validation",(510000,240)),("test",(610000,96,True))]:
            cases=settings(*params)
            x,p,clear=map(np.stack,zip(*pool.map(sample,cases,chunksize=5)))
            np.savez_compressed(OUT/f"{split}.npz",cases=cases,x=x,p=p,clear=clear)
            print(split,len(cases),flush=True)

def train():
    import torch
    from torch import nn
    tr=np.load(OUT/"train.npz");va=np.load(OUT/"validation.npz")
    x=tr["x"];mean=x.reshape(-1,x.shape[-1]).mean(0);scale=x.reshape(-1,x.shape[-1]).std(0).clip(.008)
    device=torch.device("cuda")
    tx=torch.tensor((x-mean)/scale,device=device);ty=torch.tensor(~tr["clear"],device=device,dtype=torch.float32)
    results=[];best=np.inf
    for width in (48,96):
        torch.manual_seed(7231)
        net=nn.Sequential(nn.Linear(x.shape[-1],width),nn.ReLU(),nn.Linear(width,width),nn.ReLU(),nn.Linear(width,1)).to(device)
        optim=torch.optim.AdamW(net.parameters(),lr=.0015)
        for _ in range(1100):
            ids=torch.randint(len(tx),(128,),device=device)
            loss=nn.functional.binary_cross_entropy_with_logits(net(tx[ids])[:,:,0],ty[ids])
            optim.zero_grad();loss.backward();optim.step()
        weights={"mean":mean,"scale":scale}
        for i,module in enumerate(net[::2]):
            weights[f"w{i}"]=module.weight.detach().cpu().numpy().T;weights[f"b{i}"]=module.bias.detach().cpu().numpy()
        selected=choose(weights,va["x"],va["p"]);rows=np.arange(len(selected))
        cost=np.where(va["clear"],va["p"],1)[rows,selected].mean()
        results.append(dict(width=width,cost=float(cost),goals=int(va["clear"][rows,selected].sum())))
        if cost<best:
            best=cost;winner=width;np.savez_compressed(OUT/"model.npz",**weights)
    (OUT/"selection.json").write_text(json.dumps(dict(winner=winner,seed=7231,device=torch.cuda.get_device_name(),trials=results),indent=2))
    print(results,flush=True)

def execute_case(job):
    case,methods=job
    results={}
    for i in set(methods.values()):
        run=rollout(bench(),*map(int,case),int(i),detail=False)
        results[i]=dict(outcome=run["outcome"],seconds=run["seconds"],hold=run["inspection_held"])
    return {k:results[i] for k,i in methods.items()}

def evaluate(workers):
    test=np.load(OUT/"test.npz");val=np.load(OUT/"validation.npz")
    fixed=int(np.where(val["clear"],val["p"],1).mean(0).argmin())
    net=choose(np.load(OUT/"model.npz"),test["x"],test["p"]);cases=test["cases"]
    methods=[dict(direct=0,fixed=fixed,learned=int(i)) for i in net]
    with ProcessPoolExecutor(workers) as pool:rolls=list(pool.map(execute_case,zip(cases,methods),chunksize=3))
    rows=[]
    for i,(case,roll) in enumerate(zip(cases,rolls)):
        rows.append(dict(seed=int(case[0]),width=int(case[1]),depth=int(case[2]),chosen=int(net[i]),
                         old_count=int(test["clear"][i,:13].sum()),clear_count=int(test["clear"][i].sum()),
                         execution=roll))
    (OUT/"episodes.json").write_text(json.dumps(rows))
    summarize(rows,fixed)


def summarize(rows,fixed):
    by_width=[]
    for width in WIDTHS:
        subset=[r for r in rows if r["width"]==width]
        by_width.append(dict(width=width,n=len(subset),legacy_feasible=sum(r["old_count"]>0 for r in subset),
                             feasible=sum(r["clear_count"]>0 for r in subset),
                             median_candidates=float(np.median([r["clear_count"] for r in subset])),
                             **{k:sum(r["execution"][k]["outcome"]=="reached" for r in subset)
                                for k in ("direct","fixed","learned")}))
    # Resample entire layouts to keep the three correlated aperture results together.
    deltas={}
    for r in rows:
        execution=r["execution"]
        delta=int(execution["learned"]["outcome"]=="reached")-int(execution["fixed"]["outcome"]=="reached")
        deltas.setdefault(r["seed"],[]).append(delta)
    paired=np.array([np.mean(vals) for vals in deltas.values()])
    rng=np.random.default_rng(9374)
    samples=paired[rng.integers(len(paired),size=(20000,len(paired)))].mean(axis=1)
    report=dict(test_seeds=len(paired),method_case_comparisons=len(rows)*3,
                distinct_servo_runs=sum(len({0,fixed,r["chosen"]}) for r in rows),
                fixed=fixed,by_width=by_width,
                learned_minus_fixed=dict(mean=float(paired.mean()),interval95=np.quantile(samples,[.025,.975]).tolist(),
                                         bootstrap_seed=9374,resamples=20000),
                selection=json.loads((OUT/"selection.json").read_text()))
    (OUT/"results.json").write_bytes((json.dumps(report,indent=2)+"\n").encode("utf-8"))
    print(report,flush=True)


if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("stage",choices=["generate","train","evaluate","report","all"]);p.add_argument("--workers",type=int,default=8)
    a=p.parse_args()
    if a.stage in ("generate","all"):generate(a.workers)
    if a.stage in ("train","all"):train()
    if a.stage in ("evaluate","all"):evaluate(a.workers)
    if a.stage=="report":
        val=np.load(OUT/"validation.npz")
        fixed=int(np.where(val["clear"],val["p"],1).mean(0).argmin())
        summarize(json.loads((OUT/"episodes.json").read_text()),fixed)
