"""Learned candidate ranking for the full shelf geometry."""
import numpy as np
from kinematics import skeleton
from shelf import candidates,scene

def describe(b,seed,width,depth):
    start,end,approach,goal,boxes=scene(b,seed,width,depth)
    paths=candidates(b,start,end,approach,81)
    samples=paths[:,::10,:5]
    links=skeleton(samples.reshape(-1,5)).reshape(len(paths),9,6,3)
    a=links[:,:,1:-1];z=links[:,:,2:]
    points=np.concatenate([a,.5*(a+z),z],axis=2)
    delta=np.abs(points[:,:,:,None,:]-boxes[None,None,None,:,:3])-boxes[None,None,None,:,3:]
    dist=np.linalg.norm(np.maximum(delta,0),axis=-1)+np.minimum(delta.max(-1),0)
    clearance=dist.min(2)-.024
    length=np.linalg.norm(np.diff(paths,axis=1),axis=2).sum(1)
    penalty=np.clip(.12*(length/length[0]-1),0,.45)
    context=np.r_[start[:5],end[:5],approach[1:4],width/1000,depth/1000,boxes[0,:3]-goal]
    features=np.column_stack([np.broadcast_to(context,(len(paths),len(context))),
                              np.eye(len(paths)),clearance.reshape(len(paths),-1),penalty])
    return features.astype(np.float32),penalty.astype(np.float32),paths

def choose(weights,features,penalty):
    x=(features-weights["mean"])/weights["scale"]
    for i in range(3):
        x=x@weights[f"w{i}"]+weights[f"b{i}"]
        if i<2:x=np.maximum(x,0)
    risk=1/(1+np.exp(-np.clip(x[...,0],-40,40)))
    return (risk+(1-risk)*penalty).argmin(axis=-1)
