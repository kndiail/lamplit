/* =========================================================
   提灯者 LAMPLIT — 美术系统
   手写像素图 (char-map) + 程序化像素图标 + 像素字体
   ========================================================= */
(function () {
  'use strict';
  const G = window.G;
  const ART = (window.ART = {});

  /* ---------------------------------------------------------
     调色板
     --------------------------------------------------------- */
  const C = {
    out: '#080910',
    out2: '#12141f',
    // 布衣 / 提灯者
    clothHi: '#e6edf8',
    cloth: '#7e93b5',
    clothMid: '#5c7092',
    clothDark: '#495c7c',
    clothDeep: '#2b3852',
    hoodIn: '#101320',
    eye: '#ffd166',
    lamp: '#ffae3c',
    lampHi: '#ffe9a8',
    // 敌人
    rotHi: '#a9cf5a',
    rot: '#6f9b3c',
    rotDark: '#3f5c2a',
    batHi: '#9a5f86',
    bat: '#6a3c5c',
    batDark: '#3d2138',
    stoneHi: '#8b8fa6',
    stone: '#5d617b',
    stoneDark: '#3a3d52',
    ghostHi: '#d8ecff',
    ghost: '#9cbde0',
    ghostDark: '#63809f',
    spitHi: '#c76fa8',
    spit: '#8b3f70',
    spitDark: '#52214a',
    wisp: '#ffd88a',
    bossHi: '#d05a6a',
    boss: '#8a2f48',
    bossDark: '#4a152b',
    bossEye: '#ff5f4a',
  };

  ART.C = C;

  /* ---------------------------------------------------------
     精灵构建：char-map -> canvas
     --------------------------------------------------------- */
  function mk(rows, pal) {
    const w = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const h = rows.length;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        const col = pal[ch];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    cv.w = w; cv.h = h;
    return cv;
  }
  ART.mk = mk;

  function flipped(cv) {
    const c = document.createElement('canvas');
    c.width = cv.width; c.height = cv.height;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.translate(cv.width, 0); x.scale(-1, 1);
    x.drawImage(cv, 0, 0);
    c.w = cv.width; c.h = cv.height;
    return c;
  }
  ART.flipped = flipped;

  /* ---------------------------------------------------------
     提灯者（16 x 16）
     --------------------------------------------------------- */
  const P_PAL = {
    o: C.out, 1: C.clothHi, 2: C.cloth, 3: C.clothMid, 4: C.clothDark,
    5: C.hoodIn, e: C.eye, L: C.lamp,
  };

  const P_DOWN_0 = [
    '................',
    '......oooo......',
    '.....o1111o.....',
    '....o122221o....',
    '...o12222221o...',
    '...o12555521o...',
    '...o15e55e51o...',
    '...o12555521o...',
    '..o1222222221o..',
    '..o1223333221o..',
    '..o1222222221o..',
    '..o1222222221o..',
    '..o1222222221o..',
    '...o12222221o...',
    '....o44o.o44o...',
    '....oooo.oooo...',
  ];
  const P_DOWN_1 = [
    '................',
    '................',
    '......oooo......',
    '.....o1111o.....',
    '....o122221o....',
    '...o12555521o...',
    '...o15e55e51o...',
    '...o12555521o...',
    '..o1222222221o..',
    '..o1223333221o..',
    '..o1222222221o..',
    '..o1222222221o..',
    '...o12222221o...',
    '...o44o.o44o....',
    '..o44o...o44o...',
    '..oooo...oooo...',
  ];
  const P_UP_0 = [
    '................',
    '......oooo......',
    '.....o1111o.....',
    '....o122221o....',
    '...o12222221o...',
    '...o12222221o...',
    '...o12233321o...',
    '...o12222221o...',
    '..o1222222221o..',
    '..o1222332221o..',
    '..o1222222221o..',
    '..o1222222221o..',
    '..o1222222221o..',
    '...o12222221o...',
    '....o44o.o44o...',
    '....oooo.oooo...',
  ];
  const P_UP_1 = [
    '................',
    '................',
    '......oooo......',
    '.....o1111o.....',
    '....o122221o....',
    '...o12222221o...',
    '...o12222221o...',
    '...o12233321o...',
    '..o1222222221o..',
    '..o1222332221o..',
    '..o1222222221o..',
    '..o1222222221o..',
    '...o12222221o...',
    '...o44o.o44o....',
    '..o44o...o44o...',
    '..oooo...oooo...',
  ];
  const P_SIDE_0 = [
    '................',
    '......ooooo.....',
    '.....o11111o....',
    '....o1222221o...',
    '....o1255551o...',
    '....o15e5521o...',
    '....o1255551o...',
    '....o1223321o...',
    '...o122222221o..',
    '...o122222221o..',
    '...o122222221o..',
    '....o1222221o...',
    '....o1222221o...',
    '....o44oo44o....',
    '.....oo..oo.....',
    '................',
  ];
  const P_SIDE_1 = [
    '................',
    '................',
    '......ooooo.....',
    '.....o11111o....',
    '....o1255551o...',
    '....o15e5521o...',
    '....o1255551o...',
    '....o1223321o...',
    '...o122222221o..',
    '...o122222221o..',
    '...o122222221o..',
    '....o1222221o...',
    '....o44oo4o.....',
    '....oooo.ooo....',
    '.....oo...oo....',
    '................',
  ];

  const LANTERN = [
    '..ooo..',
    '.o...o.',
    '..o.o..',
    '.olLlo.',
    '.olLlo.',
    '.olLlo.',
    '.olLlo.',
    '..ooo..',
    '.......',
  ];
  const LANTERN_PAL = { o: C.out, L: C.lampHi, l: C.lamp };

  /* ---------------------------------------------------------
     敌人
     --------------------------------------------------------- */
  // 蝙蝠 14x10
  const BAT_PAL = { o: C.out, 1: C.batHi, 2: C.bat, 3: C.batDark, e: '#ffe27a' };
  const BAT_A = [
    '..............',
    '..o........o..',
    '.o1o......o1o.',
    '.o11o.oo.o11o.',
    '..o11o11o11o..',
    '...o111111o...',
    '...o1e11e1o...',
    '....o1111o....',
    '.....o3.o3....',
    '..............',
  ];
  const BAT_B = [
    '..............',
    '..............',
    '..o........o..',
    '.o1o.oooo.o1o.',
    '.o11o1111o11o.',
    '..o11111111o..',
    '...o1e11e1o...',
    '....o1111o....',
    '.....o3.o3....',
    '..............',
  ];

  // 蠕行者 14x10
  const CR_PAL = { o: C.out, 1: C.rotHi, 2: C.rot, 3: C.rotDark, e: '#ffe14d' };
  const CR_A = [
    '..............',
    '..o........o..',
    '...o......o...',
    '..oooooooooo..',
    '.o1111111111o.',
    '.o1122222211o.',
    '.o1e22222e21o.',
    '.o1123223211o.',
    '..o11222211o..',
    '..o3o3oo3o3o..',
    '...o.o..o.o...',
  ];
  const CR_B = [
    '..............',
    '..o........o..',
    '...o......o...',
    '..oooooooooo..',
    '.o1111111111o.',
    '.o1122222211o.',
    '.o1e22222e21o.',
    '.o1123223211o.',
    '..o11222211o..',
    '...o3oo3o3o...',
    '..o.o.oo.o.o..',
  ];

  // 喷吐者 14x15
  const SP_PAL = { o: C.out, 1: C.spitHi, 2: C.spit, 3: C.spitDark, e: '#ffd0e8' };
  const SP_A = [
    '..............',
    '....oooooo....',
    '...o111111o...',
    '..o11222211o..',
    '..o1e2222e1o..',
    '..o11222211o..',
    '..o11233221o..',
    '..o11222211o..',
    '.o1122222211o.',
    '.o1122222211o.',
    '.o1122222211o.',
    '..o11222211o..',
    '...o111111o...',
    '..o11o..o11o..',
    '..oo......oo..',
    '..............',
  ];
  const SP_B = [
    '..............',
    '....oooooo....',
    '...o111111o...',
    '..o11222211o..',
    '..o1e2222e1o..',
    '..o11222211o..',
    '..o11233221o..',
    '..o11222211o..',
    '.o1122222211o.',
    '.o1122222211o.',
    '.o1122222211o.',
    '..o11222211o..',
    '...o111111o...',
    '.o11o....o11o.',
    '.oo........oo.',
    '..............',
  ];

  // 巨岩兽 18x18
  const BR_PAL = { o: C.out, 1: C.stoneHi, 2: C.stone, 3: C.stoneDark, e: '#ff8d4a' };
  const BR_A = [
    '..................',
    '......oooooo......',
    '.....o111111o.....',
    '....o11221111o....',
    '....o11111111o....',
    '....o1e1111e1o....',
    '....o11122111o....',
    '...o1111111111o...',
    '...o1122112211o...',
    '..o111111111111o..',
    '..o112211112211o..',
    '..o111111111111o..',
    '..o111111111111o..',
    '...o1111111111o...',
    '....o11111111o....',
    '....o11o..o11o....',
    '....o22o..o22o....',
    '....oooo..oooo....',
  ];
  const BR_B = [
    '..................',
    '..................',
    '......oooooo......',
    '.....o111111o.....',
    '....o11221111o....',
    '....o1e1111e1o....',
    '....o11122111o....',
    '...o1111111111o...',
    '..o1122112211o....',
    '..o111111111111o..',
    '..o112211112211o..',
    '..o111111111111o..',
    '...o1111111111o...',
    '....o11111111o....',
    '...o11o....o11o...',
    '...o22o....o22o...',
    '...oooo....oooo...',
    '..................',
  ];

  // 幽魂 12x15
  const GH_PAL = { o: C.out2, 1: C.ghostHi, 2: C.ghost, 3: C.ghostDark, e: '#c9f6ff' };
  const GH_A = [
    '....oooo....',
    '..oo1111oo..',
    '.o11111111o.',
    '.o11111111o.',
    'o11e1111e11o',
    'o1122222211o',
    'o1122222211o',
    'o1122222211o',
    'o1222222221o',
    'o2222222222o',
    'o3222222223o',
    '.o3o2222o3o.',
    '..o3o22o3o..',
    '...o3oo3o...',
    '....o..o....',
    '............',
  ];
  const GH_B = [
    '............',
    '....oooo....',
    '..oo1111oo..',
    '.o11111111o.',
    'o1111111111o',
    'o11e1111e11o',
    'o1122222211o',
    'o1122222211o',
    'o1222222221o',
    'o2222222222o',
    'o3222222223o',
    '.o3o2222o3o.',
    '..o3o22o3o..',
    '....o33o....',
    '.....oo.....',
    '............',
  ];

  /* ---------------------------------------------------------
     掉落 / 装饰
     --------------------------------------------------------- */
  /* ---------------------------------------------------------
     v2 新增敌人
     --------------------------------------------------------- */
  const ARCHER_A = [
    '....oooooo....',
    '...o111111o...',
    '..o12111121o..',
    '..o11111111o..',
    '...o111111o...',
    '....o1111o....',
    '..oooo11oooo..',
    '.o1111111111o.',
    '.o1111111111o.',
    '..o11111111o..',
    '...o11oo11o...',
    '...o11oo11o...',
    '..o111oo111o..',
    '..oooo..oooo..',
  ];
  const ARCHER_B = [
    '....oooooo....',
    '...o111111o...',
    '..o12111121o..',
    '..o11111111o..',
    '...o111111o...',
    '....o1111o....',
    '..oooo11oooo..',
    '.o1111111111o.',
    '.o1111111111o.',
    '..o11111111o..',
    '...o11oo11o...',
    '...o11oo11o...',
    '..o111oo111o..',
    '.oooo....oooo.',
  ];
  const ARCHER_PAL = { o: '#080910', 1: '#d8d4c8', 2: '#ff8a4a' };

  const LEECH_A = [
    '..oooooo....',
    '.o111111oo..',
    'o1221111221o',
    'o1221111221o',
    'o1111111111o',
    '.o11222111o.',
    '..o111111o..',
    '...o1111o...',
    '....oooo....',
  ];
  const LEECH_B = [
    '..oooooo....',
    '.o111111oo..',
    'o1221111221o',
    'o1111111221o',
    'o1111111111o',
    '.o11122211o.',
    '..o111111o..',
    '...o1111o...',
    '....oooo....',
  ];
  const LEECH_PAL = { o: '#15080f', 1: '#4a2038', 2: '#ff6ae0' };

  const SHADE_A = [
    '....oooooo....',
    '...o111111o...',
    '..o11221111o..',
    '..o11221111o..',
    '..o11111111o..',
    '..o12211221o..',
    '..o11111111o..',
    '...o111111o...',
    '..o11111111o..',
    '.o1111111111o.',
    '.o1111111111o.',
    '.o1111111111o.',
    '..o11111111o..',
    '..o1o1o1o1o...',
    '..o1o1o1o1o...',
    '...o.o.o.o....',
  ];
  const SHADE_B = [
    '....oooooo....',
    '...o111111o...',
    '..o11221111o..',
    '..o11221111o..',
    '..o11111111o..',
    '..o12211221o..',
    '..o11111111o..',
    '...o111111o...',
    '..o11111111o..',
    '.o1111111111o.',
    '.o1111111111o.',
    '.o1111111111o.',
    '..o11111111o..',
    '...o1o1o1o1o..',
    '...o1o1o1o1o..',
    '....o.o.o.o...',
  ];
  const SHADE_PAL = { o: '#080910', 1: '#2e2340', 2: '#b06ad8' };

  const BOMBER_A = [
    '.....oo.......',
    '....o22o......',
    '..oooooooo....',
    '.o11111111o...',
    'o1111111111o..',
    'o1121111211o..',
    'o1111111111o..',
    'o1122112211o..',
    'o1111111111o..',
    '.o11111111o...',
    '..o111111o....',
    '..o1o11o1o....',
    '..ooo..ooo....',
    '..............',
  ];
  const BOMBER_B = [
    '.....oo.......',
    '....o22o......',
    '..oooooooo....',
    '.o11111111o...',
    'o1111111111o..',
    'o1121111211o..',
    'o1111111111o..',
    'o1122112211o..',
    'o1111111111o..',
    '.o11111111o...',
    '..o111111o....',
    '.o1o11o1o.....',
    '.ooo..ooo.....',
    '..............',
  ];
  const BOMBER_PAL = { o: '#0d1208', 1: '#6f8f3a', 2: '#ffd166' };

  const SUMMONER_A = [
    '......oo......',
    '.....o11o.....',
    '....o1111o....',
    '....o1221o....',
    '....o1111o....',
    '...oo1111oo...',
    '..o11111111o..',
    '.o1111111111o.',
    '.o1111111111o.',
    '.o1111111111o.',
    '..o11111111o..',
    '..o11111111o..',
    '..o11111111o..',
    '..o1o1o1o1o...',
    '..o1o1o1o1o...',
    '...o.o.o.o....',
  ];
  const SUMMONER_B = [
    '......oo......',
    '.....o11o.....',
    '....o1111o....',
    '....o1221o....',
    '....o1111o....',
    '...oo1111oo...',
    '..o11111111o..',
    '.o1111111111o.',
    '.o1111111111o.',
    '.o1111111111o.',
    '..o11111111o..',
    '..o11111111o..',
    '..o11111111o..',
    '...o1o1o1o1o..',
    '...o1o1o1o1o..',
    '....o.o.o.o...',
  ];
  const SUMMONER_PAL = { o: '#080910', 1: '#4b3a6b', 2: '#9fe8ff' };

  /* 宝箱 */
  const CHEST = [
    '..oooooooo..',
    '.o11111111o.',
    'o1122222211o',
    'o1111111111o',
    'o1222222221o',
    'o1111111111o',
    'o1122222211o',
    'o1111111111o',
    '.o11111111o.',
    '..oooooooo..',
  ];
  const CHEST_PAL = { o: '#2a1c0a', 1: '#8a6234', 2: '#ffd166' };

  const CROWN = [
    '.o..o..o.',
    'oo.ooo.oo',
    'o1o1o1o1o',
    '.ooooooo.',
  ];
  const CROWN_PAL = { o: '#5a3f12', 1: '#ffd166' };

  const HEART = [
    '.oo.oo.',
    'o11o11o',
    'o12112o',
    'o11111o',
    '.o111o.',
    '..o1o..',
    '...o...',
  ];
  const HEART_PAL = { o: '#3a0f18', 1: '#ff6b7f', 2: '#ffd3d9' };

  const GRAVE = [
    '....oooo....',
    '...o1111o...',
    '..o122211o..',
    '..o122211o..',
    '..o122211o..',
    '..o121111o..',
    '..o122211o..',
    '..o122211o..',
    '..o122211o..',
    '..o122211o..',
    '..o122211o..',
    '.oo122211oo.',
    '.o11111111o.',
    '.o11111111o.',
    '..oooooooo..',
  ];
  const GRAVE_PAL = { o: '#101219', 1: '#575e77', 2: '#454b61' };

  const ROCK = [
    '...ooooo..',
    '..o11111o.',
    '.o1122111o',
    '.o1211112o',
    'o11122111o',
    'o11111111o',
    '.oooooooo.',
  ];
  const ROCK_PAL = { o: '#0d0f16', 1: '#4e5468', 2: '#6b7188' };

  const MUSH = [
    '..oooo..',
    '.o1111o.',
    'o11e111o',
    'o111111o',
    '.oo22oo.',
    '..o22o..',
    '..o22o..',
    '..oooo..',
  ];
  const MUSH_PAL = { o: '#0d0f16', 1: '#7d4f9e', 2: '#3c3459', e: '#d7a6ff' };

  const FERN = [
    '...o....o...',
    '..o1o..o1o..',
    '..o1o.o1o...',
    '.o11o.o11o..',
    '.o11oo11o...',
    '..o11111o...',
    '...o111o....',
    '....ooo.....',
  ];
  const FERN_PAL = { o: '#0d0f16', 1: '#3c6b45' };

  const BONES = [
    'o..o.....o..o',
    'o11o.ooo.o11o',
    '.ooo.o1o.ooo.',
    '.....o1o.....',
    '..o..o1o..o..',
    '.o1o.ooo.o1o.',
    '.ooo.....ooo.',
  ];
  const BONES_PAL = { o: '#0d0f16', 1: '#8d8571' };

  const FLOWER = [
    '.o.o.',
    'o1e1o',
    '.oeo.',
    '..o..',
    '..2..',
  ];
  const FLOWER_PAL = { o: '#0d0f16', 1: '#3f6d8a', e: '#9fe6ff', 2: '#2b5c3c' };

  const DEADTREE = [
    '........o........o......',
    '.......o1o......o1o.....',
    '.......o1o..oo..o1o.....',
    '....o..o11oo11oo11o..o..',
    '....o1oo111111111o..o1o.',
    '....o11o11111o111o.o11o.',
    '.....o11o1111o11o.o11o..',
    '......o111111111o111o...',
    '.......o11111111o11o....',
    '........o111111111o.....',
    '........o11111111o......',
    '.........o222222o.......',
    '.........o221122o.......',
    '.........o222222o.......',
    '..........o2222o........',
    '..........o2222o........',
    '..........o2222o........',
    '..........o2222o........',
    '..........o2222o........',
    '..........o2222o........',
    '.........oo2222oo.......',
    '........o11111111o......',
    '.......o1111111111o.....',
    '......o111111111111o....',
  ];
  const DEADTREE_PAL = { o: '#0a0c14', 1: '#2a2f42', 2: '#202538' };

  /* ---------------------------------------------------------
     程序化精灵：鬼火 / 首领 / 图标
     --------------------------------------------------------- */
  function dot(ctx, x, y, col) { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); }

  // 鬼火：几帧脉动
  function makeWisp() {
    const frames = [];
    for (let f = 0; f < 4; f++) {
      const cv = document.createElement('canvas');
      cv.width = 12; cv.height = 12;
      const x = cv.getContext('2d');
      const cx = 6, cy = 5.5 + Math.sin(f / 4 * Math.PI * 2) * 0.6;
      const r = 3 + (f % 2) * 0.4;
      for (let yy = 0; yy < 12; yy++) {
        for (let xx = 0; xx < 12; xx++) {
          const d = Math.hypot(xx + 0.5 - cx, yy + 0.5 - cy);
          if (d < r - 0.4) { dot(x, xx, yy, '#fff3c4'); }
          else if (d < r + 0.5) { dot(x, xx, yy, '#ffc75e'); }
          else if (d < r + 1.3) { dot(x, xx, yy, 'rgba(255,150,50,0.55)'); }
        }
      }
      // 尾焰
      for (let i = 0; i < 4; i++) {
        const yy = 9 + i;
        const off = Math.sin(f * 1.4 + i) > 0 ? 0 : 1;
        dot(x, 5 + off, yy, i < 2 ? '#ff9c3a' : 'rgba(255,120,40,0.6)');
        dot(x, 6 + off, yy, i < 2 ? '#ffbf6a' : 'rgba(255,120,40,0.4)');
      }
      frames.push(cv);
    }
    return frames;
  }

  // 首领：程序化生成大块头剪影（含多只眼睛与垂须）
  function makeBoss(size, seed, pal) {
    const cv = document.createElement('canvas');
    cv.width = size; cv.height = size;
    const x = cv.getContext('2d');
    const R = G.rng(seed);
    const cx = size / 2, cy = size / 2 + size * 0.05;
    const baseR = size * 0.40;

    // 轮廓噪声（多次谐波，得到不规则但连续的边缘）
    const spine = [];
    for (let a = 0; a < 64; a++) {
      spine.push(0.86 + R() * 0.16);
    }
    const outline = (ang) => {
      const idx = ((ang + Math.PI) / (Math.PI * 2)) * 64;
      const i0 = Math.floor(idx) % 64, i1 = (i0 + 1) % 64;
      const f = idx - Math.floor(idx);
      const base = spine[i0] * (1 - f) + spine[i1] * f;
      const spiky = 1 + Math.sin(ang * 7 + seed) * 0.05 + Math.sin(ang * 11 - seed) * 0.035;
      return base * spiky;
    };

    const inBody = (px, py) => {
      const dx = px - cx;
      const dy = (py - cy) * 1.06;
      const d = Math.hypot(dx, dy);
      if (d < 0.001) return true;
      return d < baseR * outline(Math.atan2(dy, dx));
    };

    // 顶尖双角
    const hornH = Math.round(size * 0.22);
    for (let i = 0; i < hornH; i++) {
      const w = Math.max(1, Math.round((1 - i / hornH) * size * 0.06));
      const yv = Math.round(cy - baseR * 0.86 - i);
      if (yv < 0) break;
      const spread = Math.round(size * 0.15 + i * 0.35);
      x.fillStyle = pal.out;
      x.fillRect(Math.round(cx - spread - w), yv, w * 2 + 2, 1);
      x.fillRect(Math.round(cx + spread - w), yv, w * 2 + 2, 1);
      x.fillStyle = i > hornH * 0.5 ? pal.bossDark : pal.boss;
      x.fillRect(Math.round(cx - spread - w + 1), yv, Math.max(1, w * 2 - 1), 1);
      x.fillRect(Math.round(cx + spread - w + 1), yv, Math.max(1, w * 2 - 1), 1);
    }

    // 身体：边缘描黑 + 同心色阶 + 左上光源
    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const fx = px + 0.5, fy = py + 0.5;
        if (!inBody(fx, fy)) continue;
        const edge =
          !inBody(fx - 1, fy) || !inBody(fx + 1, fy) ||
          !inBody(fx, fy - 1) || !inBody(fx, fy + 1);
        if (edge) { dot(x, px, py, pal.out); continue; }

        const dx = (fx - cx) / baseR;
        const dy = (fy - cy) / baseR;
        const d = Math.hypot(dx, dy);

        if (d > 0.9) { dot(x, px, py, pal.bossDark); continue; }
        if (d > 0.78) { dot(x, px, py, pal.bossDeep || '#2a0a16'); continue; }

        const light = (-dx * 0.55 - dy * 0.75) + 0.15;
        if (light > 0.72) dot(x, px, py, pal.bossHi);
        else if (light > 0.32) dot(x, px, py, pal.boss);
        else dot(x, px, py, pal.bossDark);

        // 顶部右侧轮廓高光
        if (d > 0.82 && light > 0.55) dot(x, px, py, pal.bossHi);
      }
    }

    // 双臂与利爪
    for (const side of [-1, 1]) {
      const steps = Math.round(baseR * 0.9);
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const ax = cx + side * (baseR * 0.72 + t * baseR * 0.62);
        const ay = cy + baseR * 0.05 + Math.sin(t * Math.PI * 0.72) * baseR * 0.46;
        const th = t < 0.4 ? 2 : t < 0.75 ? 2 : 1;
        for (let k = 0; k < th; k++) {
          dot(x, Math.round(ax) + k, Math.round(ay), k === 0 ? pal.boss : pal.bossDark);
        }
        if (i === 0) dot(x, Math.round(ax), Math.round(ay) - 1, pal.bossDark);
      }
      // 三根爪
      const cxp = cx + side * (baseR * 1.32);
      const cyp = cy + baseR * 0.05 + Math.sin(0.72 * Math.PI) * baseR * 0.46;
      for (let k = -1; k <= 1; k++) {
        const fx = cxp + side * 2 + k * side;
        dot(x, Math.round(fx), Math.round(cyp) + k, pal.out);
        dot(x, Math.round(fx) + side, Math.round(cyp) + k + 1, '#efe3c4');
      }
    }

    // 面部：狭长的凶眼（内低外高，形成怒眉感）
    const eyes = size > 44 ? 5 : 3;
    for (let i = 0; i < eyes; i++) {
      const spread = (i - (eyes - 1) / 2);
      const ex = Math.round(cx + spread * baseR * 0.34);
      const ey = Math.round(cy - baseR * 0.24 - Math.abs(spread) * baseR * 0.06);
      const ew = 4, eh = 2;
      const inner = spread > 0 ? -1 : 1;  // 内侧压低
      // 眼窝
      for (let yy = -1; yy <= eh; yy++) {
        for (let xx = -1; xx <= ew; xx++) {
          dot(x, ex - 2 + xx, ey + yy, '#080104');
        }
      }
      // 眼球（斜向）
      for (let xx = 0; xx < ew; xx++) {
        const drop = Math.round((xx / (ew - 1)) * inner * 1);
        dot(x, ex - 2 + xx, ey + drop, pal.bossEye);
        dot(x, ex - 2 + xx, ey + 1 + drop, pal.bossEye);
      }
      // 竖瞳
      dot(x, ex, ey + inner, '#0a0206');
      dot(x, ex, ey + 1 + inner, '#0a0206');
      dot(x, ex - 2, ey + Math.round(inner * 0), '#fff6d8');
      // 怒眉
      for (let xx = -1; xx <= ew; xx++) {
        const drop = Math.round((xx / ew) * inner * 2);
        dot(x, ex - 2 + xx, ey - 2 + drop, pal.bossDark);
      }
      // 血红眼晕
      for (let yy = -3; yy <= eh + 2; yy++) {
        for (let xx = -3; xx <= ew + 1; xx++) {
          const border = yy === -3 || yy === eh + 2 || xx === -3 || xx === ew + 1;
          if (!border) continue;
          dot(x, ex - 2 + xx, ey + yy, 'rgba(255,40,35,0.20)');
        }
      }
    }

    // 巨口之中的战利品：一枚仍在燃烧的提灯
    if (seed % 2 === 1) {
      const lx = Math.round(cx), ly = Math.round(cy + baseR * 0.50);
      const glowR = 2.6;
      for (let yy = -3; yy <= 3; yy++) {
        for (let xx = -3; xx <= 3; xx++) {
          const d = Math.hypot(xx, yy * 1.1);
          if (d < glowR) dot(x, lx + xx, ly + yy, d < 1.4 ? '#fff6c8' : '#ffb347');
        }
      }
      dot(x, lx - 1, ly - 4, '#4a3520');
      dot(x, lx, ly - 4, '#4a3520');
    }

    // 细缝巨口 + 獠牙
    const my = Math.round(cy + baseR * 0.42);
    const mw = baseR * 0.72;
    for (let px = Math.round(cx - mw); px <= Math.round(cx + mw); px++) {
      const t = (px - cx) / mw;
      const yy = my + Math.round((1 - t * t) * 3);
      dot(x, px, yy, '#0a0206');
      dot(x, px, yy + 1, '#26070f');
      dot(x, px, yy - 1, 'rgba(90,20,35,0.7)');
    }
    for (let t = 0; t < 8; t++) {
      const px = Math.round(cx - mw * 0.82 + t * (mw * 1.64 / 7));
      const t2 = (px - cx) / mw;
      const yy = my + Math.round((1 - t2 * t2) * 3) + 1;
      dot(x, px, yy, '#efe3c4');
      dot(x, px, yy + 1, '#c2b28c');
    }

    // 底部垂须
    for (let t = 0; t < 6; t++) {
      const ox = cx + (t / 5 - 0.5) * baseR * 1.2;
      const len = Math.floor(baseR * (0.35 + R() * 0.5));
      let px = ox;
      for (let i = 0; i < len; i++) {
        px += (R() - 0.5) * 1.2;
        const py = cy + baseR * 0.7 + i;
        if (py >= size - 1) break;
        dot(x, Math.round(px), Math.round(py), i < 2 ? pal.boss : pal.bossDark);
        if (i < len * 0.4) dot(x, Math.round(px) + 1, Math.round(py), pal.bossDark);
      }
    }

    cv.w = size; cv.h = size;
    return cv;
  }

  /* ---------------------------------------------------------
     像素图标 (12x12)
     --------------------------------------------------------- */
  function mkIcon(fn) {
    const cv = document.createElement('canvas');
    cv.width = 12; cv.height = 12;
    const x = cv.getContext('2d');
    const P = (px, py, w, h, col) => { x.fillStyle = col; x.fillRect(px, py, w || 1, h || 1); };
    fn(P, x);
    return cv;
  }

  function makeIcons() {
    const O = '#0b0c14';
    const icons = {};
    // 星火弩：箭
    icons.bolt = mkIcon((P) => {
      P(2, 9, 2, 2, '#8b6b3a'); P(4, 8, 2, 2, '#c9a765'); P(6, 7, 2, 2, '#c9a765');
      P(7, 2, 2, 2, '#ffe9a8'); P(9, 3, 1, 1, '#ffd166'); P(9, 4, 1, 1, '#ffd166');
      P(8, 3, 1, 1, '#fff7d6'); P(7, 4, 1, 1, '#fff7d6');
      P(5, 9, 1, 1, '#ffe9a8'); P(9, 5, 1, 1, '#ffe9a8'); P(9, 2, 1, 1, '#ffd166');
    });
    // 月轮：环绕刀刃
    icons.orbit = mkIcon((P) => {
      P(6, 1, 1, 1, '#9fd8ff'); P(8, 2, 1, 1, '#d8f0ff'); P(9, 4, 1, 1, '#9fd8ff');
      P(9, 7, 1, 1, '#9fd8ff'); P(2, 3, 1, 1, '#6fa8d8'); P(2, 8, 1, 1, '#6fa8d8');
      P(4, 10, 1, 1, '#6fa8d8'); P(7, 10, 1, 1, '#6fa8d8');
      P(5, 3, 3, 1, '#e6f6ff'); P(5, 4, 1, 3, '#c8e8ff'); P(7, 4, 1, 3, '#ffffff');
      P(5, 6, 3, 1, '#c8e8ff');
    });
    // 涟漪：环
    icons.nova = mkIcon((P) => {
      P(5, 2, 2, 1, '#7fe0ff'); P(3, 4, 1, 1, '#7fe0ff'); P(8, 4, 1, 1, '#7fe0ff');
      P(2, 6, 1, 2, '#4fb8e8'); P(9, 6, 1, 2, '#4fb8e8');
      P(3, 9, 1, 1, '#7fe0ff'); P(8, 9, 1, 1, '#7fe0ff'); P(5, 11, 2, 1, '#4fb8e8');
      P(5, 5, 2, 2, '#ffffff');
    });
    // 电弧
    icons.spark = mkIcon((P) => {
      P(7, 1, 2, 1, '#fff3a0'); P(6, 2, 2, 2, '#ffd166'); P(5, 4, 2, 2, '#fff3a0');
      P(6, 6, 2, 2, '#ffd166'); P(4, 8, 2, 2, '#fff3a0'); P(3, 10, 2, 1, '#ffd166');
      P(9, 3, 1, 1, '#9fe6ff'); P(2, 6, 1, 1, '#9fe6ff');
    });
    // 萤火
    icons.ember = mkIcon((P) => {
      P(5, 2, 2, 2, '#ffe9a8'); P(4, 4, 4, 2, '#ffc75e'); P(4, 6, 4, 2, '#ff9c3a');
      P(5, 8, 2, 2, '#e8641f'); P(6, 1, 1, 1, '#fffbe8');
      P(2, 3, 1, 1, '#ffd166'); P(9, 5, 1, 1, '#ffd166'); P(2, 8, 1, 1, '#c94f18');
    });
    // 镰影
    icons.crescent = mkIcon((P) => {
      for (let i = 0; i < 6; i++) P(4 + i, 2 + i, 1, 1, '#cfe4ff');
      P(3, 4, 2, 1, '#9fbde0'); P(2, 6, 2, 1, '#9fbde0'); P(3, 8, 2, 1, '#9fbde0');
      P(5, 9, 1, 1, '#cfe4ff'); P(7, 8, 1, 1, '#6f8fb0'); P(9, 6, 1, 1, '#6f8fb0');
    });
    // --- 被动 ---
    icons.damage = mkIcon((P) => { // 剑
      P(8, 1, 2, 1, '#ffffff'); P(7, 2, 2, 1, '#e6eef8'); P(6, 3, 2, 1, '#c8d6e8');
      P(5, 4, 2, 1, '#c8d6e8'); P(4, 5, 2, 1, '#a8b8cc'); P(3, 6, 2, 1, '#a8b8cc');
      P(2, 7, 4, 2, '#c98f3a'); P(1, 9, 2, 2, '#8a5a24');
    });
    icons.speed = mkIcon((P) => { // 靴
      P(6, 1, 3, 5, '#7fd1a0'); P(3, 5, 6, 2, '#5aa87c'); P(2, 7, 8, 2, '#3f7a5a');
      P(1, 9, 10, 1, '#2d5c44'); P(1, 3, 1, 1, '#9fe6c0'); P(1, 5, 1, 1, '#9fe6c0');
    });
    icons.rate = mkIcon((P) => { // 沙漏
      P(3, 1, 6, 1, '#c9a765'); P(3, 10, 6, 1, '#c9a765');
      P(4, 2, 1, 3, '#ffd166'); P(7, 2, 1, 3, '#ffd166'); P(5, 5, 2, 2, '#ffe9a8');
      P(4, 7, 1, 3, '#ffd166'); P(7, 7, 1, 3, '#ffd166'); P(5, 7, 2, 1, '#ffe9a8');
    });
    icons.pickup = mkIcon((P) => { // 磁铁
      P(2, 2, 2, 5, '#c85a5a'); P(8, 2, 2, 5, '#c85a5a');
      P(2, 7, 8, 2, '#9a3f3f'); P(2, 9, 2, 1, '#e8e8f0'); P(8, 9, 2, 1, '#e8e8f0');
      P(5, 4, 2, 2, '#ffd166');
    });
    icons.hp = mkIcon((P) => {
      P(2, 3, 3, 2, '#ff6b7f'); P(7, 3, 3, 2, '#ff6b7f'); P(1, 4, 10, 3, '#ff6b7f');
      P(2, 7, 8, 2, '#e04a60'); P(3, 9, 6, 1, '#b02f45'); P(4, 5, 2, 1, '#ffb8c2');
    });
    icons.light = mkIcon((P) => { // 太阳
      P(5, 4, 2, 2, '#fffbe0'); P(4, 3, 4, 4, '#ffe9a8'); P(5, 5, 2, 1, '#ffffff');
      P(5, 0, 2, 2, '#ffd166'); P(5, 10, 2, 2, '#ffd166'); P(0, 5, 2, 2, '#ffd166'); P(10, 5, 2, 2, '#ffd166');
      P(1, 1, 2, 2, '#c98f3a'); P(9, 1, 2, 2, '#c98f3a'); P(1, 9, 2, 2, '#c98f3a'); P(9, 9, 2, 2, '#c98f3a');
    });
    icons.crit = mkIcon((P) => { // 星
      P(5, 0, 2, 3, '#fff3a0'); P(1, 2, 3, 2, '#ffd166'); P(8, 2, 3, 2, '#ffd166');
      P(2, 4, 3, 2, '#ffe9a8'); P(7, 4, 3, 2, '#ffe9a8'); P(4, 5, 4, 3, '#ffffff');
      P(3, 8, 2, 2, '#ffd166'); P(7, 8, 2, 2, '#ffd166'); P(5, 9, 2, 2, '#ffe9a8');
    });
    icons.armor = mkIcon((P) => { // 盾
      P(2, 1, 8, 1, '#8ea8c8'); P(1, 2, 10, 5, '#6f8bae'); P(2, 7, 8, 2, '#5a7396');
      P(3, 9, 6, 2, '#48607f'); P(5, 11, 2, 1, '#48607f');
      P(5, 2, 2, 6, '#c8dcf0'); P(4, 4, 4, 2, '#c8dcf0');
    });
    icons.regen = mkIcon((P) => { // 十字
      P(4, 1, 4, 10, '#6fd68a'); P(1, 4, 10, 4, '#6fd68a');
      P(4, 2, 2, 8, '#a8f0b8'); P(2, 5, 8, 2, '#a8f0b8');
    });
    icons.greed = mkIcon((P) => { // 硬币
      P(3, 2, 6, 8, '#ffd166'); P(2, 3, 8, 6, '#ffd166'); P(3, 3, 6, 1, '#fff3c4');
      P(5, 4, 2, 1, '#c98f3a'); P(5, 6, 2, 1, '#c98f3a'); P(4, 5, 4, 1, '#c98f3a');
      P(2, 9, 8, 1, '#c98f3a');
    });

    // --- v2 武器 ---
    icons.bell = mkIcon((P) => { // 圣钟
      P(5, 1, 2, 1, '#ffe9a8'); P(4, 2, 4, 2, '#ffd166'); P(3, 4, 6, 3, '#d9a441');
      P(2, 7, 8, 2, '#c98f3a'); P(5, 9, 2, 2, '#8a5a24'); P(5, 4, 2, 3, '#fff3c4');
      P(3, 5, 1, 1, '#ffe9a8'); P(8, 5, 1, 1, '#ffe9a8');
    });
    icons.spear = mkIcon((P) => { // 骨矛
      P(8, 0, 2, 2, '#f0ece0'); P(7, 2, 2, 2, '#d8d4c8'); P(6, 4, 2, 2, '#c0bcb0');
      P(5, 6, 2, 2, '#8a6234'); P(4, 8, 2, 2, '#6f4c28'); P(3, 10, 2, 1, '#6f4c28');
      P(7, 3, 1, 1, '#ffffff');
    });
    icons.frost = mkIcon((P) => { // 霜华
      P(5, 1, 2, 10, '#bfeaff'); P(1, 5, 10, 2, '#bfeaff');
      P(2, 2, 2, 2, '#e8f8ff'); P(8, 2, 2, 2, '#e8f8ff');
      P(2, 8, 2, 2, '#e8f8ff'); P(8, 8, 2, 2, '#e8f8ff');
      P(5, 5, 2, 2, '#ffffff');
    });
    // --- v2 被动 ---
    icons.thorns = mkIcon((P) => { // 棘刺
      P(5, 0, 2, 4, '#a8e08a'); P(5, 8, 2, 4, '#a8e08a');
      P(0, 5, 4, 2, '#a8e08a'); P(8, 5, 4, 2, '#a8e08a');
      P(2, 2, 3, 3, '#7fc06a'); P(7, 2, 3, 3, '#7fc06a');
      P(2, 7, 3, 3, '#7fc06a'); P(7, 7, 3, 3, '#7fc06a');
      P(5, 5, 2, 2, '#e8ffd8');
    });
    icons.oil = mkIcon((P) => { // 油瓶
      P(5, 0, 2, 2, '#c9a765'); P(4, 2, 4, 2, '#e8d8b0'); P(3, 4, 6, 6, '#ffae3c');
      P(4, 6, 4, 3, '#ffe9a8'); P(3, 9, 6, 2, '#c97a1a');
    });
    icons.shield = mkIcon((P) => { // 护盾
      P(4, 1, 4, 1, '#9fe8ff'); P(2, 2, 8, 5, '#6fc0e8'); P(3, 7, 6, 2, '#4f9cc8');
      P(4, 9, 4, 2, '#3a7ca8'); P(5, 3, 2, 5, '#e8faff');
    });
    icons.luck = mkIcon((P) => { // 四叶
      P(4, 1, 3, 3, '#6fd68a'); P(7, 4, 3, 3, '#6fd68a');
      P(1, 4, 3, 3, '#6fd68a'); P(4, 7, 3, 3, '#6fd68a');
      P(5, 8, 1, 3, '#4f9c68'); P(5, 5, 1, 1, '#e8ffd8');
    });
    icons.chest = mkIcon((P) => { // 宝箱
      P(1, 3, 10, 2, '#ffd166'); P(1, 5, 10, 5, '#8a6234');
      P(1, 5, 1, 4, '#6f4c28'); P(10, 5, 1, 4, '#6f4c28');
      P(5, 4, 2, 3, '#fff3c4'); P(2, 7, 2, 1, '#c9a765'); P(8, 7, 2, 1, '#c9a765');
      P(1, 9, 10, 1, '#5a3f12');
    });
    icons.relic = mkIcon((P) => { // 圣物通用
      P(5, 0, 2, 3, '#ffe9a8'); P(3, 3, 6, 4, '#ffd166'); P(4, 7, 4, 3, '#c98f3a');
      P(5, 4, 2, 3, '#fffbe8'); P(2, 9, 8, 1, '#8a6234');
    });

    icons.dash = mkIcon((P) => {
      P(1, 3, 4, 1, '#8fd8f0'); P(3, 5, 6, 1, '#c8f0ff'); P(0, 7, 5, 1, '#8fd8f0');
      P(5, 2, 4, 1, '#6fb8d8');
    });
    return icons;
  }

  /* ---------------------------------------------------------
     组装
     --------------------------------------------------------- */
  ART.SPR = null;


  // 12 位层主的独立造型参数（体型 / 附属 / 眼睛 / 嘴 / 角）
  const BOSS_LOOKS = [
    { body: 'round',  back: 'chain',     eyes: 3, mouth: 1, horns: 2, seed: 3 },
    { body: 'tall',   back: 'spikes',    eyes: 1, mouth: 0, horns: 2, seed: 13 },
    { body: 'bell',   back: 'crown',     eyes: 4, mouth: 0, horns: 0, seed: 23 },
    { body: 'blob',   back: 'tendrils',  eyes: 2, mouth: 1, horns: 0, seed: 33 },
    { body: 'round',  back: 'crown',     eyes: 3, mouth: 0, horns: 0, seed: 43 },
    { body: 'diamond', back: 'halo',     eyes: 2, mouth: 0, horns: 0, seed: 53 },
    { body: 'diamond', back: 'pendulum', eyes: 1, mouth: 0, horns: 0, seed: 63 },
    { body: 'square', back: 'wings',     eyes: 4, mouth: 1, horns: 2, seed: 73 },
    { body: 'blob',   back: 'legs',      eyes: 6, mouth: 1, horns: 0, seed: 83 },
    { body: 'star',   back: 'spikes',    eyes: 1, mouth: 0, horns: 0, seed: 93 },
    { body: 'mirror', back: 'shards',    eyes: 2, mouth: 0, horns: 0, seed: 103 },
    { body: 'lantern', back: 'chain',    eyes: 1, mouth: 0, horns: 0, seed: 113 },
  ];
  ART.BOSS_LOOKS = BOSS_LOOKS;

  function bpEllipse(c, cx, cy, rx, ry, col) {
    c.fillStyle = col;
    const rX = Math.max(1, Math.round(rx)), rY = Math.max(1, Math.round(ry));
    for (let dy = -rY; dy <= rY; dy++) {
      const k = 1 - (dy * dy) / (rY * rY);
      if (k <= 0) continue;
      const w = Math.round(rX * Math.sqrt(k));
      c.fillRect(Math.round(cx - w), Math.round(cy + dy), Math.max(1, w * 2), 1);
    }
  }

  // 逐帧层主：0 待机 / 1 呼吸眨眼 / 2 出手张口
  function makeBossVariant(size, look, pal, phase) {
    const S = size + 18;              // 留出角/翅膀/触须的空间
    const cv = document.createElement('canvas');
    cv.width = S; cv.height = S;
    const c = cv.getContext('2d');
    const cx = S / 2, cy = S / 2 + S * 0.03;
    const B = size * 0.31;
    const sway = phase === 1 ? 1 : 0;
    const open = phase === 2;
    const N = Math.PI * 2;

    c.globalAlpha = 0.16;
    bpEllipse(c, cx, cy + 2, B * 1.5, B * 1.2, pal.bossDark);
    c.globalAlpha = 1;

    if (look.back === 'tendrils') {
      c.strokeStyle = pal.bossDark; c.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        c.beginPath();
        c.moveTo(cx + (i - 2.5) * 3, cy + B * 0.4);
        c.quadraticCurveTo(cx + (i - 2.5) * 10, cy + B * 1.1, cx + (i - 2.5) * 14 + sway, cy + B * 1.45);
        c.stroke();
      }
    } else if (look.back === 'wings') {
      c.fillStyle = pal.bossDark;
      for (const sgn of [-1, 1]) {
        c.beginPath();
        c.moveTo(cx + sgn * B * 0.5, cy - B * 0.3);
        c.lineTo(cx + sgn * B * 1.7, cy - B * 0.7 - sway);
        c.lineTo(cx + sgn * B * 1.5, cy + B * 0.5);
        c.lineTo(cx + sgn * B * 0.6, cy + B * 0.3);
        c.closePath(); c.fill();
      }
    } else if (look.back === 'legs') {
      c.strokeStyle = pal.bossDark; c.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        for (const sgn of [-1, 1]) {
          c.beginPath();
          c.moveTo(cx + sgn * B * 0.4, cy + B * 0.5);
          c.lineTo(cx + sgn * (B * 1.0 + i * 3), cy + B * (1.1 + (i % 2) * 0.15) + sway);
          c.stroke();
        }
      }
    } else if (look.back === 'spikes') {
      c.fillStyle = pal.bossDark;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * N;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * B * 0.9, cy + Math.sin(a) * B * 0.8);
        c.lineTo(cx + Math.cos(a) * B * 1.5, cy + Math.sin(a) * B * 1.3);
        c.lineTo(cx + Math.cos(a + 0.25) * B * 0.9, cy + Math.sin(a + 0.25) * B * 0.8);
        c.closePath(); c.fill();
      }
    } else if (look.back === 'halo') {
      c.strokeStyle = pal.bossEye; c.globalAlpha = 0.5; c.lineWidth = 1;
      c.beginPath(); c.ellipse(cx, cy - B * 1.1, B * 1.1, B * 0.28, 0, 0, N); c.stroke();
      c.globalAlpha = 1;
    } else if (look.back === 'crown') {
      c.fillStyle = pal.bossEye;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(cx - B * 0.7 + i * B * 0.7, cy - B * 0.9);
        c.lineTo(cx - B * 0.5 + i * B * 0.7, cy - B * 1.4 - sway);
        c.lineTo(cx - B * 0.3 + i * B * 0.7, cy - B * 0.9);
        c.closePath(); c.fill();
      }
    } else if (look.back === 'pendulum') {
      c.strokeStyle = pal.bossEye; c.lineWidth = 2;
      const px2 = cx + Math.sin(phase * 0.8 + 0.6) * B * 0.8;
      c.beginPath(); c.moveTo(cx, cy + B * 0.3); c.lineTo(px2, cy + B * 1.35); c.stroke();
      c.fillStyle = pal.bossEye; c.fillRect(Math.round(px2) - 2, Math.round(cy + B * 1.35) - 2, 5, 5);
    } else if (look.back === 'chain') {
      c.strokeStyle = pal.bossDark; c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx, 0); c.lineTo(cx, cy - B * 0.95); c.stroke();
    } else if (look.back === 'shards') {
      c.fillStyle = pal.bossHi;
      for (let i = 0; i < 4; i++) {
        const a = -0.8 + i * 0.5;
        c.fillRect(cx + Math.cos(a) * B * 1.25, cy - B * 0.4 + Math.sin(a) * B * 0.6, 2, 6);
      }
    }

    if (look.body === 'round' || look.body === 'blob') {
      const rx = B * (look.body === 'blob' ? 1.15 : 0.98);
      const ry = B * (look.body === 'blob' ? 0.72 : 0.9);
      bpEllipse(c, cx, cy, rx, ry, pal.boss);
      bpEllipse(c, cx, cy - B * 0.08, rx * 0.8, ry * 0.72, pal.bossHi);
    } else if (look.body === 'tall') {
      bpEllipse(c, cx, cy, B * 0.68, B * 1.18, pal.boss);
      bpEllipse(c, cx, cy - B * 0.15, B * 0.5, B * 0.85, pal.bossHi);
    } else if (look.body === 'bell') {
      for (let i = 0; i < B * 1.6; i++) {
        const w = B * (0.42 + i / (B * 2.4));
        c.fillStyle = i < B * 0.5 ? pal.bossHi : pal.boss;
        c.fillRect(Math.round(cx - w), Math.round(cy - B + i), Math.max(1, Math.round(w * 2)), 1);
      }
    } else if (look.body === 'square') {
      c.fillStyle = pal.boss; c.fillRect(cx - B, cy - B, B * 2, B * 2);
      c.fillStyle = pal.bossHi; c.fillRect(cx - B * 0.75, cy - B * 0.78, B * 1.5, B * 1.25);
    } else if (look.body === 'diamond') {
      c.fillStyle = pal.boss;
      c.beginPath(); c.moveTo(cx, cy - B * 1.2); c.lineTo(cx + B, cy); c.lineTo(cx, cy + B * 1.05); c.lineTo(cx - B, cy); c.closePath(); c.fill();
      c.fillStyle = pal.bossHi;
      c.beginPath(); c.moveTo(cx, cy - B * 0.85); c.lineTo(cx + B * 0.55, cy); c.lineTo(cx, cy + B * 0.7); c.lineTo(cx - B * 0.55, cy); c.closePath(); c.fill();
    } else if (look.body === 'star') {
      c.fillStyle = pal.boss;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * N + (phase === 1 ? 0.1 : 0);
        c.beginPath();
        c.moveTo(cx + Math.cos(a - 0.2) * B * 0.7, cy + Math.sin(a - 0.2) * B * 0.7);
        c.lineTo(cx + Math.cos(a) * B * 1.45, cy + Math.sin(a) * B * 1.25);
        c.lineTo(cx + Math.cos(a + 0.2) * B * 0.7, cy + Math.sin(a + 0.2) * B * 0.7);
        c.closePath(); c.fill();
      }
      bpEllipse(c, cx, cy, B * 0.9, B * 0.9, pal.boss);
      bpEllipse(c, cx, cy, B * 0.55, B * 0.55, pal.bossHi);
    } else if (look.body === 'mirror') {
      c.fillStyle = pal.boss; c.fillRect(cx - B * 0.7, cy - B * 1.15, B * 1.4, B * 2.1);
      c.fillStyle = pal.bossHi;
      c.beginPath(); c.moveTo(cx - B * 0.45, cy - B); c.lineTo(cx + B * 0.45, cy - B * 0.6); c.lineTo(cx - B * 0.1, cy + B * 0.9); c.closePath(); c.fill();
    } else if (look.body === 'lantern') {
      bpEllipse(c, cx, cy, B * 0.75, B * 0.9, pal.boss);
      c.fillStyle = pal.bossHi; c.fillRect(cx - B * 0.4, cy - B * 0.5, B * 0.8, B * 0.9);
      c.fillStyle = pal.bossEye;
      const fh = open ? 7 : 5;
      c.fillRect(Math.round(cx) - 2, Math.round(cy - B * 0.85 - fh + (phase === 1 ? 1 : 0)), 4, fh);
      c.fillStyle = '#fff6d0'; c.fillRect(Math.round(cx) - 1, Math.round(cy - B * 0.85 - fh + 2), 2, 2);
    }

    const eyeY = cy - B * 0.15;
    for (let i = 0; i < look.eyes; i++) {
      const spread = look.eyes === 1 ? 0 : (i / (look.eyes - 1) - 0.5) * B * 1.1;
      const ex = cx + spread;
      const ey = eyeY + (look.eyes > 4 ? ((i % 2) * B * 0.3 - B * 0.15) : 0);
      const eh = phase === 1 ? 1 : 2;
      c.fillStyle = pal.bossEye;
      c.fillRect(Math.round(ex) - 1, Math.round(ey), 3, eh);
      c.fillStyle = '#ffffff';
      c.fillRect(Math.round(ex), Math.round(ey), 1, 1);
    }
    if (look.mouth) {
      c.fillStyle = pal.bossDeep;
      const mw = open ? B * 0.7 : B * 0.5;
      c.fillRect(Math.round(cx - mw / 2), Math.round(cy + B * 0.3), Math.round(mw), open ? 5 : 3);
      if (open) {
        c.fillStyle = pal.bossHi;
        for (let i = 0; i < 4; i++) c.fillRect(Math.round(cx - mw / 2 + 2 + i * 4), Math.round(cy + B * 0.3), 1, 2);
      }
    }
    for (let i = 0; i < (look.horns || 0); i++) {
      const sgn = look.horns === 1 ? 1 : (i / (look.horns - 1)) * 2 - 1;
      const hx = cx + sgn * B * 0.55;
      c.fillStyle = pal.bossDark;
      c.beginPath();
      c.moveTo(hx - 2, cy - B * 0.78);
      c.lineTo(hx, cy - B * (1.2 + (look.hornLen || 0)) - sway);
      c.lineTo(hx + 2, cy - B * 0.78);
      c.closePath(); c.fill();
    }
    bpEllipse(c, cx, cy + B * 0.95, B * 0.9, B * 0.16, pal.bossDeep);
    return cv;
  }

  ART.build = function () {
    const P = P_PAL;
    const SPR = {
      pDown: [mk(P_DOWN_0, P), mk(P_DOWN_1, P)],
      pUp: [mk(P_UP_0, P), mk(P_UP_1, P)],
      pSide: [mk(P_SIDE_0, P), mk(P_SIDE_1, P)],
      lantern: mk(LANTERN, LANTERN_PAL),

      bat: [mk(BAT_A, BAT_PAL), mk(BAT_B, BAT_PAL)],
      crawler: [mk(CR_A, CR_PAL), mk(CR_B, CR_PAL)],
      spitter: [mk(SP_A, SP_PAL), mk(SP_B, SP_PAL)],
      brute: [mk(BR_A, BR_PAL), mk(BR_B, BR_PAL)],
      ghost: [mk(GH_A, GH_PAL), mk(GH_B, GH_PAL)],
      wisp: makeWisp(),

      archer: [mk(ARCHER_A, ARCHER_PAL), mk(ARCHER_B, ARCHER_PAL)],
      leech: [mk(LEECH_A, LEECH_PAL), mk(LEECH_B, LEECH_PAL)],
      shade: [mk(SHADE_A, SHADE_PAL), mk(SHADE_B, SHADE_PAL)],
      bomber: [mk(BOMBER_A, BOMBER_PAL), mk(BOMBER_B, BOMBER_PAL)],
      summoner: [mk(SUMMONER_A, SUMMONER_PAL), mk(SUMMONER_B, SUMMONER_PAL)],
      chest: mk(CHEST, CHEST_PAL),


      heart: mk(HEART, HEART_PAL),
      crown: mk(CROWN, CROWN_PAL),

      grave: mk(GRAVE, GRAVE_PAL),
      rock: mk(ROCK, ROCK_PAL),
      mush: mk(MUSH, MUSH_PAL),
      fern: mk(FERN, FERN_PAL),
      bones: mk(BONES, BONES_PAL),
      flower: mk(FLOWER, FLOWER_PAL),
      deadtree: mk(DEADTREE, DEADTREE_PAL),
    };
    SPR.pSideL = [flipped(SPR.pSide[0]), flipped(SPR.pSide[1])];
    SPR.boss1 = makeBoss(40, 7, { out: C.out, bossHi: '#e08a92', boss: '#93354e', bossDark: '#4d172d', bossDeep: '#2a0a16', bossEye: '#ff8a4a' });
    SPR.boss2 = makeBoss(48, 21, { out: C.out, bossHi: '#c07ade', boss: '#6f3492', bossDark: '#3a1650', bossDeep: '#210b30', bossEye: '#ff6ae0' });
    SPR.boss3 = makeBoss(44, 33, { out: C.out, bossHi: '#c9b8ff', boss: '#6a4aa0', bossDark: '#33204f', bossDeep: '#1a0f2b', bossEye: '#7fe0ff' });

    // 12 层主：每层三位，配色 / 体型 / 眼睛都不同
    ART.BOSS_PALETTES = [
      { hi: '#ffcf8a', main: '#e08a3a', dark: '#7d3d18', deep: '#3a1a08', eye: '#ff8a4a' }, // 灯笼吞噬者
      { hi: '#e8c2a0', main: '#a8795a', dark: '#5a3a26', deep: '#2a160c', eye: '#ffb37a' }, // 灰烬守夜人
      { hi: '#f0d68a', main: '#b08a3a', dark: '#5c4618', deep: '#2a1e08', eye: '#ffe066' }, // 钟楼执事
      { hi: '#c9b8ff', main: '#6a4aa0', dark: '#33204f', deep: '#1a0f2b', eye: '#ff6ae0' }, // 深黯之母
      { hi: '#b8f0a0', main: '#4a9a4a', dark: '#1e4a26', deep: '#0c2410', eye: '#9aff6a' }, // 沼泽主教
      { hi: '#a8e8e0', main: '#3a8a8a', dark: '#164444', deep: '#082020', eye: '#8ff0ff' }, // 沉钟行者
      { hi: '#c9e8ff', main: '#4a7ac0', dark: '#1c345c', deep: '#0a1628', eye: '#7fe0ff' }, // 节拍收藏家
      { hi: '#f0d8a0', main: '#b09050', dark: '#5c4a24', deep: '#2a200c', eye: '#ffe9a8' }, // 风蚀巨像
      { hi: '#c0d0c8', main: '#6a8a7a', dark: '#2e4438', deep: '#122018', eye: '#a8ffe0' }, // 断桥织网者
      { hi: '#ff9a9a', main: '#a03040', dark: '#4a1020', deep: '#1c060c', eye: '#ff4050' }, // 长夜之核
      { hi: '#e8eef8', main: '#8a96b0', dark: '#3a4458', deep: '#161c28', eye: '#d8f4ff' }, // 镜之守夜人
      { hi: '#ffe0a0', main: '#3a3020', dark: '#18140c', deep: '#080604', eye: '#ffcf6e' }, // 提灯者的倒影
    ];
    SPR.bossFrames = [];
    for (let bi = 0; bi < ART.BOSS_PALETTES.length; bi++) {
      const bp = ART.BOSS_PALETTES[bi];
      const pl = { out: C.out, bossHi: bp.hi, boss: bp.main, bossDark: bp.dark, bossDeep: bp.deep, bossEye: bp.eye };
      const frames = [];
      for (let ph = 0; ph < 3; ph++) frames.push(makeBossVariant(64 + (bi % 3) * 4, ART.BOSS_LOOKS[bi], pl, ph));
      SPR.bossFrames.push(frames);
    }
    SPR.bosses = SPR.bossFrames.map(function (f) { return f[0]; });
    SPR.icons = makeIcons();

    // 精英染色
    SPR.eliteTint = {};
    ART.SPR = SPR;
    ART.ready = true;
    return SPR;
  };

  // 染色缓存
  const tintCache = new Map();
  ART.cacheSizes = function () { return { text: textCache.size, tint: tintCache.size }; };
  ART.tint = function (cv, color, alpha) {
    const key = cv.uid + color + alpha;
    if (cv.uid === undefined) cv.uid = 's' + Math.random().toString(36).slice(2);
    let out = tintCache.get(key);
    if (out) return out;
    out = document.createElement('canvas');
    out.width = cv.width; out.height = cv.height;
    const x = out.getContext('2d');
    x.drawImage(cv, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    x.globalAlpha = alpha;
    x.fillStyle = color;
    x.fillRect(0, 0, out.width, out.height);
    out.w = cv.width; out.h = cv.height;
    tintCache.set(key, out);
    if (tintCache.size > 80) tintCache.delete(tintCache.keys().next().value);
    return out;
  };

  /* ---------------------------------------------------------
     字体：Zpix 12px + 缓存缩放
     --------------------------------------------------------- */
  const FONT = 'Zpix, monospace';
  const textCache = new Map();
  ART.fontReady = false;

  ART.loadFont = function () {
    if (!document.fonts) { ART.fontReady = true; return Promise.resolve(); }
    return document.fonts.load('12px Zpix').then(() => {
      return document.fonts.ready;
    }).then(() => {
      ART.fontReady = true;
      textCache.clear();   // 避免加载完成前用回退字体缓存下来的错位文本
    });
  };

  function renderText(text, color, scale) {
    const key = text + '|' + color + '|' + scale;
    let c = textCache.get(key);
    if (c) return c;
    const tmp = document.createElement('canvas');
    const tx = tmp.getContext('2d');
    tx.font = `12px ${FONT}`;
    const w = Math.max(1, Math.ceil(tx.measureText(text).width));
    const pad = 2;
    tmp.width = w + pad * 2;
    tmp.height = 16;
    const x = tmp.getContext('2d');
    x.font = `12px ${FONT}`;
    x.textBaseline = 'top';
    x.fillStyle = color;
    x.fillText(text, pad, 2);

    const out = document.createElement('canvas');
    out.width = tmp.width * scale;
    out.height = tmp.height * scale;
    const ox = out.getContext('2d');
    ox.imageSmoothingEnabled = false;
    ox.drawImage(tmp, 0, 0, out.width, out.height);
    out.ratio = out.width / w;
    out.textW = w * scale;
    out.padPx = pad * scale;
    textCache.set(key, out);
    // 动态字符串（计时器、击杀数）不能无限撑大缓存
    if (textCache.size > 600) textCache.delete(textCache.keys().next().value);
    return out;
  }

  /* 绘制像素文字
     opts: { color, scale, align: 'left'|'center'|'right', shadow, shadowColor, baseline:'top' } */
  ART.text = function (ctx, str, x, y, opts) {
    if (str === undefined || str === null) return 0;
    str = String(str);
    const o = opts || {};
    const scale = o.scale || 1;
    const color = o.color || '#e8eef8';
    const img = renderText(str, color, scale);
    let dx = x;
    if (o.align === 'center') dx = x - img.textW / 2;
    else if (o.align === 'right') dx = x - img.textW;
    dx = Math.round(dx) - img.padPx;
    const dy = Math.round(y);
    if (o.shadow) {
      const sh = renderText(str, o.shadowColor || '#07080e', scale);
      let sx = dx + (o.shadowOff || 2) * scale;
      let sy = dy + (o.shadowOff || 2) * scale;
      ctx.drawImage(sh, Math.round(sx), Math.round(sy));
    }
    ctx.drawImage(img, dx, dy);
    return img.textW / scale;
  };

  ART.textWidth = function (str, scale) {
    const img = renderText(String(str), '#fff', scale || 1);
    return img.textW / (scale || 1);
  };

  /* ---------------------------------------------------------
     3x5 微型数字字体（伤害数字 / 小标签）
     --------------------------------------------------------- */
  const TINY = {
    '0': ['###', '# #', '# #', '# #', '###'],
    '1': [' # ', '## ', ' # ', ' # ', '###'],
    '2': ['###', '  #', '###', '#  ', '###'],
    '3': ['###', '  #', '###', '  #', '###'],
    '4': ['# #', '# #', '###', '  #', '  #'],
    '5': ['###', '#  ', '###', '  #', '###'],
    '6': ['###', '#  ', '###', '# #', '###'],
    '7': ['###', '  #', '  #', '  #', '  #'],
    '8': ['###', '# #', '###', '# #', '###'],
    '9': ['###', '# #', '###', '  #', '###'],
    '+': ['   ', ' # ', '###', ' # ', '   '],
    '-': ['   ', '   ', '###', '   ', '   '],
    'x': ['   ', '# #', ' # ', '# #', '   '],
    '!': [' # ', ' # ', ' # ', '   ', ' # '],
    'k': ['#  ', '# #', '## ', '# #', '# #'],
    ':': ['   ', ' # ', '   ', ' # ', '   '],
    '%': ['# #', '  #', ' # ', '#  ', '# #'],
  };
  ART.tiny = function (ctx, str, x, y, color, scale) {
    scale = scale || 1;
    const s = String(str);
    let cx = x;
    ctx.fillStyle = color;
    for (let i = 0; i < s.length; i++) {
      const g = TINY[s[i]];
      if (!g) { cx += 4 * scale; continue; }
      for (let row = 0; row < 5; row++) {
        const line = g[row];
        for (let col = 0; col < 3; col++) {
          if (line[col] === '#') ctx.fillRect(cx + col * scale, y + row * scale, scale, scale);
        }
      }
      cx += 4 * scale;
    }
    return (cx - x) / scale;
  };
  ART.tinyWidth = function (str, scale) { return String(str).length * 4 * (scale || 1); };
})();
