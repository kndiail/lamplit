/* 元系统验收：图鉴 / 成就 / 每日挑战 / 精英王冠 */
module.exports = async (h) => {
  await h.goto();
  await h.wait(400);
  await h.eval("(() => { try { LAMPLIT.finishStory(); } catch (e) {} if (LAMPLIT.state === 'STORY') LAMPLIT.setState('TITLE'); try { LAMPLIT.save.lore.prologue = true; } catch (e) {} return 1; })()");

  await h.wait(1400);

  // 先制造一些解锁数据
  await h.eval(`(() => {
    LAMPLIT.startRun('lamp');
    LAMPLIT.setState('PLAY');
    const p = LAMPLIT.player;
    const types = ['crawler','bat','wisp','spitter','ghost','brute'];
    for (const t of types) LAMPLIT.spawnAt(t, p.x + 40, p.y, false);
    for (let i = 0; i < 30; i++) LAMPLIT.update(1/60);
    LAMPLIT.applyCard({ kind: 'weapon', id: 'orbit', lvl: 1 });
    LAMPLIT.applyCard({ kind: 'weapon', id: 'ember', lvl: 1 });
    LAMPLIT.applyCard({ kind: 'passive', id: 'vitality', lvl: 1 });
    LAMPLIT.applyCard({ kind: 'passive', id: 'blade', lvl: 1 });
    LAMPLIT.applyCard({ kind: 'weapon', id: 'spark', lvl: 1 });
    return LAMPLIT.codexProgress();
  })()`);
  console.log('codex after play =', JSON.stringify(await h.eval('LAMPLIT.codexProgress()')));

  // 图鉴：敌人
  await h.eval("LAMPLIT.openCodex(0); LAMPLIT.codexSel = 3;");
  await h.wait(500);
  await h.shot('shots/final/codex_enemies.png');

  // 图鉴：武器
  await h.eval("LAMPLIT.openCodex(1); LAMPLIT.codexSel = 1;");
  await h.wait(400);
  await h.shot('shots/final/codex_weapons.png');

  // 图鉴：成就
  await h.eval("LAMPLIT.openCodex(3); LAMPLIT.codexSel = 0;");
  await h.wait(400);
  await h.shot('shots/final/codex_ach.png');

  // 每日挑战界面
  await h.eval("LAMPLIT.setState('TITLE')");
  await h.wait(200);
  await h.eval("LAMPLIT.openDaily()");
  await h.wait(500);
  console.log('daily cfg =', JSON.stringify(await h.eval('(() => { const d = LAMPLIT.dailyPreview; return d ? {key:d.key, seed:d.seed, char:d.char, mods:d.mods.map(m=>m.id)} : null; })()')));
  await h.shot('shots/final/daily.png');

  // 开始每日挑战，验证修正生效
  const res = await h.eval(`(() => {
    const cfg = LAMPLIT.startDaily();
    const p = LAMPLIT.player;
    const before = { hp: p.maxHp, light: +p.st.light.toFixed(2) };
    for (let i = 0; i < 120; i++) LAMPLIT.update(1/60);
    return { mode: LAMPLIT.mode, key: LAMPLIT.daily.key, char: LAMPLIT.player.charId,
      maxHp: p.maxHp, light: +p.st.light.toFixed(2), before, t: +LAMPLIT.runTime.toFixed(1) };
  })()`);
  console.log('daily run =', JSON.stringify(res));
  await h.wait(300);
  await h.shot('shots/final/daily_run.png');

  // 成就提示 + 精英王冠（先清空成就，保证有提示可看）
  await h.eval(`(() => {
    Object.keys(LAMPLIT.save.ach).forEach(k => delete LAMPLIT.save.ach[k]);
    LAMPLIT.startRun('lamp');
    LAMPLIT.setState('PLAY');
    const p = LAMPLIT.player;
    LAMPLIT.spawnAt('brute', p.x + 46, p.y - 4, true);
    LAMPLIT.spawnAt('crawler', p.x - 42, p.y + 14, true);
    for (let i = 0; i < 10; i++) LAMPLIT.update(1/60);
    LAMPLIT.meta.ACHIEVEMENTS.slice(0, 2).forEach(a => LAMPLIT.toast(a.id));
    for (let i = 0; i < 6; i++) LAMPLIT.update(1/60);
    return LAMPLIT.toasts.length;
  })()`);
  await h.wait(600);
  console.log('toasts =', await h.eval('JSON.stringify(LAMPLIT.toasts.map(t=>t.id))'));
  await h.shot('shots/final/toast_elite.png');

  // 结算界面（含成就与日挑分数）
  await h.eval(`(() => {
    const p = LAMPLIT.player;
    p.hp = 1;
    for (let i = 0; i < 240 && LAMPLIT.state === 'PLAY'; i++) {
      LAMPLIT.spawnAt('crawler', p.x + 2, p.y + 2, false);
      LAMPLIT.update(1/60);
    }
    return LAMPLIT.state;
  })()`);
  await h.wait(700);
  await h.shot('shots/final/end_ach.png');
  console.log('ach total =', await h.eval('LAMPLIT.achCount()'));
  console.log('saved ach =', await h.eval('JSON.stringify(Object.keys(LAMPLIT.save.ach))'));
};
