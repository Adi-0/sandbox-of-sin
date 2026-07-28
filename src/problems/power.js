/* ==========================================================================
   problems/power.js — generators for Power Systems.

   Part 1 (10.A): power factor, correction, capacitor sizing, supply sizing.
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed } from "../lib/fmt.js";

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;

const D = 180 / Math.PI;
const acosDeg = (pf) => Math.acos(pf) * D;
const tanOf = (pf) => Math.tan(Math.acos(pf));

/* ==========================================================================
   Part 1 — power theory
   ========================================================================== */

defineProblem("pf-find", {
  topic: "Finding the power factor",
  lookup: "Electrical → Power → Power factor",
  make(rng) {
    const form = rng.pick(["impedance", "pq", "vip"]);

    if (form === "impedance") {
      // built from a Pythagorean pair so the arithmetic stays checkable
      const [R, X] = rng.pick([[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5], [9, 12]]);
      const cap = rng.pick([false, false, true]);
      const Z = Math.hypot(R, X);
      const pf = R / Z;
      const dir = cap ? "leading" : "lagging";
      const sign = cap ? "-" : "+";

      return {
        stem: `A load has impedance ${T(`\\mathbf{Z} = ${R} ${sign} j${X}\\ \\Omega`)}. What is its power factor?`,
        choices: [
          { text: `${fixed(pf, 3)} ${dir}`, why: "" },
          { text: `${fixed(pf, 3)} ${cap ? "lagging" : "leading"}`,
            why: `The magnitude is right, the direction is not. ${cap ? "A <b>negative</b> reactance is capacitive, and a capacitive load draws <b>leading</b> current." : "A <b>positive</b> reactance is inductive, and an inductive load draws <b>lagging</b> current."} Half the wrong answers on this topic are the right cosine with the wrong word.` },
          { text: `${fixed(X / Z, 3)} ${dir}`,
            why: `That is ${T("\\sin\\theta")} — the reactive fraction. Power factor is ${T("\\cos\\theta = R/|Z|")}, the <b>resistive</b> fraction.` },
          { text: `${fixed(X / R, 3)} ${dir}`,
            why: `That is ${T("\\tan\\theta")}. Useful for correction problems, but it is not the power factor.` },
        ],
        answer: 0,
        steps: [
          `Power factor is the cosine of the impedance angle, which is the resistive part over the magnitude:`,
          `<span class="math display" data-tex="|\\mathbf{Z}| = \\sqrt{${R}^2 + ${X}^2} = ${fixed(Z, 3)}\\ \\Omega"></span>`,
          `<span class="math display" data-tex="\\text{pf} = \\cos\\theta = \\frac{R}{|\\mathbf{Z}|} = \\frac{${R}}{${fixed(Z, 3)}} = ${fixed(pf, 3)}"></span>`,
          `The reactance is ${cap ? "<b>negative</b>, so the load is capacitive and the current <b>leads</b>" : "<b>positive</b>, so the load is inductive and the current <b>lags</b>"}: <b>${fixed(pf, 3)} ${dir}</b>. A power factor without a direction is only half an answer.`,
        ],
      };
    }

    if (form === "pq") {
      const P = rng.pick([1728, 2400, 3600, 4800, 6000, 12000]);
      const Q = rng.pick([1300, 1800, 2304, 3200, 4500]);
      const S = Math.hypot(P, Q);
      const pf = P / S;

      return {
        stem: `A load draws ${num(P, 0)} W of real power and ${num(Q, 0)} VAR of reactive power. What is its power factor, most nearly?`,
        choices: [
          { text: `${fixed(pf, 3)} lagging`, why: "" },
          { text: `${fixed(Q / S, 3)} lagging`, why: `That is ${T("Q/S = \\sin\\theta")}. Power factor is ${T("P/S")}.` },
          { text: `${fixed(P / (P + Q), 3)} lagging`,
            why: `That adds P and Q arithmetically. They are <b>perpendicular</b> — they combine by Pythagoras, never by addition.` },
          { text: `${fixed(Q / P, 3)} lagging`, why: `That is ${T("\\tan\\theta")}, not ${T("\\cos\\theta")}.` },
        ],
        answer: 0,
        steps: [
          `P and Q are the legs of a right triangle and S is the hypotenuse:`,
          `<span class="math display" data-tex="S = \\sqrt{P^2 + Q^2} = \\sqrt{${P}^2 + ${Q}^2} = ${fixed(S, 0)}\\text{ VA}"></span>`,
          `<span class="math display" data-tex="\\text{pf} = \\frac{P}{S} = \\frac{${P}}{${fixed(S, 0)}} = ${fixed(pf, 3)}"></span>`,
          `<b>${fixed(pf, 3)} lagging</b> — lagging because Q is positive, meaning the load is inductive.`,
        ],
      };
    }

    const V = rng.pick([120, 240, 208, 480]);
    const I = rng.pick([8, 12, 16, 20, 24, 30]);
    const P = rng.pick([1000, 1500, 2000, 2500]);
    const S = V * I;
    const pf = Math.min(P / S, 0.999);

    return {
      stem: `A single-phase load draws ${I} A from a ${V} V supply while consuming ${num(P, 0)} W. What is its power factor, most nearly?`,
      choices: [
        { text: `${fixed(pf, 3)}`, why: "" },
        { text: `${fixed(1 / pf, 3)}`, why: "Inverted. Power factor is P over S, and it can never exceed 1 — an answer above 1.0 is always wrong on inspection." },
        { text: `${fixed(Math.sqrt(Math.max(0, 1 - pf * pf)), 3)}`, why: `That is ${T("\\sin\\theta")}, the reactive fraction.` },
        { text: `${fixed(pf * pf, 3)}`, why: "Squared somewhere along the way. No squaring is involved in P over S." },
      ],
      answer: 0,
      steps: [
        `Apparent power is simply the product of the RMS values:`,
        `<span class="math display" data-tex="S = VI = (${V})(${I}) = ${num(S, 0)}\\text{ VA}"></span>`,
        `<span class="math display" data-tex="\\text{pf} = \\frac{P}{S} = \\frac{${num(P, 0)}}{${num(S, 0)}} = ${fixed(pf, 3)}"></span>`,
        `<b>${fixed(pf, 3)}.</b> Sanity check: the power factor is a fraction of something, so it lies between 0 and 1 always.`,
      ],
    };
  },
});

