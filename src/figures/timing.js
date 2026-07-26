/* Part 3 figures: what a spike carries. */

import { figure, knob, readout, fmt } from '../lib/dom.js';
import { scope } from '../lib/plot.js';
import { LIF, CAST, rateFromCurrent } from '../lib/neuron.js';

/* ---------------------------------------------------------------
   FIGURE 6 — one spike train, two readers
   Knob: stimulus strength.
   Lesson: the counter needs the whole window; the stopwatch is done
   before the second spike even arrives.
   --------------------------------------------------------------- */
export function twoReaders() {
  const fig = figure({
    n: 6,
    title: 'The counter and the stopwatch',
    tag: 'interactive',
    block: 'CH1 · spike train · 100 ms window',
    sweep: '100 ms sweep',
    aria: 'A spike train over a 100 millisecond window. One reader counts every spike in the window; a second reader uses only the time of the first spike. Stimulus strength is adjustable.',
    caption: 'Both readers are looking at the <b>same spikes</b>. The counter has to wait for the window to close; the stopwatch has an answer as soon as the first spike lands. This is why latency codes dominate the fast reflexes — a fly does not have 100&nbsp;ms to take an average.',
  });

  const svg = fig.svg('0 0 720 230');
  const sc = scope(svg, {
    w: 720, h: 230, pad: { l: 64, r: 20, t: 16, b: 44 },
    x: { min: 0, max: 0.1, step: 0.02, decimals: 2, title: 'TIME (s)' },
    y: { min: 0, max: 3, ticks: [], title: '' },
  });

  sc.band(0, 0.1, { color: 'var(--v-wash)' });
  const rowSpikes = sc.raster(2.1, { color: 'var(--spike)', height: 34, width: 2.2 });
  const firstMark = sc.vline(0.014, { color: 'var(--exc)', width: 2, y0: 0.45, y1: 2.6 });
  const firstDot = sc.dot(0.014, 2.1, { color: 'var(--exc)', r: 5 });
  const latText = sc.text(0.016, 0.72, '', { color: 'var(--exc)', size: 10.5, weight: 600 });
  const cntText = sc.text(0.098, 2.78, '', { color: 'var(--v)', size: 10.5, weight: 600, anchor: 'end' });

  // annotations sit next to the thing they name — no legend to shuttle to
  sc.text(-0.002, 2.1, 'spikes', { color: 'var(--ink-2)', size: 9.5, anchor: 'end', dy: 4 });
  sc.text(0.002, 2.78, 'READER A · counts everything in the window', { color: 'var(--v)', size: 9.5 });
  sc.text(0.002, 0.42, 'READER B · reads only the first spike', { color: 'var(--exc)', size: 9.5 });

  const roI    = readout('Stimulus', '—', 'exc');
  const roCnt  = readout('Reader A · count', '—', 'v');
  const roLat  = readout('Reader B · latency', '—', 'exc');
  const roWait = readout('Answer ready after', '—', 'spike');
  fig.readouts(roI.el, roCnt.el, roLat.el, roWait.el);

  const DT = 0.00005, T_END = 0.1;

  function run(I) {
    const n = new LIF();
    const spikes = [];
    for (let i = 0; i * DT < T_END; i++) if (n.step(DT, I)) spikes.push(i * DT);
    rowSpikes.set(spikes);

    const first = spikes.length ? spikes[0] : null;
    if (first !== null) {
      firstMark.el.style.display = ''; firstDot.el.style.display = '';
      firstMark.move(first); firstDot.move(first, 2.1);
      latText.move(first + 0.002, 0.7);
      latText.set(`${fmt(first * 1000, 1)} ms`);
    } else {
      firstMark.el.style.display = 'none'; firstDot.el.style.display = 'none';
      latText.set('');
    }
    cntText.set(`${spikes.length} spikes in the window`);

    roI.set(`${fmt(I, 2)} nA`);
    roCnt.set(`${spikes.length}  (${fmt(rateFromCurrent(I), 0)} Hz)`);
    roLat.set(first !== null ? `${fmt(first * 1000, 1)} ms` : 'never');
    roWait.set(first !== null
      ? `A: 100 ms · B: ${fmt(first * 1000, 1)} ms — ${fmt(0.1 / first, 0)}× sooner`
      : 'no answer from either');
  }

  const k = knob({
    id: 'coding-drive', label: 'Stimulus strength',
    min: 0.21, max: 1, step: 0.01, value: 0.4,
    format: (v) => `${fmt(v, 2)} nA`,
    oninput: run,
  });
  fig.controls(k.el);
  run(0.4);
  return fig.root;
}

