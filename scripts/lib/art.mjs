// Spot illustrations: the pictures that carry a slide's idea, e.g. a clock for "60 menit". One style for all of
// them: navy outlines, flat fills in the account's accent and highlight, on a round light plate. They draw only
// with classes (.a-*) whose colours come from the account's light palette, so an illustration looks the same on
// light and dark slides (like cards) and changes with the account. Some move gently in a loop (class "lp-*");
// the loop pauses on other slides and is recorded in the MP4 like the characters.
// Every drawing sits in a 240 x 240 box with its plate centred at (120, 124).

const plate = (r = 102) => `<circle class="a-p" cx="120" cy="124" r="${r}"/>`;
const ground = (y, x1 = 36, x2 = 204) => `<path class="a-l" d="M${x1} ${y}H${x2}"/>`;
const pts = a => a.map(p => p.join(' ')).join(' L');

/* A child in the style of the account's character: navy limbs, blue shirt, amber head and hands. */
function head(x, y, dir = 0, r = 24, mood = 'smile') {
  const hair = dir === 0
    ? `M${x - 23} ${y - 4} C${x - 25} ${y - 32} ${x + 25} ${y - 32} ${x + 23} ${y - 4} C${x + 16} ${y - 15} ${x + 4} ${y - 18} ${x - 6} ${y - 14} C${x - 12} ${y - 12} ${x - 18} ${y - 8} ${x - 23} ${y - 4}Z`
    : `M${x - 24 * dir} ${y + 2} C${x - 26 * dir} ${y - 28} ${x + 18 * dir} ${y - 34} ${x + 23 * dir} ${y - 8} C${x + 12 * dir} ${y - 15} ${x} ${y - 16} ${x - 8 * dir} ${y - 10} C${x - 12 * dir} ${y - 4} ${x - 18 * dir} ${y + 1} ${x - 24 * dir} ${y + 2}Z`;
  const face = dir === 0
    ? `<circle class="a-ls" cx="${x - 13}" cy="${y + 10}" r="4.5"/><circle class="a-ls" cx="${x + 13}" cy="${y + 10}" r="4.5"/><circle class="a-n" cx="${x - 8}" cy="${y + 3}" r="3"/><circle class="a-n" cx="${x + 8}" cy="${y + 3}" r="3"/>`
      + (mood === 'frown' ? `<path class="a-th" d="M${x - 13} ${y - 5} L${x - 4} ${y - 2} M${x + 13} ${y - 5} L${x + 4} ${y - 2} M${x - 6} ${y + 15} Q${x} ${y + 9} ${x + 6} ${y + 15}"/>` : `<path class="a-th" d="M${x - 6} ${y + 11} Q${x} ${y + 16} ${x + 6} ${y + 11}"/>`)
    : `<circle class="a-ls" cx="${x + 4 * dir}" cy="${y + 10}" r="4.5"/><circle class="a-n" cx="${x + 11 * dir}" cy="${y + 2}" r="3"/><path class="a-th" d="M${x + 8 * dir} ${y + 12} Q${x + 13 * dir} ${y + 14} ${x + 18 * dir} ${y + 9}"/>`;
  return `<circle class="a-s a-o" cx="${x}" cy="${y}" r="${r}"/><path class="a-n" d="${hair}"/>${face}`;
}
function kid(j) {
  const limb = (from, a) => `<path class="a-limb" d="M${pts([from, ...a])}"/>`;
  const hand = p => `<circle class="a-s a-o4" cx="${p[0]}" cy="${p[1]}" r="7"/>`;
  const foot = p => `<ellipse class="a-n" cx="${p[0] + (j.dir || 0) * 4}" cy="${p[1] + 2}" rx="11" ry="6.5"/>`;
  return `<g class="${j.cls || ''}"${j.style ? ` style="${j.style}"` : ''}>${limb(j.hip, j.lb)}${foot(j.lb[1])}${limb(j.sh, j.ab)}${hand(j.ab[1])}`
    + `<path class="a-torso-o" d="M${j.sh.join(' ')} L${j.hip.join(' ')}"/><path class="a-torso" d="M${j.sh.join(' ')} L${j.hip.join(' ')}"/>`
    + `${limb(j.hip, j.lf)}${foot(j.lf[1])}${limb(j.sh, j.af)}${hand(j.af[1])}${head(j.h[0], j.h[1], j.dir || 0, 24, j.mood)}</g>`;
}
/* An adult: taller, longer limbs, hair in a bun, amber shirt. */
function adult(x, y, opts = {}) {
  return `<path class="a-limb" d="M${x - 10} ${y + 62} L${x - 14} ${y + 126}"/><path class="a-limb" d="M${x + 10} ${y + 62} L${x + 14} ${y + 126}"/>`
    + `<ellipse class="a-n" cx="${x - 16}" cy="${y + 128}" rx="12" ry="6.5"/><ellipse class="a-n" cx="${x + 16}" cy="${y + 128}" rx="12" ry="6.5"/>`
    + `<path class="a-limb" d="M${x - 18} ${y + 6} L${x - 30} ${y + 42} L${opts.handL || `${x - 28} ${y + 76}`}"/>`
    + `<path class="a-torso-o w" d="M${x} ${y + 6} L${x} ${y + 52}"/><path class="a-torso w a-sun-t" d="M${x} ${y + 6} L${x} ${y + 52}"/>`
    + `<path class="a-limb" d="M${x + 18} ${y + 6} L${x + 28} ${y + 40} L${opts.handR || `${x + 28} ${y + 76}`}"/><circle class="a-s a-o4" cx="${(opts.handR || `${x + 28} ${y + 76}`).split(' ')[0]}" cy="${(opts.handR || `${x + 28} ${y + 76}`).split(' ')[1]}" r="7"/>`
    + `<circle class="a-n" cx="${x + 3}" cy="${y - 62}" r="11"/>${head(x, y - 30, 0, 26)}`;
}
const spark = (x, y, s = 1) => `<path class="a-s a-o4" d="M${x} ${y - 12 * s} L${x + 3.5 * s} ${y - 3.5 * s} L${x + 12 * s} ${y} L${x + 3.5 * s} ${y + 3.5 * s} L${x} ${y + 12 * s} L${x - 3.5 * s} ${y + 3.5 * s} L${x - 12 * s} ${y} L${x - 3.5 * s} ${y - 3.5 * s}Z"/>`;
const ticks = (cx, cy, r1, r2, n, cls = 'a-l4') => Array.from({ length: n }, (_, k) => {
  const a = (k * 2 * Math.PI) / n, c = Math.cos(a), s = Math.sin(a);
  return `<path class="${cls}" d="M${(cx + r1 * s).toFixed(1)} ${(cy - r1 * c).toFixed(1)} L${(cx + r2 * s).toFixed(1)} ${(cy - r2 * c).toFixed(1)}"/>`;
}).join('');

