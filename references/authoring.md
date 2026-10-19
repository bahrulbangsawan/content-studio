# Membuat komponen baru

Komponen baru boleh dibuat bila isi postingan punya bentuk yang belum bisa dibawa komponen yang ada. Komponen itu menjadi bagian katalog dan bisa dipakai lagi di postingan lain, jadi standarnya sama dengan komponen inti: dipilih karena bentuk isinya, tanpa pola AI, dan rapi di isi terpendek maupun terpanjang.

Tiga hal itu diperiksa oleh gerbang `component.mjs check`. Komponen yang belum lolos tidak bisa dipakai di `post.json`: scan dan build menolaknya.

Isi:

1. Cek dulu: pakai ulang
2. Alur kerja
3. Anatomi berkas
4. Field
5. Design system
6. Tanpa pola AI
7. Kerapian
8. Gerbang dan lembar uji
9. Tinjauan visual
10. Mengubah atau menghapus

## 1. Cek dulu: pakai ulang

Sebelum menulis komponen, turuni tangga ini dan berhenti di anak tangga pertama yang cukup:

1. **Komponen yang ada.** Jalankan `node component.mjs list`, baca tabel "Memilih komponen" di `components.md`, dan buka katalog (`catalog.mjs --brand <akun>`) untuk melihat bentuknya.
2. **Varian lain** dari komponen yang paling dekat (`variant`).
3. **Gerak lain** (`motion`), bila yang terasa membosankan hanya geraknya.
4. **Ubah bentuk isinya**: persingkat, pecah ke dua slide, atau tulis ulang sebagai butir sejajar.
5. **Komponen baru**, bila isinya punya bentuk yang memang belum ada. Contoh: tiga pilihan yang dinilai pada aspek yang sama (dibaca silang baris dan kolom), dua sumbu dengan nilai di setiap sel, atau urutan yang bercabang.

Alasan yang sah adalah bentuk isi dan hubungan antarbutir yang tidak bisa digambar komponen yang ada. Alasan yang tidak sah: ingin variasi, bosan dengan tampilannya, ingin warna atau hiasan lain, atau teks terlalu panjang (persingkat teksnya).

Buat komponen untuk bentuk isi, bukan untuk satu postingan. Beri nama dan field yang umum (`options`, `rows`, `items`), bukan nama topik (`sepatu`, `tangga`), supaya postingan lain bisa memakainya.

Tulis hasil pengecekan ini di `reuse` (lihat bagian 3). Gerbang menghitung komponen yang paling mirip bentuk field-nya dan meminta alasan untuk masing-masing. Komponen lain yang mirip maknanya juga sebaiknya dibahas walau tidak diminta.

## 2. Alur kerja

```bash
cd <project>                                    # workspace ./content-studio dengan akun yang sudah ada
node ~/.claude/skills/content-studio/scripts/component.mjs list
node ~/.claude/skills/content-studio/scripts/component.mjs new --id <id> [--role open|close]
#   tulis ~/.claude/skills/content-studio/components/<id>.mjs
node ~/.claude/skills/content-studio/scripts/component.mjs check --id <id>
#   lihat content-studio/checks/<id>/lembar*.png, perbaiki, ulangi check
node ~/.claude/skills/content-studio/scripts/catalog.mjs --brand <akun>
```

`id` berisi huruf kecil dan angka saja, 3 sampai 24 karakter, dan tidak boleh sama dengan komponen inti. `new` menulis kerangka berisi TODO; gerbang menolak selama TODO masih ada.

Ulangi `check` sampai galatnya nol, lalu lihat lembar ujinya sendiri (bagian 9). Galat nol belum berarti bagus: gerbang mengukur, mata yang menilai. Perbaiki juga peringatan yang bisa diperbaiki.

Setelah lolos, pakai komponennya di `post.json`, lalu scan, build, dan verify seperti biasa. Di laporan ke pengguna, sebutkan bahwa ada komponen baru, kenapa komponen yang ada tidak cukup, dan path lembar ujinya.

## 3. Anatomi berkas

Satu komponen adalah satu berkas `components/<id>.mjs` di folder skill. Contoh lengkap yang lolos gerbang, `components/compare.mjs`:

```js
import { title, text, list, obj, variant, esc, M, note } from '../scripts/lib/kit.mjs';

export default {
  id: 'compare',
  label: 'Bandingkan',
  motion: 'cascade',
  visual: 'Tabel pilihan di kolom dan aspek di baris',
  goal: 'Dua atau tiga pilihan yang dibandingkan pada aspek yang sama.',
  spec: 'Kepala kolom 32/40, isi 32/40, aspek 30/38, garis baris 2 px',
  rule: 'Setiap baris mengisi semua kolom. Varian focus menandai kolom terakhir, jadi taruh pilihan yang disarankan paling akhir.',
  variants: { table: 'Tabel bergaris', focus: 'Kolom terakhir, pilihan yang disarankan, beraksen' },
  reuse: {
    need: 'Tiga pilihan yang dinilai pada dua sampai empat aspek yang sama, sehingga pembaca membaca silang baris dan kolom.',
    checked: {
      pairs: 'Pairs hanya punya dua kolom dan setiap baris berdiri sendiri, tidak ada aspek bersama.',
      matrix: 'Matrix adalah kuadran dua kali dua dengan sumbu, bukan nilai per pilihan.',
      // ... satu alasan untuk setiap komponen yang diminta gerbang
    },
  },
  keys: {
    variant: variant('table', 'focus'),
    title: title(),
    options: list(2, 3, text(2, 14, true, 10)),
    rows: list(2, 4, obj({ aspect: text(2, 14, true, 11), cells: list(2, 3, text(2, 14, true, 10)) })),
    note: text(10, 60),
  },
  validate: s => {
    const n = Array.isArray(s.options) ? s.options.length : 0;
    return (Array.isArray(s.rows) ? s.rows : []).flatMap((r, k) => (r && Array.isArray(r.cells) && r.cells.length !== n ? [`rows[${k}].cells: ${r.cells.length} isi, harus ${n} sesuai jumlah options.`] : []));
  },
  sample: {
    title: 'Memilih sepatu pertama anak.',
    options: ['Sol tipis', 'Sol tebal', 'Telanjang'],
    rows: [
      { aspect: 'Merasakan', cells: ['Cukup', 'Kurang', 'Paling baik'] },
      { aspect: 'Melindungi', cells: ['Cukup', 'Baik', 'Kurang'] },
      { aspect: 'Cocok untuk', cells: ['Luar rumah', 'Jalan jauh', 'Di rumah'] },
    ],
    note: 'Di rumah, biarkan anak bertelanjang kaki.',
  },
  render(s, ctx) {
    const n = s.options.length;
    const col = k => (ctx.variant === 'focus' && k === n - 1 ? ' compare-focal' : '');
    const head = `<div class="compare-row compare-head"${M('text', 'Kepala kolom')}><span class="compare-aspect"></span>${s.options.map((o, k) => `<span class="compare-opt${col(k)}">${esc(o)}</span>`).join('')}</div>`;
    const rows = s.rows.map((r, i) => `<div class="compare-row"${M('item', `Baris ${i + 1}`)}><span class="compare-aspect">${esc(r.aspect)}</span>${r.cells.map((c, k) => `<span class="compare-cell${col(k)}">${esc(c)}</span>`).join('')}</div>`).join('');
    return `<div class="ds-main compare-table" style="--n: ${n}">${head}${rows}</div>${note(s)}`;
  },
  css: `
.x-compare .compare-table { display: flex; flex-direction: column; }
.x-compare .compare-row { display: grid; grid-template-columns: 216px repeat(var(--n), minmax(0, 1fr)); column-gap: 24px; align-items: center; padding: 20px 0; border-top: 2px solid var(--s-rule-2); }
.x-compare .compare-row:last-child { border-bottom: 2px solid var(--s-rule-2); }
.x-compare .compare-head { padding: 0 0 16px; border-top: 0; }
.x-compare .compare-aspect { font-size: 30px; line-height: 38px; font-weight: 500; color: var(--s-muted); }
.x-compare .compare-opt { font-size: 32px; line-height: 40px; font-weight: 700; }
.x-compare .compare-cell { font-size: 32px; line-height: 40px; font-weight: 600; }
.x-compare .compare-focal { color: var(--s-joint); }
`,
};
```

