/* Part 6 — The Room, Tone by Tone. Figures 17-19. */

import { figure, knob, readout, fmt, sgn, s } from '../lib/dom.js';
import { scope, note } from '../lib/plot.js';
import { listen, EAR, render } from '../lib/audio.js';
import * as L from '../lib/lti.js';

const ROOM = L.rc(1000);                       // the recurring room, tau = 1 ms

/* ------------------------------------------------------------------
   Figure 17 — sweep the tone and draw the curve yourself.

   The frequency response is not handed over as a formula; the reader
   measures it, one tone at a time, exactly the way an instrument would,
   and the curve appears behind the slider as they go.
   ------------------------------------------------------------------ */

export function sweepFig() {
  const fig = figure({
    n: 17, title: 'Sweep the tone, and the curve draws itself', tag: 'interactive', domains: ['t', 'w'],
    aria: 'Upper panel: a blue input sinusoid and a shrinking orange output sinusoid over three cycles. Lower panel: the measured gain plotted against frequency on a logarithmic axis, filled in as the slider sweeps.',
    caption: 'Every point on the lower curve is one run of the upper panel. Sweep from left to right and you have performed the measurement an instrument makes in a second and an engineer used to make in an afternoon. <b>The curve is the whole system</b> — Part 3\'s sliding sum, replaced by a picture you can read at a glance.',
  });

  const svgA = fig.svg('0 0 720 190', 'A blue input sine and an orange output sine over three cycles.');
  const scA = scope(svgA, {
    w: 720, h: 190, pad: { l: 52, r: 18, t: 24, b: 30 },
    x: { min: 0, max: 3, step: 0.5, title: 'cycles of the input tone', decimals: 1 },
    y: { min: -1.25, max: 1.25, ticks: [-1, 0, 1], title: 'amplitude', decimals: 0 },
  });
  svgA.appendChild(note(52, 14, 'ONE TONE AT A TIME', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  scA.hline(0, { color: 'var(--grid-major)', dash: null });
  const inPath = scA.path({ color: 'var(--in)', width: 2 });
  const outPath = scA.path({ color: 'var(--out)', width: 2.6 });

  const svgB = fig.svg('0 0 720 230', 'The measured gain of the room plotted against frequency on a logarithmic axis.');
  const scB = scope(svgB, {
    w: 720, h: 230, pad: { l: 52, r: 18, t: 24, b: 36 },
    x: { min: 10, max: 10000, log: true, title: 'frequency (Hz) — each step is ten times the last' },
    y: { min: 0, max: 1.1, ticks: [0, 0.25, 0.5, 0.707, 1], title: 'gain  (out ÷ in)', decimals: 2 },
  });
  svgB.appendChild(note(52, 14, 'WHAT YOU HAVE MEASURED SO FAR', { color: 'var(--ink-2)', size: 10, weight: 600 }));

  const ws = Array.from(L.logspace(10, 10000, 400));
  const gains = ws.map((f) => L.cabs(L.freqResp(ROOM, L.TAU * f)));
  scB.path({ color: 'var(--ink-3)', width: 1, dash: '3 4' }).set(ws, gains);
  const measured = scB.path({ color: 'var(--sys)', width: 2.6 });
  scB.hline(Math.SQRT1_2, { color: 'var(--ink-3)', dash: '3 4', label: '0.707 — half the power' });
  scB.vline(159.15, { color: 'var(--ink-3)', dash: '3 4', label: 'the corner, 159 Hz' });
  const marker = scB.dot(300, 0, { color: 'var(--out)', r: 5 });

  const roF = readout('tone', '—', 'tone');
  const roG = readout('gain', '—', 'sys');
  const roPh = readout('phase', '—', 'sys');

  let sweptTo = 300;
  const cyc = Array.from(L.linspace(0, 3, 500));

  function update(logF) {
    const f = Math.pow(10, logF);
    const H = L.freqResp(ROOM, L.TAU * f);
    const g = L.cabs(H), ph = L.carg(H);

    inPath.set(cyc, cyc.map((c) => Math.sin(L.TAU * c)));
    outPath.set(cyc, cyc.map((c) => g * Math.sin(L.TAU * c + ph)));

    sweptTo = Math.max(sweptTo, f);
    const upto = ws.filter((v) => v <= sweptTo);
    measured.set(upto, upto.map((v) => L.cabs(L.freqResp(ROOM, L.TAU * v))));
    marker.move(f, g);

    roF.set(`${f >= 1000 ? fmt(f / 1000, 2) + ' kHz' : fmt(f, 0) + ' Hz'}`, 'tone');
    roG.set(`× ${fmt(g, 3)}`, 'sys');
    roPh.set(`${sgn((ph * 180) / Math.PI, 0)}°`, 'sys');
  }

  const k = knob({
    id: 'fig17-f', label: 'sweep the tone', min: 1, max: 4, step: 0.005, value: Math.log10(300),
    format: (v) => {
      const f = Math.pow(10, v);
      return f >= 1000 ? `${fmt(f / 1000, 2)} kHz` : `${fmt(f, 0)} Hz`;
    },
    oninput: update,
  });

  fig.controls(k.el);
  fig.readouts(roF.el, roG.el, roPh.el);
  update(Math.log10(300));
  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 18 — reading a Bode plot. Reference, labelled inside.
   ------------------------------------------------------------------ */

export function bodeFig() {
  const fig = figure({
    n: 18, title: 'Reading a Bode plot', tag: 'reference', domains: ['w'],
    aria: 'Upper panel: gain in decibels against frequency, both on logarithmic axes, showing a flat region, a corner, and a straight falling line. Lower panel: phase in degrees falling from zero to minus ninety.',
    caption: 'Both axes are squashed logarithmically, which turns the curve into <b>two straight lines and a bend</b>. That is the entire reason anyone puts up with decibels: on these axes a one-pole system is a ruler-and-pencil drawing, and the only number you need to place it is where the bend goes.',
  });

  const svgA = fig.svg('0 0 720 230', 'Gain in decibels versus frequency on logarithmic axes.');
  const scA = scope(svgA, {
    w: 720, h: 230, pad: { l: 56, r: 96, t: 24, b: 30 },
    x: { min: 10, max: 100000, log: true },
    y: { min: -85, max: 12, step: 20, title: 'gain (dB)', decimals: 0 },
    xLabels: false,
  });
  svgA.appendChild(note(56, 14, 'HOW MUCH GETS THROUGH', { color: 'var(--ink-2)', size: 10, weight: 600 }));

  const fsB = Array.from(L.logspace(10, 100000, 600));
  scA.path({ color: 'var(--sys)', width: 2.6 }).set(fsB, fsB.map((f) => L.dB(L.cabs(L.freqResp(ROOM, L.TAU * f)))));
  scA.path({ color: 'var(--ink-3)', width: 1.3, dash: '5 4' }).set([10, 159.15], [0, 0]);
  scA.path({ color: 'var(--ink-3)', width: 1.3, dash: '5 4' })
     .set([159.15, 100000], [0, -20 * Math.log10(100000 / 159.15)]);
  scA.vline(159.15, { color: 'var(--ink-3)', dash: '2 4' });
  scA.dot(159.15, -3.01, { color: 'var(--out)', r: 4.5 });
  scA.text(170, 8, 'flat: everything gets through', { color: 'var(--ink-3)', size: 9.5, anchor: 'end' });
  scA.text(190, -6, 'the corner: 1/(2πτ) = 159 Hz, gain −3 dB', { color: 'var(--out)', size: 9.5 });
  scA.text(2200, -30, 'the asymptotes: two straight lines', { color: 'var(--ink-3)', size: 9.5 });
  scA.text(3000, -52, '−20 dB per decade', { color: 'var(--sys)', size: 10.5, weight: 600 });
  scA.text(3000, -64, '10× the frequency → 1/10 the size', { color: 'var(--sys)', size: 9.5 });
  scA.text(11, -74, 'below the corner the room is a piece of wire', { color: 'var(--ink-3)', size: 9 });

  const svgB = fig.svg('0 0 720 190', 'Phase in degrees versus frequency on a logarithmic axis.');
  const scB = scope(svgB, {
    w: 720, h: 190, pad: { l: 56, r: 96, t: 24, b: 34 },
    x: { min: 10, max: 100000, log: true, title: 'frequency (Hz)' },
    y: { min: -100, max: 12, ticks: [0, -45, -90], title: 'phase (°)', decimals: 0 },
  });
  svgB.appendChild(note(56, 14, 'HOW LATE IT ARRIVES', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  scB.path({ color: 'var(--sys)', width: 2.6 })
     .set(fsB, fsB.map((f) => (L.carg(L.freqResp(ROOM, L.TAU * f)) * 180) / Math.PI));
  scB.vline(159.15, { color: 'var(--ink-3)', dash: '2 4' });
  scB.dot(159.15, -45, { color: 'var(--out)', r: 4.5 });
  scB.text(190, -38, 'exactly −45° at the corner, always', { color: 'var(--out)', size: 9.5 });
  scB.text(11, -12, 'low tones: on time', { color: 'var(--ink-3)', size: 9.5 });
  scB.text(90000, -80, 'high tones: a quarter cycle late', { color: 'var(--ink-3)', size: 9.5, anchor: 'end' });

  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 19 — the payoff. Convolution becomes multiplication.

   The output spectrum in the third panel is NOT computed as
   "harmonic times gain" — that would assume the very thing being
   demonstrated. It is an honest FFT of the simulated output waveform
   from the first panel, over a whole number of periods so there is no
   leakage. That the bars land exactly on blue-times-violet is the
   result, not the method.
   ------------------------------------------------------------------ */

export function multiplyFig() {
  const fig = figure({
    n: 19, title: 'The hard operation, done by multiplying', tag: 'listen', domains: ['t', 'w'],
    aria: 'Three panels: the square wave and its output in time; the input harmonics and the room\'s gain curve in frequency; and the output harmonics, which are the first two multiplied together.',
    caption: 'The bottom bars are measured from the top-panel waveform by transform, not calculated from the middle panel — and they land on blue × violet to three decimal places anyway. <b>That equality is the theorem.</b> Whatever the room does to a signal in time, however tangled, is nothing more than multiplying its recipe by one fixed curve.',
  });

  /* --- panel 1: time --- */
  const svgA = fig.svg('0 0 720 180', 'A 100 hertz square wave in blue and its output through the room in orange.');
  const scA = scope(svgA, {
    w: 720, h: 180, pad: { l: 52, r: 18, t: 24, b: 30 },
    x: { min: 0, max: 20, step: 5, title: 'time (ms)', decimals: 0 },
    y: { min: -1.45, max: 1.45, ticks: [-1, 0, 1], title: 'amplitude', decimals: 0 },
  });
  svgA.appendChild(note(52, 14, 'IN TIME — the tangled version', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  scA.hline(0, { color: 'var(--grid-major)', dash: null });
  const inTime = scA.path({ color: 'var(--in)', width: 1.8 });
  const outTime = scA.path({ color: 'var(--out)', width: 2.6 });

  /* --- panel 2: the recipe and the curve --- */
  const svgB = fig.svg('0 0 720 190', 'The input harmonics as blue lines, with the room\'s gain curve drawn over them in violet.');
  const scB = scope(svgB, {
    w: 720, h: 190, pad: { l: 52, r: 18, t: 24, b: 28 },
    x: { min: 0, max: 1600, step: 200, decimals: 0 },
    y: { min: 0, max: 1.4, ticks: [0, 0.5, 1], title: 'amplitude / gain', decimals: 1 },
    xLabels: false,
  });
  svgB.appendChild(note(52, 14, 'THE INPUT\'S RECIPE (blue) × THE ROOM\'S CURVE (violet)', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  const inStems = scB.stems({ color: 'var(--in)', width: 3.5, dot: 4 });
  const gainCurve = scB.path({ color: 'var(--sys)', width: 2.2 });

  /* --- panel 3: the answer --- */
  const svgC = fig.svg('0 0 720 200', 'The output harmonics as orange lines, measured from the output waveform.');
  const scC = scope(svgC, {
    w: 720, h: 200, pad: { l: 52, r: 18, t: 24, b: 34 },
    x: { min: 0, max: 1600, step: 200, title: 'frequency (Hz)', decimals: 0 },
    y: { min: 0, max: 1.4, ticks: [0, 0.5, 1], title: 'amplitude', decimals: 1 },
  });
  svgC.appendChild(note(52, 14, '= THE OUTPUT\'S RECIPE — measured from the orange waveform above', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  const outStems = scC.stems({ color: 'var(--out)', width: 3.5, dot: 4 });
  const predicted = scC.dots({ color: 'var(--sys)', r: 2 });

  const roTau = readout('τ', '—', 'sys');
  const roH1 = readout('100 Hz ×', '—', 'sys');
  const roH3 = readout('300 Hz ×', '—', 'sys');
  const roCheck = readout('measured vs predicted', '—', 'ok');

  /* 32 periods of 100 Hz simulated, the last 16 transformed — an exact
     whole number of periods, so the transform has no leakage at all. */
  const PER = 0.01, K = 2048;
  const DT = PER * 16 / K;
  let tauMs = 1;

  function update(v) {
    tauMs = v;
    const sys = L.rc(1000 / v);
    const y = L.lsim(sys, (t) => L.square(t, 100), DT, K * 2);
    const tail = y.subarray(K);

    const tsMs = Array.from({ length: 1000 }, (_, i) => (i * 20) / 999);
    inTime.set(tsMs, tsMs.map((ms) => L.square(ms / 1000, 100)));
    outTime.set(tsMs, tsMs.map((ms) => tail[Math.round(ms / 1000 / DT) % K]));

    const fs = [], amps = [];
    for (let n = 1; n * 100 <= 1600; n += 2) { fs.push(n * 100); amps.push(L.harmonic('square', n).amp); }
    inStems.set(fs, amps);

    const gf = [], gg = [];
    for (let f = 0; f <= 1600; f += 8) { gf.push(f); gg.push(L.cabs(L.freqResp(sys, L.TAU * f))); }
    gainCurve.set(gf, gg);

    const sp = L.spectrum(tail, DT);
    const mf = [], ma = [];
    for (let n = 1; n * 100 <= 1600; n += 2) {
      const bin = Math.round((n * 100) * K * DT);
      mf.push(n * 100); ma.push(sp.amp[bin]);
    }
    outStems.set(mf, ma);
    predicted.set(fs, fs.map((f, i) => amps[i] * L.cabs(L.freqResp(sys, L.TAU * f))));

    let worst = 0;
    fs.forEach((f, i) => {
      worst = Math.max(worst, Math.abs(ma[i] - amps[i] * L.cabs(L.freqResp(sys, L.TAU * f))));
    });

    roTau.set(`${fmt(v, 2)} ms`, 'sys');
    roH1.set(fmt(L.cabs(L.freqResp(sys, L.TAU * 100)), 3), 'sys');
    roH3.set(fmt(L.cabs(L.freqResp(sys, L.TAU * 300)), 3), 'sys');
    roCheck.set(`agree to ${fmt(worst, 4)}`, worst < 0.01 ? 'ok' : 'bad');
  }

  const k = knob({
    id: 'fig19-tau', label: 'the room\'s τ', min: 0.1, max: 4, step: 0.05, value: 1,
    format: (v) => `${fmt(v, 2)} ms`,
    oninput: update,
  });

  fig.controls(
    k.el,
    listen({
      label: 'dry, then through the room', seconds: 2.2,
      build: (sr, n) => {
        const half = Math.round(n / 2.2);
        const dry = render((t) => L.square(t, 100 * EAR), sr, half);
        const wet = L.lsim(L.rc((1000 / tauMs) * EAR), (t) => L.square(t, 100 * EAR), 1 / sr, half);
        const gap = Math.round(0.18 * sr);
        const out = new Float32Array(half * 2 + gap);
        for (let i = 0; i < half; i++) out[i] = dry[i] * 0.6;
        let pk = 0; for (let i = 0; i < half; i++) pk = Math.max(pk, Math.abs(wet[i]));
        for (let i = 0; i < half; i++) out[half + gap + i] = (wet[i] / (pk || 1)) * 0.6;
        return out;
      },
    })
  );
  fig.readouts(roTau.el, roH1.el, roH3.el, roCheck.el);
  update(1);
  return fig.root;
}
