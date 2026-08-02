/* ==========================================================================
   figures/rectifiers.js — Plates 51 and 52.

   Plate 51 collects a debt. Circuit Analysis Part 5 derived the half-wave and
   full-wave RMS and average factors from the defining integral, and called
   half-wave "what one rectifier diode produces". This is that diode.

   Plate 52 adds the capacitor and shows the ripple, which is the one piece of
   rectifier arithmetic the exam actually asks for numerically.

   The chain: 120 V wall (Circuits Part 5) through a transformer (Power Part 4)
   to 12.6 V rms, 17.82 V peak, then rectified.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;
const NS = "http://www.w3.org/2000/svg";

const SUP = { Vrms: 12.6, f: 60, Vd: 0.7 };
const VM = SUP.Vrms * Math.SQRT2;              // 17.82 V peak

/* The three topologies the exam asks about. `shape` maps a phase in cycles to
   a fraction of the ideal peak; `drops` is how many diodes are in the path. */
const TOPO = {
  half: {
    name: "half-wave", diodes: 1, drops: 1, piv: 1, fr: 1,
    kAvg: 1 / Math.PI, kRms: 0.5,
    avgTex: "V_m/\\pi", rmsTex: "V_m/2",
    shape: (t) => Math.max(0, Math.sin(2 * Math.PI * t)),
    note: "One diode, and half the input thrown away. The output is zero for a whole half cycle, so the average is only 1/π of the peak and the ripple frequency is the line frequency itself — the hardest case to filter.",
  },
  bridge: {
    name: "bridge", diodes: 4, drops: 2, piv: 1, fr: 2,
    kAvg: 2 / Math.PI, kRms: 1 / Math.SQRT2,
    avgTex: "2V_m/\\pi", rmsTex: "V_m/\\sqrt{2}",
    shape: (t) => Math.abs(Math.sin(2 * Math.PI * t)),
    note: "<b>The standard.</b> Four diodes, no centre tap needed, and the whole waveform used. The cost is <b>two</b> diode drops in series with the load, which matters at low voltages.",
  },
  ct: {
    name: "centre-tapped", diodes: 2, drops: 1, piv: 2, fr: 2,
    kAvg: 2 / Math.PI, kRms: 1 / Math.SQRT2,
    avgTex: "2V_m/\\pi", rmsTex: "V_m/\\sqrt{2}",
    shape: (t) => Math.abs(Math.sin(2 * Math.PI * t)),
    note: "Same waveform as the bridge with only <b>one</b> diode drop, which is why it survives in low-voltage supplies. The price is a centre-tapped transformer and a peak inverse voltage of <b>2V<sub>m</sub></b> — twice the bridge's.",
  },
};

/* ==========================================================================
   Plate 51 — the three rectifiers
   One control: the topology. Lesson: the factors were already derived in
   Circuit Analysis Part 5, and what really separates the three is diode
   count, diode drops and peak inverse voltage.
   ========================================================================== */

