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
   video is watched full screen under Instagram's buttons and caption, for a few seconds per scene. Zones follow
   Meta's Reels guidance: keep the top 14 % and bottom 35 % free of key content, 6 % or more at the sides, and the
   action buttons on the right. Writing rules (banned phrases, exclamation marks) follow the carousel's unless set here. */
export const DEFAULT_VIDEO_RULES = {
  safeTop: 270,          // px from the top without text: Instagram's top bar (Meta: 14 % = 269)
  safeBottom: 672,       // px from the bottom without key content: name, caption, audio (Meta: 35 % = 672)
  safeSide: 90,          // px on each side (Meta: at least 6 % = 65)
  railWidth: 120,        // the like, comment and share buttons on the right ...
  railTop: 1100,         // ... from this height down; the content zone keeps its right edge clear of them
  captionTop: 1268,      // burned-in subtitles and the closing's footnotes sit in this band, under the content
  captionBottom: 1458,
  brandBar: true,        // logo and handle at the top of the content zone in middle scenes
  minTextPx: 40,         // smallest text in a scene
  minMetaPx: 30,         // smallest source line, disclaimer, handle
  captionChars: 24,      // characters per subtitle line (BBC: about 25 for vertical video)
  captions: true,        // burned-in subtitles by default
  maxWordsPerSecond: 3.2,  // a voice-over faster than this is hard to follow
  hookMaxSeconds: 5,     // the first scene should land within this
  maxSceneSeconds: 14,   // one idea per scene
  minSeconds: 15,        // shorter reels give the idea no room
  maxSeconds: 90,        // longer than this: a warning (explainers do best at 30 to 75 s)
  hardMaxSeconds: 180,   // Instagram recommends reels up to 3 minutes to new viewers
};
const VIDEO_RANGE = {
  safeTop: [220, 360], safeBottom: [560, 760], safeSide: [65, 140], railWidth: [0, 200], railTop: [800, 1460],
  captionTop: [1150, 1500], captionBottom: [1300, 1600], minTextPx: [36, 64], minMetaPx: [26, 40], captionChars: [16, 32],
  maxWordsPerSecond: [2.4, 4], hookMaxSeconds: [2, 8], maxSceneSeconds: [6, 20], minSeconds: [3, 60], maxSeconds: [15, 180], hardMaxSeconds: [30, 900],
};
const WRITING = ['noExclamation', 'noEmDash', 'bannedPhrases', 'requireDisclaimer'];
const BRAND_BAR = 64;

/** The rules a reel follows: video defaults, the account's writing rules, then the account's videoRules. */
export function videoRulesOf(b) {
  const carousel = { ...DEFAULT_RULES, ...(b.rules || {}) };
  return { ...DEFAULT_VIDEO_RULES, ...Object.fromEntries(WRITING.map(k => [k, carousel[k]])), ...(b.videoRules || {}) };
}
/** Pixel boxes of the video zones, for the engine, the guide overlay and the checks. */
export function videoZones(v) {
  const bottom = 1920 - v.safeBottom, bar = v.brandBar ? BRAND_BAR : 0;
  /* The right margin also clears the button column, so no line of text can run under it */
  const right = Math.max(v.safeSide, v.railTop < bottom ? v.railWidth + 12 : 0);
  return { top: v.safeTop, bottom, side: v.safeSide, right, bar, content: { x: v.safeSide, y: v.safeTop + bar, w: 1080 - v.safeSide - right, h: bottom - v.safeTop - bar }, full: { y: v.safeTop, h: bottom - v.safeTop }, caption: { x: v.railWidth + 28, y: v.captionTop, w: 1080 - 2 * (v.railWidth + 28), h: v.captionBottom - v.captionTop }, rail: { x: 1080 - v.railWidth, y: v.railTop, w: v.railWidth } };
}

const COLOR_KEYS = ['bg', 'card', 'ink', 'muted', 'accent'];
const ALLOWED_TOP = ['id', 'name', 'handle', 'wordmark', 'language', 'logo', 'font', 'colors', 'disclaimer', 'swipeLabel', 'structure', 'rules', 'videoRules', 'dos'];

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
  /* Video rules: known keys, sane ranges, and a content zone tall enough for the scene layouts */
  if (b.videoRules !== undefined && (typeof b.videoRules !== 'object' || Array.isArray(b.videoRules))) errors.push('videoRules harus objek.');
  else if (b.videoRules) {
    for (const k of Object.keys(b.videoRules)) if (!(k in DEFAULT_VIDEO_RULES) && !WRITING.includes(k)) errors.push(`videoRules.${k} tidak dikenal. Pilihan: ${[...Object.keys(DEFAULT_VIDEO_RULES), ...WRITING].join(', ')}.`);
    const v = videoRulesOf(b);
    for (const [k, [lo, hi]] of Object.entries(VIDEO_RANGE)) if (b.videoRules[k] !== undefined && !(typeof v[k] === 'number' && v[k] >= lo && v[k] <= hi)) errors.push(`videoRules.${k}: ${lo} sampai ${hi}.`);
    for (const k of ['brandBar', 'captions', 'noExclamation', 'noEmDash', 'requireDisclaimer']) if (b.videoRules[k] !== undefined && typeof b.videoRules[k] !== 'boolean') errors.push(`videoRules.${k} harus true atau false.`);
    if (b.videoRules.bannedPhrases !== undefined && (!Array.isArray(b.videoRules.bannedPhrases) || b.videoRules.bannedPhrases.some(x => typeof x !== 'string'))) errors.push('videoRules.bannedPhrases harus daftar frasa.');
    if (!errors.some(e => e.startsWith('videoRules.'))) {
      const z = videoZones(v);
      if (z.content.h < 860) errors.push(`Zona konten video hanya ${z.content.h} px tinggi (safeTop, safeBottom, dan brandBar). Minimal 860 px supaya tata letak adegan muat.`);
      if (z.content.w < 820) errors.push(`Zona konten video hanya ${z.content.w} px lebar (safeSide dan railWidth). Minimal 820 px.`);
      if (v.captionTop < z.bottom + 12) errors.push(`videoRules.captionTop ${v.captionTop} menimpa zona konten (berakhir di ${z.bottom}). Minimal ${z.bottom + 12}.`);
      if (v.captionBottom - v.captionTop < 140) errors.push('Pita subtitle (captionTop sampai captionBottom) minimal 140 px untuk dua baris.');
      if (v.maxSeconds > v.hardMaxSeconds) errors.push('videoRules.maxSeconds tidak boleh lebih dari hardMaxSeconds.');
      if (v.safeTop < 269 || v.safeBottom < 672 || v.safeSide < 65) warnings.push('Zona aman video lebih sempit dari panduan Meta (atas 14%, bawah 35%, samping 6%). Teks bisa tertutup tombol atau caption Instagram.');
    }
    if (videoRulesOf(b).requireDisclaimer && !b.disclaimer) errors.push('disclaimer wajib karena videoRules.requireDisclaimer aktif.');
  }
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
