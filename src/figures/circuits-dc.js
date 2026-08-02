/* ==========================================================================
   figures/circuits-dc.js — Plates 26 to 31, the DC half.

   Colour, as declared in lib/circuit.js and held to across the module:
     q-x  voltage      q-y  current      q-r  the result being computed
   ========================================================================== */

import { svg as svgRaw, el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Schematic, solve, parallel } from "../lib/circuit.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";
import { texd } from "../lib/tex.js";

const V = (n) => `var(--${n})`;

/* ==========================================================================
   Plate 26 — the cast circuit, with both laws checked live
   One knob: the right-hand resistor. Lesson: the two sums balance at every
   value, so they are a free check on any answer.
   ========================================================================== */

function castCircuit() {
  const VS = 100, RS = 2, R1 = 12;

  const s = new Schematic({
    w: 10.4, h: 4.05, unit: 53, pad: 38,
    label: "A 100 volt source in series with a 2 ohm resistor, feeding a 12 ohm " +
           "and an adjustable resistor in parallel. Branch currents and node " +
           "voltages are shown, with the KCL and KVL sums checked below.",
  });

  /* --- the drawing ---------------------------------------------------------- */
  s.wire([[1, 0], [2, 0]]);
  s.wire([[4, 0], [9, 0]]);
  s.wire([[1, 3], [1, 4], [9, 4], [9, 3]]);
  s.wire([[6, 1], [6, 0]]);
  s.wire([[6, 3], [6, 4]]);
  s.wire([[9, 0], [9, 1]]);

  s.source([1, 2], "v", { kind: "dc", label: "100 V", at: "w", color: "q-x" });
  s.wire([[1, 0], [1, 1]]);
  s.resistor([3, 0], "h", { label: "2 Ω", color: "ink", at: "n" });
  s.resistor([6, 2], "v", { label: "12 Ω", color: "ink", at: "w" });
  const rAdj = s.resistor([9, 2], "v", { label: "4 Ω", color: "q-r", at: "e" });

  s.node([6, 0]);
  s.node([6, 4]);
  s.ground([3.5, 4]);
  s.label([6, 0], "P", { at: "nw", color: "muted", size: 12, gap: 15 });

  const iTot = s.current([4.9, 0], "e", { label: "20.0 A", color: "q-y", offset: -13 });
  const i12 = s.current([6, 3.4], "s", { label: "5.0 A", color: "q-y", offset: -13 });
  const i4 = s.current([9, 3.4], "s", { label: "15.0 A", color: "q-y", offset: -13 });
  const vp = s.label([7.45, 1.0], "Vp = 60.0 V", { at: "c", color: "q-x", size: 12.5, weight: 500 });

  /* --- readouts ------------------------------------------------------------- */
  const rdVp = readout({ key: "node P", value: "60.0 V", tone: "x" });
  const rdI = readout({ key: "total current", value: "20.0 A", tone: "y" });
  const rdKcl = readout({ key: "KCL at P", value: "5.0 + 15.0 = 20.0 ✓", tone: "r" });
  const rdKvl = readout({ key: "KVL round the left loop", value: "100 − 40 − 60 = 0 ✓", tone: "r" });
  rdKcl.root.classList.add("wide");
  rdKvl.root.classList.add("wide");

  function draw(R2) {
    // one unknown node, solved the same way the prose does it
    const G = [[1 / RS + 1 / R1 + 1 / R2]];
    const [Vp] = solve(G, [VS / RS]);
    const It = (VS - Vp) / RS, i1 = Vp / R1, i2 = Vp / R2;
    const drop = It * RS;

    Schematic.setLabel(rAdj.label, `${num(R2, 1)} Ω`);
    Schematic.setLabel(iTot.label, `${fixed(It, 1)} A`);
    Schematic.setLabel(i12.label, `${fixed(i1, 1)} A`);
    Schematic.setLabel(i4.label, `${fixed(i2, 1)} A`);
    Schematic.setLabel(vp, `Vp = ${fixed(Vp, 1)} V`);

    rdVp.set(`${fixed(Vp, 1)} V`);
    rdI.set(`${fixed(It, 1)} A`);
    rdKcl.set(`${fixed(i1, 1)} + ${fixed(i2, 1)} = ${fixed(i1 + i2, 1)} ✓`);
    rdKvl.set(`100 − ${fixed(drop, 1)} − ${fixed(Vp, 1)} = ${fixed(VS - drop - Vp, 1)} ✓`);
  }

  const k = knob({
    label: "the right-hand resistor", min: 1, max: 20, step: 0.5, value: 4,
    format: (v) => `${num(v, 1)} Ω`,
    onInput: draw,
  });

  draw(4);

  return plate({
    no: 26,
    title: "The cast circuit, and both laws holding",
    tag: "interactive",
    label: "The cast circuit",
    stage: s.root,
    controls: el("div.plate-controls", null, k.root),
    readouts: readouts(rdVp, rdI, rdKcl, rdKvl),
    caption:
      "Move the resistor anywhere between 1 Ω and 20 Ω and both check lines stay " +
      "balanced — they are not coincidences of the chosen numbers, they are the " +
      "two conservation laws. <b>At 4 Ω every quantity is a whole number</b>, which " +
      "is why that is the value the rest of this module uses. Push it to 1 Ω and " +
      "watch the total current climb: a smaller parallel branch draws more, and " +
      "loads the source harder.",
  });
}

