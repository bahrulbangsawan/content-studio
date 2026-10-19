# Reels: video penjelasan 9:16

Reel adalah video 1080 x 1920 dari satu `posts/<slug>/reel.json`. Bentuknya bukan carousel yang direntangkan. Satu reel adalah urutan adegan. Setiap adegan berisi satu ide yang diucapkan voice over, dengan gambar yang membawanya. Bagian-bagian adegan muncul tepat saat suara menyebutnya, dan subtitle mengikuti kata yang sedang diucapkan.

Akun, warna, font, ilustrasi, dan aturan tulisannya sama dengan carousel. Bedanya:

- **Suara.** Voice over Gemini 3.8 Flash TTS per adegan.
- **Subtitle.** Tertanam di video, kata yang sedang diucapkan bersorot.
- **Footage stok.** Dari Magnific atau Pexels, dengan kreditnya.
- **Bukti ilmiah.** Wajib untuk setiap angka dan klaim penelitian.

Isi:

1. Kapan reel, kapan carousel
2. Alur kerja
3. Menulis untuk telinga
4. Bukti ilmiah
5. Struktur reel.json
6. Jenis adegan (16 jenis, 33 varian)
7. Waktu, transisi, subtitle
8. Footage dan foto
9. Suara dan musik
10. Pemeriksaan dan cara memperbaikinya
11. Ekspor
12. Zona aman dan aturan video

## 1. Kapan reel, kapan carousel

| Pilih reel bila | Pilih carousel bila |
| --- | --- |
| Isinya gerakan, urutan, atau proses yang lebih jelas bila dilihat bergerak | Isinya daftar atau perbandingan yang ingin disimpan dan dibaca ulang |
| Ingin menjangkau penonton baru (Reels direkomendasikan ke non-pengikut sampai 3 menit) | Pembaca perlu waktu untuk membaca per slide |
| Ada footage latihan atau kegiatan yang mendukung | Tidak ada suara yang cocok, atau isi panjang dan padat |

Satu topik bisa menjadi keduanya. Reel tidak menyalin slide carousel. Tulis ulang untuk telinga, dengan adegan yang dirancang untuk layar tegak.

## 2. Alur kerja

```bash
CS="node ${CLAUDE_SKILL_DIR}/scripts/cli.mjs"            # atau content-studio bila terpasang global
$CS evidence search "<topik dalam bahasa Inggris>"      # 1. bukti dulu, baru naskah
$CS new <slug> --brand <akun> --title "<judul>" --reel  # 2. kerangka reel.json
#   isi reel.json: naskah voice over per adegan, teks layar, gambar, sumber
$CS evidence cite <doi|pmid>                            # entri sources yang siap pakai
$CS footage search "<kata kunci>"                       # opsional: footage stok, lihat lembar kontaknya
$CS footage get pexels:<id> --slug <slug> --length 8
$CS scan <slug>                                         # 3. aturan isi
$CS evidence verify <slug>                              # 4. sumber ada, tahunnya cocok, tidak ditarik
$CS voice <slug>                                        # 5. voice over (Gemini), waktu per kata
$CS check <slug>                                        # 6. build + verify: tata letak di Chrome, PNG pratinjau
$CS verify <slug> --frames                              #    opsional: tiga frame gerak per adegan
$CS export <slug>                                       # 7. MP4, cover, SRT, caption ke posts/<slug>/export/
```

Tanpa key Gemini, `voice` di Mac memakai suara Damayanti (`--provider say`). Suara itu hanya untuk pratinjau. Tanpa suara sama sekali, build tetap jalan dengan waktu perkiraan sekitar 2,3 kata per detik, dan video diekspor tanpa audio.

## 3. Menulis untuk telinga

Voice over adalah isi utama. Teks di layar hanya kata kunci dan angka yang dilihat sambil mendengar.

- **Satu ide per adegan**, 1 sampai 3 kalimat pendek.
  - Batas kata `vo` per jenis ada di bagian 6.
  - Pada sekitar 2,3 kata per detik, 30 kata kira-kira 13 detik.
