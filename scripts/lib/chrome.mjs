// Headless Chrome over the DevTools protocol, shared by verify.mjs and component.mjs. No dependencies.
// Needs Chrome, Chromium or Edge. Set CHROME_PATH if it is not found.
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

export const sleep = ms => new Promise(r => setTimeout(r, ms));

export function findChrome() {
  const cands = [process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'].filter(Boolean);
  for (const c of cands) if (existsSync(c)) return c;
  for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) {
    try { const p = execFileSync('which', [bin], { encoding: 'utf8' }).trim(); if (p) return p; } catch (e) { /* not installed */ }
  }
  return null;
}

/** Start Chrome and attach to its page. Returns { send, evalJs, open, logs, close }. */
export async function launch(chromePath, { width = 1440, height = 900 } = {}) {
  const profile = mkdtempSync(join(tmpdir(), 'content-chrome-'));
  const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', '--hide-scrollbars', `--window-size=${width},${height}`, '--allow-file-access-from-files', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  let ws, id = 0;
  const pending = new Map();
  const logs = [];
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  async function evalJs(expression) {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, timeout: 120000 });
    if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
    return r.result.result.value;
  }
  async function close() {
    try { ws?.close(); } catch (e) { /* closed */ }
    chrome.kill();
    await sleep(300);
    rmSync(profile, { recursive: true, force: true });
  }
  try {
    let port = null;
    for (let i = 0; i < 100 && !port; i++) {
      await sleep(100);
      const f = join(profile, 'DevToolsActivePort');
      if (existsSync(f)) port = readFileSync(f, 'utf8').split('\n')[0].trim();
    }
    if (!port) throw new Error('Chrome tidak membuka port debugging.');
    let target = null;
    for (let i = 0; i < 50 && !target; i++) {
      try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page'); } catch (e) { /* starting */ }
      if (!target) await sleep(100);
    }
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r, { once: true }));
    ws.addEventListener('message', ev => {
      const m = JSON.parse(ev.data);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
      if (m.method === 'Runtime.exceptionThrown') logs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
      if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) logs.push(m.params.args.map(a => a.value ?? a.description).join(' '));
    });
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
