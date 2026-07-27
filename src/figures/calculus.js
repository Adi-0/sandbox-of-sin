/* ==========================================================================
   figures/calculus.js — Plates 17 to 20.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot, contours } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;

/* ==========================================================================
   Plate 17 — the secant becomes the tangent
   One knob: h. Lesson: the limit is a number the slope settles on, and here
   it settles on the same −3/4 Part 3 got from geometry.
   ========================================================================== */

function secantTangent() {
  const f = (x) => Math.sqrt(Math.max(0, 25 - x * x));
  const X0 = 3, Y0 = 4;

  const p = new Plot({
    w: 500, h: 400, xr: [-0.6, 6.2], yr: [-0.4, 6.2],
    pad: { l: 34, r: 24, t: 18, b: 32 },
    label: "The upper half of the circle of radius 5. A secant line joins the point " +
           "at x = 3 to a second point h further along. As h shrinks the secant " +
           "settles onto the tangent, whose slope is minus three quarters.",
  });
  p.equalize();
  p.grid({ xStep: 1, yStep: 1 });
  p.axes({ xStep: 1, yStep: 1, xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)) });
  p.curve(f, { color: "q-y", width: 2.5 });
  p.text(0.9, f(0.9), "y = √(25 − x²)", { color: "q-y", size: 11.5, dx: 8, dy: 16, anchor: "start", bg: true });

  // the true tangent, drawn faintly as the target the secant is approaching
  const mT = -X0 / Y0;
  p.line(X0 - 2.6, Y0 - 2.6 * mT, X0 + 2.6, Y0 + 2.6 * mT,
    { color: "muted", width: 1.5, dash: "6 4" });

  const secant = p.line(0, 0, 0, 0, { color: "q-r", width: 2.5 });
  const rise = p.line(0, 0, 0, 0, { color: "q-y", width: 2.5 });
  const run = p.line(0, 0, 0, 0, { color: "q-x", width: 2.5 });
  const p2 = p.dot(X0, Y0, { color: "muted", r: 5 });
  p.dot(X0, Y0, { color: "ink", r: 5.5 });
  p.text(X0, Y0, "(3, 4)", { color: "ink", size: 12, dx: -10, dy: -12, anchor: "end", bg: true });

  const rdH = readout({ key: "h", value: "1.800" });
  const rdRun = readout({ key: "run", value: "1.800", tone: "x" });
  const rdRise = readout({ key: "rise", value: "−1.800", tone: "y" });
  const rdSlope = readout({ key: "secant slope", value: "−1.000", tone: "r" });
  const rdLimit = readout({ key: "the limit it is heading for", value: "−0.750" });
  rdLimit.root.classList.add("wide");

  function draw(h) {
    const x1 = X0 + h, y1 = f(x1);
    const m = (y1 - Y0) / h;

    // extend the secant enough to read as a direction, but not so far that a
    // steep one shoots off the plate
    const L = Math.min(3.2, 2.6 / Math.max(1, Math.abs(m)));
    secant.setAttribute("x1", p.x(X0 - L)); secant.setAttribute("y1", p.y(Y0 - L * m));
    secant.setAttribute("x2", p.x(X0 + L)); secant.setAttribute("y2", p.y(Y0 + L * m));

    run.setAttribute("x1", p.x(X0)); run.setAttribute("y1", p.y(Y0));
    run.setAttribute("x2", p.x(x1)); run.setAttribute("y2", p.y(Y0));
    rise.setAttribute("x1", p.x(x1)); rise.setAttribute("y1", p.y(Y0));
    rise.setAttribute("x2", p.x(x1)); rise.setAttribute("y2", p.y(y1));
    const visible = h > 0.12;
    run.style.opacity = visible ? 1 : 0;
    rise.style.opacity = visible ? 1 : 0;

    for (const c of p2.childNodes) { c.setAttribute("cx", p.x(x1)); c.setAttribute("cy", p.y(y1)); }

    rdH.set(fixed(h, 3));
    rdRun.set(fixed(h, 3));
    rdRise.set(fixed(y1 - Y0, 3));
    rdSlope.set(fixed(m, 3));
    rdLimit.set(h < 0.05
      ? "−0.750 — and the secant is now sitting on the dashed tangent"
      : `−0.750 — currently off by ${fixed(Math.abs(m - mT), 3)}`);
  }

  const k = knob({
    label: "h — how far the second point sits along", min: 0.01, max: 1.8, step: 0.01, value: 1.8,
    format: (v) => fixed(v, 2),
    onInput: draw,
  });
  draw(1.8);

  return plate({
    no: 17,
    title: "A secant, squeezed into a tangent",
    tag: "interactive",
    label: "Secant approaching a tangent",
    stage: p.root,
    controls: el("div.plate-controls", null, k.root),
    readouts: readouts(rdH, rdRun, rdRise, rdSlope, rdLimit),
    caption:
      "Rise and run both shrink towards nothing, but their <em>ratio</em> does not — " +
      "it settles on −0.750. <b>That is what a limit is</b>: not what happens at " +
      "h = 0, where the fraction would be 0/0 and meaningless, but the value the " +
      "ratio approaches on the way there.",
  });
}

