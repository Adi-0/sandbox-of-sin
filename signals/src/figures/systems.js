/* Part 2 — The Two Promises. Figures 4-5. */

import { figure, knob, readout, fmt, s } from '../lib/dom.js';
import { scope, note } from '../lib/plot.js';
import * as L from '../lib/lti.js';

/* The two boxes the whole part is about. Both appear in both figures,
   so the reader is comparing the same pair twice, from two angles. */

const ECHO_DELAY = 0.002;                       // 2 ms
const echoBox = (x) => (t) => 0.5 * x(t) + 0.5 * x(t - ECHO_DELAY);
const clipBox = (x) => (t) => L.clamp(x(t), -1, 1);
const tremoloBox = (x) => (t) => x(t) * (0.5 + 0.5 * Math.sin(L.TAU * 60 * t));

/** A labelled sub-plot inside its own SVG. Used twice per figure. */
function subplot(fig, { title, subtitle, tSpan, yMax, yStep }) {
  const svg = fig.svg('0 0 720 172', `${title}: ${subtitle}`);
  const sc = scope(svg, {
    w: 720, h: 172, pad: { l: 46, r: 18, t: 30, b: 30 },
    x: { min: 0, max: tSpan * 1000, step: (tSpan * 1000) / 4, title: 'time (ms)', decimals: 0 },
    y: { min: -yMax, max: yMax, step: yStep, decimals: 1 },
  });
  svg.appendChild(note(46, 15, title, { color: 'var(--ink-2)', size: 10, weight: 600 }));
  svg.appendChild(note(702, 15, subtitle, { color: 'var(--ink-3)', size: 10, anchor: 'end' }));
  sc.hline(0, { color: 'var(--grid-major)', dash: null });
  return sc;
}

/* ------------------------------------------------------------------
   Figure 4 — linearity, tested.
   Solid = what the box does to A+B. Dashed = what it does to A, plus
   what it does to B. If those two curves are the same curve, the box
   keeps the first promise.
   ------------------------------------------------------------------ */

