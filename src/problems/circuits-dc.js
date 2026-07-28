/* ==========================================================================
   problems/circuits-dc.js — generators for Circuit Analysis Parts 1 to 4.

   House rules unchanged from Mathematics: friendly numbers, distractors made
   by committing the actual error, and a `why` on every wrong option naming
   the mistake it represents.
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed } from "../lib/fmt.js";
import { parallel, solve } from "../lib/circuit.js";

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;
const S = (v) => num(v).replace("−", "-");

/* ==========================================================================
   KCL at a node
   ========================================================================== */

defineProblem("kcl-node", {
  topic: "Kirchhoff's Current Law",
  lookup: "Electrical → Circuit analysis → Kirchhoff's laws",
  make(rng) {
    const n = rng.int(3, 4);
    const known = [];
    for (let i = 0; i < n - 1; i++) known.push(rng.nz(-12, 14));
    // the unknown branch is whatever makes the node balance
    const unknown = -known.reduce((a, b) => a + b, 0);
    if (Math.abs(unknown) < 1 || Math.abs(unknown) > 30) return this.make(rng);

    const desc = known.map((v, i) =>
      `${T(`I_${i + 1}`)} = ${S(v)} A ${v > 0 ? "into" : "out of"} the node`
    );
    // as written, the listed currents are signed *into* the node
    const inSum = known.reduce((a, b) => a + b, 0);

    return {
      stem:
        `${n} branches meet at a node. Taking current <b>into</b> the node as positive, ` +
        known.map((v, i) => `${T(`I_${i + 1}`)} = ${S(v)} A`).join(", ") +
        `. What is the remaining branch current ${T(`I_${n}`)}, in the same convention?`,
      choices: [
        { text: `${S(unknown)} A`, why: "" },
        { text: `${S(-unknown)} A`, why: "Sign flipped. The listed currents sum to " + S(inSum) + " A into the node, so the last branch must carry that back <em>out</em> — which in this convention is the negative of it." },
        { text: `${S(known.reduce((a, b) => a + Math.abs(b), 0))} A`,
          why: "The magnitudes were added without their signs. Direction is the whole content of KCL." },
        { text: `0 A`, why: "That would only be true if the listed currents already balanced, and they sum to " + S(inSum) + " A." },
      ],
      answer: 0,
      steps: [
        `KCL says a node stores nothing, so every branch current at it sums to zero in a consistent convention:` +
          `<span class="math display" data-tex="\\sum_{\\text{node}} I = 0"></span>`,
        `The known branches sum to ${known.map(S).join(" + ").replace(/\+ -/g, "− ")} = <b>${S(inSum)} A</b> flowing in.`,
        `So the last branch must carry <b>${S(unknown)} A</b> in this convention` +
          (unknown < 0 ? ` — that is, ${S(-unknown)} A flowing <em>out</em> of the node.` : `.`) +
          ` <b>A negative answer is not an error</b>: it means the physical current runs opposite to the assumed arrow.`,
      ],
    };
  },
});

/* ==========================================================================
   KVL round a loop
   ========================================================================== */

defineProblem("kvl-loop", {
  topic: "Kirchhoff's Voltage Law",
  lookup: "Electrical → Circuit analysis → Kirchhoff's laws",
  make(rng) {
    const Vs = rng.pick([12, 20, 24, 48, 100]);
    const R1 = rng.pick([2, 3, 4, 5, 6]);
    const R2 = rng.pick([4, 6, 8, 10, 12]);
    const R3 = rng.pick([2, 3, 5, 8]);
    const I = Vs / (R1 + R2 + R3);
    const v2 = I * R2;

    return {
      stem:
        `A single loop contains a ${Vs} V source and three resistors in series: ` +
        `${R1} Ω, ${R2} Ω and ${R3} Ω. What is the voltage across the ${R2} Ω resistor?`,
      choices: [
        { text: `${fixed(v2, 2)} V`, why: "" },
        { text: `${fixed(Vs * R2 / Math.max(R1, R3, R2), 2)} V`,
          why: "The divider denominator must be the <b>total</b> of all three resistances, not the largest one." },
        { text: `${fixed(Vs / 3, 2)} V`,
          why: "The source splits in proportion to resistance, not equally — the three resistors are different sizes." },
        { text: `${fixed(Vs - v2, 2)} V`,
          why: "That is what the other two resistors share between them. The three drops must add to " + Vs + " V." },
      ],
      answer: 0,
      steps: [
        `In a single loop there is one current everywhere. KVL round it:` +
          `<span class="math display" data-tex="${Vs} - I(${R1}) - I(${R2}) - I(${R3}) = 0"></span>`,
        `<span class="math display" data-tex="I = \\frac{${Vs}}{${R1} + ${R2} + ${R3}} = \\frac{${Vs}}{${R1 + R2 + R3}} = ${fixed(I, 3)}\\text{ A}"></span>`,
        `Then Ohm's law on that one resistor: ${T(`V = (${fixed(I, 3)})(${R2}) = ${fixed(v2, 2)}`)} V. ` +
          `<b>Check:</b> the three drops are ${fixed(I * R1, 2)} + ${fixed(v2, 2)} + ${fixed(I * R3, 2)} = ` +
          `${fixed(Vs, 2)} V, which is the source ✓`,
      ],
    };
  },
});

