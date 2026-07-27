/* ==========================================================================
   figures/discrete.js — Plates 23 and 24.
   ========================================================================== */

import { svg, el, knob, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { num } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;

const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));

/* ==========================================================================
   Plate 23 — the r! that separates the two counts
   One knob: how many you are taking. Lesson: a combination is a permutation
   with the orderings collapsed.
   ========================================================================== */

function counting() {
  const N = 8;
  const W = 620, H = 260;

  const root = svg("svg", {
    viewBox: `0 0 ${W} ${H}`, role: "img",
    "aria-label":
      "A row of slots being filled from eight objects. Each slot shows how many " +
      "choices remain, and their product is the number of ordered arrangements. " +
      "Dividing by r factorial gives the number of unordered selections.",
    style: { display: "block", width: "100%", height: "auto" },
  });

  const slots = svg("g");
  const perms = svg("text", {
    class: "lbl", x: W / 2, y: 150, textAnchor: "middle",
    fill: V("q-x"), fontSize: "15px", fontWeight: 500,
  });
  const bar = svg("line", { x1: W / 2 - 130, y1: 176, x2: W / 2 + 130, y2: 176, stroke: V("ink"), strokeWidth: 1.25 });
  const divisor = svg("text", {
    class: "lbl", x: W / 2, y: 200, textAnchor: "middle",
    fill: V("q-y"), fontSize: "15px", fontWeight: 500,
  });
  const combo = svg("text", {
    class: "lbl", x: W / 2, y: 236, textAnchor: "middle",
    fill: V("q-r"), fontSize: "17px", fontWeight: 500,
  });
  const capL = svg("text", {
    class: "lbl", x: W / 2 - 150, y: 155, textAnchor: "end", fill: V("muted"), fontSize: "11px",
    text: "ordered:",
  });
  const capR = svg("text", {
    class: "lbl", x: W / 2 - 150, y: 204, textAnchor: "end", fill: V("muted"), fontSize: "11px",
    text: "÷ shuffles:",
  });
  const capC = svg("text", {
    class: "lbl", x: W / 2 - 150, y: 240, textAnchor: "end", fill: V("muted"), fontSize: "11px",
    text: "unordered:",
  });
  root.append(slots, capL, perms, bar, capR, divisor, capC, combo);

  const rdP = readout({ key: "P(8, r) ordered", value: "336", tone: "x" });
  const rdF = readout({ key: "r! shuffles", value: "6", tone: "y" });
  const rdC = readout({ key: "C(8, r) unordered", value: "56", tone: "r" });
  const rdRatio = readout({ key: "the gap between them", value: "6×" });
  rdRatio.root.classList.add("wide");

  function draw(r) {
    while (slots.firstChild) slots.removeChild(slots.firstChild);
    const w = 62, gap = 12;
    const total = r * w + (r - 1) * gap;
    const x0 = (W - total) / 2;

    for (let i = 0; i < r; i++) {
      const x = x0 + i * (w + gap);
      slots.appendChild(svg("rect", {
        x, y: 46, width: w, height: 54, rx: 2,
        fill: V("q-x-soft"), stroke: V("q-x"), strokeWidth: 1.5,
      }));
      slots.appendChild(svg("text", {
        class: "lbl", x: x + w / 2, y: 80, textAnchor: "middle",
        fill: V("q-x"), fontSize: "20px", fontWeight: 500, text: String(N - i),
      }));
      slots.appendChild(svg("text", {
        class: "lbl", x: x + w / 2, y: 116, textAnchor: "middle",
        fill: V("faint"), fontSize: "10px", text: `slot ${i + 1}`,
      }));
      if (i < r - 1) {
        slots.appendChild(svg("text", {
          class: "lbl", x: x + w + gap / 2, y: 80, textAnchor: "middle",
          fill: V("muted"), fontSize: "14px", text: "×",
        }));
      }
    }
    slots.appendChild(svg("text", {
      class: "lbl", x: W / 2, y: 26, textAnchor: "middle", fill: V("muted"), fontSize: "11.5px",
      text: `choosing ${r} from ${N} — each slot has one fewer option left`,
    }));

    const P = Array.from({ length: r }, (_, i) => N - i).reduce((a, b) => a * b, 1);
    const f = fact(r);
    const C = P / f;

    perms.textContent = `${Array.from({ length: r }, (_, i) => N - i).join(" × ")} = ${P}`;
    divisor.textContent = `${r}! = ${f}`;
    combo.textContent = `${P} ÷ ${f} = ${C}`;

    rdP.set(String(P));
    rdF.set(String(f));
    rdC.set(String(C));
    rdRatio.set(`${f}× — misreading one word costs you a factor of ${f}`);
  }

  const k = knob({
    label: "r — how many you take", min: 1, max: 6, step: 1, value: 3,
    format: (v) => String(v),
    onInput: draw,
  });
  draw(3);

  return plate({
    no: 23,
    title: "Order matters, or it does not",
    tag: "interactive",
    label: "Permutations against combinations",
    stage: root,
    controls: el("div.plate-controls", null, k.root),
    readouts: readouts(rdP, rdF, rdC, rdRatio),
    caption:
      "The slots show why a permutation is a falling product: having used one " +
      "object, the next slot has one fewer to draw from. <b>The only thing a " +
      "combination adds is the division by</b> <span class='math'>r!</span>, " +
      "because a selection you have already made can be shuffled " +
      "<span class='math'>r!</span> ways and it is still the same selection. " +
      "Push r to 6 and that divisor reaches 720.",
  });
}