| Field | Wajib | Isi |
| --- | --- | --- |
| `id` | ya | Sama dengan nama berkas |
| `label` | ya | Nama pendek, maksimal 24 karakter. Tampil di katalog dan panduan |
| `role` | tidak | `open` (hanya slide pertama) atau `close` (hanya slide terakhir). Kosong untuk slide isi |
| `motion` | ya | Gerak bawaan, salah satu preset di `components.md`. Pilih yang belum dipakai komponen serupa |
| `visual`, `goal`, `spec`, `rule` | ya | Satu kalimat masing-masing: bentuk visual, bentuk isi yang dibawa, ukuran utama, aturan pakai. Tampil di katalog dan panduan |
| `variants` | tidak | `{ nama: 'Deskripsi' }`, minimal dua. Wajib berpasangan dengan `keys.variant` |
| `keys` | ya | Field isi; lihat bagian 4. `title` wajib |
| `validate` | tidak | `s => [pesan galat]` untuk aturan yang melibatkan beberapa field atau satu varian |
| `title` | tidak | `'top'` (bawaan): engine memasang judul di atas. `'inside'`: render menaruh `ctx.title` sendiri, misalnya di dalam kartu |
| `align` | tidak | `'center'` untuk tata letak rata tengah. Bawaan rata kiri |
| `ordered` | tidak | `true` bila komponen menampilkan nomor urut. Tanpa ini, nomor yang berdiri sendiri ditolak |
| `titleWords` | tidak | Batas kata judul khusus komponen ini |
| `reuse` | ya | `need`: satu kalimat, minimal 8 kata, tentang bentuk isi yang tidak bisa dibawa komponen lain. `checked`: `{ komponen: 'alasan' }` |
| `sample` | ya | Isi contoh yang realistis dan lolos scan di setiap varian. Dipakai katalog dan gerbang |
| `render` | ya | `(s, ctx) => markup` untuk isi di bawah judul |
| `css` | ya | Gaya komponen. Setiap pemilih diawali `.x-<id>` |

Kontrak render:

- Engine membungkus hasil render dengan `<div class="group x-<id> v-<varian>">` dan memasang judul lebih dulu: `h2` 84 px untuk slide isi, `h1` 104 px untuk pembuka dan penutup. Karena itu tidak ada label atau badge yang bisa muncul di atas judul.
- `ctx` berisi `icons` (katalog ikon), `title` (markup judul, untuk `title: 'inside'`), `variant`, dan `split` (preset kata demi kata sedang aktif).
- Setiap teks dari `post.json` melewati `esc()`. Gerbang menguji ini dengan menyisipkan markup ke isi contoh.
- Setiap elemen yang membawa teks punya gerak masuk `M(peran, label)` atau berada di dalam elemen yang punya. Garis dan batang memakai `DRAW(sumbu, label)`.
- Kelas yang dipakai: `<id>-*` untuk komponen ini, `v-*` untuk varian, `ds-*` dari kit, dan kelas engine yang dibagi: `lede`, `small`, `body-l`, `x-lead`, `x-note`, `cta`, `cta-ic`, `cta-t`, `ic`. Kelas lain bisa membawa gaya komponen lain. Untuk label kecil di samping atau di kepala kolom, pakai `ds-meta` atau `ds-tag`.
- Atribut `style` hanya untuk variabel (`--n: 3`). Gaya ditulis di `css`.
- Foto dan video hanya lewat `mediaEl(ctx, s.media, '<id>-foto', 'Foto')` dari kit. Kelas ketiga (milik komponen) menentukan ukuran dan bentuk bingkainya (tinggi, radius); foto mengisi bingkai dan dipotong di sekitar `focus`. Teks tidak ditulis di atas foto kecuali di kartu padat atau chip. Tag `<img>` dan `<video>` lain ditolak gerbang. Tambahkan kelas `bleed` pada bingkai yang boleh melebar sampai tepi kanvas.
- SVG hanya untuk garis dan bentuk sederhana, dengan `aria-hidden="true"`, tanpa teks. Ikon selalu dari `iconSvg(ctx.icons, nama, 'ic ds-ic')`.
- Komponen penutup (`role: 'close'`) memakai `cta(s.cta, ctx)` dari kit untuk ajakannya. Disclaimer dan handle dipasang engine di footer.
- Setiap slide wajib bergambar. Engine memberi komponen buatan field `art` dan menaruh ilustrasinya di samping judul, jadi `render` tidak perlu menggambarnya. Komponen yang sudah berupa gambar (diagram, grafik, deret ikon, foto) menulis `graphic: true`; ia tidak mendapat `art` dan dianggap bergambar. Jangan menggambar ilustrasi sendiri di SVG komponen.

