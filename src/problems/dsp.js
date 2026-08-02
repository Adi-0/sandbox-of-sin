/* ==========================================================================
   problems/dsp.js — generators for Signal Processing.

   Part 1 (8.A · 8.B): spectra. The exam does not ask you to integrate a
   Fourier coefficient, so neither do these. What it asks is whether you can
   read a spectrum: which harmonics a wave contains, how its RMS assembles
   from them, and what bandwidth a given signal actually needs.

   The distractors are the four errors that survive into every later part of
   this module: adding amplitudes instead of powers, forgetting the √2 between
   an amplitude and an RMS, assuming every harmonic is present, and confusing
   the harmonic *number* with its *frequency*.
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed, sig, ord } from "../lib/fmt.js";
import { aliasOf, orderFor, butterworth, dB, runFilter } from "../lib/dsp.js";

const DEGP = 180 / Math.PI;

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;
const D = (s) => `<span class="math display" data-tex="${s.replace(/"/g, "&quot;")}"></span>`;

/** Right answer first; duplicates dropped, topped up from `spare`. */
function options(right, wrong, spare = []) {
  const norm = (c) => (typeof c === "string" ? { text: c, why: "" } : c);
  const key = (c) => c.tex ?? c.html ?? String(c.text ?? "");
  const seen = new Set();
  const out = [];
  for (const c of [right, ...wrong, ...spare]) {
    const n = norm(c);
    if (seen.has(key(n))) continue;
    seen.add(key(n));
    out.push(n);
    if (out.length === 4) break;
  }
  return out;
}

/* ==========================================================================
   Part 1 — signals and spectra
   ========================================================================== */

const WAVE = {
  square: {
    name: "square", parity: "odd", decay: 1, amp: (k) => 4 / (Math.PI * k),
    fundPct: 81.1, thd: 48.3,
    why: "the second half of the wave is the exact negative of the first, and that symmetry cancels every even harmonic",
  },
  triangle: {
    name: "triangle", parity: "odd", decay: 2, amp: (k) => 8 / (Math.PI * Math.PI * k * k),
    fundPct: 98.6, thd: 12.1,
    why: "it has the same half-wave symmetry as the square, so the even harmonics vanish for the same reason",
  },
  sawtooth: {
    name: "sawtooth", parity: "all", decay: 1, amp: (k) => 2 / (Math.PI * k),
    fundPct: 60.8, thd: 80.3,
    why: "it has no half-wave symmetry, so nothing removes the even harmonics",
  },
};

/* --- which harmonics are there, and at what frequency -------------------- */

defineProblem("harmonic-id", {
  topic: "Harmonic content",
  lookup: "Electrical → Signal Processing → Fourier series / waveform spectra",
  make(rng) {
    const w = WAVE[rng.pick(["square", "triangle", "sawtooth"])];
    const f0 = rng.pick([50, 60, 100, 400, 1000]);
    const mode = rng.pick(["freq", "ratio", "which"]);

    /* --- the frequency of the nth term actually present ------------------ */
    if (mode === "freq") {
      const idx = rng.int(2, 4);                       // 2nd, 3rd or 4th present term
      const ks = [];
      for (let k = 1; ks.length < idx + 2; k++) {
        if (w.parity === "all" || k % 2 === 1) ks.push(k);
      }
      const k = ks[idx - 1];
      /* For a sawtooth, term index and harmonic number coincide, so the
         "counted terms" trap has nothing to catch and its distractor would
         duplicate the answer. Only offer it where it is a real error. */
      const wrong = [];
      if (w.parity === "odd") {
        wrong.push({ text: `${num(idx * f0, 0)} Hz`,
          why: `That is the ${ord(idx)} <em>harmonic</em>, but a ${w.name} wave has <b>no even harmonics</b>, so counting terms and counting harmonics are not the same thing. Its terms sit at k = 1, 3, 5, …` });
      }
      wrong.push(
        { text: `${num(ks[idx] * f0, 0)} Hz`, why: `Off by one term. List them explicitly — k = ${ks.slice(0, idx + 1).join(", ")} — rather than counting in your head.` },
        { text: `${num(f0, 0)} Hz`, why: `That is the fundamental, the ${ord(1)} term. The question asks for the ${ord(idx)}.` },
        { text: `${num(f0 / k, 1)} Hz`, why: `Divided instead of multiplied. Harmonics are at <b>multiples</b> of f₀; nothing in a periodic signal sits below its own repetition rate.` },
      );
      return {
        stem: `A ${w.name} wave repeats at ${num(f0, 0)} Hz. What is the frequency of the <b>${ord(idx)} non-zero term</b> in its Fourier series?`,
        choices: options({ text: `${num(k * f0, 0)} Hz`, why: "" }, wrong),
        answer: 0,
        steps: [
          `A ${w.name} wave contains ${w.parity === "odd" ? "<b>odd harmonics only</b>" : "<b>every harmonic</b>"} — ${w.why}.`,
          `So the non-zero terms are at k = ${ks.slice(0, idx + 1).join(", ")}, … and the ${ord(idx)} of those is <b>k = ${k}</b>.`,
          D(`f = k f_0 = ${k}(${num(f0, 0)}) = ${num(k * f0, 0)}\\text{ Hz}`),
          w.parity === "odd"
            ? `<b>${num(k * f0, 0)} Hz.</b> The trap is reading &ldquo;${ord(idx)} term&rdquo; as &ldquo;${ord(idx)} harmonic&rdquo;. For a wave with only odd harmonics those diverge immediately.`
            : `<b>${num(k * f0, 0)} Hz.</b> A sawtooth is the one standard wave where term number and harmonic number agree, because nothing is missing from its series.`,
        ],
      };
    }

    /* --- the amplitude of a named harmonic, which tests the exponent -----
       Asked as an amplitude rather than a ratio: a ratio question makes the
       "wrong exponent" and "squared" distractors collide whenever the decay
       is already 1/k², and dedupe then leaves only three choices.          */
    if (mode === "ratio") {
      const k = rng.pick(w.parity === "odd" ? [3, 5, 7, 9] : [2, 3, 4, 5]);
      const A1 = rng.pick([6, 9, 12, 18, 24]);
      const right = A1 / (w.decay === 1 ? k : k * k);
      const other = A1 / (w.decay === 1 ? k * k : k);
      const termIdx = w.parity === "odd" ? (k + 1) / 2 : k;   // its place in the series
      return {
        stem: `A ${w.name} wave has a fundamental of ${num(A1, 0)} V amplitude. What is the amplitude of its <b>k = ${k}</b> harmonic?`,
        choices: options(
          { text: `${sig(right, 3)} V`, why: "" },
          [
            { text: `${sig(other, 3)} V`,
              why: w.decay === 1
                ? `That is a 1/k² decay. A ${w.name} wave has a <b>jump</b> in it, and a jump gives <b>1/k</b>.`
                : `That is a 1/k decay. A ${w.name} wave is continuous — corners but no jumps — and continuity buys the extra power: <b>1/k²</b>.` },
            { text: `${sig(A1 * (w.decay === 1 ? k : k * k), 3)} V`, why: `Multiplied instead of divided. <b>Harmonics get smaller, never larger</b> — if they grew the series could not converge.` },
            /* For a sawtooth the term index and the harmonic number are the
               same, so that distractor would duplicate the answer. Off-by-one
               in the index is the error that is actually available there. */
            w.parity === "odd"
              ? { text: `${sig(A1 / (w.decay === 1 ? termIdx : termIdx * termIdx), 3)} V`,
                  why: `The <em>term index</em> was used in place of the harmonic number. k = ${k} is the ${ord(termIdx)} non-zero term, but the formula uses <b>k itself</b>, not its position in the list.` }
              : { text: `${sig(A1 / (w.decay === 1 ? k + 1 : (k + 1) ** 2), 3)} V`,
                  why: `Off by one in the index — this is the answer for k = ${k + 1}. The fundamental is <b>k = 1, not k = 0</b>, so the ${ord(k)} harmonic really is k = ${k}.` },
          ]),
        answer: 0,
        steps: [
          `A ${w.name} wave has ${w.decay === 1 ? "a discontinuity, so its harmonics fall as <b>1/k</b>" : "corners but no discontinuity, so its harmonics fall as <b>1/k²</b>"}.`,
          D(`A_{${k}} = \\frac{A_1}{${w.decay === 1 ? `${k}` : `${k}^2`}} = \\frac{${num(A1, 0)}}{${w.decay === 1 ? k : k * k}} = ${sig(right, 4)}\\text{ V}`),
          `<b>${sig(right, 3)} V</b> — ${w.decay === 1 ? k : k * k} times smaller than the fundamental. ${
            w.decay === 1
              ? `This is why a ${w.name} wave needs so many terms: even the 25th harmonic is still 4% of the fundamental.`
              : `This is why a triangle is well approximated by very few terms: k = ${k} is already down to ${fixed(100 / (k * k), 1)}% of the fundamental.`
          }`,
        ],
      };
    }

    /* --- which of these waves has the widest spectrum -------------------- */
    return {
      stem: `Four signals share the same period. Which needs the <b>most bandwidth</b> to reproduce to a given accuracy?`,
      choices: options(
        { text: "a square wave", why: "" },
        [
          { text: "a triangle wave", why: `A triangle is continuous, so its harmonics fall as <b>1/k²</b> — far faster. Three or four terms already make a good triangle.` },
          { text: "a pure sine wave", why: `A sine <em>is</em> one harmonic. Its spectrum is a single line, which is the narrowest a signal can be.` },
          { text: "all four are equal, since the period is the same", why: `The period fixes the <b>spacing</b> of the harmonics, not how far they extend. <b>Spacing and extent are different questions</b>: f₀ sets where the lines are, the waveform's smoothness sets how long they keep mattering.` },
        ]),
      answer: 0,
      steps: [
        `Bandwidth is set by <b>how fast the harmonics die</b>, and that is set by smoothness.`,
        `A square wave <b>jumps</b>, so its harmonics fall only as 1/k — the slowest of the four. A triangle has corners but no jumps, giving 1/k². A sine has one line and nothing else.`,
        `<b>The square wave.</b> Note what the shared period does <em>not</em> do: it fixes the harmonic spacing at f₀ for all of them, and says nothing about extent.`,
      ],
    };
  },
});

/* --- RMS from a spectrum, where the trap is adding amplitudes ------------ */

