/* ==========================================================================
   figures/flipflops.js — Plates 69 and 70.

   Plate 69 walks one clock edge at a time through a fixed, deliberately
   instructive input sequence, so the reader can watch a flip-flop decide what
   to do rather than read a table about it. The SR sequence includes the
   forbidden state, which is the whole reason JK exists.

   Plate 70 is the ripple counter's honest cost: delays accumulate down the
   chain, so the maximum clock rate falls in proportion to the width, while a
   synchronous counter's does not.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { fixed } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;
const NS = "http://www.w3.org/2000/svg";

const N = 8;                                  // clock ticks shown

/* Each type: its inputs, the sequence to walk, and how it decides. */
const FFS = {
  d: {
    name: "D", inputs: ["D"],
    seq: [[0], [1], [1], [0], [1], [0], [0], [1]],
    next: (q, [d]) => d,
    why: (q, [d]) => `D = ${d}, so Q takes ${d}. <b>A D flip-flop simply copies its input at the edge</b> — no combination is special, which is why it is the one almost everything is built from.`,
    tex: "Q⁺ = D",
  },
  t: {
    name: "T", inputs: ["T"],
    seq: [[0], [1], [1], [0], [1], [1], [1], [0]],
    next: (q, [t]) => (t ? 1 - q : q),
    why: (q, [t]) => (t
      ? `T = 1, so Q <b>toggles</b> from ${q} to ${1 - q}.`
      : `T = 0, so Q <b>holds</b> at ${q}.`),
    tex: "Q⁺ = T ⊕ Q",
  },
  jk: {
    name: "JK", inputs: ["J", "K"],
    seq: [[0, 0], [1, 0], [0, 0], [0, 1], [1, 1], [1, 1], [1, 0], [0, 1]],
    next: (q, [j, k]) => (j && k ? 1 - q : j ? 1 : k ? 0 : q),
    why: (q, [j, k]) => (j && k
      ? `J = K = 1, so Q <b>toggles</b> to ${1 - q}. <b>This is the combination SR forbids</b>, and putting it to work is the entire point of the JK.`
      : j ? "J = 1, K = 0 — <b>set</b>. Q goes to 1."
        : k ? "J = 0, K = 1 — <b>reset</b>. Q goes to 0."
          : `J = K = 0 — <b>hold</b>. Q stays at ${q}.`),
    tex: "Q⁺ = J·Q̄ + K̄·Q",
  },
  sr: {
    name: "SR", inputs: ["S", "R"],
    seq: [[0, 0], [1, 0], [0, 0], [0, 1], [0, 0], [1, 1], [0, 0], [1, 0]],
    next: (q, [s, r]) => (s && r ? -1 : s ? 1 : r ? 0 : q),
    why: (q, [s, r]) => (s && r
      ? "<b>S = R = 1 is forbidden.</b> The circuit is being told to set and reset at once, so both outputs go the same way and Q is undefined — and worse, what it settles to when the inputs leave is a race. JK exists to make this combination mean something instead."
      : s ? "S = 1 — <b>set</b>. Q goes to 1."
        : r ? "R = 1 — <b>reset</b>. Q goes to 0."
          : `Both low — <b>hold</b>. Q stays at ${q}.`),
    tex: "Q⁺ = S + R̄·Q", texSub: " where S·R = 0",
  },
};

/* ==========================================================================
   Plate 69 — one edge at a time
   One control: the type. One knob: which clock edge. Lesson: a flip-flop's
   whole behaviour is a decision taken at an instant.
   ========================================================================== */