/* --- registration ---------------------------------------------------------- */

register("castCircuit", { no: 26, build: castCircuit });

/* ==========================================================================
   Plate 27 — the two rules pulling in opposite directions
   One knob: the second resistor. Lesson: adding a lane always helps, so a
   parallel combination is smaller than its smallest member.
   ========================================================================== */

function seriesParallel() {
  const R1 = 10;
  const W = 620, H = 260, LEFT = 108, RIGHT = W - 34;
  const SCALE = 60;                       // pixels per 10 Ω on the series bar

  const root = svgEl(W, H,
    "Two bar diagrams. On the left, series resistance shown as two bars laid " +
    "end to end, always longer than either. On the right, parallel conductance " +
    "shown as two lanes stacked, whose total width gives an equivalent " +
    "resistance smaller than either resistor.");

  const bar = (y, x, w, color, op = 1) => root.appendChild(svgRect(x, y, w, 22, color, op));
  const txt = (x, y, t, o = {}) => root.appendChild(svgText(x, y, t, o));

  txt(LEFT - 14, 44, "IN SERIES", { anchor: "end", color: "muted", size: 11, weight: 500 });
  txt(LEFT - 14, 60, "resistances add", { anchor: "end", color: "faint", size: 10 });
  txt(LEFT - 14, 152, "IN PARALLEL", { anchor: "end", color: "muted", size: 11, weight: 500 });
  txt(LEFT - 14, 168, "conductances add", { anchor: "end", color: "faint", size: 10 });
  txt(LEFT - 14, 182, "wider = easier", { anchor: "end", color: "faint", size: 10 });
  txt(LEFT, 244, "A wider bar is more conductance, which is less resistance.",
      { anchor: "start", color: "faint", size: 10.5 });

  const sA = bar(32, LEFT, R1 * SCALE / 10, "q-x");
  const sB = bar(32, LEFT, 0, "q-y");
  const sEq = bar(66, LEFT, 0, "q-r");
  const sAt = txt(0, 47, "", { size: 11.5, color: "plate", weight: 500 });
  const sBt = txt(0, 47, "", { size: 11.5, color: "plate", weight: 500 });
  const sEqt = txt(0, 81, "", { anchor: "start", size: 12, color: "q-r", weight: 500 });

  const pA = bar(140, LEFT, 0, "q-x");
  const pB = bar(166, LEFT, 0, "q-y");
  const pEq = bar(200, LEFT, 0, "q-r");
  const pAt = txt(0, 155, "", { anchor: "start", size: 11.5, color: "muted" });
  const pBt = txt(0, 181, "", { anchor: "start", size: 11.5, color: "muted" });
  const pEqt = txt(0, 215, "", { anchor: "start", size: 12, color: "q-r", weight: 500 });

  // the reference mark: nothing in the parallel row may reach past R1's own width
  const gate = root.appendChild(svgLine(0, 132, 0, 216, "q-bad", "4 4"));
  const gateT = txt(0, 128, "1 / 10 Ω", { size: 10, color: "q-bad", anchor: "middle" });

  const rd1 = readout({ key: "R₁", value: "10 Ω", tone: "x" });
  const rd2 = readout({ key: "R₂", value: "10 Ω", tone: "y" });
  const rdS = readout({ key: "in series", value: "20.0 Ω", tone: "r" });
  const rdP = readout({ key: "in parallel", value: "5.00 Ω", tone: "r" });
  const rdNote = readout({ key: "notice", value: "" });
  rdNote.root.classList.add("wide");

  function draw(R2) {
    const Rs = R1 + R2, Rp = parallel(R1, R2);
    const wA = (R1 / 10) * SCALE, wB = (R2 / 10) * SCALE;
    const span = RIGHT - LEFT;
    // series bars are drawn to scale until they would leave the plate
    const k = Math.min(1, span / ((R1 + R2) / 10 * SCALE));

    setRect(sA, LEFT, wA * k);
    setRect(sB, LEFT + wA * k, wB * k);
    setRect(sEq, LEFT, (wA + wB) * k);
    setText(sAt, LEFT + wA * k / 2, `${num(R1)} Ω`);
    setText(sBt, LEFT + wA * k + wB * k / 2, wB * k > 34 ? `${num(R2, 1)} Ω` : "");
    setText(sEqt, LEFT + (wA + wB) * k + 8, `${fixed(Rs, 1)} Ω`);

    // conductance rows: width proportional to 1/R, on a scale where 1/10 S is fixed
    const G = 900;                        // pixels per siemens
    const gA = (1 / R1) * G, gB = (1 / R2) * G, gEq = (1 / Rp) * G;
    const gk = Math.min(1, span / gEq);
    setRect(pA, LEFT, gA * gk);
    setRect(pB, LEFT, gB * gk);
    setRect(pEq, LEFT, gEq * gk);
    setText(pAt, LEFT + gA * gk + 8, `1/${num(R1)}`);
    setText(pBt, LEFT + gB * gk + 8, `1/${num(R2, 1)}`);
    setText(pEqt, LEFT + gEq * gk + 8, `${fixed(1 / Rp, 3)} S  →  ${fixed(Rp, 2)} Ω`);

    gate.setAttribute("x1", LEFT + gA * gk);
    gate.setAttribute("x2", LEFT + gA * gk);
    setText(gateT, LEFT + gA * gk, "R₁ alone");
    gateT.setAttribute("text-anchor", gEq * gk - gA * gk < 46 ? "end" : "middle");

    rd2.set(`${num(R2, 1)} Ω`);
    rdS.set(`${fixed(Rs, 1)} Ω`);
    rdP.set(`${fixed(Rp, 2)} Ω`);
    rdNote.set(
      `the parallel result is smaller than both ${num(R1)} Ω and ${num(R2, 1)} Ω — ` +
      `by ${fixed(Math.min(R1, R2) / Rp, 2)}× below the smaller one`
    );
  }

  const k = knob({
    label: "R₂", min: 0.5, max: 50, step: 0.5, value: 10,
    format: (v) => `${num(v, 1)} Ω`,
    onInput: draw,
  });
  draw(10);

  return plate({
    no: 27,
    title: "Series adds R; parallel adds 1/R",
    tag: "interactive",
    label: "Series and parallel compared",
    stage: root,
    controls: el("div.plate-controls", null, k.root),
    readouts: readouts(rd1, rd2, rdS, rdP, rdNote),
    caption:
      "Push R₂ up to 50 Ω. The series bar keeps growing; the parallel bar barely " +
      "moves, because a nearly-closed lane adds almost no capacity. Now pull it " +
      "down to 0.5 Ω and the parallel result collapses towards zero. <b>The teal " +
      "parallel bar never gets shorter than the blue one</b> — adding a route " +
      "cannot make traffic worse, which is the whole reason a parallel combination " +
      "is smaller than its smallest member.",
  });
}

