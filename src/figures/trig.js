/* ==========================================================================
   figures/trig.js — Plates 2 to 5.

   Semantic colour, held constant across the whole guide:
     q-x  horizontal component / cosine / the input
     q-y  vertical component / sine / the output
     q-r  magnitude / hypotenuse / the result
   ========================================================================== */

import { svg, el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed, degv } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;

/* ==========================================================================
   Plate 2 — the logarithmic ruler
   One knob: the multiplier. Lesson: multiplying slides you along by a length,
   and lengths add.
   ========================================================================== */

function logRuler() {
  const W = 660, H = 210;
  const L = 46, R = W - 34, BASE = 150;
  const START = 4;                       // default: both bars visible, 4 × 3 = 12
  const LO = 1, HI = 100;
  const FIXED = 3;                       // the second factor, held still

  const px = (v) => L + (Math.log10(v) - Math.log10(LO)) / (Math.log10(HI) - Math.log10(LO)) * (R - L);

  const root = svg("svg", {
    viewBox: `0 0 ${W} ${H}`, role: "img",
    "aria-label":
      "A logarithmic ruler from 1 to 100. A blue bar spans from 1 to the chosen " +
      "number and a brass bar continues from there by the length that represents " +
      "3. The two lengths added together land exactly on the product.",
    style: { display: "block", width: "100%", height: "auto" },
  });

  /* --- the ruler ---------------------------------------------------------- */
  const ruler = svg("g");
  ruler.appendChild(svg("line", { x1: L, y1: BASE, x2: R, y2: BASE, stroke: V("ink"), strokeWidth: 1.25 }));
  for (let dec = 0; dec <= 2; dec++) {
    for (let d = 1; d <= 9; d++) {
      const v = d * Math.pow(10, dec);
      if (v > HI) break;
      const major = d === 1 || (dec < 2 && d === 5);
      ruler.appendChild(svg("line", {
        x1: px(v), y1: BASE, x2: px(v), y2: BASE + (major ? 9 : 5),
        stroke: V(major ? "ink" : "rule"), strokeWidth: 1,
      }));
      if (major || d === 2 || d === 3) {
        ruler.appendChild(svg("text", {
          class: "lbl", x: px(v), y: BASE + 22, textAnchor: "middle",
          fill: V(major ? "muted" : "faint"), fontSize: major ? "11px" : "9.5px", text: v,
        }));
      }
    }
  }
  ruler.appendChild(svg("text", {
    class: "lbl", x: L, y: BASE + 44, textAnchor: "start", fill: V("faint"),
    fontSize: "10px", text: "every decade is the same width — that is what makes it a log scale",
  }));
  root.appendChild(ruler);

  /* --- the two bars, sitting just above the ruler -------------------------- */
  const TOP = BASE - 26;
  const tickA = svg("line", { y1: TOP, y2: BASE, stroke: V("q-x"), strokeWidth: 1, strokeDasharray: "2 2" });
  const barA = svg("rect", { y: TOP, height: 14, rx: 2, fill: V("q-x") });
  const barB = svg("rect", { y: TOP, height: 14, rx: 2, fill: V("q-y") });
  const labA = svg("text", { class: "lbl", y: TOP - 7, textAnchor: "middle", fill: V("q-x"), fontSize: "11px" });
  const labB = svg("text", { class: "lbl", y: TOP - 7, textAnchor: "middle", fill: V("q-y"), fontSize: "11px" });
  const drop = svg("line", { y1: TOP - 20, y2: BASE, stroke: V("q-r"), strokeWidth: 1.5, strokeDasharray: "3 3" });
  const dot = svg("circle", { cy: BASE, r: 5, fill: V("q-r") });
  const prod = svg("text", { class: "lbl", y: TOP - 26, textAnchor: "middle", fill: V("q-r"), fontSize: "13px", fontWeight: 500 });
  root.append(tickA, barA, barB, labA, labB, drop, dot, prod);

  /* --- the sum, written out ------------------------------------------------ */
  const eqn = svg("text", { class: "lbl", x: W / 2, y: 26, textAnchor: "middle", fill: V("muted"), fontSize: "12px" });
  root.appendChild(eqn);

  const rdA = readout({ key: "a", value: "4", tone: "x" });
  const rdB = readout({ key: "×  b", value: "3", tone: "y" });
  const rdP = readout({ key: "=  a × b", value: "12", tone: "r" });
  const rdL = readout({ key: "log(a × b)", value: "1.079" });

  function draw(a) {
    const p = a * FIXED;
    const x0 = px(LO), x1 = px(a), x2 = px(p);
    barA.setAttribute("x", x0);
    barA.setAttribute("width", Math.max(0, x1 - x0));
    barB.setAttribute("x", x1 + 2);
    barB.setAttribute("width", Math.max(0, x2 - x1 - 2));
    tickA.setAttribute("x1", x1); tickA.setAttribute("x2", x1);
    tickA.style.opacity = a > 1.05 ? 1 : 0;
    labA.setAttribute("x", (x0 + x1) / 2);
    labA.textContent = a > 1.6 ? `log ${num(a, 2)} = ${fixed(Math.log10(a), 3)}` : "";
    labB.setAttribute("x", (x1 + x2) / 2);
    labB.textContent = "log 3 = 0.477";
    drop.setAttribute("x1", x2); drop.setAttribute("x2", x2);
    dot.setAttribute("cx", x2);
    prod.setAttribute("x", x2);
    prod.textContent = num(p, 2);
    eqn.textContent =
      `${fixed(Math.log10(a), 3)} + 0.477 = ${fixed(Math.log10(p), 3)}   →   ` +
      `${num(a, 2)} × 3 = ${num(p, 2)}`;

    rdA.set(num(a, 2));
    rdP.set(num(p, 2));
    rdL.set(fixed(Math.log10(a) + Math.log10(FIXED), 3));
  }

  const k = knob({
    label: "a", min: 1, max: 30, step: 0.1, value: START,
    format: (v) => num(v, 1),
    onInput: draw,
  });
  draw(START);

  return plate({
    no: 2,
    title: "Multiplying is adding lengths",
    tag: "interactive",
    label: "Logarithmic ruler",
    stage: root,
    controls: el("div.plate-controls", null, k.root),
    readouts: readouts(rdA, rdB, rdP, rdL),
    caption:
      "Slide <b>a</b> and watch the brass bar keep its length exactly. It has to: it " +
      "represents multiplying by 3, and on a log scale that is always the same " +
      "distance no matter where you start. That fixed distance is what a slide rule " +
      "was, what a decibel is, and why an amplifier chain adds instead of multiplies.",
  });
}

