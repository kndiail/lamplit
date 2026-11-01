module.exports = async (h) => {
  await h.goto(); await h.wait(1600);
  const r = await h.eval(`(() => {
    LAMPLIT.clearRunSnapshot();
    const before = LAMPLIT.save.unlocked.slice();
    LAMPLIT.startRun('lamp'); LAMPLIT.setState('PLAY');
    LAMPLIT.gotoLevel(0, 1);
    const br = LAMPLIT.level.bossRoom;
    LAMPLIT.player.x = br.x + br.w / 2; LAMPLIT.player.y = br.y + br.h - 50;
    for (let i = 0; i < 8; i++) LAMPLIT.update(1/60);
    if (LAMPLIT.boss) LAMPLIT.boss.intro = 0;
    LAMPLIT.hurtBoss(999999);
    for (let i = 0; i < 12; i++) LAMPLIT.update(1/60);
    return { before: before, after: LAMPLIT.save.unlocked.slice(),
      has: LAMPLIT.save.unlocked.indexOf('grave') >= 0 };
  })()`);
  console.log('unlock =', JSON.stringify(r));
  await h.wait(300);
  await h.shot('shots/final/v52_unlock.png');
};
