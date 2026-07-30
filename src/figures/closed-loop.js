/* ==========================================================================
   figures/closed-loop.js — Plates 91 and 92.

   Plate 91 is the root locus: the closed-loop poles are the roots of
   D(s) + K·N(s), and the whole plate is that sentence animated. Three plants,
   chosen so that turning the gain up does three different things — speeds the
   system up, destabilises it, or cannot destabilise it at all.

   Plate 92 turns the locus into a decision. A specification carves a region
   out of the s-plane; the answer to "what gain?" is the piece of the locus
   inside it, and sometimes there is no such piece.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed, sig } from "../lib/fmt.js";
import { add, scale, roots, dominant, overshoot, zetaFor } from "../lib/poly.js";

/* -------------------------------------------------------------------------
   the plants
   ------------------------------------------------------------------------- */

const PLANTS = {
  motor: {
    label: "K / s(s+6)",
    tex: "\\frac{K}{s(s+6)}",
    num: [1], den: [1, 6, 0],
    poles: [0, -6], zeros: [],
    kMax: 45, kStart: 25,
    story: "Two poles, so the locus meets on the real axis and turns straight up. <b>The real part sticks at −3 for every gain above 9</b> — the settling time is fixed by the plant and no amount of gain will change it. Turning K up buys speed of oscillation and pays for it in overshoot, and that is all it does.",
  },
  three: {
    label: "K / s(s+2)(s+8)",
    tex: "\\frac{K}{s(s+2)(s+8)}",
    num: [1], den: [1, 10, 16, 0],
    poles: [0, -2, -8], zeros: [],
    kMax: 420, kStart: 60,
    story: "Three poles, and now two branches bend <em>right</em>. Past a definite gain they cross into the right half-plane and the system oscillates without being asked to. <b>This is the shape almost every real plant has</b>, and the reason &ldquo;more loop gain&rdquo; is a decision rather than a free win.",
  },
  zero: {
    label: "K(s+4) / s(s+2)",
    tex: "\\frac{K(s+4)}{s(s+2)}",
    num: [1, 4], den: [1, 2, 0],
    poles: [0, -2], zeros: [-4],
    kMax: 13, kStart: 4,
    story: "Add a zero and the branches have somewhere to go. They leave the real axis, swing round a circle centred on the zero, and come back — so this loop is <b>stable at every gain</b>, and at high gain it does not even ring. Putting a zero where you need one is what a compensator does, and Part 6 builds one.",
  },
};

/** Closed-loop characteristic polynomial D + K·N. */
const charPoly = (pl, K) => add(pl.den, scale(pl.num, K));

/**
 * Trace the locus and pick out what is worth labelling. Points are sampled
 * on K² so the low-gain end, where the roots move fastest, is dense.
 */
function analyse(pl, steps = 900) {
  const branches = [];
  const events = [];
  let prev = null, prevC = null, prevMaxRe = null, prevK = 0;

  for (let i = 0; i <= steps; i++) {
    const K = (i / steps) ** 2 * pl.kMax;
    const rs = roots(charPoly(pl, K));
    if (!prev) {
      rs.forEach((r, j) => { branches[j] = [r]; });
    } else {
      const used = new Array(rs.length).fill(false);
      const next = [];
      for (let j = 0; j < prev.length; j++) {
        let best = -1, bd = Infinity;
        for (let k = 0; k < rs.length; k++) {
          if (used[k]) continue;
          const d = Math.hypot(rs[k][0] - prev[j][0], rs[k][1] - prev[j][1]);
          if (d < bd) { bd = d; best = k; }
        }
        used[best] = true;
        next.push(rs[best]);
        branches[j].push(rs[best]);
      }
      prev = next;
    }
    if (!prev) prev = rs;

    const c = rs.filter((r) => r[1] !== 0).length;
    const maxRe = Math.max(...rs.map((r) => r[0]));

    if (prevC !== null && c !== prevC) {
      /* Two roots have just met, or just parted. Their midpoint is the
         breakaway point, to within one step. */
      let a = rs[0], b = rs[1], bd = Infinity;
      for (let j = 0; j < rs.length; j++) {
        for (let k = j + 1; k < rs.length; k++) {
          const d = Math.hypot(rs[j][0] - rs[k][0], rs[j][1] - rs[k][1]);
          if (d < bd) { bd = d; a = rs[j]; b = rs[k]; }
        }
      }
      events.push({
        kind: c > prevC ? "breakaway" : "break-in",
        K: (K + prevK) / 2, x: (a[0] + b[0]) / 2, y: 0,
      });
    }
    if (prevMaxRe !== null && prevMaxRe < 0 && maxRe >= 0) {
      const cross = rs.filter((r) => r[1] > 0).sort((p, q) => q[0] - p[0])[0];
      events.push({ kind: "cross", K, x: 0, y: cross ? cross[1] : 0 });
    }

    prevC = c; prevMaxRe = maxRe; prevK = K;
  }
  return { branches, events };
}

