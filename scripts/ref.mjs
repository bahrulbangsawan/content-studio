#!/usr/bin/env node
// Download an Instagram post (images, videos, caption) into refs/<shortcode>/ as reference material.
// Usage: node ref.mjs <link> [--browser chrome|"chrome:Profile 1"|firefox|safari] [--cookies <cookies.txt>] [--force] [--root <workspace>]
//        node ref.mjs --setup     install the pinned gallery-dl into ~/.content-studio/gallery-dl
//        node ref.mjs --update    upgrade gallery-dl when Instagram changes and rewrite the pin
// gallery-dl lives in a private venv in the user's folder (the skill folder may be read-only, e.g. a plugin),
// pinned by tools/requirements.txt. CONTENT_STUDIO_HOME moves that folder.
// Videos also become still frames and one contact sheet (ffmpeg), because the AI reads images, not video.
// Exit codes: 1 error, 3 Instagram asked for a login.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve, extname, basename } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { SKILL_DIR, parseArgs, workspace, fail, countWords } from './lib/common.mjs';

const TOOLS_DIR = join(SKILL_DIR, 'tools');
const HOME_DIR = process.env.CONTENT_STUDIO_HOME || join(homedir(), '.content-studio');
const VENV = join(HOME_DIR, 'gallery-dl');
const VENV_LABEL = process.env.CONTENT_STUDIO_HOME ? VENV : '~/.content-studio/gallery-dl';
const REQUIREMENTS = join(TOOLS_DIR, 'requirements.txt');
const WIN = process.platform === 'win32';
const venvBin = name => join(VENV, WIN ? 'Scripts' : 'bin', WIN ? `${name}.exe` : name);
const VIDEO_EXT = new Set(['.mp4', '.mov', '.m4v', '.webm']);
const MAX_FRAMES = 12;
const SHEET_COLS = 4;

const LOGIN_HELP = `Instagram meminta login (dialihkan ke halaman login), jadi tidak ada yang terunduh.
  Login Instagram di Chrome, sebaiknya dengan akun cadangan (bukan akun brand), lalu ulangi.
  Login di profil Chrome lain:   --browser "chrome:Profile 1"
  Browser lain:                  --browser firefox   atau   --browser safari
  Berkas cookies.txt (Netscape): --cookies <path>`;

const run = (cmd, argv, opts = {}) => spawnSync(cmd, argv, { encoding: 'utf8', ...opts });
const has = (cmd, flag = '--version') => run(cmd, [flag]).status === 0;
const tail = (text, n = 8) => String(text || '').trim().split('\n').slice(-n).join('\n');

/** Path to the skill's own gallery-dl, installing it on first use (uv when available, else python -m venv). */
export function ensureGalleryDl({ update = false } = {}) {
  const gdl = venvBin('gallery-dl');
  if (existsSync(gdl) && !update) return gdl;
  const python = venvBin('python');
  const uv = has('uv');
  console.log(update ? `Memperbarui gallery-dl di ${VENV_LABEL}…` : `Memasang gallery-dl ke ${VENV_LABEL} (sekali saja)…`);
  mkdirSync(HOME_DIR, { recursive: true });
  if (!existsSync(python)) {
    const r = uv ? run('uv', ['venv', '--quiet', VENV]) : run(WIN ? 'python' : 'python3', ['-m', 'venv', VENV]);
    if (r.status !== 0) fail(`Gagal membuat ${VENV_LABEL}. Butuh uv atau Python 3.\n${tail(r.stderr || r.error?.message)}`);
  }
  const spec = update ? ['-U', 'gallery-dl'] : ['-r', REQUIREMENTS];
  const r = uv ? run('uv', ['pip', 'install', '--quiet', '--python', python, ...spec])
    : run(python, ['-m', 'pip', 'install', '--quiet', ...spec]);
  if (r.status !== 0 || !existsSync(gdl)) fail(`Gagal memasang gallery-dl.\n${tail(r.stderr || r.error?.message)}`);
  if (update) {
    const pin = readFileSync(REQUIREMENTS, 'utf8').replace(/^gallery-dl==.*$/m, `gallery-dl==${galleryDlVersion(gdl)}`);
    try { writeFileSync(REQUIREMENTS, pin); } catch (e) { console.log('  Folder skill hanya-baca: versi baru dipakai, tetapi pin di tools/requirements.txt tidak diubah.'); }
  }
  return gdl;
}

