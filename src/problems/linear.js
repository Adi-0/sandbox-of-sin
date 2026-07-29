/* ==========================================================================
   problems/linear.js — generators for Linear Systems.

   Part 1 (7.A): first-order transients — the time constant, the three-step
   method, and the percentages worth knowing on sight.
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed } from "../lib/fmt.js";

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;

/** Right answer first; duplicates dropped, topped up from `spare`. */
function options(right, wrong, spare = []) {
  const norm = (c) => (typeof c === "string" ? { text: c, why: "" } : c);
  const seen = new Set();
  const out = [];
  for (const c of [right, ...wrong, ...spare]) {
    const n = norm(c);
    if (seen.has(n.text)) continue;
    seen.add(n.text);
    out.push(n);
    if (out.length === 4) break;
  }
  return out;
}

/* Time in the units an FE stem actually uses. */
const ms = (s) => `${fixed(s * 1000, 2)} ms`;

/* ==========================================================================
   Part 1 — first-order transients
   ========================================================================== */

defineProblem("tau-find", {
  topic: "Finding the time constant",
  lookup: "Electrical → Linear Systems → Transient response",
  make(rng) {
    const isRC = rng.pick([true, false]);
    const R = rng.pick([1, 2, 4, 5, 10, 20]);            // kΩ
    const Cuf = rng.pick([1, 2, 4.7, 10, 22, 47]);       // µF
    const Lmh = rng.pick([10, 20, 50, 100, 200, 500]);   // mH

    if (isRC) {
      const tau = R * 1000 * Cuf * 1e-6;
      return {
        stem: `A ${num(R, 0)} kΩ resistor is in series with a ${num(Cuf, 1)} µF capacitor. What is the time constant?`,
        choices: options(
          { text: ms(tau), why: "" },
          [
            { text: ms(Cuf * 1e-6 / (R * 1000)), why: "That is C/R. The time constant of an RC circuit is the <b>product</b> — a bigger resistor charges a capacitor more slowly, not faster." },
            { text: ms(tau * 1000), why: "A factor of 1000 out. kΩ × µF lands in <b>milliseconds</b>: 10³ × 10⁻⁶ = 10⁻³." },
            { text: ms(tau / 1000), why: "A factor of 1000 the other way, from the same unit slip." },
          ],
          [{ text: ms(tau * 2), why: "Doubled. There is no factor of 2 in τ = RC." }]),
        answer: 0,
        steps: [
          `<span class="math display" data-tex="\\tau = RC"></span>`,
          `The units do the work: <b>kΩ × µF = ms</b>, because 10³ × 10⁻⁶ = 10⁻³.`,
          `<span class="math display" data-tex="\\tau = (${num(R, 0)})(${num(Cuf, 1)}) = ${fixed(tau * 1000, 2)}\\text{ ms}"></span>`,
          `<b>${ms(tau)}.</b> Worth carrying that unit shortcut into the exam — it removes the only place this question can go wrong.`,
        ],
      };
    }

    const tau = (Lmh * 1e-3) / (R * 1000);
    return {
      stem: `A ${num(Lmh, 0)} mH inductor is in series with a ${num(R, 0)} kΩ resistor. What is the time constant?`,
      choices: options(
        { text: ms(tau), why: "" },
        [
          { text: ms(Lmh * 1e-3 * R * 1000), why: "That is LR. For an inductor the time constant is <b>L/R</b> — a bigger resistor makes an RL circuit <em>faster</em>, which is the opposite of the RC case." },
          { text: ms((R * 1000) / (Lmh * 1e-3)), why: "Upside down. Inductance is on top." },
          { text: ms(tau * 1000), why: "A factor of 1000 out. mH ÷ kΩ = µs: 10⁻³ / 10³ = 10⁻⁶." },
        ]),
      answer: 0,
      steps: [
        `<span class="math display" data-tex="\\tau = L/R"></span>`,
        `<span class="math display" data-tex="\\tau = \\frac{${num(Lmh, 0)}\\times 10^{-3}}{${num(R, 0)}\\times 10^{3}} = ${fixed(tau * 1e6, 1)}\\ \\mu\\text{s}"></span>`,
        `<b>${ms(tau)}.</b> Note which way round the resistor acts: <b>RC × R gets slower, L/R gets faster.</b> Mixing those two up is the most common error in this topic, and the physical reading fixes it — a big resistor limits the current that charges a capacitor, but it is exactly what forces an inductor's current to change quickly.`,
      ],
    };
  },
});

