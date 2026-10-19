// Worst-case content for a component, so the gate sees more than the author's own sample:
//   terpanjang    every field at its longest, every list at its most items
//   tersingkat    the fewest items, short words, optional fields left out
//   kata-panjang  the longest text built from long Indonesian words, which must wrap without breaking
// Each case is shrunk until it passes the same scan as a post, so it is content a real post could carry.
import { scanPost } from './rules.mjs';
import { COMPONENTS, roleOf } from './components.mjs';
import { SAMPLES } from './samples.mjs';
import { SAMPLE_FILES } from './media.mjs';
import { ART_NAMES } from './art.mjs';

const POOL = ['anak', 'gerak', 'kaki', 'bola', 'pelan', 'tubuh', 'otot', 'napas', 'rumah', 'tangga', 'sepeda', 'lompat', 'duduk',
  'tidur', 'sehat', 'kuat', 'lari', 'jalan', 'main', 'coba', 'satu', 'hari', 'pagi', 'sore', 'lantai', 'taman', 'teman', 'ayah',
  'guru', 'bantal', 'sepatu', 'tangan', 'bahu', 'lutut', 'latihan', 'bermain', 'bersama', 'berdiri', 'berjalan', 'memanjat',
  'melompat', 'menendang', 'seimbang', 'langkah', 'koordinasi', 'kebiasaan', 'kesempatan', 'perlahan', 'pegangan', 'istirahat',
  'bergerak', 'menangkap', 'mendorong', 'punggung', 'sekolah', 'minum', 'makan', 'ringan', 'rutin', 'tenang'];
const LONG = ['keseimbangannya', 'perkembangannya', 'memperhatikan', 'koordinasinya', 'kemampuannya', 'berkonsentrasi',
  'menyeimbangkan', 'pertumbuhannya', 'kebiasaannya', 'pendampingan', 'keterampilan', 'penyesuaian', 'perlindungan', 'pengulangan',
  'kepercayaan', 'pemeriksaan', 'pertolongan', 'kesabarannya', 'menggenggam', 'menyesuaikan', 'mengendalikan', 'membiasakan',
  'mempelajari', 'peregangannya', 'pemanasannya', 'keberanian', 'kenyamanan', 'ketenangan', 'pengalaman', 'memperkuat'];
/* Figures per mode, the first one preferred; MAX is the longest the field allows */
const NUMERALS = { short: ['5', '5%', '1/2'], long: ['80%', '45%', '3/7'], max: ['MAX', '100%', '999', '10/10'] };
const ICONS = ['walk','run', 'stairs', 'ball-football', 'yoga', 'trees', 'bike', 'moon', 'heart', 'book', 'clock', 'target'];

