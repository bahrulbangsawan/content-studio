// Renders a validated post into slide markup and the generated guide sections.
// All text is escaped; markup, sizes and colours come from the engine and the brand only.
import { COMPONENTS, roleOf, artPlace } from './components.mjs';
import { ART, artSvg } from './art.mjs';
import { slugify, contrast, ratioText } from './common.mjs';
import { uniqueIds } from './svg.mjs';
import { applyMotion, MOTIONS } from './motion.mjs';
import { esc, iconSvg, ARROW, T, M, DRAW, word } from './render-kit.mjs';
import { findPhrase } from './kit.mjs';
import { EXTRA_BODY, extraThumb } from './render-extra.mjs';
import { PLUS_BODY, plusThumb } from './render-plus.mjs';
import { CUSTOM, customCss } from './custom.mjs';
import { mediaIn } from './media.mjs';

let idSeq = 0;

const KID_BALANCE = `<svg class="kid kid-cover" viewBox="0 0 240 320" role="img" aria-label="Anak di papan jungkat-jungkit, hampir jatuh lalu seimbang lagi" data-m data-d="0" data-label="Karakter">
  <line class="k-ground" x1="16" y1="314" x2="224" y2="314"/>
  <path class="k-joint" d="M96 314 A24 24 0 0 1 144 314 Z"/>
  <g class="k-marks"><path class="k-mark" d="M36 70 q -12 16 0 32"/><path class="k-mark" d="M204 70 q 12 16 0 32"/></g>
  <g class="k-tilt">
    <rect class="k-plank" x="20" y="278" width="200" height="12" rx="6"/>
    <g class="k-body">
      <path class="k-lim" stroke-width="20" d="M110 194 L102 270"/>
      <path class="k-lim" stroke-width="20" d="M130 194 L138 270"/>
      <circle class="k-joint" cx="106" cy="232" r="9"/>
      <circle class="k-joint" cx="134" cy="232" r="9"/>
      <rect class="k-joint" x="92" y="102" width="56" height="104" rx="28"/>
      <g class="k-arm-l"><path class="k-lim" stroke-width="18" d="M100 124 L62 166"/><circle class="k-joint" cx="62" cy="166" r="10"/></g>
      <g class="k-arm-r"><path class="k-lim" stroke-width="18" d="M140 124 L178 166"/><circle class="k-joint" cx="178" cy="166" r="10"/></g>
      <path class="k-lim" stroke-width="6" d="M110 27 Q120 12 130 27"/>
      <circle class="k-head" cx="120" cy="62" r="38"/>
      <g class="k-eyes"><circle class="k-face" cx="107" cy="58" r="5"/><circle class="k-face" cx="133" cy="58" r="5"/></g>
      <path class="k-face-l k-smile" d="M107 76 Q120 88 133 76"/>
      <circle class="k-face k-oh" cx="120" cy="80" r="6.5"/>
    </g>
  </g>
</svg>`;

const KID_WAVE = `<svg class="kid kid-wave" viewBox="0 0 240 320" role="img" aria-label="Anak melambai" data-m data-d="0" data-label="Karakter">
  <line class="k-ground" x1="40" y1="312" x2="200" y2="312"/>
  <g class="k-fig">
    <path class="k-lim" stroke-width="20" d="M110 198 L102 302"/>
    <path class="k-lim" stroke-width="20" d="M130 198 L138 302"/>
    <circle class="k-joint" cx="106" cy="250" r="9"/>
    <circle class="k-joint" cx="134" cy="250" r="9"/>
    <rect class="k-joint" x="92" y="104" width="56" height="106" rx="28"/>
    <path class="k-lim" stroke-width="18" d="M100 126 L64 170"/><circle class="k-joint" cx="64" cy="170" r="10"/>
    <g class="k-wave"><path class="k-lim" stroke-width="18" d="M140 126 L182 80"/><circle class="k-joint" cx="182" cy="80" r="10"/></g>
    <g class="k-hi"><path class="k-mark" d="M204 50 q 10 12 4 26"/><path class="k-mark" d="M218 36 q 16 18 6 42"/></g>
    <path class="k-lim" stroke-width="6" d="M110 29 Q120 14 130 29"/>
    <circle class="k-head" cx="120" cy="64" r="38"/>
    <g class="k-eyes"><circle class="k-face" cx="107" cy="60" r="5"/><circle class="k-face" cx="133" cy="60" r="5"/></g>
    <path class="k-face-l" d="M106 78 Q120 92 134 78"/>
  </g>
</svg>`;