defineProblem("pf-correct", {
  topic: "Power factor correction",
  lookup: "Electrical → Power → Power factor correction",
  make(rng) {
    const P = rng.pick([1728, 5184, 10000, 15000, 24000, 50000]);
    const pf1 = rng.pick([0.6, 0.65, 0.7, 0.75, 0.8]);
    const pf2 = rng.pick([0.9, 0.95, 1.0]);
    const t1 = tanOf(pf1), t2 = tanOf(pf2);
    const Qc = P * (t1 - t2);

    const kilo = P >= 10000;
    const f = (v) => (kilo ? `${fixed(v / 1000, 2)} kVAR` : `${num(v, 0)} VAR`);

    return {
      stem: `A ${kilo ? `${fixed(P / 1000, 1)} kW` : `${num(P, 0)} W`} load operates at ${pf1} power factor lagging. ` +
            `What capacitor rating is required to raise the power factor to ${pf2 === 1 ? "unity" : `${pf2} lagging`}, most nearly?`,
      choices: [
        { text: f(Qc), why: "" },
        { text: f(P * t1),
          why: `That is the load's <b>entire</b> reactive demand — the capacitor needed to reach unity. ${pf2 === 1 ? "" : `Here only the part above ${T(`\\tan\\theta_2 = ${fixed(t2, 4)}`)} has to be removed.`}` },
        { text: f(P * (pf2 - pf1)),
          why: "That subtracts the power factors themselves. Correction works on <b>tangents</b>, because the tangent is VAR per watt — the cosines cannot be subtracted like that." },
        { text: f(Math.abs(P * (1 / pf1 - 1 / pf2))),
          why: "That is the change in <b>apparent</b> power. The capacitor is rated in VAR, not VA, and the two differ." },
      ].filter((c, i, all) => i === 0 || Math.abs(parseFloat(c.text) - parseFloat(all[0].text)) > 1e-6),
      answer: 0,
      steps: [
        `Convert both power factors to angles, then to tangents — the tangent is the reactive power <em>per watt</em>, which is what makes the subtraction work:`,
        `<span class="math display" data-tex="\\theta_1 = \\arccos ${pf1} = ${fixed(acosDeg(pf1), 2)}^\\circ, \\quad \\tan\\theta_1 = ${fixed(t1, 4)}"></span>`,
        `<span class="math display" data-tex="\\theta_2 = \\arccos ${pf2} = ${fixed(acosDeg(pf2), 2)}^\\circ, \\quad \\tan\\theta_2 = ${fixed(t2, 4)}"></span>`,
        `The capacitor supplies the difference in reactive power, at unchanged P:`,
        `<span class="math display" data-tex="Q_C = P(\\tan\\theta_1 - \\tan\\theta_2) = ${P}(${fixed(t1, 4)} - ${fixed(t2, 4)}) = ${fixed(Qc, 0)}\\text{ VAR}"></span>`,
        `<b>${f(Qc)}.</b> The real power is the same before and after — the capacitor changes only how much current has to be delivered to supply it.`,
      ],
    };
  },
});

defineProblem("cap-size", {
  topic: "Sizing the capacitor in farads",
  lookup: "Electrical → Power → Capacitor sizing / reactive power",
  make(rng) {
    const Qc = rng.pick([1467, 2000, 3600, 5000, 7200]);
    const V = rng.pick([120, 240, 480]);
    const f = rng.pick([50, 60]);
    const w = 2 * Math.PI * f;
    const C = Qc / (w * V * V);
    const Xc = (V * V) / Qc;

    return {
      stem: `A capacitor must supply ${num(Qc, 0)} VAR at ${V} V, ${f} Hz. What capacitance is required, most nearly?`,
      choices: [
        { text: `${num(C * 1e6, 0)} µF`, why: "" },
        { text: `${num(Qc / (w * V) * 1e6, 0)} µF`,
          why: `Voltage appears <b>squared</b> in ${T("Q_C = 2\\pi f C V^2")}. Using V once gives an answer ${V} times too large.` },
        { text: `${num(C * 1e6 * 2 * Math.PI, 0)} µF`,
          why: `Used ${T("f")} where ${T("\\omega = 2\\pi f")} belonged. In this formula the ${T("2\\pi")} is not optional.` },
        { text: `${fixed(Xc, 2)} µF`,
          why: `That is the reactance ${T("X_C = V^2/Q_C")} in <b>ohms</b>, an intermediate value. The question asks for farads.` },
      ],
      answer: 0,
      steps: [
        `A capacitor's reactive power comes from its reactance and the voltage across it:`,
        `<span class="math display" data-tex="Q_C = \\frac{V^2}{X_C} \\quad\\text{and}\\quad X_C = \\frac{1}{2\\pi f C}"></span>`,
        `Combining them gives ${T("Q_C = 2\\pi f C V^2")}, so`,
        `<span class="math display" data-tex="C = \\frac{Q_C}{2\\pi f V^2} = \\frac{${Qc}}{2\\pi(${f})(${V})^2} = ${num(C * 1e6, 0)}\\ \\mu\\text{F}"></span>`,
        `<b>${num(C * 1e6, 0)} µF.</b> Note how strongly voltage enters: at ${V * 2} V the same VAR rating would need only a quarter of the capacitance, which is why correction banks are installed at the highest convenient voltage.`,
      ],
    };
  },
});

defineProblem("kva-size", {
  topic: "Sizing a supply for a load",
  lookup: "Electrical → Power → Apparent power, efficiency",
  make(rng) {
    const hp = rng.pick([5, 10, 25, 50, 100]);
    const eff = rng.pick([0.85, 0.88, 0.9, 0.92]);
    const pf = rng.pick([0.7, 0.75, 0.8, 0.85]);
    const Pout = hp * 746;
    const Pin = Pout / eff;
    const S = Pin / pf;

    return {
      stem: `A ${hp} hp motor runs at ${fixed(eff * 100, 0)}% efficiency and ${pf} power factor. ` +
            `What is the minimum apparent power the supply must provide, most nearly?`,
      choices: [
        { text: `${fixed(S / 1000, 1)} kVA`, why: "" },
        { text: `${fixed(Pin / 1000, 1)} kVA`,
          why: "That is the electrical <b>real</b> power in kW. It still has to be divided by the power factor to get the volt-amperes the supply must carry." },
        { text: `${fixed(Pout / 1000, 1)} kVA`,
          why: "That is the mechanical output only. Efficiency and power factor both still apply, and each one makes the required supply larger." },
        { text: `${fixed(Pout * eff / pf / 1000, 1)} kVA`,
          why: "Multiplied by the efficiency instead of dividing. The electrical input is always <b>larger</b> than the mechanical output — losses add to what you must supply." },
      ],
      answer: 0,
      steps: [
        `Mechanical output first, at 746 W per horsepower:`,
        `<span class="math display" data-tex="P_{out} = (${hp})(746) = ${num(Pout, 0)}\\text{ W}"></span>`,
        `Efficiency converts shaft output to electrical input — <b>divide</b>, because the input must cover the losses too:`,
        `<span class="math display" data-tex="P_{in} = \\frac{${num(Pout, 0)}}{${eff}} = ${num(Pin, 0)}\\text{ W}"></span>`,
        `Power factor converts watts to volt-amperes:`,
        `<span class="math display" data-tex="S = \\frac{P_{in}}{\\text{pf}} = \\frac{${num(Pin, 0)}}{${pf}} = ${num(S, 0)}\\text{ VA}"></span>`,
        `<b>${fixed(S / 1000, 1)} kVA.</b> Two divisions, in that order: efficiency acts on watts, power factor acts on volt-amperes.`,
      ],
    };
  },
});

