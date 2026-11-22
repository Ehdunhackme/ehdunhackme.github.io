"""Pinch a free square nut by its handle, lift, orient and seat it on a peg."""

from functools import lru_cache
import xml.etree.ElementTree as ET

import mujoco
import numpy as np
from scipy.optimize import least_squares
from scipy.spatial.transform import Rotation
from arm import SOURCE

DECK = 0.040
HALF_HEIGHT = 0.005
HOLE = 0.010
OUTER = 0.022
HANDLE_Y = -0.033
PINCH = np.array([0.002, -0.0002, -0.091])
NUT_BOXES = (
    [
        ([d * (OUTER + HOLE) / 2, 0, 0], [(OUTER - HOLE) / 2, OUTER, HALF_HEIGHT])
        for d in (-1, 1)
    ]
    + [
        ([0, d * (OUTER + HOLE) / 2, 0], [HOLE, (OUTER - HOLE) / 2, HALF_HEIGHT])
        for d in (-1, 1)
    ]
    + [([0, HANDLE_Y, 0.009], [0.009, 0.013, 0.014])]
)
BOARD = [0.216, 0, DECK / 2, 0.116, 0.147, DECK / 2]


def vec(values):
    return " ".join(str(float(x)) for x in values)


def rz(angle):
    return Rotation.from_euler("z", angle).as_matrix()


def layout(seed):
    rng = np.random.default_rng(seed)
    return (
        rng.uniform([0.224, -0.061], [0.240, -0.033]),
        rng.uniform(-0.32, 0.32),
        rng.uniform([0.232, 0.046], [0.249, 0.074]),
        rng.uniform(-0.35, 0.35),
    )