/** Text of about `chars` characters in `words` words. `mode`: max, short or long. `seed` varies the words. */
export function fill(chars, words, mode, seed, wordCap = 99, longest = true) {
  const fits = w => w.length <= Math.min(wordCap, chars);
  if (mode === 'short') { const p = POOL.filter(fits); return cap(p.length ? p[seed % p.length] : POOL[0].slice(0, chars)); }
  /* Long words: the longest words this field allows, a dozen of them so neighbouring fields differ */
  const pool = mode === 'long' ? [...LONG, ...POOL].filter(fits).sort((a, b) => b.length - a.length).slice(0, 12) : POOL.filter(fits);
  let n = Math.max(1, Math.min(words || Math.ceil(chars / 8), Math.floor((chars + 1) / 4) || 1));
  if (mode === 'long') n = Math.max(1, Math.min(n, Math.floor((chars + 1) / 13)));
  const out = [];
  /* The longest word the field allows always appears once: it is the word most likely to break */
  if (mode === 'long' && longest && pool.length) out.push(pool[seed % Math.min(2, pool.length)]);
  for (let k = 0; out.length < n && k < pool.length * 2; k++) {
    const w = pool[(seed * 7 + k * 5) % pool.length];
    if (!out.includes(w) || k >= pool.length) out.push(w);
  }
  const len = () => out.join(' ').length;
  const pick = (cands, k) => cands.length ? cands[k % cands.length] : null;
  /* Too long: long words keep their length and the text loses words; otherwise swap in shorter words */
  for (let guard = 0; len() > chars && guard < 300; guard++) {
    const i = out.reduce((b, w, k) => (w.length > out[b].length ? k : b), 0);
    const shorter = mode === 'long' ? null : pick(POOL.filter(w => w.length < out[i].length && !out.includes(w)), seed + guard);
    if (shorter && out[i].length > 4) out[i] = shorter;
    else if (out.length > 1) out.splice(i, 1);
    else out[0] = out[0].slice(0, chars);
  }
  /* At its longest: grow short words while there is room, so the field really is full */
  for (let guard = 0; guard < 300; guard++) {
    const room = chars - len();
    if (room < 2) break;
    const i = out.reduce((b, w, k) => (w.length < out[b].length ? k : b), 0);
    if (mode === 'long' && out[i].length >= 11) break;
    const grow = [...LONG, ...POOL].filter(w => fits(w) && w.length > out[i].length && w.length - out[i].length <= room && !out.includes(w)).sort((a, b) => b.length - a.length);
    const longer = pick(grow.slice(0, 4), seed + guard);
    if (!longer) break;
    out[i] = longer;
  }
  return cap(out.join(' '));
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/** Content for one field spec. `shrink` scales text limits, `cut` removes list items above the minimum. */
function make(spec, mode, ctx) {
  const rules = ctx.rules;
  switch (spec.type) {
    case 'text': {
      /* Figures: one digit, a typical three-character value, and the longest the field allows */
      if (spec.numeral) {
        const list = NUMERALS[mode];
        const n = list[(ctx.num || 0) % list.length];
        return n === 'MAX' ? `1${'0'.repeat(Math.max(0, Math.min(spec.chars || 6, 6) - 1))}` : n;
      }
      const words = typeof spec.words === 'string' ? rules[spec.words] : spec.words;
      const chars = Math.max(1, Math.floor((spec.chars || 60) * ctx.shrink));
      const w = words ? Math.max(1, Math.floor(words * ctx.shrink)) : undefined;
      /* Every field gets its own text: repeated text in one slide is a fault the gate looks for */
      let t = '';
      for (let k = 0; k < 12 && (!t || ctx.used.has(t)); k++) t = fill(chars, mode === 'short' ? 1 : w, mode, ctx.seed++, Math.min(spec.wordChars || 99, ctx.wordCap), k === 0);
      ctx.used.add(t);
      return t;
    }
    case 'icon': return ICONS[ctx.seed++ % ICONS.length];
    case 'enum': return spec.default ?? spec.values[0];
    /* Switches alternate, so a list of days or marks has some on and some off */
    case 'bool': return (ctx.flips = (ctx.flips || 0) + 1) % 2 === 1;
    /* Numbers spread over their range, ends included: pins in the corners and in the middle */
    /* Illustrations rotate through the catalog, so tall and wide ones are both tried */
    case 'art': return ART_NAMES[(ctx.seed++ * 7) % ART_NAMES.length];
    case 'number': return Math.round(spec.min + (spec.max - spec.min) * [0, 1, 0.5, 0.25, 0.75, 1, 0][ctx.seed++ % 7]);
    case 'media': {
      const pool = SAMPLE_FILES.filter(f => spec.kinds.includes(f.kind));
      const f = pool[ctx.seed++ % pool.length];
      return { src: f.src, alt: f.alt };
    }
    case 'list': {
      const n = mode === 'short' ? spec.min : Math.max(spec.min, spec.max - ctx.cut);
      return Array.from({ length: n }, () => make(spec.item, mode, ctx));
    }
    case 'object': {
      const o = {};
      for (const [k, f] of Object.entries(spec.fields)) if (f.required || mode !== 'short') o[k] = make(f, mode, ctx);
      return o;
    }
  }
  return undefined;
}

/* The scan a case must pass: the slide inside a three-slide post with core opening and closing samples. */
function scanSlide(slide, ctx) {
  const role = roleOf(slide.component);
  const open = { name: 'Buka', theme: 'dark', component: 'cover', ...SAMPLES.cover };
  const mid = { name: 'Isi', theme: 'dark', component: 'statement', ...SAMPLES.statement };
  const close = { name: 'Tutup', theme: 'dark', component: 'closing', ...SAMPLES.closing };
  const slides = role === 'open' ? [slide, mid, close] : role === 'close' ? [open, mid, slide] : [open, slide, close];
  const at = slides.indexOf(slide);
  const { errors } = scanPost({ brand: ctx.brand.id, slug: 'uji-komponen', title: 'Uji komponen', slides }, ctx.brand, ctx.rules, ctx.icons, { unchecked: [slide.component], layoutOnly: true });
  return errors.filter(e => e.startsWith(`slides[${at}]`) || !e.startsWith('slides['));
}

/** The author's sample checked as a post would be. */
export function checkSample(id, sample, variant, ctx) {
  const slide = { name: 'Contoh', theme: 'light', component: id, ...sample, ...(variant ? { variant } : {}) };
  return scanSlide(slide, ctx);
}

/** One stress case for one variant. Returns { slide, errors } where errors means the limits contradict each other. */
export function stressCase(id, mode, variant, ctx) {
  const comp = COMPONENTS[id];
  let errors = [];
  /* A variant may accept shorter words than the field (validate with longWords): try shorter words before giving up */
  const vv = variant || (comp.keys.variant && comp.keys.variant.default);
  /* A variant may also accept fewer figures than the field (a percentage, three characters): try the others too */
  const tries = Object.values(comp.keys).some(f => f.numeral) ? NUMERALS[mode === 'short' ? 'short' : mode].length : 1;
  for (const wordCap of mode === 'long' ? [99, 14, 13, 12, 11, 10, 9] : [99]) {
    for (let step = 0; step < 24 * tries; step++) {
      const c = { rules: ctx.rules, used: new Set(), wordCap, num: step % tries, seed: mode === 'long' ? 3 : 11, shrink: Math.pow(0.92, Math.min(Math.floor(step / tries), 12)), cut: Math.max(0, Math.floor(step / tries) - 12) };
      const slide = { name: 'Uji', theme: 'light', component: id };
      for (const [k, spec] of Object.entries(comp.keys)) {
        if (k === 'variant') continue;
        if (!spec.required && mode === 'short') continue;
        if (spec.for && !spec.for.includes(vv)) continue;
        const v = make(spec, mode === 'short' ? 'short' : mode, c);
        if (v !== undefined) slide[k] = v;
      }
      /* A phrase field takes its words from the field it quotes */
      for (const [k, spec] of Object.entries(comp.keys)) {
        if (spec.within && typeof slide[spec.within] === 'string' && k in slide) {
          const n = Math.max(1, Math.min(typeof spec.words === 'number' ? spec.words : 2, mode === 'short' ? 1 : 9));
          let p = slide[spec.within].split(/\s+/).slice(1, 1 + n).join(' ') || slide[spec.within].split(/\s+/)[0];
          while (p.length > (spec.chars || 60) && p.includes(' ')) p = p.slice(0, p.lastIndexOf(' '));
          slide[k] = p;
        }
      }
      if (variant) slide.variant = variant;
      errors = scanSlide(slide, ctx);
      if (!errors.length) return { slide, errors: [] };
    }
  }
  return { slide: null, errors };
}
