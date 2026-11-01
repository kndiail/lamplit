/* 渲染分段耗时剖析 */
module.exports = async (h) => {
  await h.goto();
  await h.wait(400);
  await h.eval("(() => { try { LAMPLIT.finishStory(); } catch (e) {} if (LAMPLIT.state === 'STORY') LAMPLIT.setState('TITLE'); try { LAMPLIT.save.lore.prologue = true; } catch (e) {} return 1; })()");

  await h.wait(1300);
  await h.key(' ');
  await h.wait(300);
  const r = await h.eval(`(() => {
    for (let i = 0; i < 60 * 90; i++) {
      if (LAMPLIT.state === 'LEVELUP') LAMPLIT.applyCard(LAMPLIT.cards[0]);
      else LAMPLIT.update(1/60);
    }
    const bench = (label) => {
      const t = [];
      for (let i = 0; i < 80; i++) { const s = performance.now(); LAMPLIT.render(); t.push(performance.now() - s); }
      t.sort((a,b)=>a-b);
      return { label, med: +t[40].toFixed(2) };
    };
    const out = [];
    out.push(bench('full'));
    const fog = window.WORLD.drawFog;
    window.WORLD.drawFog = () => {};
    out.push(bench('noFog'));
    const g0 = LAMPLIT.setGlow; LAMPLIT.setGlow(0);
    out.push(bench('noGlow'));
    const props = window.WORLD.drawProps;
    window.WORLD.drawProps = () => {};
    out.push(bench('noProps'));
    const ground = window.WORLD.drawGround;
    window.WORLD.drawGround = () => {};
    out.push(bench('noGround'));
    const ed = window.WORLD.endDark;
    window.WORLD.endDark = (c) => {};
    out.push(bench('noDark'));
    window.WORLD.drawFog = fog; LAMPLIT.setGlow(1);
    window.WORLD.drawProps = props; window.WORLD.drawGround = ground; window.WORLD.endDark = ed;
    return out;
  })()`);
  console.log(JSON.stringify(r, null, 1));
};
