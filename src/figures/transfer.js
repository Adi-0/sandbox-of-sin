/* ==========================================================================
   figures/transfer.js — Plates 82 and 83.

   Plate 82 is the s-plane with a draggable pole pair, and the step response
   it produces, side by side. Every claim the module has made about damping,
   ringing and settling becomes one geometric statement: how far left a pole
   is, is how fast it decays; how high, is how fast it rings; how far from
   the origin, is ωn; and the angle from the negative real axis is ζ.

   Plate 83 is the same circuit written three ways — as components, as an
   s-domain impedance divider, and as a transfer function — so that the step
   from "a circuit" to "H(s)" is a substitution rather than a derivation.
   ========================================================================== */

import { el, svg, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { Schematic } from "../lib/circuit.js";
import { fixed, num } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;

/* ==========================================================================
   Plate 82 — the s-plane

   Two knobs, because the whole point is that a pole has two coordinates and
   each one means something different.
   ========================================================================== */

function splane() {
  const sp = new Plot({
    w: 300, h: 300, xr: [-11.5, 4.6], yr: [-8.6, 8.6],
    pad: { l: 16, r: 14, t: 14, b: 14 },
    label:
      "The complex s-plane with a conjugate pair of poles marked, the left " +
      "half-plane shaded as the stable region, and the angle from the " +
      "negative real axis marked as the damping ratio.",
  });
  const tp = new Plot({
    w: 300, h: 300, xr: [-0.12, 3.4], yr: [-0.25, 2.15],
    pad: { l: 40, r: 16, t: 14, b: 34 },
    label: "The step response produced by those pole positions.",
  });

  const rdPoles = readout({ key: "poles", value: "", tone: "y" });
  const rdWn = readout({ key: "ωn = distance", value: "", tone: "x" });
  const rdZeta = readout({ key: "ζ = cos of angle", value: "", tone: "r" });
  const rdTs = readout({ key: "settles", value: "", tone: "x" });
  const rdOS = readout({ key: "overshoot", value: "", tone: "bad" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(sigma10, omega10) {
    const sig = sigma10 / 10, om = omega10 / 10;      // in units of 1/s
    sp.clear("curve", "label", "mark", "shade");
    tp.clear("curve", "label", "mark", "shade");

    /* --- the plane ------------------------------------------------------ */
    sp.add("shade", svg("rect", {
      x: sp.x(-11), y: sp.y(8), width: sp.x(0) - sp.x(-11), height: sp.y(-8) - sp.y(8),
      fill: V("q-r-soft"), opacity: 0.5,
    }));
    sp.grid({ xStep: 2, yStep: 2 });
    sp.axes({ xLabel: "σ", yLabel: "jω", xStep: 2, yStep: 2, arrows: true });
    sp.text(-7.6, -7.0, "stable", { color: "q-r", size: 11, weight: 600 });
    sp.text(2.2, -7.0, "unstable", { color: "q-bad", size: 11, weight: 600 });

    const wn = Math.hypot(sig, om);
    const zeta = wn > 0 ? sig / wn : 1;

    /* The radius is ωn. Sweep the arc from the pole round to the negative real
       axis, where it can be labelled — a full semicircle would leave the frame
       whenever ωn exceeds the vertical range. */
    sp.param((t) => [wn * Math.cos(t), wn * Math.sin(t)],
      [Math.atan2(om, -sig), Math.PI], { color: "q-x", width: 1.2, dash: "4 3" });
    if (wn < 10.4) {
      sp.text(-wn, -0.95, `ωn = ${fixed(wn, 1)}`,
        { color: "q-x", size: 10, weight: 600 });
    }
    // and the angle is ζ
    sp.line(0, 0, -sig, om, { color: "q-r", width: 1.4 });
    sp.line(0, 0, -sig, -om, { color: "q-r", width: 1.4, opacity: 0.4 });
    sp.angleArc(0, 0, Math.PI, Math.atan2(om, -sig), 2.4,
      { color: "q-r", width: 1.2 });

    for (const y of [om, -om]) {
      sp.text(-sig, y, "✕", { color: "q-y", size: 17, weight: 700, dy: 6 });
    }
    sp.text(-sig + 0.55, om + 0.35, `−${fixed(sig, 1)} + j${fixed(om, 1)}`,
      { color: "q-y", size: 10.5, weight: 600, anchor: "start" });

    /* --- the response it produces --------------------------------------- */
    tp.grid({ xStep: 0.5, yStep: 0.5 });
    tp.axes({ xLabel: "t  (ms)", yLabel: "step response", xStep: 1, yStep: 0.5, arrows: true });
    tp.line(-0.1, 1, 3.35, 1, { color: "q-r", width: 1.2, dash: "5 4" });

    const wd = om * 1000, s0 = sig * 1000;              // per second
    const y = (ms) => {
      const t = ms / 1000;
      if (t < 0) return 0;
      if (om < 0.05) return 1 - Math.exp(-s0 * t) * (1 + s0 * t);
      return 1 - Math.exp(-s0 * t) * (Math.cos(wd * t) + (s0 / wd) * Math.sin(wd * t));
    };
    tp.curve((x) => Math.max(-0.2, Math.min(2.1, y(x))), { color: "q-y", width: 2.6 });
    tp.curve((x) => (x < 0 ? null : 1 + Math.exp(-s0 * x / 1000) / Math.sqrt(1 - zeta * zeta)),
      { color: "q-x", width: 1.1, dash: "3 3" });

    const ts = 4 / s0;
    const os = zeta < 0.999 ? Math.exp(-Math.PI * zeta / Math.sqrt(1 - zeta * zeta)) : 0;

    rdPoles.set(`−${fixed(sig * 1000, 0)} ± j${fixed(om * 1000, 0)}`, " s⁻¹");
    rdWn.set(`${fixed(wn, 2)} krad/s`);
    rdZeta.set(fixed(zeta, 3), ` = cos ${fixed(Math.acos(zeta) * 180 / Math.PI, 1)}°`);
    rdTs.set(`${fixed(ts * 1000, 2)} ms`, " = 4/σ, to ±2%");
    rdOS.set(os > 0.001 ? `${fixed(os * 100, 1)}%` : "none");
    rdNote.set(
      om < 0.05
        ? `Both poles are on the <b>real axis</b>, so there is no imaginary part and nothing to oscillate. The response is a plain exponential approach — this is Part 2's critically damped or overdamped case, seen as geometry rather than as an inequality on ζ.`
        : sig < 0.6
          ? `The poles are close to the imaginary axis, so they are <b>barely damped</b>: ζ = ${fixed(zeta, 2)}, ${fixed(os * 100, 0)}% overshoot, and a long ring. <b>Distance from the imaginary axis is the only thing that sets settling time</b> — move them left and the ringing frequency does not change, but the envelope collapses.`
          : `<b>Read the geometry directly.</b> The pole's distance from the origin is ωn = ${fixed(wn, 2)} krad/s. Its angle from the negative real axis has cosine ${fixed(zeta, 2)}, and that <em>is</em> ζ. Its horizontal distance from the imaginary axis, ${fixed(sig, 1)} krad/s, sets the settling time; its height sets the ringing frequency. Four facts, one point.`
    );
  }

  const kS = knob({
    label: "σ — distance left of the axis", min: 1, max: 90, step: 1, value: 60,
    format: (v) => `${fixed(v / 10, 1)} krad/s`,
    onInput: (v) => draw(v, kW.value()),
  });
  const kW = knob({
    label: "ω — height", min: 0, max: 90, step: 1, value: 80,
    format: (v) => `${fixed(v / 10, 1)} krad/s`,
    onInput: (v) => draw(kS.value(), v),
  });
  draw(60, 80);

  return {
    stage: el("div.duo", null, sp.root, tp.root),
    controls: el("div.controls", null, kS.root, kW.root),
    readouts: readouts(rdPoles, rdWn, rdZeta, rdTs, rdOS, rdNote),
  };
}

/* ==========================================================================
   Plate 83 — a circuit becomes a transfer function

   Three views of the same low-pass RC: the components, the s-domain divider,
   and H(s). The knob moves the pole, so the reader can see the corner and
   the time constant move together.
   ========================================================================== */

const CIRCUITS = {
  rc: {
    name: "RC low-pass", order: 1,
    z1: "R", z2: "1/sC",
    H: "H(s) = 1 / (1 + sRC)",
    poles: (R, C) => [-1 / (R * C)],
    zeros: () => [],
    note: "The divider is unchanged from Circuit Analysis Part 2 — <b>1/sC over R + 1/sC</b>, multiplied top and bottom by s. One pole, at −1/RC, which is the reciprocal of Part 1's time constant. <b>A first-order circuit's pole location and its time constant are the same fact</b>, written in different units.",
  },
  cr: {
    name: "CR high-pass", order: 1,
    z1: "1/sC", z2: "R",
    H: "H(s) = sRC / (1 + sRC)",
    poles: (R, C) => [-1 / (R * C)],
    zeros: () => [0],
    note: "The same two components, swapped. <b>The pole has not moved</b> — it is still at −1/RC, because the pole comes from the loop, not from which element you measure across. What changed is the numerator: a <b>zero at the origin</b>, which is what kills the response at DC and makes this a high-pass.",
  },
  rl: {
    name: "RL low-pass", order: 1,
    z1: "sL", z2: "R",
    H: "H(s) = 1 / (1 + sL/R)",
    poles: (R, C) => [-1 / (R * C)],      // the knob is τ, whichever τ it is
    zeros: () => [],
    note: "Different components, <b>identical transfer function</b> — only the recipe for τ has changed, from RC to L/R. That is Part 1's observation that the four first-order transients are one curve, arriving as the statement that they are <b>one pole</b>. A first-order system is fully described by where its single pole is, and nothing about the parts survives that description.",
  },
};

function circuitToH() {
  const sch = new Schematic({
    w: 12, h: 5, unit: 26,
    label: "A two-element divider drawn with its impedances labelled in the " +
           "s-domain, from which the transfer function is read directly.",
  });

  const p = new Plot({
    w: 620, h: 170, xr: [-11, 3.2], yr: [-3.0, 3.0],
    pad: { l: 16, r: 14, t: 12, b: 12 },
    label: "The pole and zero locations of the selected circuit, on the s-plane.",
  });

  const rdH = readout({ key: "H(s)", value: "", tone: "r" });
  const rdPole = readout({ key: "pole", value: "", tone: "y" });
  const rdZero = readout({ key: "zero", value: "", tone: "x" });
  const rdTau = readout({ key: "time constant", value: "", tone: "x" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "rc";

  function drawSchematic(C) {
    sch.root.querySelectorAll("g > *").forEach((n) => n.remove());
    sch.wire([[1, 1], [3, 1]]);
    sch.box([4, 1], "h", { label: C.z1, at: "n" });
    sch.wire([[5, 1], [10, 1]]);
    sch.wire([[1, 1], [1, 4]]);
    sch.source([1, 2.5], "v", { kind: "ac", label: "Vin", at: "w", color: "q-x" });

    sch.wire([[7, 1], [7, 1.5]]);
    sch.box([7, 2.5], "v", { label: C.z2, at: "e" });
    sch.wire([[7, 3.5], [7, 4]]);

    sch.wire([[1, 4], [10, 4]]);
    sch.node([7, 1]);
    sch.node([7, 4]);
    sch.terminal([10, 1], { label: "Vout", at: "e", color: "q-y" });
    sch.ground([1, 4]);
  }

  function draw(tauMs) {
    const C = CIRCUITS[cur];
    drawSchematic(C);
    p.clear("curve", "label", "mark", "shade");

    const R = 1000, Cap = (tauMs / 1000) / R;
    const poles = C.poles(R, Cap), zeros = C.zeros();

    p.add("shade", svg("rect", {
      x: p.x(-11), y: p.y(3.0), width: p.x(0) - p.x(-11), height: p.y(-3.0) - p.y(3.0),
      fill: V("q-r-soft"), opacity: 0.5,
    }));
    p.grid({ xStep: 2, yStep: 1 });
    p.axes({ xLabel: "σ  (krad/s)", yLabel: "jω", xStep: 2, yStep: 2, arrows: true });

    for (const s of poles) {
      p.text(s / 1000, 0, "✕", { color: "q-y", size: 19, weight: 700, dy: 7 });
      p.text(s / 1000, -1.35, `pole at −${fixed(-s / 1000, 2)}`,
        { color: "q-y", size: 10, weight: 600 });
    }
    for (const z of zeros) {
      p.ring(z / 1000, 0, { color: "q-x", r: 7, width: 2.2 });
      p.text(z / 1000, 0.85, "zero", { color: "q-x", size: 10, weight: 600 });
    }

    rdH.set(C.H);
    rdPole.set(poles.map((s) => (s === 0 ? "s = 0" : `s = −${num(-s, 0)}`)).join(", "), " s⁻¹");
    rdZero.set(zeros.length ? zeros.map((z) => `s = ${z}`).join(", ") : "none");
    rdTau.set(`${fixed(tauMs, 2)} ms`, cur === "rl" ? " = L/R" : " = RC");
    rdNote.set(C.note);
  }

  const k = knob({
    label: "RC", min: 1, max: 20, step: 1, value: 4,
    format: (v) => `${fixed(v / 10, 1)} ms`,
    onInput: (v) => draw(v / 10),
  });
  const sc = scenarios({
    label: "circuit",
    options: Object.keys(CIRCUITS).map((id) => ({ id, label: CIRCUITS[id].name })),
    value: "rc",
    onChange: (id) => { cur = id; draw(k.value() / 10); },
  });
  draw(0.4);

  return {
    stage: el("div.stack", null, sch.root, p.root),
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdH, rdPole, rdZero, rdTau, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("splane", { no: 82, build: () => {
  const f = splane();
  return plate({
    no: 82, title: "A pole is a behaviour", tag: "interactive",
    label: "The s-plane with a movable pole pair, beside the step response it produces.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Move the pair and watch the response. <b>Left is decay, up is ringing</b> " +
      "— and that is the whole of it. Distance from the imaginary axis sets the " +
      "settling time and nothing else; height sets the ringing frequency and " +
      "nothing else; distance from the origin is ωn; and the angle from the " +
      "negative real axis has cosine ζ. Everything Parts 1 and 2 established as " +
      "separate formulas is one point's position, which is why the s-plane is " +
      "the most useful picture in this module and the next.",
  });
} });

register("circuitToH", { no: 83, build: () => {
  const f = circuitToH();
  return plate({
    no: 83, title: "From components to H(s)", tag: "interactive",
    label: "A two-element divider labelled with s-domain impedances, and the " +
           "pole-zero plot of the transfer function it produces.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Replace each element with its s-domain impedance — R, sL, 1/sC — and a " +
      "circuit becomes a divider again, exactly as in Circuit Analysis Part 2. " +
      "<b>Swap the two elements and the pole does not move</b>, because the pole " +
      "comes from the loop; what changes is the numerator, and a zero at the " +
      "origin is what turns a low-pass into a high-pass. The integrator puts its " +
      "pole <em>on</em> the axis, where nothing decays — which is what " +
      "integration is.",
  });
} });
