/* ==========================================================================
   figures/gates.js — Plates 65 and 66.

   Plate 65 is the gate explorer: symbol, truth table and expression together,
   with the De Morgan twin printed alongside so the equivalence is visible
   rather than asserted.

   Plate 66 opens the box. A CMOS NAND is four MOSFETs from Electronics Part 3
   — two in parallel pulling up, two in series pulling down — and it explains
   both why NAND is the cheap primitive and why CMOS burns nothing at rest.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";

const V = (n) => `var(--${n})`;
const NS = "http://www.w3.org/2000/svg";

/* Each gate: how it computes, its shape, its expression, and its De Morgan
   twin — the same function drawn with the bubbles pushed to the other side. */
const GATES = {
  and: { name: "AND", shape: "and", bubble: false, f: (a, b) => a & b,
         tex: "Y = A · B", twin: "Y = ¬(¬A + ¬B)",
         note: "True only when <b>every</b> input is true. Its De Morgan twin is an OR gate with all three bubbles — inputs and output — which is the same circuit drawn differently." },
  or: { name: "OR", shape: "or", bubble: false, f: (a, b) => a | b,
        tex: "Y = A + B", twin: "Y = ¬(¬A · ¬B)",
        note: "True when <b>any</b> input is true. Note the notation: <b>+ means OR, not addition</b> — 1 + 1 = 1 here." },
  nand: { name: "NAND", shape: "and", bubble: true, f: (a, b) => 1 - (a & b),
          tex: "Y = ¬(A · B)", twin: "Y = ¬A + ¬B",
          note: "<b>The universal gate.</b> Every other function can be built from NANDs alone, it is the cheapest thing CMOS makes, and Plate 66 shows why — which is why real silicon is mostly NAND." },
  nor: { name: "NOR", shape: "or", bubble: true, f: (a, b) => 1 - (a | b),
         tex: "Y = ¬(A + B)", twin: "Y = ¬A · ¬B",
         note: "Also universal. Two cross-coupled NOR gates make the SR latch in Part 4 — the first circuit in this module that remembers anything." },
  xor: { name: "XOR", shape: "xor", bubble: false, f: (a, b) => a ^ b,
         tex: "Y = A ⊕ B", twin: "Y = A·¬B + ¬A·B",
         note: "True when the inputs <b>differ</b>. It is a one-bit adder's sum output, a parity checker, and a controllable inverter all at once — tie one input high and it inverts the other." },
  xnor: { name: "XNOR", shape: "xor", bubble: true, f: (a, b) => 1 - (a ^ b),
          tex: "Y = ¬(A ⊕ B)", twin: "Y = A·B + ¬A·¬B",
          note: "True when the inputs <b>match</b>, so it is a one-bit comparator. Chain them with an AND to compare whole words." },
  not: { name: "NOT", shape: "not", bubble: true, f: (a) => 1 - a, unary: true,
         tex: "Y = ¬A", twin: "—",
         note: "The only unary gate. In CMOS it is two transistors, and it is the piece every bubble in every other symbol stands for." },
};

/* ==========================================================================
   Plate 65 — the gate explorer
   One control: the gate. One knob: the input pattern. Lesson: the symbol, the
   table and the expression are three views of one thing.
   ========================================================================== */

