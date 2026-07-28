/* ==========================================================================
   figures/three-phase.js — Plates 39, 40 and 41.

   Plate 39 answers "why three?" before any arithmetic: the instantaneous
   powers of three phases sum to a constant, at every load angle. Plate 40
   derives the root three from a vector subtraction rather than asserting it.
   Plate 41 puts the same three impedances in both connections and shows the
   factor of three in the power.

   The cast: each phase is the 3 + j4 impedance from Circuit Analysis Part 6
   on the 120 V of Part 5, so the wye totals are 5184 W, 6912 VAR, 8640 VA.
   ========================================================================== */

import { el, svg, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed, degv } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;
const RT3 = Math.sqrt(3);

/* One phase of the plant, shared by all three plates. */
const PH = { Vp: 120, R: 3, X: 4, Z: 5, thDeg: 53.13 };

/* ==========================================================================
   Plate 39 — why three phases
   One knob: the load angle. Lesson: whatever the angle, the three
   instantaneous powers sum to a flat line. A single phase never does.
   ========================================================================== */

function threePhasePower() {
  const Vp = PH.Vp, Ip = Vp / PH.Z;           // 120 V, 24 A
  const VI = Vp * Ip;                          // 2880 VA per phase

  const p = new Plot({
    w: 620, h: 340, xr: [0, 2], yr: [-2800, 9400],
    pad: { l: 56, r: 16, t: 16, b: 34 },
    label:
      "Instantaneous power against time over two cycles. Three thin curves, one " +
      "per phase, each pulsating and dipping below zero; a thick horizontal line " +
      "shows their sum, which does not vary.",
  });
  p.grid({ xStep: 0.25, yStep: 1000 });
  p.axes({
    xStep: 0.5, yStep: 2000, xLabel: "cycles",
    xFmt: (v) => (v === 0 ? "" : num(v, 1)),
    yFmt: (v) => (v === 0 ? "0" : `${num(v / 1000, 0)}k`),
  });

  /* All three phases share one colour: they are the same kind of thing, and
     the contrast that matters is thin-and-pulsating against thick-and-flat.
     Inventing a third quantity colour here would break the palette's meaning. */
  const phases = [0, 1, 2].map(() =>
    p.param(() => [NaN, NaN], [0, 1], { color: "q-x", width: 1.5, opacity: 0.7 }));
  const total = p.param(() => [NaN, NaN], [0, 1], { color: "q-r", width: 3.2 });
  const tTotal = haloText(p, p.x(1.0), 0, { color: "q-r", size: 12, weight: 600 });
  const tPhase = haloText(p, p.x(0.30), 0, { color: "q-x", size: 11 });

  const rdTh = readout({ key: "load angle θ", value: "" });
  const rdPf = readout({ key: "power factor", value: "" });
  const rdOne = readout({ key: "one phase", value: "", tone: "x" });
  const rdSum = readout({ key: "all three", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  /* p(t) for a phase shifted by k*120 degrees:
       v = sqrt2 V cos(wt - k120),  i = sqrt2 I cos(wt - k120 - th)
       p = VI[cos th + cos(2wt - 2k120 - th)]
     The three second-harmonic terms are 240 degrees apart, so they cancel. */
  const pk = (t, k, th) =>
    VI * (Math.cos(th) + Math.cos(2 * (2 * Math.PI * t - k * 2 * Math.PI / 3) - th));

  function draw(pf) {
    const th = Math.acos(pf);
    const thDeg = (th * 180) / Math.PI;
    const N = 420;
    const paths = [[], [], [], []];
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * 2;
      let sum = 0;
      for (let k = 0; k < 3; k++) {
        const v = pk(t, k, th);
        sum += v;
        paths[k].push(`${p.x(t).toFixed(2)} ${p.y(v).toFixed(2)}`);
      }
      paths[3].push(`${p.x(t).toFixed(2)} ${p.y(sum).toFixed(2)}`);
    }
    phases.forEach((el2, k) => el2.setAttribute("d", "M " + paths[k].join(" L ")));
    total.setAttribute("d", "M " + paths[3].join(" L "));

    const Ptot = 3 * VI * pf;
    const Pone = VI * pf;
    tTotal.set(p.x(1.0), p.y(Ptot) - 10, `sum = ${num(Ptot, 0)} W, constant`);
    // sit the label on an actual peak of phase a, which moves with the angle
    const tPeak = th / (4 * Math.PI) + 0.5;
    tPhase.set(p.x(tPeak), p.y(VI * (pf + 1)) - 9, "one phase");

    rdTh.set(degv(thDeg, 2));
    rdPf.set(`${fixed(pf, 2)} lagging`);
    rdOne.set(`${num(Pone, 0)} W`, " average, pulsating");
    rdSum.set(`${num(Ptot, 0)} W`, " every instant");
    rdNote.set(
      pf > 0.995
        ? "Even at unity power factor a <b>single</b> phase delivers zero power twice per cycle — the thin curves touch the axis. The sum of three never does."
        : `Each phase now goes <b>negative</b> for part of every cycle, handing energy back. The three still sum to a flat ${num(Ptot, 0)} W: whatever one phase returns, the other two are drawing.`
    );
  }

  /* The knob is the power factor rather than the angle, so its default lands
     exactly on the cast's 0.6 — 53.13° is not reachable on a whole-degree step,
     and a plate reading 5200 W against prose reading 5184 W is a defect. */
  const k = knob({
    label: "power factor", min: 0.3, max: 1, step: 0.01, value: 0.6,
    format: (v) => (v >= 0.995 ? "1.00 (unity)" : `${fixed(v, 2)} lagging`),
    onInput: draw,
  });
  draw(0.6);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdTh, rdPf, rdOne, rdSum, rdNote),
  };
}