defineProblem("tau-percent", {
  topic: "How far along the curve",
  lookup: "Electrical → Linear Systems → Transient response",
  make(rng) {
    const q = rng.pick(["pct", "pct", "time", "settle"]);
    const n = rng.pick([1, 2, 3, 4, 5]);
    const rise = rng.pick([true, false]);
    const pct = (1 - Math.exp(-n)) * 100;

    if (q === "pct") {
      const shown = rise ? pct : 100 - pct;
      return {
        stem: `A first-order circuit ${rise ? "charges towards" : "decays from"} its final value. What fraction of the way ${rise ? "there is it" : "is left"} after ${n} time constant${n > 1 ? "s" : ""}?`,
        choices: options(
          { text: `${fixed(rise ? pct : 100 - pct, 1)}%`, why: "" },
          [
            { text: `${fixed(rise ? 100 - pct : pct, 1)}%`, why: `That is the ${rise ? "fraction remaining" : "fraction already gone"}. Read which way the question is asking — this is the only trap in it.` },
            { text: `${fixed(n * 20, 0)}%`, why: "That treats the approach as linear, reaching 100% at 5τ. It is exponential: most of the journey happens in the first time constant." },
            { text: `${fixed(100 / n, 1)}%`, why: "Not a relationship that appears anywhere in first-order response." },
          ]),
        answer: 0,
        steps: [
          `<span class="math display" data-tex="1 - e^{-${n}} = ${fixed(pct / 100, 4)}"></span>`,
          `So after ${n}τ the circuit is <b>${fixed(pct, 1)}%</b> of the way to its final value, with ${fixed(100 - pct, 1)}% still to go.`,
          `<b>${fixed(shown, 1)}%.</b> The five values are worth knowing without a calculator: <b>63.2, 86.5, 95.0, 98.2, 99.3</b>. Each time constant removes the same <em>fraction</em> of what is left — 63.2% of it — which is what an exponential means.`,
        ],
      };
    }

    if (q === "settle") {
      return {
        stem: "A first-order circuit is conventionally taken as settled after how many time constants?",
        choices: [
          { text: "5 — within 0.7% of the final value", why: "" },
          { text: "1 — the time constant is the settling time", why: "After 1τ it is only 63.2% of the way there. The time constant sets the <em>rate</em>, not the arrival." },
          { text: "3 — within 5%", why: "3τ is a common engineering tolerance and a defensible answer in context, but the standard convention on this exam is 5τ." },
          { text: "It never settles — the exponential is asymptotic", why: "True in mathematics and useless in engineering. The convention exists exactly because the asymptote is never reached." },
        ],
        answer: 0,
        steps: [
          `<span class="math display" data-tex="e^{-5} = 0.0067"></span>`,
          `So after 5τ the circuit is within <b>0.7%</b> of its final value — inside the tolerance of any component in it.`,
          `<b>5 time constants.</b> A useful sanity check under time pressure: if a question mentions a duration much longer than 5τ, the circuit is in steady state and <b>you can treat the capacitor as an open circuit and the inductor as a short</b>, with no exponentials at all.`,
        ],
      };
    }

    // time to reach a stated fraction
    const target = rng.pick([0.5, 0.9, 0.95, 0.99]);
    const R = rng.pick([1, 2, 5, 10]);
    const Cuf = rng.pick([10, 22, 47, 100]);
    const tau = R * 1000 * Cuf * 1e-6;
    const t = -tau * Math.log(1 - target);
    return {
      stem: `A ${num(R, 0)} kΩ resistor charges a ${num(Cuf, 0)} µF capacitor from 0 V. How long until it reaches ${fixed(target * 100, 0)}% of the supply voltage?`,
      choices: options(
        { text: ms(t), why: "" },
        [
          { text: ms(tau * target), why: "That scales τ linearly with the target. The approach is exponential, so reaching a high fraction costs far more than proportionally." },
          { text: ms(tau), why: "That is one time constant, which reaches only 63.2%." },
          { text: ms(-tau * Math.log(target)), why: `That solves e^(−t/τ) = ${target}, which is the time to <b>fall</b> to ${fixed(target * 100, 0)}% — the discharge question, not the charge one.` },
        ]),
      answer: 0,
      steps: [
        `Set the charging expression equal to the target fraction and solve for t:`,
        `<span class="math display" data-tex="1 - e^{-t/\\tau} = ${target} \\quad\\Rightarrow\\quad t = -\\tau \\ln(1 - ${target})"></span>`,
        `<span class="math display" data-tex="\\tau = (${num(R, 0)})(${num(Cuf, 0)}) = ${fixed(tau * 1000, 1)}\\text{ ms}, \\qquad t = ${fixed(-Math.log(1 - target), 3)}\\tau = ${fixed(t * 1000, 1)}\\text{ ms}"></span>`,
        `<b>${ms(t)}.</b> The multiplier is worth recognising: <b>0.69τ to half, 2.3τ to 90%, 3τ to 95%, 4.6τ to 99%</b>. The first is ln 2, and it is the same number that appears in every half-life in physics.`,
      ],
    };
  },
});

