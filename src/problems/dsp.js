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
