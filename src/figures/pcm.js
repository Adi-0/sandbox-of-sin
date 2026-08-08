/* ==========================================================================
   figures/pcm.js — Plates 121 and 122.

   Parts 2 and 3 sent a continuous message on a continuous carrier. This part
   turns the message into integers first, and the two plates are the two
   things that changes.

   Plate 121 is the bill. Digitising does not come free: a message needing
   B hertz as analog needs roughly n·B hertz once it is n bits per sample,
   and for telephony that is nearly a tenfold expansion. The plate makes the
   expansion visible and then shows the one way to buy it back — more levels
   per symbol — which sets up Shannon in Part 5.

   Plate 122 is companding, which is the part that is genuinely new here.
   Uniform quantising gives its best signal-to-noise to the loudest signal
   and nothing to a quiet one; a telephone carries mostly quiet ones. The
   plate shows the trade being made and where it pays off.

   Two things are deliberately NOT re-taught here, because they are already
   owned elsewhere and repeating them would blur both: sampling and aliasing
   belong to Signal Processing Part 2, and the LSB, quantisation error and
   the 6.02n + 1.76 figure belong to Electronics Part 6. This part uses them.

   The cast: the telephone channel, carried since Signal Processing Part 2 —
   3.4 kHz of speech, sampled at 8 kHz, eight bits a sample, 64 kbit/s. It
   is one DS0, and twenty-four of them plus a framing bit is a T1 at
   1.544 Mbit/s exactly.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed, sig } from "../lib/fmt.js";
import {
  pcmRate, pcmSnrUniform, pcmSnrCompanded, pcmSnrALaw,
  muLaw, aLaw, companderSlopeRatio,
} from "../lib/comms.js";

/* ==========================================================================
   Plate 121 — what a number costs in spectrum
   ========================================================================== */

const SOURCES = {
  phone: {
    label: "telephone speech",
    B: 3400, fs: 8000, bits: 8, unit: "kHz", scale: 1e3,
    story:
      "The channel this compilation has been carrying since Signal Processing " +
      "Part 2. Speech is band-limited to 3.4 kHz and sampled at 8 kHz — a " +
      "little above Nyquist, to leave the anti-alias filter somewhere to roll " +
      "off. Eight bits a sample makes <b>64 kbit/s, which is one DS0</b>, the " +
      "unit the entire telephone network is built in multiples of.",
  },
  cd: {
    label: "CD audio (one channel)",
    B: 20000, fs: 44100, bits: 16, unit: "kHz", scale: 1e3,
    story:
      "Full-bandwidth audio: 20 kHz of message, sampled at 44.1 kHz, sixteen " +
      "bits a sample. <b>The extra eight bits over telephony are not for " +
      "bandwidth — they are for dynamic range</b>, and they cost 48 dB of " +
      "quantisation noise headroom at a price of doubling the bit rate.",
  },
  probe: {
    label: "oversampled instrument",
    B: 500, fs: 2000, bits: 12, unit: "Hz", scale: 1,
    story:
      "A 500 Hz signal sampled at 2 kHz — <b>twice the Nyquist rate</b>, which " +
      "is common when the anti-alias filter has to be cheap. Notice what the " +
      "margin costs: the bit rate is proportional to f<sub>s</sub>, so " +
      "sampling twice as fast as you strictly need makes the link twice as " +
      "wide. <b>Oversampling is never free; it is a bandwidth purchase</b>, " +
      "and it is bought to save an analog filter.",
  },
};

