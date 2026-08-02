/* ==========================================================================
   figures/digital-filters.js — Plates 110 and 111.

   Part 4 ended by arguing that the sharp filtering should happen after the
   converter, where a pole costs a multiply rather than a precision component.
   This part is what that actually looks like: a filter that is a line of
   arithmetic run once per sample.

   Plate 110 runs one. Plate 111 hits it with an impulse, which is the single
   most informative thing you can do to a filter — the response tells you
   whether it is FIR or IIR, what its DC gain is, and whether it is stable,
   all from one picture. Sliding the feedback past one blows it up, and that
   is the boundary Part 6 turns into the unit circle.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";
import { runFilter, impulseResponse } from "../lib/dsp.js";
import { makeRng } from "../lib/rng.js";

const N = 44;                       // samples drawn

/** Stems at integer sample indices — the only honest way to draw a sequence. */
function seq(p, ys, { color = "q-x", r = 3.2, width = 2, from = 0 } = {}) {
  ys.forEach((y, i) => {
    const n = i + from;
    if (n < p.xr[0] || n > p.xr[1]) return;
    const yc = Math.max(p.yr[0], Math.min(p.yr[1], y));
    p.line(n, 0, n, yc, { color, width });
    p.dot(n, yc, { color, r, ring: false });
  });
}

/* ==========================================================================
   Plate 110 — a filter that is a line of arithmetic
   ========================================================================== */

/* A noisy step: the input that makes smoothing visible as smoothing rather
   than as a vague change of shape. Seeded, so it does not shimmer as the
   slider moves — the whole point is to compare outputs on identical input. */
const rng = makeRng(20250802);
const NOISE = Array.from({ length: N }, () => (rng.next() - 0.5) * 0.55);
const INPUT = NOISE.map((e, n) => (n < 10 ? 0 : 1) + e);

const FILTERS = {
  ma: {
    label: "moving average",
    kind: "FIR",
    coef: (v) => {
      const L = Math.max(2, Math.round(v));
      return { b: new Array(L).fill(1 / L), a: [1], L };
    },
    eqn: ({ L }) => `y[n] = (x[n] + x[n−1] + … + x[n−${L - 1}]) / ${L}`,
    story:
      "<b>No feedback at all</b> — the output is built only from inputs, so this is an <b>FIR</b> filter. Each output is the plain average of the last few samples, and lengthening the window smooths harder while delaying more.",
  },
  ema: {
    label: "exponential",
    kind: "IIR",
    coef: (v) => {
      const a = Math.min(0.95, v / 100);
      return { b: [1 - a], a: [1, -a], aa: a };
    },
    eqn: ({ aa }) => `y[n] = ${fixed(aa, 2)}·y[n−1] + ${fixed(1 - aa, 2)}·x[n]`,
    story:
      "<b>One multiply, one add, and one remembered number.</b> Because the output depends on its own past this is an <b>IIR</b> filter, and that single feedback term gives it a memory that formally never ends.",
  },
};

