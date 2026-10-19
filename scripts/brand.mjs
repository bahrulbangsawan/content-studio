#!/usr/bin/env node
// Account setup. The only way brand.json, logos and fonts enter or change.
//   node brand.mjs init   --from answers.json [--replace]   create an account from the owner's answers
//   node brand.mjs check  --id <id>                          validate and print contrast ratios
//   node brand.mjs accept --id <id>                          re-approve after the OWNER agreed to a change
//   node brand.mjs rules  --id <id>                          carousel rules and video rules, with their source
//   node brand.mjs list
// All commands take [--root <workspace>] (default ./content-studio).
import { mkdirSync, writeFileSync, readFileSync, existsSync, copyFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { parseArgs, workspace, readJson, fail, report, ratioText } from './lib/common.mjs';
import { validateBrand, writeLock, loadBrand, brandDir, DEFAULT_RULES, DEFAULT_VIDEO_RULES, videoZones } from './lib/brand.mjs';
import { sanitizeSvg } from './lib/svg.mjs';

const args = parseArgs();
const cmd = args._[0];
const root = workspace(args);

function printContrasts(list) {
  if (!list.length) return;
  console.log('Kontras warna:');
  for (const c of list) console.log(`  ${ratioText(c.ratio).padStart(7)}  ${c.label}  (${c.fg} di atas ${c.bg})`);
  console.log('');
}

if (cmd === 'init') {
  if (!args.from) fail('Pakai: node brand.mjs init --from answers.json');
  const answersPath = resolve(args.from);
  const a = readJson(answersPath, 'Berkas jawaban');
  const base = dirname(answersPath);
  if (!a.id) fail('Jawaban belum berisi id akun.');
  const dir = brandDir(root, a.id);
  if (existsSync(join(dir, 'brand.json')) && !args.replace) fail(`Akun "${a.id}" sudah ada. Pakai --replace hanya bila pemilik akun meminta akun ini diganti.`);
  mkdirSync(dir, { recursive: true });

  const notes = [];
  const copyLogo = (src, name) => {
    if (!src) return undefined;
    const p = resolve(base, src);
    if (!existsSync(p)) fail(`Logo tidak ditemukan: ${p}`);
    const { svg, notes: n } = sanitizeSvg(readFileSync(p, 'utf8'));
    n.forEach(x => notes.push(`${name}: ${x}`));
    writeFileSync(join(dir, name), svg + '\n');
    return name;
  };
  const light = copyLogo(a.logoLight, 'logo-light.svg');
  const dark = a.logoDark ? copyLogo(a.logoDark, 'logo-dark.svg') : light;
  let fontFile;
  if (a.fontFile) {
    const p = resolve(base, a.fontFile);
    if (!existsSync(p)) fail(`Font tidak ditemukan: ${p}`);
    fontFile = 'font.woff2';
    copyFileSync(p, join(dir, fontFile));
  }
  const brand = {
    id: a.id,
    name: a.name,
    handle: String(a.handle || '').replace(/^@/, ''),
    wordmark: a.wordmark || a.name,
    language: a.language || 'id',
    logo: { light, dark, showWordmark: a.showWordmark !== false },
    font: { family: a.fontFamily || 'Inter', ...(fontFile ? { file: fontFile } : {}) },
    colors: a.colors,
    disclaimer: a.disclaimer || '',
    swipeLabel: a.swipeLabel || (a.language === 'en' ? 'Swipe' : 'Geser'),
    ...(a.structure ? { structure: a.structure } : {}),
    ...(a.rules ? { rules: a.rules } : {}),
    ...(a.videoRules ? { videoRules: a.videoRules } : {}),
    ...(a.dos ? { dos: a.dos } : {}),
  };
  writeFileSync(join(dir, 'brand.json'), JSON.stringify(brand, null, 2) + '\n');
  const v = validateBrand(brand, dir);
  if (notes.length) console.log('\nPembersihan logo:\n  ' + notes.join('\n  '));
  report(`Akun ${brand.name} (${brand.id})`, v.errors, v.warnings);
  printContrasts(v.contrasts);
  if (v.errors.length) fail('Akun belum disetujui. Perbaiki jawabannya bersama pemilik akun lalu jalankan init lagi dengan --replace.');
  writeLock(brand, dir);
  console.log(`✓ Akun siap dan terkunci: ${dir}\n`);
} else if (cmd === 'check') {
  if (!args.id) fail('Pakai: node brand.mjs check --id <id>');
  const { brand, dir, approved, intact } = loadBrand(root, args.id);
  const v = validateBrand(brand, dir);
  report(`Akun ${brand.name} (${brand.id})`, v.errors, v.warnings);
  printContrasts(v.contrasts);
  console.log(!approved ? '! Akun belum pernah disetujui. Perbaiki galatnya lalu jalankan init lagi dengan --replace.\n'
    : intact ? '✓ Akun cocok dengan versi yang disetujui.\n' : '! Akun berubah sejak disetujui. Minta persetujuan pemilik, lalu jalankan accept.\n');
  process.exit(v.errors.length ? 1 : 0);
} else if (cmd === 'accept') {
  if (!args.id) fail('Pakai: node brand.mjs accept --id <id>');
  const { brand, dir } = loadBrand(root, args.id);
  const v = validateBrand(brand, dir);
  report(`Akun ${brand.name} (${brand.id})`, v.errors, v.warnings);
  if (v.errors.length) fail('Akun tidak valid, jadi tidak bisa disetujui.');
  writeLock(brand, dir);
  console.log('✓ Perubahan akun disetujui dan dikunci ulang.\n');
} else if (cmd === 'rules') {
  if (!args.id) fail('Pakai: node brand.mjs rules --id <id>');
  const { brand, rules, videoRules } = loadBrand(root, args.id);
  const show = (title, eff, own, defs) => {
    console.log(`\n${title}\n${'─'.repeat(60)}`);
    for (const [k, v] of Object.entries(eff)) console.log(`  ${k.padEnd(20)}${JSON.stringify(v).padEnd(18)}  ${own && k in own ? 'akun' : k in defs ? 'bawaan' : 'dari aturan carousel'}`);
  };
  show('Aturan carousel (rules): slide 1080 x 1350', rules, brand.rules, DEFAULT_RULES);
  show('Aturan video (videoRules): Reels 1080 x 1920', videoRules, brand.videoRules, DEFAULT_VIDEO_RULES);
  const z = videoZones(videoRules);
  console.log(`\nZona video: teks di x ${z.content.x} sampai ${z.content.x + z.content.w}, y ${z.content.y} sampai ${z.bottom} (adegan pertama dan terakhir dari y ${z.top}); subtitle y ${videoRules.captionTop} sampai ${videoRules.captionBottom}; tombol kanan x ${z.rail.x} ke kanan dari y ${z.rail.y}.`);
  console.log('Zona carousel: header y 0 sampai 168, konten y 168 sampai 1182 dan x 96 sampai 984, footer y 1182 sampai 1350.');
  console.log('Ubah hanya atas permintaan pemilik: edit brand.json (rules atau videoRules), brand.mjs check, lalu accept setelah pemilik setuju.\n');
} else if (cmd === 'list') {
  const dir = join(root, 'brands');
  const ids = existsSync(dir) ? readdirSync(dir).filter(d => existsSync(join(dir, d, 'brand.json'))) : [];
  if (!ids.length) console.log('Belum ada akun. Buat dengan: node brand.mjs init --from answers.json');
  for (const id of ids) {
    const { brand, approved, intact } = loadBrand(root, id);
    const status = !approved ? 'belum disetujui (init belum lolos)' : intact ? 'disetujui' : 'berubah sejak disetujui';
    console.log(`${intact ? '✓' : '!'} ${id}  ${brand.name}  @${brand.handle}  ${status}`);
  }
} else {
  fail('Perintah: init, check, accept, rules, atau list. Lihat references/brand-setup.md.');
}
