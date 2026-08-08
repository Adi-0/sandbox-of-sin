/* ==========================================================================
   figures/digital-comms.js — Plates 123 and 124.

   Part 4 ended on an assumption it did not examine: that the repeater's
   decision is correct. This part examines it.

   Plate 123 draws the decision itself. A constellation, a noise cloud drawn
   at the true variance for the stated Es/N0, and the boundaries the receiver
   actually uses — so the fraction of points that land in the wrong region
   agrees with the closed-form error rate printed beside it. Every formula
   here was checked against a 400,000-trial Monte Carlo using this same noise
   scaling and this same nearest-neighbour rule; the picture and the number
   are the same calculation done two ways.

   Plate 124 puts Nyquist and Shannon on one pair of axes. Part 4 made M-ary
   signalling look like a free lunch — more levels, less bandwidth, nothing
   given up. Shannon prices it, and the price has an exact form:

       2 log2 M  =  log2(1 + SNR)   =>   1 + SNR = M²

   so binary needs 3 (4.8 dB), quaternary 15 (11.8 dB), 16-ary 255 (24.1 dB).
   Below that the scheme is not hard, it is impossible.

   The cast: BPSK's two symbols sit at ±1 and its decision boundary is the
   imaginary axis — the same unit circle Signal Processing Part 6 ended on,
   now carrying data instead of poles. 16-QAM's minimum distance is
   2/sqrt(10) = 0.632, and sqrt(10) is the hypotenuse of the 1-3 right
   triangle the compilation's 3-4-5 cast is drawn from.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { makeRng } from "../lib/rng.js";
import { num, fixed, sig } from "../lib/fmt.js";
import {
  constellation, minDistance, serPsk, serQam, bitsPerSymbol,
  shannonEff, nyquistEff, snrForNyquist, shannon, ratioToDb,
} from "../lib/comms.js";

/* ==========================================================================
   Plate 123 — the constellation and the decision
   ========================================================================== */

const SCHEMES = {
  bpsk: {
    label: "BPSK", kind: "psk", M: 2,
    story:
      "One bit a symbol, two symbols a whole diameter apart. <b>Nothing is " +
      "more robust and nothing is less efficient</b> — this is the scheme " +
      "you fall back to when the link is failing, which is why deep-space " +
      "probes use it.",
  },
  qpsk: {
    label: "QPSK", kind: "qam", M: 4,
    story:
      "Two bits a symbol, and <b>the same bit error rate as BPSK at the same " +
      "energy per bit</b> — the dashed BPSK curve is exactly underneath, not " +
      "nearby. QPSK is two independent BPSK links on orthogonal carriers " +
      "sharing one channel, so it buys half the bandwidth for nothing. " +
      "<b>That is why it is everywhere.</b>",
  },
  psk8: {
    label: "8-PSK", kind: "psk", M: 8,
    story:
      "Three bits a symbol, and here the free lunch ends. Squeezing eight " +
      "points onto one circle at constant power drops the spacing to " +
      "<b>2 sin(π/8) = 0.765</b>, and the error rate rises accordingly. " +
      "<b>Constant amplitude is what is being bought</b> — every symbol has " +
      "the same power, which suits a saturating amplifier.",
  },
  qam16: {
    label: "16-QAM", kind: "qam", M: 16,
    story:
      "Four bits a symbol. Letting the amplitude vary as well as the phase " +
      "packs the points more efficiently than a circle can: <b>16-QAM beats " +
      "16-PSK by about 4 dB</b> for the same rate. The cost is an amplifier " +
      "that has to stay linear, because now the amplitude carries information " +
      "again.",
  },
};

const SHOTS = 420;                 // scatter points; enough to see a rate of ~1%
const CLOUD_SEED = 20250913;       // fixed, so the cloud is the same every load

