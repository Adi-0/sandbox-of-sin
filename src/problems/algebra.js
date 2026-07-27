/* ==========================================================================
   problems/algebra.js — generators for Part 1.

   House rules for every generator in this project:
     · numbers stay friendly enough to check mentally
     · distractors are produced by *making the mistake*, not by nudging digits
     · every wrong choice carries a `why` naming the error it represents
     · steps are written the way you would work it on scratch paper
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed, sig } from "../lib/fmt.js";

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;

/* ==========================================================================
   Collapsing a chain of logarithms
   ========================================================================== */

defineProblem("log-collapse", {
  topic: "Logarithms",
  lookup: "Mathematics → Algebra → Logarithms (identities for products, quotients and powers)",
  make(rng) {
    const b = rng.pick([2, 3, 5, 10]);
    const k = rng.int(2, 4);              // the answer: log_b(b^k) = k
    const target = Math.pow(b, k);
    // build target as (p × q) / r with friendly integers
    const r = rng.pick([2, 3, 4]);
    const p = rng.pick([2, 3, 6]);
    const q = (target * r) / p;
    if (!Number.isInteger(q) || q < 2 || q > 400) return this.make(rng);

    const stem =
      `Using logarithmic identities, what is the value of ` +
      T(`\\log_{${b}} ${p} + \\log_{${b}} ${q} - \\log_{${b}} ${r}`) + `?`;

    return {
      stem,
      choices: [
        { text: num(k), why: "" },
        { text: num(k + 1), why: `Off by one — this is ${T(`\\log_{${b}}`)} of ${b * target}, so a factor of ${b} slipped in. Recheck the division by ${r}.` },
        { text: fixed(Math.log10(target), 3), why: `That is ${T("\\log_{10}")} of the argument. The base here is ${b}, not 10.` },
        { text: num(p + q - r), why: "The identities turn logs of products into sums of logs — not the other way round. You added the arguments instead of multiplying them." },
      ],
      answer: 0,
      steps: [
        `Sums of logs become products, differences become quotients:` +
          `<span class="math display" data-tex="\\log_{${b}}\\frac{(${p})(${q})}{${r}}"></span>`,
        `Inside: ${T(`\\frac{${p * q}}{${r}} = ${target}`)}.`,
        `So the question is "${b} to what power is ${target}?" — and ${T(`${b}^{${k}} = ${target}`)}.` +
          ` <b>The answer is ${k}.</b>`,
      ],
    };
  },
});

/* ==========================================================================
   Solving for an exponent
   ========================================================================== */

defineProblem("exponent-solve", {
  topic: "Exponentials",
  lookup: "Mathematics → Algebra → Logarithms (change of base)",
  make(rng) {
    const a = rng.pick([2, 3, 5, 7]);
    const c = rng.pick([40, 60, 100, 250, 500]);
    const x = Math.log(c) / Math.log(a);

    return {
      stem: `Solve for ${T("x")}: ${T(`${a}^x = ${c}`)}. The value is most nearly:`,
      choices: [
        { text: fixed(x, 2), why: "" },
        { text: fixed(Math.log10(c), 2), why: "That is log base 10 of the right-hand side. You still have to divide by the log of the base." },
        { text: fixed(c / a, 2), why: "Dividing undoes multiplication, not exponentiation. An exponent comes down with a logarithm." },
        { text: fixed(Math.log(a) / Math.log(c), 2), why: "The change-of-base fraction is upside down. It is log(argument) over log(base)." },
      ],
      answer: 0,
      steps: [
        `Take the log of both sides. Which log does not matter, as long as it is the same one twice:` +
          `<span class="math display" data-tex="x\\log ${a} = \\log ${c}"></span>` +
          `That step used ${T("\\log x^n = n\\log x")} — the rule that brings an exponent down to where you can solve for it.`,
        `Divide: <span class="math display" data-tex="x = \\frac{\\log ${c}}{\\log ${a}}"></span>`,
        `= ${fixed(Math.log10(c), 4)} / ${fixed(Math.log10(a), 4)} = <b>${fixed(x, 2)}</b>. ` +
          `Sanity check: ${T(`${a}^{${Math.floor(x)}} = ${Math.pow(a, Math.floor(x))}`)} and ` +
          `${T(`${a}^{${Math.floor(x) + 1}} = ${Math.pow(a, Math.floor(x) + 1)}`)}, so the answer must sit between ` +
          `${Math.floor(x)} and ${Math.floor(x) + 1}.`,
      ],
    };
  },
});

