/* ==========================================================================
   problems/circuits-ac.js — generators for Circuit Analysis Parts 5 and 6.
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed } from "../lib/fmt.js";

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;

/* ==========================================================================
   Part 5 — waveform values
   ========================================================================== */

const WAVES = {
  sine: { name: "sinusoidal", rmsK: 1 / Math.SQRT2, avgK: 2 / Math.PI, rmsTex: "V_m/\\sqrt{2}" },
  square: { name: "square", rmsK: 1, avgK: 1, rmsTex: "V_m" },
  triangle: { name: "triangular", rmsK: 1 / Math.sqrt(3), avgK: 0.5, rmsTex: "V_m/\\sqrt{3}" },
  halfwave: { name: "half-wave rectified sinusoidal", rmsK: 0.5, avgK: 1 / Math.PI, rmsTex: "V_m/2" },
};

defineProblem("rms-value", {
  topic: "RMS values",
  lookup: "Electrical → Circuit analysis → Waveform analysis (RMS, average)",
  make(rng) {
    const key = rng.pick(["sine", "sine", "square", "triangle", "halfwave"]);
    const w = WAVES[key];
    const Vm = rng.pick([10, 12, 100, 120, 170, 200, 340]);
    const rms = Vm * w.rmsK;

    return {
      stem: `A ${w.name} voltage has a peak of ${Vm} V. What is its RMS value, most nearly?`,
      choices: [
        { text: `${fixed(rms, 1)} V`, why: "" },
        { text: `${fixed(Vm / Math.SQRT2, 1)} V`,
          why: key === "sine" ? "" : `That applies the sinusoid's <span class="math">1/\\sqrt{2}</span> to a ${w.name} waveform. <b>The √2 belongs to sinusoids and nothing else</b> — this shape's factor is ${w.rmsTex.replace("V_m", "Vm")}.` },
        { text: `${fixed(Vm * w.avgK, 1)} V`,
          why: "That is the rectified <em>average</em>, not the RMS. Squaring weights the peaks more heavily, so RMS is always the larger of the two." },
        { text: `${fixed(Vm, 0)} V`,
          why: key === "square" ? "" : "That is the peak itself. Only a square wave has RMS equal to its peak, because only it sits at full amplitude the whole time." },
      ].filter((c, i, all) => i === 0 || c.why !== ""),
      answer: 0,
      steps: [
        `RMS is defined for <em>any</em> periodic waveform as the root of the mean of the square:` +
          `<span class="math display" data-tex="V_{rms} = \\sqrt{\\frac{1}{T}\\int_0^T v^2\\,dt}"></span>`,
        `For a ${w.name} wave that evaluates to ${T(w.rmsTex)}.`,
        `<span class="math display" data-tex="V_{rms} = ${fixed(w.rmsK, 4)} \\times ${Vm} = ${fixed(rms, 1)}\\text{ V}"></span>` +
          `<b>${fixed(rms, 1)} V.</b> Physically: that is the DC voltage that would heat a resistor at the same rate.`,
      ],
    };
  },
});

