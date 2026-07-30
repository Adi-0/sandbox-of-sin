/* ==========================================================================
   figures/margins.js — Plates 95 and 96.

   Linear Systems Part 5 already taught how to sketch a Bode plot. This module
   uses one: the plot is of the OPEN loop, GH, and the two distances measured
   on it say how far the CLOSED loop is from oscillating.

   Plate 95 measures them. Plate 96 answers the question that makes them worth
   measuring — what a given phase margin actually feels like in the time
   domain, and how good the ζ ≈ PM/100 rule of thumb really is.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed, sig } from "../lib/fmt.js";
import { overshoot } from "../lib/poly.js";

const DEG = 180 / Math.PI;

/* -------------------------------------------------------------------------
   plants, described by their poles rather than their coefficients — which is
   what makes the magnitude and phase one-liners
   ------------------------------------------------------------------------- */

const PLANTS = {
  two: {
    label: "K / s(s+6)",
    intg: 1, poles: [6], kMax: 200, kStart: 25,
    story: "Two poles, so the phase can never quite reach −180°: it starts at −90° and asymptotes to −180° without arriving. <b>The gain margin is infinite and this loop is stable at any gain</b> — which agrees with Part 2, where its locus went straight up and never crossed.",
  },
  three: {
    label: "K / s(s+2)(s+8)",
    intg: 1, poles: [2, 8], kMax: 300, kStart: 60,
    story: "The plant from Parts 2 and 3. <b>Phase crossover at ω = 4 rad/s and zero gain margin at K = 160</b> — the same two numbers the Routh array produced, arrived at from a completely different direction.",
  },
  nolag: {
    label: "K / (s+1)(s+2)(s+4)",
    intg: 0, poles: [1, 2, 4], kMax: 200, kStart: 20,
    story: "No integrator, so the phase starts at 0° and the magnitude is flat at low frequency. Three poles still supply 270° of lag in the end, so there is still a gain that tips it over — <b>here K = 90</b>, which Routh confirms from s³ + 7s² + 14s + (8 + K).",
  },
};

const magOf = (pl, K, w) =>
  K / (Math.pow(w, pl.intg) * pl.poles.reduce((a, p) => a * Math.hypot(w, p), 1));
const phaseOf = (pl, w) =>
  -90 * pl.intg - pl.poles.reduce((a, p) => a + Math.atan(w / p) * DEG, 0);

/** Bisect a monotone function of log₁₀ω between two decades. */
function solveLog(f, target, lo = -3, hi = 3) {
  const g = (x) => f(10 ** x) - target;
  if (g(lo) * g(hi) > 0) return null;
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2;
    if (g(lo) * g(m) <= 0) hi = m; else lo = m;
  }
  return 10 ** ((lo + hi) / 2);
}

/* ==========================================================================
   Plate 95 — the two margins, measured
   ========================================================================== */

const XR = [-1, 2];

