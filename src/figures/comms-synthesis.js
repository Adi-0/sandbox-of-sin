/* ==========================================================================
   figures/comms-synthesis.js — Plate 127.

   Six parts, one conversation. The module has carried the same 3.4 kHz
   telephone channel since Signal Processing Part 2, and has now sent it
   five different ways. This plate puts all five on one pair of axes.

   The left panel is the module's whole argument in one shape: the analog
   schemes are straight lines through the channel's own signal-to-noise
   ratio, so they degrade one decibel per decibel for ever, while the
   digital ones are FLAT and then stop existing. That is not a difference of
   degree. An analog link gets steadily worse; a digital link is perfect and
   then absent.

   The right panel is the trade space — bandwidth against delivered quality
   at whatever channel the knob is set to — and it carries the result that
   settled the argument historically: at a 30 dB channel, 16-ary PCM is
   5.1x narrower than broadcast-quality FM AND 5.9 dB better. Not a trade at
   all, provided the channel clears 24 dB. That proviso is Shannon's, from
   Part 5, and it is the only reason the analog schemes lasted as long as
   they did.

   Every coordinate is computed from the same functions the earlier plates
   used, so no number here is independently maintained:
     - AM's 4.77 dB penalty is 10 log10 of amPower(1).efficiency
     - FM's 12x bandwidth is carson(5B, B)/B, and its +13.98 dB is Part 3's
       beta-squared rule at beta = 5
     - PCM's 49.92 dB is pcmSnrUniform(8), its 9.41x is pcmRate/2/B
     - the binary threshold is the Eb/N0 for a 1e-5 BPSK error rate, plus
       3.01 dB because Rb = 2B makes S/N twice Eb/N0
     - the 16-ary threshold is Shannon's, 1 + S/N = M^2 from Part 5
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";
import {
  amPower, carson, pcmRate, pcmSnrUniform, berBpsk, ratioToDb, snrForNyquist,
} from "../lib/comms.js";

const B = 3400, FS = 8000, NBITS = 8, BETA = 5;

/* Channel SNR at which binary PCM reaches a 1e-5 bit error rate. Solved
   rather than quoted, so it stays true if the target rate ever changes. */
const BIN_THRESHOLD = (() => {
  let lo = 0, hi = 30;
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2;
    if (berBpsk(10 ** (m / 10)) > 1e-5) lo = m; else hi = m;
  }
  /* Binary at the Nyquist rate has Rb = 2B, so S/N = 2 Eb/N0. */
  return (lo + hi) / 2 + ratioToDb(2);
})();

const PCM_BW = pcmRate(FS, NBITS) / 2;               // binary, Rb/2
const PCM_OUT = pcmSnrUniform(NBITS);

const LINKS = {
  ssb: {
    label: "SSB", bw: B, out: (x) => x, floor: null, lab: { dx: 8, dy: 3.5 },
    story:
      "The reference. One sideband, no carrier, <b>the narrowest an analog " +
      "message can be sent</b> — and the output is simply the channel's own " +
      "signal-to-noise ratio, neither improved nor spent.",
  },
  am: {
    label: "AM", bw: 2 * B, out: (x) => x + ratioToDb(amPower(1).efficiency), floor: null,
    lab: { dx: 8, dy: 3.5 },
    story:
      "Twice the bandwidth of SSB and <b>4.77 dB worse</b>, because even at " +
      "full modulation two thirds of the power sits in a carrier that " +
      "conveys nothing. <b>It buys a receiver that is a diode</b> — which, " +
      "for one transmitter and a million receivers, was the right trade in " +
      "1920 and is the wrong one now.",
  },
  fm: {
    label: "FM", bw: carson(BETA * B, B), out: (x) => x + 20 * Math.log10(BETA), floor: 10,
    lab: { dx: -8, dy: 3.5, anchor: "end" },
    story:
      "Broadcast FM: β = 5, twelve times the bandwidth, and <b>about 14 dB " +
      "of signal-to-noise bought with spectrum alone</b> — no extra " +
      "transmitter power anywhere. It is the best the analog schemes manage, " +
      "and it has a <b>threshold</b>: below roughly 10 dB of carrier-to-noise " +
      "the advantage collapses rather than fading.",
  },
  pcm: {
    /* The two PCM schemes deliver identical quality, so their dots sit at
       the same height and their labels have to be dodged apart vertically —
       one above its dot, one below. */
    label: "PCM, binary", bw: PCM_BW, out: () => PCM_OUT, floor: BIN_THRESHOLD,
    lab: { dx: -8, dy: 15, anchor: "end" },
    story:
      "The conversation as numbers: 8000 samples a second, eight bits each, " +
      "64 kbit/s down a 32 kHz channel. <b>The output does not depend on the " +
      "channel at all</b> — it is set by the quantiser, at 6.02(8) + 1.76 = " +
      "49.9 dB, and it stays there whether the link is comfortable or barely " +
      "working. Then the bit errors start and it stops.",
  },
  qam: {
    label: "PCM, 16-ary", bw: PCM_BW / 4, out: () => PCM_OUT, floor: ratioToDb(snrForNyquist(16)),
    lab: { dx: 8, dy: -8 },
    story:
      "The same 64 kbit/s sent four bits at a time, so the channel need only " +
      "be a quarter as wide: <b>8 kHz, against FM's 40.8</b>. The quality is " +
      "identical because the bits are identical. <b>What it costs is channel " +
      "quality</b> — Shannon's 1 + S/N = M² demands 24.1 dB before this is " +
      "possible at all, which is 11.5 dB more than binary asks for.",
  },
};

