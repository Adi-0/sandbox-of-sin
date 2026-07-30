/* ==========================================================================
   problems/control.js — generators for Control Systems.

   Part 1 (12.A): feedback, the closed-loop formula, and block-diagram
   reduction. Everything later in this module is this algebra with a
   different question asked of the answer, so the distractors here are
   deliberately the four errors that survive into Parts 2–6: dropping the 1,
   inverting the sign, reducing outermost-first, and adding a cascade.
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed, sig } from "../lib/fmt.js";
import { overshoot, zetaFor } from "../lib/poly.js";

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;
const D = (s) => `<span class="math display" data-tex="${s.replace(/"/g, "&quot;")}"></span>`;

/** Right answer first; duplicates dropped, topped up from `spare`. */
function options(right, wrong, spare = []) {
  const norm = (c) => (typeof c === "string" ? { text: c, why: "" } : c);
  const key = (c) => c.tex ?? c.html ?? String(c.text ?? "");
  const seen = new Set();
  const out = [];
  for (const c of [right, ...wrong, ...spare]) {
    const n = norm(c);
    if (seen.has(key(n))) continue;
    seen.add(key(n));
    out.push(n);
    if (out.length === 4) break;
  }
  return out;
}

/* ==========================================================================
   Part 1 — feedback and block diagrams
   ========================================================================== */

defineProblem("loop-formula", {
  topic: "Closed-loop gain",
  lookup: "Electrical → Control Systems → Closed-loop transfer function",
  make(rng) {
    const mode = rng.pick(["num", "num", "sym", "symH", "pos"]);

    /* --- a plain number, where the trap is dropping the 1 --------------- */
    if (mode === "num") {
      const A = rng.pick([20, 25, 40, 50, 80, 100]);
      const h = rng.pick([0.05, 0.1, 0.2, 0.25]);
      const loop = A * h;
      const cl = A / (1 + loop);
      return {
        stem: `An amplifier of gain ${num(A, 0)} is placed in a <b>negative</b> feedback loop with a feedback fraction of ${num(h, 2)}. What is the closed-loop gain?`,
        choices: options(
          { text: sig(cl, 3), why: "" },
          [
            { text: sig(1 / h, 3), why: `That is ${T("1/H")} — the value the closed-loop gain <em>approaches</em>, but only once the loop gain is large. Here ${T("GH")} is only ${num(loop, 2)}, so the 1 in the denominator still matters.` },
            { text: sig(A / (1 - loop), 3), why: `Sign. A <b>negative</b> summing junction puts a <b>plus</b> in the denominator: ${T("G/(1+GH)")}. The minus form is positive feedback, and at ${T("GH")} above 1 it is not even stable.` },
            { text: sig(loop, 3), why: `That is the loop gain ${T("GH")}, which is an intermediate quantity, not the answer.` },
            { text: sig(A / (1 + h), 3), why: `The feedback fraction was added on its own. The denominator is ${T("1 + GH")} — H multiplies G before anything is added.` },
          ]),
        answer: 0,
        steps: [
          D(`\\frac{C}{R} = \\frac{G}{1 + GH}`),
          `Loop gain first: ${D(`GH = (${num(A, 0)})(${num(h, 2)}) = ${num(loop, 2)}`)}`,
          D(`\\frac{C}{R} = \\frac{${num(A, 0)}}{1 + ${num(loop, 2)}} = ${sig(cl, 4)}`),
          `<b>${sig(cl, 3)}.</b> Compare it with ${T("1/H = " + sig(1 / h, 3))}: the loop gain is only ${num(loop, 2)}, so the two differ by about ${sig(100 / (1 + loop), 2)}%. <b>The 1/H shortcut is an approximation and the exam knows it</b> — check the loop gain before you use it.`,
        ],
      };
    }

    /* --- unity feedback around a first-order plant ---------------------- */
    if (mode === "sym") {
      const K = rng.pick([2, 4, 5, 6, 8, 10, 12]);
      const a = rng.pick([1, 2, 3, 4, 5]);
      return {
        stem: `A unity-feedback system has forward transfer function ${T(`G(s) = \\dfrac{${K}}{s + ${a}}`)}. What is the closed-loop transfer function?`,
        choices: options(
          { tex: `\\dfrac{${K}}{s + ${a + K}}`, why: "" },
          [
            { tex: `\\dfrac{${K}}{s + ${a}}`, why: "That is the forward path on its own. Closing the loop changes the denominator — that is the entire point of closing it." },
            { tex: `\\dfrac{${K}}{s + ${a - K}}`, why: `Sign. Negative feedback <b>adds</b> in the denominator. Note that this pole is at ${T(`s = ${num(K - a, 0)}`)}, in the right half-plane — the wrong sign has turned a stable system unstable, which is how you can catch it.` },
            { tex: `\\dfrac{${K}}{${K + 1}s + ${a}}`, why: "The K was added to the wrong term. Multiply out carefully: the numerator and denominator of G are both multiplied by (s + a), so K lands next to a." },
            { tex: `\\dfrac{s + ${a}}{s + ${a + K}}`, why: "Inverted numerator. The numerator of a closed loop is the <b>forward path only</b>." },
          ]),
        answer: 0,
        steps: [
          D(`\\frac{C}{R} = \\frac{G}{1 + GH}, \\quad H = 1`),
          `Substitute and clear the inner fraction by multiplying top and bottom by ${T(`s + ${a}`)}:`,
          D(`\\frac{\\frac{${K}}{s+${a}}}{1 + \\frac{${K}}{s+${a}}} = \\frac{${K}}{(s + ${a}) + ${K}} = \\frac{${K}}{s + ${a + K}}`),
          `<b>The pole moved from ${T(`-${a}`)} to ${T(`-${a + K}`)}.</b> That is feedback doing something real: the closed-loop system is ${sig((a + K) / a, 3)} times faster than the plant, because ${T("\\tau = 1/|p|")}. Raising K moves it further left, and Part 2 is about tracking where the poles go as you do that.`,
        ],
      };
    }

    /* --- a feedback block that is not 1 --------------------------------- */
    if (mode === "symH") {
      const K = rng.pick([4, 6, 8, 10, 12, 20]);
      const a = rng.pick([1, 2, 4, 5]);
      const h = rng.pick([2, 3, 4, 5]);
      return {
        stem: `A system has ${T(`G(s) = \\dfrac{${K}}{s + ${a}}`)} in the forward path and ${T(`H = ${h}`)} in the negative feedback path. What is ${T("C/R")}?`,
        choices: options(
          { tex: `\\dfrac{${K}}{s + ${a + K * h}}`, why: "" },
          [
            { tex: `\\dfrac{${K * h}}{s + ${a + K * h}}`, why: `H was put into the numerator as well. <b>The numerator is the forward path alone</b> — H appears only in the denominator, because it only ever affects what comes back to the summing junction.` },
            { tex: `\\dfrac{${K}}{s + ${a + K}}`, why: `H was treated as 1. The loop gain here is ${T(`GH = ${K * h}/(s + ${a})`)}, so H multiplies K before it is added.` },
            { tex: `\\dfrac{${K}}{s + ${a - K * h}}`, why: "Sign. A negative summing junction gives 1 + GH." },
            { tex: `\\dfrac{${K}}{${h}s + ${a + K}}`, why: "H was applied to the s term. It multiplies the whole of G, so it lands on K." },
          ]),
        answer: 0,
        steps: [
          D(`\\frac{C}{R} = \\frac{G}{1 + GH} = \\frac{\\frac{${K}}{s+${a}}}{1 + \\frac{${K}}{s+${a}}\\cdot ${h}}`),
          `Multiply top and bottom by ${T(`s + ${a}`)}:`,
          D(`= \\frac{${K}}{(s + ${a}) + ${K * h}} = \\frac{${K}}{s + ${a + K * h}}`),
          `<b>${T(`${K}/(s + ${a + K * h})`)}.</b> Note the DC gain: ${T(`${K}/${a + K * h} = ${sig(K / (a + K * h), 3)}`)}, heading for ${T(`1/H = ${sig(1 / h, 3)}`)} as K grows. The same story as the numeric case, written in s.`,
        ],
      };
    }

    /* --- positive feedback ---------------------------------------------- */
    const A = rng.pick([2, 3, 4, 5]);
    const h = rng.pick([0.1, 0.2, 0.25]);
    const cl = A / (1 - A * h);
    return {
      stem: `A forward gain of ${num(A, 0)} is used with <b>positive</b> feedback of ${num(h, 2)}. What is the closed-loop gain?`,
      choices: options(
        { text: sig(cl, 3), why: "" },
        [
          { text: sig(A / (1 + A * h), 3), why: `That is the <b>negative</b>-feedback answer. Positive feedback subtracts in the denominator, because the sign at the summing junction is opposite to the sign that appears in ${T("1 \\mp GH")}.` },
          { text: sig(1 / h, 3), why: `${T("1/H")} is the large-loop-gain limit of a <em>negative</em> feedback loop. Positive feedback has no such limit — it runs away.` },
          { text: sig(A * h, 3), why: "That is the loop gain." },
          { text: sig(A, 3), why: "That is the forward gain alone, as if the loop were open." },
        ]),
      answer: 0,
      steps: [
        D(`\\frac{C}{R} = \\frac{G}{1 - GH} \\quad\\text{(positive feedback)}`),
        D(`= \\frac{${num(A, 0)}}{1 - ${num(A * h, 2)}} = ${sig(cl, 4)}`),
        `<b>${sig(cl, 3)}</b> — larger than the forward gain, which is the signature of positive feedback. <b>And it is one step from disaster</b>: at ${T("GH = 1")} the denominator is zero and the gain is infinite. That is not an oddity, it is the definition of an oscillator, and Part 4 measures how far a loop is from exactly this condition.`,
      ],
    };
  },
});

defineProblem("block-reduce", {
  topic: "Block diagram reduction",
  lookup: "Electrical → Control Systems → Block diagrams",
  make(rng) {
    const CFG = [
      {
        stem: "Blocks G₁ and G₂ are in <b>cascade</b> in the forward path, with unity negative feedback around the pair.",
        ans: "\\dfrac{G_1G_2}{1 + G_1G_2}",
        wrong: [
          { tex: "\\dfrac{G_1 + G_2}{1 + G_1 + G_2}", why: "Cascade <b>multiplies</b>; only parallel paths add. The two rules are one line apart in the handbook and mixing them up is the commonest reduction error there is." },
          { tex: "\\dfrac{G_1G_2}{1 + G_2}", why: "Only part of the forward path was carried into the loop gain. <b>Reduce the cascade first</b>, then treat the product as a single G." },
          { tex: "\\dfrac{G_1G_2}{1 - G_1G_2}", why: "Sign. A negative summing junction gives a plus in the denominator." },
        ],
      },
      {
        stem: "Forward path G, with two blocks H₁ and H₂ in <b>cascade</b> in the negative feedback path.",
        ans: "\\dfrac{G}{1 + GH_1H_2}",
        wrong: [
          { tex: "\\dfrac{G}{1 + G(H_1 + H_2)}", why: "The feedback blocks are in cascade, so they multiply. They would only add if they were two separate paths back to the summing junction." },
          { tex: "\\dfrac{GH_1H_2}{1 + GH_1H_2}", why: "The feedback blocks were put into the numerator too. <b>The numerator is the forward path alone.</b>" },
          { tex: "\\dfrac{G}{1 + GH_1}", why: "H₂ was dropped. Everything the signal passes through on its way round the loop belongs in the loop gain." },
        ],
      },
      {
        stem: "Two blocks G₁ and G₂ in <b>parallel</b> in the forward path, their outputs added, with unity negative feedback around the pair.",
        ans: "\\dfrac{G_1 + G_2}{1 + G_1 + G_2}",
        wrong: [
          { tex: "\\dfrac{G_1G_2}{1 + G_1G_2}", why: "Parallel paths <b>add</b>. They would multiply only if the signal passed through both in turn." },
          { tex: "\\dfrac{G_1 + G_2}{1 + G_1G_2}", why: "The forward path was combined correctly and then the loop gain was written as a product. <b>The loop gain is GH with the combined G</b>, so it is the same sum." },
          { tex: "\\dfrac{G_1 + G_2}{2 + G_1 + G_2}", why: "Two parallel paths do not make two loops. There is one summing junction and one 1." },
        ],
      },
      {
        stem: "Forward path G with negative feedback H, and the <b>whole loop</b> then followed by a block G₃ in cascade.",
        ans: "\\dfrac{GG_3}{1 + GH}",
        wrong: [
          { tex: "\\dfrac{GG_3}{1 + GG_3H}", why: "G₃ is <em>outside</em> the loop, so it is not part of the loop gain — the signal never passes through it on the way to H. <b>Reduce innermost-first and this cannot happen.</b>" },
          { tex: "\\dfrac{G + G_3}{1 + GH}", why: "Cascade multiplies. A block after the loop scales its output." },
          { tex: "\\dfrac{G}{1 + GH} + G_3", why: "That would be G₃ in parallel with the loop, not after it." },
        ],
      },
    ];
    const c = rng.pick(CFG);
    return {
      stem: `${c.stem} What is the overall transfer function ${T("C/R")}?`,
      choices: options({ tex: c.ans, why: "" }, c.wrong),
      answer: 0,
      steps: [
        `<b>Reduce innermost-first.</b> Collapse every cascade and every parallel pair into a single block, then apply the loop formula once.`,
        D(`\\text{series } \\rightarrow G_1G_2, \\quad \\text{parallel } \\rightarrow G_1 + G_2, \\quad \\text{loop } \\rightarrow \\frac{G}{1 + GH}`),
        `Here that gives ${D(c.ans)}`,
        `<b>Two checks worth thirty seconds each.</b> The numerator must be the forward path from R to C and nothing else. And every block the signal passes through on a complete trip round the loop — and only those — belongs in GH.`,
      ],
    };
  },
});