function gateExplorer() {
  const p = new Plot({
    w: 620, h: 222, xr: [0, 588], yr: [-74.4286, 78],
    pad: { l: 16, r: 16, t: 14, b: 14 },
    label:
      "A logic gate symbol with its inputs and output labelled, beside the " +
      "gate's full truth table with the currently selected row highlighted.",
  });

  const rdGate = readout({ key: "gate", value: "" });
  const rdExpr = readout({ key: "expression", value: "", tone: "r" });
  const rdIn = readout({ key: "inputs", value: "", tone: "x" });
  const rdOut = readout({ key: "output", value: "", tone: "y" });
  const rdTwin = readout({ key: "De Morgan twin", value: "" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "nand";

  function draw(row) {
    p.clear("curve", "label", "mark", "shade");
    const G = GATES[cur];
    const unary = !!G.unary;
    const rows = unary ? 2 : 4;
    const r = Math.min(row, rows - 1);
    const a = unary ? r : (r >> 1) & 1;
    const b = unary ? 0 : r & 1;
    const y = unary ? G.f(a) : G.f(a, b);

    /* --- the symbol ------------------------------------------------------ */
    const GX = 180, GY = 6;
    if (unary) {
      p.line(GX - 84, GY, GX - 34, GY, { color: a ? "q-y" : "muted", width: a ? 2.6 : 1.8 });
      p.text(GX - 96, GY, "A", { color: "ink", size: 13, weight: 600, dy: 5 });
      p.text(GX - 60, GY + 16, `${a}`, { color: a ? "q-y" : "muted", size: 12, weight: 600 });
    } else {
      [[GY + 17, a, "A"], [GY - 17, b, "B"]].forEach(([yy, v, nm]) => {
        p.line(GX - 84, yy, GX - 34, yy, { color: v ? "q-y" : "muted", width: v ? 2.6 : 1.8 });
        p.text(GX - 96, yy, nm, { color: "ink", size: 13, weight: 600, dy: 5 });
        p.text(GX - 60, yy + 15, `${v}`, { color: v ? "q-y" : "muted", size: 12, weight: 600 });
      });
    }
    gateSymbol(p, GX, GY, G.shape, G.bubble);
    p.line(GX + (G.bubble ? 46 : 36), GY, GX + 100, GY,
      { color: y ? "q-y" : "muted", width: y ? 2.6 : 1.8 });
    p.text(GX + 112, GY, "Y", { color: "ink", size: 13, weight: 600, dy: 5 });
    p.text(GX + 74, GY + 16, `${y}`, { color: y ? "q-y" : "muted", size: 13, weight: 600 });
    p.text(GX, GY + 62, G.name, { color: "ink-strong", size: 15, weight: 600 });
    p.text(GX, -74, G.tex, { color: "q-r", size: 14, weight: 600 });

    /* --- the truth table ------------------------------------------------- */
    const TX = 400, TY = 62, RH = 27;
    const cols = unary ? ["A", "Y"] : ["A", "B", "Y"];
    cols.forEach((c, i) => p.text(TX + i * 52, TY, c,
      { color: "muted", size: 12, weight: 600 }));
    p.line(TX - 30, TY - 12, TX + (cols.length - 1) * 52 + 30, TY - 12,
      { color: "ink", width: 1.4 });
    for (let i = 0; i < rows; i++) {
      const ry = TY - 14 - (i + 1) * RH + 8;
      const ia = unary ? i : (i >> 1) & 1;
      const ib = unary ? null : i & 1;
      const iy = unary ? G.f(ia) : G.f(ia, ib);
      if (i === r) {
        band(p, TX + (cols.length - 1) * 26, ry + 4, (cols.length - 1) * 52 + 56, RH - 3);
      }
      const vals = unary ? [ia, iy] : [ia, ib, iy];
      vals.forEach((v, k) => p.text(TX + k * 52, ry, `${v}`, {
        color: k === cols.length - 1 ? (v ? "q-r" : "muted") : (v ? "q-y" : "muted"),
        size: 13, weight: i === r ? 600 : 400,
      }));
    }

    rdGate.set(G.name);
    rdExpr.set(G.tex);
    rdIn.set(unary ? `A = ${a}` : `A = ${a}, B = ${b}`);
    rdOut.set(`${y}`);
    rdTwin.set(G.twin);
    rdNote.set(G.note);
  }

  const k = knob({
    label: "input pattern", min: 0, max: 3, step: 1, value: 3,
    format: (v) => (GATES[cur].unary ? `A = ${Math.min(v, 1)}` : `A B = ${(v >> 1) & 1}${v & 1}`),
    onInput: draw,
  });
  const sc = scenarios({
    label: "gate",
    options: Object.keys(GATES).map((id) => ({ id, label: GATES[id].name })),
    value: "nand",
    onChange: (id) => { cur = id; k.set(k.value()); },
  });
  draw(3);

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdGate, rdExpr, rdIn, rdOut, rdTwin, rdNote),
  };
}

