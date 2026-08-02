/* ==========================================================================
   figures/dsp-synthesis.js — Plate 114.

   One signal chain, four panels, two controls, and the whole module has to
   agree with itself. The chain is the telephone channel that has been running
   since Part 2: speech to 3.4 kHz, an interferer at 5 kHz, an anti-alias
   filter of the reader's chosen order, and a sampler at the reader's chosen
   rate.

   The point of the plate is that the two knobs buy the same thing. Turn the
   order up and the interferer is attenuated before it can fold; turn the rate
   up and it stops folding into the band at all. Every panel moves together,
   and at fs = 8 kHz the interferer lands on 3 kHz — the cast, one last time.
   ========================================================================== */

import { el, knob, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { svg } from "../lib/dom.js";
import { num, fixed } from "../lib/fmt.js";
import { aliasOf, butterworth, orderFor, dB } from "../lib/dsp.js";

const V = (t) => `var(--${t})`;
const B = 3.4;                      // speech band edge, kHz
const FI = 5;                       // the interferer, kHz — folds to 3 at fs = 8

function panel(w, h, xr, yr, pad, label) {
  return new Plot({ w, h, xr, yr, pad, label });
}

function oneChain() {
  const PW = 300, PH = 218;
  const pad = { l: 42, r: 14, t: 16, b: 32 };

  const pAn = panel(PW, PH, [0, 20], [-64, 8], pad,
    "The analog spectrum before sampling, with the anti-alias filter response over it.");
  const pSm = panel(PW, PH, [0, 20], [-64, 8], pad,
    "What survives after sampling, with the interferer at the frequency it folds to.");
  const pOrd = panel(PW, PH, [7, 26], [0, 14], pad,
    "The filter order needed for 40 dB of rejection, against sample rate.");
  const pRes = panel(PW, PH, [7, 26], [-90, 4], pad,
    "The level of the surviving interferer, against sample rate.");

  const rdFs = readout({ key: "sample rate", value: "", tone: "x" });
  const rdOrd = readout({ key: "filter order", value: "", tone: "x" });
  const rdAtt = readout({ key: "rejection", value: "", tone: "y" });
  const rdLands = readout({ key: "lands at", value: "", tone: "r" });
  const rdLevel = readout({ key: "at a level of", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let kfs, kn;

  /* Rejection the anti-alias filter gives the interferer, in dB. */
  const reject = (n) => -dB(butterworth(n, FI / B));
  /* Order needed for 40 dB at whatever the fold frequency is. */
  const needed = (fs) => (fs / 2 <= B ? Infinity : orderFor(40, Math.max(fs / 2, FI) / B));

  function draw() {
    const fs = kfs.value() / 10;
    const n = kn.value();
    const att = reject(n);
    const lands = aliasOf(FI, fs);
    const inBand = lands < B;
    const level = -att;                         // dB relative to the interferer

    /* --- panel 1: before the converter -------------------------------- */
    pAn.clear("curve", "label", "mark", "shade");
    pAn.grid({ xStep: 2, yStep: 12 });
    pAn.axes({ xLabel: "f (kHz)", yLabel: "dB", xStep: 5, yStep: 24, origin: false });
    pAn.add("shade", svg("rect", {
      x: pAn.x(0), y: pAn.y(0), width: pAn.x(B) - pAn.x(0), height: pAn.y(-64) - pAn.y(0),
      fill: V("q-x-soft"),
    }));
    pAn.text(B / 2, -8, "speech", { color: "q-x", size: 10, anchor: "middle" });
    pAn.curve((f) => Math.max(-64, dB(butterworth(n, Math.max(f, 1e-6) / B))),
      { color: "q-y", width: 2.2, samples: 320 });
    pAn.line(FI, -64, FI, 0, { color: "q-bad", width: 2.6 });
    pAn.dot(FI, 0, { color: "q-bad", r: 4 });
    pAn.text(FI, 0, "5 kHz", { color: "q-bad", size: 10, anchor: "start", dx: 4, dy: -4 });
    pAn.line(fs / 2, -64, fs / 2, 8, { color: "muted", width: 1.3, dash: "4 3" });
    pAn.text(fs / 2, -64, "fs/2", { color: "muted", size: 10, anchor: "middle", dy: -4, bg: true });

    /* --- panel 2: after sampling --------------------------------------- */
    pSm.clear("curve", "label", "mark", "shade");
    pSm.grid({ xStep: 2, yStep: 12 });
    pSm.axes({ xLabel: "f (kHz)", yLabel: "dB", xStep: 5, yStep: 24, origin: false });
    pSm.add("shade", svg("rect", {
      x: pSm.x(0), y: pSm.y(0), width: pSm.x(B) - pSm.x(0), height: pSm.y(-64) - pSm.y(0),
      fill: V("q-x-soft"),
    }));
    pSm.line(fs / 2, -64, fs / 2, 8, { color: "muted", width: 1.3, dash: "4 3" });
    pSm.text(fs / 2, -64, "fs/2", { color: "muted", size: 10, anchor: "middle", dy: -4, bg: true });
    pSm.line(lands, -64, lands, Math.max(-64, level), { color: inBand ? "q-bad" : "q-r", width: 2.6 });
    pSm.dot(lands, Math.max(-64, level), { color: inBand ? "q-bad" : "q-r", r: 4 });
    pSm.text(lands, Math.max(-64, level), `${fixed(lands, 1)} kHz`, {
      color: inBand ? "q-bad" : "q-r", size: 10,
      anchor: lands > 14 ? "end" : "start", dx: lands > 14 ? -4 : 4, dy: -4, bg: true,
    });

    /* --- panel 3: the order the specification needs -------------------- */
    pOrd.clear("curve", "label", "mark", "shade");
    pOrd.grid({ xStep: 1, yStep: 2 });
    pOrd.axes({ xLabel: "fs (kHz)", yLabel: "poles for 40 dB", xStep: 5, yStep: 4, origin: false });
    pOrd.curve((x) => Math.min(14, needed(x)), { color: "q-y", width: 2.4, samples: 300 });
    const need = Math.min(14, needed(fs));
    pOrd.dot(fs, need, { color: "q-r", r: 5 });
    pOrd.line(fs, 0, fs, need, { color: "q-r", width: 1.1, dash: "3 3" });
    pOrd.line(7, n, 26, n, { color: "q-x", width: 1.6, dash: "5 4" });
    pOrd.text(25.6, n, "your order", { color: "q-x", size: 10, anchor: "end", dy: -5 });

    /* --- panel 4: what actually survives ------------------------------- */
    pRes.clear("curve", "label", "mark", "shade");
    pRes.grid({ xStep: 1, yStep: 12 });
    pRes.axes({ xLabel: "fs (kHz)", yLabel: "residue (dB)", xStep: 5, yStep: 24, origin: false });
    pRes.add("shade", svg("rect", {
      x: pRes.x(7), y: pRes.y(4), width: pRes.x(26) - pRes.x(7), height: pRes.y(-40) - pRes.y(4),
      fill: V("q-bad-soft"),
    }));
    pRes.text(7.3, -36, "in-band, too loud", { color: "q-bad", size: 10, anchor: "start" });
    pRes.curve((x) => (aliasOf(FI, x) < B ? Math.max(-90, level) : -90),
      { color: "q-bad", width: 2.6, samples: 400 });
    pRes.dot(fs, inBand ? Math.max(-90, level) : -90, { color: inBand ? "q-bad" : "q-r", r: 5 });

    rdFs.set(fixed(fs, 1), " kHz");
    rdOrd.set(String(n), n === 1 ? " pole" : " poles");
    rdAtt.set(fixed(att, 1), " dB");
    rdLands.set(fixed(lands, 2), " kHz");
    rdLevel.set(fixed(level, 1), inBand ? " dB, in band" : " dB, out of band");

    const cast = Math.abs(fs - 8) < 0.05;
    rdNote.set(
      inBand
        ? `<b>The interferer has folded into the speech band.</b> ${
            cast
              ? `At f<sub>s</sub> = 8 kHz the Nyquist frequency is 4 kHz, the tone is at 5, and it lands at <b>3 kHz</b> — the compilation's triangle, for the last time. `
              : `It lands at ${fixed(lands, 2)} kHz, below the ${num(B, 1)} kHz band edge. `
          }<b>Nothing downstream can remove it</b>, so the only defence is the ${att < 40 ? `analog filter — and ${fixed(att, 1)} dB is not enough. It needs ${Math.ceil(needed(fs) - 1e-9)} poles to reach 40 dB, against your ${n}.` : `analog filter, which is giving ${fixed(att, 1)} dB. That clears 40 dB, so the residue is buried — but note how many poles it took.`} <b>The cheaper move is the other knob.</b> Push the sample rate above ${num(2 * FI, 0)} kHz and the tone stops folding at all.`
        : `<b>Clear.</b> At f<sub>s</sub> = ${fixed(fs, 1)} kHz the Nyquist frequency is ${fixed(fs / 2, 2)} kHz, above the interferer, so it does not fold — it stays at ${fixed(lands, 2)} kHz, <em>outside</em> the ${num(B, 1)} kHz speech band. <b>A digital filter can now remove it</b>, because it is at a frequency the signal does not occupy. Look at panel three: the analog filter needs only ${Math.ceil(needed(fs) - 1e-9)} pole${Math.ceil(needed(fs) - 1e-9) === 1 ? "" : "s"} at this rate, against twelve at 8 kHz. <b>That is the whole module in one comparison</b> — rate is cheap, poles are not, and aliasing is the only failure that cannot be undone later.`
    );
  }

  kfs = knob({
    label: "sample rate", min: 70, max: 260, step: 1, value: 80,
    format: (v) => `${fixed(v / 10, 1)} kHz`,
    onInput: draw,
  });
  kn = knob({
    label: "anti-alias filter order", min: 1, max: 12, step: 1, value: 2,
    format: (v) => `${v} pole${v === 1 ? "" : "s"}`,
    onInput: draw,
  });
  draw();

  return {
    stage: el("div.quad", null, pAn.root, pSm.root, pOrd.root, pRes.root),
    controls: el("div.controls", null, kfs.root, kn.root),
    readouts: readouts(rdFs, rdOrd, rdAtt, rdLands, rdLevel, rdNote),
  };
}

register("oneChain", { no: 114, build: () => {
  const f = oneChain();
  return plate({
    no: 114, title: "One chain, both knobs", tag: "interactive",
    label: "Four views of one signal chain: the analog spectrum, the sampled spectrum, the filter order required, and the surviving interference.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The telephone channel this module has been carrying since Part 2, with " +
      "both defences in your hands at once. <b>Top left</b> is what reaches " +
      "the converter and how far the anti-alias filter has pushed the 5 kHz " +
      "interferer down. <b>Top right</b> is where that residue lands after " +
      "sampling. <b>Bottom left</b> is the order the specification demands at " +
      "this rate; <b>bottom right</b> is what actually survives inside the " +
      "speech band. Start at 8 kHz with two poles and watch the interferer " +
      "arrive at <b>3 kHz</b>, inside the band, unremovable. Then fix it " +
      "twice: once by adding poles, once by raising the rate. <b>Both work, " +
      "and one of them is nearly free.</b>",
  });
} });
