/* 零依赖 CDP 自动化：启动 Chrome、执行场景脚本、截图、收集控制台错误
   用法: node tools/shot.js tools/scenarios/title.js
*/
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const PORT = 9333;
const URL = process.env.GAME_URL || 'http://127.0.0.1:8099/index.html?skipintro=1';
const VIEW = process.env.VIEW || '1920x1080';

function findChrome() {
  for (const c of CHROME_CANDIDATES) if (fs.existsSync(c)) return c;
  throw new Error('no chrome found');
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchJson(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      return await res.json();
    } catch (e) { await sleep(200); }
  }
  throw new Error('cdp not reachable: ' + url);
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    this.listeners = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
        const l = this.listeners.get(msg.method);
        if (l) l.forEach((fn) => fn(msg.params));
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('timeout ' + method));
        }
      }, 30000);
    });
  }
  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(fn);
  }
}

async function main() {
  const scenarioPath = process.argv[2];
  if (!scenarioPath) throw new Error('usage: node tools/shot.js <scenario.js>');
  const scenario = require(path.resolve(scenarioPath));

  const chrome = findChrome();
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lamplit-chrome-'));
  const [vw, vh] = VIEW.split('x').map(Number);
  const proc = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + userDir,
    '--window-size=' + vw + ',' + vh,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--force-device-scale-factor=1',
    '--autoplay-policy=no-user-gesture-required',
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  const kill = () => { try { proc.kill('SIGKILL'); } catch (e) {} };
  process.on('exit', kill);

  const ver = await fetchJson('http://127.0.0.1:' + PORT + '/json/version');
  const targets = await fetchJson('http://127.0.0.1:' + PORT + '/json/list');
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res);
    ws.addEventListener('error', rej);
  });
  const cdp = new Cdp(ws);

  const logs = [];
  const errors = [];
  cdp.on('Runtime.consoleAPICalled', (p) => {
    const text = (p.args || []).map((a) => a.value !== undefined ? String(a.value) : (a.description || a.type)).join(' ');
    logs.push({ type: p.type, text });
  });
  cdp.on('Runtime.exceptionThrown', (p) => {
    const d = p.exceptionDetails || {};
    errors.push((d.exception && (d.exception.description || d.exception.value)) || d.text || 'error');
  });
  cdp.on('Log.entryAdded', (p) => {
    if (p.entry.level === 'error') errors.push(p.entry.text + ' ' + (p.entry.url || ''));
  });

  await cdp.send('Page.enable');
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: vw, height: vh, deviceScaleFactor: 1, mobile: false,
  });

  const helpers = {
    cdp,
    async goto(url) {
      const loaded = new Promise((res) => cdp.on('Page.loadEventFired', res));
      await cdp.send('Page.navigate', { url: url || URL });
      await Promise.race([loaded, sleep(8000)]);
    },
    async wait(ms) { await sleep(ms); },
    async eval(expr) {
      const r = await cdp.send('Runtime.evaluate', {
        expression: expr, returnByValue: true, awaitPromise: true,
        userGesture: true,
      });
      if (r.exceptionDetails) {
        const d = r.exceptionDetails;
        throw new Error('EVAL ERROR: ' + ((d.exception && d.exception.description) || d.text) + '\n>>> ' + expr);
      }
      return r.result.value;
    },
    async shot(file) {
      const r = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const out = path.resolve(file);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, Buffer.from(r.data, 'base64'));
      return out;
    },
    // 局部放大截图：cx,cy 为画布坐标(480x270)，w,h 为画布尺寸
    async shotClip(file, cx, cy, cw, ch, zoom) {
      const rect = await this.eval(`(() => { const r = document.getElementById('game').getBoundingClientRect(); return {x:r.left,y:r.top,w:r.width,h:r.height}; })()`);
      const s = rect.w / 480;
      const clip = {
        x: rect.x + cx * s, y: rect.y + cy * s,
        width: cw * s, height: ch * s, scale: zoom || 1,
      };
      const r = await cdp.send('Page.captureScreenshot', { format: 'png', clip });
      const out = path.resolve(file);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, Buffer.from(r.data, 'base64'));
      return out;
    },
    async click(x, y) {
      await this.eval(`(() => {
        const c = document.getElementById('game');
        const r = c.getBoundingClientRect();
        const px = ${x}, py = ${y};
        const cx = r.left + px / 480 * r.width;
        const cy = r.top + py / 270 * r.height;
        c.dispatchEvent(new MouseEvent('mousemove', {clientX: cx, clientY: cy, bubbles: true}));
        c.dispatchEvent(new MouseEvent('mousedown', {clientX: cx, clientY: cy, bubbles: true}));
        window.dispatchEvent(new MouseEvent('mouseup', {clientX: cx, clientY: cy, bubbles: true}));
        return true;
      })()`);
    },
    async key(key) {
      const code = key === ' ' ? 'Space' : key;
      await this.eval(`window.dispatchEvent(new KeyboardEvent('keydown', {key: ${JSON.stringify(key)}, code: ${JSON.stringify(code)}, bubbles: true}))`);
      await sleep(60);
      await this.eval(`window.dispatchEvent(new KeyboardEvent('keyup', {key: ${JSON.stringify(key)}, code: ${JSON.stringify(code)}, bubbles: true}))`);
    },
    async hold(key, ms) {
      await this.eval(`window.dispatchEvent(new KeyboardEvent('keydown', {key: ${JSON.stringify(key)}, bubbles: true}))`);
      await sleep(ms);
      await this.eval(`window.dispatchEvent(new KeyboardEvent('keyup', {key: ${JSON.stringify(key)}, bubbles: true}))`);
    },
    logs, errors,
  };

  try {
    await scenario(helpers);
  } catch (e) {
    console.error('SCENARIO FAILED:', e.message);
    try { await helpers.shot('shots/error.png'); } catch (_) {}
    process.exitCode = 1;
  }

  const conErr = logs.filter((l) => l.type === 'error');
  fs.mkdirSync('shots', { recursive: true });
  fs.writeFileSync('shots/console.json', JSON.stringify({ logs, errors }, null, 2));
  if (conErr.length) console.log('CONSOLE ERRORS:\n' + conErr.map((l) => l.text).join('\n'));
  if (errors.length) console.log('PAGE ERRORS:\n' + errors.join('\n'));
  if (!conErr.length && !errors.length) console.log('NO JS ERRORS');

  ws.close();
  kill();
  await sleep(200);
  process.exit(process.exitCode || 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
