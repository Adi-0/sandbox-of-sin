/* ==========================================================================
   figures/control-synthesis.js — Plate 101.

   Six parts, one loop. The plant is the one that has run through Parts 2, 3
   and 4 — K/[s(s+2)(s+8)] — and this plate drives four different views of it
   from a single gain knob, so the agreement between them is something you can
   watch rather than a claim at the end of a chapter.

   At K = 160 the poles reach the imaginary axis, the Routh array's s¹ entry
   reaches zero, the gain margin reaches 0 dB and the step response stops
   settling. Four methods, one fact.
   ========================================================================== */

import { el, knob, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed, sig } from "../lib/fmt.js";
import { roots, dominant, overshoot, add, simulate, routh } from "../lib/poly.js";

const DEG = 180 / Math.PI;
const DEN = [1, 10, 16, 0];          // s(s+2)(s+8)
const POLES = [2, 8];                // the non-origin ones
const K_CRIT = 160;

const magOf = (K, w) => K / (w * POLES.reduce((a, p) => a * Math.hypot(w, p), 1));
const phaseOf = (w) => -90 - POLES.reduce((a, p) => a + Math.atan(w / p) * DEG, 0);

/** The locus, traced once — it does not depend on where the knob is. */
const LOCUS = (() => {
  const branches = [];
  let prev = null;
  for (let i = 0; i <= 700; i++) {
    const K = (i / 700) ** 2 * 420;
    const rs = roots(add(DEN, [K]));
    if (!prev) { rs.forEach((r, j) => { branches[j] = [r]; }); prev = rs; continue; }
    const used = new Array(rs.length).fill(false);
    const next = [];
    for (let j = 0; j < prev.length; j++) {
      let best = -1, bd = Infinity;
      for (let k = 0; k < rs.length; k++) {
        if (used[k]) continue;
        const d = Math.hypot(rs[k][0] - prev[j][0], rs[k][1] - prev[j][1]);
        if (d < bd) { bd = d; best = k; }
      }
      used[best] = true; next.push(rs[best]); branches[j].push(rs[best]);
    }
    prev = next;
  }
  return branches;
})();

