#!/usr/bin/env node
// Static rule scan of one post. Exit code 1 when any rule fails.
// Usage: node scan.mjs --slug <slug> [--root <workspace>] [--detail]
//   --detail prints words and characters used by every text field against its limit.
import { join } from 'node:path';
import { parseArgs, workspace, readJson, fail, loadIcons, report } from './lib/common.mjs';
import { loadBrand } from './lib/brand.mjs';
import { scanPost } from './lib/rules.mjs';

const args = parseArgs();
const root = workspace(args);
const slug = args.slug || args._[0];
if (!slug) fail('Pakai: node scan.mjs --slug <slug>');
const post = readJson(join(root, 'posts', slug, 'post.json'), 'post.json');
if (!post.brand) fail('post.json tidak menyebut akun (kunci "brand").');
const { brand, rules } = loadBrand(root, post.brand);
const res = scanPost(post, brand, rules, loadIcons(), { mediaDir: join(root, 'posts', slug, 'media') });
report(`Scan aturan: posts/${slug}/post.json (akun ${brand.name})`, res.errors, res.warnings);
console.log('Kata per slide: ' + res.wordsBySlide.map((w, i) => `${i + 1}:${w}`).join('  ') + `  (maksimal ${rules.maxWordsPerSlide})`);
const layout = s => `${s.component}${s.variant ? `/${s.variant}` : ''}`;
if (res.wordsByCover.length) console.log(`Pilihan cover: ${[post.slides[0], ...post.covers].map((s, k) => `${k + 1}:${layout(s || {})}`).join('  ')}`);
if (res.wordsByClosing.length) console.log(`Pilihan penutup: ${[post.slides[post.slides.length - 1], ...post.closings].map((s, k) => `${k + 1}:${layout(s || {})}`).join('  ')}`);
if (res.medias.length) console.log(`Media: ${[...new Set(res.medias.map(m => m.src))].join(', ')} (di posts/${slug}/media/)`);
console.log('');
if (args.detail) {
  console.log('Pemakaian per field (kata / batas, karakter / batas):');
  for (const f of res.fields) {
    const over = (f.maxWords && f.words > f.maxWords) || (f.maxChars && f.chars > f.maxChars);
    console.log(`  ${over ? '✗' : ' '} ${f.path.padEnd(30)} ${String(f.words).padStart(3)} / ${f.maxWords ?? '-'}   ${String(f.chars).padStart(4)} / ${f.maxChars ?? '-'}`);
  }
  console.log('');
}
process.exit(res.errors.length ? 1 : 0);
