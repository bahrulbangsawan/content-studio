#!/usr/bin/env node
// Open a built page in headless Chrome, read the in-page checks (zone fit, balance, word count,
// title length, smallest text, entrance time, no tap prompts) and save a PNG preview of every slide,
// and of every alternative cover (covers in post.json) as preview/cover-N.png.
// Usage: node verify.mjs --slug <slug> [--root <workspace>] [--no-png]
// Needs Chrome, Chromium or Edge. Set CHROME_PATH if it is not found.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs, workspace, fail } from './lib/common.mjs';
import { findChrome, launch, sleep } from './lib/chrome.mjs';
import { postTextChecks } from './lib/gate-browser.mjs';

const args = parseArgs();
const root = workspace(args);
const slug = args.slug || args._[0];
if (!slug) fail('Pakai: node verify.mjs --slug <slug>');
const page = join(root, 'posts', slug, `${slug}.html`);
if (!existsSync(page)) fail(`Halaman belum dibangun: ${page}. Jalankan build.mjs dulu.`);

const chromePath = findChrome();
if (!chromePath) fail('Chrome, Chromium, atau Edge tidak ditemukan. Pasang salah satunya atau set CHROME_PATH. Pemeriksaan tata letak juga tersedia di tab Pengaturan halaman itu sendiri.', 2);

let exitCode = 0, browser;
try {
  browser = await launch(chromePath);
  const { evalJs, logs } = browser;
  await browser.open(page, '!!(window.__studio && window.__studio.mediaReady && document.fonts && document.fonts.status === "loaded")', 30000);
  await sleep(400);

  const rows = await evalJs('window.__studio.report()');
  const labels = { zone: 'zona konten', bal: 'seimbang', words: 'jumlah kata', title: 'panjang judul', min: 'teks terkecil', motion: 'waktu masuk', tap: 'tanpa ajakan mengetuk' };
  console.log(`\nPemeriksaan di browser: posts/${slug}/${slug}.html\n${'─'.repeat(60)}`);
  for (const r of rows) {
    const bad = Object.entries(r.ok).filter(([, v]) => !v).map(([k]) => labels[k] || k);
    if (bad.length) exitCode = 1;
    console.log(`  ${bad.length ? '✗' : '✓'} ${r.slide}. ${r.name}  kata ${r.words}, judul ${r.titleWords}/${r.titleMax}, atas ${r.top} bawah ${r.bottom}, terkecil ${r.minPx}px, masuk ${r.endMs}ms${bad.length ? `  GAGAL: ${bad.join(', ')}` : ''}${r.tapWord ? ` (kata "${r.tapWord}")` : ''}`);
  }

  /* Words: none broken mid-word (fails), and none left alone on the last line of a block (warning) */
  const words = await evalJs(`(${postTextChecks.toString()})()`);
  const brokenAny = words.filter(w => w.broken.length), aloneAny = words.filter(w => w.alone.length);
  if (brokenAny.length || aloneAny.length) console.log('');
  for (const w of brokenAny) { exitCode = 1; console.log(`  ✗ ${w.slide}. Kata terpotong di tengah: ${w.broken.map(x => `"${x}"`).join(', ')}. Pakai kata yang lebih pendek atau varian yang lebih lebar.`); }
  for (const w of aloneAny) console.log(`  ! ${w.slide}. Satu kata sendirian di baris terakhir: ${w.alone.map(x => `"${x}"`).join(', ')}. Susun ulang kalimatnya bila janggal.`);

  if (!args['no-png']) {
    const dir = join(root, 'posts', slug, 'preview');
    mkdirSync(dir, { recursive: true });
    for (let i = 0; i < rows.length; i++) {
      const url = await evalJs(`window.__studio.renderPng(${i})`);
      writeFileSync(join(dir, `slide-${i + 1}.png`), Buffer.from(url.split(',')[1], 'base64'));
    }
    console.log(`\n  Pratinjau PNG: posts/${slug}/preview/slide-1.png sampai slide-${rows.length}.png`);
  }

  /* Alternative covers and closings: each one is swapped into its slide, checked like a slide and photographed */
  const last = rows.length - 1;
  for (const [what, count, set, at, file] of [['cover', 'coverCount', 'setCover', 0, 'cover'], ['penutup', 'closeCount', 'setClose', last, 'closing']]) {
    const n = await evalJs(`window.__studio.${count} || 1`);
    if (n < 2) continue;
    console.log(`\n  Pilihan ${what} (${n}):`);
    const dir = join(root, 'posts', slug, 'preview');
    mkdirSync(dir, { recursive: true });
    for (let k = 0; k < n; k++) {
      const hook = await evalJs(`window.__studio.${set}(${k})`);
      await sleep(200);
      const r = (await evalJs('window.__studio.report()'))[at];
      const w = (await evalJs(`(${postTextChecks.toString()})()`))[at];
      const bad = Object.entries(r.ok).filter(([, v]) => !v).map(([key]) => labels[key] || key);
      if (bad.length || w.broken.length) exitCode = 1;
      console.log(`  ${bad.length || w.broken.length ? '✗' : '✓'} ${what} ${k + 1}. ${hook}  kata ${r.words}, judul ${r.titleWords}/${r.titleMax}, atas ${r.top} bawah ${r.bottom}${bad.length ? `  GAGAL: ${bad.join(', ')}` : ''}${w.broken.length ? `  kata terpotong: ${w.broken.join(', ')}` : ''}${w.alone.length ? `  (sendirian: ${w.alone.join(', ')})` : ''}`);
      if (!args['no-png']) {
        const url = await evalJs(`window.__studio.renderPng(${at})`);
        writeFileSync(join(dir, `${file}-${k + 1}.png`), Buffer.from(url.split(',')[1], 'base64'));
      }
    }
    await evalJs(`window.__studio.${set}(0)`);
    if (!args['no-png']) console.log(`  Pratinjau: posts/${slug}/preview/${file}-1.png sampai ${file}-${n}.png`);
  }
  if (logs.length) { console.log('\n  Pesan konsol:'); logs.forEach(l => console.log('   ' + l)); }
  console.log(`${'─'.repeat(60)}\n${exitCode ? 'Ada pemeriksaan yang gagal. Perbaiki post.json (persingkat teks) lalu bangun ulang.' : 'Semua pemeriksaan lolos.'}\n`);
} catch (e) {
  console.error('\n✗ Verifikasi gagal: ' + e.message + '\n');
  exitCode = 3;
} finally {
  await browser?.close();
}
process.exit(exitCode);
