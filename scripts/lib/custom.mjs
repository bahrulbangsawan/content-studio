// Loads the components written through the component gate, from two places: the ones shipped with the skill
// (<skill>/components, read-only once installed as a plugin or in Claude Desktop) and the project's own
// (<workspace>/components, where `component.mjs new` writes). Each file default-exports one definition, or a
// function that receives the kit and returns it (see references/authoring.md); the function form works
// wherever the skill is installed. A file that fails to load is left out and reported, so one broken
// component never stops posts that do not use it.
// A component may be used in a post only while its pass record (<id>.pass.json, written by
// `component.mjs check`) matches both the file and the engine it was checked against.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SKILL_DIR, ENGINE_DIR, sha256, parseArgs, workspace } from './common.mjs';
import * as KIT from './kit.mjs';

export const SHIPPED_DIR = join(SKILL_DIR, 'components');
export const CUSTOM_DIR = join(workspace(parseArgs()), 'components');
export const ID = /^[a-z][a-z0-9]{2,23}$/;

/** Fingerprint of the locked engine a component was checked against. */
export const engineStamp = () => sha256(readFileSync(join(ENGINE_DIR, 'LOCK.json')));
const home = {};
export const fileOf = id => join(home[id] || CUSTOM_DIR, `${id}.mjs`);
export const passFileOf = id => join(home[id] || CUSTOM_DIR, `${id}.pass.json`);

export const CUSTOM = {};
export const CUSTOM_ISSUES = {};

for (const dir of [...new Set([SHIPPED_DIR, CUSTOM_DIR])]) {
 const files = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.mjs')).sort() : [];
 for (const f of files) {
  const id = f.slice(0, -4);
  if (!ID.test(id)) { CUSTOM_ISSUES[id] = `Nama berkas components/${f} tidak sah: huruf kecil dan angka, 3 sampai 24 karakter, diawali huruf.`; continue; }
  if (home[id]) { CUSTOM_ISSUES[id] = `Komponen buatan ${id} ada di folder skill dan di folder proyek. Ganti nama salah satunya.`; delete CUSTOM[id]; continue; }
  home[id] = dir;
  try {
    const mod = (await import(pathToFileURL(fileOf(id)).href)).default;
    const def = typeof mod === 'function' ? mod(KIT) : mod;
    if (!def || typeof def !== 'object') throw new Error('berkas tidak mengekspor definisi lewat export default');
    if (def.id !== id) throw new Error(`id "${def.id}" harus sama dengan nama berkas "${id}"`);
    if (typeof def.render !== 'function') throw new Error('render(s, ctx) wajib berupa fungsi');
    if (!def.keys || typeof def.keys !== 'object' || !def.keys.title) throw new Error('keys wajib berisi title');
    CUSTOM[id] = { ...def, custom: true };
  } catch (e) {
    CUSTOM_ISSUES[id] = `Komponen buatan ${id} gagal dimuat: ${e.message}`;
  }
 }
}

/** Whether a custom component passed the gate in its current form. */
export function passOf(id) {
  if (!existsSync(passFileOf(id))) return { ok: false, why: `Komponen buatan ${id} belum lolos gerbang. Jalankan: node component.mjs check --id ${id}` };
  let rec;
  try { rec = JSON.parse(readFileSync(passFileOf(id), 'utf8')); } catch (e) { return { ok: false, why: `Catatan lolos ${id}.pass.json rusak. Jalankan ulang: node component.mjs check --id ${id}` }; }
  if (rec.file !== sha256(readFileSync(fileOf(id)))) return { ok: false, why: `Komponen buatan ${id} berubah sejak terakhir lolos gerbang. Jalankan ulang: node component.mjs check --id ${id}` };
  if (rec.engine !== engineStamp()) return { ok: false, why: `Engine diperbarui sejak komponen buatan ${id} diperiksa. Jalankan ulang: node component.mjs check --id ${id}` };
  return { ok: true, rec };
}

/* Cards stay light on dark slides. Every selector that paints background: var(--s-card) gets the light
   palette back inside it, the same rule the engine writes for core cards ("Permukaan terang"). */
const LIGHT = '--s-bg: var(--l-bg); --s-card: var(--l-card); --s-ink: var(--l-ink); --s-muted: var(--l-muted); --s-joint: var(--l-joint); --s-rule: var(--l-rule); --s-rule-2: var(--l-rule-2); color: var(--s-ink);';
export function surfacesOf(css) {
  const out = [];
  for (const m of String(css || '').replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (/(^|;)\s*background(-color)?\s*:\s*var\(--s-card\)\s*(;|$)/.test(m[2].trim())) out.push(...m[1].split(',').map(x => x.trim()).filter(Boolean));
  }
  return out;
}

/** Stylesheet of the given custom components, appended after the engine's slide CSS. */
export function customCss(ids) {
  return [...new Set(ids)].filter(id => CUSTOM[id]).map(id => {
    const sf = surfacesOf(CUSTOM[id].css);
    return `/* ${id} */\n${String(CUSTOM[id].css || '').trim()}${sf.length ? `\n:where(.is-dark) :where(${sf.join(', ')}) { ${LIGHT} }` : ''}`;
  }).join('\n');
}
