// Diagram matches the released acoustic network and HiFi-GAN V2.
// Only explanatory UI: nothing in this module changes inference or weights.
const $ = id => document.getElementById(id);
const ns = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, text) => {
  const n = document.createElementNS(ns, tag);
  for (const [key,value] of Object.entries(attrs)) n.setAttribute(key,value);
  if (text !== undefined) n.textContent=text;
  return n;
};
const diagram=el('svg',{viewBox:'0 0 1000 890',xmlns:ns,role:'group','aria-labelledby':'arch-title arch-desc'});
diagram.append(el('title',{id:'arch-title'},'SmollerTTS inference architecture'));
diagram.append(el('desc',{id:'arch-desc'},'Three columns, read bottom to top: phoneme encoder, duration-regulated acoustic features, and HiFi-GAN V2 waveform synthesis. Select blocks or use the arrow keys to explore.'));
const defs=el('defs'),marker=el('marker',{id:'arch-arrow',viewBox:'0 0 8 8',refX:7,refY:4,markerWidth:6,markerHeight:6,orient:'auto'});
marker.append(el('path',{d:'M1 1 L7 4 L1 7',fill:'none',stroke:'#555','stroke-width':1.2,'stroke-linecap':'round','stroke-linejoin':'round'}));defs.append(marker);diagram.append(defs);
const wires=el('g',{'aria-hidden':'true',class:'arch-wires'}),labels=el('g',{'aria-hidden':'true'}),blocks=el('g');
diagram.append(wires,labels,blocks);$('architecture-diagram').append(diagram);
const text=(parent,x,y,content,cls='arch-label')=>parent.append(el('text',{x,y,'text-anchor':'middle',class:cls},content));
const line=(d,arrow=true,cls='arch-wire',parent=wires)=>parent.append(el('path',{d,class:cls,...(arrow?{'marker-end':'url(#arch-arrow)'}:{})}));
const vertical=(x,bottom,top,parent=wires)=>line(`M${x} ${bottom}V${top}`,true,'arch-wire',parent);
const nodes=[];
const tone=label=>/embedding/i.test(label)?'pink':/attention|Duration/i.test(label)?'orange':/Norm|Scale|^Add/i.test(label)?'yellow':/Length regulator|Mel spectrogram|tanh/i.test(label)?'green':/prosody|Mel projection/i.test(label)?'purple':'blue';
function node({id,stage,x,y,w=220,h=48,title,sub,shape,description,inner}){
  const group=el('g',{id:`arch-${id}`,class:'arch-node',role:'button',tabindex:'0','aria-pressed':'false','aria-label':`${title}. ${sub||''}`,'aria-describedby':'architecture-explanation','data-stage':stage});
  group.append(el('rect',{x,y,width:w,height:h,rx:inner?12:6,class:inner?'arch-container':'arch-box',...(inner?{}:{'data-tone':tone(title)})}));
  if(inner)inner(group);else{
    text(group,x+w/2,y+(sub?h/2-3:h/2+5),title,'arch-node-title');
    if(sub)text(group,x+w/2,y+h/2+16,sub,'arch-node-sub');
  }
  const data={id,stage,x,y,w,h,title,sub,shape,description,group};nodes.push(data);blocks.append(group);
  group.addEventListener('click',()=>select(data));
  group.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){event.preventDefault();select(data);}
    if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(event.key)){
      event.preventDefault();const index=nodes.indexOf(data),delta=['ArrowRight','ArrowDown'].includes(event.key)?1:-1;
      const next=nodes[event.key==='Home'?0:event.key==='End'?nodes.length-1:(index+delta+nodes.length)%nodes.length];
      next.group.focus({preventScroll:true});select(next,true);
    }
  });return data;
}
function operation(parent,x,y,w,h,label,sub){
  parent.append(el('rect',{x,y,width:w,height:h,rx:4,class:'arch-operation','data-tone':tone(label)}));
  text(parent,x+w/2,y+(sub?h/2-3:h/2+5),label,'arch-node-title');
  if(sub)text(parent,x+w/2,y+h/2+14,sub,'arch-node-sub');
}
function frameGroup(id,y,count,dilations){
  return node({id,stage:'acoustic',x:390,y,w:240,h:174,title:`Frame blocks × ${count}`,sub:`Dilations ${dilations}`,shape:'T × 160 → T × 160',
    description:`${count} residual blocks refine the frame sequence. Each uses a depthwise convolution (kernel 7; dilations ${dilations}), LayerNorm, a 160 → 320 → 160 feed-forward layer with GELU, and a learned scale before adding the input back.`,
    inner:g=>{
      operation(g,410,y+112,200,32,'Depthwise Conv1D','kernel 7');
      operation(g,410,y+60,200,36,'LayerNorm + feed forward','160 → 320 → 160');
      operation(g,410,y+14,200,30,'Scale & add');
      vertical(510,y+174,y+146,g);vertical(510,y+112,y+98,g);vertical(510,y+60,y+46,g);line(`M510 ${y+14}V${y}`,false,'arch-wire',g);
      line(`M510 ${y+160}H404Q398 ${y+160} 398 ${y+154}V${y+35}Q398 ${y+29} 404 ${y+29}H408`,true,'arch-wire',g);
      g.append(el('circle',{cx:510,cy:y+160,r:2,class:'arch-junction'}));
      text(labels,648,y+85,`${count}×`,'arch-repeat');
    }});
}
text(labels,170,32,'Text encoder','arch-column-title');text(labels,510,32,'Acoustic features','arch-column-title');text(labels,830,32,'Waveform decoder','arch-column-title');
text(labels,170,57,'Phoneme sequence','arch-column-sub');text(labels,510,57,'80-band mel spectrogram','arch-column-sub');text(labels,830,57,'HiFi-GAN V2','arch-column-sub');
text(labels,170,850,'English text → phonemes + stress','arch-caption');
node({id:'embedding',stage:'text',x:60,y:772,title:'Sum embeddings',sub:'Phonemes + lexical stress',shape:'N tokens → N × 160',description:'The browser normalizes text and looks up pronunciations, with a phonemizer fallback for unfamiliar words. Learned 132 × 160 phoneme and 3 × 160 stress tables map the resulting IDs into vectors. This is a single-speaker model; it has no speaker-ID embedding.'});
vertical(170,832,822);
node({id:'position',stage:'text',x:60,y:704,h:40,title:'Add position',sub:'Sinusoidal encoding',shape:'N × 160 → N × 160',description:'A fixed sinusoidal position encoding tells the encoder where each phoneme occurs. It adds no learned parameters.'});
vertical(170,772,746);line('M170 704V670',false);
node({id:'text-block',stage:'text',x:40,y:302,w:260,h:368,title:'Text block × 4',shape:'N × 160 → N × 160',description:'Four blocks combine four-head self-attention with local depthwise convolution. Attention mixes phoneme context; the 160 → 480 → 160 feed-forward network uses GELU. Both branches have residual connections, and the convolution branch has a learned output scale.',inner:g=>{
  operation(g,70,620,200,28,'LayerNorm');operation(g,70,568,200,40,'Self-attention','4 heads · width 160');operation(g,70,524,200,28,'Add');
  operation(g,70,468,200,40,'Depthwise Conv1D','kernel 7');operation(g,70,424,200,28,'LayerNorm');operation(g,70,368,200,40,'Feed forward','160 → 480 → 160');operation(g,70,324,200,28,'Scale & add');
  [[670,650],[620,610],[568,554],[524,510],[468,454],[424,410],[368,354]].forEach(([b,t])=>vertical(170,b,t,g));
  line('M170 324V302',false,'arch-wire',g);
  // Residual routes stay inside the repeated block, clear of the main arrows.
  line('M170 664H62Q56 664 56 658V544Q56 538 62 538H68',true,'arch-wire',g);
  line('M170 520H68Q62 520 62 514V344Q62 338 68 338H68',true,'arch-wire',g);
  [664,520].forEach(y=>g.append(el('circle',{cx:170,cy:y,r:2,class:'arch-junction'})));
  text(labels,316,490,'4×','arch-repeat');
}});
line('M170 302V286',false);wires.append(el('circle',{cx:170,cy:286,r:2.5,fill:'#555'}));
node({id:'duration',stage:'text',x:60,y:208,h:54,title:'Duration predictor',sub:'2 × Conv1D + linear',shape:'N × 160 → N durations',description:'Two kernel-3 convolution layers, each with LayerNorm and ReLU, predict log(1 + duration). The browser converts these into positive frame counts and applies speed and punctuation adjustments before length regulation.'});
vertical(170,286,264);
node({id:'phone-prosody',stage:'text',x:60,y:108,h:54,title:'Phoneme prosody',sub:'Pitch · voicing · energy',shape:'N × 160 → N × 3',description:'A separate head reads the encoder output and predicts coarse log pitch, voicing logits and log energy for each phoneme. It uses LayerNorm, a 160 → 160 → 3 MLP and GELU. These values are later repeated to the frame sequence.'});
// Two independent heads read the encoder output; duration does not feed prosody.
line('M170 286H310Q316 286 316 280V184Q316 178 310 178H176Q170 178 170 172V164');
line('M280 235H324Q330 235 330 241V784Q330 790 336 790H398');
line('M170 286H340Q346 286 346 292V799Q346 805 352 805H398');
line('M280 135H360Q366 135 366 141V472Q366 478 372 478H398');
text(labels,250,281,'Encoded phones','arch-edge-label');

