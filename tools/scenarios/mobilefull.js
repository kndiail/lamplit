/* 真实视口：确认画布铺满 + 摇杆/按钮不压 HUD */
module.exports = async (h) => {
  await h.goto();
  await h.wait(1700);

  // 1) 真实视口铺满检查（不伪造 innerWidth）
  const fit = await h.eval(`(() => {
    window.G.Input.touchMode = true;
    window.dispatchEvent(new Event('resize'));
    const cv = document.getElementById('game');
    const r = cv.getBoundingClientRect();
    return {
      viewport: [window.innerWidth, window.innerHeight],
      canvasCss: [Math.round(r.width), Math.round(r.height)],
      fillX: +(r.width / window.innerWidth).toFixed(3),
      fillY: +(r.height / window.innerHeight).toFixed(3),
      aspect: +(r.width / r.height).toFixed(3),
      expect: +(384 / 216).toFixed(3),
    };
  })()`);
  console.log('fit(real) =', JSON.stringify(fit));

  // 2) 桌面整数倍仍保持锐利
  const desk = await h.eval(`(() => {
    window.G.Input.touchMode = false;
    window.dispatchEvent(new Event('resize'));
    return { scale: LAMPLIT.menuScale !== undefined ? LAMPLIT.menuScale : null };
  })()`);
  console.log('desktop =', JSON.stringify(desk));

  // 3) 触屏布局与 HUD 是否重叠
  const ui = await h.eval(`(() => {
    window.G.Input.touchMode = true;
    LAMPLIT.clearRunSnapshot();
    LAMPLIT.startRun('lamp'); LAMPLIT.setState('PLAY');
    const L = window.G.Input.layout();
    const hud = {
      level: { x: 8, y: 6, w: 60, h: 12 },
      timer: { x: 112, y: 6, w: 34, h: 12 },
      hp: { x: 8, y: 30, w: 88, h: 11 },
      relic: { x: 384 - 14, y: 74, w: 20, h: 20 },
      minimap: { x: 384 - 49, y: 30, w: 43, h: 39 },
    };
    const overlap = (a, c) => !(a.x + a.w < c.x - c.r || a.x > c.x + c.r || a.y + a.h < c.y - c.r || a.y > c.y + c.r);
    const res = {};
    for (const k in L) {
      res[k] = Object.keys(hud).filter((hk) => overlap(hud[hk], L[k]));
    }
    return { layout: L, overlaps: res };
  })()`);
  console.log('ui =', JSON.stringify(ui));

  // 4) 站立按「冲」也能冲
  const dash = await h.eval(`(() => {
    const p = LAMPLIT.player;
    const cv = document.getElementById('game');
    const rc = cv.getBoundingClientRect();
    const L = window.G.Input.layout();
    const cl = { clientX: rc.left + L.dash.x / 384 * rc.width, clientY: rc.top + L.dash.y / 216 * rc.height };
    const t = new Touch({ identifier: 9, target: cv, clientX: cl.clientX, clientY: cl.clientY });
    cv.dispatchEvent(new TouchEvent('touchstart', { touches: [t], changedTouches: [t], bubbles: true, cancelable: true }));
    p.dashCd = 0; p.dashT = 0;
    LAMPLIT.update(1/60);
    return { dashed: p.dashT > 0, dir: [Math.round(p.dashDx * 100) / 100, Math.round(p.dashDy * 100) / 100] };
  })()`);
  console.log('dash standing =', JSON.stringify(dash));

  await h.wait(400);
  await h.shot('shots/final/mobile_v2.png');
};
