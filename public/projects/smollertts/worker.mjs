import {loadEngine} from './engine.mjs?h=370842fc0871';
import {pronounceEnglish} from './frontend.bundle.mjs?h=370842fc0871';
import {Lexicon} from './lexicon.mjs?h=370842fc0871';
import {validateControls} from './controls.mjs?h=370842fc0871';
import {AudioCache, audioKey} from './audio.mjs?h=370842fc0871';

let engine, lexicon, vocabulary, active = null;
const audioCache = new AudioCache();
const waitForMessages = () => new Promise(resolve => setTimeout(resolve, 0));
const send = (type, data = {}, transfer = []) => self.postMessage({type, ...data}, transfer);
async function initialize() {
  const started = performance.now(); let cache;
  try {cache = await caches.open('smollertts-model');} catch { /* Storage denial must not prevent generation. */ }
  const response = await fetch(new URL('./assets.json?h=370842fc0871', import.meta.url));
  if (!response.ok) throw new Error('Could not load the model manifest. Check your connection and retry.');
  const manifest = await response.json(); let cachedBytes = 0, networkBytes = 0;
  async function asset(name) {
    const info = manifest.files[name], url = new URL(name, import.meta.url);
    url.searchParams.set('v', info.sha256);
    let hit;
    try {hit = await cache?.match(url.href);} catch { /* Network fallback. */ }
    let data;
    if (hit) {data = await hit.arrayBuffer(); cachedBytes += data.byteLength;}
    else {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Could not download the voice. Check your connection and retry.');
      data = await response.arrayBuffer(); networkBytes += data.byteLength;
    }
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), n => n.toString(16).padStart(2, '0')).join('');
    if (digest !== info.sha256) {
      try {await cache?.delete(url.href);} catch { /* Retry downloads a fresh copy. */ }
      throw new Error('A model file was incomplete. Please retry loading.');
    }
    if (!hit) try {await cache?.put(url.href, new Response(data));} catch { /* Storage may be full or private. */ }
    return data;
  }
  const names = ['encoder.onnx', 'frames.onnx', 'vocoder.onnx', 'en.lex', 'frontend.json', 'ort/ort-wasm-simd-threaded.wasm'];
  const files = await Promise.all(names.map(asset));
  lexicon = new Lexicon(files[3]); vocabulary = JSON.parse(new TextDecoder().decode(files[4])).vocabulary;
  engine = await loadEngine({encoder: files[0], frames: files[1], vocoder: files[2]}, files[5]);
  send('ready', {loadingMs: performance.now() - started, cachedBytes, networkBytes, parameters: 2808792});
}

async function generate({id, text, controls, pronunciation = {}}) {
  if (active) {send('error', {id, message: 'Please wait for the current generation to stop.'}); return;}
  const job = active = {id, cancelled: false};
  const start = performance.now(); let firstChunkMs, samples = 0, peak = 0, cacheHits = 0;
  const durations = [], stageTimings = [];
  try {
    if (!engine) throw new Error('The voice is still loading.');
    if (typeof text !== 'string') throw new Error('Enter the text you want to read.');
    controls = validateControls(controls);
    const frontend = pronounceEnglish(text, lexicon, vocabulary, pronunciation);
    send('frontend', {id, frontend});
    for (let i = 0; i < frontend.chunks.length; i++) {
      await waitForMessages(); if (job.cancelled) break;
      const chunk = frontend.chunks[i], key = audioKey(chunk, controls);
      let result = audioCache.get(key); const cached = !!result;
      if (cached) cacheHits++;
      else result = await engine.run({...chunk, controls});
      await waitForMessages(); if (job.cancelled) break;
      samples += result.wave.length;
      for (const value of result.wave) peak = Math.max(peak, Math.abs(value));
      if (peak >= 1) throw new Error('This setting made the voice too loud. Reduce energy or choose Natural.');
      if (!cached) audioCache.set(key, result);
      durations.push(result.durations); stageTimings.push(cached ? {cached: true} : result.timings);
      firstChunkMs ??= performance.now() - start;
      const wave = result.wave.slice(); // Transfer this copy; retain the bounded local cache.
      send('chunk', {id, wave, index: i, total: frontend.chunks.length, cached}, [wave.buffer]);
    }
    if (job.cancelled) send('cancelled', {id});
    else send('complete', {id, milliseconds: performance.now() - start, firstChunkMs, samples, peak,
      cacheHits, chunks: frontend.chunks.length, durations, controls, stageTimings});
  } catch (error) {send('error', {id, message: error.message});}
  finally {active = null;}
}
self.onmessage = ({data}) => {
  if (data.type === 'generate') void generate(data);
  else if (data.type === 'cancel' && active?.id === data.id) active.cancelled = true;
};
initialize().catch(error => send('load-error', {message: error.message}));
