/* 展示：新敌人 + 圣物 HUD + 技能 + 宝箱 */
module.exports = async (h) => {
  await h.goto();
  await h.wait(1400);
  await h.eval("(() => { try { LAMPLIT.finishStory(); } catch(e){} LAMPLIT.setState('TITLE'); return 1; })()");

  await h.eval(`(() => {
    LAMPLIT.startRun('grave');
    LAMPLIT.setState('PLAY');
    const p = LAMPLIT.player;
    p.weapons.push({ id: 'bell', lvl: 3, t: 0, ang: 0 });
    p.weapons.push({ id: 'frost', lvl: 2, t: 0, ang: 0 });
    p.weapons.push({ id: 'orbit', lvl: 2, t: 0, ang: 0 });
    ['thunder', 'lens', 'fang', 'hearth'].forEach(id => LAMPLIT.giveRelic(id));
    p.passives = { blade: 2, rhythm: 2, thorns: 1 };
    LAMPLIT.setTime(96);
    const types = ['archer', 'bomber', 'shade', 'leech', 'summoner', 'brute', 'ghost', 'bat'];
    types.forEach((t, i) => {
      const a = (i / types.length) * Math.PI * 2;
      LAMPLIT.spawnAt(t, p.x + Math.cos(a) * (34 + i * 3), p.y + Math.sin(a) * (26 + i * 2), i % 4 === 0);
    });
    for (let i = 0; i < 6; i++) LAMPLIT.spawnAt('crawler', p.x + (Math.random() - 0.5) * 90, p.y + (Math.random() - 0.5) * 60, false);
    p.xp = 0; p.xpNeed = 999;
    for (let i = 0; i < 90; i++) LAMPLIT.update(1/60);
    while (LAMPLIT.state === 'LEVELUP') LAMPLIT.applyCard(LAMPLIT.cards[0]);
    LAMPLIT.castSkill();
    for (let i = 0; i < 10; i++) LAMPLIT.update(1/60);
    LAMPLIT.spawnChestAt = null;
    return { enemies: LAMPLIT.enemies.length, relics: LAMPLIT.relics, t: +LAMPLIT.runTime.toFixed(1) };
  })()`);
  await h.wait(500);
  await h.shot('shots/final/v2_gameplay.png');

  // 宝箱在场景中
  await h.eval(`(() => {
    const p = LAMPLIT.player;
    LAMPLIT.spawnChest();
    for (let i = 0; i < 5; i++) LAMPLIT.update(1/60);
    return LAMPLIT.state;
  })()`);
  await h.wait(300);
  await h.shot('shots/final/v2_chest_world.png');
  console.log('done');
};
