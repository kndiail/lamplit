/* 视觉检查：开局 20 秒后的世界与局部放大 */
module.exports = async (h) => {
  await h.goto();
  await h.wait(400);
  await h.eval("(() => { try { LAMPLIT.finishStory(); } catch (e) {} if (LAMPLIT.state === 'STORY') LAMPLIT.setState('TITLE'); try { LAMPLIT.save.lore.prologue = true; } catch (e) {} return 1; })()");

  await h.wait(1200);
  await h.key(' ');
  await h.wait(200);
  await h.eval(`(() => {
    const K = window.G.Input.keys;
    for (let i = 0; i < 1200; i++) {
      if (LAMPLIT.state !== 'PLAY') break;
      const p = LAMPLIT.player, es = LAMPLIT.enemies;
      let bx = 0, by = 0, bd = 1e9;
      for (let k = 0; k < es.length; k++) { const e = es[k]; const d = (e.x-p.x)**2 + (e.y-p.y)**2; if (d < bd) { bd = d; bx = e.x; by = e.y; } }
      K['w'] = K['s'] = K['a'] = K['d'] = false;
      if (bd < 130*130) { if (bx < p.x) K['d'] = true; else K['a'] = true; if (by < p.y) K['s'] = true; else K['w'] = true; }
      else { K['d'] = true; K['s'] = true; }
      LAMPLIT.update(1/60);
    }
    return LAMPLIT.state;
  })()`);
  await h.wait(400);
  console.log('state', await h.eval('LAMPLIT.state'), 'en', await h.eval('LAMPLIT.enemies.length'));
  await h.shot('shots/look_full.png');
  await h.shotClip('shots/look_zoom.png', 130, 60, 220, 150, 4);
  // 强制升级看卡片
  await h.eval('LAMPLIT.player.xp += 400; LAMPLIT.update(1/60)');
  await h.wait(300);
  await h.shot('shots/look_cards.png');
};
