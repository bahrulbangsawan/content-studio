# Komponen slide

`post.json` memakai 56 komponen inti di berkas ini (tujuh komponen asli dan 49 komponen tambahan, 137 tata letak bersama varian), ditambah komponen buatan yang lolos gerbang komponen; daftarnya ada di `components/README.md` di folder skill. Sebagian besar punya beberapa varian tata letak, dan setiap slide bisa memilih satu dari 20 preset gerak. Tata letak, warna, ukuran huruf, dan gerak tetap ditentukan engine; `post.json` hanya memilih dari katalog. Batas kata dan karakter memastikan teks muat di zona konten 888 x 1014 pada ukuran huruf minimal 30 px, termasuk untuk kata panjang. Pemeriksaan browser di `verify.mjs` adalah penentu akhir.

## Bentuk berkas

```json
{
  "brand": "partofphysio",
  "slug": "gerak-anak",
  "title": "Carousel gerak anak",
  "slides": [ { "name": "Cover", "theme": "dark", "component": "cover", "...": "..." } ],
  "covers": [ { "name": "Cover", "theme": "dark", "component": "hook", "variant": "chat", "...": "..." } ],
  "closings": [ { "name": "Penutup", "theme": "dark", "component": "prompt", "variant": "options", "...": "..." } ]
}
```

- `brand`: id akun di `content-studio/brands/`.
- `slug`: huruf kecil, angka, tanda hubung. Juga nama folder dan berkas.
- `title`: nama postingan (judul tab browser dan nama berkas unduhan), maksimal 80 karakter.
- `slides`: 3 sampai 10 slide. Pertama komponen pembuka (`cover`, `hero`, `hook`, `stat`, `photo`, `teaser`, `contrast`), terakhir komponen penutup (`closing`, `outro`, `recap`, `prompt`, `action`, `profile`).
- `covers`: alternatif slide pertama, sampai 14 slide pembuka. Lihat bagian Cover: hook pertama.
- `closings`: alternatif slide terakhir, sampai 6 slide penutup. Lihat bagian Penutup: ajakan terakhir.
- Foto dan video ditaruh di `posts/<slug>/media/` dan disebut lewat field `media`. Lihat bagian Foto dan video.

Setiap slide punya:

| Field | Wajib | Isi |
| --- | --- | --- |
| `name` | ya | Nama pendek slide, maksimal 24 karakter. Tampil di studio dan nama berkas, tidak di slide |
| `theme` | ya | `light` atau `dark` |
| `component` | ya | Salah satu komponen di bawah |
| `goal` | disarankan | Tujuan slide, maksimal 120 karakter. Tampil di panduan Alur, tidak di slide. Tanpa `goal`, panduan memakai tujuan bawaan komponen |
| `variant` | tidak | Tata letak komponen, hanya untuk komponen yang punya varian. Tanpa `variant`, engine memakai varian pertama |
| `motion` | tidak | Preset gerak masuk, lihat bagian Preset gerak. Tanpa `motion`, slide memakai gerak bawaan komponennya |
| `art` | ya, bila komponennya bukan gambar | Nama ilustrasi dari katalog, misalnya `clock`. Lihat bagian Ilustrasi |

Kunci lain (misalnya `style`, `color`, `fontSize`) ditolak scan. `variant` dan `motion` hanya menerima nama dari katalog ini, jadi tampilan tetap milik engine. Peringatan urutan struktur membandingkan `name` setiap slide dengan `structure` akun, bukan komponennya.

## Perkiraan karakter per baris

Batas karakter di tabel komponen menjamin teks muat, tapi belum tentu rapi. Satu kata yang tertinggal sendirian di baris terakhir terlihat janggal; susun ulang kalimatnya bila pratinjau menunjukkannya. Pakai `scan.mjs --slug <slug> --detail` untuk melihat jumlah kata dan karakter setiap field.

| Field | Kira-kira per baris | Baris yang wajar |
| --- | --- | --- |
| `cover.title`, `closing.title` | 16 karakter | 2 sampai 3 |
| `cover.kicker`, `closing.lede` | 40 karakter | 1 |
| `title` slide lain | 20 karakter | 1 sampai 3 |
| `statement.body` | 38 karakter | sampai 5 |
| `steps.steps[]` | 20 karakter (24 sering pindah baris) | 1 |
| `venn.*.sub` | 16 karakter | 1 |
| `venn.note` | 44 karakter | 1 sampai 2 |
| `list.items[]` | 40 karakter | 1 |
| `list.note` | 55 karakter | 1 sampai 2 |
| `tiles[].title` | 17 karakter | 1 sampai 2 |
| `tiles[].text` | 22 karakter | 1 sampai 2 |
| `closing.cta.text` | 32 karakter | 1 |

## Foto dan video

Beberapa komponen memuat foto atau video milik akun: `photo` (pembuka), `figure`, `photopair`, `pins`, `gallery`, `exercise`, `testimonial`, dan `profile` (penutup). Taruh berkasnya di `posts/<slug>/media/`, lalu sebut namanya di field `media`:

```json
"media": { "src": "anak-memanjat.jpg", "alt": "Anak memanjat tali di taman", "focus": "top" }
```

| Kunci | Wajib | Isi |
| --- | --- | --- |
| `src` | ya | Nama berkas di `media/`, tanpa folder. Foto: `.jpg`, `.jpeg`, `.png`, `.webp`. Video: `.mp4` (H.264) atau `.webm` |
| `alt` | ya | Satu kalimat tentang isi foto, maksimal 120 karakter. Dibaca pembaca layar dan dipakai sebagai pengingat berkas yang belum dipasang. Tidak tampil di slide dan tidak dihitung sebagai kata slide |
| `focus` | tidak | Bagian yang dipertahankan saat foto dipotong mengikuti bingkai: `center` (bawaan), `top`, `bottom`, `left`, `right` |
| `still` | tidak | Untuk video: detik yang dipakai sebagai gambar diam di PNG dan pratinjau, 0 sampai 60 |

- Build menyematkan berkasnya ke halaman, jadi studio tetap satu berkas yang bisa dibuka tanpa internet. Batas: foto 4 MB, video 15 MB, semua media 40 MB per postingan. Foto sekitar 2000 px di sisi panjang (di bawah 1,5 MB) cukup tajam untuk slide 1080 px.
- Berkas yang belum ada tidak menghentikan build: slidenya memakai bingkai kosong dengan ikon foto, dan scan memberi peringatan. Pasang berkasnya lalu build ulang.
- Video diputar tanpa suara, berulang, hanya saat slidenya tampil. Klip MP4 slide itu mengikuti panjang videonya (3 sampai 15 detik). PNG memakai frame di detik `still`. Tambahkan musik di Instagram bila perlu.
- Foto bergerak sangat pelan (membesar 6% dalam 9 detik) saat slidenya tampil, dan gerak itu ikut terekam di MP4.
- Teks tidak pernah ditulis langsung di atas foto. Judul duduk di latar slide (foto memudar ke warna latar), di panel, atau di kartu padat, jadi kontrasnya selalu terjaga apa pun fotonya.
- Bentuk foto: bingkai lebar (`figure`, `exercise`, `photopair` `stack`, `pins` `legend`, `gallery` `mosaic` foto besar) cocok untuk foto mendatar; bingkai tegak (`photo` `frame`, `photopair` `side`, `pins` `side`, `gallery` `row`, `testimonial` `photo`) cocok untuk foto tegak. Foto tegak di bingkai lebar terpotong atas bawahnya; atur `focus` atau pilih varian lain.
- `pins` menjaga bentuk asli fotonya, jadi titik di `x`, `y` (persen dari kiri dan atas foto) selalu jatuh di tempat yang sama.
- Pakai foto dan video milik akun sendiri, dengan izin orang yang tampil di dalamnya, apalagi anak. Contoh di katalog adalah ilustrasi pengganti dari `assets/media/` di folder skill, bukan untuk postingan.

## Ilustrasi

Setiap slide wajib punya gambar. Komponen yang sudah berupa gambar (diagram, grafik, foto, deret ikon, karakter) membawa gambarnya sendiri: `steps`, `venn`, `tiles`, `grid`, `iconrow`, `spectrum`, `cycle`, `pyramid`, `matrix`, `timeline`, `bars`, `week`, `gauge`, `pins`, `figure`, `photopair`, `gallery`, `photo`, `flags`, varian bergambar seperti `stat` `ring`/`bar`/`dots`, `hook` `scale`, `teaser` `icons`, `exercise` `photo`, `ladder` `stairs`, `acronym` `tiles`, `formula` `circles`, `action`, `profile` `photo`, `testimonial` `photo`, serta `cover` atau `closing` dengan karakter. Komponen lain diberi satu ilustrasi lewat field `art`:

```json
{ "name": "Durasi", "theme": "dark", "component": "stat", "variant": "top", "art": "clock", "value": "60", "title": "Menit gerak aktif anak setiap hari.", "sub": "Saran WHO untuk usia 5 sampai 17 tahun." }
```

- Scan menolak slide yang hanya teks (aturan akun `visualEverySlide`, bawaannya aktif). Berlaku juga untuk setiap alternatif cover dan penutup.
- Pilih ilustrasi yang membawa isi slide, bukan hiasan: menit dan durasi memakai `clock` atau `stopwatch`, seminggu memakai `calendar`, aktif bergerak memakai `run` atau `jump`, kalimat dan menegur memakai `talk` atau `kneel`, label memakai `tag`, batas memakai `stop`, tanda yang dicatat memakai `checklist` atau `observe`, kapan diperiksa memakai `checkup`. Kolom "Cocok untuk" di tabel membantu memilih.
- Engine yang menaruhnya. Di atas judul (`top`) ilustrasinya tumbuh dan menyusut mengikuti sisa ruang, 120 sampai 360 px (sampai 440 px di pembuka dan penutup). Di samping judul (`side`, 216 px) dipakai di slide yang padat; judulnya turun satu langkah agar kata panjang tetap utuh. Sebagian komponen memilih sendiri: di atas judul selama teksnya ringan, di samping judul bila teksnya banyak. Di `action` ilustrasi menggantikan ikon besarnya.
- Satu ilustrasi per slide, dan karakter anak atau ilustrasi, tidak keduanya. Hindari ilustrasi yang sama di dua slide berurutan.
- Ilustrasi memakai warna akun dan tampil sama di slide terang dan gelap, di atas pelat bulat terang. Yang bertanda "bergerak" punya gerak pelan berulang (jarum jam berputar, jantung berdenyut, anak melompat) yang hanya jalan di slide yang tampil dan ikut terekam di MP4.
- Semua ilustrasi bisa dilihat di katalog (`catalog.mjs`), bagian Ilustrasi.