function pcmBudget() {
  const p = new Plot({
    w: 620, h: 250, xr: [0, 16], yr: [0, 20],
    pad: { l: 56, r: 18, t: 18, b: 36 },
    label: "Required channel bandwidth, as a multiple of the message bandwidth, against bits per sample.",
  });

  const rdRate = readout({ key: "bit rate", value: "", tone: "x" });
  const rdBw = readout({ key: "channel", value: "", tone: "y" });
  const rdExp = readout({ key: "expansion", value: "", tone: "r" });
  const rdSnr = readout({ key: "SNR", value: "", tone: "y" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "phone", kn, km;

  /* Nyquist signalling: a symbol rate of 2B is the most a bandwidth B can
     carry, so Rb = 2B log2(M) and the bandwidth a bit rate demands is
     Rb / (2 log2 M). Expressed as a multiple of the message bandwidth B
     the whole thing collapses to (n/2)(fs/B)/log2(M) — which is exactly n
     when the source is sampled at Nyquist and sent in binary. */
  const expansion = (S, n, k) => (n * S.fs) / (2 * k * S.B);

  function draw() {
    const S = SOURCES[cur];
    const n = kn.value();
    const k = km.value();                       // bits per symbol; M = 2^k
    const M = 2 ** k;
    const Rb = pcmRate(S.fs, n);
    const bw = Rb / (2 * k);
    const exp = expansion(S, n, k);
    const snr = pcmSnrUniform(n);

    /* The y axis is fixed by the worst case the knobs can reach for this
       source, so the curves never leave the frame and the axis does not
       jump as the bits knob moves. */
    const top = Math.ceil(expansion(S, 16, 1) / 4) * 4 + 2;
    p.yr = [0, top];

    p.clear("curve", "label", "mark", "shade");
    p.grid({ xStep: 1, yStep: top > 24 ? 4 : 2 });
    p.axes({
      xLabel: "bits per sample  n", yLabel: "channel bandwidth ÷ message bandwidth",
      xStep: 2, yStep: top > 24 ? 8 : 4, origin: false,
    });

    for (const kk of [1, 2, 4]) {
      if (kk === k) continue;
      p.curve((x) => expansion(S, x, kk), { color: "muted", width: 1.2, dash: "4 3", samples: 120 });
      const yEnd = expansion(S, 16, kk);
      if (yEnd < top - 1.2) {
        p.text(16, yEnd, `M = ${2 ** kk}`, { color: "muted", size: 9.5, anchor: "end", dy: -5 });
      }
    }
    p.curve((x) => expansion(S, x, k), { color: "q-x", width: 2.8, samples: 160 });

    /* The analog reference. Only one is drawn: at these vertical scales a
       second line at 2 × B would sit on top of it, and the AM figure is
       already carried by Part 2. */
    p.line(0, 1, 16, 1, { color: "q-y", width: 1.4, dash: "5 4" });
    p.text(0.3, 1, "analog SSB = 1 × B", { color: "q-y", size: 10, anchor: "start", dy: -6 });

    p.line(n, 0, n, Math.min(exp, top), { color: "q-r", width: 1.1, dash: "3 3" });
    p.dot(n, Math.min(exp, top), { color: "q-r", r: 5 });

    rdRate.set(Rb >= 1e6 ? fixed(Rb / 1e6, 3) : num(Rb / 1e3, 1), Rb >= 1e6 ? " Mbit/s" : " kbit/s");
    rdBw.set(num(bw / S.scale, S.scale === 1 ? 0 : 2), ` ${S.unit}`);
    rdExp.set(fixed(exp, 2), " × B");
    rdSnr.set(fixed(snr, 1), " dB");

    const ds0 = cur === "phone" && n === 8 && k === 1;
    rdNote.set(
      `${S.story} <b>At ${num(n, 0)} bits a sample the link carries ${
        Rb >= 1e6 ? `${fixed(Rb / 1e6, 3)} Mbit/s` : `${num(Rb / 1e3, 1)} kbit/s`
      }</b>, and Nyquist's signalling limit says the narrowest channel that can carry it ${
        k === 1
          ? `in binary is <b>R<sub>b</sub>/2 = ${num(bw / S.scale, S.scale === 1 ? 0 : 2)} ${S.unit}</b>`
          : `at ${num(M, 0)} levels is <b>R<sub>b</sub>/(2 log₂M) = ${num(bw / S.scale, S.scale === 1 ? 0 : 2)} ${S.unit}</b>`
      } — <b>${fixed(exp, 2)} times</b> the ${num(S.B / S.scale, S.scale === 1 ? 0 : 1)} ${S.unit} the message occupied as analog. ${
        ds0
          ? `<b>This is the DS0: 8000 × 8 = 64 kbit/s exactly</b>, and 32 kHz of channel to carry 3.4 kHz of speech. Twenty-four of them plus one framing bit is 193 bits a frame, 1.544 Mbit/s — a T1. `
          : ""
      }${
        k === 1
          ? `<b>Binary PCM costs a factor of n in bandwidth</b>, near enough: the curve is a straight line through the origin with slope f<sub>s</sub>/2B. Nothing about a better filter or a cleverer code changes that — it is n bits, and each one needs room.`
          : `<b>Raising M is how the bandwidth is bought back.</b> Each doubling of M adds one bit per symbol and divides the bandwidth by log₂M — ${num(M, 0)} levels here, so ${num(k, 0)} bits a symbol and ${num(k, 0)}× narrower than binary. This looks like a free lunch and Part 5 explains why it is not: <b>packing more levels into the same voltage range makes them closer together</b>, and noise decides how close they may get.`
      } <b>Meanwhile the quantiser gives ${fixed(snr, 1)} dB</b>, rising 6.02 dB for every bit — so the exchange rate is <b>6 dB of quality per B hertz of spectrum</b>, and unlike FM it does not flatten out.`
    );
  }

  kn = knob({
    label: "bits per sample", min: 2, max: 16, step: 1, value: 8,
    format: (v) => `n = ${num(v, 0)} bits`,
    onInput: draw,
  });
  km = knob({
    label: "levels per symbol", min: 1, max: 4, step: 1, value: 1,
    format: (v) => `M = ${num(2 ** v, 0)}  (${num(v, 0)} bit${v > 1 ? "s" : ""}/symbol)`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "source",
    options: Object.keys(SOURCES).map((id) => ({ id, label: SOURCES[id].label })),
    value: "phone",
    onChange: (id) => {
      cur = id;
      kn.set(SOURCES[id].bits, false);         // set the slider, then draw once
      draw();
    },
  });
  draw();

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root, kn.root, km.root),
    readouts: readouts(rdRate, rdBw, rdExp, rdSnr, rdNote),
  };
}

