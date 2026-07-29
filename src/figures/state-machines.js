/* ==========================================================================
   figures/state-machines.js — Plates 71 and 72.

   Plate 71 runs a real "1011" sequence detector, in both its Moore and its
   Mealy form, one clock edge at a time. The transition being taken is drawn
   bold and every other arc faint, which is what keeps a five-state diagram
   legible; the two forms run the same input so the reader can watch Moore's
   output arrive a cycle after Mealy's.

   Plate 72 answers the question a state diagram leaves open: which bit
   pattern goes with which state? The equations are not written down here —
   they are minimised from the state table by the same solver that draws the
   Karnaugh maps in Part 3, so the cost comparison is a computed result rather
   than a claim.
   ========================================================================== */

import { el, svg, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { cover, termText, literals } from "../lib/boolean.js";

const V = (n) => `var(--${n})`;
const NS = "http://www.w3.org/2000/svg";

/* --------------------------------------------------------------------------
   The machine: detect 1011 in a serial bit stream, overlaps counted.

   A state is "the longest prefix of 1011 that is currently a suffix of the
   input", which is what makes the back-edges obvious rather than magical:
   after 1011 the trailing 1 is already the start of the next match.
   -------------------------------------------------------------------------- */

const MOORE = {
  kind: "Moore",
  states: ["S0", "S1", "S2", "S3", "S4"],
  seen: ["—", "1", "10", "101", "1011"],
  next: [[0, 1], [2, 1], [0, 3], [2, 4], [2, 1]],   // [on 0, on 1]
  out: [0, 0, 0, 0, 1],                             // output belongs to the state
};

const MEALY = {
  kind: "Mealy",
  states: ["S0", "S1", "S2", "S3"],
  seen: ["—", "1", "10", "101"],
  next: [[0, 1], [2, 1], [0, 3], [2, 1]],
  emit: [[0, 0], [0, 0], [0, 0], [0, 1]],           // output belongs to the transition
};

const STREAM = [0, 1, 0, 1, 1, 1, 0, 1, 1];

/**
 * Run a machine over the stream.
 *
 * The output arrays are deliberately different lengths, because that *is* the
 * distinction. A Mealy output during cycle i is a function of the state at the
 * start of that cycle and the bit arriving in it, so there is one per input
 * bit. A Moore output during cycle i is a function of the state alone, so it
 * lags by a cycle and there is one more of them than there are input bits —
 * the last detection lands in the cycle after the stream ends.
 */
function run(M) {
  const path = [0];
  let s = 0;
  for (const x of STREAM) { s = M.next[s][x]; path.push(s); }
  const outs = M.emit
    ? STREAM.map((x, i) => M.emit[path[i]][x])
    : path.map((st) => M.out[st]);
  return { path, outs };
}

/* ==========================================================================
   Plate 71 — the machine, one edge at a time
   ========================================================================== */

function stateMachine() {
  const p = new Plot({
    w: 620, h: 336, xr: [0, 588], yr: [-146, 128],
    pad: { l: 16, r: 16, t: 12, b: 10 },
    label:
      "A state diagram of a 1011 sequence detector drawn as a row of labelled " +
      "circles with transition arrows between them, the transition currently " +
      "being taken highlighted, and below it the input bit stream with a " +
      "cursor and the output produced so far.",
  });

  const rdKind = readout({ key: "machine", value: "" });
  const rdState = readout({ key: "state", value: "", tone: "x" });
  const rdSeen = readout({ key: "meaning", value: "" });
  const rdIn = readout({ key: "input bit", value: "", tone: "x" });
  const rdNext = readout({ key: "goes to", value: "", tone: "y" });
  const rdOut = readout({ key: "output", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let M = MOORE;

  /* The state's meaning sits inside its circle, which keeps the bands above
     and below free for arcs: forward transitions arch over the row, backward
     ones swing under it, and nothing has to cross a label. */
  const R = 31;
  const cx = (i, n) => 66 + i * (456 / (n - 1));
  const CY = 40;

  function arc(x1, x2, above, { color, width, head }) {
    const dir = above ? 1 : -1;
    const dx = Math.abs(x2 - x1);
    // Forward hops are always to the neighbouring state, so they can stay
    // shallow; backward ones span the row and need the depth to stay apart.
    const lift = above ? 27 : Math.min(62, 34 + dx * 0.10);
    const sgn = Math.sign(x2 - x1);
    const d = `M ${p.x(x1 + sgn * R * 0.62)} ${p.y(CY + dir * R * 0.78)} ` +
              `Q ${p.x((x1 + x2) / 2)} ${p.y(CY + dir * lift * 2.2)} ` +
              `${p.x(x2 - sgn * R * 0.82)} ${p.y(CY + dir * R * 0.80)}`;
    p.add("curve", svg("path", {
      d, fill: "none", stroke: V(color), strokeWidth: width,
      markerEnd: head ? `url(#${head})` : null,
    }));
    // the peak of a quadratic sits halfway between the chord and the control
    return { mx: (x1 + x2) / 2, my: CY + dir * (R * 0.79 + lift * 2.2) / 2, above };
  }

  function selfLoop(x, { color, width, head }) {
    const d = `M ${p.x(x - R * 0.42)} ${p.y(CY + R * 0.9)} ` +
              `C ${p.x(x - R * 1.15)} ${p.y(CY + R * 2.15)} ` +
              `${p.x(x + R * 1.15)} ${p.y(CY + R * 2.15)} ` +
              `${p.x(x + R * 0.38)} ${p.y(CY + R * 0.92)}`;
    p.add("curve", svg("path", {
      d, fill: "none", stroke: V(color), strokeWidth: width,
      markerEnd: head ? `url(#${head})` : null,
    }));
    return { mx: x, my: CY + R * 1.72, above: true };
  }

  function draw(step) {
    p.clear("curve", "label", "mark", "shade");
    const { path, outs } = run(M);
    const t = Math.min(step, STREAM.length - 1);
    const n = M.states.length;
    const here = path[t];
    const bit = STREAM[t];
    const dest = M.next[here][bit];
    const emitted = M.emit ? M.emit[here][bit] : M.out[dest];

    const faint = p.arrowhead("grid", 6);
    const live = p.arrowhead("q-r", 8);

    // every transition, faint — then the one being taken, over the top
    for (let s = 0; s < n; s++) {
      for (const x of [0, 1]) {
        const d = M.next[s][x];
        const hot = s === here && x === bit;
        if (hot) continue;
        const style = { color: "grid", width: 1.2, head: faint };
        if (d === s) selfLoop(cx(s, n), style);
        else arc(cx(s, n), cx(d, n), d > s, style);
      }
    }
    const style = { color: "q-r", width: 2.4, head: live };
    const mid = dest === here
      ? selfLoop(cx(here, n), style)
      : arc(cx(here, n), cx(dest, n), dest > here, style);
    p.text(mid.mx, mid.my + (mid.above ? 11 : -13),
      M.emit ? `${bit} / ${emitted}` : `${bit}`,
      { color: "q-r", size: 12.5, weight: 700, bg: true });

    // the states
    for (let s = 0; s < n; s++) {
      const on = s === here;
      p.add("mark", svg("circle", {
        cx: p.x(cx(s, n)), cy: p.y(CY), r: R,
        fill: on ? V("q-x-soft") : V("plate"),
        stroke: V(on ? "q-x" : "muted"), strokeWidth: on ? 2.4 : 1.3,
      }));
      // a Moore machine's output lives in the state: the classic double ring
      if (!M.emit && M.out[s]) {
        p.add("mark", svg("circle", {
          cx: p.x(cx(s, n)), cy: p.y(CY), r: R - 4.5,
          fill: "none", stroke: V(on ? "q-x" : "muted"), strokeWidth: 1.2,
        }));
      }
      p.text(cx(s, n), CY + 3, M.states[s],
        { color: on ? "q-x" : "ink", size: 13.5, weight: on ? 700 : 600 });
      p.text(cx(s, n), CY - 14, M.seen[s], { color: "muted", size: 9.5 });
    }
    if (!M.emit) {
      p.text(30, 118, "double ring: the output is 1 in that state",
        { color: "muted", size: 10, anchor: "start" });
    }

    // the stream, and the outputs it produces
    const SX = 92, SW = 42, SY = -78;
    const cols = Math.max(STREAM.length, outs.length);
    p.text(SX - 24, SY + 4, "in", { color: "q-x", size: 11.5, weight: 600, anchor: "end" });
    p.text(SX - 24, SY - 32, "Z", { color: "q-r", size: 11.5, weight: 600, anchor: "end" });
    // Moore's output for the bit under the cursor lands in the *next* column
    const outCol = M.emit ? t : t + 1;
    for (let i = 0; i < cols; i++) {
      const x = SX + i * SW;
      if (i === t) {
        p.add("shade", svg("rect", {
          x: p.x(x - 16), y: p.y(SY + 16), width: p.x(x + 16) - p.x(x - 16),
          height: p.y(SY - 14) - p.y(SY + 16), rx: 4,
          fill: V("q-x-soft"), stroke: V("q-x"), strokeWidth: 1.3,
        }));
      }
      if (i === outCol && outCol < outs.length) {
        p.add("shade", svg("rect", {
          x: p.x(x - 16), y: p.y(SY - 20), width: p.x(x + 16) - p.x(x - 16),
          height: p.y(SY - 48) - p.y(SY - 20), rx: 4,
          fill: V("q-r-soft"), stroke: V("q-r"), strokeWidth: 1.3,
        }));
      }
      if (i < STREAM.length) {
        p.text(x, SY - 4, `${STREAM[i]}`,
          { color: i === t ? "q-x" : i < t ? "ink" : "grid",
            size: 16, weight: i === t ? 700 : 500 });
      }
      if (i <= outCol && i < outs.length) {
        p.text(x, SY - 39, `${outs[i]}`,
          { color: outs[i] ? "q-r" : i === outCol ? "ink" : "grid",
            size: 15, weight: outs[i] || i === outCol ? 700 : 500 });
      }
    }

    rdKind.set(`${M.kind}`, ` · ${n} states`);
    rdState.set(M.states[here]);
    rdSeen.set(M.seen[here] === "—" ? "no useful prefix yet" : `has just seen ${M.seen[here]}`);
    rdIn.set(`${bit}`, ` (bit ${t + 1} of ${STREAM.length})`);
    rdNext.set(M.states[dest]);
    rdOut.set(`${emitted}`, M.emit
      ? (emitted ? " — now, on this arrow" : " — this cycle")
      : (emitted ? " — next cycle, once in S4" : " — next cycle"));

    const found = outs.slice(0, outCol + 1).filter(Boolean).length;
    rdNote.set(
      M.emit
        ? `A <b>Mealy</b> machine labels its arrows <em>input / output</em>, so the output depends on the state <b>and</b> the input, and appears in the same cycle as the bit that completed the pattern. That is why it needs only ${n} states — <b>S3 does not have to be followed by a state whose job is to remember that the match happened</b>. The price is that the output is combinational: it follows the input directly, glitches included.` +
          (found ? ` Detections so far: <b>${found}</b>.` : "")
        : `A <b>Moore</b> machine writes its output inside the state — the double ring on S4 — so the output depends on the state alone. It needs one more state than the Mealy version, because reaching 1011 must be <em>remembered</em> rather than merely noticed, and its output therefore arrives <b>one clock later</b>. In exchange the output changes only at a clock edge, so it is clean.` +
          (found ? ` Detections so far: <b>${found}</b>.` : "")
    );
  }

  const k = knob({
    label: "clock", min: 0, max: STREAM.length - 1, step: 1, value: 4,
    format: (v) => `bit ${v + 1}`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "machine",
    options: [{ id: "moore", label: "Moore" }, { id: "mealy", label: "Mealy" }],
    value: "moore",
    onChange: (id) => { M = id === "moore" ? MOORE : MEALY; draw(k.value()); },
  });
  draw(4);

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdKind, rdState, rdSeen, rdIn, rdNext, rdOut, rdNote),
  };
}

/* ==========================================================================
   Plate 72 — state assignment

   Same machine (the Mealy detector, four states), four ways of numbering the
   states. The next-state and output equations are minimised from the state
   table by lib/boolean.js, so the literal counts below are computed, not
   asserted.
   ========================================================================== */

const ASSIGN = {
  binary: {
    name: "Binary", code: [0, 1, 2, 3], bits: 2,
    note: "The obvious choice: number the states in order. It is what almost every textbook answer uses, and nothing is wrong with it — but it is a <b>choice</b>, not a law, and the search result below shows it is not the cheapest one available for this machine.",
  },
  gray: {
    name: "Gray", code: [0, 1, 3, 2], bits: 2,
    note: "Adjacent codes differ in one bit, so a transition between neighbouring states flips a single flip-flop. That is exactly what you want in a <em>counter</em>, where the machine walks its states in order — and it does nothing for this detector, which jumps around. <b>Look at the bars: Gray is the worst of the three here.</b> A rule that helps one machine can cost you on another, which is the honest lesson of this plate.",
  },
  best: {
    name: "Best of 24", code: null, bits: 2,
    note: "Found by trying <b>all 24 ways</b> of dealing four codes to four states and minimising each. No rule of thumb predicts it — which is precisely why synthesis tools search rather than follow one. On a real machine with 30 states the search space is astronomical and the tool settles for a heuristic, but the principle is the same: <b>state assignment is an optimisation, not a step you can look up</b>.",
  },
  onehot: {
    name: "One-hot", code: [1, 2, 4, 8], bits: 4,
    note: "One flip-flop per state, exactly one of them set. <b>Nothing is minimised at all</b> — each equation is read straight off the diagram as an OR of the transitions entering that state, and every term is a two-input AND. The literal count is not the point: on a four-state machine it loses, but the terms <b>stay two literals wide however many states you add</b>, where a binary encoding's grow with log₂ of the state count. Flip-flops are abundant on an FPGA and routing is not, so this is what synthesis usually picks there.",
  },
};

/** Every way of dealing `bits`-wide codes to the four states. */
function permutations4() {
  const out = [];
  const codes = [0, 1, 2, 3];
  const rec = (left, acc) => {
    if (!left.length) { out.push(acc); return; }
    left.forEach((c, i) => rec([...left.slice(0, i), ...left.slice(i + 1)], [...acc, c]));
  };
  rec(codes, []);
  return out;
}

/** Next-state and output equations for one assignment. */
function synthesise(a, code) {
  const M = MEALY;
  const nb = a.bits;
  const nv = nb + 1;                       // state bits + the input X
  const vars = nb === 2 ? ["Q1", "Q0", "X"] : ["Q3", "Q2", "Q1", "Q0", "X"];
  /* A prime, not an overbar: these variable names are two characters wide and
     a combining accent would land on the digit rather than the whole name. */
  const NOT = "'";

  if (a.bits === 4) {
    /* Structural, not minimised: D for state j is the OR of every transition
       that lands on j. This is the whole selling point, so deriving it any
       other way would misrepresent it. */
    const eqs = [];
    for (let j = 0; j < 4; j++) {
      const terms = [];
      for (let s = 0; s < 4; s++)
        for (const x of [0, 1])
          if (M.next[s][x] === j) terms.push(`Q${s}·X${x ? "" : NOT}`);
      eqs.push({ name: `D${j}`, text: terms.join(" + ") || "0", cost: terms.length * 2 });
    }
    const z = [];
    for (let s = 0; s < 4; s++)
      for (const x of [0, 1]) if (M.emit[s][x]) z.push(`Q${s}·X${x ? "" : NOT}`);
    eqs.push({ name: "Z", text: z.join(" + ") || "0", cost: z.length * 2 });
    return { eqs, ff: 4, cost: eqs.reduce((s, e) => s + e.cost, 0), vars };
  }

  /* Build one truth table per state bit, over (state bits, X). */
  const on = Array.from({ length: nb }, () => []);
  const zOn = [];
  for (let s = 0; s < 4; s++) {
    for (const x of [0, 1]) {
      const row = (code[s] << 1) | x;                // the minterm index
      const d = code[M.next[s][x]];
      for (let b = 0; b < nb; b++) if (d & (1 << b)) on[nb - 1 - b].push(row);
      if (M.emit[s][x]) zOn.push(row);
    }
  }
  const eqs = on.map((set, i) => {
    const terms = cover(set, [], nv);
    return {
      name: `D${nb - 1 - i}`,
      text: terms.length ? terms.map((t) => termText(t.mask, t.value, nv, vars, NOT)).join(" + ") : "0",
      cost: terms.reduce((s, t) => s + literals(t.mask, nv), 0),
    };
  });
  const zt = cover(zOn, [], nv);
  eqs.push({
    name: "Z",
    text: zt.length ? zt.map((t) => termText(t.mask, t.value, nv, vars, NOT)).join(" + ") : "0",
    cost: zt.reduce((s, t) => s + literals(t.mask, nv), 0),
  });
  return { eqs, ff: nb, cost: eqs.reduce((s, e) => s + e.cost, 0), vars };
}

function assignment() {
  const p = new Plot({
    w: 620, h: 344, xr: [0, 588], yr: [-218, 96],
    pad: { l: 16, r: 16, t: 12, b: 10 },
    label:
      "A state assignment table giving each state a bit pattern, the " +
      "next-state and output equations that follow from it, and a bar chart " +
      "comparing the total literal count of all four assignments.",
  });

  const rdWhich = readout({ key: "assignment", value: "" });
  const rdFF = readout({ key: "flip-flops", value: "", tone: "x" });
  const rdCost = readout({ key: "total literals", value: "", tone: "bad" });
  const rdRange = readout({ key: "over all 24", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  /* Exhaustive search over the 24 two-bit assignments: cheap enough to run
     on load, and it turns "the encoding matters" from an assertion into a
     number the reader can see. */
  const two = { bits: 2 };
  const scan = permutations4().map((code) => ({ code, cost: synthesise(two, code).cost }));
  const lo = Math.min(...scan.map((s) => s.cost));
  const hi = Math.max(...scan.map((s) => s.cost));
  const ties = scan.filter((s) => s.cost === lo).length;
  ASSIGN.best.code = scan.find((s) => s.cost === lo).code;

  let cur = "binary";
  const solved = Object.fromEntries(
    Object.entries(ASSIGN).map(([k, a]) => [k, synthesise(a, a.code)])
  );

  function draw() {
    p.clear("curve", "label", "mark", "shade");
    const a = ASSIGN[cur];
    const S = solved[cur];
    const M = MEALY;

    // --- the assignment table, left ---
    const TX = 26, TY = 70, RH = 30;
    p.text(TX, TY + 14, "state", { color: "muted", size: 10, anchor: "start", weight: 600 });
    p.text(TX + 74, TY + 14, "code", { color: "muted", size: 10, anchor: "start", weight: 600 });
    p.text(TX + 146, TY + 14, "on 0", { color: "muted", size: 10, anchor: "start", weight: 600 });
    p.text(TX + 210, TY + 14, "on 1", { color: "muted", size: 10, anchor: "start", weight: 600 });
    const codeOf = (s) => a.code[s].toString(2).padStart(a.bits, "0");

    for (let s = 0; s < 4; s++) {
      const y = TY - s * RH;
      p.text(TX, y, M.states[s], { color: "ink", size: 12.5, anchor: "start", weight: 600 });
      p.text(TX + 74, y, codeOf(s), { color: "q-x", size: 12.5, anchor: "start", weight: 700 });
      p.text(TX + 146, y, codeOf(M.next[s][0]), { color: "muted", size: 12, anchor: "start" });
      p.text(TX + 210, y, codeOf(M.next[s][1]) + (M.emit[s][1] ? "  ·  Z=1" : ""),
        { color: M.emit[s][1] ? "q-r" : "muted", size: 12, anchor: "start",
          weight: M.emit[s][1] ? 700 : 400 });
    }
    p.line(TX - 4, TY + 6, TX + 290, TY + 6, { color: "grid", width: 1 });

    // --- the equations, right ---
    const EX = 336, EY = 70;
    p.text(EX, EY + 14, `minimal, over ${S.vars.join(", ")}`,
      { color: "muted", size: 10, anchor: "start", weight: 600 });
    S.eqs.forEach((e, i) => {
      const y = EY - i * 26;
      p.text(EX, y, `${e.name} =`, { color: "q-y", size: 12, anchor: "start", weight: 700 });
      p.text(EX + 34, y, e.text, { color: "ink", size: 12, anchor: "start" });
    });

    // --- the comparison, below ---
    const BX = 130, BY = -118, BW = 336, BH = 24, GAP = 32;
    const keys = Object.keys(ASSIGN);
    const max = Math.max(...keys.map((k) => solved[k].cost));
    p.text(BX - 116, BY + 44, "total literals across all the equations",
      { color: "muted", size: 10.5, anchor: "start" });
    keys.forEach((k, i) => {
      const y = BY - i * GAP;
      const on = k === cur;
      const w = (solved[k].cost / max) * BW;
      p.add("shade", svg("rect", {
        x: p.x(BX), y: p.y(y + BH), width: p.x(BX + w) - p.x(BX),
        height: p.y(y) - p.y(y + BH), rx: 3,
        fill: V(on ? "q-r" : "grid"), opacity: on ? 0.9 : 0.55,
      }));
      p.text(BX - 42, y + 7, ASSIGN[k].name,
        { color: on ? "q-r" : "muted", size: 11.5, anchor: "end", weight: on ? 700 : 400 });
      p.text(BX - 8, y + 7, `${solved[k].ff} FF`,
        { color: "grid", size: 9.5, anchor: "end" });
      p.text(BX + w + 9, y + 7, `${solved[k].cost}`,
        { color: on ? "q-r" : "muted", size: 12, anchor: "start", weight: on ? 700 : 500 });
    });

    rdWhich.set(a.name, ` · ${codeOf(0)} ${codeOf(1)} ${codeOf(2)} ${codeOf(3)}`);
    rdFF.set(`${S.ff}`, S.ff === 4 ? " — one per state" : " — ⌈log₂4⌉");
    rdCost.set(`${S.cost}`, ` across ${S.eqs.length} equations`);
    rdRange.set(`${lo} to ${hi}`, ` literals · ${ties} tie at ${lo}`);
    rdNote.set(a.note);
  }

  const sc = scenarios({
    label: "state assignment",
    options: Object.keys(ASSIGN).map((id) => ({ id, label: ASSIGN[id].name })),
    value: "binary",
    onChange: (id) => { cur = id; draw(); },
  });
  draw();

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root),
    readouts: readouts(rdWhich, rdFF, rdCost, rdRange, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("stateMachine", { no: 71, build: () => {
  const f = stateMachine();
  return plate({
    no: 71, title: "A machine that remembers", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "A detector for the pattern <b>1011</b>, overlaps counted, stepped one " +
      "clock at a time. Each state means <em>the longest prefix of 1011 that " +
      "the input currently ends with</em> — which is what makes the backward " +
      "arrows obvious rather than magical: after a match the trailing 1 is " +
      "already the start of the next one. <b>Switch between Moore and Mealy " +
      "and watch the output row.</b> The Mealy machine needs one state fewer " +
      "and reports the match immediately; the Moore machine spends an extra " +
      "state to hold the result, and its output arrives a clock later.",
  });
} });

register("assignment", { no: 72, build: () => {
  const f = assignment();
  return plate({
    no: 72, title: "Which pattern is which state", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The same four-state machine, numbered four ways. The equations are " +
      "minimised from the state table by the solver behind Part 3's Karnaugh " +
      "map, so the bars are a computed comparison rather than a claim — the " +
      "machine's <em>behaviour</em> is identical in all four, and only the " +
      "hardware changes. <b>One-hot is the interesting one:</b> twice the " +
      "flip-flops, almost no logic, and equations that are read straight off " +
      "the diagram with no minimisation at all.",
  });
} });
