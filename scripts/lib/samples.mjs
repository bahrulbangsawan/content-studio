// Example content for the component catalog (catalog.mjs) and the browser audit. One sample per component,
// plus VARIANT_SAMPLES where a variant reads better with its own words (every cover variant is a different
// hook). sampleOf() merges them and drops fields the variant does not draw. Every sample passes the scan.
import { COMPONENTS } from './components.mjs';

const CTA = { icon: 'send', text: 'Kirim pertanyaanmu lewat DM' };

export const SAMPLES = {
  cover: { art: 'jump', kicker: 'Gerak anak, pelan-pelan dikenali', title: 'Jatuh bukan selalu karena ceroboh.' },
  hero: { art: 'balance', title: 'Jatuh bukan selalu karena ceroboh.', sub: 'Kenali tanda yang perlu dicatat dan kapan perlu bertanya.', motif: { left: 'Jatuh', sign: '≠', right: 'Ceroboh' } },
  hook: { art: 'question', title: 'Kenapa anakku sering tersandung?', sub: 'Jawabannya jarang sesederhana ceroboh. Kita urai pelan-pelan.' },
  /* WHO 2020: rata-rata 60 menit aktivitas sedang sampai berat per hari untuk usia 5 sampai 17 tahun */
  stat: { art: 'clock', value: '60', title: 'Menit gerak aktif anak setiap hari.', sub: 'Saran WHO untuk usia 5 sampai 17 tahun.' },

  statement: { art: 'brain', title: 'Koordinasi tumbuh lewat bermain.', body: 'Setiap kali anak memanjat, melempar, atau melompat, otak dan otot belajar bekerja bersama. Latihan terbaik untuk usia ini adalah bermain yang aktif dan aman.' },
  steps: { title: 'Satu bagian tertinggal, semua ikut bergeser.', steps: ['Satu bagian tertinggal', 'Tubuh cari jalan lain', 'Gerak jadi boros', 'Cepat lelah'] },
  venn: {
    title: 'Dua gerak, satu tim.',
    left: { label: 'Kasar', sub: 'lari, lompat', icon: 'run' },
    right: { label: 'Halus', sub: 'genggam, tulis', icon: 'pencil' },
    overlap: 'Koordinasi', note: 'Keduanya bekerja bersama, misalnya saat menangkap bola.',
  },
  list: { art: 'checklist', title: 'Lima tanda yang layak dicatat.', items: ['Lebih sering jatuh dari teman sebaya', 'Cepat lelah saat bermain', 'Sulit naik turun tangga', 'Canggung memegang sendok atau pensil', 'Menghindari main lari dan lompat'], note: 'Tanda ini bukan diagnosis. Catat bila terlihat berulang.' },
  tiles: { title: 'Coba hari ini.', tiles: [{ icon: 'trees', title: 'Main di luar', text: 'Merangkak, memanjat, bergelantung.' }, { icon: 'ball-basketball', title: 'Lempar bola', text: 'Mata dan tangan jadi kompak.' }, { icon: 'notebook', title: 'Catat apa yang kamu lihat', text: 'Kapan, di mana, dan seperti apa.' }] },

  pairs: { art: 'talk', title: 'Kalimat yang lebih membantu.', heads: { left: 'Biasanya', right: 'Coba' }, rows: [{ left: '“Jangan lari.”', right: '“Jalan pelan di dekat tangga.”' }, { left: '“Awas jatuh.”', right: '“Pegang pegangan tangganya.”' }, { left: '“Jangan naik.”', right: '“Naik pelan, kaki dulu.”' }], note: 'Anak belajar dari apa yang boleh dilakukan.' },
  quotes: { art: 'talk', title: 'Kalimat saat anak frustrasi.', lead: 'Coba ucapkan dengan pelan:', quotes: ['“Susah, ya. Kita coba sekali lagi.”', '“Pelan-pelan saja, aku tunggu.”', '“Mau dibantu atau coba sendiri?”'], note: 'Nada tenang membantu anak mencoba lagi.' },
  split: { art: 'heart', title: 'Pisahkan dua hal ini.', left: 'Rasa takutnya', joiner: 'dari', right: 'gerak yang perlu dilatih', example: '“Wajar kalau takut. Kita coba satu anak tangga dulu.”' },
  ladder: { art: 'stairs', title: 'Dari mudah ke menantang.', items: [{ tag: 'Mulai', text: 'Berdiri dengan dua kaki rapat.' }, { tag: 'Lalu', text: 'Berdiri di atas bantal.' }, { tag: 'Tantangan', text: 'Berdiri satu kaki sebentar.' }], note: 'Naik tingkat saat anak sudah stabil.' },
  versus: { art: 'talk', title: 'Dua kalimat, pesan berbeda.', left: { text: '“Pegang pegangannya.”', caption: 'Memberi anak langkah yang jelas.' }, right: { text: '“Hati-hati, ya.”', caption: 'Tidak menjelaskan harus berbuat apa.' }, joiner: 'dibanding' },
  formula: { art: 'stopwatch', title: 'Rumus latihan singkat.', terms: ['Pemanasan', 'Gerak inti', 'Penutup'], example: 'Lima menit jalan santai, sepuluh menit main lompat, lalu lima menit peregangan ringan.', tags: ['Singkat.', 'Rutin.', 'Menyenangkan.'] },
  reframe: { art: 'idea', title: 'Yang ingin kita dengar.', lead: 'Setelah jatuh, harapannya anak bilang:', quote: '“Aku coba lagi pelan-pelan.”', joiner: 'bukan', counter: '“Aku memang tidak bisa.”' },
  swap: { art: 'talk', title: 'Ganti larangan dengan arahan.', from: '“Jangan lari, nanti jatuh.”', to: ['“Coba pelan, lihat kakimu.”', '“Pegang pegangan tangganya.”', '“Kalau lelah, istirahat dulu.”'], note: 'Arahan memberi anak sesuatu untuk dilakukan.' },
  bignumber: { art: 'clock', value: '60', title: 'Menit bergerak aktif setiap hari.', text: 'Rekomendasi umum WHO untuk anak usia 5 sampai 17 tahun, boleh dicicil sepanjang hari.' },
  pullquote: { art: 'family', quote: 'Anak tidak perlu sempurna saat bergerak. Ia perlu kesempatan mencoba, jatuh sedikit, lalu mencoba lagi dengan aman.', by: 'Tim fisioterapi anak' },
  myth: { art: 'question', title: 'Anggapan yang sering keliru.', wrong: { label: 'Anggapan', text: 'Anak yang sering jatuh berarti memang ceroboh dan nanti juga hilang sendiri.' }, right: { label: 'Faktanya', text: 'Jatuh berulang bisa terkait keseimbangan atau kekuatan otot. Catat polanya bila sering.' } },
  dodont: { art: 'climb', title: 'Saat anak belajar naik tangga.', do: { label: 'Lakukan', items: ['Jaga dari satu anak tangga', 'Biarkan ia memegang pegangan', 'Puji usahanya'] }, dont: { label: 'Hindari', items: ['Menariknya agar lebih cepat', 'Menggendong setiap kali ragu', 'Membandingkan dengan kakaknya'] } },
  timeline: { title: 'Perkembangan berjalan secara umum.', points: [{ when: '9-12 bulan', text: 'Berdiri berpegangan, merambat di sofa.' }, { when: '12-15 bulan', text: 'Langkah pertama tanpa dipegang.' }, { when: '2 tahun', text: 'Berlari pendek dan menendang bola.' }] },
  grid: { title: 'Empat hal yang melatih keseimbangan.', cells: [{ icon: 'walk', text: 'Berjalan di garis lurus' }, { icon: 'stairs', text: 'Naik turun tangga pelan' }, { icon: 'ball-football', text: 'Menendang bola diam' }, { icon: 'yoga', text: 'Berdiri satu kaki sebentar' }] },
  iconrow: { title: 'Tiga kebiasaan kecil hari ini.', items: [{ icon: 'trees', label: 'Main di luar' }, { icon: 'bike', label: 'Bersepeda santai' }, { icon: 'moon', label: 'Tidur cukup' }], note: 'Kebiasaan kecil yang konsisten lebih berarti daripada latihan berat sesekali.' },
  spectrum: { title: 'Belajar berjalan itu bertahap.', ends: { left: 'Baru mencoba', right: 'Lancar' }, points: ['Masih dipegangi', 'Berjalan sambil goyah', 'Berlari dan berhenti'], note: 'Setiap anak punya kecepatannya sendiri.' },
  callout: { art: 'family', title: 'Satu hal yang paling penting.', text: 'Latihan terbaik untuk anak adalah bermain. Lima belas menit bermain aktif bersama orang tua sering lebih berarti daripada satu jam latihan yang dipaksakan.', highlight: 'bermain aktif bersama' },
  qa: { art: 'shoe', title: 'Perlukah anak memakai sepatu saat belajar berjalan?', answer: 'Di dalam rumah, telanjang kaki membantu anak merasakan lantai dan melatih otot kaki. Di luar, pilih sepatu yang ringan, lentur, dan tidak licin.' },
  cycle: { title: 'Kebiasaan yang saling menguatkan.', items: ['Tidur cukup', 'Gerak aktif', 'Makan bergizi'], center: 'Tumbuh sehat' },
  pyramid: { title: 'Urutan prioritas gerak harian.', levels: ['Olahraga terstruktur', 'Bermain aktif di luar', 'Bergerak sepanjang hari'], note: 'Dasar yang luas paling banyak porsinya.' },
  matrix: { title: 'Kapan perlu konsultasi?', axes: { x: 'Makin sering', y: 'Makin berat' }, cells: ['Catat dan tanyakan', 'Segera konsultasikan', 'Pantau saja di rumah', 'Catat polanya'] },
  numbered: { art: 'balance', title: 'Cara melatih keseimbangan di rumah.', items: ['Berjalan di atas garis selotip di lantai', 'Berdiri satu kaki sambil menghitung lima', 'Melangkah di atas bantal yang disusun'] },
  tip: { art: 'home', title: 'Sebelum mulai latihan apa pun.', label: 'Tips aman', icon: 'shield-check', text: 'Pastikan area bermain lapang dan lantainya tidak licin. Dampingi anak dari dekat, dan berhenti saat ia terlihat lelah atau kesakitan.' },
  definition: { art: 'brain', title: 'Propriosepsi', kind: 'kata benda', meaning: 'Kemampuan tubuh merasakan posisi dan gerak bagiannya sendiri tanpa harus melihat.', example: 'Anak bisa menyentuh hidung dengan mata tertutup.' },

  closing: { art: 'phone', title: 'Tanya kapan saja.', lede: 'Tidak perlu menunggu anak sakit.', cta: CTA },
  outro: { art: 'target', title: 'Mulai dari satu latihan.', lede: 'Pilih satu, coba minggu ini.', cta: CTA },
  recap: { art: 'checklist', title: 'Yang perlu diingat.', points: ['Jatuh sesekali itu wajar', 'Catat bila terlihat berulang', 'Tanya fisioterapis bila ragu'], cta: CTA },

  /* Batch keempat. Photos and the video are the illustrated samples in assets/media. */
  photo: { media: { src: 'contoh-seimbang.jpg', alt: 'Anak berjalan di atas balok kayu di taman dengan tangan terbuka' }, title: 'Keseimbangan dilatih lewat bermain.', kicker: 'Lima permainan di taman dekat rumah' },
  teaser: { art: 'checklist', title: 'Anak sering jatuh saat berlari?', items: ['Kapan jatuh masih wajar', 'Tanda yang layak dicatat', 'Tiga latihan di rumah', 'Kapan perlu ke fisioterapis'], kicker: 'Simpan untuk dibaca lagi' },
  contrast: { art: 'muscle', before: 'Bukan sekadar malas.', title: 'Ototnya cepat lelah.', kicker: 'Saat anak menolak berjalan jauh' },
  figure: { title: 'Perhatikan posisi lututnya.', media: { src: 'contoh-satu-kaki.jpg', alt: 'Anak berdiri satu kaki di atas matras dengan tangan di atas kepala' }, caption: 'Lutut kaki tumpu sedikit ditekuk, pandangan lurus ke depan, tahan lima hitungan.' },
  photopair: { title: 'Posisi duduk saat menulis.', left: { media: { src: 'contoh-duduk-bungkuk.jpg', alt: 'Anak duduk membungkuk saat menulis, kaki menggantung' }, label: 'Kurang tepat' }, right: { media: { src: 'contoh-duduk-tegak.jpg', alt: 'Anak duduk tegak saat menulis, kaki menapak di pijakan' }, label: 'Lebih nyaman' }, marks: true, note: 'Pijakan kecil membuat kaki menapak dan punggung lebih tegak.' },
  pins: { title: 'Tiga hal yang dilatih di balok.', media: { src: 'contoh-seimbang.jpg', alt: 'Anak berjalan di atas balok kayu di taman dengan tangan terbuka' }, pins: [{ x: 50, y: 34, text: 'Pandangan lurus ke depan' }, { x: 35, y: 50, text: 'Tangan terbuka menjaga seimbang' }, { x: 50, y: 78, text: 'Telapak kaki menapak penuh' }] },
  gallery: { title: 'Tiga cara melatih keseimbangan.', items: [{ media: { src: 'contoh-seimbang.jpg', alt: 'Anak berjalan di atas balok kayu' }, label: 'Jalan di balok' }, { media: { src: 'contoh-satu-kaki.jpg', alt: 'Anak berdiri satu kaki' }, label: 'Berdiri satu kaki' }, { media: { src: 'contoh-latihan.mp4', alt: 'Anak menjaga keseimbangan di atas balok kayu' }, label: 'Tangan terbuka' }], note: 'Mulai dari yang paling mudah untuk anakmu.' },
  exercise: { art: 'balance', title: 'Berdiri satu kaki.', media: { src: 'contoh-latihan.mp4', alt: 'Anak menjaga keseimbangan di atas balok kayu' }, dose: [{ value: '3', label: 'set' }, { value: '10 dtk', label: 'tiap kaki' }, { value: '1x', label: 'sehari' }], cues: ['Berdiri dekat dinding untuk pegangan', 'Angkat satu kaki, pandangan ke depan', 'Ganti kaki, ulangi pelan-pelan'] },
  testimonial: { art: 'family', quote: 'Dulu anak kami selalu menolak naik tangga. Setelah latihan kecil setiap sore, sekarang ia naik sendiri sambil berpegangan.', person: { name: 'Ibu Rina', role: 'Orang tua Dafa, 5 tahun' } },
  quiz: { art: 'question', title: 'Mana yang paling membantu keseimbangan?', options: ['Duduk lama menonton video', 'Bermain lompat di taman', 'Tidur siang lebih lama'], note: 'Tebak dulu, jawabannya di slide berikutnya.' },
  bars: { title: 'Gerak aktif anak per hari.', bars: [{ label: 'Saran WHO', value: '60' }, { label: 'Hari sekolah', value: '35' }, { label: 'Akhir pekan', value: '50' }], note: 'Dalam menit. Contoh catatan satu keluarga selama seminggu.' },
  week: { title: 'Latihan penguat otot seminggu.', days: [{ day: 'Sen', on: true }, { day: 'Sel', on: false }, { day: 'Rab', on: true }, { day: 'Kam', on: false }, { day: 'Jum', on: true }, { day: 'Sab', on: false }, { day: 'Min', on: false }], note: 'Saran WHO: minimal tiga hari seminggu, dengan jeda untuk istirahat.' },
  flags: { title: 'Kapan perlu segera diperiksa?', items: ['Jatuh lalu tidak mau menapak', 'Bengkak yang makin besar', 'Kemampuan yang tadinya bisa, hilang', 'Nyeri yang membangunkan dari tidur'], action: { icon: 'stethoscope', text: 'Ada satu tanda ini? Periksakan ke dokter atau fisioterapis.' } },
  faq: { art: 'question', title: 'Pertanyaan yang sering masuk.', items: [{ q: 'Perlukah sepatu khusus?', a: 'Tidak selalu. Pilih yang ringan, lentur, dan tidak licin.' }, { q: 'Berapa lama latihan sehari?', a: 'Sepuluh sampai lima belas menit sudah cukup bila rutin.' }, { q: 'Bolehkah saat anak lelah?', a: 'Lebih baik istirahat dulu, lalu coba lagi esok hari.' }] },
  script: { art: 'talk', title: 'Kalimat saat anak frustrasi.', parts: [{ text: 'Kamu kesal karena', slot: 'kejadian' }, { text: '. Kita coba', slot: 'langkah kecil' }], end: 'bersama, ya.', example: '“Kamu kesal karena menaranya jatuh. Kita coba susun dua balok dulu bersama, ya.”' },
  acronym: { art: 'run', title: 'Ingat kata AKTIF.', letters: [{ letter: 'A', text: 'Ajak bermain di luar' }, { letter: 'K', text: 'Kurangi duduk terlalu lama' }, { letter: 'T', text: 'Tambah sedikit demi sedikit' }, { letter: 'I', text: 'Istirahat saat lelah' }, { letter: 'F', text: 'Fokus pada rasa senang' }] },
  gauge: { title: 'Seberapa sering jatuhnya?', levels: ['Sesekali', 'Mingguan', 'Hampir harian'], at: '2', note: 'Jatuh beberapa kali seminggu layak dicatat: kapan, di mana, dan saat melakukan apa.' },

  prompt: { art: 'talk', title: 'Anakmu paling suka main apa?', cta: { icon: 'message-circle', text: 'Ceritakan di kolom komentar' } },
  action: { art: 'save', title: 'Simpan untuk nanti.', lede: 'Supaya mudah dicari saat dibutuhkan.', points: ['Daftar tanda yang perlu dicatat', 'Tiga latihan singkat di rumah'], cta: { icon: 'send', text: 'Kirim ke pasanganmu juga' } },
  profile: { art: 'checkup', title: 'Ada pertanyaan?', person: { name: 'Tim Part of Physio', role: 'Fisioterapis anak' }, media: { src: 'contoh-terapis.jpg', alt: 'Fisioterapis tersenyum memakai seragam klinik' }, lede: 'Kami membaca setiap pesan yang masuk.', cta: CTA },
};