function oneLoop() {
  const SX = [-10, 3], SY = [-6, 6];
  const sp = new Plot({
    w: 300, h: 250, xr: SX, yr: SY, pad: { l: 30, r: 12, t: 12, b: 22 },
    label: "The s-plane with the root locus and the closed-loop poles at the current gain.",
  });
  const st = new Plot({
    w: 300, h: 250, xr: [0, 9], yr: [-0.25, 2.3], pad: { l: 34, r: 12, t: 12, b: 26 },
    label: "The closed-loop step response at the current gain.",
  });
  const bm = new Plot({
    w: 300, h: 250, xr: [-1, 1.7], yr: [-60, 60], pad: { l: 38, r: 12, t: 12, b: 26 },
    label: "Open-loop magnitude in decibels, with the gain margin marked.",
  });
  const bp = new Plot({
    w: 300, h: 250, xr: [-1, 1.7], yr: [-280, 10], pad: { l: 38, r: 12, t: 12, b: 26 },
    label: "Open-loop phase in degrees, with the phase margin marked.",
  });

  const rdK = readout({ key: "gain K", value: "", tone: "x" });
  const rdPoles = readout({ key: "closed-loop poles", value: "", tone: "r" });
  rdPoles.root.classList.add("wide");
  const rdPm = readout({ key: "phase margin", value: "", tone: "y" });
  const rdGm = readout({ key: "gain margin", value: "", tone: "y" });
  const rdRouth = readout({ key: "Routh s¹ entry", value: "", tone: "bad" });
  const rdOs = readout({ key: "overshoot", value: "", tone: "bad" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  const solve = (f, target) => {
    let lo = -3, hi = 3;
    const g = (x) => f(10 ** x) - target;
    if (g(lo) * g(hi) > 0) return null;
    for (let i = 0; i < 70; i++) {
      const m = (lo + hi) / 2;
      if (g(lo) * g(m) <= 0) hi = m; else lo = m;
    }
    return 10 ** ((lo + hi) / 2);
  };

  function draw(K) {
    for (const p of [sp, st, bm, bp]) p.clear("curve", "label", "mark", "shade");
    const cl = add(DEN, [K]);
    const rs = roots(cl);
    const unstable = rs.some((z) => z[0] > 1e-7);
    const t = routh(cl);
    const wgc = solve((w) => 20 * Math.log10(magOf(K, w)), 0);
    const pm = wgc == null ? null : 180 + phaseOf(wgc);
    const gm = 20 * Math.log10(K_CRIT / K);

    /* --- 1 · the plane -------------------------------------------------- */
    sp.polygon([[0, SY[0]], [SX[1], SY[0]], [SX[1], SY[1]], [0, SY[1]]],
      { fill: "q-bad-soft", opacity: 0.55 });
    sp.grid({ xStep: 2, yStep: 2 });
    sp.axes({ xLabel: "σ", yLabel: "jω", xStep: 4, yStep: 4, arrows: true });
    for (const br of LOCUS) {
      let run = [];
      const flush = () => {
        if (run.length > 1) {
          const pts = run.slice();
          sp.param((u) => pts[Math.round(u * (pts.length - 1))], [0, 1],
            { color: "q-y", width: 2.2, opacity: 0.5, samples: pts.length - 1 });
        }
        run = [];
      };
      for (const [x, y] of br) {
        if (x >= SX[0] && x <= SX[1] && y >= SY[0] && y <= SY[1]) run.push([x, y]);
        else flush();
      }
      flush();
    }
    for (const x of [0, -2, -8]) sp.text(x, 0, "✕", { color: "ink-strong", size: 15, weight: 700, dy: 5 });
    for (const [x, y] of rs) if (x >= SX[0] && x <= SX[1] && Math.abs(y) <= SY[1]) sp.dot(x, y, { color: "q-r", r: 5 });
    sp.text(SX[0] + 0.3, SY[1] - 0.5, "1 · where the poles are",
      { color: "muted", size: 10, weight: 600, anchor: "start" });

    /* --- 2 · the step --------------------------------------------------- */
    const r = simulate([K], cl, () => 1, 9, 1100);
    const at = (x) => r[Math.min(r.length - 1, Math.round(x / 9 * (r.length - 1)))][1];
    st.grid({ xStep: 1, yStep: 0.5 });
    st.axes({ xLabel: "t (s)", yLabel: "step", xStep: 3, yStep: 1, origin: false });
    st.line(0, 1, 9, 1, { color: "muted", width: 1.1, dash: "5 4" });
    st.curve(at, { color: unstable ? "q-bad" : "q-r", width: 2.4, samples: 500 });
    st.text(8.8, 2.15, "2 · what it does", { color: "muted", size: 10, weight: 600, anchor: "end" });

    /* --- 3 · magnitude -------------------------------------------------- */
    bm.grid({ xStep: 0.25, yStep: 20 });
    bm.axes({ xLabel: "log₁₀ ω", yLabel: "dB", xStep: 1, yStep: 40, origin: false });
    bm.line(-1, 0, 1.7, 0, { color: "muted", width: 1.1, dash: "5 4" });
    bm.curve((x) => 20 * Math.log10(magOf(K, 10 ** x)), { color: "q-x", width: 2.4, samples: 400 });
    const xp = Math.log10(4);
    bm.line(xp, 0, xp, -gm, { color: "q-bad", width: 3 });
    bm.dot(xp, -gm, { color: "q-bad", r: 4 });
    bm.text(xp, -gm, `GM ${fixed(gm, 1)}`,
      { color: "q-bad", size: 10, weight: 700, anchor: "start", dx: 7, dy: gm > 0 ? 13 : -8, bg: true });
    bm.text(1.65, 52, "3 · how much gain is spare", { color: "muted", size: 10, weight: 600, anchor: "end" });

    /* --- 4 · phase ------------------------------------------------------ */
    bp.grid({ xStep: 0.25, yStep: 45 });
    bp.axes({ xLabel: "log₁₀ ω", yLabel: "deg", xStep: 1, yStep: 90, origin: false });
    bp.line(-1, -180, 1.7, -180, { color: "q-bad", width: 1.1, dash: "5 4" });
    bp.curve((x) => phaseOf(10 ** x), { color: "q-y", width: 2.4, samples: 400 });
    if (wgc != null) {
      const xg = Math.log10(wgc);
      bp.line(xg, -180, xg, phaseOf(wgc), { color: "q-r", width: 3 });
      bp.dot(xg, phaseOf(wgc), { color: "q-r", r: 4 });
      bp.text(xg, phaseOf(wgc), `PM ${fixed(pm, 0)}°`,
        { color: "q-r", size: 10, weight: 700, anchor: "start", dx: 7, dy: pm > 0 ? -8 : 15, bg: true });
    }
    bp.text(1.65, -8, "4 · how much lag is spare", { color: "muted", size: 10, weight: 600, anchor: "end" });

    /* --- the numbers ---------------------------------------------------- */
    const d = dominant(rs);
    rdK.set(sig(K, 3));
    rdPoles.set(rs.map(([x, y]) =>
      y === 0 ? num(x, 2) : `${num(x, 2)} ${y > 0 ? "+" : "−"} ${num(Math.abs(y), 2)}j`
    ).join(",&nbsp; "));
    rdPm.set(pm == null ? "—" : `${fixed(pm, 1)}°`);
    rdGm.set(`${fixed(gm, 1)} dB`);
    rdRouth.set(fixed(t.rawFirst[2], 2), " (160−K)/10");
    const marginal = d && d.complex && Math.abs(d.zeta) < 1e-6;
    rdOs.set(unstable ? "grows" : marginal ? "sustained" : d && d.complex ? `${fixed(overshoot(d.zeta), 1)}%` : "none");

    const near = Math.abs(K - K_CRIT) / K_CRIT < 0.02;
    rdNote.set(
      near
        ? `<b>All four panels agree, and this is the point of the plate.</b> The poles are on the imaginary axis at ±4j; the Routh entry (160 − K)/10 has reached zero; the gain margin is 0 dB at ω = 4 rad/s; and the step response has stopped settling. <b>Four methods that share no arithmetic, one gain, one frequency</b> — because all four are asking the same question about the same polynomial.`
        : unstable
          ? `<b>Past the boundary.</b> Two poles are in the right half-plane, the Routh entry is negative, both margins are negative, and the response grows. <b>Every panel says the same thing</b>, which is the only reassurance you get that you have read any of them correctly.`
          : `At K = ${sig(K, 3)} the loop is stable with ${fixed(pm ?? 0, 1)}° of phase margin and ${fixed(gm, 1)} dB of gain margin. <b>Slide up to K = 160 and watch all four panels reach their boundary together.</b> The poles touch the axis, the Routh entry hits zero, the margins hit zero, and the ringing stops decaying — at ω = 4 rad/s in every case.`
    );
  }

  const k = knob({
    label: "gain K", min: 4, max: 280, step: 1, value: 60,
    format: (v) => num(v, 0), onInput: draw,
  });
  draw(60);

  return {
    stage: el("div.quad", null, sp.root, st.root, bm.root, bp.root),
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdK, rdPoles, rdPm, rdGm, rdRouth, rdOs, rdNote),
  };
}

register("oneLoop", { no: 101, build: () => {
  const f = oneLoop();
  return plate({
    no: 101, title: "One loop, four views", tag: "interactive",
    label: "The root locus, step response, Bode magnitude and Bode phase of one plant, all driven by a single gain.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The plant that has run through Parts 2, 3 and 4, with all four ways of " +
      "looking at it driven by one knob. <b>Take K to 160.</b> The poles reach " +
      "the imaginary axis at ±4j, the Routh array's s¹ entry reaches zero, both " +
      "margins reach zero at ω = 4 rad/s, and the step response stops settling " +
      "— simultaneously, because they are four descriptions of one polynomial " +
      "and not four separate facts. <b>That is what this module is</b>: one " +
      "loop, asked six different questions.",
  });
} });
