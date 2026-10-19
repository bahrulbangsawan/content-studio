// Static scan of a post.json against the component catalog and the account rules.
// The in-page checks (zone fit, balance, smallest text, entrance time) run later in verify.mjs.
import { COMPONENTS, SLIDE_KEYS, roleOf, OPENERS, CLOSERS, hasVisual } from './components.mjs';
import { ART } from './art.mjs';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CUSTOM_ISSUES, passOf } from './custom.mjs';
import { countWords } from './common.mjs';
import { findPhrase } from './kit.mjs';
import { MEDIA_TYPES, MEDIA_MAX, MEDIA_FILE, FOCUS, kindOf } from './media.mjs';

/* Words that ask the reader to touch the image. Instagram posts can only be swiped.
   Allowed: "Geser" (swiping is native). Ordinary words like tapi, tekanan, sentuhan, bolak-balik stay allowed. */
export const TAP_WORDS = /(?:^|[^\p{L}])((?:ketuk|klik|centang|seret)\p{L}*|(?:tekan|sentuh|usap)(?!an)\p{L}*|tap(?!\p{L})|balik(?:kan)?\s+kartu|tap here|click|swipe up)/iu;
const PLACEHOLDER = /\bTODO\b|lorem ipsum|\[[^\]]{2,}\]|\bxxx\b/i;
const POST_KEYS = ['brand', 'slug', 'title', 'slides', 'covers', 'closings'];
const MEDIA_KEYS = ['src', 'alt', 'focus', 'still'];
const MB = n => (n / 1024 / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 });

/* `unchecked` lists custom components the component gate is checking right now: their samples are
   scanned before the component has a pass record. `mediaDir` (posts/<slug>/media) turns on the checks
   of the files themselves: present, not too large. */
