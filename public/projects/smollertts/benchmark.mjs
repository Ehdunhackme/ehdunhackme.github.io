import {METRICS, hasMetric, formatMetric, promptValues, bounds, frontier} from './benchmark-metrics.mjs?h=370842fc0871';
const $ = id => document.getElementById(id);
const svg = (tag, attrs, text) => {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
};
const format = n => n < 1 ? `${+(n * 1000).toFixed(1)}K` : n >= 1000 ? `${+(n / 1000).toFixed(2)}B` : `${+n.toFixed(2)}M`;
const group = row => row.local ? 'own' : row.parameters_m < 10 ? 'small' : row.parameters_m < 100 ? 'medium' : 'large';
// Find nearby empty plot space for the persistent label. Keep the full point
// hit targets clear, not just their visible dots. Axes stay outside the bounds.
function placeCallout(anchor, size, area, obstacles) {
  const maxX=area.right-size.width, maxY=area.bottom-size.height;
  if(maxX<area.left||maxY<area.top)return null;
  const candidates=[
    [anchor.x+18,anchor.y+18], [anchor.x+18,anchor.y-size.height-18],
    [anchor.x-size.width-18,anchor.y+18], [anchor.x-size.width-18,anchor.y-size.height-18],
    [anchor.x-size.width/2,anchor.y-size.height-18], [anchor.x-size.width/2,anchor.y+18]
  ];
  for(let top=area.top;top<=maxY;top+=8)for(let left=area.left;left<=maxX;left+=8)candidates.push([left,top]);
  let best=null, bestCost=Infinity;
  for(const [x,y] of candidates){
    const left=Math.max(area.left,Math.min(maxX,x)),top=Math.max(area.top,Math.min(maxY,y));
    const right=left+size.width,bottom=top+size.height;
    if(obstacles.some(o=>left<o.right+4&&right>o.left-4&&top<o.bottom+4&&bottom>o.top-4))continue;
    const edgeX=Math.max(left,Math.min(right,anchor.x)),edgeY=Math.max(top,Math.min(bottom,anchor.y));
    const cost=(edgeX-anchor.x)**2+(edgeY-anchor.y)**2+.03*((left+size.width/2-anchor.x)**2+(top+size.height/2-anchor.y)**2);
    if(cost<bestCost){bestCost=cost;best={left,top,edgeX,edgeY};}
  }
  return best;
}
function sourceLink(url,label,modelName='') {
  const anchor=document.createElement('a');anchor.href=url;anchor.target='_blank';anchor.rel='noopener noreferrer';anchor.className='source-link';
  const host=new URL(url,location.href).hostname;
  if(host==='github.com'||host==='huggingface.co'){
    const logo=document.createElement('img');logo.src=host==='github.com'?'./icons/github.svg':'./icons/huggingface.svg';logo.width=16;logo.height=16;logo.alt='';logo.className='source-logo';anchor.append(logo);
  }
  const name=document.createElement('span');name.textContent=label;anchor.append(name);
  const arrow=svg('svg',{viewBox:'0 0 24 24',class:'icon external-arrow','aria-hidden':'true'});
  arrow.append(svg('path',{d:'M7 17 17 7M7 7h10v10'}));anchor.append(arrow);
  anchor.setAttribute('aria-label',`${modelName?modelName+' on ':''}${label} (opens in a new tab)`);
  return anchor;
}
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const transition = {duration: 300, easing: 'cubic-bezier(.22,1,.36,1)'};
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) $('chart').getAnimations({subtree: true}).forEach(animation => animation.cancel());
});

