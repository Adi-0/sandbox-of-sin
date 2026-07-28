/* ==========================================================================
   figures/diode.js — Plates 49 and 50.

   Plate 49 is the graphical solution of a nonlinear circuit: the diode's own
   I-V curve crossed with the resistor's load line. It also compares the three
   models side by side, which is the part's real question — when does the
   model you choose change the answer?

   Plate 50 is the Zener shunt regulator, which is where "assume a state,
   solve, check the assumption" first has to be done for real.

   The cast: a 5 V rail and a 1 kΩ resistor, giving 5.00 mA ideal, 4.30 mA on
   the constant-drop model and 4.31 mA exact.
   ========================================================================== */

import { el, knob, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;

/* A small-signal silicon diode at room temperature. Is = 1e-14 A puts the
   knee at about 0.69 V for milliamp currents, which is why the 0.7 V rule
   works as well as it does. */
const DIO = { Is: 1e-14, Vt: 0.02585, Vf: 0.7, R: 1000 };

/** Exponential model: current for a given diode voltage. */
const iOf = (vd) => DIO.Is * (Math.exp(vd / DIO.Vt) - 1);

/** Solve Vs = Vd + I(Vd)·R for Vd, by bisection — robust where Newton is not. */
function solveDiode(Vs, R) {
  if (Vs <= 0) return { vd: 0, i: 0 };
  let lo = 0, hi = Vs;
  for (let k = 0; k < 80; k++) {
    const mid = (lo + hi) / 2;
    if (iOf(mid) * R + mid > Vs) hi = mid; else lo = mid;
  }
  const vd = (lo + hi) / 2;
  return { vd, i: (Vs - vd) / R };
}

/* ==========================================================================
   Plate 49 — the load line, and three models on one axis
   One knob: the supply. Lesson: the operating point is where the device's
   curve meets the circuit's straight line, and the 0.7 V model is almost
   always close enough while the ideal model often is not.
   ========================================================================== */

function diodeLoadLine() {
  const R = DIO.R;

  const p = new Plot({
    /* The window stops at 1.15 V rather than following the load line all the
     way to its x-intercept. Everything the reader has to see — the knee, the
     crossing, and both model predictions — happens below a volt, and drawing
     the full supply range squashes all of it into a tenth of the plate. */
    w: 620, h: 350, xr: [-0.03, 1.15], yr: [-0.4, 5.6],
    pad: { l: 62, r: 20, t: 18, b: 42 },
    label:
      "Diode current against diode voltage. The device's exponential curve " +
      "rises steeply near 0.7 volts; a straight load line falls from the supply " +
      "voltage to zero, and the two cross at the operating point.",
  });
  p.grid({ xStep: 0.05, yStep: 0.5 });
  p.axes({
    xStep: 0.25, yStep: 1, xLabel: "diode volts", yLabel: "mA",
    xFmt: (v) => (v === 0 ? "" : fixed(v, 2)),
    yFmt: (v) => (v === 0 ? "0" : fixed(v, 0)),
  });

  // the device's own characteristic, in milliamps — it does not depend on the
  // circuit around it, so it is drawn once
  const curve = [];
  for (let i = 0; i <= 400; i++) {
    const vd = (i / 400) * 0.80;
    const mA = iOf(vd) * 1000;
    if (mA > 5.6) break;
    curve.push(`${p.x(vd).toFixed(2)} ${p.y(mA).toFixed(2)}`);
  }
  p.add("curve", pathOf(curve, "q-r", 2.75));
  p.text(0.755, 5.25, "the diode", { color: "q-r", size: 11.5, weight: 600, anchor: "start" });
  p.text(0.755, 4.85, "I = Is(e^(V/VT) − 1)", { color: "muted", size: 10.5, anchor: "start" });

  const load = p.line(0, 0, 0, 0, { color: "q-x", width: 2.25 });
  const tLoad = p.text(0, 0, "", { color: "q-x", size: 11, anchor: "start" });
  const opDot = p.dot(0, 0, { color: "q-y", r: 6 });
  const vGuide = p.line(0, 0, 0, 0, { color: "q-y", width: 1.2, dash: "4 3" });
  const iGuide = p.line(0, 0, 0, 0, { color: "q-y", width: 1.2, dash: "4 3" });
  const idealRing = p.ring(0, 0, { color: "muted", r: 5, width: 1.5 });
  const dropRing = p.ring(0, 0, { color: "muted", r: 5, width: 1.5 });

  const rdVs = readout({ key: "supply", value: "", tone: "x" });
  const rdVd = readout({ key: "diode drop", value: "", tone: "y" });
  const rdExact = readout({ key: "exact", value: "", tone: "r" });
  const rdDrop = readout({ key: "0.7 V model", value: "" });
  const rdIdeal = readout({ key: "ideal model", value: "" });
  const rdErr = readout({ key: "ideal is off by", value: "", tone: "bad" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(Vs) {
    const { vd, i } = solveDiode(Vs, R);
    const mA = i * 1000;
    const iIdeal = (Vs / R) * 1000;
    const iDrop = Math.max(0, (Vs - DIO.Vf) / R) * 1000;

    // the load line: I = (Vs - Vd)/R, from (0, Vs/R) down to (Vs, 0)
    // drawn only across the visible window; its x-intercept is off the plate
    const xEnd = Math.min(Vs, 1.15);
    load.setAttribute("x1", p.x(0)); load.setAttribute("y1", p.y(iIdeal));
    load.setAttribute("x2", p.x(xEnd)); load.setAttribute("y2", p.y(((Vs - xEnd) / R) * 1000));
    setAt(tLoad, p.x(0.30), p.y(((Vs - 0.30) / R) * 1000) - 10, "load line, R = 1 kΩ");

    opDot.querySelectorAll("circle").forEach((c) => {
      c.setAttribute("cx", p.x(vd)); c.setAttribute("cy", p.y(mA));
    });
    vGuide.setAttribute("x1", p.x(vd)); vGuide.setAttribute("y1", p.y(mA));
    vGuide.setAttribute("x2", p.x(vd)); vGuide.setAttribute("y2", p.y(0));
    iGuide.setAttribute("x1", p.x(vd)); iGuide.setAttribute("y1", p.y(mA));
    iGuide.setAttribute("x2", p.x(0)); iGuide.setAttribute("y2", p.y(mA));

    idealRing.setAttribute("cx", p.x(0)); idealRing.setAttribute("cy", p.y(iIdeal));
    dropRing.setAttribute("cx", p.x(DIO.Vf)); dropRing.setAttribute("cy", p.y(iDrop));

    const errIdeal = mA > 1e-9 ? ((iIdeal - mA) / mA) * 100 : 0;
    const errDrop = mA > 1e-9 ? ((iDrop - mA) / mA) * 100 : 0;

    rdVs.set(`${fixed(Vs, 2)} V`);
    rdVd.set(`${fixed(vd, 3)} V`);
    rdExact.set(`${fixed(mA, 3)} mA`);
    rdDrop.set(`${fixed(iDrop, 3)} mA`, ` ${errDrop >= 0 ? "+" : ""}${fixed(errDrop, 1)}%`);
    rdIdeal.set(`${fixed(iIdeal, 3)} mA`, ` +${fixed(errIdeal, 0)}%`);
    rdErr.set(`${fixed(errIdeal, 0)}%`);
    rdNote.set(
      Vs < 0.55
        ? "Below the knee the diode is barely conducting, and <b>both</b> simple models are useless — the ideal one says the full supply is available and the 0.7 V one says nothing flows at all. Only the exponential is right down here."
        : Vs < 2
          ? `At ${fixed(Vs, 2)} V the supply is only a few times the diode's drop, so <b>ignoring that drop is a ${fixed(errIdeal, 0)}% error</b>. The 0.7 V model is within ${fixed(Math.abs(errDrop), 0)}%.`
          : `At ${fixed(Vs, 2)} V the 0.7 V model is within <b>${fixed(Math.abs(errDrop), 1)}%</b> of exact — close enough for any exam answer. The ideal model is still off by ${fixed(errIdeal, 0)}%, because 0.7 V out of ${fixed(Vs, 2)} V is not negligible.`
    );
  }

  const k = knob({
    label: "supply voltage", min: 0, max: 5, step: 0.05, value: 5,
    format: (v) => `${fixed(v, 2)} V`,
    onInput: draw,
  });
  draw(5);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdVs, rdVd, rdExact, rdDrop, rdIdeal, rdErr, rdNote),
  };
}

/* ==========================================================================
   Plate 50 — the Zener shunt regulator
   One knob: the input. Lesson: the circuit has two states, and which one it
   is in has to be assumed, solved and then checked.
   ========================================================================== */

/* Rs and the Zener rating are chosen so the plate can actually reach the
   power limit inside the knob's range — a limit the reader never hits is
   not a limit they will remember. */
const ZEN = { Vz: 5.1, Rs: 330, Rl: 2000, Pmax: 0.25 };

function zenerRegulator() {
  const { Vz, Rs, Rl } = ZEN;
  const Von = Vz * (Rs + Rl) / Rl;             // input at which the Zener starts

  // pixels as data units, +y up
  const p = new Plot({
    w: 600, h: 260, xr: [0, 568], yr: [-92, 108],
    pad: { l: 16, r: 16, t: 14, b: 14 },
    label:
      "A Zener shunt regulator: a source through a series resistor, with a " +
      "Zener diode and a load resistor in parallel at the output. Currents in " +
      "all three branches are shown, along with whether the Zener is conducting.",
  });

  const rdState = readout({ key: "Zener is", value: "" });
  const rdVout = readout({ key: "output", value: "", tone: "x" });
  const rdIr = readout({ key: "through Rs", value: "", tone: "y" });
  const rdIl = readout({ key: "to the load", value: "", tone: "y" });
  const rdIz = readout({ key: "through Zener", value: "", tone: "y" });
  const rdPz = readout({ key: "Zener power", value: "" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(Vin) {
    p.clear("curve", "label", "mark", "shade");
    const on = Vin >= Von;
    const Vout = on ? Vz : Vin * Rl / (Rs + Rl);
    const Ir = (Vin - Vout) / Rs;
    const Il = Vout / Rl;
    const Iz = Ir - Il;
    const Pz = Vz * Iz;

    /* --- schematic ------------------------------------------------------- */
    const YT = 44, YB = -44, XS = 60, XZ = 300, XL = 460;
    p.line(XS, YB, XS, YT, { color: "ink", width: 1.8 });         // source
    p.add("curve", circleAt(p, XS, 0, 17));
    p.text(XS, 5, "+", { color: "ink", size: 13 });
    p.text(XS, -60, `${fixed(Vin, 2)} V in`, { color: "q-x", size: 12.5, weight: 600 });

    p.line(XS, YT, 150, YT, { color: "ink", width: 1.8 });
    boxAt(p, 190, YT, 62, 20);                                     // Rs
    p.text(190, YT + 22, `Rs = ${Rs} Ω`, { color: "ink", size: 11, weight: 600 });
    p.line(230, YT, XL, YT, { color: "ink", width: 1.8 });
    p.line(XS, YB, XL, YB, { color: "ink", width: 1.8 });

    // the Zener, drawn as a triangle and bar so its direction is visible
    p.line(XZ, YT, XZ, 14, { color: "ink", width: 1.8 });
    p.line(XZ, -14, XZ, YB, { color: "ink", width: 1.8 });
    zenerGlyph(p, XZ, 0, on);
    p.text(XZ + 32, 4, `${Vz} V`, { color: on ? "q-r" : "muted", size: 11.5, weight: 600, anchor: "start" });

    p.line(XL, YT, XL, 18, { color: "ink", width: 1.8 });
    p.line(XL, -18, XL, YB, { color: "ink", width: 1.8 });
    boxAt(p, XL, 0, 20, 36);
    p.text(XL + 30, 4, "2 kΩ", { color: "ink", size: 11.5, weight: 600, anchor: "start" });

    p.dot(XZ, YT, { color: "ink", r: 3.5 });
    p.dot(XL, YT, { color: "ink", r: 3.5 });
    p.text(365, YT + 22, `${fixed(Vout, 2)} V out`, { color: "q-x", size: 13, weight: 600 });

    // branch currents
    p.text(268, YT + 18, `${fixed(Ir * 1000, 2)} mA`, { color: "q-y", size: 11, weight: 600 });
    p.text(XZ - 34, -32, `${fixed(Iz * 1000, 2)} mA`, { color: "q-y", size: 11, weight: 600, anchor: "end" });
    p.text(XL + 30, -32, `${fixed(Il * 1000, 2)} mA`, { color: "q-y", size: 11, weight: 600, anchor: "start" });

    p.text(284, 92, on
      ? `regulating — output pinned at ${Vz} V`
      : `not yet conducting — output follows the input`,
      { color: on ? "q-r" : "muted", size: 12.5, weight: 600 });

    rdState.set(on ? "conducting" : "off");
    rdVout.set(`${fixed(Vout, 2)} V`);
    rdIr.set(`${fixed(Ir * 1000, 2)} mA`);
    rdIl.set(`${fixed(Il * 1000, 2)} mA`);
    rdIz.set(`${fixed(Iz * 1000, 2)} mA`);
    rdPz.set(`${fixed(Pz * 1000, 0)} mW`, Pz > ZEN.Pmax ? " — over its 250 mW rating" : ` of ${ZEN.Pmax * 1000} mW`);
    rdNote.set(
      !on
        ? `<b>Assume it is off</b>, and the circuit is just a divider: ${fixed(Vout, 2)} V, which is below ${Vz} V, so the Zener really is off and the assumption holds. Regulation begins at <b>${fixed(Von, 2)} V in</b>.`
        : Pz > ZEN.Pmax
          ? `The output is held, but the Zener is dissipating <b>${fixed(Pz * 1000, 0)} mW</b> against a ${ZEN.Pmax * 1000} mW rating. <b>It will fail.</b> Regulators are limited by the Zener's power, not by its voltage.`
          : `<b>Assume it is conducting</b>, so the output is ${Vz} V. Then Rs carries ${fixed(Ir * 1000, 2)} mA, the load takes ${fixed(Il * 1000, 2)} mA, and the Zener swallows the remaining ${fixed(Iz * 1000, 2)} mA. That current is positive, so the assumption holds. <b>The Zener absorbs whatever the load does not want</b> — which is exactly how the output stays fixed.`
    );
  }

  const k = knob({
    label: "input voltage", min: 0, max: 26, step: 0.1, value: 12,
    format: (v) => `${fixed(v, 1)} V`,
    onInput: draw,
  });
  draw(12);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdState, rdVout, rdIr, rdIl, rdIz, rdPz, rdNote),
  };
}

/* -------------------------------------------------------------------------
   drawing helpers
   ------------------------------------------------------------------------- */

const NS = "http://www.w3.org/2000/svg";

function setAt(node, px, py, str) {
  node.setAttribute("x", px); node.setAttribute("y", py); node.textContent = str;
}

function pathOf(pts, color, width) {
  const n = document.createElementNS(NS, "path");
  n.setAttribute("d", "M " + pts.join(" L "));
  n.setAttribute("fill", "none");
  n.setAttribute("stroke", V(color));
  n.setAttribute("stroke-width", width);
  return n;
}

function circleAt(p, ux, uy, r) {
  const c = document.createElementNS(NS, "circle");
  c.setAttribute("cx", p.x(ux)); c.setAttribute("cy", p.y(uy)); c.setAttribute("r", r);
  c.setAttribute("fill", V("plate"));
  c.setAttribute("stroke", V("ink")); c.setAttribute("stroke-width", 1.8);
  return c;
}

function boxAt(p, ux, uy, w, h) {
  const r = document.createElementNS(NS, "rect");
  r.setAttribute("x", p.x(ux) - w / 2); r.setAttribute("y", p.y(uy) - h / 2);
  r.setAttribute("width", w); r.setAttribute("height", h); r.setAttribute("rx", 2);
  r.setAttribute("fill", V("plate"));
  r.setAttribute("stroke", V("ink")); r.setAttribute("stroke-width", 1.8);
  p.add("curve", r);
  return r;
}

/** Zener symbol: cathode bar with bent ends, anode triangle pointing at it. */
function zenerGlyph(p, ux, uy, lit) {
  const x = p.x(ux), y = p.y(uy);
  const col = lit ? V("q-r") : V("ink");
  const g = document.createElementNS(NS, "g");
  const tri = document.createElementNS(NS, "path");
  // current flows down through the load side, so the triangle points up
  tri.setAttribute("d", `M ${x - 11} ${y + 8} L ${x + 11} ${y + 8} L ${x} ${y - 8} Z`);
  tri.setAttribute("fill", lit ? V("q-r-soft") : "none");
  tri.setAttribute("stroke", col); tri.setAttribute("stroke-width", 1.8);
  tri.setAttribute("stroke-linejoin", "round");
  g.appendChild(tri);
  const bar = document.createElementNS(NS, "path");
  bar.setAttribute("d", `M ${x - 11} ${y - 9} L ${x + 11} ${y - 9} M ${x - 11} ${y - 9} L ${x - 15} ${y - 15} M ${x + 11} ${y - 9} L ${x + 15} ${y - 3}`);
  bar.setAttribute("fill", "none");
  bar.setAttribute("stroke", col); bar.setAttribute("stroke-width", 1.8);
  bar.setAttribute("stroke-linecap", "round");
  g.appendChild(bar);
  p.add("curve", g);
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("diodeLoadLine", { no: 49, build: () => {
  const f = diodeLoadLine();
  return plate({
    no: 49, title: "The load line", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "A diode is the first component here that Ohm's law cannot solve, because " +
      "its curve is not a straight line. <b>The circuit around it still is</b> — " +
      "and where the two meet is the answer. That is the load-line method, and " +
      "Part 4 uses the identical picture for a transistor. Watch the two hollow " +
      "rings as you slide: they are what the ideal and 0.7 V models predict. " +
      "Above about 2 V the constant-drop model is within a percent, and below " +
      "1 V neither shortcut is safe.",
  });
} });

register("zenerRegulator", { no: 50, build: () => {
  const f = zenerRegulator();
  return plate({
    no: 50, title: "The Zener shunt regulator", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Below 5.94 V the Zener is off and this is nothing but a voltage divider. " +
      "Above it, the output is pinned and <b>the Zener absorbs exactly whatever " +
      "current the load declines to take</b> — which is why the output holds " +
      "steady while the input wanders. Note what limits the circuit: not voltage " +
      "but <b>power</b>. Past about 22 V the Zener is over its 250 mW rating and " +
      "the regulator destroys itself while still, briefly, regulating.",
  });
} });
