/* ==========================================================================
   figures/pid.js — Plates 99 and 100.

   Part 5 ended on a plant where no proportional gain could meet the
   specification. Both plates here use that same plant, so the fix is visible
   as a fix rather than asserted.

   Plate 99 is the controller as three knobs and a response. Plate 100 opens
   the controller up and plots what each term is contributing moment by
   moment — which is the only way the integral term's trick ever really lands:
   it is the one whose output stays put when the error reaches zero.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed, sig } from "../lib/fmt.js";
import { simulate, add, roots } from "../lib/poly.js";

/* (s+1)(s+2)(s+4) — the plant Part 5 could not tame with gain alone. */
const PLANT = [1, 7, 14, 8];
const PLANT_DC = 8;

/**
 * Open loop of Kp + Ki/s + Kd·s in front of the plant. When Ki is zero the
 * integrator is not there at all, so the common factor of s is dropped rather
 * than left to cancel numerically.
 */
function openLoop(Kp, Ki, Kd) {
  return Ki > 1e-9
    ? { n: [Kd, Kp, Ki], d: [...PLANT, 0] }
    : { n: [Kd, Kp], d: PLANT.slice() };
}

const PRESETS = {
  p: { label: "P", Kp: 20, Ki: 0, Kd: 0 },
  pi: { label: "PI", Kp: 20, Ki: 10, Kd: 0 },
  pd: { label: "PD", Kp: 40, Ki: 0, Kd: 10 },
  pid: { label: "PID", Kp: 40, Ki: 20, Kd: 15 },
};

/**
 * Peak, 2% settling time and whether it settled at all. `final` is passed in
 * rather than read off the last sample, so this plate and plate 98 report the
 * same overshoot for the same system.
 */
function measure(r, tMax, final) {
  const ys = r.map((p) => p[1]);
  const peak = Math.max(...ys);
  let ts = 0;
  for (let i = r.length - 1; i > 0; i--) {
    if (Math.abs(ys[i] - final) > 0.02 * Math.max(1e-9, Math.abs(final))) { ts = r[i][0]; break; }
  }
  return { final, peak, ts, ran: ts >= tMax * 0.985 };
}

/* ==========================================================================
   Plate 99 — three knobs
   ========================================================================== */

const T_MAX = 10;