node({id:'length',stage:'acoustic',x:400,y:772,title:'Length regulator',sub:'N phonemes → T frames',shape:'N × 160 → T × 160',description:'The browser builds frame indices from predicted durations. Gathering with those indices repeats both encoder vectors and phoneme prosody to the required length. This step is deterministic JavaScript plus gather operations, with no learned weights.'});
node({id:'frame-position',stage:'acoustic',x:400,y:704,h:40,title:'Add within-phone position',shape:'[p, sin(πp), cos(πp)] → 160',description:'A learned linear layer projects progress through the current phoneme into 160 channels and adds it to each frame. This lets the model vary the sound within a phoneme rather than repeat an identical frame.'});
vertical(510,772,746);line('M510 704V682',false);
frameGroup('frames-first',508,2,'1, 2');
vertical(510,508,500);
node({id:'prosody',stage:'acoustic',x:400,y:450,h:48,title:'Prosody conditioning',sub:'Gathered coarse + frame residual',shape:'T × 3 → T × 160, added to frames',description:'A linear head predicts a frame-level correction to the gathered phoneme prosody. Pitch, sigmoid(voicing) and energy are projected from 3 to 160 channels and added to the frame representation. The browser’s pitch and energy controls act here; they do not select a different speaker.'});
line('M510 450V426',false);
frameGroup('frames-final',252,4,'4, 8, 1, 2');
node({id:'mel',stage:'acoustic',x:400,y:156,h:54,title:'Mel projection',sub:'160 → 80 + denormalization',shape:'T × 160 → T × 80',description:'A linear layer predicts 80 normalized mel bands per frame. The stored training mean and standard deviation restore the native log-mel scale expected by the frozen HiFi-GAN vocoder. The interface is 22,050 Hz audio with a 256-sample hop.'});
vertical(510,252,212);
// Route mel features around the acoustic column to the bottom of the vocoder.
line('M510 156V130Q510 122 518 122H674Q682 122 682 130V788Q682 796 690 796H718');
text(labels,598,113,'T × 80 mel features','arch-edge-label');

