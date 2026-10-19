---
name: content-studio
description: Membuat konten edukasi Instagram dengan design system akun yang dikunci: carousel (1080 x 1350, post.json) dan Reels atau video penjelasan 9:16 (1080 x 1920, reel.json) dengan voice over Gemini, subtitle mengikuti suara, animasi, ilustrasi, footage stok, dan sumber ilmiah. Hasilnya halaman studio HTML dengan pratinjau, pemeriksaan, dan unduhan PNG, MP4 bersuara, SRT, serta caption. CLI content-studio menyimpan API key, mentranskrip video, mengunduh postingan Instagram, mencari footage Magnific atau Pexels, mencari dan memverifikasi bukti PubMed, membuat voice over, dan mengekspor. Pakai setiap kali pengguna ingin membuat, mengedit, memeriksa, atau mengekspor carousel, Reels, video edukasi, motion content, atau slide media sosial; menyiapkan akun brand; memberi link Instagram sebagai contoh; mentranskrip video; mencari footage atau bukti penelitian; atau menyebut content studio, carousel, reel, atau voice over, walau tidak menyebut kata skill.
---

# Content Studio

Skill ini mengubah isi postingan menjadi satu berkas `.html` per postingan, dalam dua format:

- **Carousel**: slide 1080 x 1350 dari `post.json`. Alur kerjanya di bawah.
- **Reels**: video penjelasan 1080 x 1920 dari `reel.json`, dirancang untuk layar tegak (bukan slide yang direntangkan). Berisi adegan yang muncul tepat saat voice over menyebutnya, subtitle dengan kata yang sedang diucapkan, ilustrasi bergerak, footage, angka yang dihitung naik, dan sumber ilmiah di setiap klaim. Lihat bagian Reels dan `references/reels.md`.

Berkas `.html` itu dibuka langsung di browser, tanpa artifact dan tanpa server. Untuk carousel, isinya:

- pratinjau carousel 1080 x 1350 yang bisa digeser, dengan animasi masuk dan karakter
- 49 ilustrasi satu gaya dengan akun (jam, anak berlari, jantung, sepatu, label, dan lainnya), sebagian bergerak pelan, untuk mendukung isi setiap slide
- 56 komponen slide inti dengan 137 tata letak, ditambah komponen buatan yang lolos gerbang komponen, dan 20 preset gerak masuk yang bisa dipilih per slide
- 35 tata letak cover (hook pertama) dan 13 tata letak penutup (ajakan), dengan beberapa alternatif cover dan penutup per postingan yang bisa dipilih langsung di studio
- foto dan video milik akun di cover, isi, dan penutup: tersemat di halaman, video diputar di slidenya, dan ikut terekam di PNG dan MP4
- pemeriksaan otomatis per slide (zona konten, keseimbangan, jumlah kata, panjang judul, teks terkecil, waktu animasi, tanpa ajakan mengetuk)
- panduan desain (anatomi slide, alur, tipografi, warna akun, gerak, komponen, aturan)
- unduhan PNG per slide, ZIP semua PNG, MP4 per slide, ZIP semua MP4, dan satu MP4 berurutan

Studio Reels berisi pemutar 9:16 dengan suara, garis waktu per adegan, pilihan pembuka dan penutup, zona aman Instagram, pemeriksaan, daftar sumber dan kredit, serta unduhan MP4 bersuara, cover PNG, PNG per adegan, SRT, dan caption.

Desainnya ketat karena tujuannya konsistensi: tampilan, warna, tipografi, dan gerak dikunci di engine dan di akun. Komponen tampil sama di slide terang dan gelap: di slide gelap hanya latarnya yang gelap, kartu tetap terang. Yang kamu tulis adalah isi. Bila isinya punya bentuk yang belum ada di katalog, kamu boleh menulis komponen baru, asal lolos gerbang komponen: cek pakai ulang, tanpa pola AI, dan rapi.

## Peta berkas

