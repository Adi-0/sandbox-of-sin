/* ==========================================================================
   figures/geometry.js — Plates 9 and 10.
   ========================================================================== */

import { svg, el, knob, scenarios, readout, readouts, draggable } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed, degv, frac } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;

/* ==========================================================================
   Plate 9 — the tangent is perpendicular to the radius
   One input: the point on the circle. Lesson: the two slopes always
   multiply to −1, so a tangent needs no calculus.
   ========================================================================== */

function circleTangent() {
  const R = 5;
  const p = new Plot({
    w: 480, h: 430, xr: [-8.5, 8.5], yr: [-8.5, 8.5],
    pad: { l: 32, r: 22, t: 18, b: 30 },
    label: "The circle x squared plus y squared equals 25, with a movable point on " +
           "it. The radius to that point and the tangent line there are always at " +
           "right angles, so their slopes multiply to minus one.",
  });
  p.equalize();
  p.grid({ xStep: 1, yStep: 1 });
  p.axes({ xStep: 2, yStep: 2, xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)) });
  p.param((t) => [R * Math.cos(t), R * Math.sin(t)], [0, 2 * Math.PI], { color: "rule", width: 1.75 });

  const radius = p.line(0, 0, 3, 4, { color: "q-r", width: 3 });
  const tangent = p.line(0, 0, 0, 0, { color: "q-x", width: 2.5 });
  const sq = p.rightAngle(3, 4, 0, Math.PI / 2, 11, { color: "muted" });
  const pt = p.dot(3, 4, { color: "q-r", r: 6 });
  const tag = p.text(3, 4, "(3, 4)", { color: "ink", size: 12.5, bg: true });
  p.hitArea();

  const rdPt = readout({ key: "point", value: "(3, 4)" });
  const rdRad = readout({ key: "slope of radius", value: "4/3", tone: "r" });
  const rdTan = readout({ key: "slope of tangent", value: "−3/4", tone: "x" });
  const rdProd = readout({ key: "product", value: "−1.000" });
  const rdEq = readout({ key: "tangent line", value: "y − 4 = −0.75(x − 3)" });
  rdEq.root.classList.add("wide");

  function draw(theta) {
    const a = R * Math.cos(theta), b = R * Math.sin(theta);
    radius.setAttribute("x2", p.x(a)); radius.setAttribute("y2", p.y(b));
    for (const c of pt.childNodes) { c.setAttribute("cx", p.x(a)); c.setAttribute("cy", p.y(b)); }
    for (const t of tag.childNodes) {
      t.setAttribute("x", p.x(a) + (a >= 0 ? 12 : -12));
      t.setAttribute("y", p.y(b) + (b >= 0 ? -11 : 20));
      t.setAttribute("text-anchor", a >= 0 ? "start" : "end");
      t.textContent = `(${fixed(a, 2)}, ${fixed(b, 2)})`;
    }

    // the tangent direction is the radius turned a quarter turn
    const tx = -Math.sin(theta), ty = Math.cos(theta);
    const L = 7.6;
    tangent.setAttribute("x1", p.x(a - tx * L)); tangent.setAttribute("y1", p.y(b - ty * L));
    tangent.setAttribute("x2", p.x(a + tx * L)); tangent.setAttribute("y2", p.y(b + ty * L));

    sq.setAttribute("d", raPath(p.x(a), p.y(b), theta + Math.PI, theta + Math.PI / 2, 11));

    const mR = Math.abs(a) < 1e-9 ? null : b / a;
    const mT = Math.abs(b) < 1e-9 ? null : -a / b;
    rdPt.set(`(${fixed(a, 2)}, ${fixed(b, 2)})`);
    rdRad.set(mR === null ? "vertical" : frac(mR, 12) ?? fixed(mR, 3));
    rdTan.set(mT === null ? "vertical" : frac(mT, 12) ?? fixed(mT, 3));
    rdProd.set(mR === null || mT === null ? "— (one is vertical)" : fixed(mR * mT, 3));
    rdEq.set(mT === null
      ? `x = ${fixed(a, 2)}`
      : `y − ${fixed(b, 2)} = ${fixed(mT, 3)}(x − ${fixed(a, 2)})`);
  }

  const k = knob({
    label: "position on the circle", min: 0, max: 360, step: 0.5, value: 53.13,
    format: (v) => `${num(v, 1)}°`,
    onInput: (v) => draw((v * Math.PI) / 180),
  });

  draggable(p.root, ({ x, y }) => {
    const th = Math.atan2(p.uy(y), p.ux(x));
    k.set(((th * 180) / Math.PI + 360) % 360, false);
    draw(th);
  });

  draw((53.13 * Math.PI) / 180);

  return plate({
    no: 9,
    title: "A tangent is perpendicular to its radius",
    tag: "interactive",
    label: "Circle with tangent",
    stage: p.root,
    controls: el("div.plate-controls", null, k.root,
      el("p.gloss", { text: "Or drag anywhere on the plate.", style: { flex: "0 1 10rem" } })),
    readouts: readouts(rdPt, rdRad, rdTan, rdProd, rdEq),
    caption:
      "The product readout stays at −1.000 all the way round, which is the whole " +
      "content of the plate. At the top and bottom of the circle the radius is " +
      "vertical and the product is undefined — <b>that is not a failure of the rule, " +
      "it is what \"perpendicular\" means when one slope is infinite</b>, and it is " +
      "the case a careless answer forgets to check.",
  });
}