/* ==========================================================================
   Plate 40 — where the root three comes from
   One control: which line voltage. Lesson: a line voltage is the difference
   of two phase voltages, and subtracting two equal vectors 120 degrees apart
   gives root three times one of them.
   ========================================================================== */

function lineVsPhase() {
  const Vp = PH.Vp;

  /* Equal scales — this plate is a geometric argument, so the geometry has to
     be true. The window is offset upward because the resultant reaches higher
     than any of the three phasors it is built from. */
  const p = new Plot({
    w: 520, h: 440, xr: [-208, 208], yr: [-120, 230],
    pad: { l: 8, r: 8, t: 8, b: 8 },
    label:
      "A phasor diagram of three phase voltages 120 degrees apart, with one line " +
      "voltage drawn as the vector difference of two of them. The difference is " +
      "longer than either phasor by a factor of the square root of three.",
  });

  const NAMES = ["an", "bn", "cn"];
  const ANG = [90, -30, -150].map((d) => (d * Math.PI) / 180);
  const COL = ["q-x", "q-y", "muted"];

  // the three phase voltages, always shown
  ANG.forEach((a, i) => {
    p.vector(0, 0, Vp * Math.cos(a), Vp * Math.sin(a), { color: COL[i], width: 2.25 });
    p.text((Vp + 26) * Math.cos(a), (Vp + 26) * Math.sin(a),
      `V${NAMES[i]}`, { color: COL[i], size: 12, weight: 600 });
  });
  p.ring(0, 0, { color: "grid", r: 3 });
  p.text(0, 0, "n", { dx: -13, dy: 17, color: "muted", size: 11 });

  // -Vbn is the same quantity as Vbn, reversed, so it keeps Vbn's colour and
  // says "construction" with a dash. q-bad is reserved for errors.
  const neg = p.vector(0, 0, 0, 0, { color: "q-y", width: 2, dash: "5 4" });
  const tNeg = p.text(0, 0, "", { color: "q-y", size: 11.5, weight: 600 });
  const shift = p.line(0, 0, 0, 0, { color: "muted", width: 1.4, dash: "4 4", opacity: 0.85 });
  const res = p.vector(0, 0, 0, 0, { color: "q-r", width: 3 });
  const tRes = p.text(0, 0, "", { color: "q-r", size: 13, weight: 600 });
  const arc = p.angleArc(0, 0, 0, 0.1, 46, { color: "muted", width: 1.4 }).querySelector("path");
  const tArc = p.text(0, 0, "", { color: "muted", size: 11 });

  const rdPhase = readout({ key: "phase", value: `${Vp} V`, tone: "x" });
  const rdLine = readout({ key: "line", value: "", tone: "r" });
  const rdRatio = readout({ key: "ratio", value: "" });
  const rdAng = readout({ key: "it leads by", value: "" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(which) {
    const [i, j] = { ab: [0, 1], bc: [1, 2], ca: [2, 0] }[which];
    const A = [Vp * Math.cos(ANG[i]), Vp * Math.sin(ANG[i])];
    const B = [Vp * Math.cos(ANG[j]), Vp * Math.sin(ANG[j])];
    const D = [A[0] - B[0], A[1] - B[1]];
    const mag = Math.hypot(D[0], D[1]);
    const ang = (Math.atan2(D[1], D[0]) * 180) / Math.PI;
    const lead = ((ang - (ANG[i] * 180) / Math.PI) % 360 + 360) % 360;

    // -V(j), drawn from the origin, and the parallelogram side that closes it
    neg.setAttribute("x2", p.x(-B[0])); neg.setAttribute("y2", p.y(-B[1]));
    neg.setAttribute("x1", p.x(0)); neg.setAttribute("y1", p.y(0));
    setAt(tNeg, p.x(-B[0] * 1.19), p.y(-B[1] * 1.19), `−V${NAMES[j]}`);

    shift.setAttribute("x1", p.x(-B[0])); shift.setAttribute("y1", p.y(-B[1]));
    shift.setAttribute("x2", p.x(D[0])); shift.setAttribute("y2", p.y(D[1]));

    res.setAttribute("x1", p.x(0)); res.setAttribute("y1", p.y(0));
    res.setAttribute("x2", p.x(D[0])); res.setAttribute("y2", p.y(D[1]));
    setAt(tRes, p.x(D[0] * 1.13), p.y(D[1] * 1.13), `V${which} = ${fixed(mag, 1)} V`);

    const a0 = Math.atan2(p.y(0) - p.y(A[1]), p.x(A[0]) - p.x(0));
    const a1 = Math.atan2(p.y(0) - p.y(D[1]), p.x(D[0]) - p.x(0));
    arc.setAttribute("d", arcD(p.x(0), p.y(0), 46, a0, a1));
    const mid = (a0 + a1) / 2;
    setAt(tArc, p.x(0) + 66 * Math.cos(mid), p.y(0) - 66 * Math.sin(mid) + 4, "30°");

    rdLine.set(`${fixed(mag, 1)} V`);
    rdRatio.set(`${fixed(mag / Vp, 4)}`, ` = √3`);
    rdAng.set(`${fixed(lead, 0)}°`, ` ahead of V${NAMES[i]}`);
    rdNote.set(
      `<b>V<sub>${which}</sub> = V<sub>${NAMES[i]}</sub> − V<sub>${NAMES[j]}</sub>.</b> ` +
      "Two equal phasors 120° apart, subtracted, give one that is √3 longer and " +
      "30° ahead. That is the whole origin of the factor — no formula, just the " +
      "triangle closing."
    );
  }

  const sc = scenarios({
    label: "line voltage",
    options: [
      { id: "ab", label: "Vab" },
      { id: "bc", label: "Vbc" },
      { id: "ca", label: "Vca" },
    ],
    value: "ab",
    onChange: draw,
  });
  draw("ab");

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root),
    readouts: readouts(rdPhase, rdLine, rdRatio, rdAng, rdNote),
  };
}