const SQUIG = `<svg class="squig-svg" viewBox="0 0 480 26" preserveAspectRatio="none" aria-hidden="true" data-m data-d="560" data-dur="500" data-label="Garis bawah" style="--from: none"><path pathLength="1" d="M6 15 Q 36 4 66 15 T 126 15 T 186 15 T 246 15 T 306 15 T 366 15 T 426 15 T 474 13"/></svg>`;

/* Title words with the focus phrase wrapped. Punctuation right after the phrase stays on its line, after the
   wrap or (inside: true, for a loop drawn around it) within it. */
function focusTitle(ctx, title, focus, wrap, inside = false) {
  let k = 0;
  const ws = str => str.split(/(\s+)/).map(p => (!p || /^\s+$/.test(p) ? p : word(ctx, p, k++))).join('');
  const i = focus && wrap ? findPhrase(title, focus) : -1;
  if (i < 0) return ws(title);
  const pre = ws(title.slice(0, i));
  const after = title.slice(i + focus.length), punct = (after.match(/^\S+/) || [''])[0];
  const words = ws(focus), tail = punct ? word(ctx, punct, k++) : '';
  if (inside) return pre + wrap(words + tail) + ws(after.slice(punct.length));
  const mid = wrap(words) + tail;
  return pre + (punct ? `<span class="cv-nb">${mid}</span>` : mid) + ws(after.slice(punct.length));
}

/* A hand-drawn loop around a phrase: flat sides and round corners, so it clears the first and last letter without
   growing wider than the line. Three widths keep the stroke even from a short word to a long phrase. */
const RINGS = [
  [340, 'M300 16 C230 4 110 2 52 12 C16 18 6 40 6 58 C6 86 28 102 80 104 C150 108 250 108 292 102 C326 96 334 72 334 52 C334 28 314 12 262 8'],
  [500, 'M460 16 C360 4 140 2 60 12 C18 18 6 40 6 58 C6 86 30 102 92 104 C200 108 380 108 446 102 C486 96 494 72 494 52 C494 28 470 12 404 8'],
  [760, 'M716 16 C560 4 200 2 70 12 C20 18 6 40 6 58 C6 86 32 102 104 104 C280 108 580 108 696 102 C744 96 754 72 754 52 C754 28 726 12 640 8'],
];

