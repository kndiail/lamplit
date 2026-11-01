/* 触摸摇杆与键鼠一致性验证 */
module.exports = async (h) => {
  await h.goto();
  await h.wait(400);
  await h.eval("(() => { try { LAMPLIT.finishStory(); } catch (e) {} if (LAMPLIT.state === 'STORY') LAMPLIT.setState('TITLE'); try { LAMPLIT.save.lore.prologue = true; } catch (e) {} return 1; })()");

  await h.wait(1300);
  await h.key(' ');
  await h.wait(300);
  const res = await h.eval(`(() => {
    const cv = document.getElementById('game');
    const r = cv.getBoundingClientRect();
    const toClient = (x, y) => ({ clientX: r.left + x / 384 * r.width, clientY: r.top + y / 270 * r.height });
    const mk = (type, x, y) => {
      const p = toClient(x, y);
      const t = new Touch({ identifier: 1, target: cv, clientX: p.clientX, clientY: p.clientY });
      cv.dispatchEvent(new TouchEvent(type, { touches: type === 'touchend' ? [] : [t], changedTouches: [t], bubbles: true, cancelable: true }));
    };
    const p = LAMPLIT.player;
    const x0 = p.x, y0 = p.y;
    mk('touchstart', 60, 140);
    mk('touchmove', 90, 140);
    for (let i = 0; i < 60; i++) LAMPLIT.update(1/60);
    const dxRight = p.x - x0;
    mk('touchmove', 30, 140);
    for (let i = 0; i < 60; i++) LAMPLIT.update(1/60);
    const dxLeft = p.x - (x0 + dxRight);
    mk('touchend', 30, 140);
    return { dxRight: +dxRight.toFixed(1), dxLeft: +dxLeft.toFixed(1), touchActive: window.G.Input.touch.active };
  })()`);
  console.log('touch', JSON.stringify(res));

  // 窗口失焦时自动暂停
  const blur = await h.eval(`(() => {
    window.dispatchEvent(new Event('blur'));
    return { keys: Object.keys(window.G.Input.keys).length };
  })()`);
  console.log('blur clears keys', JSON.stringify(blur));
};