/* ==========================================================================
   Plate 18 — accumulation, and the theorem that makes it cheap
   ========================================================================== */

function accumulate() {
  const f = (t) => 2 * t;
  const F = (x) => x * x;

  const p = new Plot({
    w: 560, h: 250, xr: [-0.4, 6.4], yr: [-0.8, 13],
    pad: { l: 40, r: 22, t: 16, b: 30 },
    label: "The straight line y equals 2t with the region under it shaded from " +
           "zero to a movable upper limit. The shaded area is a triangle, and its " +
           "area equals the upper limit squared.",
  });
  p.grid({ xStep: 1, yStep: 2 });
  p.axes({ xStep: 1, yStep: 4, xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)) });
  p.curve(f, { color: "q-y", width: 2.5 });
  p.text(5.4, f(5.4), "f(t) = 2t", { color: "q-y", size: 12, dx: -6, dy: -8, anchor: "end", bg: true });

  const shade = p.polygon([[0, 0], [0, 0], [0, 0]], { fill: "q-r-soft", stroke: "q-r", width: 1.25 });
  const edge = p.line(0, 0, 0, 0, { color: "q-r", width: 2, dash: "4 3" });
  const areaLab = p.text(0, 0, "", { color: "q-r", size: 13, weight: 500, bg: true });

  /* the running total, plotted underneath on its own frame */
  const q = new Plot({
    w: 560, h: 210, xr: [-0.4, 6.4], yr: [-2, 40],
    pad: { l: 40, r: 22, t: 14, b: 30 },
    label: "The running total of that area, plotted against the upper limit. It " +
           "traces the curve x squared, whose derivative is the line above.",
  });
  q.grid({ xStep: 1, yStep: 10 });
  q.axes({ xStep: 1, yStep: 10, xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)) });
  const trace = q.curve(() => NaN, { color: "q-r", width: 2.5 });
  const traceDot = q.dot(0, 0, { color: "q-r", r: 5.5 });
  q.text(5.6, 33, "F(x) = area so far", { color: "q-r", size: 12, anchor: "end", bg: true });

  const rdB = readout({ key: "upper limit b", value: "3.00" });
  const rdGeo = readout({ key: "area, by geometry", value: "9.00", tone: "r" });
  const rdCalc = readout({ key: "area, by F(b) − F(0)", value: "9.00", tone: "r" });
  const rdNote = readout({ key: "the two agree because", value: "F′(x) = 2x = f(x)" });
  rdNote.root.classList.add("wide");

  function draw(b) {
    shade.setAttribute("d",
      `M ${p.x(0)} ${p.y(0)} L ${p.x(b)} ${p.y(0)} L ${p.x(b)} ${p.y(f(b))} Z`);
    edge.setAttribute("x1", p.x(b)); edge.setAttribute("y1", p.y(0));
    edge.setAttribute("x2", p.x(b)); edge.setAttribute("y2", p.y(f(b)));
    for (const n of areaLab.childNodes) {
      n.setAttribute("x", p.x(b * 0.55)); n.setAttribute("y", p.y(f(b) * 0.3));
      n.textContent = b > 0.9 ? fixed(F(b), 2) : "";
    }

    const pts = [];
    for (let i = 0; i <= 160; i++) {
      const x = (i / 160) * b;
      pts.push(`${q.x(x).toFixed(2)} ${q.y(F(x)).toFixed(2)}`);
    }
    trace.setAttribute("d", pts.length > 1 ? "M " + pts.join(" L ") : "");
    for (const c of traceDot.childNodes) { c.setAttribute("cx", q.x(b)); c.setAttribute("cy", q.y(F(b))); }

    rdB.set(fixed(b, 2));
    rdGeo.set(`½ · ${fixed(b, 2)} · ${fixed(2 * b, 2)} = ${fixed(F(b), 2)}`);
    rdCalc.set(`${fixed(b, 2)}² − 0² = ${fixed(F(b), 2)}`);
  }

  const k = knob({
    label: "upper limit b", min: 0, max: 6, step: 0.05, value: 3,
    format: (v) => fixed(v, 2),
    onInput: draw,
  });
  draw(3);

  return plate({
    no: 18,
    title: "Area accumulates; the antiderivative records it",
    tag: "interactive",
    label: "Accumulating area and its running total",
    stage: [p.root, q.root],
    controls: el("div.plate-controls", null, k.root),
    readouts: readouts(rdB, rdGeo, rdCalc, rdNote),
    caption:
      "This curve was chosen so you can check the calculus against something you " +
      "already trust: the shaded region is a triangle, so its area is plainly " +
      "<span class='math'>½ · b · 2b = b²</span>. The antiderivative says " +
      "<span class='math'>b² − 0²</span>. <b>Same answer, and no strips were ever " +
      "added up.</b> The lower curve is the running total — and its slope at every " +
      "point is the height of the curve above it.",
  });
}