defineProblem("nested-loop", {
  topic: "Nested loops, numerically",
  lookup: "Electrical → Control Systems → Block diagrams",
  make(rng) {
    const gi = rng.pick([6, 8, 10, 12, 20]);
    const hi = rng.pick([0.25, 0.5, 1]);
    const gc = rng.pick([2, 3, 4, 5]);
    const inner = gi / (1 + gi * hi);
    const fwd = inner * gc;
    const total = fwd / (1 + fwd);
    return {
      stem: `An <b>inner</b> negative feedback loop has forward gain ${num(gi, 0)} and feedback ${num(hi, 2)}. Its output feeds a block of gain ${num(gc, 0)}, and unity negative feedback is applied around the whole thing. What is the overall gain?`,
      choices: options(
        { text: sig(total, 3), why: "" },
        [
          { text: sig(fwd, 3), why: "The inner loop and the cascade were handled correctly, but the outer loop was never closed. <b>Every summing junction in the diagram needs its own application of the formula.</b>" },
          { text: sig(gi * gc / (1 + gi * gc), 3), why: `The inner feedback was ignored and the two forward blocks simply multiplied. Reduce <b>innermost-first</b>: the inner loop is ${sig(inner, 3)}, not ${num(gi, 0)}.` },
          { text: sig(inner, 3), why: "That is the inner loop alone. The cascade block and the outer loop are still to come." },
          { text: sig((inner + gc) / (1 + inner + gc), 3), why: "The cascade block was added rather than multiplied." },
        ]),
      answer: 0,
      steps: [
        `<b>Innermost first.</b> ${D(`\\frac{${num(gi, 0)}}{1 + (${num(gi, 0)})(${num(hi, 2)})} = ${sig(inner, 4)}`)}`,
        `Now it is a single block. Cascade with the next one — <b>multiply</b>: ${D(`(${sig(inner, 4)})(${num(gc, 0)}) = ${sig(fwd, 4)}`)}`,
        `Close the outer unity loop: ${D(`\\frac{${sig(fwd, 4)}}{1 + ${sig(fwd, 4)}} = ${sig(total, 4)}`)}`,
        `<b>${sig(total, 3)}.</b> Three lines, no algebra, and it works on any diagram this exam can print. Notice where it ends up: the outer loop is unity feedback, so the answer is pinned just below 1 <em>no matter what the inner gains were</em> — which is the desensitising of plate 89 arriving as arithmetic.`,
      ],
    };
  },
});

defineProblem("feedback-sens", {
  topic: "What feedback buys",
  lookup: "Electrical → Control Systems → Feedback / sensitivity",
  make(rng) {
    const ask = rng.pick(["drop", "drop", "need"]);
    const A = rng.pick([20, 30, 40, 60, 80]);
    const h = rng.pick([0.1, 0.2, 0.25]);
    const loop = A * h;
    const tol = rng.pick([20, 30, 40, 50]);

    if (ask === "drop") {
      const out = tol / (1 + loop);
      return {
        stem: `An amplifier's gain is ${num(A, 0)}, but unit to unit it varies by ±${num(tol, 0)}%. It is used with negative feedback of ${num(h, 2)}. Roughly how much does the <b>closed-loop</b> gain vary?`,
        choices: options(
          { text: `±${sig(out, 3)}%`, why: "" },
          [
            { text: `±${sig(tol / loop, 3)}%`, why: `Divided by the loop gain ${T("GH")} instead of ${T("1 + GH")}. The sensitivity factor is <b>1 + GH</b> — the same denominator as the gain formula, which is not a coincidence.` },
            { text: `±${num(tol, 0)}%`, why: "Unchanged. Feedback exists precisely to stop this: the closed-loop gain is set by H, and a spread in G is divided down." },
            { text: `±${sig(tol * (1 + loop), 3)}%`, why: "Multiplied instead of divided. Feedback reduces the spread." },
            { text: `±${sig(tol * h, 3)}%`, why: `Scaled by H rather than by ${T("1 + GH")}.` },
          ]),
        answer: 0,
        steps: [
          `The closed-loop gain is ${T("G/(1+GH)")}, and differentiating it gives the sensitivity result worth memorising as a sentence:`,
          D(`\\frac{\\Delta A_f}{A_f} = \\frac{1}{1 + GH}\\cdot\\frac{\\Delta G}{G}`),
          `Loop gain: ${T(`GH = (${num(A, 0)})(${num(h, 2)}) = ${num(loop, 2)}`)}, so the divisor is ${num(1 + loop, 2)}.`,
          D(`\\frac{\\pm ${num(tol, 0)}\\%}{${num(1 + loop, 2)}} = \\pm ${sig(out, 3)}\\%`),
          `<b>A spread of ±${num(tol, 0)}% becomes ±${sig(out, 3)}%.</b> Nothing about the amplifier improved — the loop simply gave away ${sig(loop, 2)} parts of gain in exchange, which is the trade every feedback system makes.`,
        ],
      };
    }

    const want = rng.pick([0.5, 1, 2]);
    const need = tol / want - 1;
    return {
      stem: `An amplifier's gain varies by ±${num(tol, 0)}% between units. Negative feedback must hold the closed-loop variation to ±${num(want, 1)}%. What is the smallest loop gain ${T("GH")} that will do it?`,
      choices: options(
        { text: sig(need, 3), why: "" },
        [
          { text: sig(tol / want, 3), why: `That is ${T("1 + GH")}, the sensitivity factor — one more than the loop gain. The question asked for ${T("GH")} itself.` },
          { text: sig(want / tol, 3), why: "Upside down. A tighter requirement needs <b>more</b> loop gain, not less." },
          { text: sig(tol - want, 3), why: "The percentages were subtracted. The relationship is a ratio, not a difference." },
          { text: sig(need / 2, 3), why: "Half the required loop gain, which would leave the variation at twice the specification." },
        ]),
      answer: 0,
      steps: [
        D(`\\frac{\\Delta A_f}{A_f} = \\frac{1}{1 + GH}\\cdot\\frac{\\Delta G}{G}`),
        `Set the required ratio: ${D(`1 + GH = \\frac{${num(tol, 0)}\\%}{${num(want, 1)}\\%} = ${sig(tol / want, 4)}`)}`,
        `${D(`GH = ${sig(tol / want, 4)} - 1 = ${sig(need, 4)}`)}`,
        `<b>${sig(need, 3)}.</b> And read what it costs: the forward gain has to be about ${sig(need, 2)}/H larger than the gain you keep. <b>Feedback does not create precision, it buys it with gain</b>, and the exchange rate is 1 + GH.`,
      ],
    };
  },
});

/* ==========================================================================
   Part 2 — the closed loop
   ========================================================================== */

defineProblem("cl-poles", {
  topic: "Closed-loop poles",
  lookup: "Electrical → Control Systems → Closed-loop response",
  make(rng) {
    const a = rng.pick([4, 6, 8, 10]);
    const ask = rng.pick(["poles", "poles", "chareq"]);
    /* Keep the pair complex and the numbers clean. */
    const wd = rng.pick([2, 3, 4, 5, 6]);
    const K = (a / 2) ** 2 + wd * wd;
    const sigma = a / 2;

    if (ask === "chareq") {
      return {
        stem: `A unity-feedback system has ${T(`G(s) = \\dfrac{K}{s(s + ${a})}`)}. What is the <b>closed-loop characteristic equation</b>?`,
        choices: options(
          { tex: `s^2 + ${a}s + K = 0`, why: "" },
          [
            { tex: `s^2 + ${a}s = 0`, why: "That is the <em>open-loop</em> denominator — the poles before the loop is closed. Closing it adds K to the constant term, and that is the only thing that changes." },
            { tex: `s^2 + ${a}s + K = 1`, why: `The condition is ${T("1 + G(s)H(s) = 0")}, so everything goes to the left-hand side and the right-hand side is zero.` },
            { tex: `s^2 + (${a} + K)s = 0`, why: "K landed on the wrong term. The numerator of G is a constant, so K adds to the constant term of the denominator." },
            { tex: `Ks^2 + ${a}s + 1 = 0`, why: "Reversed. K multiplies the numerator of G, which is 1." },
          ]),
        answer: 0,
        steps: [
          `<b>The closed-loop poles are the roots of ${T("1 + G(s)H(s) = 0")}</b> — always, whatever the loop looks like.`,
          D(`1 + \\frac{K}{s(s+${a})} = 0`),
          `Multiply through by ${T(`s(s+${a})`)}:`,
          D(`s(s + ${a}) + K = s^2 + ${a}s + K = 0`),
          `<b>The denominator of the closed loop is the denominator of the open loop plus K times its numerator</b> — D + KN. That single sentence is the root locus, Routh–Hurwitz and every gain-design question in this module.`,
        ],
      };
    }

    return {
      stem: `A unity-feedback system has ${T(`G(s) = \\dfrac{K}{s(s + ${a})}`)} with ${T(`K = ${num(K, 0)}`)}. Where are the closed-loop poles?`,
      choices: options(
        { text: `−${num(sigma, 2)} ± ${num(wd, 2)}j`, why: "" },
        [
          { text: `0 and −${num(a, 0)}`, why: "Those are the <b>open-loop</b> poles, where the locus starts at K = 0. Closing the loop is what moves them." },
          { text: `−${num(a, 0)} ± ${num(wd, 2)}j`, why: `The real part is <b>a/2</b>, not a: completing the square on ${T(`s^2 + ${a}s`)} gives ${T(`(s + ${a}/2)^2`)}.` },
          { text: `± ${num(Math.sqrt(K), 3)}j`, why: `That is the answer for ${T("s^2 + K = 0")} — the undamped case. The ${T(`${a}s`)} term is the damping and it supplies the real part.` },
          { text: `−${num(sigma, 2)} ± ${num(Math.sqrt(K), 3)}j`, why: `The imaginary part is ${T("\\omega_d = \\omega_n\\sqrt{1-\\zeta^2}")}, not ${T("\\omega_n")}. Here ${T(`\\sqrt{K} = ${num(Math.sqrt(K), 3)}`)} is the distance from the origin, not the height.` },
        ]),
      answer: 0,
      steps: [
        `Characteristic equation: ${D(`s(s + ${a}) + K = s^2 + ${a}s + ${num(K, 0)} = 0`)}`,
        `Complete the square, which is faster than the formula and shows what the two numbers mean:`,
        D(`\\left(s + ${num(sigma, 1)}\\right)^2 = ${num(sigma * sigma, 2)} - ${num(K, 0)} = -${num(wd * wd, 0)}`),
        `${D(`s = -${num(sigma, 2)} \\pm ${num(wd, 2)}j`)}`,
        `<b>The real part is fixed at −${num(sigma, 2)} — half the coefficient of s — no matter what K is.</b> Only the imaginary part depends on the gain, which is why the locus of this plant is a vertical line and why turning K up changes the ringing but never the settling time.`,
      ],
    };
  },
});

