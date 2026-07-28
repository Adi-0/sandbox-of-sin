/* ==========================================================================
   figures/power-factor.js — Plates 37 and 38.

   The module's opening argument, in two plates. Plate 37 holds the useful
   work fixed and lets the power factor slide, so the reader watches the
   current and the cable rating climb while the plant does exactly the same
   job. Plate 38 hands them a capacitor and lets them buy it back.

   The cast: one 120 V branch of a plant, its impedance the 3 + j4 from
   Circuit Analysis Part 6. 1728 W at 0.6 lagging, drawing 24 A. Part 2
   multiplies it by three; this part stays single-phase, because three-phase
   has not been taught yet.

   Colour, as everywhere: q-x is voltage-side / real power, q-y is the
   current-side / reactive part, q-r is the resulting magnitude, q-bad the
   trap.
   ========================================================================== */

import { el, knob, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed, degv } from "../lib/fmt.js";

/* One branch of the plant, defined once so the plates and the prose cannot
   disagree. Part 2 scales all of it by three. */
export const BRANCH = {
  P: 1728,      // W — the work this branch actually does
  V: 120,       // V rms
  f: 60,
};

/** Current drawn by a single-phase load of P watts at power factor pf. */
const lineCurrent = (P, pf) => P / (BRANCH.V * pf);

/* ==========================================================================
   Plate 37 — what a power factor costs
   One knob: the power factor. Lesson: P is what you use, S is what you pay
   to have built, and the gap between them is pure angle.
   ========================================================================== */

