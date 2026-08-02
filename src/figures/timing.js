/* ==========================================================================
   figures/timing.js — Plates 73 and 74.

   Plate 73 is the setup-and-hold window drawn as a window: a data edge that
   the reader slides across a clock edge, with the flip-flop reporting capture,
   violation, or metastability. The metastable region is not decoration — the
   plate computes a real MTBF from the reader's clock and data rates, and the
   number it gives for a marginal design is the argument for a synchroniser.

   Plate 74 is a static hazard, built rather than asserted: two paths through
   the same expression with different delays, drawn as waveforms, and a
   redundant term that removes the glitch without changing the logic.
   ========================================================================== */

import { el, svg, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { fixed, num, sci } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;

/** A digital trace: a polyline through [x, y] pairs given in data units. */
function trace(p, pts, color, width, dash) {
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"} ${p.x(x).toFixed(1)} ${p.y(y).toFixed(1)}`).join(" ");
  p.add("curve", svg("path", {
    d, fill: "none", stroke: V(color), strokeWidth: width,
    strokeDasharray: dash, strokeLinejoin: "miter",
  }));
}

/* ==========================================================================
   Plate 73 — the aperture

   One knob: where the data edge falls relative to the clock edge. One
   control: how tight the window is. Lesson: a flip-flop is not a camera with
   an infinitely short shutter, and what happens inside the aperture is not
   simply "wrong" — it is undefined for an unbounded time.
   ========================================================================== */

/* Setup, hold, the metastability decay constant and the aperture constant,
   all in the ranges real datasheets quote. The clock is fixed at 50 MHz and
   the asynchronous input toggles at 1 MHz — both stated on the plate, because
   an MTBF with no rates attached means nothing. */
const FCLK = 50e6, FDATA = 1e6, TCLK = 1e9 / FCLK;    // TCLK in ns

const PARTS = {
  fast: { name: "Fast logic", tsu: 4, th: 2, tau: 0.15, t0: 1e-9 },
  typ: { name: "Typical", tsu: 10, th: 4, tau: 0.4, t0: 2e-9 },
  slow: { name: "Slow, wide window", tsu: 16, th: 7, tau: 1.2, t0: 5e-9 },
};

/**
 * Mean time between metastable failures, for one unsynchronised input.
 *
 *     MTBF = exp(t_r / τ) / (t_0 · f_clk · f_data)
 *
 * `t_r` is how long the output is left alone to resolve before anything reads
 * it — one clock period less the next stage's setup time. The exponential is
 * the whole story: the denominator is a rate you cannot do much about, and the
 * numerator doubles its exponent every time you add a flip-flop.
 */
const mtbfOf = (P, stages) =>
  Math.exp((stages * TCLK - P.tsu) / P.tau) / (P.t0 * FCLK * FDATA);

/** Seconds as [number, unit] in the largest unit that stays readable. */
function span(sec) {
  const yr = sec / (3600 * 24 * 365);
  if (yr >= 1e4) return [sci(yr, 2), " years"];
  if (yr >= 1) return [num(yr, 0), " years"];
  const d = sec / (3600 * 24);
  if (d >= 1) return [num(d, 1), " days"];
  const h = sec / 3600;
  if (h >= 1) return [num(h, 1), " hours"];
  if (sec >= 1) return [num(sec, 1), " s"];
  return [sci(sec, 2), " s"];
}

function aperture() {
  const CLKX = 300;                       // the clock edge, in ns × 6 px
  const PX = 6;                           // pixels per nanosecond
  const ns = (t) => CLKX + t * PX;        // time relative to the clock edge

  const p = new Plot({
    w: 620, h: 288, xr: [0, 588], yr: [-126, 92],
    pad: { l: 16, r: 16, t: 12, b: 10 },
    label:
      "A clock edge with a shaded setup-and-hold window around it, a data " +
      "edge that can be moved across that window, and the resulting Q output " +
      "shown as captured, missed, or metastable.",
  });

  const rdPart = readout({ key: "part", value: "" });
  const rdWin = readout({ key: "window", value: "", tone: "x" });
  const rdWhen = readout({ key: "data edge", value: "", tone: "y" });
  const rdVerdict = readout({ key: "flip-flop", value: "", tone: "r" });
  const rdMtbf = readout({ key: "MTBF, direct", value: "", tone: "bad" });
  const rdSync = readout({ key: "+ one flip-flop", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "typ";

  function draw(when) {
    p.clear("curve", "label", "mark", "shade");
    const P = PARTS[cur];
    const H = 30;
    const yClk = 40, yD = -22, yQ = -92;

    // the aperture: t_su before the edge, t_h after it
    p.add("shade", svg("rect", {
      x: p.x(ns(-P.tsu)), y: p.y(yClk + H + 8),
      width: p.x(ns(P.th)) - p.x(ns(-P.tsu)),
      height: p.y(yQ - 12) - p.y(yClk + H + 8),
      fill: V("q-bad"), opacity: 0.10,
    }));
    p.line(ns(-P.tsu), yClk + H + 8, ns(-P.tsu), yQ - 12, { color: "q-bad", width: 1, dash: "3 3" });
    p.line(ns(P.th), yClk + H + 8, ns(P.th), yQ - 12, { color: "q-bad", width: 1, dash: "3 3" });
    p.text(ns((P.th - P.tsu) / 2), yClk + H + 20,
      `aperture:  setup ${P.tsu} ns  +  hold ${P.th} ns`,
      { color: "q-bad", size: 10.5, weight: 600 });

    // the clock, rising at CLKX
    trace(p, [[40, yClk], [CLKX, yClk], [CLKX, yClk + H], [560, yClk + H]], "muted", 2);
    p.text(28, yClk + H / 2, "CLK", { color: "muted", size: 11.5, weight: 600, anchor: "end", dy: 4 });
    p.line(CLKX, yClk + H + 4, CLKX, yQ - 16, { color: "muted", width: 1, dash: "2 4" });

    // the data edge, wherever the reader has put it
    const dx = ns(when);
    trace(p, [[40, yD], [dx, yD], [dx, yD + H], [560, yD + H]], "q-x", 2.4);
    p.text(28, yD + H / 2, "D", { color: "q-x", size: 12.5, weight: 600, anchor: "end", dy: 4 });
    p.text(dx, yD + H + 9, `${when > 0 ? "+" : ""}${when} ns`,
      { color: "q-x", size: 10.5, weight: 600, bg: true });

    /* Three outcomes, and the middle one is the interesting one. Settled
       before the window opens: captured. Arrives after it closes: the old
       value is captured, which is late but perfectly defined. Inside: the
       output takes an unbounded time to resolve. */
    const late = when > P.th;
    const inside = when >= -P.tsu && when <= P.th;
    let verdict, tone, note;

    if (!inside && !late) {
      trace(p, [[40, yQ], [CLKX, yQ], [CLKX, yQ + H], [560, yQ + H]], "q-y", 2.6);
      verdict = "captures 1";
      tone = "clean";
      note = `The data settled <b>${fixed(-when - P.tsu, 0)} ns before the window opened</b> and held through it, so the flip-flop has an unambiguous value to latch. This is the only case a synchronous design is allowed to rely on, and the whole job of static timing analysis is proving that every path in a chip is in it.`;
    } else if (late) {
      trace(p, [[40, yQ], [560, yQ]], "q-y", 2.6);
      verdict = "captures 0 — the old value";
      tone = "clean";
      note = `The data arrived <b>${fixed(when - P.th, 0)} ns after the window closed</b>, so this edge captures the previous value and the new one waits for the next clock. That is late, but it is <b>defined</b> — and a design where the answer is merely a cycle late is in far better shape than one where it is undefined.`;
    } else {
      // metastable: an exponentially decaying uncertainty, drawn as such
      const pts = [];
      for (let x = CLKX; x <= 560; x += 3) {
        const t = (x - CLKX) / PX;
        const env = Math.exp(-t / (P.tau * 8));
        pts.push([x, yQ + H * (0.5 + 0.5 * (1 - env) )]);
      }
      trace(p, [[40, yQ], [CLKX, yQ]], "q-y", 2.6);
      trace(p, pts, "q-bad", 2.6);
      // the uncertainty band it is resolving inside
      const band = [];
      for (let x = CLKX; x <= 560; x += 3) {
        const t = (x - CLKX) / PX;
        band.push([x, yQ + H * (0.5 - 0.5 * Math.exp(-t / (P.tau * 8)))]);
      }
      trace(p, band, "q-bad", 1.2, "3 3");
      p.text(CLKX + 60, yQ + H + 12, "resolving — for how long is not bounded",
        { color: "q-bad", size: 10.5, weight: 600, anchor: "start" });
      verdict = "metastable";
      tone = "bad";
      note = `The data edge landed <b>inside the aperture</b>, so the flip-flop was asked to decide while its input was still moving. Its output sits between the logic levels and decays towards one rail or the other — but <b>the time that takes has no upper bound</b>, only a probability. It is not a rare fault to be debugged; it is a <b>certainty to be budgeted for</b> — and the two figures beside this are that budget. Feeding this input straight into the logic fails every <b>${span(mtbfOf(P, 1)).join('')}</b>; passing it through <em>one extra flip-flop</em> first, so it has another whole clock period to settle before anything reads it, moves that to <b>${span(mtbfOf(P, 2)).join('')}</b>. The exponential is doing all the work, which is why the fix is one flip-flop rather than a faster part.`;
    }
    p.text(28, yQ + H / 2, "Q", { color: tone === "bad" ? "q-bad" : "q-y", size: 12.5, weight: 600, anchor: "end", dy: 4 });
    p.text(40, yQ - 22, "clock 50 MHz · asynchronous input toggling at 1 MHz",
      { color: "muted", size: 10, anchor: "start" });

    const one = mtbfOf(P, 1), two = mtbfOf(P, 2);
    const verdictOf = (s) => {
      const yr = s / (3600 * 24 * 365);
      return yr > 1e4 ? " — safe" : yr > 1 ? " — marginal" : " — unusable";
    };

    rdPart.set(P.name);
    rdWin.set(`${P.tsu + P.th} ns`, ` = ${P.tsu} + ${P.th}`);
    rdWhen.set(`${when > 0 ? "+" : ""}${when} ns`, when === 0 ? " — on the edge" : "");
    rdVerdict.set(verdict);
    const [m1, u1] = span(one), [m2, u2] = span(two);
    rdMtbf.set(m1, `${u1}${verdictOf(one)}`);
    rdSync.set(m2, `${u2}${verdictOf(two)}`);
    rdNote.set(note);
  }

  const k = knob({
    label: "data edge, relative to the clock", min: -40, max: 40, step: 1, value: -25,
    format: (v) => `${v > 0 ? "+" : ""}${v} ns`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "flip-flop",
    options: Object.keys(PARTS).map((id) => ({ id, label: PARTS[id].name })),
    value: "typ",
    onChange: (id) => { cur = id; draw(k.value()); },
  });
  draw(-25);

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdPart, rdWin, rdWhen, rdVerdict, rdMtbf, rdSync, rdNote),
  };
}

/* ==========================================================================
   Plate 74 — a static hazard, and the term that removes it

   F = A·C̄ + B·C, held at A = B = 1, while C falls. Both product terms are
   supposed to hand over cleanly; the inverter's delay means the first drops
   before the second rises, and F dips. The consensus term A·B covers the
   handover and never drops.
   ========================================================================== */

function hazard() {
  const PX = 5.6;                          // pixels per nanosecond
  const X0 = 92, T0 = 20;                  // C falls at t = 20 ns

  const p = new Plot({
    w: 620, h: 310, xr: [0, 588], yr: [-163, 76],
    pad: { l: 16, r: 16, t: 12, b: 10 },
    label:
      "Waveforms for a two-term sum of products while one input falls: the " +
      "input, the two product terms, and the output, which briefly dips to " +
      "zero when the inverter's delay makes the terms hand over late.",
  });

  const rdExpr = readout({ key: "F", value: "" });
  const rdInv = readout({ key: "inverter delay", value: "", tone: "x" });
  const rdGate = readout({ key: "gate delay", value: "", tone: "x" });
  const rdGlitch = readout({ key: "glitch", value: "", tone: "bad" });
  const rdFix = readout({ key: "consensus term", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let fixed_ = false;                      // has the reader added A·B?
  const TG = 6;                            // one gate delay, ns

  function draw(tinv) {
    p.clear("curve", "label", "mark", "shade");
    const H = 24, ROW = 42;
    const t = (v) => X0 + v * PX;
    const END = 80;

    /* A·C̄ falls one gate delay after C rises... but C is falling here, so
       C̄ rises t_inv late and A·C̄ rises t_inv + t_gate after C falls.
       B·C falls t_gate after C falls. The gap between them is the glitch. */
    const acRise = T0 + tinv + TG;         // A·C̄ goes high
    const bcFall = T0 + TG;                // B·C goes low
    const gap = Math.max(0, acRise - bcFall);
    const rows = [
      { name: "C", color: "q-x", seg: [[0, 1], [T0, 0]] },
      { name: "A·C̄", color: "q-y", seg: [[0, 0], [acRise, 1]] },
      { name: "B·C", color: "q-y", seg: [[0, 1], [bcFall, 0]] },
    ];
    if (fixed_) rows.push({ name: "A·B", color: "q-r", seg: [[0, 1]] });

    rows.forEach((r, i) => {
      const y = 34 - i * ROW;
      const pts = [];
      let lvl = r.seg[0][1];
      pts.push([t(0), y + lvl * H]);
      for (const [at, v] of r.seg.slice(1)) {
        pts.push([t(at), y + lvl * H], [t(at), y + v * H]);
        lvl = v;
      }
      pts.push([t(END), y + lvl * H]);
      trace(p, pts, r.color, 2.2);
      p.text(X0 - 12, y + H / 2, r.name,
        { color: r.color, size: 12, weight: 600, anchor: "end", dy: 4 });
    });

    /* F keeps its row whether or not the consensus term is showing, so the
       empty band above it reads as the missing term rather than as the plate
       shifting under the reader. */
    const yF = 34 - 4 * ROW - 10;
    const glitch = !fixed_ && gap > 0.2;
    const fpts = [[t(0), yF + H]];
    if (glitch) {
      fpts.push([t(bcFall), yF + H], [t(bcFall), yF],
        [t(acRise), yF], [t(acRise), yF + H]);
      p.add("shade", svg("rect", {
        x: p.x(t(bcFall)), y: p.y(yF + H + 6),
        width: p.x(t(acRise)) - p.x(t(bcFall)),
        height: p.y(yF - 8) - p.y(yF + H + 6),
        fill: V("q-bad"), opacity: 0.16,
      }));
      p.text(t((bcFall + acRise) / 2), yF + H + 14, `${fixed(gap, 0)} ns`,
        { color: "q-bad", size: 11, weight: 700 });
    }
    fpts.push([t(END), yF + H]);
    trace(p, fpts, glitch ? "q-bad" : "q-r", 2.8);
    p.text(X0 - 12, yF + H / 2, "F",
      { color: glitch ? "q-bad" : "q-r", size: 13, weight: 700, anchor: "end", dy: 4 });

    // where C actually changes
    p.line(t(T0), 34 + H + 14, t(T0), yF - 20, { color: "muted", width: 1, dash: "2 4" });
    p.text(t(T0), 34 + H + 22, "C falls (A = B = 1 throughout)",
      { color: "muted", size: 10.5 });

    rdExpr.set(fixed_ ? "A·C̄ + B·C + A·B" : "A·C̄ + B·C");
    rdInv.set(`${fixed(tinv, 0)} ns`);
    rdGate.set(`${TG} ns`, " per AND / OR");
    rdGlitch.set(glitch ? `${fixed(gap, 0)} ns wide` : "none", glitch ? "" : " — F never drops");
    rdFix.set(fixed_ ? "A·B, added" : "A·B, not added");
    rdNote.set(
      fixed_
        ? `<b>A·B is logically redundant</b> — every row it covers is already covered by one of the other two, so the truth table does not change by a single entry. What it does is hold F high <em>during the handover</em>, while A·C̄ is still waiting for the inverter and B·C has already let go. <b>Minimisation removes exactly this kind of term</b>, which is why a minimal expression is not automatically a safe one.`
        : glitch
          ? `Both terms are 1 before and after, so <b>F should never move</b> — and the truth table agrees. But C̄ arrives ${fixed(tinv, 0)} ns late, so B·C drops before A·C̄ has come up, and for ${fixed(gap, 0)} ns neither term is holding F. That is a <span class="term">static-1 hazard</span>: a momentary 0 in an output that logic says is constant. Harmless into a clocked input, and a real fault into anything level-sensitive — a latch enable, an asynchronous clear, a clock.`
          : `With the inverter this fast, the two terms hand over with no gap between them and F holds. <b>The hazard has not been removed — it has been hidden</b>, and it returns with a slower part, a hotter die, or a longer wire. Raise the delay to see it, then add the consensus term to remove it properly.`
    );
  }

  const k = knob({
    label: "inverter delay", min: 0, max: 20, step: 1, value: 8,
    format: (v) => `${v} ns`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "expression",
    options: [
      { id: "min", label: "Minimal" },
      { id: "haz", label: "+ consensus term" },
    ],
    value: "min",
    onChange: (id) => { fixed_ = id === "haz"; draw(k.value()); },
  });
  draw(8);

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdExpr, rdInv, rdGate, rdGlitch, rdFix, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("aperture", { no: 73, build: () => {
  const f = aperture();
  return plate({
    no: 73, title: "The aperture", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "A flip-flop does not sample at an instant — it samples through a window " +
      "that opens t<sub>su</sub> before the clock edge and closes t<sub>h</sub> " +
      "after it. <b>Slide the data edge across that window.</b> Outside it on " +
      "either side the answer is defined, early or late; inside it the output " +
      "is neither 0 nor 1 and decays towards a rail over a time that has no " +
      "upper bound, only a probability. The MTBF beside the plate is that " +
      "probability turned into a number, and it is the argument for a " +
      "two-flip-flop synchroniser on every input that is not already " +
      "synchronous.",
  });
} });

register("hazard", { no: 74, build: () => {
  const f = hazard();
  return plate({
    no: 74, title: "A glitch that the truth table cannot see", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "F = A·C̄ + B·C with A and B both held high. Logically F is 1 whatever C " +
      "does — both product terms cover it and the truth table has no zero to " +
      "offer. But C̄ arrives late, so the term letting go moves before the term " +
      "taking over, and F dips. <b>Add the consensus term A·B</b> and the dip " +
      "vanishes without a single entry of the truth table changing. The term " +
      "is redundant, which is precisely why Part 3's minimisation deletes it — " +
      "and why a minimal expression is not automatically a safe one.",
  });
} });