/* ==========================================================================
   Plate 3 — the unit circle
   One knob: the angle. Lesson: sine and cosine are two lengths, not two
   functions you must separately remember.
   ========================================================================== */

function unitCircle() {
  const p = new Plot({
    w: 470, h: 400, xr: [-1.25, 1.25], yr: [-1.25, 1.25],
    pad: { l: 36, r: 26, t: 18, b: 34 },
    label: "Unit circle with the radius drawn to a movable point. The horizontal " +
           "leg is the cosine, the vertical leg is the sine, and the radius is always 1.",
  });
  p.equalize();
  p.grid({ xStep: 0.5, yStep: 0.5 });
  p.axes({ xStep: 0.5, yStep: 0.5, xFmt: (v) => (v === 0 ? "" : num(v, 1)), yFmt: (v) => (v === 0 ? "" : num(v, 1)) });
  p.param((t) => [Math.cos(t), Math.sin(t)], [0, 2 * Math.PI], { color: "rule", width: 1.5 });

  const cosLeg = p.line(0, 0, 1, 0, { color: "q-x", width: 4, layer: "curve" });
  const sinLeg = p.line(1, 0, 1, 0, { color: "q-y", width: 4, layer: "curve" });
  const radius = p.vector(0, 0, 1, 0, { color: "q-r", width: 2.25 });
  const point = p.dot(1, 0, { color: "q-r", r: 5 });
  const arc = p.angleArc(0, 0, 0, 0.01, 30, { color: "muted", fill: "q-r-soft", label: null });
  // the cosine label sits below the axis numbers, not on top of them
  const cosLab = p.text(0.5, 0, "cos θ", { color: "q-x", size: 12.5, italic: true, bg: true, dy: 31 });
  const sinLab = p.text(1.08, 0.5, "sin θ", { color: "q-y", size: 12.5, italic: true, bg: true });
  const rLab = p.text(0.4, 0.35, "r = 1", { color: "q-r", size: 12.5, italic: true, bg: true });
  const sq = p.rightAngle(1, 0, Math.PI, Math.PI / 2, 9, { color: "faint" });

  const rdT = readout({ key: "θ", value: "36.87°" });
  const rdC = readout({ key: "cos θ", value: "0.800", tone: "x" });
  const rdS = readout({ key: "sin θ", value: "0.600", tone: "y" });
  const rdTan = readout({ key: "tan θ", value: "0.750" });
  const rdP = readout({ key: "cos²θ + sin²θ", value: "1.000", tone: "r" });

  function draw(degIn) {
    const t = (degIn * Math.PI) / 180;
    const c = Math.cos(t), s = Math.sin(t);

    cosLeg.setAttribute("x2", p.x(c));
    sinLeg.setAttribute("x1", p.x(c));
    sinLeg.setAttribute("y1", p.y(0));
    sinLeg.setAttribute("x2", p.x(c));
    sinLeg.setAttribute("y2", p.y(s));
    radius.setAttribute("x2", p.x(c));
    radius.setAttribute("y2", p.y(s));
    point.firstChild.setAttribute("cx", p.x(c));
    point.firstChild.setAttribute("cy", p.y(s));
    point.lastChild.setAttribute("cx", p.x(c));
    point.lastChild.setAttribute("cy", p.y(s));

    // the wedge is redrawn each frame; it is the only element whose shape changes
    const steps = Math.max(6, Math.round(Math.abs(t) * 30));
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * t;
      pts.push(`${(p.x(0) + 30 * Math.cos(a)).toFixed(2)} ${(p.y(0) - 30 * Math.sin(a)).toFixed(2)}`);
    }
    arc.firstChild.setAttribute("d", `M ${p.x(0)} ${p.y(0)} L ` + pts.join(" L ") + " Z");

    const lx = (x, y, node) => { node.setAttribute("x", p.x(x)); node.setAttribute("y", p.y(y)); };
    for (const node of cosLab.childNodes) { lx(c / 2, 0, node); node.setAttribute("y", p.y(0) + 31); }
    for (const node of sinLab.childNodes) lx(c + (c >= 0 ? 0.1 : -0.1), s / 2, node);
    for (const node of rLab.childNodes) lx((c / 2) * 0.75 - 0.06 * Math.sign(s || 1), (s / 2) * 0.75 + 0.11, node);
    for (const node of sinLab.childNodes) node.setAttribute("text-anchor", c >= 0 ? "start" : "end");

    // the little square sits at the foot of the vertical leg, opening back
    // towards the origin and up towards the point
    sq.style.opacity = Math.abs(c) < 0.12 || Math.abs(s) < 0.06 ? 0 : 1;
    const ux = c >= 0 ? Math.PI : 0;
    const uy = s >= 0 ? Math.PI / 2 : -Math.PI / 2;
    sq.setAttribute("d", rightAnglePath(p.x(c), p.y(0), ux, uy, 9));

    rdT.set(degv(degIn, 2));
    rdC.set(fixed(c, 3));
    rdS.set(fixed(s, 3));
    rdTan.set(Math.abs(c) < 1e-6 ? "undefined" : fixed(s / c, 3));
    rdP.set(fixed(c * c + s * s, 3));
  }

  const k = knob({
    label: "angle θ", min: 0, max: 360, step: 0.01, value: 36.87,
    format: (v) => `${num(v, 2)}°`,
    onInput: draw,
  });

  const jump = scenarios({
    options: [
      { id: "36.87", label: "36.87° (the cast)" },
      { id: "30", label: "30°" }, { id: "45", label: "45°" },
      { id: "90", label: "90°" }, { id: "210", label: "210°" },
    ],
    value: "36.87",
    onChange: (id) => k.set(Number(id)),
  });

  draw(36.87);

  return plate({
    no: 3,
    title: "Sine and cosine are two lengths",
    tag: "interactive",
    label: "Unit circle",
    stage: p.root,
    controls: el("div.plate-controls", null, k.root, jump.root),
    readouts: readouts(rdT, rdC, rdS, rdTan, rdP),
    caption:
      "The last readout never moves off 1.000, at any angle — that is " +
      "<span class='math'>sin²θ + cos²θ = 1</span> being Pythagoras on a triangle " +
      "whose hypotenuse is fixed at 1. Push θ past 90° and watch cosine go negative " +
      "while sine stays positive: <b>the signs are not a rule to memorise, they are " +
      "just which side of the axes the point is on.</b>",
  });
}

