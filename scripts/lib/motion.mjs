// Entrance motion presets. A slide may pick one with "motion"; the engine rewrites every [data-m]
// element of that slide into a start pose (--from, --o, --clip0), a delay and a duration.
// The schedule is compressed so the last element always settles before LIMIT_MS, which keeps the
// in-page "Masuk diam dalam 1,2 dtk" check green for any preset on any component.
// Only transform, opacity, clip-path and stroke-dashoffset move: those are the properties the
// PNG and MP4 export copies frame by frame.

export const LIMIT_MS = 1200;
const SETTLE = 1150;

/* Every curve decelerates to rest without passing its target: no bounce or elastic overshoot. */
export const EASES = {
  smooth: 'cubic-bezier(0.2, 0, 0, 1)',
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
};

const REVEAL = 'inset(-96px -96px -96px -96px)';
const SVG_INNER = /^(g|circle|path|line|rect|text|polyline|polygon|ellipse)$/;
const t3 = (x, y) => `translate3d(${x}px, ${y}px, 0px)`;
const SCATTER = [[-84, 56, -7], [92, -48, 6], [-64, -60, 5], [76, 64, -6], [-92, 40, 7], [60, -70, -5]];

/* Each preset maps a role to a start pose. Roles: title, word, text, item, art.
   k is the index among elements of the same role, n their count. */
