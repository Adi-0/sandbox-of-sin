/* ==========================================================================
   figures/amplifiers.js — Plates 56 and 57.

   Plate 56 puts the two bias schemes on one axis against beta. It is the most
   convincing argument in the module: the same transistor spread that shifts a
   fixed-bias stage by a factor of six moves a divider-biased one by 14%.

   Plate 57 is the gain-stability trade. Bypassing the emitter resistor buys
   enormous gain that depends on r_e, which depends on temperature; leaving
   part of it unbypassed buys a gain that is just a ratio of two resistors.

   The cast: 12 V, R1 40 k, R2 10 k, R_E 1 k, R_C 2.2 k — the standard stage.
   ========================================================================== */

import { el, knob, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;
const NS = "http://www.w3.org/2000/svg";

const AMP = {
  Vcc: 12, R1: 40e3, R2: 10e3, Re: 1e3, Rc: 2.2e3, Rb: 470e3, Vbe: 0.7, Vsat: 0.2,
};
const VTH = (AMP.Vcc * AMP.R2) / (AMP.R1 + AMP.R2);       // 2.40 V
const RTH = (AMP.R1 * AMP.R2) / (AMP.R1 + AMP.R2);        // 8.0 kΩ

/** Collector current for each scheme, at a given beta. */
const icDivider = (b) => (b * (VTH - AMP.Vbe)) / (RTH + (b + 1) * AMP.Re);
const icFixed = (b) => b * ((AMP.Vcc - AMP.Vbe) / AMP.Rb);

/** V_CE, clamped at saturation so the plate never shows an impossible value. */
function vceOf(ic, withRe) {
  const v = AMP.Vcc - ic * (AMP.Rc + (withRe ? AMP.Re : 0));
  return Math.max(AMP.Vsat, v);
}

/* ==========================================================================
   Plate 56 — why nobody uses fixed bias
   One knob: beta. Lesson: the divider holds the operating point almost still
   across the whole transistor spread; fixed bias does not.
   ========================================================================== */

function biasStability() {
  const p = new Plot({
    w: 620, h: 330, xr: [20, 330], yr: [0, 8.4],
    pad: { l: 60, r: 96, t: 18, b: 42 },
    label:
      "Collector current against current gain for two bias schemes. The " +
      "fixed-bias line rises steeply and in proportion; the divider-bias curve " +
      "is almost flat across the same range.",
  });
  p.grid({ xStep: 25, yStep: 1 });
  p.axes({
    xStep: 50, yStep: 2, xLabel: "β", yLabel: "IC (mA)",
    xFmt: (v) => (v === 20 ? "" : num(v, 0)),
    yFmt: (v) => (v === 0 ? "0" : fixed(v, 0)),
  });

  const mkCurve = (fn, color, width) => {
    const pts = [];
    for (let i = 0; i <= 300; i++) {
      const b = 20 + (i / 300) * 310;
      pts.push(`${p.x(b).toFixed(2)} ${p.y(Math.min(8.4, fn(b) * 1000)).toFixed(2)}`);
    }
    p.add("curve", pathOf(pts, color, width));
  };
  mkCurve(icFixed, "q-bad", 2.5);
  mkCurve(icDivider, "q-r", 2.75);

  p.text(332, Math.min(8.1, icFixed(330) * 1000), "fixed bias",
    { color: "q-bad", size: 11, weight: 600, anchor: "start", dx: 4, dy: 3 });
  p.text(332, icDivider(330) * 1000, "divider bias",
    { color: "q-r", size: 11, weight: 600, anchor: "start", dx: 4, dy: 3 });

  const dotF = p.dot(100, 0, { color: "q-y", r: 5.5 });
  const dotD = p.dot(100, 0, { color: "q-y", r: 5.5 });
  const rule = p.line(100, 0, 100, 8.4, { color: "muted", width: 1.2, dash: "4 4" });

  const rdB = readout({ key: "β", value: "", tone: "x" });
  const rdFix = readout({ key: "fixed IC", value: "", tone: "bad" });
  const rdDiv = readout({ key: "divider IC", value: "", tone: "r" });
  const rdVceF = readout({ key: "fixed VCE", value: "", tone: "bad" });
  const rdVceD = readout({ key: "divider VCE", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  // the spread the same part number can have, quoted once
  const spanF = (icFixed(300) - icFixed(50)) / icFixed(50);
  const spanD = (icDivider(300) - icDivider(50)) / icDivider(50);

  function draw(b) {
    const iF = icFixed(b), iD = icDivider(b);
    dotF.querySelectorAll("circle").forEach((c) => {
      c.setAttribute("cx", p.x(b)); c.setAttribute("cy", p.y(Math.min(8.4, iF * 1000)));
    });
    dotD.querySelectorAll("circle").forEach((c) => {
      c.setAttribute("cx", p.x(b)); c.setAttribute("cy", p.y(iD * 1000));
    });
    rule.setAttribute("x1", p.x(b)); rule.setAttribute("x2", p.x(b));

    const vF = vceOf(iF, false), vD = vceOf(iD, true);
    rdB.set(`${num(b, 0)}`);
    rdFix.set(`${fixed(iF * 1000, 3)} mA`);
    rdDiv.set(`${fixed(iD * 1000, 3)} mA`);
    rdVceF.set(`${fixed(vF, 2)} V`, vF <= AMP.Vsat + 0.01 ? " — saturated" : "");
    rdVceD.set(`${fixed(vD, 2)} V`);
    rdNote.set(
      vF <= AMP.Vsat + 0.01
        ? `<b>The fixed-bias stage has saturated.</b> Its operating point ran into the rail, so it can no longer amplify at all — the output is stuck near zero whatever the input does. The divider stage is still sitting at ${fixed(vD, 2)} V, exactly where it was designed to.`
        : `Across the full β = 50 to 300 spread that one part number can have, fixed bias moves the collector current by <b>${fixed(spanF * 100, 0)}%</b> and the divider by <b>${fixed(spanD * 100, 0)}%</b>. That is the entire reason nobody ships a fixed-bias amplifier.`
    );
  }

  const k = knob({
    label: "current gain β", min: 25, max: 325, step: 5, value: 100,
    format: (v) => `${num(v, 0)}`,
    onInput: draw,
  });
  draw(100);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdB, rdFix, rdDiv, rdVceF, rdVceD, rdNote),
  };
}

/* ==========================================================================
   Plate 57 — the gain you can rely on
   One knob: how much emitter resistance is left unbypassed. Lesson: gain and
   predictability are the same trade, and the exchange rate is r_e.
   ========================================================================== */

function gainTradeoff() {
  const beta = 100;
  const ie = ((beta + 1) * (VTH - AMP.Vbe)) / (RTH + (beta + 1) * AMP.Re);
  const re = 0.026 / ie;                                   // ≈ 16.5 Ω
  const av = (rE) => AMP.Rc / (re + rE);
  const zin = (rE) => (beta + 1) * (re + rE);

  const p = new Plot({
    w: 620, h: 330, xr: [-20, 520], yr: [0, 145],
    pad: { l: 60, r: 92, t: 18, b: 42 },
    label:
      "Voltage gain magnitude against the unbypassed part of the emitter " +
      "resistance. The curve starts very high and falls steeply, flattening " +
      "into the region where gain is simply the ratio of two resistors.",
  });
  p.grid({ xStep: 25, yStep: 10 });
  p.axes({
    xStep: 100, yStep: 40, xLabel: "unbypassed RE (Ω)", yLabel: "gain",
    xFmt: (v) => (v === 0 ? "" : num(v, 0)),
    yFmt: (v) => (v === 0 ? "0" : num(v, 0)),
  });

  const pts = [];
  for (let i = 0; i <= 400; i++) {
    const rE = (i / 400) * 520;
    pts.push(`${p.x(rE).toFixed(2)} ${p.y(Math.min(145, av(rE))).toFixed(2)}`);
  }
  p.add("curve", pathOf(pts, "q-r", 2.75));

  // the asymptote the design is really aiming at
  const asym = [];
  for (let i = 1; i <= 400; i++) {
    const rE = (i / 400) * 520;
    asym.push(`${p.x(rE).toFixed(2)} ${p.y(Math.min(145, AMP.Rc / rE)).toFixed(2)}`);
  }
  p.add("curve", pathOf(asym, "muted", 1.4, 0.8, "5 4"));
  p.text(360, AMP.Rc / 360, "RC / RE", { color: "muted", size: 10.5, dy: -9 });

  const dot = p.dot(0, 0, { color: "q-y", r: 6 });
  const drop = p.line(0, 0, 0, 0, { color: "q-y", width: 1.2, dash: "4 3" });

  const rdRe = readout({ key: "unbypassed", value: "", tone: "x" });
  const rdSmall = readout({ key: "re", value: `${fixed(re, 1)} Ω`, sub: " = 26 mV / IE" });
  const rdAv = readout({ key: "gain", value: "", tone: "r" });
  const rdApprox = readout({ key: "RC/RE gives", value: "" });
  const rdZin = readout({ key: "Z into base", value: "", tone: "y" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(rE) {
    const A = av(rE);
    dot.querySelectorAll("circle").forEach((c) => {
      c.setAttribute("cx", p.x(rE)); c.setAttribute("cy", p.y(Math.min(145, A)));
    });
    drop.setAttribute("x1", p.x(rE)); drop.setAttribute("y1", p.y(Math.min(145, A)));
    drop.setAttribute("x2", p.x(rE)); drop.setAttribute("y2", p.y(0));

    rdRe.set(rE < 1 ? "bypassed" : `${num(rE, 0)} Ω`);
    rdAv.set(`−${fixed(A, 1)}`);
    rdApprox.set(rE < 1 ? "—" : `−${fixed(AMP.Rc / rE, 1)}`,
      rE < 1 ? "" : ` ${fixed((Math.abs(AMP.Rc / rE - A) / A) * 100, 0)}% out`);
    rdZin.set(`${fixed(zin(rE) / 1000, 1)} kΩ`);
    rdNote.set(
      rE < 1
        ? `<b>Fully bypassed: gain ${fixed(A, 0)}.</b> Enormous — and worthless as a design figure, because it is set by <b>r<sub>e</sub> = 26 mV / I<sub>E</sub></b>, which moves with temperature and with every unit's bias point. Two identical boards would not have the same gain.`
        : rE < 60
          ? `A little degeneration has already collapsed the gain to ${fixed(A, 0)}, but r<sub>e</sub> is still ${fixed((re / (re + rE)) * 100, 0)}% of the denominator, so the answer still depends on temperature.`
          : `<b>Gain ${fixed(A, 1)}, and now it is trustworthy.</b> With ${num(rE, 0)} Ω unbypassed, r<sub>e</sub> is only ${fixed((re / (re + rE)) * 100, 0)}% of the denominator, so the gain is essentially <b>R<sub>C</sub>/R<sub>E</sub></b> — a ratio of two resistors, which is stable, predictable and reproducible. Note the input impedance has climbed to ${fixed(zin(rE) / 1000, 1)} kΩ as well.`
    );
  }

  const k = knob({
    label: "unbypassed emitter R", min: 0, max: 500, step: 5, value: 0,
    format: (v) => (v < 1 ? "0 Ω (bypassed)" : `${num(v, 0)} Ω`),
    onInput: draw,
  });
  draw(0);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdRe, rdSmall, rdAv, rdApprox, rdZin, rdNote),
  };
}

/* -------------------------------------------------------------------------
   helpers
   ------------------------------------------------------------------------- */

function pathOf(pts, color, width, opacity = 1, dash = null) {
  const n = document.createElementNS(NS, "path");
  n.setAttribute("d", pts.length ? "M " + pts.join(" L ") : "");
  n.setAttribute("fill", "none");
  n.setAttribute("stroke", V(color));
  n.setAttribute("stroke-width", width);
  n.setAttribute("opacity", opacity);
  if (dash) n.setAttribute("stroke-dasharray", dash);
  return n;
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("biasStability", { no: 56, build: () => {
  const f = biasStability();
  return plate({
    no: 56, title: "Why nobody uses fixed bias", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "β is not a design parameter — it is whatever the part happens to have, " +
      "and a single part number is routinely specified from 50 to 300. Slide " +
      "across that range and watch the two schemes: fixed bias moves the " +
      "collector current by a factor of six and eventually saturates, while the " +
      "divider stays inside 14%. <b>The emitter resistor is what does it</b>, by " +
      "negative feedback — more collector current raises the emitter voltage, " +
      "which reduces the base-emitter drive, which pushes the current back down.",
  });
} });

register("gainTradeoff", { no: 57, build: () => {
  const f = gainTradeoff();
  return plate({
    no: 57, title: "Gain against predictability", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Fully bypassed, this stage has a gain of 133 that no designer would " +
      "quote, because it is R<sub>C</sub>/r<sub>e</sub> and r<sub>e</sub> is " +
      "26 mV/I<sub>E</sub> — a number that moves with temperature and with every " +
      "unit's bias. Leave a hundred ohms unbypassed and the gain falls to about " +
      "19, but it is now <b>R<sub>C</sub>/R<sub>E</sub></b>: two resistors, " +
      "stable to their tolerance and identical on every board. <b>That exchange " +
      "— gain traded for predictability — is what negative feedback is, and it " +
      "is the idea the op-amp in Part 5 takes to its limit.</b>",
  });
} });
