/* ==========================================================================
   problems/calculus.js — generators for Part 6.
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed } from "../lib/fmt.js";

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;
const S = (v) => num(v).replace("−", "-");

/** Polynomial helpers: a poly is an array of [coefficient, power]. */
const polyTex = (terms) => {
  const out = terms
    .filter(([c]) => c !== 0)
    .map(([c, k], i) => {
      const sign = c < 0 ? " - " : i === 0 ? "" : " + ";
      const mag = Math.abs(c) === 1 && k !== 0 ? "" : String(Math.abs(c));
      const xs = k === 0 ? "" : k === 1 ? "x" : `x^{${k}}`;
      return `${i === 0 && c < 0 ? "-" : sign}${mag}${xs}`;
    })
    .join("");
  return out || "0";
};
const polyAt = (terms, x) => terms.reduce((s, [c, k]) => s + c * Math.pow(x, k), 0);
const dPoly = (terms) => terms.filter(([, k]) => k !== 0).map(([c, k]) => [c * k, k - 1]);
const iPoly = (terms) => terms.map(([c, k]) => [c / (k + 1), k + 1]);

/* ==========================================================================
   Evaluating a derivative
   ========================================================================== */

defineProblem("derivative-eval", {
  topic: "Derivatives",
  lookup: "Mathematics → Calculus → Derivatives (power, product, quotient rules)",
  make(rng) {
    const terms = [[rng.nz(-5, 5), rng.int(3, 4)], [rng.nz(-6, 6), 2], [rng.nz(-8, 8), 1], [rng.int(-6, 6), 0]];
    const d = dPoly(terms);
    const x = rng.int(-3, 3) || 2;
    const v = polyAt(d, x);
    const wrongNoDrop = terms.map(([c, k]) => [c * k, k]);   // forgot to reduce the power

    return {
      stem: `If ${T(`f(x) = ${polyTex(terms)}`)}, what is ${T(`f'(${S(x)})`)}?`,
      choices: [
        { text: S(v), why: "" },
        { text: S(polyAt(terms, x)), why: `That is ${T(`f(${S(x)})`)} — the function itself, not its derivative.` },
        { text: S(polyAt(wrongNoDrop, x)), why: "The exponents were brought down but never reduced by one. The power rule does both." },
        { text: S(polyAt(dPoly(d), x)), why: `That is ${T(`f''(${S(x)})`)} — differentiated one time too many.` },
      ],
      answer: 0,
      steps: [
        `Power rule term by term — bring the exponent down, drop it by one, and the constant vanishes:` +
          `<span class="math display" data-tex="f'(x) = ${polyTex(d)}"></span>`,
        `Substitute ${T(`x = ${S(x)}`)}:` +
          `<span class="math display" data-tex="f'(${S(x)}) = ${d.map(([c, k]) => `(${S(c)})(${S(x)})^{${k}}`).join(" + ").replace(/\+ \(-/g, "- (")}"></span>`,
        `= <b>${S(v)}</b>`,
      ],
    };
  },
});

/* ==========================================================================
   Chain rule
   ========================================================================== */

