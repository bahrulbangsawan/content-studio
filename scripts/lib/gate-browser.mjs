// Browser half of the component gate. pageChecks() runs inside the test page that component.mjs builds
// (one .slide per case, variant and theme, drawn at full size without entrance motion) and measures what
// a reader would see: text leaving its box or the content zone, words broken mid-word, cramped card
// padding, text on text, the gap under the title, contrast, and the AI patterns that show in computed
// style (side-tab borders, shadows, gradients, nested cards, icon tiles, pills with two lines).
// It must stay self-contained: it is serialised with Function.prototype.toString().
export function pageChecks(opts) {
  const findings = [];
  const parse = s => {
    let m = s.match(/rgba?\(([^)]+)\)/);
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0] / 255, p[1] / 255, p[2] / 255, p[3] ?? 1]; }
    m = s.match(/color\(srgb ([^)]+)\)/);
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; }
    return null;
  };
  const over = (top, bot) => { const a = top[3]; return [0, 1, 2].map(i => top[i] * a + bot[i] * (1 - a)).concat(1); };
  const lum = c => { const f = v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const same = (a, b) => a && b && Math.abs(a[0] - b[0]) < 0.02 && Math.abs(a[1] - b[1]) < 0.02 && Math.abs(a[2] - b[2]) < 0.02 && Math.abs(a[3] - b[3]) < 0.05;
  const rects = node => { const r = document.createRange(); r.selectNodeContents(node); return [...r.getClientRects()].filter(x => x.width > 0.5 && x.height > 0.5); };
  const inSvg = el => !!el.closest('svg');
  const isInline = el => getComputedStyle(el).display === 'inline';
  /* The box a text belongs to. Title words (.w, split for word-by-word motion) belong to their heading. */
  const blockOf = el => { if (el.closest('.w')) el = el.closest('.w').parentElement; while (el && isInline(el) && el.parentElement) el = el.parentElement; return el; };
  const tops = rs => new Set(rs.map(r => Math.round(r.top / 4))).size;
  /* Three or more siblings of the same class form a scale or a set of markers, not a decoration */
  const series = e => e.className && [...e.parentElement.children].filter(k => k.className === e.className).length >= 3;

  document.querySelectorAll('.slide[data-case]').forEach((slide, si) => {
    slide.scrollIntoView({ block: 'start' });
    const S = slide.getBoundingClientRect();
    const rel = r => ({ x: Math.round(r.left - S.left), y: Math.round(r.top - S.top), w: Math.round(r.width), h: Math.round(r.height) });
    const add = (level, code, msg, boxes = []) => findings.push({ slide: si, level, code, msg, boxes: boxes.map(rel) });
    const content = slide.querySelector('.content'), root = content.firstElementChild;
    const C = content.getBoundingClientRect();
    const comp = slide.dataset.comp, strict = slide.dataset.strict === '1';
    /* Token colours of this slide, read through probe elements */
    const probe = v => { const p = document.createElement('i'); p.style.color = `var(${v})`; slide.querySelector('.canvas').appendChild(p); const c = parse(getComputedStyle(p).color); p.remove(); return c; };
    const T = { bg: probe('--s-bg'), muted: probe('--s-muted'), joint: probe('--s-joint'), sun: probe('--s-sun'), rule: probe('--s-rule'), rule2: probe('--s-rule-2'), lrule: probe('--l-rule'), lrule2: probe('--l-rule-2') };
    /* Neutral lines of the slide, and of the light palette that cards keep on dark slides */
    const ruleish = c => !c || c[3] === 0 || [T.rule, T.rule2, T.lrule, T.lrule2].some(x => same(c, x));

    /* Text nodes and the elements that own them */
    const texts = [];
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) {
      const n = tw.currentNode;
      if (!n.nodeValue.trim() || inSvg(n.parentElement)) continue;
      const rs = rects(n), cs = getComputedStyle(n.parentElement);
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
      /* Line boxes: glyph boxes of a tall font overhang their line, so overlap is judged on the lines */
      const lines = rs.map(r => { const c = (r.top + r.bottom) / 2; return { left: r.left, right: r.right, top: c - lh / 2, bottom: c + lh / 2 }; });
      texts.push({ node: n, el: n.parentElement, block: blockOf(n.parentElement), rs, lines });
    }
    const allRects = texts.flatMap(t => t.rs);
    /* Photo frames (.md) are pictures, not cards or shapes: they skip the surface checks below.
       A frame marked .bleed may reach past the content zone to the canvas edge. */
    const isMedia = e => !!e.closest('.md');
    const elems = [...root.querySelectorAll('*')].filter(e => (!inSvg(e) || e.tagName.toLowerCase() === 'svg') && !isMedia(e));
    const inZone = [...root.querySelectorAll('*')].filter(e => (!inSvg(e) || e.tagName.toLowerCase() === 'svg') && !e.closest('.bleed'));

    /* 1. Content zone: nothing may leave the 888 x 1014 zone (offside) */
    const out = [...allRects, ...inZone.map(e => e.getBoundingClientRect()).filter(r => r.width > 1 && r.height > 1)]
      .filter(r => r.left < C.left - 1 || r.right > C.right + 1 || r.top < C.top - 1 || r.bottom > C.bottom + 1);
    if (out.length) add('error', 'zona', 'Isi keluar dari zona konten (offside). Kurangi batas karakter, jumlah butir, atau tinggi tata letak.', out.slice(0, 6));

    /* 2. Text inside its own box, and 3. no word broken across two lines */
    for (const t of texts) {
      const B = t.block.getBoundingClientRect();
      const wide = t.rs.filter(r => r.left < B.left - 1.5 || r.right > B.right + 1.5);
      if (wide.length) add('error', 'luber', `Teks "${t.node.nodeValue.trim().slice(0, 40)}" melewati kotaknya.`, wide);
      const v = t.node.nodeValue;
      for (const m of v.matchAll(/\S+/g)) {
        if (/[-–/]/.test(m[0]) || m[0].length < 2) continue;
        const r = document.createRange(); r.setStart(t.node, m.index); r.setEnd(t.node, m.index + m[0].length);
        const rs = [...r.getClientRects()].filter(x => x.width > 0.5);
        if (tops(rs) > 1) add('error', 'kata', `Kata "${m[0]}" terpotong di tengah. Lebarkan kotaknya, kecilkan batas karakter field, atau pakai ukuran huruf yang lebih kecil dari skala.`, rs);
      }
    }

    /* 4. Surfaces: cards, outlined boxes and chips */
    const surf = new Map();
    for (const e of elems) {
      if (e.tagName.toLowerCase() === 'svg') continue;
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      const bg = parse(cs.backgroundColor);
      const ow = e.offsetWidth || r.width, oh = e.offsetHeight || r.height;
      const sides = ['Top', 'Right', 'Bottom', 'Left'].map(s => ({ w: parseFloat(cs[`border${s}Width`]) || 0, c: parse(cs[`border${s}Color`]), on: cs[`border${s}Style`] !== 'none' && (parseFloat(cs[`border${s}Width`]) || 0) > 0 }))
        .map(sd => ({ ...sd, on: sd.on && !(bg && same(sd.c, bg)) }));
      const nOn = sides.filter(s => s.on).length;
      const visBg = bg && bg[3] > 0.05 && !same(bg, T.bg);
      const rad = /%/.test(cs.borderTopLeftRadius) ? (parseFloat(cs.borderTopLeftRadius) / 100) * Math.min(ow, oh) : parseFloat(cs.borderTopLeftRadius) || 0;
      const pill = rad >= Math.min(r.width, r.height) / 2 - 1 && rad > 0;
      const circle = pill && Math.abs(r.width - r.height) < 4;
      if (nOn > 0 && nOn < 4 && ow > 48) {
        if (rad > 0) add('error', 'tab', 'Garis di satu sisi kartu bersudut bulat (side-tab). Pakai latar kartu atau garis penuh 2 px netral.', [r]);
        else if (sides.some(s => s.on && (s.w > 2 || !ruleish(s.c)))) add('error', 'tab', 'Garis aksen tebal atau berwarna di satu sisi (side-tab). Garis pemisah 2 px memakai --s-rule atau --s-rule-2.', [r]);
      }
      if (nOn === 4 && sides.some(s => s.w > 2 || !ruleish(s.c))) add('error', 'garis', 'Kartu bergaris tebal atau berwarna aksen. Garis kartu 2 px dan netral; penekanan lewat latar.', [r]);
      if (rad > 28 && !pill) add('error', 'radius', `Radius ${Math.round(rad)} px terlalu besar untuk kartu. Pakai 20 px untuk kartu, 12 px untuk kotak kecil.`, [r]);
      const ring = cs.boxShadow.match(/^(.+?\)) 0px 0px 0px [\d.]+px$/);
      if (cs.boxShadow !== 'none' && !(ring && same(parse(ring[1]), T.bg))) add(strict ? 'error' : 'warn', 'bayangan', 'Bayangan dipakai sebagai hiasan.', [r]);
      if (cs.backgroundImage !== 'none') add('error', 'gradien', 'Latar bergradien, bergaris, atau bergambar.', [r]);
      if (cs.filter !== 'none' || cs.backdropFilter !== 'none') add('error', 'kaca', 'Efek blur atau kaca buram.', [r]);
      const tf = cs.transform.match(/matrix\(([^)]+)\)/);
      if (tf && ow > 48) { const p = tf[1].split(',').map(Number); if (Math.abs(p[1]) > 0.001 || Math.abs(p[2]) > 0.001) add('error', 'miring', 'Elemen dimiringkan sebagai hiasan.', [r]); }
      /* A highlighted phrase inside a sentence (inline, like a marker pen) is part of the text, not a card */
      if (cs.display === 'inline') continue;
      if ((visBg || nOn === 4) && ow >= 48 && oh >= 40) surf.set(e, { r, cs, pill, circle, rad, ow, oh });
    }
    /* Cards stay light on dark slides: a card painted in the dark theme's card colour missed the light palette */
    if (slide.classList.contains('is-dark')) {
      const dark = probe('--s-card');
      const hit = elems.find(e => e.tagName.toLowerCase() !== 'svg' && same(parse(getComputedStyle(e).backgroundColor), dark));
      if (hit) add('error', 'kartu-gelap', 'Kartu berwarna gelap di slide gelap. Kartu tetap terang di slide gelap: pakai background: var(--s-card) pada pemilih kartunya, engine memasang palet terang di dalamnya.', [hit.getBoundingClientRect()]);
    }
    for (const [e, s] of surf) {
      for (let p = e.parentElement; p && p !== content && !s.pill; p = p.parentElement) if (surf.has(p) && !surf.get(p).pill) { add('error', 'kartu-ganda', 'Kartu di dalam kartu. Ratakan hierarkinya dengan jarak, tebal huruf, atau garis pemisah.', [s.r]); break; }
      const icons = [...e.querySelectorAll('svg')];
      const words = texts.filter(t => e.contains(t.node)).flatMap(t => t.rs);
      /* Content for padding: the text and the catalog icons beside it (lines drawn over text do not count) */
      const own = words.length ? [...words, ...[...e.querySelectorAll('svg.ic')].map(g => g.getBoundingClientRect())] : [];
      if (!own.length) {
        if (icons.length && !e.classList.contains('cta-ic')) add('error', 'wadah-ikon', 'Ikon di dalam wadah (kotak atau lingkaran ikon). Letakkan ikon langsung di samping teks, tanpa wadah.', [s.r]);
        else if (!icons.length && !(s.circle && s.r.width <= 64) && !series(e) && !allRects.some(t => t.left < s.r.right && t.right > s.r.left && t.top < s.r.bottom && t.bottom > s.r.top)) add('error', 'hiasan', 'Bentuk tanpa isi dan tanpa teks di atasnya: hiasan yang tidak membawa informasi.', [s.r]);
        continue;
      }
      const bw = k => parseFloat(s.cs[`border${k}Width`]) || 0;
      const L = Math.min(...own.map(r => r.left)) - s.r.left - bw('Left'), Rt = s.r.right - bw('Right') - Math.max(...own.map(r => r.right));
      const Tp = Math.min(...own.map(r => r.top)) - s.r.top - bw('Top'), Bt = s.r.bottom - bw('Bottom') - Math.max(...own.map(r => r.bottom));
      if (Math.min(L, Rt, Tp, Bt) < -1) { add('error', 'keluar-kartu', 'Teks keluar dari kartunya.', own.filter(r => r.left < s.r.left || r.right > s.r.right || r.top < s.r.top || r.bottom > s.r.bottom)); continue; }
      if (s.circle) continue;
      /* Inset by size: badges (up to 96 px), small boxes (radius under 16), cards, single-line chips */
      const [h, v] = s.pill ? [16, 6] : Math.max(s.ow, s.oh) <= 96 ? [8, 8] : s.rad >= 16 ? [24, 16] : [16, 12];
      if (L < h - 0.5 || Rt < h - 0.5) add('error', 'padding', `Teks terlalu mepet ke sisi kartu (kiri ${Math.round(L)} px, kanan ${Math.round(Rt)} px; minimal ${h}). Tambah padding dari skala jarak.`, [s.r]);
      if (Tp < v - 0.5 || Bt < v - 0.5) add('error', 'padding', `Teks terlalu mepet ke atas atau bawah kartu (atas ${Math.round(Tp)} px, bawah ${Math.round(Bt)} px; minimal ${v}).`, [s.r]);
      const blocks = new Set(texts.filter(t => e.contains(t.node)).map(t => t.block));
      if (blocks.size === 1 && Math.abs(Tp - Bt) > 12) add('warn', 'padding', `Ruang atas dan bawah kartu tidak sama (atas ${Math.round(Tp)} px, bawah ${Math.round(Bt)} px).`, [s.r]);
      if (blocks.size === 1 && s.cs.textAlign === 'center' && Math.abs(L - Rt) > 8 && tops(words) === 1) add('warn', 'padding', 'Teks tengah tidak berada di tengah kartu.', [s.r]);
      if (s.pill && !s.circle && tops(words) > 1) add('error', 'pil', 'Chip berbentuk pil berisi dua baris. Pil hanya untuk teks satu baris; pakai kartu radius 20 atau persingkat teksnya.', [s.r]);
    }
    /* Room around cards: neighbouring cards and text outside a card keep at least 8 px of air */
    const cards = [...surf.entries()].filter(([, s]) => !s.circle);
    const gapOf = (a, b) => Math.max(b.left - a.right, a.left - b.right, b.top - a.bottom, a.top - b.bottom);
    for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
      const [ea, sa] = cards[i], [eb, sb] = cards[j];
      if (ea.contains(eb) || eb.contains(ea)) continue;
      const g = gapOf(sa.r, sb.r);
      if (g < 8) { add('error', 'menempel', g < 0 ? 'Dua kartu bertumpuk.' : `Dua kartu hanya berjarak ${Math.round(g)} px. Beri jarak dari skala, minimal 8 px (biasanya 16 sampai 24).`, [sa.r, sb.r]); i = j = cards.length; }
    }
    for (const [e, sc] of cards) {
      const near = texts.filter(t => !e.contains(t.node) && !t.el.contains(e)).flatMap(t => t.rs)
        .filter(r => Math.min(r.right, sc.r.right) - Math.max(r.left, sc.r.left) > 4 && Math.min(r.bottom, sc.r.bottom) - Math.max(r.top, sc.r.top) <= 0)
        .filter(r => { const g = gapOf(sc.r, r); return g >= 0 && g < 8; });
      if (near.length) { add('error', 'menempel', 'Teks di luar kartu menempel ke tepi kartu. Beri jarak minimal 8 px.', [sc.r, ...near]); break; }
    }

    /* Decorative shapes that are not cards: big filled blocks without text on or in them */
    for (const e of elems) {
      if (surf.has(e) || e.tagName.toLowerCase() === 'svg') continue;
      const cs = getComputedStyle(e), r = e.getBoundingClientRect(), bg = parse(cs.backgroundColor);
      if (!(bg && bg[3] > 0.05 && !same(bg, T.bg)) || (e.offsetWidth || r.width) <= 64 || (e.offsetHeight || r.height) <= 48) continue;
      if (!e.textContent.trim() && !e.querySelector('svg') && !allRects.some(t => t.left < r.right && t.right > r.left && t.top < r.bottom && t.bottom > r.top)) add('error', 'hiasan', 'Bentuk tanpa isi: hiasan yang tidak membawa informasi.', [r]);
    }

    /* 5. Text on text, and text covered by an opaque element */
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i], b = texts[j];
      if (a.block === b.block || a.block.contains(b.block) || b.block.contains(a.block)) continue;
      for (const x of a.lines) for (const y of b.lines) {
        const w = Math.min(x.right, y.right) - Math.max(x.left, y.left), hh = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top);
        if (w > 3 && hh > 2) { add('error', 'tumpuk', `Teks bertumpuk: "${a.node.nodeValue.trim().slice(0, 24)}" dan "${b.node.nodeValue.trim().slice(0, 24)}".`, [x, y]); i = j = texts.length; break; }
      }
    }
    for (const ic of root.querySelectorAll('svg.ic')) {
      const r = ic.getBoundingClientRect();
      if (allRects.some(t => Math.min(t.right, r.right) - Math.max(t.left, r.left) > 4 && Math.min(t.bottom, r.bottom) - Math.max(t.top, r.top) > 4)) add('error', 'tumpuk', 'Ikon menimpa teks.', [r]);
    }
    for (const t of texts) {
      for (const r of t.rs) {
        const x = (r.left + r.right) / 2, y = (r.top + r.bottom) / 2;
        const top = document.elementFromPoint(x, y);
        if (!top || t.el.contains(top) || top.contains(t.el) || inSvg(top)) continue;
        const bg = parse(getComputedStyle(top).backgroundColor);
        if (bg && bg[3] > 0.3) { add('error', 'tertutup', `Teks "${t.node.nodeValue.trim().slice(0, 30)}" tertutup elemen lain.`, [r]); break; }
      }
    }

    /* 6. Title: first, alone at the top, with room under it */
    const ttl = root.querySelector('.ttl');
    if (ttl) {
      const tr = texts.filter(t => ttl.contains(t.node)).flatMap(t => t.rs);
      const tTop = Math.min(...tr.map(r => r.top)), tBot = Math.max(...tr.map(r => r.bottom));
      const tL = Math.min(...tr.map(r => r.left)), tR = Math.max(...tr.map(r => r.right));
      const col = r => Math.min(r.right, tR) - Math.max(r.left, tL) > 8;
      const tSize = parseFloat(getComputedStyle(ttl).fontSize);
      const above = texts.filter(t => !ttl.contains(t.node) && parseFloat(getComputedStyle(t.el).fontSize) < tSize).flatMap(t => t.rs).filter(r => r.bottom <= tTop + 4 && col(r));
      if (above.length) add('error', 'label-judul', 'Ada teks di atas judul (label atau badge di atas heading). Masukkan informasinya ke judul atau ke isi di bawahnya.', above);
      const below = [...allRects.filter(r => !tr.includes(r)), ...[...surf.values()].map(s => s.r), ...[...root.querySelectorAll('svg, .md')].filter(g => !ttl.contains(g)).map(g => g.getBoundingClientRect())].filter(r => r.top > tTop + (tBot - tTop) / 2 && col(r));
      if (below.length) {
        const gap = Math.min(...below.map(r => r.top)) - tBot;
        if (gap < 24) add('error', 'jarak-judul', `Isi terlalu dekat dengan judul (${Math.round(gap)} px, minimal 24). Beri jarak dari skala, misalnya .ds-main (40 px).`, [ttl.getBoundingClientRect()]);
        else if (gap > 160) add('warn', 'jarak-judul', `Jarak judul ke isi ${Math.round(gap)} px. Judul terlihat terlepas dari isinya.`, [ttl.getBoundingClientRect()]);
      }
    }
    const hs = [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(h => Number(h.tagName[1]));
    for (let k = 1; k < hs.length; k++) if (hs[k] > hs[k - 1] + 1) { add('error', 'heading', `Tingkat heading melompat dari h${hs[k - 1]} ke h${hs[k]}.`); break; }

    /* 7. Text style: size, contrast, line height, caps, tracking, italics, motion, numbers, repeats */
    const seen = new Map();
    for (const t of texts) {
      const cs = getComputedStyle(t.el), fs = parseFloat(cs.fontSize), fw = Number(cs.fontWeight) || 400;
      const box = t.rs[0] || t.el.getBoundingClientRect();
      if (fs < opts.minText - 0.1) add('error', 'kecil', `Teks ${fs} px, minimal ${opts.minText} px agar terbaca di ponsel.`, [box]);
      const fg = parse(cs.webkitTextFillColor || cs.color);
      if (fg && fg[3] < 0.1 && parseFloat(cs.webkitTextStrokeWidth) > 0) add('error', 'berongga', 'Huruf berongga (hanya garis tepi) sulit dibaca. Pakai huruf penuh berwarna token.', [box]);
      if (fg && fg[3] >= 0.1 && t.rs.length) {
        const r = t.rs[0], x = (r.left + r.right) / 2, y = (r.top + r.bottom) / 2;
        const stack = document.elementsFromPoint(x, y), layers = [];
        for (const el of stack) { if (t.el !== el && t.el.contains(el)) continue; const c = parse(getComputedStyle(el).backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 0.99) break; } }
        let bg = T.bg.slice();
        for (let k = layers.length - 1; k >= 0; k--) bg = over(layers[k], bg);
        const fgc = over(fg, bg), cr = ratio(fgc, bg), need = fs >= 44 ? 3 : 4.5;
        if (cr < need - 0.01) add('error', 'kontras', `Kontras ${cr.toFixed(2)}:1 untuk "${t.node.nodeValue.trim().slice(0, 24)}", minimal ${need}:1.`, [r]);
        if (same(fg, T.muted) && (same(bg, T.joint) || same(bg, T.sun))) add('error', 'abu-warna', 'Teks abu-abu di atas latar berwarna terlihat pudar. Pakai warna teks pasangan latar itu.', [r]);
      }
      const lh = parseFloat(cs.lineHeight);
      if (tops(t.rs) > 1 && lh && lh / fs < (fs < 56 ? 1.15 : 1.0) - 0.01) add('error', 'baris', `Tinggi baris ${lh}/${fs} terlalu rapat.`, [box]);
      if (cs.textTransform === 'uppercase') add('error', 'kapital', 'Teks huruf kapital semua.', [box]);
      const ls = parseFloat(cs.letterSpacing) || 0;
      if (fs >= 56 ? ls > 0.5 || ls < -0.03 * fs - 0.1 : Math.abs(ls) > 0.5) add('error', 'tracking', fs >= 56 ? 'Jarak huruf terlalu rapat atau renggang.' : 'Jarak huruf diubah. Tracking bawaan font untuk teks di bawah 56 px.', [box]);
      if (cs.fontStyle === 'italic') add('error', 'miring', 'Huruf miring.', [box]);
      if (cs.textAlign === 'justify') add('error', 'rata', 'Teks rata kanan-kiri.', [box]);
      if (t.block.closest('.content') && !t.el.closest('[data-m]')) add('error', 'gerak', `Teks "${t.node.nodeValue.trim().slice(0, 30)}" tidak punya gerak masuk. Pasang M(peran, label) pada elemennya.`, [box]);
      if (fs > 104 && !/^[\d.,%+\-–x×:\s]{1,6}$/.test(t.node.nodeValue.trim())) add('error', 'raksasa', 'Huruf raksasa di atas 104 px hanya untuk angka pendek.', [box]);
      if (/^\s*0?\d{1,2}[.)]?\s*$/.test(t.node.nodeValue) && !opts.ordered.includes(comp)) add('error', 'nomor', 'Nomor tanpa urutan. Nomor hanya untuk langkah yang benar-benar berurutan (set ordered: true bila memang begitu).', [box]);
      if (/\p{Extended_Pictographic}/u.test(t.node.nodeValue)) add('error', 'emoji', 'Emoji sebagai ikon. Pakai ikon dari katalog.', [box]);
      const key = t.block.textContent.trim().toLowerCase();
      if (/\p{L}{3}/u.test(key)) { if (!seen.has(key)) seen.set(key, []); if (!seen.get(key).includes(t.block)) seen.get(key).push(t.block); }
      if (cs.textAlign === 'center' && tops(t.rs) > 3) add('warn', 'tengah', 'Paragraf rata tengah lebih dari tiga baris sulit diikuti. Rata kiri untuk teks panjang.', [box]);
    }
    /* Repeated by the renderer, not by the content: a label copied into every row or card */
    const given = JSON.parse(slide.dataset.texts || '{}');
    for (const [k, bs] of seen) if (bs.length > 1 && bs.length > (given[k] || 0)) add('error', 'ulang', `Teks "${k.slice(0, 30)}" muncul ${bs.length} kali padahal isinya ${given[k] || 0} kali. Label yang sama di setiap baris atau kartu cukup ditulis sekali, misalnya sebagai kepala kolom.`, bs.map(b => b.getBoundingClientRect()));

    /* 8. Rhythm: space inside an item is smaller than space between items */
    for (const parent of [root, ...root.querySelectorAll('*')]) {
      if (inSvg(parent)) continue;
      const kids = [...parent.children].filter(k => !inSvg(k) || k.tagName.toLowerCase() === 'svg');
      if (kids.length < 3) continue;
      const sig = k => `${k.tagName}.${k.className}`;
      if (new Set(kids.map(sig)).size !== 1) continue;
      const parts = kids.map(k => texts.filter(t => k.contains(t.node)));
      if (parts.some(p => new Set(p.map(t => t.block)).size < 2)) continue;
      const boxes = kids.map(k => k.getBoundingClientRect());
      if (!boxes.every((b, k) => k === 0 || b.top >= boxes[k - 1].bottom - 1)) continue;
      let inner = 0, inter = Infinity;
      parts.forEach((p, k) => {
        const byBlock = [...new Set(p.map(t => t.block))].map(b => { const rs = p.filter(t => t.block === b).flatMap(t => t.rs); return { top: Math.min(...rs.map(r => r.top)), bottom: Math.max(...rs.map(r => r.bottom)) }; }).sort((a, b) => a.top - b.top);
        for (let q = 1; q < byBlock.length; q++) inner = Math.max(inner, byBlock[q].top - byBlock[q - 1].bottom);
        if (k > 0) {
          const prev = parts[k - 1].flatMap(t => t.rs), cur = p.flatMap(t => t.rs);
          inter = Math.min(inter, Math.min(...cur.map(r => r.top)) - Math.max(...prev.map(r => r.bottom)));
        }
      });
      if (inner >= inter - 2) add('error', 'ritme', `Jarak di dalam butir (${Math.round(inner)} px) tidak lebih kecil dari jarak antar butir (${Math.round(inter)} px). Rapatkan isi satu butir, renggangkan antar butir.`, [parent.getBoundingClientRect()]);
    }
    /* Identical icon cards in a row give every point the same weight */
    for (const parent of root.querySelectorAll('*')) {
      const kids = [...parent.children].filter(k => surf.has(k) && k.querySelector('svg.ic') && texts.filter(t => k.contains(t.node)).map(t => t.block).filter((b, i, a) => a.indexOf(b) === i).length >= 2);
      if (kids.length >= 3) { add('warn', 'kartu-kembar', 'Deretan kartu ikon-judul-teks yang identik. Kelompokkan atau beri satu butir penekanan.', [parent.getBoundingClientRect()]); break; }
    }

    /* Two parallel rules with nothing between them read as one line drawn twice */
    const rules = [];
    for (const e of elems) {
      if (e.tagName.toLowerCase() === 'svg') continue;
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      if (r.width < 120) continue;
      /* Separator lines only: a box drawn on all four sides is an outline, not a rule */
      const on = side => (parseFloat(cs[`border${side}Width`]) || 0) > 0 && cs[`border${side}Style`] !== 'none';
      const boxed = ['Top', 'Right', 'Bottom', 'Left'].every(on);
      if (!boxed) for (const [side, y] of [['Top', r.top], ['Bottom', r.bottom]]) if (on(side) && !(parse(cs.backgroundColor) || [0, 0, 0, 0])[3]) rules.push({ y, x1: r.left, x2: r.right, el: e });
      const bg = parse(cs.backgroundColor);
      if (r.height <= 4 && bg && bg[3] > 0.05) rules.push({ y: (r.top + r.bottom) / 2, x1: r.left, x2: r.right, el: e });
    }
    for (let i = 0; i < rules.length; i++) for (let j = i + 1; j < rules.length; j++) {
      const a = rules[i], b = rules[j], gap = Math.abs(a.y - b.y);
      const ov = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
      if (gap < 3 || gap > 64 || ov < 0.5 * Math.min(a.x2 - a.x1, b.x2 - b.x1)) continue;
      const lo = Math.min(a.y, b.y), hi = Math.max(a.y, b.y);
      const between = [...allRects, ...[...root.querySelectorAll('svg.ic')].map(g => g.getBoundingClientRect())].some(t => t.bottom > lo + 1 && t.top < hi - 1 && t.right > Math.max(a.x1, b.x1) && t.left < Math.min(a.x2, b.x2));
      if (!between) { add('error', 'garis-ganda', 'Dua garis sejajar tanpa isi di antaranya. Hapus salah satunya, misalnya garis bawah baris terakhir sebelum catatan.', [{ left: Math.max(a.x1, b.x1), top: lo - 2, right: Math.min(a.x2, b.x2), bottom: hi + 2, width: ov, height: hi - lo + 4 }]); i = j = rules.length; }
    }

    /* 9. Nothing on the slide can be tapped */
    if (root.querySelector('button, a[href], input, select, textarea, [role="button"], [tabindex], [data-tap]')) add('error', 'ketuk', 'Ada elemen yang bisa diklik. Slide Instagram hanya digeser.');
  });

  /* Draw the findings on the slides for the contact sheet */
  findings.forEach(f => {
    const slide = document.querySelectorAll('.slide[data-case]')[f.slide];
    f.boxes.forEach(b => {
      const o = document.createElement('div');
      o.className = `gate-mark is-${f.level}`;
      Object.assign(o.style, { left: `${b.x - 6}px`, top: `${b.y - 6}px`, width: `${b.w + 12}px`, height: `${b.h + 12}px` });
      slide.appendChild(o);
    });
  });
  return findings.map(({ slide, level, code, msg }) => ({ slide, level, code, msg }));
}