/* ==========================================================================
   Plate 28 — the two dividers, and the numerator that differs
   ========================================================================== */

function dividers() {
  const R1 = 12;

  const s = new Schematic({
    w: 15, h: 5.4, unit: 33, pad: 60,
    label: "A voltage divider and a current divider drawn side by side from the " +
           "same two resistors, with each branch's share labelled.",
  });

  /* --- left: a voltage divider ----------------------------------------------
     Bodies are two grid units long, so stacked resistors need their centres
     two units apart or they overlap.
     -------------------------------------------------------------------------- */
  s.label([2.5, -0.5], "VOLTAGE DIVIDER · in series", { at: "c", color: "muted", size: 11, weight: 500 });
  s.wire([[1, 1.5], [1, 0.5], [4, 0.5], [4, 1.5]]);
  s.wire([[1, 3.5], [1, 4.5], [4, 4.5], [4, 4.5]]);
  s.wire([[4, 4.5], [4, 4.5]]);
  s.source([1, 2.5], "v", { kind: "dc", label: "60 V", at: "w", color: "q-x" });
  const vTop = s.resistor([4, 1.5], "v", { label: "12 Ω", at: "e", color: "ink" });
  const vBot = s.resistor([4, 3.5], "v", { label: "4 Ω", at: "e", color: "ink" });
  s.wire([[4, 4.5], [1, 4.5]]);
  s.ground([2.5, 4.5]);
  const v1 = s.label([2.6, 1.5], "45.0 V", { at: "c", color: "q-x", size: 12, weight: 500 });
  const v2 = s.label([2.6, 3.5], "15.0 V", { at: "c", color: "q-x", size: 12, weight: 500 });

  /* --- right: a current divider --------------------------------------------- */
  s.label([11, -0.5], "CURRENT DIVIDER · in parallel", { at: "c", color: "muted", size: 11, weight: 500 });
  s.wire([[8, 1.5], [8, 0.5], [14, 0.5], [14, 1.5]]);
  s.wire([[8, 3.5], [8, 4.5], [14, 4.5], [14, 3.5]]);
  s.wire([[11, 0.5], [11, 1.5]]);
  s.wire([[11, 3.5], [11, 4.5]]);
  s.source([8, 2.5], "v", { kind: "i", label: "20 A", at: "w", color: "q-y" });
  const cA = s.resistor([11, 2.5], "v", { label: "12 Ω", at: "w", color: "ink" });
  const cB = s.resistor([14, 2.5], "v", { label: "4 Ω", at: "e", color: "ink" });
  s.node([11, 0.5]);
  s.node([11, 4.5]);
  // offsets point outward from each other, or the two labels collide
  const i1 = s.current([11, 4.05], "s", { label: "5.0 A", color: "q-y", offset: -12 });
  const i2 = s.current([14, 4.05], "s", { label: "15.0 A", color: "q-y", offset: 12 });

  const rdR2 = readout({ key: "the second resistor", value: "4 Ω" });
  const rdV = readout({ key: "voltage share · own R on top", value: "", tone: "x" });
  const rdI = readout({ key: "current share · other R on top", value: "", tone: "y" });
  const rdCheck = readout({ key: "sanity", value: "" });
  rdV.root.classList.add("wide");
  rdI.root.classList.add("wide");
  rdCheck.root.classList.add("wide");

  function draw(R2) {
    const tot = R1 + R2;
    const VS = 60, IS = 20;
    const vA = VS * R1 / tot, vB = VS * R2 / tot;
    const iA = IS * R2 / tot, iB = IS * R1 / tot;

    Schematic.setLabel(vBot.label, `${num(R2, 1)} Ω`);
    Schematic.setLabel(cB.label, `${num(R2, 1)} Ω`);
    Schematic.setLabel(v1, `${fixed(vA, 1)} V`);
    Schematic.setLabel(v2, `${fixed(vB, 1)} V`);
    Schematic.setLabel(i1.label, `${fixed(iA, 1)} A`);
    Schematic.setLabel(i2.label, `${fixed(iB, 1)} A`);

    rdR2.set(`${num(R2, 1)} Ω`);
    rdV.set(`the 12 Ω takes ${num(R1)}/${fixed(tot, 0)} of 60 V = ${fixed(vA, 1)} V`);
    rdI.set(`the 12 Ω takes ${num(R2, 1)}/${fixed(tot, 0)} of 20 A = ${fixed(iA, 1)} A`);
    rdCheck.set(R2 < R1
      ? `the ${num(R2, 1)} Ω is the easier path, so it takes the larger current ✓`
      : R2 > R1
      ? `the 12 Ω is now the easier path, so it takes the larger current ✓`
      : "equal resistors, so both splits are even ✓");
  }

  const k = knob({
    label: "the second resistor", min: 1, max: 36, step: 1, value: 4,
    format: (v) => `${num(v)} Ω`,
    onInput: draw,
  });
  draw(4);

  return plate({
    no: 28,
    title: "Two dividers, one difference",
    tag: "interactive",
    label: "Voltage divider and current divider",
    stage: s.root,
    controls: el("div.plate-controls", null, k.root),
    readouts: readouts(rdR2, rdV, rdI, rdCheck),
    caption:
      "Both panels use the same two resistors, and the 12 Ω gets opposite " +
      "treatment. In series it claims the <b>larger</b> share of the voltage; in " +
      "parallel it takes the <b>smaller</b> share of the current. <b>Slide the " +
      "second resistor past 12 Ω and the favoured branch swaps in both panels at " +
      "once</b> — that crossing is the whole reason the two numerators differ.",
  });
}