/* ==========================================================================
   Plate 66 — a NAND, in transistors
   One knob: the input pattern. Lesson: two MOSFETs in series pulling down and
   two in parallel pulling up is a NAND, and exactly one network conducts.
   ========================================================================== */

function cmosNand() {
  const p = new Plot({
    w: 520, h: 400, xr: [0, 488], yr: [-190, 190],
    pad: { l: 16, r: 16, t: 14, b: 14 },
    label:
      "A CMOS NAND gate drawn as four transistors: two p-channel devices in " +
      "parallel between the supply and the output, and two n-channel devices " +
      "in series between the output and ground.",
  });

  const rdIn = readout({ key: "inputs", value: "", tone: "x" });
  const rdPull = readout({ key: "conducting", value: "", tone: "y" });
  const rdOut = readout({ key: "output", value: "", tone: "r" });
  const rdCur = readout({ key: "supply I", value: "" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(pat) {
    p.clear("curve", "label", "mark", "shade");
    const a = (pat >> 1) & 1, b = pat & 1;
    // a PMOS conducts when its gate is LOW; an NMOS when its gate is HIGH
    const p1 = a === 0, p2 = b === 0;
    const n1 = a === 1, n2 = b === 1;
    const pullUp = p1 || p2;               // parallel
    const pullDown = n1 && n2;             // series
    const y = pullDown ? 0 : 1;

    const XL = 150, XR = 300, XO = 380;
    // supply rail
    p.line(XL, 168, XR, 168, { color: "ink", width: 1.8 });
    p.line((XL + XR) / 2, 168, (XL + XR) / 2, 186, { color: "ink", width: 1.8 });
    p.text((XL + XR) / 2, 176, "VDD", { color: "q-x", size: 12, weight: 600, dy: 18 });

    // the two PMOS, in parallel
    fet(p, XL, 118, "p", p1, `A = ${a}`);
    fet(p, XR, 118, "p", p2, `B = ${b}`, "above");
    p.line(XL, 148, XL, 168, { color: "ink", width: 1.8 });
    p.line(XR, 148, XR, 168, { color: "ink", width: 1.8 });
    p.line(XL, 88, XL, 56, { color: "ink", width: 1.8 });
    p.line(XR, 88, XR, 56, { color: "ink", width: 1.8 });
    p.line(XL, 56, XR, 56, { color: "ink", width: 1.8 });
    p.text(XR + 52, 118, "parallel", { color: "muted", size: 10.5, anchor: "start" });

    // the output node
    const OX = (XL + XR) / 2;
    p.line(OX, 56, OX, 20, { color: "ink", width: 1.8 });
    p.line(OX, 20, XO, 20, { color: y ? "q-y" : "muted", width: y ? 2.6 : 1.8 });
    p.dot(OX, 20, { color: "ink", r: 3.5 });
    p.text(XO + 18, 20, "Y", { color: "ink", size: 13, weight: 600, dy: 5 });
    p.text(XO - 10, 38, `${y}`, { color: y ? "q-y" : "muted", size: 14, weight: 600 });

    // the two NMOS, in series
    p.line(OX, 20, OX, -20, { color: "ink", width: 1.8 });
    fet(p, OX, -50, "n", n1, `A = ${a}`);
    fet(p, OX, -122, "n", n2, `B = ${b}`);
    p.line(OX, -80, OX, -92, { color: "ink", width: 1.8 });
    p.line(OX, -152, OX, -168, { color: "ink", width: 1.8 });
    ground(p, OX, -168);
    p.text(OX + 62, -86, "series", { color: "muted", size: 10.5, anchor: "start" });

    // the two conducting paths, highlighted only when they exist
    if (pullUp) p.text(OX, 96, "pulling HIGH", { color: "q-y", size: 11.5, weight: 600 });
    if (pullDown) p.text(OX - 92, -86, "pulling LOW", { color: "q-y", size: 11.5, weight: 600, anchor: "end" });


    rdIn.set(`A=${a}  B=${b}`);
    rdPull.set(pullDown ? "series pair" : "parallel pair");
    rdOut.set(`Y = ${y}`);
    rdCur.set("zero", " at rest, either way");
    rdNote.set(
      pullDown
        ? "<b>Both inputs high, so both n-channel devices conduct</b> and the series path to ground is complete. Meanwhile both p-channel devices are off, so nothing pulls up. Output <b>0</b> — the only input pattern that produces it, which is precisely the definition of NAND."
        : `${a === 0 && b === 0 ? "Both" : "One"} input is low, so ${a === 0 && b === 0 ? "both" : "that"} p-channel device conducts and the output is pulled to the supply. The series path to ground is broken, because an n-channel device needs a <b>high</b> gate to conduct. Output <b>1</b>.`
    );
  }

  const k = knob({
    label: "inputs A B", min: 0, max: 3, step: 1, value: 3,
    format: (v) => `${(v >> 1) & 1} ${v & 1}`,
    onInput: draw,
  });
  draw(3);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdIn, rdPull, rdOut, rdCur, rdNote),
  };
}