/* ==========================================================================
   Reflex items — classification only, no arithmetic
   ========================================================================== */

defineReflex([
  {
    part: "power-factor",
    stem: "A plant runs at 0.7 lagging. What size capacitor bank brings it to 0.95?",
    tool: "Q_C = P(tan θ₁ − tan θ₂)",
    because: "Correction problems work on the difference of tangents, because tangent is reactive power per watt.",
  },
  {
    part: "power-factor",
    stem: "A 20 hp motor at 90% efficiency and 0.8 pf — what kVA supply does it need?",
    tool: "746 W/hp, then ÷ efficiency, then ÷ power factor",
    because: "Mechanical output to electrical input to apparent power: two divisions in a fixed order.",
  },
  {
    part: "power-factor",
    stem: "A load is 4 + j3 Ω. Is its power factor leading or lagging, and what is it?",
    tool: "pf = R / |Z|, lagging if X is positive",
    because: "Positive reactance is inductive, and an inductive load draws current that lags the voltage.",
  },
  {
    part: "power-factor",
    stem: "A capacitor must supply 5 kVAR at 480 V, 60 Hz. How many microfarads?",
    tool: "C = Q_C / (2πf V²)",
    because: "Voltage enters squared — that is the term most often dropped.",
  },
]);

/* ==========================================================================
   Part 2 — three-phase
   ========================================================================== */

const RT3 = Math.sqrt(3);

defineProblem("line-phase", {
  topic: "Line and phase quantities",
  lookup: "Electrical → Power → Three-phase (delta and wye connections)",
  make(rng) {
    const wye = rng.pick([true, false]);
    const VL = rng.pick([208, 240, 480, 600]);
    const Zm = rng.pick([4, 5, 8, 10, 12, 20]);

    const Vp = wye ? VL / RT3 : VL;
    const Ip = Vp / Zm;
    const Il = wye ? Ip : Ip * RT3;
    const ask = rng.pick(["Il", "Vp"]);

    if (ask === "Vp") {
      return {
        stem: `A balanced ${wye ? "wye" : "delta"}-connected load is supplied at ${VL} V line-to-line. ` +
              `What voltage appears across each phase impedance, most nearly?`,
        choices: [
          { text: `${fixed(Vp, 1)} V`, why: "" },
          { text: `${fixed(wye ? VL : VL / RT3, 1)} V`,
            why: wye
              ? "That is the line voltage itself. In a <b>wye</b> each impedance runs from a line to the neutral, so it sees only V<sub>L</sub>/√3."
              : "That divides by √3, which is the wye rule. In a <b>delta</b> each impedance is connected directly between two lines, so it sees the full line voltage." },
          { text: `${fixed(VL * RT3, 1)} V`, why: "Multiplied by √3 instead of divided. A phase voltage is never larger than the line voltage." },
          { text: `${fixed(VL / 3, 1)} V`, why: "Divided by 3 rather than √3. The factor comes from a vector subtraction of two phasors 120° apart, and it is √3 ≈ 1.732." },
        ].filter((c, i, all) => i === 0 || Math.abs(parseFloat(c.text) - parseFloat(all[0].text)) > 0.05),
        answer: 0,
        steps: [
          wye
            ? `In a wye each impedance sits between one line and the neutral, so it carries the <b>phase</b> voltage:`
            : `In a delta each impedance is wired directly across two lines, so it carries the <b>line</b> voltage:`,
          `<span class="math display" data-tex="V_\\phi = ${wye ? `\\frac{V_L}{\\sqrt{3}} = \\frac{${VL}}{1.732}` : `V_L`} = ${fixed(Vp, 1)}\\text{ V}"></span>`,
          `<b>${fixed(Vp, 1)} V.</b> ${wye ? "The √3 is on the voltage in a wye, and on the current in a delta." : "No √3 on the voltage here — it moves to the current instead."}`,
        ],
      };
    }

    return {
      stem: `A balanced ${wye ? "wye" : "delta"}-connected load of ${Zm} Ω per phase is supplied at ${VL} V line-to-line. ` +
            `What is the line current, most nearly?`,
      choices: [
        { text: `${fixed(Il, 2)} A`, why: "" },
        { text: `${fixed(wye ? Ip * RT3 : Ip, 2)} A`,
          why: wye
            ? "That applies the delta rule. In a <b>wye</b> the phase current has nowhere else to go — it <em>is</em> the line current, with no √3."
            : "That is the <b>phase</b> current, through one impedance. At each corner of a delta two phase currents combine, and the line current is √3 times larger." },
        { text: `${fixed(VL / Zm, 2)} A`,
          why: `That uses the full line voltage across the impedance${wye ? ", but a wye phase only sees V<sub>L</sub>/√3" : " and then stops — correct for the phase current in a delta, but the line current is √3 times it"}.` },
        { text: `${fixed(Il / 3, 2)} A`, why: "A factor of 3 where √3 belongs." },
      ].filter((c, i, all) => i === 0 || Math.abs(parseFloat(c.text) - parseFloat(all[0].text)) > 0.02),
      answer: 0,
      steps: [
        `Phase voltage first — that is what decides the current through each impedance:`,
        `<span class="math display" data-tex="V_\\phi = ${wye ? `\\frac{${VL}}{\\sqrt{3}}` : `${VL}`} = ${fixed(Vp, 1)}\\text{ V}"></span>`,
        `<span class="math display" data-tex="I_\\phi = \\frac{V_\\phi}{|Z|} = \\frac{${fixed(Vp, 1)}}{${Zm}} = ${fixed(Ip, 2)}\\text{ A}"></span>`,
        wye
          ? `In a wye the line current equals the phase current: <b>${fixed(Il, 2)} A</b>.`
          : `<span class="math display" data-tex="I_L = \\sqrt{3}\\,I_\\phi = 1.732 \\times ${fixed(Ip, 2)} = ${fixed(Il, 2)}\\text{ A}"></span><b>${fixed(Il, 2)} A.</b>`,
      ],
    };
  },
});

