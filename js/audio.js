/* =========================================================
   提灯者 LAMPLIT — 程序化音频（无外部素材）
   合成器音效 + 芯片音乐序列器
   ========================================================= */
(function () {
  'use strict';

  const A = (window.AUDIO = {});
  let ac = null;
  let master, musicBus, sfxBus, noiseBuf;
  let started = false;

  A.ready = false;
  A.musicOn = true;
  A.sfxOn = true;

  const NOTE = {
    A2: 110, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0,
    A3: 220, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
    G4: 392.0, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
    G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5,
  };

  function makePulse(duty) {
    const n = 24;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    for (let i = 1; i < n; i++) {
      imag[i] = (2 / (i * Math.PI)) * Math.sin(Math.PI * i * duty);
    }
    return ac.createPeriodicWave(real, imag, { disableNormalization: false });
  }

  A.init = function () {
    if (started) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ac = new AC(); } catch (e) { return false; }

    master = ac.createGain();
    master.gain.value = 0.9;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 18;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.22;
    master.connect(comp);
    comp.connect(ac.destination);

    musicBus = ac.createGain();
    musicBus.gain.value = 0.5;
    musicBus.connect(master);

    sfxBus = ac.createGain();
    sfxBus.gain.value = 0.62;
    sfxBus.connect(master);

    // 噪声缓冲
    const len = ac.sampleRate * 1.2;
    noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    A.wave = {
      pulse25: makePulse(0.25),
      pulse125: makePulse(0.125),
      pulse50: makePulse(0.5),
    };
    started = true;
    A.ready = true;
    return true;
  };

  A.resume = function () {
    if (ac && ac.state === 'suspended') ac.resume();
  };

  /* ---------------- 基础音色 ---------------- */
  function envGain(t0, a, d, peak, sus) {
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus), t0 + a + d);
    return g;
  }

  function tone(cfg) {
    if (!started) return;
    const t0 = ac.currentTime + (cfg.delay || 0);
    const o = ac.createOscillator();
    if (cfg.wave === 'm25') o.setPeriodicWave(A.wave.pulse25);
    else if (cfg.wave === 'm125') o.setPeriodicWave(A.wave.pulse125);
    else o.type = cfg.wave || 'square';
    o.frequency.setValueAtTime(cfg.f, t0);
    if (cfg.f2) {
      if (cfg.glide === 'lin') o.frequency.linearRampToValueAtTime(cfg.f2, t0 + cfg.dur);
      else o.frequency.exponentialRampToValueAtTime(Math.max(20, cfg.f2), t0 + cfg.dur);
    }
    const g = ac.createGain();
    const vol = (cfg.vol === undefined ? 0.2 : cfg.vol);
    const atk = cfg.atk === undefined ? 0.005 : cfg.atk;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + cfg.dur);

    let node = o;
    if (cfg.filter) {
      const f = ac.createBiquadFilter();
      f.type = cfg.filter;
      f.frequency.setValueAtTime(cfg.fc || 1200, t0);
      if (cfg.fc2) f.frequency.exponentialRampToValueAtTime(cfg.fc2, t0 + cfg.dur);
      f.Q.value = cfg.q || 1;
      node.connect(f); node = f;
    }
    node.connect(g);
    g.connect(cfg.bus || sfxBus);
    o.start(t0);
    o.stop(t0 + cfg.dur + 0.02);
    o.onended = function () { try { o.disconnect(); g.disconnect(); } catch (err) {} };
  }

  function noise(cfg) {
    if (!started) return;
    const t0 = ac.currentTime + (cfg.delay || 0);
    const s = ac.createBufferSource();
    s.buffer = noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = cfg.filter || 'bandpass';
    f.frequency.setValueAtTime(cfg.fc || 1200, t0);
    if (cfg.fc2) f.frequency.exponentialRampToValueAtTime(Math.max(40, cfg.fc2), t0 + cfg.dur);
    f.Q.value = cfg.q || 1;
    const g = ac.createGain();
    g.gain.setValueAtTime(cfg.vol === undefined ? 0.2 : cfg.vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + cfg.dur);
    s.connect(f); f.connect(g); g.connect(cfg.bus || sfxBus);
    s.start(t0);
    s.stop(t0 + cfg.dur + 0.02);
    s.onended = function () { try { s.disconnect(); f.disconnect(); g.disconnect(); } catch (err) {} };
  }

  /* ---------------- 音效 ---------------- */
  A.sfx = function (name, opt) {
    if (!started || !A.sfxOn) return;
    const o = opt || {};
    switch (name) {
      case 'shoot':
        tone({ wave: 'm25', f: 720, f2: 300, dur: 0.09, vol: 0.10 });
        noise({ dur: 0.05, vol: 0.05, fc: 2600, fc2: 900, filter: 'highpass' });
        break;
      case 'hit':
        noise({ dur: 0.07, vol: 0.12, fc: 900, fc2: 300, filter: 'bandpass', q: 0.8 });
        tone({ wave: 'triangle', f: 180, f2: 90, dur: 0.08, vol: 0.10 });
        break;
      case 'kill':
        noise({ dur: 0.16, vol: 0.10, fc: 1600, fc2: 120, filter: 'lowpass' });
        tone({ wave: 'triangle', f: 300, f2: 70, dur: 0.14, vol: 0.08 });
        break;
      case 'pickup':
        tone({ wave: 'm25', f: 880 * (o.p || 1), f2: 1320 * (o.p || 1), dur: 0.07, vol: 0.055 });
        break;
      case 'levelup':
        [0, 0.07, 0.14, 0.21].forEach((d, i) => {
          tone({ wave: 'm25', f: [523, 659, 784, 1046][i], dur: 0.16, vol: 0.13, delay: d });
        });
        break;
      case 'hurt':
        tone({ wave: 'sawtooth', f: 320, f2: 90, dur: 0.22, vol: 0.16, filter: 'lowpass', fc: 2000, fc2: 400 });
        noise({ dur: 0.16, vol: 0.12, fc: 700, fc2: 200, filter: 'lowpass' });
        break;
      case 'dash':
        noise({ dur: 0.18, vol: 0.10, fc: 2400, fc2: 400, filter: 'bandpass', q: 1.4 });
        break;
      case 'nova':
        tone({ wave: 'sine', f: 220, f2: 720, dur: 0.22, vol: 0.10 });
        noise({ dur: 0.2, vol: 0.06, fc: 3000, fc2: 600, filter: 'bandpass' });
        break;
      case 'spark':
        tone({ wave: 'm125', f: 1500, f2: 500, dur: 0.09, vol: 0.07 });
        noise({ dur: 0.07, vol: 0.06, fc: 5200, fc2: 2200, filter: 'highpass' });
        break;
      case 'crescent':
        noise({ dur: 0.12, vol: 0.09, fc: 4200, fc2: 900, filter: 'bandpass', q: 0.7 });
        break;
      case 'click':
        tone({ wave: 'm25', f: 520, f2: 660, dur: 0.05, vol: 0.07 });
        break;
      case 'hover':
        tone({ wave: 'm25', f: 660, dur: 0.03, vol: 0.03 });
        break;
      case 'boss':
        tone({ wave: 'sawtooth', f: 70, f2: 42, dur: 1.3, vol: 0.22, filter: 'lowpass', fc: 600, fc2: 120 });
        noise({ dur: 1.2, vol: 0.12, fc: 300, fc2: 80, filter: 'lowpass' });
        break;
      case 'bossHit':
        noise({ dur: 0.1, vol: 0.10, fc: 1400, fc2: 300, filter: 'bandpass' });
        tone({ wave: 'triangle', f: 120, f2: 60, dur: 0.1, vol: 0.09 });
        break;
      case 'death':
        [392, 330, 262, 196].forEach((f, i) => {
          tone({ wave: 'm25', f, dur: 0.42, vol: 0.14, delay: i * 0.19, filter: 'lowpass', fc: 1800, fc2: 600 });
        });
        break;
      case 'win':
        [523, 659, 784, 1046, 1318].forEach((f, i) => {
          tone({ wave: 'm25', f, dur: 0.5, vol: 0.13, delay: i * 0.13 });
        });
        break;
      case 'explode':
        noise({ dur: 0.3, vol: 0.15, fc: 1800, fc2: 80, filter: 'lowpass' });
        tone({ wave: 'sine', f: 160, f2: 40, dur: 0.25, vol: 0.12 });
        break;
      case 'clock':
        tone({ wave: 'm125', f: 1180, dur: 0.06, vol: 0.06 });
        break;
      case 'heal':
        tone({ wave: 'sine', f: 440, f2: 880, dur: 0.25, vol: 0.10 });
        break;
    }
  };

  /* ---------------- 音乐 ---------------- */
  // 16 分音符序列器
  const PROG = [
    { root: NOTE.A2, chord: [NOTE.A3, NOTE.C4, NOTE.E4], lead: [NOTE.A4, NOTE.C5, NOTE.E5, NOTE.D5] },
    { root: NOTE.F3 / 2, chord: [NOTE.F3, NOTE.A3, NOTE.C4], lead: [NOTE.C5, NOTE.A4, NOTE.G4, NOTE.E4] },
    { root: NOTE.C3, chord: [NOTE.C4, NOTE.E4, NOTE.G4], lead: [NOTE.E5, NOTE.G5, NOTE.E5, NOTE.C5] },
    { root: NOTE.G3, chord: [NOTE.G3, NOTE.B3, NOTE.D4], lead: [NOTE.D5, NOTE.B4, NOTE.G4, NOTE.A4] },
  ];

  const MELODY = [
    [0, 0, 3], [3, 2, 2], [6, 1, 2], [8, 3, 3], [12, 2, 2], [14, 1, 2],
  ];

  let music = {
    playing: false,
    mood: 'title',
    step: 0,
    bar: 0,
    nextTime: 0,
    timer: null,
    tempo: 100,
    intensity: 0,
  };

  A.music = music;

  function stepDur() { return 60 / music.tempo / 4; }

  function playBar(time, barIndex) {
    const chord = PROG[barIndex % PROG.length];
    const mood = music.mood;
    const dur = stepDur();
    const bus = musicBus;
    const root = chord.root;

    if (mood === 'title') {
      // 稀疏气氛：长音铺底 + 偶尔铃音
      if (music.step === 0) {
        tone({ wave: 'sine', f: root * 2, dur: dur * 15, vol: 0.10, bus, atk: 0.4 });
        tone({ wave: 'triangle', f: root, dur: dur * 15, vol: 0.08, bus, atk: 0.5 });
      }
      if (music.step % 4 === 0) {
        const n = chord.chord[(music.step / 4) % 3] * 2;
        tone({ wave: 'sine', f: n, dur: dur * 3.5, vol: 0.05, bus, atk: 0.02 });
      }
      return;
    }

    const boss = mood === 'boss';
    const intense = music.intensity;

    // 低音
    if (music.step % 2 === 0) {
      const seq = [0, 0, 7, 0, 0, 12, 0, 7];
      const semi = seq[(music.step / 2) % 8];
      const f = root * Math.pow(2, semi / 12);
      tone({ wave: 'triangle', f, dur: dur * 1.6, vol: 0.14, bus, atk: 0.004 });
    }
    // 和声垫
    if (music.step === 0) {
      chord.chord.forEach((n, i) => {
        tone({ wave: 'sine', f: n, dur: dur * 16, vol: 0.035, bus, atk: 0.25 + i * 0.05 });
      });
    }
    // 主旋律
    const mel = MELODY.find((m) => m[0] === music.step);
    if (mel) {
      const f = chord.lead[mel[1]] * (boss ? 1 : 1);
      tone({ wave: 'm25', f, dur: dur * mel[2] * 1.2, vol: 0.075 + intense * 0.02, bus, atk: 0.005 });
      if (intense > 0.55) {
        tone({ wave: 'm125', f: f * 2, dur: dur * mel[2], vol: 0.03, bus });
      }
    }
    // 琶音
    if (intense > 0.25 && music.step % 2 === 1) {
      const n = chord.chord[music.step % 3] * 2;
      tone({ wave: 'm125', f: n, dur: dur * 0.8, vol: 0.022, bus });
    }
    // 打击
    if (music.step === 0 || music.step === 8) {
      tone({ wave: 'sine', f: 130, f2: 45, dur: 0.12, vol: 0.20, bus });
    }
    if (music.step === 4 || music.step === 12) {
      noise({ dur: 0.11, vol: 0.09, fc: 1600, fc2: 600, filter: 'bandpass', bus });
    }
    if (music.step % 2 === 0) {
      noise({ dur: 0.035, vol: 0.035 + intense * 0.02, fc: 7000, filter: 'highpass', bus });
    }
    if (boss && music.step % 4 === 2) {
      tone({ wave: 'sawtooth', f: root * 4, dur: 0.08, vol: 0.03, bus, filter: 'lowpass', fc: 2400 });
    }
  }

  function scheduler() {
    if (!started || !music.playing) return;
    const now = ac.currentTime;
    while (music.nextTime < now + 0.2) {
      playBar(music.nextTime, music.bar);
      music.nextTime += stepDur();
      music.step++;
      if (music.step >= 16) {
        music.step = 0;
        music.bar++;
      }
    }
  }

  A.startMusic = function (mood) {
    if (!started) return;
    music.mood = mood;
    if (!music.playing) {
      music.playing = true;
      music.step = 0; music.bar = 0;
      music.nextTime = ac.currentTime + 0.1;
      music.timer = setInterval(scheduler, 25);
    }
  };

  A.setMood = function (mood) { music.mood = mood; };
  A.setIntensity = function (v) { music.intensity = Math.max(0, Math.min(1, v)); };
  A.setTempo = function (t) { music.tempo = t; };

  A.stopMusic = function () {
    music.playing = false;
    if (music.timer) { clearInterval(music.timer); music.timer = null; }
  };

  A.toggleMusic = function () {
    A.musicOn = !A.musicOn;
    if (musicBus) musicBus.gain.value = A.musicOn ? 0.5 : 0;
    return A.musicOn;
  };
  A.toggleSfx = function () {
    A.sfxOn = !A.sfxOn;
    return A.sfxOn;
  };
})();