- **Pembuka selesai dalam 3 sampai 5 detik.**
  - Langsung ke masalah pembaca, tanpa salam dan tanpa "halo teman-teman".
  - Tulis 2 sampai 4 alternatif di `hooks` dengan jenis berbeda: pertanyaan, angka, mitos, footage. Pemilik memilih di studio.
- **Sebut butir sesuai urutan tampilnya.** Langkah, butir daftar, label diagram, dan batang muncul saat kata pertamanya yang bermakna diucapkan. Jadi naskah "Pertama, tawarkan duduk bersila" memunculkan butir "Duduk bersila" tepat di situ. Butir yang tidak disebut muncul berurutan dengan jeda rata.
- **Judul pembuka, penutup, dan penjelasan sebaiknya sama dengan kalimat yang diucapkan.**
  - Katanya muncul satu per satu mengikuti suara, dan subtitle disembunyikan di adegan itu supaya tidak dobel.
  - Bila berbeda, subtitle tampil di bawahnya.
- **Angka ditulis sebagai angka** ("60%", "1.200 anak"). Suara membacanya dengan benar, subtitle menampilkannya ringkas.
- **Jeda dan napas** memakai tag bahasa Inggris di dalam `vo`, dan tag ini tidak tampil di subtitle:
  - `<short pause>`, `<long pause>`, `<breath>`
- **Penekanan dengan huruf kapital** dibaca lebih tegas oleh Gemini, tetapi ikut tampil di subtitle. Pakai sesekali.
- **Interaktif dan bersemangat, bukan seperti dongeng.**
  - Sapa penonton langsung ("kamu", "si kecil").
  - Tanya, lalu jawab ("Faktanya?", "Hampir sama, kan?").
  - Pakai kalimat pendek dan bahasa lisan yang wajar.
- **Preset suara.** Pilih nadanya dengan preset, tidak perlu menulis gaya sendiri:

  | Preset | Suara | Nada |
  | --- | --- | --- |
  | `semangat` (bawaan) | Laomedeia | bersemangat dan interaktif, seperti kreator yang ngobrol langsung ke penonton; istilah Inggris dengan lafal asli |
  | `tenang` | Sulafat | hangat dan tenang, tempo sedang, untuk topik yang serius |

  - **Urutan berlaku, yang terakhir menang:**
    1. Preset bawaan (`config gemini.voicePreset`).
    2. `voice` di brand.json, untuk semua reel akun.
    3. `voice` di reel.json.
    4. `--preset`, `--voice`, dan `--style` di perintah.
  - Setiap lapisan boleh menyebut `preset` lalu mengganti satu bagian saja, misalnya { "preset": "semangat", "voice": "Puck" }.
  - Daftar preset: `content-studio voice list`. Dengar dulu: `content-studio voice try "Kalimat contoh." --preset tenang`.
- **Gaya bicara sendiri** (`voice.style`) menggantikan gaya preset. Bahasa Inggris paling dipatuhi model.
  - Per adegan pakai `tone`, tapi `tone` yang berbeda menambah permintaan TTS.
  - Jangan menulis umur, jenis kelamin, atau aksen di gaya; pilih suaranya.
- **Istilah bahasa Inggris** ditulis dalam bentuk aslinya (follow, screen time, W-sitting) dan diucapkan dengan lafal Inggris.
  - Kata yang tetap terbaca ala Indonesia diberi cara ucap di `voice.pronounce` (reel ini) atau `pronounce` di brand.json (semua reel akun), misalnya { "partofphysio": "part of physio" }.
  - Subtitle tetap menampilkan tulisan aslinya.
- Aturan akun tetap berlaku untuk suara dan teks layar: tanpa tanda seru bila akun melarang, tanpa frasa terlarang, dan tanpa ajakan mengetuk layar. Ajakan ikuti, simpan, kirim, dan komentar boleh.

## 4. Bukti ilmiah

Konten kesehatan harus berbasis bukti. Aturannya:

