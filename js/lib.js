/* =========================================================
   提灯者 LAMPLIT — 基础库
   数学 / 随机 / 输入 / 存储
   ========================================================= */
(function () {
  'use strict';

  const TAU = Math.PI * 2;

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const dist2 = (ax, ay, bx, by) => {
    const dx = bx - ax, dy = by - ay;
    return dx * dx + dy * dy;
  };
  const dist = (ax, ay, bx, by) => Math.sqrt(dist2(ax, ay, bx, by));
  const angleTo = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
  const approach = (v, target, step) =>
    v < target ? Math.min(v + step, target) : Math.max(v - step, target);
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInQuad = (t) => t * t;

  // 确定性随机（背景生成用）
  function hash2(x, y, seed = 0) {
    let h = x * 374761393 + y * 668265263 + seed * 1442695040888963407;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967296;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, r = Math.random) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (r() * (i + 1)) | 0;
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* ---------------- 输入 ---------------- */
  const Input = {
    keys: Object.create(null),
    pressed: Object.create(null),
    mouse: { x: 240, y: 135, down: false, clicked: false, mx: 0, my: 0 },
    touch: { active: false, id: null, x: 0, y: 0, ox: 0, oy: 0, dx: 0, dy: 0 },
    btn: { dash: false, skill: false, pause: false },
    taps: [],
    touchMode: false,
    anyKey: false,

    init(canvas) {
      this.cw = canvas.width;
      this.ch = canvas.height;
      // 触屏设备（含 Android WebView）一开始就切到触屏 UI
      if (('ontouchstart' in window) || navigator.maxTouchPoints > 0) this.touchMode = true;
      window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (!this.keys[k]) this.pressed[k] = true;
        this.keys[k] = true;
        this.anyKey = true;
        if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
      });
      window.addEventListener('keyup', (e) => {
        this.keys[e.key.toLowerCase()] = false;
      });
      window.addEventListener('blur', () => {
        this.keys = Object.create(null);
      });

      const toCanvas = (clientX, clientY) => {
        const r = canvas.getBoundingClientRect();
        return {
          x: ((clientX - r.left) / r.width) * canvas.width,
          y: ((clientY - r.top) / r.height) * canvas.height,
        };
      };
      canvas.addEventListener('mousemove', (e) => {
        const p = toCanvas(e.clientX, e.clientY);
        this.mouse.x = p.x; this.mouse.y = p.y;
      });
      canvas.addEventListener('mousedown', (e) => {
        const p = toCanvas(e.clientX, e.clientY);
        this.mouse.x = p.x; this.mouse.y = p.y;
        this.mouse.down = true; this.mouse.clicked = true;
      });
      window.addEventListener('mouseup', () => { this.mouse.down = false; });
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());

      // 触屏：左半屏虚拟摇杆 + 右侧冲刺/灯爆/暂停
      const W = canvas.width, H = canvas.height;
      const inCircle = (x, y, cx, cy, r) => {
        const dx = x - cx, dy = y - cy;
        return dx * dx + dy * dy <= r * r;
      };
      canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const L = this.layout();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          const p = toCanvas(t.clientX, t.clientY);
          this.touchMode = true;
          this.anyKey = true;
          this.taps.push({ x: p.x, y: p.y });
          this.mouse.x = p.x; this.mouse.y = p.y;
          this.mouse.clicked = true;
          if (inCircle(p.x, p.y, L.pause.x, L.pause.y, L.pause.r + 7)) { this.btn.pause = true; continue; }
          if (inCircle(p.x, p.y, L.dash.x, L.dash.y, L.dash.r + 8)) { this.btn.dash = true; continue; }
          if (inCircle(p.x, p.y, L.skill.x, L.skill.y, L.skill.r + 8)) { this.btn.skill = true; continue; }
          if (p.x < W * 0.5 && !this.touch.active) {
            this.touch.active = true;
            this.touch.id = t.identifier;
            this.touch.ox = p.x; this.touch.oy = p.y;
            this.touch.x = p.x; this.touch.y = p.y;
            this.touch.dx = 0; this.touch.dy = 0;
          }
        }
      }, { passive: false });
      canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier !== this.touch.id) continue;
          const p = toCanvas(t.clientX, t.clientY);
          this.touch.x = p.x; this.touch.y = p.y;
          this.touch.dx = p.x - this.touch.ox;
          this.touch.dy = p.y - this.touch.oy;
        }
      }, { passive: false });
      const endTouch = (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.touch.id) {
            this.touch.active = false;
            this.touch.id = null;
            this.touch.dx = 0; this.touch.dy = 0;
          }
        }
      };
      canvas.addEventListener('touchend', endTouch, { passive: false });
      canvas.addEventListener('touchcancel', endTouch, { passive: false });
    },

    // 触屏控件布局：左下摇杆 / 右下双键 / 底部中间暂停
    layout() {
      const w = this.cw || 384, h = this.ch || 216;
      const jr = 28, br = 26;
      return {
        joy: { x: jr + 30, y: h - jr - 24, r: jr },
        dash: { x: w - br - 8, y: h - br - 26, r: br },
        skill: { x: w - br * 3 - 16, y: h - br - 26, r: br },
        pause: { x: 15, y: 106, r: 10 },
      };
    },

    down(...keys) { return keys.some((k) => !!this.keys[k]); },
    hit(...keys) { return keys.some((k) => !!this.pressed[k]); },
    axis() {
      let x = 0, y = 0;
      if (this.down('a', 'arrowleft')) x -= 1;
      if (this.down('d', 'arrowright')) x += 1;
      if (this.down('w', 'arrowup')) y -= 1;
      if (this.down('s', 'arrowdown')) y += 1;
      if (this.touch.active) {
        const dx = this.touch.x - this.touch.ox;
        const dy = this.touch.y - this.touch.oy;
        const l = Math.hypot(dx, dy);
        if (l > 8) { x += dx / l; y += dy / l; }
      }
      const len = Math.hypot(x, y);
      if (len > 1) { x /= len; y /= len; }
      return { x, y, len: Math.min(1, len) };
    },
    endFrame() {
      this.pressed = Object.create(null);
      this.mouse.clicked = false;
      this.anyKey = false;
      this.btn.dash = false;
      this.btn.skill = false;
      this.btn.pause = false;
      this.taps.length = 0;
    },
  };

  /* ---------------- 存储 ---------------- */
  const Store = {
    key: 'lamplit.save.v1',
    data: null,
    load() {
      try {
        this.data = JSON.parse(localStorage.getItem(this.key) || '{}') || {};
      } catch (e) { this.data = {}; }
      if (!this.data.best) this.data.best = { time: 0, kills: 0, level: 0, wins: 0, runs: 0 };
      if (!this.data.unlocked) this.data.unlocked = ['lamp'];
      return this.data;
    },
    save() {
      try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {}
    },
    clear() {
      try { localStorage.removeItem(this.key); } catch (e) {}
      this.data = null;
    },
  };

  /* ---------------- 轻量对象池 ---------------- */
  class Pool {
    constructor(factory, reset, size = 64) {
      this.factory = factory; this.reset = reset;
      this.items = [];
      for (let i = 0; i < size; i++) this.items.push(factory());
      this.cursor = 0;
    }
    spawn(...args) {
      let o = null;
      for (let i = 0; i < this.items.length; i++) {
        const it = this.items[(this.cursor + i) % this.items.length];
        if (!it.active) { o = it; this.cursor = (this.cursor + i + 1) % this.items.length; break; }
      }
      if (!o) { o = this.factory(); this.items.push(o); }
      o.active = true;
      if (this.reset) this.reset(o, ...args);
      return o;
    }
    forEach(fn) {
      for (let i = 0; i < this.items.length; i++) if (this.items[i].active) fn(this.items[i]);
    }
    count() {
      let n = 0;
      for (let i = 0; i < this.items.length; i++) if (this.items[i].active) n++;
      return n;
    }
  }

  window.G = {
    TAU, clamp, lerp, rand, randInt, pick, dist, dist2, angleTo, approach,
    easeOutCubic, easeInQuad, hash2, rng, shuffle,
    Input, Store, Pool,
  };
})();