## 4. Field

Semua field dibuat dengan pembantu dari `scripts/lib/kit.mjs`:

| Pembantu | Untuk |
| --- | --- |
| `title(words = 'titleMax', chars = 60)` | Judul. Pakai `'coverTitleMax'` untuk pembuka dan penutup |
| `text(words, chars, required = false, wordChars)` | Teks. `wordChars` adalah huruf terbanyak per kata yang muat di kotak sempit |
| `numeral(chars = 6)` | Angka singkat: `60`, `3x`, `80%` |
| `phrase(field, words, chars)` | Frasa yang disalin persis dari field lain sebagai kata utuh, misalnya kata yang disorot. `findPhrase(teks, frasa)` mencari letaknya untuk `render` |
| `only(spec, ...varian)` | Field yang hanya digambar beberapa varian. Di varian lain scan menolaknya; di variannya `required` berlaku. Contoh: `focus: only({ ...phrase('title', 3, 14), required: true }, 'highlight', 'strike')` |
| `list(min, max, item)` | Daftar 1 sampai 6 butir |
| `obj({ ... }, required = true)` | Objek berisi field lain |
| `icon(required = true)` | Nama ikon dari katalog |
| `variant(...nama)` | Pilihan tata letak; yang pertama menjadi bawaan |
| `choice(...nilai)` | Pilihan tetap yang bukan tata letak, misalnya tahap ke berapa yang ditampilkan slide ini |
| `bool(bawaan)` | Ya atau tidak |
| `num(min, max, required = true)` | Angka bulat dalam rentang, misalnya posisi titik dalam persen |
| `media(required = true, kinds = ['image', 'video'])` | Foto atau video dari `posts/<slug>/media/`: `{ src, alt, focus, still }`. `kinds: ['image']` untuk tempat yang hanya menerima foto |
| `budget(butir, maks, path)` | Untuk `validate`: total karakter beberapa butir |
| `longWords(nilai, maks, path)` | Untuk `validate`: batas huruf per kata yang hanya berlaku di satu varian |

Aturannya:

- Setiap field teks punya batas kata dan karakter. Batas itu yang menjamin teks muat; jangan mengandalkan pemotongan.
- Field berisi isi, bukan gaya. Nama seperti `color`, `size`, `style`, `position` ditolak.
- Bila sebuah kotak sempit, beri `wordChars`. Kata Indonesia bisa sampai 15 huruf (`perkembangannya`), dan kata yang lebih lebar dari kotaknya terpotong di tengah. Bila hanya satu varian yang sempit, pakai `validate` dengan `longWords`.
- Untuk memperkirakan batas: satu baris memuat kira-kira lebar kotak dibagi (0,55 x ukuran huruf) karakter. Kotak 400 px dengan huruf 36 px memuat sekitar 20 karakter per baris. Gerbang lalu membuktikan batas itu dengan isi terpanjang.
- Varian yang lebih enak dibaca dengan kata-katanya sendiri boleh punya contoh sendiri di `samples: { <varian>: { ...field } }`; isinya menimpa `sample` untuk varian itu. Gerak bawaan per varian ditulis di `motions: { <varian>: '<preset>' }`.
- Isi uji dibuat dari batas field: pilihan (`choice`) memakai nilai bawaannya, `bool` bergantian benar dan salah, `num` tersebar dari ujung ke ujung rentangnya, `media` memakai foto dan video contoh dari `assets/media/`, daftar memakai jumlah butir terbanyak dan tersedikit. Bila `validate` menolak semua isi yang bisa dibuat dari batas itu, gerbang melaporkan "Isi uji tidak bisa dibuat". Artinya batas dan `validate` saling bertentangan; selaraskan keduanya, misalnya buat `validate` menerima nilai bawaan.

## 5. Design system

Komponen baru disusun dari nilai yang sama dengan komponen inti. Gerbang menolak nilai di luar daftar ini.

### Warna

Hanya token. Nilainya datang dari akun dan tema, jadi komponen tampil benar di semua akun, terang maupun gelap.

| Token | Untuk |
| --- | --- |
| `--s-bg` | Latar slide |
| `--s-card` | Latar kartu |
| `--s-ink` | Teks utama |
| `--s-muted` | Teks pendukung, hanya di atas `--s-bg` atau `--s-card` |
| `--s-joint` | Aksen: ikon, penanda, satu kata kunci, satu kolom yang disarankan |
| `--s-sun` | Sorotan, satu penanda per slide |
| `--s-face` | Teks di atas sorotan |
| `--s-rule`, `--s-rule-2` | Garis netral tipis dan sedang |

