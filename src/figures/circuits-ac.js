/* ==========================================================================
   figures/circuits-ac.js — Plates 32 to 36, the AC half.

   Plate 35 is the module's payoff: the power triangle is the 3-4-5 triangle
   from Mathematics Part 1, scaled by 400.
   ========================================================================== */

import { svg, el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed, degv } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;

/* ==========================================================================
   Plate 32 — peak, average and RMS, and how the ratios move with shape
   One knob: the waveform. Lesson: the √2 belongs to sinusoids and nothing else.
   ========================================================================== */

const SHAPES = {
  sine: {
    label: "sine", f: (t) => Math.sin(2 * Math.PI * t),
    rms: "Vm / √2 = 0.707 Vm", avg: "2Vm / π = 0.637 Vm",
    note: "The familiar case, and the only one the √2 belongs to.",
  },
  square: {
    label: "square", f: (t) => (t % 1 < 0.5 ? 1 : -1),
    rms: "Vm — the same as the peak", avg: "Vm",
    note: "It sits at full amplitude the whole time, so its RMS <b>is</b> its peak. Using 0.707 here is wrong by 41%.",
  },
  triangle: {
    label: "triangle", f: (t) => { const u = (t % 1) * 4; return u < 1 ? u : u < 3 ? 2 - u : u - 4; },
    rms: "Vm / √3 = 0.577 Vm", avg: "Vm / 2",
    note: "It spends most of the cycle well below the peak, so its RMS is lower than a sine's.",
  },
  halfwave: {
    label: "half-wave", f: (t) => Math.max(0, Math.sin(2 * Math.PI * t)),
    rms: "Vm / 2 = 0.500 Vm", avg: "Vm / π = 0.318 Vm",
    note: "Half the cycle is missing, so both figures halve against a full sine. This is what one rectifier diode produces.",
  },
};