| Nama | Gambar | Cocok untuk | Gerak |
| --- | --- | --- | --- |
| `clock` | Jam | waktu, menit, jam, durasi, lama, setiap hari | bergerak |
| `stopwatch` | Stopwatch | detik, durasi latihan, tahan, hitung waktu | bergerak |
| `hourglass` | Jam pasir | menunggu, sabar, bertahap, pelan-pelan | bergerak |
| `calendar` | Kalender | hari, minggu, jadwal, rutin, seminggu | |
| `run` | Anak berlari | berlari, aktif, gerak, olahraga, bermain di luar | bergerak |
| `jump` | Anak melompat | melompat, energi, semangat, lompat | bergerak |
| `balance` | Anak menjaga keseimbangan | keseimbangan, seimbang, satu kaki, balok, koordinasi | bergerak |
| `climb` | Anak naik tangga | tangga, naik, memanjat, langkah, kekuatan kaki | |
| `kick` | Anak menendang bola | bola, menendang, bermain, koordinasi mata kaki | bergerak |
| `sit` | Anak duduk tegak | duduk, postur, belajar, menulis, meja, punggung | |
| `sleep` | Anak tidur | tidur, istirahat, malam, cukup tidur, lelah | bergerak |
| `screen` | Waktu layar | layar, gawai, ponsel, tablet, video, menonton | bergerak |
| `stretch` | Anak meregangkan badan | peregangan, pemanasan, lentur, otot, latihan | bergerak |
| `family` | Orang tua dan anak | orang tua, ibu, ayah, mendampingi, bersama, keluarga | bergerak |
| `tag` | Label | label, cap, sebutan, julukan, melabeli | |
| `kneel` | Bicara sejajar anak | bicara, menjelaskan, menegur, sejajar, mendengar, orang tua | bergerak |
| `upset` | Anak kesal | marah, kesal, tantrum, emosi, frustrasi, kasar | bergerak |
| `stop` | Batas | batas, berhenti, tidak boleh, aturan, tegas | bergerak |
| `swap` | Ganti | ganti, ubah, tukar, pengganti, dari ke | bergerak |
| `heart` | Jantung | jantung, aktif, sehat, berdebar, kardio | bergerak |
| `brain` | Otak | otak, belajar, fokus, saraf, berpikir, konsentrasi | bergerak |
| `knee` | Lutut | lutut, sendi, kaki, tungkai, nyeri lutut | bergerak |
| `feet` | Telapak kaki | kaki, telapak, langkah, jinjit, berjalan, menapak | |
| `spine` | Tulang belakang | punggung, postur, tulang belakang, tegak, bungkuk | |
| `muscle` | Otot kuat | otot, kuat, kekuatan, penguat otot, latihan beban | bergerak |
| `shoe` | Sepatu | sepatu, alas kaki, berjalan, ukuran sepatu | |
| `ball` | Bola | bola, bermain, melempar, menangkap | bergerak |
| `stairs` | Tangga | tangga, naik turun, bertahap, langkah demi langkah | |
| `playground` | Taman bermain | taman, bermain di luar, perosotan, ayunan | |
| `bike` | Sepeda | sepeda, bersepeda, roda, keseimbangan | |
| `water` | Air minum | minum, air, cairan, haus, bekal | bergerak |
| `food` | Makanan sehat | makan, gizi, bekal, sarapan, buah, energi | |
| `book` | Buku | membaca, belajar, sekolah, buku cerita | |
| `backpack` | Tas sekolah | sekolah, tas, beban, bahu, membawa | |
| `phone` | Ponsel dan pesan | pesan, DM, kirim, tanya, hubungi, chat | bergerak |
| `home` | Rumah | di rumah, rumah, keluarga, latihan di rumah | |
| `idea` | Ide | ide, tips, cara, solusi, coba ini | bergerak |
| `question` | Pertanyaan | tanya, pertanyaan, bingung, kenapa, apakah | |
| `checklist` | Daftar periksa | daftar, catat, tanda, cek, periksa | |
| `observe` | Mengamati | amati, perhatikan, catat pola, lihat, cari tahu | bergerak |
| `checkup` | Pemeriksaan | periksa, fisioterapis, dokter, konsultasi, kapan diperiksa | bergerak |
| `target` | Target | tujuan, sasaran, fokus, berhasil, tepat | bergerak |
| `grow` | Tumbuh | tumbuh, berkembang, perkembangan, bertahap, sabar | bergerak |
| `trophy` | Berhasil | berhasil, bisa, bangga, pencapaian, kemajuan | bergerak |
| `warning` | Peringatan | bahaya, tanda bahaya, waspada, segera, perhatian | bergerak |
| `chart` | Grafik naik | angka, data, persen, meningkat, statistik, hasil | |
| `talk` | Bicara | kalimat, bicara, mengobrol, komunikasi, menegur, berkata | bergerak |
| `save` | Simpan | simpan, nanti, tandai, baca lagi | bergerak |
| `send` | Kirim | kirim, bagikan, teman, grup | bergerak |

## Cover: hook pertama

Cover menentukan apakah orang berhenti menggulir. Karena itu engine punya banyak cara membuka, dan setiap postingan sebaiknya membawa beberapa alternatif cover yang jenis hook-nya berbeda.

| Jenis hook | Cocok untuk | Komponen dan varian |
| --- | --- | --- |
| Masalah yang dikenali | Situasi yang langsung dikenali pembaca | `cover` `underline` atau `bottom`, `hero` `marker` atau `stack` |
| Pernyataan tegas | Satu kalimat yang ingin diingat | `cover` `poster` atau `card`, `hero` `band` |
| Frasa kunci | Satu frasa membawa maknanya | `cover` `highlight`, `circle`, atau `fade` |
| Koreksi anggapan | Anggapan umum yang keliru | `cover` `strike`, `hero` dengan motif `≠` |
| Kalimat yang sering terdengar | Ucapan orang tua, pasien, atau guru | `cover` `quote` |
| Pertanyaan pembaca | Pertanyaan yang sering masuk lewat DM | `hook` `bubble`, `mark`, atau `chat` |
| Dua pilihan | Dua hal yang sering dibandingkan | `hook` `options` |
| Tanda yang dikenali | Dua sampai empat gejala atau situasi | `cover` `tags` |
| Rasa penasaran | Kalimat yang sengaja menggantung | `cover` `blank` |
| Angka | Satu angka bersumber yang mengejutkan | `stat` `top`, `ring`, `side`, atau `bar` (batang persen) |
| Sekian dari sekian | Proporsi orang, misalnya 1 dari 4 anak | `stat` `dots` (deret ikon orang) |
| Adegan | Foto atau video yang langsung dikenali | `photo` `full`, `frame`, `circle`, atau `card` |
| Janji isi | Daftar isi atau tiga hal yang akan dibahas | `teaser` `index` atau `icons` |
| Pencarian | Pertanyaan yang biasa diketik orang tua | `teaser` `search` |
| Balik anggapan | Anggapan lama lalu cara pandang baru, dua baris | `contrast` `turn`, `band`, atau `split` |
| Tebak dulu | Kuis tiga pilihan, jawabannya di slide berikut | `hook` `quiz` |
| Posisikan diri | Skala dari satu ujung ke ujung lain | `hook` `scale` |

Tulis 3 sampai 14 alternatif di `covers` (lebih banyak lebih baik, selama setiap jenisnya berbeda), masing-masing dari jenis hook yang berbeda dan semuanya benar terhadap isi postingan. Slide pertama di `slides` adalah pilihan bawaan. Setiap alternatif adalah slide pembuka lengkap (`name`, `theme`, `component`, field komponennya) dan diperiksa scan serta verify seperti slide lain; scan memberi peringatan bila dua alternatif memakai tata letak yang sama. Di studio, pemilik memilih lewat panel Pengaturan (Pilihan cover) atau tombol Cover di bawah slide; slide 1, pemeriksaan, dan semua unduhan langsung memakai cover yang dipilih. Bila pemilik ingin pilihannya permanen, pindahkan alternatif itu ke `slides[0]`.

```json
"covers": [
  { "name": "Cover", "theme": "dark", "component": "cover", "variant": "strike", "title": "Kamu anak nakal.", "focus": "nakal", "kicker": "Yang dikoreksi cukup perbuatannya" },
  { "name": "Cover", "theme": "dark", "component": "hook", "variant": "chat", "title": "Kak, anakku kasar. Harus kubilang apa?", "sub": "Koreksi perilakunya tanpa memberinya label." },
  { "name": "Cover", "theme": "dark", "component": "cover", "variant": "tags", "title": "Pernah keluar kata seperti ini?", "tags": ["Kamu egois", "Kamu nakal", "Kamu malas"], "kicker": "Ada cara menegur yang lebih jelas" }
]
```

## Penutup: ajakan terakhir

Slide terakhir menentukan apa yang dilakukan pembaca setelah menggeser: menyimpan, mengirim, berkomentar, atau mengikuti. Pilih satu ajakan per penutup, dan tulis 2 sampai 6 alternatif di `closings` dengan jenis ajakan yang berbeda. Alternatif penutup bekerja seperti alternatif cover: dipilih di panel Pengaturan (Pilihan penutup) atau tombol pilihan di dok saat slide terakhir tampil, ikut diperiksa, dan dipakai semua unduhan. Disclaimer dan handle tetap muncul otomatis di footer.

| Jenis ajakan | Cocok untuk | Komponen dan varian |
| --- | --- | --- |
| Tanya kapan saja | Ajakan umum dengan karakter atau tipografi | `closing`, `outro` `strip` atau `card` |
| Ringkasan | Mengulang dua sampai tiga poin isi | `recap` `ticks` atau `lines` |
| Simpan | Isi yang akan dibaca lagi, misalnya daftar atau latihan | `action` `save` |
| Kirim | Isi yang berguna untuk orang lain | `action` `share` |
| Seri berikutnya | Postingan yang bersambung | `action` `next` |
| Pertanyaan terbuka | Mengajak pembaca bercerita di komentar | `prompt` `ask` |
| Pilih satu | Dua pilihan, dijawab A atau B di komentar | `prompt` `options` |
| Kata kunci | Pembaca menulis satu kata, akun membalas lewat DM | `prompt` `keyword` |
| Siapa kami | Foto dan nama fisioterapisnya, untuk kepercayaan | `profile` `photo` atau `card` |

Ajakan ditulis sebagai kalimat (misalnya "Tulis A atau B di komentar"), tidak pernah "klik" atau "ketuk".

```json
"closings": [
  { "name": "Penutup", "theme": "dark", "component": "prompt", "variant": "options", "title": "Anakmu lebih suka yang mana?", "options": ["Main di luar", "Main di rumah"], "cta": { "icon": "message-circle", "text": "Tulis A atau B di komentar" } },
  { "name": "Penutup", "theme": "dark", "component": "action", "variant": "save", "title": "Simpan untuk nanti.", "points": ["Satu latihan lima menit", "Tanda yang perlu diperiksa"], "cta": { "icon": "send", "text": "Kirim ke pasanganmu juga" } }
]
```

## Memilih komponen

Pilih dari bentuk isinya. Variasi muncul dari isi, varian, dan gerak, bukan dari dekorasi.

