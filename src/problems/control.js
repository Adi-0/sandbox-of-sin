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
]);