/* --- small SVG helpers, local to the bar figure --------------------------- */

function svgEl(w, h, label) {
  return svgRaw("svg", {
    viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": label,
    style: { display: "block", width: "100%", height: "auto" },
  });
}
const svgRect = (x, y, w, h, color, opacity = 1) =>
  svgRaw("rect", { x, y, width: Math.max(0, w), height: h, rx: 2, fill: V(color), opacity });
const svgLine = (x1, y1, x2, y2, color, dash) =>
  svgRaw("line", { x1, y1, x2, y2, stroke: V(color), strokeWidth: 1.5, strokeDasharray: dash });
const svgText = (x, y, t, { anchor = "middle", color = "ink", size = 12, weight = null } = {}) =>
  svgRaw("text", {
    class: "lbl", x, y, textAnchor: anchor, fill: V(color),
    fontSize: `${size}px`, fontWeight: weight, text: t,
  });
const setRect = (n, x, w) => { n.setAttribute("x", x); n.setAttribute("width", Math.max(0, w)); };
const setText = (n, x, t) => { n.setAttribute("x", x); n.textContent = t; };

register("seriesParallel", { no: 27, build: seriesParallel });
register("dividers", { no: 28, build: dividers });

/* ==========================================================================
   Plate 29 — the conductance matrix, read off the drawing
   One knob: the bridging resistor. Lesson: the diagonal is what touches the
   node, the off-diagonal is minus what is shared.
   ========================================================================== */

