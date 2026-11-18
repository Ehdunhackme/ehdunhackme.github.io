import {PRESETS, validateControls} from './controls.mjs?h=0b8a8584919b';
import {wavBlob, SAMPLE_RATE} from './audio.mjs?h=0b8a8584919b';
import {animateDisclosures} from './disclosures.mjs?h=0b8a8584919b';
// The optional comparison chart must not hold up the speech editor.
void import('./benchmark.mjs?h=0b8a8584919b');
void import('./links.mjs?h=0b8a8584919b');
void import('./architecture.mjs?h=0b8a8584919b');
animateDisclosures();

const $ = id => document.getElementById(id);
$('shortcut').textContent = /Mac/.test(navigator.platform) ? '⌘ ↵' : 'Ctrl ↵';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionOptions = {duration: 200, easing: 'cubic-bezier(.22,1,.36,1)'};
let settingsAnimation;
function toggleSettings(open = $('advanced').hidden) {
  settingsAnimation?.cancel();
  $('settings-toggle').setAttribute('aria-expanded', String(open));
  $('advanced').hidden = !open;
  if (open && !reducedMotion.matches) settingsAnimation = $('advanced').animate(
    [{opacity: 0, transform: 'translateY(-4px)'}, {opacity: 1, transform: 'translateY(0)'}], motionOptions);
}
$('settings-toggle').addEventListener('click', () => toggleSettings());
$('advanced').addEventListener('keydown', event => {
  if (event.key === 'Escape') {toggleSettings(false); $('settings-toggle').focus();}
});
reducedMotion.addEventListener('change', () => {if (reducedMotion.matches) settingsAnimation?.cancel();});
const examples = {
  punctuation: 'You are coming with us. You are coming with us? You are coming with us!',
  story: 'At the edge of the garden, a little bird waited for the rain to stop. Then the sun came out, and the whole world seemed to take a breath.',
  everyday: 'The meeting moved to 3:30 pm on March 14th, so we have about 45 minutes left. It costs $12.99.',
  curious: 'The microcontroller responds within a millisecond. Small things can do surprising things.'
};
// Start each visit with the selective defaults, not restored experimental state.
$('split-compounds').checked = true;
$('punctuation').checked = true;
let worker, loadingTimer, sequence = 0, current, audioUrl, waveform, peaks, context, streamStart = 0, streamEnd = 0;
let streaming = false, streamAllowed = false, busy = false, frame;
const sources = new Set();
let segments = [];
window.ready = false; window.failure = null;
const readControls = () => validateControls(Object.fromEntries(['speed', 'pitch', 'energy'].map(name => [name, Number($(name).value)])));
function status(message, error = false) { $('status').textContent = message; $('status').dataset.error = String(error); }
function controlsChanged() {
  const c = readControls();
  $('speed-value').textContent = c.speed.toFixed(2) + '×';
  $('pitch-value').textContent = `${c.pitch > 0 ? '+' : ''}${c.pitch.toFixed(2)} st`;
  $('energy-value').textContent = `${c.energy > 0 ? '+' : ''}${c.energy.toFixed(2)} dB`;
}
function preset(name) {for (const [key, value] of Object.entries(PRESETS[name])) $(key).value = value; $('style').value = name; controlsChanged();}
$('style').addEventListener('change', () => preset($('style').value));
for (const name of ['speed', 'pitch', 'energy']) $(name).addEventListener('input', () => {$('style').value = 'custom'; controlsChanged();});
$('reset-voice').addEventListener('click', () => preset('natural'));
function count() {$('generate').disabled = !window.ready || busy || !$('text').value.trim();}
$('text').addEventListener('input', count);
let exampleIndex = 0;
$('example').addEventListener('click', () => {
  const choices = Object.values(examples);
  $('text').value = choices[exampleIndex++ % choices.length]; count(); $('text').focus();
  if (!reducedMotion.matches) $('text').animate([{opacity: .35}, {opacity: 1}], motionOptions);
});
$('clear').addEventListener('click', () => {$('text').value = ''; count(); $('text').focus();});
document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => {$('text').value = examples[button.dataset.example]; count(); $('text').focus();}));
function setBusy(value) {
  busy = value; count(); $('cancel').hidden = !value; $('cancel').disabled = false;
  $('voice-controls').disabled = !window.ready || value; $('text').readOnly = value;
  $('clear').disabled = value; $('stream').disabled = value;
  $('example').disabled = value; $('pronunciations').disabled = value; $('split-compounds').disabled = value; $('punctuation').disabled = value;
  document.querySelectorAll('[data-example]').forEach(button => button.disabled = value);
  $('generate-label').textContent = value ? 'Generating…' : window.ready ? 'Generate speech' : 'Loading voice';
  $('state-label').textContent = value ? 'Making your audio' : window.ready ? 'Ready on your device' : 'Loading the voice…';
  $('generate').setAttribute('aria-busy', String(value));
}
function stopStream() {
  streaming = false; streamAllowed = false;
  for (const source of sources) {source.onended = null; try {source.stop();} catch {} source.disconnect();}
  sources.clear(); segments = []; streamStart = streamEnd = 0;
}
async function prepareStream() {
  streamAllowed = $('stream').checked;
  if (!streamAllowed) return;
  try {context ??= new AudioContext({sampleRate: SAMPLE_RATE}); await context.resume(); streamAllowed = context.state === 'running';}
  catch {streamAllowed = false;}
}
function enqueue(wave) {
  if (!streamAllowed) return;
  const buffer = context.createBuffer(1, wave.length, SAMPLE_RATE); buffer.copyToChannel(wave, 0);
  const source = context.createBufferSource(); source.buffer = buffer; source.connect(context.destination);
  const start = Math.max(context.currentTime + .025, streamEnd);
  if (!streamStart) streamStart = start;
  streamEnd = start + buffer.duration; segments.push({start, duration: buffer.duration}); sources.add(source); streaming = true;
  source.onended = () => {sources.delete(source); source.disconnect(); if (!sources.size && !busy) {streaming = false; $('audio').currentTime = $('audio').duration || 0; paint();}};
  source.start(start); animate();
}
function clock(value) {value = Math.max(0, Math.floor(value || 0)); return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;}
function streamPosition() {return segments.reduce((sum, s) => sum + Math.min(s.duration, Math.max(0, context.currentTime - s.start)), 0);}
function paint() {
  if (!waveform) return;
  const duration = waveform.length / SAMPLE_RATE;
  const time = streaming ? Math.min(duration, streamPosition()) : $('audio').currentTime || 0;
  const fraction = time / duration;
  $('time').textContent = `${clock(time)} / ${clock(duration)}`;
  $('seek').value = fraction * 100; $('seek').setAttribute('aria-valuetext', `${time.toFixed(1)} of ${duration.toFixed(1)} seconds`);
  const playing = streaming || !$('audio').paused;
  $('play').setAttribute('aria-label', playing ? 'Pause audio' : 'Play audio'); $('play').dataset.playing = String(playing);
  const canvas = $('waveform'), ctx = canvas.getContext('2d'), ratio = devicePixelRatio || 1;
  const width = Math.round(canvas.clientWidth * ratio), heightPx = Math.round(canvas.clientHeight * ratio);
  if (!width || !heightPx) return;
  if (canvas.width !== width || canvas.height !== heightPx) {canvas.width = width; canvas.height = heightPx;}
  const bars = Math.min(peaks.length, Math.max(1, Math.floor(canvas.clientWidth / 6)));
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 3 * ratio; ctx.lineCap = 'round';
  for (let i = 0; i < bars; i++) {
    let peak = 0;
    for (let j = Math.floor(i * peaks.length / bars); j < Math.ceil((i + 1) * peaks.length / bars); j++) peak = Math.max(peak, peaks[j]);
    const height = Math.max(2 * ratio, Math.min(canvas.height - 8 * ratio, Math.sqrt(peak) * canvas.height));
    const x = (i + .5) * canvas.width / bars;
    ctx.strokeStyle = i / bars < fraction ? '#171717' : '#d6d6d6';
    ctx.beginPath(); ctx.moveTo(x, (canvas.height - height) / 2); ctx.lineTo(x, (canvas.height + height) / 2); ctx.stroke();
  }
}
new ResizeObserver(paint).observe($('waveform'));
function animate() {cancelAnimationFrame(frame); paint(); if (streaming || !$('audio').paused) frame = requestAnimationFrame(animate);}
$('play').addEventListener('click', async () => {
  if (streaming) {const time = streamPosition(); stopStream(); $('audio').currentTime = Math.min(time, $('audio').duration || 0); paint(); return;}
  if (!$('audio').paused) $('audio').pause();
  else {if ($('audio').ended) $('audio').currentTime = 0; try {await $('audio').play();} catch {status('Press play again to allow audio on this device.');}}
});
$('audio').addEventListener('play', animate); $('audio').addEventListener('pause', paint); $('audio').addEventListener('ended', paint); $('audio').addEventListener('loadedmetadata', paint);
$('seek').addEventListener('input', async () => {
  const wasPlaying = streaming || !$('audio').paused; stopStream();
  $('audio').currentTime = Number($('seek').value) / 100 * ($('audio').duration || 0);
  if (wasPlaying) try {await $('audio').play();} catch {} paint();
});

