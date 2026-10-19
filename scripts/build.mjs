#!/usr/bin/env node
// Build one post into a standalone studio page: posts/<slug>/<slug>.html
// Usage: node build.mjs --slug <slug> [--root <workspace>]
// Order: engine lock -> account lock -> account rules -> post scan -> render -> write.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseArgs, workspace, readJson, fail, loadIcons, report, ENGINE_DIR, listFiles, sha256 } from './lib/common.mjs';
import { loadMedia, mediaScripts } from './lib/media.mjs';
import { loadBrand, validateBrand } from './lib/brand.mjs';
import { scanPost } from './lib/rules.mjs';
import { renderPost } from './lib/render.mjs';
import { sanitizeSvg } from './lib/svg.mjs';
import { fingerprints } from './lock.mjs';

const args = parseArgs();
const root = workspace(args);
const slug = args.slug || args._[0];
if (!slug) fail('Pakai: node build.mjs --slug <slug>');
const postDir = join(root, 'posts', slug);
const post = readJson(join(postDir, 'post.json'), 'post.json');

// 1. Engine must match the shipped fingerprints.
const lockPath = join(ENGINE_DIR, 'LOCK.json');
if (!existsSync(lockPath)) fail('engine/LOCK.json hilang. Instal ulang skill content-studio.');
const lock = JSON.parse(readFileSync(lockPath, 'utf8')).files;
const now = fingerprints();
const changed = [...new Set([...Object.keys(lock), ...Object.keys(now)])].filter(f => lock[f] !== now[f]);
if (changed.length) fail(`Engine skill berubah di luar pembaruan resmi:\n  ${changed.join('\n  ')}\nPulihkan berkas itu. Engine, skrip, ikon, dan font tidak boleh diedit saat membuat postingan.`);

// 2. Account must be valid and unchanged since the owner approved it.
const { brand, dir, approved, intact, rules } = loadBrand(root, post.brand);
const bv = validateBrand(brand, dir);
if (bv.errors.length) { report(`Akun ${post.brand}`, bv.errors, bv.warnings); fail('Akun belum valid. Perbaiki lewat brand.mjs bersama pemilik akun.'); }
if (!approved) fail(`Akun "${brand.id}" belum disetujui: brand.mjs init belum pernah lolos untuk akun ini.`);
if (!intact) fail(`Akun "${brand.id}" berubah sejak terakhir disetujui (brand.json, logo, atau font).\nTunjukkan perubahannya ke pemilik akun. Bila mereka setuju, jalankan: node brand.mjs accept --id ${brand.id}`);

// 3. Static rules.
const icons = loadIcons();
const mediaDir = join(postDir, 'media');
const scan = scanPost(post, brand, rules, icons, { mediaDir });
report(`Scan aturan: posts/${slug}/post.json`, scan.errors, scan.warnings);
if (scan.errors.length) fail('Build dihentikan. Perbaiki isi post.json sampai scan bersih.');

// 4. Render.
const logoLight = sanitizeSvg(readFileSync(join(dir, brand.logo.light), 'utf8')).svg;
const logoDark = sanitizeSvg(readFileSync(join(dir, brand.logo.dark), 'utf8')).svg;
const fontFile = brand.font.file ? join(dir, brand.font.file) : join(ENGINE_DIR, 'fonts', 'inter-latin.woff2');
const family = brand.font.file ? brand.font.family : 'Inter';
/* Photos and videos: each file once, as base64 in a text block; the studio script turns them into blob: URLs */
const media = loadMedia(mediaDir, scan.medias.map(m => m.src));
const mediaBlocks = mediaScripts(media);
const r = renderPost(post, { brand, rules, icons, logoLight, logoDark, media, mediaMode: 'ref' });
const values = { ...r, FONT_FAMILY: family, FONT_B64: readFileSync(fontFile).toString('base64') };
const dataJson = JSON.stringify(r.DATA).replace(/</g, '\\u003c');
const muxer = readFileSync(join(ENGINE_DIR, 'vendor', 'mp4-muxer.min.js'), 'utf8').replace(/<\/script/gi, '<\\/script');

const parts = listFiles(join(ENGINE_DIR, 'parts')).map(f => readFileSync(join(ENGINE_DIR, 'parts', f), 'utf8'));
const headParts = parts.slice(0, 3).join('');
const markup = parts.slice(3, 9).join('');
const scripts = parts.slice(9).join('');
const fill = s => s.replace(/@@([A-Z_0-9]+)@@/g, (all, key) => {
  if (!(key in values) || typeof values[key] !== 'string') fail(`Placeholder engine tidak dikenal: ${all}`);
  return values[key];
});
const html = `<!doctype html>
<html lang="${brand.language || 'id'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="generator" content="content-studio">
<!-- Dibuat oleh content-studio dari posts/${slug}/post.json. Jangan edit berkas ini: ubah post.json lalu bangun ulang. -->
${fill(headParts)}</head>
<body>
${fill(markup)}
<script id="studioData" type="application/json">${dataJson}</script>
${mediaBlocks}
<script>${muxer}</script>
${scripts}
</body>
</html>
`;

const out = join(postDir, `${slug}.html`);
writeFileSync(out, html);
writeFileSync(join(postDir, '.build.json'), JSON.stringify({ post: sha256(JSON.stringify(post)), brand: brand.id, builtAt: new Date().toISOString(), bytes: Buffer.byteLength(html) }, null, 2) + '\n');
console.log(`✓ Halaman dibuat: ${relative(process.cwd(), out)} (${Math.round(Buffer.byteLength(html) / 1024)} KB)`);
console.log(`  Berikutnya: node verify.mjs --slug ${slug}  (cek tata letak di browser dan buat pratinjau PNG)\n`);
