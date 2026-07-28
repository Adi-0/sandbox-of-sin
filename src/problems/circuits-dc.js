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

/* ==========================================================================
   Part 2 — equivalent resistance and the two dividers
   ========================================================================== */

defineProblem("equivalent-r", {
  topic: "Equivalent resistance",
  lookup: "Electrical → Circuit analysis → Series/parallel equivalent circuits",
  make(rng) {
    const kind = rng.pick(["two-par", "n-equal", "mixed"]);

    if (kind === "n-equal") {
      const R = rng.pick([10, 12, 20, 60, 100]);
      const n = rng.int(3, 5);
      return {
        stem: `What is the equivalent resistance of ${n} identical ${R} Ω resistors connected in parallel?`,
        choices: [
          { text: `${fixed(R / n, 2)} Ω`, why: "" },
          { text: `${fixed(R * n, 0)} Ω`, why: "That is the <b>series</b> total. Parallel always gives less than the smallest member." },
          { text: `${fixed(R, 0)} Ω`, why: "Adding more parallel paths must reduce the resistance — it cannot leave it unchanged." },
          { text: `${fixed(n / R, 4)} Ω`, why: `That is the total <em>conductance</em> in siemens, not the resistance. Take its reciprocal.` },
        ],
        answer: 0,
        steps: [
          `Conductances add, and here all ${n} are the same:` +
            `<span class="math display" data-tex="\\frac{1}{R_{eq}} = ${n} \\times \\frac{1}{${R}} = \\frac{${n}}{${R}}"></span>`,
          `<span class="math display" data-tex="R_{eq} = \\frac{${R}}{${n}} = ${fixed(R / n, 2)}\\ \\Omega"></span>`,
          `<b>${fixed(R / n, 2)} Ω.</b> For <em>n</em> equal resistors in parallel the answer is always ` +
            `${T("R/n")} — worth spotting on sight, because it turns a calculation into a glance.`,
        ],
      };
    }

    if (kind === "two-par") {
      const Ra = rng.pick([3, 4, 6, 8, 12, 20]);
      const Rb = rng.pick([4, 6, 12, 24, 30]);
      const Rp = parallel(Ra, Rb);
      return {
        stem: `A ${Ra} Ω and a ${Rb} Ω resistor are connected in parallel. What is the equivalent resistance?`,
        choices: [
          { text: `${fixed(Rp, 3)} Ω`, why: "" },
          { text: `${fixed(Ra + Rb, 0)} Ω`, why: "That is the series total. In parallel the result must be <b>smaller than either</b> resistor." },
          { text: `${fixed((Ra + Rb) / 2, 2)} Ω`, why: "Parallel is not an average. It is smaller than the smaller of the two." },
          { text: `${fixed(1 / Ra + 1 / Rb, 4)} Ω`, why: "The reciprocals were added but never inverted back. That figure is the conductance, in siemens." },
        ],
        answer: 0,
        steps: [
          `For two resistors, product over sum:` +
            `<span class="math display" data-tex="R_{eq} = \\frac{(${Ra})(${Rb})}{${Ra} + ${Rb}} = \\frac{${Ra * Rb}}{${Ra + Rb}} = ${fixed(Rp, 3)}\\ \\Omega"></span>`,
          `<b>Sanity check first, always:</b> the answer must be less than ${Math.min(Ra, Rb)} Ω, ` +
            `and ${fixed(Rp, 3)} is ✓`,
          `Note the shortcut is for <b>two</b> resistors only. With three, go back to summing conductances.`,
        ],
      };
    }

    // series then parallel
    const Rs = rng.pick([2, 4, 5, 10]);
    const Ra = rng.pick([6, 12, 20]);
    const Rb = rng.pick([4, 6, 30]);
    const total = Rs + parallel(Ra, Rb);
    return {
      stem:
        `A ${Rs} Ω resistor is in series with the parallel combination of ${Ra} Ω and ${Rb} Ω. ` +
        `What is the total resistance seen by the source?`,
      choices: [
        { text: `${fixed(total, 3)} Ω`, why: "" },
        { text: `${fixed(Rs + Ra + Rb, 0)} Ω`, why: "All three were added as if in series. Only the first one is in series with the group." },
        { text: `${fixed(parallel(Rs, Ra, Rb), 3)} Ω`, why: "All three were treated as parallel. The " + Rs + " Ω is in the single path the current must take first." },
        { text: `${fixed(parallel(Ra, Rb), 3)} Ω`, why: `That is only the parallel pair. The ${Rs} Ω is still in the loop and still drops voltage.` },
      ],
      answer: 0,
      steps: [
        `Work from the far end back. The ${Ra} Ω and ${Rb} Ω share both nodes, so collapse them first:` +
          `<span class="math display" data-tex="R_p = \\frac{(${Ra})(${Rb})}{${Ra}+${Rb}} = ${fixed(parallel(Ra, Rb), 3)}\\ \\Omega"></span>`,
        `That block is now a single resistor in series with the ${Rs} Ω:` +
          `<span class="math display" data-tex="R_t = ${Rs} + ${fixed(parallel(Ra, Rb), 3)} = ${fixed(total, 3)}\\ \\Omega"></span>`,
        `<b>${fixed(total, 3)} Ω.</b> The order matters: collapse the unambiguous group furthest from the source first, then work back.`,
      ],
    };
  },
});