/* ==========================================================================
   Ohm's law and the three power forms
   ========================================================================== */

defineProblem("ohm-power", {
  topic: "Power in a resistor",
  lookup: "Electrical → Circuit analysis → Ohm's law, power",
  make(rng) {
    const R = rng.pick([2, 4, 5, 8, 10, 20, 50]);
    const known = rng.pick(["V", "I"]);
    const I = rng.pick([0.5, 1, 1.5, 2, 3, 5]);
    const Vv = I * R;
    const P = I * I * R;

    return {
      stem: known === "I"
        ? `A ${R} Ω resistor carries ${num(I)} A. How much power does it dissipate?`
        : `A ${R} Ω resistor has ${num(Vv)} V across it. How much power does it dissipate?`,
      choices: [
        { text: `${fixed(P, 2)} W`, why: "" },
        { text: known === "I" ? `${fixed(I * R, 2)} W` : `${fixed(Vv / R, 2)} W`,
          why: known === "I"
            ? `That is the <em>voltage</em> across it, in volts. Power needs ${T("I^2R")}, not ${T("IR")}.`
            : `That is the <em>current</em> through it, in amps. Power needs ${T("V^2/R")}, not ${T("V/R")}.` },
        { text: known === "I" ? `${fixed(I * I / R, 3)} W` : `${fixed(Vv * Vv * R, 0)} W`,
          why: known === "I"
            ? `Divided by R instead of multiplying. ${T("I^2R")} — the resistance is on top when you know the current.`
            : `Multiplied by R instead of dividing. ${T("V^2/R")} — the resistance is underneath when you know the voltage.` },
        { text: `${fixed(P * 2, 2)} W`, why: "Off by a factor of two. There is no ½ in DC power — that factor belongs to AC peak values, which Part 5 gets to." },
      ],
      answer: 0,
      steps: [
        `Pick the power form that matches what you were given. ` +
          (known === "I"
            ? `You know the current, so use ${T("P = I^2R")} and skip finding the voltage.`
            : `You know the voltage, so use ${T("P = V^2/R")} and skip finding the current.`),
        known === "I"
          ? `<span class="math display" data-tex="P = (${num(I)})^2(${R}) = ${fixed(P, 2)}\\text{ W}"></span>`
          : `<span class="math display" data-tex="P = \\frac{(${num(Vv)})^2}{${R}} = ${fixed(P, 2)}\\text{ W}"></span>`,
        `<b>${fixed(P, 2)} W.</b> Cross-check the other way: ` +
          `${T(`V = ${num(Vv)}`)} V and ${T(`I = ${num(I)}`)} A, so ${T(`P = VI = ${fixed(P, 2)}`)} W ✓`,
      ],
    };
  },
});

/* ==========================================================================
   Power balance across a whole circuit
   ========================================================================== */

