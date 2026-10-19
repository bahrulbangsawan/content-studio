#!/usr/bin/env node
// Maintainer tool: record fingerprints of the locked engine and scripts.
// Run only when the skill owner deliberately upgrades the engine. Never run it to make a build pass.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SKILL_DIR, ENGINE_DIR, listFiles, sha256 } from './lib/common.mjs';

export function engineFiles() {
  const files = [];
  for (const sub of ['parts', 'fonts', 'vendor']) files.push(...listFiles(join(ENGINE_DIR, sub)).map(f => `engine/${sub}/${f}`));
  files.push('engine/icons.json');
  files.push(...listFiles(join(SKILL_DIR, 'scripts')).filter(f => f.endsWith('.mjs')).map(f => `scripts/${f}`));
  return files.sort();
}

export function fingerprints() {
  const out = {};
  for (const f of engineFiles()) out[f] = sha256(readFileSync(join(SKILL_DIR, f)));
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const files = fingerprints();
  writeFileSync(join(ENGINE_DIR, 'LOCK.json'), JSON.stringify({ note: 'Sidik jari engine content-studio. build.mjs menolak berjalan bila berkas ini tidak cocok.', files }, null, 1) + '\n');
  console.log(`LOCK.json ditulis untuk ${Object.keys(files).length} berkas.`);
}
