/* ==========================================================================
   figures/ztransform.js — Plates 112 and 113.

   Part 5 could run a difference equation but not design one, and could not
   answer "is this stable?" except by running it and watching. The z-transform
   does for difference equations exactly what Laplace did for differential
   equations in Linear Systems Part 3: turns them into algebra, and turns
   stability into a question about where some points sit on a plane.

   BOTH PLOTS HERE ARE ISOTROPIC ON PURPOSE. The whole content of this part is
   that a particular circle has radius one, and a circle drawn as an ellipse
   would be a lie. Their apparent margin is load-bearing — see the note in
   PLAN.md about the eleven other plots with the same constraint, and do not
   retune these to fill their frames.

   The cast lands exactly: z = 0.6 + 0.8j has |z| = 1 and ∠z = 53.13°, so the
   compilation's triangle, normalised, sits precisely on the unit circle —
   which is precisely the marginal case. Pulled in to r = 0.9 it gives the
   denominator 1 − 1.08z⁻¹ + 0.81z⁻².
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";
import { roots, cabs, carg } from "../lib/poly.js";
import { freqz, impulseResponse, resonator, dB } from "../lib/dsp.js";

const DEG = 180 / Math.PI;
const NH = 28;                      // impulse-response samples drawn

/** A square, isotropic z-plane with the unit circle on it. */
function zPlane(label) {
  const p = new Plot({
    w: 300, h: 300, xr: [-1.75, 1.75], yr: [-1.75, 1.75],
    pad: { l: 30, r: 30, t: 22, b: 38 }, label,
  });
  p.equalize();                     // belt and braces: x and y units per pixel equal
  return p;
}

function drawPlane(p, { poles = [], zeros = [] } = {}) {
  p.clear("curve", "label", "mark", "shade");
  p.grid({ xStep: 0.5, yStep: 0.5 });
  p.axes({ xLabel: "Re", yLabel: "Im", xStep: 1, yStep: 1, origin: true });
  p.param((t) => [Math.cos(t), Math.sin(t)], [0, 2 * Math.PI],
    { color: "muted", width: 1.6, dash: "5 4", samples: 220 });
  p.text(0.74, 0.74, "|z| = 1", { color: "muted", size: 10, anchor: "start" });
  for (const z of zeros) p.ring(z[0], z[1], { color: "q-y", r: 6, width: 2 });
  for (const z of poles) {
    const bad = cabs(z) >= 1 - 1e-9;
    for (const s of [1, -1]) {
      p.line(z[0] - 0.11 * s, z[1] - 0.11, z[0] + 0.11 * s, z[1] + 0.11,
        { color: bad ? "q-bad" : "q-r", width: 2.4 });
    }
  }
}

/** Stems, for an impulse response. */
function stems(p, ys, color) {
  ys.forEach((y, n) => {
    if (n > p.xr[1]) return;
    const yc = Math.max(p.yr[0], Math.min(p.yr[1], y));
    p.line(n, 0, n, yc, { color, width: 1.8 });
    p.dot(n, yc, { color, r: 2.6, ring: false });
  });
}

/* ==========================================================================
   Plate 112 — a pole is a place, and the place is what matters
   ========================================================================== */

