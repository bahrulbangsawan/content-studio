// Static half of the component gate (component.mjs check): the definition, the reuse check, the
// stylesheet against the design system, the markup, and the entrance timing under every preset.
// The browser half (gate-browser.mjs) measures the rendered slides. Messages are for the author.
import { COMPONENTS, SLIDE_KEYS, roleOf } from './components.mjs';
import { MOTION_NAMES, LIMIT_MS } from './motion.mjs';
import { countWords } from './common.mjs';
import { DS } from './kit.mjs';

const FIELDS = ['id', 'label', 'role', 'motion', 'motions', 'visual', 'graphic', 'goal', 'spec', 'rule', 'variants', 'keys', 'validate', 'titleWords',
  'title', 'align', 'ordered', 'reuse', 'sample', 'samples', 'render', 'css', 'custom'];
const STYLE_KEYS = /^(style|class|css|html|colou?r|font\w*|size|position|x|y|width|height|align|bg|background|border|radius|shadow)$/i;

/* ---------------- Definition ---------------- */
function checkSpec(path, spec, errors) {
  if (!spec || typeof spec !== 'object') { errors.push(`${path}: spesifikasi field tidak sah.`); return; }
  switch (spec.type) {
    case 'text':
      if (!(typeof spec.words === 'number' || ['titleMax', 'coverTitleMax'].includes(spec.words))) errors.push(`${path}: field teks wajib punya batas kata (words).`);
      if (!(typeof spec.chars === 'number' && spec.chars > 0 && spec.chars <= 400)) errors.push(`${path}: field teks wajib punya batas karakter (chars, 1 sampai 400) agar muat di zona konten.`);
      return;
    case 'icon': case 'bool': case 'art': return;
    case 'number':
      if (!(Number.isInteger(spec.min) && Number.isInteger(spec.max) && spec.min < spec.max)) errors.push(`${path}: angka wajib punya min dan max bulat (num(min, max) dari kit).`);
      return;
    case 'media':
      if (!Array.isArray(spec.kinds) || !spec.kinds.length || spec.kinds.some(k => !['image', 'video'].includes(k))) errors.push(`${path}: media hanya image dan/atau video (media() dari kit).`);
      return;
    case 'enum':
      if (!Array.isArray(spec.values) || !spec.values.length) errors.push(`${path}: enum wajib punya values.`);
      return;
    case 'list':
      if (!(spec.min >= 1 && spec.max <= 6 && spec.min <= spec.max)) errors.push(`${path}: daftar berisi 1 sampai 6 butir (min ${spec.min}, max ${spec.max}).`);
      checkSpec(`${path}[]`, spec.item, errors);
      return;
    case 'object':
      if (!spec.fields || !Object.keys(spec.fields).length) { errors.push(`${path}: objek wajib punya fields.`); return; }
      for (const [k, f] of Object.entries(spec.fields)) {
        if (STYLE_KEYS.test(k)) errors.push(`${path}.${k}: nama field ini terdengar seperti gaya. post.json hanya berisi isi.`);
        checkSpec(`${path}.${k}`, f, errors);
      }
      return;
    default: errors.push(`${path}: tipe "${spec.type}" tidak dikenal. Pakai text, list, obj, icon, variant, bool, num, atau media dari kit.`);
  }
}