defineProblem("locus-read", {
  topic: "Reading a root locus",
  lookup: "Electrical → Control Systems → Root locus",
  make(rng) {
    const SYS = [
      { tex: "\\dfrac{K}{s(s+4)}", p: [0, -4], z: [] },
      { tex: "\\dfrac{K}{s(s+2)(s+6)}", p: [0, -2, -6], z: [] },
      { tex: "\\dfrac{K(s+3)}{s(s+1)(s+5)}", p: [0, -1, -5], z: [-3] },
      { tex: "\\dfrac{K}{(s+1)(s+2)(s+4)(s+8)}", p: [-1, -2, -4, -8], z: [] },
    ];
    const s = rng.pick(SYS);
    const n = s.p.length, m = s.z.length, d = n - m;
    const sumP = s.p.reduce((a, b) => a + b, 0), sumZ = s.z.reduce((a, b) => a + b, 0);
    const centroid = (sumP - sumZ) / d;
    const angleList = (k) => {
      const out = [];
      for (let q = 0; q < k; q++) out.push(((2 * q + 1) * 180) / k);
      return out.map((v) => `${num(v, 0)}°`).join(", ");
    };
    const ask = rng.pick(["count", "inf", "angles", "centroid"]);

    if (ask === "count") {
      return {
        stem: `For ${T(s.tex)} with unity feedback, how many branches does the root locus have, and where do they begin?`,
        choices: options(
          { text: `${n}, starting at the open-loop poles`, why: "" },
          [
            { text: `${n}, starting at the open-loop zeros`, why: "Backwards. At K = 0 the closed-loop characteristic equation D + KN reduces to D = 0, so the branches <b>start</b> at the poles. They <em>end</em> at the zeros." },
            { text: `${n - 1}, starting at the open-loop poles`, why: "One branch per open-loop pole — count them again, including the pole at the origin if the plant has one." },
            { text: `${d}, starting at the open-loop poles`, why: `${d} is how many branches run off to infinity, not how many there are. Every pole gets a branch.` },
          ],
          [{ text: `${n + 1}, starting at the open-loop poles`, why: "One too many. The count is the order of the closed-loop characteristic polynomial, which equals the number of open-loop poles." }]),
        answer: 0,
        steps: [
          `The branches are the closed-loop poles, so there are as many as the <b>order of D(s) + K·N(s)</b> — and that order is the number of open-loop poles, ${n}.`,
          `At <b>K = 0</b> the equation is D(s) = 0, so each branch starts at an open-loop pole. As <b>K → ∞</b> it becomes N(s) = 0, so ${m || "no"} branch${m === 1 ? "" : "es"} end${m === 1 ? "s" : ""} at a finite zero and the remaining ${d} run off to infinity.`,
          `<b>${n} branches, beginning at the open-loop poles.</b> Two sentences — start at the poles, end at the zeros — answer most locus questions on their own.`,
        ],
      };
    }

    if (ask === "inf") {
      return {
        stem: `For ${T(s.tex)} with unity feedback, how many branches of the root locus go to infinity?`,
        choices: options(
          { text: `${d}`, why: "" },
          [
            { text: `${n}`, why: `That is every branch. ${m ? `The ${m} finite zero${m === 1 ? "" : "s"} absorb${m === 1 ? "s" : ""} that many branches; only the rest escape.` : "With no finite zeros all of them do escape — but check the numerator before assuming it."}` },
            { text: `${m}`, why: "That is the number of finite zeros — the branches that <em>do not</em> go to infinity." },
            { text: `${d + 1}`, why: `Off by one. It is n − m exactly: ${n} poles minus ${m} zeros.` },
          ], [{ text: "1, always", why: "Only when n − m = 1." }]),
        answer: 0,
        steps: [
          `<b>n − m</b>, where n is the number of open-loop poles and m the number of finite zeros.`,
          `Here n = ${n} and m = ${m}, so ${D(`n - m = ${d}`)}`,
          `<b>${d}.</b> Every branch has to end somewhere: ${m} at ${m === 1 ? "the finite zero" : m ? "the finite zeros" : "no finite zero"}, and the other ${d} at a zero out at infinity. That count sets the asymptote angles, so it is the first number to write down on any locus question.`,
        ],
      };
    }

    if (ask === "angles") {
      const right = angleList(d);
      return {
        stem: `For ${T(s.tex)} with unity feedback, what are the asymptote angles of the root locus?`,
        choices: options(
          { text: right, why: "" },
          [
            { text: angleList(n), why: `The angles are ${T("(2q+1)180^\\circ/(n-m)")}, and the divisor is <b>n − m = ${d}</b>, not n = ${n}. Only the branches heading to infinity have asymptotes.` },
            { text: Array.from({ length: d }, (_, q) => `${num((q * 360) / d, 0)}°`).join(", "), why: `That is ${T("q\\cdot 360^\\circ/(n-m)")} — it starts at 0°, along the positive real axis. <b>The numerator is the odd multiple (2q+1)</b>, which is what puts the first asymptote off the axis.` },
            { text: Array.from({ length: d }, (_, q) => `${num(((2 * q + 1) * 90) / d, 0)}°`).join(", "), why: "90° instead of 180° in the numerator. The rule comes from the angle condition, which requires an odd multiple of 180°." },
          ]),
        answer: 0,
        steps: [
          D(`\\theta_q = \\frac{(2q + 1)180^\\circ}{n - m}, \\quad q = 0, 1, \\ldots, n-m-1`),
          `Here ${T(`n - m = ${n} - ${m} = ${d}`)}, so there are ${d} asymptotes.`,
          `${D(`\\theta = ${right.replace(/°/g, "^\\circ")}`)}`,
          `<b>${right}.</b> Sanity check the shape: they are always symmetric about the real axis, evenly spaced, and never include 0° — <b>a locus branch heading straight out along the positive real axis would mean an unstable system at every gain</b>, which no minimum-phase plant does.`,
        ],
      };
    }

    return {
      stem: `For ${T(s.tex)} with unity feedback, where do the asymptotes of the root locus meet the real axis?`,
      choices: options(
        { text: `σ = ${num(centroid, 3)}`, why: "" },
        [
          { text: `σ = ${num((sumP + sumZ) / d, 3)}`, why: `The zeros are <b>subtracted</b>: ${T("\\sigma_a = (\\sum p - \\sum z)/(n - m)")}. A zero pulls the centroid to the right, which is the geometric version of a zero improving stability.` },
          { text: `σ = ${num(sumP / n, 3)}`, why: `Divided by n rather than n − m. Only the ${d} escaping branches have asymptotes, so only they share the centroid.` },
          { text: `σ = ${num(-centroid, 3)}`, why: "Sign. The poles are in the left half-plane, so their sum is negative and the centroid must be too." },
        ], [{ text: `σ = ${num(sumP - sumZ, 3)}`, why: "The division by n − m was left out." }]),
      answer: 0,
      steps: [
        D(`\\sigma_a = \\frac{\\sum \\text{poles} - \\sum \\text{zeros}}{n - m}`),
        `${D(`\\sigma_a = \\frac{(${s.p.map((v) => num(v, 0)).join(") + (")})${m ? ` - (${s.z.map((v) => num(v, 0)).join(") - (")})` : ""}}{${d}} = \\frac{${num(sumP - sumZ, 2)}}{${d}} = ${num(centroid, 3)}`)}`,
        `<b>σ = ${num(centroid, 3)}.</b> The centroid is a centre of mass: poles push it left, zeros pull it right. <b>That is the whole reason adding a zero stabilises a loop</b> — it drags the asymptotes away from the imaginary axis, and Part 6's compensators are built on it.`,
      ],
    };
  },
});

defineProblem("pole-perform", {
  topic: "Performance from pole positions",
  lookup: "Electrical → Control Systems → Controller performance",
  make(rng) {
    /* Curated pairs, so ζ always lands somewhere an exam would put it. */
    const [sigma, wd] = rng.pick([
      [1, 2], [2, 3], [3, 4], [2, 2], [4, 3], [2, 4], [1, 1], [5, 5], [4, 8], [2.5, 6],
    ]);
    const wn = Math.hypot(sigma, wd);
    const zeta = sigma / wn;
    const ask = rng.pick(["ts", "os", "dominance"]);

    if (ask === "dominance") {
      const far = rng.pick([1.5, 2, 6, 10]);
      const third = sigma * far;
      const ok = far >= 5;
      return {
        stem: `A closed-loop system has poles at ${T(`-${num(sigma, 2)} \\pm ${num(wd, 2)}j`)} and ${T(`-${num(third, 2)}`)}. Is the second-order estimate of overshoot and settling time trustworthy?`,
        choices: options(
          ok
            ? { text: "Yes — the real pole is far enough left to ignore", why: "" }
            : { text: "No — the third pole is too close to the pair", why: "" },
          ok
            ? [
                { text: "No — three poles are never second-order", why: `Order is not the test. <b>Distance is.</b> The real pole here is ${num(far, 1)} times further from the axis, so its exponential has decayed to nothing before the ringing has begun to settle.` },
                { text: `No — ${num(third, 2)} is larger than ${num(sigma, 2)}`, why: "Being further left is exactly what makes it <em>negligible</em>. A pole at −20 decays twenty times faster than one at −1." },
                { text: "Only if the third pole is complex", why: "Nothing to do with it. The test is how far left it sits compared with the dominant pair." },
              ]
            : [
                { text: "Yes — a real pole never causes overshoot", why: `It does not add overshoot, but it <b>slows the response</b>, and at only ${num(far, 1)}× the distance its exponential is still alive while the pair is ringing. The estimate will be optimistic on settling time.` },
                { text: "Yes — the complex pair always dominates", why: "Only when it is <em>closest to the imaginary axis by a good margin</em>. Dominance is a distance ratio, not a rank." },
                { text: "Only the ζ estimate is affected", why: "Both are. An extra lag stretches the settling time and shaves the overshoot — the second-order numbers are wrong in both directions." },
              ]),
        answer: 0,
        steps: [
          `<b>The rule of thumb: a real pole may be ignored if it is at least five times further left than the dominant pair's real part.</b>`,
          `Here the pair sits at σ = ${num(sigma, 2)} and the real pole at ${num(third, 2)}, a ratio of ${D(`\\frac{${num(third, 2)}}{${num(sigma, 2)}} = ${num(far, 1)}`)}`,
          ok
            ? `${num(far, 1)} ≥ 5, so <b>yes</b> — treat it as second-order, use ζ and ωn from the pair, and the estimate will be good to a few per cent.`
            : `${num(far, 1)} < 5, so <b>no</b>. The extra pole is still contributing when the pair is ringing: expect the real settling time to be <em>longer</em> and the real overshoot <em>smaller</em> than the two-pole formulas predict.`,
          `<b>Why this matters more than it looks.</b> Every performance formula in this module — %OS, tp, ts — is derived for exactly two poles. The dominance check is what licenses you to use them, and an exam question that hands you three poles is usually testing whether you checked.`,
        ],
      };
    }

    if (ask === "ts") {
      const ts = 4 / sigma;
      return {
        stem: `The dominant closed-loop poles of a system are at ${T(`-${num(sigma, 2)} \\pm ${num(wd, 2)}j`)}. What is the 2% settling time?`,
        choices: options(
          { text: `${sig(ts, 3)} s`, why: "" },
          [
            { text: `${sig(4 / wn, 3)} s`, why: `That used ωn = ${sig(wn, 3)}. <b>Settling depends only on the real part</b> — the envelope is ${T("e^{-\\sigma t}")}, and the imaginary part only decides how many times it rings on the way down.` },
            { text: `${sig(4 / wd, 3)} s`, why: "That used the imaginary part. The oscillation frequency has nothing to do with how fast the amplitude dies." },
            { text: `${sig(ts / 2, 3)} s`, why: `Half. The 2% criterion uses 4 time constants; 2 would be the ${T("e^{-2} = 13.5\\%")} point, which is not a standard.` },
            { text: `${sig(3 / sigma, 3)} s`, why: "That is the 5% settling time. Both appear in the handbook — check which criterion the stem asked for." },
          ]),
        answer: 0,
        steps: [
          D(`t_s \\approx \\frac{4}{\\zeta\\omega_n} = \\frac{4}{\\sigma}`),
          `<b>ζωn <em>is</em> the real part of the pole</b>, so the settling time can be read straight off the s-plane without computing ζ or ωn at all:`,
          D(`t_s = \\frac{4}{${num(sigma, 2)}} = ${sig(ts, 3)}\\text{ s}`),
          `<b>${sig(ts, 3)} s.</b> This is the most useful shortcut in the module: <b>a vertical line in the s-plane is a settling time</b>, which is why a specification on settling turns into a boundary you can draw.`,
        ],
      };
    }

    const os = overshoot(zeta);
    return {
      stem: `A second-order closed loop has poles at ${T(`-${num(sigma, 2)} \\pm ${num(wd, 2)}j`)}. What is the percent overshoot of its step response?`,
      choices: options(
        { text: `${sig(os, 3)}%`, why: "" },
        [
          { text: `${sig(overshoot(wd / wn), 3)}%`, why: `ζ is <b>the real part over the radius</b>, ${T(`${num(sigma, 2)}/${sig(wn, 3)} = ${sig(zeta, 3)}`)}. Using the imaginary part instead gives the sine of the angle, not the cosine.` },
          { text: `${sig(100 * zeta, 3)}%`, why: "ζ is not a percentage of anything. The overshoot is an exponential in ζ, and the relationship is strongly non-linear — ζ = 0.5 gives 16%, ζ = 0.7 gives 4.6%." },
          { text: `${sig(overshoot(Math.max(0.05, zeta - 0.15)), 3)}%`, why: "Close, but check ζ: it comes from the ratio of the real part to the distance from the origin, and small errors in ζ move the overshoot a lot." },
          { text: "0%", why: "The poles are complex, so the response oscillates and must overshoot. Only real poles give no overshoot." },
        ]),
      answer: 0,
      steps: [
        `${D(`\\omega_n = \\sqrt{${num(sigma, 2)}^2 + ${num(wd, 2)}^2} = ${sig(wn, 4)}, \\quad \\zeta = \\frac{${num(sigma, 2)}}{${sig(wn, 4)}} = ${sig(zeta, 3)}`)}`,
        `<b>ζ is the cosine of the angle from the negative real axis</b> — which is why a constant-ζ line in the s-plane is a straight ray, and why an overshoot specification is a wedge.`,
        `${D(`\\%OS = 100\\,e^{-\\pi\\zeta/\\sqrt{1-\\zeta^2}} = ${sig(os, 3)}\\%`)}`,
        `<b>${sig(os, 3)}%.</b> Worth carrying three anchors instead of the formula: <b>ζ = 0.5 → 16%, 0.6 → 9.5%, 0.707 → 4.3%</b>. Most exam questions land near one of them and the arithmetic can be skipped.`,
      ],
    };
  },
});

