/* ==========================================================================
   problems/electronics.js — generators for Electronics.

   Part 1 (9.A): diode models, the diode equation, state solving, Zeners.
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed, sci } from "../lib/fmt.js";

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;

const VT = 0.02585;                 // thermal voltage at 300 K

/* ==========================================================================
   Part 1 — diodes
   ========================================================================== */

defineProblem("diode-model", {
  topic: "Diode circuits with the constant-drop model",
  lookup: "Electrical → Electronics → Diodes (models)",
  make(rng) {
    const Vs = rng.pick([5, 9, 10, 12, 15, 20]);
    const R = rng.pick([220, 470, 1000, 2200, 4700]);
    const two = rng.pick([false, false, true]);
    const Vf = two ? 1.4 : 0.7;
    const I = (Vs - Vf) / R;

    return {
      stem: `A ${Vs} V source drives ${two ? "two series silicon diodes" : "a silicon diode"} and a ${num(R, 0)} Ω resistor in series. ` +
            `Using the constant-drop model, what current flows, most nearly?`,
      choices: [
        { text: `${fixed(I * 1000, 2)} mA`, why: "" },
        { text: `${fixed(Vs / R * 1000, 2)} mA`,
          why: `That is the <b>ideal</b> model — the diode drop was ignored. At ${Vs} V that is a ${fixed((Vs / (Vs - Vf) - 1) * 100, 0)}% error, which is usually enough to change the answer.` },
        { text: `${fixed((Vs - (two ? 0.7 : 1.4)) / R * 1000, 2)} mA`,
          why: two
            ? "Only one diode's drop was subtracted. <b>Series diodes each take 0.7 V</b>, so two take 1.4 V."
            : "That subtracts 1.4 V, which would be two diodes in series. There is only one here." },
        { text: `${fixed(Vf / R * 1000, 2)} mA`,
          why: "That puts the diode's drop across the resistor. The resistor gets what is <b>left over</b> from the supply after the diode takes its share." },
      ],
      answer: 0,
      steps: [
        `Replace the diode${two ? "s" : ""} with ${two ? "a 1.4 V drop (0.7 V each)" : "a fixed 0.7 V drop"}. What remains for the resistor is:`,
        `<span class="math display" data-tex="V_R = ${Vs} - ${Vf} = ${fixed(Vs - Vf, 1)}\\text{ V}"></span>`,
        `<span class="math display" data-tex="I = \\frac{${fixed(Vs - Vf, 1)}}{${R}} = ${fixed(I * 1000, 2)}\\text{ mA}"></span>`,
        `<b>${fixed(I * 1000, 2)} mA.</b> Check the assumption: the current came out positive, so the diode${two ? "s are" : " is"} indeed conducting.`,
      ],
    };
  },
});

