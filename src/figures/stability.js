/* ==========================================================================
   figures/stability.js — Plates 93 and 94.

   Plate 93 builds the Routh array live. The point of doing it interactively
   rather than printing a worked table is that the first column's signs change
   as you turn the gain, and you can watch the entry that goes negative — and
   then watch the row of zeros appear at the exact gain where the loop starts
   to oscillate.

   Plate 94 is the same fact in the time domain: the range of gains, drawn as a
   bar, with the step response underneath it.
   ========================================================================== */

import { el, svg, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, sig } from "../lib/fmt.js";
import {
  roots, routh, auxFrequency, deriv, evalComplex, evalReal, cmul, cdiv,
} from "../lib/poly.js";

const V = (n) => `var(--${n})`;

/* -------------------------------------------------------------------------
   the systems on show
   ------------------------------------------------------------------------- */

const SYSTEMS = {
  three: {
    label: "s³ + 10s² + 16s + K",
    coef: (K) => [1, 10, 16, K],
    kMax: 300, kStart: 60,
    poly: (K) => `s^3 + 10s^2 + 16s + ${sig(K, 3)}`,
    story: "This is the plant from Part 2, whose locus bent right and crossed the axis. <b>Routh finds that crossing exactly</b> — the s¹ entry is (160 − K)/10, so it goes negative the moment K passes 160, and no plotting was needed.",
  },
  fourth: {
    label: "s⁴ + 6s³ + 11s² + 6s + K",
    coef: (K) => [1, 6, 11, 6, K],
    kMax: 20, kStart: 5,
    poly: (K) => `s^4 + 6s^3 + 11s^2 + 6s + ${sig(K, 3)}`,
    story: "A fourth-order loop — three real poles and an integrator. Finding the roots by hand is out of the question; the array takes four lines. <b>Order is what makes Routh worth having</b>: the work grows slowly while root-finding becomes impossible.",
  },
  band: {
    label: "s⁴ + 3s³ + 3s² + Ks + 1",
    coef: (K) => [1, 3, 3, K, 1],
    kMax: 10, kStart: 4,
    poly: (K) => `s^4 + 3s^3 + 3s^2 + ${sig(K, 3)}s + 1`,
    story: "Here the gain appears in the middle of the polynomial, and the stable range has <b>two</b> ends: too little is as bad as too much. That surprises people, and it is why the answer to a stability question is a <em>range</em> and not a maximum.",
  },
};

/** Bisect between a gain that works and one that does not. */
function refine(ok, good, bad) {
  for (let i = 0; i < 40; i++) {
    const m = (good + bad) / 2;
    if (ok(m)) good = m; else bad = m;
  }
  return (good + bad) / 2;
}

/**
 * The gains for which every root is in the left half-plane, scanned coarsely
 * and then bisected at each end. `fromZero` and `toMax` say whether the range
 * simply runs off the end of the slider, so the readout can write "K > 160"
 * rather than inventing a bound at the sampling resolution.
 */
function stableRange(sys) {
  const N = 1200, step = sys.kMax / N;
  const ok = (K) => routh(sys.coef(K)).changes === 0 && roots(sys.coef(K)).every((r) => r[0] < -1e-9);
  const hits = [];
  for (let i = 1; i <= N; i++) { const K = i * step; if (ok(K)) hits.push(K); }
  if (!hits.length) return null;
  let lo = hits[0], hi = hits[hits.length - 1];
  const fromZero = lo <= step * 1.5;
  const toMax = hi >= sys.kMax - step * 1.5;
  if (!fromZero) lo = refine(ok, lo, lo - step);
  if (!toMax) hi = refine(ok, hi, hi + step);
  return { lo, hi, fromZero, toMax };
}

const RANGE = new Map();
const rangeOf = (id) => {
  if (!RANGE.has(id)) RANGE.set(id, stableRange(SYSTEMS[id]));
  return RANGE.get(id);
};

/* ==========================================================================
   Plate 93 — the array
   ========================================================================== */