function raPath(px, py, d1, d2, size) {
  const u = [Math.cos(d1) * size, -Math.sin(d1) * size];
  const v = [Math.cos(d2) * size, -Math.sin(d2) * size];
  return `M ${px + u[0]} ${py + u[1]} L ${px + u[0] + v[0]} ${py + u[1] + v[1]} L ${px + v[0]} ${py + v[1]}`;
}

/* ==========================================================================
   Plate 10 — one dial walks through all four conics
   One knob: eccentricity. Lesson: they are one family, not four topics.
   ========================================================================== */

function conics() {
  const LATUS = 4;                       // semi-latus rectum, held fixed
  const p = new Plot({
    w: 560, h: 400, xr: [-16, 10], yr: [-10, 10],
    pad: { l: 30, r: 22, t: 18, b: 30 },
    label: "A conic section drawn from its focus and directrix. As the " +
           "eccentricity increases from zero the curve goes from a circle through " +
           "ellipses to a parabola at one, and opens into a hyperbola beyond.",
  });
  p.equalize();
  p.grid({ xStep: 2, yStep: 2 });
  p.axes({ xStep: 4, yStep: 4, xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : num(v, 0)) });

  const directrix = p.line(0, -10, 0, 10, { color: "q-y", width: 1.75, dash: "6 4" });
  const dLab = p.text(0, 0, "directrix", { color: "q-y", size: 11.5, bg: true, anchor: "start" });
  // built empty and filled in by draw(): a hyperbola needs two arms, and
  // p.param() would refuse to create a path with no points in it
  const curve = p.add("curve", svg("path", {
    fill: "none", stroke: V("q-r"), strokeWidth: 2.5, strokeLinejoin: "round",
  }));
  const curve2 = p.add("curve", svg("path", {
    fill: "none", stroke: V("q-r"), strokeWidth: 2.5, strokeLinejoin: "round",
  }));
  p.dot(0, 0, { color: "q-x", r: 5 });
  p.text(0, 0, "focus", { color: "q-x", size: 11.5, dx: 8, dy: 18, anchor: "start", bg: true });

  const rdE = readout({ key: "eccentricity e", value: "0.00" });
  const rdKind = readout({ key: "the curve is a", value: "circle", tone: "r" });
  const rdClosed = readout({ key: "closed?", value: "yes" });
  const rdEq = readout({ key: "polar form", value: "r = 4 / (1 + 0·cos θ)" });
  rdEq.root.classList.add("wide");

  function draw(e) {
    // r = l / (1 + e cos θ), focus at the origin
    const rOf = (t) => LATUS / (1 + e * Math.cos(t));
    const inRange = (t) => {
      const d = 1 + e * Math.cos(t);
      if (d <= 0.06) return false;
      const r = LATUS / d;
      return r < 30;
    };

    // for e >= 1 the curve breaks into arms; sample each continuous run separately
    const runs = [];
    let cur = [];
    const N = 720;
    for (let i = 0; i <= N; i++) {
      const t = -Math.PI + (i / N) * 2 * Math.PI;
      if (inRange(t)) {
        const r = rOf(t);
        cur.push([r * Math.cos(t), r * Math.sin(t)]);
      } else if (cur.length) { runs.push(cur); cur = []; }
    }
    if (cur.length) runs.push(cur);

    const toPath = (pts) => pts.length < 2 ? ""
      : "M " + pts.map(([a, b]) => `${p.x(a).toFixed(2)} ${p.y(b).toFixed(2)}`).join(" L ");
    curve.setAttribute("d", toPath(runs[0] || []));
    curve2.setAttribute("d", toPath(runs[1] || []));

    // the directrix sits at x = l/e; at e = 0 it is infinitely far away
    const dx = e < 0.02 ? null : LATUS / e;
    if (dx === null || dx > 15) {
      directrix.style.opacity = 0;
      for (const t of dLab.childNodes) t.style.opacity = 0;
    } else {
      directrix.style.opacity = 1;
      directrix.setAttribute("x1", p.x(dx)); directrix.setAttribute("x2", p.x(dx));
      directrix.setAttribute("y1", p.y(-10)); directrix.setAttribute("y2", p.y(10));
      for (const t of dLab.childNodes) {
        t.style.opacity = 1;
        t.setAttribute("x", p.x(dx) + 6);
        t.setAttribute("y", p.y(8.4));
      }
    }

    const kind = e < 0.02 ? "circle" : e < 0.985 ? "ellipse" : e <= 1.015 ? "parabola" : "hyperbola";
    rdE.set(fixed(e, 2));
    rdKind.set(kind);
    rdClosed.set(e < 0.985 ? "yes" : "no", e < 0.985 ? " — it comes back" : " — it escapes");
    rdEq.set(`r = ${LATUS} / (1 + ${fixed(e, 2)}·cos θ)`);
  }

  const k = knob({
    label: "eccentricity e", min: 0, max: 2, step: 0.01, value: 0.6,
    format: (v) => fixed(v, 2),
    onInput: draw,
  });

  const jump = scenarios({
    options: [
      { id: "0", label: "circle" }, { id: "0.6", label: "ellipse" },
      { id: "1", label: "parabola" }, { id: "1.5", label: "hyperbola" },
    ],
    value: "0.6",
    onChange: (id) => k.set(Number(id)),
  });

  draw(0.6);

  return plate({
    no: 10,
    title: "One dial, all four conics",
    tag: "interactive",
    label: "Conic sections by eccentricity",
    stage: p.root,
    controls: el("div.plate-controls", null, k.root, jump.root),
    readouts: readouts(rdE, rdKind, rdClosed, rdEq),
    caption:
      "Push <b>e</b> slowly through 1 and watch the far end of the ellipse race off " +
      "and never come back. That is the whole distinction: below 1 the curve closes, " +
      "at exactly 1 it is a parabola, above 1 it opens into two arms. <b>The directrix " +
      "runs off to infinity as e goes to zero</b>, which is why a circle is usually " +
      "defined without one.",
  });
}

/* --- registration ---------------------------------------------------------- */

register("circleTangent", { no: 9, build: circleTangent });
register("conics", { no: 10, build: conics });
