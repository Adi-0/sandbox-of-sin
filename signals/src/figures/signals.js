/* Part 1 — Everything That Varies. Figures 1-3. */

import { figure, knob, scenarios, readout, fmt, s } from '../lib/dom.js';
import { scope, note } from '../lib/plot.js';
import * as L from '../lib/lti.js';

/* ------------------------------------------------------------------
   Figure 1 — one trace, four professions.

   The trace is the step response of the guide's second-order room
   (wn = 1000 rad/s, zeta = 0.2). The reader meets ringing, overshoot
   and settling time here, six parts before they are given the names.
   ------------------------------------------------------------------ */

const TRACE_N = 420;
const TRACE = (() => {
  const y = L.stepResponse(L.resonant(1000, 0.2), 0.04 / (TRACE_N - 1), TRACE_N);
  return Array.from(y);
})();
const TRACE_PEAK = Math.max(...TRACE);

const SCENES = {
  mic: {
    label: 'Microphone', base: 0, span: 40, unit: 'mV', dec: 0,
    tSpan: 40, tUnit: 'ms', tDec: 0,
    y: 'microphone voltage (mV)', x: 'time (ms)',
    story: 'a drum skin, struck once',
  },
  bp: {
    label: 'Blood pressure', base: 80, span: 40, unit: 'mmHg', dec: 0,
    tSpan: 800, tUnit: 'ms', tDec: 0,
    y: 'arterial pressure (mmHg)', x: 'time (ms)',
    story: 'one heartbeat',
  },
  temp: {
    label: 'Room temperature', base: 18, span: 3, unit: '°C', dec: 1,
    tSpan: 4, tUnit: 'h', tDec: 1,
    y: 'room temperature (°C)', x: 'time (hours)',
    story: 'the heating switching on',
  },
  price: {
    label: 'Share price', base: 40, span: 12, unit: '$', dec: 2,
    tSpan: 90, tUnit: 'days', tDec: 0,
    y: 'share price ($)', x: 'time (days)',
    story: 'a company beating its forecast',
  },
};

