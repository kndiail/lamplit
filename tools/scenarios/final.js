/* 截图：标题 / 对局 / 升级 / 层主 / 通关 / 阵亡 */
module.exports = async (h) => {
  await h.goto();
  await h.wait(1400);
  await h.eval("(() => { try { LAMPLIT.finishStory(); } catch(e){} LAMPLIT.setState('TITLE'); return 1; })()");
  await h.wait(400);
  await h.shot('shots/final/title.png');

  // 对局画面（给一点强度，避免脚本被打死）
  await h.eval(`(() => {
    LAMPLIT.startRun('lamp');
    LAMPLIT.setState('PLAY');
    const p = LAMPLIT.player;
    p.weapons.push({ id: 'bell', lvl: 1, t: 0, ang: 0 });
    p.weapons.push({ id: 'frost', lvl: 1, t: 0, ang: 0 });
    p.passives = { blade: 1, rhythm: 1 };
    const r = LAMPLIT.room;
    LAMPLIT.giveRelic('thunder');
    for (let i = 0; i < 3; i++) {
      LAMPLIT.spawnAt('crawler', r.rect.w * 0.3 + i * 40, r.rect.y + 80, false);
    }
    LAMPLIT.spawnAt('bat', r.rect.w * 0.7, r.rect.y + 70, false);
    for (let i = 0; i < 90; i++) {
      if (LAMPLIT.state !== 'PLAY') break;
      LAMPLIT.update(1/60);
    }
    return LAMPLIT.state;
  })()`);
  await h.wait(400);
  await h.shot('shots/final/gameplay.png');

  // 升级卡
  await h.eval(`(() => {
    const p = LAMPLIT.player;
    p.xp = 0; p.xpNeed = 1;
    LAMPLIT.update(1/60);
    return LAMPLIT.state;
  })()`);
  await h.eval(`(() => { const p = LAMPLIT.player; p.xp = p.xpNeed; LAMPLIT.update(1/60); return LAMPLIT.state; })()`);
  await h.wait(500);
  await h.shot('shots/final/levelup.png');

  // 第 1 层层主
  await h.eval(`(() => {
    while (['LEVELUP','CHEST','SHRINE','BOON'].includes(LAMPLIT.state)) LAMPLIT.takeRoomCard(0, LAMPLIT.state === 'BOON');
    LAMPLIT.gotoRoom(0, 9);
    LAMPLIT.player.hp = LAMPLIT.player.maxHp;
    for (let i = 0; i < 40; i++) LAMPLIT.update(1/60);
    return LAMPLIT.boss ? Math.round(LAMPLIT.boss.hp) : 0;
  })()`);
  await h.wait(500);
  await h.shot('shots/final/boss1.png');

  // 第 2 层层主
  await h.eval(`(() => {
    while (['LEVELUP','CHEST','SHRINE','BOON'].includes(LAMPLIT.state)) LAMPLIT.takeRoomCard(0, LAMPLIT.state === 'BOON');
    LAMPLIT.gotoRoom(1, 9);
    LAMPLIT.player.hp = LAMPLIT.player.maxHp;
    for (let i = 0; i < 40; i++) LAMPLIT.update(1/60);
    return LAMPLIT.boss ? Math.round(LAMPLIT.boss.hp) : 0;
  })()`);
  await h.wait(500);
  await h.shot('shots/final/boss2.png');

  // 通关：第 5 层层主房 → 清场 → 进门
  await h.eval(`(() => {
    while (['LEVELUP','CHEST','SHRINE','BOON'].includes(LAMPLIT.state)) LAMPLIT.takeRoomCard(0, LAMPLIT.state === 'BOON');
    LAMPLIT.gotoRoom(4, 9);
    LAMPLIT.player.hp = LAMPLIT.player.maxHp;
    LAMPLIT.clearEnemies();
    for (let i = 0; i < 30; i++) LAMPLIT.update(1/60);
    const r = LAMPLIT.room;
    LAMPLIT.player.x = r.portal.x;
    LAMPLIT.player.y = r.portal.y;
    for (let i = 0; i < 14; i++) LAMPLIT.update(1/60);
    return LAMPLIT.state;
  })()`);
  await h.wait(700);
  console.log('win =', await h.eval('LAMPLIT.state'));
  await h.shot('shots/final/win.png');

  // 阵亡画面
  await h.eval(`(() => {
    LAMPLIT.startRun('lamp');
    LAMPLIT.setState('PLAY');
    LAMPLIT.setTime(96);
    const p = LAMPLIT.player;
    p.hp = 1;
    const r = LAMPLIT.room;
    LAMPLIT.spawnAt('brute', p.x + 6, p.y + 4, false);
    for (let i = 0; i < 20; i++) LAMPLIT.update(1/60);
    return LAMPLIT.state;
  })()`);
  await h.wait(700);
  await h.shot('shots/final/dead.png');
};
