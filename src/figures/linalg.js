/* ==========================================================================
   figures/linalg.js — Plates 14 to 16.

   Colour continues to mean the same things:
     q-x  the first basis direction, and where it lands
     q-y  the second basis direction, and where it lands
     q-r  the resulting area / magnitude / eigen-aligned result
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed, degv } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;

/* ==========================================================================
   Plate 14 — a matrix moves space; the determinant is the area factor
   ========================================================================== */

const MATS = {
  stretch: { m: [[2, 0], [0, 1.5]], label: "stretch", note: "Each axis scaled independently. Area goes up by the product." },
  shear: { m: [[1, 1.2], [0, 1]], label: "shear", note: "Pushed sideways, but no area is gained or lost — the determinant stays exactly 1." },
  rotate: { m: [[0.6, -0.8], [0.8, 0.6]], label: "rotate", note: "The cast as a rotation by 53.13°. Rigid motion, so the determinant is 1." },
  flip: { m: [[3, 4], [4, -3]], label: "the cast", note: "Determinant −25: area up 25 times, and negative because the square was turned over." },
  singular: { m: [[2, 1], [4, 2]], label: "singular", note: "The second row is twice the first. The square collapses onto a line — zero area, no way back." },
};

function matrixTransform() {
  const p = new Plot({
    w: 480, h: 420, xr: [-5.5, 5.5], yr: [-5.5, 5.5],
    pad: { l: 30, r: 22, t: 16, b: 28 },
    label: "The unit square and the parallelogram a matrix turns it into. The " +
           "area of the parallelogram is the absolute value of the determinant.",
  });
  p.equalize();
  p.grid({ xStep: 1, yStep: 1 });
  p.axes({ xStep: 2, yStep: 2, xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)) });

  // the unit square, always shown for comparison
  p.polygon([[0, 0], [1, 0], [1, 1], [0, 1]], { fill: null, stroke: "rule", width: 1.5, dash: "4 3" });
  p.text(0.5, 0.5, "1", { color: "faint", size: 11 });

  const img = p.polygon([[0, 0], [1, 0], [1, 1], [0, 1]], { fill: "q-r-soft", stroke: "q-r", width: 1.75 });
  const iHat = p.vector(0, 0, 1, 0, { color: "q-x", width: 3 });
  const jHat = p.vector(0, 0, 0, 1, { color: "q-y", width: 3 });
  const iLab = p.text(1, 0, "i", { color: "q-x", size: 13, italic: true, bg: true });
  const jLab = p.text(0, 1, "j", { color: "q-y", size: 13, italic: true, bg: true });

  const rdMat = readout({ key: "matrix", value: "[2 0 ; 0 1.5]" });
  const rdDet = readout({ key: "determinant", value: "3.00", tone: "r" });
  const rdArea = readout({ key: "area of the image", value: "3.00", tone: "r" });
  const rdNote = readout({ key: "what happened", value: MATS.stretch.note });
  rdNote.root.classList.add("wide");

  let key = "stretch";

  function draw(t) {
    const M = MATS[key].m;
    // interpolate from the identity, so the deformation is visible rather than instant
    const a = 1 + t * (M[0][0] - 1), b = t * M[0][1];
    const c = t * M[1][0], d = 1 + t * (M[1][1] - 1);

    const P = [[0, 0], [a, c], [a + b, c + d], [b, d]];
    img.setAttribute("d", "M " + P.map(([x, y]) => `${p.x(x).toFixed(2)} ${p.y(y).toFixed(2)}`).join(" L ") + " Z");
    iHat.setAttribute("x2", p.x(a)); iHat.setAttribute("y2", p.y(c));
    jHat.setAttribute("x2", p.x(b)); jHat.setAttribute("y2", p.y(d));
    for (const n of iLab.childNodes) { n.setAttribute("x", p.x(a) + 8); n.setAttribute("y", p.y(c) + 14); }
    for (const n of jLab.childNodes) { n.setAttribute("x", p.x(b) - 10); n.setAttribute("y", p.y(d) - 6); }

    const det = a * d - b * c;
    rdMat.set(`[${num(a, 2)} ${num(b, 2)} ; ${num(c, 2)} ${num(d, 2)}]`);
    rdDet.set(fixed(det, 2));
    rdArea.set(fixed(Math.abs(det), 2));
    rdNote.set(t < 0.99 ? "part way there — drag the slider to 1.00" : MATS[key].note);
  }

  const k = knob({
    label: "apply the matrix", min: 0, max: 1, step: 0.01, value: 1,
    format: (v) => fixed(v, 2),
    onInput: draw,
  });

  const pick = scenarios({
    label: "matrix",
    options: Object.entries(MATS).map(([id, v]) => ({ id, label: v.label })),
    value: "stretch",
    onChange: (id) => { key = id; draw(k.value()); },
  });

  draw(1);

  return plate({
    no: 14,
    title: "A matrix moves space; the determinant is the area",
    tag: "interactive",
    label: "Matrix as a transformation",
    stage: p.root,
    controls: el("div.plate-controls", null, k.root, pick.root),
    readouts: readouts(rdMat, rdDet, rdArea, rdNote),
    caption:
      "The dashed outline is the original unit square; the teal shape is where the " +
      "matrix sent it. Press <b>shear</b> and watch a badly distorted square keep a " +
      "determinant of exactly 1 — <b>area is conserved even though nothing looks the " +
      "same</b>. Then press <b>singular</b>: the square flattens to a line, area zero, " +
      "and there is no way to work out where a point came from.",
  });
}

