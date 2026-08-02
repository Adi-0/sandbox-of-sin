/* ==========================================================================
   figures/second-order.js — Plates 78 and 79.

   The module's cast, scaled into a real circuit. Mathematics Part 7 solved
   y'' + 6y' + 25y = 0 and got roots −3 ± 4j: ωn = 5, ζ = 0.6, the 3-4-5
   triangle at 53.13°. Multiply by 2000 and it is a 120 Ω / 10 mH / 1 µF
   series RLC with roots at −6000 ± j8000 — the same triangle, the same
   damping ratio, now made of components you could buy.

   Plate 78 sweeps R across all three damping cases. Plate 79 stays in the
   underdamped one and reads the two numbers a specification is written in:
   overshoot and settling time.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { fixed, num } from "../lib/fmt.js";

/* The cast, scaled: ωn = 10 krad/s, and ζ = 0.6 at exactly R = 120 Ω. */
const L = 10e-3, C = 1e-6;
const WN = 1 / Math.sqrt(L * C);            // 10 000 rad/s
const zetaOf = (R) => (R / 2) * Math.sqrt(C / L);
const R_CAST = 120, R_CRIT = 2 * Math.sqrt(L / C);   // 120 Ω and 200 Ω

/** Unit step response of a second-order system, all three cases. */
function step(zeta, t) {
  if (t <= 0) return 0;
  if (Math.abs(zeta - 1) < 1e-9) return 1 - Math.exp(-WN * t) * (1 + WN * t);
  if (zeta < 1) {
    const wd = WN * Math.sqrt(1 - zeta * zeta);
    const k = zeta / Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * WN * t) * (Math.cos(wd * t) + k * Math.sin(wd * t));
  }
  const r = WN * Math.sqrt(zeta * zeta - 1);
  const s1 = -zeta * WN + r, s2 = -zeta * WN - r;
  return 1 + (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s1 - s2);
}

/* ==========================================================================
   Plate 78 — one resistor, three behaviours
   ========================================================================== */

function rlcDamping() {
  const p = new Plot({
    w: 620, h: 330, xr: [-0.07, 2.6], yr: [-0.12, 1.78],
    pad: { l: 54, r: 22, t: 18, b: 40 },
    label:
      "The step response of a series RLC circuit as its resistance changes, " +
      "moving from a slow overdamped approach through the critically damped " +
      "case to an underdamped response that overshoots and rings.",
  });

  const rdR = readout({ key: "R", value: "", tone: "x" });
  const rdZeta = readout({ key: "damping ratio", value: "", tone: "r" });
  const rdCase = readout({ key: "case", value: "" });
  const rdRoots = readout({ key: "roots", value: "", tone: "y" });
  const rdWd = readout({ key: "rings at", value: "", tone: "y" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(R) {
    p.clear("curve", "label", "mark", "shade");
    const z = zetaOf(R);
    const ms = (t) => t / 1000;                        // plot x is ms

    p.grid({ xStep: 0.5, yStep: 0.25 });
    p.axes({ xLabel: "t  (ms)", yLabel: "vC / Vs", xStep: 0.5, yStep: 0.5, arrows: true });

    // the target, and the ±2% band a specification would be written against
    p.area(() => 1.02, -0.05, 2.56, { color: "q-r-soft", baseline: 0.98, opacity: 0.6 });
    p.line(-0.05, 1, 2.56, 1, { color: "q-r", width: 1.3, dash: "5 4" });
    p.text(2.52, 1.1, "final value, ±2%", { color: "q-r", size: 10, anchor: "end" });

    // the three cases drawn faintly behind, so the comparison is always there
    for (const [rr, name] of [[400, "ζ = 2"], [R_CRIT, "ζ = 1"], [40, "ζ = 0.2"]]) {
      if (Math.abs(rr - R) < 6) continue;
      p.curve((x) => step(zetaOf(rr), ms(x)), { color: "grid", width: 1.6 });
    }

    p.curve((x) => step(z, ms(x)), { color: "q-y", width: 2.8 });

    // where the roots are, said in words on the plot itself
    const sig = z * WN;
    let kind, sub, roots, wdTxt;
    if (z < 0.999) {
      const wd = WN * Math.sqrt(1 - z * z);
      kind = "underdamped"; sub = " — overshoots and rings";
      roots = `−${num(sig, 0)} ± j${num(wd, 0)}`;
      wdTxt = `${fixed(wd / 1000, 2)} krad/s`;
      const tp = Math.PI / wd;
      const os = Math.exp(-Math.PI * z / Math.sqrt(1 - z * z));
      p.dot(tp * 1000, 1 + os, { color: "q-x", r: 4.6 });
      p.text(tp * 1000 + 0.08, 1 + os + 0.09,
        `peak ${fixed(os * 100, 1)}% over`, { color: "q-x", size: 10.5, weight: 600, anchor: "start" });
    } else if (z < 1.001) {
      kind = "critically damped"; sub = " — fastest with no overshoot";
      roots = `−${num(WN, 0)} (twice)`;
      wdTxt = "it does not";
    } else {
      const r = WN * Math.sqrt(z * z - 1);
      kind = "overdamped"; sub = " — two exponentials, no ringing";
      roots = `−${num(sig - r, 0)}, −${num(sig + r, 0)}`;
      wdTxt = "it does not";
    }

    rdR.set(`${num(R, 0)} Ω`, ` · L = 10 mH, C = 1 µF`);
    rdZeta.set(fixed(z, 3), Math.abs(R - R_CAST) < 3 ? " — the cast" : "");
    rdCase.set(kind, sub);
    rdRoots.set(roots, " s⁻¹");
    rdWd.set(wdTxt);
    rdNote.set(
      Math.abs(R - R_CAST) < 3
        ? `<b>R = 120 Ω puts the roots at −6000 ± j8000.</b> That is Mathematics Part 7's −3 ± 4j multiplied by 2000 — the same 3-4-5 triangle, the same 53.13°, the same ζ = cos 53.13° = 0.6. The characteristic equation you solved there as algebra is this circuit, and the ringing you can see is what those imaginary parts <em>are</em>.`
        : z < 0.999
          ? `Two energy stores and not enough resistance to settle the argument: the capacitor charges past its target, the inductor's current keeps pushing, and the overshoot has to be given back. <b>The roots are complex</b>, and their imaginary part is the ringing frequency while their real part sets how fast the envelope shrinks.`
          : z < 1.001
            ? `<b>Critical damping is the boundary</b>, not a compromise — it is the fastest approach that never overshoots, and it happens at exactly one value of R. A hair less and the circuit rings; a hair more and it is slower for no benefit. Repeated real roots, and no imaginary part at all.`
            : `Enough resistance that the circuit cannot ring: <b>two real roots</b>, two plain exponentials, and the slower one dominates. Note it is slower to arrive than the critically damped case — <b>more damping past ζ = 1 buys nothing and costs time</b>, which is the point people expect to be the other way round.`
    );
  }

  const k = knob({
    label: "R", min: 20, max: 500, step: 5, value: 120,
    format: (v) => `${v} Ω`,
    onInput: draw,
  });
  draw(120);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdR, rdZeta, rdCase, rdRoots, rdWd, rdNote),
  };
}

