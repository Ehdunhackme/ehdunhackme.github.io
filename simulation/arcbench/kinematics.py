"""Sparse kinematic features from the SO-101 link frames, without simulator contact queries."""
import xml.etree.ElementTree as ET
import numpy as np
from scipy.spatial.transform import Rotation
from arm import OFFSETS, SOURCE

xml=ET.parse(SOURCE)
links=[xml.find(f".//body[@name='{name}']") for name in ("shoulder","upper_arm","lower_arm","wrist","gripper")]
xyz=lambda element, name: np.fromstring(element.get(name),sep=" ",dtype=np.float32)
offsets=[xyz(link,"pos") for link in links]
rotations=[Rotation.from_quat(np.roll(xyz(link,"quat"),-1)).as_matrix().astype(np.float32) for link in links]
limits=np.array([xyz(link.find("joint"),"range") for link in links])
tool=xyz(links[-1].find("site"),"pos")


def skeleton(q):
    R=np.broadcast_to(np.eye(3,dtype=np.float32),(len(q),3,3))
    pos=np.zeros((len(q),3),np.float32)
    vertices=[]
    for i,(shift,rotation) in enumerate(zip(offsets,rotations)):
        pos=pos+R@shift
        vertices.append(pos)
        angle=q[:,i];c=np.cos(angle);s=np.sin(angle)
        z=np.zeros_like(R);z[:,0,0]=z[:,1,1]=c;z[:,1,0]=s;z[:,0,1]=-s;z[:,2,2]=1
        R=(R@rotation)@z
    return np.stack([*vertices,pos+R@tool],axis=1)


def sparse_features(tasks):
    # Clearance at five interior poses, using link centerlines as a cheap shape proxy.
    output=[]
    u=np.array([.12,.30,.50,.70,.88],np.float32)
    for rows in np.array_split(tasks,max(1,(len(tasks)+63)//64)):
        joint=rows[:,None,None,:5]+(rows[:,None,None,6:11]-rows[:,None,None,:5])*u[None,None,:,None]
        joint=np.repeat(joint,len(OFFSETS),axis=1)
        joint[:,:,:,1:4]+=OFFSETS[None,:,None,:]*np.sin(np.pi*u)[None,None,:,None]**2
        joint=np.clip(joint,limits[:,0],limits[:,1])
        links=skeleton(joint.reshape(-1,5)).reshape(len(rows),len(OFFSETS),len(u),6,3)
        head=links[:,:,:,1:-1,:];tail=links[:,:,:,2:,:]
        pts=np.concatenate([head,head*.67+tail*.33,head*.33+tail*.67,tail],axis=3)
        gap=np.abs(pts-rows[:,None,None,None,12:15])-rows[:,None,None,None,15:18]
        signed=np.linalg.norm(np.maximum(gap,0),axis=-1)+np.minimum(0,gap.max(-1))
        distances=signed.min(3)-.024
        ground=pts[:,:,:,:,2].min((2,3))-.018
        output.append(np.concatenate([distances.reshape(len(rows),-1),ground],axis=1))
    return np.vstack(output).astype(np.float32)