defineProblem("first-order-value", {
  topic: "The three-step method",
  lookup: "Electrical → Linear Systems → Transient response",
  make(rng) {
    const v0 = rng.pick([0, 2, 5, 10, 12]);
    // a transient that starts where it ends is not a transient
    let vinf = rng.pick([0, 4, 6, 8, 15, 20]);
    while (vinf === v0) vinf = rng.pick([0, 4, 6, 8, 15, 20]);
    const tauMs = rng.pick([2, 5, 10, 20, 50]);
    const at = rng.pick([1, 2, 3]) * tauMs;
    const k = at / tauMs;
    const v = vinf + (v0 - vinf) * Math.exp(-k);

    return {
      stem: `A first-order circuit starts at ${v0} V, settles at ${vinf} V, and has a time constant of ${tauMs} ms. What is the voltage ${at} ms after the switch closes?`,
      choices: options(
        { text: `${fixed(v, 2)} V`, why: "" },
        [
          { text: `${fixed(vinf * (1 - Math.exp(-k)), 2)} V`,
            why: `That uses the simple form <b>v∞(1 − e^(−t/τ))</b>, which is only correct when the circuit starts at <b>zero</b>. Here it starts at ${v0} V, so the general form is needed.` },
          { text: `${fixed(v0 * Math.exp(-k), 2)} V`,
            why: "That is a pure decay to zero, ignoring the final value the circuit is actually heading for." },
          { text: `${fixed(v0 + (vinf - v0) * k / 3, 2)} V`,
            why: "That interpolates linearly between the two values. The approach is exponential — far more of the change happens early." },
        ]),
      answer: 0,
      steps: [
        `Three numbers, no calculus. Start, end, and rate:`,
        `<span class="math display" data-tex="v(t) = v(\\infty) + \\big[v(0^+) - v(\\infty)\\big]e^{-t/\\tau}"></span>`,
        `<span class="math display" data-tex="v = ${vinf} + (${v0} - ${vinf})e^{-${at}/${tauMs}} = ${vinf} ${v0 < vinf ? "-" : "+"} ${fixed(Math.abs(v0 - vinf), 0)}e^{-${fixed(k, 0)}} = ${fixed(v, 2)}\\text{ V}"></span>`,
        `<b>${fixed(v, 2)} V.</b> This form covers every first-order transient there is, including the two special cases people memorise separately: with v(0⁺) = 0 it collapses to a plain rise, and with v(∞) = 0 to a plain decay. <b>Learn the general one and the other two come free.</b>`,
      ],
    };
  },
});