defineProblem("three-phase-power", {
  topic: "Three-phase power",
  lookup: "Electrical → Power → Three-phase power",
  make(rng) {
    const VL = rng.pick([208, 240, 480, 4160]);
    const Il = rng.pick([10, 15, 24, 40, 60]);
    const pf = rng.pick([0.6, 0.75, 0.8, 0.85, 0.9]);
    const S = RT3 * VL * Il;
    const P = S * pf;
    const Q = S * Math.sqrt(1 - pf * pf);
    const ask = rng.pick(["P", "S"]);

    const kw = (v) => (v >= 10000 ? `${fixed(v / 1000, 1)} k` : `${num(v, 0)} `);

    if (ask === "S") {
      return {
        stem: `A balanced three-phase load draws ${Il} A from a ${num(VL, 0)} V (line-to-line) supply at ${pf} power factor lagging. ` +
              `What is the total apparent power, most nearly?`,
        choices: [
          { text: `${kw(S)}VA`, why: "" },
          { text: `${kw(VL * Il)}VA`, why: "Missing the √3. Total apparent power in a balanced three-phase system is <b>√3 V<sub>L</sub> I<sub>L</sub></b>, not V<sub>L</sub>I<sub>L</sub>." },
          { text: `${kw(3 * VL * Il)}VA`, why: "That uses 3 where √3 belongs. The 3 form is <b>3 V<sub>φ</sub> I<sub>φ</sub></b> — with <em>phase</em> quantities, not line quantities." },
          { text: `${kw(P)}VA`, why: "That is the <b>real</b> power in watts. Apparent power does not include the power factor." },
        ],
        answer: 0,
        steps: [
          `Apparent power from line quantities carries the √3, and it is the same formula for wye and delta:`,
          `<span class="math display" data-tex="S = \\sqrt{3}\\,V_L I_L = 1.732 \\times ${VL} \\times ${Il} = ${num(S, 0)}\\text{ VA}"></span>`,
          `<b>${kw(S)}VA.</b> Note that the power factor plays no part — it only splits S into P and Q.`,
        ],
      };
    }

    return {
      stem: `A balanced three-phase load draws ${Il} A from a ${num(VL, 0)} V (line-to-line) supply at ${pf} power factor lagging. ` +
            `What is the total real power, most nearly?`,
      choices: [
        { text: `${kw(P)}W`, why: "" },
        { text: `${kw(VL * Il * pf)}W`, why: "Missing the √3." },
        { text: `${kw(S)}W`, why: "That is the apparent power in VA. Real power needs the power factor as well." },
        { text: `${kw(Q)}W`, why: `That used ${T("\\sin\\theta")} instead of ${T("\\cos\\theta")} — it is the reactive power, in VAR.` },
      ],
      answer: 0,
      steps: [
        `The line form of three-phase power holds for both connections:`,
        `<span class="math display" data-tex="P = \\sqrt{3}\\,V_L I_L \\cos\\theta"></span>`,
        `<span class="math display" data-tex="P = 1.732 \\times ${VL} \\times ${Il} \\times ${pf} = ${num(P, 0)}\\text{ W}"></span>`,
        `<b>${kw(P)}W.</b> θ here is the <b>impedance angle</b> — the angle between phase voltage and phase current. The 30° between line and phase voltage is already inside the √3.`,
      ],
    };
  },
});

defineProblem("wye-delta-convert", {
  topic: "Delta ⇄ wye conversion",
  lookup: "Electrical → Power → Delta and wye connections",
  make(rng) {
    const toDelta = rng.pick([true, false]);
    const base = rng.pick([3, 4, 5, 6, 9, 12, 15]);
    const Zy = toDelta ? base : base * 3;
    const Zd = Zy * 3;

    return {
      stem: toDelta
        ? `A balanced wye-connected load has ${Zy} Ω in each phase. What is the equivalent balanced delta impedance per phase?`
        : `A balanced delta-connected load has ${Zd} Ω in each phase. What is the equivalent balanced wye impedance per phase?`,
      choices: [
        { text: `${num(toDelta ? Zd : Zy, 2)} Ω`, why: "" },
        { text: `${num(toDelta ? Zy / 3 : Zd * 3, 2)} Ω`,
          why: "The factor of 3 is the right size and the wrong direction. <b>Z<sub>Δ</sub> = 3 Z<sub>Y</sub></b> — the delta impedances are the larger ones, because on the same line voltage a delta would otherwise draw three times the power." },
        { text: `${fixed((toDelta ? Zy * RT3 : Zd / RT3), 2)} Ω`,
          why: "That is √3, not 3. The √3 relates <em>line</em> and <em>phase</em> quantities; the delta-wye impedance conversion is a clean factor of three." },
        { text: `${num(toDelta ? Zy : Zd, 2)} Ω`, why: "Unchanged. The two connections present the same load only if the impedances differ by three." },
      ],
      answer: 0,
      steps: [
        `For a <b>balanced</b> load the general delta-wye formulas collapse to a single ratio:`,
        `<span class="math display" data-tex="Z_\\Delta = 3\\,Z_Y"></span>`,
        toDelta
          ? `<span class="math display" data-tex="Z_\\Delta = 3 \\times ${Zy} = ${num(Zd, 2)}\\ \\Omega"></span>`
          : `<span class="math display" data-tex="Z_Y = \\frac{${Zd}}{3} = ${num(Zy, 2)}\\ \\Omega"></span>`,
        `<b>${num(toDelta ? Zd : Zy, 2)} Ω.</b> The direction check that never fails: a delta on a given line voltage is the <em>heavier</em> load, so equivalent delta impedances must be the <em>bigger</em> ones.`,
      ],
    };
  },
});

defineProblem("balanced-load", {
  topic: "Solving a balanced three-phase load",
  lookup: "Electrical → Power → Three-phase, balanced loads",
  make(rng) {
    const [R, X] = rng.pick([[3, 4], [6, 8], [8, 6], [4, 3], [5, 12], [12, 5]]);
    const Zm = Math.hypot(R, X);
    const pf = R / Zm;
    const VL = rng.pick([208, 240, 480]);
    const wye = rng.pick([true, false]);

    const Vp = wye ? VL / RT3 : VL;
    const Ip = Vp / Zm;
    const Il = wye ? Ip : Ip * RT3;
    const P = 3 * Ip * Ip * R;

    return {
      stem: `Three impedances of ${T(`${R} + j${X}\\ \\Omega`)} are connected in ${wye ? "wye" : "delta"} across a ${VL} V three-phase supply. ` +
            `What is the total real power, most nearly?`,
      choices: [
        { text: `${fixed(P / 1000, 2)} kW`, why: "" },
        { text: `${fixed(P / (wye ? 1 / 3 : 3) / 1000, 2)} kW`,
          why: wye
            ? "That is the delta figure. In a wye each impedance sees only V<sub>L</sub>/√3, so the power is a third of what the same impedances would draw in delta."
            : "That is the wye figure. In a delta each impedance sees the full line voltage, so it draws three times as much." },
        { text: `${fixed(Ip * Ip * R / 1000, 2)} kW`, why: "That is <b>one</b> phase. Three identical phases are dissipating, so multiply by three." },
        { text: `${fixed(3 * Ip * Ip * Zm / 1000, 2)} kW`,
          why: `That uses the impedance <b>magnitude</b> where the resistance belongs. Real power comes only from resistance — ${T("P = I^2R")}, never ${T("I^2|Z|")}.` },
      ],
      answer: 0,
      steps: [
        `${wye ? "Wye, so each impedance sees the phase voltage:" : "Delta, so each impedance sees the full line voltage:"}`,
        `<span class="math display" data-tex="V_\\phi = ${wye ? `\\frac{${VL}}{\\sqrt{3}} = ${fixed(Vp, 1)}` : `${VL}`}\\text{ V}"></span>`,
        `<span class="math display" data-tex="|Z| = \\sqrt{${R}^2 + ${X}^2} = ${fixed(Zm, 2)}\\ \\Omega, \\qquad I_\\phi = \\frac{${fixed(Vp, 1)}}{${fixed(Zm, 2)}} = ${fixed(Ip, 2)}\\text{ A}"></span>`,
        `Real power comes from the resistive part only, three phases of it:`,
        `<span class="math display" data-tex="P = 3 I_\\phi^2 R = 3(${fixed(Ip, 2)})^2(${R}) = ${num(P, 0)}\\text{ W}"></span>`,
        `<b>${fixed(P / 1000, 2)} kW.</b> Cross-check with the line form: ${T(`\\sqrt{3}(${VL})(${fixed(Il, 2)})(${fixed(pf, 3)}) = ${num(RT3 * VL * Il * pf, 0)}`)} W ✓`,
      ],
    };
  },
});