defineProblem("spectrum-rms", {
  topic: "RMS and distortion from a spectrum",
  lookup: "Electrical → Signal Processing → RMS of a sum / total harmonic distortion",
  make(rng) {
    const ask = rng.pick(["rms", "rms", "thd", "dc"]);

    /* --- two or three harmonics, given as amplitudes -------------------- */
    if (ask === "rms" || ask === "dc") {
      /* Amplitudes chosen so the RMS lands on a clean number: the RMS values
         themselves form a 3-4-5 or 6-8-10 triangle, which is the cast. */
      const [r1, r2] = rng.pick([[3, 4], [6, 8], [5, 12], [8, 15], [9, 12]]);
      const A1 = r1 * Math.SQRT2, A2 = r2 * Math.SQRT2;
      /* The DC term has to be a comparable size to the harmonics. A 2 V offset
         beside 6 V and 8 V moves the total by 2%, which makes the "dropped the
         DC" distractor indistinguishable from the answer rather than wrong. */
      const dc = ask === "dc" ? Math.round(rng.pick([0.6, 0.8, 1.0]) * Math.hypot(r1, r2)) : 0;
      const k = rng.pick([3, 5]);
      const rms = Math.hypot(dc, r1, r2);
      const naive = dc + r1 + r2;
      return {
        stem: `A voltage is ${dc ? `${num(dc, 0)} V DC plus ` : ""}a fundamental of ${sig(A1, 4)} V <b>amplitude</b> and a ${ord(k)} harmonic of ${sig(A2, 4)} V <b>amplitude</b>. What is the total RMS voltage?`,
        choices: options(
          { text: `${sig(rms, 4)} V`, why: "" },
          [
            { text: `${sig(naive, 4)} V`, why: `Amplitudes and RMS values were added directly. <b>Different frequencies are orthogonal, so their powers add, not their amplitudes</b> — the total is a square root of a sum of squares.` },
            { text: `${sig(Math.hypot(dc, A1, A2), 4)} V`, why: `The √2 was never applied. The numbers given are <b>amplitudes</b>; each sinusoid's RMS contribution is amplitude/√2${dc ? ", while the DC term is already an RMS and must not be divided" : ""}.` },
            { text: `${sig(Math.hypot(r1, r2), 4)} V`, why: dc ? `The DC term was dropped. It carries power too and enters the sum of squares exactly as the harmonics do — it is simply already an RMS value.` : `That is the answer with a term missing — recheck which components you included.` },
            { text: `${sig(r1, 4)} V`, why: `Only the fundamental. The harmonic is ${num(100 * r2 * r2 / (rms * rms), 0)}% of the total power here and cannot be ignored.` },
          ]),
        answer: 0,
        steps: [
          `Convert each sinusoid to its own RMS first — <b>this is where the √2 goes</b>:`,
          D(`\\frac{${sig(A1, 4)}}{\\sqrt2} = ${num(r1, 0)}\\text{ V}, \\qquad \\frac{${sig(A2, 4)}}{\\sqrt2} = ${num(r2, 0)}\\text{ V}`),
          dc ? `The DC term is <b>already</b> an RMS value — it does not get divided by √2.` : `Now add the <b>powers</b>, which means adding squares:`,
          D(`V_{rms} = \\sqrt{${dc ? `${num(dc, 0)}^2 + ` : ""}${num(r1, 0)}^2 + ${num(r2, 0)}^2} = ${sig(rms, 4)}\\text{ V}`),
          `<b>${sig(rms, 4)} V.</b> Adding them straight would have given ${sig(naive, 4)} V, which is too large by ${num(100 * (naive / rms - 1), 0)}%. <b>Components at different frequencies never add in phase, because they are never in a fixed phase relationship at all.</b>`,
        ],
      };
    }

    /* --- THD -------------------------------------------------------------
       Distortion is kept large enough that the distractors separate. The
       "divided by total RMS" variant is a real alternative definition, but
       it sits within a fraction of a point of the answer at small THD, which
       makes it an unanswerable choice rather than an instructive one — so it
       is explained in the steps instead of offered as an option.          */
    const A1 = rng.pick([100, 120, 200, 240]);
    const frac = rng.pick([[0.30, 0.20, 0.10], [0.25, 0.15, 0.10], [0.20, 0.12, 0.09], [0.35, 0.15, 0.05]]);
    const h = frac.map((x) => Math.round(A1 * x));
    const hp = h.reduce((s, a) => s + a * a, 0);
    const thd = Math.sqrt(hp) / A1;
    const wrongTot = Math.sqrt(hp) / Math.hypot(A1, ...h);
    return {
      stem: `A waveform has a fundamental of ${num(A1, 0)} V and harmonics of ${h.map((v) => `${num(v, 0)} V`).join(", ")} (all amplitudes). What is the total harmonic distortion?`,
      choices: options(
        { text: `${fixed(100 * thd, 1)}%`, why: "" },
        [
          { text: `${fixed(100 * h.reduce((s, a) => s + a, 0) / A1, 1)}%`, why: `The harmonic amplitudes were added directly. They are at different frequencies, so they <b>combine in quadrature</b> — square, add, then take the root.` },
          { text: `${fixed(100 * thd * Math.SQRT2, 1)}%`, why: `An RMS was divided by an amplitude. THD is a ratio of <b>like quantities</b>, so whether you use amplitudes throughout or RMS values throughout, the √2 cancels — it must never appear on only one side.` },
          { text: `${fixed(100 * h[0] / A1, 1)}%`, why: `Only the largest harmonic was counted. THD includes <b>all</b> of them, though notice how little the small ones move the answer once squared.` },
        ]),
      answer: 0,
      steps: [
        D(`\\text{THD} = \\frac{\\sqrt{\\sum_{k\\ge2}A_k^2}}{A_1}`),
        `Square and add the harmonics: ${D(`${h.map((v) => `${num(v, 0)}^2`).join(" + ")} = ${num(hp, 0)}`)}`,
        D(`\\text{THD} = \\frac{\\sqrt{${num(hp, 0)}}}{${num(A1, 0)}} = \\frac{${sig(Math.sqrt(hp), 4)}}{${num(A1, 0)}} = ${fixed(thd, 4)}`),
        `<b>${fixed(100 * thd, 1)}%.</b> Because the amplitudes are squared, <b>the largest harmonic dominates</b>: the ${num(h[0], 0)} V term alone gives ${fixed(100 * h[0] / A1, 1)}%, and all the rest together add only ${fixed(100 * (thd - h[0] / A1), 1)} points. The ratio is of <em>amplitudes</em> throughout, so the √2 cancels and never needs to appear.`,
        `<b>One definitional caution.</b> Some instruments report distortion against the <em>total</em> RMS rather than against the fundamental, which here would give ${fixed(100 * wrongTot, 1)}% instead. The handbook definition — and the one meant unless a question says otherwise — is <b>relative to the fundamental</b>. The two converge when distortion is small and diverge badly when it is not.`,
      ],
    };
  },
});

/* --- choosing a bandwidth, which is the handover to Part 2 --------------- */

defineProblem("bandwidth-pick", {
  topic: "Bandwidth of a signal",
  lookup: "Electrical → Signal Processing → Bandwidth / band-limiting",
  make(rng) {
    const f0 = rng.pick([1, 2, 2.5, 4]);            // kHz
    const kKeep = rng.pick([3, 5, 7, 9]);
    const w = rng.pick(["square", "triangle"]);
    const fmax = kKeep * f0;
    return {
      stem: `A ${w} wave at ${num(f0, 1)} kHz is passed through an ideal low-pass filter so that harmonics up to and including k = ${kKeep} survive. What is the bandwidth of the filtered signal, and the lowest sample rate that could then capture it without aliasing?`,
      choices: options(
        { text: `${num(fmax, 1)} kHz, sampled above ${num(2 * fmax, 1)} kHz`, why: "" },
        [
          { text: `${num(fmax, 1)} kHz, sampled above ${num(fmax, 1)} kHz`,
            why: `The factor of two is missing. <b>Nyquist requires more than twice the highest frequency</b>, not more than the highest frequency — one sample per cycle cannot distinguish a sinusoid from a constant.` },
          { text: `${num(f0, 1)} kHz, sampled above ${num(2 * f0, 1)} kHz`,
            why: `That is the <b>fundamental</b>, not the bandwidth. The signal still contains everything up to the ${kKeep}th harmonic, and the sample rate must respect the highest component present, not the repetition rate.` },
          { text: `${num(2 * fmax, 1)} kHz, sampled above ${num(4 * fmax, 1)} kHz`,
            why: `The doubling was applied twice — once to the bandwidth and again to the rate. The bandwidth is just f<sub>max</sub> itself.` },
          { text: `${num(kKeep * f0, 1)} kHz, sampled above ${num(kKeep * f0 * 2.2, 2)} kHz`,
            why: `A practical rate with margin, and in a real design a sensible one — but the question asks for the <b>lowest</b> rate, which is the Nyquist limit exactly.` },
        ]),
      answer: 0,
      steps: [
        `The surviving harmonics sit at k f₀ for k up to ${kKeep}${w === "square" || w === "triangle" ? " (odd only, but the highest one present is what matters)" : ""}, so the highest frequency in the filtered signal is`,
        D(`f_{max} = ${kKeep}(${num(f0, 1)}) = ${num(fmax, 1)}\\text{ kHz}`),
        `<b>That is the bandwidth.</b> Nyquist then requires`,
        D(`f_s > 2f_{max} = ${num(2 * fmax, 1)}\\text{ kHz}`),
        `<b>${num(fmax, 1)} kHz of bandwidth, sampled above ${num(2 * fmax, 1)} kHz.</b> Note the order of operations, because it is the order a real design uses: <b>filter first to establish f<sub>max</sub>, then choose f<sub>s</sub> from it</b>. Choosing the rate first and hoping the signal cooperates is how aliasing happens.`,
      ],
    };
  },
});

/* ==========================================================================
   reflex items — recognition, not arithmetic
   ========================================================================== */

defineReflex([
  {
    part: "spectra",
    stem: "A periodic signal of period T. Which frequencies can it contain?",
    tool: "Integer multiples of f₀ = 1/T, and nothing else",
    because: "A component at any non-multiple would not repeat every T, so neither would the sum.",
  },
  {
    part: "spectra",
    stem: "Square wave — which harmonics, falling how fast?",
    tool: "Odd harmonics only, amplitudes as 4/πk — so 1/k",
    because: "Half-wave symmetry kills the even ones; the jump forces the slow 1/k decay.",
  },
  {
    part: "spectra",
    stem: "Triangle wave — which harmonics, falling how fast?",
    tool: "Odd harmonics only, amplitudes as 8/π²k² — so 1/k²",
    because: "Same symmetry as the square, but no discontinuity, and continuity buys one extra power of k.",
  },
  {
    part: "spectra",
    stem: "Two sinusoids at different frequencies, 3 V and 4 V RMS. Total RMS?",
    tool: "5 V — √(3² + 4²), because powers add",
    because: "Different frequencies are orthogonal, so there is no cross term. Adding to 7 V is the standard error.",
  },
  {
    part: "spectra",
    stem: "Converting a sinusoid's amplitude to its RMS contribution?",
    tool: "Divide by √2 — but a DC term is already an RMS",
    because: "Mixing amplitudes and RMS values inside one sum of squares is the most common way this arithmetic goes wrong.",
  },
  {
    part: "spectra",
    stem: "Definition of THD?",
    tool: "√(Σ Ak² for k ≥ 2) / A₁ — everything but the fundamental, over the fundamental",
    because: "It is a ratio of amplitudes, so the √2 cancels and never enters.",
  },
  {
    part: "spectra",
    stem: "How much of a square wave's power is in its fundamental?",
    tool: "81%, and 90% by the third harmonic",
    because: "It is why band-limiting is survivable: two sinusoids already carry nine tenths of the signal.",
  },
  {
    part: "spectra",
    stem: "Truncating a Fourier series at a jump — what happens at the edge?",
    tool: "Gibbs overshoot, about 9% of the jump, and it never shrinks",
    because: "More terms narrow the ripple without lowering it, so band-limited and exact are permanently different.",
  },
]);

/* ==========================================================================
   Part 2 — sampling and aliasing

   Three generators for three distinct failure modes. `nyquist-rate` tests
   whether the two Nyquist names are the right way round; `alias-where` is
   the arithmetic; `alias-concept` is the one the exam actually cares about,
   which is knowing that the damage is permanent and that the filter goes
   first.
   ========================================================================== */

defineProblem("nyquist-rate", {
  topic: "Nyquist rate and Nyquist frequency",
  lookup: "Electrical → Signal Processing → Sampling / Nyquist theorem",
  make(rng) {
    const ask = rng.pick(["rate", "rate", "freq", "twice"]);

    /* --- the minimum rate for a stated bandwidth ------------------------ */
    if (ask === "rate") {
      const parts = rng.pick([
        { list: [1.2, 3.5, 4.8], u: "kHz" },
        { list: [50, 180, 400], u: "Hz" },
        { list: [2, 6, 15], u: "kHz" },
        { list: [0.3, 3.4], u: "kHz" },
      ]);
      const fmax = Math.max(...parts.list);
      const fmin = Math.min(...parts.list);
      return {
        stem: `A signal contains components at ${parts.list.map((v) => `${num(v, 2)} ${parts.u}`).join(", ")}. What is the minimum sampling rate that avoids aliasing?`,
        choices: options(
          { text: `just above ${num(2 * fmax, 2)} ${parts.u}`, why: "" },
          [
            { text: `just above ${num(fmax, 2)} ${parts.u}`, why: `That is f<sub>max</sub> itself, not twice it. One sample per cycle cannot distinguish a sinusoid from a constant — the criterion is <b>f<sub>s</sub> &gt; 2f<sub>max</sub></b>.` },
            { text: `just above ${num(2 * fmin, 2)} ${parts.u}`, why: `Twice the <b>lowest</b> component. The rate is set by the <b>highest</b> frequency present — the fastest thing in the signal is what needs resolving.` },
            { text: `just above ${num(2 * parts.list.reduce((s, v) => s + v, 0), 2)} ${parts.u}`, why: `The components were added together first. <b>Frequencies present in a signal do not sum</b>; only the largest one matters here.` },
            { text: `just above ${num(fmax / 2, 2)} ${parts.u}`, why: `That is the Nyquist <em>frequency</em> you would get if you sampled at f<sub>max</sub> — the two names have been swapped. The <b>rate</b> is 2f<sub>max</sub>.` },
          ]),
        answer: 0,
        steps: [
          `The rate is set by the <b>highest</b> frequency present, which is ${num(fmax, 2)} ${parts.u}.`,
          D(`f_s > 2f_{max} = 2(${num(fmax, 2)}) = ${num(2 * fmax, 2)}\\text{ ${parts.u}}`),
          `<b>Just above ${num(2 * fmax, 2)} ${parts.u}</b>, which is the <b>Nyquist rate</b> for this signal. Note it is a strict inequality: sampling at exactly ${num(2 * fmax, 2)} ${parts.u} puts two samples per cycle on the ${num(fmax, 2)} ${parts.u} component, and those two can land on the same pair of points every cycle and lose the amplitude entirely.`,
        ],
      };
    }

    /* --- the highest representable frequency for a stated rate ---------- */
    if (ask === "freq") {
      const fs = rng.pick([8, 10, 20, 44.1, 48, 100]);
      return {
        stem: `A converter samples at ${num(fs, 3)} kHz. What is the highest signal frequency it can represent without aliasing?`,
        choices: options(
          { text: `just under ${num(fs / 2, 3)} kHz`, why: "" },
          [
            { text: `just under ${num(fs, 3)} kHz`, why: `That is the sampling rate itself. The converter can only represent up to <b>half</b> of it — a signal at f<sub>s</sub> would put every sample on the same point of the wave.` },
            { text: `just under ${num(2 * fs, 3)} kHz`, why: `Doubled instead of halved. The factor of two runs the other way: the <b>rate</b> must exceed twice the <b>frequency</b>, so the frequency must be under half the rate.` },
            { text: `just under ${num(fs / 4, 3)} kHz`, why: `Halved twice. There is only one factor of two in the sampling theorem.` },
          ]),
        answer: 0,
        steps: [
          `The highest representable frequency is the <b>Nyquist frequency</b>, which is half the sampling rate:`,
          D(`f_N = \\frac{f_s}{2} = \\frac{${num(fs, 3)}}{2} = ${num(fs / 2, 3)}\\text{ kHz}`),
          `<b>Just under ${num(fs / 2, 3)} kHz.</b> Anything at or above it folds back down into the band. Keep the two names apart: <b>${num(fs / 2, 3)} kHz is the Nyquist frequency and belongs to this converter</b>; a Nyquist <em>rate</em> is 2f<sub>max</sub> and belongs to a signal.`,
        ],
      };
    }

    /* --- the deliberate name trap --------------------------------------- */
    const fmax = rng.pick([4, 5, 10, 15, 20]);
    return {
      stem: `A signal is band-limited to ${num(fmax, 0)} kHz. It is sampled at <b>twice the Nyquist rate</b>. What is the sampling frequency?`,
      choices: options(
        { text: `${num(4 * fmax, 0)} kHz`, why: "" },
        [
          { text: `${num(2 * fmax, 0)} kHz`, why: `That <em>is</em> the Nyquist rate. The question asks for <b>twice</b> it.` },
          { text: `${num(fmax, 0)} kHz`, why: `That is f<sub>max</sub>. The Nyquist rate is already 2f<sub>max</sub> before the doubling in the question is applied.` },
          { text: `${num(fmax / 2, 0)} kHz`, why: `That would be the Nyquist frequency of a converter running at f<sub>max</sub> — the two names have been swapped and the doubling dropped.` },
        ]),
      answer: 0,
      steps: [
        `<b>Nyquist rate</b> means 2f<sub>max</sub>, a property of the signal:`,
        D(`\\text{Nyquist rate} = 2(${num(fmax, 0)}) = ${num(2 * fmax, 0)}\\text{ kHz}`),
        `Twice that is ${D(`f_s = 2(${num(2 * fmax, 0)}) = ${num(4 * fmax, 0)}\\text{ kHz}`)}`,
        `<b>${num(4 * fmax, 0)} kHz.</b> This phrasing is on the exam precisely because &ldquo;twice the Nyquist rate&rdquo; and &ldquo;twice the Nyquist frequency&rdquo; sound alike and differ by a factor of two. <b>Rate is 2f<sub>max</sub> and belongs to the signal; frequency is f<sub>s</sub>/2 and belongs to the sampler.</b>`,
      ],
    };
  },
});

