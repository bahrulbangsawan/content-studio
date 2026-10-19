// The public kit for slide components: field helpers for the schema, markup helpers for the renderer,
// and the design system values the component gate checks against. Core components and the components
// written into <skill>/components/ use the same kit, so a new component is built from the same parts.
import { esc, iconSvg, M, DRAW, T, word, ARROW, CHECK, CROSS, mediaEl } from './render-kit.mjs';

/* ---------------- Schema fields ---------------- */
export const title = (words = 'titleMax', chars = 60) => ({ type: 'text', required: true, words, chars });
/* wordChars: the longest word a narrow box can hold without breaking it mid-word */
export const text = (words, chars, required = false, wordChars) => ({ type: 'text', required, words, chars, ...(wordChars ? { wordChars } : {}) });
/** A short figure: 60, 3x, 80%, 1:3. */
export const numeral = (chars = 6) => ({ type: 'text', required: true, words: 2, chars, numeral: true });
/** A phrase copied word for word from another field of the same slide, e.g. the words to highlight. */
export const phrase = (field, words, chars) => ({ type: 'text', words, chars, within: field });
export const variant = (...values) => ({ type: 'enum', values, default: values[0] });
/** A fixed choice that is not a layout, e.g. which stage of a series this slide shows. The first value is the default. */
export const choice = (...values) => ({ type: 'enum', values, default: values[0] });
/** A field that only some variants draw. Outside them the scan rejects it; inside them `required` applies. */
export const only = (spec, ...variants) => ({ ...spec, for: variants });
export const list = (min, max, item) => ({ type: 'list', required: true, min, max, item });
export const obj = (fields, required = true) => ({ type: 'object', required, fields });
export const icon = (required = true) => ({ type: 'icon', required });
export const bool = def => ({ type: 'bool', default: def });
/** A whole number in a range, e.g. where a pin sits on a photo in percent. */
export const num = (min, max, required = true) => ({ type: 'number', required, min, max });
/** A photo or video from posts/<slug>/media/: { src, alt, focus?, still? }. `kinds` limits it to image or video. */
export const media = (required = true, kinds = ['image', 'video']) => ({ type: 'media', required, kinds });
/** An illustration from the engine's catalog (art.mjs), e.g. "clock" for a slide about minutes. */
export const art = (required = false) => ({ type: 'art', required });

/* Total characters across repeated items: lets a few long items or more short ones fit the same space. */
export function budget(items, max, path) {
  const n = (Array.isArray(items) ? items : []).reduce((t, x) => t + (typeof x === 'string' ? x.length : 0), 0);
  return n > max ? [`${path}: total ${n} karakter, maksimal ${max} agar semua butir muat. Persingkat beberapa butir atau kurangi jumlahnya.`] : [];
}

/** Where a phrase sits in a text as whole words (not inside a longer word), or -1. */
export function findPhrase(text, phrase) {
  const t = String(text || ''), p = String(phrase || '');
  if (!p) return -1;
  for (let i = t.indexOf(p); i >= 0; i = t.indexOf(p, i + 1)) {
    const before = t.slice(0, i), after = t.slice(i + p.length);
    if (!/[\p{L}\p{N}]$/u.test(before) && !/^[\p{L}\p{N}]/u.test(after)) return i;
  }
  return -1;
}

/** For validate(): words longer than a variant's narrow box can hold. */
export function longWords(value, max, path) {
  const w = String(value || '').split(/\s+/).find(x => x.replace(/[^\p{L}\p{N}]/gu, '').length > max);
  return w ? [`${path}: kata "${w}" terlalu panjang untuk tata letak ini (maksimal ${max} huruf per kata). Pakai kata yang lebih pendek atau varian lain.`] : [];
}

/* ---------------- Markup ---------------- */
export const note = s => (s.note ? `<p class="x-note"${M('text', 'Catatan')}>${esc(s.note)}</p>` : '');
export const lead = s => (s.lead ? `<p class="x-lead"${M('text', 'Pengantar')}>${esc(s.lead)}</p>` : '');
/** The engine's call to action for closing components: a sentence with an icon, never a button. */
export const cta = (c, ctx) => `<div class="cta" data-comp="cta"${M('item', 'Ajakan')}><span class="cta-ic">${iconSvg(ctx.icons, c.icon, 'ic')}</span><span class="cta-t">${esc(c.text)}</span></div>`;

export { esc, iconSvg, M, DRAW, T, word, ARROW, CHECK, CROSS, mediaEl };

/* ---------------- Design system ----------------
   The values a new component may use. The gate rejects anything outside them, so a new component
   sits next to the core ones without a new size, colour, radius or spacing step. */
export const DS = {
  /* Colour tokens set per account and theme by brandCss() */
  colors: ['bg', 'card', 'ink', 'muted', 'joint', 'sun', 'face', 'rule', 'rule-2'],
  /* Type scale in px. Display sizes are for short numerals only (a value, a year, a percentage). */
  type: [30, 32, 34, 36, 40, 44, 48, 56, 64, 72, 84, 92, 104],
  display: [128, 160],
  weights: [400, 500, 550, 600, 650, 700],
  /* Corner radius: 12 for small boxes, 20 for cards, 999px only for single-line chips, 50% for circles */
  radius: [0, 8, 12, 16, 20, 24, 28],
  /* Spacing (margin, padding, gap) moves in steps of 4 px */
  spaceStep: 4,
  spaceMax: 160,
  border: 2,
  /* Classes a component may use without its own prefix: engine type styles and the ds-* kit */
  shared: ['group', 'g-center', 'ttl', 'w', 'h1', 'h2', 'lede', 'small', 'body-l', 'x-lead', 'x-note', 'ic', 'cta', 'cta-ic', 'cta-t'],
};
