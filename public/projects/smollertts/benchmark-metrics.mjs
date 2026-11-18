// The published overview has four prompt scores per configuration. Missing is
// distinct from zero; WER can exceed 100% because insertions count as errors.
export const METRICS = {
  utmos: {label: 'UTMOS', direction: '↑', higher: true, note: 'Predicted naturalness. Higher is better; this is not a human listening score.'},
  wer: {label: 'WER', direction: '↓', higher: false, note: 'Word error rate from Whisper large-v3. Lower is better.'}
};
export const hasMetric = (row, key) => typeof row[key] === 'number' && Number.isFinite(row[key]);
export const formatMetric = (value, key) => key === 'wer' ? `${(value * 100).toFixed(2)}%` : value.toFixed(2);
export function promptValues(row, key) {
  return (row.per_prompt || []).map(p => p[key]).filter(v => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v))).map(Number);
}
export function bounds(rows, key, spread) {
  const values = rows.flatMap(r => spread ? [r[key], ...promptValues(r, key)] : [r[key]]).filter(Number.isFinite);
  if (key === 'utmos') return {min: Math.min(2, Math.floor(Math.min(...values))), max: Math.max(5, Math.ceil(Math.max(...values))), step: .5};
  const peak = Math.max(.01, ...values), step = peak <= .1 ? .02 : peak <= .3 ? .05 : peak <= 1 ? .1 : .25;
  return {min: 0, max: Math.ceil(peak / step) * step, step};
}
export function frontier(rows, key) {
  const higher = METRICS[key].higher;
  let best = higher ? -Infinity : Infinity;
  return [...rows].filter(r => hasMetric(r,key)).sort((a,b) => a.parameters_m - b.parameters_m || (higher ? b[key]-a[key] : a[key]-b[key])).filter(r => {
    if (higher ? r[key] <= best : r[key] >= best) return false;
    best = r[key]; return true;
  });
}
