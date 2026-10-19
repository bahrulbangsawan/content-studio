// Static scan of a reel.json: schema of every scene, the account's writing rules, evidence (every number and
// claim of research names a source with a DOI, PMID or link), pictures on every scene, files, and length.
// The in-page checks (zone, sizes, overlap, broken words, text on photos) run later in reel.mjs verify.
import { existsSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SCENES, SCENE_KEYS, TRANSITIONS, sceneVisual } from './reel-scenes.mjs';
import { ART } from './art.mjs';
import { countWords } from './common.mjs';
import { findPhrase } from './kit.mjs';
import { MEDIA_FILE, kindOf } from './media.mjs';
import { spoken, voWords } from './reel-time.mjs';
import { createHash } from 'node:crypto';
/* Same key as reel-render.mjs voKey (kept here to avoid a circular import) */
const voKeyOf = s => createHash('sha256').update(JSON.stringify([String(s.vo || '').trim(), String(s.tone || '').trim()])).digest('hex').slice(0, 16);

const POST_KEYS = ['brand', 'slug', 'title', 'format', 'caption', 'voice', 'captions', 'music', 'sources', 'scenes', 'hooks', 'closings'];
const SOURCE_KEYS = ['id', 'cite', 'short', 'doi', 'pmid', 'url', 'year', 'note', 'verified', 'design'];
const VOICE_KEYS = ['provider', 'voice', 'style', 'model', 'language', 'pronounce'];
const MEDIA_KEYS = ['src', 'alt', 'focus', 'from', 'move', 'still'];
const PLACEHOLDER = /\bTODO\b|lorem ipsum|\[[^\]]{2,}\]|\bxxx\b/i;
/* A claim of research or a figure in the voice or on screen needs a source on that scene */
const CLAIM = /\b(penelitian|studi|riset|menurut|terbukti|data menunjukkan|meta-?analisis|tinjauan sistematis|research|study|studies|evidence)\b|\d+(?:[.,]\d+)?\s*(%|persen|kali lipat)/i;
export const REEL_MEDIA_MAX = { image: 6 * 1024 * 1024, video: 25 * 1024 * 1024, audio: 12 * 1024 * 1024, total: 90 * 1024 * 1024 };
export const AUDIO_TYPES = { mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav', ogg: 'audio/ogg' };
const MB = n => (n / 1024 / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 });