defineProblem("waveform-read", {
  topic: "Reading a waveform",
  lookup: "Electrical → Circuit analysis → Waveform analysis (frequency, phase)",
  make(rng) {
    const f = rng.pick([50, 60, 400, 1000]);
    const w = 2 * Math.PI * f;
    const Vm = rng.pick([10, 100, 170, 340]);
    const ph = rng.pick([0, 30, 45, -60, 90]);
    const ask = rng.pick(["freq", "rms", "period"]);

    const stem =
      `A voltage is ${T(`v(t) = ${Vm}\\sin(${fixed(w, 0)}t ${ph >= 0 ? "+" : "-"} ${Math.abs(ph)}^\\circ)`)} volts. `;

    if (ask === "freq") {
      return {
        stem: stem + "What is its frequency?",
        choices: [
          { text: `${num(f)} Hz`, why: "" },
          { text: `${fixed(w, 0)} Hz`, why: `That is ${T("\\omega")} in <b>radians per second</b>, not hertz. Divide by ${T("2\\pi")}.` },
          { text: `${fixed(f * 2 * Math.PI, 0)} Hz`, why: `Multiplied by ${T("2\\pi")} instead of divided.` },
          { text: `${fixed(1 / f * 1000, 2)} Hz`, why: "That is the period in milliseconds, not the frequency." },
        ],
        answer: 0,
        steps: [
          `The coefficient of ${T("t")} inside the sine is ${T("\\omega")}, in rad/s — never hertz.`,
          `<span class="math display" data-tex="f = \\frac{\\omega}{2\\pi} = \\frac{${fixed(w, 0)}}{6.283} = ${num(f)}\\text{ Hz}"></span>`,
          `<b>${num(f)} Hz.</b> Worth memorising the common one: <b>60 Hz is 377 rad/s</b>, so a coefficient near 377 is mains frequency at a glance.`,
        ],
      };
    }

    if (ask === "period") {
      const Tms = 1000 / f;
      return {
        stem: stem + "What is its period?",
        choices: [
          { text: `${fixed(Tms, 3)} ms`, why: "" },
          { text: `${fixed(1000 / w, 4)} ms`, why: `That divides into ${T("\\omega")} rather than into ${T("f")}. Convert to hertz first.` },
          { text: `${fixed(f, 0)} ms`, why: "That is the frequency in hertz, not the period." },
          { text: `${fixed(Tms * 2, 3)} ms`, why: "That is two full cycles — perhaps a half-cycle was mistaken for the period." },
        ],
        answer: 0,
        steps: [
          `${T(`f = \\omega/2\\pi = ${fixed(w, 0)}/6.283 = ${num(f)}`)} Hz.`,
          `<span class="math display" data-tex="T = \\frac{1}{f} = \\frac{1}{${num(f)}} = ${fixed(Tms / 1000, 6)}\\text{ s}"></span>`,
          `= <b>${fixed(Tms, 3)} ms.</b>`,
        ],
      };
    }

    const rms = Vm / Math.SQRT2;
    return {
      stem: stem + "What is its RMS value?",
      choices: [
        { text: `${fixed(rms, 1)} V`, why: "" },
        { text: `${num(Vm)} V`, why: "That is the <b>peak</b>. When a waveform is written as an equation, the coefficient in front is always the peak." },
        { text: `${fixed(Vm * 2 / Math.PI, 1)} V`, why: "That is the rectified average, which is smaller than the RMS." },
        { text: `${fixed(Vm * Math.SQRT2, 1)} V`, why: `Multiplied by ${T("\\sqrt{2}")} instead of divided — that would take you from RMS <em>to</em> peak.` },
      ],
      answer: 0,
      steps: [
        `The ${Vm} in front of the sine is the <b>peak</b>, not the RMS.`,
        `<span class="math display" data-tex="V_{rms} = \\frac{${Vm}}{\\sqrt{2}} = ${fixed(rms, 1)}\\text{ V}"></span>`,
        `<b>${fixed(rms, 1)} V.</b> The ${Math.abs(ph)}° phase plays no part — for a single waveform it only sets where the clock starts.`,
      ],
    };
  },
});

defineProblem("avg-vs-rms", {
  topic: "Average against RMS",
  lookup: "Electrical → Circuit analysis → Waveform analysis",
  make(rng) {
    const Vm = rng.pick([100, 120, 170, 200]);
    const R = rng.pick([10, 20, 25, 50]);
    const rms = Vm / Math.SQRT2;
    const P = (rms * rms) / R;

    return {
      stem:
        `A sinusoid of ${Vm} V peak is applied to a ${R} Ω resistor. What average power ` +
        `does the resistor dissipate?`,
      choices: [
        { text: `${fixed(P, 1)} W`, why: "" },
        { text: `${fixed((Vm * Vm) / R, 1)} W`, why: "The peak was used where the RMS belongs. That doubles the answer, because RMS is peak over √2 and the power goes as the square." },
        { text: `${fixed(Math.pow(Vm * 2 / Math.PI, 2) / R, 1)} W`, why: "The rectified average was used. Power is about the mean of the <em>square</em>, which is what RMS captures and the average does not." },
        { text: `${fixed(P / 2, 1)} W`, why: "Halved once too often — the ½ is already inside the √2." },
      ],
      answer: 0,
      steps: [
        `Power calculations always use RMS. That is the entire reason RMS is defined.`,
        `<span class="math display" data-tex="V_{rms} = \\frac{${Vm}}{\\sqrt{2}} = ${fixed(rms, 2)}\\text{ V}"></span>`,
        `<span class="math display" data-tex="P = \\frac{V_{rms}^2}{R} = \\frac{${fixed(rms * rms, 0)}}{${R}} = ${fixed(P, 1)}\\text{ W}"></span>` +
          `<b>${fixed(P, 1)} W.</b> Equivalently ${T("P = V_m^2/2R")} — the ½ <em>is</em> the squared √2, which is why that shortcut works for sinusoids only.`,
      ],
    };
  },
});

/* ==========================================================================
   Part 6 — impedance and AC power
   ========================================================================== */

