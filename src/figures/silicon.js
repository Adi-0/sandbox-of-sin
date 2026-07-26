/* Part 6 figures: how the hardware avoids moving numbers around. */

import { figure, knob, readout, fmt, eng, s } from '../lib/dom.js';
import { scope } from '../lib/plot.js';
import { ENERGY_PJ } from '../lib/neuron.js';

const mono = (x, y, text, color = 'var(--ink-2)', anchor = 'start', size = 10) =>
  s('text', { x, y, fill: color, 'text-anchor': anchor, 'font-family': 'var(--font-mono)', 'font-size': size, text });

/* ---------------------------------------------------------------
   FIGURE 13 — the crossbar
   Reference. Where the multiply-accumulate goes when you refuse to
   move the weights.
   --------------------------------------------------------------- */
export function crossbar() {
  const fig = figure({
    n: 13,
    title: 'The array that multiplies by doing nothing',
    tag: 'reference',
    block: 'Crossbar · 4 inputs × 4 outputs',
    aria: 'A four by four crossbar array. Input voltages enter along the rows, each junction holds a programmable conductance, and the currents sum along each column wire.',
    caption: 'Sixteen weights, sixteen multiplications, one column-wire addition each — and not a single number fetched from memory, because the weights <b>are</b> the memory. The honest catch: these devices are analogue, so they drift, they vary from cell to cell, and 8 bits of usable precision is a good day.',
  });

  const svg = fig.svg('0 0 720 300');
  const x0 = 176, y0 = 68, dx = 82, dy = 46, n = 4;
  const G = [
    [0.9, 0.2, 0.5, 0.1],
    [0.3, 0.8, 0.2, 0.6],
    [0.15, 0.4, 0.95, 0.3],
    [0.7, 0.1, 0.35, 0.85],
  ];

  // wires
  for (let r = 0; r < n; r++) {
    svg.appendChild(s('line', {
      x1: x0 - 46, x2: x0 + (n - 1) * dx + 26, y1: y0 + r * dy, y2: y0 + r * dy,
      stroke: 'var(--ink-3)', 'stroke-width': 1.6,
    }));
  }
  for (let c = 0; c < n; c++) {
    svg.appendChild(s('line', {
      x1: x0 + c * dx, x2: x0 + c * dx, y1: y0 - 30, y2: y0 + (n - 1) * dy + 52,
      stroke: 'var(--ink-3)', 'stroke-width': 1.6,
    }));
  }
  // junctions — darkness of the cell is its stored weight
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      svg.append(
        s('rect', {
          x: x0 + c * dx - 9, y: y0 + r * dy - 6.5, width: 18, height: 13, rx: 1.5,
          fill: 'var(--exc)', opacity: 0.18 + 0.82 * G[r][c],
          stroke: 'var(--exc)', 'stroke-width': 1,
        })
      );
    }
  }

  // inputs
  for (let r = 0; r < n; r++) {
    const y = y0 + r * dy;
    svg.append(
      s('path', { d: `M${x0 - 74} ${y} l 5 -16 l 5 16`, stroke: 'var(--spike)', 'stroke-width': 2.2, fill: 'none', 'stroke-linejoin': 'round' }),
      mono(x0 - 86, y + 4, `V${r + 1}`, 'var(--spike)', 'end', 10.5)
    );
  }
  // outputs
  for (let c = 0; c < n; c++) {
    const x = x0 + c * dx;
    svg.append(
      s('path', { d: `M${x} ${y0 + (n - 1) * dy + 52} l 0 18`, stroke: 'var(--v)', 'stroke-width': 2.4 }),
      s('path', { d: `M${x - 5} ${y0 + (n - 1) * dy + 64} L${x} ${y0 + (n - 1) * dy + 74} L${x + 5} ${y0 + (n - 1) * dy + 64} Z`, fill: 'var(--v)' }),
      mono(x, y0 + (n - 1) * dy + 90, `I${c + 1}`, 'var(--v)', 'middle', 10.5)
    );
  }

  svg.append(
    mono(30, 30, 'INPUT SPIKES ARRIVE AS VOLTAGE PULSES', 'var(--ink-3)', 'start', 9.5),
    mono(x0 - 86, 30, 'rows', 'var(--spike)', 'end', 9.5),
    // annotations, placed against the thing they describe
    mono(x0 + 3 * dx + 44, y0 + 6, 'each cell stores one', 'var(--exc)', 'start', 9.5),
    mono(x0 + 3 * dx + 44, y0 + 20, 'weight as a conductance G', 'var(--ink-3)', 'start', 9.5),
    s('line', { x1: x0 + 3 * dx + 12, x2: x0 + 3 * dx + 40, y1: y0, y2: y0 + 2, stroke: 'var(--ink-3)', 'stroke-width': 1 }),

    mono(x0 + 3 * dx + 44, y0 + 2 * dy - 6, 'Ohm’s law does the', 'var(--ink-2)', 'start', 9.5),
    mono(x0 + 3 * dx + 44, y0 + 2 * dy + 8, 'multiply:  i = V × G', 'var(--exc)', 'start', 10),

    mono(x0 + 3 * dx + 44, y0 + 3 * dy + 34, 'Kirchhoff’s law does the', 'var(--ink-2)', 'start', 9.5),
    mono(x0 + 3 * dx + 44, y0 + 3 * dy + 48, 'sum: the column adds', 'var(--v)', 'start', 10),
    mono(x0 + 3 * dx + 44, y0 + 3 * dy + 62, 'every current on it', 'var(--v)', 'start', 10),

    mono(30, 250, 'The weights never move.', 'var(--ink)', 'start', 11),
    mono(30, 266, 'There is nowhere to move them to —', 'var(--ink-3)', 'start', 9.5),
    mono(30, 280, 'the memory is the arithmetic unit.', 'var(--ink-3)', 'start', 9.5)
  );

  return fig.root;
}