function tradeSpace() {
  const cp = new Plot({
    w: 300, h: 262, xr: [0, 40], yr: [0, 60],
    pad: { l: 42, r: 14, t: 14, b: 36 },
    label: "Delivered signal-to-noise ratio against channel signal-to-noise ratio, for five ways of sending the same conversation.",
  });
  const tp = new Plot({
    w: 300, h: 262, xr: [0, 14], yr: [0, 60],
    pad: { l: 42, r: 14, t: 14, b: 36 },
    label: "The trade space: bandwidth used against quality delivered, at the current channel condition.",
  });

  const rdBw = readout({ key: "bandwidth", value: "", tone: "x" });
  const rdRel = readout({ key: "relative", value: "", tone: "x" });
  const rdOut = readout({ key: "delivers", value: "", tone: "r" });
  const rdNeed = readout({ key: "needs", value: "", tone: "y" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "ssb", k;

  const live = (L, x) => L.floor === null || x >= L.floor;

  function draw() {
    const x = k.value();
    const L = LINKS[cur];
    const ok = live(L, x);
    const out = L.out(x);

    /* --- quality against channel ---------------------------------------- */
    cp.clear("curve", "label", "mark", "shade");
    cp.grid({ xStep: 5, yStep: 5 });
    cp.axes({
      xLabel: "channel SNR (dB)", yLabel: "delivered SNR (dB)",
      xStep: 10, yStep: 20, origin: false,
    });

    /* Each scheme is drawn only where it works. Below a threshold the
       collapse is abrupt and its shape is not modelled here, so the curve
       stops rather than guessing at it. */
    const draw1 = (id, L2) => {
      const on = id === cur;
      const from = L2.floor === null ? 0 : L2.floor;
      cp.curve((v) => (v >= from ? L2.out(v) : NaN), {
        color: on ? "q-x" : "muted", width: on ? 2.8 : 1.2,
        dash: on ? null : "4 3", samples: 240,
      });
      if (L2.floor !== null) {
        cp.dot(L2.floor, L2.out(L2.floor), { color: on ? "q-x" : "muted", r: on ? 4 : 2.6, ring: false });
      }
    };
    for (const id of Object.keys(LINKS)) if (id !== cur) draw1(id, LINKS[id]);
    draw1(cur, L);

    cp.line(x, 0, x, 60, { color: "q-r", width: 1.1, dash: "3 3" });
    if (ok) cp.dot(x, Math.min(out, 60), { color: "q-r", r: 5 });
    /* Bottom right is the only reliably empty corner here: the y-axis
       caption owns the top left and every curve passes above this line. */
    cp.text(39, 9, "analog: sloped · digital: flat", { color: "muted", size: 9.5, anchor: "end" });

    /* --- the trade space ------------------------------------------------- */
    tp.clear("curve", "label", "mark", "shade");
    tp.grid({ xStep: 1, yStep: 5 });
    tp.axes({
      xLabel: "bandwidth ÷ message", yLabel: "delivered SNR (dB)",
      xStep: 2, yStep: 20, origin: false,
    });
    /* Up and to the left is better, so the corner is the target. */
    tp.text(13.6, 9, "better is up and to the left", { color: "muted", size: 9.5, anchor: "end" });

    for (const id of Object.keys(LINKS)) {
      const L2 = LINKS[id];
      const on = id === cur;
      const up = live(L2, x);
      const bx = L2.bw / B, by = Math.min(L2.out(x), 59);
      tp.dot(bx, by, {
        color: on ? "q-r" : up ? "q-x" : "q-bad",
        r: on ? 6 : 4.5, ring: !up,
      });
      tp.text(bx, by, L2.label, {
        color: on ? "q-r" : up ? "q-x" : "q-bad",
        size: on ? 10 : 9, anchor: L2.lab.anchor || "start",
        dx: L2.lab.dx, dy: L2.lab.dy,
      });
    }

    rdBw.set(num(L.bw / 1e3, 1), " kHz");
    rdRel.set(fixed(L.bw / B, 2), " × B");
    rdOut.set(ok ? `${fixed(out, 1)} dB` : "nothing");
    rdNeed.set(L.floor === null ? "any channel" : `${fixed(L.floor, 1)} dB`);

    const fm = LINKS.fm, qam = LINKS.qam;
    rdNote.set(
      `${L.story} <b>At a ${num(x, 0)} dB channel this link ${
        ok
          ? `delivers ${fixed(out, 1)} dB over ${num(L.bw / 1e3, 1)} kHz</b> — ${fixed(L.bw / B, 2)} times the 3.4 kHz the conversation occupied to begin with.`
          : `does not work at all</b>: it needs ${fixed(L.floor, 1)} dB and has ${num(x, 0)}. ${
              cur === "fm"
                ? "<b>FM below threshold is not degraded, it is silent</b> — the capture effect that suppresses a weaker station suppresses your own signal once noise dominates the angle."
                : "<b>A digital link does not fade</b>. The bit errors pass some rate the decoder cannot absorb and the conversation stops, over a couple of decibels."
            }`
      } ` +
      `<b>The shape of the left panel is the whole module.</b> The analog schemes are straight lines through the channel's own ratio — ` +
      `every decibel the channel loses, they lose — while the digital ones are perfectly flat and then simply end. ` +
      `<b>That is a difference in kind, not degree</b>, and it is what the bandwidth expansion of Part 4 was actually buying. ` +
      `<b>And look at the right panel at 30 dB or better:</b> 16-ary PCM sits at ${fixed(qam.bw / B, 2)}×B and ${fixed(PCM_OUT, 1)} dB, ` +
      `against FM's ${fixed(fm.bw / B, 0)}×B and ${fixed(fm.out(30), 1)} dB — <b>${fixed(fm.bw / qam.bw, 1)} times narrower and ${fixed(PCM_OUT - fm.out(30), 1)} dB better at once</b>. ` +
      `Not a trade; a win on both axes. <b>The proviso is the entire reason analog lasted</b>: it needs a ${fixed(qam.floor, 1)} dB channel before Shannon permits it at all, ` +
      `and for most of the twentieth century the line between two cities was not that good.`
    );
  }

  k = knob({
    label: "channel signal-to-noise ratio", min: 0, max: 40, step: 1, value: 30,
    format: (v) => `${num(v, 0)} dB`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "how the conversation is sent",
    options: Object.keys(LINKS).map((id) => ({ id, label: LINKS[id].label })),
    value: "ssb",
    onChange: (id) => { cur = id; draw(); },
  });
  draw();

  return {
    stage: el("div.duo", null, cp.root, tp.root),
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdBw, rdRel, rdOut, rdNeed, rdNote),
  };
}

register("commsTrade", { no: 127, build: () => {
  const f = tradeSpace();
  return plate({
    no: 127, title: "One conversation, five ways", tag: "interactive",
    label: "Delivered quality against channel quality, and the bandwidth-against-quality trade space, for five ways of sending one telephone conversation.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The same 3.4 kHz conversation this compilation has carried since " +
      "Signal Processing Part 2, sent five ways, with every one of the " +
      "module's numbers on one pair of axes. <b>The left panel is the " +
      "argument in one shape</b>: analog schemes are sloped lines — they " +
      "hand you whatever the channel gives, plus or minus a constant — while " +
      "digital ones are flat and then vanish. <b>Perfect, then absent</b>, " +
      "rather than steadily worse. The right panel is the trade space, and " +
      "at a good channel it holds the result that ended the argument: " +
      "<b>16-ary PCM is five times narrower than broadcast FM and six " +
      "decibels better at the same time</b>. The catch is Shannon's — it " +
      "needs 24 dB before it is possible at all, and for most of the " +
      "twentieth century the line between two cities was not that good.",
  });
} });
