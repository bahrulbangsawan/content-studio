// Brand account: schema, contrast rules, and the lock that marks the account as approved.
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readJson, sha256, HEX, contrast, ratioText, suggestShades } from './common.mjs';

/* Carousel rules (1080 x 1350 slides). Reels have their own set below. */
export const DEFAULT_RULES = {
  maxWordsPerSlide: 50,
  coverTitleMax: 6,
  titleMax: 8,
  minTextPx: 30,
  noExclamation: true,
  noEmDash: true,
  bannedPhrases: [],
  requireDisclaimer: true,
  /* Every slide carries a picture: diagram, chart, photo, icon row, character, or an illustration */
  visualEverySlide: true,
};
/* Video rules (Reels, 1080 x 1920): safe zones, reading, pace and length. Separate from the carousel's, because a
   video is watched full screen under the platform's top bar, caption, name and buttons, a few seconds per scene.
   The default safe zone is where two common 9:16 templates are both safe (TikTok's 540 x 960 guide doubled, and a
   1080 x 1920 template): top 252, left 120, right 120 (240 from y 360, 300 from y 840 for the button column),
   bottom 704. The logo and handle sit in the header above it; subtitles sit at its foot. Writing rules (banned
   phrases, exclamation marks) follow the carousel's unless set here. */
export const DEFAULT_VIDEO_RULES = {
  safeTop: 252,          // px from the top: header (logo and handle) and the platform's top bar; no content
  safeBottom: 704,       // px from the bottom: name, caption, audio, buttons; no content
  safeLeft: 120,
  safeRight: 120,        // right margin at the top of the safe zone ...
  rightSteps: [[360, 240], [840, 300]], // ... widening to clear the button column: [from y, right margin]
  captionTop: 1060,      // burned-in subtitles, inside the safe zone at its foot
  captionBottom: 1216,
  headerBrand: true,     // logo and handle in the header, above the safe zone, on every scene
  minTextPx: 32,         // smallest text in a scene, as it appears in the video
  minMetaPx: 26,         // smallest source line and disclaimer
  captionChars: 22,      // characters per subtitle line
  captions: true,        // burned-in subtitles by default
  maxWordsPerSecond: 4,    // an energetic explainer runs 3 to 4 words a second; faster is hard to follow
  hookMaxSeconds: 5,     // the first scene should land within this
  maxSceneSeconds: 14,   // one idea per scene
  minSeconds: 15,        // shorter reels give the idea no room
  maxSeconds: 90,        // longer than this: a warning (explainers do best at 30 to 75 s)
  hardMaxSeconds: 180,   // Instagram recommends reels up to 3 minutes to new viewers
};
/* Named sets for the two templates on their own, to start from in videoRules */
export const VIDEO_PRESETS = {
  gabungan: {},
  'tiktok-540': { safeTop: 252, safeBottom: 704, safeLeft: 120, safeRight: 120, rightSteps: [[360, 240]], captionTop: 1060, captionBottom: 1216 },
  'template-1080': { safeTop: 160, safeBottom: 480, safeLeft: 120, safeRight: 120, rightSteps: [[840, 300]], captionTop: 1284, captionBottom: 1440 },
};
const VIDEO_RANGE = {
  safeTop: [120, 400], safeBottom: [300, 800], safeLeft: [40, 200], safeRight: [40, 200],
  captionTop: [700, 1700], captionBottom: [800, 1800], minTextPx: [26, 64], minMetaPx: [22, 40], captionChars: [14, 32],
  maxWordsPerSecond: [2.4, 4.5], hookMaxSeconds: [2, 8], maxSceneSeconds: [6, 20], minSeconds: [3, 60], maxSeconds: [15, 180], hardMaxSeconds: [30, 900],
};
const WRITING = ['noExclamation', 'noEmDash', 'bannedPhrases', 'requireDisclaimer'];
/* Scenes are laid out at this width and scaled to the safe zone's width, so every layout keeps its proportions */
export const DESIGN_W = 800;

