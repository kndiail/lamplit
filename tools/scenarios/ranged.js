module.exports = async (h) => {
  await h.goto(); await h.wait(1500);
  const r = await h.eval(`(() => {
    const R = ['spitter','archer','mage','summoner'];
    const out = [];
    for (let f = 0; f < 4; f++) {
      for (const l of [0, 5]) {
        const p = LAMPLIT.poolFor(f, l);
        let tw = 0, rw = 0;
        for (const x of p) { tw += x.w; if (R.indexOf(x.id) >= 0) rw += x.w; }
        out.push({ f: f, l: l, ratio: +(rw / tw * 100).toFixed(1) });
      }
    }
    return out;
  })()`);
  console.log('ranged =', JSON.stringify(r));
};