function nodeMatrix() {
  const RA = 5, RB = 10, IS = 6;          // source into A, load from B to ground

  const s = new Schematic({
    w: 9.6, h: 4.6, unit: 60, pad: 26,
    label: "A two-node circuit: a 6 amp source into node A, a 5 ohm from A to " +
           "ground, an adjustable resistor bridging A to B, and a 10 ohm from B " +
           "to ground. Beside it, the conductance matrix the circuit produces.",
  });

  s.wire([[1, 1.5], [1, 0.5], [3, 0.5]]);
  s.wire([[3, 0.5], [3, 1.5]]);
  s.wire([[5, 0.5], [3, 0.5]]);
  s.wire([[7, 0.5], [7, 1.5]]);
  s.wire([[1, 3.5], [1, 4.5], [7, 4.5], [7, 3.5]]);
  s.wire([[3, 3.5], [3, 4.5]]);
  s.source([1, 2.5], "v", { kind: "i", label: "6 A", at: "w", color: "q-y" });
  s.resistor([3, 2.5], "v", { label: "5 Ω", at: "w", color: "ink" });
  const rBridge = s.resistor([5, 0.5], "h", { label: "4 Ω", at: "n", color: "q-r" });
  s.resistor([7, 2.5], "v", { label: "10 Ω", at: "e", color: "ink" });
  s.node([3, 0.5], { label: "A", at: "nw", labelColor: "q-x" });
  s.node([7, 0.5], { label: "B", at: "ne", labelColor: "q-x" });
  s.node([3, 4.5]);
  s.ground([5, 4.5]);
  const vA = s.label([2.15, 1.05], "", { at: "c", color: "q-x", size: 12, weight: 500 });
  const vB = s.label([7.9, 1.05], "", { at: "c", color: "q-x", size: 12, weight: 500 });

  /* the matrix, as live text beside the drawing */
  const mathBox = el("div", { style: { textAlign: "center", padding: "0 0 var(--s2)" } });

  const rdA = readout({ key: "V at A", value: "", tone: "x" });
  const rdB = readout({ key: "V at B", value: "", tone: "x" });
  const rdDiag = readout({ key: "diagonal = what touches the node", value: "" });
  const rdOff = readout({ key: "off-diagonal = minus what is shared", value: "" });
  rdDiag.root.classList.add("wide");
  rdOff.root.classList.add("wide");

  function draw(Rb) {
    const gA = 1 / RA + 1 / Rb;
    const gB = 1 / RB + 1 / Rb;
    const gAB = 1 / Rb;
    const [VA, VB] = solve([[gA, -gAB], [-gAB, gB]], [IS, 0]);

    Schematic.setLabel(rBridge.label, `${num(Rb, 1)} Ω`);
    Schematic.setLabel(vA, `${fixed(VA, 2)} V`);
    Schematic.setLabel(vB, `${fixed(VB, 2)} V`);

    mathBox.innerHTML = texd(
      `\\begin{bmatrix} ${fixed(gA, 3)} & ${fixed(-gAB, 3)} \\\\ ` +
      `${fixed(-gAB, 3)} & ${fixed(gB, 3)} \\end{bmatrix}` +
      `\\begin{bmatrix} V_A \\\\ V_B \\end{bmatrix} = ` +
      `\\begin{bmatrix} ${fixed(IS, 0)} \\\\ 0 \\end{bmatrix}`
    );

    rdA.set(`${fixed(VA, 2)} V`);
    rdB.set(`${fixed(VB, 2)} V`);
    rdDiag.set(`at A: 1/${RA} + 1/${num(Rb, 1)} = ${fixed(gA, 3)} S · at B: 1/${RB} + 1/${num(Rb, 1)} = ${fixed(gB, 3)} S`);
    rdOff.set(`only the ${num(Rb, 1)} Ω bridges A and B, so both corners are −1/${num(Rb, 1)} = ${fixed(-gAB, 3)} S`);
  }

  const k = knob({
    label: "the resistor bridging A and B", min: 1, max: 40, step: 0.5, value: 4,
    format: (v) => `${num(v, 1)} Ω`,
    onInput: draw,
  });
  draw(4);

  return plate({
    no: 29,
    title: "The conductance matrix, by inspection",
    tag: "interactive",
    label: "A two-node circuit and its conductance matrix",
    stage: [s.root, mathBox],
    controls: el("div.plate-controls", null, k.root),
    readouts: readouts(rdA, rdB, rdDiag, rdOff),
    caption:
      "Change the bridging resistor and <b>four entries move at once</b> — both " +
      "diagonals, because that resistor touches both nodes, and both off-diagonals, " +
      "because it is what they share. Push it to 40 Ω and the corners approach " +
      "zero: with almost nothing joining them, the two halves stop interacting and " +
      "the matrix becomes diagonal. <b>Zero off-diagonal means two independent " +
      "circuits.</b>",
  });
}