defineProblem("alias-where", {
  topic: "Where an aliased tone lands",
  lookup: "Electrical → Signal Processing → Aliasing",
  make(rng) {
    const fs = rng.pick([8, 10, 12, 20, 48]);
    /* Keep the tone above Nyquist and off the exact fold points, so the
       answer is a genuine fold rather than a degenerate zero. */
    const cand = [];
    for (let f = fs / 2 + fs / 8; f <= 3 * fs; f += fs / 8) {
      const a = aliasOf(f, fs);
      if (a > fs / 16 && Math.abs(a - fs / 2) > 1e-9) cand.push(f);
    }
    const f = rng.pick(cand);
    const fa = aliasOf(f, fs);
    const k = Math.round(f / fs);
    const rem = Math.abs(f) % fs;                // before the fold about fs/2
    return {
      stem: `A ${num(f, 3)} kHz sinusoid is sampled at ${num(fs, 0)} kHz with no anti-alias filter. What frequency appears in the sampled data?`,
      /* The remainder before folding is the instructive wrong answer: it is
         what you get from f mod fs without the reflection about fs/2, and it
         is the single most common way this arithmetic is botched. Offering
         |f − fs| instead would, for any tone between fs/2 and fs, be exactly
         minus the right answer — the same number, which tests nothing. */
      choices: options(
        { text: `${num(fa, 3)} kHz`, why: "" },
        [
          rem > fs / 2 + 1e-9
            ? { text: `${num(rem, 3)} kHz`, why: `That is f mod f<sub>s</sub>, but the fold was not finished. A remainder above f<sub>s</sub>/2 = ${num(fs / 2, 2)} kHz reflects back down: ${num(fs, 0)} − ${num(rem, 3)} = ${num(fa, 3)} kHz. <b>The answer can never exceed f<sub>s</sub>/2.</b>` }
            : { text: `${num(fs - fa, 3)} kHz`, why: `Folded the wrong way. The tone sits ${num(fa, 3)} kHz from the multiple ${num(k * fs, 0)} kHz, and it is that distance — not its complement — that appears. <b>The answer can never exceed f<sub>s</sub>/2 = ${num(fs / 2, 2)} kHz.</b>` },
          { text: `${num(f, 3)} kHz`, why: `That is the input. It is above the Nyquist frequency of ${num(fs / 2, 2)} kHz, so the converter cannot represent it — it folds down instead.` },
          { text: `${num(fs / 2, 3)} kHz`, why: `That is the Nyquist frequency — the edge of the band, not where this particular tone lands inside it.` },
          { text: `${num(Math.abs(f - (k + 1) * fs), 3)} kHz`, why: `A multiple of f<sub>s</sub> that is not the nearest one was subtracted. The nearest is ${num(k, 0)} × ${num(fs, 0)} = ${num(k * fs, 0)} kHz.` },
        ]),
      answer: 0,
      steps: [
        `<b>Check whether it aliases at all.</b> The Nyquist frequency is ${D(`f_N = f_s/2 = ${num(fs / 2, 2)}\\text{ kHz}`)} and ${num(f, 3)} kHz is above it, so it does.`,
        `<b>Subtract the nearest multiple of f<sub>s</sub>.</b> Multiples are ${[1, 2, 3].map((i) => num(i * fs, 0)).join(", ")}, … and ${num(f, 3)} is nearest to ${num(k * fs, 0)}:`,
        D(`f_{alias} = |${num(f, 3)} - ${num(k * fs, 0)}| = ${num(fa, 3)}\\text{ kHz}`),
        `<b>${num(fa, 3)} kHz</b>, and it is inside 0 to ${num(fs / 2, 2)} kHz as it must be. <b>Nothing in the recorded data marks it as false</b> — it is indistinguishable from a real ${num(fa, 3)} kHz tone, and so is every other input at ${num(fs, 0)}k ± ${num(fa, 3)} kHz.`,
      ],
    };
  },
});

