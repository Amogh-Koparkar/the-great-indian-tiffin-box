// Tiny QA harness: static server + headless Chrome (CDP, zero deps).
// usage: node tools/qa.mjs <scenario.mjs> [width] [height]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = 'C:/Users/ALIENWARE/.gemini/antigravity/brain/5870a321-fa75-4e82-a1ae-56953261be32/scratch/qa';
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.ttf': 'font/ttf' };

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  const relPath = urlPath === '/' ? '/index.html' : urlPath;
  const p = path.join(ROOT, decodeURIComponent(relPath));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  const stat = fs.statSync(p), type = MIME[path.extname(p)] || 'application/octet-stream';
  const range = req.headers.range;
  if (range) {                                   // video needs range requests
    const [s, e] = range.replace('bytes=', '').split('-'); const start = +s, end = e ? +e : stat.size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    fs.createReadStream(p, { start, end }).pipe(res);
  } else { res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes' }); fs.createReadStream(p).pipe(res); }
}).listen(8137);

const W = +(process.argv[3] || 1920), H = +(process.argv[4] || 1080);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--remote-debugging-port=9333', `--window-size=${W},${H}`, '--hide-scrollbars', '--mute-audio',
  '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--disable-gpu', '--user-data-dir=' + path.join(OUT, '_profile'), 'about:blank'], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function connect() {
  for (let i = 0; i < 60; i++) {
    try { const t = await (await fetch('http://127.0.0.1:9333/json')).json(); const pg = t.find(x => x.type === 'page'); if (pg) return pg.webSocketDebuggerUrl; } catch (_) {}
    await sleep(250);
  }
  throw new Error('no chrome');
}
const ws = new WebSocket(await connect());
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const logs = [];
ws.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method === 'Runtime.consoleAPICalled') logs.push(`[${m.params.type}] ` + m.params.args.map(a => a.value ?? a.description).join(' '));
  else if (m.method === 'Runtime.exceptionThrown') logs.push('[EXCEPTION] ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
});
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });

const api = {
  sleep, logs, W, H,
  async open(url) { await send('Page.navigate', { url: 'http://127.0.0.1:8137/' + url }); await sleep(600); },
  async eval(expr) { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails)); return r.result.result.value; },
  async shot(name) { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.result.data, 'base64')); console.log('shot', name); },
  async move(x, y) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none' }); },
  async down(x, y) { await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 }); },
  async up(x, y) { await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 }); },
  async click(x, y) { await api.move(x, y); await sleep(60); await api.down(x, y); await sleep(60); await api.up(x, y); },
  // stage units -> client px (stage is cover-scaled)
  async S(x, y) { return await api.eval(`(()=>{const r=document.getElementById('stage').getBoundingClientRect();const s=r.width/1920;return {x:Math.round(r.left+${x}*s),y:Math.round(r.top+${y}*s)}})()`); },
  async resize(w, h) { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false }); await sleep(200); },
  async waitFor(expr, ms = 15000) { const t = Date.now(); while (Date.now() - t < ms) { if (await api.eval(expr)) return true; await sleep(150); } throw new Error('timeout waiting ' + expr); },
};
try {
  const mod = await import(pathToFileURL(path.resolve(process.argv[2])).href);
  await mod.default(api);
} catch (e) { console.error('SCENARIO ERROR', e); }
console.log('--- console ---\n' + logs.join('\n'));
ws.close(); chrome.kill(); server.close(); process.exit(0);