async function generate() {
  if (busy || !window.ready || !$('text').value.trim()) return;
  stopStream(); $('audio').pause(); $('result').hidden = true;
  const text = $('text').value, controls = readControls();
  current = {id: ++sequence, chunks: [], frontend: null, started: performance.now()};
  window.lastResult = null; setBusy(true); status('Generating speech on your device…');
  await prepareStream();
  if (current.cancelled) {current = null; stopStream(); setBusy(false); status('Stopped. Edit your text and try again.'); return;}
  worker.postMessage({type: 'generate', id: current.id, text, controls, pronunciation:{splitCompounds:$('split-compounds').checked,punctuation:$('punctuation').checked,pronunciations:$('pronunciations').value}});
}
$('generate').addEventListener('click', generate);
document.addEventListener('keydown', event => {if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {event.preventDefault(); void generate();}});
$('cancel').addEventListener('click', () => {
  if (!current) return;
  stopStream(); current.cancelled = true; $('cancel').disabled = true; status('Stopping…');
  worker.postMessage({type: 'cancel', id: current.id});
});
function failed(message) {stopStream(); setBusy(false); status(message, true); current = null;}
function finish(data) {
  const wave = new Float32Array(data.samples); let offset = 0;
  for (const chunk of current.chunks) {wave.set(chunk, offset); offset += chunk.length;}
  if (offset !== data.samples) {failed('The audio was incomplete. Please generate it again.'); return;}
  const frontend = current.frontend;
  waveform = wave;
  peaks = new Float32Array(110);
  for (let i = 0; i < wave.length; i++) {const bin = Math.min(109, Math.floor(i * 110 / wave.length)); peaks[bin] = Math.max(peaks[bin], Math.abs(wave[i]));}
  if (audioUrl) URL.revokeObjectURL(audioUrl);
  audioUrl = URL.createObjectURL(wavBlob(wave)); $('audio').src = audioUrl; $('download').href = audioUrl;
  $('spoken-text').textContent = frontend.normalizedText;
  const notes = frontend.pronunciationNotes;
  const replacements = notes.filter(n => ['compound','custom'].includes(n.method));
  const estimated = notes.filter(n => !['spelled','compound','custom'].includes(n.method)).map(n => n.word), spelled = notes.filter(n => n.method === 'spelled').map(n => n.word);
  $('pronunciation-note').textContent = [replacements.map(n=>`${n.word} → ${n.reading}${n.estimatedParts?.length?' (estimated parts)':''}`).join('; '),estimated.length ? 'Estimated: ' + estimated.join(', ') + '.' : '', spelled.length ? 'Spelled out: ' + spelled.join(', ') + '.' : ''].filter(Boolean).join(' ');
  $('pronunciation-note').hidden = !notes.length;
  const elapsed = performance.now() - current.started;
  window.lastResult = {...data, elapsedMs: elapsed, firstReceivedMs: current.firstReceivedMs, pronunciationNotes: notes, normalizedText: frontend.normalizedText, punctuation: frontend.chunks.map(c => c.punctuation || [])};
  const seconds = (data.samples / SAMPLE_RATE).toFixed(1);
  $('result-meta').textContent = `${seconds}s of audio · ${(elapsed / 1000).toFixed(2)}s to generate${data.cacheHits === data.chunks ? ' · Reused from this tab' : ''}`;
  $('result').hidden = false; $('result').classList.remove('arrive'); void $('result').offsetWidth; $('result').classList.add('arrive'); setBusy(false); paint();
  status('');
  current = null;
}
function startWorker() {
  worker?.terminate(); clearTimeout(loadingTimer); window.ready = false; window.failure = null; document.body.dataset.ready = 'false';
  $('retry').hidden = true; setBusy(false); status('Preparing the model for this device. The first visit downloads about 30 MB.');
  const fail = message => {clearTimeout(loadingTimer); window.failure = message; window.ready = false; document.body.dataset.ready = 'false'; failed(message); $('retry').hidden = false; $('state-label').textContent = 'Could not load the voice';};
  try {worker = new Worker(new URL('./worker.mjs?h=0b8a8584919b', import.meta.url), {type: 'module'});}
  catch {fail('This browser could not start the voice. Try a current Chrome, Edge, Firefox or Safari.'); return;}
  loadingTimer = setTimeout(() => {worker.terminate(); fail('Loading took too long. Check your connection and retry.');}, 180000);
  worker.onerror = () => fail('The voice could not run in this browser. Retry loading, or try another browser.');
  worker.onmessage = ({data}) => {
    if (data.type === 'ready') {
      clearTimeout(loadingTimer); window.ready = true; window.loadingReport = data; document.body.dataset.ready = 'true';
      setBusy(false); status(''); return;
    }
    if (data.type === 'load-error') {fail(data.message); return;}
    if (!current || data.id !== current.id) return;
    if (data.type === 'cancelled' || (current.cancelled && ['complete', 'error'].includes(data.type))) {stopStream(); current = null; setBusy(false); status('Stopped. Edit your text and try again.'); return;}
    if (current.cancelled) return;
    if (data.type === 'frontend') current.frontend = data.frontend;
    else if (data.type === 'chunk') {current.firstReceivedMs ??= performance.now() - current.started; current.chunks.push(data.wave); enqueue(data.wave); status(`Generating speech… ${data.index + 1} of ${data.total} parts ready.`);}
    else if (data.type === 'complete') finish(data);
    else if (data.type === 'error') failed(data.message);
  };
}
$('retry').addEventListener('click', startWorker);
window.addEventListener('pagehide', () => {stopStream(); $('audio').pause();});
window.addEventListener('beforeunload', () => {worker?.terminate(); if (audioUrl) URL.revokeObjectURL(audioUrl);});
preset('natural'); count(); startWorker();