defineProblem("gain-design", {
  topic: "Choosing the gain",
  lookup: "Electrical → Control Systems → Closed-loop response",
  make(rng) {
    const a = rng.pick([2, 4, 6, 8, 10]);
    const mode = rng.pick(["zeta", "zeta", "crit", "os"]);
    const z = mode === "crit" ? 1 : rng.pick([0.5, 0.6, 0.707]);
    const zeta = mode === "os" ? zetaFor(rng.pick([5, 10, 16])) : z;
    const K = (a * a) / (4 * zeta * zeta);
    const osTarget = Math.round(overshoot(zeta));

    const stem = mode === "crit"
      ? `A unity-feedback system has ${T(`G(s) = \\dfrac{K}{s(s + ${a})}`)}. What gain makes it <b>critically damped</b>?`
      : mode === "os"
        ? `A unity-feedback system has ${T(`G(s) = \\dfrac{K}{s(s + ${a})}`)}. What gain gives about <b>${num(osTarget, 0)}% overshoot</b>?`
        : `A unity-feedback system has ${T(`G(s) = \\dfrac{K}{s(s + ${a})}`)}. What gain gives a damping ratio of <b>${num(zeta, 3)}</b>?`;

    return {
      stem,
      choices: options(
        { text: sig(K, 3), why: "" },
        [
          { text: sig((a * a) / (4 * zeta), 3), why: `ζ is <b>squared</b> in the denominator. From ${T("\\zeta = a/(2\\sqrt{K})")}, squaring both sides gives ${T("\\zeta^2 = a^2/(4K)")}.` },
          { text: sig(a / (2 * zeta), 3), why: `That is ${T("\\omega_n")}, not K. The gain is ${T("\\omega_n^2")} for this plant — one more squaring step.` },
          { text: sig((a * a * zeta * zeta) / 4, 3), why: "ζ² ended up on the wrong side. More damping means <em>less</em> gain here, so K must fall as ζ rises." },
        ],
        [
          { text: sig((a * a) / (2 * zeta * zeta), 3), why: "Check the factor of 4 — it comes from squaring the 2 in 2ζωn = a." },
          { text: sig(a * a, 3), why: "The 4 was dropped entirely. Square the whole of 2√K, not just the root." },
        ]),
      answer: 0,
      steps: [
        `Characteristic equation: ${D(`s^2 + ${a}s + K = 0`)}`,
        `Match it to the standard form ${T("s^2 + 2\\zeta\\omega_n s + \\omega_n^2")}: ${D(`\\omega_n = \\sqrt{K}, \\qquad 2\\zeta\\omega_n = ${a}`)}`,
        `${D(`\\zeta = \\frac{${a}}{2\\sqrt{K}} \\quad\\Rightarrow\\quad K = \\frac{${a}^2}{4\\zeta^2} = \\frac{${num(a * a, 0)}}{4(${sig(zeta, 3)})^2} = ${sig(K, 4)}`)}`,
        mode === "crit"
          ? `<b>K = ${sig(K, 3)}.</b> That is the breakaway point on the locus — above it the poles leave the real axis and the system starts to ring, below it there are two real poles and it crawls. <b>Critical damping is a single value of gain</b>, not a range.`
          : `<b>K = ${sig(K, 3)}</b>, giving ${sig(overshoot(zeta), 2)}% overshoot and poles at −${num(a / 2, 2)} ± ${sig(Math.sqrt(Math.max(0, K - (a / 2) ** 2)), 3)}j. <b>Notice what did not change</b>: the real part is ${num(a / 2, 2)} at every gain above ${num(a * a / 4, 0)}, so the settling time is fixed by the plant and the only thing this choice bought was the overshoot.`,
      ],
    };
  },
});

/* ==========================================================================
   Part 3 — stability
   ========================================================================== */

defineProblem("stability-quick", {
  topic: "Ruling it out by inspection",
  lookup: "Electrical → Control Systems → Routh–Hurwitz criterion",
  make(rng) {
    const CASES = [
      { tex: "s^3 + 4s^2 - 3s + 6", kind: "neg" },
      { tex: "s^4 + 2s^3 + 5s^2 - s + 3", kind: "neg" },
      { tex: "s^3 + 2s^2 + 7", kind: "gap" },
      { tex: "s^4 + 3s^3 + 2s + 8", kind: "gap" },
      { tex: "s^3 + 6s^2 + 11s + 6", kind: "ok" },
      { tex: "s^4 + 2s^3 + 3s^2 + 4s + 5", kind: "ok" },
    ];
    const c = rng.pick(CASES);
    const right =
      c.kind === "neg" ? "Unstable — a coefficient is negative"
        : c.kind === "gap" ? "Unstable — a coefficient is missing"
          : "Nothing yet — build the array";
    return {
      stem: `A closed-loop characteristic polynomial is ${T(c.tex)}. What can you conclude <b>without building the Routh array</b>?`,
      choices: options(
        { text: right, why: "" },
        c.kind === "ok"
          ? [
              { text: "Stable — all the coefficients are positive", why: "<b>All-positive is necessary, not sufficient.</b> Above second order the coefficients can all be positive and roots still sit in the right half-plane — which is exactly why Routh exists. It <em>is</em> sufficient for first and second order." },
              { text: "Unstable — a coefficient is missing", why: "Every power from the leading term down to the constant is present here. Check again before reaching for the array — but in this case the array really is needed." },
              { text: "Stable — the leading coefficient is positive", why: "The leading coefficient tells you nothing; you can always multiply the whole polynomial by −1. <b>What matters is that all the coefficients share a sign and none is missing.</b>" },
            ]
          : [
              { text: "Nothing yet — build the array", why: "You can stop earlier than that. <b>Any missing or negative coefficient is a guarantee of instability</b>, no arithmetic required — it is the cheapest check in the subject." },
              { text: c.kind === "neg" ? "Unstable — a coefficient is missing" : "Unstable — a coefficient is negative", why: "The right verdict for the wrong reason, which on a multiple-choice paper is still the wrong answer. <b>Read the polynomial again</b>: one of those two faults is present and the other is not." },
              { text: "Unstable — the order is too high", why: "Order has nothing to do with stability. A tenth-order system can be perfectly stable." },
            ]),
      answer: 0,
      steps: [
        `<b>The necessary condition, and it costs nothing:</b> for every root to be in the left half-plane, all the coefficients must be present and all must have the same sign.`,
        `Why: a polynomial with only left-half-plane roots factors into terms like ${T("(s + a)")} and ${T("(s^2 + bs + c)")} with a, b, c all positive. <b>Multiplying those out can never produce a negative or a zero coefficient</b> — there is nothing to cancel with.`,
        c.kind === "ok"
          ? `Here every coefficient is present and positive, so <b>the test is passed and tells you nothing</b>. The system may or may not be stable, and the array is the only way to find out.`
          : c.kind === "neg"
            ? `Here one coefficient is negative, so <b>at least one root is in the right half-plane</b>. Stop — the array would confirm it and waste a minute.`
            : `Here a power is missing, which is a coefficient of zero, so <b>at least one root is not in the left half-plane</b>. Stop.`,
        `<b>Do this check first, every time.</b> On the exam it turns a two-minute problem into a five-second one often enough to be worth the habit.`,
      ],
    };
  },
});

defineProblem("routh-count", {
  topic: "Counting right-half-plane roots",
  lookup: "Electrical → Control Systems → Routh–Hurwitz criterion",
  make(rng) {
    /* s³ + as² + bs + c, with c chosen either side of the boundary ab. */
    const a = rng.pick([2, 3, 4, 5, 6]);
    const b = rng.pick([3, 4, 6, 8, 10]);
    const crit = a * b;
    const stable = rng.pick([true, false]);
    const c = stable
      ? Math.max(1, Math.round(crit * rng.pick([0.25, 0.4, 0.6])))
      : Math.round(crit * rng.pick([1.5, 2, 3]));
    const s1 = (a * b - c) / a;
    const nRhp = stable ? 0 : 2;
    return {
      stem: `How many roots of ${T(`s^3 + ${a}s^2 + ${b}s + ${c}`)} lie in the right half-plane?`,
      choices: options(
        { text: num(nRhp, 0), why: "" },
        [
          { text: num(stable ? 2 : 0, 0), why: stable
              ? `Check the sign of the s¹ entry: ${T(`(${a}\\cdot${b} - ${c})/${a} = ${sig(s1, 3)}`)}, which is positive. <b>The first column never changes sign, so no roots are in the right half-plane.</b>`
              : `The s¹ entry is ${T(`(${a}\\cdot${b} - ${c})/${a} = ${sig(s1, 3)}`)} — negative. <b>Two sign changes, so two roots.</b> All the coefficients being positive was not enough.` },
          { text: "1", why: "Complex roots come in conjugate pairs, so for a real polynomial the count of right-half-plane roots is even unless a <em>real</em> root has crossed. Here the crossing is a complex pair, so the answer is 0 or 2." },
          { text: "3", why: "That would need every root in the right half-plane, which requires the coefficients to change sign — they do not." },
        ]),
      answer: 0,
      steps: [
        `Coefficients are all present and positive, so the cheap test is inconclusive. Build the array:`,
        D(`\\begin{matrix} s^3 & 1 & ${b} \\\\ s^2 & ${a} & ${c} \\\\ s^1 & \\frac{(${a})(${b}) - (1)(${c})}{${a}} = ${sig(s1, 3)} & 0 \\\\ s^0 & ${c} & 0 \\end{matrix}`),
        `First column: ${T(`1, \\ ${a}, \\ ${sig(s1, 3)}, \\ ${c}`)} — ${stable ? "all positive, <b>no sign changes</b>." : "one negative entry, so the signs go <b>+ + − +</b>: <b>two changes</b>."}`,
        stable
          ? `<b>0 roots in the right half-plane; the system is stable.</b> The boundary for this polynomial is ${T(`c = ab = ${num(crit, 0)}`)}, and ${num(c, 0)} is comfortably below it.`
          : `<b>2 roots in the right half-plane.</b> The boundary is ${T(`c = ab = ${num(crit, 0)}`)} and ${num(c, 0)} is past it — so a complex pair has crossed the imaginary axis, which is why the count is two rather than one.`,
        `<b>For a cubic ${T("s^3 + as^2 + bs + c")} the whole test is ${T("0 < c < ab")}.</b> Worth carrying: cubics are the commonest case on the exam, and this collapses the array to one multiplication.`,
      ],
    };
  },
});

defineProblem("routh-range", {
  topic: "The range of gain for stability",
  lookup: "Electrical → Control Systems → Routh–Hurwitz criterion",
  make(rng) {
    const a = rng.pick([2, 4, 5, 6, 10]);
    const b = rng.pick([3, 6, 8, 12, 16]);
    const crit = a * b;
    return {
      stem: `A unity-feedback system has ${T(`G(s) = \\dfrac{K}{s(s^2 + ${a}s + ${b})}`)}. For what range of K is the closed loop stable?`,
      choices: options(
        { text: `0 < K < ${num(crit, 0)}`, why: "" },
        [
          { text: `K > ${num(crit, 0)}`, why: `Backwards. The s¹ entry is ${T(`(${a}\\cdot${b} - K)/${a}`)}, which goes <b>negative</b> as K grows — so large gain is the unstable side, not the stable one.` },
          { text: `0 < K < ${num(a + b, 0)}`, why: "The coefficients were added. The boundary comes from the cross-multiplication in the array, which is a product." },
          { text: `0 < K < ${num(crit / a, 0)}`, why: `That is b, the boundary divided by a. The s¹ entry ${T(`(${a}\\cdot${b} - K)/${a}`)} changes sign when its <b>numerator</b> does, so the division by a never affects the answer.` },
          { text: `K > 0`, why: "The lower bound is right and there is an upper one too. Every extra pole adds phase lag, and a third-order loop always has a gain at which it oscillates." },
        ]),
      answer: 0,
      steps: [
        `Characteristic equation: ${D(`s(s^2 + ${a}s + ${b}) + K = s^3 + ${a}s^2 + ${b}s + K = 0`)}`,
        `The array:`,
        D(`\\begin{matrix} s^3 & 1 & ${b} \\\\ s^2 & ${a} & K \\\\ s^1 & \\frac{(${a})(${b}) - K}{${a}} & 0 \\\\ s^0 & K & 0 \\end{matrix}`),
        `Both of the last two entries must be positive: ${T(`K > 0`)} from the bottom row, and ${T(`${a}\\cdot${b} - K > 0`)} from the one above.`,
        `${D(`0 < K < ${num(crit, 0)}`)}`,
        `<b>Two conditions, one from each of the last two rows.</b> Only the rows that contain K can constrain it, so a range question is never as much work as the full array suggests — find the entries with K in them and make each positive.`,
      ],
    };
  },
});

defineProblem("marginal-freq", {
  topic: "The frequency it oscillates at",
  lookup: "Electrical → Control Systems → Routh–Hurwitz criterion",
  make(rng) {
    const a = rng.pick([2, 4, 5, 6, 10]);
    const b = rng.pick([4, 9, 16, 25, 36]);
    const crit = a * b;
    const w = Math.sqrt(b);
    return {
      stem: `The characteristic equation ${T(`s^3 + ${a}s^2 + ${b}s + K`)} is marginally stable at ${T(`K = ${num(crit, 0)}`)}. At what frequency does the loop oscillate?`,
      choices: options(
        { text: `${sig(w, 3)} rad/s`, why: "" },
        [
          { text: `${sig(Math.sqrt(crit), 3)} rad/s`, why: `That is ${T("\\sqrt{K}")}. The auxiliary polynomial is the <b>s² row</b>, which is ${T(`${a}s^2 + ${num(crit, 0)}`)}, so ${T(`\\omega^2 = ${num(crit, 0)}/${a} = ${num(b, 0)}`)} — the a divides out.` },
          { text: `${sig(crit / a, 3)} rad/s`, why: `That is ω², not ω. Take the square root of ${num(b, 0)}.` },
          { text: `${sig(a, 3)} rad/s`, why: "The s² coefficient is not the frequency. Form the auxiliary polynomial from the s² row and solve it." },
          { text: `${sig(Math.sqrt(a), 3)} rad/s`, why: `Wrong coefficient. For ${T("s^3 + as^2 + bs + K")} the marginal frequency is always ${T("\\sqrt{b}")}.` },
        ]),
      answer: 0,
      steps: [
        `At the critical gain the s¹ row goes to zeros. <b>That is the array telling you there are roots symmetric about the origin</b> — here, a pair on the imaginary axis.`,
        `The <b>auxiliary polynomial</b> is the row above the zero row, read as a polynomial in s:`,
        D(`A(s) = ${a}s^2 + ${num(crit, 0)} = 0`),
        `${D(`s^2 = -\\frac{${num(crit, 0)}}{${a}} = -${num(b, 0)} \\quad\\Rightarrow\\quad s = \\pm ${sig(w, 3)}j`)}`,
        `<b>ω = ${sig(w, 3)} rad/s.</b> Notice the shortcut: for ${T("s^3 + as^2 + bs + K")} the critical gain is ${T("K = ab")} and the auxiliary polynomial is ${T("as^2 + ab")}, so <b>ω = √b every time</b> — the s coefficient, square-rooted. Two numbers straight off the polynomial.`,
      ],
    };
  },
});