function zPlanePoles() {
  const zp = zPlane("The z-plane, with the unit circle and a conjugate pair of poles.");
  const ip = new Plot({
    w: 300, h: 300, xr: [-0.5, NH - 0.5], yr: [-1.9, 1.9],
    pad: { l: 34, r: 14, t: 22, b: 38 },
    label: "The impulse response produced by those pole positions.",
  });

  const rdZ = readout({ key: "poles at", value: "", tone: "x" });
  const rdR = readout({ key: "radius |z|", value: "", tone: "r" });
  const rdAng = readout({ key: "angle", value: "", tone: "y" });
  const rdDen = readout({ key: "denominator", value: "", tone: "" });
  rdDen.root.classList.add("wide");
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let kr, kt;

  /* The cast's angle is atan2(0.8, 0.6) = 53.130°, which a whole-degree dial
     cannot land on — and landing on it exactly is the point, because only
     then does the denominator come out as exactly 1 − 1.08z⁻¹ + 0.81z⁻².
     The dial snaps at 53, and the readout shows the true 53.1° rather than
     pretending the dial value is the angle. */
  const CAST = Math.atan2(0.8, 0.6);

  function draw() {
    const r = kr.value() / 100;
    const deg = kt.value();
    const th = deg === 53 ? CAST : deg / DEG;      // radians per sample
    const a = resonator(r, th);
    const h = impulseResponse([1], a, NH);

    drawPlane(zp, { poles: [[r * Math.cos(th), r * Math.sin(th)], [r * Math.cos(th), -r * Math.sin(th)]] });
    /* the radius, drawn, because the whole test is about its length */
    zp.line(0, 0, r * Math.cos(th), r * Math.sin(th), { color: "q-r", width: 1.3, dash: "3 3" });

    ip.clear("curve", "label", "mark", "shade");
    ip.grid({ xStep: 2, yStep: 0.5 });
    ip.axes({ xLabel: "n", yLabel: "h[n]", xStep: 7, yStep: 1, origin: false });
    stems(ip, h, r < 1 - 1e-9 ? "q-r" : "q-bad");

    const cast = Math.abs(r - 1) < 0.005 && Math.abs(th * DEG - 53.13) < 0.6;
    rdZ.set(`${fixed(r * Math.cos(th), 2)} ± ${fixed(r * Math.sin(th), 2)}j`);
    rdR.set(fixed(r, 2));
    rdAng.set(`${fixed(th * DEG, 1)}°`, ` = ${fixed(th / Math.PI, 2)}π/sample`);
    rdDen.set(`1 ${a[1] < 0 ? "−" : "+"} ${fixed(Math.abs(a[1]), 3)}z⁻¹ + ${fixed(a[2], 3)}z⁻²`);

    rdNote.set(
      r < 0.999
        ? `<b>Both poles are inside the unit circle, so the filter is stable</b> and the impulse response dies away. <b>The radius sets how fast</b> — each sample is ${fixed(r, 2)} times the envelope of the one before, so the response is essentially gone after ${Math.ceil(Math.log(0.01) / Math.log(Math.max(r, 1e-9)))} samples. <b>The angle sets what it rings at</b>: ${fixed(th * DEG, 0)}° per sample means one cycle every ${fixed(360 / Math.max(th * DEG, 1e-9), 1)} samples. Push the radius out towards 1 and the ringing lasts longer and longer.`
        : cast
          ? `<b>Exactly on the circle, at exactly 53.13°.</b> This is the compilation's triangle arriving in a new plane: 0.6 + 0.8j has magnitude exactly 1 and angle exactly 53.13°, so the 3-4-5 triangle normalised to unit length lands precisely on the boundary between stable and not. The response neither grows nor decays — <b>it rings for ever at ${fixed(th / (2 * Math.PI), 3)} of the sample rate</b>. This is the digital twin of a pole sitting on the jω axis in Linear Systems.`
          : r < 1.001
            ? `<b>Exactly on the unit circle: marginally stable.</b> The response neither decays nor grows, ringing for ever at ${fixed(th * DEG, 0)}° per sample. <b>This is the boundary</b>, and like the strict inequality in the sampling theorem it is a boundary you stay off rather than sit on.`
            : `<b>Outside the circle: unstable.</b> The impulse response grows without limit from a single input sample. Note that the <em>angle</em> has not become wrong — the filter still rings at the same frequency — it is only the <b>radius</b> that decides growth or decay. <b>Stability in the z-plane is a question about distance from the origin and nothing else.</b>`
    );
  }

  kr = knob({
    label: "pole radius", min: 30, max: 115, step: 1, value: 90,
    format: (v) => `r = ${fixed(v / 100, 2)}`,
    onInput: draw,
  });
  kt = knob({
    label: "pole angle", min: 8, max: 172, step: 1, value: 53,
    format: (v) => `${v === 53 ? "53.1" : v}°`,
    onInput: draw,
  });
  draw();

  return {
    stage: el("div.duo", null, zp.root, ip.root),
    controls: el("div.controls", null, kr.root, kt.root),
    readouts: readouts(rdZ, rdR, rdAng, rdDen, rdNote),
  };
}

