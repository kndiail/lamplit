/* =========================================================
   提灯者 LAMPLIT — 世界：地表绘制 / 场景装饰 / 光照
   ========================================================= */
(function () {
  'use strict';
  const G = window.G;
  const ART = window.ART;
  const WORLD = (window.WORLD = {});

  const TS = 16;       // tile 尺寸
  const CHUNK = 256;   // 区块像素
  const CT = CHUNK / TS;

  let seed = 1337;
  const chunks = new Map();

  // 四种地表：灰烬平原 / 苔沼 / 碎石地 / 枯土
  const BIOMES = [
    { base: ['#171d2a', '#161c28', '#181e2c'], speck: ['#232c3f', '#2a3448', '#111620', '#334054'], moss: null, accent: '#1b2230' },
    { base: ['#141e21', '#131c1f', '#162023'], speck: ['#1d2c2c', '#24363a', '#0f1719', '#2b4044'], moss: ['#223a2c', '#2b4737', '#1a2d24'], accent: '#12201d' },
    { base: ['#1b1e27', '#1a1d26', '#1c2029'], speck: ['#2b303c', '#363c4a', '#12151c', '#424a5a'], moss: ['#232a2b'], accent: '#232833' },
    { base: ['#1a1a20', '#191920', '#1c1c24'], speck: ['#26242c', '#302d38', '#121116', '#3b3742'], moss: ['#2a2620'], accent: '#221f28' },
  ];

  const TILE_VARIANTS = 6;
  let tileSet = [];

  function makeTile(biome, v) {
    const cv = document.createElement('canvas');
    cv.width = TS; cv.height = TS;
    const x = cv.getContext('2d');
    const R = G.rng(9001 + v * 977 + biome * 131);
    const B = BIOMES[biome];
    x.fillStyle = B.base[(R() * B.base.length) | 0];
    x.fillRect(0, 0, TS, TS);

    // 低对比凹陷
    if (R() < 0.42) {
      const px = (R() * (TS - 7)) | 0, py = (R() * (TS - 6)) | 0;
      x.fillStyle = B.accent;
      x.globalAlpha = 0.5;
      x.fillRect(px, py, 3 + ((R() * 5) | 0), 2 + ((R() * 3) | 0));
      x.globalAlpha = 1;
    }
    // 颗粒
    const n = 16 + ((R() * 14) | 0);
    for (let i = 0; i < n; i++) {
      const px = (R() * TS) | 0, py = (R() * TS) | 0;
      x.fillStyle = B.speck[(R() * B.speck.length) | 0];
      x.fillRect(px, py, 1, 1);
      if (R() < 0.22) x.fillRect(px + 1, py, 1, 1);
    }
    // 苔藓 / 斑块
    if (B.moss && R() < 0.5) {
      const mx = (R() * (TS - 6)) | 0, my = (R() * (TS - 5)) | 0;
      const w = 2 + ((R() * 5) | 0), h = 1 + ((R() * 3) | 0);
      x.fillStyle = B.moss[(R() * B.moss.length) | 0];
      x.globalAlpha = 0.62;
      x.fillRect(mx, my, w, h);
      x.fillRect(mx + 1, my + h, Math.max(1, w - 1), 1);
      x.globalAlpha = 1;
    }
    // 碎石
    if (R() < 0.3) {
      const gx = (R() * (TS - 4)) | 0, gy = (R() * (TS - 3)) | 0;
      x.fillStyle = B.speck[0];
      x.globalAlpha = 0.85;
      x.fillRect(gx, gy, 2, 1);
      x.fillRect(gx + 1, gy + 1, 1, 1);
      x.globalAlpha = 1;
    }
    // 细草芽
    if (R() < 0.34) {
      const gx = (R() * (TS - 3)) | 0, gy = (R() * (TS - 5)) | 0;
      x.fillStyle = biome === 0 ? '#2a4130' : biome === 1 ? '#35543d' : '#33343f';
      x.fillRect(gx, gy, 1, 2);
      x.fillRect(gx + 1, gy + 1, 1, 2);
      if (R() < 0.4) x.fillRect(gx + 2, gy, 1, 1);
    }
    cv.w = TS; cv.h = TS;
    return cv;
  }

  function buildTiles() {
    tileSet = [];
    for (let b = 0; b < BIOMES.length; b++) {
      const arr = [];
      for (let v = 0; v < TILE_VARIANTS; v++) arr.push(makeTile(b, v));
      tileSet.push(arr);
    }
  }

  // 低频噪声：决定地块生物群系
  function biomeAt(gx, gy) {
    const f = 0.055;
    let v = 0, amp = 1, freq = f;
    for (let o = 0; o < 3; o++) {
      v += G.hash2(Math.floor(gx * freq), Math.floor(gy * freq), seed + 41 + o * 17) * amp;
      amp *= 0.5; freq *= 2.1;
    }
    v /= 1.75;
    if (v < 0.34) return 0;
    if (v < 0.52) return 1;
    if (v < 0.74) return 2;
    return 3;
  }

  const PROPS = [
    { key: 'fern', w: 30 },
    { key: 'rock', w: 12 },
    { key: 'mush', w: 12 },
    { key: 'bones', w: 10 },
    { key: 'flower', w: 16 },
    { key: 'grave', w: 8 },
    { key: 'deadtree', w: 6 },
  ];
  const PROP_TOTAL = PROPS.reduce((s, p) => s + p.w, 0);

  function propFor(gx, gy) {
    const h = G.hash2(gx, gy, seed + 99);
    if (h > 0.038) return null;
    const h2 = G.hash2(gx, gy, seed + 131);
    let r = h2 * PROP_TOTAL;
    for (const p of PROPS) { r -= p.w; if (r <= 0) return p.key; }
    return 'fern';
  }

  function buildChunk(cx, cy) {
    const cv = document.createElement('canvas');
    cv.width = CHUNK; cv.height = CHUNK;
    const x = cv.getContext('2d');
    const baseGX = cx * CT, baseGY = cy * CT;
    for (let ty = 0; ty < CT; ty++) {
      for (let tx = 0; tx < CT; tx++) {
        const gx = baseGX + tx, gy = baseGY + ty;
        const b = biomeAt(gx, gy);
        const v = (G.hash2(gx, gy, seed) * TILE_VARIANTS) | 0;
        x.drawImage(tileSet[b][v], tx * TS, ty * TS);
        // 偶尔的地面裂缝 / 小径石板
        if (G.hash2(gx, gy, seed + 7) < 0.035) {
          x.fillStyle = '#0c0f15';
          x.fillRect(tx * TS + ((G.hash2(gx, gy, seed + 11) * 12) | 0), ty * TS + 8, 3, 1);
        }
      }
    }
    const props = [];
    for (let ty = -1; ty < CT + 1; ty++) {
      for (let tx = -1; tx < CT + 1; tx++) {
        const gx = baseGX + tx, gy = baseGY + ty;
        const key = propFor(gx, gy);
        if (!key) continue;
        const ox = G.hash2(gx, gy, seed + 17) * 10 | 0;
        const oy = G.hash2(gx, gy, seed + 23) * 10 | 0;
        const spr = ART.SPR[key];
        props.push({ spr, x: tx * TS + ox - (spr.w >> 1) + 4, y: ty * TS + oy + 12 - spr.h });
      }
    }
    props.sort((a, b) => a.y - b.y);
    return { cv, props };
  }

  function getChunk(cx, cy) {
    const key = cx + ',' + cy;
    let c = chunks.get(key);
    if (!c) {
      c = buildChunk(cx, cy);
      chunks.set(key, c);
      if (chunks.size > 36) {
        const k = chunks.keys().next().value;
        if (k !== key) chunks.delete(k);
      }
    }
    return c;
  }

  WORLD.init = function () {
    buildTiles();
  };
  WORLD.reset = function (s) {
    seed = (s || 1337) | 0;
    chunks.clear();
    if (typeof buildFog === 'function') {
      try { buildFog(); } catch (e) {}
    }
  };

  WORLD.drawGround = function (ctx, camX, camY, vw, vh) {
    const x0 = Math.floor(camX / CHUNK), x1 = Math.floor((camX + vw) / CHUNK);
    const y0 = Math.floor(camY / CHUNK), y1 = Math.floor((camY + vh) / CHUNK);
    const ox = -Math.round(camX), oy = -Math.round(camY);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const ch = getChunk(cx, cy);
        ctx.drawImage(ch.cv, cx * CHUNK + ox, cy * CHUNK + oy);
      }
    }
  };

  WORLD.drawProps = function (ctx, camX, camY, vw, vh, above) {
    const x0 = Math.floor(camX / CHUNK), x1 = Math.floor((camX + vw) / CHUNK);
    const y0 = Math.floor(camY / CHUNK), y1 = Math.floor((camY + vh) / CHUNK);
    const ox = -Math.round(camX), oy = -Math.round(camY);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const ch = getChunk(cx, cy);
        const px = cx * CHUNK + ox, py = cy * CHUNK + oy;
        for (let i = 0; i < ch.props.length; i++) {
          const p = ch.props[i];
          const dx = px + p.x, dy = py + p.y;
          if (dx < -40 || dx > vw + 40 || dy < -60 || dy > vh + 60) continue;
          ctx.drawImage(p.spr, dx, dy);
        }
      }
    }
  };

  /* ---------------- 迷雾（低分辨率预渲染，双面平铺漂移） ---------------- */
  const FOG_W = 192, FOG_H = 108;
  let fogCanvas = null;

  function buildFog() {
    fogCanvas = document.createElement('canvas');
    fogCanvas.width = FOG_W;
    fogCanvas.height = FOG_H;
    const x = fogCanvas.getContext('2d');
    const R = G.rng(seed + 501);
    // 无缝平铺：每团雾在九宫格重复绘制，保证边缘接缝一致
    for (let i = 0; i < 26; i++) {
      const cx = R() * FOG_W, cy = R() * FOG_H;
      const r = 14 + R() * 30;
      const rot = R() * 3;
      const a = 0.14 + R() * 0.18;
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const px = cx + ox * FOG_W, py = cy + oy * FOG_H;
          if (px < -r * 2 || px > FOG_W + r * 2 || py < -r * 2 || py > FOG_H + r * 2) continue;
          const g = x.createRadialGradient(px, py, 0, px, py, r);
          g.addColorStop(0, 'rgba(126,146,180,' + a.toFixed(3) + ')');
          g.addColorStop(0.6, 'rgba(112,132,166,' + (a * 0.35).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(96,116,150,0)');
          x.fillStyle = g;
          x.beginPath();
          x.ellipse(px, py, r, r * 0.62, rot, 0, Math.PI * 2);
          x.fill();
        }
      }
    }
  }

  WORLD.prepareFog = function () { buildFog(); };

  WORLD.drawFog = function (ctx, camX, camY, vw, vh, t) {
    if (!fogCanvas) buildFog();
    const sx = vw / FOG_W, sy = vh / FOG_H;
    const off = (camX * 0.25 + t * 5) % FOG_W;
    const offY = (camY * 0.25 + Math.sin(t * 0.1) * 8) % FOG_H;
    const ox2 = (camX * 0.45 - t * 9) % FOG_W;
    const oy2 = (camY * 0.45) % FOG_H;

    ctx.globalAlpha = 0.34;
    for (let ix = -1; ix <= 1; ix++) {
      for (let iy = -1; iy <= 1; iy++) {
        ctx.drawImage(fogCanvas,
          Math.round((ix * FOG_W - off) * sx), Math.round((iy * FOG_H - offY) * sy),
          Math.ceil(FOG_W * sx), Math.ceil(FOG_H * sy));
      }
    }
    ctx.globalAlpha = 0.22;
    for (let ix = -1; ix <= 1; ix++) {
      for (let iy = -1; iy <= 1; iy++) {
        ctx.drawImage(fogCanvas,
          Math.round((ix * FOG_W - ox2) * sx), Math.round((iy * FOG_H - oy2) * sy),
          Math.ceil(FOG_W * sx), Math.ceil(FOG_H * sy));
      }
    }
    ctx.globalAlpha = 1;
  };

  /* ---------------- 光照（半分辨率遮罩 + 缓存镂空精灵） ---------------- */
  const MASK_SCALE = 2;
  const MW = Math.round(384 / MASK_SCALE), MH = Math.round(216 / MASK_SCALE);
  const lc = document.createElement('canvas');
  lc.width = MW; lc.height = MH;
  const lx = lc.getContext('2d');
  let lights = [];

  // 镂空精灵：中心全透，边缘渐隐
  let holeSprite = null;
  function getHole() {
    if (holeSprite) return holeSprite;
    const S = 64;
    holeSprite = document.createElement('canvas');
    holeSprite.width = S; holeSprite.height = S;
    const x = holeSprite.getContext('2d');
    const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.30, 'rgba(0,0,0,0.97)');
    g.addColorStop(0.62, 'rgba(0,0,0,0.62)');
    g.addColorStop(0.85, 'rgba(0,0,0,0.20)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
    return holeSprite;
  }

  WORLD.beginDark = function () { lights.length = 0; };
  WORLD.addLight = function (x, y, r, strength) {
    lights.push({ x: x / MASK_SCALE, y: y / MASK_SCALE, r: r / MASK_SCALE, s: strength === undefined ? 1 : strength });
  };
  WORLD.endDark = function (ctx, ambient) {
    lx.globalCompositeOperation = 'source-over';
    lx.clearRect(0, 0, MW, MH);
    lx.fillStyle = ambient || 'rgba(4,6,13,0.93)';
    lx.fillRect(0, 0, MW, MH);
    lx.globalCompositeOperation = 'destination-out';
    const hole = getHole();
    for (let i = 0; i < lights.length; i++) {
      const L = lights[i];
      const d = Math.max(2, Math.round(L.r * 2));
      lx.globalAlpha = Math.min(1, L.s);
      lx.drawImage(hole, Math.round(L.x - L.r), Math.round(L.y - L.r), d, d);
    }
    lx.globalAlpha = 1;
    lx.globalCompositeOperation = 'source-over';
    ctx.drawImage(lc, 0, 0, MW, MH, 0, 0, MW * MASK_SCALE, MH * MASK_SCALE);
    lights.length = 0;
  };

  WORLD.TS = TS;
})();
