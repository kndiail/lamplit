/* 手机端：摇杆 / 冲刺 / 灯爆 / 暂停 / 音游四轨点击 */
module.exports = async (h) => {
  await h.goto(); await h.wait(1600);
  const r = await h.eval(`(() => {
    LAMPLIT.clearRunSnapshot();
    LAMPLIT.startRun('lamp'); LAMPLIT.setState('PLAY');
    const cv = document.getElementById('game');
    const rc = cv.getBoundingClientRect();
    const toClient = (x, y) => ({ clientX: rc.left + x / 384 * rc.width, clientY: rc.top + y / 216 * rc.height });
    const mk = (type, x, y, id) => {
      const p = toClient(x, y);
      const t = new Touch({ identifier: id, target: cv, clientX: p.clientX, clientY: p.clientY });
      cv.dispatchEvent(new TouchEvent(type, {
        touches: type === 'touchend' ? [] : [t],
        changedTouches: [t], bubbles: true, cancelable: true,
      }));
    };
    const p = LAMPLIT.player;
    const x0 = p.x;
    mk('touchstart', 60, 140, 1);
    mk('touchmove', 88, 140, 1);
    for (let i = 0; i < 60; i++) LAMPLIT.update(1/60);
    const moved = +(p.x - x0).toFixed(1);
    p.dashCd = 0; p.dashT = 0;
    mk('touchstart', 348, 162, 2);
    const dashBtn = window.G.Input.btn.dash;
    LAMPLIT.update(1/60);
    const dashed = p.dashT > 0;
    p.skill.cd = 0;
    mk('touchstart', 298, 152, 3);
    const skillBtn = window.G.Input.btn.skill;
    LAMPLIT.update(1/60);
    const skilled = p.skill.cd > 0;
    mk('touchstart', 16, 36, 4);
    const pauseBtn = window.G.Input.btn.pause;
    mk('touchend', 60, 140, 1);
    return { moved, dashBtn, dashed, skillBtn, skilled, pauseBtn,
      touchMode: window.G.Input.touchMode };
  })()`);
  console.log('touch =', JSON.stringify(r));
  await h.wait(160);
  console.log('after pause =', await h.eval('LAMPLIT.state'));
  await h.eval("(() => { LAMPLIT.setState('PLAY'); return 1; })()");
  await h.wait(300);
  await h.shot('shots/final/mobile_hud.png');

  const rr = await h.eval(`(() => {
    LAMPLIT.gotoLevel(2, 1);
    const br = LAMPLIT.level.bossRoom;
    LAMPLIT.player.x = br.x + br.w / 2; LAMPLIT.player.y = br.y + br.h - 50;
    for (let i = 0; i < 8; i++) LAMPLIT.update(1/60);
    if (LAMPLIT.boss) LAMPLIT.boss.intro = 0;
    for (let i = 0; i < 185; i++) {
      if (LAMPLIT.state === 'LEVELUP') { while (LAMPLIT.state === 'LEVELUP' && LAMPLIT.cards.length) LAMPLIT.applyCard(LAMPLIT.cards[0]); LAMPLIT.setState('PLAY'); }
      LAMPLIT.update(1/60);
    }
    if (LAMPLIT.state !== 'RHYTHM') return { state: LAMPLIT.state };
    LAMPLIT.render();
    const g = RHYTHM.geo;
    const lane = 1;
    const tx = g.x0 + lane * (g.laneW + g.gap) + g.laneW / 2;
    RHYTHM.notes[0].lane = lane;
    RHYTHM.notes[0].t = RHYTHM.t;
    window.G.Input.taps.push({ x: tx, y: 120 });
    const before = RHYTHM.perfect;
    RHYTHM.update(1/60);
    return { state: LAMPLIT.state, geo: !!g, perfect: RHYTHM.perfect, before,
      judged: RHYTHM.notes[0].judged };
  })()`);
  console.log('rhythm =', JSON.stringify(rr));
  await h.wait(300);
  await h.shot('shots/final/mobile_rhythm.png');
};
