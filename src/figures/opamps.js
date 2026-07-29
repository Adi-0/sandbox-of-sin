/* ==========================================================================
   figures/opamps.js — Plates 58 and 59.

   Plate 58 is the five configurations under one control, so the reader can
   see that the two golden rules produce every one of them by the same
   two-line argument.

   Plate 59 is the non-ideal half of 9.C: gain-bandwidth product, drawn on log
   axes where it is a single straight line and every closed-loop gain is a
   horizontal shelf running into it.

   The cast: Ri = 1 kΩ, so a 4 kΩ feedback resistor gives −4 inverting and +5
   non-inverting from the same pair of parts.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;
const NS = "http://www.w3.org/2000/svg";

const OA = { Ri: 1000, Vin: 1, V1: 1, V2: 3 };

/* ==========================================================================
   Plate 58 — the five configurations
   One control: which circuit. One knob: the feedback resistor. Lesson: the
   same two rules give every gain expression, and the resistors do the rest.
   ========================================================================== */

const CFG = {
  inv: {
    name: "inverting", gain: (rf) => -rf / OA.Ri,
    tex: "A = −Rf / Ri", zin: () => `${num(OA.Ri / 1000, 0)} kΩ`,
    note: "The − input is a <b>virtual ground</b>: the op-amp drives its output to whatever holds that node at zero. So the input current is V<sub>in</sub>/R<sub>i</sub>, none of it enters the op-amp, and all of it must flow on through R<sub>f</sub>. <b>Input impedance is only R<sub>i</sub></b>, which is this circuit's real weakness.",
  },
  noninv: {
    name: "non-inverting", gain: (rf) => 1 + rf / OA.Ri,
    tex: "A = 1 + Rf / Ri", zin: () => "essentially infinite",
    note: "The input goes straight to the + terminal, so the source sees almost nothing at all. The two resistors form a divider from the output back to the − input, and the op-amp raises its output until that divider matches V<sub>in</sub>. <b>The gain can never be less than 1.</b>",
  },
  follow: {
    name: "voltage follower", gain: () => 1,
    tex: "A = 1", zin: () => "essentially infinite",
    note: "The non-inverting circuit with R<sub>f</sub> = 0 and R<sub>i</sub> removed. No voltage gain whatever — and enormously useful, for exactly the reason Part 4's emitter follower was: <b>it buys impedance</b>. Infinite in, near zero out.",
  },
  sum: {
    name: "summing", gain: (rf) => -rf / OA.Ri,
    tex: "Vo = −Rf(V1/R1 + V2/R2)", zin: () => "R per input",
    note: "Because the − node is a virtual ground, <b>each input sees its own resistor to ground and knows nothing of the others</b>. The currents simply add at the node, so the output is a weighted sum — and choosing the resistors chooses the weights. This is how an analogue mixer and a resistor-ladder DAC both work.",
  },
  diff: {
    name: "difference", gain: (rf) => rf / OA.Ri,
    tex: "Vo = (Rf/Ri)(V2 − V1)", zin: () => "R per input",
    note: "Amplifies only what <em>differs</em> between the inputs and rejects whatever they share. That rejection is why this circuit sits at the front of every instrumentation amplifier: the signal from a distant sensor arrives with the interference picked up along the way present on <b>both</b> wires.",
  },
};

