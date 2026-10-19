#!/usr/bin/env node
// Export a built post from the terminal into posts/<slug>/export/, without opening the page.
// Reel: <handle>-<slug>.mp4 (1080 x 1920, H.264 + AAC), -cover.png, .srt, -caption.txt.
// Carousel: -png.zip (every slide) and .mp4 (all slides in a row), or -mp4.zip (one video per slide).
// Usage: node export.mjs <slug> [--only mp4,cover,srt,caption | png,mp4,mp4-zip] [--hook N] [--closing N] [--out <dir>]
// Needs Chrome, Chromium or Edge (the same encoder as the page's Download menu).
import { existsSync, mkdirSync, writeFileSync, openSync, writeSync, closeSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parseArgs, workspace, readJson, fail } from './lib/common.mjs';
import { findChrome, launch, sleep } from './lib/chrome.mjs';
import { probe } from './lib/ffmpeg.mjs';

const args = parseArgs();
const root = workspace(args);
const slug = args.slug || args._[0];
if (!slug) fail('Pakai: node export.mjs <slug> [--only mp4,cover,srt,caption] [--hook N] [--closing N]');
const dir = join(root, 'posts', slug);
const page = join(dir, `${slug}.html`);
const isReel = existsSync(join(dir, 'reel.json'));
if (!existsSync(page)) fail(`Halaman belum dibangun: posts/${slug}/${slug}.html. Jalankan: content-studio build ${slug}`);
const brand = readJson(join(dir, isReel ? 'reel.json' : 'post.json')).brand;
const handle = readJson(join(root, 'brands', brand, 'brand.json')).handle;
const base = `${handle}-${slug}`;
const out = resolve(args.out || join(dir, 'export'));
mkdirSync(out, { recursive: true });
const only = new Set(String(args.only || (isReel ? 'mp4,cover,srt,caption' : 'png,mp4')).split(',').map(s => s.trim()).filter(Boolean));
const chromePath = findChrome();
if (!chromePath) fail('Chrome, Chromium, atau Edge tidak ditemukan. Pasang salah satunya atau set CHROME_PATH. Atau unduh dari menu Unduh di halaman studio.', 2);

const MB = n => (n / 1024 / 1024).toFixed(1).replace('.', ',');
const wrote = [];
/* Read a Blob the page holds, in 4 MB base64 pieces, straight into a file */
async function pull(evalJs, size, file, chunkExpr) {
  const fd = openSync(file, 'w');
  try {
    for (let off = 0; off < size; off += 4 * 1024 * 1024) writeSync(fd, Buffer.from(await evalJs(chunkExpr(off, 4 * 1024 * 1024), 300000), 'base64'));
  } finally { closeSync(fd); }
  wrote.push(file);
}

let browser, code = 0;
const t0 = Date.now();
try {
  browser = await launch(chromePath, { width: 1440, height: 1000 });
  const { evalJs } = browser;
  if (isReel) {
    await browser.open(page, '!!(window.__reel && window.__reel.ready)', 60000);
    if (!(await evalJs('typeof window.__reel.exportMp4 === "function"'))) fail('Halaman ini dibangun dengan versi lama. Bangun ulang: content-studio build ' + slug);
    if (args.hook) console.log(`  Pembuka: ${await evalJs(`window.__reel.setHook(${Number(args.hook) - 1})`)}`);
    if (args.closing) console.log(`  Penutup: ${await evalJs(`window.__reel.setClose(${Number(args.closing) - 1})`)}`);
    const info = await evalJs('window.__reel.info()');
    console.log(`\nEkspor reel posts/${slug}: ${info.seq.length} adegan, ${info.total.toFixed(1).replace('.', ',')} detik${info.audio ? '' : ', tanpa suara (belum ada voice over)'}.`);
    if (only.has('mp4')) {
      process.stdout.write('  Membuat MP4 (setiap frame digambar di browser, sekitar 1 sampai 3 detik per detik video)...');
      const r = await evalJs('window.__reel.exportMp4()', 1800000);
      const file = join(out, `${base}.mp4`);
      await pull(evalJs, r.size, file, (o, l) => `window.__reel.chunk(${o}, ${l})`);
      const p = probe(file);
      console.log(` selesai.\n  ✓ ${relative(process.cwd(), file)} (${MB(r.size)} MB${p ? `, ${p.width}x${p.height}, ${p.video}${p.audio ? ' + ' + p.audio : ', tanpa audio'}, ${p.duration.toFixed(1).replace('.', ',')} dtk` : ''})`);
    }
    if (only.has('cover')) {
      const url = await evalJs('window.__reel.renderPng(window.__reelCore.plan().seq[0])', 300000);
      const file = join(out, `${base}-cover.png`);
      writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
      wrote.push(file);
      console.log(`  ✓ ${relative(process.cwd(), file)} (sampul Reels; di grid profil terpotong 3:4 di tengah)`);
    }
    if (only.has('srt')) {
      const file = join(out, `${base}.srt`);
      writeFileSync(file, await evalJs('window.__reel.srt()'));
      wrote.push(file);
      console.log(`  ✓ ${relative(process.cwd(), file)}`);
    }
    if (only.has('caption')) {
      const file = join(out, `${base}-caption.txt`);
      writeFileSync(file, await evalJs('window.__reel.caption()'));
      wrote.push(file);
      console.log(`  ✓ ${relative(process.cwd(), file)} (teks posting, sumber, kredit footage)`);
    }
  } else {
    await browser.open(page, '!!(window.__studio && window.__studio.mediaReady && document.fonts && document.fonts.status === "loaded")', 60000);
    if (!(await evalJs('typeof window.__studio.exportAll === "function"'))) fail('Halaman ini dibangun dengan versi lama. Bangun ulang: content-studio build ' + slug);
    await sleep(300);
    console.log(`\nEkspor carousel posts/${slug}.`);
    for (const [kind, name] of [['png', `${base}-png.zip`], ['mp4', `${base}.mp4`], ['mp4-zip', `${base}-mp4.zip`]]) {
      if (!only.has(kind)) continue;
      const size = await evalJs(`window.__studio.exportAll(${JSON.stringify(kind === 'mp4' ? 'mp4-all' : kind)})`, 1800000);
      const file = join(out, name);
      await pull(evalJs, size, file, (o, l) => `window.__studio.chunk(${o}, ${l})`);
      console.log(`  ✓ ${relative(process.cwd(), file)} (${MB(size)} MB)`);
    }
  }
  console.log(`\nSelesai dalam ${Math.round((Date.now() - t0) / 1000)} detik. Berkas di ${relative(process.cwd(), out) || out}/\n`);
} catch (e) {
  console.error('\n✗ Ekspor gagal: ' + (e.message || e) + '\n');
  code = 1;
} finally { await browser?.close(); }
process.exit(code);