defineProblem("chain-rule", {
  topic: "Chain rule",
  lookup: "Mathematics → Calculus → Derivatives (chain rule)",
  make(rng) {
    const a = rng.nz(2, 6);
    const kind = rng.pick(["sin", "cos", "exp", "power", "ln"]);
    const n = rng.int(2, 4);

    const spec = {
      sin: { fx: `\\sin ${a}x`, ans: `${a}\\cos ${a}x`,
             noInner: `\\cos ${a}x`, wrongSign: `-${a}\\cos ${a}x`,
             wrongOuter: `${a}\\sin ${a}x`,
             say: `the outside is sine, whose derivative is cosine; the inside is ${a}x, whose derivative is ${a}` },
      cos: { fx: `\\cos ${a}x`, ans: `-${a}\\sin ${a}x`,
             noInner: `-\\sin ${a}x`, wrongSign: `${a}\\sin ${a}x`,
             wrongOuter: `${a}\\cos ${a}x`,
             say: `the outside is cosine, whose derivative is <b>minus</b> sine; the inside is ${a}x, whose derivative is ${a}` },
      exp: { fx: `e^{${a}x}`, ans: `${a}e^{${a}x}`,
             noInner: `e^{${a}x}`, wrongSign: `-${a}e^{${a}x}`,
             wrongOuter: `${a}x\\,e^{${a}x}`,
             say: `the exponential is its own derivative, and the inside ${a}x contributes a factor of ${a}` },
      power: { fx: `(1 - ${a}x)^{${n}}`, ans: `-${a * n}(1 - ${a}x)^{${n - 1}}`,
             noInner: `${n}(1 - ${a}x)^{${n - 1}}`, wrongSign: `${a * n}(1 - ${a}x)^{${n - 1}}`,
             wrongOuter: `-${a * n}(1 - ${a}x)^{${n}}`,
             say: `the outside is a ${n}th power; the inside is ${T(`1 - ${a}x`)}, whose derivative is <b>−${a}</b>` },
      ln: { fx: `\\ln(${a}x + 1)`, ans: `\\frac{${a}}{${a}x + 1}`,
             noInner: `\\frac{1}{${a}x + 1}`, wrongSign: `\\frac{-${a}}{${a}x + 1}`,
             wrongOuter: `\\frac{${a}}{x}`,
             say: `the outside is a logarithm, giving one over the inside; the inside contributes ${a}` },
    }[kind];

    return {
      stem: `Differentiate ${T(`f(x) = ${spec.fx}`)}.`,
      choices: [
        { tex: spec.ans, why: "" },
        { tex: spec.noInner, why: "The <b>inner derivative</b> is missing. This is the single most common calculus slip on the exam — every dropped factor is this." },
        { tex: spec.wrongSign, why: "Sign error. Check whether the outer function or the inner one contributes the minus." },
        { tex: spec.wrongOuter, why: "The outer function was not differentiated correctly." },
      ],
      answer: 0,
      steps: [
        `Spot the structure first: this is a function <em>inside</em> another function, so the chain rule applies.` +
          `<span class="math display" data-tex="\\frac{d}{dx}f(g(x)) = f'(g(x))\\cdot g'(x)"></span>`,
        `Here ${spec.say}.`,
        `Multiplying the two:` +
          `<span class="math display" data-tex="f'(x) = ${spec.ans}"></span>` +
          `<b>The habit worth building: before differentiating anything, ask whether there is something inside something else.</b>`,
      ],
    };
  },
});

/* ==========================================================================
   Maxima and minima on a closed interval
   ========================================================================== */

