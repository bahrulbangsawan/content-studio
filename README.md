# Content Studio

Skill Claude untuk membuat konten carousel Instagram (1080 x 1350). Setiap postingan ditulis sebagai satu `post.json`, lalu dibangun menjadi satu halaman studio HTML mandiri. Halaman itu berisi:

- pratinjau slide yang bisa digeser, lengkap dengan animasi
- ilustrasi dan foto
- pemeriksaan aturan otomatis
- pilihan alternatif cover dan penutup
- panduan desain
- unduhan PNG, MP4, dan ZIP

Tampilan, warna, tipografi, dan gerak dikunci di engine dan di akun brand; yang ditulis hanya isinya.

Isinya:

- 56 komponen slide inti dengan 137 tata letak:
  - 35 tata letak cover
  - 13 tata letak penutup
- 49 ilustrasi
- 20 preset gerak
- dukungan foto dan video
- katalog semua komponen dalam warna akun

Panduan untuk Claude ada di [`SKILL.md`](SKILL.md). Rincian komponen, aturan, dan pembuatan komponen baru ada di [`references/`](references/).

## Memasang

Repo ini privat. Siapa pun yang memasang perlu akses ke repo dan GitHub yang sudah login di komputernya, kecuali lewat ZIP untuk Claude Desktop.

### Claude Code (terminal, VS Code, JetBrains, dan tab Code di aplikasi desktop)

Cara yang disarankan adalah sebagai plugin, karena paling mudah diperbarui. Sekali saja, sambungkan git ke akun GitHub:

```bash
gh auth login && gh auth setup-git
```

Lalu di Claude Code, jalankan satu baris (Claude Code 2.1.275 atau lebih baru):

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
gh repo clone bahrulbangsawan/content-studio ~/.claude/skills/content-studio
```

Perbarui dengan `git -C ~/.claude/skills/content-studio pull`. Untuk satu proyek saja, clone ke `.claude/skills/content-studio` di folder proyek.

### Claude Desktop dan claude.ai (chat)

1. Unduh `content-studio.zip` dari halaman [Releases](https://github.com/bahrulbangsawan/content-studio/releases) repo ini. Kalau tidak ada, buat sendiri dengan `node scripts/package.mjs`, yang menulis `dist/content-studio.zip`.
2. Buka Settings, Capabilities, lalu aktifkan **Code execution and file creation**.
3. Di bagian Skills, pilih unggah skill, lalu pilih `content-studio.zip`. Jangan ekstrak dulu.
4. Mulai percakapan baru dan minta carousel. Halaman studio diberikan sebagai berkas `.html` yang diunduh lalu dibuka di browser.

Berkas tidak tersimpan antar percakapan di Claude Desktop. Di akhir sesi, minta Claude membuat `content-studio-workspace.zip`, yang berisi akun brand, postingan, dan foto. Simpan berkas itu, lalu unggah lagi di percakapan berikutnya. Verifikasi otomatis di browser hanya jalan bila lingkungan itu punya Chromium; tanpa itu, pemeriksaan tetap terlihat di tab Pengaturan halaman studio.

Untuk organisasi Team atau Enterprise, pemilik organisasi bisa menambahkan repo ini dari Organization settings, Plugins & skills. Dengan cara ini anggota tidak perlu memasang sendiri.

## Kebutuhan

- **Node 18 atau lebih baru.** Semua skrip berjalan tanpa dependensi npm.
- **Chrome, Chromium, atau Edge** untuk verifikasi, gerbang komponen, dan pratinjau PNG. Chromium dari Playwright juga terdeteksi. Set `CHROME_PATH` bila browser tidak ditemukan.
- **Python 3 dan uv (opsional)**, hanya untuk `scripts/ref.mjs`, yang mengambil bahan dari link Instagram. gallery-dl dipasang otomatis ke `~/.content-studio/gallery-dl`.
- **ffmpeg (opsional)**, untuk memecah video referensi menjadi frame.

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