/* ==========================================================================
   Plate 41 — the same three impedances, both ways round
   One control: the connection. Lesson: on the same line voltage a delta
   draws three times the power of a wye, and the root three swaps sides.
   ========================================================================== */

function wyeDelta() {
  const VL = Vline();                          // 207.85 V, kept as one definition
  const Z = PH.Z, Rr = PH.R;

  const p = new Plot({
    w: 520, h: 340, xr: [-1.67, 1.67], yr: [-0.80, 1.35],
    pad: { l: 8, r: 8, t: 8, b: 8 },
    label:
      "A three-phase load drawn first as a wye and then as a delta, with the " +
      "line and phase quantities labelled on each so the position of the square " +
      "root of three can be compared.",
  });

  const rdConn = readout({ key: "connection", value: "" });
  const rdVp = readout({ key: "phase V", value: "", tone: "x" });
  const rdIp = readout({ key: "phase I", value: "", tone: "y" });
  const rdIl = readout({ key: "line I", value: "", tone: "y" });
  const rdP = readout({ key: "total P", value: "", tone: "r" });
  const rdS = readout({ key: "total S", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  const TERM = [90, -30, -150].map((d) => (d * Math.PI) / 180);
  const TN = ["A", "B", "C"];

  function draw(kind) {
    p.clear("curve", "label", "mark", "shade");
    const wye = kind === "wye";

    const Vp = wye ? VL / RT3 : VL;
    const Ip = Vp / Z;
    const Il = wye ? Ip : Ip * RT3;
    const P = 3 * Ip * Ip * Rr;
    const S = 3 * Vp * Ip;

    if (wye) {
      p.ring(0, 0, { color: "ink", r: 3.5, width: 2 });
      p.text(0, 0, "N", { dx: 0, dy: 22, color: "muted", size: 11 });
      TERM.forEach((a, i) => {
        const u = [Math.cos(a), Math.sin(a)];
        p.line(u[0] * 0.30, u[1] * 0.30, u[0] * 0.62, u[1] * 0.62, { color: "ink", width: 1.8 });
        p.line(0, 0, u[0] * 0.30, u[1] * 0.30, { color: "ink", width: 1.8 });
        zbox(p, [u[0] * 0.46, u[1] * 0.46], a, "3 + j4", a + Math.PI / 2);
        p.line(u[0] * 0.62, u[1] * 0.62, u[0] * 1.02, u[1] * 1.02, { color: "ink", width: 1.8 });
        p.dot(u[0] * 1.02, u[1] * 1.02, { color: "ink", r: 4 });
        p.text(u[0] * 1.15, u[1] * 1.15, TN[i], { color: "ink", size: 13, weight: 600 });
      });
      // line-to-line, drawn as the chord it is
      p.line(Math.cos(TERM[0]) * 1.02, Math.sin(TERM[0]) * 1.02,
             Math.cos(TERM[1]) * 1.02, Math.sin(TERM[1]) * 1.02,
             { color: "q-r", width: 1.5, dash: "5 4" });
      p.text(0.80, 0.30, `line ${fixed(VL, 0)} V`, { color: "q-r", size: 11.5, weight: 600, bg: true });
      p.text(0.34, 0.70, `phase ${fixed(Vp, 0)} V`, { color: "q-x", size: 11.5, weight: 600, bg: true });
    } else {
      const v = TERM.map((a) => [Math.cos(a) * 0.86, Math.sin(a) * 0.86]);
      for (let i = 0; i < 3; i++) {
        const a = v[i], b = v[(i + 1) % 3];
        const dir = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        p.line(a[0], a[1], mid[0] - Math.cos(dir) * 0.16, mid[1] - Math.sin(dir) * 0.16,
          { color: "ink", width: 1.8 });
        p.line(mid[0] + Math.cos(dir) * 0.16, mid[1] + Math.sin(dir) * 0.16, b[0], b[1],
          { color: "ink", width: 1.8 });
        zbox(p, mid, dir, "3 + j4", Math.atan2(mid[1], mid[0]));
      }
      TERM.forEach((a, i) => {
        const u = [Math.cos(a), Math.sin(a)];
        p.line(u[0] * 0.86, u[1] * 0.86, u[0] * 1.16, u[1] * 1.16, { color: "ink", width: 1.8 });
        p.dot(u[0] * 0.86, u[1] * 0.86, { color: "ink", r: 4 });
        p.text(u[0] * 1.30, u[1] * 1.30, TN[i], { color: "ink", size: 13, weight: 600 });
      });
      p.text(0.05, 0.36, `phase = line`, { color: "q-x", size: 11.5, weight: 600, bg: true });
      p.text(0.05, 0.15, `${fixed(VL, 0)} V`, { color: "q-x", size: 11.5, weight: 600, bg: true });
    }

    rdConn.set(wye ? "wye (Y)" : "delta (Δ)");
    rdVp.set(`${fixed(Vp, 1)} V`, wye ? " = V<sub>L</sub> ÷ √3" : " = V<sub>L</sub>");
    rdIp.set(`${fixed(Ip, 1)} A`);
    rdIl.set(`${fixed(Il, 1)} A`, wye ? " = I<sub>φ</sub>" : " = √3 I<sub>φ</sub>");
    rdP.set(`${num(P, 0)} W`);
    rdS.set(`${num(S, 0)} VA`);
    rdNote.set(
      wye
        ? "<b>Wye:</b> the three phases meet at a neutral, so each phase carries its own line current — <b>I<sub>L</sub> = I<sub>φ</sub></b>. The √3 lands on the voltage instead. Switch to delta and watch the power."
        : `<b>Delta:</b> the three phases form a closed loop, so each sees the full line voltage — <b>V<sub>φ</sub> = V<sub>L</sub></b> — and the √3 lands on the current. The same three impedances now draw <b>${num(P, 0)} W</b>, exactly <b>three times</b> the wye figure. Nothing was changed but the wiring.`
    );
  }

  const sc = scenarios({
    label: "connection",
    options: [
      { id: "wye", label: "Wye (Y)" },
      { id: "delta", label: "Delta (Δ)" },
    ],
    value: "wye",
    onChange: draw,
  });
  draw("wye");

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root),
    readouts: readouts(rdConn, rdVp, rdIp, rdIl, rdP, rdS, rdNote),
  };
}