/* ==========================================================================
   Geometric progression
   ========================================================================== */

defineProblem("geometric-progression", {
  topic: "Progressions",
  lookup: "Mathematics → Algebra → Sequences and series (geometric progression)",
  make(rng) {
    const rNum = rng.pick([2, 3, 3, 5]);
    const rDen = rng.pick([1, 2]);
    const r = rNum / rDen;
    const a1 = rng.pick([1, 2, 3, 4, 5]) / rng.pick([1, 1, 2, 5]);
    const i = rng.int(2, 3);
    const jj = i + rng.int(3, 4);
    const ai = a1 * Math.pow(r, i - 1);
    const aj = a1 * Math.pow(r, jj - 1);
    if (aj > 5000 || ai < 0.01) return this.make(rng);

    return {
      stem:
        `The ${ord(i)} and ${ord(jj)} terms of a geometric progression are ` +
        `${T(dec(ai))} and ${T(dec(aj))} respectively. What is the first term?`,
      choices: [
        { text: dec(a1), why: "" },
        { text: dec(a1 * r), why: `This is the <em>second</em> term. Going from term ${i} back to term 1 is ${i - 1} steps, not ${i - 2}.` },
        { text: dec(ai / Math.pow(r, i)), why: "You divided by the ratio one time too many — the classic off-by-one in the exponent." },
        { text: dec(a1 * r * r), why: "You stopped stepping backwards too early." },
      ],
      answer: 0,
      steps: [
        `From term ${i} to term ${jj} is <b>${jj - i} steps</b>, so the ratio is applied ${jj - i} times:` +
          `<span class="math display" data-tex="r^{${jj - i}} = \\frac{${dec(aj)}}{${dec(ai)}} = ${dec(Math.pow(r, jj - i))}"></span>`,
        `So ${T(`r = ${dec(r)}`)}.`,
        `Now step back from term ${i} to term 1 — that is <b>${i - 1} step${i - 1 > 1 ? "s" : ""}</b>:` +
          `<span class="math display" data-tex="a_1 = \\frac{${dec(ai)}}{(${dec(r)})^{${i - 1}}} = ${dec(a1)}"></span>` +
          `<b>The first term is ${dec(a1)}.</b>`,
      ],
    };
  },
});

/* ==========================================================================
   Right-triangle ratios
   ========================================================================== */

const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];

defineProblem("right-triangle", {
  topic: "Right triangles",
  lookup: "Mathematics → Trigonometry → Right triangle definitions",
  make(rng) {
    const [o, a, h] = rng.pick(TRIPLES);
    const scale = rng.pick([1, 1, 2]);
    const O = o * scale, A = a * scale, H = h * scale;
    const which = rng.pick(["csc", "sec", "cot", "sin", "cos", "tan"]);

    const vals = {
      sin: O / H, cos: A / H, tan: O / A,
      csc: H / O, sec: H / A, cot: A / O,
    };
    const NAME = { sin: "sin", cos: "cos", tan: "tan", csc: "csc", sec: "sec", cot: "cot" };
    const recip = { csc: "sin", sec: "cos", cot: "tan" };
    const v = vals[which];

    // the wrong answers ARE the other five ratios: the real error mode
    const others = Object.entries(vals).filter(([k]) => k !== which);
    const picked = rng.sample(others, 3);

    return {
      stem:
        `A right triangle has a side of length ${O} opposite angle ${T("\\theta")}, ` +
        `a side of length ${A} adjacent to it, and a hypotenuse of length ${H}. ` +
        `What is ${T(`\\${NAME[which]}\\theta`)}, most nearly?`,
      choices: [
        { text: fixed(v, 3), why: "" },
        ...picked.map(([k, val]) => ({
          text: fixed(val, 3),
          why: `That is ${T(`\\${NAME[k]}\\theta`)}. ${
            recip[which]
              ? `Remember ${T(`\\${which}\\theta = 1/\\${recip[which]}\\theta`)} — the reciprocal functions trip people far more often than the three main ones.`
              : "Check which side is opposite and which is adjacent to the angle named."
          }`,
        })),
      ],
      answer: 0,
      steps: [
        `Name the sides relative to ${T("\\theta")}: opposite = ${O}, adjacent = ${A}, hypotenuse = ${H}. ` +
          `(Check: ${T(`${O}^2 + ${A}^2 = ${O * O + A * A} = ${H}^2`)} ✓)`,
        recip[which]
          ? `${T(`\\${which}\\theta`)} is the reciprocal of ${T(`\\${recip[which]}\\theta`)}, so flip that ratio:` +
            `<span class="math display" data-tex="\\${which}\\theta = \\frac{${ratioTop(which, O, A, H)}}{${ratioBot(which, O, A, H)}}"></span>`
          : `<span class="math display" data-tex="\\${which}\\theta = \\frac{${ratioTop(which, O, A, H)}}{${ratioBot(which, O, A, H)}}"></span>`,
        `= <b>${fixed(v, 3)}</b>.`,
      ],
    };
  },
});

