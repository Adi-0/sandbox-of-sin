/* Part 3 — One Clap Tells All. Figures 6-9. */

import { figure, knob, readout, fmt, s, h as el } from '../lib/dom.js';
import { scope, note } from '../lib/plot.js';
import { listen, EAR, render } from '../lib/audio.js';
import * as L from '../lib/lti.js';

/* ------------------------------------------------------------------
   A synthetic concert hall, used only for the ear.

   Our recurring room has tau = 1 ms, which is a blanket over a speaker,
   not a cathedral — you cannot hear a 1 ms decay. This one is the same
   mathematics a hundred and sixty times slower: a direct sound, a scatter of
   early reflections off the near walls, and a tail of dense reflections
   dying away exponentially. It is a caricature of a real measurement,
   and it is flagged as one in the caption.
   ------------------------------------------------------------------ */

function hallResponse(sr) {
  const dur = 0.62;
  const n = Math.round(dur * sr);
  const out = new Float64Array(n);
  out[0] = 1;                                        // the direct sound
  const early = [[0.011, 0.5], [0.019, -0.42], [0.028, 0.34], [0.037, -0.3],
                 [0.049, 0.26], [0.061, -0.21], [0.078, 0.17]];
  for (const [t, a] of early) out[Math.round(t * sr)] += a;
  const nz = L.noise(n, 1234);
  for (let i = 0; i < n; i++) out[i] += 0.34 * nz[i] * Math.exp(-i / sr / 0.16);
  return out;
}

/** Three short plucked notes — the dry sound we send into the hall. */
function drySound(sr, n) {
  const notes = [[0.00, 440], [0.26, 554.37], [0.52, 659.25]];
  return render((t) => {
    let y = 0;
    for (const [t0, f] of notes) {
      if (t < t0) continue;
      const u = t - t0;
      y += Math.exp(-u / 0.09) * (Math.sin(L.TAU * f * u) + 0.4 * Math.sin(L.TAU * 2 * f * u));
    }
    return y * 0.5;
  }, sr, n);
}

/* ------------------------------------------------------------------
   Figure 6 — the clap.
   ------------------------------------------------------------------ */