defineReflex([
  {
    part: "three-phase",
    stem: "A delta load of 12 Ω per phase sits on 480 V three-phase. What is the line current?",
    tool: "V_φ = V_L in delta, then I_L = √3 I_φ",
    because: "Delta phases see the full line voltage; the √3 moves to the current.",
  },
  {
    part: "three-phase",
    stem: "A balanced load draws 40 A at 480 V line-to-line, 0.85 pf. Total kW?",
    tool: "P = √3 V_L I_L cos θ",
    because: "The line form of three-phase power, identical for wye and delta.",
  },
  {
    part: "three-phase",
    stem: "A wye load has 9 Ω per phase. What delta impedance is equivalent?",
    tool: "Z_Δ = 3 Z_Y",
    because: "Delta is the heavier load on a given line voltage, so equivalent delta impedances are the larger ones.",
  },
  {
    part: "three-phase",
    stem: "A 208 V three-phase panel — what is the voltage from any line to neutral?",
    tool: "V_φ = V_L / √3",
    because: "208Y/120 is a √3 pair; the phase voltage is the familiar 120 V.",
  },
]);

/* ==========================================================================
   Part 3 — transmission and distribution
   ========================================================================== */

defineProblem("line-loss", {
  topic: "Line loss and efficiency",
  lookup: "Electrical → Power → Transmission (real losses, efficiency)",
  make(rng) {
    const kW = rng.pick([100, 250, 300, 500, 750]);
    const VL = rng.pick([2400, 4160, 12470, 13800]);
    const pf = rng.pick([0.8, 0.85, 0.9]);
    const R = rng.pick([0.4, 0.8, 1.2, 2.0]);
    const P = kW * 1000;
    const Il = P / (RT3 * VL * pf);
    const loss = 3 * Il * Il * R;
    const eff = (P / (P + loss)) * 100;
    const ask = rng.pick(["loss", "eff"]);

    const common = [
      `Line current first, from the three-phase power relation rearranged:`,
      `<span class="math display" data-tex="I_L = \\frac{P}{\\sqrt{3}V_L\\cos\\theta} = \\frac{${num(P, 0)}}{1.732 \\times ${VL} \\times ${pf}} = ${fixed(Il, 1)}\\text{ A}"></span>`,
      `All three conductors carry it, so the loss is three times ${T("I^2R")}:`,
      `<span class="math display" data-tex="P_{loss} = 3I_L^2R = 3(${fixed(Il, 1)})^2(${R}) = ${num(loss, 0)}\\text{ W}"></span>`,
    ];

    if (ask === "eff") {
      return {
        stem: `A three-phase line delivers ${kW} kW at ${num(VL, 0)} V and ${pf} power factor lagging. ` +
              `Each conductor has ${R} Ω of resistance. What is the transmission efficiency, most nearly?`,
        choices: [
          { text: `${fixed(eff, 1)}%`, why: "" },
          { text: `${fixed((P / (P + loss / 3)) * 100, 1)}%`,
            why: "That counts the loss in only one conductor. A three-phase line has <b>three</b> of them, each carrying the line current." },
          { text: `${fixed((P - loss) / P * 100, 1)}%`,
            why: "Close, but the loss is <em>additional</em> to what is delivered — it belongs in the input, not subtracted from the output. η = P<sub>out</sub>/(P<sub>out</sub> + P<sub>loss</sub>)." },
          { text: `${fixed(100 - loss / P * 100 * 3, 1)}%`, why: "The loss has been counted three times over." },
        ],
        answer: 0,
        steps: [
          ...common,
          `<span class="math display" data-tex="\\eta = \\frac{P_{out}}{P_{out}+P_{loss}} = \\frac{${num(P, 0)}}{${num(P + loss, 0)}} = ${fixed(eff, 1)}\\%"></span>`,
          `<b>${fixed(eff, 1)}%.</b>`,
        ],
      };
    }

    return {
      stem: `A three-phase line delivers ${kW} kW at ${num(VL, 0)} V and ${pf} power factor lagging. ` +
            `Each conductor has ${R} Ω of resistance. What is the total line loss, most nearly?`,
      choices: [
        { text: `${fixed(loss / 1000, 2)} kW`, why: "" },
        { text: `${fixed(loss / 3000, 2)} kW`, why: "That is one conductor's share. Three conductors carry the line current, so multiply by three." },
        { text: `${fixed(3 * (P / (RT3 * VL)) ** 2 * R / 1000, 2)} kW`,
          why: "The power factor was left out of the current. At lagging pf the current is <b>larger</b> than the watts alone suggest, and loss goes as its square." },
        { text: `${fixed(3 * Il * R / 1000, 2)} kW`, why: `That is ${T("3IR")} — a voltage, not a power. Loss needs ${T("I^2R")}.` },
      ],
      answer: 0,
      steps: [...common, `<b>${fixed(loss / 1000, 2)} kW.</b> That is ${fixed(loss / P * 100, 1)}% of what the line is delivering.`],
    };
  },
});

