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

/* ==========================================================================
   Part 2 — second-order response (7.A)
   ========================================================================== */

const OS = (z) => Math.exp(-Math.PI * z / Math.sqrt(1 - z * z));

defineProblem("damping-case", {
  topic: "Which damping case",
  lookup: "Electrical → Linear Systems → Transient response",
  make(rng) {
    const Lmh = rng.pick([1, 4, 10, 25, 100]);
    const Cuf = rng.pick([0.1, 0.25, 1, 4, 10]);
    const Lv = Lmh * 1e-3, Cv = Cuf * 1e-6;
    const wn = 1 / Math.sqrt(Lv * Cv);
    const Rcrit = 2 * Math.sqrt(Lv / Cv);
    const R = rng.pick([0.25, 0.5, 1, 1, 2, 4]) * Rcrit;
    const z = (R / 2) * Math.sqrt(Cv / Lv);
    const kind = z < 0.999 ? "Underdamped" : z < 1.001 ? "Critically damped" : "Overdamped";
    const why = {
      Underdamped: "ζ < 1, so the roots are a complex conjugate pair and the response overshoots and rings before settling.",
      "Critically damped": "ζ = 1 exactly, so the two roots are real and equal. This is the <b>fastest response with no overshoot</b>, and it happens at exactly one value of R.",
      Overdamped: "ζ > 1, so the roots are two distinct real negatives and the response is the sum of two decaying exponentials — no ringing, and <em>slower</em> than critical.",
    }[kind];

    return {
      stem: `A series RLC circuit has R = ${num(R, 0)} Ω, L = ${num(Lmh, 0)} mH and C = ${num(Cuf, 2)} µF. Which damping case is it in?`,
      choices: [
        { text: kind, why: "" },
        ...["Underdamped", "Critically damped", "Overdamped"].filter((k) => k !== kind)
          .map((k) => ({
            text: k,
            why: `That would need ζ ${k === "Underdamped" ? "< 1" : k === "Overdamped" ? "> 1" : "= 1 exactly"}, and here ζ = ${fixed(z, 2)}.`,
          })),
        { text: "Undamped — it oscillates forever", why: "That needs R = 0. Any resistance at all dissipates the stored energy and the oscillation dies." },
      ],
      answer: 0,
      steps: [
        `Two numbers decide it, and neither needs the response solved:`,
        `<span class="math display" data-tex="\\omega_n = \\frac{1}{\\sqrt{LC}} = ${num(wn, 0)}\\text{ rad/s}, \\qquad \\zeta = \\frac{R}{2}\\sqrt{\\frac{C}{L}} = ${fixed(z, 2)}"></span>`,
        `<b>${kind}.</b> ${why}`,
        `The critical resistance here is ${T(`R_{crit} = 2\\sqrt{L/C} = ${num(Rcrit, 0)}\\ \\Omega`)}, so <b>comparing R against 2√(L/C) answers this question on sight</b> — which is worth doing before reaching for ζ.`,
      ],
    };
  },
});

defineProblem("wn-zeta", {
  topic: "Natural frequency and damping ratio",
  lookup: "Electrical → Linear Systems → Transient response",
  make(rng) {
    const q = rng.pick(["wn", "zeta", "wd", "roots"]);
    const Lmh = rng.pick([1, 4, 10, 25, 100]);
    const Cuf = rng.pick([0.1, 0.25, 1, 4, 10]);
    const Lv = Lmh * 1e-3, Cv = Cuf * 1e-6;
    const wn = 1 / Math.sqrt(Lv * Cv);
    const R = rng.pick([0.2, 0.4, 0.6, 0.8]) * 2 * Math.sqrt(Lv / Cv);
    const z = (R / 2) * Math.sqrt(Cv / Lv);
    const wd = wn * Math.sqrt(1 - z * z);
    const kr = (v) => `${num(v / 1000, 2)} krad/s`;

    if (q === "wn") {
      return {
        stem: `A series RLC circuit has L = ${num(Lmh, 0)} mH and C = ${num(Cuf, 2)} µF. What is its undamped natural frequency?`,
        choices: options(
          { text: kr(wn), why: "" },
          [
            { text: kr(Math.sqrt(Lv * Cv) * 1e6), why: "That is √(LC) rather than its reciprocal. A bigger L or C makes a circuit <b>slower</b>, so they belong on the bottom." },
            { text: kr(1 / (Lv * Cv) / 1e6), why: "The square root is missing." },
            { text: kr(wn / (2 * Math.PI)), why: "That is in hertz, not radians per second — and the question asks for ω. Divide by 2π only if the answer is wanted in Hz." },
          ]),
        answer: 0,
        steps: [
          `<span class="math display" data-tex="\\omega_n = \\frac{1}{\\sqrt{LC}} = \\frac{1}{\\sqrt{(${num(Lmh, 0)}\\times10^{-3})(${num(Cuf, 2)}\\times10^{-6})}}"></span>`,
          `<span class="math display" data-tex="\\omega_n = ${num(wn, 0)}\\text{ rad/s} = ${num(wn / 1000, 2)}\\text{ krad/s}"></span>`,
          `<b>${kr(wn)}</b>, which is ${num(wn / (2 * Math.PI * 1000), 2)} kHz. Note that <b>R does not appear</b> — ωn is what the circuit <em>would</em> ring at with no resistance, and resistance only lowers the frequency slightly and kills the amplitude.`,
        ],
      };
    }

    if (q === "zeta") {
      return {
        stem: `A series RLC circuit has R = ${num(R, 0)} Ω, L = ${num(Lmh, 0)} mH and C = ${num(Cuf, 2)} µF. What is its damping ratio?`,
        choices: options(
          { text: fixed(z, 3), why: "" },
          [
            { text: fixed(1 / z, 3), why: "Inverted. A <b>larger</b> resistor means more damping, so R belongs on top." },
            { text: fixed((R / 2) * Math.sqrt(Lv / Cv), 3), why: "L and C are the wrong way round. It is √(C/L), which is the reciprocal of the circuit's characteristic impedance." },
            { text: fixed(z * 2, 3), why: "The factor of 2 has been dropped." },
          ]),
        answer: 0,
        steps: [
          `<span class="math display" data-tex="\\zeta = \\frac{R}{2}\\sqrt{\\frac{C}{L}} = \\frac{R}{2\\sqrt{L/C}}"></span>`,
          `<span class="math display" data-tex="\\zeta = \\frac{${num(R, 0)}}{2\\sqrt{${num(Lmh, 0)}\\times10^{-3} / ${num(Cuf, 2)}\\times10^{-6}}} = ${fixed(z, 3)}"></span>`,
          `<b>${fixed(z, 3)}</b> — underdamped. The second form is worth preferring: <b>√(L/C) is the circuit's characteristic impedance</b>, so ζ is just R measured against it, halved. That reading makes it obvious that only the <em>ratio</em> matters, not the absolute size of anything.`,
        ],
      };
    }

    if (q === "wd") {
      return {
        stem: `A second-order circuit has ωn = ${kr(wn)} and ζ = ${fixed(z, 2)}. At what frequency does it actually ring?`,
        choices: options(
          { text: kr(wd), why: "" },
          [
            { text: kr(wn), why: "That is the <b>undamped</b> natural frequency — what it would ring at with no resistance. Damping always lowers it." },
            { text: kr(wn * z), why: "That is the decay rate σ = ζωn, the real part of the roots, not the frequency." },
            { text: kr(wn * (1 - z * z)), why: "The square root is missing from √(1 − ζ²)." },
          ]),
        answer: 0,
        steps: [
          `<span class="math display" data-tex="\\omega_d = \\omega_n\\sqrt{1-\\zeta^2} = ${num(wn / 1000, 2)}\\sqrt{1-${fixed(z, 2)}^2} = ${num(wd / 1000, 2)}\\text{ krad/s}"></span>`,
          `<b>${kr(wd)}.</b> Note how little damping costs in frequency: even at ζ = 0.5 the ringing is still 87% of ωn. <b>Damping mostly removes amplitude, not frequency</b> — which is why ωn is a usable estimate of the ringing frequency for any lightly damped circuit.`,
          `Geometrically, ωn, ωd and ζωn are the hypotenuse and two sides of a right triangle: <b>ζ is the cosine of the angle from the negative real axis</b>. At ζ = 0.6 that angle is 53.13°, and the triangle is 3-4-5.`,
        ],
      };
    }

    const sig = z * wn;
    return {
      stem: `A second-order system has ωn = ${kr(wn)} and ζ = ${fixed(z, 2)}. Where are its roots?`,
      choices: options(
        { text: `−${num(sig, 0)} ± j${num(wd, 0)}`, why: "" },
        [
          { text: `−${num(wd, 0)} ± j${num(sig, 0)}`, why: "The real and imaginary parts are swapped. <b>The real part is the decay rate ζωn</b> and the imaginary part is the ringing frequency ωd." },
          { text: `−${num(sig, 0)} ± j${num(wn, 0)}`, why: "That uses ωn as the imaginary part. The ringing is at ωd = ωn√(1−ζ²), which is always smaller." },
          { text: `+${num(sig, 0)} ± j${num(wd, 0)}`, why: "A <b>positive</b> real part would mean a response that grows without limit. Any passive circuit has roots in the left half-plane." },
        ]),
      answer: 0,
      steps: [
        `<span class="math display" data-tex="s = -\\zeta\\omega_n \\pm j\\omega_n\\sqrt{1-\\zeta^2}"></span>`,
        `<span class="math display" data-tex="s = -${num(sig, 0)} \\pm j${num(wd, 0)}"></span>`,
        `<b>The two parts mean different things and are worth separating.</b> The real part, −ζωn, is how fast the envelope decays — it alone sets the settling time. The imaginary part, ωd, is how fast it oscillates inside that envelope. A root's <em>distance</em> from the origin is ωn, and its <em>angle</em> encodes ζ.`,
      ],
    };
  },
});

