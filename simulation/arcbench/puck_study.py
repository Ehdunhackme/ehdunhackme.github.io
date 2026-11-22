"""Fit a push selector from simulated contact outcomes, then score held-out layouts."""
import argparse
from concurrent.futures import ProcessPoolExecutor
from functools import lru_cache
import json
import numpy as np

from puck import PushBench, WEIGHTS, action_index, features, layout, simulate

ACTIONS = [[n,0] for n in (-36,-24,-12,0,12,24,36)]
STRAIGHT = ACTIONS.index([0,0])


@lru_cache(maxsize=1)
def engine():
    return PushBench()


def episode(job):
    seed, actions = job
    start, goal = layout(seed)
    values = {}
    for index in set(actions):
        run = simulate(engine(), start, goal, np.asarray(ACTIONS[index])/1000, False)
        values[index] = dict(error_mm=run["error_mm"], outcome=run["outcome"])
    return [values[index] for index in actions]


def fit(workers=8):
    train = range(311000,311192)
    val = range(312000,312048)
    test = range(313000,313064)
    with ProcessPoolExecutor(workers) as pool:
        all_choices = list(range(len(ACTIONS)))
        rows = list(pool.map(episode, ((s,all_choices) for s in [*train,*val]), chunksize=2))
        def cost(results):
            return [[min(r["error_mm"],100) + 100*(r["outcome"]=="contact") for r in row]
                    for row in results]
        model = dict(actions_mm=ACTIONS, features=[features(*layout(s)).tolist() for s in train],
                     costs=cost(rows[:len(train)]))
        vcost=np.array(cost(rows[len(train):]))
        candidates={}
        for k in [1,3,5,9,15]:
            model["neighbors"]=k
            choices=[action_index(model,features(*layout(s))) for s in val]
            candidates[k]=float(vcost[np.arange(len(val)),choices].mean())
        model["neighbors"]=min(candidates,key=candidates.get)
        fixed=int(vcost.mean(0).argmin())
        choices=[[action_index(model,features(*layout(s))),STRAIGHT,fixed] for s in test]
        records=list(pool.map(episode,zip(test,choices),chunksize=2))
    names=["learned","straight","fixed"]
    scores={name:dict(completed=sum(row[i]["outcome"]=="reached" for row in records),
                      mean_error_mm=round(float(np.mean([r[i]["error_mm"] for r in records])),2))
            for i,name in enumerate(names)}
    report=dict(train=len(train),validation=len(val),test=len(test),neighbors=model["neighbors"],
                validation_cost_mm=candidates,fixed_action_mm=ACTIONS[fixed],scores=scores)
    WEIGHTS.parent.mkdir(exist_ok=True,parents=True)
    def save(path,value):
        path.write_bytes((json.dumps(value,separators=(",",":"),allow_nan=False)+"\n").encode())
    save(WEIGHTS,model)
    save(WEIGHTS.with_name("results.json"),report)
    save(WEIGHTS.with_name("episodes.json"),[dict(seed=s,actions=ch,**dict(zip(names,row)))
                                              for s,ch,row in zip(test,choices,records)])
    print(json.dumps(report,indent=2))


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--workers",type=int,default=8)
    fit(parser.parse_args().workers)