defineProblem("impedance-find", {
  topic: "Impedance",
  lookup: "Electrical → Circuit analysis → Impedance, phasors",
  make(rng) {
    const [R, X] = rng.pick([[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5], [20, 15]]);
    const ind = rng.chance(0.6);
    const Xs = ind ? X : -X;
    const Z = Math.hypot(R, X);
    const th = Math.atan2(Xs, R) * 180 / Math.PI;

    return {
      stem:
        `A ${R} Ω resistor is in series with ${ind ? "an inductive" : "a capacitive"} reactance ` +
        `of ${X} Ω. What is the impedance in polar form?`,
      choices: [
        { text: `${fixed(Z, 2)} ∠ ${fixed(th, 2)}° Ω`, why: "" },
        { text: `${fixed(Z, 2)} ∠ ${fixed(-th, 2)}° Ω`,
          why: `Sign of the angle. ${ind ? "Inductive reactance is <b>positive</b> imaginary, so the angle is positive and the current lags." : "Capacitive reactance is <b>negative</b> imaginary, so the angle is negative and the current leads."}` },
        { text: `${fixed(R + X, 0)} ∠ ${fixed(th, 2)}° Ω`,
          why: "Resistance and reactance do not add arithmetically — they are at right angles, so the magnitude is the hypotenuse." },
        { text: `${fixed(Z, 2)} ∠ ${fixed(Math.atan2(R, X) * 180 / Math.PI, 2)}° Ω`,
          why: `The ratio is inverted. The angle is ${T("\\arctan(X/R)")} — reactance over resistance." ` },
      ],
      answer: 0,
      steps: [
        `In rectangular form: ${T(`\\mathbf{Z} = ${R} ${Xs >= 0 ? "+" : "-"} j${X}`)} Ω. ` +
          `${ind ? "Inductive reactance is positive imaginary" : "Capacitive reactance is negative imaginary"}.`,
        `<span class="math display" data-tex="|\\mathbf{Z}| = \\sqrt{${R}^2 + ${X}^2} = \\sqrt{${R * R + X * X}} = ${fixed(Z, 2)}\\ \\Omega"></span>`,
        `<span class="math display" data-tex="\\theta = \\arctan\\frac{${Xs >= 0 ? "" : "-"}${X}}{${R}} = ${fixed(th, 2)}^\\circ"></span>` +
          `<b>${fixed(Z, 2)}∠${fixed(th, 2)}° Ω</b> — and the current will ${ind ? "<b>lag</b>" : "<b>lead</b>"} the voltage by that angle.`,
      ],
    };
  },
});

defineProblem("ac-current", {
  topic: "AC circuit current",
  lookup: "Electrical → Circuit analysis → Phasors, Ohm's law for AC",
  make(rng) {
    const [R, X] = rng.pick([[3, 4], [6, 8], [8, 6], [5, 12], [9, 12]]);
    const Vs = rng.pick([100, 120, 240]);
    const Z = Math.hypot(R, X);
    const th = Math.atan2(X, R) * 180 / Math.PI;
    const I = Vs / Z;

    return {
      stem:
        `A ${Vs} V (RMS) source at 0° drives a series combination of ${R} Ω and ` +
        `${X} Ω of inductive reactance. What is the current?`,
      choices: [
        { text: `${fixed(I, 2)} A ∠ ${fixed(-th, 2)}°`, why: "" },
        { text: `${fixed(I, 2)} A ∠ ${fixed(th, 2)}°`,
          why: "Dividing <b>subtracts</b> the angles, so the current angle is <em>minus</em> the impedance angle. Physically the current lags in an inductive circuit — ELI." },
        { text: `${fixed(Vs / (R + X), 2)} A ∠ ${fixed(-th, 2)}°`,
          why: "The magnitudes were added arithmetically. Impedance magnitude is the hypotenuse of R and X." },
        { text: `${fixed(Vs / R, 2)} A ∠ 0°`,
          why: "The reactance was ignored. It limits current just as resistance does, even though it consumes no power." },
      ],
      answer: 0,
      steps: [
        `<span class="math display" data-tex="\\mathbf{Z} = ${R} + j${X} = ${fixed(Z, 2)}\\angle ${fixed(th, 2)}^\\circ\\ \\Omega"></span>`,
        `Ohm's law works unchanged, in complex arithmetic — dividing divides the magnitudes and <b>subtracts</b> the angles:` +
          `<span class="math display" data-tex="\\mathbf{I} = \\frac{${Vs}\\angle 0^\\circ}{${fixed(Z, 2)}\\angle ${fixed(th, 2)}^\\circ} = ${fixed(I, 2)}\\angle ${fixed(-th, 2)}^\\circ\\text{ A}"></span>`,
        `<b>${fixed(I, 2)} A lagging by ${fixed(th, 2)}°.</b> Lagging is the sanity check: an inductive load must lag, by ELI the ICE man.`,
      ],
    };
  },
});

