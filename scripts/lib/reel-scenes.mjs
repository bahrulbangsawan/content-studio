// Scenes for Reels (1080 x 1920): explanation video designed for the vertical frame, not slides stretched to it.
// A scene is one idea said by the voice-over, with the picture that carries it. Its parts arrive when the voice
// names them (reel-time.mjs clock), so the eye follows the ear. Text never sits on footage directly: it sits on
// a solid card or on the scene colour. Every scene has a picture: an illustration, footage, a figure or a diagram.
//
// Frame zones (see 02-reel.css): top bar y 0-236 and bottom bar y 1460-1920 belong to Instagram's buttons and
// caption; the content zone is x 90-990, y 312-1240 (236-1240 for the first and last scene); burned-in captions
// sit in y 1268-1458.
import { esc, iconSvg } from './render-kit.mjs';
import { title as tTitle, text, numeral, phrase, variant, only, list, obj, icon, art, media, bool, num, choice } from './kit.mjs';
import { ART, artSvg } from './art.mjs';
import { findPhrase } from './kit.mjs';

/* ---------------- Timing attributes ----------------
   data-a: entrance preset (see 04-player.html), data-t: start in scene seconds, data-l: length.
   data-dim: dims after t (an earlier step once the next arrives). data-on: adds .is-on after t. */
const f2 = n => (Math.round(n * 100) / 100).toString();
export const A = (preset, t, l) => ` data-a="${preset}" data-t="${f2(t)}"${l ? ` data-l="${f2(l)}"` : ''}`;
const ON = t => ` data-on="${f2(t)}"`;
/* The words of a highlighted phrase bounce once when the marker lands */
const PULSE = t => ` data-pulse="${f2(t)}"`;
const DIM = t => ` data-dim="${f2(t)}"`;
const ic = (ctx, name, cls) => iconSvg(ctx.icons, name, cls);

/* Words of an on-screen sentence, each arriving when it is said. The focus phrase gets the marker (sun colour
   behind it) or a hand-drawn strike once its last word is in. */
function kin(ctx, str, { at, focus, mark = 'sun', step = 0.08, slam = false } = {}) {
  const s = String(str || '').trim();
  const times = ctx.clk.sync(s, at ?? ctx.clk.t0, step);
  const parts = s.split(/(\s+)/);
  let k = 0;
  const preset = slam ? 'slam' : 'word';
  const ws = parts.map(p => (!p || /^\s+$/.test(p) ? p : `<span class="w"${A(preset, times[k++] ?? 0)}>${esc(p)}</span>`));
  const html = ws.join('');
  const i = focus ? findPhrase(s, focus) : -1;
  if (i < 0) return { html, end: times[times.length - 1] ?? at ?? 0 };
  /* Rebuild with the focus words wrapped: the marker sweeps in once the phrase has been said; a strike is
     drawn word by word, so it stays right when the phrase breaks over two lines */
  const before = s.slice(0, i).split(/\s+/).filter(Boolean).length, inFocus = focus.trim().split(/\s+/).length;
  const tm = times[Math.min(times.length - 1, before + inFocus - 1)] + 0.2;
  let out = '';
  const tokens = parts.filter(p => p && !/^\s+$/.test(p));
  tokens.forEach((p, q) => {
    const inside = q >= before && q < before + inFocus;
    if (q === before) out += mark === 'strike' ? `<span class="mk-x"${ON(tm + inFocus * 0.08)}>` : `<span class="mk"${A('mark', tm, 0.42)}${ON(tm + 0.12)}>`;
    out += inside && mark === 'strike'
      ? `<span class="w sw"${A(preset, times[q] ?? 0)}>${esc(p)}<svg class="sw-l" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M0 11 L100 9"${A('draw', tm + (q - before) * 0.08, 0.2)}/></svg></span>`
      : `<span class="w"${A(preset, times[q] ?? 0)}${inside ? PULSE(tm + 0.22 + (q - before) * 0.04) : ''}>${esc(p)}</span>`;
    if (q === before + inFocus - 1) out += '</span>';
    out += q < tokens.length - 1 ? ' ' : '';
  });
  return { html: out, end: Math.max(tm + 0.4 + (mark === 'strike' ? inFocus * 0.08 : 0), times[times.length - 1] ?? 0) };
}

/* A display title steps down one or two sizes when a word is too long to stay whole on its line, or when the
   whole title is long; bigger sizes first, so a short hook stays large */
const FIT = { xl: { words: [11, 9], chars: [30, 21] }, h1: { words: [13, 11], chars: [42, 30] }, h2: { words: [15, 13], chars: [58, 42] }, head: { words: [15, 13], chars: [30, 20] } };
function fit(kind, str) {
  const f = FIT[kind] || FIT.h2, t = String(str || '');
  const longest = Math.max(0, ...t.split(/\s+/).map(w => w.replace(/[^\p{L}\p{N}]/gu, '').length));
  const lv = (steps, v) => { const k = steps.findIndex(n => v >= n); return k < 0 ? 0 : steps.length - k; };
  const level = Math.max(lv(f.words, longest), lv(f.chars, t.length));
  return level ? `fit-${level}` : '';
}

function ill(ctx, name, size, t, preset = 'pop', extra = '') {
  if (!name || !ART[name]) return '';
  return artSvg(name, `r-ill r-ill-${size}${extra ? ' ' + extra : ''}`, A(preset, t, preset === 'pop' ? 0.6 : 0));
}

export const FOCUS_XY = /^(100|\d{1,2})% (100|\d{1,2})%$/;
/* Photo or footage in a frame. `kb` slowly moves a photo for the whole scene; video plays from m.from.
   An empty preset shows it from the first frame (an opening must never start blank). */