/* ---------------------------------------------------------------
   FIGURE 14 — you only pay for what happens
   Knob: the average firing rate of the network.
   Lesson: the saving is exactly the ratio of timestep rate to spike rate.
   --------------------------------------------------------------- */
export function sparsityPayoff() {
  const fig = figure({
    n: 14,
    title: 'The bill for a thousand neurons',
    tag: 'interactive',
    block: 'Synaptic evaluations per second · log scale',
    aria: 'Two bars comparing synaptic evaluations per second for a dense clocked accelerator against an event-driven neuromorphic chip, as the average firing rate of a 1000-neuron network is varied.',
    caption: 'A dense accelerator re-evaluates all 128,000 weights on every one of its 1,000 timesteps per second, whether or not anything happened. An event-driven chip touches a synapse only when a spike arrives at it. <b>The saving is nothing more exotic than the ratio of the two rates</b> — and it evaporates entirely if you push the firing rate up to the timestep rate, which is the trap every over-eager spiking network falls into.',
  });

  const NEURONS = 1000, FANOUT = 128, TIMESTEP_HZ = 1000;
  const DENSE_OPS = NEURONS * FANOUT * TIMESTEP_HZ;   // 1.28e8 per second
  const DENSE_PJ_PER_MAC = 1.0;                        // generous to the incumbent

  const svg = fig.svg('0 0 720 168');
  const L = 176, R = 96, W = 720;
  const IW = W - L - R;
  const lo = Math.log10(1e4), hi = Math.log10(3e8);
  const scale = (v) => Math.max(2, ((Math.log10(Math.max(v, 1e4)) - lo) / (hi - lo)) * IW);

  const mkRow = (yy, label, color) => {
    svg.append(
      mono(L - 12, yy + 15, label, 'var(--ink-2)', 'end', 10.5),
      s('rect', { x: L, y: yy, width: IW, height: 22, fill: 'var(--paper-3)', rx: 1 })
    );
    const bar = s('rect', { x: L, y: yy, width: 0, height: 22, fill: color, rx: 1 });
    const val = mono(L + 6, yy + 15, '', 'var(--ink-2)', 'start', 10.5);
    svg.append(bar, val);
    return { bar, val };
  };

  svg.appendChild(mono(30, 24, '1,000 NEURONS · 128 SYNAPSES EACH · 1 kHz TIMESTEP', 'var(--ink-3)', 'start', 9.5));
  const dense = mkRow(44, 'dense, clocked', 'var(--ink-2)');
  const sparse = mkRow(84, 'event-driven', 'var(--spike)');
  svg.appendChild(mono(L, 138, 'log scale — each division is 10×', 'var(--ink-3)', 'start', 9));

  dense.bar.setAttribute('width', scale(DENSE_OPS));
  dense.val.textContent = `${eng(DENSE_OPS, 1)}ops/s`;
  dense.val.setAttribute('x', L + 6);
  dense.val.setAttribute('fill', 'var(--paper)');

  const roRate = readout('Mean firing rate', '—', 'spike');
  const roOps  = readout('Event-driven ops/s', '—', 'spike');
  const roWin  = readout('Fewer synapse touches', '—', 'exc');
  const roPow  = readout('Power at 23.6 pJ per touch', '—', 'v');
  fig.readouts(roRate.el, roOps.el, roWin.el, roPow.el);

  function update(sliderVal) {
    const rate = Math.pow(10, sliderVal / 40 - 1);     // 0.1 Hz … 1000 Hz
    const ops = NEURONS * rate * FANOUT;
    const wsc = scale(ops);
    sparse.bar.setAttribute('width', wsc);
    sparse.val.textContent = `${eng(ops, 1)}ops/s`;
    const inside = wsc > 120;
    sparse.val.setAttribute('x', inside ? L + 6 : L + wsc + 6);
    sparse.val.setAttribute('fill', inside ? 'var(--paper)' : 'var(--ink-2)');

    const ratio = DENSE_OPS / ops;
    roRate.set(`${fmt(rate, rate < 10 ? 1 : 0)} Hz`);
    roOps.set(`${eng(ops, 1)}ops/s`);
    roWin.set(ratio >= 1 ? `${fmt(ratio, ratio > 20 ? 0 : 1)} ×` : `${fmt(1 / ratio, 1)} × more`);
    roWin.el.querySelector('.ro__v').setAttribute('data-q', ratio >= 1 ? 'exc' : 'spike');
    const mW = (ops * ENERGY_PJ.loihiSynOp) / 1e9;
    roPow.set(mW < 1 ? `${fmt(mW * 1000, 0)} µW` : `${fmt(mW, 2)} mW`);
    void DENSE_PJ_PER_MAC;
  }

  const k = knob({
    id: 'sparse-rate', label: 'Average firing rate',
    min: 0, max: 160, step: 1, value: 68,
    format: (v) => {
      const r = Math.pow(10, v / 40 - 1);
      return `${fmt(r, r < 10 ? 1 : 0)} Hz`;
    },
    oninput: update,
  });
  fig.controls(k.el);
  update(68);
  return fig.root;
}