defineProblem("power-triangle", {
  topic: "AC power",
  lookup: "Electrical → Circuit analysis → Real, reactive and apparent power",
  make(rng) {
    const [R, X] = rng.pick([[3, 4], [6, 8], [8, 6], [4, 3], [5, 12]]);
    const Vs = rng.pick([100, 120, 240]);
    const Z = Math.hypot(R, X);
    const I = Vs / Z;
    const S = Vs * I, P = I * I * R, Q = I * I * X;
    const pf = R / Z;
    const ask = rng.pick(["P", "pf", "Q"]);

    const common = [
      `The current is ${T(`${Vs}/${fixed(Z, 2)} = ${fixed(I, 2)}`)} A, and the impedance angle is ` +
        `${T(`\\arctan(${X}/${R}) = ${fixed(Math.atan2(X, R) * 180 / Math.PI, 2)}^\\circ`)}.`,
    ];

    if (ask === "pf") {
      return {
        stem:
          `A load of ${R} Ω resistance and ${X} Ω inductive reactance is supplied at ${Vs} V. ` +
          `What is its power factor?`,
        choices: [
          { text: `${fixed(pf, 3)} lagging`, why: "" },
          { text: `${fixed(pf, 3)} leading`, why: "The magnitude is right but the direction is wrong. An <b>inductive</b> load makes the current lag, so the power factor is lagging. A bare number without a direction is only half an answer." },
          { text: `${fixed(X / Z, 3)} lagging`, why: `That is ${T("\\sin\\theta")}, which gives the reactive fraction. Power factor is ${T("\\cos\\theta = R/|Z|")}.` },
          { text: `${fixed(R / X, 3)} lagging`, why: "That is the tangent's reciprocal, not the cosine. The denominator must be the impedance magnitude." },
        ],
        answer: 0,
        steps: [
          ...common,
          `<span class="math display" data-tex="\\text{pf} = \\cos\\theta = \\frac{R}{|Z|} = \\frac{${R}}{${fixed(Z, 2)}} = ${fixed(pf, 3)}"></span>`,
          `<b>${fixed(pf, 3)} lagging.</b> Always state the direction: inductive is lagging, capacitive is leading, ` +
            `and the cosine alone cannot tell them apart.`,
        ],
      };
    }

    if (ask === "Q") {
      return {
        stem:
          `A load of ${R} Ω resistance and ${X} Ω inductive reactance is supplied at ${Vs} V. ` +
          `What is the reactive power?`,
        choices: [
          { text: `${fixed(Q, 0)} VAR`, why: "" },
          { text: `${fixed(P, 0)} VAR`, why: `That is the <b>real</b> power. Reactive power comes from the reactance: ${T("Q = I^2X")}.` },
          { text: `${fixed(S, 0)} VAR`, why: "That is the apparent power in VA — the hypotenuse, not the vertical leg." },
          { text: `${fixed(S - P, 0)} VAR`, why: `The three combine as a right triangle, not by subtraction: ${T("S^2 = P^2 + Q^2")}.` },
        ],
        answer: 0,
        steps: [
          ...common,
          `Reactive power comes only from the reactance:` +
            `<span class="math display" data-tex="Q = I^2 X = (${fixed(I, 2)})^2(${X}) = ${fixed(Q, 0)}\\text{ VAR}"></span>`,
          `<b>${fixed(Q, 0)} VAR.</b> Check the triangle: ${fixed(P, 0)}² + ${fixed(Q, 0)}² = ${fixed(Math.hypot(P, Q), 0)}², ` +
            `and ${T("S = VI")} = ${fixed(S, 0)} VA ✓`,
        ],
      };
    }

    return {
      stem:
        `A load of ${R} Ω resistance and ${X} Ω inductive reactance is supplied at ${Vs} V. ` +
        `What real power does it consume?`,
      choices: [
        { text: `${fixed(P, 0)} W`, why: "" },
        { text: `${fixed(S, 0)} W`, why: `That is the <b>apparent</b> power in VA. Only ${T("VI\\cos\\theta")} is actually consumed; the rest is borrowed and returned each cycle.` },
        { text: `${fixed(Q, 0)} W`, why: "That is the reactive power. Reactance stores and returns energy — it consumes none." },
        { text: `${fixed((Vs * Vs) / R, 0)} W`, why: "The full source voltage was put across the resistor. The reactance takes its share of the voltage too." },
      ],
      answer: 0,
      steps: [
        ...common,
        `Real power comes only from the resistance — that is the fastest route and it avoids the cosine entirely:` +
          `<span class="math display" data-tex="P = I^2R = (${fixed(I, 2)})^2(${R}) = ${fixed(P, 0)}\\text{ W}"></span>`,
        `Cross-check with the power-factor form: ${T(`P = VI\\cos\\theta = (${Vs})(${fixed(I, 2)})(${fixed(pf, 3)}) = ${fixed(S * pf, 0)}`)} W ✓ ` +
          `<b>${fixed(P, 0)} W.</b>`,
      ],
    };
  },
});

