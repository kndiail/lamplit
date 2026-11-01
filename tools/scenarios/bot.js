/* 机器人试玩：垂直风筝走位 + 捡魂火 + 智能选卡，验证平衡与完整流程 */
module.exports = async (h) => {
  await h.goto();
  await h.wait(400);
  await h.eval("(() => { try { LAMPLIT.finishStory(); } catch (e) {} if (LAMPLIT.state === 'STORY') LAMPLIT.setState('TITLE'); try { LAMPLIT.save.lore.prologue = true; } catch (e) {} return 1; })()");

  await h.wait(1200);
  await h.key(' ');
  await h.wait(300);
  console.log('start state =', await h.eval('LAMPLIT.state'));

  const sim = (secs) => `(() => {
    const K = window.G.Input.keys;
    const N = ${Math.round(secs * 60)};
    for (let i = 0; i < N; i++) {
      if (LAMPLIT.state === 'DEAD' || LAMPLIT.state === 'WIN') break;
      if (LAMPLIT.state === 'LEVELUP' || LAMPLIT.state === 'CHEST' || LAMPLIT.state === 'SHRINE' || LAMPLIT.state === 'BOON') {
        const isFloor = LAMPLIT.state === 'BOON';
        const cs = LAMPLIT.cards;
        let best = 0, bestScore = -1;
        for (let k = 0; k < cs.length; k++) {
          const c = cs[k];
          let sc = 1;
          if (c.kind === 'relic') sc = 4.5;
          else if (c.kind === 'evo') sc = 9;
          else if (c.kind === 'weapon' && c.lvl > 1) sc = 5;
          else if (c.kind === 'weapon') sc = LAMPLIT.player.weapons.length < 4 ? 4 : 0.5;
          else if (c.kind === 'passive') sc = 3;
          else sc = 0.5;
          if (sc > bestScore) { bestScore = sc; best = k; }
        }
        if (isFloor || LAMPLIT.state === 'SHRINE') LAMPLIT.takeRoomCard(best, isFloor);
        else LAMPLIT.applyCard(cs[best]);
        continue;
      }
      if (LAMPLIT.skill.cd <= 0 && LAMPLIT.enemies.length >= 4) LAMPLIT.castSkill();
      const p = LAMPLIT.player, es = LAMPLIT.enemies;
      let bx = 0, by = 0, bd = 1e9, near = 0;
      for (let k = 0; k < es.length; k++) {
        const e = es[k];
        const dx = e.x - p.x, dy = e.y - p.y, d = dx*dx + dy*dy;
        if (d < bd) { bd = d; bx = e.x; by = e.y; }
        if (d < 70*70) near++;
      }
      if (LAMPLIT.boss) {
        const b = LAMPLIT.boss;
        const d = (b.x-p.x)*(b.x-p.x) + (b.y-p.y)*(b.y-p.y);
        if (d < bd) { bd = d; bx = b.x; by = b.y; }
      }
      K['w'] = K['s'] = K['a'] = K['d'] = false;
      const cur = LAMPLIT.room;
      const combat = cur && !cur.cleared;
      if (cur && (!combat || LAMPLIT.roomAlive() === 0)) {
        // 已清场 / 非战斗房：按房间图寻找下一间
        const L = LAMPLIT.level;
        const goal = L.portalRoom || L.bossRoom;
        let wp = goal;
        if (cur !== goal) {
          const adj = {};
          for (let ci = 0; ci < L.corridors.length; ci++) {
            const c = L.corridors[ci];
            (adj[c.a] = adj[c.a] || []).push(c.b);
            (adj[c.b] = adj[c.b] || []).push(c.a);
          }
          const prev = {}; prev[cur.id] = null;
          const qq = [cur.id];
          while (qq.length) {
            const id = qq.shift();
            const nbs = adj[id] || [];
            for (let ni = 0; ni < nbs.length; ni++) {
              if (!(nbs[ni] in prev)) { prev[nbs[ni]] = id; qq.push(nbs[ni]); }
            }
          }
          let id = goal.id;
          if (id in prev) {
            while (prev[id] && prev[id] !== cur.id) id = prev[id];
            for (let ri = 0; ri < L.rooms.length; ri++) if (L.rooms[ri].id === id) wp = L.rooms[ri];
          }
        }
        const tx = wp.x + wp.w / 2, ty = wp.y + wp.h / 2;
        if (tx < p.x - 3) K['a'] = true; else if (tx > p.x + 3) K['d'] = true;
        if (ty < p.y - 3) K['w'] = true; else if (ty > p.y + 3) K['s'] = true;
        if (LAMPLIT.player.dashCd <= 0 && Math.abs(tx - p.x) + Math.abs(ty - p.y) > 120) {
          window.dispatchEvent(new KeyboardEvent('keydown', {key: ' ', bubbles: true}));
          window.dispatchEvent(new KeyboardEvent('keyup', {key: ' ', bubbles: true}));
        }
        LAMPLIT.update(1 / 60);
        continue;
      }
      const pickups = LAMPLIT.pickups;
      let qx = 0, qy = 0, qd = 1e9;
      for (let k = 0; k < pickups.length; k++) {
        const q = pickups[k];
        const d = (q.x-p.x)*(q.x-p.x) + (q.y-p.y)*(q.y-p.y);
        if (d < qd) { qd = d; qx = q.x; qy = q.y; }
      }
      const d = Math.sqrt(bd) || 1;
      if (bd < 115*115) {
        // 垂直切线逃离，并稍微远离
        const tx = -(by - p.y) / d, ty = (bx - p.x) / d;
        let side = 1;
        if (i % 180 < 90) side = -1;
        const mx = tx * side - (bx - p.x) / d * 0.45;
        const my = ty * side - (by - p.y) / d * 0.45;
        if (mx > 0.15) K['d'] = true; else if (mx < -0.15) K['a'] = true;
        if (my > 0.15) K['s'] = true; else if (my < -0.15) K['w'] = true;
        if (d < 34 && LAMPLIT.player.dashCd <= 0) {
          window.dispatchEvent(new KeyboardEvent('keydown', {key: ' ', bubbles: true}));
          window.dispatchEvent(new KeyboardEvent('keyup', {key: ' ', bubbles: true}));
        }
      } else if (qd < 300*300) {
        if (qx < p.x) K['a'] = true; else K['d'] = true;
        if (qy < p.y) K['w'] = true; else K['s'] = true;
      } else {
        const t = i / 60;
        if (Math.sin(t * 0.7) > 0) K['d'] = true; else K['a'] = true;
        if (Math.cos(t * 0.55) > 0) K['s'] = true; else K['w'] = true;
      }
      LAMPLIT.update(1 / 60);
    }
    return { state: LAMPLIT.state, t: +LAMPLIT.runTime.toFixed(1), lvl: LAMPLIT.player.level,
      hp: Math.round(LAMPLIT.player.hp), kills: LAMPLIT.kills, en: LAMPLIT.enemies.length,
      boss: LAMPLIT.boss ? Math.round(LAMPLIT.boss.hp) : null,
      w: LAMPLIT.player.weapons.map(w => w.id + w.lvl).join(','),
      pv: JSON.stringify(LAMPLIT.player.passives),
      px: Math.round(LAMPLIT.player.x), py: Math.round(LAMPLIT.player.y),
      room: LAMPLIT.room ? LAMPLIT.room.id + '/' + LAMPLIT.room.type + '/c' + (LAMPLIT.room.cleared?1:0) + '/w' + LAMPLIT.room.waveIdx : null,
      es: LAMPLIT.enemies.filter(e=>!e.dead).map(e=>e.kind + '@' + Math.round(e.x) + ',' + Math.round(e.y)).join(' '),
      fl: LAMPLIT.floorIdx + '-' + LAMPLIT.levelIdx };
  })()`;

  const step = async (secs, shot) => {
    const t0 = Date.now();
    const r = await h.eval(sim(secs));
    console.log(JSON.stringify(r), 'wall=' + (Date.now() - t0) + 'ms');
    if (shot) await h.shot(shot);
    return r;
  };

  for (let i = 0; i < 20; i++) {
    const shot = [3, 8, 11].includes(i) ? 'shots/bot_' + (i * 30) + 's.png' : null;
    const r = await step(30, shot);
    if (r.state !== 'PLAY') break;
  }
  console.log('final state =', await h.eval('LAMPLIT.state'));
  await h.shot('shots/bot_final.png');
};