defineProblem("power-balance", {
  topic: "Power balance",
  lookup: "Electrical → Circuit analysis → Power, conservation of energy",
  make(rng) {
    const Vs = rng.pick([12, 24, 48, 100]);
    const Rs = rng.pick([1, 2, 4]);
    const Ra = rng.pick([6, 8, 12]);
    const Rb = rng.pick([3, 4, 6]);
    const Rp = parallel(Ra, Rb);
    const Rt = Rs + Rp;
    const It = Vs / Rt;
    const Vp = It * Rp;
    const Pt = Vs * It;
    const Ps = It * It * Rs;
    const Pa = (Vp * Vp) / Ra, Pb = (Vp * Vp) / Rb;
    const askHotter = rng.chance(0.45);

    if (askHotter) {
      const hotter = Ra < Rb ? Ra : Rb;
      return {
        stem:
          `A ${Ra} Ω and a ${Rb} Ω resistor are connected <b>in parallel</b> across the same ` +
          `${fixed(Vp, 1)} V. Which dissipates more power, and by what factor?`,
        choices: [
          { text: `the ${hotter} Ω, by a factor of ${fixed(Math.max(Ra, Rb) / Math.min(Ra, Rb), 2)}`, why: "" },
          { text: `the ${Ra > Rb ? Ra : Rb} Ω, by a factor of ${fixed(Math.max(Ra, Rb) / Math.min(Ra, Rb), 2)}`,
            why: `In parallel both see the same voltage, so ${T("P = V^2/R")} makes the <b>smaller</b> resistor the hotter one. The intuition from series circuits is backwards here.` },
          { text: "they dissipate equally", why: "Only if they were equal resistances. Same voltage across different resistances means different currents and different powers." },
          { text: `the ${hotter} Ω, by a factor of ${fixed(Math.sqrt(Math.max(Ra, Rb) / Math.min(Ra, Rb)), 2)}`,
            why: "The ratio is not square-rooted. With voltage held fixed, power is inversely proportional to R directly." },
        ],
        answer: 0,
        steps: [
          `Parallel means <b>the same voltage</b> across both, so use the form with voltage in it:` +
            `<span class="math display" data-tex="P = \\frac{V^2}{R}"></span>`,
          `${T(`P_{${Ra}} = \\frac{${fixed(Vp, 1)}^2}{${Ra}} = ${fixed(Pa, 1)}`)} W and ` +
            `${T(`P_{${Rb}} = \\frac{${fixed(Vp, 1)}^2}{${Rb}} = ${fixed(Pb, 1)}`)} W.`,
          `The <b>${hotter} Ω</b> is hotter, by ${fixed(Math.max(Ra, Rb) / Math.min(Ra, Rb), 2)}×. ` +
            `<b>Had they been in series</b> the current would be shared instead, ${T("P = I^2R")} would apply, ` +
            `and the <em>larger</em> resistor would be the hotter one. Same parts, opposite answer.`,
        ],
      };
    }

    return {
      stem:
        `A ${Vs} V source drives ${Rs} Ω in series with a parallel pair of ${Ra} Ω and ${Rb} Ω. ` +
        `What total power does the source deliver?`,
      choices: [
        { text: `${fixed(Pt, 1)} W`, why: "" },
        { text: `${fixed((Vs * Vs) / (Rs + Ra + Rb), 1)} W`,
          why: "The two parallel resistors were added as if in series. In parallel the equivalent is <b>smaller</b> than either." },
        { text: `${fixed(Ps, 1)} W`, why: `That is only what the ${Rs} Ω series resistor burns. The source supplies every element.` },
        { text: `${fixed((Vs * Vs) / Rp, 1)} W`, why: "The series resistance was left out of the total, so the current came out too high." },
      ],
      answer: 0,
      steps: [
        `Collapse the parallel pair, then the series chain:` +
          `<span class="math display" data-tex="R_p = \\frac{(${Ra})(${Rb})}{${Ra} + ${Rb}} = ${fixed(Rp, 3)}\\ \\Omega, \\qquad R_t = ${Rs} + ${fixed(Rp, 3)} = ${fixed(Rt, 3)}\\ \\Omega"></span>`,
        `<span class="math display" data-tex="I = \\frac{${Vs}}{${fixed(Rt, 3)}} = ${fixed(It, 3)}\\text{ A}, \\qquad P = (${Vs})(${fixed(It, 3)}) = ${fixed(Pt, 1)}\\text{ W}"></span>`,
        `<b>${fixed(Pt, 1)} W.</b> <b>Check by adding up what each part burns:</b> ` +
          `${fixed(Ps, 1)} + ${fixed(Pa, 1)} + ${fixed(Pb, 1)} = ${fixed(Ps + Pa + Pb, 1)} W ✓ — ` +
          `energy in equals energy out, which is a free check on the whole solution.`,
      ],
    };
  },
});

/* ==========================================================================
   Handbook Reflex items
   ========================================================================== */

defineReflex([
  {
    part: "two-laws",
    stem: "Four wires meet at a junction; three of the currents are known. Find the fourth.",
    tool: "Kirchhoff's Current Law",
    because: "Charge cannot accumulate at a node, so the branch currents sum to zero.",
  },
  {
    part: "two-laws",
    stem: "A single loop has two sources and three resistors. Find the current.",
    tool: "Kirchhoff's Voltage Law",
    because: "One loop, one current — sum the rises and drops round it and set them to zero.",
  },
  {
    part: "two-laws",
    stem: "A 15 Ω heater element carries 4 A. How much heat does it produce?",
    tool: "P = I²R",
    because: "You know the current and the resistance, so that form needs no extra step.",
  },
  {
    part: "two-laws",
    stem: "Confirm that a solved circuit's numbers are self-consistent.",
    tool: "Power balance",
    because: "What the sources deliver must equal what the resistors dissipate.",
  },
  {
    part: "two-laws",
    stem: "Two resistors share one node pair; which runs hotter?",
    tool: "P = V²/R",
    because: "Parallel means equal voltage, so the smaller resistance dissipates more.",
  },
]);