`color-mix(in srgb, var(--s-a) N%, var(--s-b))` boleh, asal kedua sisinya token.

**Kartu tetap terang di slide gelap.** Setiap pemilih yang menulis `background: var(--s-card)` otomatis mendapat palet terang di slide gelap: di dalam kartu itu `--s-ink`, `--s-muted`, `--s-joint`, `--s-bg`, dan garis kembali ke nilai tema terang, jadi kartu dan isinya tampil sama di kedua tema. Kamu tidak perlu menulis apa pun untuk tema gelap. Dua hal yang perlu diingat:

- Latar kartu ditulis persis `background: var(--s-card)` di aturannya sendiri, supaya engine menemukannya. Kotak bergaris tanpa latar (`ds-box`) tetap mengikuti tema slide.
- Di dalam kartu, jangan memakai `color: inherit`: warnanya akan terbawa dari slide gelap. Pakai token (`var(--s-ink)` dan seterusnya), atau biarkan kosong.

Gerbang menolak kartu berwarna kartu gelap di slide gelap, dan kontras diukur terhadap kartu terangnya.

### Huruf

Font datang dari akun; komponen hanya mengatur ukuran, tinggi baris, dan tebal. Skala ukuran: 30, 32, 34, 36, 40, 44, 48, 56, 64, 72, 84, 92, 104 px, ditambah 128 dan 160 px khusus angka pendek. Tebal: 400, 500, 550, 600, 650, 700.

| Peran | Ukuran | Kelas kit |
| --- | --- | --- |
| Judul pembuka dan penutup | 104/110, 700 | dipasang engine |
| Judul slide isi | 84/92, 700 | dipasang engine |
| Kalimat kunci | 44/56, 700 | `ds-strong` |
| Kalimat dan paragraf | 40/54, 400 | `ds-body` |
| Kepala di dalam kartu | 40/48, 650 | `ds-head` |
| Butir dan isi kartu | 36/46, 650 | `ds-item` |
| Teks pendukung | 34/44, 400, `--s-muted` | `ds-sub` |
| Label sebaris | 32/40, 650, `--s-joint` | `ds-tag` |
| Keterangan kecil | 30/38, 500, `--s-muted` | `ds-meta` |
| Nomor urut | 56/64, 700, `--s-joint` | `ds-num` |

Tinggi baris: rasio 1,15 sampai 1,6 untuk huruf di bawah 56 px, 1,0 sampai 1,3 untuk yang lebih besar. Hierarki datang dari ukuran dan tebal, bukan dari huruf kapital, huruf miring, atau jarak huruf.

### Jarak

Margin, padding, dan gap bergerak per 4 px, maksimal 160 px. Langkah yang paling sering: `--sp-1` 8, `--sp-2` 12, `--sp-3` 16, `--sp-4` 20, `--sp-5` 24, `--sp-6` 32, `--sp-7` 40, `--sp-8` 48.

| Hubungan | Jarak |
| --- | --- |
| Judul ke isi pertama | 40 px (`ds-main`) |
| Di dalam satu butir (kepala ke teks) | 4 sampai 12 px |
| Antar butir atau kartu | 16 sampai 24 px, atau baris bergaris (`ds-rows`) |
| Antar kolom | 20 sampai 32 px |
| Padding kartu | 28 x 32 px (`ds-card`) |
| Isi ke catatan penutup | catatan bergaris `x-note` (36 px) |

Yang berhubungan dekat, yang berbeda kelompok diberi jarak lebih. Jarak yang sama di mana-mana menyembunyikan mana yang satu kelompok.

### Radius dan garis

Radius 0, 8, 12, 16, 20, 24, 28 px; 20 untuk kartu, 12 untuk kotak kecil, `999px` untuk chip satu baris, `50%` untuk lingkaran. Garis paling tebal 2 px dan selalu `--s-rule` atau `--s-rule-2`.

### Kit `ds-*`

