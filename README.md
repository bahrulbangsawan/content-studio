# Content Studio

Skill Claude dan CLI untuk membuat konten edukasi Instagram dalam dua format:

- **Carousel** 1080 x 1350, ditulis sebagai `post.json`.
- **Reels**, video penjelasan 9:16 (1080 x 1920), ditulis sebagai `reel.json`. Berisi:
  - adegan yang dirancang untuk layar tegak, bukan slide yang direntangkan
  - voice over Gemini 3.8 Flash TTS
  - subtitle yang menyorot kata yang sedang diucapkan
  - ilustrasi dan angka bergerak
  - footage stok dari Magnific atau Pexels, dan foto berlisensi terbuka dari Openverse tanpa key
  - sumber ilmiah yang diverifikasi di PubMed dan Crossref

Setiap postingan dibangun menjadi satu halaman studio HTML mandiri. Untuk carousel, halaman itu berisi:

- pratinjau slide yang bisa digeser, lengkap dengan animasi
- ilustrasi dan foto
- pemeriksaan aturan otomatis
- pilihan alternatif cover dan penutup
- panduan desain
- unduhan PNG, MP4, dan ZIP

Studio Reels berisi:

- pemutar dengan suara dan garis waktu per adegan
- pilihan pembuka dan penutup
- zona aman Instagram
- pemeriksaan otomatis
- daftar sumber dan kredit footage
- unduhan MP4 bersuara, cover, PNG per adegan, SRT, dan caption

Tampilan, warna, tipografi, dan gerak dikunci di engine dan di akun brand; yang ditulis hanya isinya.

Isinya:

- 56 komponen slide inti dengan 137 tata letak:
  - 35 tata letak cover
  - 13 tata letak penutup
- 49 ilustrasi
- 20 preset gerak
- 16 jenis adegan Reels dengan 33 varian, 6 transisi, dan 20 preset gerak per bagian
- dukungan foto dan video
- katalog semua komponen dalam warna akun

Panduan untuk Claude ada di [`SKILL.md`](SKILL.md). Rincian komponen, aturan, dan pembuatan komponen baru ada di [`references/`](references/).

## Memasang

### Claude Code (terminal, VS Code, JetBrains, dan tab Code di aplikasi desktop)

Cara yang disarankan adalah sebagai plugin, karena paling mudah diperbarui. Di Claude Code, jalankan satu baris (Claude Code 2.1.275 atau lebih baru):

```
/plugin install content-studio --marketplace bahrulbangsawan/content-studio
```

Di versi lama, pakai dua langkah:

```
/plugin marketplace add bahrulbangsawan/content-studio
/plugin install content-studio@bahrulbangsawan
```

Dari terminal tanpa membuka sesi:

```bash
claude plugin marketplace add bahrulbangsawan/content-studio
claude plugin install content-studio@bahrulbangsawan
```

Muat ulang dengan `/reload-plugins` atau buka sesi baru. Skill dipanggil otomatis saat kamu meminta carousel, atau langsung dengan `/content-studio:content-studio`.

Untuk memperbarui:

- `claude plugin update content-studio@bahrulbangsawan`, atau
- aktifkan pembaruan otomatis di `/plugin`, tab Marketplaces.

Bila tidak ingin memakai plugin, pasang sebagai skill pribadi:

```bash
git clone https://github.com/bahrulbangsawan/content-studio.git ~/.claude/skills/content-studio
```

Perbarui dengan `git -C ~/.claude/skills/content-studio pull`. Untuk satu proyek saja, clone ke `.claude/skills/content-studio` di folder proyek.

### Claude Desktop dan claude.ai (chat)