| Bentuk isi | Komponen |
| --- | --- |
| Masalah pembuka, satu penekanan di judul | `cover` (lihat Cover: hook pertama) |
| Masalah pembuka, tipografi besar, opsional motif "A bukan B" | `hero` |
| Pertanyaan yang sering ditanyakan pembaca | `hook` |
| Satu angka bersumber sebagai pembuka | `stat` |
| Foto atau video sebagai pembuka | `photo` |
| Cuplikan isi sebagai pembuka (daftar isi, pencarian, ikon) | `teaser` |
| Anggapan lama dibalik di slide pertama | `contrast` |
| Penjelasan satu gagasan | `statement` |
| Satu paragraf dengan satu frasa kunci | `callout` |
| Sebab akibat, proses, urutan | `steps`, `numbered` |
| Perubahan bertahap dari umum ke spesifik | `ladder` |
| Dari waktu ke waktu | `timeline` |
| Proses yang berulang | `cycle` |
| Dua hal berbeda yang saling melengkapi | `venn` |
| Dua hal yang perlu dipisahkan | `split` |
| Dua kalimat mirip dengan pesan berbeda | `versus` |
| Situasi dan kalimat, atau label dan pengganti, berpasangan | `pairs` |
| Kalimat yang bisa langsung diucapkan | `quotes` |
| Kalimat lama diganti beberapa kalimat baru | `swap` |
| Kalimat yang diharapkan dibanding yang dihindari | `reframe` |
| Anggapan keliru dan penjelasan benarnya | `myth` |
| Yang dilakukan dan yang dihindari | `dodont` |
| Tiga sampai lima butir sejajar | `list` |
| Empat hal sejajar yang mudah dipindai | `grid` |
| Tiga hal pendek yang dikenali dari gambarnya | `iconrow` |
| Tiga tindakan kecil yang bisa dicoba | `tiles` |
| Satu saran praktis | `tip` |
| Rumus yang bisa diulang, dengan satu contoh | `formula` |
| Sesuatu yang bertahap, bukan hitam putih | `spectrum` |
| Prioritas: dasar luas, puncak sedikit | `pyramid` |
| Empat kemungkinan dari dua pertanyaan | `matrix` |
| Satu angka dari sumber yang bisa dicek | `bignumber` |
| Satu kalimat yang ingin diingat | `pullquote` |
| Satu istilah dan artinya | `definition` |
| Satu pertanyaan dan jawabannya | `qa` |
| Dua sampai tiga pertanyaan pendek dengan jawabannya | `faq` |
| Satu gerakan atau posisi yang lebih jelas dilihat | `figure` |
| Dua foto dibandingkan, misalnya sebelum dan sesudah | `photopair` |
| Beberapa bagian dalam satu foto yang perlu ditunjuk | `pins` |
| Tiga contoh yang dikenali dari fotonya | `gallery` |
| Satu latihan dengan takaran dan caranya | `exercise` |
| Pengalaman orang tua atau pasien, dengan izin | `testimonial` |
| Tebak dulu, jawaban di slide berikutnya | `quiz` (`ask` lalu `reveal`) |
| Dua sampai empat besaran yang dibandingkan | `bars` |
| Berapa hari dalam seminggu | `week` |
| Kapan harus segera diperiksa | `flags` |
| Pola kalimat yang diisi sendiri | `script` |
| Prinsip yang diingat lewat satu kata | `acronym` |
| Satu tingkat dari tiga, misalnya ringan sampai berat | `gauge` |
| Ajakan dan penutup, dengan karakter anak | `closing` |
| Ajakan dan penutup, tipografi | `outro` |
| Ringkasan isi dan ajakan | `recap` |
| Pertanyaan untuk pembaca, dijawab di komentar | `prompt` |
| Simpan, kirim, atau ikuti seri berikutnya | `action` |
| Siapa yang menulis, dengan foto dan nama | `profile` |

## Variasi yang tetap satu keluarga

- Hindari komponen yang sama di dua slide berurutan, kecuali seri yang memang satu bentuk (satu slide per tahap). Satu komponen boleh muncul lagi di slide lain.
- Selang-seling `theme` terang dan gelap.
- Setiap komponen tambahan sudah punya gerak bawaan yang berbeda. Isi `motion` hanya bila ingin ritme lain, dan jangan memakai preset yang sama di lebih dari tiga slide.
- Warna sorotan hanya untuk satu penanda per slide. Komponen sudah mengaturnya; jangan memilih varian hanya demi warna.
- Kutipan langsung ditulis dengan tanda kutip lengkung di dalam teks.

## Aturan gaya

Komponen inti dan komponen buatan mengikuti aturan yang sama, dan gerbang komponen memeriksanya di browser. Aturan lengkapnya, beserta alasan dan angka batasnya, ada di `references/authoring.md` bagian "Tanpa pola AI" dan "Kerapian". Ringkasnya:

- Kartu tetap terang di slide gelap: kartu, teks di dalamnya, dan aksennya memakai palet terang, jadi komponen tampil sama di kedua tema. Yang ikut tema gelap hanya latar, teks lepas, garis, dan kotak bergaris tanpa isi warna. Diagram Venn di slide gelap duduk di panel terang.
- Setiap slide punya gambar: komponen bergambar, foto, karakter, atau satu ilustrasi di `art`. Slide yang hanya teks ditolak scan.
- Tidak ada garis aksen tebal di satu sisi kartu. Penekanan datang dari latar kartu, tebal huruf, dan ukuran.
- Garis paling tebal 2 px dan netral. Kartu radius 20 px, kotak kecil 12 px, kapsul hanya untuk teks satu baris.
- Ikon di samping teks tanpa wadah. Tidak ada label atau badge di atas judul.
- Nomor hanya untuk urutan yang nyata. Tidak ada hiasan tanpa informasi: kartu miring, huruf atau tanda baca raksasa, gradasi, bayangan. Ilustrasi hanya dari katalog engine, yang satu gaya dengan akun; jangan menggambar ilustrasi sendiri di komponen.
- Teks tidak keluar dari kotaknya atau dari zona konten, kata tidak terpotong di tengah, dan padding kartu cukup.
- Gerak melambat lalu diam, tanpa pantulan.
- Copy menyampaikan poin secara langsung. Kalimat slogan "X, bukan Y" cukup satu per postingan.

## Preset gerak

Isi `motion` di slide mana pun. Engine menghitung jeda setiap elemen dari urutan tampilnya, lalu memadatkannya sehingga elemen terakhir selalu diam sebelum 1,2 detik. Garis, batang, dan coretan tetap tergambar dengan caranya sendiri apa pun presetnya. Semua preset ikut terekam sama persis di MP4.

| Nama | Label | Gerak |
| --- | --- | --- |
| `classic` | Bawaan | Waktu asli tujuh komponen pertama. Komponen lain memakai gerak bawaannya sendiri. |
| `rise` | Naik | Naik pelan dan sedikit membesar. |
| `drop` | Turun | Turun dari atas lalu berhenti pelan. |
| `slide` | Geser masuk | Masuk dari kiri dengan perlambatan panjang. |
| `alternate` | Bergantian | Butir ganjil dari kiri, genap dari kanan. |
| `glide` | Meluncur | Meluncur jauh dari kanan, rapat satu sama lain. |
| `zoom` | Dekat | Membesar dari tengah. |
| `pop` | Muncul | Membesar cepat dari kecil lalu diam. |
| `stamp` | Cap | Turun dari depan seperti stempel. |
| `tilt` | Miring | Naik sambil tegak dari posisi miring. |
| `swing` | Ayun | Berayun dari sudut kiri atas lalu diam. |
| `fan` | Kipas | Membuka seperti kipas dari bawah. |
| `unfold` | Buka lipatan | Terbuka dari atas ke bawah. |
| `stretch` | Rentang | Merentang dari kiri. |
| `wipe` | Sapu | Tersingkap dari kiri ke kanan. |
| `curtain` | Tirai | Tersingkap dari atas ke bawah. |
| `cascade` | Bertingkat | Turun serong satu per satu. |
| `scatter` | Tersebar | Berkumpul dari arah yang berbeda-beda. |
| `typeset` | Kata demi kata | Judul muncul kata demi kata. |
| `spotlight` | Sorot | Semua muncul tenang, butir terakhir menyusul lebih besar. |
| `cinema` | Sinema | Judul turun dari ukuran besar, isi menyusul pelan. |

`classic` di komponen tambahan berarti gerak bawaannya sendiri. Preset `typeset` memecah judul menjadi kata; jumlah kata tetap dihitung sama.

## Batas khusus

Selain batas per field, beberapa komponen punya aturan tambahan yang diperiksa scan:

| Komponen | Aturan |
| --- | --- |
| `quotes` | Total karakter semua kutipan maksimal 140. Tiga kutipan panjang atau empat kutipan pendek |
| `pairs` | Total karakter kolom kanan maksimal 100 |
| `callout` | `highlight` harus muncul persis di dalam `text`, sebagai kata utuh |
| `cover` | `focus` wajib untuk `highlight`, `strike`, `circle`, dan `fade`: kata utuh dari `title`, maksimal 14 karakter agar tetap satu baris. `tags` (2 sampai 4 tanda) hanya untuk varian `tags`. `poster` maksimal 5 kata. `quote` ditulis tanpa tanda kutip, engine yang memasangnya. `blank` tanpa tanda baca di akhir judul. `character` dan `underline` hanya untuk `underline` |
| `hook` | `options` (tepat 2 pilihan, kata maksimal 11 huruf) hanya dan wajib untuk varian `options`. `choices` (tepat 3 pilihan) hanya dan wajib untuk `quiz`. `ends` hanya dan wajib untuk `scale` |
| `stat` | Varian `ring` dan `bar` hanya untuk persen 1% sampai 100%. Varian `side` untuk angka sampai 3 karakter dan kata di `title` maksimal 11 huruf. Varian `dots` menulis `value` sebagai "sekian/dari" (1/4, 3/10; penyebut 2 sampai 10) dan judulnya menyebut angkanya dengan kata |
| `contrast` | `before` satu baris (maksimal 22 karakter) agar coretannya lurus. Judul di studio dihitung bersama `before`, maksimal 11 kata |
| `pins` | `x` dan `y` dalam persen dari kiri dan atas foto, 0 sampai 100; titik di tepi digeser masuk sedikit. Varian `side`: kata keterangan maksimal 12 huruf. Hanya foto, bukan video |
| `gallery` | Tepat 3 foto |
| `quiz` | `answer` (A, B, atau C) dan `reason` hanya dan wajib untuk `reveal`; `note` hanya untuk `ask`. Pakai pilihan yang sama di slide `ask` dan `reveal` |
| `bars` | Setiap `value` angka lebih dari 0 (boleh dengan %). Batang terbesar memakai warna sorotan. Varian `columns`: kata di `label` maksimal 10 huruf |
| `week` | Tepat 7 hari, setiap hari menulis `on` (`true` atau `false`), minimal satu `true` |
| `flags` | Varian `cards` memakai 2 atau 4 tanda |
| `faq` | Varian `chat` maksimal 2 pasang |
| `script` | Setiap bagian: `text` lalu satu isian berlabel `slot`. Tanda baca setelah isian ditulis di awal bagian berikutnya (`". Kita coba"`); `end` menutup kalimat |
| `testimonial`, `profile` | Foto (`media`) hanya dan wajib untuk varian `photo` |
| `cycle` | Varian `loop` maksimal 3 butir. Pakai `ring` untuk 4 butir |
| `timeline` | Varian `horizontal` maksimal 3 titik. Pakai `vertical` untuk 4 titik |
| `formula` | Varian `circles` hanya untuk kata pendek, maksimal 10 huruf per kata |
| `ladder` | Varian `stairs` menaruh tiga butir berdampingan: kata di `tag` dan `text` maksimal 11 huruf |
| `qa` | Varian `split` menaruh pertanyaan di kolom sempit: kata di `title` maksimal 11 huruf |
| `swap` | Varian `columns` menaruh kalimat lama di kolom sempit: kata di `from` maksimal 11 huruf |
| `bignumber` | `value` berupa angka singkat, maksimal 6 karakter. Sebut sumber angkanya di `text` atau caption. Varian `left` menaruh angka sampai 3 karakter di samping judul, dan kata di `title` maksimal 11 huruf; angka 4 karakter atau lebih otomatis ditaruh di atas judul |

"Kata maksimal N huruf" di tabel field berarti kotaknya sempit: kata yang lebih panjang akan terpotong di tengah, jadi scan menolaknya. Ganti dengan kata yang lebih pendek atau pakai varian yang lebih lebar. Judul besar (komponen pembuka dan penutup) tidak punya batas ini; engine menurunkan ukurannya ke 92 px bila ada kata 13 atau 14 huruf, dan ke 80 px bila ada kata 15 huruf atau lebih, supaya kata itu pindah baris utuh.

## Komponen asli

### cover

