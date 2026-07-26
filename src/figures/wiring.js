/* Part 4 figures: synapses, gain, and the first real decision. */

import { figure, knob, readout, fmt, rng, s } from '../lib/dom.js';
import { scope } from '../lib/plot.js';
import { createLoop } from '../lib/anim.js';
import { LIF, CAST, Network } from '../lib/neuron.js';

/* ---------------------------------------------------------------
   FIGURE 8 — the weight is the width of the pipe
   Reference. Analogy on the left, the measurement it predicts on the right.
   --------------------------------------------------------------- */
export function synapse() {
  const fig = figure({
    n: 8,
    title: 'What a weight actually is',
    tag: 'reference',
    block: 'Synaptic weight · mV per spike',
    aria: 'Left: three pipes of different widths feeding a bucket, plus one drain. Right: the voltage bump each one produces, three excitatory bumps of 3, 6 and 12 millivolts and one inhibitory dip.',
    caption: 'A spike is always the same size, so the only thing a connection can do is decide <b>how much of it counts</b>. Real synapses take a millisecond or two to open and close, which rounds off the sharp corner — the instantaneous jump drawn here is the standard simplification, and it changes none of the arguments that follow.',
  });

  const svg = fig.svg('0 0 720 236');
  const left = s('svg', { x: 0, y: 0, width: 300, height: 236 });
  const right = s('svg', { x: 306, y: 0, width: 414, height: 236 });
  svg.append(left, right);

  /* --- pipes into a bucket --- */
  const t = (x, y, str, color = 'var(--ink-2)', anchor = 'start', size = 10) =>
    s('text', { x, y, fill: color, 'text-anchor': anchor, 'font-family': 'var(--font-mono)', 'font-size': size, text: str });

  const pipes = [
    { y: 52, w: 3, label: 'w = 3 mV' },
    { y: 92, w: 7, label: 'w = 6 mV' },
    { y: 132, w: 13, label: 'w = 12 mV' },
  ];
  for (const p of pipes) {
    left.append(
      s('rect', { x: 22, y: p.y - p.w / 2, width: 148, height: p.w, fill: 'var(--exc)', rx: 1 }),
      t(22, p.y - p.w / 2 - 6, p.label, 'var(--exc)', 'start', 9.5)
    );
  }
  left.append(
    s('rect', { x: 22, y: 178 - 3.5, width: 148, height: 7, fill: 'var(--inh)', rx: 1 }),
    t(22, 178 - 12, 'w = −6 mV  (a drain)', 'var(--inh)', 'start', 9.5),
    // the bucket
    s('path', { d: 'M186 38 L194 208 L262 208 L270 38', fill: 'var(--paper-3)', stroke: 'var(--ink-2)', 'stroke-width': 2, 'stroke-linejoin': 'round' }),
    s('path', { d: 'M198 148 L194 208 L262 208 L258 148 Z', fill: 'var(--v-wash)', stroke: 'var(--v)', 'stroke-width': 1.6 }),
    t(228, 228, 'one neuron', 'var(--ink-3)', 'middle', 9.5),
    t(22, 24, 'WIDER PIPE = BIGGER WEIGHT', 'var(--ink-3)', 'start', 9.5)
  );

  /* --- the bumps those pipes make --- */
  const sc = scope(right, {
    w: 414, h: 236, pad: { l: 44, r: 14, t: 22, b: 40 },
    x: { min: 0, max: 0.1, step: 0.02, decimals: 2, title: 'TIME (s)' },
    y: { min: -9, max: 22, ticks: [-6, 0, 6, 12, 20], title: 'Vm (mV)' },
  });
  sc.hline(CAST.vTh, { color: 'var(--spike)', label: 'threshold' });
  sc.hline(0, { color: 'var(--ink-3)', dash: '2 4' });

  const bump = (w, color) => {
    const xs = [], ys = [];
    for (let i = 0; i <= 300; i++) {
      const x = (i / 300) * 0.1;
      xs.push(x);
      ys.push(x < 0.012 ? 0 : w * Math.exp(-(x - 0.012) / CAST.tauM));
    }
    sc.path({ color, width: 1.9 }).set(xs, ys);
  };
  bump(12, 'var(--exc)');
  bump(6, 'var(--exc)');
  bump(3, 'var(--exc)');
  bump(-6, 'var(--inh)');
  sc.vline(0.012, { color: 'var(--spike)', width: 1.6, y0: -9, y1: 22 });
  sc.text(0.0135, 20, 'a spike arrives', { color: 'var(--spike)', size: 9.5 });
  sc.text(0.099, 12, 'EPSP', { color: 'var(--exc)', size: 9.5, anchor: 'end', dy: -4 });
  sc.text(0.099, -6, 'IPSP', { color: 'var(--inh)', size: 9.5, anchor: 'end', dy: 12 });

  return fig.root;
}