export function checkDefinition(def, id) {
  const errors = [], warnings = [];
  for (const k of Object.keys(def)) if (!FIELDS.includes(k)) errors.push(`Field definisi "${k}" tidak dikenal.`);
  for (const k of ['label', 'visual', 'goal', 'spec', 'rule']) if (typeof def[k] !== 'string' || !def[k].trim()) errors.push(`${k} wajib diisi (lihat references/authoring.md).`);
  const todo = ['label', 'visual', 'goal', 'spec', 'rule'].filter(k => /\bTODO\b/.test(def[k] || '')).concat(/\bTODO\b/.test((def.reuse && def.reuse.need) || '') ? ['reuse.need'] : []);
  if (todo.length) errors.push(`Masih ada TODO di ${todo.join(', ')}.`);
  if (def.label && def.label.length > 24) errors.push('label maksimal 24 karakter.');
  if (![undefined, 'open', 'close'].includes(def.role)) errors.push('role hanya open (slide pertama), close (slide terakhir), atau dikosongkan.');
  if (!MOTION_NAMES.includes(def.motion) || def.motion === 'classic') errors.push(`motion wajib salah satu preset gerak (${MOTION_NAMES.filter(m => m !== 'classic').join(', ')}).`);
  if (![undefined, 'top', 'inside'].includes(def.title)) errors.push('title hanya "top" (bawaan) atau "inside".');
  if (![undefined, 'start', 'center'].includes(def.align)) errors.push('align hanya "start" (bawaan) atau "center".');
  if (def.titleWords !== undefined && !(def.titleWords >= 2 && def.titleWords <= 12)) errors.push('titleWords antara 2 dan 12.');
  if (def.validate !== undefined && typeof def.validate !== 'function') errors.push('validate harus fungsi yang mengembalikan daftar pesan galat.');
  if (typeof def.css !== 'string' || !def.css.trim()) errors.push('css wajib diisi: gaya komponen, setiap pemilih diawali .x-' + id + '.');
  if (!def.sample || typeof def.sample !== 'object') errors.push('sample wajib: isi contoh yang realistis untuk katalog dan pemeriksaan.');
  else for (const k of ['name', 'theme', 'component', 'variant', 'motion', 'goal']) if (k in def.sample) errors.push(`sample.${k}: contoh hanya berisi field komponen.`);
  const keys = def.keys || {};
  const t = keys.title;
  if (!t || t.type !== 'text' || !t.required) errors.push('keys.title wajib: pakai title() dari kit. Setiap slide punya judul.');
  for (const [k, spec] of Object.entries(keys)) {
    if (SLIDE_KEYS[k]) { if (k !== 'variant') errors.push(`keys.${k}: nama ini dipakai engine untuk semua slide.`); continue; }
    if (STYLE_KEYS.test(k)) errors.push(`keys.${k}: nama field ini terdengar seperti gaya. post.json hanya berisi isi.`);
    checkSpec(`keys.${k}`, spec, errors);
  }
  if (def.variants) {
    const vs = Object.keys(def.variants);
    if (vs.length < 2) errors.push('variants berisi minimal dua tata letak, atau hapus saja.');
    for (const v of vs) if (!/^[a-z][a-z0-9]{1,15}$/.test(v)) errors.push(`varian "${v}": huruf kecil dan angka, 2 sampai 16 karakter.`);
    const kv = keys.variant;
    if (!kv || kv.type !== 'enum' || kv.values.join() !== vs.join()) errors.push('keys.variant wajib variant(...) dengan nama yang sama dan urutan yang sama dengan variants.');
  } else if (keys.variant) errors.push('keys.variant ada tapi variants tidak ada.');
  /* Per-variant extras: fields only some variants draw (only()), their own sample words, their own motion */
  const vnames = def.variants ? Object.keys(def.variants) : [];
  for (const [k, spec] of Object.entries(keys)) {
    if (spec && spec.for && !(Array.isArray(spec.for) && spec.for.length && spec.for.every(v => vnames.includes(v)))) errors.push(`keys.${k}: only(...) hanya menyebut varian yang ada (${vnames.join(', ') || 'belum ada varian'}).`);
  }
  for (const [name, map] of [['samples', def.samples], ['motions', def.motions]]) {
    if (map === undefined) continue;
    if (!map || typeof map !== 'object' || Array.isArray(map)) { errors.push(`${name} harus objek per varian.`); continue; }
    for (const v of Object.keys(map)) if (!vnames.includes(v)) errors.push(`${name}.${v}: varian ini tidak ada.`);
  }
  for (const [v, m] of Object.entries(def.motions || {})) if (!MOTION_NAMES.includes(m) || m === 'classic') errors.push(`motions.${v}: "${m}" bukan preset gerak.`);
  for (const [v, smp] of Object.entries(def.samples || {})) if (!smp || typeof smp !== 'object') errors.push(`samples.${v} harus objek berisi field komponen.`);
  const r = def.reuse;
  if (!r || typeof r.need !== 'string' || countWords(r.need) < 8) errors.push('reuse.need wajib: satu kalimat (minimal 8 kata) tentang bentuk isi yang tidak bisa dibawa komponen yang ada.');
  if (!r || !r.checked || typeof r.checked !== 'object') errors.push('reuse.checked wajib: komponen yang sudah dicoba beserta alasannya.');
  return { errors, warnings };
}

