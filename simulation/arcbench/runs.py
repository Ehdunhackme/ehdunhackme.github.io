"""Local SO-101 studio and closed-loop MuJoCo position-servo replay."""
from functools import lru_cache
import json
from threading import Lock
import mujoco
import numpy as np
from arm import ROOT, Bench, FAMILIES
from policy import predict

SCENES=[("Low fence",700000,0),("Tall post",700007,1),("Overhead zone",700007,2)]
SHELF_SEED=720001
SHELF_EXAMPLES=[("Roof clearance",SHELF_SEED,110,75),
                ("Learned route succeeds",610002,180,102),
                ("Fixed route succeeds",610014,125,97)]
lock=Lock()

@lru_cache(maxsize=1)
def engine():
    b=Bench()
    b.m.opt.integrator=mujoco.mjtIntegrator.mjINT_IMPLICITFAST
    entry=json.loads((ROOT/"experiments/champion.json").read_text())
    return b,np.load(ROOT/f"experiments/{entry['tag']}/model.npz")

def execute(b,task,choice):
    trajectory=b.paths(task,1501)[choice]
    target=b.tip_at(task[6:12])
    preview=np.array([b.tip_at(q) for q in trajectory[::15]])
    mujoco.mj_resetData(b.m,b.d)
    b.set_fixture(task);b.d.qpos[:]=task[:6];b.d.ctrl[:]=task[:6]
    mujoco.mj_forward(b.m,b.d)
    frames=[];outcome="miss";collision=False;distance=0.;contact_point=None;contact_link=None
    last=b.d.site_xpos[b.tip].copy()
    for step in range(1851):
        if step:
            b.d.ctrl[:]=trajectory[min(step,1500)]
            mujoco.mj_step(b.m,b.d)
            pair=next((c for c in b.d.contact if c.dist<=0 and (
                (int(c.geom1) in b.arm_geoms and int(c.geom2) in b.obstacles|b.arm_geoms) or
                (int(c.geom2) in b.arm_geoms and int(c.geom1) in b.obstacles)
            )),None)
            collision=pair is not None
            if collision:
                contact_point=pair.pos.copy().tolist()
                link=pair.geom1 if int(pair.geom1) in b.arm_geoms else pair.geom2
                contact_link=b.m.body(b.m.geom_bodyid[link]).name
        if step%12==0 or collision or step==1850:
            mujoco.mj_kinematics(b.m,b.d)
            tip=b.d.site_xpos[b.tip].copy()
            distance+=float(np.linalg.norm(tip-last));last=tip
            error=float(np.linalg.norm(tip-target))
            poses=np.column_stack([b.d.xpos[1:8],b.d.xquat[1:8]])
            frames.append([round(step*b.m.opt.timestep,4),np.round(tip,6).tolist(),
                           np.round(poses,6).reshape(-1).tolist(),np.round(b.d.qpos,5).tolist()])
            if collision:
                outcome="contact";break
            if step>=1500 and error<=.008:
                outcome="reached";break
    return dict(choice=int(choice),outcome=outcome,frames=frames,seconds=frames[-1][0],
                error_mm=round(error*1000,1),distance_mm=round(distance*1000),
                contact_point=contact_point,contact_link=contact_link,preview=preview.round(6).tolist())

@lru_cache(maxsize=3)
def replay(seed,family,offset,angle):
    with lock:
        b,model=engine()
        task=b.draw_task(seed,family)
        task[13]+=offset/1000;task[6]+=np.deg2rad(angle)
        task[6]=np.clip(task[6],*b.m.jnt_range[0])
        b.set_fixture(task)
        if b.hits([task[:6],task[6:12]]):
            raise ValueError("A fixture intersects an endpoint. Reduce the offset or target angle.")
        selected=int(predict(model,task[None])[0])
        goal=b.tip_at(task[6:12]);start=b.tip_at(task[:6])
        learned=execute(b,task,selected)
        direct=execute(b,task,0) if selected else learned
        return dict(family=FAMILIES[family],seed=seed,fixture=task[12:18].tolist(),goal=goal.tolist(),
                    start=start.tolist(),learned=learned,direct=direct)

@lru_cache(maxsize=1)
def shelf_engine():
    from shelf import ShelfBench
    return ShelfBench(),np.load(ROOT/"experiments/shelf/model.npz")

@lru_cache(maxsize=2)
def shelf_replay(seed,width,depth):
    from shelf import PANELS,scene,rollout
    from shelf_policy import describe,choose
    with lock:
        b,model=shelf_engine()
        start,_,_,goal,boxes=scene(b,seed,width,depth)
        features,penalty,_=describe(b,seed,width,depth)
        selected=int(choose(model,features,penalty))
        learned=rollout(b,seed,width,depth,selected)
        direct=rollout(b,seed,width,depth,0) if selected else learned
        fixed_choice=json.loads((ROOT/"experiments/shelf/results.json").read_text())["fixed"]
        fixed=learned if selected==fixed_choice else rollout(b,seed,width,depth,fixed_choice)
        return dict(family="Shelf inspection",seed=seed,width=width,depth=depth,fixed=fixed,
                    panels=[dict(name=name,box=box.tolist()) for name,box in zip(PANELS,boxes)],
                    start=b.tip_at(start).tolist(),goal=goal.tolist(),learned=learned,direct=direct)


@lru_cache(maxsize=3)
def puck_replay(seed,distance):
    from puck import replay as push
    with lock:
        return push(seed,distance)
