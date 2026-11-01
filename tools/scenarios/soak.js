/* 内存泄漏浸泡测试：分块长时战斗 + 渲染，采样堆与缓存 */
module.exports = async (h) => {
  await h.goto(); await h.wait(1600);
  const init = await h.eval(`(() => {
    LAMPLIT.clearRunSnapshot();
    LAMPLIT.startRun('lamp'); LAMPLIT.setState('PLAY');
    LAMPLIT.gotoLevel(0, 1);
    window.__soak = { samples: [], f: 0 };
    return { state: LAMPLIT.state, heap: performance.memory.usedJSHeapSize, mem: LAMPLIT.mem() };
  })()`);
  console.log('init =', JSON.stringify(init));

  for (let chunk = 0; chunk < 10; chunk++) {
    const r = await h.eval(`(() => {
      const S = window.__soak;
      const t0 = performance.now();
      for (let i = 0; i < 600; i++, S.f++) {
        const f = S.f;
        if (f % 12 === 0) {
          for (let k = 0; k < 3; k++) {
            LAMPLIT.spawnAt('bat', LAMPLIT.room.x + 30 + Math.random() * 320, LAMPLIT.room.y + 30 + Math.random() * 150, false);
          }
        }
        if (f % 240 === 0) LAMPLIT.clearEnemies();
        if (LAMPLIT.state !== 'PLAY') {
          while (LAMPLIT.state === 'LEVELUP' && LAMPLIT.cards.length) LAMPLIT.applyCard(LAMPLIT.cards[0]);
          LAMPLIT.setState('PLAY');
        }
        LAMPLIT.player.iframe = 999;
        LAMPLIT.update(1/60);
        LAMPLIT.render();
      }
      S.samples.push({ f: S.f, heap: performance.memory.usedJSHeapSize, mem: LAMPLIT.mem() });
      return { f: S.f, heap: performance.memory.usedJSHeapSize, mem: LAMPLIT.mem(), ms: Math.round(performance.now() - t0) };
    })()`);
    console.log(JSON.stringify(r));
  }
};