1. **Cari dulu, tulis kemudian.**
   - `evidence search "<topik>"` mencari tinjauan sistematis dan meta-analisis di PubMed, lalu mencetak kesimpulan setiap abstrak.
   - Pilihan lain: `--type rct`, `--type guideline`, `--type any`, `--since 2015`, `--db europepmc`.
   - Kata kunci bahasa Inggris memberi hasil terbanyak.
2. **Klaim mengikuti kesimpulan abstrak, bukan sebaliknya.**
   - Jangan menulis angka yang tidak ada di sumbernya.
   - Jangan membesarkan temuan. "Tidak ada bukti bahwa X berbahaya" tidak sama dengan "X aman untuk semua anak".
   - Sebut desain dan ukuran studinya bila penting, di field `design` dan `sample` pada adegan `evidence`.
3. **Setiap angka dan klaim penelitian punya `source` di adegannya.**
   - `stat` dan `evidence` wajib bersumber.
   - `hook`, `statement`, `mythfact`, dan `footage` boleh bersumber, dan scan memperingatkan bila ada angka atau kata "penelitian" tanpa sumber.
   - Sumber tampil kecil di bawah adegan, berurutan di penutup, dan lengkap di caption Instagram.
4. **`evidence cite <doi|pmid>`** membuat entri `sources` yang siap tempel: `short` ("Hayden dkk., 2021", tampil di video), `cite` (APA lengkap, tampil di caption), `doi`, `pmid`, dan `year`. Ganti `id`-nya menjadi `s1`, `s2`, dan seterusnya.
5. **`evidence verify <slug>`** sebelum ekspor.
   - Ia memeriksa bahwa DOI ada di Crossref dan PMID ada di PubMed, bahwa keduanya menunjuk makalah yang sama, bahwa tahun di `short` cocok, dan bahwa makalahnya tidak ditarik (retracted).
   - Sumber yang lolos ditandai `verified` dengan tanggal.
   - Verifikasi tidak menilai isi klaim. Tetap baca kesimpulannya.
6. Pedoman resmi (misalnya dari kementerian kesehatan, WHO, atau perhimpunan profesi) boleh memakai `url` tanpa DOI.

## 5. Struktur reel.json

```json
{
  "brand": "partofphysio",
  "slug": "duduk-w",
  "title": "Duduk W pada anak",
  "caption": "Teks posting Instagram, lalu tagar.",
  "voice": { "provider": "gemini", "preset": "semangat" },
  "captions": true,
  "music": { "src": "musik.mp3", "volume": 0.12 },
  "sources": [ { "id": "s1", "short": "Nordon dkk., 2025", "cite": "...", "doi": "10.1590/...", "pmid": "39802577", "year": 2025 } ],
  "scenes": [ { "type": "hook", ... }, ..., { "type": "closing", ... } ],
  "hooks": [ { "type": "hook", ... } ],
  "closings": [ { "type": "closing", ... } ]
}
```

- `scenes`: 3 sampai 24 adegan.
  - Adegan pertama `hook`, terakhir `closing`.
  - Yang paling efektif biasanya 5 sampai 9 adegan, 30 sampai 75 detik.
- `hooks` dan `closings` berisi alternatif adegan pertama (sampai 13) dan terakhir (sampai 5).
  - Pilihan diambil di tab Adegan di studio, atau dengan `export --hook N --closing N`.
- Field yang dipakai semua adegan:
  - `type`, `variant`, `theme` (`light` atau `dark`, selang-seling)
  - `vo`: naskah
  - `tone`: arahan suara adegan ini
  - `name`: nama di daftar adegan
  - `transition`: transisi masuk
  - `duration`: detik minimum, biasanya tidak perlu
  - `captions`: `false` menyembunyikan subtitle adegan ini
- Tidak ada field gaya. Warna, ukuran, posisi, dan gerak datang dari engine dan akun.

## 6. Jenis adegan

Setiap adegan punya gambar. Scan menolak adegan yang hanya teks: isi `art` (ilustrasi dari katalog, dipilih dari maknanya), `media` (footage atau foto), atau pakai jenis yang menggambar sendiri, seperti angka, langkah, diagram, atau daftar berikon. Pilih jenis dari bentuk isinya, dan jangan memakai jenis dan varian yang sama di dua adegan berurutan.

