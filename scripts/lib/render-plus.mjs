// Renderers for the fourth batch: photo and video components, openers that promise the content, content
// that asks the reader to think (quiz, scale, template), and closings with one clear call to action.
// Motion attributes are finished later by applyMotion() in motion.mjs, so markup only names roles.
import { esc, iconSvg, M, DRAW, T, word, CHECK, CROSS, note, cta, mediaEl } from './kit.mjs';
import { artSvg } from './art.mjs';

const V = (s, def) => s.variant || def;
const LETTERS = 'ABC';
const kick = s => (s.kicker ? `<p class="kicker"${M('text', 'Kalimat')}>${esc(s.kicker)}</p>` : '');
/* Title words as units for word-by-word presets, starting at word k0 */
const words = (ctx, str, k0 = 0) => String(str).trim().split(/\s+/).map((w, k) => word(ctx, w, k0 + k)).join(' ');
const h1 = (ctx, inner, cls = '') => `<h1 class="h1 ttl${cls}"${ctx.split ? '' : M('title', 'Judul')}>${inner}</h1>`;

export const PLUS_BODY = {
  /* ---------------- Pembuka ---------------- */
  photo(s, ctx) {
    const v = V(s, 'full');
    const h = T(ctx, 'h1', 'h1', s.title);
    /* full and card: the picture sits behind the header and fades into the slide colour, the words stay on that colour */
    if (v === 'full') return `<div class="group x-ph v-full g-end" data-comp="photo">${mediaEl(ctx, s.media, 'ph-m bleed', 'Foto')}<div class="ph-txt">${h}${kick(s)}</div></div>`;
    if (v === 'card') return `<div class="group x-ph v-card g-end" data-comp="photo">${mediaEl(ctx, s.media, 'ph-m bleed', 'Foto')}<div class="ph-panel">${h}${kick(s)}</div></div>`;
    if (v === 'circle') return `<div class="group g-center x-ph v-circle" data-comp="photo">${mediaEl(ctx, s.media, 'ph-o', 'Foto')}${h}${kick(s)}</div>`;
    return `<div class="group x-ph v-frame" data-comp="photo">${mediaEl(ctx, s.media, 'ph-f', 'Foto')}${h}${kick(s)}</div>`;
  },

  teaser(s, ctx) {
    const v = V(s, 'index');
    const h = T(ctx, 'h1', 'h1', s.title);
    if (v === 'search') {
      const glass = iconSvg(ctx.icons, 'search', 'ic');
      const sg = s.suggest ? `<ul class="ts-sg">${s.suggest.map((t, k) => `<li class="ts-s"${M('item', `Saran ${k + 1}`)}><span class="ts-si">${glass}</span><span>${esc(t)}</span></li>`).join('')}</ul>` : '';
      return `<div class="group x-ts v-search" data-comp="teaser"><div class="ts-box"${M('art', 'Kotak cari')}><span class="ts-ic">${glass}</span>${h}</div>${sg}${kick(s)}</div>`;
    }
    if (v === 'icons') return `<div class="group x-ts v-icons" data-comp="teaser">${h}<div class="ts-ir">${s.icons.map((it, k) => `<div class="ts-i"${M('item', `Isi ${k + 1}`)}><span class="ts-c">${iconSvg(ctx.icons, it.icon, 'ic')}</span><p class="ts-l">${esc(it.label)}</p></div>`).join('')}</div>${kick(s)}</div>`;
    return `<div class="group x-ts v-index" data-comp="teaser">${h}<ol class="ts-ol">${s.items.map((t, k) => `<li class="ts-li"${M('item', `Isi ${k + 1}`)}><span class="ts-n">${k + 1}</span><span class="ts-t">${esc(t)}</span></li>`).join('')}</ol>${kick(s)}</div>`;
  },

  contrast(s, ctx) {
    const v = V(s, 'turn');
    /* Both lines are the title: the old belief first, then the one to remember */
    const nb = String(s.before).trim().split(/\s+/).length;
    const a = words(ctx, s.before), b = words(ctx, s.title, nb);
    if (v === 'band') return `<div class="group x-ct v-band" data-comp="contrast">${h1(ctx, `<span class="ct-a">${a}</span><span class="ct-b"><span class="ct-hl">${b}</span></span>`, ' ct-h')}${kick(s)}</div>`;
    if (v === 'split') return `<div class="group x-ct v-split" data-comp="contrast">${h1(ctx, `<span class="ct-a ct-box">${a}</span><span class="ct-b ct-box">${b}</span>`, ' ct-h')}${kick(s)}</div>`;
    const strike = `<svg class="ct-x" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true"${DRAW('reveal', 'Coretan')}><path d="M1 12 C30 8 70 10 99 6"/></svg>`;
    return `<div class="group x-ct v-turn" data-comp="contrast">${h1(ctx, `<span class="ct-a"><span class="ct-st">${a}${strike}</span></span><span class="ct-b">${b}</span>`, ' ct-h')}${kick(s)}</div>`;
  },

  /* ---------------- Isi dengan foto ---------------- */
  figure(s, ctx) {
    const v = V(s, 'frame');
    const m = mediaEl(ctx, s.media, `fg-m${v === 'bleed' ? ' bleed' : ''}`, 'Foto');
    const cap = `<p class="fg-c"${M('text', 'Keterangan')}>${esc(s.caption)}</p>`;
    const body = v === 'overlay' ? `${m}<div class="fg-card">${cap}</div>` : `${m}${cap}`;
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-fg v-${v}" data-comp="figure">${body}</div></div>`;
  },

  photopair(s, ctx) {
    const v = V(s, 'side');
    const lab = (o, right) => `<p class="pp-l${right ? ' is-r' : ''}">${s.marks ? `<span class="pp-ic">${iconSvg({ i: right ? CHECK : CROSS }, 'i', 'ic')}</span>` : ''}<span>${esc(o.label)}</span></p>`;
    const cell = (o, right) => `<div class="pp-c"${M('item', right ? 'Foto kanan' : 'Foto kiri')}>${mediaEl(ctx, o.media, 'pp-m', 'Foto', { plain: true })}${lab(o, right)}</div>`;
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-pp v-${v}" data-comp="photopair">${cell(s.left, false)}${cell(s.right, true)}</div>${note(s)}</div>`;
  },

  pins(s, ctx) {
    const v = V(s, 'legend');
    /* The frame keeps the photo's own shape, so nothing is cropped and a pin at x%, y% lands on that spot */
    const f = ctx.media && ctx.media[s.media.src], ar = f && f.w && f.h ? f.w / f.h : 0.8;
    const [W, H] = v === 'side' ? [440, 640] : [888, 440];
    const w = Math.round(Math.min(W, H * ar)), h = Math.round(w / ar);
    /* Pins stay inside the photo whatever the numbers say */
    const at = n => Math.max(6, Math.min(94, Number(n) || 0));
    const dots = s.pins.map((p, k) => `<span class="pn-p" style="--x: ${at(p.x)}%; --y: ${at(p.y)}%"${M('item', `Titik ${k + 1}`)}>${k + 1}</span>`).join('');
    const leg = s.pins.map((p, k) => `<li class="pn-i"${M('text', `Keterangan ${k + 1}`)}><span class="pn-n">${k + 1}</span><span class="pn-t">${esc(p.text)}</span></li>`).join('');
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-pn v-${v}" data-comp="pins"><div class="pn-ph" style="--w: ${w}px; --h: ${h}px; --ar: ${ar.toFixed(4)}">${mediaEl(ctx, s.media, 'pn-m', 'Foto')}${dots}</div><ol class="pn-l">${leg}</ol></div></div>`;
  },

  gallery(s, ctx) {
    const v = V(s, 'row');
    const items = s.items.map((it, k) => `<div class="gl-i"${M('item', `Foto ${k + 1}`)}>${mediaEl(ctx, it.media, 'gl-m', 'Foto', { plain: true })}<p class="gl-l">${esc(it.label)}</p></div>`).join('');
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-gl v-${v}" data-comp="gallery">${items}</div>${note(s)}</div>`;
  },

  exercise(s, ctx) {
    const v = V(s, 'photo');
    const m = v === 'photo' ? mediaEl(ctx, s.media, 'xr-m', 'Foto') : '';
    const dose = `<div class="xr-d" style="--n: ${s.dose.length}">${s.dose.map((d, k) => `<div class="xr-k"${M('item', `Takaran ${k + 1}`)}><span class="xr-v">${esc(d.value)}</span><span class="xr-u">${esc(d.label)}</span></div>`).join('')}</div>`;
    const cues = `<ol class="xr-c">${s.cues.map((c, k) => `<li class="xr-i"${M('item', `Cara ${k + 1}`)}><span class="xr-n">${k + 1}</span><span class="xr-t">${esc(c)}</span></li>`).join('')}</ol>`;
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-xr v-${v}" data-comp="exercise">${m}${dose}${cues}</div></div>`;
  },

  testimonial(s, ctx) {
    const v = V(s, 'card');
    const q = T(ctx, 'blockquote', 'tq-q', s.quote, 0, 'Kutipan');
    const who = `<div class="tq-who"${M('text', 'Nama')}><p class="tq-n">${esc(s.person.name)}</p>${s.person.role ? `<p class="tq-r">${esc(s.person.role)}</p>` : ''}</div>`;
    if (v === 'photo') return `<div class="group x-tq v-photo" data-comp="testimonial">${mediaEl(ctx, s.media, 'tq-m', 'Foto')}<div class="tq-side">${q}${who}</div></div>`;
    return `<div class="group x-tq v-card" data-comp="testimonial"><div class="tq-card">${q}</div>${who}</div>`;
  },

  /* ---------------- Isi yang mengajak berpikir ---------------- */
  quiz(s, ctx) {
    const v = V(s, 'ask');
    const ok = v === 'reveal' ? LETTERS.indexOf(s.answer || 'A') : -1;
    const opts = s.options.map((o, k) => `<p class="qz-o${k === ok ? ' is-ok' : ok >= 0 ? ' is-off' : ''}"${M('item', `Pilihan ${LETTERS[k]}`)}><span class="qz-l">${LETTERS[k]}</span><span class="qz-t">${esc(o)}</span>${k === ok ? `<span class="qz-ck">${iconSvg({ c: CHECK }, 'c', 'ic')}</span>` : ''}</p>`).join('');
    const after = v === 'reveal' ? `<p class="qz-r"${M('text', 'Alasan')}>${esc(s.reason)}</p>` : s.note ? `<p class="qz-n"${M('text', 'Catatan')}>${esc(s.note)}</p>` : '';
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-qz v-${v}" data-comp="quiz">${opts}</div>${after}</div>`;
  },

  bars(s, ctx) {
    const v = V(s, 'horizontal');
    const val = b => parseFloat(String(b.value).replace(',', '.')) || 0;
    const max = Math.max(...s.bars.map(val)) || 1;
    const top = s.bars.findIndex(b => val(b) === max);
    const rows = s.bars.map((b, k) => {
      const p = (val(b) / max).toFixed(3), cls = k === top ? ' is-top' : '';
      /* A column is drawn, not a card: the fill is an SVG shape and the figure sits above it */
      if (v === 'columns') return `<div class="br-c${cls}"${M('item', `Kolom ${k + 1}`)}><span class="br-t"><span class="br-f" style="--p: ${p}"><span class="br-v">${esc(b.value)}</span><svg class="br-g" aria-hidden="true"${DRAW('yb', 'Kolom')}><rect width="100%" height="100%" rx="16"/></svg></span></span><span class="br-l">${esc(b.label)}</span></div>`;
      return `<div class="br-r${cls}"${M('item', `Batang ${k + 1}`)}><p class="br-h"><span class="br-l">${esc(b.label)}</span><span class="br-v">${esc(b.value)}</span></p><span class="br-t"><span class="br-f" style="--p: ${p}"${DRAW('x', 'Batang')}></span></span></div>`;
    }).join('');
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-br v-${v}" data-comp="bars" style="--n: ${s.bars.length}">${rows}</div>${note(s)}</div>`;
  },

  week(s, ctx) {
    const v = V(s, 'dots');
    const days = s.days.map((d, k) => `<span class="wk-d${d.on ? ' is-on' : ''}"${M('item', `Hari ${k + 1}`)}>${esc(d.day)}</span>`).join('');
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-wk v-${v}" data-comp="week" role="img" aria-label="${esc(s.days.filter(d => d.on).map(d => d.day).join(', '))}">${days}</div>${s.note ? `<p class="lede wk-n"${M('text', 'Catatan')}>${esc(s.note)}</p>` : ''}</div>`;
  },

  flags(s, ctx) {
    const v = V(s, 'list');
    const warn = iconSvg(ctx.icons, 'alert-triangle', 'ic');
    const items = s.items.map((t, k) => `<p class="fl-i"${M('item', `Tanda ${k + 1}`)}><span class="fl-ic">${warn}</span><span class="fl-t">${esc(t)}</span></p>`).join('');
    const act = `<div class="fl-a"${M('item', 'Tindakan')}><span class="fl-aic">${iconSvg(ctx.icons, s.action.icon, 'ic')}</span><p class="fl-at">${esc(s.action.text)}</p></div>`;
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-fl v-${v}" data-comp="flags"><div class="fl-l">${items}</div>${act}</div></div>`;
  },

  faq(s, ctx) {
    const v = V(s, 'stack');
    const items = s.items.map((it, k) => `<div class="fq-i"><p class="fq-q"${M('item', `Tanya ${k + 1}`)}>${esc(it.q)}</p><p class="fq-a"${M('item', `Jawab ${k + 1}`)}>${esc(it.a)}</p></div>`).join('');
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-fq v-${v}" data-comp="faq">${items}</div></div>`;
  },

  script(s, ctx) {
    const v = V(s, 'lines');
    /* A blank: a line to write on, with what goes there written small under it */
    const blank = p => `<span class="sc-b"><svg class="sc-ln" viewBox="0 0 240 12" preserveAspectRatio="none" aria-hidden="true"><line x1="5" y1="6" x2="235" y2="6"/></svg><span class="sc-s">${esc(p.slot)}</span></span>`;
    /* Punctuation that follows a blank is written at the start of the next part (". Kita coba") and sits right after the line */
    const glue = t => (/^[.,!?;:]/.test(t) ? '' : ' ');
    const tpl = s.parts.map((p, k) => `${k ? glue(p.text) : ''}${esc(p.text)} ${blank(p)}`).join('') + (s.end ? `${glue(s.end)}${esc(s.end)}` : '');
    const ex = s.example ? `<p class="sc-e"${M('item', 'Contoh')}>${esc(s.example)}</p>` : '';
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-sc v-${v}" data-comp="script"><p class="sc-t"${M('item', 'Template')}>${tpl}</p>${ex}</div></div>`;
  },

  acronym(s, ctx) {
    const v = V(s, 'stack');
    const rows = s.letters.map((l, k) => `<div class="an-i"${M('item', `Huruf ${k + 1}`)}><span class="an-l">${esc(l.letter)}</span><span class="an-t">${esc(l.text)}</span></div>`).join('');
    const tiles = v === 'tiles' ? `<p class="an-w" role="img" aria-label="${esc(s.letters.map(l => l.letter).join(''))}">${s.letters.map((l, k) => `<span class="an-tile"${M('item', `Ubin ${k + 1}`)}>${esc(l.letter)}</span>`).join('')}</p>` : '';
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-an v-${v}" data-comp="acronym">${tiles}<div class="an-rows">${rows}</div></div>${note(s)}</div>`;
  },

  gauge(s, ctx) {
    const v = V(s, 'arc');
    const at = Math.max(0, Math.min(2, Number(s.at || 1) - 1));
    const labels = `<div class="gg-ls">${s.levels.map((t, k) => `<span class="gg-l${k === at ? ' is-on' : ''}">${esc(t)}</span>`).join('')}</div>`;
    if (v === 'bar') {
      const segs = s.levels.map((t, k) => `<i class="gg-s${k === at ? ' is-on' : ''}"></i>`).join('');
      return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-gg v-bar" data-comp="gauge" style="--at: ${at}"><div class="gg-bar"${M('art', 'Batang')}><i class="gg-mk" aria-hidden="true"></i>${segs}</div><div${M('text', 'Tingkat')}>${labels}</div></div>${note(s)}</div>`;
    }
    /* Three arcs of 56 degrees with 6 degree gaps, from the left end to the right end of a half circle */
    const cx = 320, cy = 320, r = 260, pt = deg => [cx + r * Math.cos((deg * Math.PI) / 180), cy - r * Math.sin((deg * Math.PI) / 180)].map(n => n.toFixed(1)).join(' ');
    const arcs = [0, 1, 2].map(k => { const a0 = 180 - k * 62, a1 = a0 - 56; return `<path class="gg-a${k === at ? ' is-on' : ''}" d="M${pt(a0)} A${r} ${r} 0 0 1 ${pt(a1)}"/>`; }).join('');
    const ang = 180 - at * 62 - 28, nx = (cx + 200 * Math.cos((ang * Math.PI) / 180)).toFixed(1), ny = (cy - 200 * Math.sin((ang * Math.PI) / 180)).toFixed(1);
    const svg = `<svg class="gg-svg" viewBox="0 0 640 352" aria-hidden="true">${arcs}<line class="gg-n" x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}"/><circle class="gg-hub" cx="${cx}" cy="${cy}" r="22"/></svg>`;
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-gg v-arc" data-comp="gauge" role="img" aria-label="${esc(s.levels[at])}"><div class="gg-dial"${M('art', 'Busur')}>${svg}</div><div${M('text', 'Tingkat')}>${labels}</div></div>${note(s)}</div>`;
  },

  /* ---------------- Penutup ---------------- */
  prompt(s, ctx) {
    const v = V(s, 'ask');
    const h = T(ctx, 'h2', 'h1', s.title);
    const c = cta(s.cta, ctx);
    if (v === 'options') return `<div class="group x-pm v-options" data-comp="prompt">${h}<div class="pm-op">${s.options.map((o, k) => `<p class="pm-o"${M('item', `Pilihan ${LETTERS[k]}`)}><span class="pm-k">${LETTERS[k]}</span><span class="pm-t">${esc(o)}</span></p>`).join('')}</div>${c}</div>`;
    if (v === 'keyword') return `<div class="group x-pm v-keyword" data-comp="prompt">${h}<p class="pm-kw"${M('art', 'Kata kunci')}>${esc(s.keyword)}</p>${c}</div>`;
    return `<div class="group x-pm v-ask" data-comp="prompt"><div class="pm-b"${M('art', 'Gelembung')}>${h}<i class="pm-tail" aria-hidden="true"></i></div>${c}</div>`;
  },

  action(s, ctx) {
    const v = V(s, 'save');
    /* An illustration, when given, takes the place of the big icon */
    const big = s.art ? artSvg(s.art, 'ill-icon', M('art', 'Ilustrasi')) : `<span class="ax-ic"${M('art', 'Ikon')}>${iconSvg(ctx.icons, { save: 'bookmark', share: 'send', next: 'bell' }[v], 'ic')}</span>`;
    const h = T(ctx, 'h2', 'h1', s.title);
    const lede = s.lede ? `<p class="lede ax-ld"${M('text', 'Kalimat')}>${esc(s.lede)}</p>` : '';
    const mid = v === 'save' ? `<ul class="ax-pt">${s.points.map((p, k) => `<li class="ax-p"${M('item', `Poin ${k + 1}`)}><span class="ax-m">${iconSvg({ c: CHECK }, 'c', 'ic')}</span><span>${esc(p)}</span></li>`).join('')}</ul>`
      : v === 'next' ? `<div class="ax-nx"${M('item', 'Berikutnya')}><p class="ax-nl">${esc(s.next.label)}</p><p class="ax-nt">${esc(s.next.topic)}</p></div>` : '';
    return `<div class="group x-ax v-${v}" data-comp="action">${big}${h}${lede}${mid}${cta(s.cta, ctx)}</div>`;
  },

  profile(s, ctx) {
    const v = V(s, 'photo');
    const h = T(ctx, 'h2', 'h1', s.title);
    const who = `<div class="pf-who"><p class="pf-n">${esc(s.person.name)}</p>${s.person.role ? `<p class="pf-r">${esc(s.person.role)}</p>` : ''}</div>`;
    const lede = s.lede ? `<p class="pf-ld">${esc(s.lede)}</p>` : '';
    if (v === 'card') return `<div class="group x-pf v-card" data-comp="profile">${h}<div class="pf-card"${M('item', 'Kartu profil')}>${who}${lede}</div>${cta(s.cta, ctx)}</div>`;
    return `<div class="group x-pf v-photo" data-comp="profile">${h}<div class="pf-row"${M('item', 'Profil')}>${mediaEl(ctx, s.media, 'pf-m', 'Foto', { plain: true })}${who}</div>${lede ? `<div${M('text', 'Kalimat')}>${lede}</div>` : ''}${cta(s.cta, ctx)}</div>`;
  },
};