defineProblem("diode-eq", {
  topic: "The diode equation",
  lookup: "Electrical → Electronics → Diodes (Shockley equation)",
  make(rng) {
    const form = rng.pick(["voltage", "ratio"]);

    if (form === "ratio") {
      const frac = rng.pick([0.5, 0.9, 0.95, 0.99]);
      // I = Is(e^(V/VT) - 1) = frac * Is  ->  e^(V/VT) = 1 + frac
      const Vd = VT * Math.log(1 + frac);
      return {
        stem: `A silicon pn diode at room temperature has a thermal voltage of 25.9 mV. ` +
              `What forward voltage makes its current equal ${fixed(frac * 100, 0)}% of the saturation current, most nearly?`,
        choices: [
          { text: `${fixed(Vd, 3)} V`, why: "" },
          { text: `${fixed(VT * Math.log(frac), 3)} V`,
            why: `The <b>−1</b> was dropped. It is negligible only when the current is <em>much larger</em> than ${T("I_S")}; here the current is a fraction of it, so the −1 dominates.` },
          { text: "0.700 V", why: "That is the conducting-diode rule of thumb, which applies at milliamps — six or more orders of magnitude above the saturation current." },
          { text: `${fixed(VT * frac, 3)} V`, why: "That multiplies rather than taking a logarithm. The relation between current and voltage here is exponential, so its inverse is a log." },
        ],
        answer: 0,
        steps: [
          `Start from the full equation and set the current to ${frac} I<sub>S</sub>:`,
          `<span class="math display" data-tex="${frac}\\,I_S = I_S\\left(e^{V_D/V_T} - 1\\right)"></span>`,
          `The saturation current cancels, which is why the answer does not depend on it:`,
          `<span class="math display" data-tex="e^{V_D/V_T} = 1 + ${frac} \\quad\\Longrightarrow\\quad V_D = V_T\\ln(${1 + frac})"></span>`,
          `<span class="math display" data-tex="V_D = (0.0259)(${fixed(Math.log(1 + frac), 4)}) = ${fixed(Vd, 3)}\\text{ V}"></span>`,
          `<b>${fixed(Vd, 3)} V.</b> Well below 0.7 V — at these tiny currents the diode is barely on, and keeping the −1 is essential.`,
        ],
      };
    }

    const Is = rng.pick([1e-14, 1e-13, 1e-12]);
    const Id = rng.pick([1e-3, 5e-3, 1e-2, 1e-1]);
    const Vd = VT * Math.log(Id / Is + 1);
    return {
      stem: `A diode with a saturation current of ${sci(Is, 1)} A carries ${Id >= 1e-3 ? `${fixed(Id * 1000, 0)} mA` : `${sci(Id, 1)} A`} at room temperature ` +
            `(${T("V_T = 25.9")} mV). What is the voltage across it, most nearly?`,
      choices: [
        { text: `${fixed(Vd, 3)} V`, why: "" },
        { text: `${fixed(VT * Math.log10(Id / Is), 3)} V`,
          why: `A base-10 logarithm was used. The diode equation is a <b>natural</b> exponential, so its inverse is ${T("\\ln")}, not ${T("\\log_{10}")} — the two differ by a factor of 2.303.` },
        { text: `${fixed(Vd * 1000, 1)} V`, why: "Off by a factor of 1000 — the thermal voltage is in millivolts, and mixing units here is the usual slip." },
        { text: "0.700 V", why: "The rule-of-thumb value. It is close for milliamp currents on a typical diode, but this question is asking you to use the equation." },
      ].filter((c, i, all) => i === 0 || Math.abs(parseFloat(c.text) - parseFloat(all[0].text)) > 0.005),
      answer: 0,
      steps: [
        `Invert the diode equation. The current is far above ${T("I_S")}, so the −1 can go:`,
        `<span class="math display" data-tex="I \\approx I_Se^{V_D/V_T} \\quad\\Longrightarrow\\quad V_D = V_T\\ln\\frac{I}{I_S}"></span>`,
        `<span class="math display" data-tex="V_D = (0.0259)\\ln\\!\\left(\\frac{${sci(Id, 1)}}{${sci(Is, 1)}}\\right) = (0.0259)(${fixed(Math.log(Id / Is), 2)}) = ${fixed(Vd, 3)}\\text{ V}"></span>`,
        `<b>${fixed(Vd, 3)} V</b> — near the familiar 0.7 V, which is the whole reason that rule of thumb exists.`,
      ],
    };
  },
});