function md(ctx, m, cls, t, preset = 'zoomIn') {
  const f = m && ctx.media && ctx.media[m.src];
  const alt = esc((m && m.alt) || '');
  const enter = preset ? A(preset, t) : '';
  if (!f) return `<div class="md ${cls} is-missing" role="img" aria-label="${alt}"${enter}>${ic(ctx, /\.(mp4|webm|mov)$/i.test((m && m.src) || '') ? 'video' : 'photo', 'md-ph')}</div>`;
  /* focus: a named side, or "40% 30%" for the exact point to keep when the frame crops the picture */
  const pos = `--fp: ${{ top: '50% 18%', bottom: '50% 82%', left: '18% 50%', right: '82% 50%' }[m.focus] || (FOCUS_XY.test(m.focus || '') ? m.focus : '50% 50%')}`;
  const el = f.kind === 'video'
    ? `<video class="md-el" data-media="${f.id}" data-from="${Number(m.from) || 0}" muted playsinline preload="auto" aria-label="${alt}" style="${pos}"></video>`
    : `<img class="md-el" data-media="${f.id}" alt="${alt}" data-kb="${m.move || ['in', 'left', 'out', 'right'][ctx.index % 4]}" style="${pos}">`;
  return `<div class="md ${cls}${f.kind === 'video' ? ' is-video' : ''}"${enter}>${el}</div>`;
}

/* "Sumber: Kim dkk., 2019" under a claim, from the reel's sources list */
function srcChip(ctx, s, t, onMedia = false) {
  const ids = [].concat(s.source || []);
  if (!ids.length) return '';
  const names = ids.map(id => ctx.sources[id] && ctx.sources[id].short).filter(Boolean);
  if (!names.length) return '';
  return `<p class="r-src${onMedia ? ' on-media' : ''}"${A('fade', t)}>${ic(ctx, 'book', 'ic')}<span>${esc(names.join('; '))}</span></p>`;
}

const chip = (ctx, iconName, txt, cls, t, preset = 'pop') => `<span class="r-chip ${cls || ''}"${A(preset, t)}>${iconName ? ic(ctx, iconName, 'ic') : ''}<span>${esc(txt)}</span></span>`;
const badge = (ctx, kind, t) => `<span class="r-badge b-${kind}"${A('pop', t)}>${ic(ctx, kind === 'yes' ? 'check' : kind === 'no' ? 'x' : 'alert-triangle', 'ic')}</span>`;
const L = { id: { myth: 'Mitos', fact: 'Fakta', wrong: 'Keliru', research: 'Penelitian', of: 'dari', tip: 'Coba ini', recap: 'Intinya', what: 'Apa itu' }, en: { myth: 'Myth', fact: 'Fact', wrong: 'Wrong', research: 'Research', of: 'of', tip: 'Try this', recap: 'In short', what: 'What is' } };
const word = (ctx, k) => (L[ctx.brand.language || 'id'] || L.id)[k];

/* Numbers counted up from zero: "73%", "2,5", "1.200", "3x" */
function countAttrs(v) {
  const m = String(v).match(/^(\D*?)(\d{1,3}(?:[.\s]\d{3})+|\d+)(?:,(\d+))?(.*)$/);
  if (!m) return '';
  const whole = m[2].replace(/[.\s]/g, ''), dec = m[3] || '';
  return ` data-to="${whole}${dec ? '.' + dec : ''}" data-dec="${dec.length}" data-pre="${esc(m[1])}" data-suf="${esc(m[4])}" data-sep="${/[.\s]\d{3}/.test(m[2]) ? '1' : '0'}"`;
}
const count = (v, cls, t, l = 1.1) => `<span class="${cls}"${A('count', t, l)}${countAttrs(v)}>${esc(v)}</span>`;
/* A display figure sized to stay on one line; "6 dari 10" becomes a large 6 with "dari 10" beside it */
function bigNum(v, t, l = 1.2, extra = '') {
  const of = String(v).match(/^(\d+)\s+(dari|of)\s+(\d+)$/i);
  if (of) return `<div class="r-num-row${extra}">${count(of[1], 'r-num', t, l)}<span class="r-of">${esc(`${of[2]} ${of[3]}`)}</span></div>`;
  const n = String(v).length;
  return count(v, `r-num${n > 6 ? ' sz-3' : n > 4 ? ' sz-2' : ''}${extra}`, t, l);
}
/* A scene title with its illustration beside it, for scenes whose body fills the rest */
const headRow = (ctx, s, t0, title = s.title) => {
  const h = `<h2 class="r-head ${fit(s.art && ART[s.art] ? 'head' : 'h2', title)}"${A('rise', t0)}>${esc(title)}</h2>`;
  return s.art && ART[s.art] ? `<div class="r-headrow">${h}${ill(ctx, s.art, 's', t0 + 0.15)}</div>` : h;
};
export const pct = v => { const m = String(v).match(/(\d+(?:[.,]\d+)?)\s*%/); return m ? Math.max(0, Math.min(100, parseFloat(m[1].replace(',', '.')))) : null; };

/* ---------------- Scene types ----------------
   keys: fields (validated by reel-rules.mjs with the same field helpers as carousel components).
   full: the scene uses the tall content zone (first and last scenes).
   visual: what carries the picture, for the guide. vo: the voice-over limit in words. */
const SRC = { type: 'source' };
const COMMON = { art: art(false) };

