module.exports = async (h) => {
  await h.goto(); await h.wait(1500);
  const r = await h.eval(`(() => {
    LAMPLIT.clearRunSnapshot();
    LAMPLIT.startRun('lamp'); LAMPLIT.setState('PLAY');
    LAMPLIT.gotoLevel(0, 1);
    const br = LAMPLIT.level.bossRoom;
    LAMPLIT.player.x = br.x + br.w / 2; LAMPLIT.player.y = br.y + br.h - 50;
    for (let i = 0; i < 8; i++) LAMPLIT.update(1/60);
    const b = LAMPLIT.boss;
    b.intro = 0;
    b.x = br.x + 18; b.y = br.y + 18;
    LAMPLIT.summonTest(10);
    const es = LAMPLIT.enemies;
    let bad = 0;
    for (const e of es) {
      if (e.x < br.x || e.x > br.x + br.w || e.y < br.y || e.y > br.y + br.h) bad++;
    }
    // 召唤师贴墙产怪
    const sm = LAMPLIT.spawnAt('summoner', br.x + 20, br.y + 20, false);
    if (sm) { sm.spawnT = 0; sm.sumT = 0; }
    for (let i = 0; i < 40; i++) LAMPLIT.update(1/60);
    let bad2 = 0;
    for (const e of LAMPLIT.enemies) {
      if (e.x < br.x || e.x > br.x + br.w || e.y < br.y || e.y > br.y + br.h) bad2++;
    }
    return { total: LAMPLIT.enemies.length, badBossAdds: bad, badSummoner: bad2 };
  })()`);
  console.log('minions =', JSON.stringify(r));
};
