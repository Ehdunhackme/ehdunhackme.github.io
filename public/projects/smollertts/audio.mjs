export const SAMPLE_RATE = 22050;
export function wavBlob(wave) {
  const bytes = new ArrayBuffer(44 + wave.length * 2), view = new DataView(bytes);
  const text = (offset, value) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); };
  text(0, 'RIFF'); view.setUint32(4, 36 + wave.length * 2, true); text(8, 'WAVE'); text(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true); view.setUint32(28, SAMPLE_RATE * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, wave.length * 2, true);
  for (let i = 0; i < wave.length; i++) {
    const sample = Math.max(-1, Math.min(1, wave[i])); view.setInt16(44 + i * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
  }
  return new Blob([bytes], {type: 'audio/wav'});
}

// Bound retained audio by bytes AND entries. The cache belongs only to this tab.
export class AudioCache {
  constructor(maxBytes = 4 * 1024 * 1024, maxEntries = 16) {
    this.items = new Map(); this.bytes = 0; this.maxBytes = maxBytes; this.maxEntries = maxEntries;
  }
  get(key) {
    const item = this.items.get(key);
    if (item) {this.items.delete(key); this.items.set(key, item);}
    return item;
  }
  set(key, value) {
    if (this.items.has(key)) {this.bytes -= this.items.get(key).wave.byteLength; this.items.delete(key);}
    if (value.wave.byteLength > this.maxBytes) return;
    while (this.items.size && (this.bytes + value.wave.byteLength > this.maxBytes || this.items.size >= this.maxEntries)) {
      const first = this.items.keys().next().value; this.bytes -= this.items.get(first).wave.byteLength; this.items.delete(first);
    }
    this.items.set(key, value); this.bytes += value.wave.byteLength;
  }
}
export function audioKey(chunk, controls) {
  return JSON.stringify([chunk.tokens, chunk.stress, controls.speed, controls.pitch, controls.energy, chunk.punctuation || [], chunk.durations || null]);
}
