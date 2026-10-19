# Aturan pemeriksaan

Ada dua lapis pemeriksaan. Keduanya harus lolos sebelum postingan diserahkan.

1. **Scan statis** (`scan.mjs`, juga dijalankan otomatis oleh `build.mjs`): membaca `post.json`, menolak build bila ada galat.
2. **Pemeriksaan browser** (`verify.mjs`, juga terlihat di tab Pengaturan halaman): mengukur slide yang sudah dirender.

Batas angka datang dari `rules` akun di `brand.json`. Nilai bawaan ada di tabel. Batas tidak boleh dilonggarkan untuk meloloskan postingan; persingkat isinya.

## Scan statis

| Aturan | Bawaan | Kenapa | Cara memperbaiki |
| --- | --- | --- | --- |
| Kunci dikenal saja | | Gaya dan tata letak milik engine | Hapus kunci seperti `style`, `color`, `fontSize` |
| 3 sampai 10 slide, pembuka pertama, penutup terakhir | | Carousel butuh pembuka dan penutup yang jelas | Pembuka: `cover`, `hero`, `hook`, `stat`, `photo`, `teaser`, `contrast`. Penutup: `closing`, `outro`, `recap`, `prompt`, `action`, `profile`. Tambah atau gabung slide |
| Alternatif cover dan penutup | sampai 14 di `covers`, sampai 6 di `closings` | Setiap alternatif bisa dipilih jadi slide pertama atau terakhir, jadi diperiksa seperti slide | Setiap butir `covers` adalah slide pembuka lengkap, setiap butir `closings` slide penutup lengkap, dengan field komponennya. Kata per slide berlaku juga |
| Media | `src`, `alt` wajib; foto 4 MB, video 15 MB, semua 40 MB | Berkas disematkan di halaman; `alt` dibaca pembaca layar | `src` nama berkas di `posts/<slug>/media/` (jpg, png, webp, mp4, webm), `alt` satu kalimat, `focus` salah satu dari center, top, bottom, left, right. Kecilkan foto ke sekitar 2000 px, potong video ke 5 sampai 15 detik. Sebagian tempat hanya menerima foto (`pins`, `profile`, `testimonial`) |
| Angka bulat | misalnya `pins[].x` | Posisi dalam persen | Tulis angka tanpa tanda kutip, 0 sampai 100 |
| Field khusus varian | misalnya `cover.focus`, `cover.tags`, `hook.options` | Field itu hanya digambar oleh varian tertentu | Isi untuk varian yang memakainya (wajib di sana), hapus untuk varian lain. Lihat Batas khusus di `components.md` |
| Field wajib terisi, tipe benar, pilihan valid | | | Lihat `components.md`. `variant` dan `motion` hanya menerima nama dari katalog |
| Batas khusus komponen | | Butir berulang berbagi ruang yang sama | Lihat tabel Batas khusus di `components.md`: anggaran total `quotes` dan `pairs`, `highlight` di dalam `text`, jumlah butir varian tertentu |
| Batas kata dan karakter per field | per komponen | Teks harus muat di zona konten pada ukuran minimal | Persingkat, atau pecah ke slide lain |
| Huruf per kata di kotak sempit | per field atau varian | Kata yang lebih lebar dari kotaknya terpotong di tengah | Pakai kata yang lebih pendek atau varian yang lebih lebar. Lihat "kata maksimal N huruf" di `components.md` |
| Angka singkat | `bignumber.value`, `stat.value` | Huruf besar di atas 104 px hanya untuk angka | Tulis angkanya saja, misalnya `60`, `3x`, `80%` |
| Frasa dari field lain | misalnya `callout.highlight`, `cover.focus` | Frasa yang disorot, dicoret, atau dilingkari harus ada di teksnya sebagai kata utuh | Salin frasanya persis, mulai dan berakhir di batas kata |
| Komponen buatan lolos gerbang | | Komponen baru dipakai hanya bila lolos pakai ulang, design system, pola AI, dan kerapian | Jalankan `component.mjs check --id <id>`; lihat `authoring.md` |
| Kata per slide | 50 | Satu ide per slide, dibaca sambil lalu | Hapus kalimat pendukung yang tidak perlu |
| Panjang judul | cover dan closing 6, lainnya 8 | Judul dibaca dalam sekali lirik | Pakai kata yang lebih pendek |
| Tanpa teks sementara | | `TODO`, `[ISI]`, lorem ipsum | Ganti dengan isi asli |
| Tanpa tanda seru | aktif | Nada tenang | Pakai titik |
| Tanpa tanda pisah panjang | aktif | Konsistensi tipografi | Berlaku untuk — dan –. Pakai titik, koma, atau tanda hubung; untuk rentang tulis `4-14` atau `4 sampai 14` |
| Tanpa ajakan mengetuk | selalu | Postingan Instagram hanya bisa digeser | Tulis contoh atau jawaban langsung. "Geser" boleh |
| Frasa terlarang akun | daftar di akun | Janji hasil atau kata yang menakut-nakuti | Tulis ulang tanpa frasa itu |
| Ikon dari katalog | | Satu gaya ikon untuk semua postingan | Pilih ikon terdekat dari `components.md` |
| Setiap slide bergambar | `visualEverySlide` aktif | Slide yang hanya teks mudah dilewati; gambar membawa isinya lebih cepat | Isi `art` dengan ilustrasi yang cocok, atau pakai komponen bergambar. Berlaku untuk `slides`, `covers`, dan `closings`. Karakter atau ilustrasi, tidak keduanya |
| Ilustrasi dari katalog | | Satu gaya ilustrasi untuk semua postingan | Pilih nama dari bagian Ilustrasi di `components.md` |

