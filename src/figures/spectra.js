/* ==========================================================================
   figures/spectra.js — Plates 102 and 103.

   Part 1 exists so that Part 2 has a frequency axis to fold. Everything here
   is in service of one sentence: a signal has a highest frequency, and that
   number is what sampling has to respect.

   Plate 102 builds a wave out of sinusoids, so the spectrum is something the
   reader watched being assembled rather than a claim. Plate 103 cuts the
   spectrum off and shows what survives — which is simultaneously the
   definition of bandwidth, the first filter in the compilation, and the
   f_max that Part 2 consumes.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";
import { harmonics, partialSum } from "../lib/dsp.js";

/* -------------------------------------------------------------------------
   the three waves, each with the closed form its Fourier series converges to
   ------------------------------------------------------------------------- */

const fr = (x) => x - Math.floor(x);

const WAVES = {
  square: {
    label: "square",
    ideal: (t) => (fr(t) < 0.5 ? 1 : -1),
    decay: "1/k",
    only: "odd harmonics only",
    story:
      "A square wave is <b>odd harmonics only, falling as 1/k</b>. The even ones are absent because the second half of the wave is the exact negative of the first, and that symmetry kills them. <b>It has a jump, so it needs infinitely many terms</b> — the series never fully arrives.",
  },
  sawtooth: {
    label: "sawtooth",
    ideal: (t) => 1 - 2 * fr(t),
    decay: "1/k",
    only: "every harmonic",
    story:
      "A sawtooth uses <b>every harmonic, falling as 1/k</b> — no symmetry removes any of them. It jumps too, so like the square it converges slowly and rings at the edge.",
  },
  triangle: {
    label: "triangle",
    ideal: (t) => {
      const u = fr(t);
      return u < 0.25 ? 4 * u : u < 0.75 ? 2 - 4 * u : 4 * u - 4;
    },
    decay: "1/k²",
    only: "odd harmonics only",
    story:
      "A triangle is odd harmonics again, but falling as <b>1/k²</b> rather than 1/k — and that one change in the exponent is the whole lesson. It has corners but <b>no jumps</b>, so the high harmonics are far smaller and a handful of terms is already a good triangle.",
  },
};

const NMAX = 25;

/** A line spectrum is stems, not bars: a spike at each harmonic.
    Nothing clips an SVG <line>, so harmonics past the end of the axis have to
    be dropped here rather than left to the viewBox — plate 103's axis stops
    well short of the 25th harmonic. */
function stems(p, amps, { cut = Infinity, xOf = (k) => k } = {}) {
  amps.forEach((a, i) => {
    const k = i + 1;
    if (a <= 1e-6) return;
    const on = k <= cut;
    const x = xOf(k);
    if (x > p.xr[1] || x < p.xr[0]) return;
    p.line(x, 0, x, a, {
      color: on ? "q-x" : "muted",
      width: on ? 2.6 : 1.2,
      dash: on ? null : "2 3",
    });
    p.dot(x, a, { color: on ? "q-x" : "muted", r: on ? 3.6 : 2.4, ring: false });
  });
}

/* ==========================================================================
   Plate 102 — the wave, assembled
   ========================================================================== */

