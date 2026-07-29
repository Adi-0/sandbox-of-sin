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

/* ==========================================================================
   Part 2 — rectifiers and power conversion
   ========================================================================== */

const RECT = {
  half: { name: "half-wave", kAvg: 1 / Math.PI, kRms: 0.5, drops: 1, piv: 1, fr: 1,
          avgTex: "V_m/\\pi", rmsTex: "V_m/2" },
  bridge: { name: "full-wave bridge", kAvg: 2 / Math.PI, kRms: 1 / Math.SQRT2, drops: 2, piv: 1, fr: 2,
            avgTex: "2V_m/\\pi", rmsTex: "V_m/\\sqrt{2}" },
  ct: { name: "centre-tapped full-wave", kAvg: 2 / Math.PI, kRms: 1 / Math.SQRT2, drops: 1, piv: 2, fr: 2,
        avgTex: "2V_m/\\pi", rmsTex: "V_m/\\sqrt{2}" },
};

defineProblem("rect-output", {
  topic: "Rectifier output voltage",
  lookup: "Electrical → Electronics → Rectifiers",
  make(rng) {
    const key = rng.pick(["half", "bridge", "bridge", "ct"]);
    const R = RECT[key];
    const Vrms = rng.pick([12.6, 24, 120, 240]);
    const Vm = Vrms * Math.SQRT2;
    const ideal = rng.pick([true, true, false]);
    const Vpk = ideal ? Vm : Vm - 0.7 * R.drops;
    const avg = Vpk * R.kAvg;
    const other = key === "half" ? RECT.bridge : RECT.half;

    return {
      stem: `A ${R.name} rectifier is driven from a ${Vrms} V RMS sinusoid` +
            `${ideal ? " and its diodes are treated as ideal" : ", with silicon diodes"}. ` +
            `What is the average (DC) output voltage, most nearly?`,
      choices: [
        { text: `${fixed(avg, 2)} V`, why: "" },
        { text: `${fixed(Vpk * other.kAvg, 2)} V`,
          why: key === "half"
            ? "That is the <b>full-wave</b> average. A half-wave rectifier throws away half the cycle, so its average is half as large."
            : "That is the <b>half-wave</b> average. This circuit uses both halves of the input, so its average is twice that." },
        { text: `${fixed(Vrms * R.kAvg, 2)} V`,
          why: `The RMS value was used where the <b>peak</b> belongs. The factor ${T(R.avgTex)} multiplies ${T("V_m")}, so convert first: ${T(`V_m = ${Vrms}\\sqrt{2} = ${fixed(Vm, 2)}`)} V.` },
        { text: `${fixed(Vpk * R.kRms, 2)} V`,
          why: `That is the <b>RMS</b> of the output, not its average. Only the average is what a DC voltmeter reads or a battery charger delivers.` },
      ].filter((c, i, all) => i === 0 || Math.abs(parseFloat(c.text) - parseFloat(all[0].text)) > 0.05),
      answer: 0,
      steps: [
        `Peak of the input first — the rectifier formulas are all written in terms of ${T("V_m")}:`,
        `<span class="math display" data-tex="V_m = ${Vrms}\\sqrt{2} = ${fixed(Vm, 2)}\\text{ V}"></span>`,
        ideal
          ? `The diodes are ideal, so the output peak is the input peak.`
          : `${R.drops} diode${R.drops > 1 ? "s are" : " is"} in the load path, so the output peak is ${T(`${fixed(Vm, 2)} - ${fixed(0.7 * R.drops, 1)} = ${fixed(Vpk, 2)}`)} V.`,
        `<span class="math display" data-tex="V_{avg} = ${R.avgTex.replace("V_m", `(${fixed(Vpk, 2)})`)} = ${fixed(avg, 2)}\\text{ V}"></span>`,
        `<b>${fixed(avg, 2)} V.</b> This is the <em>unfiltered</em> average — add a smoothing capacitor and the output climbs towards the peak instead.`,
      ],
    };
  },
});

