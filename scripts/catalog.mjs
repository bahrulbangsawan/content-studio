#!/usr/bin/env node
// Build one page that shows every component, every variant and every motion preset in an account's
// colours, logo and font: <workspace>/catalog/<akun>.html. It is a local file, opened in a browser.
// Samples come from lib/samples.mjs and pass the same scan as a post before they are drawn.
// Usage: node catalog.mjs --brand <akun> [--root <workspace>]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseArgs, workspace, fail, loadIcons, esc, ENGINE_DIR } from './lib/common.mjs';
import { loadBrand, validateBrand } from './lib/brand.mjs';
import { COMPONENTS, roleOf } from './lib/components.mjs';
import { CUSTOM, CUSTOM_ISSUES, passOf, customCss } from './lib/custom.mjs';
import { MOTIONS } from './lib/motion.mjs';
import { scanPost } from './lib/rules.mjs';
import { renderSlide, brandCss, motionOf } from './lib/render.mjs';
import { sanitizeSvg } from './lib/svg.mjs';
import { sampleOf, MOTION_SAMPLE } from './lib/samples.mjs';
import { sampleMedia, mediaScripts, MEDIA_ATTACH } from './lib/media.mjs';
import { ART, artSvg } from './lib/art.mjs';
import { fingerprints } from './lock.mjs';

const args = parseArgs();
const root = workspace(args);
const id = args.brand || args._[0];
if (!id) fail('Pakai: node catalog.mjs --brand <akun>');

// Same engine check as build.mjs: the catalog shows exactly what posts will get.
const lock = JSON.parse(readFileSync(join(ENGINE_DIR, 'LOCK.json'), 'utf8')).files;
const now = fingerprints();
const changed = [...new Set([...Object.keys(lock), ...Object.keys(now)])].filter(f => lock[f] !== now[f]);
if (changed.length) fail(`Engine skill berubah di luar pembaruan resmi:\n  ${changed.join('\n  ')}`);

const { brand, dir, approved, intact, rules } = loadBrand(root, id);
const bv = validateBrand(brand, dir);
if (bv.errors.length) fail(`Akun ${id} belum valid:\n  ${bv.errors.join('\n  ')}`);

const icons = loadIcons();
const media = sampleMedia();
const ctx = {
  brand, rules, icons, media, mediaMode: 'ref',
  logoLight: sanitizeSvg(readFileSync(join(dir, brand.logo.light), 'utf8')).svg,
  logoDark: sanitizeSvg(readFileSync(join(dir, brand.logo.dark), 'utf8')).svg,
};
const fontFile = brand.font.file ? join(dir, brand.font.file) : join(ENGINE_DIR, 'fonts', 'inter-latin.woff2');
const family = brand.font.file ? brand.font.family : 'Inter';

/* ---------- Samples: every component and variant, checked like a post ---------- */
/* Custom components appear once they pass the component gate; the others are listed by name only */
const pending = Object.keys(CUSTOM).filter(k => !passOf(k).ok);
const shown = k => !CUSTOM[k] || !pending.includes(k);
const sample = (comp, extra = {}) => ({ name: COMPONENTS[comp].label.slice(0, 24), theme: 'light', component: comp, ...sampleOf(comp, extra.variant), ...extra });
const opener = sample('cover'), body = sample('statement'), closer = sample('closing');
function check(slide) {
  const role = roleOf(slide.component);
  const slides = role === 'open' ? [slide, body, closer] : role === 'close' ? [opener, body, slide] : [opener, slide, closer];
  const { errors } = scanPost({ brand: brand.id, slug: 'katalog', title: 'Katalog', slides }, brand, rules, icons, { unchecked: pending, layoutOnly: true });
  if (errors.length) fail(`Contoh ${slide.component}${slide.variant ? ` (${slide.variant})` : ''} tidak lolos scan:\n  ${errors.join('\n  ')}`);
}
const GROUPS = [
  { id: 'open', title: 'Pembuka', note: 'Hanya untuk slide pertama.' },
  { id: 'body', title: 'Isi', note: 'Untuk slide di antara pembuka dan penutup.' },
  { id: 'close', title: 'Penutup', note: 'Hanya untuk slide terakhir. Disclaimer dan handle muncul otomatis di footer.' },
];
const position = { open: [0, 8], body: [2, 8], close: [7, 8] };
let slideCount = 0;
const draw = (slide, theme) => {
  slideCount++;
  const [i, n] = position[roleOf(slide.component)];
  return renderSlide({ ...slide, theme }, i, n, ctx);
};
const pair = slide => `<div class="pair"><div class="sbox th-light">${draw(slide, 'light')}</div><div class="sbox th-dark">${draw(slide, 'dark')}</div></div>`;
const json = slide => { const { theme, ...rest } = slide; return esc(JSON.stringify(rest, null, 2)); };