/** `rules` are the account's video rules (videoRulesOf in brand.mjs), not the carousel's. */
export function scanReel(reel, brand, rules, icons, { mediaDir = null, audio = null } = {}) {
  const errors = [], warnings = [], texts = [], medias = [];
  for (const k of Object.keys(reel)) if (!POST_KEYS.includes(k)) errors.push(`Kunci tidak dikenal "${k}". reel.json hanya berisi isi video, bukan gaya atau tata letak.`);
  if (reel.brand !== brand.id) errors.push(`brand "${reel.brand}" tidak cocok dengan akun "${brand.id}".`);
  if (!/^[a-z0-9][a-z0-9-]{2,59}$/.test(reel.slug || '')) errors.push('slug wajib: huruf kecil, angka, tanda hubung, 3 sampai 60 karakter.');
  if (!reel.title || String(reel.title).length > 80) errors.push('title wajib, maksimal 80 karakter.');
  if (reel.caption !== undefined && (typeof reel.caption !== 'string' || reel.caption.length > 2200)) errors.push('caption: teks posting Instagram, maksimal 2.200 karakter.');
  if (reel.captions !== undefined && typeof reel.captions !== 'boolean') errors.push('captions harus true atau false (subtitle di video).');

  /* Voice settings */
  const v = reel.voice;
  if (v !== undefined) {
    if (typeof v !== 'object' || Array.isArray(v)) errors.push('voice harus objek { "provider": "gemini", "voice": "Sulafat", "style": "hangat, tenang" }.');
    else {
      for (const k of Object.keys(v)) if (!VOICE_KEYS.includes(k)) errors.push(`voice.${k} tidak dikenal. Pilihan: ${VOICE_KEYS.join(', ')}.`);
      if (v.provider && !['gemini', 'say', 'none'].includes(v.provider)) errors.push('voice.provider: gemini, say (suara Mac untuk pratinjau), atau none.');
      if (v.style && String(v.style).length > 240) errors.push('voice.style maksimal 240 karakter. Gaya singkat bekerja paling baik.');
      if (v.pronounce !== undefined && (typeof v.pronounce !== 'object' || Array.isArray(v.pronounce) || Object.values(v.pronounce).some(x => typeof x !== 'string'))) errors.push('voice.pronounce harus objek { "W-sitting": "double-u sitting" }: cara suara mengucapkan kata itu.');
    }
  }

  /* Sources */
  const sources = Array.isArray(reel.sources) ? reel.sources : [];
  if (reel.sources !== undefined && !Array.isArray(reel.sources)) errors.push('sources harus daftar sumber.');
  const ids = new Set(), used = new Set();
  sources.forEach((s, k) => {
    const p = `sources[${k}]`;
    if (!s || typeof s !== 'object') { errors.push(`${p} harus objek.`); return; }
    for (const key of Object.keys(s)) if (!SOURCE_KEYS.includes(key)) errors.push(`${p}.${key} tidak dikenal. Pilihan: ${SOURCE_KEYS.join(', ')}.`);
    if (!/^[a-z0-9][a-z0-9-]{0,20}$/.test(s.id || '')) errors.push(`${p}.id wajib, misalnya "s1".`);
    else if (ids.has(s.id)) errors.push(`${p}.id "${s.id}" dipakai dua kali.`);
    else ids.add(s.id);
    if (!s.short || String(s.short).length > 40) errors.push(`${p}.short wajib, maksimal 40 karakter, misalnya "Kim dkk., 2019". Tampil di video.`);
    if (!s.cite || String(s.cite).length > 400) errors.push(`${p}.cite wajib: sitasi lengkap (penulis, tahun, judul, jurnal). Tampil di caption.`);
    if (!s.doi && !s.pmid && !s.url) errors.push(`${p}: isi doi, pmid, atau url supaya sumbernya bisa dicek. Cari dengan: content-studio evidence search "<topik>".`);
    if (s.doi && !/^10\.\d{4,9}\/\S+$/.test(s.doi)) errors.push(`${p}.doi "${s.doi}" bukan DOI (contoh: 10.1002/14651858.CD009790.pub2), tanpa https://doi.org/.`);
    if (s.pmid && !/^\d{4,9}$/.test(String(s.pmid))) errors.push(`${p}.pmid harus angka PubMed.`);
    if (s.url && !/^https:\/\/\S+$/.test(s.url)) errors.push(`${p}.url harus diawali https://.`);
    if (s.year !== undefined && !(Number.isInteger(s.year) && s.year > 1900 && s.year < 2100)) errors.push(`${p}.year harus tahun, misalnya 2021.`);
    if (!s.verified && (s.doi || s.pmid)) warnings.push(`${p} (${s.short || s.id}) belum diverifikasi. Jalankan: content-studio evidence verify ${reel.slug}`);
  });

  /* Music */
  if (reel.music !== undefined) {
    const m = reel.music;
    if (!m || typeof m !== 'object' || !m.src) errors.push('music harus objek { "src": "musik.mp3", "volume": 0.12 }.');
    else {
      const ext = String(m.src).toLowerCase().split('.').pop();
      if (!MEDIA_FILE.test(m.src) || !AUDIO_TYPES[ext]) errors.push(`music.src "${m.src}": berkas mp3, m4a, aac, wav, atau ogg di posts/${reel.slug}/media/.`);
      if (m.volume !== undefined && !(typeof m.volume === 'number' && m.volume >= 0.02 && m.volume <= 0.4)) errors.push('music.volume 0,02 sampai 0,4 (musik di bawah suara).');
      if (mediaDir && !existsSync(join(mediaDir, m.src))) errors.push(`music.src: berkas tidak ada di posts/${reel.slug}/media/${m.src}`);
    }
  }

  /* Scenes */
  const scenes = Array.isArray(reel.scenes) ? reel.scenes : [];
  if (scenes.length < 3 || scenes.length > 24) errors.push(`Jumlah adegan ${scenes.length}. Reel berisi 3 sampai 24 adegan.`);
  const check = (path, spec, value, s) => {
    if (spec.for && !spec.for.includes(s.variant || (SCENES[s.type].keys.variant || {}).default)) {
      if (value !== undefined) errors.push(`${path}: hanya dipakai varian ${spec.for.join(', ')}.`);
      return;
    }
    if (value === undefined || value === null || value === '') { if (spec.required) errors.push(`${path} wajib diisi.`); return; }
    switch (spec.type) {
      case 'text': {
        if (typeof value !== 'string') { errors.push(`${path} harus teks.`); return; }
        const w = countWords(value), max = typeof spec.words === 'string' ? rules[spec.words] : spec.words;
        if (max && w > max) errors.push(`${path}: ${w} kata, maksimal ${max}. Teks di layar dibaca sambil mendengar: persingkat.`);
        if (spec.chars && value.length > spec.chars) errors.push(`${path}: ${value.length} karakter, maksimal ${spec.chars}.`);
        const long = spec.wordChars && value.split(/\s+/).find(x => x.replace(/[^\p{L}\p{N}]/gu, '').length > spec.wordChars);
        if (long) errors.push(`${path}: kata "${long}" terlalu panjang untuk kotaknya (maksimal ${spec.wordChars} huruf). Pakai kata yang lebih pendek.`);
        if (spec.numeral && !/^[\d.,%+\-–×x:/\s]+$|^\d+\s+(dari|of)\s+\d+$/i.test(value)) errors.push(`${path}: angka singkat, misalnya 73%, 2,5, 1.200, atau 6 dari 10.`);
        if (spec.within) { const src = s[spec.within]; if (src && findPhrase(src, value) < 0) errors.push(`${path}: "${value}" harus kata yang persis ada di ${spec.within}.`); }
        texts.push({ path, text: value, onScreen: true });
        return;
      }
      case 'enum': if (!spec.values.includes(value)) errors.push(`${path}: "${value}" tidak tersedia. Pilihan: ${spec.values.join(', ')}.`); return;
      case 'bool': if (typeof value !== 'boolean') errors.push(`${path} harus true atau false.`); return;
      case 'number': if (!Number.isInteger(value) || value < spec.min || value > spec.max) errors.push(`${path}: angka bulat ${spec.min} sampai ${spec.max}.`); return;
      case 'icon': if (!icons[value]) errors.push(`${path}: ikon "${value}" tidak ada di katalog.`); return;
      case 'art': if (!ART[value]) errors.push(`${path}: ilustrasi "${value}" tidak ada. Pilihan: ${Object.keys(ART).join(', ')}.`); return;
      case 'source': {
        const list = [].concat(value);
        if (!list.length || list.some(x => typeof x !== 'string')) { errors.push(`${path}: id sumber, misalnya "s1" atau ["s1", "s2"].`); return; }
        for (const id of list) { if (!ids.has(id)) errors.push(`${path}: sumber "${id}" tidak ada di sources.`); used.add(id); }
        return;
      }
      case 'media': {
        if (typeof value !== 'object' || Array.isArray(value)) { errors.push(`${path} harus objek { "src": "klip.mp4", "alt": "isi gambarnya" }.`); return; }
        for (const k of Object.keys(value)) if (!MEDIA_KEYS.includes(k)) errors.push(`${path}.${k} tidak dikenal. Pilihan: ${MEDIA_KEYS.join(', ')}.`);
        const kind = kindOf(value.src);
        if (!MEDIA_FILE.test(value.src || '') || !kind) { errors.push(`${path}.src: nama berkas jpg, png, webp, mp4, atau webm di posts/${reel.slug}/media/.`); return; }
        if (!value.alt || String(value.alt).length > 140) errors.push(`${path}.alt wajib: apa yang terlihat, maksimal 140 karakter.`);
        if (value.from !== undefined && !(typeof value.from === 'number' && value.from >= 0 && value.from < 600)) errors.push(`${path}.from: detik awal video, misalnya 2.5.`);
        if (value.move !== undefined && !['in', 'out', 'left', 'right'].includes(value.move)) errors.push(`${path}.move: in, out, left, atau right.`);
        if (spec.kinds && !spec.kinds.includes(kind)) errors.push(`${path}: tata letak ini butuh ${spec.kinds.join(' atau ')}.`);
        medias.push({ path, src: value.src, kind });
        return;
      }
      case 'list': {
        if (!Array.isArray(value)) { errors.push(`${path} harus daftar.`); return; }
        if (value.length < spec.min || value.length > spec.max) errors.push(`${path}: ${value.length} butir, ${spec.min} sampai ${spec.max}.`);
        value.forEach((x, k) => check(`${path}[${k}]`, { ...spec.item, required: true }, x, s));
        return;
      }
      case 'object': {
        if (typeof value !== 'object' || Array.isArray(value)) { errors.push(`${path} harus objek.`); return; }
        for (const k of Object.keys(value)) if (!(k in spec.fields)) errors.push(`${path}.${k} tidak dikenal. Pilihan: ${Object.keys(spec.fields).join(', ')}.`);
        for (const [k, f] of Object.entries(spec.fields)) check(`${path}.${k}`, f, value[k], s);
        return;
      }
      default: return;
    }
  };
  const scanScene = (s, path, role) => {
    if (!s || typeof s !== 'object') { errors.push(`${path} harus objek adegan.`); return; }
    const def = SCENES[s.type];
    if (!def) { errors.push(`${path}.type "${s.type}" tidak ada. Pilihan: ${Object.keys(SCENES).join(', ')}.`); return; }
    if (role === 'open' && def.role !== 'open') errors.push(`${path}: adegan pertama harus type "hook".`);
    if (role === 'close' && def.role !== 'close') errors.push(`${path}: adegan terakhir harus type "closing".`);
    if (role === 'mid' && def.role) errors.push(`${path}: "${s.type}" hanya untuk adegan ${def.role === 'open' ? 'pertama' : 'terakhir'}.`);
    for (const k of Object.keys(s)) if (!SCENE_KEYS.includes(k) && !(k in def.keys)) errors.push(`${path}.${k} tidak dikenal untuk ${s.type}. Pilihan: ${[...SCENE_KEYS, ...Object.keys(def.keys)].join(', ')}.`);
    for (const [k, spec] of Object.entries(def.keys)) check(`${path}.${k}`, spec, s[k], s);
    if (def.validate) for (const m of def.validate(s, countWords)) errors.push(`${path}.${m}`);
    if (s.theme !== undefined && !['light', 'dark'].includes(s.theme)) errors.push(`${path}.theme: light atau dark.`);
    if (s.transition !== undefined && !TRANSITIONS.includes(s.transition)) errors.push(`${path}.transition: ${TRANSITIONS.join(', ')}.`);
    if (s.duration !== undefined && !(typeof s.duration === 'number' && s.duration >= 1.6 && s.duration <= 12)) errors.push(`${path}.duration: 1,6 sampai 12 detik. Biasanya tidak perlu: durasi mengikuti voice over.`);
    if (s.captions !== undefined && typeof s.captions !== 'boolean') errors.push(`${path}.captions harus true atau false.`);
    if (s.name !== undefined && (typeof s.name !== 'string' || s.name.length > 40)) errors.push(`${path}.name maksimal 40 karakter.`);
    if (s.tone !== undefined && (typeof s.tone !== 'string' || s.tone.length > 120)) errors.push(`${path}.tone: arahan suara untuk adegan ini, maksimal 120 karakter.`);
    if (s.vo === undefined || s.vo === '') warnings.push(`${path}: tanpa voice over. Adegan ini sunyi; durasinya ${s.duration ? s.duration + ' detik' : 'bawaan'}.`);
    else if (typeof s.vo !== 'string') errors.push(`${path}.vo harus teks.`);
    else {
      const w = voWords(s.vo).length;
      if (w > def.vo) errors.push(`${path}.vo: ${w} kata, maksimal ${def.vo} untuk ${def.label.toLowerCase()} (sekitar ${Math.round(def.vo / 2.3)} detik). Pecah ke adegan berikutnya.`);
      /* Length of the opening: the recorded clip when there is one, else an estimate */
      const hc = audio && audio.clips && audio.clips[voKeyOf(s)], sec = hc && hc.map ? hc.map.end : w / 2.3;
      if (role === 'open' && sec > rules.hookMaxSeconds) warnings.push(`${path}.vo: ${w} kata, ${hc ? '' : 'sekitar '}${sec.toFixed(1).replace('.', ',')} detik. Pembuka akun ini selesai dalam ${rules.hookMaxSeconds} detik (videoRules.hookMaxSeconds).`);
      texts.push({ path: `${path}.vo`, text: spoken(s.vo), onScreen: false });
      /* Pace of the recorded clip, when there is one */
      const clip = audio && audio.clips && audio.clips[voKeyOf(s)];
      if (clip && clip.map && clip.map.end - clip.map.start > 0.5) {
        const wps = w / (clip.map.end - clip.map.start);
        if (wps > rules.maxWordsPerSecond) warnings.push(`${path}.vo: suaranya ${wps.toFixed(1).replace('.', ',')} kata per detik, batas akun ${String(rules.maxWordsPerSecond).replace('.', ',')}. Persingkat kalimatnya atau minta tempo lebih pelan di voice.style.`);
      }
    }
    if (!sceneVisual(s)) errors.push(`${path}: tidak ada gambar. Isi "art" (ilustrasi) atau "media" (footage atau foto). Video tanpa gambar hanya teks di layar.`);
    const claimText = [s.vo, s.title, s.label, s.body, s.finding, s.fact].filter(Boolean).join(' ');
    const claims = CLAIM.test(spoken(claimText));
    if (claims && def.keys.source && !s.source && !def.keys.source.required) warnings.push(`${path}: menyebut penelitian atau angka tanpa "source". Tambahkan sumbernya, atau ubah kalimatnya bila bukan klaim.`);
    if (claims && !def.keys.source && s.type !== 'closing') warnings.push(`${path}: menyebut penelitian atau angka, tapi ${s.type} tidak menampilkan sumber. Pakai stat, evidence, atau statement dengan source.`);
  };
  scenes.forEach((s, k) => scanScene(s, `scenes[${k}]`, k === 0 ? 'open' : k === scenes.length - 1 ? 'close' : 'mid'));
  for (const [key, role, max] of [['hooks', 'open', 13], ['closings', 'close', 5]]) {
    const list = reel[key];
    if (list === undefined) continue;
    if (!Array.isArray(list) || list.length > max) { errors.push(`${key}: daftar adegan alternatif, maksimal ${max}.`); continue; }
    list.forEach((s, k) => scanScene(s, `${key}[${k}]`, role));
  }
  if ((reel.hooks || []).length < 2) warnings.push(`Pilihan pembuka ${(reel.hooks || []).length + 1}. Detik pertama menentukan apakah video ditonton: tulis 2 sampai 4 "hooks" dengan jenis berbeda (pertanyaan, angka, mitos, footage).`);

  /* Writing rules over every text, on screen and spoken */
  for (const t of texts) {
    if (rules.noExclamation && /!/.test(t.text)) errors.push(`${t.path}: tanda seru tidak dipakai di akun ini.`);
    if (rules.noEmDash && /—/.test(t.text)) errors.push(`${t.path}: tanda pisah panjang (—) tidak dipakai. Pakai koma atau titik.`);
    if (PLACEHOLDER.test(t.text)) errors.push(`${t.path}: masih berisi placeholder.`);
    for (const ph of rules.bannedPhrases || []) if (t.text.toLowerCase().includes(ph.toLowerCase())) errors.push(`${t.path}: frasa "${ph}" dilarang di akun ini.`);
  }
  for (const id of ids) if (!used.has(id)) warnings.push(`Sumber "${id}" tidak dipakai di adegan mana pun.`);

  /* Rhythm and variety */
  const all = scenes.filter(s => s && SCENES[s.type]);
  for (let k = 1; k < all.length; k++) {
    if (all[k].type === all[k - 1].type && (all[k].variant || '') === (all[k - 1].variant || '')) warnings.push(`scenes[${k - 1}] dan scenes[${k}] sama-sama ${all[k].type}${all[k].variant ? ' ' + all[k].variant : ''}. Ganti jenis atau varian supaya ritmenya hidup.`);
  }
  let run = 1;
  for (let k = 1; k < all.length; k++) { run = (all[k].theme || 'light') === (all[k - 1].theme || 'light') ? run + 1 : 1; if (run === 4) warnings.push(`Empat adegan berturut-turut ${all[k].theme === 'dark' ? 'gelap' : 'terang'} sampai scenes[${k}]. Selang-seling theme.`); }

  /* Files */
  if (mediaDir) {
    let total = 0;
    for (const m of [...new Map(medias.map(m => [m.src, m])).values()]) {
      const p = join(mediaDir, m.src);
      if (!existsSync(p) || !statSync(p).isFile()) { errors.push(`${m.path}.src: berkas tidak ada di posts/${reel.slug}/media/${m.src}. Unduh footage dengan: content-studio footage get`); continue; }
      const size = statSync(p).size;
      total += size;
      if (size > REEL_MEDIA_MAX[m.kind]) errors.push(`${m.path}.src: ${MB(size)} MB, maksimal ${MB(REEL_MEDIA_MAX[m.kind])} MB. Perkecil dengan: content-studio footage fit ${reel.slug} ${m.src}`);
    }
    if (total > REEL_MEDIA_MAX.total) errors.push(`Total foto dan video ${MB(total)} MB, maksimal ${MB(REEL_MEDIA_MAX.total)} MB.`);
  }
  return { errors, warnings, medias, texts, sourcesUsed: [...used] };
}

/** Credits for stock footage and photos, from posts/<slug>/media/credits.json (written by footage.mjs): { src: line }. */
export function readCredits(mediaDir, srcs) {
  const p = join(mediaDir, 'credits.json');
  if (!existsSync(p)) return {};
  let c = {};
  try { c = JSON.parse(readFileSync(p, 'utf8')); } catch (e) { return {}; }
  return Object.fromEntries([...new Set(srcs)].filter(s => c[s]).map(s => [s, c[s].line || `${c[s].provider}: ${c[s].title || c[s].id}${c[s].author ? ` oleh ${c[s].author}` : ''}${c[s].url ? ` (${c[s].url})` : ''}`]));
}