1. Unduh `content-studio.zip` dari halaman [Releases](https://github.com/bahrulbangsawan/content-studio/releases) repo ini. Kalau tidak ada, buat sendiri dengan `node scripts/package.mjs`, yang menulis `dist/content-studio.zip`.
2. Buka Settings, Capabilities, lalu aktifkan **Code execution and file creation**.
3. Di bagian Skills, pilih unggah skill, lalu pilih `content-studio.zip`. Jangan ekstrak dulu.
4. Mulai percakapan baru dan minta carousel. Halaman studio diberikan sebagai berkas `.html` yang diunduh lalu dibuka di browser.

Berkas tidak tersimpan antar percakapan di Claude Desktop. Di akhir sesi, minta Claude membuat `content-studio-workspace.zip`, yang berisi akun brand, postingan, dan foto. Simpan berkas itu, lalu unggah lagi di percakapan berikutnya. Verifikasi otomatis di browser hanya jalan bila lingkungan itu punya Chromium; tanpa itu, pemeriksaan tetap terlihat di tab Pengaturan halaman studio.

Untuk organisasi Team atau Enterprise, pemilik organisasi bisa menambahkan repo ini dari Organization settings, Plugins & skills. Dengan cara ini anggota tidak perlu memasang sendiri.

### Perintah `content-studio` di terminal

Semua fitur juga bisa dipakai langsung dari terminal, tanpa Claude:

```bash
npm i -g github:bahrulbangsawan/content-studio    # memasang perintah content-studio (Node 18+)
content-studio setup                              # simpan API key sekali
content-studio doctor --online                    # cek Chrome, ffmpeg, dan key
content-studio help                               # semua perintah
```

Tanpa memasang global, perintah yang sama bisa dijalankan dengan `node ~/.claude/skills/content-studio/scripts/cli.mjs <perintah>`, atau dari folder plugin.

| Perintah | Fungsi |
| --- | --- |
| `ig <link>` | Unduh foto, video, dan caption postingan Instagram |
| `transcribe <video, folder, atau link>` | Video ke teks, SRT, dan waktu per kata (OpenAI atau Gemini) |
| `evidence search "<topik>"`, `cite`, `verify` | Cari tinjauan sistematis di PubMed, buat entri sumber, cek sumber |
| `footage search "<kata kunci>"`, `get` | Footage dan foto stok tegak dari Magnific atau Pexels, foto Openverse tanpa key, dengan lembar kontak dan kredit |
| `new <slug> --reel`, `voice <slug>` | Reel baru, voice over Gemini per adegan |
| `scan`, `build`, `verify`, `check <slug>` | Aturan isi, halaman studio, cek tata letak di Chrome |
| `export <slug>` | MP4, cover, SRT, dan caption ke `posts/<slug>/export/` |

### API key

Semuanya opsional. Fitur tanpa key tetap jalan.

| Key | Untuk | Dari |
| --- | --- | --- |
| Gemini | Voice over dan transkripsi | https://aistudio.google.com/apikey |
| OpenAI | Transkripsi dan waktu per kata | https://platform.openai.com/api-keys |
| Magnific (dulu Freepik) | Footage dan foto stok. API butuh paket berbayar | https://www.magnific.com/user/organization/api-keys |
| Pexels | Footage dan foto gratis | https://www.pexels.com/api/ |
| Email untuk PubMed | Opsional | Email sendiri |

`content-studio setup` menyimpannya di `~/.content-studio/config.json`, yang hanya bisa dibaca akunmu dan tidak pernah masuk proyek atau repo. Variabel lingkungan juga dibaca: `GEMINI_API_KEY`, `OPENAI_API_KEY`, `MAGNIFIC_API_KEY`, dan `PEXELS_API_KEY`. Jangan menempelkan key ke percakapan dengan Claude.

**MCP Magnific.** `content-studio footage mcp` memasang MCP resmi Magnific (`https://mcp.magnific.com`, masuk lewat OAuth) di Claude Code. MCP ini membuat gambar, video, dan suara dengan AI memakai kredit akun Magnific. Pencarian footage stok tetap lewat `footage search`, karena MCP itu tidak punya alat stok. Di Claude Desktop, tambahkan sebagai custom connector dengan URL yang sama.

## Kebutuhan

- **Node 18 atau lebih baru.** Semua skrip berjalan tanpa dependensi npm.
- **Chrome, Chromium, atau Edge** untuk verifikasi, gerbang komponen, dan pratinjau PNG. Chromium dari Playwright juga terdeteksi. Set `CHROME_PATH` bila browser tidak ditemukan.
- **Python 3 dan uv (opsional)**, hanya untuk `scripts/ref.mjs`, yang mengambil bahan dari link Instagram. gallery-dl dipasang otomatis ke `~/.content-studio/gallery-dl`.
- **ffmpeg (opsional)**, untuk memecah video referensi menjadi frame, mengambil suara untuk transkripsi, dan memotong footage.

Font Inter, ikon Tabler, dan mp4-muxer disertakan dengan lisensinya masing-masing; lihat [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## Memulai

Di folder proyek, minta Claude membuat carousel. Data proyek tersimpan di `./content-studio/`:

- `brands/` untuk akun
- `posts/` untuk postingan
- `components/` untuk komponen buatan proyek

Data itu milik proyek dan tidak masuk repo ini. Untuk mencoba dengan akun contoh, salin `assets/examples/partofphysio/` dan jalankan:

```bash
node scripts/brand.mjs init --from <answers.json>
```

## Merawat skill ini

Folder skill boleh hanya-baca. Semua yang ditulis skill masuk ke workspace proyek atau ke `~/.content-studio/`.

Setelah mengubah engine atau skrip:

1. Jalankan `node scripts/lock.mjs`. `engine/LOCK.json` menyimpan sidik jari engine dan skrip, dan build berhenti bila tidak cocok.
2. Di sebuah workspace, jalankan `node scripts/component.mjs audit`.
3. Jalankan `node scripts/component.mjs check --id compare`, dan sama untuk setiap komponen di `components/`.
4. Naikkan `version` di `.claude-plugin/plugin.json`. Pengguna plugin hanya menerima pembaruan bila versinya berubah.
5. Commit, lalu buat rilis dengan ZIP untuk Claude Desktop:

```bash
node scripts/package.mjs
gh release create v<versi> dist/content-studio.zip --title "v<versi>" --notes "<catatan>"
```
