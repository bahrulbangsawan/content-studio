# Menyiapkan akun

Akun menyimpan semua yang menjadi identitas brand: nama, handle, logo, warna, font, disclaimer, dan aturan isi. Setiap postingan untuk akun itu memakai nilai yang sama.

## Yang perlu ditanyakan ke pemilik akun

Tanyakan dalam satu pesan, lalu tunggu jawabannya. Jangan menebak nilai yang belum diberikan.

1. **Nama brand** dan **handle Instagram** (tanpa @).
2. **Logo dalam SVG**: satu versi untuk latar terang dan satu untuk latar gelap. Kalau hanya ada satu, tanyakan apakah logo itu tetap terlihat di latar gelap. Wordmark (nama di sebelah logo) ditulis dengan font akun; tanyakan apakah wordmark ditampilkan atau logonya sudah berisi nama.
3. **Warna**, masing-masing hex `#RRGGBB`:
   - tema terang: `bg` (latar), `card` (kartu), `ink` (teks utama), `muted` (teks pendukung), `accent` (warna merek)
   - tema gelap: `bg`, `ink`, `muted`, `accent`. Tidak perlu `card`: kartu di slide gelap tetap terang (warna kartu, teks, dan aksen tema terang), jadi komponen tampil sama di kedua tema dan menonjol dari latar gelap
   - `highlight` (penanda kecil, satu per slide) dan `onHighlight` (teks di atas warna penanda)
   Kalau pemilik punya design system, ambil nilainya dari sana dan tunjukkan pemetaannya ke peran di atas.
4. **Font** (opsional): berkas `.woff2` variable dengan sumbu wght 400 sampai 700. Tanpa berkas, dipakai Inter.
5. **Disclaimer** untuk footer slide terakhir, maksimal 140 karakter. Wajib secara bawaan; boleh dimatikan bila pemilik memutuskan begitu (`rules.requireDisclaimer: false`).
6. **Bahasa** (`id` atau `en`) dan label petunjuk geser (bawaan "Geser" atau "Swipe").
7. **Struktur slide** yang biasa dipakai (opsional), misalnya Cover, Penjelasan, Perbedaan, Tanda, Tindakan, Penutup.
8. **Frasa terlarang** (opsional), misalnya janji hasil seperti "dijamin" atau "sembuh total".
9. **Pasangan lakukan dan hindari** khas brand (opsional), untuk ditampilkan di panduan.

## Id akun

`id` dipakai sebagai nama folder: huruf kecil, angka, dan tanda hubung. Turunkan dari handle dengan mengganti titik dan garis bawah menjadi tanda hubung (`lansiabugar.id` menjadi `lansiabugar-id`), atau pakai nama pendek yang disetujui pemilik. Handle tetap ditulis apa adanya di field `handle`.

## Nilai bawaan bila pemilik tidak menyebutkan

| Hal | Bawaan |
| --- | --- |
| Logo di slide gelap | Sama dengan logo terang, dengan peringatan |
| Wordmark di samping logo | Nama brand, ditampilkan (`showWordmark: true`) |
| Font | Inter bawaan skill |
| Label petunjuk geser | "Geser" untuk `id`, "Swipe" untuk `en` |
| Struktur slide, frasa terlarang, pasangan lakukan dan hindari | Tidak ada |
| Aturan isi | Lihat tabel aturan di bawah |

Sebutkan nilai bawaan yang terpakai saat melapor ke pemilik, supaya mereka bisa menggantinya.

## Berkas jawaban

Tulis di `content-studio/setup/<id>.answers.json`. Path logo dan font relatif terhadap berkas ini.

```json
{
  "id": "partofphysio",
  "name": "Part of Physio",
  "handle": "partofphysio",
  "wordmark": "partofphysio",
  "language": "id",
  "logoLight": "logo-light.svg",
  "logoDark": "logo-dark.svg",
  "showWordmark": true,
  "fontFamily": "Inter",
  "fontFile": null,
  "colors": {
    "light": { "bg": "#F5F0E6", "card": "#FBF8F1", "ink": "#13233A", "muted": "#4A5A6E", "accent": "#3A6BAE" },
    "dark":  { "bg": "#13233A", "ink": "#F5F0E6", "muted": "#C9D3E0", "accent": "#7FA8DC" },
    "highlight": "#E9A23B",
    "onHighlight": "#13233A"
  },
  "disclaimer": "Konten ini edukasi umum dan tidak menggantikan pemeriksaan langsung oleh tenaga kesehatan.",
  "swipeLabel": "Geser",
  "structure": ["Cover", "Penjelasan", "Perbedaan", "Tanda", "Tindakan", "Penutup"],
  "rules": { "bannedPhrases": ["dijamin", "sembuh total"] },
  "dos": [["Kalimat tenang tanpa tanda seru.", "Kata yang menakut-nakuti."]]
}
```

Lalu jalankan:

```bash
# <skill> adalah folder skill ini (di SKILL.md ditulis ${CLAUDE_SKILL_DIR})
node <skill>/scripts/brand.mjs init --from content-studio/setup/<id>.answers.json
```

Skrip ini membersihkan logo (menghapus script, style, tautan eksternal, dan atribut event), menyalin berkas ke `brands/<id>/`, memeriksa semua aturan, mencetak rasio kontras, lalu mengunci akun. Tunjukkan daftar kontras dan pesan pembersihan logo ke pemilik.

## Aturan kontras

Build menolak akun yang tidak memenuhi batas ini, karena slide dibaca di ponsel, sering di luar ruangan.