defineProblem("volt-reg", {
  topic: "Voltage regulation",
  lookup: "Electrical → Power → Voltage regulation",
  make(rng) {
    const Vfl = rng.pick([115, 120, 230, 460, 2300, 4000]);
    const pct = rng.pick([2, 3, 4, 5, 8, 12]);
    const Vnl = Vfl * (1 + pct / 100);

    return {
      stem: `A feeder measures ${fixed(Vnl, 1)} V at no load and ${Vfl} V at full load. ` +
            `What is its voltage regulation, most nearly?`,
      choices: [
        { text: `${fixed(pct, 1)}%`, why: "" },
        { text: `${fixed((Vnl - Vfl) / Vnl * 100, 1)}%`,
          why: "Divided by the <b>no-load</b> voltage. Voltage regulation is referenced to the <b>full-load</b> value — that is the condition the equipment actually has to operate in." },
        { text: `${fixed(Vnl / Vfl * 100, 1)}%`, why: "That is the ratio itself, not the change. Regulation is a percentage <em>difference</em>." },
        { text: `${fixed(Vnl - Vfl, 1)}%`, why: "That is the drop in volts, not a percentage." },
      ],
      answer: 0,
      steps: [
        `Voltage regulation compares the no-load and full-load voltages, referenced to full load:`,
        `<span class="math display" data-tex="\\text{VR}\\% = \\frac{|V_{nl}| - |V_{fl}|}{|V_{fl}|} \\times 100"></span>`,
        `<span class="math display" data-tex="= \\frac{${fixed(Vnl, 1)} - ${Vfl}}{${Vfl}} \\times 100 = ${fixed(pct, 1)}\\%"></span>`,
        `<b>${fixed(pct, 1)}%.</b> ${pct <= 5 ? "Within the ±5% that service standards generally require." : "Well outside the ±5% service standards generally allow — this feeder needs a larger conductor, a shorter run, or power factor correction at the load."}`,
      ],
    };
  },
});

defineProblem("line-drop", {
  topic: "Voltage drop along a line",
  lookup: "Electrical → Power → Voltage drop",
  make(rng) {
    const Vr = rng.pick([120, 240, 277, 480]);
    const I = rng.pick([10, 20, 24, 40, 50]);
    const R = rng.pick([0.2, 0.5, 0.8, 1.0]);
    const X = rng.pick([0.3, 0.5, 0.6]);
    const pf = rng.pick([0.6, 0.7, 0.8, 0.9]);
    const th = Math.acos(pf);
    const Ire = I * pf, Iim = -I * Math.sin(th);
    const vsRe = Vr + (Ire * R - Iim * X);
    const vsIm = Ire * X + Iim * R;
    const Vs = Math.hypot(vsRe, vsIm);

    return {
      stem: `A load draws ${I} A at ${pf} power factor lagging, with ${Vr} V at its terminals. ` +
            `The line supplying it has an impedance of ${T(`${R} + j${X}\\ \\Omega`)}. ` +
            `What sending-end voltage is required, most nearly?`,
      choices: [
        { text: `${fixed(Vs, 1)} V`, why: "" },
        { text: `${fixed(Vr + I * R, 1)} V`,
          why: `That is ${T("V_R + IR")} — resistance only. The reactance carries current too, and at a lagging power factor its contribution largely <b>adds</b> to the magnitude rather than cancelling.` },
        { text: `${fixed(Vr + I * Math.hypot(R, X), 1)} V`,
          why: `That adds the full ${T("I|Z|")} arithmetically. The drop is a <b>phasor</b> added to a phasor — only its component along V<sub>R</sub> raises the magnitude much.` },
        { text: `${fixed(Vr - (Vs - Vr), 1)} V`,
          why: "Subtracted instead of added. The sending end is always the <b>higher</b> of the two — the line cannot manufacture voltage." },
      ],
      answer: 0,
      steps: [
        `Take the load voltage as the reference. The current lags it by ${T(`\\arccos ${pf} = ${fixed(th * D, 1)}^\\circ`)}:`,
        `<span class="math display" data-tex="\\mathbf{I} = ${I}\\angle-${fixed(th * D, 1)}^\\circ = ${fixed(Ire, 2)} - j${fixed(-Iim, 2)}\\text{ A}"></span>`,
        `<span class="math display" data-tex="\\mathbf{V}_S = \\mathbf{V}_R + \\mathbf{I}\\mathbf{Z} = ${Vr} + (${fixed(Ire, 2)} - j${fixed(-Iim, 2)})(${R} + j${X})"></span>`,
        `<span class="math display" data-tex="= ${fixed(vsRe, 2)} ${vsIm >= 0 ? "+" : "-"} j${fixed(Math.abs(vsIm), 2)} = ${fixed(Vs, 1)}\\angle${fixed(Math.atan2(vsIm, vsRe) * D, 1)}^\\circ\\text{ V}"></span>`,
        `<b>${fixed(Vs, 1)} V</b> — a drop of ${fixed(Vs - Vr, 1)} V, against ${fixed(I * R, 1)} V from the resistance alone.`,
      ],
    };
  },
});

