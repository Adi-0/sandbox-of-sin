/* ==========================================================================
   figures/vectors.js — Plates 11 to 13.
   ========================================================================== */

import { svg, el, knob, readout, readouts, draggable } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot, contours } from "../lib/plot.js";
import { num, fixed, degv } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;

/* ==========================================================================
   Plate 11 — magnitude in three dimensions is Pythagoras twice
   ========================================================================== */

function vector3d() {
  const W = 560, H = 360;
  const root = svg("svg", {
    viewBox: `0 0 ${W} ${H}`, role: "img",
    "aria-label":
      "An isometric box of sides 3, 4 and 12 with the vector 3i + 4j + 12k drawn " +
      "as its diagonal. The base diagonal is 5 by the 3-4-5 triangle, and the full " +
      "diagonal is 13 by the 5-12-13 triangle.",
    style: { display: "block", width: "100%", height: "auto" },
  });

  // a simple isometric projection: x goes right-down, y right-up, z straight up
  const O = [176, 268];
  const S = 15.5;
  const ex = [0.86 * S, 0.5 * S], ey = [0.94 * S, -0.42 * S], ez = [0, -S];
  const P = (x, y, z) => [
    O[0] + x * ex[0] + y * ey[0] + z * ez[0],
    O[1] + x * ex[1] + y * ey[1] + z * ez[1],
  ];
  const A = 3, B = 4, C = 12;

  const line = (p1, p2, o = {}) => svg("line", {
    x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1],
    stroke: V(o.color || "rule"), strokeWidth: o.w || 1,
    strokeDasharray: o.dash || null, strokeLinecap: "round",
  });

  /* the box, faint */
  const box = svg("g", { opacity: 0.85 });
  const corners = [[0, 0, 0], [A, 0, 0], [A, B, 0], [0, B, 0],
                   [0, 0, C], [A, 0, C], [A, B, C], [0, B, C]].map(([x, y, z]) => P(x, y, z));
  for (const [i, k] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4],
                        [0, 4], [1, 5], [2, 6], [3, 7]]) {
    box.appendChild(line(corners[i], corners[k], { color: "rule", w: 1, dash: "3 4" }));
  }
  root.appendChild(box);

  /* the axes we care about */
  root.appendChild(line(P(0, 0, 0), P(A, 0, 0), { color: "q-x", w: 4 }));
  root.appendChild(line(P(A, 0, 0), P(A, B, 0), { color: "q-y", w: 4 }));
  root.appendChild(line(P(A, B, 0), P(A, B, C), { color: "q-r", w: 4 }));

  /* the two Pythagoras steps */
  root.appendChild(line(P(0, 0, 0), P(A, B, 0), { color: "ink", w: 2, dash: "6 4" }));
  const head = svg("marker", {
    id: "v3d-head", viewBox: "0 0 10 10", refX: 8.5, refY: 5,
    markerWidth: 8, markerHeight: 8, orient: "auto-start-reverse", markerUnits: "userSpaceOnUse",
  }, svg("path", { d: "M 0 1 L 9 5 L 0 9 z", fill: V("ink") }));
  root.appendChild(svg("defs", null, head));
  const diag = line(P(0, 0, 0), P(A, B, C), { color: "ink", w: 2.75 });
  diag.style.setProperty("marker-end", "url(#v3d-head)");
  root.appendChild(diag);

  const txt = (p, s, o = {}) => svg("text", {
    class: "lbl", x: p[0] + (o.dx || 0), y: p[1] + (o.dy || 0),
    textAnchor: o.anchor || "middle", fill: V(o.color || "muted"),
    fontSize: `${o.size || 12}px`, fontWeight: o.weight || null, text: s,
  });

  root.append(
    txt(P(1.5, 0, 0), "3", { dx: -4, dy: 18, color: "q-x", size: 14, weight: 500 }),
    txt(P(A, 2, 0), "4", { dx: 12, dy: 14, color: "q-y", size: 14, weight: 500 }),
    txt(P(A, B, 6), "12", { dx: 14, dy: 4, color: "q-r", size: 14, weight: 500, anchor: "start" }),
    txt(P(1.7, 2.2, 0), "5", { dx: 6, dy: 16, color: "ink", size: 13 }),
    txt(P(1.4, 1.9, 7), "13", { dx: -18, dy: 0, color: "ink", size: 15, weight: 500, anchor: "end" }),
  );

  /* the arithmetic, written beside the drawing */
  const notes = svg("g");
  const NX = 352;
  notes.appendChild(svg("text", {
    class: "lbl", x: NX, y: 96, textAnchor: "start", fill: V("muted"), fontSize: "11.5px",
    text: "Step 1 — across the base:",
  }));
  notes.appendChild(svg("text", {
    class: "lbl", x: NX, y: 118, textAnchor: "start", fill: V("ink-strong"), fontSize: "13px",
    text: "√(3² + 4²)  =  5",
  }));
  notes.appendChild(svg("text", {
    class: "lbl", x: NX, y: 156, textAnchor: "start", fill: V("muted"), fontSize: "11.5px",
    text: "Step 2 — up from there:",
  }));
  notes.appendChild(svg("text", {
    class: "lbl", x: NX, y: 178, textAnchor: "start", fill: V("ink-strong"), fontSize: "13px",
    text: "√(5² + 12²)  =  13",
  }));
  notes.appendChild(svg("line", { x1: NX, y1: 198, x2: NX + 150, y2: 198, stroke: V("rule"), strokeWidth: 1 }));
  notes.appendChild(svg("text", {
    class: "lbl", x: NX, y: 222, textAnchor: "start", fill: V("muted"), fontSize: "11.5px",
    text: "in one line:",
  }));
  notes.appendChild(svg("text", {
    class: "lbl", x: NX, y: 244, textAnchor: "start", fill: V("ink-strong"), fontSize: "13px",
    text: "√(9 + 16 + 144)  =  13",
  }));
  root.appendChild(notes);

  return plate({
    no: 11,
    title: "Magnitude in 3-D is Pythagoras, twice",
    tag: "reference",
    label: "Three-dimensional vector magnitude",
    stage: root,
    caption:
      "The dashed base diagonal is the 3-4-5 triangle from Part 1, lying flat. The " +
      "vector itself is then the hypotenuse of a 5-12-13 triangle standing on it. " +
      "<b>The three-dimensional formula is not a new theorem</b> — it is Pythagoras " +
      "applied twice, which is why the squares simply pile up under one radical.",
  });
}

