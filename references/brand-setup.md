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
node ~/.claude/skills/content-studio/scripts/brand.mjs init --from content-studio/setup/<id>.answers.json
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

## Aturan isi yang bisa diatur akun

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

## Mengubah akun yang sudah ada

Ubah hanya bila pemilik meminta. Ada dua cara:

- **Ganti dari jawaban**: perbarui berkas jawaban, lalu `brand.mjs init --from ... --replace`.
- **Ubah kecil**: edit `brands/<id>/brand.json`, jalankan `brand.mjs check --id <id>`, tunjukkan perubahan dan hasilnya ke pemilik, lalu jalankan `brand.mjs accept --id <id>` setelah mereka setuju.

Postingan lama tidak berubah sampai dibangun ulang. Sebutkan itu ke pemilik.
