"""Contact-driven puck pushing with the SO-101 and a rigid fingertip probe."""
from functools import lru_cache
import json
import xml.etree.ElementTree as ET

import mujoco
import numpy as np
from scipy.optimize import least_squares

from arm import Bench, ROOT, SOURCE
from shelf import solve_pose, phased

TOP = .105
RADIUS = .020
HALF_HEIGHT = .010
PROBE_RADIUS = .006
DROP = .046
PAD = [.31, 0, TOP / 2, .151, .157, TOP / 2]
TOLERANCE = .010
WEIGHTS = ROOT / "experiments/puck/push.json"


class PushBench:
    def __init__(self):
        self.ik = Bench()
        self.ik.tip_at(solve_pose(self.ik, .32, .16))
        gripper = self.ik.d.body("gripper")
        local_down = gripper.xmat.reshape(3, 3).T @ [0., 0., -1.]
        lateral = gripper.xmat.reshape(3, 3).T @ [0., .026, 0.]
        root = ET.parse(SOURCE).getroot()
        root.find("compiler").set("meshdir", str(SOURCE.parent / "assets"))
        wrist = root.find(".//body[@name='gripper']")
        tip = np.fromstring(wrist.find("site[@name='gripperframe']").get("pos"), sep=" ")
        self.local_probe = tip + DROP * local_down
        self.blade = np.stack([self.local_probe-lateral, self.local_probe+lateral])
        ends = np.r_[tip, self.local_probe]
        ET.SubElement(wrist, "geom", name="push_probe", type="capsule",
                      size=str(PROBE_RADIUS), fromto=" ".join(map(str, ends)),
                      mass=".004", contype="1", conaffinity="6")
        ET.SubElement(wrist, "geom", name="push_blade", type="capsule",
                      size=str(PROBE_RADIUS), fromto=" ".join(map(str,self.blade.ravel())),
                      mass=".004", contype="1", conaffinity="6")
        world = root.find("worldbody")
        ET.SubElement(world, "geom", name="table", type="plane", size="1 1 .01",
                      contype="2", conaffinity="5")
        ET.SubElement(world, "geom", name="pad", type="box",
                      pos=" ".join(map(str, PAD[:3])), size=" ".join(map(str, PAD[3:])),
                      contype="2", conaffinity="5", friction=".48 .005 .0001")
        body = ET.SubElement(world, "body", name="puck", pos=f".30 0 {TOP+HALF_HEIGHT}")
        ET.SubElement(body, "freejoint", name="free_puck")
        ET.SubElement(body, "geom", name="puck", type="cylinder", size=f"{RADIUS} {HALF_HEIGHT}",
                      mass=".040", friction=".48 .005 .0001", contype="4", conaffinity="3")
        self.m = mujoco.MjModel.from_xml_string(ET.tostring(root, encoding="unicode"))
        self.m.opt.integrator = mujoco.mjtIntegrator.mjINT_IMPLICITFAST
        self.m.opt.enableflags |= int(mujoco.mjtEnableBit.mjENBL_MULTICCD)
        self.d = mujoco.MjData(self.m)
        self.arm = set(np.flatnonzero(self.m.geom_group == 3)) | {self.m.geom(n).id for n in ("push_probe","push_blade")}
        self.surfaces = {self.m.geom("pad").id, self.m.geom("table").id}
        self.puck = self.m.geom("puck").id

    def pose(self, xy, height, initial=None):
        target = np.r_[xy, height]
        def residual(angles):
            self.ik.tip_at(np.r_[angles, 0., .04])
            wrist = self.ik.d.body("gripper")
            rotation = wrist.xmat.reshape(3, 3)
            end = wrist.xpos + rotation @ self.local_probe
            wrist_axis = self.ik.d.site_xpos[self.ik.tip] - wrist.xpos
            tilt = np.arctan2(wrist_axis[2], np.linalg.norm(wrist_axis[:2]))
            return np.r_[end-target, .10 * tilt]
        guess = [0., -.45, .75, -.35] if initial is None else initial[:4]
        fit = least_squares(residual, guess, bounds=self.m.jnt_range[:4].T,
                            max_nfev=65, gtol=1e-10)
        return np.r_[fit.x, 0., .04]


def layout(seed, distance=None):
    rng = np.random.default_rng(seed)
    start = rng.uniform([.272, -.038], [.298, .038])
    angle = rng.uniform(-.54, .54)
    length = rng.uniform(.045, .077) if distance is None else distance / 1000
    return start, start + length*np.array([np.cos(angle), np.sin(angle)])


