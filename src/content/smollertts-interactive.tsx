"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./smollertts.module.css";
import { BenchmarkChart } from "./smollertts-chart";
import { ArrowIcon } from "./smollertts-icons";

export type SpeechSample = {
  id: string;
  label: string;
  text: string;
  src: string;
  duration: number;
  peaks: number[];
  pcm: Float32Array;
};

function timestamp(seconds: number) {
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}

function Sample({ sample }: { sample: SpeechSample }) {
  const context = useRef<AudioContext | null>(null), source = useRef<AudioBufferSourceNode | null>(null);
  const offset = useRef(0), started = useRef(0), frame = useRef(0), starting = useRef(false), disposed = useRef(false);
  const [playing, setPlaying] = useState(false), [time, setTime] = useState(0), [failed, setFailed] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const clipId = useId().replace(/:/g, "");
  const progress = Math.min(1, time / sample.duration);
  const bars = sample.peaks.map((peak, index) => {
    const height = 3 + peak * 33;
    return <rect key={index} x={index * 4 + 1} y={(40 - height) / 2} width="2" height={height} rx="1" />;
  });
  useEffect(() => {
    disposed.current = false;
    setPlaying(false);
    setCanPlay(typeof AudioContext !== 'undefined');
    return () => {
      disposed.current = true;
      cancelAnimationFrame(frame.current);
      if (source.current) { source.current.onended = null; source.current.stop(); source.current.disconnect(); source.current = null; }
      void context.current?.close(); context.current = null;
    };
  }, []);

  function pause(nextTime?: number) {
    const position = source.current && context.current ? offset.current + context.current.currentTime - started.current : offset.current;
    if (source.current) {source.current.onended = null; source.current.stop(); source.current.disconnect(); source.current = null;}
    cancelAnimationFrame(frame.current);
    offset.current = Math.min(sample.duration, Math.max(0, nextTime ?? position));
    setTime(offset.current); setPlaying(false);
  }
  async function play() {
    if (starting.current) return;
    starting.current = true;
    try {
      const player = context.current ??= new AudioContext({sampleRate: 22050});
      await player.resume();
      if (disposed.current) return;
      if (offset.current >= sample.duration) offset.current = 0;
      const buffer = player.createBuffer(1, sample.pcm.length, 22050);
      buffer.copyToChannel(new Float32Array(sample.pcm), 0);
      const node = player.createBufferSource(); node.buffer = buffer; node.connect(player.destination);
      source.current = node; started.current = player.currentTime;
      node.onended = () => {
        if (source.current !== node) return;
        node.disconnect(); source.current = null;
        cancelAnimationFrame(frame.current); offset.current = sample.duration;
        setTime(sample.duration); setPlaying(false);
      };
      node.start(0, offset.current); setPlaying(true); setFailed(false);
      const tick = () => {
        if (!source.current) return;
        setTime(Math.min(sample.duration, offset.current + player.currentTime - started.current));
        frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    } catch {setFailed(true); setPlaying(false);}
    finally {starting.current = false;}
  }
  return (
    <div className={styles.sample} data-sample={sample.id}>
      <div className={styles.player}>
        <button type="button" className={styles.play} disabled={!canPlay} onClick={() => source.current ? pause() : void play()} aria-label={`${playing ? "Pause" : "Play"} Generated speech`}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            {playing ? <path d="M4 3h3v10H4zm5 0h3v10H9z" /> : <path d="m5 2 9 6-9 6z" />}
          </svg>
        </button>
        <div className={styles.waveTrack}>
          <svg className={styles.wave} viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
            <defs><clipPath id={clipId}><rect width={progress * 400} height="40" /></clipPath></defs>
            <g className={styles.unplayed}>{bars}</g>
            <g className={styles.played} clipPath={`url(#${clipId})`}>{bars}</g>
          </svg>
          <input type="range" className={styles.seek} disabled={!canPlay} aria-label="Seek Generated speech" aria-valuetext={`${time.toFixed(1)} of ${sample.duration.toFixed(1)} seconds`} min="0" max={sample.duration} step="0.01" value={time} onChange={(event) => {
            const resume = !!source.current;
            pause(Number(event.currentTarget.value));
            if (resume) void play();
          }} />
        </div>
        <span className={styles.time}>{timestamp(time)} / {timestamp(sample.duration)}</span>
      </div>
      {!canPlay ? <p role="status" className={styles.note}>Audio playback is unavailable in this browser. <a href={sample.src} download="smollertts.wav">Download the audio</a> to listen.</p> : failed && <p role="status" className={styles.note}>Playback could not start. Try pressing play again, or <a href={sample.src} download="smollertts.wav">download the audio</a>.</p>}
    </div>
  );
}

export type BenchmarkModel = {
  id: string;
  name: string;
  parameters_m: number;
  utmos: number | null;
  wer: number | null;
  local: boolean;
  source: string;
  runtime: string;
  approximate?: boolean;
  n?: number;
  per_prompt?: {utmos?: string | number | null; wer?: string | number | null}[];
};

export function BenchmarkFigure({ models }: { models: BenchmarkModel[] }) {
  const [metric, setMetric] = useState<"utmos" | "wer">("utmos");
  const [smallOnly, setSmallOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: "name" | "parameters_m" | "utmos" | "wer"; ascending: boolean }>({ key: "parameters_m", ascending: true });
  const [spread, setSpread] = useState(false);

  const rows = models.filter((model) => model[metric] !== null && model.parameters_m > 0 && (!smallOnly || model.parameters_m < 10));
  const tableRows = rows.filter((row) => `${row.name} ${row.runtime}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => {
    const av = a[sort.key], bv = b[sort.key];
    const comparison = typeof av === "string" && typeof bv === "string" ? av.localeCompare(bv) : Number(av ?? Infinity) - Number(bv ?? Infinity);
    return (sort.ascending ? comparison : -comparison) || a.name.localeCompare(b.name);
  });
  function sortBy(key: typeof sort.key) {
    setSort({key, ascending: sort.key === key ? !sort.ascending : key !== "utmos"});
  }

  return (
    <figure className={styles.benchmark}>
      <div className={styles.chartHeading}>
        <div role="group" aria-label="Benchmark metric" className={styles.metricSwitch}>
          <button type="button" aria-label="Quality UTMOS ↑" aria-pressed={metric === "utmos"} onClick={() => setMetric("utmos")}>Quality <span>UTMOS <ArrowIcon direction="up" /></span></button>
          <button type="button" aria-label="Word errors WER ↓" aria-pressed={metric === "wer"} onClick={() => setMetric("wer")}>Word errors <span>WER <ArrowIcon direction="down" /></span></button>
        </div>
        <div className={styles.metricSwitch} role="group" aria-label="Model size filter">
          <button type="button" aria-pressed={!smallOnly} onClick={() => setSmallOnly(false)}>All models</button>
          <button type="button" aria-pressed={smallOnly} onClick={() => setSmallOnly(true)}>Under 10M</button>
        </div>
      </div>
      <div className={styles.chartOptions}>
        <div className={styles.legend} aria-label="Model size groups">
          {[['var(--chart-own)', 'SmollerTTS'], ['var(--chart-small)', 'Under 10M'], ...(!smallOnly ? [['var(--chart-medium)', '10–100M'], ['var(--chart-large)', '100M+']] : [])].map(([fill, label]) => <span key={label}><i style={{ background: fill }} />{label}</span>)}
        </div>
        <label className={styles.spreadToggle}><input type="checkbox" checked={spread} onChange={event=>setSpread(event.target.checked)} />Show prompt range</label>
      </div>
      <BenchmarkChart models={models} metric={metric} smallOnly={smallOnly} spread={spread} />
      <div className={styles.tableTools}>
        <label><span className={styles.srOnly}>Search benchmark models</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search models" /></label>
        <span>{tableRows.length} results <a href="https://github.com/Ehdunhackme/SmollerTTS/blob/6db1e7bf3a997a050c106c83e3375484bbd1f9b9/benchmarks/overview.json" target="_blank" rel="noopener noreferrer">Sources <ArrowIcon /></a></span>
      </div>
      <div className={`${styles.tableScroll} ${styles.benchmarkTable}`} tabIndex={0} role="region" aria-label="Full benchmark results">
        <table><colgroup>{[29,14,12,12,22,11].map((width,i)=><col key={i} style={{width:`${width}%`}} />)}</colgroup><thead><tr>
          {([['name', 'Model'], ['parameters_m', 'Params'], ['utmos', 'UTMOS'], ['wer', 'WER']] as const).map(([key, label]) => <th key={key} scope="col" aria-sort={sort.key === key ? sort.ascending ? "ascending" : "descending" : "none"}><button type="button" onClick={() => sortBy(key)}>{label} <ArrowIcon direction={sort.key === key ? sort.ascending ? "up" : "down" : "sort"} /></button></th>)}
          <th scope="col">Runtime</th><th scope="col">Source</th>
        </tr></thead><tbody>
          {tableRows.map(row => <tr key={row.id} data-local={row.local || undefined}><th scope="row">{row.name}</th><td>{row.parameters_m >= 1000 ? `${(row.parameters_m / 1000).toFixed(2)}B` : row.parameters_m < 1 ? `${(row.parameters_m * 1000).toFixed(1)}K` : `${row.parameters_m.toFixed(2)}M`}</td><td>{row.utmos?.toFixed(2) ?? 'Not scored'}</td><td>{row.wer == null ? 'Not scored' : `${(row.wer * 100).toFixed(2)}%`}</td><td>{row.runtime}</td><td><a className={styles.tableSource} href={row.source} target="_blank" rel="noopener noreferrer" aria-label={`${row.name} source`} title={row.source.includes('huggingface.co') ? 'Hugging Face' : row.source.includes('github.com') ? 'GitHub' : 'Source'}>{/huggingface.co|github.com/.test(row.source) && <img src={`/projects/smollertts/icons/${row.source.includes('huggingface.co') ? 'huggingface' : 'github'}.svg`} width="17" height="17" alt="" />}<ArrowIcon /></a></td></tr>)}
          {tableRows.length === 0 && <tr><td colSpan={6}>No models match “{search}”.</td></tr>}
        </tbody></table>
      </div>
    </figure>
  );
}

function encodeWav(wave: Float32Array) {
  const bytes = new ArrayBuffer(44 + wave.length * 2), view = new DataView(bytes);
  const text = (offset: number, value: string) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, 36 + wave.length * 2, true); text(8, 'WAVE'); text(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 22050, true); view.setUint32(28, 44100, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, wave.length * 2, true);
  wave.forEach((value, i) => { const sample = Math.max(-1, Math.min(1, value)); view.setInt16(44 + i * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true); });
  return new Blob([bytes], {type: 'audio/wav'});
}

function waveformPeaks(wave: Float32Array) {
  const peaks = Array.from({length: 100}, (_, i) => {
    const start = Math.floor(i * wave.length / 100), end = Math.floor((i + 1) * wave.length / 100);
    let energy = 0;
    for (let j = start; j < end; j++) energy += wave[j] * wave[j];
    return Math.sqrt(energy / Math.max(1, end - start));
  });
  const max = Math.max(...peaks, 0.001);
  return peaks.map(value => Math.pow(value / max, .65));
}

const demoExamples = [
  "Hi, I'm a small text to speech model running in your browser. Try a sentence of your own.",
  "The meeting moved to 3:30 pm on March 14th, so we have about 45 minutes left. It costs $12.99.",
  "I'll start a new git branch, push the changes, and open a pull request when the tests pass.",
];

export function LiveDemo() {
  const [text, setText] = useState(demoExamples[0]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'running' | 'failed'>('loading');
  const [message, setMessage] = useState('Loading the voice, about 30 MB…');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpeechSample | null>(null);
  const [attempt, setAttempt] = useState(0);
  const worker = useRef<Worker | null>(null), jobId = useRef(0), chunks = useRef<Float32Array[]>([]), spokenText = useRef('');
  const outputUrl = useRef('');
  useEffect(() => {
    setStatus('loading'); setMessage('Loading the voice, about 30 MB…'); setError(null);
    const instance = new Worker('/projects/smollertts/worker.mjs', {type: 'module'});
    worker.current = instance;
    const fail = (message: string, fatal = false) => {setStatus(fatal ? 'failed' : 'ready'); setMessage(message); setError(message); chunks.current = [];};
    instance.onmessage = ({data}) => {
      if (data.type === 'ready') {setStatus('ready'); setMessage('Voice loaded'); return;}
      if (data.type === 'load-error') {fail(data.message, true); return;}
      if (data.id !== jobId.current) return;
      if (data.type === 'chunk') {chunks.current.push(data.wave); setMessage(`Generating speech, ${data.index + 1} of ${data.total} chunks…`);}
      if (data.type === 'error') fail(data.message);
      if (data.type === 'cancelled') {chunks.current = []; setStatus('ready'); setMessage('Stopped. Ready for another sentence.');}
      if (data.type === 'complete') {
        const length = chunks.current.reduce((n, chunk) => n + chunk.length, 0);
        if (!length) {fail('No speech was produced. Try another sentence.'); return;}
        const wave = new Float32Array(length); let offset = 0;
        for (const chunk of chunks.current) {wave.set(chunk, offset); offset += chunk.length;}
        chunks.current = [];
        const url = URL.createObjectURL(encodeWav(wave));
        if (outputUrl.current) URL.revokeObjectURL(outputUrl.current);
        outputUrl.current = url;
        setResult({id: `generated-${data.id}`, label: 'Generated speech', text: spokenText.current, src: url, duration: wave.length / 22050, peaks: waveformPeaks(wave), pcm: wave});
        setStatus('ready');
        setMessage(`${(wave.length / 22050).toFixed(1)}s of audio · ${(data.milliseconds / 1000).toFixed(2)}s to generate${data.cacheHits ? ' · Includes cached audio' : ''}`);
      }
    };
    instance.onerror = () => fail('The voice could not load. Try loading it again.', true);
    return () => {instance.terminate(); worker.current = null; chunks.current = [];};
  }, [attempt]);
  useEffect(() => () => { if (outputUrl.current) URL.revokeObjectURL(outputUrl.current); }, []);

  function generate() {
    if (status !== 'ready' || !text.trim()) return;
    jobId.current += 1; chunks.current = []; spokenText.current = text.trim();
    setResult(null); setStatus('running'); setMessage('Generating speech…'); setError(null);
    worker.current?.postMessage({type: 'generate', id: jobId.current, text: text.trim(), controls: {speed: 1, pitch: 0, energy: 0}});
  }
  return <section className={styles.liveDemo} aria-label="Try SmollerTTS in this article">
    <label htmlFor="smoller-demo-text" className={styles.srOnly}>Give it something to say</label>
    <div className={styles.composer}>
      <textarea id="smoller-demo-text" value={text} onChange={event => setText(event.target.value)} disabled={status === 'running'} spellCheck={false} rows={4} onKeyDown={event => {if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {event.preventDefault(); generate();}}} />
      <div className={styles.composerTools}>
        <button type="button" className={styles.quietButton} disabled={status === 'running'} onClick={() => setText(demoExamples[(demoExamples.indexOf(text) + 1) % demoExamples.length])}>Try an example</button>
        {status === 'failed' ? <button type="button" className={styles.generate} onClick={() => setAttempt(attempt + 1)}>Retry loading</button> : status === 'running' ? <button type="button" className={styles.generate} onClick={() => {worker.current?.postMessage({type:'cancel', id: jobId.current}); setMessage('Stopping…');}}>Stop</button> : <button type="button" className={styles.generate} onClick={generate} disabled={status !== 'ready' || !text.trim()}>{status === 'loading' ? 'Loading voice…' : 'Generate speech'}</button>}
      </div>
    </div>
    <span role="status" className={styles.srOnly}>{error ? '' : message}</span>
    {error && <p role="alert" className={styles.demoError}>{error}</p>}
    {result && <div className={styles.demoOutput}><Sample key={result.id} sample={result} /><a href={result.src} download="smollertts.wav">Download WAV <ArrowIcon direction="download" /></a></div>}
  </section>;
}
