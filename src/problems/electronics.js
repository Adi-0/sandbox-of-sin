/* ==========================================================================
   problems/electronics.js — generators for Electronics.

   Part 1 (9.A): diode models, the diode equation, state solving, Zeners.
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed, sci, unfmt } from "../lib/fmt.js";

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
      ].filter((c, i, all) => i === 0 || Math.abs(unfmt(c.text) - unfmt(all[0].text)) > 0.005),
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
      ].filter((c, i, all) => i === 0 || Math.abs(unfmt(c.text) - unfmt(all[0].text)) > 0.05),
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
      ].filter((c, i, all) => i === 0 || Math.abs(unfmt(c.text) - unfmt(all[0].text)) > 0.05),
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
        ].filter((c, i, all) => i === 0 || (c.why !== "" && Math.abs(unfmt(c.text.replace(/,/g, "")) - unfmt(all[0].text.replace(/,/g, ""))) > 1)),
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
      ].filter((c, i, all) => i === 0 || (c.why !== "" && Math.abs(unfmt(c.text) - unfmt(all[0].text)) > 1e-4)),
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

/* ==========================================================================
   Part 3 — transistors
   ========================================================================== */

defineProblem("bjt-currents", {
  topic: "BJT terminal currents",
  lookup: "Electrical → Electronics → BJT (current gain)",
  make(rng) {
    const beta = rng.pick([50, 80, 100, 150, 200]);
    const ib = rng.pick([20, 34, 50, 134, 200]) * 1e-6;
    const ic = beta * ib;
    const ie = (beta + 1) * ib;
    const ask = rng.pick(["ie", "ic", "alpha"]);

    if (ask === "alpha") {
      const alpha = beta / (beta + 1);
      return {
        stem: `An npn BJT has a common-emitter current gain of ${beta}. What is its common-base current gain α?`,
        choices: [
          { text: `${fixed(alpha, 4)}`, why: "" },
          { text: `${fixed(beta / (beta - 1), 4)}`, why: "The denominator should be <b>β + 1</b>, not β − 1. α is always slightly <em>less</em> than 1, never more." },
          { text: `${fixed(1 / beta, 4)}`, why: "That is 1/β, the ratio of base to collector current." },
          { text: `${beta}`, why: "That is β itself. α and β are different gains: α relates collector to <b>emitter</b>, β relates collector to <b>base</b>." },
        ],
        answer: 0,
        steps: [
          `α is the fraction of emitter current that reaches the collector:`,
          `<span class="math display" data-tex="\\alpha = \\frac{I_C}{I_E} = \\frac{\\beta I_B}{(\\beta+1)I_B} = \\frac{\\beta}{\\beta+1}"></span>`,
          `<span class="math display" data-tex="\\alpha = \\frac{${beta}}{${beta + 1}} = ${fixed(alpha, 4)}"></span>`,
          `<b>${fixed(alpha, 4)}.</b> Sanity check that never fails: <b>α is always just under 1</b>, because a little of the emitter current leaves through the base instead.`,
        ],
      };
    }

    const target = ask === "ie" ? ie : ic;
    return {
      stem: `An npn BJT has a common-emitter current gain of ${beta} and a base current of ${fixed(ib * 1e6, 0)} µA. ` +
            `What is its ${ask === "ie" ? "emitter" : "collector"} current, most nearly?`,
      choices: [
        { text: `${fixed(target * 1000, 2)} mA`, why: "" },
        { text: `${fixed((ask === "ie" ? ic : ie) * 1000, 2)} mA`,
          why: ask === "ie"
            ? "That is the <b>collector</b> current, βI<sub>B</sub>. The emitter carries the base current as well, so it is (β + 1)I<sub>B</sub>."
            : "That is the <b>emitter</b> current, (β + 1)I<sub>B</sub>. The collector gets βI<sub>B</sub>; the extra one is the base's own contribution." },
        { text: `${fixed(ib * 1000, 4)} mA`, why: "That is the base current, unamplified." },
        { text: `${fixed(target * 1000 / beta, 4)} mA`, why: "Divided by β where you should multiply." },
      ],
      answer: 0,
      steps: [
        `A transistor is still a node, so KCL holds: ${T("I_E = I_B + I_C")}.`,
        `<span class="math display" data-tex="I_C = \\beta I_B = (${beta})(${fixed(ib * 1e6, 0)}\\ \\mu\\text{A}) = ${fixed(ic * 1000, 2)}\\text{ mA}"></span>`,
        ask === "ie"
          ? `<span class="math display" data-tex="I_E = I_B + I_C = (\\beta+1)I_B = (${beta + 1})(${fixed(ib * 1e6, 0)}\\ \\mu\\text{A}) = ${fixed(ie * 1000, 2)}\\text{ mA}"></span><b>${fixed(ie * 1000, 2)} mA.</b>`
          : `<b>${fixed(ic * 1000, 2)} mA.</b> Note these relations hold in the <b>active region only</b> — a saturated transistor has its own collector current set by the external circuit.`,
      ],
    };
  },
});

defineProblem("bjt-region", {
  topic: "Which region is the BJT in?",
  lookup: "Electrical → Electronics → BJT (biasing, regions)",
  make(rng) {
    const Vcc = rng.pick([10, 12, 15]);
    const Rc = rng.pick([1, 2, 2.2]) * 1000;
    const Rb = rng.pick([22, 33, 47, 100]) * 1000;
    const beta = rng.pick([100, 150, 200]);
    const Vin = rng.pick([2, 3, 5, 8]);
    const Vbe = 0.7, Vsat = 0.2;

    const ib = Math.max(0, (Vin - Vbe) / Rb);
    const icActive = beta * ib;
    const icSat = (Vcc - Vsat) / Rc;
    const sat = icActive > icSat;
    const ic = sat ? icSat : icActive;
    const vce = sat ? Vsat : Vcc - ic * Rc;

    return {
      stem: `A ${Vin} V input drives an npn BJT through a ${num(Rb / 1000, 0)} kΩ base resistor. ` +
            `The collector has a ${num(Rc / 1000, Rc % 1000 ? 1 : 0)} kΩ resistor to a ${Vcc} V rail, the emitter is grounded, ` +
            `β = ${beta} and V_BE = 0.7 V. What is V_CE, most nearly?`,
      choices: [
        { text: `${fixed(vce, 2)} V`, why: "" },
        { text: `${fixed(Vcc - icActive * Rc, 2)} V`,
          why: sat
            ? `That is what βI<sub>B</sub> predicts, and it is <b>impossible</b> — a negative V<sub>CE</sub> means the assumption of active operation has failed. The transistor is saturated at about ${Vsat} V.`
            : "" },
        { text: `${Vcc}.00 V`, why: `That is the cutoff value. The base current here is ${fixed(ib * 1e6, 1)} µA, which is not zero, so the transistor is conducting.` },
        { text: `${fixed(Vcc - icActive * Rc / beta, 2)} V`, why: "β was left out of the collector current." },
        { text: "0.00 V", why: `Even a fully saturated transistor holds about ${Vsat} V — its two junctions cannot both collapse to nothing.` },
      ].filter((c, i, all) => i === 0 || (c.why !== "" && Math.abs(unfmt(c.text) - unfmt(all[0].text)) > 0.02)).slice(0, 4),
      answer: 0,
      steps: [
        `<b>Assume the active region.</b> The base-emitter junction is a diode at 0.7 V, so:`,
        `<span class="math display" data-tex="I_B = \\frac{${Vin} - 0.7}{${num(Rb, 0)}} = ${fixed(ib * 1e6, 1)}\\ \\mu\\text{A}"></span>`,
        `<span class="math display" data-tex="I_C = \\beta I_B = (${beta})(${fixed(ib * 1e6, 1)}\\ \\mu\\text{A}) = ${fixed(icActive * 1000, 2)}\\text{ mA}"></span>`,
        `<span class="math display" data-tex="V_{CE} = V_{CC} - I_CR_C = ${Vcc} - (${fixed(icActive, 5)})(${num(Rc, 0)}) = ${fixed(Vcc - icActive * Rc, 2)}\\text{ V}"></span>`,
        sat
          ? `<b>Check: that is below ${Vsat} V, which is impossible.</b> The assumption fails, so the transistor is <b>saturated</b>: V<sub>CE</sub> sits at about ${Vsat} V and the collector current is fixed by the resistor at ${T(`(${Vcc}-${Vsat})/${num(Rc, 0)} = ${fixed(icSat * 1000, 2)}`)} mA, not by β. <b>${fixed(vce, 2)} V.</b>`
          : `<b>Check: ${fixed(vce, 2)} V is comfortably above ${Vsat} V</b>, so the transistor really is active and the assumption stands. <b>${fixed(vce, 2)} V.</b>`,
      ],
    };
  },
});