export function scanPost(post, brand, rules, icons, { unchecked = [], mediaDir = null, layoutOnly = false } = {}) {
  const errors = [], warnings = [];
  const texts = []; // { path, text, slide, onSlide }
  const fields = []; // per-field usage for `scan.mjs --detail`
  const medias = []; // { path, src, kind }

  for (const k of Object.keys(post)) if (!POST_KEYS.includes(k)) errors.push(`Kunci tidak dikenal "${k}". post.json hanya berisi isi postingan, bukan gaya atau tata letak.`);
  if (post.brand !== brand.id) errors.push(`brand "${post.brand}" tidak cocok dengan akun "${brand.id}".`);
  if (!/^[a-z0-9][a-z0-9-]{2,59}$/.test(post.slug || '')) errors.push('slug wajib: huruf kecil, angka, tanda hubung, 3 sampai 60 karakter.');
  if (!post.title || String(post.title).length > 80) errors.push('title wajib, maksimal 80 karakter.');
  const slides = Array.isArray(post.slides) ? post.slides : [];
  if (slides.length < 3 || slides.length > 10) errors.push(`Jumlah slide ${slides.length}. Carousel berisi 3 sampai 10 slide.`);

  const limit = v => (typeof v === 'string' ? rules[v] : v);
  function check(path, spec, value, si, onSlide) {
    if (value === undefined || value === null || value === '') {
      if (spec.required) errors.push(`${path} wajib diisi.`);
      return;
    }
    switch (spec.type) {
      case 'text': {
        if (typeof value !== 'string') { errors.push(`${path} harus teks.`); return; }
        const w = countWords(value), max = limit(spec.words);
        fields.push({ path, words: w, maxWords: max || null, chars: value.length, maxChars: spec.chars || null });
        if (max && w > max) errors.push(`${path}: ${w} kata, maksimal ${max}.`);
        if (spec.chars && value.length > spec.chars) errors.push(`${path}: ${value.length} karakter, maksimal ${spec.chars} agar muat di zona konten.`);
        const long = spec.wordChars && value.split(/\s+/).find(x => x.replace(/[^\p{L}\p{N}]/gu, '').length > spec.wordChars);
        if (long) errors.push(`${path}: kata "${long}" terlalu panjang untuk kotaknya (maksimal ${spec.wordChars} huruf per kata) dan akan terpotong. Pakai kata yang lebih pendek.`);
        if (spec.numeral && !/^[\d.,%+\-–×x:/\s]+$/i.test(value)) errors.push(`${path}: isi dengan angka singkat, misalnya 60, 3x, atau 80%.`);
        texts.push({ path, text: value, slide: si, onSlide: onSlide && !spec.meta });
        return;
      }
      case 'enum': if (!spec.values.includes(value)) errors.push(`${path}: "${value}" tidak tersedia. Pilihan: ${spec.values.join(', ')}.`); return;
      case 'bool': if (typeof value !== 'boolean') errors.push(`${path} harus true atau false.`); return;
      case 'number': if (!Number.isInteger(value) || value < spec.min || value > spec.max) errors.push(`${path}: angka bulat ${spec.min} sampai ${spec.max}.`); return;
      case 'art': if (!ART[value]) errors.push(`${path}: ilustrasi "${value}" tidak ada di katalog. Pilihan: ${Object.keys(ART).join(', ')}.`); return;
      case 'media': {
        if (typeof value !== 'object' || Array.isArray(value)) { errors.push(`${path} harus objek { "src": "nama-berkas.jpg", "alt": "isi fotonya" }.`); return; }
        for (const k of Object.keys(value)) if (!MEDIA_KEYS.includes(k)) errors.push(`${path}.${k} tidak dikenal. Media berisi ${MEDIA_KEYS.join(', ')}.`);
        const src = value.src, kind = kindOf(src);
        if (typeof src !== 'string' || !MEDIA_FILE.test(src) || !kind) errors.push(`${path}.src: nama berkas di posts/<slug>/media/ tanpa folder, misalnya "anak-memanjat.jpg". Format: ${Object.keys(MEDIA_TYPES).join(', ')}.`);
        else if (!spec.kinds.includes(kind)) errors.push(`${path}.src: tempat ini hanya untuk ${spec.kinds.includes('image') ? 'foto' : 'video'}.`);
        if (typeof value.alt !== 'string' || !value.alt.trim()) errors.push(`${path}.alt wajib: satu kalimat tentang isi foto atau videonya. Dipakai pembaca layar dan sebagai pengingat berkas yang perlu dipasang.`);
        else if (value.alt.length > 120) errors.push(`${path}.alt: ${value.alt.length} karakter, maksimal 120.`);
        else texts.push({ path: `${path}.alt`, text: value.alt, slide: si, onSlide: false });
        if (value.focus !== undefined && !FOCUS.includes(value.focus)) errors.push(`${path}.focus: "${value.focus}" tidak tersedia. Pilihan: ${FOCUS.join(', ')} (bagian yang dipertahankan saat dipotong).`);
        if (value.still !== undefined && (kind !== 'video' || typeof value.still !== 'number' || value.still < 0 || value.still > 60)) errors.push(`${path}.still: detik video yang dipakai untuk PNG dan pratinjau, 0 sampai 60, hanya untuk video.`);
        if (kind && typeof src === 'string') medias.push({ path, src, kind });
        return;
      }
      case 'icon': if (!icons[value]) errors.push(`${path}: ikon "${value}" tidak ada di katalog. Lihat references/components.md.`); return;
      case 'list': {
        if (!Array.isArray(value)) { errors.push(`${path} harus daftar.`); return; }
        if (value.length < spec.min || value.length > spec.max) errors.push(`${path}: ${value.length} butir, harus ${spec.min === spec.max ? spec.min : `${spec.min} sampai ${spec.max}`}.`);
        value.forEach((v, k) => check(`${path}[${k}]`, spec.item, v, si, onSlide));
        return;
      }
      case 'object': {
        if (typeof value !== 'object' || Array.isArray(value)) { errors.push(`${path} harus objek.`); return; }
        for (const k of Object.keys(value)) if (!spec.fields[k]) errors.push(`${path}.${k} tidak dikenal.`);
        for (const [k, f] of Object.entries(spec.fields)) check(`${path}.${k}`, f, value[k], si, onSlide);
        return;
      }
    }
  }

  /* One slide: its keys, the fields of its component, and the component's own rules. `si` tags its texts. */
  function scanSlide(s, at, si) {
    if (typeof s !== 'object' || !s) { errors.push(`${at} harus objek.`); return; }
    const comp = COMPONENTS[s.component];
    if (CUSTOM_ISSUES[s.component]) errors.push(`${at}: ${CUSTOM_ISSUES[s.component]}`);
    for (const [k, spec] of Object.entries(SLIDE_KEYS)) check(`${at}.${k}`, spec, s[k], si, true);
    if (!comp) return;
    if (comp.custom && !unchecked.includes(s.component)) { const p = passOf(s.component); if (!p.ok) errors.push(`${at}: ${p.why}`); }
    for (const k of Object.keys(s)) if (!SLIDE_KEYS[k] && !comp.keys[k]) errors.push(`${at}.${k} tidak dikenal untuk komponen ${s.component}. Gaya, warna, dan posisi diatur engine, bukan post.json.`);
    /* A field drawn by some variants only (`for`): rejected elsewhere, required (when marked) inside them */
    const v = comp.keys.variant ? s.variant || comp.keys.variant.default : null;
    const used = spec => !spec.for || spec.for.includes(v);
    for (const [k, spec] of Object.entries(comp.keys)) {
      if (used(spec)) check(`${at}.${k}`, spec, s[k], si, true);
      else if (s[k] !== undefined && s[k] !== spec.default) errors.push(`${at}.${k} hanya dipakai varian ${spec.for.join(', ')}. Hapus field ini atau ganti varian.`);
    }
    for (const [k, spec] of Object.entries(comp.keys)) {
      if (!spec.within || !used(spec) || typeof s[k] !== 'string' || typeof s[spec.within] !== 'string') continue;
      if (!s[spec.within].includes(s[k])) errors.push(`${at}.${k}: "${s[k]}" tidak ditemukan di ${spec.within}. Salin frasanya persis.`);
      else if (findPhrase(s[spec.within], s[k]) < 0) errors.push(`${at}.${k}: "${s[k]}" harus kata utuh dari ${spec.within}, bukan potongan kata.`);
    }
    if (comp.validate) comp.validate(s).forEach(e => errors.push(`${at}: ${e}`));
    if (s.art && s.character && s.character !== 'none') errors.push(`${at}: pilih karakter atau ilustrasi (art), tidak keduanya.`);
    /* Every slide shows a picture: a diagram, chart, photo, icon row, character, or an illustration in art */
    if (!layoutOnly && rules.visualEverySlide && !hasVisual(s)) errors.push(`${at}: slide ini hanya teks. Tambahkan ilustrasi yang mendukung isinya di "art" (misalnya "clock" untuk menit, "run" untuk aktif bergerak), atau pakai komponen bergambar (diagram, grafik, ikon, foto). Lihat bagian Ilustrasi di references/components.md.`);
  }
  slides.forEach((s, i) => scanSlide(s, `slides[${i}]`, i));

  /* Alternatives for the first and the last slide, picked in the studio: other hooks (covers) and other
     calls to action (closings). Each one is a full opening or closing slide. */
  const layoutOf = s => (s && COMPONENTS[s.component] ? `${s.component}${COMPONENTS[s.component].keys.variant ? `/${s.variant || COMPONENTS[s.component].keys.variant.default}` : ''}` : '');
  const ALTS = [
    { key: 'covers', tag: 'c', role: 'open', max: 14, list: OPENERS, kind: 'pembuka', at: 0, why: 'Alternatif cover lebih berguna bila jenis hook-nya berbeda.' },
    { key: 'closings', tag: 'z', role: 'close', max: 6, list: CLOSERS, kind: 'penutup', at: slides.length - 1, why: 'Alternatif penutup lebih berguna bila jenis ajakannya berbeda.' },
  ];
  const alts = {};
  for (const a of ALTS) {
    const arr = post[a.key] === undefined ? [] : Array.isArray(post[a.key]) ? post[a.key] : (errors.push(`${a.key} harus daftar slide ${a.kind}.`), []);
    alts[a.key] = arr;
    if (arr.length > a.max) errors.push(`${a.key} berisi ${arr.length} alternatif, maksimal ${a.max} (bersama slide aslinya jadi ${a.max + 1} pilihan).`);
    arr.forEach((s, k) => {
      scanSlide(s, `${a.key}[${k}]`, `${a.tag}${k}`);
      if (s && COMPONENTS[s.component] && roleOf(s.component) !== a.role) errors.push(`${a.key}[${k}]: ${s.component} bukan komponen ${a.kind} (${a.list.join(', ')}).`);
    });
    const seen = new Map(), base = `slides[${Math.max(0, a.at)}]`;
    [slides[a.at], ...arr].forEach((s, k) => {
      const l = layoutOf(s);
      if (!l) return;
      if (seen.has(l)) warnings.push(`${k ? `${a.key}[${k - 1}]` : base} memakai tata letak ${l}, sama dengan ${seen.get(l)}. ${a.why}`);
      else seen.set(l, k ? `${a.key}[${k - 1}]` : base);
    });
  }
  const covers = alts.covers, closings = alts.closings;

  if (slides.length) {
    if (roleOf(slides[0].component) !== 'open') errors.push(`Slide pertama harus komponen pembuka (${OPENERS.join(' atau ')}).`);
    if (roleOf(slides[slides.length - 1].component) !== 'close') errors.push(`Slide terakhir harus komponen penutup (${CLOSERS.join(' atau ')}).`);
    slides.forEach((s, i) => {
      if (i > 0 && roleOf(s.component) === 'open') errors.push(`slides[${i}]: ${s.component} adalah pembuka, hanya boleh di slide pertama.`);
      if (i < slides.length - 1 && roleOf(s.component) === 'close') errors.push(`slides[${i}]: ${s.component} adalah penutup, hanya boleh di slide terakhir.`);
    });
  }

  for (const t of texts) {
    if (PLACEHOLDER.test(t.text)) errors.push(`${t.path} masih berisi teks sementara: "${t.text}".`);
    if (rules.noExclamation && t.text.includes('!')) errors.push(`${t.path}: hapus tanda seru.`);
    if (rules.noEmDash && /[—–]/.test(t.text)) errors.push(`${t.path}: ganti tanda pisah panjang dengan titik, koma, atau tanda hubung biasa.`);
    const tap = t.text.match(TAP_WORDS);
    if (tap && t.onSlide) errors.push(`${t.path}: "${tap[1]}" mengajak pembaca menyentuh gambar. Postingan Instagram hanya bisa digeser; tulis isinya langsung.`);
    for (const p of rules.bannedPhrases || []) if (t.text.toLowerCase().includes(String(p).toLowerCase())) errors.push(`${t.path}: frasa "${p}" dilarang oleh akun ${brand.name}.`);
    if (/\b[A-Z]{4,}\b/.test(t.text) && t.onSlide) warnings.push(`${t.path}: hindari kata huruf kapital semua; hierarki dari ukuran dan bobot.`);
  }

  /* Forced contrast: slogan lines like "X, bukan Y" on several slides make every point sound like a tagline. */
  const CONTRAST = /,\s*(?:bukan|not)\b|\b(?:bukan|not)\s+(?:hanya|sekadar|cuma|berarti|just|only)\b/i;
  const contrastSlides = [...new Set(texts.filter(t => t.onSlide && typeof t.slide === 'number' && CONTRAST.test(t.text)).map(t => t.slide))];
  if (contrastSlides.length >= 2) warnings.push(`Pola kontras "X, bukan Y" muncul di ${contrastSlides.length} slide (${contrastSlides.map(i => i + 1).join(', ')}). Pertahankan satu yang paling penting; di slide lain sampaikan poinnya langsung.`);

  const wordsOf = si => texts.filter(t => t.slide === si && t.onSlide && !/\.(name|goal)$/.test(t.path)).reduce((n, t) => n + countWords(t.text), 0);
  const wordsBySlide = slides.map((s, i) => wordsOf(i)), wordsByCover = covers.map((s, k) => wordsOf(`c${k}`)), wordsByClosing = closings.map((s, k) => wordsOf(`z${k}`));
  wordsBySlide.forEach((w, i) => { if (w > rules.maxWordsPerSlide) errors.push(`slides[${i}] berisi ${w} kata, maksimal ${rules.maxWordsPerSlide}.`); });
  wordsByCover.forEach((w, k) => { if (w > rules.maxWordsPerSlide) errors.push(`covers[${k}] berisi ${w} kata, maksimal ${rules.maxWordsPerSlide}.`); });
  wordsByClosing.forEach((w, k) => { if (w > rules.maxWordsPerSlide) errors.push(`closings[${k}] berisi ${w} kata, maksimal ${rules.maxWordsPerSlide}.`); });

  /* Media files: present (a missing one draws an empty frame), within the size limits */
  if (mediaDir) {
    let total = 0;
    const counted = new Set();
    for (const m of medias) {
      if (!MEDIA_FILE.test(m.src)) continue;
      const p = join(mediaDir, m.src);
      if (!existsSync(p) || !statSync(p).isFile()) { warnings.push(`${m.path}: berkas media/${m.src} belum ada. Slide ini memakai bingkai kosong sampai berkasnya ditaruh di posts/${post.slug}/media/.`); continue; }
      const size = statSync(p).size;
      if (size > MEDIA_MAX[m.kind]) errors.push(`${m.path}: media/${m.src} ${MB(size)} MB, maksimal ${MB(MEDIA_MAX[m.kind])} MB untuk ${m.kind === 'video' ? 'video' : 'foto'}. ${m.kind === 'video' ? 'Potong videonya (5 sampai 15 detik) atau kecilkan resolusinya ke 1080 px.' : 'Kecilkan ke sekitar 2000 px di sisi panjang.'}`);
      else if (m.kind === 'image' && size > MEDIA_MAX.imageWarn) warnings.push(`${m.path}: media/${m.src} ${MB(size)} MB. Foto sekitar 2000 px di sisi panjang (di bawah 1,5 MB) membuat halaman lebih ringan.`);
      if (!counted.has(m.src)) { counted.add(m.src); total += size; }
    }
    if (total > MEDIA_MAX.total) errors.push(`Semua media berjumlah ${MB(total)} MB, maksimal ${MB(MEDIA_MAX.total)} MB per postingan. Kecilkan foto atau pendekkan video.`);
  }

  /* Leaving slides out of the account's structure is fine; reordering the ones that are in it is worth a look */
  if (Array.isArray(brand.structure) && brand.structure.length) {
    const known = slides.map(s => brand.structure.indexOf(s.name)).filter(k => k >= 0);
    if (known.some((k, i) => i > 0 && k < known[i - 1])) warnings.push(`Urutan slide berbeda dari struktur akun (${brand.structure.join(', ')}). Boleh, asal disengaja.`);
  }
  for (let i = 2; i < slides.length; i++) {
    if (slides[i].theme && slides[i].theme === slides[i - 1].theme && slides[i].theme === slides[i - 2].theme) warnings.push(`slides[${i - 2}] sampai slides[${i}] bertema sama berturut-turut. Selang-seling terang dan gelap membantu ritme.`);
  }
  return { errors, warnings, wordsBySlide, wordsByCover, wordsByClosing, fields, medias };
}
