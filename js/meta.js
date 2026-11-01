/* =========================================================
   提灯者 LAMPLIT — 元系统
   图鉴数据 / 成就判定 / 每日挑战配置
   ========================================================= */
(function () {
  'use strict';
  const G = window.G;
  const META = (window.META = {});

  /* ---------------------------------------------------------
     存档结构
     --------------------------------------------------------- */
  META.ensure = function (save) {
    if (!save) return save;
    if (!save.codex) save.codex = {};
    if (!save.codex.enemies) save.codex.enemies = [];
    if (!save.codex.weapons) save.codex.weapons = [];
    if (!save.codex.passives) save.codex.passives = [];
    if (!save.ach) save.ach = {};
    if (!save.totals) save.totals = { kills: 0, runs: 0, dmg: 0, xp: 0, wins: 0 };
    if (!save.daily) save.daily = { best: {}, cleared: [] };
    if (!save.chars) save.chars = {};
    return save;
  };

  META.unlock = function (save, kind, id) {
    const arr = save.codex[kind];
    if (arr.indexOf(id) < 0) {
      arr.push(id);
      return true;
    }
    return false;
  };
  META.isUnlocked = function (save, kind, id) {
    return save.codex[kind].indexOf(id) >= 0;
  };

  /* ---------------------------------------------------------
     图鉴文本
     --------------------------------------------------------- */
  META.ENEMIES = {
    crawler: {
      name: '蠕行者', hp: 10, spd: 56, dmg: 6, xp: 2,
      lore: '从地缝里钻出来的食腐虫。闻到灯光就一拥而上。',
      tip: '成群出现，贴脸伤害不高，但会用数量把你围死。',
      color: '#8fbf4a',
    },
    bat: {
      name: '暮蝠', hp: 8, spd: 78, dmg: 5, xp: 2,
      lore: '在灯光的边缘盘旋，等你转身。',
      tip: '速度最快，会绕着你画圈，别在直线逃跑时被截住。',
      color: '#9a5f86',
    },
    wisp: {
      name: '鬼火', hp: 16, spd: 44, dmg: 7, xp: 3,
      lore: '熄灭的灯留下的余烬，还会本能地追光。',
      tip: '慢，但会飘忽地贴上来；同一片区域常常成对出现。',
      color: '#ffd88a',
    },
    spitter: {
      name: '腐唾者', hp: 22, spd: 34, dmg: 7, xp: 4,
      lore: '腹腔里积满腐蚀液，隔着很远就把烂泥喷过来。',
      tip: '会保持距离射击，优先绕到它侧后方拆掉。',
      color: '#c76fa8',
    },
    ghost: {
      name: '残念', hp: 20, spd: 52, dmg: 8, xp: 4,
      lore: '没能走出这片墓地的人。它们半透明地飘着，忽明忽暗。',
      tip: '移动时实体时虚，贴身时会短暂变实——趁虚时穿过。',
      color: '#9cbde0',
    },
    brute: {
      name: '磐尸', hp: 75, spd: 27, dmg: 14, xp: 8,
      lore: '被墓土和碎石压成一体的庞然大物，胸膛里还亮着一点火。',
      tip: '血厚、击退抗性高，别硬顶；把它拖进地形再绕。',
      color: '#8b8fa6',
    },
    boss1: {
      name: '灯笼吞噬者', hp: 760, spd: 26, dmg: 15, xp: 0,
      lore: '它吞下了太多提灯，于是自己也变成了一盏。眼眶里烧着别人的火。',
      tip: '会环形弹幕、召唤虫群、直线冲锋。冲锋前它会短暂停顿。',
      color: '#93354e', boss: true,
    },
    boss2: {
      name: '深黯之母', hp: 1500, spd: 30, dmg: 18, xp: 0,
      lore: '长夜里所有黑暗的源头。它不追光，它等光自己熄灭。',
      tip: '螺旋弹幕连绵不绝，第二阶段贴脸极度危险，保持中远距离。',
      color: '#6f3492', boss: true,
    },
  };

  META.WEAPONS = {
    bolt: { lore: '用灯芯点燃的星火，射程最远的起手武器。', tip: '自动锁定最近的敌人，适合先手消耗。' },
    orbit: { lore: '不知从哪座墓里捡来的银月刃，会替你绕圈。', tip: '贴身清场核心，配合冲刺可以持续贴脸输出。' },
    nova: { lore: '把灯光压成一圈涟漪推出去。', tip: '清群与推开虫潮，冷却偏长但覆盖整圈。' },
    spark: { lore: '灯焰互相追逐时迸出的电弧。', tip: '连锁越多收益越高，敌人密集时是最高效的武器。' },
    ember: { lore: '放出去的萤火，会自己找到目标然后炸开。', tip: '自动追踪，适合边跑边打；爆裂能顺带清掉小怪。' },
    crescent: { lore: '守墓人的旧镰，挥出的弧光比刀身更长。', tip: '只打面向的一侧，走位时记得让敌人落在你的正前方。' },
  };

  META.PASSIVES = {
    blade: { lore: '磨利的刀锋，让每一次命中都更深。' },
    swift: { lore: '夜色里跑得快一点，总能多活一会儿。' },
    rhythm: { lore: '呼吸和灯焰同步的时候，攻击会变快。' },
    magnet: { lore: '灯芯吸引魂火，就像火吸引飞蛾。' },
    vitality: { lore: '多留一点血，才有机会看到黎明。' },
    wick: { lore: '换一根更长的灯芯，光就照得更远。' },
    armor: { lore: '披上墓里挖出来的旧甲，钝一点，但真能挡。' },
    crit: { lore: '找到黑暗里最薄的那一点，然后刺进去。' },
    regen: { lore: '灯油缓慢地渗回灯芯，伤口也在慢慢合。' },
    greed: { lore: '魂火不嫌多。它们本身就是燃料。' },
  };

  META.ACHIEVEMENTS = [
    { id: 'first_light', name: '点亮第一盏灯', desc: '完成任意一局游戏', icon: 'light' },
    { id: 'kill_100', name: '百人斩', desc: '单局击杀 100 个敌人', icon: 'damage' },
    { id: 'kill_500', name: '五百人斩', desc: '单局击杀 500 个敌人', icon: 'crit' },
    { id: 'survive_230', name: '第一夜', desc: '击败第一位层主', icon: 'rate' },
    { id: 'boss_slayer', name: '长夜已明', desc: '穿过四层长夜，击败全部层主', icon: 'light' },
    { id: 'four_arms', name: '全副武装', desc: '同时持有 4 种武器', icon: 'spark' },
    { id: 'max_weapon', name: '炉火纯青', desc: '把任意武器升到 5 级', icon: 'ember' },
    { id: 'three_faces', name: '三生万物', desc: '三位角色各完成一局', icon: 'regen' },
    { id: 'untouched_60', name: '不动如山', desc: '单局连续 60 秒没有受伤', icon: 'armor' },
    { id: 'xp_300', name: '拾光者', desc: '单局拾取 300 份魂火', icon: 'pickup' },
    { id: 'daily_done', name: '今日之星', desc: '完成一次每日挑战', icon: 'greed' },
    { id: 'total_1000', name: '千魂', desc: '累计击杀 1000 个敌人', icon: 'crescent' },
    { id: 'early_boss', name: '抢在黎明之前', desc: '在 03:00 前击败第一位看守者', icon: 'rate' },
  ];

  /* 判定：ctx 由 game.js 在关键时刻填充 */
  META.evaluate = function (save, ctx) {
    META.ensure(save);
    const got = [];
    const give = (id) => {
      if (save.ach[id]) return;
      save.ach[id] = Date.now();
      got.push(id);
    };
    const c = ctx || {};

    if (c.runFinished) give('first_light');
    if (c.kills >= 100) give('kill_100');
    if (c.kills >= 500) give('kill_500');
    if (c.runTime >= 150) give('survive_230');
    if (c.won) give('boss_slayer');
    if (c.weapons && c.weapons.length >= 4) give('four_arms');
    if (c.weapons && c.weapons.some((w) => w.lvl >= 5)) give('max_weapon');
    if (c.unhurt >= 60) give('untouched_60');
    if (c.xpCollected >= 300) give('xp_300');
    if (c.dailyFinished) give('daily_done');
    if (c.boss1KillTime !== undefined && c.boss1KillTime !== null && c.boss1KillTime <= 180) give('early_boss');
    if (c.charPlayed) {
      save.chars[c.charPlayed] = (save.chars[c.charPlayed] || 0) + 1;
      if (save.chars.lamp && save.chars.grave && save.chars.ranger) give('three_faces');
    }
    if (save.totals.kills >= 1000) give('total_1000');

    if (got.length) G.Store.save();
    return got;
  };

  /* ---------------------------------------------------------
     每日挑战
     --------------------------------------------------------- */
  const MODS = [
    { id: 'swarm', name: '虫潮', desc: '敌人出现速度 +40%' },
    { id: 'swift', name: '疾走', desc: '敌人移动速度 +18%' },
    { id: 'frail', name: '脆纸灯罩', desc: '生命上限 -25%' },
    { id: 'dim', name: '微弱灯火', desc: '灯光半径 -18%' },
    { id: 'rich', name: '魂火丰饶', desc: '魂火经验 +30%' },
    { id: 'elite', name: '精英横行', desc: '精英出现率 ×2.5' },
    { id: 'tough', name: '厚皮', desc: '敌人生命 +25%' },
    { id: 'sharp', name: '利爪', desc: '敌人伤害 +20%' },
  ];

  META.dailyKey = function (d) {
    const dt = d || new Date();
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  };

  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  META.dailyConfig = function (key) {
    const k = key || META.dailyKey();
    const h = hashStr('lamplit:' + k);
    const r = G.rng(h);
    const chars = ['lamp', 'grave', 'ranger'];
    const char = chars[Math.floor(r() * chars.length) % chars.length];
    const pool = MODS.slice();
    const picks = [];
    for (let i = 0; i < 2; i++) {
      const idx = Math.floor(r() * pool.length) % pool.length;
      picks.push(pool.splice(idx, 1)[0]);
    }
    return {
      key: k,
      seed: 100000 + (h % 900000),
      char,
      mods: picks,
      label: '每日挑战 · ' + k,
    };
  };

  META.hasMod = function (cfg, id) {
    return !!cfg && cfg.mods && cfg.mods.some((m) => m.id === id);
  };

  META.dailyScore = function (r) {
    return Math.round(r.kills * 12 + r.level * 80 + r.time * 3 + (r.won ? 6000 : 0) + (r.dmg || 0) * 0.05);
  };

  META.recordDaily = function (save, key, score, won) {
    META.ensure(save);
    const prev = save.daily.best[key] || 0;
    const isBest = score > prev;
    if (isBest) save.daily.best[key] = score;
    if (won && save.daily.cleared.indexOf(key) < 0) save.daily.cleared.push(key);
    const keys = Object.keys(save.daily.best).sort().reverse();
    for (let i = 14; i < keys.length; i++) delete save.daily.best[keys[i]];
    const ck = save.daily.cleared.slice(-30);
    save.daily.cleared = ck;
    G.Store.save();
    return { best: save.daily.best[key], isBest };
  };

  META.achCount = function (save) {
    return Object.keys(save.ach || {}).length;
  };

  META.codexProgress = function (save) {
    const e = save.codex.enemies.length, w = save.codex.weapons.length, p = save.codex.passives.length;
    return { e, eMax: Object.keys(META.ENEMIES).length, w, wMax: Object.keys(META.WEAPONS).length, p, pMax: Object.keys(META.PASSIVES).length };
  };

  META.MODS = MODS;
})();
