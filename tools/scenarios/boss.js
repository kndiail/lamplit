/* Boss 与结算界面视觉检查 */
module.exports = async (h) => {
  await h.goto();
  await h.wait(400);
  await h.eval("(() => { try { LAMPLIT.finishStory(); } catch (e) {} if (LAMPLIT.state === 'STORY') LAMPLIT.setState('TITLE'); try { LAMPLIT.save.lore.prologue = true; } catch (e) {} return 1; })()");

  await h.wait(1200);
  await h.key(' ');
  await h.wait(200);

  // 直接进入 boss1 战
  await h.eval(`(() => {
    LAMPLIT.player.hp = LAMPLIT.player.maxHp;
    LAMPLIT.setTime(152);
    LAMPLIT.forceBoss(1);
    for (let i = 0; i < 90; i++) LAMPLIT.update(1/60);
    return LAMPLIT.boss ? LAMPLIT.boss.hp : 'none';
  })()`);
  await h.wait(400);
  await h.shot('shots/boss1.png');
  const p1 = await h.eval(`(() => { const b = LAMPLIT.boss; const lp = LAMPLIT.lanternPos(); return { bx: b.x, by: b.y, px: LAMPLIT.player.x, py: LAMPLIT.player.y }; })()`);
  console.log('pos1', JSON.stringify(p1));
  await h.eval(`LAMPLIT.boss.x = LAMPLIT.player.x + 52; LAMPLIT.boss.y = LAMPLIT.player.y - 14; LAMPLIT.boss.intro = 0; for (let i=0;i<4;i++) LAMPLIT.update(1/60);`);
  await h.wait(300);
  await h.shot('shots/boss1_near.png');
  await h.shotClip('shots/boss1_zoom.png', 176, 74, 96, 84, 10);

  // 击杀 boss1
  await h.eval(`(() => {
    const b = LAMPLIT.boss;
    b.intro = 0;
    LAMPLIT.hurtBoss(99999);
    for (let i = 0; i < 20; i++) LAMPLIT.update(1/60);
    return LAMPLIT.state;
  })()`);
  await h.wait(300);
  await h.shot('shots/boss1_dead.png');

  // boss2
  await h.eval(`(() => {
    LAMPLIT.setTime(303);
    LAMPLIT.forceBoss(2);
    for (let i = 0; i < 120; i++) LAMPLIT.update(1/60);
    return LAMPLIT.boss ? LAMPLIT.boss.hp : 'none';
  })()`);
  await h.wait(400);
  await h.shot('shots/boss2.png');
  await h.eval('LAMPLIT.boss.x = LAMPLIT.player.x + 40; LAMPLIT.boss.y = LAMPLIT.player.y - 10; LAMPLIT.update(1/60)');
  await h.wait(300);
  await h.shot('shots/boss2_near.png');
  await h.shotClip('shots/boss2_zoom.png', 168, 66, 110, 96, 9);

  // 胜利
  await h.eval(`(() => {
    const b = LAMPLIT.boss; b.intro = 0;
    LAMPLIT.hurtBoss(99999);
    for (let i = 0; i < 30; i++) LAMPLIT.update(1/60);
    return LAMPLIT.state;
  })()`);
  await h.wait(600);
  console.log('state after win =', await h.eval('LAMPLIT.state'));
  await h.shot('shots/win.png');

  // 重开确认解锁
  console.log('save =', await h.eval('localStorage.getItem("lamplit.save.v1")'));
};