/* Tiny previews for the flow diagram and the alternative pickers (48 x 60). */
export function plusThumb(comp, t, hi, r) {
  const bars = (y, w1, w2) => r(7, y, w1, 3, t.ink) + (w2 ? r(7, y + 5, w2, 3, t.ink) : '');
  const ci = t.cink || t.ink;
  const photo = (x, y, w, h, rad = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad}" fill="${t.accent}" fill-opacity="0.45"/><path d="M${x + 2} ${y + h - 2} l${w * 0.3} ${-h * 0.35} l${w * 0.2} ${h * 0.2} l${w * 0.2} ${-h * 0.15} l${w * 0.26} ${h * 0.3}" fill="none" stroke="${t.ink}" stroke-width="0.8" stroke-opacity="0.5"/>`;
  return {
    photo: photo(0, 0, 48, 34, 0) + r(7, 40, 30, 5, t.ink) + r(7, 48, 22, 3, t.muted),
    teaser: bars(12, 28, 20) + [27, 35, 43].map(y => `<text x="7" y="${y + 4}" font-size="5" font-weight="800" fill="${t.accent}">${(y - 19) / 8}</text>` + r(13, y, 26, 3, t.ink)).join(''),
    contrast: r(7, 18, 24, 4, t.muted) + r(7, 19.5, 24, 1, hi) + r(7, 27, 32, 6, t.ink) + r(7, 36, 26, 6, t.ink),
    figure: bars(10, 26) + photo(7, 20, 34, 24) + r(7, 48, 30, 3, t.muted),
    photopair: bars(10, 26) + photo(7, 20, 16, 24) + photo(25, 20, 16, 24) + r(7, 47, 12, 2.5, t.ink) + r(25, 47, 12, 2.5, t.ink),
    pins: bars(10, 26) + photo(7, 18, 34, 24) + [[14, 26], [30, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5" fill="${hi}"/>`).join('') + r(7, 46, 30, 2.5, t.ink) + r(7, 51, 24, 2.5, t.ink),
    gallery: bars(10, 26) + photo(7, 20, 10, 24) + photo(19, 20, 10, 24) + photo(31, 20, 10, 24) + r(8, 47, 8, 2, t.ink) + r(20, 47, 8, 2, t.ink) + r(32, 47, 8, 2, t.ink),
    exercise: bars(10, 26) + photo(7, 18, 34, 14) + [8, 20, 32].map(x => r(x, 35, 8, 4, t.accent)).join('') + r(7, 44, 30, 2.5, t.ink) + r(7, 49, 26, 2.5, t.ink),
    testimonial: r(7, 14, 34, 22, t.card) + r(10, 19, 26, 3, ci) + r(10, 25, 22, 3, ci) + `<circle cx="11" cy="45" r="4" fill="${t.accent}" fill-opacity="0.5"/>` + r(18, 43, 16, 3, t.ink),
    quiz: bars(10, 26) + [22, 31, 40].map(y => r(7, y, 34, 7, t.card) + `<circle cx="11" cy="${y + 3.5}" r="2" fill="${t.accent}"/>` + r(15, y + 2.5, 20, 2, ci)).join(''),
    bars: bars(10, 26) + [[22, 30], [30, 20], [38, 34]].map(([y, w], k) => r(7, y, w, 4, k === 2 ? hi : t.accent)).join(''),
    week: bars(12, 26) + [0, 1, 2, 3, 4, 5, 6].map(k => `<circle cx="${9 + k * 5}" cy="34" r="2" fill="${k % 2 ? 'none' : hi}" stroke="${t.muted}" stroke-width="0.5"/>`).join('') + r(7, 42, 30, 3, t.muted),
    flags: bars(10, 26) + [22, 29, 36].map(y => `<path d="M8 ${y + 4} l2.5 -4.5 l2.5 4.5 z" fill="none" stroke="${t.accent}" stroke-width="0.8"/>` + r(15, y + 1, 24, 2.5, t.ink)).join('') + r(7, 44, 34, 9, hi),
    faq: bars(10, 26) + [22, 37].map(y => r(7, y, 26, 3, t.ink) + r(7, y + 5, 32, 2.5, t.muted) + r(7, y + 9, 24, 2.5, t.muted)).join(''),
    script: bars(10, 26) + r(7, 24, 10, 3, t.ink) + r(19, 26, 10, 1.2, hi) + r(31, 24, 10, 3, t.ink) + r(7, 32, 12, 1.2, hi) + r(21, 30, 16, 3, t.ink) + r(7, 40, 34, 10, t.card),
    acronym: bars(10, 26) + [22, 31, 40].map((y, k) => `<text x="7" y="${y + 6}" font-size="7" font-weight="800" fill="${t.accent}">${'AKU'[k]}</text>` + r(15, y + 2, 24, 3, t.ink)).join(''),
    gauge: bars(10, 26) + `<path d="M10 42 A14 14 0 0 1 38 42" fill="none" stroke="${t.muted}" stroke-width="3"/><path d="M19 29.5 A14 14 0 0 1 29 29.5" fill="none" stroke="${hi}" stroke-width="3"/><line x1="24" y1="42" x2="24" y2="32" stroke="${t.ink}" stroke-width="1.2"/>` + r(7, 48, 34, 2.5, t.muted),
    prompt: r(8, 16, 32, 20, t.card, ` stroke="${t.ink}" stroke-width="0.8"`) + r(12, 22, 22, 4, ci) + `<circle cx="13" cy="46" r="3" fill="${t.accent}"/>` + r(19, 45, 18, 3, t.ink),
    action: `<path d="M20 12 h8 v12 l-4 -3 l-4 3 z" fill="none" stroke="${t.accent}" stroke-width="1.2"/>` + r(9, 29, 30, 5, t.ink) + [38, 43].map(y => r(9, y, 3, 3, t.accent) + r(14, y, 22, 3, t.ink)).join('') + `<circle cx="12" cy="52" r="2.5" fill="${t.accent}"/>` + r(17, 51, 18, 2.5, t.ink),
    profile: r(7, 14, 30, 5, t.ink) + `<circle cx="14" cy="31" r="6" fill="${t.accent}" fill-opacity="0.5"/>` + r(23, 28, 16, 3, t.ink) + r(23, 33, 12, 2.5, t.muted) + `<circle cx="11" cy="47" r="3" fill="${t.accent}"/>` + r(17, 46, 20, 3, t.ink),
  }[comp];
}