/* ==========================================================================
   Plate 19 — critical points
   ========================================================================== */

function critical() {
  const f = (x) => x * x * x - 6 * x * x + 9 * x;
  const df = (x) => 3 * x * x - 12 * x + 9;
  const d2f = (x) => 6 * x - 12;

  const p = new Plot({
    w: 540, h: 300, xr: [-0.6, 4.8], yr: [-3.2, 6.4],
    pad: { l: 38, r: 22, t: 16, b: 26 },
    label: "The cubic x cubed minus six x squared plus nine x, with a movable " +
           "tangent line. The tangent is horizontal at x = 1 and x = 3.",
  });
  p.grid({ xStep: 0.5, yStep: 1 });
  p.axes({ xStep: 1, yStep: 2, xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)) });
  p.curve(f, { color: "q-y", width: 2.5 });

  const tangent = p.line(0, 0, 0, 0, { color: "q-x", width: 2.5 });
  const dot = p.dot(0.5, f(0.5), { color: "ink", r: 5.5 });
  const flag = p.text(0, 0, "", { color: "q-r", size: 12, weight: 500, bg: true });

  /* the derivative, on its own frame directly below */
  const q = new Plot({
    w: 540, h: 200, xr: [-0.6, 4.8], yr: [-4.5, 10],
    pad: { l: 38, r: 22, t: 14, b: 26 },
    label: "The derivative of that cubic. It crosses zero exactly where the " +
           "tangent above is horizontal.",
  });
  q.grid({ xStep: 0.5, yStep: 2 });
  q.axes({ xStep: 1, yStep: 4, xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)) });
  q.curve(df, { color: "q-x", width: 2.5 });
  q.text(4.4, 8.2, "f ′(x)", { color: "q-x", size: 12, anchor: "end", bg: true });
  for (const r of [1, 3]) q.ring(r, 0, { color: "q-r", r: 5, width: 2 });
  const dDot = q.dot(0.5, df(0.5), { color: "ink", r: 5 });
  const dLine = q.line(-0.6, 0, 4.8, 0, { color: "rule", width: 1, dash: "4 4", layer: "grid" });

  const rdX = readout({ key: "x", value: "0.50" });
  const rdF = readout({ key: "f (x)", value: "3.13", tone: "y" });
  const rdD = readout({ key: "f ′(x) · the slope", value: "3.75", tone: "x" });
  const rdD2 = readout({ key: "f ″(x)", value: "−9.00" });
  const rdVerdict = readout({ key: "verdict", value: "not a critical point — the tangent is not level" });
  rdVerdict.root.classList.add("wide");

  function draw(x) {
    // shorten the tangent when it is steep so it stays inside the frame
    const y = f(x), m = df(x), L = Math.min(1.3, 2.6 / Math.max(1.6, Math.abs(m)));
    tangent.setAttribute("x1", p.x(x - L)); tangent.setAttribute("y1", p.y(y - L * m));
    tangent.setAttribute("x2", p.x(x + L)); tangent.setAttribute("y2", p.y(y + L * m));
    for (const c of dot.childNodes) { c.setAttribute("cx", p.x(x)); c.setAttribute("cy", p.y(y)); }
    for (const c of dDot.childNodes) { c.setAttribute("cx", q.x(x)); c.setAttribute("cy", q.y(m)); }

    const crit = Math.abs(m) < 0.16;
    for (const n of flag.childNodes) {
      n.setAttribute("x", p.x(x)); n.setAttribute("y", p.y(y) - 18);
      n.textContent = crit ? (d2f(x) < 0 ? "maximum" : "minimum") : "";
    }

    rdX.set(fixed(x, 2));
    rdF.set(fixed(y, 2));
    rdD.set(fixed(m, 2));
    rdD2.set(fixed(d2f(x), 2));
    rdVerdict.set(crit
      ? (d2f(x) < 0
        ? "critical point — f ″ is negative, so the curve bends downward: a maximum"
        : "critical point — f ″ is positive, so the curve bends upward: a minimum")
      : `not a critical point — the tangent still slopes ${m > 0 ? "up" : "down"}`);
  }

  const k = knob({
    label: "x", min: -0.4, max: 4.6, step: 0.01, value: 0.5,
    format: (v) => fixed(v, 2),
    onInput: draw,
  });

  const jump = scenarios({
    options: [{ id: "1", label: "x = 1" }, { id: "2", label: "x = 2" }, { id: "3", label: "x = 3" }],
    label: "jump to",
    value: "none",
    onChange: (id) => k.set(Number(id)),
  });

  draw(0.5);

  return plate({
    no: 19,
    title: "Where the tangent goes flat",
    tag: "interactive",
    label: "Critical points of a cubic",
    stage: [p.root, q.root],
    controls: el("div.plate-controls", null, k.root, jump.root),
    readouts: readouts(rdX, rdF, rdD, rdD2, rdVerdict),
    caption:
      "Slide to x = 1 and x = 3 and the tangent goes level exactly as the lower " +
      "curve crosses zero — <b>the two circled crossings are the critical points</b>. " +
      "At x = 2 the slope is at its most negative and <span class='math'>f ″</span> " +
      "is zero: an inflection point, where the bend changes direction but nothing " +
      "peaks. Note that on a closed interval the largest value might sit at an " +
      "endpoint instead, which no amount of differentiating will reveal.",
  });
}