/* ==========================================================================
   Plate 15 — a 2×2 system is two lines
   ========================================================================== */

const SYSTEMS = {
  unique: {
    label: "one solution", rows: [[2, 3, 8], [1, -1, 1]],
    note: "Determinant −5. The lines cross once, so there is exactly one answer.",
  },
  none: {
    label: "no solution", rows: [[2, 3, 8], [4, 6, 5]],
    note: "Determinant 0 and the lines are parallel but distinct. Nothing satisfies both.",
  },
  many: {
    label: "infinitely many", rows: [[2, 3, 8], [4, 6, 16]],
    note: "Determinant 0 and the second equation is the first one doubled. Every point on the line works.",
  },
};

function systemLines() {
  const p = new Plot({
    w: 500, h: 380, xr: [-3, 7], yr: [-3, 6],
    pad: { l: 32, r: 22, t: 16, b: 28 },
    label: "Two straight lines representing a pair of simultaneous equations. They " +
           "cross once, never, or lie on top of each other, matching a determinant " +
           "that is non-zero or zero.",
  });
  p.equalize();
  p.grid({ xStep: 1, yStep: 1 });
  p.axes({ xStep: 2, yStep: 2, xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)) });

  const l1 = p.line(0, 0, 0, 0, { color: "q-x", width: 2.5 });
  const l2 = p.line(0, 0, 0, 0, { color: "q-y", width: 2.5, dash: "7 4" });
  const hit = p.dot(0, 0, { color: "q-r", r: 6 });
  const hitLab = p.text(0, 0, "", { color: "q-r", size: 12, bg: true, anchor: "start" });

  const rdEq = readout({ key: "the system", value: "" });
  rdEq.root.classList.add("wide");
  const rdDet = readout({ key: "determinant", value: "−5.00", tone: "r" });
  const rdKind = readout({ key: "solutions", value: "exactly one" });
  const rdNote = readout({ key: "why", value: SYSTEMS.unique.note });
  rdNote.root.classList.add("wide");

  function draw(id) {
    const { rows, note } = SYSTEMS[id];
    const [[a1, b1, c1], [a2, b2, c2]] = rows;

    /* Clip ax + by = c to the visible rectangle. Solving only at the two x
       extremes puts a steep line's endpoints far above the frame, and a
       <line> is not clipped by anything — it just leaves the plate. */
    const seg = (a, b, c, node) => {
      const [X0, X1] = p.xr, [Y0, Y1] = p.yr, E = 1e-9;
      const pts = [];
      const push = (x, y) => {
        if (x >= X0 - E && x <= X1 + E && y >= Y0 - E && y <= Y1 + E) pts.push([x, y]);
      };
      if (Math.abs(b) > E) { push(X0, (c - a * X0) / b); push(X1, (c - a * X1) / b); }
      if (Math.abs(a) > E) { push((c - b * Y0) / a, Y0); push((c - b * Y1) / a, Y1); }
      if (pts.length < 2) {
        for (const k of ["x1", "y1", "x2", "y2"]) node.setAttribute(k, 0);
        return;
      }
      let A = pts[0], B = pts[1], far = -1;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
          if (d > far) { far = d; A = pts[i]; B = pts[j]; }
        }
      }
      node.setAttribute("x1", p.x(A[0])); node.setAttribute("y1", p.y(A[1]));
      node.setAttribute("x2", p.x(B[0])); node.setAttribute("y2", p.y(B[1]));
    };
    seg(a1, b1, c1, l1);
    seg(a2, b2, c2, l2);

    const det = a1 * b2 - b1 * a2;
    const has = Math.abs(det) > 1e-9;
    if (has) {
      const x = (c1 * b2 - b1 * c2) / det, y = (a1 * c2 - c1 * a2) / det;
      for (const n of hit.childNodes) { n.setAttribute("cx", p.x(x)); n.setAttribute("cy", p.y(y)); }
      hit.style.opacity = 1;
      for (const n of hitLab.childNodes) {
        n.setAttribute("x", p.x(x) + 12); n.setAttribute("y", p.y(y) - 10);
        n.textContent = `(${fixed(x, 2)}, ${fixed(y, 2)})`;
        n.style.opacity = 1;
      }
    } else {
      hit.style.opacity = 0;
      for (const n of hitLab.childNodes) n.style.opacity = 0;
    }

    const fmtEq = ([a, b, c]) =>
      `${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}y = ${c}`;
    rdEq.set(`${fmtEq(rows[0])}   ·   ${fmtEq(rows[1])}`);
    rdDet.set(fixed(det, 2));
    rdKind.set(has ? "exactly one" : id === "none" ? "none" : "infinitely many");
    rdNote.set(note);
  }

  const pick = scenarios({
    label: "case",
    options: Object.entries(SYSTEMS).map(([id, v]) => ({ id, label: v.label })),
    value: "unique",
    onChange: draw,
  });
  draw("unique");

  return plate({
    no: 15,
    title: "Singular means the lines never cross once",
    tag: "interactive",
    label: "A 2×2 system as two lines",
    stage: p.root,
    controls: el("div.plate-controls", null, pick.root),
    readouts: readouts(rdEq, rdDet, rdKind, rdNote),
    caption:
      "Both zero-determinant cases look identical in the algebra — the same " +
      "<span class='math'>det = 0</span> — and completely different on the plate. " +
      "<b>Parallel and separate means no solution; parallel and on top of each other " +
      "means infinitely many.</b> The determinant tells you a unique answer is " +
      "missing; only the right-hand side tells you which way it is missing.",
  });
}

