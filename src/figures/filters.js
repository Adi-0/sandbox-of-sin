/* ==========================================================================
   figures/filters.js — Plates 106 and 107.

   Linear Systems Part 5 already owns decibels and the straight-line Bode
   sketch, and Part 6 owns resonance and Q. This part does not re-teach any of
   them. What NCEES 8.B needs and nothing before it has supplied is the
   *classification* — four shapes, what each is for, and what each is made of —
   together with the one fact that surprises people when they first build a
   filter rather than analyse one.

   Plate 106 puts the circuit above its own response so the two are learned as
   one object. Plate 107 is the surprise: two RC sections wired together are
   not one RC section squared, because the second one loads the first, and the
   corner ends up 1.72 times lower than the naive answer. That is the argument
   for the op-amp in an active filter, made as a measurement.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { Schematic } from "../lib/circuit.js";
import { num, fixed, sig } from "../lib/fmt.js";
import { dB } from "../lib/dsp.js";

const Q = 2;                       // for the two resonant shapes

/** Retitle a readout in place — some keys only make sense per scenario. */
const setKey = (rd, text) => { rd.root.querySelector(".k").textContent = text; };

/* -------------------------------------------------------------------------
   the four shapes — magnitude as a function of u = f / f_cutoff
   ------------------------------------------------------------------------- */

const det = (u) => Q * (u - 1 / u);        // the detuning term, twice reused

const TYPES = {
  low: {
    label: "low-pass", mag: (u) => 1 / Math.hypot(1, u),
    passes: "everything below the cutoff",
    order: 1,
    story:
      "One resistor and one capacitor. At low frequency the capacitor is effectively open, so nothing is diverted and the output follows the input; at high frequency it is a short to ground and the output collapses. <b>This is the anti-alias filter of Part 2</b>, and the only one of the four that sampling actually requires.",
  },
  high: {
    label: "high-pass", mag: (u) => Math.abs(u) / Math.hypot(1, u),
    passes: "everything above the cutoff",
    order: 1,
    story:
      "The same two parts with their jobs exchanged. The capacitor is now in the signal path, so it blocks DC entirely and passes the fast changes. <b>Every AC-coupled amplifier input is one of these</b>, which is why an oscilloscope's AC setting loses the DC level.",
  },
  band: {
    label: "band-pass", mag: (u) => 1 / Math.hypot(1, det(u)),
    passes: "a band around the centre frequency",
    order: 2,
    story:
      "Series L and C are a short circuit at resonance and a large reactance either side of it, so only frequencies near f₀ reach the resistor. <b>This is Linear Systems Part 6's resonant circuit</b> read as a filter — Q sets how narrow it is, and BW = f₀/Q.",
  },
  notch: {
    label: "band-stop", mag: (u) => Math.abs(det(u)) / Math.hypot(1, det(u)),
    passes: "everything except a band around the centre",
    order: 2,
    story:
      "The same L and C, now shunting the output instead of feeding it. At resonance the series pair is a short to ground and the output vanishes; everywhere else they get out of the way. <b>The standard use is killing one interfering frequency</b> — 50 or 60 Hz mains hum, most often — while leaving the rest of the signal alone.",
  },
};

/* ==========================================================================
   Plate 106 — four shapes, four circuits
   ========================================================================== */

const XR = [-2, 2];                 // decades either side of the cutoff

