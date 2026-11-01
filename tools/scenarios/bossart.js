/* 层主门锁 / 升级速度 / 12 套造型验收 */
module.exports = async (h) => {
  await h.goto(); await h.wait(1600);
  const r = await h.eval(`(() => {
    LAMPLIT.clearRunSnapshot();
    LAMPLIT.startRun('lamp'); LAMPLIT.setState('PLAY');
    LAMPLIT.gotoLevel(0, 1);
    const br = LAMPLIT.level.bossRoom;
    LAMPLIT.player.x = br.x + br.w / 2; LAMPLIT.player.y = br.y + br.h - 50;
    for (let i = 0; i < 10; i++) LAMPLIT.update(1/60);
    const locked = LAMPLIT.doorLockedNow;
    const frames = LAMPLIT.boss && LAMPLIT.boss.spr ? LAMPLIT.boss.spr.length : 0;
    if (LAMPLIT.boss) LAMPLIT.boss.intro = 0;
    LAMPLIT.hurtBoss(999999);
    for (let i = 0; i < 200; i++) {
      if (LAMPLIT.state === 'LEVELUP') { while (LAMPLIT.state === 'LEVELUP' && LAMPLIT.cards.length) LAMPLIT.applyCard(LAMPLIT.cards[0]); LAMPLIT.setState('PLAY'); }
      LAMPLIT.update(1/60);
    }
    return { locked, frames, after: LAMPLIT.doorLockedNow,
      xp: [LAMPLIT.xpNeedFor(1), LAMPLIT.xpNeedFor(5), LAMPLIT.xpNeedFor(10)] };
  })()`);
  console.log('lock/xp =', JSON.stringify(r));

  for (const idx of [0, 3, 7, 9, 11]) {
    await h.eval(`(() => {
      LAMPLIT.setState('PLAY');
      if (!LAMPLIT.level) LAMPLIT.gotoLevel(0, 1);
      if (!LAMPLIT.room || LAMPLIT.room.type !== 'boss') LAMPLIT.gotoLevel(0, 1);
      const br = LAMPLIT.level.bossRoom;
      if (br) { LAMPLIT.player.x = br.x + br.w / 2; LAMPLIT.player.y = br.y + br.h - 50; }
      LAMPLIT.spawnBossIndex(${idx});
      LAMPLIT.boss.intro = 0;
      LAMPLIT.cine = null;
      for (let i = 0; i < 20; i++) LAMPLIT.update(1/60);
      return 1;
    })()`);
    await h.wait(250);
    await h.shot('shots/final/v51_boss' + idx + '.png');
  }
};
