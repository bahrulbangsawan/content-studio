// The only slide components a post may use. Every field, limit and choice lives here, so a post
// cannot carry layout, colour or CSS of its own. Character limits are sized to the 888 x 1014 content zone.
// `role` marks the opening (first slide) and closing (last slide) components. `variant` picks one of a
// fixed set of layouts drawn by the engine; `motion` (on any slide) picks an entrance preset from motion.mjs.
import { MOTION_NAMES } from './motion.mjs';
import { title, text, numeral, phrase, variant, only, list, obj, budget, longWords, icon, bool, num, media, choice, art } from './kit.mjs';
import { countWords } from './common.mjs';
import { CUSTOM, CUSTOM_ISSUES } from './custom.mjs';

const SIGNS = ['≠', '→', '+', '=', 'vs'];

export const COMPONENTS = {
  cover: {
    label: 'Cover',
    role: 'open',
    visual: 'Judul besar dengan satu penekanan, lalu satu kalimat pendukung',
    goal: 'Masalah yang dikenali pembaca, dalam satu kalimat.',
    spec: 'Judul 104/110 (92 sampai 84 di kartu dan stabilo), kalimat 34/42 di bawah judul',
    rule: 'Hanya di slide pertama. Satu kalimat masalah. Pilih varian dari jenis hook-nya.',
    /* The cover is the hook. Each variant is a different way to stop the scroll; see references/components.md */
    variants: {
      underline: 'Rata tengah, kata terakhir bergaris gelombang',
      bottom: 'Rata kiri di bawah, ruang kosong di atas',
      poster: 'Satu kata per baris, kata terakhir beraksen',
      highlight: 'Frasa kunci distabilo',
      strike: 'Frasa yang keliru dicoret',
      circle: 'Frasa kunci dilingkari',
      fade: 'Judul diredupkan kecuali frasa kunci',
      card: 'Judul di kartu kontras',
      tags: 'Judul dengan deretan tanda yang dikenali',
      blank: 'Kalimat rumpang dengan garis kosong',
      quote: 'Kalimat yang sering terdengar, dalam tanda kutip',
    },
    motions: { bottom: 'rise', poster: 'typeset', highlight: 'wipe', strike: 'rise', circle: 'zoom', fade: 'typeset', card: 'unfold', tags: 'cascade', blank: 'rise', quote: 'slide' },
    keys: {
      variant: variant('underline', 'bottom', 'poster', 'highlight', 'strike', 'circle', 'fade', 'card', 'tags', 'blank', 'quote'),
      kicker: { type: 'text', words: 6, chars: 40 },
      title: title('coverTitleMax', 48),
      /* One line wide at 104 px, so a struck or circled phrase never wraps */
      focus: only({ ...phrase('title', 3, 14), required: true }, 'highlight', 'strike', 'circle', 'fade'),
      tags: only(list(2, 4, text(3, 18, true)), 'tags'),
      character: only({ type: 'enum', values: ['none', 'balance'], default: 'none' }, 'underline'),
      underline: only({ type: 'bool', default: true }, 'underline'),
    },
    validate(s) {
      const v = s.variant || 'underline', t = String(s.title || '').trim(), out = [];
      const n = t.split(/\s+/).filter(Boolean).length;
      if (v === 'poster' && n > 5) out.push(`title: varian poster menaruh satu kata per baris, maksimal 5 kata (sekarang ${n}).`);
      if (v === 'quote' && /["“”]/.test(t)) out.push('title: varian quote memasang tanda kutipnya sendiri. Tulis kalimatnya tanpa tanda kutip.');
      if (v === 'blank' && /[.,!?:;]$/.test(t)) out.push('title: varian blank diakhiri garis kosong. Hapus tanda baca di akhir judul.');
      return out;
    },
  },
  statement: {
    label: 'Pernyataan',
    visual: 'Judul dan satu paragraf',
    goal: 'Satu penjelasan singkat.',
    spec: 'Judul 84/92, isi 44/60',
    rule: 'Satu gagasan, tanpa daftar.',
    keys: { title: title(), body: { type: 'text', required: true, words: 35, chars: 220 } },
  },
  steps: {
    label: 'Jalur langkah',
    visual: 'Jalur langkah dengan titik berjalan',
    goal: 'Urutan sebab akibat atau proses.',
    spec: 'Kotak 520 px radius 20, nomor 72 px, 2 sampai 4 langkah',
    rule: 'Langkah benar-benar berurutan. Langkah terakhir memakai warna sorotan.',
    keys: { title: title(), steps: { type: 'list', required: true, min: 2, max: 4, item: { type: 'text', words: 4, chars: 24 } } },
  },
  venn: {
    label: 'Venn',
    visual: 'Diagram Venn dengan contoh tertulis',
    goal: 'Dua hal yang berbeda tetapi bekerja bersama.',
    spec: 'Lingkaran r 196, jarak pusat 304, catatan di gelembung bergaris tipis',
    rule: 'Irisan diberi nama, catatan menjelaskan irisan.',
    keys: {
      title: title('titleMax', 44),
      left: { type: 'object', required: true, fields: { label: { type: 'text', required: true, words: 1, chars: 10 }, sub: { type: 'text', required: true, words: 3, chars: 16 }, icon: { type: 'icon', required: true } } },
      right: { type: 'object', required: true, fields: { label: { type: 'text', required: true, words: 1, chars: 10 }, sub: { type: 'text', required: true, words: 3, chars: 16 }, icon: { type: 'icon', required: true } } },
      overlap: { type: 'text', required: true, words: 2, chars: 12 },
      note: { type: 'text', required: true, words: 12, chars: 80 },
    },
  },
  list: {
    label: 'Daftar',
    visual: 'Butir sejajar dipisah garis tipis',
    goal: 'Beberapa butir sejajar yang perlu diingat.',
    spec: 'Baris 80 px, penanda titik 14 px, 3 sampai 5 baris',
    rule: 'Butir sejajar memakai titik, bukan nomor. Tanpa kotak centang atau penghitung.',
    keys: {
      title: title(),
      items: { type: 'list', required: true, min: 3, max: 5, item: { type: 'text', words: 6, chars: 38 } },
      note: { type: 'text', words: 12, chars: 80 },
    },
  },
  tiles: {
    label: 'Tiga tindakan',
    visual: 'Tiga baris dengan ikon di samping judul',
    goal: 'Tiga tindakan kecil yang bisa dicoba.',
    spec: 'Ikon 64 px di samping judul 40/46 dan contoh 32/42',
    rule: 'Tepat tiga baris. Judul dan contoh selalu tampil bersamaan.',
    keys: {
      title: title(),
      tiles: { type: 'list', required: true, min: 3, max: 3, item: { type: 'object', fields: { icon: { type: 'icon', required: true }, title: { type: 'text', required: true, words: 5, chars: 26 }, text: { type: 'text', required: true, words: 7, chars: 40 } } } },
    },
  },
  closing: {
    label: 'Penutup',
    role: 'close',
    visual: 'Judul, kalimat pendukung, dan ajakan',
    goal: 'Ajakan dan disclaimer.',
    spec: 'Judul 104/110, ajakan 40/48, disclaimer otomatis di footer',
    rule: 'Hanya di slide terakhir. Ajakan berupa kalimat, bukan tombol.',
    keys: {
      title: title('coverTitleMax', 36),
      lede: { type: 'text', words: 8, chars: 44 },
      cta: { type: 'object', required: true, fields: { icon: { type: 'icon', required: true }, text: { type: 'text', required: true, words: 6, chars: 32 } } },
      character: { type: 'enum', values: ['none', 'wave'], default: 'none' },
    },
  },

  /* ---------------- Pembuka dan penutup tambahan ---------------- */
  hero: {
    label: 'Pembuka tipografi',
    role: 'open',
    motion: 'typeset',
    visual: 'Judul besar tanpa karakter, dengan motif dua hal',
    goal: 'Masalah yang dikenali pembaca, dalam satu kalimat.',
    spec: 'Judul 104/110, sub 40/54, motif teks 56/64',
    rule: 'Hanya di slide pertama. Motif opsional untuk dua hal yang dibedakan.',
    variants: { marker: 'Kata terakhir bergaris sorotan', stack: 'Rata kiri dengan garis pemisah', band: 'Judul di atas pita aksen' },
    keys: {
      variant: variant('marker', 'stack', 'band'),
      title: title('coverTitleMax', 48),
      sub: text(12, 80),
      motif: obj({ left: text(2, 12, true), sign: { type: 'enum', values: SIGNS, required: true }, right: text(2, 12, true) }, false),
    },
  },
  outro: {
    label: 'Penutup tipografi',
    role: 'close',
    motion: 'rise',
    visual: 'Judul, kalimat pendukung, dan ajakan tanpa karakter',
    goal: 'Ajakan dan disclaimer.',
    spec: 'Judul 104/110, ajakan 40/48, disclaimer otomatis di footer',
    rule: 'Hanya di slide terakhir. Ajakan berupa kalimat dengan ikon, bukan tombol.',
    variants: { strip: 'Rata kiri dengan garis ajakan', card: 'Judul di dalam kartu' },
    keys: {
      variant: variant('strip', 'card'),
      title: title('coverTitleMax', 36),
      lede: text(8, 44),
      cta: obj({ icon: { type: 'icon', required: true }, text: text(6, 32, true) }),
    },
  },

  /* ---------------- Isi ---------------- */
  pairs: {
    label: 'Pasangan',
    motion: 'alternate',
    visual: 'Baris berpasangan dengan dua kepala kolom',
    goal: 'Dua sisi yang saling berhadapan, misalnya situasi dan kalimat.',
    spec: 'Kolom kiri 300 px, teks 30/38 dan 36/44, garis pemisah 2 px',
    rule: 'Dua sampai tiga baris. Kolom kanan adalah sisi yang ditekankan.',
    variants: { table: 'Tabel dua kolom', arrows: 'Kiri ke kanan dengan panah', stacked: 'Pasangan bertumpuk' },
    keys: {
      variant: variant('table', 'arrows', 'stacked'),
      title: title(),
      heads: obj({ left: text(2, 14, true), right: text(2, 14, true) }),
      rows: list(2, 3, obj({ left: text(4, 24, true), right: text(7, 40, true) })),
      note: text(9, 54),
    },
    validate: s => budget(Array.isArray(s.rows) ? s.rows.map(r => r && r.right) : [], 100, 'rows[].right'),
  },
  quotes: {
    label: 'Kutipan berderet',
    motion: 'wipe',
    visual: 'Dua sampai empat kalimat yang diucapkan',
    goal: 'Contoh kalimat yang bisa langsung dipakai.',
    spec: 'Teks 36/46, garis pemisah 2 px',
    rule: 'Setiap butir satu kalimat yang bisa diucapkan.',
    variants: { lines: 'Baris dipisah garis tipis', chat: 'Gelembung obrolan bergantian' },
    keys: {
      variant: variant('lines', 'chat'),
      title: title(),
      lead: text(7, 44),
      quotes: list(2, 4, text(9, 44, true)),
      note: text(10, 60),
    },
    validate: s => budget(s.quotes, 140, 'quotes'),
  },
  split: {
    label: 'Pisahkan',
    motion: 'unfold',
    visual: 'Dua hal dipisahkan oleh satu kata penghubung',
    goal: 'Memisahkan dua hal yang sering tercampur.',
    spec: 'Kotak 200 px, teks 40/48, contoh 36/48',
    rule: 'Kiri hal yang diterima, kanan hal yang perlu berubah.',
    variants: { boxes: 'Dua kotak berdampingan', circles: 'Dua lingkaran' },
    keys: {
      variant: variant('boxes', 'circles'),
      title: title(),
      left: text(3, 18, true, 11),
      joiner: text(1, 7, true),
      right: text(5, 30, true, 14),
      example: text(14, 90),
    },
  },
  ladder: {
    label: 'Tangga',
    motion: 'cascade',
    visual: 'Tiga kartu bertingkat dengan label kecil',
    goal: 'Perubahan bertahap dari hal umum ke hal yang bisa dilakukan.',
    spec: 'Kartu 36/46 radius 20, label 30/36, indentasi 56 px',
    rule: 'Tepat tiga tingkat. Tingkat terakhir yang ditekankan.',
    variants: { cascade: 'Kartu menjorok bertingkat', stairs: 'Anak tangga naik', rail: 'Rel vertikal dengan titik' },
    keys: {
      variant: variant('cascade', 'stairs', 'rail'),
      title: title(),
      items: list(3, 3, obj({ tag: text(2, 14, true), text: text(6, 36, true) })),
      note: text(9, 54),
    },
    /* Stairs puts three items side by side: each column holds words of up to 11 letters */
    validate: s => (s.variant === 'stairs' && Array.isArray(s.items) ? s.items.flatMap((it, k) => [...longWords(it && it.tag, 11, `items[${k}].tag`), ...longWords(it && it.text, 11, `items[${k}].text`)]) : []),
  },
  versus: {
    label: 'Berhadapan',
    motion: 'alternate',
    visual: 'Dua kalimat berdampingan dengan keterangan',
    goal: 'Dua kalimat yang mirip tetapi pesannya berbeda.',
    spec: 'Kolom 426 px, kalimat 44/52, keterangan 34/44',
    rule: 'Kiri yang dianjurkan, kanan yang dihindari.',
    variants: { cards: 'Dua kartu dengan pembatas', columns: 'Dua kolom tanpa kartu' },
    keys: {
      variant: variant('cards', 'columns'),
      title: title(),
      left: obj({ text: text(5, 30, true, 14), caption: text(7, 44, true) }),
      right: obj({ text: text(5, 30, true, 14), caption: text(7, 44, true) }),
      joiner: text(3, 20),
    },
  },
  formula: {
    label: 'Rumus',
    motion: 'pop',
    visual: 'Dua sampai tiga unsur yang dijumlahkan, contoh, dan tiga kata kunci',
    goal: 'Cara yang bisa diulang, dengan satu contoh utuh.',
    spec: 'Unsur 30/36, contoh 36/48, kata kunci 36/44',
    rule: 'Unsur berurutan. Kata kunci terakhir memakai warna sorotan.',
    variants: { boxes: 'Kotak dan tanda tambah', circles: 'Lingkaran dan tanda tambah', chain: 'Kotak di satu garis' },
    keys: {
      variant: variant('boxes', 'circles', 'chain'),
      title: title(),
      terms: list(2, 3, text(3, 18, true, 11)),
      example: text(20, 120),
      tags: { type: 'list', min: 3, max: 3, item: text(2, 14, true, 12) },
    },
    validate: s => {
      const long = s.variant === 'circles' && Array.isArray(s.terms) ? s.terms.flatMap(t => String(t).split(/\s+/)).filter(w => w.replace(/[^\p{L}]/gu, '').length > 10) : [];
      return long.length ? [`varian circles hanya untuk kata pendek (maksimal 10 huruf). Kata terlalu panjang: ${long.join(', ')}. Pakai varian boxes.`] : [];
    },
  },
  reframe: {
    label: 'Ubah sudut pandang',
    motion: 'rise',
    visual: 'Kalimat yang diharapkan dan kalimat yang dihindari',
    goal: 'Apa yang ingin didengar pembaca, dibanding yang tidak.',
    spec: 'Kalimat utama 44/56, pembanding 40/52',
    rule: 'Kalimat utama di kartu sorotan, pembanding di kartu bergaris tipis.',
    variants: { stack: 'Bertumpuk menjorok', strike: 'Pembanding dicoret' },
    keys: {
      variant: variant('stack', 'strike'),
      title: title(),
      lead: text(8, 48),
      quote: text(9, 54, true),
      joiner: text(2, 14, true),
      counter: text(9, 54, true),
    },
  },

  /* ---------------- Batch kedua ---------------- */
  hook: {
    label: 'Pembuka pertanyaan',
    role: 'open',
    motion: 'pop',
    visual: 'Pertanyaan besar yang dikenali pembaca',
    goal: 'Pertanyaan yang sering muncul di kepala pembaca.',
    spec: 'Pertanyaan 72 sampai 104 px, tanda tanya beraksen pada varian mark',
    rule: 'Hanya di slide pertama. Judul berupa pertanyaan.',
    variants: { bubble: 'Pertanyaan di gelembung bicara', mark: 'Rata kiri, tanda tanya beraksen', chat: 'Pesan masuk dan balasan singkat', options: 'Pertanyaan dengan dua pilihan', quiz: 'Kuis dengan tiga pilihan berhuruf', scale: 'Pertanyaan dengan skala dari satu ujung ke ujung lain' },
    motions: { chat: 'rise', options: 'pop', quiz: 'cascade', scale: 'stretch' },
    keys: {
      variant: variant('bubble', 'mark', 'chat', 'options', 'quiz', 'scale'),
      title: title('coverTitleMax', 56),
      sub: text(12, 80),
      options: only(list(2, 2, text(3, 18, true, 11)), 'options'),
      choices: only(list(3, 3, text(4, 26, true)), 'quiz'),
      ends: only(obj({ left: text(2, 14, true, 12), right: text(2, 14, true, 12) }), 'scale'),
    },
  },
  stat: {
    label: 'Pembuka angka',
    role: 'open',
    motion: 'rise',
    visual: 'Satu angka besar sebagai pembuka',
    goal: 'Satu angka yang membuat pembaca berhenti, dengan sumbernya.',
    spec: 'Angka 160 px (104 di dalam cincin), judul 104/110 sampai 64/72',
    rule: 'Hanya di slide pertama. Angkanya benar dan sumbernya ditulis di sub.',
    variants: { top: 'Angka di atas judul', ring: 'Persen di dalam cincin', side: 'Angka di samping judul', bar: 'Persen dengan batang terisi', dots: 'Sekian dari sekian orang, digambar sebagai deret ikon' },
    motions: { ring: 'zoom', side: 'slide', bar: 'stretch', dots: 'pop' },
    keys: {
      variant: variant('top', 'ring', 'side', 'bar', 'dots'),
      value: numeral(6),
      title: title('coverTitleMax', 48),
      sub: text(12, 80),
    },
    validate(s) {
      const v = s.variant || 'top', val = String(s.value || '').trim();
      if ((v === 'ring' || v === 'bar') && !(/^\d{1,3}%$/.test(val) && parseInt(val, 10) >= 1 && parseInt(val, 10) <= 100)) return [`value: varian ${v} menggambar persen, isi 1% sampai 100%.`];
      if (v === 'dots') {
        const m = val.match(/^(\d{1,2})\/(\d{1,2})$/);
        if (!m || +m[1] < 1 || +m[1] > +m[2] || +m[2] < 2 || +m[2] > 10) return ['value: varian dots menulis "sekian/dari", misalnya 1/4 atau 3/10 (pembilang 1 sampai penyebut, penyebut 2 sampai 10).'];
      }
      if (v === 'side' && [...val].length > 3) return ['value: varian side memuat angka sampai 3 karakter. Pakai varian top untuk angka yang lebih panjang.'];
      if (v === 'side') return longWords(s.title, 11, 'title');
      return [];
    },
  },
  recap: {
    label: 'Penutup ringkasan',
    role: 'close',
    motion: 'cascade',
    visual: 'Judul, dua sampai tiga poin ringkasan, dan ajakan',
    goal: 'Ringkasan isi dan ajakan.',
    spec: 'Judul 104/110, poin 36/44, ajakan 40/48',
    rule: 'Hanya di slide terakhir. Poin mengulang isi, bukan isi baru.',
    variants: { ticks: 'Poin bertanda centang', lines: 'Poin dipisah garis tipis' },
    keys: {
      variant: variant('ticks', 'lines'),
      title: title('coverTitleMax', 36),
      points: list(2, 3, text(6, 36, true)),
      cta: obj({ icon: { type: 'icon', required: true }, text: text(6, 32, true) }),
    },
  },
  swap: {
    label: 'Ganti kalimat',
    motion: 'fan',
    visual: 'Kalimat lama dicoret, diganti dua sampai tiga kalimat baru',
    goal: 'Mengganti satu kebiasaan dengan pilihan yang lebih baik.',
    spec: 'Kalimat lama 36/44 dicoret, pengganti 36/46',
    rule: 'Kalimat lama tetap terbaca walau dicoret.',
    variants: { cards: 'Kartu pengganti bertumpuk', list: 'Daftar dengan panah', columns: 'Lama di kiri, baru di kanan' },
    keys: {
      variant: variant('cards', 'list', 'columns'),
      title: title(),
      from: text(5, 30, true),
      to: list(2, 3, text(6, 32, true)),
      note: text(9, 54),
    },
    /* Columns sets the old sentence in a narrow left column */
    validate: s => (s.variant === 'columns' ? longWords(s.from, 11, 'from') : []),
  },
  bignumber: {
    label: 'Angka besar',
    motion: 'stamp',
    visual: 'Satu angka besar dengan penjelasan',
    goal: 'Satu angka yang membuat pembaca berhenti.',
    spec: 'Angka 220 px, judul 84/92, isi 40/54',
    rule: 'Angka dari sumber yang bisa dicek. Tulis sumbernya di isi atau caption.',
    variants: { center: 'Angka di tengah', left: 'Angka di kiri, teks di kanan' },
    keys: {
      variant: variant('center', 'left'),
      value: numeral(6),
      title: title(),
      text: text(20, 120),
    },
    /* Left sets a figure of up to three characters beside the title: the title column holds words of up to 11 letters */
    validate: s => (s.variant === 'left' && [...String(s.value || '')].length <= 3 ? longWords(s.title, 11, 'title') : []),
  },
  pullquote: {
    label: 'Kutipan besar',
    titleKey: 'quote',
    titleWords: 22,
    motion: 'typeset',
    visual: 'Satu kutipan besar dengan sumber',
    goal: 'Satu kalimat yang ingin diingat pembaca.',
    spec: 'Kutipan 60/76 sebagai judul slide, sumber 34/42',
    rule: 'Satu kutipan saja. Sebut sumber bila bukan kalimat akun sendiri.',
    variants: { plain: 'Kutipan besar rata kiri', card: 'Kutipan di kartu kontras', rule: 'Diapit dua garis tipis' },
    keys: {
      variant: variant('plain', 'card', 'rule'),
      quote: text(22, 130, true),
      by: text(4, 30),
    },
  },
  myth: {
    label: 'Keliru dan benar',
    motion: 'slide',
    visual: 'Anggapan keliru lalu penjelasan yang benar',
    goal: 'Meluruskan satu anggapan yang sering keliru.',
    spec: 'Label sebaris dengan ikon, teks 38/50',
    rule: 'Anggapan keliru tetap terbaca. Penjelasan benar lebih menonjol.',
    variants: { stack: 'Bertumpuk', split: 'Berdampingan' },
    keys: {
      variant: variant('stack', 'split'),
      title: title(),
      wrong: obj({ label: text(2, 14, true), text: text(14, 84, true) }),
      right: obj({ label: text(2, 14, true), text: text(16, 96, true) }),
    },
  },
  dodont: {
    label: 'Lakukan dan hindari',
    motion: 'drop',
    visual: 'Dua daftar pendek: yang dilakukan dan yang dihindari',
    goal: 'Pegangan cepat apa yang dilakukan dan dihindari.',
    spec: 'Kepala 34/42 dengan ikon, butir 34/42',
    rule: 'Ikon centang dan silang hanya penanda, bukan kotak yang bisa dicentang.',
    variants: { columns: 'Dua kolom', rows: 'Dua baris' },
    keys: {
      variant: variant('columns', 'rows'),
      title: title(),
      do: obj({ label: text(2, 14, true), items: list(2, 3, text(5, 30, true)) }),
      dont: obj({ label: text(2, 14, true), items: list(2, 3, text(5, 30, true)) }),
    },
  },
  timeline: {
    label: 'Garis waktu',
    motion: 'cascade',
    visual: 'Tiga sampai empat titik waktu',
    goal: 'Apa yang terjadi dari waktu ke waktu.',
    spec: 'Waktu 30/36, isi 34/44',
    rule: 'Titik berurutan menurut waktu. Titik terakhir memakai warna sorotan.',
    variants: { vertical: 'Garis tegak', horizontal: 'Garis mendatar' },
    keys: {
      variant: variant('vertical', 'horizontal'),
      title: title(),
      points: list(3, 4, obj({ when: text(2, 14, true), text: text(7, 40, true) })),
    },
    validate: s => (s.variant === 'horizontal' && Array.isArray(s.points) && s.points.length > 3 ? ['varian horizontal maksimal 3 titik agar kolomnya cukup lebar. Pakai varian vertical untuk 4 titik.'] : []),
  },
  grid: {
    label: 'Kisi ikon',
    motion: 'scatter',
    visual: 'Empat sel dua kali dua dengan garis pemisah, ikon di samping teks',
    goal: 'Empat hal sejajar yang mudah dipindai.',
    spec: 'Sel 444 px, ikon 56 px, teks 36/44',
    rule: 'Tepat empat sel yang setara. Kalau ada satu yang paling penting, pakai komponen lain.',
    variants: { lines: 'Garis pemisah' },
    keys: {
      variant: variant('lines'),
      title: title(),
      cells: list(4, 4, obj({ icon: { type: 'icon', required: true }, text: text(5, 28, true) })),
    },
  },
  iconrow: {
    label: 'Baris ikon',
    motion: 'zoom',
    visual: 'Tiga ikon besar berderet dengan label',
    goal: 'Tiga hal pendek yang dikenali dari gambarnya.',
    spec: 'Ikon garis 112 px tanpa wadah, label 36/44',
    rule: 'Tepat tiga ikon. Label pendek.',
    variants: { plain: 'Ikon garis dengan pembatas' },
    keys: {
      variant: variant('plain'),
      title: title(),
      items: list(3, 3, obj({ icon: { type: 'icon', required: true }, label: text(3, 20, true, 11) })),
      note: text(14, 90),
    },
  },
  /* ---------------- Batch ketiga ---------------- */
  spectrum: {
    label: 'Spektrum',
    motion: 'stretch',
    visual: 'Satu garis dari satu ujung ke ujung lain dengan tiga titik',
    goal: 'Sesuatu yang bertahap, bukan hitam putih.',
    spec: 'Garis 8 px, titik 32 px, teks 34/44',
    rule: 'Tepat tiga titik, berurutan dari ujung kiri ke kanan.',
    variants: { bar: 'Garis dengan tiga titik', dots: 'Titik yang membesar' },
    keys: {
      variant: variant('bar', 'dots'),
      title: title(),
      ends: obj({ left: text(2, 14, true, 13), right: text(2, 14, true, 13) }),
      points: list(3, 3, text(4, 24, true, 13)),
      note: text(10, 60),
    },
  },
  callout: {
    label: 'Sorotan',
    motion: 'wipe',
    visual: 'Satu paragraf besar dengan frasa yang disorot',
    goal: 'Satu gagasan dengan satu frasa kunci.',
    spec: 'Isi 48/66, garis bawah sorotan 10 px',
    rule: 'Frasa sorotan harus muncul persis di dalam isi.',
    variants: { marker: 'Garis bawah sorotan', box: 'Di dalam kartu' },
    keys: {
      variant: variant('marker', 'box'),
      title: title(),
      text: text(28, 170, true),
      highlight: phrase('text', 4, 30),
    },
  },
  qa: {
    label: 'Tanya jawab',
    motion: 'pop',
    visual: 'Satu pertanyaan dan jawabannya',
    goal: 'Menjawab satu pertanyaan yang sering diajukan.',
    spec: 'Pertanyaan 64/74, jawaban 40/54',
    rule: 'Judul berupa pertanyaan. Jawaban langsung, tanpa basa-basi.',
    variants: { chat: 'Gelembung obrolan', card: 'Kartu jawaban', split: 'Dua kolom' },
    keys: {
      variant: variant('chat', 'card', 'split'),
      title: title(),
      answer: text(28, 170, true),
    },
    /* Split sets the question in a narrow column beside the answer */
    validate: s => (s.variant === 'split' ? longWords(s.title, 11, 'title') : []),
  },
  cycle: {
    label: 'Siklus',
    motion: 'pop',
    visual: 'Tiga sampai empat hal yang berputar dalam lingkaran',
    goal: 'Kebiasaan atau proses yang berulang.',
    spec: 'Lingkaran r 236, kotak 30/36 radius 16',
    rule: 'Urutan searah jarum jam. Tengah lingkaran opsional.',
    variants: { ring: 'Lingkaran', loop: 'Deretan dengan panah kembali' },
    keys: {
      variant: variant('ring', 'loop'),
      title: title(),
      items: list(3, 4, text(3, 18, true, 11)),
      center: text(2, 14, false, 10),
    },
    validate: s => (s.variant === 'loop' && Array.isArray(s.items) && s.items.length > 3 ? ['varian loop maksimal 3 butir agar setiap kotak cukup lebar. Pakai varian ring untuk 4 butir.'] : []),
  },
  pyramid: {
    label: 'Piramida',
    motion: 'drop',
    visual: 'Tiga tingkat yang melebar atau menyempit',
    goal: 'Prioritas: dasar yang paling luas, puncak yang paling sedikit.',
    spec: 'Tingkat 120 px, teks 34/40',
    rule: 'Tepat tiga tingkat, ditulis dari atas ke bawah.',
    variants: { pyramid: 'Melebar ke bawah', funnel: 'Menyempit ke bawah' },
    keys: {
      variant: variant('pyramid', 'funnel'),
      title: title(),
      levels: list(3, 3, text(4, 26, true)),
      note: text(10, 60),
    },
  },
  matrix: {
    label: 'Matriks',
    motion: 'zoom',
    visual: 'Empat kotak dua kali dua dengan dua sumbu',
    goal: 'Memilah empat kemungkinan dari dua pertanyaan.',
    spec: 'Kotak 400 x 190, teks 34/42',
    rule: 'Sel kanan atas yang ditekankan. Sumbu ditulis singkat.',
    variants: { quad: 'Dengan sumbu', cards: 'Kartu tanpa sumbu' },
    keys: {
      variant: variant('quad', 'cards'),
      title: title(),
      axes: obj({ x: text(2, 14, true), y: text(2, 14, true) }, false),
      cells: list(4, 4, text(4, 24, true)),
    },
  },
  numbered: {
    label: 'Langkah bernomor',
    motion: 'slide',
    visual: 'Dua sampai empat langkah dengan nomor besar',
    goal: 'Langkah yang dilakukan berurutan.',
    spec: 'Nomor 40 sampai 72 px, teks 36/46',
    rule: 'Langkah benar-benar berurutan.',
    variants: { rail: 'Nomor besar dan garis pemisah', badges: 'Nomor di lencana', outline: 'Nomor dalam lingkaran bergaris' },
    keys: {
      variant: variant('rail', 'badges', 'outline'),
      title: title(),
      items: list(2, 4, text(7, 40, true)),
    },
  },
  tip: {
    label: 'Kartu tips',
    motion: 'swing',
    visual: 'Satu tips dengan ikon dan label',
    goal: 'Satu saran praktis.',
    spec: 'Isi 42/58, ikon 56 px di samping label',
    rule: 'Satu tips saja per kartu.',
    variants: { card: 'Kartu', banner: 'Kartu aksen dengan ikon besar' },
    keys: {
      variant: variant('card', 'banner'),
      title: title(),
      label: text(2, 14),
      icon: { type: 'icon', required: true },
      text: text(26, 160, true),
    },
  },
  definition: {
    label: 'Definisi',
    motion: 'typeset',
    visual: 'Satu istilah dengan arti dan contoh',
    goal: 'Menjelaskan satu istilah.',
    spec: 'Istilah 92/100, arti 40/56',
    rule: 'Judul adalah istilahnya. Arti dalam bahasa sehari-hari.',
    variants: { dict: 'Gaya kamus', card: 'Istilah di pita' },
    keys: {
      variant: variant('dict', 'card'),
      title: title('titleMax', 40),
      kind: text(3, 20),
      meaning: text(22, 130, true),
      example: text(11, 70),
    },
    /* The card variant stacks band, card and example under the illustration */
    validate: s => (s.art && s.variant === 'card' && String(s.meaning || '').length + String(s.example || '').length > 150 ? ['dengan ilustrasi, varian card memuat arti dan contoh sampai 150 karakter bersama. Persingkat, atau pakai varian dict.'] : []),
  },

  /* ---------------- Batch keempat: pembuka foto dan janji isi ---------------- */
  photo: {
    label: 'Pembuka foto',
    role: 'open',
    motion: 'rise',
    visual: 'Foto atau video besar dengan judul di latar slide',
    goal: 'Satu adegan yang dikenali pembaca, dengan masalahnya dalam satu kalimat.',
    spec: 'Foto selebar kanvas atau dalam bingkai radius 28, judul 92/100 di luar foto',
    rule: 'Hanya di slide pertama. Teks tidak pernah ditulis di atas foto; foto milik akun sendiri, dengan izin orang di dalamnya.',
    variants: { full: 'Foto selebar kanvas, memudar ke latar di bawahnya', frame: 'Foto dalam bingkai di atas judul', circle: 'Foto bulat di tengah', card: 'Foto penuh dengan judul di panel latar' },
    motions: { frame: 'unfold', circle: 'zoom', card: 'rise' },
    keys: {
      variant: variant('full', 'frame', 'circle', 'card'),
      media: media(),
      title: title('coverTitleMax', 48),
      kicker: text(6, 40),
    },
  },
  teaser: {
    label: 'Pembuka janji isi',
    role: 'open',
    motion: 'cascade',
    visual: 'Judul dengan cuplikan isi carousel',
    goal: 'Menunjukkan apa yang didapat pembaca kalau terus menggeser.',
    spec: 'Judul 92/100, daftar isi 40/48 dengan nomor, kotak cari 72/80',
    rule: 'Hanya di slide pertama. Cuplikan harus benar-benar ada di slide berikutnya.',
    variants: { index: 'Daftar isi bernomor', search: 'Pertanyaan di kotak pencarian, dengan saran pencarian', icons: 'Tiga ikon isi berderet' },
    motions: { search: 'rise', icons: 'zoom' },
    keys: {
      variant: variant('index', 'search', 'icons'),
      title: title('coverTitleMax', 52),
      items: only(list(3, 4, text(5, 30, true)), 'index'),
      suggest: only(list(2, 3, text(6, 36, true)), 'search'),
      icons: only(list(3, 3, obj({ icon: icon(), label: text(3, 16, true, 11) })), 'icons'),
      kicker: text(8, 48),
    },
  },
  contrast: {
    label: 'Pembuka kontras',
    role: 'open',
    motion: 'rise',
    titleWords: 11,
    visual: 'Anggapan lama yang diredupkan, lalu cara pandang baru',
    goal: 'Membalik satu anggapan dalam dua baris.',
    spec: 'Anggapan 72/80 redup, judul 104/110 atau di pita sorotan',
    rule: 'Hanya di slide pertama. Baris pertama anggapan yang dikenali, baris kedua yang ingin diingat.',
    variants: { turn: 'Anggapan dicoret, judul di bawahnya', band: 'Judul di pita sorotan', split: 'Anggapan di kotak bergaris, judul di kartu kontras' },
    motions: { band: 'wipe', split: 'unfold' },
    keys: {
      variant: variant('turn', 'band', 'split'),
      /* One line at 64 px, so the strike runs through it once */
      before: text(4, 22, true),
      title: title('coverTitleMax', 44),
      kicker: text(8, 48),
    },
  },

  /* ---------------- Isi dengan foto dan video ---------------- */
  figure: {
    label: 'Foto dan keterangan',
    motion: 'rise',
    visual: 'Satu foto atau video dengan judul dan keterangan',
    goal: 'Menunjukkan satu gerakan, posisi, atau situasi yang lebih jelas dilihat daripada dibaca.',
    spec: 'Bingkai 888 lebar radius 20, keterangan 36/48',
    rule: 'Keterangan menjelaskan apa yang perlu dilihat di foto. Teks tidak di atas foto kecuali di kartu.',
    variants: { frame: 'Foto dalam bingkai', bleed: 'Foto selebar kanvas', overlay: 'Keterangan di kartu yang menumpang di bawah foto' },
    motions: { bleed: 'curtain' },
    keys: {
      variant: variant('frame', 'bleed', 'overlay'),
      title: title(),
      media: media(),
      caption: text(18, 110, true),
    },
  },
  photopair: {
    label: 'Dua foto',
    motion: 'alternate',
    visual: 'Dua foto berdampingan dengan label',
    goal: 'Membandingkan dua posisi atau keadaan, misalnya sebelum dan sesudah.',
    spec: 'Dua bingkai radius 20, label 36/44',
    rule: 'Kiri yang dihindari atau sebelum, kanan yang dianjurkan atau sesudah. Tanda silang dan centang hanya bila memang benar dan salah.',
    variants: { side: 'Berdampingan, label di bawah foto', stack: 'Bertumpuk, label di chip pada foto' },
    motions: { stack: 'slide' },
    keys: {
      variant: variant('side', 'stack'),
      title: title(),
      left: obj({ media: media(), label: text(3, 18, true) }),
      right: obj({ media: media(), label: text(3, 18, true) }),
      marks: bool(false),
      note: text(12, 80),
    },
  },
  pins: {
    label: 'Foto bertanda',
    motion: 'pop',
    visual: 'Foto dengan titik bernomor dan keterangannya',
    goal: 'Menunjuk dua sampai empat bagian dalam satu foto, misalnya posisi leher, punggung, dan kaki.',
    spec: 'Titik 56 px, keterangan 34/44 bernomor',
    rule: 'x dan y dalam persen dari kiri dan atas foto. Nomor mengikuti urutan baca keterangan.',
    variants: { legend: 'Keterangan di bawah foto', side: 'Foto tegak di kiri, keterangan di kanan' },
    keys: {
      variant: variant('legend', 'side'),
      title: title(),
      media: media(true, ['image']),
      pins: list(2, 4, obj({ x: num(0, 100), y: num(0, 100), text: text(6, 36, true) })),
    },
    validate: s => (s.variant === 'side' && Array.isArray(s.pins) ? s.pins.flatMap((p, k) => longWords(p && p.text, 12, `pins[${k}].text`)) : []),
  },
  gallery: {
    label: 'Galeri',
    motion: 'rise',
    visual: 'Tiga foto dengan label pendek',
    goal: 'Beberapa contoh gerakan atau pilihan yang dikenali dari gambarnya.',
    spec: 'Bingkai radius 20, label 34/42',
    rule: 'Tepat tiga foto. Label pendek, satu sampai tiga kata.',
    variants: { row: 'Berderet, label di bawah', mosaic: 'Satu besar dan dua kecil, label di chip' },
    motions: { mosaic: 'zoom' },
    keys: {
      variant: variant('row', 'mosaic'),
      title: title(),
      items: list(3, 3, obj({ media: media(), label: text(3, 18, true, 11) })),
      note: text(12, 80),
    },
  },
  exercise: {
    label: 'Kartu latihan',
    motion: 'rise',
    visual: 'Satu latihan dengan takaran dan cara melakukannya',
    goal: 'Latihan yang bisa langsung dicoba: berapa kali, berapa lama, dan caranya.',
    spec: 'Takaran 56/64 dalam tiga kolom, cara 34/44 bernomor',
    rule: 'Takaran dan cara harus aman untuk pembaca umum. Judul adalah nama latihannya.',
    variants: { photo: 'Foto atau video gerakan di atas takaran', plain: 'Takaran besar tanpa foto' },
    motions: { plain: 'pop' },
    keys: {
      variant: variant('photo', 'plain'),
      title: title(),
      media: only(media(), 'photo'),
      dose: list(2, 3, obj({ value: text(2, 8, true), label: text(2, 12, true, 10) })),
      cues: list(2, 3, text(7, 40, true)),
    },
  },
  testimonial: {
    label: 'Testimoni',
    titleKey: 'quote',
    titleWords: 22,
    motion: 'rise',
    visual: 'Kutipan pengalaman seseorang dengan nama dan fotonya',
    goal: 'Cerita singkat dari orang tua atau pasien, dengan izin mereka.',
    spec: 'Kutipan 44/60 di kartu atau 40/54 di samping foto, nama 36/44',
    rule: 'Hanya kutipan asli dengan izin orang tersebut. Tanpa angka hasil yang dijanjikan.',
    variants: { card: 'Kutipan di kartu, nama dan foto kecil di bawahnya', photo: 'Foto besar di samping kutipan' },
    motions: { photo: 'slide' },
    keys: {
      variant: variant('card', 'photo'),
      quote: text(22, 130, true),
      person: obj({ name: text(3, 24, true), role: text(5, 32) }),
      media: only(media(true, ['image']), 'photo'),
    },
  },

  /* ---------------- Isi yang mengajak berpikir ---------------- */
  quiz: {
    label: 'Kuis',
    motion: 'pop',
    visual: 'Satu pertanyaan dengan tiga pilihan berhuruf',
    goal: 'Mengajak pembaca menebak dulu, lalu menggeser untuk tahu jawabannya.',
    spec: 'Pilihan 40/48 di kartu, huruf di lencana 64 px',
    rule: 'Pakai varian ask lalu varian reveal di slide berikutnya, dengan pilihan yang sama.',
    variants: { ask: 'Tiga pilihan, belum ada jawaban', reveal: 'Jawaban disorot dan alasannya' },
    motions: { reveal: 'rise' },
    keys: {
      variant: variant('ask', 'reveal'),
      title: title(),
      options: list(3, 3, text(5, 30, true)),
      answer: only({ ...choice('A', 'B', 'C'), required: true }, 'reveal'),
      reason: only(text(18, 110, true), 'reveal'),
      note: only(text(8, 48), 'ask'),
    },
  },
  bars: {
    label: 'Grafik batang',
    motion: 'stretch',
    visual: 'Dua sampai empat batang dengan angka',
    goal: 'Membandingkan besaran yang bisa diukur, dengan sumbernya.',
    spec: 'Batang 32 px radius 12, label 34/42, angka 40/48',
    rule: 'Angka dari sumber yang bisa dicek; tulis sumbernya di catatan. Batang terbesar memakai warna sorotan.',
    variants: { horizontal: 'Batang mendatar', columns: 'Kolom tegak' },
    motions: { columns: 'unfold' },
    keys: {
      variant: variant('horizontal', 'columns'),
      title: title(),
      bars: list(2, 4, obj({ label: text(4, 24, true, 11), value: numeral(6) })),
      note: text(12, 80),
    },
    validate(s) {
      const out = [];
      (Array.isArray(s.bars) ? s.bars : []).forEach((b, k) => { if (b && !(parseFloat(String(b.value).replace(',', '.')) > 0)) out.push(`bars[${k}].value: batang butuh angka lebih dari 0, misalnya 60 atau 45%.`); });
      if (s.variant === 'columns' && Array.isArray(s.bars)) s.bars.forEach((b, k) => out.push(...longWords(b && b.label, 10, `bars[${k}].label`)));
      return out;
    },
  },
  week: {
    label: 'Jadwal seminggu',
    motion: 'pop',
    visual: 'Tujuh hari dengan hari yang terisi ditandai',
    goal: 'Seberapa sering sesuatu dilakukan dalam seminggu, misalnya tiga hari latihan.',
    spec: 'Hari 30/36 di lingkaran 104 px atau kolom 104 x 220',
    rule: 'Tepat tujuh hari, ditulis singkat (Sen, Sel, Rab). Minimal satu hari ditandai.',
    variants: { dots: 'Tujuh lingkaran', columns: 'Tujuh kolom' },
    motions: { columns: 'unfold' },
    keys: {
      variant: variant('dots', 'columns'),
      title: title(),
      days: list(7, 7, obj({ day: text(1, 4, true), on: { ...bool(false), required: true } })),
      note: text(14, 84),
    },
    validate: s => (Array.isArray(s.days) && !s.days.some(d => d && d.on === true) ? ['days: tandai minimal satu hari dengan "on": true.'] : []),
  },
  flags: {
    label: 'Tanda bahaya',
    motion: 'slide',
    visual: 'Dua sampai empat tanda dengan ikon peringatan, lalu tindakan',
    goal: 'Kapan perlu segera ke tenaga kesehatan.',
    spec: 'Tanda 36/46 dengan ikon 44 px, tindakan di kartu sorotan 36/46',
    rule: 'Tanda harus spesifik dan bisa diamati. Tindakan jelas, tanpa menakut-nakuti.',
    variants: { list: 'Daftar dengan ikon peringatan', cards: 'Kotak dua kali dua' },
    motions: { cards: 'pop' },
    keys: {
      variant: variant('list', 'cards'),
      title: title(),
      items: list(2, 4, text(6, 36, true)),
      action: obj({ icon: icon(), text: text(10, 60, true) }),
    },
    validate: s => (s.variant === 'cards' && Array.isArray(s.items) && s.items.length % 2 ? ['varian cards memakai 2 atau 4 tanda agar kotaknya genap.'] : []),
  },
  faq: {
    label: 'Tanya jawab berderet',
    motion: 'cascade',
    visual: 'Dua sampai tiga pertanyaan pendek dengan jawabannya',
    goal: 'Menjawab beberapa pertanyaan yang sering muncul bersamaan.',
    spec: 'Tanya 36/44 tebal, jawab 34/44',
    rule: 'Jawaban langsung, satu sampai dua kalimat. Varian chat maksimal dua pasang.',
    variants: { stack: 'Bertumpuk dipisah garis', chat: 'Gelembung tanya dan jawab' },
    motions: { chat: 'rise' },
    keys: {
      variant: variant('stack', 'chat'),
      title: title(),
      items: list(2, 3, obj({ q: text(7, 42, true), a: text(12, 72, true) })),
    },
    validate: s => (s.variant === 'chat' && Array.isArray(s.items) && s.items.length > 2 ? ['varian chat maksimal 2 pasang agar gelembungnya muat. Pakai varian stack untuk 3 pasang.'] : []),
  },
  script: {
    label: 'Template kalimat',
    motion: 'wipe',
    visual: 'Kalimat dengan bagian kosong yang diberi label, lalu contohnya',
    goal: 'Pola kalimat yang bisa diisi sendiri oleh pembaca.',
    spec: 'Template 48/72, label bagian kosong 30/36, contoh 36/48',
    rule: 'Setiap bagian: teks lalu satu isian berlabel. Tanda baca setelah isian ditulis di awal bagian berikutnya (". Kita coba"). end menutup kalimat setelah isian terakhir.',
    variants: { lines: 'Template besar dengan garis isian', card: 'Template di kartu' },
    motions: { card: 'unfold' },
    keys: {
      variant: variant('lines', 'card'),
      title: title(),
      parts: list(1, 3, obj({ text: text(5, 30, true), slot: text(2, 14, true, 10) })),
      end: text(5, 30),
      example: text(18, 110),
    },
    validate: s => budget(Array.isArray(s.parts) ? s.parts.map(p => p && p.text) : [], 64, 'parts[].text'),
  },
  acronym: {
    label: 'Singkatan',
    motion: 'cascade',
    visual: 'Huruf besar yang membentuk satu kata, masing-masing dengan artinya',
    goal: 'Langkah atau prinsip yang mudah diingat lewat satu kata.',
    spec: 'Huruf 72/80 atau ubin 96 px, arti 36/46',
    rule: 'Huruf-hurufnya membentuk kata yang bermakna. Setiap arti diawali huruf itu.',
    variants: { stack: 'Huruf di kiri setiap baris', tiles: 'Ubin huruf membentuk kata, arti di bawahnya' },
    motions: { tiles: 'pop' },
    keys: {
      variant: variant('stack', 'tiles'),
      title: title(),
      letters: list(3, 5, obj({ letter: { ...choice(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), required: true }, text: text(5, 30, true) })),
      note: text(10, 60),
    },
  },
  gauge: {
    label: 'Meteran',
    motion: 'zoom',
    visual: 'Tiga tingkat dengan penunjuk di salah satunya',
    goal: 'Menunjukkan satu tingkat dari tiga, misalnya ringan, sedang, berat.',
    spec: 'Busur 600 px atau batang tiga ruas, label 34/42',
    rule: 'Tepat tiga tingkat, dari yang paling ringan ke yang paling berat.',
    variants: { arc: 'Busur dengan jarum', bar: 'Batang tiga ruas dengan penanda' },
    motions: { bar: 'stretch' },
    keys: {
      variant: variant('arc', 'bar'),
      title: title(),
      levels: list(3, 3, text(2, 14, true, 11)),
      at: { ...choice('1', '2', '3'), required: true },
      note: text(16, 96),
    },
  },

  /* ---------------- Penutup ajakan ---------------- */
  prompt: {
    label: 'Penutup pertanyaan',
    role: 'close',
    motion: 'pop',
    visual: 'Pertanyaan untuk pembaca, dijawab di komentar',
    goal: 'Mengajak pembaca bercerita atau memilih di kolom komentar.',
    spec: 'Pertanyaan 84/92, pilihan 44/52, kata kunci 72/80',
    rule: 'Hanya di slide terakhir. Ajakan menulis komentar, bukan mengetuk gambar.',
    variants: { ask: 'Pertanyaan di gelembung', options: 'Dua pilihan berhuruf', keyword: 'Satu kata kunci untuk ditulis di komentar' },
    motions: { keyword: 'stamp' },
    keys: {
      variant: variant('ask', 'options', 'keyword'),
      title: title('coverTitleMax', 44),
      options: only(list(2, 2, text(3, 18, true, 11)), 'options'),
      keyword: only(text(1, 12, true), 'keyword'),
      cta: obj({ icon: icon(), text: text(8, 44, true) }),
    },
  },
  action: {
    label: 'Penutup ajakan',
    role: 'close',
    motion: 'rise',
    visual: 'Ikon besar, judul, dan satu ajakan: simpan, kirim, atau ikuti seri',
    goal: 'Satu ajakan yang jelas alasannya.',
    spec: 'Ikon 120 px, judul 104/110, poin 36/44',
    rule: 'Hanya di slide terakhir. Satu ajakan saja, dengan alasannya.',
    variants: { save: 'Simpan, dengan alasan menyimpan', share: 'Kirim ke orang yang membutuhkan', next: 'Seri berikutnya' },
    motions: { share: 'glide', next: 'slide' },
    keys: {
      variant: variant('save', 'share', 'next'),
      title: title('coverTitleMax', 40),
      lede: text(10, 60),
      points: only(list(2, 3, text(6, 36, true)), 'save'),
      next: only(obj({ label: text(3, 18, true), topic: text(8, 48, true) }), 'next'),
      cta: obj({ icon: icon(), text: text(8, 44, true) }),
    },
  },
  profile: {
    label: 'Penutup profil',
    role: 'close',
    motion: 'rise',
    visual: 'Siapa yang menulis: foto, nama, peran, dan ajakan',
    goal: 'Membangun kepercayaan: pembaca tahu siapa yang bisa ditanya.',
    spec: 'Foto bulat 200 px, nama 44/52, peran 34/42',
    rule: 'Hanya di slide terakhir. Nama dan peran asli, foto milik orang itu sendiri.',
    variants: { photo: 'Foto bulat di samping nama', card: 'Nama dan peran di kartu' },
    motions: { card: 'unfold' },
    keys: {
      variant: variant('photo', 'card'),
      title: title('coverTitleMax', 40),
      person: obj({ name: text(4, 28, true), role: text(6, 40) }),
      media: only(media(true, ['image']), 'photo'),
      lede: text(12, 72),
      cta: obj({ icon: icon(), text: text(8, 44, true) }),
    },
  },
};

/* Components written through the component gate (<skill>/components/<id>.mjs) join the catalog here */
for (const [id, def] of Object.entries(CUSTOM)) {
  if (COMPONENTS[id]) { CUSTOM_ISSUES[id] = `Komponen buatan ${id} memakai nama komponen inti. Ganti nama berkasnya.`; delete CUSTOM[id]; }
  else COMPONENTS[id] = def;
}

/* ---------------- Ilustrasi ----------------
   Components that are already pictures (diagram, chart, photo, icon row, character) carry their own visual.
   The others take an illustration from art.mjs in `art`, placed by the engine: `top` above the title (it grows
   and shrinks with the room left), `side` beside the title, `auto` top while the slide is light and side once
   its text grows (the number is how much text still leaves room on top), `icon` in place of the big icon.
   A variant set to `none` has no room for one. A slide with words only fails the scan (rules.visualEverySlide). */
export const VISUAL = {
  steps: true, venn: true, tiles: true, grid: true, iconrow: true, spectrum: true, cycle: true, pyramid: true, matrix: true,
  timeline: true, bars: true, week: true, gauge: true, pins: true, figure: true, photopair: true, gallery: true, photo: true, flags: true,
  stat: ['ring', 'bar', 'dots'], hook: ['scale'], teaser: ['icons'], exercise: ['photo'], profile: ['photo'], acronym: ['tiles'],
  ladder: ['stairs'], testimonial: ['photo'], action: ['save', 'share', 'next'], formula: ['circles'],
};
export const ART_PLACE = {
  cover: 'top', hero: 'top', hook: { bubble: 'top', mark: 'top', chat: 'top', options: { auto: 180 }, quiz: { auto: 200 }, scale: 'top' },
  stat: { top: 'top', side: 'none', ring: 'none', bar: 'top', dots: 'none' }, contrast: 'top',
  teaser: { index: 'side', search: 'top', icons: 'none' }, statement: 'auto', list: 'side', pairs: 'side', quotes: 'side', split: 'auto',
  ladder: { cascade: 'side', stairs: 'none', rail: 'side' }, versus: 'side', formula: 'side', reframe: 'side', swap: 'side', bignumber: { center: 'top', left: 'none' }, pullquote: 'top',
  myth: 'side', dodont: 'side', callout: 'auto', qa: { chat: 'top', card: 'top', split: 'none' }, numbered: 'side', tip: 'auto', definition: { dict: 'auto', card: 'top' },
  faq: 'side', script: 'auto', quiz: 'side', testimonial: { card: 'top', photo: 'none' }, exercise: { photo: 'none', plain: 'side' }, acronym: 'side',
  closing: 'top', outro: 'top', recap: 'side', prompt: 'top', action: 'icon', profile: { photo: 'none', card: 'top' },
};
/* How much text a slide carries: title characters count double and a bit, they are set three times larger */
function textLoad(s, keys) {
  let n = 0;
  const walk = (spec, v, isTitle) => {
    if (v === undefined || v === null || !spec) return;
    if (spec.type === 'text' && typeof v === 'string' && !spec.within && !spec.meta) n += v.length * (isTitle ? 2.2 : 1);
    if (spec.type === 'list' && Array.isArray(v)) v.forEach(x => walk(spec.item, x));
    if (spec.type === 'object' && typeof v === 'object') for (const [k, f] of Object.entries(spec.fields)) walk(f, v[k]);
  };
  for (const [k, spec] of Object.entries(keys)) walk(spec, s[k], k === 'title');
  return n;
}
/** Where a slide's illustration goes, or null when its layout has no room for one. */
export function artPlace(s) {
  const c = COMPONENTS[s.component];
  if (!c) return null;
  const p = c.custom ? (c.graphic || c.title === 'inside' ? 'none' : 'side') : ART_PLACE[s.component];
  const v = c.keys.variant ? s.variant || c.keys.variant.default : null;
  let at = p && typeof p === 'object' && !('auto' in p) ? p[v] : p;
  if (at === 'auto' || (at && typeof at === 'object')) at = textLoad(s, c.keys) <= ((at && at.auto) || 240) ? 'top' : 'side';
  return at && at !== 'none' ? at : null;
}
/** Whether a slide shows a picture: its layout is one, or it carries an illustration, a character or a photo. */
export function hasVisual(s) {
  const c = COMPONENTS[s.component];
  if (!c) return true;
  const v = c.keys.variant ? s.variant || c.keys.variant.default : null;
  const own = c.custom ? c.graphic : VISUAL[s.component];
  return own === true || (Array.isArray(own) && own.includes(v)) || !!s.art || (s.character && s.character !== 'none');
}
for (const [id, c] of Object.entries(COMPONENTS)) {
  const p = c.custom ? (c.graphic || c.title === 'inside' ? null : 'side') : ART_PLACE[id];
  if (!p || c.keys.art) continue;
  const vs = p && typeof p === 'object' && !('auto' in p) ? Object.entries(p).filter(([, x]) => x !== 'none').map(([v]) => v) : null;
  c.keys.art = vs ? only(art(), ...vs) : art();
}

/** Keys every slide carries. `name` and `goal` describe the slide; they are not printed on it. */
export const SLIDE_KEYS = {
  name: { type: 'text', required: true, chars: 24, meta: true },
  theme: { type: 'enum', values: ['light', 'dark'], required: true },
  component: { type: 'enum', values: Object.keys(COMPONENTS), required: true },
  motion: { type: 'enum', values: MOTION_NAMES },
  goal: { type: 'text', chars: 120, meta: true },
};

export const roleOf = name => (COMPONENTS[name] && COMPONENTS[name].role) || 'body';
export const OPENERS = Object.keys(COMPONENTS).filter(k => COMPONENTS[k].role === 'open');
export const CLOSERS = Object.keys(COMPONENTS).filter(k => COMPONENTS[k].role === 'close');
