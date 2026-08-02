/* ==========================================================================
   figures/sampling.js — Plates 104 and 105.

   The two halves of one argument, and the reader needs both. Plate 104 is the
   time picture: too few samples and a slower sinusoid fits them exactly, so
   the information is not merely degraded, it is gone. Plate 105 is the
   frequency picture, which is the only one that explains *why* the number is
   two — sampling copies the spectrum to every multiple of fs, and the copies
   run into each other when the rate is too low.

   The cast lands here honestly: a 5 kHz tone sampled at 8 kHz folds to 3 kHz.
   Nyquist frequency 4, tone 5, alias 3.

   The time window is a fixed number of *sample periods* rather than a fixed
   number of milliseconds, so the dots keep a constant spacing as fs moves and
   the eye can compare one setting with the next.
   ========================================================================== */

import { el, knob, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";
import { aliasOf, aliasPhasor, resolved } from "../lib/dsp.js";

const TAU = 2 * Math.PI;
const NSAMP = 16;                    // sample periods shown

/* ==========================================================================
   Plate 104 — the impostor that fits the same dots
   ========================================================================== */

function samplingTime() {
  const p = new Plot({
    w: 620, h: 268, xr: [0, 1], yr: [-1.38, 1.38],
    pad: { l: 44, r: 18, t: 14, b: 32 },
    label: "A sinusoid, the instants at which it is sampled, and the lower-frequency sinusoid that passes through the same samples.",
  });

  const rdF = readout({ key: "signal", value: "", tone: "x" });
  const rdFs = readout({ key: "sample rate", value: "", tone: "y" });
  const rdNyq = readout({ key: "nyquist freq.", value: "", tone: "y" });
  const rdPer = readout({ key: "per cycle", value: "", tone: "" });
  const rdApp = readout({ key: "what comes back", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  /* Read straight off the controls rather than mirroring them into locals:
     two copies of the same starting value drift apart the moment one is
     edited, and the slider then disagrees with the drawing. */
  let kf, kfs;

  function draw() {
    const f = kf.value() / 10, fs = kfs.value() / 10;   // kHz
    const tMax = NSAMP / fs;                   // ms — a fixed count of samples
    p.xr = [0, tMax];
    p.clear("curve", "label", "mark", "shade");

    const fa = aliasOf(f, fs);
    const imp = aliasPhasor(f, fs, 0);
    const ok = resolved(f, fs);

    p.grid({ xStep: tMax / 16, yStep: 0.25 });
    p.axes({ xLabel: "t (ms)", yLabel: "amplitude", xStep: tMax / 4, yStep: 0.5, origin: false });

    /* the true signal, always drawn */
    p.curve((t) => Math.sin(TAU * f * t), {
      color: ok ? "q-x" : "muted", width: ok ? 2.6 : 1.5,
      dash: ok ? null : "5 4", samples: 900,
    });

    /* the impostor, only when it is a different wave */
    if (!ok) {
      p.curve((t) => Math.sin(TAU * imp.f * t + imp.phase),
        { color: "q-bad", width: 2.6, samples: 900 });
    }

    /* the samples — the only thing the converter actually keeps */
    for (let n = 0; n * (1 / fs) <= tMax + 1e-9; n++) {
      const t = n / fs, y = Math.sin(TAU * f * t);
      p.line(t, 0, t, y, { color: "muted", width: 1, dash: "2 2" });
      p.dot(t, y, { color: "ink", r: 4.2 });
    }

    const spc = f > 0 ? fs / f : Infinity;
    rdF.set(`${fixed(f, 1)}`, " kHz");
    rdFs.set(`${fixed(fs, 1)}`, " kHz");
    rdNyq.set(`${fixed(fs / 2, 2)}`, " kHz");
    rdPer.set(f > 0 ? fixed(spc, 2) : "—");

    const zeroed = Math.abs(fa) < 1e-9;
    const atNyq = Math.abs(f - fs / 2) < 1e-9;
    /* At exactly fs/2 the frequency survives but the amplitude does not, and
       with this phase every sample is a zero crossing. Reporting the bare
       frequency here would contradict the note beside it. */
    rdApp.set(fixed(fa, 2), atNyq ? " kHz, no amplitude" : " kHz");
    rdNote.set(
      ok
        ? `<b>Resolved.</b> ${fixed(f, 1)} kHz is below the Nyquist frequency of ${fixed(fs / 2, 2)} kHz, so no other sinusoid fits these samples and the original comes back exactly. There are ${fixed(spc, 2)} samples per cycle. <b>Notice how few that can be and still work</b> — the theorem needs only more than two, not the ten or twenty that look comfortable on a screen.`
        : atNyq
          ? `<b>Exactly at Nyquist, and this is why the rule says <em>more than</em> twice.</b> Two samples per cycle land on the same two points of the wave every time — here both on zero crossings, so the converter records silence. Shift the signal's phase and you would get a different constant amplitude. <b>At exactly f<sub>s</sub>/2 the amplitude is unrecoverable</b>, which is why f<sub>s</sub> &gt; 2f<sub>max</sub> is a strict inequality and not a comfortable one.`
          : zeroed
            ? `<b>An exact multiple of the sample rate, so every sample lands on the same point of the wave.</b> The converter sees a constant — here zero — and reports 0 Hz. Nothing about the recorded numbers hints that a ${fixed(f, 1)} kHz signal was ever there.`
            : `<b>Aliased.</b> ${fixed(f, 1)} kHz is above the Nyquist frequency of ${fixed(fs / 2, 2)} kHz, and the red wave at <b>${fixed(fa, 2)} kHz</b> passes through <em>every one</em> of these samples. Both are exact fits. <b>The converter has no way to prefer one</b> — the samples are all it will ever have, and it will hand back the slow one. ${
              Math.abs(f - 5) < 0.05 && Math.abs(fs - 8) < 0.05
                ? `And this is the compilation's triangle again: <b>Nyquist frequency 4, tone 5, alias 3</b>.`
                : `Aliasing is not distortion you can filter out later — the false frequency is now indistinguishable from a real signal at ${fixed(fa, 2)} kHz.`
            }`
    );
  }

  kf = knob({
    label: "signal frequency", min: 5, max: 120, step: 1, value: 30,
    format: (v) => `${fixed(v / 10, 1)} kHz`,
    onInput: draw,
  });
  kfs = knob({
    label: "sample rate", min: 20, max: 200, step: 1, value: 80,
    format: (v) => `${fixed(v / 10, 1)} kHz`,
    onInput: draw,
  });
  draw();

  return {
    stage: p.root,
    controls: el("div.controls", null, kf.root, kfs.root),
    readouts: readouts(rdF, rdFs, rdNyq, rdPer, rdApp, rdNote),
  };
}

/* ==========================================================================
   Plate 105 — why the number is two

   Sampling copies the spectrum to every multiple of fs. That single sentence
   is the theorem; the drawing is just the sentence with the copies visible.
   ========================================================================== */

const B = 4;                          // signal bandwidth, kHz — held fixed
const XR = [-21, 21];

function replicas() {
  const p = new Plot({
    w: 620, h: 250, xr: XR, yr: [0, 1.3],
    pad: { l: 40, r: 16, t: 16, b: 34 },
    label: "The spectrum of a sampled signal: the original band, and the copies of it that sampling places at every multiple of the sample rate.",
  });

  const rdFs = readout({ key: "sample rate", value: "", tone: "x" });
  const rdNyq = readout({ key: "nyquist freq.", value: "", tone: "y" });
  const rdB = readout({ key: "signal bandwidth", value: "", tone: "y" });
  const rdGuard = readout({ key: "gap between copies", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  /** One triangular band centred at c. */
  const band = (c) => (x) => {
    const d = Math.abs(x - c);
    return d >= B ? 0 : 1 - d / B;
  };

  function draw(v) {
    const fs = v / 10;
    p.clear("curve", "label", "mark", "shade");
    p.grid({ xStep: 2, yStep: 0.25 });
    p.axes({ xLabel: "frequency (kHz)", yLabel: "", xStep: 8, yStep: 0.5, origin: false });

    /* the copies, out to as many as fit on the axis */
    const nMax = Math.ceil((XR[1] + B) / fs);
    for (let n = -nMax; n <= nMax; n++) {
      if (n === 0) continue;
      const c = n * fs;
      if (c - B > XR[1] || c + B < XR[0]) continue;
      p.area(band(c), Math.max(c - B, XR[0]), Math.min(c + B, XR[1]),
        { color: "muted", opacity: 0.18 });
      p.curve(band(c), { color: "muted", width: 1.4, dash: "4 3", samples: 400 });
    }

    /* the original band, drawn last so it sits on top */
    p.area(band(0), -B, B, { color: "q-x-soft", opacity: 0.5 });
    p.curve(band(0), { color: "q-x", width: 2.4, samples: 400 });

    /* the fold point */
    p.line(fs / 2, 0, fs / 2, 1.22, { color: "q-y", width: 1.4, dash: "5 4" });
    p.text(fs / 2, 1.22, "fs/2", { color: "q-y", size: 10.5, weight: 600, anchor: "start", dx: 4, dy: 2 });
    p.line(-fs / 2, 0, -fs / 2, 1.22, { color: "q-y", width: 1.4, dash: "5 4" });

    /* Where the copies collide. The lens is centred on fs/2 by construction —
       (fs−B + B)/2 is exactly fs/2 — so its label cannot go at the top
       without landing on the fs/2 marker. It goes beside the lens instead,
       at the lens's own height. */
    const guard = fs - 2 * B;
    if (guard < 0) {
      const lo = fs - B, hi = B;
      const lens = (x) => Math.min(band(0)(x), band(fs)(x));
      for (const s of [1, -1]) {
        const f = s === 1 ? lens : (x) => Math.min(band(0)(x), band(-fs)(x));
        p.area(f, s === 1 ? lo : -hi, s === 1 ? hi : -lo, { color: "q-bad-soft" });
        p.curve(f, { color: "q-bad", width: 1.8, samples: 300 });
      }
      const peak = 1 - fs / (2 * B);            // height of the lens at fs/2
      p.text(fs / 2, peak + 0.1, "overlap", {
        color: "q-bad", size: 10.5, weight: 700, anchor: "end", dx: -7, bg: true,
      });
    }

    rdFs.set(`${fixed(fs, 1)}`, " kHz");
    rdNyq.set(`${fixed(fs / 2, 2)}`, " kHz");
    rdB.set(`${num(B, 0)}`, " kHz");
    rdGuard.set(guard >= 0 ? `${fixed(guard, 1)}` : `−${fixed(-guard, 1)}`, " kHz");

    rdNote.set(
      guard > 0.001
        ? `<b>The copies clear each other by ${fixed(guard, 1)} kHz.</b> Sampling has placed a copy of the spectrum at every multiple of ${fixed(fs, 1)} kHz, and because ${fixed(fs, 1)} &gt; 2 × ${num(B, 0)}, none of them touches the original. <b>A low-pass filter can therefore cut away everything above f<sub>s</sub>/2 and leave the original band untouched</b> — which is exactly what reconstruction is, and why the signal comes back perfectly.`
        : Math.abs(guard) < 0.001
          ? `<b>Exactly the Nyquist rate, and the copies now touch at ${num(B, 0)} kHz.</b> Nothing has overlapped yet, but there is no gap left for a real filter to work in: separating them would need a brick wall with infinitely steep sides. <b>This is the boundary the theorem describes and no practical system sits on it</b> — which is why 44.1 kHz is used for a 20 kHz band rather than 40.0.`
          : `<b>Overlapped, and that is aliasing.</b> The copy centred at ${fixed(fs, 1)} kHz now reaches down to ${fixed(fs - B, 1)} kHz, below the original's upper edge of ${num(B, 0)} kHz. In the shaded region <b>two different components are adding together and the sum is all that survives</b>. No filter can separate them afterwards, because after sampling they are not two things any more — they are one number per sample. <b>This is why the anti-alias filter goes before the converter.</b>`
    );
  }

  const k = knob({
    label: "sample rate", min: 40, max: 200, step: 1, value: 110,
    format: (v) => `${fixed(v / 10, 1)} kHz`,
    onInput: draw,
  });
  draw(110);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdFs, rdNyq, rdB, rdGuard, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("samplingTime", { no: 104, build: () => {
  const f = samplingTime();
  return plate({
    no: 104, title: "The impostor fits the same dots", tag: "interactive",
    label: "A sampled sinusoid together with the lower-frequency sinusoid that passes through identical samples.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Start where it works, then break it. At 3 kHz sampled at 8 kHz the " +
      "dots belong to one wave and one wave only. Slide the signal past " +
      "<b>4 kHz — the Nyquist frequency — and a second sinusoid appears that " +
      "passes through every single sample</b>. It is not an approximation of " +
      "the first; it is an exact fit, and so is the original. Since the " +
      "samples are the entire record, <b>nothing downstream can tell them " +
      "apart</b>. Set 5 kHz against 8 kHz for the case this module keeps " +
      "coming back to: the tone folds to 3 kHz.",
  });
} });

register("replicas", { no: 105, build: () => {
  const f = replicas();
  return plate({
    no: 105, title: "Why the number is two", tag: "interactive",
    label: "The spectrum of a sampled signal, showing the copies placed at every multiple of the sample rate and the overlap that occurs when the rate is too low.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "This is the picture the theorem actually lives in. <b>Sampling puts a " +
      "copy of the whole spectrum at every multiple of f<sub>s</sub></b>. The " +
      "original band reaches to B on both sides, and the nearest copy reaches " +
      "down to f<sub>s</sub> − B, so they stay clear of one another exactly " +
      "when <b>f<sub>s</sub> − B &gt; B</b> — which rearranges to " +
      "f<sub>s</sub> &gt; 2B. <b>That is where the two comes from</b>: not a " +
      "rule of thumb about needing a couple of points per cycle, but the " +
      "condition for two copies of a band of width B to fit side by side " +
      "without touching.",
  });
} });
