/* Part 2 figures: the leaky bucket, made literal. */

import { figure, knob, readout, fmt, s } from '../lib/dom.js';
import { scope } from '../lib/plot.js';
import { LIF, CAST, rateFromCurrent, rheobase } from '../lib/neuron.js';

const MONO = { 'font-family': 'var(--font-mono)', 'font-size': 10.5 };

const tag = (x, y, text, color = 'var(--ink-2)', anchor = 'start', size = 10.5) =>
  s('text', { x, y, fill: color, 'text-anchor': anchor, ...MONO, 'font-size': size, text });

const leader = (x1, y1, x2, y2, color = 'var(--ink-3)') =>
  s('path', { d: `M${x1} ${y1} L${x2} ${y2}`, stroke: color, 'stroke-width': 1, fill: 'none' });

/* ---------------------------------------------------------------
   FIGURE 3 — anatomy, twice
   A reference drawing. Same object, two vocabularies, one colour code.
   --------------------------------------------------------------- */
export function anatomy() {
  const fig = figure({
    n: 3,
    title: 'The same machine, drawn twice',
    tag: 'reference',
    block: 'Anatomy · bucket ↔ neuron',
    aria: 'A labelled cross-section of a leaking bucket beside a labelled drawing of a neuron, with matching colours: teal inflow equals excitation, indigo drain equals inhibition, amber level equals membrane voltage, magenta overflow equals a spike.',
    caption: 'Matching colours mark matching parts. This is a caricature on purpose: a real neuron has thousands of inputs, active dendrites that do their own arithmetic, and a dozen kinds of ion channel. <b>Everything in this guide is built on the caricature</b>, and it still gets you to working silicon.',
  });

  const svg = fig.svg('0 0 720 330');

  /* ---- left: the bucket ---- */
  const B = { l: 118, r: 252, top: 96, bot: 264 };
  const bucket = s('path', {
    d: `M${B.l} ${B.top} L${B.l + 12} ${B.bot} L${B.r - 12} ${B.bot} L${B.r} ${B.top}`,
    fill: 'var(--paper-3)', stroke: 'var(--ink-2)', 'stroke-width': 2, 'stroke-linejoin': 'round',
  });
  // water: sits at 60 % of the way up
  const waterTop = 186;
  const water = s('path', {
    d: `M${B.l + 6.4} ${waterTop} L${B.l + 12} ${B.bot} L${B.r - 12} ${B.bot} L${B.r - 6.4} ${waterTop} Z`,
    fill: 'var(--v-wash)', stroke: 'var(--v)', 'stroke-width': 2,
  });

  svg.append(
    tag(40, 26, 'A BUCKET WITH A HOLE IN IT', 'var(--ink-3)', 'start', 10),
    bucket, water,

    // inflow — excitation
    s('path', { d: 'M42 58 L96 58 L126 92', stroke: 'var(--exc)', 'stroke-width': 3.4, fill: 'none', 'stroke-linecap': 'round' }),
    s('path', { d: 'M120 84 L128 94 L116 95 Z', fill: 'var(--exc)' }),
    tag(40, 46, 'water in', 'var(--exc)'),

    // drain — inhibition
    s('path', { d: 'M330 58 L272 58 L246 92', stroke: 'var(--inh)', 'stroke-width': 3.4, fill: 'none', 'stroke-linecap': 'round' }),
    s('path', { d: 'M252 84 L244 94 L256 95 Z', fill: 'var(--inh)' }),
    tag(332, 46, 'water out', 'var(--inh)'),

    // threshold / overflow notch
    s('line', { x1: B.l - 14, x2: B.r + 44, y1: 120, y2: 120, stroke: 'var(--spike)', 'stroke-width': 1.6, 'stroke-dasharray': '5 4' }),
    tag(B.r + 48, 116, 'overflow line', 'var(--spike)'),
    tag(B.r + 48, 130, 'threshold, 20 mV', 'var(--ink-3)', 'start', 9.5),

    // the level — leader runs from the label to the water surface itself
    leader(100, waterTop, B.l + 8, waterTop),
    tag(96, waterTop - 16, 'the level', 'var(--v)', 'end'),
    tag(96, waterTop - 4, 'membrane voltage', 'var(--ink-3)', 'end', 9),

    // the hole
    s('circle', { cx: B.l + 9, cy: 238, r: 4.5, fill: 'var(--paper)', stroke: 'var(--ink-2)', 'stroke-width': 1.6 }),
    s('path', { d: 'M112 240 q -14 10 -22 26', stroke: 'var(--v)', 'stroke-width': 2, fill: 'none', 'stroke-dasharray': '2 5', 'stroke-linecap': 'round' }),
    tag(40, 292, 'the hole — it leaks', 'var(--ink-2)'),
    tag(40, 306, 'time constant τ = 20 ms', 'var(--ink-3)', 'start', 9.5),

    // reset
    s('path', { d: `M${B.r + 4} 150 q 26 24 4 46`, stroke: 'var(--ink-3)', 'stroke-width': 1.4, fill: 'none' }),
    s('path', { d: `M${B.r + 4} 190 l 8 4 l -1 -11 z`, fill: 'var(--ink-3)' }),
    tag(B.r + 26, 182, 'then it empties', 'var(--ink-3)', 'start', 9.5)
  );

  /* ---- right: the neuron ---- */
  const cx = 528, cy = 180;
  const dend = (a, b, c, d) => s('path', {
    d: `M${a} ${b} Q ${(a + c) / 2} ${(b + d) / 2 - 14} ${c} ${d}`,
    stroke: 'var(--exc)', 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round',
  });

  svg.append(
    tag(410, 26, 'A NEURON', 'var(--ink-3)', 'start', 10),
    dend(422, 120, cx - 26, cy - 16),
    dend(414, 160, cx - 30, cy - 2),
    dend(422, 206, cx - 26, cy + 14),
    tag(410, 100, 'dendrites', 'var(--exc)'),
    tag(410, 240, 'excitatory synapses', 'var(--ink-3)', 'start', 9),

    // inhibitory terminal onto the soma
    s('path', { d: `M640 104 Q 596 116 ${cx + 18} ${cy - 26}`, stroke: 'var(--inh)', 'stroke-width': 2.6, fill: 'none' }),
    s('circle', { cx: cx + 20, cy: cy - 28, r: 5, fill: 'var(--inh)' }),
    tag(700, 96, 'inhibitory synapse', 'var(--inh)', 'end', 9.5),

    // soma, filled to the "level"
    s('circle', { cx, cy, r: 34, fill: 'var(--paper-3)', stroke: 'var(--ink-2)', 'stroke-width': 2 }),
    s('path', { d: `M${cx - 32} ${cy + 8} a 34 34 0 0 0 64 0 z`, fill: 'var(--v-wash)', stroke: 'var(--v)', 'stroke-width': 1.6 }),
    leader(cx, cy + 38, cx, 268),
    tag(cx, 282, 'soma — the bucket', 'var(--ink-2)', 'middle', 9.5),

    // axon and the spike
    s('path', { d: `M${cx + 34} ${cy} L 700 ${cy}`, stroke: 'var(--ink-2)', 'stroke-width': 2.4, fill: 'none' }),
    s('path', { d: `M598 ${cy} l 5 -32 l 5 32`, stroke: 'var(--spike)', 'stroke-width': 2.6, fill: 'none', 'stroke-linejoin': 'round' }),
    tag(700, cy + 26, 'the spike', 'var(--spike)', 'end', 9.5),
    tag(700, cy + 40, 'always the same size', 'var(--ink-3)', 'end', 9),
    tag(572, cy - 10, 'axon', 'var(--ink-3)', 'start', 9)
  );

  return fig.root;
}