const CACHE = new Map();
const analysed = (id) => {
  if (!CACHE.has(id)) CACHE.set(id, analyse(PLANTS[id]));
  return CACHE.get(id);
};

/* ==========================================================================
   Plate 91 — the root locus
   ========================================================================== */

const XR = [-12, 2.5], YR = [-4.5, 4.5];
const inView = (x, y) => x >= XR[0] && x <= XR[1] && y >= YR[0] && y <= YR[1];

function rootLocus() {
  const p = new Plot({
    w: 620, h: 396, xr: XR, yr: YR,
    pad: { l: 48, r: 20, t: 16, b: 36 },
    label:
      "The s-plane, showing the open-loop poles and the paths the closed-loop " +
      "poles take as the gain is raised from zero.",
  });

  const rdK = readout({ key: "gain K", value: "", tone: "x" });
  const rdPoles = readout({ key: "closed-loop poles", value: "", tone: "r" });
  rdPoles.root.classList.add("wide");
  const rdZeta = readout({ key: "damping ratio", value: "", tone: "y" });
  const rdWn = readout({ key: "natural freq.", value: "", tone: "y" });
  const rdOs = readout({ key: "overshoot", value: "", tone: "r" });
  const rdTs = readout({ key: "settling, 2%", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "motor";

  function draw(v) {
    const pl = PLANTS[cur];
    const K = (v / 1000) * pl.kMax;
    const { branches, events } = analysed(cur);
    p.clear("curve", "label", "mark", "shade");

    /* the unstable half, named rather than left to be inferred */
    p.polygon([[0, YR[0]], [XR[1], YR[0]], [XR[1], YR[1]], [0, YR[1]]],
      { fill: "q-bad-soft", opacity: 0.5 });
    p.text(XR[1] - 0.25, YR[1] - 0.5, "unstable", { anchor: "end", color: "q-bad", size: 10.5, weight: 600 });

    p.grid({ xStep: 1, yStep: 1 });
    p.axes({ xLabel: "σ", yLabel: "jω", xStep: 2, yStep: 2, arrows: true });

    /* the locus itself — heavier than the axis it lies on top of, or the
       real-axis branches disappear into it */
    for (const br of branches) {
      let run = [];
      const flush = () => {
        if (run.length > 1) {
          p.param((t) => run[Math.round(t * (run.length - 1))], [0, 1],
            { color: "q-y", width: 2.6, samples: run.length - 1, opacity: 0.55 });
        }
        run = [];
      };
      for (const [x, y] of br) { if (inView(x, y)) run.push([x, y]); else flush(); }
      flush();
    }

    /* open-loop poles and zeros — where the locus starts and ends */
    for (const x of pl.poles) p.text(x, 0, "✕", { color: "ink-strong", size: 17, weight: 700, dy: 6 });
    for (const x of pl.zeros) p.ring(x, 0, { color: "ink-strong", r: 6, width: 2 });

    /* the named points on the way. Real-axis labels sit below the tick text,
       not level with it. */
    for (const e of events) {
      if (!inView(e.x, e.y)) continue;
      p.ring(e.x, e.y, { color: e.kind === "cross" ? "q-bad" : "ink", r: 4.5, width: 1.6 });
      const lbl = e.kind === "cross"
        ? `crosses at K = ${sig(e.K, 3)}, ω = ${sig(Math.abs(e.y), 3)}`
        : `${e.kind} K = ${sig(e.K, 2)}`;
      p.text(e.x, e.y, lbl, {
        anchor: e.kind === "cross" ? "end" : "middle",
        dx: e.kind === "cross" ? -12 : 0, dy: e.kind === "cross" ? -8 : 32,
        color: e.kind === "cross" ? "q-bad" : "ink", size: 10, weight: 600,
        bg: e.kind === "cross",
      });
    }

    /* where the poles are right now */
    const rs = roots(charPoly(pl, K));
    for (const [x, y] of rs) if (inView(x, y)) p.dot(x, y, { color: "q-r", r: 5.5 });

    const d = dominant(rs);
    const unstable = rs.some((r) => r[0] > 1e-7);
    const marginal = !unstable && rs.some((r) => Math.abs(r[0]) < 1e-7);

    /* The ζ ray, so the angle is a thing you can see rather than a number.
       Clipped to the frame — an unclipped ray at small ζ leaves the plate. */
    if (d && d.complex && !unstable) {
      const s = Math.sqrt(1 - d.zeta * d.zeta);
      const L = Math.min(XR[0] / -d.zeta, YR[1] / (s || 1e-9));
      p.line(0, 0, -L * d.zeta, L * s, { color: "q-r", width: 1.3, dash: "5 4" });
      p.line(0, 0, -L * d.zeta, -L * s, { color: "q-r", width: 1.3, dash: "5 4" });
      p.text(-0.62 * L * d.zeta, 0.62 * L * s, `ζ = ${fixed(d.zeta, 2)}`,
        { color: "q-r", size: 10.5, weight: 600, dx: 8, dy: -6, anchor: "start", bg: true });
    }

    rdK.set(sig(K, 3));
    rdPoles.set(rs.map(([x, y]) =>
      y === 0 ? num(x, 2) : `${num(x, 2)} ${y > 0 ? "+" : "−"} ${num(Math.abs(y), 2)}j`
    ).join(",&nbsp; "));

    if (unstable || marginal) {
      rdZeta.set("—"); rdWn.set("—"); rdOs.set("—"); rdTs.set(unstable ? "never" : "never");
      rdNote.set(unstable
        ? `<b>A pole is in the right half-plane, so this loop does not settle — it grows.</b> The gain is past the crossing at K = ${sig(events.find((e) => e.kind === "cross")?.K ?? 0, 3)}, where the branches passed through the imaginary axis. Everything to the right of that line is a system that oscillates whether you drive it or not, and no amount of tuning downstream will fix it.`
        : `<b>Exactly on the imaginary axis</b> — the roots are purely imaginary, so the response is a sustained oscillation that neither grows nor decays. This is the marginal case, and Part 3 finds this gain without plotting anything.`);
    } else if (!d.complex) {
      const ts = 4 / Math.abs(d.re);
      rdZeta.set("≥ 1"); rdWn.set(sig(d.wn, 3));
      rdOs.set("none"); rdTs.set(`${sig(ts, 3)} s`);
      rdNote.set(`All the poles are real, so the response is <b>overdamped — it crawls up to the answer without overshooting</b>. The slowest pole at ${num(d.re, 2)} sets the pace, and settling takes about 4/${num(Math.abs(d.re), 2)} = ${sig(ts, 3)} s. Raise K until the branches leave the real axis and it gets faster; keep going and it starts to ring. ${pl.story}`);
    } else {
      const os = overshoot(d.zeta), ts = 4 / Math.abs(d.re);
      rdZeta.set(fixed(d.zeta, 3)); rdWn.set(sig(d.wn, 3));
      rdOs.set(`${fixed(os, 1)}%`); rdTs.set(`${sig(ts, 3)} s`);
      const cast = Math.abs(d.re + 3) < 0.06 && Math.abs(d.im - 4) < 0.06;
      rdNote.set(cast
        ? `<b>−3 ± 4j.</b> The same pair Mathematics Part 7 got from y″ + 6y′ + 25y = 0 and Linear Systems Part 2 built out of 120 Ω, 10 mH and 1 µF — arriving here as a <em>choice of gain</em>. ζ = 0.6, ωn = 5, 9.5% overshoot, 53.13°. <b>The 3-4-5 triangle has now turned up in four modules</b>, and each time it was the same two numbers wearing different units.`
        : `Dominant pair at ${num(d.re, 2)} ± ${num(d.im, 2)}j: <b>ζ = ${fixed(d.zeta, 2)} sets the overshoot at ${fixed(os, 1)}%</b> and the real part sets the settling at ${sig(ts, 3)} s. ${pl.story}`);
    }
  }

  const k = knob({
    label: "gain K", min: 0, max: 1000, step: 2,
    value: Math.round((PLANTS.motor.kStart / PLANTS.motor.kMax) * 1000),
    format: (v) => sig((v / 1000) * PLANTS[cur].kMax, 3),
    onInput: draw,
  });
  const sc = scenarios({
    label: "plant",
    options: Object.keys(PLANTS).map((id) => ({ id, label: PLANTS[id].label })),
    value: "motor",
    onChange: (id) => {
      cur = id;
      k.set(Math.round((PLANTS[id].kStart / PLANTS[id].kMax) * 1000));
    },
  });
  draw(k.value());

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdK, rdPoles, rdZeta, rdWn, rdOs, rdTs, rdNote),
  };
}