function pidTune() {
  const host = el("div");

  const rdErr = readout({ key: "steady error", value: "", tone: "r" });
  const rdOs = readout({ key: "overshoot", value: "", tone: "bad" });
  const rdTs = readout({ key: "settling, 2%", value: "", tone: "y" });
  const rdPoles = readout({ key: "closed-loop poles", value: "", tone: "x" });
  rdPoles.root.classList.add("wide");
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw() {
    const Kp = kP.value(), Ki = kI.value(), Kd = kD.value();
    const ol = openLoop(Kp, Ki, Kd);
    const cl = add(ol.d, ol.n);
    const rs = roots(cl);
    const unstable = rs.some((z) => z[0] > 1e-7);

    const p = new Plot({
      w: 620, h: 288, xr: [0, T_MAX], yr: [-0.25, 2.1],
      pad: { l: 50, r: 20, t: 14, b: 36 },
      label: "The closed-loop step response for the selected controller gains.",
    });
    host.replaceChildren(p.root);

    const r = simulate(ol.n, cl, () => 1, T_MAX, 1400);
    const at = (t) => r[Math.min(r.length - 1, Math.round(t / T_MAX * (r.length - 1)))][1];
    const final = Ki > 1e-9 ? 1 : Kp / (PLANT_DC + Kp);
    const m = measure(r, T_MAX, final);

    p.grid({ xStep: 0.5, yStep: 0.25 });
    p.axes({ xLabel: "t  (s)", yLabel: "output", xStep: 2, yStep: 0.5, origin: false });
    p.line(0, 1, T_MAX, 1, { color: "muted", width: 1.3, dash: "5 4" });
    p.text(T_MAX, 1, "the command", { color: "muted", size: 10, anchor: "end", dy: -6 });
    p.curve(at, { color: unstable ? "q-bad" : "q-r", width: 2.6, samples: 700 });

    const e = Ki > 1e-9 ? 0 : PLANT_DC / (PLANT_DC + Kp);
    const os = unstable ? Infinity : Math.max(0, (m.peak / Math.max(1e-9, m.final) - 1) * 100);

    if (!unstable && Math.abs(e) > 0.004) {
      p.line(T_MAX * 0.9, m.final, T_MAX * 0.9, 1, { color: "q-bad", width: 3 });
      p.text(T_MAX * 0.9, (m.final + 1) / 2, `e = ${fixed(e, 3)}`,
        { color: "q-bad", size: 11, weight: 700, anchor: "end", dx: -9, bg: true });
    }

    rdErr.set(unstable ? "—" : e === 0 ? "0" : fixed(e, 3), unstable ? "" : e === 0 ? " exactly" : "");
    rdOs.set(unstable ? "grows" : `${fixed(os, 1)}%`);
    rdTs.set(unstable ? "never" : m.ran ? `> ${num(T_MAX, 0)} s` : `${sig(m.ts, 3)} s`);
    rdPoles.set(rs.map(([x, y]) =>
      y === 0 ? num(x, 2) : `${num(x, 2)} ${y > 0 ? "+" : "−"} ${num(Math.abs(y), 2)}j`
    ).join(",&nbsp; "));

    rdNote.set(
      unstable
        ? `<b>Unstable.</b> A pole has crossed into the right half-plane, and the output grows without limit. <b>Derivative gain is the usual rescue here</b> — it adds phase lead where the loop needs it — while more integral gain almost always makes it worse, because an integrator adds 90° of lag at every frequency.`
        : Ki < 1e-9
          ? `<b>No integral term, so the error survives.</b> ${fixed(e * 100, 1)}% of the command, permanently, exactly as Part 5 predicted for a type-0 loop. ${Kd > 1e-9 ? `The derivative term has bought damping — overshoot is down to ${fixed(os, 1)}% — which allows a larger Kp than P alone could carry, but it cannot make the error zero. <b>Only an integrator can do that.</b>` : `Turn Kp up and the error shrinks while the overshoot climbs, which is plate 98's trade in miniature. <b>Add Ki and the error goes to zero at any Kp.</b>`}`
          : `<b>Zero steady-state error</b> — the integrator has made this a type-1 loop, and it stays exactly on the command with no error to sustain it. Overshoot ${fixed(os, 1)}%, settling ${m.ran ? "beyond the window" : `${sig(m.ts, 3)} s`}. ${
              os > 25
                ? "<b>The integral is costing you damping</b>: it adds 90° of lag, which eats phase margin. Raise Kd to buy it back."
                : Kd > 1e-9
                  ? "<b>All three terms earning their place</b>: proportional for speed, integral for accuracy, derivative for damping."
                  : "<b>Add a little Kd</b> and watch the overshoot fall without the error coming back — the derivative term acts only on the <em>changing</em> part of the error, so it has nothing to say in steady state."
            }`
    );
  }

  const kP = knob({ label: "Kp — proportional", min: 0, max: 80, step: 1, value: 20, format: (v) => num(v, 0), onInput: draw });
  const kI = knob({ label: "Ki — integral", min: 0, max: 60, step: 1, value: 0, format: (v) => num(v, 0), onInput: draw });
  const kD = knob({ label: "Kd — derivative", min: 0, max: 40, step: 1, value: 0, format: (v) => num(v, 0), onInput: draw });
  const sc = scenarios({
    label: "controller",
    options: Object.keys(PRESETS).map((id) => ({ id, label: PRESETS[id].label })),
    value: "p",
    onChange: (id) => {
      const q = PRESETS[id];
      kP.set(q.Kp, false); kI.set(q.Ki, false); kD.set(q.Kd, false);
      draw();
    },
  });
  draw();

  return {
    stage: host,
    controls: el("div.controls", null, sc.root, kP.root, kI.root, kD.root),
    readouts: readouts(rdErr, rdOs, rdTs, rdPoles, rdNote),
  };
}