/* -------------------------------------------------------------------------
   drawing helpers
   ------------------------------------------------------------------------- */

function path(p, d, { color = "ink", width = 1.9, fill = "plate" } = {}) {
  const n = document.createElementNS(NS, "path");
  n.setAttribute("d", d);
  n.setAttribute("fill", fill ? V(fill) : "none");
  n.setAttribute("stroke", V(color));
  n.setAttribute("stroke-width", width);
  n.setAttribute("stroke-linejoin", "round");
  p.add("curve", n);
  return n;
}

/** The distinctive shapes. Flat-backed for AND, curved for OR, double for XOR. */
function gateSymbol(p, ux, uy, shape, bubble) {
  const x = p.x(ux), y = p.y(uy);
  if (shape === "and") {
    path(p, `M ${x - 34} ${y - 30} L ${x - 4} ${y - 30} A 30 30 0 0 1 ${x - 4} ${y + 30} L ${x - 34} ${y + 30} Z`);
  } else if (shape === "not") {
    path(p, `M ${x - 30} ${y - 28} L ${x - 30} ${y + 28} L ${x + 22} ${y} Z`);
  } else {
    // OR and XOR share a body; XOR adds a second arc behind it
    path(p, `M ${x - 36} ${y - 30} Q ${x - 12} ${y} ${x - 36} ${y + 30} Q ${x + 4} ${y + 28} ${x + 30} ${y} Q ${x + 4} ${y - 28} ${x - 36} ${y - 30} Z`);
    if (shape === "xor") {
      path(p, `M ${x - 48} ${y - 30} Q ${x - 24} ${y} ${x - 48} ${y + 30}`, { fill: null });
    }
  }
  if (bubble) {
    const bx = shape === "and" ? x + 32 : shape === "not" ? x + 29 : x + 37;
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", bx); c.setAttribute("cy", y); c.setAttribute("r", 7);
    c.setAttribute("fill", V("plate"));
    c.setAttribute("stroke", V("ink")); c.setAttribute("stroke-width", 1.9);
    p.add("curve", c);
  }
}

