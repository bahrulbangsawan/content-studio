#!/usr/bin/env node
// content-studio: one command for carousels and reels. Each subcommand runs one script of the skill, so the CLI,
// Claude and the scripts all do the same thing. Run `content-studio help` for the list.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { SKILL_DIR, parseArgs, workspace } from './lib/common.mjs';
import { SETTINGS, lookup, set, unset, mask, readConfig, CONFIG_FILE, HOME_DIR } from './lib/config.mjs';
import { findChrome } from './lib/chrome.mjs';
import { ffmpegPath, ffprobePath } from './lib/ffmpeg.mjs';
import { request } from './lib/http.mjs';

const VERSION = (() => { try { return JSON.parse(readFileSync(join(SKILL_DIR, '.claude-plugin', 'plugin.json'), 'utf8')).version; } catch (e) { return '?'; } })();
const argv = process.argv.slice(2);
const cmd = argv[0], rest = argv.slice(1);
const S = f => join(SKILL_DIR, 'scripts', f);
function run(script, list) {
  const r = spawnSync(process.execPath, [S(script), ...list], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}
/* Positional slug for scripts that take --slug, keeping every other flag */
const withSlug = list => (list[0] && !list[0].startsWith('--') ? ['--slug', list[0], ...list.slice(1)] : list);
function isReel(list) {
  const a = parseArgs(list), slug = a.slug || a._[0];
  return slug && existsSync(join(workspace(a), 'posts', slug, 'reel.json'));
}

const HELP = `content-studio ${VERSION}: carousel dan Reels edukasi dengan design system akun yang dikunci.

Pakai: content-studio <perintah> [argumen]

Persiapan
  setup                         Simpan API key (Gemini, OpenAI, Magnific, Pexels) dan suara bawaan
  config list|get|set|unset     Lihat atau ubah satu pengaturan (config set gemini.apiKey -  membaca dari stdin)
  doctor [--online]             Cek Node, Chrome, ffmpeg, workspace, dan API key (--online: uji key ke layanannya)

Akun dan postingan
  brand list|init|accept ...    Akun brand (logo, warna, font, disclaimer)
  new <slug> --brand <akun> --title "..." [--reel]   Postingan carousel baru, atau reel dengan --reel

Bahan
  ig <link>                     Unduh foto, video, dan caption postingan Instagram ke refs/<kode>/
  transcribe <berkas|folder|link>   Video ke teks (.txt, .srt, waktu per kata) lewat OpenAI atau Gemini
  evidence search "<topik>"     Cari tinjauan sistematis dan uji klinis di PubMed, dengan kesimpulannya
  evidence cite <doi|pmid>      Entri sumber siap pakai untuk reel.json
  evidence verify <slug>        Cek setiap sumber: ada, tahunnya cocok, tidak ditarik
  footage search "<kata kunci>" [--type photo]   Footage dan foto stok tegak (Magnific atau Pexels), dengan lembar kontak
  footage get <provider>:<id> --slug <slug>       Unduh, potong ke 1080 x 1920, catat kreditnya
  footage mcp                   Pasang MCP Magnific di Claude Code (gambar dan video AI)

Reels
  voice <slug>                  Voice over per adegan (Gemini 3.8 Flash TTS; --provider say untuk pratinjau di Mac)
  voice list | voice try "<kalimat>" --voice <nama>   Daftar suara, coba satu suara
  srt <slug>                    Subtitle .srt dari waktu voice over

Bangun dan periksa (carousel atau reel, dikenali otomatis)
  scan <slug>                   Aturan isi: batas kata, frasa terlarang, sumber, gambar di setiap slide
  build <slug>                  Halaman studio posts/<slug>/<slug>.html
  verify <slug> [--frames]      Cek tata letak di Chrome dan buat pratinjau PNG
  check <slug>                  scan, build, dan verify sekaligus
  export <slug> [--hook N]      MP4, cover, SRT, dan caption ke posts/<slug>/export/ tanpa membuka halaman

Lainnya
  catalog --brand <akun>        Katalog semua komponen carousel dalam warna akun
  component list|new|check|audit   Komponen carousel buatan sendiri
  workspace pack|unpack         Bawa workspace dalam satu zip (Claude Desktop, pindah komputer)
  package                       ZIP skill untuk Claude Desktop dan claude.ai
  version

Workspace: ./content-studio di folder kerja (atau --root <folder>). Pengaturan: ${CONFIG_FILE.replace(process.env.HOME || '~', '~')}.`;

async function ask(rl, q, secret = false) {
  if (!secret) return new Promise(r => rl.question(q, a => r(a.trim())));
  return new Promise(r => {
    const out = rl._writeToOutput;
    rl._writeToOutput = s => { if (s.includes(q)) out.call(rl, s); else out.call(rl, '*'.repeat(Math.min(1, s.length))); };
    rl.question(q, a => { rl._writeToOutput = out; process.stdout.write('\n'); r(a.trim()); });
  });
}

async function setup() {
  if (!process.stdin.isTTY) {
    console.log(`setup butuh terminal interaktif. Tanpa terminal, simpan satu per satu:
  printf '%s' "$GEMINI_API_KEY" | content-studio config set gemini.apiKey -
  content-studio config set gemini.voice Sulafat
Atau set variabel lingkungan GEMINI_API_KEY, OPENAI_API_KEY, MAGNIFIC_API_KEY, PEXELS_API_KEY.`);
    return;
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  console.log(`\nSetup content-studio. Key disimpan di ${CONFIG_FILE.replace(process.env.HOME, '~')} (hanya bisa dibaca akun ini), tidak pernah di proyek atau repo.\nTekan Enter untuk melewati atau mempertahankan nilai sekarang.\n`);
  const steps = [
    ['gemini.apiKey', true, 'Gemini API key (voice over dan transkripsi), dari https://aistudio.google.com/apikey'],
    ['openai.apiKey', true, 'OpenAI API key (opsional: transkripsi dan waktu per kata)'],
    ['magnific.apiKey', true, 'Magnific API key (opsional: footage stok, paket berbayar)'],
    ['pexels.apiKey', true, 'Pexels API key (opsional: footage gratis, https://www.pexels.com/api/)'],
    ['ncbi.email', false, 'Email untuk PubMed dan Crossref (opsional, dianjurkan)'],
    ['gemini.voice', false, 'Suara voice over bawaan (lihat: content-studio voice list)'],
  ];
  for (const [key, secret, label] of steps) {
    const cur = lookup(key);
    const shown = cur.value ? (secret ? mask(cur.value) : cur.value) + (cur.from && cur.from !== 'config' ? ` (${cur.from})` : '') : 'belum ada';
    const a = await ask(rl, `${label}\n  [${shown}] > `, secret);
    if (a) { set(key, a); console.log('  ✓ tersimpan'); }
  }
  const claude = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['claude'], { encoding: 'utf8' }).status === 0;
  if (claude) {
    const a = await ask(rl, '\nPasang MCP Magnific di Claude Code untuk membuat gambar dan video AI? (y/T) > ');
    if (/^y/i.test(a)) spawnSync(process.execPath, [S('footage.mjs'), 'mcp'], { stdio: 'inherit' });
  }
  rl.close();
  console.log('\nSelesai. Cek semuanya dengan: content-studio doctor --online\n');
}

async function doctor(online) {
  const ok = (b, label, note = '') => console.log(`  ${b === true ? '✓' : b === false ? '✗' : '!'} ${label}${note ? `: ${note}` : ''}`);
  console.log(`\ncontent-studio ${VERSION} (${SKILL_DIR.replace(process.env.HOME || '', '~')})\n`);
  const [maj] = process.versions.node.split('.').map(Number);
  ok(maj >= 18, `Node ${process.versions.node}`, maj >= 18 ? '' : 'butuh 18 atau lebih baru');
  const chrome = findChrome();
  ok(chrome ? true : false, 'Chrome, Chromium, atau Edge', chrome ? chrome.replace(process.env.HOME || '', '~') : 'tidak ada: verify dan export tidak jalan. Pasang Chrome atau set CHROME_PATH');
  ok(ffmpegPath() ? true : null, 'ffmpeg', ffmpegPath() ? (ffprobePath() ? 'ada, dengan ffprobe' : 'ada, tanpa ffprobe') : 'tidak ada: dibutuhkan transcribe dan footage (brew install ffmpeg)');
  const py = spawnSync('python3', ['--version'], { encoding: 'utf8' });
  ok(py.status === 0 ? true : null, 'Python 3', py.status === 0 ? py.stdout.trim() : 'tidak ada: hanya dibutuhkan ig (unduh Instagram)');
  ok(existsSync(join(HOME_DIR, 'gallery-dl')) ? true : null, 'gallery-dl untuk ig', existsSync(join(HOME_DIR, 'gallery-dl')) ? 'terpasang' : 'dipasang otomatis saat pertama dipakai');
  const ws = workspace(parseArgs(rest));
  const brands = existsSync(join(ws, 'brands')) ? readdirSync(join(ws, 'brands')).filter(n => !n.startsWith('.')) : [];
  const posts = existsSync(join(ws, 'posts')) ? readdirSync(join(ws, 'posts')).filter(n => !n.startsWith('.')) : [];
  ok(existsSync(ws) ? true : null, 'Workspace', existsSync(ws) ? `${ws.replace(process.env.HOME || '', '~')}: ${brands.length} akun, ${posts.length} postingan` : `${ws.replace(process.env.HOME || '', '~')} belum ada (dibuat saat akun pertama disiapkan)`);
  console.log('\nAPI key (opsional; yang kosong hanya menonaktifkan fitur itu):');
  const keys = [['gemini.apiKey', 'Gemini: voice over, transkripsi'], ['openai.apiKey', 'OpenAI: transkripsi'], ['magnific.apiKey', 'Magnific: footage stok'], ['pexels.apiKey', 'Pexels: footage gratis'], ['ncbi.email', 'Email PubMed dan Crossref']];
  for (const [k, label] of keys) {
    const v = lookup(k);
    let status = v.value ? true : null, note = v.value ? `${SETTINGS[k].secret ? mask(v.value) : v.value} (${v.from})` : 'belum ada';
    if (online && v.value && SETTINGS[k].secret) {
      try {
        if (k === 'gemini.apiKey') await request('Gemini', 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', { headers: { 'x-goog-api-key': v.value }, retries: 0, timeout: 20000 });
        if (k === 'openai.apiKey') await request('OpenAI', 'https://api.openai.com/v1/models', { headers: { authorization: `Bearer ${v.value}` }, retries: 0, timeout: 20000 });
        if (k === 'pexels.apiKey') await request('Pexels', 'https://api.pexels.com/v1/search?query=test&per_page=1', { headers: { authorization: v.value }, retries: 0, timeout: 20000 });
        if (k === 'magnific.apiKey') await request('Magnific', 'https://api.magnific.com/v1/videos?term=test&page=1', { headers: { 'x-magnific-api-key': v.value }, retries: 0, timeout: 20000, ok: [404] });
        note += ', diterima';
      } catch (e) { status = false; note += `, ${e.message}`; }
    }
    ok(status, label, note);
  }
  if (online) {
    try { await request('PubMed', 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/einfo.fcgi?db=pubmed&retmode=json', { retries: 0, timeout: 20000 }); ok(true, 'PubMed dan internet'); }
    catch (e) { ok(false, 'PubMed', e.message); }
  }
  const preset = lookup('gemini.voicePreset');
  console.log(`\nVoice over: preset ${preset.value} (lihat semua: content-studio voice list). Ubah bawaan: content-studio config set gemini.voicePreset <nama>\n`);
}

function config(list) {
  const [sub, key, ...v] = list;
  if (!sub || sub === 'list') {
    console.log(`\nPengaturan (${CONFIG_FILE.replace(process.env.HOME || '', '~')}):\n`);
    for (const [k, s] of Object.entries(SETTINGS)) {
      const r = lookup(k);
      console.log(`  ${k.padEnd(24)}${r.value ? (s.secret ? mask(r.value) : r.value) : '-'}${r.from && r.from !== 'config' ? `  (${r.from})` : ''}`);
    }
    console.log('');
    return;
  }
  if (!SETTINGS[key]) { console.error(`Pengaturan tidak dikenal: ${key || '(kosong)'}. Pilihan:\n  ${Object.keys(SETTINGS).join('\n  ')}`); process.exit(1); }
  if (sub === 'get') { const r = lookup(key); console.log(SETTINGS[key].secret ? mask(r.value) : r.value ?? ''); return; }
  if (sub === 'unset') { unset(key); console.log(`✓ ${key} dihapus.`); return; }
  if (sub === 'set') {
    let value = v.join(' ');
    if (value === '-' || (!value && !process.stdin.isTTY)) value = readFileSync(0, 'utf8').trim();
    if (!value) { console.error(`Pakai: content-studio config set ${key} <nilai>   (atau "-" untuk membaca dari stdin)`); process.exit(1); }
    if (SETTINGS[key].secret && v.length && v[0] !== '-') console.log('  Catatan: key yang diketik di baris perintah tersimpan di riwayat shell. Lain kali pakai "content-studio setup" atau stdin.');
    set(key, value);
    console.log(`✓ ${key} = ${SETTINGS[key].secret ? mask(value) : value}`);
    return;
  }
  console.error('Pakai: content-studio config list|get|set|unset <kunci> [nilai]');
  process.exit(1);
}

switch (cmd) {
  case undefined: case 'help': case '-h': case '--help': console.log(HELP); break;
  case 'version': case '--version': case '-v': console.log(VERSION); break;
  case 'setup': await setup(); break;
  case 'config': config(rest); break;
  case 'doctor': await doctor(rest.includes('--online')); break;
  case 'brand': run('brand.mjs', rest); break;
  case 'new': {
    const reel = rest.includes('--reel');
    const list = withSlug(rest.filter(x => x !== '--reel' && x !== '--carousel'));
    run(reel ? 'reel.mjs' : 'new-post.mjs', reel ? ['new', ...list] : list);
    break;
  }
  case 'ig': case 'ref': run('ref.mjs', rest); break;
  case 'transcribe': run('transcribe.mjs', rest); break;
  case 'evidence': run('evidence.mjs', rest); break;
  case 'footage': run('footage.mjs', rest); break;
  case 'voice': run('voice.mjs', rest); break;
  case 'srt': run('reel.mjs', ['srt', ...rest]); break;
  case 'scan': case 'build': case 'verify':
    if (isReel(rest)) run('reel.mjs', [cmd, ...rest]);
    else run(`${cmd}.mjs`, withSlug(rest));
    break;
  case 'check': {
    const reel = isReel(rest);
    const steps = reel ? [['reel.mjs', ['build', ...rest]], ['reel.mjs', ['verify', ...rest]]] : [['build.mjs', withSlug(rest)], ['verify.mjs', withSlug(rest)]];
    for (const [s, l] of steps) { const r = spawnSync(process.execPath, [S(s), ...l], { stdio: 'inherit' }); if (r.status) process.exit(r.status); }
    break;
  }
  case 'export': run('export.mjs', rest); break;
  case 'catalog': run('catalog.mjs', rest); break;
  case 'component': run('component.mjs', rest); break;
  case 'workspace': run('workspace.mjs', rest); break;
  case 'package': run('package.mjs', rest); break;
  default:
    console.error(`Perintah tidak dikenal: ${cmd}\n`);
    console.log(HELP);
    process.exit(1);
}
