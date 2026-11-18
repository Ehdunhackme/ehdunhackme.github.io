// Small, bounded inference controls in the model's existing conditioning space.
// No waveform resampling or extra model. A period keeps the accepted delivery.
const hopSeconds = 256 / 22050;
const pauseSeconds = {',': .14, ':': .20, ';': .22, '?': .24, '!': .24};
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export function applyPunctuation(tokens, stress, durations, prosody, cues = [], controls = {pitch: 0, energy: 0}) {
  if (!cues.length || cues.every(cue => cue.mark === '.')) return {durations, prosody};
  const outputDurations = [...durations], outputProsody = new Float32Array(prosody);
  for (const cue of cues) {
    const {index, mark} = cue;
    if (!Number.isInteger(index) || index <= 0 || index >= tokens.length || tokens[index] !== 1 || !/^[,.;:!?]$/.test(mark))
      throw new Error('Invalid punctuation boundary.');
    if (pauseSeconds[mark]) outputDurations[index] = Math.max(outputDurations[index], Math.round(pauseSeconds[mark] / hopSeconds));
    if (!/[!?]/.test(mark)) continue;
    let start = index - 1;
    while (start > 0 && tokens[start - 1] !== 1 && index - start < 8) start--;
    // Keep final lengthening local, instead of slowing the whole sentence.
    let nucleus = index - 1;
    while (nucleus > start && !stress[nucleus]) nucleus--;
    for (let i = start; i < index; i++) {
      const t = (i - start + 1) / (index - start);
      const pitch = mark === '?' ? (cue.question === 'wh' ? -.6 * t : 1.8 * t * t) : .9 * Math.sin(Math.PI * t);
      const energy = mark === '!' ? .6 * Math.sin(Math.PI * t) : 0;
      const pitchShift = clamp(controls.pitch + pitch, -2, 2) - controls.pitch;
      const energyShift = clamp(controls.energy + energy, -1.5, 1.5) - controls.energy;
      outputProsody[i * 3] += pitchShift * Math.log(2) / (12 * .5);
      outputProsody[i * 3 + 2] += energyShift * Math.log(10) / (20 * 2);
      if (i >= nucleus) outputDurations[i] = Math.min(100, Math.max(1, Math.round(outputDurations[i] * 1.08)));
    }
  }
  return {durations: outputDurations, prosody: outputProsody};
}