/* ==========================================================================
   Plate 92 — a specification is a region
   ========================================================================== */

const DR_X = [-9, 1], DR_Y = [-4.5, 4.5];
const SPEC_PLANT = PLANTS.motor;

function designRegion() {
  const p = new Plot({
    w: 520, h: 459, xr: DR_X, yr: DR_Y,
    pad: { l: 44, r: 16, t: 16, b: 36 },
    label:
      "The s-plane with the region of pole positions that meets an overshoot " +
      "and settling-time specification shaded, and the root locus drawn over it.",
  });

  const rdZeta = readout({ key: "damping needed", value: "", tone: "y" });
  const rdAngle = readout({ key: "angle off the axis", value: "", tone: "y" });
  const rdSigma = readout({ key: "real part needed", value: "", tone: "x" });
  const rdK = readout({ key: "gains that work", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let osLimit = 10, tsLimit = 2;

  /** Every K that meets both requirements, as an interval. */
  function validGains() {
    const lo = [], N = 900, kTop = 60;
    for (let i = 1; i <= N; i++) {
      const K = (i / N) * kTop;
      const rs = roots(charPoly(SPEC_PLANT, K));
      if (rs.some((r) => r[0] > -1e-9)) continue;
      const d = dominant(rs);
      const os = d.complex ? overshoot(d.zeta) : 0;
      const ts = 4 / Math.abs(d.re);
      if (os <= osLimit + 1e-9 && ts <= tsLimit + 1e-9) lo.push(K);
    }
    return lo.length ? [lo[0], lo[lo.length - 1]] : null;
  }

  function draw() {
    p.clear("curve", "label", "mark", "shade");
    const zMin = zetaFor(osLimit);
    const sigMin = 4 / tsLimit;
    const tanT = Math.tan(Math.acos(zMin));      // slope of the ζ boundary ray

    /* the allowed region: left of −σ AND inside the ζ wedge */
    const yb = sigMin * tanT;
    const right = (y) => Math.max(DR_X[0], Math.min(-sigMin, -Math.abs(y) / tanT));
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const y = DR_Y[1] - (i / 48) * (DR_Y[1] - DR_Y[0]);
      pts.push([right(y), y]);
    }
    pts.push([DR_X[0], DR_Y[0]], [DR_X[0], DR_Y[1]]);
    p.polygon(pts, { fill: "q-r-soft", stroke: null, opacity: 0.75 });

    p.grid({ xStep: 1, yStep: 1 });
    p.axes({ xLabel: "σ", yLabel: "jω", xStep: 2, yStep: 2, arrows: true });

    /* the two boundaries, each in its own colour so the readouts point at
       something. Settling is the vertical; overshoot is the wedge. */
    p.line(-sigMin, DR_Y[0], -sigMin, DR_Y[1], { color: "q-x", width: 1.5, dash: "5 4" });
    p.text(-sigMin, DR_Y[0] + 0.3, `σ = −${sig(sigMin, 3)}`,
      { color: "q-x", size: 10.5, weight: 600, anchor: "start", dx: 6, bg: true });

    const sinT = Math.sqrt(1 - zMin * zMin);
    const L = Math.min(DR_X[0] / -zMin, DR_Y[1] / sinT);
    p.line(0, 0, -L * zMin, L * sinT, { color: "q-y", width: 1.5, dash: "5 4" });
    p.line(0, 0, -L * zMin, -L * sinT, { color: "q-y", width: 1.5, dash: "5 4" });
    p.text(-L * zMin, L * sinT, `ζ = ${fixed(zMin, 2)}`,
      { color: "q-y", size: 10.5, weight: 600, anchor: "start", dx: 7, dy: 13, bg: true });
    void yb;

    /* the locus of the plant, over the top */
    for (const x of SPEC_PLANT.poles) p.text(x, 0, "✕", { color: "ink-strong", size: 17, weight: 700, dy: 6 });
    p.line(-6, 0, 0, 0, { color: "q-y", width: 2.6, opacity: 0.55 });
    p.line(-3, DR_Y[0], -3, DR_Y[1], { color: "q-y", width: 2.6, opacity: 0.55 });

    /* Paint the gains that work straight onto the locus. Sampling the roots
       rather than drawing the vertical branch means the real-axis part of the
       answer — the low-gain end — shows up too. */
    const range = validGains();
    if (range) {
      const [k0, k1] = range;
      for (let i = 0; i <= 240; i++) {
        const K = k0 + (i / 240) * (k1 - k0);
        for (const [x, y] of roots(charPoly(SPEC_PLANT, K))) {
          p.dot(x, y, { color: "q-r", r: 2.2, ring: false });
        }
      }
      for (const [x, y] of roots(charPoly(SPEC_PLANT, k1))) p.dot(x, y, { color: "q-r", r: 5 });
      const top = roots(charPoly(SPEC_PLANT, k1)).find((r) => r[1] > 0) ?? [-3, 0];
      p.text(top[0], top[1], `K = ${sig(k1, 3)}`,
        { color: "q-r", size: 10.5, weight: 600, anchor: "start", dx: 9, dy: -5, bg: true });
    }

    rdZeta.set(fixed(zMin, 3), ` for ${num(osLimit, 0)}% OS`);
    rdAngle.set(`${fixed(Math.acos(zMin) * 180 / Math.PI, 1)}°`);
    rdSigma.set(sig(sigMin, 3), ` = 4/${num(tsLimit, 1)}`);
    rdK.set(range ? `${sig(range[0], 3)} … ${sig(range[1], 3)}` : "none");

    if (!range && sigMin > 3) {
      rdNote.set(`<b>Nothing works, and the plate is showing you why.</b> Every complex closed-loop pole of this plant sits on the line σ = −3, and the specification demands a pole to the left of −${sig(sigMin, 3)}. The locus never enters the region, so <em>no gain whatsoever</em> meets a ${num(tsLimit, 1)} s settling time here. <b>Gain moves the poles along the locus; it cannot move the locus.</b> Changing that needs a compensator — a pole or zero added on purpose to bend the path — which is what Part 6 is for.`);
    } else if (!range) {
      rdNote.set(`No gain satisfies both. Loosen one of the two and watch which one was binding — the shaded region has to overlap the vertical line at σ = −3, and the overshoot limit decides how far up that line you may go.`);
    } else {
      const [k0, k1] = range;
      const rsHi = roots(charPoly(SPEC_PLANT, k1));
      const dHi = dominant(rsHi);
      rdNote.set(`<b>Any K from ${sig(k0, 3)} to ${sig(k1, 3)} meets both requirements</b>, and the thick part of the locus is that answer drawn. The settling requirement is met by the whole vertical branch — the poles sit at σ = −3 regardless of gain — so it is the <b>overshoot limit that caps K at ${sig(k1, 3)}</b>, where ζ falls to ${fixed(dHi.zeta, 2)}. Take the top of the range: it is the fastest response the specification allows.`);
    }
  }

  const kOs = knob({
    label: "overshoot limit", min: 2, max: 40, step: 1, value: 10,
    format: (v) => `${num(v, 0)}%`,
    onInput: (v) => { osLimit = v; draw(); },
  });
  const kTs = knob({
    label: "settling limit", min: 8, max: 40, step: 1, value: 20,
    format: (v) => `${num(v / 10, 1)} s`,
    onInput: (v) => { tsLimit = v / 10; draw(); },
  });
  draw();

  return {
    stage: p.root,
    controls: el("div.controls", null, kOs.root, kTs.root),
    readouts: readouts(rdZeta, rdAngle, rdSigma, rdK, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("rootLocus", { no: 91, build: () => {
  const f = rootLocus();
  return plate({
    no: 91, title: "Where the poles go", tag: "interactive",
    label: "Root locus of three plants, with the closed-loop poles marked at the current gain.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "<b>The closed-loop poles are the roots of D(s) + K·N(s)</b>, so raising " +
      "the gain drags them along a fixed path — out of the open-loop poles at " +
      "K = 0, towards the open-loop zeros and off to infinity. Set the first " +
      "plant to <b>K = 25</b> and the poles land on −3 ± 4j: the pair from " +
      "Mathematics Part 7, chosen this time with a knob. Then try the " +
      "three-pole plant and find the gain where the locus crosses the axis — " +
      "that number is what Part 3 computes without drawing anything.",
  });
} });

register("designRegion", { no: 92, build: () => {
  const f = designRegion();
  return plate({
    no: 92, title: "A specification is a region", tag: "interactive",
    label: "The s-plane region satisfying an overshoot and settling-time specification, with a root locus drawn across it.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Two requirements, two boundaries. <b>Overshoot is an angle</b> — it fixes " +
      "ζ, and ζ is the cosine of the angle from the negative real axis, so it " +
      "carves out a wedge. <b>Settling time is a vertical line</b>, because it " +
      "depends only on the real part. The design question is then geometric: " +
      "does the locus pass through the shaded region, and over what range of K? " +
      "Tighten the settling limit past 1.33 s and the answer becomes <em>no gain " +
      "at all</em> — which is the honest limit of turning a knob.",
  });
} });