/* ---------------- Components ---------------- */
const BODY = {
  cover(s, ctx) {
    const v = s.variant || 'underline';
    const kicker = s.kicker ? `<p class="kicker"${M('text', 'Kalimat')}>${esc(s.kicker)}</p>` : '';
    const h1 = (inner, cls = '') => `<h1 class="h1 ttl${cls}"${ctx.split ? '' : M('title', 'Judul')}>${inner}</h1>`;
    /* bottom sits low on purpose: g-end tells the balance check so */
    const box = (inner, center) => `<div class="group x-cv v-${v}${center ? ' g-center' : ''}${v === 'bottom' ? ' g-end' : ''}" data-comp="cover">${inner}</div>`;
    const plain = () => focusTitle(ctx, s.title.trim());
    if (v === 'bottom') return box(`${h1(plain())}${kicker ? `<i class="cv-rule"${DRAW('x', 'Garis')}></i>${kicker}` : ''}`);
    if (v === 'poster') return box(`${h1(s.title.trim().split(/\s+/).map((w, k) => `<span class="cv-pw">${word(ctx, w, k)}</span>`).join(' '))}${kicker}`);
    if (v === 'highlight') return box(`${h1(focusTitle(ctx, s.title.trim(), s.focus, x => `<mark class="cv-hl">${x}</mark>`))}${kicker}`);
    if (v === 'strike') return box(`${h1(focusTitle(ctx, s.title.trim(), s.focus, x => `<span class="cv-st">${x}<svg class="cv-x" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true"${DRAW('reveal', 'Coretan')}><path d="M1 13 C30 9 70 11 99 7"/></svg></span>`))}${kicker}`);
    if (v === 'circle') {
      const [w, d] = RINGS[s.focus.length <= 5 ? 0 : s.focus.length <= 9 ? 1 : 2];
      const ring = `<svg class="cv-o drawn" viewBox="0 0 ${w} 112" preserveAspectRatio="none" aria-hidden="true" data-m data-r="draw" data-dur="640" data-label="Lingkaran" style="--from: none"><path pathLength="1" d="${d}"/></svg>`;
      return box(`${h1(focusTitle(ctx, s.title.trim(), s.focus, x => `<span class="cv-ci">${x}${ring}</span>`, true))}${kicker}`, true);
    }
    if (v === 'fade') return box(`${h1(focusTitle(ctx, s.title.trim(), s.focus, x => `<span class="cv-on">${x}</span>`))}${kicker}`);
    if (v === 'card') return box(`<div class="cv-card"${M('art', 'Kartu')}>${h1(plain())}${kicker}</div>`);
    if (v === 'tags') return box(`${h1(plain())}<ul class="cv-tags">${s.tags.map((t, k) => `<li class="cv-tag"${M('item', `Tanda ${k + 1}`)}>${esc(t)}</li>`).join('')}</ul>${kicker}`);
    if (v === 'blank') return box(`${h1(`${plain()} <span class="cv-bl" role="img" aria-label="titik-titik"><svg viewBox="0 0 280 14" preserveAspectRatio="none" aria-hidden="true"${DRAW('x', 'Garis kosong')}><line x1="5" y1="7" x2="275" y2="7"/></svg></span>`)}${kicker}`);
    if (v === 'quote') {
      const qm = c => (ctx.split ? `<span class="cv-qm w" data-m data-r="word" data-label="Kutip">${c}</span>` : `<span class="cv-qm">${c}</span>`);
      return box(`${h1(`${qm('“')}${plain()}${qm('”')}`)}<i class="cv-qr"${DRAW('x', 'Garis')}></i>${kicker}`);
    }
    /* underline: the first cover, with hand-tuned timing and the optional character */
    const words = s.title.trim().split(/\s+/);
    const last = words.pop();
    const head = ctx.split ? words.map((w, k) => word(ctx, w, k)).join(' ') : esc(words.join(' '));
    const tail = word(ctx, last, words.length);
    const title = s.underline === false
      ? `${head}${words.length ? ' ' : ''}${tail}`
      : `${words.length ? head + ' ' : ''}<span class="squig">${tail}${SQUIG}</span>`;
    /* The supporting line follows the title: a small label above a headline only adds a line to read. */
    return `<div class="group g-center x-cv v-underline" data-comp="cover">${s.character === 'balance' ? KID_BALANCE : ''}
  <div class="txt"><h1 class="h1 ttl"${ctx.split ? '' : ' data-m data-d="80" data-label="Judul"'}>${title}</h1>${s.kicker ? `\n<p class="kicker" data-m data-d="280" data-label="Kalimat">${esc(s.kicker)}</p>` : ''}</div>
</div>`;
  },
  statement(s, ctx) {
    return `<div class="group" data-comp="statement">${T(ctx, 'h2', 'h2', s.title)}\n<p class="body-l" data-m data-d="160" data-label="Isi">${esc(s.body)}</p></div>`;
  },
  steps(s, ctx) {
    const n = s.steps.length;
    const tops = { 2: [0, 260], 3: [0, 210, 420], 4: [0, 153, 306, 460] }[n];
    const H = tops[n - 1] + 120;
    const pt = k => ({ x: k % 2 ? 428 : 60, y: tops[k] + 60 });
    const segs = [];
    for (let k = 0; k + 1 < n; k++) { const a = pt(k), b = pt(k + 1); segs.push(`M${a.x} ${a.y} C${a.x} ${a.y + 80} ${b.x} ${b.y - 80} ${b.x} ${b.y}`); }
    const d = `M${pt(0).x} ${pt(0).y} ` + segs.map(sg => sg.replace(/^M\S+ \S+ /, '')).join(' ');
    const chips = s.steps.map((t, k) => `<div class="chip${k === n - 1 ? ' is-focal' : ''}" role="listitem" data-m data-d="${150 + k * 250}" data-dur="300" data-maxdur="300" data-label="Langkah ${k + 1}" style="left: ${k % 2 ? 368 : 0}px; top: ${tops[k]}px; --from: scale(0.6)"><span class="num">${k + 1}</span> <span class="t">${esc(t)}</span></div>`).join('\n');
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}
<div class="steps" role="list" data-comp="steps" style="height: ${H}px">
  <svg class="steps-svg" viewBox="0 0 888 ${H}" aria-hidden="true" data-segs="${esc(JSON.stringify(segs))}">
    <path class="st-base" d="${d}"/><path class="st-prog" pathLength="1" d="${d}"/>
    <circle class="st-dot" r="16" cx="${pt(0).x}" cy="${pt(0).y}" data-m data-d="150" data-dur="750" data-label="Titik berjalan" style="--from: scale(0.4)"/>
  </svg>
${chips}
</div></div>`;
  },
  venn(s, ctx) {
    const side = (o, cls, cx, tx, ix, from, d, label) => `<g class="vn" data-m data-d="${d}" data-label="${label}" style="--from: ${from}">
  <circle class="vc ${cls}" cx="${cx}" cy="210" r="196"/>
  ${iconSvg(ctx.icons, o.icon, 'vi', ` x="${ix}" y="72" width="72" height="72"`)}
  <text class="vt" x="${tx}" y="208" text-anchor="middle">${esc(o.label)}</text>
  <text class="vs" x="${tx}" y="256" text-anchor="middle">${esc(o.sub)}</text>
</g>`;
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}
<svg class="venn" viewBox="0 0 888 470" role="img" aria-label="${esc(`Diagram Venn: ${s.left.label} dan ${s.right.label} bertemu di ${s.overlap}`)}" data-comp="venn">
${side(s.left, 'vc-l', 292, 250, 214, 'translate(-110px, 0px)', 120, 'Lingkaran kiri')}
${side(s.right, 'vc-r', 596, 638, 602, 'translate(110px, 0px)', 200, 'Lingkaran kanan')}
<line class="lead" x1="444" y1="334" x2="444" y2="392" data-m data-d="520" data-dur="400" data-label="Garis penunjuk" style="--from: scale(1, 0)"/>
<g class="vn vn-mid" data-m data-d="600" data-dur="500" data-label="Kapsul irisan" style="--from: scale(0.6)"><rect class="pill-bg" x="294" y="392" width="300" height="64" rx="32"/><text class="pill-t" x="444" y="436" text-anchor="middle">${esc(s.overlap)}</text></g>
</svg>
<div class="bubble" data-comp="bubble" data-m data-d="680" data-dur="500" data-label="Gelembung"><i class="tail" aria-hidden="true"></i><p>${esc(s.note)}</p></div></div>`;
  },
  list(s, ctx) {
    const rows = s.items.map((t, k) => `<li class="sign" data-m data-d="${120 + k * 80}" data-label="Butir ${k + 1}" style="--from: translate3d(${k % 2 ? 40 : -40}px, 0, 0)"><span class="sign-n" aria-hidden="true"></span> <span class="sign-t">${esc(t)}</span></li>`).join('\n');
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}
<ol class="signs" data-comp="signs">${rows}</ol>${s.note ? `<p class="small signs-note" data-m data-d="560" data-label="Catatan">${esc(s.note)}</p>` : ''}</div>`;
  },
  tiles(s, ctx) {
    /* Three rows, the icon beside its title without a tile around it */
    const row = (t, k) => `  <div class="tile" data-m data-d="${120 + k * 80}" data-label="Baris ${k + 1}">${iconSvg(ctx.icons, t.icon, 'ic tile-ic')}<div class="tile-txt"><span class="tile-h">${esc(t.title)}</span> <span class="tile-b">${esc(t.text)}</span></div></div>`;
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}
<div class="tiles" data-comp="tiles">
${s.tiles.map(row).join('\n')}
</div></div>`;
  },
  closing(s, ctx) {
    return `<div class="group g-center" data-comp="closing">${s.character === 'wave' ? KID_WAVE : ''}
  <div class="txt">${T(ctx, 'h2', 'h1', s.title, 120)}\n${s.lede ? `<p class="lede" data-m data-d="240" data-label="Kalimat">${esc(s.lede)}</p>` : ''}</div>
  <div class="cta" data-comp="cta" data-m data-d="360" data-label="Ajakan"><span class="cta-ic">${iconSvg(ctx.icons, s.cta.icon, 'ic')}</span><span class="cta-t">${esc(s.cta.text)}</span></div>
</div>`;
  },
  ...EXTRA_BODY,
  ...PLUS_BODY,
};