try {
  const response = await fetch(new URL('./benchmark.json?h=370842fc0871', import.meta.url));
  if (!response.ok) throw new Error('Benchmark unavailable');
  const snapshot = await response.json(), data = snapshot.cohorts?.published || snapshot;
  const own = data.models.find(m => m.local), tooltip = $('chart-tooltip');
  let metric = 'utmos', range = 'all', selected = own, coordinates = new Map();
  const valueText = row => `${formatMetric(row[metric], metric)} ${METRICS[metric].label}`;
  function choose(row) {
    selected = row;
    document.querySelectorAll('.chart-point').forEach(p => p.classList.toggle('selected', p.dataset.id === row?.id));
    $('chart-selection').textContent = row ? `${row.name}, ${format(row.parameters_m)} parameters, ${valueText(row)}.` : '';
  }
  function showTooltip(row) {
    const pos = coordinates.get(row.id); if (!pos) return;
    tooltip.replaceChildren();
    const title = document.createElement('strong'), metrics = document.createElement('span'), provenance = document.createElement('small');
    title.textContent = row.name;
    metrics.textContent = `${row.approximate ? '~' : ''}${format(row.parameters_m)} parameters · ${valueText(row)}`;
    provenance.textContent = `${row.local ? 'Measured here' : 'Published'} · ${row.runtime} · ${row.n} clips`;
    tooltip.append(title, metrics, provenance);
    const values = promptValues(row, metric);
    if (values.length) {
      const scores = document.createElement('small');
      scores.textContent = `Prompts 1–4: ${values.map(v => formatMetric(v,metric)).join(' · ')}`;
      tooltip.append(scores);
    }
    tooltip.hidden = false;
    const width = tooltip.offsetWidth, height = tooltip.offsetHeight;
    tooltip.style.left = Math.max(0, Math.min(pos.x - width / 2, $('chart').clientWidth - width)) + 'px';
    tooltip.style.top = Math.max(0, pos.y - height - 18) + 'px';
  }
  function draw(animate = false) {
    const previous = coordinates;
    const focusedId = document.activeElement?.classList.contains('chart-point') ? document.activeElement.dataset.id : null;
    tooltip.hidden = true; coordinates = new Map();
    const chart = $('chart'), grid = $('chart-grid'), points = $('chart-points'), labels = $('chart-labels');
    const width = chart.clientWidth, height = chart.clientHeight, mobile = width < 500;
    const pad = {left: metric === 'wer' ? 44 : mobile ? 26 : 38, right: mobile ? 12 : 24, top: 20, bottom: 32};
    const plotW = width - pad.left - pad.right, plotH = height - pad.top - pad.bottom;
    const candidates = data.models.filter(m => range === 'all' || m.parameters_m < 10);
    const visible = candidates.filter(m => hasMetric(m, metric));
    const max = range === 'small' ? 13 : Math.max(...data.models.map(m => m.parameters_m)) * 1.5;
    const x = n => pad.left + (Math.log10(n) - Math.log10(.07)) / (Math.log10(max) - Math.log10(.07)) * plotW;
    const spread = $('show-spread').checked, scale = bounds(visible, metric, spread);
    const y = n => pad.top + (scale.max - n) / (scale.max - scale.min) * plotH;
    document.querySelector('.own-callout.is-docked')?.remove();
    grid.setAttribute('viewBox', `0 0 ${width} ${height}`); grid.replaceChildren(); points.replaceChildren(); labels.replaceChildren();
    for (let i = 0; i <= Math.round((scale.max - scale.min) / scale.step); i++) {
      const value = scale.min + i * scale.step;
      grid.append(svg('line', {x1: pad.left, x2: width - pad.right, y1: y(value), y2: y(value), class: 'grid-line'}));
      grid.append(svg('text', {x: pad.left - 10, y: y(value) + 4, 'text-anchor': 'end', class: 'axis-text'}, metric === 'wer' ? `${Math.round(value * 100)}%` : +value.toFixed(1)));
    }
    for (const value of range === 'small' ? [.1, .5, 1, 5, 10] : [.1, 1, 10, 100, 1000, 10000]) grid.append(svg('text', {x: x(value), y: height - 8, 'text-anchor': 'middle', class: 'axis-text'}, format(value)));
    const steps = frontier(visible, metric).map((row,i) => i ? `H${x(row.parameters_m)}V${y(row[metric])}` : `M${x(row.parameters_m)},${y(row[metric])}`);
    if (steps.length) {
      steps.push(`H${width-pad.right}`);
      const path = svg('path', {d: steps.join(''), class: 'frontier'});
      path.append(svg('title', {}, `Best observed ${METRICS[metric].label} at or below each parameter budget`)); grid.append(path);
    }
    const ownVisible = visible.includes(own);
    if (ownVisible) grid.append(svg('line', {x1: x(own.parameters_m), x2: x(own.parameters_m), y1: y(own[metric]), y2: y(scale.min), class: 'own-guide'}));
    // Missing scores never produce a point at zero. Draw ours above peer targets.
    for (const row of [...visible.filter(m => !m.local), ...visible.filter(m => m.local)]) {
      const px = x(row.parameters_m), py = y(row[metric]); coordinates.set(row.id, {x: px, y: py});
      if (spread) {
        const values = promptValues(row, metric);
        if (values.length > 1) {
          const lo = y(Math.min(...values)), hi = y(Math.max(...values));
          const whisker = svg('path', {d: `M${px},${lo}V${hi}M${px-3},${lo}H${px+3}M${px-3},${hi}H${px+3}`, class: `prompt-range ${group(row)}`});
          whisker.append(svg('title', {}, `${row.name}: min–max across four prompts, not a confidence interval`)); grid.append(whisker);
        }
      }
      const button = document.createElement('button'); button.type = 'button'; button.className = `chart-point ${group(row)}`;
      button.dataset.id = row.id; button.style.left = px + 'px'; button.style.top = py + 'px';
      button.setAttribute('aria-label', `${row.name}, ${format(row.parameters_m)} parameters, ${valueText(row)}`);
      button.setAttribute('aria-describedby', 'chart-tooltip');
      button.addEventListener('mouseenter', () => showTooltip(row));
      button.addEventListener('mouseleave', () => {tooltip.hidden = true;});
      button.addEventListener('focus', () => {choose(row); showTooltip(row);});
      button.addEventListener('blur', () => {tooltip.hidden = true;});
      button.addEventListener('click', () => {choose(row); showTooltip(row);});
      button.addEventListener('keydown', e => {if (e.key === 'Escape') tooltip.hidden = true;});
      points.append(button);
      if (animate && !reducedMotion.matches) {
        const old = previous.get(row.id);
        button.animate(old ? [{transform: `translate(calc(-50% + ${old.x-px}px), calc(-50% + ${old.y-py}px))`}, {transform: 'translate(-50%,-50%)'}] : [{opacity: 0}, {opacity: 1}], transition);
      }
      if (row.id === focusedId) button.focus({preventScroll: true});
    }
    if (metric === 'utmos') for (const id of ['tinyvoca', ...(mobile ? [] : ['sanotts_amy','kokoro'])]) {
      const row = visible.find(m => m.id === id); if (!row) continue;
      const label = document.createElement('span');label.className='peer-label';label.textContent=row.name;
      label.style.left=x(row.parameters_m)+(id==='sanotts_amy'?-12:10)+'px';label.style.top=y(row[metric])-24+'px';
      if(id==='sanotts_amy'||(mobile&&range==='small'))label.style.transform='translateX(-100%)';labels.append(label);
    }
    if (ownVisible) {
      const callout = document.createElement('div'); callout.className = 'own-callout';
      const name = document.createElement('strong'), score = document.createElement('span');
      name.textContent = own.name; score.textContent = `${format(own.parameters_m)} · ${valueText(own)}`; callout.append(name, score);labels.append(callout);
      const obstacles=[...coordinates.values()].map(p=>({left:p.x-14,right:p.x+14,top:p.y-14,bottom:p.y+14}));
      const chartRect=chart.getBoundingClientRect();
      for(const label of labels.querySelectorAll('.peer-label')){
        const r=label.getBoundingClientRect();obstacles.push({left:r.left-chartRect.left,right:r.right-chartRect.left,top:r.top-chartRect.top,bottom:r.bottom-chartRect.top});
      }
      if(spread)for(const row of visible){
        const values=promptValues(row,metric);if(values.length<2)continue;
        obstacles.push({left:x(row.parameters_m)-4,right:x(row.parameters_m)+4,top:y(Math.max(...values)),bottom:y(Math.min(...values))});
      }
      const anchor=coordinates.get(own.id);
      const position=placeCallout(anchor,{width:callout.offsetWidth,height:callout.offsetHeight},
        {left:pad.left+4,right:width-pad.right-4,top:pad.top+4,bottom:height-pad.bottom-4},obstacles);
      if(position){
        callout.style.left=position.left+'px';callout.style.top=position.top+'px';
        grid.append(svg('line',{x1:anchor.x,y1:anchor.y,x2:position.edgeX,y2:position.edgeY,class:'callout-connector'}));
      }else{
        // Extremely cramped plots keep the score outside the data area.
        callout.classList.add('is-docked');document.querySelector('.chart-axis').prepend(callout);
      }
    }
    $('model-count').textContent=`${visible.length} configurations`;
    $('chart-metric').textContent=`${METRICS[metric].label} ${METRICS[metric].direction}${spread?' · bars show min–max, not confidence':''}`;
    $('metric-note').textContent=METRICS[metric].note;
    chart.setAttribute('aria-label',`Interactive chart of ${METRICS[metric].label} against reported model parameter count`);
    for(const name of ['own','small','medium','large']) document.querySelector(`.legend .${name}`).parentElement.hidden=!visible.some(row=>group(row)===name);
    if(animate&&!reducedMotion.matches){grid.animate([{opacity:.15},{opacity:1}],transition);labels.animate([{opacity:0},{opacity:1}],{...transition,duration:160,delay:transition.duration,fill:'backwards'});}
    choose(visible.includes(selected)?selected:ownVisible?own:visible[0]);
  }
  document.querySelectorAll('[data-range]').forEach(button=>button.addEventListener('click',()=>{
    range=button.dataset.range;document.querySelector('.chart-range').dataset.active=range;
    document.querySelectorAll('[data-range]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.range===range)));draw(true);
  }));
  document.querySelectorAll('[data-metric]').forEach(button=>button.addEventListener('click',()=>{
    metric=button.dataset.metric;document.querySelectorAll('[data-metric]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.metric===metric)));draw(true);
  }));
  $('show-spread').addEventListener('change',()=>draw(true));new ResizeObserver(()=>draw()).observe($('chart'));
  let sortKey='utmos',sortDirection=-1;
  const collator=new Intl.Collator('en',{numeric:true,sensitivity:'base'});
  function renderTable(){
    const query=$('model-search').value.trim().toLowerCase();
    const rows=data.models.filter(row=>row.name.toLowerCase().includes(query)).sort((a,b)=>{
      if(a[sortKey]==null||b[sortKey]==null)return Number(a[sortKey]==null)-Number(b[sortKey]==null);
      const diff=['name','runtime'].includes(sortKey)?collator.compare(a[sortKey],b[sortKey]):Number(a[sortKey])-Number(b[sortKey]);
      return diff*sortDirection||collator.compare(a.name,b.name);
    });
    $('benchmark-table').replaceChildren();
    for(const row of rows){
      const tr=document.createElement('tr');if(row.local)tr.className='active-row';tr.dataset.modelId=row.id;
      const td=document.createElement('td');td.textContent=row.name;td.title=row.name;tr.append(td);
      for(const text of [(row.approximate?'~':'')+format(row.parameters_m),formatMetric(row.utmos,'utmos'),hasMetric(row,'wer')?formatMetric(row.wer,'wer'):'—',row.runtime]){
        const cell=document.createElement('td');cell.textContent=text;if(text==='—')cell.title='No comparable score available';tr.append(cell);
      }
      const source=document.createElement('td');source.className='model-source';
      const url=row.local?'https://huggingface.co/dunli5107/SmollerTTS':row.source;
      const host=new URL(url).hostname;
      source.append(sourceLink(url,host==='github.com'?'GitHub':host==='huggingface.co'?'Hugging Face':'Website',row.name));tr.append(source);
      $('benchmark-table').append(tr);
    }
    if(!rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=6;td.className='empty-results';td.textContent='No models found';tr.append(td);$('benchmark-table').append(tr);}
    $('table-count').textContent=`${rows.length} of ${data.models.length} configurations`;
    document.querySelectorAll('[data-sort]').forEach(button=>{
      const active=button.dataset.sort===sortKey;button.parentElement.removeAttribute('aria-sort');
      if(active)button.parentElement.setAttribute('aria-sort',sortDirection===1?'ascending':'descending');
      button.querySelector('span').textContent=active?sortDirection===1?'↑':'↓':'↕';
    });
  }
  $('results-total').textContent=data.models.length;$('model-search').addEventListener('input',renderTable);
  document.querySelectorAll('[data-sort]').forEach(button=>button.addEventListener('click',()=>{
    const next=button.dataset.sort;sortDirection=sortKey===next?-sortDirection:next==='utmos'?-1:1;sortKey=next;renderTable();
  }));
  $('benchmark-note').textContent='Published overview: four English prompts per configuration. Peer scores come from tts-bench; SmollerTTS was scored here.';
  const notes=[
    'UTMOS estimates naturalness. WER counts transcription errors using Whisper large-v3; the chart uses the mean of four prompt WERs. Neither metric measures human preference.',
    'Each dot is a four-prompt mean. Turn on prompt range to see its lowest and highest scores. These bars are not confidence intervals. The step line marks the best observed mean up to each model size.',
    'We use a complete Linux CPU run where available, otherwise a complete CUDA run. SmollerTTS uses browser CPU output, scored here with Whisper large-v3 in FP32 on CPU. Voices, runtimes and scoring revisions differ, so small score gaps are not a reliable ranking.',
    'Parameter counts are source-reported (~ means approximate). Missing scores stay blank. Speaker similarity needs a shared target voice; CPU speed needs matched hardware. Neither is mixed into this overview.'
  ];
  for(const text of notes){const p=document.createElement('p');p.textContent=text;$('benchmark-method').append(p);}
  const sources=document.createElement('div');sources.className='benchmark-sources';sources.setAttribute('aria-label','Benchmark sources');
  for(const source of [...data.sources,{name:'UTMOS paper',url:'https://arxiv.org/abs/2204.02152'}]) sources.append(sourceLink(source.url,source.name==='Sizes'?'Parameter counts':source.name));
  if(own.wer_provenance) sources.append(sourceLink('./smollertts-wer.json?h=370842fc0871','Our WER report'));
  $('benchmark-method').append(sources);renderTable();draw();document.fonts.ready.then(()=>draw());
}catch(error){
  $('model-count').textContent='Chart unavailable';$('chart-selection').classList.remove('sr-only');$('chart-selection').textContent='Could not load the comparison. Reload to try again.';console.error(error);
}
