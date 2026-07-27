/* ==========================================================================
   figures/odes.js — Plates 21 and 22.

   Plate 22 is the payoff of the whole guide: the 3-4-5 triangle, last seen
   as a complex number in Part 2, turns up as the characteristic root that
   decides whether a second-order system rings.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts, draggable } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot, field } from "../lib/plot.js";
import { num, fixed, degv } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;

/* ==========================================================================
   Plate 21 — a direction field, and a solution that follows the arrows
   ========================================================================== */

function directionField() {
  const K = 0.5, TARGET = 4;
  const slope = (t, y) => K * (TARGET - y);            // y' = 0.5(4 − y)

  const p = new Plot({
    w: 560, h: 340, xr: [0, 9], yr: [-1.6, 8.6],
    pad: { l: 36, r: 22, t: 16, b: 30 },
    label: "A field of short arrows showing the slope the equation demands at " +
           "each point, with one solution curve following them from a movable " +
           "starting height.",
  });
  p.grid({ xStep: 1, yStep: 1 });
  field(p, (t, y) => [1, slope(t, y)], { nx: 17, ny: 13, color: "muted", len: 0.72, opacity: 0.55 });
  p.axes({ xStep: 2, yStep: 2, xLabel: "t", xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)) });

  // the equilibrium the arrows all point towards
  p.line(0, TARGET, 9, TARGET, { color: "q-y", width: 1.5, dash: "7 4" });
  p.text(8.8, TARGET, "steady state y = 4", { color: "q-y", size: 11, dy: -8, anchor: "end", bg: true });

  const curve = p.param(() => [NaN, NaN], [0, 1], { color: "q-r", width: 3 });
  const start = p.dot(0, 7, { color: "q-r", r: 6 });
  p.hitArea();

  const rdY0 = readout({ key: "starting value y(0)", value: "7.00" });
  const rdSol = readout({ key: "the solution", value: "y = 4 + 3.00 e^(−0.5t)" });
  rdSol.root.classList.add("wide");
  const rdSlope = readout({ key: "slope at t = 0", value: "−1.50", tone: "x" });
  const rdEnd = readout({ key: "y at t = 9", value: "4.03", tone: "y" });

  function draw(y0) {
    const A = y0 - TARGET;
    const y = (t) => TARGET + A * Math.exp(-K * t);
    const pts = [];
    for (let i = 0; i <= 240; i++) {
      const t = (i / 240) * 9;
      pts.push(`${p.x(t).toFixed(2)} ${p.y(y(t)).toFixed(2)}`);
    }
    curve.setAttribute("d", "M " + pts.join(" L "));
    for (const c of start.childNodes) { c.setAttribute("cx", p.x(0)); c.setAttribute("cy", p.y(y0)); }

    rdY0.set(fixed(y0, 2));
    rdSol.set(`y = 4 ${A < 0 ? "−" : "+"} ${fixed(Math.abs(A), 2)} e^(−0.5t)`);
    rdSlope.set(fixed(slope(0, y0), 2));
    rdEnd.set(fixed(y(9), 2));
  }

  const k = knob({
    label: "starting value y(0)", min: -1.5, max: 8.5, step: 0.1, value: 7,
    format: (v) => fixed(v, 1),
    onInput: draw,
  });

  draggable(p.root, ({ y }) => {
    const v = Math.max(-1.5, Math.min(8.5, p.uy(y)));
    k.set(Math.round(v * 10) / 10, false);
    draw(v);
  });

  draw(7);

  return plate({
    no: 21,
    title: "The equation is the arrows; a solution follows them",
    tag: "interactive",
    label: "Direction field with a solution curve",
    stage: p.root,
    controls: el("div.plate-controls", null, k.root,
      el("p.gloss", { text: "Or drag up and down on the plate.", style: { flex: "0 1 11rem" } })),
    readouts: readouts(rdY0, rdSlope, rdEnd, rdSol),
    caption:
      "Every starting height gives a different curve, and they all bend towards " +
      "y = 4 without ever reaching it. <b>That is what the constant of integration " +
      "means</b>: the equation fixes the shape of the family, and the initial " +
      "condition picks one member out of it. Start exactly at 4 and nothing happens " +
      "at all — a capacitor already charged draws no current.",
  });
}

