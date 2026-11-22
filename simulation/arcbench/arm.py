"""SO-101 forward kinematics, trajectory library, and MuJoCo contact checks."""
from pathlib import Path
import xml.etree.ElementTree as ET
import numpy as np
import mujoco

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "assets/so101/arm.xml"
# Joint-space offsets at mid-course. The last two joints retain their commanded poses.
OFFSETS = np.array([(0,0,0),(-.65,0,0),(.6,-.85,0),(-.9,.95,0),(0,-.9,0),
                    (0,.95,0),(-.65,-.55,.6),(.6,.35,-.7),(-1.1,-.35,.75),
                    (.35,-1.1,-.55),(-.95,1.1,-.6),(.65,-.35,1.0),(0,.45,1.0)])
FAMILIES = ["Low fence","Tall post","Overhead zone"]


class Bench:
    def __init__(self, extra_boxes=()):
        xml = ET.parse(SOURCE)
        xml.find("compiler").set("meshdir", str(SOURCE.parent / "assets"))
        world = xml.find("worldbody")
        # A movable obstacle uses a mocap body so collision broadphase follows it.
        fixture = ET.SubElement(world,"body",name="fixture",mocap="true",pos=".3 0 .1")
        ET.SubElement(fixture,"geom",name="keepout",type="box",size=".04 .04 .1",contype="2",conaffinity="1")
        for name in extra_boxes:
            body=ET.SubElement(world,"body",name=name+"_mount",mocap="true",pos="2 0 1")
            ET.SubElement(body,"geom",name=name,type="box",size=".02 .02 .02",contype="2",conaffinity="1")
        ET.SubElement(world,"geom",name="table",type="plane",size="1 1 .01",contype="2",conaffinity="1")
        self.m = mujoco.MjModel.from_xml_string(ET.tostring(xml.getroot(),encoding="unicode"))
        self.d = mujoco.MjData(self.m)
        self.fixture = self.m.geom("keepout").id
        self.tip = self.m.site("gripperframe").id
        self.visual = np.flatnonzero((self.m.geom_group == 2) & (self.m.geom_dataid >= 0))
        self.arm_geoms = set(np.flatnonzero((self.m.geom_group == 3) & (self.m.geom_dataid >= 0)).tolist())
        self.obstacles = {self.fixture,self.m.geom("table").id,*(self.m.geom(n).id for n in extra_boxes)}

    def set_fixture(self, task):
        self.place_box(self.fixture,task[12:15],task[15:18])

    def place_box(self,geom,center,size):
        self.m.geom_size[geom] = size
        # MuJoCo caches local bounding information separately from primitive dimensions.
        self.m.geom_rbound[geom] = np.linalg.norm(size)
        self.m.geom_aabb[geom, 3:] = size
        body=self.m.geom_bodyid[geom]
        self.m.bvh_aabb[self.m.body_bvhadr[body], 3:] = size
        self.d.mocap_pos[self.m.body_mocapid[body]] = center

    def pose(self, q):
        self.d.qpos[:] = q
        mujoco.mj_kinematics(self.m,self.d)

    def contact(self):
        mujoco.mj_collision(self.m,self.d)
        for c in self.d.contact:
            a,b=int(c.geom1),int(c.geom2)
            if c.dist<=0 and ((a in self.arm_geoms and b in self.obstacles) or
                              (b in self.arm_geoms and a in self.obstacles) or
                              (a in self.arm_geoms and b in self.arm_geoms)):
                return True
        return False

    def tip_at(self,q):
        self.pose(q)
        return self.d.site_xpos[self.tip].copy()

    def paths(self, task, samples):
        t = np.linspace(0,1,samples)
        u = t*t*(3-2*t)
        qs = task[:6] + u[None,:,None]*(task[6:12]-task[:6])
        qs = np.repeat(qs,len(OFFSETS),axis=0)
        qs[:,:,1:4] += OFFSETS[:,None,:]*np.sin(np.pi*u)[None,:,None]**2
        return np.clip(qs,self.m.jnt_range[:,0],self.m.jnt_range[:,1])

    def hits(self, path):
        for q in path:
            self.pose(q)
            if self.contact():
                return True
        return False

    def draw_task(self, seed, family=None):
        rng=np.random.default_rng(seed)
        for _ in range(100):
            f = int(rng.integers(3)) if family is None else family
            start=np.array([rng.uniform(-1.12,-.53),rng.uniform(-.12,.55),rng.uniform(-.35,.32),
                            rng.uniform(-.45,.35),rng.uniform(-.35,.35),.32])
            end=np.array([rng.uniform(.50,1.2),rng.uniform(-.18,.60),rng.uniform(-.38,.30),
                          rng.uniform(-.45,.35),rng.uniform(-.45,.45),.32])
            if rng.uniform()<.5: start,end=end,start
            mid=start+(end-start)*rng.uniform(.30,.70)
            tcp=self.tip_at(mid)
            radial=rng.uniform(.64,.99)
            x=.04+(tcp[0]-.04)*radial+rng.uniform(-.025,.025)
            y=tcp[1]*radial+rng.uniform(-.018,.018)
            if f==0:
                h=rng.uniform(.08,.25); size=[rng.uniform(.025,.065),rng.uniform(.012,.035),h/2]; z=h/2
            elif f==1:
                h=rng.uniform(.22,.40); size=[rng.uniform(.012,.032),rng.uniform(.012,.032),h/2]; z=h/2
            else:
                size=[rng.uniform(.025,.07),rng.uniform(.015,.055),rng.uniform(.018,.052)]
                z=np.clip(tcp[2]+rng.uniform(-.025,.055),.15,.39)
            task=np.r_[start,end,x,y,z,size,float(f)]
            self.set_fixture(task)
            if not self.hits([start,end]):
                return task
        raise RuntimeError(f"No valid endpoints for task {seed}")

    def measure(self,task,samples=49):
        self.set_fixture(task)
        paths=self.paths(task,samples)
        clear=np.array([not self.hits(path) for path in paths])
        length=np.linalg.norm(np.diff(paths,axis=1),axis=2).sum(1)
        return clear,length
