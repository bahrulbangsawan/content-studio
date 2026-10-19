#!/usr/bin/env node
// Create posts/<slug>/post.json for an account, ready to be filled in.
// Usage: node new-post.mjs --brand <id> --slug <slug> --title "<judul postingan>" [--slides <3-10>] [--root <workspace>]
// Placeholder text is marked TODO; the scan refuses to build until every TODO is replaced.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs, workspace, fail } from './lib/common.mjs';
import { loadBrand } from './lib/brand.mjs';

const args = parseArgs();
const root = workspace(args);
if (!args.brand || !args.slug || !args.title) fail('Pakai: node new-post.mjs --brand <id> --slug <slug> --title "<judul>"');
if (!/^[a-z0-9][a-z0-9-]{2,59}$/.test(args.slug)) fail('slug: huruf kecil, angka, tanda hubung, 3 sampai 60 karakter.');
const { brand } = loadBrand(root, args.brand);
const dir = join(root, 'posts', args.slug);
if (existsSync(join(dir, 'post.json'))) fail(`posts/${args.slug}/post.json sudah ada. Edit berkas itu, jangan buat ulang.`);

/* Slide names follow the account's structure; --slides keeps its first and last name and as many middle ones as fit */
const base = Array.isArray(brand.structure) && brand.structure.length >= 3 ? brand.structure : ['Cover', 'Isi', 'Penutup'];
const n = args.slides ? Number(args.slides) : base.length;
if (!(n >= 3 && n <= 10)) fail('--slides: 3 sampai 10.');
const middle = base.slice(1, -1);
const names = [base[0], ...Array.from({ length: n - 2 }, (_, k) => middle[k] || `Isi ${k + 1}`), base[base.length - 1]];
/* Themes alternate from a dark opening. No characters: they are drawn only when the account owner asks for them. */
const slides = names.map((name, i) => {
  const theme = i % 2 === 0 ? 'dark' : 'light';
  /* Every slide needs a picture: `art` holds a placeholder illustration to swap for one that fits the content */
  if (i === 0) return { name, theme, component: 'cover', art: 'question', kicker: 'TODO kicker, maksimal 6 kata', title: 'TODO judul cover' };
  if (i === names.length - 1) return { name, theme, component: 'closing', art: 'phone', title: 'TODO judul penutup', lede: 'TODO satu kalimat pendukung', cta: { icon: 'send', text: 'TODO ajakan, diawali kata kerja' } };
  return { name, theme, component: 'statement', art: 'idea', title: 'TODO judul slide', body: 'TODO isi slide. Pilih komponen dari tabel Memilih komponen di references/components.md.' };
});
/* Alternative covers: four other kinds of hook for the first slide, a different set for each slug, so the
   owner can pick one in the studio. Swap any of them for a kind that suits the topic better. */
const HOOKS = [
  { component: 'hook', variant: 'chat', art: 'phone', title: 'TODO pertanyaan pembaca?', sub: 'TODO balasan singkat' },
  { component: 'cover', variant: 'strike', art: 'question', title: 'TODO anggapan yang keliru', focus: 'TODO', kicker: 'TODO kalimat pendukung' },
  { component: 'teaser', variant: 'index', art: 'checklist', title: 'TODO pertanyaan pembaca?', items: ['TODO isi slide 2', 'TODO isi slide 3', 'TODO isi slide 4'], kicker: 'TODO kalimat pendukung' },
  { component: 'cover', variant: 'tags', art: 'observe', title: 'TODO pertanyaan pengenal?', tags: ['TODO tanda', 'TODO tanda lain'], kicker: 'TODO kalimat pendukung' },
  { component: 'contrast', variant: 'band', art: 'idea', before: 'TODO anggapan lama.', title: 'TODO cara pandang baru.', kicker: 'TODO kalimat pendukung' },
  { component: 'hook', variant: 'quiz', art: 'question', title: 'TODO pertanyaan kuis?', choices: ['TODO pilihan A', 'TODO pilihan B', 'TODO pilihan C'], sub: 'TODO jawabannya di slide berapa' },
  { component: 'cover', variant: 'quote', art: 'talk', title: 'TODO kalimat yang sering terdengar', kicker: 'TODO kalimat pendukung' },
  { component: 'teaser', variant: 'search', art: 'observe', title: 'TODO yang biasa diketik orang?', suggest: ['TODO saran pencarian', 'TODO saran lain'], kicker: 'TODO kalimat pendukung' },
  { component: 'cover', variant: 'fade', art: 'idea', title: 'TODO judul dengan frasa kunci', focus: 'TODO', kicker: 'TODO kalimat pendukung' },
  { component: 'hook', variant: 'scale', title: 'TODO seberapa sering ...?', ends: { left: 'TODO ujung', right: 'TODO ujung' }, sub: 'TODO kalimat pendukung' },
  { component: 'cover', variant: 'poster', art: 'jump', title: 'TODO judul lima kata', kicker: 'TODO kalimat pendukung' },
  { component: 'photo', variant: 'full', media: { src: 'foto-cover.jpg', alt: 'TODO isi foto dari pemilik akun' }, title: 'TODO judul cover', kicker: 'TODO kalimat pendukung' },
];
/* Alternative closings: other calls to action for the last slide */
const CALLS = [
  { component: 'action', variant: 'save', title: 'TODO alasan menyimpan', points: ['TODO poin yang akan dicari lagi', 'TODO poin lain'], cta: { icon: 'send', text: 'TODO ajakan, diawali kata kerja' } },
  { component: 'prompt', variant: 'options', art: 'question', title: 'TODO pertanyaan pilihan?', options: ['TODO pilihan A', 'TODO pilihan B'], cta: { icon: 'message-circle', text: 'Tulis A atau B di komentar' } },
  { component: 'prompt', variant: 'ask', art: 'talk', title: 'TODO pertanyaan untuk pembaca?', cta: { icon: 'message-circle', text: 'TODO ajakan bercerita di komentar' } },
  { component: 'action', variant: 'share', title: 'TODO kirim ke siapa', lede: 'TODO kenapa berguna untuk mereka', cta: { icon: 'send', text: 'TODO ajakan, diawali kata kerja' } },
];
const seed = [...args.slug].reduce((n, ch) => n + ch.charCodeAt(0), 0);
const covers = Array.from({ length: 4 }, (_, k) => ({ name: base[0], theme: 'dark', ...HOOKS[(seed + k * 3) % HOOKS.length] }));
const closings = Array.from({ length: 3 }, (_, k) => ({ name: names[names.length - 1], theme: 'dark', ...CALLS[(seed + k) % CALLS.length] }));
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'post.json'), JSON.stringify({ brand: brand.id, slug: args.slug, title: args.title, slides, covers, closings }, null, 2) + '\n');
console.log(`✓ Dibuat: posts/${args.slug}/post.json (${slides.length} slide, ${covers.length} alternatif cover, ${closings.length} alternatif penutup, nama slide mengikuti struktur akun ${brand.name}).`);
console.log('  Isi setiap TODO, pilih komponen dari references/components.md, lalu jalankan scan.mjs.');
console.log('  Alternatif cover (covers) adalah hook lain untuk slide pertama, alternatif penutup (closings) ajakan lain untuk slide terakhir; ganti jenisnya bila ada yang lebih cocok.');
console.log(`  Foto dan video milik akun ditaruh di posts/${args.slug}/media/ dan disebut lewat field media.`);
console.log('  Setiap slide wajib punya gambar. Ganti ilustrasi sementara di "art" dengan yang cocok dengan isinya (bagian Ilustrasi di references/components.md).\n');