defineProblem("voltage-divider", {
  topic: "Voltage divider",
  lookup: "Electrical → Circuit analysis → Voltage division",
  make(rng) {
    const V = rng.pick([10, 12, 20, 24, 48, 60, 100]);
    const R1 = rng.pick([1, 2, 3, 4, 5, 6, 8]);
    const R2 = rng.pick([2, 3, 4, 6, 9, 12, 16]);
    const v2 = V * R2 / (R1 + R2);

    return {
      stem:
        `A ${V} V source is across a ${R1} Ω and a ${R2} Ω resistor in series. ` +
        `What is the voltage across the ${R2} Ω?`,
      choices: [
        { text: `${fixed(v2, 2)} V`, why: "" },
        { text: `${fixed(V * R1 / (R1 + R2), 2)} V`,
          why: `That is the drop across the ${R1} Ω. The voltage divider puts the resistor's <b>own</b> value on top — it is the current divider that uses the other one.` },
        { text: `${fixed(V * R2 / R1, 2)} V`, why: "The denominator must be the <b>total</b> resistance, not the other resistor." },
        { text: `${fixed(V / 2, 2)} V`, why: "The split is even only for equal resistors, and these are not equal." },
      ],
      answer: 0,
      steps: [
        `<span class="math display" data-tex="V_2 = V\\,\\frac{R_2}{R_1 + R_2} = ${V}\\times\\frac{${R2}}{${R1 + R2}}"></span>`,
        `= <b>${fixed(v2, 2)} V</b>.`,
        `<b>Check:</b> the ${R2 > R1 ? "larger" : "smaller"} resistor should take the ` +
          `${R2 > R1 ? "larger" : "smaller"} share, and ${fixed(v2, 2)} V out of ${V} V ` +
          `${R2 > R1 ? "is more than half" : "is less than half"} ✓ The two drops add to ` +
          `${fixed(V * R1 / (R1 + R2), 2)} + ${fixed(v2, 2)} = ${V} V ✓`,
      ],
    };
  },
});