/* ==========================================================================
   Plate 100 — what each term is contributing
   ========================================================================== */

function pidSignals() {
  const host = el("div");

  const rdP = readout({ key: "P term, final", value: "", tone: "x" });
  const rdI = readout({ key: "I term, final", value: "", tone: "r" });
  const rdD = readout({ key: "D term, final", value: "", tone: "y" });
  const rdU = readout({ key: "total effort, final", value: "", tone: "bad" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "pi";

  function draw(kpScale) {
    const q = PRESETS[cur];
    const Kp = Math.round(q.Kp * kpScale / 100);
    const Ki = q.Ki, Kd = q.Kd;
    const ol = openLoop(Kp, Ki, Kd);
    const cl = add(ol.d, ol.n);

    /* The error itself is a transfer function: E/R = 1/(1 + GcG) = d/(d + n). */
    const N = 1600;
    const er = simulate(ol.d, cl, () => 1, T_MAX, N);
    const ts = er.map((p) => p[0]), es = er.map((p) => p[1]);
    const h = T_MAX / N;

    /* integral by trapezoid, derivative by central difference — both on the
       same sampled error, so the three terms are guaranteed consistent */
    const ints = [0];
    for (let i = 1; i < es.length; i++) ints.push(ints[i - 1] + (es[i] + es[i - 1]) / 2 * h);
    const ders = es.map((_, i) =>
      i === 0 || i === es.length - 1 ? 0 : (es[i + 1] - es[i - 1]) / (2 * h));

    const uP = es.map((v) => Kp * v);
    const uI = ints.map((v) => Ki * v);
    const uD = ders.map((v) => Kd * v);
    const uT = uP.map((v, i) => v + uI[i] + uD[i]);

    const lo = Math.min(0, ...uT, ...uD, ...uP, ...uI);
    const hi = Math.max(...uT, ...uP, ...uI, 1);
    const pad = (hi - lo) * 0.12;

    const ep = new Plot({
      w: 620, h: 170, xr: [0, T_MAX], yr: [-0.35, 1.15],
      pad: { l: 50, r: 20, t: 12, b: 30 },
      label: "The error signal against time.",
    });
    const up = new Plot({
      w: 620, h: 250, xr: [0, T_MAX], yr: [lo - pad, hi + pad],
      pad: { l: 50, r: 20, t: 14, b: 36 },
      label: "The three controller terms and their sum, against time.",
    });
    host.replaceChildren(ep.root, up.root);

    const sample = (arr) => (t) => arr[Math.min(arr.length - 1, Math.round(t / T_MAX * (arr.length - 1)))];

    ep.grid({ xStep: 0.5, yStep: 0.25 });
    ep.axes({ xLabel: "", yLabel: "error e(t)", xStep: 2, yStep: 0.5, origin: false });
    ep.line(0, 0, T_MAX, 0, { color: "muted", width: 1.2, dash: "5 4" });
    ep.curve(sample(es), { color: "q-bad", width: 2.6, samples: 600 });

    up.grid({ xStep: 0.5, yStep: (hi - lo) / 8 });
    up.axes({ xLabel: "t  (s)", yLabel: "control effort u(t)", xStep: 2, yStep: Math.max(1, Math.round((hi - lo) / 4)), origin: false });
    up.line(0, 0, T_MAX, 0, { color: "muted", width: 1.2, dash: "5 4" });
    if (Kd > 0) up.curve(sample(uD), { color: "q-y", width: 1.9, samples: 600 });
    if (Ki > 0) up.curve(sample(uI), { color: "q-r", width: 2.2, samples: 600 });
    up.curve(sample(uP), { color: "q-x", width: 1.9, samples: 600 });
    up.curve(sample(uT), { color: "ink-strong", width: 2.8, samples: 600 });

    const lbl = (arr, col, name, frac) => {
      const t = T_MAX * frac;
      up.text(t, sample(arr)(t), name,
        { color: col, size: 10.5, weight: 600, anchor: "start", dx: 7, dy: -7, bg: true });
    };
    lbl(uP, "q-x", "Kp · e", 0.035);
    if (Ki > 0) lbl(uI, "q-r", "Ki ∫e dt", 0.52);
    if (Kd > 0) lbl(uD, "q-y", "Kd · de/dt", 0.10);
    lbl(uT, "ink-strong", "total u", 0.76);

    const last = (a) => a[a.length - 1];
    rdP.set(fixed(last(uP), 2));
    rdI.set(Ki > 0 ? fixed(last(uI), 2) : "—");
    rdD.set(Kd > 0 ? fixed(last(uD), 2) : "—");
    rdU.set(fixed(last(uT), 2));

    rdNote.set(
      Ki > 0
        ? `<b>Look at where the effort ends up.</b> The error has gone to zero, so the P term is zero and the D term is zero — and yet the controller is still pushing ${fixed(last(uI), 2)} into the plant, all of it from the integral. <b>That stored value is what holds the output on target with nothing to drive it.</b> The integrator remembers how much push was needed and keeps supplying it, which is precisely what a type-0 plant cannot do for itself.`
        : `<b>No integral term, so the effort is proportional to the error — and it can never be zero.</b> The output settles where the P${Kd > 0 ? " and D" : ""} terms happen to produce exactly the push the plant needs, which requires a permanent error of ${fixed(last(es), 3)} to generate. ${Kd > 0 ? "<b>The derivative term does its work early</b> and then vanishes: it responds to the error's <em>slope</em>, and in steady state the slope is zero." : "<b>Add an integral term</b> and watch the P term walk down to zero while the total effort stays where it was."}`
    );
  }

  const k = knob({
    label: "Kp scaling", min: 40, max: 200, step: 5, value: 100,
    format: (v) => `${num(v, 0)}%`, onInput: draw,
  });
  const sc = scenarios({
    label: "controller",
    options: Object.keys(PRESETS).map((id) => ({ id, label: PRESETS[id].label })),
    value: "pi",
    onChange: (id) => { cur = id; draw(k.value()); },
  });
  draw(100);

  return {
    stage: host,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdP, rdI, rdD, rdU, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("pidTune", { no: 99, build: () => {
  const f = pidTune();
  return plate({
    no: 99, title: "Three knobs, three jobs", tag: "interactive",
    label: "The closed-loop step response of a PID controller on a third-order plant, with the three gains adjustable.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The plant is the one Part 5 could not satisfy with gain alone. Start on " +
      "<b>P</b> and note the permanent 28.6% error; switch to <b>PI</b> and it " +
      "goes to zero exactly, at the cost of overshoot; add <b>D</b> and the " +
      "overshoot comes back down without the error returning. <b>Each term " +
      "answers a different question</b> — proportional asks how big the error " +
      "is, integral how long it has been there, derivative which way it is " +
      "heading — which is why one knob could never do all three.",
  });
} });

register("pidSignals", { no: 100, build: () => {
  const f = pidSignals();
  return plate({
    no: 100, title: "What each term is doing", tag: "interactive",
    label: "The error signal, above the three PID terms and their sum.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The controller opened up. Watch the end of the trace with <b>PI</b> " +
      "selected: the error is zero, so the proportional term is zero — and the " +
      "total effort is not, because the integral is holding a value it " +
      "accumulated earlier and has no reason to give up. <b>That is the entire " +
      "mechanism by which integral action removes steady-state error</b>, and " +
      "it is also why integrators wind up: if the plant cannot deliver, the " +
      "term keeps growing regardless.",
  });
} });