function powerCost() {
  const P = BRANCH.P;

  /* The scales on the two axes are deliberately equal, so the angle the reader
     measures on the plate is the angle in the readout. On a plate whose point
     is that this is the 3-4-5 triangle, a foreshortened 53.13° would be a lie. */
  const p = new Plot({
    w: 520, h: 420, xr: [-900, 3094], yr: [-200, 3100],
    pad: { l: 30, r: 30, t: 16, b: 24 },
    label:
      "A power triangle drawn to true proportions. The horizontal leg is real " +
      "power, held fixed while the power factor changes; the vertical leg is " +
      "reactive power and the hypotenuse is apparent power, both of which grow " +
      "as the power factor falls.",
  });

  // the fixed real-power leg, drawn once — its constancy is the whole point
  p.line(0, 0, P, 0, { color: "q-x", width: 3 });
  p.text(P / 2, 0, "P = 1728 W  (fixed)", { dy: 19, color: "q-x", size: 12, weight: 600 });
  p.text(P / 2, 0, "the work the load actually does", { dy: 35, color: "muted", size: 10.5 });

  const shade = p.polygon([[0, 0]], { fill: "q-r-soft", stroke: null });
  const legQ = p.line(0, 0, 0, 0, { color: "q-y", width: 3 });
  const hyp = p.line(0, 0, 0, 0, { color: "q-r", width: 3 });
  // angleArc returns a group; the sweep is redrawn by replacing the path inside it
  const arc = p.angleArc(0, 0, 0, 0.1, 54, { color: "muted", width: 1.5 }).querySelector("path");
  const tQ = p.text(0, 0, "", { color: "q-y", size: 12, anchor: "start", weight: 600 });
  const tS = p.text(0, 0, "", { color: "q-r", size: 12, anchor: "middle", weight: 600 });
  const tAng = p.text(0, 0, "", { color: "muted", size: 11, anchor: "start" });

  const rdPf = readout({ key: "power factor", value: "" });
  const rdAng = readout({ key: "angle θ", value: "" });
  const rdQ = readout({ key: "reactive Q", value: "", tone: "y" });
  const rdS = readout({ key: "apparent S", value: "", tone: "r" });
  const rdI = readout({ key: "current at 120 V", value: "", tone: "y" });
  const rdLoss = readout({ key: "copper loss", value: "" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  const Iunity = lineCurrent(P, 1);

  function draw(pf) {
    const th = Math.acos(pf);
    const S = P / pf;
    const Q = P * Math.tan(th);
    const I = lineCurrent(P, pf);
    const lossRatio = (I / Iunity) ** 2;

    legQ.setAttribute("x1", p.x(P)); legQ.setAttribute("y1", p.y(0));
    legQ.setAttribute("x2", p.x(P)); legQ.setAttribute("y2", p.y(Q));
    hyp.setAttribute("x1", p.x(0)); hyp.setAttribute("y1", p.y(0));
    hyp.setAttribute("x2", p.x(P)); hyp.setAttribute("y2", p.y(Q));
    shade.setAttribute("d", triD(p, [[0, 0], [P, 0], [P, Q]]));

    // the drawn angle is the one the eye measures on the plate, so it is taken
    // from the pixel geometry rather than from theta — the axes are not equalised
    const a1 = Math.atan2(p.y(0) - p.y(Q), p.x(P) - p.x(0));
    arc.setAttribute("d", arcD(p.x(0), p.y(0), 62, 0, a1));

    setText(tQ, p.x(P) + 11, (p.y(0) + p.y(Q)) / 2, `Q = ${num(Q, 0)} VAR`);
    // the hypotenuse label rides its own outward normal, so it never sits on the line
    const [sx, sy] = offNormal(p.x(0), p.y(0), p.x(P), p.y(Q), 15);
    setText(tS, sx, sy, `S = ${num(S, 0)} VA`);
    setText(tAng, p.x(0) + 62, p.y(0) - 20, `θ = ${degv(th * 180 / Math.PI, 1)}`);

    rdPf.set(`${fixed(pf, 2)} lagging`);
    rdAng.set(degv(th * 180 / Math.PI, 1));
    rdQ.set(`${num(Q, 0)} VAR`);
    rdS.set(`${num(S, 0)} VA`);
    rdI.set(`${fixed(I, 1)} A`);
    rdLoss.set(`${fixed(lossRatio, 2)} ×`, " of the unity-pf loss");

    rdNote.set(
      pf > 0.98
        ? "<b>Nothing wasted.</b> Every amp in the cable is doing work. This is what you are aiming at, and what the utility wants you at."
        : pf >= 0.9
          ? "Acceptable. Most utilities set their penalty threshold near <b>0.9</b>, which is where this stops costing you money."
          : `The load still does <b>1728 W</b> of work. But the cable now carries <b>${fixed(I, 1)} A</b> instead of ${fixed(Iunity, 1)} A, and burns <b>${fixed(lossRatio, 2)}×</b> the copper loss — for nothing.`
    );
  }

  const k = knob({
    label: "power factor", min: 0.5, max: 1, step: 0.01, value: 0.6,
    format: (v) => (v >= 0.995 ? "1.00 (unity)" : `${fixed(v, 2)} lagging`),
    onInput: draw,
  });
  draw(0.6);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdPf, rdAng, rdQ, rdS, rdI, rdLoss, rdNote),
    _reset: () => k.set(0.6),
  };
}

/* ==========================================================================
   Plate 38 — buying the angle back
   One knob: capacitor reactive power. Lesson: Q subtracts, and the current
   falls with it. Over-correct and you are back where you started, leading.
   ========================================================================== */

