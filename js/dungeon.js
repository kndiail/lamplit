/* =========================================================
   提灯者 LAMPLIT — 地牢生成 v2
   一关 = 5~9 个房间 + 走廊，主干 + 支线，房间类型与元气骑士式布局
   ========================================================= */
(function () {
  'use strict';
  const G = window.G;
  const D = (window.DUNGEON = {});

  const ROOM_W = 384, ROOM_H = 216;
  const CORR = 46;            // 走廊宽（门洞宽）
  const GAP = 56;             // 房间之间的走廊长度
  const PITCH_X = ROOM_W + GAP;
  const PITCH_Y = ROOM_H + GAP;
  const WALL = 12;

  D.FLOORS = 4;
  D.ROOMS = 6;                // 每层 6 小关，第 2/4/6 关是层主
  D.ROOM_W = ROOM_W; D.ROOM_H = ROOM_H;
  D.CORR = CORR; D.WALL = WALL;
  D.PITCH_X = PITCH_X; D.PITCH_Y = PITCH_Y;

  // 10 个主题各一套墙 / 地 / 装饰，不再共用 5 套配色
  const STYLE = {
    forest: {
      wall: ['#3a4560', '#2b3348', '#1d2331', '#5a6d8c'],
      floor: ['#1b2230', '#151b27', '#0f141d', '#232c3f'],
      dark: 'rgba(4,9,10,0.84)', motif: 'brick', props: ['mush', 'fern', 'rock', 'fern'],
    },
    ice: {
      wall: ['#3d5a72', '#2c4457', '#1b2c3a', '#7fb6d2'],
      floor: ['#20303c', '#18262f', '#101b22', '#3a5a6e'],
      dark: 'rgba(6,13,24,0.84)', motif: 'ice', props: ['crystal', 'snow', 'rock', 'crystal'],
    },
    desert: {
      wall: ['#6a5638', '#4e3f28', '#33291a', '#96794f'],
      floor: ['#4a3d28', '#3a3020', '#292115', '#6b563a'],
      dark: 'rgba(16,11,6,0.80)', motif: 'sand', props: ['pillar', 'sand', 'rock', 'pillar'],
    },
    crypt: {
      wall: ['#3c3a44', '#2c2a34', '#1e1c24', '#615d72'],
      floor: ['#2a2730', '#211e26', '#16141a', '#3b3744'],
      dark: 'rgba(8,6,13,0.86)', motif: 'brick', props: ['bones', 'grave', 'candle', 'bones'],
    },
    castle: {
      wall: ['#4a4a58', '#383846', '#26262f', '#787890'],
      floor: ['#2c2c36', '#23232b', '#181820', '#41414f'],
      dark: 'rgba(6,7,13,0.84)', motif: 'brick', props: ['torch', 'banner', 'rock', 'torch'],
    },
    halloween: {
      wall: ['#4a3450', '#372640', '#24182b', '#77527f'],
      floor: ['#2f2333', '#251b28', '#19121c', '#463450'],
      dark: 'rgba(13,6,17,0.86)', motif: 'brick', props: ['pumpkin', 'candle', 'bones', 'pumpkin'],
    },
    alien: {
      wall: ['#2e4a52', '#22383f', '#152429', '#57a3b0'],
      floor: ['#1c2f34', '#152429', '#0e191d', '#2b555c'],
      dark: 'rgba(3,11,15,0.86)', motif: 'panel', props: ['panel', 'vent', 'crystal', 'panel'],
    },
    volcano: {
      wall: ['#4a3028', '#37221c', '#221410', '#8f5240'],
      floor: ['#33201b', '#281914', '#1a0f0c', '#5a352a'],
      dark: 'rgba(18,5,4,0.86)', motif: 'lava', props: ['lava', 'rock', 'ember', 'lava'],
    },
    island: {
      wall: ['#5a4630', '#443323', '#2c2116', '#8a6c4c'],
      floor: ['#3d3323', '#2f2719', '#201a10', '#574a32'],
      dark: 'rgba(8,11,8,0.82)', motif: 'plank', props: ['barrel', 'palm', 'sand', 'barrel'],
    },
    ruins: {
      wall: ['#46504a', '#343d38', '#232a26', '#728477'],
      floor: ['#2b332d', '#222925', '#171c19', '#414f47'],
      dark: 'rgba(5,10,7,0.85)', motif: 'brick', props: ['pillar', 'moss', 'rock', 'pillar'],
    },
  };
  D.STYLE = STYLE;

  // 每层的场景主题池（10 个主题，按层分配）
  D.THEMES = [
    { id: 'forest', name: '森林', sub: '苔痕与毒箱', biome: 1, wall: 1, floor: 1 },
    { id: 'ice', name: '冰原', sub: '矿工与雪怪', biome: 2, wall: 2, floor: 2 },
    { id: 'desert', name: '沙漠遗迹', sub: '魔像与猴群', biome: 3, wall: 3, floor: 3 },
    { id: 'crypt', name: '骷髅墓穴', sub: '散弹与先手', biome: 3, wall: 3, floor: 3 },
    { id: 'castle', name: '骑士城堡', sub: '骑士与巫师', biome: 2, wall: 2, floor: 2 },
    { id: 'halloween', name: '万圣夜', sub: '南瓜与自爆蛙', biome: 1, wall: 1, floor: 1 },
    { id: 'alien', name: '外星基地', sub: '激光与炮台', biome: 0, wall: 4, floor: 4 },
    { id: 'volcano', name: '火山', sub: '熔岩间歇喷发', biome: 0, wall: 4, floor: 4 },
    { id: 'island', name: '泥油海岛', sub: '海盗与油污', biome: 1, wall: 1, floor: 1 },
    { id: 'ruins', name: '巨石山脉', sub: '第四大关', biome: 2, wall: 2, floor: 2 },
  ];

  D.floorThemes = function (floor) {
    if (floor <= 0) return [0, 1, 2];
    if (floor === 1) return [3, 4, 5];
    if (floor === 2) return [6, 7, 8];
    return [9, 6, 7];
  };

  D.themeFor = function (seed, floor) {
    const pool = D.floorThemes(Math.min(floor, 3));
    const R = G.rng((seed ^ (floor * 7411 + 99)) >>> 0);
    return pool[(R() * pool.length) | 0];
  };

  /* ---------------------------------------------------------
     小关地图：房间图 + 走廊
     --------------------------------------------------------- */
  const ROOM_TYPES = {
    start: { name: '初始房', icon: 'house' },
    fight: { name: '小怪房', icon: 'fight' },
    elite: { name: '精英房', icon: 'elite' },
    cage: { name: '牢笼房', icon: 'cage' },
    treasure: { name: '宝箱房', icon: 'treasure' },
    special: { name: '特殊房', icon: 'special' },
    portal: { name: '传送门房', icon: 'portal' },
    boss: { name: '首领房', icon: 'boss' },
    hidden: { name: '隐藏房', icon: 'hidden' },
  };
  D.ROOM_TYPES = ROOM_TYPES;

  function key(x, y) { return x + ',' + y; }
  function mkRoom(gx, gy, type) {
    const x = 40 + gx * PITCH_X;
    const y = 40 + gy * PITCH_Y;
    return {
      id: key(gx, gy), gx, gy,
      x, y, w: ROOM_W, h: ROOM_H,
      type,
      doors: { u: false, d: false, l: false, r: false },
      walls: [], doorWalls: [],
      spawns: [], spikes: [], chests: [], shrine: null,
      visited: false, spawned: false, cleared: false,
      waveIdx: 0, waves: [], respawnT: 0,
      eliteMob: false,
    };
  }

  D.level = function (seed, floor, levelIdx) {
    const R = G.rng((seed ^ (floor * 104729 + levelIdx * 1543 + 17)) >>> 0);
    const themeId = D.THEMES[D.themeFor(seed, floor)].id;
    const isBoss = levelIdx % 2 === 1;   // 第 2 / 4 / 6 关
    const grid = new Map();
    const used = new Set();

    // 主干随机游走
    let cx = 2, cy = 4;
    const path = [];
    const startRoom = mkRoom(cx, cy, 'start');
    grid.set(startRoom.id, startRoom); used.add(startRoom.id); path.push(startRoom);
    const len = isBoss ? 2 + ((R() * 2) | 0) : 3 + ((R() * 3) | 0);
    const dirs = [[0, -1], [1, 0], [-1, 0], [0, 1]];
    for (let i = 0; i < len; i++) {
      for (let k = dirs.length - 1; k > 0; k--) {
        const j = (R() * (k + 1)) | 0;
        const t = dirs[k]; dirs[k] = dirs[j]; dirs[j] = t;
      }
      let moved = false;
      for (let k = 0; k < dirs.length; k++) {
        const nx = cx + dirs[k][0], ny = cy + dirs[k][1];
        if (nx < 0 || ny < 0 || nx >= 5 || ny >= 5) continue;
        if (used.has(key(nx, ny))) continue;
        const room = mkRoom(nx, ny, 'fight');
        grid.set(room.id, room); used.add(room.id); path.push(room);
        cx = nx; cy = ny; moved = true; break;
      }
      if (!moved) break;
    }
    // 终点：普通关是传送门，第 10 关是首领房
    const last = path[path.length - 1];
    last.type = isBoss ? 'boss' : 'portal';

    // 支线：挂在主干房间旁边
    // 奖励关（宝箱 / 特殊）降频：每关最多 1 个宝箱、1 个特殊，其余给战斗支线
    const sidePool = [['elite', 30], ['cage', 24], ['fight', 16], ['treasure', 19], ['special', 11]];
    let nTreasure = 0, nSpecial = 0;
    for (let i = 1; i < path.length - (isBoss ? 1 : 1); i++) {
      if (R() > (isBoss ? 0.35 : 0.55)) continue;
      const base = path[i];
      const cand = [];
      for (let k = 0; k < dirs.length; k++) {
        const nx = base.gx + dirs[k][0], ny = base.gy + dirs[k][1];
        if (nx < 0 || ny < 0 || nx >= 5 || ny >= 5) continue;
        if (used.has(key(nx, ny))) continue;
        cand.push([nx, ny]);
      }
      if (!cand.length) continue;
      const pick = cand[(R() * cand.length) | 0];
      let total = 0;
      for (let si = 0; si < sidePool.length; si++) total += sidePool[si][1];
      let rv = R() * total, t = 'elite';
      for (let si = 0; si < sidePool.length; si++) {
        rv -= sidePool[si][1];
        if (rv <= 0) { t = sidePool[si][0]; break; }
      }
      if (t === 'treasure' && nTreasure >= 1) t = 'elite';
      if (t === 'special' && nSpecial >= 1) t = 'fight';
      if (t === 'treasure') nTreasure++;
      if (t === 'special') nSpecial++;
      const room = mkRoom(pick[0], pick[1], t);
      grid.set(room.id, room); used.add(room.id);
    }

    // 首领关：首领房额外连 2 个基础房
    if (isBoss) {
      let added = 0;
      for (let k = 0; k < dirs.length && added < 2; k++) {
        const nx = last.gx + dirs[k][0], ny = last.gy + dirs[k][1];
        if (nx < 0 || ny < 0 || nx >= 5 || ny >= 5) continue;
        if (used.has(key(nx, ny))) continue;
        const room = mkRoom(nx, ny, R() < 0.5 ? 'elite' : 'fight');
        grid.set(room.id, room); used.add(room.id); added++;
      }
    }

    const rooms = Array.from(grid.values());
    // 连接：相邻房间自动开门 + 走廊
    const corridors = [];
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const a = rooms[i], b = rooms[j];
        const dx = b.gx - a.gx, dy = b.gy - a.gy;
        if (Math.abs(dx) + Math.abs(dy) !== 1) continue;
        const left = dx < 0 ? b : a, right = dx > 0 ? b : a;
        const top = dy < 0 ? b : a, bottom = dy > 0 ? b : a;
        let corr;
        if (dx !== 0) {
          a.doors[dx > 0 ? 'r' : 'l'] = true;
          b.doors[dx > 0 ? 'l' : 'r'] = true;
          const gx0 = left.x + left.w;
          corr = {
            x: gx0, y: left.y + (ROOM_H - CORR) / 2, w: GAP, h: CORR,
            dir: 'h', a: a.id, b: b.id, walls: [],
          };
        } else {
          a.doors[dy > 0 ? 'd' : 'u'] = true;
          b.doors[dy > 0 ? 'u' : 'd'] = true;
          const gy0 = top.y + top.h;
          corr = {
            x: top.x + (ROOM_W - CORR) / 2, y: gy0, w: CORR, h: GAP,
            dir: 'v', a: a.id, b: b.id, walls: [],
          };
        }
        corridors.push(corr);
      }
    }

    // 房间墙体（门洞留空）
    const walls = [];
    const T = WALL;
    for (const rm of rooms) {
      const { x, y, w, h, doors } = rm;
      const half = CORR / 2;
      const cx0 = x + w / 2, cy0 = y + h / 2;
      // 上
      if (doors.u) {
        walls.push({ x, y, w: cx0 - half - x, h: T });
        walls.push({ x: cx0 + half, y, w: x + w - (cx0 + half), h: T });
      } else walls.push({ x, y, w, h: T });
      // 下
      if (doors.d) {
        walls.push({ x, y: y + h - T, w: cx0 - half - x, h: T });
        walls.push({ x: cx0 + half, y: y + h - T, w: x + w - (cx0 + half), h: T });
      } else walls.push({ x, y: y + h - T, w, h: T });
      // 左
      if (doors.l) {
        walls.push({ x, y, w: T, h: cy0 - half - y });
        walls.push({ x, y: cy0 + half, w: T, h: y + h - (cy0 + half) });
      } else walls.push({ x, y, w: T, h });
      // 右
      if (doors.r) {
        walls.push({ x: x + w - T, y, w: T, h: cy0 - half - y });
        walls.push({ x: x + w - T, y: cy0 + half, w: T, h: y + h - (cy0 + half) });
      } else walls.push({ x: x + w - T, y, w: T, h });
      rm.walls = walls.slice(-8).length ? [] : [];
    }
    // 走廊侧墙
    for (const c of corridors) {
      if (c.dir === 'h') {
        c.walls.push({ x: c.x, y: c.y - T, w: c.w, h: T });
        c.walls.push({ x: c.x, y: c.y + c.h, w: c.w, h: T });
      } else {
        c.walls.push({ x: c.x - T, y: c.y, w: T, h: c.h });
        c.walls.push({ x: c.x + c.w, y: c.y, w: T, h: c.h });
      }
    }

    // 每间房的墙（用于门锁与按房间查墙）
    for (const rm of rooms) {
      rm.walls = [];
      const { x, y, w, h, doors } = rm;
      const half = CORR / 2;
      const cx0 = x + w / 2, cy0 = y + h / 2;
      if (doors.u) {
        rm.walls.push({ x, y, w: cx0 - half - x, h: T });
        rm.walls.push({ x: cx0 + half, y, w: x + w - (cx0 + half), h: T });
      } else rm.walls.push({ x, y, w, h: T });
      if (doors.d) {
        rm.walls.push({ x, y: y + h - T, w: cx0 - half - x, h: T });
        rm.walls.push({ x: cx0 + half, y: y + h - T, w: x + w - (cx0 + half), h: T });
      } else rm.walls.push({ x, y: y + h - T, w, h: T });
      if (doors.l) {
        rm.walls.push({ x, y, w: T, h: cy0 - half - y });
        rm.walls.push({ x, y: cy0 + half, w: T, h: y + h - (cy0 + half) });
      } else rm.walls.push({ x, y, w: T, h });
      if (doors.r) {
        rm.walls.push({ x: x + w - T, y, w: T, h: cy0 - half - y });
        rm.walls.push({ x: x + w - T, y: cy0 + half, w: T, h: y + h - (cy0 + half) });
      } else rm.walls.push({ x: x + w - T, y, w: T, h });

      // 门闸（锁门时启用）
      rm.doorWalls = [];
      if (doors.u) rm.doorWalls.push({ x: cx0 - half, y, w: CORR, h: T + 2 });
      if (doors.d) rm.doorWalls.push({ x: cx0 - half, y: y + h - T - 2, w: CORR, h: T + 2 });
      if (doors.l) rm.doorWalls.push({ x, y: cy0 - half, w: T + 2, h: CORR });
      if (doors.r) rm.doorWalls.push({ x: x + w - T - 2, y: cy0 - half, w: T + 2, h: CORR });

      // 主题装饰物（靠墙摆放，避开门口）
      const style = STYLE[themeId] || STYLE.forest;
      rm.props = [];
      const pn = 5 + ((R() * 5) | 0);
      for (let pi = 0; pi < pn; pi++) {
        const kind = style.props[(R() * style.props.length) | 0];
        const side = (R() * 4) | 0;
        let ppx, ppy;
        if (side === 0) { ppx = x + 26 + R() * (w - 52); ppy = y + T + 12; }
        else if (side === 1) { ppx = x + 26 + R() * (w - 52); ppy = y + h - T - 12; }
        else if (side === 2) { ppx = x + T + 14; ppy = y + 32 + R() * (h - 64); }
        else { ppx = x + w - T - 14; ppy = y + 32 + R() * (h - 64); }
        // 门口 44px 内不放
        let nearDoor = false;
        if (Math.abs(ppx - (x + w / 2)) < 46 && (Math.abs(ppy - y) < 24 || Math.abs(ppy - (y + h)) < 24)) nearDoor = true;
        if (Math.abs(ppy - (y + h / 2)) < 46 && (Math.abs(ppx - x) < 24 || Math.abs(ppx - (x + w)) < 24)) nearDoor = true;
        if (nearDoor) continue;
        rm.props.push({ kind, x: ppx, y: ppy, s: R() < 0.35 ? 1 : 0 });
      }

      // 刷怪点 / 陷阱 / 宝箱 / 祭坛
      rm.spawns = [];
      for (let i = 0; i < 24; i++) {
        rm.spawns.push({
          x: x + T + 24 + R() * (w - T * 2 - 48),
          y: y + T + 40 + R() * (h - T * 2 - 80),
        });
      }
      if (rm.type === 'treasure') {
        const cnt = 1 + (R() < 0.35 ? 1 : 0);
        for (let i = 0; i < cnt; i++) {
          rm.chests.push({ x: cx0 + (i ? -52 : 40), y: y + 66 + R() * 60, t: 0, open: false });
        }
      }
      if (rm.type === 'special') {
        rm.shrine = { x: cx0, y: y + 74, r: 15, used: false };
      }
      if (rm.type === 'elite' || rm.type === 'cage') {
        rm.spikes = [];
        const cnt = 1 + ((R() * 3) | 0);
        for (let i = 0; i < cnt; i++) {
          rm.spikes.push({
            x: x + 40 + R() * (w - 80),
            y: y + 50 + R() * (h - 100),
            r: 10, cd: 0,
          });
        }
      }

      // 掩体 / 石柱：多种布局，保留门口到中心的通道
      rm.blocks = [];
      if (rm.type !== 'start' && rm.type !== 'treasure') {
        const ix = x + T + 24, iy = y + T + 24;
        const iw = w - (T + 24) * 2, ih = h - (T + 24) * 2;
        const bcx = x + w / 2, bcy = y + h / 2;
        const free = (bx, by, bw2, bh2) => {
          const nearTop = by < iy + 72, nearBottom = by + bh2 > iy + ih - 72;
          const nearLeft = bx < ix + 72, nearRight = bx + bw2 > ix + iw - 72;
          if ((nearTop || nearBottom) && bx < bcx + 34 && bx + bw2 > bcx - 34) return false;
          if ((nearLeft || nearRight) && by < bcy + 30 && by + bh2 > bcy - 30) return false;
          for (let ci = 0; ci < rm.chests.length; ci++) {
            const c = rm.chests[ci];
            if (bx < c.x + 26 && bx + bw2 > c.x - 26 && by < c.y + 26 && by + bh2 > c.y - 26) return false;
          }
          if (rm.shrine) {
            const sh = rm.shrine;
            if (bx < sh.x + 30 && bx + bw2 > sh.x - 30 && by < sh.y + 30 && by + bh2 > sh.y - 30) return false;
          }
          for (let si = 0; si < rm.spikes.length; si++) {
            const sp = rm.spikes[si];
            if (bx < sp.x + 18 && bx + bw2 > sp.x - 18 && by < sp.y + 18 && by + bh2 > sp.y - 18) return false;
          }
          return true;
        };
        const addBlock = (bx, by, bw2, bh2) => {
          if (bw2 < 14 || bh2 < 14) return;
          if (!free(bx, by, bw2, bh2)) return;
          rm.blocks.push({ x: Math.round(bx), y: Math.round(by), w: Math.round(bw2), h: Math.round(bh2) });
        };
        const layout = ['pillars', 'corners', 'scatter', 'ring', 'pillars'][(R() * 5) | 0];
        if (layout === 'pillars') {
          const s2 = 24 + ((R() * 10) | 0);
          addBlock(ix + iw * 0.26 - s2 / 2, iy + ih * 0.26 - s2 / 2, s2, s2);
          addBlock(ix + iw * 0.74 - s2 / 2, iy + ih * 0.26 - s2 / 2, s2, s2);
          addBlock(ix + iw * 0.26 - s2 / 2, iy + ih * 0.74 - s2 / 2, s2, s2);
          addBlock(ix + iw * 0.74 - s2 / 2, iy + ih * 0.74 - s2 / 2, s2, s2);
        } else if (layout === 'corners') {
          for (let k = 0; k < 4; k++) {
            const bw2 = 26 + ((R() * 10) | 0), bh2 = 26 + ((R() * 10) | 0);
            const bx = ix + (k % 2 ? iw - bw2 - 4 : 4);
            const by = iy + (k > 1 ? ih - bh2 - 4 : 4);
            addBlock(bx, by, bw2, bh2);
          }
        } else if (layout === 'ring') {
          const n = 6, rr = 86;
          for (let k = 0; k < n; k++) {
            const a2 = (k / n) * Math.PI * 2 + R() * 0.32;
            addBlock(bcx + Math.cos(a2) * rr - 12, bcy + Math.sin(a2) * rr * 0.72 - 12, 24, 24);
          }
        } else {
          const n = 5 + ((R() * 4) | 0);
          for (let k = 0; k < n; k++) {
            addBlock(ix + R() * (iw - 30), iy + R() * (ih - 30), 20 + R() * 16, 20 + R() * 16);
          }
        }
        for (let si = rm.spawns.length - 1; si >= 0; si--) {
          const sp = rm.spawns[si];
          if (D.pointInWalls(sp.x, sp.y, rm.blocks)) rm.spawns.splice(si, 1);
        }
        for (let pi2 = rm.props.length - 1; pi2 >= 0; pi2--) {
          const pr2 = rm.props[pi2];
          if (D.pointInWalls(pr2.x, pr2.y, rm.blocks)) rm.props.splice(pi2, 1);
        }
      }
    }

    // 汇总墙体 / 走廊地板
    const allWalls = [];
    for (const rm of rooms) for (const w of rm.walls) allWalls.push(w);
    for (const rm of rooms) for (const b of (rm.blocks || [])) allWalls.push(b);
    for (const c of corridors) for (const w of c.walls) allWalls.push(w);

    const xs = rooms.map((r) => r.x), ys = rooms.map((r) => r.y);
    const bounds = {
      x: Math.min.apply(null, xs), y: Math.min.apply(null, ys),
      w: Math.max.apply(null, xs) + ROOM_W - Math.min.apply(null, xs),
      h: Math.max.apply(null, ys) + ROOM_H - Math.min.apply(null, ys),
    };

    return {
      seed, floor, levelIdx, isBoss, themeId,
      rooms, corridors, bounds,
      walls: allWalls,
      start: rooms[0],
      portalRoom: isBoss ? null : last,
      bossRoom: isBoss ? last : null,
    };
  };

  /* ---------------------------------------------------------
     碰撞
     --------------------------------------------------------- */
  function resolveRect(px, py, r, rc) {
    const nx = Math.max(rc.x, Math.min(px, rc.x + rc.w));
    const ny = Math.max(rc.y, Math.min(py, rc.y + rc.h));
    const dx = px - nx, dy = py - ny;
    const d2 = dx * dx + dy * dy;
    if (d2 > r * r || d2 === 0) return null;
    const d = Math.sqrt(d2);
    if (d < 0.0001) {
      const left = px - rc.x, right = rc.x + rc.w - px;
      const top = py - rc.y, bottom = rc.y + rc.h - py;
      const m = Math.min(left, right, top, bottom);
      if (m === left) return { x: rc.x - r, y: py };
      if (m === right) return { x: rc.x + rc.w + r, y: py };
      if (m === top) return { x: px, y: rc.y - r };
      return { x: px, y: rc.y + rc.h + r };
    }
    const push = (r - d) / d;
    return { x: px + dx * push, y: py + dy * push };
  }

  D.resolve = function (ent, r, walls) {
    for (let i = 0; i < walls.length; i++) {
      const p = resolveRect(ent.x, ent.y, r, walls[i]);
      if (p) { ent.x = p.x; ent.y = p.y; }
    }
    return ent;
  };

  D.pointInWalls = function (x, y, walls) {
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      if (x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h) return true;
    }
    return false;
  };

  D.roomAt = function (level, x, y) {
    for (let i = 0; i < level.rooms.length; i++) {
      const r = level.rooms[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r;
    }
    // 走廊：归到最近的房间
    for (let i = 0; i < level.corridors.length; i++) {
      const c = level.corridors[i];
      if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
        for (let k = 0; k < level.rooms.length; k++) if (level.rooms[k].id === c.a) return level.rooms[k];
      }
    }
    return null;
  };

  /* ---------------------------------------------------------
     墙 / 地板贴图
     --------------------------------------------------------- */
  let wallCanvas = null, wallTheme = -1, floorCanvas = null, floorTheme = -1;
  D.buildWallTile = function (theme) {
    if (wallCanvas && wallTheme === theme) return wallCanvas;
    const S = 16;
    const cv = document.createElement('canvas');
    cv.width = S; cv.height = S;
    const g = cv.getContext('2d');
    const R = G.rng(7001 + theme * 313);
    const st = D.STYLE[theme] || D.STYLE.forest;
    const pal = { a: st.wall[0], b: st.wall[1], c: st.wall[2], hi: st.wall[3] };
    g.fillStyle = pal.b; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 22; i++) {
      const x = (R() * S) | 0, y = (R() * S) | 0;
      g.fillStyle = R() < 0.5 ? pal.a : pal.c;
      g.fillRect(x, y, 1 + ((R() * 3) | 0), 1);
    }
    g.fillStyle = pal.c;
    g.fillRect(0, 0, S, 1); g.fillRect(0, 8, S, 1);
    g.fillRect(7, 1, 1, 7); g.fillRect(0, 9, 1, 7);
    g.fillStyle = pal.hi; g.globalAlpha = 0.5;
    g.fillRect(0, 1, S, 1); g.globalAlpha = 1;
    if (st.motif === 'panel') {
      g.fillStyle = 'rgba(120,220,235,0.55)';
      g.fillRect(1, 6, S - 2, 1);
      g.fillStyle = '#0d1a1e';
      g.fillRect(2, 2, 2, 2); g.fillRect(12, 2, 2, 2);
      g.fillRect(2, 12, 2, 2); g.fillRect(12, 12, 2, 2);
    } else if (st.motif === 'ice') {
      g.fillStyle = 'rgba(200,240,255,0.35)';
      g.fillRect(2, 2, 6, 1); g.fillRect(9, 4, 5, 1); g.fillRect(1, 11, 7, 1);
      g.fillStyle = 'rgba(120,200,240,0.25)';
      g.fillRect(3, 3, 1, 5); g.fillRect(11, 6, 1, 6);
    } else if (st.motif === 'sand') {
      g.fillStyle = 'rgba(230,205,150,0.18)';
      g.fillRect(0, 4, S, 1); g.fillRect(0, 12, S, 1);
    } else if (st.motif === 'lava') {
      g.fillStyle = 'rgba(255,120,40,0.5)';
      g.fillRect(3, 5, 1, 6); g.fillRect(4, 8, 3, 1); g.fillRect(11, 3, 1, 5);
      g.fillStyle = 'rgba(255,200,90,0.3)';
      g.fillRect(4, 6, 1, 3); g.fillRect(12, 4, 1, 3);
    } else if (st.motif === 'plank') {
      g.fillStyle = 'rgba(20,12,6,0.55)';
      g.fillRect(4, 0, 1, S); g.fillRect(12, 0, 1, S);
      g.fillStyle = 'rgba(220,190,140,0.18)';
      g.fillRect(0, 2, S, 1);
    }
    wallCanvas = cv; wallTheme = theme;
    return cv;
  };

  D.buildFloorTile = function (theme) {
    if (floorCanvas && floorTheme === theme) return floorCanvas;
    const S = 32;
    const cv = document.createElement('canvas');
    cv.width = S; cv.height = S;
    const g = cv.getContext('2d');
    const R = G.rng(3301 + theme * 97);
    const st = D.STYLE[theme] || D.STYLE.forest;
    const pal = { a: st.floor[0], b: st.floor[1], line: st.floor[2], hi: st.floor[3] };
    g.fillStyle = pal.b; g.fillRect(0, 0, S, S);
    g.fillStyle = pal.a;
    g.fillRect(1, 1, 14, 14); g.fillRect(17, 1, 14, 14);
    g.fillRect(1, 17, 14, 14); g.fillRect(17, 17, 14, 14);
    g.fillStyle = pal.hi; g.globalAlpha = 0.5;
    g.fillRect(1, 1, 14, 1); g.fillRect(17, 1, 14, 1);
    g.fillRect(1, 17, 14, 1); g.fillRect(17, 17, 14, 1);
    g.globalAlpha = 1;
    for (let i = 0; i < 26; i++) {
      const x = (R() * S) | 0, y = (R() * S) | 0;
      g.fillStyle = R() < 0.5 ? pal.line : pal.hi;
      g.globalAlpha = 0.35;
      g.fillRect(x, y, 1 + ((R() * 2) | 0), 1);
    }
    g.globalAlpha = 1;
    if (st.motif === 'ice' || st.motif === 'sand') {
      g.fillStyle = 'rgba(235,245,255,0.10)';
      for (let i = 0; i < 5; i++) g.fillRect((R() * S) | 0, (R() * S) | 0, 1, 1);
    } else if (st.motif === 'lava') {
      g.fillStyle = 'rgba(255,110,40,0.22)';
      g.fillRect(6, 20, 10, 1); g.fillRect(15, 21, 1, 6); g.fillRect(8, 7, 7, 1);
    } else if (st.motif === 'plank') {
      g.fillStyle = 'rgba(15,10,6,0.4)';
      g.fillRect(0, 10, S, 1); g.fillRect(0, 26, S, 1);
      g.fillRect(15, 0, 1, S);
    } else if (st.motif === 'panel') {
      g.strokeStyle = 'rgba(120,220,235,0.10)';
      g.strokeRect(6, 6, 20, 20);
    }
    floorCanvas = cv; floorTheme = theme;
    return cv;
  };

  // 主题装饰物：全部运行时画，不占素材
  D.drawProp = function (ctx, kind, x, y, t) {
    const p = (px2, py2, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(px2), Math.round(py2), w, h); };
    const sway = Math.sin(t * 1.6 + x * 0.13) * 0.6;
    if (kind === 'mush') {
      p(x - 3, y - 4, 6, 4, '#6a4a3a'); p(x - 5, y - 6, 10, 3, '#c05a6a'); p(x - 3, y - 7, 5, 1, '#e88a96');
    } else if (kind === 'fern') {
      p(x - 1, y - 5, 2, 5, '#3f6a48');
      for (let i = -1; i <= 1; i++) p(x + i * 3, y - 6 - (i ? 0 : 2), 4, 1, '#5c8f5e');
    } else if (kind === 'rock') {
      p(x - 4, y - 3, 8, 3, '#4a4e5c'); p(x - 3, y - 4, 5, 1, '#666e80');
    } else if (kind === 'crystal') {
      p(x - 1, y - 8, 2, 8, 'rgba(150,220,255,0.75)');
      p(x - 3, y - 5, 2, 5, 'rgba(110,190,240,0.6)');
      p(x + 2, y - 4, 2, 4, 'rgba(110,190,240,0.6)');
      p(x - 1, y - 8, 1, 3, '#e8fbff');
    } else if (kind === 'snow') {
      p(x - 6, y - 2, 12, 2, 'rgba(220,240,255,0.35)');
    } else if (kind === 'pillar') {
      p(x - 5, y - 12, 10, 12, '#5a5346'); p(x - 6, y - 13, 12, 2, '#7a715e');
      p(x - 3, y - 10, 1, 8, '#6e6656'); p(x - 5, y - 2, 10, 2, '#423c31');
    } else if (kind === 'sand') {
      p(x - 6, y - 2, 12, 2, 'rgba(200,170,110,0.45)'); p(x - 3, y - 3, 6, 1, 'rgba(220,190,130,0.4)');
    } else if (kind === 'bones') {
      p(x - 4, y - 2, 8, 2, '#c9c4b0'); p(x - 3, y - 4, 5, 2, '#ddd8c4');
      p(x - 2, y - 4, 1, 2, '#2a2730'); p(x + 1, y - 4, 1, 2, '#2a2730');
    } else if (kind === 'grave') {
      p(x - 4, y - 8, 8, 8, '#4a4752'); p(x - 5, y - 9, 10, 2, '#5c5866'); p(x - 2, y - 6, 4, 1, '#6e6a7a');
    } else if (kind === 'candle') {
      p(x - 1, y - 5, 2, 5, '#d8d2c0');
      p(x - 1, y - 8 + sway, 2, 3, '#ffcf6e'); p(x - 1, y - 9 + sway, 1, 1, '#fff2c0');
    } else if (kind === 'torch') {
      p(x - 1, y - 8, 2, 8, '#5a4028'); p(x - 3, y - 10, 6, 2, '#3a2a1c');
      p(x - 2, y - 15 + sway, 4, 5, '#ff9a3c'); p(x - 1, y - 17 + sway, 2, 3, '#ffdd8a');
    } else if (kind === 'banner') {
      p(x - 5, y - 12, 10, 12, '#5a2430'); p(x - 5, y - 12, 10, 2, '#8a4a3a'); p(x - 1, y - 9, 2, 6, '#d8b45a');
    } else if (kind === 'pumpkin') {
      p(x - 5, y - 6, 10, 6, '#d97a2a'); p(x - 4, y - 7, 8, 1, '#f0a14a');
      p(x - 3, y - 4, 2, 2, '#2a1a10'); p(x + 1, y - 4, 2, 2, '#2a1a10'); p(x - 2, y - 2, 4, 1, '#2a1a10');
      p(x - 1, y - 9, 2, 2, '#4a6a3a');
    } else if (kind === 'panel') {
      p(x - 5, y - 6, 10, 6, '#2c4a52'); p(x - 4, y - 5, 8, 2, '#182c32');
      p(x - 3, y - 3, 2, 1, 'rgba(120,230,240,0.8)'); p(x + 1, y - 3, 2, 1, 'rgba(120,230,240,0.5)');
    } else if (kind === 'vent') {
      p(x - 5, y - 3, 10, 3, '#22383f');
      for (let i = 0; i < 4; i++) p(x - 4 + i * 2, y - 3, 1, 3, '#12242a');
    } else if (kind === 'lava') {
      const g = 0.55 + Math.sin(t * 2.4 + x) * 0.2;
      p(x - 6, y - 1, 12, 2, 'rgba(255,110,40,' + g + ')');
      p(x - 3, y - 2, 6, 1, 'rgba(255,200,90,' + (g * 0.8) + ')');
    } else if (kind === 'ember') {
      const fl = (t * 14 + x) % 20;
      p(x - 1, y - 2 - fl, 2, 2, 'rgba(255,150,60,' + (1 - fl / 20) + ')');
    } else if (kind === 'barrel') {
      p(x - 4, y - 7, 8, 7, '#6a4a2c'); p(x - 4, y - 6, 8, 1, '#8a6a44'); p(x - 4, y - 3, 8, 1, '#4a3018');
    } else if (kind === 'palm') {
      p(x - 1, y - 14, 2, 14, '#6a5232');
      p(x - 4, y - 15, 8, 2, '#3f7a4a'); p(x - 8, y - 13, 5, 2, '#4f8a52'); p(x + 3, y - 13, 5, 2, '#4f8a52');
    } else if (kind === 'moss') {
      p(x - 6, y - 2, 12, 2, 'rgba(70,120,70,0.4)');
    }
  };

  window.DUNGEON = D;
})();
