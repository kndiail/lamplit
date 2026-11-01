/* 密度 + 体积验收 */
module.exports = async (h) => {
  await h.goto(); await h.wait(1600);
  const r = await h.eval(`(() => {
    LAMPLIT.clearRunSnapshot();
    LAMPLIT.startRun('lamp'); LAMPLIT.setState('PLAY');
    const out = [];
    for (let f = 0; f < 4; f++) {
      LAMPLIT.gotoLevel(f, 0);
      const L = LAMPLIT.level;
      const rm = L.rooms.filter(function (x) { return x.type === 'fight'; })[0];
      if (!rm) { out.push({ f: f, none: true }); continue; }
      LAMPLIT.player.x = rm.x + rm.w / 2; LAMPLIT.player.y = rm.y + rm.h - 40;
      for (let i = 0; i < 12; i++) LAMPLIT.update(1/60);
      const es = LAMPLIT.enemies;
      out.push({ f: f, count: es.length, scale: es[0] ? es[0].scale : null,
        r: es[0] ? +es[0].r.toFixed(1) : null, waves: rm.waveCounts ? rm.waveCounts.join('+') : null });
    }
    return out;
  })()`);
  console.log('density =', JSON.stringify(r));
  await h.wait(400);
  await h.shot('shots/final/v49_density.png');
};