const ratioTop = (k, O, A, H) => ({ sin: O, cos: A, tan: O, csc: H, sec: H, cot: A }[k]);
const ratioBot = (k, O, A, H) => ({ sin: H, cos: H, tan: A, csc: O, sec: A, cot: O }[k]);

/* ==========================================================================
   Choosing a triangle law
   ========================================================================== */

defineProblem("law-choice", {
  topic: "Oblique triangles",
  lookup: "Mathematics → Trigonometry → Law of sines, law of cosines",
  make(rng) {
    const scenarios = [
      { given: "two sides and the angle between them", law: "cosines",
        why: "The known angle is between the known sides, so no side is paired with the angle opposite it." },
      { given: "all three sides", law: "cosines",
        why: "There are no angles yet, so there is nothing for the law of sines to pair with." },
      { given: "two angles and the side between them", law: "sines",
        why: "The third angle comes free from the 180° sum, and then every side pairs with an angle." },
      { given: "one side and the two angles at its ends", law: "sines",
        why: "The third angle is free, and the given side pairs with the angle opposite it." },
      { given: "two sides and an angle opposite one of them", law: "sines",
        why: "A side is paired with its opposite angle — though this is the ambiguous case, so check for a second triangle." },
    ];
    const s = rng.pick(scenarios);
    const right = s.law === "cosines" ? "Law of cosines" : "Law of sines";

    return {
      stem: `You are given ${s.given} of an oblique triangle and asked for a remaining part. Which law starts the problem?`,
      choices: [
        { text: right, why: "" },
        { text: s.law === "cosines" ? "Law of sines" : "Law of cosines",
          why: `Not here. ${s.why}` },
        { text: "The Pythagorean theorem", why: "That needs a right angle. An oblique triangle by definition does not have one." },
        { text: "Neither — the triangle is not determined", why: `It is determined. ${s.why}` },
      ],
      answer: 0,
      steps: [
        `Ask one question: <b>is a known side paired with the angle directly opposite it?</b>`,
        s.why,
        `So: <b>${right}</b>.` +
          (s.given.includes("opposite one of them")
            ? " Then check the ambiguous case — two triangles can satisfy this data, and the exam sometimes wants both."
            : ""),
      ],
    };
  },
});

/* ==========================================================================
   Evaluating with an identity
   ========================================================================== */

