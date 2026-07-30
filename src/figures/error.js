/* ==========================================================================
   figures/error.js — Plates 97 and 98.

   Plate 97 is the definition made visible: three plants, three inputs, and
   the gap that is left when the transient has died. The whole of system type
   is the observation that the gap depends on how many integrators the loop
   already contains.

   Plate 98 is the reason Part 6 exists. Raising the gain shrinks the error
   and wrecks the response, and the two curves cross in a place nobody wants
   to stand.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed, sig } from "../lib/fmt.js";
import { simulate, add, mul } from "../lib/poly.js";

const DEG = 180 / Math.PI;

/* -------------------------------------------------------------------------
   Plate 97 — system type, and the gap it leaves
   ------------------------------------------------------------------------- */

const TYPES = {
  t0: {
    label: "type 0",
    tex: "K / (s+1)(s+4)",
    /* forward path numerator and denominator, with K factored out */
    n: [1], d: [1, 5, 4],
    consts: (K) => ({ Kp: K / 4, Kv: 0, Ka: 0 }),
    story: "No integrator in the loop, so a constant error is the only way the plant can be told to hold a constant output — <b>the error <em>is</em> the command</b>. Raise K and the error shrinks, but it never reaches zero, and it can only be made small by making the loop violent.",
  },
  t1: {
    label: "type 1",
    tex: "K / s(s+4)",
    n: [1], d: [1, 4, 0],
    consts: (K) => ({ Kp: Infinity, Kv: K / 4, Ka: 0 }),
    story: "One integrator. <b>A step is now tracked exactly</b> — the integrator holds whatever output is needed with no error to sustain it. A ramp is a different matter: the integrator has to keep climbing, and that takes a steady error to drive it.",
  },
  t2: {
    label: "type 2",
    tex: "K(s+1) / s²(s+4)",
    n: [1, 1], d: [1, 4, 0, 0],
    consts: (K) => ({ Kp: Infinity, Kv: Infinity, Ka: K / 4 }),
    story: "Two integrators, so steps and ramps are both tracked exactly and only an accelerating command leaves a gap. <b>The zero is not decoration</b> — without it, s³ + 4s² + K has no s term and the loop is unstable at every gain.",
  },
};

const INPUTS = {
  step: {
    label: "step", u: () => 1, tMax: 8, yr: [-0.15, 1.5], key: "Kp",
    tex: "r(t) = 1", eOf: (c) => 1 / (1 + c.Kp),
  },
  ramp: {
    label: "ramp", u: (t) => t, tMax: 8, yr: [-0.4, 8.8], key: "Kv",
    tex: "r(t) = t", eOf: (c) => 1 / c.Kv,
  },
  para: {
    label: "parabola", u: (t) => t * t / 2, tMax: 4, yr: [-0.5, 9.5], key: "Ka",
    tex: "r(t) = t²/2", eOf: (c) => 1 / c.Ka,
  },
};

const inf = (v) => (Number.isFinite(v) ? sig(v, 3) : "∞");