/* ==========================================================================
   Plate 30 — the black box, and the two components that replace it
   ========================================================================== */

function theveninBox() {
  const VS = 100, R1 = 20, R2 = 5;
  const VTH = VS * R2 / (R1 + R2);        // 20 V
  const RTH = parallel(R1, R2);           // 4 Ω

  const s = new Schematic({
    w: 16, h: 4.0, unit: 32, pad: 56,
    label: "On the left, a 100 volt source with a 20 ohm and a 5 ohm divider " +
           "feeding a load. On the right, a 20 volt source behind 4 ohms feeding " +
           "the same load. Both meters read identically at every load value.",
  });

  /* --- original --------------------------------------------------------------- */
  s.label([3, -0.6], "THE ORIGINAL NETWORK", { at: "c", color: "muted", size: 11, weight: 500 });
  s.wire([[0, 1.5], [0, 0.5], [2, 0.5]]);
  s.wire([[4, 0.5], [6, 0.5], [6, 1.5]]);
  s.wire([[0, 3.5], [0, 4.5], [6, 4.5], [6, 3.5]]);
  s.wire([[4, 0.5], [4, 1.5]]);
  s.wire([[4, 3.5], [4, 4.5]]);
  s.source([0, 2.5], "v", { kind: "dc", label: "100 V", at: "w", color: "q-x" });
  s.resistor([3, 0.5], "h", { label: "20 Ω", at: "n", color: "ink" });
  s.resistor([4, 2.5], "v", { label: "5 Ω", at: "w", color: "ink" });
  const loadA = s.box([6, 2.5], "v", { label: "RL", at: "e", color: "q-r" });
  s.node([4, 0.5]);
  s.node([4, 4.5]);
  s.ground([2, 4.5]);
  // clear of the 5 Ω label, which sits west of the middle branch
  const readA = s.label([5, 3.9], "", { at: "c", color: "q-y", size: 12.5, weight: 500 });

  /* --- equivalent -------------------------------------------------------------- */
  s.label([12.5, -0.6], "ITS THÉVENIN EQUIVALENT", { at: "c", color: "muted", size: 11, weight: 500 });
  s.wire([[10, 1.5], [10, 0.5], [11, 0.5]]);
  s.wire([[13, 0.5], [15, 0.5], [15, 1.5]]);
  s.wire([[10, 3.5], [10, 4.5], [15, 4.5], [15, 3.5]]);
  s.source([10, 2.5], "v", { kind: "dc", label: "20 V", at: "w", color: "q-x" });
  s.resistor([12, 0.5], "h", { label: "4 Ω", at: "n", color: "ink" });
  const loadB = s.box([15, 2.5], "v", { label: "RL", at: "e", color: "q-r" });
  s.ground([12.5, 4.5]);
  const readB = s.label([13, 3.9], "", { at: "c", color: "q-y", size: 12.5, weight: 500 });

  const rdLoad = readout({ key: "load", value: "" });
  const rdOrig = readout({ key: "original network", value: "", tone: "y" });
  const rdEquiv = readout({ key: "Thévenin equivalent", value: "", tone: "y" });
  const rdSame = readout({ key: "agreement", value: "" });
  rdSame.root.classList.add("wide");

  function draw(RL) {
    // original: the load is in parallel with R2, that pair in series with R1
    const rp = parallel(R2, RL);
    const vLoadA = VS * rp / (R1 + rp);
    const iA = vLoadA / RL;
    // equivalent: a plain divider
    const vLoadB = VTH * RL / (RTH + RL);
    const iB = vLoadB / RL;

    Schematic.setLabel(loadA.label, `${num(RL, 1)} Ω`);
    Schematic.setLabel(loadB.label, `${num(RL, 1)} Ω`);
    Schematic.setLabel(readA, `${fixed(vLoadA, 2)} V`);
    Schematic.setLabel(readB, `${fixed(vLoadB, 2)} V`);

    rdLoad.set(`${num(RL, 1)} Ω`);
    rdOrig.set(`${fixed(vLoadA, 3)} V`, ` · ${fixed(iA, 3)} A`);
    rdEquiv.set(`${fixed(vLoadB, 3)} V`, ` · ${fixed(iB, 3)} A`);
    rdSame.set(Math.abs(vLoadA - vLoadB) < 5e-4
      ? "identical to three decimals, at this load and at every other ✓"
      : `differ by ${fixed(Math.abs(vLoadA - vLoadB), 4)} V — which would mean an arithmetic slip`);
  }

  const k = knob({
    label: "load resistance", min: 0.5, max: 40, step: 0.5, value: 4,
    format: (v) => `${num(v, 1)} Ω`,
    onInput: draw,
  });
  draw(4);

  return plate({
    no: 30,
    title: "Two circuits nothing outside can tell apart",
    tag: "interactive",
    label: "A network and its Thévenin equivalent",
    stage: s.root,
    controls: el("div.plate-controls", null, k.root),
    readouts: readouts(rdLoad, rdOrig, rdEquiv, rdSame),
    caption:
      "Sweep the load across the whole range and the two readings never separate. " +
      "That is what the theorem claims and it is worth seeing rather than trusting: " +
      "<b>from the load's point of view, four components and two are the same " +
      "circuit.</b> Turn the load down towards 0.5 Ω and both collapse together; " +
      "turn it up and both approach 20 V, which is <span class='math'>V_{th}</span> " +
      "with nothing drawing current.",
  });
}