function rectifierShapes() {
  const p = new Plot({
    w: 620, h: 320, xr: [0, 2], yr: [-21, 21],
    pad: { l: 54, r: 92, t: 16, b: 34 },
    label:
      "Rectifier output over two cycles of the input, with the input sinusoid " +
      "shown faintly behind it and horizontal markers for the output's average " +
      "and RMS values.",
  });
  p.grid({ xStep: 0.25, yStep: 5 });
  p.axes({
    xStep: 0.5, yStep: 10, xLabel: "cycles",
    xFmt: (v) => (v === 0 ? "" : fixed(v, 1)),
    yFmt: (v) => (v === 0 ? "" : fixed(v, 0)),
  });

  // the transformer secondary, always shown for reference
  const inPts = [];
  for (let i = 0; i <= 500; i++) {
    const t = (i / 500) * 2;
    inPts.push(`${p.x(t).toFixed(2)} ${p.y(VM * Math.sin(2 * Math.PI * t)).toFixed(2)}`);
  }
  p.add("curve", pathOf(inPts, "muted", 1.3, 0.6));

  const out = pathOf([], "q-y", 2.75);
  p.add("curve", out);
  const mk = (color, dash) => ({
    line: p.line(0, 0, 2, 0, { color, width: 1.5, dash }),
    text: p.text(2.02, 0, "", { color, size: 11, anchor: "start" }),
  });
  const avg = mk("q-r", null);
  const rms = mk("q-x", "6 4");

  const rdTopo = readout({ key: "topology", value: "" });
  const rdDiodes = readout({ key: "diodes", value: "" });
  const rdPeak = readout({ key: "output peak", value: "", tone: "y" });
  const rdAvg = readout({ key: "average (DC)", value: "", tone: "r" });
  const rdRms = readout({ key: "RMS", value: "", tone: "x" });
  const rdFr = readout({ key: "ripple at", value: "" });
  const rdPiv = readout({ key: "peak inverse V", value: "", tone: "bad" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(key) {
    const T = TOPO[key];
    const Vpk = VM - SUP.Vd * T.drops;
    // the drawn waveform uses the real peak, so the diode drops are visible
    const pts = [];
    for (let i = 0; i <= 600; i++) {
      const t = (i / 600) * 2;
      pts.push(`${p.x(t).toFixed(2)} ${p.y(Vpk * T.shape(t)).toFixed(2)}`);
    }
    out.setAttribute("d", "M " + pts.join(" L "));

    const vAvg = Vpk * T.kAvg;
    const vRms = Vpk * T.kRms;
    // on a full-wave output these two values differ by about a volt, so the
    // labels are pushed apart vertically rather than left to collide
    moveLine(p, avg, vAvg, `avg ${fixed(vAvg, 2)} V`, 15);
    moveLine(p, rms, vRms, `rms ${fixed(vRms, 2)} V`, -7);

    rdTopo.set(T.name);
    rdDiodes.set(`${T.diodes}`, ` · ${T.drops} drop${T.drops > 1 ? "s" : ""} in the path`);
    rdPeak.set(`${fixed(Vpk, 2)} V`, ` = ${fixed(VM, 2)} − ${fixed(SUP.Vd * T.drops, 1)}`);
    rdAvg.set(`${fixed(vAvg, 2)} V`);
    rdRms.set(`${fixed(vRms, 2)} V`);
    rdFr.set(`${SUP.f * T.fr} Hz`, T.fr === 2 ? " — twice the line" : " — the line frequency");
    rdPiv.set(`${fixed(VM * T.piv, 1)} V`);
    rdNote.set(T.note);
  }

  const sc = scenarios({
    label: "rectifier",
    options: [
      { id: "half", label: "Half-wave" },
      { id: "bridge", label: "Bridge" },
      { id: "ct", label: "Centre-tap" },
    ],
    value: "bridge",
    onChange: draw,
  });
  draw("bridge");

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root),
    readouts: readouts(rdTopo, rdDiodes, rdPeak, rdAvg, rdRms, rdFr, rdPiv, rdNote),
  };
}

/* ==========================================================================
   Plate 52 — the filter capacitor
   One knob: capacitance. Lesson: the ripple is a discharge, so it is set by
   how much charge the load removes between peaks — I/(fr·C) and nothing else.
   ========================================================================== */

