/* Part 5 — A Stack of Tones. Figures 13-16. */

import { figure, knob, scenarios, readout, fmt, s } from '../lib/dom.js';
import { scope, note } from '../lib/plot.js';
import { listen, EAR, render } from '../lib/audio.js';
import * as L from '../lib/lti.js';

/* ------------------------------------------------------------------
   Figure 13 — building a square wave out of pure tones.
   ------------------------------------------------------------------ */

export function buildSquare() {
  const fig = figure({
    n: 13, title: 'Building the square wave, one tone at a time', tag: 'listen', domains: ['t'],
    aria: 'A blue curve made of summed sinusoids converging on a grey dashed square wave. Individual green harmonics are drawn faintly beneath. More harmonics make the sum flatter and its edges steeper.',
    caption: 'The wobble never goes away. Push the slider to the end and the flat parts get flatter, but the spike at each edge stays about <b>9% of the jump</b> and merely gets narrower — this is the <b>Gibbs phenomenon</b>, and it is a real property of the sum, not a drawing error. Listen as you add harmonics: the pitch never changes, only the brightness.',
  });

  const svg = fig.svg('0 0 720 260', 'A partial sum of sinusoids converging on a square wave.');
  const sc = scope(svg, {
    w: 720, h: 260, pad: { l: 52, r: 18, t: 26, b: 34 },
    x: { min: 0, max: 20, step: 5, title: 'time (ms)', decimals: 0 },
    y: { min: -1.55, max: 1.55, ticks: [-1, -0.5, 0, 0.5, 1], title: 'amplitude', decimals: 1 },
  });
  svg.appendChild(note(52, 15, 'THE 100 Hz SQUARE WAVE FROM PART 1, REBUILT FROM SINE WAVES', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  sc.hline(0, { color: 'var(--grid-major)', dash: null });

  const N = 900;
  const ts = Array.from({ length: N }, (_, i) => (i * 0.02) / (N - 1));
  const tsMs = ts.map((t) => t * 1000);

  sc.path({ color: 'var(--ink-3)', width: 1.4, dash: '5 4' }).set(tsMs, ts.map((t) => L.square(t, 100)));
  const parts = Array.from({ length: 12 }, () => sc.path({ color: 'var(--tone)', width: 1, opacity: 0.5 }));
  const sum = sc.path({ color: 'var(--in)', width: 2.6 });
  sc.text(0.2, 1.42, 'grey dashed: the target · green: the individual tones · blue: their sum', { color: 'var(--ink-3)', size: 9.5 });

  const roN = readout('tones used', '—', 'tone');
  const roTop = readout('highest tone', '—', 'tone');
  const roErr = readout('worst error', '—');
  const roOver = readout('edge overshoot', '—');

  let terms = 3;

  function update(nOdd) {
    terms = nOdd;
    const used = [];
    for (let n = 1; n <= nOdd; n += 2) used.push(n);

    used.slice(0, 12).forEach((n, i) => {
      const { amp } = L.harmonic('square', n);
      parts[i].show(true);
      parts[i].set(tsMs, ts.map((t) => amp * Math.sin(L.TAU * n * 100 * t)));
    });
    for (let i = used.length; i < 12; i++) parts[i].show(false);

    const y = ts.map((t) => L.partialSum('square', 100, t, nOdd));
    sum.set(tsMs, y);

    // worst error away from the two jumps, where Gibbs lives
    let err = 0, peak = 0;
    for (let i = 0; i < N; i++) {
      const t = ts[i], phase = ((t * 100) % 1 + 1) % 1;
      peak = Math.max(peak, Math.abs(y[i]));
      if (Math.min(phase, Math.abs(phase - 0.5), 1 - phase) > 0.06) {
        err = Math.max(err, Math.abs(y[i] - L.square(t, 100)));
      }
    }
    roN.set(`${used.length}`, 'tone');
    roTop.set(`${fmt(nOdd * 100, 0)} Hz`, 'tone');
    roErr.set(fmt(err, 3));
    roOver.set(`${fmt(((peak - 1) / 2) * 100, 1)} % of the jump`);
  }

  const k = knob({
    id: 'fig13-n', label: 'tones in the stack', min: 1, max: 41, step: 2, value: 3,
    format: (v) => `up to the ${v}${v === 1 ? 'st' : v === 3 ? 'rd' : 'th'} harmonic`,
    oninput: update,
  });

  fig.controls(
    k.el,
    listen({
      label: 'hear the stack', seconds: 1.4,
      build: (sr, n) => render((t) => 0.5 * L.partialSum('square', 100 * EAR, t, terms), sr, n),
    })
  );
  fig.readouts(roN.el, roTop.el, roErr.el, roOver.el);
  update(3);
  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 14 — the spectrum: shape on the left, recipe on the right.
   ------------------------------------------------------------------ */

const SHAPES = {
  square:   { label: 'Square',   fn: L.square,   note: 'vertical edges' },
  sawtooth: { label: 'Sawtooth', fn: L.sawtooth, note: 'one edge per cycle' },
  triangle: { label: 'Triangle', fn: L.triangle, note: 'corners, but no edges' },
  sine:     { label: 'Sine',     fn: L.sine,     note: 'no corners at all' },
};

export function spectrumFig() {
  const fig = figure({
    n: 14, title: 'The same signal, written as a recipe', tag: 'interactive', domains: ['t', 'w'],
    aria: 'Upper panel: one cycle of a waveform. Lower panel: the amplitudes of its harmonics drawn as vertical lines against frequency.',
    caption: 'Read the two panels as one sentence: <b>sharper corners on the left, taller lines further right</b>. The square and the sawtooth both have a genuine vertical edge and both fall off as 1/n; the triangle only has corners and falls off as 1/n², so its ninth harmonic is 81 times down instead of 9. This is the whole of Part 6 in advance — Figure 9\'s rounded corners were the tall right-hand lines being cut away.',
  });

  const svgA = fig.svg('0 0 720 150', 'One cycle of the selected waveform.');
  const scA = scope(svgA, {
    w: 720, h: 150, pad: { l: 52, r: 18, t: 24, b: 26 },
    x: { min: 0, max: 20, step: 5, decimals: 0 },
    y: { min: -1.35, max: 1.35, ticks: [-1, 0, 1], title: 'x(t)', decimals: 0 },
    xLabels: false,
  });
  svgA.appendChild(note(52, 14, 'THE WAVE — two cycles at 100 Hz', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  scA.hline(0, { color: 'var(--grid-major)', dash: null });
  const wavePath = scA.path({ color: 'var(--in)', width: 2.4 });

  const svgB = fig.svg('0 0 720 220', 'The harmonic amplitudes of the selected waveform, drawn as vertical lines.');
  const scB = scope(svgB, {
    w: 720, h: 220, pad: { l: 52, r: 18, t: 24, b: 34 },
    x: { min: 0, max: 2100, step: 300, title: 'frequency (Hz)', decimals: 0 },
    y: { min: 0, max: 1.35, ticks: [0, 0.5, 1], title: 'amplitude', decimals: 1 },
  });
  svgB.appendChild(note(52, 14, 'THE RECIPE — how much of each pure tone', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  const lines = scB.stems({ color: 'var(--tone)', width: 3, dot: 3.5 });
  const envelope = scB.path({ color: 'var(--ink-3)', width: 1.2, dash: '4 4' });

  const roShape = readout('shape', '—', 'in');
  const roFund = readout('fundamental', '—', 'tone');
  const roThird = readout('3rd harmonic', '—', 'tone');
  const roNinth = readout('9th harmonic', '—', 'tone');
  const roFall = readout('falls off as', '—');

  const N = 900;
  const ts = Array.from({ length: N }, (_, i) => (i * 0.02) / (N - 1));
  const tsMs = ts.map((t) => t * 1000);

  let current = 'square';
  function draw() {
    const shape = SHAPES[current];
    wavePath.set(tsMs, ts.map((t) => shape.fn(t, 100)));

    const fs = [], amps = [];
    for (let n = 1; n <= 21; n++) {
      const { amp } = L.harmonic(current, n);
      if (amp > 1e-6) { fs.push(n * 100); amps.push(amp); }
    }
    lines.set(fs, amps);

    const ef = [], ea = [];
    for (let f = 100; f <= 2100; f += 20) {
      const n = f / 100;
      ea.push(current === 'triangle' ? 8 / (n * n * Math.PI * Math.PI)
            : current === 'sine' ? 0
            : current === 'sawtooth' ? 2 / (n * Math.PI)
            : 4 / (n * Math.PI));
      ef.push(f);
    }
    envelope.show(current !== 'sine');
    envelope.set(ef, ea);

    const a1 = L.harmonic(current, 1).amp;
    const a3 = L.harmonic(current, 3).amp;
    const a9 = L.harmonic(current, 9).amp;
    roShape.set(`${shape.label} — ${shape.note}`, 'in');
    roFund.set(fmt(a1, 3), 'tone');
    roThird.set(a3 > 1e-9 ? `${fmt(a3, 3)}  (1/${fmt(a1 / a3, 0)})` : '0', 'tone');
    roNinth.set(a9 > 1e-9 ? `${fmt(a9, 4)}  (1/${fmt(a1 / a9, 0)})` : '0', 'tone');
    roFall.set(current === 'triangle' ? '1/n²  — fast' : current === 'sine' ? 'nothing to fall off' : '1/n  — slow');
  }

  const pick = scenarios({
    label: 'waveform',
    options: Object.entries(SHAPES).map(([value, c]) => ({ value, label: c.label })),
    value: current,
    onchange: (v) => { current = v; draw(); },
  });

  fig.controls(pick.el);
  fig.readouts(roShape.el, roFund.el, roThird.el, roNinth.el, roFall.el);
  draw();
  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 15 — from a comb of lines to a continuous curve.

   The step from Fourier series to Fourier transform, which is normally
   a page of algebra and is really just this: stop repeating the pulse.
   ------------------------------------------------------------------ */

export function seriesToTransform() {
  const fig = figure({
    n: 15, title: 'Stop repeating, and the lines fill in', tag: 'interactive', domains: ['t', 'w'],
    aria: 'Upper panel: a train of identical pulses whose spacing grows with the slider. Lower panel: their spectral lines, which crowd closer together as the gap widens, under a fixed dashed envelope.',
    caption: 'The dashed envelope never moves. Widening the gap between pulses does not change <b>which</b> frequencies matter — that is set by the pulse\'s own width — it only changes <b>how finely</b> the frequency axis is sampled. Push the gap to infinity, and the comb becomes the curve it was always hanging from. That curve is the <b>Fourier transform</b>.',
  });

  const W = 0.001;                       // pulse width, fixed at 1 ms
  const svgA = fig.svg('0 0 720 140', 'A train of 1 ms pulses with adjustable spacing.');
  const scA = scope(svgA, {
    w: 720, h: 140, pad: { l: 52, r: 18, t: 24, b: 28 },
    x: { min: 0, max: 60, step: 10, title: 'time (ms)', decimals: 0 },
    y: { min: -0.2, max: 1.35, ticks: [0, 1], title: 'x(t)', decimals: 0 },
  });
  svgA.appendChild(note(52, 14, 'THE PULSE TRAIN — every pulse is 1 ms wide, always', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  scA.hline(0, { color: 'var(--grid-major)', dash: null });
  const trainPath = scA.path({ color: 'var(--in)', width: 2 });

  const svgB = fig.svg('0 0 720 230', 'The spectral lines of the pulse train under a fixed sinc envelope.');
  const scB = scope(svgB, {
    w: 720, h: 230, pad: { l: 52, r: 18, t: 24, b: 34 },
    x: { min: 0, max: 3000, step: 500, title: 'frequency (Hz)', decimals: 0 },
    y: { min: 0, max: 1.15, ticks: [0, 0.5, 1], title: 'amplitude (scaled)', decimals: 1 },
  });
  svgB.appendChild(note(52, 14, 'ITS LINES — and the envelope they always hang from', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  {
    const ef = [], ea = [];
    for (let f = 0; f <= 3000; f += 5) { ef.push(f); ea.push(Math.abs(L.sinc(f * W))); }
    scB.path({ color: 'var(--sys)', width: 1.6, dash: '5 4' }).set(ef, ea);
  }
  scB.vline(1000, { color: 'var(--ink-3)', dash: '2 4', label: 'first null at 1/W = 1 kHz' });
  const combLines = scB.stems({ color: 'var(--tone)', width: 2, dot: 2.6 });

  const roT = readout('gap between pulses', '—', 'in');
  const roSpace = readout('line spacing = 1/T', '—', 'tone');
  const roCount = readout('lines below 3 kHz', '—', 'tone');

  const N = 900;
  const ts = Array.from({ length: N }, (_, i) => (i * 0.06) / (N - 1));
  const tsMs = ts.map((t) => t * 1000);

  function update(Tms) {
    const T = Tms / 1000;
    trainPath.set(tsMs, ts.map((t) => (((t % T) + T) % T < W ? 1 : 0)));

    const fs = [], amps = [];
    for (let k = 1; k * (1 / T) <= 3000; k++) {
      const f = k / T;
      fs.push(f); amps.push(Math.abs(L.sinc(f * W)));
    }
    combLines.set(fs, amps);

    roT.set(`${fmt(Tms, 1)} ms`, 'in');
    roSpace.set(`${fmt(1 / T, 1)} Hz`, 'tone');
    roCount.set(`${fs.length}`, 'tone');
  }

  const k = knob({
    id: 'fig15-T', label: 'repeat every', min: 2, max: 60, step: 0.5, value: 4,
    format: (v) => `${fmt(v, 1)} ms`,
    oninput: update,
  });

  fig.controls(k.el);
  fig.readouts(roT.el, roSpace.el, roCount.el);
  update(4);
  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 16 — the seesaw. Brief in time, wide in frequency.
   ------------------------------------------------------------------ */

export function uncertaintyFig() {
  const fig = figure({
    n: 16, title: 'Brief, or pure — never both', tag: 'interactive', domains: ['t', 'w'],
    aria: 'Left: a rectangular pulse whose width is set by a slider. Right: its spectrum, which gets wider as the pulse gets narrower.',
    caption: 'The product of the two widths is pinned. This is the reason a very short radio pulse hogs a wide band, why a percussive click on a recording is impossible to notch out cleanly, and — turned around in Part 8 — why a filter that cuts sharply in frequency must ring for a long time in time. <b>The same seesaw, in every part from here on.</b>',
  });

  const svgA = fig.svg('0 0 720 150', 'A rectangular pulse of adjustable width.');
  const scA = scope(svgA, {
    w: 720, h: 150, pad: { l: 52, r: 18, t: 24, b: 28 },
    x: { min: -12, max: 12, step: 4, title: 'time (ms)', decimals: 0 },
    y: { min: -0.2, max: 1.35, ticks: [0, 1], title: 'x(t)', decimals: 0 },
  });
  svgA.appendChild(note(52, 14, 'IN TIME — narrow is good', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  scA.hline(0, { color: 'var(--grid-major)', dash: null });
  const pulsePath = scA.path({ color: 'var(--in)', width: 2.4 });
  const widthBand = scA.band(-0.5, 0.5, { color: 'var(--in-wash)' });

  const svgB = fig.svg('0 0 720 220', 'The spectrum of the pulse, whose width grows as the pulse narrows.');
  const scB = scope(svgB, {
    w: 720, h: 220, pad: { l: 52, r: 18, t: 24, b: 34 },
    x: { min: -4000, max: 4000, step: 1000, title: 'frequency (Hz)', decimals: 0 },
    y: { min: -0.3, max: 1.15, ticks: [0, 0.5, 1], title: 'X(f), scaled', decimals: 1 },
  });
  svgB.appendChild(note(52, 14, 'IN FREQUENCY — narrow is also good, and you cannot have both', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  scB.hline(0, { color: 'var(--grid-major)', dash: null });
  const specPath = scB.path({ color: 'var(--tone)', width: 2.2 });
  const specBand = scB.band(-1000, 1000, { color: 'var(--tone-wash)' });

  const roW = readout('pulse width W', '—', 'in');
  const roB = readout('spectrum reaches to 1/W', '—', 'tone');
  const roProd = readout('W × bandwidth', '1.00', 'sys');

  const tsm = Array.from(L.linspace(-12, 12, 700));
  const fsm = Array.from(L.linspace(-4000, 4000, 900));

  function update(Wms) {
    const W = Wms / 1000;
    pulsePath.set(tsm, tsm.map((t) => (Math.abs(t) <= Wms / 2 ? 1 : 0)));
    widthBand.set(-Wms / 2, Wms / 2);
    specPath.set(fsm, fsm.map((f) => L.sinc(f * W)));
    specBand.set(-1 / W, 1 / W);
    roW.set(`${fmt(Wms, 2)} ms`, 'in');
    roB.set(`± ${fmt(1 / W, 0)} Hz`, 'tone');
    roProd.set(fmt(W * (1 / W), 2), 'sys');
  }

  const k = knob({
    id: 'fig16-w', label: 'pulse width', min: 0.3, max: 8, step: 0.05, value: 1,
    format: (v) => `${fmt(v, 2)} ms`,
    oninput: update,
  });

  fig.controls(k.el);
  fig.readouts(roW.el, roB.el, roProd.el);
  update(1);
  return fig.root;
}
