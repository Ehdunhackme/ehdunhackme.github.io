"""Five-panel shelf inspection, candidate motions and measured servo clearances."""
from functools import lru_cache
import numpy as np
import mujoco
from scipy.optimize import least_squares
from arm import Bench

PANELS=("Deck","Left wall","Right wall","Roof","Back wall")
EXTRA=("left_wall","right_wall","roof","back_wall")
WIDTHS=(180,125,90)
DEFAULT_WIDTH=110
DEFAULT_DEPTH=75


class ShelfBench(Bench):
    def __init__(self):
        super().__init__(EXTRA)
        self.panel_ids=[self.fixture,*[self.m.geom(n).id for n in EXTRA]]
        self.m.opt.integrator=mujoco.mjtIntegrator.mjINT_IMPLICITFAST


def solve_pose(b,x,z,tilt=0):
    """Solve a level approach in the arm's vertical plane."""
    def residual(angles):
        q=np.r_[0.,angles,0.,.24]
        tip=b.tip_at(q)
        direction=tip-b.d.body("gripper").xpos
        return np.array([tip[0]-x,tip[2]-z,.10*(np.arctan2(direction[2],direction[0])-tilt)])
    fit=least_squares(residual,[-.4,.65,-.4],bounds=(b.m.jnt_range[1:4,0],b.m.jnt_range[1:4,1]),
                      max_nfev=60,gtol=1e-9)
    return np.r_[0.,fit.x,0.,.24]


@lru_cache(maxsize=256)
def _geometry(seed,depth):
    b=ik_bench()
    rng=np.random.default_rng(seed)
    x,z=rng.uniform(.34,.39),rng.uniform(.15,.218)
    end=solve_pose(b,x,z,rng.uniform(-.09,.09))
    goal=b.tip_at(end);front=goal[0]-depth/1000
    approach=solve_pose(b,front-.030,goal[2])
    start=np.r_[rng.choice([-1.,1.])*rng.uniform(.68,1.12),rng.uniform(-.52,.26),
                rng.uniform(-.25,.32),rng.uniform(-.50,.35),rng.uniform(-.36,.36),.24]
    return start,end,approach,goal,front,rng.uniform(-.014,.014),rng.uniform(.120,.152)

@lru_cache(maxsize=1)
def ik_bench():
    return Bench()

def scene(b,seed,width,depth):
    start,end,approach,goal,front,bias,height=_geometry(seed,depth)
    y=goal[1]+bias;z=goal[2];half=width/2000
    rear=goal[0]+.052;middle=(front+rear)/2;length=(rear-front)/2
    low=z-height/2;high=z+height/2;t=.006
    boxes=np.array([[middle,y,low/2,length,half+2*t,low/2],
                    [middle,y+half+t,z,length,t,height/2],
                    [middle,y-half-t,z,length,t,height/2],
                    [middle,y,high+t,length,half+2*t,t],
                    [rear+t,y,z,t,half+2*t,height/2]])
    for geom,box in zip(b.panel_ids,boxes):b.place_box(geom,box[:3],box[3:])
    return start,end,approach,goal,boxes

def phased(waypoints, times, n):
    t=np.linspace(0,1,n)
    segment=np.searchsorted(times[1:-1],t,side="right")
    u=(t-times[segment])/(times[segment+1]-times[segment])
    u=u*u*(3-2*u)
    return waypoints[segment]+(waypoints[segment+1]-waypoints[segment])*u[:,None]

def candidates(b,start,end,approach,n):
    one_stage=b.paths(np.r_[start,end],n)
    entries=[]
    for lift in (-.38,0.,.38):
        for retreat in (0.,-.35):
            # Fold before rotating, align at the mouth, then insert.
            fold=approach.copy();fold[0]=start[0];fold[1]+=retreat;fold[2]+=lift
            align=fold.copy();align[0]=end[0]
            poses=np.clip(np.stack([start,fold,align,approach,end]),*b.m.jnt_range.T)
            entries.append(phased(poses,np.array([0.,.23,.52,.68,1.]),n))
    return np.concatenate([one_stage,entries])