defineProblem("alias-concept", {
  topic: "What aliasing costs",
  lookup: "Electrical → Signal Processing → Anti-aliasing filter",
  make(rng) {
    const mode = rng.pick(["fix", "fix", "where", "guard"]);

    if (mode === "fix") {
      return {
        stem: `A data acquisition system is aliasing: components above f<sub>s</sub>/2 are appearing as false low-frequency signals. Which change actually fixes it?`,
        choices: options(
          { text: "an analog low-pass filter placed before the converter", why: "" },
          [
            { text: "a digital low-pass filter applied to the samples", why: `Too late. Once the fold has happened the stray component occupies the <b>same frequency</b> as real signal content, so a digital filter can only remove both together. <b>After sampling they are not two things any more.</b>` },
            { text: "increasing the converter's resolution from 12 to 16 bits", why: `More bits lower the <b>quantisation</b> floor, which is a different error entirely. Aliasing is not a precision problem — every sample can be exact to the last bit and still describe the wrong wave.` },
            { text: "averaging many samples to reduce the noise", why: `Averaging attacks random noise. An alias is <b>not random</b> — it is a stable, coherent sinusoid, and averaging preserves it perfectly.` },
          ]),
        answer: 0,
        steps: [
          `Aliasing is a <b>many-to-one</b> map: infinitely many input frequencies land on each output frequency, so the operation has no inverse.`,
          `That rules out everything applied <em>after</em> sampling — more bits, averaging, digital filtering. None of them can recover information that no longer exists in the data.`,
          `<b>An analog low-pass filter before the converter</b> is the only fix, because it is the last point at which the unwanted component and the wanted signal are still <b>separate things at separate frequencies</b>.`,
        ],
      };
    }

    if (mode === "guard") {
      const B = rng.pick([4, 15, 20, 22]);
      const fs = rng.pick([2.2, 2.5, 2.75]) * B;
      return {
        stem: `A signal band-limited to ${num(B, 0)} kHz is sampled at ${num(fs, 3)} kHz rather than the minimum ${num(2 * B, 0)} kHz. What does the extra rate buy?`,
        choices: options(
          { text: `room for the anti-alias filter to roll off, between ${num(B, 0)} and ${num(fs - B, 3)} kHz`, why: "" },
          [
            { text: "a higher signal-to-noise ratio from the extra bits", why: `Sampling faster does not add bits. Resolution is set by the converter's word length — that is Electronics Part 6, and it is a separate axis from rate.` },
            { text: `the ability to represent signals up to ${num(fs, 3)} kHz`, why: `The limit is still half the rate, ${num(fs / 2, 3)} kHz — and in any case the signal was band-limited to ${num(B, 0)} kHz before it arrived.` },
            { text: "nothing — any rate above the Nyquist rate is equivalent", why: `True of an <b>ideal</b> filter, which does not exist. A real filter needs a finite frequency span to fall from passband to stopband, and that span is exactly what the extra rate provides.` },
          ]),
        answer: 0,
        steps: [
          `At the minimum rate of ${num(2 * B, 0)} kHz the spectral copies would <b>touch</b> at ${num(B, 0)} kHz, leaving no gap at all.`,
          `Sampling at ${num(fs, 3)} kHz moves the nearest copy's lower edge up to ${D(`f_s - B = ${num(fs, 3)} - ${num(B, 0)} = ${num(fs - B, 3)}\\text{ kHz}`)}`,
          `<b>So the filter has from ${num(B, 0)} kHz to ${num(fs - B, 3)} kHz to get from passband to stopband</b> — a span of ${num(fs - 2 * B, 3)} kHz. That is the transition band, and buying it is the entire reason practical systems oversample.`,
          `It is why CDs use 44.1 kHz for a 20 kHz band instead of 40.0: <b>the guard band is cheaper than the filter would be without it.</b>`,
        ],
      };
    }

    /* --- an out-of-band tone landing inside the band of interest -------- */
    const fs = 8, band = 3.4, f = 5;
    return {
      stem: `A speech channel carrying content to ${num(band, 1)} kHz is sampled at ${num(fs, 0)} kHz. A ${num(f, 0)} kHz interferer reaches the converter. Why is this worse than an interferer at ${num(fs / 2 + 3.5, 1)} kHz would be?`,
      choices: options(
        { text: `it folds to ${num(aliasOf(f, fs), 0)} kHz, which is inside the speech band`, why: "" },
        [
          { text: "it is closer to the Nyquist frequency, so it folds more strongly", why: `Folding is not a matter of degree — a tone either aliases or it does not, and the alias keeps its full amplitude. <b>Distance past f<sub>s</sub>/2 changes where it lands, not how badly.</b>` },
          { text: `it is larger than f<sub>s</sub>/2 while the other is not`, why: `Both are above the ${num(fs / 2, 0)} kHz Nyquist frequency, so both alias. The difference is <em>where</em> each one lands.` },
          { text: "it is not worse; both are removed by the same filter", why: `The same anti-alias filter would indeed stop both. The question is what happens if one gets through, and these two do very different amounts of damage.` },
        ]),
      answer: 0,
      steps: [
        `Both tones are above the Nyquist frequency of ${num(fs / 2, 0)} kHz, so both fold. Where they land is the whole difference:`,
        D(`|${num(f, 0)} - ${num(fs, 0)}| = ${num(aliasOf(f, fs), 0)}\\text{ kHz}, \\qquad |${num(fs / 2 + 3.5, 1)} - ${num(fs, 0)}| = ${num(aliasOf(fs / 2 + 3.5, fs), 1)}\\text{ kHz}`),
        `${num(aliasOf(fs / 2 + 3.5, fs), 1)} kHz lands <b>above</b> the ${num(band, 1)} kHz speech band, where a digital filter can still remove it. <b>${num(aliasOf(f, fs), 0)} kHz lands inside it</b>, on top of real speech.`,
        `<b>An alias is only harmless if it lands somewhere you were going to discard anyway.</b> That is a matter of luck unless the anti-alias filter removes it first — which is the argument for the filter, stated in terms of consequence rather than principle.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "sampling",
    stem: "Minimum sampling rate for a signal band-limited to fmax?",
    tool: "Strictly more than 2·fmax — the Nyquist rate",
    because: "Equality leaves the spectral copies touching and the amplitude at fmax unrecoverable.",
  },
  {
    part: "sampling",
    stem: "Nyquist FREQUENCY — what is it, and whose property?",
    tool: "fs/2, a property of the sampler",
    because: "The Nyquist rate is 2·fmax and belongs to the signal. Exam questions swap the two on purpose.",
  },
  {
    part: "sampling",
    stem: "A tone above fs/2 gets through to the converter. Where does it appear?",
    tool: "At |f − k·fs| for the nearest k — always between 0 and fs/2",
    because: "If your answer exceeds fs/2 you subtracted the wrong multiple. That check catches nearly every slip.",
  },
  {
    part: "sampling",
    stem: "Can a digital filter remove an alias after sampling?",
    tool: "No — it occupies the same frequency as real signal",
    because: "Sampling maps many input frequencies onto one output frequency, and a many-to-one map has no inverse.",
  },
  {
    part: "sampling",
    stem: "Where does the anti-alias filter go?",
    tool: "Before the converter, always",
    because: "It is the last point at which the stray component and the wanted signal are still separate things.",
  },
  {
    part: "sampling",
    stem: "Why sample audio at 44.1 kHz rather than the 40 kHz Nyquist rate?",
    tool: "Guard band — a real filter needs room to roll off",
    because: "At exactly the Nyquist rate the copies touch and separating them would need infinitely steep sides.",
  },
  {
    part: "sampling",
    stem: "What does sampling do to a signal's spectrum?",
    tool: "Copies it to every multiple of fs",
    because: "Aliasing is those copies overlapping, which is the reason the threshold is exactly twice the bandwidth.",
  },
]);

/* ==========================================================================
   Part 3 — analog filters

   The exam's filter questions are overwhelmingly of three kinds: name the
   type from a circuit or a response, compute a corner frequency, and reason
   about what a cascade does. The distractors here are the 2π, the direction
   of the R/L and R/C dependence, and the assumption that responses multiply.
   ========================================================================== */

const FILTERS = {
  low: {
    label: "low-pass", series: "R", shunt: "C",
    across: "the capacitor",
    why: "at DC the capacitor is an open circuit so the full input reaches the output, and at high frequency it is a short to ground",
  },
  high: {
    label: "high-pass", series: "C", shunt: "R",
    across: "the resistor",
    why: "the capacitor is in the signal path, so it blocks DC entirely and its reactance falls as frequency rises",
  },
  band: {
    label: "band-pass", series: "L and C in series", shunt: "R",
    across: "the resistor",
    why: "series L and C are a short circuit at resonance and a large reactance either side of it",
  },
  notch: {
    label: "band-stop", series: "R", shunt: "L and C in series",
    across: "the LC branch",
    why: "the series LC pair shorts the output to ground at resonance and gets out of the way everywhere else",
  },
};

defineProblem("filter-type", {
  topic: "Identifying a filter",
  lookup: "Electrical → Signal Processing → Analog filters",
  make(rng) {
    const id = rng.pick(Object.keys(FILTERS));
    const F = FILTERS[id];
    const others = Object.keys(FILTERS).filter((k) => k !== id);
    const byCircuit = rng.pick([true, true, false]);

    if (byCircuit) {
      return {
        stem: `A source drives ${F.series === "R" ? "a resistor" : F.series === "C" ? "a capacitor" : F.series} in series, followed by ${F.shunt === "R" ? "a resistor" : F.shunt === "C" ? "a capacitor" : F.shunt} to ground. The output is taken across ${F.across}. What kind of filter is this?`,
        choices: options(
          { text: F.label, why: "" },
          others.map((k) => ({
            text: FILTERS[k].label,
            why: `A ${FILTERS[k].label} needs ${FILTERS[k].series} in series and ${FILTERS[k].shunt} shunting the output. Here the series element is ${F.series} and the shunt is ${F.shunt}.`,
          }))),
        answer: 0,
        steps: [
          `Work it out at the two extremes rather than recalling a picture.`,
          `Here ${F.why}.`,
          `<b>${F.label[0].toUpperCase() + F.label.slice(1)}.</b> The general rule: <b>a capacitor's reactance falls with frequency and an inductor's rises</b>, so whichever component is in the signal path decides what gets through, and whichever shunts to ground decides what gets thrown away.`,
        ],
      };
    }

    const dcGain = id === "low" || id === "notch" ? "unity" : "zero";
    const hfGain = id === "high" || id === "notch" ? "unity" : "zero";
    return {
      stem: `A filter's magnitude response is <b>${dcGain}</b> at DC and <b>${hfGain}</b> at very high frequency${id === "notch" ? ", with a sharp null in between" : id === "band" ? ", peaking at one frequency in between" : ""}. Which type is it?`,
      choices: options(
        { text: F.label, why: "" },
        others.map((k) => ({
          text: FILTERS[k].label,
          why: `A ${FILTERS[k].label} is ${k === "low" || k === "notch" ? "unity" : "zero"} at DC and ${k === "high" || k === "notch" ? "unity" : "zero"} at high frequency, which does not match.`,
        }))),
      answer: 0,
      steps: [
        `<b>Check the two ends first — they separate all four types.</b>`,
        `Unity at DC and zero at high frequency is low-pass; zero then unity is high-pass; zero at both ends is band-pass; unity at both ends with a null between is band-stop.`,
        `<b>${F.label[0].toUpperCase() + F.label.slice(1)}.</b>`,
      ],
    };
  },
});

defineProblem("rc-corner", {
  topic: "Corner frequency",
  lookup: "Electrical → Signal Processing → RC and RL corner frequency",
  make(rng) {
    const kind = rng.pick(["rc", "rc", "rl", "solve"]);

    if (kind === "rc" || kind === "rl") {
      const R = rng.pick([1, 2.2, 4.7, 10, 22]) * 1000;
      const isRC = kind === "rc";
      const C = rng.pick([1, 2.2, 4.7, 10, 47]) * 1e-9;
      const L = rng.pick([1, 2.2, 4.7, 10, 47]) * 1e-3;
      const fc = isRC ? 1 / (2 * Math.PI * R * C) : R / (2 * Math.PI * L);
      const wc = isRC ? 1 / (R * C) : R / L;
      const part = isRC ? `${sig(C * 1e9, 3)} nF capacitor` : `${sig(L * 1e3, 3)} mH inductor`;
      return {
        stem: `A first-order low-pass filter uses a ${sig(R / 1000, 3)} kΩ resistor and a ${part}. What is its −3 dB frequency in hertz?`,
        choices: options(
          { text: `${sig(fc, 3)} Hz`, why: "" },
          [
            { text: `${sig(wc, 3)} Hz`, why: `That is ω<sub>c</sub> in <b>radians per second</b>, not hertz. Divide by 2π — the factor is ${sig(2 * Math.PI, 3)}, so this answer is about 6.3 times too large.` },
            { text: `${sig(fc * 2 * Math.PI * 2 * Math.PI, 3)} Hz`, why: `Multiplied by 2π where you should have divided. Check the units: RC has units of seconds, so 1/RC is <b>radians</b> per second and f = 1/2πRC.` },
            /* The fully inverted form (L/2πR or RC/2π) lands around 10⁻⁷ Hz
               and is dismissed on magnitude alone, so it tests nothing. The
               unit slip is the error people actually make and it stays
               within arguing distance of the answer. */
            isRC
              ? { text: `${sig(fc * 1000, 3)} Hz`, why: `R was used in <b>kilohms</b> rather than ohms, so the answer is a thousand times too high. Both R and C have to be in base units before the formula means anything.` }
              : { text: `${sig(fc / 1000, 3)} Hz`, why: `L was left in <b>millihenries</b>. Converting to henries divides L by a thousand, which multiplies the corner by a thousand.` },
          ]),
        answer: 0,
        steps: [
          isRC
            ? D(`f_c = \\frac{1}{2\\pi RC} = \\frac{1}{2\\pi(${sig(R, 4)})(${sig(C, 3)})}`)
            : D(`f_c = \\frac{R}{2\\pi L} = \\frac{${sig(R, 4)}}{2\\pi(${sig(L, 3)})}`),
          `<b>${sig(fc, 3)} Hz</b>, or ${sig(wc, 4)} rad/s if you want ω.`,
          `The corner is where the reactance equals the resistance — ${isRC ? "|1/jωC| = R" : "|jωL| = R"} — which is the whole derivation and is worth reconstructing rather than memorising. <b>The 2π is the only thing that reliably goes wrong here</b>: it is absent from ω and present in f.`,
        ],
      };
    }

    /* --- pick the component to hit a stated corner ---------------------- */
    const fc = rng.pick([100, 1000, 3400, 10000, 20000]);
    const R = rng.pick([1, 2.2, 4.7, 10]) * 1000;
    const C = 1 / (2 * Math.PI * R * fc);
    return {
      stem: `An anti-alias low-pass filter must have its −3 dB point at ${sig(fc, 3)} Hz. Using a ${sig(R / 1000, 3)} kΩ resistor, what capacitor is needed?`,
      choices: options(
        { text: `${sig(C * 1e9, 3)} nF`, why: "" },
        [
          /* C·2π is exactly 1/(R·fc), so "dropped the 2π" and "no 2π at all"
             are the same number — only one of them can be offered. */
          { text: `${sig(C * 1e9 * 2 * Math.PI, 3)} nF`, why: `The 2π was dropped: this is 1/(R f<sub>c</sub>). From f<sub>c</sub> = 1/2πRC the rearrangement is C = 1/(2πR f<sub>c</sub>), and the 2π stays in the <b>denominator</b>.` },
          { text: `${sig(C * 1e9 / (2 * Math.PI), 4)} nF`, why: `Divided by 2π once too often. Rearranging f<sub>c</sub> = 1/2πRC gives exactly one factor of 2π, not two.` },
          { text: `${sig(C * 1e12, 3)} nF`, why: `R was used in <b>kilohms</b> without converting, so the answer is a thousand times too large. Substitute back and check: this value would put the corner at ${sig(fc / 1000, 4)} Hz.` },
        ]),
      answer: 0,
      steps: [
        `Rearrange for C: ${D(`C = \\frac{1}{2\\pi R f_c} = \\frac{1}{2\\pi(${sig(R, 4)})(${sig(fc, 4)})}`)}`,
        `<b>${sig(C * 1e9, 3)} nF.</b> In practice you would fit the nearest standard value and accept the shift — a 5% capacitor moves the corner by 5%, which for an anti-alias filter is entirely acceptable because the guard band absorbs it.`,
        `<b>Always substitute back.</b> One multiplication by 2π instead of a division is a factor of 40 in the answer, and it is by far the most common error in this calculation.`,
      ],
    };
  },
});

defineProblem("filter-loading", {
  topic: "Cascading filter sections",
  lookup: "Electrical → Signal Processing → Filter order and cascading",
  make(rng) {
    const mode = rng.pick(["why", "slope", "why"]);

    if (mode === "slope") {
      /* n = 2 is excluded: at two poles the "one pole only" and "used 10 log"
         distractors collide (20·dec = 10·n·dec), and dedupe would silently
         leave three choices. */
      const n = rng.int(3, 4);
      const fc = rng.pick([1, 2, 10]) * 1000;
      const dec = rng.pick([1, 2]);
      const att = 20 * n * dec;
      return {
        stem: `A ${n}-pole low-pass filter has its corner at ${sig(fc / 1000, 3)} kHz. Roughly how much attenuation does it give ${dec === 1 ? "one decade" : "two decades"} above the corner, at ${sig(fc * Math.pow(10, dec) / 1000, 4)} kHz?`,
        choices: options(
          { text: `about ${num(att, 0)} dB`, why: "" },
          [
            { text: `about ${num(20 * dec, 0)} dB`, why: `That is one pole's worth. <b>Each pole contributes 20 dB per decade</b>, and there are ${n} of them, so they add to ${num(20 * n, 0)} dB per decade.` },
            { text: `about ${num(6 * n * dec, 0)} dB`, why: `6 dB per <b>octave</b> per pole is the same slope quoted differently — an octave is a factor of two, not ten. Per decade it is 20 dB per pole.` },
            { text: `about ${num(10 * n * dec, 0)} dB`, why: `10 log was used where a <b>voltage</b> ratio needs 20 log. The 10 log form is for power ratios, and mixing them halves every answer.` },
          ]),
        answer: 0,
        steps: [
          `Far above the corner every pole contributes <b>20 dB per decade</b>, and they add:`,
          D(`20n \\times \\text{decades} = 20(${n})(${dec}) = ${num(att, 0)}\\text{ dB}`),
          `<b>About ${num(att, 0)} dB.</b> The word &ldquo;roughly&rdquo; matters — this is the <em>asymptotic</em> slope, and close to the corner the real response is above it. One decade out the straight-line estimate is already good to about a decibel.`,
          `Equivalently <b>6 dB per octave per pole</b>: same slope, different unit. Mixing the two is the usual error, and the giveaway is a factor of about 3.3.`,
        ],
      };
    }

    return {
      stem: `Two identical RC low-pass sections, each with corner f<sub>c</sub>, are wired directly one after the other. How does the combination's −3 dB frequency compare with the f<sub>c</sub> of a single section?`,
      choices: options(
        { text: "well below fc — about 0.37 fc", why: "" },
        [
          { text: "exactly fc, since both sections have the same corner", why: `At f<sub>c</sub> each section is already down 3 dB, so together they are down 6 dB. <b>The pair's −3 dB point must therefore be lower</b> than either section's.` },
          { text: "about 0.64 fc, the square of one section's response", why: `That is the answer for two sections <b>separated by a buffer</b>. Wired directly, the second section loads the first and the corner falls further still, to about 0.37 f<sub>c</sub>.` },
          { text: "above fc, because two filters pass more", why: `Cascading can only ever remove more signal. <b>Each stage multiplies the one before by a number no greater than one</b>, so the response falls everywhere.` },
        ]),
      answer: 0,
      steps: [
        `Two effects push the corner down, and both are easy to miss.`,
        `<b>First, stacking alone moves it.</b> Even with an ideal buffer between them, at f<sub>c</sub> each section gives −3 dB so the pair gives −6 dB; the pair's own −3 dB point sits at ${T("\\sqrt{\\sqrt2-1}")} = 0.644 f<sub>c</sub>.`,
        `<b>Second, loading moves it further.</b> Wired directly the second section draws current through the first, so the transfer function is 1/(1 + 3ju − u²) rather than 1/(1 + ju)² — <b>a 3 where you expected a 2</b> — and the corner drops to 0.374 f<sub>c</sub>.`,
        `<b>About 0.37 f<sub>c</sub>, a factor of 1.72 below the buffered answer.</b> This is why active filters use op-amps between stages: not for gain, but so that the stages actually multiply.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "analog-filters",
    stem: "Series R, shunt C, output across the capacitor. What is it?",
    tool: "Low-pass — the capacitor shorts the output at high frequency",
    because: "Reason from the two extremes rather than recalling a picture; it takes five seconds and never misremembers.",
  },
  {
    part: "analog-filters",
    stem: "Corner frequency of an RC section, in hertz?",
    tool: "fc = 1/(2πRC) — and ωc = 1/RC with no 2π",
    because: "Getting the 2π backwards is a factor of 40, and it is the most common slip in the whole topic.",
  },
  {
    part: "analog-filters",
    stem: "Corner frequency of an RL section?",
    tool: "fc = R/(2πL) — R on top this time",
    because: "A bigger inductor lowers the corner, but a bigger resistor raises it: the dependence inverts relative to RC.",
  },
  {
    part: "analog-filters",
    stem: "Roll-off of an n-pole filter, well past the corner?",
    tool: "20n dB/decade, equivalently 6n dB/octave",
    because: "Mixing decades and octaves gives an answer wrong by about 3.3.",
  },
  {
    part: "analog-filters",
    stem: "Band-pass centre frequency from its two half-power edges?",
    tool: "f₀ = √(f₁f₂) — the geometric mean, not the average",
    because: "The edges are symmetric about f₀ on a logarithmic axis, which is the axis a Bode plot uses.",
  },
  {
    part: "analog-filters",
    stem: "Do two cascaded passive RC sections give the square of one response?",
    tool: "No — the second loads the first, giving 1/(1 + 3ju − u²)",
    because: "The 3 instead of 2 drops the corner to 0.37 fc, a factor of 1.72 below the naive answer.",
  },
  {
    part: "analog-filters",
    stem: "What is the op-amp in an active filter mainly for?",
    tool: "Isolation between stages, so their responses really do multiply",
    because: "Gain is often incidental; the buffering is what makes cascade design predictable.",
  },
]);

/* ==========================================================================
   Part 4 — order, roll-off and Butterworth

   The examinable core is the order formula and the decade/octave distinction.
   `order-needed` runs the formula forwards, `butter-response` evaluates a
   given order, and `family-pick` is the recognition question the exam asks
   about Chebyshev and Bessel — which is never deeper than one property each.
   ========================================================================== */

defineProblem("order-needed", {
  topic: "Filter order from a specification",
  lookup: "Electrical → Signal Processing → Butterworth filter order",
  make(rng) {
    const fc = rng.pick([1, 2, 3.4, 5, 10, 20]);
    const ratio = rng.pick([1.5, 2, 2.5, 3, 4, 5]);
    const fstop = fc * ratio;
    const A = rng.pick([20, 30, 40, 50, 60]);
    const exact = orderFor(A, ratio);
    const n = Math.max(1, Math.ceil(exact - 1e-9));
    /* The asymptotic estimate A/(20 log ratio) is NOT a usable distractor:
       10^(A/10) − 1 ≈ 10^(A/10) for any realistic A, so it rounds to n itself
       and dedupe would quietly drop it. The wrong answers below are the ones
       that actually differ. */
    const cands = [
      { v: n - 1, why: `One short. The formula gives ${fixed(exact, 2)}, and order is an integer you must <b>round up</b> — ${n - 1} pole${n - 1 === 1 ? "" : "s"} deliver${n - 1 === 1 ? "s" : ""} only ${fixed(-dB(butterworth(Math.max(1, n - 1), ratio)), 1)} dB, which misses the specification.` },
      { v: Math.round(A / 20), why: `That is the attenuation divided by 20, which would be right only if the stopband were a <b>full decade</b> away. Here it is ${fixed(Math.log10(ratio), 3)} of a decade, so each pole buys only ${fixed(20 * Math.log10(ratio), 1)} dB.` },
      { v: Math.ceil(exact / 2), why: `Half the required order — this is what you get using <b>10 log</b> where a voltage ratio needs 20 log. The 10 log form is for power ratios.` },
      { v: n + 2, why: `More than needed. ${n} poles already give ${fixed(-dB(butterworth(n, ratio)), 1)} dB at ${num(fstop, 3)} kHz, and every extra pole is a real component cost.` },
      { v: n + 1, why: `One more than necessary. ${n} poles already clear the specification, by ${fixed(-dB(butterworth(n, ratio)) - A, 1)} dB.` },
    ];
    const seen = new Set([n]);
    const wrong = [];
    for (const c of cands) {
      if (c.v < 1 || seen.has(c.v)) continue;
      seen.add(c.v);
      wrong.push({ text: `${c.v}`, why: c.why });
    }
    return {
      stem: `A Butterworth low-pass filter has its passband edge at ${num(fc, 2)} kHz and must be at least ${num(A, 0)} dB down by ${num(fstop, 3)} kHz. What is the minimum order?`,
      choices: options({ text: `${n}`, why: "" }, wrong),
      answer: 0,
      steps: [
        `<b>Only the ratio matters</b>, so start there: ${D(`\\frac{f_{stop}}{f_c} = \\frac{${num(fstop, 3)}}{${num(fc, 2)}} = ${fixed(ratio, 2)}`)}`,
        D(`n \\ge \\frac{\\log_{10}\\left(10^{${num(A, 0)}/10} - 1\\right)}{2\\log_{10}(${fixed(ratio, 2)})} = ${fixed(exact, 3)}`),
        `<b>Round up: ${n} pole${n === 1 ? "" : "s"}.</b> Checking, ${n} poles give ${fixed(-dB(butterworth(n, ratio)), 1)} dB at the stopband edge, clearing the ${num(A, 0)} dB requirement by ${fixed(-dB(butterworth(n, ratio)) - A, 1)} dB.`,
        `Note how sensitive this is to the ratio. <b>Each pole is worth ${fixed(20 * Math.log10(ratio), 1)} dB here</b>, because a pole gives 20 dB per decade and ${fixed(ratio, 2)}× is only ${fixed(Math.log10(ratio), 3)} of a decade. Widening the transition band is nearly always cheaper than adding poles.`,
      ],
    };
  },
});

defineProblem("butter-response", {
  topic: "Butterworth attenuation",
  lookup: "Electrical → Signal Processing → Butterworth magnitude response",
  make(rng) {
    const ask = rng.pick(["atten", "atten", "cutoff"]);
    const n = rng.int(2, 5);

    if (ask === "cutoff") {
      const fc = rng.pick([1, 2, 5, 10]);
      return {
        stem: `A ${n}-pole Butterworth low-pass filter has f<sub>c</sub> = ${num(fc, 0)} kHz. What is its gain at exactly ${num(fc, 0)} kHz?`,
        choices: options(
          { text: "−3.01 dB", why: "" },
          [
            { text: `${fixed(-3.01 * n, 2)} dB`, why: `The −3 dB was multiplied by the order. <b>It is not per pole</b> — the Butterworth magnitude at f = f<sub>c</sub> is 1/√(1+1) = 1/√2 for <em>every</em> order, which is the family's defining property.` },
            { text: "0 dB", why: `That is the passband gain well below the cutoff. The cutoff is <b>defined</b> as the point where the response has fallen to −3 dB.` },
            { text: `${num(-20 * n, 0)} dB`, why: `That is the asymptotic slope in dB per decade, not a gain at a frequency — and it applies a decade out, not at the corner.` },
          ]),
        answer: 0,
        steps: [
          D(`|H| = \\frac{1}{\\sqrt{1 + (f/f_c)^{2n}}}`),
          `At f = f<sub>c</sub> the ratio is 1, so ${D(`|H| = \\frac{1}{\\sqrt{1 + 1^{2n}}} = \\frac{1}{\\sqrt2}`)}`,
          `<b>−3.01 dB, for every order.</b> The 2n exponent applies to a ratio of 1, and 1 to any power is 1 — so the order simply drops out. <b>This is exactly why Butterworth is the default family</b>: f<sub>c</sub> means one thing no matter how many poles you use.`,
        ],
      };
    }

    /* ratio 2 and n = 2 are both excluded: at n = 2 the "used 10 log"
       distractor equals the "one pole only" one, and at ratio 2 all four
       values bunch inside a couple of decibels. */
    const ratio = rng.pick([3, 4, 5, 10]);
    const fc = rng.pick([1, 2, 10]);
    const a = -dB(butterworth(n, ratio));
    const asym = 20 * n * Math.log10(ratio);
    return {
      stem: `A ${n}-pole Butterworth low-pass filter has f<sub>c</sub> = ${num(fc, 0)} kHz. How far down is it at ${num(fc * ratio, 0)} kHz?`,
      choices: options(
        { text: `${fixed(a, 1)} dB`, why: "" },
        [
          { text: `${fixed(20 * Math.log10(ratio), 1)} dB`, why: `That is <b>one</b> pole's worth. All ${n} poles contribute, so multiply by the order.` },
          /* 6 dB/octave and 20 dB/decade are the SAME slope, so converting
             octaves correctly reproduces the answer. The real error is
             carrying the octave constant into a decade count. */
          { text: `${fixed(6 * n * Math.log10(ratio), 1)} dB`, why: `The <b>6 dB</b> figure was used with <b>decades</b>. 6 dB per octave and 20 dB per decade are the same slope in different units — pair 6 with octaves (${fixed(Math.log2(ratio), 2)} of them here) or 20 with decades (${fixed(Math.log10(ratio), 3)}), never one with the other.` },
          { text: `${fixed(10 * n * Math.log10(ratio), 1)} dB`, why: `10 log was used where a voltage ratio needs <b>20 log</b>. The 10 log form is for power ratios.` },
        ],
        [{ text: `${fixed(asym + 6, 1)} dB`, why: `Somewhat more than the response actually delivers — check against the asymptote of ${fixed(asym, 1)} dB.` }]),
      answer: 0,
      steps: [
        D(`|H| = \\frac{1}{\\sqrt{1 + (${num(ratio, 0)})^{${2 * n}}}}`),
        `In decibels that is ${D(`-10\\log_{10}\\left(1 + ${num(ratio, 0)}^{${2 * n}}\\right) = ${fixed(-a, 2)}\\text{ dB}`)}`,
        `<b>${fixed(a, 1)} dB down.</b> The straight-line estimate ${num(20 * n, 0)} dB/decade × ${fixed(Math.log10(ratio), 3)} decades gives ${fixed(asym, 1)} dB, which is ${Math.abs(asym - a) < 0.3 ? "essentially the same — this far out the asymptote is exact enough" : `${fixed(Math.abs(asym - a), 1)} dB optimistic, because the +1 under the root still matters this close to the corner`}.`,
      ],
    };
  },
});