export const MOTIONS = {
  rise: { label: 'Naik', desc: 'Naik pelan dan sedikit membesar.', gap: { item: 90 },
    title: () => ({ from: t3(0, 28), ease: 'out' }),
    item: () => ({ from: `${t3(0, 32)} scale(0.97)`, ease: 'out' }) },
  drop: { label: 'Turun', desc: 'Turun dari atas lalu berhenti pelan.', gap: { item: 100 },
    title: () => ({ from: t3(0, -32), ease: 'out' }),
    item: () => ({ from: t3(0, -48), ease: 'expo', dur: 680 }) },
  slide: { label: 'Geser masuk', desc: 'Masuk dari kiri dengan perlambatan panjang.', gap: { item: 80 },
    title: () => ({ from: t3(-40, 0), ease: 'expo', dur: 700 }),
    item: () => ({ from: t3(-80, 0), ease: 'expo', dur: 700 }) },
  alternate: { label: 'Bergantian', desc: 'Butir ganjil dari kiri, genap dari kanan.', gap: { item: 110 },
    title: () => ({ from: t3(0, 24), ease: 'out' }),
    item: k => ({ from: t3(k % 2 ? 104 : -104, 0), ease: 'expo', dur: 700 }) },
  glide: { label: 'Meluncur', desc: 'Meluncur jauh dari kanan, rapat satu sama lain.', gap: { item: 70 },
    title: () => ({ from: t3(72, 0), ease: 'expo', dur: 760 }),
    item: () => ({ from: t3(150, 0), ease: 'expo', dur: 760 }) },
  zoom: { label: 'Dekat', desc: 'Membesar dari tengah.', gap: { item: 90 },
    title: () => ({ from: 'scale(0.9)', ease: 'smooth' }),
    item: () => ({ from: 'scale(0.84)', ease: 'out' }) },
  pop: { label: 'Muncul', desc: 'Membesar cepat dari kecil lalu diam.', gap: { item: 110 },
    title: () => ({ from: 'scale(0.92)', ease: 'out' }),
    item: () => ({ from: 'scale(0.6)', ease: 'expo', dur: 520 }) },
  stamp: { label: 'Cap', desc: 'Turun dari depan seperti stempel.', gap: { item: 110 },
    title: () => ({ from: 'scale(1.18)', ease: 'expo', dur: 520 }),
    item: () => ({ from: 'scale(1.4)', ease: 'expo', dur: 480 }) },
  tilt: { label: 'Miring', desc: 'Naik sambil tegak dari posisi miring.', gap: { item: 100 },
    title: () => ({ from: `rotate(-3deg) ${t3(0, 24)}`, o: '0% 100%', ease: 'out' }),
    item: () => ({ from: `${t3(0, 36)} rotate(-4deg)`, o: '0% 100%', ease: 'out' }) },
  swing: { label: 'Ayun', desc: 'Berayun dari sudut kiri atas lalu diam.', gap: { item: 110 },
    title: () => ({ from: 'rotate(-6deg)', o: '0% 0%', ease: 'expo', dur: 700 }),
    item: () => ({ from: 'rotate(-10deg)', o: '0% 0%', ease: 'expo', dur: 720 }) },
  fan: { label: 'Kipas', desc: 'Membuka seperti kipas dari bawah.', gap: { item: 100 },
    title: () => ({ from: t3(0, 24), ease: 'out' }),
    item: (k, n) => ({ from: `rotate(${((k - (n - 1) / 2) * 9).toFixed(1)}deg) scale(0.9)`, o: '50% 140%', ease: 'expo', dur: 680 }) },
  unfold: { label: 'Buka lipatan', desc: 'Terbuka dari atas ke bawah.', gap: { item: 110 },
    title: () => ({ from: 'scaleY(0.4)', o: '50% 100%', ease: 'expo', dur: 600 }),
    item: () => ({ from: 'scaleY(0.12)', o: '50% 0%', ease: 'expo', dur: 620 }) },
  stretch: { label: 'Rentang', desc: 'Merentang dari kiri.', gap: { item: 90 },
    title: () => ({ from: 'scaleX(0.6)', o: '0% 50%', ease: 'expo', dur: 640 }),
    item: () => ({ from: 'scaleX(0.12)', o: '0% 50%', ease: 'expo', dur: 640 }) },
  wipe: { label: 'Sapu', desc: 'Tersingkap dari kiri ke kanan.', gap: { item: 110 },
    title: () => ({ from: t3(-12, 0), clip: 'inset(-96px 100% -96px 0px)', ease: 'expo', dur: 700 }),
    item: () => ({ from: t3(-16, 0), clip: 'inset(-96px 100% -96px 0px)', ease: 'expo', dur: 700 }) },
  curtain: { label: 'Tirai', desc: 'Tersingkap dari atas ke bawah.', gap: { item: 110 },
    title: () => ({ from: t3(0, 16), clip: 'inset(100% -96px 0px -96px)', ease: 'expo', dur: 700 }),
    item: () => ({ from: t3(0, -12), clip: 'inset(0px -96px 100% -96px)', ease: 'expo', dur: 700 }) },
  cascade: { label: 'Bertingkat', desc: 'Turun serong satu per satu.', gap: { item: 140 },
    title: () => ({ from: t3(-32, 0), ease: 'expo', dur: 640 }),
    item: () => ({ from: t3(-56, -56), ease: 'out', dur: 660 }) },
  scatter: { label: 'Tersebar', desc: 'Berkumpul dari arah yang berbeda-beda.', gap: { item: 80 },
    title: () => ({ from: 'scale(0.92)', ease: 'smooth' }),
    item: k => { const [x, y, r] = SCATTER[k % SCATTER.length]; return { from: `${t3(x, y)} rotate(${r}deg)`, ease: 'out', dur: 760 }; } },
  typeset: { label: 'Kata demi kata', desc: 'Judul muncul kata demi kata.', split: true, gap: { item: 90, word: 55 },
    word: () => ({ from: `${t3(0, 44)} rotate(4deg)`, o: '0% 100%', ease: 'out', dur: 520 }),
    item: () => ({ from: t3(0, 28), ease: 'out' }) },
  spotlight: { label: 'Sorot', desc: 'Semua muncul tenang, butir terakhir menyusul lebih besar.', gap: { item: 60 }, focalGap: 220,
    title: () => ({ from: 'none', ease: 'smooth', dur: 420 }),
    item: (k, n) => (k === n - 1 && n > 1 ? { from: 'scale(0.7)', ease: 'expo', dur: 560 } : { from: t3(0, 12), ease: 'smooth', dur: 420 }) },
  cinema: { label: 'Sinema', desc: 'Judul turun dari ukuran besar, isi menyusul pelan.', gap: { title: 220, item: 70 },
    title: () => ({ from: 'scale(1.35)', ease: 'expo', dur: 820 }),
    item: () => ({ from: t3(0, 20), ease: 'smooth', dur: 520 }) },
};
export const MOTION_NAMES = ['classic', ...Object.keys(MOTIONS)];

const ROLE_GAP = { title: 130, word: 55, text: 90, item: 100, art: 120, draw: 60 };
const ROLE_DUR = { title: 600, word: 520, text: 560, item: 600, art: 640, draw: 500 };

/* Parse and rebuild an element's style attribute. */
function styleMap(s) {
  const m = new Map();
  (s || '').split(';').forEach(d => { const i = d.indexOf(':'); if (i > 0) m.set(d.slice(0, i).trim(), d.slice(i + 1).trim()); });
  return m;
}
const styleText = m => [...m].map(([k, v]) => `${k}: ${v}`).join('; ');