Slide pertama. Judul besar dengan satu penekanan, lalu `kicker` sebagai kalimat pendukung di bawahnya. Setiap varian adalah jenis hook yang berbeda; lihat Cover: hook pertama.

Varian, dengan gerak bawaannya:

| Varian | Tampilan | Gerak |
| --- | --- | --- |
| `underline` | Rata tengah, kata terakhir bergaris gelombang (bawaan) | waktu asli |
| `bottom` | Rata kiri di bagian bawah, ruang kosong di atas, garis tipis lalu kicker | `rise` |
| `poster` | Satu kata per baris, kata terakhir beraksen | `typeset` |
| `highlight` | Frasa `focus` distabilo warna sorotan | `wipe` |
| `strike` | Frasa `focus` yang keliru dicoret dan diredupkan | `rise` |
| `circle` | Frasa `focus` dilingkari goresan tangan, rata tengah | `zoom` |
| `fade` | Seluruh judul diredupkan kecuali frasa `focus` | `typeset` |
| `card` | Judul dan kicker di kartu kontras: gelap di slide terang, terang di slide gelap | `unfold` |
| `tags` | Judul, lalu dua sampai empat tanda dalam kapsul | `cascade` |
| `blank` | Kalimat rumpang yang diakhiri garis kosong | `rise` |
| `quote` | Kalimat yang sering terdengar, tanda kutip menggantung di kiri | `slide` |

Karakter anak di jungkat-jungkit (`"character": "balance"`, hanya varian `underline`) masih tersedia untuk postingan lama, tapi bawaannya `none`: ilustrasinya sederhana dan terbaca sebagai gambar buatan tangan. Pakai hanya bila pemilik akun memintanya.

| Field | Wajib | Batas |
| --- | --- | --- |
| `kicker` | tidak | 6 kata, 40 karakter. Tampil di bawah judul |
| `title` | ya | `coverTitleMax` kata (bawaan 6), 48 karakter |
| `focus` | untuk `highlight`, `strike`, `circle`, `fade` | 3 kata, 14 karakter, disalin persis dari `title` |
| `tags` | untuk `tags` | 2 sampai 4 butir, masing-masing 3 kata, 18 karakter |
| `character` | tidak | `none` (bawaan) atau `balance`, hanya `underline` |
| `underline` | tidak | `true` (bawaan) atau `false`, hanya `underline` |

```json
{ "name": "Cover", "theme": "dark", "component": "cover", "kicker": "Gerak anak, pelan-pelan dikenali", "title": "Jatuh bukan selalu karena ceroboh." }
{ "name": "Cover", "theme": "dark", "component": "cover", "variant": "strike", "title": "Jinjit itu cuma kebiasaan.", "focus": "cuma kebiasaan", "kicker": "Kadang ada sebab yang perlu dicek" }
{ "name": "Cover", "theme": "dark", "component": "cover", "variant": "tags", "title": "Anakmu sering seperti ini?", "tags": ["Mudah tersandung", "Jalan jinjit", "Cepat lelah"], "kicker": "Kenali tandanya lebih awal" }
```

### statement

Judul dan satu paragraf. Untuk penjelasan yang tidak berbentuk daftar atau urutan.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata (bawaan 8), 60 karakter |
| `body` | ya | 35 kata, 220 karakter |

### steps

Dua sampai empat langkah berurutan di jalur zig-zag, di kotak radius 20 yang tegak. Titik berjalan menyusuri jalur dan setiap langkah muncul saat titik tiba. Langkah terakhir memakai warna sorotan.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `steps` | ya | 2 sampai 4 butir, masing-masing 4 kata dan 24 karakter |

```json
{ "name": "Penjelasan", "theme": "light", "component": "steps", "title": "Satu bagian tertinggal, semua ikut bergeser.", "steps": ["Satu bagian tertinggal", "Tubuh cari jalan lain", "Gerak jadi boros", "Cepat lelah"] }
```

### venn

Dua lingkaran yang saling bertemu, masing-masing dengan ikon, label, dan contoh. Irisan diberi nama, dan gelembung di bawahnya menjelaskan irisan itu.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 44 karakter (diagramnya tinggi) |
| `left`, `right` | ya | `label` 1 kata dan 10 karakter, `sub` 3 kata dan 16 karakter, `icon` dari katalog |
| `overlap` | ya | 2 kata, 12 karakter |
| `note` | ya | 12 kata, 80 karakter |

```json
{ "name": "Perbedaan", "theme": "light", "component": "venn", "title": "Dua gerak, satu tim.",
  "left": { "label": "Kasar", "sub": "lari, lompat", "icon": "run" },
  "right": { "label": "Halus", "sub": "genggam, tulis", "icon": "pencil" },
  "overlap": "Koordinasi", "note": "Keduanya bekerja bersama, misalnya saat menangkap bola." }
```

### list

Tiga sampai lima butir sejajar, dipisah garis tipis dengan penanda titik. Butirnya tidak berurutan, jadi tidak diberi nomor. Tidak ada kotak centang atau penghitung karena postingan tidak bisa dicentang.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `items` | ya | 3 sampai 5 butir, masing-masing 6 kata dan 38 karakter |
| `note` | tidak | 12 kata, 80 karakter. Tempat kalimat seperti "Tanda ini bukan diagnosis." |

### tiles

Tepat tiga baris tindakan. Ikon garis berdiri di samping judul tanpa wadah, contoh di bawah judul, dipisah garis tipis.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `tiles` | ya | Tepat 3 objek: `icon` dari katalog, `title` 5 kata dan 26 karakter, `text` 7 kata dan 40 karakter |

### closing

Slide terakhir. Judul besar, satu kalimat pendukung, dan satu ajakan berupa kalimat dengan ikon, bukan tombol. Footer berisi disclaimer akun dan handle secara otomatis. Karakter melambai (`"character": "wave"`) hanya bila diminta pemilik akun.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `coverTitleMax` kata, 36 karakter |
| `lede` | tidak | 8 kata, 44 karakter |
| `cta` | ya | `icon` dari katalog, `text` 6 kata dan 32 karakter, diawali kata kerja |
| `character` | tidak | `none` (bawaan) atau `wave` |

## Komponen tambahan

### hero

Pembuka tipografi. Judul besar tanpa karakter, dengan motif dua hal. Hanya di slide pertama. Motif opsional untuk dua hal yang dibedakan.

Varian: `marker` (kata terakhir bergaris sorotan), `stack` (rata kiri dengan garis pemisah), `band` (judul di atas pita aksen). Gerak bawaan: `typeset`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `coverTitleMax` kata, 48 karakter |
| `sub` | tidak | 12 kata, 80 karakter |
| `motif` | tidak | objek: `left` 2 kata, 12 karakter; `sign` `≠`, `→`, `+`, `=`, `vs`; `right` 2 kata, 12 karakter |

```json
{"name":"Hero","theme":"dark","component":"hero","variant":"marker","title":"Koreksi perilakunya, terima sepenuhnya anaknya.","sub":"Perbaiki apa yang dilakukan anak tanpa menjadikannya bagian dari siapa dirinya.","motif":{"left":"Perbuatan","sign":"≠","right":"Diri anak"}}
```

### outro

Penutup tipografi. Judul, kalimat pendukung, dan ajakan tanpa karakter. Hanya di slide terakhir. Ajakan berupa kalimat dengan ikon, bukan tombol.

Varian: `strip` (rata kiri dengan garis ajakan), `card` (judul di dalam kartu). Gerak bawaan: `rise`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `coverTitleMax` kata, 36 karakter |
| `lede` | tidak | 8 kata, 44 karakter |
| `cta` | ya | objek: `icon` ikon dari katalog; `text` 6 kata, 32 karakter |

```json
{"name":"Outro","theme":"light","component":"outro","variant":"strip","title":"Mulai dari satu kalimat.","lede":"Pilih satu contoh, coba minggu ini.","cta":{"icon":"send","text":"Kirim pertanyaanmu lewat DM"}}
```

### pairs

Pasangan. Baris berpasangan dengan dua kepala kolom. Dua sampai tiga baris. Kolom kanan adalah sisi yang ditekankan.

Varian: `table` (tabel dua kolom), `arrows` (kiri ke kanan dengan panah), `stacked` (pasangan bertumpuk). Gerak bawaan: `alternate`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `heads` | ya | objek: `left` 2 kata, 14 karakter; `right` 2 kata, 14 karakter |
| `rows` | ya | 2 sampai 3 butir, masing-masing objek: `left` 4 kata, 24 karakter; `right` 7 kata, 40 karakter |
| `note` | tidak | 9 kata, 54 karakter |

```json
{"name":"Pairs","theme":"light","component":"pairs","variant":"table","title":"Label keluar begitu cepat dari mulut kita.","heads":{"left":"Saat anak","right":"Yang terucap"},"rows":[{"left":"Merebut mainan adiknya","right":"“Kamu memang egois sekali.”"},{"left":"Berteriak saat dilarang","right":"“Kamu nakal, bikin malu saja.”"},{"left":"Tidak mau beres-beres","right":"“Dasar pemalas, selalu begitu.”"}],"note":"Kini anak mencerna dua hal: perbuatannya dan labelnya."}
```

### quotes

Kutipan berderet. Dua sampai empat kalimat yang diucapkan. Setiap butir satu kalimat yang bisa diucapkan.

Varian: `lines` (baris dipisah garis tipis), `chat` (gelembung obrolan bergantian). Gerak bawaan: `wipe`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `lead` | tidak | 7 kata, 44 karakter |
| `quotes` | ya | 2 sampai 4 butir, masing-masing 9 kata, 44 karakter |
| `note` | tidak | 10 kata, 60 karakter |

```json
{"name":"Quotes","theme":"dark","component":"quotes","variant":"lines","title":"Lalu beri batas yang jelas dan tenang.","lead":"Coba ucapkan dengan suara pelan:","quotes":["“Kamu boleh marah. Tidak boleh berteriak.”","“Kamu ingin truknya. Tidak boleh merebut.”","“Mainan tetap perlu dibereskan, ya.”"],"note":"Perasaannya diterima, perilakunya dibatasi."}
```

### split

Pisahkan. Dua hal dipisahkan oleh satu kata penghubung. Kiri hal yang diterima, kanan hal yang perlu berubah.

Varian: `boxes` (dua kotak berdampingan), `circles` (dua lingkaran). Gerak bawaan: `unfold`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `left` | ya | 3 kata, 18 karakter, kata maksimal 11 huruf |
| `joiner` | ya | 1 kata, 7 karakter |
| `right` | ya | 5 kata, 30 karakter, kata maksimal 14 huruf |
| `example` | tidak | 14 kata, 90 karakter |

```json
{"name":"Split","theme":"light","component":"split","variant":"boxes","title":"Yang kamu pisahkan sebenarnya dua hal.","left":"Perasaan anaknya","joiner":"dari","right":"perilaku yang perlu berubah","example":"“Kamu boleh kesal. Tapi memukul tidak boleh, karena itu menyakiti temanmu.”"}
```

### ladder

Tangga. Tiga kartu bertingkat dengan label kecil. Tepat tiga tingkat. Tingkat terakhir yang ditekankan.

Varian: `cascade` (kartu menjorok bertingkat), `stairs` (anak tangga naik), `rail` (rel vertikal dengan titik). Gerak bawaan: `cascade`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `items` | ya | tepat 3 butir, masing-masing objek: `tag` 2 kata, 14 karakter; `text` 6 kata, 36 karakter |
| `note` | tidak | 9 kata, 54 karakter |

