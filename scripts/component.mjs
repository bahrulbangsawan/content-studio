#!/usr/bin/env node
// Components beyond the core catalog. A new component is a single file, <workspace>/components/<id>.mjs,
// and may be used in posts only after it passes the gate: the reuse check, the design system and
// AI-pattern rules, and measured polish (padding, spacing, no offside text, no broken words) on its
// own sample and on worst-case content, in every variant, light and dark. See references/authoring.md.
//
//   node component.mjs list                         every component with its fields, to look for reuse
//   node component.mjs new --id <id> [--role open|close]   write a starting file
//   node component.mjs check --id <id> [--brand <akun>]    run the gate; on pass, record it
//   node component.mjs audit [--id a,b] [--sheets]  run the browser checks on core components
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { parseArgs, workspace, fail, loadIcons, esc, sha256, ENGINE_DIR } from './lib/common.mjs';
import { loadBrand } from './lib/brand.mjs';
import { COMPONENTS, roleOf } from './lib/components.mjs';
import { CUSTOM, CUSTOM_ISSUES, CUSTOM_DIR, ID, fileOf, passFileOf, passOf, engineStamp, customCss } from './lib/custom.mjs';
import { MOTION_NAMES, MOTIONS } from './lib/motion.mjs';
import { renderSlide, brandCss } from './lib/render.mjs';
import { scanPost } from './lib/rules.mjs';
import { sanitizeSvg } from './lib/svg.mjs';
import { sampleOf } from './lib/samples.mjs';
import { sampleMedia, mediaScripts, MEDIA_ATTACH } from './lib/media.mjs';
import { checkSample, stressCase } from './lib/stress.mjs';
import { checkDefinition, checkReuse, lintCss, lintMarkup, motionEnd, LIMIT_MS } from './lib/gate.mjs';
import { pageChecks } from './lib/gate-browser.mjs';
import { findChrome, launch, sleep } from './lib/chrome.mjs';
import { fingerprints } from './lock.mjs';

const args = parseArgs();
const cmd = args._[0];
const root = workspace(args);
const line = '─'.repeat(64);
const CASES = [['contoh', 'contoh isi'], ['terpanjang', 'teks dan butir terbanyak'], ['tersingkat', 'butir dan teks paling sedikit'], ['kata-panjang', 'kata panjang']];
/* Core components whose numbers mark a real sequence or a value */
const CORE_ORDERED = ['steps', 'numbered', 'timeline', 'bignumber', 'stat', 'teaser', 'pins', 'exercise', 'bars'];

/* ---------------- Field descriptions, shared by list and README ---------------- */
function describe(spec) {
  const lim = s => [typeof s.words === 'number' ? `${s.words} kata` : s.words ? `judul (${s.words})` : '', s.chars ? `${s.chars} karakter` : ''].filter(Boolean).join(', ');
  switch (spec.type) {
    case 'text':
      if (spec.numeral) return `angka singkat (${spec.chars} karakter)`;
      if (spec.within) return `frasa yang disalin persis dari ${spec.within} (${lim(spec)})`;
      return `teks${spec.required ? '' : ' opsional'} (${lim(spec)}${spec.wordChars ? `, kata maksimal ${spec.wordChars} huruf` : ''})`;
    case 'icon': return 'ikon dari katalog';
    case 'art': return 'ilustrasi dari katalog (art.mjs)';
    case 'enum': return `pilihan: ${spec.values.join(', ')}`;
    case 'bool': return 'true atau false';
    case 'number': return `angka bulat ${spec.min} sampai ${spec.max}`;
    case 'media': return `${spec.kinds.length > 1 ? 'foto atau video' : spec.kinds[0] === 'image' ? 'foto' : 'video'}${spec.required ? '' : ' opsional'} dari media/ { src, alt, focus? }`;
    case 'list': return `daftar ${spec.min === spec.max ? spec.min : `${spec.min} sampai ${spec.max}`} butir, tiap butir ${describe(spec.item)}`;
    case 'object': return `{ ${Object.entries(spec.fields).map(([k, f]) => `${k}: ${describe(f)}`).join('; ')} }`;
  }
  return spec.type;
}
const fieldLines = c => Object.entries(c.keys).filter(([k]) => k !== 'variant').map(([k, s]) => `${k}: ${describe(s)}${s.for ? ` (hanya varian ${s.for.join(', ')})` : ''}`);

