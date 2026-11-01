/* 40 血 / 层主节奏验收 */
module.exports = async (h) => {
  await h.goto(); await h.wait(1600);
  const r = await h.eval(`(() => {
    LAMPLIT.clearRunSnapshot();
    const hps = [];
    ['lamp', 'grave', 'ranger'].forEach(function (c) {
      LAMPLIT.startRun(c); LAMPLIT.setState('PLAY');
      hps.push({ c: c, hp: LAMPLIT.player.hp, max: LAMPLIT.player.maxHp });
    });
    LAMPLIT.startRun('lamp'); LAMPLIT.setState('PLAY');
    LAMPLIT.gotoLevel(0, 1);
    const br = LAMPLIT.level.bossRoom;
    LAMPLIT.player.x = br.x + br.w / 2; LAMPLIT.player.y = br.y + br.h - 50;
    for (let i = 0; i < 8; i++) LAMPLIT.update(1/60);
    const b = LAMPLIT.boss;
    b.intro = 0;
    let acts = 0, last = null, firstAt = -1;
    for (let f = 0; f < 1800; f++) {
      LAMPLIT.player.iframe = 999;
      LAMPLIT.update(1/60);
      if (b.act && b.actId !== last) { if (firstAt < 0) firstAt = f; acts++; last = b.actId; }
      if (!b.act) last = null;
    }
    return { hps: hps, attacksIn30s: acts, firstActFrame: firstAt };
  })()`);
  console.log('hard =', JSON.stringify(r));
};
