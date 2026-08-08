/* ==========================================================================
   figures/fourier.js — Plates 115 and 116.

   Signal Processing Part 1 built the Fourier *series*: a periodic signal is a
   sum of harmonics, and its spectrum is a set of spikes. This part supplies
   the *transform*, which is what a one-off pulse needs — a continuous
   spectrum rather than a line one — and the single relationship the rest of
   Communications leans on.

   That relationship is duality. Narrowing a pulse in time widens its
   spectrum by exactly the reciprocal factor, so the product of the two is
   fixed. Plate 115 makes it something you move with a slider; plate 116 turns
   it into the consequence that matters — a channel of finite bandwidth
   smears pulses into one another, which is why bit rate and bandwidth are
   the same conversation.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed, sig } from "../lib/fmt.js";
import { transformOf, shapeOf } from "../lib/comms.js";

/* ==========================================================================
   Plate 115 — the pair, and what happens when you squeeze one side
   ========================================================================== */

const SHAPES = {
  rect: {
    label: "rectangle",
    bw: (tau) => 1 / tau,                     // first null
    bwName: "first null", fr: 5.2, fStep: 2,
    story:
      "The rectangle and the sinc are the pair worth memorising, because a rectangle is what a single bit looks like. <b>Its transform never stops</b> — the sinc has nulls at every multiple of 1/τ but keeps ringing for ever, which is the formal reason a perfectly square pulse needs infinite bandwidth.",
  },
  tri: {
    label: "triangle",
    bw: (tau) => 1 / tau,
    bwName: "first null", fr: 5.2, fStep: 2,
    story:
      "A triangle is two rectangles convolved, so its transform is the sinc <em>squared</em>. Same first null, but the tails fall as 1/f² instead of 1/f — <b>exactly the corner-versus-jump rule from Signal Processing Part 1</b>, now for a single pulse rather than a periodic wave.",
  },
  exp: {
    label: "exponential",
    bw: (tau) => 1 / (2 * Math.PI * tau),     // half-power point
    bwName: "−3 dB point", fr: 1.3, fStep: 0.5,
    story:
      "The two-sided exponential transforms to a Lorentzian, 1/(1 + (2πfτ)²) — <b>which is exactly the RC low-pass magnitude from Signal Processing Part 3</b>. That is not a coincidence: an RC circuit's impulse response <em>is</em> a decaying exponential, and a transfer function is the transform of an impulse response.",
  },
  gauss: {
    label: "gaussian",
    bw: (tau) => 1 / (Math.PI * tau * Math.SQRT2),
    bwName: "1/e point", fr: 1.3, fStep: 0.5,
    story:
      "<b>The Gaussian is its own transform.</b> It is the one shape that looks the same in both domains, and it is the shape that achieves the smallest possible time-bandwidth product — no pulse can be more compact in both domains at once. That limit has a name in physics and a use here: it is why Gaussian pulse shaping is used where spectrum is scarce.",
  },
};

const TR = [-3.2, 3.2];