function opampConfigs() {
  // pixels as data units, +y up
  const p = new Plot({
    w: 600, h: 270, xr: [0, 568], yr: [-78, 104],
    pad: { l: 16, r: 16, t: 14, b: 14 },
    label:
      "An operational amplifier circuit with input resistors and a feedback " +
      "resistor, redrawn for each configuration, with the input and output " +
      "voltages marked.",
  });

  const rdCfg = readout({ key: "circuit", value: "" });
  const rdRf = readout({ key: "Rf", value: "", tone: "x" });
  const rdGain = readout({ key: "gain", value: "", tone: "r" });
  const rdOut = readout({ key: "output", value: "", tone: "y" });
  const rdZin = readout({ key: "input impedance", value: "" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "inv";

  function draw(rf) {
    p.clear("curve", "label", "mark", "shade");
    const C = CFG[cur];
    const A = C.gain(rf);
    const OX = 330, OY = 0;                    // the op-amp's centre
    const FY = cur === "sum" ? 82 : 60;        // feedback path height

    opamp(p, OX, OY);
    p.line(OX + 46, OY, 520, OY, { color: "ink", width: 1.8 });
    p.dot(520, OY, { color: "ink", r: 3.5 });

    const minus = OY + 18, plus = OY - 18;

    if (cur === "follow") {
      // output wired straight back to the inverting input
      p.line(470, OY, 470, 60, { color: "ink", width: 1.8 });
      p.line(470, 60, OX - 46, 60, { color: "ink", width: 1.8 });
      p.line(OX - 46, 60, OX - 46, minus, { color: "ink", width: 1.8 });
      p.line(120, plus, OX - 46, plus, { color: "ink", width: 1.8 });
      src(p, 92, plus, `${OA.Vin} V`);
    } else if (cur === "noninv") {
      p.line(120, plus, OX - 46, plus, { color: "ink", width: 1.8 });
      src(p, 92, plus, `${OA.Vin} V`);
      p.line(470, OY, 470, FY, { color: "ink", width: 1.8 });
      p.line(470, FY, 262, FY, { color: "ink", width: 1.8 });
      boxAt(p, 366, FY, 54, 18);
      p.text(366, FY + 18, `Rf = ${num(rf / 1000, 1)} kΩ`, { color: "q-x", size: 10.5, weight: 600 });
      p.line(262, FY, OX - 46, FY, { color: "ink", width: 1.8 });
      p.line(OX - 46, FY, OX - 46, minus, { color: "ink", width: 1.8 });
      p.line(OX - 46, FY, 200, FY, { color: "ink", width: 1.8 });
      boxAt(p, 168, FY, 46, 18);
      p.text(168, FY + 18, "Ri = 1 kΩ", { color: "q-x", size: 10.5, weight: 600 });
      p.line(145, FY, 118, FY, { color: "ink", width: 1.8 });
      ground(p, 118, FY);
    } else {
      // inverting, summing and difference all hang off the virtual ground
      const ins = cur === "sum"
        ? [[OA.V1, plus + 44], [OA.V2, plus + 8]]
        : [[OA.Vin, minus]];
      if (cur === "diff") {
        p.line(120, plus, 210, plus, { color: "ink", width: 1.8 });
        boxAt(p, 246, plus, 46, 18);
        p.line(282, plus, OX - 46, plus, { color: "ink", width: 1.8 });
        src(p, 92, plus, `${OA.V2} V`);
        p.line(OX - 46, plus, OX - 46, plus - 34, { color: "ink", width: 1.8 });
        ground(p, OX - 46, plus - 34);
      }
      const rows = cur === "sum" ? [[OA.V1, minus], [OA.V2, minus + 30]]
        : [[cur === "diff" ? OA.V1 : OA.Vin, minus]];
      rows.forEach(([vv, yy]) => {
        p.line(120, yy, 210, yy, { color: "ink", width: 1.8 });
        boxAt(p, 246, yy, 46, 18);
        p.text(246, yy - 18, "1 kΩ", { color: "q-x", size: 10.5, weight: 600 });
        p.line(282, yy, OX - 46, yy, { color: "ink", width: 1.8 });
        if (yy !== minus) p.line(OX - 46, yy, OX - 46, minus, { color: "ink", width: 1.8 });
        src(p, 92, yy, `${vv} V`);
      });
      p.line(470, OY, 470, FY, { color: "ink", width: 1.8 });
      p.line(470, FY, 262, FY, { color: "ink", width: 1.8 });
      boxAt(p, 366, FY, 54, 18);
      p.text(366, FY + 18, `Rf = ${num(rf / 1000, 1)} kΩ`, { color: "q-x", size: 10.5, weight: 600 });
      p.line(262, FY, OX - 46, FY, { color: "ink", width: 1.8 });
      p.line(OX - 46, FY, OX - 46, minus, { color: "ink", width: 1.8 });
      if (cur !== "diff") {
        p.line(OX - 46, plus, OX - 74, plus, { color: "ink", width: 1.8 });
        ground(p, OX - 74, plus);
      }
    }

    const vout = cur === "sum"
      ? -(rf / OA.Ri) * (OA.V1 + OA.V2)
      : cur === "diff" ? (rf / OA.Ri) * (OA.V2 - OA.V1) : A * OA.Vin;

    p.text(528, 24, `${fixed(vout, 2)} V`, { color: "q-y", size: 13, weight: 600, anchor: "end" });
    p.text(284, -62, C.tex, { color: "q-r", size: 12.5, weight: 600 });

    rdCfg.set(C.name);
    rdRf.set(cur === "follow" ? "none" : `${num(rf / 1000, 1)} kΩ`);
    rdGain.set(cur === "sum" || cur === "diff" ? `${fixed(rf / OA.Ri, 1)} per input` : `${fixed(A, 2)}`);
    rdOut.set(`${fixed(vout, 2)} V`);
    rdZin.set(C.zin());
    rdNote.set(C.note);
  }

  const k = knob({
    label: "feedback resistor", min: 1000, max: 20000, step: 250, value: 4000,
    format: (v) => `${num(v / 1000, 1)} kΩ`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "configuration",
    options: [
      { id: "inv", label: "Inverting" },
      { id: "noninv", label: "Non-inverting" },
      { id: "follow", label: "Follower" },
      { id: "sum", label: "Summing" },
      { id: "diff", label: "Difference" },
    ],
    value: "inv",
    onChange: (id) => { cur = id; draw(k.value()); },
  });
  draw(4000);

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdCfg, rdRf, rdGain, rdOut, rdZin, rdNote),
  };
}