```
<folder skill>/                          SKILL (terkunci; folder ini bisa hanya-baca)
  engine/parts/   tampilan, CSS, JS studio dan ekspor carousel, kit design system ds-*
  engine/reel/    studio Reels: pemutar, adegan 9:16, suara, ekspor MP4 dan SRT
  engine/icons.json, fonts/, vendor/      katalog ikon, font bawaan Inter, mp4-muxer
  engine/LOCK.json                         sidik jari engine dan skrip
  scripts/cli.mjs  perintah content-studio (satu pintu untuk semua skrip di bawah)
  scripts/        brand.mjs, new-post.mjs, ref.mjs, scan.mjs, build.mjs, verify.mjs, catalog.mjs, component.mjs,
                  reel.mjs, voice.mjs, transcribe.mjs, footage.mjs, evidence.mjs, export.mjs,
                  workspace.mjs, package.mjs, lock.mjs
  scripts/lib/reel-scenes.mjs              16 jenis adegan Reels, field, dan batasnya
  scripts/lib/kit.mjs, art.mjs             field, markup, nilai design system, dan katalog ilustrasi
  components/     komponen buatan yang ikut skill (compare)
  tools/          requirements.txt (versi gallery-dl untuk ref.mjs)
  references/     components.md, authoring.md, rules.md, brand-setup.md, reels.md
  assets/examples/ akun contoh Part of Physio dan post contoh
  assets/media/   foto dan video contoh (ilustrasi pengganti) untuk katalog dan gerbang

<project>/content-studio/               WORKSPACE (milik pengguna)
  brands/<akun>/  brand.json, logo-light.svg, logo-dark.svg, font.woff2, brand.lock
  posts/<slug>/   post.json, media/ (foto dan video akun), <slug>.html, preview/slide-N.png, cover-N.png, closing-N.png
  posts/<slug>/   reel.json, media/ (plus credits.json), audio/ (voice over per adegan, voice.json), evidence.json,
                  <slug>.html, preview/scene-N.png, hook-N.png, closing-N.png, export/ (MP4, cover, SRT, caption)
  components/     komponen buatan proyek ini: <id>.mjs, <id>.pass.json (ditulis gerbang), README.md
  refs/<kode>/    ref.json, caption.txt, media/, frames/ (bahan dari link Instagram), *.transcript.txt, *.srt
  refs/footage/   hasil pencarian footage dan lembar kontaknya; refs/evidence/: hasil pencarian PubMed
  catalog/<akun>.html  katalog semua komponen, varian, ilustrasi, dan preset gerak dalam warna akun
  checks/<id>/    lembar uji gerbang komponen (PNG per varian)

~/.content-studio/gallery-dl/            gallery-dl untuk ref.mjs, dipasang otomatis saat pertama dipakai
~/.content-studio/config.json            API key dan pengaturan pengguna (hanya bisa dibaca pemiliknya), lewat content-studio setup
```

Perintah di skill ini memakai path folder skill (folder tempat SKILL.md ini berada), yang diisi otomatis oleh Claude Code di mana pun skill dipasang: folder pribadi, folder proyek, atau plugin. Bila sebuah perintah masih memuat nama variabel CLAUDE_SKILL_DIR yang belum terganti, misalnya di Claude Desktop, ganti dengan path folder yang berisi SKILL.md ini. Jangan menyimpan apa pun di folder skill: folder itu bisa hanya-baca dan tertimpa saat skill diperbarui. Semua yang ditulis masuk ke workspace.

Semua skrip memakai `./content-studio` di direktori kerja sebagai workspace (proyek lama yang masih punya `./carousel-studio` tetap terbaca). Pakai `--root <folder>` bila pengguna menyimpannya di tempat lain. Butuh Node 18 atau lebih baru; verifikasi dan ekspor butuh Chrome, Chromium, atau Edge; transkripsi dan footage butuh ffmpeg.

### Perintah content-studio