function pfCorrection() {
  const P = BRANCH.P;
  const Q0 = 2304;                            // the load's own reactive demand
  const S0 = 2880;

  // equal scales again, for the same reason as Plate 37. The vertical range
  // reserves room below the axis, because over-correction is a state the
  // reader is meant to reach.
  const p = new Plot({
    w: 520, h: 420, xr: [-1300, 3118], yr: [-1000, 2650],
    pad: { l: 30, r: 30, t: 16, b: 24 },
    label:
      "The load's power triangle with a capacitor's reactive power drawn as a " +
      "downward arrow that shortens the reactive leg. As the capacitor grows the " +
      "hypotenuse shrinks toward the fixed real-power leg, then swings below it " +
      "into a leading power factor.",
  });

  p.line(0, 0, P, 0, { color: "q-x", width: 3 });
  p.text(P / 2, 0, "P = 1728 W  (unchanged, always)", { dy: 20, color: "q-x", size: 12, weight: 600 });

  // the uncorrected triangle stays on the plate as a dashed ghost to measure against
  p.line(P, 0, P, Q0, { color: "muted", width: 1.5, dash: "5 4" });
  p.line(0, 0, P, Q0, { color: "muted", width: 1.5, dash: "5 4" });
  p.text(0, Q0, "uncorrected", { dy: -16, dx: 4, color: "muted", size: 10.5, anchor: "start" });
  p.text(0, Q0, "2880 VA at 0.6", { dy: -2, dx: 4, color: "muted", size: 10.5, anchor: "start" });

  const shade = p.polygon([[0, 0]], { fill: "q-r-soft", stroke: null });
  const legQ = p.line(0, 0, 0, 0, { color: "q-y", width: 3 });
  const hyp = p.line(0, 0, 0, 0, { color: "q-r", width: 3 });
  const cap = p.vector(0, 0, 0, 0, { color: "q-r", width: 2.5, dash: "4 3" });
  const tCap = p.text(0, 0, "", { color: "q-r", size: 11, anchor: "start" });
  const tS = p.text(0, 0, "", { color: "q-r", size: 12, anchor: "middle", weight: 600 });

  const rdQc = readout({ key: "capacitor", value: "", tone: "r" });
  const rdQnet = readout({ key: "net Q", value: "", tone: "y" });
  const rdS = readout({ key: "apparent S", value: "", tone: "r" });
  const rdPf = readout({ key: "power factor", value: "" });
  const rdI = readout({ key: "current at 120 V", value: "", tone: "y" });
  const rdC = readout({ key: "capacitance", value: "", sub: " at 60 Hz" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(Qc) {
    const Qn = Q0 - Qc;
    const S = Math.hypot(P, Qn);
    const pf = P / S;
    const I = lineCurrent(P, pf);
    const C = Qc <= 0 ? 0 : Qc / (2 * Math.PI * BRANCH.f * BRANCH.V ** 2);

    legQ.setAttribute("x1", p.x(P)); legQ.setAttribute("y1", p.y(0));
    legQ.setAttribute("x2", p.x(P)); legQ.setAttribute("y2", p.y(Qn));
    hyp.setAttribute("x1", p.x(0)); hyp.setAttribute("y1", p.y(0));
    hyp.setAttribute("x2", p.x(P)); hyp.setAttribute("y2", p.y(Qn));
    shade.setAttribute("d", triD(p, [[0, 0], [P, 0], [P, Qn]]));

    // the capacitor arrow hangs off the top of the original leg, pointing down
    const shown = Math.max(Qc, 1);
    const xc = P + 430;
    cap.setAttribute("x1", p.x(xc)); cap.setAttribute("y1", p.y(Q0));
    cap.setAttribute("x2", p.x(xc)); cap.setAttribute("y2", p.y(Q0 - shown));
    cap.style.opacity = Qc > 0 ? "1" : "0";
    setText(tCap, p.x(xc) + 9, (p.y(Q0) + p.y(Q0 - shown)) / 2,
      Qc > 0 ? `−${num(Qc, 0)} VAR` : "");
    const [sx, sy] = offNormal(p.x(0), p.y(0), p.x(P), p.y(Qn), 15);
    setText(tS, sx, sy, `S = ${num(S, 0)} VA`);

    rdQc.set(`${num(Qc, 0)} VAR`);
    rdQnet.set(`${num(Qn, 0)} VAR`);
    rdS.set(`${num(S, 0)} VA`);
    rdPf.set(`${fixed(pf, 3)} ${Qn > 1 ? "lagging" : Qn < -1 ? "leading" : "unity"}`);
    rdI.set(`${fixed(I, 1)} A`);
    rdC.set(C ? `${num(C * 1e6, 0)} µF` : "—");

    const I0 = lineCurrent(P, P / S0);
    const drop = 1 - I / I0;
    rdNote.set(
      Qn < -150
        ? `<b>Over-corrected.</b> The power factor is ${fixed(pf, 3)} <b>leading</b> now — the capacitor supplies more reactive power than the load wants, and the surplus flows back out into the line. The current is climbing again. <b>Leading is not better than lagging; both are angle.</b>`
        : Math.abs(Qn) <= 150
          ? "<b>Unity.</b> The capacitor supplies every VAR the load needs, and the line carries nothing but real power. Textbook-perfect, and rarely done in practice — a load that varies would swing straight past it into leading."
          : `Current down <b>${fixed(drop * 100, 0)}%</b> from the uncorrected ${fixed(I0, 1)} A. The load's work has not changed by one watt.`
    );
  }

  // opens at the worked example's answer, so the plate shows the payoff rather
  // than a copy of Plate 37; sliding back to zero is the "before"
  const k = knob({
    label: "capacitor", min: 0, max: 3200, step: 1, value: 1467,
    format: (v) => `${num(v, 0)} VAR`,
    onInput: draw,
  });
  draw(1467);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdQc, rdQnet, rdS, rdPf, rdI, rdC, rdNote),
    _reset: () => k.set(1467),
  };
}

