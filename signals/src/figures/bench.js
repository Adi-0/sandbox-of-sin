/*
 * The Bench — everything in the guide, with the guard rails removed.
 *
 * This is deliberately the one place that breaks the knob rule. Every
 * figure in the parts has exactly one control and one lesson; here you
 * get the whole instrument, because the lesson at this point is that
 * all of it was one instrument all along.
 *
 * Drag a cross or a circle and four views move together: the map, the
 * frequency response, the impulse and step responses, and the guide's
 * 100 Hz square wave going through. Nothing is precomputed.
 */

import { h, s, knob, scenarios, readout, fmt, sgn, svgPoint } from '../lib/dom.js';
import { scope, poleGlyph, zeroGlyph } from '../lib/plot.js';
import { listen, EAR, render } from '../lib/audio.js';
import * as L from '../lib/lti.js';

/* A point is stored once; if im > 0 it stands for a conjugate pair. */
const P = (re, im = 0) => ({ re, im });

const PRESETS = {
  room:     { label: 'The room',   poles: [P(-1000)], zeros: [] },
  resonant: { label: 'Resonant',   poles: [P(-200, 980)], zeros: [] },
  bandpass: { label: 'Bandpass',   poles: [P(-125, 992)], zeros: [P(0)] },
  notch:    { label: 'Notch',      poles: [P(-250, 968)], zeros: [P(0, 1000)] },
  unstable: { label: 'Unstable',   poles: [P(120, 900)], zeros: [] },
};

const SPAN = 2600;                                  // rad/s, half-width of the map

