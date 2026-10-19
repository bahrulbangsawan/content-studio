// HTTP for the online services (Gemini, OpenAI, Magnific, Pexels, PubMed, Crossref): plain fetch (Node 18+),
// timeouts, polite retries on 429 and 5xx (honouring Retry-After), and errors that say which service failed.
import { createWriteStream, renameSync, rmSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export const UA = 'content-studio/1.1 (+https://github.com/bahrulbangsawan/content-studio)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

export class ApiError extends Error {
  constructor(service, status, message, body) { super(`${service}: ${message}`); this.service = service; this.status = status; this.body = body; }
}

/* A short, readable reason from an API's error body, without echoing anything secret back */
function reason(body) {
  if (!body) return '';
  if (typeof body === 'string') return body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240);
  const e = body.error || body;
  return String((e && (e.message || e.error_description || e.detail || e.error)) || body.message || JSON.stringify(body)).slice(0, 240);
}

/**
 * request(service, url, opts) -> { status, headers, data }. `opts.json` sends JSON; `opts.form` sends FormData;
 * `opts.expect` is 'json' (default), 'text' or 'buffer'. `opts.ok` lists extra statuses that are not errors
 * (e.g. 404 for "no results").
 */
export async function request(service, url, { method = 'GET', headers = {}, json, form, body, expect = 'json', timeout = 90000, retries = 3, ok = [] } = {}) {
  let attempt = 0;
  for (;;) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), timeout);
    let res;
    try {
      res = await fetch(url, {
        method, signal: ctl.signal,
        headers: { 'user-agent': UA, ...(json ? { 'content-type': 'application/json' } : {}), ...headers },
        body: json ? JSON.stringify(json) : form || body,
      });
    } catch (e) {
      clearTimeout(timer);
      if (attempt++ < retries) { await sleep(800 * 2 ** attempt); continue; }
      throw new ApiError(service, 0, e.name === 'AbortError' ? `tidak menjawab dalam ${Math.round(timeout / 1000)} detik.` : `tidak bisa dihubungi (${e.cause?.code || e.message}). Periksa koneksi internet.`);
    }
    clearTimeout(timer);
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      const ra = Number(res.headers.get('retry-after'));
      await sleep(Number.isFinite(ra) && ra > 0 ? Math.min(ra, 30) * 1000 : 1200 * 2 ** attempt);
      attempt++;
      continue;
    }
    const type = res.headers.get('content-type') || '';
    const data = expect === 'buffer' ? Buffer.from(await res.arrayBuffer()) : expect === 'text' || !/json/.test(type) ? await res.text() : await res.json().catch(() => null);
    if (!res.ok && !ok.includes(res.status)) {
      const why = res.status === 401 || res.status === 403 ? `ditolak (${res.status}): API key salah, belum aktif, atau tidak punya akses. ${reason(data)}`
        : res.status === 429 ? `terlalu banyak permintaan atau kuota habis (429). ${reason(data)}`
          : `galat ${res.status}. ${reason(data)}`;
      throw new ApiError(service, res.status, why.trim(), data);
    }
    return { status: res.status, headers: res.headers, data };
  }
}

/** Stream a URL to a file (written beside it first, then moved, so a failed download leaves nothing). */
export async function download(service, url, dest, { headers = {}, timeout = 300000 } = {}) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA, ...headers }, signal: ctl.signal, redirect: 'follow' });
    if (!res.ok || !res.body) throw new ApiError(service, res.status, `unduhan gagal (${res.status}).`);
    const tmp = dest + '.part';
    await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
    renameSync(tmp, dest);
    return { type: res.headers.get('content-type') || '', bytes: Number(res.headers.get('content-length')) || 0 };
  } catch (e) {
    rmSync(dest + '.part', { force: true });
    if (e instanceof ApiError) throw e;
    throw new ApiError(service, 0, `unduhan gagal: ${e.name === 'AbortError' ? 'terlalu lama' : e.message}`);
  } finally { clearTimeout(timer); }
}

export { sleep };