/* ==========================================================================
   Plate 16 — hunting for eigenvectors
   ========================================================================== */

function eigen() {
  const A = [[3, 4], [4, -3]];
  const p = new Plot({
    w: 480, h: 430, xr: [-6.5, 6.5], yr: [-6.5, 6.5],
    pad: { l: 30, r: 22, t: 16, b: 28 },
    label: "A unit vector and the result of multiplying it by the matrix. For most " +
           "directions the two arrows point different ways; at four directions they " +
           "line up, and those are the eigenvectors.",
  });
  p.equalize();
  p.grid({ xStep: 1, yStep: 1 });
  p.axes({ xStep: 2, yStep: 2, xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)) });
  p.param((t) => [Math.cos(t), Math.sin(t)], [0, 2 * Math.PI], { color: "q-x", width: 1.25, dash: "3 3", opacity: 0.5, layer: "grid" });

  // the eigen-directions, drawn faintly so the hunt has somewhere to land
  for (const [vx, vy] of [[2, 1], [1, -2]]) {
    const m = Math.hypot(vx, vy), L = 6.2;
    p.line(-vx / m * L, -vy / m * L, vx / m * L, vy / m * L,
      { color: "muted", width: 1, dash: "6 5", layer: "grid", opacity: 0.5 });
  }

  const vArrow = p.vector(0, 0, 1, 0, { color: "q-x", width: 3.5, head: 10 });
  const avArrow = p.vector(0, 0, 1, 0, { color: "q-r", width: 3 });
  const vLab = p.text(0, 0, "v", { color: "q-x", size: 13, italic: true, bg: true });
  const avLab = p.text(0, 0, "Av", { color: "q-r", size: 13, italic: true, bg: true });

  const rdAng = readout({ key: "direction of v", value: "0°", tone: "x" });
  const rdAv = readout({ key: "Av", value: "3.00i + 4.00j", tone: "r" });
  const rdBetween = readout({ key: "angle from v to Av", value: "13.1°" });
  const rdVerdict = readout({ key: "verdict", value: "not an eigenvector" });
  rdVerdict.root.classList.add("wide");

  function draw(deg) {
    const t = (deg * Math.PI) / 180;
    const vx = Math.cos(t), vy = Math.sin(t);
    const ax = A[0][0] * vx + A[0][1] * vy;
    const ay = A[1][0] * vx + A[1][1] * vy;

    vArrow.setAttribute("x2", p.x(vx)); vArrow.setAttribute("y2", p.y(vy));
    avArrow.setAttribute("x2", p.x(ax)); avArrow.setAttribute("y2", p.y(ay));
    for (const n of vLab.childNodes) { n.setAttribute("x", p.x(vx * 1.3)); n.setAttribute("y", p.y(vy * 1.3)); }
    for (const n of avLab.childNodes) { n.setAttribute("x", p.x(ax * 1.12)); n.setAttribute("y", p.y(ay * 1.12)); }

    // v is a unit vector, so |Av| is already the stretch factor
    const cosBetween = (vx * ax + vy * ay) / Math.hypot(ax, ay);
    const between = Math.acos(Math.max(-1, Math.min(1, cosBetween))) * 180 / Math.PI;
    const aligned = between < 1.2 || between > 178.8;
    const lambda = vx * ax + vy * ay;      // the projection; equals λ when aligned

    rdAng.set(degv(deg, 1));
    rdAv.set(`${fixed(ax, 2)}i ${ay < 0 ? "−" : "+"} ${fixed(Math.abs(ay), 2)}j`);
    rdBetween.set(degv(between, 1));
    rdVerdict.set(aligned
      ? `eigenvector — Av is ${between < 90 ? "along" : "opposite to"} v, with λ = ${fixed(lambda, 2)}`
      : "not an eigenvector — Av points somewhere else");

    avArrow.style.stroke = V(aligned ? "q-r" : "q-r");
    avArrow.style.strokeWidth = aligned ? 4.5 : 3;
    vArrow.style.strokeWidth = aligned ? 3.5 : 2.5;
  }

  const k = knob({
    label: "direction of v", min: 0, max: 360, step: 0.1, value: 20,
    format: (v) => `${num(v, 1)}°`,
    onInput: draw,
  });

  const jump = scenarios({
    options: [
      { id: "26.57", label: "26.57°" }, { id: "116.57", label: "116.57°" },
      { id: "206.57", label: "206.57°" }, { id: "296.57", label: "296.57°" },
    ],
    label: "the four alignments",
    value: "none",
    onChange: (id) => k.set(Number(id)),
  });

  draw(20);

  return plate({
    no: 16,
    title: "The directions a matrix leaves alone",
    tag: "interactive",
    label: "Eigenvector hunt",
    stage: p.root,
    controls: el("div.plate-controls", null, k.root, jump.root),
    readouts: readouts(rdAng, rdAv, rdBetween, rdVerdict),
    caption:
      "Sweep slowly and watch the angle between the two arrows. It passes through " +
      "zero at 26.57° and 206.57°, where <span class='math'>Av</span> is 5 times " +
      "<span class='math'>v</span>, and through 180° at 116.57° and 296.57°, where " +
      "<span class='math'>Av</span> is <b>−5</b> times <span class='math'>v</span> — " +
      "flipped, not merely shrunk. Two eigen-directions, eigenvalues ±5, exactly as " +
      "the trace and determinant predicted.",
  });
}

/* --- registration ---------------------------------------------------------- */

register("matrixTransform", { no: 14, build: matrixTransform });
register("systemLines", { no: 15, build: systemLines });
register("eigen", { no: 16, build: eigen });