function ffWaves() {
  /* Cell i spans [x_i, x_{i+1}]; the clock's rising edge sits at its centre,
     m_i. Inputs are held across the whole cell — stable on both sides of the
     edge, which is what setup and hold time actually require — and Q changes
     at m_i and holds until m_{i+1}. Getting this right is the plate's job:
     drawing the input as though it changed *at* the edge is exactly the
     misreading the plate exists to prevent. */
  const X0 = 96, DX = 58, H = 26;
  const xc = (i) => X0 + i * DX;             // cell boundary
  const mid = (i) => X0 + (i + 0.5) * DX;    // the rising edge of cycle i

  const p = new Plot({
    w: 620, h: 306, xr: [0, 588], yr: [-148, 94],
    pad: { l: 16, r: 16, t: 12, b: 10 },
    label:
      "Timing diagram over eight clock cycles: a clock waveform on top, the " +
      "flip-flop's input or inputs below it, and the Q output at the bottom, " +
      "with a cursor marking the selected clock edge.",
  });

  const rdType = readout({ key: "type", value: "" });
  const rdTex = readout({ key: "characteristic", value: "", tone: "r" });
  rdTex.root.classList.add("wide");
  const rdEdge = readout({ key: "at edge", value: "", tone: "x" });
  const rdIn = readout({ key: "inputs", value: "", tone: "x" });
  const rdQ = readout({ key: "Q becomes", value: "", tone: "y" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "jk";

  /** Q after every edge, starting from 0. −1 marks an undefined state. */
  function run(F) {
    const out = [];
    let q = 0;
    for (let i = 0; i < N; i++) {
      const nq = F.next(q, F.seq[i]);
      out.push(nq);
      q = nq < 0 ? 0 : nq;               // recover so the trace stays readable
    }
    return out;
  }

  function draw(tick) {
    p.clear("curve", "label", "mark", "shade");
    const F = FFS[cur];
    const qs = run(F);
    const t = Math.min(tick, N - 1);

    /* CLK and Q keep their rows whatever the type, so switching D → JK never
       makes the plate jump. A one-input flip-flop centres its single row in
       the space the two-input types use. */
    const two = F.inputs.length > 1;
    const rowY = { clk: 44, in0: two ? -8 : -36, in1: -58, q: -122 };
    const ex = mid(t);

    // the selected edge, behind everything else
    p.line(ex, 74, ex, rowY.q - 18, { color: "q-r", width: 1.6, dash: "4 3" });
    p.text(ex, 84, `edge ${t}`, { color: "q-r", size: 11, weight: 600 });

    // clock: low for the first half of each cell, rising at its centre
    const clk = [];
    for (let i = 0; i < N; i++) {
      clk.push([xc(i), rowY.clk], [mid(i), rowY.clk],
        [mid(i), rowY.clk + H], [xc(i + 1), rowY.clk + H]);
    }
    trace(p, clk, "muted", 1.8);
    p.text(X0 - 16, rowY.clk + H / 2, "CLK", { color: "muted", size: 11.5, weight: 600, anchor: "end", dy: 4 });

    // the inputs, each held steady across the edge that samples it
    F.inputs.forEach((nm, k) => {
      const y = k === 0 ? rowY.in0 : rowY.in1;
      const pts = [];
      for (let i = 0; i < N; i++) {
        const v = F.seq[i][k];
        pts.push([xc(i), y + v * H], [xc(i + 1), y + v * H]);
      }
      trace(p, pts, "q-x", 2.2);
      p.text(X0 - 16, y + H / 2, nm, { color: "q-x", size: 12.5, weight: 600, anchor: "end", dy: 4 });
      for (let i = 0; i < N; i++) {
        p.text(xc(i) + DX * 0.24, y + H + 9, `${F.seq[i][k]}`,
          { color: i === t ? "q-x" : "grid", size: 10.5, weight: i === t ? 700 : 400 });
      }
      // what this edge actually samples
      p.dot(ex, y + F.seq[t][k] * H, { color: "q-r", r: 3.6, ring: false });
    });

    // Q: changes at the edge, holds until the next one
    const qp = [[xc(0), rowY.q], [mid(0), rowY.q]];   // Q starts cleared
    let bad = -1;
    for (let i = 0; i < N; i++) {
      const v = qs[i];
      if (v < 0) bad = i;
      const shown = v < 0 ? 0.5 : v;
      qp.push([mid(i), rowY.q + shown * H],
        [Math.min(mid(i + 1), xc(N)), rowY.q + shown * H]);
    }
    trace(p, qp, "q-y", 2.6);
    p.text(X0 - 16, rowY.q + H / 2, "Q", { color: "q-y", size: 12.5, weight: 600, anchor: "end", dy: 4 });
    p.dot(ex, rowY.q + (qs[t] < 0 ? 0.5 : qs[t]) * H, { color: "q-r", r: 3.6, ring: false });
    if (bad >= 0) {
      /* Overdraw the two untrustworthy cells: the forbidden edge itself, and
         the one after it — because what the latch settles to when both inputs
         are released is a race, not the hold the diagram appears to promise. */
      const rt = Math.min(mid(bad + 2), xc(N));
      trace(p, [[mid(bad), rowY.q + 0.5 * H], [mid(bad + 1), rowY.q + 0.5 * H]], "q-bad", 2.6);
      trace(p, [[mid(bad + 1), rowY.q + qs[bad + 1] * H], [rt, rowY.q + qs[bad + 1] * H]],
        "q-bad", 2.2, "5 4");
      p.text(mid(bad) + DX * 0.5, rowY.q + 0.5 * H + 12, "?? then a race",
        { color: "q-bad", size: 10.5, weight: 600 });
    }

    const ins = F.seq[t];
    const nq = qs[t];
    const prev = t === 0 ? 0 : (qs[t - 1] < 0 ? 0 : qs[t - 1]);

    rdType.set(`${F.name} flip-flop`);
    rdTex.set(F.tex, F.texSub ?? "");
    rdEdge.set(`${t}`, ` of ${N - 1}`);
    rdIn.set(F.inputs.map((nm, k) => `${nm} = ${ins[k]}`).join("&nbsp; "));
    rdQ.set(nq < 0 ? "undefined" : `${nq}`, nq < 0 ? " — see below" : ` (was ${prev})`);
    rdNote.set(F.why(prev, ins));
  }

  const k = knob({
    label: "clock edge", min: 0, max: N - 1, step: 1, value: 4,
    format: (v) => `edge ${v}`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "flip-flop",
    options: Object.keys(FFS).map((id) => ({ id, label: FFS[id].name })),
    value: "jk",
    onChange: (id) => { cur = id; draw(k.value()); },
  });
  draw(4);

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdType, rdTex, rdEdge, rdIn, rdQ, rdNote),
  };
}