```json
{"name":"Ladder","theme":"dark","component":"ladder","variant":"cascade","title":"Lihat bedanya dari label ke langkah.","items":[{"tag":"Label","text":"“Kamu memang suka mengatur orang.”"},{"tag":"Perilaku","text":"“Kamu terus menyuruh temanmu.”"},{"tag":"Langkah","text":"“Coba tanya dulu, mau main apa?”"}],"note":"Itu memberi anak sesuatu yang bisa diubah."}
```

### versus

Berhadapan. Dua kalimat berdampingan dengan keterangan. Kiri yang dianjurkan, kanan yang dihindari.

Varian: `cards` (dua kartu dengan pembatas), `columns` (dua kolom tanpa kartu). Gerak bawaan: `alternate`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `left` | ya | objek: `text` 5 kata, 30 karakter, kata maksimal 14 huruf; `caption` 7 kata, 44 karakter |
| `right` | ya | objek: `text` 5 kata, 30 karakter, kata maksimal 14 huruf; `caption` 7 kata, 44 karakter |
| `joiner` | tidak | 3 kata, 20 karakter |

```json
{"name":"Versus","theme":"light","component":"versus","variant":"cards","title":"Tegas tanpa menjadikan anak masalahnya.","left":{"text":"“Memukul itu tidak boleh.”","caption":"Kalimat ini mengoreksi satu perbuatan saja."},"right":{"text":"“Kamu anak yang nakal.”","caption":"Kalimat ini terdengar seperti definisi diri."},"joiner":"berbeda dengan"}
```

### formula

Rumus. Dua sampai tiga unsur yang dijumlahkan, contoh, dan tiga kata kunci. Unsur berurutan. Kata kunci terakhir memakai warna sorotan.

Varian: `boxes` (kotak dan tanda tambah), `circles` (lingkaran dan tanda tambah), `chain` (kotak di satu garis). Gerak bawaan: `pop`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `terms` | ya | 2 sampai 3 butir, masing-masing 3 kata, 18 karakter, kata maksimal 11 huruf |
| `example` | tidak | 20 kata, 120 karakter |
| `tags` | tidak | tepat 3 butir, masing-masing 2 kata, 14 karakter, kata maksimal 12 huruf |

```json
{"name":"Formula","theme":"dark","component":"formula","variant":"boxes","title":"Rumus yang bisa dipakai setiap hari.","terms":["Apa yang terjadi","Batasnya","Langkah berikutnya"],"example":"“Kamu melempar gelas. Gelas tetap di meja. Kalau sudah selesai, bilang ‘sudah’ saja, ya.”","tags":["Jelas.","Spesifik.","Bisa dipakai."]}
```

### reframe

Ubah sudut pandang. Kalimat yang diharapkan dan kalimat yang dihindari. Kalimat utama di kartu sorotan, pembanding di kartu bergaris tipis.

Varian: `stack` (bertumpuk menjorok), `strike` (pembanding dicoret). Gerak bawaan: `rise`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `lead` | tidak | 8 kata, 48 karakter |
| `quote` | ya | 9 kata, 54 karakter |
| `joiner` | ya | 2 kata, 14 karakter |
| `counter` | ya | 9 kata, 54 karakter |

```json
{"name":"Reframe","theme":"light","component":"reframe","variant":"stack","title":"Tujuannya bukan berhenti mengoreksi anak.","lead":"Melainkan agar anak berkata dalam hati:","quote":"“Aku perlu memperbaiki perbuatanku tadi.”","joiner":"bukan","counter":"“Ada yang salah dengan diriku sendiri.”"}
```

### hook

Pembuka pertanyaan. Pertanyaan besar yang dikenali pembaca. Hanya di slide pertama. Judul berupa pertanyaan.

Varian: `bubble` (pertanyaan di gelembung bicara), `mark` (rata kiri, tanda tanya beraksen seukuran judul), `chat` (pertanyaan sebagai pesan masuk, `sub` sebagai balasan singkat; gerak `rise`), `options` (pertanyaan dengan dua pilihan yang setara; gerak `pop`). Gerak bawaan: `pop`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `coverTitleMax` kata, 56 karakter |
| `sub` | tidak | 12 kata, 80 karakter |
| `options` | untuk `options` | tepat 2 butir, masing-masing 3 kata, 18 karakter, kata maksimal 11 huruf |

```json
{"name":"Hook","theme":"dark","component":"hook","variant":"bubble","title":"Kenapa anakku sering tersandung saat berlari?","sub":"Jawabannya jarang sesederhana ceroboh. Kita urai pelan-pelan di slide berikut."}
{"name":"Hook","theme":"dark","component":"hook","variant":"options","title":"Mana yang lebih baik untuk anak?","options":["Sepatu keras","Telanjang kaki"],"sub":"Jawabannya tergantung tempatnya."}
{"name":"Cover","theme":"dark","component":"hook","variant":"quiz","title":"Kenapa anak sering tersandung?","choices":["Memang ceroboh","Kurang tidur","Otot kakinya cepat lelah"],"sub":"Tebak dulu. Jawabannya di slide 5."}
{"name":"Cover","theme":"light","component":"hook","variant":"scale","title":"Seberapa sering anakmu jatuh?","ends":{"left":"Jarang","right":"Setiap hari"},"sub":"Ingat jawabanmu sambil menggeser."}
```

Varian `quiz` (tiga pilihan berhuruf, `choices` 3 butir, masing-masing 4 kata, 26 karakter; gerak `cascade`) dan `scale` (skala lima titik dengan `ends.left` dan `ends.right`, masing-masing 2 kata, 14 karakter; gerak `stretch`) mengajak pembaca menebak atau memposisikan diri sebelum menggeser.

### stat

Pembuka angka. Satu angka besar sebagai hook di slide pertama, dengan sumbernya di `sub`. Pakai hanya angka yang benar dan bisa dicek.

Varian: `top` (angka 160 px di atas judul), `ring` (persen di dalam cincin yang terisi sebesar angkanya; gerak `zoom`), `side` (angka di samping judul; gerak `slide`), `bar` (persen di atas batang yang terisi; gerak `stretch`), `dots` (deret ikon orang, sebagian ditandai, untuk "1 dari 4"; gerak `pop`). Gerak bawaan: `rise`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `value` | ya | angka singkat, 6 karakter. `ring`: 1% sampai 100%. `side`: sampai 3 karakter |
| `title` | ya | `coverTitleMax` kata, 48 karakter. `side`: kata maksimal 11 huruf |
| `sub` | tidak | 12 kata, 80 karakter. Tempat sumbernya |

```json
{"name":"Cover","theme":"dark","component":"stat","variant":"ring","value":"81%","title":"Remaja yang kurang bergerak.","sub":"Data WHO 2016, usia 11 sampai 17 tahun."}
```

### recap

Penutup ringkasan. Judul, dua sampai tiga poin ringkasan, dan ajakan. Hanya di slide terakhir. Poin mengulang isi, bukan isi baru.

Varian: `ticks` (poin bertanda centang), `lines` (poin dipisah garis tipis). Gerak bawaan: `cascade`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `coverTitleMax` kata, 36 karakter |
| `points` | ya | 2 sampai 3 butir, masing-masing 6 kata, 36 karakter |
| `cta` | ya | objek: `icon` ikon dari katalog; `text` 6 kata, 32 karakter |

```json
{"name":"Recap","theme":"light","component":"recap","variant":"ticks","title":"Yang perlu diingat.","points":["Jatuh sesekali itu wajar","Catat bila terlihat berulang","Tanya fisioterapis bila ragu"],"cta":{"icon":"send","text":"Kirim pertanyaanmu lewat DM"}}
```

### swap

Ganti kalimat. Kalimat lama dicoret, diganti dua sampai tiga kalimat baru. Kalimat lama tetap terbaca walau dicoret.

Varian: `cards` (kartu pengganti bertumpuk), `list` (daftar dengan panah), `columns` (lama di kiri, baru di kanan). Gerak bawaan: `fan`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `from` | ya | 5 kata, 30 karakter |
| `to` | ya | 2 sampai 3 butir, masing-masing 6 kata, 32 karakter |
| `note` | tidak | 9 kata, 54 karakter |

```json
{"name":"Swap","theme":"light","component":"swap","variant":"cards","title":"Ganti larangan dengan arahan.","from":"“Jangan lari, nanti jatuh.”","to":["“Coba pelan, lihat kakimu.”","“Pegang pegangan tangganya.”","“Kalau lelah, istirahat dulu.”"],"note":"Anak belajar dari apa yang boleh dilakukan."}
```

### bignumber

Angka besar. Satu angka besar dengan penjelasan. Angka dari sumber yang bisa dicek. Tulis sumbernya di isi atau caption.

Varian: `center` (angka di tengah), `left` (angka di kiri, teks di kanan). Gerak bawaan: `stamp`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `value` | ya | angka singkat, 6 karakter, misalnya `60`, `3x`, `80%` |
| `title` | ya | `titleMax` kata, 60 karakter |
| `text` | tidak | 20 kata, 120 karakter |

```json
{"name":"Big","theme":"dark","component":"bignumber","variant":"center","value":"60","title":"Menit bergerak aktif setiap hari.","text":"Rekomendasi umum WHO untuk anak usia 5 sampai 17 tahun, boleh dicicil sepanjang hari."}
```

### pullquote

Kutipan besar. Satu kutipan besar dengan sumber. Satu kutipan saja. Sebut sumber bila bukan kalimat akun sendiri.

Varian: `plain` (kutipan besar rata kiri), `card` (kutipan di kartu kontras: gelap di slide terang, terang di slide gelap), `rule` (diapit dua garis tipis). Gerak bawaan: `typeset`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `quote` | ya | 22 kata, 130 karakter |
| `by` | tidak | 4 kata, 30 karakter |

```json
{"name":"Quote","theme":"light","component":"pullquote","variant":"plain","quote":"Anak tidak perlu sempurna saat bergerak. Ia perlu kesempatan mencoba, jatuh sedikit, lalu mencoba lagi dengan aman.","by":"Tim fisioterapi anak"}
```

### myth

Keliru dan benar. Anggapan keliru lalu penjelasan yang benar. Anggapan keliru tetap terbaca. Penjelasan benar lebih menonjol.

Varian: `stack` (bertumpuk), `split` (berdampingan). Gerak bawaan: `slide`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `wrong` | ya | objek: `label` 2 kata, 14 karakter; `text` 14 kata, 84 karakter |
| `right` | ya | objek: `label` 2 kata, 14 karakter; `text` 16 kata, 96 karakter |

```json
{"name":"Myth","theme":"dark","component":"myth","variant":"stack","title":"Anggapan yang sering keliru.","wrong":{"label":"Anggapan","text":"Anak yang sering jatuh berarti memang ceroboh dan nanti juga hilang sendiri."},"right":{"label":"Faktanya","text":"Jatuh berulang bisa terkait keseimbangan atau kekuatan otot. Catat polanya bila sering."}}
```

### dodont

Lakukan dan hindari. Dua daftar pendek: yang dilakukan dan yang dihindari. Ikon centang dan silang hanya penanda, bukan kotak yang bisa dicentang.

Varian: `columns` (dua kolom), `rows` (dua baris). Gerak bawaan: `drop`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `do` | ya | objek: `label` 2 kata, 14 karakter; `items` 2 sampai 3 butir, masing-masing 5 kata, 30 karakter |
| `dont` | ya | objek: `label` 2 kata, 14 karakter; `items` 2 sampai 3 butir, masing-masing 5 kata, 30 karakter |

```json
{"name":"Dodont","theme":"light","component":"dodont","variant":"columns","title":"Saat anak belajar naik tangga.","do":{"label":"Lakukan","items":["Jaga dari satu anak tangga","Biarkan ia memegang pegangan","Puji usahanya, bukan hasilnya"]},"dont":{"label":"Hindari","items":["Menariknya agar lebih cepat","Menggendong setiap kali ragu","Membandingkan dengan kakaknya"]}}
```