export function oneTrace() {
  const fig = figure({
    n: 1, title: 'One trace, four professions', tag: 'interactive', domains: ['t'],
    aria: 'A single curve that rises, overshoots its final level, rings, and settles — drawn four times with different axis labels and units.',
    caption: 'This is <b>one array of numbers, drawn four times</b>. Only the axis labels and the units change; the shape, the 53% overshoot and the settling time are identical in all four. Real arterial pressure has a sharper upstroke than this and real share prices are far noisier — the honest claim is narrower and more useful: whatever produced the numbers, every tool in this guide operates on the numbers alone.',
  });

  const svg = fig.svg('0 0 720 250');
  let current = 'mic';

  const val = readout('final', '—');
  const pk = readout('peak', '—');
  const ov = readout('overshoot', '52.7 %');
  const st = readout('settled by', '—');
  const wh = readout('this is', '—');

  function draw() {
    const c = SCENES[current];
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const lo = c.base - 0.12 * c.span;
    const hi = c.base + 1.75 * c.span;
    const sc = scope(svg, {
      w: 720, h: 250, pad: { l: 66, r: 18, t: 16, b: 34 },
      x: { min: 0, max: c.tSpan, title: c.x, decimals: c.tDec },
      y: { min: lo, max: hi, title: c.y, decimals: c.dec },
    });

    const xs = TRACE.map((_, i) => (i / (TRACE_N - 1)) * c.tSpan);
    const ys = TRACE.map((v) => c.base + v * c.span);

    sc.hline(c.base + c.span, { color: 'var(--ink-3)', dash: '3 4', label: 'where it ends up' });
    sc.path({ color: 'var(--in)', width: 2.2 }).set(xs, ys);

    const pi = TRACE.indexOf(TRACE_PEAK);
    sc.dot(xs[pi], ys[pi], { color: 'var(--in)', r: 3.5 });
    sc.text(xs[pi], ys[pi], 'overshoot', { color: 'var(--in)', dy: -9, dx: 6 });

    val.set(`${fmt(c.base + c.span, c.dec)} ${c.unit}`, 'in');
    pk.set(`${fmt(c.base + TRACE_PEAK * c.span, c.dec)} ${c.unit}`, 'in');
    st.set(`${fmt(0.5 * c.tSpan, c.tDec)} ${c.tUnit}`);
    wh.set(c.story);
  }

  const pick = scenarios({
    label: 'What the numbers came from',
    options: Object.entries(SCENES).map(([value, c]) => ({ value, label: c.label })),
    value: current,
    onchange: (v) => { current = v; draw(); },
  });

  fig.controls(pick.el);
  fig.readouts(wh.el, val.el, pk.el, ov.el, st.el);
  draw();
  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 2 — the four shapes. A reference drawing, labelled inside.
   ------------------------------------------------------------------ */

export function buildingBlocks() {
  const fig = figure({
    n: 2, title: 'The four shapes everything else is made of', tag: 'reference', domains: ['t'],
    aria: 'Four small plots: an impulse drawn as an upward arrow, a step that jumps from zero to one, a sinusoid, and a decaying exponential.',
    caption: 'The impulse is drawn as an arrow because it has no height to draw — its <b>area</b> is one, its width is nothing, and no laboratory has ever produced one. It is still the most useful signal in the subject, for the reason Part 3 is about.',
  });

  const svg = fig.svg('0 0 720 210');
  const W = 175, H = 128, TOP = 30, GAP = 6;

  const cells = [
    {
      name: 'IMPULSE', sym: 'δ(t)', use: 'the single clap',
      draw(g, X, Y) {
        g.appendChild(s('line', { x1: X(0.5), x2: X(0.5), y1: Y(0), y2: Y(0.88), stroke: 'var(--in)', 'stroke-width': 2.4 }));
        g.appendChild(s('path', { d: `M${X(0.5)} ${Y(0.88)} l -4.5 8 l 9 0 Z`, fill: 'var(--in)' }));
        g.appendChild(note(X(0.5) + 8, Y(0.7), 'area = 1', { color: 'var(--in)', size: 9 }));
      },
    },
    {
      name: 'STEP', sym: 'u(t)', use: 'switching on',
      draw(g, X, Y) {
        g.appendChild(s('path', {
          d: `M${X(0)} ${Y(0)} L${X(0.5)} ${Y(0)} L${X(0.5)} ${Y(0.8)} L${X(1)} ${Y(0.8)}`,
          fill: 'none', stroke: 'var(--in)', 'stroke-width': 2.4, 'stroke-linejoin': 'round',
        }));
        g.appendChild(note(X(0.55), Y(0.9), 'jumps to 1', { color: 'var(--in)', size: 9 }));
      },
    },
    {
      name: 'SINUSOID', sym: 'sin(ωt)', use: 'the pure tone',
      draw(g, X, Y) {
        let d = '';
        for (let i = 0; i <= 90; i++) {
          const u = i / 90;
          d += (i ? 'L' : 'M') + X(u) + ' ' + Y(0.42 + 0.42 * Math.sin(2 * Math.PI * 1.8 * u)) + ' ';
        }
        g.appendChild(s('path', { d, fill: 'none', stroke: 'var(--tone)', 'stroke-width': 2.4 }));
        g.appendChild(note(X(0.04), Y(0.96), 'never stops, never changes shape', { color: 'var(--tone)', size: 9 }));
      },
    },
    {
      name: 'EXPONENTIAL', sym: 'e^(−t/τ)', use: 'everything that fades',
      draw(g, X, Y) {
        let d = '';
        for (let i = 0; i <= 90; i++) {
          const u = i / 90;
          d += (i ? 'L' : 'M') + X(u) + ' ' + Y(0.85 * Math.exp(-3.2 * u)) + ' ';
        }
        g.appendChild(s('path', { d, fill: 'none', stroke: 'var(--sys)', 'stroke-width': 2.4 }));
        g.appendChild(s('line', { x1: X(0.312), x2: X(0.312), y1: Y(0), y2: Y(0.313), stroke: 'var(--sys)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }));
        g.appendChild(note(X(0.36), Y(0.42), 'τ: down to 37%', { color: 'var(--sys)', size: 9 }));
      },
    },
  ];

  cells.forEach((cell, i) => {
    const x0 = 10 + i * (W + GAP);
    const g = s('g');
    g.appendChild(s('rect', { x: x0, y: TOP, width: W, height: H, fill: 'var(--vellum)', stroke: 'var(--grid-major)' }));
    const X = (u) => x0 + 10 + u * (W - 20);
    const Y = (v) => TOP + H - 16 - v * (H - 32);
    g.appendChild(s('line', { x1: x0 + 6, x2: x0 + W - 6, y1: Y(0), y2: Y(0), stroke: 'var(--grid-major)' }));
    cell.draw(g, X, Y);
    g.appendChild(note(x0, TOP - 14, cell.name, { color: 'var(--ink-2)', size: 10, weight: 600 }));
    g.appendChild(note(x0 + W, TOP - 14, cell.sym, { color: 'var(--ink-3)', size: 10, anchor: 'end' }));
    g.appendChild(note(x0 + W / 2, TOP + H + 16, cell.use, { color: 'var(--ink-3)', size: 10, anchor: 'middle' }));
    svg.appendChild(g);
  });

  svg.appendChild(note(10, 16, 'FOUR SIGNALS. EVERY OTHER SIGNAL IN THIS GUIDE IS BUILT OUT OF THEM.', { color: 'var(--ink-3)', size: 9.5 }));
  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 3 — moving a signal in time.
   The one confusion worth spending a whole figure on.
   ------------------------------------------------------------------ */

const PULSE = (t) => Math.exp(-Math.pow((t - 0.3) / 0.25, 2)) + 0.62 * Math.exp(-Math.pow((t - 0.95) / 0.11, 2));

export function timeShift() {
  const fig = figure({
    n: 3, title: 'Moving a signal in time', tag: 'interactive', domains: ['t'],
    aria: 'An asymmetric two-humped pulse, shown in its original position in grey and shifted along the time axis in blue as a slider is dragged.',
    caption: 'Watch the sign. A <b>minus</b> inside the brackets moves the picture to the <b>right</b> — later. It reads backwards because the argument is not the position of the picture, it is which part of the original you are being asked for. Figure 8 needs this, and needs it flipped as well.',
  });

  const svg = fig.svg('0 0 720 220');
  const sc = scope(svg, {
    w: 720, h: 220, pad: { l: 46, r: 18, t: 16, b: 34 },
    x: { min: -1.5, max: 3.5, step: 0.5, title: 'time  t  (seconds)', decimals: 1 },
    y: { min: -0.25, max: 1.35, ticks: [0, 0.5, 1], title: 'x(t)', decimals: 1 },
  });
  sc.hline(0, { color: 'var(--grid-major)', dash: null });

  const xs = L.linspace(-1.5, 3.5, 500);
  const original = sc.path({ color: 'var(--ink-3)', width: 1.4, dash: '4 4' });
  const shifted = sc.path({ color: 'var(--in)', width: 2.3 });
  const marker = sc.vline(0.3, { color: 'var(--in)', dash: '3 3' });
  const label = sc.text(0.3, 1.22, 'x(t)', { color: 'var(--in)', anchor: 'middle', size: 11 });

  original.set(Array.from(xs), Array.from(xs).map(PULSE));
  sc.text(-1.42, 1.22, 'dashed: where it started', { color: 'var(--ink-3)', size: 10 });

  const peakAt = readout('first hump at', '0.30 s', 'in');
  const expr = readout('drawing', 'x(t)', 'in');

  const k = knob({
    id: 'fig3-shift', label: 'shift', min: -1, max: 2, step: 0.05, value: 0,
    format: (v) => (v === 0 ? 't₀ = 0 s' : `t₀ = ${fmt(v, 2)} s`),
    oninput: (v) => update(v),
  });

  function update(t0) {
    shifted.set(Array.from(xs), Array.from(xs).map((t) => PULSE(t - t0)));
    marker.move(0.3 + t0);
    label.move(0.3 + t0, 1.22);
    label.set(t0 === 0 ? 'x(t)' : `x(t − ${fmt(t0, 2)})`);
    peakAt.set(`${fmt(0.3 + t0, 2)} s`, 'in');
    expr.set(t0 === 0 ? 'x(t)' : t0 > 0 ? `x(t − ${fmt(t0, 2)})  →  later` : `x(t + ${fmt(-t0, 2)})  →  earlier`, 'in');
  }

  fig.controls(k.el);
  fig.readouts(expr.el, peakAt.el);
  update(0);
  return fig.root;
}