Semua pekerjaan lewat satu perintah:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/cli.mjs" <perintah> ...
```

Di bawah ini ditulis singkat sebagai `content-studio <perintah>`. Bila pengguna sudah memasangnya global (`npm i -g github:bahrulbangsawan/content-studio`), `content-studio` langsung bisa dipakai. `content-studio help` mencetak semua perintah.

- `scan`, `build`, `verify`, dan `check` mengenali sendiri apakah `<slug>` carousel atau reel.
- `content-studio doctor` mengecek Node, Chrome, ffmpeg, workspace, dan API key.

### API key

Fitur daring memakai key milik pengguna. Fitur lain tetap jalan tanpa key:

| Key | Untuk |
| --- | --- |
| Gemini | Voice over dan transkripsi |
| OpenAI | Transkripsi dan waktu per kata |
| Magnific | Footage stok berbayar |
| Pexels | Footage gratis |
| Email untuk PubMed | Opsional, supaya permintaan ke PubMed sopan |

**Jangan pernah meminta pengguna menempelkan key ke percakapan**: isi percakapan tersimpan. Minta mereka menjalankan salah satu dari ini di terminal sendiri:

- `content-studio setup`: interaktif, input disembunyikan.
- `pbpaste | content-studio config set gemini.apiKey -`: dari clipboard. Di Claude Code bisa lewat `!` di depan perintah.
- Set variabel lingkungan `GEMINI_API_KEY`, `OPENAI_API_KEY`, `MAGNIFIC_API_KEY`, atau `PEXELS_API_KEY`.

Key tersimpan di `~/.content-studio/config.json`, tidak pernah di proyek atau repo. Kode keluar 2 dari sebuah perintah berarti key-nya belum ada: sampaikan ke pengguna dan lanjutkan bagian yang tidak butuh key.

### Di Claude Desktop dan claude.ai

Skill ini juga berjalan sebagai skill unggahan di Claude Desktop dan claude.ai, di lingkungan code execution. Bedanya:

- Berkas tidak tersimpan antar percakapan. Di awal, minta pengguna mengunggah `content-studio-workspace.zip` miliknya, lalu buka dengan `node "${CLAUDE_SKILL_DIR}/scripts/workspace.mjs" unpack <berkas.zip>`. Kalau belum punya, siapkan akun seperti biasa (langkah 1). Di akhir, buat ulang zip-nya dengan `workspace.mjs pack` dan berikan ke pengguna untuk disimpan.
- Halaman studio adalah satu berkas `.html` yang dibuka di browser pengguna. Setelah build, salin `posts/<slug>/<slug>.html` (dan PNG pratinjau bila perlu) ke folder unduhan percakapan, misalnya `/mnt/user-data/outputs/` bila folder itu ada, supaya pengguna bisa mengunduhnya.
- Bila Chrome tidak ada, `verify.mjs` keluar dengan kode 2. Jalankan `npx playwright install chromium` bila jaringan mengizinkan, lalu ulangi; kalau tidak bisa, minta pengguna membuka halaman dan melihat tab Pengaturan, bagian Pemeriksaan.
- `ref.mjs` (bahan dari link Instagram) butuh jaringan dan Python; di sana sering tidak tersedia. Minta screenshot atau ringkasan postingannya.
- Layanan daring (Gemini, OpenAI, Magnific, Pexels, PubMed) sering diblokir di lingkungan itu, dan key tidak tersimpan antar percakapan. Kerjakan naskah, adegan, dan build di sana; voice over, footage, dan verifikasi sumber jalankan di Claude Code atau terminal pengguna. Reel tanpa suara tetap bisa dibangun dan dipratinjau dengan waktu perkiraan.
- Foto dan video dari pengguna ada di berkas unggahan percakapan; salin ke `posts/<slug>/media/`.

## Batas sentuh

Batas ini ada supaya setiap postingan dari akun yang sama terlihat seperti satu keluarga, dan supaya keputusan brand tetap di tangan pemiliknya.

| Area | Boleh disentuh AI? | Cara yang benar |
| --- | --- | --- |
| `posts/<slug>/post.json`: teks, urutan slide, alternatif cover (`covers`) dan penutup (`closings`), field `media`, pilihan komponen, `variant`, `motion`, tema terang atau gelap, ikon dari katalog, karakter | Ya | Ikuti `references/components.md`, lalu scan |
| Membuat akun baru | Ya, setelah pemilik memberi data | Tanya pemilik (lihat `references/brand-setup.md`), tulis berkas jawaban, jalankan `brand.mjs init` |
| `posts/<slug>/media/`: foto dan video | Hanya berkas dari pemilik akun | Salin berkas yang diberi pemilik ke folder itu. Jangan mengambil foto dari internet atau dari postingan orang lain; tanpa berkas, slide memakai bingkai kosong |
| `brand.json`, logo, font, warna, aturan akun yang sudah ada | Hanya atas permintaan jelas pemilik | Ubah lewat `brand.mjs`, tunjukkan perubahannya, jalankan `accept` hanya setelah pemilik setuju |
| Batas aturan (`maxWordsPerSlide`, `titleMax`, dan lainnya) agar scan lolos | Tidak | Persingkat teksnya. Aturan dilonggarkan hanya bila pemilik akun meminta |
| `videoRules` di brand.json: zona aman dan aturan video (Reels) | Hanya atas permintaan jelas pemilik | Aturan video terpisah dari aturan carousel (`rules`). Lihat dengan `content-studio brand rules --id <akun>`; ubah lewat brand.json, `brand check`, lalu `accept` setelah pemilik setuju. Jangan mengubahnya agar sebuah reel lolos |
| `<slug>.html` hasil build | Tidak | Ubah `post.json`, lalu build ulang. Halaman akan tertimpa |
| `content-studio/components/<id>.mjs`: komponen buatan proyek | Ya, bila tidak ada komponen yang cocok | Ikuti `references/authoring.md`. Komponen baru dipakai hanya setelah lolos `component.mjs check` |
| `content-studio/components/<id>.pass.json` dan `README.md` | Tidak | Ditulis gerbang saat komponen lolos. Jangan dibuat atau diedit sendiri |
| Folder skill lainnya: engine, CSS inti, skrip, ikon, font, LOCK.json | Tidak | Komponen baru ditulis di `content-studio/components/` (workspace), bukan di engine. Kalau perlu fitur engine, jelaskan ke pengguna. `lock.mjs` hanya untuk pemilik skill saat memperbarui engine |
| Gaya di post.json (`style`, `color`, `fontSize`, posisi, HTML) | Tidak ada tempatnya | Scan menolak kunci yang tidak dikenal |
| `refs/<kode>/` hasil `ref.mjs` | Baca saja | Pelajari struktur dan idenya, lalu tulis isi baru. Teks dan gambar postingan orang tidak disalin ke slide |
| `posts/<slug>/reel.json`: naskah voice over, adegan, teks layar, sumber, alternatif pembuka dan penutup | Ya | Ikuti `references/reels.md`, lalu scan |
| `sources` di reel.json | Ya, hanya dari makalah yang benar ada dan sudah dibaca kesimpulannya | `evidence search`, `evidence cite`, lalu `evidence verify`. Jangan mengarang angka, penulis, tahun, atau DOI |
| Footage dan foto stok di `posts/<slug>/media/` | Ya, hanya lewat `footage get` dari Magnific atau Pexels | Lihat lembar kontaknya dulu. Kreditnya tercatat otomatis. Jangan mengunduh gambar dari situs lain atau dari postingan orang |
| `posts/<slug>/audio/` dan `voice.json` | Tidak diedit langsung | Ditulis `content-studio voice`. Ubah naskahnya di reel.json lalu jalankan ulang |
| `~/.content-studio/config.json` dan API key | Tidak | Pengguna sendiri yang mengisi lewat `content-studio setup` |

`build.mjs` memeriksa sidik jari engine, akun, dan komponen buatan. Kalau engine berubah, build berhenti. Kalau akun berubah tanpa `accept`, build juga berhenti. Kalau komponen buatan berubah sejak lolos gerbang, scan memintamu menjalankan `check` lagi. Itu sinyal untuk berhenti dan memeriksa, bukan untuk dilewati.

## Alur kerja

### 1. Pastikan akunnya ada

```bash
node "${CLAUDE_SKILL_DIR}/scripts/brand.mjs" list
```

Kalau belum ada akun untuk brand ini, siapkan bersama pemiliknya. Baca `references/brand-setup.md` untuk daftar pertanyaan, format berkas jawaban, nilai bawaan, dan aturan kontras. Jangan menebak logo, warna, handle, atau disclaimer. Itu identitas orang lain dan hanya mereka yang tahu nilainya. Kalau pengguna ingin mencoba dengan akun contoh, salin `assets/examples/partofphysio/` dan jalankan init dari `answers.json` di sana.

Status di `list`: **disetujui** (siap dipakai), **belum disetujui** (init belum lolos), atau **berubah sejak disetujui**. Selama akun belum disetujui, kamu tetap boleh menulis dan men-scan `post.json`, tapi build menolak. Kalau init gagal dan pemilik tidak bisa dihubungi, berhenti di situ, tulis pertanyaan untuk pemilik beserta usulan yang dicetak skrip, lalu kerjakan draf isinya saja.

### 2. Buat atau buka postingannya

Kalau pengguna memberi link Instagram sebagai contoh, ambil bahannya dulu. gallery-dl terpasang otomatis di `~/.content-studio/gallery-dl` saat pertama dipakai.

```bash
node "${CLAUDE_SKILL_DIR}/scripts/cli.mjs" ig <link>
```

Hasilnya ada di `refs/<kode>/`: `ref.json` (caption, urutan, ukuran, durasi), gambar dan video asli di `media/`, dan untuk setiap video, frame berjarak rata plus satu lembar ringkas `frames/<n>-sheet.jpg`. Lihat semua gambar dan lembar frame dengan alat baca gambar, baca `caption.txt`, lalu catat pertanyaan yang dijawab postingan itu, urutan idenya, dan bentuk tiap slide. Kalau isinya ada di suara, transkripsikan: `content-studio transcribe refs/<kode>` (atau langsung `content-studio transcribe <link>`) menulis teks, SRT, dan waktu per kata di samping videonya, lalu mencetak teksnya. Setelah itu buat postingan baru dan tulis isinya dengan suara akun.

```bash
node "${CLAUDE_SKILL_DIR}/scripts/new-post.mjs" --brand <akun> --slug <slug> --title "<judul postingan>" [--slides <3-10>]
```

Berkas yang dibuat berisi `TODO` di setiap teks, tema yang berselang-seling, nama slide dari `structure` akun bila ada, empat alternatif cover, dan tiga alternatif penutup. `--slides` mengatur jumlah slide. Isi `post.json`:

- Mulai dari satu pertanyaan yang dicari pembaca. Satu ide per slide.
- Pilih komponen yang cocok dengan bentuk isinya, bukan untuk variasi: urutan sebab akibat memakai `steps` atau `numbered`, label lawan kalimat memakai `pairs`, kalimat yang bisa diucapkan memakai `quotes`, dua kalimat yang mirip tapi beda pesan memakai `versus`, dan seterusnya. Tabel "Memilih komponen" di `references/components.md` memetakan 56 komponen inti ke bentuk isinya; komponen buatan yang sudah ada tercantum di `components/README.md` (folder skill dan workspace) dan dipakai ulang dengan cara yang sama.
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
node "${CLAUDE_SKILL_DIR}/scripts/catalog.mjs" --brand <akun>
```

