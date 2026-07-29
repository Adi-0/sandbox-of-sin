/* ==========================================================================
   figures/transient.js — Plates 76 and 77.

   Plate 76 is the claim that four different circuits are one curve. The knob
   is time in units of τ, not seconds, because that is the whole point: once
   the axis is τ the RC charge, the RC discharge, the RL current rise and the
   RL current decay are the same drawing.

   Plate 77 is the three-step method — initial value, final value, time
   constant — running on a circuit where none of the three is obvious. The
   resistor knob moves the final value and the time constant together, which
   is what makes the recipe worth having rather than a formula to memorise.
   ========================================================================== */

import { el, svg, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { Schematic } from "../lib/circuit.js";
import { fixed, num } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;

/* The four first-order transients on the exam. Each is either a rise towards
   a final value or a decay towards zero, and `rise` is the only difference. */
const CASES = {
  rcv: {
    name: "RC charging", rise: true,
    sym: "v_C", unit: "V", full: 10,
    tau: "τ = RC",
    what: "The capacitor's voltage climbing towards the source.",
    why: "A capacitor resists a <em>change</em> in voltage, not voltage itself. At t = 0 it is still at 0 V and behaves like a short, so the current is at its largest and the voltage climbs fastest. As it charges, less voltage is left across the resistor, so the current — and the rate of climb — fall in proportion. <b>A rate proportional to what remains is exactly what produces an exponential.</b>",
  },
  rcd: {
    name: "RC discharging", rise: false,
    sym: "v_C", unit: "V", full: 10,
    tau: "τ = RC",
    what: "The same capacitor emptying into the same resistor.",
    why: "Nothing is driving it now, so all the current comes from the stored charge. The current is <b>v/R</b>, and the voltage falls at a rate proportional to the current — proportional, again, to what is left. Same curve, mirrored.",
  },
  rli: {
    name: "RL current rise", rise: true,
    sym: "i_L", unit: "A", full: 2,
    tau: "τ = L/R",
    what: "The inductor's current building towards its steady value.",
    why: "An inductor resists a change in <em>current</em>. At t = 0 the current is zero whatever the source says, so the inductor behaves like an open circuit and takes the whole source voltage. As the current builds, less voltage is left across the inductor, so <b>di/dt</b> falls in proportion — the same argument as the capacitor with the roles of voltage and current exchanged.",
  },
  rld: {
    name: "RL current decay", rise: false,
    sym: "i_L", unit: "A", full: 2,
    tau: "τ = L/R",
    what: "The same inductor's current collapsing through the same resistor.",
    why: "The stored current has to keep flowing — that is what an inductor <em>is</em> — so it flows through R and dissipates. <b>This is why breaking an inductive circuit sparks:</b> open the switch and R becomes the air gap, so L·di/dt produces whatever voltage it takes to keep the current going for an instant.",
  },
};

/* What fraction of the way there the curve is, at each whole time constant.
   Worth knowing on sight — questions are frequently posed in these terms. */
const MARKS = [1, 2, 3, 4, 5];

/* ==========================================================================
   Plate 76 — one curve, four circuits
   ========================================================================== */

function firstOrder() {
  const p = new Plot({
    w: 620, h: 340, xr: [-0.45, 5.6], yr: [-0.22, 1.22],
    pad: { l: 54, r: 22, t: 20, b: 40 },
    label:
      "An exponential curve plotted against time in units of the time " +
      "constant, with markers at one to five time constants and a cursor the " +
      "reader can move along it.",
  });

  const rdCase = readout({ key: "circuit", value: "" });
  const rdTau = readout({ key: "time constant", value: "", tone: "x" });
  const rdAt = readout({ key: "at", value: "", tone: "y" });
  const rdPct = readout({ key: "fraction there", value: "", tone: "r" });
  const rdVal = readout({ key: "value", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "rcv";

  function draw(tenths) {
    const t = tenths / 10;
    p.clear("curve", "label", "mark", "shade");
    const C = CASES[cur];
    const f = (x) => (C.rise ? 1 - Math.exp(-x) : Math.exp(-x));

    p.grid({ xStep: 1, yStep: 0.25 });
    p.axes({
      xLabel: "t / τ", yLabel: C.rise ? "fraction of final" : "fraction of initial",
      xStep: 1, yStep: 0.25, arrows: true,
    });

    // the tangent at the origin reaches the final value at exactly one τ,
    // which is how τ is read off an oscilloscope
    p.line(0, C.rise ? 0 : 1, 1, C.rise ? 1 : 0,
      { color: "muted", width: 1.2, dash: "4 3" });
    p.text(2.5, C.rise ? 0.30 : 0.74,
      "the initial slope would arrive at 1τ", { color: "muted", size: 9.5, anchor: "start" });

    // nothing has happened before the switch closes: hold the starting value
    p.curve((x) => (x < 0 ? (C.rise ? 0 : 1) : f(x)), { color: "q-y", width: 2.6 });

    // every whole time constant, marked with the fraction reached
    for (const m of MARKS) {
      const y = f(m);
      p.line(m, 0, m, y, { color: "grid", width: 1 });
      p.dot(m, y, { color: "q-x", r: 3.4, ring: false });
      // the last one goes above the point: to its right is the axis label
      const last = m === MARKS[MARKS.length - 1];
      p.text(last ? m : m + 0.09,
        last ? y + 0.075 : y + (C.rise ? -0.055 : 0.045),
        `${fixed(y * 100, 1)}%`,
        { color: "q-x", size: 10, weight: 600, anchor: last ? "middle" : "start" });
    }

    // the cursor
    const y = f(t);
    p.line(t, 0, t, y, { color: "q-r", width: 1.6, dash: "4 3" });
    p.line(0, y, t, y, { color: "q-r", width: 1.6, dash: "4 3" });
    p.dot(t, y, { color: "q-r", r: 5 });

    const done = C.rise ? y : 1 - y;
    rdCase.set(C.name);
    rdTau.set(C.tau);
    rdAt.set(`${fixed(t, 1)} τ`);
    rdPct.set(`${fixed(done * 100, 1)}%`, C.rise ? " of the way up" : " of the way down");
    rdVal.set(`${C.sym.replace("_", "")} = ${fixed(y * C.full, 2)} ${C.unit}`,
      ` of ${C.full} ${C.unit}`);
    rdNote.set(`<b>${C.what}</b> ${C.why}`);
  }

  const k = knob({
    label: "time", min: 0, max: 55, step: 1, value: 15,
    format: (v) => `${fixed(v / 10, 1)} τ`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "circuit",
    options: Object.keys(CASES).map((id) => ({ id, label: CASES[id].name })),
    value: "rcv",
    onChange: (id) => { cur = id; draw(k.value()); },
  });
  draw(15);

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdCase, rdTau, rdAt, rdPct, rdVal, rdNote),
  };
}

/* ==========================================================================
   Plate 77 — the three-step method

   A 12 V source behind R1, feeding a capacitor with R2 across it. Closing the
   switch at t = 0 takes the capacitor from whatever it held to a final value
   set by a divider — so neither the start nor the end is zero, which is where
   the general form earns its keep.
   ========================================================================== */

function threeStep() {
  const VS = 12, R1 = 4000, C = 100e-6;      // 4 kΩ, 100 µF
  const V0 = 2;                              // the capacitor starts at 2 V

  const p = new Plot({
    w: 620, h: 296, xr: [-0.08, 2.3], yr: [-1.6, 13.6],
    pad: { l: 52, r: 22, t: 18, b: 38 },
    label:
      "A capacitor voltage rising from its initial value to a final value set " +
      "by a resistive divider, with the initial value, the final value and one " +
      "time constant all marked on the curve.",
  });

  const sch = new Schematic({
    w: 13, h: 6, unit: 26,
    label: "A 12 volt source behind a 4 kilohm resistor, feeding a capacitor " +
           "with a second resistor in parallel with it.",
  });

  const rdR2 = readout({ key: "R₂", value: "", tone: "x" });
  const rdV0 = readout({ key: "v(0⁺)", value: "", tone: "y" });
  const rdVinf = readout({ key: "v(∞)", value: "", tone: "y" });
  const rdTau = readout({ key: "time constant", value: "", tone: "x" });
  const rdEq = readout({ key: "so", value: "", tone: "r" });
  rdEq.root.classList.add("wide");
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  /* Elements span one grid unit either side of their centre, so wires must
     abut those lead ends exactly — there is no length option. */
  function drawSchematic() {
    sch.wire([[1, 5], [1, 1], [4, 1]]);
    sch.resistor([5, 1], "h", { label: "R₁ = 4 kΩ", at: "n" });
    sch.wire([[6, 1], [11, 1]]);
    sch.source([1, 3], "v", { kind: "dc", label: "12 V", at: "w", color: "q-x" });

    sch.wire([[8, 1], [8, 2]]);
    sch.capacitor([8, 3], "v", { label: "C = 100 µF", at: "w" });
    sch.wire([[8, 4], [8, 5]]);

    sch.wire([[11, 1], [11, 2]]);
    sch.resistor([11, 3], "v", { label: "R₂", at: "e" });
    sch.wire([[11, 4], [11, 5]]);

    sch.wire([[1, 5], [11, 5]]);
    sch.node([8, 1]);
    sch.node([8, 5]);
    sch.ground([1, 5]);
    sch.label([8, 3], "v(t)", { at: "w", color: "q-y", size: 12, weight: 600 });
  }
  drawSchematic();

  function draw(r2k) {
    p.clear("curve", "label", "mark", "shade");
    const R2 = r2k * 1000;
    /* Step 2: the final value is a divider, because a capacitor is an open
       circuit once nothing is changing. Step 3: the time constant uses the
       Thévenin resistance the capacitor *sees*, which is R1 in parallel with
       R2 — not R1, and this is the step questions are built around. */
    const vInf = VS * R2 / (R1 + R2);
    const Rth = (R1 * R2) / (R1 + R2);
    const tau = Rth * C;
    const v = (t) => vInf + (V0 - vInf) * Math.exp(-t / tau);

    p.grid({ xStep: 0.5, yStep: 2 });
    p.axes({ xLabel: "t  (seconds)", yLabel: "v(t)  (V)", xStep: 0.5, yStep: 2, arrows: true });

    // the two values the curve runs between
    p.line(-0.06, vInf, 2.24, vInf, { color: "q-r", width: 1.4, dash: "5 4" });
    p.text(2.2, vInf + 0.6, `v(∞) = ${fixed(vInf, 2)} V`,
      { color: "q-r", size: 10.5, weight: 600, anchor: "end" });
    p.line(-0.06, V0, 0.42, V0, { color: "q-y", width: 1.4, dash: "5 4" });
    p.text(0.48, V0 - 1.0, `v(0⁺) = ${V0} V`,
      { color: "q-y", size: 10.5, weight: 600, anchor: "start" });

    // nothing happens until the switch closes at t = 0
    p.curve((t) => (t < 0 ? V0 : v(t)), { color: "q-y", width: 2.8 });

    // one time constant: 63.2 % of the way from start to finish
    const vt = v(tau);
    p.line(tau, vt, tau, 13.0, { color: "q-x", width: 1.4, dash: "3 3" });
    p.dot(tau, vt, { color: "q-x", r: 4.4 });
    p.text(tau + 0.05, 13.0, `1τ = ${fixed(tau, 2)} s`,
      { color: "q-x", size: 10.5, weight: 600, anchor: "start" });
    p.text(tau + 0.06, vt - 1.1, "63.2% of the way",
      { color: "q-x", size: 9.5, anchor: "start" });

    rdR2.set(`${num(r2k, 0)} kΩ`);
    rdV0.set(`${V0} V`, " — given, and it does not jump");
    rdVinf.set(`${fixed(vInf, 2)} V`, ` = 12 × ${num(r2k, 0)}/(4 + ${num(r2k, 0)})`);
    rdTau.set(`${fixed(tau, 2)} s`, ` — Rth = R₁ ∥ R₂ = ${fixed(Rth / 1000, 2)} kΩ`);
    rdEq.set(`v(t) = ${fixed(vInf, 2)} ${V0 < vInf ? "−" : "+"} ${fixed(Math.abs(V0 - vInf), 2)} · e^(−t / ${fixed(tau, 2)} s)`);
    rdNote.set(
      `<b>Step 3 is the one questions are built around.</b> The time constant uses the resistance the capacitor <em>sees</em> looking outwards — that is R₁ ∥ R₂ = ${fixed(Rth / 1000, 2)} kΩ, not R₁ alone. Kill the source, look back from the capacitor's terminals, and it is Thévenin from Circuit Analysis Part 4 doing the work again. Notice that raising R₂ pushes the final value up <em>and</em> slows the circuit down, because it appears in both steps.`
    );
  }

  const k = knob({
    label: "R₂", min: 1, max: 40, step: 1, value: 8,
    format: (v) => `${v} kΩ`,
    onInput: draw,
  });
  draw(8);

  return {
    stage: el("div.stack", null, sch.root, p.root),
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdR2, rdV0, rdVinf, rdTau, rdEq, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("firstOrder", { no: 76, build: () => {
  const f = firstOrder();
  return plate({
    no: 76, title: "One curve, four circuits", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Switch between the four first-order transients on the exam and watch " +
      "the drawing not change. <b>Plotted against t/τ they are the same curve</b>, " +
      "because they are the same differential equation with different letters — " +
      "a quantity whose rate of change is proportional to how far it still has " +
      "to go. The percentages at each whole time constant are worth knowing on " +
      "sight: <b>63.2, 86.5, 95.0, 98.2, 99.3</b>. Five time constants is " +
      "conventionally \"settled\", and the tangent at the origin reaching the " +
      "final value at exactly 1τ is how τ is read off an oscilloscope.",
  });
} });

register("threeStep", { no: 77, build: () => {
  const f = threeStep();
  return plate({
    no: 77, title: "Initial, final, τ", tag: "interactive",
    label: "A capacitor charging between two non-zero values, with the three " +
           "quantities the general first-order solution needs marked on it.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Every first-order transient is three numbers and no calculus: where it " +
      "starts, where it ends, and how fast it gets there. Neither end is zero " +
      "here, which is the case the general form exists for. <b>The trap is the " +
      "third step</b> — the time constant uses the resistance the capacitor " +
      "sees looking outwards, R₁ ∥ R₂, not the resistor it charges through. " +
      "Move R₂ and watch the final value and the time constant move together, " +
      "because it appears in both.",
  });
} });
