/* 每日挑战结算与存档回归 */
module.exports = async (h) => {
  await h.goto();
  await h.wait(400);
  await h.eval("(() => { try { LAMPLIT.finishStory(); } catch (e) {} if (LAMPLIT.state === 'STORY') LAMPLIT.setState('TITLE'); try { LAMPLIT.save.lore.prologue = true; } catch (e) {} return 1; })()");

  await h.wait(1500);

  // 清掉今天的记录，保证可测
  await h.eval(`(() => {
    const s = LAMPLIT.save;
    const k = LAMPLIT.meta.dailyKey();
    delete s.daily.best[k];
    return k;
  })()`);

  const cfg = await h.eval(`(() => {
    const c = LAMPLIT.startDaily();
    return { key: c.key, char: c.char, mods: c.mods.map(m => m.id) };
  })()`);
  console.log('daily start =', JSON.stringify(cfg));

  // 跑 25 秒并击杀一些敌人，再强制结束
  await h.eval(`(() => {
    const p = LAMPLIT.player;
    for (let i = 0; i < 1500; i++) {
      if (i % 60 === 0) LAMPLIT.spawnAt('crawler', p.x + 24, p.y, false);
      LAMPLIT.update(1/60);
      if (LAMPLIT.state !== 'PLAY') { LAMPLIT.setState('PLAY'); }
    }
    return { t: +LAMPLIT.runTime.toFixed(1), k: LAMPLIT.kills };
  })()`);
  await h.wait(200);

  const end = await h.eval(`(() => {
    const p = LAMPLIT.player;
    p.hp = 1;
    let guard = 0;
    while (LAMPLIT.state === 'PLAY' && guard++ < 900) {
      LAMPLIT.spawnAt('crawler', p.x + 3, p.y + 3, false);
      LAMPLIT.update(1/60);
    }
    const s = LAMPLIT.save;
    const k = LAMPLIT.meta.dailyKey();
    return {
      state: LAMPLIT.state,
      dailyBest: s.daily.best[k] || 0,
      cleared: s.daily.cleared.slice(-2),
      ach: Object.keys(s.ach),
      totals: s.totals,
      progress: LAMPLIT.codexProgress(),
    };
  })()`);
  console.log('daily end =', JSON.stringify(end));
  await h.wait(600);
  await h.shot('shots/final/daily_end.png');

  // 回标题看成就/图鉴计数
  await h.eval("LAMPLIT.setState('TITLE')");
  await h.wait(400);
  await h.shot('shots/final/title_meta.png');
};