defineProblem("current-divider", {
  topic: "Current divider",
  lookup: "Electrical → Circuit analysis → Current division",
  make(rng) {
    const I = rng.pick([2, 4, 6, 10, 12, 20]);
    const R1 = rng.pick([2, 3, 4, 6, 12]);
    const R2 = rng.pick([1, 2, 4, 6, 8, 12]);
    if (R1 === R2) return this.make(rng);
    const i1 = I * R2 / (R1 + R2);

    return {
      stem:
        `A ${I} A source feeds a ${R1} Ω and a ${R2} Ω resistor in parallel. ` +
        `How much current flows in the ${R1} Ω?`,
      choices: [
        { text: `${fixed(i1, 3)} A`, why: "" },
        { text: `${fixed(I * R1 / (R1 + R2), 3)} A`,
          why: `The resistor's own value was put on top. In a <b>current</b> divider the <em>other</em> resistance goes on top, because the easier path takes the bigger share.` },
        { text: `${fixed(I / 2, 3)} A`, why: "An even split needs equal resistors." },
        { text: `${fixed(I * R2 / R1, 3)} A`, why: "The denominator must be the sum of the two resistances." },
      ],
      answer: 0,
      steps: [
        `<span class="math display" data-tex="I_1 = I\\,\\frac{R_2}{R_1 + R_2} = ${I}\\times\\frac{${R2}}{${R1 + R2}}"></span>` +
          `The <b>other</b> resistance is on top — that is the whole difference from the voltage divider.`,
        `= <b>${fixed(i1, 3)} A</b>.`,
        `<b>Check:</b> the ${Math.min(R1, R2)} Ω is the easier path, so it should carry more. ` +
          `Here the ${R1} Ω carries ${fixed(i1, 3)} A and the ${R2} Ω carries ${fixed(I - i1, 3)} A — ` +
          `${R1 < R2 ? "the smaller resistor has the larger current" : "the larger resistor has the smaller current"} ✓`,
      ],
    };
  },
});

