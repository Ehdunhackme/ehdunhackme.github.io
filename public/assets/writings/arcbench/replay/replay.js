const $ = (id) => document.getElementById(id);
import {mountDisclosure} from "./disclosure.mjs";
mountDisclosure(document.querySelector("details"));
const tasks = {
  placement: {seed:813000, family:9, sliders:[["pixels","Mask width",48,128,96,"px"],["clearance","Peg clearance",1,4,2,"mm"]], methods:[["learned","Predicted peg pose"],["direct","Fixed peg pose"]]},
  shelf: {seed:720001, family:3, sliders:[["width","Opening width",85,190,110,"mm"],["depth","Inspection depth",45,105,75,"mm"]], methods:[["learned","Learned route"],["fixed","Fixed route"],["direct","Direct reach"]]},
  reach: {seed:700000, family:0, sliders:[["offset","Fixture offset",-55,55,0,"mm"],["angle","Target rotation",-18,18,0,"°"]], methods:[["learned","Learned route"],["direct","Direct reach"]]}
};
const requested=new URLSearchParams(location.search).get("task");
const task=requested==="pickup"?"placement":Object.hasOwn(tasks,requested)?requested:"reach";
const config=tasks[task], shelf=task==="shelf";
const mode=$("mode"), play=$("play"), scrub=$("time");
let view, run, elapsed=0, playing=false, last=0, animation=0, inspecting=false, busy=false;
const route=()=>run[mode.value];
const cache=new Map();
const reducedMotion=matchMedia("(prefers-reduced-motion: reduce)");
let wantsPlayback=!reducedMotion.matches, inView=false;

function theme() {
  if (!window.frameElement) return;
  const doc=parent.document, css=parent.getComputedStyle(doc.documentElement);
  document.documentElement.classList.toggle("dark",doc.documentElement.classList.contains("dark"));
  for(const [local,site] of [["--bg","--bg"],["--fg","--strong"],["--muted","--muted"],["--line","--line"]]){
    const value=css.getPropertyValue(site).trim();
    if(value) document.documentElement.style.setProperty(local,value);
  }
}
if(window.frameElement){
  theme();
  new MutationObserver(theme).observe(parent.document.documentElement,{attributes:true,attributeFilter:["class","style","data-theme"]});
  new ResizeObserver(()=>{if(document.body.offsetHeight) window.frameElement.style.height=document.body.offsetHeight+"px";}).observe(document.body);
}
function notice(message="") { $("notice").textContent=message; $("notice").hidden=!message; }
function updateExamples() {
  if(!shelf)return;
  const match=[$("seed").value,$("width").value,$("depth").value].join(",");
  $("example").value=[...$("example").options].some(o=>o.value===match)?match:"";
}
function setValue(id,value) {
  $(id).value=value;
  if($(id+"-value")) $(id+"-value").value=value+" "+$(id).dataset.unit;
}
function prepareControls() {
  $("seed").value=config.seed;
  for(const [id,name,min,max,value,unit] of config.sliders){
    const label=document.createElement("label"),out=document.createElement("output"),input=document.createElement("input");
    label.htmlFor=id;label.textContent=name;out.id=id+"-value";label.append(out);
    Object.assign(input,{id,type:"range",min,max});input.dataset.unit=unit;
    $("sliders").append(label,input);setValue(id,value);
    input.oninput=()=>{setValue(id,input.value);updateExamples();};
  }
  for(const [key,name] of config.methods)mode.add(new Option(name,key));
  $("example-row").hidden=!shelf; $("fixture-row").hidden=task!=="reach";
  $("cut-row").hidden=!shelf; $("closest").hidden=!shelf;
  $("mask-toggle").hidden=task!=="placement";
  if(shelf)$("camera").add(new Option("Shelf opening","mouth"));
  $("seed").oninput=updateExamples;updateExamples();
}
function pause(){
  cancelAnimationFrame(animation);playing=false;
  play.dataset.playing="false";
  play.setAttribute("aria-label",run && elapsed>=route().seconds?"Replay motion":"Play replay");
}
function syncPlayback(){
  if(!run || busy || !inView || document.hidden || !wantsPlayback || elapsed>=route().seconds){pause();return;}
  if(playing)return;
  playing=true;last=performance.now();play.dataset.playing="true";
  play.setAttribute("aria-label","Pause replay");animation=requestAnimationFrame(tick);
}
function draw(){
  const p=route(); let lo=0,hi=p.frames.length-1;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(p.frames[mid][0]<=elapsed)lo=mid;else hi=mid-1;}
  const current=p.frames[lo],next=p.frames[Math.min(lo+1,p.frames.length-1)];
  const fraction=next[0]>current[0]?(elapsed-current[0])/(next[0]-current[0]):0;
  view.pose(current,next,fraction);scrub.value=Math.round(1000*elapsed/p.seconds);
  scrub.style.setProperty("--played",100*elapsed/p.seconds+"%");$("clock").value=elapsed.toFixed(2)+" s";
  scrub.setAttribute("aria-valuetext",elapsed.toFixed(2)+" of "+p.seconds.toFixed(2)+" seconds");
  $("finish").hidden=elapsed<p.seconds;
  if(inspecting && p.gaps){const g=p.gaps[lo];view.gap(g.points,g.link.replaceAll("_"," ")+" / "+g.panel+" · "+g.mm.toFixed(2)+" mm");}
}
function tick(now){
  if(!playing)return;
  // A slow render or a suspended tab should not skip the whole grasp.
  elapsed=Math.min(route().seconds,elapsed+Math.min(now-last,150)*Number($("speed").value)/1000);last=now;
  draw();if(elapsed>=route().seconds)pause();else animation=requestAnimationFrame(tick);
}
function pick(){
  elapsed=0;pause();inspecting=false;view.gap(null);view.showRoute(mode.value);view.paths($("paths").checked);
  draw();
  const p=route();
  const success={placement:"Seated and released",shelf:"Inspection complete",reach:"Target reached"};
  const result=p.outcome==="reached"?success[task]:p.outcome==="contact"?"Collision":"Outside tolerance";
  $("finish").textContent=result+" · "+p.error_mm.toFixed(1)+" mm";
  const entries=[["Layout seed",run.seed],["Outcome",result],["Gripper travel",p.distance_mm+" mm"]];
  if(run.observation)entries.push(["Pose estimate error",p.pose_error_mm+" mm"],["Peak lift",p.lift_mm+" mm"],
    ["Seated after release",p.seated_s+" s"]);
  entries.push(["Final error",p.error_mm+" mm"]);
  if(shelf && p.gaps)entries.push(["Closest clearance",Math.min(...p.gaps.map(g=>g.mm)).toFixed(2)+" mm"]);
  $("metrics").replaceChildren();
  for(const [name,value] of entries){const dt=document.createElement("dt"),dd=document.createElement("dd");dt.textContent=name;dd.textContent=value;$("metrics").append(dt,dd);}
}
function drawMask({size,mask}){
  const canvas=$("mask-image");
  canvas.width=canvas.height=size;
  const ctx=canvas.getContext("2d"),image=ctx.createImageData(size,size);
  const palette=[[237,239,239,255],[186,113,47,255],[61,91,156,255]],bytes=atob(mask);
  for(let i=0;i<bytes.length;i++)image.data.set(palette[bytes.charCodeAt(i)],4*i);
  ctx.putImageData(image,0,0);
  $("mask-size").textContent=size+" × "+size+" px";
}
function pending(on){
  busy=on;
  for(const id of ["random","mask-toggle","apply","play","time","mode","closest","family","seed","example",...config.sliders.map(s=>s[0])])$(id).disabled=on || !view;
  $("loading").hidden=!on;
}
async function simulate(initial=false){
  if(busy || !$("seed").reportValidity())return;
  pause();pending(true);notice();
  const query=new URLSearchParams({family:task==="reach"?$("family").value:config.family,seed:$("seed").value});
  for(const [id] of config.sliders)query.set(id,$(id).value);
  const key=query.toString();
  const featured=Number($("seed").value)===config.seed && Number(query.get("family"))===config.family &&
    config.sliders.every(([id, , , , value])=>Number(query.get(id))===value);
  $("loading").textContent=initial?"Loading the arm…":"Simulating this layout…";
  try {
    let next=cache.get(key);
    if(!next){
      const response=await fetch(featured?"./"+task+".json":"/api/arcbench/?"+query);
      if(!response.ok){
        const reason=await response.json().catch(()=>({}));
        throw Error(reason.error || "The simulator could not run this layout. Try again.");
      }
      next=await response.json();
      if(!next[config.methods[0][0]]?.frames?.length)throw Error("Incomplete simulation response. Try again.");
      if(cache.size>=8)cache.delete(cache.keys().next().value);
      cache.set(key,next);
    }
    run=next;if(run.observation)drawMask(run.observation);view.setup(run);view.cameraView($("camera").value);view.cutaway($("cut").checked);pick();
  }catch(error){
    if(initial)throw error;
    notice(error.message+(run?" Showing layout "+run.seed+".":""));
  }finally{pending(false);syncPlayback();}
}

