// Bandingkan: dua atau tiga pilihan dibandingkan pada beberapa aspek yang sama, sebagai tabel.
// Komponen buatan content-studio. Aturan dan bahan: references/authoring.md.
import { title, text, list, obj, variant, esc, M, note } from '../scripts/lib/kit.mjs';

export default {
  id: 'compare',
  label: 'Bandingkan',
  motion: 'cascade',
  visual: 'Tabel pilihan di kolom dan aspek di baris',
  goal: 'Dua atau tiga pilihan yang dibandingkan pada aspek yang sama.',
  spec: 'Kepala kolom 32/40, isi 32/40, aspek 30/38, garis baris 2 px',
  rule: 'Setiap baris mengisi semua kolom. Varian focus menandai kolom terakhir, jadi taruh pilihan yang disarankan paling akhir.',
  variants: { table: 'Tabel bergaris', focus: 'Kolom terakhir, pilihan yang disarankan, beraksen' },
  reuse: {
    need: 'Tiga pilihan yang dinilai pada dua sampai empat aspek yang sama, sehingga pembaca membaca silang baris dan kolom.',
    checked: {
      pairs: 'Pairs hanya punya dua kolom dan setiap baris berdiri sendiri, tidak ada aspek bersama.',
      matrix: 'Matrix adalah kuadran dua kali dua dengan sumbu, bukan nilai per pilihan.',
      versus: 'Versus membandingkan dua kalimat saja tanpa aspek yang diurutkan.',
      dodont: 'Dodont memisahkan dua daftar anjuran dan larangan, bukan tiga pilihan.',
      timeline: 'Timeline mengurutkan waktu, sedangkan pilihan di sini setara dan tidak berurutan.',
      ladder: 'Ladder menyusun tingkat kesulitan berurutan, bukan perbandingan pada aspek yang sama.',
      grid: 'Grid berisi empat sel ikon yang setara tanpa baris aspek untuk dibaca silang.',
      list: 'List menampung satu deret butir, tidak bisa memberi nilai per pilihan pada setiap aspek.',
      cycle: 'Cycle menggambar putaran sebab akibat yang kembali ke awal, bukan pilihan yang dibandingkan.',
      pyramid: 'Pyramid menyusun tingkat prioritas dari dasar ke puncak, bukan beberapa pilihan sejajar.',
    },
  },
  keys: {
    variant: variant('table', 'focus'),
    title: title(),
    options: list(2, 3, text(2, 14, true, 10)),
    rows: list(2, 4, obj({ aspect: text(2, 14, true, 11), cells: list(2, 3, text(2, 14, true, 10)) })),
    note: text(10, 60),
  },
  validate: s => {
    const n = Array.isArray(s.options) ? s.options.length : 0;
    return (Array.isArray(s.rows) ? s.rows : []).flatMap((r, k) => (r && Array.isArray(r.cells) && r.cells.length !== n ? [`rows[${k}].cells: ${r.cells.length} isi, harus ${n} sesuai jumlah options.`] : []));
  },
  sample: {
    title: 'Memilih sepatu pertama anak.',
    options: ['Sol tipis', 'Sol tebal', 'Telanjang'],
    rows: [
      { aspect: 'Merasakan', cells: ['Cukup', 'Kurang', 'Paling baik'] },
      { aspect: 'Melindungi', cells: ['Cukup', 'Baik', 'Kurang'] },
      { aspect: 'Cocok untuk', cells: ['Luar rumah', 'Jalan jauh', 'Di rumah'] },
    ],
    note: 'Di rumah, biarkan anak bertelanjang kaki.',
  },
  render(s, ctx) {
    const n = s.options.length;
    const col = k => (ctx.variant === 'focus' && k === n - 1 ? ' compare-focal' : '');
    const head = `<div class="compare-row compare-head"${M('text', 'Kepala kolom')}><span class="compare-aspect"></span>${s.options.map((o, k) => `<span class="compare-opt${col(k)}">${esc(o)}</span>`).join('')}</div>`;
    const rows = s.rows.map((r, i) => `<div class="compare-row"${M('item', `Baris ${i + 1}`)}><span class="compare-aspect">${esc(r.aspect)}</span>${r.cells.map((c, k) => `<span class="compare-cell${col(k)}">${esc(c)}</span>`).join('')}</div>`).join('');
    return `<div class="ds-main compare-table" style="--n: ${n}">${head}${rows}</div>${note(s)}`;
  },
  css: `
.x-compare .compare-table { display: flex; flex-direction: column; }
.x-compare .compare-row { display: grid; grid-template-columns: 216px repeat(var(--n), minmax(0, 1fr)); column-gap: 24px; align-items: center; padding: 20px 0; border-top: 2px solid var(--s-rule-2); }
.x-compare .compare-row:last-child { border-bottom: 2px solid var(--s-rule-2); }
.x-compare .compare-table:has(+ .x-note) .compare-row:last-child { border-bottom: 0; }
.x-compare .compare-head { padding: 0 0 16px; border-top: 0; }
.x-compare .compare-aspect { font-size: 30px; line-height: 38px; font-weight: 500; color: var(--s-muted); }
.x-compare .compare-opt { font-size: 32px; line-height: 40px; font-weight: 700; }
.x-compare .compare-cell { font-size: 32px; line-height: 40px; font-weight: 600; }
.x-compare .compare-focal { color: var(--s-joint); }
`,
};
