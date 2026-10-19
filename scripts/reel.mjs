#!/usr/bin/env node
// Reels (1080 x 1920): explanation videos from one reel.json per post, with voice-over, captions and evidence.
// Usage: node reel.mjs new --brand <akun> --slug <slug> --title "<judul>"
//        node reel.mjs scan <slug>        static rules
//        node reel.mjs build <slug>       posts/<slug>/<slug>.html, the reel studio
//        node reel.mjs verify <slug> [--no-png] [--frames]   in-page checks and PNG previews in headless Chrome
//        node reel.mjs srt <slug>         posts/<slug>/<slug>.srt from the voice-over timing
// Order for build: engine lock -> account lock -> scan -> voice-over clips -> render -> write.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseArgs, workspace, readJson, fail, loadIcons, report, ENGINE_DIR, listFiles, sha256, esc } from './lib/common.mjs';
import { loadBrand, validateBrand } from './lib/brand.mjs';
import { loadMedia, mediaScripts, extOf } from './lib/media.mjs';
import { sanitizeSvg } from './lib/svg.mjs';
import { scanReel, readCredits, AUDIO_TYPES } from './lib/reel-rules.mjs';
import { renderReel } from './lib/reel-render.mjs';
import { srtTime } from './lib/reel-time.mjs';
import { fingerprints } from './lock.mjs';
import { findChrome, launch, sleep } from './lib/chrome.mjs';

const args = parseArgs();
const root = workspace(args);
const cmd = args._[0];
const slug = args.slug || args._[1];
const HELP = 'Pakai: node reel.mjs new|scan|build|verify|srt <slug>';
if (!cmd) fail(HELP);
const postDir = () => join(root, 'posts', slug);

if (cmd === 'new') newReel();
else if (cmd === 'scan') { const r = load(); scan(r); }
else if (cmd === 'build') { const r = load(); build(r); }
else if (cmd === 'verify') await verify();
else if (cmd === 'srt') { const r = load(); const html = build(r, { quiet: true }); writeSrt(r, html); }
else fail(HELP);

function load() {
  if (!slug) fail(HELP);
  const p = join(postDir(), 'reel.json');
  if (!existsSync(p)) fail(`posts/${slug}/reel.json tidak ada.${existsSync(join(postDir(), 'post.json')) ? ' Postingan ini carousel (post.json): pakai scan.mjs, build.mjs, dan verify.mjs.' : ` Buat dengan: node reel.mjs new --brand <akun> --slug ${slug} --title "..."`}`);
  const reel = readJson(p, 'reel.json');
  const { brand, dir, approved, intact, rules } = loadBrand(root, reel.brand);
  return { reel, brand, dir, approved, intact, rules };
}

function readAudio() {
  const p = join(postDir(), 'audio', 'voice.json');
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch (e) { return null; }
}

function scan({ reel, brand, rules }, quiet = false) {
  const res = scanReel(reel, brand, rules, loadIcons(), { mediaDir: join(postDir(), 'media'), audio: readAudio() });
  if (!quiet || res.errors.length) report(`Scan aturan: posts/${slug}/reel.json`, res.errors, res.warnings);
  if (res.errors.length && !quiet) process.exitCode = 1;
  return res;
}

/* The illustration styles of the carousel engine, so pictures look the same in reels. Their loops run on
   every visible scene here; the player seeks them to the scene's clock. */
function illCss() {
  const css = readFileSync(join(ENGINE_DIR, 'parts', '02-slides.css.html'), 'utf8');
  const a = css.indexOf('/* ---------- Ilustrasi (art.mjs) ----------'), b = css.indexOf('/* Tempat ilustrasi di slide.');
  if (a < 0 || b < a) fail('Gaya ilustrasi tidak ditemukan di engine/parts/02-slides.css.html. Instal ulang skill.');
  return css.slice(a, b).split('\n')
    .filter(l => !/\.ill:not\(\.is-in\)|animation-play-state: paused/.test(l))
    .map(l => l.replace(/\.motion \.slide:is\(\.is-active, \.xp\) \.ill/g, '.scene .ill'))
    .join('\n') + '\n:root { --t: 1; }\n.rf *, .rf *::before, .rf *::after { transition: none !important; }\n';
}

