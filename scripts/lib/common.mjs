// Shared helpers for the content-studio scripts. Node 18+, no dependencies.
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const ENGINE_DIR = join(SKILL_DIR, 'engine');

/** Parse `--key value` and `--flag` arguments. */
export function parseArgs(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}

/** Workspace that holds brands/ and posts/ for the current project: ./content-studio, or the folder an
    older project still keeps under the skill's former name, ./carousel-studio. */
export function workspace(args) {
  const env = process.env.CONTENT_STUDIO_ROOT || process.env.CAROUSEL_STUDIO_ROOT;
  if (args.root || env) return resolve(args.root || env);
  const here = join(process.cwd(), 'content-studio'), legacy = join(process.cwd(), 'carousel-studio');
  return resolve(!existsSync(here) && existsSync(legacy) ? legacy : here);
}

export function readJson(path, label = path) {
  if (!existsSync(path)) fail(`${label} tidak ditemukan: ${path}`);
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { fail(`${label} bukan JSON yang valid (${e.message})`); }
}

export function fail(msg, code = 1) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(code);
}

export const sha256 = buf => createHash('sha256').update(buf).digest('hex');

/** Every file under a folder, sorted, as paths relative to `base`. */
export function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listFiles(p, base));
    else out.push(relative(base, p));
  }
  return out;
}

export const slugify = s => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'slide';

/** Counts words the same way the in-page checks do. */
export const countWords = s => String(s || '').trim().split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;

export const HEX = /^#[0-9a-fA-F]{6}$/;

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
/* Two decimals, so a failing 4.46 never prints as "4,5:1". */
export const ratioText = r => r.toFixed(2).replace('.', ',') + ':1';

function mix(hex, target, t) {
  const a = parseInt(hex.slice(1), 16), b = parseInt(target.slice(1), 16);
  const ch = s => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return '#' + [16, 8, 0].map(s => ch(s).toString(16).padStart(2, '0')).join('').toUpperCase();
}
/** Nearest shades of `color` (darker and lighter) that reach `min` contrast against `other`. */
export function suggestShades(color, other, min) {
  const out = [];
  for (const target of ['#000000', '#FFFFFF']) {
    for (let t = 0.01; t <= 1.0001; t += 0.01) {
      const c = mix(color, target, t);
      const r = contrast(c, other);
      if (r >= min) { out.push({ hex: c, ratio: r, dir: target === '#000000' ? 'lebih gelap' : 'lebih terang' }); break; }
    }
  }
  return out;
}

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function loadIcons() {
  return readJson(join(ENGINE_DIR, 'icons.json'), 'Katalog ikon').icons;
}

export function report(title, errors, warnings) {
  const line = '─'.repeat(60);
  console.log(`\n${title}\n${line}`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  for (const w of warnings) console.log(`  ! ${w}`);
  if (!errors.length && !warnings.length) console.log('  ✓ Tidak ada masalah.');
  console.log(`${line}\n${errors.length} galat, ${warnings.length} peringatan\n`);
}
