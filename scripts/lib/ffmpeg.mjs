// ffmpeg and ffprobe for footage, audio extraction and transcoding. Optional: the studio itself never needs them.
import { spawnSync, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

function which(bin) {
  try { return execFileSync(process.platform === 'win32' ? 'where' : 'which', [bin], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split(/\r?\n/)[0].trim() || null; } catch (e) { return null; }
}
export const ffmpegPath = () => (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH) ? process.env.FFMPEG_PATH : which('ffmpeg'));
export const ffprobePath = () => (process.env.FFPROBE_PATH && existsSync(process.env.FFPROBE_PATH) ? process.env.FFPROBE_PATH : which('ffprobe'));

export function needFfmpeg(why) {
  const p = ffmpegPath();
  if (!p) {
    const e = new Error(`${why} butuh ffmpeg. Pasang: brew install ffmpeg (macOS), sudo apt install ffmpeg (Linux), atau winget install ffmpeg (Windows).`);
    e.code = 'NO_FFMPEG';
    throw e;
  }
  return p;
}

/** Run ffmpeg quietly; throws with its last lines on failure. */
export function ffmpeg(args, why = 'Pengolahan video') {
  const r = spawnSync(needFfmpeg(why), ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`ffmpeg gagal: ${(r.stderr || '').trim().split('\n').slice(-3).join(' ')}`);
}

/** { duration, width, height, video, audio } of a media file, or null without ffprobe. */
export function probe(file) {
  const p = ffprobePath();
  if (!p) return null;
  const r = spawnSync(p, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  try {
    const j = JSON.parse(r.stdout), v = j.streams.find(s => s.codec_type === 'video'), a = j.streams.find(s => s.codec_type === 'audio');
    const [n, d] = String((v && v.avg_frame_rate) || '0/1').split('/').map(Number);
    return { duration: Number(j.format.duration) || 0, width: v ? v.width : 0, height: v ? v.height : 0, video: v ? v.codec_name : null, audio: a ? a.codec_name : null, fps: d ? n / d : 0 };
  } catch (e) { return null; }
}