/* name: [label, words that suggest it, svg]. Labels and words help pick a picture that fits the slide. */
const DEF = {
  /* ---------- Waktu ---------- */
  clock: ['Jam', 'waktu, menit, jam, durasi, lama, setiap hari', `${plate()}
<circle class="a-s a-o" cx="66" cy="60" r="17"/><circle class="a-s a-o" cx="174" cy="60" r="17"/>
<path class="a-l" d="M84 196 L72 212 M156 196 L168 212"/>
<circle class="a-c a-o" cx="120" cy="128" r="80"/>
<circle class="a-arc ad-draw" cx="120" cy="128" r="64" pathLength="1" transform="rotate(-90 120 128)"/>
${ticks(120, 128, 70, 76, 12, 'a-l4')}
<path class="a-hand-h" d="M120 128 L94 104"/>
<g class="lp-spin" style="transform-origin: 120px 128px"><path class="a-hand-m" d="M120 128 L120 74"/></g>
<circle class="a-n" cx="120" cy="128" r="8"/>`],
  stopwatch: ['Stopwatch', 'detik, durasi latihan, tahan, hitung waktu', `${plate()}
<rect class="a-b a-o" x="106" y="22" width="28" height="18" rx="5"/><path class="a-l" d="M120 40 V50 M170 58 L182 46"/>
<circle class="a-c a-o" cx="120" cy="136" r="78"/>
<path class="a-ls" d="M120 136 L120 72 A64 64 0 0 1 184 136 Z"/>
${ticks(120, 136, 66, 72, 8, 'a-l4')}
<g class="lp-spin" style="transform-origin: 120px 136px"><path class="a-hand-m" d="M120 136 L120 80"/></g>
<circle class="a-n" cx="120" cy="136" r="8"/>`],
  hourglass: ['Jam pasir', 'menunggu, sabar, bertahap, pelan-pelan', `${plate()}
<rect class="a-b a-o" x="62" y="30" width="116" height="18" rx="7"/><rect class="a-b a-o" x="62" y="200" width="116" height="18" rx="7"/>
<path class="a-c a-o" d="M78 48 C78 98 112 108 112 124 C112 140 78 150 78 200 L162 200 C162 150 128 140 128 124 C128 108 162 98 162 48 Z"/>
<path class="a-s" d="M90 70 L150 70 C146 92 128 100 120 112 C112 100 94 92 90 70 Z"/>
<path class="a-s" d="M86 196 C92 172 106 164 120 160 C134 164 148 172 154 196 Z"/>
<path class="a-sand lp-fall" d="M120 112 V160"/>`],
  calendar: ['Kalender', 'hari, minggu, jadwal, rutin, seminggu', `${plate()}
<rect class="a-c a-o" x="42" y="52" width="156" height="144" rx="16"/>
<path class="a-b" d="M44.5 68 a13.5 13.5 0 0 1 13.5 -13.5 h124 a13.5 13.5 0 0 1 13.5 13.5 v22 h-151 z"/><path class="a-l" d="M44 90 H196"/>
<path class="a-l" d="M78 40 V64 M162 40 V64"/>
${[0, 1, 2, 3].map(c => [0, 1, 2].map(r => `<rect class="${(c + r) % 2 ? 'a-lb' : 'a-ls'}" x="${58 + c * 33}" y="${102 + r * 30}" width="24" height="22" rx="6"/>`).join('')).join('')}
<path class="a-chk ad-draw" pathLength="1" d="M61 112 L68 119 L80 106"/><path class="a-chk ad-draw" pathLength="1" d="M127 142 L134 149 L146 136"/><path class="a-chk ad-draw" pathLength="1" d="M94 172 L101 179 L113 166"/>`],

  /* ---------- Anak bergerak ---------- */
  run: ['Anak berlari', 'berlari, aktif, gerak, olahraga, bermain di luar', `${plate()}${ground(206)}
<path class="a-l a-mute" d="M34 100 H62 M26 124 H54 M40 148 H62"/>
${kid({ cls: 'lp-bob', dir: 1, h: [140, 66], sh: [130, 106], hip: [122, 142], ab: [[108, 120], [94, 132]], af: [[150, 118], [164, 102]], lb: [[106, 170], [90, 198]], lf: [[148, 158], [140, 190]] })}`],
  jump: ['Anak melompat', 'melompat, energi, semangat, lompat', `${plate()}
<ellipse class="a-shadow lp-shadow" cx="120" cy="214" rx="38" ry="7"/>
${kid({ cls: 'lp-jump', h: [120, 60], sh: [120, 98], hip: [120, 136], ab: [[94, 82], [80, 54]], af: [[146, 82], [160, 54]], lb: [[100, 158], [106, 182]], lf: [[140, 158], [134, 182]] })}
${spark(52, 112, 0.8)}${spark(190, 128, 0.7)}`],
  balance: ['Anak menjaga keseimbangan', 'keseimbangan, seimbang, satu kaki, balok, koordinasi', `${plate()}
<rect class="a-b a-o" x="44" y="196" width="152" height="14" rx="7"/><path class="a-l" d="M64 210 V222 M176 210 V222"/>
<g class="lp-tilt" style="transform-origin: 120px 196px">${kid({ h: [120, 70], sh: [120, 108], hip: [120, 146], ab: [[94, 112], [64, 106]], af: [[146, 112], [176, 106]], lb: [[114, 170], [116, 192]], lf: [[142, 160], [128, 176]] })}</g>`],
  climb: ['Anak naik tangga', 'tangga, naik, memanjat, langkah, kekuatan kaki', `${plate()}
<path class="a-b a-o" d="M40 212 V180 H82 V148 H124 V116 H166 V84 H204 V212 Z"/>
<path class="a-l a-lt" d="M82 180 H124 M124 148 H166 M166 116 H204"/>
${kid({ dir: 1, h: [120, 44], sh: [114, 82], hip: [108, 116], ab: [[98, 98], [90, 84]], af: [[130, 96], [146, 88]], lb: [[96, 134], [100, 150]], lf: [[128, 120], [138, 112]] })}`],
  kick: ['Anak menendang bola', 'bola, menendang, bermain, koordinasi mata kaki', `${plate()}${ground(206)}
${kid({ dir: 1, h: [98, 66], sh: [96, 104], hip: [94, 142], ab: [[76, 118], [64, 132]], af: [[116, 116], [130, 128]], lb: [[90, 172], [86, 200]], lf: [[118, 162], [140, 172]] })}
<g class="lp-roll" style="transform-origin: 170px 182px"><circle class="a-s a-o" cx="170" cy="182" r="24"/><path class="a-l4" d="M170 158 C160 172 160 192 170 206 M148 174 C162 178 178 178 192 174"/></g>`],
  sit: ['Anak duduk tegak', 'duduk, postur, belajar, menulis, meja, punggung', `${plate()}
<path class="a-l" d="M58 92 V200 M58 154 H112 M64 154 V206 M106 154 V206"/>
<rect class="a-b a-o" x="128" y="128" width="84" height="12" rx="5"/><path class="a-l" d="M196 140 V206"/>
<rect class="a-c a-o" x="148" y="118" width="40" height="10" rx="3"/>
${kid({ dir: 1, h: [86, 72], sh: [82, 110], hip: [80, 142], ab: [[104, 124], [136, 120]], af: [[106, 118], [142, 114]], lb: [[112, 146], [114, 186]], lf: [[110, 144], [112, 186]] })}
<rect class="a-ls a-o4" x="98" y="190" width="36" height="14" rx="4"/>`],
  sleep: ['Anak tidur', 'tidur, istirahat, malam, cukup tidur, lelah', `${plate()}
<rect class="a-b a-o" x="34" y="150" width="172" height="44" rx="12"/><path class="a-l" d="M44 194 V212 M196 194 V212"/>
<rect class="a-c a-o" x="44" y="128" width="54" height="30" rx="12"/>
${head(76, 124, 0).replace(/<circle class="a-n" cx="([\d.]+)" cy="([\d.]+)" r="2.8"\/>/g, (m, cx, cy) => `<path class="a-th" d="M${cx - 4} ${cy} Q${cx} ${+cy + 3} ${+cx + 4} ${cy}"/>`)}
<path class="a-lb a-o" d="M96 136 C120 122 170 124 200 140 L200 168 L96 168 Z"/>
<path class="a-s a-o4" d="M168 40 a24 24 0 1 0 22 32 a19 19 0 0 1 -22 -32 z"/>
<g class="lp-twinkle">${spark(136, 54, 0.6)}${spark(204, 98, 0.5)}</g>`],
  screen: ['Waktu layar', 'layar, gawai, ponsel, tablet, video, menonton', `${plate()}
<rect class="a-n" x="42" y="58" width="156" height="118" rx="16"/><rect class="a-lb" x="54" y="70" width="132" height="94" rx="8"/>
<path class="a-c a-o4" d="M108 98 L138 117 L108 136 Z"/><rect class="a-c" x="66" y="150" width="108" height="6" rx="3"/><rect class="a-s" x="66" y="150" width="62" height="6" rx="3"/>
<path class="a-l" d="M120 176 V196 M90 200 H150"/>
<g class="lp-twinkle"><circle class="a-s a-o" cx="186" cy="58" r="24"/><path class="a-l4" d="M186 44 V58 L196 64"/></g>`],
  stretch: ['Anak meregangkan badan', 'peregangan, pemanasan, lentur, otot, latihan', `${plate()}${ground(206)}
<g class="lp-sway" style="transform-origin: 120px 206px">${kid({ h: [120, 86], sh: [120, 124], hip: [120, 158], ab: [[86, 92], [104, 50]], af: [[154, 92], [136, 50]], lb: [[106, 182], [98, 202]], lf: [[134, 182], [142, 202]] })}</g>`],
  family: ['Orang tua dan anak', 'orang tua, ibu, ayah, mendampingi, bersama, keluarga', `${plate()}${ground(210, 30, 210)}
${adult(84, 86, { handR: '126 150' })}
${kid({ h: [156, 118], sh: [156, 154], hip: [156, 184], ab: [[140, 166], [126, 152]], af: [[172, 166], [180, 178]], lb: [[150, 198], [148, 206]], lf: [[162, 198], [164, 206]] })}
<path class="a-heart lp-pulse" style="transform-origin: 156px 60px" d="M156 74 C138 60 138 42 151 42 C156 42 156 47 156 49 C156 47 156 42 161 42 C174 42 174 60 156 74 Z"/>`],

  /* ---------- Pengasuhan ---------- */
  tag: ['Label', 'label, cap, sebutan, julukan, melabeli', `${plate()}
<path class="a-l" d="M70 92 C46 70 52 40 82 36"/>
<g transform="rotate(-16 124 128)"><path class="a-s a-o" d="M78 88 H184 C192 88 198 94 198 102 V154 C198 162 192 168 184 168 H78 L46 128 Z"/>
<circle class="a-c a-o4" cx="74" cy="128" r="9"/><path class="a-chk" d="M104 114 H172 M104 140 H152"/></g>`],
  kneel: ['Bicara sejajar anak', 'bicara, menjelaskan, menegur, sejajar, mendengar, orang tua', `${plate()}${ground(206, 30, 210)}
<path class="a-limb" d="M78 148 L112 152 L114 200"/><path class="a-limb" d="M78 150 L70 200 L46 200"/>
<ellipse class="a-n" cx="120" cy="202" rx="12" ry="6.5"/>
<path class="a-torso-o w" d="M78 104 L78 146"/><path class="a-torso w a-sun-t" d="M78 104 L78 146"/>
<path class="a-limb" d="M92 110 L114 126 L136 134"/><circle class="a-s a-o4" cx="136" cy="134" r="7"/>
<circle class="a-n" cx="80" cy="44" r="10"/>${head(78, 74, 1, 25)}
${kid({ dir: -1, h: [164, 108], sh: [164, 144], hip: [164, 176], ab: [[180, 158], [184, 172]], af: [[150, 158], [144, 170]], lb: [[170, 192], [172, 204]], lf: [[158, 192], [156, 204]] })}
<path class="a-b a-o4" d="M116 34 H170 C176 34 180 38 180 44 V62 C180 68 176 72 170 72 H136 L124 82 V72 H116 C110 72 106 68 106 62 V44 C106 38 110 34 116 34 Z"/>
<g class="lp-type"><circle class="a-c" cx="128" cy="53" r="4"/><circle class="a-c" cx="143" cy="53" r="4"/><circle class="a-c" cx="158" cy="53" r="4"/></g>`],
  upset: ['Anak kesal', 'marah, kesal, tantrum, emosi, frustrasi, kasar', `${plate()}${ground(206)}
${kid({ mood: 'frown', h: [120, 80], sh: [120, 118], hip: [120, 154], ab: [[100, 130], [134, 136]], af: [[140, 130], [106, 140]], lb: [[110, 178], [104, 202]], lf: [[130, 178], [136, 202]] })}
<g class="lp-twinkle"><path class="a-l a-mute" d="M150 30 C160 22 172 34 162 40 C152 46 166 56 174 48 C182 40 194 50 186 58"/><path class="a-l a-mute" d="M62 44 L74 56 M52 62 L68 68 M178 84 L192 76"/></g>`],
  stop: ['Batas', 'batas, berhenti, tidak boleh, aturan, tegas', `${plate()}
<g class="lp-pulse" style="transform-origin: 120px 128px">
<g class="a-s a-o"><rect x="84" y="50" width="20" height="86" rx="10"/><rect x="106" y="36" width="20" height="96" rx="10"/><rect x="128" y="42" width="20" height="92" rx="10"/><rect x="150" y="58" width="18" height="78" rx="9"/>
<rect x="56" y="112" width="22" height="64" rx="11" transform="rotate(-38 67 144)"/><rect x="80" y="100" width="90" height="98" rx="34"/></g>
<g class="a-s"><rect x="86.5" y="96" width="15" height="40" rx="7"/><rect x="108.5" y="96" width="15" height="40" rx="7"/><rect x="130.5" y="96" width="15" height="40" rx="7"/><rect x="152.5" y="96" width="13" height="40" rx="6"/><rect x="58.5" y="118" width="17" height="40" rx="8" transform="rotate(-38 67 144)"/><rect x="82.5" y="102.5" width="85" height="93" rx="31"/></g>
</g>`],
  swap: ['Ganti', 'ganti, ubah, tukar, pengganti, dari ke', `${plate()}
<g class="lp-roll" style="transform-origin: 120px 124px; animation-duration: 8s">
<path class="a-swap-b" d="M60 112 C64 76 92 52 124 52 C150 52 168 64 178 82"/><path class="a-b a-o4" d="M164 88 L192 92 L188 64 Z"/>
<path class="a-swap-s" d="M180 136 C176 172 148 196 116 196 C90 196 72 184 62 166"/><path class="a-s a-o4" d="M76 160 L48 156 L52 184 Z"/></g>`],

  /* ---------- Tubuh ---------- */
  heart: ['Jantung', 'jantung, aktif, sehat, berdebar, kardio', `${plate()}
<g class="lp-pulse" style="transform-origin: 120px 128px"><path class="a-s a-o" d="M120 192 C64 152 44 120 50 92 C56 64 92 52 120 82 C148 52 184 64 190 92 C196 120 176 152 120 192 Z"/></g>
<path class="a-pulse ad-draw" pathLength="1" d="M36 132 H82 L94 108 L110 160 L124 120 L134 132 H204"/>`],
  brain: ['Otak', 'otak, belajar, fokus, saraf, berpikir, konsentrasi', `${plate()}
<path class="a-lb a-o" d="M118 52 C98 40 70 50 68 72 C46 76 40 100 52 114 C40 128 48 152 68 156 C70 176 94 186 112 176 L118 176 Z"/>
<path class="a-ls a-o" d="M122 52 C142 40 170 50 172 72 C194 76 200 100 188 114 C200 128 192 152 172 156 C170 176 146 186 128 176 L122 176 Z"/>
<path class="a-l4" d="M96 70 C106 80 104 92 92 98 M72 120 C86 116 98 124 98 138 M98 158 C104 150 112 150 114 156 M144 70 C134 80 136 92 148 98 M168 120 C154 116 142 124 142 138 M142 158 C136 150 128 150 126 156"/>
<path class="a-l" d="M120 176 V200"/>
<g class="lp-twinkle">${spark(196, 52, 0.7)}</g>`],
  knee: ['Lutut', 'lutut, sendi, kaki, tungkai, nyeri lutut', `${plate()}
<path class="a-leg-o" d="M62 66 L126 124 L104 192"/><path class="a-leg" d="M62 66 L126 124 L104 192"/>
<path class="a-shorts-o" d="M54 58 L86 88"/><path class="a-shorts" d="M54 58 L86 88"/>
<path class="a-n" d="M92 186 H138 C146 186 150 192 150 198 C150 204 146 208 138 208 H96 C90 208 86 204 86 198 Z"/>
<circle class="a-ring lp-pulse" style="transform-origin: 126px 124px" cx="126" cy="124" r="30"/>
<path class="a-l a-mute" d="M170 104 C180 114 180 134 170 144 M186 92 C204 108 204 140 186 156"/>`],
  feet: ['Telapak kaki', 'kaki, telapak, langkah, jinjit, berjalan, menapak', `${plate()}
<g transform="rotate(-12 92 140)"><path class="a-b a-o" d="M92 96 C112 96 116 132 112 160 C108 186 98 196 88 194 C76 192 72 176 74 156 C76 128 72 96 92 96 Z"/>
<circle class="a-b a-o4" cx="80" cy="82" r="8"/><circle class="a-b a-o4" cx="94" cy="76" r="7"/><circle class="a-b a-o4" cx="106" cy="80" r="6"/><circle class="a-b a-o4" cx="115" cy="88" r="5"/></g>
<g transform="rotate(10 152 116)"><path class="a-s a-o" d="M152 72 C172 72 176 108 172 136 C168 162 158 172 148 170 C136 168 132 152 134 132 C136 104 132 72 152 72 Z"/>
<circle class="a-s a-o4" cx="140" cy="58" r="8"/><circle class="a-s a-o4" cx="154" cy="52" r="7"/><circle class="a-s a-o4" cx="166" cy="56" r="6"/><circle class="a-s a-o4" cx="175" cy="64" r="5"/></g>`],
  spine: ['Tulang belakang', 'punggung, postur, tulang belakang, tegak, bungkuk', `${plate()}
<path class="a-l a-mute" d="M120 34 C150 70 92 112 122 150 C140 174 126 196 120 212"/>
${[[120, 40], [128, 60], [126, 80], [116, 100], [110, 120], [116, 140], [128, 160], [128, 180], [122, 200]].map(([x, y], k) => `<rect class="${k === 4 ? 'a-s' : 'a-c'} a-o4" x="${x - 18}" y="${y - 8}" width="36" height="16" rx="7"/>`).join('')}`],
  muscle: ['Otot kuat', 'otot, kuat, kekuatan, penguat otot, latihan beban', `${plate()}
<path class="a-b a-o" d="M28 150 L70 132 L78 188 L34 198 Z"/>
<path class="a-s a-o" d="M136 160 C128 136 126 112 130 92 L168 88 C172 112 174 136 178 158 Z"/>
<path class="a-s a-o" d="M68 136 C82 104 134 96 152 126 C158 138 168 146 174 156 C180 174 166 186 146 184 L78 182 Z"/>
<rect class="a-s a-o" x="122" y="46" width="56" height="50" rx="22"/><path class="a-l4" d="M134 66 C142 62 150 62 158 66 M134 80 C142 76 152 76 162 80"/>
<path class="a-l4" d="M96 120 C110 112 126 114 136 126"/>
<g class="lp-twinkle">${spark(58, 84, 0.8)}${spark(206, 72, 0.6)}</g>`],

  /* ---------- Benda sehari-hari ---------- */
  shoe: ['Sepatu', 'sepatu, alas kaki, berjalan, ukuran sepatu', `${plate()}
<path class="a-b a-o" d="M38 166 C38 132 50 108 66 100 L98 100 C104 120 124 128 150 132 C182 136 204 148 204 168 Z"/>
<path class="a-c a-o" d="M32 166 H208 C208 182 200 190 188 190 H44 C36 190 32 182 32 172 Z"/>
<path class="a-l4 a-lt" d="M104 116 L116 108 M116 124 L130 114 M130 130 L144 120"/>
<path class="a-l4" d="M66 100 C70 118 82 128 98 132"/>`],
  ball: ['Bola', 'bola, bermain, melempar, menangkap', `${plate()}
<ellipse class="a-shadow lp-shadow" cx="120" cy="212" rx="36" ry="7"/>
<g class="lp-jump"><circle class="a-s a-o" cx="120" cy="110" r="64"/><path class="a-b" d="M60 96 C92 84 148 84 180 96 C182 108 182 118 180 126 C148 114 92 114 60 126 C58 116 58 106 60 96 Z"/><circle class="a-l" cx="120" cy="110" r="64"/><path class="a-l4 a-lt" d="M86 64 C92 74 96 80 98 88"/></g>`],
  stairs: ['Tangga', 'tangga, naik turun, bertahap, langkah demi langkah', `${plate()}
<path class="a-b a-o" d="M36 214 V178 H82 V142 H128 V106 H174 V70 H206 V214 Z"/>
<path class="a-l a-lt" d="M82 178 H128 M128 142 H174 M174 106 H206"/>
<path class="a-arrow" d="M48 156 C70 116 110 88 156 62"/><path class="a-arrow" d="M140 56 L158 60 L152 78"/>`],
  playground: ['Taman bermain', 'taman, bermain di luar, perosotan, ayunan', `${plate()}${ground(210, 28, 212)}
<path class="a-l" d="M58 210 V70 M86 210 V70 M58 96 H86 M58 126 H86 M58 156 H86 M58 186 H86"/>
<path class="a-b a-o" d="M86 70 H106 C150 70 160 196 204 196 L204 210 C150 210 140 90 98 90 L86 90 Z"/>
<rect class="a-s a-o" x="48" y="56" width="48" height="16" rx="6"/>`],
  bike: ['Sepeda', 'sepeda, bersepeda, roda, keseimbangan', `${plate()}
<circle class="a-c a-o" cx="66" cy="160" r="38"/><circle class="a-c a-o" cx="176" cy="160" r="38"/>
<circle class="a-n" cx="66" cy="160" r="6"/><circle class="a-n" cx="176" cy="160" r="6"/>
<path class="a-frame" d="M66 160 L104 104 L152 104 L176 160 M104 104 L124 160 L152 104 M124 160 L66 160"/>
<path class="a-l" d="M152 104 L146 80 L166 76 M96 96 H116"/><circle class="a-s a-o4" cx="124" cy="160" r="9"/>`],
  water: ['Air minum', 'minum, air, cairan, haus, bekal', `${plate()}
<rect class="a-b a-o" x="100" y="28" width="40" height="22" rx="6"/>
<path class="a-c a-o" d="M92 54 H148 C160 54 166 66 166 78 V196 C166 206 158 212 148 212 H92 C82 212 74 206 74 196 V78 C74 66 80 54 92 54 Z"/>
<path class="a-lb" d="M77 112 C100 104 140 120 163 112 V196 C163 204 156 209 148 209 H92 C84 209 77 204 77 196 Z"/>
<path class="a-c a-o4 lp-drip" d="M196 92 C206 106 208 114 208 120 C208 128 202 134 196 134 C190 134 184 128 184 120 C184 114 186 106 196 92 Z"/>`],
  food: ['Makanan sehat', 'makan, gizi, bekal, sarapan, buah, energi', `${plate()}
<path class="a-c a-o" d="M40 136 H200 C200 176 166 204 120 204 C74 204 40 176 40 136 Z"/>
<circle class="a-s a-o" cx="94" cy="118" r="26"/><path class="a-l4" d="M94 92 C96 84 102 80 108 80"/><path class="a-b a-o4" d="M100 88 C110 76 122 78 124 86 C114 92 106 92 100 88 Z"/>
<circle class="a-lb a-o" cx="146" cy="120" r="22"/><circle class="a-ls a-o" cx="128" cy="134" r="14"/><circle class="a-b a-o" cx="168" cy="136" r="12"/>`],
  book: ['Buku', 'membaca, belajar, sekolah, buku cerita', `${plate()}
<path class="a-b a-o" d="M28 82 C60 70 94 74 120 92 C146 74 180 70 212 82 V190 C180 178 146 182 120 200 C94 182 60 178 28 190 Z"/>
<path class="a-c a-o" d="M40 84 C66 78 96 82 118 98 V188 C96 172 66 170 40 176 Z"/>
<path class="a-c a-o" d="M200 84 C174 78 144 82 122 98 V188 C144 172 174 170 200 176 Z"/>
<path class="a-l4 a-mute" d="M56 106 C72 102 88 104 102 112 M56 128 C72 124 88 126 102 134 M138 112 C152 104 168 102 184 106 M138 134 C152 126 168 124 184 128"/>
<path class="a-s a-o4" d="M150 76 V122 L160 114 L170 122 V74 Z"/>`],
  backpack: ['Tas sekolah', 'sekolah, tas, beban, bahu, membawa', `${plate()}
<path class="a-l" d="M96 64 C96 40 144 40 144 64"/>
<rect class="a-b a-o" x="64" y="58" width="112" height="146" rx="34"/>
<rect class="a-s a-o" x="84" y="134" width="72" height="50" rx="14"/><path class="a-l4" d="M84 152 H156"/>
<path class="a-l4 a-lt" d="M92 80 C102 74 138 74 148 80"/>`],
  phone: ['Ponsel dan pesan', 'pesan, DM, kirim, tanya, hubungi, chat', `${plate()}
<rect class="a-n" x="72" y="34" width="96" height="176" rx="18"/><rect class="a-c" x="81" y="50" width="78" height="144" rx="8"/>
<path class="a-b a-o4" d="M90 66 H140 C146 66 150 70 150 76 V92 C150 98 146 102 140 102 H104 L94 110 V102 C90 100 88 96 88 92 V76 C88 70 90 66 90 66 Z"/>
<path class="a-s a-o4" d="M150 120 H100 C94 120 90 124 90 130 V146 C90 152 94 156 100 156 H136 L146 164 V156 C150 154 152 150 152 146 V130 C152 124 150 120 150 120 Z"/>
<g class="lp-type"><circle class="a-n" cx="106" cy="138" r="3.5"/><circle class="a-n" cx="120" cy="138" r="3.5"/><circle class="a-n" cx="134" cy="138" r="3.5"/></g>`],
  home: ['Rumah', 'di rumah, rumah, keluarga, latihan di rumah', `${plate()}
<path class="a-c a-o" d="M56 112 V200 H184 V112"/>
<path class="a-b a-o" d="M38 120 L120 48 L202 120 Z"/>
<rect class="a-s a-o" x="102" y="146" width="36" height="54" rx="6"/>
<rect class="a-lb a-o4" x="68" y="132" width="26" height="26" rx="4"/><rect class="a-lb a-o4" x="146" y="132" width="26" height="26" rx="4"/>
${ground(200, 30, 210)}`],

  /* ---------- Gagasan ---------- */
  idea: ['Ide', 'ide, tips, cara, solusi, coba ini', `${plate()}
<g class="lp-glow">${ticks(120, 96, 76, 92, 8, 'a-ray')}</g>
<path class="a-s a-o" d="M120 40 C152 40 172 64 172 92 C172 116 154 126 148 146 H92 C86 126 68 116 68 92 C68 64 88 40 120 40 Z"/>
<rect class="a-c a-o" x="92" y="146" width="56" height="20" rx="6"/><rect class="a-c a-o" x="98" y="166" width="44" height="18" rx="6"/>
<path class="a-l4" d="M106 112 L114 126 L120 112 L126 126 L134 112"/>`],
  question: ['Pertanyaan', 'tanya, pertanyaan, bingung, kenapa, apakah', `${plate()}
<path class="a-b a-o" d="M48 52 H192 C202 52 208 58 208 68 V146 C208 156 202 162 192 162 H112 L80 192 V162 H48 C38 162 32 156 32 146 V68 C32 58 38 52 48 52 Z"/>
<path class="a-q" d="M100 92 C100 74 140 74 140 94 C140 110 120 110 120 128"/><circle class="a-c" cx="120" cy="146" r="7"/>`],
  checklist: ['Daftar periksa', 'daftar, catat, tanda, cek, periksa', `${plate()}
<rect class="a-c a-o" x="52" y="40" width="136" height="174" rx="14"/>
<rect class="a-b a-o" x="88" y="28" width="64" height="26" rx="8"/>
${[82, 124, 166].map((y, k) => `<rect class="${k === 2 ? 'a-c' : 'a-ls'} a-o4" x="70" y="${y}" width="26" height="26" rx="6"/><path class="a-l4 a-mute" d="M108 ${y + 13} H168"/>`).join('')}
<path class="a-chk ad-draw" pathLength="1" d="M74 95 L82 103 L98 85"/><path class="a-chk ad-draw" pathLength="1" d="M74 137 L82 145 L98 127"/>`],
  observe: ['Mengamati', 'amati, perhatikan, catat pola, lihat, cari tahu', `${plate()}
<g class="lp-sway" style="transform-origin: 104px 104px"><circle class="a-lb a-o" cx="104" cy="104" r="54"/><path class="a-l4 a-lt" d="M78 84 C86 72 98 68 110 68"/>
<path class="a-handle" d="M144 144 L194 194"/></g>
<path class="a-l4 a-mute" d="M52 210 H86 M98 210 H118"/>`],
  checkup: ['Pemeriksaan', 'periksa, fisioterapis, dokter, konsultasi, kapan diperiksa', `${plate()}
<path class="a-tube" d="M72 40 V96 C72 132 104 150 120 150 C136 150 168 132 168 96 V40"/>
<circle class="a-n" cx="72" cy="38" r="7"/><circle class="a-n" cx="168" cy="38" r="7"/>
<path class="a-tube" d="M120 150 V176 C120 196 144 204 160 192"/>
<circle class="a-s a-o lp-pulse" style="transform-origin: 170px 180px" cx="170" cy="180" r="24"/><circle class="a-c a-o4" cx="170" cy="180" r="10"/>`],
  target: ['Target', 'tujuan, sasaran, fokus, berhasil, tepat', `${plate()}
<circle class="a-c a-o" cx="112" cy="132" r="78"/><circle class="a-lb a-o" cx="112" cy="132" r="54"/><circle class="a-c a-o" cx="112" cy="132" r="30"/><circle class="a-s a-o" cx="112" cy="132" r="12"/>
<g class="lp-hit"><path class="a-handle" d="M114 130 L196 50"/><path class="a-b a-o4" d="M182 48 L206 26 L210 44 L194 58 Z"/></g>`],
  grow: ['Tumbuh', 'tumbuh, berkembang, perkembangan, bertahap, sabar', `${plate()}
<path class="a-s a-o" d="M78 156 H162 L152 210 H88 Z"/><rect class="a-s a-o" x="70" y="146" width="100" height="18" rx="6"/>
<g class="lp-grow" style="transform-origin: 120px 148px"><path class="a-l" d="M120 146 V70"/>
<path class="a-b a-o" d="M120 104 C96 104 76 90 72 66 C98 64 118 80 120 104 Z"/><path class="a-lb a-o" d="M120 86 C126 62 146 48 172 50 C170 76 148 90 120 86 Z"/></g>`],
  trophy: ['Berhasil', 'berhasil, bisa, bangga, pencapaian, kemajuan', `${plate()}
<path class="a-l" d="M76 64 C44 64 44 112 84 116 M164 64 C196 64 196 112 156 116"/>
<path class="a-s a-o" d="M70 46 H170 V88 C170 124 148 144 120 144 C92 144 70 124 70 88 Z"/>
<path class="a-l4" d="M120 144 V170"/><rect class="a-b a-o" x="84" y="170" width="72" height="34" rx="8"/>
<g class="lp-twinkle">${spark(120, 92, 0.9)}</g>`],
  warning: ['Peringatan', 'bahaya, tanda bahaya, waspada, segera, perhatian', `${plate()}
<g class="lp-pulse" style="transform-origin: 120px 132px"><path class="a-s a-o" d="M108 50 C113 41 127 41 132 50 L204 182 C209 192 202 202 191 202 H49 C38 202 31 192 36 182 Z"/></g>
<path class="a-qd" d="M120 96 V146"/><circle class="a-n" cx="120" cy="172" r="8"/>`],
  chart: ['Grafik naik', 'angka, data, persen, meningkat, statistik, hasil', `${plate()}
<path class="a-l" d="M44 52 V204 H208"/>
<rect class="a-lb a-o4" x="62" y="150" width="30" height="54" rx="5"/><rect class="a-b a-o4" x="104" y="118" width="30" height="86" rx="5"/><rect class="a-s a-o4" x="146" y="80" width="30" height="124" rx="5"/>
<path class="a-arrow ad-draw" pathLength="1" d="M58 128 L100 96 L130 108 L184 56"/><path class="a-arrow" d="M166 54 L186 54 L186 74"/>`],
  talk: ['Bicara', 'kalimat, bicara, mengobrol, komunikasi, menegur, berkata', `${plate()}
<path class="a-b a-o" d="M38 54 H140 C150 54 156 60 156 70 V118 C156 128 150 134 140 134 H82 L58 154 V134 H38 C28 134 22 128 22 118 V70 C22 60 28 54 38 54 Z"/>
<path class="a-c a-l4" d="M44 82 H134 M44 104 H110"/>
<path class="a-s a-o" d="M200 108 H110 C100 108 94 114 94 124 V170 C94 180 100 186 110 186 H168 L192 206 V186 H200 C210 186 216 180 216 170 V124 C216 114 210 108 200 108 Z"/>
<g class="lp-type"><circle class="a-n" cx="132" cy="148" r="5"/><circle class="a-n" cx="155" cy="148" r="5"/><circle class="a-n" cx="178" cy="148" r="5"/></g>`],
  save: ['Simpan', 'simpan, nanti, tandai, baca lagi', `${plate()}
<path class="a-b a-o" d="M70 34 H170 C176 34 180 38 180 44 V210 L120 172 L60 210 V44 C60 38 64 34 70 34 Z"/>
<g class="lp-twinkle">${spark(120, 100, 1.4)}</g>`],
  send: ['Kirim', 'kirim, bagikan, teman, grup', `${plate()}
<path class="a-l a-mute a-dash" d="M30 196 C60 186 70 166 90 150"/>
<g class="lp-glide"><path class="a-c a-o" d="M208 36 L42 104 L102 128 Z"/><path class="a-b a-o" d="M208 36 L102 128 L126 196 Z"/><path class="a-lb a-o" d="M102 128 L112 172 L126 150"/></g>`],
};

export const ART = Object.fromEntries(Object.entries(DEF).map(([k, [label, words, svg]]) => [k, { label, words, svg, loops: /\blp-/.test(svg) }]));
export const ART_NAMES = Object.keys(ART);

/** One illustration, ready to sit in a slide. `cls` sets its size and place. */
export const artSvg = (name, cls = '', attrs = '') => {
  const a = ART[name];
  return a ? `<div class="ill ${cls}" role="img" aria-label="${a.label}"${attrs}><svg viewBox="0 0 240 240" aria-hidden="true">${a.svg}</svg></div>` : '';
};