defineProblem("hv-benefit", {
  topic: "Why transmission voltage is high",
  lookup: "Electrical → Power → Transmission losses",
  make(rng) {
    const n = rng.pick([2, 3, 4, 5, 10, 20]);
    const V1 = rng.pick([240, 480, 4160]);
    const ask = rng.pick(["loss", "current"]);

    if (ask === "current") {
      return {
        stem: `The same real power is delivered over the same line, but the voltage is raised from ${num(V1, 0)} V to ${num(V1 * n, 0)} V ` +
              `at unchanged power factor. By what factor does the line current change?`,
        choices: [
          { text: `${n}× smaller`, why: "" },
          { text: `${n * n}× smaller`, why: `That is what happens to the <b>loss</b>. Current itself is inversely proportional to voltage — the square appears only when you put that current into ${T("I^2R")}.` },
          { text: `${n}× larger`, why: "The wrong direction. At fixed power, raising voltage <b>lowers</b> current — that is the whole point of doing it." },
          { text: "unchanged", why: `Current is set by ${T("P/(\\sqrt{3}V\\cos\\theta)")}, so it cannot be independent of the voltage.` },
        ],
        answer: 0,
        steps: [
          `At fixed delivered power and power factor, current and voltage are inversely proportional:`,
          `<span class="math display" data-tex="I_L = \\frac{P}{\\sqrt{3}\\,V_L\\cos\\theta} \;\\propto\; \\frac{1}{V_L}"></span>`,
          `Raising the voltage ${n}-fold therefore divides the current by ${n}: <b>${n}× smaller</b>.`,
        ],
      };
    }

    return {
      stem: `A transmission voltage is raised by a factor of ${n} while the same real power is delivered over the same conductors ` +
            `at unchanged power factor. What happens to the line loss?`,
      choices: [
        { text: `It falls to 1/${n * n} of its former value`, why: "" },
        { text: `It falls to 1/${n} of its former value`,
          why: `That is what happens to the <b>current</b>. Loss is ${T("I^2R")}, so the factor is squared.` },
        { text: `It rises by a factor of ${n * n}`, why: "The wrong direction — higher voltage means lower current at fixed power, and therefore lower loss." },
        { text: "It is unchanged, since the same power is delivered", why: "Loss depends on <b>current</b>, not on power delivered. Two lines carrying the same watts at different voltages carry very different currents." },
      ],
      answer: 0,
      steps: [
        `Current at fixed power is inversely proportional to voltage:`,
        `<span class="math display" data-tex="I_L = \\frac{P}{\\sqrt{3}V_L\\cos\\theta}"></span>`,
        `Substituting into the loss expression makes the dependence explicit:`,
        `<span class="math display" data-tex="P_{loss} = 3I_L^2R = \\frac{P^2R}{V_L^2\\cos^2\\theta} \;\\propto\; \\frac{1}{V_L^2}"></span>`,
        `<b>Loss falls to 1/${n * n}.</b> A ${n}:1 transformer at each end buys a ${n * n}-fold reduction in wasted power, which is why the grid is built the way it is.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "transmission",
    stem: "A 3-phase line carries 60 A through 1.2 Ω per conductor. Total loss?",
    tool: "P_loss = 3 I_L² R",
    because: "Three conductors each carry the line current — the factor of three is the step most often dropped.",
  },
  {
    part: "transmission",
    stem: "A feeder reads 252 V unloaded and 240 V at full load. Regulation?",
    tool: "VR% = (V_nl − V_fl) / V_fl × 100",
    because: "Referenced to the full-load voltage, not the no-load one.",
  },
  {
    part: "transmission",
    stem: "Transmission voltage is tripled at the same delivered power. Loss?",
    tool: "P_loss ∝ 1/V²",
    because: "Current falls with voltage and loss goes as current squared, so the factor is nine.",
  },
  {
    part: "transmission",
    stem: "A load draws 30 A at 0.7 lagging through a line of 0.4 + j0.6 Ω. Sending-end volts?",
    tool: "V_S = V_R + I Z, as phasors",
    because: "The drop is a complex addition; I·R alone understates it at a lagging power factor.",
  },
]);

/* ==========================================================================
   Part 4 — transformers
   ========================================================================== */

defineProblem("turns-ratio", {
  topic: "Turns ratio",
  lookup: "Electrical → Power → Transformers (ideal)",
  make(rng) {
    const [V1, V2] = rng.pick([[480, 120], [2400, 240], [4160, 208], [7200, 240], [240, 120], [13800, 480]]);
    const a = V1 / V2;
    const Rl = rng.pick([2, 5, 8, 10, 20]);
    const I2 = V2 / Rl;
    const I1 = I2 / a;
    const ask = rng.pick(["I1", "I2"]);

    return {
      stem: `An ideal ${num(V1, 0)} : ${num(V2, 0)} V transformer supplies a ${Rl} Ω resistive load on its secondary. ` +
            `What is the ${ask === "I1" ? "primary" : "secondary"} current, most nearly?`,
      choices: ask === "I1"
        ? [
            { text: `${fixed(I1, 2)} A`, why: "" },
            { text: `${fixed(I2, 2)} A`, why: "That is the <b>secondary</b> current. The primary is the high-voltage side, so it carries less current, by the turns ratio." },
            { text: `${fixed(I2 * a, 2)} A`, why: "Multiplied by the turns ratio where you should divide. The high-voltage winding always carries the <em>smaller</em> current." },
            { text: `${fixed(V1 / Rl, 2)} A`, why: "That puts the primary voltage across the secondary's load resistance. The load only ever sees the secondary voltage." },
          ]
        : [
            { text: `${fixed(I2, 2)} A`, why: "" },
            { text: `${fixed(I1, 2)} A`, why: "That is the <b>primary</b> current, smaller by the turns ratio." },
            { text: `${fixed(V1 / Rl, 2)} A`, why: "That uses the primary voltage across the load. The load sees the secondary voltage only." },
            { text: `${fixed(I2 / a, 2)} A`, why: "Divided by the turns ratio a second time." },
          ],
      answer: 0,
      steps: [
        `<span class="math display" data-tex="a = \\frac{V_1}{V_2} = \\frac{${V1}}{${V2}} = ${fixed(a, 2)}"></span>`,
        `The load sees the secondary voltage, so Ohm's law gives the secondary current:`,
        `<span class="math display" data-tex="I_2 = \\frac{V_2}{R} = \\frac{${V2}}{${Rl}} = ${fixed(I2, 2)}\\text{ A}"></span>`,
        ask === "I1"
          ? `Current inverts through the ratio:<span class="math display" data-tex="I_1 = \\frac{I_2}{a} = \\frac{${fixed(I2, 2)}}{${fixed(a, 2)}} = ${fixed(I1, 2)}\\text{ A}"></span><b>${fixed(I1, 2)} A.</b> Check: ${T(`V_1I_1 = ${num(V1 * I1, 0)}`)} VA and ${T(`V_2I_2 = ${num(V2 * I2, 0)}`)} VA ✓`
          : `<b>${fixed(I2, 2)} A.</b> Check the power both ways: ${T(`V_2I_2 = ${num(V2 * I2, 0)}`)} VA, and on the primary ${T(`V_1I_1 = ${num(V1 * I1, 0)}`)} VA ✓`,
      ],
    };
  },
});

defineProblem("reflected-z", {
  topic: "Reflected impedance",
  lookup: "Electrical → Power → Transformers (reflected impedance)",
  make(rng) {
    const a = rng.pick([2, 3, 4, 5, 10, 20]);
    const Z2 = rng.pick([4, 5, 8, 10, 25, 50]);
    const Z1 = a * a * Z2;

    return {
      stem: `An ideal transformer has a turns ratio of ${a} : 1. A ${Z2} Ω load is connected to the secondary. ` +
            `What impedance does the source on the primary side see?`,
      choices: [
        { text: `${num(Z1, 0)} Ω`, why: "" },
        { text: `${num(a * Z2, 0)} Ω`, why: `Multiplied by <b>a</b>, not a². Voltage scales by a <em>and</em> current scales by 1/a, so their ratio scales by a².` },
        { text: `${num(Z2 / (a * a), 4)} Ω`, why: "Divided instead of multiplied. Looking in from the <b>high-voltage</b> side, the load looks <em>larger</em>." },
        { text: `${num(Z2, 0)} Ω`, why: "Unchanged. A transformer's most useful property is precisely that it does <b>not</b> leave impedance alone." },
      ],
      answer: 0,
      steps: [
        `Voltage is multiplied by <b>a</b> and current divided by <b>a</b>, so their ratio picks up both:`,
        `<span class="math display" data-tex="Z_1 = \\frac{V_1}{I_1} = \\frac{aV_2}{I_2/a} = a^2\\frac{V_2}{I_2} = a^2 Z_2"></span>`,
        `<span class="math display" data-tex="Z_1 = (${a})^2 \\times ${Z2} = ${num(Z1, 0)}\\ \\Omega"></span>`,
        `<b>${num(Z1, 0)} Ω.</b> This is what impedance matching means: choosing <b>a</b> so that a fixed load looks like whatever the source wants to drive.`,
      ],
    };
  },
});

