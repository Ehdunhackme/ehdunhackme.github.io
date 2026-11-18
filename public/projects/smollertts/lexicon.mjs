// Sorted UTF-8 records remain in one ArrayBuffer. Only requested pronunciations
// become JS objects, instead of parsing half a million nested JSON arrays.
export class Lexicon {
  constructor(buffer) {
    this.view = new DataView(buffer); this.bytes = new Uint8Array(buffer);
    if (buffer.byteLength < 12 || String.fromCharCode(...this.bytes.subarray(0, 4)) !== 'XTL1') throw new Error('Invalid pronunciation table');
    this.count = this.view.getUint32(4, true);
    this.start = 8 + (this.count + 1) * 4;
    if (this.start > buffer.byteLength || this.start + this.view.getUint32(8 + this.count * 4, true) !== buffer.byteLength) throw new Error('Incomplete pronunciation table');
    this.encoder = new TextEncoder();
  }
  find(word) {
    const key = this.encoder.encode(word);
    let low = 0, high = this.count;
    while (low < high) {
      const middle = (low + high) >>> 1, position = this.start + this.view.getUint32(8 + middle * 4, true);
      const length = this.view.getUint16(position, true);
      let comparison = 0;
      for (let i = 0; i < Math.min(length, key.length); i++) {
        comparison = key[i] - this.bytes[position + 4 + i];
        if (comparison) break;
      }
      if (!comparison) comparison = key.length - length;
      if (!comparison) return position;
      if (comparison < 0) high = middle; else low = middle + 1;
    }
    return -1;
  }
  has(word) { return this.find(word) >= 0; }
  get(word) {
    const position = this.find(word);
    if (position < 0) return undefined;
    const start = position + 4 + this.view.getUint16(position, true), count = this.view.getUint16(position + 2, true);
    return Array.from({ length: count }, (_, i) => {
      const code = this.view.getUint16(start + i * 2, true);
      return [code & 511, (code >>> 9) & 7, (code >>> 12) & 3];
    });
  }
}