defineProblem("identity-eval", {
  topic: "Trigonometric identities",
  lookup: "Mathematics → Trigonometry → Identities (Pythagorean, double angle)",
  make(rng) {
    const [o, a, h] = rng.pick(TRIPLES);
    const s = o / h, c = a / h;
    const mode = rng.pick(["sin2", "cos2", "pyth"]);

    if (mode === "pyth") {
      const known = rng.chance(0.5) ? "sin" : "cos";
      const kv = known === "sin" ? s : c;
      const want = known === "sin" ? c : s;
      return {
        stem:
          `For an acute angle ${T("\\theta")}, ${T(`\\${known}\\theta = ${fixed(kv, 4)}`)}. ` +
          `What is ${T(`\\${known === "sin" ? "cos" : "sin"}\\theta`)}, most nearly?`,
        choices: [
          { text: fixed(want, 3), why: "" },
          { text: fixed(1 - kv, 3), why: `You subtracted without squaring. The identity is ${T("\\sin^2 + \\cos^2 = 1")}, and the squares matter.` },
          { text: fixed(Math.sqrt(1 + kv * kv), 3), why: "Sign error inside the radical — it is 1 minus the square, not 1 plus." },
          { text: fixed(kv, 3), why: "That is the value you were given back again." },
        ],
        answer: 0,
        steps: [
          `<span class="math display" data-tex="\\sin^2\\theta + \\cos^2\\theta = 1"></span>`,
          `<span class="math display" data-tex="\\${known === "sin" ? "cos" : "sin"}\\theta = \\sqrt{1 - (${fixed(kv, 4)})^2} = \\sqrt{1 - ${fixed(kv * kv, 4)}}"></span>`,
          `= <b>${fixed(want, 3)}</b>. The angle is acute, so the positive root is the right one — ` +
            `if it were not, you would have to check the quadrant first.`,
        ],
      };
    }

    const isSin = mode === "sin2";
    const v = isSin ? 2 * s * c : c * c - s * s;
    return {
      stem:
        `An acute angle ${T("\\theta")} has ${T(`\\sin\\theta = ${fixed(s, 3)}`)} and ` +
        `${T(`\\cos\\theta = ${fixed(c, 3)}`)}. What is ${T(`\\${isSin ? "sin" : "cos"} 2\\theta`)}, most nearly?`,
      choices: [
        { text: fixed(v, 3), why: "" },
        { text: fixed(isSin ? 2 * s : 2 * c, 3),
          why: `You doubled the function instead of the angle. ${T("\\sin 2\\theta \\ne 2\\sin\\theta")} — and here that would exceed 1, which is impossible for a sine.` },
        { text: fixed(isSin ? s * c : c * c + s * s, 3),
          why: isSin ? "Dropped the factor of 2 in front." : "That is the Pythagorean identity, which always gives 1. The double-angle cosine has a minus sign." },
        { text: fixed(isSin ? c * c - s * s : 2 * s * c, 3),
          why: `That is ${T(`\\${isSin ? "cos" : "sin"} 2\\theta`)} — the other double-angle formula.` },
      ],
      answer: 0,
      steps: [
        isSin
          ? `<span class="math display" data-tex="\\sin 2\\theta = 2\\sin\\theta\\cos\\theta"></span>`
          : `<span class="math display" data-tex="\\cos 2\\theta = \\cos^2\\theta - \\sin^2\\theta"></span>`,
        isSin
          ? `= 2(${fixed(s, 3)})(${fixed(c, 3)}) = <b>${fixed(v, 3)}</b>`
          : `= (${fixed(c, 3)})² − (${fixed(s, 3)})² = ${fixed(c * c, 4)} − ${fixed(s * s, 4)} = <b>${fixed(v, 3)}</b>`,
        `Sanity check: ${T("\\sin")} and ${T("\\cos")} of anything must stay inside ${T("[-1, 1]")}. ` +
          `Any option outside that range can be struck out before you compute at all.`,
      ],
    };
  },
});

/* --- helpers ---------------------------------------------------------------- */

function ord(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Small rationals read better as fractions than as decimals. */
function dec(v) {
  if (Number.isInteger(v)) return String(v);
  for (let den = 2; den <= 32; den++) {
    const n = v * den;
    if (Math.abs(n - Math.round(n)) < 1e-9 && Math.abs(n) < 10000) {
      return `\\frac{${Math.round(n)}}{${den}}`;
    }
  }
  return sig(v, 4);
}

/* ==========================================================================
   Handbook Reflex items for Part 1
   ========================================================================== */

defineReflex([
  {
    part: "algebra-trig",
    stem: "A surveyor knows two sides of a plot and the angle between them, and wants the third side.",
    tool: "Law of cosines",
    because: "The known angle is between the known sides — nothing pairs, so cosines.",
  },
  {
    part: "algebra-trig",
    stem: "An amplifier's power gain is quoted as 43 dB. What is the numerical gain?",
    tool: "Logarithm identities",
    because: "Decibels are logarithmic; undoing them means raising 10 to a power.",
  },
  {
    part: "algebra-trig",
    stem: "The 3rd and 7th terms of a sequence are given; find the 1st.",
    tool: "Geometric progression formula",
    because: "Terms related by a constant multiplier — count the steps between them.",
  },
  {
    part: "algebra-trig",
    stem: "Given sin θ = 0.28 for an acute angle, find cos θ without a calculator's inverse.",
    tool: "Pythagorean identity",
    because: "sin² + cos² = 1 converts one into the other directly.",
  },
  {
    part: "algebra-trig",
    stem: "For what values of k does x² + kx + 9 = 0 have exactly one real root?",
    tool: "Discriminant",
    because: "One repeated root is exactly the case b² − 4ac = 0.",
  },
  {
    part: "algebra-trig",
    stem: "Instantaneous power in a resistor is v(t)i(t), and both are sinusoids at the same frequency.",
    tool: "Double-angle identity",
    because: "A product of two sinusoids becomes a constant plus a wave at twice the frequency.",
  },
]);
