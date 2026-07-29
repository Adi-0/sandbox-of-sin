/* ==========================================================================
   figures/minimisation.js — Plates 67 and 68.

   Plate 67 is a working four-variable Karnaugh map. The groupings are not
   drawn by hand: the plate enumerates every product term, keeps the ones that
   are implicants, discards the non-prime ones and then covers the on-set —
   so the rings it draws are the real answer for whatever function is loaded,
   including the wrap-around groups a hand-drawn plate would have to fake.

   Plate 68 is the same expression as silicon: a programmable AND array
   feeding a programmable OR array, which is what a PLA is.
   ========================================================================== */

import { el, svg, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { cover, termText, literals } from "../lib/boolean.js";

const V = (n) => `var(--${n})`;
const NS = "http://www.w3.org/2000/svg";

const VARS = ["A", "B", "C", "D"];
const GRAY = [0, 1, 3, 2];                 // 00, 01, 11, 10

/* The functions the plate can load. Each teaches a different lesson. */
const FUNCS = {
  corners: {
    name: "The corners", on: [0, 2, 8, 10], dc: [],
    note: "<b>The map is a torus.</b> Those four cells look scattered, but the left and right edges are adjacent and so are the top and bottom — so they form one group of four, and the answer is two literals rather than sixteen.",
  },
  cast: {
    name: "3, 4, 5", on: [3, 4, 5], dc: [],
    note: "The compilation's numbers, and an <b>honest bad case</b>. 4 and 5 pair up, but 3 sits alone with no neighbour in the on-set, so it costs a full four-literal term. <b>Not every function simplifies</b>, and a map that shows you so has still done its job.",
  },
  bcd: {
    name: "Invalid BCD", on: [10, 11, 12, 13, 14, 15], dc: [],
    note: "A detector for the six 4-bit codes that are not valid BCD digits. The map finds two groups covering all six, giving <b>A·B + A·C</b> — two gates instead of six four-input ones.",
  },
  dontcare: {
    name: "With don't-cares", on: [1, 3, 7, 11, 15], dc: [0, 2, 5],
    note: "<b>Don't-cares are free real estate.</b> Cells marked × may be grouped or ignored, whichever helps. Here they let groups grow that could not otherwise, and the term count drops. Never treat a don't-care as a 0 by default — that throws away the whole advantage.",
  },
  parity: {
    name: "Odd parity", on: [1, 2, 4, 7, 8, 11, 13, 14], dc: [],
    note: "<b>The map that cannot help.</b> No two on-cells are adjacent — this is a checkerboard — so every group is a single cell and the minimal SOP has eight four-literal terms. Parity is an XOR function, and XOR is precisely what sum-of-products is bad at.",
  },
};

/* ==========================================================================
   Plate 67 — the Karnaugh map
   One control: which function. Lesson: adjacency is the whole mechanism, the
   Gray ordering is what creates it, and the edges wrap.
   ========================================================================== */

function kmap() {
  const CW = 74, CH = 60;                     // one cell
  const X0 = 150, Y0 = 34;                    // top-left of the grid, in px

  const p = new Plot({
    w: 620, h: 380, xr: [0, 588], yr: [-362, 0],
    pad: { l: 16, r: 16, t: 10, b: 8 },
    label:
      "A four-variable Karnaugh map: sixteen cells in a four-by-four grid with " +
      "Gray-coded row and column labels, the on-cells marked, and rounded " +
      "outlines drawn around each group in the minimal cover.",
  });

  const rdFn = readout({ key: "function", value: "" });
  const rdOn = readout({ key: "on-set", value: "", tone: "y" });
  const rdTerms = readout({ key: "terms", value: "", tone: "r" });
  const rdLits = readout({ key: "literals", value: "" });
  const rdSaved = readout({ key: "vs canonical", value: "" });
  const rdSop = readout({ key: "minimal SOP", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdSop.root.classList.add("wide");
  rdNote.root.classList.add("wide");

  /* Where a minterm sits on the grid. Row is AB, column is CD, both Gray. */
  const posOf = (m) => {
    const ab = (m >> 2) & 3, cd = m & 3;
    return [GRAY.indexOf(cd), GRAY.indexOf(ab)];         // [col, row]
  };

  function draw(key) {
    p.clear("curve", "label", "mark", "shade");
    const F = FUNCS[key];
    const onSet = new Set(F.on), dcSet = new Set(F.dc);
    const groups = cover(F.on, F.dc, 4);

    // headers
    p.text(X0 - 16, -Y0 + 16, "AB", { color: "muted", size: 11.5, weight: 600, anchor: "end" });
    p.text(X0 - 16, -Y0 + 2, "CD", { color: "muted", size: 11.5, weight: 600, anchor: "end" });
    GRAY.forEach((g, c) => p.text(X0 + c * CW + CW / 2, -Y0 + 10,
      g.toString(2).padStart(2, "0"), { color: "muted", size: 12, weight: 600 }));
    GRAY.forEach((g, r) => p.text(X0 - 16, -(Y0 + 22 + r * CH + CH / 2 - 12),
      g.toString(2).padStart(2, "0"), { color: "muted", size: 12, weight: 600, anchor: "end" }));

    // cells
    for (let m = 0; m < 16; m++) {
      const [c, r] = posOf(m);
      const cx = X0 + c * CW + CW / 2;
      const cy = -(Y0 + 22 + r * CH + CH / 2);
      const on = onSet.has(m), dcc = dcSet.has(m);
      rect(p, cx, cy, CW - 3, CH - 3, on ? "q-y-soft" : "plate", "grid", 1.1);
      p.text(cx, cy, on ? "1" : dcc ? "×" : "0",
        { color: on ? "q-y" : dcc ? "q-r" : "muted", size: on || dcc ? 18 : 15, weight: on || dcc ? 600 : 400, dy: 6 });
      p.text(cx + CW / 2 - 8, cy + CH / 2 - 10, `${m}`,
        { color: "grid", size: 9, anchor: "end" });
    }

    /* Group outlines. A group that wraps is drawn as two pieces rather than
       one impossible rectangle — which is what makes the torus visible. */
    const groupColour = (i) => (i % 2 ? "q-r" : "q-x");
    groups.forEach((g, gi) => {
      const cols = new Set(), rows = new Set();
      g.cells.forEach((m) => { const [c, r] = posOf(m); cols.add(c); rows.add(r); });
      runs([...cols].sort((a, b) => a - b)).forEach((cr) => {
        runs([...rows].sort((a, b) => a - b)).forEach((rr) => {
          const inset = 5 + (gi % 3) * 3.5;
          const x1 = X0 + cr[0] * CW + inset;
          const x2 = X0 + (cr[1] + 1) * CW - inset;
          const y1 = -(Y0 + 22 + rr[0] * CH + inset);
          const y2 = -(Y0 + 22 + (rr[1] + 1) * CH - inset);
          rect(p, (x1 + x2) / 2, (y1 + y2) / 2, x2 - x1, y1 - y2,
            null, groupColour(gi), 2.2, 10);
        });
      });
    });

    /* A wrapped group is drawn as several rectangles, which reads as several
       groups unless something ties them together. The legend does that: each
       term is printed in the colour of its own outlines. */
    const yLeg = -(Y0 + 22 + 4 * CH + 26);
    if (groups.length <= 4) {
      let lx = X0 - 40;
      groups.forEach((g, gi) => {
        rect(p, lx + 9, yLeg + 4, 18, 12, null, groupColour(gi), 2.2, 4);
        p.text(lx + 26, yLeg, termText(g.mask, g.value, 4, VARS),
          { color: groupColour(gi), size: 13, weight: 600, anchor: "start" });
        lx += 40 + termText(g.mask, g.value, 4, VARS).length * 11;
      });
    } else {
      p.text(X0 + 2 * CW, yLeg, `${groups.length} single-cell groups — no adjacencies to exploit`,
        { color: "muted", size: 11.5 });
    }

    const sop = groups.length
      ? groups.map((g) => termText(g.mask, g.value, 4, VARS)).join("  +  ")
      : "0";
    const lits = groups.reduce((s, g) => s + literals(g.mask, 4), 0);
    const canonical = F.on.length * 4;

    rdFn.set(F.name);
    rdOn.set(`${F.on.length} cells`, F.dc.length ? ` · ${F.dc.length} don't-care` : "");
    rdTerms.set(`${groups.length}`);
    rdLits.set(`${lits}`);
    rdSaved.set(canonical ? `${canonical} → ${lits}` : "—", " literals");
    rdSop.set(sop);
    rdNote.set(F.note);
  }

  const sc = scenarios({
    label: "function",
    options: Object.keys(FUNCS).map((id) => ({ id, label: FUNCS[id].name })),
    value: "corners",
    onChange: draw,
  });
  draw("corners");

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root),
    readouts: readouts(rdFn, rdOn, rdTerms, rdLits, rdSaved, rdSop, rdNote),
  };
}

/* ==========================================================================
   Plate 68 — the same expression, as silicon
   One control: which function. Lesson: a PLA is a programmable AND array
   feeding a programmable OR array, which is a sum of products made physical.
   ========================================================================== */

function plaArray() {
  const p = new Plot({
    w: 620, h: 340, xr: [0, 588], yr: [-318, 0],
    pad: { l: 16, r: 16, t: 10, b: 8 },
    label:
      "A programmable logic array: four inputs and their complements running " +
      "down as vertical lines, product-term rows crossing them with dots at " +
      "the programmed connections, and an output column summing the rows.",
  });

  const rdFn = readout({ key: "function", value: "" });
  const rdRows = readout({ key: "product rows", value: "", tone: "r" });
  const rdCols = readout({ key: "input lines", value: "" });
  const rdDots = readout({ key: "connections", value: "", tone: "y" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(key) {
    p.clear("curve", "label", "mark", "shade");
    const F = FUNCS[key];
    const groups = cover(F.on, F.dc, 4).slice(0, 6);     // the drawing holds six rows

    const X0 = 130, DX = 46, Y0 = -70, DY = 34;
    const nCols = 8;                                   // A, ¬A, B, ¬B, C, ¬C, D, ¬D
    const rows = Math.max(groups.length, 1);
    const yBot = Y0 - (rows - 1) * DY - 26;

    // the input columns
    for (let i = 0; i < nCols; i++) {
      const x = X0 + i * DX;
      p.line(x, -34, x, yBot, { color: "grid", width: 1.2 });
      p.text(x, -22, `${VARS[i >> 1]}${i & 1 ? "̄" : ""}`,
        { color: "q-x", size: 12.5, weight: 600 });
    }
    p.text(X0 - 20, -22, "inputs", { color: "muted", size: 10.5, anchor: "end" });

    // one row per product term
    const xOut = X0 + nCols * DX + 26;
    groups.forEach((g, r) => {
      const y = Y0 - r * DY;
      p.line(X0 - 14, y, xOut, y, { color: "ink", width: 1.5 });
      for (let b = 3; b >= 0; b--) {
        if (!(g.mask & (1 << b))) continue;
        const vi = 3 - b;
        const col = vi * 2 + (g.value & (1 << b) ? 0 : 1);
        p.dot(X0 + col * DX, y, { color: "q-y", r: 5 });
      }
      p.text(X0 - 22, y, termText(g.mask, g.value, 4, VARS),
        { color: "q-r", size: 11.5, weight: 600, anchor: "end", dy: 4 });
    });

    // the OR column
    p.line(xOut, Y0 + 16, xOut, yBot, { color: "grid", width: 1.2 });
    groups.forEach((g, r) => p.dot(xOut, Y0 - r * DY, { color: "q-r", r: 5 }));
    p.line(xOut, Y0 - (rows - 1) * DY, xOut, yBot + 8, { color: "ink", width: 1.5 });
    p.line(xOut, yBot + 8, xOut + 40, yBot + 8, { color: "ink", width: 1.5 });
    p.text(xOut + 52, yBot + 8, "Y", { color: "ink", size: 13, weight: 600, dy: 5 });
    p.text(xOut, Y0 + 30, "OR", { color: "q-r", size: 11, weight: 600 });
    p.text((X0 + xOut) / 2 - 40, Y0 + 30, "AND array — one row per product term",
      { color: "muted", size: 10.5 });

    rdFn.set(F.name);
    rdRows.set(`${groups.length}`);
    rdCols.set(`${nCols}`, " — each variable and its complement");
    rdDots.set(`${groups.reduce((s, g) => s + literals(g.mask, 4), 0)}`);
    rdNote.set(
      "Every dot is a programmed connection. <b>The rows are the products and the " +
      "column on the right is the sum</b>, which is why this structure implements " +
      "sum-of-products directly and why minimising first matters: <b>fewer terms " +
      "means fewer rows, and fewer literals means fewer dots.</b> A PAL fixes the " +
      "OR array and programs only the AND plane; an FPGA abandons arrays " +
      "altogether and uses lookup tables, which is why it does not care whether " +
      "your expression was minimised at all."
    );
  }

  const sc = scenarios({
    label: "function",
    options: Object.keys(FUNCS).filter((k) => k !== "parity")
      .map((id) => ({ id, label: FUNCS[id].name })),
    value: "bcd",
    onChange: draw,
  });
  draw("bcd");

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root),
    readouts: readouts(rdFn, rdRows, rdCols, rdDots, rdNote),
  };
}

/* -------------------------------------------------------------------------
   helpers
   ------------------------------------------------------------------------- */

/** Split a sorted index list into contiguous runs, so a wrapped group can be
    drawn as two rectangles instead of one that is geometrically impossible. */
function runs(sorted) {
  if (!sorted.length) return [];
  const out = [];
  let a = sorted[0], prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) { prev = sorted[i]; continue; }
    out.push([a, prev]); a = sorted[i]; prev = sorted[i];
  }
  out.push([a, prev]);
  return out;
}

