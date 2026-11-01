/* 4 层 × 6 关 + 12 位层主 结构验收 */
module.exports = async (h) => {
  await h.goto(); await h.wait(1600);

  const info = await h.eval(`(() => {
    const levels = [];
    for (let l = 0; l < 6; l++) { LAMPLIT.gotoLevel(0, l); levels.push(LAMPLIT.level.isBoss ? 'boss' : 'portal'); }
    const roster = LAMPLIT.bossRoster;
    return {
      floors: DUNGEON.FLOORS, rooms: DUNGEON.ROOMS, levels,
      names: roster.map(function (b) { return b.name; }),
      actsLen: roster.map(function (b) { return b.acts.length; }),
      uniqueNames: new Set(roster.map(function (b) { return b.name; })).size,
      uniqueSets: new Set(roster.map(function (b) { return b.acts.slice().sort().join(','); })).size,
    };
  })()`);
  console.log('structure =', JSON.stringify(info));

  const mid = await h.eval(`(() => {
    LAMPLIT.clearRunSnapshot();
    LAMPLIT.startRun('lamp'); LAMPLIT.setState('PLAY');
    const settle = () => { let g = 0; while (g++ < 30 && LAMPLIT.state !== 'PLAY') { if (LAMPLIT.state === 'LEVELUP' && LAMPLIT.cards.length) LAMPLIT.applyCard(LAMPLIT.cards[0]); else LAMPLIT.setState('PLAY'); } };
    LAMPLIT.gotoLevel(0, 1);
    const br = LAMPLIT.level.bossRoom;
    LAMPLIT.player.x = br.x + br.w / 2; LAMPLIT.player.y = br.y + br.h - 50;
    for (let i = 0; i < 6; i++) LAMPLIT.update(1/60);
    const name = LAMPLIT.boss ? LAMPLIT.boss.name : null;
    if (LAMPLIT.boss) LAMPLIT.boss.intro = 0;
    LAMPLIT.hurtBoss(999999);
    for (let i = 0; i < 190; i++) LAMPLIT.update(1/60);
    settle();
    const cleared = LAMPLIT.room ? LAMPLIT.room.cleared : false;
    LAMPLIT.player.x = br.x + br.w / 2; LAMPLIT.player.y = br.y + br.h / 2;
    LAMPLIT.setState('PLAY');
    for (let i = 0; i < 40; i++) LAMPLIT.update(1/60);
    const boon = LAMPLIT.state;
    if (LAMPLIT.state === 'BOON') LAMPLIT.takeRoomCard(0, false);
    return { name, cleared, boon, after: { f: LAMPLIT.floorIdx, l: LAMPLIT.levelIdx, state: LAMPLIT.state } };
  })()`);
  console.log('mid boss =', JSON.stringify(mid));

  const trans = await h.eval(`(() => {
    const settle = () => { let g = 0; while (g++ < 30 && LAMPLIT.state !== 'PLAY') { if (LAMPLIT.state === 'LEVELUP' && LAMPLIT.cards.length) LAMPLIT.applyCard(LAMPLIT.cards[0]); else LAMPLIT.setState('PLAY'); } };
    LAMPLIT.setState('PLAY');
    LAMPLIT.gotoLevel(0, 5);
    const br = LAMPLIT.level.bossRoom;
    LAMPLIT.player.x = br.x + br.w / 2; LAMPLIT.player.y = br.y + br.h - 50;
    for (let i = 0; i < 6; i++) LAMPLIT.update(1/60);
    if (LAMPLIT.boss) LAMPLIT.boss.intro = 0;
    LAMPLIT.hurtBoss(999999);
    for (let i = 0; i < 190; i++) LAMPLIT.update(1/60);
    settle();
    LAMPLIT.player.x = br.x + br.w / 2; LAMPLIT.player.y = br.y + br.h / 2;
    LAMPLIT.setState('PLAY');
    for (let i = 0; i < 40; i++) LAMPLIT.update(1/60);
    const boon = LAMPLIT.state;
    if (LAMPLIT.state === 'BOON') LAMPLIT.takeRoomCard(0, true);
    return { boon, f: LAMPLIT.floorIdx, l: LAMPLIT.levelIdx, state: LAMPLIT.state };
  })()`);
  console.log('floor trans =', JSON.stringify(trans));

  const win = await h.eval(`(() => {
    const settle = () => { let g = 0; while (g++ < 30 && LAMPLIT.state !== 'PLAY') { if (LAMPLIT.state === 'LEVELUP' && LAMPLIT.cards.length) LAMPLIT.applyCard(LAMPLIT.cards[0]); else LAMPLIT.setState('PLAY'); } };
    LAMPLIT.setState('PLAY');
    LAMPLIT.gotoLevel(3, 5);
    const br = LAMPLIT.level.bossRoom;
    LAMPLIT.player.x = br.x + br.w / 2; LAMPLIT.player.y = br.y + br.h - 50;
    for (let i = 0; i < 6; i++) LAMPLIT.update(1/60);
    const name = LAMPLIT.boss ? LAMPLIT.boss.name : null;
    if (LAMPLIT.boss) LAMPLIT.boss.intro = 0;
    LAMPLIT.hurtBoss(999999);
    for (let i = 0; i < 190; i++) LAMPLIT.update(1/60);
    settle();
    LAMPLIT.player.x = br.x + br.w / 2; LAMPLIT.player.y = br.y + br.h / 2;
    LAMPLIT.setState('PLAY');
    for (let i = 0; i < 40; i++) LAMPLIT.update(1/60);
    return { name, state: LAMPLIT.state, floor: LAMPLIT.floorIdx };
  })()`);
  console.log('final =', JSON.stringify(win));

  await h.eval("(() => { LAMPLIT.gotoLevel(0, 1); LAMPLIT.setState('PLAY'); const br = LAMPLIT.level.bossRoom; LAMPLIT.player.x = br.x + br.w/2; LAMPLIT.player.y = br.y + br.h - 50; for (let i=0;i<8;i++) LAMPLIT.update(1/60); if (LAMPLIT.boss) LAMPLIT.boss.intro = 0; for (let i=0;i<30;i++) LAMPLIT.update(1/60); return 1; })()");
  await h.wait(500);
  await h.shot('shots/final/v48_boss1.png');
};
