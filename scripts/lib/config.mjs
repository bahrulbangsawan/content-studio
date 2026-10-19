// User settings and API keys: ~/.content-studio/config.json, readable by the owner only (mode 600). Never in a
// project, a workspace zip or the skill folder (the repo is public). Environment variables win over the file,
// so a key can also live in the shell profile or a secret manager.
import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export const HOME_DIR = process.env.CONTENT_STUDIO_HOME || join(homedir(), '.content-studio');
export const CONFIG_FILE = join(HOME_DIR, 'config.json');

/* Every setting: where an environment variable may supply it, its default, and whether it is a secret */
export const SETTINGS = {
  'gemini.apiKey': { env: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'], secret: true, label: 'Gemini API key: voice over (TTS) dan transkripsi. Buat di https://aistudio.google.com/apikey' },
  'gemini.ttsModel': { def: 'gemini-3.8-flash-tts', label: 'Model TTS. Lebih hemat: gemini-3.8-flash-lite-tts' },
  'gemini.voice': { def: 'Laomedeia', label: 'Suara bawaan (lihat: content-studio voice list)' },
  'gemini.style': { def: 'Energetic, enthusiastic creator talking straight to the viewer; upbeat, conversational, brisk pace, lively intonation. Say English words and names with native English pronunciation.', label: 'Gaya bicara bawaan (bahasa Inggris paling dipatuhi model)' },
  'gemini.transcribeModel': { def: 'gemini-3.5-transcribe', label: 'Model transkripsi Gemini' },
  'openai.apiKey': { env: ['OPENAI_API_KEY'], secret: true, label: 'OpenAI API key: transkripsi. Buat di https://platform.openai.com/api-keys' },
  'openai.transcribeModel': { def: 'gpt-transcribe', label: 'Model transkripsi OpenAI (waktu per kata selalu memakai whisper-1)' },
  'transcribe.provider': { def: 'auto', label: 'auto, openai, atau gemini' },
  'magnific.apiKey': { env: ['MAGNIFIC_API_KEY', 'FREEPIK_API_KEY'], secret: true, label: 'Magnific (Freepik) API key: footage dan foto stok. Butuh paket berbayar. https://www.magnific.com/user/organization/api-keys' },
  'pexels.apiKey': { env: ['PEXELS_API_KEY'], secret: true, label: 'Pexels API key: footage dan foto gratis. https://www.pexels.com/api/' },
  'footage.provider': { def: 'auto', label: 'auto (Magnific bila ada key, lalu Pexels), magnific, atau pexels' },
  'ncbi.email': { env: ['NCBI_EMAIL'], label: 'Email untuk PubMed dan Crossref (dianjurkan oleh keduanya)' },
  'ncbi.apiKey': { env: ['NCBI_API_KEY'], secret: true, label: 'NCBI API key (opsional, 10 permintaan per detik)' },
};

export function readConfig() {
  if (!existsSync(CONFIG_FILE)) return {};
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) || {}; } catch (e) { return {}; }
}
function writeConfig(c) {
  mkdirSync(HOME_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(CONFIG_FILE, JSON.stringify(c, null, 2) + '\n', { mode: 0o600 });
  try { chmodSync(CONFIG_FILE, 0o600); } catch (e) { /* Windows */ }
}
const at = (obj, key) => key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);

/** The value and where it came from: { value, from: 'env GEMINI_API_KEY' | 'config' | 'default' | null }. */
export function lookup(key) {
  const s = SETTINGS[key];
  if (!s) throw new Error(`Pengaturan tidak dikenal: ${key}`);
  for (const e of s.env || []) if (process.env[e]) return { value: process.env[e], from: `env ${e}` };
  const v = at(readConfig(), key);
  if (v !== undefined && v !== '') return { value: v, from: 'config' };
  return { value: s.def ?? null, from: s.def !== undefined ? 'default' : null };
}
export const get = key => lookup(key).value;

export function set(key, value) {
  if (!SETTINGS[key]) throw new Error(`Pengaturan tidak dikenal: ${key}. Pilihan: ${Object.keys(SETTINGS).join(', ')}`);
  const c = readConfig(), [a, b] = key.split('.');
  c[a] = { ...(c[a] || {}), [b]: value };
  writeConfig(c);
}
export function unset(key) {
  const c = readConfig(), [a, b] = key.split('.');
  if (c[a]) { delete c[a][b]; if (!Object.keys(c[a]).length) delete c[a]; }
  writeConfig(c);
}

/** "AIza…3f9Q": enough to recognise a key, never enough to use it. */
export const mask = v => (!v ? '' : v.length <= 10 ? '•'.repeat(v.length) : `${v.slice(0, 4)}…${v.slice(-4)}`);

/** A key or a clear message on how to add it. */
export function need(key, why) {
  const v = get(key);
  if (v) return v;
  const s = SETTINGS[key];
  const e = new Error(`${why} butuh ${key.split('.')[0]} API key.\n  Simpan sekali: content-studio setup   (atau: content-studio config set ${key})\n  Atau set variabel lingkungan ${(s.env || [])[0]}.\n  ${s.label}`);
  e.code = 'NO_KEY';
  throw e;
}
