/* Part 4 — The Spinning Arrow. Figures 10-12. */

import { figure, knob, readout, fmt, sgn, s } from '../lib/dom.js';
import { scope, note } from '../lib/plot.js';
import { createLoop } from '../lib/anim.js';
import * as L from '../lib/lti.js';

/* ------------------------------------------------------------------
   Figure 11 — a sine wave is a shadow.

   Drawn by hand rather than with scope(), because the whole point is
   the geometric link between two regions of one picture: the circle on
   the left and the trace on the right have to share a horizontal line.
   ------------------------------------------------------------------ */

export function shadowFig() {
  const fig = figure({
    n: 11, title: 'A sine wave is a shadow', tag: 'interactive', domains: ['t'],
    aria: 'An arrow rotating in a circle on the left. A horizontal line runs from its tip to a curve on the right, which traces out a sine wave as the arrow turns.',
    caption: 'Press play, or drag. The height of the arrow tip <b>is</b> the sine wave — one is not a model of the other. Notice that the arrow never changes length: all the variation you see on the right comes from a constant-length thing turning at a constant rate. That is why a sinusoid is the natural signal for a system that does the same thing at every moment.',
  });

  const svg = fig.svg('0 0 720 280', 'A rotating arrow and the sine wave traced by the height of its tip.');
  const CX = 128, CY = 140, R = 98;
  const WX0 = 268, WX1 = 706, TURNS = 2;

  const angleOf = (px) => ((px - WX0) / (WX1 - WX0)) * TURNS * L.TAU;
  const pxOf = (ang) => WX0 + (ang / (TURNS * L.TAU)) * (WX1 - WX0);

  // static furniture
  svg.appendChild(s('circle', { cx: CX, cy: CY, r: R, fill: 'none', stroke: 'var(--grid-major)', 'stroke-width': 1.2 }));
  svg.appendChild(s('line', { x1: CX - R - 12, x2: CX + R + 12, y1: CY, y2: CY, stroke: 'var(--grid)', 'stroke-width': 1 }));
  svg.appendChild(s('line', { x1: CX, x2: CX, y1: CY - R - 12, y2: CY + R + 12, stroke: 'var(--grid)', 'stroke-width': 1 }));
  svg.appendChild(s('line', { x1: WX0, x2: WX1, y1: CY, y2: CY, stroke: 'var(--grid-major)', 'stroke-width': 1 }));
  svg.appendChild(note(CX, 24, 'THE ARROW', { color: 'var(--ink-2)', size: 10, weight: 600, anchor: 'middle' }));
  svg.appendChild(note(WX0, 24, 'ITS SHADOW, PLOTTED AGAINST TIME', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  for (let k = 0; k <= TURNS * 4; k++) {
    const ang = (k * L.TAU) / 4;
    svg.appendChild(s('line', { x1: pxOf(ang), x2: pxOf(ang), y1: CY - R, y2: CY + R, stroke: 'var(--grid)', 'stroke-width': 1 }));
  }
  svg.appendChild(note(WX0, CY + R + 26, '0', { color: 'var(--ink-3)', size: 10, anchor: 'middle' }));
  svg.appendChild(note(pxOf(L.TAU), CY + R + 26, 'one full turn', { color: 'var(--ink-3)', size: 10, anchor: 'middle' }));
  svg.appendChild(note(pxOf(2 * L.TAU), CY + R + 26, 'two', { color: 'var(--ink-3)', size: 10, anchor: 'end' }));
  svg.appendChild(note(CX - R - 6, CY - R - 20, 'the length never changes', { color: 'var(--ink-3)', size: 9.5 }));

  // the faint full wave, and the bold traced part
  const ghost = s('path', { fill: 'none', stroke: 'var(--tone)', 'stroke-width': 1.2, opacity: 0.3 });
  const traced = s('path', { fill: 'none', stroke: 'var(--tone)', 'stroke-width': 2.6, 'stroke-linecap': 'round' });
  {
    let d = '';
    for (let i = 0; i <= 480; i++) {
      const ang = (i / 480) * TURNS * L.TAU;
      d += (i ? 'L' : 'M') + pxOf(ang).toFixed(1) + ' ' + (CY - R * Math.sin(ang)).toFixed(1) + ' ';
    }
    ghost.setAttribute('d', d);
  }
  svg.append(ghost, traced);

  const link = s('line', { stroke: 'var(--tone)', 'stroke-width': 1, 'stroke-dasharray': '3 3' });
  const arm = s('line', { stroke: 'var(--tone)', 'stroke-width': 2.6, 'stroke-linecap': 'round' });
  const head = s('circle', { r: 5, fill: 'var(--tone)' });
  const shadowTick = s('line', { stroke: 'var(--tone)', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
  const dot = s('circle', { r: 4.5, fill: 'var(--tone)' });
  svg.append(link, arm, shadowTick, head, dot);

  const roAng = readout('angle', '—', 'tone');
  const roSin = readout('height — the sine', '—', 'tone');
  const roCos = readout('sideways — the cosine', '—');

  function draw(ang) {
    const a = ((ang % (TURNS * L.TAU)) + TURNS * L.TAU) % (TURNS * L.TAU);
    const tipX = CX + R * Math.cos(a), tipY = CY - R * Math.sin(a);
    const px = pxOf(a), py = CY - R * Math.sin(a);

    arm.setAttribute('x1', CX); arm.setAttribute('y1', CY);
    arm.setAttribute('x2', tipX); arm.setAttribute('y2', tipY);
    head.setAttribute('cx', tipX); head.setAttribute('cy', tipY);
    link.setAttribute('x1', tipX); link.setAttribute('y1', tipY);
    link.setAttribute('x2', px); link.setAttribute('y2', py);
    shadowTick.setAttribute('x1', CX); shadowTick.setAttribute('y1', CY);
    shadowTick.setAttribute('x2', CX); shadowTick.setAttribute('y2', tipY);
    dot.setAttribute('cx', px); dot.setAttribute('cy', py);

    let d = '';
    const steps = Math.max(2, Math.round((a / (TURNS * L.TAU)) * 480));
    for (let i = 0; i <= steps; i++) {
      const g = (i / 480) * TURNS * L.TAU;
      d += (i ? 'L' : 'M') + pxOf(g).toFixed(1) + ' ' + (CY - R * Math.sin(g)).toFixed(1) + ' ';
    }
    traced.setAttribute('d', d);

    const deg = ((a * 180) / Math.PI) % 360;
    roAng.set(`${fmt(deg, 0)}°`, 'tone');
    roSin.set(sgn(Math.sin(a), 2), 'tone');
    roCos.set(sgn(Math.cos(a), 2));
  }

  const k = knob({
    id: 'fig11-angle', label: 'turn the arrow', min: 0, max: TURNS * 360, step: 1, value: 50,
    format: (v) => `${fmt(v, 0)}°`,
    oninput: (v) => { loop.pause(); loop.elapsed = (v / 180) * Math.PI; draw(loop.elapsed); },
  });

  const loop = createLoop(fig.root, (dt, elapsed) => {
    const a = (elapsed * 1.1) % (TURNS * L.TAU);
    draw(a);
    k.set((a * 180) / Math.PI);
  }, { autoplay: false, speed: 1 });

  fig.controls(k.el, loop.button);
  fig.readouts(roAng.el, roSin.el, roCos.el);
  draw((50 / 180) * Math.PI);
  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 10 — sine in, sine out.

   The horizontal axis is CYCLES, not seconds, so the two traces stay
   comparable as the frequency changes and the phase shift is readable
   as a fraction of a cycle. The grey dashed trace is the input scaled
   and shifted by the two measured numbers — if it hides under the
   output at every frequency, the claim is proved.
   ------------------------------------------------------------------ */

export function eigenFig() {
  const fig = figure({
    n: 10, title: 'Sine in, sine out — only two numbers change', tag: 'interactive', domains: ['t'],
    aria: 'A blue input sinusoid and an orange output sinusoid over three cycles. As the frequency slider moves, the output shrinks and slides later, but never changes shape.',
    caption: 'The grey dashed trace is the <b>input</b>, merely made smaller and slid later by the two numbers in the readout — and it hides under the output at every frequency you can select. Compare with Figure 9, where a square wave went in and something else came out. <b>Honest note:</b> this is the steady state, after any start-up transient has died away; Part 7 is about the transient.',
  });

  const svg = fig.svg('0 0 720 250', 'A blue input sine and an orange output sine, plotted over three cycles.');
  const sc = scope(svg, {
    w: 720, h: 250, pad: { l: 52, r: 18, t: 26, b: 34 },
    x: { min: 0, max: 3, step: 0.5, title: 'cycles of the input tone', decimals: 1 },
    y: { min: -1.25, max: 1.25, ticks: [-1, -0.5, 0, 0.5, 1], title: 'amplitude', decimals: 1 },
  });
  svg.appendChild(note(52, 15, 'THE SAME ROOM AS FIGURE 6, τ = 1 ms', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  sc.hline(0, { color: 'var(--grid-major)', dash: null });

  const inPath = sc.path({ color: 'var(--in)', width: 2.1 });
  const outPath = sc.path({ color: 'var(--out)', width: 2.6 });
  const rebuilt = sc.path({ color: 'var(--ink-3)', width: 1.5, dash: '5 4' });
  sc.text(0.03, 1.14, 'dashed grey: the input, scaled and slid by the two readout numbers', { color: 'var(--ink-3)', size: 9.5 });

  const room = L.rc(1000);
  const cyc = Array.from(L.linspace(0, 3, 600));

  const roF = readout('tone', '—', 'tone');
  const roGain = readout('gain', '—', 'sys');
  const roDb = readout('in decibels', '—', 'sys');
  const roPh = readout('phase', '—', 'sys');
  const roDelay = readout('which is a delay of', '—');

  function update(f) {
    const w = L.TAU * f;
    const H = L.freqResp(room, w);
    const g = L.cabs(H), ph = L.carg(H);

    // The orange trace is the differential equation, integrated: twelve
    // cycles from rest, of which the last three are drawn, by which time
    // the start-up transient is long gone. The grey dashed trace is the
    // input merely scaled by |H| and slid by arg(H). They are computed by
    // completely different routes, which is the only reason their landing
    // on top of each other says anything at all.
    const per = 1 / f;
    const dt = (3 * per) / (cyc.length - 1);
    const total = cyc.length * 4;
    const y = L.lsim(room, (t) => Math.sin(L.TAU * f * t), dt, total);
    const tail = Array.from(y.subarray(total - cyc.length));

    inPath.set(cyc, cyc.map((c) => Math.sin(L.TAU * (c + 9))));
    outPath.set(cyc, tail);
    rebuilt.set(cyc, cyc.map((c) => g * Math.sin(L.TAU * (c + 9) + ph)));
    roF.set(`${fmt(f, 0)} Hz`, 'tone');
    roGain.set(`× ${fmt(g, 3)}`, 'sys');
    roDb.set(`${sgn(L.dB(g), 1)} dB`, 'sys');
    roPh.set(`${sgn((ph * 180) / Math.PI, 1)}°`, 'sys');
    roDelay.set(`${fmt((-ph / w) * 1000, 3)} ms`);
  }

  const k = knob({
    id: 'fig10-f', label: 'input frequency', min: 20, max: 1600, step: 5, value: 300,
    format: (v) => `${fmt(v, 0)} Hz`,
    oninput: update,
  });

  fig.controls(k.el);
  fig.readouts(roF.el, roGain.el, roDb.el, roPh.el, roDelay.el);
  update(300);
  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 12 — two numbers, one arrow. A reference drawing.
   ------------------------------------------------------------------ */

export function complexFig() {
  const fig = figure({
    n: 12, title: 'Two numbers, one arrow', tag: 'reference', domains: ['t'],
    aria: 'Three panels. Left: an arrow labelled with its length and angle. Middle: two arrows multiplied, showing that lengths multiply and angles add. Right: a spinning arrow whose sideways shadow is a cosine.',
    caption: 'The middle panel is the only reason this notation is worth learning. "Shrink it and slide it later" is two separate operations on a wave, and it is <b>one multiplication</b> on an arrow. Everything from Part 6 onwards is that substitution, cashed in.',
  });

  const svg = fig.svg('0 0 720 268', 'Reference drawing of a complex number as an arrow, multiplication as stretch-and-rotate, and the spinning arrow whose shadow is a cosine.');
  const PT = 26, PB = 244;                       // panel top and bottom
  const panels = [
    { x: 8, w: 226, title: 'A NUMBER WITH A DIRECTION' },
    { x: 246, w: 226, title: 'MULTIPLYING = STRETCH + TURN' },
    { x: 484, w: 228, title: 'SPINNING = A PURE TONE' },
  ];
  for (const p of panels) {
    svg.appendChild(s('rect', { x: p.x, y: PT, width: p.w, height: PB - PT, fill: 'var(--vellum)', stroke: 'var(--grid-major)' }));
    svg.appendChild(note(p.x, 18, p.title, { color: 'var(--ink-2)', size: 9.5, weight: 600 }));
  }

  const arrowTo = (cx, cy, ang, len, color, width = 2.4) => {
    const g = s('g');
    const tx = cx + len * Math.cos(ang), ty = cy - len * Math.sin(ang);
    g.appendChild(s('line', { x1: cx, y1: cy, x2: tx, y2: ty, stroke: color, 'stroke-width': width, 'stroke-linecap': 'round' }));
    const a = Math.atan2(ty - cy, tx - cx);
    g.appendChild(s('path', {
      d: `M${tx} ${ty} L${tx - 9 * Math.cos(a) - 4 * Math.sin(a)} ${ty - 9 * Math.sin(a) + 4 * Math.cos(a)} ` +
         `L${tx - 9 * Math.cos(a) + 4 * Math.sin(a)} ${ty - 9 * Math.sin(a) - 4 * Math.cos(a)} Z`, fill: color,
    }));
    return g;
  };
  const axes = (cx, cy, r) => {
    const g = s('g');
    g.appendChild(s('line', { x1: cx - r, x2: cx + r, y1: cy, y2: cy, stroke: 'var(--grid)', 'stroke-width': 1 }));
    g.appendChild(s('line', { x1: cx, x2: cx, y1: cy - r, y2: cy + r, stroke: 'var(--grid)', 'stroke-width': 1 }));
    return g;
  };

  /* panel 1 — the arrow, and what its two numbers mean */
  {
    const cx = 74, cy = 132, r = 78, ang = 0.66;
    svg.appendChild(axes(cx, cy, 70));
    svg.appendChild(s('path', {
      d: `M${cx + 24} ${cy} A 24 24 0 0 0 ${cx + 24 * Math.cos(ang)} ${cy - 24 * Math.sin(ang)}`,
      fill: 'none', stroke: 'var(--sys)', 'stroke-width': 1.4,
    }));
    svg.appendChild(arrowTo(cx, cy, ang, r, 'var(--sys)'));
    svg.appendChild(note(cx + 24, cy - 54, 'length = the gain', { color: 'var(--sys)', size: 9.5 }));
    svg.appendChild(note(cx + 30, cy - 6, 'angle = the phase', { color: 'var(--sys)', size: 9.5 }));
    svg.appendChild(note(18, 210, 'one object, two numbers:', { color: 'var(--ink-3)', size: 9 }));
    svg.appendChild(note(18, 226, 'M∠φ    or    M · e^(jφ)', { color: 'var(--ink-2)', size: 10 }));
  }

  /* panel 2 — multiplication is stretch-and-turn */
  {
    const cx = 300, cy = 168;
    svg.appendChild(axes(cx, cy, 62));
    svg.appendChild(arrowTo(cx, cy, 0.46, 66, 'var(--in)', 2.2));
    svg.appendChild(note(cx + 64, cy - 30, 'a', { color: 'var(--in)', size: 12, weight: 600 }));
    svg.appendChild(arrowTo(cx, cy, 0.30, 42, 'var(--tone)', 2.2));
    svg.appendChild(note(cx + 42, cy - 4, 'b', { color: 'var(--tone)', size: 12, weight: 600 }));
    svg.appendChild(arrowTo(cx, cy, 0.76, 104, 'var(--out)', 2.6));
    svg.appendChild(note(cx + 78, cy - 76, 'a × b', { color: 'var(--out)', size: 12, weight: 600 }));
    svg.appendChild(note(256, 210, 'lengths multiply, angles add', { color: 'var(--ink-2)', size: 9.5 }));
    svg.appendChild(note(256, 226, '"shrink it and delay it" = one step', { color: 'var(--ink-3)', size: 9 }));
  }

  /* panel 3 — spin it, and the shadow is a tone */
  {
    const cx = 534, cy = 92, r = 40;
    svg.appendChild(s('circle', { cx, cy, r, fill: 'none', stroke: 'var(--grid-major)', 'stroke-width': 1.1 }));
    svg.appendChild(axes(cx, cy, 48));
    svg.appendChild(arrowTo(cx, cy, 0.85, r, 'var(--tone)', 2.4));
    svg.appendChild(s('path', {
      d: `M${cx + 50} ${cy - 20} a 26 26 0 0 1 -4 40`, fill: 'none',
      stroke: 'var(--ink-3)', 'stroke-width': 1.2,
    }));
    svg.appendChild(note(cx + 46, cy - 28, 'turning at ω', { color: 'var(--ink-3)', size: 9 }));
    svg.appendChild(note(494, cy + 58, 'e^(jωt)', { color: 'var(--tone)', size: 11 }));

    let d = '';
    for (let i = 0; i <= 160; i++) {
      const a = (i / 160) * 2 * L.TAU;
      d += (i ? 'L' : 'M') + (496 + (i / 160) * 204).toFixed(1) + ' ' + (192 - 22 * Math.cos(a)).toFixed(1) + ' ';
    }
    svg.appendChild(s('path', { d, fill: 'none', stroke: 'var(--tone)', 'stroke-width': 1.8 }));
    svg.appendChild(s('line', { x1: 496, x2: 700, y1: 192, y2: 192, stroke: 'var(--grid)', 'stroke-width': 1 }));
    svg.appendChild(note(494, 226, 'its sideways shadow: cos(ωt)', { color: 'var(--ink-3)', size: 9 }));
  }
  return fig.root;
}
