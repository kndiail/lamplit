/* 掉落延迟验收 v2：逐帧捕捉清场瞬间 */
module.exports = async (h) => {
  await h.goto();
  await h.wait(1700);

  const drop = await h.eval(`(() => {
    LAMPLIT.clearRunSnapshot();
    LAMPLIT.startRun('lamp'); LAMPLIT.setState('PLAY');
    LAMPLIT.gotoLevel(0, 0);
    const L = LAMPLIT.level;
    const rm = L.rooms.filter(r => r.type === 'fight')[0];
    LAMPLIT.player.x = rm.x + rm.w / 2;
    LAMPLIT.player.y = rm.y + rm.h - 40;
    LAMPLIT.player.iframe = 999;
    for (let i = 0; i < 20; i++) LAMPLIT.update(1/60);

    // 逐帧：每帧清空场上敌人，捕捉 cleared 变成 true 的那一帧
    let clearedFrame = -1;
    for (let f = 0; f < 900; f++) {
      if (LAMPLIT.state === 'LEVELUP') {
        while (LAMPLIT.state === 'LEVELUP' && LAMPLIT.cards.length) LAMPLIT.applyCard(LAMPLIT.cards[0]);
        LAMPLIT.setState('PLAY');
      }
      const wasCleared = rm.cleared;
      LAMPLIT.clearEnemies();
      LAMPLIT.update(1/60);
      if (!wasCleared && rm.cleared) { clearedFrame = f; break; }
    }

    const pk = LAMPLIT.pickups;
    const rec = () => ({
      total: pk.length,
      waiting: pk.filter(p => p.magnetT > 0).length,
      pulling: pk.filter(p => p.magnet).length,
      nearest: pk.length ? Math.round(Math.min.apply(null, pk.map(p => Math.hypot(p.x - LAMPLIT.player.x, p.y - LAMPLIT.player.y)))) : -1,
    });
    const out = { cleared: rm.cleared, clearedFrame };
    out.t0 = rec();
    for (let i = 0; i < 12; i++) LAMPLIT.update(1/60);   // +0.20s
    out.t020 = rec();
    for (let i = 0; i < 12; i++) LAMPLIT.update(1/60);   // +0.40s
    out.t040 = rec();
    for (let i = 0; i < 9; i++) LAMPLIT.update(1/60);    // +0.55s
    out.t055 = rec();
    for (let i = 0; i < 30; i++) LAMPLIT.update(1/60);   // +1.05s
    out.t105 = rec();
    return out;
  })()`);
  console.log('drop =', JSON.stringify(drop));
  await h.shot('shots/final/fix_drop.png');
};
