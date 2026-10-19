// Time in a reel. Every scene runs on its own clock (seconds from the scene's first frame): its voice-over
// starts after a short lead, its pictures arrive when the voice names them, and it ends a beat after the voice.
// Word times come from, in order of preference: a transcription of the clip (aligned words), the pauses
// measured in the clip (speechMap), or an estimate from the script alone. The page only reads the result.

export const LEAD = 0.25;         // voice starts this long after the scene appears
export const HOOK_LEAD = 0.06;    // the first scene speaks at once: the first second decides the watch
export const TAIL = 0.5;          // the scene stays this long after the voice ends
export const TRANSITION = 0.42;   // the next scene takes this long to arrive
export const WPS = 2.3;           // spoken words per second when there is no audio yet (Indonesian, ~120-140 wpm)
export const MIN_SCENE = 1.6, MAX_SCENE = 12;

const STOP = new Set(['yang', 'dan', 'di', 'ke', 'dari', 'ini', 'itu', 'untuk', 'dengan', 'pada', 'atau', 'juga', 'akan', 'bisa', 'ada', 'tidak', 'tak', 'saat', 'agar', 'karena', 'jadi', 'lebih', 'sangat', 'para', 'the', 'and', 'of', 'to', 'a', 'in', 'is', 'kamu', 'anda', 'kita', 'kami', 'si', 'sang', 'nya']);
export const norm = w => String(w).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
/* Indonesian endings that do not change which word is meant: duduk, duduknya, dudukkan */
const stem = w => (w.length > 6 ? w.replace(/(nya|kan|lah|kah|an|i)$/, '') : w);
const same = (a, b) => a === b || (a.length >= 4 && b.length >= 4 && (stem(a) === stem(b) || (a.length >= 6 && b.length >= 6 && a.slice(0, 6) === b.slice(0, 6))));

/** The words of a voice-over without its delivery tags (<short pause>, <breath>): what captions show. */
export const spoken = vo => String(vo || '').replace(/<[^<>]{1,40}>/g, ' ').replace(/\s+/g, ' ').trim();

/** Spoken weight of a word: syllables (vowel groups), with numbers read out in full. */
function weight(raw) {
  const w = norm(raw);
  const digits = (raw.match(/\d/g) || []).length;
  const vowels = (w.replace(/\d/g, '').match(/[aiueoy]+/g) || []).length;
  return Math.max(1, vowels) + digits * 2.2 + (/%/.test(raw) ? 2 : 0) + (/[.,]\d/.test(raw) ? 2 : 0);
}