Hasilnya `catalog/<akun>.html`, satu halaman lokal berisi setiap tata letak dalam tema terang dan gelap, contoh `post.json`-nya, dan tombol untuk memutar gerak masuk. Contoh isinya lolos scan yang sama dengan post. Buat ulang setelah engine, akun, atau komponen buatan berubah.

#### Bila tidak ada komponen yang cocok

Turuni tangga ini dan berhenti di anak tangga pertama yang cukup: komponen yang ada, varian lain, gerak lain, ubah bentuk isinya (persingkat atau pecah ke dua slide), baru komponen baru. Komponen baru dibuat untuk bentuk isi yang belum ada, misalnya tiga pilihan yang dibandingkan pada aspek yang sama, bukan untuk variasi atau hiasan.

```bash
node "${CLAUDE_SKILL_DIR}/scripts/component.mjs" new --id <id>
node "${CLAUDE_SKILL_DIR}/scripts/component.mjs" check --id <id>
```

Baca `references/authoring.md` sebelum menulis berkasnya. Gerbangnya memeriksa tiga hal:

1. **Pakai ulang.** `reuse` menyebut kebutuhan isinya dan alasan untuk setiap komponen terdekat yang diminta gerbang.
2. **Tanpa pola AI.** Tidak ada garis aksen di satu sisi, bayangan, gradien, ikon dalam wadah, label di atas judul, hiasan tanpa isi, huruf kapital atau raksasa, dan pola lain dari impeccable.style/slop.
3. **Rapi.** Hanya token warna dan nilai dari skala huruf, jarak, dan radius (pakai kit `ds-*`). Diukur di browser pada isi contoh, isi terpanjang, isi tersingkat, dan kata panjang, terang dan gelap: tidak ada teks yang offside atau keluar kotak, tidak ada kata terpotong, padding kartu cukup, jarak judul ke isi dan antar butir benar, kontras cukup.

