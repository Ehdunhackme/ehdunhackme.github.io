"""Rail transfer and two-stage peg relay with a free, contact-driven nut."""

from functools import lru_cache

import mujoco
import numpy as np
from nut_assembly import (
    Assembly,
    BOARD,
    DECK,
    HALF_HEIGHT,
    HOLE,
    NUT_BOXES,
    PINCH,
    layout,
)


def fixture(name, xy, half, yaw=0):
    return dict(name=name, center=[*xy, DECK + half[2]], half=half, yaw=yaw)


class GripperCourse(Assembly):
    def __init__(self, task, seed, clearance, difficulty):
        start, yaw, goal, goal_yaw = layout(seed)
        half = HOLE - clearance / 1000
        rng = np.random.default_rng(seed + 5009)
        self.task = task
        self.difficulty = difficulty
        self.middle_yaw = rng.uniform(-0.18, 0.18)
        self.middle = np.array(
            [rng.uniform(0.198, 0.204), rng.uniform(-0.008, -0.002), DECK + HALF_HEIGHT]
        )
        self.bias = (
            difficulty
            / 1000
            * np.array([np.cos(self.middle_yaw), np.sin(self.middle_yaw), 0.0])
        )
        if task == "transfer":
            start[1] -= 0.019
            goal[1] += 0.025
            rail_y = (start[1] + goal[1] - 0.022) / 2
            self.fixtures = [
                fixture("source_peg", start, [half, half, 0.014], yaw),
                fixture("rail", [0.236, rail_y], [0.032, 0.0025, difficulty / 2000]),
            ]
        elif task == "relay":
            self.fixtures = [
                fixture(
                    "middle_peg", self.middle[:2], [half, half, 0.014], self.middle_yaw
                )
            ]
        else:
            raise ValueError("Unknown gripper course.")
        super().__init__(
            seed, clearance, 0, self.fixtures, (start, yaw, goal, goal_yaw)
        )

    def leg_plan(self, start, yaw, goal, goal_yaw, carry):
        poses, preview = [], []
        guess = (
            np.clip(self.d.qpos[:5], *self.m.jnt_range[:5].T)
            if self.d.time
            else [0, -0.6, 0.7, 0.9, 0]
        )
        for center, angle, height in [
            (start, yaw, 0.069),
            (start, yaw, 0.012),
            (start, yaw, carry),
            (goal, goal_yaw, carry),
            (goal, goal_yaw, 0.012),
            (goal, goal_yaw, 0.069),
        ]:
            guess = self.pose(self.target(center, angle, height), angle, guess)
            poses.append(guess)
        times = np.array([0, 0.3, 1.2, 2.1, 3.4, 5.1, 6.4, 6.7, 7.35, 8.4, 9.05])
        indices = [0, 0, 1, 1, 2, 3, 4, 4, 4, 5, 5]
        jaws = [0.60, 0.60, 0.60, -0.1, -0.1, -0.1, -0.1, -0.1, 0.60, 0.60, 0.60]
        commands = np.array([np.r_[poses[i], jaw] for i, jaw in zip(indices, jaws)])
        if self.d.time:
            commands[0] = self.d.ctrl.copy()
        for a, b in zip(commands, commands[1:]):
            for q in np.linspace(a, b, 9, endpoint=False):
                self.ik.qpos[:6] = q
                mujoco.mj_kinematics(self.m, self.ik)
                xyz = (
                    self.ik.xpos[self.grip]
                    + self.ik.xmat[self.grip].reshape(3, 3) @ PINCH
                )
                preview.append(xyz.round(5).tolist())
        return times, commands, preview

    def leg(self, start, yaw, goal, goal_yaw, carry, detailed):
        m, d = self.m, self.d
        times, commands, preview = self.leg_plan(start, yaw, goal, goal_yaw, carry)
        initial = d.time == 0
        if initial:
            d.qpos[:6] = commands[0]
            d.ctrl[:] = commands[0]
            mujoco.mj_forward(m, d)
        nut = m.body("nut").id
        deck = m.geom("assembly_deck").id
        rail = m.geom("rail").id if self.task == "transfer" else -1
        step = m.opt.timestep
        count = round(times[-1] / step)
        frames = []
        lift = 0.0
        grasped = False
        rail_hit = False
        seated = 0.0
        for i in range(1, count + 1):
            t = i * step
            k = min(len(times) - 2, np.searchsorted(times[1:], t, side="right"))
            u = (t - times[k]) / (times[k + 1] - times[k])
            w = u * u * (3 - 2 * u)
            d.ctrl[:] = commands[k] + w * (commands[k + 1] - commands[k])
            mujoco.mj_step(m, d)
            contacts = set()
            supported = False
            for c in d.contact:
                if c.dist > 0:
                    continue
                ids = (c.geom1, c.geom2)
                bodies = m.geom_bodyid[list(ids)]
                if rail in ids and any(b > 0 for b in bodies):
                    rail_hit = True
                if nut in bodies:
                    contacts.add(bodies[0] if bodies[1] == nut else bodies[1])
                    supported |= deck in ids
            pos = d.xpos[nut]
            if self.grip in contacts and self.jaw in contacts:
                grasped = True
                lift = max(lift, pos[2] - DECK - HALF_HEIGHT)
            if t >= 7.35:
                rot = d.xmat[nut].reshape(3, 3)
                angle = goal_yaw - np.arctan2(rot[1, 0], rot[0, 0])
                margin = HOLE - self.peg_half * (
                    abs(np.cos(angle)) + abs(np.sin(angle))
                )
                fits = max(abs((rot.T @ (goal - pos))[:2])) <= margin + 0.0001
                stable = (
                    fits
                    and supported
                    and abs(pos[2] - goal[2]) < 0.0015
                    and rot[2, 2] > 0.998
                    and not contacts.intersection([self.jaw, self.grip])
                    and d.qpos[5] > 0.35
                    and np.linalg.norm(d.qvel[6:9]) < 0.005
                )
                seated = seated + step if stable else 0.0
            if detailed and ((initial and i == 1) or i % 20 == 0 or i == count):
                bodies = np.column_stack((d.xpos[1:8], d.xquat[1:8]))
                frames.append(
                    [
                        round(float(d.time), 4),
                        d.site("gripperframe").xpos.round(6).tolist(),
                        bodies.round(6).ravel().tolist(),
                        d.qpos[:6].round(5).tolist(),
                        np.r_[pos, d.xquat[nut]].round(6).tolist(),
                    ]
                )
        return (
            dict(
                complete=bool(
                    grasped and lift > 0.035 and not rail_hit and seated >= 0.5
                ),
                lift_mm=round(lift * 1000, 1),
                seated_s=round(seated, 3),
                rail_hit=rail_hit,
            ),
            frames,
            preview,
        )

    def perform(self, precise, detailed=False):
        mujoco.mj_resetData(self.m, self.d)
        stages, frames, preview = [], [], []

        def run_leg(*args):
            score, recorded, planned = self.leg(*args, detailed)
            stages.append(score)
            frames.extend(recorded)
            preview.extend(planned)

        if self.task == "transfer":
            carry = (self.difficulty / 1000 + 0.037) if precise else 0.052
            run_leg(self.start, self.yaw, self.goal, self.peg_yaw, carry)
        else:
            run_leg(self.start, self.yaw, self.middle, self.middle_yaw, 0.081)
            if stages[0]["complete"]:
                nut = self.d.body("nut")
                rotation = nut.xmat.reshape(3, 3)
                xy = nut.xpos.copy() if precise else self.middle + self.bias
                yaw = (
                    np.arctan2(rotation[1, 0], rotation[0, 0])
                    if precise
                    else self.middle_yaw
                )
                run_leg(xy, yaw, self.goal, self.peg_yaw, 0.081)
        completed = sum(s["complete"] for s in stages)
        required = 2 if self.task == "relay" else 1
        return dict(
            outcome="reached" if completed == required else "miss",
            stages=stages,
            completed=completed,
            required=required,
            seconds=round(float(self.d.time), 4),
            error_mm=round(
                float(np.linalg.norm(self.d.body("nut").xpos[:2] - self.goal[:2]))
                * 1000,
                2,
            ),
            lift_mm=max(s["lift_mm"] for s in stages),
            seated_s=stages[-1]["seated_s"],
            frames=frames,
            preview=preview,
        )


@lru_cache(maxsize=2)
def course_replay(task, seed, clearance, difficulty):
    course = GripperCourse(task, seed, clearance, difficulty)
    return dict(
        seed=seed,
        family=task,
        board=BOARD,
        goal=course.goal.tolist(),
        fixtures=course.fixtures,
        assembly=dict(
            boxes=NUT_BOXES,
            peg_half=course.peg_half,
            peg_height=0.032,
            peg_yaw=course.peg_yaw,
            deck=DECK,
        ),
        scripted=course.perform(True, True),
        nominal=course.perform(False, True),
    )