def closest(b):
    pair=np.zeros(6);distance=.8;link=panel=None;points=None
    for g in b.arm_geoms:
        for name,o in zip(PANELS,b.panel_ids):
            # Bounding spheres reject only pairs that cannot improve the current minimum.
            lower=np.linalg.norm(b.d.geom_xpos[g]-b.d.geom_xpos[o])-b.m.geom_rbound[g]-b.m.geom_rbound[o]
            if lower>=distance:continue
            # Use a bound larger than this workspace. A tightly clipped native GJK
            # query can terminate without a valid pair of surface witnesses.
            d=mujoco.mj_geomDistance(b.m,b.d,g,o,1.5,pair)
            if abs(abs(d)-np.linalg.norm(pair[:3]-pair[3:]))>.0005:
                continue
            if d<distance:
                distance=d;link=b.m.body(b.m.geom_bodyid[g]).name;panel=name;points=pair.copy()
    if points is None:
        raise RuntimeError("The simulator could not measure the nearest shelf surfaces.")
    return dict(mm=round(distance*1000,2),link=link,panel=panel,
                points=points.reshape(2,3).round(6).tolist())

def rollout(b,seed,width,depth,choice,detail=True):
    mujoco.mj_resetData(b.m,b.d)
    start,end,approach,goal,boxes=scene(b,seed,width,depth)
    move=1800;hold=200
    inward=candidates(b,start,end,approach,move+1)[choice]
    home=b.tip_at(start)
    preview=[b.tip_at(q).round(6).tolist() for q in inward[::18]] if detail else []
    b.d.qpos[:]=start;b.d.ctrl[:]=start;mujoco.mj_forward(b.m,b.d)
    frames=[];gaps=[];last=home.copy();travel=0.;hit=None;dwell_error=0.;result="miss";checked=False
    for k in range(2*move+hold+151):
        idx=min(k,move) if k<=move+hold else max(0,2*move+hold-k)
        b.d.ctrl[:]=inward[idx]
        if k:mujoco.mj_step(b.m,b.d)
        hit=next((c for c in b.d.contact if c.dist<=0 and
                  ((int(c.geom1) in b.arm_geoms and int(c.geom2) in b.obstacles|b.arm_geoms)
                   or (int(c.geom2) in b.arm_geoms and int(c.geom1) in b.obstacles))),None)
        if move<k<=move+hold:
            dwell_error=max(dwell_error,np.linalg.norm(b.d.site_xpos[b.tip]-goal))
        if k==move+hold:checked=dwell_error<=.008
        if k%12==0 or hit is not None or k==2*move+hold+150:
            mujoco.mj_kinematics(b.m,b.d)
            tip=b.d.site_xpos[b.tip].copy();travel+=np.linalg.norm(tip-last);last=tip
            if detail:
                poses=np.column_stack([b.d.xpos[1:8],b.d.xquat[1:8]])
                frames.append([round(k*.002,3),tip.round(6).tolist(),poses.round(6).ravel().tolist(),b.d.qpos.round(5).tolist()])
                gaps.append(closest(b))
            if hit is not None:result="contact";break
            if k>=2*move+hold and np.linalg.norm(tip-home)<=.008:
                result="reached" if checked else "miss";break
    contact_link=contact_point=None
    if hit is not None:
        geom=hit.geom1 if int(hit.geom1) in b.arm_geoms else hit.geom2
        contact_link=b.m.body(b.m.geom_bodyid[geom]).name
        contact_point=hit.pos.copy().tolist()
    return dict(choice=int(choice),outcome=result,frames=frames,seconds=round(k*.002,3),
                distance_mm=round(travel*1000),error_mm=round(np.linalg.norm(last-home)*1000,1),
                contact_link=contact_link,contact_point=contact_point,preview=preview,gaps=gaps,
                inspection_held=bool(checked),hold_error_mm=round(dwell_error*1000,2) if checked or k>=move+hold else None)