/* ==========================================================================
   Plate 122 — companding
   ========================================================================== */

const LAWS = {
  mu255: {
    label: "µ-law, µ = 255",
    curve: (x) => muLaw(x, 255),
    flat: (n) => pcmSnrCompanded(n, 255),
    gain: 255 / Math.log(256),
    ratio: companderSlopeRatio(255),           // exactly 1 + µ
    story:
      "The North American standard. <b>µ = 255 gives the smallest signals 256 " +
      "times the resolution of the largest</b> — exactly 1 + µ, which is what " +
      "the compression curve's slope ratio works out to. Real codecs do not " +
      "compute a logarithm; they approximate it with <b>eight straight " +
      "chords, each twice as wide as the one below it</b>, which is precisely " +
      "the step pattern drawn on the left.",
  },
  a876: {
    label: "A-law, A = 87.6",
    curve: (x) => aLaw(x, 87.6),
    flat: (n) => pcmSnrALaw(n, 87.6),
    gain: 87.6 / (1 + Math.log(87.6)),
    ratio: 87.6,                               // A-law's slope ratio is exactly A
    story:
      "Europe's standard, reached by a different argument — a straight " +
      "segment below 1/A joined to a logarithm above it, rather than one " +
      "smooth curve. <b>It lands within 0.11 dB of µ-law at eight bits</b>, " +
      "which is worth knowing: the two halves of the world's telephone " +
      "network disagree about the formula and agree about the result. Its " +
      "plateau is a little higher and a little shorter than µ-law's.",
  },
  mu15: {
    label: "µ-law, µ = 15",
    curve: (x) => muLaw(x, 15),
    flat: (n) => pcmSnrCompanded(n, 15),
    gain: 15 / Math.log(16),
    ratio: companderSlopeRatio(15),
    story:
      "A gentler compression, used in the first generation of PCM carrier " +
      "systems. <b>It shows the trade in isolation</b>: less compression " +
      "keeps a higher plateau, because fewer levels have been taken away " +
      "from loud signals — but the plateau is much shorter, so a quiet " +
      "talker falls off it and is back to uniform behaviour.",
  },
};

const LEVELS = 8;                    // output divisions drawn, for legibility

/** x such that curve(x) = y. Monotone in [0,1], so bisection is safe. */
function preimage(curve, y) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (curve(mid) < y) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

