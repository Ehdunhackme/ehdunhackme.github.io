"""Editable autoresearch experiment. The evaluator, task distribution and splits are fixed."""
import argparse
import csv
import hashlib
import json
from pathlib import Path
import time

import numpy as np
import torch
from torch import nn
from arm import ROOT
from policy import features, predict, length_penalty
from prepare import path_cost, score

UPDATES = 1000
BATCH = 256


def train(tag,recipe,width,depth,loss_kind,trace=False):
    if trace and recipe != "shared":
        raise ValueError("The collision-loss trace requires the shared classifier.")
    started=time.monotonic()
    base=ROOT/"experiments"
    dest=base/tag
    if not tag.replace("-","").isalnum() or dest.exists():
        raise ValueError("Use a fresh alphanumeric trial tag")
    dest.mkdir(parents=True)
    torch.manual_seed(6401)
    device=torch.device("cuda" if torch.cuda.is_available() else "cpu")
    train_data=np.load(ROOT/"data/train.npz")
    val=np.load(ROOT/"data/validation.npz")
    x=features(train_data["tasks"],recipe)
    flat=x.reshape(-1,x.shape[-1])
    mean=flat.mean(0);scale=flat.std(0).clip(.02)
    X=torch.tensor((x-mean)/scale,device=device)
    y=torch.tensor(path_cost(train_data["clear"],train_data["length"]),device=device,dtype=torch.float32)
    dims=[x.shape[-1]]+[width]*depth+[1 if recipe=="shared" else y.shape[1]]
    parts=[]
    for i in range(len(dims)-1):
        parts.append(nn.Linear(dims[i],dims[i+1]))
        if i<depth: parts.append(nn.ReLU())
    model=nn.Sequential(*parts).to(device)
    optimizer=torch.optim.AdamW(model.parameters(),lr=.002)
    if trace:
        validation_x = torch.tensor((features(val["tasks"], recipe) - mean) / scale, device=device)
        validation_y = torch.tensor(~val["clear"], dtype=torch.float32, device=device)
        train_y = (y > .9).float()
        rows = []

        @torch.no_grad()
        def record(update):
            def full_loss(inputs, targets):
                logits = model(inputs)[..., 0]
                return nn.functional.binary_cross_entropy_with_logits(logits, targets).item()
            rows.append((update, full_loss(X, train_y), full_loss(validation_x, validation_y)))

        record(0)
    for step in range(UPDATES):
        ix=torch.randint(len(X),(BATCH,),device=device)
        output=model(X[ix])
        if recipe=="shared":
            loss=nn.functional.binary_cross_entropy_with_logits(output[:,:,0],(y[ix]>.9).float())
        elif loss_kind=="weighted":
            # Emphasize wrongly optimistic predictions on collisions and differences among clear paths.
            difference=output-y[ix]
            weights=1+2*((y[ix]>.9)&(difference<0)).float()+2*(y[ix]<.4).float()
            loss=(difference.square()*weights).mean()
        else:
            loss=(output-y[ix]).square().mean()
        optimizer.zero_grad();loss.backward();optimizer.step()
        if trace and (step + 1) % 25 == 0:
            record(step + 1)
    if trace:
        with (dest / "curve.csv").open("w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(["update", "train_bce", "validation_bce"])
            writer.writerows(rows)
    weights=dict(recipe=np.array(recipe),mean=mean,scale=scale,layers=np.array(len(dims)-1))
    for i,layer in enumerate(m for m in parts if isinstance(m,nn.Linear)):
        weights[f"w{i}"]=layer.weight.detach().cpu().numpy().T
        weights[f"b{i}"]=layer.bias.detach().cpu().numpy()
    selected=predict(weights,val["tasks"])
    with torch.no_grad():
        test_x=torch.tensor((features(val["tasks"],recipe)-mean)/scale,device=device)
        value=model(test_x)
        if recipe=="shared":
            risk=value[:,:,0].sigmoid()
            penalty=torch.tensor(length_penalty(val["tasks"]),device=device)
            value=risk+(1-risk)*penalty
        np.testing.assert_array_equal(selected,value.argmin(1).cpu().numpy())
    result=dict(tag=tag,recipe=recipe,width=width,depth=depth,loss="bce_logits" if recipe=="shared" else loss_kind,updates=UPDATES,
                batch=BATCH,seed=6401,device=torch.cuda.get_device_name(0) if device.type=="cuda" else "CPU",
                seconds=round(time.monotonic()-started,2),validation=score(selected,val["clear"],val["length"]))
    np.savez_compressed(dest/"model.npz",**weights)
    for name in ("train.py","policy.py","kinematics.py"):
        (dest/name).write_bytes((ROOT/name).read_bytes())
    result["source_hash"]=hashlib.sha256(b"".join((dest/name).read_bytes() for name in ("train.py","policy.py","kinematics.py"))).hexdigest()
    (dest/"result.json").write_text(json.dumps(result,indent=2))
    champion=base/"champion.json"
    previous=json.loads(champion.read_text()) if champion.exists() else None
    keep=previous is None or result["validation"]["cost"]<previous["validation"]["cost"]
    if keep:
        temporary=champion.with_suffix(".tmp")
        temporary.write_text(json.dumps(result,indent=2));temporary.replace(champion)
    log=base/"results.tsv"
    if not log.exists():log.write_text("trial\tvalidation_cost\tclear_rate\tstatus\n")
    with log.open("a") as f:f.write(f"{tag}\t{result['validation']['cost']:.6f}\t{result['validation']['success']:.6f}\t{'keep' if keep else 'discard'}\n")
    print(json.dumps(result),flush=True)


if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("tag")
    p.add_argument("--recipe",choices=("raw","relative","skeleton","shared"),default="raw")
    p.add_argument("--width",type=int,default=32)
    p.add_argument("--depth",type=int,default=1)
    p.add_argument("--loss",choices=("mse","weighted"),default="mse")
    p.add_argument("--trace", action="store_true", help="record full-split collision loss every 25 updates")
    a=p.parse_args();train(a.tag,a.recipe,a.width,a.depth,a.loss,a.trace)