class Assembly:
    def __init__(self, seed=2026, clearance=3, estimate_error=5, fixtures=(), placement=None):
        start, self.yaw, peg, self.peg_yaw = layout(seed) if placement is None else placement
        self.start = np.r_[start, DECK + HALF_HEIGHT]
        self.goal = np.r_[peg, DECK + HALF_HEIGHT]
        angle = np.random.default_rng(seed + 4081).uniform(-np.pi, np.pi)
        self.estimated_goal = self.goal + estimate_error / 1000 * np.array(
            [np.cos(angle), np.sin(angle), 0.0]
        )
        self.peg_half = HOLE - clearance / 1000
        xml = ET.parse(SOURCE).getroot()
        xml.find("compiler").set("meshdir", str(SOURCE.parent / "assets"))
        world = xml.find("worldbody")
        common = dict(contype="2", conaffinity="5", friction="1 .005 .0001")
        ET.SubElement(
            world,
            "geom",
            name="assembly_deck",
            type="box",
            pos=vec(BOARD[:3]),
            size=vec(BOARD[3:]),
            **common,
        )
        ET.SubElement(
            world,
            "geom",
            name="assembly_peg",
            type="box",
            pos=vec([*peg, DECK + 0.016]),
            size=vec([self.peg_half, self.peg_half, 0.016]),
            quat=vec([np.cos(self.peg_yaw / 2), 0, 0, np.sin(self.peg_yaw / 2)]),
            **common,
        )
        for item in fixtures:
            ET.SubElement(world, "geom", name=item["name"], type="box",
                          pos=vec(item["center"]), size=vec(item["half"]),
                          euler=vec([0, 0, item["yaw"]]), **common)
        nut = ET.SubElement(
            world,
            "body",
            name="nut",
            pos=vec(self.start),
            quat=vec([np.cos(self.yaw / 2), 0, 0, np.sin(self.yaw / 2)]),
        )
        ET.SubElement(nut, "freejoint", name="free_nut")
        for i, (center, half) in enumerate(NUT_BOXES):
            ET.SubElement(
                nut,
                "geom",
                name=f"nut_{i}",
                type="box",
                pos=vec(center),
                size=vec(half),
                density="560",
                contype="4",
                conaffinity="19",
                condim="4",
                friction="1.1 .008 .0001",
            )
        # Two compliant pad faces approximate distal finger contact. Each is rigid
        # on its own jaw. All object motion comes from MuJoCo contacts and gravity.
        fixed = world.find(".//body[@name='gripper']")
        moving = fixed.find("body[@name='moving_jaw_so101_v1']")
        for hand in (fixed, moving):
            for geom in hand.findall("geom[@class='collision']"):
                geom.set("contype", "8")
                geom.set("conaffinity", "11")
        for i, hand in enumerate((fixed, moving)):
            center = np.array([(-1 if i == 0 else 1) * 0.010, -0.0002, -0.091])
            rotation = np.eye(3)
            if i:
                q = np.fromstring(moving.get("quat"), sep=" ")
                rotation = Rotation.from_quat(q[[1, 2, 3, 0]]).as_matrix().T
                center = rotation @ (center - np.fromstring(moving.get("pos"), sep=" "))
            ET.SubElement(
                hand,
                "geom",
                name=f"grip_pad_{i}",
                type="box",
                size=".002 .0065 .008",
                quat=vec(Rotation.from_matrix(rotation).as_quat()[[3, 0, 1, 2]]),
                pos=vec(center),
                contype="16",
                conaffinity="4",
                friction="1 .006 .0001",
                condim="4",
                solref=".008 1",
                mass=".001",
            )
        servo = xml.find("actuator/position[@name='gripper']")
        servo.set("kp", "23")
        servo.set("kv", ".35")
        servo.set("forcerange", "-1.4 1.4")
        self.m = mujoco.MjModel.from_xml_string(ET.tostring(xml, encoding="unicode"))
        self.m.opt.integrator = mujoco.mjtIntegrator.mjINT_IMPLICITFAST
        self.m.opt.enableflags |= int(mujoco.mjtEnableBit.mjENBL_MULTICCD)
        self.d = mujoco.MjData(self.m)
        self.ik = mujoco.MjData(self.m)
        self.grip = self.m.body("gripper").id
        self.jaw = self.m.body("moving_jaw_so101_v1").id

    def target(self, center, yaw, height):
        return center + rz(yaw) @ np.array([0.0, HANDLE_Y, height])

    def pose(self, target, yaw, guess):
        d = self.ik
        desired = rz(yaw)

        def residual(q):
            d.qpos[:6] = [*q, 0.0]
            mujoco.mj_kinematics(self.m, d)
            R = d.xmat[self.grip].reshape(3, 3)
            xyz = d.xpos[self.grip] + R @ PINCH
            return np.r_[
                xyz - target, 0.035 * Rotation.from_matrix(desired.T @ R).as_rotvec()
            ]

        fit = least_squares(
            residual, guess, bounds=self.m.jnt_range[:5].T, max_nfev=120, gtol=1e-11
        )
        if np.linalg.norm(residual(fit.x)[:3]) > 0.003:
            raise ValueError(
                f"Cannot reach {target.round(3)} at yaw {yaw:.2f}, residual {residual(fit.x).round(3)}"
            )
        return fit.x

    def rollout(self, close=True, detailed=False, recheck=True, grasp_pose=None,
                place_pose=None, pickup_only=False):
        m, d = self.m, self.d
        mujoco.mj_resetData(m, d)
        guess = [0.0, -0.6, 0.7, 0.9, 0.0]
        destination = self.goal if recheck else self.estimated_goal
        source, grasp_yaw = (self.start, self.yaw) if grasp_pose is None else grasp_pose
        approach, place_yaw = self.estimated_goal, self.peg_yaw
        if place_pose is not None:
            approach, place_yaw = place_pose
            destination = approach
        targets = [(source, grasp_yaw, h) for h in (0.062, 0.012, 0.069)]
        if not pickup_only:
            targets += [(approach, place_yaw, 0.069), (destination, place_yaw, 0.069),
                        (destination, place_yaw, 0.012), (destination, place_yaw, 0.069)]
        waypoints = []
        for center, yaw, h in targets:
            guess = self.pose(self.target(center, yaw, h), yaw, guess)
            waypoints.append(guess)
        shut = -0.10 if close else 0.60
        stages = [
            (0, waypoints[0], 0.60),
            (0.25, waypoints[0], 0.60),
            (1.15, waypoints[1], 0.60),
            (2.15, waypoints[1], shut),
            (3.25, waypoints[2], shut),
        ]
        if pickup_only:
            stages.append((4.05, waypoints[2], shut))
        else:
            stages += [
                (4.7, waypoints[3], shut),
                (5.25, waypoints[4], shut),
                (6.35, waypoints[5], shut),
                (6.65, waypoints[5], shut),
                (7.35, waypoints[5], 0.60),
                (8.35, waypoints[6], 0.60),
                (9.05, waypoints[6], 0.60),
            ]
        times = np.array([s[0] for s in stages])
        cmds = np.array([np.r_[q, jaw] for _, q, jaw in stages])
        preview = []
        if detailed:
            for a,b in zip(cmds,cmds[1:]):
                for q in np.linspace(a,b,10):
                    self.ik.qpos[:6] = q
                    mujoco.mj_kinematics(m,self.ik)
                    pt = self.ik.xpos[self.grip] + self.ik.xmat[self.grip].reshape(3,3) @ PINCH
                    preview.append(pt.round(5).tolist())
        d.qpos[:6] = cmds[0]
        d.ctrl[:] = cmds[0]
        mujoco.mj_forward(m, d)
        frames = []
        pinched = False
        lifted = False
        peak = 0
        release_time = 0.0
        held_time = 0.0
        nut = m.body("nut").id
        deck_geom = m.geom("assembly_deck").id
        for i in range(round(times[-1] / m.opt.timestep) + 1):
            t = i * m.opt.timestep
            seg = min(len(times) - 2, np.searchsorted(times[1:], t, side="right"))
            f = np.clip((t - times[seg]) / (times[seg + 1] - times[seg]), 0, 1)
            f = f * f * (3 - 2 * f)
            d.ctrl[:] = cmds[seg] + f * (cmds[seg + 1] - cmds[seg])
            mujoco.mj_step(m, d)
            contacts = set()
            supported = False
            for c in d.contact:
                b1, b2 = m.geom_bodyid[c.geom1], m.geom_bodyid[c.geom2]
                if c.dist <= 0 and nut in (b1, b2):
                    contacts.add(b1 if b2 == nut else b2)
                    if deck_geom in (c.geom1, c.geom2):
                        supported = True
            p = d.xpos[nut].copy()
            height = p[2] - self.start[2]
            if t < 3.5:
                peak = max(peak, height)
            if self.grip in contacts and self.jaw in contacts:
                pinched = True
                if height > 0.035:
                    lifted = True
            if pickup_only:
                held = height > 0.035 and self.grip in contacts and self.jaw in contacts
                held_time = held_time + m.opt.timestep if held else 0.0
            if t > 7.35:
                R = d.xmat[nut].reshape(3, 3)
                local = R.T @ (self.goal - p)
                delta = self.peg_yaw - np.arctan2(R[1, 0], R[0, 0])
                margin = HOLE - self.peg_half * (
                    abs(np.cos(delta)) + abs(np.sin(delta))
                )
                seated = (
                    supported
                    and np.max(np.abs(local[:2])) <= margin + 0.0001
                    and abs(p[2] - self.goal[2]) < 0.0015
                    and R[2, 2] > 0.998
                    and not contacts.intersection([self.jaw, self.grip])
                    and np.linalg.norm(d.qvel[6:9]) < 0.005
                    and d.qpos[5] > 0.35
                )
                release_time = release_time + m.opt.timestep if seated else 0.0
            if detailed and (i % 15 == 0 or i == round(times[-1] / m.opt.timestep)):
                poses = np.column_stack([d.xpos[1:8], d.xquat[1:8]])
                frames.append(
                    [
                        round(t, 4),
                        d.site("gripperframe").xpos.round(6).tolist(),
                        poses.round(6).ravel().tolist(),
                        d.qpos[:6].round(5).tolist(),
                        np.r_[p, d.xquat[nut]].round(6).tolist(),
                    ]
                )
        return dict(
            reached=bool(held_time >= 0.5 if pickup_only else pinched and lifted and release_time >= 0.5),
            held_s=round(held_time, 3),
            pinched=pinched,
            lifted=lifted,
            lift_mm=round(peak * 1000, 1),
            error_mm=round(1000 * np.linalg.norm(p[:2] - self.goal[:2]), 2),
            seated_s=round(release_time, 3),
            seconds=times[-1],
            frames=frames,
            **({"preview":preview} if detailed else {}),
        )


@lru_cache(maxsize=3)
def assembly_replay(seed, clearance=3, estimate_error=5):
    bench = Assembly(seed, clearance, estimate_error)
    runs = {}
    for key, close, recheck in (
        ("scripted", True, True),
        ("nominal", True, False),
        ("open", False, True),
    ):
        run = bench.rollout(close, detailed=True, recheck=recheck)
        run["outcome"] = "reached" if run["reached"] else "miss"
        runs[key] = run
    return dict(
        family="Nut assembly",
        seed=seed,
        clearance=clearance,
        estimate_error=estimate_error,
        board=BOARD,
        goal=bench.goal.tolist(),
        assembly=dict(
            boxes=NUT_BOXES,
            peg_half=bench.peg_half,
            peg_height=0.032,
            peg_yaw=bench.peg_yaw,
            deck=DECK,
        ),
        **runs,
    )