Beberapa varian punya batas tambahan yang diperiksa scan:

- `hook bold` paling banyak 6 kata dan 34 karakter. `hook myth` paling banyak 8 kata dan 46 karakter.
- `steps` dengan 5 langkah tanpa `text`. Dengan 4 langkah, `text` paling banyak 6 kata.
- `compare cols`: `text` paling banyak 6 kata.
- `tip`: `chips` dan `how` paling banyak 4 bersama.
- `flags`: `note` hanya bila paling banyak 3 tanda.
- `timeline` dengan 5 titik: `text` paling banyak 5 kata.
- `stat bar`: `label` paling banyak 9 kata.

### hook (Pembuka)
Detik pertama: pertanyaan, klaim, mitos, atau angka yang membuat orang berhenti menggulir. Bicara langsung tanpa salam. Voice over maks 18 kata. Gambar: ilustrasi besar, footage, atau angka yang dihitung naik.
Varian: `question` pertanyaan, `bold` kalimat besar, `myth` mitos dicoret (dicap "Keliru"), `number` angka, `footage` footage penuh, `split` footage dan teks.
- title: teks, maks 9 kata, 54 karakter, wajib. Kata-katanya muncul mengikuti suara.
- focus: teks, maks 4 kata, 28 karakter, kata persis dari title. Disorot penanda kuning, atau dicoret di varian myth.
- kicker: teks, maks 9 kata, 56 karakter
- value: angka seperti `60%`, `1.200`, `6 dari 10`, wajib untuk number
- media: wajib untuk footage dan split
- source, art

### statement (Penjelasan)
Satu kalimat inti dengan kata kunci bersorot, ditemani ilustrasi. Voice over maks 32 kata.
Varian: `plain` polos, `card` kartu dengan ilustrasi di tepinya, `quote` kutipan (pedoman, ahli).
- title: teks, maks 12 kata, 72 karakter, wajib
- focus: teks, maks 4 kata, 30 karakter, kata persis dari title
- body: teks, maks 16 kata, 100 karakter
- by: teks, maks 8 kata, 48 karakter, hanya untuk quote
- source, art

### stat (Angka)
Satu angka dari penelitian yang dihitung naik, dengan gambarnya. Wajib bersumber. Voice over maks 28 kata.
Varian: `ring` cincin persen, `bar` batang pembanding, `people` deret orang, `plain` angka besar.
- value: angka, maks 8 karakter, wajib (ring, people, plain). Untuk people: berapa orang yang terisi.
- label: teks, maks 10 kata, 60 karakter, wajib
- title: teks, maks 6 kata, 36 karakter
- of: angka 2 sampai 20, wajib untuk people (10 atau 20 paling rapi)
- bars: 2 sampai 3 × { label: maks 4 kata, 26 karakter; value: angka }, untuk bar
- focus: batang ke berapa yang bersorot (1 sampai 3), untuk bar
- source: wajib
- art

### steps (Langkah)
Dua sampai lima langkah berurutan. Setiap langkah muncul saat disebut, langkah sebelumnya meredup, dan garisnya tergambar. Voice over maks 40 kata.
Varian: `line` jalur bernomor, `cards` kartu bertumpuk.
- title: teks, maks 7 kata, 40 karakter, wajib
- steps: 2 sampai 5 × { title: maks 5 kata, 30 karakter; text: maks 9 kata, 56 karakter }
- art: tampil di samping judul

### list (Daftar)
Dua sampai lima butir sejajar: tanda, manfaat, kebiasaan. Voice over maks 36 kata.
Varian: `check` centang, `cross` silang (hindari), `dot` titik, `icon` ikon katalog per butir.
- title: teks, maks 7 kata, 40 karakter, wajib
- items: 2 sampai 5 × { text: maks 7 kata, 42 karakter; icon: untuk varian icon }
- art

