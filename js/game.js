/* =========================================================
   提灯者 LAMPLIT — 主程序
   ========================================================= */
(function () {
  'use strict';

  const G = window.G, ART = window.ART, AUDIO = window.AUDIO, WORLD = window.WORLD, META = window.META;
  const STORY = window.STORY;
  const D = window.DUNGEON;
  const clamp = G.clamp, lerp = G.lerp, rand = G.rand, randInt = G.randInt,
    dist = G.dist, dist2 = G.dist2, angleTo = G.angleTo, TAU = G.TAU;
  const Input = G.Input;

  const W = 384, H = 216;
  const DURATION = 330;      // 5:30
  const BOSS1_AT = 150;
  const BOSS2_AT = 300;
  const ENDLESS_STEP = 95;   // 无尽夜：每 95 秒再来一位看守者

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let SPR = null;
  let menuScale = 2;

  function resize() {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    menuScale = Math.max(1, Math.floor(s));
    canvas.style.width = W * menuScale + 'px';
    canvas.style.height = H * menuScale + 'px';
  }

  /* =========================================================
     数据表
     ========================================================= */
  const CHARS = {
    lamp: {
      id: 'lamp', name: '提灯者', tag: '灯火通明 · 均衡',
      hp: 40, speed: 68, weapon: 'bolt', light: 1.18,
      color: '#ffc36b',
      note: '灯光更亮\n拾取更远',
    },
    grave: {
      id: 'grave', name: '守墓人', tag: '近战镰影 · 稳健',
      hp: 40, speed: 60, weapon: 'crescent', light: 0.95,
      color: '#9fd8ff',
      note: '镰影起手 · 贴身连斩',
      unlock: 'boss',
    },
    ranger: {
      id: 'ranger', name: '游侠', tag: '轻捷身形 · 萤火',
      hp: 40, speed: 79, weapon: 'ember', light: 1.02,
      color: '#a8f0b8',
      note: '移速更快\n萤火起手',
      unlock: 'win',
    },
  };

  const WEAPONS = {
    bolt: {
      name: '星火弩', icon: 'bolt', max: 5,
      info: [
        '自动向最近的敌人射出星火箭',
        '伤害 8→10，射速加快',
        '同时射出 2 支星火',
        '伤害提升，箭矢可穿透 1 个敌人',
        '三连射，伤害大幅提升',
      ],
      stats: [
        { cd: 0.92, dmg: 9, spd: 205, n: 1, pierce: 0 },
        { cd: 0.80, dmg: 11, spd: 215, n: 1, pierce: 0 },
        { cd: 0.80, dmg: 11, spd: 220, n: 2, pierce: 0 },
        { cd: 0.70, dmg: 14, spd: 240, n: 2, pierce: 1 },
        { cd: 0.58, dmg: 18, spd: 260, n: 3, pierce: 1 },
      ],
    },
    orbit: {
      name: '月轮', icon: 'orbit', max: 5,
      info: [
        '银月刀轮环绕己身，触碰即伤',
        '刀轮 +1，伤害提升',
        '刀轮转速与半径提升',
        '刀轮 +1，伤害提升',
        '四轮环舞，伤害与范围大增',
      ],
      stats: [
        { dmg: 8, n: 1, r: 26, rot: 2.4, cd: 0.42 },
        { dmg: 10, n: 2, r: 27, rot: 2.6, cd: 0.4 },
        { dmg: 12, n: 2, r: 31, rot: 3.0, cd: 0.36 },
        { dmg: 16, n: 3, r: 32, rot: 3.4, cd: 0.32 },
        { dmg: 21, n: 4, r: 36, rot: 3.8, cd: 0.28 },
      ],
    },
    nova: {
      name: '涟漪', icon: 'nova', max: 5,
      info: [
        '周期性释放冲击波纹，震退敌群',
        '波纹范围与伤害提升',
        '波纹范围与伤害提升',
        '波纹范围与伤害提升',
        '双重重波，范围极大',
      ],
      stats: [
        { cd: 2.6, dmg: 11, r: 42, n: 1 },
        { cd: 2.4, dmg: 15, r: 48, n: 1 },
        { cd: 2.2, dmg: 19, r: 54, n: 1 },
        { cd: 2.0, dmg: 24, r: 60, n: 1 },
        { cd: 1.75, dmg: 30, r: 68, n: 2 },
      ],
    },
    spark: {
      name: '电弧', icon: 'spark', max: 5,
      info: [
        '电弧在敌人之间跳跃',
        '连锁 +1，伤害提升',
        '连锁 +1，伤害提升',
        '连锁 +1，跳跃更远',
        '连锁 6 次，伤害大幅提升',
      ],
      stats: [
        { cd: 1.7, dmg: 8, chain: 2, range: 95 },
        { cd: 1.55, dmg: 10, chain: 3, range: 98 },
        { cd: 1.4, dmg: 12, chain: 4, range: 102 },
        { cd: 1.3, dmg: 15, chain: 5, range: 112 },
        { cd: 1.12, dmg: 19, chain: 6, range: 122 },
      ],
    },
    ember: {
      name: '萤火', icon: 'ember', max: 5,
      info: [
        '放飞追猎的萤火，触敌爆裂',
        '萤火 +1，伤害提升',
        '爆炸范围扩大，伤害提升',
        '萤火 +1，伤害提升',
        '四只萤火，爆裂范围极大',
      ],
      stats: [
        { cd: 1.55, dmg: 7, n: 1, blast: 17 },
        { cd: 1.45, dmg: 9, n: 2, blast: 18 },
        { cd: 1.35, dmg: 12, n: 2, blast: 22 },
        { cd: 1.2, dmg: 15, n: 3, blast: 24 },
        { cd: 1.02, dmg: 19, n: 4, blast: 28 },
      ],
    },
    bell: {
      name: '圣钟', icon: 'bell', max: 5,
      info: [
        '敲响钟声，声波扩散并拖慢敌人',
        '声波范围与伤害提升',
        '声波范围与伤害提升，减速更久',
        '声波范围与伤害提升',
        '双声波叠加，范围极大',
      ],
      stats: [
        { cd: 3.0, dmg: 10, r: 40, slow: 0.55, slowT: 1.6, n: 1 },
        { cd: 2.8, dmg: 13, r: 46, slow: 0.5, slowT: 1.8, n: 1 },
        { cd: 2.6, dmg: 17, r: 52, slow: 0.45, slowT: 2.0, n: 1 },
        { cd: 2.4, dmg: 22, r: 58, slow: 0.42, slowT: 2.2, n: 1 },
        { cd: 2.1, dmg: 28, r: 66, slow: 0.38, slowT: 2.4, n: 2 },
      ],
    },
    spear: {
      name: '骨矛', icon: 'spear', max: 5,
      info: [
        '向最近的敌人掷出穿透骨矛',
        '伤害提升，矛身更长',
        '投出两支骨矛',
        '伤害大幅提升，穿透更强',
        '三支骨矛依次贯穿',
      ],
      stats: [
        { cd: 1.5, dmg: 16, spd: 260, n: 1, pierce: 2, len: 16 },
        { cd: 1.4, dmg: 21, spd: 275, n: 1, pierce: 3, len: 18 },
        { cd: 1.3, dmg: 24, spd: 285, n: 2, pierce: 3, len: 18 },
        { cd: 1.15, dmg: 32, spd: 300, n: 2, pierce: 4, len: 22 },
        { cd: 1.0, dmg: 40, spd: 320, n: 3, pierce: 5, len: 26 },
      ],
    },
    frost: {
      name: '霜华', icon: 'frost', max: 5,
      info: [
        '寒气环身，周期性冻结近敌',
        '范围与伤害提升',
        '范围与伤害提升，减速更狠',
        '范围与伤害提升',
        '冰环爆发，短暂定身',
      ],
      stats: [
        { cd: 1.8, dmg: 8, r: 34, slow: 0.6, slowT: 1.2, stun: 0 },
        { cd: 1.7, dmg: 11, r: 38, slow: 0.55, slowT: 1.4, stun: 0 },
        { cd: 1.6, dmg: 14, r: 42, slow: 0.45, slowT: 1.6, stun: 0 },
        { cd: 1.5, dmg: 18, r: 46, slow: 0.42, slowT: 1.8, stun: 0 },
        { cd: 1.3, dmg: 23, r: 52, slow: 0.3, slowT: 2.2, stun: 0.35 },
      ],
    },
    crescent: {
      name: '镰影', icon: 'crescent', max: 5,
      info: [
        '朝面前挥出月牙斩，范围伤害',
        '伤害与范围提升',
        '伤害与范围提升，挥砍更快',
        '弧光更宽，伤害提升',
        '大范围斩击，伤害极高',
      ],
      stats: [
        { cd: 1.0, dmg: 14, reach: 34, arc: 2.1 },
        { cd: 0.94, dmg: 18, reach: 38, arc: 2.2 },
        { cd: 0.84, dmg: 23, reach: 42, arc: 2.4 },
        { cd: 0.78, dmg: 29, reach: 47, arc: 2.8 },
        { cd: 0.68, dmg: 37, reach: 54, arc: 3.2 },
      ],
    },
  };

  // 进化形态：满级武器 + 对应被动 3 级 → 出现在升级卡里
  const EVOLUTIONS = {
    stormbolt: {
      name: '星火风暴', icon: 'bolt', base: 'bolt', req: { passive: 'rhythm', lvl: 3 }, max: 1,
      info: ['进化：星火弩满级 + 韵律 3 级', '五连追踪星火，射速极快'],
      stats: [{ cd: 0.42, dmg: 15, spd: 240, n: 4, pierce: 1 }],
    },
    bloodmoon: {
      name: '血月环', icon: 'orbit', base: 'orbit', req: { passive: 'blade', lvl: 3 }, max: 1,
      info: ['进化：月轮满级 + 锋刃 3 级', '六轮环舞，命中造成流血'],
      stats: [{ dmg: 24, n: 6, r: 44, rot: 4.2, cd: 0.24 }],
    },
    tide: {
      name: '潮汐', icon: 'nova', base: 'nova', req: { passive: 'crit', lvl: 3 }, max: 1,
      info: ['进化：涟漪满级 + 会心 3 级', '三重冲击波，震退并短暂定身'],
      stats: [{ cd: 1.4, dmg: 34, r: 82, n: 3 }],
    },
    judgment: {
      name: '断罪镰', icon: 'crescent', base: 'crescent', req: { passive: 'vitality', lvl: 3 }, max: 1,
      info: ['进化：镰影满级 + 生命 3 级', '超长斩击，命中回复生命'],
      stats: [{ cd: 0.62, dmg: 46, reach: 68, arc: 3.6, leech: 3 }],
    },
  };

  const PASSIVES = {
    blade: { name: '锋刃', icon: 'damage', max: 5, info: ['所有伤害 +12%'] },
    swift: { name: '疾风', icon: 'speed', max: 5, info: ['移动速度 +8%'] },
    rhythm: { name: '韵律', icon: 'rate', max: 5, info: ['攻击速度 +10%'] },
    magnet: { name: '磁石', icon: 'pickup', max: 5, info: ['拾取范围 +22%'] },
    vitality: { name: '生命', icon: 'hp', max: 5, info: ['生命上限 +25，并回复 25'] },
    wick: { name: '灯芯', icon: 'light', max: 5, info: ['灯光半径 +18%'] },
    armor: { name: '坚甲', icon: 'armor', max: 5, info: ['受到伤害 -1'] },
    crit: { name: '会心', icon: 'crit', max: 5, info: ['暴击率 +7%'] },
    regen: { name: '回春', icon: 'regen', max: 5, info: ['每秒回复 0.5 生命'] },
    greed: { name: '贪婪', icon: 'greed', max: 5, info: ['魂火经验 +15%'] },
    thorns: { name: '棘刺', icon: 'thorns', max: 5, info: ['受击时反弹 12 伤害'] },
    oil: { name: '灯油', icon: 'oil', max: 5, info: ['攻击附加 3 点/秒 燃烧，持续 2 秒'] },
    aegis: { name: '护盾', icon: 'shield', max: 5, info: ['每 18 秒获得一层护盾，抵挡一次伤害'] },
    luck: { name: '幸运', icon: 'luck', max: 5, info: ['暴击伤害 +25%'] },
  };

  // 圣物：宝箱开出，永久本局生效
  const RELICS = {
    thunder: { name: '落雷符', icon: 'spark', desc: '每 6 秒对最近敌人落下一道雷' },
    emberboot: { name: '余烬之靴', icon: 'speed', desc: '冲刺沿途留下灼烧火焰' },
    harvester: { name: '收割者', icon: 'hp', desc: '每 15 击杀回复 2 点生命' },
    lens: { name: '远光镜', icon: 'light', desc: '灯光 +20%，拾取范围 +35%' },
    fang: { name: '獠牙', icon: 'crit', desc: '暴击时引发小范围爆裂' },
    ward: { name: '守夜护符', icon: 'armor', desc: '受伤时释放击退冲击波' },
    greed: { name: '贪食之囊', icon: 'greed', desc: '魂火经验 +25%' },
    aegis: { name: '黎明之盾', icon: 'shield', desc: '每 30 秒免疫一次伤害' },
    exec: { name: '处刑者', icon: 'damage', desc: '对生命低于 35% 的敌人伤害 +45%' },
    hearth: { name: '暖灯', icon: 'oil', desc: '光内敌人减速 12%，每秒回复 0.4 生命' },
  };

  const ENEMY_SCALE = 1.25;   // 小怪整体放大
  const ENEMIES = {
    slammer: { spr: 'brute', hp: 42, spd: 44, dmg: 13, xp: 6, r: 8.5, anim: 0.22, kb: 0.4, slam: true },
    mage: { spr: 'summoner', hp: 30, spd: 38, dmg: 10, xp: 7, r: 7, anim: 0.2, magic: true, keep: 120 },
    crawler: { spr: 'crawler', hp: 10, spd: 68, dmg: 6, xp: 2, r: 6.5, anim: 0.12, kb: 1 },
    bat: { spr: 'bat', hp: 8, spd: 80, dmg: 5, xp: 2, r: 6, anim: 0.09, kb: 1.25, wobble: 2.4 },
    wisp: { spr: 'wisp', hp: 16, spd: 58, dmg: 7, xp: 3, r: 5.5, anim: 0.14, glow: true },
    spitter: { spr: 'spitter', hp: 22, spd: 38, dmg: 7, xp: 4, r: 7, anim: 0.2, ranged: true, keep: 118 },
    ghost: { spr: 'ghost', hp: 20, spd: 66, dmg: 8, xp: 4, r: 6, anim: 0.16, phase: true },
    brute: { spr: 'brute', hp: 75, spd: 46, dmg: 14, xp: 8, r: 9.5, anim: 0.24, kb: 0.35 },
    archer: { spr: 'archer', hp: 24, spd: 44, dmg: 7, xp: 5, r: 7, anim: 0.16, ranged: true, keep: 132, fastShot: true },
    leech: { spr: 'leech', hp: 34, spd: 62, dmg: 6, xp: 5, r: 6.5, anim: 0.14, drain: true },
    bomber: { spr: 'bomber', hp: 20, spd: 68, dmg: 12, xp: 5, r: 7, anim: 0.16, bomber: true },
    shade: { spr: 'shade', hp: 52, spd: 64, dmg: 11, xp: 7, r: 7, anim: 0.18, shielded: true },
    summoner: { spr: 'summoner', hp: 64, spd: 30, dmg: 9, xp: 10, r: 8.5, anim: 0.22, summoner: true, keep: 120 },
  };

  /* =========================================================
     会话状态
     ========================================================= */
  let state = 'BOOT';
  let T = 0;
  let runTime = 0;
  let camX = 0, camY = 0;
  let shake = 0, redFlash = 0, whiteFlash = 0, hitstop = 0;
  let P = null;
  let enemies = [], bullets = [], hazards = [], pickups = [], particles = [], texts = [], effects = [];
  let boss = null, boss1Done = false, boss2Spawned = false;
  let spawnT = 1.2, nextSwarm = 42, kills = 0, totalDmg = 0;
  let bannerText = '', bannerT = 0;
  let cards = [], cardHover = -1, cardAnim = 0;
  let chosenChar = 'lamp', menuIndex = 0;
  let titleHint = '', titleHintT = 0;
  // 元系统
  let runMode = 'standard';       // 'standard' | 'daily'
  let runDaily = null;            // 当前日挑配置
  let xpCollected = 0;
  let unhurtT = 0;
  let dashUsed = false;
  let boss1KillTime = null;
  let evalT = 0;
  let toasts = [];
  let newAchievements = [];
  let codexTab = 0;               // 0 敌人 1 武器 2 被动 3 成就
  let codexSel = 0;
  let codexScroll = 0;
  let dailyPreview = null;
  let codexTabRects = [];
  // v2
  let endless = false;
  let endlessTier = 0;
  let chestT = 62, chest = null;
  let nextEndlessBoss = 0;
  // 地牢
  let runSeed = 1;
  let plan = null;
  let level = null, levelIdx = 0, activeWalls = [], themeInfo = null, doorLocked = false, roomById = {};
  let room = null;
  let floorIdx = 0, roomIdx = 0; // roomIdx 仅为兼容旧引用
  let roomCleared = false;
  let roomFade = 0;
  let portalT = 0;
  let roomEnemiesLeft = 0;
  let chestObjs = [];
  let shrineObj = null;
  let roomScale = { hp: 1, dmg: 1, spd: 1 };
  let spawnQueue = [];
  let portalPulse = 0;
  let cinematicT = 0;
  let cine = null;
  let lastBossDef = null;
  let boonIsFloor = false;
  let rhythmPlayed = false, rhythmDone = false;
  let pauseSel = 0;
  let storyQuote = null, storyFlash = 0;
  let chestCards = [], chestSel = 0;
  let storyView = null;
  let pendingEnding = null;

  const TITLE_BTN = {
    daily: { x: 10, y: 158, w: 164, h: 16 },
    codex: { x: 10, y: 178, w: 84, h: 14 },
    story: { x: 98, y: 178, w: 76, h: 14 },
    cont: { x: 10, y: 132, w: 164, h: 18 },
  };
  const TITLE_CARD = { x: 190, y: 44, w: 178, h: 44, gap: 50 };
  const PAUSE_BTN = [
    { x: 122, y: 108, w: 140, h: 18 },
    { x: 122, y: 132, w: 140, h: 18 },
    { x: 122, y: 156, w: 140, h: 18 },
  ];
  function inRect(x, y, r) { return x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h; }
  let endInfo = null;
  let started = false;
  let loadStep = 0, loadT = 0, runActive = false;
  let save = null;
  let hoverTimer = 0;
  let fpsSmooth = 60;
  let glowScale = 1;

  /* =========================================================
     工具绘制
     ========================================================= */
  function px(x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function panel(x, y, w, h, fill, border, border2) {
    px(x, y, w, h, border2 || '#05070d');
    px(x + 1, y + 1, w - 2, h - 2, border || '#2a3350');
    px(x + 2, y + 2, w - 4, h - 4, fill || '#10131f');
  }
  function bar(x, y, w, h, pct, col, bg, border) {
    px(x, y, w, h, border || '#04060b');
    px(x + 1, y + 1, w - 2, h - 2, bg || '#1a1f2e');
    const iw = Math.max(0, Math.min(1, pct)) * (w - 2);
    if (iw > 0.4) px(x + 1, y + 1, iw, h - 2, col);
  }
  function shadowEllipse(x, y, w) {
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.beginPath();
    ctx.ellipse(x, y, w, Math.max(1.5, w * 0.42), 0, 0, TAU);
    ctx.fill();
  }
  // 光晕精灵缓存：比每帧创建径向渐变快得多
  const glowCache = new Map();
  function glowSprite(color) {
    let c = glowCache.get(color);
    if (c) return c;
    if (glowCache.size > 96) glowCache.clear();
    const S = 64;
    c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grd.addColorStop(0, color);
    grd.addColorStop(0.42, color);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, S, S);
    glowCache.set(color, c);
    return c;
  }

  function glowAt(x, y, r, color, a) {
    if (r <= 0 || glowScale <= 0) return;
    const spr = glowSprite(color);
    ctx.globalAlpha = (a === undefined ? 1 : a) * glowScale;
    ctx.drawImage(spr, Math.round(x - r), Math.round(y - r), Math.round(r * 2), Math.round(r * 2));
    ctx.globalAlpha = 1;
  }

  /* =========================================================
     开局
     ========================================================= */
  function xpNeed(lvl) { return 9 + Math.round(lvl * 6.5); }

  function startRun(charId, opts) {
    const o = opts || {};
    runActive = !o.demo;
    runMode = o.daily ? 'daily' : (o.endless ? 'endless' : 'standard');
    endless = runMode === 'endless';
    endlessTier = 0;
    storyQuote = null;
    storyFlash = 0;
    runDaily = o.daily || null;
    chosenChar = charId || chosenChar;
    const ch = CHARS[chosenChar];
    const mods = runDaily ? runDaily.mods : [];
    const has = (id) => !!mods && mods.some((m) => m.id === id);

    P = {
      charId: chosenChar,
      x: 0, y: 0, r: 5.5,
      hp: ch.hp, maxHp: ch.hp,
      vx: 0, vy: 0, fx: 0, fy: 1,
      animT: 0, moving: false, dir: 'down', frame: 0,
      iframe: 0, hurtT: 0,
      dashT: 0, dashCd: 0, dashDx: 0, dashDy: 1,
      weapons: [{ id: ch.weapon, lvl: 1, t: 0, ang: 0 }],
      passives: {},
      relics: [],
      relicLvl: 1, relicStore: [],
      skill: { cd: 0, max: ch.skillCd || 13, t: 0 },
      shieldT: 0, shieldOn: false,
      thunderT: 6, harvestN: 0, aegisT: 30, burnAcc: 0,
      evolved: {},
      level: 1, xp: 0, xpNeed: xpNeed(1),
      st: null, regenAcc: 0,
      lightFlick: 0, spawnT: 0, slowT: 0,
      modHp: has('frail') ? 0.75 : 1,
      modLight: has('dim') ? 0.82 : 1,
      modXp: has('rich') ? 1.3 : 1,
    };
    recalc();
    P.hp = P.maxHp;

    META.unlock(save, 'weapons', ch.weapon);

    enemies = []; bullets = []; hazards = []; pickups = []; particles = []; texts = []; effects = [];
    boss = null; boss1Done = false; boss2Spawned = false;
    runTime = 0; kills = 0; totalDmg = 0;
    xpCollected = 0; unhurtT = 0; dashUsed = false; boss1KillTime = null; evalT = 0;
    toasts = []; newAchievements = [];
    spawnT = 1.0; nextSwarm = 42;
    chestT = 62; chest = null;
    nextEndlessBoss = runTime + ENDLESS_STEP;
    if (STORY) { STORY.ensure(save); }
    camX = P.x - W / 2; camY = P.y - H / 2;
    shake = 0; redFlash = 0; whiteFlash = 0; hitstop = 0;
    bannerText = ''; bannerT = 0;
    runSeed = runDaily ? runDaily.seed : (2000 + (Math.random() * 9000 | 0));
    WORLD.reset(runSeed);
    endInfo = null;
    cards = [];
    floorIdx = 0; levelIdx = 0;
    cinematicT = 0;
    loadLevel(0, 0);
  }

  /* =========================================================
     地牢：房间生命周期
     ========================================================= */
  function floorType(f) { return (f % 2 === 0) ? 2 : 1; }

  function clampWorldCam() {
    if (!level) return;
    const b = level.bounds;
    if (b.w <= W) camX = b.x + (b.w - W) / 2;
    else camX = clamp(camX, b.x, b.x + b.w - W);
    if (b.h <= H) camY = b.y + (b.h - H) / 2;
    else camY = clamp(camY, b.y, b.y + b.h - H);
  }

  function loadLevel(f, l) {
    floorIdx = f; levelIdx = l;
    level = D.level(runSeed, f, l);
    roomById = {};
    for (let i = 0; i < level.rooms.length; i++) roomById[level.rooms[i].id] = level.rooms[i];
    themeInfo = D.THEMES[D.themeFor(runSeed, f)];
    enemies = []; bullets = []; hazards = []; pickups = []; particles = []; texts = []; effects = [];
    boss = null; chest = null; chestObjs = []; shrineObj = null; room = null;
    activeWalls = level.walls.slice();
    roomFade = 1; portalPulse = 0; doorLocked = false; cine = null;
    rhythmPlayed = false; rhythmDone = false;
    P.x = level.start.x + level.start.w / 2;
    P.y = level.start.y + level.start.h - 52;
    P.vx = 0; P.vy = 0; P.dashT = 0; P.iframe = 0.9;
    camX = P.x - W / 2; camY = P.y - H / 2;
    clampWorldCam();
    roomScale = {
      hp: 1 + 0.55 * f + 0.075 * (l + 1) + 0.02 * f * f,
      dmg: 1 + 0.28 * f + 0.035 * (l + 1),
      spd: Math.min(1.45, 1 + 0.06 * f + 0.012 * (l + 1)),
      xp: 1 + 0.08 * f,
    };
    enterRoom(level.start, true);
    P.spawnT = 0.75;
    addEffect({ kind: 'ring', x: P.x, y: P.y + 4, r0: 6, r1: 56, max: 0.55, life: 0.55, color: 'rgba(255,214,130,0.55)' });
    for (let i = 0; i < 16; i++) {
      spawnParticle(P.x, P.y + 6, rand(-58, 58), rand(-78, -12), rand(0.3, 0.75), i % 3 ? '#ffd88a' : '#fff4d6', 1.5, 0.4, true);
    }
    biteBanner('第 ' + (f + 1) + ' 层 · ' + themeInfo.name + ' · ' + (l + 1) + ' / ' + D.ROOMS);
    saveRun();
    AUDIO.setMood(f >= 3 ? 'boss' : 'battle');
    AUDIO.sfx('dash');
  }

  function lockDoors(rm, on) {
    if (!rm || !level) return;
    if (on) {
      doorLocked = true;
      activeWalls = level.walls.concat(rm.doorWalls);
      if (!rm.cleared) {
        for (let i = 0; i < rm.doorWalls.length; i++) {
          const d = rm.doorWalls[i];
          for (let k = 0; k < 7; k++) {
            spawnParticle(d.x + rand(0, d.w), d.y + rand(0, d.h), rand(-40, 40), rand(-50, -6),
              rand(0.25, 0.55), '#c9a86e', 1.6, 0.5, false);
          }
        }
        shake = Math.max(shake, 2.5);
        AUDIO.sfx('hit');
      }
    } else {
      doorLocked = false;
      activeWalls = level.walls.slice();
    }
  }

  function startBossCine() {
    if (!boss) return;
    cine = { kind: 'boss', t: 0, dur: 2.3, name: boss.name, sub: '第 ' + (floorIdx + 1) + ' 层 · 层主' };
    boss.intro = 2.3;
    shake = Math.max(shake, 6);
    whiteFlash = Math.max(whiteFlash, 0.35);
    addEffect({ kind: 'ring', x: boss.x, y: boss.y + 10, r0: 8, r1: 96, max: 0.9, life: 0.9, color: 'rgba(255,120,150,0.6)' });
    for (let i = 0; i < 30; i++) {
      spawnParticle(boss.x + rand(-26, 26), boss.y + rand(-6, 14), rand(-120, 120), rand(-95, -12),
        rand(0.4, 1.15), i % 3 ? '#b47cf0' : '#ffb0c8', rand(1.5, 2.6), 0.5, true);
    }
    AUDIO.sfx('boss');
    AUDIO.sfx('explode');
  }

  function playerInRoom(rm) {
    const inset = 24;
    return P.x > rm.x + inset && P.x < rm.x + rm.w - inset &&
           P.y > rm.y + inset && P.y < rm.y + rm.h - inset;
  }

  function enterRoom(rm, silent) {
    if (!rm) return;
    room = rm;
    rm.visited = true;
    if (!rm.spawned) {
      rm.spawned = true;
      buildRoomContent(rm);
    }
    const combat = rm.type === 'fight' || rm.type === 'elite' || rm.type === 'cage' || rm.type === 'hidden' || rm.type === 'boss';
    if (combat && !rm.cleared) {
      if (playerInRoom(rm)) lockDoors(rm, true);
      else rm.lockPending = true;
    } else if (!doorLocked) activeWalls = level.walls.slice();
    if (!silent && rm.type !== 'fight' && rm.type !== 'start') {
      const t = D.ROOM_TYPES[rm.type];
      if (t) biteBanner(t.name);
    }
  }

  function pickPool(f, l) {
    // 远程：喷吐者 / 骨弓手 / 咒术师 / 招魂者；近战：其余
    const ranged = [['spitter', 30], ['archer', 30], ['mage', 18]];
    const melee = [['crawler', 8], ['bat', 6], ['wisp', 4]];
    if (f >= 1 || l >= 3) ranged.push(['summoner', 8]);
    if (f >= 1 || l >= 4) melee.push(['bomber', 4], ['ghost', 4]);
    if (f >= 2 || l >= 6) melee.push(['brute', 4], ['leech', 3]);
    if (f >= 3 || l >= 8) melee.push(['shade', 3], ['slammer', 4]);
    const rw = ranged.reduce(function (a, x) { return a + x[1]; }, 0);
    const mw = melee.reduce(function (a, x) { return a + x[1]; }, 0);
    const target = 0.74;   // 远程占比下限
    let scale = 1;
    if (mw > 0 && rw / (rw + mw) < target) scale = (rw * (1 - target)) / (mw * target);
    const out = ranged.slice();
    for (let i = 0; i < melee.length; i++) out.push([melee[i][0], Math.max(1, melee[i][1] * scale)]);
    return out;
  }

  function freeSpawnPoint(rm, minDist) {
    for (let g = 0; g < 40; g++) {
      const sp = rm.spawns[(Math.random() * rm.spawns.length) | 0];
      if (!sp) break;
      if (D.pointInWalls(sp.x, sp.y, rm.walls)) continue;
      if (dist2(sp.x, sp.y, P.x, P.y) < minDist * minDist) continue;
      return sp;
    }
    return { x: rm.x + rm.w / 2, y: rm.y + 60 };
  }

  function buildRoomContent(rm) {
    chestObjs = []; shrineObj = null;
    if (rm.type === 'treasure') { chestObjs = rm.chests; rm.cleared = true; return; }
    if (rm.type === 'special') { shrineObj = rm.shrine; rm.cleared = true; return; }
    if (rm.type === 'portal' || rm.type === 'start') { rm.cleared = true; return; }
    if (rm.type === 'boss') {
      P.hp = Math.min(P.maxHp, P.hp + Math.round(P.maxHp * 0.3));
      spawnBoss((floorIdx * 3 + ((levelIdx - 1) >> 1)) % 12);
      startBossCine();
      rm.waveCounts = [];
      return;
    }
    const f = floorIdx, l = levelIdx;
    let count = 5 + Math.round(f * 2.2 + l * 0.6);
    if (rm.type === 'elite' || rm.type === 'cage') count = Math.max(4, Math.round(4 + f * 1.6));
    const n1 = Math.max(1, Math.ceil(count * 0.6));
    const n2 = Math.max(0, count - n1);
    rm.waveCounts = n2 > 0 ? [n1, n2] : [n1];
    rm.waveIdx = -1;
    rm.respawnT = 0;
    spawnNextWave(rm);
  }

  function spawnNextWave(rm) {
    rm.waveIdx = (rm.waveIdx || 0) + 1;
    const n = rm.waveCounts[rm.waveIdx] || 0;
    const pool = pickPool(floorIdx, levelIdx);
    const eliteChance = (rm.type === 'elite' || rm.type === 'cage') ? 0.85 : Math.min(0.4, 0.04 + floorIdx * 0.03 + levelIdx * 0.012);
    for (let i = 0; i < n; i++) {
      const sp = freeSpawnPoint(rm, 78);
      const e = spawnEnemy(pickWeighted(pool), sp.x, sp.y, Math.random() < eliteChance);
      if (e) e.spawnT = 0.3 + Math.random() * 0.3;
    }
    if (rm.waveIdx > 0) biteBanner('又 一 波');
  }

  function roomAlive() {
    let n = 0;
    for (let i = 0; i < enemies.length; i++) if (!enemies[i].dead) n++;
    if (boss && !boss.dead) n++;
    return n;
  }

  function clearRoom(rm) {
    if (!rm || rm.cleared) return;
    rm.cleared = true;
    lockDoors(rm, false);
    AUDIO.sfx('win');
    biteBanner(rm.type === 'boss' ? '门 开 了' : '通 道 开 启');
    const cx = rm.x + rm.w / 2, cy = rm.y + rm.h / 2;
    dropHeart(cx, cy);
    for (let i = 0; i < 3; i++) dropXp(cx + rand(-24, 24), cy + rand(-16, 16), 3);
    whiteFlash = Math.max(whiteFlash, 0.3);
    for (let i = 0; i < pickups.length; i++) pickups[i].magnet = true;
    addEffect({ kind: 'ring', x: cx, y: cy, r0: 8, r1: 120, max: 0.75, life: 0.75, color: 'rgba(255,225,170,0.5)' });
    for (let i = 0; i < 18; i++) {
      spawnParticle(cx, cy, rand(-90, 90), rand(-90, 90), rand(0.4, 1), '#ffe9a8', 1.8, 0.6, true);
    }
    if (rm.type === 'boss') {
      shake = 10;
      const q = lastBossDef ? { name: lastBossDef.name, lines: lastBossDef.death } : null;
      if (q) storyQuote = { name: q.name, lines: q.lines.slice(), t: 3.4, life: 3.4 };
    }
  }

  function nextLevel() {
    if (room && room.type === 'boss') {
      const lastOfFloor = levelIdx >= D.ROOMS - 1;
      if (lastOfFloor && floorIdx >= D.FLOORS - 1 && !endless) { finishDungeon(); return; }
      openBoons(lastOfFloor);
      return;
    }
    if (levelIdx + 1 < D.ROOMS) loadLevel(floorIdx, levelIdx + 1);
  }

  function finishDungeon() {
    win();
  }

  function updateLevel(dt) {
    if (!level) return;
    portalPulse += dt;

    // 掉出房间/走廊（冲刺穿墙）时拉回最近可行走点
    if (!D.roomAt(level, P.x, P.y)) {
      let best = null, bd = 1e9;
      for (let i = 0; i < level.rooms.length; i++) {
        const r = level.rooms[i];
        const cx = clamp(P.x, r.x + 18, r.x + r.w - 18);
        const cy = clamp(P.y, r.y + 18, r.y + r.h - 18);
        const d = dist2(P.x, P.y, cx, cy);
        if (d < bd) { bd = d; best = { x: cx, y: cy }; }
      }
      for (let i = 0; i < level.corridors.length; i++) {
        const c = level.corridors[i];
        const cx = clamp(P.x, c.x + 6, c.x + c.w - 6);
        const cy = clamp(P.y, c.y + 6, c.y + c.h - 6);
        const d = dist2(P.x, P.y, cx, cy);
        if (d < bd) { bd = d; best = { x: cx, y: cy }; }
      }
      if (best) { P.x = best.x; P.y = best.y; }
    }

    const rm = D.roomAt(level, P.x, P.y);
    if (rm && rm !== room) enterRoom(rm);

    if (room && room.lockPending && !room.cleared && playerInRoom(room)) {
      room.lockPending = false;
      lockDoors(room, true);
    }

    if (!room) return;

    // 地刺
    for (let i = 0; i < room.spikes.length; i++) {
      const sp = room.spikes[i];
      sp.cd = Math.max(0, sp.cd - dt);
      const d2 = dist2(P.x, P.y, sp.x, sp.y);
      if (d2 < (sp.r + P.r) * (sp.r + P.r) && sp.cd <= 0) {
        sp.cd = 1.15;
        damagePlayer(7 + floorIdx * 3, sp.x, sp.y);
      }
    }

    // 宝箱
    for (let i = 0; i < chestObjs.length; i++) {
      const c = chestObjs[i];
      if (c.open) continue;
      c.t = (c.t || 0) + dt;
      if (dist2(P.x, P.y, c.x, c.y) < 15 * 15) {
        c.open = true;
        chestCards = rollRelics(3);
        cards = chestCards;
        chestSel = 0;
        cardAnim = 0;
        addEffect({ kind: 'ring', x: c.x, y: c.y, r0: 4, r1: 46, max: 0.6, life: 0.6, color: 'rgba(255,220,140,0.6)' });
        for (let k = 0; k < 16; k++) {
          spawnParticle(c.x, c.y, rand(-40, 40), rand(-90, -20), rand(0.4, 0.9), '#ffe9a8', 1.6, 0.3, true);
        }
        state = 'CHEST';
        AUDIO.sfx('levelup');
        whiteFlash = Math.max(whiteFlash, 0.4);
        return;
      }
    }

    // 祭坛
    if (shrineObj && !shrineObj.used) {
      const d2 = dist2(P.x, P.y, shrineObj.x, shrineObj.y);
      if (d2 < (shrineObj.r + 9) * (shrineObj.r + 9)) {
        shrineObj.used = true;
        cards = rollBoons(3);
        cardAnim = 0;
        state = 'SHRINE';
        AUDIO.sfx('levelup');
        whiteFlash = Math.max(whiteFlash, 0.35);
        return;
      }
    }

    // 波次 / 清场
    if (!room.cleared) {
      const alive = roomAlive();
      if (alive === 0) {
        if (room.waveCounts && room.waveIdx < room.waveCounts.length - 1) {
          room.respawnT += dt;
          if (room.respawnT > 0.85) {
            room.respawnT = 0;
            spawnNextWave(room);
          }
        } else {
          clearRoom(room);
        }
      }
    } else if (room.type === 'portal' || room.type === 'boss') {
      portalT = Math.min(1, portalT + dt * 2.2);
      const px = room.x + room.w / 2, py = room.y + room.h / 2;
      if (dist2(P.x, P.y, px, py) < 23 * 23) nextLevel();
    }
  }

  const BOONS = [
    { id: 'heal', name: '暖火', desc: '回复 45% 生命，并清除负面状态' },
    { id: 'relic', name: '遗物', desc: '随机获得一件圣物' },
    { id: 'dmg', name: '磨刃', desc: '所有伤害 +8%' },
    { id: 'light', name: '添油', desc: '灯光 +10%，拾取范围 +15%' },
    { id: 'speed', name: '轻装', desc: '移动速度 +6%' },
    { id: 'skill', name: '灯芯共鸣', desc: '主动技能冷却 -2 秒' },
    { id: 'armor', name: '硬壳', desc: '受到伤害 -1' },
  ];

  function rollBoons(n) {
    const pool = BOONS.slice();
    const out = [];
    for (let i = 0; i < n && pool.length; i++) {
      const idx = (Math.random() * pool.length) | 0;
      const b = pool.splice(idx, 1)[0];
      out.push({ kind: 'boon', id: b.id, lvl: 1 });
    }
    return out.map((c, i) => ({ ...c, x: 13 + i * 122, y: 62, w: 114, h: 106 }));
  }

  function openBoons(isFloor) {
    boonIsFloor = !!isFloor;
    cards = rollBoons(3);
    cardAnim = 0;
    state = 'BOON';
    AUDIO.sfx('levelup');
    whiteFlash = Math.max(whiteFlash, 0.4);
  }

  function boonInfo(id) {
    for (let i = 0; i < BOONS.length; i++) if (BOONS[i].id === id) return BOONS[i];
    return BOONS[0];
  }

  function applyBoon(id) {
    if (id === 'heal') P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.45);
    else if (id === 'relic') {
      const list = Object.keys(RELICS).filter((k) => P.relics.indexOf(k) < 0);
      if (list.length) equipRelic(list[(Math.random() * list.length) | 0], 1);
      else if (P.relics[0]) equipRelic(P.relics[0], Math.min(3, (P.relicLvl || 1) + 1));
    } else if (id === 'dmg') P.boonDmg = (P.boonDmg || 1) * 1.08;
    else if (id === 'light') { P.boonLight = (P.boonLight || 1) * 1.1; P.boonPick = (P.boonPick || 1) * 1.15; }
    else if (id === 'speed') P.boonSpeed = (P.boonSpeed || 1) * 1.06;
    else if (id === 'skill') P.skill.max = Math.max(6, P.skill.max - 2);
    else if (id === 'armor') P.boonArmor = (P.boonArmor || 0) + 1;
    recalc();
    P.hp = Math.min(P.maxHp, P.hp);
  }


  function recalc() {
    const ch = CHARS[P.charId];
    const pv = P.passives;
    const st = {
      dmg: 1, atk: 1, speed: ch.speed, pickup: 26,
      light: ch.light, maxHp: ch.hp, armor: 0,
      crit: 0.05, regen: 0, xp: 1,
    };
    st.dmg *= 1 + 0.12 * (pv.blade || 0);
    st.speed *= 1 + 0.08 * (pv.swift || 0) * (P.charId === 'ranger' ? 1.15 : 1);
    st.atk *= 1 + 0.10 * (pv.rhythm || 0);
    st.pickup *= 1 + 0.22 * (pv.magnet || 0);
    st.maxHp += 25 * (pv.vitality || 0);
    st.light *= 1 + 0.18 * (pv.wick || 0);
    st.armor += (pv.armor || 0);
    st.crit += 0.07 * (pv.crit || 0);
    st.regen += 0.5 * (pv.regen || 0);
    st.xp *= 1 + 0.15 * (pv.greed || 0);
    st.critDmg = 2 + 0.25 * (pv.luck || 0);
    st.thorns = 12 * (pv.thorns || 0);
    st.burn = 3 * (pv.oil || 0);
    st.aegisCd = pv.aegis ? 18 : 0;
    if (P.charId === 'ranger') st.pickup *= 1.15;
    // 圣物
    const rl = P.relics || [];
    const hasR = (id) => rl.indexOf(id) >= 0;
    const RLV = P.relicLvl || 1;
    st.relicLvl = RLV;
    if (hasR('lens')) { st.light *= 1.2 + 0.07 * (RLV - 1); st.pickup *= 1.35 + 0.12 * (RLV - 1); }
    if (hasR('greed')) st.xp *= 1.25 + 0.12 * (RLV - 1);
    if (hasR('hearth')) st.regen += 0.4 + 0.15 * (RLV - 1);
    st.relicWard = hasR('ward');
    st.relicFang = hasR('fang');
    st.relicExec = hasR('exec');
    st.relicThunder = hasR('thunder');
    st.relicEmber = hasR('emberboot');
    st.relicHarvest = hasR('harvester');
    st.relicAegis = hasR('aegis');
    st.relicHearth = hasR('hearth');
    st.dmg *= (P.boonDmg || 1);
    st.light *= (P.boonLight || 1);
    st.pickup *= (P.boonPick || 1);
    st.speed *= (P.boonSpeed || 1);
    st.armor += (P.boonArmor || 0);
    // 每日挑战修正
    st.maxHp = Math.round(st.maxHp * (P.modHp || 1));
    st.light *= (P.modLight || 1);
    st.xp *= (P.modXp || 1);
    const gain = st.maxHp - P.maxHp;
    if (gain > 0) P.hp += gain;
    P.maxHp = st.maxHp;
    P.hp = Math.min(P.hp, P.maxHp);
    P.st = st;
  }

  /* =========================================================
     敌人
     ========================================================= */
  function spawnEnemy(type, x, y, elite) {
    if (enemies.length > 70) return null;
    // 层主召唤 / 召唤师产怪：限制在当前房间内，避免穿墙或刷到图外
    if (room) {
      const pad = 24;
      let sx = clamp(x, room.x + pad, room.x + room.w - pad);
      let sy = clamp(y, room.y + pad + 12, room.y + room.h - pad);
      if (level && D.pointInWalls(sx, sy, activeWalls)) {
        const rcx = room.x + room.w / 2, rcy = room.y + room.h / 2;
        for (let k = 1; k <= 8; k++) {
          const nx = lerp(sx, rcx, k / 8), ny = lerp(sy, rcy, k / 8);
          if (!D.pointInWalls(nx, ny, activeWalls)) { sx = nx; sy = ny; break; }
        }
      }
      x = sx; y = sy;
    }
    const d = ENEMIES[type];
    const hpS = roomScale.hp;
    const dmS = roomScale.dmg;
    const mods = runDaily ? runDaily.mods : null;
    const has = (id) => !!mods && mods.some((m) => m.id === id);
    const hpMod = has('tough') ? 1.25 : 1;
    const dmgMod = has('sharp') ? 1.2 : 1;
    const spdMod = has('swift') ? 1.18 : 1;
    const e = {
      type, x, y, roomId: room ? room.id : null,
      hp: d.hp * hpS * hpMod * (elite ? 4.2 : 1),
      maxHp: d.hp * hpS * hpMod * (elite ? 4.2 : 1),
      spd: d.spd * spdMod * (elite ? 0.92 : 1) * roomScale.spd,
      dmg: d.dmg * dmS * dmgMod * (elite ? 1.4 : 1),
      xp: d.xp * (elite ? 4 : 1) * roomScale.xp,
      r: d.r * (elite ? 1.35 : 1) * ENEMY_SCALE,
      scale: ENEMY_SCALE * (elite ? 1.1 : 1),
      animT: rand(0, 4),
      hitT: 0, kx: 0, ky: 0,
      kb: d.kb === undefined ? 1 : d.kb,
      elite: !!elite,
      shootT: rand(0.8, 2.2),
      wob: rand(0, TAU),
      dead: false,
      spawnT: 0.28,
      orbitCd: 0,
      slowT: 0, slowAmt: 1, stunT: 0, burnT: 0, burnDps: 0, burnAcc: 0,
      fuse: null, sumT: rand(2.4, 4.2), face: 0,
    };
    enemies.push(e);
    META.unlock(save, 'enemies', type);
    return e;
  }

  function spawnPool(t) {
    const p = [['crawler', 10]];
    if (t > 20) p.push(['bat', 6]);
    if (t > 44) p.push(['wisp', 5]);
    if (t > 78) p.push(['archer', 4]);
    if (t > 90) p.push(['spitter', 4]);
    if (t > 132) p.push(['bomber', 3]);
    if (t > 126) p.push(['ghost', 4]);
    if (t > 158) p.push(['leech', 3]);
    if (t > 182) p.push(['shade', 3]);
    if (t > 216) p.push(['summoner', 2]);
    if (t > 236) p.push(['brute', 3]);
    return p;
  }

  function pickWeighted(pool) {
    const tot = pool.reduce((s, p) => s + p[1], 0);
    let r = Math.random() * tot;
    for (const p of pool) { r -= p[1]; if (r <= 0) return p[0]; }
    return pool[0][0];
  }

  function spawnWave(count) {
    const pool = spawnPool(runTime);
    const prog = Math.min(1, runTime / DURATION);
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const rad = Math.max(W, H) * 0.62 + rand(6, 42);
      const x = P.x + Math.cos(a) * rad;
      const y = P.y + Math.sin(a) * rad * 0.92;
      const elite = Math.random() < prog * 0.13;
      spawnEnemy(pickWeighted(pool), x, y, elite);
    }
  }

  /* =========================================================
     战斗：伤害
     ========================================================= */
  function addText(x, y, str, color, scale, life) {
    if (texts.length > 70) texts.shift();
    texts.push({ x, y, str, color, scale: scale || 1, life: life || 0.7, max: life || 0.7, vy: -26 });
  }

  function hitEnemy(e, base, kx, ky, opts) {
    if (!e || e.dead) return;
    const o = opts || {};
    const crit = !o.noCrit && Math.random() < P.st.crit;
    let dmg;
    if (o.flat) dmg = base;
    else {
      dmg = base * P.st.dmg * (crit ? P.st.critDmg : 1);
      if (P.st.relicExec && e.hp / e.maxHp < 0.35) dmg *= 1.45;
      if (ENEMIES[e.type].shielded) {
        const a = angleTo(e.x, e.y, P.x, P.y);
        const rel = Math.abs(((a - (e.face || 0) + Math.PI * 3) % TAU) - Math.PI);
        if (rel < 1.3) dmg *= 0.55;
      }
      // 灯油：点燃
      if (P.st.burn > 0 && !o.noBurn) {
        e.burnT = Math.max(e.burnT, 2);
        e.burnDps = Math.max(e.burnDps, P.st.burn);
      }
    }
    dmg = Math.max(1, Math.round(dmg));
    if (crit && P.st.relicFang) {
      addEffect({ kind: 'ring', x: e.x, y: e.y, r0: 3, r1: 26, life: 0.24, max: 0.24, color: '#ffd166' });
      for (let i = 0; i < enemies.length; i++) {
        const o2 = enemies[i];
        if (o2 === e || o2.dead) continue;
        if (dist2(o2.x, o2.y, e.x, e.y) < 26 * 26) {
          o2.hp -= Math.round(dmg * 0.4);
          o2.hitT = 0.08;
          if (o2.hp <= 0) killEnemy(o2, {});
        }
      }
    }
    e.hp -= dmg;
    e.hitT = 0.09;
    e.kx += (kx || 0) * e.kb;
    e.ky += (ky || 0) * e.kb;
    totalDmg += dmg;
    if (!o.silent) {
      addText(e.x + rand(-3, 3), e.y - e.r - 6, String(dmg), crit ? '#ffe066' : '#ffffff', crit ? 1.6 : 1, crit ? 0.75 : 0.55);
      AUDIO.sfx('hit');
    }
    if (P.st.thorns && o.thorns) { /* 由伤害来源处理 */ }
    for (let i = 0; i < (crit ? 5 : 2); i++) {
      spawnParticle(e.x, e.y, rand(-40, 40), rand(-40, 40), crit ? 0.5 : 0.3, crit ? '#ffe066' : '#ffb3a0', 1.5, 1);
    }
    if (e.hp <= 0) killEnemy(e, o);
  }

  function killEnemy(e, o) {
    if (e.dead) return;
    e.dead = true;
    kills++;
    AUDIO.sfx('kill');
    const col = e.type === 'ghost' ? '#cfe8ff' : e.type === 'brute' ? '#8b8fa6' : e.type === 'wisp' ? '#ffd88a' : '#8fbf4a';
    for (let i = 0; i < (e.elite ? 16 : 7); i++) {
      spawnParticle(e.x, e.y, rand(-70, 70), rand(-70, 70), rand(0.3, 0.65), col, rand(1, 2.2), 1);
    }
    dropXp(e.x, e.y, e.xp);
    if (Math.random() < (e.elite ? 0.55 : 0.055)) dropHeart(e.x, e.y);
    if (ENEMIES[e.type].bomber) {
      addEffect({ kind: 'ring', x: e.x, y: e.y, r0: 2, r1: 34, life: 0.3, max: 0.3, color: '#ffcf6e' });
      for (let i = 0; i < enemies.length; i++) {
        const o2 = enemies[i];
        if (o2 === e || o2.dead) continue;
        if (dist2(o2.x, o2.y, e.x, e.y) < 34 * 34) hitEnemy(o2, 20, 0, 0, { silent: true, noBurn: true });
      }
      if (dist(P.x, P.y, e.x, e.y) < 34) damagePlayer(e.dmg, e.x, e.y);
      AUDIO.sfx('explode');
      shake = Math.max(shake, 3.5);
    }
    if (P.st.relicHarvest) {
      P.harvestN = (P.harvestN || 0) + 1;
      if (P.harvestN >= 15) {
        P.harvestN = 0;
        const hv = 1 + (P.relicLvl || 1);
        P.hp = Math.min(P.maxHp, P.hp + hv);
        addText(P.x, P.y - 18, '+' + hv, '#6fd68a', 1, 0.6);
      }
    }
    if (e.elite) {
      for (let i = 0; i < 8; i++) spawnParticle(e.x, e.y, rand(-100, 100), rand(-100, 100), 0.6, '#ff6b7f', 2, 1);
    }
    if (o && o.explodeBlast) {
      // 萤火爆裂
      addEffect({ kind: 'ring', x: e.x, y: e.y, r0: 2, r1: o.explodeBlast, life: 0.28, max: 0.28, color: '#ffc75e' });
      for (let i = 0; i < enemies.length; i++) {
        const t = enemies[i];
        if (t !== e && !t.dead && dist2(t.x, t.y, e.x, e.y) < o.explodeBlast * o.explodeBlast) {
          hitEnemy(t, o.blastDmg, 0, 0, { silent: true });
        }
      }
    }
  }

  function damagePlayer(amount, fromX, fromY) {
    if (!(amount > 0) || !isFinite(amount)) return;
    if (P.iframe > 0 || P.dashT > 0 || P.spawnT > 0) return;
    // 黎明之盾
    if (P.shieldOn) {
      P.shieldOn = false;
      P.iframe = 0.55;
      addEffect({ kind: 'ring', x: P.x, y: P.y, r0: 4, r1: 38, life: 0.35, max: 0.35, color: '#9fe8ff' });
      addText(P.x, P.y - 16, '格挡', '#9fe8ff', 1.1, 0.8);
      AUDIO.sfx('nova');
      return;
    }
    // 棘刺：反伤
    if (P.st.thorns > 0) {
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.dead) continue;
        if (dist2(e.x, e.y, P.x, P.y) < 42 * 42) hitEnemy(e, P.st.thorns, 0, 0, { silent: true, noBurn: true });
      }
    }
    // 守夜护符：受伤冲击波
    if (P.st.relicWard) {
      addEffect({ kind: 'ring', x: P.x, y: P.y, r0: 4, r1: 52, life: 0.3, max: 0.3, color: '#ffd166' });
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.dead) continue;
        const dd = dist(P.x, P.y, e.x, e.y);
        if (dd < 52) {
          const a = angleTo(P.x, P.y, e.x, e.y);
          hitEnemy(e, 12, Math.cos(a) * 190, Math.sin(a) * 190, { noBurn: true });
        }
      }
      if (boss && !boss.dead && dist(P.x, P.y, boss.x, boss.y) < 52) hitBoss(12);
    }
    const dmg = Math.max(1, Math.round(amount - P.st.armor));
    P.hp -= dmg;
    if (!isFinite(P.hp)) P.hp = 1;
    P.iframe = 0.82;
    P.hurtT = 0.32;
    unhurtT = 0;
    redFlash = Math.min(1, redFlash + 0.7);
    shake = Math.max(shake, 4.5);
    AUDIO.sfx('hurt');
    addText(P.x, P.y - 14, String(dmg), '#ff6b7f', 1.4, 0.8);
    for (let i = 0; i < 10; i++) spawnParticle(P.x, P.y, rand(-90, 90), rand(-90, 90), rand(0.3, 0.6), '#ff8095', 1.6, 1);
    if (fromX !== undefined) {
      const a = angleTo(fromX, fromY, P.x, P.y);
      P.vx += Math.cos(a) * 60;
      P.vy += Math.sin(a) * 60;
    }
    if (P.hp <= 0) {
      P.hp = 0;
      die();
    }
  }

  function die() {
    state = 'DEAD';
    AUDIO.sfx('death');
    AUDIO.setMood('title');
    shake = 10;
    redFlash = 1;
    for (let i = 0; i < 40; i++) {
      spawnParticle(P.x, P.y, rand(-140, 140), rand(-140, 140), rand(0.5, 1.2), i % 3 ? '#ffc36b' : '#ff6b7f', rand(1, 2.4), 0.5, true);
    }
    runActive = false;
    clearRunSnapshot();
    recordRun(false);
  }

  function win() {
    state = 'WIN';
    AUDIO.sfx('win');
    AUDIO.setMood('title');
    whiteFlash = 1;
    for (let i = 0; i < 70; i++) {
      spawnParticle(P.x + rand(-60, 60), P.y + rand(-40, 40), rand(-40, 40), rand(-90, -10), rand(0.8, 2), '#ffe9a8', rand(1, 2.4), 0.2, true);
    }
    runActive = false;
    clearRunSnapshot();
    recordRun(true);
  }

  function takeRoomCard(i, isFloor) {
    const c = cards[i];
    if (!c) return;
    applyCard(c);
    chest = null;
    cards = [];
    if (isFloor) {
      floorIdx++;
      loadLevel(floorIdx, 0);
    } else {
      loadLevel(floorIdx, levelIdx + 1);
    }
  }

  function startEndless() {
    endless = true;
    runMode = 'endless';
    endlessTier = 0;
    state = 'PLAY';
    boss = null;
    boss2Spawned = false;
    endInfo = null;
    floorIdx = D.FLOORS;
    levelIdx = 0;
    loadLevel(floorIdx, 0);
    biteBanner('无 尽 长 夜');
    AUDIO.startMusic('battle');
    AUDIO.setMood('battle');
    AUDIO.setTempo(120);
    whiteFlash = 0.6;
  }

  function recordRun(won) {
    save.best.runs++;
    if (won) save.best.wins++;
    save.best.time = Math.max(save.best.time, runTime);
    save.best.kills = Math.max(save.best.kills, kills);
    save.best.level = Math.max(save.best.level, P.level);
    save.best.floor = Math.max(save.best.floor || 0, floorIdx + 1);
    save.best.room = Math.max(save.best.room || 0, levelIdx + 1);
    save.totals.runs++;
    save.totals.kills += kills;
    save.totals.dmg += totalDmg;
    save.totals.xp += xpCollected;
    if (won) save.totals.wins++;
    let unlockedNow = null;
    if (boss1KillTime !== null && !save.unlocked.includes('grave')) {
      save.unlocked.push('grave');
      unlockedNow = 'grave';
    }
    if (won && !save.unlocked.includes('ranger')) {
      save.unlocked.push('ranger');
      unlockedNow = 'ranger';
    }

    // 成就判定
    newAchievements = META.evaluate(save, {
      runFinished: true,
      won,
      kills,
      runTime,
      level: P.level,
      weapons: P.weapons,
      passives: P.passives,
      unhurt: unhurtT,
      xpCollected,
      boss1KillTime,
      charPlayed: chosenChar,
      dailyFinished: runMode === 'daily',
    });
    for (const id of newAchievements) pushToast('achievement', id);

    // 每日挑战计分
    let daily = null;
    if (runMode === 'daily' && runDaily) {
      const score = META.dailyScore({ kills, level: P.level, time: runTime, won, dmg: totalDmg });
      const rec = META.recordDaily(save, runDaily.key, score, won);
      daily = { key: runDaily.key, score, best: rec.best, isBest: rec.isBest };
    }

    if (STORY) {
      const lore = STORY.checkRun(save, {
        runTime, kills, boss1Dead: boss1Done, boss2Seen: boss2Spawned,
        weapons: P.weapons.length, totalKills: save.totals.kills, won,
      });
      for (const id of lore) pushToast('lore', id);
      if (won) {
        save.lore.ending = true;
        if (STORY.count(save) >= STORY.fragments.length) save.lore.trueEnding = true;
      }
    }
    const ending = won ? (save.lore && save.lore.trueEnding ? 'true' : 'win') : 'death';
    endInfo = {
      won, time: runTime, kills, level: P.level, dmg: totalDmg,
      unlocked: unlockedNow, ach: newAchievements.slice(), daily,
      mode: runMode, ending,
      floor: floorIdx + 1, room: levelIdx + 1,
    };
    G.Store.save();
  }

  /* =========================================================
     粒子 / 掉落 / 特效
     ========================================================= */
  function spawnParticle(x, y, vx, vy, life, color, size, drag, add) {
    if (particles.length > 280) return;
    particles.push({
      x, y, vx, vy, life, max: life, color,
      size: size || 1, drag: drag === undefined ? 2 : drag, add: !!add, dead: false,
    });
  }

  function dropXp(x, y, val) {
    pickups.push({ kind: 'xp', x, y, val, vx: rand(-20, 20), vy: rand(-20, 20), life: 40, t: 0, dead: false });
  }
  function dropHeart(x, y) {
    pickups.push({ kind: 'heart', x, y, val: 18, vx: rand(-14, 14), vy: rand(-14, 14), life: 40, t: 0, dead: false });
  }

  function addEffect(e) {
    if (effects.length > 70) effects.shift();
    e.t = 0;
    effects.push(e);
  }

  /* =========================================================
     武器
     ========================================================= */
  function nearestEnemies(x, y, n, range) {
    const r2 = range * range;
    const list = [];
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead) continue;
      if (room && e.roomId && e.roomId !== room.id) continue;
      const d = dist2(x, y, e.x, e.y);
      if (d < r2) list.push({ e, d });
    }
    if (boss && !boss.dead && boss.intro <= 0 && (!room || !boss.roomId || boss.roomId === room.id)) {
      const d = dist2(x, y, boss.x, boss.y);
      if (d < r2) list.push({ e: boss, d, isBoss: true });
    }
    list.sort((a, b) => a.d - b.d);
    const out = [];
    for (let i = 0; i < Math.min(n, list.length); i++) out.push(list[i].e);
    return out;
  }

  function nearestEnemy(x, y, range) {
    let best = null, bd = range * range;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead) continue;
      if (room && e.roomId && e.roomId !== room.id) continue;
      const d = dist2(x, y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    if (!best && boss && !boss.dead && (!room || !boss.roomId || boss.roomId === room.id)) {
      const d = dist2(x, y, boss.x, boss.y);
      if (d < range * range) best = boss;
    }
    return best;
  }

  function defOf(id) { return WEAPONS[id] || EVOLUTIONS[id]; }

  function fireWeapon(w) {
    const def = defOf(w.id);
    const st = def.stats[Math.min(w.lvl, def.stats.length) - 1];
    if (w.id === 'bolt') {
      const t = nearestEnemies(P.x, P.y, st.n, 460);
      if (!t.length) return;
      for (let i = 0; i < st.n; i++) {
        const tg = t[i % t.length];
        const a = angleTo(P.x, P.y - 3, tg.x, tg.y) + (i ? rand(-0.09, 0.09) : 0);
        bullets.push({
          kind: 'bolt', x: P.x + Math.cos(a) * 6, y: P.y - 3 + Math.sin(a) * 6,
          vx: Math.cos(a) * st.spd, vy: Math.sin(a) * st.spd,
          r: 2.3, dmg: st.dmg, pierce: st.pierce, life: 1.5, hits: [], dead: false, ang: a,
        });
      }
      AUDIO.sfx('shoot');
    } else if (w.id === 'nova') {
      for (let k = 0; k < st.n; k++) {
        addEffect({ kind: 'nova', x: P.x, y: P.y, r0: 6, r1: st.r, life: 0.42, max: 0.42, color: '#7fe0ff', hit: [], dmg: st.dmg, delay: k * 0.16 });
      }
      AUDIO.sfx('nova');
      shake = Math.max(shake, 2.5);
    } else if (w.id === 'spark') {
      let cur = nearestEnemy(P.x, P.y, 300);
      if (!cur) return;
      const pts = [{ x: P.x, y: P.y - 3 }];
      const hit = [];
      for (let c = 0; c < st.chain; c++) {
        if (!cur) break;
        pts.push({ x: cur.x, y: cur.y });
        hit.push(cur);
        if (cur === boss) hitBoss(st.dmg);
        else hitEnemy(cur, st.dmg, 0, 0);
        let next = null, bd = st.range * st.range;
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (e.dead || hit.includes(e)) continue;
          const d = dist2(cur.x, cur.y, e.x, e.y);
          if (d < bd) { bd = d; next = e; }
        }
        if (boss && !boss.dead && boss.intro <= 0 && !hit.includes(boss)) {
          const d = dist2(cur.x, cur.y, boss.x, boss.y);
          if (d < bd) { bd = d; next = boss; }
        }
        cur = next;
      }
      addEffect({ kind: 'spark', pts, life: 0.22, max: 0.22, color: '#ffe066' });
      AUDIO.sfx('spark');
    } else if (w.id === 'ember') {
      for (let i = 0; i < st.n; i++) {
        const a = rand(0, TAU);
        bullets.push({
          kind: 'ember', x: P.x, y: P.y - 3,
          vx: Math.cos(a) * 60, vy: Math.sin(a) * 60,
          r: 3.4, dmg: st.dmg, pierce: 0, life: 2.6, hits: [],
          dead: false, homing: true, blast: st.blast, target: null, ang: a,
        });
      }
      AUDIO.sfx('shoot');
    } else if (w.id === 'bell') {
      for (let k = 0; k < st.n; k++) {
        addEffect({ kind: 'bell', x: P.x, y: P.y, r0: 8, r1: st.r, life: 0.5, max: 0.5, color: '#ffe9a8', delay: k * 0.18 });
      }
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.dead) continue;
        if (dist2(e.x, e.y, P.x, P.y) < st.r * st.r) {
          hitEnemy(e, st.dmg, 0, 0);
          e.slowT = Math.max(e.slowT, st.slowT);
          e.slowAmt = Math.min(e.slowAmt === 1 ? 1 : e.slowAmt, st.slow);
        }
      }
      if (boss && !boss.dead && dist2(boss.x, boss.y, P.x, P.y) < (st.r + boss.r) * (st.r + boss.r)) hitBoss(st.dmg);
      AUDIO.sfx('bell');
      shake = Math.max(shake, 2);
    } else if (w.id === 'spear') {
      const targets = nearestEnemies(P.x, P.y, st.n, 520);
      if (!targets.length) return;
      for (let i = 0; i < st.n; i++) {
        const tg = targets[i % targets.length];
        const a = angleTo(P.x, P.y - 3, tg.x, tg.y);
        bullets.push({
          kind: 'spear', x: P.x, y: P.y - 3,
          vx: Math.cos(a) * st.spd, vy: Math.sin(a) * st.spd,
          r: 3, dmg: st.dmg, pierce: st.pierce, life: 1.6, hits: [], dead: false, ang: a, len: st.len,
        });
      }
      AUDIO.sfx('spear');
    } else if (w.id === 'frost') {
      addEffect({ kind: 'frost', x: P.x, y: P.y, r0: 6, r1: st.r, life: 0.45, max: 0.45, color: '#bfeaff' });
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.dead) continue;
        if (dist2(e.x, e.y, P.x, P.y) < st.r * st.r) {
          hitEnemy(e, st.dmg, 0, 0);
          e.slowT = Math.max(e.slowT, st.slowT);
          e.slowAmt = Math.min(e.slowAmt, st.slow);
          if (st.stun > 0) e.stunT = Math.max(e.stunT, st.stun);
        }
      }
      if (boss && !boss.dead && dist2(boss.x, boss.y, P.x, P.y) < (st.r + boss.r) * (st.r + boss.r)) hitBoss(st.dmg);
      AUDIO.sfx('frost');
    } else if (w.id === 'stormbolt') {
      const t = nearestEnemies(P.x, P.y, st.n, 520);
      if (!t.length) return;
      for (let i = 0; i < st.n; i++) {
        const tg = t[i % t.length];
        const a = angleTo(P.x, P.y - 3, tg.x, tg.y) + (i ? rand(-0.08, 0.08) : 0);
        bullets.push({
          kind: 'storm', x: P.x + Math.cos(a) * 6, y: P.y - 3 + Math.sin(a) * 6,
          vx: Math.cos(a) * st.spd, vy: Math.sin(a) * st.spd,
          r: 2.6, dmg: st.dmg, pierce: st.pierce, life: 1.6, hits: [], dead: false, ang: a,
          homing: true, target: tg,
        });
      }
      AUDIO.sfx('shoot');
    } else if (w.id === 'tide') {
      for (let k = 0; k < st.n; k++) {
        addEffect({ kind: 'nova', x: P.x, y: P.y, r0: 6, r1: st.r, life: 0.5, max: 0.5, color: '#7fe0ff', hit: [], dmg: st.dmg, delay: k * 0.14, stun: 0.4 });
      }
      AUDIO.sfx('nova');
      shake = Math.max(shake, 3.4);
    } else if (w.id === 'judgment') {
      const a = Math.atan2(P.fy, P.fx);
      let healed = 0;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.dead) continue;
        const d = dist(P.x, P.y, e.x, e.y);
        if (d > st.reach + e.r) continue;
        const da = Math.abs(((angleTo(P.x, P.y, e.x, e.y) - a + Math.PI * 3) % TAU) - Math.PI);
        if (da < st.arc) {
          hitEnemy(e, st.dmg, Math.cos(a) * 130, Math.sin(a) * 130);
          healed++;
        }
      }
      if (boss && !boss.dead) {
        const d = dist(P.x, P.y, boss.x, boss.y);
        const da = Math.abs(((angleTo(P.x, P.y, boss.x, boss.y) - a + Math.PI * 3) % TAU) - Math.PI);
        if (d < st.reach + boss.r && da < st.arc) hitBoss(st.dmg);
      }
      if (healed > 0) {
        P.hp = Math.min(P.maxHp, P.hp + 2);
        addText(P.x, P.y - 18, '+2', '#6fd68a', 1, 0.5);
      }
      addEffect({ kind: 'slash', x: P.x, y: P.y, a, arc: st.arc, reach: st.reach, life: 0.26, max: 0.26, color: '#ffd7e0' });
      AUDIO.sfx('crescent');
    } else if (w.id === 'crescent') {
      const a = Math.atan2(P.fy, P.fx);
      const hitList = [];
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.dead) continue;
        const d = dist(P.x, P.y, e.x, e.y);
        if (d > st.reach + e.r) continue;
        let da = Math.abs(((angleTo(P.x, P.y, e.x, e.y) - a + Math.PI * 3) % TAU) - Math.PI);
        if (da < st.arc) {
          hitList.push(e);
          hitEnemy(e, st.dmg, Math.cos(a) * 110, Math.sin(a) * 110);
        }
      }
      if (boss && !boss.dead) {
        const d = dist(P.x, P.y, boss.x, boss.y);
        let da = Math.abs(((angleTo(P.x, P.y, boss.x, boss.y) - a + Math.PI * 3) % TAU) - Math.PI);
        if (d < st.reach + boss.r && da < st.arc) hitBoss(st.dmg);
      }
      addEffect({ kind: 'slash', x: P.x, y: P.y, a, arc: st.arc, reach: st.reach, life: 0.22, max: 0.22, color: '#dff0ff' });
      AUDIO.sfx('crescent');
    }
  }

  function updateWeapons(dt) {
    if (roomAlive() === 0) return;   // 没有敌人时不自动攻击
    for (let i = 0; i < P.weapons.length; i++) {
      const w = P.weapons[i];
      if (w.id === 'orbit' || w.id === 'bloodmoon') {
        const od = defOf(w.id);
        const ost = od.stats[Math.min(w.lvl, od.stats.length) - 1];
        w.ang += ost.rot * dt;
        const st = ost;
        for (let b = 0; b < st.n; b++) {
          const a = w.ang + (b / st.n) * TAU;
          const bx = P.x + Math.cos(a) * st.r;
          const by = P.y - 2 + Math.sin(a) * st.r * 0.86;
          for (let k = 0; k < enemies.length; k++) {
            const e = enemies[k];
            if (e.dead || e.orbitCd > 0) continue;
            if (dist2(bx, by, e.x, e.y) < (st.r * 0.34 + e.r) * (st.r * 0.34 + e.r)) {
              hitEnemy(e, st.dmg, Math.cos(a) * 70, Math.sin(a) * 70);
              if (w.id === 'bloodmoon') { e.burnT = Math.max(e.burnT, 2); e.burnDps = Math.max(e.burnDps, 6); }
              e.orbitCd = st.cd;
            }
          }
          if (boss && !boss.dead && boss.orbitCd <= 0) {
            if (dist2(bx, by, boss.x, boss.y) < (st.r * 0.4 + boss.r) * (st.r * 0.4 + boss.r)) {
              hitBoss(st.dmg);
              boss.orbitCd = st.cd * 1.4;
            }
          }
        }
        continue;
      }
      const d2 = defOf(w.id);
      const st = d2.stats[Math.min(w.lvl, d2.stats.length) - 1];
      w.t -= dt * P.st.atk;
      if (w.t <= 0) {
        w.t = st.cd;
        fireWeapon(w);
      }
      if (w.t > st.cd) w.t = st.cd;
    }
  }

  /* =========================================================
     玩家更新
     ========================================================= */
  function updatePlayer(dt) {
    if (P.spawnT > 0) P.spawnT = Math.max(0, P.spawnT - dt);
    const ax = Input.axis();
    let dx = ax.x, dy = ax.y;
    const moving = Math.abs(dx) + Math.abs(dy) > 0.01;

    if (dx || dy) { P.fx = dx; P.fy = dy; }

    // 主动技能：灯爆
    P.skill.cd = Math.max(0, P.skill.cd - dt);
    if ((Input.hit('e') || Input.btn.skill) && P.skill.cd <= 0) castSkill();

    // 圣物：落雷
    if (P.st.relicThunder) {
      P.thunderT -= dt;
      if (P.thunderT <= 0) {
        P.thunderT = Math.max(3.2, 6 - 0.8 * ((P.relicLvl || 1) - 1));
        const tg = nearestEnemy(P.x, P.y, 260);
        if (tg) {
          addEffect({ kind: 'spark', pts: [{ x: tg.x + rand(-4, 4), y: tg.y - 90 }, { x: tg.x, y: tg.y }], life: 0.24, max: 0.24, color: '#ffe066' });
          hitEnemy(tg, 30, 0, -40, { noBurn: true });
          for (let i = 0; i < 8; i++) spawnParticle(tg.x, tg.y, rand(-60, 60), rand(-60, 20), 0.4, '#ffe066', 1.8, 1, true);
          AUDIO.sfx('spark');
        }
      }
    }
    // 圣物：黎明之盾计时
    if (P.st.relicAegis) {
      P.aegisT -= dt;
      if (P.aegisT <= 0) {
        P.aegisT = Math.max(18, 30 - 4 * ((P.relicLvl || 1) - 1));
        P.shieldOn = true;
        addText(P.x, P.y - 20, '盾成', '#9fe8ff', 1, 0.8);
      }
    }
    P.drainT = Math.max(0, (P.drainT || 0) - dt);

    // 冲刺
    P.dashCd = Math.max(0, P.dashCd - dt);
    // 冲刺只保留 Shift / K：空格用于确认与跳过，E 是灯爆
    if ((Input.hit('shift') || Input.hit('k') || Input.btn.dash) && P.dashCd <= 0 && (dx || dy)) {
      P.dashT = 0.17;
      P.dashCd = 1.55;
      const l = Math.hypot(dx, dy) || 1;
      P.dashDx = dx / l; P.dashDy = dy / l;
      AUDIO.sfx('dash');
      if (P.st.relicEmber) {
        hazards.push({ x: P.x, y: P.y, vx: 0, vy: 0, r: 11, dmg: 0, life: 1.5, kind: 'fire', dead: false, t: 0, friend: true, dps: 14 + 5 * ((P.relicLvl || 1) - 1) });
      }
      for (let i = 0; i < 8; i++) spawnParticle(P.x, P.y, rand(-60, 60), rand(-60, 60), 0.3, '#9fd8ff', 1.6, 2, true);
    }

    P.iframe = Math.max(0, P.iframe - dt);
    P.hurtT = Math.max(0, P.hurtT - dt);

    let spd = P.st.speed;
    if (P.slowT > 0) { P.slowT = Math.max(0, P.slowT - dt); spd *= 0.78; }
    if (P.dashT > 0) {
      P.dashT -= dt;
      P.x += P.dashDx * 340 * dt;
      P.y += P.dashDy * 340 * dt;
      if (Math.random() < 0.7) spawnParticle(P.x + rand(-4, 4), P.y + rand(-4, 4), rand(-10, 10), rand(-10, 10), 0.25, '#7fb8d8', 1.4, 2, true);
      P.vx *= 0.6; P.vy *= 0.6;
    } else {
      // 直接给速度：起步/停步都在一帧内完成
      P.vx = dx * spd;
      P.vy = dy * spd;
      P.x += P.vx * dt;
      P.y += P.vy * dt;
    }
    if (level) D.resolve(P, P.r, activeWalls);

    // 朝向与动画
    if (moving || P.dashT > 0) {
      P.moving = true;
      P.animT += dt * (P.dashT > 0 ? 2 : 1);
      P.frame = Math.floor(P.animT * 6) % 2;
      if (Math.abs(dx) > Math.abs(dy) + 0.2) P.dir = dx > 0 ? 'right' : 'left';
      else if (Math.abs(dy) > Math.abs(dx) + 0.2) P.dir = dy > 0 ? 'down' : 'up';
      else if (dy !== 0) P.dir = dy > 0 ? 'down' : 'up';
      if (Math.random() < dt * 8) {
        spawnParticle(P.x + rand(-3, 3), P.y + 6, rand(-6, 6), rand(-16, -6), 0.4, '#2b3448', 1.2, 1);
      }
    } else {
      P.moving = false;
      P.animT += dt * 0.6;
      P.frame = 0;
    }

    // 回复
    if (P.st.regen > 0) {
      P.regenAcc += P.st.regen * dt;
      if (P.regenAcc >= 1) {
        const heal = Math.floor(P.regenAcc);
        P.regenAcc -= heal;
        P.hp = Math.min(P.maxHp, P.hp + heal);
      }
    }
  }

  function castSkill() {
    const ch = CHARS[P.charId];
    P.skill.cd = P.skill.max;
    const R = 78;
    addEffect({ kind: 'bell', x: P.x, y: P.y, r0: 8, r1: R, life: 0.42, max: 0.42, color: '#ffe9a8' });
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead) continue;
      const dd = dist(P.x, P.y, e.x, e.y);
      if (dd < R) {
        const a = angleTo(P.x, P.y, e.x, e.y);
        hitEnemy(e, 46, Math.cos(a) * 260, Math.sin(a) * 260, { noBurn: true });
        e.stunT = Math.max(e.stunT, 0.3);
      }
    }
    if (boss && !boss.dead && dist(P.x, P.y, boss.x, boss.y) < R + boss.r) hitBoss(40);
    if (ch.id === 'grave') { P.hp = Math.min(P.maxHp, P.hp + 10); addText(P.x, P.y - 20, '+10', '#6fd68a', 1, 0.7); }
    if (ch.id === 'ranger') {
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU;
        bullets.push({
          kind: 'storm', x: P.x, y: P.y - 3, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240,
          r: 2.4, dmg: 14, pierce: 1, life: 0.9, hits: [], dead: false, ang: a, homing: false,
        });
      }
    }
    whiteFlash = Math.max(whiteFlash, 0.3);
    shake = Math.max(shake, 4);
    AUDIO.sfx('nova');
  }

  function playerCollisions() {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead || e.spawnT > 0) continue;
      const rr = P.r + e.r;
      if (dist2(P.x, P.y, e.x, e.y) < rr * rr) {
        damagePlayer(e.dmg, e.x, e.y);
        if (ENEMIES[e.type].drain) {
          P.drainT = 2.6;
          addText(e.x, e.y - 10, '吸光', '#ff6ae0', 1, 0.6);
        }
      }
    }
    if (boss && !boss.dead) {
      const rr = P.r + boss.r;
      if (dist2(P.x, P.y, boss.x, boss.y) < rr * rr) damagePlayer(boss.dmg, boss.x, boss.y);
    }
    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      if (h.dead) continue;
      if (h.kind === 'warn' || h.kind === 'field' || h.kind === 'wave' || h.kind === 'beam' || h.kind === 'flame') continue;
      if (!(h.dmg > 0)) continue;
      const rr = P.r + h.r;
      if (dist2(P.x, P.y, h.x, h.y) < rr * rr) {
        damagePlayer(h.dmg, h.x, h.y);
        h.dead = true;
        for (let k = 0; k < 6; k++) spawnParticle(h.x, h.y, rand(-50, 50), rand(-50, 50), 0.3, '#ff8fb0', 1.4, 1, true);
      }
    }
  }

  /* =========================================================
     敌人更新
     ========================================================= */
  function updateEnemies(dt) {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead) continue;
      const d = ENEMIES[e.type];

      if (e.spawnT > 0) { e.spawnT -= dt; continue; }
      e.animT += dt;
      e.hitT = Math.max(0, e.hitT - dt);
      e.orbitCd = Math.max(0, e.orbitCd - dt);

      const ang = angleTo(e.x, e.y, P.x, P.y);
      let vx = Math.cos(ang) * e.spd;
      let vy = Math.sin(ang) * e.spd;

      if (d.wobble) {
        e.wob += dt * 6;
        vx += Math.cos(ang + Math.PI / 2) * Math.sin(e.wob) * 42;
        vy += Math.sin(ang + Math.PI / 2) * Math.sin(e.wob) * 42;
      }
      if (d.ranged) {
        const dd = dist(e.x, e.y, P.x, P.y);
        if (dd < d.keep) { vx *= -0.72; vy *= -0.72; }
        e.shootT -= dt;
        if (e.shootT <= 0 && dd < 300) {
          e.shootT = d.fastShot ? rand(1.5, 2.1) : rand(2.0, 2.8);
          const a = angleTo(e.x, e.y, P.x, P.y);
          hazards.push({
            x: e.x, y: e.y, vx: Math.cos(a) * (d.fastShot ? 212 : 152), vy: Math.sin(a) * (d.fastShot ? 212 : 152),
            r: d.fastShot ? 2.6 : 3.2, dmg: e.dmg * 0.9, life: 3, kind: 'spit', dead: false, t: 0,
          });
          AUDIO.sfx('shoot');
        }
      }
      if (e.type === 'ghost') {
        e.phaseA = 0.55 + Math.sin(e.animT * 2.2) * 0.3;
      }
      if (d.shielded) e.face = ang;
      if (d.slam) {
        e.slamT = e.slamT === undefined ? rand(1.6, 2.4) : e.slamT - dt;
        if (e.slamPhase === 1) {
          if (e.slamT <= 0) {
            e.slamPhase = 0; e.slamT = rand(2.4, 3.4);
            e.x = e.tx; e.y = e.ty;
            if (level) D.resolve(e, e.r, activeWalls);
            shake = Math.max(shake, 3);
            for (let k = 0; k < 14; k++) spawnParticle(e.x, e.y + 4, rand(-90, 90), rand(-60, 10), rand(0.3, 0.7), '#c9b08a', 2, 0.6, true);
            AUDIO.sfx('explode');
          }
        } else if (e.slamT <= 0) {
          if (dist(e.x, e.y, P.x, P.y) < 280) {
            e.slamPhase = 1; e.slamT = 0.85;
            e.tx = P.x; e.ty = P.y;
            hazards.push({ kind: 'warn', x: P.x, y: P.y, r: 32, life: 0.85, damage: e.dmg * 1.3, t: 0, dead: false });
            AUDIO.sfx('clock');
          } else e.slamT = rand(0.8, 1.4);
        }
      }
      if (d.magic) {
        e.shootT -= dt;
        if (e.shootT <= 0) {
          e.shootT = rand(3.6, 4.8);
          if (dist(e.x, e.y, P.x, P.y) < 300) {
            hazards.push({ kind: 'warn', x: P.x, y: P.y, r: 36, life: 0.8, magic: true, damage: 0, t: 0, dead: false });
            AUDIO.sfx('spark');
          }
        }
      }
      if (d.summoner) {
        e.sumT -= dt;
        const dd = dist(e.x, e.y, P.x, P.y);
        if (dd < 150) { vx *= -0.6; vy *= -0.6; }
        if (e.sumT <= 0) {
          e.sumT = 5.6;
          const kinds = ['wisp', 'bat', 'leech'];
          for (let k = 0; k < 2; k++) {
            const a2 = rand(0, TAU);
            const m = spawnEnemy(kinds[(Math.random() * kinds.length) | 0], e.x + Math.cos(a2) * 22, e.y + Math.sin(a2) * 22, false);
            if (m) m.spawnT = 0.35;
          }
          addEffect({ kind: 'ring', x: e.x, y: e.y, r0: 4, r1: 30, life: 0.35, max: 0.35, color: '#9fe8ff' });
          AUDIO.sfx('boss');
        }
      }
      if (d.bomber) {
        const dd = dist(e.x, e.y, P.x, P.y);
        if (e.fuse === null && dd < 34) { e.fuse = 0.6; AUDIO.sfx('hover'); }
        if (e.fuse !== null) {
          e.fuse -= dt;
          vx *= 0.25; vy *= 0.25;
          if (Math.random() < 0.5) spawnParticle(e.x + rand(-3, 3), e.y - 6, rand(-8, 8), rand(-20, -6), 0.3, '#ffd166', 1.4, 2, true);
          if (e.fuse <= 0) { killEnemy(e, {}); continue; }
        }
      }
      // 状态：减速 / 定身 / 灼烧
      if (e.slowT > 0) { e.slowT -= dt; vx *= e.slowAmt; vy *= e.slowAmt; }
      if (e.stunT > 0) { e.stunT -= dt; vx = 0; vy = 0; }
      if (e.burnT > 0) {
        e.burnT -= dt;
        e.burnAcc += dt;
        if (e.burnAcc >= 0.35) {
          e.burnAcc -= 0.35;
          hitEnemy(e, e.burnDps * 0.35, 0, 0, { silent: true, noCrit: true, flat: true, noBurn: true });
          if (Math.random() < 0.7) spawnParticle(e.x + rand(-4, 4), e.y + rand(-5, 3), rand(-8, 8), rand(-26, -8), 0.3, '#ff9c3a', 1.3, 2, true);
        }
      }
      // 暖灯：光内减速
      if (P.st.relicHearth) {
        const dd0 = dist(e.x, e.y, P.x, P.y);
        if (dd0 < 62 * P.st.light) { vx *= 0.88; vy *= 0.88; }
      }

      // 群体分离
      let sepX = 0, sepY = 0;
      for (let k = 0; k < enemies.length; k++) {
        if (k === i) continue;
        const o = enemies[k];
        if (o.dead) continue;
        const ddx = e.x - o.x, ddy = e.y - o.y;
        const dd2 = ddx * ddx + ddy * ddy;
        const rr = (e.r + o.r) * 0.92;
        if (dd2 > 0.01 && dd2 < rr * rr) {
          const dd = Math.sqrt(dd2);
          sepX += (ddx / dd) * (1 - dd / rr) * 40;
          sepY += (ddy / dd) * (1 - dd / rr) * 40;
        }
      }

      e.x += (vx + e.kx + sepX) * dt;
      e.y += (vy + e.ky + sepY) * dt;
      if (level) D.resolve(e, e.r, activeWalls);
      e.kx *= Math.pow(0.02, dt);
      e.ky *= Math.pow(0.02, dt);

      // 远离过远则回收（防止无限堆积）
      if (dist2(e.x, e.y, P.x, P.y) > 620 * 620) e.dead = true;
    }
  }

  /* =========================================================
     投射物 / 危险物 / 拾取
     ========================================================= */
  function updateBullets(dt) {
    if (bullets.length > 260) bullets.splice(0, bullets.length - 260);
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      if (b.dead) continue;
      b.life -= dt;
      if (b.life <= 0) { b.dead = true; continue; }

      if (b.homing) {
        if (!b.target || b.target.dead) {
          b.target = nearestEnemy(b.x, b.y, 220);
        }
        if (b.target) {
          const a = angleTo(b.x, b.y, b.target.x, b.target.y);
          const sp = Math.hypot(b.vx, b.vy);
          const sa = Math.atan2(b.vy, b.vx);
          let diff = ((a - sa + Math.PI * 3) % TAU) - Math.PI;
          const na = sa + clamp(diff, -7 * dt, 7 * dt);
          b.vx = Math.cos(na) * sp;
          b.vy = Math.sin(na) * sp;
          b.ang = na;
        }
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (level && D.pointInWalls(b.x, b.y, activeWalls)) { b.dead = true; continue; }

      // 命中
      let hitSomething = false;
      for (let k = 0; k < enemies.length; k++) {
        const e = enemies[k];
        if (e.dead || e.spawnT > 0) continue;
        if (b.hits.indexOf(e) >= 0) continue;
        const rr = b.r + e.r;
        if (dist2(b.x, b.y, e.x, e.y) < rr * rr) {
          b.hits.push(e);
          if (b.kind === 'ember') {
            b.dead = true;
            hitEnemy(e, b.dmg, b.vx * 0.4, b.vy * 0.4, { explodeBlast: b.blast, blastDmg: b.dmg * 0.55 });
            addEffect({ kind: 'ring', x: b.x, y: b.y, r0: 2, r1: b.blast, life: 0.3, max: 0.3, color: '#ffc75e' });
            AUDIO.sfx('explode');
            shake = Math.max(shake, 1.6);
            hitSomething = true;
            break;
          }
          hitEnemy(e, b.dmg, b.vx * 0.25, b.vy * 0.25);
          if (b.pierce > 0) { b.pierce--; }
          else { b.dead = true; hitSomething = true; break; }
        }
      }
      if (b.dead && !hitSomething && b.kind === 'ember') {
        // 未命中而过期 -> 小爆裂
        addEffect({ kind: 'ring', x: b.x, y: b.y, r0: 2, r1: b.blast * 0.7, life: 0.24, max: 0.24, color: '#ffc75e' });
      }
      if (b.dead) continue;
      if (boss && !boss.dead) {
        const rr = b.r + boss.r;
        if (dist2(b.x, b.y, boss.x, boss.y) < rr * rr) {
          if (b.kind === 'ember') {
            b.dead = true;
            hitBoss(b.dmg);
            addEffect({ kind: 'ring', x: b.x, y: b.y, r0: 2, r1: b.blast, life: 0.3, max: 0.3, color: '#ffc75e' });
          } else {
            hitBoss(b.dmg);
            if (b.pierce > 0) b.pierce--; else b.dead = true;
          }
        }
      }
      if (b.kind === 'bolt' && Math.random() < 0.6) {
        spawnParticle(b.x, b.y, rand(-8, 8), rand(-8, 8), 0.16, '#ffe9a8', 1, 2, true);
      }
      if (b.kind === 'ember' && Math.random() < 0.8) {
        spawnParticle(b.x, b.y, rand(-14, 14), rand(-14, 14), 0.3, '#ffb347', 1.4, 2, true);
      }
    }
  }

  function updateHazards(dt) {
    if (hazards.length > 200) hazards.splice(0, hazards.length - 200);
    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      if (h.dead) continue;
      h.t += dt;
      if (h.kind === 'beam') {
        if (h.rot) h.ang += h.rot * dt;
        if (h.osc) h.ang = h.baseAng + Math.sin(h.t * h.osc) * h.amp;
        h.life -= dt;
        if (h.life <= 0) { h.dead = true; continue; }
        const ex = h.x + Math.cos(h.ang) * h.len;
        const ey = h.y + Math.sin(h.ang) * h.len;
        const dx = ex - h.x, dy = ey - h.y;
        const tt = clamp(((P.x - h.x) * dx + (P.y - h.y) * dy) / (dx * dx + dy * dy), 0, 1);
        const nx = h.x + dx * tt, ny = h.y + dy * tt;
        if (dist2(P.x, P.y, nx, ny) < (h.w / 2 + P.r) * (h.w / 2 + P.r)) {
          h.hitCd = (h.hitCd || 0) - dt;
          if (h.hitCd <= 0) { h.hitCd = 0.4; damagePlayer(h.dmg, nx, ny); }
        }
        if (Math.random() < 0.7) {
          spawnParticle(nx + rand(-6, 6), ny + rand(-6, 6), rand(-24, 24), rand(-24, 24), 0.3, h.col || '#ffb45a', 1.4, 1, true);
        }
        continue;
      }
      if (h.kind === 'warn') {
        h.life -= dt;
        if (h.life <= 0) {
          h.dead = true;
          if (h.note) {
            for (let k = 0; k < 8; k++) {
              const a2 = (k / 8) * Math.PI * 2;
              hazards.push({ x: h.x, y: h.y, vx: Math.cos(a2) * 86, vy: Math.sin(a2) * 86,
                r: 3, dmg: 10 + floorIdx * 2, life: 3, kind: 'boss', dead: false, t: 0 });
            }
            addEffect({ kind: 'ring', x: h.x, y: h.y, r0: 4, r1: 38, max: 0.4, life: 0.4, color: 'rgba(140,220,255,0.6)' });
            AUDIO.sfx('spark');
          } else if (h.burst) {
            for (let k = 0; k < 12; k++) {
              const a2 = (k / 12) * Math.PI * 2;
              hazards.push({ x: h.x, y: h.y, vx: Math.cos(a2) * 92, vy: Math.sin(a2) * 92,
                r: 3.4, dmg: (h.damage || 10) * 0.6, life: 3, kind: 'boss', dead: false, t: 0 });
            }
            if (h.damage > 0 && dist(P.x, P.y, h.x, h.y) < h.r + P.r) damagePlayer(h.damage, h.x, h.y);
            addEffect({ kind: 'ring', x: h.x, y: h.y, r0: 4, r1: 40, max: 0.4, life: 0.4, color: 'rgba(220,230,255,0.6)' });
          } else if (h.magic) {
            hazards.push({ kind: 'field', x: h.x, y: h.y, r: 36, life: 4.5, t: 0, dps: 9 + floorIdx * 3, dead: false });
            addEffect({ kind: 'ring', x: h.x, y: h.y, r0: 6, r1: 46, max: 0.5, life: 0.5, color: 'rgba(160,120,255,0.55)' });
            for (let k = 0; k < 14; k++) spawnParticle(h.x + rand(-20, 20), h.y + rand(-20, 20), rand(-30, 30), rand(-40, -6), 0.6, '#b48cff', 2, 0.4, true);
          } else {
            if (dist(P.x, P.y, h.x, h.y) < h.r + P.r) damagePlayer(h.damage, h.x, h.y);
            addEffect({ kind: 'ring', x: h.x, y: h.y, r0: 4, r1: h.r + 8, max: 0.4, life: 0.4, color: 'rgba(255,180,120,0.6)' });
            shake = Math.max(shake, 2.5);
          }
        }
        continue;
      }
      if (h.kind === 'field') {
        h.life -= dt;
        h.dmgAcc = (h.dmgAcc || 0) + dt;
        if (h.dmgAcc > 0.5) {
          h.dmgAcc = 0;
          if (dist(P.x, P.y, h.x, h.y) < h.r + P.r * 0.5) {
            damagePlayer(h.dps * 0.5, h.x, h.y);
            P.slowT = Math.max(P.slowT, 0.8);
          }
        }
        if (h.life <= 0) h.dead = true;
        if (Math.random() < 0.3) spawnParticle(h.x + rand(-h.r, h.r), h.y + rand(-h.r * 0.8, h.r * 0.8), rand(-6, 6), rand(-24, -6), 0.6, (h.col || '#a07ce0'), 1.6, 1.2, true);
        continue;
      }
      if (h.kind === 'wave') {
        h.life -= dt;
        const k = clamp(1 - h.life / h.maxLife, 0, 1);
        h.r = h.r0 + (h.r1 - h.r0) * k;
        if (!h.hit && Math.abs(dist(P.x, P.y, h.x, h.y) - h.r) < 12 + P.r) {
          h.hit = true;
          damagePlayer(h.dmg, h.x, h.y);
        }
        if (h.life <= 0) h.dead = true;
        continue;
      }
      if (h.kind === 'flame') {
        h.life -= dt;
        h.x += h.vx * dt; h.y += h.vy * dt;
        h.vx *= Math.pow(0.1, dt); h.vy *= Math.pow(0.1, dt);
        h.acc = (h.acc || 0) + dt;
        if (h.acc > 0.3) {
          h.acc = 0;
          if (dist(P.x, P.y, h.x, h.y) < h.r + P.r) damagePlayer(h.dmg, h.x, h.y);
        }
        if (h.life <= 0) h.dead = true;
        continue;
      }
      if (h.kind === 'homing') {
        const sp2 = Math.hypot(h.vx, h.vy) || 1;
        const aa = angleTo(h.x, h.y, P.x, P.y);
        const tt = 1 - Math.pow(0.25, dt * (h.turn || 2));
        h.vx = lerp(h.vx, Math.cos(aa) * sp2, tt);
        h.vy = lerp(h.vy, Math.sin(aa) * sp2, tt);
      }
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.life -= dt;
      if (level && D.pointInWalls(h.x, h.y, activeWalls)) h.dead = true;
      if (h.life <= 0) h.dead = true;
      if (h.friend) {
        h.dmgAcc = (h.dmgAcc || 0) + dt;
        if (h.dmgAcc > 0.25) {
          h.dmgAcc = 0;
          for (let k = 0; k < enemies.length; k++) {
            const en = enemies[k];
            if (en.dead) continue;
            if (dist2(en.x, en.y, h.x, h.y) < (h.r + en.r) * (h.r + en.r)) {
              hitEnemy(en, h.dps * 0.25, 0, 0, { silent: true, noBurn: true, flat: true });
            }
          }
        }
        spawnParticle(h.x + rand(-h.r, h.r), h.y + rand(-h.r * 0.6, h.r * 0.6), rand(-10, 10), rand(-30, -8), 0.4, '#ff9c3a', 1.6, 2, true);
      } else if (Math.random() < 0.5) spawnParticle(h.x, h.y, rand(-6, 6), rand(-6, 6), 0.25, '#c76fa8', 1.1, 2, true);
    }
  }

  function updatePickups(dt) {
    if (pickups.length > 220) pickups.splice(0, pickups.length - 220);
    for (let i = 0; i < pickups.length; i++) {
      const p = pickups[i];
      if (p.dead) continue;
      p.t += dt;
      p.life -= dt;
      if (p.life <= 0) { p.dead = true; continue; }
      if (p.magnet) p.life = Math.max(p.life, 1.5);
      const d = dist(P.x, P.y, p.x, p.y);
      const pr = p.magnet ? 4096 : (p.kind === 'heart' ? 22 : P.st.pickup);
      if (d < pr) {
        const a = angleTo(p.x, p.y, P.x, P.y);
        const pull = p.magnet ? 560 + Math.max(0, 260 - d) : 120 + (1 - d / pr) * 260;
        p.x += Math.cos(a) * pull * dt;
        p.y += Math.sin(a) * pull * dt;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= Math.pow(0.05, dt);
        p.vy *= Math.pow(0.05, dt);
      }
      if (d < 8) {
        p.dead = true;
        if (p.kind === 'xp') {
          P.xp += p.val * P.st.xp * 0.6;
          xpCollected++;
          AUDIO.sfx('pickup', { p: 0.9 + Math.min(1, P.xp / P.xpNeed) * 0.6 });
          spawnParticle(p.x, p.y, rand(-20, 20), rand(-40, -10), 0.35, '#7fe0ff', 1.6, 1, true);
          checkLevel();
        } else {
          P.hp = Math.min(P.maxHp, P.hp + p.val);
          AUDIO.sfx('heal');
          addText(P.x, P.y - 16, '+' + p.val, '#6fd68a', 1.2, 0.9);
          for (let k = 0; k < 6; k++) spawnParticle(p.x, p.y, rand(-30, 30), rand(-50, -10), 0.5, '#6fd68a', 1.4, 1, true);
        }
      }
    }
  }

  function checkLevel() {
    let guard = 0;
    while (P.xp >= P.xpNeed && guard++ < 8) {
      P.xp -= P.xpNeed;
      P.level++;
      P.xpNeed = xpNeed(P.level);
      openLevelUp();
    }
  }

  /* =========================================================
     Boss
     ========================================================= */
  function spawnBoss(which) {
    const idx = clamp(which | 0, 0, 11);
    const def = BOSS_DEFS[idx];
    const tier = endlessTier || 0;
    const hp = Math.round((def.hp + 150 * idx + 110 * floorIdx) * (1 + 0.10 * floorIdx) * Math.pow(1.55, tier));
    const dmg = (def.dmg + 1.5 * idx) * (1 + 0.12 * floorIdx) * Math.pow(1.2, tier);
    boss = {
      x: room ? room.x + room.w / 2 + (idx % 2 ? 60 : -60) : P.x,
      y: room ? room.y + room.h * 0.34 : P.y - 120,
      hp: hp, maxHp: hp,
      r: def.r + (idx >= 10 ? 2 : 0),
      dmg: dmg,
      spd: def.spd + idx * 0.5,
      type: 'b' + idx,
      idx: idx,
      def: def,
      name: def.name,
      roomId: room ? room.id : null,
      spr: SPR.bossFrames ? SPR.bossFrames[idx] : [SPR.boss1],
      ang: 0, hitT: 0, orbitCd: 0, dead: false,
      phase: 1, charge: 0, chargeDx: 0, chargeDy: 0, telegraph: 0,
      intro: 2.4, tier: tier,
      col: def.col,
      act: null, actT: 0, actId: null, fired: false, lastAct: null, nextT: 0.7,
      trail: [], phase2T: 0, spiralT: 0, beatT: 0, noteT: 0, drainT: 0, chargeAng: 0,
    };
    const intro = def.intro || ['「……。」'];
    storyQuote = { name: def.name, lines: intro.slice(), t: 3.2, life: 3.2 };
    P.hp = Math.min(P.maxHp, P.hp + Math.round(P.maxHp * 0.25));
    META.unlock(save, 'enemies', idx % 2 ? 'boss2' : 'boss1');
    biteBanner(def.name + ' 苏 醒');
    AUDIO.sfx('boss');
    AUDIO.setMood('boss');
    shake = 8;
  }

  function hitBoss(base) {
    if (!boss || boss.dead || boss.intro > 0) return;
    const crit = Math.random() < P.st.crit;
    const dmg = Math.max(1, Math.round(base * P.st.dmg * (crit ? 2 : 1)));
    boss.hp -= dmg;
    boss.hitT = 0.1;
    totalDmg += dmg;
    addText(boss.x + rand(-8, 8), boss.y - boss.r - 6, String(dmg), crit ? '#ffe066' : '#ffd0d6', crit ? 1.6 : 1, 0.6);
    for (let i = 0; i < 3; i++) spawnParticle(boss.x + rand(-6, 6), boss.y + rand(-6, 6), rand(-40, 40), rand(-40, 40), 0.4, '#d9707a', 1.6, 1);
    if (Math.random() < 0.6) AUDIO.sfx('bossHit');
    if (boss.hp <= 0) killBoss();
  }

  function killBoss() {
    const bx = boss.x, by = boss.y;
    lastBossDef = boss.def;
    boss.dead = true;
    AUDIO.sfx('explode');
    shake = 12;
    whiteFlash = 0.8;
    for (let i = 0; i < 60; i++) {
      spawnParticle(bx + rand(-20, 20), by + rand(-20, 20), rand(-160, 160), rand(-160, 160), rand(0.6, 1.4), i % 3 ? '#ff8fb0' : '#ffe9a8', rand(1.5, 3), 0.6, true);
    }
    for (let i = 0; i < 14; i++) dropXp(bx + rand(-20, 20), by + rand(-20, 20), 3);
    const firstBoss = boss1KillTime === null;
    if (firstBoss) boss1KillTime = runTime;
    if (firstBoss && !save.unlocked.includes('grave')) {
      save.unlocked.push('grave');
      G.Store.save();
      biteBanner('守 墓 人 · 已 解 锁');
      AUDIO.sfx('levelup');
      whiteFlash = Math.max(whiteFlash, 0.35);
    }
    boss = null;
    P.hp = Math.min(P.maxHp, P.hp + 40);
    AUDIO.setMood('battle');
    for (let i = 0; i < 40; i++) spawnParticle(P.x + rand(-30, 30), P.y + rand(-30, 30), rand(-30, 30), rand(-60, -10), rand(0.6, 1.4), '#ffe9a8', rand(1, 2), 0.4, true);
  }

  const BOSS_DEFS = [
    { name: '灯笼吞噬者', col: '#ffb060', style: 'ember', hp: 340, dmg: 13, spd: 26, r: 16,
      acts: ['ring', 'charge', 'snuff', 'sweep', 'summon'], pool: ['crawler', 'bat'],
      intro: ['「灯，留下。」', '「这里不需要黎明。」'], death: ['「……灯灭了。」'] },
    { name: '灰烬守夜人', col: '#d08a5a', style: 'ash', hp: 360, dmg: 14, spd: 24, r: 17,
      acts: ['quake', 'flame', 'homing', 'charge', 'summon'], pool: ['bomber', 'crawler'],
      intro: ['「灰烬里，还有余温。」'], death: ['「火……还没熄。」'] },
    { name: '钟楼执事', col: '#e0c070', style: 'bell', hp: 380, dmg: 15, spd: 23, r: 17,
      acts: ['beat', 'cross', 'sweep', 'charge', 'summon'], pool: ['archer', 'bat'],
      intro: ['「钟声一响，夜就深了。」'], death: ['「钟……停了。」'] },
    { name: '深黯之母', col: '#c07ade', style: 'tendril', hp: 420, dmg: 16, spd: 28, r: 19,
      acts: ['spiral', 'web', 'teleport', 'drain', 'summon'], pool: ['wisp', 'ghost'],
      intro: ['「孩子，外面没有黎明。」'], death: ['「我把黑夜……给你。」'] },
    { name: '沼泽主教', col: '#7ad07a', style: 'poison', hp: 440, dmg: 17, spd: 26, r: 18,
      acts: ['poison', 'homing', 'web', 'teleport', 'summon'], pool: ['leech', 'ghost'],
      intro: ['「泥里也会开花。」'], death: ['「花……谢了。」'] },
    { name: '沉钟行者', col: '#5fc0c0', style: 'drowned', hp: 460, dmg: 18, spd: 25, r: 19,
      acts: ['beat', 'sweep', 'drain', 'cross', 'summon'], pool: ['ghost', 'leech'],
      intro: ['「水下的钟，也在响。」'], death: ['「让我……沉下去。」'] },
    { name: '节拍收藏家', col: '#8fd8ff', style: 'metronome', hp: 480, dmg: 18, spd: 28, r: 18,
      acts: ['metronome', 'notes', 'beat', 'chord', 'summon'], pool: ['wisp', 'bat'],
      intro: ['「跟着拍子，别走神。」'], death: ['「最后一个……音符。」'] },
    { name: '风蚀巨像', col: '#e0c080', style: 'wind', hp: 520, dmg: 21, spd: 21, r: 21,
      acts: ['quake', 'charge', 'cross', 'homing', 'summon'], pool: ['brute', 'crawler'],
      intro: ['「风会把你磨成沙。」'], death: ['「风……停了。」'] },
    { name: '断桥织网者', col: '#8aa898', style: 'web', hp: 540, dmg: 20, spd: 27, r: 19,
      acts: ['web', 'teleport', 'laser', 'spiral', 'summon'], pool: ['archer', 'shade'],
      intro: ['「桥断了，就别想过去。」'], death: ['「网……破了。」'] },
    { name: '长夜之核', col: '#ff6070', style: 'night', hp: 580, dmg: 23, spd: 28, r: 20,
      acts: ['spiral', 'cross', 'wave', 'drain', 'summon'], pool: ['shade', 'summoner'],
      intro: ['「这就是长夜的中心。」'], death: ['「夜……也会碎。」'] },
    { name: '镜之守夜人', col: '#d8e8ff', style: 'mirror', hp: 620, dmg: 22, spd: 30, r: 20,
      acts: ['mirror', 'teleport', 'chord', 'homing', 'summon'], pool: ['shade', 'archer'],
      intro: ['「你打的，是你自己。」'], death: ['「镜子里……空了。」'] },
    { name: '提灯者的倒影', col: '#ffcf6e', style: 'reflection', hp: 700, dmg: 25, spd: 30, r: 20,
      acts: ['ring', 'charge', 'laser', 'notes', 'summon'], pool: ['wisp', 'shade'],
      intro: ['「你提着的灯，也是我的。」'], death: ['「原来……黎明是真的。」'] },
  ];

  function bossBullet(b, ang, spd, dmgMul) {
    hazards.push({
      x: b.x, y: b.y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
      r: 3.4, dmg: b.dmg * dmgMul, life: 4, kind: 'boss', dead: false, t: 0,
    });
  }

  function bossRing(b, n, spd, mul, off, gap) {
    const base = b.ang + (off || 0);
    for (let i = 0; i < n; i++) {
      if (gap && i % gap === 0) continue;
      bossBullet(b, base + (i / n) * TAU, spd, mul);
    }
  }
  function bossWarn(x, y, r, life, opt) {
    const o = opt || {};
    hazards.push({ kind: 'warn', x: x, y: y, r: r, life: life, t: 0, dead: false, damage: 0, magic: false });
    const h = hazards[hazards.length - 1];
    if (o.damage !== undefined) h.damage = o.damage;
    if (o.burst) h.burst = true;
    if (o.magic) h.magic = true;
    if (o.col) h.col = o.col;
    return h;
  }
  function bossBeam(b, ang, opt) {
    const o = opt || {};
    hazards.push({
      kind: 'beam', x: b.x, y: b.y, ang: ang, len: o.len || 300, w: o.w || 6,
      rot: o.rot || 0, osc: o.osc || 0, amp: o.amp || 0, baseAng: o.baseAng !== undefined ? o.baseAng : ang,
      dmg: o.dmg !== undefined ? o.dmg : b.dmg * 0.5, life: o.life || 2.2,
      t: 0, dead: false, col: b.col,
    });
  }
  function bossField(x, y, r, life, dps, col) {
    hazards.push({ kind: 'field', x: x, y: y, r: r, life: life, t: 0, dps: dps, dead: false, col: col || '#7ad07a' });
  }
  function bossWave(b) {
    hazards.push({ kind: 'wave', x: b.x, y: b.y, r0: 12, r1: 190, r: 12, life: 0.9, maxLife: 0.9,
      dmg: b.dmg * 0.8, t: 0, dead: false, col: b.col });
  }
  function bossAdds(b, n) {
    const pool = b.def.pool || ['crawler', 'bat'];
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      spawnEnemy(pool[i % pool.length], b.x + Math.cos(a) * 42, b.y + Math.sin(a) * 42, false);
    }
    addEffect({ kind: 'ring', x: b.x, y: b.y, r0: 6, r1: 58, max: 0.45, life: 0.45, color: 'rgba(160,120,220,0.55)' });
    AUDIO.sfx('explode');
  }

  const ATTACKS = {
    ring: { name: '灯 环', tele: 0.55, dur: 0.45, cd: 2.6, payload: function (b) {
      const n = 13 + Math.floor(b.idx / 3) + (b.phase === 2 ? 4 : 0);
      bossRing(b, n, 94, 0.55, 0, 0);
      if (b.phase === 2) bossRing(b, n, 110, 0.5, 0.4, 0);
      addEffect({ kind: 'ring', x: b.x, y: b.y, r0: 6, r1: 64, max: 0.4, life: 0.4, color: 'rgba(255,190,110,0.6)' });
      shake = Math.max(shake, 3);
      AUDIO.sfx('nova');
    } },
    charge: { name: '扑 食', tele: 0.5, dur: 0.7, cd: 3.4, payload: function (b) {
      const a = angleTo(b.x, b.y, P.x, P.y);
      b.chargeDx = Math.cos(a) * (b.phase === 2 ? 330 : 300);
      b.chargeDy = Math.sin(a) * (b.phase === 2 ? 330 : 300);
      b.charge = 0.62; b.chargeAng = a;
      AUDIO.sfx('boss');
    } },
    snuff: { name: '灯 灭', tele: 0.75, dur: 0.5, cd: 5.0, payload: function (b) {
      P.drainT = Math.max(P.drainT || 0, 3.2);
      for (let i = 0; i < 10; i++) bossBullet(b, b.ang + (i / 10) * TAU, 70, 0.4);
      addEffect({ kind: 'ring', x: b.x, y: b.y, r0: 10, r1: 172, max: 0.8, life: 0.8, color: 'rgba(90,70,130,0.65)' });
      redFlash = 0.35;
      AUDIO.sfx('death');
    } },
    sweep: { name: '扫 灯', tele: 0.6, dur: 2.2, cd: 5.2, payload: function (b) {
      for (let k = 0; k < 2; k++) {
        bossBeam(b, b.ang + k * Math.PI, { rot: (k ? -1.7 : 1.7) * (b.phase === 2 ? 1.25 : 1), len: 310, w: 6, life: 2.2 });
      }
      AUDIO.sfx('boss');
    } },
    summon: { name: '唤 灵', tele: 0.5, dur: 0.35, cd: 5.4, payload: function (b) {
      bossAdds(b, Math.min(8, 3 + floorIdx));
    } },
    quake: { name: '震 地', tele: 0.7, dur: 0.6, cd: 4.6, payload: function (b) {
      bossWave(b);
      for (let k = 0; k < 3; k++) bossWarn(P.x + rand(-40, 40), P.y + rand(-30, 30), 30, 0.8, { damage: b.dmg * 0.9 });
      shake = Math.max(shake, 8);
      addEffect({ kind: 'ring', x: b.x, y: b.y, r0: 10, r1: 200, max: 0.7, life: 0.7, color: 'rgba(220,180,120,0.5)' });
      AUDIO.sfx('explode');
    } },
    flame: { name: '余 烬', tele: 0.6, dur: 0.5, cd: 4.4, payload: function (b) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU + b.ang;
        hazards.push({ kind: 'flame', x: b.x + Math.cos(a) * 30, y: b.y + Math.sin(a) * 30,
          vx: Math.cos(a) * 34, vy: Math.sin(a) * 34, r: 9, life: 3, dmg: b.dmg * 0.3, t: 0, dead: false, col: b.col });
      }
      AUDIO.sfx('explode');
    } },
    homing: { name: '追 魂', tele: 0.55, dur: 0.5, cd: 4.2, payload: function (b) {
      for (let i = 0; i < 5; i++) {
        const a = b.ang + (i / 5) * TAU;
        hazards.push({ kind: 'homing', x: b.x, y: b.y, vx: Math.cos(a) * 74, vy: Math.sin(a) * 74,
          r: 3.8, dmg: b.dmg * 0.45, life: 5, turn: 2.2, t: 0, dead: false, col: b.col });
      }
      AUDIO.sfx('spark');
    } },
    beat: { name: '鼓 点', tele: 0.5, dur: 1.7, cd: 4.2, payload: function () {}, sustain: function (b, dt) {
      b.beatT -= dt;
      if (b.beatT <= 0) {
        b.beatT = 0.5;
        const n = 18, ga = rand(0, TAU);
        for (let i = 0; i < n; i++) {
          if (i % 7 === 0) continue;
          bossBullet(b, ga + (i / n) * TAU, 86, 0.4);
        }
        addEffect({ kind: 'ring', x: b.x, y: b.y, r0: 6, r1: 108, max: 0.5, life: 0.5, color: 'rgba(140,220,255,0.5)' });
        AUDIO.sfx('nova');
      }
    } },
    cross: { name: '十 字', tele: 0.6, dur: 2.0, cd: 5.0, payload: function (b) {
      for (let k = 0; k < 4; k++) {
        bossBeam(b, b.ang + k * Math.PI / 2, { rot: 0.5 * (b.phase === 2 ? 1.4 : 1), len: 290, w: 5, life: 2.0 });
      }
      AUDIO.sfx('boss');
    } },
    spiral: { name: '螺 旋', tele: 0.6, dur: 2.4, cd: 4.6, payload: function () {}, sustain: function (b, dt) {
      b.spiralT -= dt;
      if (b.spiralT <= 0) {
        b.spiralT = 0.17;
        const a = b.ang * 2.6;
        bossBullet(b, a, 78, 0.4);
        bossBullet(b, a + Math.PI, 78, 0.4);
      }
    } },
    web: { name: '罗 网', tele: 0.7, dur: 0.45, cd: 5.2, payload: function (b) {
      for (let ring = 0; ring < 3; ring++) {
        const n = 18;
        for (let i = 0; i < n; i++) {
          if (i % 6 === ring) continue;
          bossBullet(b, b.ang + ring * 0.17 + (i / n) * TAU, 72 + ring * 22, 0.42);
        }
      }
      AUDIO.sfx('spark');
    } },
    teleport: { name: '潜 影', tele: 0.45, dur: 0.45, cd: 4.0, payload: function (b) {
      const a = rand(0, TAU);
      b.x = clamp(P.x + Math.cos(a) * 74, room.x + 40, room.x + room.w - 40);
      b.y = clamp(P.y + Math.sin(a) * 74, room.y + 40, room.y + room.h - 40);
      for (let i = 0; i < 12; i++) bossBullet(b, b.ang + (i / 12) * TAU, 86, 0.45);
      addEffect({ kind: 'ring', x: b.x, y: b.y, r0: 4, r1: 70, max: 0.5, life: 0.5, color: 'rgba(160,110,255,0.6)' });
      whiteFlash = Math.max(whiteFlash, 0.25);
      AUDIO.sfx('dash');
    } },
    drain: { name: '吸 魂', tele: 0.55, dur: 1.9, cd: 5.6, payload: function () {}, sustain: function (b, dt) {
      const a = angleTo(P.x, P.y, b.x, b.y);
      P.x += Math.cos(a) * 82 * dt;
      P.y += Math.sin(a) * 82 * dt;
      if (level) D.resolve(P, P.r, activeWalls);
      if (dist(b.x, b.y, P.x, P.y) < 46) {
        b.drainT -= dt;
        if (b.drainT <= 0) { b.drainT = 0.4; damagePlayer(b.dmg * 0.5, b.x, b.y); }
        for (let k = 0; k < 2; k++) spawnParticle(P.x + rand(-8, 8), P.y + rand(-8, 8), rand(-40, 40), rand(-40, 40), 0.4, b.col, 1.6, 1, true);
      }
    } },
    poison: { name: '毒 沼', tele: 0.7, dur: 0.5, cd: 4.8, payload: function (b) {
      for (let k = 0; k < 3; k++) {
        bossField(clamp(P.x + rand(-60, 60), room.x + 30, room.x + room.w - 30),
          clamp(P.y + rand(-46, 46), room.y + 30, room.y + room.h - 30), 30 + k * 6, 4.2, 8 + floorIdx * 2, '#7ad07a');
      }
      AUDIO.sfx('spark');
    } },
    metronome: { name: '节 拍', tele: 0.55, dur: 2.6, cd: 4.6, payload: function (b) {
      bossBeam(b, -0.5, { osc: 1.6, amp: 1.15, baseAng: -0.5, len: 320, w: 5, life: 2.6 });
      AUDIO.sfx('clock');
    } },
    notes: { name: '音 符 雨', tele: 0.55, dur: 1.9, cd: 4.8, payload: function () {}, sustain: function (b, dt) {
      b.noteT -= dt;
      if (b.noteT <= 0) {
        b.noteT = 0.42;
        bossWarn(room.x + 34 + Math.random() * (room.w - 68), room.y + 52 + Math.random() * (room.h - 104), 24, 0.75, { note: true });
      }
    } },
    chord: { name: '和 弦', tele: 0.6, dur: 2.1, cd: 5.2, payload: function (b) {
      const a0 = angleTo(b.x, b.y, P.x, P.y);
      for (let k = 0; k < 3; k++) bossBeam(b, a0 + (k - 1) * 0.22, { rot: 0.16 * (k - 1), len: 320, w: 4.5, life: 2.1 });
      AUDIO.sfx('boss');
    } },
    laser: { name: '激 光', tele: 0.7, dur: 2.0, cd: 5.0, payload: function (b) {
      bossBeam(b, angleTo(b.x, b.y, P.x, P.y), { rot: 0.55 * (b.phase === 2 ? 1.3 : 1), len: 340, w: 12, life: 2.0 });
      AUDIO.sfx('boss');
    } },
    wave: { name: '长夜波', tele: 0.65, dur: 0.6, cd: 4.6, payload: function (b) {
      bossWave(b);
      shake = Math.max(shake, 6);
      addEffect({ kind: 'ring', x: b.x, y: b.y, r0: 10, r1: 200, max: 0.75, life: 0.75, color: 'rgba(255,90,110,0.55)' });
      AUDIO.sfx('explode');
    } },
    mirror: { name: '镜 像', tele: 0.6, dur: 0.5, cd: 4.8, payload: function (b) {
      bossWarn(b.x, b.y, 26, 0.6, { burst: true, col: b.col });
      bossWarn(P.x, P.y, 26, 0.9, { burst: true, damage: b.dmg * 0.8, col: b.col });
      AUDIO.sfx('spark');
    } },
  };

  function startBossAct(b) {
    const list = b.def.acts;
    let id = list[(Math.random() * list.length) | 0];
    if (list.length > 1 && id === b.lastAct) id = list[(list.indexOf(id) + 1) % list.length];
    const A = ATTACKS[id];
    b.act = A;
    b.actId = id;
    b.actT = 0;
    b.fired = false;
    b.spiralT = 0; b.beatT = 0; b.noteT = 0; b.drainT = 0;
    addText(b.x, b.y - b.r - 22, A.name, b.col, 1, 1.0);
    AUDIO.sfx('clock');
  }

  function updateBoss(dt) {
    if (!boss || boss.dead) return;
    if (boss.intro > 0) { boss.intro -= dt; return; }
    const b = boss;
    b.phase2T += dt;
    b.hitT = Math.max(0, b.hitT - dt);
    b.orbitCd = Math.max(0, b.orbitCd - dt);
    b.ang += dt * (b.type === 'b3' ? 1.8 : 1.3);
    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > 10) b.trail.shift();

    if (b.phase === 1 && b.hp <= b.maxHp * 0.62) {
      b.phase = 2;
      b.act = null;
      b.fired = false;
      b.nextT = 0.35;
      whiteFlash = Math.max(whiteFlash, 0.5);
      shake = 10;
      AUDIO.sfx('boss');
      storyQuote = { name: b.def.name, lines: ['「……还没完。」'], t: 2.6, life: 2.6 };
      addEffect({ kind: 'ring', x: b.x, y: b.y, r0: 8, r1: 120, life: 0.5, max: 0.5, color: 'rgba(255,140,170,0.7)' });
    }

    if (b.charge > 0) {
      b.charge -= dt;
      b.x += b.chargeDx * dt;
      b.y += b.chargeDy * dt;
      if (level) D.resolve(b, b.r, activeWalls);
      if (Math.random() < 0.8) spawnParticle(b.x + rand(-14, 14), b.y + rand(-14, 14), rand(-50, 50), rand(-50, 50), 0.4, b.col, 2, 1, true);
    } else {
      const a = angleTo(b.x, b.y, P.x, P.y);
      let mv = b.spd;
      if (b.act) mv *= (b.actId === 'drain' ? 0.9 : 0.35);
      const orbit = Math.sin(T * 0.8) * 0.6;
      b.x += Math.cos(a + orbit) * mv * dt;
      b.y += Math.sin(a + orbit) * mv * dt;
      if (level) D.resolve(b, b.r, activeWalls);
      const dd = dist(b.x, b.y, P.x, P.y);
      if (dd < 70 && b.actId !== 'drain') {
        b.x -= Math.cos(a) * mv * 0.8 * dt;
        b.y -= Math.sin(a) * mv * 0.8 * dt;
      }
    }

    if (!b.act) {
      b.nextT -= dt;
      if (b.nextT <= 0) startBossAct(b);
    } else {
      const A = b.act;
      b.actT += dt;
      if (!b.fired && b.actT >= A.tele) {
        b.fired = true;
        A.payload(b);
      }
      if (b.fired && A.sustain) A.sustain(b, dt);
      if (b.actT >= A.tele + A.dur) {
        b.lastAct = b.actId;
        b.act = null;
        b.fired = false;
        const cdMul = (b.phase === 2 ? 0.66 : 1) * (b.idx >= 9 ? 0.88 : 1);
        b.nextT = A.cd * cdMul * 0.58;
      }
    }
  }

  /* =========================================================
     生成器
     ========================================================= */
  function updateSpawner(dt) {
    if (endless) {
      if (!boss && runTime >= nextEndlessBoss) {
        endlessTier++;
        nextEndlessBoss = runTime + ENDLESS_STEP;
        spawnBoss(endlessTier % 2 === 0 ? 1 : 2);
        biteBanner('长夜更深 · 第 ' + endlessTier + ' 夜');
      }
    } else {
      if (!level && runTime >= BOSS1_AT && !boss1Done && !boss) spawnBoss(0);
      if (!level && runTime >= BOSS2_AT && !boss2Spawned) { boss2Spawned = true; spawnBoss(3); }
    }

    if (runTime > nextSwarm && runTime < DURATION - 12) {
      nextSwarm += 44;
      spawnWave(4 + Math.floor(runTime / 60) * 2);
      biteBanner('虫 潮 涌 动');
    }

    // 宝箱
    if (chest && !chest.open) {
      if (dist2(chest.x, chest.y, P.x, P.y) < 13 * 13) {
        chest.open = true;
        chestCards = rollRelics(3);
        cards = chestCards;
        chestSel = 0;
        state = 'CHEST';
        cardAnim = 0;
        AUDIO.sfx('levelup');
        whiteFlash = Math.max(whiteFlash, 0.4);
      }
    } else if (!chest) {
      chestT -= dt;
      if (chestT <= 0 && runTime > 20) {
        chestT = 74;
        const a = rand(0, TAU);
        const r = rand(90, 150);
        chest = { x: P.x + Math.cos(a) * r, y: P.y + Math.sin(a) * r, t: 0, open: false };
        biteBanner('远 处 有 光');
        AUDIO.sfx('levelup');
      }
    }

    if (boss && !boss.dead) return;

    spawnT -= dt;
    if (spawnT <= 0) {
      const prog = Math.min(1, runTime / DURATION);
      spawnT = lerp(1.9, 0.95, prog) * (boss ? 1.6 : 1);
      const count = 1 + Math.floor(prog * 2.4 + rand(0, 1));
      spawnWave(count);
    }
  }

  /* =========================================================
     升级卡
     ========================================================= */
  function weightedPick(pool) {
    const tot = pool.reduce((s, p) => s + p.w, 0);
    let r = Math.random() * tot;
    for (const p of pool) { r -= p.w; if (r <= 0) return p; }
    return pool[0];
  }

  function rollRelics(n) {
    const pool = [];
    for (const id in RELICS) {
      if (P.relics.indexOf(id) < 0) pool.push({ kind: 'relic', id, lvl: 1, w: 1 });
    }
    if (P.relics[0] && (P.relicLvl || 1) < 3) {
      pool.push({ kind: 'relic', id: P.relics[0], lvl: (P.relicLvl || 1) + 1, w: 0.7 });
    }
    const picked = [];
    let guard = 0;
    while (picked.length < n && pool.length && guard++ < 40) {
      const c = weightedPick(pool);
      picked.push(c);
      const idx = pool.indexOf(c);
      if (idx >= 0) pool.splice(idx, 1);
    }
    while (picked.length < n) picked.push({ kind: 'heal', id: 'heal', lvl: 1 });
    return picked.map((c, i) => ({ ...c, x: 13 + i * 122, y: 62, w: 114, h: 106 }));
  }

  function buildCards() {
    let pool = [];
    const owned = new Set(P.weapons.map((w) => w.id));
    for (const w of P.weapons) {
      if (w.lvl < defOf(w.id).max) pool.push({ kind: 'weapon', id: w.id, lvl: w.lvl + 1, w: 3.2 });
    }
    if (P.weapons.length < 4) {
      for (const id in WEAPONS) if (!owned.has(id)) pool.push({ kind: 'weapon', id, lvl: 1, w: 2.4 });
    }
    for (const id in PASSIVES) {
      const lv = P.passives[id] || 0;
      if (lv < PASSIVES[id].max) pool.push({ kind: 'passive', id, lvl: lv + 1, w: 1.7 });
    }
    // 进化：满级武器 + 指定被动
    for (const evoId in EVOLUTIONS) {
      const evo = EVOLUTIONS[evoId];
      if (P.evolved[evoId]) continue;
      const base = P.weapons.find((x) => x.id === evo.base);
      if (!base || base.lvl < WEAPONS[evo.base].max) continue;
      if ((P.passives[evo.req.passive] || 0) < evo.req.lvl) continue;
      pool.push({ kind: 'evo', id: evoId, lvl: 1, w: 5 });
    }
    // 神器：单槽换装 / 已装配的可升级
    for (const id in RELICS) {
      if (P.relics[0] === id) {
        if ((P.relicLvl || 1) < 3) pool.push({ kind: 'relic', id, lvl: (P.relicLvl || 1) + 1, w: 1.1 });
      } else {
        pool.push({ kind: 'relic', id, lvl: 1, w: 0.85 });
      }
    }

    const picked = [];
    let guard = 0;
    while (picked.length < 3 && pool.length && guard++ < 60) {
      const c = weightedPick(pool);
      picked.push(c);
      pool = pool.filter((p) => !(p.kind === c.kind && p.id === c.id));
    }
    while (picked.length < 3) picked.push({ kind: 'heal', id: 'heal', lvl: 1 });
    cards = picked.map((c, i) => ({
      ...c,
      x: 13 + i * 122, y: 62, w: 114, h: 106,
    }));
    cardAnim = 0;
  }

  function cardTitle(c) {
    if (c.kind === 'boon') return boonInfo(c.id).name;
    if (c.kind === 'weapon') return WEAPONS[c.id].name;
    if (c.kind === 'passive') return PASSIVES[c.id].name;
    if (c.kind === 'evo') return EVOLUTIONS[c.id].name;
    if (c.kind === 'relic') return RELICS[c.id].name;
    return '暖火';
  }
  function cardInfo(c) {
    if (c.kind === 'boon') return boonInfo(c.id).desc;
    if (c.kind === 'weapon') {
      const w = WEAPONS[c.id];
      return c.lvl === 1 ? w.info[0] : w.info[c.lvl - 1];
    }
    if (c.kind === 'passive') return PASSIVES[c.id].info[0];
    if (c.kind === 'evo') return EVOLUTIONS[c.id].info[1];
    if (c.kind === 'relic') return RELICS[c.id].desc;
    return '回复 30 点生命';
  }
  function cardIcon(c) {
    if (c.kind === 'boon') {
      return SPR.icons[c.id === 'heal' ? 'hp' : c.id === 'relic' ? 'relic' : c.id === 'dmg' ? 'damage'
        : c.id === 'light' ? 'light' : c.id === 'speed' ? 'speed' : c.id === 'armor' ? 'armor' : 'rate'];
    }
    if (c.kind === 'weapon') return SPR.icons[WEAPONS[c.id].icon];
    if (c.kind === 'passive') return SPR.icons[PASSIVES[c.id].icon];
    if (c.kind === 'evo') return SPR.icons[EVOLUTIONS[c.id].icon];
    if (c.kind === 'relic') return SPR.icons[RELICS[c.id].icon];
    return SPR.icons.hp;
  }
  function cardLevel(c) {
    if (c.kind === 'weapon') return c.lvl;
    if (c.kind === 'passive') return c.lvl;
    return 0;
  }

  function cardMax(c) {
    if (c.kind === 'weapon') return WEAPONS[c.id].max;
    if (c.kind === 'passive') return PASSIVES[c.id].max;
    return 0;
  }

  // 神器单槽：换装时旧神器进收藏，不再提供任何加成
  function equipRelic(id, lvl) {
    const lv = clamp(lvl || 1, 1, 3);
    if (P.relics[0] === id) {
      P.relicLvl = Math.max(P.relicLvl || 1, lv);
    } else {
      if (P.relics[0] && P.relicStore.indexOf(P.relics[0]) < 0) P.relicStore.push(P.relics[0]);
      P.relics = [id];
      P.relicLvl = lv;
    }
    recalc();
  }

  function applyCard(c) {
    if (c.kind === 'boon') {
      applyBoon(c.id);
      addText(P.x, P.y - 22, boonInfo(c.id).name, '#ffd166', 1.2, 1.2);
    } else if (c.kind === 'relic') {
      equipRelic(c.id, c.lvl);
      addText(P.x, P.y - 22, RELICS[c.id].name + (c.lvl > 1 ? ' Lv.' + c.lvl : ''), '#ffd166', 1.2, 1.2);
    } else if (c.kind === 'evo') {
      const base = EVOLUTIONS[c.id].base;
      const w = P.weapons.find((x) => x.id === base);
      if (w) { w.id = c.id; w.lvl = 1; w.t = 0; w.ang = 0; }
      P.evolved[c.id] = 1;
      META.unlock(save, 'weapons', base);
      whiteFlash = Math.max(whiteFlash, 0.6);
      shake = Math.max(shake, 5);
      AUDIO.sfx('boss');
      addText(P.x, P.y - 24, '进 化', '#ffe9a8', 1.6, 1.4);
    } else if (c.kind === 'weapon') {
      const w = P.weapons.find((x) => x.id === c.id);
      if (w) w.lvl++;
      else P.weapons.push({ id: c.id, lvl: 1, t: 0, ang: 0 });
      META.unlock(save, 'weapons', c.id);
    } else if (c.kind === 'passive') {
      P.passives[c.id] = (P.passives[c.id] || 0) + 1;
      recalc();
      META.unlock(save, 'passives', c.id);
    } else {
      P.hp = Math.min(P.maxHp, P.hp + 30);
    }
    state = 'PLAY';
    cards = [];
    AUDIO.sfx('click');
    checkAchievements();
  }

  /* ---------------- 成就提示 ---------------- */
  function openStory(pages, onDone) {
    storyView = { pages: pages, idx: 0, t: 0, onDone: onDone || null };
    state = 'STORY';
    AUDIO.sfx('click');
  }

  function finishStory() {
    const cb = storyView && storyView.onDone;
    storyView = null;
    if (cb) cb();
    else state = 'TITLE';
  }

  function pageChars(page) {
    return page.lines.join('').length;
  }

  function drawStory() {
    const v = storyView;
    if (!v) return;
    px(0, 0, W, H, 'rgba(3,4,9,0.95)');
    glowAt(W / 2, 34, 130, 'rgba(255,170,70,0.09)', 1);
    const page = v.pages[v.idx];
    ART.text(ctx, page.title, W / 2, 24, { color: '#ffdca0', scale: 2, align: 'center', shadow: true, shadowColor: '#000' });
    px(64, 64, W - 128, 1, 'rgba(255,200,120,0.22)');

    let budget = Math.floor(v.t * 26);
    let y = 82;
    for (let i = 0; i < page.lines.length; i++) {
      const line = page.lines[i];
      const take = Math.max(0, Math.min(line.length, budget));
      budget -= line.length;
      if (take > 0) {
        ART.text(ctx, line.slice(0, take), W / 2, y, {
          color: '#cfd8ea', align: 'center', shadow: true, shadowColor: '#000',
        });
      }
      y += 20;
    }

    // 页码点
    for (let i = 0; i < v.pages.length; i++) {
      px(W / 2 - v.pages.length * 4 + i * 8, H - 30, 4, 2, i === v.idx ? '#ffd166' : '#3a4258');
    }
    const done = v.t * 26 >= pageChars(page);
    if (done && Math.sin(T * 4) > -0.2) {
      ART.text(ctx, '空格 / 点击 继续', W / 2, H - 20, { color: '#8b93ad', align: 'center' });
    }
    ART.text(ctx, 'ESC 跳过', W - 10, 8, { color: '#4f5a75', align: 'right' });
  }

  function pushToast(kind, id) {
    toasts.push({ kind, id, t: 3.4, life: 3.4 });
    if (toasts.length > 4) toasts.shift();
  }

  function achById(id) {
    for (let i = 0; i < META.ACHIEVEMENTS.length; i++) {
      if (META.ACHIEVEMENTS[i].id === id) return META.ACHIEVEMENTS[i];
    }
    return null;
  }

  function checkAchievements() {
    if (state !== 'PLAY' && state !== 'LEVELUP') return;
    if (STORY) {
      const lore = STORY.checkRun(save, {
        runTime, kills, boss1Dead: boss1Done, boss2Seen: boss2Spawned,
        weapons: P.weapons.length, totalKills: (save.totals.kills || 0) + kills, won: false,
      });
      for (const id of lore) pushToast('lore', id);
    }
    const got = META.evaluate(save, {
      kills,
      runTime,
      level: P.level,
      weapons: P.weapons,
      passives: P.passives,
      unhurt: unhurtT,
      xpCollected,
      boss1KillTime,
      dailyFinished: false,
    });
    for (const id of got) pushToast('achievement', id);
  }

  function openLevelUp() {
    if (state !== 'PLAY' && state !== 'LEVELUP') return;
    state = 'LEVELUP';
    whiteFlash = Math.max(whiteFlash, 0.35);
    AUDIO.sfx('levelup');
    buildCards();
  }

  /* =========================================================
     横幅
     ========================================================= */
  function biteBanner(txt) {
    bannerText = txt;
    bannerT = 2.2;
  }

  /* =========================================================
     主更新
     ========================================================= */
  function update(dt) {
    T += dt;
    if (state === 'LOADING') {
      loadT += dt;
      if (loadStep < 3) {
        if (loadT >= 0.16) { loadT = 0; loadStep++; runLoadStep(loadStep); }
      } else if (loadStep === 3 && (ART.fontReady || loadT > 2.6)) {
        loadStep = 4;
        runLoadStep(4);
      }
      return;
    }
    if (state === 'RHYTHM') {
      RHYTHM.update(dt);
      if (RHYTHM.finished) finishRhythm();
      return;
    }
    if (bannerT > 0) bannerT -= dt;
    shake = Math.max(0, shake - dt * 18);
    redFlash = Math.max(0, redFlash - dt * 2.2);
    whiteFlash = Math.max(0, whiteFlash - dt * 3.2);
    for (let i = toasts.length - 1; i >= 0; i--) {
      toasts[i].t -= dt;
      if (toasts[i].t <= 0) toasts.splice(i, 1);
    }

    if (state === 'STORY') {
      if (storyView) storyView.t += dt;
      return;
    }

    if (state === 'PLAY') {
      if (cine) {
        cine.t += dt;
        P.spawnT = Math.max(0, P.spawnT - dt);
        if (cine.t >= cine.dur) cine = null;
        camX = P.x - W / 2;
        camY = P.y - H / 2;
        clampWorldCam();
      } else {
      runTime += dt;
      unhurtT += dt;
      evalT -= dt;
      if (evalT <= 0) {
        evalT = 0.5;
        checkAchievements();
      }
      updatePlayer(dt);
      updateWeapons(dt);
      updateEnemies(dt);
      updateBoss(dt);
      updateBullets(dt);
      updateHazards(dt);
      updatePickups(dt);
      updateLevel(dt);
      playerCollisions();
      checkLevel();

      if (storyQuote) {
        storyQuote.t -= dt;
        if (storyQuote.t <= 0) storyQuote = null;
      }

      // 漂浮的萤火与环境微尘
      if (Math.random() < dt * 3) {
        const a = rand(0, TAU), r = rand(46, 210);
        spawnParticle(P.x + Math.cos(a) * r, P.y + Math.sin(a) * r,
          rand(-7, 7), rand(-11, -1), rand(1.8, 3.6), Math.random() < 0.3 ? '#9fe8ff' : '#ffcf6e', 1, 0.15, true);
      }

      // 摄像机：直接吸附（渲染时取整），不做拖尾
      camX = P.x - W / 2;
      camY = P.y - H / 2;
      clampWorldCam();
      }
      if (boss && boss.idx === 6 && boss.intro <= 0 && !rhythmPlayed && !cine) {
        rhythmPlayed = true;
        state = 'RHYTHM';
        RHYTHM.start(runSeed + floorIdx * 31);
        AUDIO.startMusic('boss');
        AUDIO.setMood('boss');
      }
    } else if (state === 'TITLE') {
      // 菜单演示（加载未完成时 P 可能还未创建）
      if (!P) return;
      P.animT += dt;
      P.frame = 0;
      if (titleHintT > 0) titleHintT -= dt;
      camX = lerp(camX, P.x - W / 2, 1 - Math.pow(0.00001, dt));
      camY = lerp(camY, P.y - H / 2, 1 - Math.pow(0.00001, dt));
      if (Math.random() < dt * 8) {
        spawnParticle(P.x + rand(-90, 90), P.y + rand(-60, 60), rand(-8, 8), rand(-18, -4), rand(1.2, 2.6), '#ffc75e', 1.2, 0, true);
      }
      if (Math.random() < dt * 1.5) {
        spawnParticle(P.x + rand(-140, 140), P.y + rand(-70, 40), rand(-12, 12), rand(-6, 6), rand(1.4, 2.8), '#3a4a5f', 1.4, 0, false);
      }
    } else if (state === 'DEAD' || state === 'WIN') {
      camX = lerp(camX, P.x - W / 2, 1 - Math.pow(0.02, dt));
      camY = lerp(camY, P.y - H / 2, 1 - Math.pow(0.02, dt));
    }

    // 房间淡入（演出/暂停时也要走，否则画面一直黑）
    if (roomFade > 0) roomFade = Math.max(0, roomFade - dt * 1.9);

    // 粒子
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.life <= 0) { p.dead = true; continue; }
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const dr = Math.pow(0.5, dt * p.drag * 2);
      p.vx *= dr; p.vy *= dr;
      if (p.add) p.vy -= dt * 8;
    }
    for (let i = 0; i < texts.length; i++) {
      const t = texts[i];
      t.life -= dt;
      t.y += t.vy * dt;
      t.vy *= Math.pow(0.2, dt);
    }
    for (let i = 0; i < effects.length; i++) {
      const e = effects[i];
      e.t += dt;
      if (e.kind === 'nova') {
        const p = clamp((e.t - (e.delay || 0)) / e.max, 0, 1);
        if (p > 0 && p < 1) {
          const r = lerp(e.r0, e.r1, G.easeOutCubic(p));
          for (let k = 0; k < enemies.length; k++) {
            const en = enemies[k];
            if (en.dead || e.hit.indexOf(en) >= 0) continue;
            const rr = r + en.r;
            if (dist2(e.x, e.y, en.x, en.y) < rr * rr && dist2(e.x, e.y, en.x, en.y) > (r - 12) * (r - 12) * 0.4) {
              e.hit.push(en);
              const a = angleTo(e.x, e.y, en.x, en.y);
              hitEnemy(en, e.dmg, Math.cos(a) * 130, Math.sin(a) * 130);
            }
          }
          if (boss && !boss.dead && e.hit.indexOf(boss) < 0 && dist(e.x, e.y, boss.x, boss.y) < r + boss.r) {
            e.hit.push(boss); hitBoss(e.dmg);
          }
        }
      }
      if (e.t > (e.delay || 0) + e.max) e.dead = true;
    }

    // 压缩数组
    compact(enemies);
    compact(bullets);
    compact(hazards);
    compact(pickups);
    compact(particles);
    compact(texts);
    compact(effects);
    for (let i = 0; i < enemies.length; i++) {
      if (enemies[i].hitT < 0) enemies[i].hitT = 0;
    }
  }

  function compact(arr) {
    let j = 0;
    for (let i = 0; i < arr.length; i++) {
      if (!arr[i].dead) arr[j++] = arr[i];
    }
    arr.length = j;
  }

  /* =========================================================
     渲染
     ========================================================= */
  function render() {
    const sh = shake > 0.2 ? shake : 0;
    const sx = sh ? Math.round(rand(-sh, sh)) : 0;
    const sy = sh ? Math.round(rand(-sh, sh)) : 0;
    const rx = Math.round(camX) + sx;
    const ry = Math.round(camY) + sy;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#080a12';
    ctx.fillRect(0, 0, W, H);
    if (state === 'LOADING') { drawLoading(); return; }

    const outdoors = state === 'TITLE' || !level;
    if (outdoors) {
      WORLD.drawGround(ctx, rx, ry, W, H);
      WORLD.drawProps(ctx, rx, ry, W, H);
      WORLD.drawFog(ctx, rx, ry, W, H, T);
    }
    drawLevelFrame(rx, ry);

    ctx.save();
    ctx.translate(-rx, -ry);

    drawRoomWorld();
    drawShadows();
    drawPickups();
    drawEnemiesSorted();
    drawEffectsWorld();
    ctx.restore();

    // 光照遮罩
    WORLD.beginDark();

    if (state === 'TITLE') {
      WORLD.addLight(W / 2, 58, 190, 1);
      WORLD.addLight(W / 2, 58, 330, 0.22);
    } else {
      const flick = 0.94 + Math.sin(T * 9) * 0.03 + Math.sin(T * 23) * 0.02;
      const lightR = 92 * P.st.light * flick * (P.drainT > 0 ? 0.72 : 1);
      const lp = lanternPos();
      WORLD.addLight(lp.x - rx, lp.y - ry, lightR, 1);
      WORLD.addLight(lp.x - rx, lp.y - ry, lightR * 1.9, 0.26);
      WORLD.addLight(P.x - rx, P.y - ry, 44, 0.18);
    }
    const lx0 = rx - 40, ly0 = ry - 40, lx1 = rx + W + 40, ly1 = ry + H + 40;
    const lit = (x, y) => x > lx0 && x < lx1 && y > ly0 && y < ly1;
    for (let i = 0; i < pickups.length; i++) {
      const p = pickups[i];
      if (!lit(p.x, p.y)) continue;
      WORLD.addLight(p.x - rx, p.y - ry, p.kind === 'heart' ? 22 : 13, 0.5);
    }
    if (boss && !boss.dead) WORLD.addLight(boss.x - rx, boss.y - ry, 70, 0.55);
    if (chest && !chest.open) WORLD.addLight(chest.x - rx, chest.y - ry, 34, 0.62);
    if (room) {
      // 房间环境光：让整间房可读，同时保留灯火为核心
      WORLD.addLight(room.x + room.w / 2 - rx, room.y + room.h / 2 - ry, room.w * 0.58, 0.26);
      if (room.type === 'portal' || room.type === 'boss') {
        const px2 = room.x + room.w / 2, py2 = room.y + room.h / 2;
        WORLD.addLight(px2 - rx, py2 - ry, room.cleared ? 46 : 18, room.cleared ? 0.75 : 0.3);
      }
      if (shrineObj && !shrineObj.used) WORLD.addLight(shrineObj.x - rx, shrineObj.y - ry, 40, 0.5);
      for (let i = 0; i < chestObjs.length; i++) {
        const c = chestObjs[i];
        if (!c.open) WORLD.addLight(c.x - rx, c.y - ry, 30, 0.55);
      }
    }
    for (let i = 0; i < hazards.length; i += 3) {
      if (!lit(hazards[i].x, hazards[i].y)) continue;
      WORLD.addLight(hazards[i].x - rx, hazards[i].y - ry, 16, 0.34);
    }
    for (let i = 0; i < effects.length; i++) {
      const e = effects[i];
      if (e.kind === 'nova' || e.kind === 'ring') {
        if (!lit(e.x, e.y)) continue;
        WORLD.addLight(e.x - rx, e.y - ry, (e.r1 || e.reach || 40) * 1.4, 0.5);
      }
    }
    const dstyle = themeInfo && D.STYLE ? D.STYLE[themeInfo.id] : null;
    WORLD.endDark(ctx, (dstyle && dstyle.dark) || 'rgba(4,6,14,0.84)');

    // 发光层
    ctx.save();
    ctx.translate(-rx, -ry);
    ctx.globalCompositeOperation = 'lighter';
    drawGlow();
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';

    // 世界中的文字
    ctx.save();
    ctx.translate(-rx, -ry);
    drawTextsWorld();
    ctx.restore();

    // 受伤红光 / 白闪
    if (redFlash > 0.01) {
      ctx.fillStyle = 'rgba(255,40,60,' + (redFlash * 0.2) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (whiteFlash > 0.01) {
      ctx.fillStyle = 'rgba(255,240,210,' + (whiteFlash * 0.55) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (roomFade > 0.01) {
      ctx.fillStyle = 'rgba(3,4,8,' + Math.min(1, roomFade) + ')';
      ctx.fillRect(0, 0, W, H);
    }

    if (state === 'PLAY' || state === 'LEVELUP' || state === 'PAUSE' || state === 'CHEST' || state === 'BOON' || state === 'SHRINE') drawHUD();
    if (state === 'PLAY') drawTouchControls();
    if ((state === 'PLAY' || state === 'PAUSE') && !cine) drawStoryQuote();
    if (!cine && (state === 'PLAY' || state === 'LEVELUP' || state === 'PAUSE' || state === 'CHEST')) drawBanner();

    drawCine();
    if (state === 'TITLE') drawTitle();
    else if (state === 'LEVELUP' || state === 'CHEST' || state === 'BOON' || state === 'SHRINE') drawLevelUp();
    else if (state === 'RHYTHM') RHYTHM.draw(ctx, W, H);
    else if (state === 'PAUSE') drawPause();
    else if (state === 'DEAD') drawEnd(false);
    else if (state === 'WIN') drawEnd(true);
    else if (state === 'CODEX') drawCodex();
    else if (state === 'DAILY') drawDaily();
    else if (state === 'STORY') drawStory();
    if (state === 'PLAY') drawToasts();
  }

  const patternCache = new Map();
  function patternOf(cv) {
    let p = patternCache.get(cv);
    if (!p) { p = ctx.createPattern(cv, 'repeat'); patternCache.set(cv, p); }
    return p;
  }

  function drawLevelFrame(rx, ry) {
    if (!level) return;
    const theme = themeInfo || { id: 'forest' };
    const ft = D.buildFloorTile(theme.id);
    const pat = patternOf(ft);
    ctx.save();
    ctx.translate(-rx, -ry);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = pat;
    for (let i = 0; i < level.rooms.length; i++) {
      const r = level.rooms[i];
      if (r.x - rx > W || r.x + r.w - rx < 0 || r.y - ry > H || r.y + r.h - ry < 0) continue;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    for (let i = 0; i < level.corridors.length; i++) {
      const c = level.corridors[i];
      ctx.fillRect(c.x, c.y, c.w, c.h);
    }
    ctx.globalAlpha = 1;
    // 主题装饰物
    for (let i = 0; i < level.rooms.length; i++) {
      const r = level.rooms[i];
      if (r.x - rx > W || r.x + r.w - rx < 0 || r.y - ry > H || r.y + r.h - ry < 0) continue;
      if (!r.props) continue;
      for (let k = 0; k < r.props.length; k++) {
        const pr = r.props[k];
        D.drawProp(ctx, pr.kind, pr.x, pr.y, T);
      }
    }
    ctx.restore();

    const wt = D.buildWallTile(theme.id);
    const wpat = patternOf(wt);
    ctx.save();
    ctx.translate(-rx, -ry);
    ctx.fillStyle = wpat;
    for (let i = 0; i < level.walls.length; i++) {
      const w = level.walls[i];
      if (w.x - rx > W || w.x + w.w - rx < 0 || w.y - ry > H || w.y + w.h - ry < 0) continue;
      ctx.fillRect(w.x, w.y, w.w, w.h);
    }
    for (let i = 0; i < level.rooms.length; i++) {
      const r = level.rooms[i];
      if (!r.blocks || !r.blocks.length) continue;
      if (r.x - rx > W || r.x + r.w - rx < 0 || r.y - ry > H || r.y + r.h - ry < 0) continue;
      for (let k = 0; k < r.blocks.length; k++) {
        const b = r.blocks[k];
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = 'rgba(180,200,230,0.12)';
        ctx.fillRect(b.x, b.y, b.w, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(b.x, b.y + b.h - 3, b.w, 3);
        ctx.fillRect(b.x + b.w - 2, b.y, 2, b.h);
        ctx.fillStyle = wpat;
      }
    }
    ctx.restore();
    // 墙的受光边
    for (let i = 0; i < level.walls.length; i++) {
      const w = level.walls[i];
      const wx = w.x - rx, wy = w.y - ry;
      if (wx + w.w < 0 || wx > W || wy + w.h < 0 || wy > H) continue;
      px(wx, wy, w.w, 1, 'rgba(170,195,230,0.10)');
      px(wx, wy + w.h - 2, w.w, 2, 'rgba(0,0,0,0.5)');
    }
    // 锁上的门
    if (doorLocked && room) {
      for (let i = 0; i < room.doorWalls.length; i++) {
        const d = room.doorWalls[i];
        const dx = d.x - rx, dy = d.y - ry;
        px(dx, dy, d.w, d.h, '#3a2a20');
        px(dx, dy, d.w, 2, '#6a4a32');
        if (d.w > d.h) {
          for (let k = 4; k < d.w; k += 6) px(dx + k, dy + 2, 1, d.h - 4, '#241a14');
        } else {
          for (let k = 4; k < d.h; k += 6) px(dx + 2, dy + k, d.w - 4, 1, '#241a14');
        }
      }
    }
  }

  function drawRoomWorld() {
    if (!level) return;
    const rm = room;
    if (!rm) return;
    // 玩家入场光柱
    if (P.spawnT > 0) {
      const k = clamp(P.spawnT / 0.75, 0, 1);
      ctx.globalAlpha = 0.45 * k;
      px(P.x - 3, P.y - 96 * (1 - k) - 30, 6, 44, '#ffe6b0');
      px(P.x - 1, P.y - 96 * (1 - k) - 30, 2, 44, '#fff8e6');
      ctx.globalAlpha = 1;
      glowAt(P.x, P.y - 2, 20 + 12 * (1 - k), 'rgba(255,214,130,0.45)', 1);
    }

    // 地刺
    for (let i = 0; i < rm.spikes.length; i++) {
      const sp = rm.spikes[i];
      const bob = Math.sin(T * 3 + sp.x) * 1;
      px(sp.x - 7, sp.y + 2, 14, 3, '#1a1f2b');
      for (let k = 0; k < 3; k++) {
        const x = sp.x - 6 + k * 5;
        px(x, sp.y - bob, 3, 4, '#9aa8c0');
        px(x, sp.y - bob, 3, 1, '#e6eef8');
      }
    }
    // 宝箱
    for (let i = 0; i < chestObjs.length; i++) {
      const c = chestObjs[i];
      if (c.open) continue;
      const bob = Math.round(Math.sin(T * 3 + c.x) * 1.5);
      shadowEllipse(c.x, c.y + 7, 8);
      const img = SPR.chest;
      ctx.drawImage(img, Math.round(c.x - img.width / 2), Math.round(c.y - img.height / 2 + bob));
      glowAt(c.x, c.y + bob, 16, 'rgba(255,210,110,0.3)', 1);
    }
    // 祭坛
    if (shrineObj && !shrineObj.used) {
      const sh = shrineObj;
      shadowEllipse(sh.x, sh.y + 10, 14);
      px(sh.x - 12, sh.y + 2, 24, 8, '#2a2438');
      px(sh.x - 9, sh.y - 4, 18, 7, '#3d3452');
      px(sh.x - 6, sh.y - 10, 12, 6, '#4a4066');
      px(sh.x - 2, sh.y - 13, 4, 4, '#e8deff');
      glowAt(sh.x, sh.y - 8, 16 + Math.sin(T * 2.6) * 3, 'rgba(200,160,255,0.4)', 1);
    }
    // 传送门
    if (rm.type === 'portal' || rm.type === 'boss') {
      const pt = { x: rm.x + rm.w / 2, y: rm.y + rm.h / 2 };
      const open = rm.cleared;
      const col = open ? (rm.type === 'boss' ? 'rgba(200,130,255,' : 'rgba(150,230,255,') : 'rgba(90,100,130,';
      px(pt.x - 19, pt.y - 20, 38, 34, '#0b0e16');
      px(pt.x - 15, pt.y - 16, 30, 26, '#131a28');
      if (open) glowAt(pt.x, pt.y, 32 * (1 + Math.sin(T * 4) * 0.08), 'rgba(150,230,255,0.28)', 1);
      const rr = 12 * (0.85 + Math.sin(T * 3) * 0.06) * (open ? 1 : 0.7);
      ctx.strokeStyle = col + (open ? 0.9 : 0.5) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, rr, rr * 1.25, 0, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = col + (open ? 0.45 : 0.25) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, rr * 0.62, rr * 0.8, 0, 0, TAU);
      ctx.stroke();
      if (open) {
        for (let i = 0; i < 6; i++) {
          const a = T * 1.6 + (i / 6) * TAU;
          px(pt.x + Math.cos(a) * (rr + 5) - 1, pt.y + Math.sin(a) * (rr * 1.25 + 5) - 1, 2, 2, 'rgba(200,240,255,0.9)');
        }
      }
    }
  }

  function drawShadows() {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead) continue;
      if (e.x < camX - 40 || e.x > camX + W + 40 || e.y < camY - 40 || e.y > camY + H + 40) continue;
      shadowEllipse(e.x, e.y + e.r * 0.75, e.r * 0.85);
    }
    if (boss && !boss.dead) shadowEllipse(boss.x, boss.y + boss.r * 0.9, boss.r * 1.05);
    shadowEllipse(P.x, P.y + 8, 6);
  }

  function drawPickups() {
    for (let i = 0; i < pickups.length; i++) {
      const p = pickups[i];
      if (p.x < camX - 24 || p.x > camX + W + 24 || p.y < camY - 24 || p.y > camY + H + 24) continue;
      if (p.kind === 'heart') {
        const bob = Math.round(Math.sin(p.t * 4) * 1.5);
        ctx.drawImage(SPR.heart, Math.round(p.x - 3.5), Math.round(p.y - 3.5 + bob));
      } else {
        const s = p.t < 0.2 ? 1 : 1 + Math.sin(p.t * 8) * 0.12;
        const w = Math.max(1, Math.round(3 * s));
        px(p.x - w / 2, p.y - w / 2, w, w, '#9fe8ff');
        px(p.x - 1, p.y - 1, 2, 2, '#ffffff');
      }
    }
  }

  const drawOrder = [];
  function drawEnemiesSorted() {
    const order = drawOrder;
    order.length = 0;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead) continue;
      order.push(e);
    }
    if (boss && !boss.dead) order.push(boss);
    if (chest && !chest.open) order.push({ isChest: true, y: chest.y });
    if (state !== 'TITLE') order.push({ isPlayer: true, y: P.y });
    order.sort((a, b) => a.y - b.y);

    for (let i = 0; i < order.length; i++) {
      const e = order[i];
      if (e.isPlayer) { drawPlayer(); continue; }
      if (e.isChest) { drawChest(); continue; }
      if (e === boss) { drawBoss(); continue; }
      drawEnemy(e);
    }
  }

  function lanternPos() {
    const s = Math.sin(P.animT * 5) * 1.2;
    if (P.dir === 'left') return { x: P.x - 10 + s * 0.4, y: P.y - 4 };
    if (P.dir === 'right') return { x: P.x + 10 + s * 0.4, y: P.y - 4 };
    if (P.dir === 'up') return { x: P.x + 9, y: P.y - 6 };
    return { x: P.x + 10, y: P.y - 3 };
  }

  function drawPlayer() {
    let img;
    if (P.dir === 'up') img = SPR.pUp[P.moving ? P.frame : 0];
    else if (P.dir === 'down') img = SPR.pDown[P.moving ? P.frame : 0];
    else if (P.dir === 'left') img = SPR.pSideL[P.moving ? P.frame : 0];
    else img = SPR.pSide[P.moving ? P.frame : 0];

    const bob = P.moving ? (P.frame ? 1 : 0) : (Math.sin(P.animT * 2.2) > 0 ? 0 : 1);
    const dx = Math.round(P.x - 8);
    const dy = Math.round(P.y - 14 + bob);

    // 提灯（在手中，随步伐摆动）
    const lp = lanternPos();
    const lx = lp.x - 3, ly = lp.y - 4;

    if (P.iframe > 0 && Math.floor(P.iframe * 20) % 2 === 0) {
      ctx.globalAlpha = 0.55;
    }
    ctx.drawImage(img, dx, dy);
    ctx.globalAlpha = 1;

    ctx.drawImage(SPR.lantern, Math.round(lx), Math.round(ly));

    if (P.hurtT > 0) {
      const tinted = ART.tint(img, '#ff5060', 0.6);
      ctx.globalAlpha = P.hurtT * 2.2;
      ctx.drawImage(tinted, dx, dy);
      ctx.globalAlpha = 1;
    }
  }

  function drawEnemy(e) {
    if (e.x < camX - 56 || e.x > camX + W + 56 || e.y < camY - 56 || e.y > camY + H + 56) return;
    const d = ENEMIES[e.type];
    let frames = SPR[d.spr];
    let img;
    if (Array.isArray(frames)) {
      const fi = Math.floor(e.animT / d.anim) % frames.length;
      img = frames[fi];
    } else {
      img = frames[Math.floor(e.animT / d.anim) % frames.length];
    }
    const bob = e.type === 'ghost' || e.type === 'wisp' ? Math.round(Math.sin(e.animT * 3) * 2) : 0;
    const sc = e.scale || 1;
    const iw = Math.max(1, Math.round(img.width * sc));
    const ih = Math.max(1, Math.round(img.height * sc));
    const dx = Math.round(e.x - iw / 2);
    const dy = Math.round(e.y - ih / 2 + bob);

    ctx.globalAlpha = e.spawnT > 0 ? 1 - e.spawnT / 0.28 : 1;
    if (e.type === 'ghost') ctx.globalAlpha *= (e.phaseA || 0.8);
    ctx.drawImage(img, dx, dy, iw, ih);

    if (e.elite) {
      ctx.globalAlpha = 0.4;
      ctx.drawImage(ART.tint(img, '#ff4d63', 0.75), dx, dy, iw, ih);
      ctx.globalAlpha = 1;
      // 精英王冠
      const crownY = dy - 5 + Math.round(Math.sin(e.animT * 2) * 0.6);
      ctx.drawImage(SPR.crown, dx + Math.round((iw - 9) / 2), crownY);
    }
    if (e.hitT > 0) {
      ctx.globalAlpha = Math.min(1, e.hitT * 9);
      ctx.drawImage(ART.tint(img, '#ffffff', 0.9), dx, dy, iw, ih);
    }
    ctx.globalAlpha = 1;
  }

  function drawChest() {
    const bob = Math.round(Math.sin(T * 3) * 1.5);
    const img = SPR.chest;
    shadowEllipse(chest.x, chest.y + 7, 8);
    ctx.drawImage(img, Math.round(chest.x - img.width / 2), Math.round(chest.y - img.height / 2 + bob));
    glowAt(chest.x, chest.y + bob, 18 + Math.sin(T * 4) * 4, 'rgba(255,210,110,0.3)', 1);
  }

  function drawBoss() {
    const b = boss;
    const frames = b.spr;
    const img = Array.isArray(frames)
      ? frames[b.act && !b.fired ? 2 : (Math.floor(T * 2.5 + (b.idx || 0)) % 2)]
      : frames;
    const wind = b.act && !b.fired ? clamp(b.actT / b.act.tele, 0, 1) : 0;
    const drop = b.intro > 0 ? Math.round(Math.pow(clamp(b.intro / 2.3, 0, 1), 2) * 96) : 0;
    const bob = Math.round(Math.sin(T * 2.2) * 2);
    const cx = Math.round(b.x), cy = Math.round(b.y) + bob - drop;

    if (b.charge > 0 && b.trail) {
      for (let i = 0; i < b.trail.length; i += 2) {
        const tr = b.trail[i];
        ctx.globalAlpha = 0.06 + i * 0.012;
        ctx.drawImage(ART.tint(img, b.col, 0.7), Math.round(tr.x - img.width / 2), Math.round(tr.y - img.height / 2));
        ctx.globalAlpha = 1;
      }
    }
    if (b.phase === 2) {
      const pr = 26 + Math.sin(T * 3) * 3;
      ctx.strokeStyle = 'rgba(255,140,170,' + (0.26 + Math.sin(T * 4) * 0.1) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(cx, cy + 2, pr, pr * 0.7, 0, 0, TAU); ctx.stroke();
      glowAt(cx, cy, 36, 'rgba(255,120,150,0.14)', 1);
    }

    const sx = 1 + wind * 0.14;
    const sy = 1 - wind * 0.1;
    const w2 = Math.round(img.width * sx), h2 = Math.round(img.height * sy);
    if (b.intro > 0) ctx.globalAlpha = 0.6 + Math.sin(T * 20) * 0.2;
    ctx.drawImage(img, Math.round(cx - w2 / 2), Math.round(cy - h2 / 2), w2, h2);
    ctx.globalAlpha = 1;

    const st = b.def ? b.def.style : 'ember';
    if (st === 'ember' || st === 'reflection') {
      const m = 0.35 + wind * 0.65;
      glowAt(cx, cy + 8, 12 + m * 12, 'rgba(255,150,60,0.42)', 1);
      for (let i = 0; i < 3; i++) {
        const a = T * 1.5 + i * (TAU / 3);
        px(cx + Math.cos(a) * (b.r + 9) - 1, cy + Math.sin(a) * (b.r + 9) - 1, 2, 2, 'rgba(255,190,90,' + (0.35 + wind * 0.55) + ')');
      }
    } else if (st === 'ash') {
      for (let i = 0; i < 6; i++) {
        const a = T * 0.7 + i * 1.7;
        const rr = b.r + 8 + (i % 3) * 6;
        px(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7 - (T * 6 + i * 9) % 18, 1, 1, 'rgba(230,190,150,0.5)');
      }
    } else if (st === 'bell') {
      const s2 = 8 + Math.sin(T * 2) * 1.5;
      px(cx - s2, cy - b.r - 14, s2 * 2, 3, 'rgba(240,210,130,0.8)');
      px(cx - s2 + 2, cy - b.r - 11, s2 * 2 - 4, 2, 'rgba(240,210,130,0.5)');
      px(cx - 1, cy - b.r - 6, 2, 4, 'rgba(240,210,130,0.55)');
    } else if (st === 'tendril' || st === 'web') {
      for (let i = 0; i < 4; i++) {
        const ph = T * 1.6 + i * 1.3;
        const bx = cx + (i - 1.5) * 9, by = cy + b.r * 0.55;
        ctx.strokeStyle = st === 'web' ? 'rgba(150,200,180,0.5)' : 'rgba(150,90,200,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + Math.sin(ph) * 10, by + 16, bx + Math.sin(ph + 1) * 14, by + 28 + Math.cos(ph) * 4);
        ctx.stroke();
      }
    } else if (st === 'poison') {
      for (let i = 0; i < 4; i++) {
        const ph = T * 1.1 + i * 1.6;
        px(cx + Math.sin(ph) * 14, cy + b.r * 0.5 + ((T * 10 + i * 8) % 16), 2, 3, 'rgba(140,230,140,0.6)');
      }
      glowAt(cx, cy + 6, 22, 'rgba(120,220,120,0.18)', 1);
    } else if (st === 'drowned') {
      ctx.strokeStyle = 'rgba(120,220,220,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx, cy + b.r * 0.7, 20 + Math.sin(T * 2) * 2, 5, 0, 0, TAU); ctx.stroke();
      for (let i = 0; i < 3; i++) px(cx + Math.sin(T + i * 2) * 12, cy - 6 - ((T * 14 + i * 7) % 20), 1, 1, 'rgba(180,240,240,0.5)');
    } else if (st === 'metronome') {
      const sw = Math.sin(T * 2.4) * 0.7 + (b.actId === 'metronome' ? Math.sin(T * 9) * 0.5 : 0);
      const ax = cx + Math.sin(sw) * 22, ay = cy + 26;
      ctx.strokeStyle = 'rgba(160,220,255,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(ax, ay); ctx.stroke();
      px(ax - 2, ay - 2, 5, 5, '#d8f4ff');
      for (let i = 0; i < 3; i++) {
        const a = T * 2 + i * (TAU / 3);
        px(cx + Math.cos(a) * 27 - 1, cy + Math.sin(a) * 20 - 1, 2, 2, 'rgba(140,220,255,0.7)');
      }
    } else if (st === 'wind') {
      ctx.strokeStyle = 'rgba(230,210,150,0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const rr = b.r + 6 + i * 7;
        ctx.beginPath(); ctx.arc(cx, cy, rr, T * 1.6 + i, T * 1.6 + i + 1.4); ctx.stroke();
      }
    } else if (st === 'night') {
      for (let i = 0; i < 5; i++) {
        const a = T * 0.9 + i * (TAU / 5);
        const rr = b.r + 8;
        px(cx + Math.cos(a) * rr - 1, cy + Math.sin(a) * rr - 1, 2, 4, 'rgba(255,80,100,0.7)');
      }
      glowAt(cx, cy, 30, 'rgba(255,60,80,0.16)', 1);
    } else if (st === 'mirror') {
      ctx.globalAlpha = 0.18;
      ctx.drawImage(img, cx - w2 / 2 + 10, cy - h2 / 2, w2, h2);
      ctx.globalAlpha = 1;
      for (let i = 0; i < 3; i++) {
        const a = T * 1.2 + i * 2.1;
        px(cx + Math.cos(a) * (b.r + 10), cy + Math.sin(a) * (b.r + 6), 2, 2, 'rgba(220,240,255,0.6)');
      }
    }

    if (wind > 0.05) {
      ctx.globalAlpha = wind * (0.22 + Math.sin(T * 34) * 0.14);
      ctx.drawImage(ART.tint(img, b.col, 0.9), Math.round(cx - w2 / 2), Math.round(cy - h2 / 2), w2, h2);
      ctx.globalAlpha = 1;
    }
    if (b.hitT > 0) {
      ctx.globalAlpha = Math.min(1, b.hitT * 8);
      ctx.drawImage(ART.tint(img, '#ffffff', 0.85), Math.round(cx - w2 / 2), Math.round(cy - h2 / 2), w2, h2);
      ctx.globalAlpha = 1;
    }
  }

  function drawEffectsWorld() {
    for (let i = 0; i < effects.length; i++) {
      const e = effects[i];
      const p = clamp((e.t - (e.delay || 0)) / e.max, 0, 1);
      if (p <= 0) continue;
      if (e.x !== undefined && (e.x < camX - 140 || e.x > camX + W + 140 || e.y < camY - 140 || e.y > camY + H + 140)) continue;
      if (e.kind === 'slash') {
        ctx.save();
        ctx.translate(e.x, e.y - 2);
        ctx.rotate(e.a);
        ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, e.reach * (0.6 + p * 0.5), -e.arc, e.arc);
        ctx.stroke();
        ctx.globalAlpha = (1 - p) * 0.4;
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 1;
      } else if (e.kind === 'spark') {
        ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let k = 1; k < e.pts.length; k++) {
          const a = e.pts[k - 1], b2 = e.pts[k];
          const mx = (a.x + b2.x) / 2 + rand(-3, 3);
          const my = (a.y + b2.y) / 2 + rand(-3, 3);
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mx, my);
          ctx.lineTo(b2.x, b2.y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawGlow() {
    // 屏外剔除边界（世界坐标）
    const vx0 = camX - 56, vy0 = camY - 56, vx1 = camX + W + 56, vy1 = camY + H + 56;
    const inView = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1;
    // 灯笼

    if (state === 'TITLE') {
      // 标题场景：只保留世界与光晕，不显示角色
      for (let i = 0; i < 2; i++) {
        const yy = 60 + i * 14;
        glowAt(W / 2, yy, i ? 62 : 150, 'rgba(255,170,70,0.10)', 1);
      }
    } else {
      const lp = lanternPos();
      const lanternX = lp.x, lanternY = lp.y;
      glowAt(lanternX, lanternY, 18 * P.st.light, 'rgba(255,176,60,0.16)', 1);
      glowAt(lanternX, lanternY, 8, 'rgba(255,229,160,0.6)', 1);
    }
    if (P.dashT > 0) glowAt(P.x, P.y, 20, 'rgba(120,200,255,0.35)', 1);

    // 拾取物
    for (let i = 0; i < pickups.length; i++) {
      const p = pickups[i];
      if (p.kind === 'heart') glowAt(p.x, p.y, 12, 'rgba(255,90,120,0.4)', 1);
      else glowAt(p.x, p.y, 9, 'rgba(120,220,255,0.45)', 1);
    }
    // 子弹
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      if (b.kind === 'bolt') {
        glowAt(b.x, b.y, 7, 'rgba(255,220,140,0.55)', 1);
        px(b.x - 1, b.y - 1, 2, 2, '#fffbe8');
      } else if (b.kind === 'ember') {
        glowAt(b.x, b.y, 12, 'rgba(255,170,60,0.5)', 1);
        px(b.x - 1.5, b.y - 1.5, 3, 3, '#ffe9a8');
      } else if (b.kind === 'spear') {
        const l = b.len || 18;
        ctx.strokeStyle = '#f0ece0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(b.x - Math.cos(b.ang) * l, b.y - Math.sin(b.ang) * l);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        px(b.x - 1, b.y - 1, 2, 2, '#ffffff');
      } else if (b.kind === 'storm') {
        glowAt(b.x, b.y, 8, 'rgba(160,220,255,0.55)', 1);
        px(b.x - 1.5, b.y - 1.5, 3, 3, '#e8f8ff');
      }
    }
    // 危险物
    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      if (h.kind === 'wave') {
        const a = Math.max(0, h.life / h.maxLife);
        ctx.strokeStyle = 'rgba(255,120,140,' + (0.55 * a) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255,220,200,' + (0.35 * a) + ')';
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r + 5, 0, TAU); ctx.stroke();
      } else if (h.kind === 'flame') {
        glowAt(h.x, h.y, 10, 'rgba(255,140,50,0.4)', 1);
        px(h.x - 3, h.y - 4, 6, 7, 'rgba(255,150,60,0.8)');
        px(h.x - 1, h.y - 6, 2, 4, '#ffe0a0');
      } else if (h.kind === 'homing') {
        glowAt(h.x, h.y, 9, 'rgba(255,120,200,0.45)', 1);
        px(h.x - 1.5, h.y - 1.5, 3, 3, '#ffd0f0');
      } else if (h.kind === 'beam') {
        const ex = h.x + Math.cos(h.ang) * h.len;
        const ey = h.y + Math.sin(h.ang) * h.len;
        const al = Math.min(1, h.life * 2);
        ctx.globalAlpha = 0.22 * al;
        ctx.strokeStyle = h.col || '#ffb45a';
        ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.globalAlpha = 0.9 * al;
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff6e0';
        ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.globalAlpha = 1;
        glowAt(ex, ey, 12, 'rgba(255,200,120,0.45)', 1);
      } else if (h.kind === 'warn') {
        const k = clamp(1 - h.life / 0.85, 0, 1);
        ctx.strokeStyle = h.magic ? 'rgba(170,130,255,0.85)' : 'rgba(255,150,90,0.9)';
        ctx.lineWidth = 1 + k * 1.5;
        ctx.beginPath();
        ctx.ellipse(h.x, h.y, h.r * (0.45 + k * 0.55), h.r * 0.62 * (0.45 + k * 0.55), 0, 0, TAU);
        ctx.stroke();
        if (h.magic) px(h.x - 1, h.y - 1, 3, 3, '#c9b0ff');
      } else if (h.kind === 'field') {
        ctx.globalAlpha = Math.min(0.34, 0.10 + h.life * 0.05);
        ctx.fillStyle = (h.col || '#5c3f92');
        ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.72, 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = (h.col || '#8a5ac0');
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.72, 0, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
        glowAt(h.x, h.y, h.r * 0.9, 'rgba(160,110,255,0.2)', 1);
      } else if (h.friend) {
        glowAt(h.x + rand(-3, 3), h.y + rand(-3, 3), 11, 'rgba(255,150,50,0.4)', 1);
      } else {
        glowAt(h.x, h.y, 8, 'rgba(220,80,160,0.45)', 1);
        px(h.x - 1, h.y - 1, 2.5, 2.5, '#ffb3e0');
      }
    }

    // 粒子
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (!p.add) continue;
      if (!inView(p.x, p.y)) continue;
      const a = Math.max(0, p.life / p.max);
      glowAt(p.x, p.y, 4 + p.size * 2, 'rgba(255,220,150,0.5)', a);
      px(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size, p.color);
    }
    // 非加乘粒子（烟尘等）
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.add) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.max) * 0.8;
      px(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size, p.color);
      ctx.globalAlpha = 1;
    }
    // 敌人眼睛（黑暗中）
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead || e.spawnT > 0) continue;
      const dd = dist(e.x, e.y, P.x, P.y);
      if (dd > 210) continue;
      const a = clamp(1 - (dd - 60) / 150, 0.12, 0.85);
      px(e.x - 3, e.y - 1, 1, 1, 'rgba(255,120,90,' + a + ')');
      px(e.x + 3, e.y - 1, 1, 1, 'rgba(255,120,90,' + a + ')');
    }
    // 特效
    for (let i = 0; i < effects.length; i++) {
      const e = effects[i];
      const p = clamp((e.t - (e.delay || 0)) / e.max, 0, 1);
      if (p <= 0 || p >= 1) continue;
      if (e.kind === 'bell') {
        const r = lerp(e.r0, e.r1, G.easeOutCubic(p));
        ctx.strokeStyle = 'rgba(255,230,160,' + (1 - p) * 0.9 + ')';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,220,' + (1 - p) * 0.55 + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.8, 0, TAU); ctx.stroke();
      } else if (e.kind === 'frost') {
        const r = lerp(e.r0, e.r1, G.easeOutCubic(p));
        glowAt(e.x, e.y, r, 'rgba(140,220,255,0.35)', 1 - p);
        ctx.strokeStyle = 'rgba(200,240,255,' + (1 - p) * 0.8 + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, TAU); ctx.stroke();
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * TAU + p * 1.2;
          px(e.x + Math.cos(a) * r - 1, e.y + Math.sin(a) * r - 1, 2, 2, 'rgba(230,250,255,' + (1 - p) + ')');
        }
      } else if (e.kind === 'nova') {
        const r = lerp(e.r0, e.r1, G.easeOutCubic(p));
        ctx.strokeStyle = 'rgba(140,230,255,' + (1 - p) * 0.85 + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, r, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(220,250,255,' + (1 - p) * 0.5 + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(e.x, e.y, r * 0.82, 0, TAU);
        ctx.stroke();
      } else if (e.kind === 'ring') {
        const r = lerp(e.r0, e.r1, G.easeOutCubic(p));
        glowAt(e.x, e.y, r, 'rgba(255,180,80,0.5)', 1 - p);
      }
    }
    // 灯笼实际光晕在地面上
    glowAt(P.x, P.y + 4, 20 * P.st.light, 'rgba(255,160,60,0.06)', 1);
  }

  function drawTextsWorld() {
    for (let i = 0; i < texts.length; i++) {
      const t = texts[i];
      const a = clamp(t.life / t.max * 1.6, 0, 1);
      ctx.globalAlpha = a;
      const sc = t.scale;
      const txt = t.str;
      const w = ART.tinyWidth(txt, sc);
      ART.tiny(ctx, txt, t.x - w / 2, t.y, '#05060b', sc);
      ART.tiny(ctx, txt, t.x - w / 2, t.y - 1, t.color, sc);
      ctx.globalAlpha = 1;
    }
  }

  function drawBanner() {
    if (bannerT <= 0) return;
    const a = Math.min(1, bannerT * 1.4) * Math.min(1, (2.2 - bannerT) * 3);
    const y = (boss && !boss.dead) ? 66 : 54;
    ctx.globalAlpha = a;
    ART.text(ctx, bannerText, W / 2, y, { color: '#ffdca0', align: 'center', shadow: true, shadowColor: '#000' });
    ctx.globalAlpha = 1;
  }

  /* =========================================================
     HUD
     ========================================================= */
  function drawMinimap() {
    if (!level || state === 'TITLE') return;
    const cw = 7, ch = 5, gap = 2;
    const mw = 5 * (cw + gap), mh = 5 * (ch + gap);
    const mx = W - mw - 10, my = 30;
    px(mx - 4, my - 4, mw + 6, mh + 6, 'rgba(6,8,14,0.62)');
    const colOf = (t, visited) => {
      if (!visited) return 'rgba(90,102,126,0.5)';
      if (t === 'start') return '#7fd1a0';
      if (t === 'treasure') return '#ffd166';
      if (t === 'special') return '#c9a0ff';
      if (t === 'elite') return '#ff8f9f';
      if (t === 'cage') return '#9fd8ff';
      if (t === 'portal') return '#7fe0ff';
      if (t === 'boss') return '#c07ade';
      return '#8ea2c0';
    };
    for (let i = 0; i < level.rooms.length; i++) {
      const r = level.rooms[i];
      if (r.type === 'hidden' && !r.visited) continue;
      const x = mx + r.gx * (cw + gap), y = my + r.gy * (ch + gap);
      px(x, y, cw, ch, colOf(r.type, r.visited));
      if (r === room) {
        px(x - 1, y - 1, cw + 2, ch + 2, 'rgba(255,233,168,0.35)');
        px(x, y, cw, ch, '#ffe9a8');
      }
    }
    // 连接
    ctx.strokeStyle = 'rgba(140,160,190,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < level.corridors.length; i++) {
      const c = level.corridors[i];
      const a = roomById[c.a];
      const b = roomById[c.b];
      if (!a || !b) continue;
      if ((a.type === 'hidden' && !a.visited) || (b.type === 'hidden' && !b.visited)) continue;
      const ax = mx + a.gx * (cw + gap) + cw / 2, ay = my + a.gy * (ch + gap) + ch / 2;
      const bx = mx + b.gx * (cw + gap) + cw / 2, by = my + b.gy * (ch + gap) + ch / 2;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
  }

  function drawStoryQuote() {
    if (!storyQuote) return;
    const q = storyQuote;
    const a = clamp(q.t / 0.4, 0, 1);
    const w = 280, h = 42;
    const x = (W - w) / 2, y = 82;
    ctx.globalAlpha = a;
    px(x - 6, y - 4, w + 12, h + 6, 'rgba(6,6,12,0.62)');
    ART.text(ctx, q.name, x, y, { color: '#ff9aa8', shadow: true, shadowColor: '#000' });
    for (let i = 0; i < q.lines.length && i < 2; i++) {
      ART.text(ctx, q.lines[i], x, y + 16 + i * 15, { color: '#dfe7f5', shadow: true, shadowColor: '#000' });
    }
    ctx.globalAlpha = 1;
  }

  function drawTouchControls() {
    if (!Input.touchMode) return;
    const jx = Input.touch.active ? Input.touch.ox : 52;
    const jy = Input.touch.active ? Input.touch.oy : H - 58;
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#0a1420';
    ctx.beginPath(); ctx.arc(jx, jy, 25, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = '#9fe8ff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(jx, jy, 25, 0, TAU); ctx.stroke();
    let kx = jx, ky = jy;
    if (Input.touch.active) {
      const dx = Input.touch.x - Input.touch.ox;
      const dy = Input.touch.y - Input.touch.oy;
      const l = Math.hypot(dx, dy) || 1;
      const cl = Math.min(l, 20);
      kx = jx + dx / l * cl;
      ky = jy + dy / l * cl;
    }
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#9fe8ff';
    ctx.beginPath(); ctx.arc(kx, ky, 7, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;

    const tbtn = (cx, cy, label, ratio, ready) => {
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = ready ? '#9fe8ff' : '#4a5a72';
      ctx.beginPath(); ctx.arc(cx, cy, 18, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = ready ? '#d8f4ff' : '#6f7d9a';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, 18, -Math.PI / 2, -Math.PI / 2 + TAU * ratio); ctx.stroke();
      ctx.globalAlpha = 1;
      ART.text(ctx, label, cx, cy - 5, { color: ready ? '#eaf8ff' : '#8fa6c9', align: 'center' });
    };
    tbtn(W - 36, H - 54, '冲', clamp(1 - P.dashCd / 1.55, 0, 1), P.dashCd <= 0);
    tbtn(W - 86, H - 64, '灯', clamp(1 - P.skill.cd / P.skill.max, 0, 1), P.skill.cd <= 0);

    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = '#8fa6c9';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(16, 36, 12, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
    ART.text(ctx, 'II', 16, 30, { color: '#8fa6c9', align: 'center' });
  }

  function drawHUD() {
    if (cine) return;
    const ch = CHARS[P.charId];
    // 经验条
    px(0, H - 5, W, 5, '#04060b');
    px(0, H - 4, W, 3, '#101828');
    const xpPct = clamp(P.xp / P.xpNeed, 0, 1);
    px(0, H - 4, W * xpPct, 3, '#3fa8d8');
    px(0, H - 4, W * xpPct, 1, '#9fe8ff');

    // 左上：等级
    ART.text(ctx, '等级 ' + P.level, 8, 6, { color: '#ffe9a8', shadow: true, shadowColor: '#000' });

    // 生命条
    const hbw = 88;
    const hx = 8, hy = H - 22;
    px(hx - 2, hy - 2, hbw + 4, 11, '#04060b');
    px(hx, hy, hbw, 7, '#26141a');
    const hpPct = isFinite(P.hp) && P.maxHp > 0 ? clamp(P.hp / P.maxHp, 0, 1) : 0;
    const hpCol = hpPct > 0.5 ? '#ff6b7f' : hpPct > 0.25 ? '#ffa14a' : '#ff3b52';
    px(hx, hy, hbw * hpPct, 7, hpCol);
    px(hx, hy, hbw * hpPct, 2, 'rgba(255,255,255,0.35)');
    ART.tiny(ctx, Math.ceil(isFinite(P.hp) ? P.hp : 0) + '/' + Math.round(P.maxHp), hx + 4, hy + 1, '#ffe1e6', 1);

    // 冲刺冷却
    const dy = hy + 12;
    px(hx, dy, 30, 3, '#04060b');
    const dashPct = 1 - P.dashCd / 1.55;
    px(hx, dy, 28 * clamp(dashPct, 0, 1), 1, dashPct >= 1 ? '#9fd8ff' : '#3d556b');
    ART.tiny(ctx, '冲', hx + 31, dy - 1, dashPct >= 1 ? '#9fd8ff' : '#40536b', 1);

    // 主动技能
    const sy2 = dy + 5;
    const skPct = 1 - P.skill.cd / P.skill.max;
    px(hx, sy2, 30, 3, '#04060b');
    px(hx, sy2, 28 * clamp(skPct, 0, 1), 1, skPct >= 1 ? '#ffd166' : '#5a4a2a');
    ART.tiny(ctx, 'E', hx + 31, sy2 - 1, skPct >= 1 ? '#ffd166' : '#6a5a3a', 1);

    // 神器（单槽）
    if (P.relics[0]) {
      const rel = RELICS[P.relics[0]];
      const rlx = Input.touchMode ? 10 : W - 22;
      const rly = Input.touchMode ? 42 : H - 40;
      ctx.drawImage(SPR.icons[rel.icon], rlx, rly);
      for (let k = 0; k < 3; k++) px(rlx + k * 3, rly + 13, 2, 2, k < (P.relicLvl || 1) ? '#ffd166' : '#20263a');
      if (P.relicStore && P.relicStore.length) {
        ART.tiny(ctx, '+' + P.relicStore.length, rlx + 8, rly - 6, '#4f5a75', 1);
      }
    }

    // 武器图标
    let wx = 8;
    const wy = H - 40;
    for (let i = 0; i < P.weapons.length; i++) {
      const w = P.weapons[i];
      const wdef = defOf(w.id);
      ctx.drawImage(SPR.icons[wdef.icon], wx, wy);
      for (let k = 0; k < wdef.max; k++) {
        px(wx + k * 3, wy + 13, 2, 2, k < w.lvl ? '#ffe066' : '#20263a');
      }
      wx += 16;
    }

    // 层 / 关
    const bossAlive = boss && !boss.dead;
    ART.text(ctx, '第 ' + (floorIdx + 1) + ' 层 · ' + (themeInfo ? themeInfo.name : ''), W / 2, bossAlive ? 6 : 5, {
      color: bossAlive ? '#8b93ad' : '#ffdca0', align: 'center',
      scale: 1, shadow: true, shadowColor: '#000',
    });
    if (!bossAlive) {
      ART.text(ctx, (levelIdx + 1) + ' / ' + D.ROOMS, W / 2, 18, {
        color: '#6f7d9a', align: 'center', shadow: true, shadowColor: '#000',
      });
    }
    drawMinimap();
    const mm = Math.floor(runTime / 60).toString().padStart(2, '0');
    const ss = Math.floor(runTime % 60).toString().padStart(2, '0');
    ART.text(ctx, mm + ':' + ss, 8, 20, { color: '#4f5a75', shadow: true, shadowColor: '#000' });
    if (room) {
      const left = roomAlive();
      ART.text(ctx, roomCleared ? '通道已开' : '剩余 ' + left, W - 8, 20, {
        color: roomCleared ? '#9fe8ff' : '#8b93ad', align: 'right', shadow: true, shadowColor: '#000',
      });
    }

    // 击杀
    ART.text(ctx, '击杀 ' + kills, W - 8, 7, { color: '#8b93ad', align: 'right', shadow: true, shadowColor: '#000' });

    // Boss 血条
    if (bossAlive) {
      const bw = 200;
      const bx = (W - bw) / 2;
      ART.text(ctx, boss.name, W / 2, 18, { color: '#ffb0bb', align: 'center', shadow: true, shadowColor: '#000' });
      px(bx - 2, 34, bw + 4, 9, '#04060b');
      px(bx, 36, bw, 5, '#2a1018');
      px(bx, 36, bw * clamp(boss.hp / boss.maxHp, 0, 1), 5, '#e0485f');
      px(bx, 36, bw * clamp(boss.hp / boss.maxHp, 0, 1), 2, '#ff9aa8');
    }
  }

  /* =========================================================
     标题 / 卡片 / 暂停 / 结算
     ========================================================= */
  function titleBackdrop(y0, h) {
    ctx.fillStyle = 'rgba(4,6,12,0.72)';
    ctx.fillRect(0, y0, W, h);
  }

  function drawTitle() {
    ctx.fillStyle = 'rgba(4,6,12,0.46)';
    ctx.fillRect(0, 0, W, H);

    // ===== 左栏：标志 / 灯笼 / 入口 =====
    px(8, 6, 168, 204, 'rgba(8,11,20,0.58)');
    px(8, 6, 168, 1, 'rgba(255,195,107,0.22)');
    px(8, 209, 168, 1, 'rgba(255,195,107,0.10)');
    px(184, 6, 1, 204, 'rgba(255,195,107,0.10)');

    glowAt(92, 46, 74, 'rgba(255,170,70,0.12)', 1);
    ART.text(ctx, '提 灯 者', 14, 10, {
      color: '#ffc36b', scale: 3, shadow: true, shadowColor: '#28160a', shadowOff: 3,
    });
    ART.text(ctx, 'L A M P L I T', 17, 52, { color: '#5d6b88' });
    px(16, 64, 148, 1, 'rgba(255,195,107,0.20)');

    // 悬挂灯笼
    const fx = 92 + Math.round(Math.sin(T * 2.2) * 1.5);
    const fy = 92 + Math.round(Math.sin(T * 1.7) * 1);
    px(92, 70, 1, 10, 'rgba(150,120,80,0.55)');
    px(fx - 8, fy - 2, 17, 2, '#5a4630');
    px(fx - 7, fy, 15, 18, '#2a2016');
    px(fx - 5, fy + 2, 11, 14, '#3a2c1c');
    px(fx - 4, fy + 5 + Math.round(Math.sin(T * 9) * 1), 9, 9, 'rgba(255,190,90,0.8)');
    px(fx - 2, fy + 6 + Math.round(Math.sin(T * 9) * 1), 5, 6, '#fff0c0');
    px(fx - 8, fy + 18, 17, 2, '#5a4630');
    glowAt(fx, fy + 8, 26 + Math.sin(T * 5) * 3, 'rgba(255,200,110,0.32)', 1);

    // 入口 / 继续
    const blink = Math.sin(T * 3) > -0.3;
    const snap = save.run && save.run.seed ? save.run : null;
    if (titleHintT > 0) {
      ART.text(ctx, titleHint, 92, 137, {
        color: '#ff8f9f', align: 'center', shadow: true, shadowColor: '#000',
      });
    } else if (snap) {
      const b = TITLE_BTN.cont;
      const sel = inRect(Input.mouse.x, Input.mouse.y, b);
      panel(b.x, b.y, b.w, b.h, sel ? '#1e2740' : '#12161f', sel ? '#ffc36b' : '#3a4a6a', '#05070d');
      ART.text(ctx, '继续旅程 · ' + (snap.floor + 1) + '-' + (snap.level + 1), b.x + b.w / 2, b.y + 5,
        { color: sel ? '#ffe9a8' : '#cfd8ea', align: 'center' });
      ART.text(ctx, 'N 新局', 168, 137, { color: '#4a5264', align: 'right' });
    } else {
      const selChar = ['lamp', 'grave', 'ranger'][menuIndex];
      const canStart = !CHARS[selChar].unlock || save.unlocked.includes(selChar);
      ctx.globalAlpha = 0.55 + 0.45 * Math.max(0, Math.sin(T * 3));
      ART.text(ctx, canStart ? '按 空格 / 点击 点亮灯笼' : '请选择一位已解锁的角色', 92, 133,
        { color: canStart ? '#ffe9a8' : '#8b93ad', align: 'center', shadow: true, shadowColor: '#000' });
      ctx.globalAlpha = 1;
    }

    // 模式按钮（竖排）
    const modeBtns = [
      [TITLE_BTN.daily, '今日挑战', 'T'],
      [TITLE_BTN.codex, '图鉴 · 成就', 'C'],
      [TITLE_BTN.story, '记忆 · 故事', 'S'],
    ];
    for (let i = 0; i < modeBtns.length; i++) {
      const r = modeBtns[i][0], label = modeBtns[i][1], key = modeBtns[i][2];
      const hov = inRect(Input.mouse.x, Input.mouse.y, r);
      panel(r.x, r.y, r.w, r.h, hov ? '#1a2234' : '#10141d', hov ? '#ffc36b' : '#2a3350', '#05070d');
      ART.text(ctx, label, r.x + 7, r.y + 3, { color: hov ? '#ffe9a8' : '#9aa6c0' });
      ART.text(ctx, key, r.x + r.w - 7, r.y + 3, { color: hov ? '#ffc36b' : '#4a5264', align: 'right' });
    }
    ART.text(ctx, 'v4.4', 10, 200, { color: '#39415c' });
    ART.text(ctx, '长夜 · 第五次提灯', 168, 200, { color: '#39415c', align: 'right' });

    // ===== 右栏：角色卡 =====
    ART.text(ctx, '选 择 提 灯 者', 192, 26, { color: '#6f7d9a' });
    px(192, 38, 176, 1, 'rgba(255,195,107,0.14)');
    const ids = ['lamp', 'grave', 'ranger'];
    for (let i = 0; i < 3; i++) {
      const id = ids[i];
      const c = CHARS[id];
      const unlocked = !c.unlock || save.unlocked.includes(id);
      const x = TITLE_CARD.x, y = TITLE_CARD.y + i * TITLE_CARD.gap, w = TITLE_CARD.w, h = TITLE_CARD.h;
      const sel = menuIndex === i;
      const hover = inRect(Input.mouse.x, Input.mouse.y, { x, y, w, h });
      if (hover && unlocked && !sel && hoverTimer <= 0) { menuIndex = i; hoverTimer = 0.14; AUDIO.sfx('hover'); }
      panel(x, y, w, h, sel ? '#1c2436' : '#12161f', sel ? '#ffc36b' : '#2a3350', sel ? '#3a2a12' : '#05070d');
      px(x, y, 3, h, unlocked ? c.color : '#2a3350');
      if (sel) {
        px(x + 2, y + 2, w - 4, 1, 'rgba(255,195,107,0.35)');
        ART.text(ctx, '◀', x + w - 10, y + h / 2 - 5, { color: '#ffc36b', align: 'right' });
      }
      if (!unlocked) {
        px(x + w - 14, y + 7, 8, 6, '#39415c');
        px(x + w - 12, y + 4, 3, 3, '#39415c');
        px(x + w - 11, y + 9, 1, 2, '#12161f');
      }
      ART.text(ctx, c.name, x + 9, y + 5, { color: unlocked ? (sel ? '#ffe9a8' : '#cfd8ea') : '#4a5268' });
      ART.text(ctx, unlocked ? WEAPONS[c.weapon].name : '? ? ?', x + w - 9, y + 5,
        { color: unlocked ? '#6f7d9a' : '#39415c', align: 'right' });
      const noteSrc = unlocked ? c.note : (c.unlock === 'win' ? '通关一次后解锁' : '击败第一位层主后解锁');
      const noteLines = wrapText(noteSrc, w - 20);
      for (let k = 0; k < noteLines.length && k < 2; k++) {
        ART.text(ctx, noteLines[k], x + 9, y + 22 + k * 13, { color: unlocked ? '#8b97b3' : '#55607d' });
      }
    }

    // 右栏底部：战绩
    const cps = META.codexProgress(save);
    let statLine = '穿过 4 层长夜 · 击碎 12 位层主';
    if (save.best.runs > 0) {
      const bt = Math.floor(save.best.time / 60).toString().padStart(2, '0') + ':' +
        Math.floor(save.best.time % 60).toString().padStart(2, '0');
      statLine = '最长 ' + bt + '　击杀 ' + save.best.kills + '　通关 ' + save.best.wins + ' 次';
    }
    ART.text(ctx, statLine, 192, 190, { color: '#6a7591' });
    ART.text(ctx, '图鉴 ' + (cps.e + cps.w + cps.p) + '/' + (cps.eMax + cps.wMax + cps.pMax) +
      '　成就 ' + META.achCount(save) + '/' + META.ACHIEVEMENTS.length,
      192, 201, { color: '#39415c' });
  }

  function drawTitleButton(r, label, key, mode) {
    const hover = inRect(Input.mouse.x, Input.mouse.y, r);
    panel(r.x, r.y, r.w, r.h, hover ? '#222b40' : '#12161f', hover ? '#ffd166' : '#2f3852');
    ART.text(ctx, label, r.x + 8, r.y + 4, { color: hover ? '#ffe9a8' : '#cfd8ea' });
    ART.text(ctx, '[' + key + ']', r.x + r.w - 8, r.y + 4, { color: '#6f7d9a', align: 'right' });
  }

  /* =========================================================
     图鉴
     ========================================================= */
  function codexEntries() {
    if (codexTab === 0) return Object.keys(META.ENEMIES).map((id) => ({ kind: 'enemy', id }));
    if (codexTab === 1) return Object.keys(WEAPONS).map((id) => ({ kind: 'weapon', id }));
    if (codexTab === 2) return Object.keys(PASSIVES).map((id) => ({ kind: 'passive', id }));
    if (codexTab === 4) {
      const list = [{ kind: 'prologue', id: 'prologue' }];
      for (let i = 0; i < STORY.fragments.length; i++) list.push({ kind: 'frag', id: STORY.fragments[i].id });
      return list;
    }
    return META.ACHIEVEMENTS.map((a) => ({ kind: 'ach', id: a.id }));
  }

  function codexIcon(kind, id) {
    if (kind === 'enemy') {
      if (id === 'boss1') return SPR.boss1;
      if (id === 'boss2') return SPR.boss2;
      const f = SPR[id];
      return Array.isArray(f) ? f[0] : f;
    }
    if (kind === 'weapon') return SPR.icons[WEAPONS[id].icon];
    if (kind === 'passive') return SPR.icons[PASSIVES[id].icon];
    const a = achById(id);
    return SPR.icons[a ? a.icon : 'crit'];
  }

  function codexUnlocked(kind, id) {
    if (kind === 'ach') return !!save.ach[id];
    if (kind === 'prologue') return true;
    if (kind === 'frag') return STORY.has(save, id);
    if (kind === 'enemy') return META.isUnlocked(save, 'enemies', id);
    if (kind === 'weapon') return META.isUnlocked(save, 'weapons', id);
    return META.isUnlocked(save, 'passives', id);
  }

  function drawCodex() {
    ctx.fillStyle = 'rgba(4,6,12,0.95)';
    ctx.fillRect(0, 0, W, H);
    ART.text(ctx, '图 鉴', 12, 4, { color: '#ffdca0', scale: 2 });
    ART.text(ctx, 'Q/E 切页　方向键 选择　ESC 返回', W - 12, 8, { color: '#4f5a75', align: 'right' });
    ART.text(ctx, '成就 ' + META.achCount(save) + '/' + META.ACHIEVEMENTS.length, W - 12, 24,
      { color: '#6f7d9a', align: 'right' });

    const cps = META.codexProgress(save);
    const tabs = ['敌人 ' + cps.e + '/' + cps.eMax, '武器 ' + cps.w + '/' + cps.wMax,
      '被动 ' + cps.p + '/' + cps.pMax, '成就', '故事 ' + STORY.count(save) + '/' + STORY.fragments.length];
    let tx = 12;
    codexTabRects = [];
    for (let i = 0; i < tabs.length; i++) {
      const w = ART.textWidth(tabs[i]) + 12;
      codexTabRects.push({ x: tx - 5, y: 39, w: w + 6, h: 17 });
      const active = codexTab === i;
      if (active) {
        px(tx - 5, 39, w + 6, 17, '#1c2436');
        px(tx - 5, 56, w + 6, 1, '#ffc36b');
      }
      ART.text(ctx, tabs[i], tx, 40, { color: active ? '#ffe9a8' : '#6f7d9a' });
      tx += w + 8;
    }
    px(0, 58, W, 1, 'rgba(70,80,110,0.35)');

    const entries = codexEntries();
    codexSel = clamp(codexSel, 0, Math.max(0, entries.length - 1));

    if (codexTab === 4) {
      // 故事：左侧列表 + 右侧正文
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const x = 10, y = 66 + i * 16;
        const un = codexUnlocked(e.kind, e.id);
        const hover = inRect(Input.mouse.x, Input.mouse.y, { x, y, w: 138, h: 15 });
        if (hover) codexSel = i;
        if (codexSel === i) px(x - 3, y - 1, 142, 16, 'rgba(255,209,102,0.14)');
        const mark = un ? '◆' : '◇';
        ART.text(ctx, mark, x, y, { color: un || e.kind === 'prologue' ? '#ffd166' : '#39415c' });
        const nm = e.kind === 'prologue' ? '序章 · 长夜' : (un ? codexName(e) : '？？？');
        ART.text(ctx, nm, x + 14, y, { color: un || e.kind === 'prologue' ? '#e8eef8' : '#4a5268' });
      }
      const sel = entries[codexSel];
      panel(156, 64, 218, 142, '#10131f', '#2a3350');
      if (sel) {
        const un = codexUnlocked(sel.kind, sel.id);
        if (sel.kind === 'prologue') {
          const lines = wrapText('长夜降临，守夜人只剩下最后一个。你接过灯，走向黎明。按 Enter 重看序章。', 200);
          for (let k = 0; k < lines.length; k++) ART.text(ctx, lines[k], 164, 72 + k * 16, { color: '#9aa5bf' });
          if (Math.sin(T * 3) > -0.3) ART.text(ctx, 'Enter 阅读', 366, 190, { color: '#ffd166', align: 'right' });
        } else {
          const f = STORY.fragmentById(sel.id);
          if (!un) {
            ART.text(ctx, '尚未拾起', 164, 72, { color: '#4a5268' });
            ART.text(ctx, '线索：' + f.hint, 164, 92, { color: '#6f7d9a' });
          } else {
            ART.text(ctx, f.name, 164, 70, { color: '#ffe9a8' });
            const lines = wrapText(f.text.replace(/\n/g, ''), 200);
            for (let k = 0; k < lines.length && k < 7; k++) {
              ART.text(ctx, lines[k], 164, 90 + k * 16, { color: '#9aa5bf' });
            }
          }
        }
      }
      return;
    }

    if (codexTab === 3) {
      // 成就：两列文字列表
      const cols = 2;
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const col = i % cols, row = Math.floor(i / cols);
        const x = 10 + col * 192, y = 62 + row * 16;
        const un = codexUnlocked('ach', e.id);
        const a = achById(e.id);
        const hover = inRect(Input.mouse.x, Input.mouse.y, { x, y, w: 176, h: 15 });
        if (hover) codexSel = i;
        if (codexSel === i) px(x - 3, y - 1, 178, 16, 'rgba(255,209,102,0.14)');
        ctx.globalAlpha = un ? 1 : 0.22;
        ctx.drawImage(SPR.icons[a.icon], 0, 0, 12, 12, x, y + 1, 12, 12);
        ctx.globalAlpha = 1;
        ART.text(ctx, a.name, x + 16, y, { color: un ? '#ffe9a8' : '#4a5268' });
        ART.text(ctx, un ? '已达成' : '未达成', x + 174, y,
          { color: un ? '#6fd68a' : '#39415c', align: 'right' });
      }
      const sel = entries[codexSel];
      panel(10, 176, W - 20, 30, '#10131f', '#2a3350');
      if (sel) {
        const a = achById(sel.id);
        ART.text(ctx, a.desc, 18, 182, { color: codexUnlocked('ach', a.id) ? '#cfd8ea' : '#8b97b3' });
      }
      return;
    }

    // 网格
    const cols = 4, cellW = 88, cellH = 32;
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const col = i % cols, row = Math.floor(i / cols);
      const x = 10 + col * 92, y = 62 + row * 34;
      const un = codexUnlocked(e.kind, e.id);
      const hover = inRect(Input.mouse.x, Input.mouse.y, { x, y, w: cellW, h: cellH });
      if (hover) codexSel = i;
      const selected = codexSel === i;
      panel(x, y, cellW, cellH, selected ? '#1c2436' : '#12161f', selected ? '#ffc36b' : '#242c42', '#05070d');
      const icon = codexIcon(e.kind, e.id);
      const s = e.kind === 'enemy' && (e.id === 'boss1' || e.id === 'boss2') ? 1 : 2;
      const iw = icon.width * s, ih = icon.height * s;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 2, y + 2, cellW - 4, cellH - 4);
      ctx.clip();
      ctx.globalAlpha = un ? 1 : 0.16;
      ctx.drawImage(icon, x + 4, y + Math.round((cellH - ih) / 2), iw, ih);
      ctx.restore();
      ctx.globalAlpha = 1;
      const name = un ? codexName(e) : '？？？';
      ART.text(ctx, name, x + 6 + Math.max(26, Math.min(iw, 34)) + 2, y + 8,
        { color: un ? (selected ? '#ffe9a8' : '#cfd8ea') : '#3d4560' });
    }

    // 详情
    panel(10, 162, W - 20, 50, '#10131f', '#2a3350');
    const sel = entries[codexSel];
    if (sel) {
      const un = codexUnlocked(sel.kind, sel.id);
      if (!un) {
        ART.text(ctx, '尚未遇见——继续点亮灯笼', W / 2, 178, { color: '#4a5268', align: 'center' });
      } else {
        ART.text(ctx, codexName(sel), 18, 164, { color: '#ffe9a8' });
        if (sel.kind === 'enemy') {
          const info = META.ENEMIES[sel.id];
          const stat = '生命 ' + ENEMIES[sel.id].hp + '　伤害 ' + ENEMIES[sel.id].dmg +
            (info.boss ? '　首领' : '　魂火 ' + ENEMIES[sel.id].xp);
          ART.text(ctx, stat, W - 18, 164, { color: '#7f8bab', align: 'right' });
          const lines = wrapText(info.lore, W - 40);
          for (let k = 0; k < 2; k++) {
            if (lines[k]) ART.text(ctx, lines[k], 18, 180 + k * 16, { color: '#9aa5bf' });
          }
        } else if (sel.kind === 'weapon') {
          ART.text(ctx, '最高 ' + WEAPONS[sel.id].max + ' 级', W - 18, 164, { color: '#7f8bab', align: 'right' });
          const lines = wrapText(META.WEAPONS[sel.id].lore, W - 40);
          ART.text(ctx, lines[0] || '', 18, 180, { color: '#9aa5bf' });
          const t2 = wrapText(META.WEAPONS[sel.id].tip, W - 40);
          ART.text(ctx, t2[0] || '', 18, 196, { color: '#6f7d9a' });
        } else {
          ART.text(ctx, PASSIVES[sel.id].info[0] + '　最高 ' + PASSIVES[sel.id].max + ' 级', W - 18, 164,
            { color: '#7f8bab', align: 'right' });
          const lines = wrapText(META.PASSIVES[sel.id].lore, W - 40);
          for (let k = 0; k < 2; k++) {
            if (lines[k]) ART.text(ctx, lines[k], 18, 180 + k * 16, { color: '#9aa5bf' });
          }
        }
      }
    }
  }

  function codexName(e) {
    if (e.kind === 'enemy') return META.ENEMIES[e.id].name;
    if (e.kind === 'weapon') return WEAPONS[e.id].name;
    if (e.kind === 'passive') return PASSIVES[e.id].name;
    if (e.kind === 'prologue') return '序章 · 长夜';
    if (e.kind === 'frag') {
      const f = STORY.fragmentById(e.id);
      return f ? f.name : '';
    }
    const a = achById(e.id);
    return a ? a.name : '';
  }

  /* =========================================================
     每日挑战预览
     ========================================================= */
  const DAILY_BTN = {
    start: { x: 34, y: 178, w: 148, h: 22 },
    back: { x: 202, y: 178, w: 148, h: 22 },
  };

  function openDaily() {
    dailyPreview = META.dailyConfig();
    state = 'DAILY';
    AUDIO.sfx('click');
  }

  function drawDaily() {
    const cfg = dailyPreview || (dailyPreview = META.dailyConfig());
    ctx.fillStyle = 'rgba(6,7,14,0.95)';
    ctx.fillRect(0, 0, W, H);
    glowAt(W / 2, 26, 120, 'rgba(255,170,70,0.10)', 1);

    ART.text(ctx, '今 日 挑 战', W / 2, 4, { color: '#ffdca0', scale: 2, align: 'center', shadow: true, shadowColor: '#000' });
    ART.text(ctx, cfg.key, 12, 42, { color: '#6f7d9a' });
    const best = (save.daily && save.daily.best[cfg.key]) || 0;
    ART.text(ctx, best > 0 ? '今日最高 ' + best + ' 分' : '今日尚未出征', W - 12, 42,
      { color: best > 0 ? '#9fe8ff' : '#55607d', align: 'right' });

    const ch = CHARS[cfg.char];
    panel(20, 60, W - 40, 20, '#131826', '#2f3852');
    ART.text(ctx, '角色', 28, 62, { color: '#6f7d9a' });
    ART.text(ctx, ch.name, 68, 62, { color: '#ffe9a8' });
    ART.text(ctx, WEAPONS[ch.weapon].name + ' 起手', W - 28, 62, { color: '#8b97b3', align: 'right' });

    ART.text(ctx, '今日变数', 20, 84, { color: '#7f8bab' });
    for (let i = 0; i < cfg.mods.length; i++) {
      const m = cfg.mods[i];
      const y = 100 + i * 38;
      panel(20, y, W - 40, 36, '#151a28', '#3a2a12');
      px(23, y + 3, 3, 30, '#ffc36b');
      ART.text(ctx, m.name, 32, y + 1, { color: '#ffd166' });
      ART.text(ctx, m.desc, 32, y + 17, { color: '#8b97b3' });
    }

    const hs = inRect(Input.mouse.x, Input.mouse.y, DAILY_BTN.start);
    const hb = inRect(Input.mouse.x, Input.mouse.y, DAILY_BTN.back);
    panel(DAILY_BTN.start.x, DAILY_BTN.start.y, DAILY_BTN.start.w, DAILY_BTN.start.h,
      hs ? '#2a3320' : '#16211a', hs ? '#9fe08a' : '#2f4a38');
    ART.text(ctx, '出发（ENTER）', DAILY_BTN.start.x + 14, DAILY_BTN.start.y + 3, { color: hs ? '#d8ffcf' : '#9fd8a8' });
    panel(DAILY_BTN.back.x, DAILY_BTN.back.y, DAILY_BTN.back.w, DAILY_BTN.back.h,
      hb ? '#222b40' : '#12161f', hb ? '#ffd166' : '#2f3852');
    ART.text(ctx, '返回（ESC）', DAILY_BTN.back.x + 14, DAILY_BTN.back.y + 3, { color: hb ? '#ffe9a8' : '#cfd8ea' });
  }

  /* =========================================================
     成就提示
     ========================================================= */
  function drawToasts() {
    for (let i = 0; i < toasts.length; i++) {
      const t = toasts[i];
      const isLore = t.kind === 'lore';
      const a = isLore ? (STORY ? STORY.fragmentById(t.id) : null) : achById(t.id);
      if (!a) continue;
      const label = isLore ? '记忆碎片' : '成就达成';
      const icon = SPR.icons[isLore ? 'relic' : a.icon];
      const p = clamp(t.t / 0.4, 0, 1);
      const slide = (1 - G.easeOutCubic(clamp((t.life - t.t) / 0.35, 0, 1))) * 12;
      const w = 178, h = 34;
      const x = W - w - 8 + slide, y = 28 + i * 38;
      ctx.globalAlpha = Math.min(1, p);
      panel(x, y, w, h, '#1a2030', isLore ? '#9fe8ff' : '#ffd166', '#05070d');
      ctx.drawImage(icon, 0, 0, 12, 12, x + 6, y + 11, 12, 12);
      ART.text(ctx, label, x + 24, y + 2, { color: isLore ? '#9fe8ff' : '#ffd166' });
      ART.text(ctx, a.name, x + 24, y + 17, { color: '#e8eef8' });
      ctx.globalAlpha = 1;
    }
  }



  function drawLevelUp() {
    const isChest = state === 'CHEST';
    const isBoon = state === 'BOON';
    const isShrine = state === 'SHRINE';
    px(0, 0, W, H, isChest ? 'rgba(10,8,4,0.84)' : isBoon ? 'rgba(4,10,8,0.86)' : isShrine ? 'rgba(8,6,12,0.86)' : 'rgba(4,6,14,0.78)');
    const head = isChest ? '宝 箱 · 选 择 一 件 圣 物'
      : isBoon ? '灯 火 祝 福 · 选 择 一 项'
        : isShrine ? '祭 坛 · 选 择 一 项 祝 福'
          : '灯火共鸣 · 选择一项强化';
    ART.text(ctx, head, W / 2, 42,
      { color: isChest ? '#ffe9a8' : isBoon ? '#9fe8ff' : isShrine ? '#c9a0ff' : '#ffdca0', align: 'center', scale: 1, shadow: true, shadowColor: '#000' });

    const ease = G.easeOutCubic(Math.min(1, cardAnim * 4));
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      const ox = (1 - ease) * 20 * (i - 1);
      const x = Math.round(c.x + ox), y = Math.round(c.y + (1 - ease) * 14);
      const hover = Input.mouse.x > x && Input.mouse.x < x + c.w && Input.mouse.y > y && Input.mouse.y < y + c.h;
      if (hover && cardHover !== i) {
        cardHover = i;
        if (hoverTimer <= 0) { AUDIO.sfx('hover'); hoverTimer = 0.1; }
      }
      const isNew = c.kind === 'weapon' && c.lvl === 1;
      panel(x, y, c.w, c.h,
        hover ? '#222b40' : '#121722',
        hover ? '#ffd166' : '#39415c');
      if (hover) {
        px(x + 2, y + 2, c.w - 4, 2, 'rgba(255,209,102,0.35)');
      }

      // 图标
      const icon = cardIcon(c);
      ctx.save();
      ctx.translate(x + 8, y + 8);
      ctx.scale(2, 2);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(icon, 0, 0);
      ctx.restore();

      // 标题
      ART.text(ctx, cardTitle(c), x + 34, y + 8, { color: hover ? '#ffffff' : '#dfe7f5' });
      // 等级 / 标签
      const lv = cardLevel(c);
      if (c.kind === 'boon') {
        ART.text(ctx, '祝福', x + 34, y + 24, { color: '#c9a0ff' });
      } else if (c.kind === 'relic') {
        ART.text(ctx, '圣物', x + 34, y + 24, { color: '#9fe8ff' });
      } else if (c.kind === 'evo') {
        ART.text(ctx, '进化', x + 34, y + 24, { color: '#ffcf6e' });
      } else if (c.kind === 'heal') {
        ART.text(ctx, '回复', x + 34, y + 24, { color: '#6fd68a' });
      } else {
        const mx = cardMax(c);
        let pips = '';
        for (let k = 0; k < mx; k++) pips += k < lv ? '◆' : '◇';
        ART.text(ctx, pips, x + 34, y + 24, { color: '#ffd166' });
      }
      if (isNew) ART.text(ctx, '新', x + c.w - 16, y + 7, { color: '#7fe0ff' });

      // 描述
      const lines = wrapText(cardInfo(c), c.w - 16);
      for (let k = 0; k < lines.length && k < 4; k++) {
        ART.text(ctx, lines[k], x + 8, y + 44 + k * 14, { color: '#98a3bd' });
      }

      // 快捷键
      ART.text(ctx, String(i + 1), x + c.w - 10, y + c.h - 15, { color: '#5b6480', align: 'right' });
    }
    ART.text(ctx, isChest ? '点击卡片 / 按 1 2 3 收下' : '点击卡片 / 按 1 2 3 选择', W / 2, 184, { color: '#66708c', align: 'center' });
    if (isBoon) ART.text(ctx, boonIsFloor ? ('第 ' + (floorIdx + 2) + ' 层在前方') : '下一关在前方', W / 2, 24, { color: '#5f7f9a', align: 'center' });
  }

  function wrapText(str, maxW) {
    const out = [];
    const paragraphs = String(str).split('\n');
    for (const para of paragraphs) {
      let cur = '';
      for (let i = 0; i < para.length; i++) {
        const ch = para[i];
        const test = cur + ch;
        if (ART.textWidth(test) > maxW && cur.length) {
          out.push(cur);
          cur = ch;
        } else {
          cur = test;
        }
      }
      if (cur) out.push(cur);
    }
    return out;
  }

  function saveRun() {
    if (!save || !P || !runActive) return;
    save.run = {
      charId: P.charId, seed: runSeed, floor: floorIdx, level: levelIdx,
      mode: runMode, tier: endlessTier || 0,
      daily: runDaily ? { seed: runDaily.seed, key: runDaily.key, mods: runDaily.mods } : null,
      time: Math.round(runTime), kills: kills,
      hp: Math.round(P.hp), maxHp: Math.round(P.maxHp),
      level: P.level, xp: P.xp, xpNeed: P.xpNeed,
      weapons: P.weapons.map(function (w) { return { id: w.id, lvl: w.lvl }; }),
      passives: Object.assign({}, P.passives),
      relics: P.relics.slice(), relicLvl: P.relicLvl || 1, relicStore: (P.relicStore || []).slice(),
      evolved: Object.assign({}, P.evolved),
    };
    G.Store.save();
  }

  function clearRunSnapshot() {
    if (save && save.run) { save.run = null; G.Store.save(); }
  }

  function resumeRun() {
    if (!save || !save.run) return false;
    const r = JSON.parse(JSON.stringify(save.run));
    runActive = true;
    startRun(r.charId, { daily: r.daily || null, endless: r.mode === 'endless' });
    runSeed = r.seed;
    WORLD.reset(runSeed);
    P.maxHp = r.maxHp;
    P.level = r.level; P.xp = r.xp; P.xpNeed = r.xpNeed;
    P.weapons = (r.weapons || []).map(function (w) { return { id: w.id, lvl: w.lvl, t: 0, ang: 0 }; });
    P.passives = Object.assign({}, r.passives || {});
    P.relics = (r.relics || []).slice().slice(0, 1);
    P.relicLvl = r.relicLvl || 1;
    P.relicStore = (r.relicStore || []).slice();
    P.evolved = Object.assign({}, r.evolved || {});
    endlessTier = r.tier || 0;
    runTime = r.time || 0; kills = r.kills || 0;
    recalc();
    P.hp = clamp(r.hp, 1, P.maxHp);
    loadLevel(r.floor || 0, r.level || 0);
    state = 'PLAY';
    AUDIO.sfx('click');
    AUDIO.startMusic('battle');
    AUDIO.setMood('battle');
    AUDIO.setTempo(112);
    biteBanner('继 续 旅 程');
    return true;
  }

  function pauseAct(i) {
    AUDIO.sfx('click');
    if (i === 0) { state = 'PLAY'; return; }
    if (i === 1) {
      saveRun();
      state = 'TITLE';
      AUDIO.setMood('title');
      AUDIO.startMusic('title');
      titleHint = '进度已保存 · 空格继续旅程';
      titleHintT = 1.8;
      return;
    }
    clearRunSnapshot();
    runActive = true;
    startRun(chosenChar);
    state = 'PLAY';
  }

  function finishRhythm() {
    rhythmDone = true;
    const res = RHYTHM.result();
    state = 'PLAY';
    if (res.ratio >= 0.95) {
      whiteFlash = 1;
      shake = 10;
      biteBanner('PERFECT ' + Math.round(res.ratio * 100) + '% · 层 主 溃 散');
      if (boss && !boss.dead) killBoss();
    } else {
      P.hp = Math.max(1, Math.round(P.maxHp * 0.3));
      redFlash = 0.9;
      shake = 8;
      biteBanner('节 拍 走 样 · 扣 除 70% 生 命');
      if (boss) { boss.intro = 0.6; boss.t1 = 1.6; boss.t2 = 2.2; boss.t3 = 2.6; }
    }
    AUDIO.sfx('win');
  }

  function drawLoading() {
    const cx = W / 2, cy = 80;
    glowAt(cx, cy + 28, 74, 'rgba(255,190,100,0.10)', 1);
    ART.text(ctx, '提 灯 者', W / 2, 22, { color: '#ffc36b', scale: 3, align: 'center', shadow: true, shadowColor: '#28160a', shadowOff: 3 });
    ART.text(ctx, 'L A M P L I T', W / 2, 68, { color: '#5d6b88', align: 'center' });

    const lx = cx - 9, ly = cy + 28;
    px(lx + 4, ly - 12, 10, 2, '#8a6a3a');
    px(lx + 6, ly - 15, 6, 3, '#c9a15a');
    px(lx, ly, 18, 20, '#2a2016');
    px(lx + 2, ly + 2, 14, 16, '#3a2c1c');
    const prog = clamp((loadStep + (loadStep < 3 ? loadT / 0.16 : 0)) / 4, 0, 1);
    const fh = Math.round(16 * (0.3 + prog * 0.7));
    px(lx + 4, ly + 18 - fh, 10, fh, 'rgba(255,190,90,0.72)');
    px(lx + 6, ly + 18 - fh, 6, Math.max(3, fh - 3), '#fff0c0');
    px(lx - 2, ly + 20, 22, 2, '#5a4630');
    glowAt(cx, ly + 10, 24 + prog * 20, 'rgba(255,200,110,0.32)', 1);

    const bw = 140, bx = (W - bw) / 2, by = H - 44;
    px(bx - 1, by - 1, bw + 2, 6, '#1a1410');
    px(bx, by, Math.max(1, bw * prog), 4, '#ffc36b');
    px(bx, by, Math.max(1, bw * prog), 1, '#fff0c0');
    const labels = ['准备灯笼', '锻打像素', '读取记忆', '点亮长夜'];
    const label = labels[Math.min(3, Math.max(0, loadStep - 1))];
    ART.text(ctx, label + ' …', W / 2, by + 12, { color: '#6f7d9a', align: 'center' });
  }

  function drawCine() {
    if (!cine) return;
    const t = cine.t, dur = cine.dur;
    const k = Math.min(clamp(t / 0.32, 0, 1), clamp((dur - t) / 0.32, 0, 1));
    const bh = Math.round(22 * k);
    if (bh > 0) {
      px(0, 0, W, bh, '#05070c');
      px(0, H - bh, W, bh, '#05070c');
      px(0, bh, W, 1, 'rgba(255,195,107,0.25)');
      px(0, H - bh - 1, W, 1, 'rgba(255,195,107,0.25)');
    }
    if (cine.kind === 'boss') {
      const a = clamp((t - 0.3) / 0.45, 0, 1);
      const slide = Math.round((1 - a) * 26);
      ctx.globalAlpha = a;
      ART.text(ctx, cine.name, W / 2, 74 - slide, {
        color: '#ffd0dc', align: 'center', scale: 2, shadow: true, shadowColor: '#3a0c18', shadowOff: 2,
      });
      ART.text(ctx, cine.sub, W / 2, 100 - slide, { color: '#8b93ad', align: 'center', shadow: true, shadowColor: '#000' });
      ctx.globalAlpha = 1;
    }
  }

  function drawPause() {
    px(0, 0, W, H, 'rgba(4,6,14,0.74)');
    ART.text(ctx, '暂 停', W / 2, 38, { color: '#ffdca0', align: 'center', scale: 3, shadow: true, shadowColor: '#000' });
    ART.text(ctx, '第 ' + (floorIdx + 1) + ' 层 · ' + (themeInfo ? themeInfo.name : '') + ' · ' + (levelIdx + 1) + ' / ' + D.ROOMS,
      W / 2, 90, { color: '#6f7d9a', align: 'center', shadow: true, shadowColor: '#000' });
    const labels = ['继 续', '保存并返回主菜单', '重开本局'];
    for (let i = 0; i < 3; i++) {
      const b = PAUSE_BTN[i];
      const hov = inRect(Input.mouse.x, Input.mouse.y, b);
      if (hov && pauseSel !== i) { pauseSel = i; AUDIO.sfx('hover'); }
      const sel = pauseSel === i;
      panel(b.x, b.y, b.w, b.h, sel ? '#1c2436' : '#10141d', sel ? '#ffc36b' : '#2a3350', '#05070d');
      ART.text(ctx, labels[i], W / 2, b.y + 5, { color: sel ? '#ffe9a8' : '#9aa6c0', align: 'center' });
      ART.text(ctx, String(i + 1), b.x + 7, b.y + 5, { color: sel ? '#ffc36b' : '#4a5264' });
    }
    ART.text(ctx, 'ESC 继续', W / 2, 182, { color: '#5c6884', align: 'center' });
  }

  function drawEnd(won) {
    px(0, 0, W, H, won ? 'rgba(22,16,6,0.94)' : 'rgba(16,3,8,0.95)');
    if (!endInfo) return;
    const title = won ? '长 夜 已 明' : '灯 火 熄 灭';
    ART.text(ctx, title, W / 2, 12, {
      color: won ? '#ffe9a8' : '#ff8f9f', align: 'center', scale: 2,
      shadow: true, shadowColor: '#000', shadowOff: 3,
    });
    const mm = Math.floor(endInfo.time / 60).toString().padStart(2, '0');
    const ss = Math.floor(endInfo.time % 60).toString().padStart(2, '0');
    const lines = [
      '抵达　　　第 ' + (endInfo.floor || 1) + ' 层 · ' + (endInfo.room || 1) + ' 关',
      '生存时间　' + mm + ':' + ss,
      '等　级　　' + endInfo.level,
      '击　杀　　' + endInfo.kills,
      '总伤害　　' + Math.round(endInfo.dmg),
    ];
    if (endInfo.daily) {
      lines.push('挑战得分　' + endInfo.daily.score + '　' + (endInfo.daily.isBest ? '新纪录！' : '最高 ' + endInfo.daily.best));
    }
    let y = 48;
    for (let i = 0; i < lines.length; i++) {
      ART.text(ctx, lines[i], W / 2, y, { color: '#cfd8ea', align: 'center' });
      y += 15;
    }
    y += 2;
    if (endInfo.unlocked) {
      const nm = CHARS[endInfo.unlocked].name;
      ART.text(ctx, '解锁新角色：' + nm, W / 2, y, { color: '#ffd166', align: 'center' });
      y += 14;
    }
    if (endInfo.ach && endInfo.ach.length) {
      for (let i = 0; i < endInfo.ach.length && i < 2; i++) {
        const a = achById(endInfo.ach[i]);
        if (!a) continue;
        ART.text(ctx, '★ ' + a.name, W / 2, y, { color: '#9fe8ff', align: 'center' });
        y += 13;
      }
    }
    if (endInfo.ending && STORY && y < H - 62) {
      const ep = STORY.ending[endInfo.ending] || [];
      if (ep[0]) ART.text(ctx, ep[0], W / 2, y + 2, {
        color: endInfo.ending === 'true' ? '#ffd166' : '#7f8bab', align: 'center',
      });
    }
    const hints = [];
    if (state === 'WIN' && endInfo.mode === 'standard') hints.push('E 无尽深潜');
    hints.push('R 再来一次');
    if (endInfo.ending) hints.push('F 结局');
    hints.push('ESC 标题');
    ART.text(ctx, hints.join('　·　'), W / 2, H - 18, { color: '#8b93ad', align: 'center' });
  }

  /* =========================================================
     输入 / 状态切换
     ========================================================= */
  function cardAt(x, y) {
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      if (x > c.x && x < c.x + c.w && y > c.y && y < c.y + c.h) return i;
    }
    return -1;
  }

  function handleInput() {
    if (state === 'RHYTHM') return;
    if (Input.hit('m')) {
      const on = AUDIO.toggleMusic();
      biteBanner(on ? '音乐 开' : '音乐 关');
    }
    if (Input.hit('n')) {
      const on = AUDIO.toggleSfx();
      biteBanner(on ? '音效 开' : '音效 关');
    }

    if (state === 'STORY') {
      const v = storyView;
      if (!v) { state = 'TITLE'; return; }
      if (Input.hit('escape')) { finishStory(); return; }
      if (Input.hit(' ') || Input.hit('enter') || Input.mouse.clicked) {
        const page = v.pages[v.idx];
        const total = pageChars(page);
        if (v.t * 26 < total) {
          v.t = total / 26 + 0.05;
        } else if (v.idx < v.pages.length - 1) {
          v.idx++;
          v.t = 0;
          AUDIO.sfx('hover');
        } else {
          finishStory();
        }
      }
      return;
    }

    if (state === 'TITLE') {
      if (Input.hit('a', 'arrowleft', 'w', 'arrowup')) { menuIndex = (menuIndex + 2) % 3; AUDIO.sfx('hover'); }
      if (Input.hit('d', 'arrowright', 's', 'arrowdown')) { menuIndex = (menuIndex + 1) % 3; AUDIO.sfx('hover'); }
      const snap2 = save.run && save.run.seed ? save.run : null;
      if (snap2 && Input.hit('n')) {
        clearRunSnapshot();
        titleHint = '已放弃上次进度，从第一层开始';
        titleHintT = 1.6;
        AUDIO.sfx('click');
        return;
      }
      if (snap2 && (Input.hit(' ') || Input.hit('enter'))) { resumeRun(); return; }
      if (snap2 && Input.mouse.clicked && inRect(Input.mouse.x, Input.mouse.y, TITLE_BTN.cont)) { resumeRun(); return; }
      if (Input.hit('t')) { openDaily(); return; }
      if (Input.hit('c')) { state = 'CODEX'; codexTab = 0; codexSel = 0; AUDIO.sfx('click'); return; }
      if (Input.hit('s')) { state = 'CODEX'; codexTab = 4; codexSel = 0; AUDIO.sfx('click'); return; }
      const ids = ['lamp', 'grave', 'ranger'];
      if (Input.mouse.clicked) {
        if (inRect(Input.mouse.x, Input.mouse.y, TITLE_BTN.daily)) { openDaily(); return; }
        if (inRect(Input.mouse.x, Input.mouse.y, TITLE_BTN.codex)) {
          state = 'CODEX'; codexTab = 0; codexSel = 0; AUDIO.sfx('click'); return;
        }
        if (inRect(Input.mouse.x, Input.mouse.y, TITLE_BTN.story)) {
          state = 'CODEX'; codexTab = 4; codexSel = 0; AUDIO.sfx('click'); return;
        }
        let clicked = -1;
        for (let i = 0; i < 3; i++) {
          const cr = { x: TITLE_CARD.x, y: TITLE_CARD.y + i * TITLE_CARD.gap, w: TITLE_CARD.w, h: TITLE_CARD.h };
          if (inRect(Input.mouse.x, Input.mouse.y, cr)) clicked = i;
        }
        if (clicked >= 0) {
          menuIndex = clicked;
          const c = CHARS[ids[clicked]];
          if (c.unlock && !save.unlocked.includes(c.id)) {
            titleHint = c.unlock === 'win' ? '通关一次后解锁此角色' : '击败第一位层主后解锁此角色';
            titleHintT = 1.8;
            AUDIO.sfx('hurt');
            return;
          }
        }
      }
      const selId = ids[menuIndex];
      const canStart = !CHARS[selId].unlock || save.unlocked.includes(selId);
      if (Input.hit(' ') || Input.hit('enter') || Input.mouse.clicked) {
        if (!canStart) {
          titleHint = '请选择一位已解锁的角色';
          titleHintT = 1.4;
          AUDIO.sfx('hurt');
          return;
        }
        clearRunSnapshot();
        runActive = true;
        startRun(selId);
        state = 'PLAY';
        AUDIO.sfx('click');
        AUDIO.startMusic('battle');
        AUDIO.setTempo(112);
        biteBanner('夜幕降临');
      }
      return;
    }

    if (state === 'CODEX') {
      if (Input.hit('escape') || Input.hit('c')) { state = 'TITLE'; AUDIO.sfx('click'); return; }
      const tabs = 5;
      if (Input.hit('q') || Input.hit('arrowup')) {
        codexTab = (codexTab + tabs - 1) % tabs; codexSel = 0; AUDIO.sfx('hover');
      }
      if (Input.hit('e') || Input.hit('arrowdown')) {
        codexTab = (codexTab + 1) % tabs; codexSel = 0; AUDIO.sfx('hover');
      }
      const entries = codexEntries();
      const cols = codexTab === 3 ? 2 : 4;
      if (Input.hit('a', 'arrowleft')) { codexSel = (codexSel + entries.length - 1) % entries.length; AUDIO.sfx('hover'); }
      if (Input.hit('d', 'arrowright')) { codexSel = (codexSel + 1) % entries.length; AUDIO.sfx('hover'); }
      if (Input.hit('w')) { codexSel = (codexSel + entries.length - cols) % entries.length; AUDIO.sfx('hover'); }
      if (Input.hit('s')) { codexSel = (codexSel + cols) % entries.length; AUDIO.sfx('hover'); }
      // 点击页签
      if (Input.mouse.clicked && Input.mouse.y < 44) {
        let tx = 12;
        for (let i = 0; i < tabs; i++) {
          const label = ['敌人', '武器', '被动', '成就'][i];
          const w = ART.textWidth(label) + 20;
          if (Input.mouse.x > tx - 4 && Input.mouse.x < tx + w) {
            codexTab = i; codexSel = 0; AUDIO.sfx('click'); break;
          }
          tx += w + 22;
        }
      }
      return;
    }

    if (state === 'DAILY') {
      if (Input.hit('escape')) { state = 'TITLE'; AUDIO.sfx('click'); return; }
      const startIt = Input.hit('enter') || Input.hit(' ') ||
        (Input.mouse.clicked && inRect(Input.mouse.x, Input.mouse.y, DAILY_BTN.start));
      const backIt = Input.mouse.clicked && inRect(Input.mouse.x, Input.mouse.y, DAILY_BTN.back);
      if (backIt) { state = 'TITLE'; AUDIO.sfx('click'); return; }
      if (startIt) {
        const cfg = dailyPreview || META.dailyConfig();
        startRun(cfg.char, { daily: cfg });
        state = 'PLAY';
        AUDIO.sfx('click');
        AUDIO.startMusic('battle');
        AUDIO.setTempo(112);
        biteBanner('每日挑战 · ' + cfg.key);
      }
      return;
    }

    if (state === 'PLAY') {
      if (cine && (Input.hit(' ') || Input.hit('enter'))) {
        cine = null;
        if (boss && boss.intro > 0) boss.intro = 0;
        AUDIO.sfx('click');
        return;
      }
      if (Input.hit('escape') || Input.btn.pause) { state = 'PAUSE'; AUDIO.sfx('click'); }
      return;
    }

    if (state === 'PAUSE') {
      if (Input.hit('escape')) { state = 'PLAY'; AUDIO.sfx('click'); return; }
      if (Input.hit('w') || Input.hit('arrowup')) { pauseSel = (pauseSel + 2) % 3; AUDIO.sfx('hover'); return; }
      if (Input.hit('s') || Input.hit('arrowdown')) { pauseSel = (pauseSel + 1) % 3; AUDIO.sfx('hover'); return; }
      for (let i = 0; i < 3; i++) {
        if (Input.hit(String(i + 1))) { pauseAct(i); return; }
        if (Input.mouse.clicked && inRect(Input.mouse.x, Input.mouse.y, PAUSE_BTN[i])) {
          pauseSel = i; pauseAct(i); return;
        }
      }
      if (Input.hit('r')) { pauseAct(2); return; }
      return;
    }

    if (state === 'CHEST' || state === 'SHRINE' || state === 'BOON') {
      const isFloor = state === 'BOON' ? boonIsFloor : false;
      for (let i = 0; i < cards.length; i++) {
        if (Input.hit(String(i + 1))) { takeRoomCard(i, isFloor); return; }
      }
      const idx = cardAt(Input.mouse.x, Input.mouse.y);
      if (Input.mouse.clicked && idx >= 0) { takeRoomCard(idx, isFloor); return; }
      return;
    }

    if (state === 'LEVELUP') {
      for (let i = 0; i < cards.length; i++) {
        if (Input.hit(String(i + 1))) { applyCard(cards[i]); return; }
      }
      const idx = cardAt(Input.mouse.x, Input.mouse.y);
      if (Input.mouse.clicked && idx >= 0) { applyCard(cards[idx]); return; }
      return;
    }

    if (state === 'DEAD' || state === 'WIN') {
      if (Input.hit('escape')) { state = 'TITLE'; AUDIO.sfx('click'); return; }
      if (Input.hit('f') && endInfo && endInfo.ending) {
        openStory([{ title: endInfo.ending === 'true' ? '真 · 结 局' : endInfo.ending === 'win' ? '结 局' : '熄 灭', lines: STORY.ending[endInfo.ending] }], () => {
          state = endInfo.won ? 'WIN' : 'DEAD';
        });
        return;
      }
      if (Input.hit('e') && state === 'WIN' && endInfo && endInfo.mode === 'standard') {
        startEndless();
        return;
      }
      if (Input.hit('r') || Input.hit(' ') || Input.hit('enter') || Input.mouse.clicked) {
        startRun(chosenChar);
        state = 'PLAY';
        AUDIO.startMusic('battle');
        AUDIO.setTempo(112);
      }
    }
  }

  /* =========================================================
     主循环
     ========================================================= */
  let last = 0;
  let acc = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    fpsSmooth = fpsSmooth * 0.95 + (1 / Math.max(dt, 0.001)) * 0.05;

    if (state !== 'BOOT') {
      handleInput();

      if (state === 'LOADING' || state === 'RHYTHM' || state === 'PLAY' || state === 'TITLE' || state === 'DEAD' || state === 'WIN' || state === 'STORY' || state === 'CODEX' || state === 'DAILY') {
        acc += dt;
        let steps = 0;
        while (acc >= 1 / 60 && steps < 4) {
          update(1 / 60);
          acc -= 1 / 60;
          steps++;
        }
        if (steps === 3) acc = 0;
      } else if (state === 'LEVELUP' || state === 'CHEST' || state === 'BOON' || state === 'SHRINE') {
        cardAnim += dt;
      } else if (state === 'PAUSE') {
        T += dt;
      }
      hoverTimer = Math.max(0, hoverTimer - dt);
      if (state !== 'LEVELUP' && state !== 'CHEST') cardHover = -1;

      render();
    }

    Input.endFrame();
  }

  /* =========================================================
     启动
     ========================================================= */
  function boot() {
    window.addEventListener('resize', resize);
    window.addEventListener('blur', () => {
      if (state === 'PLAY') { state = 'PAUSE'; }
    });
    resize();
    Input.init(canvas);
    // ?reset=1 清空本机存档（打包版首次启动会自动带上）
    if (/[?&]reset=1/.test(location.search)) G.Store.clear();
    save = G.Store.load();
    META.ensure(save);
    WORLD.init();
    state = 'LOADING';
    loadStep = 0; loadT = 0;
    ART.loadFont().catch(() => {});
    // 首次交互后启动音频
    const kick = () => {
      if (AUDIO.init()) {
        AUDIO.startMusic('title');
        AUDIO.setTempo(84);
      }
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('keydown', kick);
    };
    window.addEventListener('pointerdown', kick);
    window.addEventListener('keydown', kick);
    requestAnimationFrame(frame);
  }

  function runLoadStep(step) {
    if (step === 1) {
      SPR = ART.build();
    } else if (step === 2) {
      STORY.ensure(save);
      META.ensure(save);
    } else if (step === 3) {
      startRun('lamp', { demo: true });
    } else if (step === 4) {
      const bootEl = document.getElementById('boot');
      if (bootEl) bootEl.classList.add('hide');
      state = 'TITLE';
      const skipIntro = /[?&]skipintro=1/.test(location.search);
      if (!save.lore.prologue && !skipIntro) {
        openStory(STORY.prologue.map((p2) => ({ title: p2.title, lines: p2.lines })), () => {
          save.lore.prologue = true;
          G.Store.save();
          state = 'TITLE';
        });
      }
    }
  }

  boot();

  // 暴露给自动化测试
  window.LAMPLIT = {
    get state() { return state; },
    get runTime() { return runTime; },
    get player() { return P; },
    get enemies() { return enemies; },
    get pickups() { return pickups; },
    get hazards() { return hazards; },
    get boss() { return boss; },
    get kills() { return kills; },
    setState(s) { state = s; },
    startRun, update, render,
    forceBoss(which) { spawnBoss(which); },
    setTime(t) { runTime = t; },
    hurtBoss(n) { hitBoss(n); },
    hurtPlayer(n) { damagePlayer(n, P.x + 8, P.y); },
    spawnAt(type, x, y, elite) { return spawnEnemy(type, x, y, !!elite); },
    summonTest(n) { if (boss) bossAdds(boss, n); },
    lanternPos,
    setGlow(v) { glowScale = v; },
    applyCard,
    get cards() { return cards; },
    // 元系统调试/测试
    get mode() { return runMode; },
    get daily() { return runDaily; },
    get save() { return save; },
    resumeRun, saveRun, clearRunSnapshot, pauseAct,
    get cine() { return cine; },
    get roomScale() { return roomScale; },
    poolFor(f, l) { return pickPool(f, l).map(function (x) { return { id: x[0], w: x[1] }; }); },
    get doorLockedNow() { return doorLocked; },
    xpNeedFor(l) { return xpNeed(l); },
    bossRoster: BOSS_DEFS.map(function (d) { return { name: d.name, style: d.style, acts: d.acts.slice() }; }),
    spawnBossIndex(i) { spawnBoss(i | 0); return boss; },
    get lastBossDef() { return lastBossDef; },
    mem() {
      const c = ART.cacheSizes ? ART.cacheSizes() : {};
      return { particles: particles.length, effects: effects.length, texts: texts.length,
        hazards: hazards.length, bullets: bullets.length, pickups: pickups.length,
        enemies: enemies.length, toasts: toasts.length,
        glow: glowCache.size, textCache: c.text || 0, tint: c.tint || 0 };
    },
    get pauseSel() { return pauseSel; },
    get toasts() { return toasts; },
    get codexTab() { return codexTab; },
    set codexTab(v) { codexTab = v; },
    get codexSel() { return codexSel; },
    set codexSel(v) { codexSel = v; },
    openCodex(tab) { state = 'CODEX'; codexTab = tab || 0; codexSel = 0; },
    openDaily,
    startDaily() {
      const cfg = META.dailyConfig();
      startRun(cfg.char, { daily: cfg });
      state = 'PLAY';
      return cfg;
    },
    meta: META,
    story: STORY,
    openStory, startEndless, finishStory,
    castSkill,
    get storyView() { return storyView; },
    get chest() { return chest; },
    get room() { return room; },
    get floorIdx() { return floorIdx; },
    get roomIdx() { return levelIdx; },
    get levelIdx() { return levelIdx; },
    get level() { return level; },
    get roomCleared() { return roomCleared; },
    gotoRoom(f, r) { loadLevel(f, r); return room; }, gotoLevel(f, r) { loadLevel(f, r); return level; },
    takeRoomCard,
    clearEnemies() {
      for (let i = 0; i < enemies.length; i++) if (!enemies[i].dead) killEnemy(enemies[i], {});
      if (boss && !boss.dead) killBoss();
      return roomAlive();
    },
    roomAlive,
    spawnChest() {
      if (!room) return null;
      const c = { x: P.x + 26, y: P.y, t: 0, open: false };
      chestObjs.push(c);
      return c;
    },
    get chest() { return chestObjs[0] || null; },
    giveRelic(id, lvl) { equipRelic(id, lvl || 1); },
    get relics() { return P.relics; },
    get skill() { return P.skill; },
    get endless() { return endless; },
    get quote() { return storyQuote; },
    evolve(id) { applyCard({ kind: 'evo', id, lvl: 1 }); },
    achCount() { return META.achCount(save); },
    codexProgress() { return META.codexProgress(save); },
    get dailyPreview() { return dailyPreview; },
    toast(id) { pushToast('achievement', id); },
  };
})();