/* ==========================================================================
   Plate 113 — the frequency response is a walk around the circle
   ========================================================================== */

const FILTERS = {
  reso: {
    label: "resonator",
    coef: () => ({ b: [1], a: resonator(0.9, Math.atan2(0.8, 0.6)) }),
    story:
      "Two poles at radius 0.9 and angle 53.13° — the cast's triangle, pulled just inside the circle. <b>As the walking point passes near a pole the denominator becomes small, so the response peaks</b>. How near it passes is how big the peak is, which is why a pole close to the circle makes a sharp resonance.",
  },
  ma: {
    label: "4-point average",
    coef: () => ({ b: [0.25, 0.25, 0.25, 0.25], a: [1] }),
    story:
      "An FIR filter's zeros sit <em>on</em> the circle, and a zero on the circle is a response of exactly zero. <b>The four-point average has zeros at 90° and 180°</b>, so it nulls completely at a quarter and a half of the sample rate — it is not a gentle smoother, it is a comb, and that is worth knowing before choosing the length of an averaging filter. Its poles are the × at the origin, and <b>a point on the unit circle is always exactly one away from the origin</b>, so they contribute nothing: an FIR's response is shaped entirely by its zeros.",
  },
  notch: {
    label: "notch",
    coef: () => {
      const th = Math.atan2(0.8, 0.6);
      return { b: [1, -2 * Math.cos(th), 1], a: resonator(0.88, th) };
    },
    story:
      "A zero <em>on</em> the circle to kill one frequency dead, and a pole just inside at the same angle to pull the response back to normal either side of it. <b>Zero and pole nearly cancel except very close to their shared angle</b>, which is exactly what a narrow notch has to do.",
  },
};