/** Every [data-m] opening tag in a slide body, in document order. */
const TAG = /<([a-zA-Z][a-zA-Z0-9]*)\b([^<>]*?\sdata-m\b[^<>]*?)(\/?)>/g;
const attr = (a, name) => { const m = a.match(new RegExp(`\\s${name}="([^"]*)"`)); return m ? m[1] : null; };
const setAttr = (a, name, v) => (attr(a, name) === null ? `${a} ${name}="${v}"` : a.replace(new RegExp(`(\\s${name}=")[^"]*(")`), `$1${v}$2`));

function roleOf(tag, a) {
  const r = attr(a, 'data-r');
  if (r) return r;
  const cls = attr(a, 'class') || '';
  if (/\bttl\b/.test(cls)) return 'title';
  if (/\b(kid|squig-svg|lead|st-dot)\b/.test(cls)) return /\bkid\b/.test(cls) ? 'art' : 'draw';
  if (/\b(kicker|lede|small|body-l|bubble|cta)\b/.test(cls)) return 'text';
  return 'item';
}

/**
 * Rewrite the motion attributes of one slide body for a preset. `classic` keeps the hand-tuned
 * values written by each component. Elements with data-r="draw" keep their own start pose
 * (a line growing, a stroke drawing) and only get a slot in the schedule.
 */
export function applyMotion(html, name) {
  const preset = MOTIONS[name];
  const units = [];
  html.replace(TAG, (all, tag, a) => { units.push({ tag, a, role: roleOf(tag, a) }); return all; });
  if (!units.length) return html;
  const counts = {}, seen = {};
  units.forEach(u => { counts[u.role] = (counts[u.role] || 0) + 1; });
  units.forEach(u => { u.k = seen[u.role] = (seen[u.role] ?? -1) + 1; u.n = counts[u.role]; });

  if (!preset) {
    /* classic: hand-tuned delays stay, but still compress if a component wrote a long schedule */
    units.forEach(u => { u.d = Number(attr(u.a, 'data-d') || 0); u.dur = Number(attr(u.a, 'data-dur') || 600); });
  } else {
    let t = 0;
    units.forEach((u, i) => {
      const role = u.role === 'text' ? 'title' : u.role === 'art' ? 'item' : u.role;
      const fx = u.role === 'draw' ? null : (preset[role] || preset.item || MOTIONS.rise.item)(u.k, u.n);
      const together = attr(u.a, 'data-with') !== null && i > 0;
      u.d = together ? units[i - 1].d + Number(attr(u.a, 'data-with') || 0) : t;
      if (preset.focalGap && u.role === 'item' && u.k === u.n - 1 && u.n > 1) u.d += preset.focalGap;
      u.dur = fx && fx.dur ? fx.dur : Number(attr(u.a, 'data-dur') || ROLE_DUR[u.role] || 600);
      const maxDur = attr(u.a, 'data-maxdur');
      if (maxDur) u.dur = Math.min(u.dur, Number(maxDur));
      u.fx = fx;
      const gap = (preset.gap && preset.gap[u.role]) ?? ROLE_GAP[u.role] ?? 100;
      t = Math.max(t, u.d + gap);
    });
  }
  /* Compress delays so every element settles in time (classic keeps its hand-tuned values up to the limit). */
  const cap = preset ? SETTLE : LIMIT_MS;
  let s = 1;
  units.forEach(u => { u.dur = Math.min(u.dur, cap - 120); if (u.d > 0 && u.d + u.dur > cap) s = Math.min(s, (cap - u.dur) / u.d); });
  units.forEach(u => { u.d = Math.round((u.d * s) / 10) * 10; });

  let idx = 0;
  return html.replace(TAG, (all, tag, a, selfClose) => {
    const u = units[idx++];
    let na = setAttr(setAttr(a, 'data-d', String(u.d)), 'data-dur', String(u.dur));
    if (u.fx) {
      const st = styleMap(attr(na, 'style'));
      ['--from', '--o', '--me', '--clip0', '--clip1'].forEach(k => st.delete(k));
      st.set('--from', u.fx.from || 'none');
      if (u.fx.o) st.set('--o', u.fx.o);
      if (u.fx.ease) st.set('--me', EASES[u.fx.ease]);
      if (u.fx.clip && !SVG_INNER.test(u.tag)) { st.set('--clip0', u.fx.clip); st.set('--clip1', REVEAL); }
      na = setAttr(na, 'style', styleText(st));
    }
    return `<${tag}${na}${selfClose}>`;
  });
}

/** Wrap each word of a title in an inline-block unit so "typeset" can move it on its own. */
export const splitWords = (escaped, label = 'Kata') => escaped.trim().split(/\s+/)
  .map((w, k) => `<span class="w" data-m data-r="word" data-label="${label} ${k + 1}">${w}</span>`).join(' ');