defineProblem("ladder-reduce", {
  topic: "Ladder networks",
  lookup: "Electrical → Circuit analysis → Series/parallel reduction",
  make(rng) {
    const Ra = rng.pick([2, 4, 6]);
    const Rb = rng.pick([4, 6, 12]);
    const Rc = rng.pick([4, 12, 24]);
    const Rd = rng.pick([3, 6, 8]);
    // Rc parallel Rd, in series with Rb, all that in parallel with... keep it a ladder
    const inner = parallel(Rc, Rd);
    const mid = Rb + inner;
    const total = Ra + mid;

    return {
      stem:
        `Starting from the far end: a ${Rc} Ω and a ${Rd} Ω are in parallel; that pair is in ` +
        `series with a ${Rb} Ω; and a ${Ra} Ω is in series ahead of all of it. ` +
        `What resistance does the source see?`,
      choices: [
        { text: `${fixed(total, 3)} Ω`, why: "" },
        { text: `${fixed(Ra + Rb + Rc + Rd, 0)} Ω`, why: "Everything was added in series. The last two share both their nodes, so they must be collapsed as a parallel pair first." },
        { text: `${fixed(Ra + parallel(Rb, Rc, Rd), 3)} Ω`, why: `The ${Rb} Ω is in series with the pair, not in parallel with it.` },
        { text: `${fixed(parallel(Ra, mid), 3)} Ω`, why: `The ${Ra} Ω is in the single path ahead of the network, so it adds rather than combining in parallel.` },
      ],
      answer: 0,
      steps: [
        `<b>Always start furthest from the source</b>, where the grouping is unambiguous:` +
          `<span class="math display" data-tex="${Rc} \\parallel ${Rd} = \\frac{(${Rc})(${Rd})}{${Rc}+${Rd}} = ${fixed(inner, 3)}\\ \\Omega"></span>`,
        `That block is in series with the ${Rb} Ω:` +
          `<span class="math display" data-tex="${Rb} + ${fixed(inner, 3)} = ${fixed(mid, 3)}\\ \\Omega"></span>`,
        `And the ${Ra} Ω is in series ahead of that:` +
          `<span class="math display" data-tex="R_t = ${Ra} + ${fixed(mid, 3)} = ${fixed(total, 3)}\\ \\Omega"></span>` +
          `<b>${fixed(total, 3)} Ω.</b> Each step replaced two components with one, and the network shrank until nothing was left to combine.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "series-parallel",
    stem: "Six 60 Ω heater elements are wired in parallel across the supply. Find the total resistance.",
    tool: "R/n for equal parallel resistors",
    because: "Identical resistors in parallel divide straight down by how many there are.",
  },
  {
    part: "series-parallel",
    stem: "Two resistors are across a battery; find the voltage across one of them.",
    tool: "Voltage divider",
    because: "Series pair, so each takes a share in proportion to its own resistance.",
  },
  {
    part: "series-parallel",
    stem: "A known total current arrives at two parallel branches; find one branch's current.",
    tool: "Current divider",
    because: "Parallel pair, and the branch's share uses the <em>other</em> resistance on top.",
  },
  {
    part: "series-parallel",
    stem: "A network of five resistors must be reduced to one value at the terminals.",
    tool: "Series/parallel reduction",
    because: "Collapse the unambiguous group furthest from the terminals and work back.",
  },
]);

/* ==========================================================================
   Part 3 — node and mesh analysis
   ========================================================================== */

defineProblem("node-solve", {
  topic: "Node analysis",
  lookup: "Electrical → Circuit analysis → Node analysis",
  make(rng) {
    const Ra = rng.pick([2, 4, 5, 10]);
    const Rb = rng.pick([5, 10, 20]);
    const Is = rng.pick([2, 3, 5, 6, 10]);
    // one unknown node: source current in, two resistors to ground
    const G = 1 / Ra + 1 / Rb;
    const Vn = Is / G;

    return {
      stem:
        `A ${Is} A current source feeds a single node, from which a ${Ra} Ω and a ` +
        `${Rb} Ω resistor both run to ground. What is the node voltage?`,
      choices: [
        { text: `${fixed(Vn, 3)} V`, why: "" },
        { text: `${fixed(Is * (Ra + Rb), 1)} V`, why: "The two resistors were treated as in series. They share both nodes, so they are in parallel and the node sees <b>less</b> resistance than either." },
        { text: `${fixed(Is * Math.min(Ra, Rb), 2)} V`, why: `Only one branch was counted. All the current has to leave through <em>both</em>.` },
        { text: `${fixed(Is / G / 2, 3)} V`, why: "Halving is only right for two equal resistors." },
      ],
      answer: 0,
      steps: [
        `Ground the bottom rail and call the unknown ${T("V_n")}. KCL says everything arriving must leave:` +
          `<span class="math display" data-tex="${Is} = \\frac{V_n}{${Ra}} + \\frac{V_n}{${Rb}}"></span>`,
        `Factor out ${T("V_n")} — the bracket is the sum of the conductances at the node, which is the diagonal entry of the matrix:` +
          `<span class="math display" data-tex="${Is} = V_n\\left(\\frac{1}{${Ra}} + \\frac{1}{${Rb}}\\right) = V_n(${fixed(G, 4)})"></span>`,
        `<span class="math display" data-tex="V_n = \\frac{${Is}}{${fixed(G, 4)}} = ${fixed(Vn, 3)}\\text{ V}"></span>` +
          `<b>Check:</b> the branches then carry ${fixed(Vn / Ra, 3)} + ${fixed(Vn / Rb, 3)} = ${fixed(Is, 3)} A ✓`,
      ],
    };
  },
});

defineProblem("mesh-solve", {
  topic: "Mesh analysis",
  lookup: "Electrical → Circuit analysis → Loop (mesh) analysis",
  make(rng) {
    const V1 = rng.pick([10, 12, 20, 24]);
    const R1 = rng.pick([2, 4, 6]);
    const Rm = rng.pick([3, 6, 12]);       // the shared resistor
    const R2 = rng.pick([2, 4, 8]);
    // two clockwise meshes, source only in mesh 1
    const A = [[R1 + Rm, -Rm], [-Rm, R2 + Rm]];
    const [I1, I2] = solve(A, [V1, 0]);
    const shared = I1 - I2;

    return {
      stem:
        `Two meshes share a ${Rm} Ω resistor. The first also contains a ${V1} V source and ` +
        `a ${R1} Ω; the second also contains a ${R2} Ω. Taking both mesh currents clockwise, ` +
        `what current flows in the shared ${Rm} Ω resistor?`,
      choices: [
        { text: `${fixed(shared, 3)} A`, why: "" },
        { text: `${fixed(I1, 3)} A`, why: `That is mesh current ${T("I_1")} alone. A shared branch carries the <b>difference</b> of the two mesh currents, because the second mesh pushes back through it.` },
        { text: `${fixed(I1 + I2, 3)} A`, why: "Added rather than subtracted. With both meshes clockwise, their currents oppose each other in the shared branch." },
        { text: `${fixed(V1 / (R1 + Rm + R2), 3)} A`, why: "That treats all three resistors as one series loop, which ignores that the shared resistor carries both meshes." },
      ],
      answer: 0,
      steps: [
        `Both loops clockwise. The resistance matrix is read off directly — diagonal is the total round each mesh, off-diagonal is minus what they share:` +
          `<span class="math display" data-tex="\\begin{bmatrix} ${R1 + Rm} & ${-Rm} \\\\ ${-Rm} & ${R2 + Rm} \\end{bmatrix}\\begin{bmatrix} I_1 \\\\ I_2 \\end{bmatrix} = \\begin{bmatrix} ${V1} \\\\ 0 \\end{bmatrix}"></span>`,
        `Solving gives ${T(`I_1 = ${fixed(I1, 3)}`)} A and ${T(`I_2 = ${fixed(I2, 3)}`)} A.`,
        `The shared branch carries the difference:` +
          `<span class="math display" data-tex="I_{${Rm}\\Omega} = I_1 - I_2 = ${fixed(I1, 3)} - ${fixed(I2, 3)} = ${fixed(shared, 3)}\\text{ A}"></span>` +
          `<b>${fixed(shared, 3)} A.</b> Forgetting the subtraction is the single most common mesh-analysis error.`,
      ],
    };
  },
});

defineProblem("method-choice", {
  topic: "Choosing a method",
  lookup: "Electrical → Circuit analysis → Node and loop analysis",
  make(rng) {
    const nodes = rng.int(3, 6), meshes = rng.int(2, 5);
    if (Math.abs((nodes - 1) - meshes) < 1) return this.make(rng);
    const nodeEq = nodes - 1;
    const better = nodeEq < meshes ? "node" : "mesh";
    const n = Math.min(nodeEq, meshes);

    return {
      stem:
        `A planar circuit has ${nodes} nodes and ${meshes} independent meshes. ` +
        `Which analysis gives the smaller system, and how many equations?`,
      choices: [
        { text: `${better} analysis, ${n} equations`, why: "" },
        { text: `${better === "node" ? "mesh" : "node"} analysis, ${Math.max(nodeEq, meshes)} equations`,
          why: `That is the larger system. Node analysis needs <b>nodes − 1</b> = ${nodeEq} equations; mesh analysis needs one per mesh = ${meshes}.` },
        { text: `node analysis, ${nodes} equations`,
          why: "One node is the reference and has no unknown, so it is nodes <b>minus one</b>." },
        { text: "either — they always give the same number", why: `Only when nodes − 1 happens to equal the mesh count. Here they are ${nodeEq} and ${meshes}.` },
      ],
      answer: 0,
      steps: [
        `Node analysis needs one equation per <em>unknown</em> node: ${nodes} − 1 = <b>${nodeEq}</b>.`,
        `Mesh analysis needs one per independent mesh: <b>${meshes}</b>.`,
        `<b>${better === "node" ? "Node" : "Mesh"} analysis, ${n} equations.</b> ` +
          `That count takes thirty seconds and regularly saves three minutes — do it before committing to a method, ` +
          `and let the source types break any tie (current sources favour node, voltage sources favour mesh).`,
      ],
    };
  },
});

/* ==========================================================================
   Part 4 — Thévenin, Norton, maximum power
   ========================================================================== */

defineProblem("thevenin-find", {
  topic: "Thévenin equivalent",
  lookup: "Electrical → Circuit analysis → Thevenin and Norton theorems",
  make(rng) {
    const Vs = rng.pick([12, 20, 24, 48, 100]);
    const R1 = rng.pick([4, 6, 10, 20, 30]);
    const R2 = rng.pick([2, 5, 6, 12, 20]);
    const Vth = Vs * R2 / (R1 + R2);
    const Rth = parallel(R1, R2);

    return {
      stem:
        `A ${Vs} V source drives a ${R1} Ω in series with a ${R2} Ω to ground. Looking into ` +
        `the terminals across the ${R2} Ω, what is the Thévenin equivalent?`,
      choices: [
        { text: `${fixed(Vth, 2)} V behind ${fixed(Rth, 3)} Ω`, why: "" },
        { text: `${fixed(Vth, 2)} V behind ${fixed(R1 + R2, 0)} Ω`,
          why: `${T("V_{th}")} is right, but ${T("R_{th}")} is not the series sum. With the source shorted, the two resistors are in <b>parallel</b> between the terminals.` },
        { text: `${fixed(Vs, 0)} V behind ${fixed(Rth, 3)} Ω`,
          why: `${T("V_{th}")} is the <em>open-circuit terminal</em> voltage, not the source voltage — the ${R1} Ω still drops part of it.` },
        { text: `${fixed(Vth, 2)} V behind ${fixed(R1, 0)} Ω`,
          why: `Only one resistor was counted. Shorting the source puts both of them between the terminals.` },
      ],
      answer: 0,
      steps: [
        `<b>Open-circuit voltage.</b> With nothing attached, no current is drawn from the junction, so it is a plain divider:` +
          `<span class="math display" data-tex="V_{th} = ${Vs}\\times\\frac{${R2}}{${R1}+${R2}} = ${fixed(Vth, 2)}\\text{ V}"></span>`,
        `<b>Thévenin resistance.</b> Kill the source — a voltage source becomes a short. Both resistors now run from the terminal to ground, so they are in parallel:` +
          `<span class="math display" data-tex="R_{th} = \\frac{(${R1})(${R2})}{${R1}+${R2}} = ${fixed(Rth, 3)}\\ \\Omega"></span>`,
        `<b>Check with the short-circuit current:</b> shorting the terminals bypasses the ${R2} Ω, so ` +
          `${T(`I_{sc} = ${Vs}/${R1} = ${fixed(Vs / R1, 3)}`)} A, and ` +
          `${T(`V_{oc}/I_{sc} = ${fixed(Vth, 2)}/${fixed(Vs / R1, 3)} = ${fixed(Rth, 3)}`)} Ω ✓`,
      ],
    };
  },
});

defineProblem("rth-inspect", {
  topic: "Killing sources",
  lookup: "Electrical → Circuit analysis → Thevenin resistance",
  make(rng) {
    const kind = rng.pick(["v", "i"]);
    return {
      stem: `To find ${T("R_{th}")} by inspection, what replaces an independent ${kind === "v" ? "voltage" : "current"} source?`,
      choices: [
        { text: kind === "v" ? "a short circuit" : "an open circuit", why: "" },
        { text: kind === "v" ? "an open circuit" : "a short circuit",
          why: `Backwards. Killing a source means setting <b>its own quantity</b> to zero: a voltage source at 0 V has no potential difference across it, which is a <em>wire</em>; a current source at 0 A passes nothing, which is a <em>gap</em>.` },
        { text: "its internal resistance", why: "An <em>ideal</em> source has none, and the exam's sources are ideal unless it says otherwise." },
        { text: "nothing — dependent and independent sources are all left in place",
          why: "Independent sources are killed. <b>Dependent</b> sources are the ones that stay, which is why that case needs the V_oc/I_sc route instead." },
      ],
      answer: 0,
      steps: [
        `Do not memorise this pair — derive it in two seconds every time.`,
        kind === "v"
          ? `A voltage source set to zero has <b>0 V across it</b>. The component with zero volts across it no matter the current is a <b>wire</b> — a short circuit.`
          : `A current source set to zero passes <b>0 A</b>. The component with zero current through it no matter the voltage is a <b>gap</b> — an open circuit.`,
        `<b>${kind === "v" ? "A short circuit." : "An open circuit."}</b> ` +
          `And only <em>independent</em> sources get this treatment — a dependent source is part of the network's behaviour, not a stimulus applied to it.`,
      ],
    };
  },
});