/* ==========================================================================
   Plate 70 — ripple against synchronous
   One knob: the per-stage delay. Lesson: a ripple counter's delays add up, so
   its maximum rate falls as it gets wider. A synchronous counter's does not.
   ========================================================================== */

function counters() {
  const BITS = 4, CYCLES = 16, REF = 8;   // count 7 → 8 flips every bit at once
  const X0 = 72, W = (568 - X0) / CYCLES, H = 24, ROW = 50;

  const p = new Plot({
    w: 620, h: 290, xr: [0, 588], yr: [-176.9, 76],
    pad: { l: 16, r: 16, t: 12, b: 10 },
    label:
      "Four counter output waveforms over sixteen clock cycles, with a dashed " +
      "reference line at the count-8 clock edge. In the ripple configuration " +
      "each stage's transition is displaced further to the right of that line " +
      "than the one before it; in the synchronous configuration every " +
      "transition lands on it.",
  });

  const rdMode = readout({ key: "counter", value: "" });
  const rdTpd = readout({ key: "stage delay", value: "", tone: "x" });
  const rdWorst = readout({ key: "settling time", value: "", tone: "bad" });
  const rdFmax = readout({ key: "max clock", value: "", tone: "r" });
  const rdWide = readout({ key: "at 8 bits wide", value: "" });
  const rdGlitch = readout({ key: "count 7 → 8 shows", value: "" });
  rdGlitch.root.classList.add("wide");
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let ripple = true;

  /* The transient a ripple counter passes through on the worst transition:
     each bit clears in turn before the next one sees its clock. */
  function transient() {
    const bits = (v) => v.toString(2).padStart(BITS, "0");
    const seq = [7];
    let v = 7;
    for (let b = 0; b < BITS; b++) v = v ^ (1 << b), seq.push(v);  // 7,6,4,0,8
    return seq.map(bits);
  }

  function draw(tpd) {
    p.clear("curve", "label", "mark", "shade");
    // one clock period is W px wide; scale the delay so 60 ns is one period
    const dxPer = ripple ? (tpd / 60) * W : 0;
    const refX = X0 + REF * W;

    // the ideal edge, drawn first so the traces sit over it
    p.line(refX, 56, refX, -14 - (BITS - 1) * ROW - 12,
      { color: "q-r", width: 1.4, dash: "4 3" });
    p.text(refX, 66, "clock edge 8", { color: "q-r", size: 10.5, weight: 600 });

    for (let b = 0; b < BITS; b++) {
      const y = -14 - b * ROW;
      const shift = dxPer * (b + 1);
      const pts = [];
      for (let c = 0; c < CYCLES; c++) {
        const v = Math.floor(c / 2 ** b) % 2;
        const x0 = Math.min(X0 + c * W + shift, X0 + CYCLES * W);
        const x1 = Math.min(x0 + W, X0 + CYCLES * W);
        if (x1 > x0) pts.push([x0, y + v * H], [x1, y + v * H]);
      }
      // every bit is 0 at count 0, so the leading gap is drawn low
      if (shift > 0.5) pts.unshift([X0, y], [X0 + shift, y]);
      trace(p, pts, b === 0 ? "q-y" : "q-x", 2.2);
      p.text(X0 - 14, y + H / 2 + 5, `Q${b}`,
        { color: b === 0 ? "q-y" : "q-x", size: 12, weight: 600, anchor: "end" });
      if (ripple) {
        p.text(X0 - 14, y + H / 2 - 7, `+${fixed(tpd * (b + 1), 0)} ns`,
          { color: "q-bad", size: 9, anchor: "end" });
        // how far this bit's transition lags the ideal edge
        p.line(refX, y + H / 2, refX + shift, y + H / 2,
          { color: "q-bad", width: 1.2, opacity: 0.75 });
      }
    }

    // the clock, on top
    const clk = [];
    for (let c = 0; c < CYCLES; c++) {
      const x = X0 + c * W;
      clk.push([x, 26], [x + W / 2, 26], [x + W / 2, 26 + H], [x + W, 26 + H]);
    }
    trace(p, clk, "muted", 1.6);
    p.text(X0 - 14, 26 + H / 2, "CLK", { color: "muted", size: 11.5, weight: 600, anchor: "end", dy: 4 });

    const worst = ripple ? tpd * BITS : tpd;
    const fmax = 1000 / worst;                 // MHz, with tpd in ns
    const wide8 = ripple ? 1000 / (tpd * 8) : fmax;

    rdMode.set(ripple ? "ripple" : "synchronous", ripple ? " (asynchronous)" : " (clocked together)");
    rdTpd.set(`${fixed(tpd, 0)} ns`, " per flip-flop");
    rdWorst.set(`${fixed(worst, 0)} ns`,
      ripple ? ` = ${BITS} × ${fixed(tpd, 0)}` : " — one stage, any width");
    rdFmax.set(`${fixed(fmax, 1)} MHz`);
    rdWide.set(`${fixed(wide8, 1)} MHz`, ripple ? " — halved" : " — unchanged");
    rdGlitch.set(
      ripple
        ? transient().map((s, i, a) => i === 0 || i === a.length - 1
          ? `<b>${s}</b>` : `<span style="color:var(--q-bad)">${s}</span>`).join(" → ")
        : `<b>0111</b> → <b>1000</b>, with nothing in between`
    );
    rdNote.set(
      ripple
        ? `<b>Each stage clocks the next</b>, so the delays add and the top bit does not settle until ${fixed(worst, 0)} ns after the edge. Inside that window the counter really is displaying the wrong number — the values above are on its output pins — so anything decoding it <b>glitches</b>. Double the width and the usable clock rate halves.`
        : `<b>Every flip-flop sees the same clock</b>, so settling takes one stage's delay however wide the counter gets. The price is steering logic: each stage needs an AND of all the bits below it to know when to toggle. In exchange the outputs move together, so the count is never briefly wrong. (A real limit also adds setup time and that logic's own delay — but it still does not grow with width, which is the point.)`
    );
  }

  const k = knob({
    label: "propagation delay", min: 5, max: 60, step: 1, value: 20,
    format: (v) => `${v} ns`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "type",
    options: [{ id: "rip", label: "Ripple" }, { id: "syn", label: "Synchronous" }],
    value: "rip",
    onChange: (id) => { ripple = id === "rip"; draw(k.value()); },
  });
  draw(20);

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdMode, rdTpd, rdWorst, rdFmax, rdWide, rdGlitch, rdNote),
  };
}