Ulangi `check` sampai lolos, lalu lihat sendiri `checks/<id>/lembar-*.png`. Galat nol belum berarti bagus; nilai juga apakah komponen itu sekeluarga dengan komponen inti. Setelah itu buat ulang katalog dan pakai komponennya di `post.json`.

### 3. Scan aturan

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" --slug <slug>
```

Perbaiki setiap galat dengan mengubah isi. Tambahkan `--detail` untuk melihat jumlah kata dan karakter setiap field terhadap batasnya. Penjelasan tiap aturan dan cara memperbaikinya ada di `references/rules.md`. Peringatan boleh dibiarkan bila disengaja; sebutkan ke pengguna.

### 4. Build

```bash
node "${CLAUDE_SKILL_DIR}/scripts/build.mjs" --slug <slug>
```

Hasilnya `posts/<slug>/<slug>.html`, sekitar 300 KB ditambah ukuran foto dan video, dengan font, media, dan pustaka video tersemat sehingga bisa dibuka tanpa internet.

### 5. Verifikasi di browser

```bash
node "${CLAUDE_SKILL_DIR}/scripts/verify.mjs" --slug <slug>
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

## Reels

Baca `references/reels.md` sebelum menulis `reel.json`.

Reels mengikuti **aturan video** akun (`videoRules` di brand.json), terpisah dari aturan carousel (`rules`):