let layouts = 0;
const blocks = GROUPS.map(g => {
  const comps = Object.keys(COMPONENTS).filter(k => roleOf(k) === g.id && shown(k));
  const html = comps.map(k => {
    const c = COMPONENTS[k];
    const variants = c.variants ? Object.entries(c.variants) : [[null, 'Satu tata letak']];
    const cards = variants.map(([v, desc]) => {
      const slide = sample(k, v ? { variant: v } : {});
      check(slide);
      layouts++;
      return `<figure class="card">${pair(slide)}<figcaption><span class="cap">${v ? `<code>${esc(v)}</code> ` : ''}${esc(desc)}</span><button type="button" class="play">Putar</button></figcaption><details><summary>Contoh post.json</summary><pre>${json(slide)}</pre></details></figure>`;
    }).join('\n');
    const motion = MOTIONS[motionOf({ component: k })];
    return `<article class="comp" id="c-${k}" data-find="${esc(`${k} ${c.label} ${c.visual} ${c.goal}`.toLowerCase())}">
<header class="comp-h"><h3><code>${k}</code> ${esc(c.label)}${c.custom ? ' <span class="tag">buatan</span>' : ''}</h3><p>${esc(c.visual)}. ${esc(c.goal)}</p><p class="meta">${esc(c.rule)} Gerak bawaan: ${motion ? esc(motion.label.toLowerCase()) : 'waktu asli komponen'}.</p></header>
<div class="cards">${cards}</div></article>`;
  }).join('\n');
  return { g, comps, html };
});

const motionCards = Object.entries(MOTIONS).map(([k, m]) => {
  const slide = sample(MOTION_SAMPLE, { motion: k });
  check(slide);
  return `<figure class="card mcard" data-find="${esc(`${k} ${m.label} ${m.desc}`.toLowerCase())}">${pair(slide)}<figcaption><span class="cap"><code>${k}</code> ${esc(m.label)}. ${esc(m.desc)}</span><button type="button" class="play">Putar</button></figcaption></figure>`;
}).join('\n');

/* Every illustration, in the account's colours on a light and a dark slide, moving as on a slide */
const artCards = Object.entries(ART).map(([k, a]) => `<figure class="acard" data-find="${esc(`${k} ${a.label} ${a.words}`.toLowerCase())}"><div class="apair"><div class="slide is-light is-active awrap">${artSvg(k, 'aill')}</div><div class="slide is-dark is-active awrap">${artSvg(k, 'aill')}</div></div><figcaption><code>${esc(k)}</code> ${esc(a.label)}<small>${esc(a.words)}</small></figcaption></figure>`).join('\n');

const toc = blocks.map(b => `<p class="toc-g">${b.g.title}</p>${b.comps.map(k => `<a href="#c-${k}"><code>${k}</code><span>${esc(COMPONENTS[k].label)}${CUSTOM[k] ? ', buatan' : ''}</span></a>`).join('')}`).join('') + '<p class="toc-g">Ilustrasi</p><a href="#ilustrasi"><code>art</code><span>Katalog ilustrasi</span></a><p class="toc-g">Gerak</p><a href="#gerak"><code>motion</code><span>Preset gerak</span></a>';
const slideCss = readFileSync(join(ENGINE_DIR, 'parts', '02-slides.css.html'), 'utf8').replace(/<\/?style[^>]*>/g, '').replace('@@COMP_CSS@@', customCss(Object.keys(CUSTOM).filter(shown)));
const fontB64 = readFileSync(fontFile).toString('base64');
const nComp = Object.keys(COMPONENTS).filter(shown).length, nMotion = Object.keys(MOTIONS).length;
const nCustom = Object.keys(CUSTOM).filter(shown).length;

