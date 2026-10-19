---
name: content-studio
description: Membuat carousel Instagram per postingan (1080 x 1350) sebagai satu halaman studio HTML mandiri berisi pratinjau slide yang bisa digeser, pemeriksaan aturan otomatis, panduan desain, dan unduhan PNG, MP4, serta ZIP, dari satu berkas post.json dengan design system akun yang dikunci. Pakai skill ini setiap kali pengguna ingin membuat, mengedit, memeriksa, atau mengekspor postingan carousel atau slide edukasi untuk Instagram, LinkedIn, atau media sosial lain; menyiapkan akun brand (logo, nama, handle, warna, font, disclaimer) untuk carousel; memberi link postingan Instagram (post, reel, carousel) sebagai contoh untuk dipelajari atau dibuat ulang; membuat atau memperbaiki komponen slide baru bila isi tidak cocok dengan komponen yang ada; atau menyebut content studio, carousel studio, konten carousel, slide IG, atau post edukasi bergambar, walau tidak menyebut kata skill.
---

# Content Studio

Skill ini mengubah isi postingan menjadi satu berkas `.html` per postingan. Berkas itu dibuka langsung di browser, tanpa artifact dan tanpa server, dan berisi:

- pratinjau carousel 1080 x 1350 yang bisa digeser, dengan animasi masuk dan karakter
- 49 ilustrasi satu gaya dengan akun (jam, anak berlari, jantung, sepatu, label, dan lainnya), sebagian bergerak pelan, untuk mendukung isi setiap slide
- 56 komponen slide inti dengan 137 tata letak, ditambah komponen buatan yang lolos gerbang komponen, dan 20 preset gerak masuk yang bisa dipilih per slide
- 35 tata letak cover (hook pertama) dan 13 tata letak penutup (ajakan), dengan beberapa alternatif cover dan penutup per postingan yang bisa dipilih langsung di studio
- foto dan video milik akun di cover, isi, dan penutup: tersemat di halaman, video diputar di slidenya, dan ikut terekam di PNG dan MP4
- pemeriksaan otomatis per slide (zona konten, keseimbangan, jumlah kata, panjang judul, teks terkecil, waktu animasi, tanpa ajakan mengetuk)
- panduan desain (anatomi slide, alur, tipografi, warna akun, gerak, komponen, aturan)
- unduhan PNG per slide, ZIP semua PNG, MP4 per slide, ZIP semua MP4, dan satu MP4 berurutan

Desainnya ketat karena tujuannya konsistensi: tampilan, warna, tipografi, dan gerak dikunci di engine dan di akun. Komponen tampil sama di slide terang dan gelap: di slide gelap hanya latarnya yang gelap, kartu tetap terang. Yang kamu tulis adalah isi. Bila isinya punya bentuk yang belum ada di katalog, kamu boleh menulis komponen baru, asal lolos gerbang komponen: cek pakai ulang, tanpa pola AI, dan rapi.

## Peta berkas

```
~/.claude/skills/content-studio/        SKILL (terkunci, kecuali components/)
  engine/parts/   tampilan, CSS, JS studio dan ekspor, kit design system ds-*
  engine/icons.json, fonts/, vendor/      katalog ikon, font bawaan Inter, mp4-muxer
  engine/LOCK.json                         sidik jari engine dan skrip
  scripts/        brand.mjs, new-post.mjs, ref.mjs, scan.mjs, build.mjs, verify.mjs, catalog.mjs, component.mjs, lock.mjs
  scripts/lib/kit.mjs                      field, markup, dan nilai design system untuk komponen
  components/     komponen buatan: <id>.mjs, <id>.pass.json (ditulis gerbang), README.md
  tools/          requirements.txt (versi gallery-dl), .venv/ yang dipasang otomatis oleh ref.mjs
  references/     components.md, authoring.md, rules.md, brand-setup.md
  assets/examples/ akun contoh Part of Physio dan post contoh
  assets/media/   foto dan video contoh (ilustrasi pengganti) untuk katalog dan gerbang

<project>/content-studio/               WORKSPACE (milik pengguna)
  brands/<akun>/  brand.json, logo-light.svg, logo-dark.svg, font.woff2, brand.lock
  posts/<slug>/   post.json, media/ (foto dan video akun), <slug>.html, preview/slide-N.png, cover-N.png, closing-N.png
  refs/<kode>/    ref.json, caption.txt, media/, frames/ (bahan dari link Instagram)
  catalog/<akun>.html  katalog semua komponen, varian, dan preset gerak dalam warna akun
  checks/<id>/    lembar uji gerbang komponen (PNG per varian)
```