/* ---------------------------------------------------------------
   FIGURE 7 — coincidence detection
   Knob: the gap between two input spikes.
   Lesson: a leaky neuron is an AND gate with a tolerance window,
   and the leak sets the width of that window.
   --------------------------------------------------------------- */
export function coincidence() {
  const fig = figure({
    n: 7,
    title: 'Two splashes, one bucket',
    tag: 'interactive',
    block: 'CH1 · Vm · mV',
    sweep: '60 ms sweep',
    aria: 'Membrane voltage when two 12 millivolt inputs arrive with an adjustable gap between them. The neuron only fires when the gap is small.',
    caption: 'Two inputs, each worth 12&nbsp;mV, into a neuron that needs 20&nbsp;mV. Neither can do it alone. Together they can — but only while the first is still standing. <b>The coincidence window here is 8.1&nbsp;ms</b>, and it is set entirely by τ: halve the time constant and you halve the window.',
  });

  const svg = fig.svg('0 0 720 240');
  const sc = scope(svg, {
    w: 720, h: 240, pad: { l: 54, r: 20, t: 16, b: 44 },
    x: { min: 0, max: 0.06, step: 0.01, decimals: 3, title: 'TIME (s)' },
    y: { min: -5, max: 28, ticks: [0, 10, 20], title: 'Vm (mV)' },
  });
  sc.hline(CAST.vTh, { color: 'var(--spike)', label: 'threshold 20 mV' });
  sc.hline(0, { color: 'var(--ink-3)', dash: '2 4' });

  const gapBand = sc.band(0.01, 0.014, { color: 'var(--exc-wash)' });
  const vPath = sc.path({ color: 'var(--v)', width: 2 });
  const inA = sc.vline(0.01, { color: 'var(--exc)', width: 2, y0: -4, y1: 24 });
  const inB = sc.vline(0.014, { color: 'var(--exc)', width: 2, y0: -4, y1: 24 });
  const gapText = sc.text(0.012, -3.2, '', { color: 'var(--exc)', size: 10, weight: 600, anchor: 'middle' });
  const outRaster = sc.raster(26, { color: 'var(--spike)', height: 12 });
  sc.text(0.0005, 26, 'output', { color: 'var(--spike)', size: 9.5, dy: -9 });

  const roGap  = readout('Gap between inputs', '—', 'exc');
  const roPeak = readout('Peak level', '—', 'v');
  const roOut  = readout('Output', '—', 'spike');
  const roWin  = readout('Coincidence window', '8.1 ms', 'v');
  fig.readouts(roGap.el, roPeak.el, roOut.el, roWin.el);

  const W = 12, T0 = 0.01, DT = 0.00005, T_END = 0.06;

  function run(gapMs) {
    const gap = gapMs / 1000;
    const n = new LIF();
    const xs = [], ys = [], outs = [];
    let firedA = false, firedB = false, peak = 0;
    for (let i = 0; i * DT < T_END; i++) {
      const t = i * DT;
      let inject = 0;
      if (!firedA && t >= T0) { inject += W; firedA = true; }
      if (!firedB && t >= T0 + gap) { inject += W; firedB = true; }
      const fired = n.step(DT, 0, inject);
      if (fired) outs.push(t);
      peak = Math.max(peak, fired ? CAST.vTh : n.v);
      if (i % 2 === 0) { xs.push(t); ys.push(fired ? CAST.vTh + 5 : n.v); }
    }
    vPath.set(xs, ys);
    outRaster.set(outs);
    inA.move(T0); inB.move(T0 + gap);
    gapBand.set(T0, T0 + gap);
    gapText.move(T0 + gap / 2, -3.2);
    gapText.set(`Δt = ${fmt(gapMs, 1)} ms`);

    roGap.set(`${fmt(gapMs, 1)} ms`);
    roPeak.set(`${fmt(Math.min(peak, CAST.vTh), 1)} mV`);
    roOut.set(outs.length ? 'FIRES' : 'silent');
    roOut.el.querySelector('.ro__v').setAttribute('data-q', outs.length ? 'spike' : 'v');
  }

  const k = knob({
    id: 'coinc-gap', label: 'Gap between the two inputs',
    min: 0, max: 30, step: 0.5, value: 4,
    format: (v) => `${fmt(v, 1)} ms`,
    oninput: run,
  });
  fig.controls(k.el);
  run(4);
  return fig.root;
}