function systemType() {
  const host = el("div");
  const rdType = readout({ key: "system type", value: "", tone: "x" });
  const rdKp = readout({ key: "Kp", value: "", tone: "y" });
  const rdKv = readout({ key: "Kv", value: "", tone: "y" });
  const rdKa = readout({ key: "Ka", value: "", tone: "y" });
  const rdErr = readout({ key: "steady error", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let curT = "t1", curI = "step";

  function draw(K) {
    const ty = TYPES[curT], inp = INPUTS[curI];
    const p = new Plot({
      w: 620, h: 268, xr: [0, inp.tMax], yr: inp.yr,
      pad: { l: 50, r: 20, t: 14, b: 36 },
      label: `The command and the output against time, showing the gap left in steady state for a ${inp.label} input.`,
    });
    host.replaceChildren(p.root);

    /* closed loop: KN / (D + KN) */
    const kn = mul(ty.n, [K]);
    const cl = add(ty.d, kn);
    const r = simulate(kn, cl, inp.u, inp.tMax, 1200);

    p.grid({ xStep: inp.tMax / 8, yStep: (inp.yr[1] - inp.yr[0]) / 8 });
    p.axes({
      xLabel: "t  (s)", yLabel: "", xStep: inp.tMax / 4,
      yStep: inp.yr[1] > 3 ? 2 : 0.5, origin: false,
    });
    p.curve(inp.u, { color: "q-x", width: 1.8, dash: "6 4", samples: 200 });
    p.text(inp.tMax * 0.34, inp.u(inp.tMax * 0.34), "command",
      { color: "q-x", size: 10.5, weight: 600, anchor: "middle", dy: -9, bg: true });

    const at = (t) => r[Math.min(r.length - 1, Math.round(t / inp.tMax * (r.length - 1)))][1];
    p.curve(at, { color: "q-r", width: 2.6, samples: 500 });
    p.text(inp.tMax * 0.6, at(inp.tMax * 0.6), "output",
      { color: "q-r", size: 10.5, weight: 600, anchor: "middle", dy: 18, bg: true });

    /* the gap, drawn where it has settled */
    const tm = inp.tMax * 0.82;
    const gap = inp.u(tm) - at(tm);
    if (Math.abs(gap) > (inp.yr[1] - inp.yr[0]) * 0.012) {
      p.line(tm, at(tm), tm, inp.u(tm), { color: "q-bad", width: 3 });
      p.text(tm, (at(tm) + inp.u(tm)) / 2, `e = ${sig(Math.abs(gap), 3)}`,
        { color: "q-bad", size: 11, weight: 700, anchor: "end", dx: -9, bg: true });
    } else {
      p.text(tm, inp.u(tm), "no gap — tracked exactly",
        { color: "q-r", size: 11, weight: 700, anchor: "end", dx: -10, dy: 20, bg: true });
    }

    const c = ty.consts(K);
    const e = inp.eOf(c);
    rdType.set(ty.label, ` · ${ty.tex}`);
    rdKp.set(inf(c.Kp));
    rdKv.set(inf(c.Kv));
    rdKa.set(inf(c.Ka));
    rdErr.set(e === 0 ? "0" : Number.isFinite(e) ? sig(e, 3) : "grows without bound");

    rdNote.set(
      e === 0
        ? `<b>Zero error.</b> The loop has more integrators than the input needs, so the output ends up exactly on the command and the error signal driving it settles to nothing. <b>An integrator can hold an output with no input</b> — that is the entire trick, and it is why adding one is the standard fix. ${ty.story}`
        : Number.isFinite(e)
          ? `<b>A constant gap of ${sig(e, 3)}</b>, which is ${inp.key} = ${inf(c[inp.key])} doing its work: ${inp.key === "Kp" ? "e = 1/(1 + Kp)" : `e = 1/${inp.key}`}. The output never catches the command and never falls further behind — <b>it needs that error to keep going</b>. Turn K up and the gap narrows in proportion, which is the only lever this loop has. ${ty.story}`
          : `<b>The error grows without bound.</b> This loop does not have enough integrators for this input: the command keeps demanding more than the plant can be told to deliver, and the output falls steadily further behind. ${ty.story}`
    );
  }

  const k = knob({
    label: "gain K", min: 1, max: 30, step: 1, value: 8,
    format: (v) => num(v, 0), onInput: draw,
  });
  const scT = scenarios({
    label: "open loop",
    options: Object.keys(TYPES).map((id) => ({ id, label: TYPES[id].tex })),
    value: "t1",
    onChange: (id) => { curT = id; draw(k.value()); },
  });
  const scI = scenarios({
    label: "command",
    options: Object.keys(INPUTS).map((id) => ({ id, label: INPUTS[id].tex })),
    value: "step",
    onChange: (id) => { curI = id; draw(k.value()); },
  });
  draw(8);

  return {
    stage: host,
    controls: el("div.controls", null, scT.root, scI.root, k.root),
    readouts: readouts(rdType, rdKp, rdKv, rdKa, rdErr, rdNote),
  };
}

/* -------------------------------------------------------------------------
   Plate 98 — the trade the gain cannot win
   ------------------------------------------------------------------------- */

const TRADE = { poles: [1, 2, 4], den: [1, 7, 14, 8], kCrit: 90 };

/** Overshoot of the closed-loop step response, from the simulation itself. */
function overshootAt(K) {
  const cl = add(TRADE.den, [K]);
  const final = K / (8 + K);
  const r = simulate([K], cl, () => 1, 26, 900);
  const peak = Math.max(...r.map((p) => p[1]));
  return Math.max(0, (peak / final - 1) * 100);
}

const CURVES = (() => {
  const pts = [];
  for (let i = 0; i <= 118; i++) {
    const K = 1 + (i / 118) * 87;
    pts.push([K, 800 / (8 + K), overshootAt(K)]);
  }
  return pts;
})();

/* Linear interpolation between the cached samples, or the curve draws as a
   staircase where the plot samples finer than the cache does. */
const sampleAt = (K, j) => {
  const x = Math.max(0, Math.min(118, (K - 1) / 87 * 118));
  const i = Math.floor(x), f = x - i;
  const a = CURVES[i][j], b = CURVES[Math.min(118, i + 1)][j];
  return a + (b - a) * f;
};

function errorTradeoff() {
  const p = new Plot({
    w: 620, h: 300, xr: [0, 90], yr: [0, 100],
    pad: { l: 50, r: 20, t: 16, b: 38 },
    label: "Steady-state error and percent overshoot, both plotted against loop gain.",
  });

  const rdK = readout({ key: "gain K", value: "", tone: "x" });
  const rdKp = readout({ key: "Kp", value: "", tone: "y" });
  const rdErr = readout({ key: "steady error", value: "", tone: "r" });
  const rdOs = readout({ key: "overshoot", value: "", tone: "bad" });
  const rdPm = readout({ key: "phase margin", value: "", tone: "y" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  /* Phase margin of K/[(s+1)(s+2)(s+4)], computed the Part 4 way. */
  function pmAt(K) {
    const mag = (w) => K / TRADE.poles.reduce((a, q) => a * Math.hypot(w, q), 1);
    const ph = (w) => -TRADE.poles.reduce((a, q) => a + Math.atan(w / q) * DEG, 0);
    let lo = -3, hi = 3;
    if (mag(10 ** lo) < 1) return null;
    for (let i = 0; i < 70; i++) {
      const m = (lo + hi) / 2;
      if (mag(10 ** m) > 1) lo = m; else hi = m;
    }
    return 180 + ph(10 ** ((lo + hi) / 2));
  }

  function draw(K) {
    p.clear("curve", "label", "mark", "shade");
    p.grid({ xStep: 10, yStep: 10 });
    p.axes({ xLabel: "loop gain K", yLabel: "per cent", xStep: 20, yStep: 20, origin: false });

    p.curve((x) => sampleAt(x, 1), { color: "q-r", width: 2.6, samples: 240 });
    p.curve((x) => sampleAt(x, 2), { color: "q-bad", width: 2.6, samples: 240 });
    p.text(11, sampleAt(11, 1), "steady-state error",
      { color: "q-r", size: 10.5, weight: 600, anchor: "start", dx: 9, dy: -9 });
    p.text(66, sampleAt(66, 2), "overshoot",
      { color: "q-bad", size: 10.5, weight: 600, anchor: "end", dx: -8, dy: 14 });

    p.line(TRADE.kCrit, 0, TRADE.kCrit, 100, { color: "q-bad", width: 1.6, dash: "5 4" });
    p.text(TRADE.kCrit, 96, "unstable at K = 90",
      { color: "q-bad", size: 10.5, weight: 600, anchor: "end", dx: -7 });

    const e = 800 / (8 + K), os = sampleAt(K, 2), pm = pmAt(K);
    p.line(K, 0, K, 100, { color: "ink-strong", width: 1.4 });
    p.dot(K, e, { color: "q-r", r: 5 });
    p.dot(K, os, { color: "q-bad", r: 5 });

    rdK.set(sig(K, 3));
    rdKp.set(sig(K / 8, 3));
    rdErr.set(`${fixed(e, 1)}%`, " to a step");
    rdOs.set(`${fixed(os, 1)}%`);
    rdPm.set(pm == null ? "—" : `${fixed(pm, 1)}°`);

    rdNote.set(
      K < 15
        ? `<b>Well damped and badly wrong.</b> The overshoot is only ${fixed(os, 1)}% but the output settles ${fixed(e, 1)}% short of where it was told to go, for ever. <b>A type-0 loop needs an error to hold its output</b>, so the only way to shrink the error is to raise the gain — and the next few turns of the knob show what that costs.`
        : K > 60
          ? `<b>Accurate and unusable.</b> The error is down to ${fixed(e, 1)}% and the overshoot is up to ${fixed(os, 1)}%, with only ${pm == null ? "no" : fixed(pm, 1) + "°"} of phase margin left before K = 90 tips it over. <b>This is the wall.</b> Gain is one knob being asked to set two things, and past here it is setting neither of them well.`
          : `At K = ${sig(K, 3)}: error ${fixed(e, 1)}%, overshoot ${fixed(os, 1)}%, phase margin ${pm == null ? "—" : fixed(pm, 1) + "°"}. <b>Both curves are moving the wrong way for each other</b>, and no value of K makes both small — the best available is a compromise neither specification would have accepted on its own. <b>The way out is not a better gain but a different controller</b>, and Part 6 builds one.`
    );
  }

  const k = knob({
    label: "gain K", min: 1, max: 88, step: 1, value: 20,
    format: (v) => num(v, 0), onInput: draw,
  });
  draw(20);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdK, rdKp, rdErr, rdOs, rdPm, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("systemType", { no: 97, build: () => {
  const f = systemType();
  return plate({
    no: 97, title: "The gap that is left", tag: "interactive",
    label: "Command and output against time for three system types and three inputs.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Nine combinations, and one pattern runs through all of them: " +
      "<b>each integrator in the open loop buys the ability to track one more " +
      "order of input exactly</b>. Type 0 leaves a gap on a step, type 1 " +
      "closes that and leaves one on a ramp, type 2 closes that too. Go one " +
      "input past what the loop can handle and the error does not merely grow " +
      "large — it grows <em>without bound</em>, and no gain will help.",
  });
} });

register("errorTradeoff", { no: 98, build: () => {
  const f = errorTradeoff();
  return plate({
    no: 98, title: "One knob, two jobs", tag: "interactive",
    label: "Steady-state error and overshoot plotted against loop gain, showing that no gain makes both small.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "A type-0 loop, and the two things you want plotted against the one " +
      "thing you can change. <b>Error falls as the gain rises and overshoot " +
      "climbs to meet it</b>, and somewhere in the middle they cross at a value " +
      "neither specification would have signed off. This is not a tuning " +
      "failure — proportional gain is a single number being asked to set both " +
      "accuracy and damping. <b>Part 6 stops asking it to</b>, by adding terms " +
      "that act on the error's integral and its slope instead of its size.",
  });
} });