/** The rules a reel follows: video defaults, a named preset, the account's writing rules, then the account's videoRules. */
export function videoRulesOf(b) {
  const carousel = { ...DEFAULT_RULES, ...(b.rules || {}) };
  const own = b.videoRules || {}, preset = VIDEO_PRESETS[own.preset] || {};
  const { preset: name, ...rest } = own;
  return { ...DEFAULT_VIDEO_RULES, ...preset, ...Object.fromEntries(WRITING.map(k => [k, carousel[k]])), ...rest, ...(name ? { preset: name } : {}) };
}
/** Right margin at a height: the widest step at or above it. */
export const marginAt = (v, y) => (v.rightSteps || []).reduce((m, [y0, r]) => (y >= y0 ? Math.max(m, r) : m), v.safeRight);
/** Pixel boxes of the video zones, for the engine, the guide overlay and the checks. Scenes use one rectangle: the
    widest right margin it reaches, so no line of text can run under the buttons. */
export function videoZones(v) {
  const bottom = 1920 - v.safeBottom;
  const maxMargin = (y0, y1) => Math.max(v.safeRight, ...(v.rightSteps || []).filter(([y]) => y < y1).map(([, r]) => r));
  const cBottom = v.captions === false ? bottom : v.captionTop - 16;
  const content = { x: v.safeLeft, y: v.safeTop, w: 1080 - v.safeLeft - maxMargin(v.safeTop, cBottom), h: cBottom - v.safeTop };
  const close = { x: v.safeLeft, y: v.safeTop, w: 1080 - v.safeLeft - maxMargin(v.safeTop, bottom), h: bottom - v.safeTop };
  const caption = { x: v.safeLeft, y: v.captionTop, w: 1080 - v.safeLeft - maxMargin(v.captionTop, v.captionBottom), h: v.captionBottom - v.captionTop };
  return { top: v.safeTop, bottom, left: v.safeLeft, right: v.safeRight, steps: v.rightSteps || [], content, close, caption, zoom: +Math.min(1, content.w / DESIGN_W).toFixed(4), closeZoom: +Math.min(1, close.w / DESIGN_W).toFixed(4) };
}

const COLOR_KEYS = ['bg', 'card', 'ink', 'muted', 'accent'];
const ALLOWED_TOP = ['id', 'name', 'handle', 'wordmark', 'language', 'logo', 'font', 'colors', 'disclaimer', 'swipeLabel', 'structure', 'rules', 'videoRules', 'pronounce', 'dos'];

export const brandDir = (root, id) => join(root, 'brands', id);

