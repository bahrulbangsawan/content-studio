# Komponen buatan

Komponen di folder ini dibuat lewat `node scripts/component.mjs check` dan lolos gerbang pakai ulang, design system, pola AI, dan kerapian. Berkas ini ditulis ulang setiap kali sebuah komponen lolos; jangan diedit.

## `compare`: Bandingkan

Tabel pilihan di kolom dan aspek di baris. Dua atau tiga pilihan yang dibandingkan pada aspek yang sama.

- Posisi: di antara pembuka dan penutup
- Varian: `table` tabel bergaris, `focus` kolom terakhir, pilihan yang disarankan, beraksen
- Gerak bawaan: bertingkat
- Aturan: Setiap baris mengisi semua kolom. Varian focus menandai kolom terakhir, jadi taruh pilihan yang disarankan paling akhir.
- Kenapa dibuat: Tiga pilihan yang dinilai pada dua sampai empat aspek yang sama, sehingga pembaca membaca silang baris dan kolom.
- Field:
  - title: teks (judul (titleMax), 60 karakter)
  - options: daftar 2 sampai 3 butir, tiap butir teks (2 kata, 14 karakter, kata maksimal 10 huruf)
  - rows: daftar 2 sampai 4 butir, tiap butir { aspect: teks (2 kata, 14 karakter, kata maksimal 11 huruf); cells: daftar 2 sampai 3 butir, tiap butir teks (2 kata, 14 karakter, kata maksimal 10 huruf) }
  - note: teks opsional (10 kata, 60 karakter)
  - art: ilustrasi dari katalog (art.mjs)

```json
{"component":"compare","title":"Memilih sepatu pertama anak.","options":["Sol tipis","Sol tebal","Telanjang"],"rows":[{"aspect":"Merasakan","cells":["Cukup","Kurang","Paling baik"]},{"aspect":"Melindungi","cells":["Cukup","Baik","Kurang"]},{"aspect":"Cocok untuk","cells":["Luar rumah","Jalan jauh","Di rumah"]}],"note":"Di rumah, biarkan anak bertelanjang kaki."}
```