defineProblem("critical-points", {
  topic: "Maxima and minima",
  lookup: "Mathematics → Calculus → Maxima, minima, inflection points",
  make(rng) {
    const a = rng.pick([1, 2, 5]);
    const c = rng.pick([3, 6, 12]);
    const terms = [[a, 3], [0, 2], [-c, 1], [rng.int(0, 3), 0]];
    const L = rng.pick([2, 3]);

    const f = (x) => polyAt(terms, x);
    const crit = Math.sqrt(c / (3 * a));
    const cands = [-L, L, ...(crit < L ? [-crit, crit] : [])];
    const vals = cands.map((x) => ({ x, y: f(x) }));
    const lo = vals.reduce((m, v) => (v.y < m.y ? v : m));
    const hi = vals.reduce((m, v) => (v.y > m.y ? v : m));
    const critVals = vals.filter((v) => Math.abs(Math.abs(v.x) - crit) < 1e-9);

    return {
      stem:
        `What are the minimum and maximum values, respectively, of ` +
        `${T(`f(x) = ${polyTex(terms)}`)} on the interval ${T(`[-${L}, ${L}]`)}?`,
      choices: [
        { text: `${fixed(lo.y, 2)}, ${fixed(hi.y, 2)}`, why: "" },
        { text: critVals.length
            ? `${fixed(Math.min(...critVals.map((v) => v.y)), 2)}, ${fixed(Math.max(...critVals.map((v) => v.y)), 2)}`
            : `${fixed(f(0), 2)}, ${fixed(hi.y, 2)}`,
          why: "Only the critical points were checked. On a <b>closed interval</b> the extreme values can sit at the endpoints — and here they do." },
        { text: `${fixed(-L, 2)}, ${fixed(L, 2)}`, why: "Those are the endpoints of the interval, not the values of the function there." },
        { text: `${fixed(hi.y, 2)}, ${fixed(lo.y, 2)}`, why: "Right pair, wrong order — the question asks for minimum first." },
      ],
      answer: 0,
      steps: [
        `Differentiate and set to zero:` +
          `<span class="math display" data-tex="f'(x) = ${polyTex(dPoly(terms))} = 0 \\;\\Rightarrow\\; x = \\pm${fixed(crit, 3)}"></span>`,
        `Now build the full candidate list. <b>Critical points <em>and</em> both endpoints</b>: ` +
          cands.map((x) => T(`x = ${fixed(x, 3)}`)).join(", ") + `.`,
        `Evaluate ${T("f")} at each: ` +
          vals.map((v) => `${T(`f(${fixed(v.x, 2)}) = ${fixed(v.y, 2)}`)}`).join(", ") +
          `. Minimum <b>${fixed(lo.y, 2)}</b> at ${T(`x = ${fixed(lo.x, 2)}`)}, maximum <b>${fixed(hi.y, 2)}</b> at ${T(`x = ${fixed(hi.x, 2)}`)}.` +
          (Math.abs(Math.abs(lo.x) - L) < 1e-9 || Math.abs(Math.abs(hi.x) - L) < 1e-9
            ? " Note that an extreme value landed on an <b>endpoint</b> — differentiating alone would never have found it."
            : ""),
      ],
    };
  },
});

/* ==========================================================================
   Definite integral
   ========================================================================== */

defineProblem("definite-integral", {
  topic: "Definite integrals",
  lookup: "Mathematics → Calculus → Integral calculus (definite integrals)",
  make(rng) {
    const terms = [[rng.nz(1, 6), rng.int(1, 3)], [rng.nz(-6, 6), 1], [rng.int(-4, 6), 0]];
    const a = rng.int(0, 2), b = a + rng.int(1, 3);
    const F = iPoly(terms);
    const v = polyAt(F, b) - polyAt(F, a);

    return {
      stem: `Evaluate ${T(`\\int_{${a}}^{${b}} \\left(${polyTex(terms)}\\right) dx`)}.`,
      choices: [
        { text: fixed(v, 3), why: "" },
        { text: fixed(polyAt(F, b), 3), why: `Only the upper limit was substituted. A definite integral is ${T("F(b) - F(a)")} — both ends.` },
        { text: fixed(polyAt(terms, b) - polyAt(terms, a), 3), why: "The integrand was evaluated at the limits without integrating first." },
        { text: fixed(polyAt(dPoly(terms), b) - polyAt(dPoly(terms), a), 3), why: "Differentiated instead of integrated. Exponents go <em>up</em> by one when integrating." },
      ],
      answer: 0,
      steps: [
        `Antidifferentiate term by term — raise each exponent and divide by the new one:` +
          `<span class="math display" data-tex="F(x) = ${polyTex(F.map(([c, k]) => [Number(c.toFixed(4)), k]))}"></span>` +
          `No ${T("+C")} is needed: in a definite integral it appears at both ends and cancels.`,
        `<span class="math display" data-tex="F(${b}) = ${fixed(polyAt(F, b), 4)}, \\qquad F(${a}) = ${fixed(polyAt(F, a), 4)}"></span>`,
        `${T(`F(${b}) - F(${a})`)} = ${fixed(polyAt(F, b), 4)} − ${fixed(polyAt(F, a), 4)} = <b>${fixed(v, 3)}</b>`,
      ],
    };
  },
});

