/* 综合检查：标题 / 升级 / 暂停 / 胜利 布局 + 帧率 */
module.exports = async (h) => {
  await h.goto();
  await h.wait(400);
  await h.eval("(() => { try { LAMPLIT.finishStory(); } catch (e) {} if (LAMPLIT.state === 'STORY') LAMPLIT.setState('TITLE'); try { LAMPLIT.save.lore.prologue = true; } catch (e) {} return 1; })()");

  await h.wait(1300);
  await h.shot('shots/ui_title.png');
  console.log('title state', await h.eval('LAMPLIT.state'));

  await h.key(' ');
  await h.wait(400);

  // 帧率：密集战斗
  const fps = await h.eval(`(async () => {
    for (let i = 0; i < 60 * 40; i++) { if (LAMPLIT.state === 'LEVELUP') LAMPLIT.applyCard(LAMPLIT.cards[0]); else LAMPLIT.update(1/60); }
    let frames = 0; const t0 = performance.now();
    await new Promise((res) => {
      const tick = () => { frames++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else res(); };
      requestAnimationFrame(tick);
    });
    const drawMs = [];
    for (let i = 0; i < 60; i++) {
      const s = performance.now(); LAMPLIT.render(); drawMs.push(performance.now() - s);
    }
    drawMs.sort((a,b)=>a-b);
    return { fps: Math.round(frames / 2), enemies: LAMPLIT.enemies.length, drawMed: +drawMs[30].toFixed(2), drawMax: +drawMs[59].toFixed(2) };
  })()`);
  console.log('perf', JSON.stringify(fps));

  // 升级界面
  await h.eval('LAMPLIT.player.xp += 500; if (LAMPLIT.state === "PLAY") LAMPLIT.update(1/60)');
  await h.wait(400);
  console.log('state', await h.eval('LAMPLIT.state'));
  await h.shot('shots/ui_levelup.png');
  await h.key('1');
  await h.wait(200);

  // 暂停
  await h.key('Escape');
  await h.wait(300);
  await h.shot('shots/ui_pause.png');
  await h.key('Escape');
  await h.wait(200);

  // 胜利界面（保留）
  await h.eval(`(() => {
    LAMPLIT.setTime(300);
    LAMPLIT.forceBoss(2);
    for (let i = 0; i < 10; i++) LAMPLIT.update(1/60);
    LAMPLIT.boss.intro = 0;
    LAMPLIT.hurtBoss(999999);
    for (let i = 0; i < 10; i++) LAMPLIT.update(1/60);
    return LAMPLIT.state;
  })()`);
  await h.wait(700);
  console.log('win state', await h.eval('LAMPLIT.state'));
  await h.shot('shots/ui_win.png');
};
