/* ==========================================================================
   figures/machines.js — Plates 46 and 47.

   Plate 46 is the induction motor's torque-speed curve, which explains in one
   picture why the machine runs just below synchronous speed and never at it.
   Plate 47 follows the power through the machine and shows the fact that
   makes slip matter: the rotor loses exactly the slip fraction of whatever
   crosses the air gap.

   The cast motor: four poles at 60 Hz, so 1800 rpm synchronous, running at
   1764 rpm on 2% slip and drawing the plant's 5184 W.
   ========================================================================== */

import { el, knob, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";

const MOT = {
  poles: 4,
  f: 60,
  sRated: 0.02,
  sMax: 0.1,          // slip at breakdown torque
  Tmax: 2.6,          // per unit of rated torque; makes T(sRated) = 1.00
  Pin: 5184,          // W, the plant load from Parts 1 to 4
  statorLoss: 250,    // W, stator copper + core
  windage: 100,       // W, friction and windage
};

const nsync = (f, poles) => (120 * f) / poles;

/* Kloss's approximation — the standard textbook torque-slip relation. */
const torquePu = (s) =>
  s === 0 ? 0 : MOT.Tmax * 2 / (s / MOT.sMax + MOT.sMax / s);

/* ==========================================================================
   Plate 46 — the torque-speed curve
   One knob: rotor speed. Lesson: torque is zero at synchronous speed, so an
   induction motor can never reach it — and past it the machine generates.
   ========================================================================== */

function torqueSpeed() {
  const NS = nsync(MOT.f, MOT.poles);           // 1800 rpm

  const p = new Plot({
    w: 620, h: 340, xr: [0, 2150], yr: [-2.9, 3.0],
    pad: { l: 58, r: 18, t: 18, b: 42 },
    label:
      "Induction motor torque against rotor speed. Torque rises from a modest " +
      "value at standstill to a breakdown peak, then falls steeply to zero at " +
      "synchronous speed and goes negative beyond it, where the machine acts as " +
      "a generator.",
  });
  p.grid({ xStep: 200, yStep: 0.5 });
  p.axes({
    xStep: 400, yStep: 1, xLabel: "rpm",
    xFmt: (v) => (v === 0 ? "" : num(v, 0)),
    yFmt: (v) => (v === 0 ? "0" : fixed(v, 0)),
  });

  // the regions, marked before the curve so the curve sits on top
  p.line(NS, -2.9, NS, 3.0, { color: "muted", width: 1.5, dash: "5 4" });
  p.text(NS, -0.55, "synchronous", { color: "muted", size: 11, dx: -8, anchor: "end" });
  p.text(NS, -0.95, `${num(NS, 0)} rpm`, { color: "muted", size: 11, dx: -8, anchor: "end" });
  p.text(NS + 40, -2.45, "generating", { color: "muted", size: 11, anchor: "start" });

  const pts = [];
  for (let i = 0; i <= 400; i++) {
    const n = (i / 400) * 2150;
    const s = (NS - n) / NS;
    pts.push([n, Math.max(-2.9, Math.min(3.0, torquePu(s)))]);
  }
  p.param(() => [NaN, NaN], [0, 1], { color: "q-r", width: 3 })
    .setAttribute("d", "M " + pts.map(([a, b]) => `${p.x(a).toFixed(2)} ${p.y(b).toFixed(2)}`).join(" L "));

  // the fixed landmarks
  const nMax = NS * (1 - MOT.sMax);
  p.ring(nMax, torquePu(MOT.sMax), { color: "muted", r: 5, width: 1.6 });
  p.text(nMax, torquePu(MOT.sMax), "breakdown", { color: "muted", size: 10.5, dx: -12, dy: 4, anchor: "end" });
  p.ring(0, torquePu(1), { color: "muted", r: 5, width: 1.6 });
  p.text(60, torquePu(1), "starting", { color: "muted", size: 10.5, dy: -12, anchor: "start" });

  const dot = p.dot(NS * (1 - MOT.sRated), 1, { color: "q-y", r: 6.5 });
  const drop = p.line(0, 0, 0, 0, { color: "q-y", width: 1.3, dash: "4 3" });

  const rdN = readout({ key: "rotor speed", value: "", tone: "x" });
  const rdS = readout({ key: "slip", value: "" });
  const rdT = readout({ key: "torque", value: "", tone: "r" });
  const rdFr = readout({ key: "rotor sees", value: "" });
  const rdMode = readout({ key: "the machine is", value: "" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(n) {
    const s = (NS - n) / NS;
    const T = torquePu(s);
    const Tc = Math.max(-2.9, Math.min(3.0, T));

    dot.querySelectorAll("circle").forEach((c) => {
      c.setAttribute("cx", p.x(n)); c.setAttribute("cy", p.y(Tc));
    });
    drop.setAttribute("x1", p.x(n)); drop.setAttribute("y1", p.y(Tc));
    drop.setAttribute("x2", p.x(n)); drop.setAttribute("y2", p.y(0));

    rdN.set(`${num(n, 0)} rpm`);
    rdS.set(`${fixed(s * 100, 2)}%`);
    rdT.set(`${fixed(T, 2)} pu`, " of rated torque");
    rdFr.set(`${fixed(Math.abs(s) * MOT.f, 2)} Hz`, " in the rotor");
    rdMode.set(s > 0.001 ? "motoring" : s < -0.001 ? "generating" : "at synchronism");
    rdNote.set(
      Math.abs(s) < 0.001
        ? "<b>Torque is exactly zero here.</b> At synchronous speed the rotor sees a stationary field, no voltage is induced in it, no current flows and no torque is produced — so an induction motor <b>cannot</b> reach this speed under load. It always runs a little below."
        : s < 0
          ? `Driven <b>above</b> synchronous speed, the torque reverses: the machine is now a <b>generator</b>, pushing ${fixed(-T, 2)} pu back into the supply. This is exactly how a wind turbine's induction generator works.`
          : s > 0.5
            ? `Near standstill. Note that starting torque is only <b>${fixed(torquePu(1), 2)} pu</b> — an induction motor is weakest exactly when it needs to break away, which is why large ones start in wye (Part 2) or on a soft starter.`
            : `Slip <b>${fixed(s * 100, 2)}%</b>, torque ${fixed(T, 2)} pu. The rotor conductors see only ${fixed(s * MOT.f, 2)} Hz — the <em>difference</em> between the field's speed and their own.`
    );
  }

  const k = knob({
    label: "rotor speed", min: 0, max: 2100, step: 6, value: NS * (1 - MOT.sRated),
    format: (v) => `${num(v, 0)} rpm`,
    onInput: draw,
  });
  draw(NS * (1 - MOT.sRated));

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdN, rdS, rdT, rdFr, rdMode, rdNote),
  };
}

/* ==========================================================================
   Plate 47 — where the power goes
   One knob: slip. Lesson: the rotor dissipates exactly s times the air-gap
   power, so slip is not a detail — it is a direct efficiency penalty.
   ========================================================================== */

function powerFlow() {
  const { Pin, statorLoss, windage } = MOT;
  const Pag = Pin - statorLoss;

  // pixels as data units, +y up
  const p = new Plot({
    w: 620, h: 250, xr: [0, 586], yr: [-70, 110],
    pad: { l: 17, r: 17, t: 14, b: 14 },
    label:
      "A power flow diagram for an induction motor: electrical input at the " +
      "left, narrowing as stator loss, rotor loss and windage are drawn off, " +
      "leaving mechanical output at the right. The rotor loss branch grows with " +
      "slip.",
  });

  const rdS = readout({ key: "slip", value: "" });
  const rdSpeed = readout({ key: "speed", value: "", tone: "x" });
  const rdAg = readout({ key: "air gap", value: "" });
  const rdRot = readout({ key: "rotor loss", value: "", tone: "bad" });
  const rdOut = readout({ key: "shaft output", value: "", tone: "r" });
  const rdEff = readout({ key: "efficiency", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  const NS = nsync(MOT.f, MOT.poles);
  const SC = 62 / Pin;                    // watts to pixels of bar height

  function draw(s) {
    p.clear("curve", "label", "mark", "shade");
    const Prot = s * Pag;
    const Pmech = Pag - Prot;
    const Pout = Pmech - windage;
    const eff = (Pout / Pin) * 100;
    const n = NS * (1 - s);

    /* The main flow, as a band whose height is the power still travelling. */
    const seg = [
      { x0: 10, x1: 150, P: Pin, label: "electrical in", val: Pin },
      { x0: 150, x1: 300, P: Pag, label: "across the air gap", val: Pag },
      { x0: 300, x1: 440, P: Pmech, label: "mechanical", val: Pmech },
      { x0: 440, x1: 576, P: Pout, label: "at the shaft", val: Pout },
    ];
    seg.forEach((g, i) => {
      const h = g.P * SC;
      p.polygon([[g.x0, 0], [g.x1, 0], [g.x1, h], [g.x0, h]],
        { fill: i === 3 ? "q-r-soft" : "q-x-soft", stroke: i === 3 ? "q-r" : "q-x", width: 1.4 });
      p.text((g.x0 + g.x1) / 2, h / 2, `${num(g.val, 0)} W`,
        { color: "ink", size: 11.5, weight: 600, dy: 4 });
      p.text((g.x0 + g.x1) / 2, -14, g.label, { color: "muted", size: 10.5 });
    });

    /* The three losses, drawn downward off the band at the point they leave. */
    const loss = [
      { x: 150, W: statorLoss, name: "stator" },
      { x: 300, W: Prot, name: "rotor  (= s × air-gap)" },
      { x: 440, W: windage, name: "windage" },
    ];
    loss.forEach((l) => {
      // arrow thickness is proportional to the loss, so the rotor branch
      // visibly swells with slip even though the band itself barely narrows
      const w = Math.max(1.6, Math.min(16, (l.W / 250) * 4));
      p.line(l.x, 0, l.x, -34, { color: "q-bad", width: w });
      p.polygon([[l.x - 4 - w / 2, -34], [l.x + 4 + w / 2, -34], [l.x, -46]], { fill: "q-bad", stroke: null });
      p.text(l.x, -56, `${num(l.W, 0)} W`, { color: "q-bad", size: 11, weight: 600 });
      p.text(l.x, -68, l.name, { color: "muted", size: 10 });
    });

    p.text(293, 96, `slip ${fixed(s * 100, 1)}%  ·  ${num(n, 0)} rpm  ·  efficiency ${fixed(eff, 1)}%`,
      { color: "ink", size: 12.5, weight: 600 });

    rdS.set(`${fixed(s * 100, 2)}%`);
    rdSpeed.set(`${num(n, 0)} rpm`);
    rdAg.set(`${num(Pag, 0)} W`);
    rdRot.set(`${num(Prot, 0)} W`, ` = ${fixed(s * 100, 1)}% of it`);
    rdOut.set(`${num(Pout, 0)} W`, ` = ${fixed(Pout / 746, 2)} hp`);
    rdEff.set(`${fixed(eff, 1)}%`);
    rdNote.set(
      s <= 0.03
        ? `<b>The rotor throws away exactly the slip fraction.</b> At ${fixed(s * 100, 1)}% slip only ${num(Prot, 0)} W of the ${num(Pag, 0)} W crossing the air gap is lost in the rotor bars, and the machine reaches ${fixed(eff, 1)}%. This is why a healthy induction motor runs within a few percent of synchronous speed.`
        : `At ${fixed(s * 100, 1)}% slip the rotor is dissipating <b>${num(Prot, 0)} W</b> — ${fixed(s * 100, 1)}% of everything that crosses the air gap, as heat, in bars that are hard to cool. Efficiency has fallen to ${fixed(eff, 1)}%. <b>Slip is not a detail; it is a direct tax on the output.</b>`
    );
  }

  const k = knob({
    label: "slip", min: 0.005, max: 0.2, step: 0.005, value: 0.02,
    format: (v) => `${fixed(v * 100, 1)}%`,
    onInput: draw,
  });
  draw(0.02);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdS, rdSpeed, rdAg, rdRot, rdOut, rdEff, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("torqueSpeed", { no: 46, build: () => {
  const f = torqueSpeed();
  return plate({
    no: 46, title: "Torque against speed", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Drag the operating point to 1800 rpm and the torque goes to zero. That " +
      "is not a quirk of the drawing — <b>an induction motor works by inducing " +
      "current in its rotor, and induction needs relative motion.</b> At " +
      "synchronous speed there is none, so there is no rotor current and no " +
      "torque, and the machine must run below. Push it above and the torque " +
      "reverses: the same machine becomes a generator, which is how most wind " +
      "turbines feed the grid. (The curve is Kloss's standard approximation, " +
      "which is a little pessimistic about starting torque.)",
  });
} });

register("powerFlow", { no: 47, build: () => {
  const f = powerFlow();
  return plate({
    no: 47, title: "Where the power goes", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The band is the power still travelling, and each arrow is what leaves. " +
      "The middle arrow is the one to remember: <b>rotor loss is exactly s times " +
      "the air-gap power</b>, so the mechanical power developed is (1 − s) times " +
      "it. Slip converts directly into heat in the rotor bars. Slide it to 20% " +
      "and watch efficiency collapse — that is also why a motor stalled against " +
      "a jammed load burns out, since at standstill s = 1 and <em>everything</em> " +
      "crossing the air gap becomes rotor heat.",
  });
} });