defineProblem("diode-state", {
  topic: "Is the diode conducting?",
  lookup: "Electrical → Electronics → Diodes (analysis)",
  make(rng) {
    // a divider with a diode from the midpoint to a second rail
    const Vs = rng.pick([10, 12, 15]);
    const R1 = rng.pick([1, 2, 3]) * 1000;
    const R2 = rng.pick([1, 2, 3]) * 1000;
    const Vmid = (Vs * R2) / (R1 + R2);
    const Vrail = rng.pick([2, 4, 6, 8, 10]);
    // diode anode at the rail, cathode at the midpoint: on if Vrail > Vmid + 0.7
    const on = Vrail > Vmid + 0.7;

    return {
      stem: `A ${Vs} V source feeds a divider of ${num(R1 / 1000, 0)} kΩ and ${num(R2 / 1000, 0)} kΩ to ground. ` +
            `A silicon diode connects a ${Vrail} V rail (anode) to the divider's midpoint (cathode). Is the diode conducting?`,
      choices: on
        ? [
            { text: `Yes — the rail exceeds the midpoint by more than 0.7 V`, why: "" },
            { text: `No — the midpoint sits at ${fixed(Vmid, 2)} V, above the rail`, why: `The midpoint is at ${fixed(Vmid, 2)} V and the rail at ${Vrail} V, so the anode is <b>higher</b>. Forward bias exceeds 0.7 V and the diode turns on.` },
            { text: `No — silicon diodes need 0.7 V and only ${fixed(Math.abs(Vrail - Vmid), 2)} V is available`, why: `${fixed(Vrail - Vmid, 2)} V is available across the diode, which is <b>more</b> than the 0.7 V it needs.` },
            { text: `Cannot be determined without the diode's saturation current`, why: "The constant-drop model needs nothing but the 0.7 V threshold. Saturation current only matters if the question asks for an exact voltage." },
          ]
        : [
            { text: `No — the open-circuit bias is only ${fixed(Vrail - Vmid, 2)} V`, why: "" },
            { text: `Yes — any forward voltage turns a diode on`, why: "A silicon diode needs roughly <b>0.7 V</b> before it conducts meaningfully. Below that it passes microamps at most, and the constant-drop model calls it off." },
            { text: `Yes — the ${Vrail} V rail is the higher potential`, why: `Being higher is not enough; it has to be higher <b>by 0.7 V</b>. Here the difference is only ${fixed(Vrail - Vmid, 2)} V.` },
            { text: `Cannot be determined without the diode's saturation current`, why: "The constant-drop model needs only the 0.7 V threshold." },
          ],
      answer: 0,
      steps: [
        `<b>Assume the diode is off.</b> Then it carries no current, the divider is undisturbed, and the midpoint sits at:`,
        `<span class="math display" data-tex="V_{mid} = ${Vs}\\times\\frac{${R2 / 1000}}{${R1 / 1000}+${R2 / 1000}} = ${fixed(Vmid, 2)}\\text{ V}"></span>`,
        `<b>Now check.</b> The anode is at ${Vrail} V and the cathode at ${fixed(Vmid, 2)} V, so the forward bias is ${T(`${Vrail} - ${fixed(Vmid, 2)} = ${fixed(Vrail - Vmid, 2)}`)} V.`,
        on
          ? `That exceeds 0.7 V, so the "off" assumption <b>fails</b> — the diode is conducting, and the circuit must be re-solved with the midpoint clamped near ${fixed(Vrail - 0.7, 2)} V.`
          : `That is below 0.7 V, so the "off" assumption <b>holds</b> and the diode really is off. <b>The answer is the assumption that survives its own check</b> — never the one that looks right in the drawing.`,
      ],
    };
  },
});