defineProblem("reactance-calc", {
  topic: "Reactance",
  lookup: "Electrical → Circuit analysis → Impedance of L and C",
  make(rng) {
    const isL = rng.chance(0.5);
    const f = rng.pick([50, 60, 400, 1000]);
    const w = 2 * Math.PI * f;
    const L = rng.pick([0.01, 0.02, 0.05, 0.1]);
    const C = rng.pick([1e-6, 5e-6, 10e-6, 50e-6]);
    const X = isL ? w * L : 1 / (w * C);

    return {
      stem: isL
        ? `What is the reactance of a ${num(L * 1000)} mH inductor at ${f} Hz?`
        : `What is the reactance of a ${num(C * 1e6)} µF capacitor at ${f} Hz?`,
      choices: [
        { text: `${fixed(X, 2)} Ω`, why: "" },
        { text: `${fixed(isL ? 1 / (w * L) : w * C, 5)} Ω`,
          why: isL
            ? `Inverted. Inductive reactance is ${T("\\omega L")} and <b>rises</b> with frequency.`
            : `Inverted. Capacitive reactance is ${T("1/\\omega C")} and <b>falls</b> with frequency.` },
        { text: `${fixed(isL ? f * L : 1 / (f * C), 2)} Ω`,
          why: `The ${T("2\\pi")} is missing. Reactance uses ${T("\\omega")} in rad/s, not ${T("f")} in hertz.` },
        { text: `${fixed(X * 2 * Math.PI, 2)} Ω`, why: `An extra factor of ${T("2\\pi")} has crept in.` },
      ],
      answer: 0,
      steps: [
        `<span class="math display" data-tex="\\omega = 2\\pi f = 2\\pi(${f}) = ${fixed(w, 1)}\\text{ rad/s}"></span>`,
        isL
          ? `<span class="math display" data-tex="X_L = \\omega L = (${fixed(w, 1)})(${num(L)}) = ${fixed(X, 2)}\\ \\Omega"></span>`
          : `<span class="math display" data-tex="X_C = \\frac{1}{\\omega C} = \\frac{1}{(${fixed(w, 1)})(${num(C * 1e6)}\\times10^{-6})} = ${fixed(X, 2)}\\ \\Omega"></span>`,
        `<b>${fixed(X, 2)} Ω.</b> Sanity check the direction: ` +
          (isL
            ? "double the frequency and an inductor's reactance doubles — at DC it is a short circuit."
            : "double the frequency and a capacitor's reactance halves — at DC it is an open circuit."),
      ],
    };
  },
});

defineReflex([
  {
    part: "waveforms",
    stem: "A 240 V supply is quoted for an appliance. What is the peak voltage the insulation sees?",
    tool: "Vm = √2 × Vrms",
    because: "A bare quoted AC voltage is RMS, and the peak is √2 times larger.",
  },
  {
    part: "waveforms",
    stem: "v(t) = 100 sin(628t). Find the frequency.",
    tool: "ω = 2πf",
    because: "The coefficient of t is ω in rad/s; divide by 2π to get hertz.",
  },
  {
    part: "waveforms",
    stem: "A square wave of 50 V peak drives a heater. Find the heating power.",
    tool: "RMS from the waveform's own shape",
    because: "A square wave's RMS equals its peak — the sinusoid's √2 does not apply.",
  },
  {
    part: "phasors",
    stem: "A 0.1 H inductor is used at 60 Hz. Find its opposition to current.",
    tool: "X_L = ωL",
    because: "Inductive reactance, with ω in radians per second.",
  },
  {
    part: "phasors",
    stem: "A motor draws 12 A at 240 V with a power factor of 0.8 lagging. Find the real power.",
    tool: "P = VI cos θ",
    because: "Only the in-phase component of the current does work.",
  },
  {
    part: "phasors",
    stem: "A load is 5 Ω resistive and 5 Ω capacitive. State the power factor completely.",
    tool: "cos θ, with lagging or leading",
    because: "Capacitive means the current leads, and the direction is part of the answer.",
  },
]);