defineProblem("rect-piv", {
  topic: "Peak inverse voltage and topology",
  lookup: "Electrical → Electronics → Rectifiers (PIV)",
  make(rng) {
    const key = rng.pick(["half", "bridge", "ct"]);
    const R = RECT[key];
    const Vrms = rng.pick([12.6, 24, 48, 120]);
    const Vm = Vrms * Math.SQRT2;
    const piv = Vm * R.piv;
    const ask = rng.pick(["piv", "count"]);

    if (ask === "count") {
      return {
        stem: `Which rectifier uses four diodes but needs no centre-tapped transformer?`,
        choices: [
          { text: "The full-wave bridge", why: "" },
          { text: "The centre-tapped full-wave rectifier", why: "That one uses only <b>two</b> diodes — but it needs the centre tap, which is exactly the trade the bridge avoids." },
          { text: "The half-wave rectifier", why: "One diode, and it only uses half the input." },
          { text: "All three use four diodes", why: "Half-wave uses one, centre-tap uses two, bridge uses four. The count is the quickest way to tell them apart in a figure." },
        ],
        answer: 0,
        steps: [
          `Half-wave: <b>one</b> diode. Centre-tap: <b>two</b> diodes plus a tapped transformer. Bridge: <b>four</b> diodes, ordinary transformer.`,
          `The bridge trades two extra diodes for a simpler transformer, which is almost always the cheaper side of the deal — hence <b>the bridge is the default</b>.`,
          `The cost is that <b>two</b> diode drops sit in the load path instead of one, so at low output voltages the centre-tap can still win.`,
        ],
      };
    }

    return {
      stem: `A ${R.name} rectifier runs from a ${Vrms} V RMS supply. ` +
            `What peak inverse voltage must its diodes withstand, most nearly?`,
      choices: [
        { text: `${fixed(piv, 1)} V`, why: "" },
        { text: `${fixed(Vm * (R.piv === 2 ? 1 : 2), 1)} V`,
          why: R.piv === 2
            ? `That is ${T("V_m")}, right for a bridge or half-wave circuit. In a <b>centre-tapped</b> rectifier the off diode sees <em>both</em> halves of the secondary, so it withstands ${T("2V_m")}.`
            : `That is ${T("2V_m")}, which applies to the <b>centre-tapped</b> circuit. Here the off diode only ever sees one peak.` },
        { text: `${fixed(Vrms * R.piv, 1)} V`, why: `The RMS value was used. Reverse stress is a <b>peak</b> phenomenon — the diode has to survive the worst instant, not the average one.` },
        { text: `${fixed(piv / 2, 1)} V`, why: "Half the correct figure — a diode rated this low would fail on the first negative half cycle." },
      ].filter((c, i, all) => i === 0 || Math.abs(parseFloat(c.text) - parseFloat(all[0].text)) > 0.05),
      answer: 0,
      steps: [
        `<span class="math display" data-tex="V_m = ${Vrms}\\sqrt{2} = ${fixed(Vm, 2)}\\text{ V}"></span>`,
        R.piv === 2
          ? `In a centre-tapped rectifier the non-conducting diode has the <b>whole secondary</b> across it — the conducting half plus the reverse half:`
          : `The non-conducting diode sees at most one peak of the supply:`,
        `<span class="math display" data-tex="\\text{PIV} = ${R.piv === 2 ? "2V_m" : "V_m"} = ${fixed(piv, 1)}\\text{ V}"></span>`,
        `<b>${fixed(piv, 1)} V.</b> In practice a designer would specify a diode rated well above this, since line transients routinely exceed nominal peaks.`,
      ],
    };
  },
});

