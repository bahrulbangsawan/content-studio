// Speech services: voice-over (text to speech) and transcription (speech to text).
// TTS: Gemini 3.8 Flash TTS through the Interactions API (the text is read word for word; delivery goes in
//      speech_metadata.style; inline tags such as <short pause> stay in English), older Gemini TTS through
//      generateContent, or macOS `say` for a free local preview voice.
// STT: OpenAI (gpt-transcribe for text, whisper-1 when word times are needed) or Gemini 3.5 Transcribe.
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { request, ApiError } from './http.mjs';
import { wavFromPcm, readWav } from './audio.mjs';
import { get, need } from './config.mjs';
import { spoken } from './reel-time.mjs';

const GEM = 'https://generativelanguage.googleapis.com/v1beta';
const GEM_BASE = () => process.env.CONTENT_STUDIO_GEMINI_BASE || GEM;
const OAI_BASE = () => process.env.CONTENT_STUDIO_OPENAI_BASE || 'https://api.openai.com/v1';

/* The 30 prebuilt Gemini voices and their character (Gemini speech-generation docs) */
export const GEMINI_VOICES = [['Zephyr', 'cerah'], ['Puck', 'bersemangat'], ['Charon', 'informatif'], ['Kore', 'tegas'], ['Fenrir', 'antusias'], ['Leda', 'muda'], ['Orus', 'tegas'], ['Aoede', 'ringan'], ['Callirrhoe', 'santai'], ['Autonoe', 'cerah'], ['Enceladus', 'berdesah'], ['Iapetus', 'jernih'], ['Umbriel', 'santai'], ['Algieba', 'halus'], ['Despina', 'halus'], ['Erinome', 'jernih'], ['Algenib', 'serak'], ['Rasalgethi', 'informatif'], ['Laomedeia', 'bersemangat'], ['Achernar', 'lembut'], ['Alnilam', 'tegas'], ['Schedar', 'datar'], ['Gacrux', 'dewasa'], ['Pulcherrima', 'lugas'], ['Achird', 'ramah'], ['Zubenelgenubi', 'kasual'], ['Vindemiatrix', 'lembut'], ['Sadachbia', 'hidup'], ['Sadaltager', 'berpengetahuan'], ['Sulafat', 'hangat']];

/* Named voices for reels: a Gemini voice, a delivery and the model that made it, so a tone the owner likes
   stays the same from reel to reel. Used as voice.preset in reel.json or brand.json; fields set next to it win. */
export const VOICE_PRESETS = {
  semangat: {
    label: 'Bersemangat dan interaktif, seperti kreator yang ngobrol langsung ke penonton; istilah Inggris dengan lafal asli',
    voice: 'Laomedeia', model: 'gemini-3.8-flash-tts',
    style: 'Energetic, enthusiastic creator talking straight to the viewer; upbeat, conversational, brisk pace, lively intonation. Say English words and names with native English pronunciation.',
  },
  tenang: {
    label: 'Hangat dan tenang, tempo sedang, untuk topik yang serius',
    voice: 'Sulafat', model: 'gemini-3.8-flash-tts',
    style: 'Warm and calm, like a physiotherapist explaining to parents; moderate pace. Say English words and names with native English pronunciation.',
  },
};
export const DEFAULT_VOICE_PRESET = 'semangat';

/* ---------------- Text to speech ---------------- */
function toWav(b64, mime, rate) {
  const raw = Buffer.from(b64, 'base64');
  if (raw.toString('ascii', 0, 4) === 'RIFF') return readWav(raw) && raw;
  const r = Number((String(mime).match(/rate=(\d+)/) || [])[1]) || rate || 24000;
  return wavFromPcm(raw, r, 1);
}

