/* v4.3 验收（第二批）：加载动画 / 移动与镜头 / 主题美术 */
module.exports = async (h) => {
  await h.goto();
  await h.wait(240);
  console.log('loading state =', await h.eval('LAMPLIT.state'));
  await h.shot('shots/final/v43_loading.png');
  await h.wait(1600);
  console.log('after load =', await h.eval('LAMPLIT.state'));

  const mv = await h.eval(`(() => {
    LAMPLIT.clearRunSnapshot();
    LAMPLIT.startRun('lamp'); LAMPLIT.setState('PLAY');
    const p = LAMPLIT.player;
    const K = window.G.Input.keys;
    const x0 = p.x;
    K['d'] = true;
    LAMPLIT.update(1/60);
    const vx = Math.round(p.vx);
    K['d'] = false;
    LAMPLIT.update(1/60);
    const stopVx = Math.round(p.vx);
    return { vx, stopVx, moved: +(p.x - x0).toFixed(2), speed: p.st.speed };
  })()`);
  console.log('movement =', JSON.stringify(mv));

  const cam = await h.eval(`(() => {
    const p = LAMPLIT.player;
    for (let i = 0; i < 30; i++) LAMPLIT.update(1/60);
    return { camX: Math.round(LAMPLIT.camX), camY: Math.round(LAMPLIT.camY),
      wantX: Math.round(p.x - 192), wantY: Math.round(p.y - 108) };
  })()`);
  console.log('camera =', JSON.stringify(cam));

  const themes = await h.eval(`(() => {
    const out = [];
    for (let f = 0; f < 4; f++) {
      LAMPLIT.gotoLevel(f, 0);
      out.push({ f, theme: LAMPLIT.themeInfo ? LAMPLIT.themeInfo.id : '?',
        props: LAMPLIT.level.rooms.map(r => (r.props || []).length).join(',') });
    }
    return out;
  })()`);
  console.log('themes =', JSON.stringify(themes));

  await h.eval("(() => { LAMPLIT.gotoLevel(1, 0); LAMPLIT.setState('PLAY'); return 1; })()");
  await h.wait(700);
  await h.shot('shots/final/v43_theme_ice.png');
  await h.eval("(() => { LAMPLIT.gotoLevel(2, 0); return 1; })()");
  await h.wait(700);
  await h.shot('shots/final/v43_theme_volcano.png');
};
