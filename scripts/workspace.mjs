#!/usr/bin/env node
// Carry a workspace in one ZIP: accounts, posts (post.json and media), the project's own components and setup
// answers. Built pages, previews, gate sheets and Instagram references are left out; they are rebuilt.
// Useful where files do not stay between conversations (Claude Desktop, claude.ai) and for moving computers.
// Usage: node workspace.mjs pack [--out <file.zip>] [--root <workspace>]
//        node workspace.mjs unpack <file.zip> [--force] [--root <workspace>]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve, normalize, isAbsolute } from 'node:path';
import { parseArgs, workspace, fail, listFiles } from './lib/common.mjs';
import { zip, unzip } from './lib/zip.mjs';

const args = parseArgs();
const root = workspace(args);
const cmd = args._[0];
/* What a workspace needs to be rebuilt: everything else is generated */
const KEEP = [/^brands\//, /^posts\/[^/]+\/post\.json$/, /^posts\/[^/]+\/media\//, /^components\//, /^setup\//];

if (cmd === 'pack') {
  if (!existsSync(root)) fail(`Workspace tidak ditemukan: ${root}`);
  const files = listFiles(root).filter(f => KEEP.some(k => k.test(f.split('\\').join('/'))));
  if (!files.length) fail('Workspace kosong: belum ada akun atau postingan.');
  const out = resolve(args.out || 'content-studio-workspace.zip');
  const buf = zip(files.map(f => ({ name: `content-studio/${f}`, data: readFileSync(join(root, f)) })));
  writeFileSync(out, buf);
  const posts = new Set(files.filter(f => f.startsWith('posts/')).map(f => f.split(/[\\/]/)[1]));
  const brands = new Set(files.filter(f => f.startsWith('brands/')).map(f => f.split(/[\\/]/)[1]));
  console.log(`✓ ${relative(process.cwd(), out)} (${(buf.length / 1024 / 1024).toFixed(1)} MB): ${brands.size} akun, ${posts.size} postingan, ${files.length} berkas.`);
  console.log('  Simpan berkas ini. Di percakapan berikutnya unggah lagi, lalu jalankan: node workspace.mjs unpack <berkas.zip>\n');
} else if (cmd === 'unpack') {
  const file = args._[1];
  if (!file || !existsSync(file)) fail('Pakai: node workspace.mjs unpack <content-studio-workspace.zip> [--force]');
  const entries = unzip(readFileSync(file));
  let wrote = 0, kept = 0;
  for (const e of entries) {
    const rel = e.name.replace(/^content-studio\//, '');
    const safe = normalize(rel);
    if (isAbsolute(safe) || safe.startsWith('..')) fail(`ZIP berisi path yang tidak aman: ${e.name}`);
    const dest = join(root, safe);
    if (existsSync(dest) && !args.force) { kept++; continue; }
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, e.data);
    wrote++;
  }
  console.log(`✓ ${wrote} berkas dibuka ke ${relative(process.cwd(), root) || root}${kept ? `, ${kept} berkas yang sudah ada dibiarkan (pakai --force untuk menimpa)` : ''}.`);
  console.log('  Berikutnya: node brand.mjs list, lalu build postingan yang ingin dilihat.\n');
} else {
  fail('Pakai: node workspace.mjs pack [--out <berkas.zip>] | unpack <berkas.zip> [--force]');
}