defineProblem("ripple-calc", {
  topic: "Ripple with a filter capacitor",
  lookup: "Electrical → Electronics → Rectifiers (filtering)",
  make(rng) {
    const full = rng.pick([true, true, false]);
    const f = rng.pick([50, 60]);
    const fr = full ? 2 * f : f;
    const Il = rng.pick([0.05, 0.1, 0.25, 0.5, 1]);
    const C = rng.pick([470, 1000, 2200, 4700]) * 1e-6;
    const Vr = Il / (fr * C);
    const ask = rng.pick(["ripple", "cap"]);

    if (ask === "cap") {
      const target = rng.pick([0.5, 1, 2]);
      const need = Il / (fr * target);
      return {
        stem: `A ${full ? "full-wave" : "half-wave"} rectifier on a ${f} Hz line supplies ${Il >= 1 ? `${Il} A` : `${fixed(Il * 1000, 0)} mA`}. ` +
              `What filter capacitance keeps the peak-to-peak ripple below ${target} V, most nearly?`,
        choices: [
          { text: `${num(need * 1e6, 0)} µF`, why: "" },
          { text: `${num(Il / (f * target) * 1e6, 0)} µF`,
            why: full
              ? "The <b>line</b> frequency was used. A full-wave rectifier recharges the capacitor <b>twice</b> per cycle, so f<sub>r</sub> = 2f and only half this capacitance is needed."
              : "" },
          { text: `${num(Il / (2 * f * target) * 1e6, 0)} µF`,
            why: full ? "" : "That doubles the ripple frequency, which is right for a <b>full-wave</b> rectifier. A half-wave circuit only recharges once per cycle." },
          { text: `${num(need * 1e6 * target * target, 0)} µF`, why: "The ripple target has been applied twice. It enters the formula once, linearly." },
        ].filter((c, i, all) => i === 0 || (c.why !== "" && Math.abs(parseFloat(c.text.replace(/,/g, "")) - parseFloat(all[0].text.replace(/,/g, ""))) > 1)),
        answer: 0,
        steps: [
          `The capacitor supplies the load alone between peaks, so charge out equals ${T("I\\,\\Delta t")} and the sag is ${T("Q/C")}:`,
          `<span class="math display" data-tex="V_r = \\frac{I_L}{f_r C} \\quad\\Longrightarrow\\quad C = \\frac{I_L}{f_r V_r}"></span>`,
          `A ${full ? "full-wave" : "half-wave"} rectifier gives ${T(`f_r = ${full ? "2f = " : "f = "}${fr}`)} Hz.`,
          `<span class="math display" data-tex="C = \\frac{${Il}}{(${fr})(${target})} = ${fixed(need * 1e6, 0)}\\ \\mu\\text{F}"></span>`,
          `<b>${num(need * 1e6, 0)} µF</b>, so the next standard value up would be specified.`,
        ],
      };
    }

    return {
      stem: `A ${full ? "full-wave" : "half-wave"} rectifier on a ${f} Hz line supplies ${Il >= 1 ? `${Il} A` : `${fixed(Il * 1000, 0)} mA`} ` +
            `through a ${num(C * 1e6, 0)} µF filter capacitor. What is the peak-to-peak ripple, most nearly?`,
      choices: [
        { text: `${fixed(Vr, 3)} V`, why: "" },
        { text: `${fixed(Il / (f * C), 3)} V`,
          why: full
            ? "That uses the <b>line</b> frequency. A full-wave rectifier tops the capacitor up twice per cycle, so f<sub>r</sub> = 2f and the ripple is half this."
            : "" },
        { text: `${fixed(Il / (2 * f * C), 3)} V`,
          why: full ? "" : "That doubles the frequency, which is right only for a full-wave circuit." },
        { text: `${fixed(Il * C * fr, 6)} V`, why: "Multiplied where you should divide. More capacitance gives <b>less</b> ripple." },
      ].filter((c, i, all) => i === 0 || (c.why !== "" && Math.abs(parseFloat(c.text) - parseFloat(all[0].text)) > 1e-4)),
      answer: 0,
      steps: [
        `The capacitor alone holds the load up between peaks:`,
        `<span class="math display" data-tex="V_{r(p\\text{-}p)} = \\frac{I_L}{f_r C}"></span>`,
        `${full ? "Full-wave, so the capacitor is recharged twice per cycle" : "Half-wave, so it is recharged once per cycle"}: ${T(`f_r = ${fr}`)} Hz.`,
        `<span class="math display" data-tex="V_r = \\frac{${Il}}{(${fr})(${fixed(C * 1e6, 0)}\\times10^{-6})} = ${fixed(Vr, 3)}\\text{ V}"></span>`,
        `<b>${fixed(Vr, 3)} V peak to peak.</b> The DC output sits about half that below the peak.`,
      ],
    };
  },
});