/* ==========================================================================
   Plate 24 — a graph is a matrix
   ========================================================================== */

const NODES = ["A", "B", "C", "D", "E"];
const START_EDGES = ["AB", "AC", "BC", "CD", "DE"];

function graphMatrix() {
  const W = 620, H = 300;
  const root = svg("svg", {
    viewBox: `0 0 ${W} ${H}`, role: "img",
    "aria-label":
      "A five-vertex graph on the left and its adjacency matrix on the right. " +
      "Clicking an edge adds or removes it, and the matrix updates to match.",
    style: { display: "block", width: "100%", height: "auto" },
  });

  const R = 96, CX = 150, CY = 150;
  const pos = NODES.map((_, i) => {
    const a = -Math.PI / 2 + (i / NODES.length) * 2 * Math.PI;
    return [CX + R * Math.cos(a), CY + R * Math.sin(a)];
  });

  const edges = new Set(START_EDGES);
  const key = (i, j) => (i < j ? NODES[i] + NODES[j] : NODES[j] + NODES[i]);

  const edgeLayer = svg("g");
  const nodeLayer = svg("g");
  const gridLayer = svg("g");
  root.append(edgeLayer, nodeLayer, gridLayer);

  root.appendChild(svg("text", {
    class: "lbl", x: CX, y: 282, textAnchor: "middle", fill: V("faint"), fontSize: "10.5px",
    text: "click a line to add or remove that edge",
  }));

  /* --- the graph ---------------------------------------------------------- */
  const edgeEls = [];
  for (let i = 0; i < NODES.length; i++) {
    for (let j = i + 1; j < NODES.length; j++) {
      const g = svg("g", { style: { cursor: "pointer" } });
      const line = svg("line", {
        x1: pos[i][0], y1: pos[i][1], x2: pos[j][0], y2: pos[j][1],
        stroke: V("q-r"), strokeWidth: 2.5,
      });
      // a fat invisible line makes the click target usable on a phone
      const hit = svg("line", {
        x1: pos[i][0], y1: pos[i][1], x2: pos[j][0], y2: pos[j][1],
        stroke: "transparent", strokeWidth: 16,
      });
      g.append(line, hit);
      g.addEventListener("click", () => {
        const k = key(i, j);
        if (edges.has(k)) edges.delete(k); else edges.add(k);
        paint();
      });
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", `edge ${NODES[i]} to ${NODES[j]}`);
      edgeLayer.appendChild(g);
      edgeEls.push({ i, j, line });
    }
  }

  const degLabels = [];
  pos.forEach(([x, y], i) => {
    nodeLayer.appendChild(svg("circle", { cx: x, cy: y, r: 17, fill: V("plate"), stroke: V("ink"), strokeWidth: 1.75 }));
    nodeLayer.appendChild(svg("text", {
      class: "lbl", x, y: y + 5, textAnchor: "middle", fill: V("ink-strong"),
      fontSize: "14px", fontWeight: 500, text: NODES[i],
    }));
    const d = svg("text", {
      class: "lbl", x: x + (x < CX ? -26 : x > CX ? 26 : 0), y: y + (y < CY ? -22 : 30),
      textAnchor: "middle", fill: V("q-r"), fontSize: "10.5px",
    });
    degLabels.push(d);
    nodeLayer.appendChild(d);
  });

  /* --- the matrix --------------------------------------------------------- */
  const MX = 380, MY = 76, CELL = 34;
  const cells = [];
  gridLayer.appendChild(svg("text", {
    class: "lbl", x: MX + (CELL * NODES.length) / 2, y: MY - 34, textAnchor: "middle",
    fill: V("muted"), fontSize: "11.5px", text: "adjacency matrix",
  }));
  NODES.forEach((n, i) => {
    gridLayer.appendChild(svg("text", {
      class: "lbl", x: MX + i * CELL + CELL / 2, y: MY - 8, textAnchor: "middle",
      fill: V("muted"), fontSize: "11px", text: n,
    }));
    gridLayer.appendChild(svg("text", {
      class: "lbl", x: MX - 10, y: MY + i * CELL + CELL / 2 + 4, textAnchor: "end",
      fill: V("muted"), fontSize: "11px", text: n,
    }));
  });
  for (let i = 0; i < NODES.length; i++) {
    cells[i] = [];
    for (let j = 0; j < NODES.length; j++) {
      const rect = svg("rect", {
        x: MX + j * CELL, y: MY + i * CELL, width: CELL, height: CELL,
        fill: "none", stroke: V("rule"), strokeWidth: 1,
      });
      const t = svg("text", {
        class: "lbl", x: MX + j * CELL + CELL / 2, y: MY + i * CELL + CELL / 2 + 4,
        textAnchor: "middle", fill: V("faint"), fontSize: "13px", text: "0",
      });
      gridLayer.append(rect, t);
      cells[i][j] = { rect, t };
    }
  }
  gridLayer.appendChild(svg("rect", {
    x: MX, y: MY, width: CELL * NODES.length, height: CELL * NODES.length,
    fill: "none", stroke: V("ink"), strokeWidth: 1.5,
  }));

  const rdEdges = readout({ key: "edges |E|", value: "5", tone: "r" });
  const rdDeg = readout({ key: "Σ deg(v)", value: "10" });
  const rdCheck = readout({ key: "= 2|E| ?", value: "10 = 2 × 5 ✓" });
  const rdConn = readout({ key: "connected?", value: "yes" });

  function paint() {
    for (const { i, j, line } of edgeEls) {
      const on = edges.has(key(i, j));
      line.style.stroke = V(on ? "q-r" : "muted");
      line.style.strokeWidth = on ? 2.75 : 1.25;
      line.style.strokeDasharray = on ? null : "2 5";
      line.style.opacity = on ? 1 : 0.42;
    }

    const deg = NODES.map(() => 0);
    for (let i = 0; i < NODES.length; i++) {
      for (let j = 0; j < NODES.length; j++) {
        const on = i !== j && edges.has(key(i, j));
        cells[i][j].t.textContent = on ? "1" : "0";
        cells[i][j].t.style.fill = V(on ? "q-r" : "faint");
        cells[i][j].t.style.fontWeight = on ? 600 : 400;
        cells[i][j].rect.style.fill = on ? V("q-r-soft") : "none";
        if (on) deg[i]++;
      }
    }
    degLabels.forEach((d, i) => { d.textContent = `deg ${deg[i]}`; });

    const total = deg.reduce((a, b) => a + b, 0);
    rdEdges.set(String(edges.size));
    rdDeg.set(String(total));
    rdCheck.set(`${total} = 2 × ${edges.size} ${total === 2 * edges.size ? "✓" : "✗"}`);

    // flood fill from A
    const seen = new Set([0]);
    const stack = [0];
    while (stack.length) {
      const v = stack.pop();
      for (let j = 0; j < NODES.length; j++) {
        if (j !== v && edges.has(key(v, j)) && !seen.has(j)) { seen.add(j); stack.push(j); }
      }
    }
    rdConn.set(seen.size === NODES.length ? "yes" : `no — ${NODES.length - seen.size} vertex(es) unreachable from A`);
  }

  paint();

  return plate({
    no: 24,
    title: "A graph is a matrix",
    tag: "interactive",
    label: "Graph and its adjacency matrix",
    stage: root,
    readouts: readouts(rdEdges, rdDeg, rdCheck, rdConn),
    caption:
      "Add or remove any edge and two things move together: a symmetric pair of " +
      "entries in the matrix, and the degrees of the two vertices it touched. " +
      "<b>The handshake check never fails</b>, because every edge you add " +
      "contributes exactly 2 to the total degree. Delete the two edges at E and " +
      "watch the connectivity readout notice before you do.",
  });
}

/* --- registration ---------------------------------------------------------- */

register("counting", { no: 23, build: counting });
register("graphMatrix", { no: 24, build: graphMatrix });