/* ==========================================================================
   Plate 20 — partial derivatives are slices
   ========================================================================== */

function partials() {
  const f = (x, y) => 0.5 * x * x + x * y;
  const X0 = 2, Y0 = 1;

  const p = new Plot({
    w: 300, h: 300, xr: [-3.4, 3.4], yr: [-3.4, 3.4],
    pad: { l: 30, r: 16, t: 16, b: 26 },
    label: "Contours of a surface, with a horizontal slice line holding y fixed " +
           "and a vertical one holding x fixed at the marked point.",
  });
  p.equalize();
  contours(p, f, [-6, -4, -2, 0, 2, 4, 6, 9], { color: "rule", width: 1.25 });
  p.axes({ xStep: 2, yStep: 2, xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)) });
  p.line(-3.4, Y0, 3.4, Y0, { color: "q-x", width: 2, dash: "6 3" });
  p.line(X0, -3.4, X0, 3.4, { color: "q-y", width: 2, dash: "6 3" });
  p.dot(X0, Y0, { color: "ink", r: 5 });
  p.text(X0, Y0, "(2, 1)", { color: "ink", size: 11, dx: 10, dy: -8, anchor: "start", bg: true });
  p.text(-3.2, Y0, "y held at 1", { color: "q-x", size: 10.5, dy: -7, anchor: "start", bg: true });
  p.text(X0, -3.1, "x held at 2", { color: "q-y", size: 10.5, dx: 7, anchor: "start", bg: true });

  /* the two profile curves the slices cut out */
  const sx = new Plot({
    w: 300, h: 190, xr: [-3.4, 3.4], yr: [-6, 10],
    pad: { l: 34, r: 16, t: 14, b: 26 },
    label: "The profile along the horizontal slice: f as a function of x with y " +
           "fixed. Its slope at the marked point is the partial derivative with " +
           "respect to x.",
  });
  sx.grid({ xStep: 1, yStep: 4 });
  sx.axes({ xStep: 2, yStep: 4, xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)) });
  sx.curve((x) => f(x, Y0), { color: "q-x", width: 2.5 });
  const mx = X0 + Y0;                                   // ∂f/∂x = x + y
  sx.line(X0 - 1.4, f(X0, Y0) - 1.4 * mx, X0 + 1.4, f(X0, Y0) + 1.4 * mx, { color: "ink", width: 2 });
  sx.dot(X0, f(X0, Y0), { color: "ink", r: 4.5 });
  sx.text(-3.2, 8.4, "slope = ∂f/∂x = 3", { color: "q-x", size: 11, anchor: "start", bg: true });

  const sy = new Plot({
    w: 300, h: 190, xr: [-3.4, 3.4], yr: [-6, 10],
    pad: { l: 34, r: 16, t: 14, b: 26 },
    label: "The profile along the vertical slice: f as a function of y with x " +
           "fixed. Its slope is the partial derivative with respect to y.",
  });
  sy.grid({ xStep: 1, yStep: 4 });
  sy.axes({ xStep: 2, yStep: 4, xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)) });
  sy.curve((y) => f(X0, y), { color: "q-y", width: 2.5 });
  const my = X0;                                        // ∂f/∂y = x
  sy.line(Y0 - 1.4, f(X0, Y0) - 1.4 * my, Y0 + 1.4, f(X0, Y0) + 1.4 * my, { color: "ink", width: 2 });
  sy.dot(Y0, f(X0, Y0), { color: "ink", r: 4.5 });
  sy.text(-3.2, 8.4, "slope = ∂f/∂y = 2", { color: "q-y", size: 11, anchor: "start", bg: true });

  const row = el("div", {
    style: {
      display: "grid", gap: "var(--s3)", width: "100%",
      gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))", alignItems: "start",
    },
  }, p.root, el("div", null, sx.root, sy.root));

  return plate({
    no: 20,
    title: "A partial derivative is a slice",
    tag: "reference",
    label: "Partial derivatives as slices through a surface",
    stage: row,
    caption:
      "For <span class='math'>f = ½x² + xy</span> at (2, 1): holding y still leaves " +
      "a curve in x whose slope is <span class='math'>x + y = 3</span>; holding x " +
      "still leaves a straight line in y of slope <span class='math'>x = 2</span>. " +
      "<b>Nothing new is being differentiated</b> — the other variable has simply " +
      "become a constant. Collect the two answers into a vector and you have the " +
      "gradient from Part 4.",
  });
}

/* --- registration ---------------------------------------------------------- */

register("secantTangent", { no: 17, build: secantTangent });
register("accumulate", { no: 18, build: accumulate });
register("critical", { no: 19, build: critical });
register("partials", { no: 20, build: partials });