function build(ctx, { quiet = false } = {}) {
  const { reel, brand, dir, approved, intact, rules } = ctx;
  const lock = existsSync(join(ENGINE_DIR, 'LOCK.json')) ? JSON.parse(readFileSync(join(ENGINE_DIR, 'LOCK.json'), 'utf8')).files : null;
  if (!lock) fail('engine/LOCK.json hilang. Instal ulang skill content-studio.');
  const now = fingerprints();
  const changed = [...new Set([...Object.keys(lock), ...Object.keys(now)])].filter(f => lock[f] !== now[f]);
  if (changed.length) fail(`Engine skill berubah di luar pembaruan resmi:\n  ${changed.join('\n  ')}\nPulihkan berkas itu. Engine, skrip, ikon, dan font tidak boleh diedit saat membuat postingan.`);
  const bv = validateBrand(brand, dir);
  if (bv.errors.length) { report(`Akun ${reel.brand}`, bv.errors, bv.warnings); fail('Akun belum valid. Perbaiki lewat brand.mjs bersama pemilik akun.'); }
  if (!approved) fail(`Akun "${brand.id}" belum disetujui: brand.mjs init belum pernah lolos untuk akun ini.`);
  if (!intact) fail(`Akun "${brand.id}" berubah sejak terakhir disetujui. Tunjukkan perubahannya ke pemilik akun. Bila setuju: node brand.mjs accept --id ${brand.id}`);

  const res = scan(ctx, quiet);
  if (res.errors.length) fail('Build dihentikan. Perbaiki isi reel.json sampai scan bersih.');
  const mediaDir = join(postDir(), 'media'), audioDir = join(postDir(), 'audio');
  const media = loadMedia(mediaDir, res.medias.map(m => m.src));
  const audio = readAudio();
  const logoLight = sanitizeSvg(readFileSync(join(dir, brand.logo.light), 'utf8')).svg;
  const logoDark = sanitizeSvg(readFileSync(join(dir, brand.logo.dark), 'utf8')).svg;
  const music = reel.music && existsSync(join(mediaDir, reel.music.src)) ? { id: 'music', volume: reel.music.volume ?? 0.12, file: join(mediaDir, reel.music.src), mime: AUDIO_TYPES[extOf(reel.music.src)] } : null;
  const r = renderReel(reel, { brand, rules, icons: loadIcons(), logoLight, logoDark, media, audio, credits: readCredits(mediaDir, res.medias.map(m => m.src)), warnings: res.warnings, music: music && { id: music.id, volume: music.volume } });
  /* Voice-over clips and music, each once, as base64 text blocks the player decodes */
  const missing = r.clips.filter(c => !existsSync(join(audioDir, c.file)));
  if (missing.length) fail(`Berkas suara hilang di posts/${slug}/audio/: ${missing.map(c => c.file).join(', ')}. Jalankan ulang: content-studio voice ${slug}`);
  const au = r.clips.map((c, k) => `<script type="text/plain" class="au-src" data-id="a${k + 1}" data-mime="audio/wav">${readFileSync(join(audioDir, c.file)).toString('base64')}</script>`);
  if (music) au.push(`<script type="text/plain" class="au-src" data-id="music" data-mime="${music.mime}">${readFileSync(music.file).toString('base64')}</script>`);

  const fontFile = brand.font.file ? join(dir, brand.font.file) : join(ENGINE_DIR, 'fonts', 'inter-latin.woff2');
  const values = { ...r, FONT_FAMILY: brand.font.file ? brand.font.family : 'Inter', FONT_B64: readFileSync(fontFile).toString('base64'), ILL_CSS: illCss() };
  const fill = s => s.replace(/@@([A-Z_0-9]+)@@/g, (all, key) => {
    if (!(key in values) || typeof values[key] !== 'string') fail(`Placeholder engine tidak dikenal: ${all}`);
    return values[key];
  });
  const parts = listFiles(join(ENGINE_DIR, 'reel')).map(f => readFileSync(join(ENGINE_DIR, 'reel', f), 'utf8'));
  const muxer = readFileSync(join(ENGINE_DIR, 'vendor', 'mp4-muxer.min.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
  const dataJson = JSON.stringify(r.DATA).replace(/</g, '\\u003c');
  const html = `<!doctype html>
<html lang="${brand.language || 'id'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="generator" content="content-studio reel">
<!-- Dibuat oleh content-studio dari posts/${slug}/reel.json. Jangan edit berkas ini: ubah reel.json lalu bangun ulang. -->
${fill(parts[0])}${fill(parts[1])}</head>
<body>
${fill(parts[2])}
<script id="reelData" type="application/json">${dataJson}</script>
${mediaScripts(media)}
${au.join('\n')}
<script>${muxer}</script>
${parts.slice(3).join('')}
</body>
</html>
`;
  const out = join(postDir(), `${slug}.html`);
  writeFileSync(out, html);
  writeFileSync(join(postDir(), '.build.json'), JSON.stringify({ reel: sha256(JSON.stringify(reel)), brand: brand.id, format: 'reel', builtAt: new Date().toISOString(), bytes: Buffer.byteLength(html), seconds: +r.total.toFixed(1) }, null, 2) + '\n');
  if (!quiet) {
    const est = r.DATA.scenes.some(s => s.estimated);
    console.log(`✓ Reel dibuat: ${relative(process.cwd(), out)} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(1)} MB, ${Math.round(r.total)} detik, ${r.DATA.seq.main.length + 2} adegan)`);
    if (est) console.log(`  ! Sebagian adegan belum bersuara: waktunya perkiraan. Buat voice over: content-studio voice ${slug}`);
    console.log(`  Berikutnya: node reel.mjs verify ${slug}  (cek tata letak di browser dan buat pratinjau PNG)\n`);
  }
  return r;
}

function writeSrt(ctx, r) {
  const D = r.DATA, seq = [D.seq.hooks[0], ...D.seq.main, D.seq.closings[0]];
  let t = 0, n = 0;
  const out = [];
  for (const i of seq) {
    for (const c of D.scenes[i].caps) out.push(`${++n}\n${srtTime(t + c.s)} --> ${srtTime(t + c.e)}\n${c.words.map(w => w.w).join(' ')}\n`);
    t += D.scenes[i].dur;
  }
  const p = join(postDir(), `${slug}.srt`);
  writeFileSync(p, out.join('\n'));
  console.log(`✓ Subtitle: ${relative(process.cwd(), p)} (${n} baris)`);
}

async function verify() {
  if (!slug) fail(HELP);
  const page = join(postDir(), `${slug}.html`);
  if (!existsSync(page)) fail(`Halaman belum dibangun: ${page}. Jalankan: node reel.mjs build ${slug}`);
  const chromePath = findChrome();
  if (!chromePath) fail('Chrome, Chromium, atau Edge tidak ditemukan. Pasang salah satunya atau set CHROME_PATH. Pemeriksaan juga tampil di tab Pemeriksaan halaman itu sendiri.', 2);
  let code = 0, browser;
  try {
    browser = await launch(chromePath, { width: 1440, height: 1000 });
    const { evalJs, logs } = browser;
    await browser.open(page, '!!(window.__reel && window.__reel.ready)', 60000);
    await sleep(300);
    const rows = await evalJs('window.__reel.report()');
    const D = await evalJs('JSON.parse(JSON.stringify({ seq: window.__reelCore.DATA.seq, scenes: window.__reelCore.DATA.scenes.map(s => ({ name: s.name, dur: s.dur, estimated: s.estimated })) }))');
    const role = i => { const h = D.seq.hooks.indexOf(i), c = D.seq.closings.indexOf(i), m = D.seq.main.indexOf(i); return h >= 0 ? (h ? `pembuka ${h + 1}` : '1') : c >= 0 ? (c ? `penutup ${c + 1}` : String(D.seq.main.length + 2)) : String(m + 2); };
    const file = i => { const h = D.seq.hooks.indexOf(i), c = D.seq.closings.indexOf(i), m = D.seq.main.indexOf(i); return h > 0 ? `hook-${h + 1}` : c > 0 ? `closing-${c + 1}` : `scene-${h === 0 ? 1 : c === 0 ? D.seq.main.length + 2 : m + 2}`; };
    const names = { zone: 'zona konten', min: 'ukuran huruf', overlap: 'tumpang tindih', words: 'kata terpotong', media: 'teks di atas foto', timing: 'waktu masuk' };
    console.log(`\nPemeriksaan di browser: posts/${slug}/${slug}.html\n${'─'.repeat(60)}`);
    for (const r of rows) {
      const bad = Object.keys(r.ok).filter(k => !r.ok[k]);
      if (bad.length) code = 1;
      console.log(`  ${bad.length ? '✗' : '✓'} ${role(r.i)}. ${r.name} (${r.label})  ${String(r.dur).replace('.', ',')} dtk, huruf terkecil ${r.minPx}px${bad.length ? `\n      ${bad.map(k => `${names[k]}: ${r.res[k].join('; ')}`).join('\n      ')}` : ''}`);
    }
    const info = await evalJs('window.__reel.info()');
    console.log(`\n  Durasi ${String(info.total.toFixed(1)).replace('.', ',')} detik, ${info.seq.length} adegan, ${info.audio ? `${info.audio} klip suara` : 'belum ada suara (waktu perkiraan)'}.`);
    if (info.total > 180) { code = 1; console.log('  ✗ Lebih dari 3 menit: Instagram tidak merekomendasikan Reels sepanjang ini ke penonton baru.'); }
    else if (info.total > 90) console.log('  ! Lebih dari 90 detik. Video penjelasan yang padat biasanya 30 sampai 75 detik.');
    if (!args['no-png']) {
      const dir = join(postDir(), 'preview');
      mkdirSync(dir, { recursive: true });
      for (const r of rows) writeFileSync(join(dir, `${file(r.i)}.png`), Buffer.from((await evalJs(`window.__reel.renderPng(${r.i})`)).split(',')[1], 'base64'));
      console.log(`  Pratinjau PNG: posts/${slug}/preview/scene-1.png sampai scene-${D.seq.main.length + 2}.png${D.seq.hooks.length > 1 ? `, hook-2.png sampai hook-${D.seq.hooks.length}.png` : ''}${D.seq.closings.length > 1 ? `, closing-2.png sampai closing-${D.seq.closings.length}.png` : ''}`);
      if (args.frames) {
        const fdir = join(dir, 'frames');
        mkdirSync(fdir, { recursive: true });
        const seq = [D.seq.hooks[0], ...D.seq.main, D.seq.closings[0]];
        let t = 0, n = 0;
        for (let k = 0; k < seq.length; k++) {
          const dur = D.scenes[seq[k]].dur;
          for (const [tag, f] of [['a', 0.12], ['b', 0.45], ['c', 0.8]]) {
            const url = await evalJs(`window.__reel.renderAt(${(t + Math.max(0.2, dur * f)).toFixed(2)})`);
            writeFileSync(join(fdir, `${String(k + 1).padStart(2, '0')}-${tag}.png`), Buffer.from(url.split(',')[1], 'base64'));
            n++;
          }
          t += dur;
        }
        console.log(`  Frame gerak: posts/${slug}/preview/frames/ (${n} frame, tiga per adegan)`);
      }
    }
    if (logs.length) { console.log('\n  Pesan konsol:'); logs.forEach(l => console.log('   ' + l)); }
    console.log(`${'─'.repeat(60)}\n${code ? 'Ada pemeriksaan yang gagal. Perbaiki reel.json (persingkat teks atau ganti varian) lalu bangun ulang.' : 'Semua pemeriksaan lolos.'}\n`);
  } catch (e) {
    console.error('\n✗ Verifikasi gagal: ' + e.message + '\n');
    code = 3;
  } finally { await browser?.close(); }
  process.exit(code);
}

function newReel() {
  const brandId = args.brand, title = args.title;
  if (!brandId || !slug || !title) fail('Pakai: node reel.mjs new --brand <akun> --slug <slug> --title "<judul>"');
  if (!/^[a-z0-9][a-z0-9-]{2,59}$/.test(slug)) fail('slug: huruf kecil, angka, tanda hubung, 3 sampai 60 karakter.');
  const dir = postDir();
  if (existsSync(join(dir, 'reel.json')) && !args.force) fail(`posts/${slug}/reel.json sudah ada. Pakai --force untuk menimpa.`);
  loadBrand(root, brandId);
  const T = 'TODO';
  const reel = {
    brand: brandId, slug, title,
    caption: 'TODO: teks posting Instagram, satu sampai tiga kalimat, lalu tagar.',
    voice: { provider: 'gemini', voice: 'Sulafat', style: 'hangat dan tenang, seperti fisioterapis menjelaskan ke orang tua, tempo sedang' },
    captions: true,
    sources: [{ id: 's1', short: 'TODO: Penulis dkk., tahun', cite: 'TODO: sitasi lengkap. Cari dengan content-studio evidence search', doi: '10.0000/TODO' }],
    scenes: [
      { type: 'hook', variant: 'question', theme: 'dark', vo: T, title: T, art: 'question' },
      { type: 'statement', variant: 'plain', theme: 'light', vo: T, title: T, focus: '', body: T, art: 'idea' },
      { type: 'stat', variant: 'ring', theme: 'dark', vo: T, value: '50%', label: T, source: 's1' },
      { type: 'steps', variant: 'line', theme: 'light', vo: T, title: T, steps: [{ title: T, text: T }, { title: T, text: T }, { title: T, text: T }], art: 'checklist' },
      { type: 'mythfact', theme: 'dark', vo: T, myth: T, fact: T, mythArt: 'question', factArt: 'idea', source: 's1' },
      { type: 'closing', variant: 'follow', theme: 'light', vo: T, title: T, cta: { icon: 'user-plus', text: T } },
    ],
    hooks: [
      { type: 'hook', variant: 'number', theme: 'light', vo: T, value: '7 dari 10', title: T, art: 'chart', source: 's1' },
      { type: 'hook', variant: 'myth', theme: 'dark', vo: T, title: T, art: 'warning' },
    ],
    closings: [{ type: 'closing', variant: 'save', theme: 'dark', vo: T, title: T, cta: { icon: 'bookmark', text: T } }],
  };
  for (const s of [...reel.scenes, ...reel.hooks]) if (s.focus === '') delete s.focus;
  mkdirSync(join(dir, 'media'), { recursive: true });
  writeFileSync(join(dir, 'reel.json'), JSON.stringify(reel, null, 2) + '\n');
  console.log(`✓ Dibuat: ${relative(process.cwd(), join(dir, 'reel.json'))}`);
  console.log('  Isi setiap TODO. Panduan adegan: references/reels.md. Lalu: content-studio check ' + slug + '\n');
}
