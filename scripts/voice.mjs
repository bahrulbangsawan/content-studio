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
import { readWav, speechMap } from './lib/audio.mjs';
import { voKey } from './lib/reel-render.mjs';
import { get } from './lib/config.mjs';

const args = parseArgs();
const cmd = args._[0];
if (!cmd) fail('Pakai: node voice.mjs <slug> | list | try "<kalimat>"');

function settings(reel = {}) {
  const v = reel.voice || {};
  const provider = args.provider || v.provider || (get('gemini.apiKey') ? 'gemini' : process.platform === 'darwin' ? 'say' : 'gemini');
  if (provider === 'none') fail('reel.json memakai voice.provider "none": video ini tanpa suara.');
  const voice = args.voice || v.voice || (provider === 'say' ? 'Damayanti' : get('gemini.voice'));
  const style = args.style ?? v.style ?? (provider === 'gemini' ? get('gemini.style') : '');
  const model = provider === 'gemini' ? args.model || v.model || get('gemini.ttsModel') : '';
  return { provider, voice: provider === 'say' && !/^[A-Z]/.test(voice) ? 'Damayanti' : voice, style, model };
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
const audioDir = join(dir, 'audio');
mkdirSync(audioDir, { recursive: true });
const manPath = join(audioDir, 'voice.json');
const man = existsSync(manPath) ? JSON.parse(readFileSync(manPath, 'utf8')) : { clips: {} };
const scenes = [...reel.scenes, ...(reel.hooks || []), ...(reel.closings || [])].filter(s => s && s.vo && String(s.vo).trim());
const want = new Map(scenes.map(s => [voKey(s), s]));
const align = !args['no-align'] && !!sttProvider();
const sameVoice = c => c && c.provider === cfg.provider && c.voice === cfg.voice && (c.style || '') === (cfg.style || '') && (c.model || '') === (cfg.model || '');
const todo = [...want.entries()].filter(([k]) => args.force || !sameVoice(man.clips[k]) || !existsSync(join(audioDir, man.clips[k].file)) || (align && !man.clips[k].words));

console.log(`\nVoice over posts/${slug}: ${want.size} kalimat, ${todo.length} perlu dibuat (${cfg.provider}${cfg.model ? ' ' + cfg.model : ''}, suara ${cfg.voice}${cfg.style ? `, gaya "${cfg.style}"` : ''})${align ? `, waktu per kata lewat ${sttProvider()}` : ''}.`);
if (cfg.provider === 'say') console.log('  Suara Mac hanya untuk pratinjau. Untuk publikasi pakai Gemini: content-studio setup, lalu --provider gemini.');
let done = 0, failed = 0;
async function one([key, s]) {
  const old = man.clips[key];
  const style = [cfg.style, s.tone].filter(Boolean).join('; ');
  try {
    let wav, file = `vo-${key}.wav`;
    if (sameVoice(old) && existsSync(join(audioDir, old.file)) && !args.force) wav = readFileSync(join(audioDir, old.file));
    else { wav = await tts(cfg.provider, s.vo, { ...cfg, style }); writeFileSync(join(audioDir, file), wav); }
    const w = readWav(wav), map = speechMap(w);
    const clip = { file, dur: +w.duration.toFixed(3), map: { start: +map.start.toFixed(3), end: +map.end.toFixed(3), pauses: map.pauses.map(p => ({ from: +p.from.toFixed(3), to: +p.to.toFixed(3) })) }, provider: cfg.provider, voice: cfg.voice, style: cfg.style || '', model: cfg.model || '', text: s.vo };
    if (align) {
      try {
        const r = await stt(wav, { filename: 'vo.wav', mime: 'audio/wav', lang: (reel.voice && reel.voice.language) || 'id', words: true });
        if (r.words.length) clip.words = r.words.map(x => ({ word: x.word, start: +x.start.toFixed(3), end: +x.end.toFixed(3) }));
      } catch (e) { console.log(`  ! Waktu per kata gagal untuk satu kalimat (${e.message.split('\n')[0]}). Memakai jeda di audio.`); }
    }
    man.clips[key] = clip;
    done++;
    process.stdout.write(`  ✓ ${String(done + failed).padStart(2)}/${todo.length} ${clip.dur.toFixed(1)} dtk  ${String(s.vo).slice(0, 64)}${String(s.vo).length > 64 ? '…' : ''}\n`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${String(s.vo).slice(0, 60)}: ${e.message}`);
    if (e.code === 'NO_KEY') throw e;
  }
}
try {
  const width = cfg.provider === 'gemini' ? 3 : 1, queue = [...todo];
  await Promise.all(Array.from({ length: Math.min(width, queue.length) }, async () => { while (queue.length) await one(queue.shift()); }));
} catch (e) { fail(e.message, 2); }
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