/* ==========================================================================
   Indefinite integral, including the 1/x exception
   ========================================================================== */

defineProblem("indefinite-integral", {
  topic: "Indefinite integrals",
  lookup: "Mathematics → Calculus → Integral calculus (table of integrals)",
  make(rng) {
    const a = rng.nz(2, 6);
    const kind = rng.pick(["power", "recip", "exp", "sin", "cos"]);
    const spec = {
      power: { fx: `${a}x^{3}`, ans: `\\frac{${a}}{4}x^{4} + C`,
               w1: `${a * 3}x^{2} + C`, w2: `\\frac{${a}}{3}x^{4} + C`, w3: `${a}x^{4} + C`,
               why1: "That is the derivative, not the integral — the exponent went down instead of up.",
               why2: "Divided by the old exponent instead of the new one. It is x^(n+1)/(n+1).",
               why3: "The exponent was raised but nothing was divided." },
      recip: { fx: `\\frac{${a}}{x}`, ans: `${a}\\ln|x| + C`,
               w1: `\\frac{${a}}{2}x^{2} + C`, w2: `-\\frac{${a}}{x^{2}} + C`, w3: `${a}\\ln x^{2} + C`,
               why1: `The power rule breaks at ${T("n = -1")}, because you would divide by zero. This case is the logarithm.`,
               why2: "That is the derivative of a/x, not its integral.",
               why3: "The absolute value matters, and the exponent does not belong there." },
      exp: { fx: `e^{${a}x}`, ans: `\\frac{1}{${a}}e^{${a}x} + C`,
             w1: `e^{${a}x} + C`, w2: `${a}e^{${a}x} + C`, w3: `\\frac{e^{${a}x + 1}}{${a}x + 1} + C`,
             why1: `The ${T(`1/${a}`)} is missing — it undoes the chain-rule factor differentiation would produce.`,
             why2: `Multiplied by ${a} instead of divided. Integration undoes what differentiation does.`,
             why3: "The power rule does not apply to an exponent containing the variable." },
      sin: { fx: `\\sin ${a}x`, ans: `-\\frac{1}{${a}}\\cos ${a}x + C`,
             w1: `\\frac{1}{${a}}\\cos ${a}x + C`, w2: `-${a}\\cos ${a}x + C`, w3: `-\\frac{1}{${a}}\\sin ${a}x + C`,
             why1: `Sign. ${T("\\int\\sin = -\\cos")}, because differentiating cosine produces the minus.`,
             why2: `Multiplied by ${a} instead of divided.`,
             why3: "Sine integrates to cosine, not to another sine." },
      cos: { fx: `\\cos ${a}x`, ans: `\\frac{1}{${a}}\\sin ${a}x + C`,
             w1: `-\\frac{1}{${a}}\\sin ${a}x + C`, w2: `${a}\\sin ${a}x + C`, w3: `\\frac{1}{${a}}\\cos ${a}x + C`,
             why1: `Sign. ${T("\\int\\cos = +\\sin")} — the minus belongs to the sine case.`,
             why2: `Multiplied by ${a} instead of divided.`,
             why3: "Cosine integrates to sine, not to another cosine." },
    }[kind];

    return {
      stem: `Determine ${T(`\\int ${spec.fx}\\,dx`)}.`,
      choices: [
        { tex: spec.ans, why: "" },
        { tex: spec.w1, why: spec.why1 },
        { tex: spec.w2, why: spec.why2 },
        { tex: spec.w3, why: spec.why3 },
      ],
      answer: 0,
      steps: [
        `Integration is differentiation run backwards, so the fastest check is to differentiate each option and see which returns the integrand.`,
        `<span class="math display" data-tex="\\int ${spec.fx}\\,dx = ${spec.ans}"></span>`,
        `Verify: differentiating that answer gives back ${T(spec.fx)} ✓. ` +
          `And the ${T("+C")} is not optional on an indefinite integral — every antiderivative differs by a constant.`,
      ],
    };
  },
});