def features(start, goal):
    delta = goal-start
    return np.r_[(start[0]-.285)/.026, start[1]/.038, np.arctan2(delta[1],delta[0])/.54,
                 (np.linalg.norm(delta)-.060)/.032]


def simulate(bench, start, goal, correction=(0., 0.), detailed=True):
    m, d = bench.m, bench.d
    direction = goal-start
    direction /= np.linalg.norm(direction)
    normal = np.array([-direction[1], direction[0]])
    # The training actions steer the final paddle position sideways in the push frame.
    pre = start-direction*(RADIUS+PROBE_RADIUS+.016)
    stop = goal-direction*(RADIUS+PROBE_RADIUS)+direction*correction[1]+normal*correction[0]
    z = TOP + HALF_HEIGHT
    points = [(pre-direction*.020, z+.070), (pre, z), (stop, z),
              (stop-direction*.010, z+.065)]
    poses = []
    for xy, height in points:
        poses.append(bench.pose(xy, height, poses[-1] if poses else None))
    commands = phased(np.array(poses), np.array([0., .29, .80, 1.]), 1401)
    preview = []
    if detailed:
        for command in commands[::20]:
            bench.ik.tip_at(command)
            wrist = bench.ik.d.body("gripper")
            preview.append((wrist.xpos + wrist.xmat.reshape(3,3) @ bench.local_probe).round(5).tolist())
    mujoco.mj_resetData(m, d)
    d.qpos[:6] = commands[0]
    d.qpos[6:9] = [*start, z+.00005]
    d.qpos[9:] = [1.,0.,0.,0.]
    d.ctrl[:] = commands[0]
    mujoco.mj_forward(m,d)
    first_contact = None
    hit = None
    frames = []
    for step in range(1621):
        d.ctrl[:] = commands[min(step,1400)]
        if step:
            mujoco.mj_step(m,d)
        for c in d.contact:
            if c.dist > 0:
                continue
            a, b = int(c.geom1), int(c.geom2)
            if bench.puck in (a,b) and (a in bench.arm or b in bench.arm):
                if first_contact is None:
                    first_contact = round(.002*step,3)
            if ((a in bench.arm and b in bench.surfaces | bench.arm) or
                (b in bench.arm and a in bench.surfaces)):
                hit = c.pos.copy()
                break
        if detailed and (step%12==0 or hit is not None):
            mujoco.mj_kinematics(m,d)
            poses7 = np.column_stack([d.xpos[1:8],d.xquat[1:8]])
            frames.append([round(.002*step,3),d.site_xpos[m.site("gripperframe").id].round(6).tolist(),
                           poses7.round(6).ravel().tolist(),d.qpos[:6].round(5).tolist(),
                           d.qpos[6:13].round(6).tolist()])
        if hit is not None:
            break
    final = d.qpos[6:8].copy()
    gap = float(np.linalg.norm(final-goal))
    settled = np.linalg.norm(d.qvel[6:9]) < .005
    success = hit is None and first_contact is not None and settled and gap<=TOLERANCE
    return dict(outcome="contact" if hit is not None else "reached" if success else "miss",
                seconds=round(.002*step,3),error_mm=round(gap*1000,2),frames=frames,
                contact_point=hit.tolist() if hit is not None else None,first_touch=first_contact,
                finish=final.tolist(),settled=bool(settled),
                distance_mm=round(1000*np.linalg.norm(final-start),1),
                **({"preview":preview} if detailed else {}))


@lru_cache(maxsize=1)
def engine():
    return PushBench(), json.loads(WEIGHTS.read_text())


def replay(seed, distance):
    bench, model = engine()
    start, goal = layout(seed, distance)
    adjusted = predict(model,start,goal)
    return dict(family="Puck push",seed=seed,goal=[*goal, TOP+.0008],
                pad=PAD,puck=dict(radius=RADIUS,half=HALF_HEIGHT,probe=bench.local_probe.tolist(),
                                  blade=bench.blade.tolist(),mount=bench.ik.m.site_pos[bench.ik.tip].tolist(),
                                  probe_radius=PROBE_RADIUS,threshold=TOLERANCE),
                start=[*start,TOP+HALF_HEIGHT],
                learned=simulate(bench,start,goal,adjusted),direct=simulate(bench,start,goal))


def predict(model,start,goal):
    index = action_index(model,features(start,goal))
    return np.asarray(model["actions_mm"][index])/1000


def action_index(model, x):
    dist = ((np.asarray(model["features"])-x)**2).sum(axis=1)
    ids = np.argsort(dist)[:model["neighbors"]]
    scores = np.average(np.asarray(model["costs"])[ids], axis=0, weights=1/(dist[ids]+.01))
    return int(scores.argmin())