/** A MOSFET, drawn simply: gate bar, channel, and a bubble for p-channel. */
function fet(p, ux, uy, kind, on, label, labelPos = "left") {
  const x = p.x(ux), y = p.y(uy);
  const col = on ? V("q-y") : V("ink");
  const w = on ? 2.6 : 1.7;
  const g = document.createElementNS(NS, "g");
  const ln = (x1, y1, x2, y2, c = col, ww = w) => {
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", x1); l.setAttribute("y1", y1);
    l.setAttribute("x2", x2); l.setAttribute("y2", y2);
    l.setAttribute("stroke", c); l.setAttribute("stroke-width", ww);
    g.appendChild(l);
  };
  ln(x, y - 30, x, y - 14, V("ink"), 1.8);      // source lead
  ln(x, y + 14, x, y + 30, V("ink"), 1.8);      // drain lead
  ln(x - 14, y - 14, x - 14, y + 14);           // the channel
  ln(x - 22, y - 14, x - 22, y + 14, V("ink"), 1.8);  // the gate bar
  ln(x - 14, y - 14, x, y - 14);
  ln(x - 14, y + 14, x, y + 14);
  ln(x - 60, y, x - (kind === "p" ? 30 : 22), y, V("ink"), 1.8);  // gate wire
  if (kind === "p") {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", x - 26); c.setAttribute("cy", y); c.setAttribute("r", 4.5);
    c.setAttribute("fill", V("plate"));
    c.setAttribute("stroke", V("ink")); c.setAttribute("stroke-width", 1.6);
    g.appendChild(c);
  }
  p.add("curve", g);
  p.add("label", textNode(x + 14, y + 5, on ? "on" : "off", on ? "q-y" : "muted", 10.5));
  if (label) {
    // the right-hand device in a parallel pair has its gate stub pointing into
    // the middle of the drawing, so its caption goes above it instead
    const above = labelPos === "above";
    const t = textNode(above ? x - 12 : x - 74, above ? y - 34 : y + 5, label, "q-x", 12);
    t.setAttribute("text-anchor", above ? "middle" : "end");
    t.setAttribute("font-weight", "600");
    p.add("label", t);
  }
}

function textNode(x, y, str, color, size) {
  const t = document.createElementNS(NS, "text");
  t.setAttribute("class", "lbl");
  t.setAttribute("x", x); t.setAttribute("y", y);
  t.setAttribute("fill", V(color)); t.setAttribute("font-size", `${size}px`);
  t.textContent = str;
  return t;
}

function band(p, ux, uy, w, h) {
  const r = document.createElementNS(NS, "rect");
  r.setAttribute("x", p.x(ux) - w / 2); r.setAttribute("y", p.y(uy) - h / 2);
  r.setAttribute("width", w); r.setAttribute("height", h); r.setAttribute("rx", 2);
  r.setAttribute("fill", V("q-r-soft"));
  p.add("shade", r);
}

function ground(p, ux, uy) {
  const x = p.x(ux), y = p.y(uy);
  const g = document.createElementNS(NS, "g");
  [[13, 0], [8, 5], [3, 10]].forEach(([w, dy]) => {
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", x - w); l.setAttribute("y1", y + dy);
    l.setAttribute("x2", x + w); l.setAttribute("y2", y + dy);
    l.setAttribute("stroke", V("ink")); l.setAttribute("stroke-width", 1.6);
    g.appendChild(l);
  });
  p.add("curve", g);
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("gateExplorer", { no: 65, build: () => {
  const f = gateExplorer();
  return plate({
    no: 65, title: "The gates", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The symbol, the table and the expression are three views of one " +
      "function, and fluency means moving between them without thinking. " +
      "<b>Watch the De Morgan twin in the readouts</b>: every gate has an equal " +
      "partner with the bubbles moved to the other side, and recognising that " +
      "on a schematic is worth more than being able to recite the theorem. Note " +
      "also the notation trap — <b>+ means OR</b>, so 1 + 1 = 1.",
  });
} });

register("cmosNand", { no: 66, build: () => {
  const f = cmosNand();
  return plate({
    no: 66, title: "A NAND, in transistors", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Four MOSFETs from Electronics Part 3, arranged so the two networks are " +
      "always opposites: <b>p-channel devices in parallel pulling up, n-channel " +
      "in series pulling down</b>. A p-channel conducts on a low gate and an " +
      "n-channel on a high one, so the series path completes only when both " +
      "inputs are high — which is NAND. Two consequences follow. <b>Exactly one " +
      "network ever conducts, so there is no path from supply to ground and CMOS " +
      "draws no current at rest.</b> And NAND takes four transistors while AND " +
      "takes six, since AND is a NAND with an inverter bolted on — which is why " +
      "silicon is mostly NAND.",
  });
} });