/* Words for one variant, over the component's sample */
export const VARIANT_SAMPLES = {
  cover: {
    bottom: { art: 'run', title: 'Anak sering jatuh saat berlari?', kicker: 'Yang wajar dan yang perlu dicek' },
    poster: { art: 'jump', title: 'Tidak semua jatuh perlu dicemaskan.', kicker: 'Kenali bedanya sejak awal' },
    highlight: { art: 'feet', title: 'Jalan jinjit belum tentu masalah.', focus: 'belum tentu', kicker: 'Kapan perlu dicek, kapan cukup diamati' },
    strike: { art: 'feet', title: 'Jinjit itu cuma kebiasaan.', focus: 'cuma kebiasaan', kicker: 'Kadang ada sebab yang perlu dicek' },
    circle: { art: 'stairs', title: 'Satu tanda yang sering terlewat.', focus: 'terlewat', kicker: 'Saat anak naik tangga' },
    fade: { art: 'feet', title: 'Sering jatuh? Coba lihat kakinya.', focus: 'lihat kakinya', kicker: 'Tanda kecil yang mudah terlewat' },
    card: { art: 'checkup', title: 'Kapan anak perlu ke fisioterapis?', kicker: 'Empat tanda yang layak dicatat' },
    tags: { art: 'observe', title: 'Anakmu sering seperti ini?', tags: ['Mudah tersandung', 'Jalan jinjit', 'Cepat lelah'], kicker: 'Kenali tandanya lebih awal' },
    blank: { art: 'question', title: 'Anak sering jatuh karena', kicker: 'Jawabannya jarang soal ceroboh.' },
    quote: { art: 'talk', title: 'Nanti juga bisa sendiri.', kicker: 'Kalimat yang sering kita dengar' },
  },
  hook: {
    chat: { art: 'phone', title: 'Kak, anakku kok sering tersandung?', sub: 'Pertanyaan ini sering masuk. Kita bahas pelan-pelan.' },
    options: { art: 'shoe', title: 'Mana yang lebih baik untuk anak?', options: ['Sepatu keras', 'Telanjang kaki'], sub: 'Jawabannya tergantung tempatnya.' },
    quiz: { art: 'question', title: 'Kenapa anak sering tersandung?', choices: ['Memang ceroboh', 'Kurang tidur', 'Otot kakinya cepat lelah'], sub: 'Tebak dulu. Jawabannya di slide 5.' },
    scale: { title: 'Seberapa sering anakmu jatuh?', ends: { left: 'Jarang', right: 'Setiap hari' }, sub: 'Ingat jawabanmu sambil menggeser.' },
  },
  stat: {
    /* WHO: 81% remaja usia 11 sampai 17 tahun kurang aktif secara fisik (data 2016) */
    ring: { value: '81%', title: 'Remaja yang kurang bergerak.', sub: 'Data WHO 2016, usia 11 sampai 17 tahun.' },
    bar: { art: 'chart', value: '81%', title: 'Remaja yang kurang bergerak.', sub: 'Data WHO 2016, usia 11 sampai 17 tahun.' },
    /* WHO: about 4 in 5 adolescents (81%) do not meet the recommendation */
    dots: { value: '4/5', title: '4 dari 5 remaja kurang bergerak.', sub: 'Data WHO 2016, usia 11 sampai 17 tahun.' },
    /* WHO 2020: aktivitas yang menguatkan otot dan tulang minimal 3 hari seminggu */
    side: { value: '3', title: 'Hari seminggu untuk latihan penguat otot.', sub: 'Saran WHO untuk usia 5 sampai 17 tahun.' },
  },
  photo: {
    frame: { media: { src: 'contoh-satu-kaki.jpg', alt: 'Anak berdiri satu kaki di atas matras' }, title: 'Berdiri satu kaki, lima detik saja.', kicker: 'Latihan kecil sebelum tidur' },
    circle: { media: { src: 'contoh-satu-kaki.jpg', alt: 'Anak berdiri satu kaki di atas matras', focus: 'top' }, title: 'Lima detik yang melatih keseimbangan.', kicker: 'Coba malam ini' },
    card: { media: { src: 'contoh-latihan.mp4', alt: 'Anak menjaga keseimbangan di atas balok kayu' }, title: 'Goyah itu bagian dari belajar.', kicker: 'Yang perlu orang tua lakukan' },
  },
  teaser: {
    search: { art: 'observe', title: 'Anak jalan jinjit, normal?', suggest: ['Anak jalan jinjit umur 3 tahun', 'Jalan jinjit kapan perlu diperiksa'], kicker: 'Pertanyaan yang sering dicari orang tua' },
    icons: { title: 'Tiga permainan untuk keseimbangan.', icons: [{ icon: 'walk', label: 'Jalan di garis' }, { icon: 'yoga', label: 'Satu kaki' }, { icon: 'ball-football', label: 'Tendang bola' }], kicker: 'Cukup sepuluh menit sehari' },
  },
  contrast: {
    band: { art: 'feet', before: 'Dikira cuma manja.', title: 'Kakinya sedang lelah.', kicker: 'Saat anak minta digendong terus' },
    split: { art: 'run', before: 'Duduk diam itu baik.', title: 'Anak perlu bergerak.', kicker: 'Apalagi di hari sekolah' },
  },
  figure: {
    bleed: { title: 'Jalan di garis lurus.', media: { src: 'contoh-seimbang.jpg', alt: 'Anak berjalan di atas balok kayu di taman' }, caption: 'Mulai dari garis selotip di lantai, baru pindah ke balok rendah di taman.' },
    overlay: { title: 'Latihan dalam sepuluh detik.', media: { src: 'contoh-latihan.mp4', alt: 'Anak menjaga keseimbangan di atas balok kayu' }, caption: 'Tangan terbuka membantu tubuh menemukan titik seimbangnya.' },
  },
  photopair: { stack: { marks: false, left: { media: { src: 'contoh-duduk-bungkuk-lebar.jpg', alt: 'Anak duduk membungkuk saat menulis' }, label: 'Sebelum' }, right: { media: { src: 'contoh-duduk-tegak-lebar.jpg', alt: 'Anak duduk tegak saat menulis' }, label: 'Dengan pijakan' } } },
  pins: { side: { title: 'Cek tiga titik saat duduk.', media: { src: 'contoh-duduk-tegak.jpg', alt: 'Anak duduk tegak saat menulis, kaki menapak di pijakan' }, pins: [{ x: 28, y: 41, text: 'Kepala tegak' }, { x: 24, y: 55, text: 'Punggung bersandar' }, { x: 41, y: 74, text: 'Kaki menapak di pijakan' }] } },
  faq: { chat: { items: [{ q: 'Perlukah sepatu khusus?', a: 'Tidak selalu. Pilih yang ringan, lentur, dan tidak licin.' }, { q: 'Berapa lama latihan sehari?', a: 'Sepuluh sampai lima belas menit sudah cukup bila rutin.' }] } },
  quiz: { reveal: { art: 'trophy', answer: 'B', reason: 'Melompat dan berlari melatih otot kaki dan keseimbangan sekaligus, sambil tetap menyenangkan untuk anak.' } },
  testimonial: { photo: { quote: 'Sekarang ia naik tangga sendiri sambil berpegangan, dan bangga sekali setiap sampai di atas.', media: { src: 'contoh-satu-kaki.jpg', alt: 'Anak berdiri satu kaki di atas matras', focus: 'top' } } },
  prompt: {
    options: { art: 'question', title: 'Tim mana kamu?', options: ['Main di luar', 'Main di rumah'], cta: { icon: 'message-circle', text: 'Tulis A atau B di komentar' } },
    keyword: { art: 'phone', title: 'Mau daftar latihannya?', keyword: 'latih', cta: { icon: 'message-circle', text: 'Tulis kata ini, kami kirim lewat DM' } },
  },
  action: {
    share: { art: 'send', title: 'Kirim ke yang perlu.', lede: 'Mungkin ada orang tua yang sedang mencari jawaban ini.', cta: { icon: 'send', text: 'Kirim ke grup kelas anakmu' } },
    next: { art: 'calendar', title: 'Masih ada lanjutannya.', lede: 'Kita lanjutkan minggu depan.', next: { label: 'Bagian 2', topic: 'Latihan keseimbangan untuk usia sekolah' }, cta: { icon: 'bell', text: 'Ikuti supaya tidak terlewat' } },
  },
};

/** The sample one variant is shown with: the component's sample, its variant words, minus fields the variant does not draw. */
export function sampleOf(id, v) {
  const c = COMPONENTS[id];
  const out = { ...(c.custom ? c.sample : SAMPLES[id]), ...((c.custom ? c.samples : VARIANT_SAMPLES[id]) || {})[v] };
  const vv = v || (c.keys.variant && c.keys.variant.default);
  for (const [k, spec] of Object.entries(c.keys)) if (spec.for && !spec.for.includes(vv)) delete out[k];
  return out;
}

/* The slide used to show every motion preset side by side. */
export const MOTION_SAMPLE = 'quotes';