defineProblem("overshoot-calc", {
  topic: "Overshoot and settling time",
  lookup: "Electrical → Linear Systems → Transient response",
  make(rng) {
    const q = rng.pick(["os", "os", "ts", "which"]);
    const z = rng.pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]);
    const wn = rng.pick([100, 500, 1000, 2000, 5000]);
    const os = OS(z);

    if (q === "os") {
      return {
        stem: `A second-order system has ζ = ${fixed(z, 1)}. What is its percentage overshoot to a step input?`,
        choices: options(
          { text: `${fixed(os * 100, 1)}%`, why: "" },
          [
            { text: `${fixed((1 - z) * 100, 0)}%`, why: "That is a linear guess. Overshoot falls far faster than linearly with ζ — the relationship is exponential." },
            { text: `${fixed(OS(z) * 100 * 2, 1)}%`, why: "Twice the correct value. There is no factor of 2 in the overshoot formula." },
            { text: `${fixed(Math.exp(-Math.PI * z) * 100, 1)}%`, why: "The <b>√(1 − ζ²)</b> is missing from the denominator of the exponent. It matters more as ζ grows." },
          ]),
        answer: 0,
        steps: [
          `<span class="math display" data-tex="\\%OS = 100\\,e^{-\\pi\\zeta/\\sqrt{1-\\zeta^2}}"></span>`,
          `<span class="math display" data-tex="= 100\\,e^{-\\pi(${fixed(z, 1)})/\\sqrt{1-${fixed(z, 1)}^2}} = ${fixed(os * 100, 1)}\\%"></span>`,
          `<b>${fixed(os * 100, 1)}%.</b> Note what is <em>not</em> in the formula: ωn. <b>Overshoot depends on ζ alone</b>, so changing the speed of a system does not change how far it overshoots — which is why a specification is written as a percentage and a time rather than as two times.`,
          `Three worth recognising: <b>ζ = 0.5 gives 16.3%, ζ = 0.6 gives 9.5%, ζ = 0.707 gives 4.3%.</b>`,
        ],
      };
    }

    if (q === "ts") {
      const ts = 4 / (z * wn);
      return {
        stem: `A second-order system has ζ = ${fixed(z, 1)} and ωn = ${num(wn, 0)} rad/s. What is its 2% settling time?`,
        choices: options(
          { text: ms(ts), why: "" },
          [
            { text: ms(4 / wn), why: "That leaves out ζ. Settling depends on the <b>product</b> ζωn — the real part of the roots — because that is what the decaying envelope goes as." },
            { text: ms(4 * z / wn), why: "ζ is multiplying where it should divide. More damping settles <em>faster</em>, up to a point." },
            { text: ms(Math.PI / (wn * Math.sqrt(1 - z * z))), why: "That is the <b>peak time</b>, π/ωd — when the first overshoot happens, not when the response settles." },
          ]),
        answer: 0,
        steps: [
          `The envelope decays as e^(−ζωn·t), and 2% is reached when that exponent is about −4:`,
          `<span class="math display" data-tex="t_s \\approx \\frac{4}{\\zeta\\omega_n} = \\frac{4}{(${fixed(z, 1)})(${num(wn, 0)})} = ${fixed(ts * 1000, 2)}\\text{ ms}"></span>`,
          `<b>${ms(ts)}.</b> The numerator is a convention: use <b>4 for the 2% criterion and 3 for 5%</b>. Note that ζωn is the real part of the roots, so this is really the statement that <b>how fast a system settles is decided by how far left its poles are</b> — a fact Part 4 will make geometric.`,
        ],
      };
    }

    return {
      stem: "A design must overshoot by no more than 5% and settle as quickly as possible. What should be adjusted?",
      choices: [
        { text: "ζ sets the overshoot; then raise ωn to settle faster", why: "" },
        { text: "Raise ωn until the overshoot is acceptable", why: "ωn does not affect overshoot at all. Raising it makes everything happen sooner, overshoot included — the peak stays exactly as high." },
        { text: "Lower ζ to settle faster", why: "Lower ζ means <b>more</b> overshoot, and past about ζ = 0.7 it also makes settling worse, because the ringing takes longer to die." },
        { text: "Raise ζ above 1 to eliminate overshoot entirely", why: "That does remove overshoot, and it makes the response <em>slower</em> than critical damping. It is the answer when overshoot is unacceptable at any cost, not when 5% is allowed." },
      ],
      answer: 0,
      steps: [
        `The two specifications separate cleanly, which is the useful structure here:`,
        `<span class="math display" data-tex="\\%OS = f(\\zeta) \\ \\text{alone}, \\qquad t_s = 4/(\\zeta\\omega_n)"></span>`,
        `So pick ζ from the overshoot limit — <b>5% needs about ζ = 0.69</b> — and then raise ωn as far as the hardware allows, which shrinks the settling time without touching the overshoot.`,
        `<b>This is why ζ ≈ 0.7 appears so often.</b> It gives roughly 4.3% overshoot and sits close to the minimum settling time, so it is the default compromise unless a specification says otherwise.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "second-order",
    stem: "A series RLC. How do you tell which damping case without solving anything?",
    tool: "compare R against 2√(L/C)",
    because: "That is the critical resistance; below it the roots are complex and the circuit rings, above it they are real and it cannot.",
  },
  {
    part: "second-order",
    stem: "ωn = 10 krad/s and ζ = 0.6. Where are the roots?",
    tool: "−ζωn ± jωn√(1−ζ²) = −6000 ± j8000",
    because: "The real part is the decay rate and sets settling; the imaginary part is the ringing frequency. Distance from the origin is ωn.",
  },
  {
    part: "second-order",
    stem: "A step response overshoots by 9.5%. What is ζ?",
    tool: "0.6 — from %OS = e^(−πζ/√(1−ζ²))",
    because: "Overshoot depends on ζ and nothing else, so it identifies the damping ratio no matter how fast the system is.",
  },
  {
    part: "second-order",
    stem: "ζ = 0.5, ωn = 200 rad/s. Settling time to 2%?",
    tool: "4/ζωn = 40 ms",
    because: "Settling goes with the real part of the roots, so it is the product ζωn that matters, not either one alone.",
  },
]);

/* ==========================================================================
   Part 3 — the Laplace transform (7.C)
   ========================================================================== */

const PAIRS_T = [
  ["\\delta(t)", "1", "the impulse — flat in s, which is what makes it the test signal that excites every frequency at once"],
  ["u(t)", "\\frac{1}{s}", "the unit step. A pole at the origin, which is why a step input puts one there in every problem"],
  ["t", "\\frac{1}{s^2}", "the ramp. Each extra power of t adds another 1/s, because integrating in t is dividing by s"],
  ["e^{-at}", "\\frac{1}{s+a}", "<b>the most useful line in the table.</b> A pole at −a is an exponential decaying at rate a"],
  ["\\sin\\omega t", "\\frac{\\omega}{s^2+\\omega^2}", "poles at ±jω — on the imaginary axis, so nothing decays"],
  ["\\cos\\omega t", "\\frac{s}{s^2+\\omega^2}", "the same poles; only the numerator distinguishes it from the sine"],
  ["e^{-at}\\sin\\omega t", "\\frac{\\omega}{(s+a)^2+\\omega^2}", "poles at −a ± jω. Part 2's ringing, written down"],
];

defineProblem("laplace-pair", {
  topic: "Transform pairs",
  lookup: "Electrical → Linear Systems → Laplace transforms",
  make(rng) {
    const i = rng.int(0, PAIRS_T.length - 1);
    const [ft, fs, why] = PAIRS_T[i];
    const forward = rng.pick([true, false]);
    const others = PAIRS_T.filter((_, j) => j !== i);
    const picks = rng.sample(others, 3);

    if (forward) {
      return {
        stem: `What is the Laplace transform of ${T(ft)}?`,
        choices: [
          { tex: fs, why: "" },
          ...picks.map(([oft, ofs]) => ({
            tex: ofs, why: `That is the transform of ${oft.replace(/\\\\/g, "")} — read the table the other way and check.`,
          })),
        ],
        answer: 0,
        steps: [
          `<span class="math display" data-tex="${ft} \\ \\longleftrightarrow \\ ${fs}"></span>`,
          `In words: ${why}.`,
          `<b>The table is in the handbook</b>, so this is a recognition question, not a recall one. What is worth memorising is not the entries but the <em>pattern</em> — poles on the negative real axis are decays, poles on the imaginary axis are oscillations, and a pair off to the left of the imaginary axis is a decaying oscillation.`,
        ],
      };
    }

    return {
      stem: `What is the inverse Laplace transform of ${T(fs)}?`,
      choices: [
        { tex: ft, why: "" },
        ...picks.map(([oft, ofs]) => ({
          tex: oft, why: `That transforms to ${ofs.replace(/\\\\frac/g, "").replace(/[{}]/g, " ")} — a different entry.`,
        })),
      ],
      answer: 0,
      steps: [
        `<span class="math display" data-tex="${fs} \\ \\longleftrightarrow \\ ${ft}"></span>`,
        `In words: ${why}.`,
        `Inverting is the same table read backwards, and the only skill it needs is <b>getting an expression into a form the table contains</b> — which is what partial fractions are for.`,
      ],
    };
  },
});

defineProblem("laplace-theorem", {
  topic: "The theorems worth knowing",
  lookup: "Electrical → Linear Systems → Laplace transforms",
  make(rng) {
    const q = rng.pick(["final", "initial", "deriv", "shift"]);

    if (q === "final" || q === "initial") {
      const a = rng.pick([2, 4, 5, 10]);
      const K = rng.pick([3, 6, 12, 20]);
      // F(s) = K / (s(s + a)) — a step through a first-order lag
      const fin = K / a, init = 0;
      const asked = q === "final";
      return {
        stem: `A response has ${T(`F(s) = \\frac{${K}}{s(s+${a})}`)}. What is its ${asked ? "final" : "initial"} value?`,
        choices: options(
          { text: asked ? `${num(fin, 2)}` : "0", why: "" },
          [
            { text: asked ? "0" : `${num(fin, 2)}`, why: asked
                ? "That is the initial value — multiply by s and let s → ∞ instead."
                : "That is the final value — multiply by s and let s → 0 instead." },
            { text: `${num(K, 0)}`, why: "That is the numerator alone. Both theorems require multiplying by s first, which cancels the pole at the origin." },
            { text: `${num(a, 0)}`, why: "That is the pole location, which sets how <em>fast</em> the response gets there — not where it ends up." },
          ]),
        answer: 0,
        steps: [
          asked
            ? `<span class="math display" data-tex="\\lim_{t\\to\\infty} f(t) = \\lim_{s\\to 0} sF(s)"></span>`
            : `<span class="math display" data-tex="\\lim_{t\\to 0^+} f(t) = \\lim_{s\\to\\infty} sF(s)"></span>`,
          `<span class="math display" data-tex="sF(s) = \\frac{${K}}{s+${a}} \\quad\\Rightarrow\\quad ${asked ? `\\text{at } s=0: \\ \\frac{${K}}{${a}} = ${num(fin, 2)}` : `\\text{as } s\\to\\infty: \\ 0`}"></span>`,
          `<b>${asked ? num(fin, 2) : "0"}.</b> Both theorems answer a question about the time domain <em>without inverting anything</em>, which is why they are worth the two lines they take. ${asked ? "<b>The final value theorem is only valid if the response actually settles</b> — if any pole of sF(s) is in the right half-plane or on the imaginary axis, it gives a number for something that never arrives." : "Note that s·F(s) → 0 here, which is a first-order lag starting from rest, exactly as expected."}`,
        ],
      };
    }

    const Q = {
      deriv: {
        stem: "What is the Laplace transform of a derivative, f′(t)?",
        right: "sF(s) − f(0⁻)",
        wrong: [
          ["sF(s)", "That is the transform when the initial condition is zero. <b>Dropping f(0⁻) is dropping the initial condition</b>, and it is the single most common error in this topic."],
          ["F(s)/s", "That is <b>integration</b>, not differentiation. Differentiating multiplies by s; integrating divides."],
          ["F(s) − f(0⁻)", "The factor of s is missing. Each derivative brings one down."],
        ],
        why: "<b>This is the whole reason the transform is useful.</b> Differentiation becomes multiplication by s, so a differential equation becomes a polynomial one — and the initial condition arrives as an ordinary algebraic term rather than as a constant to be fitted at the end. For a second derivative it is s²F(s) − sf(0⁻) − f′(0⁻), which is the same pattern applied twice.",
      },
      shift: {
        stem: "If f(t) transforms to F(s), what does e^(−at)f(t) transform to?",
        right: "F(s + a)",
        wrong: [
          ["F(s − a)", "The sign. Multiplying by a <b>decaying</b> exponential shifts the poles <em>left</em>, which means replacing s with s + a."],
          ["e^(−as)F(s)", "That is the transform of a <b>delayed</b> f(t − a) — shifting in time rather than in s. The two shift theorems are duals and are routinely swapped."],
          ["F(s)/(s + a)", "That would be a convolution with an exponential, not a multiplication by one."],
        ],
        why: "Multiplying by e^(−at) in time shifts everything in s by a. That single fact turns sin ωt into e^(−at)sin ωt by replacing s with s + a everywhere — <b>which is exactly how the damped-sine line in the table is built from the plain-sine one</b>, and why you do not have to memorise it separately.",
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

defineProblem("laplace-solve", {
  topic: "Transforming a circuit equation",
  lookup: "Electrical → Linear Systems → Laplace transforms",
  make(rng) {
    const R = rng.pick([2, 4, 5, 10]);
    const Lmh = rng.pick([1, 2, 5, 10]);
    const I0 = rng.pick([0, 1, 2, 3]);
    const a = (R * 1000) / (Lmh * 1e-3);         // R/L, in s⁻¹
    const kr = `${num(a / 1000, 0)}\\,000`;

    if (I0 === 0) {
      const Vs = rng.pick([5, 10, 12, 24]);
      return {
        stem: `An RL circuit with R = ${R} kΩ and L = ${Lmh} mH, starting from zero current, has a ${Vs} V step applied. What is I(s)?`,
        choices: [
          { tex: `\\frac{${Vs}}{s(Ls+R)}`, why: "" },
          { tex: `\\frac{${Vs}}{Ls+R}`, why: "The step's own 1/s is missing. A step input is not a constant in the s-domain — it is <b>V/s</b>." },
          { tex: `\\frac{${Vs}\\,s}{Ls+R}`, why: "That multiplies by s rather than dividing, which would be the transform of the step's <em>derivative</em> — an impulse." },
          { tex: `\\frac{${Vs}}{s(L+Rs)}`, why: "L and R have swapped places. The inductor's impedance is sL, so s multiplies the inductance." },
        ],
        answer: 0,
        steps: [
          `In the s-domain the inductor is an impedance and Ohm's law works again:`,
          `<span class="math display" data-tex="Z_L = sL, \\qquad V(s) = \\frac{${Vs}}{s}"></span>`,
          `<span class="math display" data-tex="I(s) = \\frac{V(s)}{R + sL} = \\frac{${Vs}}{s(Ls + R)}"></span>`,
          `<b>The pole at s = 0 comes from the step and the pole at s = −R/L comes from the circuit.</b> Inverting gives a constant minus an exponential — which is Part 1's answer, arrived at without solving anything.`,
        ],
      };
    }

    return {
      stem: `An RL circuit with R = ${R} kΩ and L = ${Lmh} mH is carrying ${I0} A when its source is removed at t = 0. Transform the loop equation L·i′ + Ri = 0.`,
      choices: [
        { tex: `L\\big(sI(s) - ${I0}\\big) + RI(s) = 0`, why: "" },
        { tex: `LsI(s) + RI(s) = 0`, why: `The initial condition has been dropped. <b>ℒ{i′} = sI(s) − i(0⁻)</b>, and here i(0⁻) = ${I0} A — an inductor's current cannot jump.` },
        { tex: `L\\big(sI(s) + ${I0}\\big) + RI(s) = 0`, why: "The sign. The initial value is <b>subtracted</b> inside the derivative's transform." },
        { tex: `\\frac{L\\,I(s)}{s} + RI(s) = ${I0}`, why: "Differentiation multiplies by s; dividing by s would be integration." },
      ],
      answer: 0,
      steps: [
        `<span class="math display" data-tex="\\mathcal{L}\\{i'\\} = sI(s) - i(0^-)"></span>`,
        `The inductor's current is continuous, so ${T(`i(0^-) = i(0^+) = ${I0}\\text{ A}`)} — Part 1's rule, doing its job in the algebra:`,
        `<span class="math display" data-tex="L\\big(sI(s) - ${I0}\\big) + RI(s) = 0 \\quad\\Rightarrow\\quad I(s) = \\frac{${I0}}{s + R/L}"></span>`,
        `<b>The initial condition never had to be fitted.</b> It walked into the algebra at the transform step and came out in the answer, ${T(`i(t) = ${I0}e^{-t/\\tau}`)}. For a second-order problem that would have saved solving two simultaneous equations for two unknown constants.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "laplace",
    stem: "ℒ{f′(t)} = ?",
    tool: "sF(s) − f(0⁻)",
    because: "Differentiation becomes multiplication by s, and the initial condition arrives as an algebraic term instead of a constant to fit at the end.",
  },
  {
    part: "laplace",
    stem: "A response has F(s) = 12/[s(s+4)]. Final value?",
    tool: "lim s→0 of sF(s) = 3",
    because: "Multiplying by s cancels the step's pole at the origin; the theorem is only valid if the response actually settles.",
  },
  {
    part: "laplace",
    stem: "What does a pole at s = −5 correspond to in time?",
    tool: "e^(−5t) — a decay with τ = 0.2 s",
    because: "A pole's distance from the origin along the negative real axis is 1/τ, which is the reading the whole s-plane rests on.",
  },
  {
    part: "laplace",
    stem: "f(t) transforms to F(s). What does e^(−at)f(t) transform to?",
    tool: "F(s + a) — the poles shift left by a",
    because: "That is how the damped-sine table entry is built from the plain-sine one, so there is one fewer line to memorise.",
  },
]);

/* ==========================================================================
   Part 4 — transfer functions and the s-plane (7.D)
   ========================================================================== */

defineProblem("s-impedance", {
  topic: "Impedances in the s-domain",
  lookup: "Electrical → Linear Systems → Transfer functions",
  make(rng) {
    const q = rng.pick(["which", "divider", "divider", "order"]);

    if (q === "which") {
      const [el, z, why] = rng.pick([
        ["a resistor", "R", "No frequency dependence at all, which is why a purely resistive circuit has no poles and no transient."],
        ["an inductor", "sL", "Differentiation is multiplication by s, and v = L·di/dt — so the inductor's impedance carries the s."],
        ["a capacitor", "1/sC", "Integration is division by s, and v = (1/C)∫i dt. <b>The capacitor's 1/s is what puts poles in the denominator</b> of nearly every transfer function you will write."],
      ]);
      const all = ["R", "sL", "1/sC", "sC"];
      return {
        stem: `In the s-domain, what is the impedance of ${el}?`,
        choices: [
          { text: z, why: "" },
          ...all.filter((a) => a !== z).map((a) => ({
            text: a,
            why: a === "sC"
              ? "<b>Upside down.</b> sC is the capacitor's <em>admittance</em>; its impedance is the reciprocal, and confusing the two inverts the whole transfer function."
              : `That is ${a === "R" ? "a resistor" : a === "sL" ? "an inductor" : "a capacitor"}.`,
          })),
        ],
        answer: 0,
        steps: [
          `<span class="math display" data-tex="Z_R = R, \\qquad Z_L = sL, \\qquad Z_C = \\frac{1}{sC}"></span>`,
          why,
          `<b>These three lines are the whole bridge from a circuit to a transfer function.</b> Substitute them and every technique from Circuit Analysis — series, parallel, dividers, node analysis — works unchanged, with s in place of numbers.`,
        ],
      };
    }

    if (q === "divider") {
      const lowpass = rng.pick([true, false]);
      const rc = lowpass
        ? { name: "a resistor in series and a capacitor to ground, output across the capacitor",
            H: "\\frac{1}{1+sRC}", kind: "low-pass",
            why: "At DC (s = 0) the capacitor is an open circuit and all the input appears at the output; at high frequency it is a short and the output vanishes." }
        : { name: "a capacitor in series and a resistor to ground, output across the resistor",
            H: "\\frac{sRC}{1+sRC}", kind: "high-pass",
            why: "At DC the capacitor blocks and nothing gets through — which is what the <b>zero at the origin</b> in the numerator says; at high frequency it is a short and everything does." };
      return {
        stem: `A circuit is ${rc.name}. What is H(s) = V_out/V_in?`,
        choices: [
          { tex: rc.H, why: "" },
          { tex: lowpass ? "\\frac{sRC}{1+sRC}" : "\\frac{1}{1+sRC}",
            why: `That is the other one — the ${lowpass ? "high" : "low"}-pass. Check the behaviour at DC: ${lowpass ? "here the capacitor is an <b>open circuit</b>, so the output should equal the input, and this expression gives 0." : "here the capacitor <b>blocks</b>, so the output should be 0, and this expression gives 1."}` },
          { tex: "\\frac{1+sRC}{sRC}", why: "Inverted. A passive divider cannot have a magnitude greater than one." },
          { tex: "\\frac{1}{sRC}", why: "That is a pure integrator, with its pole at the origin. A passive RC has its pole at −1/RC, not at 0." },
        ],
        answer: 0,
        steps: [
          `Substitute the s-domain impedances and it is the divider from Circuit Analysis Part 2, unchanged:`,
          lowpass
            ? `<span class="math display" data-tex="H(s) = \\frac{1/sC}{R + 1/sC} = \\frac{1}{1+sRC}"></span>`
            : `<span class="math display" data-tex="H(s) = \\frac{R}{R + 1/sC} = \\frac{sRC}{1+sRC}"></span>`,
          `Multiply top and bottom by s to clear the fraction — that is the whole derivation.`,
          `<b>${rc.kind}.</b> ${rc.why} Note that <b>both circuits have the same pole</b>, at −1/RC: the pole comes from the loop, and swapping which element you measure across changes only the numerator.`,
        ],
      };
    }

    const n = rng.pick([1, 2, 2, 3]);
    const parts = { 1: "one capacitor", 2: "one inductor and one capacitor", 3: "two capacitors and one inductor" }[n];
    return {
      stem: `A passive circuit contains ${parts} (and any number of resistors). What is the order of its transfer function?`,
      choices: options(
        { text: `${n}`, why: "" },
        [
          { text: `${n + 1}`, why: "One too many. <b>Resistors do not add order</b> — they have no s in their impedance, so they cannot contribute a pole." },
          { text: `${Math.max(1, n - 1)}`, why: "One too few. Count every independent energy-storage element: each capacitor and each inductor contributes one." },
          { text: `${2 * n}`, why: "Each storage element contributes <b>one</b> pole, not two. A second-order system needs two elements, which is why an RLC circuit rings and an RC one cannot." },
        ]),
      answer: 0,
      steps: [
        `The order of a system is the number of <b>independent energy-storage elements</b> — capacitors and inductors. Resistors dissipate; they do not store, and their impedance has no s in it.`,
        `${parts.charAt(0).toUpperCase() + parts.slice(1)} gives <b>order ${n}</b>, so the denominator of H(s) is a polynomial of degree ${n} and there are ${n} poles.`,
        `<b>This is worth checking before doing any algebra.</b> A circuit with one capacitor cannot ring, whatever the resistors do — ringing needs two stores to pass energy between, which is exactly Part 2's argument counted rather than reasoned.`,
      ],
    };
  },
});