function waveformAnatomy() {
  const VM = 170;
  const p = new Plot({
    w: 620, h: 300, xr: [0, 2.05], yr: [-215, 215],
    pad: { l: 54, r: 90, t: 18, b: 34 },
    label: "One waveform over two cycles, with horizontal markers for its peak, " +
           "its RMS value and its rectified average, so the three can be compared " +
           "as shapes change.",
  });
  p.grid({ xStep: 0.25, yStep: 50 });
  p.axes({
    xStep: 0.5, yStep: 100, xLabel: "cycles",
    xFmt: (v) => (v === 0 ? "" : num(v, 1)), yFmt: (v) => (v === 0 ? "" : num(v, 0)),
  });

  const wave = p.param(() => [NaN, NaN], [0, 1], { color: "q-y", width: 2.75 });
  const mk = (color, dash) => ({
    line: p.line(0, 0, 2.05, 0, { color, width: 1.5, dash }),
    text: p.text(2.06, 0, "", { color, size: 11, anchor: "start", bg: true }),
  });
  const peak = mk("q-x", "6 4");
  const rms = mk("q-r", null);
  const avg = mk("muted", "3 4");

  const rdPeak = readout({ key: "peak", value: "", tone: "x" });
  const rdPP = readout({ key: "peak-to-peak", value: "" });
  const rdRms = readout({ key: "RMS", value: "", tone: "r" });
  const rdAvg = readout({ key: "rectified average", value: "" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(key) {
    const sh = SHAPES[key];
    // RMS and average are integrated numerically, so the readouts cannot drift
    // away from the curve actually drawn
    let sq = 0, ab = 0;
    const N = 4000;
    for (let i = 0; i < N; i++) {
      const v = sh.f((i + 0.5) / N);
      sq += v * v; ab += Math.abs(v);
    }
    const rmsV = VM * Math.sqrt(sq / N);
    const avgV = VM * (ab / N);

    const pts = [];
    for (let i = 0; i <= 700; i++) {
      const t = (i / 700) * 2.05;
      pts.push(`${p.x(t).toFixed(2)} ${p.y(VM * sh.f(t)).toFixed(2)}`);
    }
    wave.setAttribute("d", "M " + pts.join(" L "));

    const place = ({ line, text }, v, label) => {
      line.setAttribute("y1", p.y(v)); line.setAttribute("y2", p.y(v));
      for (const t of text.childNodes) { t.setAttribute("y", p.y(v) + 4); t.textContent = label; }
    };
    place(peak, VM, "peak 170");
    place(rms, rmsV, `RMS ${fixed(rmsV, 0)}`);
    place(avg, avgV, `avg ${fixed(avgV, 0)}`);

    rdPeak.set(`${VM} V`);
    rdPP.set(`${VM * 2} V`);
    rdRms.set(`${fixed(rmsV, 1)} V  ·  ${sh.rms}`);
    rdAvg.set(`${fixed(avgV, 1)} V  ·  ${sh.avg}`);
    rdNote.set(sh.note);
  }

  const pick = scenarios({
    label: "waveform",
    options: Object.entries(SHAPES).map(([id, v]) => ({ id, label: v.label })),
    value: "sine",
    onChange: draw,
  });
  draw("sine");

  return plate({
    no: 32,
    title: "Peak, average and RMS are three different numbers",
    tag: "interactive",
    label: "Waveform anatomy",
    stage: p.root,
    controls: el("div.plate-controls", null, pick.root),
    readouts: readouts(rdPeak, rdPP, rdRms, rdAvg, rdNote),
    caption:
      "The peak line never moves — every shape here has the same 170 V peak. " +
      "<b>The RMS line moves a long way.</b> A square wave's RMS sits right on the " +
      "peak; a triangle's drops to 0.577 of it. Applying the sinusoid's 0.707 to " +
      "a square wave understates its heating by 41%, and that substitution is a " +
      "standard exam trap.",
  });
}

/* ==========================================================================
   Plate 33 — RMS is the DC that heats the same
   ========================================================================== */

function rmsHeating() {
  const R = 10;
  const p = new Plot({
    w: 620, h: 300, xr: [0, 2.05], yr: [-1.15, 3.4],
    pad: { l: 58, r: 26, t: 18, b: 34 },
    label: "An AC voltage and the instantaneous power it produces in a resistor. " +
           "The power curve never goes negative and its average equals the power " +
           "a steady DC voltage of the RMS value would produce.",
  });
  p.grid({ xStep: 0.25, yStep: 0.5 });
  p.axes({
    xStep: 0.5, yStep: 1, xLabel: "cycles",
    xFmt: (v) => (v === 0 ? "" : num(v, 1)), yFmt: (v) => (v === 0 ? "" : num(v, 1)),
  });

  const vCurve = p.curve(() => NaN, { color: "q-x", width: 2 });
  const pCurve = p.curve(() => NaN, { color: "q-y", width: 2.5 });
  const shade = p.area(() => 0, 0, 2.05, { color: "q-y-soft" });
  const mean = p.line(0, 0, 2.05, 0, { color: "q-r", width: 2, dash: "6 4" });
  const meanLab = p.text(1.02, 0, "", { color: "q-r", size: 11.5, weight: 500, bg: true, dy: -8 });
  p.text(0.04, -0.85, "v(t), normalised", { color: "q-x", size: 11, anchor: "start", bg: true });
  p.text(0.04, 3.15, "p(t) = v²/R — never negative", { color: "q-y", size: 11, anchor: "start", bg: true });

  const rdVm = readout({ key: "peak voltage", value: "", tone: "x" });
  const rdRms = readout({ key: "RMS voltage", value: "", tone: "r" });
  const rdPpk = readout({ key: "peak power", value: "", tone: "y" });
  const rdPavg = readout({ key: "average power", value: "", tone: "r" });
  const rdDc = readout({ key: "the DC that would match it", value: "" });
  rdDc.root.classList.add("wide");

  function draw(Vm) {
    const vrms = Vm / Math.SQRT2;
    const ppk = (Vm * Vm) / R;
    const pavg = (vrms * vrms) / R;
    const scale = 3.0 / Math.max(ppk, 1e-6);        // plot power normalised to the frame

    const vOf = (t) => Math.sin(2 * Math.PI * t);
    const pOf = (t) => (Vm * vOf(t)) ** 2 / R * scale;

    p.clear("shade");
    p.area(pOf, 0, 2.05, { color: "q-y-soft" });
    vCurve.setAttribute("d", pathOf(p, (t) => vOf(t) * 0.85, 0, 2.05));
    pCurve.setAttribute("d", pathOf(p, pOf, 0, 2.05));

    const my = pavg * scale;
    mean.setAttribute("y1", p.y(my)); mean.setAttribute("y2", p.y(my));
    for (const t of meanLab.childNodes) {
      t.setAttribute("y", p.y(my) - 8);
      t.textContent = `average power ${fixed(pavg, 1)} W`;
    }

    rdVm.set(`${fixed(Vm, 0)} V`);
    rdRms.set(`${fixed(vrms, 1)} V`);
    rdPpk.set(`${fixed(ppk, 1)} W`);
    rdPavg.set(`${fixed(pavg, 1)} W`);
    rdDc.set(
      `${fixed(vrms, 1)} V of DC across the same ${R} Ω gives ` +
      `${fixed((vrms * vrms) / R, 1)} W — identical, which is the definition of RMS`
    );
  }

  const k = knob({
    label: "peak voltage", min: 20, max: 200, step: 5, value: 170,
    format: (v) => `${num(v, 0)} V`,
    onInput: draw,
  });
  draw(170);

  return plate({
    no: 33,
    title: "RMS is the DC that heats the same",
    tag: "interactive",
    label: "Instantaneous power and its average",
    stage: p.root,
    controls: el("div.plate-controls", null, k.root),
    readouts: readouts(rdVm, rdRms, rdPpk, rdPavg, rdDc),
    caption:
      "The power curve touches zero twice per cycle but <b>never goes below it</b> — " +
      "squaring destroys the sign, which is why a resistor does not care which way " +
      "the current is going. Its average sits at exactly half the peak power, and " +
      "the DC voltage that would produce that same average is the RMS value. " +
      "<b>RMS is not a mathematical convenience; it is the answer to a physical " +
      "question.</b>",
  });
}

function pathOf(p, f, a, b, n = 600) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = a + (i / n) * (b - a);
    pts.push(`${p.x(t).toFixed(2)} ${p.y(f(t)).toFixed(2)}`);
  }
  return "M " + pts.join(" L ");
}

