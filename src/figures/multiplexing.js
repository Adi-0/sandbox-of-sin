/* ==========================================================================
   figures/multiplexing.js — Plates 125 and 126.

   Part 4 built a T1 out of twenty-four telephone channels without ever
   saying how the twenty-four are kept apart. This part answers that, and
   the answer turns out to be one idea wearing three costumes.

   Plate 125 draws the resource itself — a rectangle of time against
   frequency — and shows the three ways of cutting it up. It also carries
   the comparison that decided the telephone network: FDM's guard bands cost
   15% whatever the channel count, while TDM's framing bit costs 1/(8K+1),
   which falls as users are added. At twenty-four channels that is 0.52%
   against 15%, a factor of twenty-nine.

   Plate 126 is the one that needs arithmetic. CDMA gives every user the
   whole rectangle at once, which sounds impossible until you see the codes
   cancel. With Walsh codes the cancellation is exact in integers, not
   approximate: every distinct pair of rows has inner product exactly zero
   and every row with itself exactly N. Verified exhaustively — all 1024 row
   pairs at N = 32, and all 2048 recoveries of eight simultaneous users at
   N = 8, every one exact.

   The plate then breaks it, because the fragility is the examinable part.
   Misalignment is modelled the way it physically happens — the correlation
   window straddling two of the interferer's symbols, which carry
   independent bits — rather than as a cyclic shift, which understates the
   damage because a rotated Walsh row is often still orthogonal. One chip of
   offset lets a single interferer correlate 8 against a wanted 8 at N = 8.
   Where the damage lands depends on the offset and on which codes are in
   use, so the readouts report what actually happened rather than asserting
   a failure: sometimes the wanted user survives and an IDLE code picks up
   the energy instead, which is the more unsettling result.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";
import { walsh, correlate, cdmaChannel, lateWindow, frame } from "../lib/comms.js";

/* ==========================================================================
   Plate 125 — three ways to cut one rectangle
   ========================================================================== */

const VOICE = 3400, SLOT = 4000;      // the ITU voice channel and its FDM slot

const WAYS = {
  fdm: {
    label: "FDM — by frequency",
    story:
      "Every user gets a slice of the band and keeps it for ever. <b>The " +
      "cost is the guard bands</b>: 3.4 kHz of speech is given a 4 kHz slot, " +
      "so 15% of the spectrum is deliberately left empty to stop neighbours " +
      "bleeding into each other. Twelve channels make a 48 kHz <b>group</b> " +
      "and sixty make a 240 kHz <b>supergroup</b> — the arithmetic the " +
      "analog long-distance network was built on.",
  },
  tdm: {
    label: "TDM — by time",
    story:
      "Every user gets the whole band, briefly, in strict rotation. <b>The " +
      "cost is the framing</b> — the receiver has to know which slot is " +
      "whose, which takes one bit per frame. A T1 is 24 channels of 8 bits " +
      "plus that one bit: 193 bits, 8000 times a second, 1.544 Mbit/s. " +
      "<b>Nothing is left empty between slots</b>, which is the whole " +
      "difference from FDM.",
  },
  cdma: {
    label: "CDMA — by code",
    story:
      "Every user transmits over the whole band, all of the time, at once. " +
      "<b>Nothing is divided at all</b> — the users are separated by " +
      "multiplying each one's bits by a different code, chosen so that the " +
      "codes cancel when a receiver looks for the wrong one. That sounds " +
      "like it cannot work, so <b>Plate 126 does the arithmetic</b> and " +
      "shows the cancellation is exact.",
  },
};