Semua skrip memakai `./content-studio` di direktori kerja sebagai workspace (proyek lama yang masih punya `./carousel-studio` tetap terbaca). Pakai `--root <folder>` bila pengguna menyimpannya di tempat lain. Jalankan skrip dengan `node ~/.claude/skills/content-studio/scripts/<nama>.mjs`. Butuh Node 18 atau lebih baru.

## Batas sentuh

Batas ini ada supaya setiap postingan dari akun yang sama terlihat seperti satu keluarga, dan supaya keputusan brand tetap di tangan pemiliknya.

| Area | Boleh disentuh AI? | Cara yang benar |
| --- | --- | --- |
| `posts/<slug>/post.json`: teks, urutan slide, alternatif cover (`covers`) dan penutup (`closings`), field `media`, pilihan komponen, `variant`, `motion`, tema terang atau gelap, ikon dari katalog, karakter | Ya | Ikuti `references/components.md`, lalu scan |
| Membuat akun baru | Ya, setelah pemilik memberi data | Tanya pemilik (lihat `references/brand-setup.md`), tulis berkas jawaban, jalankan `brand.mjs init` |
| `posts/<slug>/media/`: foto dan video | Hanya berkas dari pemilik akun | Salin berkas yang diberi pemilik ke folder itu. Jangan mengambil foto dari internet atau dari postingan orang lain; tanpa berkas, slide memakai bingkai kosong |
| `brand.json`, logo, font, warna, aturan akun yang sudah ada | Hanya atas permintaan jelas pemilik | Ubah lewat `brand.mjs`, tunjukkan perubahannya, jalankan `accept` hanya setelah pemilik setuju |
| Batas aturan (`maxWordsPerSlide`, `titleMax`, dan lainnya) agar scan lolos | Tidak | Persingkat teksnya. Aturan dilonggarkan hanya bila pemilik akun meminta |
| `<slug>.html` hasil build | Tidak | Ubah `post.json`, lalu build ulang. Halaman akan tertimpa |
| `components/<id>.mjs`: komponen buatan | Ya, bila tidak ada komponen yang cocok | Ikuti `references/authoring.md`. Komponen baru dipakai hanya setelah lolos `component.mjs check` |
| `components/<id>.pass.json` dan `README.md` | Tidak | Ditulis gerbang saat komponen lolos. Jangan dibuat atau diedit sendiri |
| Folder skill lainnya: engine, CSS inti, skrip, ikon, font, LOCK.json | Tidak | Komponen baru ditulis di `components/`, bukan di engine. Kalau perlu fitur engine, jelaskan ke pengguna. `lock.mjs` hanya untuk pemilik skill saat memperbarui engine |
| Gaya di post.json (`style`, `color`, `fontSize`, posisi, HTML) | Tidak ada tempatnya | Scan menolak kunci yang tidak dikenal |
| `refs/<kode>/` hasil `ref.mjs` | Baca saja | Pelajari struktur dan idenya, lalu tulis isi baru. Teks dan gambar postingan orang tidak disalin ke slide |

`build.mjs` memeriksa sidik jari engine, akun, dan komponen buatan. Kalau engine berubah, build berhenti. Kalau akun berubah tanpa `accept`, build juga berhenti. Kalau komponen buatan berubah sejak lolos gerbang, scan memintamu menjalankan `check` lagi. Itu sinyal untuk berhenti dan memeriksa, bukan untuk dilewati.

## Alur kerja

### 1. Pastikan akunnya ada

```bash
node ~/.claude/skills/content-studio/scripts/brand.mjs list
```

Kalau belum ada akun untuk brand ini, siapkan bersama pemiliknya. Baca `references/brand-setup.md` untuk daftar pertanyaan, format berkas jawaban, nilai bawaan, dan aturan kontras. Jangan menebak logo, warna, handle, atau disclaimer. Itu identitas orang lain dan hanya mereka yang tahu nilainya. Kalau pengguna ingin mencoba dengan akun contoh, salin `assets/examples/partofphysio/` dan jalankan init dari `answers.json` di sana.