/* ==========================================================================
   Plate 79 — overshoot and settling time

   The two numbers a specification is written in, and the envelope they both
   come from. Knob is ζ directly, because this is the plate where ζ stops
   being a derived quantity and becomes the thing being chosen.
   ========================================================================== */

function overshoot() {
  const p = new Plot({
    w: 620, h: 322, xr: [-0.05, 2.0], yr: [-0.2, 2.05],
    pad: { l: 54, r: 22, t: 18, b: 40 },
    label:
      "An underdamped step response with its decaying exponential envelope " +
      "drawn above and below the final value, the first peak marked with its " +
      "percentage overshoot, and the two per cent settling band marked with " +
      "the time the response last leaves it.",
  });

  const rdZeta = readout({ key: "damping ratio", value: "", tone: "r" });
  const rdWd = readout({ key: "damped frequency", value: "", tone: "y" });
  const rdTp = readout({ key: "peak at", value: "", tone: "x" });
  const rdOS = readout({ key: "overshoot", value: "", tone: "bad" });
  const rdTs = readout({ key: "settles by", value: "", tone: "x" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(z100) {
    p.clear("curve", "label", "mark", "shade");
    const z = z100 / 100;
    const ms = (t) => t / 1000;
    const wd = WN * Math.sqrt(1 - z * z);
    const sig = z * WN;
    const os = Math.exp(-Math.PI * z / Math.sqrt(1 - z * z));
    const tp = Math.PI / wd;
    const ts = 4 / sig;                         // the 2% criterion

    p.grid({ xStep: 0.25, yStep: 0.25 });
    p.axes({ xLabel: "t  (ms)", yLabel: "vC / Vs", xStep: 0.5, yStep: 0.5, arrows: true });

    p.area(() => 1.02, -0.04, 1.97, { color: "q-r-soft", baseline: 0.98, opacity: 0.6 });
    p.line(-0.04, 1, 1.97, 1, { color: "q-r", width: 1.3, dash: "5 4" });

    /* The envelope is where both performance numbers come from: the peak
       touches it, and settling is when it enters the band. */
    const env = (x) => Math.exp(-sig * ms(x)) / Math.sqrt(1 - z * z);
    p.curve((x) => (x < 0 ? null : 1 + env(x)), { color: "q-x", width: 1.4, dash: "4 3" });
    p.curve((x) => (x < 0 ? null : 1 - env(x)), { color: "q-x", width: 1.4, dash: "4 3" });

    p.curve((x) => step(z, ms(x)), { color: "q-y", width: 2.8 });

    // the peak
    p.dot(tp * 1000, 1 + os, { color: "q-bad", r: 5 });
    p.line(tp * 1000, 1, tp * 1000, 1 + os, { color: "q-bad", width: 1.4 });
    p.text(tp * 1000 + 0.09, 1 + os + 0.02, `${fixed(os * 100, 1)}% overshoot`,
      { color: "q-bad", size: 11, weight: 700, anchor: "start" });

    // settling
    if (ts * 1000 < 1.9) {
      p.line(ts * 1000, 0.55, ts * 1000, 1.02, { color: "q-x", width: 1.4, dash: "3 3" });
      p.text(ts * 1000, 0.46, `ts = ${fixed(ts * 1000, 2)} ms`,
        { color: "q-x", size: 10.5, weight: 600 });
    }

    rdZeta.set(fixed(z, 2), Math.abs(z - 0.6) < 0.005 ? " — the cast" : "");
    rdWd.set(`${fixed(wd / 1000, 2)} krad/s`, ` = ωn√(1−ζ²)`);
    rdTp.set(`${fixed(tp * 1000, 2)} ms`, " = π/ωd");
    rdOS.set(`${fixed(os * 100, 1)}%`);
    rdTs.set(`${fixed(ts * 1000, 2)} ms`, " = 4/ζωn, to ±2%");
    rdNote.set(
      z < 0.35
        ? `Light damping: <b>${fixed(os * 100, 0)}% overshoot</b> and a long ring. The envelope decays at ζωn, so at this ζ the circuit spends most of its settling time on oscillations that are already small. Fast to arrive, slow to be trusted.`
        : z > 0.85
          ? `Heavy damping: almost no overshoot, but look at the settling time — <b>the envelope is not the whole story</b>. Past about ζ = 0.9 the response is so sluggish that t_s starts climbing again, and by ζ = 1 you have given up all the speed to remove the last few per cent of overshoot.`
          : Math.abs(z - 0.707) < 0.02
            ? `<b>ζ ≈ 0.707 is the usual engineering compromise</b> — around 4.3% overshoot and close to the shortest settling time available. It is where a great many real designs are deliberately placed, and worth recognising as a number rather than deriving.`
            : `<b>Overshoot depends on ζ alone.</b> Change ωn and the whole picture stretches along the time axis, but the peak stays the same height — which is why a specification is written as a percentage and a time, not as two times. Settling depends on the product ζωn, the real part of the roots.`
    );
  }

  const k = knob({
    label: "damping ratio", min: 10, max: 95, step: 1, value: 60,
    format: (v) => fixed(v / 100, 2),
    onInput: draw,
  });
  draw(60);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdZeta, rdWd, rdTp, rdOS, rdTs, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("rlcDamping", { no: 78, build: () => {
  const f = rlcDamping();
  return plate({
    no: 78, title: "One resistor, three behaviours", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "A series RLC with L and C fixed, so <b>only the damping changes</b>. " +
      "Below 200 Ω the roots are complex and the circuit rings; at exactly " +
      "200 Ω they collide on the real axis and it arrives as fast as it can " +
      "without overshooting; above that they separate into two plain " +
      "exponentials and it gets <em>slower</em>. <b>Set R to 120 Ω</b>: the " +
      "roots are −6000 ± j8000, which is Mathematics Part 7's −3 ± 4j at 2000 " +
      "times the scale — the same triangle, the same ζ = 0.6, now made of " +
      "components.",
  });
} });

register("overshoot", { no: 79, build: () => {
  const f = overshoot();
  return plate({
    no: 79, title: "Overshoot and settling", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Both numbers a second-order specification is written in come off the " +
      "same decaying envelope. The first peak touches it, so <b>overshoot " +
      "depends on ζ and nothing else</b> — change ωn and the picture stretches " +
      "sideways while the peak stays exactly as high. Settling is when the " +
      "envelope enters the ±2% band, which is why it depends on the " +
      "<em>product</em> ζωn: the real part of the roots. <b>ζ ≈ 0.707 is where " +
      "a great many real designs sit</b>, at about 4.3% overshoot and close to " +
      "the shortest settling time on offer.",
  });
} });
