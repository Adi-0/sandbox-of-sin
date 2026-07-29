/* ==========================================================================
   figures/instrumentation.js — Plates 60 and 61.

   Plate 60 is Thévenin's third appearance in this compilation, now as the
   reason a measurement changes what it measures. Plate 61 is the other half
   of 9.D: turning a continuous voltage into a number, and what that costs.

   The cast: a 100 k / 100 k divider on 10 V, whose true midpoint is exactly
   5.000 V — so any reading that is not 5.000 is the meter's fault.
   ========================================================================== */

import { el, knob, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;
const NS = "http://www.w3.org/2000/svg";

const DIV = { Vs: 10, R1: 100e3, R2: 100e3 };
const VTRUE = (DIV.Vs * DIV.R2) / (DIV.R1 + DIV.R2);      // exactly 5 V

/* ==========================================================================
   Plate 60 — the meter changes the circuit
   One knob: the meter's input resistance. Lesson: a voltmeter is a resistor
   in parallel with whatever it is reading, and the error is set by how that
   compares with the Thévenin resistance of the source.
   ========================================================================== */

function meterLoading() {
  const Rth = (DIV.R1 * DIV.R2) / (DIV.R1 + DIV.R2);      // 50 kΩ

  const p = new Plot({
    w: 620, h: 330, xr: [3.6, 7.4], yr: [-0.6, 5.6],
    pad: { l: 62, r: 20, t: 18, b: 42 },
    label:
      "Measured voltage against the meter's input resistance on a logarithmic " +
      "scale. The curve rises from a badly loaded reading at low resistance and " +
      "flattens onto the true value once the meter is far stiffer than the source.",
  });
  p.grid({ xStep: 0.25, yStep: 0.5 });
  p.axes({
    xStep: 1, yStep: 1, yLabel: "reading (V)",
    xFmt: (v) => ["10 k", "100 k", "1 M", "10 M"][v - 4] ?? "",
    yFmt: (v) => (v === 0 ? "0" : fixed(v, 0)),
  });
  p.text(7.3, -0.42, "meter resistance (Ω)", { color: "muted", size: 10.5, anchor: "end" });

  // the value that is actually there, which no meter quite reaches
  p.line(3.6, VTRUE, 7.4, VTRUE, { color: "muted", width: 1.4, dash: "5 4" });
  p.text(3.72, VTRUE, "true 5.000 V", { color: "muted", size: 10.5, dy: -8, anchor: "start" });

  const read = (Rm) => {
    const par = (DIV.R2 * Rm) / (DIV.R2 + Rm);
    return (DIV.Vs * par) / (DIV.R1 + par);
  };

  const pts = [];
  for (let i = 0; i <= 400; i++) {
    const lx = 3.6 + (i / 400) * 3.8;
    pts.push(`${p.x(lx).toFixed(2)} ${p.y(read(10 ** lx)).toFixed(2)}`);
  }
  p.add("curve", pathOf(pts, "q-r", 2.75));

  // where the meter equals the source's Thévenin resistance — the 2/3 point
  const lth = Math.log10(Rth);
  p.line(lth, -0.6, lth, 5.6, { color: "muted", width: 1.1, dash: "3 4" });
  p.text(lth, 0.9, "Rm = Rth", { color: "muted", size: 10, dx: 6, anchor: "start" });
  p.text(lth, 0.45, "50 kΩ", { color: "muted", size: 10, dx: 6, anchor: "start" });

  const dot = p.dot(6, 0, { color: "q-y", r: 6 });
  const drop = p.line(0, 0, 0, 0, { color: "q-y", width: 1.2, dash: "4 3" });

  const rdRm = readout({ key: "meter", value: "", tone: "x" });
  const rdRth = readout({ key: "source Rth", value: `${num(Rth / 1000, 0)} kΩ` });
  const rdRead = readout({ key: "it reads", value: "", tone: "y" });
  const rdErr = readout({ key: "error", value: "", tone: "bad" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(lx) {
    const Rm = 10 ** lx;
    const v = read(Rm);
    const err = ((v - VTRUE) / VTRUE) * 100;

    dot.querySelectorAll("circle").forEach((c) => {
      c.setAttribute("cx", p.x(lx)); c.setAttribute("cy", p.y(v));
    });
    drop.setAttribute("x1", p.x(lx)); drop.setAttribute("y1", p.y(v));
    drop.setAttribute("x2", p.x(lx)); drop.setAttribute("y2", p.y(0));

    rdRm.set(Rm >= 1e6 ? `${fixed(Rm / 1e6, 2)} MΩ` : `${fixed(Rm / 1000, 0)} kΩ`);
    rdRead.set(`${fixed(v, 3)} V`);
    rdErr.set(`${fixed(err, 2)}%`);
    rdNote.set(
      Rm / Rth > 200
        ? `<b>${fixed(err, 2)}% low.</b> With the meter ${fixed(Rm / Rth, 0)} times stiffer than the source, the loading has become negligible — which is exactly why a digital multimeter is built with a 10 MΩ input. <b>Negligible is a ratio, not a resistance.</b>`
        : Math.abs(Rm / Rth - 1) < 0.2
          ? "<b>The meter equals the source's Thévenin resistance</b>, so it takes exactly half the available voltage away: the reading is two-thirds of the truth. This is the reference point worth remembering."
          : `<b>${fixed(err, 1)}% low.</b> The meter is only ${fixed(Rm / Rth, 1)} times the source's ${num(Rth / 1000, 0)} kΩ, so it is a significant extra load on the divider — and the divider sags under it. The instrument is not faulty; the measurement is.`
    );
  }

  const k = knob({
    label: "meter input resistance", min: 3.7, max: 7.3, step: 0.02, value: 7,
    format: (v) => (10 ** v >= 1e6 ? `${fixed(10 ** v / 1e6, 2)} MΩ` : `${fixed(10 ** v / 1000, 0)} kΩ`),
    onInput: draw,
  });
  draw(7);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdRm, rdRth, rdRead, rdErr, rdNote),
  };
}

/* ==========================================================================
   Plate 61 — quantisation
   One knob: the converter's resolution. Lesson: every extra bit halves the
   step and buys about 6 dB, and that is the whole of ADC arithmetic.
   ========================================================================== */

const FSR = 10;           // volts, full-scale range

function quantisation() {
  const p = new Plot({
    w: 620, h: 330, xr: [0, 1], yr: [-0.4, FSR + 0.4],
    pad: { l: 56, r: 20, t: 18, b: 42 },
    label:
      "A smooth sinusoid and the staircase a converter produces from it, with " +
      "the step size shrinking as resolution increases.",
  });
  p.grid({ xStep: 0.05, yStep: 0.5 });
  p.axes({
    xStep: 0.25, yStep: 2, xLabel: "one cycle", yLabel: "volts",
    xFmt: () => "",
    yFmt: (v) => (v === 0 ? "0" : num(v, 0)),
  });

  const sig = (t) => (FSR / 2) * (1 + Math.sin(2 * Math.PI * t));

  const smooth = [];
  for (let i = 0; i <= 400; i++) {
    const t = i / 400;
    smooth.push(`${p.x(t).toFixed(2)} ${p.y(sig(t)).toFixed(2)}`);
  }
  p.add("curve", pathOf(smooth, "muted", 1.6, 0.75));

  const stair = pathOf([], "q-r", 2.5);
  p.add("curve", stair);

  const rdBits = readout({ key: "resolution", value: "", tone: "x" });
  const rdLevels = readout({ key: "levels", value: "" });
  const rdLsb = readout({ key: "step size", value: "", tone: "y" });
  const rdSnr = readout({ key: "best SNR", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(bits) {
    const levels = 2 ** bits;
    const lsb = FSR / levels;
    // sample-and-hold at 64 points per cycle, so the staircase is visible even
    // when the quantisation itself is fine
    const N = 64;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t0 = i / N;
      const q = Math.min(FSR, Math.round(sig(t0) / lsb) * lsb);
      pts.push(`${p.x(t0).toFixed(2)} ${p.y(q).toFixed(2)}`);
      if (i < N) pts.push(`${p.x((i + 1) / N).toFixed(2)} ${p.y(q).toFixed(2)}`);
    }
    stair.setAttribute("d", "M " + pts.join(" L "));

    rdBits.set(`${bits} bits`);
    rdLevels.set(`${num(levels, 0)}`);
    rdLsb.set(lsb >= 0.01 ? `${fixed(lsb * 1000, 1)} mV` : `${fixed(lsb * 1e6, 0)} µV`);
    rdSnr.set(`${fixed(6.02 * bits + 1.76, 1)} dB`);
    rdNote.set(
      bits <= 4
        ? `<b>${num(levels, 0)} levels across ${FSR} V</b> — the steps are ${fixed(lsb * 1000, 0)} mV and the staircase is obvious. Everything between two steps is lost, and no amount of later processing recovers it.`
        : bits >= 14
          ? `<b>${fixed(lsb * 1e6, 0)} µV steps.</b> At this resolution the quantisation is finer than the thermal noise in most front ends, so the converter has stopped being the limiting factor and the analogue circuitry in front of it has become one.`
          : `<b>${num(levels, 0)} levels, ${fixed(lsb * 1000, 1)} mV apart.</b> Each extra bit <b>halves</b> the step and adds about <b>6 dB</b> of signal-to-noise — the 6.02n + 1.76 relation, which is just 20 log 2 per bit.`
    );
  }

  const k = knob({
    label: "converter bits", min: 2, max: 16, step: 1, value: 4,
    format: (v) => `${v} bits`,
    onInput: draw,
  });
  draw(4);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdBits, rdLevels, rdLsb, rdSnr, rdNote),
  };
}