/* -------------------------------------------------------------------------
   small shared helpers
   ------------------------------------------------------------------------- */

function setText(node, px, py, str) {
  node.setAttribute("x", px);
  node.setAttribute("y", py);
  node.textContent = str;
}

/** A point offset from a segment's midpoint along its outward normal, in pixels. */
function offNormal(x0, y0, x1, y1, d) {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  return [(x0 + x1) / 2 + (dy / len) * d, (y0 + y1) / 2 - (dx / len) * d + 4];
}

/** Closed path through data-space points — Plot.polygon draws a path, not a <polygon>. */
const triD = (p, pts) =>
  "M " + pts.map(([a, b]) => `${p.x(a).toFixed(2)} ${p.y(b).toFixed(2)}`).join(" L ") + " Z";

/** Arc in screen space, sampled rather than swept, so no large-arc flag to get wrong. */
function arcD(cx, cy, r, a0, a1) {
  const steps = Math.max(8, Math.round(Math.abs(a1 - a0) * 24));
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = a0 + (i / steps) * (a1 - a0);
    pts.push(`${(cx + r * Math.cos(t)).toFixed(2)} ${(cy - r * Math.sin(t)).toFixed(2)}`);
  }
  return "M " + pts.join(" L ");
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("powerCost", { no: 37, build: () => {
  const f = powerCost();
  return plate({
    no: 37, title: "What a power factor costs", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "<b>Slide it to 1.00 and watch what does not move.</b> The real power leg " +
      "never changes — the load does the same job at every setting. Everything " +
      "else on the plate grows as the angle opens, and the utility sizes its " +
      "cables, transformers and switchgear for <b>S</b>, not for P. That is the " +
      "whole reason a power factor penalty exists: at 0.6 you are asking for wiring " +
      "built to carry 2880 VA in order to consume 1728 W.",
  });
} });

register("pfCorrection", { no: 38, build: () => {
  const f = pfCorrection();
  return plate({
    no: 38, title: "Correcting the power factor", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "A capacitor's reactive power is <b>negative</b>, so it subtracts from the " +
      "load's. Nothing about the load changes; the VARs simply stop making the " +
      "round trip to the generator and shuttle between the load and the capacitor " +
      "instead. <b>Stop at 1467 VAR and the power factor is 0.9 — the current has " +
      "fallen from 24 A to exactly 16 A</b>, and the copper loss to four-ninths. " +
      "Keep going and it swings into leading, which costs exactly as much as " +
      "lagging did.",
  });
} });