function rightAnglePath(px, py, d1, d2, size) {
  const u = [Math.cos(d1) * size, -Math.sin(d1) * size];
  const v = [Math.cos(d2) * size, -Math.sin(d2) * size];
  return `M ${px + u[0]} ${py + u[1]} L ${px + u[0] + v[0]} ${py + u[1] + v[1]} L ${px + v[0]} ${py + v[1]}`;
}

/* ==========================================================================
   Plate 4 — the cast, drawn once, labelled generously
   ========================================================================== */

function triangle345() {
  const p = new Plot({
    w: 560, h: 355, xr: [-0.9, 6.6], yr: [-0.8, 4.9],
    pad: { l: 32, r: 24, t: 18, b: 30 },
    label: "The 3-4-5 right triangle with vertices at the origin, (3,0) and (3,4). " +
           "The horizontal leg is 3, the vertical leg is 4, the hypotenuse is 5. " +
           "The angle at the origin is 36.87 degrees and the angle at the top is 53.13 degrees.",
  });
  p.equalize();
  p.grid({ xStep: 1, yStep: 1 });
  p.axes({ xStep: 1, yStep: 1, xFmt: (v) => num(v, 0), yFmt: (v) => num(v, 0) });

  p.polygon([[0, 0], [3, 0], [3, 4]], { fill: "q-r-soft", stroke: null });
  p.line(0, 0, 3, 0, { color: "q-x", width: 4 });
  p.line(3, 0, 3, 4, { color: "q-y", width: 4 });
  p.line(0, 0, 3, 4, { color: "q-r", width: 3 });
  p.rightAngle(3, 0, Math.PI, Math.PI / 2, 12, { color: "muted" });

  p.text(1.5, 0, "adjacent = 3", { color: "q-x", size: 13, weight: 500, dy: 32, bg: true });
  p.text(3.18, 2, "opposite = 4", { color: "q-y", size: 13, weight: 500, anchor: "start" });
  p.text(1.05, 2.05, "hypotenuse = 5", { color: "q-r", size: 13, weight: 500, anchor: "middle", bg: true });

  p.angleArc(0, 0, 0, Math.atan2(4, 3), 42, { color: "muted", fill: "q-r-soft", label: "θ = 36.87°" });
  p.angleArc(3, 4, Math.atan2(-4, -3), -Math.PI / 2, 30, { color: "faint" });
  p.text(3, 4, "53.13°", { color: "muted", size: 11.5, dx: -30, dy: 30, view: false, anchor: "middle", bg: true });

  p.dot(3, 4, { color: "ink", r: 4.5 });
  p.callout(3, 4, "(3, 4)", { dx: 30, dy: -22, color: "ink" });

  p.text(4.55, 1.5, "sin θ = 4/5 = 0.6", { color: "q-y", size: 12, anchor: "start" });
  p.text(4.55, 1.05, "cos θ = 3/5 = 0.8", { color: "q-x", size: 12, anchor: "start" });
  p.text(4.55, 0.6, "tan θ = 4/3 = 1.33", { color: "muted", size: 12, anchor: "start" });

  return plate({
    no: 4,
    title: "The 3-4-5 triangle — the recurring cast",
    tag: "reference",
    label: "The 3-4-5 right triangle",
    stage: p.root,
    caption:
      "Every number here is exact, which is the whole point of choosing this " +
      "triangle: no decimals accumulate and no rounding hides a mistake. Watch for " +
      "this shape in Part 2 as the complex number <span class='math'>3 + 4j</span>, " +
      "in Part 4 as a vector, and in Part 7 as a pair of roots. <b>Same object, " +
      "eight disguises.</b>",
  });
}

