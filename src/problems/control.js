/* ==========================================================================
   problems/control.js — generators for Control Systems.

   Part 1 (12.A): feedback, the closed-loop formula, and block-diagram
   reduction. Everything later in this module is this algebra with a
   different question asked of the answer, so the distractors here are
   deliberately the four errors that survive into Parts 2–6: dropping the 1,
   inverting the sign, reducing outermost-first, and adding a cascade.
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, sig } from "../lib/fmt.js";

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
]);
