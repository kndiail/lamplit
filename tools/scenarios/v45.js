module.exports = async (h) => {
  await h.goto(); await h.wait(1500);
  const r1 = await h.eval(`(() => {
    LAMPLIT.startRun('lamp'); LAMPLIT.setState('PLAY');
    LAMPLIT.gotoLevel(2, 9);
    const br = LAMPLIT.level.bossRoom;
    LAMPLIT.player.x = br.x + br.w/2; LAMPLIT.player.y = br.y + br.h - 50;
    for (let i = 0; i < 6; i++) LAMPLIT.update(1/60);
    const type = LAMPLIT.boss ? LAMPLIT.boss.type : null;
    LAMPLIT.boss.intro = 0;
    for (let i = 0; i < 170; i++) LAMPLIT.update(1/60);
    return { type, state: LAMPLIT.state, notes: RHYTHM.notes.length };
  })()`);
  console.log('rhythm enter =', JSON.stringify(r1));
  await h.wait(300); await h.shot('shots/final/v45_rhythm.png');
  const r2 = await h.eval(`(() => {
    RHYTHM.notes.forEach(n => n.judged = 'perfect');
    RHYTHM.perfect = RHYTHM.notes.length; RHYTHM.total = RHYTHM.notes.length;
    RHYTHM.finished = true;
    LAMPLIT.update(1/60);
    return { state: LAMPLIT.state, boss: !!LAMPLIT.boss };
  })()`);
  console.log('perfect result =', JSON.stringify(r2));
  const r3 = await h.eval(`(() => {
    LAMPLIT.gotoLevel(2, 9);
    const br = LAMPLIT.level.bossRoom;
    LAMPLIT.player.x = br.x + br.w/2; LAMPLIT.player.y = br.y + br.h - 50;
    for (let i = 0; i < 6; i++) LAMPLIT.update(1/60);
    LAMPLIT.boss.intro = 0;
    for (let i = 0; i < 170; i++) LAMPLIT.update(1/60);
    RHYTHM.notes.forEach(n => n.judged = 'miss');
    RHYTHM.perfect = 0; RHYTHM.total = RHYTHM.notes.length;
    RHYTHM.finished = true;
    LAMPLIT.update(1/60);
    return { state: LAMPLIT.state, hp: Math.round(LAMPLIT.player.hp), maxHp: Math.round(LAMPLIT.player.maxHp) };
  })()`);
  console.log('fail result =', JSON.stringify(r3));
  const r4 = await h.eval(`(() => {
    LAMPLIT.gotoLevel(1, 0);
    let n = 0;
    for (let i = 0; i < 40; i++) LAMPLIT.update(1/60);
    const blocks = LAMPLIT.level.rooms.reduce((a, r) => a + (r.blocks || []).length, 0);
    return { blocks, enemies: LAMPLIT.enemies.length };
  })()`);
  console.log('terrain =', JSON.stringify(r4));
};
