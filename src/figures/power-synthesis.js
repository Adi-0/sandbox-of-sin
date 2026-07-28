/* ==========================================================================
   figures/power-synthesis.js — Plate 48.

   Not a topic graph. The module built one plant across five parts, and this
   is that plant drawn end to end, with each station tagged by the part that
   explains it. Every number on it has appeared before.
   ========================================================================== */

import { svg } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";

const V = (n) => `var(--${n})`;

/* Each station: the part that covers it, what it is, and the number that
   part left behind. */
const STATIONS = [
  { part: "5", name: "Generator",  sub: "synchronous",     val: "4160 V, 3φ" },
  { part: "3", name: "Line",       sub: "0.5 + j0.5 Ω/km", val: "loss ∝ 1/V²" },
  { part: "4", name: "Transformer", sub: "Δ–Y, 20 : 1",    val: "4160 → 208 V" },
  { part: "2", name: "Panel",      sub: "208Y/120, wye",   val: "24 A per phase" },
  { part: "1", name: "Capacitor",  sub: "1467 VAR/phase",  val: "0.6 → 0.9 pf" },
  { part: "5", name: "Motor",      sub: "4-pole, 2% slip", val: "5184 W, 1764 rpm" },
];

function powerMap() {
  const W = 700, H = 300;
  const BW = 100, BH = 88, GAP = 20;
  const x0 = (W - (STATIONS.length * BW + (STATIONS.length - 1) * GAP)) / 2;
  const cy = 132;

  const root = svg("svg", {
    viewBox: `0 0 ${W} ${H}`, role: "img",
    "aria-label":
      "One plant drawn end to end: a synchronous generator, a transmission " +
      "line, a delta-wye transformer, a three-phase panel, a correction " +
      "capacitor and an induction motor, each labelled with the part of this " +
      "module that covers it.",
    style: { display: "block", width: "100%", height: "auto" },
  });

  root.appendChild(svg("defs", null, svg("marker", {
    id: "pmap-head", viewBox: "0 0 10 10", refX: 9, refY: 5,
    markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse",
    markerUnits: "userSpaceOnUse",
  }, svg("path", { d: "M 0 1 L 9 5 L 0 9 z", fill: V("q-x") }))));

  const text = (x, y, str, o = {}) => root.appendChild(svg("text", {
    class: "lbl", x, y, textAnchor: o.anchor || "middle",
    fill: V(o.color || "ink"), fontSize: `${o.size || 11}px`,
    fontWeight: o.weight || null, text: str,
  }));

  STATIONS.forEach((s, i) => {
    const x = x0 + i * (BW + GAP);

    // the connecting run, drawn before the boxes so it tucks behind them
    if (i > 0) {
      root.appendChild(svg("line", {
        x1: x - GAP - 1, y1: cy, x2: x + 1, y2: cy,
        stroke: V("q-x"), strokeWidth: 2, markerEnd: "url(#pmap-head)",
      }));
    }

    root.appendChild(svg("rect", {
      x, y: cy - BH / 2, width: BW, height: BH, rx: 2,
      fill: V("plate"), stroke: V("ink"), strokeWidth: 1.6,
    }));
    // the part tag sits in its own band, the way a plate's title block does
    root.appendChild(svg("rect", {
      x, y: cy - BH / 2, width: BW, height: 19,
      fill: V("sunk"), stroke: V("ink"), strokeWidth: 1,
    }));
    text(x + BW / 2, cy - BH / 2 + 13, `PART ${s.part}`, { color: "muted", size: 9.5, weight: 600 });

    text(x + BW / 2, cy - 6, s.name, { color: "ink-strong", size: 12, weight: 600 });
    text(x + BW / 2, cy + 9, s.sub, { color: "muted", size: 9.5 });
    text(x + BW / 2, cy + 30, s.val, { color: "q-r", size: 10, weight: 600 });
  });

  // the two ends of the story, above and below the chain
  text(W / 2, 34, "1728 × (3, 4, 5)", { color: "q-r", size: 15, weight: 600 });
  text(W / 2, 52, "5184 W · 6912 VAR · 8640 VA", { color: "muted", size: 11 });
  text(W / 2, 70, "the same triangle since Mathematics Part 1", { color: "muted", size: 10.5 });

  text(W / 2, 232, "Every number above appeared in an earlier part.", { color: "muted", size: 11 });
  text(W / 2, 250, "The module is one plant, examined six times.", { color: "muted", size: 11 });

  return plate({
    no: 48,
    title: "One plant, end to end",
    tag: "reference",
    label: "Map of the Power Systems parts as one physical system",
    stage: root,
    caption:
      "Power Systems reads as four unrelated topics in the specification. It is " +
      "not — it is <b>one path from a generator to a shaft</b>, and each part of " +
      "this module is one station along it. Read the chain left to right and the " +
      "arc is: make the power, move it (which forces high voltage), change the " +
      "voltage (which is why transformers exist), split it three ways, fix the " +
      "angle, and finally turn it into torque. <b>The motor at the right-hand end " +
      "is what made the power factor 0.6 at the left-hand end</b>, which is the " +
      "loop this module closes.",
  });
}

register("powerMap", { no: 48, build: powerMap });