function rect(p, ux, uy, w, h, fill, stroke, sw = 1.2, rx = 2) {
  const r = document.createElementNS(NS, "rect");
  r.setAttribute("x", p.x(ux) - w / 2); r.setAttribute("y", p.y(uy) - h / 2);
  r.setAttribute("width", w); r.setAttribute("height", h); r.setAttribute("rx", rx);
  r.setAttribute("fill", fill ? V(fill) : "none");
  if (stroke) { r.setAttribute("stroke", V(stroke)); r.setAttribute("stroke-width", sw); }
  p.add(fill ? "shade" : "curve", r);
  return r;
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("kmap", { no: 67, build: () => {
  const f = kmap();
  return plate({
    no: 67, title: "The Karnaugh map", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The row and column labels are in <b>Gray code</b> — 00, 01, 11, 10 — and " +
      "that is the entire mechanism. Because neighbours differ in exactly one " +
      "bit, any adjacent pair of on-cells means one variable does not matter and " +
      "can be deleted. <b>The edges wrap</b>, so the four corners are one group of " +
      "four; load “The corners” and the outline will show it. Then load " +
      "“Odd parity” to see the honest failure: a checkerboard has no " +
      "adjacencies at all, and no map can help with an XOR.",
  });
} });

register("plaArray", { no: 68, build: () => {
  const f = plaArray();
  return plate({
    no: 68, title: "A PLA is a sum of products", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "This is the previous plate's answer, built. Each horizontal line is one " +
      "<b>product</b> term, each dot connects it to a variable or its complement, " +
      "and the vertical line on the right <b>sums</b> them. That is why " +
      "minimisation is worth doing before implementation and not after: fewer " +
      "terms is literally fewer rows of silicon. A PAL is the cheaper variant " +
      "with the OR plane fixed; an FPGA drops the array idea entirely for lookup " +
      "tables, which is why it is indifferent to how tidy your algebra was.",
  });
} });
