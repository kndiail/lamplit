/* 血条 NaN / 死亡结算验收 */
module.exports = async (h) => {
  await h.goto(); await h.wait(1600);
  const r = await h.eval(`(() => {
    LAMPLIT.clearRunSnapshot();
    LAMPLIT.startRun('lamp'); LAMPLIT.setState('PLAY');
    const p = LAMPLIT.player;
    p.hp = 60;
    p.iframe = 0; p.spawnT = 0; p.dashT = 0;
    LAMPLIT.hurtPlayer(NaN);
    LAMPLIT.hurtPlayer(undefined);
    const afterNaN = p.hp;
    p.iframe = 0; p.spawnT = 0; p.dashT = 0;
    LAMPLIT.hurtPlayer(25);
    const afterHit = p.hp;
    // 走一趟沼泽主教的毒池，确认不再 NaN
    LAMPLIT.gotoLevel(1, 3);
    const br = LAMPLIT.level.bossRoom;
    p.x = br.x + br.w / 2; p.y = br.y + br.h - 50;
    for (let i = 0; i < 8; i++) LAMPLIT.update(1/60);
    if (LAMPLIT.boss) LAMPLIT.boss.intro = 0;
    for (let i = 0; i < 200; i++) {
      if (LAMPLIT.state === 'LEVELUP') { while (LAMPLIT.state === 'LEVELUP' && LAMPLIT.cards.length) LAMPLIT.applyCard(LAMPLIT.cards[0]); LAMPLIT.setState('PLAY'); }
      const b = LAMPLIT.boss; if (b && !b.act) b.nextT = 0;
      LAMPLIT.update(1/60);
    }
    return { afterNaN, afterHit, finite: isFinite(p.hp), hp: Math.round(p.hp), state: LAMPLIT.state };
  })()`);
  console.log('hp =', JSON.stringify(r));
  await h.wait(300);
  await h.shot('shots/final/v50_hud.png');

  const death = await h.eval(`(() => {
    const p = LAMPLIT.player;
    LAMPLIT.setState('PLAY');
    p.hp = 12;
    p.iframe = 0; p.spawnT = 0; p.dashT = 0;
    LAMPLIT.hurtPlayer(9999);
    return { state: LAMPLIT.state, hp: p.hp, hasEnd: !!LAMPLIT.endInfo };
  })()`);
  console.log('death =', JSON.stringify(death));
  await h.wait(400);
  await h.shot('shots/final/v50_death.png');
};