function filterShapes() {
  const sch = new Schematic({
    w: 12, h: 3, unit: 44, pad: 46,
    label: "The RC or RLC network that produces the selected filter response.",
  });
  const p = new Plot({
    w: 620, h: 236, xr: XR, yr: [-42, 6],
    pad: { l: 48, r: 18, t: 14, b: 32 },
    label: "Magnitude response in decibels against frequency relative to the cutoff, on a logarithmic axis.",
  });

  const rdType = readout({ key: "type", value: "", tone: "x" });
  const rdFc = readout({ key: "cutoff", value: "", tone: "y" });
  const rdAt = readout({ key: "gain at cutoff", value: "", tone: "r" });
  const rdSlope = readout({ key: "roll-off", value: "", tone: "" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "low";

  function drawSchematic(fcHz) {
    for (const g of Object.values(sch.layers)) while (g.firstChild) g.removeChild(g.firstChild);
    const TOP = 0.5, BOT = 2.5, OUT = 10.5;

    sch.wire([[1, TOP], [1, BOT]]);
    sch.source([1, 1.5], "v", { kind: "ac", label: "Vin", at: "w", color: "q-x" });
    sch.wire([[1, BOT], [OUT, BOT]]);
    sch.ground([1, BOT]);

    if (cur === "band") {
      sch.wire([[1, TOP], [2.6, TOP]]);
      sch.inductor([3.4, TOP], "h", { label: "L", at: "n" });
      sch.wire([[4.2, TOP], [5.2, TOP]]);
      sch.capacitor([6, TOP], "h", { label: "C", at: "n" });
      sch.wire([[6.8, TOP], [OUT, TOP]]);
      sch.resistor([8.5, 1.5], "v", { label: "R", at: "e", color: "q-r" });
      sch.wire([[8.5, TOP], [8.5, 1]]);
      sch.wire([[8.5, 2], [8.5, BOT]]);
    } else if (cur === "notch") {
      sch.wire([[1, TOP], [2.9, TOP]]);
      sch.resistor([3.7, TOP], "h", { label: "R", at: "n" });
      sch.wire([[4.5, TOP], [OUT, TOP]]);
      sch.inductor([8.5, 1.1], "v", { label: "L", at: "e", color: "q-r" });
      sch.capacitor([8.5, 2.1], "v", { label: "C", at: "e", color: "q-r" });
      sch.wire([[8.5, TOP], [8.5, 0.7]]);
      sch.wire([[8.5, 1.5], [8.5, 1.7]]);
      sch.wire([[8.5, 2.5], [8.5, BOT]]);
    } else {
      const first = cur === "low" ? "resistor" : "capacitor";
      const second = cur === "low" ? "capacitor" : "resistor";
      const n1 = cur === "low" ? "R" : "C";
      const n2 = cur === "low" ? "C" : "R";
      sch.wire([[1, TOP], [2.9, TOP]]);
      sch[first]([3.7, TOP], "h", { label: n1, at: "n" });
      sch.wire([[4.5, TOP], [OUT, TOP]]);
      sch[second]([8.5, 1.5], "v", { label: n2, at: "e", color: "q-r" });
      sch.wire([[8.5, TOP], [8.5, 1]]);
      sch.wire([[8.5, 2], [8.5, BOT]]);
    }

    sch.node([8.5, TOP]);
    sch.node([8.5, BOT]);
    sch.terminal([OUT, TOP], { label: "Vout", at: "e", color: "q-y" });
    sch.terminal([OUT, BOT], { color: "q-y" });
    sch.label([5.7, BOT], `${TYPES[cur].order === 1 ? "first" : "second"} order · f${TYPES[cur].order === 1 ? "c" : "₀"} = ${sig(fcHz, 3)} Hz`,
      { at: "s", color: "muted", size: 11.5 });
  }

  function draw(v) {
    const fc = Math.pow(10, v / 100);          // 10 Hz .. 100 kHz
    const T = TYPES[cur];
    drawSchematic(fc);
    p.clear("curve", "label", "mark", "shade");

    p.grid({ xStep: 0.25, yStep: 6 });
    p.axes({ xLabel: "f / fc  (decades)", yLabel: "|H| (dB)", xStep: 1, yStep: 12, origin: false });

    /* the −3 dB line and the cutoff, which is where the two meet */
    p.line(XR[0], -3.01, XR[1], -3.01, { color: "muted", width: 1.2, dash: "5 4" });
    p.text(XR[0] + 0.05, -3.01, "−3 dB", { color: "muted", size: 10, anchor: "start", dy: -5 });

    /* A band-stop is exactly zero at f₀, so its dB value is −∞ and the raw
       number would be the clamp inside dB() rather than a measurement. The
       marker is pinned to the floor of the axis instead — nothing clips an
       SVG line, so a marker drawn at −240 would run off the plate and down
       the page. */
    const gain = T.mag(1);
    const floor = p.yr[0];
    const gDb = gain < 1e-6 ? floor : Math.max(floor, dB(gain));
    p.line(0, floor, 0, gDb, { color: "q-y", width: 1.3, dash: "3 3" });

    p.curve((x) => dB(T.mag(Math.pow(10, x))), { color: "q-x", width: 2.8, samples: 600 });
    p.dot(0, gDb, { color: "q-r", r: 5 });

    /* the two band edges, for the resonant pair */
    if (T.order === 2) {
      const half = Math.sqrt(1 / (4 * Q * Q) + 1);
      for (const s of [1, -1]) {
        const u = half + s / (2 * Q);
        p.dot(Math.log10(u), -3.01, { color: "q-r", r: 3.6, ring: false });
      }
    }

    /* The keys change with the type, because u = 1 is the cutoff for a
       first-order section but the *centre* for the resonant pair, and
       "roll-off" is not a thing a band-stop does at all — far from f₀ it
       returns to unity. A fixed key here would mislabel half the states. */
    const centre = T.order === 2;
    setKey(rdFc, centre ? "centre frequency" : "cutoff");
    setKey(rdAt, centre ? "gain at centre" : "gain at cutoff");
    setKey(rdSlope, centre ? "far from centre" : "roll-off");

    rdType.set(T.label);
    rdFc.set(sig(fc, 3), " Hz");
    rdAt.set(gain < 1e-6 ? "−∞" : fixed(dB(gain), 2), gain < 1e-6 ? "" : " dB");
    rdSlope.set(
      cur === "notch" ? "0" : cur === "band" ? "20" : "20",
      cur === "notch" ? " dB — it returns" : cur === "band" ? " dB/dec each side" : " dB/decade"
    );

    rdNote.set(
      `${T.story} <b>It passes ${T.passes}.</b> ${
        cur === "band" || cur === "notch"
          ? `With Q = ${num(Q, 0)} the half-power edges sit at ${fixed(Math.sqrt(1 / (4 * Q * Q) + 1) - 1 / (2 * Q), 3)} and ${fixed(Math.sqrt(1 / (4 * Q * Q) + 1) + 1 / (2 * Q), 3)} times f₀ — a bandwidth of f₀/Q, exactly as Linear Systems Part 6 had it. <b>Note the two edges are not symmetric about f₀ on a linear axis but are on a logarithmic one</b>, because f₀ is their <em>geometric</em> mean.`
          : `Every first-order section behaves the same way far from the corner: <b>20 dB per decade</b>, a factor of ten in amplitude for a factor of ten in frequency. Getting a steeper skirt than that is the whole subject of Part 4.`
      }`
    );
  }

  const k = knob({
    label: "cutoff frequency", min: 100, max: 500, step: 1, value: 300,
    format: (v) => `${sig(Math.pow(10, v / 100), 3)} Hz`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "filter",
    options: Object.keys(TYPES).map((id) => ({ id, label: TYPES[id].label })),
    value: "low",
    onChange: (id) => { cur = id; draw(k.value()); },
  });
  draw(300);

  return {
    stage: el("div.stack", null, sch.root, p.root),
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdType, rdFc, rdAt, rdSlope, rdNote),
  };
}

/* ==========================================================================
   Plate 107 — cascading is not multiplying

   The n-section ladder is computed with chain matrices rather than a stored
   polynomial. Two reasons: the closed forms are easy to misremember (the
   three-section denominator is 1 + 6a + 5a² + a³, and the transposed
   1 + 5a + 6a² + a³ happens to agree with it at u = 1, so a spot check at the
   corner will not catch the error), and this way n is free.
   ========================================================================== */

const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];

