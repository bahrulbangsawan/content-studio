// Headless Chrome over the DevTools protocol, shared by verify.mjs and component.mjs. No dependencies.
// Talks to Chrome through a pipe (--remote-debugging-pipe), so it needs no network port and no WebSocket,
// and runs on Node 18 or newer. Needs Chrome, Chromium or Edge; set CHROME_PATH if it is not found.
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { pathToFileURL } from 'node:url';

export const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Chromium that Playwright downloaded (it is often the only browser in containers and cloud sandboxes) */
function playwrightChrome() {
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, join(homedir(), '.cache', 'ms-playwright'), join(homedir(), 'Library', 'Caches', 'ms-playwright'), '/ms-playwright'].filter(Boolean);
  const inner = ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium', 'chrome-win/chrome.exe'];
  for (const r of roots) {
    if (!existsSync(r)) continue;
    for (const d of readdirSync(r).filter(n => /^chromium-\d+$/.test(n)).sort().reverse()) {
      for (const i of inner) { const p = join(r, d, i); if (existsSync(p)) return p; }
    }
  }
  return null;
}

export function findChrome() {
  const cands = [process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'].filter(Boolean);
  for (const c of cands) if (existsSync(c)) return c;
  for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) {
    try { const p = execFileSync('which', [bin], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); if (p) return p; } catch (e) { /* not installed */ }
  }
  return playwrightChrome();
}

/** Start Chrome and attach to one page. Returns { send, evalJs, open, logs, close }. */
export async function launch(chromePath, { width = 1440, height = 900 } = {}) {
  const profile = mkdtempSync(join(tmpdir(), 'content-chrome-'));
  const flags = ['--headless=new', '--remote-debugging-pipe', '--hide-scrollbars', `--window-size=${width},${height}`, '--allow-file-access-from-files', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check'];
  /* Containers run as root, where Chrome's sandbox cannot start, and often have a tiny /dev/shm */
  if (process.platform === 'linux') flags.push('--disable-dev-shm-usage');
  if (process.platform === 'linux' && process.getuid && process.getuid() === 0) flags.push('--no-sandbox');
  const chrome = spawn(chromePath, [...flags, 'about:blank'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
  const toChrome = chrome.stdio[3], fromChrome = chrome.stdio[4];
  let id = 0, session = null, buf = '', exited = false;
  const pending = new Map();
  const logs = [];
  chrome.on('error', () => { exited = true; });
  chrome.on('exit', () => { exited = true; for (const r of pending.values()) r({ error: { message: 'Chrome berhenti.' } }); pending.clear(); });
  toChrome.on('error', () => { exited = true; });
  fromChrome.on('data', chunk => {
    buf += chunk.toString('utf8');
    let k;
    while ((k = buf.indexOf('\0')) >= 0) {
      const line = buf.slice(0, k);
      buf = buf.slice(k + 1);
      let m;
      try { m = JSON.parse(line); } catch (e) { continue; }
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
      if (m.method === 'Runtime.exceptionThrown') logs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
      if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) logs.push(m.params.args.map(a => a.value ?? a.description).join(' '));
    }
  });
  /* A browser-level call, or a page call once attached (sessionId) */
  const raw = (method, params = {}, sessionId) => new Promise(r => {
    if (exited) return r({ error: { message: 'Chrome berhenti.' } });
    const i = ++id;
    pending.set(i, r);
    toChrome.write(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0');
  });
  /* Page commands. The reply keeps the { result } shape the callers read. */
  const send = (method, params = {}) => raw(method, params, session);
  async function evalJs(expression) {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, timeout: 120000 });
    if (r.error) throw new Error(r.error.message);
    if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
    return r.result.result.value;
  }
  async function close() {
    try { if (!exited) await Promise.race([raw('Browser.close'), sleep(1500)]); } catch (e) { /* closed */ }
    chrome.kill();
    await sleep(300);
    rmSync(profile, { recursive: true, force: true });
  }
  try {
    let page = null;
    for (let i = 0; i < 100 && !page && !exited; i++) {
      const r = await Promise.race([raw('Target.getTargets'), sleep(500).then(() => ({}))]);
      page = r.result && r.result.targetInfos.find(t => t.type === 'page');
      if (!page) await sleep(100);
    }
    if (!page && !exited) {
      const r = await raw('Target.createTarget', { url: 'about:blank' });
      if (r.result) page = { targetId: r.result.targetId };
    }
    if (!page) throw new Error('Chrome tidak membuka halaman. Coba set CHROME_PATH ke Chrome atau Chromium lain.');
    const a = await raw('Target.attachToTarget', { targetId: page.targetId, flatten: true });
    if (!a.result) throw new Error('Gagal tersambung ke halaman Chrome.');
    session = a.result.sessionId;
    await send('Runtime.enable');
    await send('Page.enable');
  } catch (e) { await close(); throw e; }
  /** Navigate to a local file and wait until `ready` (a JS expression) is true. */
  async function open(file, ready, timeoutMs = 12000) {
    await send('Page.navigate', { url: pathToFileURL(file).href });
    for (let t = 0; t < timeoutMs; t += 150) {
      await sleep(150);
      if (await evalJs(ready).catch(() => false)) return;
    }
    throw new Error(`Halaman tidak siap dalam ${Math.round(timeoutMs / 1000)} detik.`);
  }
  return { send, evalJs, open, logs, close };
}