/* ---------------- Reuse ---------------- */
function desc(spec) {
  switch (spec.type) {
    case 'text': return 'text';
    case 'icon': return 'icon';
    case 'list': return `list(${desc(spec.item)})`;
    case 'object': return `{${Object.values(spec.fields).map(desc).filter(Boolean).sort().join(',')}}`;
    default: return null;
  }
}
/* A field weighs more the more structure it carries: a list of objects says more about a layout than a note */
const weight = d => 1 + (d.match(/[({,]/g) || []).length;
const shape = keys => Object.entries(keys).filter(([k]) => k !== 'title' && k !== 'variant')
  .map(([, s]) => ({ d: desc(s), min: s.min, max: s.max })).filter(x => x.d).map(x => ({ ...x, w: weight(x.d) }));
/** Weighted Dice similarity of two content shapes: 1 means the same fields carrying the same kind of content. */
function similarity(a, b) {
  const used = new Set();
  let match = 0;
  for (const x of a) {
    const j = b.findIndex((y, k) => !used.has(k) && y.d === x.d && (x.min === undefined || (x.min <= y.max && y.min <= x.max)));
    if (j >= 0) { used.add(j); match += x.w; }
  }
  const total = [...a, ...b].reduce((t, x) => t + x.w, 0);
  return total ? (2 * match) / total : 1;
}

/** The existing components closest in content shape, for the same position in a post. */
export function nearest(id, keys, role) {
  const me = shape(keys);
  return Object.entries(COMPONENTS).filter(([k]) => k !== id && roleOf(k) === (role || 'body'))
    .map(([k, c]) => ({ id: k, label: c.label, score: similarity(me, shape(c.keys)) }))
    .sort((a, b) => b.score - a.score);
}

export function checkReuse(def, id) {
  const errors = [], warnings = [];
  const near = nearest(id, def.keys || {}, def.role);
  const must = near.filter((n, k) => (k < 3 && n.score >= 0.4) || n.score >= 0.75);
  const checked = (def.reuse && def.reuse.checked) || {};
  for (const k of Object.keys(checked)) if (!COMPONENTS[k] || k === id) errors.push(`reuse.checked.${k}: komponen itu tidak ada.`);
  for (const n of must) {
    const why = checked[n.id];
    if (!why) errors.push(`reuse.checked belum membahas ${n.id} (${n.label}, kemiripan bentuk ${Math.round(n.score * 100)}%). Coba dulu komponen itu dengan varian dan geraknya; tulis kenapa tidak cukup.`);
    else if (countWords(why) < 6) errors.push(`reuse.checked.${n.id}: alasannya terlalu singkat. Sebut apa yang tidak bisa dibawa komponen itu (minimal 6 kata).`);
  }
  const reasons = Object.values(checked).map(s => String(s).trim().toLowerCase());
  if (new Set(reasons).size < reasons.length) errors.push('reuse.checked: setiap komponen perlu alasannya sendiri, bukan alasan yang sama.');
  if (near[0] && near[0].score === 1) warnings.push(`Bentuk isinya sama persis dengan ${near[0].id}. Pastikan tata letak baru ini memang membawa makna yang tidak bisa dibawa ${near[0].id} beserta variannya.`);
  return { errors, warnings, near: near.slice(0, 5) };
}

/* ---------------- Stylesheet ---------------- */
const NAMED = /\b(white|black|red|green|blue|yellow|orange|purple|pink|gr[ae]y|silver|navy|teal|maroon|olive|lime|aqua|fuchsia|gold|beige|ivory|tan|brown|cyan|magenta|indigo|violet|coral|salmon|khaki|crimson|turquoise|lavender|plum)\b/i;
const LITERAL = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
const ALLOWED = /^(display|position|inset|top|right|bottom|left|z-index|width|height|min-width|min-height|max-width|max-height|aspect-ratio|flex|flex-direction|flex-wrap|flex-grow|flex-shrink|flex-basis|flex-flow|grid|grid-template-columns|grid-template-rows|grid-template-areas|grid-column|grid-row|grid-area|grid-auto-flow|grid-auto-rows|grid-auto-columns|gap|row-gap|column-gap|align-items|align-self|align-content|justify-content|justify-items|justify-self|place-items|place-content|place-self|order|margin(-(top|right|bottom|left|inline|block)(-(start|end))?)?|padding(-(top|right|bottom|left|inline|block)(-(start|end))?)?|box-sizing|overflow|font-size|line-height|font-weight|font-variant-numeric|text-align|text-wrap|white-space|color|background|background-color|border(-(top|right|bottom|left|inline|block)(-(start|end))?)?(-(width|style|color))?|border-radius|border-(top|bottom)-(left|right)-radius|list-style|list-style-type|fill|fill-opacity|stroke|stroke-width|stroke-linecap|stroke-linejoin|stroke-dasharray|stroke-opacity|vector-effect|vertical-align)$/;
const BANNED = {
  'box-shadow': 'Bayangan tidak dipakai di design system. Kartu dibedakan oleh latar --s-card atau garis 2 px.',
  'text-shadow': 'Bayangan teks tidak dipakai. Tekankan lewat ukuran dan tebal huruf.',
  filter: 'Efek blur dan glow (glassmorphism) tidak dipakai.',
  'backdrop-filter': 'Efek kaca buram (glassmorphism) tidak dipakai.',
  'background-image': 'Gradien, pola garis, dan gambar latar tidak dipakai. Pakai satu warna token.',
  'background-clip': 'Teks bergradien tidak dipakai. Pakai satu warna, tekankan dengan ukuran atau tebal huruf.',
  '-webkit-background-clip': 'Teks bergradien tidak dipakai.',
  transform: 'Bentuk akhir tanpa transform: elemen miring adalah hiasan, dan transform dipakai engine untuk gerak masuk.',
  rotate: 'Elemen miring adalah hiasan.', scale: 'Transform dipakai engine untuk gerak masuk.', translate: 'Transform dipakai engine untuk gerak masuk.',
  animation: 'Animasi diatur engine lewat M() dan preset gerak, bukan CSS komponen.',
  transition: 'Transisi diatur engine lewat M() dan preset gerak.',
  'clip-path': 'clip-path dipakai engine untuk gerak masuk.',
  opacity: 'Pakai token warna (misalnya --s-muted atau color-mix dengan token), bukan opacity: opacity bertabrakan dengan gerak masuk.',
  font: 'Font datang dari akun. Atur font-size, line-height, dan font-weight saja.',
  'font-family': 'Font datang dari akun.',
  'font-style': 'Huruf miring tidak dipakai di design system.',
  'letter-spacing': 'Jarak huruf bawaan font. Tracking rapat sulit dibaca, tracking lebar untuk label adalah pola AI.',
  'word-spacing': 'Jarak kata bawaan font.',
  'text-transform': 'Huruf kapital semua tidak dipakai. Hierarki datang dari ukuran dan tebal.',
  'text-decoration': 'Garis bawah dan coret teks tidak dipakai sebagai hiasan.',
  'text-overflow': 'Teks tidak boleh dipotong. Atur batas karakter di keys supaya teks muat.',
  '-webkit-line-clamp': 'Teks tidak boleh dipotong. Atur batas karakter di keys.',
  'word-break': 'Pemutusan kata diatur engine; gerbang memeriksa kata yang terpotong.',
  'overflow-wrap': 'Pemutusan kata diatur engine; gerbang memeriksa kata yang terpotong.',
  hyphens: 'Pemutusan kata diatur engine.',
  content: 'Elemen semu ::before dan ::after tidak dipakai. Tulis elemennya di markup.',
  'mix-blend-mode': 'Mode campur warna tidak dipakai.',
  cursor: 'Slide tidak bisa diklik; pembaca Instagram hanya menggeser.',
  'pointer-events': 'Slide tidak bisa diklik.',
  outline: 'Garis luar tidak dipakai. Pakai border 2 px token garis.',
  columns: 'Teks bersambung antar kolom sulit dibaca di ponsel.',
  'column-count': 'Teks bersambung antar kolom sulit dibaca di ponsel.',
};
const px = v => [...String(v).matchAll(/(-?\d+(?:\.\d+)?)px/g)].map(m => Number(m[1]));

export function lintCss(css, def, id) {
  const errors = [];
  const variants = Object.keys(def.variants || {});
  const src = String(css || '').replace(/\/\*[\s\S]*?\*\//g, '');
  if (/@/.test(src)) errors.push('CSS komponen tidak boleh memakai at-rule (@media, @keyframes, @import, @font-face).');
  if (/!important/.test(src)) errors.push('!important tidak dipakai.');
  const rest = src.replace(/([^{}]+)\{([^{}]*)\}/g, '').trim();
  if (rest) errors.push(`CSS tidak terbaca di sekitar: "${rest.slice(0, 60)}". Tulis aturan biasa: pemilih { properti: nilai; }.`);
  const root = new RegExp(`^\\.x-${id}(?![\\w-])`);
  for (const m of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim(), body = m[2];
    for (const part of sel.split(',').map(x => x.trim())) {
      if (!root.test(part)) errors.push(`Pemilih "${part}" harus diawali .x-${id} agar gayanya tidak bocor ke komponen lain.`);
      if (/::?(before|after|marker|selection|placeholder|first-letter|first-line)|:(hover|focus|active|focus-visible|focus-within|checked|visited)/.test(part)) errors.push(`Pemilih "${part}": tanpa elemen semu dan tanpa keadaan interaktif.`);
      /* Classes inside :has() and :not() are conditions, not styled elements */
      for (const c of part.replace(/:(has|not)\((?:[^()]|\([^()]*\))*\)/g, '').matchAll(/\.([\w-]+)/g)) {
        const cl = c[1];
        if (cl === `x-${id}` || cl.startsWith(`${id}-`) || cl.startsWith('ds-') || variants.includes(cl.replace(/^v-/, '')) && cl.startsWith('v-')) continue;
        if (DS.shared.includes(cl)) errors.push(`Pemilih "${part}" mengubah gaya engine .${cl}. Judul, teks pendukung, dan ajakan tampil sama di semua komponen.`);
        else errors.push(`Pemilih "${part}": kelas .${cl} bukan milik komponen ini. Awali kelas komponen dengan ${id}- dan varian dengan v-.`);
      }
    }
    const decls = {};
    for (const d of body.split(';').map(x => x.trim()).filter(Boolean)) {
      const i = d.indexOf(':');
      if (i < 1) { errors.push(`Deklarasi "${d}" tidak terbaca di ${sel}.`); continue; }
      const prop = d.slice(0, i).trim().toLowerCase(), val = d.slice(i + 1).trim();
      decls[prop] = val;
      const at = `${sel} { ${prop} }`;
      const banned = Object.keys(BANNED).find(b => prop === b || (b !== 'font' && prop.startsWith(b + '-')));
      if (banned) { errors.push(`${at}: ${BANNED[banned]}`); continue; }
      if (!prop.startsWith('--') && !ALLOWED.test(prop)) { errors.push(`${at}: properti ini tidak ada di design system komponen.`); continue; }
      if (LITERAL.test(val) || NAMED.test(val) || /url\(|gradient\(/i.test(val)) { errors.push(`${at}: warna harus token var(--s-*), bukan nilai "${val}".`); continue; }
      for (const v of val.matchAll(/var\(--s-([\w-]+)/g)) if (!DS.colors.includes(v[1])) errors.push(`${at}: token --s-${v[1]} tidak ada. Token warna: ${DS.colors.map(c => `--s-${c}`).join(', ')}.`);
      if (prop.startsWith('--')) continue;
      if (prop === 'font-size') {
        const n = px(val);
        if (n.length !== 1 || !/^\d+px$/.test(val) || ![...DS.type, ...DS.display].includes(n[0])) errors.push(`${at}: ${val} di luar skala huruf (${DS.type.join(', ')} px; ${DS.display.join(' dan ')} px hanya untuk angka).`);
      }
      if (prop === 'font-weight' && !DS.weights.includes(Number(val))) errors.push(`${at}: tebal ${val} di luar skala (${DS.weights.join(', ')}).`);
      if (/^border/.test(prop) && !/radius/.test(prop)) {
        if (px(val).some(n => n > DS.border)) errors.push(`${at}: garis paling tebal ${DS.border} px.`);
        const words = val.replace(/var\([^)]*\)/g, m => m.replace(/\s/g, '')).split(/\s+/);
        const colours = words.filter(w => !/^(\d|solid|dashed|none|0$)/.test(w));
        for (const c of colours) if (!/^var\(--s-rule(-2)?\)$/.test(c) && c !== 'transparent') errors.push(`${at}: garis memakai warna netral var(--s-rule) atau var(--s-rule-2). Garis berwarna aksen di tepi kartu adalah pola AI; tekankan lewat latar.`);
      }
      if (/radius/.test(prop)) for (const v of val.split(/\s+/)) if (!(v === '0' || v === '50%' || v === '999px' || DS.radius.includes(px(v)[0]) && /^\d+px$/.test(v))) errors.push(`${at}: radius ${v} di luar skala (${DS.radius.join(', ')} px, 50% untuk lingkaran, 999px untuk chip satu baris).`);
      if (/^(margin|padding|gap|row-gap|column-gap)/.test(prop)) {
        for (const n of px(val)) {
          if (n < 0) errors.push(`${at}: margin negatif membuat elemen bertumpuk.`);
          else if (n % DS.spaceStep || n > DS.spaceMax) errors.push(`${at}: jarak ${n}px. Jarak bergerak per ${DS.spaceStep} px sampai ${DS.spaceMax} px (atau var(--sp-1) sampai var(--sp-8)).`);
        }
      }
      if (/^(width|min-width|max-width)$/.test(prop) && px(val).some(n => n > 888)) errors.push(`${at}: lebih lebar dari zona konten (888 px).`);
      if (/^(height|min-height|max-height)$/.test(prop) && px(val).some(n => n > 1014)) errors.push(`${at}: lebih tinggi dari zona konten (1014 px).`);
      if (prop === 'position' && !['relative', 'absolute', 'static'].includes(val)) errors.push(`${at}: hanya relative atau absolute.`);
      if (prop === 'overflow' && val !== 'visible') errors.push(`${at}: isi tidak boleh dipotong atau digulir. Atur batas karakter supaya muat.`);
      if (prop === 'white-space' && !['normal', 'nowrap'].includes(val)) errors.push(`${at}: hanya normal atau nowrap.`);
      if (prop === 'text-align' && !['left', 'start', 'center'].includes(val)) errors.push(`${at}: rata kiri atau tengah. Rata kanan-kiri meninggalkan celah kata.`);
      if (prop === 'z-index' && !(Number(val) >= 0 && Number(val) <= 3)) errors.push(`${at}: z-index 0 sampai 3.`);
      if (prop === 'fill-opacity' && Number(val) < 0.12) errors.push(`${at}: isian setipis itu hampir tidak terlihat.`);
    }
    const fs = px(decls['font-size'] || '')[0], lh = decls['line-height'];
    if (fs && lh) {
      const r = /px$/.test(lh) ? px(lh)[0] / fs : Number(lh);
      const [lo, hi] = fs < 56 ? [1.15, 1.6] : [1.0, 1.3];
      if (!(r >= lo && r <= hi)) errors.push(`${sel}: tinggi baris ${lh} untuk huruf ${fs}px (rasio ${r.toFixed(2)}). Rasio ${lo} sampai ${hi} untuk ukuran ini.`);
    }
  }
  return errors;
}

/* ---------------- Markup ---------------- */
const BAD_TAG = /<\s*(script|style|img|picture|video|audio|iframe|object|embed|link|a|button|input|select|textarea|form|label|details|summary|dialog|canvas|foreignObject|image|text|use|filter|linearGradient|radialGradient|pattern|mask|clipPath|marker)\b/i;
const BAD_ATTR = /\son[a-z]+\s*=|\shref\s*=|\stabindex\s*=|\scontenteditable|\srole="button"|\sdata-tap/i;

/** Markup rules for the body a component renders (the part inside .content). */
export function lintMarkup(html, def, id) {
  const errors = [];
  /* Photos and videos come only from mediaEl() in the kit: its frame, picture and empty-frame icon */
  html = html.replace(/<(img|video) class="md-el"[^>]*>(<\/video>)?/g, '').replace(/<svg class="md-ph"[\s\S]*?<\/svg>/g, '');
  /* Illustrations are placed by the engine from art.mjs, not drawn by the component */
  html = html.replace(/<div class="ill [^"]*"[^>]*><svg[\s\S]*?<\/svg><\/div>/g, '');
  const t = html.match(BAD_TAG);
  if (t) errors.push(`Markup memakai <${t[1]}>. Slide hanya teks, bentuk sederhana, dan ikon dari katalog; tidak ada tautan, tombol, gambar, atau teks SVG.`);
  const a = html.match(BAD_ATTR);
  if (a) errors.push(`Markup memakai atribut "${a[0].trim()}". Slide tidak bisa diklik.`);
  for (const m of html.matchAll(/\sstyle="([^"]*)"/g)) {
    for (const d of m[1].split(';').map(x => x.trim()).filter(Boolean)) {
      if (!d.startsWith('--')) { errors.push(`Atribut style "${d}": gaya ditulis di css komponen. Atribut style hanya untuk variabel (--nama: nilai).`); break; }
      if (LITERAL.test(d) || NAMED.test(d.split(':')[1] || '')) errors.push(`Atribut style "${d}": warna harus token.`);
    }
  }
  const variants = Object.keys(def.variants || {});
  const bad = new Set();
  for (const m of html.matchAll(/\sclass="([^"]*)"/g)) {
    for (const cl of m[1].split(/\s+/).filter(Boolean)) {
      if (cl === `x-${id}` || cl.startsWith(`${id}-`) || cl.startsWith('ds-') || DS.shared.includes(cl) || cl === 'drawn' || (cl.startsWith('v-') && variants.includes(cl.slice(2)))) continue;
      if (['md', 'is-missing', 'is-video', 'bleed', 'ill-row'].includes(cl)) continue;
      bad.add(cl);
    }
  }
  if (bad.size) errors.push(`Kelas ${[...bad].map(c => `"${c}"`).join(', ')} bukan milik komponen ini dan bisa membawa gaya komponen lain. Awali dengan ${id}- atau pakai kelas ds-* dari kit.`);
  for (const m of html.matchAll(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/g)) {
    if (/class="[^"]*\bic\b/.test(m[1])) continue;
    if (!/aria-hidden="true"/.test(m[1])) errors.push('SVG garis atau bentuk wajib aria-hidden="true"; isinya dibaca dari teks di sekitarnya.');
    const shapes = m[2].match(/<(path|line|polyline|circle|rect|ellipse|polygon)\b/g) || [];
    if (shapes.length > 16) errors.push(`SVG berisi ${shapes.length} bentuk. Gambar rumit buatan tangan terlihat kasar; pakai garis dan bentuk sederhana saja.`);
    for (const d of m[2].matchAll(/\sd="([^"]*)"/g)) if ((d[1].match(/[a-zA-Z]/g) || []).length > 12) errors.push('Path SVG terlalu rumit (lebih dari 12 perintah). Ilustrasi kasar adalah pola AI; pakai ikon dari katalog atau garis sederhana.');
  }
  const ttl = (html.match(/class="[^"]*\bttl\b/g) || []).length;
  if (ttl !== 1) errors.push(def.title === 'inside' ? 'Dengan title: "inside", render wajib memasang ctx.title tepat satu kali.' : `Judul muncul ${ttl} kali. Engine sudah memasang judul; render cukup mengembalikan isi di bawahnya.`);
  return errors;
}

/** Latest moment an element settles, from the motion attributes applyMotion wrote. */
export function motionEnd(html) {
  let end = 0;
  for (const m of html.matchAll(/<[^>]*\sdata-m\b[^>]*>/g)) {
    const d = Number((m[0].match(/\sdata-d="(\d+)"/) || [])[1] || 0), dur = Number((m[0].match(/\sdata-dur="(\d+)"/) || [])[1] || 600);
    end = Math.max(end, d + dur);
  }
  return end;
}
export { LIMIT_MS };
