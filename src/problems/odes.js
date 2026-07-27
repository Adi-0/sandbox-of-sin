/* ==========================================================================
   problems/odes.js — generators for Part 7.
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed } from "../lib/fmt.js";

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;
const S = (v) => num(v).replace("−", "-");

/* ==========================================================================
   First-order separable / growth-decay
   ========================================================================== */

defineProblem("first-order-solve", {
  topic: "First-order equations",
  lookup: "Mathematics → Differential equations → First-order linear, separable",
  make(rng) {
    const k = rng.nz(-6, 6);
    const sign = k < 0 ? "+" : "-";
    const mag = Math.abs(k);

    return {
      stem: `What is the general solution to ${T(`y' ${sign} ${mag}y = 0`)}?`,
      choices: [
        { tex: `y = Ce^{${S(k)}x}`, why: "" },
        { tex: `y = Ce^{${S(-k)}x}`, why: `Sign flipped. Rearranged, the equation reads ${T(`y' = ${S(k)}y`)}, so the exponent carries that sign.` },
        { tex: `y = ${S(k)}x + C`, why: "That solves y′ = constant. Here the rate depends on y itself, which forces an exponential." },
        { tex: `y = C\\sin ${S(Math.abs(k))}x`, why: "Sinusoids solve second-order equations with complex roots. A first-order equation of this shape cannot oscillate." },
      ],
      answer: 0,
      steps: [
        `Rearrange to isolate the derivative:` +
          `<span class="math display" data-tex="\\frac{dy}{dx} = ${S(k)}y"></span>` +
          `The rate of change is proportional to the quantity itself — that is the signature of exponential behaviour.`,
        `Separate and integrate:` +
          `<span class="math display" data-tex="\\int\\frac{dy}{y} = \\int ${S(k)}\\,dx \\;\\Rightarrow\\; \\ln|y| = ${S(k)}x + C_1"></span>`,
        `Exponentiate both sides:` +
          `<span class="math display" data-tex="y = Ce^{${S(k)}x}"></span>` +
          `<b>Every RC and RL transient on this exam is this equation.</b> ` +
          (k < 0 ? "The negative exponent means it decays." : "The positive exponent means it grows without bound."),
      ],
    };
  },
});

/* ==========================================================================
   Characteristic roots
   ========================================================================== */

defineProblem("characteristic-roots", {
  topic: "Characteristic equation",
  lookup: "Mathematics → Differential equations → Second-order linear homogeneous",
  make(rng) {
    const kind = rng.pick(["complex", "complex", "real", "repeated"]);
    let b, c, desc;
    if (kind === "complex") {
      const al = rng.int(1, 5), be = rng.int(1, 6);
      b = 2 * al; c = al * al + be * be;
      desc = { re: -al, im: be };
    } else if (kind === "repeated") {
      const r = rng.int(1, 6);
      b = 2 * r; c = r * r;
      desc = { re: -r, im: 0 };
    } else {
      const r1 = rng.int(1, 5), r2 = r1 + rng.int(1, 4);
      b = r1 + r2; c = r1 * r2;
      desc = { r1: -r1, r2: -r2 };
    }
    const disc = b * b - 4 * c;

    const right =
      kind === "complex" ? `${S(desc.re)} \\pm ${desc.im}j`
      : kind === "repeated" ? `${S(desc.re)} \\text{ (repeated)}`
      : `${S(desc.r1)}, ${S(desc.r2)}`;

    return {
      stem: `Find the roots of the characteristic equation for ${T(`y'' + ${b}y' + ${c}y = 0`)}.`,
      choices: [
        { tex: right, why: "" },
        { tex: kind === "complex" ? `${S(-desc.re)} \\pm ${desc.im}j` : `${S(-(desc.re ?? desc.r1))}, ${S(-(desc.re ?? desc.r2))}`,
          why: `Signs flipped. The quadratic formula puts <b>−b</b> on top, and here b is positive, so the real parts must be negative — which is also what makes the solution decay rather than blow up.` },
        { tex: `${S(-b)}, ${S(-c)}`, why: "Those are the coefficients, not the roots. You still have to solve the quadratic." },
        { tex: kind === "complex" ? `${S(desc.re)}, ${S(desc.im)}` : `${S(desc.re ?? desc.r1)} \\pm ${Math.abs(disc) ? fixed(Math.sqrt(Math.abs(disc)) / 2, 2) : 0}j`,
          why: disc < 0
            ? "A negative discriminant gives a <b>conjugate pair</b>, not two separate real numbers."
            : "A non-negative discriminant gives real roots, with no j in them." },
      ],
      answer: 0,
      steps: [
        `Replace each derivative with a power of ${T("r")}:` +
          `<span class="math display" data-tex="r^2 + ${b}r + ${c} = 0"></span>`,
        `Check the discriminant before solving — it tells you the <em>kind</em> of answer to expect:` +
          `<span class="math display" data-tex="b^2 - 4ac = ${b}^2 - 4(${c}) = ${S(disc)}"></span>` +
          (disc < 0 ? "Negative, so a complex conjugate pair: the system will <b>ring</b>."
            : disc === 0 ? "Zero, so a repeated real root: <b>critically damped</b>."
            : "Positive, so two distinct real roots: <b>overdamped</b>."),
        `<span class="math display" data-tex="r = \\frac{-${b} \\pm \\sqrt{${S(disc)}}}{2} = ${right}"></span>` +
          (disc < 0
            ? `The real part <b>${S(desc.re)}</b> is the decay rate; the imaginary part <b>${desc.im}</b> is the ringing frequency in rad/s.`
            : "Both roots are negative, so both exponentials decay."),
      ],
    };
  },
});

/* ==========================================================================
   Classifying the response
   ========================================================================== */

defineProblem("ode-classify", {
  topic: "Damping cases",
  lookup: "Mathematics → Differential equations → Second-order response",
  make(rng) {
    const wn = rng.pick([2, 4, 5, 10]);
    const c = wn * wn;
    const kind = rng.pick(["under", "critical", "over"]);
    const b = kind === "critical" ? 2 * wn : kind === "under" ? rng.int(1, 2 * wn - 1) : 2 * wn + rng.int(1, 8);
    const zeta = b / (2 * wn);

    const names = {
      under: "Underdamped — it oscillates while decaying",
      critical: "Critically damped — fastest return with no overshoot",
      over: "Overdamped — returns slowly without overshoot",
      none: "Undamped — oscillates forever",
    };
    const whys = {
      under: `That needs ${T("\\zeta < 1")}, and here ζ = ${fixed(zeta, 2)}.`,
      critical: `That needs ${T("\\zeta = 1")} exactly, and here ζ = ${fixed(zeta, 2)}.`,
      over: `That needs ${T("\\zeta > 1")}, and here ζ = ${fixed(zeta, 2)}.`,
      none: `That needs ${T("\\zeta = 0")} — no damping term at all.`,
    };

    return {
      stem: `How does the system ${T(`y'' + ${b}y' + ${c}y = 0`)} respond to a disturbance?`,
      choices: Object.entries(names).map(([id, label]) => ({
        text: label,
        why: id === kind ? "" : whys[id],
      })),
      answer: Object.keys(names).indexOf(kind),
      steps: [
        `Read off ${T(`\\omega_n = \\sqrt{${c}} = ${wn}`)} and then the damping ratio:` +
          `<span class="math display" data-tex="\\zeta = \\frac{b}{2\\omega_n} = \\frac{${b}}{2(${wn})} = ${fixed(zeta, 3)}"></span>`,
        `The discriminant says the same thing: ${T(`b^2 - 4ac = ${b * b - 4 * c}`)}, which is ` +
          `${b * b - 4 * c < 0 ? "negative — complex roots" : b * b - 4 * c === 0 ? "zero — a repeated root" : "positive — two real roots"}.`,
        `<b>${names[kind]}.</b> ` +
          (kind === "under"
            ? `It rings at ${T(`\\omega_d = \\sqrt{${c} - ${(b / 2) ** 2}} = ${fixed(Math.sqrt(c - (b / 2) ** 2), 2)}`)} rad/s inside a decaying envelope.`
            : "The roots are on the real axis, so nothing oscillates."),
      ],
    };
  },
});

/* ==========================================================================
   General solution from roots
   ========================================================================== */

defineProblem("ode-general", {
  topic: "General solutions",
  lookup: "Mathematics → Differential equations → Second-order solution forms",
  make(rng) {
    const kind = rng.pick(["complex", "repeated", "real"]);
    let b, c, right, wrongs;

    if (kind === "complex") {
      const al = rng.int(1, 4), be = rng.int(1, 5);
      b = 2 * al; c = al * al + be * be;
      right = `y = e^{-${al}x}\\left(C_1\\cos ${be}x + C_2\\sin ${be}x\\right)`;
      wrongs = [
        { tex: `y = e^{${al}x}\\left(C_1\\cos ${be}x + C_2\\sin ${be}x\\right)`,
          why: "The exponent's sign is wrong. A positive damping coefficient forces a negative real part, so the envelope must <b>shrink</b>." },
        { tex: `y = C_1\\cos ${be}x + C_2\\sin ${be}x`,
          why: "The decaying envelope is missing. That form solves an <em>undamped</em> equation, with no y′ term at all." },
        { tex: `y = C_1e^{-${al}x} + C_2e^{-${be}x}`,
          why: "That is the form for two <b>real</b> roots. A negative discriminant produces a conjugate pair, which gives sine and cosine." },
      ];
    } else if (kind === "repeated") {
      const r = rng.int(1, 5);
      b = 2 * r; c = r * r;
      right = `y = (C_1 + C_2x)e^{-${r}x}`;
      wrongs = [
        { tex: `y = C_1e^{-${r}x} + C_2e^{-${r}x}`,
          why: "Those two terms collapse into one constant, so this has only one arbitrary constant. A second-order equation needs two — hence the factor of x." },
        { tex: `y = C_1e^{-${r}x}`, why: "Only one arbitrary constant, and a second-order equation needs two." },
        { tex: `y = e^{-${r}x}(C_1\\cos ${r}x + C_2\\sin ${r}x)`,
          why: "That form belongs to complex roots. Here the discriminant is exactly zero, so the root is real and repeated." },
      ];
    } else {
      const r1 = rng.int(1, 4), r2 = r1 + rng.int(1, 3);
      b = r1 + r2; c = r1 * r2;
      right = `y = C_1e^{-${r1}x} + C_2e^{-${r2}x}`;
      wrongs = [
        { tex: `y = C_1e^{${r1}x} + C_2e^{${r2}x}`, why: "Both exponents should be negative — the roots of this equation are negative, which is what makes the solution decay." },
        { tex: `y = (C_1 + C_2x)e^{-${r1}x}`, why: "That is the repeated-root form. Here the two roots are distinct." },
        { tex: `y = e^{-${r1}x}(C_1\\cos ${r2}x + C_2\\sin ${r2}x)`, why: "That is the complex-root form, and this discriminant is positive." },
      ];
    }

    return {
      stem: `What is the general solution to ${T(`y'' + ${b}y' + ${c}y = 0`)}?`,
      choices: [{ tex: right, why: "" }, ...wrongs],
      answer: 0,
      steps: [
        `Characteristic equation:` +
          `<span class="math display" data-tex="r^2 + ${b}r + ${c} = 0, \\qquad b^2 - 4ac = ${b * b - 4 * c}"></span>`,
        kind === "complex"
          ? `Negative discriminant, so a conjugate pair. The real part goes into the exponential envelope and the imaginary part becomes the frequency of the sine and cosine.`
          : kind === "repeated"
          ? `Zero discriminant, so one repeated root — and one exponential cannot carry two independent constants, so the second solution picks up a factor of ${T("x")}.`
          : `Positive discriminant, so two distinct real roots, each contributing its own decaying exponential.`,
        `<span class="math display" data-tex="${right}"></span>` +
          `Two arbitrary constants, as every second-order equation must have.`,
      ],
    };
  },
});

/* ==========================================================================
   Applying an initial condition
   ========================================================================== */

defineProblem("ode-initial", {
  topic: "Initial conditions",
  lookup: "Mathematics → Differential equations → Initial value problems",
  make(rng) {
    const k = -rng.int(1, 5);
    const y0 = rng.nz(2, 12);
    const t = rng.int(1, 3);
    const v = y0 * Math.exp(k * t);

    return {
      stem:
        `Solve ${T(`\\frac{dy}{dt} = ${S(k)}y`)} with ${T(`y(0) = ${S(y0)}`)}, ` +
        `then evaluate ${T(`y(${t})`)}, most nearly.`,
      choices: [
        { text: fixed(v, 3), why: "" },
        { text: fixed(y0 * Math.exp(-k * t), 3), why: "The exponent's sign is wrong — this grows instead of decaying." },
        { text: fixed(Math.exp(k * t), 3), why: `The initial condition was dropped. ${T(`y(0) = ${S(y0)}`)} sets the constant C, and here C = ${S(y0)}.` },
        { text: fixed(y0 + k * t, 3), why: "That treats the rate as constant. It is proportional to y, which makes the decay exponential rather than linear." },
      ],
      answer: 0,
      steps: [
        `The rate is proportional to the quantity, so the solution is exponential:` +
          `<span class="math display" data-tex="y = Ce^{${S(k)}t}"></span>`,
        `Apply the initial condition. At ${T("t = 0")} the exponential is 1, so ${T(`C = ${S(y0)}`)}:` +
          `<span class="math display" data-tex="y = ${S(y0)}e^{${S(k)}t}"></span>`,
        `<span class="math display" data-tex="y(${t}) = ${S(y0)}e^{${S(k * t)}} = ${fixed(v, 3)}"></span>` +
          `<b>${fixed(v, 3)}</b>. The time constant here is ${T(`1/${Math.abs(k)} = ${fixed(1 / Math.abs(k), 3)}`)}, ` +
          `and after five of those the quantity is under 1% of where it started.`,
      ],
    };
  },
});

/* ==========================================================================
   Handbook Reflex items for Part 7
   ========================================================================== */

defineReflex([
  {
    part: "odes",
    stem: "A capacitor discharges through a resistor. Find the voltage 3 ms after the switch opens.",
    tool: "Exponential decay solution",
    because: "RC transients are y′ = ky, whose solution is Ce^{kt}.",
  },
  {
    part: "odes",
    stem: "Find the general solution to y″ + 4y′ + 13y = 0.",
    tool: "Characteristic equation",
    because: "The discriminant is −36, so complex roots and a ringing response.",
  },
  {
    part: "odes",
    stem: "An RLC circuit has ζ = 1. Describe how it returns to rest.",
    tool: "Damping-case classification",
    because: "ζ = 1 is critical damping: fastest return with no overshoot.",
  },
  {
    part: "odes",
    stem: "Solve dy/dx = xy² with y(0) = 1.",
    tool: "Separation of variables",
    because: "The x's and y's split cleanly onto opposite sides.",
  },
  {
    part: "odes",
    stem: "y″ + 3y′ + 2y = 5e^{4t}. Find only the complementary solution.",
    tool: "Characteristic equation",
    because: "The complementary half ignores the forcing term entirely.",
  },
]);
