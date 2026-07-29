/* ==========================================================================
   figures/laplace.js — Plates 80 and 81.

   Plate 80 is the claim the transform exists to make: a differential equation
   in t becomes an algebraic equation in s, gets solved by dividing, and comes
   back. The plate walks the four stages of that detour with the actual
   expressions at each corner, so the reader can see that the hard step has
   been replaced by a lookup.

   Plate 81 is the five transform pairs that carry nearly every FE question,
   read as one idea rather than five: where the poles are is what the function
   does. That reading is what Part 4 formalises.
   ========================================================================== */

import { el, svg, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { fixed, num } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;

/* ==========================================================================
   Plate 80 — the detour

   Four boxes in a loop: the differential equation, its transform, the solved
   algebra, and the answer. The long way round the bottom is what a first
   course teaches; the way over the top is what everyone actually does.
   ========================================================================== */

const PROBLEMS = {
  rc: {
    name: "RC step",
    ode: "RC·v′ + v = V",
    trans: "RC(sV(s) − v₀) + V(s) = V/s",
    solved: ["V(s) = V/[s(1 + sRC)]", "+ v₀RC/(1 + sRC)"],
    answer: ["v(t) = V(1 − e^(−t/RC))", "+ v₀ e^(−t/RC)"],
    hard: "separable, but only just",
    note: "The easiest case, and the one where the transform looks like overkill — you can separate and integrate this by hand in a minute. <b>Keep it in view anyway</b>, because the initial condition v₀ enters the algebra as a plain term rather than as a constant to be fitted afterwards. That is the property that stops being convenient and starts being essential as the order rises.",
  },
  rlc: {
    name: "RLC step",
    ode: "LC·v″ + RC·v′ + v = V",
    trans: "(LCs² + RCs + 1)V(s) = V/s",
    solved: "V(s) = V / [s(LCs² + RCs + 1)]",
    answer: ["v(t) = V[1 − e^(−ζωₙt) ·", "(cos ωd t + k sin ωd t)]"],
    hard: "second order — a real chore by hand",
    note: "Here the detour pays. Solving this in the time domain means a characteristic equation, two arbitrary constants, and fitting them to two initial conditions. <b>In s it is one division</b>, and the roots of the denominator are the characteristic roots you would have found anyway — which is the observation Part 4 is built on.",
  },
  ic: {
    name: "With initial conditions",
    ode: "L·i′ + Ri = 0,  i(0) = I₀",
    trans: "L(sI(s) − I₀) + RI(s) = 0",
    solved: "I(s) = LI₀ / (Ls + R) = I₀ / (s + R/L)",
    answer: "i(t) = I₀e^(−Rt/L)",
    hard: "easy, but watch where I₀ goes",
    note: "<b>This is the property that makes the transform worth the trouble.</b> The initial condition is not fitted at the end — it walks into the algebra at the transform step, as the −I₀ term inside ℒ{i′}. For a second-order problem that saves solving two simultaneous equations for two unknown constants, every time.",
  },
};

function detour() {
  const W = 720, H = 348;
  const BW = 276, BH = 70;
  const root = svg("svg", {
    viewBox: `0 0 ${W} ${H}`, role: "img",
    "aria-label":
      "Four boxes in a rectangle showing the Laplace detour: a differential " +
      "equation in time transforms up into an algebraic equation in s, is " +
      "solved by division, and is inverted back down into the answer — with " +
      "the direct route across the bottom marked as the hard one.",
    style: { display: "block", width: "100%", height: "auto" },
  });
  const defs = svg("defs");
  root.appendChild(defs);
  defs.appendChild(svg("marker", {
    id: "lap-head", viewBox: "0 0 10 10", refX: 9, refY: 5,
    markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse",
    markerUnits: "userSpaceOnUse",
  }, svg("path", { d: "M 0 1 L 9 5 L 0 9 z", fill: V("q-x") })));
  defs.appendChild(svg("marker", {
    id: "lap-bad", viewBox: "0 0 10 10", refX: 9, refY: 5,
    markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse",
    markerUnits: "userSpaceOnUse",
  }, svg("path", { d: "M 0 1 L 9 5 L 0 9 z", fill: V("q-bad") })));

  const layer = svg("g");
  root.appendChild(layer);

  const text = (x, y, str, o = {}) => layer.appendChild(svg("text", {
    class: "lbl", x, y, textAnchor: o.anchor || "middle",
    fill: V(o.color || "ink"), fontSize: `${o.size || 11}px`,
    fontWeight: o.weight || null, text: str,
  }));

  /** `body` may be one line or two — the second-order answers need two. */
  function box(x, y, tag, body, tone) {
    layer.appendChild(svg("rect", {
      x, y, width: BW, height: BH, rx: 2,
      fill: V("plate"), stroke: V(tone), strokeWidth: 1.6,
    }));
    layer.appendChild(svg("rect", {
      x, y, width: BW, height: 18, fill: V("sunk"), stroke: V(tone), strokeWidth: 1,
    }));
    text(x + BW / 2, y + 12.5, tag, { color: "muted", size: 9, weight: 600 });
    const lines = Array.isArray(body) ? body : [body];
    const y0 = lines.length > 1 ? y + 38 : y + 46;
    lines.forEach((ln, i) =>
      text(x + BW / 2, y0 + i * 17, ln, { color: "ink-strong", size: 11.5 }));
  }

  function render(P) {
    while (layer.firstChild) layer.removeChild(layer.firstChild);
    const xl = 26, xr = W - 26 - BW;
    const yTop = 56, yBot = 214;

    box(xl, yTop, "IN s — ALGEBRA", P.trans, "q-x");
    box(xr, yTop, "SOLVED FOR THE UNKNOWN", P.solved, "q-x");
    box(xl, yBot, "IN t — A DIFFERENTIAL EQUATION", P.ode, "ink");
    box(xr, yBot, "THE ANSWER", P.answer, "q-r");

    // up: transform
    layer.appendChild(svg("line", {
      x1: xl + BW / 2, y1: yBot - 6, x2: xl + BW / 2, y2: yTop + BH + 10,
      stroke: V("q-x"), strokeWidth: 2, markerEnd: "url(#lap-head)",
    }));
    text(xl + BW / 2 - 8, (yTop + BH + yBot) / 2 + 4, "ℒ  — a table lookup",
      { color: "q-x", size: 11, weight: 600, anchor: "end" });

    // across the top: divide
    layer.appendChild(svg("line", {
      x1: xl + BW + 6, y1: yTop + BH / 2, x2: xr - 10, y2: yTop + BH / 2,
      stroke: V("q-x"), strokeWidth: 2, markerEnd: "url(#lap-head)",
    }));
    text((xl + BW + xr) / 2, yTop + BH / 2 - 10, "rearrange", { color: "q-x", size: 11, weight: 600 });

    // down: invert
    layer.appendChild(svg("line", {
      x1: xr + BW / 2, y1: yTop + BH + 6, x2: xr + BW / 2, y2: yBot - 10,
      stroke: V("q-r"), strokeWidth: 2, markerEnd: "url(#lap-head)",
    }));
    text(xr + BW / 2 - 8, (yTop + BH + yBot) / 2 - 3, "partial fractions,",
      { color: "q-r", size: 11, weight: 600, anchor: "end" });
    text(xr + BW / 2 - 8, (yTop + BH + yBot) / 2 + 12, "then ℒ⁻¹ off the same table",
      { color: "q-r", size: 11, anchor: "end" });

    // across the bottom: the route nobody takes
    layer.appendChild(svg("line", {
      x1: xl + BW + 6, y1: yBot + BH / 2, x2: xr - 10, y2: yBot + BH / 2,
      stroke: V("q-bad"), strokeWidth: 1.6, strokeDasharray: "6 5",
      markerEnd: "url(#lap-bad)",
    }));
    // both labels below the boxes, so the narrow gap carries only the arrow
    text((xl + BW + xr) / 2, yBot + BH + 16, "solve it directly",
      { color: "q-bad", size: 11, weight: 600 });
    text((xl + BW + xr) / 2, yBot + BH + 31, P.hard,
      { color: "q-bad", size: 9.5 });

    text(W / 2, 26, "the long way round is the short way",
      { color: "q-r", size: 13.5, weight: 600 });
    text(W / 2, 330,
      "Three sides of a rectangle, none of them calculus — against one side that is.",
      { color: "muted", size: 10.5 });
  }

  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  const sc = scenarios({
    label: "problem",
    options: Object.keys(PROBLEMS).map((id) => ({ id, label: PROBLEMS[id].name })),
    value: "rlc",
    onChange: (id) => { render(PROBLEMS[id]); rdNote.set(PROBLEMS[id].note); },
  });
  render(PROBLEMS.rlc);
  rdNote.set(PROBLEMS.rlc.note);

  return {
    stage: root,
    controls: el("div.controls", null, sc.root),
    readouts: readouts(rdNote),
  };
}

/* ==========================================================================
   Plate 81 — the s-domain circuit

   Every impedance, and what a step through it looks like. The knob is the
   pole location, so the reader can watch the same 1/(s + a) mean a fast or a
   slow exponential — which is the intuition Part 4 formalises.
   ========================================================================== */

const PAIRS = {
  step: {
    name: "Step", ft: "u(t)", fs: "1/s",
    f: () => 1,
    note: "A constant, from t = 0 onward. <b>The 1/s is why a step input puts a pole at the origin</b> in every problem that uses one — and why the final value theorem is a question about what happens at s = 0.",
  },
  exp: {
    name: "Exponential", ft: "e^(−at)", fs: "1/(s + a)",
    f: (t, a) => Math.exp(-a * t),
    note: "<b>The single most useful pair in the table.</b> A pole at s = −a is an exponential decaying at rate a, so the pole's distance from the origin <em>is</em> 1/τ. Everything in Part 4 grows out of this one line.",
  },
  ramp: {
    name: "Ramp", ft: "t", fs: "1/s²",
    f: (t) => t,
    note: "A repeated pole at the origin. Note the pattern: <b>each extra power of t adds another 1/s</b>, so t^n transforms to n!/s^(n+1). Integration in t is division by s.",
  },
  sine: {
    name: "Sine", ft: "sin(ωt)", fs: "ω/(s² + ω²)",
    f: (t, a, w) => Math.sin(w * t),
    note: "Poles at <b>s = ±jω</b> — on the imaginary axis, with no real part, so nothing decays. That is exactly what an oscillation that never dies looks like in the s-plane, and it is the boundary case Part 4 calls marginal stability.",
  },
  damped: {
    name: "Damped sine", ft: "e^(−at)sin(ωt)", fs: "ω/[(s+a)² + ω²]",
    f: (t, a, w) => Math.exp(-a * t) * Math.sin(w * t),
    note: "Poles at <b>s = −a ± jω</b>: Part 2's ringing, written down. Compare it with the plain sine — <b>adding a real part to the poles is exactly what puts an envelope on the oscillation</b>, and the shift theorem says multiplying by e^(−at) in t always means replacing s with s + a.",
  },
};

function transformPairs() {
  const p = new Plot({
    w: 620, h: 300, xr: [-0.2, 6.4], yr: [-1.25, 1.45],
    pad: { l: 52, r: 22, t: 18, b: 38 },
    label:
      "The time-domain function of a selected Laplace transform pair, plotted " +
      "against time, with a decay rate the reader can change.",
  });

  const rdPair = readout({ key: "pair", value: "" });
  const rdFt = readout({ key: "f(t)", value: "", tone: "y" });
  const rdFs = readout({ key: "F(s)", value: "", tone: "x" });
  const rdPoles = readout({ key: "poles", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "exp";
  const W_OSC = 4;                                  // rad/s for the sinusoids

  function draw(a10) {
    p.clear("curve", "label", "mark", "shade");
    const a = a10 / 10;
    const P = PAIRS[cur];

    p.grid({ xStep: 1, yStep: 0.5 });
    p.axes({ xLabel: "t", yLabel: "f(t)", xStep: 1, yStep: 0.5, arrows: true });

    // for anything with a decay, draw the envelope it lives inside
    if (cur === "exp" || cur === "damped") {
      p.curve((t) => (t < 0 ? null : Math.exp(-a * t)),
        { color: "q-x", width: 1.3, dash: "4 3" });
      if (cur === "damped") {
        p.curve((t) => (t < 0 ? null : -Math.exp(-a * t)),
          { color: "q-x", width: 1.3, dash: "4 3" });
      }
      p.text(6.2, Math.exp(-a * 6.2) + 0.12, "e^(−at)",
        { color: "q-x", size: 10.5, weight: 600, anchor: "end" });
    }

    p.curve((t) => (t < 0 ? 0 : Math.min(1.4, P.f(t, a, W_OSC))),
      { color: "q-y", width: 2.8 });

    const poles = {
      step: "s = 0",
      exp: `s = −${fixed(a, 1)}`,
      ramp: "s = 0, twice",
      sine: `s = ±j${W_OSC}`,
      damped: `s = −${fixed(a, 1)} ± j${W_OSC}`,
    }[cur];

    rdPair.set(P.name);
    rdFt.set(P.ft.replace("a", cur === "exp" || cur === "damped" ? fixed(a, 1) : "a"));
    rdFs.set(P.fs.replace(/a/g, cur === "exp" || cur === "damped" ? fixed(a, 1) : "a"));
    rdPoles.set(poles);
    rdNote.set(P.note);
  }

  const k = knob({
    label: "decay rate a", min: 1, max: 25, step: 1, value: 6,
    format: (v) => fixed(v / 10, 1),
    onInput: draw,
  });
  const sc = scenarios({
    label: "transform pair",
    options: Object.keys(PAIRS).map((id) => ({ id, label: PAIRS[id].name })),
    value: "exp",
    onChange: (id) => { cur = id; draw(k.value()); },
  });
  draw(6);

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdPair, rdFt, rdFs, rdPoles, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("detour", { no: 80, build: () => {
  const f = detour();
  return plate({
    no: 80, title: "The long way round", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The transform is a detour, and the detour is faster. Going straight " +
      "across the bottom means solving a differential equation; going round " +
      "the top means a table lookup, some algebra, and <b>the same table read " +
      "backwards</b>. Nothing on the top route is calculus. <b>Load \"with " +
      "initial conditions\"</b> for the property that makes it worth the " +
      "trouble: the initial value enters the algebra at the transform step, " +
      "rather than being fitted to arbitrary constants at the end.",
  });
} });

register("transformPairs", { no: 81, build: () => {
  const f = transformPairs();
  return plate({
    no: 81, title: "The five pairs worth knowing", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The handbook has a long transform table and you will not need most of " +
      "it. These five carry nearly every FE question, and they are worth " +
      "reading as a single idea rather than five: <b>where the poles are is " +
      "what the function does</b>. A pole on the negative real axis is a " +
      "decaying exponential, a pair on the imaginary axis is an undying " +
      "oscillation, and a pair off to the left of it is Part 2's ringing. " +
      "Move the decay rate and watch the pole and the curve move together.",
  });
} });