/* ---------------------------------------------------------------
   FIGURE 4 — the leak decides
   Knob: the time constant τ. The input never changes.
   Lesson: a neuron only adds up inputs that arrive faster than it forgets.
   --------------------------------------------------------------- */
export function leak() {
  const fig = figure({
    n: 4,
    title: 'How fast the bucket forgets',
    tag: 'interactive',
    block: 'CH1 · Vm · mV',
    sweep: '400 ms sweep',
    aria: 'Membrane voltage over 400 milliseconds under a fixed 150 hertz train of 6 millivolt inputs, with an adjustable membrane time constant.',
    caption: 'The input train below the trace is <b>identical in every position of the slider</b> — same size, same rate. Only the size of the hole changes. Slide below about 19&nbsp;ms and the neuron falls silent while its input carries on exactly as before — and note where the default sits: <b>20&nbsp;ms is right on the knife edge</b>, firing, but only just.',
  });

  const svg = fig.svg('0 0 720 250');
  const sc = scope(svg, {
    w: 720, h: 250, pad: { l: 52, r: 18, t: 14, b: 46 },
    x: { min: 0, max: 0.4, step: 0.05, decimals: 2, title: 'TIME (s)' },
    y: { min: -6, max: 28, ticks: [0, 10, 20], title: 'Vm (mV)' },
  });
  sc.hline(CAST.vTh, { color: 'var(--spike)', label: 'threshold 20 mV' });
  sc.hline(0, { color: 'var(--ink-3)', dash: '2 4' });

  const vPath = sc.path({ color: 'var(--v)', width: 1.9 });
  const outRaster = sc.raster(26, { color: 'var(--spike)', height: 12 });
  const inRaster = sc.raster(-4, { color: 'var(--exc)', height: 10, width: 1.5 });
  sc.text(0.004, -4, 'input', { color: 'var(--exc)', size: 9.5, dy: -9 });

  const roTau  = readout('Time constant', '—', 'v');
  const roPeak = readout('Highest level reached', '—', 'v');
  const roRate = readout('Output', '—', 'spike');
  const roVerdict = readout('Verdict', '—');
  fig.readouts(roTau.el, roPeak.el, roRate.el, roVerdict.el);

  const W_SYN = 6;        // mV per input spike
  const IN_HZ = 150;      // fixed input rate
  const DT = 0.0002, T_END = 0.4;

  function run(tauMs) {
    const n = new LIF({ tauM: tauMs / 1000 });
    const xs = [], ys = [], outs = [], ins = [];
    let acc = 0, peak = 0;
    for (let i = 0; i * DT < T_END; i++) {
      const t = i * DT;
      acc += DT * IN_HZ;
      let inject = 0;
      if (acc >= 1) { acc -= 1; inject = W_SYN; ins.push(t); }
      const fired = n.step(DT, 0, inject);
      if (fired) outs.push(t);
      peak = Math.max(peak, fired ? CAST.vTh : n.v);
      if (i % 2 === 0) { xs.push(t); ys.push(fired ? CAST.vTh + 4 : n.v); }
    }
    vPath.set(xs, ys);
    outRaster.set(outs);
    inRaster.set(ins);

    roTau.set(`${fmt(tauMs, 0)} ms`);
    roPeak.set(`${fmt(Math.min(peak, CAST.vTh), 1)} mV`);
    const rate = outs.length / T_END;
    roRate.set(outs.length ? `${fmt(rate, 0)} Hz` : '0 Hz');
    roVerdict.set(outs.length ? 'fires' : 'silent — forgets too fast');
    roVerdict.el.querySelector('.ro__v').setAttribute('data-q', outs.length ? 'exc' : 'spike');
  }

  const k = knob({
    id: 'leak-tau', label: 'Size of the hole',
    min: 4, max: 60, step: 1, value: 20,
    format: (v) => `${fmt(v, 0)} ms`,
    oninput: run,
  });
  fig.controls(k.el);
  run(20);
  return fig.root;
}

