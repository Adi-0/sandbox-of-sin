/* ==========================================================================
   figures/digital-synthesis.js — Plate 75.

   Digital Systems reads as six unrelated skills: base conversion, Boolean
   algebra, Karnaugh maps, flip-flops, state diagrams, timing. It is one
   escalation. Each part adds exactly one capability to the previous one, and
   the last part is where the abstraction the other five rest on stops being
   true.
   ========================================================================== */

import { svg } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";

const V = (n) => `var(--${n})`;

/* Each station: the part, what it added, and the question it answers. */
const CHAIN = [
  { part: "1", name: "Number systems", adds: "meaning", q: "what a pattern is" },
  { part: "2", name: "Gates", adds: "computation", q: "what it computes" },
  { part: "3", name: "Minimisation", adds: "cost", q: "how much silicon" },
  { part: "4", name: "Flip-flops", adds: "memory", q: "what it retains" },
  { part: "5", name: "State machines", adds: "purpose", q: "what it can be" },
  { part: "6", name: "Timing", adds: "physics", q: "when it fails" },
];

function digitalMap() {
  const W = 720, H = 320;
  const BW = 104, BH = 86, GAP = 16;
  const x0 = (W - (CHAIN.length * BW + (CHAIN.length - 1) * GAP)) / 2;
  const cy = 152;

  const root = svg("svg", {
    viewBox: `0 0 ${W} ${H}`, role: "img",
    "aria-label":
      "The six parts of Digital Systems as one chain: number systems give a " +
      "bit pattern meaning, gates compute with it, minimisation prices it, " +
      "flip-flops remember it, state machines give it purpose, and timing is " +
      "where the abstraction the other five rest on stops holding.",
    style: { display: "block", width: "100%", height: "auto" },
  });

  root.appendChild(svg("defs", null, svg("marker", {
    id: "dmap-head", viewBox: "0 0 10 10", refX: 9, refY: 5,
    markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse",
    markerUnits: "userSpaceOnUse",
  }, svg("path", { d: "M 0 1 L 9 5 L 0 9 z", fill: V("q-x") }))));

  const text = (x, y, str, o = {}) => root.appendChild(svg("text", {
    class: "lbl", x, y, textAnchor: o.anchor || "middle",
    fill: V(o.color || "ink"), fontSize: `${o.size || 11}px`,
    fontWeight: o.weight || null, text: str,
  }));

  CHAIN.forEach((s, i) => {
    const x = x0 + i * (BW + GAP);
    const last = i === CHAIN.length - 1;
    if (i > 0) {
      root.appendChild(svg("line", {
        x1: x - GAP - 1, y1: cy, x2: x + 1, y2: cy,
        stroke: V("q-x"), strokeWidth: 2, markerEnd: "url(#dmap-head)",
      }));
    }
    root.appendChild(svg("rect", {
      x, y: cy - BH / 2, width: BW, height: BH, rx: 2,
      fill: V("plate"), stroke: V(last ? "q-bad" : "ink"), strokeWidth: 1.6,
    }));
    root.appendChild(svg("rect", {
      x, y: cy - BH / 2, width: BW, height: 19,
      fill: V("sunk"), stroke: V(last ? "q-bad" : "ink"), strokeWidth: 1,
    }));
    text(x + BW / 2, cy - BH / 2 + 13, `PART ${s.part}`, { color: "muted", size: 9.5, weight: 600 });
    text(x + BW / 2, cy - 4, s.name, { color: "ink-strong", size: 11.5, weight: 600 });
    text(x + BW / 2, cy + 12, `+ ${s.adds}`,
      { color: last ? "q-bad" : "q-r", size: 9.5, weight: 600 });
    text(x + BW / 2, cy + 28, s.q, { color: "muted", size: 8.5 });
  });

  text(W / 2, 40, "two symbols · one operator set · one clock",
    { color: "q-r", size: 14, weight: 600 });
  text(W / 2, 60, "each part adds exactly one thing the part before it could not do",
    { color: "muted", size: 11 });

  text(W / 2, 244, "Parts 1 to 5 assume logic is instantaneous and a flip-flop samples at a point.",
    { color: "muted", size: 11 });
  text(W / 2, 262, "Part 6 is what it costs that neither is true — and why design is synchronous.",
    { color: "muted", size: 11 });
  text(W / 2, 288, "Boolean algebra came from Mathematics Part 8; the gates are Electronics Part 3's MOSFETs.",
    { color: "muted", size: 10.5 });

  return plate({
    no: 75,
    title: "Two symbols, six steps",
    tag: "reference",
    label: "Map of the Digital Systems parts as one escalation from a bit to a machine",
    stage: root,
    caption:
      "The module looks like six unrelated skills and is one escalation. A bit " +
      "pattern acquires <b>meaning</b>, then the ability to be <b>computed</b> " +
      "with, then a <b>price</b>, then a <b>past</b>, then a <b>purpose</b> — " +
      "and each step is the previous one plus exactly one new idea. Part 6 is " +
      "different in kind: it is where the assumption underneath the other five " +
      "— that logic is instant and a flip-flop samples at a point — stops being " +
      "true, and it is the reason the whole subject is built around a clock.",
  });
}

register("digitalMap", { no: 75, build: digitalMap });