export const SCENES = {
  hook: {
    label: 'Pembuka', role: 'open', full: true, vo: 14,
    desc: 'Detik pertama: pertanyaan, klaim, mitos, atau angka yang membuat orang berhenti menggulir. Bicara langsung tanpa salam.',
    visual: 'Ilustrasi besar, footage, atau angka yang dihitung naik',
    variants: { question: 'Pertanyaan', bold: 'Kalimat besar', myth: 'Mitos dicoret', number: 'Angka', footage: 'Footage penuh', split: 'Footage dan teks' },
    keys: {
      variant: variant('question', 'bold', 'myth', 'number', 'footage', 'split'),
      title: tTitle(9, 54), focus: phrase('title', 4, 28), kicker: text(9, 56),
      value: only({ ...numeral(12), words: 3, required: true }, 'number'),
      media: only(media(true), 'footage', 'split'), source: SRC, ...COMMON,
    },
    validate(s, words) {
      const v = s.variant || 'question', t = String(s.title || '');
      if (v === 'bold' && (words(t) > 6 || t.length > 34)) return ['title: varian bold paling banyak 6 kata dan 34 karakter (hurufnya sangat besar).'];
      if (v === 'myth' && (words(t) > 8 || t.length > 46)) return ['title: varian myth paling banyak 8 kata dan 46 karakter.'];
      return [];
    },
    render(s, ctx) {
      const v = s.variant || 'question', t0 = ctx.clk.t0;
      if (v === 'number') {
        const tv = t0 + 0.05;
        return `<div class="cz r-hook v-number">
${ill(ctx, s.art, 'm', tv)}
${bigNum(s.value, tv, 1.3)}
<h1 class="r-h2 ${fit('h2', s.title)}">${kin(ctx, s.title, { at: tv + 0.5, focus: s.focus }).html}</h1>
${s.kicker ? `<p class="r-kick"${A('rise', ctx.clk.after(0.4))}>${esc(s.kicker)}</p>` : ''}${srcChip(ctx, s, tv + 1.2)}</div>`;
      }
      if (v === 'footage') {
        const k = kin(ctx, s.title, { at: t0 + 0.3, focus: s.focus });
        return `<div class="r-bg">${md(ctx, s.media, 'md-full', 0, '')}</div>
<div class="cz r-hook v-footage"><div class="r-card r-plate"${A('up', t0 + 0.1)}><h1 class="r-h1 ${fit('h1', s.title)}">${k.html}</h1>${s.kicker ? `<p class="r-kick"${A('rise', k.end + 0.1)}>${esc(s.kicker)}</p>` : ''}${srcChip(ctx, s, k.end)}</div></div>`;
      }
      if (v === 'split') {
        const k = kin(ctx, s.title, { at: t0 + 0.35, focus: s.focus });
        return `<div class="cz r-hook v-split">${md(ctx, s.media, 'md-top', t0, 'wipeUp')}
<h1 class="r-h1 ${fit('h1', s.title)}">${k.html}</h1>${s.kicker ? `<p class="r-kick"${A('rise', k.end + 0.1)}>${esc(s.kicker)}</p>` : ''}${srcChip(ctx, s, k.end)}</div>`;
      }
      if (v === 'myth') {
        const tc = t0, k = kin(ctx, s.title, { at: t0 + 0.25, focus: s.focus || s.title, mark: 'strike' });
        return `<div class="cz r-hook v-myth">${chip(ctx, 'help-circle', word(ctx, 'myth'), 'c-sun', tc)}
<h1 class="r-h1 ${fit('h1', s.title)}">${k.html}</h1>
<span class="r-stamp"${A('stamp', k.end + 0.15)}>${esc(word(ctx, 'wrong'))}</span>
${ill(ctx, s.art, 'm', k.end + 0.3)}${s.kicker ? `<p class="r-kick"${A('rise', k.end + 0.5)}>${esc(s.kicker)}</p>` : ''}${srcChip(ctx, s, k.end + 0.6)}</div>`;
      }
      if (v === 'bold') {
        const k = kin(ctx, s.title, { at: t0, focus: s.focus, slam: true, step: 0.16 });
        return `<div class="cz r-hook v-bold"><h1 class="r-xl ${fit('xl', s.title)}">${k.html}</h1>
${s.kicker ? `<p class="r-kick"${A('rise', k.end + 0.1)}>${esc(s.kicker)}</p>` : ''}${ill(ctx, s.art, 'm', k.end + 0.15, 'pop', 'r-corner')}${srcChip(ctx, s, k.end + 0.3)}</div>`;
      }
      /* question */
      const k = kin(ctx, s.title, { at: t0 + 0.15, focus: s.focus });
      return `<div class="cz r-hook v-question">${ill(ctx, s.art, 'l', t0)}
<h1 class="r-h1 ${fit('h1', s.title)}">${k.html}</h1>${s.kicker ? `<p class="r-kick"${A('rise', k.end + 0.1)}>${esc(s.kicker)}</p>` : ''}${srcChip(ctx, s, k.end + 0.3)}</div>`;
    },
  },

  statement: {
    label: 'Penjelasan', vo: 32,
    desc: 'Satu kalimat inti dengan kata kunci bersorot, ditemani ilustrasi. Untuk menjelaskan kenapa atau apa.',
    visual: 'Ilustrasi di atas judul, atau di sudut kartu',
    variants: { plain: 'Polos', card: 'Kartu', quote: 'Kutipan' },
    keys: { variant: variant('plain', 'card', 'quote'), title: tTitle(12, 72), focus: phrase('title', 4, 30), body: text(16, 100), by: only(text(8, 48), 'quote'), source: SRC, ...COMMON },
    render(s, ctx) {
      const v = s.variant || 'plain', t0 = ctx.clk.t0;
      if (v === 'quote') {
        const k = kin(ctx, s.title, { at: t0 + 0.2, focus: s.focus });
        return `<div class="cz r-st v-quote"><div class="r-qrow"><span class="r-qm" aria-hidden="true"${A('pop', t0)}>“</span>${ill(ctx, s.art, 's', t0 + 0.15)}</div>
<blockquote class="r-h2 ${fit('h2', s.title)}">${k.html}</blockquote>${s.by ? `<p class="r-by"${A('rise', k.end + 0.1)}>${esc(s.by)}</p>` : ''}${srcChip(ctx, s, k.end + 0.3)}</div>`;
      }
      if (v === 'card') {
        const k = kin(ctx, s.title, { at: t0 + 0.35, focus: s.focus });
        return `<div class="cz r-st v-card"><div class="r-card r-card-ill"${A('up', t0)}>${ill(ctx, s.art, 'm', t0 + 0.2, 'pop', 'r-onedge')}
<h2 class="r-h3">${k.html}</h2>${s.body ? `<p class="r-body"${A('rise', k.end + 0.1)}>${esc(s.body)}</p>` : ''}</div>${srcChip(ctx, s, k.end + 0.3)}</div>`;
      }
      const k = kin(ctx, s.title, { at: t0 + 0.2, focus: s.focus });
      return `<div class="cz r-st v-plain">${ill(ctx, s.art, 'l', t0)}
<h2 class="r-h2 ${fit('h2', s.title)}">${k.html}</h2>${s.body ? `<p class="r-body"${A('rise', k.end + 0.1)}>${esc(s.body)}</p>` : ''}${srcChip(ctx, s, k.end + 0.3)}</div>`;
    },
  },

  stat: {
    label: 'Angka', vo: 28,
    desc: 'Satu angka dari penelitian yang dihitung naik, dengan gambarnya: cincin persen, batang pembanding, atau deret orang. Wajib bersumber.',
    visual: 'Cincin, batang, atau deret orang yang terisi sesuai angka',
    variants: { ring: 'Cincin persen', bar: 'Batang pembanding', people: 'Deret orang', plain: 'Angka besar' },
    keys: {
      variant: variant('ring', 'bar', 'people', 'plain'),
      value: only({ ...numeral(8), required: true }, 'ring', 'people', 'plain'), label: text(10, 60, true),
      title: text(6, 36), of: only(num(2, 20), 'people'),
      bars: only(list(2, 3, obj({ label: text(4, 26, true), value: { ...numeral(8), required: true } })), 'bar'),
      focus: only(num(1, 3, false), 'bar'),
      source: { ...SRC, required: true }, ...COMMON,
    },
    validate(s, words) {
      const v = s.variant || 'ring', out = [];
      if (v === 'bar' && words(s.label) > 9) out.push('label: varian bar paling banyak 9 kata (tiga batang sudah memakai ruangnya).');
      if (v === 'plain' && s.title && s.art && String(s.label || '').length > 60) out.push('label: varian plain dengan title dan art paling banyak 60 karakter, atau hapus title.');
      return out;
    },
    render(s, ctx) {
      const v = s.variant || 'ring', t0 = ctx.clk.t0;
      const head = s.title ? `<h2 class="r-h3 r-head"${A('rise', t0)}>${esc(s.title)}</h2>` : '';
      if (v === 'bar') {
        const vals = s.bars.map(b => parseFloat(String(b.value).replace(/\./g, '').replace(',', '.')) || 0), max = Math.max(...vals, 1);
        const focus = (s.focus || vals.indexOf(Math.max(...vals)) + 1) - 1;
        const rows = s.bars.map((b, k) => {
          const t = ctx.clk.cue(b.label, k, s.bars.length);
          return `<div class="r-bar${k === focus ? ' is-focus' : ''}"><span class="r-bar-l"${A('rise', t)}>${esc(b.label)}</span>
<span class="r-bar-track"><i class="r-bar-fill" style="width: ${Math.max(8, (vals[k] / max) * 100).toFixed(1)}%"${A('grow', t + 0.1, 0.8)}></i></span>${count(b.value, 'r-bar-v', t + 0.1, 0.8)}</div>`;
        }).join('');
        return `<div class="cz r-stat v-bar">${s.title ? headRow(ctx, s, t0) : ''}<div class="r-bars">${rows}</div><p class="r-body"${A('rise', ctx.clk.after(0.5))}>${esc(s.label)}</p>${s.title ? '' : ill(ctx, s.art, 's', t0 + 0.2, 'pop', 'r-corner')}${srcChip(ctx, s, ctx.clk.after(0.3))}</div>`;
      }
      if (v === 'people') {
        const n = s.of || 10, k = Math.max(0, Math.min(n, parseInt(String(s.value), 10) || 0));
        const tn = t0 + 0.1, tf = tn + 0.5;
        const ppl = Array.from({ length: n }, (_, q) => `<span class="r-p${q < k ? ' is-on-p' : ''}"${A('pop', tn + q * 0.035)}${q < k ? ON(tf + q * 0.12) : ''}>${ic(ctx, 'user', 'ic')}</span>`).join('');
        return `<div class="cz r-stat v-people">${head}<div class="r-num-row"${A('rise', tn)}>${count(String(k), 'r-num r-num-m', tf, Math.max(0.4, k * 0.12))}<span class="r-of">${esc(word(ctx, 'of'))} ${n}</span></div>
<div class="r-people n${n > 10 ? 20 : 10}">${ppl}</div><p class="r-body"${A('rise', tf + k * 0.12 + 0.2)}>${esc(s.label)}</p>${srcChip(ctx, s, tf + 0.6)}</div>`;
      }
      if (v === 'plain') {
        const tn = t0 + 0.1;
        return `<div class="cz r-stat v-plain">${head}${ill(ctx, s.art, 'm', tn)}${bigNum(s.value, tn + 0.15)}<p class="r-lede"${A('rise', tn + 0.7)}>${esc(s.label)}</p>${srcChip(ctx, s, tn + 1)}</div>`;
      }
      /* ring */
      const p = pct(s.value) ?? 0, tn = t0 + 0.15;
      return `<div class="cz r-stat v-ring">${head}<div class="r-ring"${A('pop', tn)}><svg viewBox="0 0 600 600" aria-hidden="true"><circle class="r-ring-t" cx="300" cy="300" r="250"/><circle class="r-ring-p" cx="300" cy="300" r="250" pathLength="100" style="stroke-dasharray: ${p.toFixed(1)} 100" transform="rotate(-90 300 300)"${A('draw', tn + 0.2, 1.2)}/></svg>${count(s.value, 'r-num r-num-ring', tn + 0.2, 1.2)}</div>
<p class="r-lede"${A('rise', tn + 0.9)}>${esc(s.label)}</p>${srcChip(ctx, s, tn + 1.2)}</div>`;
    },
  },

  steps: {
    label: 'Langkah', vo: 40,
    desc: 'Dua sampai lima langkah berurutan. Setiap langkah muncul saat disebut, langkah sebelumnya meredup, garisnya tergambar.',
    visual: 'Jalur bernomor yang tergambar langkah demi langkah',
    variants: { line: 'Jalur', cards: 'Kartu bertumpuk' },
    keys: { variant: variant('line', 'cards'), title: tTitle(7, 40), steps: list(2, 5, obj({ title: text(5, 30, true), text: text(9, 56) })), ...COMMON },
    validate(s, words) {
      const n = (s.steps || []).length, out = [];
      if (n === 5 && s.steps.some(x => x.text)) out.push('steps: lima langkah tanpa "text" (tidak muat). Hapus text atau kurangi jadi empat langkah.');
      if (n === 4 && s.steps.some(x => x.text && (words(x.text) > 6 || x.text.length > 36))) out.push('steps[].text: empat langkah, text paling banyak 6 kata dan 36 karakter.');
      if (s.variant === 'cards' && n >= 4 && s.steps.some(x => x.text && words(x.text) > 5)) out.push('steps[].text: varian cards dengan empat langkah atau lebih, text paling banyak 5 kata.');
      if (s.variant === 'cards' && n >= 4 && s.steps.some(x => String(x.title).length > 24)) out.push('steps[].title: varian cards dengan empat langkah atau lebih, title paling banyak 24 karakter.');
      return out;
    },
    render(s, ctx) {
      const v = s.variant || 'line', t0 = ctx.clk.t0, n = s.steps.length;
      const ts = s.steps.map((st, k) => ctx.clk.cue(`${st.title} ${st.text || ''}`, k, n, 0.5));
      const head = headRow(ctx, s, t0);
      if (v === 'cards') {
        const cards = s.steps.map((st, k) => `<div class="r-card r-scard"${A('up', ts[k])}${k < n - 1 ? DIM(ts[k + 1]) : ''}><span class="r-n">${k + 1}</span><div><p class="r-st-t">${esc(st.title)}</p>${st.text ? `<p class="r-st-d">${esc(st.text)}</p>` : ''}</div></div>`).join('');
        return `<div class="cz r-steps v-cards n${n}">${head}<div class="r-stack">${cards}</div></div>`;
      }
      const rows = s.steps.map((st, k) => `<li class="r-step"${A('left', ts[k])}${k < n - 1 ? DIM(ts[k + 1]) : ''}><span class="r-node"${ON(ts[k])}${k < n - 1 ? ` data-off="${f2(ts[k + 1])}"` : ''}>${k + 1}</span><div><p class="r-st-t">${esc(st.title)}</p>${st.text ? `<p class="r-st-d">${esc(st.text)}</p>` : ''}</div>${k < n - 1 ? `<svg class="r-link" viewBox="0 0 8 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M4 0 V100"${A('draw', ts[k + 1] - 0.3, 0.35)}/></svg>` : ''}</li>`).join('');
      return `<div class="cz r-steps v-line n${n}">${head}<ol class="r-path">${rows}</ol></div>`;
    },
  },

  list: {
    label: 'Daftar', vo: 36,
    desc: 'Dua sampai lima butir sejajar: tanda, manfaat, kebiasaan. Butir muncul saat disebut.',
    visual: 'Ikon centang, silang, atau ikon katalog di setiap butir, plus ilustrasi',
    variants: { check: 'Centang', cross: 'Silang', dot: 'Titik', icon: 'Ikon' },
    keys: {
      variant: variant('check', 'cross', 'dot', 'icon'), title: tTitle(7, 40),
      items: list(2, 5, obj({ text: text(7, 42, true), icon: icon(false) })), ...COMMON,
    },
    render(s, ctx) {
      const v = s.variant || 'check', t0 = ctx.clk.t0, n = s.items.length;
      const rows = s.items.map((it, k) => {
        const t = ctx.clk.cue(it.text, k, n, 0.45);
        const mark = v === 'icon' ? `<span class="r-bi">${ic(ctx, it.icon || 'check', 'ic')}</span>` : v === 'dot' ? `<span class="r-bd"></span>` : badge(ctx, v === 'cross' ? 'no' : 'yes', t);
        return `<li class="r-li"${A('left', t)}>${mark}<span>${esc(it.text)}</span></li>`;
      }).join('');
      return `<div class="cz r-list v-${v} n${n}">${headRow(ctx, s, t0)}<ul class="r-items">${rows}</ul></div>`;
    },
  },

  compare: {
    label: 'Bandingkan', vo: 36,
    desc: 'Dua pilihan atas dan bawah: kurang tepat lalu lebih baik, sebelum lalu sesudah. Bagian kedua tiba saat disebut.',
    visual: 'Dua kartu dengan lencana silang dan centang, masing-masing boleh berilustrasi',
    variants: { split: 'Atas bawah', cols: 'Dua kolom' },
    keys: {
      variant: variant('split', 'cols'), title: text(7, 40),
      a: obj({ label: text(3, 20, true), text: text(8, 48, true), art: art(false) }),
      b: obj({ label: text(3, 20, true), text: text(8, 48, true), art: art(false) }),
    },
    validate(s, words) {
      if (s.variant !== 'cols') return [];
      return ['a', 'b'].filter(k => s[k] && (words(s[k].text) > 6 || String(s[k].text).length > 36)).map(k => `${k}.text: varian cols (kolom sempit) paling banyak 6 kata dan 36 karakter.`);
    },
    render(s, ctx) {
      const v = s.variant || 'split', t0 = ctx.clk.t0;
      const ta = ctx.clk.cue(s.a.text, 0, 2), tb = ctx.clk.cue(s.b.text, 1, 2, 0.8);
      const card = (o, kind, t) => `<div class="r-card r-cmp c-${kind}"${A(v === 'cols' ? 'up' : kind === 'no' ? 'left' : 'right', t)}>${badge(ctx, kind, t + 0.15)}<p class="r-cmp-l">${esc(o.label)}</p><p class="r-cmp-t">${esc(o.text)}</p>${o.art ? ill(ctx, o.art, 's', t + 0.25, 'pop', 'r-cmp-ill') : ''}</div>`;
      return `<div class="cz r-cmpz v-${v}">${s.title ? `<h2 class="r-h3 r-head"${A('rise', t0)}>${esc(s.title)}</h2>` : ''}<div class="r-pair">${card(s.a, 'no', ta)}${v === 'split' ? `<span class="r-arrow"${A('pop', tb - 0.15)}>${ic(ctx, 'arrow-down', 'ic')}</span>` : ''}${card(s.b, 'yes', tb)}</div></div>`;
    },
  },

  mythfact: {
    label: 'Mitos dan fakta', vo: 36,
    desc: 'Kartu mitos yang berbalik menjadi fakta saat suara sampai ke faktanya.',
    visual: 'Kartu yang berbalik, masing-masing dengan ilustrasi',
    keys: { myth: text(12, 70, true), fact: text(14, 84, true), mythArt: art(false), factArt: art(false), source: SRC },
    render(s, ctx) {
      const t0 = ctx.clk.t0, tf = Math.max(t0 + 1.4, ctx.clk.cue(s.fact, 1, 2, 1));
      return `<div class="cz r-mf"><div class="r-flip">
<div class="r-card r-face f-myth"${A('up', t0)}${` data-out="${f2(tf - 0.24)}"`}>${chip(ctx, 'help-circle', word(ctx, 'myth'), 'c-sun', t0 + 0.2)}<p class="r-h3">${esc(s.myth)}</p>${ill(ctx, s.mythArt, 'm', t0 + 0.35)}</div>
<div class="r-card r-face f-fact"${A('flipIn', tf, 0.3)}>${chip(ctx, 'check', word(ctx, 'fact'), 'c-joint', tf + 0.2)}<p class="r-h3">${esc(s.fact)}</p>${ill(ctx, s.factArt, 'm', tf + 0.3)}</div>
</div>${srcChip(ctx, s, tf + 0.5)}</div>`;
    },
  },

  diagram: {
    label: 'Diagram', vo: 40,
    desc: 'Ilustrasi besar dengan dua sampai empat label bergaris penunjuk, muncul satu per satu saat disebut.',
    visual: 'Ilustrasi besar di tengah, label dengan garis penunjuk',
    keys: { title: tTitle(7, 40), art: art(true), labels: list(2, 4, obj({ text: text(4, 24, true, 11), at: choice('tl', 'tr', 'bl', 'br', 'l', 'r') })), focus: num(1, 4, false) },
    render(s, ctx) {
      const t0 = ctx.clk.t0, n = s.labels.length;
      const auto = ['tl', 'tr', 'bl', 'br'];
      const lab = s.labels.map((l, k) => {
        const t = ctx.clk.cue(l.text, k, n, 0.45), at = l.at || auto[k];
        return `<div class="r-lab at-${at}${s.focus === k + 1 ? ' is-focus' : ''}"><svg class="r-lead" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="${/r$/.test(at) ? 'M100 50 L0 50' : 'M0 50 L100 50'}"${A('draw', t, 0.35)}/></svg><span class="r-lab-t"${A('pop', t + 0.2)}>${esc(l.text)}</span></div>`;
      }).join('');
      return `<div class="cz r-dia"><h2 class="r-h2 r-head ${fit('h2', s.title)}"${A('rise', t0)}>${esc(s.title)}</h2><div class="r-dia-box">${ill(ctx, s.art, 'xl', t0 + 0.1)}${lab}</div></div>`;
    },
  },

  footage: {
    label: 'Footage', vo: 32,
    desc: 'Video atau foto yang menunjukkan gerakannya. Teks di kartu padat, tidak pernah langsung di atas gambar.',
    visual: 'Footage atau foto penuh layar, dalam bingkai, atau di atas teks',
    variants: { full: 'Penuh', frame: 'Bingkai', split: 'Atas teks' },
    keys: { variant: variant('full', 'frame', 'split'), media: media(true), title: text(8, 48), focus: only(phrase('title', 4, 30), 'split'), text: text(14, 84), source: SRC },
    render(s, ctx) {
      const v = s.variant || 'full', t0 = ctx.clk.t0;
      if (v === 'frame') return `<div class="cz r-ft v-frame">${md(ctx, s.media, 'md-frame', 0, 'zoomIn')}${s.title ? `<span class="r-chip c-card r-ft-chip ov-ok"${A('up', t0 + 0.3)}><span>${esc(s.title)}</span></span>` : ''}${s.text ? `<p class="r-body"${A('rise', t0 + 0.5)}>${esc(s.text)}</p>` : ''}${srcChip(ctx, s, t0 + 0.6)}</div>`;
      if (v === 'split') {
        const k = s.title ? kin(ctx, s.title, { at: t0 + 0.3, focus: s.focus }) : { html: '', end: t0 + 0.3 };
        return `<div class="cz r-ft v-split">${md(ctx, s.media, 'md-top', 0, 'wipeUp')}${s.title ? `<h2 class="r-h2">${k.html}</h2>` : ''}${s.text ? `<p class="r-body"${A('rise', Math.max(t0 + 0.5, k.end + 0.1))}>${esc(s.text)}</p>` : ''}${srcChip(ctx, s, Math.max(t0 + 0.6, k.end + 0.2))}</div>`;
      }
      return `<div class="r-bg">${md(ctx, s.media, 'md-full', 0, 'fade')}</div><div class="cz r-ft v-full">${s.title || s.text ? `<div class="r-card r-plate"${A('up', t0 + 0.25)}>${s.title ? `<p class="r-h3">${esc(s.title)}</p>` : ''}${s.text ? `<p class="r-body">${esc(s.text)}</p>` : ''}${srcChip(ctx, s, t0 + 0.6)}</div>` : srcChip(ctx, s, t0 + 0.6, true)}</div>`;
    },
  },

  evidence: {
    label: 'Bukti', vo: 36,
    desc: 'Temuan satu penelitian: apa yang ditemukan, desain studi, dan jumlah peserta. Sumbernya wajib dan tampil di kartu.',
    visual: 'Kartu penelitian dengan ikon dokumen, angka bersorot',
    variants: { card: 'Kartu', number: 'Angka' },
    keys: {
      variant: variant('card', 'number'), title: tTitle(14, 90), focus: phrase('title', 4, 30),
      design: text(4, 30), sample: text(5, 32), value: only({ ...numeral(8), required: true }, 'number'),
      source: { ...SRC, required: true }, ...COMMON,
    },
    render(s, ctx) {
      const v = s.variant || 'card', t0 = ctx.clk.t0;
      const src = [].concat(s.source).map(id => ctx.sources[id]).filter(Boolean)[0] || {};
      const meta = [s.design, s.sample].filter(Boolean);
      const k = kin(ctx, s.title, { at: t0 + (v === 'number' ? 0.9 : 0.4), focus: s.focus });
      return `<div class="cz r-ev v-${v}"><div class="r-card r-ev-card"${A('up', t0)}>
<div class="r-ev-top">${ic(ctx, 'notebook', 'ic r-ev-ic')}<span class="r-ev-k">${esc(word(ctx, 'research'))}</span>${src.year ? `<span class="r-chip c-sun r-ev-y">${esc(String(src.year))}</span>` : ''}</div>
${v === 'number' ? bigNum(s.value, t0 + 0.3, 1.1, ' r-num-m') : ''}<p class="r-h3">${k.html}</p>
${meta.length ? `<p class="r-ev-meta"${A('rise', k.end + 0.15)}>${meta.map(esc).join('<i></i>')}</p>` : ''}
${src.short ? `<p class="r-ev-src"${A('fade', k.end + 0.3)}>${esc(String(src.cite || src.short).replace(/\s*(https?:\/\/\S+|PubMed \d+\.?)/g, '').trim())}</p>` : ''}</div>${ill(ctx, s.art, 's', k.end + 0.3, 'pop', 'r-corner ov-ok')}</div>`;
    },
  },

  definition: {
    label: 'Istilah', vo: 30,
    desc: 'Satu istilah dan artinya dalam bahasa sehari-hari.',
    visual: 'Ilustrasi di atas istilah, garis sorot di bawahnya',
    keys: { term: text(3, 22, true), meaning: text(16, 96, true), kicker: text(4, 26), ...COMMON },
    render(s, ctx) {
      const t0 = ctx.clk.t0;
      return `<div class="cz r-def">${ill(ctx, s.art, 'l', t0)}<p class="r-kick"${A('rise', t0 + 0.1)}>${esc(s.kicker || word(ctx, 'what'))}</p>
<h2 class="r-xl r-term ${fit('xl', s.term)}"${A('slam', t0 + 0.25)}>${esc(s.term)}<i class="r-term-u" aria-hidden="true"${A('grow', t0 + 0.6, 0.5)}></i></h2>
<p class="r-lede"${A('rise', ctx.clk.cue(s.meaning, 0, 1))}>${esc(s.meaning)}</p></div>`;
    },
  },

  tip: {
    label: 'Coba ini', vo: 36,
    desc: 'Satu latihan atau kebiasaan yang bisa dicoba: gambar gerakannya, takaran, dan cara singkat.',
    visual: 'Ilustrasi gerakan besar, chip takaran dengan ikon',
    keys: {
      title: tTitle(7, 40), art: art(true), kicker: text(3, 18),
      chips: list(1, 3, obj({ icon: icon(true), text: text(3, 16, true) })),
      how: { ...list(1, 3, text(7, 42, true)), required: false },
    },
    validate(s) { return (s.chips || []).length + (s.how || []).length > 4 ? ['chips dan how: paling banyak 4 bersama (misalnya 2 chip dan 2 cara).'] : []; },
    render(s, ctx) {
      const t0 = ctx.clk.t0;
      const chips = s.chips.map((c, k) => chip(ctx, c.icon, c.text, 'c-card', ctx.clk.cue(c.text, k, s.chips.length, 0.3))).join('');
      const how = (s.how || []).map((h, k) => `<li${A('left', ctx.clk.cue(h, k, s.how.length))}>${esc(h)}</li>`).join('');
      return `<div class="cz r-tip">${chip(ctx, 'bulb', s.kicker || word(ctx, 'tip'), 'c-sun', t0)}${ill(ctx, s.art, 'l', t0 + 0.1)}
<h2 class="r-h2 ${fit('h2', s.title)}"${A('rise', t0 + 0.3)}>${esc(s.title)}</h2><div class="r-chips">${chips}</div>${how ? `<ol class="r-how">${how}</ol>` : ''}</div>`;
    },
  },

  flags: {
    label: 'Tanda bahaya', vo: 36,
    desc: 'Kapan harus ke tenaga kesehatan: dua sampai empat tanda yang tidak boleh ditunggu.',
    visual: 'Ilustrasi peringatan, butir dengan ikon segitiga',
    keys: { title: tTitle(7, 42), items: list(2, 4, text(6, 38, true)), note: text(10, 60), ...COMMON },
    validate(s) { return s.note && (s.items || []).length > 3 ? ['note: hanya bila tanda bahaya paling banyak tiga.'] : []; },
    render(s, ctx) {
      const t0 = ctx.clk.t0, n = s.items.length;
      const rows = s.items.map((it, k) => { const t = ctx.clk.cue(it, k, n, 0.45); return `<li class="r-li"${A('left', t)}>${badge(ctx, 'warn', t)}<span>${esc(it)}</span></li>`; }).join('');
      return `<div class="cz r-flags n${n}">${headRow(ctx, { ...s, art: s.art || 'warning' }, t0)}<ul class="r-items r-card">${rows}</ul>${s.note ? `<p class="r-meta"${A('rise', ctx.clk.after(0.4))}>${esc(s.note)}</p>` : ''}</div>`;
    },
  },

  timeline: {
    label: 'Garis waktu', vo: 40,
    desc: 'Dua sampai lima tahap menurut usia atau waktu, tergambar dari atas ke bawah.',
    visual: 'Garis vertikal dengan label waktu tebal',
    keys: { title: tTitle(7, 40), points: list(2, 5, obj({ when: text(2, 10, true), text: text(7, 44, true) })), ...COMMON },
    validate(s, words) { return (s.points || []).length === 5 && s.points.some(p => words(p.text) > 5 || String(p.text).length > 32) ? ['points[].text: lima titik, text paling banyak 5 kata dan 32 karakter.'] : []; },
    render(s, ctx) {
      const t0 = ctx.clk.t0, n = s.points.length;
      const ts = s.points.map((p, k) => ctx.clk.cue(`${p.when} ${p.text}`, k, n, 0.5));
      const rows = s.points.map((p, k) => `<li class="r-tl"${A('rise', ts[k])}${k < n - 1 ? DIM(ts[k + 1]) : ''}><span class="r-when">${esc(p.when)}</span><span class="r-tl-dot"${ON(ts[k])}></span><span class="r-tl-t">${esc(p.text)}</span></li>`).join('');
      return `<div class="cz r-time n${n}">${headRow(ctx, s, t0)}<ol class="r-tls"><svg class="r-tl-line" viewBox="0 0 8 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M4 0 V100"${A('draw', ts[0], Math.max(0.6, ts[n - 1] - ts[0] + 0.3))}/></svg>${rows}</ol></div>`;
    },
  },

  recap: {
    label: 'Intinya', vo: 32,
    desc: 'Ringkasan tiga poin sebelum penutup, cepat dan berurutan.',
    visual: 'Kartu dengan centang, ilustrasi',
    keys: { title: text(5, 30), items: list(2, 3, text(5, 32, true)), ...COMMON },
    render(s, ctx) {
      const t0 = ctx.clk.t0, n = s.items.length;
      const rows = s.items.map((it, k) => { const t = ctx.clk.cue(it, k, n, 0.4); return `<li class="r-li"${A('rise', t)}>${badge(ctx, 'yes', t + 0.1)}<span>${esc(it)}</span></li>`; }).join('');
      return `<div class="cz r-recap">${ill(ctx, s.art, 'm', t0)}<h2 class="r-head ${fit('h2', s.title || word(ctx, 'recap'))}"${A('rise', t0 + 0.1)}>${esc(s.title || word(ctx, 'recap'))}</h2><ul class="r-items r-card">${rows}</ul></div>`;
    },
  },

  closing: {
    label: 'Penutup', role: 'close', full: true, vo: 22,
    desc: 'Ajakan akhir: ikuti, simpan, kirim, atau jawab di komentar. Disclaimer dan sumber tampil otomatis.',
    visual: 'Logo akun, ilustrasi simpan, kirim, atau bicara',
    variants: { follow: 'Ikuti', save: 'Simpan', share: 'Kirim', comment: 'Komentar' },
    keys: { variant: variant('follow', 'save', 'share', 'comment'), title: tTitle(9, 56), focus: phrase('title', 3, 24), cta: obj({ icon: icon(true), text: text(5, 30, true) }), ...COMMON },
    render(s, ctx) {
      const v = s.variant || 'follow', t0 = ctx.clk.t0, b = ctx.brand;
      const def = { save: 'save', share: 'send', comment: 'talk' }[v];
      const top = v === 'follow'
        ? `<div class="r-lockup"${A('pop', t0)}><span class="logo-img">${ctx.logo(s.theme)}</span>${b.logo.showWordmark === false ? '' : `<b>${esc(b.wordmark || b.name)}</b>`}</div>`
        : ill(ctx, s.art || def, 'l', t0);
      const k = kin(ctx, s.title, { at: t0 + 0.25, focus: s.focus });
      const srcs = ctx.sourceList.length ? `<p class="r-refs"${A('fade', k.end + 0.4)}><b>Sumber</b> ${esc(ctx.sourceList.join('; '))}</p>` : '';
      return `<div class="cz r-close v-${v}"><div class="r-close-main">${top}<h2 class="r-h2 ${fit('h2', s.title)}">${k.html}</h2>
${chip(ctx, s.cta.icon, s.cta.text, 'c-joint r-cta', k.end + 0.15)}</div></div>
<div class="r-foot"${A('fade', k.end + 0.35)}>${b.disclaimer ? `<p class="r-disc">${esc(b.disclaimer)}</p>` : ''}${srcs}<p class="r-handle">@${esc(b.handle)}</p></div>`;
    },
  },
};