export function bench() {
  const root = h('div', { class: 'benchwrap' });

  let poles = PRESETS.room.poles.map((p) => ({ ...p }));
  let zeros = [];
  let sel = { kind: 'pole', i: 0 };

  /* ---------------- the four views ---------------- */

  const grid = h('div', { class: 'bench' });

  const cell = (label, right) => h('div', { class: 'bench__cell' },
    h('div', { class: 'bench__label' }, h('span', { text: label }),
      right ? h('span', { class: 'right', text: right }) : null));

  const mk = (viewBox, aria) => s('svg', {
    viewBox, role: 'img', 'aria-label': aria, preserveAspectRatio: 'xMidYMid meet',
  });

  const cMap = cell('s — the map', 'drag a point');
  const svgMap = mk('0 0 380 330', 'A map of the s-plane showing the draggable poles and zeros of the system being built.');
  cMap.appendChild(svgMap);

  const cBode = cell('ω — frequency response', 'gain normalised to its own peak');
  const svgBode = mk('0 0 380 330', 'The gain and phase of the system against frequency.');
  cBode.appendChild(svgBode);

  const cTime = cell('t — impulse and step response', 'each scaled to fit');
  const svgTime = mk('0 0 380 330', 'The impulse response and step response of the system.');
  cTime.appendChild(svgTime);

  const cSq = cell('t — the 100 Hz square wave through it', 'output scaled to fit');
  const svgSq = mk('0 0 380 330', 'The guide\'s 100 hertz square wave and the system\'s output.');
  cSq.appendChild(svgSq);

  grid.append(cMap, cBode, cTime, cSq);

  /* ---------------- static scaffolding ---------------- */

  const scMap = scope(svgMap, {
    w: 380, h: 330, pad: { l: 50, r: 20, t: 22, b: 40 },
    x: { min: -SPAN, max: SPAN * 0.45, step: 1000, title: 'σ  (1/s)', decimals: 0 },
    y: { min: -SPAN * 0.8, max: SPAN * 0.8, step: 1000, title: 'jω  (rad/s)', decimals: 0 },
  });
  scMap.crosshair();
  scMap.band(0, SPAN * 0.45, { color: 'var(--out-wash)' });
  scMap.text(60, SPAN * 0.72, 'unstable', { color: 'var(--bad)', size: 9.5 });
  scMap.text(-SPAN * 0.97, SPAN * 0.72, '× pole   ○ zero', { color: 'var(--ink-3)', size: 9.5 });
  const glyphLayer = s('g', { class: 'bench__grab' });
  scMap.layer.appendChild(glyphLayer);

  const scMag = scope(svgBode, {
    w: 380, h: 175, pad: { l: 50, r: 18, t: 16, b: 24 },
    x: { min: 10, max: 100000, log: true },
    y: { min: -70, max: 14, step: 20, title: 'gain (dB)', decimals: 0 },
    xLabels: false,
  });
  const magPath = scMag.path({ color: 'var(--sys)', width: 2.3 });

  const svgPh = mk('0 0 380 150', 'The phase response of the system against frequency.');
  cBode.appendChild(svgPh);
  const scPhase = scope(svgPh, {
    w: 380, h: 150, pad: { l: 50, r: 18, t: 14, b: 34 },
    x: { min: 10, max: 100000, log: true, title: 'ω (rad/s)' },
    y: { min: -560, max: 200, step: 180, title: 'phase (°)', decimals: 0 },
  });
  const phPath = scPhase.path({ color: 'var(--sys)', width: 2 });

  const scImp = scope(svgTime, {
    w: 380, h: 175, pad: { l: 50, r: 18, t: 16, b: 24 },
    x: { min: 0, max: 40, step: 10, decimals: 0 },
    y: { min: -1.25, max: 1.25, ticks: [-1, 0, 1], title: 'h(t)', decimals: 0 },
    xLabels: false,
  });
  scImp.hline(0, { color: 'var(--grid-major)', dash: null });
  const impPath = scImp.path({ color: 'var(--sys)', width: 2.2 });

  const svgStep = mk('0 0 380 150', 'The step response of the system.');
  cTime.appendChild(svgStep);
  const scStep = scope(svgStep, {
    w: 380, h: 150, pad: { l: 50, r: 18, t: 14, b: 34 },
    x: { min: 0, max: 40, step: 10, title: 'time (ms)', decimals: 0 },
    y: { min: -0.4, max: 1.6, ticks: [0, 1], title: 'step', decimals: 0 },
  });
  scStep.hline(0, { color: 'var(--grid-major)', dash: null });
  const stepPath = scStep.path({ color: 'var(--out)', width: 2.2 });

  const scSq = scope(svgSq, {
    w: 380, h: 330, pad: { l: 50, r: 18, t: 22, b: 40 },
    x: { min: 0, max: 30, step: 5, title: 'time (ms)', decimals: 0 },
    y: { min: -1.5, max: 1.5, ticks: [-1, 0, 1], title: 'amplitude', decimals: 0 },
  });
  scSq.hline(0, { color: 'var(--grid-major)', dash: null });
  const sqIn = scSq.path({ color: 'var(--in)', width: 1.7 });
  const sqOut = scSq.path({ color: 'var(--out)', width: 2.4 });
  {
    const t = Array.from({ length: 900 }, (_, i) => (i * 30) / 899);
    sqIn.set(t, t.map((ms) => L.square(ms / 1000, 100)));
  }

  /* ---------------- readouts ---------------- */

  const roOrder = readout('order', '—', 'sys');
  const roStable = readout('stability', '—', 'ok');
  const roSel = readout('selected', '—', 'sys');
  const roPeak = readout('peak gain at', '—', 'sys');
  const roDC = readout('DC gain', '—', 'sys');

  /* ---------------- the model ---------------- */

  const expand = (list) => list.flatMap((p) => (p.im > 1e-9 ? [L.C(p.re, p.im), L.C(p.re, -p.im)] : [p.re]));

  let sys = null, gain = 1;

  const wsBode = Array.from(L.logspace(10, 100000, 420));

  function rebuild() {
    sys = L.zpk(expand(zeros), expand(poles), 1);

    const mags = wsBode.map((w) => L.cabs(L.freqResp(sys, w)));
    let peak = 0, peakIdx = 0;
    mags.forEach((m, i) => { if (m > peak) { peak = m; peakIdx = i; } });
    const peakAt = wsBode[peakIdx];
    const interior = peakIdx > 2 && peakIdx < wsBode.length - 3;
    gain = peak > 1e-12 ? 1 / peak : 1;
    const shown = { ...sys, b: sys.b.map((c) => c * gain) };

    magPath.set(wsBode, mags.map((m) => L.dB(m * gain)));
    phPath.set(wsBode, L.bode(sys, Float64Array.from(wsBode)).phase);

    const stable = L.isStable(sys);
    const NT = 700, DT = 0.04 / (NT - 1);
    const tms = Array.from({ length: NT }, (_, i) => i * DT * 1000);

    const imp = L.impulseResponse(shown, DT, NT).h;
    let ip = 0; for (const v of imp) ip = Math.max(ip, Math.abs(v));
    impPath.set(tms, Array.from(imp, (v) => (ip > 1e-12 ? v / ip : 0)));

    const st = L.stepResponse(shown, DT, NT);
    let sp = 0; for (const v of st) sp = Math.max(sp, Math.abs(v));
    stepPath.set(tms, Array.from(st, (v) => (sp > 1e-12 ? v / Math.max(sp, 1e-9) : 0)));

    const NS = 900, DS = 0.03 / (NS - 1);
    const sq = L.lsim(shown, (t) => L.square(t, 100), DS, NS);
    let qp = 0; for (const v of sq) qp = Math.max(qp, Math.abs(v));
    sqOut.set(Array.from({ length: NS }, (_, i) => i * DS * 1000),
              Array.from(sq, (v) => (qp > 1e-12 ? v / qp : 0)));

    drawGlyphs();

    const dc = sys.a[0] === 0 ? Infinity : (sys.b[0] * gain) / sys.a[0];
    roOrder.set(`${expand(poles).length} poles, ${expand(zeros).length} zeros`, 'sys');
    roStable.set(stable ? 'stable — it settles' : 'unstable — it runs away', stable ? 'ok' : 'bad');
    roPeak.set(interior ? `${fmt(peakAt, 0)} rad/s = ${fmt(peakAt / L.TAU, 0)} Hz` : 'no resonance — it just rolls off', 'sys');
    roDC.set(isFinite(dc) ? fmt(Math.abs(dc), 3) : '∞', 'sys');
    const cur = (sel.kind === 'pole' ? poles : zeros)[sel.i];
    roSel.set(cur ? `${sel.kind} at σ ${sgn(cur.re, 0)}, ω ${sgn(cur.im, 0)}` : 'none', 'sys');
    if (cur) { kSigma.set(cur.re); kOmega.set(cur.im); }
  }

  function drawGlyphs() {
    while (glyphLayer.firstChild) glyphLayer.removeChild(glyphLayer.firstChild);
    const add = (list, kind) => list.forEach((p, i) => {
      const on = sel.kind === kind && sel.i === i;
      const col = p.re > 0 ? 'var(--bad)' : 'var(--sys)';
      for (const sign of p.im > 1e-9 ? [1, -1] : [1]) {
        const g = kind === 'pole'
          ? poleGlyph(scMap.X(p.re), scMap.Y(sign * p.im), { color: col, r: on ? 9 : 7, width: on ? 3 : 2.2 })
          : zeroGlyph(scMap.X(p.re), scMap.Y(sign * p.im), { color: col, r: on ? 8 : 6, width: on ? 3 : 2.2 });
        glyphLayer.appendChild(g);
      }
    });
    add(poles, 'pole');
    add(zeros, 'zero');
  }

  /* ---------------- dragging and selecting ---------------- */

  function nearest(pt) {
    let best = null, bestD = 26;
    const scan = (list, kind) => list.forEach((p, i) => {
      for (const sign of p.im > 1e-9 ? [1, -1] : [1]) {
        const d = Math.hypot(pt.x - scMap.X(p.re), pt.y - scMap.Y(sign * p.im));
        if (d < bestD) { bestD = d; best = { kind, i }; }
      }
    });
    scan(poles, 'pole'); scan(zeros, 'zero');
    return best;
  }


  /* A transfer function with more zeros than poles is not a system — it
     differentiates without limit, and its response to a step is an
     impulse of infinite height. Rather than let the bench build one and
     then produce nonsense, a zero that would break the rule is held on
     the real axis (one zero instead of a conjugate pair). */
  const count = (list) => list.reduce((n, q) => n + (q.im > 1e-9 ? 2 : 1), 0);

  function setSelected(re, im) {
    const list = sel.kind === 'pole' ? poles : zeros;
    const p = list[sel.i];
    if (!p) return;
    if (sel.kind === 'zero' && im > 1e-9) {
      const others = count(zeros) - (p.im > 1e-9 ? 2 : 1);
      if (others + 2 > count(poles)) im = 0;
    }
    p.re = re; p.im = im;
    rebuild();
  }

  let dragging = false;
  svgMap.style.touchAction = 'none';
  svgMap.addEventListener('pointerdown', (e) => {
    const hit = nearest(svgPoint(svgMap, e));
    if (!hit) return;
    sel = hit; dragging = true;
    svgMap.setPointerCapture(e.pointerId);
    rebuild();
    e.preventDefault();
  });
  svgMap.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const pt = svgPoint(svgMap, e);
    let im = L.clamp(Math.abs(scMap.invY(pt.y)), 0, SPAN * 0.8);
    if (im < 90) im = 0;                         // snap onto the real axis
    setSelected(L.clamp(scMap.invX(pt.x), -SPAN, SPAN * 0.45), im);
    e.preventDefault();
  });
  const stop = () => { dragging = false; };
  svgMap.addEventListener('pointerup', stop);
  svgMap.addEventListener('pointercancel', stop);

  /* ---------------- controls ---------------- */

  const kSigma = knob({
    id: 'bench-sigma', label: 'σ of the selected point', min: -SPAN, max: SPAN * 0.45, step: 10, value: -1000,
    format: (v) => `${sgn(v, 0)} /s`,
    oninput: (v) => { const p = (sel.kind === 'pole' ? poles : zeros)[sel.i]; if (p) setSelected(v, p.im); },
  });
  const kOmega = knob({
    id: 'bench-omega', label: 'ω of the selected point', min: 0, max: SPAN * 0.8, step: 10, value: 0,
    format: (v) => `${v === 0 ? 'real axis' : '± ' + fmt(v, 0) + ' rad/s'}`,
    oninput: (v) => { const p = (sel.kind === 'pole' ? poles : zeros)[sel.i]; if (p) setSelected(p.re, v); },
  });

  /* Scaling every pole and zero by EAR runs the whole scene faster by
     that factor — identical shape, identical ratios, audible pitch. */
  const scaleC = (z, f) => (typeof z === 'number' ? z * f : L.C(z.re * f, z.im * f));

  const btn = (label, onclick, title) =>
    h('button', { type: 'button', class: 'btn', text: label, title: title || label, onclick });

  const bar = h('div', { class: 'bench__bar' },
    scenarios({
      label: 'presets',
      options: Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label })),
      value: 'room',
      onchange: (v) => {
        poles = PRESETS[v].poles.map((p) => ({ ...p }));
        zeros = PRESETS[v].zeros.map((p) => ({ ...p }));
        sel = { kind: 'pole', i: 0 };
        rebuild();
      },
    }).el,
    h('span', { class: 'sep' }),
    btn('+ pole pair', () => { poles.push(P(-400 - poles.length * 180, 900 + poles.length * 260)); sel = { kind: 'pole', i: poles.length - 1 }; rebuild(); }),
    btn('+ zero', () => {
      if (expand(zeros).length + 1 > expand(poles).length) return;
      zeros.push(P(-1200 - zeros.length * 400)); sel = { kind: 'zero', i: zeros.length - 1 }; rebuild();
    }, 'A system cannot have more zeros than poles'),
    btn('remove selected', () => {
      const list = sel.kind === 'pole' ? poles : zeros;
      if (sel.kind === 'pole' && (poles.length <= 1 || count(poles) - (poles[sel.i].im > 1e-9 ? 2 : 1) < count(zeros))) return;
      list.splice(sel.i, 1);
      sel = { kind: 'pole', i: 0 };
      rebuild();
    }),
    h('span', { class: 'sep' }),
    listen({
      label: 'square wave through it', seconds: 1.5,
      build: (sr, n) => {
        if (!L.isStable(sys)) return new Float32Array(n);
        const scaled = L.zpk(expand(zeros).map((z) => scaleC(z, EAR)),
                             expand(poles).map((p) => scaleC(p, EAR)), 1);
        const y = L.lsim(scaled, (t) => L.square(t, 100 * EAR), 1 / sr, n);
        let pk = 0; for (const v of y) pk = Math.max(pk, Math.abs(v));
        const out = new Float32Array(n);
        for (let i = 0; i < n; i++) out[i] = (y[i] / (pk || 1)) * 0.6;
        return out;
      },
    }),
    h('span', { class: 'bench__hint', text: 'drag a × or ○ on the map' })
  );

  const readouts = h('div', { class: 'readouts', style: 'border:1px solid var(--rule);border-radius:2px;margin-top:.75rem' },
    roOrder.el, roStable.el, roSel.el, roPeak.el, roDC.el);

  root.append(bar, grid, h('div', { class: 'bench__bar' }, kSigma.el, kOmega.el), readouts);
  rebuild();
  return root;
}