/* -------------------------------------------------------------------------
   helpers
   ------------------------------------------------------------------------- */

/** The cast's line voltage, from its phase voltage — never hard-coded as 208. */
function Vline() { return PH.Vp * RT3; }

function setAt(node, px, py, str) {
  node.setAttribute("x", px);
  node.setAttribute("y", py);
  node.textContent = str;
}

/** A movable label with a plate-coloured halo. Plot.text with bg returns a
    group of two <text> nodes, so both have to be kept in step. */
function haloText(p, px, py, { color = "ink", size = 11, weight = null } = {}) {
  const g = p.text(0, 0, "", { view: true, bg: true, color, size, weight });
  const parts = [...g.childNodes];
  const set = (x, y, str) => parts.forEach((t) => {
    t.setAttribute("x", x); t.setAttribute("y", y); t.textContent = str;
  });
  set(px, py, "");
  return { node: g, set };
}

function arcD(cx, cy, r, a0, a1) {
  const steps = Math.max(8, Math.round(Math.abs(a1 - a0) * 24));
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = a0 + (i / steps) * (a1 - a0);
    pts.push(`${(cx + r * Math.cos(t)).toFixed(2)} ${(cy - r * Math.sin(t)).toFixed(2)}`);
  }
  return "M " + pts.join(" L ");
}