- **Zona aman 9:16.**
  - Header 220 px berisi logo dan handle, di luar zona aman. Tidak ada nomor adegan.
  - Samping 35 px; kolom tombol 100 px di kanan mulai y 1160.
  - Bawah 450 px tanpa isi.
  - Isi adegan di x 60 sampai 1020, y 220 sampai 1144, di tengah dan di atas kolom tombol. Adegan diskalakan ke zona itu.
  - Subtitle menempel di batas bawah zona aman.
- **Ukuran dan tempo.** Huruf minimal 32 px seperti tampil di video, voice over paling cepat 4 kata per detik.
- **Durasi.** Pembuka paling lama 5 detik, satu adegan paling lama 14 detik, total yang disarankan 15 sampai 90 detik.

Tata letak, garis panduan zona di studio, dan pemeriksaan memakai angka akun itu. Bagian 12 di `references/reels.md` membandingkan keduanya. Ringkasnya:

### 1. Bukti dulu

Untuk topik kesehatan, cari buktinya sebelum menulis naskah. `content-studio evidence search "<topik, bahasa Inggris>"` mencetak tinjauan sistematis teratas di PubMed beserta kesimpulan abstraknya. Pakai `--type rct|guideline|any` dan `--since <tahun>` bila perlu.

- Klaim di video mengikuti kesimpulan itu, tanpa dibesarkan.
- Angka yang tidak ada di sumber tidak ditulis.
- `content-studio evidence cite <doi|pmid>` membuat entri `sources` yang siap tempel.

