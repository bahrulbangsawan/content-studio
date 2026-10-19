// Renders a validated reel into scene markup and the data the player reads: every scene's length, when its
// voice starts, when each word is said (for captions) and how it arrives. Times come from the voice-over clips
// when they exist (posts/<slug>/audio/voice.json, written by voice.mjs) and from an estimate otherwise.
import { SCENES } from './reel-scenes.mjs';
import { wordTimes, estimateMap, makeClock, captionChunks, spoken, voWords, LEAD, HOOK_LEAD, TAIL, TRANSITION, MIN_SCENE } from './reel-time.mjs';
import { brandCss } from './render.mjs';
import { uniqueIds } from './svg.mjs';
import { esc, CROSS } from './render-kit.mjs';
import { sha256, slugify } from './common.mjs';
import { videoZones } from './brand.mjs';

/** The voice-over clip that belongs to a scene: same words, same delivery note. */
export const voKey = s => sha256(JSON.stringify([String(s.vo || '').trim(), String(s.tone || '').trim()])).slice(0, 16);

const EXTRA_ICONS = { x: CROSS, 'arrow-down': ['M12 5l0 14', 'M18 13l-6 6', 'M6 13l6 6'] };
const CYCLE = ['up', 'wipe', 'zoom', 'slide', 'circle', 'fade'];
const MIN = { hook: 2.2, closing: 3.4 };
const LEN = { rise: 0.55, fade: 0.45, pop: 0.55, slam: 0.34, word: 0.32, left: 0.5, right: 0.5, up: 0.7, zoomIn: 0.9, wipe: 0.6, wipeUp: 0.65, draw: 0.6, grow: 0.55, mark: 0.42, stamp: 0.42, flipIn: 0.3, count: 1.1 };

/** When the last part of a scene's markup has fully arrived. */
function lastEnd(html) {
  let m, end = 0;
  const re = /data-a="(\w+)" data-t="([\d.]+)"(?: data-l="([\d.]+)")?/g;
  while ((m = re.exec(html))) end = Math.max(end, Number(m[2]) + (m[3] ? Number(m[3]) : LEN[m[1]] || 0.5));
  return end;
}
/* Share of the voice's meaningful words that are also on screen: when most are, the scene's own text is the
   caption and the subtitle band stays empty */
function overlap(onScreen, vo) {
  const a = new Set(voWords(onScreen).map(w => w.norm)), b = voWords(vo).map(w => w.norm).filter(w => w.length > 2);
  return b.length ? b.filter(w => a.has(w)).length / b.length : 0;
}

/** The account's video zones as CSS variables on the frame: layout, guide overlay and checks read the same numbers.
    Scenes are laid out DESIGN_W wide and scaled into the safe zone (--zoom). */
export function zoneCss(v) {
  const z = videoZones(v), c = z.content, cp = z.caption, f = z.foot;
  return `.rf { --cz-x: ${c.x}px; --cz-y: ${c.y}px; --cz-w: ${c.w}px; --cz-h: ${c.h}px; --zoom: ${z.zoom}; --cap-x: ${cp.x}px; --cap-y: ${cp.y}px; --cap-w: ${cp.w}px; --cap-h: ${cp.h}px; --ft-x: ${f.x}px; --ft-y: ${f.y}px; --ft-w: ${f.w}px; --ft-h: ${f.h}px; --hdr-h: ${z.top}px; --hdr-x: ${c.x}px; }`;
}