### compare (Bandingkan)
Dua pilihan: kurang tepat lalu lebih baik, atau sebelum lalu sesudah. Bagian kedua tiba saat disebut. Voice over maks 36 kata.
Varian: `split` atas dan bawah dengan panah, `cols` dua kolom.
- title: teks, maks 7 kata, 40 karakter
- a: { label: maks 3 kata, 20 karakter; text: maks 8 kata, 48 karakter; art }, wajib, berlencana silang
- b: sama dengan a, wajib, berlencana centang

### mythfact (Mitos dan fakta)
Kartu mitos yang berbalik menjadi kartu fakta saat suara sampai ke faktanya. Voice over maks 36 kata.
- myth: teks, maks 12 kata, 70 karakter, wajib
- fact: teks, maks 14 kata, 84 karakter, wajib
- mythArt, factArt, source

### diagram (Diagram)
Ilustrasi besar dengan dua sampai empat label bergaris penunjuk, muncul satu per satu saat disebut. Voice over maks 40 kata.
- title: teks, maks 7 kata, 40 karakter, wajib
- art: wajib (misalnya `knee`, `spine`, `feet`, `brain`, `heart`)
- labels: 2 sampai 4 × { text: maks 4 kata, 24 karakter, kata maks 11 huruf; at: `tl` `tr` `bl` `br` `l` `r` }
- focus: label ke berapa yang bersorot

### footage (Footage)
Video atau foto yang menunjukkan gerakannya. Teks selalu di kartu padat, tidak pernah langsung di atas gambar. Voice over maks 32 kata.
Varian: `full` penuh layar dengan kartu di bawah, `frame` dalam bingkai dengan label, `split` gambar di atas teks.
- media: { src, alt, focus, from (detik awal video), move (in, out, left, right untuk foto) }, wajib
- title: teks, maks 8 kata, 48 karakter
- text: teks, maks 14 kata, 84 karakter
- source

### evidence (Bukti)
Temuan satu penelitian: apa yang ditemukan, desain studi, dan jumlah peserta. Sumbernya wajib dan tampil di kartu. Voice over maks 36 kata.
Varian: `card` kartu, `number` kartu dengan angka.
- title: temuannya, maks 14 kata, 90 karakter, wajib
- focus: kata persis dari title yang disorot
- design: misalnya "Tinjauan sistematis", maks 4 kata, 30 karakter
- sample: misalnya "24 studi, 3.100 anak", maks 5 kata, 32 karakter
- value: angka, wajib untuk number
- source: wajib
- art

### definition (Istilah)
Satu istilah dan artinya dalam bahasa sehari-hari. Voice over maks 30 kata.
- term: maks 3 kata, 22 karakter, wajib
- meaning: maks 16 kata, 96 karakter, wajib
- kicker: maks 4 kata, 26 karakter (bawaan "Apa itu")
- art

### tip (Coba ini)
Satu latihan atau kebiasaan yang bisa dicoba: gambar gerakannya, takarannya, dan caranya. Voice over maks 36 kata.
- title: maks 7 kata, 40 karakter, wajib
- art: wajib (gerakannya)
- kicker: maks 3 kata, 18 karakter (bawaan "Coba ini")
- chips: 1 sampai 3 × { icon, text: maks 3 kata, 16 karakter }, misalnya "10 menit" dengan ikon clock
- how: 1 sampai 3 langkah singkat, maks 7 kata, 42 karakter

### flags (Tanda bahaya)
Kapan harus ke tenaga kesehatan: dua sampai empat tanda yang tidak boleh ditunggu. Voice over maks 36 kata.
- title: maks 7 kata, 42 karakter, wajib
- items: 2 sampai 4 × teks maks 6 kata, 38 karakter
- note: maks 10 kata, 60 karakter
- art: bawaan `warning`

### timeline (Garis waktu)
Dua sampai lima tahap menurut usia atau waktu, tergambar dari atas ke bawah. Voice over maks 40 kata.
- title: maks 7 kata, 40 karakter, wajib
- points: 2 sampai 5 × { when: maks 2 kata, 10 karakter, misalnya "6 bln"; text: maks 7 kata, 44 karakter }
- art