defineProblem("max-power", {
  topic: "Maximum power transfer",
  lookup: "Electrical → Circuit analysis → Maximum power transfer",
  make(rng) {
    const Vth = rng.pick([10, 12, 20, 24, 40]);
    const Rth = rng.pick([2, 4, 5, 8, 10]);
    const Pmax = (Vth * Vth) / (4 * Rth);
    const askEff = rng.chance(0.3);

    if (askEff) {
      return {
        stem:
          `A source with ${Vth} V open-circuit and ${Rth} Ω internal resistance drives a load ` +
          `sized for maximum power transfer. What fraction of the total power reaches the load?`,
        choices: [
          { text: "50%", why: "" },
          { text: "100%", why: "The internal resistance carries the same current through the same resistance, so it burns exactly as much as the load does." },
          { text: "75%", why: "At the matched point the two resistances are equal and share the power evenly." },
          { text: "It depends on the source voltage", why: "It does not — the efficiency depends only on the ratio of load to source resistance, which at match is 1." },
        ],
        answer: 0,
        steps: [
          `At maximum power transfer ${T("R_L = R_{th}")}, so the same current flows through two equal resistances.`,
          `Equal current through equal resistance means equal ${T("I^2R")} — the load and the source dissipate the same amount.`,
          `<b>50%.</b> That is fine for a receiver pulling in a weak signal and unacceptable for a power system, ` +
            `which is why transmission is deliberately run nowhere near matched.`,
        ],
      };
    }

    return {
      stem:
        `A network's Thévenin equivalent is ${Vth} V behind ${Rth} Ω. What is the greatest power ` +
        `that can be delivered to a load, and at what load resistance?`,
      choices: [
        { text: `${fixed(Pmax, 2)} W at ${Rth} Ω`, why: "" },
        { text: `${fixed((Vth * Vth) / (2 * Rth), 2)} W at ${Rth} Ω`,
          why: `The load resistance is right but the power is not. At match, the load sees <b>half</b> the Thévenin voltage, so ${T("P = (V_{th}/2)^2/R_L = V_{th}^2/4R_{th}")} — note the 4.` },
        { text: `${fixed((Vth * Vth) / Rth, 2)} W at 0 Ω`,
          why: "A short circuit takes maximum <em>current</em> but zero voltage, so it takes zero power. Both extremes deliver nothing." },
        { text: `${fixed(Pmax, 2)} W at ${Rth * 2} Ω`,
          why: `The power is right but the match is not. Maximum transfer needs ${T("R_L = R_{th}")} exactly.` },
      ],
      answer: 0,
      steps: [
        `Maximum power transfer occurs when the load matches the source resistance: ${T(`R_L = R_{th} = ${Rth}`)} Ω.`,
        `At that point the divider splits the Thévenin voltage evenly, so the load sees ${T(`${Vth}/2 = ${Vth / 2}`)} V:` +
          `<span class="math display" data-tex="P_{max} = \\frac{(V_{th}/2)^2}{R_L} = \\frac{V_{th}^2}{4R_{th}} = \\frac{${Vth * Vth}}{${4 * Rth}} = ${fixed(Pmax, 2)}\\text{ W}"></span>`,
        `<b>${fixed(Pmax, 2)} W at ${Rth} Ω.</b> The peak is broad — at half or double that load you still get 89% of it — ` +
          `and the efficiency there is only 50%.`,
      ],
    };
  },
});

