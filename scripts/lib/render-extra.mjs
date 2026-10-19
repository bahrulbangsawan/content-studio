// Renderers for the components added after the first seven. Each returns the slide body; motion
// attributes are finished later by applyMotion() in motion.mjs, so markup only names roles.
import { esc, iconSvg, M, DRAW, T, word, ARROW, CHECK, CROSS, note, lead, findPhrase } from './kit.mjs';

const V = (s, def) => s.variant || def;

/* "A ≠ B" written out as type: the words carry the meaning, so no shapes are drawn around them. */
function motif(m) {
  if (!m) return '';
  return `<p class="motif" role="img" aria-label="${esc(`${m.left} ${m.sign} ${m.right}`)}"><span class="mo-a"${M('item', 'Motif kiri')}>${esc(m.left)}</span> <span class="mo-s"${M('text', 'Tanda')}>${esc(m.sign)}</span> <span class="mo-b"${M('item', 'Motif kanan')}>${esc(m.right)}</span></p>`;
}

export const EXTRA_BODY = {
  hero(s, ctx) {
    const v = V(s, 'marker');
    const words = s.title.trim().split(/\s+/);
    let inner;
    if (v === 'marker') {
      const last = words.pop();
      inner = `${words.map((w, k) => word(ctx, w, k)).join(' ')}${words.length ? ' ' : ''}<span class="hm-w">${word(ctx, last, words.length)}<i class="hm-bar"${DRAW('x', 'Garis sorotan')}></i></span>`;
    } else inner = words.map((w, k) => word(ctx, w, k)).join(' ');
    const h1 = `<h1 class="h1 ttl hero-t"${ctx.split ? '' : M('title', 'Judul')}>${inner}</h1>`;
    const sub = s.sub ? `<p class="lede hero-s"${M('text', 'Sub')}>${esc(s.sub)}</p>` : '';
    const mo = motif(s.motif);
    if (v === 'stack') return `<div class="group x-hero v-stack" data-comp="hero">${h1}<i class="hs-rule"${DRAW('x', 'Garis pemisah')}></i>${sub}${mo}</div>`;
    if (v === 'band') return `<div class="group x-hero v-band" data-comp="hero"><div class="hb"><i class="hb-bg"${DRAW('x', 'Pita')}></i>${h1}</div>${sub}${mo}</div>`;
    return `<div class="group g-center x-hero v-marker" data-comp="hero">${h1}${sub}${mo}</div>`;
  },

  outro(s, ctx) {
    const v = V(s, 'strip');
    const h = T(ctx, 'h2', 'h1', s.title);
    const lede = s.lede ? `<p class="lede"${M('text', 'Kalimat')}>${esc(s.lede)}</p>` : '';
    const cta = `<div class="cta x-cta" data-comp="cta"${M('item', 'Ajakan')}><span class="cta-ic">${iconSvg(ctx.icons, s.cta.icon, 'ic')}</span><span class="cta-t">${esc(s.cta.text)}</span></div>`;
    if (v === 'card') return `<div class="group g-center x-outro v-card" data-comp="outro"><div class="oc"${M('art', 'Kartu')}>${h}${lede}</div>${cta}</div>`;
    return `<div class="group x-outro v-strip" data-comp="outro">${h}${lede}<i class="os-line"${DRAW('x', 'Garis ajakan')}></i>${cta}</div>`;
  },

  pairs(s, ctx) {
    const v = V(s, 'table');
    const arrow = iconSvg({ a: ARROW }, 'a', 'ic');
    const rows = s.rows.map((r, k) => {
      if (v === 'stacked') return `<div class="pr-blk"><p class="pr-l"${M('item', `Kiri ${k + 1}`)}><span class="pr-k">${esc(s.heads.left)}</span> ${esc(r.left)}</p><p class="pr-r"${M('item', `Kanan ${k + 1}`)}><span class="pr-k">${esc(s.heads.right)}</span> ${esc(r.right)}</p></div>`;
      const ar = v === 'arrows' ? `<span class="pr-ar">${arrow}</span>` : '';
      return `<div class="pr-row"><p class="pr-l"${M('item', `Kiri ${k + 1}`)}>${esc(r.left)}</p><p class="pr-r"${M('item', `Kanan ${k + 1}`)}>${ar}<span>${esc(r.right)}</span></p></div>`;
    }).join('');
    const head = v === 'stacked' ? '' : `<div class="pr-head"${M('text', 'Kepala kolom')}><span class="eyebrow">${esc(s.heads.left)}</span><span class="eyebrow">${esc(s.heads.right)}</span></div>`;
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-pairs v-${v}" data-comp="pairs">${head}${rows}</div>${note(s)}</div>`;
  },

  quotes(s, ctx) {
    const v = V(s, 'lines');
    const items = s.quotes.map((q, k) => {
      if (v === 'chat') return `<p class="qc ${k % 2 ? 'qc-r' : 'qc-l'}"${M('item', `Kutipan ${k + 1}`)}>${esc(q)}</p>`;
      return `<p class="qb"${M('item', `Kutipan ${k + 1}`)}>${esc(q)}</p>`;
    }).join('');
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}${lead(s)}<div class="x-quotes v-${v}" data-comp="quotes">${items}</div>${note(s)}</div>`;
  },

  split(s, ctx) {
    const v = V(s, 'boxes');
    const row = `<div class="sp-row"><p class="sp-a"${M('item', 'Kiri')}>${esc(s.left)}</p><p class="sp-j"${M('text', 'Penghubung')}>${esc(s.joiner)}</p><p class="sp-b"${M('item', 'Kanan')}>${esc(s.right)}</p></div>`;
    const ex = s.example ? `<p class="x-ex"${M('text', 'Contoh')}>${esc(s.example)}</p>` : '';
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-split v-${v}" data-comp="split">${row}</div>${ex}</div>`;
  },

  ladder(s, ctx) {
    const v = V(s, 'cascade');
    const items = s.items.map((it, k) => `<div class="ld-i${k === s.items.length - 1 ? ' is-focal' : ''}" style="--k: ${k}"${M('item', `Tingkat ${k + 1}`)}>${v === 'rail' ? '<i class="ld-dot" aria-hidden="true"></i>' : ''}<span class="eyebrow ld-t">${esc(it.tag)}</span><span class="ld-x">${esc(it.text)}</span></div>`).join('');
    const rail = v === 'rail' ? `<i class="ld-rail"${DRAW('y', 'Rel')}></i>` : '';
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-ladder v-${v}" data-comp="ladder">${rail}${items}</div>${note(s)}</div>`;
  },

  versus(s, ctx) {
    const v = V(s, 'cards');
    const side = (o, cls, label) => `<div class="vs-c ${cls}"${M('item', label)}><p class="vs-q">${esc(o.text)}</p></div>`;
    const j = s.joiner ? `<p class="vs-j"${M('text', 'Penghubung')}>${esc(s.joiner)}</p>` : '';
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-versus v-${v}" data-comp="versus"><i class="vs-div"${DRAW('y', 'Pembatas')}></i>${side(s.left, 'vs-l', 'Kiri')}${side(s.right, 'vs-r', 'Kanan')}<p class="vs-cap vs-cl"${M('text', 'Keterangan kiri')}>${esc(s.left.caption)}</p><p class="vs-cap vs-cr"${M('text', 'Keterangan kanan')}>${esc(s.right.caption)}</p>${j}</div></div>`;
  },

  formula(s, ctx) {
    const v = V(s, 'boxes');
    const terms = s.terms.map((t, k) => `${k ? `<span class="fm-plus"${M('text', `Tambah ${k}`)}>+</span>` : ''}<p class="fm-t"${M('item', `Unsur ${k + 1}`)}>${esc(t)}</p>`).join('');
    const line = v === 'chain' ? `<i class="fm-line"${DRAW('x', 'Rantai')}></i>` : '';
    const ex = s.example ? `<p class="fm-ex"${M('text', 'Contoh')}>${esc(s.example)}</p>` : '';
    const tags = s.tags ? `<div class="fm-tags">${s.tags.map((t, k) => `<p class="fm-tag${k === s.tags.length - 1 ? ' is-focal' : ''}"${M('item', `Kata kunci ${k + 1}`)}>${esc(t)}</p>`).join('')}</div>` : '';
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-formula v-${v}" data-comp="formula"><div class="fm-row">${line}${terms}</div>${ex}${tags}</div></div>`;
  },

  reframe(s, ctx) {
    const v = V(s, 'stack');
    const q = `<p class="rf-q"${M('item', 'Kalimat utama')}>${esc(s.quote)}</p>`;
    const j = `<p class="eyebrow rf-j"${M('text', 'Penghubung')}>${esc(s.joiner)}</p>`;
    const strike = v === 'strike' ? `<svg class="rf-x" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"${DRAW('reveal', 'Coretan')}><path d="M3 92 L97 8"/></svg>` : '';
    const c = `<div class="rf-cw"><p class="rf-c"${M('item', 'Pembanding')}>${esc(s.counter)}</p>${strike}</div>`;
    const ld = s.lead ? `<p class="rf-lead"${M('text', 'Pengantar')}>${esc(s.lead)}</p>` : '';
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-reframe v-${v}" data-comp="reframe">${ld}${q}${j}${c}</div></div>`;
  },

  hook(s, ctx) {
    const v = V(s, 'bubble');
    const h = T(ctx, 'h1', 'h1 hk-t', s.title);
    const sub = s.sub ? `<p class="lede hk-s"${M('text', 'Sub')}>${esc(s.sub)}</p>` : '';
    if (v === 'mark') {
      /* The question mark carries the accent at the size of the question, not as a giant glyph beside it */
      const t = s.title.trim(), q = t.endsWith('?');
      const words = (q ? t.slice(0, -1) : t).trim().split(/\s+/);
      const inner = words.map((w, k) => word(ctx, w, k)).join(' ') + (q ? '<span class="hk-q">?</span>' : '');
      return `<div class="group x-hook v-mark" data-comp="hook"><h1 class="h1 hk-t ttl"${ctx.split ? '' : M('title', 'Judul')}>${inner}</h1>${sub}</div>`;
    }
    /* The question as a message someone sent, the sub as the short reply */
    if (v === 'chat') return `<div class="group x-hook v-chat" data-comp="hook"><div class="hk-in"${M('art', 'Pesan')}>${h}</div>${s.sub ? `<p class="hk-out"${M('text', 'Balasan')}>${esc(s.sub)}</p>` : ''}</div>`;
    /* Two answers side by side with equal weight: the next slides tell which one */
    if (v === 'options') return `<div class="group x-hook v-options" data-comp="hook">${h}<div class="hk-opts">${s.options.map((o, k) => `<p class="hk-o"${M('item', `Pilihan ${k + 1}`)}>${esc(o)}</p>`).join('')}</div>${sub}</div>`;
    /* A quiz: three lettered answers, the reader guesses before swiping */
    if (v === 'quiz') return `<div class="group x-hook v-quiz" data-comp="hook">${h}<div class="hk-qz">${s.choices.map((o, k) => `<p class="hk-c"${M('item', `Pilihan ${'ABC'[k]}`)}><span class="hk-l">${'ABC'[k]}</span><span>${esc(o)}</span></p>`).join('')}</div>${sub}</div>`;
    /* A scale from one end to the other: the reader places themselves on it */
    if (v === 'scale') return `<div class="group x-hook v-scale" data-comp="hook">${h}<div class="hk-sc"${M('art', 'Skala')}><i class="hk-tr"${DRAW('x', 'Garis skala')}></i>${[0, 1, 2, 3, 4].map(k => `<i class="hk-d" style="--k: ${k}"></i>`).join('')}</div><p class="hk-ends"${M('text', 'Ujung skala')}><span>${esc(s.ends.left)}</span><span>${esc(s.ends.right)}</span></p>${sub}</div>`;
    return `<div class="group g-center x-hook v-bubble" data-comp="hook"><div class="hk-b"${M('art', 'Gelembung')}>${h}<i class="hk-tail" aria-hidden="true"></i></div>${sub}</div>`;
  },

  recap(s, ctx) {
    const v = V(s, 'ticks');
    const mark = () => (v === 'ticks' ? `<span class="rc-m">${iconSvg({ c: CHECK }, 'c', 'ic')}</span>` : '');
    const pts = s.points.map((p, k) => `<li class="rc-i"${M('item', `Poin ${k + 1}`)}>${mark()}<span class="rc-x">${esc(p)}</span></li>`).join('');
    const cta = `<div class="cta x-cta" data-comp="cta"${M('item', 'Ajakan')}><span class="cta-ic">${iconSvg(ctx.icons, s.cta.icon, 'ic')}</span><span class="cta-t">${esc(s.cta.text)}</span></div>`;
    return `<div class="group x-recap v-${v}" data-comp="recap">${T(ctx, 'h2', 'h1', s.title)}<ul class="rc-l">${pts}</ul>${cta}</div>`;
  },

  swap(s, ctx) {
    const v = V(s, 'cards');
    const from = `<div class="sw-from"${M('item', 'Kalimat lama')}><span class="sw-ft">${esc(s.from)}</span><svg class="sw-x" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"${DRAW('reveal', 'Coretan')}><path d="${v === 'columns' ? 'M2 9.5 L98 0.5' : 'M0 5 H100'}"/></svg></div>`;
    const arrow = `<span class="sw-ar" aria-hidden="true"${M('text', 'Panah')}>${iconSvg({ a: ARROW }, 'a', 'ic')}</span>`;
    const to = s.to.map((t, k) => `<p class="sw-c"${M('item', `Pengganti ${k + 1}`)}>${v === 'list' ? `<span class="sw-b">${iconSvg({ a: ARROW }, 'a', 'ic')}</span>` : ''}<span>${esc(t)}</span></p>`).join('');
    const body = v === 'columns'
      ? `<div class="sw-cols"><div class="sw-l">${from}</div>${arrow}<div class="sw-to">${to}</div></div>`
      : `<div class="sw-head">${from}${arrow}</div><div class="sw-to">${to}</div>`;
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-swap v-${v}" data-comp="swap">${body}</div>${note(s)}</div>`;
  },

  bignumber(s, ctx) {
    const v = V(s, 'center');
    /* Beside the title only up to three characters: a wider figure leaves the title a column too narrow for its words */
    const len = [...s.value].length, size = len >= 6 ? ' is-l' : len >= 4 ? ' is-m' : len === 3 ? ' is-3' : '';
    const val = `<p class="bn-v${size}"${M('art', 'Angka')}>${esc(s.value)}</p>`;
    const h = T(ctx, 'h2', 'h2', s.title);
    const tx = s.text ? `<p class="lede bn-x"${M('text', 'Penjelasan')}>${esc(s.text)}</p>` : '';
    if (v === 'left') return `<div class="group x-big v-left${len >= 4 ? ' is-long' : ''}" data-comp="bignumber">${val}<div class="bn-side">${h}${tx}</div></div>`;
    return `<div class="group g-center x-big v-center" data-comp="bignumber">${val}${h}${tx}</div>`;
  },

  stat(s, ctx) {
    const v = V(s, 'top');
    const h = T(ctx, 'h1', 'h1', s.title);
    const sub = s.sub ? `<p class="lede sn-s"${M('text', 'Sumber')}>${esc(s.sub)}</p>` : '';
    if (v === 'ring') {
      /* The arc is the share itself: a dash as long as the percentage, drawn from twelve o'clock */
      const p = Math.max(0, Math.min(100, parseInt(s.value, 10) || 0)) / 100;
      return `<div class="group g-center x-sn v-ring" data-comp="stat"><div class="sn-ring"${M('art', 'Cincin')}><svg class="sn-svg" viewBox="0 0 360 360" aria-hidden="true"><circle class="sn-track" cx="180" cy="180" r="160"/><circle class="sn-arc" cx="180" cy="180" r="160" pathLength="1" transform="rotate(-90 180 180)" style="--p: ${p}"/></svg><p class="sn-v${[...s.value].length >= 4 ? ' is-l' : ''}">${esc(s.value)}</p></div>${h}${sub}</div>`;
    }
    const val = `<p class="sn-v"${M('art', 'Angka')}>${esc(s.value)}</p>`;
    if (v === 'side') return `<div class="group x-sn v-side" data-comp="stat">${val}<div class="sn-side">${h}${sub}</div></div>`;
    if (v === 'bar') {
      const p = Math.max(0, Math.min(100, parseInt(s.value, 10) || 0)) / 100;
      return `<div class="group x-sn v-bar" data-comp="stat">${val}<span class="sn-bar"><i class="sn-fill" style="--p: ${p}"${DRAW('x', 'Isi batang')}></i></span>${h}${sub}</div>`;
    }
    if (v === 'dots') {
      /* "1/4": four people, one of them marked. The title says it in words. */
      const [a, b] = String(s.value).split('/').map(n => parseInt(n, 10) || 0);
      return `<div class="group x-sn v-dots" data-comp="stat"><div class="sn-ppl${b > 6 ? ' is-many' : b > 4 ? ' is-some' : ''}" role="img" aria-label="${a} dari ${b}">${Array.from({ length: b }, (_, k) => `<span class="sn-p${k < a ? ' is-on' : ''}"${M('item', `Orang ${k + 1}`)}>${iconSvg(ctx.icons, 'user', 'ic')}</span>`).join('')}</div>${h}${sub}</div>`;
    }
    return `<div class="group x-sn v-top" data-comp="stat">${val}${h}${sub}</div>`;
  },

  pullquote(s, ctx) {
    /* The quote is the slide's heading: no small label above it, no decorative quotation glyph. */
    const v = V(s, 'plain');
    const q = T(ctx, 'blockquote', 'pq-q', s.quote, 0, 'Kutipan');
    const by = s.by ? `<p class="pq-by"${M('text', 'Sumber')}>${esc(s.by)}</p>` : '';
    if (v === 'card') return `<div class="group x-pq v-card" data-comp="pullquote"><div class="pq-card"${M('art', 'Kartu')}>${q}${by}</div></div>`;
    if (v === 'rule') return `<div class="group g-center x-pq v-rule" data-comp="pullquote"><i class="pq-rl"${DRAW('xc', 'Garis atas')}></i>${q}<i class="pq-rl"${DRAW('xc', 'Garis bawah')}></i>${by}</div>`;
    return `<div class="group x-pq v-plain" data-comp="pullquote">${q}${by}</div>`;
  },

  myth(s, ctx) {
    const v = V(s, 'stack');
    /* The label reads inline at the start of its sentence instead of sitting above it as a pill. */
    const lab = (o, cls, ic) => `<span class="my-l ${cls}">${iconSvg({ i: ic }, 'i', 'ic')}${esc(o.label)}</span>`;
    const w = `<div class="my-c my-w"${M('item', 'Keliru')}><p class="my-x">${lab(s.wrong, 'my-lw', CROSS)} ${esc(s.wrong.text)}</p></div>`;
    const r = `<div class="my-c my-r"${M('item', 'Benar')}><p class="my-x">${lab(s.right, 'my-lr', CHECK)} ${esc(s.right.text)}</p></div>`;
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-myth v-${v}" data-comp="myth">${w}${r}</div></div>`;
  },

  dodont(s, ctx) {
    const v = V(s, 'columns');
    const col = (o, cls, ic, name) => `<div class="dd-col ${cls}"><p class="dd-h"${M('item', `Kepala ${name}`)}>${iconSvg({ i: ic }, 'i', 'ic')}<span>${esc(o.label)}</span></p>${o.items.map((t, k) => `<p class="dd-i"${M('item', `${name} ${k + 1}`)}><span class="dd-ic">${iconSvg({ i: ic }, 'i', 'ic')}</span><span>${esc(t)}</span></p>`).join('')}</div>`;
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-dd v-${v}" data-comp="dodont">${col(s.do, 'dd-do', CHECK, 'Lakukan')}${col(s.dont, 'dd-dont', CROSS, 'Hindari')}</div></div>`;
  },

  timeline(s, ctx) {
    const v = V(s, 'vertical');
    const pts = s.points.map((p, k) => `<div class="tm-p${k === s.points.length - 1 ? ' is-focal' : ''}"${M('item', `Titik ${k + 1}`)}><i class="tm-dot" aria-hidden="true"></i><span class="eyebrow tm-w">${esc(p.when)}</span><span class="tm-x">${esc(p.text)}</span></div>`).join('');
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-tm v-${v}" data-comp="timeline" style="--n: ${s.points.length}"><i class="tm-line"${DRAW(v === 'vertical' ? 'y' : 'x', 'Garis waktu')}></i>${pts}</div></div>`;
  },

  grid(s, ctx) {
    const v = V(s, 'lines');
    const cells = s.cells.map((c, k) => `<div class="gd-c"${M('item', `Sel ${k + 1}`)}><span class="gd-ic">${iconSvg(ctx.icons, c.icon, 'ic')}</span><p class="gd-x">${esc(c.text)}</p></div>`).join('');
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-grid v-${v}" data-comp="grid">${cells}</div></div>`;
  },

  iconrow(s, ctx) {
    const v = V(s, 'plain');
    const items = s.items.map((it, k) => `<div class="ir-i"${M('item', `Ikon ${k + 1}`)}><span class="ir-c">${iconSvg(ctx.icons, it.icon, 'ic')}</span><p class="ir-l">${esc(it.label)}</p></div>`).join('');
    const nt = s.note ? `<p class="lede ir-n"${M('text', 'Catatan')}>${esc(s.note)}</p>` : '';
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-ir v-${v}" data-comp="iconrow">${items}</div>${nt}</div>`;
  },
  spectrum(s, ctx) {
    const v = V(s, 'bar');
    const ends = `<div class="spc-ends"${M('text', 'Ujung')}><span class="eyebrow">${esc(s.ends.left)}</span><span class="eyebrow">${esc(s.ends.right)}</span></div>`;
    const dots = v === 'dots' ? Array.from({ length: 9 }, (_, k) => `<i class="spc-s" style="--k: ${k}"></i>`).join('') : '<i class="spc-dot d1"></i><i class="spc-dot d2"></i><i class="spc-dot d3"></i>';
    const pts = s.points.map((p, k) => `<p class="spc-p"${M('item', `Titik ${k + 1}`)}>${esc(p)}</p>`).join('');
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-spc v-${v}" data-comp="spectrum">${ends}<div class="spc-track"${DRAW('x', 'Batang')}>${dots}</div><div class="spc-pts">${pts}</div></div>${note(s)}</div>`;
  },

  callout(s, ctx) {
    const v = V(s, 'marker');
    const i = s.highlight ? findPhrase(s.text, s.highlight) : -1;
    const body = i < 0 ? esc(s.text) : `${esc(s.text.slice(0, i))}<mark class="co-h">${esc(s.highlight)}</mark>${esc(s.text.slice(i + s.highlight.length))}`;
    const p = `<p class="co-x"${M('item', 'Isi')}>${body}</p>`;
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-co v-${v}" data-comp="callout">${p}</div></div>`;
  },

  qa(s, ctx) {
    const v = V(s, 'chat');
    const q = T(ctx, 'h2', 'h2 qa-t', s.title);
    const a = `<p class="qa-a"${M('item', 'Jawaban')}>${esc(s.answer)}</p>`;
    return `<div class="group x-qa v-${v}" data-comp="qa">${q}${v === 'split' ? '<i class="qa-div"' + DRAW('y', 'Pembatas') + '></i>' : ''}${a}</div>`;
  },

  cycle(s, ctx) {
    const v = V(s, 'ring');
    const n = s.items.length;
    if (v === 'loop') {
      const w = (888 - (n - 1) * 60) / n, x0 = Math.round(w / 2), x1 = Math.round(888 - w / 2);
      const items = s.items.map((t, k) => `${k ? `<span class="cy-ar" aria-hidden="true">${iconSvg({ a: ARROW }, 'a', 'ic')}</span>` : ''}<p class="cy-i"${M('item', `Tahap ${k + 1}`)}>${esc(t)}</p>`).join('');
      return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-cy v-loop" data-comp="cycle" style="--n: ${n}"><div class="cy-row">${items}</div><svg class="cy-back drawn" viewBox="0 0 888 120" aria-hidden="true"${DRAW('none', 'Panah kembali')}><path pathLength="1" d="M${x1} 8 V64 Q${x1} 104 ${x1 - 40} 104 H${x0 + 40} Q${x0} 104 ${x0} 64 V18"/><path pathLength="1" d="M${x0 - 18} 40 L${x0} 14 L${x0 + 18} 40"/></svg>${s.center ? `<p class="cy-c"${M('text', 'Tengah')}>${esc(s.center)}</p>` : ''}</div></div>`;
    }
    const R = 236, cx = 444, cy = 290;
    /* Four items sit on the diagonals so the centre label never meets a box */
    const ang = k => (-90 + (n === 4 ? 45 : 0) + (360 / n) * k) * Math.PI / 180;
    const pos = k => ({ x: cx + R * Math.cos(ang(k)), y: cy + R * Math.sin(ang(k)) });
    const heads = s.items.map((_, k) => {
      const a = ang(k) + Math.PI / n, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a), deg = (a * 180) / Math.PI + 90;
      return `<path pathLength="1" d="M-12 -14 L6 0 L-12 14" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(1)})"/>`;
    }).join('');
    const items = s.items.map((t, k) => { const p = pos(k); return `<p class="cy-i" style="left: ${p.x.toFixed(1)}px; top: ${p.y.toFixed(1)}px"${M('item', `Tahap ${k + 1}`)}>${esc(t)}</p>`; }).join('');
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-cy v-ring" data-comp="cycle"><svg class="cy-svg drawn" viewBox="0 0 888 580" aria-hidden="true"${DRAW('none', 'Lingkaran')}><circle pathLength="1" cx="${cx}" cy="${cy}" r="${R}"/>${heads}</svg>${s.center ? `<p class="cy-c"${M('text', 'Tengah')}>${esc(s.center)}</p>` : ''}${items}</div></div>`;
  },

  pyramid(s, ctx) {
    const v = V(s, 'pyramid');
    const lv = s.levels.map((t, k) => `<p class="py-l py-${k + 1}"${M('item', `Tingkat ${k + 1}`)}>${esc(t)}</p>`).join('');
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-py v-${v}" data-comp="pyramid">${lv}</div>${note(s)}</div>`;
  },

  matrix(s, ctx) {
    const v = V(s, 'quad');
    const cells = s.cells.map((t, k) => `<p class="mx-c${k === 1 ? ' is-focal' : ''}"${M('item', `Sel ${k + 1}`)}>${esc(t)}</p>`).join('');
    const axes = v === 'quad' && s.axes ? `<p class="mx-y"${M('text', 'Sumbu tegak')}>${esc(s.axes.y)}</p><i class="mx-ay"${DRAW('y', 'Panah tegak')}></i><i class="mx-ax"${DRAW('x', 'Panah datar')}></i><p class="mx-x"${M('text', 'Sumbu datar')}>${esc(s.axes.x)}</p>` : '';
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-mx v-${v}${axes ? ' has-axes' : ''}" data-comp="matrix">${axes}<div class="mx-g">${cells}</div></div></div>`;
  },

  numbered(s, ctx) {
    const v = V(s, 'rail');
    const items = s.items.map((t, k) => `<div class="nb-i"${M('item', `Langkah ${k + 1}`)}><span class="nb-n">${v === 'rail' ? String(k + 1).padStart(2, '0') : k + 1}</span><p class="nb-x">${esc(t)}</p></div>`).join('');
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-nb v-${v}" data-comp="numbered">${items}</div></div>`;
  },

  tip(s, ctx) {
    const v = V(s, 'card');
    const head = `<div class="tp-h"><span class="tp-ic">${iconSvg(ctx.icons, s.icon, 'ic')}</span>${s.label ? `<span class="tp-l">${esc(s.label)}</span>` : ''}</div>`;
    return `<div class="group">${T(ctx, 'h2', 'h2', s.title)}<div class="x-tp v-${v}" data-comp="tip"${M('item', 'Kartu tips')}>${head}<p class="tp-x">${esc(s.text)}</p></div></div>`;
  },

  definition(s, ctx) {
    const v = V(s, 'dict');
    const kind = s.kind ? `<p class="df-k"${M('text', 'Jenis kata')}>${esc(s.kind)}</p>` : '';
    const head = v === 'card'
      ? `<div class="df-band"><i class="df-bg"${DRAW('x', 'Pita')}></i>${T(ctx, 'h2', 'h1 df-t', s.title)}</div>${kind}`
      : `${T(ctx, 'h2', 'h1 df-t', s.title)}${kind}<i class="df-rule"${DRAW('x', 'Garis')}></i>`;
    const mean = `<div class="df-m"${M('item', 'Arti')}><p class="df-x">${esc(s.meaning)}</p></div>`;
    const ex = s.example ? `<p class="x-ex df-e"${M('item', 'Contoh')}>${esc(s.example)}</p>` : '';
    return `<div class="group x-df v-${v}" data-comp="definition">${head}${mean}${ex}</div>`;
  },
};