export function impulseResponseFig() {
  const fig = figure({
    n: 6, title: 'The clap, and what comes back', tag: 'listen', domains: ['t'],
    aria: 'A decaying exponential curve starting at its highest point and falling towards zero, with a marker at one time constant. Below it, the measured impulse response of a real hall: a spike, a scatter of reflections, and a dense decaying tail.',
    caption: 'The lower panel is what an acoustician actually records, and it is the same shape wrapped around a thousand echoes: a start, and a decay. Our room and the hall differ by a factor of about a hundred and sixty in speed and not at all in mathematics. <b>Honest note:</b> the hall trace is synthesised, not a real measurement, and the ear demos run it rather than the 1 ms room because you cannot hear a millisecond.',
  });

  /* --- the room ---
     Both axes are rebuilt as tau changes. A fixed axis wide enough for
     the fastest room squashes the default room into the bottom fifth of
     the panel, and the default state is the one that has to teach. The
     redraw also keeps the two facts visible together: a faster room
     starts higher AND ends sooner, because the area is always 1. */
  const svgA = fig.svg('0 0 720 210', 'The impulse response of the guide\'s room: a decaying exponential starting at one over tau and falling towards zero.');

  const roTau = readout('τ', '1.00 ms', 'sys');
  const roH0 = readout('h(0) = 1/τ', '1000 /s', 'sys');
  const roGone = readout('over by 5τ', '5.0 ms', 'sys');
  const roArea = readout('area under h — always', '1.000');

  function update(tauMs) {
    const tau = tauMs / 1000;
    while (svgA.firstChild) svgA.removeChild(svgA.firstChild);

    const tMax = Math.max(4, Math.min(16, 6 * tauMs));         // ms
    const yMax = (1 / tau) * 1.12;
    const scA = scope(svgA, {
      w: 720, h: 210, pad: { l: 66, r: 18, t: 26, b: 32 },
      x: { min: 0, max: tMax, title: 'time since the clap (ms)', decimals: 0 },
      y: { min: 0, max: yMax, title: 'h(t)   (1/s)', decimals: 0 },
    });
    svgA.appendChild(note(66, 15, 'OUR ROOM — one pole, τ is yours to choose', { color: 'var(--ink-2)', size: 10, weight: 600 }));

    const ts = L.linspace(0, tMax / 1000, 420);
    const tsMs = Array.from(ts).map((t) => t * 1000);
    scA.path({ color: 'var(--sys)', width: 2.4 })
      .set(tsMs, Array.from(ts).map((t) => (1 / tau) * Math.exp(-t / tau)));

    const h1 = (1 / tau) * Math.exp(-1);
    scA.vline(tauMs, { color: 'var(--sys)', dash: '3 3' });
    scA.dot(tauMs, h1, { color: 'var(--sys)', r: 4 });
    scA.text(tauMs, h1, '  τ — down to 37%', { color: 'var(--sys)', size: 10, dy: -8 });
    if (5 * tauMs <= tMax) {
      scA.vline(5 * tauMs, { color: 'var(--ink-3)', dash: '2 4', label: '5τ · effectively over' });
    }

    roTau.set(`${fmt(tauMs, 2)} ms`, 'sys');
    roH0.set(`${fmt(1 / tau, 0)} /s`, 'sys');
    roGone.set(`${fmt(5 * tauMs, 1)} ms`, 'sys');
  }

  /* --- the hall, drawn once, over an 80x wider time span --- */
  const svgB = fig.svg('0 0 720 180', 'The impulse response of a synthesised concert hall: a spike, early reflections, and a dense decaying tail.');
  const scB = scope(svgB, {
    w: 720, h: 180, pad: { l: 62, r: 18, t: 26, b: 32 },
    x: { min: 0, max: 620, step: 155, title: 'time since the clap (ms)  — note the axis: 80× wider than the panel above', decimals: 0 },
    y: { min: -1.15, max: 1.15, ticks: [-1, -0.5, 0, 0.5, 1], title: 'h(t)', decimals: 1 },
  });
  svgB.appendChild(note(62, 15, 'A CONCERT HALL — the same idea, a hundred and sixty times slower', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  scB.hline(0, { color: 'var(--grid-major)', dash: null });
  {
    // Drawn at 1.2 kHz rather than the audio rate: at 44.1 kHz the tail is
    // forty samples per pixel and reads as a solid smear, which hides the
    // one thing worth seeing — that it is made of individual reflections.
    const sr = 1200;
    const hall = hallResponse(sr);
    const xs = [], ys = [];
    for (let i = 0; i < hall.length; i++) { xs.push((i / sr) * 1000); ys.push(hall[i]); }
    scB.path({ color: 'var(--sys)', width: 0.9 }).set(xs, ys);

    const envT = [], envP = [], envN = [];
    for (let t = 0; t <= 0.62; t += 0.004) {
      envT.push(t * 1000); envP.push(0.4 * Math.exp(-t / 0.16)); envN.push(-0.4 * Math.exp(-t / 0.16));
    }
    scB.path({ color: 'var(--ink-3)', width: 1.4, dash: '5 4' }).set(envT, envP);
    scB.path({ color: 'var(--ink-3)', width: 1.4, dash: '5 4' }).set(envT, envN);

    scB.text(146, 0.82, 'the same decaying exponential (dashed), wrapped around a thousand reflections', { color: 'var(--ink-3)', size: 9.5 });
    scB.text(3, -0.66, '↑ direct sound', { color: 'var(--ink-3)', size: 9 });
    scB.text(72, -0.96, 'early reflections off the near walls', { color: 'var(--ink-3)', size: 9 });
    scB.text(330, -0.66, 'the dense tail — too many to count', { color: 'var(--ink-3)', size: 9 });
  }

  const k = knob({
    id: 'fig6-tau', label: 'the room\'s τ', min: 0.2, max: 3, step: 0.05, value: 1,
    format: (v) => `${fmt(v, 2)} ms`,
    oninput: update,
  });

  fig.controls(
    k.el,
    listen({
      label: 'the hall\'s clap', seconds: 0.7,
      build: (sr) => { const hh = hallResponse(sr); const o = new Float32Array(hh.length); for (let i = 0; i < hh.length; i++) o[i] = hh[i]; return o; },
    }),
    listen({
      label: 'dry, then in the hall', seconds: 2.6,
      build: (sr) => {
        const dry = drySound(sr, Math.round(0.95 * sr));
        const wet = L.fftConvolve(Float64Array.from(dry), hallResponse(sr), 1);
        const gap = Math.round(0.25 * sr);
        const out = new Float32Array(dry.length + gap + wet.length);
        for (let i = 0; i < dry.length; i++) out[i] = dry[i];
        let peak = 0; for (let i = 0; i < wet.length; i++) peak = Math.max(peak, Math.abs(wet[i]));
        const g = peak > 0 ? 1 / peak : 0;
        for (let i = 0; i < wet.length; i++) out[dry.length + gap + i] = wet[i] * g;
        return out;
      },
    })
  );
  fig.readouts(roTau.el, roH0.el, roGone.el, roArea.el);
  update(1);
  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 7 — two claps.
   The bridge from "one clap" to convolution: two inputs, two copies of
   the same answer, added. Nothing else.
   ------------------------------------------------------------------ */

export function twoClaps() {
  const fig = figure({
    n: 7, title: 'Two claps, and nothing new to learn', tag: 'interactive', domains: ['t'],
    aria: 'Two impulse arrows at adjustable spacing, and below them the room\'s answer: two identical decaying curves added together, which merge into a single taller bump as the spacing shrinks.',
    caption: 'Bring the claps together and the answer does not become a new shape — it becomes <b>the same shape twice, overlapping</b>. At zero gap the peak is exactly doubled. This is the entire content of Part 2\'s two promises, and Figure 8 is what happens when you keep going.',
  });

  const TAU = 0.001;
  const hOf = (t) => (t < 0 ? 0 : (1 / TAU) * Math.exp(-t / TAU));

  const svgA = fig.svg('0 0 720 130', 'Two impulses, separated by an adjustable gap.');
  const scA = scope(svgA, {
    w: 720, h: 130, pad: { l: 62, r: 18, t: 22, b: 26 },
    x: { min: -1, max: 12, step: 2, decimals: 0 }, y: { min: 0, max: 1.25, step: 0.5, title: 'x(t)', decimals: 0 },
    xLabels: false,
  });
  svgA.appendChild(note(62, 13, 'THE CLAPS', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  scA.hline(0, { color: 'var(--grid-major)', dash: null });
  scA.impulse(1, 1, { color: 'var(--in)', label: '1st', height: 1 });
  let secondArrow = null;

  const svgB = fig.svg('0 0 720 210', 'The room\'s answer: two decaying exponentials added together.');
  const scB = scope(svgB, {
    w: 720, h: 210, pad: { l: 62, r: 18, t: 22, b: 32 },
    x: { min: -1, max: 12, step: 2, title: 'time (ms)', decimals: 0 },
    y: { min: 0, max: 2100, ticks: [0, 500, 1000, 1500, 2000], title: 'y(t)   (1/s)', decimals: 0 },
  });
  svgB.appendChild(note(62, 13, 'THE ANSWER', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  const e1 = scB.path({ color: 'var(--sys)', width: 1.4, dash: '4 3' });
  const e2 = scB.path({ color: 'var(--sys)', width: 1.4, dash: '4 3' });
  const sum = scB.path({ color: 'var(--out)', width: 2.5 });
  scB.text(-0.8, 1950, 'dashed: each clap\'s own answer · solid: what you hear', { color: 'var(--ink-3)', size: 9.5 });

  const roGap = readout('gap', '3.00 ms', 'in');
  const roPeak = readout('peak of the answer', '—', 'out');
  const roVs = readout('vs one clap alone', '—');

  const ts = L.linspace(-0.001, 0.012, 640);
  const tsMs = Array.from(ts).map((t) => t * 1000);

  function update(gapMs) {
    const gap = gapMs / 1000;
    const y1 = Array.from(ts).map((t) => hOf(t - 0.001));
    const y2 = Array.from(ts).map((t) => hOf(t - 0.001 - gap));
    const ysum = y1.map((v, i) => v + y2[i]);
    e1.set(tsMs, y1); e2.set(tsMs, y2); sum.set(tsMs, ysum);

    if (secondArrow) secondArrow.el.remove();
    secondArrow = scA.impulse(1 + gapMs, 1, { color: 'var(--in)', label: '2nd', height: 1 });

    const peak = Math.max(...ysum);
    roGap.set(`${fmt(gapMs, 2)} ms`, 'in');
    roPeak.set(`${fmt(peak, 0)} /s`, 'out');
    roVs.set(`× ${fmt(peak / 1000, 2)}`);
  }

  const k = knob({
    id: 'fig7-gap', label: 'gap between claps', min: 0, max: 8, step: 0.1, value: 3,
    format: (v) => `${fmt(v, 2)} ms`,
    oninput: update,
  });

  fig.controls(k.el);
  fig.readouts(roGap.el, roPeak.el, roVs.el);
  update(3);
  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 8 — convolution, one slice at a time.
   The central figure of the guide. Flip, slide, multiply, add.
   ------------------------------------------------------------------ */

export function convolutionSlider() {
  const fig = figure({
    n: 8, title: 'Convolution, one slice at a time', tag: 'interactive', domains: ['t'],
    aria: 'Upper plot: a rectangular input pulse in blue, with the room\'s impulse response mirrored and positioned at the slider time in violet, and their overlap shaded. Lower plot: the resulting output curve, drawn only up to the slider time.',
    caption: 'The violet curve is h drawn <b>backwards</b>, with its start at the slider line: at time t the room is still adding up what arrived just before t, weighted by how recently it arrived. The shaded overlap is that weighting; its area is the single output value at the dot below. Drag from left to right and you are performing the integral by hand. <b>Honest note:</b> h is drawn to its own vertical scale — it really peaks at 1000 s⁻¹, which would flatten a signal of size 1 into the axis.',
  });

  const TAU = 0.001;
  const PULSE_W = 0.003;
  const room = L.rc(1 / TAU);
  const xOf = (t) => (t >= 0 && t < PULSE_W ? 1 : 0);
  const hOf = (t) => (t < 0 ? 0 : Math.exp(-t / TAU));       // scaled to peak 1, for drawing

  const svgA = fig.svg('0 0 720 220', 'The input pulse, the mirrored impulse response, and their overlap.');
  const scA = scope(svgA, {
    w: 720, h: 220, pad: { l: 62, r: 18, t: 26, b: 30 },
    x: { min: -3, max: 9, step: 1, decimals: 0 },
    y: { min: -0.08, max: 1.35, ticks: [0, 0.5, 1], title: 'x(τ)  and  h(t−τ)', decimals: 1 },
    xLabels: false,
  });
  svgA.appendChild(note(62, 15, 'MULTIPLY THESE TWO, EVERYWHERE', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  svgA.appendChild(note(702, 15, 'horizontal axis: τ, the past', { color: 'var(--ink-3)', size: 10, anchor: 'end' }));

  const overlap = scA.path({ fill: 'var(--out-wash)' });
  const xPath = scA.path({ color: 'var(--in)', width: 2.3 });
  const hPath = scA.path({ color: 'var(--sys)', width: 2 });
  const nowLine = scA.vline(2, { color: 'var(--ink)', width: 1.6 });
  const nowLabel = scA.text(2, 1.25, ' t', { color: 'var(--ink)', size: 12, weight: 600 });
  scA.text(-2.9, 1.25, 'blue: x(τ)   violet: h(t − τ), mirrored', { color: 'var(--ink-3)', size: 9.5 });

  const svgB = fig.svg('0 0 720 200', 'The output y of t, drawn up to the slider position.');
  const scB = scope(svgB, {
    w: 720, h: 200, pad: { l: 62, r: 18, t: 26, b: 32 },
    x: { min: -3, max: 9, step: 1, title: 'time (ms)', decimals: 0 },
    y: { min: -0.08, max: 1.1, ticks: [0, 0.25, 0.5, 0.75, 1], title: 'y(t)', decimals: 2 },
  });
  svgB.appendChild(note(62, 15, 'THE AREA OF THE SHADED PART, PLOTTED AGAINST t', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  scB.hline(0, { color: 'var(--grid-major)', dash: null });
  const yPath = scB.path({ color: 'var(--out)', width: 2.5 });
  const yGhost = scB.path({ color: 'var(--ink-3)', width: 1.2, dash: '3 4' });
  const yDot = scB.dot(2, 0, { color: 'var(--out)', r: 5 });
  const yLine = scB.vline(2, { color: 'var(--ink)', width: 1.6 });

  // the true answer, computed once by the engine
  const DT = 2e-5, N0 = 150, N = 750;                 // t from -3 ms to 12 ms
  const yTrue = L.lsim(room, xOf, DT, N);
  const yT = [], yV = [];
  for (let i = 0; i < N; i++) { yT.push((i * DT) * 1000); yV.push(yTrue[i]); }
  yGhost.set(yT, yV);

  const taus = L.linspace(-0.003, 0.009, 600);
  const tausMs = Array.from(taus).map((t) => t * 1000);
  const xVals = Array.from(taus).map(xOf);
  xPath.set(tausMs, xVals);

  const roT = readout('t', '2.00 ms', 'in');
  const roY = readout('y(t) = the shaded area', '—', 'out');
  const roWhy = readout('what is overlapping', '—');

  function update(tMs) {
    const t = tMs / 1000;
    const hVals = Array.from(taus).map((tau) => hOf(t - tau));
    hPath.set(tausMs, hVals);
    overlap.setArea(tausMs, xVals.map((v, i) => v * hVals[i]), 0);
    nowLine.move(tMs); nowLabel.move(tMs, 1.25);

    const idx = Math.max(0, Math.min(N - 1, Math.round(t / DT)));
    yPath.set(yT.slice(0, idx + 1), yV.slice(0, idx + 1));
    yDot.move(tMs, yV[idx]); yLine.move(tMs);

    roT.set(`${fmt(tMs, 2)} ms`, 'in');
    roY.set(fmt(yV[idx], 3), 'out');
    roWhy.set(tMs <= 0 ? 'nothing yet — the pulse has not arrived'
      : tMs < PULSE_W * 1000 ? 'the pulse is still arriving — filling up'
      : 'the pulse is over — only the memory is left');
  }

  const k = knob({
    id: 'fig8-t', label: 'now', min: -2, max: 9, step: 0.05, value: 2,
    format: (v) => `t = ${fmt(v, 2)} ms`,
    oninput: update,
  });

  fig.controls(k.el);
  fig.readouts(roT.el, roY.el, roWhy.el);
  update(2);
  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 9 — the recurring square wave meets the recurring room.
   ------------------------------------------------------------------ */

export function squareThroughRoom() {
  const fig = figure({
    n: 9, title: 'The square wave meets the room', tag: 'listen', domains: ['t'],
    aria: 'A 100 hertz square wave in blue and its output through the room in orange. As the room\'s time constant grows the sharp corners round off and the wave slumps towards a triangle.',
    caption: 'Nothing has been added and nothing has been removed at random: every output point is the shaded area from Figure 8, computed again at a new t. <b>The corners are the first thing to go</b>, which is the observation Part 5 turns into the most useful idea in the subject. Ear demo runs the whole scene four times faster — same shapes, same ratios, audible on a laptop.',
  });

  const svg = fig.svg('0 0 720 250');
  const sc = scope(svg, {
    w: 720, h: 250, pad: { l: 56, r: 18, t: 26, b: 32 },
    x: { min: 0, max: 30, step: 5, title: 'time (ms)', decimals: 0 },
    y: { min: -1.4, max: 1.4, step: 0.7, title: 'amplitude', decimals: 1 },
  });
  svg.appendChild(note(56, 15, '100 Hz SQUARE WAVE, IN AND OUT', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  sc.hline(0, { color: 'var(--grid-major)', dash: null });

  const inPath = sc.path({ color: 'var(--in)', width: 1.9 });
  const outPath = sc.path({ color: 'var(--out)', width: 2.5 });

  const DT = 1e-5, N = 3000;                            // 30 ms
  const tsMs = Array.from({ length: N }, (_, i) => i * DT * 1000);
  inPath.set(tsMs, Array.from({ length: N }, (_, i) => L.square(i * DT, 100)));

  const roTau = readout('τ', '1.00 ms', 'sys');
  const roFc = readout('corner', '159 Hz', 'sys');
  const roF1 = readout('100 Hz keeps', '—', 'tone');
  const roF3 = readout('300 Hz keeps', '—', 'tone');

  let tauMs = 1;
  function update(v) {
    tauMs = v;
    const wc = 1000 / v;                                 // rad/s
    const sys = L.rc(wc);
    const y = L.lsim(sys, (t) => L.square(t, 100), DT, N);
    outPath.set(tsMs, Array.from(y));
    roTau.set(`${fmt(v, 2)} ms`, 'sys');
    roFc.set(`${fmt(wc / L.TAU, 0)} Hz`, 'sys');
    roF1.set(`${fmt(100 * L.cabs(L.freqResp(sys, L.TAU * 100)), 0)} %`, 'tone');
    roF3.set(`${fmt(100 * L.cabs(L.freqResp(sys, L.TAU * 300)), 0)} %`, 'tone');
  }

  const k = knob({
    id: 'fig9-tau', label: 'the room\'s τ', min: 0.1, max: 5, step: 0.05, value: 1,
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
        const sys = L.rc((1000 / tauMs) * EAR);
        const wet = L.lsim(sys, (t) => L.square(t, 100 * EAR), 1 / sr, half);
        const gap = Math.round(0.18 * sr);
        const out = new Float32Array(half * 2 + gap);
        for (let i = 0; i < half; i++) out[i] = dry[i] * 0.6;
        let peak = 0; for (let i = 0; i < half; i++) peak = Math.max(peak, Math.abs(wet[i]));
        for (let i = 0; i < half; i++) out[half + gap + i] = (wet[i] / (peak || 1)) * 0.6;
        return out;
      },
    })
  );
  fig.readouts(roTau.el, roFc.el, roF1.el, roF3.el);
  update(1);
  return fig.root;
}
