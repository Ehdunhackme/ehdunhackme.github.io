import * as T from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';

export async function buildScene(container) {
  const scene=new T.Scene(), renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.91;
  container.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','Orbitable SO-101 arm on a machined tabletop');
  scene.background=new T.Color(0xe8e9eb);scene.fog=new T.Fog(0xe8e9eb,1.2,2.8);
  const camera=new T.OrthographicCamera(-.5,.5,.34,-.34,.008,6);camera.up.set(0,0,1);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.enablePan=true;controls.minZoom=.65;controls.maxZoom=3.5;
  controls.maxPolarAngle=Math.PI*.48;controls.minPolarAngle=.12;
  let dirty=true;
  controls.addEventListener('change',()=>{dirty=true;});
  controls.target.set(.18,0,.207);
  let shelfMode=false,puckMode=false,assemblyMode=false,followGrip=false;
  const tracked=new T.Vector3(), shift=new T.Vector3();
  function cameraView(name='work'){
    followGrip=name==='grip';
    if(followGrip && tool){
      tracked.copy(tool.position);
      controls.target.copy(tracked);
      controls.target.x+=.012;controls.target.z-=.022;
      camera.position.copy(controls.target).add(new T.Vector3(.62,-.88,.31));
      camera.zoom=2.75;camera.updateProjectionMatrix();controls.update();dirty=true;
      return;
    }
    const focus=assemblyMode?[.195,.005,.118]:puckMode?[.205,0,.145]:shelfMode?[.21,0,.15]:[.18,0,.20];
    const eye=name==='top'?[.22,-.02,1.2]:name==='mouth'?[-.65,-.22,.32]:assemblyMode?[.76,-.84,.79]:shelfMode?[-.29,-.91,.52]:puckMode?[.54,-.98,.88]:[.76,-.91,.64];
    camera.position.set(...eye);camera.zoom=assemblyMode?1.20:name==='mouth'?1.2:1;camera.updateProjectionMatrix();
    controls.target.set(...focus);controls.update();dirty=true;
  }
  const reset=()=>cameraView();
  reset();
  const env=new T.PMREMGenerator(renderer);
  const room=new RoomEnvironment();scene.environment=env.fromScene(room,.04).texture;
  room.dispose();env.dispose();scene.environmentIntensity=.45;
  const hemi=new T.HemisphereLight(0xd8edff,0x607582,.95);scene.add(hemi);
  const key=new T.DirectionalLight(0xffedd2,2.7);key.position.set(-.42,-.68,1.42);key.castShadow=true;
  Object.assign(key.shadow.camera,{left:-.74,right:.74,top:.70,bottom:-.70,near:.1,far:3});
  key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.0008;key.shadow.bias=-.00007;
  scene.add(key);const rim=new T.DirectionalLight(0xcaddff,1.6);rim.position.set(.45,.78,.82);scene.add(rim);
  function material(color,roughness=.55,metalness=.05){return new T.MeshStandardMaterial({color,roughness,metalness});}
  const floor=new T.Mesh(new T.PlaneGeometry(8,8),material(0xd9dcdf,.95,0));floor.position.z=-.034;floor.receiveShadow=true;scene.add(floor);
  const plate=new T.Mesh(new T.BoxGeometry(.80,.60,.03),material(0xa9adb2,.65,.2));
  plate.position.set(.15,0,-.016);plate.castShadow=true;plate.receiveShadow=true;scene.add(plate);
  const top=new T.Mesh(new T.PlaneGeometry(.80,.60),material(0xc7cacf,.85,.10));
  top.position.set(.15,0,-.00055);top.receiveShadow=true;scene.add(top);
  const [manifest,buffer]=await Promise.all([fetch('./model/model.json').then(r=>r.json()),fetch('./model/geometry.bin').then(r=>r.arrayBuffer())]);
  if(buffer.byteLength!==manifest.bytes)throw Error('The arm mesh download was incomplete.');
  const bodies=manifest.bodies.map(()=>new T.Group());bodies.forEach(b=>scene.add(b));
  const geometry=manifest.meshes.map(m=>{
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,...m.vertices),3));
    geo.setIndex(new T.BufferAttribute(new Uint32Array(buffer,...m.faces),1));
    geo.computeVertexNormals();return geo;
  });
  const printed=material(0x25272a,.49,.18),motor=material(0x191c22,.40,.42);
  for(const g of manifest.geoms){
    const mesh=new T.Mesh(geometry[g.mesh],g.motor?motor:printed);
    mesh.position.fromArray(g.position);const [w,x,y,z]=g.rotation;mesh.quaternion.set(x,y,z,w);
    mesh.castShadow=mesh.receiveShadow=true;bodies[g.body].add(mesh);
  }
  const overlay=new T.Group();scene.add(overlay);const v=p=>new T.Vector3(...p);
  let removable=[],sectionOn=true,hitMarker,movingPart,tool;
  let jawPads=[];
  function followTool(){
    if(!followGrip)return;
    shift.subVectors(tool.position,tracked);
    controls.target.add(shift);camera.position.add(shift);tracked.copy(tool.position);
    controls.update();
  }
  const routeLines=new Map();
  let pathsOn=true,currentRoute='learned';
  function clearOverlay(){overlay.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});overlay.clear();removable=[];}
  function cutaway(on){
    sectionOn=on;
    for(const mesh of removable){mesh.material.opacity=on?.18:1;mesh.material.transparent=on;mesh.material.depthWrite=!on;mesh.castShadow=!on;mesh.material.needsUpdate=true;}
    dirty=true;
  }
  const witness=new T.Group();scene.add(witness);witness.visible=false;
  const ends=[0,1].map(()=>{const p=new T.Mesh(new T.SphereGeometry(.0035,12,8),new T.MeshBasicMaterial({color:0xffdf63,depthTest:false}));p.renderOrder=8;witness.add(p);return p;});
  const bar=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:0xffdf63,depthTest:false}));
  bar.renderOrder=8;witness.add(bar);
  const callout=document.createElement('div');callout.className='surface-note';callout.hidden=true;container.append(callout);
  const noteText=document.createElement('span');callout.append(noteText);
  const projected=new T.Vector3();
  function positionNote(){
    if(!witness.visible)return;
    projected.copy(ends[0].position).lerp(ends[1].position,.5).project(camera);
    const left=(projected.x+1)*container.clientWidth/2,top=(1-projected.y)*container.clientHeight/2;
    callout.hidden=left<0||top<0||left>container.clientWidth||top>container.clientHeight;
    callout.style.left=left+'px';callout.style.top=top+'px';
    callout.classList.toggle('flip',left>container.clientWidth-176);
  }
  function gap(points,caption=''){
    callout.hidden=!points;if(points)noteText.textContent=caption;
    witness.visible=Boolean(points);if(points){for(let i=0;i<2;i++){ends[i].position.fromArray(points[i]);bar.geometry.attributes.position.setXYZ(i,...points[i]);}bar.geometry.attributes.position.needsUpdate=true;bar.geometry.computeBoundingSphere();}dirty=true;
  }
  function marker(pt){
    const group=new T.Group();group.position.fromArray(pt);
    for(let p=0;p<2;p++){
      const r=new T.Mesh(new T.TorusGeometry(.013,.0015,8,40),new T.MeshBasicMaterial({color:0x63498b}));
      if(p)r.rotation.x=Math.PI/2;group.add(r);
    }
    overlay.add(group);
  }
  function setup(run){
    dirty=true;
    clearOverlay();
    for(const pad of jawPads){pad.removeFromParent();pad.geometry.dispose();pad.material.dispose();}
    jawPads=[];
    if(tool){tool.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});tool.removeFromParent();tool=null;}
    movingPart=hitMarker=null;
    routeLines.clear();
    for(const [key,method] of Object.entries(run)){
      if(!Array.isArray(method?.preview)||method.preview.length<2)continue;
      const points=method.preview.map(v).filter((p,i,arr)=>i===0 || p.distanceToSquared(arr[i-1])>1e-10);
      if(points.length<2)continue;
      const path=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0x007c82}));
      path.visible=pathsOn && key===currentRoute;overlay.add(path);routeLines.set(key,path);
    }
    gap(null);
    const changed=assemblyMode!==Boolean(run.assembly)||shelfMode!==Boolean(run.panels)||puckMode!==Boolean(run.puck);
    assemblyMode=Boolean(run.assembly);shelfMode=Boolean(run.panels);puckMode=Boolean(run.puck);
    if(changed)reset();
    if(assemblyMode){
      const block=(parent,center,half,color)=>{
        const mesh=new T.Mesh(new T.BoxGeometry(...half.map(x=>x*2)),material(color,.53,.18));
        mesh.position.fromArray(center);mesh.castShadow=mesh.receiveShadow=true;
        parent.add(mesh);return mesh;
      };
      const spec=run.assembly;
      block(overlay,run.board.slice(0,3),run.board.slice(3),0xb5bdc4);
      const peg=block(overlay,[run.goal[0],run.goal[1],spec.deck+spec.peg_height/2],
        [spec.peg_half,spec.peg_half,spec.peg_height/2],0x385fa7);
      peg.rotation.z=spec.peg_yaw;
      for(const item of run.fixtures ?? []){
        const color=item.name==="rail"?0x98765b:0x527c68;
        block(overlay,item.center,item.half,color).rotation.z=item.yaw;
      }
      movingPart=new T.Group();overlay.add(movingPart);
      for(const [center,half] of spec.boxes)block(movingPart,center,half,0xc27935);
      return;
    }
    if(puckMode){
      const [x,y,z,a,b,c]=run.pad, spec=run.puck;
      const pad=new T.Mesh(new T.BoxGeometry(2*a,2*b,2*c),material(0xb7bdc1,.7,.12));
      pad.position.set(x,y,z);pad.castShadow=pad.receiveShadow=true;overlay.add(pad);
      const radius=spec.radius+spec.threshold;
      const ring=new T.Mesh(new T.RingGeometry(radius,radius+.002,64),new T.MeshBasicMaterial({color:0x296b51}));
      ring.position.fromArray(run.goal);overlay.add(ring);
      const center=new T.Mesh(new T.CircleGeometry(.0024,20),new T.MeshBasicMaterial({color:0x296b51}));
      center.position.copy(ring.position);overlay.add(center);
      movingPart=new T.Group();overlay.add(movingPart);
      const disc=new T.Mesh(new T.CylinderGeometry(spec.radius,spec.radius,2*spec.half,48),material(0x314fba,.42,.18));
      disc.rotation.x=Math.PI/2;disc.castShadow=disc.receiveShadow=true;movingPart.add(disc);
      const dot=new T.Mesh(new T.CircleGeometry(.0028,24),new T.MeshBasicMaterial({color:0xe6edff}));
      dot.position.z=spec.half+.0001;movingPart.add(dot);
      tool=new T.Group();
      const grip=spec.held_tool;
      (grip?scene:bodies[manifest.bodies.indexOf('gripper')]).add(tool);
      if(grip){
        const handle=new T.Mesh(new T.BoxGeometry(...grip.half.map(x=>2*x)),material(0xe4a65d,.59,.12));
        handle.castShadow=handle.receiveShadow=true;tool.add(handle);
        for(const pad of grip.pads){
          const mesh=new T.Mesh(new T.BoxGeometry(...pad.half.map(x=>2*x)),material(0x353b40,.85));
          const [w,x,y,z]=pad.quat;
          mesh.quaternion.set(x,y,z,w);mesh.position.fromArray(pad.pos);
          mesh.castShadow=true;bodies[manifest.bodies.indexOf(pad.body)].add(mesh);jawPads.push(mesh);
        }
      }
      for(const [first,second] of (grip?grip.rods:[[spec.mount,spec.probe],spec.blade])){
        const u=v(first),w=v(second),axis=w.clone().sub(u);
        const rod=new T.Mesh(new T.CapsuleGeometry(spec.probe_radius,axis.length(),6,16),material(0x697784,.36,.48));
        rod.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis.normalize());rod.position.copy(u).lerp(w,.5);
        rod.castShadow=true;tool.add(rod);
      }
      return;
    }else if(shelfMode){
      for(const [index,panel] of run.panels.entries()){
        const [x,y,z,a,b,c]=panel.box;
        const shape=new T.BoxGeometry(2*a,2*b,2*c);
        const box=new T.Mesh(shape,material(index===0?0x233f52:index===4?0x486277:0x466e87,.43,.38));
        box.position.set(x,y,z);box.receiveShadow=box.castShadow=true;overlay.add(box);
        if(index===2||index===3)removable.push(box);
        const edge=new T.LineSegments(new T.EdgesGeometry(shape),new T.LineBasicMaterial({color:0x243e4f}));edge.position.copy(box.position);overlay.add(edge);
      }
      const target=new T.Mesh(new T.TorusGeometry(.013,.002,8,32),new T.MeshBasicMaterial({color:0xf5ce70}));
      target.rotation.y=Math.PI/2;target.position.fromArray(run.goal);overlay.add(target);
      cutaway(sectionOn);
    }else{
    const [x,y,z,a,b,c]=run.fixture;
    const shape=new T.BoxGeometry(2*a,2*b,2*c);
    const box=new T.Mesh(shape,new T.MeshStandardMaterial({color:0x828ab3,transparent:true,opacity:.57,roughness:.36,metalness:.2,depthWrite:false}));
    box.position.set(x,y,z);box.receiveShadow=true;overlay.add(box);
    const edge=new T.LineSegments(new T.EdgesGeometry(shape),new T.LineBasicMaterial({color:0x555e88}));edge.position.copy(box.position);overlay.add(edge);
    }
    if(!shelfMode)marker(run.goal);
    if(run.direct.contact_point){
      hitMarker=new T.Mesh(new T.SphereGeometry(.005,12,10),new T.MeshBasicMaterial({color:0xb85d44}));hitMarker.position.fromArray(run.direct.contact_point);overlay.add(hitMarker);
    }
  }
  const nextPosition=new T.Vector3(), nextRotation=new T.Quaternion();
  function transform(object,start,end,j,alpha){
    object.position.fromArray(start,j).lerp(nextPosition.fromArray(end,j),alpha);
    object.quaternion.set(start[j+4],start[j+5],start[j+6],start[j+3]);
    nextRotation.set(end[j+4],end[j+5],end[j+6],end[j+3]);
    object.quaternion.slerp(nextRotation,alpha);
  }
  function pose(frame,next=frame,alpha=0){
    dirty=true;
    if(movingPart && frame[4])transform(movingPart,frame[4],next[4],0,alpha);
    if(tool && frame[5]){transform(tool,frame[5],next[5],0,alpha);followTool();}
    for(let i=1;i<=7;i++)transform(bodies[i],frame[2],next[2],7*(i-1),alpha);
  }
  const resize=()=>{const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);
    const aspect=w/h,half=Math.max(.225,.31/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();dirty=true;};
  new ResizeObserver(resize).observe(container);resize();
  let rendered=0;
  renderer.setAnimationLoop(now=>{if(!container.clientHeight||container.offsetParent===null||now-rendered<28)return;controls.update();if(dirty){renderer.render(scene,camera);positionNote();dirty=false;rendered=now;}});
  function showRoute(name=currentRoute){
    currentRoute=name;
    for(const [key,path] of routeLines)path.visible=pathsOn && key===name;
    if(hitMarker)hitMarker.visible=pathsOn && name==='direct';
    dirty=true;
  }
  return {setup,pose,render(){renderer.render(scene,camera);},reset,cutaway,cameraView,gap,showRoute,paths(on){pathsOn=on;showRoute();}};
}