/* ==========================================================================
   Part 4 — Bode plots and margins
   ========================================================================== */

const dbOf = (r) => 20 * Math.log10(r);

defineProblem("margin-read", {
  topic: "Reading a margin off a plot",
  lookup: "Electrical → Control Systems → Bode plots / stability margins",
  make(rng) {
    const ask = rng.pick(["pm", "pm", "gm", "gmratio", "phase"]);

    if (ask === "pm") {
      const ph = rng.pick([-105, -120, -132, -145, -155, -168]);
      const pm = 180 + ph;
      return {
        stem: `An open-loop Bode plot crosses <b>0 dB</b> at ω = 8 rad/s, where the phase is ${T(`${num(ph, 0)}^\\circ`)}. What is the phase margin?`,
        choices: options(
          { text: `${num(pm, 0)}°`, why: "" },
          [
            { text: `${num(-ph, 0)}°`, why: `That is the phase itself, with the sign dropped. <b>Phase margin is the gap left before −180°</b>: ${T(`180 + (${num(ph, 0)}) = ${num(pm, 0)}^\\circ`)}.` },
            { text: `${num(180 - ph, 0)}°`, why: "Subtracted rather than added. The phase is already negative, so adding 180 is what measures the distance up to −180°." },
            { text: `${num(90 + ph, 0)}°`, why: "The reference is −180°, not −90°. −90° is where a single integrator sits and has nothing to do with the stability boundary." },
            { text: `${num(pm / 2, 0)}°`, why: "No halving anywhere. The margin is the plain difference." },
          ]),
        answer: 0,
        steps: [
          `<b>Phase margin is measured at the gain crossover</b> — the frequency where the open-loop magnitude passes through 0 dB, which the stem gives as 8 rad/s.`,
          D(`PM = 180^\\circ + \\angle GH(j\\omega_{gc}) = 180^\\circ + (${num(ph, 0)}^\\circ) = ${num(pm, 0)}^\\circ`),
          `<b>${num(pm, 0)}°.</b> Read it as an allowance: the loop could suffer ${num(pm, 0)}° more phase lag — from an unmodelled pole, or a transport delay — before ${T("GH")} reaches −1 and the closed loop oscillates.`,
          pm >= 45
            ? `That is a healthy margin. <b>Designs aim for 45° to 65°</b>, which corresponds to a damping ratio of roughly 0.45 to 0.7.`
            : `<b>Thin.</b> Below about 45° the closed-loop response rings badly, and there is little room for the plant to be different from the model.`,
        ],
      };
    }

    if (ask === "gm") {
      const db = rng.pick([-4, -8, -12, -16, -20]);
      return {
        stem: `An open-loop phase plot passes <b>−180°</b> at ω = 5 rad/s, where the magnitude is ${T(`${num(db, 0)}\\text{ dB}`)}. What is the gain margin?`,
        choices: options(
          { text: `${num(-db, 0)} dB`, why: "" },
          [
            { text: `${num(db, 0)} dB`, why: `Sign. <b>Gain margin is how far the magnitude is <em>below</em> 0 dB</b>, quoted as a positive number when the loop is stable: ${T(`GM = -(${num(db, 0)}) = ${num(-db, 0)}`)} dB.` },
            { text: `${sig(10 ** (db / 20), 3)}`, why: "That is the magnitude as a ratio, not the margin. And the question asked in decibels." },
            { text: `${num(180 + db, 0)}°`, why: "That mixes the two margins. Gain margin is in decibels and is read at the <b>phase</b> crossover; phase margin is in degrees and is read at the <b>gain</b> crossover." },
            { text: `${num(-db / 2, 0)} dB`, why: "No factor of two. The margin is read straight off the plot." },
          ]),
        answer: 0,
        steps: [
          `<b>Gain margin is measured at the phase crossover</b> — the frequency where the phase passes −180°, given here as 5 rad/s.`,
          D(`GM = -|GH(j\\omega_{pc})|_{dB} = -(${num(db, 0)}) = ${num(-db, 0)}\\text{ dB}`),
          `<b>${num(-db, 0)} dB.</b> In plain terms: the gain could be multiplied by ${sig(10 ** (-db / 20), 3)} before the loop reaches the boundary. <b>The two margins answer the same question in different currencies</b> — one in gain, one in lag — and a design wants both.`,
        ],
      };
    }

    if (ask === "gmratio") {
      const r = rng.pick([0.1, 0.2, 0.25, 0.4, 0.5]);
      const gm = dbOf(1 / r);
      return {
        stem: `At the phase crossover, the open-loop magnitude is ${T(`|GH| = ${num(r, 2)}`)}. What is the gain margin in decibels?`,
        choices: options(
          { text: `${sig(gm, 3)} dB`, why: "" },
          [
            { text: `${sig(-gm, 3)} dB`, why: "Sign. The magnitude is below 1, so it is below 0 dB, so the margin is positive — there is room to raise the gain." },
            { text: `${sig(10 * Math.log10(1 / r), 3)} dB`, why: `That used 10 log instead of 20 log. <b>|GH| is a ratio of amplitudes, so the multiplier is 20</b>; 10 is for power.` },
            { text: `${sig(1 / r, 3)} dB`, why: `${sig(1 / r, 3)} is the factor the gain could be multiplied by, which is the right idea in the wrong units. Take 20 log of it.` },
          ]),
        answer: 0,
        steps: [
          D(`GM = 20\\log_{10}\\frac{1}{|GH(j\\omega_{pc})|} = 20\\log_{10}\\frac{1}{${num(r, 2)}} = ${sig(gm, 4)}\\text{ dB}`),
          `<b>${sig(gm, 3)} dB.</b> The two ways of saying it are worth keeping side by side: the loop gain could be multiplied by ${sig(1 / r, 3)}, <em>or</em> raised by ${sig(gm, 3)} dB. Same statement.`,
          `<b>The anchors do this in your head.</b> ×2 is 6 dB and ×10 is 20 dB, so ×${sig(1 / r, 3)} is ${sig(gm, 3)} dB without a calculator.`,
        ],
      };
    }

    const pm = rng.pick([30, 40, 45, 50, 60]);
    return {
      stem: `A loop has a phase margin of ${num(pm, 0)}°. What is its open-loop phase at the gain crossover?`,
      choices: options(
        { text: `${num(pm - 180, 0)}°`, why: "" },
        [
          { text: `${num(180 - pm, 0)}°`, why: "Sign. The open-loop phase of a real plant at crossover is <b>negative</b> — poles contribute lag. The margin is the distance from that lag up to −180°." },
          { text: `${num(-pm, 0)}°`, why: `That is the margin itself, negated. The phase is ${T(`-180 + ${num(pm, 0)}`)}.` },
          { text: `${num(-90 - pm, 0)}°`, why: "The reference is −180°, not −90°." },
        ]),
      answer: 0,
      steps: [
        `Rearrange the definition: ${D(`PM = 180^\\circ + \\angle GH \\quad\\Rightarrow\\quad \\angle GH = PM - 180^\\circ`)}`,
        `${D(`\\angle GH = ${num(pm, 0)}^\\circ - 180^\\circ = ${num(pm - 180, 0)}^\\circ`)}`,
        `<b>${num(pm - 180, 0)}°.</b> Sanity check the sign every time: <b>a stable loop has less than 180° of lag where its gain passes unity</b>, so the phase is between 0 and −180 and the margin is what is left over.`,
      ],
    };
  },
});

defineProblem("margin-calc", {
  topic: "Margins from a transfer function",
  lookup: "Electrical → Control Systems → Bode plots / stability margins",
  make(rng) {
    const a = rng.pick([1, 2, 3, 4, 5]);
    const b = rng.pick([6, 8, 10, 12, 20]);
    const wpc = Math.sqrt(a * b);
    const kCrit = a * b * (a + b);
    const ask = rng.pick(["wpc", "kcrit", "gm"]);
    const K = Math.round(kCrit / rng.pick([2, 4, 5]));

    if (ask === "wpc") {
      return {
        stem: `A unity-feedback loop has ${T(`GH = \\dfrac{K}{s(s+${a})(s+${b})}`)}. At what frequency does the phase reach −180°?`,
        choices: options(
          { text: `${sig(wpc, 3)} rad/s`, why: "" },
          [
            { text: `${sig(a + b, 3)} rad/s`, why: `The corner frequencies add only their <em>phase</em>, not their values. Setting ${T("\\arctan(\\omega/a) + \\arctan(\\omega/b) = 90^\\circ")} makes the two ratios reciprocal, which gives ${T("\\omega = \\sqrt{ab}")}.` },
            { text: `${sig((a + b) / 2, 3)} rad/s`, why: "The average of the corners is not it either. The relation is the <b>geometric</b> mean, which sits at the midpoint on a logarithmic axis — as it should, since a Bode plot is logarithmic." },
            { text: `${sig(a * b, 3)} rad/s`, why: `That is ab. Take the square root: ${T(`\\sqrt{${num(a * b, 0)}} = ${sig(wpc, 3)}`)}.` },
            { text: `${sig(b, 3)} rad/s`, why: "The larger corner on its own contributes only 45° of lag at that frequency, which with the integrator's 90° and the other pole is not yet 180°." },
          ]),
        answer: 0,
        steps: [
          `The integrator supplies a flat −90°, so the two poles must supply the other 90° between them:`,
          D(`\\arctan\\frac{\\omega}{${a}} + \\arctan\\frac{\\omega}{${b}} = 90^\\circ`),
          `Two angles summing to 90° have reciprocal tangents, so ${T(`\\frac{\\omega}{${a}}\\cdot\\frac{\\omega}{${b}} = 1`)}:`,
          D(`\\omega_{pc} = \\sqrt{(${a})(${b})} = ${sig(wpc, 4)}\\text{ rad/s}`),
          `<b>${sig(wpc, 3)} rad/s — the geometric mean of the two corners</b>, and note that <b>K does not appear</b>. Gain moves the magnitude curve up and down and never touches the phase, so the phase crossover is a property of the plant alone.`,
        ],
      };
    }

    if (ask === "kcrit") {
      return {
        stem: `A unity-feedback loop has ${T(`GH = \\dfrac{K}{s(s+${a})(s+${b})}`)}. At what gain does it become unstable?`,
        choices: options(
          { text: num(kCrit, 0), why: "" },
          [
            { text: num(a * b, 0), why: `That is ab, which is ${T("\\omega_{pc}^2")}. The critical gain carries an extra factor of (a + b) — it is the product of all three coefficients of the characteristic equation's middle terms.` },
            { text: num(a + b, 0), why: "Far too small. Check against Routh: the characteristic equation is s³ + (a+b)s² + ab·s + K, stable while K < (a+b)(ab)." },
            { text: num(a * b * b, 0), why: "One factor is wrong. It is a·b·(a + b)." },
            { text: num(2 * kCrit, 0), why: "Twice the boundary — this gain is already unstable." },
          ]),
        answer: 0,
        steps: [
          `Two routes, and they agree — which is the point of this part. <b>By Routh:</b>`,
          D(`s(s+${a})(s+${b}) + K = s^3 + ${a + b}s^2 + ${a * b}s + K`),
          `A cubic is stable while the constant term is below the product of the other two: ${T(`K < (${a + b})(${a * b}) = ${num(kCrit, 0)}`)}.`,
          `<b>By Bode:</b> the phase reaches −180° at ${T(`\\omega_{pc} = \\sqrt{ab} = ${sig(wpc, 3)}`)}, and setting ${T("|GH| = 1")} there gives ${T(`K = ab(a+b) = ${num(kCrit, 0)}`)}.`,
          `<b>${num(kCrit, 0)}.</b> The two methods look nothing alike — one counts signs in a table, the other measures a distance on a graph — and they must give the same number, because both are asking where the roots cross the imaginary axis.`,
        ],
      };
    }

    const gm = dbOf(kCrit / K);
    return {
      stem: `A unity-feedback loop has ${T(`GH = \\dfrac{${num(K, 0)}}{s(s+${a})(s+${b})}`)}. What is its gain margin?`,
      choices: options(
        { text: `${sig(gm, 3)} dB`, why: "" },
        [
          { text: `${sig(-gm, 3)} dB`, why: "Sign. The magnitude at the phase crossover is below unity, so there is room to raise the gain and the margin is positive." },
          { text: `${sig(kCrit / K, 3)} dB`, why: `${sig(kCrit / K, 3)} is the <em>factor</em> the gain could be multiplied by. In decibels that is ${T(`20\\log_{10}${sig(kCrit / K, 3)} = ${sig(gm, 3)}`)}.` },
          { text: `${sig(dbOf(K / kCrit), 3)} dB`, why: "Upside down. The margin is the critical gain over the actual gain." },
          { text: `${sig(dbOf(kCrit / K) / 2, 3)} dB`, why: "10 log instead of 20 log — that multiplier is for power ratios." },
        ]),
      answer: 0,
      steps: [
        `The loop goes unstable at ${T(`K_{crit} = ab(a+b) = ${num(kCrit, 0)}`)}, and the gain margin is simply how far below that you are, in decibels:`,
        D(`GM = 20\\log_{10}\\frac{K_{crit}}{K} = 20\\log_{10}\\frac{${num(kCrit, 0)}}{${num(K, 0)}} = ${sig(gm, 4)}\\text{ dB}`),
        `<b>${sig(gm, 3)} dB</b>, or a factor of ${sig(kCrit / K, 3)} in plain gain. ${gm >= 6 ? "<b>Comfortably inside the 6–12 dB a design aims for.</b>" : "<b>Below the 6 dB a design would want</b>, so this loop has little tolerance for the plant drifting."}`,
      ],
    };
  },
});

