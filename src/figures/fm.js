/* ==========================================================================
   figures/fm.js — Plates 119 and 120.

   Amplitude modulation had one free parameter and a spectrum you could draw
   from memory: a carrier and two sidebands. Angle modulation has one free
   parameter and a spectrum that cannot be guessed at all — the sideband
   amplitudes are Bessel functions of the index, they extend in principle for
   ever, and the carrier itself can vanish.

   Plate 119 is that spectrum, and it is worth watching rather than reading
   about: slide β to 2.405 and the carrier disappears completely, which is
   both exactly true and the fastest way to convince someone that FM is not
   AM with a different knob.

   Plate 120 is the trade. Carson's rule prices the bandwidth, and the reason
   anyone pays it is a noise advantage that grows as β².

   The cast: Δf = 4 kHz against fm = 3 kHz gives β = 4/3 and a Carson
   bandwidth of 2(4 + 3) = 14 kHz.
   ========================================================================== */

import { el, knob, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";
import { besselJ, carson, fmPowerWithin } from "../lib/comms.js";

/* The first zero of J₀. At this index the carrier line vanishes entirely —
   a real effect, used historically to calibrate deviation meters. */
const CARRIER_NULL = 2.4048255576957728;

/* ==========================================================================
   Plate 119 — a spectrum you cannot guess
   ========================================================================== */

const NSB = 9;                        // sideband pairs drawn
const FC = 14;                        // carrier, in units of fm — low
                                      // enough that the frequency wobble is
                                      // visible, high enough that the lowest
                                      // drawn sideband stays above zero

function fmSpectrum() {
  const tp = new Plot({
    w: 300, h: 226, xr: [0, 1], yr: [-1.35, 1.35],
    pad: { l: 34, r: 14, t: 16, b: 32 },
    label: "The frequency-modulated carrier in the time domain.",
  });
  const sp = new Plot({
    w: 300, h: 226, xr: [FC - NSB - 0.8, FC + NSB + 0.8], yr: [0, 1.12],
    pad: { l: 38, r: 14, t: 16, b: 32 },
    label: "The line spectrum, with sideband amplitudes given by Bessel functions of the index.",
  });

  const rdBeta = readout({ key: "index β", value: "", tone: "x" });
  const rdCar = readout({ key: "carrier J₀(β)", value: "", tone: "y" });
  const rdPairs = readout({ key: "significant pairs", value: "", tone: "r" });
  const rdCarson = readout({ key: "carson bandwidth", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(v) {
    const beta = v / 100;
    /* Instantaneous phase is the integral of the frequency deviation, so a
       sinusoidal message gives a sinusoidal PHASE excursion of amplitude β. */
    const s = (t) => Math.cos(2 * Math.PI * FC * t + beta * Math.sin(2 * Math.PI * t));

    tp.clear("curve", "label", "mark", "shade");
    tp.grid({ xStep: 0.0625, yStep: 0.25 });
    tp.axes({ xLabel: "t", yLabel: "", xStep: 0.5, yStep: 0.5, origin: false });
    tp.curve((t) => Math.cos(2 * Math.PI * t), { color: "muted", width: 1.4, dash: "5 4", samples: 400 });
    tp.curve(s, { color: "q-x", width: 1.6, samples: 1600 });

    sp.clear("curve", "label", "mark", "shade");
    sp.grid({ xStep: 1, yStep: 0.25 });
    sp.axes({ xLabel: "f / fm", yLabel: "|Jn|", xStep: 5, yStep: 0.5, origin: false });

    let pairs = 0;
    for (let n = -NSB; n <= NSB; n++) {
      const a = Math.abs(besselJ(n, beta));
      if (a < 0.005) continue;
      if (n > 0 && a >= 0.01) pairs = n;
      const col = n === 0 ? "q-x" : "q-r";
      sp.line(FC + n, 0, FC + n, a, { color: col, width: 2.6 });
      sp.dot(FC + n, a, { color: col, r: 3, ring: false });
    }

    /* Carson's bandwidth, drawn as the span it actually covers */
    const bw = carson(beta, 1);                    // in units of fm
    const half = bw / 2;
    sp.line(FC - half, 1.06, FC + half, 1.06, { color: "q-y", width: 1.8 });
    for (const s2 of [1, -1]) sp.line(FC + s2 * half, 1.0, FC + s2 * half, 1.12, { color: "q-y", width: 1.8 });
    sp.text(FC, 1.06, "Carson", { color: "q-y", size: 10, anchor: "middle", dy: -5, bg: true });

    const j0 = besselJ(0, beta);
    const within = fmPowerWithin(beta, Math.floor(half));
    rdBeta.set(fixed(beta, 2));
    rdCar.set(fixed(j0, 3));
    rdPairs.set(String(pairs));
    rdCarson.set(fixed(bw, 1), " × fm");

    const atNull = Math.abs(beta - CARRIER_NULL) < 0.02;
    rdNote.set(
      beta < 0.32
        ? `<b>Narrowband FM.</b> Below about β = 0.3 only the first pair of sidebands is significant, so the spectrum looks exactly like AM's — a carrier and two sidebands — and the bandwidth is the same 2f<sub>m</sub>. <b>Narrowband FM buys none of FM's noise advantage</b>; it is used where a constant-amplitude signal is wanted for other reasons, such as feeding a saturating power amplifier.`
        : atNull
          ? `<b>The carrier has vanished.</b> J₀(2.405) = 0 exactly, so at this index there is <em>no power at all</em> at the carrier frequency — every watt is in the sidebands. This is not an approximation and it is not a trick of the drawing: it is the first zero of a Bessel function, and it was used to calibrate deviation meters by turning the modulation up until the carrier disappeared on a spectrum analyser. <b>Nothing in amplitude modulation does anything remotely like this.</b>`
          : `<b>β = ${fixed(beta, 2)} gives ${pairs} significant sideband pairs</b>, with amplitudes J<sub>n</sub>(β) — and notice they are not monotonic. Some sidebands are larger than the ones closer in, and the carrier itself is only ${fixed(Math.abs(j0), 3)} of its unmodulated height${j0 < 0 ? " (and inverted)" : ""}. <b>Unlike AM, the total power never changes</b>: the sidebands are not added on top of the carrier, they are carved out of it. Carson's bandwidth of ${fixed(bw, 1)}f<sub>m</sub> captures ${fixed(100 * within, 1)}% of it.`
    );
  }

  const k = knob({
    label: "modulation index", min: 5, max: 800, step: 1, value: 133,
    format: (v) => `β = ${fixed(v / 100, 2)}`,
    onInput: draw,
  });
  draw(133);

  return {
    stage: el("div.duo", null, tp.root, sp.root),
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdBeta, rdCar, rdPairs, rdCarson, rdNote),
  };
}

/* ==========================================================================
   Plate 120 — what the bandwidth buys
   ========================================================================== */

const FMSG = 3;                       // message frequency, kHz — the cast's 3

function carsonTrade() {
  const p = new Plot({
    w: 620, h: 250, xr: [0, 80], yr: [0, 190],
    pad: { l: 54, r: 18, t: 16, b: 34 },
    label: "Carson bandwidth against frequency deviation, with the amplitude-modulation reference for the same message.",
  });

  const rdDev = readout({ key: "deviation Δf", value: "", tone: "x" });
  const rdBeta = readout({ key: "index β", value: "", tone: "x" });
  const rdBw = readout({ key: "carson bandwidth", value: "", tone: "r" });
  const rdVsAm = readout({ key: "against AM", value: "", tone: "y" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(v) {
    const dev = v / 10;                            // kHz
    const beta = dev / FMSG;
    const bw = carson(dev, FMSG);
    const amBw = 2 * FMSG;

    p.clear("curve", "label", "mark", "shade");
    p.grid({ xStep: 5, yStep: 10 });
    p.axes({ xLabel: "deviation Δf (kHz)", yLabel: "bandwidth (kHz)", xStep: 20, yStep: 50, origin: false });

    p.curve((x) => carson(x, FMSG), { color: "q-x", width: 2.8, samples: 200 });
    p.line(0, amBw, 80, amBw, { color: "q-y", width: 1.6, dash: "5 4" });
    /* Anchored at the right-hand end: the marker dot lives at low deviation
       for most of the slider's travel, and a left-anchored label sat on it.
       The narrowband boundary is not drawn at all — beta < 0.3 is a sliver
       under 1 kHz on an 80 kHz axis, so it says nothing here and collided
       with the y-axis label. The note handles that regime instead. */
    p.text(79, amBw, `AM would need ${num(amBw, 0)} kHz`, {
      color: "q-y", size: 10.5, anchor: "end", dy: -6,
    });

    p.dot(dev, bw, { color: "q-r", r: 5 });
    p.line(dev, 0, dev, bw, { color: "q-r", width: 1.1, dash: "3 3" });

    rdDev.set(fixed(dev, 1), " kHz");
    rdBeta.set(fixed(beta, 2));
    rdBw.set(fixed(bw, 1), " kHz");
    rdVsAm.set(fixed(bw / amBw, 2), " ×");

    const cast = Math.abs(dev - 4) < 0.05;
    rdNote.set(
      beta < 0.3
        ? `<b>Narrowband: the bandwidth is essentially AM's.</b> With β below 0.3 only one sideband pair matters, Carson gives ${fixed(bw, 1)} kHz against AM's ${num(amBw, 0)} kHz, and <b>you are getting none of FM's noise advantage</b> — that advantage grows as β², and β is tiny here.`
        : `<b>Carson's rule: BW = 2(Δf + f<sub>m</sub>) = 2(${fixed(dev, 1)} + ${num(FMSG, 0)}) = ${fixed(bw, 1)} kHz</b>, which is ${fixed(bw / amBw, 2)} times what AM would need for the same message. ${
            cast
              ? `<b>These are the cast's numbers</b>: 4 kHz of deviation against a 3 kHz message gives β = 4/3 and 14 kHz of bandwidth. `
              : ""
          }<b>You are buying noise immunity with spectrum</b>, and the exchange rate is steep in your favour — the output signal-to-noise ratio improves roughly as β², so tripling the bandwidth buys nearly an order of magnitude in noise. That is why broadcast FM uses 75 kHz of deviation for a 15 kHz message: β = 5, 180 kHz of channel, and audio quality AM cannot approach. <b>Note what does not change: the transmitted power.</b> FM redistributes power among sidebands; it never adds any.`
    );
  }

  const k = knob({
    label: "frequency deviation", min: 2, max: 780, step: 2, value: 40,
    format: (v) => `Δf = ${fixed(v / 10, 1)} kHz`,
    onInput: draw,
  });
  draw(40);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdDev, rdBeta, rdBw, rdVsAm, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("fmSpectrum", { no: 119, build: () => {
  const f = fmSpectrum();
  return plate({
    no: 119, title: "A spectrum you cannot guess", tag: "interactive",
    label: "A frequency-modulated carrier and its Bessel-function line spectrum.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "AM put two sidebands either side of the carrier and that was the whole " +
      "spectrum. FM puts <b>infinitely many</b>, with amplitudes " +
      "J<sub>n</sub>(β) that rise and fall in no obvious order — and the " +
      "index β is the only thing that decides them. <b>Slide to β = 2.405 " +
      "and the carrier disappears entirely</b>, which is exactly true: it is " +
      "the first zero of J₀, and engineers once used it to calibrate " +
      "deviation meters by turning the modulation up until the carrier " +
      "vanished from the analyser. Note also that the total power never " +
      "moves. <b>FM carves the sidebands out of the carrier rather than " +
      "adding them to it.</b>",
  });
} });

register("carsonTrade", { no: 120, build: () => {
  const f = carsonTrade();
  return plate({
    no: 120, title: "Buying quiet with bandwidth", tag: "interactive",
    label: "Carson bandwidth against deviation, with the amplitude-modulation bandwidth for comparison.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Since the spectrum never truly ends, &ldquo;the bandwidth of an FM " +
      "signal&rdquo; needs a convention, and <b>Carson's rule is it: " +
      "2(Δf + f<sub>m</sub>)</b>, which holds about 98% of the power. Below " +
      "β ≈ 0.3 it collapses to AM's 2f<sub>m</sub> and FM is buying nothing; " +
      "above it, every extra kilohertz of deviation is a kilohertz of " +
      "channel. <b>What it buys is noise immunity growing as β²</b> — which " +
      "is why broadcast FM spends 180 kHz on a 15 kHz message and sounds the " +
      "way it does, and why the same trade is unavailable to AM at any price.",
  });
} });