export function linearityTest() {
  const fig = figure({
    n: 4, title: 'Two boxes, one slider', tag: 'interactive', domains: ['t'],
    aria: 'Two plots. In each, a solid orange curve shows the response to two tones sent together, and a dashed blue curve shows the two responses added afterwards. In the upper plot they lie exactly on top of each other; in the lower plot they separate as the input amplitude rises.',
    caption: 'Turn the slider down to 0.5 and the clipping box passes the test too — nothing has reached the ceiling yet. <b>Linearity is not a property a box either has or lacks; it is a promise a box keeps over some range of inputs and breaks outside it.</b> Every amplifier you own is linear until it is not.',
  });

  const N = 700, T = 0.02;
  const ts = Array.from({ length: N }, (_, i) => (i * T) / (N - 1));
  const tsMs = ts.map((t) => t * 1000);

  const top = subplot(fig, { title: 'LINEAR BOX — an echo: half of now, plus half of 2 ms ago', subtitle: 'keeps the promise', tSpan: T, yMax: 2.8, yStep: 1.4 });
  const bot = subplot(fig, { title: 'NONLINEAR BOX — a loudspeaker that cannot move past ±1', subtitle: 'breaks it', tSpan: T, yMax: 2.8, yStep: 1.4 });

  top.hline(1, { color: 'var(--ink-3)', dash: '2 5' });
  bot.hline(1, { color: 'var(--bad)', dash: '2 5', label: 'the ceiling' });
  bot.hline(-1, { color: 'var(--bad)', dash: '2 5' });

  const pathTogether = [top, bot].map((sc) => sc.path({ color: 'var(--out)', width: 2.4 }));
  const pathApart = [top, bot].map((sc) => sc.path({ color: 'var(--in)', width: 1.7, dash: '5 4' }));
  top.text(0.3, 2.35, 'solid: both tones sent together · dashed: sent separately, added after', { color: 'var(--ink-3)', size: 9.5 });

  const inPeak = readout('input peak', '—', 'in');
  const mLin = readout('linear box mismatch', '—', 'ok');
  const mClip = readout('clipping box mismatch', '—', 'bad');

  function update(a) {
    const A = (t) => a * Math.sin(L.TAU * 100 * t);
    const B = (t) => 0.6 * a * Math.sin(L.TAU * 300 * t);
    const AB = (t) => A(t) + B(t);

    let peak = 0;
    for (const t of ts) peak = Math.max(peak, Math.abs(AB(t)));

    [echoBox, clipBox].forEach((box, i) => {
      const fTogether = box(AB);
      const fA = box(A), fB = box(B);
      const yTogether = ts.map(fTogether);
      const yApart = ts.map((t) => fA(t) + fB(t));
      pathTogether[i].set(tsMs, yTogether);
      pathApart[i].set(tsMs, yApart);
      let d = 0;
      for (let j = 0; j < N; j++) d = Math.max(d, Math.abs(yTogether[j] - yApart[j]));
      (i === 0 ? mLin : mClip).set(fmt(d, 3), i === 0 ? (d < 1e-9 ? 'ok' : 'bad') : (d < 1e-9 ? 'ok' : 'bad'));
    });

    inPeak.set(fmt(peak, 2), 'in');
  }

  const k = knob({
    id: 'fig4-amp', label: 'input amplitude', min: 0.2, max: 1.6, step: 0.02, value: 1.2,
    format: (v) => `${fmt(v, 2)} × two tones`,
    oninput: update,
  });

  fig.controls(k.el);
  fig.readouts(inPeak.el, mLin.el, mClip.el);
  update(1.2);
  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 5 — time invariance.
   Same two-box structure, different promise. The dashed grey trace is
   the t0 = 0 output, slid along by t0 — so if the box has no calendar,
   the dashed and solid traces are the same drawing.
   ------------------------------------------------------------------ */

const bump = (t, t0) => Math.exp(-Math.pow((t - t0) / 0.0015, 2));

export function timeInvariance() {
  const fig = figure({
    n: 5, title: 'The system with no calendar', tag: 'interactive', domains: ['t'],
    aria: 'Two plots showing the response of two boxes to a pulse whose arrival time is set by a slider. The upper box gives the same output shape wherever the pulse arrives; the lower box gives a different shape each time.',
    caption: 'The grey dashed trace is the box\'s answer at t₀ = 0, simply slid along to the new arrival time. In the upper box it disappears under the solid curve at every slider position. <b>The lower box is not broken or exotic</b> — it is a volume knob being turned. It is disqualified anyway, and that is how strict this promise is.',
  });

  const N = 620, T = 0.024;
  const ts = Array.from({ length: N }, (_, i) => (i * T) / (N - 1));
  const tsMs = ts.map((t) => t * 1000);

  const inSc = subplot(fig, { title: 'THE CLAP — you choose when', subtitle: 'input', tSpan: T, yMax: 1.25, yStep: 0.5 });
  const top = subplot(fig, { title: 'TIME-INVARIANT BOX — the same echo, whenever you clap', subtitle: 'keeps the promise', tSpan: T, yMax: 1.25, yStep: 0.5 });
  const bot = subplot(fig, { title: 'TIME-VARYING BOX — someone is turning the volume knob', subtitle: 'breaks it', tSpan: T, yMax: 1.25, yStep: 0.5 });

  const inPath = inSc.path({ color: 'var(--in)', width: 2.3 });
  const outPaths = [top, bot].map((sc) => sc.path({ color: 'var(--out)', width: 2.3 }));
  const refPaths = [top, bot].map((sc) => sc.path({ color: 'var(--ink-3)', width: 1.6, dash: '5 4' }));
  top.text(0.3, 1.05, 'dashed grey: the t₀ = 0 answer, simply slid along', { color: 'var(--ink-3)', size: 9.5 });

  // the reference answers, computed once at t0 = 0
  const ref = [echoBox, tremoloBox].map((box) => ts.map(box((t) => bump(t, 0))));

  const arrival = readout('clap at', '—', 'in');
  const dTI = readout('time-invariant box', '—', 'ok');
  const dTV = readout('time-varying box', '—', 'bad');

  function update(t0ms) {
    const t0 = t0ms / 1000;
    const x = (t) => bump(t, t0);
    inPath.set(tsMs, ts.map(x));

    [echoBox, tremoloBox].forEach((box, i) => {
      const y = ts.map(box(x));
      outPaths[i].set(tsMs, y);
      // the reference, shifted: sample ref[] at (t - t0)
      const shifted = ts.map((t) => {
        const u = ((t - t0) / T) * (N - 1);
        if (u < 0 || u > N - 1) return 0;
        const j = Math.floor(u), f = u - j;
        return ref[i][j] * (1 - f) + ref[i][Math.min(N - 1, j + 1)] * f;
      });
      refPaths[i].set(tsMs, shifted);
      let d = 0;
      for (let j = 0; j < N; j++) d = Math.max(d, Math.abs(y[j] - shifted[j]));
      (i === 0 ? dTI : dTV).set(`shape change ${fmt(d, 3)}`, d < 0.005 ? 'ok' : 'bad');
    });

    arrival.set(`${fmt(t0ms, 1)} ms`, 'in');
  }

  const k = knob({
    id: 'fig5-when', label: 'when you clap', min: 0, max: 12, step: 0.25, value: 5,
    format: (v) => `t₀ = ${fmt(v, 2)} ms`,
    oninput: update,
  });

  fig.controls(k.el);
  fig.readouts(arrival.el, dTI.el, dTV.el);
  update(5);
  return fig.root;
}