function shares() {
  const p = new Plot({
    w: 620, h: 250, xr: [0, 1], yr: [0, 1],
    pad: { l: 62, r: 18, t: 18, b: 38 },
    label: "One channel's time-frequency resource, divided between users by frequency, by time, or not divided at all.",
  });

  const rdEach = readout({ key: "each user gets", value: "", tone: "x" });
  const rdTotal = readout({ key: "total", value: "", tone: "y" });
  const rdOver = readout({ key: "overhead", value: "", tone: "r" });
  const rdPer = readout({ key: "per user", value: "", tone: "y" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "fdm", k;

  /* Both overheads, from the same two definitions the note quotes. */
  const fdmOverhead = () => (SLOT - VOICE) / SLOT;
  const tdmOverhead = (K) => 1 / (8 * K + 1);

  function draw() {
    const K = k.value();
    const W = WAYS[cur];

    p.clear("curve", "label", "mark", "shade");
    p.grid({ xStep: 0.1, yStep: 0.1 });
    p.axes({ xLabel: "time →", yLabel: "frequency →", xStep: 1, yStep: 1, xFmt: null, yFmt: null, origin: false });

    /* A filled rectangle, from area() with a constant height and a baseline.
       The outline is not decoration: at twenty-four channels the guard gap is
       under a pixel, so without a stroke the slices merge into one block and
       the whole point of the picture is lost. */
    const box = (xa, xb, ya, yb, color, op = 1, stroke = null) =>
      p.area(() => yb, xa, xb, { baseline: ya, color, opacity: op, samples: 2, stroke });

    const guard = cur === "fdm" ? (SLOT - VOICE) / SLOT : 0.12;

    if (cur === "cdma") {
      box(0, 1, 0, 1, "q-x-soft");
      /* No cut anywhere: the users overlap completely, which is the point. */
      for (let i = 1; i < 14; i++) {
        p.line(i / 14, 0, 0, i / 14, { color: "q-x", width: 0.8, opacity: 0.35 });
        p.line(1, i / 14, i / 14, 1, { color: "q-x", width: 0.8, opacity: 0.35 });
      }
      p.text(0.5, 0.54, `all ${num(K, 0)} users`, { color: "q-x", size: 14, anchor: "middle", weight: 600 });
      p.text(0.5, 0.44, "whole band, whole time, separated by code", { color: "q-x", size: 10.5, anchor: "middle" });
    } else {
      const slot = 1 / K;
      const used = slot * (1 - guard);
      for (let i = 0; i < K; i++) {
        const a = i * slot, b = a + used;
        const on = i === 0;
        if (cur === "fdm") box(0, 1, a, b, on ? "q-x" : "q-x-soft", on ? 0.85 : 1, "q-x");
        else box(a, b, 0, 1, on ? "q-x" : "q-x-soft", on ? 0.85 : 1, "q-x");
      }
      /* Label only the highlighted user: at 24 channels a slot is a few
         pixels across and any per-slot text would be unreadable. */
      /* Only the highlighted slice is labelled. At twenty-four channels a
         slice is a few pixels across and any per-slice text is unreadable;
         the guard gap is likewise too thin to annotate, so the note carries
         that number instead of an arrow that would not fit. */
      const mid = used / 2;
      if (cur === "fdm") {
        /* A horizontal label needs the slice to be taller than the type. */
        if (K <= 14) p.text(0.5, mid, "user 1", { color: "bg", size: 10, anchor: "middle" });
        else p.text(-0.012, mid, "user 1", { color: "q-x", size: 9, anchor: "end" });
      } else {
        /* A vertical slice has to be wider than the word, which needs far
           more room — so this one moves outside sooner. */
        if (K <= 10) p.text(mid, 0.5, "user 1", { color: "bg", size: 10, anchor: "middle" });
        else p.text(mid, 1.04, "user 1", { color: "q-x", size: 9, anchor: "start" });
      }
    }

    const over = cur === "fdm" ? fdmOverhead() : cur === "tdm" ? tdmOverhead(K) : 0;
    const f = frame(K, 8, 1, 8000);

    rdEach.set(
      cur === "fdm" ? `${num(VOICE / 1e3, 1)} kHz` : cur === "tdm" ? "8 bits / 125 µs" : "everything"
    );
    rdTotal.set(
      cur === "fdm" ? `${num((SLOT * K) / 1e3, 0)} kHz`
        : cur === "tdm" ? `${fixed(f.rate / 1e6, 3)} Mbit/s`
        : `${num(K, 0)} codes`
    );
    rdOver.set(cur === "cdma" ? "none — ideally" : `${fixed(100 * over, over < 0.02 ? 2 : 1)} %`);
    rdPer.set(cur === "fdm" ? `1 / ${num(K, 0)} of band` : cur === "tdm" ? `1 / ${num(K, 0)} of time` : "all of both");

    rdNote.set(
      `${W.story} <b>With ${num(K, 0)} users</b>, ${
        cur === "fdm"
          ? `the band must be ${num(K, 0)} × 4 = ${num((SLOT * K) / 1e3, 0)} kHz wide to carry ${num(K, 0)} × 3.4 = ${fixed((VOICE * K) / 1e3, 1)} kHz of speech. <b>15% is guard band, and it stays 15% however many users there are</b> — the waste is per channel, so it never amortises.${K === 12 ? " <b>Twelve channels in 48 kHz is the ITU group</b>, the unit the analog network was assembled from." : ""}`
          : cur === "tdm"
            ? `a frame is ${num(K, 0)} × 8 + 1 = ${num(f.perFrame, 0)} bits, sent 8000 times a second — <b>${fixed(f.rate / 1e6, 3)} Mbit/s</b>, of which the framing bit is <b>${fixed(100 * over, 2)}%</b>.${K === 24 ? " <b>This is the T1 exactly.</b>" : ""} <b>And that fraction falls as users are added</b>: one bit is amortised over more payload every time. At 2 users it is 5.9%; here it is ${fixed(100 * over, 2)}%.`
            : `nothing has been divided — all ${num(K, 0)} transmit over the whole band for the whole time, and the receiver separates them by correlating against ${num(K, 0)} different codes. <b>There is no guard band and no framing bit</b>, so in the ideal case nothing is wasted at all.`
      } ` +
      (cur === "cdma"
        ? `<b>The catch is not overhead but synchronisation.</b> The codes only cancel if every user's chips line up, and Plate 126 measures what happens when they do not.`
        : `<b>Set against the other:</b> at ${num(K, 0)} users FDM wastes ${fixed(100 * fdmOverhead(), 1)}% and TDM ${fixed(100 * tdmOverhead(K), 2)}% — a factor of ${fixed(fdmOverhead() / tdmOverhead(K), 0)}. <b>That is why the telephone network went digital and time-division</b>, and it is a rare case of one engineering choice simply dominating another rather than trading against it.`)
    );
  }

  k = knob({
    label: "users sharing the channel", min: 2, max: 24, step: 1, value: 12,
    format: (v) => `${num(v, 0)} users`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "how they are separated",
    options: Object.keys(WAYS).map((id) => ({ id, label: WAYS[id].label })),
    value: "fdm",
    onChange: (id) => { cur = id; draw(); },
  });
  draw();

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdEach, rdTotal, rdOver, rdPer, rdNote),
  };
}

