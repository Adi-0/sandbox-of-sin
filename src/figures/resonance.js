/* ==========================================================================
   figures/resonance.js — Plates 86 and 87.

   Plate 86 is the cancellation itself: X_L and X_C plotted against frequency
   as two curves that cross, with |Z| the result. Resonance is not a new
   phenomenon, it is the one frequency where two things this module has been
   carrying separately happen to be equal and opposite.

   Plate 87 is Q — the sharpness — with the bandwidth marked at the half-power
   points, and the same Q shown to be the resonant rise in voltage across the
   reactive elements. That second reading is the one exam questions are built
   on, and the one people find surprising.
   ========================================================================== */

import { el, svg, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { fixed, num } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;

/* Fixed L and C give ω₀ = 10 krad/s, the same ω₀ as Part 2's circuit. */
const L = 10e-3, C = 1e-6;
const W0 = 1 / Math.sqrt(L * C);
const Z0 = Math.sqrt(L / C);            // 100 Ω characteristic impedance

/* ==========================================================================
   Plate 86 — where the reactances cancel
   ========================================================================== */

function reactances() {
  /* Everything on this plate is in krad/s and ohms. With L = 10 mH and
     C = 1 µF that makes X_L = 10ω and X_C = 1000/ω with ω in krad/s, which
     cross at ω₀ = 10 — the same ω₀ as Part 2's circuit. */
  const R = 50;
  const XL = (w) => 10 * w;
  const XC = (w) => 1000 / w;

  const p = new Plot({
    w: 620, h: 330, xr: [3.4, 24], yr: [-290, 320],
    pad: { l: 58, r: 22, t: 18, b: 40 },
    label:
      "Inductive and capacitive reactance plotted against frequency, crossing " +
      "at the resonant frequency, with the resulting total impedance " +
      "magnitude shown reaching its minimum there.",
  });

  const rdW = readout({ key: "ω", value: "", tone: "y" });
  const rdXl = readout({ key: "XL = ωL", value: "", tone: "x" });
  const rdXc = readout({ key: "XC = 1/ωC", value: "", tone: "x" });
  const rdZ = readout({ key: "|Z|", value: "", tone: "r" });
  const rdPhi = readout({ key: "the circuit looks", value: "" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(w) {
    p.clear("curve", "label", "mark", "shade");

    p.grid({ xStep: 2, yStep: 50 });
    p.axes({ xLabel: "ω  (krad/s)", yLabel: "ohms", xStep: 4, yStep: 100, arrows: true });

    // the two reactances, drawn with their signs — which is the whole point
    p.curve(XL, { color: "q-x", width: 2.2 });
    p.curve((x) => -XC(x), { color: "q-y", width: 2.2 });
    p.text(23.6, XL(23.6) - 26, "XL = ωL",
      { color: "q-x", size: 11, weight: 600, anchor: "end" });
    p.text(23.6, -XC(23.6) - 30, "−XC = −1/ωC",
      { color: "q-y", size: 11, weight: 600, anchor: "end" });

    // |Z| = √(R² + X²), the thing the source actually feels
    const Z = (x) => Math.hypot(R, XL(x) - XC(x));
    p.curve(Z, { color: "q-r", width: 2.8 });
    p.text(5.4, Z(5.4) + 30, "|Z|", { color: "q-r", size: 12, weight: 700 });

    // resonance
    p.line(10, -280, 10, 300, { color: "q-r", width: 1.3, dash: "4 3" });
    p.text(10, 306, "ω₀ = 10", { color: "q-r", size: 10.5, weight: 600 });
    p.dot(10, R, { color: "q-r", r: 4.6 });
    p.text(10.5, R + 42, `|Z| = R = ${R} Ω`,
      { color: "q-r", size: 10.5, weight: 600, anchor: "start" });

    // the cursor
    const xl = XL(w), xc = XC(w), X = xl - xc;
    p.line(w, -280, w, 300, { color: "grid", width: 1.2 });
    p.dot(w, Z(w), { color: "q-r", r: 4 });
    p.dot(w, xl, { color: "q-x", r: 3.6, ring: false });
    p.dot(w, -xc, { color: "q-y", r: 3.6, ring: false });

    rdW.set(`${fixed(w, 1)} krad/s`);
    rdXl.set(`${fixed(xl, 1)} Ω`);
    rdXc.set(`${fixed(xc, 1)} Ω`);
    rdZ.set(`${fixed(Math.hypot(R, X), 1)} Ω`, ` = √(${R}² + ${fixed(X, 1)}²)`);
    rdPhi.set(Math.abs(X) < 3 ? "purely resistive" : X > 0 ? "inductive" : "capacitive",
      Math.abs(X) < 3 ? "" : X > 0 ? " — current lags" : " — current leads");
    rdNote.set(
      Math.abs(w - 10) < 0.3
        ? `<b>At resonance the two reactances are equal and opposite and cancel exactly.</b> What is left is R alone, so the impedance is at its <em>minimum</em> and the current at its maximum. The reactances have not vanished — XL and XC are both ${fixed(xl, 0)} Ω here, <b>twice R</b> — they have merely stopped being visible from outside. Plate 87 is about what that hidden pair does to the voltages <em>inside</em> the circuit.`
        : w < 10
          ? `Below resonance the capacitor dominates: 1/ωC is large when ω is small, so XC wins and the circuit looks <b>capacitive</b> — the current leads. Watch |Z| fall towards R as the two curves converge.`
          : `Above resonance the inductor dominates: ωL grows without limit, so XL wins and the circuit looks <b>inductive</b> — the current lags. This crossover is what every tuned circuit is built on: <b>one frequency separates capacitive from inductive</b>, and it is where the two reactance curves cross.`
    );
  }

  const k = knob({
    label: "ω", min: 40, max: 235, step: 1, value: 100,
    format: (v) => `${fixed(v / 10, 1)} krad/s`,
    onInput: (v) => draw(v / 10),
  });
  draw(10);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdW, rdXl, rdXc, rdZ, rdPhi, rdNote),
  };
}

/* ==========================================================================
   Plate 87 — Q, bandwidth, and the voltage rise
   ========================================================================== */

function quality() {
  const p = new Plot({
    w: 620, h: 320, xr: [0.4, 1.75], yr: [-0.08, 1.16],
    pad: { l: 56, r: 22, t: 18, b: 40 },
    label:
      "The normalised current through a series RLC against frequency, peaking " +
      "at resonance, with the half-power points marked and the bandwidth " +
      "between them shown.",
  });

  const rdR = readout({ key: "R", value: "", tone: "x" });
  const rdQ = readout({ key: "Q", value: "", tone: "r" });
  const rdBW = readout({ key: "bandwidth", value: "", tone: "y" });
  const rdEdges = readout({ key: "half-power at", value: "", tone: "y" });
  const rdRise = readout({ key: "V across L and C", value: "", tone: "bad" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(R) {
    p.clear("curve", "label", "mark", "shade");
    const Q = Z0 / R;
    const BW = W0 / Q;
    const w1 = -R / (2 * L) + Math.sqrt((R / (2 * L)) ** 2 + 1 / (L * C));
    const w2 = R / (2 * L) + Math.sqrt((R / (2 * L)) ** 2 + 1 / (L * C));

    p.grid({ xStep: 0.1, yStep: 0.2 });
    p.axes({ xLabel: "ω / ω₀", yLabel: "I / Imax", xStep: 0.25, yStep: 0.5, arrows: true });

    // the half-power line, and the band it cuts
    p.add("shade", svg("rect", {
      x: p.x(w1 / W0), y: p.y(1.02),
      width: p.x(w2 / W0) - p.x(w1 / W0), height: p.y(0) - p.y(1.02),
      fill: V("q-y-soft"), opacity: 0.45,
    }));
    p.line(0.42, Math.SQRT1_2, 1.73, Math.SQRT1_2, { color: "q-y", width: 1.3, dash: "5 4" });
    p.text(1.71, Math.SQRT1_2 + 0.055, "0.707 — half power",
      { color: "q-y", size: 10.5, weight: 600, anchor: "end" });

    const I = (r) => {
      const w = r * W0;
      const X = w * L - 1 / (w * C);
      return R / Math.hypot(R, X);
    };
    p.curve(I, { color: "q-r", width: 2.8 });

    p.line(1, 0, 1, 1, { color: "q-r", width: 1.2, dash: "3 3" });
    for (const we of [w1, w2]) {
      p.dot(we / W0, Math.SQRT1_2, { color: "q-y", r: 4.4 });
    }
    // the bracket belongs on the half-power line, between the two dots it spans
    p.line(w1 / W0, Math.SQRT1_2, w2 / W0, Math.SQRT1_2, { color: "q-y", width: 2.6 });
    p.text((w1 + w2) / (2 * W0), Math.SQRT1_2 - 0.115,
      `BW = ${fixed(BW / 1000, 2)} krad/s`,
      { color: "q-y", size: 11, weight: 700, bg: true });

    rdR.set(`${num(R, 0)} Ω`, " · L = 10 mH, C = 1 µF");
    rdQ.set(fixed(Q, 2), ` = √(L/C)/R = ${num(Z0, 0)}/${num(R, 0)}`);
    rdBW.set(`${fixed(BW / 1000, 2)} krad/s`, " = ω₀/Q");
    rdEdges.set(`${fixed(w1 / 1000, 2)} and ${fixed(w2 / 1000, 2)}`, " krad/s");
    rdRise.set(`${fixed(Q, 1)} ×`, " the source voltage");
    rdNote.set(
      Q > 4
        ? `<b>High Q: sharp, and dangerous.</b> The band is narrow — good for a tuned filter — but the voltage across L and across C at resonance is <b>Q times the source</b>. At Q = ${fixed(Q, 1)}, a 10 V source puts ${fixed(Q * 10, 0)} V across each of them. They cancel as far as the source can tell, which is why |Z| is just R, but <b>the components themselves see the full rise</b> and must be rated for it.`
        : Q > 1.2
          ? `Moderate Q. Note the two readings of the same number: <b>Q is the sharpness of the peak</b> (ω₀ divided by the bandwidth) <em>and</em> <b>the factor by which the voltage across the reactive elements exceeds the source</b>. Those are not two facts — they are the same ratio of stored to dissipated energy, seen twice.`
          : `<b>Low Q: broad and gentle.</b> With this much resistance the circuit is barely resonant at all; the peak is wide and there is almost no voltage rise. Q below about 0.5 stops being a useful description, and the circuit is better thought of as the overdamped case from Part 2 — which it is: <b>Q = 1/2ζ</b>, exactly.`
    );
  }

  const k = knob({
    label: "R", min: 5, max: 200, step: 5, value: 20,
    format: (v) => `${v} Ω`,
    onInput: draw,
  });
  draw(20);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdR, rdQ, rdBW, rdEdges, rdRise, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("reactances", { no: 86, build: () => {
  const f = reactances();
  return plate({
    no: 86, title: "Where the reactances cancel", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Resonance is not a new phenomenon. <b>X<sub>L</sub> rises with frequency " +
      "and X<sub>C</sub> falls</b>, so somewhere they are equal — and because " +
      "they have opposite signs they cancel there exactly. What is left is R " +
      "alone, which is why a series circuit's impedance is at its " +
      "<em>minimum</em> at resonance and its current at a maximum. Below ω₀ the " +
      "capacitor wins and the circuit looks capacitive; above it the inductor " +
      "does. <b>One frequency separates the two</b>, and it is where the curves " +
      "cross.",
  });
} });

register("quality", { no: 87, build: () => {
  const f = quality();
  return plate({
    no: 87, title: "Q, twice over", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Q is the sharpness of the peak — ω₀ divided by the width of the band " +
      "between the half-power points — and it is <b>also the factor by which " +
      "the voltage across L and across C exceeds the source</b>. Those are the " +
      "same number because they are the same ratio of stored to dissipated " +
      "energy. The second reading is the one that catches people: at Q = 10 a " +
      "10 V supply puts <b>100 V across the capacitor</b>, and the components " +
      "have to survive it even though the source sees nothing but R.",
  });
} });