defineProblem("family-pick", {
  topic: "Choosing a filter family",
  lookup: "Electrical → Signal Processing → Filter approximations",
  make(rng) {
    const want = rng.pick(["flat", "sharp", "phase"]);
    const CH = {
      flat: {
        right: { text: "Butterworth", why: "" },
        stem: "the passband must be as flat as possible, with no ripple",
        steps: [
          `<b>Butterworth</b> is defined by maximal flatness — it is the family that spends everything it has on a smooth passband.`,
          `Chebyshev deliberately allows ripple in exchange for a steeper skirt, and Bessel optimises phase rather than magnitude.`,
        ],
      },
      sharp: {
        right: { text: "Chebyshev", why: "" },
        stem: "the transition from passband to stopband must be as steep as possible for a given number of poles, and some passband ripple is acceptable",
        steps: [
          `<b>Chebyshev</b> reaches a given attenuation with fewer poles than Butterworth. That is not free — the ripple in the passband is exactly what has been traded for the steepness.`,
          `Butterworth is flatter but gentler; Bessel is gentler still.`,
        ],
      },
      phase: {
        right: { text: "Bessel", why: "" },
        stem: "a pulse must pass through with its shape intact",
        steps: [
          `Waveform shape is a <b>phase</b> requirement, not a magnitude one. A pulse is a sum of harmonics, and it keeps its shape only if every harmonic is delayed by the <b>same time</b> — which means phase must be linear in frequency.`,
          `<b>Bessel</b> is the family that optimises for linear phase. It pays for it with the gentlest skirt of the three.`,
        ],
      },
    }[want];
    const WHY = {
      Butterworth: "Butterworth is maximally flat, but for a given order it is not the steepest and its phase is not linear.",
      Chebyshev: "Chebyshev is the steepest for a given order, but it ripples in the passband and its phase is the worst of the three.",
      Bessel: "Bessel gives linear phase and so preserves pulse shape, but it has the gentlest skirt of the three.",
      elliptic: "An elliptic (Cauer) filter is steeper still, but it ripples in <b>both</b> the passband and the stopband — more trade, not less.",
    };
    const wrong = ["Butterworth", "Chebyshev", "Bessel", "elliptic"]
      .filter((k) => k !== CH.right.text)
      .map((k) => ({ text: k, why: WHY[k] }));
    return {
      stem: `A filter is being specified where <b>${CH.stem}</b>. Which family fits best?`,
      choices: options(CH.right, wrong),
      answer: 0,
      steps: [
        ...CH.steps,
        `<b>${CH.right.text}.</b> The families are one trade seen from three sides: <b>flatness, steepness and phase, pick two</b>. Knowing which one each family sacrifices is the whole of what this topic asks.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "filter-order",
    stem: "Roll-off of an n-pole filter, in both units?",
    tool: "20n dB/decade = 6n dB/octave",
    because: "A decade is ×10 and an octave is ×2; confusing them is a factor of about 3.3.",
  },
  {
    part: "filter-order",
    stem: "Gain of an n-pole Butterworth at exactly its cutoff?",
    tool: "−3.01 dB, for every order",
    because: "At f = fc the ratio is 1 and 1 to any power is 1, so the order drops out. It is the family's defining property.",
  },
  {
    part: "filter-order",
    stem: "What decides the order a specification needs?",
    tool: "The ratio of the band edges and the attenuation — never the absolute frequencies",
    because: "n ≥ log(10^(A/10) − 1) / 2log(fstop/fc), and you always round up.",
  },
  {
    part: "filter-order",
    stem: "Steepest skirt for a given order — which family?",
    tool: "Chebyshev, paid for with passband ripple",
    because: "Butterworth is flat but gentler; the ripple is precisely what buys the steepness.",
  },
  {
    part: "filter-order",
    stem: "A pulse must keep its shape through a filter. Which family?",
    tool: "Bessel — linear phase, so every harmonic is delayed equally",
    because: "Shape is a phase requirement, not a magnitude one, and Bessel pays for it with the gentlest skirt.",
  },
  {
    part: "filter-order",
    stem: "Anti-alias filter needs 40 dB over a narrow transition band. Cheapest fix?",
    tool: "Sample faster — widening the transition band collapses the order",
    because: "Rate costs memory and arithmetic; poles cost precision components that drift.",
  },
  {
    part: "filter-order",
    stem: "Damping ratio of a second-order Butterworth section?",
    tool: "ζ = 0.707 — exactly where peaking stops",
    because: "Below it the response bulges: at ζ = 0.6 the peak is +0.35 dB, which is what flatness gives up steepness to avoid.",
  },
]);

/* ==========================================================================
   Part 5 — digital filters and difference equations

   Three things the exam asks: run a difference equation forward by hand,
   classify a filter as FIR or IIR and say what follows from that, and
   convolve two short sequences. The distractors are sign errors on the
   feedback term, the assumption that feedback means instability, and
   dropping a term in the convolution sum.
   ========================================================================== */

defineProblem("run-difference", {
  topic: "Running a difference equation",
  lookup: "Electrical → Signal Processing → Difference equations",
  make(rng) {
    const ask = rng.pick(["step", "gain", "gain"]);

    /* --- DC gain by inspection ------------------------------------------ */
    if (ask === "gain") {
      const iir = rng.chance(0.6);
      const b = iir ? [rng.pick([0.1, 0.2, 0.25, 0.5])] : [];
      const a1 = iir ? -(1 - b[0]) : 0;
      const bs = iir ? b : rng.pick([[0.25, 0.25, 0.25, 0.25], [0.5, 0.5], [0.2, 0.2, 0.2, 0.2, 0.2]]);
      const sumB = bs.reduce((s, v) => s + v, 0);
      const dc = iir ? sumB / (1 + a1) : sumB;
      const eq = iir
        ? `y[n] = ${fixed(-a1, 2)}·y[n−1] + ${fixed(bs[0], 2)}·x[n]`
        : `y[n] = ${bs.map((v, i) => `${fixed(v, 2)}·x[n${i ? `−${i}` : ""}]`).join(" + ")}`;
      return {
        stem: `A digital filter is defined by <b>${eq}</b>. What is its DC gain — the output for a constant input of 1?`,
        choices: options(
          { text: fixed(dc, 3), why: "" },
          [
            { text: fixed(sumB, 3), why: iir
                ? `Only the numerator was summed. <b>The feedback term contributes too</b> — with a constant input the output is also constant, so y = ${fixed(bs[0], 2)} + ${fixed(-a1, 2)}y, which rearranges to y = ${fixed(bs[0], 2)}/(1 − ${fixed(-a1, 2)}).`
                : `Check the arithmetic — the coefficients sum to ${fixed(sumB, 3)}, and with no feedback that <em>is</em> the DC gain.` },
            { text: fixed(iir ? sumB / (1 - a1) : sumB / bs.length, 3), why: iir
                ? `Sign error on the feedback term. In the standard form y[n] = Σb·x − Σa·y, a coefficient written as <b>+0.8·y[n−1]</b> in the equation means a₁ = −0.8, so the denominator is 1 − 0.8, not 1 + 0.8.`
                : `Divided by the number of taps a second time — the coefficients are <b>already</b> 1/L each, so they sum to 1.` },
            { text: fixed(dc * 2, 3), why: `Twice the right answer. Substitute a constant back into the equation and solve for y; there is no factor of two anywhere in it.` },
            { text: "0", why: `A constant input gives a constant output for any stable filter with a non-zero coefficient sum. Zero would mean the filter blocks DC entirely, which needs the coefficients to cancel.` },
          ]),
        answer: 0,
        steps: [
          `<b>With a constant input, every delayed sample is the same number</b>, so the delays stop mattering and the equation becomes ordinary algebra.`,
          iir
            ? `Put x[n] = 1 and y[n] = y[n−1] = y: ${D(`y = ${fixed(-a1, 2)}y + ${fixed(bs[0], 2)} \\ \\Rightarrow \\ y(1 - ${fixed(-a1, 2)}) = ${fixed(bs[0], 2)}`)}`
            : `Put x = 1 everywhere: every term contributes its own coefficient.`,
          D(`H(1) = \\frac{\\sum b_k}{1 + \\sum a_k} = \\frac{${fixed(sumB, 3)}}{${fixed(1 + a1, 3)}} = ${fixed(dc, 3)}`),
          `<b>${fixed(dc, 3)}.</b> A gain of 1 is what a smoothing filter should have — <b>it must not change the level it is smoothing</b>, and this is the five-second check that it does not.`,
        ],
      };
    }

    /* --- run it forward a few samples -----------------------------------
       a = 0.5 is excluded: it converges so fast that by n = 4 consecutive
       outputs are 0.9375 and 0.9688, and the "off by one sample" distractor
       becomes indistinguishable from the answer. */
    const a = rng.pick([0.6, 0.7, 0.8]);
    const b0 = +(1 - a).toFixed(2);
    const x = [1, 1, 1, 1, 1];
    const y = runFilter([b0], [1, -a], x);
    const nAsk = rng.int(2, 4);
    /* the classic sign slip: subtracting the feedback instead of adding it */
    const wrongSign = runFilter([b0], [1, a], x);
    return {
      stem: `A filter obeys <b>y[n] = ${fixed(a, 2)}·y[n−1] + ${fixed(b0, 2)}·x[n]</b> and is initially at rest. A unit step is applied at n = 0. What is y[${nAsk}]?`,
      choices: options(
        { text: fixed(y[nAsk], 4), why: "" },
        [
          { text: fixed(wrongSign[nAsk], 4), why: `The feedback term was <b>subtracted</b> rather than added. The equation as written has +${fixed(a, 2)}·y[n−1]; the minus signs in the general form y = Σb·x − Σa·y are already absorbed when the equation is given this way.` },
          { text: fixed(y[nAsk - 1], 4), why: `That is y[${nAsk - 1}]. Count carefully: <b>y[0] is the first output</b>, computed from x[0] with y[−1] = 0.` },
          { text: fixed(b0, 4), why: `That is y[0] — the first output only. The filter has had ${nAsk} more samples to accumulate since then.` },
          { text: "1.0000", why: `That is the value the output is <em>heading for</em>, but it approaches it geometrically and never quite arrives. After ${nAsk + 1} samples it has reached ${fixed(y[nAsk], 3)}.` },
        ]),
      answer: 0,
      steps: [
        `<b>Initially at rest means y[−1] = 0.</b> Then step through, one line each:`,
        ...[0, 1, 2, 3, 4].slice(0, nAsk + 1).map((i) =>
          `y[${i}] = ${fixed(a, 2)}(${fixed(i === 0 ? 0 : y[i - 1], 4)}) + ${fixed(b0, 2)}(1) = <b>${fixed(y[i], 4)}</b>`),
        `<b>y[${nAsk}] = ${fixed(y[nAsk], 4)}.</b> Each step closes ${fixed(b0 * 100, 0)}% of the remaining gap to 1, which is exactly what a single feedback term does — <b>geometric approach, never arrival</b>.`,
      ],
    };
  },
});

defineProblem("fir-iir", {
  topic: "FIR versus IIR",
  lookup: "Electrical → Signal Processing → Digital filter structures",
  make(rng) {
    const q = rng.pick(["classify", "stable", "property"]);

    if (q === "classify") {
      const isFir = rng.chance(0.5);
      const eq = isFir
        ? "y[n] = 0.25·x[n] + 0.5·x[n−1] + 0.25·x[n−2]"
        : "y[n] = 0.7·y[n−1] + 0.3·x[n]";
      return {
        stem: `Classify the filter <b>${eq}</b>.`,
        choices: options(
          { text: isFir ? "FIR — finite impulse response" : "IIR — infinite impulse response", why: "" },
          [
            { text: isFir ? "IIR — infinite impulse response" : "FIR — finite impulse response",
              why: isFir
                ? `This equation refers only to <b>past inputs</b> (the x terms). With no output fed back there is nothing to sustain a response, so it ends after the last coefficient.`
                : `The y[n−1] term is a <b>past output</b>. That is feedback, and it makes the response go on for ever.` },
            { text: "neither — it is not a linear filter", why: `It is a weighted sum of samples with constant coefficients, which is the definition of a linear time-invariant filter.` },
            { text: "cannot tell without knowing the input", why: `FIR and IIR describe the <b>filter's structure</b>, not the signal. The classification is read straight off the equation.` },
          ]),
        answer: 0,
        steps: [
          `<b>Look for past outputs on the right-hand side.</b> That single question settles it.`,
          isFir
            ? `Here every term on the right is an <b>x</b> — a past input. No feedback, so the impulse response is just the three coefficients and then zero: <b>FIR</b>.`
            : `Here y[n−1] appears on the right. That is <b>feedback</b>: each output feeds the next, so the response decays geometrically but never reaches zero: <b>IIR</b>.`,
          `<b>${isFir ? "FIR" : "IIR"}.</b> ${isFir ? "It is therefore unconditionally stable, and if the coefficients are symmetric — as these are — it also has exactly linear phase." : "It is therefore far cheaper for a sharp response, and it needs a stability check that an FIR does not."}`,
        ],
      };
    }

    if (q === "stable") {
      return {
        stem: `Which statement about digital filter stability is correct?`,
        choices: options(
          { text: "an FIR filter is stable for any coefficients", why: "" },
          [
            { text: "an IIR filter is stable for any coefficients", why: `Not so — feedback is exactly what allows an output to grow itself. y[n] = 1.1·y[n−1] + x[n] diverges from a single impulse.` },
            { text: "stability depends on the input signal", why: `For a linear time-invariant filter it does not. <b>Stability is a property of the coefficients alone</b>; a bounded input either always gives a bounded output or does not.` },
            { text: "only filters with more than two taps can be unstable", why: `Tap count is irrelevant. A single feedback term is enough: y[n] = 2·y[n−1] + x[n] doubles every sample for ever.` },
          ]),
        answer: 0,
        steps: [
          `Instability means an output growing without bound from a bounded input, which requires a path from the output <b>back into</b> the filter.`,
          `<b>An FIR filter has no such path.</b> Its output is a finite weighted sum of finitely many inputs, so if the input is bounded the output is bounded — necessarily, whatever the coefficients are.`,
          `<b>An IIR filter does have one</b>, and whether it is stable depends on the feedback coefficients. Part 6 turns that into a geometric test: every pole inside the unit circle.`,
        ],
      };
    }

    return {
      stem: `A design needs <b>exactly linear phase</b>, so that a pulse passes through undistorted. Which structure guarantees it?`,
      choices: options(
        { text: "an FIR filter with symmetric coefficients", why: "" },
        [
          { text: "an IIR filter with enough poles", why: `An IIR filter cannot have exactly linear phase — the feedback that makes it efficient is also what makes its phase nonlinear. It can only be approximated.` },
          { text: "any FIR filter, symmetric or not", why: `Symmetry is what does it. An arbitrary FIR has a perfectly ordinary nonlinear phase; it is the <b>mirror symmetry of the coefficients</b> that forces every frequency to be delayed equally.` },
          { text: "any filter, provided the sample rate is high enough", why: `Sample rate does not change a filter's phase characteristic — the response is a function of frequency <em>relative to</em> the sample rate.` },
        ]),
      answer: 0,
      steps: [
        `Linear phase means every frequency is delayed by the <b>same time</b>, which is what leaves a pulse's shape intact.`,
        `<b>A symmetric FIR delays everything by exactly (L−1)/2 samples</b>, regardless of frequency — the symmetry forces it.`,
        `<b>No analog filter and no IIR filter can do this exactly</b>, which is one of the real advantages of filtering after the converter. Bessel filters, from Part 4, are the analog world straining to approximate it.`,
      ],
    };
  },
});