/* ==========================================================================
   Plate 34 — the impedance triangle, and what frequency does to it
   ========================================================================== */

function impedanceTriangle() {
  const R = 3;
  const p = new Plot({
    w: 460, h: 380, xr: [-1, 8], yr: [-4.5, 6],
    pad: { l: 36, r: 24, t: 18, b: 30 },
    label: "The impedance triangle on the complex plane: resistance along the " +
           "real axis, reactance vertical, and the impedance itself as the " +
           "hypotenuse. Inductive reactance points up, capacitive down.",
  });
  p.equalize();
  p.grid({ xStep: 1, yStep: 1 });
  p.axes({
    xStep: 2, yStep: 2, xLabel: "R (Ω)", yLabel: "X (Ω)",
    xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)),
  });

  const legR = p.line(0, 0, R, 0, { color: "q-x", width: 4 });
  const legX = p.line(R, 0, R, 4, { color: "q-y", width: 4 });
  const hyp = p.vector(0, 0, R, 4, { color: "q-r", width: 2.75 });
  const arc = p.angleArc(0, 0, 0, Math.atan2(4, 3), 32, { color: "muted", fill: "q-r-soft", label: null });
  const zLab = p.text(R, 4, "", { color: "q-r", size: 12.5, weight: 500, bg: true, anchor: "start" });
  p.text(1.5, 0, "R = 3 Ω", { color: "q-x", size: 12, dy: 26, bg: true });
  const xLab = p.text(R, 2, "", { color: "q-y", size: 12, anchor: "start", dx: 10, bg: true });

  const rdF = readout({ key: "frequency", value: "" });
  const rdX = readout({ key: "reactance X", value: "", tone: "y" });
  const rdZ = readout({ key: "|Z|", value: "", tone: "r" });
  const rdAng = readout({ key: "angle", value: "" });
  const rdI = readout({ key: "current from 100 V", value: "" });
  rdI.root.classList.add("wide");

  /* L chosen so that the cast lands exactly at 60 Hz: X = 4 Ω */
  const L = 4 / (2 * Math.PI * 60);

  function draw(f) {
    const X = 2 * Math.PI * f * L;
    const Z = Math.hypot(R, X);
    const th = Math.atan2(X, R) * 180 / Math.PI;

    legX.setAttribute("y2", p.y(X));
    hyp.setAttribute("x2", p.x(R)); hyp.setAttribute("y2", p.y(X));
    for (const t of zLab.childNodes) {
      t.setAttribute("x", p.x(R) + 10); t.setAttribute("y", p.y(X) - 6);
      t.textContent = `Z = 3 + j${fixed(X, 2)}`;
    }
    for (const t of xLab.childNodes) {
      t.setAttribute("y", p.y(X / 2) + 4);
      t.textContent = `X = ${fixed(X, 2)} Ω`;
    }
    const steps = 24, pts = [];
    const a = Math.atan2(X, R);
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * a;
      pts.push(`${(p.x(0) + 32 * Math.cos(t)).toFixed(2)} ${(p.y(0) - 32 * Math.sin(t)).toFixed(2)}`);
    }
    arc.firstChild.setAttribute("d", `M ${p.x(0)} ${p.y(0)} L ` + pts.join(" L ") + " Z");

    rdF.set(`${num(f, 0)} Hz`);
    rdX.set(`${fixed(X, 2)} Ω`);
    rdZ.set(`${fixed(Z, 2)} Ω`);
    rdAng.set(`${fixed(th, 2)}° lagging`);
    rdI.set(`100 V ÷ ${fixed(Z, 2)}∠${fixed(th, 2)}° = ${fixed(100 / Z, 2)} A at ${fixed(-th, 2)}°`);
  }

  const k = knob({
    label: "frequency", min: 5, max: 150, step: 1, value: 60,
    format: (v) => `${num(v, 0)} Hz`,
    onInput: draw,
  });
  const jump = scenarios({
    options: [{ id: "60", label: "60 Hz · the cast" }, { id: "15", label: "15 Hz" }, { id: "120", label: "120 Hz" }],
    value: "60",
    onChange: (id) => k.set(Number(id)),
  });
  draw(60);

  return plate({
    no: 34,
    title: "The impedance triangle is the 3-4-5 triangle",
    tag: "interactive",
    label: "Impedance triangle against frequency",
    stage: p.root,
    controls: el("div.plate-controls", null, k.root, jump.root),
    readouts: readouts(rdF, rdX, rdZ, rdAng, rdI),
    caption:
      "At 60 Hz the reactance is exactly 4 Ω and the triangle is the one from " +
      "Mathematics Part 1 — 3, 4, 5, at 53.13°. <b>The resistance never moves; only " +
      "the vertical leg does</b>, because <span class='math'>X_L = \\omega L</span> " +
      "and resistance does not care about frequency. Drop towards 5 Hz and the " +
      "inductor stops mattering, leaving an almost purely resistive 3 Ω at nearly " +
      "0°.",
  });
}