function marginPlot() {
  const mp = new Plot({
    w: 620, h: 232, xr: XR, yr: [-80, 60],
    pad: { l: 52, r: 20, t: 14, b: 30 },
    label: "Open-loop magnitude in decibels against log frequency, with the 0 dB line marked.",
  });
  const pp = new Plot({
    w: 620, h: 208, xr: XR, yr: [-285, 5],
    pad: { l: 52, r: 20, t: 14, b: 34 },
    label: "Open-loop phase in degrees against log frequency, with the −180° line marked.",
  });

  const rdK = readout({ key: "gain K", value: "", tone: "x" });
  const rdWgc = readout({ key: "gain crossover", value: "", tone: "y" });
  const rdPm = readout({ key: "phase margin", value: "", tone: "r" });
  const rdWpc = readout({ key: "phase crossover", value: "", tone: "y" });
  const rdGm = readout({ key: "gain margin", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "three";

  function draw(v) {
    const pl = PLANTS[cur];
    const K = (v / 1000) * pl.kMax;
    mp.clear("curve", "label", "mark", "shade");
    pp.clear("curve", "label", "mark", "shade");

    const dB = (w) => 20 * Math.log10(magOf(pl, K, w));
    const wgc = solveLog((w) => dB(w), 0);
    const wpc = solveLog((w) => phaseOf(pl, w), -180);
    const pm = wgc == null ? null : 180 + phaseOf(pl, wgc);
    const gm = wpc == null ? null : -dB(wpc);

    /* --- magnitude ------------------------------------------------------ */
    mp.grid({ xStep: 0.25, yStep: 20 });
    mp.axes({ xLabel: "log₁₀ ω", yLabel: "|GH| (dB)", xStep: 1, yStep: 40, origin: false });
    mp.line(XR[0], 0, XR[1], 0, { color: "muted", width: 1.3, dash: "5 4" });
    mp.text(XR[0] + 0.04, 0, "0 dB", { color: "muted", size: 10, anchor: "start", dy: -5 });
    mp.curve((x) => dB(10 ** x), { color: "q-x", width: 2.6, samples: 500 });

    /* --- phase ---------------------------------------------------------- */
    pp.grid({ xStep: 0.25, yStep: 45 });
    pp.axes({ xLabel: "log₁₀ ω", yLabel: "∠GH  (°)", xStep: 1, yStep: 90, origin: false });
    pp.line(XR[0], -180, XR[1], -180, { color: "q-bad", width: 1.3, dash: "5 4" });
    pp.text(XR[0] + 0.04, -180, "−180°", { color: "q-bad", size: 10, anchor: "start", dy: -5 });
    pp.curve((x) => phaseOf(pl, 10 ** x), { color: "q-y", width: 2.6, samples: 500 });

    /* --- the two measurements ------------------------------------------- */
    if (wgc != null) {
      const xg = Math.log10(wgc);
      mp.line(xg, -80, xg, 0, { color: "q-r", width: 1.2, dash: "3 3" });
      mp.dot(xg, 0, { color: "q-r", r: 4.5 });
      pp.line(xg, -285, xg, phaseOf(pl, wgc), { color: "q-r", width: 1.2, dash: "3 3" });
      pp.line(xg, -180, xg, phaseOf(pl, wgc), { color: "q-r", width: 3.4 });
      pp.dot(xg, phaseOf(pl, wgc), { color: "q-r", r: 4.5 });
      pp.text(xg, phaseOf(pl, wgc), `PM ${fixed(pm, 1)}°`,
        { color: "q-r", size: 11, weight: 700, anchor: "start", dx: 9, dy: pm > 0 ? -9 : 17, bg: true });
    }
    if (wpc != null) {
      const xp = Math.log10(wpc);
      pp.line(xp, -285, xp, -180, { color: "q-bad", width: 1.2, dash: "3 3" });
      pp.dot(xp, -180, { color: "q-bad", r: 4.5 });
      mp.line(xp, -80, xp, dB(wpc), { color: "q-bad", width: 1.2, dash: "3 3" });
      mp.line(xp, 0, xp, dB(wpc), { color: "q-bad", width: 3.4 });
      mp.dot(xp, dB(wpc), { color: "q-bad", r: 4.5 });
      mp.text(xp, dB(wpc), `GM ${fixed(gm, 1)} dB`,
        { color: "q-bad", size: 11, weight: 700, anchor: "start", dx: 9, dy: gm > 0 ? 16 : -9, bg: true });
    }

    rdK.set(sig(K, 3));
    rdWgc.set(wgc == null ? "—" : `${sig(wgc, 3)} rad/s`);
    rdPm.set(pm == null ? "—" : `${fixed(pm, 1)}°`);
    rdWpc.set(wpc == null ? "never" : `${sig(wpc, 3)} rad/s`);
    rdGm.set(gm == null ? "∞" : `${fixed(gm, 1)} dB`);

    const bad = (pm != null && pm <= 0) || (gm != null && gm <= 0);
    rdNote.set(
      gm == null
        ? `<b>The phase never reaches −180°, so there is no phase crossover and the gain margin is infinite.</b> ${pl.story}`
        : bad
          ? `<b>Negative margins: the closed loop is unstable.</b> At the phase crossover the loop returns a signal ${fixed(-gm, 1)} dB <em>larger</em> than it started, inverted — which is a signal that reinforces itself round and round. Bring K below ${sig(K * 10 ** (gm / 20), 3)} and both margins come back.`
          : `<b>PM ${fixed(pm, 1)}° and GM ${fixed(gm, 1)} dB.</b> Read them as distances to disaster: the loop could take ${fixed(gm, 1)} dB more gain, <em>or</em> ${fixed(pm, 1)}° more phase lag, before the poles reach the imaginary axis. ${
            pm >= 45 && gm >= 6
              ? "<b>Both are in the range a design would aim for</b> — roughly 45–65° of phase and 6–12 dB of gain."
              : "<b>That is thinner than a design should be.</b> The usual targets are 45–60° of phase and 6–12 dB of gain, and the reason is that plants drift and the margins are what absorbs the drift."
          } ${pl.story}`
    );
  }

  const k = knob({
    label: "gain K", min: 2, max: 1000, step: 1,
    value: Math.round((PLANTS.three.kStart / PLANTS.three.kMax) * 1000),
    format: (v) => sig((v / 1000) * PLANTS[cur].kMax, 3),
    onInput: draw,
  });
  const sc = scenarios({
    label: "open loop GH",
    options: Object.keys(PLANTS).map((id) => ({ id, label: PLANTS[id].label })),
    value: "three",
    onChange: (id) => {
      cur = id;
      k.set(Math.max(2, Math.round((PLANTS[id].kStart / PLANTS[id].kMax) * 1000)));
    },
  });
  draw(k.value());

  return {
    stage: el("div.stack", null, mp.root, pp.root),
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdK, rdWgc, rdPm, rdWpc, rdGm, rdNote),
  };
}

/* ==========================================================================
   Plate 96 — what a phase margin feels like
   ========================================================================== */

/** Exact phase margin of the standard second-order loop, from ζ. */
function pmOf(zeta) {
  const r = Math.sqrt(Math.sqrt(1 + 4 * zeta ** 4) - 2 * zeta * zeta);
  return Math.atan(2 * zeta / r) * DEG;
}

/** Invert it. Monotone in ζ over the range that matters. */
function zetaOfPm(pm) {
  let lo = 0.005, hi = 1.4;
  for (let i = 0; i < 70; i++) {
    const m = (lo + hi) / 2;
    if (pmOf(m) < pm) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

/** Unit step of a normalised second-order system, ωn = 1. */
function step2(zeta) {
  if (zeta < 1) {
    const wd = Math.sqrt(1 - zeta * zeta);
    return (t) => 1 - Math.exp(-zeta * t) * (Math.cos(wd * t) + (zeta / wd) * Math.sin(wd * t));
  }
  return (t) => 1 - Math.exp(-t) * (1 + t);
}

function marginFeel() {
  const cp = new Plot({
    w: 620, h: 210, xr: [8, 80], yr: [0, 80],
    pad: { l: 52, r: 20, t: 14, b: 34 },
    label: "Percent overshoot against phase margin, with the linear rule of thumb overlaid.",
  });
  const sp = new Plot({
    w: 620, h: 210, xr: [0, 16], yr: [-0.1, 1.9],
    pad: { l: 52, r: 20, t: 14, b: 34 },
    label: "The closed-loop step response at the selected phase margin.",
  });

  const rdPm = readout({ key: "phase margin", value: "", tone: "x" });
  const rdZeta = readout({ key: "damping ratio", value: "", tone: "r" });
  const rdRule = readout({ key: "rule of thumb", value: "", tone: "y" });
  const rdOs = readout({ key: "overshoot", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(pm) {
    cp.clear("curve", "label", "mark", "shade");
    sp.clear("curve", "label", "mark", "shade");

    const z = zetaOfPm(pm);
    const rule = pm / 100;
    const os = overshoot(z);

    cp.grid({ xStep: 5, yStep: 10 });
    cp.axes({ xLabel: "phase margin (°)", yLabel: "%OS", xStep: 20, yStep: 20, origin: false });
    cp.curve((x) => overshoot(zetaOfPm(Math.max(1, x))), { color: "q-x", width: 2.6, samples: 240 });
    cp.curve((x) => overshoot(Math.min(0.999, x / 100)), { color: "q-y", width: 1.8, dash: "6 4", samples: 240 });
    cp.line(72, 7, 72, 32, { color: "q-y", width: 1, dash: "3 3" });
    cp.text(72, 34, "ζ ≈ PM/100", { color: "q-y", size: 10.5, weight: 600, anchor: "end", dx: 7 });
    cp.text(20, 22, "exact", { color: "q-x", size: 10.5, weight: 600, anchor: "start", italic: true });
    cp.line(20, 26, 20, 52, { color: "q-x", width: 1, dash: "3 3" });
    cp.dot(pm, os, { color: "q-r", r: 5 });
    cp.line(pm, 0, pm, os, { color: "q-r", width: 1.1, dash: "3 3" });

    sp.grid({ xStep: 2, yStep: 0.25 });
    sp.axes({ xLabel: "ωn t", yLabel: "output", xStep: 4, yStep: 0.5, origin: false });
    sp.line(0, 1, 16, 1, { color: "muted", width: 1.2, dash: "5 4" });
    sp.curve(step2(z), { color: "q-r", width: 2.6, samples: 600 });
    if (os > 0.05) {
      const tp = Math.PI / Math.sqrt(1 - z * z);
      sp.dot(tp, 1 + os / 100, { color: "q-r", r: 4.5 });
      sp.text(tp, 1 + os / 100, `${fixed(os, 1)}%`,
        { color: "q-r", size: 10.5, weight: 600, anchor: "start", dx: 8, dy: -5 });
    }

    rdPm.set(`${num(pm, 0)}°`);
    rdZeta.set(fixed(z, 3), " exact");
    rdRule.set(fixed(rule, 3), ` = ${num(pm, 0)}/100`);
    rdOs.set(`${fixed(os, 1)}%`);

    const err = Math.abs(rule - z) / z * 100;
    rdNote.set(
      pm >= 55 && pm <= 65
        ? `<b>The design default, and the cast again.</b> A phase margin of about 60° puts ζ at ${fixed(z, 2)}, which gives ${fixed(os, 1)}% overshoot — the same pair of numbers as −3 ± 4j, the 3-4-5 triangle and ζ = 0.6. <b>When someone says a loop should have 60° of phase margin, this is what they are asking for</b>: a response that arrives quickly and overshoots by under ten per cent.`
        : pm < 30
          ? `<b>A thin phase margin is a ringing system.</b> At ${num(pm, 0)}° the damping is only ${fixed(z, 2)} and the response overshoots by ${fixed(os, 1)}% — and that is with the plant behaving exactly as modelled. <b>Margins are the allowance for being wrong</b>, and there is almost none here.`
          : pm > 70
            ? `<b>Very well damped, and paying for it in speed.</b> ${num(pm, 0)}° of margin gives ζ = ${fixed(z, 2)} and hardly any overshoot, but the only way to get it is to turn the gain down — which lowers the crossover frequency and makes everything slower. <b>Note the rule of thumb has broken down</b>: it says ζ = ${fixed(rule, 2)}, off by ${fixed(err, 0)}%, because it is a straight-line fit to a curve that flattens.`
            : `At ${num(pm, 0)}° the exact damping is ${fixed(z, 3)} and the overshoot ${fixed(os, 1)}%. The rule of thumb ζ ≈ PM/100 gives ${fixed(rule, 3)} — <b>${err < 8 ? "within a few per cent, which is why it is worth carrying" : `off by ${fixed(err, 0)}%, so treat it as an estimate`}</b>. It is a straight line drawn through a curve, and it is at its best between about 30° and 65°.`
    );
  }

  const k = knob({
    label: "phase margin", min: 8, max: 80, step: 1, value: 60,
    format: (v) => `${num(v, 0)}°`,
    onInput: draw,
  });
  draw(60);

  return {
    stage: el("div.stack", null, cp.root, sp.root),
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdPm, rdZeta, rdRule, rdOs, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("marginPlot", { no: 95, build: () => {
  const f = marginPlot();
  return plate({
    no: 95, title: "Two distances to disaster", tag: "interactive",
    label: "Open-loop Bode magnitude and phase, with the gain and phase margins marked.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Both margins are measured at a crossing, and it is worth being exact " +
      "about which. <b>Gain margin</b> is read where the <em>phase</em> passes " +
      "−180°: how many more decibels the loop could take. <b>Phase margin</b> " +
      "is read where the <em>magnitude</em> passes 0 dB: how much more lag it " +
      "could take. Turn the gain up on the middle plant and both go to zero " +
      "together at <b>K = 160</b>, at <b>ω = 4 rad/s</b> — the numbers Part 3's " +
      "Routh array produced from the coefficients alone.",
  });
} });

register("marginFeel", { no: 96, build: () => {
  const f = marginFeel();
  return plate({
    no: 96, title: "What a phase margin feels like", tag: "interactive",
    label: "Percent overshoot against phase margin, above the step response at that margin.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "A margin is a frequency-domain number and a specification is a " +
      "time-domain one, so the bridge between them gets used constantly: " +
      "<b>ζ ≈ PM/100</b>. It is a straight line through a curve and it is good " +
      "from roughly 30° to 65°, which happens to cover almost every design. " +
      "<b>60° of phase margin means ζ ≈ 0.6, which means about 9.5% " +
      "overshoot</b> — and that is the same triangle this compilation has been " +
      "following since Mathematics Part 1, arriving now as a rule of thumb.",
  });
} });