function differenceEqn() {
  const p = new Plot({
    w: 620, h: 262, xr: [-0.5, N - 0.5], yr: [-0.55, 1.75],
    pad: { l: 44, r: 16, t: 14, b: 32 },
    label: "A noisy step input drawn as stems, with the filtered output over it.",
  });

  const rdEq = readout({ key: "the filter", value: "" });
  rdEq.root.classList.add("wide");
  const rdKind = readout({ key: "type", value: "", tone: "x" });
  const rdGain = readout({ key: "dc gain", value: "", tone: "y" });
  const rdDelay = readout({ key: "settling", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "ma", k;

  function draw() {
    const F = FILTERS[cur];
    const c = F.coef(k.value());
    const y = runFilter(c.b, c.a, INPUT);
    p.clear("curve", "label", "mark", "shade");

    p.grid({ xStep: 2, yStep: 0.25 });
    p.axes({ xLabel: "sample n", yLabel: "", xStep: 10, yStep: 0.5, origin: false });
    p.line(-0.5, 1, N - 0.5, 1, { color: "muted", width: 1.1, dash: "5 4" });

    seq(p, INPUT, { color: "muted", r: 2.2, width: 1 });
    seq(p, y, { color: "q-r", r: 3.2, width: 2 });

    /* how long after the step until the output is within 5% and stays there */
    let settle = null;
    for (let n = 10; n < N; n++) {
      if (y.slice(n).every((v) => Math.abs(v - 1) < 0.12)) { settle = n - 10; break; }
    }
    const dc = c.b.reduce((s, v) => s + v, 0) / c.a.reduce((s, v) => s + v, 0);

    rdEq.set(F.eqn(c));
    rdKind.set(F.kind, F.kind === "FIR" ? " — no feedback" : " — has feedback");
    rdGain.set(fixed(dc, 3));
    rdDelay.set(settle == null ? "—" : String(settle), settle == null ? "" : " samples");

    rdNote.set(
      `${F.story} <b>The DC gain is ${fixed(dc, 2)}</b>, which is what you want from a smoother — it must not change the level it is smoothing, and you can check it by hand: ${
        cur === "ma"
          ? `${c.L} coefficients of 1/${c.L} sum to exactly 1.`
          : `${fixed(1 - c.aa, 2)}/(1 − ${fixed(c.aa, 2)}) = 1.`
      } <b>Notice the cost of smoothing.</b> The noise gets smaller and the step gets slower — those are the same knob, and no choice of coefficients separates them. ${
        cur === "ma"
          ? `An ${c.L}-point average delays the edge by about ${fixed((c.L - 1) / 2, 1)} samples, which is exact and the same at every frequency: <b>an FIR with symmetric coefficients has perfectly linear phase</b>, the property Bessel filters strain for in the analog world and get here for free.`
          : `The exponential filter reaches the new level asymptotically rather than exactly, and it needs only <b>one</b> stored number to do it against the ${Math.round(1 / (1 - c.aa))} an equivalent moving average would need. <b>That efficiency is what IIR buys</b>, and Part 6 shows what it costs.`
      }`
    );
  }

  k = knob({
    label: "smoothing", min: 2, max: 95, step: 1, value: 6,
    format: (v) => (cur === "ma" ? `${Math.max(2, Math.round(v))}-point` : `a = ${fixed(Math.min(0.95, v / 100), 2)}`),
    onInput: draw,
  });
  const sc = scenarios({
    label: "filter",
    options: Object.keys(FILTERS).map((id) => ({ id, label: FILTERS[id].label })),
    value: "ma",
    onChange: (id) => { cur = id; k.set(id === "ma" ? 6 : 80); },
  });
  draw();

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdEq, rdKind, rdGain, rdDelay, rdNote),
  };
}

/* ==========================================================================
   Plate 111 — the impulse response, and when it never stops
   ========================================================================== */

