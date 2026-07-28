/* ==========================================================================
   figures/transmission.js — Plates 42 and 43.

   Plate 42 is the line as it actually is: an impedance between the source and
   the load, eating voltage. Plate 43 is the single fact the whole grid is
   shaped by — loss falls as the square of transmission voltage — drawn on log
   axes where an inverse square law is a straight line of slope −2.

   The cast: the Part 2 plant, 5184 W at 0.6 lagging, 24 A per phase, at the
   far end of a feeder of 0.5 + j0.5 ohms per kilometre per conductor.
   ========================================================================== */

import { el, knob, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";

const RT3 = Math.sqrt(3);

/* The feeder and its load, defined once. */
const FEED = {
  Vr: 120,        // V per phase, held at the load by definition of regulation
  I: 24,          // A per phase
  pf: 0.6,
  rPerKm: 0.5,    // ohms per conductor per km
  xPerKm: 0.5,
  P: 5184,        // W delivered, three phases
};

/* ==========================================================================
   Plate 42 — what the line takes
   One knob: line length. Lesson: the sending end must be higher than the
   receiving end, and the shortfall is not just I times R — the reactance
   contributes, and the load angle decides how much.
   ========================================================================== */

function lineDrop() {
  const { Vr, I, pf, rPerKm, xPerKm } = FEED;
  const th = Math.acos(pf);
  // load current as a phasor, lagging the receiving-end voltage
  const Ire = I * Math.cos(-th), Iim = I * Math.sin(-th);

  /* Data units are pixels here, one to one, and +y is up. A one-line diagram
     is drawn, not plotted, so this is the coordinate system to reason in. */
  const p = new Plot({
    w: 600, h: 190, xr: [0, 568], yr: [-70, 92],
    pad: { l: 16, r: 16, t: 14, b: 14 },
    label:
      "A one-line diagram of a feeder: a source at the left, a series line " +
      "impedance, and the load at the right, with the sending-end and " +
      "receiving-end voltages marked and the difference between them called out.",
  });

  const rdR = readout({ key: "line Z", value: "" });
  const rdVs = readout({ key: "sending end", value: "", tone: "x" });
  const rdDrop = readout({ key: "drop", value: "", tone: "bad" });
  const rdReg = readout({ key: "regulation", value: "", tone: "r" });
  const rdLoss = readout({ key: "line loss", value: "", tone: "bad" });
  const rdEff = readout({ key: "efficiency", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(km) {
    p.clear("curve", "label", "mark", "shade");
    const R = rPerKm * km, X = xPerKm * km;

    // Vs = Vr + I(R + jX), done in rectangular form because that is the
    // only way the reactance's contribution shows up honestly
    const vsRe = Vr + (Ire * R - Iim * X);
    const vsIm = Ire * X + Iim * R;
    const Vs = Math.hypot(vsRe, vsIm);
    const reg = ((Vs - Vr) / Vr) * 100;
    const loss = 3 * I * I * R;
    const eff = (FEED.P / (FEED.P + loss)) * 100;

    /* --- the one-line diagram, +y up, one unit per pixel ----------------- */
    const NS = 76, NR = 300, XL = 170, XLD = 400;   // node and component centres

    p.add("curve", circleAt(p, 30, 0, 15, "ink"));
    p.text(30, 0, "∼", { color: "ink", size: 18, dy: 6 });
    p.text(30, -30, "source", { color: "muted", size: 11 });

    p.line(45, 0, 115, 0, { color: "ink", width: 1.8 });
    boxAt(p, XL, 0, 110, 20, "ink");
    p.line(225, 0, 355, 0, { color: "ink", width: 1.8 });
    p.text(XL, -26, `${fixed(R, 2)} + j${fixed(X, 2)} Ω`, { color: "ink", size: 11.5, weight: 600 });
    p.text(XL, -41, "per conductor", { color: "muted", size: 10.5 });

    boxAt(p, XLD, 0, 90, 46, "ink");
    p.text(XLD, 6, "plant", { color: "ink", size: 12, weight: 600 });
    p.text(XLD, -10, "5184 W", { color: "ink", size: 10.5 });
    p.text(XLD, -41, `${pf} pf lagging`, { color: "muted", size: 10.5 });
    p.line(445, 0, 470, 0, { color: "ink", width: 1.8 });

    // the two voltages, marked where they are actually measured
    p.dot(NS, 0, { color: "q-x", r: 4 });
    p.dot(NR, 0, { color: "q-x", r: 4 });
    p.text(NS, 34, `${fixed(Vs, 1)} V`, { color: "q-x", size: 13, weight: 600 });
    p.text(NS, 18, "sending", { color: "muted", size: 10.5 });
    p.text(NR, 34, `${Vr} V`, { color: "q-x", size: 13, weight: 600 });
    p.text(NR, 18, "receiving", { color: "muted", size: 10.5 });

    // what the line takes, called out over the component that takes it
    p.line(XL, 44, XL, 58, { color: "q-bad", width: 1.2 });
    p.text(XL, 66, `${fixed(Vs - Vr, 1)} V and ${num(loss, 0)} W lost here`,
      { color: "q-bad", size: 11.5, weight: 600 });

    p.text(283, -26, `I = ${I} A`, { color: "q-y", size: 11.5, weight: 600 });

    rdR.set(`${fixed(R, 2)} + j${fixed(X, 2)} Ω`);
    rdVs.set(`${fixed(Vs, 1)} V`, " per phase");
    rdDrop.set(`${fixed(Vs - Vr, 1)} V`);
    rdReg.set(`${fixed(reg, 1)}%`);
    rdLoss.set(`${num(loss, 0)} W`, " all three phases");
    rdEff.set(`${fixed(eff, 1)}%`);
    rdNote.set(
      km < 0.05
        ? "A line of no length takes nothing. Every effect on this plate is the line's impedance, not the load's."
        : `The source must hold <b>${fixed(Vs, 1)} V</b> for the plant to see ${Vr} V. Note that the drop is <b>${fixed(Vs - Vr, 1)} V</b>, not ${fixed(I * R, 1)} V — <b>I·R alone is not the answer</b>, because the reactance contributes too and the load's 53° angle decides how much of each lands on the magnitude.`
    );
  }

  const k = knob({
    label: "line length", min: 0, max: 3, step: 0.05, value: 1,
    format: (v) => `${fixed(v, 2)} km`,
    onInput: draw,
  });
  draw(1);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdR, rdVs, rdDrop, rdReg, rdLoss, rdEff, rdNote),
  };
}

/* ==========================================================================
   Plate 43 — the inverse square law the grid is built around
   One knob: transmission voltage. Lesson: deliver the same watts at n times
   the voltage and the loss falls by n squared. On log axes that is a straight
   line, and the grid's standard voltages sit along it.
   ========================================================================== */

const STANDARD = [
  [208, "208 V", "a building panel"],
  [480, "480 V", "industrial plant"],
  [4160, "4.16 kV", "campus / plant feeder"],
  [12470, "12.47 kV", "utility distribution"],
  [69000, "69 kV", "sub-transmission"],
];

function voltageSquared() {
  const P = FEED.P, R = FEED.rPerKm, pf = FEED.pf;
  // loss fraction = P R / (V^2 pf^2); see the prose for the derivation
  const lossW = (V) => (P * P * R) / (V * V * pf * pf);
  const lossPct = (V) => (lossW(V) / P) * 100;

  const LX = [Math.log10(180), Math.log10(110000)];
  const LY = [Math.log10(0.00008), Math.log10(60)];

  const p = new Plot({
    w: 620, h: 330, xr: LX, yr: LY,
    pad: { l: 60, r: 18, t: 18, b: 40 },
    label:
      "Line loss as a percentage of delivered power against transmission " +
      "voltage, both on logarithmic scales, so the inverse square relationship " +
      "appears as a straight line falling two decades for every decade of " +
      "voltage. Standard supply voltages are marked along it.",
  });

  // decade ruling, drawn by hand because both axes are logarithmic
  for (let e = 2; e <= 5; e++) {
    p.line(e, LY[0], e, LY[1], { color: "grid", width: 1 });
    p.text(e, LY[0], ["100 V", "1 kV", "10 kV", "100 kV"][e - 2],
      { color: "muted", size: 10.5, dy: 18 });
  }
  for (let e = -4; e <= 1; e++) {
    p.line(LX[0], e, LX[1], e, { color: "grid", width: 1 });
    p.text(LX[0], e, ["0.0001%", "0.001%", "0.01%", "0.1%", "1%", "10%"][e + 4],
      { color: "muted", size: 10.5, dx: -8, anchor: "end" });
  }

  // the law itself
  const pts = [];
  for (let i = 0; i <= 200; i++) {
    const lv = LX[0] + (i / 200) * (LX[1] - LX[0]);
    pts.push(`${p.x(lv).toFixed(2)} ${p.y(Math.log10(lossPct(10 ** lv))).toFixed(2)}`);
  }
  p.add("curve", pathOf(pts, "q-r", 3));

  // where the real grid sits
  STANDARD.forEach(([v, label]) => {
    const lv = Math.log10(v), ly = Math.log10(lossPct(v));
    p.ring(lv, ly, { color: "muted", r: 4, width: 1.5 });
    p.text(lv, ly, label, { color: "muted", size: 10, dy: -11 });
  });

  const marker = p.dot(Math.log10(208), Math.log10(lossPct(208)), { color: "q-y", r: 6 });
  const drop = p.line(0, 0, 0, 0, { color: "q-y", width: 1.3, dash: "4 3" });

  const rdV = readout({ key: "voltage", value: "", tone: "x" });
  const rdI = readout({ key: "line current", value: "", tone: "y" });
  const rdLoss = readout({ key: "loss", value: "", tone: "bad" });
  const rdPct = readout({ key: "as % of load", value: "", tone: "bad" });
  const rdVs = readout({ key: "against 208 V", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  const base = lossW(208);

  function draw(lv) {
    const V = 10 ** lv;
    const I = P / (RT3 * V * pf);
    const W = lossW(V);
    const ly = Math.log10(lossPct(V));

    const g = marker.querySelectorAll("circle");
    g.forEach((c) => { c.setAttribute("cx", p.x(lv)); c.setAttribute("cy", p.y(ly)); });
    drop.setAttribute("x1", p.x(lv)); drop.setAttribute("y1", p.y(ly));
    drop.setAttribute("x2", p.x(lv)); drop.setAttribute("y2", p.y(LY[0]));

    const near = STANDARD.reduce((a, b) =>
      Math.abs(Math.log10(b[0]) - lv) < Math.abs(Math.log10(a[0]) - lv) ? b : a);

    rdV.set(V >= 1000 ? `${fixed(V / 1000, 2)} kV` : `${num(V, 0)} V`);
    rdI.set(I >= 1 ? `${fixed(I, 2)} A` : `${fixed(I * 1000, 0)} mA`);
    rdLoss.set(W >= 1 ? `${num(W, 1)} W` : `${fixed(W * 1000, 1)} mW`);
    rdPct.set(`${W / P * 100 < 0.01 ? fixed(W / P * 100, 4) : fixed(W / P * 100, 2)}%`);
    rdVs.set(base / W < 1.02 ? "the reference" : `${fixed(base / W, 0)}× less`,
      base / W < 1.02 ? " point on this plate" : " loss than at 208 V");
    rdNote.set(
      Math.abs(Math.log10(near[0]) - lv) < 0.06
        ? `<b>${near[1]}</b> — ${near[2]}. Loss here is ${fixed(W / P * 100, W / P * 100 < 0.01 ? 4 : 2)}% of what is delivered.`
        : `Same plant, same 5184 W delivered, same conductor. Only the voltage changed — and the loss is <b>${fixed(base / W, 0)}×</b> smaller than it was at 208 V.`
    );
  }

  const k = knob({
    label: "transmission voltage", min: LX[0], max: LX[1], step: 0.01,
    value: Math.log10(208),
    format: (v) => (10 ** v >= 1000 ? `${fixed(10 ** v / 1000, 1)} kV` : `${num(10 ** v, 0)} V`),
    onInput: draw,
  });
  draw(Math.log10(208));

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdV, rdI, rdLoss, rdPct, rdVs, rdNote),
  };
}

/* -------------------------------------------------------------------------
   small drawing helpers
   ------------------------------------------------------------------------- */

function pathOf(pts, color, width) {
  const el2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  el2.setAttribute("d", "M " + pts.join(" L "));
  el2.setAttribute("fill", "none");
  el2.setAttribute("stroke", `var(--${color})`);
  el2.setAttribute("stroke-width", width);
  return el2;
}

function circleAt(p, ux, uy, r, color) {
  const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  c.setAttribute("cx", p.x(ux)); c.setAttribute("cy", p.y(uy)); c.setAttribute("r", r);
  c.setAttribute("fill", "var(--plate)");
  c.setAttribute("stroke", `var(--${color})`); c.setAttribute("stroke-width", 1.8);
  return c;
}

function boxAt(p, ux, uy, w, h, color) {
  const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  r.setAttribute("x", p.x(ux) - w / 2); r.setAttribute("y", p.y(uy) - h / 2);
  r.setAttribute("width", w); r.setAttribute("height", h); r.setAttribute("rx", 2);
  r.setAttribute("fill", "var(--plate)");
  r.setAttribute("stroke", `var(--${color})`); r.setAttribute("stroke-width", 1.8);
  p.add("curve", r);
  return r;
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("lineDrop", { no: 42, build: () => {
  const f = lineDrop();
  return plate({
    no: 42, title: "What the line takes", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "A conductor is not a wire with no properties — over any distance it is a " +
      "resistance in series with a reactance, and both stand between the source " +
      "and the load. <b>The drop is not I·R.</b> It is the magnitude of " +
      "I(R + jX) added to the load voltage as a phasor, and at a lagging power " +
      "factor the reactive term contributes most of it. That is also why " +
      "correcting the power factor at the load improves the voltage at the far " +
      "end of a long feeder — less current, less drop.",
  });
} });

register("voltageSquared", { no: 43, build: () => {
  const f = voltageSquared();
  return plate({
    no: 43, title: "Loss against transmission voltage", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Both scales are logarithmic, so an inverse square law is a straight line " +
      "falling two decades for every decade of voltage — and the standard supply " +
      "voltages sit along it like beads. <b>Doubling the voltage quarters the " +
      "loss; a twenty-to-one transformer divides it by four hundred.</b> This one " +
      "relationship is why power is generated at medium voltage, stepped up for " +
      "the journey, and stepped back down at the end, and why nobody transmits " +
      "at 208 V for more than a few hundred metres.",
  });
} });
