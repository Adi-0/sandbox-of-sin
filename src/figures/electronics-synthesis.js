/* ==========================================================================
   figures/electronics-synthesis.js — Plate 62.

   Electronics is not a list of devices. It is one method — assume a state,
   solve as if linear, check the assumption — applied to progressively more
   capable valves, and then a device with so much gain that the method is no
   longer needed at all.
   ========================================================================== */

import { svg } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";

const V = (n) => `var(--${n})`;

/* Each station: the part, the device, its states, and what decides them. */
const CHAIN = [
  { part: "1", name: "Diode", states: "2 states", decide: "on / off" },
  { part: "2", name: "Rectifier", states: "diodes, switching", decide: "which one conducts" },
  { part: "3", name: "Transistor", states: "3 states", decide: "cutoff / active / saturated" },
  { part: "4", name: "Amplifier", states: "biased active", decide: "held there by feedback" },
  { part: "5", name: "Op-amp", states: "no states left", decide: "two rules, four lines" },
  { part: "6", name: "Instrument", states: "back to Thévenin", decide: "does it load the source?" },
];

function electronicsMap() {
  const W = 720, H = 320;
  const BW = 104, BH = 86, GAP = 16;
  const x0 = (W - (CHAIN.length * BW + (CHAIN.length - 1) * GAP)) / 2;
  const cy = 152;

  const root = svg("svg", {
    viewBox: `0 0 ${W} ${H}`, role: "img",
    "aria-label":
      "The six parts of Electronics as one chain: a two-state diode, a " +
      "rectifier, a three-state transistor, a biased amplifier, an operational " +
      "amplifier where the states disappear, and instrumentation where Thévenin " +
      "returns.",
    style: { display: "block", width: "100%", height: "auto" },
  });

  root.appendChild(svg("defs", null, svg("marker", {
    id: "emap-head", viewBox: "0 0 10 10", refX: 9, refY: 5,
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
    if (i > 0) {
      root.appendChild(svg("line", {
        x1: x - GAP - 1, y1: cy, x2: x + 1, y2: cy,
        stroke: V("q-x"), strokeWidth: 2, markerEnd: "url(#emap-head)",
      }));
    }
    root.appendChild(svg("rect", {
      x, y: cy - BH / 2, width: BW, height: BH, rx: 2,
      fill: V("plate"), stroke: V("ink"), strokeWidth: 1.6,
    }));
    root.appendChild(svg("rect", {
      x, y: cy - BH / 2, width: BW, height: 19,
      fill: V("sunk"), stroke: V("ink"), strokeWidth: 1,
    }));
    text(x + BW / 2, cy - BH / 2 + 13, `PART ${s.part}`, { color: "muted", size: 9.5, weight: 600 });
    text(x + BW / 2, cy - 4, s.name, { color: "ink-strong", size: 12, weight: 600 });
    text(x + BW / 2, cy + 12, s.states, { color: "q-r", size: 9.5, weight: 600 });
    text(x + BW / 2, cy + 28, s.decide, { color: "muted", size: 8.5 });
  });

  text(W / 2, 40, "assume a state · solve as if linear · check the assumption",
    { color: "q-r", size: 14, weight: 600 });
  text(W / 2, 60, "one method, learned on the cheapest possible device",
    { color: "muted", size: 11 });

  text(W / 2, 244, "Parts 5 and 6 need no assumption at all — an op-amp has enough gain",
    { color: "muted", size: 11 });
  text(W / 2, 262, "to make its own state irrelevant, and an instrument is just a resistor.",
    { color: "muted", size: 11 });
  text(W / 2, 288, "Thévenin appears in Parts 4, 5 and 6. It has now been used in four modules.",
    { color: "muted", size: 10.5 });

  return plate({
    no: 62,
    title: "One method, six devices",
    tag: "reference",
    label: "Map of the Electronics parts as one method applied to six devices",
    stage: root,
    caption:
      "Electronics reads as a catalogue of unrelated components. It is not — it " +
      "is <b>one procedure</b>, taught on a diode because a diode has only two " +
      "states, and then reused unchanged on a transistor that has three. Part 4 " +
      "then spends a whole part making sure the transistor <em>stays</em> in the " +
      "state you chose, and Part 5 is what happens when a device has so much " +
      "surplus gain that feedback can pin it there for free. <b>By the op-amp " +
      "there is no state left to assume</b>, which is exactly why it is the " +
      "easiest arithmetic in the module and worth the most marks per minute.",
  });
}

register("electronicsMap", { no: 62, build: electronicsMap });