function ripple() {
  const Il = 0.1;                              // A, a fixed 100 mA load
  const Vpk = VM - 2 * SUP.Vd;                 // bridge, so two drops
  const fr = 2 * SUP.f;                        // 120 Hz

  const p = new Plot({
    w: 620, h: 320, xr: [0, 2], yr: [0, 19],
    pad: { l: 54, r: 92, t: 16, b: 34 },
    label:
      "The output of a bridge rectifier with a smoothing capacitor: a sawtooth " +
      "riding on a DC level, decaying between the peaks of the rectified " +
      "waveform and recharging at each one.",
  });
  p.grid({ xStep: 0.25, yStep: 2 });
  p.axes({
    xStep: 0.5, yStep: 4, xLabel: "cycles",
    xFmt: (v) => (v === 0 ? "" : fixed(v, 1)),
    yFmt: (v) => (v === 0 ? "" : fixed(v, 0)),
  });

  // the unfiltered rectified waveform, behind
  const rawPts = [];
  for (let i = 0; i <= 600; i++) {
    const t = (i / 600) * 2;
    rawPts.push(`${p.x(t).toFixed(2)} ${p.y(Vpk * Math.abs(Math.sin(2 * Math.PI * t))).toFixed(2)}`);
  }
  p.add("curve", pathOf(rawPts, "muted", 1.3, 0.55));

  const filt = pathOf([], "q-y", 2.75);
  p.add("curve", filt);
  const dcLine = p.line(0, 0, 2, 0, { color: "q-r", width: 1.5 });
  const tDc = p.text(2.02, 0, "", { color: "q-r", size: 11, anchor: "start" });
  const topLine = p.line(0, 0, 2, 0, { color: "muted", width: 1.2, dash: "4 4" });
  const botLine = p.line(0, 0, 2, 0, { color: "muted", width: 1.2, dash: "4 4" });
  const tRip = p.text(0.05, 0, "", { color: "q-bad", size: 11.5, weight: 600, anchor: "start" });

  const rdC = readout({ key: "capacitor", value: "" });
  const rdRip = readout({ key: "ripple", value: "", tone: "bad" });
  const rdDc = readout({ key: "DC output", value: "", tone: "r" });
  const rdFac = readout({ key: "ripple %", value: "", sub: " rms of DC" });
  const rdTau = readout({ key: "time constant", value: "" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(uF) {
    const C = uF * 1e-6;
    const Vr = Il / (fr * C);                  // peak-to-peak, linear-discharge model
    const Vdc = Vpk - Vr / 2;
    const Rl = Vdc / Il;

    /* Sawtooth: hold at the peak, then fall linearly for one ripple period.
       The linear approximation is what the handbook formula assumes, and it is
       accurate whenever the ripple is small — which the plate lets you break. */
    const pts = [];
    for (let i = 0; i <= 600; i++) {
      const t = (i / 600) * 2;
      // the discharge starts at each PEAK of the rectified wave (t = 0.25,
      // 0.75, ...), not at each zero — getting this wrong puts the recharge
      // where the raw waveform is at its minimum
      const phase = ((((t - 0.25) * fr) / SUP.f) % 1 + 1) % 1;
      pts.push(`${p.x(t).toFixed(2)} ${p.y(Math.max(0, Vpk - Vr * phase)).toFixed(2)}`);
    }
    filt.setAttribute("d", "M " + pts.join(" L "));

    moveLine(p, { line: dcLine, text: tDc }, Vdc, `DC ${fixed(Vdc, 2)} V`);
    topLine.setAttribute("y1", p.y(Vpk)); topLine.setAttribute("y2", p.y(Vpk));
    botLine.setAttribute("y1", p.y(Math.max(0, Vpk - Vr))); botLine.setAttribute("y2", p.y(Math.max(0, Vpk - Vr)));
    // the ripple band is only a few percent of the plate at large C, so the
    // label sits above it rather than inside it
    tRip.setAttribute("y", p.y(Vpk) - 9);
    tRip.textContent = `ripple ${fixed(Math.min(Vr, Vpk), 2)} V p-p`;

    rdC.set(`${num(uF, 0)} µF`);
    rdRip.set(`${fixed(Vr, 3)} V`, " peak to peak");
    rdDc.set(`${fixed(Vdc, 2)} V`);
    rdFac.set(`${fixed((Vr / (2 * Math.sqrt(3)) / Vdc) * 100, 2)}%`, " rms of DC");
    rdTau.set(`${fixed(Rl * C * 1000, 1)} ms`, ` against ${fixed(1000 / fr, 2)} ms between peaks`);
    rdNote.set(
      Vr > Vpk * 0.5
        ? `With only ${num(uF, 0)} µF the capacitor is nearly empty before the next peak arrives. The linear-discharge formula has broken down here — <b>it assumes small ripple</b> — and so has the circuit: this is barely a DC supply.`
        : Vr > 1.5
          ? `${fixed(Vr, 2)} V of ripple on ${fixed(Vdc, 2)} V. The capacitor has to hold the load up for ${fixed(1000 / fr, 2)} ms between peaks, and at ${num(uF, 0)} µF it cannot do so without sagging.`
          : `<b>${fixed(Vr, 3)} V of ripple.</b> The discharge time constant is ${fixed(Rl * C * 1000, 0)} ms against only ${fixed(1000 / fr, 2)} ms between peaks, so the capacitor barely notices the gap. Doubling C halves the ripple — the relationship is exactly inverse.`
    );
  }

  const k = knob({
    label: "capacitance", min: 100, max: 4700, step: 50, value: 470,
    format: (v) => `${num(v, 0)} µF`,
    onInput: draw,
  });
  draw(470);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdC, rdRip, rdDc, rdFac, rdTau, rdNote),
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

function moveLine(p, m, v, label, dy = 4) {
  m.line.setAttribute("y1", p.y(v));
  m.line.setAttribute("y2", p.y(v));
  m.text.setAttribute("y", p.y(v) + dy);
  m.text.textContent = label;
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("rectifierShapes", { no: 51, build: () => {
  const f = rectifierShapes();
  return plate({
    no: 51, title: "Three rectifiers", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "<b>The two factors on this plate are not new.</b> Circuit Analysis Part 5 " +
      "derived V<sub>avg</sub> = 2V<sub>m</sub>/π and V<sub>rms</sub> = " +
      "V<sub>m</sub>/√2 for a full-wave shape, and V<sub>m</sub>/π and " +
      "V<sub>m</sub>/2 for a half-wave one, straight from the defining integral — " +
      "and called half-wave \"what one rectifier diode produces\". This is that " +
      "diode. What actually separates the three topologies is the count: diodes " +
      "used, drops in the load path, and <b>peak inverse voltage</b>, where the " +
      "centre-tap's 2V<sub>m</sub> is the answer examiners most like to ask for.",
  });
} });

register("ripple", { no: 52, build: () => {
  const f = ripple();
  return plate({
    no: 52, title: "The smoothing capacitor", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The capacitor charges to the peak and then supplies the load alone until " +
      "the next peak arrives. <b>Ripple is therefore a discharge, not a filter " +
      "response</b>: charge out equals current times time, so V = I/(f<sub>r</sub>C) " +
      "and nothing else enters. Note which frequency — <b>f<sub>r</sub> is 120 Hz " +
      "for a full-wave rectifier</b>, not 60, and using the line frequency there " +
      "doubles your answer. Wind the capacitor down far enough and the sawtooth " +
      "stops being a sawtooth: the small-ripple assumption the formula rests on " +
      "has failed.",
  });
} });
