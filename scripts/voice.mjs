#!/usr/bin/env node
// Voice-over for a reel: one WAV per scene (main scenes, alternative hooks and closings) in posts/<slug>/audio/,
// listed in audio/voice.json with where the speech sits in each clip and, when a transcription key exists, the
// time of every word (so captions and on-screen words follow the voice exactly). Unchanged lines are kept:
// editing one scene re-records one scene.
// Usage: node voice.mjs <slug> [--provider gemini|say] [--voice Sulafat] [--style "..."] [--model gemini-3.8-flash-tts]
//                              [--force] [--no-align] [--root <workspace>]
//        node voice.mjs list                         Gemini voices
//        node voice.mjs try "<kalimat>" [--voice X] [--style "..."] [--provider ...]   voice-try.wav to listen to
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseArgs, workspace, readJson, fail } from './lib/common.mjs';
import { tts, stt, sttProvider, GEMINI_VOICES } from './lib/speech.mjs';
import { readWav, speechMap, wavFromPcm } from './lib/audio.mjs';
import { voWords, wordTimes } from './lib/reel-time.mjs';
import { voKey } from './lib/reel-render.mjs';
import { get } from './lib/config.mjs';

const args = parseArgs();
const cmd = args._[0];
if (!cmd) fail('Pakai: node voice.mjs <slug> | list | try "<kalimat>"');

function settings(reel = {}) {
  const v = reel.voice || {};
  const provider = args.provider || v.provider || (get('gemini.apiKey') ? 'gemini' : process.platform === 'darwin' ? 'say' : 'gemini');
  if (provider === 'none') fail('reel.json memakai voice.provider "none": video ini tanpa suara.');
  /* A voice name belongs to its provider: a Gemini voice in reel.json does not carry over to the Mac preview */
  const own = v.provider === provider || (!v.provider && provider === 'gemini') ? v.voice : null;
  const voice = args.voice || own || (provider === 'say' ? 'Damayanti' : get('gemini.voice'));
  const style = args.style ?? v.style ?? (provider === 'gemini' ? get('gemini.style') : '');
  const model = provider === 'gemini' ? args.model || v.model || get('gemini.ttsModel') : '';
  return { provider, voice, style: provider === 'say' ? '' : style, model };
}

if (cmd === 'list') {
  console.log('\nSuara Gemini (pilih lewat "voice" di reel.json, atau --voice):\n');
  GEMINI_VOICES.forEach(([n, d], k) => console.log(`  ${n.padEnd(15)}${d.padEnd(16)}${k % 2 ? '\n' : ''}`));
  console.log(`\nBawaan: ${get('gemini.voice')}. Coba dulu: content-studio voice try "Halo, ini contoh suara." --voice Achird`);
  console.log('Suara tambahan per bahasa ada di Extended Voice Library Gemini; id-nya bisa dipakai di "voice".\n');
  process.exit(0);
}

if (cmd === 'try') {
  const text = args._[1];
  if (!text) fail('Pakai: node voice.mjs try "<kalimat>" [--voice Sulafat] [--style "..."]');
  const s = settings();
  try {
    const wav = await tts(s.provider, text, s);
    const out = join(process.cwd(), 'voice-try.wav');
    writeFileSync(out, wav);
    console.log(`✓ ${relative(process.cwd(), out)} (${readWav(wav).duration.toFixed(1)} detik, ${s.provider}${s.model ? ' ' + s.model : ''}, suara ${s.voice}). Putar untuk mendengarkan.`);
  } catch (e) { fail(e.message, e.code === 'NO_KEY' ? 2 : 1); }
  process.exit(0);
}

/* ---------- A reel's voice-over ---------- */
const root = workspace(args), slug = cmd === 'make' ? args._[1] : cmd;
const dir = join(root, 'posts', slug);
const reelPath = join(dir, 'reel.json');
if (!existsSync(reelPath)) fail(`posts/${slug}/reel.json tidak ada. Voice over hanya untuk reel.`);
const reel = readJson(reelPath, 'reel.json');
const cfg = settings(reel);
/* How English words and names are said: the account's list (brand.json "pronounce"), then this reel's
   (voice.pronounce). The TTS reads the respelling; captions keep the script as written. */