/** Script words with their weight and the pause after them: 0 none, 1 comma, 2 sentence end. */
export function voWords(vo) {
  return spoken(vo).split(/\s+/).filter(t => /[\p{L}\p{N}]/u.test(t)).map(t => ({
    text: t, norm: norm(t), weight: weight(t), pause: /[.!?…]["”')]*$/.test(t) ? 2 : /[,;:—–-]["”')]*$/.test(t) ? 1 : 0,
  }));
}
const PAUSE_W = [0, 1.6, 2.8];

/** Seconds a script takes to say when there is no audio, as a speech map. */
export function estimateMap(vo) {
  const ws = voWords(vo);
  const units = ws.reduce((n, w) => n + w.weight + PAUSE_W[w.pause], 0);
  const syll = ws.reduce((n, w) => n + w.weight, 0);
  /* about 2.3 words a second for calm Indonesian narration, measured through syllables */
  const sec = ws.length ? Math.max(0.6, (ws.length / WPS) * (units / Math.max(1, syll)) * 0.92) : 0;
  return { start: 0, end: sec, pauses: [], estimated: true };
}

/* Spread words over [a, b] by weight; pauses inside the span count as extra weight */
function spread(ws, a, b, out) {
  const tot = ws.reduce((n, w, k) => n + w.weight + (k < ws.length - 1 ? PAUSE_W[w.pause] : 0), 0) || 1;
  let t = a;
  ws.forEach((w, k) => {
    const len = ((b - a) * w.weight) / tot;
    out.push({ w: w.text, s: t, e: t + len });
    t += len + (k < ws.length - 1 ? ((b - a) * PAUSE_W[w.pause]) / tot : 0);
  });
}

/**
 * Times of every script word within a clip: [{ w, s, e }] in clip seconds. Phrase ends in the script are
 * matched, in order, to the pauses heard in the clip (a monotone best match, so a breath inside a phrase does
 * not shift the words after it); words inside a phrase share its time by syllables.
 */
export function wordTimes(vo, map, aligned = null) {
  const ws = voWords(vo);
  if (!ws.length) return [];
  if (aligned && aligned.length) return alignTo(ws, aligned, map);
  const phrases = [[]];
  ws.forEach((w, k) => { phrases[phrases.length - 1].push(w); if (w.pause && k < ws.length - 1) phrases.push([]); });
  const start = map.start || 0, end = Math.max(start + 0.2, map.end || 0);
  if (phrases.length === 1 || !map.pauses || !map.pauses.length) { const out = []; spread(ws, start, end, out); return out; }
  /* Expected phrase ends from syllables alone */
  const totW = ws.reduce((n, w, k) => n + w.weight + (k < ws.length - 1 ? PAUSE_W[w.pause] : 0), 0);
  const exp = [];
  let acc = 0;
  phrases.forEach((ph, i) => { acc += ph.reduce((n, w) => n + w.weight, 0); if (i < phrases.length - 1) { exp.push(start + ((acc + PAUSE_W[ph[ph.length - 1].pause] / 2) / totW) * (end - start)); acc += PAUSE_W[ph[ph.length - 1].pause]; } });
  const P = map.pauses, B = exp.length, SKIP = 0.4;
  /* D[b][p]: best cost matching the first b boundaries to the first p pauses */
  const D = Array.from({ length: B + 1 }, () => new Float64Array(P.length + 1).fill(Infinity));
  const W = Array.from({ length: B + 1 }, () => new Int8Array(P.length + 1));
  for (let p = 0; p <= P.length; p++) D[0][p] = 0;
  for (let b = 1; b <= B; b++) {
    for (let p = 0; p <= P.length; p++) {
      let best = D[b - 1][p] + SKIP, how = 1;
      if (p > 0 && D[b][p - 1] < best) { best = D[b][p - 1]; how = 2; }
      if (p > 0) {
        const mid = (P[p - 1].from + P[p - 1].to) / 2, c = Math.abs(exp[b - 1] - mid);
        if (c < 1.2 && D[b - 1][p - 1] + c < best) { best = D[b - 1][p - 1] + c; how = 3; }
      }
      D[b][p] = best; W[b][p] = how;
    }
  }
  const cut = new Array(B).fill(null);
  for (let b = B, p = P.length; b > 0;) {
    const how = W[b][p];
    if (how === 3) { cut[b - 1] = P[p - 1]; b--; p--; } else if (how === 2) p--; else b--;
  }
  /* Spans between matched pauses; an unmatched phrase end stays inside its span */
  const out = [];
  let from = start, group = [];
  phrases.forEach((ph, i) => {
    group.push(...ph);
    const c = i < B ? cut[i] : null;
    if (c || i === phrases.length - 1) { spread(group, from, c ? c.from : end, out); from = c ? c.to : end; group = []; }
  });
  return out;
}

/* Script words onto transcribed words ({ word, start, end }) by edit distance; unmatched words fill the gaps */
function alignTo(ws, rec, map) {
  const A = ws.map(w => w.norm), Bn = rec.map(r => norm(r.word || r.text || ''));
  const n = A.length, m = Bn.length;
  const D = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (same(A[i - 1], Bn[j - 1]) ? 0 : 1));
  const hit = new Array(n).fill(null);
  for (let i = n, j = m; i > 0 && j > 0;) {
    if (D[i][j] === D[i - 1][j - 1] + (same(A[i - 1], Bn[j - 1]) ? 0 : 1)) { if (same(A[i - 1], Bn[j - 1])) hit[i - 1] = rec[j - 1]; i--; j--; }
    else if (D[i][j] === D[i - 1][j] + 1) i--; else j--;
  }
  const out = ws.map((w, k) => (hit[k] ? { w: w.text, s: hit[k].start, e: hit[k].end } : null));
  /* Fill runs of unmatched words between their matched neighbours */
  for (let k = 0; k < n; k++) {
    if (out[k]) continue;
    let j = k;
    while (j < n && !out[j]) j++;
    const a = k > 0 ? out[k - 1].e : (map && map.start) || 0, b = j < n ? out[j].s : Math.max(a + 0.3, (map && map.end) || a + 0.3 * (j - k));
    const tmp = [];
    spread(ws.slice(k, j), a, Math.max(a + 0.05 * (j - k), b), tmp);
    tmp.forEach((x, q) => { out[k + q] = x; });
    k = j - 1;
  }
  return out;
}

