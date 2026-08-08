/* ==========================================================================
   figures/am.js — Plates 117 and 118.

   Part 1 ended on one line: multiplying by a carrier copies a spectrum to
   ±fc at half amplitude. Amplitude modulation is that line and almost
   nothing else, so this part is mostly about what the copies cost.

   Plate 117 is the index — what m means in the envelope, in the spectrum,
   and at the moment it exceeds 1 and the envelope stops tracking the
   message. Plate 118 is the bill: how much of the transmitted power is
   actually carrying information, which for full-carrier AM is never more
   than a third and is usually far less.

   The cast: Ac = 5 V with Am = 3 V gives m = 0.6, an envelope swinging
   between 2 and 8 V, and (8−2)/(8+2) = 0.6 read straight off a scope. It is
   the same 0.6 that has been ζ and cos 53.13° since Mathematics Part 1.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";
import { amPower } from "../lib/comms.js";

const AC = 5;                    // carrier amplitude, volts
const FM = 1;                    // message frequency, arbitrary units
const FC = 12;                   // carrier — 12 cycles per message cycle, to draw

/* ==========================================================================
   Plate 117 — the index, in both domains
   ========================================================================== */

function amIndex() {
  const tp = new Plot({
    w: 300, h: 232, xr: [0, 2], yr: [-11, 11],
    pad: { l: 38, r: 14, t: 16, b: 32 },
    label: "The modulated carrier in the time domain, with its envelope drawn over it.",
  });
  const sp = new Plot({
    w: 300, h: 232, xr: [FC - 3.4, FC + 3.4], yr: [0, 6.4],
    pad: { l: 38, r: 14, t: 16, b: 32 },
    label: "The line spectrum: a carrier with one sideband either side of it.",
  });

  const rdM = readout({ key: "index m", value: "", tone: "x" });
  const rdEnv = readout({ key: "envelope", value: "", tone: "y" });
  const rdSb = readout({ key: "each sideband", value: "", tone: "y" });
  const rdEff = readout({ key: "efficiency", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(v) {
    const m = v / 100;
    const env = (t) => AC * (1 + m * Math.cos(2 * Math.PI * FM * t));
    const s = (t) => env(t) * Math.cos(2 * Math.PI * FC * t);
    /* For m > 1 the factor (1 + m cos) passes through zero, so the envelope a
       detector sees touches 0 — it is not Ac|1 − m|, which is only where the
       factor bottoms out. That is exactly why the scope formula saturates at
       m = 1 and cannot report overmodulation. */
    const aMax = AC * (1 + m);
    const aMin = m <= 1 ? AC * (1 - m) : 0;
    const P = amPower(m);

    tp.clear("curve", "label", "mark", "shade");
    tp.grid({ xStep: 0.125, yStep: 2.5 });
    tp.axes({ xLabel: "t", yLabel: "volts", xStep: 1, yStep: 5, origin: false });
    tp.curve(env, { color: "q-y", width: 1.6, dash: "4 3", samples: 500 });
    tp.curve((t) => -env(t), { color: "q-y", width: 1.6, dash: "4 3", samples: 500 });
    tp.curve(s, { color: "q-x", width: 1.7, samples: 1400 });

    sp.clear("curve", "label", "mark", "shade");
    sp.grid({ xStep: 0.5, yStep: 1 });
    sp.axes({ xLabel: "frequency", yLabel: "volts", xStep: 2, yStep: 2, origin: false });
    /* carrier, then a sideband either side at mAc/2 */
    for (const [f, a, c] of [[FC, AC, "q-x"], [FC - FM, (m * AC) / 2, "q-r"], [FC + FM, (m * AC) / 2, "q-r"]]) {
      sp.line(f, 0, f, a, { color: c, width: 3 });
      sp.dot(f, a, { color: c, r: 4, ring: false });
    }
    sp.text(FC, AC, "carrier", { color: "q-x", size: 10, anchor: "middle", dy: -9 });
    if (m > 0.05) {
      sp.text(FC + FM, (m * AC) / 2, "sideband", {
        color: "q-r", size: 10, anchor: "start", dx: 4, dy: -6,
      });
    }

    rdM.set(fixed(m, 2));
    rdEnv.set(`${fixed(aMin, 1)} – ${fixed(aMax, 1)}`, " V");
    rdSb.set(fixed((m * AC) / 2, 2), " V");
    rdEff.set(fixed(100 * P.efficiency, 1), " %");

    const cast = Math.abs(m - 0.6) < 0.005;
    rdNote.set(
      m <= 0.005
        ? `<b>No modulation at all: a bare carrier.</b> It is transmitting full power and carrying no information whatsoever, which is worth sitting with before reading the efficiency figures — <b>the carrier never carries information, at any index</b>.`
        : m <= 1.005
          ? `<b>The envelope swings between ${fixed(aMin, 1)} and ${fixed(aMax, 1)} V</b>, and that is how m is measured in practice: (max − min)/(max + min) = (${fixed(aMax, 1)} − ${fixed(aMin, 1)})/(${fixed(aMax, 1)} + ${fixed(aMin, 1)}) = ${fixed(m, 2)}. ${
              cast
                ? `<b>This is the cast's number.</b> A 5 V carrier with a 3 V message gives m = 0.6 — the same 0.6 that has been ζ and cos 53.13° since Mathematics Part 1 — and the envelope runs 2 to 8 V. `
                : ""
            }In the spectrum, <b>the sidebands sit at exactly ±f<sub>m</sub> from the carrier</b> at mA<sub>c</sub>/2 = ${fixed((m * AC) / 2, 2)} V each. The occupied bandwidth is <b>2f<sub>m</sub></b> however small m gets, because both copies are always there. Only ${fixed(100 * P.efficiency, 1)}% of the transmitted power is in them.`
          : `<b>Overmodulated.</b> Past m = 1 the term (1 + m cos) goes negative, the carrier flips phase, and <b>the envelope stops following the message</b> — it folds back on itself instead. An envelope detector, which is the cheap receiver AM exists to allow, now recovers a distorted mess. <b>Note what the envelope readout does here</b>: the minimum is 0, not A<sub>c</sub>|1 − m|, because the envelope passes clean through zero on its way. So the scope formula (max − min)/(max + min) returns exactly 1 for <em>every</em> index above 1 — <b>overmodulation cannot be measured that way at all</b>, which is why broadcast transmitters limit it at the source rather than trusting the programme material.`
    );
  }

  const k = knob({
    label: "modulation index", min: 0, max: 140, step: 1, value: 60,
    format: (v) => `m = ${fixed(v / 100, 2)}`,
    onInput: draw,
  });
  draw(60);

  return {
    stage: el("div.duo", null, tp.root, sp.root),
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdM, rdEnv, rdSb, rdEff, rdNote),
  };
}

/* ==========================================================================
   Plate 118 — where the power actually goes
   ========================================================================== */

const SCHEMES = {
  am: {
    label: "full-carrier AM",
    bw: 2, carrier: true, sidebands: 2,
    story:
      "The carrier is transmitted along with both sidebands. <b>It carries no information</b> — it is the same sinusoid whatever the message does — but it is what lets a receiver be a diode and a capacitor. <b>You are paying for the receiver's simplicity in transmitter power</b>, and broadcast AM decided that was worth it because there is one transmitter and millions of receivers.",
  },
  dsb: {
    label: "DSB-SC",
    bw: 2, carrier: false, sidebands: 2,
    story:
      "Suppress the carrier and every watt goes into the sidebands: <b>100% efficient</b>. The bandwidth has not changed, because both sidebands are still there. What has changed is the receiver — with no carrier to ride on, the envelope no longer resembles the message and the receiver must <b>regenerate the carrier itself</b>, in phase, which is a great deal more than a diode.",
  },
  ssb: {
    label: "SSB",
    bw: 1, carrier: false, sidebands: 1,
    story:
      "The two sidebands are mirror images, so one of them is redundant. Throw it away and you <b>halve the bandwidth</b> as well as keeping full efficiency. This is why SSB is the choice wherever spectrum is scarce and receivers can be complex — amateur and marine HF, and historically the long-distance telephone trunks this compilation has been following.",
  },
};

function amSchemes() {
  const p = new Plot({
    w: 620, h: 236, xr: [0, 1], yr: [0, 105],
    pad: { l: 52, r: 18, t: 16, b: 34 },
    label: "Transmission efficiency against modulation index for the three amplitude-modulation schemes.",
  });

  const rdScheme = readout({ key: "scheme", value: "", tone: "x" });
  const rdBw = readout({ key: "bandwidth", value: "", tone: "y" });
  const rdEff = readout({ key: "efficiency", value: "", tone: "r" });
  const rdRx = readout({ key: "receiver", value: "", tone: "" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "am", k;

  /* Efficiency of full-carrier AM as a function of m; the suppressed-carrier
     schemes put everything in the sidebands by construction. */
  const effOf = (id, m) => (id === "am" ? 100 * amPower(m).efficiency : 100);

  function draw() {
    const m = k.value() / 100;
    const S = SCHEMES[cur];
    p.clear("curve", "label", "mark", "shade");
    p.grid({ xStep: 0.05, yStep: 10 });
    p.axes({ xLabel: "modulation index m", yLabel: "power in the sidebands (%)", xStep: 0.25, yStep: 25, origin: false });

    for (const id of Object.keys(SCHEMES)) {
      if (id === cur) continue;
      p.curve((x) => effOf(id, x), { color: "muted", width: 1.2, dash: "4 3", samples: 200 });
    }
    p.curve((x) => effOf(cur, x), { color: "q-x", width: 2.8, samples: 300 });

    const e = effOf(cur, m);
    p.dot(m, e, { color: "q-r", r: 5 });
    p.line(m, 0, m, e, { color: "q-r", width: 1.1, dash: "3 3" });
    p.line(0, 33.33, 1, 33.33, { color: "muted", width: 1.1, dash: "5 4" });
    p.text(0.02, 33.33, "1/3 — the best AM can do", { color: "muted", size: 10, anchor: "start", dy: -5 });

    rdScheme.set(S.label);
    rdBw.set(`${num(S.bw, 0)} × fm`, S.bw === 1 ? " — halved" : "");
    rdEff.set(fixed(e, 1), " %");
    rdRx.set(S.carrier ? "a diode" : "coherent");

    rdNote.set(
      `${S.story} <b>At m = ${fixed(m, 2)} this scheme puts ${fixed(e, 1)}% of its transmitted power into the sidebands.</b> ${
        cur === "am"
          ? m > 0.99
            ? `Even at full modulation — the most you are allowed — <b>two thirds of the power is still in the carrier</b>, doing nothing but existing. That is the ceiling: 1/3, exactly, and it is why the other two schemes exist.`
            : `Push m to 1 and it still only reaches 33.3%. <b>The curve is m²/(2 + m²)</b>, which is small for any modest index — at m = 0.5 barely a ninth of the power is useful.`
          : `Compare the dashed curve: full-carrier AM at the same index manages only ${fixed(effOf("am", m), 1)}%. <b>The efficiency here does not depend on m at all</b>, because there is no carrier soaking up the difference.`
      }`
    );
  }

  k = knob({
    label: "modulation index", min: 5, max: 100, step: 1, value: 60,
    format: (v) => `m = ${fixed(v / 100, 2)}`,
    onInput: draw,
  });
  const sc = scenarios({
    label: "scheme",
    options: Object.keys(SCHEMES).map((id) => ({ id, label: SCHEMES[id].label })),
    value: "am",
    onChange: (id) => { cur = id; draw(); },
  });
  draw();

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdScheme, rdBw, rdEff, rdRx, rdNote),
  };
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("amIndex", { no: 117, build: () => {
  const f = amIndex();
  return plate({
    no: 117, title: "One number describes the whole thing", tag: "interactive",
    label: "An amplitude-modulated carrier in time with its envelope, beside its line spectrum.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Amplitude modulation is Part 1's frequency-shift property with the " +
      "message riding on a constant: multiply by the carrier and the " +
      "spectrum lands at <b>±f<sub>c</sub></b>, one sideband either side. " +
      "The modulation index is the only free parameter, and it is measured " +
      "off a scope as <b>(max − min)/(max + min)</b> without knowing anything " +
      "about the transmitter. Set it to 0.6 for a 5 V carrier and the " +
      "envelope runs 2 to 8 V — the compilation's number again. <b>Then push " +
      "past 1</b> and watch the envelope stop being the message.",
  });
} });

register("amSchemes", { no: 118, build: () => {
  const f = amSchemes();
  return plate({
    no: 118, title: "The carrier carries nothing", tag: "interactive",
    label: "Sideband power as a percentage of transmitted power, against modulation index, for AM, DSB-SC and SSB.",
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Only the sidebands change with the message, so only the sidebands " +
      "carry information — and in full-carrier AM they never hold more than " +
      "<b>a third of the transmitted power</b>, even at the maximum index " +
      "you are allowed to use. That is a strange thing to design on purpose " +
      "until you notice what it buys: <b>a receiver that is a diode and a " +
      "capacitor</b>. Suppressing the carrier recovers all the power, and " +
      "dropping the redundant sideband halves the bandwidth as well — both " +
      "paid for with a receiver that has to regenerate the carrier itself.",
  });
} });