/* ---------------- list ---------------- */
if (cmd === 'list') {
  const groups = [['open', 'Pembuka'], ['body', 'Isi'], ['close', 'Penutup']];
  for (const [role, name] of groups) {
    console.log(`\n${name}\n${line}`);
    for (const [k, c] of Object.entries(COMPONENTS).filter(([k]) => roleOf(k) === role)) {
      console.log(`  ${k}${c.custom ? ' (buatan)' : ''}: ${c.label}. ${c.visual}. ${c.goal}`);
      if (c.variants) console.log(`      varian: ${Object.entries(c.variants).map(([v, d]) => `${v} (${d.toLowerCase()})`).join(', ')}`);
      console.log(`      ${fieldLines(c).join('\n      ')}`);
    }
  }
  for (const [id, why] of Object.entries(CUSTOM_ISSUES)) console.log(`\n  ! ${why}`);
  console.log(`\nLihat semuanya dalam warna akun: node catalog.mjs --brand <akun>\n`);
  process.exit(0);
}

/* ---------------- new ---------------- */
if (cmd === 'new') {
  const id = args.id;
  if (!id || !ID.test(id)) fail('Pakai: node component.mjs new --id <id>. id: huruf kecil dan angka, 3 sampai 24 karakter, diawali huruf.');
  if (COMPONENTS[id] && !COMPONENTS[id].custom) fail(`"${id}" sudah dipakai komponen inti.`);
  if (existsSync(fileOf(id))) fail(`components/${id}.mjs sudah ada. Edit berkas itu, lalu jalankan check.`);
  const role = ['open', 'close'].includes(args.role) ? args.role : undefined;
  mkdirSync(CUSTOM_DIR, { recursive: true });
  const close = role === 'close';
  writeFileSync(fileOf(id), `// TODO nama: satu kalimat tentang bentuk yang digambar komponen ini.
// Komponen buatan content-studio. Aturan dan bahan: references/authoring.md. Periksa: node component.mjs check --id ${id}
// Engine memanggil fungsi ini dengan kit design system, jadi berkas ini tidak bergantung pada letak skill.
export default kit => {
  const { title, text, list, obj, icon, variant, budget, esc, M, DRAW, iconSvg${close ? ', cta' : ''}, note } = kit;
  return {
  id: '${id}',
  label: 'TODO nama singkat',${role ? `\n  role: '${role}',` : ''}
  motion: 'rise',
  visual: 'TODO bentuk visualnya dalam satu kalimat',
  goal: 'TODO bentuk isi yang dibawanya',
  spec: 'TODO ukuran utama, misalnya kartu radius 20, teks 36/46',
  rule: 'TODO aturan pakainya dalam satu kalimat',
  reuse: {
    need: 'TODO bentuk isi yang tidak bisa dibawa komponen yang ada, dalam satu kalimat.',
    /* check menyebut komponen terdekat yang wajib dibahas di sini, masing-masing dengan alasannya */
    checked: {},
  },
  keys: {
    title: title(),
    items: list(2, 4, text(6, 40)),
    note: text(12, 80),${close ? `\n    cta: obj({ icon: icon(), text: text(7, 44, true) }),` : ''}
  },
  sample: {
    title: 'TODO judul contoh',
    items: ['TODO butir pertama', 'TODO butir kedua'],${close ? `\n    cta: { icon: 'send', text: 'TODO ajakan' },` : ''}
  },
  render(s, ctx) {
    const items = s.items.map((t, k) => \`<p class="ds-item ${id}-item"\${M('item', \`Butir \${k + 1}\`)}>\${esc(t)}</p>\`).join('');
    return \`<div class="ds-main ds-stack ${id}-list">\${items}</div>\${note(s)}${close ? '${cta(s.cta, ctx)}' : ''}\`;
  },
  css: \`
.x-${id} .${id}-list { --gap: 20px; }
\`,
  };
};
`);
  console.log(`✓ Dibuat: ${relative(process.cwd(), fileOf(id))}\n  Ganti setiap TODO, susun tata letaknya dari kit, lalu jalankan: node component.mjs check --id ${id}\n`);
  process.exit(0);
}