function companding() {
  const cp = new Plot({
    w: 300, h: 244, xr: [0, 1], yr: [0, 1],
    pad: { l: 42, r: 16, t: 16, b: 38 },
    label: "The compression characteristic, with equally spaced output levels mapped back to the input steps they represent.",
  });
  const sp = new Plot({
    w: 300, h: 244, xr: [-60, 0], yr: [0, 80],
    pad: { l: 42, r: 14, t: 16, b: 38 },
    label: "Quantisation signal-to-noise against signal level, uniform against companded.",
  });

  /* The scenario buttons already name the law, so no readout repeats it. */
  const rdRatio = readout({ key: "resolution ratio", value: "", tone: "x" });
  const rdFlat = readout({ key: "companded", value: "", tone: "y" });
  const rdFull = readout({ key: "uniform, full scale", value: "", tone: "y" });
  const rdCross = readout({ key: "crossover", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "mu255", k;

  function draw() {
    const L = LAWS[cur];
    const n = k.value();
    const flat = L.flat(n);
    const full = pcmSnrUniform(n);
    const gainDb = 20 * Math.log10(L.gain);
    const cross = flat - full;                  // dBFS where companding starts winning
    const knee = cross - gainDb;                // dBFS where the plateau ends

    /* --- the compression curve ------------------------------------------ */
    cp.clear("curve", "label", "mark", "shade");
    cp.grid({ xStep: 0.1, yStep: 0.125 });
    cp.axes({
      xLabel: "input  |x|", yLabel: "output", xStep: 0.25, yStep: 0.25, origin: false,
    });
    cp.curve((x) => x, { color: "muted", width: 1.2, dash: "4 3", samples: 40 });
    cp.text(0.72, 0.72, "no companding", { color: "muted", size: 9.5, anchor: "end", dy: -5 });

    /* Equal output divisions, dropped back to the inputs they came from.
       The bunching at the left IS the mechanism, so it is drawn rather than
       described. */
    for (let i = 1; i <= LEVELS; i++) {
      const y = i / LEVELS;
      const x = preimage(L.curve, y);
      cp.line(0, y, x, y, { color: "grid", width: 1 });
      cp.line(x, 0, x, y, { color: "q-r-soft", width: 1.1 });
      cp.dot(x, y, { color: "q-r", r: 2.6, ring: false });
    }
    cp.curve(L.curve, { color: "q-x", width: 2.6, samples: 400 });

    const first = preimage(L.curve, 1 / LEVELS);
    const last = 1 - preimage(L.curve, (LEVELS - 1) / LEVELS);

    /* --- SNR against level ---------------------------------------------- */
    const uni = (lv) => Math.max(0, pcmSnrUniform(n, lv));
    const comp = (lv) => Math.max(0, Math.min(flat, pcmSnrUniform(n, lv) + gainDb));

    sp.clear("curve", "label", "mark", "shade");
    sp.grid({ xStep: 5, yStep: 10 });
    sp.axes({
      xLabel: "signal level (dBFS)", yLabel: "quantisation SNR (dB)",
      xStep: 20, yStep: 20, origin: false,
    });

    /* where speech actually sits: loud and quiet talkers span about 30 dB */
    sp.area(() => 80, -40, -10, { color: "q-y-soft", opacity: 0.5 });
    sp.text(-24, 60, "where speech lives", { color: "q-y", size: 9.5, anchor: "middle" });

    sp.curve(uni, { color: "muted", width: 1.8, dash: "5 4", samples: 200 });
    sp.curve(comp, { color: "q-x", width: 2.8, samples: 300 });
    sp.text(-2, Math.min(full, 78), "uniform", { color: "muted", size: 10, anchor: "end", dy: -6 });

    if (cross > -60 && flat < 78) {
      sp.dot(cross, flat, { color: "q-r", r: 4.5 });
      sp.line(cross, 0, cross, flat, { color: "q-r", width: 1.1, dash: "3 3" });
      /* Above and to the left: below the dot is the axis label's territory
         and to the right is where the "uniform" tag sits. */
      sp.text(cross, flat, `cross at ${fixed(cross, 1)} dBFS`, {
        color: "q-r", size: 9.5, anchor: "end", dx: -6, dy: -7,
      });
    }

    rdRatio.set(`${num(L.ratio, 1)} : 1`);
    rdFlat.set(fixed(flat, 1), " dB");
    rdFull.set(fixed(full, 1), " dB");
    rdCross.set(fixed(cross, 1), " dBFS");

    /* Both talkers, quoted from the same two functions the curves are drawn
       from, so the prose can never disagree with the picture. */
    const quiet = -30;
    rdNote.set(
      `${L.story} <b>The eight equal output divisions on the left map back to input steps ${sig(first, 2)} wide at the bottom and ${sig(last, 2)} wide at the top</b> — a ratio of ${num(L.ratio, 1)} to one, which is the mechanism in a single number. ` +
      `<b>At ${num(n, 0)} bits, uniform quantising reaches ${fixed(full, 1)} dB — but only for a signal at full scale.</b> ` +
      `Drop the level and it falls a decibel per decibel, because the noise is a fixed step size and only the signal is shrinking: ` +
      `a talker ${num(-quiet, 0)} dB down gets <b>${fixed(uni(quiet), 1)} dB</b>. ` +
      `Companding holds <b>${fixed(flat, 1)} dB</b> instead, flat, all the way down to about ${fixed(knee, 0)} dBFS. ` +
      `<b>The two cross at ${fixed(cross, 1)} dBFS</b> — above that uniform is better, below it companding is, ` +
      `and the shaded band is where real speech actually sits. <b>Almost none of it is above the crossover.</b> ` +
      `That is the whole decision: ${fixed(full - flat, 1)} dB was given up at full scale, which nothing uses, ` +
      `to gain ${fixed(comp(quiet) - uni(quiet), 1)} dB at ${num(-quiet, 0)} dB down, which everything uses. ` +
      `<b>Note that the crossover does not move when you change the bit count</b> — adding a bit lifts both curves ` +
      `by 6.02 dB together, so the choice of law and the choice of resolution are independent decisions.`
    );
  }

  k = knob({
    label: "bits per sample", min: 5, max: 12, step: 1, value: 8,
    format: (v) => `n = ${num(v, 0)} bits`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "companding law",
    options: Object.keys(LAWS).map((id) => ({ id, label: LAWS[id].label })),
    value: "mu255",
    onChange: (id) => { cur = id; draw(); },
  });
  draw();

  return {
    stage: el("div.duo", null, cp.root, sp.root),
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdRatio, rdFlat, rdFull, rdCross, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("pcmBudget", { no: 121, build: () => {
  const f = pcmBudget();
  return plate({
    no: 121, title: "What a number costs", tag: "interactive",
    label: "Required channel bandwidth as a multiple of message bandwidth, against bits per sample, for several symbol alphabets.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Digitising a message is not free, and the price is spectrum. Sampling " +
      "at f<sub>s</sub> and coding n bits a sample makes <b>R<sub>b</sub> = " +
      "n f<sub>s</sub></b> bits per second, and Nyquist says the narrowest " +
      "binary channel that can carry it is <b>R<sub>b</sub>/2</b> — which for " +
      "a Nyquist-sampled source is <b>exactly n times the message " +
      "bandwidth</b>. Telephone speech goes from 3.4 kHz to 32 kHz, a " +
      "ninefold expansion, and buys in return the one thing analog cannot " +
      "offer at any bandwidth: <b>a repeater that regenerates the signal " +
      "exactly</b> instead of amplifying its accumulated noise.",
  });
} });

register("companding", { no: 122, build: () => {
  const f = companding();
  return plate({
    no: 122, title: "Give the quiet signals the levels", tag: "interactive",
    label: "The companding characteristic beside quantisation SNR against signal level, uniform compared with companded.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "A uniform quantiser spaces its levels evenly, so the error is the same " +
      "size whatever the signal — which means <b>the signal-to-noise ratio " +
      "falls a decibel for every decibel the signal drops</b>. Full scale gets " +
      "50 dB at eight bits and a quiet talker 30 dB down gets 20. Companding " +
      "compresses before quantising and expands after, spending levels where " +
      "the signal actually is: <b>µ = 255 gives the smallest signals exactly " +
      "1 + µ = 256 times the resolution of the largest</b>. The result is a " +
      "flat 38 dB across the whole range instead of a peak of 50 that nothing " +
      "reaches. <b>Trading the best case away to lift the typical one is the " +
      "engineering decision here</b>, and the shaded band shows why it was " +
      "the right one.",
  });
} });