| Kelas | Isi |
| --- | --- |
| `ds-card` | Kartu: latar `--s-card`, radius 20, padding 28 x 32 |
| `ds-box` | Kotak bergaris: garis 2 px, radius 12, padding 20 x 24 |
| `ds-chip` | Chip satu baris: kapsul, 32/40, tidak pindah baris |
| `ds-focal`, `ds-solid`, `ds-invert` | Satu butir yang ditekankan: sorotan, aksen penuh, atau tinta. Warna teks di dalamnya ikut menyesuaikan |
| `ds-rows` | Butir bergaris di atas dan bawah, padding 20 px |
| `ds-main` | Jarak 40 px dari judul |
| `ds-stack`, `ds-row`, `ds-cols` | Kolom, baris, dan kisi; atur dengan `--gap` dan `--cols` |
| `ds-ic`, `ds-ic-s` | Ikon 56 px dan 40 px berwarna aksen, tanpa wadah |
| `ds-head`, `ds-strong`, `ds-body`, `ds-item`, `ds-sub`, `ds-meta`, `ds-tag`, `ds-num` | Peran huruf di tabel di atas |
| `ds-muted`, `ds-accent` | Warna teks pendukung dan aksen |

Susun dari kit dulu. Tulis CSS sendiri hanya untuk tata letak yang memang baru (kisi tabel, posisi garis), dan tetap pakai nilai dari skala.

### Gerak

Gerak masuk diatur engine. Komponen hanya memberi peran: `M('title' | 'text' | 'item' | 'art', label)`, dan `DRAW('x' | 'xc' | 'y' | 'pop' | 'reveal', label)` untuk garis yang tergambar. Setiap preset memadatkan jadwalnya sehingga elemen terakhir diam sebelum 1,2 detik, dan gerbang memeriksanya di semua preset. CSS komponen tidak memakai `animation`, `transition`, `transform`, atau `opacity`, karena properti itu dipakai engine untuk gerak dan ekspor MP4.

## 6. Tanpa pola AI

Berangkat dari daftar pola di impeccable.style/slop. Kolom terakhir menyebut di mana pola itu ditangkap: CSS (lint gaya), browser (pengukuran di lembar uji), atau tinjauan (mata kamu di bagian 9).

| Pola | Kenapa dihindari | Yang dipakai | Ditangkap |
| --- | --- | --- | --- |
| Garis aksen tebal di satu sisi kartu (side-tab) | Kartu terlihat seperti peringatan | Latar kartu, atau garis penuh 2 px netral | CSS, browser |
| Garis kartu tebal atau berwarna aksen | Bersaing dengan isinya | Garis 2 px `--s-rule-2`, atau latar saja | CSS, browser |
| Bayangan, glow, kaca buram | Hiasan tanpa fungsi | Latar `--s-card` | CSS, browser |
| Gradien, latar bergaris, teks bergradien | Mengisi ruang dengan derau | Satu warna token | CSS, browser |
| Radius ekstrem pada kartu | Semua kartu tampak sama dan sempit | Radius dari skala | CSS, browser |
| Label atau badge di atas judul | Baris tambahan yang mengulang judul | Masukkan ke judul atau ke isi | engine, browser |
| Ikon di dalam kotak atau lingkaran, terutama di atas judul | Pola kartu fitur yang generik | Ikon di samping teks, tanpa wadah | browser |
| Huruf kapital semua, tracking lebar, tracking rapat | Sulit dibaca | Hierarki dari ukuran dan tebal | CSS, browser |
| Huruf miring besar, huruf berongga, huruf atau tanda baca raksasa | Hiasan tipografi | Huruf penuh dari skala; angka besar hanya untuk angka | CSS, browser |
| Hierarki datar | Judul dan isi sulit dibedakan | Judul engine, lalu peran huruf yang jelas berbeda | tinjauan |
| Nomor tanpa urutan | Mengesankan urutan yang tidak ada | Titik atau garis pemisah; nomor hanya bila `ordered` | browser |
| Deretan kartu ikon-judul-teks yang identik | Semua poin sama berat | Kelompokkan, atau tekankan satu | browser (peringatan), tinjauan |
| Kartu di dalam kartu | Lapisan tanpa makna | Ratakan dengan jarak dan garis | browser |
| Bentuk hiasan tanpa isi, ilustrasi kasar | Terlihat seperti placeholder | Hapus, atau pakai ikon dari katalog | browser, lint markup |
| Teks yang sama berulang di setiap baris atau kartu | Pembaca membaca label yang sama berkali-kali | Tulis sekali sebagai kepala kolom | browser |
| Teks abu-abu di atas latar berwarna | Pudar | Warna teks pasangan latar itu | browser |
| Emoji sebagai ikon | Gaya ikon tidak konsisten | Ikon dari katalog | browser |
| Gerak memantul atau elastis, animasi hiasan | Ramai tanpa arti | Preset engine yang melambat lalu diam | engine |
| Kalimat slogan "X, bukan Y" di banyak slide | Setiap poin terdengar seperti tagline | Sampaikan poinnya langsung | scan |