prepareControls();
try {
  const {buildScene}=await import("./scene.js");
  view=await buildScene($("stage"));await simulate(true);
  mode.onchange=()=>{pick();wantsPlayback=!reducedMotion.matches;syncPlayback();};
  $("random").onclick=()=>{setValue("seed",crypto.getRandomValues(new Uint32Array(1))[0]%2147483648);updateExamples();simulate();};
  $("apply").onclick=()=>simulate();
  $("family").onchange=()=>simulate();
  $("example").onchange=()=>{if(!$("example").value)return;const [seed,width,depth]=$("example").value.split(",");setValue("seed",seed);setValue("width",width);setValue("depth",depth);simulate();};
  function setCamera(value){
    $("camera").value=value;view.cameraView(value);
  }
  $("camera").onchange=()=>setCamera($("camera").value);
  $("mask-toggle").onclick=()=>{
    const panel=$("model-input");
    panel.hidden=!panel.hidden;
    $("mask-toggle").setAttribute("aria-pressed",String(!panel.hidden));
  };
  $("reset").onclick=()=>setCamera("work");
  $("paths").onchange=()=>view.paths($("paths").checked);$("cut").onchange=()=>view.cutaway($("cut").checked);
  $("closest").onclick=()=>{const p=route();if(!p.gaps)return;const i=p.gaps.reduce((best,g,index)=>g.mm<p.gaps[best].mm?index:best,0);elapsed=p.frames[i][0];wantsPlayback=false;pause();inspecting=true;draw();};
  scrub.oninput=()=>{elapsed=Number(scrub.value)*route().seconds/1000;wantsPlayback=false;pause();draw();};
  play.onclick=()=>{wantsPlayback=!playing;if(wantsPlayback && elapsed>=route().seconds)elapsed=0;syncPlayback();};
  document.addEventListener("visibilitychange",syncPlayback);
  reducedMotion.addEventListener("change",()=>{if(reducedMotion.matches){wantsPlayback=false;syncPlayback();}});
  new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;syncPlayback();}).observe($("stage"));
}catch{
  const link=document.createElement("a");link.href="../"+task+".mp4";link.textContent="Watch the recorded comparison";
  $("loading").hidden=false;$("loading").replaceChildren("3D is unavailable on this device. ",link);
  for(const el of [mode,play,scrub,$("apply"),$("random")])el.disabled=true;
}
