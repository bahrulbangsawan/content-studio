// Voice-over audio for reels: 16-bit PCM WAV in and out, and where the speech sits in a clip (start, end and
// the pauses between phrases), so on-screen words can follow the voice without a timing service.
// No dependencies; ffmpeg is used elsewhere only to convert other formats into WAV.

/** Raw signed 16-bit little-endian PCM -> a WAV file. */
export function wavFromPcm(pcm, rate = 24000, channels = 1) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(channels, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * channels * 2, 28); h.writeUInt16LE(channels * 2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

/** A 16-bit PCM WAV -> { rate, channels, pcm (Buffer), duration }. Throws on other formats. */
export function readWav(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') throw new Error('Bukan berkas WAV.');
  let p = 12, fmt = null, data = null;
  while (p + 8 <= buf.length) {
    const id = buf.toString('ascii', p, p + 4), size = buf.readUInt32LE(p + 4);
    if (id === 'fmt ') fmt = { format: buf.readUInt16LE(p + 8), channels: buf.readUInt16LE(p + 10), rate: buf.readUInt32LE(p + 12), bits: buf.readUInt16LE(p + 22) };
    if (id === 'data') { data = buf.subarray(p + 8, Math.min(buf.length, p + 8 + size)); break; }
    p += 8 + size + (size % 2);
  }
  if (!fmt || !data) throw new Error('WAV tanpa blok fmt atau data.');
  if (fmt.format !== 1 || fmt.bits !== 16) throw new Error('WAV harus PCM 16-bit.');
  return { rate: fmt.rate, channels: fmt.channels, pcm: data, duration: data.length / (fmt.rate * fmt.channels * 2) };
}

/**
 * Where the voice is: { start, end, pauses: [{ from, to }] } in seconds. Loudness is measured in 10 ms frames
 * against the clip's own noise floor, so it works for any level. A pause is a quiet stretch of 110 ms or more
 * between two spoken parts; phrases in the script line up with these pauses (see reel-time.mjs).
 */
export function speechMap({ rate, channels, pcm }) {
  const frame = Math.max(1, Math.round(rate * 0.01)), n = Math.floor(pcm.length / 2 / channels / frame);
  const rms = new Float64Array(n);
  for (let f = 0; f < n; f++) {
    let sum = 0;
    for (let k = 0; k < frame; k++) {
      const at = ((f * frame + k) * channels) * 2;
      const v = pcm.readInt16LE(at) / 32768;
      sum += v * v;
    }
    rms[f] = Math.sqrt(sum / frame);
  }
  if (!n) return { start: 0, end: 0, pauses: [] };
  const sorted = Array.from(rms).sort((a, b) => a - b);
  const floor = sorted[Math.floor(n * 0.1)], peak = sorted[Math.floor(n * 0.98)];
  const th = Math.max(floor * 3, floor + (peak - floor) * 0.08, 0.004);
  const loud = Array.from(rms, v => v > th);
  let first = loud.indexOf(true), last = loud.lastIndexOf(true);
  if (first < 0) return { start: 0, end: n * 0.01, pauses: [] };
  const pauses = [];
  for (let f = first, quiet = -1; f <= last; f++) {
    if (!loud[f] && quiet < 0) quiet = f;
    if (loud[f] && quiet >= 0) {
      if (f - quiet >= 11) pauses.push({ from: quiet * 0.01, to: f * 0.01 });
      quiet = -1;
    }
  }
  return { start: Math.max(0, first * 0.01 - 0.02), end: Math.min(n * 0.01, (last + 1) * 0.01 + 0.03), pauses };
}

/** Seconds of a WAV buffer. */
export const wavDuration = buf => readWav(buf).duration;