defineProblem("source-transform", {
  topic: "Source transformation",
  lookup: "Electrical → Circuit analysis → Source transformation, Norton",
  make(rng) {
    const toNorton = rng.chance(0.5);
    const R = rng.pick([2, 4, 5, 10, 20, 25]);
    const Vth = rng.pick([10, 20, 40, 50, 100]);
    const In = Vth / R;

    return {
      stem: toNorton
        ? `Convert a ${Vth} V source in series with ${R} Ω into its Norton equivalent.`
        : `Convert a ${num(In)} A source in parallel with ${R} Ω into its Thévenin equivalent.`,
      choices: [
        { text: toNorton ? `${num(In)} A in parallel with ${R} Ω` : `${Vth} V in series with ${R} Ω`, why: "" },
        { text: toNorton ? `${num(In)} A in series with ${R} Ω` : `${Vth} V in parallel with ${R} Ω`,
          why: "The topology is wrong. A Norton source sits in <b>parallel</b> with its resistance; a Thévenin source sits in <b>series</b> with it. A current source in series with a resistor would just be a current source." },
        { text: toNorton ? `${num(Vth * R)} A in parallel with ${R} Ω` : `${num(In / R)} V in series with ${R} Ω`,
          why: `Multiplied where you should divide. The conversion is ${T("V_{th} = I_N R")}, so going the other way divides.` },
        { text: toNorton ? `${num(In)} A in parallel with ${num(1 / R, 3)} Ω` : `${Vth} V in series with ${num(1 / R, 3)} Ω`,
          why: "The resistance is unchanged by the transformation — it is the same resistance in both forms, not its reciprocal." },
      ],
      answer: 0,
      steps: [
        `The resistance is the same in both forms: ${T(`R_{th} = R_N = ${R}`)} Ω. Only the source changes.`,
        `<span class="math display" data-tex="V_{th} = I_N R_N \\quad\\Longleftrightarrow\\quad I_N = \\frac{V_{th}}{R_{th}}"></span>` +
          (toNorton
            ? `${T(`I_N = ${Vth}/${R} = ${num(In)}`)} A`
            : `${T(`V_{th} = (${num(In)})(${R}) = ${Vth}`)} V`),
        `<b>${toNorton ? `${num(In)} A in parallel with ${R} Ω` : `${Vth} V in series with ${R} Ω`}.</b> ` +
          `From outside the two are indistinguishable — same open-circuit voltage, same short-circuit current.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "node-loop",
    stem: "A bridge circuit has no two resistors in series and none in parallel. Find the branch currents.",
    tool: "Node analysis",
    because: "The reduction shortcuts have nothing to grab, but KCL at each node always works.",
  },
  {
    part: "node-loop",
    stem: "Two windows, both containing voltage sources; find the current in the shared branch.",
    tool: "Mesh analysis",
    because: "Voltage sources drop straight onto the right-hand side of the mesh equations.",
  },
  {
    part: "node-loop",
    stem: "Write the coefficient matrix for a three-node circuit without doing any algebra.",
    tool: "Conductance matrix by inspection",
    because: "Diagonal is what touches the node; off-diagonal is minus what is shared.",
  },
  {
    part: "thevenin",
    stem: "The same network will be tested with eight different load resistors.",
    tool: "Thévenin equivalent",
    because: "Solve once with the load removed, then every load is a single division.",
  },
  {
    part: "thevenin",
    stem: "What load resistance extracts the most power from a given source?",
    tool: "Maximum power transfer",
    because: "Match the load to the Thévenin resistance; the power is V²/4R.",
  },
  {
    part: "thevenin",
    stem: "A current source in parallel with 10 Ω needs to become a voltage source.",
    tool: "Source transformation",
    because: "Same resistance either way, with V = IR relating the two sources.",
  },
]);