/** Validate a brand object and its files. Returns { errors, warnings, contrasts }. */
export function validateBrand(b, dir) {
  const errors = [], warnings = [], contrasts = [];
  for (const k of Object.keys(b)) if (!ALLOWED_TOP.includes(k)) errors.push(`Kunci tidak dikenal di brand.json: "${k}"`);
  if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(b.id || '')) errors.push('id wajib: huruf kecil, angka, dan tanda hubung (contoh: partofphysio).');
  if (!b.name || String(b.name).length > 60) errors.push('name wajib, maksimal 60 karakter.');
  if (!/^[a-z0-9._]{1,30}$/.test(b.handle || '')) errors.push('handle wajib: huruf kecil, angka, titik, atau garis bawah, tanpa @.');
  if (b.wordmark !== undefined && String(b.wordmark).length > 24) errors.push('wordmark maksimal 24 karakter.');
  if (!['id', 'en'].includes(b.language || 'id')) errors.push('language hanya "id" atau "en".');

  const logo = b.logo || {};
  for (const v of ['light', 'dark']) {
    if (!logo[v]) errors.push(`logo.${v} wajib (berkas SVG untuk latar ${v === 'light' ? 'terang' : 'gelap'}).`);
    else if (!existsSync(join(dir, logo[v]))) errors.push(`Berkas logo.${v} tidak ada: ${logo[v]}`);
  }
  if (logo.light && logo.dark && logo.light === logo.dark) warnings.push('Logo terang dan gelap memakai berkas yang sama. Pastikan logo tetap terlihat di slide gelap.');

  const font = b.font || {};
  if (!font.family || !/^[A-Za-z0-9 ]{2,40}$/.test(font.family)) errors.push('font.family wajib (contoh: Inter).');
  if (font.file && !existsSync(join(dir, font.file))) errors.push(`Berkas font tidak ada: ${font.file}`);
  if (font.file && !/\.woff2$/i.test(font.file)) errors.push('Font harus .woff2 variable dengan sumbu wght 400 sampai 700.');

  const c = b.colors || {};
  for (const theme of ['light', 'dark']) {
    const t = c[theme] || {};
    /* Cards on dark slides use the light palette, so the dark theme needs no card colour of its own */
    for (const k of COLOR_KEYS) if (!(theme === 'dark' && k === 'card' && t[k] === undefined) && !HEX.test(t[k] || '')) errors.push(`colors.${theme}.${k} ${theme === 'dark' && k === 'card' ? 'boleh dihapus; bila diisi' : 'wajib'} berupa hex #RRGGBB.`);
  }
  for (const k of ['highlight', 'onHighlight']) if (!HEX.test(c[k] || '')) errors.push(`colors.${k} wajib berupa hex #RRGGBB.`);
  if (!errors.some(e => e.startsWith('colors.'))) {
    /* `key` names the colour to adjust when the pair fails; the suggestion keeps its hue and only moves lightness. */
    const need = (label, fg, bg, min, warnBelow, key, adjustFg) => {
      const r = contrast(fg, bg);
      contrasts.push({ label, fg, bg, ratio: r });
      if (r < min) {
        /* Aim a little above the minimum so a later tweak does not tip it under. */
        const s = suggestShades(adjustFg ? fg : bg, adjustFg ? bg : fg, Math.max(min * 1.06, min + 0.25)).map(x => `${x.hex} (${x.dir}, ${ratioText(contrast(adjustFg ? x.hex : fg, adjustFg ? bg : x.hex))})`);
        errors.push(`Kontras ${label} ${ratioText(r)}, minimal ${ratioText(min)}.${s.length ? ` Usulan untuk ${key}: ${s.join(' atau ')}. Pemilik akun yang memilih.` : ''}`);
      } else if (warnBelow && r < warnBelow) warnings.push(`Kontras ${label} ${ratioText(r)}, disarankan ${ratioText(warnBelow)} atau lebih.`);
    };
    for (const theme of ['light', 'dark']) {
      const t = c[theme], n = theme === 'light' ? 'terang' : 'gelap';
      need(`teks di latar ${n}`, t.ink, t.bg, 4.5, 7, `colors.${theme}.ink`, true);
      need(`teks pendukung di latar ${n}`, t.muted, t.bg, 4.5, 0, `colors.${theme}.muted`, true);
      if (theme === 'light') need('teks di kartu (kartu tetap terang di slide gelap)', t.ink, t.card, 4.5, 0, 'colors.light.card', false);
      need(`teks di atas aksen ${n}`, t.bg, t.accent, 4.5, 0, `colors.${theme}.accent`, false);
      need(`teks besar dan ikon beraksen di latar ${n}`, t.accent, t.bg, 3, 0, `colors.${theme}.accent`, true);
    }
    need('teks di atas warna sorotan', c.onHighlight, c.highlight, 4.5, 0, 'colors.onHighlight', true);
  }

  const r = { ...DEFAULT_RULES, ...(b.rules || {}) };
  for (const k of Object.keys(b.rules || {})) if (!(k in DEFAULT_RULES)) errors.push(`rules.${k} tidak dikenal.`);
  if (r.maxWordsPerSlide > 60) errors.push('rules.maxWordsPerSlide maksimal 60.');
  if (r.minTextPx < 28) errors.push('rules.minTextPx minimal 28 (teks di bawah itu tidak terbaca di ponsel).');
  if (r.titleMax > 10 || r.coverTitleMax > 8) errors.push('Batas judul terlalu longgar: titleMax maksimal 10, coverTitleMax maksimal 8.');
  if (r.requireDisclaimer && !b.disclaimer) errors.push('disclaimer wajib karena rules.requireDisclaimer aktif.');
  if (b.disclaimer && b.disclaimer.length > 140) errors.push('disclaimer maksimal 140 karakter agar muat di footer.');
  /* Video rules: known keys, sane ranges, and a safe zone big enough for the scene layouts */
  if (b.videoRules !== undefined && (typeof b.videoRules !== 'object' || Array.isArray(b.videoRules))) errors.push('videoRules harus objek.');
  else if (b.videoRules) {
    for (const k of Object.keys(b.videoRules)) if (!(k in DEFAULT_VIDEO_RULES) && !WRITING.includes(k) && k !== 'preset') errors.push(`videoRules.${k} tidak dikenal. Pilihan: ${['preset', ...Object.keys(DEFAULT_VIDEO_RULES), ...WRITING].join(', ')}.`);
    if (b.videoRules.preset !== undefined && !VIDEO_PRESETS[b.videoRules.preset]) errors.push(`videoRules.preset: ${Object.keys(VIDEO_PRESETS).join(', ')}.`);
    const v = videoRulesOf(b);
    for (const [k, [lo, hi]] of Object.entries(VIDEO_RANGE)) if (b.videoRules[k] !== undefined && !(typeof v[k] === 'number' && v[k] >= lo && v[k] <= hi)) errors.push(`videoRules.${k}: ${lo} sampai ${hi}.`);
    for (const k of ['headerBrand', 'captions', 'noExclamation', 'noEmDash', 'requireDisclaimer']) if (b.videoRules[k] !== undefined && typeof b.videoRules[k] !== 'boolean') errors.push(`videoRules.${k} harus true atau false.`);
    if (b.videoRules.bannedPhrases !== undefined && (!Array.isArray(b.videoRules.bannedPhrases) || b.videoRules.bannedPhrases.some(x => typeof x !== 'string'))) errors.push('videoRules.bannedPhrases harus daftar frasa.');
    if (b.videoRules.rightSteps !== undefined && (!Array.isArray(v.rightSteps) || v.rightSteps.some((st, k) => !Array.isArray(st) || st.length !== 2 || !st.every(Number.isFinite) || st[0] < v.safeTop || st[0] > 1920 || st[1] < 0 || st[1] > 500 || (k && st[0] <= v.rightSteps[k - 1][0])))) errors.push('videoRules.rightSteps: daftar [mulai y, margin kanan] dengan y naik, misalnya [[360, 240], [840, 300]].');
    if (!errors.some(e => e.startsWith('videoRules.'))) {
      const z = videoZones(v);
      if (z.content.h < 560) errors.push(`Zona konten video hanya ${z.content.h} px tinggi (safeTop sampai captionTop). Minimal 560 px.`);
      if (z.content.w < 560) errors.push(`Zona konten video hanya ${z.content.w} px lebar (safeLeft dan margin kanan). Minimal 560 px.`);
      if (v.captionBottom > z.bottom) errors.push(`videoRules.captionBottom ${v.captionBottom} keluar zona aman (berakhir di ${z.bottom}).`);
      if (v.captionBottom - v.captionTop < 130) errors.push('Pita subtitle (captionTop sampai captionBottom) minimal 130 px untuk dua baris.');
      if (v.maxSeconds > v.hardMaxSeconds) errors.push('videoRules.maxSeconds tidak boleh lebih dari hardMaxSeconds.');
    }
    if (videoRulesOf(b).requireDisclaimer && !b.disclaimer) errors.push('disclaimer wajib karena videoRules.requireDisclaimer aktif.');
  }
  /* How the voice-over says words the TTS would read the Indonesian way: { "partofphysio": "part of physio" } */
  if (b.pronounce !== undefined && (typeof b.pronounce !== 'object' || Array.isArray(b.pronounce) || Object.entries(b.pronounce).some(([k, x]) => typeof x !== 'string' || !k.trim() || x.length > 80))) errors.push('pronounce harus objek { "kata": "cara mengucapkannya" }.');
  if (b.structure && (!Array.isArray(b.structure) || b.structure.some(x => typeof x !== 'string'))) errors.push('structure harus daftar nama slide.');
  if (b.dos && (!Array.isArray(b.dos) || b.dos.some(p => !Array.isArray(p) || p.length !== 2))) errors.push('dos harus daftar pasangan ["lakukan", "hindari"].');
  return { errors, warnings, contrasts };
}

/** Fingerprint of everything the account owner approved. */
export function brandFingerprint(b, dir) {
  const parts = [JSON.stringify(b)];
  for (const f of [b.logo?.light, b.logo?.dark, b.font?.file].filter(Boolean)) {
    const p = join(dir, f);
    parts.push(existsSync(p) ? sha256(readFileSync(p)) : 'missing:' + f);
  }
  return sha256(parts.join('\n'));
}

export function writeLock(b, dir) {
  writeFileSync(join(dir, 'brand.lock'), JSON.stringify({ fingerprint: brandFingerprint(b, dir), approvedAt: new Date().toISOString() }, null, 2) + '\n');
}

/** Load a brand and confirm it still matches what was approved. */
export function loadBrand(root, id) {
  const dir = brandDir(root, id);
  const b = readJson(join(dir, 'brand.json'), `Akun "${id}"`);
  const lockPath = join(dir, 'brand.lock');
  const lock = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, 'utf8')) : null;
  const approved = !!lock;
  const intact = approved && lock.fingerprint === brandFingerprint(b, dir);
  return { brand: b, dir, approved, intact, rules: { ...DEFAULT_RULES, ...(b.rules || {}) }, videoRules: videoRulesOf(b) };
}
