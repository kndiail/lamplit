/* v4.6：主菜单重排 + 音游 PERFECT/失败 双分支 */
module.exports = async (h) => {
  await h.goto(); await h.wait(1600);
  await h.eval("(() => { LAMPLIT.clearRunSnapshot(); LAMPLIT.setState('TITLE'); return 1; })()");
  await h.wait(400);
  await h.shot('shots/final/v46_title.png');

  const enter = await h.eval(`(() => {
    LAMPLIT.startRun('lamp'); LAMPLIT.setState('PLAY');
    LAMPLIT.gotoLevel(2, 1);
    const br = LAMPLIT.level.bossRoom;
    LAMPLIT.player.x = br.x + br.w/2; LAMPLIT.player.y = br.y + br.h - 50;
    for (let i = 0; i < 6; i++) LAMPLIT.update(1/60);
    LAMPLIT.boss.intro = 0;
    for (let i = 0; i < 170; i++) LAMPLIT.update(1/60);
    return { state: LAMPLIT.state, notes: RHYTHM.notes.length, boss: LAMPLIT.boss ? LAMPLIT.boss.type : null };
  })()`);
  console.log('enter =', JSON.stringify(enter));
  await h.wait(300);
  await h.shot('shots/final/v46_rhythm.png');

  const perfect = await h.eval(`(() => {
    RHYTHM.notes.forEach(n => n.judged = 'perfect');
    RHYTHM.perfect = RHYTHM.notes.length;
    RHYTHM.total = RHYTHM.notes.length;
    RHYTHM.perfectRatio = 1;
    RHYTHM.finished = true;
    LAMPLIT.update(1/60);
    return { state: LAMPLIT.state, boss: !!LAMPLIT.boss };
  })()`);
  console.log('perfect =', JSON.stringify(perfect));

  const fail = await h.eval(`(() => {
    LAMPLIT.gotoLevel(2, 1);
    const br = LAMPLIT.level.bossRoom;
    LAMPLIT.player.x = br.x + br.w/2; LAMPLIT.player.y = br.y + br.h - 50;
    for (let i = 0; i < 6; i++) LAMPLIT.update(1/60);
    LAMPLIT.boss.intro = 0;
    for (let i = 0; i < 170; i++) LAMPLIT.update(1/60);
    RHYTHM.notes.forEach(n => n.judged = 'miss');
    RHYTHM.perfect = 0; RHYTHM.total = RHYTHM.notes.length; RHYTHM.perfectRatio = 0;
    RHYTHM.finished = true;
    LAMPLIT.update(1/60);
    return { state: LAMPLIT.state, hp: Math.round(LAMPLIT.player.hp), maxHp: Math.round(LAMPLIT.player.maxHp),
      boss: LAMPLIT.boss ? LAMPLIT.boss.type : null };
  })()`);
  console.log('fail =', JSON.stringify(fail));
};