function impulseView() {
  const p = new Plot({
    w: 620, h: 254, xr: [-0.5, N - 0.5], yr: [-0.85, 1.35],
    pad: { l: 44, r: 16, t: 14, b: 32 },
    label: "The impulse response of the selected filter, drawn as stems at each sample.",
  });

  const rdKind = readout({ key: "type", value: "", tone: "x" });
  const rdLen = readout({ key: "response length", value: "", tone: "y" });
  const rdGain = readout({ key: "dc gain", value: "", tone: "y" });
  const rdStab = readout({ key: "stable", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "fir", k;

  function draw() {
    const v = k.value();
    let b, a, kind;
    if (cur === "fir") {
      const L = Math.max(2, Math.round(v / 8));
      b = new Array(L).fill(1 / L); a = [1]; kind = "FIR";
    } else {
      const r = v / 100;                        // feedback coefficient
      b = [1 - Math.min(r, 0.99)]; a = [1, -r]; kind = "IIR";
    }
    const h = impulseResponse(b, a, N);
    p.clear("curve", "label", "mark", "shade");
    p.grid({ xStep: 2, yStep: 0.25 });
    p.axes({ xLabel: "sample n", yLabel: "h[n]", xStep: 10, yStep: 0.5, origin: false });
    seq(p, h, { color: cur === "fir" ? "q-x" : (v / 100 <= 1 ? "q-r" : "q-bad"), r: 3.4, width: 2.2 });

    const nz = h.filter((y) => Math.abs(y) > 1e-6).length;
    const grew = Math.abs(h[N - 1]) > Math.abs(h[1]) + 1e-9;
    const rr = v / 100;
    const dc = b.reduce((s, x) => s + x, 0) / a.reduce((s, x) => s + x, 0);

    rdKind.set(kind, cur === "fir" ? " — no feedback" : " — has feedback");
    rdLen.set(cur === "fir" ? String(nz) : (rr < 1 ? "infinite" : "infinite"),
      cur === "fir" ? " samples" : " (decaying)");
    if (cur === "iir" && rr >= 1) rdLen.set("infinite", rr > 1 ? " (growing)" : " (never decays)");
    rdGain.set(cur === "iir" && rr >= 1 ? "∞" : fixed(dc, 3));
    rdStab.set(cur === "fir" ? "always" : rr < 1 ? "yes" : "no");

    rdNote.set(
      cur === "fir"
        ? `<b>An FIR filter's impulse response <em>is</em> its coefficient list.</b> Feed in a single 1 and each coefficient walks out in turn, then the output is zero for ever — here after exactly ${nz} samples, which is why the F stands for <b>finite</b>. Two consequences worth keeping: <b>an FIR cannot be unstable</b>, because with no feedback there is no path for an output to grow itself, and its length is a design choice rather than a consequence.`
        : rr < 0.999
          ? `<b>An IIR response never actually reaches zero</b> — each sample is ${fixed(rr, 2)} times the one before, so it decays geometrically and only <em>approaches</em> zero. That is the I in infinite. It is entirely usable: after ${Math.ceil(Math.log(0.01) / Math.log(Math.max(rr, 1e-9)))} samples it is under 1% of its peak. <b>The economy is remarkable</b> — one multiply and one stored number produce a response that an FIR would need dozens of taps to imitate.`
          : rr < 1.001
            ? `<b>Exactly at the boundary.</b> With a feedback coefficient of 1 the filter never forgets anything: this is a running accumulator, and its impulse response is a constant that goes on for ever. The DC gain is infinite — feed it any constant input and the output grows without limit. <b>This is marginal stability</b>, and Part 6 puts it exactly on the unit circle.`
            : `<b>Unstable.</b> Every sample is ${fixed(rr, 2)} times the one before, so the response <em>grows</em> — from a single impulse, with no further input at all. Nothing about the arithmetic complains; the numbers simply get bigger until they overflow. <b>This is the whole reason IIR filters need a stability test</b>, and FIR filters do not. The condition here is just |a| &lt; 1, and Part 6 shows it is the one-dimensional shadow of a circle in the complex plane.`
    );
  }

  k = knob({
    label: "parameter", min: 16, max: 115, step: 1, value: 64,
    format: (v) => (cur === "fir" ? `${Math.max(2, Math.round(v / 8))} taps` : `a = ${fixed(v / 100, 2)}`),
    onInput: draw,
  });
  const sc = scenarios({
    label: "filter",
    options: [
      { id: "fir", label: "FIR — moving average" },
      { id: "iir", label: "IIR — one feedback term" },
    ],
    value: "fir",
    onChange: (id) => { cur = id; k.set(id === "fir" ? 64 : 85); },
  });
  draw();

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdKind, rdLen, rdGain, rdStab, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("differenceEqn", { no: 110, build: () => {
  const f = differenceEqn();
  return plate({
    no: 110, title: "A filter made of arithmetic", tag: "interactive",
    label: "A noisy step and the output of a digital smoothing filter applied to it.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Grey stems are the input, coloured stems the output, and the filter " +
      "between them is the one line printed in the first readout. That line " +
      "is the entire implementation — <b>no components, no tolerances, no " +
      "drift</b>, and it behaves identically on every device that runs it. " +
      "The division is the one that matters for the rest of the module: " +
      "<b>if the equation refers to past outputs it has feedback and is " +
      "IIR; if it refers only to past inputs it is FIR.</b> Watch the " +
      "trade as you slide — less noise always means a slower edge.",
  });
} });

register("impulseView", { no: 111, build: () => {
  const f = impulseView();
  return plate({
    no: 111, title: "Hit it with a single one", tag: "interactive",
    label: "The impulse response of an FIR and of an IIR filter, with the IIR's feedback taken past the point of stability.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "One input sample of 1, everything else 0, and the output tells you " +
      "almost everything. <b>For an FIR the response is literally the " +
      "coefficient list, and then it stops</b> — which is why an FIR can " +
      "never be unstable. For an IIR it decays geometrically and never " +
      "formally ends. <b>Now push the feedback coefficient past 1.</b> The " +
      "response grows from a single impulse with no further input, and no " +
      "part of the arithmetic objects. That failure is what the next part " +
      "gives a geometry to.",
  });
} });