/* ---------------------------------------------------------------
   FIGURE 9 — the transmission cliff
   Knob: the weight of a single connection between two neurons.
   Lesson: a synapse is not a volume dial. Below a critical weight the
   message does not get through at all.
   --------------------------------------------------------------- */
export function chain() {
  const fig = figure({
    n: 9,
    title: 'Turning up one connection',
    tag: 'interactive',
    block: 'CH1 · Vm of the receiving neuron · mV',
    sweep: '200 ms sweep',
    aria: 'Left: the receiving neuron’s voltage under a 100 hertz input train with adjustable synaptic weight. Right: output rate plotted against weight, showing a hard cutoff near 7.9 millivolts.',
    caption: 'The sending neuron fires at a steady 100&nbsp;Hz throughout. <b>Below 7.9&nbsp;mV the receiving neuron never fires at all</b> — the arriving bumps leak away faster than they pile up. Above it, output rate climbs steeply, then saturates as the refractory period starts to bite.',
  });

  const svg = fig.svg('0 0 720 250');
  const left = s('svg', { x: 0, y: 0, width: 424, height: 250 });
  const right = s('svg', { x: 436, y: 0, width: 284, height: 250 });
  svg.append(left, right);

  const trace = scope(left, {
    w: 424, h: 250, pad: { l: 46, r: 12, t: 14, b: 44 },
    x: { min: 0, max: 0.2, step: 0.05, decimals: 2, title: 'TIME (s)' },
    y: { min: -7, max: 30, ticks: [0, 10, 20], title: 'Vm (mV)' },
  });
  trace.hline(CAST.vTh, { color: 'var(--spike)', label: 'threshold' });
  trace.hline(0, { color: 'var(--ink-3)', dash: '2 4' });
  const vPath = trace.path({ color: 'var(--v)', width: 1.8 });
  const inRaster = trace.raster(-5, { color: 'var(--exc)', height: 9, width: 1.4 });
  const outRaster = trace.raster(28, { color: 'var(--spike)', height: 11 });
  trace.text(0.001, -5, 'in', { color: 'var(--exc)', size: 9, dy: -8 });
  trace.text(0.001, 28, 'out', { color: 'var(--spike)', size: 9, dy: -8 });

  const curve = scope(right, {
    w: 284, h: 250, pad: { l: 44, r: 14, t: 14, b: 44 },
    x: { min: 0, max: 14, step: 3.5, decimals: 1, title: 'WEIGHT (mV)' },
    y: { min: 0, max: 110, step: 25, title: 'OUT (Hz)' },
  });

  const IN_HZ = 100, DT = 0.0002, T_END = 0.2;

  function simulate(w, tEnd = T_END, collect = false) {
    const n = new LIF();
    const xs = [], ys = [], ins = [], outs = [];
    let acc = 0;
    for (let i = 0; i * DT < tEnd; i++) {
      const t = i * DT;
      acc += DT * IN_HZ;
      let inject = 0;
      if (acc >= 1) { acc -= 1; inject = w; if (collect) ins.push(t); }
      const fired = n.step(DT, 0, inject);
      if (fired) outs.push(t);
      if (collect && i % 2 === 0) { xs.push(t); ys.push(fired ? CAST.vTh + 6 : n.v); }
    }
    return { xs, ys, ins, outs };
  }

  // the curve is a sweep of the same simulation — no separate formula to drift
  const cxs = [], cys = [];
  for (let i = 0; i <= 70; i++) {
    const w = (i / 70) * 14;
    cxs.push(w);
    cys.push(simulate(w, 0.5).outs.length / 0.5);
  }
  curve.path({ color: 'var(--ink-3)', width: 1.6 }).set(cxs, cys);
  curve.vline(7.87, { color: 'var(--spike)', dash: '4 4' });
  curve.text(8.4, 96, 'cliff', { color: 'var(--spike)', size: 9.5 });
  curve.text(8.4, 84, '7.9 mV', { color: 'var(--ink-3)', size: 9.5 });
  const marker = curve.dot(9, 0, { color: 'var(--v)', r: 5 });

  const roW    = readout('Weight', '—', 'exc');
  const roIn   = readout('Input rate', '100 Hz', 'exc');
  const roOut  = readout('Output rate', '—', 'spike');
  const roGain = readout('Spikes in per spike out', '—', 'v');
  fig.readouts(roW.el, roIn.el, roOut.el, roGain.el);

  function run(w) {
    const r = simulate(w, T_END, true);
    vPath.set(r.xs, r.ys);
    inRaster.set(r.ins);
    outRaster.set(r.outs);
    const rate = r.outs.length / T_END;
    marker.move(w, rate);
    roW.set(`${fmt(w, 1)} mV`);
    roOut.set(rate > 0 ? `${fmt(rate, 0)} Hz` : 'silent');
    roGain.set(rate > 0 ? `${fmt(IN_HZ / rate, 1)} : 1` : 'nothing gets through');
    roOut.el.querySelector('.ro__v').setAttribute('data-q', rate > 0 ? 'spike' : 'v');
  }

  const k = knob({
    id: 'chain-w', label: 'Synaptic weight',
    min: 0, max: 14, step: 0.1, value: 9,
    format: (v) => `${fmt(v, 1)} mV`,
    oninput: run,
  });
  fig.controls(k.el);
  run(9);
  return fig.root;
}