defineProblem("convolve", {
  topic: "Convolution",
  lookup: "Electrical → Signal Processing → Convolution",
  make(rng) {
    const h = rng.pick([[1, 2, 1], [1, 1, 1], [1, -1], [2, 1], [1, 0, -1]]);
    const x = rng.pick([[1, 3, 2], [2, 1, 4], [1, 2, 3], [3, 1]]);
    const L = x.length + h.length - 1;
    const y = new Array(L).fill(0);
    for (let i = 0; i < x.length; i++) for (let j = 0; j < h.length; j++) y[i + j] += x[i] * h[j];
    const ask = rng.pick(["seq", "len", "seq"]);
    const fmt = (v) => `{${v.join(", ")}}`;

    if (ask === "len") {
      /* This branch uses its own lengths rather than the drawn sequences:
         at 2 by 2 the "added" and "multiplied" distractors are both 4, and
         dedupe would leave three choices. Lx of 3 or more rules it out. */
      const Lx = rng.int(3, 6), Lh = rng.int(2, 5);
      const Ly = Lx + Lh - 1;
      return {
        stem: `A sequence of ${Lx} samples is convolved with a filter whose impulse response is ${Lh} samples long. How many samples long is the result?`,
        choices: options(
          { text: `${Ly}`, why: "" },
          [
            { text: `${Lx + Lh}`, why: `One too many. The two sequences <b>overlap by one sample</b> at each end, so the length is Lx + Lh − 1, not Lx + Lh.` },
            { text: `${Math.max(Lx, Lh)}`, why: `That is the longer of the two. Convolution <b>spreads</b> a signal — the output is longer than either input, which is why a filter smears an edge.` },
            { text: `${Lx * Lh}`, why: `Multiplied instead of added. There are that many products, but they <b>collect</b> into overlapping output positions.` },
          ]),
        answer: 0,
        steps: [
          D(`L_y = L_x + L_h - 1 = ${Lx} + ${Lh} - 1 = ${Ly}`),
          `<b>${Ly} samples.</b> Read it as: the first output needs only the first sample of each, the last needs only the last of each, and everything between overlaps.`,
          `This is why a filter <b>spreads</b> a transient. An impulse one sample wide comes out ${Lh} samples wide, and that spreading is the time-domain face of band-limiting.`,
        ],
      };
    }

    /* Several of these coincide for particular h — with h = {1,1,1} the
       "first coefficient only" and "term by term" errors both reproduce x
       exactly — so build candidates and keep the distinct ones rather than
       letting dedupe quietly shorten the list. */
    const rev = [...h].reverse();
    const corr = new Array(L).fill(0);
    for (let i = 0; i < x.length; i++) for (let j = 0; j < rev.length; j++) corr[i + j] += x[i] * rev[j];
    const key = (v) => v.join(",");
    const cands = [
      { v: y.slice(0, L - 1), why: `The last term was dropped. Check the length: it must be ${x.length} + ${h.length} − 1 = <b>${L}</b> samples, and this has only ${L - 1}.` },
      { v: x.map((c) => c * h[0]), why: `Each input was multiplied by the first coefficient only. <b>Every input sample sets off a whole copy of h</b>, scaled by that sample, and the copies overlap and add.` },
      { v: x.map((c, i) => c * (h[i] ?? 0)), why: `The two sequences were multiplied term by term. Convolution is not multiplication — it <b>slides</b> one past the other, summing products at each shift.` },
      { v: corr, why: `h was reversed before sliding. That is <b>correlation</b>, not convolution — and the two differ whenever h is not symmetric.` },
      { v: y.map((c) => c * 2), why: `Every term doubled. Check against the sum rule: the output must sum to ${x.reduce((s, c) => s + c, 0) * h.reduce((s, c) => s + c, 0)}, and this sums to twice that.` },
    ];
    const seenY = new Set([key(y)]);
    const wrongC = [];
    for (const c of cands) {
      if (seenY.has(key(c.v))) continue;
      seenY.add(key(c.v));
      wrongC.push({ text: fmt(c.v), why: c.why });
    }
    return {
      stem: `Convolve x = ${fmt(x)} with h = ${fmt(h)}.`,
      choices: options({ text: fmt(y), why: "" }, wrongC),
      answer: 0,
      steps: [
        `<b>Every input sample launches a scaled copy of h</b>, delayed to that sample's position, and the output is all the copies added up:`,
        ...x.map((v, i) => `x[${i}] = ${v} contributes ${fmt(h.map((c) => c * v))} starting at n = ${i}`),
        `Adding them column by column gives ${D(`y = ${fmt(y)}`)}`,
        `<b>Two checks before you move on.</b> The length is ${x.length} + ${h.length} − 1 = ${L} ✓, and the output sums to ${y.reduce((s, v) => s + v, 0)}, which must equal the product of the input sums, ${x.reduce((s, v) => s + v, 0)} × ${h.reduce((s, v) => s + v, 0)} = ${x.reduce((s, v) => s + v, 0) * h.reduce((s, v) => s + v, 0)} ✓. <b>If either fails you have dropped a term.</b>`,
      ],
    };
  },
});

