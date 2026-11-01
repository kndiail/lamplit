/* =========================================================
   提灯者 —— 节拍试炼（4K 下落式音游）
   D F J K 四轨；95% PERFECT 直接击破层主
   ========================================================= */
(function () {
  'use strict';
  const G = window.G;
  const R = (window.RHYTHM = {});

  const LANES = 4;
  const KEYS = ['d', 'f', 'j', 'k'];
  const LABELS = ['D', 'F', 'J', 'K'];
  const PITCH = 0.42;          // 每拍间隔（≈143 BPM）
  const LEAD = 2.1;            // 音符从顶部落到判定线的时间
  const PERFECT = 0.06, GOOD = 0.13;

  R.active = false;
  R.finished = false;
  R.t = 0;
  R.notes = [];
  R.next = 0;
  R.perfect = 0;
  R.good = 0;
  R.miss = 0;
  R.total = 0;
  R.combo = 0;
  R.maxCombo = 0;
  R.flash = 0;
  R.hitLane = 0;
  R.hitT = 0;
  R.perfectRatio = 0;
  R.acc = 1;

  R.start = function (seed) {
    const rnd = G.rng((seed | 0) ^ 0x5eed);
    R.active = true;
    R.finished = false;
    R.t = 0;
    R.notes = [];
    R.next = 0;
    R.perfect = 0; R.good = 0; R.miss = 0; R.combo = 0; R.maxCombo = 0;
    R.flash = 0; R.hitT = 0;
    const bars = 30;
    let ti = 1.6;
    for (let b = 0; b < bars; b++) {
      const dense = b > 6 && b < bars - 4;
      const count = dense ? (rnd() < 0.45 ? 2 : 1) : 1;
      for (let c = 0; c < count; c++) {
        const lane = (rnd() * LANES) | 0;
        R.notes.push({ lane, t: ti + c * 0.14, judged: '' });
      }
      ti += PITCH * (rnd() < 0.18 ? 2 : 1);
    }
    R.notes.sort((a, b2) => a.t - b2.t);
    R.total = R.notes.length;
    R.acc = 1;
    R.perfectRatio = 0;
  };

  R.judge = function (lane) {
    const t = R.t;
    let best = null, bd = 1e9;
    for (let i = 0; i < R.notes.length; i++) {
      const n = R.notes[i];
      if (n.judged || n.lane !== lane) continue;
      const d = Math.abs(n.t - t);
      if (d < bd) { bd = d; best = n; }
    }
    if (!best || bd > GOOD) { R.combo = 0; return; }
    R.hitLane = lane; R.hitT = 0.12;
    if (bd <= PERFECT) {
      best.judged = 'perfect'; R.perfect++; R.combo++;
      R.flash = Math.max(R.flash, 0.5);
      if (window.AUDIO) AUDIO.sfx('hit');
    } else {
      best.judged = 'good'; R.good++; R.combo++;
      if (window.AUDIO) AUDIO.sfx('click');
    }
    R.maxCombo = Math.max(R.maxCombo, R.combo);
  };

  R.update = function (dt) {
    if (!R.active || R.finished) return;
    R.t += dt;
    R.flash = Math.max(0, R.flash - dt * 2.6);
    R.hitT = Math.max(0, R.hitT - dt);
    const inp = window.G.Input;
    for (let i = 0; i < LANES; i++) if (inp.hit(KEYS[i])) R.judge(i);
    for (let i = 0; i < R.notes.length; i++) {
      const n = R.notes[i];
      if (!n.judged && R.t > n.t + GOOD) { n.judged = 'miss'; R.miss++; R.combo = 0; }
    }
    const judged = R.perfect + R.good + R.miss;
    R.acc = judged ? (R.perfect + R.good * 0.5) / judged : 1;
    R.perfectRatio = R.total ? R.perfect / R.total : 0;
    if (R.next < R.notes.length && R.t > R.notes[R.notes.length - 1].t + 1.6) {
      R.finished = true;
      R.active = false;
    }
  };

  R.draw = function (ctx, W, H) {
    const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    ctx.fillStyle = 'rgba(4,4,10,0.82)';
    ctx.fillRect(0, 0, W, H);
    const laneW = 34, gap = 5;
    const totalW = LANES * laneW + (LANES - 1) * gap;
    const x0 = Math.round((W - totalW) / 2);
    const hitY = 170;
    const topY = 44;

    ART.text(ctx, '节 拍 试 炼', W / 2, 4, { color: '#c9a8ff', align: 'center', scale: 2, shadow: true, shadowColor: '#1a0c2a' });
    ART.text(ctx, 'PERFECT 95% 即可击破层主', W / 2, 36, { color: '#6f7d9a', align: 'center' });
    // 实时 acc
    const acc = Math.round(R.acc * 1000) / 10;
    ART.text(ctx, 'ACC ' + acc.toFixed(1) + '%', W - 8, 8, { color: acc >= 95 ? '#9fe8ff' : '#ffd166', align: 'right' });
    ART.text(ctx, 'PERFECT ' + R.perfect, W - 8, 20, { color: '#6f7d9a', align: 'right' });

    for (let i = 0; i < LANES; i++) {
      const lx = x0 + i * (laneW + gap);
      px(lx, topY, laneW, hitY - topY, 'rgba(12,16,26,0.72)');
      px(lx, topY, 1, hitY - topY, 'rgba(90,110,150,0.25)');
      px(lx + laneW - 1, topY, 1, hitY - topY, 'rgba(90,110,150,0.25)');
      if (R.hitT > 0 && R.hitLane === i) {
        px(lx, topY, laneW, hitY - topY, 'rgba(160,220,255,' + (R.hitT * 1.6) + ')');
      }
      // 判定线
      px(lx - 2, hitY, laneW + 4, 3, '#7f9cc9');
      px(lx - 2, hitY, laneW + 4, 1, '#d8eaff');
      px(lx + laneW / 2 - 1, hitY + 8, 3, 8, '#2a3a58');
      ART.text(ctx, LABELS[i], lx + laneW / 2, hitY + 20, {
        color: '#8fa6c9', align: 'center', shadow: true, shadowColor: '#000',
      });
    }

    // 音符
    for (let i = 0; i < R.notes.length; i++) {
      const n = R.notes[i];
      if (n.judged) continue;
      const dy = (n.t - R.t) / LEAD;
      if (dy > 1.06 || dy < -0.12) continue;
      const y = hitY - dy * (hitY - topY);
      const lx = x0 + n.lane * (laneW + gap);
      const col = n.lane % 2 ? '#7fe0ff' : '#c9a8ff';
      px(lx + 2, y - 3, laneW - 4, 6, col);
      px(lx + 2, y - 3, laneW - 4, 2, '#ffffff');
      px(lx + 4, y + 3, laneW - 8, 2, 'rgba(0,0,0,0.35)');
    }

    // 进度条
    const totalT = R.notes.length ? R.notes[R.notes.length - 1].t : 1;
    px(x0, 196, totalW, 3, '#121a28');
    px(x0, 196, totalW * Math.min(1, R.t / totalT), 3, '#c9a8ff');
    if (R.combo > 2) {
      ART.text(ctx, R.combo + ' COMBO', W / 2, 130, { color: '#ffe9a8', align: 'center', scale: 2, shadow: true, shadowColor: '#000' });
    }
    if (R.flash > 0.01) {
      ctx.fillStyle = 'rgba(200,230,255,' + (R.flash * 0.18) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  };

  R.result = function () {
    return { acc: R.acc, perfect: R.perfect, good: R.good, miss: R.miss, ratio: R.perfectRatio, total: R.total };
  };
})();