| Pasangan | Minimal |
| --- | --- |
| `ink` di atas `bg`, kedua tema | 4,5:1 (disarankan 7:1) |
| `muted` di atas `bg`, kedua tema | 4,5:1 |
| `ink` di atas `card`, tema terang (kartu yang sama dipakai di slide gelap) | 4,5:1 |
| `bg` di atas `accent` (teks di kartu aksen dan lingkaran nomor), kedua tema | 4,5:1 |
| `accent` di atas `bg` (judul beraksen, angka besar, ikon), kedua tema | 3:1 |
| `onHighlight` di atas `highlight` | 4,5:1 |

Kalau gagal, `init` dan `check` mencetak usulan untuk warna yang perlu diganti: versi lebih gelap dan lebih terang dari warna yang sama yang sudah lolos, beserta rasionya. Tunjukkan rasio yang kurang dan usulan itu ke pemilik. Pemilik yang memutuskan; jangan mengganti warna sendiri walau usulannya terlihat jelas. Setelah pemilik memilih, perbarui berkas jawaban dan jalankan `init --from ... --replace`.

Init yang gagal tetap menulis `brand.json` dan logo agar bisa diperbaiki, tapi tidak menulis `brand.lock`, sehingga akun berstatus belum disetujui dan build menolaknya.

## Aturan yang bisa diatur akun

Carousel dan video punya aturan masing-masing di `brand.json`:

- **`rules`** berlaku untuk carousel, yaitu slide 1080 x 1350 yang dibaca sambil digeser.
- **`videoRules`** berlaku untuk Reels, yaitu video 1080 x 1920 yang ditonton penuh layar di bawah tombol dan caption Instagram.

Aturan tulisan di video (frasa terlarang, tanda seru, tanda pisah, disclaimer) mengikuti `rules` kecuali diisi lain di `videoRules`. Lihat nilai yang berlaku dan asalnya dengan `content-studio brand rules --id <akun>`.

### Aturan carousel (`rules`)

| Kunci | Bawaan | Batas yang diizinkan |
| --- | --- | --- |
| `maxWordsPerSlide` | 50 | maksimal 60 |
| `coverTitleMax` | 6 | maksimal 8 |
| `titleMax` | 8 | maksimal 10 |
| `minTextPx` | 30 | minimal 28 |
| `noExclamation` | true | |
| `noEmDash` | true | |
| `bannedPhrases` | [] | |
| `requireDisclaimer` | true | |
| `visualEverySlide` | true | |

Zona carousel tetap di engine:

- header y 0 sampai 168
- konten y 168 sampai 1182, x 96 sampai 984
- footer y 1182 sampai 1350

### Aturan video (`videoRules`)

Zona aman bawaannya mengikuti panduan Reels dari Meta: bagian atas 14% dan bawah 35% bebas isi penting, minimal 6% di setiap sisi. Kolom tombol di kanan juga dihindari. Tata letak adegan, garis panduan zona di studio, dan pemeriksaan semuanya memakai angka ini.

| Kunci | Bawaan | Batas | Arti |
| --- | --- | --- | --- |
| `safeTop` | 270 | 220 sampai 360 | px dari atas tanpa teks (bilah Reels) |
| `safeBottom` | 672 | 560 sampai 760 | px dari bawah tanpa isi penting (nama, caption, audio) |
| `safeSide` | 90 | 65 sampai 140 | px kiri; kanan memakai yang lebih besar antara ini dan kolom tombol |
| `railWidth` | 120 | 0 sampai 200 | lebar kolom tombol suka, komentar, kirim |
| `railTop` | 1100 | 800 sampai 1460 | tombol mulai dari tinggi ini |
| `captionTop`, `captionBottom` | 1268, 1458 | 1150 sampai 1600 | pita subtitle dan catatan kaki penutup |
| `brandBar` | true | | logo dan handle di atas adegan isi |
| `minTextPx` / `minMetaPx` | 40 / 30 | 36 sampai 64 / 26 sampai 40 | huruf terkecil untuk isi / untuk sumber dan disclaimer |
| `captionChars` | 24 | 16 sampai 32 | karakter per baris subtitle |
| `captions` | true | | subtitle tertanam |
| `maxWordsPerSecond` | 3,2 | 2,4 sampai 4 | voice over lebih cepat dari ini diperingatkan |
| `hookMaxSeconds` | 5 | 2 sampai 8 | panjang pembuka |
| `maxSceneSeconds` | 14 | 6 sampai 20 | panjang satu adegan |
| `minSeconds` / `maxSeconds` | 15 / 90 | | durasi yang disarankan |
| `hardMaxSeconds` | 180 | 30 sampai 900 | build berhenti di atas ini |
| `noExclamation`, `noEmDash`, `bannedPhrases`, `requireDisclaimer` | dari `rules` | | aturan tulisan khusus video, bila berbeda dari carousel |

Batas tambahan dari `check`:

- Zona konten video minimal 860 px tinggi dan 820 px lebar.
- Pita subtitle tidak boleh menimpa zona konten.
- Zona yang lebih sempit dari panduan Meta diberi peringatan.

Contoh akun yang ingin video lebih pendek dan tanpa bilah akun:

```json
"videoRules": { "maxSeconds": 60, "hookMaxSeconds": 4, "brandBar": false }
```

## Mengubah akun yang sudah ada

Ubah hanya bila pemilik meminta. Ada dua cara:

- **Ganti dari jawaban**: perbarui berkas jawaban, lalu `brand.mjs init --from ... --replace`.
- **Ubah kecil**: edit `brands/<id>/brand.json`, jalankan `brand.mjs check --id <id>`, tunjukkan perubahan dan hasilnya ke pemilik, lalu jalankan `brand.mjs accept --id <id>` setelah mereka setuju.

Postingan lama tidak berubah sampai dibangun ulang. Sebutkan itu ke pemilik.