### 2. Kerangka dan naskah

```bash
node "${CLAUDE_SKILL_DIR}/scripts/cli.mjs" new <slug> --brand <akun> --title "<judul>" --reel
```

Isi setiap adegan dengan `vo` (naskah yang diucapkan) dan teks layar yang ringkas. Adegan pertama `hook`, terakhir `closing`. Prinsipnya:

- **Satu ide per adegan.** Biasanya 5 sampai 9 adegan, 30 sampai 75 detik.
- **Pembuka selesai dalam 3 sampai 5 detik, tanpa salam.** Tulis 2 sampai 4 alternatif di `hooks` dengan jenis berbeda (pertanyaan, angka bersumber, mitos dicoret, footage), dan 1 sampai 3 di `closings` (ikuti, simpan, kirim, komentar).
- **Pilih jenis adegan dari bentuk isinya.** Ada 16 jenis: hook, statement, stat, steps, list, compare, mythfact, diagram, footage, evidence, definition, tip, flags, timeline, recap, closing. Ganti jenis atau varian antaradegan, dan selang-seling `theme`.
- **Sebut butir dalam urutan tampilnya.** Langkah, butir, dan label muncul saat suara menyebutnya.
- **Setiap adegan punya gambar** (`art`, `media`, atau jenis yang menggambar sendiri).
- **Setiap angka atau klaim penelitian punya `source`.**

### 3. Gambar

Dahulukan foto dan video dari pemilik akun, lalu ilustrasi katalog. Bila perlu footage stok:

1. `content-studio footage search "<kata kunci bahasa Inggris>"` mencari footage.
2. **Lihat `refs/footage/<kueri>/sheet.png` dengan alat baca gambar.** Pastikan gerakan, posisi, dan usia di gambarnya benar secara klinis.
3. `content-studio footage get <provider>:<id> --slug <slug> --length 8` mengunduhnya ke `posts/<slug>/media/`.

### 4. Periksa, suara, bangun

```bash
node "${CLAUDE_SKILL_DIR}/scripts/cli.mjs" scan <slug>
node "${CLAUDE_SKILL_DIR}/scripts/cli.mjs" evidence verify <slug>
node "${CLAUDE_SKILL_DIR}/scripts/cli.mjs" voice <slug>          # Gemini 3.8 Flash TTS; tanpa key: --provider say (pratinjau di Mac)
node "${CLAUDE_SKILL_DIR}/scripts/cli.mjs" check <slug>          # build + verify di Chrome, PNG per adegan
node "${CLAUDE_SKILL_DIR}/scripts/cli.mjs" verify <slug> --frames   # opsional: tiga frame gerak per adegan
```

**Voice over**

- Tulis naskah yang interaktif dan bersemangat: sapa penonton, tanya lalu jawab, kalimat pendek.
- Nada suara dipilih dengan preset:
  - `semangat` (bawaan): Laomedeia, antusias, bukan seperti membacakan dongeng.
  - `tenang`: Sulafat, hangat.
  - Pasang di `voice.preset` (reel.json) atau `voice` di brand.json untuk semua reel akun. Jangan mengganti nada akun tanpa permintaan pemilik.
- Istilah bahasa Inggris ditulis dan diucapkan dalam bentuk aslinya. Kata yang tetap terbaca ala Indonesia diberi cara ucap di `voice.pronounce` (reel.json) atau `pronounce` (brand.json, atas persetujuan pemilik).
- `voice` membuat satu klip per kalimat dalam satu permintaan. Kalimat yang tidak berubah tidak dibuat ulang.
- Bila ada key transkripsi, waktu setiap kata diukur, jadi teks layar dan subtitle mengikuti suara dengan tepat.
- Suara dan gaya bicaranya diatur di `voice` pada reel.json. Dengar dulu dengan `content-studio voice try "<kalimat>" --voice <nama>`.

**Pemeriksaan**