if (cmd !== 'check' && cmd !== 'audit') fail('Pakai: node component.mjs list | new --id <id> | check --id <id> [--brand <akun>] | audit [--id a,b]');

/* ---------------- shared: engine, brand, rendering ---------------- */
const lock = JSON.parse(readFileSync(join(ENGINE_DIR, 'LOCK.json'), 'utf8')).files;
const now = fingerprints();
const changed = [...new Set([...Object.keys(lock), ...Object.keys(now)])].filter(f => lock[f] !== now[f]);
if (changed.length) fail(`Engine skill berubah di luar pembaruan resmi:\n  ${changed.join('\n  ')}\nKomponen buatan ditulis di components/, bukan di engine.`);

const brandsDir = join(root, 'brands');
const brandIds = args.brand ? [args.brand] : existsSync(brandsDir) ? readdirSync(brandsDir).filter(d => existsSync(join(brandsDir, d, 'brand.json'))) : [];
if (!brandIds.length) fail('Belum ada akun di workspace ini. Gerbang memeriksa komponen dalam warna dan font akun; siapkan akun dulu (brand.mjs init) atau pakai --root.');
const icons = loadIcons();
const media = sampleMedia();
const accounts = brandIds.map(bid => {
  const { brand, dir, rules } = loadBrand(root, bid);
  return {
    brand, rules,
    ctx: { brand, rules, icons, media, mediaMode: 'ref', logoLight: sanitizeSvg(readFileSync(join(dir, brand.logo.light), 'utf8')).svg, logoDark: sanitizeSvg(readFileSync(join(dir, brand.logo.dark), 'utf8')).svg },
    family: brand.font.file ? brand.font.family : 'Inter',
    font: readFileSync(brand.font.file ? join(dir, brand.font.file) : join(ENGINE_DIR, 'fonts', 'inter-latin.woff2')).toString('base64'),
  };
});
const position = { open: [0, 8], body: [2, 8], close: [7, 8] };
const draw = (slide, theme, ctx) => { const [i, n] = position[roleOf(slide.component)]; return renderSlide({ ...slide, theme }, i, n, ctx); };
const bodyOf = html => (html.match(/<div class="content">([\s\S]*)<\/div><div class="zone z-foot/) || [, ''])[1];
const slideCss = readFileSync(join(ENGINE_DIR, 'parts', '02-slides.css.html'), 'utf8').replace(/<\/?style[^>]*>/g, '');

/** The cases of one component: its sample and three stress cases, for every variant. */
function casesOf(id, acc) {
  const c = COMPONENTS[id];
  const variants = c.variants ? Object.keys(c.variants) : [null];
  const out = [], problems = [];
  for (const v of variants) {
    for (const [key] of CASES) {
      let slide;
      if (key === 'contoh') {
        const sample = sampleOf(id, v);
        slide = { name: 'Contoh', theme: 'light', component: id, ...sample, ...(v ? { variant: v } : {}) };
        const errs = checkSample(id, sample, v, acc.ctx);
        if (errs.length) problems.push(`Contoh${v ? ` (varian ${v})` : ''} tidak lolos scan: ${errs.join(' | ')}`);
      } else {
        const r = stressCase(id, key === 'terpanjang' ? 'max' : key === 'tersingkat' ? 'short' : 'long', v, acc.ctx);
        if (!r.slide) { problems.push(`Isi uji ${key}${v ? ` (varian ${v})` : ''} tidak bisa dibuat dari batas field: ${r.errors.join(' | ')}. Selaraskan words, chars, budget, dan validate.`); continue; }
        slide = r.slide;
      }
      out.push({ key, variant: v, slide });
    }
  }
  return { out, problems };
}

/** How often each text appears in a slide's content, to tell repeated content from repeated labels. */
function textCounts(slide) {
  const out = {};
  const walk = v => { if (typeof v === 'string') { const k = v.trim().toLowerCase(); out[k] = (out[k] || 0) + 1; } else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
  const { name, theme, component, variant, motion, goal, ...content } = slide;
  walk(content);
  return out;
}

function stagePage(acc, groups, strictIds, orderedIds) {
  const css = slideCss.replace('@@COMP_CSS@@', customCss(Object.keys(CUSTOM)));
  const rows = groups.map(g => `<section class="sheet" data-sheet="${esc(g.name)}"><h2>${esc(g.title)}</h2>${g.cases.map(c => `<div class="row"><p class="cap">${esc(c.key)}${c.variant ? `, varian ${esc(c.variant)}` : ''}</p><div class="pair">${['light', 'dark'].map(th => draw(c.slide, th, acc.ctx).replace('<section class="slide', `<section data-case="${esc(c.key)}" data-variant="${esc(c.variant || '')}" data-theme="${th}" data-comp="${c.slide.component}" data-strict="${strictIds.includes(c.slide.component) ? 1 : 0}" data-texts="${esc(JSON.stringify(textCounts(c.slide)))}" class="slide`)).join('')}</div></div>`).join('')}</section>`).join('');
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Gerbang komponen</title>
<style>@font-face { font-family: "${esc(acc.family)}"; font-style: normal; font-weight: 400 700; src: url(data:font/woff2;base64,${acc.font}) format("woff2"); }
:root { --font: "${esc(acc.family)}", ui-sans-serif, system-ui, sans-serif; --ease: cubic-bezier(0.2, 0, 0, 1); --spring: cubic-bezier(0.22, 1, 0.36, 1); --t: 1; --k: 1; }
body { margin: 0; background: #E6E6E2; color: #17181A; font: 400 28px/36px var(--font); }
.ic { width: 20px; height: 20px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.sheet { padding: 48px 80px 8px; }
.sheet > h2 { margin: 0 0 24px; font-size: 44px; line-height: 52px; }
.row { margin-bottom: 72px; }
.row > .cap { margin: 0 0 16px; font-size: 32px; line-height: 40px; font-weight: 650; }
.pair { display: flex; gap: 120px; }
.slide { position: relative; flex: none; width: 1080px; height: 1350px; overflow: visible; background: var(--s-bg); }
.st-dot { display: none; }
.gate-mark { position: absolute; z-index: 50; box-sizing: border-box; border: 6px solid #E5484D; border-radius: 8px; pointer-events: none; }
.gate-mark.is-warn { border: 5px dashed #E8A317; }
</style>
<style id="brandCss">${brandCss(acc.brand)}</style>
<style id="slideCss">${css}</style>
</head><body>${rows}${mediaScripts(media)}<script>document.querySelectorAll('[data-m]').forEach(e => e.classList.add('is-in'));${MEDIA_ATTACH}</script></body></html>`;
}

/** Render, measure and photograph every case in Chrome. Returns findings and sheet paths. */
async function measure(groups, strictIds, orderedIds, outDir, sheets) {
  const chromePath = findChrome();
  if (!chromePath) fail('Chrome, Chromium, atau Edge tidak ditemukan. Gerbang komponen butuh browser untuk mengukur tata letak. Pasang salah satunya atau set CHROME_PATH.', 2);
  mkdirSync(outDir, { recursive: true });
  const results = [];
  const browser = await launch(chromePath, { width: 2600, height: 1500 });
  try {
    for (const acc of accounts) {
      const file = join(outDir, `halaman-${acc.brand.id}.html`);
      writeFileSync(file, stagePage(acc, groups, strictIds, orderedIds));
      await browser.open(file, 'document.fonts.status === "loaded" && document.readyState === "complete" && window.__mediaReady === true', 30000);
      await sleep(300);
      const findings = await browser.evalJs(`(${pageChecks.toString()})(${JSON.stringify({ minText: acc.rules.minTextPx, ordered: orderedIds })})`);
      const meta = await browser.evalJs(`[...document.querySelectorAll('.slide[data-case]')].map(s => ({ case: s.dataset.case, variant: s.dataset.variant, theme: s.dataset.theme, comp: s.dataset.comp }))`);
      const shots = [];
      if (sheets) {
        const boxes = await browser.evalJs(`[...document.querySelectorAll('.sheet')].map(s => { const r = s.getBoundingClientRect(); return { name: s.dataset.sheet, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; })`);
        for (const b of boxes) {
          const r = await browser.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 0.3 } });
          const p = join(outDir, `${b.name}${accounts.length > 1 ? `-${acc.brand.id}` : ''}.png`);
          writeFileSync(p, Buffer.from(r.result.data, 'base64'));
          shots.push(p);
        }
      }
      results.push({ acc, findings: findings.map(f => ({ ...f, ...meta[f.slide] })), shots, logs: browser.logs.splice(0) });
    }
  } finally { await browser.close(); }
  return results;
}

/** Findings grouped by message, with the cases where they appear. */
function summarize(findings) {
  const by = new Map();
  for (const f of findings) {
    const k = `${f.level}|${f.comp}|${f.code}|${f.msg}`;
    if (!by.has(k)) by.set(k, { ...f, where: new Set() });
    by.get(k).where.add(`${f.case}${f.variant ? `/${f.variant}` : ''}/${f.theme === 'light' ? 'terang' : 'gelap'}`);
  }
  return [...by.values()];
}

/* ---------------- audit ---------------- */
if (cmd === 'audit') {
  const ids = args.id ? String(args.id).split(',') : Object.keys(COMPONENTS);
  for (const id of ids) if (!COMPONENTS[id]) fail(`Komponen "${id}" tidak ada.`);
  const acc0 = accounts[0];
  const groups = [], problems = [];
  for (const id of ids) {
    const c = COMPONENTS[id];
    const { out, problems: p } = casesOf(id, acc0);
    p.forEach(x => problems.push(`${id}: ${x}`));
    const variants = c.variants ? Object.keys(c.variants) : [null];
    for (const v of variants) groups.push({ name: `${id}${v ? `-${v}` : ''}`, title: `${id}${v ? `, varian ${v}` : ''}`, cases: out.filter(x => x.variant === v) });
  }
  for (const id of ids) if (COMPONENTS[id].motion && !MOTIONS[COMPONENTS[id].motion]) problems.push(`${id}: gerak bawaan "${COMPONENTS[id].motion}" tidak ada di preset gerak.`);
  const outDir = join(root, 'checks', '_audit');
  const res = await measure(groups, ids.filter(i => COMPONENTS[i].custom), [...CORE_ORDERED, ...Object.keys(CUSTOM).filter(i => CUSTOM[i].ordered)], outDir, !!args.sheets);
  console.log(`\nAudit komponen di browser (${ids.length} komponen)\n${line}`);
  problems.forEach(p => console.log(`  ✗ ${p}`));
  let nErr = problems.length;
  for (const r of res) {
    const sum = summarize(r.findings);
    for (const id of ids) {
      const mine = sum.filter(s => s.comp === id);
      const e = mine.filter(s => s.level === 'error').length, w = mine.length - e;
      nErr += e;
      console.log(`  ${e ? '✗' : w ? '!' : '✓'} ${id}${e || w ? `: ${e} galat, ${w} peringatan` : ''}`);
      for (const s of mine) console.log(`      ${s.level === 'error' ? '✗' : '!'} ${s.msg}  [${[...s.where].slice(0, 4).join(', ')}${s.where.size > 4 ? `, +${s.where.size - 4}` : ''}]`);
    }
    if (r.shots.length) console.log(`\n  Lembar: ${relative(process.cwd(), outDir)}/`);
    r.logs.forEach(l => console.log(`  konsol: ${l}`));
  }
  console.log(`${line}\n${nErr ? `${nErr} galat.` : 'Semua komponen lolos pemeriksaan browser.'}\n`);
  process.exit(nErr ? 1 : 0);
}

/* ---------------- check ---------------- */
const id = args.id;
if (!id) fail('Pakai: node component.mjs check --id <id> [--brand <akun>]');
if (!existsSync(fileOf(id))) fail(`components/${id}.mjs tidak ada. Mulai dengan: node component.mjs new --id ${id}`);
if (CUSTOM_ISSUES[id]) fail(CUSTOM_ISSUES[id]);
const def = CUSTOM[id];
const sections = [];
const section = (title, errors, warnings = [], extra = []) => sections.push({ title, errors, warnings, extra });

const d = checkDefinition(def, id);
section('Definisi', d.errors, d.warnings);
const ru = checkReuse(def, id);
section('Pakai ulang', ru.errors, ru.warnings, [`Komponen terdekat: ${ru.near.map(n => `${n.id} ${Math.round(n.score * 100)}%`).join(', ')}`]);
section('CSS terhadap design system', lintCss(def.css, def, id));

const acc0 = accounts[0];
const { out: cases, problems } = casesOf(id, acc0);
section('Contoh dan isi uji', problems);

/* Markup on every case, plus an escape probe: text must never become markup */
const markup = new Set();
for (const c of cases) lintMarkup(bodyOf(draw(c.slide, 'light', acc0.ctx)), def, id).forEach(e => markup.add(e));
const probe = JSON.parse(JSON.stringify(def.sample || {}), (k, v) => (typeof v === 'string' && k !== 'icon' && v.length >= 9 && !/^[a-z-]+$/.test(v) ? `A<b>x</b>${v.slice(9)}` : v));
try {
  if (bodyOf(draw({ name: 'Uji', component: id, ...probe }, 'light', acc0.ctx)).includes('<b>x</b>')) markup.add('Teks isi masuk ke markup tanpa esc(). Bungkus setiap teks dari post.json dengan esc() atau T().');
} catch (e) { markup.add(`render gagal: ${e.message}`); }
section('Markup', [...markup]);

const late = [];
for (const m of MOTION_NAMES) {
  try {
    const end = motionEnd(bodyOf(draw({ name: 'Uji', component: id, ...def.sample, motion: m }, 'light', acc0.ctx)));
    if (end > LIMIT_MS) late.push(`Dengan gerak ${m}, elemen terakhir diam di ${end} ms (batas ${LIMIT_MS}).`);
  } catch (e) { late.push(`render gagal dengan gerak ${m}: ${e.message}`); break; }
}
section('Gerak masuk', late);

const staticErrors = sections.reduce((n, s) => n + s.errors.length, 0);
let browserErrors = 0, results = [];
const outDir = join(root, 'checks', id);
if (cases.length && !sections.find(s => s.title === 'Markup').errors.some(e => e.startsWith('render gagal'))) {
  const variants = def.variants ? Object.keys(def.variants) : [null];
  const groups = variants.map(v => ({ name: `lembar${v ? `-${v}` : ''}`, title: `${id}${v ? `, varian ${v}` : ''}`, cases: cases.filter(c => c.variant === v) }));
  results = await measure(groups, [id], def.ordered ? [id] : [], outDir, true);
  for (const r of results) {
    const sum = summarize(r.findings);
    const errs = sum.filter(s => s.level === 'error'), warns = sum.filter(s => s.level !== 'error');
    browserErrors += errs.length;
    const fmt = s => `${s.msg}  [${[...s.where].slice(0, 4).join(', ')}${s.where.size > 4 ? `, +${s.where.size - 4}` : ''}]`;
    section(`Di browser, akun ${r.acc.brand.id}`, errs.map(fmt), warns.map(fmt), r.logs.map(l => `konsol: ${l}`));
  }
}

console.log(`\nGerbang komponen: components/${id}.mjs\n${line}`);
for (const s of sections) {
  console.log(`  ${s.errors.length ? '✗' : s.warnings.length ? '!' : '✓'} ${s.title}`);
  s.errors.forEach(e => console.log(`      ✗ ${e}`));
  s.warnings.forEach(w => console.log(`      ! ${w}`));
  s.extra.forEach(x => console.log(`      ${x}`));
}
const shots = results.flatMap(r => r.shots);
if (shots.length) console.log(`\n  Lembar uji (kotak merah galat, kotak kuning putus-putus peringatan):\n    ${shots.map(p => relative(process.cwd(), p)).join('\n    ')}`);
const total = staticErrors + browserErrors;
if (total) {
  console.log(`${line}\n✗ ${total} galat. Perbaiki components/${id}.mjs lalu jalankan check lagi. Lihat juga lembar ujinya.\n`);
  process.exit(1);
}

/* Pass: record the file and engine it was checked against, and refresh the README of custom components */
const warnings = sections.flatMap(s => s.warnings);
writeFileSync(passFileOf(id), JSON.stringify({ id, file: sha256(readFileSync(fileOf(id))), engine: engineStamp(), brands: brandIds, cases: cases.length * 2, warnings, checkedAt: new Date().toISOString() }, null, 1) + '\n');
writeReadme();
console.log(`${line}\n✓ ${id} lolos gerbang${warnings.length ? ` dengan ${warnings.length} peringatan` : ''}. Lihat lembar ujinya sebelum dipakai.`);
console.log(`  Komponen ini sekarang bisa dipakai di post.json ("component": "${id}") dan muncul di katalog (catalog.mjs).`);
const postsDir = join(root, 'posts');
if (existsSync(postsDir)) {
  for (const slug of readdirSync(postsDir)) {
    const pj = join(postsDir, slug, 'post.json');
    if (!existsSync(pj)) continue;
    const post = JSON.parse(readFileSync(pj, 'utf8'));
    if (!(post.slides || []).some(s => s.component === id)) continue;
    const acc = accounts.find(a => a.brand.id === post.brand);
    if (!acc) continue;
    const { errors } = scanPost(post, acc.brand, acc.rules, icons);
    console.log(`  ${errors.length ? '✗' : '✓'} posts/${slug} memakai ${id}${errors.length ? `: ${errors.join(' | ')}` : ', scan lolos. Build ulang untuk memakai versi ini.'}`);
  }
}
console.log('');

function writeReadme() {
  const list = Object.values(CUSTOM).filter(c => dirname(fileOf(c.id)) === dirname(fileOf(id)) && (c.id === id || passOf(c.id).ok));
  const md = [`# Komponen buatan`, '', 'Komponen di folder ini dibuat lewat `node scripts/component.mjs check` dan lolos gerbang pakai ulang, design system, pola AI, dan kerapian. Berkas ini ditulis ulang setiap kali sebuah komponen lolos; jangan diedit.', ''];
  if (!list.length) md.push('Belum ada komponen buatan.');
  for (const c of list) {
    md.push(`## \`${c.id}\`: ${c.label}`, '', `${c.visual}. ${c.goal}`, '');
    md.push(`- Posisi: ${c.role === 'open' ? 'slide pertama' : c.role === 'close' ? 'slide terakhir' : 'di antara pembuka dan penutup'}`);
    if (c.variants) md.push(`- Varian: ${Object.entries(c.variants).map(([v, x]) => `\`${v}\` ${x.toLowerCase()}`).join(', ')}`);
    md.push(`- Gerak bawaan: ${MOTIONS[c.motion] ? MOTIONS[c.motion].label.toLowerCase() : c.motion}`, `- Aturan: ${c.rule}`, `- Kenapa dibuat: ${c.reuse.need}`, '- Field:');
    fieldLines(c).forEach(f => md.push(`  - ${f}`));
    md.push('', '```json', JSON.stringify({ component: c.id, ...c.sample }), '```', '');
  }
  writeFileSync(join(dirname(fileOf(id)), 'README.md'), md.join('\n'));
}
