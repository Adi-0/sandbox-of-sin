/* ==========================================================================
   figures/frequency.js — Plates 84 and 85.

   Plate 84 is the substitution itself, seen: a pole sits fixed on the plane
   while jω walks up the imaginary axis, and the gain at each frequency is the
   reciprocal of the distance between them. That geometric reading is what
   makes a Bode plot's shape obvious rather than memorised.

   Plate 85 is the asymptotic sketch — the thing actually worth being able to
   do under time pressure. Straight lines at 0 and −20 dB/decade, meeting at
   the corner, and the true curve 3 dB below the corner.
   ========================================================================== */

import { el, svg, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { fixed, num } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;
const dB = (x) => 20 * Math.log10(x);

/* ==========================================================================
   Plate 84 — why the gain falls

   The pole is at −a. The gain at frequency ω is 1/|jω − (−a)|, which is one
   over the length of the line from the pole to the point jω. Walk jω up the
   axis and that length grows — so the gain falls. Nothing else is going on.
   ========================================================================== */

function poleDistance() {
  const A = 4;                                        // the pole, at −4 krad/s

  const sp = new Plot({
    w: 300, h: 300, xr: [-7.6, 6.4], yr: [-2.0, 12.2],
    pad: { l: 14, r: 14, t: 12, b: 12 },
    label:
      "The s-plane with a pole on the negative real axis and a point moving " +
      "up the imaginary axis, with the straight line between them drawn and " +
      "its length marked.",
  });
  const bp = new Plot({
    w: 300, h: 286, xr: [-1.1, 2.0], yr: [-27.9444, 7],
    pad: { l: 44, r: 16, t: 14, b: 34 },
    label: "The resulting gain in decibels against log frequency.",
  });

  const rdW = readout({ key: "drive frequency", value: "", tone: "y" });
  const rdDist = readout({ key: "distance to pole", value: "", tone: "x" });
  const rdGain = readout({ key: "gain", value: "", tone: "r" });
  const rdDb = readout({ key: "in decibels", value: "", tone: "r" });
  const rdPhase = readout({ key: "phase", value: "", tone: "y" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(w10) {
    const w = w10 / 10;
    sp.clear("curve", "label", "mark", "shade");
    bp.clear("curve", "label", "mark", "shade");

    /* --- the plane ------------------------------------------------------ */
    sp.grid({ xStep: 2, yStep: 2 });
    sp.axes({ xLabel: "σ", yLabel: "jω", xStep: 4, yStep: 4, arrows: true });
    sp.text(-A, -0.85, "✕", { color: "q-y", size: 18, weight: 700 });
    sp.text(-A, -1.75, `pole at −${A}`, { color: "q-y", size: 10, weight: 600 });

    const d = Math.hypot(A, w);
    sp.line(-A, 0, 0, w, { color: "q-r", width: 2.2 });
    sp.dot(0, w, { color: "q-x", r: 5 });
    sp.text(0.35, w, `jω`, { color: "q-x", size: 11, weight: 600, anchor: "start", dy: 4 });
    sp.text((-A + 0) / 2 - 0.35, w / 2 + 0.45, `${fixed(d, 2)}`,
      { color: "q-r", size: 11, weight: 700, anchor: "end", bg: true });

    /* --- the Bode magnitude --------------------------------------------- */
    const g = (lw) => -dB(Math.hypot(A, 10 ** lw) / A);
    bp.grid({ xStep: 0.5, yStep: 10 });
    bp.axes({ xLabel: "log₁₀ ω", yLabel: "gain (dB)", xStep: 1, yStep: 10, arrows: true });

    // the two asymptotes, and the corner where they meet
    const lc = Math.log10(A);
    bp.line(-1.05, 0, lc, 0, { color: "q-x", width: 1.5, dash: "5 4" });
    bp.line(lc, 0, 1.95, -20 * (1.95 - lc), { color: "q-x", width: 1.5, dash: "5 4" });
    bp.line(lc, -29, lc, 3, { color: "grid", width: 1 });
    bp.text(lc, 4.6, `corner ω = ${A}`, { color: "q-x", size: 10, weight: 600 });

    bp.curve(g, { color: "q-y", width: 2.6 });
    const lwNow = Math.log10(Math.max(0.1, w));
    if (w > 0.09) {
      bp.dot(lwNow, g(lwNow), { color: "q-r", r: 5 });
    }

    const gain = A / d;
    const ph = -Math.atan2(w, A) * 180 / Math.PI;

    rdW.set(`${fixed(w, 1)} krad/s`);
    rdDist.set(`${fixed(d, 2)}`, ` = √(${A}² + ${fixed(w, 1)}²)`);
    rdGain.set(fixed(gain, 3), ` = ${A} / ${fixed(d, 2)}`);
    rdDb.set(`${fixed(dB(gain), 1)} dB`);
    rdPhase.set(`${fixed(ph, 1)}°`);
    rdNote.set(
      Math.abs(w - A) < 0.35
        ? `<b>At ω = a the point is level with the pole</b>, so the distance is √2·a — and the gain is 1/√2, which is <b>−3.01 dB</b>. That is where the corner frequency gets its other name, the half-power point: the power is down by a factor of two while the voltage is only down by √2. The phase is exactly −45° here, halfway through its total swing.`
        : w < A
          ? `Well below the corner, the distance to the pole is almost exactly <b>a</b> however far up the axis you go, because the vertical leg is small compared with the horizontal one. So the gain barely changes — <b>that flat region in the Bode plot is a statement about a triangle</b>, not a separate fact to remember.`
          : `Well above the corner the vertical leg dominates, so the distance is very nearly <b>ω itself</b> and the gain is a/ω — inversely proportional to frequency. <b>That is exactly what −20 dB per decade means</b>: ten times the frequency, one tenth the gain.`
    );
  }

  const k = knob({
    label: "drive frequency", min: 0, max: 120, step: 1, value: 40,
    format: (v) => `${fixed(v / 10, 1)} krad/s`,
    onInput: draw,
  });
  draw(40);

  return {
    stage: el("div.duo", null, sp.root, bp.root),
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdW, rdDist, rdGain, rdDb, rdPhase, rdNote),
  };
}

/* ==========================================================================
   Plate 85 — the asymptotic sketch

   Magnitude and phase for the four first-order shapes, with the straight-line
   approximation over the true curve and the three errors that matter marked.
   ========================================================================== */

const SHAPES = {
  lp: {
    name: "Low-pass", slope: -20,
    mag: (w, a) => 1 / Math.hypot(1, w / a),
    ph: (w, a) => -Math.atan2(w / a, 1) * 180 / Math.PI,
    H: "1/(1 + jω/ωc)",
    note: "One pole. <b>Flat, then falling at 20 dB per decade</b>, with the phase sliding from 0° to −90° and passing through −45° exactly at the corner. Almost every real signal path is this, because every real signal path has stray capacitance.",
  },
  hp: {
    name: "High-pass", slope: 20,
    mag: (w, a) => (w / a) / Math.hypot(1, w / a),
    ph: (w, a) => 90 - Math.atan2(w / a, 1) * 180 / Math.PI,
    H: "(jω/ωc)/(1 + jω/ωc)",
    note: "The same pole, plus a <b>zero at the origin</b>. The zero contributes +20 dB/decade everywhere and +90° of phase, so the two combine to a rising slope below the corner and a flat response above it. <b>Poles bend a Bode plot down; zeros bend it up</b> — that is the entire construction rule.",
  },
  int: {
    name: "Integrator", slope: -20,
    mag: (w, a) => a / w,
    ph: () => -90,
    H: "ωc/jω",
    note: "A pole <b>at the origin</b>: no corner at all, just a straight −20 dB/decade line all the way down and a constant −90°. It crosses 0 dB at ω = ωc. This is the shape every control loop is built around, because it is what forces the steady-state error to zero.",
  },
  lead: {
    name: "Pole and zero", slope: 0,
    mag: (w, a) => Math.hypot(1, w / (a / 8)) / Math.hypot(1, w / a) / 8,
    ph: (w, a) => (Math.atan2(w / (a / 8), 1) - Math.atan2(w / a, 1)) * 180 / Math.PI,
    H: "(1 + jω/ω₁)/(1 + jω/ω₂)",
    note: "A zero below a pole. The plot rises at the zero and flattens again at the pole, so the two corners bracket a <b>step</b> in gain rather than a permanent slope. This is the shape of a lead compensator, and it is worth recognising: <b>the slope between two corners is the sum of the slopes each one contributes</b>, which is how any Bode plot is sketched.",
  },
};

function bodeSketch() {
  const WC = 10;                                     // corner at 10 rad/s

  const mp = new Plot({
    w: 620, h: 200, xr: [-1.15, 3.15], yr: [-46, 16],
    pad: { l: 50, r: 20, t: 14, b: 26 },
    label: "Bode magnitude plot in decibels against log frequency, with the " +
           "straight-line asymptotic approximation drawn over the true curve.",
  });
  const pp = new Plot({
    w: 620, h: 148, xr: [-1.15, 3.15], yr: [-69.6774, 108],
    pad: { l: 50, r: 20, t: 12, b: 34 },
    label: "The corresponding phase, in degrees.",
  });

  const rdShape = readout({ key: "shape", value: "" });
  const rdH = readout({ key: "H(jω)", value: "", tone: "x" });
  const rdCorner = readout({ key: "corner", value: "", tone: "r" });
  const rdSlope = readout({ key: "final slope", value: "", tone: "y" });
  const rdErr = readout({ key: "error at the corner", value: "", tone: "bad" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "lp";

  function draw() {
    mp.clear("curve", "label", "mark", "shade");
    pp.clear("curve", "label", "mark", "shade");
    const S = SHAPES[cur];
    const lc = Math.log10(WC);

    /* --- magnitude ------------------------------------------------------ */
    mp.grid({ xStep: 0.5, yStep: 20 });
    mp.axes({ xLabel: "log₁₀ ω", yLabel: "|H| (dB)", xStep: 1, yStep: 20, arrows: true });
    mp.line(-1.1, 0, 3.1, 0, { color: "grid", width: 1 });

    // asymptotes: flat until the corner, then the slope
    if (cur === "int") {
      mp.line(-1.1, -20 * (-1.1 - lc), 3.1, -20 * (3.1 - lc),
        { color: "q-x", width: 1.5, dash: "5 4" });
    } else if (cur === "lead") {
      const lz = Math.log10(WC / 8);
      mp.line(-1.1, dB(1 / 8), lz, dB(1 / 8), { color: "q-x", width: 1.5, dash: "5 4" });
      mp.line(lz, dB(1 / 8), lc, dB(1 / 8) + 20 * (lc - lz), { color: "q-x", width: 1.5, dash: "5 4" });
      mp.line(lc, 0, 3.1, 0, { color: "q-x", width: 1.5, dash: "5 4" });
      mp.line(lz, -44, lz, 8, { color: "grid", width: 1 });
      mp.text(lz, -30, "zero", { color: "q-x", size: 10, weight: 600 });
    } else {
      const lo = S.slope < 0 ? 0 : 20 * (-1.1 - lc);
      mp.line(-1.1, S.slope < 0 ? 0 : 20 * (-1.1 - lc), lc, 0,
        { color: "q-x", width: 1.5, dash: "5 4" });
      mp.line(lc, 0, 3.1, S.slope < 0 ? -20 * (3.1 - lc) : 0,
        { color: "q-x", width: 1.5, dash: "5 4" });
    }
    mp.curve((lw) => Math.max(-45, dB(S.mag(10 ** lw, WC))), { color: "q-y", width: 3 });
    if (cur !== "int") {
      mp.line(lc, -44, lc, 8, { color: "grid", width: 1 });
      mp.text(lc, cur === "lead" ? -30 : 11, cur === "lead" ? "pole" : `ωc = ${WC}`,
        { color: "q-r", size: 10, weight: 600 });
    }


    // the error the straight lines cost, at the corner
    const err = cur === "int" ? 0 : dB(S.mag(WC, WC)) - (cur === "lead" ? 0 : 0);
    if (cur === "lp" || cur === "hp") {
      mp.dot(lc, dB(S.mag(WC, WC)), { color: "q-bad", r: 4.6 });
      mp.text(lc + 0.09, dB(S.mag(WC, WC)) - 7, "−3 dB",
        { color: "q-bad", size: 10.5, weight: 700, anchor: "start" });
    }

    /* --- phase ---------------------------------------------------------- */
    pp.grid({ xStep: 0.5, yStep: 45 });
    pp.axes({ xLabel: "log₁₀ ω", yLabel: "∠H  (°)", xStep: 1, yStep: 90, arrows: true });
    pp.curve((lw) => S.ph(10 ** lw, WC), { color: "q-y", width: 2.6 });
    if (cur !== "int") {
      pp.line(lc, -100, lc, 100, { color: "grid", width: 1 });
      pp.dot(lc, S.ph(WC, WC), { color: "q-r", r: 4.4 });
      pp.text(lc + 0.09, S.ph(WC, WC) + 22, `${fixed(S.ph(WC, WC), 0)}° at the corner`,
        { color: "q-r", size: 10, weight: 600, anchor: "start" });
    }

    rdShape.set(S.name);
    rdH.set(S.H);
    rdCorner.set(cur === "int" ? "none — the pole is at 0" : `ω = ${WC} rad/s`);
    const sl = cur === "lead" ? 0 : S.slope;
    rdSlope.set(`${sl > 0 ? "+" : sl < 0 ? "−" : ""}${Math.abs(sl)} dB/decade`,
      cur === "lead" ? " — flat again above the pole" : "");
    rdErr.set(
      cur === "int" ? "none — it is exact"
        : cur === "lead" ? "corners interact"
          : "3.01 dB",
      cur === "lead" ? " — they are under a decade apart" : cur === "int" ? "" : " below the corner");
    rdNote.set(S.note);
  }

  const sc = scenarios({
    label: "shape",
    options: Object.keys(SHAPES).map((id) => ({ id, label: SHAPES[id].name })),
    value: "lp",
    onChange: (id) => { cur = id; draw(); },
  });
  draw();

  return {
    stage: el("div.stack", null, mp.root, pp.root),
    controls: el("div.controls", null, sc.root),
    readouts: readouts(rdShape, rdH, rdCorner, rdSlope, rdErr, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("poleDistance", { no: 84, build: () => {
  const f = poleDistance();
  return plate({
    no: 84, title: "Why the gain falls", tag: "interactive",
    label: "An s-plane with a pole and a moving point on the imaginary axis, " +
           "beside the Bode magnitude curve that results.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Setting s = jω means walking up the imaginary axis, and the gain at each " +
      "frequency is <b>one over the distance from the pole to where you are " +
      "standing</b>. Below the corner that distance hardly changes, so the " +
      "response is flat; above it the distance is essentially ω itself, so the " +
      "gain goes as 1/ω — which is what −20 dB per decade means. <b>Stop level " +
      "with the pole</b> and the distance is √2 a: gain 1/√2, −3.01 dB, phase " +
      "exactly −45°. The Bode plot's whole shape is one triangle, measured " +
      "repeatedly.",
  });
} });

register("bodeSketch", { no: 85, build: () => {
  const f = bodeSketch();
  return plate({
    no: 85, title: "The straight-line sketch", tag: "interactive",
    label: "Bode magnitude and phase plots for four first-order shapes, with " +
           "the asymptotic straight-line approximation drawn over the true curve.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The asymptotic sketch is the skill worth having under time pressure, and " +
      "the rule is short: <b>poles bend the plot down by 20 dB/decade, zeros " +
      "bend it up by 20</b>, each at its own corner, and the slopes add. The " +
      "straight lines are never more than <b>3.01 dB</b> wrong, and only " +
      "exactly at the corner. Phase is the same idea run over two decades: 45° " +
      "per pole at the corner itself, and the full 90° a decade either side.",
  });
} });
