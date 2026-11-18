// Inference-only steering in the trained conditioning space. No new weights.
export const CONTROL_LIMITS = Object.freeze({speed: [.85, 1.15], pitch: [-2, 2], energy: [-1.5, 1.5]});
export const PRESETS = Object.freeze({
  natural: Object.freeze({speed: 1, pitch: 0, energy: 0}),
  relaxed: Object.freeze({speed: .92, pitch: -.75, energy: -.75}),
  bright: Object.freeze({speed: 1.06, pitch: 1, energy: .5}),
  lower: Object.freeze({speed: .98, pitch: -1.5, energy: 0}),
});

export function validateControls(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid voice controls.');
  for (const name of Object.keys(value)) if (!(name in CONTROL_LIMITS)) throw new Error(`Unknown voice control: ${name}`);
  const controls = {...PRESETS.natural, ...value};
  for (const [name, [min, max]] of Object.entries(CONTROL_LIMITS)) {
    if (typeof controls[name] !== 'number' || !Number.isFinite(controls[name]) || controls[name] < min || controls[name] > max)
      throw new Error(`${name} must be between ${min} and ${max}.`);
  }
  return controls;
}

export function adjustDurations(durations, tokens, speed = 1) {
  validateControls({speed});
  if (durations.length !== tokens.length || durations.some(n => !Number.isSafeInteger(n) || n < 0))
    throw new Error('Invalid phone durations.');
  // The natural route must retain the accepted integer durations exactly.
  if (speed === 1) return durations;
  return durations.map((n, i) => Math.max(tokens[i] === 1 ? 0 : 1, Math.round(n / speed)));
}

export function adjustProsody(data, controls = {}) {
  const {pitch, energy} = validateControls(controls);
  if (!(data instanceof Float32Array) || data.length % 3 !== 0) throw new Error('Invalid prosody tensor.');
  if (pitch === 0 && energy === 0) return data;
  const result = new Float32Array(data);
  // Training target normalization:
  // F0 = (ln(Hz) - ln(180)) / .5; energy = (ln(RMS) + 3) / 2.
  const pitchOffset = pitch * Math.log(2) / (12 * .5);
  const energyOffset = energy * Math.log(10) / (20 * 2);
  for (let i = 0; i < result.length; i += 3) {
    result[i] += pitchOffset;
    result[i + 2] += energyOffset;
  }
  return result;
}