/**
 * A scene's clock for the renderers. `words` are scene-local ({ w, s, e } with the lead added). cue(text) finds
 * when the voice reaches the first meaningful word of `text` (after the previous cue), so a list item appears
 * as it is said; without a match it takes the k-th of n even slots. sync(text, at) gives each word of an
 * on-screen sentence the moment it is spoken, or a quick stagger from `at`.
 */
export function makeClock(words, { t0 = 0.12, speechEnd = 1.5, dur = 3 } = {}) {
  let pos = 0, last = t0 - 0.35;
  const W = words.map(x => norm(x.w));
  const keys = text => voWords(text).map(w => w.norm).filter(w => w.length >= 3 && !STOP.has(w));
  function find(text) {
    for (const key of keys(text)) {
      for (let j = pos; j < W.length; j++) if (same(key, W[j])) return j;
    }
    return -1;
  }
  return {
    t0, dur, speechEnd,
    cue(text, k = 0, n = 1, min = 0.35) {
      const j = text ? find(text) : -1;
      let t;
      if (j >= 0) { pos = j + 1; t = Math.max(t0, words[j].s - 0.12); }
      else t = t0 + ((k + (n > 1 ? 0.15 : 0)) / Math.max(1, n)) * Math.max(0.6, speechEnd - t0) * 0.85;
      t = Math.max(t, last + min);
      last = t;
      return Math.min(t, Math.max(t0, dur - 0.7));
    },
    sync(text, at = t0, step = 0.08) {
      const ws = voWords(text);
      const times = new Array(ws.length).fill(null);
      let j = pos;
      ws.forEach((w, k) => {
        for (let q = j; q < Math.min(W.length, j + 6); q++) if (same(w.norm, W[q])) { times[k] = Math.max(t0, words[q].s - 0.04); j = q + 1; break; }
      });
      const hits = times.filter(x => x !== null).length;
      if (hits < Math.ceil(ws.length * 0.5)) return ws.map((w, k) => at + k * step);
      pos = j;
      /* Unmatched words take their neighbour's time plus a small step */
      for (let k = 0; k < times.length; k++) if (times[k] === null) times[k] = (k > 0 ? times[k - 1] : at) + step;
      for (let k = 1; k < times.length; k++) times[k] = Math.max(times[k], times[k - 1] + 0.03);
      last = Math.max(last, times[times.length - 1]);
      return times;
    },
    /** The next slot after the last cue, for things the voice does not name. */
    after(gap = 0.35) { last = Math.min(Math.max(t0, dur - 0.7), last + gap); return last; },
  };
}

/** Burned-in caption lines: a few words each, broken at punctuation and at long breaths. */
export function captionChunks(words, { maxChars = 24, maxWords = 5 } = {}) {
  const out = [];
  let cur = [];
  const flush = () => { if (cur.length) out.push({ s: cur[0].s, e: cur[cur.length - 1].e, words: cur }); cur = []; };
  words.forEach((w, k) => {
    const next = words[k + 1];
    const len = cur.reduce((n, x) => n + x.w.length + 1, 0) + w.w.length;
    if (cur.length && (len > maxChars || cur.length >= maxWords)) flush();
    cur.push(w);
    if (/[.!?,;:…]["”')]*$/.test(w.w) || (next && next.s - w.e > 0.35)) flush();
  });
  flush();
  /* Each line stays until the next one starts, so the band never flickers empty mid-sentence */
  out.forEach((c, k) => { const n = out[k + 1]; c.e = n && n.s - c.e < 0.6 ? n.s : c.e + 0.25; });
  return out;
}

/** "00:00:01,250" for SRT files. */
export const srtTime = s => {
  const ms = Math.max(0, Math.round(s * 1000));
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