/* ---------------------------------------------------------------
   FIGURE 15 — frames against events
   Knob: how fast the edge moves.
   Lesson: a frame samples all of space at a few moments; an event
   sensor samples all of time at a few places.
   --------------------------------------------------------------- */
export function framesVsEvents() {
  const fig = figure({
    n: 15,
    title: 'A bright edge crossing a sensor',
    tag: 'interactive',
    block: 'Space–time diagram · 64 pixels × 200 ms',
    aria: 'A space-time diagram of a bright edge sweeping across a 64 pixel sensor. Grey dots show the samples a 30 frames-per-second camera takes; magenta dots show the events an event camera emits, which fall only along the edge.',
    caption: 'Every grey dot is a number a frame camera transmits whether or not anything changed; every magenta dot is an event, and there are only ever 64 of them per sweep no matter how fast the edge moves. <b>Push the speed past about 1,900&nbsp;px/s and the edge crosses the whole sensor between two frames</b> — the frame camera simply never sees it, while the event stream is unbothered.',
  });

  const svg = fig.svg('0 0 720 300');
  const sc = scope(svg, {
    w: 720, h: 300, pad: { l: 56, r: 122, t: 18, b: 44 },
    x: { min: 0, max: 64, step: 16, decimals: 0, title: 'PIXEL' },
    y: { min: 0.2, max: 0, ticks: [0, 0.05, 0.1, 0.15, 0.2], decimals: 2, title: 'TIME (s)' },
  });

  const frameLayer = s('g');
  const eventLayer = s('g');
  sc.layer.append(frameLayer, eventLayer);

  // frame grid: 30 fps, every pixel, every frame, forever.
  // Drawn as loose discrete dots, never joined into a line — the whole
  // point is that each one is a separate number leaving the sensor.
  const FPS = 30;
  for (let f = 0; f * (1 / FPS) <= 0.2; f++) {
    const t = f / FPS;
    for (let p = 0; p < 64; p += 1) {
      frameLayer.appendChild(s('circle', {
        cx: sc.X(p + 0.5), cy: sc.Y(t), r: 1.7, fill: 'var(--ink-3)', opacity: 0.6,
      }));
    }
  }
  sc.text(65, 1 / FPS, 'each row of grey dots', { color: 'var(--ink-3)', size: 9, dy: -4 });
  sc.text(65, 1 / FPS, 'is one frame —', { color: 'var(--ink-3)', size: 9, dy: 8 });
  sc.text(65, 1 / FPS, '64 numbers sent,', { color: 'var(--ink-3)', size: 9, dy: 20 });
  sc.text(65, 1 / FPS, 'moving or not', { color: 'var(--ink-3)', size: 9, dy: 32 });
  sc.text(65, 0.13, 'magenta dots are', { color: 'var(--spike)', size: 9, dy: -4 });
  sc.text(65, 0.13, 'events — only', { color: 'var(--spike)', size: 9, dy: 8 });
  sc.text(65, 0.13, 'where light changed', { color: 'var(--spike)', size: 9, dy: 20 });

  const roRateF = readout('Frame camera', '—');
  const roRateE = readout('Event camera', '—', 'spike');
  const roLat   = readout('Worst-case lag', '—', 'v');
  const roBlur  = readout('Pixels skipped per frame', '—', 'exc');
  fig.readouts(roRateF.el, roRateE.el, roLat.el, roBlur.el);

  function update(speed) {
    // the edge: pixel = speed * t, wrapping across the sensor
    const xs = [], ys = [];
    for (let i = 0; i <= 400; i++) {
      const t = (i / 400) * 0.2;
      xs.push((speed * t) % 64);
      ys.push(t);
    }
    // break the path at wraps so it does not draw a false horizontal line
    let segX = [], segY = [];
    const segs = [];
    for (let i = 0; i < xs.length; i++) {
      if (i > 0 && xs[i] < xs[i - 1]) { segs.push([segX, segY]); segX = []; segY = []; }
      segX.push(xs[i]); segY.push(ys[i]);
    }
    segs.push([segX, segY]);
    while (eventLayer.firstChild) eventLayer.removeChild(eventLayer.firstChild);
    for (const [sx, sy] of segs) {
      const d = sx.map((v, i) => `${i ? 'L' : 'M'}${fmt(sc.X(v), 2)} ${fmt(sc.Y(sy[i]), 2)}`).join(' ');
      eventLayer.appendChild(s('path', { d, stroke: 'var(--v)', 'stroke-width': 1.6, fill: 'none', opacity: 0.55 }));
    }
    // events: one per pixel per crossing, exactly when the edge reaches it
    let events = 0;
    for (let p = 0; p < 64; p++) {
      for (let k = 0; ; k++) {
        const t = (p + 0.5 + k * 64) / speed;
        if (t > 0.2) break;
        eventLayer.appendChild(s('circle', { cx: sc.X(p + 0.5), cy: sc.Y(t), r: 2.6, fill: 'var(--spike)' }));
        events++;
      }
    }

    const frameRate = 64 * FPS;
    const eventRate = events / 0.2;
    roRateF.set(`${eng(frameRate, 1)}values/s`);
    roRateE.set(`${eng(eventRate, 1)}events/s`);
    roLat.set(`frames ${fmt(1000 / FPS, 1)} ms · events ~0.01 ms`);
    const skipped = speed / FPS;
    roBlur.set(skipped < 64 ? `${fmt(skipped, 1)} px` : `${fmt(skipped, 0)} px — edge missed entirely`);
    roBlur.el.querySelector('.ro__v').setAttribute('data-q', skipped < 64 ? 'exc' : 'spike');
  }

  const k = knob({
    id: 'events-speed', label: 'Edge speed',
    min: 60, max: 4000, step: 20, value: 640,
    format: (v) => `${fmt(v, 0)} px/s`,
    oninput: update,
  });
  fig.controls(k.el);
  update(640);
  return fig.root;
}
