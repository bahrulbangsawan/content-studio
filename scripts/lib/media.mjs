// Photos and videos on slides. A post names a file in posts/<slug>/media/ through a media field
// ({ src, alt, focus, still }); build.mjs embeds the bytes in the page, so the studio stays one file that
// works offline and exports PNG and MP4 with the picture in it. The catalog and the component gate use the
// sample files in <skill>/assets/media/.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SKILL_DIR } from './common.mjs';

export const MEDIA_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm' };
/* Bytes per file and per post. The page carries every file as base64 (a third larger), so keep photos near
   2000 px on the long side and videos short. */
export const MEDIA_MAX = { image: 4 * 1024 * 1024, video: 15 * 1024 * 1024, total: 40 * 1024 * 1024, imageWarn: 1.5 * 1024 * 1024 };
export const MEDIA_FILE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$/;
export const FOCUS = ['center', 'top', 'bottom', 'left', 'right'];
export const SAMPLE_MEDIA_DIR = join(SKILL_DIR, 'assets', 'media');

export const extOf = src => String(src || '').toLowerCase().split('.').pop();
export const kindOf = src => { const m = MEDIA_TYPES[extOf(src)]; return m ? m.split('/')[0] : null; };

/** Every media value in a slide, with its path, found by walking the component's field specs. */
export function mediaIn(slide, keys) {
  const out = [];
  const walk = (spec, v, path) => {
    if (v === undefined || v === null || !spec) return;
    if (spec.type === 'media') { if (typeof v === 'object' && !Array.isArray(v)) out.push({ path, value: v, spec }); return; }
    if (spec.type === 'list' && Array.isArray(v)) v.forEach((x, k) => walk(spec.item, x, `${path}[${k}]`));
    if (spec.type === 'object' && typeof v === 'object' && !Array.isArray(v)) for (const [k, f] of Object.entries(spec.fields)) walk(f, v[k], `${path}.${k}`);
  };
  for (const [k, spec] of Object.entries(keys || {})) walk(spec, slide && slide[k], k);
  return out;
}

/** Width and height of a JPEG, PNG or WebP from its header, or null. Used where a frame must keep the
    picture's own shape, e.g. pins placed in percent of the picture. */
export function imageSize(b) {
  try {
    if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    if (b[0] === 0xff && b[1] === 0xd8) {
      for (let i = 2; i + 9 < b.length;) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const t = b.toString('ascii', 12, 16);
      if (t === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
      if (t === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
      if (t === 'VP8L') { const v = b.readUInt32LE(21); return { w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff) }; }
    }
  } catch (e) { /* unreadable header */ }
  return null;
}

/** Files on disk for a set of names: { src: { id, kind, mime, bytes, size, w, h } }. Missing files are left out. */
export function loadMedia(dir, srcs) {
  const out = {};
  let n = 0;
  for (const src of [...new Set(srcs)]) {
    const p = join(dir, src);
    if (!MEDIA_FILE.test(src) || !kindOf(src) || !existsSync(p) || !statSync(p).isFile()) continue;
    const bytes = readFileSync(p);
    out[src] = { id: `m${++n}`, kind: kindOf(src), mime: MEDIA_TYPES[extOf(src)], bytes, size: bytes.length, ...(kindOf(src) === 'image' ? imageSize(bytes) : null) };
  }
  return out;
}

/** Sample photos and videos shipped with the skill, listed in assets/media/media.json. */
export const SAMPLE_FILES = existsSync(join(SAMPLE_MEDIA_DIR, 'media.json')) ? JSON.parse(readFileSync(join(SAMPLE_MEDIA_DIR, 'media.json'), 'utf8')).files : [];
export const sampleMedia = () => loadMedia(SAMPLE_MEDIA_DIR, SAMPLE_FILES.map(f => f.src));

/** The bytes of every file, once per page, for markup rendered with mediaMode "ref". */
export const mediaScripts = map => Object.entries(map).map(([src, f]) => `<script type="text/plain" class="md-src" data-id="${f.id}" data-mime="${f.mime}" data-name="${src.replace(/[^\w.-]/g, '')}">${f.bytes.toString('base64')}</script>`).join('\n');

/** For pages without the studio script (catalog, component gate): attach the files, play videos muted,
    and set window.__mediaReady once every picture has loaded. */
export const MEDIA_ATTACH = `(() => {
  const els = () => [...document.querySelectorAll('[data-media]')];
  Promise.all([...document.querySelectorAll('script.md-src')].map(s => fetch('data:' + s.dataset.mime + ';base64,' + s.textContent.trim()).then(r => r.blob()).then(b => [s.dataset.id, URL.createObjectURL(b)])))
    .then(list => {
      const m = new Map(list);
      els().forEach(el => { el.src = m.get(el.dataset.media) || ''; if (el.tagName === 'VIDEO') { el.muted = true; el.play().catch(() => {}); } });
      return Promise.all(els().map(el => new Promise(r => {
        if (el.tagName === 'VIDEO' ? el.readyState >= 2 : el.complete && el.naturalWidth) return r();
        el.addEventListener(el.tagName === 'VIDEO' ? 'loadeddata' : 'load', r, { once: true });
        el.addEventListener('error', r, { once: true });
        setTimeout(r, 5000);
      })));
    })
    .then(() => { window.__mediaReady = true; });
})();`;