Peringatan (tidak menghentikan build): berkas media yang belum ada di `posts/<slug>/media/` (slidenya memakai bingkai kosong), foto di atas 1,5 MB, dua pilihan cover atau dua pilihan penutup dengan tata letak yang sama (komponen dan varian), kata huruf kapital semua, urutan slide berbeda dari `structure` akun (slide yang dilewati tidak dihitung, hanya urutan yang tertukar), tiga slide bertema sama berturut-turut, dan pola kontras "X, bukan Y" (termasuk "bukan hanya" dan "bukan berarti") di dua slide atau lebih. Kalimat slogan seperti itu membuat setiap poin terdengar seperti tagline; pertahankan satu, sampaikan sisanya secara langsung.

Kata yang dianggap ajakan mengetuk: ketuk, klik, centang, seret, tekan, sentuh, usap, tap, balik kartu, click, swipe up. Kata biasa seperti tapi, tekanan, sentuhan, dan bolak-balik tetap boleh.

## Pemeriksaan browser

| Pemeriksaan | Batas | Artinya bila gagal |
| --- | --- | --- |
| Isi di dalam zona konten | grup tidak melewati 1014 px | Teks terlalu panjang atau terlalu banyak butir |
| Seimbang atas dan bawah | selisih jarak maksimal 24 px | Biasanya ikut gagal bersama zona konten. Tata letak yang sengaja duduk di bawah (`cover` `bottom`, `photo` `full` dan `card`) tidak dihitung |
| Jumlah kata | `maxWordsPerSlide` | Sama dengan scan, diukur dari teks yang tampil |
| Panjang judul | `titleMax` atau `coverTitleMax` | Sama dengan scan |
| Teks minimal | `minTextPx` (30) | Tidak terjadi bila komponen dipakai sesuai katalog |
| Masuk diam dalam 1,2 detik | 1200 ms | Diatur engine, termasuk untuk semua preset `motion`. Tidak bisa diubah dari isi |
| Tanpa ajakan mengetuk | | Ada kata ajakan atau elemen yang bisa diklik di slide |
| Kata utuh | | Ada kata yang terpotong di tengah karena kotaknya terlalu sempit. Pakai kata yang lebih pendek atau varian yang lebih lebar |

`verify.mjs` juga memberi peringatan bila satu kata tertinggal sendirian di baris terakhir sebuah kalimat (judul tidak dihitung). Susun ulang kalimatnya bila terlihat janggal di pratinjau.

`verify.mjs` juga memasang setiap alternatif cover ke slide 1 dan setiap alternatif penutup ke slide terakhir, menjalankan semua pemeriksaan di atas padanya, dan menyimpan `preview/cover-N.png` dan `preview/closing-N.png`. Halaman ditunggu sampai semua foto dan video termuat.

`verify.mjs` juga menyimpan `preview/slide-N.png` dari mesin ekspor yang sama dengan tombol Unduh. Lihat gambar itu untuk memeriksa hal yang tidak bisa diukur: kalimat terpotong di tempat aneh, judul yang tidak enak dibaca, atau isi yang terasa padat.

Judul besar di komponen pembuka dan penutup turun ke 92 px bila ada kata 13 atau 14 huruf, dan ke 80 px bila ada kata 15 huruf atau lebih. Tidak perlu diatur dari isi.

## Gerbang komponen

Komponen buatan diperiksa sekali saat dibuat atau diubah, bukan di setiap postingan. Foto dan video di lembar uji memakai berkas contoh dari `assets/media/`; bingkai foto (`.md`) tidak dihitung sebagai kartu, dan elemen bertanda `.bleed` boleh melewati zona konten sampai tepi kanvas. Di slide gelap, gerbang juga menolak kartu yang memakai warna kartu gelap: kartu tetap terang di slide gelap (lihat `authoring.md` bagian 5). `component.mjs check` menjalankan pemeriksaan definisi, pakai ulang, CSS terhadap design system, markup, gerak, lalu pemeriksaan browser pada isi contoh, isi terpanjang, isi tersingkat, dan kata panjang di setiap varian, terang dan gelap. Daftar lengkap aturan dan angkanya ada di `authoring.md` bagian 6 sampai 8. `component.mjs audit` menjalankan pemeriksaan browser yang sama pada komponen inti.

## Kunci engine, akun, dan komponen buatan

- `engine/LOCK.json` mencatat sidik jari engine dan semua skrip. Build berhenti bila ada yang berbeda.
- `brands/<akun>/brand.lock` mencatat sidik jari akun yang disetujui pemiliknya. Build berhenti bila `brand.json`, logo, atau font berubah tanpa `brand.mjs accept`.
- `components/<id>.pass.json` mencatat sidik jari komponen buatan dan engine saat komponen itu lolos gerbang. Scan menolak komponen yang berubah sesudahnya, atau yang diperiksa dengan engine lama.

Ketiganya adalah penanda, bukan kunci keamanan: siapa pun yang bisa mengedit berkas bisa melewatinya. Karena itu, kalau salah satunya gagal, berhenti dan tanyakan ke pengguna.