let brandPron = {};
try { brandPron = JSON.parse(readFileSync(join(root, 'brands', reel.brand, 'brand.json'), 'utf8')).pronounce || {}; } catch (e) { /* no account yet */ }
const PRON = Object.entries({ ...brandPron, ...((reel.voice && reel.voice.pronounce) || {}) }).sort((a, b) => b[0].length - a[0].length);
const escRe = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ttsText = vo => PRON.reduce((t, [w, say]) => t.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escRe(w)}(?![\\p{L}\\p{N}])`, 'giu'), say), String(vo).trim());
const audioDir = join(dir, 'audio');
mkdirSync(audioDir, { recursive: true });
const manPath = join(audioDir, 'voice.json');
const man = existsSync(manPath) ? JSON.parse(readFileSync(manPath, 'utf8')) : { clips: {} };
const scenes = [...reel.scenes, ...(reel.hooks || []), ...(reel.closings || [])].filter(s => s && s.vo && String(s.vo).trim());
const want = new Map(scenes.map(s => [voKey(s), s]));
const align = !args['no-align'] && !!sttProvider();
const sameVoice = c => c && c.provider === cfg.provider && c.voice === cfg.voice && (c.style || '') === (cfg.style || '') && (c.model || '') === (cfg.model || '');
/* A clip is current when its voice settings and the words the TTS read are unchanged */
const current = (c, s) => sameVoice(c) && (c.tts || c.text) === ttsText(s.vo);
const todo = [...want.entries()].filter(([k, s]) => args.force || !current(man.clips[k], s) || !existsSync(join(audioDir, man.clips[k].file)) || (align && !man.clips[k].words));

console.log(`\nVoice over posts/${slug}: ${want.size} kalimat, ${todo.length} perlu dibuat (${cfg.provider}${cfg.model ? ' ' + cfg.model : ''}, suara ${cfg.voice}${cfg.style ? `, gaya "${cfg.style}"` : ''})${align ? `, waktu per kata lewat ${sttProvider()}` : ''}.`);
if (cfg.provider === 'say') console.log('  Suara Mac hanya untuk pratinjau. Untuk publikasi pakai Gemini: content-studio setup, lalu --provider gemini.');
let done = 0, failed = 0, requests = 0, stopped = '';
const lang = (reel.voice && reel.voice.language) || 'id';
const fresh = todo.filter(([k, s]) => args.force || !current(man.clips[k], s) || !existsSync(join(audioDir, man.clips[k].file)));
const alignOnly = todo.filter(x => !fresh.includes(x));

function clipOf(wav, file, s) {
  const w = readWav(wav), map = speechMap(w);
  return { file, dur: +w.duration.toFixed(3), map: { start: +map.start.toFixed(3), end: +map.end.toFixed(3), pauses: map.pauses.map(p => ({ from: +p.from.toFixed(3), to: +p.to.toFixed(3) })) }, provider: cfg.provider, voice: cfg.voice, style: cfg.style || '', model: cfg.model || '', text: s.vo, tts: ttsText(s.vo) };
}
async function wordsOf(wav) {
  if (!align) return null;
  try {
    const r = await stt(wav, { filename: 'vo.wav', mime: 'audio/wav', lang, words: true });
    return r.words.map(x => ({ word: x.word, start: +x.start.toFixed(3), end: +x.end.toFixed(3) }));
  } catch (e) { console.log(`  ! Waktu per kata gagal (${e.message.split('\n')[0]}). Memakai jeda di audio.`); return null; }
}
function done1(key, s, clip) {
  man.clips[key] = clip;
  done++;
  process.stdout.write(`  ✓ ${String(done + failed).padStart(2)}/${todo.length} ${clip.dur.toFixed(1)} dtk  ${String(s.vo).slice(0, 64)}${String(s.vo).length > 64 ? '…' : ''}\n`);
}
function failAll(list, e) {
  for (const [, s] of list) { failed++; console.log(`  ✗ ${String(s.vo).slice(0, 60)}: ${e.message}`); }
  if (e.status === 429) stopped = e.message;
}

/* Several lines in one request: the lines are joined by a long pause, then the audio is cut at the n-1 longest
   pauses. Each cut must be clearly longer than any pause inside a line, and each part's length must fit its
   line's word count; otherwise the lines are made one by one. Saves quota (Gemini's free tier allows a few
   TTS requests a day) and keeps one delivery across the reel. */
const SEP = { gemini: ' <long pause> <long pause> ', say: ' [[slnc 1600]] ' };
function splitBatch(wav, weights) {
  const n = weights.length, w = readWav(wav), map = speechMap(w);
  if (n === 1) return { parts: [[map.start, map.end]], w };
  const ps = map.pauses.map(p => ({ ...p, len: p.to - p.from })).sort((a, b) => b.len - a.len);
  if (ps.length < n - 1) return null;
  const cut = ps.slice(0, n - 1), minCut = Math.min(...cut.map(p => p.len)), next = ps[n - 1] ? ps[n - 1].len : 0;
  if (minCut < 0.5 || next > minCut * 0.8) return null;
  cut.sort((a, b) => a.from - b.from);
  const parts = [];
  let a = map.start;
  for (const p of cut) { parts.push([a, p.from]); a = p.to; }
  parts.push([a, map.end]);
  const tot = parts.reduce((x, [p, q]) => x + (q - p), 0), wt = weights.reduce((x, y) => x + y, 0);
  if (parts.some(([p, q], i) => { const r = ((q - p) / tot) / (weights[i] / wt); return r < 0.45 || r > 2.2; })) return null;
  return { parts, w };
}
/* Second way to cut a take: transcribe it, line the script words up with the heard words, and cut between the
   last word of one line and the first word of the next. Works whatever the pauses sound like. */
function splitByWords(wav, list, rec) {
  const w = readWav(wav), counts = list.map(([, s]) => voWords(ttsText(s.vo)).length), total = counts.reduce((a, b) => a + b, 0);
  if (rec.length < total * 0.6 || rec.length > total * 1.5) return null;
  const times = wordTimes(list.map(([, s]) => ttsText(s.vo)).join(' '), speechMap(w), rec);
  if (times.length !== total) return null;
  const parts = [];
  let i = 0;
  for (const c of counts) { parts.push([times[i].s, times[i + c - 1].e]); i += c; }
  for (let k = 1; k < parts.length; k++) if (parts[k][0] < parts[k - 1][1]) { const m = (parts[k][0] + parts[k - 1][1]) / 2; parts[k - 1][1] = m; parts[k][0] = m; }
  return parts.some(([a, b]) => b - a < 0.3) ? null : { parts, w };
}
function slice(w, from, to) {
  const fb = w.channels * 2, i = Math.max(0, Math.round(from * w.rate)) * fb, j = Math.min(w.pcm.length, Math.round(to * w.rate) * fb);
  return wavFromPcm(w.pcm.subarray(i, j), w.rate, w.channels);
}
async function single([key, s]) {
  const style = [cfg.style, s.tone].filter(Boolean).join('; ');
  try {
    requests++;
    const wav = await tts(cfg.provider, ttsText(s.vo), { ...cfg, style }), file = `vo-${key}.wav`;
    writeFileSync(join(audioDir, file), wav);
    const clip = clipOf(wav, file, s), words = await wordsOf(wav);
    if (words && words.length) clip.words = words;
    done1(key, s, clip);
  } catch (e) { failAll([[key, s]], e); if (e.code === 'NO_KEY') throw e; }
}
async function batch(list, style) {
  const text = list.map(([, s]) => ttsText(s.vo)).join(SEP[cfg.provider]);
  let wav;
  try { requests++; wav = await tts(cfg.provider, text, { ...cfg, style }); }
  catch (e) { failAll(list, e); if (e.code === 'NO_KEY') throw e; return; }
  let sp = splitBatch(wav, list.map(([, s]) => Math.max(1, voWords(ttsText(s.vo)).length))), all = null;
  if (!sp && align) { all = await wordsOf(wav); if (all && all.length) sp = splitByWords(wav, list, all); }
  if (!sp) {
    console.log(`  ! Batas antarkalimat di audio gabungan tidak jelas; ${list.length} kalimat dibuat satu per satu.`);
    for (const x of list) { if (stopped) { failAll([x], { message: stopped, status: 429 }); continue; } await single(x); }
    return;
  }
  /* Word times for the whole take at once, then shared out to the parts */
  if (!all) all = await wordsOf(wav);
  const P = sp.parts;
  P.forEach(([a, b], i) => {
    /* A little air around each line, never reaching into the next one */
    const lo = i ? (P[i - 1][1] + a) / 2 : 0, hi = i < P.length - 1 ? (b + P[i + 1][0]) / 2 : sp.w.duration;
    const [key, s] = list[i], from = Math.max(lo, a - 0.12), to = Math.min(hi, b + 0.3), file = `vo-${key}.wav`;
    const part = slice(sp.w, from, to);
    writeFileSync(join(audioDir, file), part);
    const clip = clipOf(part, file, s);
    const ws = all && all.filter(x => x.start >= a - 0.25 && x.end <= b + 0.35).map(x => ({ word: x.word, start: +(x.start - from).toFixed(3), end: +(x.end - from).toFixed(3) }));
    if (ws && ws.length) clip.words = ws;
    done1(key, s, clip);
  });
}
try {
  /* Same delivery in one request, up to about 700 words (Gemini reads up to ~10 minutes in one go) */
  const groups = new Map();
  for (const x of fresh) { const style = [cfg.style, x[1].tone].filter(Boolean).join('; '); if (!groups.has(style)) groups.set(style, []); groups.get(style).push(x); }
  for (const [style, list] of groups) {
    const chunks = [[]];
    let words = 0;
    for (const x of list) { const n = voWords(x[1].vo).length; if (chunks[chunks.length - 1].length && (words + n > 700 || chunks[chunks.length - 1].length >= 40)) { chunks.push([]); words = 0; } chunks[chunks.length - 1].push(x); words += n; }
    for (const c of chunks) {
      if (stopped) { failAll(c, { message: stopped, status: 429 }); continue; }
      if (args['no-batch'] || !SEP[cfg.provider] || c.length === 1) { for (const x of c) { if (stopped) failAll([x], { message: stopped, status: 429 }); else await single(x); } }
      else await batch(c, style);
    }
  }
  /* Audio already there, word times missing */
  for (const [key, s] of alignOnly) {
    const old = man.clips[key], wav = readFileSync(join(audioDir, old.file)), words = await wordsOf(wav);
    done1(key, s, { ...clipOf(wav, old.file, s), ...(words && words.length ? { words } : {}) });
  }
} catch (e) { fail(e.message, 2); }
if (requests) console.log(`  ${requests} permintaan ke ${cfg.provider === 'gemini' ? 'Gemini TTS' : 'suara Mac'}.`);
if (stopped) console.log(`  Kuota habis. Coba lagi nanti, atau naikkan tier di https://ai.dev/rate-limit. Klip yang sudah jadi tetap disimpan.`);
/* Keep only the clips this reel still uses */
for (const k of Object.keys(man.clips)) if (!want.has(k)) delete man.clips[k];
const keep = new Set(Object.values(man.clips).map(c => c.file));
for (const f of readdirSync(audioDir)) if (/^vo-[0-9a-f]+\.wav$/.test(f) && !keep.has(f)) rmSync(join(audioDir, f));
Object.assign(man, { provider: cfg.provider, model: cfg.model, voice: cfg.voice, style: cfg.style, updatedAt: new Date().toISOString() });
writeFileSync(manPath, JSON.stringify(man, null, 1) + '\n');
const total = [...want.keys()].reduce((n, k) => n + (man.clips[k] ? man.clips[k].dur : 0), 0);
console.log(`\n${failed ? `✗ ${failed} kalimat gagal. Jalankan ulang perintah ini untuk mencoba lagi.` : '✓ Voice over lengkap.'} ${Math.round(total)} detik suara di posts/${slug}/audio/.`);
console.log(`  Berikutnya: content-studio build ${slug}  (waktu teks dan subtitle mengikuti suara)\n`);
process.exit(failed ? 1 : 0);