/* ---------------------------------------------------------------
   FIGURE 5 — the f–I curve
   Knob: input current. Two linked panels: the trace, and the point
   it occupies on the curve.
   Lesson: below rheobase, silence forever. Above it, diminishing returns.
   --------------------------------------------------------------- */
export function fiCurve() {
  const fig = figure({
    n: 5,
    title: 'From current to firing rate',
    tag: 'interactive',
    block: 'CH1 · Vm · mV   +   f–I curve',
    sweep: '200 ms sweep',
    aria: 'Left: membrane voltage over 200 milliseconds for a constant injected current. Right: the resulting firing rate plotted against current, with a moving marker.',
    caption: 'The dead zone on the right-hand curve is the <b>rheobase</b>: at 0.19&nbsp;nA this neuron never fires, not in a second, not in a year. Past it, doubling the current does not double the rate — the curve bends, because every spike costs a fixed 2&nbsp;ms of refractory time you cannot buy back.',
  });

  const svg = fig.svg('0 0 720 250');
  const left = s('svg', { x: 0, y: 0, width: 424, height: 250 });
  const right = s('svg', { x: 436, y: 0, width: 284, height: 250 });
  svg.append(left, right);

  const trace = scope(left, {
    w: 424, h: 250, pad: { l: 46, r: 12, t: 14, b: 40 },
    x: { min: 0, max: 0.2, step: 0.05, decimals: 2, title: 'TIME (s)' },
    y: { min: -2, max: 30, ticks: [0, 10, 20], title: 'Vm (mV)' },
  });
  trace.hline(CAST.vTh, { color: 'var(--spike)', label: 'threshold' });
  const vPath = trace.path({ color: 'var(--v)', width: 1.9 });
  const vInf = trace.hline(0, { color: 'var(--ink-3)', dash: '3 5', label: 'where it is heading' });

  const curve = scope(right, {
    w: 284, h: 250, pad: { l: 44, r: 14, t: 14, b: 40 },
    x: { min: 0, max: 1, step: 0.25, decimals: 2, title: 'CURRENT (nA)' },
    y: { min: 0, max: 170, step: 50, title: 'RATE (Hz)' },
  });
  const cxs = [], cys = [];
  for (let i = 0; i <= 200; i++) {
    const I = i / 200;
    cxs.push(I); cys.push(rateFromCurrent(I));
  }
  curve.path({ color: 'var(--ink-3)', width: 1.6 }).set(cxs, cys);
  curve.vline(rheobase(), { color: 'var(--spike)', dash: '4 4' });
  curve.text(rheobase() + 0.03, 150, 'rheobase', { color: 'var(--spike)', size: 9.5 });
  curve.text(rheobase() + 0.03, 136, '0.20 nA', { color: 'var(--ink-3)', size: 9.5 });
  const marker = curve.dot(0.4, rateFromCurrent(0.4), { color: 'var(--v)', r: 5 });

  const roI    = readout('Injected current', '—', 'exc');
  const roVinf = readout('Heading toward', '—', 'v');
  const roRate = readout('Firing rate', '—', 'spike');
  fig.readouts(roI.el, roVinf.el, roRate.el);

  const DT = 0.0002, T_END = 0.2;
  function run(I) {
    const n = new LIF();
    const xs = [], ys = [];
    for (let i = 0; i * DT < T_END; i++) {
      const fired = n.step(DT, I);
      if (i % 2 === 0) { xs.push(i * DT); ys.push(fired ? CAST.vTh + 6 : n.v); }
    }
    vPath.set(xs, ys);
    const target = CAST.R * I;
    // the "heading toward" rule only earns its place while it is on screen,
    // which is exactly the sub-threshold case it is there to explain
    vInf.show(target <= 28);
    if (target <= 28) vInf.move(target, `heading toward ${fmt(target, 0)} mV`);
    const r = rateFromCurrent(I);
    marker.move(I, r);
    roI.set(`${fmt(I, 2)} nA`);
    roVinf.set(`${fmt(target, 0)} mV`);
    roRate.set(r > 0 ? `${fmt(r, 0)} Hz` : 'silent');
    roRate.el.querySelector('.ro__v').setAttribute('data-q', r > 0 ? 'spike' : 'v');
  }

  const k = knob({
    id: 'fi-current', label: 'Injected current',
    min: 0, max: 1, step: 0.01, value: 0.4,
    format: (v) => `${fmt(v, 2)} nA`,
    oninput: run,
  });
  fig.controls(k.el);
  run(0.4);
  return fig.root;
}