/* ==========================================================================
   Plate 5 — which law applies
   One knob: a scenario button. Lesson: the choice depends only on whether a
   known side is paired with the angle opposite it.
   ========================================================================== */

const CASES = {
  SAS: {
    label: "SAS", known: { sides: ["a", "b"], angles: ["C"] },
    law: "Law of cosines",
    why: "The known angle sits <b>between</b> the two known sides, so nothing is paired " +
         "with the angle opposite it. Cosines is the only one that can start.",
  },
  SSS: {
    label: "SSS", known: { sides: ["a", "b", "c"], angles: [] },
    law: "Law of cosines",
    why: "No angles at all. Rearrange cosines to <span class='math'>cos C = (a² + b² − c²)/2ab</span> " +
         "and it hands you one.",
  },
  ASA: {
    label: "ASA", known: { sides: ["c"], angles: ["A", "B"] },
    law: "Law of sines",
    why: "Two angles give you the third for free (they sum to 180°), and then side " +
         "<span class='math'>c</span> is paired with the angle <span class='math'>C</span> opposite it.",
  },
  AAS: {
    label: "AAS", known: { sides: ["a"], angles: ["A", "B"] },
    law: "Law of sines",
    why: "Side <span class='math'>a</span> is already paired with angle " +
         "<span class='math'>A</span> opposite it. That pairing is the entire test.",
  },
  SSA: {
    label: "SSA", known: { sides: ["a", "b"], angles: ["A"] },
    law: "Law of sines — carefully",
    why: "A pairing exists, so sines works, but this is the <b>ambiguous case</b>: two " +
         "different triangles can fit the same data. Check whether the second solution " +
         "is geometrically possible before you answer.",
  },
};