const galleryDlVersion = gdl => (run(gdl, ['--version']).stdout || '').trim();

/** Shortcode from /p/, /reel/, /reels/ or /tv/ links, with or without a username segment. */
export function shortcodeOf(url) {
  const m = String(url).match(/^https?:\/\/(?:www\.)?instagram\.com\/(?:[\w.]+\/)?(?:p|reels?|tv)\/([\w-]+)/);
  return m ? m[1] : null;
}

function download(gdl, url, mediaDir, args) {
  const cookies = args.cookies ? ['--cookies', resolve(String(args.cookies))]
    : ['--cookies-from-browser', typeof args.browser === 'string' ? args.browser : 'chrome'];
  // videos=merged takes the single progressive mp4; the DASH default would need yt-dlp.
  const r = run(gdl, ['-D', mediaDir, '-f', '{num:>02}.{extension}', '--write-metadata', '--no-mtime',
    '-o', 'videos=merged', ...cookies, url]);
  const log = `${r.stdout}\n${r.stderr}`;
  const ok = existsSync(mediaDir) && readdirSync(mediaDir).some(f => !f.endsWith('.json'));
  const login = !ok && /redirect to login page|login required|checkpoint required/i.test(log);
  return { ok, login, error: `gallery-dl tidak mengunduh apa pun (kode ${r.status}).\n${tail(log)}` };
}

function probe(file) {
  const r = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height', '-of', 'json', file]);
  if (r.status !== 0) return null;
  const j = JSON.parse(r.stdout);
  const video = j.streams.find(s => s.codec_type === 'video');
  return {
    duration: Math.round(Number(j.format.duration) * 10) / 10,
    width: video?.width, height: video?.height,
    audio: j.streams.some(s => s.codec_type === 'audio'),
  };
}

/** Evenly spaced frames (about one per 2 s, 4 to 12) plus a contact sheet, for one video. */
function frames(file, framesDir, stem, duration) {
  const count = Math.max(4, Math.min(MAX_FRAMES, Math.round(duration / 2)));
  mkdirSync(framesDir, { recursive: true });
  const pattern = join(framesDir, `${stem}-%02d.jpg`);
  let r = run('ffmpeg', ['-v', 'error', '-y', '-i', file, '-vf', `fps=${(count / duration).toFixed(4)},scale=540:-2`,
    '-frames:v', String(count), '-q:v', '3', pattern]);
  if (r.status !== 0) return { error: tail(r.stderr, 2) };
  const list = readdirSync(framesDir).filter(f => new RegExp(`^${stem}-\\d{2}\\.jpg$`).test(f)).sort();
  const sheet = `${stem}-sheet.jpg`;
  r = run('ffmpeg', ['-v', 'error', '-y', '-i', pattern, '-vf',
    `scale=270:-2,tile=${SHEET_COLS}x${Math.ceil(list.length / SHEET_COLS)}:padding=4:color=white`, '-frames:v', '1', join(framesDir, sheet)]);
  // The fps filter picks the frame nearest the middle of each interval.
  const step = duration / count;
  return {
    frames: list.map((f, i) => ({ file: `frames/${f}`, t: Math.round((i + 0.5) * step * 10) / 10 })),
    sheet: r.status === 0 ? `frames/${sheet}` : null,
  };
}