export function renderReel(reel, ctx) {
  const b = ctx.brand, audio = ctx.audio || { clips: {} }, vr = ctx.videoRules;
  const icons = { ...EXTRA_ICONS, ...ctx.icons };
  let lid = 0;
  const logo = theme => uniqueIds(theme === 'dark' ? ctx.logoDark : ctx.logoLight, 'rl' + ++lid);
  const sources = Object.fromEntries((reel.sources || []).map(s => [s.id, { ...s, link: s.doi ? `https://doi.org/${s.doi}` : s.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${s.pmid}/` : s.url }]));
  /* Sources in the order the video first shows them, for the closing card */
  const order = [];
  for (const s of [...reel.scenes, ...(reel.hooks || []), ...(reel.closings || [])]) for (const id of [].concat(s.source || [])) if (sources[id] && !order.includes(id)) order.push(id);
  const sourceList = order.map(id => sources[id].short);

  const main = reel.scenes, H = [main[0], ...(reel.hooks || [])], Cl = [main[main.length - 1], ...(reel.closings || [])];
  const entries = [...H.map(s => ({ s, role: 'hook' })), ...main.slice(1, -1).map((s, k) => ({ s, role: 'mid', k })), ...Cl.map(s => ({ s, role: 'close' }))];
  const closeTr = Cl[0].transition || 'up';
  const clips = [];
  const scenes = [], markup = [];
  entries.forEach((e, i) => {
    const s = e.s, def = SCENES[s.type];
    const theme = s.theme === 'dark' ? 'dark' : 'light';
    const clip = s.vo ? audio.clips[voKey(s)] : null;
    const lead = e.role === 'hook' ? HOOK_LEAD : LEAD;
    const map = clip ? clip.map : estimateMap(s.vo);
    const words = wordTimes(s.vo, map, clip && clip.words).map(w => ({ w: w.w, s: +(w.s + lead).toFixed(3), e: +(w.e + lead).toFixed(3) }));
    const speechEnd = s.vo ? lead + map.end : 0;
    const base = Math.max(MIN[s.type] || MIN_SCENE, speechEnd + TAIL, s.duration || 0);
    const t0 = e.role === 'hook' ? 0.05 : TRANSITION * 0.6;
    const clk = makeClock(words, { t0, speechEnd: Math.max(speechEnd, t0 + 1), dur: base + 3 });
    const html = def.render(s, { brand: b, icons, media: ctx.media, sources, sourceList, clk, index: i, theme, logo });
    const end = lastEnd(html);
    const dur = +Math.max(base, end + 0.55).toFixed(2);
    const tr = e.role === 'hook' ? 'cut' : s.transition || (e.role === 'close' ? closeTr : (s.type === 'footage' && (s.variant || 'full') === 'full' ? ['fade', 'zoom'][e.k % 2] : CYCLE[e.k % CYCLE.length]));
    const onScreen = [s.title, s.term, s.myth].filter(Boolean).join(' ');
    const captions = (reel.captions ?? vr.captions) !== false && s.captions !== false && e.role !== 'close' && !(s.vo && onScreen && overlap(onScreen, s.vo) >= 0.6);
    let vo = null;
    if (clip) {
      let n = clips.findIndex(c => c.file === clip.file);
      if (n < 0) { clips.push({ file: clip.file }); n = clips.length - 1; }
      vo = { id: `a${n + 1}`, at: lead, dur: +clip.dur.toFixed(3) };
    } else if (s.vo) vo = { id: null, at: lead, dur: +map.end.toFixed(3) };
    const v = def.variants ? def.variants[s.variant || def.keys.variant.default] : '';
    const name = s.name || (e.role === 'hook' ? (i === 0 ? 'Pembuka' : `Pembuka ${i + 1}`) : e.role === 'close' ? 'Penutup' : def.label);
    scenes.push({
      name, slug: slugify(name), type: s.type, label: `${def.label}${v ? ', ' + v.toLowerCase() : ''}`, theme, dur, tr, trLen: tr === 'cut' ? 0 : TRANSITION,
      captions, bleed: (s.type === 'footage' && (s.variant || 'full') === 'full') || (s.type === 'hook' && s.variant === 'footage'),
      settle: +Math.min(dur - 0.05, end + 0.15).toFixed(2), vo, voText: spoken(s.vo || ''), caps: captionChunks(words, { maxChars: vr.captionChars }),
      tags: [s.media ? 'footage' : '', s.art ? `ilustrasi ${s.art}` : '', ...[].concat(s.source || []).map(id => `sumber ${id}`)].filter(Boolean),
      estimated: !!(s.vo && !clip),
      credits: s.media && ctx.credits && ctx.credits[s.media.src] ? [ctx.credits[s.media.src]] : [],
    });
    markup.push(`<section class="scene slide is-${theme}" data-i="${i}" aria-label="${esc(name)}"${i === 0 ? '' : ' hidden'}>\n${html}\n</section>`);
  });
  const nH = H.length, nM = main.length - 2;
  const seq = { hooks: H.map((_, k) => k), main: Array.from({ length: nM }, (_, k) => nH + k), closings: Cl.map((_, k) => nH + nM + k) };
  const voiced = scenes.filter(s => s.vo && s.vo.id).length, spokenN = scenes.filter(s => s.vo).length;
  const voiceNote = voiced
    ? `Suara ${audio.provider || ''}${audio.model ? ' ' + audio.model : ''}${audio.voice ? ', suara ' + audio.voice : ''}: ${voiced} dari ${spokenN} adegan bersuara.${voiced < spokenN ? ' Adegan lain belum: jalankan content-studio voice ' + reel.slug + '.' : ''}`
    : `Belum ada voice over. Jalankan content-studio voice ${reel.slug}. Waktu teks dan subtitle sekarang memakai perkiraan bicara ${spokenN ? 'sekitar 2,3 kata per detik' : ''}.`;
  const total = seq.hooks.slice(0, 1).concat(seq.main, seq.closings.slice(0, 1)).reduce((n, i) => n + scenes[i].dur, 0);
  return {
    TITLE: esc(reel.title),
    BRAND_CSS: brandCss(b) + '\n' + zoneCss(vr),
    NAV_LOCKUP: `<span class="logo-img">${logo('light')}</span><b>${esc(b.wordmark || b.name)}</b>`,
    META: esc(`${reel.title} · Reels ${Math.round(total)} detik`),
    STAGE_LABEL: esc(`${reel.title}, video 9:16. Spasi untuk memutar.`),
    SCENES: markup.join('\n'),
    LOGO_LIGHT: logo('light'), LOGO_DARK: logo('dark'), HANDLE: `<span>@${esc(b.handle)}</span>`,
    GUIDE: guide(scenes, seq, vr),
    clips,
    total,
    DATA: {
      brand: { id: b.id, name: b.name, handle: b.handle }, reel: { slug: reel.slug, title: reel.title }, lang: b.language || 'id',
      scenes, seq, sources: (reel.sources || []).map(s => ({ id: s.id, short: s.short, cite: s.cite, link: sources[s.id].link, verified: s.verified || '' })),
      credits: [...new Set(Object.values(ctx.credits || {}))], caption: reel.caption || '', disclaimer: b.disclaimer || '', voice: voiceNote, scan: ctx.warnings || [],
      music: ctx.music || null,
      videoRules: vr, zones: videoZones(vr),
    },
  };
}

function guide(scenes, seq, v) {
  const rows = (list, k) => list.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('');
  const used = [...new Set([...seq.main, seq.closings[0]].map(i => scenes[i].tr).filter(t => t !== 'cut'))];
  const z = videoZones(v), pc = n => `${Math.round((n / 1920) * 1000) / 10}%`.replace('.', ',');
  const num = n => String(n).replace('.', ',');
  const steps = z.steps.map(([y, r]) => `${r} px dari y ${y}`).join(', ');
  return `<div class="sec"><h3>Zona aman video (9:16)</h3><p class="note">Aturan ini khusus video. Carousel memakai zonanya sendiri: header dan footer 168 px, margin 96 px.</p><dl class="kv">${rows([
    ['Header', `y 0 sampai ${z.top} (${pc(z.top)}): logo dan handle${v.headerBrand ? '' : ' (dimatikan)'}, di luar zona aman. Bilah atas aplikasi bisa menimpanya.`],
    ['Bawah', `y ${z.bottom} sampai 1920 (${pc(1920 - z.bottom)}): nama akun, caption, audio. Tanpa isi.`],
    ['Samping', `kiri ${z.left} px, kanan ${z.right} px${steps ? `, lalu ${steps} untuk kolom tombol` : ''}.`],
    ['Isi adegan', `x ${z.content.x} sampai ${z.content.x + z.content.w}, y ${z.content.y} sampai ${z.content.y + z.content.h}, di atas kolom tombol${v.contentInset ? `, ${v.contentInset} px dari tepi zona aman` : ''}. Skala tata letak ${num(Math.round(z.zoom * 100))}%.`],
    ['Subtitle', `y ${v.captionTop} sampai ${v.captionBottom}, menempel di batas bawah zona aman, x ${z.caption.x} sampai ${z.caption.x + z.caption.w}, sekitar ${v.captionChars} karakter per baris.`],
    ['Penutup', `disclaimer, sumber, dan handle di bawah isi: y ${z.foot.y} sampai ${z.foot.y + z.foot.h}.`],
  ])}</dl><p class="note">Tombol zona di bawah video menggambar area ini di atas adegan.${v.preset ? ` Preset: ${esc(v.preset)}.` : ''}</p></div>
<div class="sec"><h3>Aturan video</h3><dl class="kv">${rows([
    ['Huruf terkecil', `${v.minTextPx} px untuk isi, ${v.minMetaPx} px untuk sumber dan disclaimer, seperti tampil di video.`],
    ['Kecepatan suara', `paling cepat ${num(v.maxWordsPerSecond)} kata per detik.`],
    ['Pembuka', `selesai dalam ${num(v.hookMaxSeconds)} detik.`],
    ['Per adegan', `paling lama ${num(v.maxSceneSeconds)} detik, satu ide.`],
    ['Durasi', `${v.minSeconds} sampai ${v.maxSeconds} detik disarankan, batas ${v.hardMaxSeconds} detik.`],
    ['Subtitle', v.captions ? 'tampil, kecuali di adegan yang teks layarnya sama dengan suaranya dan di penutup.' : 'tidak tampil (dimatikan akun).'],
    ['Tulisan', `${v.noExclamation ? 'tanpa tanda seru' : 'tanda seru boleh'}, ${v.noEmDash ? 'tanpa tanda pisah panjang' : 'tanda pisah boleh'}${(v.bannedPhrases || []).length ? `, ${v.bannedPhrases.length} frasa terlarang` : ''}.`],
    ['Bukti', 'setiap angka dan klaim penelitian bersumber, sumber terverifikasi.'],
  ])}</dl><p class="note">Diatur di brand.json bagian videoRules oleh pemilik akun; lihat semuanya dengan content-studio brand rules --id &lt;akun&gt;.</p></div>
<div class="sec"><h3>Huruf</h3><dl class="kv">${rows([
    ['Pembuka', '120/126, 700 (turun ke 104 atau 92 untuk kata panjang)'], ['Judul adegan', '72/80 sampai 92/100, 700'], ['Isi', '48/64 sampai 56/72'],
    ['Angka', '300/280 dan 180/176, dihitung naik'], ['Subtitle', '58/84, 700, kata yang diucapkan bersorot'], ['Terkecil', '40 px untuk isi, 30 px untuk sumber dan disclaimer'],
  ])}</dl></div>
<div class="sec"><h3>Gerak</h3><p class="note">Setiap bagian muncul saat suara menyebutnya. Kata pembuka tampil satu per satu mengikuti ucapan. Langkah sebelumnya meredup saat langkah berikutnya datang. Transisi di video ini: ${esc(used.join(', ') || 'potong langsung')}.</p></div>
<div class="sec"><h3>Ekspor</h3><p class="note">MP4 1080 x 1920, 30 fps, H.264 10 Mbps, AAC 48 kHz stereo, moov di depan: sesuai spesifikasi Reels. Dari terminal: content-studio export ${esc('<slug>')} menulis MP4, cover, SRT, dan caption sekaligus.</p></div>`;
}