### recap (Intinya)
Ringkasan dua atau tiga poin sebelum penutup. Voice over maks 32 kata.
- title: maks 5 kata, 30 karakter (bawaan "Intinya")
- items: 2 sampai 3 × teks maks 5 kata, 32 karakter
- art

### closing (Penutup)
Satu ajakan akhir. Disclaimer akun, daftar sumber, dan handle tampil otomatis. Subtitle tidak tampil di penutup, jadi buat title sama dengan voice over-nya. Voice over maks 22 kata.
Varian: `follow` ikuti (logo besar), `save` simpan, `share` kirim, `comment` pertanyaan untuk komentar.
- title: maks 9 kata, 56 karakter, wajib
- focus: kata persis dari title
- cta: { icon, text: maks 5 kata, 30 karakter }, wajib, misalnya { "icon": "bookmark", "text": "Simpan" }
- art: bawaan sesuai varian (save, send, talk)

## 7. Waktu, transisi, subtitle

- **Panjang adegan.** Engine menghitungnya sendiri: jeda awal, lalu voice over, lalu jeda akhir 0,5 detik. Pembuka berbicara dalam 0,06 detik. `duration` hanya memperpanjang. Adegan tanpa `vo` sunyi dan memakai `duration` atau panjang minimum.
- **Waktu per kata**, urut dari yang paling tepat:
  1. Transkripsi klip suara (`voice` melakukannya otomatis bila ada key OpenAI atau Gemini).
  2. Jeda yang terdengar di klip, dicocokkan dengan tanda baca naskah.
  3. Perkiraan dari naskah.
- **Transisi.** Bawaannya bergiliran: `up`, `wipe`, `zoom`, `slide`, `circle`, `fade`. Footage penuh memakai `fade` atau `zoom`. Isi `transition` hanya bila ingin efek tertentu; `cut` untuk potongan langsung.
- **Subtitle.** Satu atau dua baris pendek (`videoRules.captionChars`, bawaan 26 karakter), menempel di batas bawah zona aman, di pelat kartu, dengan kata yang diucapkan disorot.
  - Disembunyikan otomatis di adegan yang teks layarnya sama dengan suaranya, dan di penutup.
  - `"captions": false` mematikan semuanya.
  - Ekspor SRT selalu berisi seluruh voice over.
- **Header.** Logo dan handle tampil di header setiap adegan, di atas zona aman (bisa dimatikan dengan `videoRules.headerBrand`). Di atas footage, header memakai kartu supaya terbaca. Tidak ada nomor adegan.

## 8. Footage dan foto

Urutan pilihan gambar:

1. **Foto dan video milik pemilik akun** (taruh di `posts/<slug>/media/`). Ini yang paling dipercaya penonton.
2. **Ilustrasi katalog.**
3. **Footage stok berlisensi.**

Jangan mengambil gambar dari postingan orang lain.

- **Mencari footage.**
  - `footage search "<kata kunci bahasa Inggris>"` mencari video tegak. `--type photo` untuk foto, `--any-shape` untuk bentuk lain.
  - Penyedianya Magnific (bila ada key; paket berbayar) atau Pexels (key gratis). Pakai `--provider` untuk memilih.
  - Hasilnya daftar bernomor dan `refs/footage/<kueri>/sheet.png`. **Lihat lembar kontaknya** sebelum memilih. Pastikan gambarnya benar secara klinis: posisi, gerakan, dan usia anak sesuai isi.
- **Mengambil footage.**
  - `footage get <provider>:<id> --slug <slug> [--start 2] [--length 8]` mengunduh dan memotongnya. Video tegak dipotong ke 1080 x 1920, yang mendatar disimpan dalam bentuk aslinya untuk varian `frame` atau `split`.
  - Hasilnya tanpa suara, H.264, dan kreditnya tercatat di `media/credits.json`. Kredit ikut ke caption.
  - `footage fit <slug> <berkas>` mengecilkan berkas yang terlalu besar (video maks 25 MB, total 90 MB).