function spectrumBuilder() {
  const tp = new Plot({
    w: 620, h: 216, xr: [0, 2], yr: [-1.55, 1.55],
    pad: { l: 46, r: 18, t: 12, b: 30 },
    label: "One periodic wave and the partial sum of its harmonics, over two periods.",
  });
  const sp = new Plot({
    w: 620, h: 168, xr: [0, NMAX + 0.6], yr: [0, 1.45],
    pad: { l: 46, r: 18, t: 12, b: 32 },
    label: "The amplitude of each harmonic, drawn as a line spectrum.",
  });

  const rdTerms = readout({ key: "terms in the sum", value: "", tone: "x" });
  const rdTop = readout({ key: "highest harmonic", value: "", tone: "y" });
  const rdAmp = readout({ key: "its amplitude", value: "", tone: "y" });
  const rdErr = readout({ key: "rms error", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "square";

  function draw(n) {
    const w = WAVES[cur];
    const amps = harmonics(cur, NMAX);
    const f = partialSum(cur, n, 1);
    tp.clear("curve", "label", "mark", "shade");
    sp.clear("curve", "label", "mark", "shade");

    /* --- time ----------------------------------------------------------- */
    tp.grid({ xStep: 0.25, yStep: 0.5 });
    tp.axes({ xLabel: "t / T", yLabel: "amplitude", xStep: 0.5, yStep: 1, origin: false });
    tp.curve(w.ideal, { color: "muted", width: 1.4, dash: "5 4", samples: 900 });
    tp.curve(f, { color: "q-r", width: 2.6, samples: 900 });

    /* --- spectrum -------------------------------------------------------- */
    sp.grid({ xStep: 1, yStep: 0.25 });
    sp.axes({ xLabel: "harmonic number k", yLabel: "Ak", xStep: 5, yStep: 0.5, origin: false });
    stems(sp, amps, { cut: n });
    if (n < NMAX) {
      sp.line(n + 0.5, 0, n + 0.5, 1.45, { color: "q-bad", width: 1.3, dash: "4 3" });
      sp.text(n + 0.5, 1.45, "cut here", {
        color: "q-bad", size: 10, anchor: "start", dx: 5, dy: 9,
      });
    }

    /* --- what it cost ---------------------------------------------------- */
    const used = amps.slice(0, n).filter((a) => a > 1e-6).length;
    let top = 0;
    for (let k = 1; k <= n; k++) if (amps[k - 1] > 1e-6) top = k;
    let rms = 0, peak = 0, m = 0;
    for (let i = 0; i < 2000; i++) {
      const t = i / 2000;
      const near = cur !== "triangle" && [0, 0.5, 1].some((j) => Math.abs(t - j) < 0.012);
      peak = Math.max(peak, f(t));
      if (near) continue;
      rms += (f(t) - w.ideal(t)) ** 2; m++;
    }
    rms = Math.sqrt(rms / m);

    rdTerms.set(String(used), used === 1 ? " sinusoid" : " sinusoids");
    rdTop.set(top ? `k = ${top}` : "—", top ? ` = ${top}f₀` : "");
    rdAmp.set(top ? fixed(amps[top - 1], 4) : "—");
    rdErr.set(fixed(rms, 4));

    const gibbs = cur !== "triangle" && n >= 3 ? ((peak - 1) / 2) * 100 : null;
    rdNote.set(
      n === 1
        ? `<b>One sinusoid is not much of a ${w.label} wave.</b> This is the fundamental, at the wave's own repetition rate f₀ — everything else that follows is a correction to it. ${w.story}`
        : gibbs != null && gibbs > 7
          ? `${w.story} <b>Look at the corner: the ripple beside the jump does not shrink.</b> Add terms and it narrows, but its height stays at about 9% of the jump — here ${fixed(gibbs, 1)}% of the 2-unit step. That is <b>Gibbs&rsquo; phenomenon</b>, and it is a property of the sum, not a mistake. It is why &ldquo;band-limited&rdquo; and &ldquo;exact&rdquo; are different words.`
          : `${w.story} With ${used} sinusoid${used === 1 ? "" : "s"} the rms error is down to ${fixed(rms, 4)}. <b>The terms are ordered by how much they matter</b>, and past the first few the returns fall off exactly as ${w.decay} says they will.`
    );
  }

  const k = knob({
    label: "harmonics included", min: 1, max: NMAX, step: 1, value: 1,
    format: (v) => `up to k = ${v}`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "wave",
    options: Object.keys(WAVES).map((id) => ({ id, label: WAVES[id].label })),
    value: "square",
    onChange: (id) => { cur = id; draw(k.value()); },
  });
  draw(1);

  return {
    stage: el("div.stack", null, tp.root, sp.root),
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdTerms, rdTop, rdAmp, rdErr, rdNote),
  };
}

/* ==========================================================================
   Plate 103 — cutting the spectrum off

   f₀ is fixed at 1 kHz so the numbers are the ones Part 2 will sample. The
   readout deliberately reports 2·f_max: that is the handover.
   ========================================================================== */

const F0 = 1;                        // kHz
const FMAX = 12.5;                   // kHz, the drawn axis

function bandLimit() {
  const sp = new Plot({
    w: 620, h: 176, xr: [0, FMAX], yr: [0, 1.45],
    pad: { l: 46, r: 18, t: 12, b: 32 },
    label: "The line spectrum in kilohertz, with the filter's cutoff marked.",
  });
  const tp = new Plot({
    w: 620, h: 208, xr: [0, 2], yr: [-1.55, 1.55],
    pad: { l: 46, r: 18, t: 12, b: 30 },
    label: "The original wave and what is left of it after the harmonics above the cutoff are removed.",
  });

  const rdCut = readout({ key: "cutoff", value: "", tone: "x" });
  const rdPass = readout({ key: "harmonics passed", value: "", tone: "y" });
  const rdFmax = readout({ key: "highest freq. left", value: "", tone: "y" });
  const rdNyq = readout({ key: "so sampling needs", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "square";

  function draw(v) {
    const cut = v / 10;                                 // kHz
    const w = WAVES[cur];
    const amps = harmonics(cur, NMAX);
    const kMax = Math.floor(cut / F0 + 1e-9);
    const f = partialSum(cur, Math.max(kMax, 0), 1);
    sp.clear("curve", "label", "mark", "shade");
    tp.clear("curve", "label", "mark", "shade");

    /* --- spectrum, in kilohertz ----------------------------------------- */
    sp.grid({ xStep: 1, yStep: 0.25 });
    sp.axes({ xLabel: "frequency (kHz)", yLabel: "Ak", xStep: 2, yStep: 0.5, origin: false });
    stems(sp, amps, { cut: kMax, xOf: (k) => k * F0 });
    sp.line(cut, 0, cut, 1.45, { color: "q-bad", width: 1.6, dash: "4 3" });
    sp.text(cut, 1.45, `${fixed(cut, 1)} kHz`, {
      color: "q-bad", size: 10, weight: 600,
      anchor: cut > FMAX - 3 ? "end" : "start", dx: cut > FMAX - 3 ? -5 : 5, dy: 9,
    });

    /* --- time ------------------------------------------------------------ */
    tp.grid({ xStep: 0.25, yStep: 0.5 });
    tp.axes({ xLabel: "t / T", yLabel: "amplitude", xStep: 0.5, yStep: 1, origin: false });
    tp.curve(w.ideal, { color: "muted", width: 1.4, dash: "5 4", samples: 900 });
    if (kMax >= 1) tp.curve(f, { color: "q-r", width: 2.6, samples: 900 });

    const passed = amps.slice(0, kMax).filter((a) => a > 1e-6).length;
    let top = 0;
    for (let k = 1; k <= kMax; k++) if (amps[k - 1] > 1e-6) top = k;

    rdCut.set(`${fixed(cut, 1)}`, " kHz");
    rdPass.set(String(passed));
    rdFmax.set(top ? `${num(top * F0, 0)}` : "—", top ? " kHz" : "");
    rdNyq.set(top ? `> ${num(2 * top * F0, 0)}` : "—", top ? " kHz" : "");

    rdNote.set(
      kMax < 1
        ? `<b>Everything is gone.</b> The cutoff is below the fundamental, so not one harmonic survives and the output is a flat line. A filter cannot pass what it is set below.`
        : passed === 1
          ? `<b>Only the fundamental survives, so the output is a pure sinusoid</b> — whatever went in. This is worth sitting with: a filter narrow enough turns every one of these waves into the same 1 kHz sine. <b>The shape lived in the harmonics</b>, and they have been removed.`
          : `${w.story} <b>Cutting at ${fixed(cut, 1)} kHz leaves ${passed} harmonic${passed === 1 ? "" : "s"}, the highest at ${num(top, 0)} kHz.</b> That number is the signal's <b>bandwidth</b>, and it is the one thing sampling needs to know: to sample this without damage you need more than ${num(2 * top, 0)} kHz. <b>Band-limiting is not a compromise here — it is what makes the next part possible.</b> A signal with harmonics running to infinity cannot be sampled correctly at any rate.`
    );
  }

  const k = knob({
    label: "cutoff frequency", min: 5, max: 125, step: 1, value: 45,
    format: (v) => `${fixed(v / 10, 1)} kHz`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "wave, f₀ = 1 kHz",
    options: Object.keys(WAVES).map((id) => ({ id, label: WAVES[id].label })),
    value: "square",
    onChange: (id) => { cur = id; draw(k.value()); },
  });
  draw(45);

  return {
    stage: el("div.stack", null, sp.root, tp.root),
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdCut, rdPass, rdFmax, rdNyq, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("spectrumBuilder", { no: 102, build: () => {
  const f = spectrumBuilder();
  return plate({
    no: 102, title: "A wave is a sum of sinusoids", tag: "interactive",
    label: "A periodic wave built up from its harmonics, above the line spectrum listing their amplitudes.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The two panels are the <b>same signal written twice</b>. Above, value " +
      "against time. Below, amplitude against frequency — one spike per " +
      "harmonic, and nothing else. Neither is more real than the other, and " +
      "every question in this module is really about which one makes the " +
      "answer obvious. Note what the spectra have in common: <b>they end, or " +
      "they die away fast</b>. A wave with a jump in it needs harmonics for " +
      "ever, falling as 1/k; smooth the jump into a corner and they fall as " +
      "1/k² instead.",
  });
} });

register("bandLimit", { no: 103, build: () => {
  const f = bandLimit();
  return plate({
    no: 103, title: "Bandwidth, and what it throws away", tag: "interactive",
    label: "A line spectrum with a cutoff, above the waveform that the surviving harmonics produce.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Slide the cutoff down and watch the corners round off before anything " +
      "else does — <b>sharp edges live in the high harmonics</b>, so they are " +
      "the first casualty of any band limit. The readout labelled " +
      "<em>so sampling needs</em> is the handover to Part 2: once a signal " +
      "has a highest frequency, it has a minimum honest sample rate, and it " +
      "is exactly twice that. <b>A signal that was never band-limited has no " +
      "such rate</b>, which is why the filter comes first and not second.",
  });
} });