defineProblem("fet-square", {
  topic: "The FET square law",
  lookup: "Electrical → Electronics → FET (saturation region)",
  make(rng) {
    const jfet = rng.pick([true, false]);

    if (jfet) {
      const Idss = rng.pick([8, 10, 12, 34.5]);
      const Vp = rng.pick([-2.5, -3, -4, -6]);
      const Vgs = rng.pick([-0.5, -1, -1.5, -2]);
      const Id = Vgs <= Vp ? 0 : Idss * (1 - Vgs / Vp) ** 2;

      return {
        stem: `An n-channel JFET in saturation has ${T(`I_{DSS} = ${Idss}`)} mA and a pinch-off voltage of ${Vp} V. ` +
              `What drain current flows at ${T(`V_{GS} = ${Vgs}`)} V, most nearly?`,
        choices: [
          { text: `${fixed(Id, 2)} mA`, why: "" },
          { text: `${fixed(Idss * (1 - Vgs / Vp), 2)} mA`, why: "The bracket was not <b>squared</b>. The JFET relation is a square law — that exponent is the whole character of the device." },
          { text: `${fixed(Idss * (1 + Vgs / Vp) ** 2, 2)} mA`, why: `A sign slip inside the bracket. With ${T("V_P")} negative and ${T("V_{GS}")} negative, ${T("V_{GS}/V_P")} is <b>positive</b> and gets subtracted from 1.` },
          { text: `${Idss} mA`, why: `That is ${T("I_{DSS}")}, the current at ${T("V_{GS} = 0")}. Any negative gate voltage reduces it.` },
        ],
        answer: 0,
        steps: [
          `<span class="math display" data-tex="I_D = I_{DSS}\\left(1 - \\frac{V_{GS}}{V_P}\\right)^2"></span>`,
          `Both voltages are negative, so their ratio is positive:`,
          `<span class="math display" data-tex="\\frac{V_{GS}}{V_P} = \\frac{${Vgs}}{${Vp}} = ${fixed(Vgs / Vp, 4)}"></span>`,
          `<span class="math display" data-tex="I_D = ${Idss}\\left(1 - ${fixed(Vgs / Vp, 4)}\\right)^2 = ${Idss}(${fixed(1 - Vgs / Vp, 4)})^2 = ${fixed(Id, 2)}\\text{ mA}"></span>`,
          `<b>${fixed(Id, 2)} mA</b>, which is less than I<sub>DSS</sub> — as it must be, since a negative gate can only pinch the channel down.`,
        ],
      };
    }

    const k = rng.pick([0.5, 1, 2, 4]);
    const Vt = rng.pick([0.7, 1, 2, 4]);
    const Id = rng.pick([7.2, 11, 23.5, 35]);
    const over = Math.sqrt(Id / k);
    const Vgs = over + Vt;

    return {
      stem: `An n-channel enhancement MOSFET in saturation has a conductivity factor of ${k} mA/V² and a threshold voltage of ${Vt} V. ` +
            `What gate-to-source voltage produces a drain current of ${Id} mA, most nearly?`,
      choices: [
        { text: `${fixed(Vgs, 2)} V`, why: "" },
        { text: `${fixed(over, 2)} V`, why: `That is the <b>overdrive</b> ${T("V_{GS}-V_t")}. The threshold has to be added back to reach the actual gate voltage — and this wrong answer is always offered.` },
        { text: `${fixed(Id / k + Vt, 2)} V`, why: "No square root was taken. The relation is quadratic, so inverting it needs a root." },
        { text: `${fixed(Math.sqrt(Id * k) + Vt, 2)} V`, why: `Multiplied by k instead of divided. From ${T("I_D = k(V_{GS}-V_t)^2")}, the overdrive is ${T("\\sqrt{I_D/k}")}.` },
      ],
      answer: 0,
      steps: [
        `<span class="math display" data-tex="I_D = k\\left(V_{GS} - V_t\\right)^2 \\quad\\Longrightarrow\\quad V_{GS} - V_t = \\sqrt{\\frac{I_D}{k}}"></span>`,
        `<span class="math display" data-tex="V_{GS} - ${Vt} = \\sqrt{\\frac{${Id}}{${k}}} = \\sqrt{${fixed(Id / k, 3)}} = ${fixed(over, 2)}\\text{ V}"></span>`,
        `<b>Add the threshold back:</b>`,
        `<span class="math display" data-tex="V_{GS} = ${fixed(over, 2)} + ${Vt} = ${fixed(Vgs, 2)}\\text{ V}"></span>`,
        `<b>${fixed(Vgs, 2)} V.</b> Forgetting the final addition is the single most common error on this question type.`,
      ],
    };
  },
});

