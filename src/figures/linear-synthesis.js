/* ==========================================================================
   figures/linear-synthesis.js — Plate 88.

   Linear Systems looks like six topics and is one object seen six ways. A
   pole pair is a step response, a Bode plot, a resonance curve and a pair of
   characteristic roots — so this plate puts the s-plane in the middle and the
   four readings around it, all driven by one point.
   ========================================================================== */

import { el, svg, knob, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { fixed, num } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;
const dB = (x) => 20 * Math.log10(x);

function oneObject() {
  const WN = 10;                                  // krad/s throughout

  const sp = new Plot({
    w: 300, h: 250, xr: [-14, 6], yr: [-11.5, 11.5],
    pad: { l: 14, r: 12, t: 12, b: 12 },
    label: "The s-plane with a conjugate pole pair.",
  });
  const st = new Plot({
    w: 300, h: 250, xr: [-0.06, 1.7], yr: [-0.15, 2.05],
    pad: { l: 40, r: 14, t: 12, b: 30 },
    label: "The step response the poles produce.",
  });
  const bo = new Plot({
    w: 300, h: 250, xr: [-0.35, 1.65], yr: [-42, 24],
    pad: { l: 44, r: 14, t: 12, b: 30 },
    label: "The Bode magnitude the same poles produce.",
  });
  const rz = new Plot({
    w: 300, h: 250, xr: [0.3, 1.9], yr: [-0.1, 1.15],
    pad: { l: 44, r: 14, t: 12, b: 30 },
    label: "The resonance curve of the same circuit.",
  });

  const rdZeta = readout({ key: "ζ", value: "", tone: "r" });
  const rdRoots = readout({ key: "roots", value: "", tone: "y" });
  const rdOS = readout({ key: "overshoot", value: "", tone: "bad" });
  const rdPeak = readout({ key: "Bode peak", value: "", tone: "x" });
  const rdQ = readout({ key: "Q = 1/2ζ", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(z100) {
    const z = z100 / 100;
    const sig = z * WN, wd = WN * Math.sqrt(1 - z * z);
    for (const p of [sp, st, bo, rz]) p.clear("curve", "label", "mark", "shade");

    /* --- 1. the plane --------------------------------------------------- */
    sp.add("shade", svg("rect", {
      x: sp.x(-14), y: sp.y(11.5), width: sp.x(0) - sp.x(-14),
      height: sp.y(-11.5) - sp.y(11.5), fill: V("q-r-soft"), opacity: 0.5,
    }));
    sp.grid({ xStep: 5, yStep: 5 });
    sp.axes({ xLabel: "σ", yLabel: "jω", xStep: 5, yStep: 5, arrows: true });
    sp.line(0, 0, -sig, wd, { color: "q-r", width: 1.4 });
    sp.line(0, 0, -sig, -wd, { color: "q-r", width: 1.4, opacity: 0.4 });
    for (const y of [wd, -wd]) sp.text(-sig, y, "✕", { color: "q-y", size: 17, weight: 700, dy: 6 });
    sp.text(-13.4, 9.6, "1 · the poles", { color: "muted", size: 10.5, weight: 600, anchor: "start" });

    /* --- 2. the step ---------------------------------------------------- */
    st.grid({ xStep: 0.25, yStep: 0.5 });
    st.axes({ xLabel: "t (ms)", yLabel: "step", xStep: 0.5, yStep: 1, arrows: true });
    st.line(-0.04, 1, 1.66, 1, { color: "q-r", width: 1.1, dash: "5 4" });
    const y = (ms) => {
      const t = ms / 1000;
      if (t < 0) return 0;
      return 1 - Math.exp(-sig * 1000 * t) *
        (Math.cos(wd * 1000 * t) + (sig / wd) * Math.sin(wd * 1000 * t));
    };
    st.curve((x) => Math.min(2.0, y(x)), { color: "q-y", width: 2.4 });
    const os = Math.exp(-Math.PI * z / Math.sqrt(1 - z * z));
    st.dot((Math.PI / (wd * 1000)) * 1000, 1 + os, { color: "q-bad", r: 4 });
    st.text(1.62, 1.9, "2 · in time", { color: "muted", size: 10.5, weight: 600, anchor: "end" });

    /* --- 3. the Bode ---------------------------------------------------- */
    bo.grid({ xStep: 0.25, yStep: 10 });
    bo.axes({ xLabel: "log₁₀(ω/ω₀)", yLabel: "dB", xStep: 0.5, yStep: 20, arrows: true });
    const mag = (lr) => {
      const r = 10 ** lr;
      return dB(1 / Math.hypot(1 - r * r, 2 * z * r));
    };
    bo.line(-0.33, 0, 1.63, 0, { color: "grid", width: 1 });
    bo.curve((lr) => Math.max(-40, mag(lr)), { color: "q-y", width: 2.4 });
    // the resonant peak exists only below ζ = 1/√2, which is worth showing
    const peaks = z < Math.SQRT1_2;
    if (peaks) {
      const rp = Math.sqrt(1 - 2 * z * z);
      bo.dot(Math.log10(rp), mag(Math.log10(rp)), { color: "q-x", r: 4 });
    }
    bo.text(1.6, 19, "3 · in frequency", { color: "muted", size: 10.5, weight: 600, anchor: "end" });

    /* --- 4. the resonance curve ----------------------------------------- */
    rz.grid({ xStep: 0.2, yStep: 0.25 });
    rz.axes({ xLabel: "ω/ω₀", yLabel: "I / Imax", xStep: 0.5, yStep: 0.5, arrows: true });
    const Q = 1 / (2 * z);
    const I = (r) => 1 / Math.hypot(1, Q * (r - 1 / r));
    rz.line(0.32, Math.SQRT1_2, 1.88, Math.SQRT1_2, { color: "q-y", width: 1.1, dash: "5 4" });
    rz.curve(I, { color: "q-r", width: 2.4 });
    rz.text(1.85, 1.05, "4 · as a filter", { color: "muted", size: 10.5, weight: 600, anchor: "end" });

    rdZeta.set(fixed(z, 2), Math.abs(z - 0.6) < 0.005 ? " — the cast" : "");
    rdRoots.set(`−${fixed(sig, 1)} ± j${fixed(wd, 1)}`, " krad/s");
    rdOS.set(`${fixed(os * 100, 1)}%`);
    rdPeak.set(peaks ? `${fixed(dB(1 / (2 * z * Math.sqrt(1 - z * z))), 1)} dB` : "none",
      peaks ? "" : " — ζ > 0.707");
    rdQ.set(fixed(Q, 2), ` · BW = ${fixed(WN / Q, 2)} krad/s`);
    rdNote.set(
      z < 0.3
        ? `<b>One point, four readings.</b> Light damping: the poles sit close to the imaginary axis, the step rings for a long time, the Bode plot has a tall peak, and the filter is sharply selective. Those are not four behaviours — they are <em>one</em>, because all four panels are drawn from the same two numbers.`
        : z > Math.SQRT1_2
          ? `<b>Above ζ = 0.707 the Bode peak disappears entirely.</b> The step still overshoots a little, but the frequency response is now monotonic — which is why that value is the maximally flat, or Butterworth, condition. Two of the four panels have stopped showing a resonance while the other two still show a ring.`
          : `Move ζ and watch all four move together. <b>The pole angle sets the overshoot, the Bode peak, the sharpness and the ringing at once</b>, because the pole angle <em>is</em> ζ. Six parts of this module, one point on a plane.`
    );
  }

  const k = knob({
    label: "ζ", min: 8, max: 99, step: 1, value: 60,
    format: (v) => fixed(v / 100, 2),
    onInput: draw,
  });
  draw(60);

  return {
    stage: el("div.quad", null, sp.root, st.root, bo.root, rz.root),
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdZeta, rdRoots, rdOS, rdPeak, rdQ, rdNote),
  };
}

register("oneObject", { no: 88, build: () => {
  const f = oneObject();
  return plate({
    no: 88, title: "One object, four views", tag: "interactive",
    label: "Four panels driven by a single damping ratio: a pole pair on the " +
           "s-plane, the step response, the Bode magnitude and the resonance " +
           "curve, all moving together.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Every panel is drawn from the same two numbers. Move ζ and the poles " +
      "swing, the step's overshoot changes, the Bode peak grows and the filter " +
      "sharpens — <b>simultaneously, because they are the same fact</b>. " +
      "Parts 1 to 6 were not six topics: they were one pole pair, asked four " +
      "different questions. Note the moment ζ passes <b>0.707</b>, where the " +
      "Bode peak vanishes while the step is still overshooting — the two " +
      "domains stop agreeing about whether the system \"resonates\", and both " +
      "are right.",
  });
} });