const html = `<!doctype html>
<html lang="${esc(brand.language || 'id')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="content-studio">
<title>Katalog komponen, ${esc(brand.name)}</title>
<!-- Dibuat oleh content-studio/scripts/catalog.mjs. Jangan edit berkas ini: jalankan ulang skripnya. -->
<style>@font-face { font-family: "${esc(family)}"; font-style: normal; font-weight: 400 700; font-display: swap; src: url(data:font/woff2;base64,${fontB64}) format("woff2"); }</style>
<style>
:root {
  --font: "${esc(family)}", ui-sans-serif, system-ui, sans-serif;
  --ease: cubic-bezier(0.2, 0, 0, 1);
  --spring: cubic-bezier(0.22, 1, 0.36, 1);
  --t: 1;
  --w: 264px; --k: 0.24444;
  --ui-bg: #F3F3F1; --ui-fg: #17181A; --ui-muted: #5D6067; --ui-line: #D9DAD6; --ui-card: #FFFFFF;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root { --ui-bg: #121314; --ui-fg: #ECECEA; --ui-muted: #A3A6AC; --ui-line: #2C2E31; --ui-card: #1B1C1E; color-scheme: dark; }
}
* { box-sizing: border-box; }
html { scroll-padding-top: 76px; }
body { margin: 0; background: var(--ui-bg); color: var(--ui-fg); font: 400 14px/20px var(--font); }
.ic { width: 20px; height: 20px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.snap, .snap * { transition: none !important; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; }
.bar { position: sticky; top: 0; z-index: 5; display: flex; flex-wrap: wrap; align-items: center; gap: 10px 20px; padding: 12px 24px; background: var(--ui-bg); border-bottom: 1px solid var(--ui-line); }
.bar h1 { margin: 0; font-size: 16px; line-height: 22px; font-weight: 650; }
.bar .cat-count { color: var(--ui-muted); }
.ctl { display: flex; align-items: center; gap: 8px; color: var(--ui-muted); }
.seg { display: inline-flex; border: 1px solid var(--ui-line); border-radius: 6px; overflow: hidden; background: var(--ui-card); }
.seg label { position: relative; cursor: pointer; }
.seg input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.seg span { display: block; padding: 5px 10px; color: var(--ui-fg); }
.seg label + label span { border-left: 1px solid var(--ui-line); }
.seg input:checked + span { background: var(--ui-fg); color: var(--ui-bg); }
.seg input:focus-visible + span { outline: 2px solid var(--ui-fg); outline-offset: -4px; }
.btn { height: 30px; padding: 0 12px; border: 1px solid var(--ui-line); border-radius: 6px; background: var(--ui-card); color: var(--ui-fg); font: inherit; cursor: pointer; }
.btn:hover { border-color: var(--ui-muted); }
.find { width: 220px; height: 30px; padding: 0 10px; border: 1px solid var(--ui-line); border-radius: 6px; background: var(--ui-card); color: var(--ui-fg); font: inherit; }
.wrap { display: grid; grid-template-columns: 220px minmax(0, 1fr); }
.toc { position: sticky; top: 57px; align-self: start; max-height: calc(100vh - 57px); overflow: auto; padding: 16px 12px 32px 24px; border-right: 1px solid var(--ui-line); }
.toc-g { margin: 16px 0 4px; font-size: 12px; font-weight: 650; color: var(--ui-muted); }
.toc-g:first-child { margin-top: 0; }
.toc a { display: flex; align-items: baseline; gap: 8px; padding: 3px 6px; border-radius: 4px; color: inherit; text-decoration: none; }
.toc a:hover { background: var(--ui-card); }
.toc a span { color: var(--ui-muted); font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
main { padding: 24px 24px 64px; min-width: 0; }
.intro { max-width: 72ch; margin: 0 0 8px; color: var(--ui-muted); }
.grp { margin: 40px 0 0; padding-top: 16px; border-top: 1px solid var(--ui-line); }
.grp > h2 { margin: 0; font-size: 20px; line-height: 28px; font-weight: 650; }
.grp > p { margin: 2px 0 0; color: var(--ui-muted); }
.comp { margin-top: 32px; }
.comp-h h3 { margin: 0; font-size: 16px; line-height: 22px; font-weight: 650; }
.comp-h h3 code { font-size: 14px; margin-right: 6px; }
.comp-h p { margin: 2px 0 0; max-width: 80ch; }
.comp-h .meta { color: var(--ui-muted); }
.tag { margin-left: 6px; padding: 1px 6px; border: 1px solid var(--ui-line); border-radius: 4px; font-size: 12px; font-weight: 500; color: var(--ui-muted); vertical-align: 2px; }
.cards { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 12px; }
.card { margin: 0; display: flex; flex-direction: column; gap: 8px; padding: 10px; border: 1px solid var(--ui-line); border-radius: 8px; background: var(--ui-card); }
.pair { display: flex; gap: 8px; }
.sbox { cursor: pointer; }
.t-light .th-dark, .t-dark .th-light { display: none; }
figcaption { display: flex; align-items: center; justify-content: space-between; gap: 12px; max-width: calc(var(--w) * 2 + 8px); }
.t-light figcaption, .t-dark figcaption { max-width: var(--w); }
.cap code { padding: 1px 5px; border-radius: 4px; background: var(--ui-bg); }
.play { flex: none; height: 26px; padding: 0 10px; border: 1px solid var(--ui-line); border-radius: 6px; background: transparent; color: var(--ui-fg); font: inherit; font-size: 12.5px; cursor: pointer; }
details { max-width: calc(var(--w) * 2 + 8px); color: var(--ui-muted); }
.t-light details, .t-dark details { max-width: var(--w); }
summary { cursor: pointer; font-size: 12.5px; }
pre { margin: 6px 0 0; padding: 10px; max-height: 260px; overflow: auto; border-radius: 6px; background: var(--ui-bg); color: var(--ui-fg); font: 12px/17px ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; }
.hide { display: none !important; }
.agrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(232px, 1fr)); gap: 12px; margin-top: 12px; }
.acard { margin: 0; display: flex; flex-direction: column; gap: 6px; padding: 8px; border: 1px solid var(--ui-line); border-radius: 8px; background: var(--ui-card); }
.apair { display: flex; gap: 4px; }
.awrap { width: auto !important; height: auto !important; flex: 1; aspect-ratio: 1; display: grid; place-items: center; border-radius: 4px; }
.aill { width: 86%; height: 86%; }
.acard figcaption { display: block; font-size: 12.5px; }
.acard small { display: block; color: var(--ui-muted); font-size: 11.5px; line-height: 15px; }
/* Slide frame: the post slide drawn at the chosen size */
.slide { position: relative; width: var(--w); height: calc(var(--w) * 1.25); overflow: hidden; background: var(--s-bg); border-radius: 4px; }
.st-dot { display: none; }
@media (max-width: 900px) {
  .wrap { grid-template-columns: 1fr; }
  .toc { display: none; }
  .bar { position: static; padding: 10px 16px; }
  main { padding: 16px 16px 48px; }
  .find { width: 100%; }
}
@media (max-width: 600px) {
  :root { --w: 156px; --k: 0.14444; }
  .card { max-width: 100%; padding: 8px; }
  .pair { flex-wrap: wrap; }
}
@media (prefers-reduced-motion: reduce) { .play { display: none; } }
</style>
<style id="brandCss">${brandCss(brand)}</style>
<style id="slideCss">${slideCss}</style>
</head>
<body class="motion t-both">
<header class="bar">
  <h1>Katalog komponen, ${esc(brand.name)}</h1>
  <span class="cat-count">${nComp} komponen${nCustom ? ` (${nCustom} buatan)` : ''}, ${layouts} tata letak, ${nMotion} preset gerak</span>
  <div class="ctl" role="radiogroup" aria-label="Tema slide">Tema
    <span class="seg"><label><input type="radio" name="theme" value="both" checked><span>Keduanya</span></label><label><input type="radio" name="theme" value="light"><span>Terang</span></label><label><input type="radio" name="theme" value="dark"><span>Gelap</span></label></span>
  </div>
  <div class="ctl" role="radiogroup" aria-label="Ukuran slide">Ukuran
    <span class="seg"><label><input type="radio" name="size" value="200"><span>Kecil</span></label><label><input type="radio" name="size" value="264" checked><span>Sedang</span></label><label><input type="radio" name="size" value="400"><span>Besar</span></label></span>
  </div>
  <button type="button" class="btn" id="playAll">Putar semua gerak</button>
  <input type="search" class="find" id="find" placeholder="Cari komponen, ilustrasi, atau gerak" aria-label="Cari komponen, ilustrasi, atau gerak">
</header>
<div class="wrap">
<nav class="toc" aria-label="Daftar komponen">${toc}</nav>
<main>
<p class="intro">Semua slide di halaman ini dirender oleh engine yang sama dengan halaman post, dengan warna, logo, dan font akun ${esc(brand.name)}. Isinya contoh. Komponen, varian, dan preset di halaman ini yang dipakai di post.json. Komponen bertanda buatan dibuat lewat gerbang komponen (component.mjs) dan lolos pemeriksaan yang sama dengan komponen inti: pakai ulang, design system, pola AI, dan kerapian. Klik slide atau tombol Putar untuk melihat gerak masuknya.</p>${pending.length ? `\n<p class="intro">Belum lolos gerbang, belum tampil: ${pending.map(k => `<code>${esc(k)}</code>`).join(', ')}.</p>` : ''}
${blocks.map(b => `<section class="grp" id="g-${b.g.id}"><h2>${b.g.title}</h2><p>${esc(b.g.note)}</p>${b.html}</section>`).join('\n')}
<section class="grp" id="ilustrasi"><h2>Ilustrasi</h2><p>${Object.keys(ART).length} ilustrasi untuk field <code>art</code>. Setiap slide wajib punya gambar: komponen bergambar (diagram, grafik, ikon, foto) atau satu ilustrasi yang mendukung isinya, misalnya <code>clock</code> untuk menit. Warnanya mengikuti akun dan tampil sama di slide terang dan gelap.</p>
<div class="agrid">${artCards}</div></section>
<section class="grp" id="gerak"><h2>Preset gerak</h2><p>Isi <code>motion</code> di slide mana pun untuk mengganti gerak bawaan komponennya. Contoh di bawah memakai komponen <code>${MOTION_SAMPLE}</code>. Semua preset diam sebelum 1,2 detik dan ikut terekam di MP4.</p>
<div class="cards">${motionCards}</div></section>
</main>
</div>
${mediaScripts(media)}
<script>
${MEDIA_ATTACH}
(() => {
  const body = document.body;
  document.querySelectorAll('[data-m]').forEach(el => {
    if (el.dataset.dur) el.style.setProperty('--dur', el.dataset.dur + 'ms');
    el.classList.add('is-in');
  });
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function play(scope) {
    if (reduce.matches) return;
    scope.querySelectorAll('.slide').forEach(slide => {
      const els = slide.querySelectorAll('[data-m]');
      slide.classList.add('snap');
      els.forEach(e => e.classList.remove('is-in'));
      void slide.offsetWidth;
      slide.classList.remove('snap');
      els.forEach(e => setTimeout(() => e.classList.add('is-in'), Number(e.dataset.d || 0)));
    });
  }
  document.querySelectorAll('.card').forEach(card => {
    card.querySelector('.play').addEventListener('click', () => play(card));
    card.querySelectorAll('.sbox').forEach(b => b.addEventListener('click', () => play(card)));
  });
  document.querySelectorAll('.mcard').forEach(card => card.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') play(card); }));
  document.getElementById('playAll').addEventListener('click', () => document.querySelectorAll('.card:not(.hide)').forEach(play));
  document.querySelectorAll('input[name="theme"]').forEach(r => r.addEventListener('change', () => {
    body.classList.remove('t-both', 't-light', 't-dark');
    body.classList.add('t-' + r.value);
  }));
  document.querySelectorAll('input[name="size"]').forEach(r => r.addEventListener('change', () => {
    const w = Number(r.value);
    document.documentElement.style.setProperty('--w', w + 'px');
    document.documentElement.style.setProperty('--k', (w / 1080).toFixed(5));
  }));
  document.getElementById('find').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll('.comp, .mcard, .acard').forEach(el => el.classList.toggle('hide', !!q && !el.dataset.find.includes(q)));
    document.querySelectorAll('.grp').forEach(g => g.classList.toggle('hide', !!q && !g.querySelector('.comp:not(.hide), .mcard:not(.hide), .acard:not(.hide)')));
  });
})();
</script>
</body>
</html>
`;

const outDir = join(root, 'catalog');
mkdirSync(outDir, { recursive: true });
const out = join(outDir, `${brand.id}.html`);
writeFileSync(out, html);
console.log(`✓ Katalog dibuat: ${relative(process.cwd(), out)} (${Math.round(Buffer.byteLength(html) / 1024)} KB, ${slideCount} slide)`);
console.log(`  ${nComp} komponen${nCustom ? ` (${nCustom} buatan)` : ''}, ${layouts} tata letak, ${nMotion} preset gerak, tema terang dan gelap.`);
if (pending.length) console.log(`  Belum lolos gerbang, tidak ditampilkan: ${pending.join(', ')}. Jalankan component.mjs check --id <id>.`);
for (const why of Object.values(CUSTOM_ISSUES)) console.log(`  ! ${why}`);
if (!approved || !intact) console.log(`  Catatan: akun ${brand.id} ${!approved ? 'belum disetujui' : 'berubah sejak disetujui'}. Katalog tetap dibuat untuk pratinjau; build post tetap menolak sampai akun disetujui.`);
console.log(`  Buka: open ${relative(process.cwd(), out)}\n`);