function routhArray() {
  const W = 620;
  const root = svg("svg", {
    viewBox: `0 0 ${W} 250`, role: "img",
    "aria-label": "The Routh array of a characteristic polynomial, with the " +
                  "first column marked and any sign changes flagged.",
    style: { display: "block", width: "100%", height: "auto" },
  });
  const g = svg("g");
  root.appendChild(g);

  const text = (x, y, str, o = {}) => g.appendChild(svg("text", {
    class: o.italic ? "lbl-it" : "lbl", x, y, textAnchor: o.anchor ?? "middle",
    fill: V(o.tone ?? "ink"), fontSize: `${o.size ?? 13}px`, fontWeight: o.weight ?? null,
    text: str,
  }));

  const rdFirst = readout({ key: "first column", value: "", tone: "x" });
  rdFirst.root.classList.add("wide");
  const rdChanges = readout({ key: "sign changes", value: "", tone: "bad" });
  const rdRoots = readout({ key: "roots in the RHP", value: "", tone: "bad" });
  const rdVerdict = readout({ key: "verdict", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "three";

  function draw(v) {
    const sys = SYSTEMS[cur];
    const K = (v / 1000) * sys.kMax;
    const coef = sys.coef(K);
    const t = routh(coef);
    const n = coef.length - 1;
    const rs = roots(coef);
    const rhp = rs.filter((r) => r[0] > 1e-7).length;
    const onAxis = rs.filter((r) => Math.abs(r[0]) <= 1e-7).length;

    while (g.firstChild) g.removeChild(g.firstChild);
    const H = 74 + (n + 1) * 34 + 44;
    root.setAttribute("viewBox", `0 0 ${W} ${H}`);

    text(20, 26, "characteristic equation", { anchor: "start", size: 10, tone: "muted", weight: 600 });
    text(20, 48, `${sys.poly(K)} = 0`.replace(/\^(\d)/g, (_, d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+d]),
      { anchor: "start", size: 15, tone: "ink-strong", weight: 600 });

    const rowY = (i) => 90 + i * 34;
    const colX = (j) => 168 + j * 118;

    /* the first column carries the whole verdict, so it gets a well */
    g.appendChild(svg("rect", {
      x: colX(0) - 56, y: rowY(0) - 22, width: 112, height: (n + 1) * 34,
      fill: V("q-x-soft"), rx: 3,
    }));
    g.appendChild(svg("line", {
      x1: 112, y1: rowY(0) - 24, x2: 112, y2: rowY(n) + 12,
      stroke: V("rule"), strokeWidth: 1,
    }));

    for (let i = 0; i <= n; i++) {
      text(100, rowY(i) + 5, `s${"⁰¹²³⁴⁵⁶⁷⁸⁹"[n - i] ?? ""}`,
        { anchor: "end", size: 13, tone: "muted", weight: 600 });
      for (let j = 0; j < t.width; j++) {
        const val = t.rows[i][j];
        const isFirst = j === 0;
        const eps = isFirst && t.flags[i] === "epsilon";
        text(colX(j), rowY(i) + 5, eps ? "ε" : sig(val, 4), {
          size: isFirst ? 14 : 13,
          weight: isFirst ? 700 : 400,
          tone: !isFirst ? "muted" : val < -1e-10 ? "q-bad" : "ink-strong",
        });
      }
      if (t.flags[i] === "auxiliary") {
        text(colX(t.width - 1) + 74, rowY(i) + 5, "← row of zeros: use dA/ds",
          { anchor: "start", size: 10.5, tone: "q-r", weight: 600 });
      }
      if (i > 0 && t.first[i] !== 0 && t.first[i - 1] !== 0 &&
          Math.sign(t.first[i]) !== Math.sign(t.first[i - 1])) {
        text(colX(0) + 72, rowY(i) - 12, "sign change", { anchor: "start", size: 10.5, tone: "q-bad", weight: 700 });
        g.appendChild(svg("line", {
          x1: colX(0) - 56, y1: rowY(i) - 17, x2: colX(0) + 66, y2: rowY(i) - 17,
          stroke: V("q-bad"), strokeWidth: 1.4, strokeDasharray: "4 3",
        }));
      }
    }

    /* how the third row's first entry was built — the pattern people get wrong */
    const a1 = t.rows[0][0], a2 = t.rows[0][1], b1 = t.rows[1][0], b2 = t.rows[1][1];
    text(20, rowY(n) + 40,
      `each entry: (b₁a₂ − a₁b₂)/b₁ from the two rows above  ·  here ` +
      `(${sig(b1, 3)}×${sig(a2, 3)} − ${sig(a1, 3)}×${sig(b2, 3)})/${sig(b1, 3)} = ${sig(t.rows[2][0], 4)}`,
      { anchor: "start", size: 10.5, tone: "muted" });

    const range = rangeOf(cur);
    rdFirst.set(t.first.map((x, i) =>
      t.flags[i] === "epsilon" ? "ε" : sig(x, 3)).join(",&nbsp; "));
    rdChanges.set(num(t.changes, 0));
    rdRoots.set(num(rhp, 0), onAxis ? ` · ${num(onAxis, 0)} on the axis` : "");
    rdVerdict.set(t.changes === 0 && !onAxis ? "stable" : onAxis ? "marginal" : "unstable");

    const w = auxFrequency(t.aux);
    const rangeText = !range ? "no gain is stable"
      : range.fromZero && range.toMax ? "every gain on this slider"
        : range.fromZero ? `0 &lt; K &lt; ${sig(range.hi, 3)}`
          : range.toMax ? `K &gt; ${sig(range.lo, 3)}`
            : `${sig(range.lo, 3)} &lt; K &lt; ${sig(range.hi, 3)}`;

    rdNote.set(
      w != null
        ? `<b>A whole row of zeros — this is the boundary.</b> It means the polynomial has roots placed symmetrically about the origin, and here that is a pair sitting on the imaginary axis. The auxiliary polynomial from the row above gives them: <b>ω = ${sig(w, 3)} rad/s</b>. So at this exact gain the loop does not settle and does not run away, it <em>oscillates</em>, at a frequency Routh has just told you without solving a cubic.`
        : t.changes > 0
          ? `<b>${num(t.changes, 0)} sign change${t.changes === 1 ? "" : "s"} in the first column means ${num(t.changes, 0)} root${t.changes === 1 ? "" : "s"} in the right half-plane</b> — and the roots, computed independently, agree: ${num(rhp, 0)}. The stable range is ${rangeText}. Notice that the array never found a root; it only counted them, which is why it works on polynomials you could not factor.`
          : `No sign changes, so every root is in the left half-plane and the loop is <b>stable</b>. The stable range is ${rangeText}. ${sys.story}`
    );
  }

  const k = knob({
    label: "gain K", min: 0, max: 1000, step: 1,
    value: Math.round((SYSTEMS.three.kStart / SYSTEMS.three.kMax) * 1000),
    format: (v) => sig((v / 1000) * SYSTEMS[cur].kMax, 3),
    onInput: draw,
  });
  const sc = scenarios({
    label: "characteristic equation",
    options: Object.keys(SYSTEMS).map((id) => ({ id, label: SYSTEMS[id].label })),
    value: "three",
    onChange: (id) => {
      cur = id;
      k.set(Math.round((SYSTEMS[id].kStart / SYSTEMS[id].kMax) * 1000));
    },
  });
  draw(k.value());

  return {
    stage: root,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdFirst, rdChanges, rdRoots, rdVerdict, rdNote),
  };
}

/* ==========================================================================
   Plate 94 — the range of gains, and what it sounds like
   ========================================================================== */

const PLANT = SYSTEMS.three;
const K_MAX = 300;

/**
 * Unit-step response of K/(s·P(s)) by partial fractions. Exact for distinct
 * poles, which is every gain here except the two where roots collide.
 */
function stepOf(P, K) {
  const rs = roots(P);
  const dP = deriv(P);
  const A0 = K / evalReal(P, 0);
  const terms = rs.map((r) => ({ A: cdiv([K, 0], cmul(r, evalComplex(dP, r))), p: r }));
  return (t) => {
    let v = A0;
    for (const { A, p } of terms) {
      const e = Math.exp(p[0] * t);
      v += e * (A[0] * Math.cos(p[1] * t) - A[1] * Math.sin(p[1] * t));
    }
    return v;
  };
}

function stabilityRange() {
  const bar = new Plot({
    w: 620, h: 84, xr: [0, K_MAX], yr: [0, 1],
    pad: { l: 48, r: 20, t: 10, b: 30 },
    label: "A bar of gain values from zero to 300, split into the stable and unstable ranges.",
  });
  const p = new Plot({
    w: 620, h: 250, xr: [0, 12], yr: [-0.4, 2.3],
    pad: { l: 48, r: 20, t: 14, b: 36 },
    label: "The unit step response of the closed loop at the selected gain.",
  });

  const rdK = readout({ key: "gain K", value: "", tone: "x" });
  const rdCrit = readout({ key: "critical gain", value: "", tone: "bad" });
  const rdW = readout({ key: "oscillates at", value: "", tone: "y" });
  const rdRhp = readout({ key: "roots in the RHP", value: "", tone: "bad" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  /* The critical gain, found the way Routh finds it: the first-column entry
     that changes sign. Bisection on that entry, not on the roots. */
  const sgn = (K) => routh(PLANT.coef(K)).first[2];
  let lo = 1, hi = K_MAX;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (sgn(mid) > 0) lo = mid; else hi = mid;
  }
  const kCrit = (lo + hi) / 2;
  const wCrit = auxFrequency(routh(PLANT.coef(kCrit)).aux) ?? Math.sqrt(16);

  function draw(K) {
    bar.clear("curve", "label", "mark", "shade");
    p.clear("curve", "label", "mark", "shade");

    /* --- the bar -------------------------------------------------------- */
    bar.polygon([[0, 0.2], [kCrit, 0.2], [kCrit, 0.8], [0, 0.8]], { fill: "q-r-soft" });
    bar.polygon([[kCrit, 0.2], [K_MAX, 0.2], [K_MAX, 0.8], [kCrit, 0.8]], { fill: "q-bad-soft" });
    bar.axes({ xLabel: "K", xStep: 50, yStep: 0, yFmt: null, origin: false, arrows: false });
    bar.text(kCrit / 2, 0.5, "stable", { color: "q-r", size: 11.5, weight: 700, dy: 4 });
    bar.text((kCrit + K_MAX) / 2, 0.5, "unstable", { color: "q-bad", size: 11.5, weight: 700, dy: 4 });
    bar.line(kCrit, 0.08, kCrit, 0.92, { color: "q-bad", width: 2 });
    bar.line(K, 0.02, K, 0.98, { color: "ink-strong", width: 2.4 });
    bar.text(kCrit, 0.95, `K = ${sig(kCrit, 3)}`, { color: "q-bad", size: 10.5, weight: 600, dy: -6 });

    /* --- the response --------------------------------------------------- */
    const P = PLANT.coef(K);
    const c = stepOf(P, K);
    p.grid({ xStep: 1, yStep: 0.5 });
    p.axes({ xLabel: "t  (s)", yLabel: "output", xStep: 2, yStep: 0.5, origin: false });
    p.line(0, 1, 12, 1, { color: "muted", width: 1.2, dash: "5 4" });
    p.text(12, 1, "the input", { color: "muted", size: 10, anchor: "end", dy: -6 });
    const rs = roots(P);
    const rhp = rs.filter((r) => r[0] > 1e-7).length;
    const marginal = Math.abs(K - kCrit) / kCrit < 0.004;
    p.curve(c, { color: marginal ? "q-y" : rhp ? "q-bad" : "q-r", width: 2.6, samples: 900 });

    rdK.set(sig(K, 3));
    rdCrit.set(sig(kCrit, 3));
    rdW.set(`${sig(wCrit, 3)} rad/s`, ` · ${sig(2 * Math.PI / wCrit, 3)} s period`);
    rdRhp.set(num(rhp, 0));

    rdNote.set(
      marginal
        ? `<b>At the critical gain the oscillation neither grows nor dies.</b> The poles are exactly on the imaginary axis at ±${sig(wCrit, 3)}j, so the response rings forever at ${sig(wCrit, 3)} rad/s — a period of ${sig(2 * Math.PI / wCrit, 3)} s, which you can count off the trace. <b>Routh gave you both numbers</b>: the gain from the first column and the frequency from the auxiliary polynomial.`
        : rhp
          ? `<b>Past the critical gain the oscillation grows without bound.</b> Nothing downstream can fix this — it is not a tuning problem but a property of the loop, and the output will keep doubling until something saturates or breaks. The stable range for this plant is <b>0 &lt; K &lt; ${sig(kCrit, 3)}</b>, and every design decision has to live inside it.`
          : `Stable: the response settles. <b>Watch what raising the gain does before it goes unstable</b> — the overshoot grows and the ringing takes longer to die, so the useful range of gain is a good deal narrower than the stable range. Somewhere around a third of the critical gain is where a real design would sit, and Part 4 makes that judgement quantitative by measuring how much room is left.`
    );
  }

  const k = knob({
    label: "gain K", min: 2, max: K_MAX, step: 1, value: 60,
    format: (v) => sig(v, 3),
    onInput: draw,
  });
  draw(60);

  return {
    stage: el("div.stack", null, bar.root, p.root),
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdK, rdCrit, rdW, rdRhp, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("routhArray", { no: 93, build: () => {
  const f = routhArray();
  return plate({
    no: 93, title: "Counting roots without finding them", tag: "interactive",
    label: "A Routh array built from a characteristic polynomial, with the first column marked.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "<b>The number of sign changes down the first column is the number of " +
      "roots in the right half-plane.</b> That is the whole test, and it is " +
      "worth appreciating what it avoids: the array never factors anything, so " +
      "it works on a fifth-order polynomial as readily as a cubic. Turn the " +
      "gain up on the first system and watch the s¹ entry cross zero at " +
      "<b>K = 160</b> — and at exactly that gain the row goes to zeros, which " +
      "is the array telling you there is a pair of roots on the imaginary axis " +
      "and handing you their frequency.",
  });
} });

register("stabilityRange", { no: 94, build: () => {
  const f = stabilityRange();
  return plate({
    no: 94, title: "What the range of gains sounds like", tag: "interactive",
    label: "A bar showing the stable range of gain, above the closed-loop step response at the selected gain.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The same plant, with Routh's answer drawn as a bar and its consequence " +
      "underneath. Below the critical gain the response settles; at it, the " +
      "ringing is permanent; above it, the output grows and keeps growing. " +
      "<b>Note how bad the response already is well before the boundary</b> — " +
      "stability is a yes-or-no test and a design needs much more than a yes. " +
      "That gap between &ldquo;stable&rdquo; and &ldquo;good&rdquo; is exactly " +
      "what gain and phase margin measure.",
  });
} });