/* ==========================================================================
   Plate 12 — dot and cross, one knob
   ========================================================================== */

function dotCross() {
  const p = new Plot({
    w: 500, h: 380, xr: [-1.5, 6.5], yr: [-3.2, 4.6],
    pad: { l: 30, r: 22, t: 16, b: 28 },
    label: "Two vectors from the origin. A blue bar along the first shows the " +
           "projection of the second onto it — the dot product. The shaded " +
           "parallelogram they span is the magnitude of the cross product.",
  });
  p.equalize();
  p.grid({ xStep: 1, yStep: 1 });
  p.axes({ xStep: 2, yStep: 2, xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)) });

  const AX = 4, AY = 0, BL = 3;

  const para = p.polygon([[0, 0], [0, 0], [0, 0], [0, 0]], { fill: "q-r-soft", stroke: "q-r", width: 1, dash: "4 3" });
  const projBar = p.line(0, 0, 0, 0, { color: "q-x", width: 7, cap: "butt" });
  const drop = p.line(0, 0, 0, 0, { color: "q-x", width: 1, dash: "3 3" });
  p.vector(0, 0, AX, AY, { color: "ink", width: 2.5 });
  p.text(AX, AY, "A", { color: "ink", size: 14, italic: true, dx: 6, dy: 20, anchor: "start" });
  const bArrow = p.vector(0, 0, 0, 0, { color: "q-y", width: 2.5 });
  const bLab = p.text(0, 0, "B", { color: "q-y", size: 14, italic: true, bg: true });
  const arc = p.angleArc(0, 0, 0, 0.01, 34, { color: "muted", fill: null, label: null });

  const rdAng = readout({ key: "angle θ", value: "60°" });
  const rdDot = readout({ key: "A · B", value: "6.00", tone: "x" });
  const rdCross = readout({ key: "|A × B|", value: "10.39", tone: "r" });
  const rdSum = readout({ key: "reading", value: "dot = projection × |A| · cross = area" });
  rdSum.root.classList.add("wide");

  function draw(deg) {
    const t = (deg * Math.PI) / 180;
    const bx = BL * Math.cos(t), by = BL * Math.sin(t);
    bArrow.setAttribute("x2", p.x(bx)); bArrow.setAttribute("y2", p.y(by));
    for (const n of bLab.childNodes) {
      n.setAttribute("x", p.x(bx) + (bx >= 0 ? 10 : -10));
      n.setAttribute("y", p.y(by) + (by >= 0 ? -8 : 20));
      n.setAttribute("text-anchor", bx >= 0 ? "start" : "end");
    }

    // projection of B onto A (A lies along +x, so the projection is just bx)
    projBar.setAttribute("x1", p.x(0)); projBar.setAttribute("y1", p.y(-0.42));
    projBar.setAttribute("x2", p.x(bx)); projBar.setAttribute("y2", p.y(-0.42));
    projBar.style.opacity = Math.abs(bx) < 0.02 ? 0 : 1;
    drop.setAttribute("x1", p.x(bx)); drop.setAttribute("y1", p.y(by));
    drop.setAttribute("x2", p.x(bx)); drop.setAttribute("y2", p.y(-0.42));

    para.setAttribute("d",
      `M ${p.x(0)} ${p.y(0)} L ${p.x(AX)} ${p.y(AY)} L ${p.x(AX + bx)} ${p.y(AY + by)} L ${p.x(bx)} ${p.y(by)} Z`);

    const steps = Math.max(6, Math.round(Math.abs(t) * 30));
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * t;
      pts.push(`${(p.x(0) + 34 * Math.cos(a)).toFixed(2)} ${(p.y(0) - 34 * Math.sin(a)).toFixed(2)}`);
    }
    arc.firstChild.setAttribute("d", "M " + pts.join(" L "));

    const dot = AX * bx + AY * by;
    const cross = Math.abs(AX * by - AY * bx);
    rdAng.set(degv(deg, 0));
    rdDot.set(fixed(dot, 2));
    rdCross.set(fixed(cross, 2));
    rdSum.set(
      Math.abs(deg - 90) < 1.5 ? "perpendicular — dot is zero, cross is largest"
      : Math.abs(deg) < 1.5 ? "parallel — cross is zero, dot is largest"
      : Math.abs(deg - 180) < 1.5 ? "opposite — cross is zero, dot is most negative"
      : deg < 90 ? "mostly agreeing — dot large, cross small"
      : "mostly disagreeing — dot small or negative, cross large"
    );
  }

  const k = knob({
    label: "angle of B from A", min: 0, max: 180, step: 1, value: 60,
    format: (v) => `${num(v, 0)}°`,
    onInput: draw,
  });
  draw(60);

  return plate({
    no: 12,
    title: "Dot and cross trade off",
    tag: "interactive",
    label: "Dot and cross products",
    stage: p.root,
    controls: el("div.plate-controls", null, k.root),
    readouts: readouts(rdAng, rdDot, rdCross, rdSum),
    caption:
      "Sweep to 90°: the blue projection bar vanishes and the parallelogram is at " +
      "its fattest. Sweep to 0°: the bar is longest and the parallelogram collapses " +
      "to a line with no area. <b>The two products are asking opposite questions, " +
      "and they are never both large.</b> Past 90° the dot product goes negative — " +
      "the vectors now oppose each other.",
  });
}