node({id:'mel-input',stage:'vocoder',x:720,y:772,title:'Mel spectrogram',sub:'80 bands · hop 256',shape:'80 × T',description:'HiFi-GAN receives only the predicted mel spectrogram. Unlike the earlier experimental iSTFT decoder, this released waveform decoder does not concatenate pitch and energy channels.'});
node({id:'vocoder-input',stage:'vocoder',x:720,y:698,title:'Conv1D',sub:'80 → 128 · kernel 7',shape:'80 × T → 128 × T',description:'The first convolution maps the mel bands to 128 channels. All HiFi-GAN parameters are pretrained LJ_V2 weights; weight normalization has been removed for deployment.'});
vertical(830,772,748);
const stages=[[1,600,8,128,64],[2,500,8,64,32],[3,400,2,32,16],[4,300,2,16,8]];
for(const [index,y,rate,input,output] of stages){
  node({id:`upsample-${index}`,stage:'vocoder',x:720,y,h:70,title:`Upsample × ${rate}`,sub:`${input} → ${output} channels · MRF`,shape:`Stage ${index} / 4 · transposed convolution + residual blocks`,description:`LeakyReLU and a stride-${rate} transposed convolution increase time resolution. Three parallel residual blocks with kernel sizes 3, 7 and 11 (dilations 1, 3 and 5) are averaged: multi-receptive-field fusion, or MRF. Across all four stages, 8 × 8 × 2 × 2 = 256 waveform samples are produced per mel frame.`});
}
[[698,672],[600,572],[500,472],[400,372]].forEach(([b,t])=>vertical(830,b,t));
node({id:'waveform',stage:'vocoder',x:720,y:214,title:'Conv1D + tanh',sub:'8 → 1 · kernel 7',shape:'8 × 256T → 1 × 256T',description:'The last convolution produces one audio channel and tanh bounds the waveform. The browser assembles the generated chunks into 22.05 kHz mono audio for playback or a WAV download. Training discriminators are not part of the deployed voice.'});
vertical(830,300,264);vertical(830,214,162);
text(labels,830,121,'Speech waveform','arch-output');text(labels,830,146,'22.05 kHz · mono','arch-column-sub');
text(labels,170,880,'N = phonemes','arch-caption');text(labels,510,880,'T = acoustic frames','arch-caption');text(labels,830,880,'256 samples per frame','arch-caption');

function select(data,pan=false){
  for(const n of nodes){n.group.setAttribute('aria-pressed',String(n===data));n.group.classList.toggle('in-stage',n.stage===data.stage);}
  $('architecture-step').textContent={text:'Text encoder',acoustic:'Acoustic features',vocoder:'Waveform decoder'}[data.stage];
  $('architecture-block-title').textContent=data.title;$('architecture-shape').textContent=data.shape;$('architecture-explanation').textContent=data.description;
  if(pan){
    const scroll=$('architecture-scroll'),scale=diagram.getBoundingClientRect().width/1000;
    scroll.scrollTo({left:(data.x+data.w/2)*scale-scroll.clientWidth/2,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
}
select(nodes[0]);
try{
  const response=await fetch(new URL('./model-size.json?h=370842fc0871',import.meta.url));if(!response.ok)throw new Error('Size metadata unavailable');
  const size=await response.json();
  $('weight-size').textContent=(size.weight_bytes/1e6).toFixed(2)+' MB';$('voice-size').textContent=(size.voice_asset_bytes/1e6).toFixed(2)+' MB';
  $('voice-size').title=size.units;$('weight-size').title=`${size.weight_bytes.toLocaleString()} bytes · ${(size.weight_bytes/1048576).toFixed(2)} MiB`;
}catch(error){$('voice-size').textContent='Unavailable';console.warn(error);}