/* -------------------------------------------------------------------------
   helpers
   ------------------------------------------------------------------------- */

function pathOf(pts, color, width, opacity = 1) {
  const n = document.createElementNS(NS, "path");
  n.setAttribute("d", pts.length ? "M " + pts.join(" L ") : "");
  n.setAttribute("fill", "none");
  n.setAttribute("stroke", V(color));
  n.setAttribute("stroke-width", width);
  n.setAttribute("opacity", opacity);
  return n;
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("meterLoading", { no: 60, build: () => {
  const f = meterLoading();
  return plate({
    no: 60, title: "The meter changes the circuit", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "A voltmeter is a resistor, and connecting it puts that resistor in " +
      "parallel with whatever you were trying to read. <b>Whether that matters " +
      "depends entirely on the ratio to the source's Thévenin resistance</b> — " +
      "the same quantity from Circuit Analysis Part 4, doing its third job in " +
      "this compilation. At R<sub>m</sub> = R<sub>th</sub> the reading is " +
      "two-thirds of the truth; at a hundred times it, the error is under a " +
      "percent. That ratio, not the raw ohms, is why a digital multimeter " +
      "specifies 10 MΩ.",
  });
} });

register("quantisation", { no: 61, build: () => {
  const f = quantisation();
  return plate({
    no: 61, title: "What a converter throws away", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "An analogue-to-digital converter can only produce one of " +
      "2<sup>n</sup> numbers, so the smooth curve becomes a staircase and " +
      "everything between two steps is gone for good. <b>Each extra bit halves " +
      "the step and buys about 6 dB</b>, which is the whole of the 6.02n + 1.76 " +
      "relation — it is 20 log 2 per bit and nothing more. Note where the " +
      "argument stops: past about fourteen bits the steps are smaller than the " +
      "noise of the circuitry feeding the converter, and buying more resolution " +
      "buys nothing at all.",
  });
} });