defineProblem("pm-to-time", {
  topic: "From margin to overshoot",
  lookup: "Electrical → Control Systems → Controller performance",
  make(rng) {
    const ask = rng.pick(["os", "os", "pm"]);
    if (ask === "os") {
      const pm = rng.pick([30, 40, 45, 50, 60, 65]);
      const z = pm / 100;
      const os = overshoot(z);
      return {
        stem: `A loop has a phase margin of ${num(pm, 0)}°. Estimate the overshoot of its closed-loop step response.`,
        choices: options(
          { text: `about ${sig(os, 2)}%`, why: "" },
          [
            { text: `about ${sig(overshoot(pm / 200), 2)}%`, why: `The rule is ${T("\\zeta \\approx PM/100")}, so ${num(pm, 0)}° gives ζ ≈ ${num(z, 2)} — not ${num(z / 2, 3)}.` },
            { text: `about ${num(pm, 0)}%`, why: "The margin is in degrees and the overshoot is a percentage; they are not the same number. Go through ζ." },
            { text: `about ${sig(overshoot(Math.min(0.99, pm / 60)), 2)}%`, why: "Check the divisor: the rule divides the phase margin by 100." },
            { text: "0%", why: "A finite phase margin means a complex pole pair and therefore overshoot. Only a real-pole response has none." },
          ]),
        answer: 0,
        steps: [
          `<b>The bridge between the two domains, and it is worth memorising:</b> ${D(`\\zeta \\approx \\frac{PM}{100} = \\frac{${num(pm, 0)}}{100} = ${num(z, 2)}`)}`,
          `${D(`\\%OS = 100\\,e^{-\\pi\\zeta/\\sqrt{1-\\zeta^2}} = ${sig(os, 3)}\\%`)}`,
          `<b>About ${sig(os, 2)}%.</b> The rule is a straight line drawn through a curve and it is good from roughly 30° to 65° — which is where designs live, so it is good where it matters. ${pm >= 55 ? "<b>At 60° it gives ζ = 0.6 and 9.5% overshoot</b>, which is why 60° is the number people quote." : ""}`,
        ],
      };
    }
    const target = rng.pick([5, 10, 16, 20]);
    const z = zetaFor(target);
    const pm = Math.round(z * 100);
    return {
      stem: `A closed loop must overshoot by no more than about ${num(target, 0)}%. What phase margin should the open loop be designed for?`,
      choices: options(
        { text: `about ${num(pm, 0)}°`, why: "" },
        [
          { text: `about ${num(target, 0)}°`, why: "The overshoot percentage is not the margin in degrees. Convert to ζ first, then multiply by 100." },
          { text: `about ${num(100 - pm, 0)}°`, why: "Inverted. <b>More phase margin means more damping means less overshoot</b>, so a tight overshoot limit calls for a large margin." },
          { text: `about ${num(pm * 2, 0)}°`, why: `Twice the answer. ${T(`\\zeta = ${fixed(z, 2)}`)} maps to ${T(`100\\zeta = ${num(pm, 0)}^\\circ`)}.` },
          { text: "180°", why: "A phase margin is the gap up to 180° of lag, so it can never be 180° itself — that would mean the loop had no lag at all at crossover." },
        ]),
      answer: 0,
      steps: [
        `Overshoot fixes ζ. ${num(target, 0)}% corresponds to ${D(`\\zeta = ${fixed(z, 3)}`)}`,
        `${D(`PM \\approx 100\\zeta = ${num(pm, 0)}^\\circ`)}`,
        `<b>About ${num(pm, 0)}°.</b> That is how a time-domain requirement becomes something you can check on a Bode plot — and it is why designers state specifications in phase margin at all, rather than in the overshoot they actually care about.`,
      ],
    };
  },
});

/* ==========================================================================
   Part 5 — steady-state error and system type
   ========================================================================== */

defineProblem("system-type", {
  topic: "System type",
  lookup: "Electrical → Control Systems → Steady-state error",
  make(rng) {
    const CASES = [
      { tex: "\\dfrac{20}{(s+2)(s+5)}", type: 0, order: 3 },
      { tex: "\\dfrac{40(s+3)}{(s+1)(s+4)(s+9)}", type: 0, order: 3 },
      { tex: "\\dfrac{12}{s(s+6)}", type: 1, order: 2 },
      { tex: "\\dfrac{8(s+2)}{s(s+1)(s+5)}", type: 1, order: 3 },
      { tex: "\\dfrac{30}{s^2(s+4)}", type: 2, order: 3 },
      { tex: "\\dfrac{15(s+1)}{s^2(s+7)}", type: 2, order: 3 },
    ];
    const c = rng.pick(CASES);
    const ask = rng.pick(["type", "type", "track"]);
    const TRACKED = ["none of them", "a step", "a step and a ramp"];

    if (ask === "type") {
      return {
        stem: `A unity-feedback system has ${T(`G(s) = ${c.tex}`)}. What is its <b>type</b>?`,
        choices: options(
          { text: `type ${num(c.type, 0)}`, why: "" },
          [
            { text: `type ${num(c.order, 0)}`, why: `That is the <b>order</b> — the degree of the denominator. Type counts only the poles <em>at the origin</em>, which is a different and much smaller number.` },
            { text: `type ${num(c.type + 1, 0)}`, why: "One too many. Count the factors of s standing alone in the denominator; a pole at −4 is not a pole at the origin." },
            { text: `type ${num(Math.max(0, c.type - 1), 0)}`, why: c.type === 0 ? "Type cannot be negative. With no pole at the origin the system is type 0." : "One too few — look again at the power of s in the denominator." },
          ], [{ text: "type 4", why: "Type is the number of open-loop poles at the origin, and no plant here has four." }]),
        answer: 0,
        steps: [
          `<b>System type is the number of poles at the origin in the open loop</b> — the power of s standing alone in the denominator. Nothing else about the transfer function matters.`,
          `Here that power is ${num(c.type, 0)}, so the system is <b>type ${num(c.type, 0)}</b>.`,
          `Why the count is worth having: <b>each integrator lets the loop track one more order of input with zero error.</b> Type ${num(c.type, 0)} tracks ${TRACKED[c.type]} exactly, leaves a constant error on the next input up, and falls behind without bound on the one after that.`,
        ],
      };
    }

    return {
      stem: `A unity-feedback system has ${T(`G(s) = ${c.tex}`)}. Which commands does it follow with <b>zero</b> steady-state error?`,
      choices: options(
        { text: TRACKED[c.type], why: "" },
        [
          { text: TRADE_ALT(c.type, 1), why: `That is one more than it can manage. This is <b>type ${num(c.type, 0)}</b>, and a type-n loop tracks inputs up to order n exactly — no further.` },
          { text: TRADE_ALT(c.type, -1), why: c.type === 0 ? "It cannot even do this one: with no integrator, holding a constant output requires a constant error." : "It can do better than that — count the integrators again." },
          { text: "every input, if K is large enough", why: "<b>Gain shrinks a steady-state error but never removes it.</b> Only an integrator can hold an output with no input to drive it, and gain is not an integrator." },
        ]),
      answer: 0,
      steps: [
        `Count the poles at the origin: <b>type ${num(c.type, 0)}</b>.`,
        `<b>An integrator holds its output when its input is zero</b>, so a loop with one can sit exactly on a constant command with no error at all. Without one, the plant only produces output while it is being told to, and the telling <em>is</em> the error.`,
        `A type-${num(c.type, 0)} loop therefore follows <b>${TRACKED[c.type]}</b> exactly, leaves a constant error on the next order of input, and loses ground without bound on the one after.`,
      ],
    };
  },
});

function TRADE_ALT(type, d) {
  const T3 = ["none of them", "a step", "a step and a ramp", "a step, a ramp and a parabola"];
  return T3[Math.max(0, Math.min(3, type + d))];
}

defineProblem("ss-error", {
  topic: "Steady-state error",
  lookup: "Electrical → Control Systems → Steady-state error",
  make(rng) {
    const a = rng.pick([2, 3, 4, 5]);
    const b = rng.pick([5, 6, 8, 10]);
    const mode = rng.pick(["t0step", "t0step", "t1ramp", "t1ramp", "mismatch"]);

    if (mode === "t0step") {
      const K = rng.pick([2, 3, 4, 5]) * a * b;
      const Kp = K / (a * b);
      const e = 1 / (1 + Kp);
      return {
        stem: `A unity-feedback system has ${T(`G(s) = \\dfrac{${num(K, 0)}}{(s+${a})(s+${b})}`)}. What is the steady-state error to a <b>unit step</b>?`,
        choices: options(
          { text: sig(e, 3), why: "" },
          [
            { text: sig(1 / Kp, 3), why: `The 1 in the denominator was dropped. <b>For a step it is ${T("e = 1/(1 + K_p)")}</b>, not ${T("1/K_p")} — the ${T("1/K_v")} form belongs to a ramp.` },
            { text: sig(Kp, 3), why: `That is ${T("K_p")} itself, ${T(`= G(0) = ${num(K, 0)}/(${a}\\cdot${b}) = ${sig(Kp, 3)}`)}. The error is its reciprocal, plus the 1.` },
            { text: "0", why: "Zero error to a step needs an integrator, and this plant has no pole at the origin — it is type 0." },
            { text: sig(1 / (1 + K), 3), why: `${T("K_p")} is ${T("G(0)")}, not K. Evaluating at s = 0 divides by both pole locations: ${T(`${num(K, 0)}/(${a}\\cdot${b}) = ${sig(Kp, 3)}`)}.` },
          ]),
        answer: 0,
        steps: [
          `Type 0 — no pole at the origin — so the position constant is what matters:`,
          D(`K_p = \\lim_{s\\to0} G(s) = \\frac{${num(K, 0)}}{(${a})(${b})} = ${sig(Kp, 4)}`),
          D(`e(\\infty) = \\frac{1}{1 + K_p} = \\frac{1}{1 + ${sig(Kp, 4)}} = ${sig(e, 4)}`),
          `<b>${sig(e, 3)}</b>, or ${fixed(e * 100, 1)}% of the command — permanently. <b>Raising K shrinks it and never removes it</b>, because a type-0 plant needs a standing error to hold a standing output.`,
        ],
      };
    }

    if (mode === "t1ramp") {
      const K = rng.pick([2, 4, 5, 8]) * a;
      const Kv = K / a;
      const e = 1 / Kv;
      return {
        stem: `A unity-feedback system has ${T(`G(s) = \\dfrac{${num(K, 0)}}{s(s+${a})}`)}. What is the steady-state error to a <b>unit ramp</b>?`,
        choices: options(
          { text: sig(e, 3), why: "" },
          [
            { text: sig(1 / (1 + Kv), 3), why: `The <b>1 + belongs to the step case only</b>. For a ramp it is a clean ${T("e = 1/K_v")}.` },
            { text: sig(Kv, 3), why: `That is ${T("K_v")}, the velocity constant. The error is its reciprocal.` },
            { text: "0", why: `Zero error to a ramp needs <b>two</b> integrators. This loop has one, so it tracks a step exactly and a ramp with a constant lag.` },
            { text: "grows without bound", why: "That happens one input further on — a parabola. A type-1 loop keeps up with a ramp, just permanently behind it." },
          ]),
        answer: 0,
        steps: [
          `One pole at the origin, so this is type 1 and the velocity constant is the one to compute:`,
          D(`K_v = \\lim_{s\\to0} sG(s) = \\lim_{s\\to0}\\frac{${num(K, 0)}}{s+${a}} = \\frac{${num(K, 0)}}{${a}} = ${sig(Kv, 4)}`),
          D(`e(\\infty) = \\frac{1}{K_v} = ${sig(e, 4)}`),
          `<b>${sig(e, 3)}.</b> The s in ${T("sG(s)")} cancels the integrator, which is exactly why the constant comes out finite — <b>and the answer is that the output runs parallel to the command, ${sig(e, 3)} behind it, for ever</b>.`,
        ],
      };
    }

    const K = rng.pick([10, 20, 40]);
    return {
      stem: `A unity-feedback system has ${T(`G(s) = \\dfrac{${num(K, 0)}}{(s+${a})(s+${b})}`)}. What is the steady-state error to a <b>unit ramp</b>?`,
      choices: options(
        { text: "it grows without bound", why: "" },
        [
          { text: sig(a * b / K, 3), why: `That is ${T("1/K_v")} computed as if the plant had an integrator. Check first: ${T(`K_v = \\lim_{s\\to0} sG(s) = 0`)} here, because there is no s in the denominator to cancel — and ${T("1/0")} is not a number.` },
          { text: sig(1 / (1 + K / (a * b)), 3), why: "That is the error to a <b>step</b>. The input matters as much as the plant." },
          { text: "0", why: "Zero error to a ramp needs two integrators; this plant has none." },
          { text: sig(K / (a * b), 3), why: `That is ${T("K_p")}, which is the right constant for a step and the wrong one here.` },
        ]),
      answer: 0,
      steps: [
        `The plant is <b>type 0</b> — no pole at the origin — and the input is a ramp.`,
        D(`K_v = \\lim_{s\\to0} sG(s) = \\lim_{s\\to0}\\frac{${num(K, 0)}\\,s}{(s+${a})(s+${b})} = 0`),
        `${T("e = 1/K_v")} with ${T("K_v = 0")} means <b>the error grows without bound</b>. Physically: the command keeps rising, the plant can only produce output in proportion to the error, so the error must keep rising too.`,
        `<b>The rule in one line: a type-n loop needs n integrators to track an order-n input.</b> Step needs 1 for zero error, ramp needs 2, parabola needs 3 — and one short of that gives a constant error, two short gives an unbounded one.`,
      ],
    };
  },
});