defineProblem("switch-state", {
  topic: "Initial and final conditions",
  lookup: "Electrical → Linear Systems → Transient response",
  make(rng) {
    const q = rng.pick(["cap0", "ind0", "capinf", "indinf"]);
    const Q = {
      cap0: {
        stem: "A switch closes at t = 0. What does an uncharged capacitor look like the instant afterwards?",
        right: "A short circuit — its voltage cannot jump",
        wrong: [
          ["An open circuit", "That is the capacitor in <b>steady state</b>, once nothing is changing any more. At t = 0⁺ it is the opposite."],
          ["A resistor equal to 1/ωC", "Reactance is a steady-state sinusoidal idea. A switching transient is not a sinusoid."],
          ["A voltage source equal to the supply", "Only if it were already charged to the supply. Uncharged, it holds 0 V — which is what makes it a short."],
        ],
        why: "Charge cannot appear instantly, so <b>v<sub>C</sub> cannot jump</b>. An uncharged capacitor is holding 0 V at t = 0⁺, and something holding 0 V is indistinguishable from a wire. That is what makes the initial current the largest it will ever be.",
      },
      ind0: {
        stem: "A switch closes at t = 0. What does an inductor carrying no current look like the instant afterwards?",
        right: "An open circuit — its current cannot jump",
        wrong: [
          ["A short circuit", "That is the inductor in <b>steady state</b>. At t = 0⁺ it is the opposite — the exact mirror of the capacitor."],
          ["A current source equal to the final current", "Only if it were already carrying it. Starting from zero, it enforces zero."],
          ["A resistor equal to ωL", "Reactance is a steady-state sinusoidal idea, not a switching one."],
        ],
        why: "Flux cannot change instantly, so <b>i<sub>L</sub> cannot jump</b>. An inductor carrying zero current at t = 0⁺ is enforcing zero current, which is what an open circuit does. The two rules are duals: <b>a capacitor holds its voltage, an inductor holds its current.</b>",
      },
      capinf: {
        stem: "Long after a switch closes, what does a capacitor look like to a DC source?",
        right: "An open circuit",
        wrong: [
          ["A short circuit", "That is the instant <em>after</em> switching, for an uncharged capacitor. Long after, it is the reverse."],
          ["A resistor equal to its ESR", "A real capacitor has series resistance, and it is not what this question is about."],
          ["A voltage source equal to zero", "A charged capacitor holds a voltage, and it is generally not zero."],
        ],
        why: "In steady state nothing is changing, so <b>dv/dt = 0</b> and therefore i = C·dv/dt = 0. A branch carrying no current is an open circuit. This is what makes the final value a plain resistive-divider problem — no calculus needed for step 2 of the three-step method.",
      },
      indinf: {
        stem: "Long after a switch closes, what does an inductor look like to a DC source?",
        right: "A short circuit",
        wrong: [
          ["An open circuit", "That is the instant <em>after</em> switching, for an inductor starting from zero current."],
          ["A resistor equal to its winding resistance", "Real inductors have one, and it is not what the ideal-element question is asking."],
          ["A current source equal to zero", "The steady current is generally not zero — it is set by the rest of the circuit."],
        ],
        why: "In steady state <b>di/dt = 0</b>, so v = L·di/dt = 0. A branch with no voltage across it is a short. Combined with the capacitor rule, this is how <b>step 2 of the three-step method is always a DC resistive problem</b>: replace every capacitor with a gap and every inductor with a wire, then solve.",
      },
    }[q];
    return {
      stem: Q.stem,
      choices: [{ text: Q.right, why: "" }, ...Q.wrong.map(([t, w]) => ({ text: t, why: w }))],
      answer: 0,
      steps: [`<b>${Q.right}.</b>`, Q.why],
    };
  },
});

defineReflex([
  {
    part: "transient",
    stem: "A 10 kΩ resistor and a 4.7 µF capacitor. Time constant?",
    tool: "τ = RC = 47 ms",
    because: "kΩ × µF lands in milliseconds, which removes the only place the arithmetic can go wrong.",
  },
  {
    part: "transient",
    stem: "A 100 mH inductor and a 2 kΩ resistor. Time constant?",
    tool: "τ = L/R = 50 µs",
    because: "For an inductor the resistor is on the bottom — a bigger R makes an RL circuit faster, the opposite of RC.",
  },
  {
    part: "transient",
    stem: "How far along is a first-order circuit after 3 time constants?",
    tool: "95% — the sequence is 63.2, 86.5, 95.0, 98.2, 99.3",
    because: "Each time constant removes the same fraction of what is left, which is what an exponential means.",
  },
  {
    part: "transient",
    stem: "A capacitor, an instant after the switch closes, starting uncharged.",
    tool: "a short circuit — v cannot jump",
    because: "Long afterwards it is an open circuit; the inductor is the exact mirror of both.",
  },
  {
    part: "transient",
    stem: "A transient starts at 2 V and ends at 8 V. What form does v(t) take?",
    tool: "v = v∞ + (v0 − v∞)e^(−t/τ)",
    because: "The general form covers both special cases, so there is only one thing to remember.",
  },
]);
