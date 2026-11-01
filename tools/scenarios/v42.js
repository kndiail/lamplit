/* v4.2 验收（第一批）：光柱消失 / 冲刺键 / 移速 / 难度曲线 / 字体对齐 */
module.exports = async (h) => {
  await h.goto();
  await h.wait(1400);

  const r1 = await h.eval(`(() => {
    LAMPLIT.startRun('lamp'); LAMPLIT.setState('PLAY');
    const start = +LAMPLIT.player.spawnT.toFixed(2);
    for (let i = 0; i < 70; i++) LAMPLIT.update(1/60);
    return { start, after: +LAMPLIT.player.spawnT.toFixed(2), state: LAMPLIT.state };
  })()`);
  console.log('spawn beam =', JSON.stringify(r1));

  const r2 = await h.eval(`(() => {
    const p = LAMPLIT.player;
    const K = window.G.Input.keys;
    K['d'] = true;
    p.dashT = 0; p.dashCd = 0;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    LAMPLIT.update(1/60);
    const spaceDash = p.dashT > 0;
    window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }));
    p.dashT = 0; p.dashCd = 0;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }));
    LAMPLIT.update(1/60);
    const shiftDash = p.dashT > 0;
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift' }));
    K['d'] = false;
    return { spaceDash, shiftDash, speed: p.st.speed };
  })()`);
  console.log('dash keys =', JSON.stringify(r2));

  const r3 = await h.eval(`(() => {
    LAMPLIT.gotoLevel(0, 0);
    const a = JSON.parse(JSON.stringify(LAMPLIT.roomScale));
    LAMPLIT.gotoLevel(1, 5);
    const b = JSON.parse(JSON.stringify(LAMPLIT.roomScale));
    LAMPLIT.gotoLevel(4, 9);
    const c = JSON.parse(JSON.stringify(LAMPLIT.roomScale));
    return { f0l0: a, f1l5: b, f4l9: c };
  })()`);
  console.log('scaling =', JSON.stringify(r3));

  const r4 = await h.eval(`(() => {
    const w1 = ART.textWidth('测试文本', 1);
    const w2 = ART.textWidth('测试文本', 2);
    return { w1, w2, ratio: +(w2 / w1).toFixed(2) };
  })()`);
  console.log('text width =', JSON.stringify(r4));

  await h.eval("(() => { LAMPLIT.setState('TITLE'); return 1; })()");
  await h.wait(500);
  await h.shot('shots/final/v42_title.png');
  await h.eval("(() => { LAMPLIT.startRun('lamp'); LAMPLIT.setState('PAUSE'); return 1; })()");
  await h.wait(400);
  await h.shot('shots/final/v42_pause.png');
};
