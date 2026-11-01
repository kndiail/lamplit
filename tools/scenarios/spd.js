module.exports = async (h) => {
  await h.goto(); await h.wait(1600);
  const r = await h.eval(`(() => {
    LAMPLIT.clearRunSnapshot();
    LAMPLIT.startRun('lamp'); LAMPLIT.setState('PLAY');
    const p = LAMPLIT.player;
    const out = {};
    ['crawler','bat','wisp','ghost','brute','leech','bomber','shade','slammer'].forEach(function (t) {
      const e = LAMPLIT.spawnAt(t, p.x + 80, p.y, false);
      if (e) { out[t] = Math.round(e.spd); e.dead = true; }
    });
    const sp = LAMPLIT.spawnAt('spitter', p.x + 100, p.y, false);
    sp.spawnT = 0; sp.shootT = 0; sp.spd = 0;
    const ar = LAMPLIT.spawnAt('archer', p.x - 100, p.y, false);
    ar.spawnT = 0; ar.shootT = 0; ar.spd = 0;
    for (let i = 0; i < 12; i++) LAMPLIT.update(1/60);
    const shots = [];
    for (let i = 0; i < LAMPLIT.hazards.length; i++) {
      const h = LAMPLIT.hazards[i];
      if (!h.dead && h.kind === 'spit') shots.push(Math.round(Math.hypot(h.vx, h.vy)));
    }
    return { melee: out, shots: shots };
  })()`);
  console.log('speed =', JSON.stringify(r));
};