defineProblem("error-design", {
  topic: "Designing to an error",
  lookup: "Electrical → Control Systems → Steady-state error",
  make(rng) {
    const a = rng.pick([2, 4, 5]);
    const b = rng.pick([5, 8, 10]);
    const pct = rng.pick([2, 4, 5, 10, 20]);
    const KpNeed = 100 / pct - 1;
    const K = KpNeed * a * b;
    return {
      stem: `A unity-feedback system has ${T(`G(s) = \\dfrac{K}{(s+${a})(s+${b})}`)}. What gain holds the steady-state error to a unit step at <b>${num(pct, 0)}%</b>?`,
      choices: options(
        { text: sig(K, 4), why: "" },
        [
          { text: sig((100 / pct) * a * b, 4), why: `The 1 was dropped. ${T("e = 1/(1+K_p)")} gives ${T(`K_p = 1/${num(pct / 100, 2)} - 1 = ${sig(KpNeed, 3)}`)}, not ${sig(100 / pct, 3)}.` },
          { text: sig(KpNeed, 4), why: `That is the required ${T("K_p")}, not K. ${T("K_p = G(0) = K/(ab)")}, so K is ${T(`${sig(KpNeed, 3)} \\times ${num(a * b, 0)}`)}.` },
          { text: sig(KpNeed * (a + b), 4), why: `The poles were added. ${T("G(0)")} is found by putting s = 0 into the product, which <b>multiplies</b> them.` },
          { text: sig(K / 100, 4), why: "A stray factor of 100 — the percentage was already converted when Kp was found." },
        ]),
      answer: 0,
      steps: [
        `Work backwards from the error. ${D(`e = \\frac{1}{1 + K_p} = ${num(pct / 100, 2)} \\quad\\Rightarrow\\quad K_p = \\frac{1}{${num(pct / 100, 2)}} - 1 = ${sig(KpNeed, 4)}`)}`,
        `Now turn ${T("K_p")} into K, remembering that ${T("K_p = G(0)")} and the poles multiply:`,
        D(`K_p = \\frac{K}{(${a})(${b})} \\quad\\Rightarrow\\quad K = (${sig(KpNeed, 4)})(${num(a * b, 0)}) = ${sig(K, 4)}`),
        `<b>K = ${sig(K, 3)}.</b> And the sting: <b>halving the error means roughly doubling the gain</b>, and Part 4 says every doubling costs 6 dB of gain margin. A 1% specification on a type-0 plant is usually a request for an integrator, not a bigger number.`,
      ],
    };
  },
});

/* ==========================================================================
   Part 6 — controller performance and PID
   ========================================================================== */

defineProblem("pid-form", {
  topic: "The controller, written down",
  lookup: "Electrical → Control Systems → Controller performance",
  make(rng) {
    const kp = rng.pick([2, 4, 5, 8, 10]);
    const ki = rng.pick([1, 2, 5, 10, 20]);
    const kd = rng.pick([0.5, 1, 2, 4]);
    const ask = rng.pick(["single", "single", "type", "which"]);

    if (ask === "single") {
      return {
        stem: `A PID controller has ${T(`K_p = ${num(kp, 0)}`)}, ${T(`K_i = ${num(ki, 0)}`)} and ${T(`K_d = ${num(kd, 1)}`)}. Write ${T("G_c(s)")} as a single fraction.`,
        choices: options(
          { tex: `\\dfrac{${num(kd, 1)}s^2 + ${num(kp, 0)}s + ${num(ki, 0)}}{s}`, why: "" },
          [
            { tex: `\\dfrac{${num(ki, 0)}s^2 + ${num(kp, 0)}s + ${num(kd, 1)}}{s}`, why: `${T("K_i")} and ${T("K_d")} are swapped. Multiplying ${T("K_d s")} by s gives the ${T("s^2")} term, so <b>the derivative gain leads</b>; the integral gain is the one with no s left.` },
            { tex: `\\dfrac{${num(kd, 1)}s^2 + ${num(kp, 0)}s + ${num(ki, 0)}}{s^2}`, why: `Only one power of s is cleared. The lowest term is ${T("K_i/s")}, so the common denominator is <b>s</b>.` },
            { tex: `${num(kd, 1)}s^2 + ${num(kp, 0)}s + ${num(ki, 0)}`, why: "The denominator was dropped. Without it this is a pure polynomial — no integrator at all, and the whole point of the I term is lost." },
            { tex: `\\dfrac{${num(kp, 0)}s^2 + ${num(kd, 1)}s + ${num(ki, 0)}}{s}`, why: `${T("K_p")} multiplies s to the first power, not the second.` },
          ]),
        answer: 0,
        steps: [
          D(`G_c(s) = K_p + \\frac{K_i}{s} + K_d s`),
          `Over the common denominator s:`,
          D(`G_c(s) = \\frac{K_p s + K_i + K_d s^2}{s} = \\frac{${num(kd, 1)}s^2 + ${num(kp, 0)}s + ${num(ki, 0)}}{s}`),
          `<b>Worth reading what that form is telling you.</b> The denominator s is a pole at the origin — <b>the controller supplies an integrator</b>, which raises the system type by one. The numerator is a quadratic, so <b>the controller also supplies two zeros</b>, and those are what pull the root locus left and buy back the damping the integrator cost.`,
        ],
      };
    }

    if (ask === "type") {
      const a = rng.pick([2, 3, 4, 6]);
      const b = rng.pick([5, 8, 10]);
      return {
        stem: `A plant ${T(`G(s) = \\dfrac{K}{(s+${a})(s+${b})}`)} is put under <b>PI</b> control. What is the steady-state error of the closed loop to a unit step?`,
        choices: options(
          { text: "zero", why: "" },
          [
            { text: `1 / (1 + K/${num(a * b, 0)})`, why: "That is the answer <em>without</em> the controller — the plain type-0 result. <b>The PI controller adds a pole at the origin</b>, which makes the open loop type 1, and a type-1 loop tracks a step exactly." },
            { text: "it depends on Kp", why: `Not for a step. The integrator makes ${T("K_p^{pos}")} infinite whatever the gains are, so ${T("e = 1/(1+\\infty) = 0")}. <b>Kp affects how fast and how oscillatory, never the final value.</b>` },
            { text: "it depends on Ki", why: "Ki changes how quickly the error is driven out and how much overshoot there is on the way. It does not change the destination — any non-zero Ki gives zero error." },
            { text: "grows without bound", why: "That would need the loop to be short of integrators, or unstable. A PI loop on this plant is neither for reasonable gains." },
          ]),
        answer: 0,
        steps: [
          `The controller is ${T("G_c = K_p + K_i/s = (K_ps + K_i)/s")}, so the open loop is`,
          D(`G_cG = \\frac{(K_ps + K_i)K}{s(s+${a})(s+${b})}`),
          `<b>That s in the denominator was not there before.</b> The open loop has gone from type 0 to type 1, so ${T("K_p^{pos} = \\lim_{s\\to0} G_cG = \\infty")} and`,
          D(`e(\\infty) = \\frac{1}{1 + \\infty} = 0`),
          `<b>Zero, exactly, at any gains that keep it stable.</b> This is the single most useful fact about PI control, and the reason it is the default choice: an integrator holds its output when its input is zero, so the loop can sit on the command with nothing driving it.`,
        ],
      };
    }

    const WHICH = [
      { c: "K_p + K_i/s", name: "PI", gloss: "proportional and integral" },
      { c: "K_p + K_d s", name: "PD", gloss: "proportional and derivative" },
      { c: "K_p + K_i/s + K_d s", name: "PID", gloss: "all three" },
    ];
    const w = rng.pick(WHICH);
    return {
      stem: `A controller has transfer function ${T(`G_c(s) = ${w.c}`)}. What is it, and does it raise the system type?`,
      choices: options(
        { text: `${w.name} — ${w.name.includes("I") ? "yes, by one" : "no"}`, why: "" },
        [
          { text: `${w.name} — ${w.name.includes("I") ? "no" : "yes, by one"}`, why: w.name.includes("I") ? "The <b>1/s term is a pole at the origin</b>, which is exactly what system type counts. Adding it raises the type by one." : "There is no 1/s here, so no pole at the origin is added and the type is unchanged. <b>A PD controller adds a zero, not a pole.</b>" },
          { text: `${w.name === "PD" ? "PI" : "PD"} — ${w.name === "PD" ? "yes, by one" : "no"}`, why: "<b>I is the term with 1/s</b> and D is the term with s. Read which one is present." },
          { text: `${w.name} — only if K${w.name.includes("I") ? "i" : "d"} is large`, why: "Type is a structural count of poles at the origin. It does not depend on how big a gain is, only on whether the term is there at all." },
        ]),
      answer: 0,
      steps: [
        `<b>Name the terms by what they do to the error.</b> P is proportional to it, I is its integral, D is its derivative — and in s those are a constant, a ${T("1/s")}, and an s.`,
        `Here the controller has ${w.gloss}, so it is a <b>${w.name}</b> controller.`,
        w.name.includes("I")
          ? `The ${T("K_i/s")} term is a <b>pole at the origin</b>, so the open loop gains an integrator and <b>the type goes up by one</b> — a type-0 plant becomes type 1, and its steady-state error to a step becomes exactly zero.`
          : `There is no ${T("1/s")}, so no pole is added at the origin and <b>the type is unchanged</b>. A PD controller contributes a <em>zero</em>, at ${T("s = -K_p/K_d")}, which adds phase lead and buys damping — but it cannot remove a steady-state error.`,
      ],
    };
  },
});

defineProblem("pid-effect", {
  topic: "What each gain does",
  lookup: "Electrical → Control Systems → Controller performance",
  make(rng) {
    const ROWS = [
      {
        term: "K_p", name: "proportional gain",
        right: "faster and less steady-state error, but more overshoot",
        wrong: [
          { text: "slower, with less overshoot", why: "Backwards. More proportional gain pushes harder on the same error, so the response is <b>faster</b> — and it overshoots more, because the push does not let up until the error has already been crossed." },
          { text: "no effect on steady-state error", why: `On a type-0 loop it has a large effect: ${T("e = 1/(1+K_p^{pos})")}, and the constant is proportional to the gain. What it cannot do is drive the error to <em>zero</em>.` },
          { text: "eliminates steady-state error entirely", why: "Only an integrator does that. Proportional gain shrinks the error towards zero without ever arriving, and costs stability margin on the way." },
        ],
      },
      {
        term: "K_i", name: "integral gain",
        right: "removes steady-state error, but adds overshoot and can destabilise",
        wrong: [
          { text: "removes steady-state error with no side effects", why: "There is always a cost. <b>An integrator adds 90° of phase lag at every frequency</b>, which eats phase margin directly — that is why a PI loop overshoots more than the P loop it came from." },
          { text: "improves damping", why: "That is the derivative term. Integral action makes the response <em>less</em> damped, because it keeps pushing based on history even after the error has been corrected." },
          { text: "has no effect until the error is large", why: "It acts on the <b>accumulated</b> error, so a small error present for a long time produces a large integral term. Duration matters as much as size." },
        ],
      },
      {
        term: "K_d", name: "derivative gain",
        right: "damps the response and reduces overshoot, with no effect on steady-state error",
        wrong: [
          { text: "reduces steady-state error", why: "It cannot. <b>In steady state the error is constant, so its derivative is zero</b> and the D term contributes nothing at all. Look at the end of plate 100's trace." },
          { text: "makes the response faster with more overshoot", why: "That is proportional gain. The derivative term acts against the <em>rate of change</em>, so it opposes the approach and slows the crossing — which is what damping is." },
          { text: "adds phase lag, like the integral term", why: "The opposite: a derivative contributes +90°, which is <b>phase lead</b>. That is precisely why it buys back the margin an integrator spends." },
        ],
      },
    ];
    const r = rng.pick(ROWS);
    return {
      stem: `In a PID controller, what does increasing ${T(r.term)} — the ${r.name} — do?`,
      choices: options({ text: r.right, why: "" }, r.wrong),
      answer: 0,
      steps: [
        `<b>Each term answers a different question about the error.</b> P asks how big it is, I asks how long it has been there, D asks which way it is heading.`,
        `Increasing <b>${r.name}</b>: ${r.right}.`,
        `The table worth carrying: <b>Kp — faster, less error, more overshoot, less margin. Ki — error to zero, more overshoot, less margin. Kd — more damping, less overshoot, no change to the error.</b>`,
        `And the reason in one line each: <b>an integrator is −90° of phase and a derivative is +90°</b>, so the two pull in opposite directions on stability — which is why the pair is used together.`,
      ],
    };
  },
});