defineProblem("converter-duty", {
  topic: "Switching converters",
  lookup: "Electrical → Electronics → Power electronics (converters)",
  make(rng) {
    const buck = rng.pick([true, true, false]);
    const Vin = rng.pick([12, 24, 48]);
    const D = rng.pick([0.25, 0.3, 0.4, 0.5, 0.6, 0.75]);
    const Vout = buck ? Vin * D : Vin / (1 - D);

    return {
      stem: `A ${buck ? "buck" : "boost"} converter operates from ${Vin} V at a duty cycle of ${D}. ` +
            `What is its output voltage, most nearly?`,
      choices: [
        { text: `${fixed(Vout, 2)} V`, why: "" },
        { text: `${fixed(buck ? Vin / (1 - D) : Vin * D, 2)} V`,
          why: buck
            ? "That is the <b>boost</b> relation. A buck converter steps <em>down</em>, so its output can never exceed the input."
            : "That is the <b>buck</b> relation. A boost converter steps <em>up</em>, so its output must exceed the input." },
        { text: `${fixed(buck ? Vin * (1 - D) : Vin / D, 2)} V`, why: `The duty cycle was complemented. ${buck ? "For a buck, output is D times input directly." : "For a boost, the denominator is (1 − D)."}` },
        { text: `${Vin}.00 V`, why: "Unchanged. A converter that did not change the voltage would have no purpose." },
      ],
      answer: 0,
      steps: [
        buck
          ? `A buck converter connects the input to the inductor for a fraction D of each cycle, so the average voltage delivered is:`
          : `A boost converter stores energy in the inductor for a fraction D of each cycle and releases it in series with the source, giving:`,
        `<span class="math display" data-tex="V_{out} = ${buck ? "D\\,V_{in}" : "\\frac{V_{in}}{1-D}"} = ${buck ? `(${D})(${Vin})` : `\\frac{${Vin}}{${fixed(1 - D, 2)}}`} = ${fixed(Vout, 2)}\\text{ V}"></span>`,
        `<b>${fixed(Vout, 2)} V.</b> Sanity check before anything else: <b>a buck output is always below its input and a boost output always above.</b> An answer on the wrong side of ${Vin} V is wrong no matter what the arithmetic said.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "rectifiers",
    stem: "A bridge rectifier on 24 V rms. What DC voltage does an unfiltered load see?",
    tool: "V_avg = 2V_m/π, with V_m = √2 × V_rms",
    because: "The full-wave average came out of the RMS integral in Circuit Analysis Part 5.",
  },
  {
    part: "rectifiers",
    stem: "A centre-tapped rectifier on 120 V rms. What must the diodes withstand?",
    tool: "PIV = 2V_m for a centre-tap",
    because: "The off diode sees the whole secondary, both halves — twice what a bridge diode endures.",
  },
  {
    part: "rectifiers",
    stem: "A full-wave supply delivers 250 mA through 2200 µF on a 60 Hz line. Ripple?",
    tool: "V_r = I_L / (f_r C), with f_r = 120 Hz",
    because: "Ripple is a discharge between peaks, and a full-wave rectifier recharges twice per cycle.",
  },
  {
    part: "rectifiers",
    stem: "A buck converter runs at 40% duty from 24 V. Output?",
    tool: "V_out = D V_in",
    because: "Buck steps down, boost steps up — check which side of the input your answer lands on.",
  },
]);