### timeline

Garis waktu. Tiga sampai empat titik waktu. Titik berurutan menurut waktu. Titik terakhir memakai warna sorotan.

Varian: `vertical` (garis tegak), `horizontal` (garis mendatar). Gerak bawaan: `cascade`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `points` | ya | 3 sampai 4 butir, masing-masing objek: `when` 2 kata, 14 karakter; `text` 7 kata, 40 karakter |

```json
{"name":"Timeline","theme":"dark","component":"timeline","variant":"vertical","title":"Perkembangan berjalan secara umum.","points":[{"when":"9-12 bulan","text":"Berdiri berpegangan, merambat di sofa."},{"when":"12-15 bulan","text":"Langkah pertama tanpa dipegang orang."},{"when":"18 bulan","text":"Berjalan stabil dan mulai naik tangga."},{"when":"2 tahun","text":"Berlari pendek dan menendang bola."}]}
```

### grid

Kisi ikon. Empat sel dua kali dua dengan garis pemisah, ikon di samping teks. Tepat empat sel yang setara. Kalau ada satu yang paling penting, pakai komponen lain.

Varian: `lines` (garis pemisah). Gerak bawaan: `scatter`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `cells` | ya | tepat 4 butir, masing-masing objek: `icon` ikon dari katalog; `text` 5 kata, 28 karakter |

```json
{"name":"Grid","theme":"light","component":"grid","variant":"lines","title":"Empat hal yang melatih keseimbangan.","cells":[{"icon":"walk","text":"Berjalan di garis lurus"},{"icon":"stairs","text":"Naik turun tangga pelan"},{"icon":"ball-football","text":"Menendang bola diam"},{"icon":"yoga","text":"Berdiri satu kaki sebentar"}]}
```

### iconrow

Baris ikon. Tiga ikon besar berderet dengan label. Tepat tiga ikon. Label pendek.

Varian: `plain` (ikon garis dengan pembatas). Gerak bawaan: `zoom`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `items` | ya | tepat 3 butir, masing-masing objek: `icon` ikon dari katalog; `label` 3 kata, 20 karakter, kata maksimal 11 huruf |
| `note` | tidak | 14 kata, 90 karakter |

```json
{"name":"Iconrow","theme":"dark","component":"iconrow","variant":"plain","title":"Tiga kebiasaan kecil hari ini.","items":[{"icon":"trees","label":"Main di luar"},{"icon":"bike","label":"Bersepeda santai"},{"icon":"moon","label":"Tidur cukup"}],"note":"Kebiasaan kecil yang konsisten lebih berarti daripada latihan berat sesekali."}
```

### spectrum

Spektrum. Satu garis dari satu ujung ke ujung lain dengan tiga titik. Tepat tiga titik, berurutan dari ujung kiri ke kanan.

Varian: `bar` (garis dengan tiga titik), `dots` (titik yang membesar). Gerak bawaan: `stretch`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `ends` | ya | objek: `left` 2 kata, 14 karakter; `right` 2 kata, 14 karakter; kata maksimal 13 huruf |
| `points` | ya | tepat 3 butir, masing-masing 4 kata, 24 karakter, kata maksimal 13 huruf |
| `note` | tidak | 10 kata, 60 karakter |

```json
{"name":"Spectrum","theme":"light","component":"spectrum","variant":"bar","title":"Gerak anak itu bertahap, bukan lulus atau gagal.","ends":{"left":"Baru mencoba","right":"Lancar"},"points":["Masih dipegangi","Berjalan sambil goyah","Berlari dan berhenti"],"note":"Setiap anak punya kecepatannya sendiri."}
```

### callout

Sorotan. Satu paragraf besar dengan frasa yang disorot. Frasa sorotan harus muncul persis di dalam isi.

Varian: `marker` (garis bawah sorotan), `box` (di dalam kartu). Gerak bawaan: `wipe`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `text` | ya | 28 kata, 170 karakter |
| `highlight` | tidak | 4 kata, 30 karakter |

```json
{"name":"Callout","theme":"dark","component":"callout","variant":"marker","title":"Satu hal yang paling penting.","text":"Latihan terbaik untuk anak adalah bermain. Lima belas menit bermain aktif bersama orang tua sering lebih berarti daripada satu jam latihan yang dipaksakan.","highlight":"bermain aktif bersama"}
```

### qa

Tanya jawab. Satu pertanyaan dan jawabannya. Judul berupa pertanyaan. Jawaban langsung, tanpa basa-basi.

Varian: `chat` (gelembung obrolan), `card` (kartu jawaban), `split` (dua kolom). Gerak bawaan: `pop`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `answer` | ya | 28 kata, 170 karakter |

```json
{"name":"QA","theme":"light","component":"qa","variant":"chat","title":"Perlukah anak memakai sepatu saat belajar berjalan?","answer":"Di dalam rumah, telanjang kaki membantu anak merasakan lantai dan melatih otot kaki. Di luar, pilih sepatu yang ringan, lentur, dan tidak licin."}
```

### cycle

Siklus. Tiga sampai empat hal yang berputar dalam lingkaran. Urutan searah jarum jam. Tengah lingkaran opsional.

Varian: `ring` (lingkaran), `loop` (deretan dengan panah kembali). Gerak bawaan: `pop`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `items` | ya | 3 sampai 4 butir, masing-masing 3 kata, 18 karakter, kata maksimal 11 huruf |
| `center` | tidak | 2 kata, 14 karakter, kata maksimal 10 huruf |

```json
{"name":"Cycle","theme":"dark","component":"cycle","variant":"ring","title":"Kebiasaan yang saling menguatkan.","items":["Tidur cukup","Gerak aktif","Makan bergizi","Layar dibatasi"]}
```

### pyramid

Piramida. Tiga tingkat yang melebar atau menyempit. Tepat tiga tingkat, ditulis dari atas ke bawah.

Varian: `pyramid` (melebar ke bawah), `funnel` (menyempit ke bawah). Gerak bawaan: `drop`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `levels` | ya | tepat 3 butir, masing-masing 4 kata, 26 karakter |
| `note` | tidak | 10 kata, 60 karakter |

```json
{"name":"Pyramid","theme":"light","component":"pyramid","variant":"pyramid","title":"Urutan prioritas gerak harian.","levels":["Olahraga terstruktur","Bermain aktif di luar","Bergerak sepanjang hari"],"note":"Dasar yang luas lebih penting dari puncaknya."}
```

### matrix

Matriks. Empat kotak dua kali dua dengan dua sumbu. Sel kanan atas yang ditekankan. Sumbu ditulis singkat.

Varian: `quad` (dengan sumbu), `cards` (kartu tanpa sumbu). Gerak bawaan: `zoom`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `axes` | tidak | objek: `x` 2 kata, 14 karakter; `y` 2 kata, 14 karakter |
| `cells` | ya | tepat 4 butir, masing-masing 4 kata, 24 karakter |

```json
{"name":"Matrix","theme":"dark","component":"matrix","variant":"quad","title":"Kapan perlu konsultasi?","axes":{"x":"Makin sering","y":"Makin berat"},"cells":["Catat dan tanyakan","Segera konsultasikan","Pantau saja di rumah","Catat polanya"]}
```

### numbered

Langkah bernomor. Dua sampai empat langkah dengan nomor besar. Langkah benar-benar berurutan.

Varian: `rail` (nomor besar dan garis pemisah), `badges` (nomor di lencana), `outline` (nomor dalam lingkaran bergaris). Gerak bawaan: `slide`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `items` | ya | 2 sampai 4 butir, masing-masing 7 kata, 40 karakter |

```json
{"name":"Numbered","theme":"light","component":"numbered","variant":"rail","title":"Cara melatih keseimbangan di rumah.","items":["Berjalan di atas garis selotip di lantai","Berdiri satu kaki sambil menghitung lima","Melangkah di atas bantal yang disusun","Mengulang dengan mata tetap ke depan"]}
```

### tip

Kartu tips. Satu tips dengan ikon dan label. Satu tips saja per kartu.

Varian: `card` (kartu), `banner` (kartu aksen dengan ikon besar). Gerak bawaan: `swing`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `label` | tidak | 2 kata, 14 karakter |
| `icon` | ya | ikon dari katalog |
| `text` | ya | 26 kata, 160 karakter |

```json
{"name":"Tip","theme":"dark","component":"tip","variant":"card","title":"Sebelum mulai latihan apa pun.","label":"Tips aman","icon":"shield-check","text":"Pastikan area bermain lapang dan lantainya tidak licin. Dampingi anak dari dekat, dan berhenti saat ia terlihat lelah atau kesakitan."}
```

### definition

Definisi. Satu istilah dengan arti dan contoh. Judul adalah istilahnya. Arti dalam bahasa sehari-hari.

Varian: `dict` (gaya kamus), `card` (istilah di pita). Gerak bawaan: `typeset`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 40 karakter |
| `kind` | tidak | 3 kata, 20 karakter |
| `meaning` | ya | 22 kata, 130 karakter |
| `example` | tidak | 11 kata, 70 karakter |

```json
{"name":"Definition","theme":"dark","component":"definition","variant":"dict","title":"Propriosepsi","kind":"kata benda","meaning":"Kemampuan tubuh merasakan posisi dan gerak bagiannya sendiri tanpa harus melihat, misalnya tahu letak kaki saat menaiki tangga.","example":"Anak bisa menyentuh hidung dengan mata tertutup."}
```

## Komponen batch keempat: foto, ajakan berpikir, dan penutup

Foto dan video mengikuti aturan di bagian Foto dan video. Contoh JSON di bawah memakai berkas contoh dari `assets/media/`; ganti dengan berkas di `posts/<slug>/media/`.

### photo

Pembuka foto. Foto atau video besar dengan judul di latar slide. Satu adegan yang dikenali pembaca, dengan masalahnya dalam satu kalimat. Hanya di slide pertama. Teks tidak pernah ditulis di atas foto; foto milik akun sendiri, dengan izin orang di dalamnya.

Varian: `full` (foto selebar kanvas, memudar ke latar di bawahnya), `frame` (foto dalam bingkai di atas judul), `circle` (foto bulat di tengah), `card` (foto penuh dengan judul di panel latar). Gerak bawaan: `rise`; per varian: `frame` unfold, `circle` zoom, `card` rise.

| Field | Wajib | Batas |
| --- | --- | --- |
| `media` | ya | foto atau video: `{ "src", "alt", "focus" }` |
| `title` | ya | `coverTitleMax` kata, 48 karakter |
| `kicker` | tidak | 6 kata, 40 karakter |

```json
{"name":"Cover","theme":"dark","component":"photo","variant":"full","media":{"src":"contoh-seimbang.jpg","alt":"Anak berjalan di atas balok kayu di taman dengan tangan terbuka"},"title":"Keseimbangan dilatih lewat bermain.","kicker":"Lima permainan di taman dekat rumah"}
```

### teaser

Pembuka janji isi. Judul dengan cuplikan isi carousel. Menunjukkan apa yang didapat pembaca kalau terus menggeser. Hanya di slide pertama. Cuplikan harus benar-benar ada di slide berikutnya.

