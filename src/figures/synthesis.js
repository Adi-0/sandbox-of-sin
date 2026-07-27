/* ==========================================================================
   figures/synthesis.js — Plate 25, the map.
   ========================================================================== */

import { svg } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";

const V = (n) => `var(--${n})`;

const NODES = {
  1: { x: 100, y: 92, t: "Algebra &\nTrigonometry" },
  2: { x: 330, y: 62, t: "Complex\nNumbers" },
  3: { x: 100, y: 246, t: "Analytic\nGeometry" },
  4: { x: 330, y: 206, t: "Vectors" },
  5: { x: 552, y: 152, t: "Linear\nAlgebra" },
  6: { x: 330, y: 352, t: "Calculus" },
  7: { x: 552, y: 320, t: "Differential\nEquations" },
  8: { x: 552, y: 44, t: "Discrete\nMathematics" },
};

/* Each edge names the idea that travels along it. `at` is the fraction along
   the line where the label sits; dx/dy nudge it clear of boxes and of other
   labels, and `anchor` lets a label sit beside a vertical link. */
const LINKS = [
  { a: 1, b: 2, label: "now it rotates", at: 0.5, dy: -10 },
  { a: 1, b: 3, label: "Pythagoras", at: 0.5, dx: 10, anchor: "start" },
  { a: 3, b: 4, label: "perpendicularity", at: 0.5, dy: -9 },
  { a: 3, b: 6, label: "the tangent, by limit", at: 0.5, dy: 15 },
  { a: 4, b: 5, label: "several at once", at: 0.44, dy: -10 },
  { a: 4, b: 6, label: "partials → ∇f", at: 0.5, dx: 10, anchor: "start" },
  { a: 5, b: 8, label: "adjacency matrix", at: 0.5, dx: -10, anchor: "end" },
  { a: 6, b: 7, label: "rate equations", at: 0.5, dy: 16 },
  { a: 2, b: 7, label: "complex roots", at: 0.82, dx: -10, anchor: "end" },
];

function synthesis() {
  const W = 680, H = 420;
  const NW = 128, NH = 46;

  const root = svg("svg", {
    viewBox: `0 0 ${W} ${H}`, role: "img",
    "aria-label":
      "A map of the eight subtopics with labelled links between them: the " +
      "triangle rotates into complex numbers, Pythagoras becomes the distance " +
      "formula, perpendicularity carries into vectors and calculus, vectors " +
      "collect into linear algebra and then into graphs, and calculus and " +
      "complex numbers meet in differential equations.",
    style: { display: "block", width: "100%", height: "auto" },
  });

  const head = svg("marker", {
    id: "syn-head", viewBox: "0 0 10 10", refX: 9, refY: 5,
    markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse", markerUnits: "userSpaceOnUse",
  }, svg("path", { d: "M 0 1 L 9 5 L 0 9 z", fill: V("q-r") }));
  root.appendChild(svg("defs", null, head));

  /* --- links, drawn first so the boxes sit on top ------------------------- */
  const linkLayer = svg("g");

  /* Where a ray from the centre leaves the box, so arrowheads land on the
     border instead of somewhere inside it. */
  const exit = (node, dx, dy) => {
    const t = Math.min(
      Math.abs(dx) < 1e-6 ? Infinity : (NW / 2 + 5) / Math.abs(dx),
      Math.abs(dy) < 1e-6 ? Infinity : (NH / 2 + 5) / Math.abs(dy)
    );
    return [node.x + dx * t, node.y + dy * t];
  };

  for (const { a, b, label, at, dx = 0, dy = 0, anchor = "middle" } of LINKS) {
    const A = NODES[a], B = NODES[b];
    const vx = B.x - A.x, vy = B.y - A.y;
    const [x1, y1] = exit(A, vx, vy);
    const [x2, y2] = exit(B, -vx, -vy);

    linkLayer.appendChild(svg("line", {
      x1, y1, x2, y2, stroke: V("q-r"), strokeWidth: 1.5, opacity: 0.75,
      markerEnd: "url(#syn-head)",
    }));

    const lx = x1 + (x2 - x1) * at + dx, ly = y1 + (y2 - y1) * at + dy + 3;
    const halo = svg("text", {
      class: "lbl", x: lx, y: ly, textAnchor: anchor, fontSize: "10px",
      fill: "none", stroke: V("plate"), strokeWidth: 3.5, strokeLinejoin: "round", text: label,
    });
    const txt = svg("text", {
      class: "lbl", x: lx, y: ly, textAnchor: anchor, fontSize: "10px",
      fill: V("muted"), text: label,
    });
    linkLayer.append(halo, txt);
  }
  root.appendChild(linkLayer);

  /* --- the boxes ----------------------------------------------------------- */
  for (const [n, node] of Object.entries(NODES)) {
    const g = svg("g");
    g.appendChild(svg("rect", {
      x: node.x - NW / 2, y: node.y - NH / 2, width: NW, height: NH, rx: 2,
      fill: V("plate"), stroke: V("ink"), strokeWidth: 1.5,
    }));
    g.appendChild(svg("rect", {
      x: node.x - NW / 2, y: node.y - NH / 2, width: 22, height: NH, rx: 0,
      fill: V("sunk"), stroke: V("ink"), strokeWidth: 1,
    }));
    g.appendChild(svg("text", {
      class: "lbl", x: node.x - NW / 2 + 11, y: node.y + 4, textAnchor: "middle",
      fill: V("muted"), fontSize: "12px", text: n,
    }));
    const lines = node.t.split("\n");
    lines.forEach((line, i) => {
      g.appendChild(svg("text", {
        class: "lbl", x: node.x + 11, y: node.y + 4 + (i - (lines.length - 1) / 2) * 13,
        textAnchor: "middle", fill: V("ink-strong"), fontSize: "11.5px", fontWeight: 500, text: line,
      }));
    });
    root.appendChild(g);
  }

  return plate({
    no: 25,
    title: "How the eight subtopics connect",
    tag: "reference",
    label: "Map of the eight mathematics subtopics",
    stage: root,
    caption:
      "Every arrow is a specific idea carried forward, not a vague relationship. " +
      "<b>Notice that Part 3 feeds both Part 4 and Part 6 with the same fact</b> — " +
      "perpendicularity — and that Parts 2 and 6 both arrive at Part 7, which is " +
      "why differential equations felt like a conclusion rather than a new topic. " +
      "Nothing here is isolated, which is exactly why studying them in this order " +
      "costs less than studying them in NCEES's alphabetical one.",
  });
}

register("synthesis", { no: 25, build: synthesis });