- Lihat `preview/scene-N.png` (juga `hook-N.png` dan `closing-N.png`) dengan alat baca gambar.
- Bila ada yang gagal, persingkat teks layar, pindahkan detail ke `vo`, atau ganti varian. Lalu bangun ulang.

### 5. Ekspor dan laporkan

`content-studio export <slug> [--hook N] [--closing N]` menulis ke `posts/<slug>/export/`: MP4 1080 x 1920 bersuara, cover PNG, SRT, dan caption berisi sumber dan kredit. Pengguna juga bisa mengunduh dari menu Unduh di studio.

Laporkan ke pengguna:

- path halaman studio dan berkas ekspor
- durasi dan jumlah adegan
- pilihan pembuka dan penutup, satu baris per jenis
- suara yang dipakai (atau bahwa masih pratinjau atau belum ada)
- sumber beserta status verifikasinya
- footage beserta lisensinya
- hasil scan dan verify
- klaim yang perlu dicek manusia

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
- **Kode keluar 2 dari voice, transcribe, atau footage (key belum ada)**: minta pengguna menjalankan `content-studio setup` di terminalnya sendiri. Jangan meminta key ditempel di percakapan. Sambil menunggu, lanjutkan naskah dan build dengan waktu perkiraan, atau `voice --provider say` untuk pratinjau di Mac.
- **Gemini TTS menolak (401, 403, 429)**: tunjukkan pesannya. 401 dan 403 berarti key salah atau belum aktif. 429 berarti kuota habis; tier gratis hanya sekitar 10 permintaan TTS per hari. `voice` sudah menggabungkan semua kalimat dalam satu permintaan dan menyimpan klip yang sudah jadi. Jalankan ulang setelah waktu tunggu yang tercetak, atau minta pengguna menaikkan tier. Jangan mengganti ke layanan lain tanpa persetujuan pengguna.
- **`evidence verify` menemukan sumber yang tidak ada, salah tahun, atau ditarik**: ganti sumbernya dengan yang benar dari `evidence search`, atau hapus klaimnya. Jangan menandai `verified` sendiri.
- **Footage tidak cocok atau tidak ada yang pas**: pakai ilustrasi katalog. Jangan memakai gambar dari situs lain. Bila pemilik akun punya video sendiri, minta berkasnya.
- **Ekspor MP4 gagal**: pastikan Chrome ada (`content-studio doctor`). Halaman yang dibangun dengan versi lama perlu dibangun ulang.

## Rujukan

- `references/components.md`: 56 komponen inti beserta varian, field, batas, contoh JSON, foto dan video, jenis hook cover dan alternatif cover, jenis ajakan penutup dan alternatif penutup, aturan gaya, 20 preset gerak, dan daftar ikon. Baca sebelum menulis `post.json`.
- `references/authoring.md`: membuat komponen baru. Tangga pakai ulang, anatomi berkas, field, design system dan kit `ds-*`, aturan tanpa pola AI, aturan kerapian beserta angkanya, dan cara membaca hasil gerbang. Baca sebelum menulis `components/<id>.mjs`.
- `components/README.md` (di folder skill dan di `content-studio/components/`): komponen buatan yang sudah lolos, beserta field dan contohnya.
- `references/rules.md`: semua aturan scan dan pemeriksaan browser carousel, beserta cara memperbaikinya.
- `references/reels.md`: Reels. Kapan dipilih, alur, menulis untuk telinga, bukti ilmiah, struktur reel.json, 16 jenis adegan dengan field dan batasnya, waktu dan transisi, footage dan lisensi, suara dan musik, pemeriksaan, ekspor. Baca sebelum menulis `reel.json`.
- `references/brand-setup.md`: pertanyaan untuk pemilik akun, format berkas jawaban, aturan kontras, cara mengubah akun.
- `assets/examples/gerak-anak.post.json`: contoh postingan enam slide yang lolos semua pemeriksaan.
- `assets/media/`: foto dan video contoh (ilustrasi) yang dipakai katalog dan gerbang; `media.json` mendaftarnya.