defineProblem("zener-design", {
  topic: "Zener regulators",
  lookup: "Electrical → Electronics → Zener diodes",
  make(rng) {
    const Vz = rng.pick([3.3, 5.1, 6.2, 9.1, 12]);
    const Vin = rng.pick([15, 18, 20, 24]);
    const Rs = rng.pick([220, 330, 470, 680]);
    const Rl = rng.pick([1, 2, 4.7]) * 1000;
    const Ir = (Vin - Vz) / Rs;
    const Il = Vz / Rl;
    const Iz = Ir - Il;
    const ask = rng.pick(["current", "power"]);

    const setup = [
      `With the Zener in breakdown the output is pinned at ${Vz} V, so both other branch currents follow immediately:`,
      `<span class="math display" data-tex="I_{R_S} = \\frac{V_{in}-V_Z}{R_S} = \\frac{${Vin}-${Vz}}{${Rs}} = ${fixed(Ir * 1000, 2)}\\text{ mA}"></span>`,
      `<span class="math display" data-tex="I_L = \\frac{V_Z}{R_L} = \\frac{${Vz}}{${num(Rl, 0)}} = ${fixed(Il * 1000, 2)}\\text{ mA}"></span>`,
      `The Zener takes whatever is left, by KCL:`,
      `<span class="math display" data-tex="I_Z = ${fixed(Ir * 1000, 2)} - ${fixed(Il * 1000, 2)} = ${fixed(Iz * 1000, 2)}\\text{ mA}"></span>`,
    ];

    if (ask === "power") {
      const Pz = Vz * Iz;
      return {
        stem: `A ${Vz} V Zener regulates a ${Vin} V supply through a ${Rs} Ω series resistor, feeding a ${num(Rl / 1000, Rl % 1000 ? 1 : 0)} kΩ load. ` +
              `What power does the Zener dissipate, most nearly?`,
        choices: [
          { text: `${fixed(Pz * 1000, 0)} mW`, why: "" },
          { text: `${fixed(Vz * Ir * 1000, 0)} mW`, why: "That gives the Zener <b>all</b> the current through R<sub>S</sub>. The load takes its share first; the Zener only gets the remainder." },
          { text: `${fixed(Vin * Iz * 1000, 0)} mW`, why: `The <b>input</b> voltage was used. The Zener has only ${Vz} V across it — the rest is dropped by R<sub>S</sub>.` },
          { text: `${fixed(Iz * Iz * Rs * 1000, 0)} mW`, why: `That is ${T("I^2R_S")}, the power in the series resistor, not in the Zener.` },
        ],
        answer: 0,
        steps: [
          ...setup,
          `<span class="math display" data-tex="P_Z = V_ZI_Z = (${Vz})(${fixed(Iz, 4)}) = ${fixed(Pz * 1000, 0)}\\text{ mW}"></span>`,
          `<b>${fixed(Pz * 1000, 0)} mW.</b> Worst case for the Zener is <em>maximum</em> input with the load <em>disconnected</em> — then it carries the whole ${fixed(Ir * 1000, 2)} mA and dissipates ${fixed(Vz * Ir * 1000, 0)} mW.`,
        ],
      };
    }

    return {
      stem: `A ${Vz} V Zener regulates a ${Vin} V supply through a ${Rs} Ω series resistor, feeding a ${num(Rl / 1000, Rl % 1000 ? 1 : 0)} kΩ load. ` +
            `What current flows through the Zener, most nearly?`,
      choices: [
        { text: `${fixed(Iz * 1000, 2)} mA`, why: "" },
        { text: `${fixed(Ir * 1000, 2)} mA`, why: "That is the current through R<sub>S</sub>. It splits at the output node — the load takes part of it and the Zener takes the rest." },
        { text: `${fixed(Il * 1000, 2)} mA`, why: "That is the load current." },
        { text: `${fixed((Ir + Il) * 1000, 2)} mA`, why: "The two currents were added. At the output node the incoming current <b>divides</b> between the Zener and the load, so they subtract." },
      ],
      answer: 0,
      steps: [
        ...setup,
        `<b>${fixed(Iz * 1000, 2)} mA.</b> Sanity check: it is positive, so the Zener really is in breakdown and the assumption stands. A negative result would have meant the load was taking everything and the regulator had dropped out.`,
      ],
    };
  },
});

/* ==========================================================================
   Reflex items
   ========================================================================== */

defineReflex([
  {
    part: "diode",
    stem: "A 12 V source, a silicon diode and a 470 Ω resistor in series. Current?",
    tool: "constant-drop model: I = (V − 0.7) / R",
    because: "At supply voltages of a few volts the 0.7 V drop is too big to ignore and too stable to need the exponential.",
  },
  {
    part: "diode",
    stem: "What voltage makes a diode's current 90% of its saturation current?",
    tool: "the full Shockley equation, keeping the −1",
    because: "Below the knee the −1 dominates, so the usual approximation fails.",
  },
  {
    part: "diode",
    stem: "A 5.1 V Zener, 330 Ω series, 2 kΩ load on 15 V. Zener current?",
    tool: "I_Z = (V_in − V_Z)/R_S − V_Z/R_L",
    because: "The Zener is the remainder term — it takes whatever the load leaves.",
  },
  {
    part: "diode",
    stem: "A diode sits between two nodes and you cannot tell if it conducts.",
    tool: "assume a state, solve, check the sign",
    because: "A conducting diode needs positive current; an off one needs reverse bias. The surviving assumption is the answer.",
  },
]);