/* Tiny previews for the flow diagram in the guide (48 x 60). */
export function extraThumb(comp, t, hi, r) {
  const bars = (y, w1, w2) => r(7, y, w1, 3, t.ink) + (w2 ? r(7, y + 5, w2, 3, t.ink) : '');
  const ci = t.cink || t.ink;
  return {
    hero: r(8, 18, 32, 5, t.ink) + r(10, 26, 28, 5, t.ink) + r(26, 33, 12, 2, hi) + r(9, 44, 10, 3, t.muted) + r(22, 43.5, 4, 4, t.accent) + r(29, 44, 10, 3, t.ink),
    outro: r(7, 16, 30, 5, t.ink) + r(7, 24, 22, 5, t.ink) + r(7, 33, 24, 3, t.muted) + r(7, 42, 34, 1, t.muted) + `<circle cx="11" cy="49" r="3.5" fill="${t.accent}"/>` + r(17, 48, 20, 3, t.ink),
    pairs: bars(12, 28) + [24, 33, 42].map(y => r(7, y, 12, 7, t.card) + r(21, y, 20, 7, t.accent)).join(''),
    quotes: bars(12, 28) + [24, 32, 40, 48].map(y => r(7, y, 34, 0.8, t.muted) + r(7, y + 2.5, 28, 3, t.ink)).join(''),
    split: bars(12, 26) + r(7, 26, 14, 16, t.bg, ` stroke="${t.muted}" stroke-width="0.8"`) + r(23, 32, 4, 3, t.accent) + r(29, 26, 12, 16, t.card) + r(7, 47, 34, 6, t.card),
    ladder: bars(12, 26) + r(7, 24, 28, 7, t.card) + r(11, 33, 28, 7, t.card) + r(15, 42, 26, 8, t.ink),
    versus: bars(12, 28) + r(7, 26, 15, 14, t.card) + r(26, 26, 15, 14, t.bg, ` stroke="${t.muted}" stroke-width="0.8"`) + r(23.5, 24, 0.8, 30, t.muted) + r(7, 44, 13, 3, t.muted) + r(26, 44, 13, 3, t.muted),
    formula: bars(12, 26) + r(7, 25, 9, 8, t.bg, ` stroke="${t.ink}" stroke-width="0.8"`) + r(19.5, 25, 9, 8, t.bg, ` stroke="${t.ink}" stroke-width="0.8"`) + r(32, 25, 9, 8, t.bg, ` stroke="${t.ink}" stroke-width="0.8"`) + r(7, 37, 34, 8, t.card) + r(7, 49, 10, 5, t.card) + r(19, 49, 10, 5, t.card) + r(31, 49, 10, 5, hi),
    reframe: bars(12, 26) + r(7, 25, 34, 9, hi) + r(13, 37, 8, 2, t.accent) + r(13, 42, 28, 9, t.bg, ` stroke="${t.muted}" stroke-width="0.8"`),
    hook: r(8, 16, 32, 26, t.card, ` stroke="${t.ink}" stroke-width="1"`) + `<circle cx="38" cy="16" r="5" fill="${hi}"/>` + r(12, 23, 22, 4, ci) + r(12, 30, 16, 4, ci) + r(12, 47, 24, 3, t.muted),
    stat: `<text x="7" y="30" font-size="16" font-weight="700" fill="${t.accent}">60</text>` + r(7, 36, 32, 5, t.ink) + r(7, 44, 24, 5, t.ink) + r(7, 53, 20, 2.5, t.muted),
    recap: r(7, 12, 30, 5, t.ink) + r(7, 20, 22, 5, t.ink) + [30, 37, 44].map(y => r(7, y, 4, 3, t.accent) + r(14, y, 24, 3, t.ink)).join('') + `<circle cx="10" cy="52" r="3" fill="${t.accent}"/>` + r(16, 51, 20, 3, t.ink),
    swap: bars(12, 26) + r(7, 24, 20, 5, t.bg, ` stroke="${t.muted}" stroke-width="0.8"`) + r(7, 26, 20, 1, t.accent) + r(30, 24, 6, 5, t.accent) + r(7, 33, 32, 6, t.card) + r(10, 41, 32, 6, t.card) + r(7, 49, 32, 6, t.card),
    bignumber: `<text x="24" y="34" text-anchor="middle" font-size="18" font-weight="800" fill="${t.accent}">3</text>` + r(10, 40, 28, 4, t.ink) + r(12, 47, 24, 3, t.muted),
    pullquote: r(7, 18, 34, 5, t.ink) + r(7, 26, 34, 5, t.ink) + r(7, 34, 26, 5, t.ink) + r(7, 44, 14, 2, t.muted),
    myth: bars(12, 26) + r(7, 24, 34, 12, t.bg, ` stroke="${t.muted}" stroke-width="0.8"`) + r(7, 39, 34, 14, t.card) + r(9, 42, 6, 2.5, t.accent),
    dodont: bars(12, 26) + r(7, 24, 15, 4, t.accent) + r(26, 24, 15, 4, t.muted) + [31, 37, 43].map(y => r(7, y, 15, 3, t.ink) + r(26, y, 15, 3, t.ink)).join(''),
    timeline: bars(12, 26) + r(9, 24, 2, 30, t.accent) + [25, 33, 41, 49].map((y, k) => `<circle cx="10" cy="${y}" r="2.2" fill="${k === 3 ? hi : t.accent}"/>` + r(15, y - 1.5, 24, 3, t.ink)).join(''),
    grid: bars(12, 26) + r(7, 24, 34, 0.8, t.muted) + r(23.6, 24, 0.8, 28, t.muted) + r(7, 38, 34, 0.8, t.muted) + r(7, 52, 34, 0.8, t.muted) + [[9, 28], [26, 28], [9, 42], [26, 42]].map(([x, y]) => r(x, y, 3, 3, t.accent) + r(x + 5, y, 8, 3, t.ink)).join(''),
    iconrow: bars(12, 26) + [12, 24, 36].map(x => `<circle cx="${x}" cy="33" r="4" fill="none" stroke="${t.accent}" stroke-width="1.2"/>` + r(x - 4, 41, 8, 2, t.ink)).join('') + r(18, 27, 0.6, 18, t.muted) + r(30, 27, 0.6, 18, t.muted),
    spectrum: bars(12, 26) + r(7, 30, 6, 2, t.muted) + r(35, 30, 6, 2, t.muted) + `<rect x="7" y="35" width="34" height="5" rx="2.5" fill="${t.accent}"/>` + [12, 24, 36].map(x => `<circle cx="${x}" cy="37.5" r="3" fill="${t.bg}" stroke="${t.ink}" stroke-width="1"/>` + r(x - 4, 45, 8, 3, t.ink)).join(''),
    callout: bars(12, 26) + [25, 31, 37, 43].map(y => r(7, y, 34, 3.5, t.ink)).join('') + r(16, 39.5, 16, 1.5, hi),
    qa: r(7, 14, 28, 13, t.card) + r(10, 18, 20, 3, ci) + r(15, 32, 26, 16, t.accent) + r(18, 36, 18, 2.5, t.bg) + r(18, 41, 14, 2.5, t.bg),
    cycle: bars(12, 26) + `<circle cx="24" cy="38" r="11" fill="none" stroke="${t.accent}" stroke-width="1.4"/>` + [[24, 27], [35, 38], [24, 49], [13, 38]].map(([x, y]) => r(x - 5, y - 2.5, 10, 5, t.card, ` stroke="${t.accent}" stroke-width="0.6"`)).join(''),
    pyramid: bars(12, 26) + r(16, 26, 16, 7, hi) + r(11, 35, 26, 7, t.accent) + r(7, 44, 34, 7, t.card),
    matrix: bars(12, 26) + r(9, 25, 15, 12, t.card) + r(25, 25, 15, 12, hi) + r(9, 38, 15, 12, t.card) + r(25, 38, 15, 12, t.card) + r(7, 24, 1, 28, t.ink) + r(7, 51, 34, 1, t.ink),
    numbered: bars(12, 26) + [25, 34, 43].map((y, k) => `<text x="7" y="${y + 6}" font-size="7" font-weight="800" fill="${t.accent}">0${k + 1}</text>` + r(17, y + 2, 24, 3, t.ink) + r(7, y + 8, 34, 0.6, t.muted)).join(''),
    tip: bars(12, 26) + r(7, 25, 34, 28, t.card) + r(10, 29, 4, 4, t.accent) + r(16, 30, 12, 2.5, t.accent) + r(10, 38, 28, 3, ci) + r(10, 43, 22, 3, ci),
    definition: r(7, 13, 24, 7, t.ink) + r(7, 23, 14, 2.5, t.accent) + r(7, 28, 34, 1, t.muted) + r(7, 32, 34, 3, t.ink) + r(7, 37, 30, 3, t.ink) + r(7, 44, 34, 8, t.card),
  }[comp] || bars(13, 28, 18) + [26, 33, 40, 47].map(y => r(7, y, 34, 4, t.card)).join('');
}