Varian: `index` (daftar isi bernomor), `search` (pertanyaan di kotak pencarian, dengan saran pencarian), `icons` (tiga ikon isi berderet). Gerak bawaan: `cascade`; per varian: `search` rise, `icons` zoom.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `coverTitleMax` kata, 52 karakter |
| `items` | ya (hanya `index`) | 3 sampai 4 butir; tiap butir 5 kata, 30 karakter |
| `suggest` | ya (hanya `search`) | 2 sampai 3 butir; tiap butir 6 kata, 36 karakter |
| `icons` | ya (hanya `icons`) | 3 butir; tiap butir objek |
| `icons[].icon` | ya | ikon dari katalog |
| `icons[].label` | ya | 3 kata, 16 karakter, kata maksimal 11 huruf |
| `kicker` | tidak | 8 kata, 48 karakter |

```json
{"name":"Cover","theme":"dark","component":"teaser","variant":"index","title":"Anak sering jatuh saat berlari?","items":["Kapan jatuh masih wajar","Tanda yang layak dicatat","Tiga latihan di rumah","Kapan perlu ke fisioterapis"],"kicker":"Simpan untuk dibaca lagi"}
```

### contrast

Pembuka kontras. Anggapan lama yang diredupkan, lalu cara pandang baru. Membalik satu anggapan dalam dua baris. Hanya di slide pertama. Baris pertama anggapan yang dikenali, baris kedua yang ingin diingat.

Varian: `turn` (anggapan dicoret, judul di bawahnya), `band` (judul di pita sorotan), `split` (anggapan di kotak bergaris, judul di kartu kontras). Gerak bawaan: `rise`; per varian: `band` wipe, `split` unfold.

| Field | Wajib | Batas |
| --- | --- | --- |
| `before` | ya | 4 kata, 22 karakter |
| `title` | ya | `coverTitleMax` kata, 44 karakter |
| `kicker` | tidak | 8 kata, 48 karakter |

```json
{"name":"Cover","theme":"dark","component":"contrast","variant":"turn","before":"Bukan sekadar malas.","title":"Ototnya cepat lelah.","kicker":"Saat anak menolak berjalan jauh"}
```

### figure

Foto dan keterangan. Satu foto atau video dengan judul dan keterangan. Menunjukkan satu gerakan, posisi, atau situasi yang lebih jelas dilihat daripada dibaca. Keterangan menjelaskan apa yang perlu dilihat di foto. Teks tidak di atas foto kecuali di kartu.

Varian: `frame` (foto dalam bingkai), `bleed` (foto selebar kanvas), `overlay` (keterangan di kartu yang menumpang di bawah foto). Gerak bawaan: `rise`; per varian: `bleed` curtain.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `media` | ya | foto atau video: `{ "src", "alt", "focus" }` |
| `caption` | ya | 18 kata, 110 karakter |

```json
{"name":"Foto dan keterangan","theme":"dark","component":"figure","variant":"frame","title":"Perhatikan posisi lututnya.","media":{"src":"contoh-satu-kaki.jpg","alt":"Anak berdiri satu kaki di atas matras dengan tangan di atas kepala"},"caption":"Lutut kaki tumpu sedikit ditekuk, pandangan lurus ke depan, tahan lima hitungan."}
```

### photopair

Dua foto. Dua foto berdampingan dengan label. Membandingkan dua posisi atau keadaan, misalnya sebelum dan sesudah. Kiri yang dihindari atau sebelum, kanan yang dianjurkan atau sesudah. Tanda silang dan centang hanya bila memang benar dan salah.

Varian: `side` (berdampingan, label di bawah foto), `stack` (bertumpuk, label di chip pada foto). Gerak bawaan: `alternate`; per varian: `stack` slide.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `left` | ya | objek |
| `left.media` | ya | foto atau video: `{ "src", "alt", "focus" }` |
| `left.label` | ya | 3 kata, 18 karakter |
| `right` | ya | objek |
| `right.media` | ya | foto atau video: `{ "src", "alt", "focus" }` |
| `right.label` | ya | 3 kata, 18 karakter |
| `marks` | tidak | `true` atau `false` |
| `note` | tidak | 12 kata, 80 karakter |

```json
{"name":"Dua foto","theme":"dark","component":"photopair","variant":"side","title":"Posisi duduk saat menulis.","left":{"media":{"src":"contoh-duduk-bungkuk.jpg","alt":"Anak duduk membungkuk saat menulis, kaki menggantung"},"label":"Kurang tepat"},"right":{"media":{"src":"contoh-duduk-tegak.jpg","alt":"Anak duduk tegak saat menulis, kaki menapak di pijakan"},"label":"Lebih nyaman"},"marks":true,"note":"Pijakan kecil membuat kaki menapak dan punggung lebih tegak."}
```

### pins

Foto bertanda. Foto dengan titik bernomor dan keterangannya. Menunjuk dua sampai empat bagian dalam satu foto, misalnya posisi leher, punggung, dan kaki. x dan y dalam persen dari kiri dan atas foto. Nomor mengikuti urutan baca keterangan.

Varian: `legend` (keterangan di bawah foto), `side` (foto tegak di kiri, keterangan di kanan). Gerak bawaan: `pop`.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `media` | ya | foto: `{ "src", "alt", "focus" }` |
| `pins` | ya | 2 sampai 4 butir; tiap butir objek |
| `pins[].x` | ya | angka bulat 0 sampai 100 |
| `pins[].y` | ya | angka bulat 0 sampai 100 |
| `pins[].text` | ya | 6 kata, 36 karakter |

```json
{"name":"Foto bertanda","theme":"dark","component":"pins","variant":"legend","title":"Tiga hal yang dilatih di balok.","media":{"src":"contoh-seimbang.jpg","alt":"Anak berjalan di atas balok kayu di taman dengan tangan terbuka"},"pins":[{"x":50,"y":34,"text":"Pandangan lurus ke depan"},{"x":35,"y":50,"text":"Tangan terbuka menjaga seimbang"},{"x":50,"y":78,"text":"Telapak kaki menapak penuh"}]}
```

### gallery

Galeri. Tiga foto dengan label pendek. Beberapa contoh gerakan atau pilihan yang dikenali dari gambarnya. Tepat tiga foto. Label pendek, satu sampai tiga kata.

Varian: `row` (berderet, label di bawah), `mosaic` (satu besar dan dua kecil, label di chip). Gerak bawaan: `rise`; per varian: `mosaic` zoom.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `items` | ya | 3 butir; tiap butir objek |
| `items[].media` | ya | foto atau video: `{ "src", "alt", "focus" }` |
| `items[].label` | ya | 3 kata, 18 karakter, kata maksimal 11 huruf |
| `note` | tidak | 12 kata, 80 karakter |

```json
{"name":"Galeri","theme":"dark","component":"gallery","variant":"row","title":"Tiga cara melatih keseimbangan.","items":[{"media":{"src":"contoh-seimbang.jpg","alt":"Anak berjalan di atas balok kayu"},"label":"Jalan di balok"},{"media":{"src":"contoh-satu-kaki.jpg","alt":"Anak berdiri satu kaki"},"label":"Berdiri satu kaki"},{"media":{"src":"contoh-latihan.mp4","alt":"Anak menjaga keseimbangan di atas balok kayu"},"label":"Tangan terbuka"}],"note":"Mulai dari yang paling mudah untuk anakmu."}
```

### exercise

Kartu latihan. Satu latihan dengan takaran dan cara melakukannya. Latihan yang bisa langsung dicoba: berapa kali, berapa lama, dan caranya. Takaran dan cara harus aman untuk pembaca umum. Judul adalah nama latihannya.

Varian: `photo` (foto atau video gerakan di atas takaran), `plain` (takaran besar tanpa foto). Gerak bawaan: `rise`; per varian: `plain` pop.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `media` | ya (hanya `photo`) | foto atau video: `{ "src", "alt", "focus" }` |
| `dose` | ya | 2 sampai 3 butir; tiap butir objek |
| `dose[].value` | ya | 2 kata, 8 karakter |
| `dose[].label` | ya | 2 kata, 12 karakter, kata maksimal 10 huruf |
| `cues` | ya | 2 sampai 3 butir; tiap butir 7 kata, 40 karakter |

```json
{"name":"Kartu latihan","theme":"dark","component":"exercise","variant":"photo","title":"Berdiri satu kaki.","media":{"src":"contoh-latihan.mp4","alt":"Anak menjaga keseimbangan di atas balok kayu"},"dose":[{"value":"3","label":"set"},{"value":"10 dtk","label":"tiap kaki"},{"value":"1x","label":"sehari"}],"cues":["Berdiri dekat dinding untuk pegangan","Angkat satu kaki, pandangan ke depan","Ganti kaki, ulangi pelan-pelan"]}
```

### testimonial

Testimoni. Kutipan pengalaman seseorang dengan nama dan fotonya. Cerita singkat dari orang tua atau pasien, dengan izin mereka. Hanya kutipan asli dengan izin orang tersebut. Tanpa angka hasil yang dijanjikan.

Varian: `card` (kutipan di kartu, nama dan foto kecil di bawahnya), `photo` (foto besar di samping kutipan). Gerak bawaan: `rise`; per varian: `photo` slide.

| Field | Wajib | Batas |
| --- | --- | --- |
| `quote` | ya | 22 kata, 130 karakter |
| `person` | ya | objek |
| `person.name` | ya | 3 kata, 24 karakter |
| `person.role` | tidak | 5 kata, 32 karakter |
| `media` | ya (hanya `photo`) | foto: `{ "src", "alt", "focus" }` |

```json
{"name":"Testimoni","theme":"dark","component":"testimonial","variant":"card","quote":"Dulu anak kami selalu menolak naik tangga. Setelah latihan kecil setiap sore, sekarang ia naik sendiri sambil berpegangan.","person":{"name":"Ibu Rina","role":"Orang tua Dafa, 5 tahun"}}
```

### quiz

Kuis. Satu pertanyaan dengan tiga pilihan berhuruf. Mengajak pembaca menebak dulu, lalu menggeser untuk tahu jawabannya. Pakai varian ask lalu varian reveal di slide berikutnya, dengan pilihan yang sama.

Varian: `ask` (tiga pilihan, belum ada jawaban), `reveal` (jawaban disorot dan alasannya). Gerak bawaan: `pop`; per varian: `reveal` rise.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `options` | ya | 3 butir; tiap butir 5 kata, 30 karakter |
| `answer` | ya (hanya `reveal`) | pilihan: `A`, `B`, `C` |
| `reason` | ya (hanya `reveal`) | 18 kata, 110 karakter |
| `note` | tidak (hanya `ask`) | 8 kata, 48 karakter |

```json
{"name":"Kuis","theme":"dark","component":"quiz","variant":"ask","title":"Mana yang paling membantu keseimbangan?","options":["Duduk lama menonton video","Bermain lompat di taman","Tidur siang lebih lama"],"note":"Tebak dulu, jawabannya di slide berikutnya."}
```

### bars

Grafik batang. Dua sampai empat batang dengan angka. Membandingkan besaran yang bisa diukur, dengan sumbernya. Angka dari sumber yang bisa dicek; tulis sumbernya di catatan. Batang terbesar memakai warna sorotan.

Varian: `horizontal` (batang mendatar), `columns` (kolom tegak). Gerak bawaan: `stretch`; per varian: `columns` unfold.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `bars` | ya | 2 sampai 4 butir; tiap butir objek |
| `bars[].label` | ya | 4 kata, 24 karakter, kata maksimal 11 huruf |
| `bars[].value` | ya | 2 kata, 6 karakter (angka singkat) |
| `note` | tidak | 12 kata, 80 karakter |

```json
{"name":"Grafik batang","theme":"dark","component":"bars","variant":"horizontal","title":"Gerak aktif anak per hari.","bars":[{"label":"Saran WHO","value":"60"},{"label":"Hari sekolah","value":"35"},{"label":"Akhir pekan","value":"50"}],"note":"Dalam menit. Contoh catatan satu keluarga selama seminggu."}
```