export const OPENERS = Object.keys(SCENES).filter(k => SCENES[k].role === 'open');
export const CLOSERS = Object.keys(SCENES).filter(k => SCENES[k].role === 'close');
/* Fields every scene may carry, besides its type's own */
export const SCENE_KEYS = ['type', 'variant', 'name', 'theme', 'vo', 'duration', 'transition', 'camera', 'backdrop', 'captions', 'tone'];
/* whip: quick pan with motion blur. zoomthru: through the scene into the next. color: two brand-colour bands
   sweep across. split: the next scene opens from the middle. */
export const TRANSITIONS = ['whip', 'zoomthru', 'color', 'split', 'up', 'wipe', 'zoom', 'slide', 'circle', 'fade', 'cut'];
/* Slow camera move on the scene's content, and the soft shapes moving behind it */
export const CAMERAS = ['push', 'pull', 'left', 'right', 'rise', 'punch', 'none'];
export const BACKDROPS = ['blob', 'ring', 'dots', 'none'];

/** A scene has a picture when its type draws one or it names an illustration or footage. */
export function sceneVisual(s) {
  if (['stat', 'steps', 'diagram', 'footage', 'evidence', 'list', 'flags', 'timeline', 'compare', 'mythfact'].includes(s.type)) return true;
  if (s.type === 'hook' && ['number', 'footage', 'split'].includes(s.variant)) return true;
  if (s.type === 'closing' && (s.variant || 'follow') !== 'follow') return true;
  if (s.type === 'closing') return true;
  return !!((s.art && ART[s.art]) || s.media);
}
