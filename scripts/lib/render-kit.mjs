// Small markup helpers shared by every component renderer.
import { esc } from './common.mjs';
import { splitWords } from './motion.mjs';

export const iconSvg = (icons, name, cls, extra = '') =>
  `<svg class="${cls}"${extra} viewBox="0 0 24 24" aria-hidden="true">${(icons[name] || []).map(d => `<path d="${d}"/>`).join('')}</svg>`;

export const ARROW = ['M5 12l14 0', 'M15 16l4 -4', 'M15 8l4 4'];
export const CHECK = ['M5 12l5 5l10 -10'];
export const CROSS = ['M18 6l-12 12', 'M6 6l12 12'];

/** Motion unit: role decides how a preset moves it (title, text, item, art, word). */
export const M = (role, label) => ` data-m data-r="${role}" data-label="${esc(label)}"`;

/** A line or bar that grows along one axis, whatever the preset. Keeps its own start pose. */
const GROW = {
  x: '--from: scaleX(0); --o: 0% 50%',
  xc: '--from: scaleX(0); --o: 50% 50%',
  y: '--from: scaleY(0); --o: 50% 0%',
  yb: '--from: scaleY(0); --o: 50% 100%',
  pop: '--from: scale(0)',
  none: '--from: none',
  /* Strike-through lines: revealed left to right with clip-path so a stretched SVG keeps its stroke width */
  reveal: '--from: none; --clip0: inset(-20px 100% -20px -20px); --clip1: inset(-20px -20px -20px -20px)',
};
export const DRAW = (axis, label) => ` data-m data-r="draw" data-dur="520" data-label="${esc(label)}" style="${GROW[axis]}; --me: cubic-bezier(0.16, 1, 0.3, 1)"`;

/** Title element. With a word-by-word preset the words move and the heading itself stays put. */
export function T(ctx, tag, cls, text, d = 0, label = 'Judul') {
  return ctx.split
    ? `<${tag} class="${cls} ttl">${splitWords(esc(text))}</${tag}>`
    : `<${tag} class="${cls} ttl" data-m data-d="${d}" data-label="${label}">${esc(text)}</${tag}>`;
}

/** Title words as units when splitting, plain escaped words otherwise. */
export const word = (ctx, w, k) => (ctx.split ? `<span class="w" data-m data-r="word" data-label="Kata ${k + 1}">${esc(w)}</span>` : esc(w));

/* Where the picture is cropped when its shape differs from the frame */
const FOCAL = { center: '50% 50%', top: '50% 20%', bottom: '50% 80%', left: '20% 50%', right: '80% 50%' };

/**
 * A photo or video in a frame. The frame (`cls`) sets size and shape; the picture fills it, cropped around
 * `focus`. In the studio (ctx.mediaMode "ref") the bytes sit once in the page and the script attaches them;
 * the catalog and the gate inline them. A file that is not there yet draws an empty frame with an icon.
 * `still` is the second of a video shown in PNG exports and previews. `opts.plain` leaves out the entrance
 * motion, for a frame inside an element that already moves.
 */
export function mediaEl(ctx, m, cls, label = 'Foto', opts = {}) {
  const f = m && ctx.media && ctx.media[m.src];
  const alt = esc((m && m.alt) || '');
  const anim = opts.plain ? '' : M('art', label);
  if (!f) {
    const ic = /\.(mp4|webm)$/i.test((m && m.src) || '') ? 'video' : 'photo';
    return `<div class="md ${cls} is-missing" role="img" aria-label="${alt}"${anim}>${iconSvg(ctx.icons || {}, ic, 'md-ph')}</div>`;
  }
  const src = ctx.mediaMode === 'ref' ? ` data-media="${f.id}"` : ` src="${f.uri}"`;
  const pos = `--fp: ${FOCAL[m.focus] || FOCAL.center}`;
  const el = f.kind === 'video'
    ? `<video class="md-el"${src} muted loop playsinline preload="auto" aria-label="${alt}" data-still="${Number(m.still) || 0}" style="${pos}"></video>`
    : `<img class="md-el"${src} alt="${alt}" style="${pos}">`;
  return `<div class="md ${cls}${f.kind === 'video' ? ' is-video' : ''}"${anim}>${el}</div>`;
}

export { esc };