### week

Jadwal seminggu. Tujuh hari dengan hari yang terisi ditandai. Seberapa sering sesuatu dilakukan dalam seminggu, misalnya tiga hari latihan. Tepat tujuh hari, ditulis singkat (Sen, Sel, Rab). Minimal satu hari ditandai.

Varian: `dots` (tujuh lingkaran), `columns` (tujuh kolom). Gerak bawaan: `pop`; per varian: `columns` unfold.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `days` | ya | 7 butir; tiap butir objek |
| `days[].day` | ya | 1 kata, 4 karakter |
| `days[].on` | ya | `true` atau `false` |
| `note` | tidak | 14 kata, 84 karakter |

```json
{"name":"Jadwal seminggu","theme":"dark","component":"week","variant":"dots","title":"Latihan penguat otot seminggu.","days":[{"day":"Sen","on":true},{"day":"Sel","on":false},{"day":"Rab","on":true},{"day":"Kam","on":false},{"day":"Jum","on":true},{"day":"Sab","on":false},{"day":"Min","on":false}],"note":"Saran WHO: minimal tiga hari seminggu, dengan jeda untuk istirahat."}
```

### flags

Tanda bahaya. Dua sampai empat tanda dengan ikon peringatan, lalu tindakan. Kapan perlu segera ke tenaga kesehatan. Tanda harus spesifik dan bisa diamati. Tindakan jelas, tanpa menakut-nakuti.

Varian: `list` (daftar dengan ikon peringatan), `cards` (kotak dua kali dua). Gerak bawaan: `slide`; per varian: `cards` pop.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `items` | ya | 2 sampai 4 butir; tiap butir 6 kata, 36 karakter |
| `action` | ya | objek |
| `action.icon` | ya | ikon dari katalog |
| `action.text` | ya | 10 kata, 60 karakter |

```json
{"name":"Tanda bahaya","theme":"dark","component":"flags","variant":"list","title":"Kapan perlu segera diperiksa?","items":["Jatuh lalu tidak mau menapak","Bengkak yang makin besar","Kemampuan yang tadinya bisa, hilang","Nyeri yang membangunkan dari tidur"],"action":{"icon":"stethoscope","text":"Ada satu tanda ini? Periksakan ke dokter atau fisioterapis."}}
```

### faq

Tanya jawab berderet. Dua sampai tiga pertanyaan pendek dengan jawabannya. Menjawab beberapa pertanyaan yang sering muncul bersamaan. Jawaban langsung, satu sampai dua kalimat. Varian chat maksimal dua pasang.

Varian: `stack` (bertumpuk dipisah garis), `chat` (gelembung tanya dan jawab). Gerak bawaan: `cascade`; per varian: `chat` rise.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `items` | ya | 2 sampai 3 butir; tiap butir objek |
| `items[].q` | ya | 7 kata, 42 karakter |
| `items[].a` | ya | 12 kata, 72 karakter |

```json
{"name":"Tanya jawab berderet","theme":"dark","component":"faq","variant":"stack","title":"Pertanyaan yang sering masuk.","items":[{"q":"Perlukah sepatu khusus?","a":"Tidak selalu. Pilih yang ringan, lentur, dan tidak licin."},{"q":"Berapa lama latihan sehari?","a":"Sepuluh sampai lima belas menit sudah cukup bila rutin."},{"q":"Bolehkah saat anak lelah?","a":"Lebih baik istirahat dulu, lalu coba lagi esok hari."}]}
```

### script

Template kalimat. Kalimat dengan bagian kosong yang diberi label, lalu contohnya. Pola kalimat yang bisa diisi sendiri oleh pembaca. Setiap bagian: teks lalu satu isian berlabel. Tanda baca setelah isian ditulis di awal bagian berikutnya (". Kita coba"). end menutup kalimat setelah isian terakhir.

Varian: `lines` (template besar dengan garis isian), `card` (template di kartu). Gerak bawaan: `wipe`; per varian: `card` unfold.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `parts` | ya | 1 sampai 3 butir; tiap butir objek |
| `parts[].text` | ya | 5 kata, 30 karakter |
| `parts[].slot` | ya | 2 kata, 14 karakter, kata maksimal 10 huruf |
| `end` | tidak | 5 kata, 30 karakter |
| `example` | tidak | 18 kata, 110 karakter |

```json
{"name":"Template kalimat","theme":"dark","component":"script","variant":"lines","title":"Kalimat saat anak frustrasi.","parts":[{"text":"Kamu kesal karena","slot":"kejadian"},{"text":". Kita coba","slot":"langkah kecil"}],"end":"bersama, ya.","example":"“Kamu kesal karena menaranya jatuh. Kita coba susun dua balok dulu bersama, ya.”"}
```

### acronym

Singkatan. Huruf besar yang membentuk satu kata, masing-masing dengan artinya. Langkah atau prinsip yang mudah diingat lewat satu kata. Huruf-hurufnya membentuk kata yang bermakna. Setiap arti diawali huruf itu.

Varian: `stack` (huruf di kiri setiap baris), `tiles` (ubin huruf membentuk kata, arti di bawahnya). Gerak bawaan: `cascade`; per varian: `tiles` pop.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `letters` | ya | 3 sampai 5 butir; tiap butir objek |
| `letters[].letter` | ya | satu huruf kapital A sampai Z |
| `letters[].text` | ya | 5 kata, 30 karakter |
| `note` | tidak | 10 kata, 60 karakter |

```json
{"name":"Singkatan","theme":"dark","component":"acronym","variant":"stack","title":"Ingat kata AKTIF.","letters":[{"letter":"A","text":"Ajak bermain di luar"},{"letter":"K","text":"Kurangi duduk terlalu lama"},{"letter":"T","text":"Tambah sedikit demi sedikit"},{"letter":"I","text":"Istirahat saat lelah"},{"letter":"F","text":"Fokus pada rasa senang"}]}
```

### gauge

Meteran. Tiga tingkat dengan penunjuk di salah satunya. Menunjukkan satu tingkat dari tiga, misalnya ringan, sedang, berat. Tepat tiga tingkat, dari yang paling ringan ke yang paling berat.

Varian: `arc` (busur dengan jarum), `bar` (batang tiga ruas dengan penanda). Gerak bawaan: `zoom`; per varian: `bar` stretch.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `titleMax` kata, 60 karakter |
| `levels` | ya | 3 butir; tiap butir 2 kata, 14 karakter, kata maksimal 11 huruf |
| `at` | ya | pilihan: `1`, `2`, `3` |
| `note` | tidak | 16 kata, 96 karakter |

```json
{"name":"Meteran","theme":"dark","component":"gauge","variant":"arc","title":"Seberapa sering jatuhnya?","levels":["Sesekali","Mingguan","Hampir harian"],"at":"2","note":"Jatuh beberapa kali seminggu layak dicatat: kapan, di mana, dan saat melakukan apa."}
```

### prompt

Penutup pertanyaan. Pertanyaan untuk pembaca, dijawab di komentar. Mengajak pembaca bercerita atau memilih di kolom komentar. Hanya di slide terakhir. Ajakan menulis komentar, bukan mengetuk gambar.

Varian: `ask` (pertanyaan di gelembung), `options` (dua pilihan berhuruf), `keyword` (satu kata kunci untuk ditulis di komentar). Gerak bawaan: `pop`; per varian: `keyword` stamp.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `coverTitleMax` kata, 44 karakter |
| `options` | ya (hanya `options`) | 2 butir; tiap butir 3 kata, 18 karakter, kata maksimal 11 huruf |
| `keyword` | ya (hanya `keyword`) | 1 kata, 12 karakter |
| `cta` | ya | objek |
| `cta.icon` | ya | ikon dari katalog |
| `cta.text` | ya | 8 kata, 44 karakter |

```json
{"name":"Penutup","theme":"dark","component":"prompt","variant":"ask","title":"Anakmu paling suka main apa?","cta":{"icon":"message-circle","text":"Ceritakan di kolom komentar"}}
```

### action

Penutup ajakan. Ikon besar, judul, dan satu ajakan: simpan, kirim, atau ikuti seri. Satu ajakan yang jelas alasannya. Hanya di slide terakhir. Satu ajakan saja, dengan alasannya.

Varian: `save` (simpan, dengan alasan menyimpan), `share` (kirim ke orang yang membutuhkan), `next` (seri berikutnya). Gerak bawaan: `rise`; per varian: `share` glide, `next` slide.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `coverTitleMax` kata, 40 karakter |
| `lede` | tidak | 10 kata, 60 karakter |
| `points` | ya (hanya `save`) | 2 sampai 3 butir; tiap butir 6 kata, 36 karakter |
| `next` | ya (hanya `next`) | objek |
| `next.label` | ya | 3 kata, 18 karakter |
| `next.topic` | ya | 8 kata, 48 karakter |
| `cta` | ya | objek |
| `cta.icon` | ya | ikon dari katalog |
| `cta.text` | ya | 8 kata, 44 karakter |

```json
{"name":"Penutup","theme":"dark","component":"action","variant":"save","title":"Simpan untuk nanti.","lede":"Supaya mudah dicari saat dibutuhkan.","points":["Daftar tanda yang perlu dicatat","Tiga latihan singkat di rumah"],"cta":{"icon":"send","text":"Kirim ke pasanganmu juga"}}
```

### profile

Penutup profil. Siapa yang menulis: foto, nama, peran, dan ajakan. Membangun kepercayaan: pembaca tahu siapa yang bisa ditanya. Hanya di slide terakhir. Nama dan peran asli, foto milik orang itu sendiri.

Varian: `photo` (foto bulat di samping nama), `card` (nama dan peran di kartu). Gerak bawaan: `rise`; per varian: `card` unfold.

| Field | Wajib | Batas |
| --- | --- | --- |
| `title` | ya | `coverTitleMax` kata, 40 karakter |
| `person` | ya | objek |
| `person.name` | ya | 4 kata, 28 karakter |
| `person.role` | tidak | 6 kata, 40 karakter |
| `media` | ya (hanya `photo`) | foto: `{ "src", "alt", "focus" }` |
| `lede` | tidak | 12 kata, 72 karakter |
| `cta` | ya | objek |
| `cta.icon` | ya | ikon dari katalog |
| `cta.text` | ya | 8 kata, 44 karakter |

```json
{"name":"Penutup","theme":"dark","component":"profile","variant":"photo","title":"Ada pertanyaan?","person":{"name":"Tim Part of Physio","role":"Fisioterapis anak"},"media":{"src":"contoh-terapis.jpg","alt":"Fisioterapis tersenyum memakai seragam klinik"},"lede":"Kami membaca setiap pesan yang masuk.","cta":{"icon":"send","text":"Kirim pertanyaanmu lewat DM"}}
```

## Katalog ikon

Tabler Icons, garis. Hanya nama berikut yang diterima:

accessible, activity, alert-triangle, apple, armchair, baby-carriage, backpack, ball-basketball, ball-football, barbell, bed, bell, bike, bone, book, bookmark, brain, bulb, calendar, calendar-check, camera, check, clipboard-list, clock, device-mobile, droplet, eye, first-aid-kit, flame, hand-stop, heart, heartbeat, help-circle, home, info-circle, link, list-check, map-pin, massage, message-circle, message-dots, mood-kid, mood-smile, moon, notebook, old, pencil, phone, photo, player-play, puzzle, repeat, run, school, search, send, share, shield-check, stairs, star, stethoscope, stopwatch, stretching, stretching-2, sun, swimming, target, thumb-up, trees, user, user-plus, users, video, walk, wheelchair, yoga