/* ==========================================================================
   Plate 31 — the power curve, and the flat peak on top of it
   ========================================================================== */

function maxPower() {
  const VTH = 20, RTH = 4;
  const P = (RL) => (VTH * VTH * RL) / Math.pow(RTH + RL, 2);
  const PMAX = (VTH * VTH) / (4 * RTH);

  const p = new Plot({
    w: 560, h: 320, xr: [0, 24], yr: [0, 30],
    pad: { l: 46, r: 24, t: 18, b: 38 },
    label: "Power delivered to the load against load resistance. It peaks at 25 " +
           "watts when the load equals the 4 ohm Thévenin resistance, and the peak " +
           "is broad.",
  });
  p.grid({ xStep: 2, yStep: 5 });
  p.axes({
    xStep: 4, yStep: 10, xLabel: "R_L (Ω)", yLabel: "P (W)",
    xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)),
  });
  p.curve(P, { color: "q-r", width: 2.75 });
  // the 89%-of-peak band, to make "the peak is flat" a thing you can see
  p.line(0, PMAX * 0.89, 24, PMAX * 0.89, { color: "muted", width: 1, dash: "4 4" });
  p.text(23.4, PMAX * 0.89, "89% of the peak", { color: "muted", size: 10.5, dy: -6, anchor: "end", bg: true });
  p.ring(RTH, PMAX, { color: "q-r", r: 6, width: 2 });
  p.text(RTH, PMAX, "matched", { color: "q-r", size: 11.5, dy: -14, bg: true });

  const marker = p.line(RTH, 0, RTH, PMAX, { color: "q-x", width: 1.5, dash: "3 3" });
  const dot = p.dot(RTH, PMAX, { color: "q-x", r: 5.5 });

  const rdRL = readout({ key: "load", value: "" });
  const rdP = readout({ key: "power in the load", value: "", tone: "r" });
  const rdPct = readout({ key: "share of the peak", value: "" });
  const rdEff = readout({ key: "efficiency", value: "", tone: "y" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(RL) {
    const pw = P(RL);
    const eff = RL / (RTH + RL);
    marker.setAttribute("x1", p.x(RL)); marker.setAttribute("x2", p.x(RL));
    marker.setAttribute("y2", p.y(pw));
    for (const c of dot.childNodes) { c.setAttribute("cx", p.x(RL)); c.setAttribute("cy", p.y(pw)); }

    rdRL.set(`${num(RL, 1)} Ω`);
    rdP.set(`${fixed(pw, 2)} W`);
    rdPct.set(`${fixed((pw / PMAX) * 100, 1)}%`);
    rdEff.set(`${fixed(eff * 100, 1)}%`);
    rdNote.set(Math.abs(RL - RTH) < 0.26
      ? "matched — maximum power, and exactly half of it is wasted inside the source"
      : RL < RTH
      ? "load too small: it gets plenty of current but almost no voltage"
      : "load too large: it gets plenty of voltage but almost no current — though efficiency is climbing");
  }

  const k = knob({
    label: "load resistance", min: 0.25, max: 24, step: 0.25, value: 4,
    format: (v) => `${num(v, 2)} Ω`,
    onInput: draw,
  });
  draw(4);

  return plate({
    no: 31,
    title: "Maximum power, and what it costs",
    tag: "interactive",
    label: "Load power against load resistance",
    stage: p.root,
    controls: el("div.plate-controls", null, k.root),
    readouts: readouts(rdRL, rdP, rdPct, rdEff, rdNote),
    caption:
      "Two things to take from this. <b>The peak is broad</b> — anywhere from 2 Ω " +
      "to 8 Ω still delivers 89% of the maximum, which is why matching in practice " +
      "is forgiving. And <b>watch the efficiency readout as you sweep</b>: it is " +
      "50% at the matched point and keeps climbing as the load grows. Maximum power " +
      "and maximum efficiency are different targets, and they never coincide.",
  });
}

register("nodeMatrix", { no: 29, build: nodeMatrix });
register("theveninBox", { no: 30, build: theveninBox });
register("maxPower", { no: 31, build: maxPower });
