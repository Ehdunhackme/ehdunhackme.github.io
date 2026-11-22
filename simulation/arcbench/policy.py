"""Portable inference for the trained path ranker."""
import numpy as np

def length_penalty(tasks):
    from arm import OFFSETS
    from kinematics import limits
    u=np.linspace(0,1,25,dtype=np.float32)
    q=tasks[:,None,None,:5]+(tasks[:,None,None,6:11]-tasks[:,None,None,:5])*u[None,None,:,None]
    q=np.repeat(q,len(OFFSETS),axis=1)
    q[:,:,:,1:4]+=OFFSETS[None,:,None,:]*np.sin(np.pi*u)[None,None,:,None]**2
    q=np.clip(q,limits[:,0],limits[:,1])
    length=np.linalg.norm(np.diff(q,axis=2),axis=-1).sum(2)
    return np.clip(.12*(length/length[:,:1]-1),0,.45)


def features(tasks, recipe):
    tasks = np.atleast_2d(tasks).astype(np.float32)
    if recipe=="shared":
        from arm import OFFSETS
        from kinematics import sparse_features
        local=sparse_features(tasks)
        n=len(OFFSETS)
        scans=local[:,:5*n].reshape(len(tasks),n,5)
        context=features(tasks,"relative")
        parts=[np.broadcast_to(context[:,None,:],(len(tasks),n,context.shape[1])),
               np.broadcast_to(OFFSETS,(len(tasks),n,3)),scans,local[:,5*n:,None],
               scans.min(2,keepdims=True),length_penalty(tasks)[:,:,None]]
        return np.concatenate(parts,axis=2).astype(np.float32)
    x = tasks[:, :18]
    if recipe in ("relative","skeleton"):
        a,b,center,size = x[:, :6],x[:, 6:12],x[:, 12:15],x[:,15:18]
        radius = np.hypot(center[:,0]-.0388353,center[:,1])
        bearing = np.arctan2(-center[:,1],center[:,0]-.0388353)
        span = b[:,0]-a[:,0]
        fraction = np.clip((bearing-a[:,0])/np.where(abs(span)>.01,span,1),0,1)
        between = a + fraction[:,None]*(b-a)
        x=np.column_stack([x,radius,bearing,fraction,between[:,1:4],center[:,2]-size[:,2],center[:,2]+size[:,2]])
    if recipe=="skeleton":
        from kinematics import sparse_features
        x=np.column_stack([x,sparse_features(tasks)])
    return x.astype(np.float32)


def predict(model,tasks):
    x=(features(tasks,str(model["recipe"]))-model["mean"])/model["scale"]
    for i in range(int(model["layers"])):
        x=x@model[f"w{i}"]+model[f"b{i}"]
        if i+1<int(model["layers"]):
            x=np.maximum(x,0)
    if str(model["recipe"])=="shared":
        risk=1/(1+np.exp(-np.clip(x[:,:,0],-40,40)))
        x=risk+(1-risk)*length_penalty(np.atleast_2d(tasks))
    return x.argmin(1)