/* ==========================================================================
   Plate 59 — gain-bandwidth product
   One knob: the closed-loop gain. Lesson: the product is fixed, so every dB
   of gain is a dB of bandwidth given up.
   ========================================================================== */

const GBW = 1e6;          // 1 MHz, a 741-class part
const AOL = 1e5;          // 100 dB of open-loop gain at DC

function gainBandwidth() {
  const db = (a) => 20 * Math.log10(a);
  const fBreak = GBW / AOL;                    // 10 Hz

  const p = new Plot({
    w: 620, h: 330, xr: [0, 7], yr: [-8, 112],
    pad: { l: 62, r: 20, t: 18, b: 42 },
    label:
      "Gain in decibels against frequency on a logarithmic scale. The " +
      "open-loop response is flat to about ten hertz and then falls at twenty " +
      "decibels per decade; a horizontal closed-loop shelf runs into it, and " +
      "they meet at the bandwidth.",
  });
  p.grid({ xStep: 0.25, yStep: 10 });
  p.axes({
    xStep: 1, yStep: 20, yLabel: "dB",
    xFmt: (v) => ["1", "10", "100", "1k", "10k", "100k", "1M", "10M"][v] || "",
    yFmt: (v) => (v === 0 ? "0" : num(v, 0)),
  });
  p.text(6.6, -6, "Hz", { color: "muted", size: 10.5, anchor: "end" });

  // the open-loop response: flat, then −20 dB/decade to unity at GBW
  const ol = [];
  for (let i = 0; i <= 400; i++) {
    const lf = (i / 400) * 7;
    const a = AOL / Math.sqrt(1 + (10 ** lf / fBreak) ** 2);
    ol.push(`${p.x(lf).toFixed(2)} ${p.y(Math.max(-8, db(a))).toFixed(2)}`);
  }
  p.add("curve", pathOf(ol, "muted", 2, 0.85));
  p.text(1.1, 96, "open loop", { color: "muted", size: 11, anchor: "start" });
  p.text(1.1, 88, "−20 dB/decade", { color: "muted", size: 10, anchor: "start" });

  const shelf = pathOf([], "q-r", 2.75);
  p.add("curve", shelf);
  const bwLine = p.line(0, -8, 0, 112, { color: "q-y", width: 1.3, dash: "4 3" });
  const bwDot = p.dot(0, 0, { color: "q-y", r: 6 });
  const tBw = p.text(0, 0, "", { color: "q-y", size: 11.5, weight: 600, anchor: "start" });

  const rdA = readout({ key: "closed-loop gain", value: "", tone: "x" });
  const rdDb = readout({ key: "in dB", value: "" });
  const rdBw = readout({ key: "bandwidth", value: "", tone: "y" });
  const rdGbw = readout({ key: "product", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(A) {
    const bw = GBW / A;
    const lbw = Math.log10(bw);
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const lf = (i / 200) * 7;
      // the closed-loop response follows the shelf, then the open-loop slope
      const a = Math.min(A, AOL / Math.sqrt(1 + (10 ** lf / fBreak) ** 2));
      pts.push(`${p.x(lf).toFixed(2)} ${p.y(Math.max(-8, db(a))).toFixed(2)}`);
    }
    shelf.setAttribute("d", "M " + pts.join(" L "));

    bwLine.setAttribute("x1", p.x(lbw)); bwLine.setAttribute("x2", p.x(lbw));
    bwDot.querySelectorAll("circle").forEach((c) => {
      c.setAttribute("cx", p.x(lbw)); c.setAttribute("cy", p.y(db(A)));
    });
    tBw.setAttribute("x", p.x(lbw) + 8);
    tBw.setAttribute("y", p.y(db(A)) - 9);
    tBw.textContent = bw >= 1000 ? `${fixed(bw / 1000, 0)} kHz` : `${fixed(bw, 0)} Hz`;

    rdA.set(`${num(A, 0)}`);
    rdDb.set(`${fixed(db(A), 1)} dB`);
    rdBw.set(bw >= 1000 ? `${fixed(bw / 1000, 1)} kHz` : `${fixed(bw, 0)} Hz`);
    rdGbw.set("1.0 MHz", " — always");
    rdNote.set(
      `Gain <b>${num(A, 0)}</b> buys bandwidth <b>${bw >= 1000 ? `${fixed(bw / 1000, 1)} kHz` : `${fixed(bw, 0)} Hz`}</b>, ` +
      `and their product is 1.0 MHz at every setting. <b>The shelf slides up and its corner slides left by the same factor</b> — ` +
      `that is all gain-bandwidth product means. An audio stage needing 20 kHz of bandwidth from this part can have a gain of ` +
      `50 and no more; wanting both is a request for a faster op-amp, not a cleverer circuit.`
    );
  }

  const k = knob({
    label: "closed-loop gain", min: 1, max: 1000, step: 1, value: 10,
    format: (v) => `${num(v, 0)} ×`,
    onInput: draw,
  });
  draw(10);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdA, rdDb, rdBw, rdGbw, rdNote),
  };
}