Pola di tingkat akun (font yang terlalu umum, palet krem) diputuskan pemilik akun lewat `brand.mjs`, bukan oleh komponen.

## 7. Kerapian

Angka di bawah dipakai gerbang. Semuanya diukur di slide 1080 x 1350.

- **Tidak offside.** Semua isi berada di zona konten 888 x 1014 (x 96 sampai 984, y 168 sampai 1182), di setiap kasus uji.
- **Teks di dalam kotaknya.** Tidak ada baris yang melewati sisi kotak atau kartunya, dan tidak ada teks yang tertutup elemen lain atau menimpa teks lain.
- **Kata utuh.** Tidak ada kata yang terpotong di tengah, termasuk kata 15 huruf. Atur `wordChars`, lebar kotak, atau ukuran huruf.
- **Padding kartu.** Jarak teks dan ikon ke tepi dalam: kartu (radius 16 ke atas) minimal 24 px di kiri dan kanan serta 16 px di atas dan bawah; kotak kecil (radius di bawah 16) 16 dan 12; lencana sampai 96 px minimal 8; chip minimal 16 dan 6. Ruang atas dan bawah yang tidak seimbang diberi peringatan.
- **Judul dan isi.** Ruang kosong antara huruf judul dan isi pertama minimal 24 px (`ds-main` memberi 40 px). Lebih dari 160 px membuat judul terlihat lepas.
- **Ritme.** Di daftar butir yang masing-masing punya lebih dari satu teks, jarak di dalam butir harus lebih kecil dari jarak antar butir.
- **Ruang di sekitar kartu.** Dua kartu bersebelahan, atau teks di luar kartu, berjarak minimal 8 px dari tepi kartu (biasanya 16 sampai 24 px).
- **Satu garis, bukan dua.** Dua garis sejajar tanpa isi di antaranya terlihat seperti garis yang tergambar dua kali, misalnya garis bawah baris terakhir lalu garis atas catatan. Lepas salah satunya; `ds-rows` sudah melepas garis bawahnya bila diikuti `x-note`.
- **Tinggi baris.** Teks lebih dari satu baris memakai rasio dari bagian 5.
- **Kontras.** Minimal 4,5:1 untuk teks di bawah 44 px dan 3:1 untuk yang lebih besar, diukur terhadap latar yang benar-benar ada di belakangnya, di tema terang dan gelap.
- **Ukuran.** Teks minimal 30 px (`minTextPx` akun).
- **Kapsul satu baris.** Chip berbentuk kapsul tidak boleh berisi dua baris; gunakan kartu radius 20.
- **Rata kiri untuk teks panjang.** Paragraf rata tengah lebih dari tiga baris diberi peringatan.
- **Satu penekanan per slide.** Sorotan atau aksen penuh untuk satu butir saja.

## 8. Gerbang dan lembar uji

`component.mjs check --id <id>` menjalankan, berurutan:

1. **Definisi**: field wajib, preset gerak, varian, field isi, tanpa TODO.
2. **Pakai ulang**: komponen terdekat menurut bentuk field-nya, masing-masing wajib punya alasan di `reuse.checked`.
3. **CSS terhadap design system**: pemilih diawali `.x-<id>`, properti dan nilai dari bagian 5, tanpa pola di bagian 6.
4. **Contoh dan isi uji**: `sample` lolos scan di setiap varian, dan engine bisa membuat tiga isi uji dari batas field-nya.
5. **Markup**: tag, atribut, kelas, SVG, satu judul, dan `esc()` pada semua teks.
6. **Gerak masuk**: elemen terakhir diam sebelum 1,2 detik di semua preset.
7. **Di browser**: setiap varian dirender di tema terang dan gelap dengan empat isi, lalu diukur menurut bagian 6 dan 7:
   - `contoh`: isi `sample`
   - `terpanjang`: setiap field di batas terpanjangnya, setiap daftar di jumlah butir terbanyak
   - `tersingkat`: butir paling sedikit, kata pendek, field opsional dikosongkan
   - `kata-panjang`: teks dari kata Indonesia terpanjang yang diizinkan field-nya