function unitCircleWalk() {
  const zp = zPlane("The z-plane with poles, zeros, and the point on the unit circle at the current frequency.");
  const mp = new Plot({
    w: 300, h: 300, xr: [0, 1], yr: [-42, 14],
    pad: { l: 42, r: 14, t: 22, b: 38 },
    label: "The magnitude response in decibels against frequency as a fraction of the Nyquist frequency.",
  });

  const rdW = readout({ key: "angle Ω", value: "", tone: "x" });
  const rdF = readout({ key: "frequency", value: "", tone: "x" });
  const rdMag = readout({ key: "response", value: "", tone: "r" });
  const rdDb = readout({ key: "in decibels", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "reso", k;

  function draw() {
    const frac = k.value() / 100;                 // fraction of Nyquist
    const w = frac * Math.PI;
    const { b, a } = FILTERS[cur].coef();
    /* Writing H in positive powers of z leaves poles at the origin whenever
       the numerator has the higher degree — every FIR filter has them. They
       are worth drawing: a point on the unit circle is always exactly one
       away from the origin, so they contribute nothing to |H|, which is why
       an FIR's response is shaped entirely by its zeros. */
    const atOrigin = Math.max(0, b.length - a.length);
    const P = [...roots(a).filter((z) => cabs(z) > 1e-9),
               ...(atOrigin ? [[0, 0]] : [])];
    const Z = roots(b).filter((z) => cabs(z) > 1e-9);

    drawPlane(zp, { poles: P, zeros: Z });
    const pt = [Math.cos(w), Math.sin(w)];
    /* lines from the walking point to each pole: the response is the product
       of the zero distances over the product of the pole distances */
    for (const z of P) zp.line(pt[0], pt[1], z[0], z[1], { color: "q-r", width: 1, dash: "2 3" });
    for (const z of Z) zp.line(pt[0], pt[1], z[0], z[1], { color: "q-y", width: 1, dash: "2 3" });
    zp.dot(pt[0], pt[1], { color: "q-x", r: 5.5 });

    mp.clear("curve", "label", "mark", "shade");
    mp.grid({ xStep: 0.125, yStep: 6 });
    mp.axes({ xLabel: "f / (fs/2)", yLabel: "|H| (dB)", xStep: 0.5, yStep: 12, origin: false });
    mp.curve((x) => Math.max(-42, dB(freqz(b, a, x * Math.PI).mag)),
      { color: "q-x", width: 2.6, samples: 500 });
    const m = freqz(b, a, w).mag;
    mp.dot(frac, Math.max(-42, dB(m)), { color: "q-r", r: 5 });
    mp.line(frac, -42, frac, Math.max(-42, dB(m)), { color: "q-r", width: 1.1, dash: "3 3" });

    rdW.set(`${fixed(w * DEG, 0)}°`, ` = ${fixed(frac, 2)}π`);
    rdF.set(fixed(frac / 2, 3), " × fs");
    rdMag.set(m < 1e-4 ? "≈ 0" : fixed(m, 3));
    rdDb.set(m < 1e-4 ? "−∞" : fixed(dB(m), 1), m < 1e-4 ? "" : " dB");

    rdNote.set(
      `<b>The frequency response is H(z) evaluated as z walks round the unit circle</b>, from z = 1 at DC to z = −1 at the Nyquist frequency. That is the whole idea, and the dotted lines make it concrete: <b>|H| is the product of the distances to the zeros divided by the product of the distances to the poles.</b> ${FILTERS[cur].story} ${
        m < 1e-4
          ? `<b>Right now the walking point is sitting on a zero</b>, so a distance in the numerator is zero and the response is exactly nothing.`
          : `Right now the point is at ${fixed(w * DEG, 0)}°, giving |H| = ${fixed(m, 3)}.`
      } <b>Only half the circle is drawn on the right-hand plot</b>, because the bottom half is the mirror image — a real filter's response at −Ω is the conjugate of its response at +Ω, so nothing new lives down there.`
    );
  }

  k = knob({
    label: "frequency", min: 0, max: 100, step: 1, value: 20,
    format: (v) => `${fixed(v / 100, 2)} × fs/2`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "filter",
    options: Object.keys(FILTERS).map((id) => ({ id, label: FILTERS[id].label })),
    value: "reso",
    onChange: (id) => { cur = id; draw(); },
  });
  draw();

  return {
    stage: el("div.duo", null, zp.root, mp.root),
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdW, rdF, rdMag, rdDb, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("zPlanePoles", { no: 112, build: () => {
  const f = zPlanePoles();
  return plate({
    no: 112, title: "Stability is a distance", tag: "interactive",
    label: "A conjugate pair of poles in the z-plane beside the impulse response they produce.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Linear Systems asked whether a pole was left of the imaginary axis. " +
      "Sampling bends that half-plane into a disc, and the question becomes " +
      "<b>whether the pole is inside the unit circle</b>. Everything else " +
      "carries over: <b>the radius decides how fast the response dies</b> and " +
      "<b>the angle decides what it rings at</b>, exactly as σ and ω did. " +
      "Take the radius to 1 at 53.13° and the poles land on 0.6 ± 0.8j — the " +
      "compilation's triangle, normalised, sitting precisely on the boundary.",
  });
} });

register("unitCircleWalk", { no: 113, build: () => {
  const f = unitCircleWalk();
  return plate({
    no: 113, title: "Walking round the circle", tag: "interactive",
    label: "A point moving around the unit circle, with the resulting magnitude response beside it.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "This is the one idea to take from the part. <b>A digital filter's " +
      "frequency response is its transfer function evaluated around the unit " +
      "circle</b> — DC at z = 1, the Nyquist frequency at z = −1, and " +
      "everything else in between. The dotted lines say how to read it " +
      "without computing anything: <b>|H| is the product of the distances to " +
      "the zeros over the product of the distances to the poles</b>. Pass " +
      "close to a pole and the response peaks; pass through a zero and it " +
      "vanishes. That single picture is enough to sketch any of these " +
      "responses by eye.",
  });
} });