function triangleLaws() {
  // one fixed triangle; only the highlighting changes
  const A = [0.4, 0.35], B = [5.4, 0.35], C = [3.6, 3.5];
  const p = new Plot({
    w: 560, h: 300, xr: [0, 6], yr: [-0.35, 4.2],
    pad: { l: 26, r: 26, t: 16, b: 20 },
    label: "A triangle with vertices A, B and C. Known sides and angles are drawn " +
           "solid; unknown ones are faint. The readout names which law applies.",
  });
  p.equalize();

  const mid = (u, v) => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2];
  const sides = {
    c: { from: A, to: B, lab: mid(A, B), dy: 20 },   // side c is opposite C
    a: { from: B, to: C, lab: mid(B, C), dy: -6, dx: 16 },
    b: { from: A, to: C, lab: mid(A, C), dy: -6, dx: -16 },
  };

  const sideEls = {}, sideLabs = {}, angEls = {}, angLabs = {};
  for (const [name, s] of Object.entries(sides)) {
    sideEls[name] = p.line(s.from[0], s.from[1], s.to[0], s.to[1], { color: "rule", width: 3 });
    sideLabs[name] = p.text(s.lab[0], s.lab[1], name, {
      color: "faint", size: 14, italic: true, dx: s.dx || 0, dy: s.dy || 0, bg: true,
    });
  }

  const verts = { A: { pt: A, a0: 0, a1: Math.atan2(C[1] - A[1], C[0] - A[0]) },
                  B: { pt: B, a0: Math.PI, a1: Math.PI + Math.atan2(C[1] - B[1], C[0] - B[0]) - Math.PI },
                  C: { pt: C, a0: Math.atan2(A[1] - C[1], A[0] - C[0]), a1: Math.atan2(B[1] - C[1], B[0] - C[0]) } };

  for (const [name, v] of Object.entries(verts)) {
    // built as a wedge (vertex included) so toggling the fill below marks it
    // "known" without rebuilding the path
    angEls[name] = p.angleArc(v.pt[0], v.pt[1], Math.min(v.a0, v.a1), Math.max(v.a0, v.a1), 30,
      { color: "rule", width: 2, fill: "q-x-soft" });
    const bis = (Math.min(v.a0, v.a1) + Math.max(v.a0, v.a1)) / 2;
    angLabs[name] = p.text(v.pt[0], v.pt[1], name, {
      color: "faint", size: 13, weight: 500, bg: true,
      dx: 40 * Math.cos(bis), dy: -40 * Math.sin(bis) + 4,
    });
  }

  const rdLaw = readout({ key: "Use", value: "Law of cosines", tone: "r" });
  const why = el("p.gloss", { style: { maxWidth: "none", padding: "0 var(--s4)" } });

  function paint(id) {
    const c = CASES[id];
    for (const [name, node] of Object.entries(sideEls)) {
      const on = c.known.sides.includes(name);
      node.style.stroke = V(on ? "q-r" : "rule");
      node.style.strokeWidth = on ? 4 : 2;
      node.style.strokeDasharray = on ? null : "4 4";
      for (const t of sideLabs[name].childNodes) t.style.fill = V(on ? "q-r" : "faint");
    }
    for (const [name, node] of Object.entries(angEls)) {
      const on = c.known.angles.includes(name);
      node.firstChild.style.stroke = V(on ? "q-x" : "rule");
      node.firstChild.style.strokeWidth = on ? 3 : 1.25;
      node.firstChild.style.fill = on ? V("q-x-soft") : "none";
      node.firstChild.style.strokeDasharray = on ? null : "3 3";
      for (const t of angLabs[name].childNodes) t.style.fill = V(on ? "q-x" : "faint");
    }
    rdLaw.set(c.law);
    why.innerHTML = c.why;
  }

  const pick = scenarios({
    label: "What you are given",
    options: Object.entries(CASES).map(([id, c]) => ({ id, label: c.label })),
    value: "SAS",
    onChange: paint,
  });
  paint("SAS");

  return plate({
    no: 5,
    title: "Which triangle law applies",
    tag: "interactive",
    label: "Triangle law selector",
    stage: [p.root, why],
    controls: el("div.plate-controls", null, pick.root),
    readouts: readouts(rdLaw),
    caption:
      "Teal marks a known side, blue a known angle. The rule is one question: " +
      "<b>is any known side paired with the angle directly opposite it?</b> If yes, " +
      "law of sines. If no, law of cosines. SSA is the one to be careful with — the " +
      "pairing exists but two different triangles can satisfy it.",
  });
}

/* --- registration ---------------------------------------------------------- */

register("logRuler", { no: 2, build: logRuler });
register("unitCircle", { no: 3, build: unitCircle });
register("triangle345", { no: 4, build: triangle345 });
register("triangleLaws", { no: 5, build: triangleLaws });