- **Lisensi.**
  - Pexels gratis, termasuk komersial; kredit dianjurkan.
  - Magnific paket berbayar boleh dipakai komersial tanpa atribusi.
  - Aset dari paket Free Magnific hanya untuk pribadi dan wajib atribusi.
  - Tidak boleh menampilkan orang yang dapat dikenali dalam konteks negatif, misalnya "anak dengan kelainan" memakai wajah anak stok.
- **MCP Magnific** (`footage mcp`) membuat gambar dan video dengan AI, bukan mencari stok.
  - Pakai hanya bila pemilik akun mau.
  - Konten AI yang realistis sebaiknya diberi label AI di caption.
  - Simpan hasilnya ke `posts/<slug>/media/`.

## 9. Suara dan musik

- **`voice <slug>`** membuat satu WAV per kalimat di `posts/<slug>/audio/`, dicatat di `audio/voice.json`.
  - Kalimat yang tidak berubah tidak dibuat ulang, jadi mengubah satu adegan hanya membuat satu klip baru.
  - `--force` membuat ulang semuanya.
- **Satu permintaan untuk semua kalimat.**
  - `voice` menggabungkan semua kalimat yang perlu dibuat dengan jeda panjang di antaranya, lalu memotong audionya kembali per kalimat. Cara memotongnya: di jeda terpanjang, atau di batas kata hasil transkripsi bila jedanya kurang jelas.
  - Suaranya jadi seragam sepanjang reel, dan kuota hemat. Gemini tier gratis hanya memberi sekitar 10 permintaan TTS per hari, dan satu reel cukup satu permintaan.
  - Kalimat dengan `tone` berbeda dibuat di permintaan terpisah.
  - `--no-batch` membuat satu permintaan per kalimat.
- **Kuota habis (429)** tercetak beserta waktu tunggunya. Klip yang sudah jadi tetap disimpan, dan menjalankan ulang `voice` hanya membuat yang belum ada.
- **Suara Gemini.** Lihat daftarnya dengan `voice list`.
  - Yang cocok untuk edukasi yang bersemangat: Laomedeia dan Puck (bersemangat), Sadachbia (hidup), Zephyr dan Autonoe (cerah). Untuk nada lebih tenang: Sulafat (hangat), Achird (ramah), Charon (informatif).
  - Dengar dulu: `voice try "Kalimat contoh." --voice Achird`.
  - Model bawaan `gemini-3.8-flash-tts`. Lebih hemat: `--model gemini-3.8-flash-lite-tts`.
- **Musik** opsional, dari berkas milik pemilik akun yang lisensinya jelas.
  - Taruh di `media/` dan sebut di `music` dengan `volume` 0,02 sampai 0,4 (bawaan 0,12).
  - Musik otomatis mengecil saat suara bicara, lalu memudar di akhir.

## 10. Pemeriksaan dan cara memperbaikinya

**Scan (statis)** memeriksa:

- skema setiap adegan, batas kata dan karakter, dan batas per varian
- pembuka dan penutup
- gambar di setiap adegan
- sumber: ada, berformat DOI, PMID, atau URL, dan dipakai
- angka atau klaim penelitian tanpa sumber (peringatan)
- frasa terlarang akun, tanda seru, dan placeholder
- berkas media dan ukurannya
- ritme: jenis yang sama berurutan, empat adegan berturut-turut dengan tema sama
- jumlah alternatif pembuka

**Verify (di Chrome)** mengukur setiap adegan dan setiap alternatif saat semua bagiannya sudah masuk:

- teks di dalam zona konten akun
- tidak ada teks di area tombol Instagram
- ukuran huruf minimal `minTextPx` untuk isi dan `minMetaPx` untuk sumber dan disclaimer (bawaan 32 px dan 26 px, seperti tampil di video)
- tidak ada bagian yang saling menimpa
- tidak ada kata terpotong di tengah
- tidak ada teks langsung di atas foto
- semua bagian sudah masuk sebelum adegan berakhir
- durasi total (gagal di atas `hardMaxSeconds`, peringatan di atas `maxSeconds`)

