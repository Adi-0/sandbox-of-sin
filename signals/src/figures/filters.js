/* Part 8 — Rooms Built on Purpose. Figures 24-25. */

import { figure, knob, scenarios, readout, fmt, s } from '../lib/dom.js';
import { scope, note, poleGlyph, zeroGlyph } from '../lib/plot.js';
import { listen, EAR, render } from '../lib/audio.js';
import * as L from '../lib/lti.js';

const WC = 1000;                                  // the recurring corner, rad/s

/* ------------------------------------------------------------------
   Figure 24 — four filters, one set of parts.
   ------------------------------------------------------------------ */

const KINDS = {
  low:   { label: 'Lowpass',  make: () => L.butterworth(2, WC),  blurb: 'keeps the slow, drops the fast' },
  high:  { label: 'Highpass', make: () => L.highpass(2, WC),     blurb: 'drops the slow, keeps the fast' },
  band:  { label: 'Bandpass', make: () => L.bandpass(WC, 4),     blurb: 'keeps one narrow neighbourhood' },
  notch: { label: 'Notch',    make: () => L.notch(WC, 4),        blurb: 'removes one frequency, keeps the rest' },
};

export function fourFiltersFig() {
  const fig = figure({
    n: 24, title: 'Four filters, one set of parts', tag: 'interactive', domains: ['w', 's'],
    aria: 'Left: the gain of the selected filter against frequency, on logarithmic axes. Right: the pole and zero positions on the s-plane that produce it.',
    caption: 'The poles barely move between these four. What moves is the <b>zeros</b> — the crosses stay near 1000 rad/s while the circles are placed at the origin, at infinity, or straight onto the axis. A zero on the axis is a frequency multiplied by exactly nothing, which is what a notch is. <b>Designing a filter is deciding where a few crosses and circles go.</b>',
  });

  const row = fig.row();
  const svgA = fig.svg('0 0 400 280', 'The gain of the selected filter plotted against frequency.', row);
  const svgB = fig.svg('0 0 300 280', 'The pole and zero positions of the selected filter on the s-plane.', row);

  const scA = scope(svgA, {
    w: 400, h: 280, pad: { l: 50, r: 16, t: 30, b: 40 },
    x: { min: 10, max: 100000, log: true, title: 'ω (rad/s)' },
    y: { min: -60, max: 12, step: 20, title: 'gain (dB)', decimals: 0 },
  });
  svgA.appendChild(note(50, 16, 'WHAT GETS THROUGH', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  scA.vline(WC, { color: 'var(--ink-3)', dash: '2 4', label: 'ω = 1000' });
  const magPath = scA.path({ color: 'var(--sys)', width: 2.5 });

  const scB = scope(svgB, {
    w: 300, h: 280, pad: { l: 46, r: 18, t: 30, b: 40 },
    x: { min: -1700, max: 900, step: 800, title: 'σ', decimals: 0 },
    y: { min: -1700, max: 1700, step: 850, title: 'jω', decimals: 0 },
  });
  svgB.appendChild(note(46, 16, 'WHERE ITS POINTS ARE', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  scB.crosshair();
  scB.band(0, 900, { color: 'var(--out-wash)' });
  scB.text(-1650, 1480, '× pole    ○ zero', { color: 'var(--ink-3)', size: 9.5 });
  const pzLayer = s('g');
  scB.layer.appendChild(pzLayer);

  const roKind = readout('filter', '—', 'sys');
  const roDC = readout('at DC', '—', 'sys');
  const roAt = readout('at 1000 rad/s', '—', 'sys');
  const roHi = readout('at 100 krad/s', '—', 'sys');

  let current = 'low';
  const ws = Array.from(L.logspace(10, 100000, 500));

  function draw() {
    const kind = KINDS[current];
    const sys = kind.make();
    magPath.set(ws, ws.map((w) => L.dB(L.cabs(L.freqResp(sys, w)))));

    while (pzLayer.firstChild) pzLayer.removeChild(pzLayer.firstChild);
    for (const p of sys.poles) {
      const q = typeof p === 'number' ? { re: p, im: 0 } : p;
      pzLayer.appendChild(poleGlyph(scB.X(q.re), scB.Y(q.im), { color: 'var(--sys)', r: 7 }));
    }
    for (const z of sys.zeros) {
      const q = typeof z === 'number' ? { re: z, im: 0 } : z;
      pzLayer.appendChild(zeroGlyph(scB.X(q.re), scB.Y(q.im), { color: 'var(--sys)', r: 6 }));
    }

    const g = (w) => {
      const m = L.cabs(L.freqResp(sys, w));
      return m < 1e-4 ? '−∞ dB (nothing)' : `${fmt(L.dB(m), 1)} dB`;
    };
    roKind.set(`${kind.label} — ${kind.blurb}`, 'sys');
    roDC.set(g(0.001), 'sys');
    roAt.set(g(WC), 'sys');
    roHi.set(g(100000), 'sys');
  }

  const pick = scenarios({
    label: 'filter type',
    options: Object.entries(KINDS).map(([value, c]) => ({ value, label: c.label })),
    value: current,
    onchange: (v) => { current = v; draw(); },
  });

  fig.controls(pick.el);
  fig.readouts(roKind.el, roDC.el, roAt.el, roHi.el);
  draw();
  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 25 — what sharpness costs.

   Part 5's seesaw, read backwards: sharp in frequency means long in
   time. Same figure, one slider, both consequences on screen at once.
   ------------------------------------------------------------------ */

export function orderFig() {
  const fig = figure({
    n: 25, title: 'The price of a sharp edge', tag: 'listen', domains: ['w', 't'],
    aria: 'Left: the gain of a Butterworth lowpass filter, which becomes steeper as the order rises. Right: its step response, which overshoots and rings more as the order rises.',
    caption: 'Both panels are driven by the same slider, and they move in opposite directions: the cliff on the left gets sharper exactly as the ringing on the right gets worse. This is the seesaw from Figure 16, in its most practical form. <b>An eighth-order filter is 140 dB better at rejecting a distant tone and takes four times as long to settle.</b> Which one matters is an engineering decision, not a mathematical one.',
  });

  const row = fig.row();
  const svgA = fig.svg('0 0 360 280', 'The gain of a Butterworth lowpass of the selected order.', row);
  const svgB = fig.svg('0 0 360 280', 'The step response of the same filter, showing overshoot and ringing.', row);

  const scA = scope(svgA, {
    w: 360, h: 280, pad: { l: 50, r: 16, t: 30, b: 40 },
    x: { min: 100, max: 20000, log: true, title: 'ω (rad/s)' },
    y: { min: -120, max: 12, step: 30, title: 'gain (dB)', decimals: 0 },
  });
  svgA.appendChild(note(50, 16, 'IN FREQUENCY — sharper is better', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  scA.vline(WC, { color: 'var(--ink-3)', dash: '2 4', label: 'corner' });
  scA.vline(10000, { color: 'var(--out)', dash: '2 4', label: '10× out' });
  const ghost = scA.path({ color: 'var(--ink-3)', width: 1.1, dash: '3 4' });
  const magPath = scA.path({ color: 'var(--sys)', width: 2.5 });

  const scB = scope(svgB, {
    w: 360, h: 280, pad: { l: 50, r: 16, t: 30, b: 40 },
    x: { min: 0, max: 20, step: 5, title: 'time (ms)', decimals: 0 },
    y: { min: -0.2, max: 1.5, ticks: [0, 0.5, 1], title: 'step response', decimals: 1 },
  });
  svgB.appendChild(note(50, 16, 'IN TIME — sharper is worse', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  scB.hline(1, { color: 'var(--ink-3)', dash: '3 4' });
  scB.hline(0, { color: 'var(--grid-major)', dash: null });
  const ghostStep = scB.path({ color: 'var(--ink-3)', width: 1.1, dash: '3 4' });
  const stepPath = scB.path({ color: 'var(--out)', width: 2.5 });

  const roN = readout('order', '—', 'sys');
  const roPoles = readout('poles used', '—', 'sys');
  const roRej = readout('at 10× the corner', '—', 'sys');
  const roOver = readout('overshoot', '—', 'out');
  const roSettle = readout('settles in', '—', 'out');

  const ws = Array.from(L.logspace(100, 20000, 400));
  const NT = 700, DT = 0.02 / (NT - 1);
  const tms = Array.from({ length: NT }, (_, i) => i * DT * 1000);

  // the first-order case, drawn faintly as a fixed reference
  {
    const one = L.butterworth(1, WC);
    ghost.set(ws, ws.map((w) => L.dB(L.cabs(L.freqResp(one, w)))));
    ghostStep.set(tms, Array.from(L.stepResponse(one, DT, NT)));
  }

  let order = 4;
  function update(n) {
    order = n;
    const sys = L.butterworth(n, WC);
    magPath.set(ws, ws.map((w) => L.dB(L.cabs(L.freqResp(sys, w)))));
    const step = L.stepResponse(sys, DT, NT);
    stepPath.set(tms, Array.from(step));

    let peak = 0, settleIdx = NT - 1;
    for (let i = 0; i < NT; i++) peak = Math.max(peak, step[i]);
    for (let i = NT - 1; i >= 0; i--) { if (Math.abs(step[i] - 1) > 0.02) { settleIdx = i; break; } }

    roN.set(`${n}`, 'sys');
    roPoles.set(`${n}`, 'sys');
    roRej.set(`${fmt(L.dB(L.cabs(L.freqResp(sys, 10 * WC))), 0)} dB`, 'sys');
    roOver.set(`${fmt((peak - 1) * 100, 1)} %`, 'out');
    roSettle.set(`${fmt(settleIdx * DT * 1000, 1)} ms`, 'out');
  }

  const k = knob({
    id: 'fig25-order', label: 'filter order', min: 1, max: 8, step: 1, value: 4,
    format: (v) => `${v} pole${v > 1 ? 's' : ''}`,
    oninput: update,
  });

  fig.controls(
    k.el,
    listen({
      label: 'square wave through it', seconds: 2.2,
      build: (sr, n) => {
        const half = Math.round(n / 2.2);
        const dry = render((t) => L.square(t, 100 * EAR), sr, half);
        const wet = L.lsim(L.butterworth(order, WC * EAR), (t) => L.square(t, 100 * EAR), 1 / sr, half);
        const gap = Math.round(0.18 * sr);
        const out = new Float32Array(half * 2 + gap);
        for (let i = 0; i < half; i++) out[i] = dry[i] * 0.6;
        let pk = 0; for (let i = 0; i < half; i++) pk = Math.max(pk, Math.abs(wet[i]));
        for (let i = 0; i < half; i++) out[half + gap + i] = (wet[i] / (pk || 1)) * 0.6;
        return out;
      },
    })
  );
  fig.readouts(roN.el, roPoles.el, roRej.el, roOver.el, roSettle.el);
  update(4);
  return fig.root;
}