/* ==========================================================================
   Plate 22 — where the roots sit is what the system does
   ========================================================================== */

function damping() {
  const A = 1, C = 25;                                  // y'' + b y' + 25 y = 0
  const WN = Math.sqrt(C / A);                          // natural frequency, 5

  /* left: the complex plane the roots live in */
  const p = new Plot({
    w: 260, h: 280, xr: [-23, 3], yr: [-8.5, 8.5],
    pad: { l: 26, r: 16, t: 16, b: 26 },
    label: "The complex plane showing the two characteristic roots. They sit as a " +
           "conjugate pair off the real axis when the system rings, and collide " +
           "onto the real axis when it stops ringing.",
  });
  p.grid({ xStep: 5, yStep: 2 });
  p.axes({ xStep: 5, yStep: 4, xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : `${num(v, 0)}j`) });
  // the circle of constant natural frequency: while the roots are complex they
  // slide along it, which is why ω_n does not change with damping
  p.param((t) => [WN * Math.cos(t), WN * Math.sin(t)], [0, 2 * Math.PI],
    { color: "rule", width: 1, dash: "3 4", layer: "grid" });

  const r1 = p.dot(-3, 4, { color: "q-r", r: 6 });
  const r2 = p.dot(-3, -4, { color: "q-r", r: 6 });
  const spoke = p.line(0, 0, -3, 4, { color: "q-r", width: 1.5, dash: "4 3" });
  const rootLab = p.text(0, 0, "", { color: "q-r", size: 11, bg: true, anchor: "end" });

  /* right: what the system actually does */
  const q = new Plot({
    w: 400, h: 280, xr: [0, 2.4], yr: [-1.15, 1.15],
    pad: { l: 34, r: 18, t: 16, b: 28 },
    label: "The response over time. It oscillates and decays when the roots are " +
           "complex, and returns to rest without crossing zero when they are real.",
  });
  q.grid({ xStep: 0.2, yStep: 0.25 });
  q.axes({ xStep: 0.5, yStep: 0.5, xLabel: "t", xFmt: (v) => (v === 0 ? "" : num(v, 1)), yFmt: (v) => (v === 0 ? "" : num(v, 1)) });
  const resp = q.param(() => [NaN, NaN], [0, 1], { color: "q-y", width: 2.75 });
  const envU = q.curve(() => NaN, { color: "muted", width: 1, dash: "4 4" });
  const envL = q.curve(() => NaN, { color: "muted", width: 1, dash: "4 4" });

  const rdB = readout({ key: "b", value: "6.00" });
  const rdRoots = readout({ key: "roots", value: "−3 ± 4j", tone: "r" });
  const rdZeta = readout({ key: "damping ratio", value: "0.60" });
  const rdKind = readout({ key: "behaviour", value: "underdamped — it rings" });
  rdKind.root.classList.add("wide");

  function draw(b) {
    const disc = b * b - 4 * A * C;
    const zeta = b / (2 * Math.sqrt(A * C));
    let re1, im1, re2, im2, y;

    if (disc < 0) {
      const al = -b / (2 * A), be = Math.sqrt(-disc) / (2 * A);
      re1 = al; im1 = be; re2 = al; im2 = -be;
      // unit initial displacement, zero initial velocity
      y = (t) => Math.exp(al * t) * (Math.cos(be * t) - (al / be) * Math.sin(be * t));
    } else if (disc === 0) {
      const r = -b / (2 * A);
      re1 = re2 = r; im1 = im2 = 0;
      y = (t) => (1 - r * t) * Math.exp(r * t);
    } else {
      const s = Math.sqrt(disc);
      re1 = (-b + s) / (2 * A); re2 = (-b - s) / (2 * A);
      im1 = im2 = 0;
      const k2 = -re1 / (re2 - re1), k1 = 1 - k2;
      y = (t) => k1 * Math.exp(re1 * t) + k2 * Math.exp(re2 * t);
    }

    for (const c of r1.childNodes) { c.setAttribute("cx", p.x(re1)); c.setAttribute("cy", p.y(im1)); }
    for (const c of r2.childNodes) { c.setAttribute("cx", p.x(re2)); c.setAttribute("cy", p.y(im2)); }
    spoke.setAttribute("x2", p.x(re1)); spoke.setAttribute("y2", p.y(im1));
    for (const n of rootLab.childNodes) {
      n.setAttribute("x", p.x(re1) - 8); n.setAttribute("y", p.y(im1) - 8);
      n.textContent = im1 ? `${fixed(re1, 1)} + ${fixed(im1, 1)}j` : fixed(re1, 1);
    }

    const pts = [];
    for (let i = 0; i <= 300; i++) {
      const t = (i / 300) * 2.4;
      pts.push(`${q.x(t).toFixed(2)} ${q.y(Math.max(-1.15, Math.min(1.15, y(t)))).toFixed(2)}`);
    }
    resp.setAttribute("d", "M " + pts.join(" L "));

    // the decay envelope only means anything while the response oscillates
    const env = disc < 0 ? (t) => Math.exp((-b / (2 * A)) * t) * Math.hypot(1, (b / (2 * A)) / (Math.sqrt(-disc) / (2 * A))) : null;
    for (const [node, sign] of [[envU, 1], [envL, -1]]) {
      if (!env) { node.setAttribute("d", ""); continue; }
      const ep = [];
      for (let i = 0; i <= 160; i++) {
        const t = (i / 160) * 2.4;
        const v = sign * env(t);
        if (Math.abs(v) <= 1.15) ep.push(`${q.x(t).toFixed(2)} ${q.y(v).toFixed(2)}`);
      }
      node.setAttribute("d", ep.length > 1 ? "M " + ep.join(" L ") : "");
    }

    rdB.set(fixed(b, 2));
    rdRoots.set(disc < 0
      ? `${fixed(re1, 2)} ± ${fixed(im1, 2)}j`
      : disc === 0 ? `${fixed(re1, 2)} (repeated)` : `${fixed(re1, 2)}, ${fixed(re2, 2)}`);
    rdZeta.set(fixed(zeta, 2));
    rdKind.set(
      b === 0 ? "undamped — it rings forever, because nothing removes energy"
      : disc < 0 ? `underdamped — rings at ${fixed(im1, 2)} rad/s inside a decaying envelope`
      : disc === 0 ? "critically damped — the fastest return to rest with no overshoot at all"
      : "overdamped — crawls back to rest, never crossing zero");
  }

  const k = knob({
    label: "damping coefficient b", min: 0, max: 22, step: 0.1, value: 6,
    format: (v) => fixed(v, 1),
    onInput: draw,
  });

  const jump = scenarios({
    label: "the three cases",
    options: [
      { id: "6", label: "b = 6 · the cast" },
      { id: "10", label: "b = 10 · critical" },
      { id: "20", label: "b = 20 · over" },
    ],
    value: "6",
    onChange: (id) => k.set(Number(id)),
  });

  const row = el("div", {
    style: {
      display: "grid", gap: "var(--s3)", width: "100%", alignItems: "center",
      gridTemplateColumns: "minmax(11rem, 1fr) minmax(13rem, 1.35fr)",
    },
  }, p.root, q.root);

  draw(6);

  return plate({
    no: 22,
    title: "Where the roots sit is what the system does",
    tag: "interactive",
    label: "Characteristic roots and the response they produce",
    stage: row,
    controls: el("div.plate-controls", null, k.root, jump.root),
    readouts: readouts(rdB, rdRoots, rdZeta, rdKind),
    caption:
      "At <b>b = 6</b> the roots are −3 ± 4j and the response rings — that is the " +
      "3-4-5 triangle from Part 1, deciding the behaviour of a circuit. Raise b and " +
      "the two roots slide along the dashed circle towards each other, <b>collide on " +
      "the real axis at b = 10</b>, and then separate along it. The ringing stops at " +
      "exactly the moment they meet. Everything to the left of that collision is a " +
      "system that overshoots; everything to the right is one that does not.",
  });
}

/* --- registration ---------------------------------------------------------- */

register("directionField", { no: 21, build: directionField });
register("damping", { no: 22, build: damping });