/* ---------------------------------------------------------------
   FIGURE 10 — winner take all
   Knob: how hard the three neurons inhibit each other. Live.
   Lesson: inhibition converts a graded comparison into a decision.
   --------------------------------------------------------------- */
export function winnerTakeAll() {
  const fig = figure({
    n: 10,
    title: 'Three neurons arguing',
    tag: 'interactive',
    block: 'CH1–3 · raster · rolling 600 ms',
    sweep: 'live · 0.4× real time',
    aria: 'Three neurons receiving slightly different input currents. Each excites itself and inhibits the other two. A slider sets the strength of that mutual inhibition and a live raster shows which neurons are still firing.',
    caption: 'The three inputs differ by ±4&nbsp;% and never change. At zero inhibition the outputs differ by about the same margin — roughly 40, 34 and 29&nbsp;Hz. Push the slider to the right and watch the gap open: <b>at full inhibition it is around 38&nbsp;Hz against two or three</b>. Each neuron also excites itself, drawn in teal; that is the positive feedback that lets a small lead run away, and without it the three simply throttle each other equally. A small background jitter, identical for all three, keeps them from locking into step.',
  });

  const svg = fig.svg('0 0 720 250');
  const schematic = s('svg', { x: 0, y: 0, width: 172, height: 250 });
  const rasterSvg = s('svg', { x: 176, y: 0, width: 544, height: 250 });
  svg.append(schematic, rasterSvg);

  const CURRENTS = [0.24, 0.23, 0.22];
  const SELF_W = 8;          // self-excitation: the positive feedback
  const NOISE_HZ = 60, NOISE_W = 1.2;   // identical jitter on all three
  const NAMES = ['A', 'B', 'C'];
  const POS = [[86, 62], [46, 156], [126, 156]];

  // schematic: three cells, mutual inhibition drawn in the inhibition colour
  const arcs = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (i === j) continue;
      const [x1, y1] = POS[i], [x2, y2] = POS[j];
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      const a = arcs.length;
      const line = s('line', {
        x1: x1 + ux * 22 + uy * 4, y1: y1 + uy * 22 - ux * 4,
        x2: x2 - ux * 24 + uy * 4, y2: y2 - uy * 24 - ux * 4,
        stroke: 'var(--inh)', 'stroke-width': 1.6, opacity: 0.5,
      });
      schematic.appendChild(line);
      arcs[a] = line;
    }
  }
  // self-excitation loops, in the excitation colour
  for (const [x, y] of POS) {
    schematic.appendChild(s('path', {
      d: `M${x - 9} ${y - 18.5} a 14 14 0 1 1 18 0`,
      stroke: 'var(--exc)', 'stroke-width': 2, fill: 'none',
    }));
  }
  const cells = POS.map(([x, y], i) => {
    const c = s('circle', { cx: x, cy: y, r: 20, fill: 'var(--paper-3)', stroke: 'var(--ink-2)', 'stroke-width': 1.8 });
    const label = s('text', {
      x, y: y + 4.5, 'text-anchor': 'middle', fill: 'var(--ink)',
      'font-family': 'var(--font-mono)', 'font-size': 13, 'font-weight': 600, text: NAMES[i],
    });
    const sub = s('text', {
      x, y: i === 0 ? y - 40 : y + 34, 'text-anchor': 'middle', fill: 'var(--ink-3)',
      'font-family': 'var(--font-mono)', 'font-size': 9, text: `${CURRENTS[i].toFixed(2)} nA`,
    });
    schematic.append(c, label, sub);
    return c;
  });
  schematic.append(
    s('text', {
      x: 86, y: 220, 'text-anchor': 'middle', fill: 'var(--inh)',
      'font-family': 'var(--font-mono)', 'font-size': 9.5, text: 'each inhibits the others',
    }),
    s('text', {
      x: 86, y: 234, 'text-anchor': 'middle', fill: 'var(--exc)',
      'font-family': 'var(--font-mono)', 'font-size': 9.5, text: 'and excites itself',
    })
  );

  const WIN = 0.6;
  const sc = scope(rasterSvg, {
    w: 544, h: 250, pad: { l: 34, r: 16, t: 18, b: 44 },
    x: { min: 0, max: WIN, step: 0.15, decimals: 2, title: 'ROLLING WINDOW (s)' },
    y: { min: 0, max: 3, ticks: [], title: '' },
  });
  const rows = [2.4, 1.5, 0.6].map((y, i) => {
    sc.text(-0.012, y, NAMES[i], { color: 'var(--ink-2)', size: 11, anchor: 'end', dy: 4 });
    return sc.raster(y, { color: 'var(--spike)', height: 22, width: 2 });
  });

  const roG = readout('Inhibition strength', '—', 'inh');
  const roA = readout('A', '—', 'spike');
  const roB = readout('B', '—', 'spike');
  const roC = readout('C', '—', 'spike');
  fig.readouts(roG.el, roA.el, roB.el, roC.el);

  const net = new Network({ n: 3 });
  let g = 0;
  const edges = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (i === j) net.connect(i, j, SELF_W, 0.002);
      else edges.push(net.connect(i, j, 0, 0.002));
    }
  }
  const counts = [0, 0, 0];
  let countWindow = 0;
  const rates = [0, 0, 0];
  const noise = rng(5);

  const loop = createLoop(fig.root, (dt) => {
    for (let i = 0; i < 3; i++) if (noise() < NOISE_HZ * dt) net.inject(i, NOISE_W);
    const fired = net.step(dt, CURRENTS);
    for (const i of fired) counts[i]++;
    countWindow += dt;
    if (countWindow >= 0.5) {
      for (let i = 0; i < 3; i++) { rates[i] = counts[i] / countWindow; counts[i] = 0; }
      countWindow = 0;
      roA.set(`${fmt(rates[0], 0)} Hz`);
      roB.set(`${fmt(rates[1], 0)} Hz`);
      roC.set(`${fmt(rates[2], 0)} Hz`);
      cells.forEach((c, i) => {
        c.setAttribute('fill', rates[i] > 1 ? 'var(--spike-wash)' : 'var(--paper-3)');
        c.setAttribute('stroke', rates[i] > 1 ? 'var(--spike)' : 'var(--ink-3)');
      });
    }
    net.trimSpikes(WIN);
    const t0 = Math.max(0, net.t - WIN);
    for (let i = 0; i < 3; i++) {
      rows[i].set(net.spikes.filter((sp) => sp.i === i).map((sp) => sp.t - t0));
    }
  }, { speed: 0.4, maxStep: 0.0005 });

  const k = knob({
    id: 'wta-g', label: 'Mutual inhibition',
    min: 0, max: 18, step: 0.5, value: 0,
    format: (v) => `${fmt(v, 1)} mV`,
    oninput: (v) => {
      g = v;
      for (const e of edges) { e.w = -g; e.kind = 'inh'; }
      arcs.forEach((a) => a.setAttribute('opacity', 0.25 + 0.75 * (g / 18)));
      roG.set(`${fmt(g, 1)} mV`);
    },
  });
  fig.controls(k.el, loop.button);
  roG.set('0.0 mV');
  return fig.root;
}
