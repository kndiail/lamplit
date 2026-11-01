/* v2 内容验收：新敌人 / 新武器 / 圣物宝箱 / 主动技能 / 进化 / BOSS 二阶段 / 剧情 / 无尽 */
module.exports = async (h) => {
  await h.goto();
  await h.wait(1500);

  // 跳过序章
  await h.eval("(() => { LAMPLIT.finishStory ? LAMPLIT.finishStory() : null; LAMPLIT.setState('TITLE'); })()");
  await h.wait(200);
  await h.eval("(() => { const s = LAMPLIT.save; s.lore.prologue = true; LAMPLIT.story.ensure(s); return s.lore; })()");

  // 序章截图（重新打开）
  await h.eval("LAMPLIT.openStory(LAMPLIT.story.prologue.map(p=>({title:p.title, lines:p.lines})))");
  await h.wait(1200);
  await h.shot('shots/final/story_prologue.png');
  await h.eval("LAMPLIT.setState('TITLE')");

  // 开局 + 新武器
  const res = await h.eval(`(() => {
    LAMPLIT.startRun('lamp');
    LAMPLIT.setState('PLAY');
    const p = LAMPLIT.player;
    LAMPLIT.applyCard({ kind: 'weapon', id: 'bell', lvl: 1 });
    LAMPLIT.applyCard({ kind: 'weapon', id: 'spear', lvl: 1 });
    LAMPLIT.applyCard({ kind: 'weapon', id: 'frost', lvl: 1 });
    const types = ['archer','leech','bomber','shade','summoner'];
    types.forEach((t,i) => LAMPLIT.spawnAt(t, p.x + 40 + i*14, p.y + (i%2?18:-18), false));
    for (let i = 0; i < 240; i++) LAMPLIT.update(1/60);
    return { weapons: p.weapons.map(w=>w.id+':'+w.lvl), enemies: LAMPLIT.enemies.length, kills: LAMPLIT.kills, t: +LAMPLIT.runTime.toFixed(1) };
  })()`);
  console.log('new content =', JSON.stringify(res));
  await h.wait(300);
  await h.shot('shots/final/v2_weapons.png');

  // 主动技能
  const skill = await h.eval(`(() => {
    const p = LAMPLIT.player;
    const before = p.skill.cd;
    while (LAMPLIT.state === 'LEVELUP') LAMPLIT.applyCard(LAMPLIT.cards[0]);
    LAMPLIT.castSkill();
    LAMPLIT.update(1/60);
    return { cdBefore: before, cdAfter: +p.skill.cd.toFixed(1), max: p.skill.max, enemies: LAMPLIT.enemies.length };
  })()`);
  console.log('skill =', JSON.stringify(skill));
  await h.wait(200);
  await h.shot('shots/final/v2_skill.png');

  // 圣物宝箱
  const chest = await h.eval(`(() => {
    while (LAMPLIT.state === 'LEVELUP') LAMPLIT.applyCard(LAMPLIT.cards[0]);
    LAMPLIT.spawnChest();
    const p = LAMPLIT.player;
    p.x = LAMPLIT.chest.x; p.y = LAMPLIT.chest.y;
    while (LAMPLIT.state === 'LEVELUP') LAMPLIT.applyCard(LAMPLIT.cards[0]);
    LAMPLIT.update(1/60);
    return { state: LAMPLIT.state, cards: LAMPLIT.cards.map(c => c.kind + ':' + c.id) };
  })()`);
  console.log('chest =', JSON.stringify(chest));
  await h.wait(400);
  await h.shot('shots/final/v2_chest.png');
  const relicDone = await h.eval(`(() => {
    LAMPLIT.applyCard(LAMPLIT.cards[0]);
    return { state: LAMPLIT.state, relics: LAMPLIT.relics, hp: LAMPLIT.player.hp };
  })()`);
  console.log('relic taken =', JSON.stringify(relicDone));

  // 进化
  const evo = await h.eval(`(() => {
    LAMPLIT.startRun('lamp');
    LAMPLIT.setState('PLAY');
    const p = LAMPLIT.player;
    p.weapons[0].lvl = 5;
    p.passives['rhythm'] = 3;
    LAMPLIT.openCodex ? null : null;
    // 直接触发进化卡
    LAMPLIT.evolve('stormbolt');
    for (let i = 0; i < 120; i++) LAMPLIT.update(1/60);
    return { weapons: p.weapons.map(w => w.id + ':' + w.lvl), evolved: Object.keys(p.evolved) };
  })()`);
  console.log('evolution =', JSON.stringify(evo));
  await h.wait(300);
  await h.shot('shots/final/v2_evolve.png');

  // BOSS 二阶段 + 台词
  const boss = await h.eval(`(() => {
    LAMPLIT.startRun('lamp');
    LAMPLIT.setState('PLAY');
    LAMPLIT.setTime(150);
    LAMPLIT.forceBoss(1);
    for (let i = 0; i < 200; i++) LAMPLIT.update(1/60);
    const q1 = LAMPLIT.quote ? LAMPLIT.quote.name : null;
    const hp0 = LAMPLIT.boss ? LAMPLIT.boss.hp : 0;
    LAMPLIT.hurtBoss(Math.ceil(hp0 * 0.6));
    for (let i = 0; i < 30; i++) LAMPLIT.update(1/60);
    return { quote: q1, phase: LAMPLIT.boss ? LAMPLIT.boss.phase : 0, quote2: LAMPLIT.quote ? LAMPLIT.quote.name : null };
  })()`);
  console.log('boss phase =', JSON.stringify(boss));
  await h.wait(300);
  await h.shot('shots/final/v2_boss_phase2.png');

  // 图鉴故事页
  await h.eval("LAMPLIT.setState('TITLE'); LAMPLIT.openCodex(4); LAMPLIT.codexSel = 1;");
  await h.wait(400);
  await h.shot('shots/final/v2_codex_story.png');

  // 无尽
  const end = await h.eval(`(() => {
    LAMPLIT.startRun('lamp');
    LAMPLIT.setState('WIN');
    LAMPLIT.startEndless();
    for (let i = 0; i < 60 * 40; i++) LAMPLIT.update(1/60);
    return { state: LAMPLIT.state, endless: LAMPLIT.endless, t: +LAMPLIT.runTime.toFixed(1), boss: !!LAMPLIT.boss, tier: LAMPLIT.boss ? LAMPLIT.boss.tier : -1 };
  })()`);
  console.log('endless =', JSON.stringify(end));
  await h.wait(300);
  await h.shot('shots/final/v2_endless.png');
  console.log('fragments =', await h.eval('JSON.stringify(Object.keys(LAMPLIT.save.lore))'));
  console.log('lore seen =', await h.eval('JSON.stringify(LAMPLIT.save.lore.seen)'));
};