defineProblem("xfmr-3ph", {
  topic: "Three-phase transformer banks",
  lookup: "Electrical → Power → Transformers (three-phase connections)",
  make(rng) {
    const conn = rng.pick(["dy", "yd", "yy", "dd"]);
    const a = rng.pick([5, 10, 20]);
    const VL1 = rng.pick([2400, 4160, 12470, 13800]);
    const k = { dy: RT3, yd: 1 / RT3, yy: 1, dd: 1 }[conn];
    const label = { dy: "delta–wye", yd: "wye–delta", yy: "wye–wye", dd: "delta–delta" }[conn];
    const ratio = a / k;
    const V2 = VL1 / ratio;

    return {
      stem: `Three single-phase transformers, each with a turns ratio of ${a} : 1, are connected ${label} ` +
            `on a ${num(VL1, 0)} V (line-to-line) primary. What is the secondary line-to-line voltage, most nearly?`,
      choices: [
        { text: `${fixed(V2, 1)} V`, why: "" },
        { text: `${fixed(VL1 / a, 1)} V`,
          why: k === 1
            ? ""
            : `That treats the nameplate turns ratio as the line-to-line ratio. It only is when <b>both sides are connected the same way</b> — here the connections differ, so one √3 survives.` },
        { text: `${fixed(VL1 / (a * RT3), 1)} V`, why: `Divided by √3 where you should ${k > 1 ? "have multiplied after dividing by the turns ratio" : "not have"}.` },
        { text: `${fixed((VL1 / a) * RT3, 1)} V`, why: `Multiplied by √3 in the wrong direction for a ${label} bank.` },
      ].filter((c, i, all) => i === 0 || (c.why !== "" && Math.abs(parseFloat(c.text) - parseFloat(all[0].text)) > 0.5)),
      answer: 0,
      steps: [
        k === 1
          ? `Both sides use the same connection, so the √3 between line and phase appears on the primary <em>and</em> the secondary — and cancels:`
          : `The two sides are connected differently, so the √3 appears on only one of them and survives into the overall ratio:`,
        `<span class="math display" data-tex="\\frac{V_{L1}}{V_{L2}} = ${{ dy: "\\frac{a}{\\sqrt{3}}", yd: "a\\sqrt{3}", yy: "a", dd: "a" }[conn]} = ${fixed(ratio, 3)}"></span>`,
        `<span class="math display" data-tex="V_{L2} = \\frac{${VL1}}{${fixed(ratio, 3)}} = ${fixed(V2, 1)}\\text{ V}"></span>`,
        `<b>${fixed(V2, 1)} V.</b> ${k === 1 ? "Matched connections are the easy case — the line ratio is the turns ratio." : "The nameplate says " + a + " : 1; the bank does " + fixed(ratio, 2) + " : 1. That gap is the √3."}`,
      ],
    };
  },
});

defineProblem("xfmr-rating", {
  topic: "Transformer rating and loading",
  lookup: "Electrical → Power → Transformers (rating, efficiency)",
  make(rng) {
    const kva = rng.pick([25, 50, 75, 100, 150, 500]);
    const pf = rng.pick([0.7, 0.8, 0.85, 0.9]);
    const V2 = rng.pick([240, 480, 208]);
    const ask = rng.pick(["kw", "amps"]);

    if (ask === "amps") {
      const I = (kva * 1000) / V2;
      return {
        stem: `A ${kva} kVA single-phase transformer has a ${V2} V secondary. What is its rated secondary current?`,
        choices: [
          { text: `${fixed(I, 1)} A`, why: "" },
          { text: `${fixed(I * pf, 1)} A`, why: "The power factor does not belong here. A transformer is rated in <b>kVA</b> precisely because its limit is current, whatever the angle." },
          { text: `${fixed(I / RT3, 1)} A`, why: "The √3 is for three-phase. This is a single-phase transformer." },
          { text: `${fixed(kva * 1000 * V2 / 1000, 0)} A`, why: "Multiplied where you should divide — current is VA over volts." },
        ],
        answer: 0,
        steps: [
          `Rated current is simply the rating divided by the voltage:`,
          `<span class="math display" data-tex="I = \\frac{S}{V} = \\frac{${kva}{,}000}{${V2}} = ${fixed(I, 1)}\\text{ A}"></span>`,
          `<b>${fixed(I, 1)} A.</b> Note the power factor never entered. <b>Transformers are rated in kVA</b> because both loss mechanisms — core loss from voltage, copper loss from current — are indifferent to the angle between them.`,
        ],
      };
    }

    return {
      stem: `A ${kva} kVA transformer supplies a load at ${pf} power factor lagging. ` +
            `What is the maximum real power it can deliver?`,
      choices: [
        { text: `${fixed(kva * pf, 1)} kW`, why: "" },
        { text: `${fixed(kva, 1)} kW`, why: "That is the kVA rating. Only at unity power factor are the two numbers equal." },
        { text: `${fixed(kva / pf, 1)} kW`, why: "Divided instead of multiplied — this exceeds the transformer's rating, which is impossible." },
        { text: `${fixed(kva * Math.sqrt(1 - pf * pf), 1)} kW`, why: `That used ${T("\\sin\\theta")}, giving the reactive power in kVAR.` },
      ],
      answer: 0,
      steps: [
        `The transformer's limit is apparent power. Real power is that limit times the power factor:`,
        `<span class="math display" data-tex="P = S\\cos\\theta = ${kva} \\times ${pf} = ${fixed(kva * pf, 1)}\\text{ kW}"></span>`,
        `<b>${fixed(kva * pf, 1)} kW.</b> The remaining ${fixed(kva * Math.sqrt(1 - pf * pf), 1)} kVAR of capacity is consumed by the load's angle and does no work — the argument from Part 1, now costing transformer capacity instead of cable.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "transformers",
    stem: "A 25 Ω load sits on the secondary of a 4 : 1 transformer. What does the source see?",
    tool: "Z₁ = a² Z₂",
    because: "Voltage scales by a and current by 1/a, so their ratio scales by a squared.",
  },
  {
    part: "transformers",
    stem: "Three 10 : 1 transformers in delta–wye on 4160 V. Secondary line voltage?",
    tool: "V_L2 = V_L1 √3 / a",
    because: "Mismatched connections leave one √3 uncancelled, so the bank ratio is not the nameplate ratio.",
  },
  {
    part: "transformers",
    stem: "A 75 kVA transformer feeds a 0.8 pf load. Most kilowatts it can carry?",
    tool: "P = S × pf",
    because: "The rating is apparent power; the power factor decides how much of it is real.",
  },
  {
    part: "transformers",
    stem: "At what load is a transformer's efficiency highest?",
    tool: "where copper loss equals core loss",
    because: "Core loss is constant and copper loss goes as load squared, so the sum per watt delivered is least where they match.",
  },
]);
