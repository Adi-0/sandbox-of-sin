/* ==========================================================================
   figures/feedback.js — Plates 89 and 90.

   Plate 89 is the loop itself, drawn as blocks, with the open-loop and
   closed-loop gains computed side by side as the forward gain is swept. The
   lesson is the one that justifies the whole subject: once GH is large, the
   closed-loop gain stops depending on G at all.

   Plate 90 is block-diagram algebra as four rules, each shown as a before and
   after, because reduction questions are mechanical once the moves are known.
   ========================================================================== */

import { el, svg, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { fixed, num } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;

/* -------------------------------------------------------------------------
   A tiny block-diagram vocabulary. Everything is drawn on a 0..W, 0..H canvas
   in SVG user units, with +y downward — which is how block diagrams are read.
   ------------------------------------------------------------------------- */

function diagram(W, H, label, Y0 = 0) {
  const root = svg("svg", {
    viewBox: `${0} ${Y0} ${W} ${H}`, role: "img", "aria-label": label,
    style: { display: "block", width: "100%", height: "auto" },
  });
  const defs = svg("defs");
  root.appendChild(defs);
  for (const [id, col] of [["bd-h", "ink"], ["bd-hot", "q-r"]]) {
    defs.appendChild(svg("marker", {
      id, viewBox: "0 0 10 10", refX: 9, refY: 5,
      markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse",
      markerUnits: "userSpaceOnUse",
    }, svg("path", { d: "M 0 1 L 9 5 L 0 9 z", fill: V(col) })));
  }
  const g = svg("g");
  root.appendChild(g);

  const api = {
    root,
    clear() { while (g.firstChild) g.removeChild(g.firstChild); },
    /** Crop the canvas to the drawing. Only the height moves, so the width —
        which is what sets the rendered text size — is untouched. */
    box(y0, h) { root.setAttribute("viewBox", `0 ${y0} ${W} ${h}`); },
    /** A named block. Returns its left and right connection points. */
    block(x, y, w, h, name, sub, tone = "ink") {
      g.appendChild(svg("rect", {
        x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 2,
        fill: V("plate"), stroke: V(tone), strokeWidth: 1.8,
      }));
      g.appendChild(svg("text", {
        class: "lbl", x, y: sub ? y - 2 : y + 4, textAnchor: "middle",
        fill: V("ink-strong"), fontSize: "13px", fontWeight: 600, text: name,
      }));
      if (sub) {
        g.appendChild(svg("text", {
          class: "lbl", x, y: y + 13, textAnchor: "middle",
          fill: V("muted"), fontSize: "10px", text: sub,
        }));
      }
      return { l: [x - w / 2, y], r: [x + w / 2, y], t: [x, y - h / 2], b: [x, y + h / 2] };
    },
    /** A summing junction. `signs` sit at the left and bottom inputs; pass
        null to place them yourself, as the parallel rule needs to. */
    sum(x, y, signs = ["+", "−"]) {
      g.appendChild(svg("circle", {
        cx: x, cy: y, r: 13, fill: V("plate"), stroke: V("ink"), strokeWidth: 1.8,
      }));
      g.appendChild(svg("line", { x1: x - 9, y1: y, x2: x + 9, y2: y, stroke: V("muted"), strokeWidth: 1 }));
      g.appendChild(svg("line", { x1: x, y1: y - 9, x2: x, y2: y + 9, stroke: V("muted"), strokeWidth: 1 }));
      if (signs) {
        api.text(x - 21, y - 10, signs[0], { size: 14, weight: 700, tone: "ink-strong" });
        api.text(x - 21, y + 26, signs[1], { size: 14, weight: 700, tone: "ink-strong" });
      }
      return { l: [x - 13, y], r: [x + 13, y], t: [x, y - 13], b: [x, y + 13] };
    },
    /** A polyline of [x, y] points, with an arrowhead at the end. */
    wire(pts, { tone = "ink", hot = false, head = true, width = 1.8 } = {}) {
      const d = pts.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
      g.appendChild(svg("path", {
        d, fill: "none", stroke: V(hot ? "q-r" : tone), strokeWidth: hot ? 2.4 : width,
        markerEnd: head ? `url(#${hot ? "bd-hot" : "bd-h"})` : null,
      }));
    },
    dot(x, y, tone = "ink") {
      g.appendChild(svg("circle", { cx: x, cy: y, r: 3.6, fill: V(tone) }));
    },
    text(x, y, str, { size = 11, tone = "muted", weight = null, anchor = "middle" } = {}) {
      g.appendChild(svg("text", {
        class: "lbl", x, y, textAnchor: anchor,
        fill: V(tone), fontSize: `${size}px`, fontWeight: weight, text: str,
      }));
    },
  };
  return api;
}

/* ==========================================================================
   Plate 89 — the loop, and what it buys
   ========================================================================== */

function loopGain() {
  const W = 620, H = 210;
  const d = diagram(W, 172, 
    "A negative feedback loop: an input into a summing junction, a forward " +
    "gain block G, an output, and a feedback block H returning to the " +
    "junction's negative input.", 38);

  const p = new Plot({
    w: 620, h: 206, xr: [0, 3.2], yr: [0.0545, 1.35],
    pad: { l: 56, r: 22, t: 16, b: 38 },
    label:
      "Closed-loop gain plotted against the forward gain on a logarithmic " +
      "axis, flattening out at 1/H once the loop gain is large.",
  });

  const rdG = readout({ key: "forward gain G", value: "", tone: "x" });
  const rdH = readout({ key: "feedback H", value: "", tone: "y" });
  const rdLoop = readout({ key: "loop gain GH", value: "", tone: "r" });
  const rdCl = readout({ key: "closed loop", value: "", tone: "r" });
  const rdSens = readout({ key: "if G halves", value: "", tone: "bad" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let Hf = 0.1;

  function draw(logG10) {
    const G = 10 ** (logG10 / 10);
    d.clear();
    p.clear("curve", "label", "mark", "shade");

    /* --- the diagram ---------------------------------------------------- */
    const y = 68;
    const s = d.sum(150, y);
    const gb = d.block(310, y, 108, 52, "G(s)", "forward");
    const hb = d.block(310, y + 88, 108, 46, "H(s)", "feedback");

    d.wire([[46, y], s.l]);
    d.text(44, y - 12, "R(s)", { tone: "q-x", size: 12, weight: 600, anchor: "start" });
    d.wire([s.r, gb.l], { hot: true });
    d.text((s.r[0] + gb.l[0]) / 2, y - 11, "error E", { tone: "q-r", size: 11, weight: 600 });
    d.wire([gb.r, [560, y]]);
    d.text(556, y - 12, "C(s)", { tone: "q-y", size: 12, weight: 600, anchor: "end" });
    d.dot(492, y);
    d.wire([[492, y], [492, y + 88], hb.r], { head: true });
    d.wire([hb.l, [150, y + 88], [150, y + 13]], { head: true });
    d.text(150, H - 14, "negative feedback: the loop subtracts", { size: 11, tone: "muted", anchor: "start" });

    /* --- the curve ------------------------------------------------------ */
    const cl = (g) => g / (1 + g * Hf);
    p.grid({ xStep: 0.5, yStep: 0.25 });
    p.axes({ xLabel: "log₁₀ G", yLabel: "closed-loop gain / (1/H)", xStep: 1, yStep: 0.5, arrows: true });
    p.line(0, 1, 3.15, 1, { color: "q-r", width: 1.4, dash: "5 4" });
    p.text(3.1, 1.09, `1/H = ${fixed(1 / Hf, 0)}`, { color: "q-r", size: 10.5, weight: 600, anchor: "end" });
    p.curve((lg) => cl(10 ** lg) * Hf, { color: "q-y", width: 2.8 });
    p.dot(Math.log10(G), cl(G) * Hf, { color: "q-r", r: 5 });

    const loop = G * Hf;
    const now = cl(G), halved = cl(G / 2);
    const drop = (1 - halved / now) * 100;
    const L = num(loop, loop < 100 ? 1 : 0);
    const D = `${fixed(drop, 2)}%`;

    rdG.set(num(G, 0));
    rdH.set(fixed(Hf, 3), ` · 1/H = ${fixed(1 / Hf, 0)}`);
    rdLoop.set(L);
    rdCl.set(fixed(now, 3), ` = G/(1+GH)`);
    rdSens.set(D, " change in the output");
    rdNote.set(
      loop > 50
        ? `<b>The loop gain is ${L}, so the closed-loop gain is 1/H and almost nothing else.</b> Halve G — a catastrophic change in the amplifier — and the output moves by ${D}. That is what feedback is for: it trades away gain you have plenty of to buy accuracy you cannot otherwise get, and the accuracy now depends on H, which is usually two resistors.`
        : loop > 3
          ? `Loop gain ${L} — enough that the closed-loop gain is heading for 1/H, but not there yet. Halving G still moves the output by ${D}. <b>The desensitising goes as 1 + GH</b>, so it is worth having a lot of it.`
          : `Loop gain ${L}: the feedback barely does anything. The closed-loop gain still tracks G almost exactly, and halving G drops the output by ${D}. <b>Feedback with a small loop gain is not much of a control system</b> — it is an attenuator.`
    );
  }

  const k = knob({
    label: "forward gain G", min: 0, max: 40, step: 1, value: 25,
    format: (v) => num(10 ** (v / 10), 0),
    onInput: draw,
  });
  const sc = scenarios({
    label: "feedback fraction",
    options: [
      { id: "01", label: "H = 0.1" },
      { id: "05", label: "H = 0.5" },
      { id: "1", label: "H = 1" },
    ],
    value: "01",
    onChange: (id) => { Hf = id === "01" ? 0.1 : id === "05" ? 0.5 : 1; draw(k.value()); },
  });
  draw(25);

  return {
    stage: el("div.stack", null, d.root, p.root),
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdG, rdH, rdLoop, rdCl, rdSens, rdNote),
  };
}

/* ==========================================================================
   Plate 90 — the four reduction rules
   ========================================================================== */

const RULES = {
  series: {
    name: "Series",
    result: "G₁G₂",
    note: "Blocks in cascade <b>multiply</b>. Obvious, and it is the rule that makes a long signal chain collapse to one block — which is why the loop formula only ever needs one G.",
  },
  parallel: {
    name: "Parallel",
    result: "G₁ + G₂",
    note: "Two paths from the same point to the same summing junction <b>add</b>. Note the contrast with series: cascade multiplies, parallel adds, and mixing those up is the single commonest reduction error.",
  },
  loop: {
    name: "Feedback loop",
    result: "G / (1 + GH)",
    note: "<b>The one formula this module is built on.</b> The sign in the denominator is <em>opposite</em> to the sign at the summing junction: negative feedback gives 1 + GH. For unity feedback H = 1 and it is simply G/(1+G).",
  },
  move: {
    name: "Moving a takeoff",
    result: "insert 1/G",
    note: "To move a takeoff point from <em>after</em> a block to <em>before</em> it, the branch must gain a copy of that block; to move it the other way, a 1/G. <b>The rule is: whatever the signal loses by moving, give it back</b> — which is all block-diagram algebra ever asks.",
  },
};

function reduction() {
  const W = 620, H = 262;
  const d = diagram(W, H, "Two block diagrams, before and after one reduction rule.");

  const rdRule = readout({ key: "rule", value: "" });
  const rdResult = readout({ key: "reduces to", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "loop";

  function draw() {
    d.clear();
    const R = RULES[cur];
    const yA = 62, yB = cur === "move" ? 172 : 196;

    d.text(20, 22, "BEFORE", { size: 9.5, tone: "muted", weight: 600, anchor: "start" });
    d.text(20, yB - 42, "AFTER", { size: 9.5, tone: "q-r", weight: 600, anchor: "start" });

    if (cur === "series") {
      d.wire([[40, yA], [158, yA]]);
      const a = d.block(214, yA, 108, 44, "G₁");
      d.wire([a.r, [352, yA]]);
      const b = d.block(408, yA, 108, 44, "G₂");
      d.wire([b.r, [588, yA]]);
    } else if (cur === "parallel") {
      d.wire([[40, yA], [130, yA]], { head: false });
      d.dot(130, yA);
      d.wire([[130, yA], [130, yA - 32], [242, yA - 32]]);
      d.block(300, yA - 32, 110, 40, "G₁");
      d.wire([[130, yA], [130, yA + 32], [242, yA + 32]]);
      d.block(300, yA + 32, 110, 40, "G₂");
      const s = d.sum(470, yA, null);
      d.wire([[355, yA - 32], [470, yA - 32], [470, yA - 13]], { head: true });
      d.wire([[355, yA + 32], [470, yA + 32], [470, yA + 13]], { head: true });
      d.text(487, yA - 26, "+", { size: 14, weight: 700, tone: "ink-strong" });
      d.text(487, yA + 34, "+", { size: 14, weight: 700, tone: "ink-strong" });
      d.wire([s.r, [588, yA]]);
    } else if (cur === "loop") {
      const s = d.sum(120, yA);
      d.wire([[46, yA], s.l]);
      const g = d.block(290, yA, 118, 44, "G");
      d.wire([s.r, g.l], { hot: true });
      d.wire([g.r, [588, yA]]);
      d.dot(480, yA);
      d.wire([[480, yA], [480, yA + 54], [341, yA + 54]]);
      d.block(290, yA + 54, 100, 36, "H");
      d.wire([[240, yA + 54], [120, yA + 54], [120, yA + 13]]);
    } else {
      d.wire([[40, yA], [152, yA]]);
      d.text(42, yA - 12, "X", { size: 12, tone: "q-x", weight: 600, anchor: "start" });
      d.block(210, yA, 110, 44, "G");
      d.wire([[265, yA], [380, yA]], { head: false });
      d.dot(380, yA);
      d.wire([[380, yA], [588, yA]]);
      d.wire([[380, yA], [380, yA + 46]]);
      d.text(392, yA + 44, "branch carries G·X",
        { size: 11, tone: "muted", anchor: "start" });
    }

    /* --- after ---------------------------------------------------------- */
    if (cur === "move") {
      d.wire([[40, yB], [100, yB]], { head: false });
      d.text(42, yB - 12, "X", { size: 12, tone: "q-x", weight: 600, anchor: "start" });
      d.dot(100, yB);
      d.wire([[100, yB], [152, yB]]);
      d.block(210, yB, 110, 44, "G");
      d.wire([[265, yB], [588, yB]]);
      d.wire([[100, yB], [100, yB + 52], [152, yB + 52]], { hot: true });
      d.block(210, yB + 52, 110, 34, "G", null, "q-r");
      d.wire([[265, yB + 52], [392, yB + 52]], { hot: true });
      d.text(404, yB + 57, "still G·X — nothing changed",
        { size: 11, tone: "q-r", anchor: "start", weight: 600 });
    } else {
      d.wire([[40, yB], [214, yB]]);
      d.block(310, yB, 192, 48, R.result, null, "q-r");
      d.wire([[406, yB], [588, yB]]);
    }

    d.box(8, (cur === "move" ? yB + 78 : yB + 34) - 8);

    rdRule.set(R.name);
    rdResult.set(cur === "move" ? "the same, with 1/G or G inserted" : R.result);
    rdNote.set(R.note);
  }

  const sc = scenarios({
    label: "rule",
    options: Object.keys(RULES).map((id) => ({ id, label: RULES[id].name })),
    value: "loop",
    onChange: (id) => { cur = id; draw(); },
  });
  draw();

  return {
    stage: d.root,
    controls: el("div.controls", null, sc.root),
    readouts: readouts(rdRule, rdResult, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("loopGain", { no: 89, build: () => {
  const f = loopGain();
  return plate({
    no: 89, title: "What the loop buys", tag: "interactive",
    label: "A negative feedback loop drawn as blocks, above a plot of its " +
           "closed-loop gain against the forward gain.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Turn the forward gain up and watch the closed-loop gain stop caring " +
      "about it. Once <b>GH ≫ 1</b> the answer is 1/H and essentially nothing " +
      "else — so halving G, which would be a disaster in an open-loop " +
      "amplifier, moves the output by a fraction of a per cent. <b>That trade " +
      "is why almost everything is built this way</b>: gain is cheap and " +
      "unreliable, H is usually two resistors, and feedback exchanges the " +
      "first for the second.",
  });
} });

register("reduction", { no: 90, build: () => {
  const f = reduction();
  return plate({
    no: 90, title: "Four moves", tag: "interactive",
    label: "Block diagram reduction rules, each shown as a before and after.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Reduction questions look intimidating and are mechanical. <b>Cascade " +
      "multiplies, parallel adds, a loop is G/(1 ± GH), and moving a takeoff " +
      "point costs the branch a copy of whatever it skipped.</b> Apply them " +
      "innermost-first and any diagram on this exam collapses in three or four " +
      "steps. The sign is the thing to watch: <b>a negative summing junction " +
      "gives a plus in the denominator</b>, which reads backwards and is the " +
      "error worth checking twice.",
  });
} });
