#!/usr/bin/env node
// Pack the skill into one ZIP for Claude Desktop and claude.ai (Settings, Capabilities, Skills, upload):
// a single content-studio/ folder with SKILL.md inside, without git data, caches or build output.
// The description in the ZIP is the short one below: the claude.ai upload form takes up to 200 characters,
// while Claude Code reads the full description from SKILL.md.
// Usage: node package.mjs [--out <file.zip>]   (default: dist/content-studio.zip in the skill folder)
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { SKILL_DIR, listFiles, parseArgs, fail } from './lib/common.mjs';
import { zip } from './lib/zip.mjs';

const NAME = 'content-studio';
export const SHORT_DESCRIPTION = 'Carousel dan Reels edukasi Instagram: slide dan video 9:16 bergambar dengan voice over, subtitle, sumber ilmiah, pemeriksaan otomatis, dan unduhan PNG atau MP4.';

const args = parseArgs();
const out = resolve(args.out || join(SKILL_DIR, 'dist', `${NAME}.zip`));
if (SHORT_DESCRIPTION.length > 200) fail(`Deskripsi singkat ${SHORT_DESCRIPTION.length} karakter, maksimal 200.`);
/* listFiles skips dot-folders (.git, .claude-plugin, tools/.venv); build output stays out too */
const files = listFiles(SKILL_DIR).filter(f => !/^(dist|node_modules)\//.test(f) && !f.endsWith('.DS_Store'));
const entries = files.map(f => {
  let data = readFileSync(join(SKILL_DIR, f));
  if (f === 'SKILL.md') data = Buffer.from(data.toString('utf8').replace(/^(---\n[\s\S]*?\ndescription: ).*$/m, `$1${SHORT_DESCRIPTION}`));
  return { name: `${NAME}/${f}`, data, mode: statSync(join(SKILL_DIR, f)).mode & 0o777 };
});
const buf = zip(entries);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, buf);
console.log(`✓ ${relative(process.cwd(), out) || out} (${files.length} berkas, ${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
console.log('  Claude Desktop atau claude.ai: Settings, Capabilities, Skills, unggah berkas ini. Code execution harus aktif.\n');
