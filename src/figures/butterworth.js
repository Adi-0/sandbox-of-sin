/* ==========================================================================
   figures/butterworth.js — Plates 108 and 109.

   Part 3 left a debt: the anti-alias filter the telephone channel needed was
   about 35 dB short, over less than a fifth of a decade. This part pays it,
   and the honest answer has two halves — more poles, or more sampling rate,
   and the second is almost always cheaper.

   Plate 108 is what order buys. Plate 109 turns that into the question an
   exam actually asks: given a stopband edge and a required attenuation, how
   many poles? It is the same arithmetic run backwards, and it makes the
   oversampling trade something you can move with a slider rather than a
   claim you have to take on trust.
   ========================================================================== */

import { el, knob, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { svg } from "../lib/dom.js";
import { num, fixed } from "../lib/fmt.js";
import { butterworth, orderFor, dB } from "../lib/dsp.js";

const V = (t) => `var(--${t})`;
const NMAX = 8;

/* ==========================================================================
   Plate 108 — what an extra pole buys
   ========================================================================== */

const XR = [-1, 2];                  // one decade below the corner, two above

function filterOrder() {
  const p = new Plot({
    w: 620, h: 268, xr: XR, yr: [-96, 8],
    pad: { l: 50, r: 18, t: 14, b: 32 },
    label: "Butterworth magnitude responses from first to eighth order, on a logarithmic frequency axis.",
  });

  const rdN = readout({ key: "order", value: "", tone: "x" });
  const rdAtC = readout({ key: "at the cutoff", value: "", tone: "y" });
  const rdAt2 = readout({ key: "one octave up", value: "", tone: "r" });
  const rdAt10 = readout({ key: "one decade up", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(n) {
    p.clear("curve", "label", "mark", "shade");
    p.grid({ xStep: 0.25, yStep: 12 });
    p.axes({ xLabel: "f / fc  (decades)", yLabel: "|H| (dB)", xStep: 1, yStep: 24, origin: false });

    p.line(XR[0], -3.01, XR[1], -3.01, { color: "muted", width: 1.2, dash: "5 4" });
    p.text(XR[0] + 0.04, -3.01, "−3 dB", { color: "muted", size: 10, anchor: "start", dy: -5 });
    p.line(0, -96, 0, -3.01, { color: "q-y", width: 1.3, dash: "3 3" });

    for (let k = 1; k <= NMAX; k++) {
      if (k === n) continue;
      p.curve((x) => dB(butterworth(k, 10 ** x)),
        { color: "muted", width: 1.1, dash: "4 3", samples: 400, opacity: 0.6 });
    }
    p.curve((x) => dB(butterworth(n, 10 ** x)), { color: "q-x", width: 2.9, samples: 700 });

    /* The asymptote, which is the thing being bought. It has to be stopped at
       the axis floor: at eight poles it would otherwise run to −323 dB on a
       −96 dB plot, and an SVG line is clipped by nothing. */
    const yFloor = p.yr[0];
    const xEnd = Math.min(XR[1], (-3.01 - yFloor) / (20 * n));
    p.line(0, -3.01, xEnd, -3.01 - 20 * n * xEnd, { color: "q-r", width: 1.3, dash: "6 4" });
    p.dot(0, -3.01, { color: "q-r", r: 5 });

    const a2 = dB(butterworth(n, 2)), a10 = dB(butterworth(n, 10));
    rdN.set(String(n), n === 1 ? " pole" : " poles");
    rdAtC.set("−3.01", " dB");
    rdAt2.set(fixed(a2, 1), " dB");
    rdAt10.set(fixed(a10, 1), " dB");

    rdNote.set(
      n === 1
        ? `<b>One pole: 20 dB per decade, and only ${fixed(-a2, 1)} dB one octave up.</b> This is the RC section of Part 3, and the plate shows how modest it really is — a factor of two in frequency buys you a factor of ${fixed(1 / butterworth(1, 2), 2)} in amplitude. Slide the order up and watch the skirt rotate.`
        : `<b>${n} poles give ${num(20 * n, 0)} dB per decade</b> once you are well past the corner, and ${fixed(-a10, 0)} dB at ten times the cutoff. <b>But notice what does not move: every order passes through −3.01 dB at exactly the cutoff.</b> That is the defining property of the Butterworth family and it is why f<sub>c</sub> is a single well-defined number rather than something that drifts with order. ${
            n >= 5
              ? `Also notice how little the <em>near</em> region improves: at one octave up this is ${fixed(-a2, 1)} dB against ${fixed(-dB(butterworth(n - 1, 2)), 1)} dB for ${n - 1} poles. <b>Poles are expensive and the transition band is where they are spent.</b>`
              : `The asymptote is drawn in red — the real curve is always above it near the corner and merges with it about a decade out.`
          }`
    );
  }

  const k = knob({
    label: "filter order", min: 1, max: NMAX, step: 1, value: 1,
    format: (v) => `${v} pole${v === 1 ? "" : "s"}`,
    onInput: draw,
  });
  draw(1);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdN, rdAtC, rdAt2, rdAt10, rdNote),
  };
}

/* ==========================================================================
   Plate 109 — how many poles does the specification need

   Same arithmetic, run backwards. This is the plate that makes the
   oversampling trade tangible: widening the transition band is the cheapest
   variable in the whole design and the slider shows it collapsing the order.
   ========================================================================== */

const DR = [-0.6, 1.3];              // decades either side of the cutoff
/* The axis has to start below the corner: with it starting AT the corner the
   passband mask has zero width and there is nothing to see it against. */

function filterDesign() {
  const p = new Plot({
    w: 620, h: 262, xr: DR, yr: [-84, 8],
    pad: { l: 50, r: 18, t: 14, b: 32 },
    label: "A filter specification drawn as passband and stopband masks, with the response of the lowest order that satisfies it.",
  });

  const rdRatio = readout({ key: "stopband at", value: "", tone: "x" });
  const rdNeed = readout({ key: "needs", value: "", tone: "x" });
  const rdExact = readout({ key: "poles required", value: "", tone: "y" });
  const rdUse = readout({ key: "so use", value: "", tone: "r" });
  const rdGot = readout({ key: "which delivers", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let ku, ka;

  function draw() {
    const u = ku.value() / 10;                 // stopband edge, × fc
    const A = ka.value();                      // dB required there
    p.clear("curve", "label", "mark", "shade");
    p.grid({ xStep: 0.1, yStep: 12 });
    p.axes({ xLabel: "f / fc  (decades)", yLabel: "|H| (dB)", xStep: 0.5, yStep: 24, origin: false });
    p.text(0, p.yr[0], "fc", { color: "muted", size: 10, anchor: "middle", dy: -4 });

    const exact = orderFor(A, u);
    const n = Math.max(1, Math.ceil(exact - 1e-9));
    const got = -dB(butterworth(n, u));

    /* The masks are the regions the response may NOT enter, and getting them
       the right way up matters: in the passband the curve must stay ABOVE
       −3 dB, so the forbidden zone is below it, and in the stopband it must
       stay BELOW −A, so the forbidden zone is above it. */
    const xs = Math.log10(u);
    const [YLO, YHI] = p.yr;
    p.add("shade", svg("rect", {
      x: p.x(DR[0]), y: p.y(-3.01),
      width: p.x(0) - p.x(DR[0]), height: p.y(YLO) - p.y(-3.01),
      fill: V("q-bad-soft"),
    }));
    p.add("shade", svg("rect", {
      x: p.x(xs), y: p.y(YHI),
      width: p.x(DR[1]) - p.x(xs), height: p.y(-A) - p.y(YHI),
      fill: V("q-bad-soft"),
    }));
    p.line(DR[0], -3.01, 0, -3.01, { color: "q-bad", width: 1.6 });
    p.line(0, -3.01, 0, YLO, { color: "q-bad", width: 1.3, dash: "4 3" });
    p.line(xs, -A, DR[1], -A, { color: "q-bad", width: 1.6 });
    p.line(xs, -A, xs, YHI, { color: "q-bad", width: 1.3, dash: "4 3" });
    p.text(DR[0], -3.01, "passband floor", {
      color: "q-bad", size: 10, anchor: "start", dx: 4, dy: 12,
    });
    p.text(DR[1], -A, "stopband ceiling", {
      color: "q-bad", size: 10, anchor: "end", dx: -3, dy: -6,
    });

    /* the order below it, to show that it genuinely fails */
    if (n > 1) {
      p.curve((x) => dB(butterworth(n - 1, 10 ** x)),
        { color: "muted", width: 1.3, dash: "4 3", samples: 400 });
      /* A high-order curve leaves the bottom of the axis long before the
         right-hand edge — at eleven poles it is past −280 dB by the last
         decade — so the label has to follow it off, not sit at DR[1] where
         its y would be hundreds of units below the frame. */
      const exit = (-YLO - 3.01) / (20 * (n - 1));
      const lx = Math.min(DR[1], exit);
      p.text(lx, Math.max(YLO + 5, dB(butterworth(n - 1, 10 ** lx))),
        `${n - 1} poles`, { color: "muted", size: 10, anchor: "end", dx: -4, dy: -5 });
    }
    p.curve((x) => dB(butterworth(n, 10 ** x)), { color: "q-x", width: 2.9, samples: 700 });
    p.dot(xs, dB(butterworth(n, u)), { color: "q-r", r: 5 });

    rdRatio.set(fixed(u, 2), " × fc");
    rdNeed.set(num(A, 0), " dB");
    rdExact.set(fixed(exact, 2));
    rdUse.set(String(n), n === 1 ? " pole" : " poles");
    rdGot.set(fixed(got, 1), " dB");

    const half = orderFor(A, 2 * u - 1 + 1e-12);
    rdNote.set(
      `<b>The specification needs ${fixed(exact, 2)} poles, so it needs ${n}</b> — order is an integer and you always round up. ${n} poles deliver ${fixed(got, 1)} dB at ${fixed(u, 2)} f<sub>c</sub>, which clears the ${num(A, 0)} dB requirement by ${fixed(got - A, 1)} dB. ${
        u < 1.6
          ? `<b>Look at what a narrow transition band costs.</b> The stopband starts at only ${fixed(u, 2)} times the cutoff, and that alone is why the order is this high. Push the stopband edge out and the order collapses — which, for an anti-alias filter, means <b>sampling faster</b>. That is nearly always cheaper than building poles.`
          : u > 4
            ? `<b>A generous transition band makes the filter almost free.</b> With the stopband this far out, ${n} pole${n === 1 ? "" : "s"} ${n === 1 ? "does" : "do"} the job — against ${Math.ceil(orderFor(A, 1.5) - 1e-9)} for the same ${num(A, 0)} dB at 1.5 × f<sub>c</sub>. This is exactly why practical converters oversample heavily and then filter in the digital domain, where a pole costs nothing but a multiply.`
            : `Each pole is roughly ${fixed(20 * Math.log10(u), 1)} dB here, since a pole gives 20 dB per decade and ${fixed(u, 2)}× is ${fixed(Math.log10(u), 3)} of a decade. <b>That is the exchange rate the whole design runs on</b>, and it is set by the <em>ratio</em> of the two edges, never by their absolute values.`
      }`
    );
  }

  ku = knob({
    label: "stopband edge", min: 12, max: 100, step: 1, value: 15,
    format: (v) => `${fixed(v / 10, 2)} × fc`,
    onInput: draw,
  });
  ka = knob({
    label: "attenuation needed", min: 10, max: 80, step: 1, value: 40,
    format: (v) => `${v} dB`,
    onInput: draw,
  });
  draw();

  return {
    stage: p.root,
    controls: el("div.controls", null, ku.root, ka.root),
    readouts: readouts(rdRatio, rdNeed, rdExact, rdUse, rdGot, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("filterOrder", { no: 108, build: () => {
  const f = filterOrder();
  return plate({
    no: 108, title: "What an extra pole buys", tag: "interactive",
    label: "Butterworth magnitude responses of first through eighth order, with the asymptotic slope marked.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Every order in this family passes through <b>−3.01 dB at exactly the " +
      "cutoff</b>, and that is what makes it the default choice: f<sub>c</sub> " +
      "means one thing regardless of how many poles you use, and the passband " +
      "is as flat as a passband can be made. What order buys is the " +
      "<b>skirt</b> — 20n dB per decade — and what it does not buy is much " +
      "improvement close in. <b>Compare one octave up against one decade up " +
      "as you slide</b>: the far field improves enormously and the near field " +
      "hardly at all, which is the whole difficulty of building a sharp filter.",
  });
} });

register("filterDesign", { no: 109, build: () => {
  const f = filterDesign();
  return plate({
    no: 109, title: "How many poles the specification needs", tag: "interactive",
    label: "A filter specification drawn as forbidden regions, with the lowest Butterworth order that avoids them.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The shaded regions are where the response is <b>not allowed to go</b>. " +
      "A design is finished when the curve misses both. Two numbers decide " +
      "everything — how far out the stopband starts, and how far down it has " +
      "to be — and only their <em>ratio</em> matters, never the absolute " +
      "frequencies. <b>Now move the stopband edge.</b> Widening the transition " +
      "band collapses the order far faster than relaxing the attenuation " +
      "does, and for an anti-alias filter widening it simply means sampling " +
      "faster. That is why real systems oversample: <b>sample rate is cheap " +
      "and poles are not.</b>",
  });
} });