/** Word checks for a built post page (verify.mjs): words broken mid-word, and a single word left alone on
 * the last line of a block (titles excepted: they are balanced by the engine and often short).
 * Runs with entrance motion switched off, so every line is in its final place. */
export function postTextChecks() {
  const had = document.body.classList.contains('motion');
  document.body.classList.remove('motion');
  const out = [];
  /* The post's own slides only: the studio also keeps small copies in the cover and closing pickers */
  const track = document.getElementById('track');
  (track ? track.querySelectorAll(':scope > .slide') : document.querySelectorAll('.slide')).forEach((slide, i) => {
    const root = slide.querySelector('.content');
    const broken = [], alone = [];
    const blocks = new Map();
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) {
      const n = tw.currentNode;
      if (!n.nodeValue.trim() || n.parentElement.closest('svg')) continue;
      /* The sentence a word belongs to: climb inline and inline-block wrappers (title words, highlighted words) */
      let b = n.parentElement;
      while (b.parentElement && /^inline(-block)?$/.test(getComputedStyle(b).display) && !/flex|grid/.test(getComputedStyle(b.parentElement).display)) b = b.parentElement;
      for (const m of n.nodeValue.matchAll(/\S+/g)) {
        const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        const rs = [...r.getClientRects()].filter(x => x.width > 0.5);
        if (!rs.length) continue;
        const h = Math.max(...rs.map(x => x.height));
        if (!/[-–/]/.test(m[0]) && rs.some(x => Math.abs(x.top - rs[0].top) > h / 2)) broken.push(m[0]);
        if (!blocks.has(b)) blocks.set(b, []);
        blocks.get(b).push({ w: m[0], top: rs[rs.length - 1].top, h });
      }
    }
    /* Words on one line share a top within half a line height; the canvas is scaled, so exact pixels differ */
    for (const [b, words] of blocks) {
      if (b.closest('.ttl')) continue;
      const bottom = Math.max(...words.map(x => x.top));
      const last = words.filter(x => bottom - x.top < x.h / 2);
      if (last.length === 1 && last.length < words.length && words.length >= 4) alone.push(last[0].w);
    }
    out.push({ slide: i + 1, broken: [...new Set(broken)], alone });
  });
  if (had) document.body.classList.add('motion');
  return out;
}