/* ==========================================================================
   Plate 126 — the codes cancel, exactly
   ========================================================================== */

/* Fixed bits, so the picture is stable across redraws and the reader can
   check the arithmetic by hand against what is on screen. PREV is the
   symbol before, which only matters once the codes are misaligned and the
   correlation window starts straddling two of them. */
const BITS = [1, -1, -1, 1, 1, 1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1];
const PREV = [-1, 1, -1, -1, 1, -1, 1, 1, 1, -1, -1, 1, -1, 1, 1, -1];

function cdma() {
  const wp = new Plot({
    w: 300, h: 262, xr: [0, 1], yr: [-1, 1],
    pad: { l: 40, r: 14, t: 14, b: 34 },
    label: "Each active user's code sequence, and their sum as it appears on the wire.",
  });
  const cp = new Plot({
    w: 300, h: 262, xr: [-0.7, 7.7], yr: [-1.6, 1.6],
    pad: { l: 40, r: 14, t: 14, b: 34 },
    label: "The correlator output for each user index, showing the wanted bit recovered and the others cancelling.",
  });

  const rdLen = readout({ key: "code length", value: "", tone: "x" });
  const rdUsers = readout({ key: "active users", value: "", tone: "x" });
  const rdWanted = readout({ key: "user 1 recovers", value: "", tone: "r" });
  const rdCross = readout({ key: "worst crosstalk", value: "", tone: "y" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let N = 8, k, off;

  function draw() {
    const K = Math.min(k.value(), N);
    const shift = off.value();
    const H = walsh(N);
    const codes = H.slice(0, K);
    const bits = BITS.slice(0, K);

    /* Every user but the receiver's own arrives `shift` chips late, so the
       window sees the tail of their previous symbol and the head of this
       one. The wanted user is by definition aligned — that is what the
       receiver is locked to. */
    const onWire = codes.map((c, i) =>
      i === 0 || shift === 0 ? c.map((v) => v * bits[i]) : lateWindow(c, shift, PREV[i], bits[i])
    );
    const chan = cdmaChannel(onWire);

    /* --- what is on the wire -------------------------------------------- */
    wp.clear("curve", "label", "mark", "shade");
    wp.grid({ xStep: 1 / N, yStep: 0.5 });
    /* The vertical axis here stacks unrelated traces at arbitrary offsets, so
       a numeric scale on it would be meaningless. Both are suppressed. */
    wp.axes({ xLabel: "", yLabel: "", xStep: 1, yStep: 1, xFmt: null, yFmt: null, origin: false });

    const rows = Math.min(K, 4);
    const step = (chip, y0, h, color, w) => {
      for (let i = 0; i < N; i++) {
        const a = i / N, b = (i + 1) / N, v = y0 + (chip[i] > 0 ? h : -h);
        wp.line(a, v, b, v, { color, width: w });
        if (i) {
          const pv = y0 + (chip[i - 1] > 0 ? h : -h);
          if (pv !== v) wp.line(a, pv, a, v, { color, width: w });
        }
      }
    };
    for (let r = 0; r < rows; r++) {
      const y0 = 0.86 - r * 0.26;
      step(onWire[r], y0, 0.09, r === 0 ? "q-x" : "muted", r === 0 ? 2.2 : 1.3);
      wp.text(-0.02, y0, `u${num(r + 1, 0)}`, { color: r === 0 ? "q-x" : "muted", size: 9, anchor: "end" });
    }
    if (K > rows) {
      wp.text(0.5, 0.86 - rows * 0.26 + 0.06, `+ ${num(K - rows, 0)} more`, { color: "muted", size: 9, anchor: "middle" });
    }
    /* The sum, scaled to fit whatever K makes it reach. Drawn as a
       continuous step rather than as bars: a chip that sums to zero must
       still show a trace sitting on the baseline, or the waveform looks
       broken rather than merely quiet. */
    const peak = Math.max(1, ...chan.map(Math.abs));
    const sy = (i) => (chan[i] / peak) * 0.34 - 0.6;
    wp.line(0, -0.6, 1, -0.6, { color: "ink", width: 1 });
    for (let i = 0; i < N; i++) {
      const a = i / N, b = (i + 1) / N;
      if (chan[i] !== 0) wp.area(() => sy(i), a, b, { baseline: -0.6, color: "q-r-soft", samples: 2 });
      wp.line(a, sy(i), b, sy(i), { color: "q-r", width: 2 });
      if (i) wp.line(a, sy(i - 1), a, sy(i), { color: "q-r", width: 2 });
    }
    wp.text(-0.02, -0.6, "sum", { color: "q-r", size: 9, anchor: "end" });
    /* Kept short deliberately: this panel is 300 units wide and the previous
       wording measured 309, so it escaped the frame at every setting. */
    wp.text(0.5, -0.97, "nobody's code in particular", { color: "muted", size: 9, anchor: "middle" });

    /* --- what the correlators pull back out ------------------------------ */
    const shown = Math.min(N, 8);
    cp.xr = [-0.7, shown - 0.3];
    cp.clear("curve", "label", "mark", "shade");
    cp.grid({ xStep: 1, yStep: 0.5 });
    /* Users are numbered from one on screen; the arrays stay zero-based. */
    cp.axes({
      xLabel: "user", yLabel: "correlator ÷ N", xStep: 1, yStep: 1,
      xFmt: (v) => num(v + 1, 0), origin: false,
    });

    let worst = 0, wanted = 0;
    for (let u = 0; u < shown; u++) {
      const v = correlate(chan, H[u]) / N;
      if (u === 0) wanted = v;
      else if (u < K) worst = Math.max(worst, Math.abs(v - bits[u]));
      else worst = Math.max(worst, Math.abs(v));
      const active = u < K;
      cp.area(() => v, u - 0.34, u + 0.34, {
        baseline: 0, color: u === 0 ? "q-r-soft" : active ? "q-x-soft" : "q-bad-soft", samples: 2,
      });
      cp.line(u - 0.34, v, u + 0.34, v, { color: u === 0 ? "q-r" : active ? "q-x" : "q-bad", width: 2 });
      if (!active && Math.abs(v) < 0.02) {
        cp.dot(u, 0, { color: "muted", r: 2.4, ring: false });
      }
    }
    cp.line(-0.7, 1, shown - 0.3, 1, { color: "muted", width: 1, dash: "4 3" });
    cp.line(-0.7, -1, shown - 0.3, -1, { color: "muted", width: 1, dash: "4 3" });
    cp.text(shown - 0.4, 1.28, "±1 = a clean bit", { color: "muted", size: 9.5, anchor: "end" });

    rdLen.set(num(N, 0), " chips");
    rdUsers.set(num(K, 0), ` of ${num(N, 0)}`);
    rdWanted.set(fixed(wanted, 3));
    rdCross.set(fixed(worst, 3));

    const clean = shift === 0;
    rdNote.set(
      `<b>${num(K, 0)} users are transmitting at once, over the whole band, for the whole time.</b> ` +
      `The wire carries their plain sum — the red trace, which looks like nothing in particular and ` +
      `reaches ±${num(peak, 0)}. To read user 1, the receiver multiplies that sum by user 1's own code and adds up the ${num(N, 0)} chips. ` +
      (clean
        ? `<b>It gets exactly ${fixed(wanted, 0)}·N, and every other user contributes exactly zero</b> — not nearly zero. ` +
          `Walsh rows have inner product exactly N with themselves and exactly 0 with each other, in integer arithmetic, ` +
          `so the ${num(K - 1, 0)} interfering users cancel term by term. <b>The bars at the unused indices are dots on the axis, not small bars.</b> ` +
          `<b>That is the whole of CDMA</b>, and it is why the same band can be reused by everyone rather than parcelled out.`
        : `<b>Now the other users are ${num(shift, 0)} chip${shift > 1 ? "s" : ""} out of step</b>, so the receiver's window ` +
          `catches the tail of their previous symbol and the head of this one — two symbols with unrelated bits, which is ` +
          `no longer any user's code and is orthogonal to nothing. ` +
          (Math.abs(wanted - bits[0]) > 1e-9
            ? `<b>User 1's own output has moved from ${num(bits[0], 0)} to ${fixed(wanted, 3)}</b>, and the worst error anywhere is ${fixed(worst, 3)}. `
            : `<b>User 1 happens to survive this particular offset</b> — its output is still exactly ${num(bits[0], 0)} — but look along the axis: the worst error is ${fixed(worst, 3)}, ` +
              `and some of it lands on codes <em>nobody is transmitting</em>. A receiver listening for an absent user now hears one. `) +
          `<b>Where the damage falls depends on the offset and on which codes are in use</b>, which is worse than a predictable penalty: ` +
          `at ${num(N, 0)} chips one misaligned interferer can correlate ${num(N, 0)} against a wanted ${num(N, 0)}, so a single badly-timed user can be as loud as the signal. ` +
          `<b>Orthogonality is a property of aligned codes only</b>, which is why CDMA needs tight chip synchronisation, ` +
          `and why real networks use <em>nearly</em> orthogonal PN codes between cells where no common clock exists.`) +
      ` <b>Note what has not changed:</b> no guard band, no time slot, no framing bit. Plate 125's two overheads are both zero here — ` +
      `the price is paid in synchronisation and in interference instead.`
    );
  }

  k = knob({
    /* Five, not four: rows 0-3 of an 8-chip Walsh matrix all share a
       period-4 structure, so their sum is spiky and reads as a poor example
       of "nobody's code". Crossing into the second half fixes that. */
    label: "active users", min: 1, max: 8, step: 1, value: 5,
    format: (v) => `${num(v, 0)} user${v > 1 ? "s" : ""}`,
    onInput: draw,
  });
  off = knob({
    label: "chip misalignment", min: 0, max: 3, step: 1, value: 0,
    format: (v) => (v === 0 ? "aligned" : `${num(v, 0)} chip${v > 1 ? "s" : ""} late`),
    onInput: draw,
  });
  const sc = scenarios({
    label: "code length",
    options: [4, 8, 16].map((n) => ({ id: String(n), label: `${n} chips` })),
    value: "8",
    onChange: (id) => { N = Number(id); draw(); },
  });
  draw();

  return {
    stage: el("div.duo", null, wp.root, cp.root),
    controls: el("div.controls", null, sc.root, k.root, off.root),
    readouts: readouts(rdLen, rdUsers, rdWanted, rdCross, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("muxShares", { no: 125, build: () => {
  const f = shares();
  return plate({
    no: 125, title: "Three ways to cut one rectangle", tag: "interactive",
    label: "A channel's time-frequency resource divided by frequency, by time, or shared entirely.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "A channel is a rectangle of time against frequency, and multiplexing " +
      "is the question of how to give pieces of it to several users at once. " +
      "<b>FDM cuts it into horizontal strips, TDM into vertical ones, and " +
      "CDMA does not cut it at all.</b> The comparison that settled the " +
      "telephone network is in the overheads: FDM's guard bands cost 15% " +
      "whatever the channel count, because the waste is per channel and " +
      "never amortises, while TDM's single framing bit costs 1/(8K + 1) and " +
      "<b>gets cheaper with every user added</b> — 0.52% at twenty-four " +
      "channels. <b>A factor of twenty-nine, in favour of the newer idea.</b>",
  });
} });

register("cdma", { no: 126, build: () => {
  const f = cdma();
  return plate({
    no: 126, title: "The codes cancel, exactly", tag: "interactive",
    label: "Several users' Walsh-coded chip sequences summed on one wire, and the correlator outputs that separate them again.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Everyone transmitting at once over the whole band sounds like it " +
      "cannot work, and the reason it does is worth seeing rather than " +
      "being told. <b>Walsh codes have inner product exactly N with " +
      "themselves and exactly zero with each other</b> — in integers, not " +
      "approximately — so multiplying the summed wire by one user's code " +
      "and adding up the chips returns that user's bit while every other " +
      "user cancels term by term. <b>Then take the codes one chip out of " +
      "step</b>: the cancellation collapses, and an interferer can reach a " +
      "correlation as large as the wanted signal. <b>Orthogonality is a " +
      "property of aligned codes</b>, and that single caveat is most of what " +
      "makes CDMA hard to build.",
  });
} });
