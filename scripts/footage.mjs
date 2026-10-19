#!/usr/bin/env node
// Stock footage and photos for reels. Search Magnific (formerly Freepik; API needs a paid plan) or Pexels
// (free key), look at the numbered contact sheet, then download one into posts/<slug>/media/, cut to fit
// (1080 x 1920 or its own shape, short, no sound, H.264) and credited in media/credits.json.
// Usage: node footage.mjs search "<kata kunci, sebaiknya bahasa Inggris>" [--type video|photo] [--provider magnific|pexels]
//                                [--n 12] [--any-shape] [--free]
//        node footage.mjs get <provider>:<id> --slug <slug> [--name nama.mp4] [--start 2] [--length 8] [--fit cover|keep]
//        node footage.mjs fit <slug> <berkas> [--start s] [--length s] [--fit cover|keep]   perkecil berkas yang sudah ada
//        node footage.mjs mcp     pasang MCP Magnific di Claude Code (membuat gambar dan video AI, bukan stok)
import { existsSync, mkdirSync, writeFileSync, readFileSync, statSync, rmSync, renameSync, readdirSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { parseArgs, workspace, fail, slugify, esc } from './lib/common.mjs';
import { request, download, ApiError } from './lib/http.mjs';
import { get } from './lib/config.mjs';
import { ffmpeg, probe, needFfmpeg } from './lib/ffmpeg.mjs';
import { findChrome, launch } from './lib/chrome.mjs';
import { REEL_MEDIA_MAX } from './lib/reel-rules.mjs';

const args = parseArgs();
const root = workspace(args);
const cmd = args._[0];
const HELP = 'Pakai: node footage.mjs search "<kata kunci>" | get <provider>:<id> --slug <slug> | fit <slug> <berkas> | mcp';
if (!cmd) fail(HELP);
const MAG = () => process.env.CONTENT_STUDIO_MAGNIFIC_BASE || 'https://api.magnific.com';
const PEX = () => process.env.CONTENT_STUDIO_PEXELS_BASE || 'https://api.pexels.com';

function pickProvider(want) {
  const p = want || get('footage.provider');
  if (p === 'magnific' || p === 'pexels') {
    if (!get(`${p}.apiKey`)) fail(`${p === 'magnific' ? 'Magnific' : 'Pexels'} butuh API key. Simpan dengan: content-studio setup   (atau: content-studio config set ${p}.apiKey)`, 2);
    return p;
  }
  if (get('magnific.apiKey')) return 'magnific';
  if (get('pexels.apiKey')) return 'pexels';
  fail('Pencarian footage butuh API key Magnific (berbayar) atau Pexels (gratis: https://www.pexels.com/api/). Simpan dengan: content-studio setup', 2);
}
const magH = () => ({ 'x-magnific-api-key': get('magnific.apiKey'), 'accept-language': 'en-US' });
const pexH = () => ({ authorization: get('pexels.apiKey') });
const dur = v => { if (typeof v === 'number') return v; const p = String(v || '').split(':').map(Number); return p.reduce((n, x) => n * 60 + (x || 0), 0); };

/* ---------------- Search ---------------- */
async function searchMagnific(q, type, n, { vertical, free }) {
  const qs = new URLSearchParams({ term: q, page: '1', order: 'relevance' });
  if (type === 'video') {
    qs.set('per_page', String(n));
    if (vertical) qs.append('filters[orientation]', 'vertical');
    if (free) qs.append('filters[license][free]', '1');
    qs.append('filters[duration][from]', '3');
    const { status, data } = await request('Magnific', `${MAG()}/v1/videos?${qs}`, { headers: magH(), ok: [404] });
    const items = status === 404 || !data ? [] : data.data || [];
    return items.map(v => {
      const th = (v.thumbnails || [])[0] || {}, pv = (v.previews || [])[0] || {};
      return { provider: 'magnific', id: String(v.id), kind: 'video', title: v.name || '', duration: dur(v.duration), width: th.width || pv.width || 0, height: th.height || pv.height || 0, aspect: v.aspect_ratio || v['aspect-ratio'] || th.aspect_ratio || '', thumb: th.url || '', preview: pv.url || '', url: v.url || '', author: (v.author && v.author.name) || '', premium: !!(v.premium === true || v.premium === 1), quality: v.quality || '' };
    });
  }
  qs.set('limit', String(n));
  qs.append('filters[content_type][photo]', '1');
  if (vertical) qs.append('filters[orientation][portrait]', '1');
  if (free) qs.append('filters[license][freemium]', '1');
  const { status, data } = await request('Magnific', `${MAG()}/v1/resources?${qs}`, { headers: magH(), ok: [404] });
  return (status === 404 || !data ? [] : data.data || []).map(r => {
    const size = String((r.image && r.image.source && r.image.source.size) || '').split('x').map(Number);
    return { provider: 'magnific', id: String(r.id), kind: 'photo', title: r.title || '', width: size[0] || 0, height: size[1] || 0, thumb: (r.image && r.image.source && r.image.source.url) || '', url: r.url || '', author: (r.author && r.author.name) || '', premium: (r.licenses || []).some(l => l.type === 'premium') && !(r.licenses || []).some(l => l.type === 'freemium') };
  });
}
async function searchPexels(q, type, n, { vertical }) {
  const qs = new URLSearchParams({ query: q, per_page: String(Math.min(80, n)), page: '1', locale: 'id-ID' });
  if (vertical) qs.set('orientation', 'portrait');
  if (type === 'video') {
    qs.set('size', 'medium');
    const { data } = await request('Pexels', `${PEX()}/videos/search?${qs}`, { headers: pexH() });
    return (data.videos || []).map(v => ({ provider: 'pexels', id: String(v.id), kind: 'video', title: (v.url || '').split('/').filter(Boolean).pop()?.replace(/-\d+$/, '').replace(/-/g, ' ') || '', duration: v.duration || 0, width: v.width, height: v.height, thumb: v.image || '', url: v.url, author: (v.user && v.user.name) || '', premium: false }));
  }
  const { data } = await request('Pexels', `${PEX()}/v1/search?${qs}`, { headers: pexH() });
  return (data.photos || []).map(p => ({ provider: 'pexels', id: String(p.id), kind: 'photo', title: p.alt || '', width: p.width, height: p.height, thumb: (p.src && (p.src.medium || p.src.small)) || '', url: p.url, author: p.photographer || '', premium: false }));
}

/* A numbered contact sheet, drawn in headless Chrome, so the pictures can be looked at before choosing */
async function contactSheet(items, dir, title) {
  const thumbs = [];
  await Promise.all(items.map(async (it, k) => {
    if (!it.thumb) return;
    const f = join(dir, `${String(k + 1).padStart(2, '0')}.jpg`);
    try { await download(it.provider, it.thumb, f, { timeout: 30000 }); thumbs[k] = f; } catch (e) { /* skip */ }
  }));
  const chrome = findChrome();
  if (!chrome || !thumbs.some(Boolean)) return null;
  const cards = items.map((it, k) => `<figure><div class="im">${thumbs[k] ? `<img src="${pathToFileURL(thumbs[k]).href}">` : ''}<b>${k + 1}</b>${it.premium ? '<i>premium</i>' : ''}</div><figcaption>${it.kind === 'video' ? `${Math.round(it.duration)} dtk · ` : ''}${it.width && it.height ? `${it.width}×${it.height}` : ''}<br>${esc((it.title || '').slice(0, 40))}</figcaption></figure>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:24px;background:#f4f4f2;font:14px/18px system-ui,sans-serif;color:#222}h1{font-size:18px;margin:0 0 16px}main{display:grid;grid-template-columns:repeat(6,1fr);gap:16px}figure{margin:0}.im{position:relative;aspect-ratio:9/16;background:#ddd;border-radius:8px;overflow:hidden}img{width:100%;height:100%;object-fit:cover}b{position:absolute;left:8px;top:8px;min-width:30px;height:30px;padding:0 6px;border-radius:15px;background:#111;color:#fff;display:grid;place-items:center;font-size:16px}i{position:absolute;right:8px;top:8px;padding:2px 8px;border-radius:10px;background:#E9A23B;color:#13233A;font-style:normal;font-size:12px}figcaption{margin-top:6px;color:#555}</style><h1>${esc(title)}</h1><main>${cards}</main>`;
  const page = join(dir, 'sheet.html'), png = join(dir, 'sheet.png');
  writeFileSync(page, html);
  const b = await launch(chrome, { width: 1200, height: 900 });
  try {
    await b.open(page, 'Array.from(document.images).every(i => i.complete)', 20000);
    const h = await b.evalJs('Math.ceil(document.documentElement.scrollHeight)');
    await b.send('Emulation.setDeviceMetricsOverride', { width: 1200, height: h, deviceScaleFactor: 1, mobile: false });
    const shot = await b.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(png, Buffer.from(shot.result.data, 'base64'));
  } finally { await b.close(); }
  return png;
}

/* ---------------- Download and fit ---------------- */
async function sourceUrl(provider, id, kind) {
  if (provider === 'pexels') {
    if (kind === 'photo') { const { data } = await request('Pexels', `${PEX()}/v1/photos/${id}`, { headers: pexH() }); return { url: data.src.original || data.src.large2x, meta: { title: data.alt, author: data.photographer, url: data.url, w: data.width, h: data.height } }; }
    const { data } = await request('Pexels', `${PEX()}/videos/videos/${id}`, { headers: pexH() });
    const files = (data.video_files || []).filter(f => f.quality !== 'hls' && /mp4/.test(f.file_type || '') && f.width && f.height);
    const portrait = files.filter(f => f.height >= f.width);
    const pool = (portrait.length ? portrait : files).sort((a, b) => Math.abs(Math.max(a.width, a.height) - 1920) - Math.abs(Math.max(b.width, b.height) - 1920));
    if (!pool.length) throw new ApiError('Pexels', 200, 'video ini tidak punya berkas MP4.');
    return { url: pool[0].link, meta: { title: (data.url || '').split('/').filter(Boolean).pop(), author: data.user && data.user.name, url: data.url, w: pool[0].width, h: pool[0].height, duration: data.duration } };
  }
  if (kind === 'photo') {
    const { data } = await request('Magnific', `${MAG()}/v1/resources/${id}/download?image_size=large`, { headers: magH() });
    const d = Array.isArray(data.data) ? data.data[0] : data.data;
    let meta = {};
    try { const r = await request('Magnific', `${MAG()}/v1/resources/${id}`, { headers: magH() }); const x = r.data.data || {}; meta = { title: x.title, author: x.author && x.author.name, url: x.url, premium: (x.licenses || []).some(l => l.type === 'premium') }; } catch (e) { /* metadata optional */ }
    return { url: d.signed_url || d.url, meta };
  }
  const { data: det } = await request('Magnific', `${MAG()}/v1/videos/${id}`, { headers: magH() });
  const v = det.data || {};
  const opts = (v.options || []).filter(o => o.active !== false);
  const mp4 = opts.filter(o => /mp4/i.test(o.container || ''));
  const rank = o => Math.abs((Math.max(o.width || 0, o.height || 0) || 1920) - 1920) + (/1080/.test(o.quality || '') ? -1 : 0);
  const best = (mp4.length ? mp4 : opts).sort((a, b) => rank(a) - rank(b))[0];
  const meta = { title: v.name, author: v.author && v.author.name, url: v.url, premium: !!v.premium, duration: dur(v.duration) };
  if (best) {
    const { data } = await request('Magnific', `${MAG()}/v1/videos/${id}/options/${best.id}/download`, { headers: magH() });
    return { url: data.data.url, meta: { ...meta, w: best.width, h: best.height } };
  }
  const { data } = await request('Magnific', `${MAG()}/v1/videos/${id}/download`, { headers: magH() });
  return { url: data.data.url, meta };
}

/** Re-encode for the reel: short, silent, H.264 with fast start; cover crops to 1080 x 1920. */
function fitVideo(src, dest, { start = 0, length, fit }) {
  const p = probe(src);
  const len = Math.min(length || 10, p && p.duration ? Math.max(0.5, p.duration - start) : length || 10);
  const portrait = p ? p.height >= p.width : true;
  const mode = fit || (portrait ? 'cover' : 'keep');
  const vf = mode === 'cover' ? 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p' : "scale='if(gt(iw,ih),min(1920,iw),-2)':'if(gt(iw,ih),-2,min(1920,ih))',fps=30,format=yuv420p";
  const base = ['-ss', String(start), '-t', String(len), '-i', src, '-vf', vf, '-an', '-movflags', '+faststart'];
  try { ffmpeg([...base, '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-profile:v', 'high', dest], 'Memotong footage'); }
  catch (e) { ffmpeg([...base, '-c:v', 'h264_videotoolbox', '-b:v', '6M', dest], 'Memotong footage'); }
  return { mode, len };
}
function fitPhoto(src, dest) {
  ffmpeg(['-i', src, '-vf', "scale='if(gt(iw,ih),min(2160,iw),-2)':'if(gt(iw,ih),-2,min(2160,ih))'", '-q:v', '3', dest], 'Mengecilkan foto');
}
function credit(slug, file, entry) {
  const p = join(root, 'posts', slug, 'media', 'credits.json');
  const c = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
  c[file] = entry;
  writeFileSync(p, JSON.stringify(c, null, 2) + '\n');
}
const MB = n => (n / 1024 / 1024).toFixed(1).replace('.', ',');

try {
  if (cmd === 'search') {
    const q = args._.slice(1).join(' ') || args.q;
    if (!q) fail('Pakai: node footage.mjs search "<kata kunci>" [--type video|photo]');
    const type = args.type === 'photo' ? 'photo' : 'video', n = Math.min(30, Number(args.n) || 12);
    const provider = pickProvider(args.provider);
    const opts = { vertical: !args['any-shape'], free: !!args.free };
    const items = provider === 'magnific' ? await searchMagnific(q, type, n, opts) : await searchPexels(q, type, n, opts);
    const dir = join(root, 'refs', 'footage', `${slugify(q)}-${provider}-${type}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'results.json'), JSON.stringify({ query: q, provider, type, at: new Date().toISOString(), items }, null, 1) + '\n');
    console.log(`\n${items.length} ${type === 'video' ? 'video' : 'foto'} dari ${provider === 'magnific' ? 'Magnific' : 'Pexels'} untuk "${q}"${opts.vertical ? ', tegak' : ''}:\n`);
    items.forEach((it, k) => console.log(`  ${String(k + 1).padStart(2)}. ${it.provider}:${it.id}  ${it.kind === 'video' ? `${String(Math.round(it.duration)).padStart(3)} dtk  ` : ''}${it.width && it.height ? `${it.width}x${it.height}  ` : ''}${it.premium ? 'premium  ' : ''}${(it.title || '').slice(0, 50)}${it.author ? ` · ${it.author}` : ''}`));
    if (!items.length) console.log('  Tidak ada hasil. Coba kata kunci bahasa Inggris yang lebih umum, atau --any-shape.');
    const sheet = items.length ? await contactSheet(items, dir, `${q} · ${provider} · ${type}`) : null;
    if (sheet) console.log(`\n  Lembar kontak: ${relative(process.cwd(), sheet)} (lihat gambarnya sebelum memilih)`);
    console.log(`  Ambil: content-studio footage get ${items[0] ? `${items[0].provider}:${items[0].id}` : '<provider>:<id>'} --slug <slug> [--length 8]\n`);
    if (provider === 'magnific') console.log('  Lisensi Magnific: paket berbayar boleh dipakai komersial tanpa atribusi; aset gratis di paket Free hanya untuk pribadi dan wajib atribusi.\n');
  } else if (cmd === 'get') {
    const ref = args._[1], slug = args.slug;
    const m = String(ref || '').match(/^(magnific|pexels|freepik):(\d+)$/);
    if (!m || !slug) fail('Pakai: node footage.mjs get <magnific|pexels>:<id> --slug <slug> [--name nama.mp4] [--start 2] [--length 8]');
    const provider = m[1] === 'freepik' ? 'magnific' : m[1], id = m[2];
    if (!get(`${provider}.apiKey`)) fail(`${provider} butuh API key. Simpan dengan: content-studio setup`, 2);
    const postDir = join(root, 'posts', slug);
    if (!existsSync(postDir)) fail(`posts/${slug} tidak ada.`);
    needFfmpeg('Memotong footage');
    /* The kind comes from --type, else from the search that listed this id */
    let kind = args.type === 'photo' ? 'photo' : args.type === 'video' ? 'video' : null;
    if (!kind) {
      const fdir = join(root, 'refs', 'footage');
      for (const d of existsSync(fdir) ? readdirSync(fdir) : []) {
        try { const r = JSON.parse(readFileSync(join(fdir, d, 'results.json'), 'utf8')); const hit = r.items.find(x => x.provider === provider && x.id === id); if (hit) { kind = hit.kind; break; } } catch (e) { /* skip */ }
      }
      kind = kind || 'video';
    }
    const name = args.name || `${provider}-${id}.${kind === 'photo' ? 'jpg' : 'mp4'}`;
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$/.test(name)) fail('--name: huruf, angka, titik, tanda hubung, misalnya anak-merangkak.mp4');
    if (/\.(jpe?g|png|webp)$/i.test(name)) kind = 'photo';
    const mediaDir = join(postDir, 'media');
    mkdirSync(mediaDir, { recursive: true });
    console.log(`\nMengambil ${provider}:${id} (${kind === 'photo' ? 'foto' : 'video'})...`);
    const { url, meta } = await sourceUrl(provider, id, kind);
    const raw = join(mediaDir, `.${name}.src`);
    await download(provider, url, raw);
    const dest = join(mediaDir, name);
    let note = '';
    if (kind === 'photo') fitPhoto(raw, dest);
    else { const r = fitVideo(raw, dest, { start: Number(args.start) || 0, length: Number(args.length) || 10, fit: args.fit }); note = `${r.len.toFixed(1).replace('.', ',')} dtk, ${r.mode === 'cover' ? 'dipotong 1080x1920' : 'bentuk asli'}, tanpa suara`; }
    rmSync(raw, { force: true });
    const size = statSync(dest).size;
    const who = provider === 'pexels' ? `${kind === 'photo' ? 'Foto' : 'Video'}: ${meta.author || 'Pexels'} di Pexels` : `${kind === 'photo' ? 'Foto' : 'Footage'}: ${meta.title || id}${meta.author ? ` oleh ${meta.author}` : ''}, Magnific`;
    credit(slug, name, { provider, id, kind, title: meta.title || '', author: meta.author || '', url: meta.url || '', license: provider === 'pexels' ? 'Lisensi Pexels' : meta.premium ? 'Magnific premium' : 'Magnific', line: `${who}${meta.url ? ` (${meta.url})` : ''}`, at: new Date().toISOString() });
    console.log(`✓ posts/${slug}/media/${name} (${MB(size)} MB${note ? ', ' + note : ''})`);
    if (size > REEL_MEDIA_MAX[kind === 'photo' ? 'image' : 'video']) console.log(`  ! Lebih dari ${MB(REEL_MEDIA_MAX[kind === 'photo' ? 'image' : 'video'])} MB. Perpendek: content-studio footage fit ${slug} ${name} --length 6`);
    console.log(`  Pakai di reel.json: "media": { "src": "${name}", "alt": "<apa yang terlihat>" }. Kredit tercatat di media/credits.json dan ikut caption.\n`);
  } else if (cmd === 'fit') {
    const slug = args._[1], file = args._[2];
    if (!slug || !file) fail('Pakai: node footage.mjs fit <slug> <berkas> [--start s] [--length s] [--fit cover|keep]');
    const p = join(root, 'posts', slug, 'media', file);
    if (!existsSync(p)) fail(`Tidak ada: posts/${slug}/media/${file}`);
    const tmp = join(root, 'posts', slug, 'media', `.fit-${basename(file)}`);
    if (/\.(jpe?g|png|webp)$/i.test(file)) fitPhoto(p, tmp.replace(/\.(png|webp)$/i, '.jpg'));
    else fitVideo(p, tmp.replace(/\.[^.]+$/, '.mp4'), { start: Number(args.start) || 0, length: Number(args.length) || 10, fit: args.fit });
    const out = /\.(jpe?g|png|webp)$/i.test(file) ? tmp.replace(/\.(png|webp)$/i, '.jpg') : tmp.replace(/\.[^.]+$/, '.mp4');
    const final = join(root, 'posts', slug, 'media', basename(file).replace(/\.(png|webp)$/i, '.jpg').replace(/\.(mov|m4v|webm|mkv)$/i, '.mp4'));
    renameSync(out, final);
    if (final !== p) rmSync(p, { force: true });
    console.log(`✓ posts/${slug}/media/${basename(final)} (${MB(statSync(final).size)} MB)${final !== p ? `. Nama berkas berubah: perbarui "src" di reel.json.` : ''}`);
  } else if (cmd === 'mcp') {
    let claude = null;
    try { claude = execFileSync(process.platform === 'win32' ? 'where' : 'which', ['claude'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split(/\r?\n/)[0]; } catch (e) { /* not installed */ }
    console.log('\nMCP Magnific (https://mcp.magnific.com) membuat gambar, video, dan suara dengan AI memakai kredit akun Magnific. Pencarian stok tetap lewat "footage search".');
    if (claude && !args['print-only']) {
      const r = spawnSync(claude, ['mcp', 'add', '--transport', 'http', '--scope', 'user', 'magnific', 'https://mcp.magnific.com'], { stdio: 'inherit' });
      if (r.status === 0) console.log('\n✓ Ditambahkan ke Claude Code. Di sesi Claude Code, ketik /mcp lalu pilih magnific untuk masuk (OAuth di browser).');
      else console.log('\n✗ claude mcp add gagal. Jalankan sendiri: claude mcp add --transport http --scope user magnific https://mcp.magnific.com');
    } else console.log('\nClaude Code:  claude mcp add --transport http --scope user magnific https://mcp.magnific.com  lalu /mcp untuk masuk.');
    console.log('Claude Desktop dan claude.ai: Settings, Connectors, Add custom connector, nama Magnific, URL https://mcp.magnific.com, lalu masuk.\n');
  } else fail(HELP);
} catch (e) {
  fail(e.message, e.code === 'NO_KEY' ? 2 : 1);
}
