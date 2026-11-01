/* v4.1 验收：奖励关降频 / 入场动画 / 暂停存档 / 房间外锁定修复 */
module.exports = async (h) => {
  await h.goto();
  await h.wait(1200);
  const r1 = await h.eval(`(() => {
    let t = 0, s = 0, rooms = 0;
    for (let f = 0; f < 5; f++) for (let l = 0; l < 10; l++) {
      const L = DUNGEON.level(1234 + f * 31 + l, f, l);
      rooms += L.rooms.length;
      t += L.rooms.filter(r => r.type === 'treasure').length;
      s += L.rooms.filter(r => r.type === 'special').length;
    }
    return { levels: 50, rooms, treasure: t, special: s, perLevel: +(rooms / 50).toFixed(2),
      tPer: +(t / 50).toFixed(2), sPer: +(s / 50).toFixed(2) };
  })()`);
  console.log('reward rooms =', JSON.stringify(r1));

  const r2 = await h.eval(`(() => {
    LAMPLIT.startRun('lamp'); LAMPLIT.setState('PLAY');
    const L = LAMPLIT.level;
    const a = L.rooms.filter(r => r.type === 'fight')[0];
    const b = L.rooms.filter(r => r.id !== a.id)[0];
    LAMPLIT.player.x = a.x + a.w / 2; LAMPLIT.player.y = a.y + a.h / 2;
    LAMPLIT.update(1/60);
    LAMPLIT.clearEnemies();
    nowTarget = 0;
    LAMPLIT.update(1/60);
    return { state: LAMPLIT.state, room: LAMPLIT.room.type, enemies: LAMPLIT.enemies.length };
  })()`);
  console.log('enter fight =', JSON.stringify(r2));

  // 敌人只在同房间被锁定
  const r3 = await h.eval(`(() => {
    const L = LAMPLIT.level;
    const cur = LAMPLIT.room;
    const far = L.rooms.filter(r => r.id !== cur.id)[0];
    const a = LAMPLIT.spawnAt('crawler', cur.x + cur.w/2 + 24, cur.y + cur.h/2, false);
    a.roomId = far.id; a.x = far.x + 30; a.y = far.y + 30; a.spd = 0; a.hp = 999; a.maxHp = 999;
    const b = LAMPLIT.spawnAt('crawler', cur.x + cur.w/2 + 30, cur.y + cur.h/2, false);
    b.spd = 0; b.hp = 999; b.maxHp = 999;
    const farStart = a.hp, sameStart = b.hp;
    for (let i = 0; i < 150; i++) LAMPLIT.update(1/60);
    return { farHurt: a.hp < farStart, sameHurt: b.hp < sameStart, farHp: a.hp, sameHp: b.hp };
  })()`);
  console.log('targeting =', JSON.stringify(r3));

  // 层主入场演出
  const r4 = await h.eval(`(() => {
    LAMPLIT.gotoLevel(0, 9);
    const br = LAMPLIT.level.bossRoom;
    LAMPLIT.player.x = br.x + br.w / 2; LAMPLIT.player.y = br.y + br.h - 50;
    for (let i = 0; i < 6; i++) LAMPLIT.update(1/60);
    return { room: LAMPLIT.room.type, boss: !!LAMPLIT.boss, intro: LAMPLIT.boss ? +LAMPLIT.boss.intro.toFixed(2) : 0, state: LAMPLIT.state };
  })()`);
  console.log('boss cine =', JSON.stringify(r4));
  await h.wait(260);
  await h.shot('shots/final/v41_boss_intro.png');
  await h.wait(2400);
  await h.shot('shots/final/v41_boss_after.png');

  // 暂停 → 保存回主菜单 → 继续
  const r5 = await h.eval(`(() => {
    LAMPLIT.setState('PLAY');
    LAMPLIT.setState('PAUSE');
    const snapBefore = !!(LAMPLIT.save && LAMPLIT.save.run);
    return { state: LAMPLIT.state, snapBefore };
  })()`);
  console.log('pause =', JSON.stringify(r5));
  await h.wait(200);
  await h.shot('shots/final/v41_pause.png');

  const r6 = await h.eval(`(() => {
    // 模拟点「保存并返回主菜单」
    LAMPLIT.pauseAct(1);
    LAMPLIT.update(1/60);
    return { state: LAMPLIT.state, hasSnap: !!(LAMPLIT.save && LAMPLIT.save.run),
      snap: LAMPLIT.save && LAMPLIT.save.run ? { f: LAMPLIT.save.run.floor, l: LAMPLIT.save.run.level, hp: LAMPLIT.save.run.hp } : null };
  })()`);
  console.log('save & quit =', JSON.stringify(r6));
  await h.wait(400);
  await h.shot('shots/final/v41_title_continue.png');

  const r7 = await h.eval(`(() => {
    const ok = LAMPLIT.resumeRun();
    return { ok, state: LAMPLIT.state, floor: LAMPLIT.floorIdx, lvl: LAMPLIT.levelIdx,
      rooms: LAMPLIT.level ? LAMPLIT.level.rooms.length : 0, spawnT: +LAMPLIT.player.spawnT.toFixed(2) };
  })()`);
  console.log('resume =', JSON.stringify(r7));
  await h.wait(500);
  await h.shot('shots/final/v41_resume.png');
};
