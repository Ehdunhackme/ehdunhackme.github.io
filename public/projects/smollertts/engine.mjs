// Keep unfused FP32 arithmetic to preserve the released waveform output.
import * as ort from './ort/ort.wasm.min.mjs?h=41a51497074d';
import {validateControls, adjustDurations, adjustProsody} from './controls.mjs?h=41a51497074d';
import {applyPunctuation} from './punctuation.mjs?h=41a51497074d';

export async function loadEngine(models, wasmBinary) {
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.wasmPaths = new URL('./ort/', import.meta.url).href;
  if (wasmBinary) ort.env.wasm.wasmBinary = wasmBinary;
  const sessions = {};
  try {
    // Downloads are parallel, session construction is serial: one shared WASM runtime.
    for (const name of ['encoder', 'frames', 'vocoder']) {
      sessions[name] = await ort.InferenceSession.create(models[name],
        {executionProviders: ['wasm'], graphOptimizationLevel: 'disabled'});
    }
  } catch (error) {
    for (const session of Object.values(sessions)) await session.release();
    throw error;
  }
  const integer = (data, dims) => new ort.Tensor('int64', BigInt64Array.from(data, BigInt), dims);
  return {
    async run({tokens, stress, durations, punctuation = [], controls = {}}) {
      controls = validateControls(controls);
      const owned = [], keep = tensor => (owned.push(tensor), tensor);
      const start = performance.now(), timings = {};
      try {
        const encoded = await sessions.encoder.run({tokens: keep(integer(tokens, [1, tokens.length])), stress: keep(integer(stress, [1, tokens.length]))});
        timings.encoder = performance.now() - start;
        Object.values(encoded).forEach(keep);
        durations ??= Array.from(encoded.duration.data, (d, i) => {
          const n = Math.round(Math.expm1(Math.max(0, Math.min(Math.log(101), d))));
          return tokens[i] === 1 ? Math.max(0, Math.min(60, n)) : Math.max(1, Math.min(100, n));
        });
        const shaped = applyPunctuation(tokens, stress, durations, adjustProsody(encoded.phone_prosody.data, controls), punctuation, controls);
        durations = adjustDurations(shaped.durations, tokens, controls.speed);
        const indices = [], position = [];
        for (let i = 0; i < durations.length; i++) for (let j = 0; j < durations[i]; j++) {
          indices.push(i); position.push((j + .5) / durations[i]);
        }
        if (indices.length < 2 || indices.length > 6000) throw new Error('Please use a shorter sentence.');
        const changed = shaped.prosody;
        const phoneProsody = changed === encoded.phone_prosody.data ? encoded.phone_prosody :
          keep(new ort.Tensor('float32', changed, encoded.phone_prosody.dims));
        const frameStart = performance.now();
        const result = await sessions.frames.run({encoded: encoded.encoded, phone_prosody: phoneProsody,
          indices: keep(integer(indices, [1, indices.length])), position: keep(new ort.Tensor('float32', Float32Array.from(position), [1, indices.length]))});
        Object.values(result).forEach(keep); timings.frames = performance.now() - frameStart;
        const vocoderStart = performance.now();
        const audio = await sessions.vocoder.run({mel: result.mel}); Object.values(audio).forEach(keep);
        timings.vocoder = performance.now() - vocoderStart;
        // Copy once out of WASM; avoid expanding PCM into boxed JavaScript numbers.
        const wave = new Float32Array(audio.waveform.data);
        if (wave.some(value => !Number.isFinite(value))) throw new Error('Speech generation produced invalid audio.');
        return {wave, milliseconds: performance.now() - start, timings, durations, controls};
      } finally { for (const tensor of owned) tensor.dispose(); }
    },
    async close() {for (const session of Object.values(sessions)) await session.release();}
  };
}