/* ==========================================================================
   Plate 35 — the power triangle, which is the same triangle again
   ========================================================================== */

function powerTriangle() {
  const VS = 100;
  const p = new Plot({
    w: 480, h: 380, xr: [-200, 2600], yr: [-900, 2300],
    pad: { l: 56, r: 26, t: 18, b: 34 },
    label: "The power triangle: real power along the horizontal, reactive power " +
           "vertical, apparent power as the hypotenuse. At the cast's values it " +
           "is 1200 watts, 1600 VAR and 2000 volt-amperes.",
  });
  p.equalize();
  p.grid({ xStep: 200, yStep: 200 });
  p.axes({
    xStep: 800, yStep: 800, xLabel: "P (W)", yLabel: "Q (VAR)",
    xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)),
  });

  const legP = p.line(0, 0, 1200, 0, { color: "q-x", width: 4 });
  const legQ = p.line(1200, 0, 1200, 1600, { color: "q-y", width: 4 });
  const hyp = p.vector(0, 0, 1200, 1600, { color: "q-r", width: 2.75 });
  const arc = p.angleArc(0, 0, 0, Math.atan2(1600, 1200), 34, { color: "muted", fill: "q-r-soft", label: null });
  const pLab = p.text(600, 0, "", { color: "q-x", size: 12, dy: 26, bg: true });
  const qLab = p.text(1200, 800, "", { color: "q-y", size: 12, anchor: "start", dx: 10, bg: true });
  const sLab = p.text(1200, 1600, "", { color: "q-r", size: 12.5, weight: 500, anchor: "start", dx: 10, dy: -6, bg: true });

  const rdTh = readout({ key: "angle θ", value: "" });
  const rdP = readout({ key: "real power P", value: "", tone: "x", sub: " W" });
  const rdQ = readout({ key: "reactive Q", value: "", tone: "y", sub: " VAR" });
  const rdS = readout({ key: "apparent S", value: "", tone: "r", sub: " VA" });
  const rdPf = readout({ key: "power factor", value: "" });
  const rdCheck = readout({ key: "check", value: "" });
  rdCheck.root.classList.add("wide");

  function draw(thDeg) {
    const th = (thDeg * Math.PI) / 180;
    const Z = 5;                                  // magnitude held at the cast's 5 Ω
    const I = VS / Z;
    const S = VS * I;
    const P = S * Math.cos(th), Q = S * Math.sin(th);

    legP.setAttribute("x2", p.x(P));
    legQ.setAttribute("x1", p.x(P)); legQ.setAttribute("x2", p.x(P));
    legQ.setAttribute("y1", p.y(0)); legQ.setAttribute("y2", p.y(Q));
    hyp.setAttribute("x2", p.x(P)); hyp.setAttribute("y2", p.y(Q));

    const relabel = (node, x, y, text, dx = 0, dy = 0) => {
      for (const t of node.childNodes) {
        t.setAttribute("x", p.x(x) + dx); t.setAttribute("y", p.y(y) + dy);
        t.textContent = text;
      }
    };
    relabel(pLab, P / 2, 0, `P = ${fixed(P, 0)} W`, 0, 26);
    relabel(qLab, P, Q / 2, `Q = ${fixed(Q, 0)} VAR`, 10, 4);
    relabel(sLab, P, Q, `S = ${fixed(S, 0)} VA`, 10, -6);

    const steps = 24, pts = [];
    const a = Math.atan2(Q, P);
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * a;
      pts.push(`${(p.x(0) + 34 * Math.cos(t)).toFixed(2)} ${(p.y(0) - 34 * Math.sin(t)).toFixed(2)}`);
    }
    arc.firstChild.setAttribute("d", `M ${p.x(0)} ${p.y(0)} L ` + pts.join(" L ") + " Z");

    rdTh.set(`${fixed(thDeg, 2)}°`);
    rdP.set(fixed(P, 0), " W");
    rdQ.set(fixed(Q, 0), " VAR");
    rdS.set(fixed(S, 0), " VA");
    rdPf.set(`${fixed(Math.cos(th), 3)} ${thDeg > 0.5 ? "lagging" : thDeg < -0.5 ? "leading" : "unity"}`);
    rdCheck.set(
      `${fixed(P, 0)}² + ${fixed(Math.abs(Q), 0)}² = ${fixed(Math.hypot(P, Q), 0)}² ✓` +
      (Math.abs(thDeg - 53.13) < 0.3 ? "  —  and 1200, 1600, 2000 is 400 × the 3-4-5 triangle" : "")
    );
  }

  const k = knob({
    label: "impedance angle", min: -80, max: 80, step: 0.5, value: 53.13,
    format: (v) => `${num(v, 1)}°`,
    onInput: draw,
  });
  const jump = scenarios({
    options: [
      { id: "53.13", label: "the cast" }, { id: "0", label: "resistive" },
      { id: "-53.13", label: "capacitive" }, { id: "80", label: "very inductive" },
    ],
    value: "53.13",
    onChange: (id) => k.set(Number(id)),
  });
  draw(53.13);

  return plate({
    no: 35,
    title: "The power triangle, at 400 times scale",
    tag: "interactive",
    label: "Power triangle",
    stage: p.root,
    controls: el("div.plate-controls", null, k.root, jump.root),
    readouts: readouts(rdTh, rdP, rdQ, rdS, rdPf, rdCheck),
    caption:
      "The hypotenuse never changes length — the source delivers 2000 VA whatever " +
      "the angle, because the cable current depends only on <span class='math'>|Z|</span>. " +
      "What changes is how much of it does work. <b>Swing the angle negative and " +
      "Q flips below the axis: the load is now capacitive and the power factor " +
      "reads leading</b>, at the same numerical value. That is why a power factor " +
      "quoted without a direction is only half an answer.",
  });
}