defineReflex([
  {
    part: "digital-filters",
    stem: "How do you tell an FIR filter from an IIR one?",
    tool: "Look for past OUTPUTS on the right-hand side — y[n−k] means IIR",
    because: "That single question decides stability, cost, and whether exactly linear phase is available.",
  },
  {
    part: "digital-filters",
    stem: "Can an FIR filter be unstable?",
    tool: "No — never, for any coefficients",
    because: "With no feedback the output is a finite sum of bounded inputs, so it cannot grow itself.",
  },
  {
    part: "digital-filters",
    stem: "DC gain of a difference equation?",
    tool: "Σb / (1 + Σa) — set every delayed sample equal",
    because: "With a constant input the delays stop mattering and the equation becomes ordinary algebra.",
  },
  {
    part: "digital-filters",
    stem: "What is a filter's impulse response, for an FIR?",
    tool: "Literally its coefficient list, then zero",
    because: "One input of 1 walks each coefficient out in turn, which is why the response is finite.",
  },
  {
    part: "digital-filters",
    stem: "Length of the convolution of an Lx-sample signal with an Lh-tap filter?",
    tool: "Lx + Lh − 1",
    because: "It is the fastest check that you have not dropped a term in a hand convolution.",
  },
  {
    part: "digital-filters",
    stem: "Which structure gives exactly linear phase?",
    tool: "A symmetric FIR — delay is (L−1)/2 samples at every frequency",
    because: "No IIR and no analog filter can do it exactly; Bessel filters only approximate it.",
  },
  {
    part: "digital-filters",
    stem: "Where does an L-point moving average put its nulls?",
    tool: "At every multiple of fs/L",
    because: "It is a filter with real zeros, not merely an average — worth knowing before you pick L.",
  },
]);

/* ==========================================================================
   Part 6 — the z-transform and the unit circle

   Three questions the exam actually sets: read H(z) off a difference
   equation, decide stability from pole positions, and evaluate the response
   at a frequency — usually DC or Nyquist, which need no trigonometry at all.
   ========================================================================== */

defineProblem("hz-from-diff", {
  topic: "Transfer function from a difference equation",
  lookup: "Electrical → Signal Processing → Z-transform",
  make(rng) {
    /* |a1| = 0.5 is excluded: b0 = 1 − |a1| would then equal |a1|, and the
       "that is the numerator, not the pole" distractor becomes the answer. */
    const a1 = rng.pick([0.6, 0.7, 0.8, -0.6, -0.7]);
    const b0 = +(1 - Math.abs(a1)).toFixed(2);
    const sgn = a1 >= 0 ? "+" : "−";
    const A = Math.abs(a1);
    const ask = rng.pick(["hz", "hz", "pole"]);

    if (ask === "pole") {
      return {
        stem: `A filter obeys <b>y[n] = ${sgn === "+" ? "" : "−"}${fixed(A, 2)}·y[n−1] + ${fixed(b0, 2)}·x[n]</b>. Where is its pole, and is the filter stable?`,
        choices: options(
          { text: `z = ${fixed(a1, 2)}, stable`, why: "" },
          [
            { text: `z = ${fixed(-a1, 2)}, stable`, why: `Sign flipped. Writing the equation as Y = ${fixed(a1, 2)}z⁻¹Y + … gives a denominator of <b>1 − ${fixed(a1, 2)}z⁻¹</b>, so the pole is where z = ${fixed(a1, 2)}, matching the coefficient's own sign.` },
            { text: `z = ${fixed(1 / a1, 2)}, unstable`, why: `The reciprocal. That comes from reading the denominator as z − 1/${fixed(a1, 2)}; setting <b>1 − ${fixed(a1, 2)}z⁻¹ = 0</b> gives z = ${fixed(a1, 2)} directly.` },
            { text: `z = ${fixed(b0, 2)}, stable`, why: `That is the numerator coefficient, which sets a <b>zero</b> (here at the origin once written in positive powers of z), not a pole. Poles come from the feedback terms.` },
          ]),
        answer: 0,
        steps: [
          `Transform: ${D(`Y = ${fixed(a1, 2)}z^{-1}Y + ${fixed(b0, 2)}X \\ \\Rightarrow \\ H(z) = \\frac{${fixed(b0, 2)}}{1 - ${fixed(a1, 2)}z^{-1}}`)}`,
          `Multiply top and bottom by z: ${D(`H(z) = \\frac{${fixed(b0, 2)}z}{z - ${fixed(a1, 2)}}`)}`,
          `<b>The pole is at z = ${fixed(a1, 2)}</b>, and |${fixed(a1, 2)}| = ${fixed(A, 2)} &lt; 1, so it is inside the unit circle: <b>stable</b>.`,
          `<b>The sign of the pole matches the sign of the feedback coefficient.</b> A negative pole means the response alternates sign each sample — a high-frequency ring rather than a slow decay.`,
        ],
      };
    }

    return {
      stem: `Find H(z) for <b>y[n] = ${sgn === "+" ? "" : "−"}${fixed(A, 2)}·y[n−1] + ${fixed(b0, 2)}·x[n]</b>.`,
      choices: options(
        { tex: `H(z) = \\frac{${fixed(b0, 2)}}{1 - ${fixed(a1, 2)}z^{-1}}`, why: "" },
        [
          { tex: `H(z) = \\frac{${fixed(b0, 2)}}{1 + ${fixed(a1, 2)}z^{-1}}`, why: `Sign error. Moving ${fixed(a1, 2)}z⁻¹Y to the left-hand side gives Y(1 <b>−</b> ${fixed(a1, 2)}z⁻¹), so the denominator carries the opposite sign to the equation.` },
          { tex: `H(z) = ${fixed(b0, 2)}\\left(1 - ${fixed(a1, 2)}z^{-1}\\right)`, why: `The denominator was multiplied rather than divided. Feedback terms end up <b>underneath</b> — that is what makes them poles.` },
          { tex: `H(z) = \\frac{1 - ${fixed(a1, 2)}z^{-1}}{${fixed(b0, 2)}}`, why: `Upside down. H is output over input, so the numerator comes from the <b>x</b> terms.` },
        ]),
      answer: 0,
      steps: [
        `<b>Replace each delay by its power of z⁻¹</b> — that is the only step:`,
        D(`Y(z) = ${fixed(a1, 2)}z^{-1}Y(z) + ${fixed(b0, 2)}X(z)`),
        `Gather the Y terms on one side: ${D(`Y(z)\\left(1 - ${fixed(a1, 2)}z^{-1}\\right) = ${fixed(b0, 2)}X(z)`)}`,
        D(`H(z) = \\frac{Y}{X} = \\frac{${fixed(b0, 2)}}{1 - ${fixed(a1, 2)}z^{-1}}`),
        `<b>The b's go on top and the a's underneath</b>, with the sign of the a's flipped relative to how they appear in the equation. Check it at DC (z = 1): ${fixed(b0, 2)}/(1 − ${fixed(a1, 2)}) = ${fixed(b0 / (1 - a1), 3)}.`,
      ],
    };
  },
});

