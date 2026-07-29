/* ==========================================================================
   figures/orientation.js — Plate 1.
   ========================================================================== */

import { svg, el } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { COVERED_AREAS, MODULES } from "../outline.js";

/* NCEES FE Electrical and Computer CBT specifications, effective July 2020.
   Question counts are the ranges NCEES publishes, not estimates. The array is
   in spec order, so its index plus one *is* the area number — which is what
   lets the covered areas be read off outline.js rather than hand-marked here
   and left to go stale, as they had. */
const AREAS = [
  ["Mathematics", 11, 17],
  ["Probability and Statistics", 4, 6],
  ["Ethics and Professional Practice", 4, 6],
  ["Engineering Economics", 5, 8],
  ["Properties of Electrical Materials", 4, 6],
  ["Circuit Analysis (DC and AC)", 11, 17],
  ["Linear Systems", 5, 8],
  ["Signal Processing", 5, 8],
  ["Electronics", 7, 11],
  ["Power Systems", 8, 12],
  ["Electromagnetics", 4, 6],
  ["Control Systems", 6, 9],
  ["Communications", 5, 8],
  ["Computer Networks", 4, 6],
  ["Digital Systems", 8, 12],
  ["Computer Systems", 5, 8],
  ["Software Engineering", 4, 6],
];

const V = (n) => `var(--${n})`;

function blueprint() {
  const W = 690, ROW = 21, PAD_L = 252, PAD_R = 52, TOP = 26;
  const H = TOP + AREAS.length * ROW + 14;
  const MAX = 18;
  const span = W - PAD_L - PAD_R;
  const x = (q) => PAD_L + (q / MAX) * span;

  const root = svg("svg", {
    viewBox: `0 0 ${W} ${H}`,
    role: "img",
    "aria-label":
      "Horizontal bar chart of the seventeen knowledge areas on the FE Electrical " +
      "and Computer exam. Mathematics and Circuit Analysis are the largest, at 11 " +
      "to 17 questions each. The smallest areas are 4 to 6 questions.",
    style: { display: "block", width: "100%", height: "auto" },
  });

  // recessive scale, behind everything
  const grid = svg("g");
  for (const q of [5, 10, 15]) {
    grid.appendChild(svg("line", {
      x1: x(q), y1: TOP - 6, x2: x(q), y2: TOP + AREAS.length * ROW - 4,
      stroke: V("grid"), strokeWidth: 1,
    }));
    grid.appendChild(svg("text", {
      class: "lbl", x: x(q), y: TOP - 11, textAnchor: "middle",
      fill: V("faint"), fontSize: "10px", text: q,
    }));
  }
  grid.appendChild(svg("text", {
    class: "lbl", x: PAD_L, y: TOP - 11, textAnchor: "start",
    fill: V("faint"), fontSize: "10px", text: "questions",
  }));
  root.appendChild(grid);

  AREAS.forEach(([name, lo, hi], i) => {
    const focus = COVERED_AREAS.includes(i + 1);
    const y = TOP + i * ROW;
    const g = svg("g");

    g.appendChild(svg("text", {
      class: "lbl", x: PAD_L - 10, y: y + 11, textAnchor: "end",
      fill: focus ? V("ink-strong") : V("muted"),
      fontWeight: focus ? 600 : 400, fontSize: "11px", text: name,
    }));

    // solid to the guaranteed minimum, hollow out to the maximum: the range is
    // real and pretending it is a single number would be a lie
    g.appendChild(svg("rect", {
      x: x(0), y: y + 3, width: x(lo) - x(0), height: 12, rx: 2,
      fill: focus ? V("q-r") : V("muted"), opacity: focus ? 1 : 0.55,
    }));
    g.appendChild(svg("rect", {
      x: x(lo) + 2, y: y + 3, width: Math.max(0, x(hi) - x(lo) - 2), height: 12, rx: 2,
      fill: focus ? V("q-r") : V("muted"), opacity: focus ? 0.3 : 0.16,
    }));

    g.appendChild(svg("text", {
      class: "lbl", x: x(hi) + 7, y: y + 13, textAnchor: "start",
      fill: focus ? V("ink-strong") : V("faint"),
      fontWeight: focus ? 500 : 400, fontSize: "10.5px", text: `${lo}–${hi}`,
    }));

    root.appendChild(g);
  });

  return root;
}

/** The question range this guide's finished modules account for. */
function coveredSpan() {
  const done = MODULES.filter((m) => m.area);
  const lo = done.reduce((s, m) => s + Number(m.questions.split("\u2013")[0]), 0);
  const hi = done.reduce((s, m) => s + Number(m.questions.split("\u2013")[1]), 0);
  return `${lo} to ${hi}`;
}

register("blueprint", {
  no: 1,
  build: () => plate({
    no: 1,
    title: "Where the 110 questions go",
    tag: "reference",
    label: "Exam blueprint bar chart",
    stage: blueprint(),
    caption:
      "Solid bar is the guaranteed minimum; the pale extension runs to the maximum. " +
      "The ranges deliberately sum to more than 110 — NCEES promises each area lands " +
      "inside its own range, not that the midpoints add up. Note that <b>Mathematics " +
      "and Circuit Analysis are tied for largest</b>, and that mathematics also turns " +
      "up inside most of the sixteen bars below it. " +
      `<b>The ${COVERED_AREAS.length} highlighted areas are the ones this guide covers so far</b> — ` +
      `${coveredSpan()} of the 110 questions.`,
  }),
});