/* ==========================================================================
   Plate 36 — how the seven parts connect
   ========================================================================== */

const MAP_NODES = {
  1: { x: 106, y: 60, t: "The Two Laws" },
  2: { x: 106, y: 172, t: "Series &\nParallel" },
  3: { x: 106, y: 288, t: "Node & Mesh" },
  4: { x: 330, y: 172, t: "Thévenin &\nNorton" },
  5: { x: 554, y: 60, t: "Waveforms" },
  6: { x: 554, y: 200, t: "Phasors &\nImpedance" },
};
const MAP_LINKS = [
  { a: 1, b: 2, label: "one line of KCL, one of KVL", at: 0.5, dx: 8, anchor: "start" },
  { a: 2, b: 3, label: "when nothing collapses", at: 0.5, dx: 8, anchor: "start" },
  { a: 3, b: 4, label: "solve once, not once per load", at: 0.5, dy: -8 },
  { a: 4, b: 6, label: "still true with complex numbers", at: 0.5, dy: -8 },
  { a: 5, b: 6, label: "RMS is what the phasor stores", at: 0.5, dx: 8, anchor: "start" },
];

function circuitsMap() {
  const W = 680, H = 360, NW = 132, NH = 46;
  const root = svg("svg", {
    viewBox: `0 0 ${W} ${H}`, role: "img",
    "aria-label":
      "A map of the six teaching parts of Circuit Analysis: the two laws lead to " +
      "series and parallel, then to node and mesh analysis, then to Thévenin; " +
      "waveforms and Thévenin both feed phasors and impedance.",
    style: { display: "block", width: "100%", height: "auto" },
  });
  root.appendChild(svg("defs", null, svg("marker", {
    id: "cmap-head", viewBox: "0 0 10 10", refX: 9, refY: 5,
    markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse", markerUnits: "userSpaceOnUse",
  }, svg("path", { d: "M 0 1 L 9 5 L 0 9 z", fill: V("q-r") }))));

  const exit = (n, dx, dy) => {
    const t = Math.min(
      Math.abs(dx) < 1e-6 ? Infinity : (NW / 2 + 5) / Math.abs(dx),
      Math.abs(dy) < 1e-6 ? Infinity : (NH / 2 + 5) / Math.abs(dy)
    );
    return [n.x + dx * t, n.y + dy * t];
  };

  for (const { a, b, label, at, dx = 0, dy = 0, anchor = "middle" } of MAP_LINKS) {
    const A = MAP_NODES[a], B = MAP_NODES[b];
    const vx = B.x - A.x, vy = B.y - A.y;
    const [x1, y1] = exit(A, vx, vy), [x2, y2] = exit(B, -vx, -vy);
    root.appendChild(svg("line", {
      x1, y1, x2, y2, stroke: V("q-r"), strokeWidth: 1.5, opacity: 0.75,
      markerEnd: "url(#cmap-head)",
    }));
    const lx = x1 + (x2 - x1) * at + dx, ly = y1 + (y2 - y1) * at + dy + 3;
    for (const halo of [true, false]) {
      root.appendChild(svg("text", {
        class: "lbl", x: lx, y: ly, textAnchor: anchor, fontSize: "10px",
        fill: halo ? "none" : V("muted"),
        stroke: halo ? V("plate") : null, strokeWidth: halo ? 3.5 : null,
        strokeLinejoin: "round", text: label,
      }));
    }
  }

  for (const [n, node] of Object.entries(MAP_NODES)) {
    root.appendChild(svg("rect", {
      x: node.x - NW / 2, y: node.y - NH / 2, width: NW, height: NH, rx: 2,
      fill: V("plate"), stroke: V("ink"), strokeWidth: 1.5,
    }));
    root.appendChild(svg("rect", {
      x: node.x - NW / 2, y: node.y - NH / 2, width: 22, height: NH,
      fill: V("sunk"), stroke: V("ink"), strokeWidth: 1,
    }));
    root.appendChild(svg("text", {
      class: "lbl", x: node.x - NW / 2 + 11, y: node.y + 4, textAnchor: "middle",
      fill: V("muted"), fontSize: "12px", text: n,
    }));
    node.t.split("\n").forEach((line, i, arr) => {
      root.appendChild(svg("text", {
        class: "lbl", x: node.x + 11, y: node.y + 4 + (i - (arr.length - 1) / 2) * 13,
        textAnchor: "middle", fill: V("ink-strong"), fontSize: "11.5px", fontWeight: 500, text: line,
      }));
    });
  }

  return plate({
    no: 36,
    title: "How the six parts connect",
    tag: "reference",
    label: "Map of the Circuit Analysis parts",
    stage: root,
    caption:
      "Read the left column downwards and it is one story: the two laws, then the " +
      "shortcuts they justify, then the method for when the shortcuts fail. " +
      "<b>Everything converges on Part 6</b>, where the whole DC toolkit is reused " +
      "unchanged over complex numbers — which is why the AC half of this module is " +
      "shorter than the DC half despite covering more of the exam.",
  });
}

register("waveformAnatomy", { no: 32, build: waveformAnatomy });
register("rmsHeating", { no: 33, build: rmsHeating });
register("impedanceTriangle", { no: 34, build: impedanceTriangle });
register("powerTriangle", { no: 35, build: powerTriangle });
register("circuitsMap", { no: 36, build: circuitsMap });