/** Box–Muller, from the seeded stream, so the picture is reproducible. */
function gauss(r) {
  const u = Math.max(r.next(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r.next());
}

function nearest(pts, x, y) {
  let best = 0, bd = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const d = (pts[i].x - x) ** 2 + (pts[i].y - y) ** 2;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

function constellationPlate() {
  /* Isotropic by construction: iw = 620 − 56 − 16 = 548 is not square, so the
     constellation gets its own square panel. 300 − 36 − 16 = 248 across and
     300 − 14 − 38 = 248 down. Do not retune one pad without the other. */
  const cp = new Plot({
    w: 300, h: 300, xr: [-1.75, 1.75], yr: [-1.75, 1.75],
    pad: { l: 36, r: 16, t: 14, b: 38 },
    label: "The signal constellation with received points scattered by noise, and the receiver's decision boundaries.",
  });
  const bp = new Plot({
    w: 300, h: 300, xr: [0, 17], yr: [-10, 0],
    pad: { l: 40, r: 14, t: 14, b: 38 },
    label: "Bit error rate against energy per bit over noise density, for each scheme.",
  });

  const rdBits = readout({ key: "bits / symbol", value: "", tone: "x" });
  const rdDmin = readout({ key: "min distance", value: "", tone: "y" });
  const rdEs = readout({ key: "Es / N₀", value: "", tone: "y" });
  const rdBer = readout({ key: "bit error rate", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "qpsk", k;

  const serOf = (S, ebn0) =>
    S.kind === "qam"
      ? serQam(S.M, ebn0 * bitsPerSymbol(S.M))
      : serPsk(S.M, ebn0 * bitsPerSymbol(S.M));
  /* Gray coding puts one bit's difference between neighbours, so a symbol
     error is almost always exactly one bit wrong. */
  const berOf = (S, ebn0) => serOf(S, ebn0) / bitsPerSymbol(S.M);

  function draw() {
    const S = SCHEMES[cur];
    const ebDb = k.value() / 10;
    const ebn0 = 10 ** (ebDb / 10);
    const bits = bitsPerSymbol(S.M);
    const esn0 = ebn0 * bits;
    const pts = constellation(S.kind, S.M);
    const dmin = minDistance(pts);
    const ber = berOf(S, ebn0);

    /* --- the constellation ---------------------------------------------- */
    cp.clear("curve", "label", "mark", "shade");
    cp.grid({ xStep: 0.25, yStep: 0.25 });
    /* Single-letter axis names: a longer label lands on the rightmost column
       of a 16-QAM grid, and I/Q needs no expanding for this audience. */
    cp.axes({ xLabel: "I", yLabel: "Q", xStep: 1, yStep: 1 });

    /* Decision boundaries: a grid for QAM, radial spokes for PSK. Drawn
       before the points so the points sit on top of them. */
    const R = 1.75;
    if (S.kind === "qam") {
      const r = Math.sqrt(S.M);
      const step = pts[r].x - pts[0].x;           // spacing along one axis
      for (let i = 1; i < r; i++) {
        const c = pts[0].x + (i - 0.5) * step;
        cp.line(c, -R, c, R, { color: "muted", width: 1, dash: "3 3" });
        cp.line(-R, c, R, c, { color: "muted", width: 1, dash: "3 3" });
      }
    } else {
      for (let i = 0; i < S.M; i++) {
        const a = (Math.PI * (2 * i + 1)) / S.M;
        cp.line(0, 0, R * Math.cos(a), R * Math.sin(a), { color: "muted", width: 1, dash: "3 3" });
      }
    }

    /* The cloud, at the true variance: unit average symbol energy means
       N0 = 1/(Es/N0) and sigma² = N0/2 per dimension. */
    const sigma = Math.sqrt(1 / (2 * esn0));
    const r2 = makeRng(CLOUD_SEED);               // reset each draw, so the knob animates
    let wrong = 0;
    for (let i = 0; i < SHOTS; i++) {
      const si = Math.floor(r2.next() * pts.length) % pts.length;
      const x = pts[si].x + sigma * gauss(r2);
      const y = pts[si].y + sigma * gauss(r2);
      const bad = nearest(pts, x, y) !== si;
      if (bad) wrong++;
      /* Clamped so a wild sample marks the edge rather than escaping it. */
      const cx = Math.max(-R, Math.min(R, x)), cy = Math.max(-R, Math.min(R, y));
      cp.dot(cx, cy, { color: bad ? "q-bad" : "q-x", r: bad ? 2.6 : 1.7, ring: false, opacity: bad ? 1 : 0.5 });
    }
    for (const p of pts) cp.dot(p.x, p.y, { color: "q-r", r: 3.4, ring: true });

    /* --- the error curves ------------------------------------------------ */
    bp.clear("curve", "label", "mark", "shade");
    bp.grid({ xStep: 2, yStep: 1 });
    bp.axes({
      xLabel: "Eb / N₀  (dB)", yLabel: "log₁₀ (bit error rate)",
      xStep: 4, yStep: 2, origin: false,
    });
    /* No clamping here. Plot.curve already breaks the path where it leaves
       the frame, so the true value gives a curve that exits the bottom edge;
       clamping instead would draw a flat floor and read as a BER that stops
       falling, which is the opposite of what happens. */
    const curve = (S2) => (x) => Math.log10(berOf(S2, 10 ** (x / 10)));
    for (const id of Object.keys(SCHEMES)) {
      if (id === cur) continue;
      bp.curve(curve(SCHEMES[id]), { color: "muted", width: 1.2, dash: "4 3", samples: 220 });
    }
    bp.curve(curve(S), { color: "q-x", width: 2.8, samples: 300 });
    bp.line(0, -5, 17, -5, { color: "q-y", width: 1.1, dash: "5 4" });
    bp.text(0.4, -5, "10⁻⁵ — the usual target", { color: "q-y", size: 9.5, anchor: "start", dy: -5 });

    const ly = Math.log10(Math.max(ber, 1e-300));
    if (ly >= -10) {
      bp.dot(ebDb, ly, { color: "q-r", r: 4.5 });
      bp.line(ebDb, -10, ebDb, ly, { color: "q-r", width: 1.1, dash: "3 3" });
    } else {
      /* Off the bottom. Marking the floor with a dot would claim a value the
         axis cannot show, so the line runs the full height unterminated. */
      bp.line(ebDb, -10, ebDb, 0, { color: "q-r", width: 1.1, dash: "3 3" });
      bp.text(ebDb, -9.4, "off scale", { color: "q-r", size: 9.5, anchor: "middle" });
    }

    rdBits.set(num(bits, 0));
    rdDmin.set(fixed(dmin, 3));
    rdEs.set(fixed(ratioToDb(esn0), 1), " dB");
    rdBer.set(ber < 1e-10 ? "< 10⁻¹⁰" : sig(ber, 2));

    const measured = wrong / SHOTS;
    rdNote.set(
      `${S.story} <b>At ${fixed(ebDb, 1)} dB of E<sub>b</sub>/N₀ each symbol carries ${num(bits, 0)} bits, ` +
      `so E<sub>s</sub>/N₀ is ${num(bits, 0)}× larger at ${fixed(ratioToDb(esn0), 1)} dB</b> — that conversion is ` +
      `where most of the marks are lost. The nearest neighbours are ${fixed(dmin, 3)} apart at unit average power, ` +
      `and noise has to cross half of that to cause an error, which happens with probability ` +
      `<b>${ber < 1e-10 ? "under 10⁻¹⁰" : sig(ber, 2)}</b> per bit. ` +
      `<b>Of the ${num(SHOTS, 0)} points drawn, ${num(wrong, 0)} landed in the wrong region</b> — ` +
      `${
        wrong === 0
          ? `none, which is what a rate this low looks like: you cannot see a one-in-a-million event in four hundred trials, and that is exactly why error rates are computed rather than counted.`
          : `about ${sig(measured, 2)} per symbol, against the formula's ${sig(serOf(S, ebn0), 2)}. The scatter and the number are the same calculation done two ways.`
      } ` +
      `<b>Every scheme's curve is drawn against E<sub>b</sub>/N₀, not signal-to-noise</b>, which is the only fair comparison: it charges each scheme for the energy it spends per bit delivered, so a scheme carrying more bits per symbol is not flattered by needing fewer symbols.`
    );
  }

  k = knob({
    label: "energy per bit, Eb/N₀", min: 0, max: 160, step: 1, value: 90,
    format: (v) => `${fixed(v / 10, 1)} dB`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "scheme",
    options: Object.keys(SCHEMES).map((id) => ({ id, label: SCHEMES[id].label })),
    value: "qpsk",
    onChange: (id) => { cur = id; draw(); },
  });
  draw();

  return {
    stage: el("div.duo", null, cp.root, bp.root),
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdBits, rdDmin, rdEs, rdBer, rdNote),
  };
}

/* ==========================================================================
   Plate 124 — Nyquist against Shannon
   ========================================================================== */

const ALPHABETS = [
  { M: 2, label: "binary" },
  { M: 4, label: "4-ary" },
  { M: 16, label: "16-ary" },
  { M: 64, label: "64-ary" },
];

const LINE_B = 3400;               // the compilation's telephone channel, in Hz

function bounds() {
  const p = new Plot({
    w: 620, h: 258, xr: [0, 40], yr: [0, 14],
    pad: { l: 54, r: 18, t: 18, b: 36 },
    label: "Spectral efficiency against signal-to-noise ratio: Shannon's bound, and the ideal rates of several symbol alphabets.",
  });

  const rdLimit = readout({ key: "Shannon limit", value: "", tone: "x" });
  const rdRate = readout({ key: "this scheme", value: "", tone: "y" });
  const rdNeeds = readout({ key: "needs", value: "", tone: "y" });
  const rdLine = readout({ key: "on 3.4 kHz", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let curM = 4, k;

  function draw() {
    const snrDb = k.value();
    const snr = 10 ** (snrDb / 10);
    const limit = shannonEff(snrDb);
    const A = ALPHABETS.find((a) => a.M === curM);
    const eff = nyquistEff(curM);
    const needDb = ratioToDb(snrForNyquist(curM));
    const feasible = limit >= eff;
    const cap = shannon(LINE_B, snr);

    p.clear("curve", "label", "mark", "shade");
    p.grid({ xStep: 2, yStep: 1 });
    p.axes({
      xLabel: "signal-to-noise ratio (dB)", yLabel: "bit rate ÷ bandwidth  (bit/s/Hz)",
      xStep: 10, yStep: 2, origin: false,
    });

    /* Everything above the curve is unreachable at any coding, at any
       complexity, for ever. Shading it is the whole point of the plate. */
    p.area((x) => Math.min(14, shannonEff(x)), 0, 40, { color: "q-bad-soft", baseline: 14 });
    p.text(15, 13.3, "impossible — no code reaches here", { color: "q-bad", size: 10, anchor: "start" });

    for (const a of ALPHABETS) {
      const y = nyquistEff(a.M);
      if (y > 13.4) continue;
      const on = a.M === curM;
      p.line(0, y, 40, y, {
        color: on ? "q-x" : "muted", width: on ? 2.4 : 1.1, dash: on ? null : "4 3",
      });
      const xs = ratioToDb(snrForNyquist(a.M));
      p.dot(xs, y, { color: on ? "q-x" : "muted", r: on ? 4 : 2.6, ring: false });
      /* dy clears the crossing dot, which for M = 64 sits at 36.1 dB —
         directly under where this label lands. */
      p.text(39.4, y, `M = ${num(a.M, 0)}`, {
        color: on ? "q-x" : "muted", size: on ? 10 : 9.5, anchor: "end", dy: -8,
      });
    }

    p.curve((x) => Math.min(14, shannonEff(x)), { color: "q-bad", width: 2.6, samples: 260 });
    p.line(snrDb, 0, snrDb, Math.min(14, limit), { color: "q-r", width: 1.1, dash: "3 3" });
    p.dot(snrDb, Math.min(14, limit), { color: "q-r", r: 5 });

    rdLimit.set(fixed(limit, 2), " bit/s/Hz");
    rdRate.set(num(eff, 0), " bit/s/Hz");
    rdNeeds.set(fixed(needDb, 1), " dB");
    rdLine.set(cap >= 1e3 ? fixed(cap / 1e3, 1) : num(cap, 0), cap >= 1e3 ? " kbit/s" : " bit/s");

    rdNote.set(
      `<b>Shannon: C = B log₂(1 + S/N).</b> At ${num(snrDb, 0)} dB that is ${fixed(limit, 2)} bit/s per hertz — ` +
      `<b>${cap >= 1e3 ? `${fixed(cap / 1e3, 1)} kbit/s` : `${num(cap, 0)} bit/s`} on the 3.4 kHz telephone line</b> ` +
      `this compilation has been carrying since Signal Processing Part 2. ` +
      `<b>${A.label.replace(/^./, (c) => c.toUpperCase())} signalling wants ${num(eff, 0)} bit/s/Hz</b>, and ` +
      `${
        feasible
          ? `the channel has ${fixed(limit - eff, 2)} bit/s/Hz to spare — so this scheme is <b>permitted</b> here. Whether a real receiver achieves it is a coding question; Shannon only says it is not forbidden.`
          : `the channel can only carry ${fixed(limit, 2)} — so it is <b>impossible</b>, and not by a small margin of engineering. No modulation, no code, no receiver, no amount of money reaches ${num(eff, 0)} bit/s/Hz at ${num(snrDb, 0)} dB.`
      } ` +
      `<b>It needs ${fixed(needDb, 1)} dB</b>, and the reason is exact: setting Nyquist's 2 log₂M equal to Shannon's ` +
      `log₂(1 + S/N) gives <b>1 + S/N = M²</b>. Binary needs 3, 4-ary 15, 16-ary 255, 64-ary 4095 — ` +
      `<b>every four-fold rise in M costs about 12 dB</b>. ` +
      `<b>This is the bill Part 4 deferred.</b> There, raising M divided the bandwidth by log₂M and appeared to cost nothing; ` +
      `here is what it actually costs, and it is why a dial-up modem stopped at 33.6 kbit/s on a line whose ` +
      `digitised version runs at 64.`
    );
  }

  k = knob({
    label: "signal-to-noise ratio", min: 0, max: 40, step: 1, value: 20,
    format: (v) => `${num(v, 0)} dB`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "alphabet",
    options: ALPHABETS.map((a) => ({ id: String(a.M), label: `M = ${a.M}` })),
    value: "4",
    onChange: (id) => { curM = Number(id); draw(); },
  });
  draw();

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdLimit, rdRate, rdNeeds, rdLine, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("constellation", { no: 123, build: () => {
  const f = constellationPlate();
  return plate({
    no: 123, title: "The decision, and when it fails", tag: "interactive",
    label: "A signal constellation with a noise cloud and decision boundaries, beside bit error rate against energy per bit.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "A digital receiver does one thing: it looks at where the received " +
      "point landed and picks the nearest legal symbol. Everything about a " +
      "link's reliability follows from <b>how far apart the legal symbols " +
      "are compared with how far the noise moves them</b>. Pack more bits " +
      "into a symbol at the same power and the points crowd together — " +
      "16-QAM's neighbours are 0.632 apart where BPSK's are 2 — so the same " +
      "noise starts crossing boundaries. <b>The scatter here is drawn at the " +
      "true variance for the stated E<sub>s</sub>/N₀</b>, so the fraction " +
      "landing in the wrong region is the error rate printed beside it, not " +
      "an illustration of it.",
  });
} });

register("shannonBound", { no: 124, build: () => {
  const f = bounds();
  return plate({
    no: 124, title: "The bill for more levels", tag: "interactive",
    label: "Shannon's spectral efficiency bound against signal-to-noise ratio, with the ideal rates of four symbol alphabets.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Part 4 made M-ary signalling look free: more levels per symbol, fewer " +
      "symbols per second, a narrower channel, nothing given up. <b>Shannon " +
      "is the reason it is not free.</b> Setting Nyquist's ideal rate equal " +
      "to the capacity gives an exact and memorable condition — " +
      "<b>1 + S/N = M²</b> — so every four-fold rise in the alphabet costs " +
      "about 12 dB, and below that SNR the scheme is not difficult but " +
      "<em>impossible</em>. The shaded region is not a region of hard " +
      "engineering; <b>nothing reaches it, ever</b>. It is the only bound in " +
      "this compilation that no cleverness can be traded against.",
  });
} });