Status di `list`: **disetujui** (siap dipakai), **belum disetujui** (init belum lolos), atau **berubah sejak disetujui**. Selama akun belum disetujui, kamu tetap boleh menulis dan men-scan `post.json`, tapi build menolak. Kalau init gagal dan pemilik tidak bisa dihubungi, berhenti di situ, tulis pertanyaan untuk pemilik beserta usulan yang dicetak skrip, lalu kerjakan draf isinya saja.

### 2. Buat atau buka postingannya

Kalau pengguna memberi link Instagram sebagai contoh, ambil bahannya dulu. gallery-dl terpasang otomatis di `tools/.venv` saat pertama dipakai.

```bash
node ~/.claude/skills/content-studio/scripts/ref.mjs <link>
```

Hasilnya ada di `refs/<kode>/`: `ref.json` (caption, urutan, ukuran, durasi), gambar dan video asli di `media/`, dan untuk setiap video, frame berjarak rata plus satu lembar ringkas `frames/<n>-sheet.jpg`. Lihat semua gambar dan lembar frame dengan alat baca gambar, baca `caption.txt`, lalu catat pertanyaan yang dijawab postingan itu, urutan idenya, dan bentuk tiap slide. Audio video tidak ditranskrip; kalau isinya ada di suara, minta pengguna merangkumnya. Setelah itu buat postingan baru dan tulis isinya dengan suara akun.

```bash
node ~/.claude/skills/content-studio/scripts/new-post.mjs --brand <akun> --slug <slug> --title "<judul postingan>" [--slides <3-10>]
```

Berkas yang dibuat berisi `TODO` di setiap teks, tema yang berselang-seling, nama slide dari `structure` akun bila ada, empat alternatif cover, dan tiga alternatif penutup. `--slides` mengatur jumlah slide. Isi `post.json`:

- Mulai dari satu pertanyaan yang dicari pembaca. Satu ide per slide.
- Pilih komponen yang cocok dengan bentuk isinya, bukan untuk variasi: urutan sebab akibat memakai `steps` atau `numbered`, label lawan kalimat memakai `pairs`, kalimat yang bisa diucapkan memakai `quotes`, dua kalimat yang mirip tapi beda pesan memakai `versus`, dan seterusnya. Tabel "Memilih komponen" di `references/components.md` memetakan 56 komponen inti ke bentuk isinya; komponen buatan yang sudah ada tercantum di `components/README.md` dan dipakai ulang dengan cara yang sama.
- Variasi datang dari isi, varian, dan gerak, bukan dari dekorasi. Hindari komponen yang sama di dua slide berurutan, kecuali seri yang memang satu bentuk (misalnya satu slide per tahap): di situ tata letak yang sama membantu pembaca melihat kemajuan, dan variasi datang dari tema dan gerak. Pilih `variant` yang paling pas dengan isinya. Setiap komponen sudah punya gerak bawaan yang berbeda; isi `motion` hanya bila ingin ritme lain, dan jangan memakai preset yang sama di lebih dari tiga slide.
- Slide pertama selalu komponen pembuka (`cover`, `hero`, `hook`, `stat`, `photo`, `teaser`, atau `contrast`), slide terakhir komponen penutup (`closing`, `outro`, `recap`, `prompt`, `action`, atau `profile`). Disclaimer dan handle diisi otomatis dari akun.
- Cover adalah hook: ia menentukan apakah orang berhenti menggulir. Tulis slide pertama terbaikmu di `slides`, lalu 3 sampai 14 alternatif di `covers` (lebih banyak lebih baik, selama jenis hook-nya berbeda), masing-masing dari jenis hook yang berbeda (pertanyaan pembaca, koreksi anggapan, frasa kunci, tanda yang dikenali, kalimat yang sering terdengar, angka bersumber, kuis, skala, daftar isi, pencarian, balik anggapan, foto adegan, dan seterusnya; lihat "Cover: hook pertama" di `references/components.md`). Semua alternatif harus benar terhadap isi postingan. Pemilik memilih salah satunya di studio, dan unduhan memakai yang dipilih. New-post sudah menyiapkan empat alternatif; ganti jenisnya bila ada yang lebih cocok dengan topik.
- Penutup menentukan apa yang dilakukan pembaca sesudahnya. Pilih satu ajakan per penutup (simpan, kirim, komentar, kata kunci, seri berikutnya, atau profil), lalu tulis 2 sampai 6 alternatif di `closings` dengan jenis ajakan yang berbeda; lihat "Penutup: ajakan terakhir" di `references/components.md`.
- Ajak pembaca berpikir dengan isi, bukan dengan tombol: `quiz` `ask` lalu `reveal` di slide berikutnya, `hook` `quiz` atau `scale` di cover, `script` untuk kalimat yang diisi sendiri, `flags` untuk kapan harus periksa.
- Foto dan video: pakai hanya berkas dari pemilik akun, taruh di `posts/<slug>/media/`, dan sebut lewat `media` (`src`, `alt`, `focus`). Komponennya `photo`, `figure`, `photopair`, `pins`, `gallery`, `exercise`, `testimonial`, `profile`. Pilih varian yang cocok dengan bentuk fotonya (mendatar atau tegak). Kalau pemilik belum memberi berkas, tulis `alt` yang jelas supaya mereka tahu foto apa yang perlu dipasang; slide memakai bingkai kosong sampai berkasnya ada. Lihat "Foto dan video" di `references/components.md`.
- Tidak ada slide yang hanya teks. Setiap slide, cover, dan penutup punya gambar yang mendukung isinya: komponen bergambar (diagram, grafik, ikon, foto), karakter, atau satu ilustrasi di `art` yang dipilih dari isinya, misalnya `clock` untuk "60 menit", `calendar` untuk seminggu, `tag` untuk label, `stop` untuk batas. Scan menolak slide yang hanya teks. Engine menaruh ilustrasinya di atas atau di samping judul sesuai kepadatan slide. Lihat bagian Ilustrasi di `references/components.md` dan katalognya di `catalog/<akun>.html`.
- Selang-seling `theme` terang dan gelap supaya carousel punya ritme.
- Tulis poinnya secara langsung. Kalimat slogan "X, bukan Y" cukup satu per postingan; scan memberi peringatan bila muncul di dua slide atau lebih. Karakter anak di `cover` dan `closing` hanya dipakai bila pemilik akun memintanya.
- Semua isi harus terbaca tanpa disentuh. Pembaca Instagram hanya bisa menggeser, jadi jangan menulis "ketuk", "klik", "balik kartu", atau membuat kotak centang dan penghitung. Contoh dan jawaban ditulis langsung.

Rincian field, batas kata dan karakter, serta daftar ikon ada di `references/components.md`; komponen buatan ada di `components/README.md`, dan `component.mjs list` mencetak semuanya. Untuk melihat semua komponen, varian, dan preset gerak dalam warna, logo, dan font akun, buat katalognya:

```bash
node ~/.claude/skills/content-studio/scripts/catalog.mjs --brand <akun>
```

Hasilnya `catalog/<akun>.html`, satu halaman lokal berisi setiap tata letak dalam tema terang dan gelap, contoh `post.json`-nya, dan tombol untuk memutar gerak masuk. Contoh isinya lolos scan yang sama dengan post. Buat ulang setelah engine, akun, atau komponen buatan berubah.

#### Bila tidak ada komponen yang cocok

Turuni tangga ini dan berhenti di anak tangga pertama yang cukup: komponen yang ada, varian lain, gerak lain, ubah bentuk isinya (persingkat atau pecah ke dua slide), baru komponen baru. Komponen baru dibuat untuk bentuk isi yang belum ada, misalnya tiga pilihan yang dibandingkan pada aspek yang sama, bukan untuk variasi atau hiasan.

```bash
node ~/.claude/skills/content-studio/scripts/component.mjs new --id <id>
node ~/.claude/skills/content-studio/scripts/component.mjs check --id <id>
```

Baca `references/authoring.md` sebelum menulis berkasnya. Gerbangnya memeriksa tiga hal:

1. **Pakai ulang.** `reuse` menyebut kebutuhan isinya dan alasan untuk setiap komponen terdekat yang diminta gerbang.
2. **Tanpa pola AI.** Tidak ada garis aksen di satu sisi, bayangan, gradien, ikon dalam wadah, label di atas judul, hiasan tanpa isi, huruf kapital atau raksasa, dan pola lain dari impeccable.style/slop.
3. **Rapi.** Hanya token warna dan nilai dari skala huruf, jarak, dan radius (pakai kit `ds-*`). Diukur di browser pada isi contoh, isi terpanjang, isi tersingkat, dan kata panjang, terang dan gelap: tidak ada teks yang offside atau keluar kotak, tidak ada kata terpotong, padding kartu cukup, jarak judul ke isi dan antar butir benar, kontras cukup.

Ulangi `check` sampai lolos, lalu lihat sendiri `checks/<id>/lembar-*.png`. Galat nol belum berarti bagus; nilai juga apakah komponen itu sekeluarga dengan komponen inti. Setelah itu buat ulang katalog dan pakai komponennya di `post.json`.

### 3. Scan aturan

```bash
node ~/.claude/skills/content-studio/scripts/scan.mjs --slug <slug>
```

Perbaiki setiap galat dengan mengubah isi. Tambahkan `--detail` untuk melihat jumlah kata dan karakter setiap field terhadap batasnya. Penjelasan tiap aturan dan cara memperbaikinya ada di `references/rules.md`. Peringatan boleh dibiarkan bila disengaja; sebutkan ke pengguna.

### 4. Build

```bash
node ~/.claude/skills/content-studio/scripts/build.mjs --slug <slug>
```

Hasilnya `posts/<slug>/<slug>.html`, sekitar 300 KB ditambah ukuran foto dan video, dengan font, media, dan pustaka video tersemat sehingga bisa dibuka tanpa internet.

### 5. Verifikasi di browser

```bash
node ~/.claude/skills/content-studio/scripts/verify.mjs --slug <slug>
```

Skrip ini membuka halaman di Chrome tanpa layar, membaca pemeriksaan di halaman, memeriksa kata yang terpotong di tengah (gagal) dan kata yang sendirian di baris terakhir (peringatan), lalu menyimpan `preview/slide-N.png`. Setiap alternatif cover dipasang ke slide 1 satu per satu, diperiksa dengan aturan yang sama, dan disimpan sebagai `preview/cover-N.png`; alternatif penutup dipasang ke slide terakhir dan disimpan sebagai `preview/closing-N.png`. Video difoto di detik `still`-nya. Prosesnya beberapa detik. Jumlah kata di sini bisa sampai lima lebih tinggi dari scan karena angka yang terlihat di slide (nomor langkah dan nomor butir) ikut terhitung. Lihat beberapa PNG itu dengan alat baca gambar untuk memastikan tidak ada teks yang terpotong atau terlalu padat. Kalau ada pemeriksaan gagal, persingkat teks di slide itu, lalu ulangi langkah 3 sampai 5. Kalau Chrome tidak ada (kode keluar 2), katakan ke pengguna dan minta mereka membuka halaman lalu melihat tab Pengaturan, bagian Pemeriksaan.

### 6. Laporkan

Beri tahu pengguna, singkat:

- path halaman dan cara membukanya (`open posts/<slug>/<slug>.html` di macOS, atau klik dua kali)
- yang bisa dilakukan di halaman: geser slide, putar otomatis, ubah kecepatan gerak, tampilkan zona aman, baca panduan, dan menu **Unduh** (tombol biru, pintasan D)
- alternatif cover dan penutup yang tersedia, satu baris per jenis hook atau ajakan, dan cara memilihnya: tab Pengaturan bagian **Pilihan cover** dan **Pilihan penutup**, atau tombol pilihan di dok saat slide pertama atau terakhir tampil. Unduhan memakai yang dipilih
- foto atau video yang masih bingkai kosong (peringatan scan "belum ada"), beserta `alt`-nya, supaya pemilik tahu berkas apa yang perlu dipasang
- hasil scan dan verify, termasuk peringatan yang dibiarkan
- isi yang perlu dicek manusia, misalnya klaim kesehatan, angka, atau nama
- bila kamu membuat komponen baru: namanya, kenapa komponen yang ada tidak cukup, dan path lembar ujinya (`checks/<id>/`)