/** Gemini TTS -> a 16-bit mono WAV buffer. */
export async function ttsGemini(text, { voice, style, model }) {
  const key = need('gemini.apiKey', 'Voice over Gemini');
  model = model || get('gemini.ttsModel');
  voice = voice || get('gemini.voice');
  const headers = { 'x-goog-api-key': key };
  if (/^gemini-(2\.|3\.0)/.test(model)) {
    /* Older TTS models: generateContent, style as a spoken-instruction prefix is avoided; the style goes first as a note */
    const body = { contents: [{ role: 'user', parts: [{ text: style ? `${style}: ${text}` : text }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } };
    const { data } = await request('Gemini TTS', `${GEM_BASE()}/models/${model}:generateContent`, { method: 'POST', headers, json: body });
    const part = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts.find(p => p.inlineData);
    if (!part) throw new ApiError('Gemini TTS', 200, 'jawaban tanpa audio. ' + JSON.stringify(data).slice(0, 200));
    return toWav(part.inlineData.data, part.inlineData.mimeType);
  }
  const body = {
    model, store: false,
    input: [{ type: 'user_input', content: [{ type: 'text', text, ...(style ? { annotations: [{ type: 'speech_metadata', style }] } : {}) }] }],
    response_format: { type: 'audio', mime_type: 'audio/wav', sample_rate: 24000 },
    generation_config: { speech_config: [{ voice }] },
  };
  const { data } = await request('Gemini TTS', `${GEM_BASE()}/interactions`, { method: 'POST', headers, json: body, timeout: 180000 });
  if (data && data.status && !['completed', 'COMPLETED'].includes(data.status)) throw new ApiError('Gemini TTS', 200, `status ${data.status}. ${JSON.stringify(data.error || '').slice(0, 200)}`);
  const audio = (data && data.steps || []).filter(s => s.type === 'model_output').flatMap(s => s.content || []).filter(c => c.type === 'audio' && c.data).pop();
  if (!audio) throw new ApiError('Gemini TTS', 200, 'jawaban tanpa audio. Periksa nama model dan suara.');
  return toWav(audio.data, audio.mime_type, audio.sample_rate);
}

/** macOS `say` -> WAV. A free preview voice (Damayanti speaks Indonesian); not for publishing. */
export function ttsSay(text, { voice = 'Damayanti', rate = 165 } = {}) {
  if (process.platform !== 'darwin') throw new Error('Suara "say" hanya ada di macOS. Pakai provider gemini.');
  const dir = mkdtempSync(join(tmpdir(), 'cs-say-')), out = join(dir, 'vo.wav');
  try {
    const r = spawnSync('say', ['-v', voice, '-r', String(rate), '--file-format=WAVE', '--data-format=LEI16@24000', '-o', out, spoken(text)], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`say gagal: ${(r.stderr || '').trim()} (lihat suara yang ada: say -v '?')`);
    const buf = readFileSync(out);
    readWav(buf);
    return buf;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

export async function tts(provider, text, opts = {}) {
  if (provider === 'say') return ttsSay(text, opts);
  if (provider === 'gemini') return ttsGemini(text, opts);
  throw new Error(`Penyedia suara "${provider}" tidak dikenal. Pilihan: gemini, say.`);
}

/* ---------------- Speech to text ---------------- */
const BCP = { id: 'id-ID', en: 'en-US', ms: 'ms-MY', jv: 'jv-ID' };

/** OpenAI transcription. `words` uses whisper-1 (the only model with word times). */
export async function sttOpenAI(buf, { filename = 'audio.mp3', mime = 'audio/mpeg', lang = 'id', words = false, model } = {}) {
  const key = need('openai.apiKey', 'Transkripsi OpenAI');
  model = words ? 'whisper-1' : model || get('openai.transcribeModel');
  const form = new FormData();
  form.append('file', new Blob([buf], { type: mime }), filename);
  form.append('model', model);
  if (words) {
    form.append('response_format', 'verbose_json');
    form.append('timestamp_granularities[]', 'word');
    form.append('timestamp_granularities[]', 'segment');
  } else form.append('response_format', 'json');
  if (lang) form.append(/^gpt-transcribe/.test(model) ? 'languages[]' : 'language', lang);
  const { data } = await request('OpenAI', `${OAI_BASE()}/audio/transcriptions`, { method: 'POST', headers: { authorization: `Bearer ${key}` }, form, timeout: 600000 });
  return {
    provider: 'openai', model, text: (data.text || '').trim(),
    words: (data.words || []).map(w => ({ word: w.word, start: +w.start, end: +w.end })),
    segments: (data.segments || []).map(s => ({ start: +s.start, end: +s.end, text: String(s.text || '').trim() })),
  };
}

async function geminiUpload(buf, mime, key) {
  const start = await fetch(`${GEM_BASE().replace('/v1beta', '')}/upload/v1beta/files`, {
    method: 'POST',
    headers: { 'x-goog-api-key': key, 'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'start', 'X-Goog-Upload-Header-Content-Length': String(buf.length), 'X-Goog-Upload-Header-Content-Type': mime, 'content-type': 'application/json' },
    body: JSON.stringify({ file: { display_name: 'content-studio-audio' } }),
  });
  const url = start.headers.get('x-goog-upload-url');
  if (!url) throw new ApiError('Gemini Files', start.status, 'unggahan tidak dimulai.');
  const up = await fetch(url, { method: 'POST', headers: { 'Content-Length': String(buf.length), 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize' }, body: buf });
  const j = await up.json();
  if (!j.file || !j.file.uri) throw new ApiError('Gemini Files', up.status, 'unggahan gagal.');
  for (let k = 0; k < 30 && j.file.state === 'PROCESSING'; k++) {
    await new Promise(r => setTimeout(r, 1000));
    const { data } = await request('Gemini Files', `${GEM_BASE()}/${j.file.name}`, { headers: { 'x-goog-api-key': key } });
    j.file = data;
  }
  return j.file;
}

/** Gemini 3.5 Transcribe. Word times come back as "1.250s" strings. */
export async function sttGemini(buf, { mime = 'audio/mpeg', lang = 'id', words = false, model } = {}) {
  const key = need('gemini.apiKey', 'Transkripsi Gemini');
  model = model || get('gemini.transcribeModel');
  const file = buf.length > 15 * 1024 * 1024 ? await geminiUpload(buf, mime, key) : null;
  const body = {
    model, store: false,
    input: [file ? { type: 'audio', uri: file.uri, mime_type: mime } : { type: 'audio', data: buf.toString('base64'), mime_type: mime }],
    generation_config: { transcription_config: { ...(lang ? { language_codes: [BCP[lang] || lang] } : {}), mode: words ? { type: 'verbatim', timestamp_granularities: ['word'] } : 'verbatim' } },
  };
  const { data } = await request('Gemini Transcribe', `${GEM_BASE()}/interactions`, { method: 'POST', headers: { 'x-goog-api-key': key }, json: body, timeout: 600000 });
  const items = (data && data.steps || []).filter(s => s.type === 'model_output').flatMap(s => s.content || []).filter(c => c.type === 'text');
  const sec = v => (typeof v === 'number' ? v : parseFloat(String(v || '0')));
  return {
    provider: 'gemini', model, text: items.map(c => c.text).join('\n').trim(),
    words: items.flatMap(c => c.annotations || []).filter(a => a.type === 'word_info').map(a => ({ word: a.text, start: sec(a.start_offset), end: sec(a.end_offset) })),
    segments: [],
  };
}

/** Pick a provider: the configured one, else OpenAI when its key exists, else Gemini. */
export function sttProvider(want) {
  const p = want || get('transcribe.provider');
  if (p && p !== 'auto') return p;
  if (get('openai.apiKey')) return 'openai';
  if (get('gemini.apiKey')) return 'gemini';
  return null;
}
export async function stt(buf, opts = {}) {
  const p = sttProvider(opts.provider);
  if (!p) { const e = new Error('Transkripsi butuh OpenAI atau Gemini API key. Simpan sekali dengan: content-studio setup'); e.code = 'NO_KEY'; throw e; }
  return p === 'gemini' ? sttGemini(buf, opts) : sttOpenAI(buf, opts);
}