/* A custom component renders what follows its title. The engine draws the group and the title, so every
   component opens the same way: no label or badge above the heading, the same heading size and entrance.
   With `title: 'inside'` the renderer places ctx.title itself, for a title that sits in a card. */
function customBody(def) {
  return (s, ctx) => {
    const v = def.variants ? s.variant || def.keys.variant.default : '';
    const title = def.role === 'open' ? T(ctx, 'h1', 'h1', s.title) : T(ctx, 'h2', def.role ? 'h1' : 'h2', s.title);
    const inner = def.render(s, { ...ctx, title, variant: v });
    const cls = `group x-${def.id}${v ? ` v-${v}` : ''}${def.align === 'center' ? ' g-center' : ''}`;
    return `<div class="${cls}" data-comp="${def.id}">${def.title === 'inside' ? inner : title + inner}</div>`;
  };
}
for (const def of Object.values(CUSTOM)) BODY[def.id] = customBody(def);

/* The slide's illustration, where its component has room: above the title (top) or beside it (side).
   `icon` placements are drawn by the component itself (action). */
const TITLE_EL = /<(h1|h2|blockquote)\b[^>]*\bclass="[^"]*\bttl\b[^"]*"[^>]*>[\s\S]*?<\/\1>/;
function placeArt(body, s) {
  if (!s.art || !ART[s.art]) return body;
  const at = artPlace(s), ill = cls => artSvg(s.art, cls, M('art', 'Ilustrasi'));
  if (at === 'top') return body.replace(/^(\s*<div class="group[^"]*"[^>]*>)/, m => `${m}${ill('ill-top')}`);
  if (at === 'side') return body.replace(TITLE_EL, m => `<div class="ill-row">${m}${ill('ill-side')}</div>`);
  return body;
}

/** The entrance preset a slide uses: its own choice, else the variant's or component's default, else classic. */
export function motionOf(s) {
  const comp = COMPONENTS[s.component];
  const v = comp.variants ? s.variant || comp.keys.variant.default : null;
  const own = (comp.motions && comp.motions[v]) || comp.motion;
  if (s.motion && !(s.motion === 'classic' && own)) return s.motion;
  return own || 'classic';
}

function logo(ctx, theme) {
  return `<span class="logo-img" aria-hidden="true">${uniqueIds(theme === 'dark' ? ctx.logoDark : ctx.logoLight, 'l' + ++idSeq)}</span>`;
}

/** One slide as it appears in a post, for pages other than the studio (the component catalog). */
export const renderSlide = (s, i, n, ctx) => slideHtml(s, i, n, ctx);

/* A display title (h1 size) steps down when it holds a very long word, so the word wraps whole instead of
   breaking mid-word: 13 or 14 letters at 92 px, 15 or more at 80 px. */
function fitTitle(body, s) {
  const comp = COMPONENTS[s.component];
  const longest = Math.max(0, ...String(s[comp.titleKey || 'title'] || '').split(/\s+/).map(w => w.replace(/[^\p{L}\p{N}]/gu, '').length));
  const cls = longest >= 15 ? 'ttl-xlong' : longest >= 13 ? 'ttl-long' : '';
  return cls ? body.replace(/class="h1\b/, `class="h1 ${cls}`) : body;
}

function slideHtml(s, i, n, ctx) {
  const b = ctx.brand;
  const last = roleOf(s.component) === 'close';
  const motion = motionOf(s);
  const body = applyMotion(fitTitle(placeArt(BODY[s.component](s, { ...ctx, split: !!(MOTIONS[motion] && MOTIONS[motion].split) }), s), s), motion);
  const head = `<div class="zone z-head"><span class="logo">${logo(ctx, s.theme)}${b.logo.showWordmark === false ? '' : `<b>${esc(b.wordmark || b.name)}</b>`}</span><span class="count">${i + 1}/${n}</span></div>`;
  const foot = last
    ? `<div class="zone z-foot stack">${b.disclaimer ? `<p class="small">${esc(b.disclaimer)}</p>` : ''}<span class="handle">@<span class="h-name">${esc(b.handle)}</span></span></div>`
    : `<div class="zone z-foot"><span class="handle">@<span class="h-name">${esc(b.handle)}</span></span><span class="swipe">${esc(b.swipeLabel || 'Geser')}${iconSvg({ a: ARROW }, 'a', 'ic')}</span></div>`;
  return `<section class="slide is-${s.theme}${i === 0 ? ' is-active' : ''}" role="group" aria-roledescription="slide" aria-label="${i + 1} dari ${n}: ${esc(s.name)}">
<div class="canvas">${head}<div class="content">${body}</div>${foot}</div>
</section>`;
}

/* ---------------- Guide pieces ---------------- */
function thumb(s, ctx) {
  /* Cards stay light on dark slides, with dark text on them (cink) */
  const t = { ...ctx.brand.colors[s.theme], card: ctx.brand.colors.light.card, cink: ctx.brand.colors.light.ink }, hi = ctx.brand.colors.highlight;
  const r = (x, y, w, h, f, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(h / 2, 3)}" fill="${f}"${extra}/>`;
  const bars = (y, w1, w2) => r(7, y, w1, 3, t.ink) + (w2 ? r(7, y + 5, w2, 3, t.ink) : '');
  const inner = {
    cover: `${r(9, 20, 30, 5, t.ink)}${r(12, 28, 24, 5, t.ink)}${r(26, 35, 10, 2, hi)}${r(13, 42, 22, 3, t.muted)}`,
    statement: bars(13, 28, 18) + [26, 32, 38, 44].map(y => r(7, y, 34, 3, t.muted)).join(''),
    steps: bars(13, 28, 18) + [26, 34, 42, 50].map((y, k) => r(k % 2 ? 21 : 7, y, 20, 5, k === 3 ? hi : t.accent)).join(''),
    venn: bars(13, 24) + `<circle cx="19" cy="33" r="9" fill="${t.accent}" fill-opacity="0.35" stroke="${t.ink}" stroke-width="1"/><circle cx="29" cy="33" r="9" fill="${hi}" fill-opacity="0.45" stroke="${t.ink}" stroke-width="1"/>` + r(17, 46, 14, 4, t.ink) + r(9, 52, 30, 4, t.card, ` stroke="${t.accent}" stroke-width="0.8"`),
    list: bars(13, 30, 18) + [26, 32, 38, 44, 50].map(y => r(7, y - 2, 34, 0.6, t.muted) + `<circle cx="9" cy="${y + 1}" r="1.4" fill="${t.accent}"/>` + r(13, y, 26, 2.5, t.ink)).join(''),
    tiles: bars(13, 18) + [24, 35, 46].map(y => r(7, y - 2, 34, 0.6, t.muted) + r(7, y, 5, 5, t.accent) + r(15, y, 22, 3, t.ink) + r(15, y + 4, 16, 2, t.muted)).join(''),
    closing: `${r(10, 22, 28, 5, t.ink)}${r(14, 30, 20, 3, t.muted)}<circle cx="15" cy="42" r="3" fill="${t.accent}"/>${r(20, 41, 16, 3, t.ink)}`,
  }[s.component] || plusThumb(s.component, t, hi, r) || extraThumb(s.component, t, hi, r);
  return `<svg class="th" viewBox="0 0 48 60" aria-hidden="true"><rect x="0.5" y="0.5" width="47" height="59" rx="6" fill="${t.bg}" stroke="${t.ink}" stroke-opacity="0.18"/><circle cx="8" cy="7" r="2.5" fill="${t.accent}"/>${inner}</svg>`;
}

function flowNodes(post, ctx) {
  return post.slides.map((s, k) => {
    const row = Math.floor(k / 3), col = row % 2 === 0 ? k % 3 : 2 - (k % 3);
    return `<button type="button" class="fnode" data-go="${k}" aria-current="${k === 0}" style="grid-row: ${row + 1}; grid-column: ${col + 1}">${thumb(s, ctx)}<span><i>${k + 1}</i> ${esc(s.name)}</span></button>`;
  }).join('\n              ');
}

function typeLadder(post, brand) {
  const first = (s, n) => String(s || '').trim().split(/\s+/).slice(0, n).join(' ');
  const cover = post.slides[0], second = post.slides[1] || {};
  const anyBody = post.slides.map(s => s.lede || s.body || s.note || s.sub || s.example).find(Boolean) || brand.name;
  const firstText = s => {
    const v = (s.steps || s.items || s.quotes || s.terms || s.rows || s.tiles || [])[0];
    return typeof v === 'string' ? v : v && (v.text || v.title || v.right);
  };
  const anyCard = post.slides.map(firstText).find(Boolean) || 'Isi kartu';
  const rows = [
    ['Judul cover', '104/110, 700', first(cover.title, 1), 52, 56, 700],
    ['Judul isi', '84/92, 700', first(second.title, 2), 42, 46, 700],
    ['Kalimat dan isi', '40/54, 400', first(anyBody, 3), 20, 27, 400],
    ['Isi kartu dan chip', '36/44, 550', first(anyCard, 2), 18, 22, 550],
    ['Kicker', '34/42, 550', first(cover.kicker || 'Kicker', 2), 17, 21, 550],
  ];
  const html = rows.map(([b, m, sample, fs, lh, fw]) => `<div class="lrow"><span class="ls" style="font-size: ${fs}px; line-height: ${lh}px; font-weight: ${fw};">${esc(sample)}</span><span class="lm"><b>${b}</b>${m}</span></div>`);
  html.push(`<div class="lrow is-floor"><span class="ls" style="font-size: 15px; line-height: 20px; font-weight: 400;">${esc(first(brand.disclaimer || 'Catatan kecil', 3))}</span><span class="lm"><b>Kecil, batas bawah</b>${ctxMin}/40, 400</span></div>`);
  return html.join('\n              ');
}
let ctxMin = 30;

function colors(brand) {
  const c = brand.colors;
  const sw = (name, hex, fg, bg, use) => `<div class="swc"><i style="background: ${hex}"></i><b>${esc(name)}</b><code>${hex}</code><span>${use} <span data-contrast="${fg},${bg}">${ratioText(contrast(fg, bg))}</span>.</span></div>`;
  return `<div class="swatches">
            ${sw('Latar terang', c.light.bg, c.light.ink, c.light.bg, 'Teks di atasnya')}
            ${sw('Latar gelap', c.dark.bg, c.dark.ink, c.dark.bg, 'Teks di atasnya')}
            ${sw('Aksen terang', c.light.accent, c.light.bg, c.light.accent, 'Teks latar di atasnya')}
            ${sw('Aksen gelap', c.dark.accent, c.dark.bg, c.dark.accent, 'Teks latar di atasnya')}
            ${sw('Sorotan', c.highlight, c.onHighlight, c.highlight, 'Penanda, teks di atasnya')}
            ${sw('Teks pendukung', c.light.muted, c.light.muted, c.light.bg, 'Di latar terang')}
          </div>`;
}

function compCards(post) {
  const used = new Map();
  post.slides.forEach((s, i) => { if (!used.has(s.component)) used.set(s.component, []); used.get(s.component).push(i); });
  const cards = [];
  const card = (key, idx, name, spec, rule) => cards.push(`<button type="button" class="comp" data-comp="${key}" data-slides="${idx.join(',')}"><span class="where">Slide ${idx.map(i => i + 1).join(' dan ')}<span class="here-t">ada di slide ini</span></span><b>${esc(name)}</b><span class="spec">${esc(spec)}</span><span class="rl">${esc(rule)}</span></button>`);
  for (const [comp, idx] of used) {
    const c = COMPONENTS[comp];
    const vs = c.variants ? [...new Set(idx.map(i => c.variants[post.slides[i].variant || c.keys.variant.default]))] : [];
    card(comp === 'list' ? 'signs' : comp, idx, c.label, vs.length ? `${c.spec}. Varian: ${vs.join(', ').toLowerCase()}` : c.spec, c.rule);
    if (comp === 'venn') card('bubble', idx, 'Gelembung', 'Radius 28, teks 36/48', 'Ekor menunjuk irisan yang dijelaskan.');
    if (c.role === 'close') card('cta', idx, 'Ajakan', 'Ikon 88 px, teks 40/48', 'Kalimat dengan ikon, bukan tombol.');
  }
  return cards.join('\n            ');
}

function motionList(post) {
  const used = new Map();
  post.slides.forEach((s, i) => { const m = motionOf(s); if (!used.has(m)) used.set(m, []); used.get(m).push(i + 1); });
  const card = (key, label, desc) => `<div class="mp${used.has(key) ? ' is-used' : ''}"><b>${esc(label)}</b><code>${key}</code><span>${esc(desc)}</span>${used.has(key) ? `<span class="mp-u">Slide ${used.get(key).join(', ')}</span>` : ''}</div>`;
  return [card('classic', 'Bawaan', 'Waktu asli tujuh komponen pertama.'), ...Object.entries(MOTIONS).map(([k, m]) => card(k, m.label, m.desc))].join('\n            ');
}

function brandDos(brand) {
  return (brand.dos || []).map(([d, x]) => `<div class="do-pair"><p class="do"><svg class="ic" aria-hidden="true"><use href="#i-check"/></svg><span>${esc(d)}</span></p><p class="dont"><svg class="ic" aria-hidden="true"><use href="#i-x"/></svg><span>${esc(x)}</span></p></div>`).join('\n            ');
}

/* Slide tokens per theme, plus the light palette as --l-*: cards on a dark slide switch back to it
   (see "Permukaan terang" in 02-slides.css), so a card looks the same on every slide. */
export function brandCss(brand) {
  const t = (c, p = 's') => `--${p}-bg: ${c.bg}; --${p}-card: ${c.card || brand.colors.light.card}; --${p}-ink: ${c.ink}; --${p}-muted: ${c.muted}; --${p}-joint: ${c.accent}; --${p}-rule: color-mix(in srgb, ${c.ink} 15%, transparent); --${p}-rule-2: color-mix(in srgb, ${c.ink} 32%, transparent);`;
  const c = brand.colors;
  return `.slide { --s-sun: ${c.highlight}; --s-face: ${c.onHighlight}; ${t(c.light, 'l')} } .slide.is-light { ${t(c.light)} } .slide.is-dark { ${t(c.dark)} }`;
}

/** Everything build.mjs substitutes into the engine. */
export function renderPost(post, ctx) {
  idSeq = 0;
  ctxMin = ctx.rules.minTextPx;
  const n = post.slides.length;
  const metaOf = s => {
    const comp = COMPONENTS[s.component];
    /* A photo drifts slowly and a video plays, so their frames keep changing after the entrance */
    const media = mediaIn(s, comp.keys).map(m => ctx.media && ctx.media[m.value.src]).filter(Boolean);
    const loops = (s.component === 'cover' && s.character === 'balance') || (s.component === 'closing' && s.character === 'wave') || media.length > 0 || !!(s.art && ART[s.art] && ART[s.art].loops);
    const motion = motionOf(s), v = comp.variants && comp.variants[s.variant || comp.keys.variant.default];
    return {
      name: s.name,
      slug: slugify(s.name),
      theme: s.theme === 'dark' ? 'Gelap' : 'Terang',
      goal: s.goal || comp.goal,
      visual: `${comp.visual}${v ? `. Varian: ${v.toLowerCase()}` : ''}. Gerak: ${MOTIONS[motion] ? MOTIONS[motion].label.toLowerCase() : 'bawaan komponen'}.`,
      titleMax: comp.titleWords || (comp.role ? ctx.rules.coverTitleMax : ctx.rules.titleMax),
      clipMs: s.component === 'closing' && loops ? 4800 : s.component === 'cover' && loops ? 3600 : 3000,
      loops,
    };
  };
  const meta = post.slides.map(metaOf);
  /* Alternative covers and closings wait in templates; the studio swaps one into the first or last slide
     (see "Pilihan cover dan penutup") */
  const covers = post.covers || [], closings = post.closings || [];
  const altMeta = (base, list) => (list.length ? [base, ...list].map(s => {
    const comp = COMPONENTS[s.component], v = comp.variants && comp.variants[s.variant || comp.keys.variant.default];
    return { ...metaOf(s), hook: v ? `${comp.label}, ${v.toLowerCase()}` : comp.label, thumb: thumb(s, ctx) };
  }) : []);
  const alts = [
    ...covers.map((s, k) => `<template class="alt-cover" data-k="${k + 1}">${slideHtml(s, 0, n, ctx)}</template>`),
    ...closings.map((s, k) => `<template class="alt-close" data-k="${k + 1}">${slideHtml(s, n - 1, n, ctx)}</template>`),
  ].join('\n');
  const b = ctx.brand;
  return {
    TITLE: esc(post.title),
    BRAND_CSS: brandCss(b),
    COMP_CSS: customCss([...post.slides, ...covers, ...closings].map(s => s.component)),
    NAV_LOCKUP: `${logo(ctx, 'light')}<b>${esc(b.wordmark || b.name)}</b>`,
    SLIDES: post.slides.map((s, i) => slideHtml(s, i, n, ctx)).join('\n') + (alts ? `\n${alts}` : ''),
    FLOW_NODES: flowNodes(post, ctx),
    FLOW_PATHS: Array.from({ length: Math.max(0, n - 1) }, () => '<path marker-end="url(#fa-m)"/>').join(''),
    TYPE_LADDER: typeLadder(post, b),
    COLORS: colors(b),
    COMP_CARDS: compCards(post),
    MOTION_LIST: motionList(post),
    BRAND_DOS: brandDos(b),
    BRAND_NAME: esc(b.name),
    STAGE_LABEL: esc(`${post.title}, ${n} slide. Pakai panah kiri dan kanan untuk berpindah.`),
    POST_FILE: esc(`posts/${post.slug}/post.json`),
    DATA: { brand: { id: b.id, name: b.name, handle: b.handle }, post: { slug: post.slug, title: post.title }, rules: ctx.rules, meta, covers: altMeta(post.slides[0], covers), closings: altMeta(post.slides[n - 1], closings) },
  };
}