defineProblem("z-stability", {
  topic: "Stability in the z-plane",
  lookup: "Electrical → Signal Processing → Z-plane stability",
  make(rng) {
    const kind = rng.pick(["pair", "pair", "list", "fir"]);

    if (kind === "fir") {
      return {
        stem: `An FIR filter has the impulse response h = {1, −2, 3, −2, 1}. Is it stable?`,
        choices: options(
          { text: "yes — an FIR filter is always stable", why: "" },
          [
            { text: "no — the coefficients alternate in sign", why: `Sign alternation makes it a high-pass filter, not an unstable one. <b>Stability is about growth, and there is no mechanism here for growth</b> — the output is a finite sum of five bounded inputs.` },
            { text: "only if the coefficients sum to less than 1", why: `The coefficient sum is the DC gain, which here is 1. A gain above 1 is still perfectly stable — an amplifier is not an unstable device.` },
            { text: "cannot tell without knowing the sample rate", why: `Stability depends on the coefficients alone. The sample rate changes what frequencies the filter acts on, not whether its output stays bounded.` },
          ]),
        answer: 0,
        steps: [
          `Write it as a transfer function: ${D(`H(z) = 1 - 2z^{-1} + 3z^{-2} - 2z^{-3} + z^{-4}`)}`,
          `The denominator is <b>1</b>. Multiplying through by z⁴ puts every pole at <b>z = 0</b> — the centre of the unit circle, as far inside as it is possible to be.`,
          `<b>Always stable.</b> This is the z-plane's version of Part 5's argument: no feedback means no path for the output to grow itself.`,
        ],
      };
    }

    if (kind === "list") {
      const sets = [
        { p: "0.5, −0.8, 0.3", ok: true },
        { p: "0.9, 1.2", ok: false, bad: "1.2" },
        { p: "0.95, −0.99", ok: true },
        { p: "0.4, −1.05", ok: false, bad: "−1.05" },
        { p: "0.7, 1.0", ok: false, bad: "1.0" },
      ];
      const S = rng.pick(sets);
      return {
        stem: `A digital filter has poles at z = ${S.p}. Is it stable?`,
        choices: options(
          { text: S.ok ? "yes — every pole is inside the unit circle" : "no", why: "" },
          [
            { text: S.ok ? "no — one of the poles is outside" : "yes — every pole is inside the unit circle",
              why: S.ok
                ? `Check each magnitude against 1: all of these are below it, some only just. <b>Being close to the circle makes a filter ring for a long time, not unstable.</b>`
                : `The pole at ${S.bad} has magnitude ${Math.abs(parseFloat(S.bad)) >= 1 ? "at least" : "less than"} 1, so it is <b>${Math.abs(parseFloat(S.bad)) > 1 ? "outside" : "on"}</b> the circle. <b>One bad pole is enough.</b>` },
            { text: "only if the input is bounded", why: `Stability already means "bounded input gives bounded output". It is a property of the filter, and the poles settle it without reference to any signal.` },
            { text: "cannot tell without the zeros", why: `Zeros shape the response but cannot stabilise it. <b>A zero near a bad pole reduces its visibility, not its growth</b> — the growing term is still there.` },
          ]),
        answer: 0,
        steps: [
          `<b>The test is on magnitudes only:</b> every pole must satisfy |z| &lt; 1.`,
          S.ok
            ? `Each of ${S.p} has magnitude below 1, so every one is strictly inside the circle. <b>Stable.</b> Note that 0.95 and 0.99 are inside — very close to the edge means a long ringing response, which is a performance question, not a stability one.`
            : `The pole at <b>${S.bad}</b> has magnitude ${fixed(Math.abs(parseFloat(S.bad)), 2)}, which is not less than 1. <b>Unstable</b> (or marginally so, if it is exactly 1). It does not matter how far inside the others are — one is enough.`,
          `<b>Angles are irrelevant here.</b> The angle of a pole decides what frequency the filter rings at; only the radius decides whether the ringing dies.`,
        ],
      };
    }

    /* --- a conjugate pair given by radius and angle --------------------- */
    /* 90 degrees is excluded because cos 90 = 0 makes the middle coefficient
       zero, so the "wrong sign" distractor is literally the same filter. r = 1
       is excluded because r squared then equals r and the "r not r squared"
       distractor collides with the answer. */
    const r = rng.pick([0.6, 0.8, 0.9, 0.95, 1.1, 1.2]);
    const deg = rng.pick([30, 45, 53.13, 60, 120]);
    const th = deg / DEGP;
    const a = [1, -2 * r * Math.cos(th), r * r];
    const verdict = r < 1 ? "stable" : "unstable";
    return {
      stem: `A second-order filter has poles at <b>${fixed(r, 2)}∠±${num(deg, 2)}°</b>. Classify it, and give the denominator of H(z).`,
      choices: options(
        { text: `${verdict}; 1 ${a[1] < 0 ? "−" : "+"} ${fixed(Math.abs(a[1]), 3)}z⁻¹ + ${fixed(a[2], 3)}z⁻²`, why: "" },
        [
          { text: `${verdict}; 1 ${a[1] < 0 ? "+" : "−"} ${fixed(Math.abs(a[1]), 3)}z⁻¹ + ${fixed(a[2], 3)}z⁻²`, why: `Sign of the middle term. Expanding (1 − re^{jθ}z⁻¹)(1 − re^{−jθ}z⁻¹) gives <b>−2r cos θ</b> as the z⁻¹ coefficient, and cos ${num(deg, 2)}° = ${fixed(Math.cos(th), 3)}.` },
          { text: `${verdict}; 1 ${a[1] < 0 ? "−" : "+"} ${fixed(Math.abs(a[1]), 3)}z⁻¹ + ${fixed(r, 3)}z⁻²`, why: `The last term is <b>r², not r</b> — it is the product of the two pole magnitudes, and they multiply.` },
          { text: `${r < 1 ? "unstable" : "stable"}; 1 ${a[1] < 0 ? "−" : "+"} ${fixed(Math.abs(a[1]), 3)}z⁻¹ + ${fixed(a[2], 3)}z⁻²`, why: `The verdict is backwards. <b>Inside the unit circle is stable</b> — a radius of ${fixed(r, 2)} is ${r < 1 ? "inside" : r > 1 ? "outside" : "exactly on"} it.` },
        ]),
      answer: 0,
      steps: [
        `<b>The verdict needs the radius alone:</b> |z| = ${fixed(r, 2)}, which is ${r < 1 ? "less than 1 — inside the circle, so stable" : r > 1 ? "greater than 1 — outside the circle, so unstable" : "exactly 1 — on the circle, so marginally stable: it rings for ever"}.`,
        `For the denominator, expand the conjugate pair — the imaginary parts cancel and only real coefficients survive:`,
        D(`\\left(1 - re^{j\\theta}z^{-1}\\right)\\left(1 - re^{-j\\theta}z^{-1}\\right) = 1 - 2r\\cos\\theta\\,z^{-1} + r^2z^{-2}`),
        D(`= 1 - 2(${fixed(r, 2)})(${fixed(Math.cos(th), 4)})z^{-1} + ${fixed(r * r, 3)}z^{-2}`),
        `<b>${verdict}, with denominator 1 ${a[1] < 0 ? "−" : "+"} ${fixed(Math.abs(a[1]), 3)}z⁻¹ + ${fixed(a[2], 3)}z⁻².</b> The filter rings at ${num(deg, 2)}° per sample, which is ${fixed(deg / 360, 3)} of the sample rate.`,
      ],
    };
  },
});

defineProblem("z-freq", {
  topic: "Frequency response from H(z)",
  lookup: "Electrical → Signal Processing → Digital frequency response",
  make(rng) {
    const at = rng.pick(["dc", "nyq", "nyq", "map"]);

    if (at === "map") {
      const fs = rng.pick([8, 10, 44.1, 48]);
      const f = rng.pick([0.5, 1, 2, 4]);
      const om = (2 * Math.PI * f) / fs;
      return {
        stem: `A filter runs at f<sub>s</sub> = ${num(fs, 3)} kHz. What angle around the unit circle corresponds to a ${num(f, 2)} kHz signal?`,
        choices: options(
          { text: `${fixed(om, 4)} rad/sample`, why: "" },
          [
            { text: `${fixed(om / 2, 4)} rad/sample`, why: `Half the right value — this is what you get from πf/f<sub>s</sub>. <b>A full lap is the whole sample rate</b>, so Ω = 2πf/f<sub>s</sub>.` },
            { text: `${fixed(2 * Math.PI * fs / f, 3)} rad/sample`, why: `The ratio is upside down. Ω must grow with signal frequency and shrink as the sample rate rises.` },
            { text: `${fixed(f / fs, 4)} rad/sample`, why: `That is the plain ratio f/f<sub>s</sub>, which is the fraction of a lap. <b>Multiply by 2π</b> to turn a fraction of a turn into radians.` },
          ]),
        answer: 0,
        steps: [
          D(`\\Omega = \\frac{2\\pi f}{f_s} = \\frac{2\\pi(${num(f, 2)})}{${num(fs, 3)}} = ${fixed(om, 4)}\\text{ rad/sample}`),
          `<b>${fixed(om, 4)} rad/sample</b>, which is ${fixed(om / Math.PI, 3)}π — that is ${fixed((100 * f) / (fs / 2), 1)}% of the way to the Nyquist frequency.`,
          `<b>Sanity check the two anchors.</b> DC is Ω = 0 at z = +1, and the Nyquist frequency f<sub>s</sub>/2 is Ω = π at z = −1. Any answer above π describes a frequency that has aliased.`,
        ],
      };
    }

    const a1 = rng.pick([0.5, 0.6, 0.8, -0.5, -0.6]);
    const b0 = +(1 - Math.abs(a1)).toFixed(2);
    const dc = b0 / (1 - a1);
    const nq = b0 / (1 + a1);
    const want = at === "dc" ? dc : nq;
    const other = at === "dc" ? nq : dc;
    return {
      stem: `A filter has <b>H(z) = ${fixed(b0, 2)} / (1 − ${fixed(a1, 2)}z⁻¹)</b>. What is its gain at ${at === "dc" ? "DC" : "the Nyquist frequency"}?`,
      choices: options(
        { text: fixed(want, 3), why: "" },
        [
          { text: fixed(other, 3), why: `That is the gain at ${at === "dc" ? "the Nyquist frequency, z = −1" : "DC, z = +1"}. <b>DC is z = +1 and Nyquist is z = −1</b>, and the two give different answers whenever the filter does anything at all.` },
          { text: fixed(b0, 3), why: `The denominator was ignored. Substituting z = ${at === "dc" ? "+1" : "−1"} makes z⁻¹ = ${at === "dc" ? "+1" : "−1"}, so the denominator becomes 1 ${at === "dc" ? "−" : "+"} ${fixed(a1, 2)} = ${fixed(at === "dc" ? 1 - a1 : 1 + a1, 2)}, not 1.` },
          /* Neither the reciprocal nor b0/(1−|a1|) works here: for positive a1
             the DC gain is exactly 1, so both collapse onto the answer.
             Multiplying by the denominator instead of dividing always
             differs, and is a real slip. */
          { text: fixed(b0 * (at === "dc" ? 1 - a1 : 1 + a1), 3), why: `Multiplied by the denominator instead of divided by it. H(z) is ${fixed(b0, 2)} <b>over</b> ${fixed(at === "dc" ? 1 - a1 : 1 + a1, 2)}.` },
        ]),
      answer: 0,
      steps: [
        `<b>${at === "dc" ? "DC is z = +1" : "The Nyquist frequency is z = −1"}</b>, so z⁻¹ = ${at === "dc" ? "+1" : "−1"} and no trigonometry is needed at all.`,
        D(`H(${at === "dc" ? "1" : "-1"}) = \\frac{${fixed(b0, 2)}}{1 - ${fixed(a1, 2)}(${at === "dc" ? "1" : "-1"})} = \\frac{${fixed(b0, 2)}}{${fixed(at === "dc" ? 1 - a1 : 1 + a1, 3)}} = ${fixed(want, 4)}`),
        `<b>${fixed(want, 3)}</b>, or ${fixed(dB(want), 1)} dB. ${
          dc > nq
            ? "Gain of 1 at DC falling towards Nyquist: this is a <b>low-pass</b> filter."
            : "Gain rising towards the Nyquist frequency: this is a <b>high-pass</b> filter, which is what a negative feedback coefficient does."
        }`,
        `<b>These two points are free on any digital filter question.</b> Substituting ±1 costs one line and often eliminates three of the four choices before you compute anything else.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "z-transform",
    stem: "What does z⁻¹ mean?",
    tool: "One sample of delay",
    because: "Every difference equation converts to algebra with that one substitution.",
  },
  {
    part: "z-transform",
    stem: "Stability condition for a digital filter?",
    tool: "Every pole strictly inside the unit circle, |z| < 1",
    because: "Sampling maps the s-plane's left half onto the unit disc via z = e^(sT), so the test carries over exactly.",
  },
  {
    part: "z-transform",
    stem: "A pole at radius r and angle θ — what does each part control?",
    tool: "Radius sets the decay rate, angle sets the ringing frequency",
    because: "It is σ and ω from the s-plane, wearing polar coordinates.",
  },
  {
    part: "z-transform",
    stem: "Where are an FIR filter's poles?",
    tool: "All at the origin, z = 0",
    because: "Its denominator is 1, which is why an FIR can never be unstable.",
  },
  {
    part: "z-transform",
    stem: "Which points on the unit circle are DC and Nyquist?",
    tool: "DC is z = +1, Nyquist is z = −1",
    because: "Both need only real arithmetic, and they often eliminate three choices in one line.",
  },
  {
    part: "z-transform",
    stem: "Converting a signal frequency to an angle round the circle?",
    tool: "Ω = 2πf/fs — a full lap is the whole sample rate",
    because: "Half a lap is the Nyquist frequency, so any Ω past π describes something that has already aliased.",
  },
  {
    part: "z-transform",
    stem: "Reading |H| off a pole-zero plot?",
    tool: "Product of distances to the zeros over product of distances to the poles",
    because: "Measured from the point on the unit circle — near a pole it peaks, on a zero it vanishes.",
  },
]);