defineProblem("pole-read", {
  topic: "Reading a pole",
  lookup: "Electrical → Linear Systems → Transfer functions",
  make(rng) {
    const q = rng.pick(["tau", "stable", "ring", "geom"]);

    if (q === "tau") {
      const a = rng.pick([2, 4, 5, 10, 20, 50, 100]);
      const tau = 1 / a;
      return {
        stem: `A system has a single pole at s = −${a}. What is its time constant?`,
        choices: options(
          { text: `${num(tau, 3)} s`, why: "" },
          [
            { text: `${num(a, 0)} s`, why: "That is the pole location, which is a <b>rate</b> in s⁻¹. The time constant is its reciprocal." },
            { text: `${num(tau * 2, 3)} s`, why: "Doubled. There is no factor of 2 between a pole and a time constant." },
            { text: `${num(2 * Math.PI / a, 3)} s`, why: "That converts a frequency to a period, which is the right instinct for a pole on the imaginary axis and the wrong one for a pole on the real axis." },
          ]),
        answer: 0,
        steps: [
          `A pole at −a means a term ${T("e^{-at}")} in the response, and a decaying exponential's time constant is the reciprocal of its rate:`,
          `<span class="math display" data-tex="\\tau = \\frac{1}{a} = \\frac{1}{${a}} = ${num(tau, 3)}\\text{ s}"></span>`,
          `<b>${num(tau, 3)} s</b>, so it settles in about 5τ = ${num(5 * tau, 3)} s. <b>The pole's distance from the origin along the negative real axis is 1/τ</b> — the further left, the faster. That single reading is what makes the s-plane worth drawing.`,
        ],
      };
    }

    if (q === "stable") {
      const poles = rng.pick([
        ["−2, −5", true, "Both in the left half-plane, so both terms decay."],
        ["−1 ± j4", true, "The <b>real part</b> is what matters, and it is negative. A large imaginary part means fast ringing, not instability."],
        ["+3, −8", false, "One pole in the <b>right half-plane</b>. It only takes one: that term grows as e^(3t) and eventually dominates everything."],
        ["0, −4", false, "A pole exactly <b>on</b> the imaginary axis. It neither grows nor decays, so the response never settles — <em>marginally</em> stable, which is not stable."],
        ["−0.1 ± j50", true, "Barely damped and it rings for a very long time, but the real part is negative, so it does settle. <b>Slow is not the same as unstable.</b>"],
      ]);
      return {
        stem: `A system has poles at s = ${poles[0]}. Is it stable?`,
        choices: [
          { text: poles[1] ? "Yes" : "No", why: "" },
          { text: poles[1] ? "No" : "Yes", why: poles[2] },
          { text: "Only for some inputs", why: "Stability in this sense is a property of the <b>system</b>, not of the input — it is decided entirely by where the poles are." },
          { text: "Not enough information — the zeros are needed", why: "Zeros shape the response and can make it look strange, but <b>they cannot make it grow</b>. Only poles decide stability." },
        ],
        answer: 0,
        steps: [
          `<b>Every pole must have a strictly negative real part.</b> Nothing else matters: not the zeros, not the gain, not the input.`,
          poles[2],
          `The rule is worth stating as a picture rather than an inequality: <b>the left half-plane is stable, the imaginary axis is the boundary, and anything to the right of it grows.</b> A pole <em>on</em> the axis is the marginal case — an undamped oscillation or, at the origin, a pure integrator.`,
        ],
      };
    }

    if (q === "ring") {
      const sig = rng.pick([2, 5, 10, 20]);
      const om = rng.pick([20, 50, 100, 200]);
      const wn = Math.hypot(sig, om);
      const z = sig / wn;
      return {
        stem: `A second-order system has poles at s = −${sig} ± j${om}. What are ωn and ζ?`,
        choices: options(
          { text: `ωn = ${fixed(wn, 1)}, ζ = ${fixed(z, 3)}`, why: "" },
          [
            { text: `ωn = ${om}, ζ = ${fixed(z, 3)}`, why: "ωn is the pole's <b>distance from the origin</b>, √(σ² + ω²) — not its imaginary part. The imaginary part is ωd, which is always the smaller of the two." },
            { text: `ωn = ${fixed(wn, 1)}, ζ = ${fixed(om / wn, 3)}`, why: "ζ is the cosine of the angle from the <b>negative real axis</b>, which is σ/ωn. You have used the sine." },
            { text: `ωn = ${sig + om}, ζ = ${fixed(sig / om, 3)}`, why: "The parts have been added rather than combined as a hypotenuse." },
          ]),
        answer: 0,
        steps: [
          `The pole is a point, and both answers are its polar coordinates:`,
          `<span class="math display" data-tex="\\omega_n = \\sqrt{\\sigma^2 + \\omega_d^2} = \\sqrt{${sig}^2 + ${om}^2} = ${fixed(wn, 2)}"></span>`,
          `<span class="math display" data-tex="\\zeta = \\frac{\\sigma}{\\omega_n} = \\frac{${sig}}{${fixed(wn, 2)}} = ${fixed(z, 3)} = \\cos ${fixed(Math.acos(z) * 180 / Math.PI, 1)}^\\circ"></span>`,
          `<b>Distance is ωn, and the cosine of the angle is ζ.</b> That is the whole conversion, and it goes both ways — given ωn and ζ you can place the pole without writing an equation.`,
        ],
      };
    }

    return {
      stem: "Two poles have the same distance from the imaginary axis but different heights. What do they have in common?",
      choices: [
        { text: "The same settling time", why: "" },
        { text: "The same ringing frequency", why: "That is set by the <b>height</b>, which is precisely what differs here." },
        { text: "The same ωn", width: "", why: "ωn is the distance from the <b>origin</b>, so it differs when the heights do." },
        { text: "The same damping ratio", why: "ζ is the cosine of the angle from the negative real axis, so it changes as soon as the height does." },
      ].map(({ text, why }) => ({ text, why })),
      answer: 0,
      steps: [
        `Settling time depends on the envelope, which decays as ${T("e^{-\\sigma t}")} — and σ is the <b>horizontal</b> distance from the imaginary axis.`,
        `<span class="math display" data-tex="t_s \\approx \\frac{4}{\\sigma}"></span>`,
        `<b>Vertical lines in the s-plane are lines of constant settling time.</b> The companion facts are worth holding together: <b>radial lines</b> through the origin are constant ζ (and therefore constant overshoot), and <b>circles</b> about the origin are constant ωn. Three families of curves, three specifications.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "transfer",
    stem: "s-domain impedance of an inductor and a capacitor?",
    tool: "sL and 1/sC",
    because: "With those substitutions every Circuit Analysis technique works unchanged, with s in place of numbers.",
  },
  {
    part: "transfer",
    stem: "A system has poles at −2 and +3. Stable?",
    tool: "no — one pole in the right half-plane",
    because: "It takes only one: that term grows without limit and eventually dominates everything else.",
  },
  {
    part: "transfer",
    stem: "A single pole at s = −25. Time constant?",
    tool: "1/25 = 40 ms",
    because: "A pole's distance from the origin along the real axis is 1/τ, so further left is faster.",
  },
  {
    part: "transfer",
    stem: "Poles at −3 ± j4. ωn and ζ?",
    tool: "ωn = 5 (the distance), ζ = 3/5 = 0.6 (the cosine)",
    because: "The pole is a point in polar coordinates: its radius is ωn and the cosine of its angle from the negative real axis is ζ.",
  },
]);

/* ==========================================================================
   Part 5 — frequency response (7.A)
   ========================================================================== */

defineProblem("corner-freq", {
  topic: "Corner frequency and dB",
  lookup: "Electrical → Linear Systems → Frequency response",
  make(rng) {
    const q = rng.pick(["corner", "corner", "db", "half"]);

    if (q === "corner") {
      const R = rng.pick([1, 2, 4.7, 10, 22]);          // kΩ
      const Cnf = rng.pick([1, 10, 22, 47, 100]);       // nF
      const wc = 1 / (R * 1000 * Cnf * 1e-9);
      const fc = wc / (2 * Math.PI);
      const asked = rng.pick(["w", "f"]);
      const val = asked === "w" ? wc : fc;
      const unit = asked === "w" ? "rad/s" : "Hz";
      return {
        stem: `An RC low-pass filter has R = ${num(R, 1)} kΩ and C = ${num(Cnf, 0)} nF. What is its corner frequency in ${asked === "w" ? "rad/s" : "Hz"}?`,
        choices: options(
          { text: `${num(val, 0)} ${unit}`, why: "" },
          [
            { text: `${num(asked === "w" ? fc : wc, 0)} ${unit}`,
              why: asked === "w"
                ? "That is in <b>hertz</b>. The question asks for rad/s, which is 2π times larger."
                : "That is in <b>rad/s</b>. Divide by 2π for hertz." },
            { text: `${num(R * 1000 * Cnf * 1e-9, 6)} ${unit}`, why: "That is RC — the time constant, in seconds. The corner frequency is its reciprocal." },
            { text: `${num(val * 2, 0)} ${unit}`, why: "Twice too large; there is no factor of 2 in 1/RC." },
          ]),
        answer: 0,
        steps: [
          `The corner is where the reactance equals the resistance, which is the reciprocal of the time constant:`,
          `<span class="math display" data-tex="\\omega_c = \\frac{1}{RC} = \\frac{1}{(${num(R, 1)}\\times10^3)(${num(Cnf, 0)}\\times10^{-9})} = ${num(wc, 0)}\\text{ rad/s}"></span>`,
          `<span class="math display" data-tex="f_c = \\frac{\\omega_c}{2\\pi} = ${num(fc, 0)}\\text{ Hz}"></span>`,
          `<b>${num(val, 0)} ${unit}.</b> The corner is the same number as the pole location, which is the same number as 1/τ — <b>three names for one quantity</b>, and knowing that they are one thing is most of what this topic asks.`,
        ],
      };
    }

    if (q === "db") {
      const [ratio, db, why] = rng.pick([
        [2, 6.02, "A factor of two in <b>voltage</b> is 6 dB. This is the one to anchor everything else to."],
        [10, 20, "A factor of ten in voltage is 20 dB, by definition of the decade."],
        [0.5, -6.02, "Half the voltage is −6 dB. Halving and doubling are symmetric in dB, which is the point of using them."],
        [Math.SQRT1_2, -3.01, "1/√2 is <b>−3.01 dB</b>, the half-power point — the voltage is down by √2 and therefore the power by 2."],
        [100, 40, "Two decades. dB add, so two factors of ten are 20 + 20."],
      ]);
      return {
        stem: `A voltage gain of ${ratio === Math.SQRT1_2 ? "1/√2" : num(ratio, 2)} is how many decibels?`,
        choices: options(
          { text: `${fixed(db, 2)} dB`, why: "" },
          [
            { text: `${fixed(db / 2, 2)} dB`, why: "That is the <b>power</b> figure, 10·log₁₀. For a voltage ratio the multiplier is 20." },
            { text: `${fixed(-db, 2)} dB`, why: "The sign. A gain greater than one is positive dB; less than one is negative." },
            { text: `${fixed(db * 2, 2)} dB`, why: "Twice too many — 20·log₁₀, not 40." },
          ]),
        answer: 0,
        steps: [
          `<span class="math display" data-tex="\\text{dB} = 20\\log_{10}\\left|\\frac{V_{out}}{V_{in}}\\right| = 20\\log_{10}(${ratio === Math.SQRT1_2 ? "1/\\sqrt{2}" : num(ratio, 2)}) = ${fixed(db, 2)}\\text{ dB}"></span>`,
          why,
          `<b>Three anchors carry almost every dB question: ×2 is 6 dB, ×10 is 20 dB, and 1/√2 is −3 dB.</b> Everything else is those added together, because dB turn multiplication into addition — which is the only reason the unit exists.`,
        ],
      };
    }

    return {
      stem: "Why is the corner frequency also called the half-power point?",
      choices: [
        { text: "The gain there is 1/√2, so the power is half", why: "" },
        { text: "The gain there is 1/2", why: "That would be −6 dB. The <b>voltage</b> is down by √2, not 2 — and power goes as voltage squared, so it is the power that halves." },
        { text: "Half the input power is reflected", why: "Reflection is a transmission-line idea. Here the power is simply not delivered to the output." },
        { text: "The phase has moved by half of 90°", why: "It has — the phase is exactly −45° there — but that is a separate coincidence of the same point, not what the name refers to." },
      ],
      answer: 0,
      steps: [
        `At the corner the reactance equals the resistance, so the magnitude of the divider is`,
        `<span class="math display" data-tex="|H| = \\frac{1}{\\sqrt{1^2+1^2}} = \\frac{1}{\\sqrt{2}} = 0.707 \\quad \\Rightarrow \\quad -3.01\\text{ dB}"></span>`,
        `Power goes as the square of voltage, so ${T("(1/\\sqrt2)^2 = 1/2")}: <b>half the power</b>.`,
        `The same point also has the phase at exactly <b>−45°</b>, halfway through its 90° swing. Three facts at one frequency — 1/√2, −3 dB and −45° — and they are all worth recognising on sight.`,
      ],
    };
  },
});

defineProblem("bode-sketch", {
  topic: "Reading a Bode plot",
  lookup: "Electrical → Linear Systems → Frequency response",
  make(rng) {
    const q = rng.pick(["slope", "slope", "phase", "which"]);

    if (q === "slope") {
      const np = rng.pick([1, 2, 3]);
      const nz = rng.pick([0, 0, 1]);
      const slope = -20 * np + 20 * nz;
      return {
        stem: `Well above all its corners, a transfer function has ${np} pole${np > 1 ? "s" : ""} and ${nz} zero${nz === 1 ? "" : "s"}. What is the slope of its Bode magnitude plot there?`,
        choices: options(
          { text: `${slope > 0 ? "+" : slope < 0 ? "−" : ""}${Math.abs(slope)} dB/decade`, why: "" },
          [
            { text: `${-slope > 0 ? "+" : "−"}${Math.abs(slope)} dB/decade`, why: "The sign is inverted. <b>Poles bend the plot down and zeros bend it up</b>, so an excess of poles gives a falling slope." },
            { text: `−${20 * (np + nz)} dB/decade`, why: "The zeros have been added to the poles rather than subtracted. They pull in opposite directions." },
            { text: `−${20 * np} dB/decade`, why: nz ? "The zero has been ignored. It contributes +20 dB/decade above its own corner." : "That is correct in magnitude — check the sign convention." },
          ]),
        answer: 0,
        steps: [
          `Each pole contributes <b>−20 dB/decade</b> above its corner, and each zero <b>+20</b>. Above every corner they all apply, and the slopes simply add:`,
          `<span class="math display" data-tex="\\text{slope} = -20(${np}) + 20(${nz}) = ${slope}\\text{ dB/decade}"></span>`,
          `<b>${slope} dB/decade.</b> This is the whole rule for sketching a Bode magnitude plot: <b>start flat, and at each corner add 20 dB/decade of slope — down for a pole, up for a zero.</b> The straight lines are never more than 3 dB from the truth, and only at the corners themselves.`,
        ],
      };
    }

    if (q === "phase") {
      const kind = rng.pick(["single", "corner", "decade"]);
      const Q = {
        single: {
          stem: "What is the total phase shift of a single-pole low-pass filter, from DC to very high frequency?",
          right: "−90°",
          wrong: [["−45°", "That is the phase <b>at the corner</b> — halfway through the swing, not the whole of it."],
                  ["−180°", "That is two poles' worth. One pole contributes 90°."],
                  ["0°", "The phase is 0° at DC, but it does not stay there."]],
          why: "Each pole contributes 90° of lag in total, and each zero 90° of lead. <b>Count the poles and zeros and you know the phase at both ends</b> without drawing anything.",
        },
        corner: {
          stem: "At its corner frequency, what is the phase of a single-pole low-pass filter?",
          right: "−45°",
          wrong: [["−90°", "That is the value it approaches at very high frequency, not the value at the corner."],
                  ["0°", "That is the low-frequency value."],
                  ["−3°", "−3 is the <b>magnitude</b> figure, in decibels. The phase is in degrees and is −45° there."]],
          why: "The corner is the midpoint of the phase transition as well as the −3 dB point of the magnitude. <b>Three facts at one frequency: gain 1/√2, −3.01 dB, phase −45°.</b>",
        },
        decade: {
          stem: "Over roughly what frequency range does a single pole's phase shift happen?",
          right: "About a decade either side of the corner",
          wrong: [["Entirely at the corner", "The magnitude asymptotes break sharply at the corner, but the phase is a gradual S — which is why phase margin is harder to estimate by eye than gain."],
                  ["Over about an octave", "Too narrow. At one octave above the corner the phase is only about −63°, still well short of −90°."],
                  ["Over the whole frequency axis", "Too wide. A decade either side gets it to within about 6° of both ends."]],
          why: "At a tenth of the corner the phase is about −6°, and at ten times it is about −84°. <b>The magnitude turns at a point; the phase turns over two decades.</b> That difference is the reason a system can look comfortable on a magnitude plot and be close to instability on a phase one.",
        },
      }[kind];
      return {
        stem: Q.stem,
        choices: [{ text: Q.right, why: "" }, ...Q.wrong.map(([t, w]) => ({ text: t, why: w }))],
        answer: 0,
        steps: [`<b>${Q.right}.</b>`, Q.why],
      };
    }

    const shape = rng.pick([
      ["rises at 20 dB/decade, then flattens", "high-pass", "A zero at the origin gives the rising slope; the pole flattens it at the corner."],
      ["is flat, then falls at 20 dB/decade", "low-pass", "One pole, and nothing else. The commonest shape there is."],
      ["falls at 20 dB/decade everywhere, with no corner", "integrator", "A pole at the <b>origin</b>: it is already above its own corner at every frequency, so the slope never changes."],
      ["rises, is flat over a band, then falls", "band-pass", "A zero at the origin, then two poles — one ending the rise and one starting the fall."],
    ]);
    return {
      stem: `A Bode magnitude plot ${shape[0]}. What kind of filter is it?`,
      choices: [
        { text: shape[1].charAt(0).toUpperCase() + shape[1].slice(1), why: "" },
        ...["low-pass", "high-pass", "band-pass", "integrator"].filter((k) => k !== shape[1])
          .slice(0, 3).map((k) => ({
            text: k.charAt(0).toUpperCase() + k.slice(1),
            why: `A ${k} does not have that shape — sketch its asymptotes and compare.`,
          })),
      ],
      answer: 0,
      steps: [
        `<b>${shape[1].charAt(0).toUpperCase() + shape[1].slice(1)}.</b> ${shape[2]}`,
        `Reading a Bode plot backwards is the same rule run in reverse: <b>every downward break of 20 dB/decade is a pole, every upward break is a zero</b>, and the frequency of the break is where it sits.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "frequency",
    stem: "An RC low-pass with R = 10 kΩ and C = 10 nF. Corner frequency?",
    tool: "ωc = 1/RC = 10 krad/s (1.59 kHz)",
    because: "The corner, the pole location and 1/τ are three names for one number.",
  },
  {
    part: "frequency",
    stem: "A voltage gain of 1/√2, in decibels?",
    tool: "−3.01 dB — the half-power point",
    because: "Power goes as voltage squared, so the voltage falls by √2 while the power halves.",
  },
  {
    part: "frequency",
    stem: "Two poles and one zero. Slope well above every corner?",
    tool: "−20(2) + 20(1) = −20 dB/decade",
    because: "Poles bend the plot down and zeros bend it up, and above every corner the slopes simply add.",
  },
  {
    part: "frequency",
    stem: "The phase of a single-pole low-pass at its corner?",
    tool: "−45°, half of its total 90°",
    because: "The magnitude turns at a point but the phase turns over two decades, which is why phase is the harder one to eyeball.",
  },
]);