**Build** juga memperingatkan pembuka yang lebih lama dari `hookMaxSeconds`, adegan yang lebih lama dari `maxSceneSeconds`, dan reel yang lebih pendek dari `minSeconds`. **Scan** memperingatkan voice over yang lebih cepat dari `maxWordsPerSecond`.

Perbaikan selalu lewat isi:

- persingkat teks layar (suara boleh tetap lengkap)
- pindahkan detail ke `vo`
- pecah ke adegan berikutnya, atau pilih varian yang lebih lapang

Jangan mengecilkan huruf atau mengedit HTML hasil build.

## 11. Ekspor

- **Dari studio**, menu Unduh:
  - MP4 dengan suara
  - cover PNG
  - semua adegan PNG
  - SRT
  - caption
- **Dari terminal**: `export <slug> [--hook N] [--closing N] [--only mp4,cover,srt,caption]` menulis ke `posts/<slug>/export/`.
- **Spesifikasi MP4:** 1080 x 1920, 30 fps, H.264 10 Mbps, AAC 48 kHz stereo, moov di depan. Ini sesuai spesifikasi Reels Meta.
- **Sampul.** Cover PNG adalah pembuka yang sudah lengkap. Di grid profil, Instagram memotongnya 3:4 di tengah (y 240 sampai 1680), dan judul pembuka ada di dalamnya.
- **Caption** (`-caption.txt`) berisi `caption`, sumber lengkap, kredit footage, dan disclaimer akun. Tempel saat mengunggah.

## 12. Zona aman dan aturan video

Video punya zona dan aturannya sendiri, terpisah dari carousel. Video ditonton penuh layar di bawah bilah atas aplikasi, nama akun, caption, dan kolom tombol, beberapa detik per adegan. Carousel dibaca sambil digeser, dengan header dan footer di dalam slide.

| | Carousel (`rules`) | Reels (`videoRules`) |
| --- | --- | --- |
| Bingkai | 1080 x 1350, 4:5 | 1080 x 1920, 9:16 |
| Atas | header slide 168 px (logo, nomor) | header 220 px: logo dan handle, di luar zona aman |
| Bawah | footer slide 168 px (handle, geser) | 450 px tanpa isi (nama, caption, audio) |
| Samping | 96 px | 35 px; kolom tombol 100 px di kanan mulai y 1160 |
| Isi | x 96 sampai 984, y 168 sampai 1182 | x 60 sampai 1020, y 220 sampai 1144 (di atas kolom tombol, di tengah) |
| Subtitle | tidak ada | y 1320 sampai 1470, menempel di batas bawah zona aman |
| Nomor | nomor slide di header | tidak ada |
| Huruf terkecil | 30 px | 32 px isi, 26 px sumber (seperti tampil di video) |
| Waktu | animasi masuk sampai 1,2 detik | suara paling cepat 4 kata per detik, pembuka 5 detik, adegan 14 detik, total 15 sampai 90 detik (batas 180) |

- **Ukuran adegan.** Adegan dirancang minimal 800 x 940 px lalu diskalakan ke zona isi (bawaan 98%). Semua tata letak tetap proporsional, dan ukuran huruf diperiksa seperti tampil di video.
- **Penutup.** Disclaimer, sumber, dan handle penutup berada di bawah isi, di atas batas bawah zona aman.
- **Mengatur.** Pemilik akun bisa mengubah setiap angka di `brand.json` bagian `videoRules`, atau memilih `preset` `tiktok-540`, `template-1080`, atau `ketat`. Kunci dan batasnya ada di `references/brand-setup.md`.
  - Tata letak, garis panduan zona di studio (tombol zona, atau tekan Z), pemeriksaan, dan scan semuanya memakai angka itu.
  - Ubah hanya atas permintaan pemilik akun, lalu jalankan `brand accept` setelah mereka setuju.
- **Melihat.** `content-studio brand rules --id <akun>` mencetak aturan carousel dan aturan video berdampingan. Tab Panduan di studio Reels menampilkan zona dan aturan video akun ini.
