/* v4.4 验收（第三批）：神器单槽 / BOSS 难度 / 性能 */
module.exports = async (h) => {
  await h.goto();
  await h.wait(1400);

  const relic = await h.eval(`(() => {
    LAMPLIT.clearRunSnapshot();
    LAMPLIT.startRun('lamp'); LAMPLIT.setState('PLAY');
    const p = LAMPLIT.player;
    const light0 = +p.st.light.toFixed(3);
    LAMPLIT.giveRelic('lens', 1);
    const light1 = +p.st.light.toFixed(3);
    LAMPLIT.giveRelic('greed', 1);
    const after = { relics: LAMPLIT.relics.slice(), store: (p.relicStore || []).slice(), lvl: p.relicLvl,
      light: +p.st.light.toFixed(3), light0, xp: +p.st.xp.toFixed(3) };
    LAMPLIT.giveRelic('greed', 2);
    after.lvl2 = p.relicLvl;
    LAMPLIT.giveRelic('greed', 3);
    after.lvl3 = p.relicLvl;
    LAMPLIT.giveRelic('greed', 3);
    after.lvlCap = p.relicLvl;
    return after;
  })()`);
  console.log('relic =', JSON.stringify(relic));

  const boss = await h.eval(`(() => {
    LAMPLIT.setState('PLAY');
    LAMPLIT.gotoLevel(0, 9);
    let br = LAMPLIT.level.bossRoom;
    LAMPLIT.player.x = br.x + br.w/2; LAMPLIT.player.y = br.y + br.h - 50;
    for (let i = 0; i < 6; i++) LAMPLIT.update(1/60);
    const hp0 = Math.round(LAMPLIT.boss.hp);
    LAMPLIT.gotoLevel(4, 9);
    br = LAMPLIT.level.bossRoom;
    LAMPLIT.player.x = br.x + br.w/2; LAMPLIT.player.y = br.y + br.h - 50;
    for (let i = 0; i < 6; i++) LAMPLIT.update(1/60);
    const hp4 = Math.round(LAMPLIT.boss.hp);
    return { f0: hp0, f4: hp4, ratio: +(hp4/hp0).toFixed(2), dmg: Math.round(LAMPLIT.boss.dmg * 10)/10 };
  })()`);
  console.log('boss =', JSON.stringify(boss));

  const perf = await h.eval(`(() => {
    LAMPLIT.gotoLevel(0, 1);
    const L = LAMPLIT.level;
    const cur = LAMPLIT.room;
    for (let i = 0; i < 26; i++) {
      LAMPLIT.spawnAt('bat', cur.x + 40 + Math.random() * 300, cur.y + 40 + Math.random() * 130, i % 4 === 0);
    }
    for (let i = 0; i < 40; i++) LAMPLIT.castSkill();
    // 用真实渲染测 60 帧
    const t0 = performance.now();
    for (let i = 0; i < 60; i++) LAMPLIT.render();
    const ms = (performance.now() - t0) / 60;
    return { enemies: LAMPLIT.enemies.length, ms: +ms.toFixed(2) };
  })()`);
  console.log('perf =', JSON.stringify(perf));

  await h.wait(400);
  await h.shot('shots/final/v44_perf.png');
};
