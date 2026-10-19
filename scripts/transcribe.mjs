#!/usr/bin/env node
// Transcribe the speech in a video or audio file, every media file in a folder, or an Instagram post or reel
// (downloaded first with ref.mjs). Writes <name>.transcript.txt, <name>.srt and <name>.words.json beside each
// file and prints the text, so a reference reel can be read, quoted and restructured.
// Usage: node transcribe.mjs <file | folder | instagram-link> [--provider openai|gemini] [--lang id] [--text-only] [--model M]
// Word times (for the .srt) use whisper-1 on OpenAI or Gemini 3.5 Transcribe; --text-only uses OpenAI's newest text model.
import { existsSync, statSync, readdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, basename, dirname, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { parseArgs, workspace, fail, SKILL_DIR } from './lib/common.mjs';
import { stt, sttProvider } from './lib/speech.mjs';
import { ffmpeg, ffmpegPath, probe } from './lib/ffmpeg.mjs';
import { srtTime } from './lib/reel-time.mjs';

const args = parseArgs();
const root = workspace(args);
let target = args._[0];
if (!target) fail('Pakai: node transcribe.mjs <berkas | folder | link Instagram> [--provider openai|gemini] [--lang id] [--text-only]');
const MEDIA = new Set(['.mp4', '.mov', '.m4v', '.webm', '.mkv', '.mp3', '.m4a', '.wav', '.aac', '.ogg', '.flac', '.opus']);
const MIME = { '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.aac': 'audio/aac', '.ogg': 'audio/ogg', '.flac': 'audio/flac', '.opus': 'audio/ogg' };
const provider = sttProvider(args.provider);
if (!provider) fail('Transkripsi butuh OpenAI atau Gemini API key. Simpan sekali dengan: content-studio setup', 2);

/* An Instagram link: fetch it with ref.mjs into refs/<code>/, then transcribe what came down */
if (/^https?:\/\/(www\.)?instagram\.com\//i.test(target)) {
  const code = (target.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/) || [])[1];
  if (!code) fail('Link Instagram tidak dikenali. Contoh: https://www.instagram.com/reel/ABC123/');
  const r = spawnSync(process.execPath, [join(SKILL_DIR, 'scripts', 'ref.mjs'), target, ...(args.root ? ['--root', args.root] : []), ...(args.browser ? ['--browser', args.browser] : []), ...(args.cookies ? ['--cookies', args.cookies] : [])], { stdio: 'inherit' });
  if (r.status !== 0) fail('Unduhan dari Instagram gagal (lihat pesan di atas).', r.status || 1);
  target = join(root, 'refs', code);
}
if (!existsSync(target)) fail(`Tidak ditemukan: ${target}`);
const files = statSync(target).isDirectory()
  ? walk(target).filter(f => MEDIA.has(extname(f).toLowerCase()))
  : [target];
function walk(d) { return readdirSync(d).flatMap(n => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; }); }
if (!files.length) fail(`Tidak ada video atau audio di ${target}.`);

const words = !args['text-only'];
const lang = args.lang || 'id';
const tmp = mkdtempSync(join(tmpdir(), 'cs-stt-'));
/* Speech as a small mono MP3 (16 kHz, 48 kbps: about 21 MB per hour), split into 20-minute parts when longer */
function audioParts(file) {
  const ext = extname(file).toLowerCase();
  if (!ffmpegPath()) {
    if (MIME[ext] && statSync(file).size < 24 * 1024 * 1024) return [{ buf: readFileSync(file), mime: MIME[ext], name: basename(file), offset: 0 }];
    fail('Video perlu ffmpeg untuk diambil suaranya. Pasang: brew install ffmpeg (macOS) atau sudo apt install ffmpeg.');
  }
  const p = probe(file);
  if (p && !p.audio) return [];
  const dur = (p && p.duration) || 0, part = 1200, out = [];
  for (let s = 0; s < Math.max(dur, 1); s += part) {
    const f = join(tmp, `a-${out.length}.mp3`);
    ffmpeg(['-ss', String(s), '-t', String(part), '-i', file, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '48k', f], 'Mengambil suara dari video');
    out.push({ buf: readFileSync(f), mime: 'audio/mpeg', name: `a-${out.length}.mp3`, offset: s });
    if (!dur) break;
  }
  return out;
}
function srt(ws) {
  const lines = [];
  let cur = [];
  const flush = () => { if (cur.length) lines.push(cur); cur = []; };
  ws.forEach((w, k) => {
    const len = cur.reduce((n, x) => n + x.word.length + 1, 0) + w.word.length;
    if (cur.length && (len > 42 || cur.length >= 8 || w.start - cur[cur.length - 1].end > 0.6)) flush();
    cur.push(w);
    if (/[.!?]$/.test(w.word)) flush();
  });
  flush();
  return lines.map((l, k) => `${k + 1}\n${srtTime(l[0].start)} --> ${srtTime(l[l.length - 1].end + 0.15)}\n${l.map(w => w.word.trim()).join(' ')}\n`).join('\n');
}

let code = 0;
console.log(`\nTranskripsi ${files.length} berkas lewat ${provider}${words ? ' dengan waktu per kata' : ''}, bahasa ${lang}.\n`);
try {
  for (const file of files) {
    const parts = audioParts(file);
    if (!parts.length) { console.log(`  · ${relative(process.cwd(), file)}: tanpa suara, dilewati.`); continue; }
    let text = '', ws = [];
    for (const a of parts) {
      const r = await stt(a.buf, { provider, filename: a.name, mime: a.mime, lang, words, model: args.model });
      text += (text ? ' ' : '') + r.text;
      ws.push(...r.words.map(w => ({ word: String(w.word).trim(), start: +(w.start + a.offset).toFixed(3), end: +(w.end + a.offset).toFixed(3) })));
    }
    const stem = join(dirname(file), basename(file, extname(file)));
    writeFileSync(`${stem}.transcript.txt`, text.trim() + '\n');
    if (ws.length) {
      writeFileSync(`${stem}.words.json`, JSON.stringify(ws, null, 1) + '\n');
      writeFileSync(`${stem}.srt`, srt(ws));
    }
    const sec = ws.length ? ws[ws.length - 1].end : 0;
    console.log(`  ✓ ${relative(process.cwd(), file)}${sec ? ` (${Math.round(sec)} detik, ${ws.length} kata, ${(ws.length / Math.max(1, sec)).toFixed(1).replace('.', ',')} kata/detik)` : ''}`);
    console.log(`    ${relative(process.cwd(), stem)}.transcript.txt${ws.length ? ', .srt, .words.json' : ''}\n`);
    console.log(text.trim().replace(/(.{1,96})(\s|$)/g, '    $1\n'));
  }
} catch (e) {
  console.error(`\n✗ ${e.message}\n`);
  code = e.code === 'NO_KEY' ? 2 : 1;
} finally { rmSync(tmp, { recursive: true, force: true }); }
process.exit(code);