function transformPair() {
  const tp = new Plot({
    w: 300, h: 236, xr: TR, yr: [-0.08, 1.18],
    pad: { l: 36, r: 14, t: 16, b: 32 },
    label: "The pulse in the time domain, drawn at unit height.",
  });
  /* The spectrum is drawn normalised to its own peak. Plotting X(f) raw
     would need a y-axis reaching 5 to hold the Gaussian at maximum width,
     which leaves the rectangle at minimum width an invisible sliver — and
     the lesson here is the WIDTH trade, not the height. X(0) is a readout. */
  const fp = new Plot({
    w: 300, h: 236, xr: [-5.2, 5.2], yr: [-0.08, 1.18],
    pad: { l: 36, r: 14, t: 16, b: 32 },
    label: "The magnitude of its Fourier transform, normalised to its peak.",
  });

  const rdTau = readout({ key: "pulse width", value: "", tone: "x" });
  const rdPeak = readout({ key: "X(0)", value: "", tone: "y" });
  const rdBw = readout({ key: "bandwidth", value: "", tone: "r" });
  const rdProd = readout({ key: "width × bandwidth", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "rect", k;

  function draw() {
    const tau = k.value() / 100;
    const S = SHAPES[cur];
    const x = shapeOf[cur](tau);
    const X = transformOf[cur](tau);

    tp.clear("curve", "label", "mark", "shade");
    tp.grid({ xStep: 0.5, yStep: 0.25 });
    tp.axes({ xLabel: "t", yLabel: "x(t)", xStep: 2, yStep: 0.5, origin: false });
    tp.area(x, TR[0], TR[1], { color: "q-x-soft" });
    tp.curve(x, { color: "q-x", width: 2.6, samples: 700 });

    fp.clear("curve", "label", "mark", "shade");
    fp.xr = [-S.fr, S.fr];
    fp.grid({ xStep: S.fStep / 2, yStep: 0.25 });
    fp.axes({ xLabel: "f", yLabel: "|X| / X(0)", xStep: S.fStep, yStep: 0.5, origin: false });
    const peak = X(0);
    const Xn = (f) => X(f) / peak;
    fp.area(Xn, -S.fr, S.fr, { color: "q-y-soft" });
    fp.curve(Xn, { color: "q-y", width: 2.6, samples: 700 });

    const bw = S.bw(tau);
    if (bw <= S.fr) {
      for (const s of [1, -1]) {
        fp.line(s * bw, 0, s * bw, 0.62, { color: "q-r", width: 1.3, dash: "3 3" });
      }
      fp.dot(bw, Xn(bw), { color: "q-r", r: 4 });
    }

    rdTau.set(fixed(tau, 2), " s");
    rdPeak.set(fixed(X(0), 3));
    rdBw.set(bw > S.fr ? `> ${num(S.fr, 1)}` : fixed(bw, 3), ` Hz — ${S.bwName}`);
    rdProd.set(fixed(tau * bw, 3));

    rdNote.set(
      `${S.story} <b>Now watch the product.</b> Squeeze the pulse and its spectrum widens by exactly the same factor, so <b>width × bandwidth stays at ${fixed(tau * bw, 3)} no matter where the slider is</b>. That is not a property of this shape — it is the transform itself, and it is the reason a faster signal always needs more spectrum. There is no clever pulse that escapes it, only shapes that reach the limit more or less efficiently.`
    );
  }

  k = knob({
    label: "pulse width", min: 25, max: 200, step: 1, value: 100,
    format: (v) => `τ = ${fixed(v / 100, 2)} s`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "pulse shape",
    options: Object.keys(SHAPES).map((id) => ({ id, label: SHAPES[id].label })),
    value: "rect",
    onChange: (id) => { cur = id; draw(); },
  });
  draw();

  return {
    stage: el("div.duo", null, tp.root, fp.root),
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdTau, rdPeak, rdBw, rdProd, rdNote),
  };
}

/* ==========================================================================
   Plate 116 — what a narrow channel does to a bit stream

   The band-limited output is built by keeping only the harmonics below the
   channel's cutoff. Because the drawn pattern is periodic, that is exact
   rather than an approximation: a periodic signal genuinely is its harmonics,
   so truncating them genuinely is an ideal brick-wall filter.
   ========================================================================== */

const NB = 8;                         // bits per drawn period
const NS = 512;                       // samples per period

const PATTERNS = {
  mixed: { label: "mixed data", bits: [1, 0, 1, 1, 0, 0, 1, 0] },
  alt: { label: "alternating 1010", bits: [1, 0, 1, 0, 1, 0, 1, 0] },
};

/** Real DFT of one period of a pattern, computed once per pattern. */
function coefficients(bits) {
  const raw = Array.from({ length: NS }, (_, i) => bits[Math.floor((i / NS) * NB)]);
  const out = [];
  for (let k = 0; k <= NS / 2; k++) {
    let re = 0, im = 0;
    for (let i = 0; i < NS; i++) {
      const a = (-2 * Math.PI * k * i) / NS;
      re += raw[i] * Math.cos(a);
      im += raw[i] * Math.sin(a);
    }
    out.push([re / NS, im / NS]);
  }
  return { raw, coef: out };
}

const DFT = Object.fromEntries(
  Object.entries(PATTERNS).map(([id, p]) => [id, coefficients(p.bits)])
);

/** Rebuild the waveform from harmonics 0..kMax. u runs 0..1 over the period. */
function bandLimited(coef, kMax) {
  return (u) => {
    let y = coef[0][0];
    for (let k = 1; k <= kMax && k < coef.length; k++) {
      const a = 2 * Math.PI * k * u;
      y += 2 * (coef[k][0] * Math.cos(a) - coef[k][1] * Math.sin(a));
    }
    return y;
  };
}

function bandLimitedBits() {
  const p = new Plot({
    w: 620, h: 250, xr: [0, NB], yr: [-0.45, 1.5],
    pad: { l: 42, r: 16, t: 14, b: 34 },
    label: "A rectangular bit stream and the same stream after passing through a channel of limited bandwidth.",
  });

  const rdB = readout({ key: "channel bandwidth", value: "", tone: "x" });
  const rdRb = readout({ key: "bit rate", value: "", tone: "x" });
  const rdRatio = readout({ key: "B ÷ bit rate", value: "", tone: "y" });
  const rdEye = readout({ key: "worst margin", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "mixed", k;

  function draw() {
    /* The knob is the channel bandwidth as a multiple of the bit rate.
       Harmonics of the pattern sit at multiples of Rb/NB, so a bandwidth of
       r·Rb admits harmonics up to r·NB. */
    const r = k.value() / 100;
    const kMax = Math.max(0, Math.floor(r * NB));
    const { raw, coef } = DFT[cur];
    const bits = PATTERNS[cur].bits;
    const y = bandLimited(coef, kMax);

    p.clear("curve", "label", "mark", "shade");
    p.grid({ xStep: 0.5, yStep: 0.25 });
    p.axes({ xLabel: "bit period", yStep: 0.5, yLabel: "", xStep: 2, origin: false });

    /* the decision threshold, and the bit boundaries */
    p.line(0, 0.5, NB, 0.5, { color: "muted", width: 1.2, dash: "5 4" });
    p.text(0.06, 0.5, "decide here", { color: "muted", size: 10, anchor: "start", dy: -5 });
    for (let i = 1; i < NB; i++) p.line(i, -0.45, i, 1.5, { color: "grid", width: 1 });

    p.curve((t) => raw[Math.min(NS - 1, Math.floor((t / NB) * NS))],
      { color: "muted", width: 1.4, dash: "5 4", samples: 900 });
    p.curve((t) => y(t / NB), { color: "q-r", width: 2.8, samples: 900 });

    /* how close the mid-bit value comes to the threshold — the eye margin */
    let worst = Infinity;
    bits.forEach((b, i) => {
      const val = y((i + 0.5) / NB);
      const margin = b ? val - 0.5 : 0.5 - val;
      worst = Math.min(worst, margin);
      p.dot(i + 0.5, val, { color: margin > 1e-9 ? "q-r" : "q-bad", r: 4 });
    });
    const open = worst > 1e-9;

    rdB.set(fixed(r, 2), " × Rb");
    rdRb.set("1", " bit/period");
    rdRatio.set(fixed(r, 2));
    rdEye.set(fixed(Math.max(worst, 0), 3), open ? " open" : " CLOSED");

    /* The verdict is read off the MEASURED margin, never off the bandwidth
       ratio. The mixed pattern happens to survive below Rb/2 because it is
       easy data; only the alternating pattern actually tests the limit, and
       saying otherwise would put the prose at odds with the readout. */
    rdNote.set(
      kMax === 0
        ? `<b>Nothing but the average survives.</b> The channel passes only DC, so the output is a flat line at the mean of the pattern and every bit is indistinguishable from every other.`
        : !open
          ? cur === "alt"
            ? `<b>Closed, and exactly so.</b> Alternating bits are the fastest thing this stream can do: 1010 repeating is a square wave at <b>half the bit rate</b>, and a channel narrower than Rb/2 does not pass its fundamental at all. Every mid-bit sample sits precisely on the threshold, so the receiver has nothing to decide with. <b>This is Nyquist's limit, arrived at by measurement</b> — push the bandwidth to 0.50 and the eye snaps open.`
            : `<b>Closed.</b> The pulses have spread so far that they overlap their neighbours — <b>intersymbol interference</b> — and a mid-bit sample no longer depends only on its own bit. The marked dots have crossed the threshold, which is a bit error caused by <em>bandwidth alone</em>, with no noise anywhere in the picture.`
          : cur === "alt" && r < 0.75
            ? `<b>Open, with ${fixed(worst, 3)} of margin, and it opened the instant the bandwidth reached Rb/2.</b> Only one harmonic is getting through — the fundamental of the 1010 square wave — and one sinusoid per two bits is genuinely enough, because the receiver samples at the peaks. <b>That is the whole content of Nyquist's signalling limit</b>, and Part 5 states it as a formula.`
            : r < 1
              ? `<b>Rounded, but the decisions hold</b> — every mid-bit sample is on the correct side, with ${fixed(worst, 3)} to spare. This is the useful regime, and the point worth taking from it is that <b>the waveform no longer looks like the data and does not need to</b>. A receiver samples once per bit and asks which side of a line it is on. ${cur === "mixed" ? "<b>Try the alternating pattern.</b> This one survives below Rb/2 only because it is easy data; the worst case does not." : ""}`
              : `<b>Comfortably wide, and the edges are nearly square.</b> Every extra harmonic sharpens the corners and buys nothing at the sampling instants — the decisions were already correct at a fraction of this bandwidth. <b>Spectrum spent here is spectrum wasted</b>, which is exactly why real systems shape their pulses instead of sending true rectangles.`
    );
  }

  k = knob({
    label: "channel bandwidth", min: 0, max: 400, step: 2, value: 150,
    format: (v) => `${fixed(v / 100, 2)} × bit rate`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "data",
    options: Object.keys(PATTERNS).map((id) => ({ id, label: PATTERNS[id].label })),
    value: "mixed",
    onChange: (id) => { cur = id; draw(); },
  });
  draw();

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdB, rdRb, rdRatio, rdEye, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("transformPair", { no: 115, build: () => {
  const f = transformPair();
  return plate({
    no: 115, title: "Squeeze one side, the other spreads", tag: "interactive",
    label: "A pulse and the magnitude of its Fourier transform, side by side.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The Fourier <em>series</em> of Signal Processing Part 1 described a " +
      "repeating signal with a set of spikes. A single pulse does not repeat, " +
      "and its spectrum is <b>continuous</b> — that is the whole difference " +
      "between the series and the transform. What is worth carrying from this " +
      "plate is not any one pair but the relationship between them: " +
      "<b>width × bandwidth is constant</b>. Halve the pulse and you double " +
      "the spectrum it occupies, every time, for every shape. Everything in " +
      "this module about how fast a link can run is that sentence with units " +
      "attached.",
  });
} });

register("bandLimitedBits", { no: 116, build: () => {
  const f = bandLimitedBits();
  return plate({
    no: 116, title: "What a narrow channel does to bits", tag: "interactive",
    label: "A rectangular bit stream and the rounded waveform that survives a band-limited channel, with the mid-bit decision points marked.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Grey is what was sent, red is what arrives, and the dots are what the " +
      "receiver actually looks at — <b>one sample in the middle of each bit, " +
      "compared against a threshold</b>. Slide the bandwidth down. The " +
      "waveform stops resembling the data long before any bit is lost, which " +
      "is the point: <b>fidelity of shape is not the requirement, correctness " +
      "of decision is.</b> Keep going and the pulses spread into their " +
      "neighbours until a dot lands on the wrong side of the line — a bit " +
      "error with no noise involved at all. That failure is " +
      "<b>intersymbol interference</b>, and avoiding it is what sets the " +
      "minimum bandwidth in Part 5.",
  });
} });
