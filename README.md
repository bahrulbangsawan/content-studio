# Content Studio

Skill Claude Code untuk membuat konten carousel Instagram (1080 x 1350). Setiap postingan ditulis sebagai satu `post.json`, lalu dibangun menjadi satu halaman studio HTML mandiri. Halaman itu berisi:

- pratinjau slide yang bisa digeser, lengkap dengan animasi
- pemeriksaan aturan otomatis
- pilihan alternatif cover dan penutup
- panduan desain
- unduhan PNG, MP4, dan ZIP

Tampilan, warna, tipografi, dan gerak dikunci di engine dan di akun brand; yang ditulis hanya isinya.

Panduan lengkap untuk Claude ada di [`SKILL.md`](SKILL.md). Rincian komponen, aturan, dan pembuatan komponen baru ada di [`references/`](references/).

## Pasang

```bash
git clone https://github.com/bahrulbangsawan/content-studio.git ~/.claude/skills/content-studio
```

Butuh:

- **Node 18 atau lebih baru.** Semua skrip berjalan tanpa dependensi.
- **Chrome, Chromium, atau Edge.** Dipakai untuk verifikasi, gerbang komponen, dan pratinjau PNG.
- **Python 3 (opsional).** Hanya untuk `scripts/ref.mjs`, yang mengambil bahan dari link Instagram.

## Isi

- 56 komponen slide inti dengan 137 tata letak:
  - 35 tata letak cover
  - 13 tata letak penutup
- 49 ilustrasi satu gaya
- 20 preset gerak
- dukungan foto dan video
- katalog komponen dalam warna akun (`scripts/catalog.mjs`)

Workspace proyek ada di `./content-studio` (akun di `brands/`, postingan di `posts/`). Workspace itu milik proyek dan tidak disimpan di repo ini.

## Mengubah engine

`engine/LOCK.json` menyimpan sidik jari engine dan skrip. Build berhenti bila keduanya tidak cocok. Setelah mengubah engine, jalankan langkah berikut:

1. `node scripts/lock.mjs`
2. `node scripts/component.mjs audit` di sebuah workspace
3. `node scripts/component.mjs check --id <id>` untuk setiap komponen buatan di `components/`