## Saat ada yang gagal

- **Engine skill berubah**: jangan menjalankan `lock.mjs` untuk meloloskannya. Laporkan berkas yang berubah ke pengguna.
- **Akun berubah sejak disetujui**: tunjukkan perbedaannya ke pemilik akun. Jalankan `brand.mjs accept --id <akun>` hanya setelah mereka setuju.
- **Teks tidak muat atau tidak seimbang**: persingkat atau pecah ke slide lain. Jangan mencari cara mengecilkan huruf; batas 30 px dibuat agar terbaca di ponsel.
- **Media belum ada atau terlalu besar**: minta berkasnya ke pemilik, atau minta mereka mengecilkan foto ke sekitar 2000 px dan memotong video ke 5 sampai 15 detik. Jangan mencari foto pengganti di internet.
- **Slide hanya teks** (scan menyebut "slide ini hanya teks"): pilih ilustrasi yang membawa isinya untuk `art`, atau ganti ke komponen bergambar. Bila tidak ada ilustrasi yang pas, pakai yang paling dekat maknanya dan sebutkan ke pengguna; katalog ilustrasi bertambah lewat pembaruan engine.
- **Ikon tidak ada di katalog**: pilih ikon terdekat dari daftar. Katalog ikon hanya bertambah lewat pembaruan engine.
- **Isi tidak cocok dengan komponen mana pun**: ikuti "Bila tidak ada komponen yang cocok" di atas. Jangan mengedit HTML hasil build atau CSS engine untuk mengakalinya.
- **Kata terlalu panjang untuk kotaknya** (scan menyebut "maksimal N huruf per kata"): pakai kata yang lebih pendek atau varian yang lebih lebar. Jangan melonggarkan batasnya; kata itu akan terpotong di tengah.
- **Komponen buatan belum lolos, berubah, atau engine diperbarui**: jalankan `component.mjs check --id <id>` dan perbaiki sampai lolos. Jangan menulis atau menyalin `<id>.pass.json` sendiri.
- **Gerbang komponen terus gagal di satu aturan**: ubah tata letaknya, bukan aturannya. Kalau aturan itu terasa salah untuk kasusmu, jelaskan ke pengguna; batas gerbang hanya diubah pemilik skill.
- **`ref.mjs` keluar dengan kode 3 (Instagram minta login)**: sampaikan pesan skrip ke pengguna. Minta mereka login Instagram di Chrome dengan akun cadangan, atau memberi profil lewat `--browser` atau berkas lewat `--cookies`, lalu ulangi. Jangan membuka database cookie browser sendiri dan jangan mencari pengunduh lain untuk melewati login. Kalau pengguna tidak bisa menunggu, minta screenshot slide atau ringkasan isinya dan kerjakan draf dari situ.
- **`ref.mjs` gagal padahal sudah login**: Instagram sering berubah. Jalankan `ref.mjs --update`, lalu ulangi. Kalau masih gagal, tunjukkan pesan galatnya ke pengguna.

## Rujukan

- `references/components.md`: 56 komponen inti beserta varian, field, batas, contoh JSON, foto dan video, jenis hook cover dan alternatif cover, jenis ajakan penutup dan alternatif penutup, aturan gaya, 20 preset gerak, dan daftar ikon. Baca sebelum menulis `post.json`.
- `references/authoring.md`: membuat komponen baru. Tangga pakai ulang, anatomi berkas, field, design system dan kit `ds-*`, aturan tanpa pola AI, aturan kerapian beserta angkanya, dan cara membaca hasil gerbang. Baca sebelum menulis `components/<id>.mjs`.
- `components/README.md` (folder skill): komponen buatan yang sudah lolos, beserta field dan contohnya.
- `references/rules.md`: semua aturan scan dan pemeriksaan browser, beserta cara memperbaikinya.
- `references/brand-setup.md`: pertanyaan untuk pemilik akun, format berkas jawaban, aturan kontras, cara mengubah akun.
- `assets/examples/gerak-anak.post.json`: contoh postingan enam slide yang lolos semua pemeriksaan.
- `assets/media/`: foto dan video contoh (ilustrasi) yang dipakai katalog dan gerbang; `media.json` mendaftarnya.