/* -------------------------------------------------------------------------
   helpers
   ------------------------------------------------------------------------- */

/** A digital trace: a polyline through [x, y] pairs given in data units. */
function trace(p, pts, color, width, dash) {
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"} ${p.x(x).toFixed(1)} ${p.y(y).toFixed(1)}`).join(" ");
  const n = document.createElementNS(NS, "path");
  n.setAttribute("d", d);
  n.setAttribute("fill", "none");
  n.setAttribute("stroke", V(color));
  n.setAttribute("stroke-width", width);
  n.setAttribute("stroke-linejoin", "miter");
  if (dash) n.setAttribute("stroke-dasharray", dash);
  p.add("curve", n);
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("ffWaves", { no: 69, build: () => {
  const f = ffWaves();
  return plate({
    no: 69, title: "One clock edge at a time", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "A flip-flop's entire behaviour is a decision taken at an instant, so this " +
      "plate steps through the edges rather than describing them. <b>Load SR and " +
      "walk to edge 5</b>: both inputs high, the circuit is told to set and reset " +
      "at once, and Q becomes undefined. That forbidden corner is the whole " +
      "reason the JK exists — it takes the same combination and defines it as " +
      "<em>toggle</em>, which is also what makes a JK able to count.",
  });
} });

register("counters", { no: 70, build: () => {
  const f = counters();
  return plate({
    no: 70, title: "Ripple against synchronous", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "In a ripple counter each flip-flop clocks the next, so the edges march " +
      "rightwards down the chain and the delays <b>add</b>. Watch the top trace " +
      "lag further behind as you raise the delay: for those tens of nanoseconds " +
      "the counter is displaying values it never really counted, which is why " +
      "decoding its output gives glitches. A synchronous counter clocks every " +
      "stage together, so <b>settling time is one stage's delay regardless of " +
      "width</b> — paid for with the steering logic that tells each stage when " +
      "to toggle.",
  });
} });
