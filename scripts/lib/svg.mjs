// Logo SVG cleanup. Logos are inlined into every slide, so anything that could run code,
// load the network, or restyle the whole page is removed.

export function sanitizeSvg(text) {
  const notes = [];
  let s = String(text).replace(/^﻿/, '');
  s = s.replace(/<\?xml[^>]*\?>/gi, '').replace(/<!DOCTYPE[^>]*>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  const m = s.match(/<svg[\s\S]*<\/svg>/i);
  if (!m) throw new Error('Berkas bukan SVG: tag <svg> tidak ditemukan.');
  s = m[0];
  const strip = (re, why) => { if (re.test(s)) { notes.push(why); s = s.replace(re, ''); } };
  strip(/<script[\s\S]*?<\/script>/gi, 'script dihapus');
  strip(/<foreignObject[\s\S]*?<\/foreignObject>/gi, 'foreignObject dihapus');
  strip(/<style[\s\S]*?<\/style>/gi, 'blok <style> dihapus (bisa mengubah gaya halaman); pakai atribut fill/stroke');
  strip(/<(?:a|iframe|object|embed|audio|video|animate\w*|set)\b[\s\S]*?(?:\/>|<\/(?:a|iframe|object|embed|audio|video|animate\w*|set)>)/gi, 'elemen interaktif atau animasi dihapus');
  strip(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, 'atribut event dihapus');
  strip(/\s(?:xlink:)?href\s*=\s*("(?!#)[^"]*"|'(?!#)[^']*')/gi, 'tautan eksternal dihapus');
  strip(/\sstyle\s*=\s*("[^"]*url\([^"]*"|'[^']*url\([^']*')/gi, 'style dengan url() dihapus');

  // Root: keep a viewBox, drop fixed width/height so CSS sizes the logo.
  s = s.replace(/<svg\b([^>]*)>/i, (all, attrs) => {
    let a = attrs;
    const w = a.match(/\swidth\s*=\s*["']?([\d.]+)/i), h = a.match(/\sheight\s*=\s*["']?([\d.]+)/i);
    if (!/viewBox\s*=/i.test(a)) {
      if (!w || !h) throw new Error('SVG tidak punya viewBox, dan width/height tidak bisa dipakai untuk membuatnya.');
      a += ` viewBox="0 0 ${w[1]} ${h[1]}"`;
      notes.push('viewBox dibuat dari width dan height');
    }
    a = a.replace(/\s(?:width|height)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    if (!/xmlns=/i.test(a)) a += ' xmlns="http://www.w3.org/2000/svg"';
    return `<svg${a}>`;
  });
  if (s.length > 200000) throw new Error('Logo SVG terlalu besar (lebih dari 200 KB). Sederhanakan logonya.');
  return { svg: s.trim(), notes };
}

/** Give ids a per-instance suffix so the same logo can appear on every slide. */
export function uniqueIds(svg, suffix) {
  const ids = [...svg.matchAll(/\sid\s*=\s*"([^"]+)"/g)].map(m => m[1]);
  let out = svg;
  for (const id of ids) {
    const re = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`id="${re}"`, 'g'), `id="${id}-${suffix}"`)
      .replace(new RegExp(`url\\(#${re}\\)`, 'g'), `url(#${id}-${suffix})`)
      .replace(new RegExp(`href="#${re}"`, 'g'), `href="#${id}-${suffix}"`);
  }
  return out;
}