Lembar uji tersimpan di `content-studio/checks/<id>/lembar-<varian>.png`: satu baris per isi uji, terang di kiri dan gelap di kanan. Kotak merah menandai galat, kotak kuning putus-putus menandai peringatan. Lihat dengan alat baca gambar.

Bila semuanya lolos, gerbang menulis `components/<id>.pass.json` (sidik jari berkas komponen dan engine) dan memperbarui `components/README.md`. Catatan itu hanya ditulis oleh gerbang; jangan dibuat atau diedit sendiri. Bila berkas komponen atau engine berubah, catatannya tidak cocok lagi dan scan meminta `check` diulang.

| Pesan | Perbaiki dengan |
| --- | --- |
| Isi keluar dari zona konten | Kurangi batas karakter atau jumlah butir, atau buat tata letak lebih pendek |
| Kata "..." terpotong di tengah | `wordChars` pada field itu, kotak lebih lebar, atau huruf satu langkah lebih kecil |
| Teks terlalu mepet ke sisi kartu | Padding dari skala; `ds-card` sudah memberi 28 x 32 |
| Isi terlalu dekat dengan judul | `ds-main` pada blok pertama |
| Teks muncul N kali padahal isinya lebih sedikit | Label diulang di setiap butir; jadikan satu kepala kolom |
| Jarak di dalam butir tidak lebih kecil dari jarak antar butir | Rapatkan kepala dan teks di dalam butir, renggangkan antar butir |
| Kontras di bawah batas | Warna teks pasangan latarnya (`--s-ink` di `--s-card`, `--s-face` di `--s-sun`, `--s-bg` di `--s-joint`) |
| Isi uji tidak bisa dibuat dari batas field | Batas `words`, `chars`, `budget`, dan `validate` saling bertentangan; selaraskan |
| Kelas bukan milik komponen ini | Awali dengan `<id>-`, atau pakai kelas `ds-*` |
| Dua garis sejajar tanpa isi di antaranya | Lepas garis bawah baris terakhir bila diikuti catatan, misalnya `.x-<id> .<id>-list:has(+ .x-note) > :last-child { border-bottom: 0; }` |
| Dua kartu hanya berjarak N px | Gap dari skala di antara kartu, 16 sampai 24 px |

`component.mjs audit [--id a,b] [--sheets]` menjalankan pemeriksaan browser yang sama pada komponen inti. Semua komponen inti lolos; jalankan setelah engine diperbarui.

## 9. Tinjauan visual

Gerbang tidak bisa menilai semuanya. Lihat lembar ujinya dan tanyakan:

- Apakah bentuk visualnya membawa makna isinya? Tabel untuk baca silang, garis untuk urutan, kartu untuk butir yang berdiri sendiri.
- Apakah slide ini terlihat sekeluarga dengan komponen inti di katalog: ukuran judul, kepadatan, warna, sudut?
- Apakah hanya ada satu hal yang ditekankan, dan memang hal yang paling penting?
- Apakah isi `tersingkat` tetap terlihat disengaja, bukan kosong? Apakah isi `terpanjang` tetap lega?
- Apakah ada bentuk atau garis yang bisa dihapus tanpa kehilangan informasi? Kalau ada, hapus.
- Apakah gerak masuknya mengikuti urutan membaca? Putar di katalog setelah komponen lolos.

## 10. Mengubah atau menghapus

- **Mengubah**: edit berkasnya, lalu jalankan `check` lagi. Gerbang memindai ulang postingan di workspace yang memakai komponen itu dan melaporkan yang tidak lolos lagi. Halaman yang sudah dibangun tidak berubah sampai dibangun ulang.
- **Menambah varian atau field opsional** lebih aman daripada mengubah field yang ada, karena `post.json` lama tetap sah.
- **Menghapus**: pastikan tidak ada postingan yang memakainya (cari `"component": "<id>"` di `posts/`), lalu hapus `components/<id>.mjs` dan `components/<id>.pass.json`, dan buat ulang katalognya.
- **Engine diperbarui**: semua komponen buatan perlu `check` ulang. Scan menyebut komponen mana saja.