/* -------------------------------------------------------------------------
   drawing helpers
   ------------------------------------------------------------------------- */

function pathOf(pts, color, width, opacity = 1) {
  const n = document.createElementNS(NS, "path");
  n.setAttribute("d", pts.length ? "M " + pts.join(" L ") : "");
  n.setAttribute("fill", "none");
  n.setAttribute("stroke", V(color));
  n.setAttribute("stroke-width", width);
  n.setAttribute("opacity", opacity);
  return n;
}

/** The op-amp triangle, with its two inputs marked. */
function opamp(p, ux, uy) {
  const x = p.x(ux), y = p.y(uy);
  const g = document.createElementNS(NS, "g");
  const tri = document.createElementNS(NS, "path");
  tri.setAttribute("d", `M ${x - 46} ${y - 46} L ${x - 46} ${y + 46} L ${x + 46} ${y} Z`);
  tri.setAttribute("fill", V("plate"));
  tri.setAttribute("stroke", V("ink")); tri.setAttribute("stroke-width", 1.9);
  tri.setAttribute("stroke-linejoin", "round");
  g.appendChild(tri);
  p.add("curve", g);
  // + is the upper input in the drawing, which is +y in data space
  p.text(ux - 34, uy + 18, "−", { color: "ink", size: 15, weight: 600 });
  p.text(ux - 34, uy - 18, "+", { color: "ink", size: 14, weight: 600 });
}