/* ==========================================================================
   Partial derivatives
   ========================================================================== */

defineProblem("partial-derivative", {
  topic: "Partial derivatives",
  lookup: "Mathematics → Calculus → Partial derivatives",
  make(rng) {
    const a = rng.nz(2, 5), b = rng.nz(2, 5), c = rng.nz(2, 5);
    const x = rng.int(1, 3), y = rng.int(1, 3);
    // f = a x^2 y + b x y^2 + c y
    const fx = 2 * a * x * y + b * y * y;
    const fy = a * x * x + 2 * b * x * y + c;
    const wantX = rng.chance(0.5);

    return {
      stem:
        `For ${T(`f(x, y) = ${a}x^2y + ${b}xy^2 + ${c}y`)}, evaluate ` +
        `${T(wantX ? "\\frac{\\partial f}{\\partial x}" : "\\frac{\\partial f}{\\partial y}")} at ` +
        `${T(`(${x}, ${y})`)}.`,
      choices: [
        { text: S(wantX ? fx : fy), why: "" },
        { text: S(wantX ? fy : fx),
          why: `That is the partial with respect to ${wantX ? "y" : "x"}. Hold the <b>other</b> variable still.` },
        { text: S(a * x * x * y + b * x * y * y + c * y), why: "That is the function's value, not a derivative." },
        { text: S(wantX ? 2 * a * x * y : a * x * x),
          why: `Only the first term was differentiated. Every term containing ${wantX ? "x" : "y"} contributes.` },
      ],
      answer: 0,
      steps: [
        wantX
          ? `Treat ${T("y")} as a constant and differentiate with respect to ${T("x")}. The ${T(`${c}y`)} term has no ${T("x")} in it, so it differentiates to zero:` +
            `<span class="math display" data-tex="\\frac{\\partial f}{\\partial x} = ${2 * a}xy + ${b}y^2"></span>`
          : `Treat ${T("x")} as a constant and differentiate with respect to ${T("y")}:` +
            `<span class="math display" data-tex="\\frac{\\partial f}{\\partial y} = ${a}x^2 + ${2 * b}xy + ${c}"></span>`,
        `Substitute ${T(`x = ${x}`)}, ${T(`y = ${y}`)}.`,
        `= <b>${S(wantX ? fx : fy)}</b>. Nothing new was differentiated — the other variable simply became a number.`,
      ],
    };
  },
});

/* ==========================================================================
   Handbook Reflex items for Part 6
   ========================================================================== */

defineReflex([
  {
    part: "calculus",
    stem: "A box with a square base and no lid must hold 32 m³. Find the dimensions using the least material.",
    tool: "Set the derivative to zero",
    because: "An optimisation: express area in one variable, differentiate, solve.",
  },
  {
    part: "calculus",
    stem: "Differentiate y = (3x² + 1)⁵.",
    tool: "Chain rule",
    because: "A function inside another function — and the inner derivative is 6x.",
  },
  {
    part: "calculus",
    stem: "Find the area enclosed between y = x² and y = 2x.",
    tool: "Integrate upper minus lower",
    because: "Find the intersections first, then integrate the difference between them.",
  },
  {
    part: "calculus",
    stem: "Given x² + xy + y² = 7, find dy/dx.",
    tool: "Implicit differentiation",
    because: "y cannot be isolated cleanly, so differentiate through and solve for dy/dx.",
  },
  {
    part: "calculus",
    stem: "A ladder slides down a wall at 0.5 m/s. How fast is its base moving out?",
    tool: "Related rates",
    because: "Differentiate the Pythagorean relation with respect to time.",
  },
  {
    part: "calculus",
    stem: "For f(x, y, z) = xyz, find the rate of change in the z direction.",
    tool: "Partial derivative",
    because: "One variable at a time, with the others held constant.",
  },
]);
