/* Part 7 — Poles. Figures 20-23. */

import { figure, knob, readout, fmt, sgn, s, draggable, svgPoint } from '../lib/dom.js';
import { scope, note, poleGlyph, zeroGlyph, block, arrow, summer } from '../lib/plot.js';
import * as L from '../lib/lti.js';

/* ------------------------------------------------------------------
   Figure 20 — the test tone is allowed to fade, or to run away.
   ------------------------------------------------------------------ */

export function growingToneFig() {
  const fig = figure({
    n: 20, title: 'Let the test tone fade — or run away', tag: 'interactive', domains: ['t'],
    aria: 'A sinusoid inside an exponential envelope. The slider changes the envelope from strongly decaying, through steady, to growing.',
    caption: 'Part 4 only ever tested with the middle case, σ = 0 — a tone that goes on forever at constant size. Allowing σ to be anything is the whole of the Laplace transform. <b>The sign of σ is the difference between a system that settles and one that destroys itself</b>, which is why Part 7 spends so long on which side of a line things are.',
  });

  const svg = fig.svg('0 0 720 240', 'A sinusoid whose envelope decays, holds steady, or grows, according to the slider.');
  const sc = scope(svg, {
    w: 720, h: 240, pad: { l: 56, r: 18, t: 24, b: 32 },
    x: { min: 0, max: 20, step: 5, title: 'time (ms)', decimals: 0 },
    y: { min: -2.6, max: 2.6, ticks: [-2, -1, 0, 1, 2], title: 'amplitude', decimals: 0 },
  });
  svg.appendChild(note(56, 14, 'THE TEST SIGNAL   e^(σt) · sin(ωt)   with ω = 1000 rad/s', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  sc.hline(0, { color: 'var(--grid-major)', dash: null });

  const envP = sc.path({ color: 'var(--ink-3)', width: 1.4, dash: '5 4' });
  const envN = sc.path({ color: 'var(--ink-3)', width: 1.4, dash: '5 4' });
  const wave = sc.path({ color: 'var(--tone)', width: 2.3 });

  const roSig = readout('σ', '—', 'sys');
  const roW = readout('ω', '1000 rad/s', 'tone');
  const roWhat = readout('so the test tone', '—');
  const roHalf = readout('halves / doubles every', '—');

  const tsm = Array.from(L.linspace(0, 20, 800));

  function update(sigma) {
    const env = tsm.map((ms) => Math.exp((sigma * ms) / 1000));
    envP.set(tsm, env);
    envN.set(tsm, env.map((v) => -v));
    wave.set(tsm, tsm.map((ms, i) => env[i] * Math.sin(1000 * (ms / 1000))));
    roSig.set(`${sgn(sigma, 0)} /s`, 'sys');
    roWhat.set(sigma < -5 ? 'fades away' : sigma > 5 ? 'runs away' : 'holds steady — this is Part 4',
               sigma > 5 ? 'bad' : sigma < -5 ? 'ok' : null);
    roHalf.set(Math.abs(sigma) < 5 ? 'never' : `${fmt((Math.LN2 / Math.abs(sigma)) * 1000, 2)} ms`);
  }

  const k = knob({
    id: 'fig20-sigma', label: 'σ — the fade rate', min: -400, max: 200, step: 5, value: -200,
    format: (v) => `${sgn(v, 0)} per second`,
    oninput: update,
  });

  fig.controls(k.el);
  fig.readouts(roSig.el, roW.el, roWhat.el, roHalf.el);
  update(-200);
  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 21 — the pole IS the ring.

   The pole pair is confined to the circle |s| = 1000 rad/s, so the
   figure keeps exactly one degree of freedom: the angle. Radius and
   angle together is a two-knob dashboard, and that is what the Bench
   is for. Drag the pole or use the slider — they are the same control.
   ------------------------------------------------------------------ */

const WN = 1000;

export function poleRingFig() {
  const fig = figure({
    n: 21, title: 'The pole is the ring', tag: 'interactive', domains: ['s', 't'],
    aria: 'Left: a map of the s-plane with a pair of poles marked by crosses on a circle. Right: the resulting impulse response, which rings more as the poles move towards the vertical axis.',
    caption: 'Drag a cross, or use the slider — they are the same control. The poles are pinned to a circle here so the figure keeps <b>one</b> degree of freedom; distance from the origin sets speed and is held fixed. Note what happens as the crosses approach the vertical axis: the ringing never stops. On the axis, the system is a bell that has forgotten how to stop ringing, and to the right of it, a bell getting louder.',
  });

  const row = fig.row();
  const svgA = fig.svg('0 0 360 320', 'A map of the s-plane with a conjugate pair of poles on a circle of radius 1000.', row);
  const svgB = fig.svg('0 0 360 320', 'The impulse response corresponding to the pole positions.', row);

  const scA = scope(svgA, {
    w: 360, h: 320, pad: { l: 48, r: 20, t: 30, b: 40 },
    x: { min: -1400, max: 700, step: 700, title: 'σ  — how fast it fades', decimals: 0 },
    y: { min: -1400, max: 1400, step: 700, title: 'jω  — how fast it wiggles', decimals: 0 },
  });
  svgA.appendChild(note(48, 16, 'THE MAP', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  scA.crosshair();
  scA.band(0, 700, { color: 'var(--out-wash)' });
  scA.text(60, 1230, 'unstable', { color: 'var(--bad)', size: 9.5 });
  scA.text(-1330, 1230, 'stable — everything settles', { color: 'var(--ok)', size: 9.5 });
  {
    const cx = [], cy = [];
    for (let i = 0; i <= 180; i++) {
      const a = Math.PI / 2 + (i / 180) * Math.PI;
      cx.push(WN * Math.cos(a)); cy.push(WN * Math.sin(a));
    }
    scA.path({ color: 'var(--ink-3)', width: 1, dash: '3 4' }).set(cx, cy);
  }

  const poleLayer = s('g', { class: 'bench__grab' });
  scA.layer.appendChild(poleLayer);

  const scB = scope(svgB, {
    w: 360, h: 320, pad: { l: 52, r: 18, t: 30, b: 40 },
    x: { min: 0, max: 40, step: 10, title: 'time (ms)', decimals: 0 },
    y: { min: -1.15, max: 1.15, ticks: [-1, 0, 1], title: 'h(t), scaled', decimals: 0 },
  });
  svgB.appendChild(note(52, 16, 'WHAT THAT SOUNDS LIKE', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  scB.hline(0, { color: 'var(--grid-major)', dash: null });
  const hPath = scB.path({ color: 'var(--sys)', width: 2.3 });
  const hEnvP = scB.path({ color: 'var(--ink-3)', width: 1.2, dash: '4 4' });
  const hEnvN = scB.path({ color: 'var(--ink-3)', width: 1.2, dash: '4 4' });

  const roZeta = readout('ζ  damping', '—', 'sys');
  const roSig = readout('σ', '—', 'sys');
  const roWd = readout('rings at', '—', 'tone');
  const roQ = readout('Q', '—');
  const roOver = readout('step overshoot', '—');
  const roSettle = readout('settles in', '—');

  const tms = Array.from(L.linspace(0, 40, 700));
  let angleDeg = 101.5;                      // measured from the +σ axis

  function apply(deg) {
    angleDeg = L.clamp(deg, 91, 179);
    const a = (angleDeg * Math.PI) / 180;
    const sigma = WN * Math.cos(a), wd = WN * Math.sin(a);
    const zeta = -Math.cos(a);

    while (poleLayer.firstChild) poleLayer.removeChild(poleLayer.firstChild);
    for (const sign of [1, -1]) {
      poleLayer.appendChild(poleGlyph(scA.X(sigma), scA.Y(sign * wd), { color: 'var(--sys)', r: 7 }));
    }
    poleLayer.appendChild(s('line', {
      x1: scA.X(0), y1: scA.Y(0), x2: scA.X(sigma), y2: scA.Y(wd),
      stroke: 'var(--sys)', 'stroke-width': 1, 'stroke-dasharray': '2 3',
    }));

    const env = tms.map((ms) => Math.exp((sigma * ms) / 1000));
    hPath.set(tms, tms.map((ms, i) => env[i] * Math.sin((wd * ms) / 1000)));
    hEnvP.set(tms, env); hEnvN.set(tms, env.map((v) => -v));

    roZeta.set(fmt(zeta, 3), zeta < 0.02 ? 'bad' : 'sys');
    roSig.set(`${sgn(sigma, 0)} /s`, 'sys');
    roWd.set(`${fmt(wd, 0)} rad/s = ${fmt(wd / L.TAU, 0)} Hz`, 'tone');
    roQ.set(zeta > 1e-4 ? fmt(1 / (2 * zeta), 2) : '∞');
    roOver.set(zeta < 1
      ? `${fmt(100 * Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta)), 1)} %`
      : '0 %');
    roSettle.set(sigma < -1 ? `${fmt((-4 / sigma) * 1000, 1)} ms` : 'never');
  }

  const k = knob({
    // 101.5 degrees is zeta = 0.199 — the guide's recurring second-order
    // room, the same trace the reader met in Figure 1.
    id: 'fig21-angle', label: 'pole angle', min: 91, max: 179, step: 0.5, value: 101.5,
    format: (v) => `${fmt(v, 1)}° from the σ axis`,
    oninput: apply,
  });

  draggable(svgA, poleLayer, (p) => {
    const sigma = scA.invX(p.x), wd = Math.abs(scA.invY(p.y));
    const deg = (Math.atan2(Math.max(wd, 1), sigma) * 180) / Math.PI;
    k.set(L.clamp(deg, 91, 179));
    apply(deg);
  });

  fig.controls(k.el);
  fig.readouts(roZeta.el, roSig.el, roWd.el, roQ.el, roOver.el, roSettle.el);
  apply(101.5);
  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 22 — three ways to wire two boxes. Reference.
   ------------------------------------------------------------------ */

export function blockDiagramFig() {
  const fig = figure({
    n: 22, title: 'Three ways to wire two boxes', tag: 'reference', domains: ['s'],
    aria: 'Three block diagrams — two boxes in series, two in parallel, and one box with feedback around it — each labelled with the transfer function of the combination.',
    caption: 'Series and parallel are unsurprising. The third one is the whole of control engineering: <b>the loop puts the thing you want on the top and the thing you have on the bottom</b>, so if the loop gain is large the fraction collapses to 1/K and the plant\'s own character stops mattering. Figure 23 turns that knob.',
  });

  const svg = fig.svg('0 0 720 400', 'Three block diagrams: series, parallel and feedback, each with its combined transfer function.');
  const wire = (x1, y1, x2, y2) =>
    s('line', { x1, y1, x2, y2, stroke: 'var(--ink-2)', 'stroke-width': 1.5 });

  const rows = [
    { title: 18, mid: 56, eq: 'H(s) = H₁(s) · H₂(s)', t: 'IN SERIES — one after the other', why: 'gains multiply, delays add' },
    { title: 118, mid: 176, eq: 'H(s) = H₁(s) + H₂(s)', t: 'IN PARALLEL — both at once, then added', why: 'the two paths just sum' },
    { title: 268, mid: 310, eq: 'H(s) = K·P(s) / (1 + K·P(s))', t: 'WITH FEEDBACK — compare, then correct', why: 'the loop divides out the plant' },
  ];
  for (const r of rows) {
    svg.appendChild(note(10, r.title, r.t, { color: 'var(--ink-2)', size: 10, weight: 600 }));
    svg.appendChild(note(710, r.title, r.why, { color: 'var(--ink-3)', size: 9.5, anchor: 'end' }));
    svg.appendChild(note(430, r.mid + 5, r.eq, { color: 'var(--sys)', size: 12 }));
  }

  /* series */
  svg.appendChild(arrow(14, 56, 62, 56, { label: 'x' }));
  svg.appendChild(block(62, 38, 76, 36, 'H₁'));
  svg.appendChild(arrow(138, 56, 186, 56));
  svg.appendChild(block(186, 38, 76, 36, 'H₂'));
  svg.appendChild(arrow(262, 56, 320, 56, { label: 'y' }));

  /* parallel */
  svg.appendChild(arrow(14, 176, 50, 176, { label: 'x' }));
  svg.appendChild(wire(50, 146, 50, 206));
  svg.appendChild(arrow(50, 146, 96, 146));
  svg.appendChild(arrow(50, 206, 96, 206));
  svg.appendChild(block(96, 128, 76, 36, 'H₁'));
  svg.appendChild(block(96, 188, 76, 36, 'H₂'));
  svg.appendChild(arrow(172, 146, 236, 146));
  svg.appendChild(arrow(172, 206, 236, 206));
  svg.appendChild(wire(236, 146, 236, 206));
  svg.appendChild(wire(236, 176, 240, 176));
  svg.appendChild(summer(250, 176, { signs: ['+', '+'] }));
  svg.appendChild(arrow(262, 176, 320, 176, { label: 'y' }));

  /* feedback */
  svg.appendChild(arrow(14, 310, 44, 310, { label: 'want' }));
  svg.appendChild(summer(58, 310, { signs: ['+', '−'] }));
  svg.appendChild(arrow(70, 310, 106, 310, { label: 'error' }));
  svg.appendChild(block(106, 292, 56, 36, 'K'));
  svg.appendChild(arrow(162, 310, 196, 310));
  svg.appendChild(block(196, 292, 76, 36, 'P(s)', { sub: 'the plant' }));
  svg.appendChild(arrow(272, 310, 340, 310, { label: 'got' }));
  svg.appendChild(wire(306, 310, 306, 356));
  svg.appendChild(wire(306, 356, 58, 356));
  svg.appendChild(arrow(58, 356, 58, 324));
  svg.appendChild(note(14, 382, 'measure what you got, subtract what you wanted, act on the difference', { color: 'var(--ink-3)', size: 9 }));

  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 23 — feedback moves the poles.

   The plant is three lags in series: 10 s, 1 s and 0.5 s. Part 10 puts
   the same three lags in a car, so the reader meets this plant twice.
   ------------------------------------------------------------------ */

const PLANT = L.threeLag(1);

export function feedbackFig() {
  const fig = figure({
    n: 23, title: 'Feedback moves the poles — until it moves them too far', tag: 'interactive', domains: ['s', 't'],
    aria: 'Left: the s-plane, with three closed-loop poles that migrate as the loop gain rises, two of them crossing into the right half-plane. Right: the step response, which gets faster, then rings, then grows without limit.',
    caption: 'The error shrinks as 1/(1+K), so more gain is always better — right up to K ≈ 35, where two poles cross the line and the system starts howling at a fixed 4-second period. <b>Nothing warns you.</b> At K = 30 the response merely looks lively. That cliff is why control engineers care about how much phase a loop has spent, and it is the entire subject of Part 10\'s second half.',
  });

  const row = fig.row();
  const svgA = fig.svg('0 0 360 300', 'The closed-loop poles plotted on the s-plane as the gain changes.', row);
  const svgB = fig.svg('0 0 360 300', 'The closed-loop step response.', row);

  const scA = scope(svgA, {
    w: 360, h: 300, pad: { l: 46, r: 18, t: 30, b: 38 },
    x: { min: -3.6, max: 1.4, step: 1, title: 'σ  (1/s)', decimals: 0 },
    y: { min: -2.6, max: 2.6, step: 1.3, title: 'jω  (rad/s)', decimals: 1 },
  });
  svgA.appendChild(note(46, 16, 'WHERE THE POLES GO', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  scA.crosshair();
  scA.band(0, 1.4, { color: 'var(--out-wash)' });
  scA.text(0.1, 2.25, 'unstable', { color: 'var(--bad)', size: 9.5 });

  // the whole locus, drawn faintly once, so the moving poles have a track
  {
    const tracks = [[], [], []];
    for (let i = 0; i <= 240; i++) {
      const K = 0.02 + (i / 240) * 60;
      const p = L.closeLoop(PLANT, K).poles
        .map((q) => (typeof q === 'number' ? L.C(q, 0) : q))
        .sort((a, b) => a.im - b.im);
      p.forEach((q, j) => tracks[j] && tracks[j].push(q));
    }
    for (const tr of tracks) {
      scA.path({ color: 'var(--ink-3)', width: 1, dash: '2 3' })
         .set(tr.map((q) => q.re), tr.map((q) => q.im));
    }
  }
  const openLayer = s('g');
  scA.layer.appendChild(openLayer);
  for (const p of PLANT.poles) {
    openLayer.appendChild(poleGlyph(scA.X(typeof p === 'number' ? p : p.re), scA.Y(0), { color: 'var(--ink-3)', r: 5, width: 1.6 }));
  }
  scA.text(-3.5, -2.25, 'grey: the three lags on their own', { color: 'var(--ink-3)', size: 9 });
  const nowLayer = s('g');
  scA.layer.appendChild(nowLayer);

  const scB = scope(svgB, {
    w: 360, h: 300, pad: { l: 46, r: 18, t: 30, b: 38 },
    x: { min: 0, max: 40, step: 10, title: 'time (s)', decimals: 0 },
    y: { min: -0.3, max: 2.1, ticks: [0, 0.5, 1, 1.5, 2], title: 'output', decimals: 1 },
  });
  svgB.appendChild(note(46, 16, 'WHAT IT DOES', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  scB.hline(1, { color: 'var(--ink-3)', dash: '3 4', label: 'what you asked for' });
  scB.hline(0, { color: 'var(--grid-major)', dash: null });
  const stepPath = scB.path({ color: 'var(--out)', width: 2.4 });

  const roK = readout('loop gain K', '—', 'sys');
  const roErr = readout('steady-state error', '—', 'out');
  const roRe = readout('worst pole', '—', 'ok');
  const roState = readout('verdict', '—', 'ok');

  const NT = 700, DT = 40 / (NT - 1);
  const tsec = Array.from({ length: NT }, (_, i) => i * DT);

  function update(K) {
    const T = L.closeLoop(PLANT, K);
    stepPath.set(tsec, Array.from(L.stepResponse(T, DT, NT)));

    while (nowLayer.firstChild) nowLayer.removeChild(nowLayer.firstChild);
    let worst = -Infinity;
    for (const p of T.poles) {
      const q = typeof p === 'number' ? { re: p, im: 0 } : p;
      worst = Math.max(worst, q.re);
      nowLayer.appendChild(poleGlyph(scA.X(q.re), scA.Y(q.im), { color: q.re > 0 ? 'var(--bad)' : 'var(--sys)', r: 7 }));
    }

    const dc = T.b[0] / T.a[0];
    roK.set(fmt(K, 1), 'sys');
    roErr.set(`${fmt((1 - dc) * 100, 1)} %`, 'out');
    roRe.set(`σ = ${sgn(worst, 3)}`, worst > 0 ? 'bad' : 'ok');
    roState.set(worst > 0 ? 'howling — it never settles' : worst > -0.06 ? 'barely settling' : 'settles', worst > 0 ? 'bad' : 'ok');
  }

  const k = knob({
    id: 'fig23-k', label: 'loop gain K', min: 0.5, max: 60, step: 0.5, value: 10,
    format: (v) => `K = ${fmt(v, 1)}`,
    oninput: update,
  });

  fig.controls(k.el);
  fig.readouts(roK.el, roErr.el, roRe.el, roState.el);
  update(10);
  return fig.root;
}