defineProblem("pid-choose", {
  topic: "Choosing the fix",
  lookup: "Electrical → Control Systems → Controller performance",
  make(rng) {
    const CASES = [
      {
        symptom: "settles at 8% below the command and stays there",
        right: "add integral action",
        wrong: [
          { text: "add derivative action", why: "Derivative acts on the error's <em>slope</em>, and in steady state the slope is zero — so the D term contributes nothing to a standing error. It is the right fix for ringing, not for offset." },
          { text: "reduce the proportional gain", why: "That makes the offset <b>worse</b>: on a type-0 loop the error is 1/(1 + Kp·G(0)), so lowering the gain raises it." },
          { text: "nothing can fix it", why: "An integrator fixes it outright, and does so at any gain. That is exactly what the I term is for." },
        ],
      },
      {
        symptom: "rings for a long time with 40% overshoot before settling",
        right: "add derivative action",
        wrong: [
          { text: "add integral action", why: "That makes it worse. <b>An integrator adds 90° of lag</b>, which eats phase margin, and a system already ringing has none to spare." },
          { text: "increase the proportional gain", why: "Also worse. More proportional gain moves the closed-loop poles towards the imaginary axis, which lowers ζ and increases the overshoot." },
          { text: "increase the command", why: "The response shape of a linear system does not depend on the size of the input — a bigger step gives a proportionally bigger overshoot." },
        ],
      },
      {
        symptom: "is stable and accurate but far too slow to respond",
        right: "increase the proportional gain",
        wrong: [
          { text: "increase the derivative gain", why: "Derivative action <b>damps</b>, which if anything slows the approach further. It buys headroom to raise Kp, but it is not itself the speed knob." },
          { text: "increase the integral gain", why: "That speeds up the removal of the residual error, but the initial response is set by Kp. A large Ki with a small Kp gives a sluggish rise followed by a slow crawl." },
          { text: "reduce the proportional gain", why: "The wrong direction: less push means a slower response." },
        ],
      },
      {
        symptom: "oscillates with a growing amplitude and never settles",
        right: "reduce the gain, then add derivative action",
        wrong: [
          { text: "add integral action", why: "The loop is already unstable and an integrator adds 90° more lag. <b>This is the worst available move.</b>" },
          { text: "increase the proportional gain", why: "Growing oscillation means a closed-loop pole is in the right half-plane. More gain pushes it further right." },
          { text: "wait — it will settle eventually", why: "It will not. A right-half-plane pole grows without bound until something saturates or breaks; that is what unstable means." },
        ],
      },
    ];
    const c = rng.pick(CASES);
    return {
      stem: `A closed loop ${c.symptom}. What is the right change to the controller?`,
      choices: options({ text: c.right, why: "" }, c.wrong),
      answer: 0,
      steps: [
        `<b>Match the symptom to the term that acts on it.</b> A standing offset is a job for the integral; ringing is a job for the derivative; sluggishness is a job for proportional gain; instability is a job for less of everything, then derivative.`,
        `Here: <b>${c.right}</b>.`,
        `<b>The general order of operations.</b> Get it stable first — reduce gain until it settles. Then get the shape right with Kd. Then get the accuracy with Ki. Then raise Kp for speed until the margins start to complain. <b>Doing it in any other order means retuning what you already tuned.</b>`,
      ],
    };
  },
});

defineReflex([
  {
    part: "feedback",
    stem: "A negative feedback loop, forward G, feedback H. Closed-loop gain?",
    tool: "G/(1 + GH) — plus, for negative feedback",
    because: "The sign in the denominator is opposite to the sign at the summing junction, which reads backwards and is worth checking twice.",
  },
  {
    part: "feedback",
    stem: "Open-loop gain 10⁵, feedback fraction 0.01. Closed-loop gain, most nearly?",
    tool: "1/H = 100, because GH = 1000 ≫ 1",
    because: "Once the loop gain is large the closed-loop gain is set by H alone — which is the whole reason for building it this way.",
  },
  {
    part: "feedback",
    stem: "Two blocks in cascade. One block, gain?",
    tool: "the product G₁G₂ — cascade multiplies",
    because: "Parallel paths add and cascades multiply; swapping the two is the commonest block-diagram error.",
  },
  {
    part: "feedback",
    stem: "A diagram with an inner and an outer loop. Where do you start?",
    tool: "innermost first, then treat it as one block",
    because: "Reducing outermost-first drags blocks into loop gains they do not belong in.",
  },
  {
    part: "feedback",
    stem: "Unity feedback around G = K/(s + a). Where is the closed-loop pole?",
    tool: "s = −(a + K)",
    because: "Closing the loop moves the pole left, which is the same as saying feedback makes the system faster.",
  },
  {
    part: "feedback",
    stem: "GH = 1 in a positive feedback loop. What is the closed-loop gain?",
    tool: "infinite — the denominator 1 − GH is zero",
    because: "That is the oscillation condition, and margins in Part 4 measure how far a loop is from meeting it.",
  },
  {
    part: "closed-loop",
    stem: "Where are the closed-loop poles of any feedback system?",
    tool: "the roots of 1 + GH = 0, i.e. of D + KN",
    because: "One equation covers the root locus, Routh–Hurwitz and every gain-design question in the module.",
  },
  {
    part: "closed-loop",
    stem: "Unity feedback, G = K/[s(s+6)], K = 25. Closed-loop poles?",
    tool: "s² + 6s + 25 → −3 ± 4j",
    because: "The real part is half the s coefficient regardless of K, so only the ringing frequency moves with gain.",
  },
  {
    part: "closed-loop",
    stem: "Where does a root locus start, and where does it end?",
    tool: "starts at the open-loop poles, ends at the zeros",
    because: "At K = 0 the equation is D = 0 and at K → ∞ it is N = 0, so the two ends are the two polynomials.",
  },
  {
    part: "closed-loop",
    stem: "Three poles, one finite zero. How many asymptotes, and at what angles?",
    tool: "n − m = 2, at ±90°",
    because: "Angles are (2q+1)180°/(n−m), so the count of escaping branches sets the whole picture.",
  },
  {
    part: "closed-loop",
    stem: "Dominant poles at −2 ± 5j. Settling time, 2%?",
    tool: "4/2 = 2 s — the real part alone",
    because: "The envelope is e^(−σt); the imaginary part only says how many times it rings on the way down.",
  },
  {
    part: "closed-loop",
    stem: "Poles at −1 ± 3j and −1.5. Use the second-order formulas?",
    tool: "no — the third pole needs to be 5× further left",
    because: "The performance formulas are derived for exactly two poles, and the dominance check is what licenses them.",
  },
  {
    part: "stability",
    stem: "s³ + 4s² − 2s + 7. Stable?",
    tool: "no — a negative coefficient settles it",
    because: "A polynomial with only left-half-plane roots factors into all-positive terms, so nothing can cancel to give a negative or missing coefficient.",
  },
  {
    part: "stability",
    stem: "Every coefficient present and positive. Is the system stable?",
    tool: "cannot tell above second order — build the array",
    because: "The condition is necessary but not sufficient, and that gap is the entire reason Routh–Hurwitz exists.",
  },
  {
    part: "stability",
    stem: "The first column of a Routh array reads 1, 3, −2, 5. What does it say?",
    tool: "two sign changes — two roots in the right half-plane",
    because: "The array counts right-half-plane roots without factoring anything, which is why order barely costs it any work.",
  },
  {
    part: "stability",
    stem: "s³ + as² + bs + c, all positive. Condition for stability?",
    tool: "c < ab",
    because: "It is the s¹ entry (ab − c)/a staying positive, and cubics are common enough that the shortcut is worth carrying.",
  },
  {
    part: "stability",
    stem: "A whole row of the Routh array is zeros. What does that mean?",
    tool: "roots symmetric about the origin — usually a pair on the jω axis",
    because: "The row above is the auxiliary polynomial, and solving it hands you the frequency the loop will oscillate at.",
  },
  {
    part: "stability",
    stem: "s³ + 5s² + 9s + K is marginally stable. K and ω?",
    tool: "K = 45, ω = √9 = 3 rad/s",
    because: "For a cubic the boundary is K = ab and the auxiliary polynomial as² + ab gives ω = √b every time.",
  },
  {
    part: "margins",
    stem: "The phase at the gain crossover is −140°. Phase margin?",
    tool: "180 − 140 = 40°",
    because: "The margin is the lag still available before GH reaches −1, measured where the magnitude passes unity.",
  },
  {
    part: "margins",
    stem: "|GH| = −14 dB where the phase passes −180°. Gain margin?",
    tool: "14 dB — how much more gain the loop could take",
    because: "Gain margin is read at the phase crossover and phase margin at the gain crossover; swapping them is the standard slip.",
  },
  {
    part: "margins",
    stem: "Phase margin 55°. Rough damping ratio and overshoot?",
    tool: "ζ ≈ 0.55, so about 12% overshoot",
    because: "ζ ≈ PM/100 is the bridge from the frequency domain to a time-domain specification, and it holds from about 30° to 65°.",
  },
  {
    part: "margins",
    stem: "What margins would a design aim for?",
    tool: "45–65° of phase, 6–12 dB of gain",
    because: "Margins are the allowance for the plant not matching the model, so a bare yes from Routh is not a design.",
  },
  {
    part: "margins",
    stem: "Raising K on a Bode plot does what to the phase curve?",
    tool: "nothing — gain only shifts the magnitude up",
    because: "The phase crossover frequency is a property of the plant alone, which is why the gain margin has a fixed frequency and a movable value.",
  },
  {
    part: "margins",
    stem: "GH = K/[s(s+2)(s+8)]. Phase crossover and critical gain?",
    tool: "ω = √(2·8) = 4 rad/s, K = ab(a+b) = 160",
    because: "The geometric mean of the corners is where two arctangents sum to 90°, and Routh gives the same 160 from the coefficients.",
  },
  {
    part: "steady-error",
    stem: "G = 40/[s(s+4)(s+10)]. What type is it?",
    tool: "type 1 — one pole at the origin",
    because: "Type counts integrators, not order, and it is the only thing that decides which inputs are tracked exactly.",
  },
  {
    part: "steady-error",
    stem: "Type 1, unit step input. Steady-state error?",
    tool: "zero — Kp is infinite",
    because: "An integrator holds its output with no input, so no standing error is needed to sustain a standing output.",
  },
  {
    part: "steady-error",
    stem: "Type 0 with Kp = 24, unit step. Error?",
    tool: "1/(1 + 24) = 0.04",
    because: "The step formula is the one that carries the 1 +; the ramp and parabola ones do not.",
  },
  {
    part: "steady-error",
    stem: "G = 20/[s(s+5)], unit ramp. Error?",
    tool: "Kv = 20/5 = 4, so e = 1/4",
    because: "Multiplying by s cancels the integrator before taking the limit, which is what makes Kv finite.",
  },
  {
    part: "steady-error",
    stem: "Type 1 loop, parabolic input. Error?",
    tool: "unbounded — Ka = 0",
    because: "Two orders of input beyond what the loop can hold means the output falls further behind for ever, at any gain.",
  },
  {
    part: "steady-error",
    stem: "Error too large on a type-0 loop. Two ways to fix it?",
    tool: "raise K, or add an integrator",
    because: "Gain only shrinks the error and costs margin doing it; an integrator removes it outright, which is why PI control exists.",
  },
  {
    part: "pid",
    stem: "Write Kp + Ki/s + Kd·s as one fraction.",
    tool: "(Kd s² + Kp s + Ki)/s",
    because: "One pole at the origin and two zeros — the pole raises the type and the zeros buy back the damping it costs.",
  },
  {
    part: "pid",
    stem: "Which PID term removes steady-state error?",
    tool: "integral — it adds a pole at the origin",
    because: "An integrator holds its output when its input is zero, so no standing error is needed to sustain a standing output.",
  },
  {
    part: "pid",
    stem: "Which term reduces overshoot, and what does it do to the error?",
    tool: "derivative — and nothing, the error's slope is zero in steady state",
    because: "It contributes +90° of phase lead, which is exactly what buys back the margin the integrator spends.",
  },
  {
    part: "pid",
    stem: "A type-0 plant under PI control. Steady-state error to a step?",
    tool: "zero, at any stable gains",
    because: "The controller's 1/s makes the open loop type 1, and type is structural — it does not depend on how big the gains are.",
  },
  {
    part: "pid",
    stem: "The loop is accurate but rings badly. Raise which gain?",
    tool: "Kd — never Ki, which adds 90° of lag",
    because: "Match the symptom to the term: offset is integral, ringing is derivative, sluggishness is proportional.",
  },
  {
    part: "pid",
    stem: "What does an integrator do to phase margin?",
    tool: "costs 90° of it, at every frequency",
    because: "Accuracy is bought with stability margin, which is why the D term usually has to come along with the I term.",
  },
]);