/** An impedance box centred at a data point, its long axis along `dir` radians.
    `labelAt` is the data-space direction the value sits in, so the text clears
    the box whichever way the box is turned. */
function zbox(p, [cx, cy], dir, text, labelAt) {
  const px = p.x(cx), py = p.y(cy);
  const deg = (dir * 180) / Math.PI;
  p.add("curve", svg("g", { transform: `translate(${px} ${py}) rotate(${-deg})` },
    svg("rect", {
      x: -21, y: -8.5, width: 42, height: 17, rx: 2,
      fill: V("plate"), stroke: V("ink"), strokeWidth: 1.7,
    })
  ));
  // upright regardless of the box's rotation — a value read at an angle is a
  // value read wrong
  const d = 34;   // clears both the box and the text's own half-width
  p.add("label", svg("text", {
    class: "lbl",
    x: px + Math.cos(labelAt) * d,
    y: py - Math.sin(labelAt) * d + 4,
    textAnchor: "middle",
    fill: V("ink"), fontSize: 10.5, fontWeight: 600, text,
  }));
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("threePhasePower", { no: 39, build: () => {
  const f = threePhasePower();
  return plate({
    no: 39, title: "Why three phases", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "<b>Set the angle anywhere you like — the thick line stays flat.</b> A " +
      "single-phase supply delivers power in pulses at twice the line frequency, " +
      "dropping to zero (and, off unity, below it) twice per cycle. Three phases " +
      "120° apart have second-harmonic terms that sum to nothing, so the total is " +
      "constant. That is why three-phase motors produce steady torque and no " +
      "vibration at 120 Hz, and it is the actual reason the grid is built this way " +
      "— not efficiency, and not cost of copper.",
  });
} });

register("lineVsPhase", { no: 40, build: () => {
  const f = lineVsPhase();
  return plate({
    no: 40, title: "Where the √3 comes from", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "A line voltage is not a phase voltage — it is the <b>difference</b> of two " +
      "of them, because a voltmeter across two lines sees one phase minus the " +
      "other. Subtract two equal phasors 120° apart and the parallelogram closes " +
      "at √3 times their length, 30° ahead. <b>Every √3 in three-phase work traces " +
      "back to this one picture</b>, so it is worth being able to redraw it from " +
      "memory rather than remembering which formula has the radical in it.",
  });
} });

register("wyeDelta", { no: 41, build: () => {
  const f = wyeDelta();
  return plate({
    no: 41, title: "Wye and delta, same impedances", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The √3 never disappears; it only changes which quantity it is attached to. " +
      "<b>Wye shares a neutral, so the line current is the phase current and the " +
      "voltage gets the √3. Delta closes a loop, so the line voltage is the phase " +
      "voltage and the current gets it.</b> The consequence is the readout worth " +
      "remembering: identical impedances on an identical supply draw three times " +
      "the power in delta — which is exactly why large motors start in wye and " +
      "switch to delta once they are up to speed.",
  });
} });