/** Turn a gallery-dl media folder into ref.json, caption.txt and video frames. Returns the ref object. */
export function buildRef(dir, url) {
  const mediaDir = join(dir, 'media');
  const framesDir = join(dir, 'frames');
  const ffmpeg = has('ffmpeg', '-version') && has('ffprobe', '-version');
  const files = readdirSync(mediaDir).filter(f => !f.endsWith('.json')).sort();
  let post = {};
  const items = files.map((f, i) => {
    const metaPath = join(mediaDir, `${f}.json`);
    const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) : {};
    if (!post.shortcode && meta.post_shortcode) post = {
      shortcode: meta.post_shortcode, username: meta.username, fullname: meta.fullname,
      date: meta.post_date || meta.date, likes: meta.likes, caption: meta.description || '', tags: meta.tags || [],
    };
    const video = VIDEO_EXT.has(extname(f).toLowerCase());
    const item = { n: meta.num ?? i + 1, type: video ? 'video' : 'image', file: `media/${f}`, width: meta.width, height: meta.height };
    if (video && ffmpeg) {
      const info = probe(join(mediaDir, f));
      if (info) Object.assign(item, info, frames(join(mediaDir, f), framesDir, basename(f, extname(f)), info.duration));
    }
    return item;
  });
  const ref = {
    url, ...post,
    fetched_at: new Date().toISOString(),
    tool: `gallery-dl ${galleryDlVersion(venvBin('gallery-dl'))}`.trim(),
    note: 'Bahan referensi. Pelajari struktur, urutan, dan idenya; tulis ulang isinya dengan suara dan design system akun sendiri.',
    ...(ffmpeg ? {} : { warning: 'ffmpeg tidak ditemukan, jadi video tidak dipecah menjadi frame.' }),
    items,
  };
  writeFileSync(join(dir, 'ref.json'), JSON.stringify(ref, null, 2) + '\n');
  writeFileSync(join(dir, 'caption.txt'), (post.caption || '') + '\n');
  return ref;
}

function summary(rel, ref) {
  const count = t => ref.items.filter(i => i.type === t).length;
  console.log(`\n✓ Referensi: ${rel}/ (${count('image')} gambar, ${count('video')} video, caption ${countWords(ref.caption)} kata)`);
  console.log(`  ${rel}/ref.json      metadata, caption, daftar file`);
  for (const it of ref.items) {
    if (it.type === 'image') console.log(`  ${rel}/${it.file}`);
    else console.log(`  ${rel}/${it.sheet || it.file}   video ${it.n}: ${it.duration ?? '?'} detik, ${it.audio ? 'ada audio' : 'tanpa audio'}, ${it.frames?.length ?? 0} frame`);
  }
  if (ref.warning) console.log(`  ! ${ref.warning}`);
  console.log('  Lihat gambar dan lembar frame itu dengan alat baca gambar sebelum menulis post.json.\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const args = parseArgs();
  if (args.setup || args.update) {
    const gdl = ensureGalleryDl({ update: !!args.update });
    console.log(`✓ gallery-dl ${galleryDlVersion(gdl)} di ${VENV_LABEL}`);
    console.log(has('ffmpeg', '-version') ? '✓ ffmpeg tersedia (video dipecah menjadi frame)' : '! ffmpeg tidak ditemukan: video tetap terunduh, tapi tanpa frame. Pasang dengan `brew install ffmpeg`.');
    process.exit(0);
  }
  const url = args._[0];
  const code = url && shortcodeOf(url);
  if (!code) fail('Pakai: node ref.mjs <link postingan Instagram> (bentuk /p/<kode>/, /reel/<kode>/, atau /tv/<kode>/)');
  const dir = join(workspace(args), 'refs', code);
  const rel = `refs/${code}`;
  if (existsSync(join(dir, 'ref.json')) && !args.force) {
    console.log(`${rel}/ sudah ada. Pakai --force untuk mengunduh ulang.`);
    summary(rel, JSON.parse(readFileSync(join(dir, 'ref.json'), 'utf8')));
    process.exit(0);
  }
  rmSync(dir, { recursive: true, force: true });
  const gdl = ensureGalleryDl();
  const got = download(gdl, url, join(dir, 'media'), args);
  if (!got.ok) {
    rmSync(dir, { recursive: true, force: true });
    if (got.login) fail(LOGIN_HELP, 3);
    fail(got.error);
  }
  summary(rel, buildRef(dir, url));
}
