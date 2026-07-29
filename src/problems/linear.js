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