/** |H| for n identical series-R / shunt-C sections, open-circuit output. */
function ladder(n, u) {
  const a = [0, u];                       // jωRC, with RC normalised to 1
  const S = [cadd([1, 0], a), [1, 0], a, [1, 0]];   // [A, B, C, D] of one section
  let M = [[1, 0], [0, 0], [0, 0], [1, 0]];
  for (let i = 0; i < n; i++) {
    const [A, Bm, C, D] = M, [a2, b2, c2, d2] = S;
    M = [
      cadd(cmul(A, a2), cmul(Bm, c2)), cadd(cmul(A, b2), cmul(Bm, d2)),
      cadd(cmul(C, a2), cmul(D, c2)), cadd(cmul(C, b2), cmul(D, d2)),
    ];
  }
  return 1 / Math.hypot(M[0][0], M[0][1]);
}

/** |H| for n sections separated by ideal buffers — the naive expectation. */
const buffered = (n, u) => Math.pow(1 / Math.hypot(1, u), n);

/** Where a monotone falling response crosses 1/√2. */
function corner(f) {
  let lo = 1e-4, hi = 20;
  for (let i = 0; i < 90; i++) {
    const m = (lo + hi) / 2;
    if (f(m) > Math.SQRT1_2) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

const CASCADE = {
  one: { n: 1, buf: true, label: "one section" },
  two: { n: 2, buf: true, label: "two, buffered" },
  twoD: { n: 2, buf: false, label: "two, direct" },
  threeD: { n: 3, buf: false, label: "three, direct" },
};

const CR = [-1.6, 1.6];

function cascading() {
  const p = new Plot({
    w: 620, h: 258, xr: CR, yr: [-60, 6],
    pad: { l: 48, r: 18, t: 14, b: 32 },
    label: "Magnitude responses of one RC section, of buffered sections, and of sections wired directly together.",
  });

  const rdWhat = readout({ key: "arrangement", value: "", tone: "x" });
  const rdCut = readout({ key: "actual −3 dB", value: "", tone: "r" });
  const rdNaive = readout({ key: "if it multiplied", value: "", tone: "y" });
  const rdSlope = readout({ key: "far roll-off", value: "", tone: "" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "one";

  function draw() {
    const C = CASCADE[cur];
    const mag = (u) => (C.buf ? buffered(C.n, u) : ladder(C.n, u));
    p.clear("curve", "label", "mark", "shade");

    p.grid({ xStep: 0.2, yStep: 6 });
    p.axes({ xLabel: "f / fc of one section  (decades)", yLabel: "|H| (dB)", xStep: 1, yStep: 12, origin: false });
    p.line(CR[0], -3.01, CR[1], -3.01, { color: "muted", width: 1.2, dash: "5 4" });
    p.text(CR[0] + 0.04, -3.01, "−3 dB", { color: "muted", size: 10, anchor: "start", dy: -5 });

    /* every arrangement, faint, so the selected one is read as a comparison */
    for (const id of Object.keys(CASCADE)) {
      if (id === cur) continue;
      const c = CASCADE[id];
      p.curve((x) => dB(c.buf ? buffered(c.n, 10 ** x) : ladder(c.n, 10 ** x)),
        { color: "muted", width: 1.2, dash: "4 3", samples: 400, opacity: 0.7 });
    }
    p.curve((x) => dB(mag(10 ** x)), { color: "q-x", width: 2.8, samples: 600 });

    const uc = corner(mag);
    const un = corner((u) => buffered(C.n, u));
    p.dot(Math.log10(uc), -3.01, { color: "q-r", r: 5 });
    p.line(Math.log10(uc), -60, Math.log10(uc), -3.01, { color: "q-r", width: 1.1, dash: "3 3" });
    if (!C.buf) {
      p.dot(Math.log10(un), -3.01, { color: "q-y", r: 4 });
      p.text(Math.log10(un), -3.01, "expected", {
        color: "q-y", size: 10, anchor: "start", dx: 6, dy: -7, bg: true,
      });
    }

    rdWhat.set(C.label);
    rdCut.set(fixed(uc, 3), " fc");
    rdNaive.set(fixed(un, 3), " fc");
    rdSlope.set(`${num(20 * C.n, 0)}`, " dB/decade");

    rdNote.set(
      cur === "one"
        ? `<b>The reference case.</b> One resistor, one capacitor, corner exactly at fc = 1/2πRC, and 20 dB per decade beyond it. Everything on this plate is measured against it. <b>Now ask the obvious question: to get 40 dB per decade, can you just use two?</b>`
        : C.buf
          ? `<b>Two sections with a buffer between them, so the second cannot load the first.</b> Now the responses really do multiply, and the result is 1/(1+ju)² — 40 dB per decade at last. But note the corner has <em>moved</em>: it is at ${fixed(uc, 3)} fc, not 1 fc, because at the old corner each section contributes −3 dB and the pair therefore gives −6 dB. <b>Cascading always pulls the overall cutoff inward</b>, and this is the honest version of that effect.`
          : `<b>Wired straight together, and the responses do not multiply.</b> The second section draws current through the first, so the first no longer sees an open circuit — it is <em>loaded</em>. The corner lands at ${fixed(uc, 3)} fc instead of the expected ${fixed(un, 3)} fc, a factor of ${fixed(un / uc, 2)} too low, and the passband droops earlier than any calculation that multiplied the two responses would predict. <b>The fix is a buffer between the sections</b> — an op-amp follower, or the op-amp of an active filter doing the job for free. ${
            C.n === 2
              ? `The exact transfer function here is 1/(1 + 3ju − u²), and it is the <b>3</b> that carries the loading: without it the middle term would be 2 and the two curves would coincide.`
              : `With three sections the gap widens again: ${fixed(un, 3)} fc expected against ${fixed(uc, 3)} fc actual. <b>The error compounds</b>, which is why passive ladders are designed as a whole rather than section by section.`
          }`
    );
  }

  const sc = scenarios({
    label: "arrangement",
    options: Object.keys(CASCADE).map((id) => ({ id, label: CASCADE[id].label })),
    value: "one",
    onChange: (id) => { cur = id; draw(); },
  });
  draw();

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root),
    readouts: readouts(rdWhat, rdCut, rdNaive, rdSlope, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("filterShapes", { no: 106, build: () => {
  const f = filterShapes();
  return plate({
    no: 106, title: "Four shapes, four circuits", tag: "interactive",
    label: "Each of the four filter types, with the network that realises it above its magnitude response.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "There are only four things a filter can do, and each is one sentence " +
      "about where the reactances go. <b>A capacitor's reactance falls with " +
      "frequency and an inductor's rises</b> — that single fact, plus whether " +
      "the component is in the signal path or shunting it to ground, " +
      "determines all four shapes. The cutoff is read at <b>−3 dB</b>, which " +
      "Linear Systems Part 5 established as the half-power point; here it is " +
      "simply the convention that fixes where one region ends and the next " +
      "begins.",
  });
} });

register("cascading", { no: 107, build: () => {
  const f = cascading();
  return plate({
    no: 107, title: "Cascading is not multiplying", tag: "interactive",
    label: "One RC section compared with two and three sections, buffered and wired directly together.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The natural way to get a steeper filter is to use more sections, and " +
      "the natural assumption is that two sections give the square of one. " +
      "<b>They do not, unless something stops the second from loading the " +
      "first.</b> Wired directly, two identical RC sections give " +
      "1/(1 + 3ju − u²) rather than 1/(1 + ju)², and the corner ends up " +
      "<b>1.72 times lower</b> than predicted. This is the practical argument " +
      "for active filters: the op-amp is not there to provide gain, it is " +
      "there to stop one stage from being a load on the one before it.",
  });
} });