/* ==========================================================================
   Plate 13 — the gradient is perpendicular to the level curve
   ========================================================================== */

function gradient() {
  const f = (x, y) => x * x + y * y;
  const p = new Plot({
    w: 480, h: 430, xr: [-7.5, 7.5], yr: [-7.5, 7.5],
    pad: { l: 30, r: 22, t: 16, b: 28 },
    label: "Contour circles of the scalar field x squared plus y squared. At a " +
           "movable point, the gradient arrow points directly away from the origin " +
           "and the tangent to the contour crosses it at a right angle.",
  });
  p.equalize();
  p.grid({ xStep: 1, yStep: 1 });
  contours(p, f, [4, 9, 16, 25, 36, 49], { color: "rule", width: 1.25 });
  for (const L of [4, 16, 36]) {
    p.text(0, Math.sqrt(L), `f = ${L}`, { color: "faint", size: 10, dy: -4, bg: true });
  }
  p.axes({ xStep: 2, yStep: 2, xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)) });

  const level = p.param((t) => [5 * Math.cos(t), 5 * Math.sin(t)], [0, 2 * Math.PI],
    { color: "q-y", width: 2 });
  const tangent = p.line(0, 0, 0, 0, { color: "q-y", width: 2, dash: "5 4" });
  const grad = p.vector(0, 0, 0, 0, { color: "q-r", width: 3 });
  const sq = p.rightAngle(3, 4, 0, Math.PI / 2, 11, { color: "muted" });
  const pt = p.dot(3, 4, { color: "ink", r: 5.5 });
  const gLab = p.text(0, 0, "∇f", { color: "q-r", size: 14, bg: true, anchor: "start" });

  const rdPt = readout({ key: "point", value: "(3, 4)" });
  const rdGrad = readout({ key: "∇f", value: "6i + 8j", tone: "r" });
  const rdMag = readout({ key: "|∇f| steepness", value: "10.00", tone: "r" });
  const rdPerp = readout({ key: "∇f · tangent", value: "0.000" });
  const rdLevel = readout({ key: "contour", value: "f = 25", tone: "y" });

  function draw(deg) {
    const t = (deg * Math.PI) / 180;
    const a = 5 * Math.cos(t), b = 5 * Math.sin(t);
    const gx = 2 * a, gy = 2 * b;
    const gm = Math.hypot(gx, gy);
    const ux = gx / gm, uy = gy / gm;

    grad.setAttribute("x1", p.x(a)); grad.setAttribute("y1", p.y(b));
    grad.setAttribute("x2", p.x(a + ux * 2.3)); grad.setAttribute("y2", p.y(b + uy * 2.3));
    for (const c of pt.childNodes) { c.setAttribute("cx", p.x(a)); c.setAttribute("cy", p.y(b)); }
    for (const n of gLab.childNodes) {
      n.setAttribute("x", p.x(a + ux * 2.9) + 4);
      n.setAttribute("y", p.y(b + uy * 2.9) + 4);
    }

    // the contour's tangent is the gradient turned a quarter turn
    const tx = -uy, ty = ux, L = 3.4;
    tangent.setAttribute("x1", p.x(a - tx * L)); tangent.setAttribute("y1", p.y(b - ty * L));
    tangent.setAttribute("x2", p.x(a + tx * L)); tangent.setAttribute("y2", p.y(b + ty * L));

    sq.setAttribute("d", raPath(p.x(a), p.y(b),
      Math.atan2(uy, ux), Math.atan2(ty, tx), 11));

    rdPt.set(`(${fixed(a, 2)}, ${fixed(b, 2)})`);
    rdGrad.set(`${fixed(gx, 2)}i + ${fixed(gy, 2)}j`.replace("+ −", "− "));
    rdMag.set(fixed(gm, 2));
    rdPerp.set(fixed(gx * tx + gy * ty, 3));
    rdLevel.set("f = 25");
  }

  const k = knob({
    label: "position on the contour", min: 0, max: 360, step: 0.5, value: 53.13,
    format: (v) => `${num(v, 1)}°`,
    onInput: draw,
  });

  draggable(p.root, ({ x, y }) => {
    const th = Math.atan2(p.uy(y), p.ux(x));
    k.set(((th * 180) / Math.PI + 360) % 360, false);
    draw((th * 180) / Math.PI);
  });

  draw(53.13);

  return plate({
    no: 13,
    title: "The gradient points straight uphill",
    tag: "interactive",
    label: "Gradient and level curve",
    stage: p.root,
    controls: el("div.plate-controls", null, k.root,
      el("p.gloss", { text: "Or drag anywhere on the plate.", style: { flex: "0 1 10rem" } })),
    readouts: readouts(rdPt, rdGrad, rdMag, rdPerp, rdLevel),
    caption:
      "The dot product of the gradient with the contour's tangent stays at 0.000 " +
      "everywhere, which is the definition of perpendicular. Compare this with " +
      "Plate 9 — <b>same picture, same right angle, and neither one was really " +
      "about circles.</b> The gradient is perpendicular to the level curve of every " +
      "scalar field there is.",
  });
}

function raPath(px, py, d1, d2, size) {
  const u = [Math.cos(d1) * size, -Math.sin(d1) * size];
  const v = [Math.cos(d2) * size, -Math.sin(d2) * size];
  return `M ${px + u[0]} ${py + u[1]} L ${px + u[0] + v[0]} ${py + u[1] + v[1]} L ${px + v[0]} ${py + v[1]}`;
}

/* --- registration ---------------------------------------------------------- */

register("vector3d", { no: 11, build: vector3d });
register("dotCross", { no: 12, build: dotCross });
register("gradient", { no: 13, build: gradient });