defineProblem("fet-gm", {
  topic: "Transconductance",
  lookup: "Electrical → Electronics → FET (transconductance)",
  make(rng) {
    const jfet = rng.pick([true, false]);

    if (jfet) {
      const Idss = rng.pick([10, 34.5, 500]);
      const Vp = rng.pick([-2.5, -4, -6]);
      const Id = rng.pick([2.4, 6.4, 8]);
      const gm = (2 * Math.sqrt(Idss * Id)) / Math.abs(Vp);

      return {
        stem: `An n-channel JFET in saturation has ${T(`I_{DSS} = ${Idss}`)} mA, a pinch-off voltage of ${Vp} V, ` +
              `and a drain current of ${Id} mA. What is its transconductance, most nearly?`,
        choices: [
          { text: `${fixed(gm, 2)} mS`, why: "" },
          { text: `${fixed(gm / 2, 2)} mS`, why: "The factor of 2 was dropped. It comes from differentiating a <b>square</b> law — the exponent falls out in front." },
          { text: `${fixed(2 * Idss / Math.abs(Vp), 2)} mS`, why: `That is ${T("g_{m0}")}, the transconductance at ${T("V_{GS}=0")} where ${T("I_D = I_{DSS}")}. At a lower drain current the slope is smaller.` },
          { text: `${fixed(Id / Math.abs(Vp), 2)} mS`, why: "Neither the square root nor the factor of 2 is present." },
        ],
        answer: 0,
        steps: [
          `Transconductance is the <b>slope</b> of the transfer curve, so differentiate the square law:`,
          `<span class="math display" data-tex="g_m = \\frac{\\partial I_D}{\\partial V_{GS}} = \\frac{2\\sqrt{I_{DSS}I_D}}{|V_P|}"></span>`,
          `<span class="math display" data-tex="g_m = \\frac{2\\sqrt{(${Idss})(${Id})}}{${Math.abs(Vp)}} = \\frac{2(${fixed(Math.sqrt(Idss * Id), 3)})}{${Math.abs(Vp)}} = ${fixed(gm, 2)}\\text{ mS}"></span>`,
          `<b>${fixed(gm, 2)} mS.</b> Note that it depends on the operating current — <b>a FET biased harder amplifies more</b>, which is why the bias point matters as much as the device.`,
        ],
      };
    }

    const k = rng.pick([0.5, 1, 2, 4]);
    const Vt = rng.pick([0.7, 1, 2]);
    const Vgs = rng.pick([3, 4, 5]);
    const over = Vgs - Vt;
    const Id = k * over ** 2;
    const gm = 2 * k * over;

    return {
      stem: `An n-channel enhancement MOSFET has k = ${k} mA/V² and ${T(`V_t = ${Vt}`)} V, operating in saturation at ${T(`V_{GS} = ${Vgs}`)} V. ` +
            `What is its transconductance, most nearly?`,
      choices: [
        { text: `${fixed(gm, 2)} mS`, why: "" },
        { text: `${fixed(k * over, 2)} mS`, why: "Missing the factor of 2 from differentiating the square." },
        { text: `${fixed(2 * k * Vgs, 2)} mS`, why: `The threshold was not subtracted. Transconductance depends on the <b>overdrive</b> ${T("V_{GS}-V_t")}, not on ${T("V_{GS}")} alone.` },
        { text: `${fixed(Id, 2)} mS`, why: "That is the drain current in mA, not a conductance." },
      ],
      answer: 0,
      steps: [
        `Differentiate the MOSFET square law with respect to gate voltage:`,
        `<span class="math display" data-tex="g_m = \\frac{d}{dV_{GS}}\\,k(V_{GS}-V_t)^2 = 2k(V_{GS}-V_t)"></span>`,
        `<span class="math display" data-tex="g_m = 2(${k})(${Vgs} - ${Vt}) = 2(${k})(${fixed(over, 2)}) = ${fixed(gm, 2)}\\text{ mS}"></span>`,
        `<b>${fixed(gm, 2)} mS.</b> Equivalently ${T(`2\\sqrt{kI_D} = 2\\sqrt{(${k})(${fixed(Id, 2)})} = ${fixed(2 * Math.sqrt(k * Id), 2)}`)} mS — the same number by a different route, which is a useful check.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "transistors",
    stem: "A BJT with β = 80 has 134 µA of base current. What is the emitter current?",
    tool: "I_E = (β + 1) I_B",
    because: "The emitter carries the collector current plus the base current — a transistor is still a KCL node.",
  },
  {
    part: "transistors",
    stem: "Your bias calculation gives V_CE = −3 V. What went wrong?",
    tool: "nothing — the transistor is saturated",
    because: "A negative V_CE is impossible, so the active-region assumption failed, not the arithmetic.",
  },
  {
    part: "transistors",
    stem: "A MOSFET with k = 4 mA/V² and V_t = 0.7 V must pass 23.5 mA. Gate voltage?",
    tool: "V_GS = √(I_D/k) + V_t",
    because: "The square law is written in overdrive, so the threshold has to be added back at the end.",
  },
  {
    part: "transistors",
    stem: "A JFET runs at 6.4 mA with I_DSS = 34.5 mA and V_P = −4 V. Transconductance?",
    tool: "g_m = 2√(I_DSS I_D) / |V_P|",
    because: "Transconductance is the derivative of the square law, so it rises with the operating current.",
  },
]);

/* ==========================================================================
   Part 4 — amplifiers
   ========================================================================== */

defineProblem("bias-divider", {
  topic: "Voltage-divider bias",
  lookup: "Electrical → Electronics → Amplifiers (biasing)",
  make(rng) {
    const Vcc = rng.pick([10, 12, 15, 20]);
    const R1 = rng.pick([40, 47, 68]) * 1000;
    const R2 = rng.pick([10, 12, 15]) * 1000;
    const Re = rng.pick([0.5, 1, 1.5, 2.2]) * 1000;
    const beta = rng.pick([100, 150, 200]);
    const Vth = (Vcc * R2) / (R1 + R2);
    const Rth = (R1 * R2) / (R1 + R2);
    const ib = (Vth - 0.7) / (Rth + (beta + 1) * Re);
    const ic = beta * ib;
    const icApprox = (Vth - 0.7) / Re;

    return {
      stem: `A BJT stage uses ${num(R1 / 1000, 0)} kΩ and ${num(R2 / 1000, 0)} kΩ as its base divider on a ${Vcc} V rail, ` +
            `with ${num(Re / 1000, Re % 1000 ? 1 : 0)} kΩ in the emitter and β = ${beta}. What is the collector current, most nearly?`,
      choices: [
        { text: `${fixed(ic * 1000, 3)} mA`, why: "" },
        { text: `${fixed(Vth / Re * 1000, 3)} mA`, why: "The 0.7 V base-emitter drop was not subtracted. The emitter sits <b>0.7 V below</b> the base, and only that difference appears across R<sub>E</sub>." },
        { text: `${fixed(Vcc / (R1 + R2) * beta * 1000, 3)} mA`, why: "That multiplies the divider's own bleed current by β. The divider current is not the base current — the whole point of the scheme is that the base draws very little of it." },
        { text: `${fixed(Vth * 1000 / Rth, 3)} mA`, why: "That is the Thévenin voltage across the Thévenin resistance, which is not any current in the circuit." },
      ],
      answer: 0,
      steps: [
        `Thévenin the base divider — Circuit Analysis Part 4, applied unchanged:`,
        `<span class="math display" data-tex="V_{TH} = ${Vcc}\\times\\frac{${R2 / 1000}}{${R1 / 1000}+${R2 / 1000}} = ${fixed(Vth, 3)}\\text{ V}, \\qquad R_{TH} = ${num(R1 / 1000, 0)}\\parallel${num(R2 / 1000, 0)} = ${fixed(Rth / 1000, 2)}\\text{ k}\\Omega"></span>`,
        `Walk the base loop, remembering that the emitter carries (β+1) times the base current:`,
        `<span class="math display" data-tex="I_B = \\frac{${fixed(Vth, 3)} - 0.7}{${fixed(Rth, 0)} + (${beta + 1})(${num(Re, 0)})} = ${fixed(ib * 1e6, 2)}\\ \\mu\\text{A}"></span>`,
        `<span class="math display" data-tex="I_C = \\beta I_B = ${fixed(ic * 1000, 3)}\\text{ mA}"></span>`,
        `<b>${fixed(ic * 1000, 3)} mA.</b> The quick design estimate ignores R<sub>TH</sub> entirely — ${T(`(V_{TH}-0.7)/R_E = ${fixed(icApprox * 1000, 3)}`)} mA — and is within ${fixed(Math.abs(icApprox - ic) / ic * 100, 1)}% here. <b>β has almost vanished from the answer</b>, which is the whole reason for the scheme.`,
      ],
    };
  },
});

defineProblem("q-point", {
  topic: "Finding the Q-point",
  lookup: "Electrical → Electronics → Amplifiers (Q-point)",
  make(rng) {
    const Vcc = rng.pick([12, 15, 20]);
    const ic = rng.pick([1, 1.5, 2, 2.5]) * 1e-3;
    const Rc = rng.pick([2, 2.2, 3.3, 4.7]) * 1000;
    const Re = rng.pick([0.5, 1, 1.5]) * 1000;
    const vce = Vcc - ic * (Rc + Re);

    return {
      stem: `A stage runs at ${fixed(ic * 1000, 1)} mA from a ${Vcc} V rail, with ${num(Rc / 1000, Rc % 1000 ? 1 : 0)} kΩ in the collector ` +
            `and ${num(Re / 1000, Re % 1000 ? 1 : 0)} kΩ in the emitter. What is V_CE, most nearly?`,
      choices: [
        { text: `${fixed(vce, 2)} V`, why: "" },
        { text: `${fixed(Vcc - ic * Rc, 2)} V`, why: "<b>R<sub>E</sub> was left out.</b> Both resistors carry the collector current and both drop voltage, so the collector loop has to include the emitter resistor too. This is the standard slip." },
        { text: `${fixed(Vcc - ic * Re, 2)} V`, why: "Only the emitter resistor was counted." },
        { text: `${fixed(ic * (Rc + Re), 2)} V`, why: "That is the total drop across the two resistors, not what is left across the transistor." },
      ],
      answer: 0,
      steps: [
        `Walk the collector loop from the rail to ground. Both resistors are in the DC path:`,
        `<span class="math display" data-tex="V_{CE} = V_{CC} - I_C(R_C + R_E)"></span>`,
        `<span class="math display" data-tex="V_{CE} = ${Vcc} - (${fixed(ic * 1000, 1)}\\text{ mA})(${num((Rc + Re) / 1000, 1)}\\text{ k}\\Omega) = ${fixed(vce, 2)}\\text{ V}"></span>`,
        `<b>${fixed(vce, 2)} V.</b> ${vce > 0.2 ? `Comfortably in the active region, and roughly ${fixed(vce / Vcc * 100, 0)}% of the rail — near the middle is what you want, since that is what leaves the most room for the signal to swing.` : "That is below saturation, so this bias point is not viable."}`,
      ],
    };
  },
});

defineProblem("ce-gain", {
  topic: "Common-emitter gain",
  lookup: "Electrical → Electronics → Amplifiers (small-signal gain)",
  make(rng) {
    const ie = rng.pick([0.5, 1, 1.3, 2, 2.6]) * 1e-3;
    const re = 0.026 / ie;
    const Rc = rng.pick([2, 2.2, 3.3, 4.7, 10]) * 1000;
    const bypassed = rng.pick([true, false, false]);
    const Rep = bypassed ? 0 : rng.pick([100, 220, 470]);
    const av = -Rc / (re + Rep);

    return {
      stem: `A common-emitter stage runs at ${fixed(ie * 1000, 1)} mA with ${num(Rc / 1000, Rc % 1000 ? 1 : 0)} kΩ in the collector` +
            `${bypassed ? " and its emitter resistor fully bypassed" : ` and ${Rep} Ω of emitter resistance left unbypassed`}. ` +
            `What is the voltage gain, most nearly?`,
      choices: [
        { text: `${fixed(av, 1)}`, why: "" },
        { text: `${fixed(-av, 1)}`, why: "<b>The sign.</b> A common-emitter stage <em>inverts</em> — rising input means falling output, because more collector current means a bigger drop across R<sub>C</sub>." },
        { text: `${bypassed ? fixed(-Rc / (re + 470), 1) : fixed(-Rc / re, 1)}`,
          why: bypassed
            ? "That includes an unbypassed emitter resistance. With the emitter fully bypassed, the only resistance in the denominator is r<sub>e</sub>."
            : "That ignores the unbypassed emitter resistance. <b>Only the bypassed part disappears</b>; whatever is left adds directly to r<sub>e</sub> in the denominator." },
        { text: `${fixed(-Rc / 1000, 1)}`, why: "The denominator is r<sub>e</sub> plus any unbypassed emitter resistance, not 1 kΩ." },
      ],
      answer: 0,
      steps: [
        `The small-signal emitter resistance comes from the bias current — it is the slope of the base-emitter diode:`,
        `<span class="math display" data-tex="r_e = \\frac{26\\text{ mV}}{I_E} = \\frac{26}{${fixed(ie * 1000, 1)}} = ${fixed(re, 1)}\\ \\Omega"></span>`,
        `<span class="math display" data-tex="A_v = -\\frac{R_C}{r_e + R_E'} = -\\frac{${num(Rc, 0)}}{${fixed(re, 1)}${Rep ? ` + ${Rep}` : ""}} = ${fixed(av, 1)}"></span>`,
        bypassed
          ? `<b>${fixed(av, 1)}.</b> Large, and not a number to design around — r<sub>e</sub> moves with temperature and bias, so this gain is not reproducible.`
          : `<b>${fixed(av, 1)}.</b> Note how close that is to ${T(`-R_C/R_E' = ${fixed(-Rc / Rep, 1)}`)}: with ${Rep} Ω unbypassed, r<sub>e</sub> is only ${fixed(re / (re + Rep) * 100, 0)}% of the denominator, so the gain is essentially two resistors and is stable.`,
      ],
    };
  },
});

defineProblem("amp-config", {
  topic: "Choosing a configuration",
  lookup: "Electrical → Electronics → Amplifiers (configurations)",
  make(rng) {
    const q = rng.pick(["buffer", "invert", "zin", "bypass"]);
    const Q = {
      buffer: {
        stem: "A sensor with a 100 kΩ source resistance must drive a 1 kΩ load without its signal collapsing. Which stage does the job?",
        right: "Common collector (emitter follower)",
        wrong: [
          ["Common emitter", "It has voltage gain, but its input impedance is far too low to avoid loading a 100 kΩ source, and its output impedance is too high to drive 1 kΩ."],
          ["Common base", "Its input impedance is the <b>lowest</b> of the three — it would short the sensor out entirely."],
          ["No transistor stage can do this", "This is exactly what a follower exists for: high input impedance, low output impedance, unity gain."],
        ],
        why: "The problem is impedance, not amplitude. An emitter follower presents (β+1)R<sub>E</sub> to the source so it barely loads it, and offers a low output impedance to the load — <b>it buys impedance, not voltage</b>.",
      },
      invert: {
        stem: "Which single-stage BJT amplifier inverts its input signal?",
        right: "Common emitter",
        wrong: [
          ["Common collector", "The emitter follower's output follows the input in both amplitude <em>and</em> sign — that is why it is called a follower."],
          ["Common base", "Non-inverting. Its gain is +R<sub>C</sub>/r<sub>e</sub>."],
          ["All three invert", "Only the common emitter does. The other two are non-inverting."],
        ],
        why: "More base drive means more collector current, which means a <b>bigger</b> drop across R<sub>C</sub>, which pulls the collector <b>down</b>. The inversion is built into where the output is taken from.",
      },
      zin: {
        stem: "Leaving part of the emitter resistor unbypassed in a common-emitter stage does what to the input impedance?",
        right: "Raises it, by the same factor the gain falls",
        wrong: [
          ["Lowers it", "The opposite. Z<sub>in</sub> at the base is (β+1)(r<sub>e</sub> + R<sub>E</sub>′), so adding unbypassed resistance <b>increases</b> it."],
          ["Leaves it unchanged", "Z<sub>in</sub> depends directly on the unbypassed emitter resistance."],
          ["Raises it, and raises the gain too", "Gain and input impedance move in <b>opposite</b> directions here — that is precisely the trade being made."],
        ],
        why: "Both gain and input impedance have (r<sub>e</sub> + R<sub>E</sub>′) in them — gain divided by it, impedance multiplied. Degeneration therefore trades one for the other at a fixed exchange rate, and raising Z<sub>in</sub> is often the real motive.",
      },
      bypass: {
        stem: "What is the emitter bypass capacitor in a common-emitter stage for?",
        right: "To remove R_E from the AC path while leaving it in the DC path",
        wrong: [
          ["To block DC from reaching the load", "That is what the <em>coupling</em> capacitors at the input and output do."],
          ["To filter noise from the supply rail", "That is a decoupling capacitor, which sits across the supply."],
          ["To set the amplifier's low-frequency response only", "It does affect that, but the reason it is there is the gain."],
        ],
        why: "The emitter resistor must be present at DC to stabilise the bias, and absent at AC to keep the gain high. <b>A capacitor across it is exactly that: an open circuit to DC and a short to the signal.</b> One component, two different circuits.",
      },
    }[q];

    return {
      stem: Q.stem,
      choices: [{ text: Q.right, why: "" }, ...Q.wrong.map(([t, w]) => ({ text: t, why: w }))],
      answer: 0,
      steps: [
        `<b>${Q.right}.</b>`,
        Q.why,
        `Worth holding the three side by side: <b>common emitter</b> amplifies and inverts, <b>common collector</b> buffers at unity gain, <b>common base</b> amplifies without inverting and has a very low input impedance.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "amplifiers",
    stem: "A stage runs at 2 mA with 3.3 kΩ in the collector, emitter fully bypassed. Gain?",
    tool: "r_e = 26 mV / I_E, then A_v = −R_C / r_e",
    because: "With the emitter bypassed the only resistance left in the denominator is the transistor's own r_e.",
  },
  {
    part: "amplifiers",
    stem: "A 47 k / 12 k divider on 15 V with 1 kΩ in the emitter. Collector current?",
    tool: "Thévenin the base, then I_C ≈ (V_TH − 0.7) / R_E",
    because: "Divider bias exists so the answer does not depend on β, and the approximation says so explicitly.",
  },
  {
    part: "amplifiers",
    stem: "A 100 kΩ source has to drive a 1 kΩ load. What stage goes between?",
    tool: "an emitter follower (common collector)",
    because: "The problem is impedance, not amplitude — and a follower is bought for impedance alone.",
  },
  {
    part: "amplifiers",
    stem: "Bias current is 1.5 mA, R_C is 4.7 kΩ, R_E is 1 kΩ, rail is 15 V. V_CE?",
    tool: "V_CE = V_CC − I_C(R_C + R_E)",
    because: "Both resistors are in the DC collector path; leaving R_E out is the standard error.",
  },
]);

/* ==========================================================================
   Part 5 — operational amplifiers
   ========================================================================== */

defineProblem("opamp-gain", {
  topic: "Inverting and non-inverting gain",
  lookup: "Electrical → Electronics → Operational amplifiers",
  make(rng) {
    const inv = rng.pick([true, false]);
    const Ri = rng.pick([1, 2, 4, 5, 10]) * 1000;
    const Rf = rng.pick([1, 2, 4, 8, 20, 40, 80]) * 1000;
    const Vin = rng.pick([0.1, 0.25, 0.5, 1, 2]);
    const A = inv ? -Rf / Ri : 1 + Rf / Ri;
    const Vo = A * Vin;

    return {
      stem: `An ideal op-amp is wired as a${inv ? "n inverting" : " non-inverting"} amplifier with ` +
            `${T(`R_i = ${num(Ri / 1000, 0)}`)} kΩ and ${T(`R_f = ${num(Rf / 1000, 0)}`)} kΩ. ` +
            `With ${Vin} V at the input, what is the output, most nearly?`,
      choices: [
        { text: `${fixed(Vo, 2)} V`, why: "" },
        { text: `${fixed((inv ? 1 + Rf / Ri : -Rf / Ri) * Vin, 2)} V`,
          why: inv
            ? "That is the <b>non-inverting</b> gain, 1 + R<sub>f</sub>/R<sub>i</sub>. Here the signal enters through R<sub>i</sub> to the − input, so the gain is −R<sub>f</sub>/R<sub>i</sub> with no added 1."
            : "That is the <b>inverting</b> gain. Here the signal goes straight to the + input, so it appears at the output <em>as well as</em> being amplified — hence the extra 1, and no sign inversion." },
        { text: `${fixed(-A * Vin, 2)} V`, why: `The sign. ${inv ? "An inverting amplifier inverts." : "A non-inverting amplifier does not."}` },
        { text: `${fixed((Ri / Rf) * Vin, 2)} V`, why: "The resistor ratio is upside down. Feedback resistor over input resistor — the feedback resistor is on top." },
      ].filter((c, i, all) => i === 0 || Math.abs(unfmt(c.text) - unfmt(all[0].text)) > 0.005),
      answer: 0,
      steps: [
        inv
          ? `<b>Rule 2</b> puts the − input at a virtual ground, so the input current is ${T(`V_{in}/R_i`)}. <b>Rule 1</b> says none of it enters the op-amp, so all of it flows on through ${T("R_f")}:`
          : `<b>Rule 2</b> makes the − input equal the + input, which is ${Vin} V. The two resistors divide the output down to that value:`,
        `<span class="math display" data-tex="A = ${inv ? `-\\frac{R_f}{R_i} = -\\frac{${num(Rf / 1000, 0)}}{${num(Ri / 1000, 0)}}` : `1 + \\frac{R_f}{R_i} = 1 + \\frac{${num(Rf / 1000, 0)}}{${num(Ri / 1000, 0)}}`} = ${fixed(A, 2)}"></span>`,
        `<span class="math display" data-tex="V_{out} = (${fixed(A, 2)})(${Vin}) = ${fixed(Vo, 2)}\\text{ V}"></span>`,
        `<b>${fixed(Vo, 2)} V.</b> Note that no property of the op-amp entered the answer — only two resistors.`,
      ],
    };
  },
});

defineProblem("opamp-sum", {
  topic: "Summing and difference amplifiers",
  lookup: "Electrical → Electronics → Operational amplifiers (summing)",
  make(rng) {
    const diff = rng.pick([true, false]);
    const Rf = rng.pick([10, 20, 40]) * 1000;
    const R = rng.pick([5, 10, 20]) * 1000;
    const V1 = rng.pick([0.5, 1, 2, 3]);
    const V2 = rng.pick([1, 2, 4, 5]);

    if (diff) {
      const Vo = (Rf / R) * (V2 - V1);
      return {
        stem: `An ideal op-amp difference amplifier has matched ${num(R / 1000, 0)} kΩ input resistors and ${num(Rf / 1000, 0)} kΩ feedback resistors. ` +
              `With ${V1} V on the inverting input and ${V2} V on the non-inverting input, what is the output?`,
        choices: [
          { text: `${fixed(Vo, 2)} V`, why: "" },
          { text: `${fixed((Rf / R) * (V1 - V2), 2)} V`, why: "The inputs are the wrong way round. The output is proportional to (V<sub>+</sub> − V<sub>−</sub>) — the non-inverting input minus the inverting one." },
          { text: `${fixed((Rf / R) * (V1 + V2), 2)} V`, why: "That sums the inputs. A <b>difference</b> amplifier subtracts — summing needs both inputs on the same terminal." },
          { text: `${fixed(V2 - V1, 2)} V`, why: "The gain was left out. The difference is multiplied by R<sub>f</sub>/R<sub>i</sub>." },
        ],
        answer: 0,
        steps: [
          `With both resistor pairs matched, the difference amplifier's output is:`,
          `<span class="math display" data-tex="V_{out} = \\frac{R_f}{R_i}(V_2 - V_1) = \\frac{${num(Rf / 1000, 0)}}{${num(R / 1000, 0)}}(${V2} - ${V1}) = ${fixed(Vo, 2)}\\text{ V}"></span>`,
          `<b>${fixed(Vo, 2)} V.</b> Anything present on <em>both</em> inputs cancels here — that common-mode rejection is why this circuit is used to read sensors at the end of a long cable.`,
        ],
      };
    }

    const Vo = -(Rf / R) * (V1 + V2);
    return {
      stem: `An ideal op-amp summing amplifier has two ${num(R / 1000, 0)} kΩ input resistors and a ${num(Rf / 1000, 0)} kΩ feedback resistor. ` +
            `With ${V1} V and ${V2} V at the two inputs, what is the output?`,
      choices: [
        { text: `${fixed(Vo, 2)} V`, why: "" },
        { text: `${fixed(-Vo, 2)} V`, why: "The sign. A summing amplifier is built on the <b>inverting</b> configuration, so its output is negative for positive inputs." },
        { text: `${fixed(-(Rf / R) * Math.max(V1, V2), 2)} V`, why: "Only one input was counted. Each contributes its own current into the virtual ground, and the currents add." },
        { text: `${fixed(-(Rf / (2 * R)) * (V1 + V2), 2)} V`, why: "The two input resistors were treated as being in parallel. They are not — the virtual ground <b>isolates</b> the inputs from each other, so each acts alone." },
      ],
      answer: 0,
      steps: [
        `The − node is a virtual ground, so each input drives its own resistor into zero volts and knows nothing of the other:`,
        `<span class="math display" data-tex="I_1 = \\frac{${V1}}{${num(R, 0)}}, \\qquad I_2 = \\frac{${V2}}{${num(R, 0)}}"></span>`,
        `Rule 1 sends the whole of both currents through ${T("R_f")}:`,
        `<span class="math display" data-tex="V_{out} = -R_f(I_1 + I_2) = -\\frac{${num(Rf / 1000, 0)}}{${num(R / 1000, 0)}}(${V1}+${V2}) = ${fixed(Vo, 2)}\\text{ V}"></span>`,
        `<b>${fixed(Vo, 2)} V.</b> Changing one input resistor changes only that input's weight, which is what makes this an analogue mixer and a DAC.`,
      ],
    };
  },
});

defineProblem("opamp-rail", {
  topic: "Saturation against the supply",
  lookup: "Electrical → Electronics → Operational amplifiers (nonideal)",
  make(rng) {
    const rail = rng.pick([12, 15, 18]);
    const Ri = rng.pick([1, 2]) * 1000;
    const Rf = rng.pick([50, 100, 220]) * 1000;
    const Vin = rng.pick([0.2, 0.5, 1]);
    const ideal = -(Rf / Ri) * Vin;
    const clipped = Math.abs(ideal) > rail - 1;
    const out = clipped ? -Math.sign(ideal) * -(rail - 1) : ideal;

    return {
      stem: `An op-amp running from ±${rail} V rails is wired as an inverting amplifier with ` +
            `${num(Ri / 1000, 0)} kΩ and ${num(Rf / 1000, 0)} kΩ. With ${Vin} V at the input, what is the output, most nearly?`,
      choices: [
        { text: clipped ? `−${rail - 1} V (saturated)` : `${fixed(ideal, 2)} V`, why: "" },
        { text: `${fixed(ideal, 1)} V`,
          why: clipped
            ? `That is what the gain formula gives, and <b>it is outside the supply rails</b>. No amplifier can put out more than it is fed — the output clips at roughly ${rail - 1} V.`
            : "" },
        { text: `+${rail - 1} V (saturated)`, why: `${clipped ? "Right magnitude, wrong sign — this is an <b>inverting</b> amplifier, so a positive input drives the output negative." : "The output is not saturated here, and an inverting stage would go negative anyway."}` },
        { text: `${fixed(Vin * (1 + Rf / Ri), 1)} V`, why: "That is the non-inverting gain applied to an inverting circuit." },
      ].filter((c, i, all) => i === 0 || c.why !== ""),
      answer: 0,
      steps: [
        `Compute the ideal output first:`,
        `<span class="math display" data-tex="V_{out} = -\\frac{R_f}{R_i}V_{in} = -\\frac{${num(Rf / 1000, 0)}}{${num(Ri / 1000, 0)}}(${Vin}) = ${fixed(ideal, 1)}\\text{ V}"></span>`,
        clipped
          ? `<b>Now check it against the rails.</b> The supply is ±${rail} V, and ${fixed(Math.abs(ideal), 1)} V is well beyond that. The output <b>saturates</b> at about ${rail - 1} V — real op-amps get within a volt or so of their supply, not all the way.<br><b>−${rail - 1} V.</b> The gain formula is not wrong; it simply stopped applying.`
          : `<b>Check it against the rails:</b> ${fixed(Math.abs(ideal), 2)} V is inside ±${rail} V, so the output is not clipped and the ideal answer stands. <b>${fixed(ideal, 2)} V.</b>`,
      ],
    };
  },
});

defineProblem("opamp-gbw", {
  topic: "Gain-bandwidth product",
  lookup: "Electrical → Electronics → Operational amplifiers (bandwidth)",
  make(rng) {
    const gbw = rng.pick([1e6, 3e6, 10e6]);
    const A = rng.pick([10, 20, 50, 100, 200]);
    const bw = gbw / A;
    const ask = rng.pick(["bw", "gain"]);

    if (ask === "gain") {
      const need = rng.pick([20e3, 50e3, 100e3]);
      const maxA = gbw / need;
      return {
        stem: `An op-amp has a gain-bandwidth product of ${fixed(gbw / 1e6, 0)} MHz. ` +
              `What is the greatest closed-loop gain it can provide across a bandwidth of ${fixed(need / 1000, 0)} kHz?`,
        choices: [
          { text: `${fixed(maxA, 0)}`, why: "" },
          { text: `${fixed(gbw * need / 1e9, 0)}`, why: "Multiplied instead of divided. Gain and bandwidth trade <b>against</b> each other, so more bandwidth means less available gain." },
          { text: `${fixed(need / gbw * 1000, 3)}`, why: "The ratio is upside down." },
          { text: "unlimited — feedback sets the gain", why: "Feedback can only spend gain the device actually has. Above the open-loop curve there is nothing left to spend." },
        ],
        answer: 0,
        steps: [
          `The product of closed-loop gain and bandwidth is fixed by the part:`,
          `<span class="math display" data-tex="A_{cl} = \\frac{\\text{GBW}}{\\text{BW}} = \\frac{${fixed(gbw / 1e6, 0)}\\times10^6}{${fixed(need / 1000, 0)}\\times10^3} = ${fixed(maxA, 0)}"></span>`,
          `<b>${fixed(maxA, 0)}.</b> Wanting more gain <em>and</em> that bandwidth means choosing a faster op-amp — no arrangement of resistors will do it.`,
        ],
      };
    }

    return {
      stem: `An op-amp with a gain-bandwidth product of ${fixed(gbw / 1e6, 0)} MHz is used at a closed-loop gain of ${A}. ` +
            `What is its bandwidth, most nearly?`,
      choices: [
        { text: `${bw >= 1000 ? `${fixed(bw / 1000, 0)} kHz` : `${fixed(bw, 0)} Hz`}`, why: "" },
        { text: `${fixed(gbw * A / 1e6, 0)} MHz`, why: "Multiplied by the gain rather than divided. Higher gain always means <b>less</b> bandwidth." },
        { text: `${fixed(gbw / 1e6, 0)} MHz`, why: "That is the gain-bandwidth product itself, which is the bandwidth only at unity gain." },
        { text: `${fixed(bw / 1000 / 2, 1)} kHz`, why: "A stray factor of two — no such factor appears in GBW = A × BW." },
      ],
      answer: 0,
      steps: [
        `Gain-bandwidth product is a constant for the device:`,
        `<span class="math display" data-tex="\\text{BW} = \\frac{\\text{GBW}}{A_{cl}} = \\frac{${fixed(gbw / 1e6, 0)}\\times10^6}{${A}} = ${num(bw, 0)}\\text{ Hz}"></span>`,
        `<b>${bw >= 1000 ? `${fixed(bw / 1000, 0)} kHz` : `${fixed(bw, 0)} Hz`}.</b> On a log-log plot the closed-loop shelf slides up and its corner slides left by the same factor — the two always meet on the open-loop line.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "opamps",
    stem: "An op-amp with 2 kΩ in and 20 kΩ feedback, signal on the − input. Gain?",
    tool: "A = −R_f / R_i",
    because: "The virtual ground makes the input current V_in/R_i, and all of it must continue through R_f.",
  },
  {
    part: "opamps",
    stem: "Gain of 100 on a 0.5 V input, op-amp running from ±15 V rails. Output?",
    tool: "compute the ideal output, then check the rails",
    because: "50 V is impossible from a 15 V supply — the output saturates near 14 V, and this is the most-missed op-amp question.",
  },
  {
    part: "opamps",
    stem: "Three signals must be combined with different weights into one output.",
    tool: "a summing amplifier: V_out = −R_f Σ(V_k/R_k)",
    because: "The virtual ground isolates the inputs, so each resistor sets its own weight independently.",
  },
  {
    part: "opamps",
    stem: "A 1 MHz op-amp is used at a gain of 50. How much bandwidth is left?",
    tool: "BW = GBW / A_cl",
    because: "Gain and bandwidth are one fixed budget; spending on one takes from the other.",
  },
]);

/* ==========================================================================
   Part 6 — instrumentation
   ========================================================================== */

defineProblem("meter-load", {
  topic: "Instrument loading",
  lookup: "Electrical → Electronics → Instrumentation (measurement)",
  make(rng) {
    const Vs = rng.pick([10, 12, 20]);
    const R = rng.pick([100, 220, 470, 1000]) * 1000;      // both divider arms
    const Rm = rng.pick([0.1, 1, 10]) * 1e6;
    const Rth = R / 2;
    const vTrue = Vs / 2;
    const par = (R * Rm) / (R + Rm);
    const vRead = (Vs * par) / (R + par);

    return {
      stem: `A ${Vs} V source feeds two equal ${num(R / 1000, 0)} kΩ resistors in series. ` +
            `A voltmeter with ${Rm >= 1e6 ? `${num(Rm / 1e6, 0)} MΩ` : `${num(Rm / 1000, 0)} kΩ`} input resistance is placed across the lower one. What does it read, most nearly?`,
      choices: [
        { text: `${fixed(vRead, 3)} V`, why: "" },
        { text: `${fixed(vTrue, 3)} V`, why: `That is the <b>true</b> midpoint voltage, which is what would be there with no meter attached. The meter is a ${Rm >= 1e6 ? `${num(Rm / 1e6, 0)} MΩ` : `${num(Rm / 1000, 0)} kΩ`} resistor in parallel with the lower arm, and it pulls the node down.` },
        { text: `${fixed(Vs * Rm / (Rm + R), 3)} V`, why: "That treats the meter as being in series with one arm. It goes in <b>parallel</b> with the element being measured." },
        { text: `${fixed(vRead * 2, 3)} V`, why: "Twice the correct reading — the divider was left out." },
      ].filter((c, i, all) => i === 0 || Math.abs(unfmt(c.text) - unfmt(all[0].text)) > 0.002),
      answer: 0,
      steps: [
        `The source seen from the measurement point has a Thévenin resistance of the two arms in parallel:`,
        `<span class="math display" data-tex="R_{TH} = ${num(R / 1000, 0)}\\parallel${num(R / 1000, 0)} = ${num(Rth / 1000, 0)}\\text{ k}\\Omega"></span>`,
        `The meter sits in parallel with the lower arm, so recompute the divider:`,
        `<span class="math display" data-tex="R_2\\parallel R_m = ${fixed(par / 1000, 2)}\\text{ k}\\Omega, \\qquad V = ${Vs}\\times\\frac{${fixed(par / 1000, 2)}}{${num(R / 1000, 0)} + ${fixed(par / 1000, 2)}} = ${fixed(vRead, 3)}\\text{ V}"></span>`,
        `<b>${fixed(vRead, 3)} V</b> — ${fixed(Math.abs((vRead - vTrue) / vTrue) * 100, 2)}% below the truth. The quick estimate ${T("R_{TH}/R_m")} gives ${fixed(Rth / Rm * 100, 2)}%, which agrees. <b>Loading error is a ratio</b>, so what matters is the meter against the source, not the meter alone.`,
      ],
    };
  },
});

defineProblem("bridge-out", {
  topic: "The Wheatstone bridge",
  lookup: "Electrical → Electronics → Instrumentation (bridges, transducers)",
  make(rng) {
    const form = rng.pick(["balance", "output"]);

    if (form === "balance") {
      const R1 = rng.pick([100, 220, 470, 1000]);
      const R2 = rng.pick([100, 330, 680]);
      const R3 = rng.pick([150, 300, 600]);
      const R4 = (R2 * R3) / R1;
      return {
        stem: `A Wheatstone bridge has ${R1} Ω and ${R2} Ω in one arm pair and ${R3} Ω in the other, ` +
              `with the fourth resistor adjustable. What value balances the bridge?`,
        choices: [
          { text: `${fixed(R4, 1)} Ω`, why: "" },
          { text: `${fixed((R1 * R3) / R2, 1)} Ω`, why: "The ratio is inverted. Balance means R<sub>1</sub>/R<sub>2</sub> = R<sub>3</sub>/R<sub>4</sub>, so R<sub>4</sub> = R<sub>2</sub>R<sub>3</sub>/R<sub>1</sub>." },
          { text: `${fixed(R1 + R2 - R3, 1)} Ω`, why: "Balance is a condition on <b>ratios</b>, not on sums." },
          { text: `${R3} Ω`, why: "That would balance the bridge only if the first pair were equal." },
        ].filter((c, i, all) => i === 0 || Math.abs(unfmt(c.text) - unfmt(all[0].text)) > 0.5),
        answer: 0,
        steps: [
          `A bridge is two dividers compared against each other, and it reads zero when their ratios match:`,
          `<span class="math display" data-tex="\\frac{R_1}{R_2} = \\frac{R_3}{R_4} \\quad\\Longrightarrow\\quad R_4 = \\frac{R_2R_3}{R_1}"></span>`,
          `<span class="math display" data-tex="R_4 = \\frac{(${R2})(${R3})}{${R1}} = ${fixed(R4, 1)}\\ \\Omega"></span>`,
          `<b>${fixed(R4, 1)} Ω.</b> Note the supply voltage never appeared — <b>balance is independent of it</b>, which is exactly why bridge measurements tolerate a drifting supply.`,
        ],
      };
    }

    const Vs = rng.pick([5, 10, 12]);
    const R = rng.pick([120, 350, 1000]);
    const strain = rng.pick([200, 500, 1000, 2000]) * 1e-6;
    const GF = 2;
    const dRoR = GF * strain;
    const Vout = (Vs / 4) * dRoR;

    return {
      stem: `A ${R} Ω strain gauge with a gauge factor of ${GF} sits in one arm of a Wheatstone bridge excited at ${Vs} V. ` +
            `At ${num(strain * 1e6, 0)} microstrain, what is the bridge output, most nearly?`,
      choices: [
        { text: `${fixed(Vout * 1000, 3)} mV`, why: "" },
        { text: `${fixed(Vout * 4000, 2)} mV`, why: "The factor of four was dropped. With only <b>one</b> active arm the fractional change is shared out across the bridge, giving V<sub>S</sub>/4 not V<sub>S</sub>." },
        { text: `${fixed((Vs / 4) * strain * 1000, 4)} mV`, why: "The gauge factor was not applied. Strain has to be converted to a <b>fractional resistance change</b> first: ΔR/R = GF × ε." },
        { text: `${fixed(Vs / 2 * 1000, 0)} mV`, why: "That is the bridge's half-supply offset, which is exactly what the bridge exists to <b>remove</b>." },
      ],
      answer: 0,
      steps: [
        `The gauge factor converts strain into a fractional resistance change:`,
        `<span class="math display" data-tex="\\frac{\\Delta R}{R} = GF\\times\\varepsilon = (${GF})(${num(strain * 1e6, 0)}\\times10^{-6}) = ${fixed(dRoR * 1e6, 0)}\\times10^{-6}"></span>`,
        `One active arm gives a quarter of the supply times that fraction:`,
        `<span class="math display" data-tex="V_{out} = \\frac{V_S}{4}\\cdot\\frac{\\Delta R}{R} = \\frac{${Vs}}{4}(${fixed(dRoR, 6)}) = ${fixed(Vout * 1000, 3)}\\text{ mV}"></span>`,
        `<b>${fixed(Vout * 1000, 3)} mV.</b> Tiny — and it arrives with <em>no</em> offset on it, which is the whole point. In a plain divider this signal would be riding on ${fixed(Vs / 2, 1)} V and no amplifier could reach it.`,
      ],
    };
  },
});

defineProblem("adc-res", {
  topic: "Converter resolution",
  lookup: "Electrical → Electronics → Data acquisition",
  make(rng) {
    const bits = rng.pick([8, 10, 12, 14, 16]);
    const fsr = rng.pick([1, 2.5, 5, 10]);
    const lsb = fsr / 2 ** bits;
    const ask = rng.pick(["lsb", "bits"]);

    if (ask === "bits") {
      const need = rng.pick([1000, 2000, 4000, 10000]);
      const n = Math.ceil(Math.log2(need));
      return {
        stem: `A measurement must be resolved into at least ${num(need, 0)} distinguishable steps. ` +
              `What is the smallest standard converter resolution that will do?`,
        choices: [
          { text: `${n} bits`, why: "" },
          { text: `${n - 1} bits`, why: `That gives only ${num(2 ** (n - 1), 0)} levels, which is fewer than the ${num(need, 0)} required.` },
          { text: `${need} bits`, why: "That confuses levels with bits. n bits gives 2ⁿ levels, so the relationship is logarithmic — 16 bits already gives 65 536." },
          { text: `${Math.round(need / 100)} bits`, why: "No such relationship exists between the two." },
        ],
        answer: 0,
        steps: [
          `Each bit doubles the number of levels, so solve ${T("2^n \\ge N")}:`,
          `<span class="math display" data-tex="n \\ge \\log_2(${num(need, 0)}) = ${fixed(Math.log2(need), 2)}"></span>`,
          `Round <b>up</b> — a fractional bit does not exist:`,
          `<span class="math display" data-tex="n = ${n} \\text{ bits}, \\quad 2^{${n}} = ${num(2 ** n, 0)}\\text{ levels}"></span>`,
          `<b>${n} bits.</b> In practice converters come in 8, 10, 12, 14, 16, so the next available size up is what actually gets specified.`,
        ],
      };
    }

    return {
      stem: `A ${bits}-bit analogue-to-digital converter has a full-scale range of ${fsr} V. ` +
            `What is the size of one least-significant bit, most nearly?`,
      choices: [
        { text: lsb >= 0.001 ? `${fixed(lsb * 1000, 3)} mV` : `${fixed(lsb * 1e6, 1)} µV`, why: "" },
        { text: `${fixed(fsr / (2 ** bits - 1) * 1000, 3)} mV`, why: "Dividing by 2ⁿ − 1 rather than 2ⁿ. Both conventions exist, but the difference is under 0.5% and the exam wants FSR/2ⁿ." },
        { text: `${fixed(fsr / bits * 1000, 1)} mV`, why: "Divided by the number of <b>bits</b> rather than the number of <b>levels</b>. Each bit doubles the levels — the relation is exponential." },
        { text: `${fixed(fsr / (2 * bits) * 1000, 1)} mV`, why: "Neither the exponent nor the base is right." },
      ],
      answer: 0,
      steps: [
        `The converter divides its full-scale range into 2ⁿ equal steps:`,
        `<span class="math display" data-tex="\\text{LSB} = \\frac{\\text{FSR}}{2^n} = \\frac{${fsr}}{2^{${bits}}} = \\frac{${fsr}}{${num(2 ** bits, 0)}}"></span>`,
        `<span class="math display" data-tex="= ${lsb >= 0.001 ? `${fixed(lsb * 1000, 3)}\\text{ mV}` : `${fixed(lsb * 1e6, 1)}\\ \\mu\\text{V}`}"></span>`,
        `<b>${lsb >= 0.001 ? `${fixed(lsb * 1000, 3)} mV` : `${fixed(lsb * 1e6, 1)} µV`}.</b> The quantisation error is half of this, ±½ LSB, and it is a floor rather than a fault — only more bits lowers it.`,
      ],
    };
  },
});

defineProblem("adc-snr", {
  topic: "Signal-to-noise and sampling",
  lookup: "Electrical → Electronics → Data acquisition (SNR, Nyquist)",
  make(rng) {
    const form = rng.pick(["snr", "nyquist"]);

    if (form === "nyquist") {
      const fmax = rng.pick([1, 4, 20, 50]) * 1000;
      const fs = 2 * fmax;
      return {
        stem: `A signal contains frequency components up to ${num(fmax / 1000, 0)} kHz. ` +
              `What is the minimum sampling rate that avoids aliasing?`,
        choices: [
          { text: `just above ${num(fs / 1000, 0)} kHz`, why: "" },
          { text: `${num(fmax / 1000, 0)} kHz`, why: "Sampling at the highest frequency present is <b>half</b> what is needed. Two samples per cycle is the minimum, and one is not enough to establish even a sine wave." },
          { text: `${num(fmax / 2000, 1)} kHz`, why: "Half the signal's own bandwidth — this would alias severely." },
          { text: `${num(fs * 5 / 1000, 0)} kHz`, why: "Comfortably safe and far more than the <b>minimum</b> being asked for. In practice engineers do oversample like this, but Nyquist's limit is 2f<sub>max</sub>." },
        ],
        answer: 0,
        steps: [
          `The Nyquist criterion requires strictly more than two samples per cycle of the highest component:`,
          `<span class="math display" data-tex="f_s > 2f_{max} = 2(${num(fmax, 0)}) = ${num(fs, 0)}\\text{ Hz}"></span>`,
          `<b>Just above ${num(fs / 1000, 0)} kHz.</b> Below it, components above ${T("f_s/2")} <b>fold down</b> and appear as false low-frequency signals indistinguishable from real ones — which is why an anti-aliasing filter goes <em>before</em> the converter, never after. Aliasing cannot be undone in software.`,
        ],
      };
    }

    const bits = rng.pick([8, 10, 12, 14, 16]);
    const snr = 6.02 * bits + 1.76;
    return {
      stem: `What is the best possible signal-to-noise ratio of an ideal ${bits}-bit converter, most nearly?`,
      choices: [
        { text: `${fixed(snr, 1)} dB`, why: "" },
        { text: `${fixed(6.02 * bits, 1)} dB`, why: "The 1.76 dB was dropped. It comes from the difference between a full-scale sine's RMS value and its peak." },
        { text: `${fixed(20 * Math.log10(2 ** bits), 1)} dB`, why: `That is 20 log(2ⁿ), which is the same as 6.02n — again missing the 1.76.` },
        { text: `${fixed(bits * 3, 1)} dB`, why: "About 3 dB per bit would be right if each bit gained a factor of √2. Each bit gains a factor of <b>2</b>, and 20 log 2 ≈ 6." },
      ].filter((c, i, all) => i === 0 || Math.abs(unfmt(c.text) - unfmt(all[0].text)) > 0.2),
      answer: 0,
      steps: [
        `Each extra bit halves the quantisation step, and halving an error improves the ratio by ${T("20\\log 2 = 6.02")} dB:`,
        `<span class="math display" data-tex="\\text{SNR} = 6.02n + 1.76\\text{ dB}"></span>`,
        `<span class="math display" data-tex="= 6.02(${bits}) + 1.76 = ${fixed(snr, 1)}\\text{ dB}"></span>`,
        `<b>${fixed(snr, 1)} dB.</b> This is a <em>ceiling</em>. Any noise in the amplifier ahead of the converter counts against it, so specifying more bits than the analogue front end can justify buys digits rather than information.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "instrumentation",
    stem: "A 10 MΩ meter reads a divider made of two 100 kΩ resistors. Error?",
    tool: "error ≈ R_TH / R_m",
    because: "Loading is a ratio against the source's Thévenin resistance, not a property of the meter alone.",
  },
  {
    part: "instrumentation",
    stem: "A strain gauge with GF = 2 at 1000 microstrain, bridge excited at 10 V.",
    tool: "V_out = (V_S/4)(GF × ε)",
    because: "One active arm shares the fractional change out across four, and the gauge factor converts strain to ΔR/R first.",
  },
  {
    part: "instrumentation",
    stem: "A 12-bit converter spans 0 to 10 V. What is one step worth?",
    tool: "LSB = FSR / 2ⁿ",
    because: "n bits gives 2ⁿ levels, so resolution improves exponentially with bits, not linearly.",
  },
  {
    part: "instrumentation",
    stem: "A sensor signal reaches 20 kHz. How fast must you sample?",
    tool: "f_s > 2 f_max",
    because: "Below Nyquist, high components fold down into the band and no later processing can remove them.",
  },
]);