function src(p, ux, uy, label) {
  const c = document.createElementNS(NS, "circle");
  c.setAttribute("cx", p.x(ux)); c.setAttribute("cy", p.y(uy)); c.setAttribute("r", 15);
  c.setAttribute("fill", V("plate"));
  c.setAttribute("stroke", V("ink")); c.setAttribute("stroke-width", 1.8);
  p.add("curve", c);
  // to the left, not above — stacked sources would otherwise label each other
  p.text(ux - 25, uy, label, { color: "q-x", size: 11.5, weight: 600, anchor: "end", dy: 4 });
  p.text(ux, uy, "+", { color: "ink", size: 12, dy: 4 });
}

function boxAt(p, ux, uy, w, h) {
  const r = document.createElementNS(NS, "rect");
  r.setAttribute("x", p.x(ux) - w / 2); r.setAttribute("y", p.y(uy) - h / 2);
  r.setAttribute("width", w); r.setAttribute("height", h); r.setAttribute("rx", 2);
  r.setAttribute("fill", V("plate"));
  r.setAttribute("stroke", V("ink")); r.setAttribute("stroke-width", 1.8);
  p.add("curve", r);
}

function ground(p, ux, uy) {
  const x = p.x(ux), y = p.y(uy);
  const g = document.createElementNS(NS, "g");
  [[12, 0], [7.5, 4.5], [3, 9]].forEach(([w, dy]) => {
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", x - w); l.setAttribute("y1", y + dy);
    l.setAttribute("x2", x + w); l.setAttribute("y2", y + dy);
    l.setAttribute("stroke", V("ink")); l.setAttribute("stroke-width", 1.5);
    g.appendChild(l);
  });
  p.add("curve", g);
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("opampConfigs", { no: 58, build: () => {
  const f = opampConfigs();
  return plate({
    no: 58, title: "Five circuits, two rules", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Every gain expression here comes out of the same two lines: <b>no current " +
      "enters the inputs</b>, and <b>the output moves until the inputs match</b>. " +
      "Nothing else is needed — not β, not r<sub>e</sub>, not a bias point, not " +
      "the op-amp's own gain. Note the pair the cast is built on: with " +
      "R<sub>i</sub> = 1 kΩ and R<sub>f</sub> = 4 kΩ, <b>the same two resistors " +
      "give −4 inverting and +5 non-inverting</b>, differing by exactly one " +
      "because the non-inverting circuit passes the input through as well as " +
      "amplifying it.",
  });
} });

register("gainBandwidth", { no: 59, build: () => {
  const f = gainBandwidth();
  return plate({
    no: 59, title: "Gain-bandwidth product", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The ideal op-amp of Plate 58 has infinite gain at every frequency. A real " +
      "one has enormous gain at DC that falls at 20 dB per decade above about " +
      "ten hertz, and <b>feedback can only ever spend gain that the device " +
      "actually has</b>. Slide the shelf up and its corner slides left by the " +
      "same factor, because their product is fixed at the part's " +
      "gain-bandwidth figure. <b>Gain × bandwidth = 1 MHz here, always</b> — so " +
      "asking for a gain of 100 across 20 kHz is asking for a different chip.",
  });
} });
