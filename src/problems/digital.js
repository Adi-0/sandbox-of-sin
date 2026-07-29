/* ==========================================================================
   problems/digital.js — generators for Digital Systems.

   Part 1 (15.A): bases, two's complement, binary arithmetic, codes.
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed } from "../lib/fmt.js";
import { cover, termText, literals } from "../lib/boolean.js";

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;

/**
 * Build a choice list with the right answer first, dropping any distractor
 * whose text has already appeared and topping up from `spare` if that leaves
 * too few. Generated numeric distractors collide more often than they look
 * like they will — halving and dividing by 2n agree at n = 4 — and a question
 * offering the same answer twice is worse than one with three options.
 */
function options(right, wrong, spare = []) {
  const norm = (c) => (typeof c === "string" ? { text: c, why: "" } : c);
  const seen = new Set();
  const out = [];
  for (const c of [right, ...wrong, ...spare]) {
    const n = norm(c);
    if (seen.has(n.text)) continue;
    seen.add(n.text);
    out.push(n);
    if (out.length === 4) break;
  }
  return out;
}

const bin = (v, n = 8) => (v >>> 0).toString(2).padStart(n, "0");
const hex = (v, n = 2) => (v >>> 0).toString(16).toUpperCase().padStart(n, "0");
const oct = (v) => (v >>> 0).toString(8);
const bcd = (v) => String(v).split("").map((d) => bin(+d, 4)).join(" ");

/* ==========================================================================
   Part 1 — number systems
   ========================================================================== */

defineProblem("base-convert", {
  topic: "Converting between bases",
  lookup: "Electrical → Digital → Number systems",
  make(rng) {
    const v = rng.pick([53, 45, 77, 100, 156, 200, 214, 255]);
    const to = rng.pick(["hex", "bin", "dec", "oct"]);

    if (to === "dec") {
      const fromHex = rng.pick([true, false]);
      const shown = fromHex ? `0x${hex(v)}` : `0b${bin(v)}`;
      return {
        stem: `What is ${shown} in decimal?`,
        /* The "forgot the base" distractor gives each digit its place value in
           ten instead of sixteen — 0xD6 read as 13×10 + 6. Parsing the string
           with parseInt(…, 10) would look equivalent and returns NaN the
           moment a hex digit is a letter, which is most of the time. */
        choices: options(
          { text: `${v}`, why: "" },
          [
            { text: `${fromHex
                ? hex(v).split("").reduce((a, d) => a * 10 + parseInt(d, 16), 0)
                : parseInt(bin(v), 10)}`,
              why: `That gives each digit its place value in <b>ten</b> instead of ${fromHex ? "sixteen" : "two"}. ${fromHex ? "Each hex digit is worth 16 times the one to its right." : "Each binary digit is worth twice the one to its right."}` },
            { text: `${v * 2}`, why: "Doubled — a place-value slip of one position." },
            { text: `${Math.floor(v / 2)}`, why: "Halved — a place-value slip the other way." },
          ],
          [{ text: `${v + 1}`, why: "Off by one. Count the place values again." }]),
        answer: 0,
        steps: [
          fromHex
            ? `Each hex digit is four bits, so expand first: ${T(`\\text{0x${hex(v)}} = ${bin(v >> 4, 4)}\\,${bin(v & 15, 4)}`)}`
            : `Add the place values of every bit that is set:`,
          `<span class="math display" data-tex="${bin(v).split("").map((c, i) => (c === "1" ? 2 ** (7 - i) : null)).filter(Boolean).join(" + ") || "0"} = ${v}"></span>`,
          `<b>${v}.</b> Worth knowing the powers on sight — 128, 64, 32, 16, 8, 4, 2, 1 — since that turns this into reading rather than arithmetic.`,
        ],
      };
    }

    const target = to === "hex" ? `0x${hex(v)}` : to === "bin" ? bin(v) : `0o${oct(v)}`;
    return {
      stem: `What is decimal ${v} in ${to === "hex" ? "hexadecimal" : to === "bin" ? "binary" : "octal"}?`,
      choices: [
        { text: target, why: "" },
        { text: to === "hex" ? `0x${hex(v).split("").reverse().join("")}` : to === "bin" ? bin(v).split("").reverse().join("") : `0o${oct(v).split("").reverse().join("")}`,
          why: "The digits are reversed. Place value runs most-significant first, exactly as in decimal." },
        { text: to === "hex" ? `0x${hex(v + 1)}` : to === "bin" ? bin(v + 1) : `0o${oct(v + 1)}`, why: "Off by one." },
        { text: to === "hex" ? `0x${hex(v * 2 & 255)}` : to === "bin" ? bin(v * 2 & 255) : `0o${oct(v * 2 & 255)}`, why: "Shifted by one place, which doubles the value." },
      ].filter((c, i, all) => i === 0 || c.text !== all[0].text),
      answer: 0,
      steps: [
        `Go through binary — it is the shortest route to any power-of-two base:`,
        `<span class="math display" data-tex="${v} = ${bin(v)}_2"></span>`,
        to === "hex"
          ? `Group into nibbles of four and read each as a hex digit: ${T(`${bin(v >> 4, 4)} = \\text{${(v >> 4).toString(16).toUpperCase()}}`)}, ${T(`${bin(v & 15, 4)} = \\text{${(v & 15).toString(16).toUpperCase()}}`)}.`
          : to === "oct"
            ? `Group into threes from the right and read each as an octal digit.`
            : `That is the answer directly.`,
        `<b>${target}.</b>`,
      ],
    };
  },
});

defineProblem("twos-comp", {
  topic: "Two's complement",
  lookup: "Electrical → Digital → Number systems (signed)",
  make(rng) {
    const form = rng.pick(["negate", "interpret", "range"]);

    if (form === "range") {
      const n = rng.pick([4, 8, 12, 16]);
      return {
        stem: `What range of integers can be represented in ${n}-bit two's complement?`,
        choices: [
          { text: `−${2 ** (n - 1)} to +${2 ** (n - 1) - 1}`, why: "" },
          { text: `−${2 ** (n - 1) - 1} to +${2 ** (n - 1) - 1}`, why: "Symmetric, which is <b>sign-magnitude</b>'s range. Two's complement has one <em>extra</em> negative, because there is only one zero and it sits on the positive side." },
          { text: `0 to ${2 ** n - 1}`, why: "That is the <b>unsigned</b> range for n bits." },
          { text: `−${2 ** n} to +${2 ** n}`, why: `Far too wide — ${n} bits give only ${num(2 ** n, 0)} patterns in total.` },
        ],
        answer: 0,
        steps: [
          `${n} bits give ${T(`2^{${n}} = ${num(2 ** n, 0)}`)} patterns, split at the seam:`,
          `<span class="math display" data-tex="-2^{n-1} \\ \\ldots \\ 2^{n-1}-1 \\;=\\; -${2 ** (n - 1)} \\ \\ldots \\ ${2 ** (n - 1) - 1}"></span>`,
          `<b>−${2 ** (n - 1)} to +${2 ** (n - 1) - 1}.</b> The asymmetry is the giveaway that this is two's complement — zero takes one of the positive slots, so there is one more negative than positive.`,
        ],
      };
    }

    if (form === "interpret") {
      const v = rng.pick([0x35, 0x80, 0xCB, 0xFF, 0x7F, 0xA0]);
      const s = v > 127 ? v - 256 : v;
      return {
        stem: `An 8-bit register holds ${bin(v)}. What signed value does it represent in two's complement?`,
        choices: [
          { text: `${s}`, why: "" },
          { text: `${v}`, why: v > 127 ? "That is the <b>unsigned</b> reading. The top bit is 1, so as a signed value this is negative." : "" },
          { text: `${v > 127 ? -(v & 127) : -v}`, why: "That reads the top bit as a sign and the rest as magnitude — <b>sign-magnitude</b>, not two's complement. In two's complement the lower bits are not a plain magnitude." },
          { text: `${v > 127 ? -(255 - v) : v + 1}`, why: "The bits were inverted without adding one." },
        ].filter((c, i, all) => i === 0 || (c.why !== "" && c.text !== all[0].text)),
        answer: 0,
        steps: [
          v > 127
            ? `The most significant bit is <b>1</b>, so the value is negative. To read its magnitude, negate: invert and add one.`
            : `The most significant bit is <b>0</b>, so the value is positive and reads exactly as unsigned.`,
          v > 127
            ? `<span class="math display" data-tex="\\overline{${bin(v)}} = ${bin(~v & 255)}, \\quad +1 \\Rightarrow ${bin((256 - v) & 255)} = ${256 - v}"></span>`
            : `<span class="math display" data-tex="${bin(v)}_2 = ${v}"></span>`,
          `<b>${s}.</b>${v === 0x80 ? " This is the one pattern with no positive counterpart — negating it returns itself." : ""}`,
        ],
      };
    }

    const v = rng.pick([1, 20, 53, 100, 127]);
    const neg = (256 - v) & 255;
    return {
      stem: `What is −${v} in 8-bit two's complement?`,
      choices: [
        { text: bin(neg), why: "" },
        { text: bin(~v & 255), why: "That is <b>one's</b> complement — the bits were inverted but the one was not added." },
        { text: bin(v | 0x80), why: "That just sets the top bit, which is <b>sign-magnitude</b>. Two's complement changes the lower bits as well." },
        { text: bin(v), why: `That is +${v} unchanged.` },
      ],
      answer: 0,
      steps: [
        `<span class="math display" data-tex="${v} = ${bin(v)}"></span>`,
        `Invert every bit:`,
        `<span class="math display" data-tex="${bin(~v & 255)}"></span>`,
        `Add one:`,
        `<span class="math display" data-tex="${bin(neg)} = \\text{0x${hex(neg)}}"></span>`,
        `<b>${bin(neg)}.</b> Check it: ${T(`${bin(v)} + ${bin(neg)}`)} wraps to zero with a discarded carry, which is exactly what a negation must do.`,
      ],
    };
  },
});

defineProblem("binary-arith", {
  topic: "Binary arithmetic and overflow",
  lookup: "Electrical → Digital → Number systems (arithmetic)",
  make(rng) {
    const cases = [
      { a: 0x7F, b: 0x01, ovf: true, cy: false },
      { a: 0x80, b: 0x80, ovf: true, cy: true },
      { a: 0xFF, b: 0x01, ovf: false, cy: true },
      { a: 0x35, b: 0x14, ovf: false, cy: false },
      { a: 0x40, b: 0x40, ovf: true, cy: false },
      { a: 0xC0, b: 0xC0, ovf: false, cy: true },
    ];
    const c = rng.pick(cases);
    const sum = (c.a + c.b) & 255;
    const sgn = (v) => (v > 127 ? v - 256 : v);
    const ask = rng.pick(["sum", "flags"]);

    if (ask === "flags") {
      const right = c.ovf && c.cy ? "both" : c.ovf ? "overflow only" : c.cy ? "carry only" : "neither";
      return {
        stem: `Two 8-bit values ${bin(c.a)} and ${bin(c.b)} are added. Which flags are set?`,
        choices: [
          { text: right, why: "" },
          ...["both", "overflow only", "carry only", "neither"].filter((x) => x !== right).slice(0, 3)
            .map((x) => ({ text: x, why: `Carry means the <b>unsigned</b> result did not fit; overflow means the <b>signed</b> result did not. Here the unsigned sum is ${c.a + c.b}${c.cy ? ", which exceeds 255 — carry is set" : ", which fits in 8 bits — no carry"}, and the signed sum is ${sgn(c.a) + sgn(c.b)}${c.ovf ? `, which is outside −128…127 — overflow is set` : `, which fits — no overflow`}.` })),
        ],
        answer: 0,
        steps: [
          `<b>Unsigned:</b> ${c.a} + ${c.b} = ${c.a + c.b}. ${c.cy ? "That exceeds 255, so a <b>carry</b> comes out of the top bit." : "That fits in 8 bits, so there is no carry."}`,
          `<b>Signed:</b> ${sgn(c.a)} + ${sgn(c.b)} = ${sgn(c.a) + sgn(c.b)}. ${c.ovf ? `That is outside −128…127, so <b>overflow</b> is set — and the register instead holds ${sgn(sum)}.` : "That is inside −128…127, so there is no overflow."}`,
          `<b>${right}.</b> The two flags answer different questions, and the hardware sets both because it cannot know which interpretation you meant.`,
        ],
      };
    }

    return {
      stem: `Add the 8-bit values ${bin(c.a)} and ${bin(c.b)}. What does the register hold afterwards?`,
      choices: [
        { text: bin(sum), why: "" },
        { text: bin((c.a + c.b) >> 1), why: "Shifted right — the carry was handled as a divide rather than discarded." },
        { text: bin(c.a ^ c.b), why: "That is XOR, which is addition <b>without</b> carries between columns." },
        { text: bin((c.a & c.b) & 255), why: "That is AND, not addition." },
      ].filter((c2, i, all) => i === 0 || c2.text !== all[0].text),
      answer: 0,
      steps: [
        `<span class="math display" data-tex="${bin(c.a)} + ${bin(c.b)} = ${c.cy ? "1\\," : ""}${bin(sum)}"></span>`,
        c.cy
          ? `The ninth bit is discarded — an 8-bit register has nowhere to put it, and the carry flag records that it happened.`
          : `Everything fits in 8 bits.`,
        `<b>${bin(sum)}</b> = ${sum} unsigned, ${sgn(sum)} signed.${c.ovf ? " Note the signed reading is <b>wrong</b> as arithmetic — this addition overflowed." : ""}`,
      ],
    };
  },
});

defineProblem("code-type", {
  topic: "BCD and Gray code",
  lookup: "Electrical → Digital → Number systems (codes)",
  make(rng) {
    const form = rng.pick(["bcd", "gray"]);

    if (form === "bcd") {
      const v = rng.pick([27, 39, 53, 64, 85]);
      return {
        stem: `What is decimal ${v} in BCD?`,
        choices: [
          { text: bcd(v), why: "" },
          { text: bin(v), why: "That is plain binary. <b>BCD stores each decimal digit separately</b> in its own four bits, which is why it takes more room." },
          { text: `${bin(v >> 4, 4)} ${bin(v & 15, 4)}`, why: "That splits the <em>binary</em> value into nibbles, which gives hex, not BCD. BCD splits the <em>decimal</em> digits." },
          { text: bcd(v).split(" ").reverse().join(" "), why: "The digits are in the wrong order." },
        ],
        answer: 0,
        steps: [
          `BCD encodes each decimal digit on its own, in four bits:`,
          `<span class="math display" data-tex="${String(v)[0]} \\to ${bin(+String(v)[0], 4)}, \\qquad ${String(v)[1]} \\to ${bin(+String(v)[1], 4)}"></span>`,
          `<b>${bcd(v)}.</b> Compare with plain binary, ${bin(v)} — <b>they are different, and BCD is the longer one.</b> That waste buys a trivial conversion to a display, which is the only reason anyone uses it.`,
        ],
      };
    }

    const v = rng.pick([3, 5, 7, 9, 12]);
    const g = v ^ (v >> 1);
    return {
      stem: `What is decimal ${v} in Gray code (4 bits)?`,
      choices: [
        { text: bin(g, 4), why: "" },
        { text: bin(v, 4), why: "That is plain binary. Gray code is binary XORed with itself shifted right one place." },
        { text: bin(v ^ (v << 1) & 15, 4), why: "Shifted the wrong way. The rule is G = B XOR (B shifted <b>right</b>) — shifting left gives a different code entirely." },
        { text: bin(~v & 15, 4), why: "That inverts the bits, which is not what Gray code does." },
      ].filter((c, i, all) => i === 0 || c.text !== all[0].text),
      answer: 0,
      steps: [
        `Gray code is the binary value exclusive-ORed with itself shifted one place right:`,
        `<span class="math display" data-tex="G = B \\oplus (B \\gg 1) = ${bin(v, 4)} \\oplus ${bin(v >> 1, 4)} = ${bin(g, 4)}"></span>`,
        `<b>${bin(g, 4)}.</b> The property that matters: <b>consecutive values differ in exactly one bit</b>, so a rotary encoder caught mid-transition can only ever be misread as one of its two neighbours — never as something wild. The same property is what makes Karnaugh maps work in Part 3.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "numbers",
    stem: "Convert 0b11010110 to hexadecimal.",
    tool: "group into nibbles of four",
    because: "16 is 2⁴, so each hex digit is exactly four bits — no arithmetic is needed.",
  },
  {
    part: "numbers",
    stem: "An 8-bit register holds 11001011. What signed value is that?",
    tool: "top bit set means negative — invert and add one to read the magnitude",
    because: "Two's complement is not sign-magnitude; the lower bits are not a plain magnitude.",
  },
  {
    part: "numbers",
    stem: "0x7F + 0x01 in an 8-bit signed register. What went wrong?",
    tool: "signed overflow — carry in to the MSB differs from carry out",
    because: "Two positives producing a negative is the symptom; the carry flag would not catch it.",
  },
  {
    part: "numbers",
    stem: "Why is a rotary encoder wheel marked in Gray code?",
    tool: "consecutive values differ in one bit",
    because: "A reading caught mid-transition can only be one of its two neighbours, never a wild value.",
  },
]);

/* ==========================================================================
   Part 2 — Boolean logic and gates
   ========================================================================== */

const GFN = {
  AND: (a, b) => a & b, OR: (a, b) => a | b,
  NAND: (a, b) => 1 - (a & b), NOR: (a, b) => 1 - (a | b),
  XOR: (a, b) => a ^ b, XNOR: (a, b) => 1 - (a ^ b),
};

defineProblem("truth-eval", {
  topic: "Evaluating a logic expression",
  lookup: "Electrical → Digital → Boolean logic",
  make(rng) {
    const form = rng.pick(["gate", "expr"]);

    if (form === "gate") {
      const g = rng.pick(Object.keys(GFN));
      const a = rng.int(0, 1), b = rng.int(0, 1);
      const y = GFN[g](a, b);
      const opp = { AND: "NAND", NAND: "AND", OR: "NOR", NOR: "OR", XOR: "XNOR", XNOR: "XOR" }[g];
      return {
        stem: `A two-input ${g} gate has A = ${a} and B = ${b}. What is its output?`,
        choices: [
          { text: `${y}`, why: "" },
          { text: `${1 - y}`, why: `That is what a <b>${opp}</b> would give — the bubble was added or dropped. ${g.startsWith("N") ? `A ${g} is an ${opp} with its output inverted.` : `A ${g} has no output bubble.`}` },
          { text: "high impedance", why: "A normal logic gate always drives its output. Only a tri-state buffer can float." },
          { text: "undefined", why: "Every input combination of a combinational gate has a defined output — that is what the truth table is." },
        ],
        answer: 0,
        steps: [
          `${g === "AND" ? "AND is true only when every input is true." : g === "OR" ? "OR is true when any input is true." : g === "NAND" ? "NAND is AND with the output inverted — false only when every input is true." : g === "NOR" ? "NOR is OR inverted — true only when every input is false." : g === "XOR" ? "XOR is true when the inputs <b>differ</b>." : "XNOR is true when the inputs <b>match</b>."}`,
          `<span class="math display" data-tex="A = ${a}, \\ B = ${b} \\ \\Rightarrow \\ Y = ${y}"></span>`,
          `<b>${y}.</b>`,
        ],
      };
    }

    // a three-variable SOP expression, evaluated at one point
    const A = rng.int(0, 1), B = rng.int(0, 1), C = rng.int(0, 1);
    const kind = rng.pick(["sop", "absorb"]);
    const y = kind === "sop"
      ? ((A & ~B & 1) | (B & C)) & 1
      : (A | ((1 - A) & B)) & 1;
    const tex = kind === "sop" ? "Y = A\\bar{B} + BC" : "Y = A + \\bar{A}B";
    const plain = kind === "sop" ? "Y = A·¬B + B·C" : "Y = A + ¬A·B";

    return {
      stem: `Evaluate ${T(tex)} at A = ${A}, B = ${B}${kind === "sop" ? `, C = ${C}` : ""}.`,
      choices: [
        { text: `${y}`, why: "" },
        { text: `${1 - y}`, why: kind === "sop" ? "Check the complement bar — <span class='math'>\\bar{B}</span> is 1 when B is <b>0</b>." : "Check the bar on the second term." },
        { text: "cannot be evaluated without C", why: kind === "sop" ? "C is given." : "C does not appear in this expression." },
        { text: "2", why: "Boolean values are only ever 0 or 1. <b>+ is OR, not addition</b> — 1 + 1 = 1." },
      ],
      answer: 0,
      steps: kind === "sop"
        ? [
            `Take the terms one at a time, remembering the bar inverts:`,
            `<span class="math display" data-tex="A\\bar{B} = (${A})(${1 - B}) = ${A & (1 - B)}, \\qquad BC = (${B})(${C}) = ${B & C}"></span>`,
            `OR them together — and <b>OR saturates</b>, so any 1 makes the whole thing 1:`,
            `<span class="math display" data-tex="Y = ${A & (1 - B)} + ${B & C} = ${y}"></span>`,
            `<b>${y}.</b>`,
          ]
        : [
            `<span class="math display" data-tex="Y = A + \\bar{A}B = ${A} + (${1 - A})(${B}) = ${A} + ${(1 - A) & B} = ${y}"></span>`,
            `<b>${y}.</b> Worth noticing: this expression simplifies to ${T("A + B")} by absorption — if A is true the output is true regardless, and if A is false the second term reduces to B. <b>Check that against your answer: A + B = ${A | B}</b> ✓`,
          ],
    };
  },
});

defineProblem("demorgan", {
  topic: "De Morgan's theorem",
  lookup: "Electrical → Digital → Boolean logic (De Morgan)",
  make(rng) {
    const form = rng.pick(["apply", "identify"]);

    if (form === "identify") {
      const which = rng.pick(["nand", "nor"]);
      const right = which === "nand"
        ? "An OR gate with bubbles on both inputs and no output bubble"
        : "An AND gate with bubbles on both inputs and no output bubble";
      return {
        stem: `Which symbol is equivalent to a two-input ${which.toUpperCase()} gate?`,
        choices: [
          { text: right, why: "" },
          { text: which === "nand"
              ? "An AND gate with bubbles on both inputs and no output bubble"
              : "An OR gate with bubbles on both inputs and no output bubble",
            why: `The gate body must <b>change</b> when the bubbles move. De Morgan turns AND into OR and back — moving bubbles without swapping the body gives a different function entirely.` },
          { text: "The same gate with the output bubble removed", why: `That is a plain ${which === "nand" ? "AND" : "OR"}, which is the complement of what was asked for.` },
          { text: "An XOR gate", why: "XOR is not related to either by De Morgan." },
        ],
        answer: 0,
        steps: [
          which === "nand"
            ? `<span class="math display" data-tex="\\overline{A \\cdot B} = \\bar{A} + \\bar{B}"></span>`
            : `<span class="math display" data-tex="\\overline{A + B} = \\bar{A} \\cdot \\bar{B}"></span>`,
          `Read the right-hand side as a drawing: ${which === "nand" ? "an <b>OR</b> of two inverted inputs" : "an <b>AND</b> of two inverted inputs"}.`,
          `<b>${right}.</b> The rule to carry: <b>break the bar, change the operator, and every bubble moves to the other side.</b>`,
        ],
      };
    }

    const cases = [
      { q: "\\overline{A \\cdot B \\cdot C}", a: "\\bar{A} + \\bar{B} + \\bar{C}", w: "\\bar{A}\\bar{B}\\bar{C}" },
      { q: "\\overline{A + B + C}", a: "\\bar{A}\\bar{B}\\bar{C}", w: "\\bar{A} + \\bar{B} + \\bar{C}" },
      { q: "\\overline{\\bar{A} + B}", a: "A\\bar{B}", w: "\\bar{A}B" },
      { q: "\\overline{A\\bar{B}}", a: "\\bar{A} + B", w: "\\bar{A}B" },
    ];
    const c = rng.pick(cases);
    return {
      stem: `Simplify ${T(c.q)} using De Morgan's theorem.`,
      choices: [
        { text: T(c.a), why: "" },
        { text: T(c.w), why: "<b>The operator was not changed.</b> De Morgan does two things at once: it distributes the bar onto each variable <em>and</em> swaps AND for OR." },
        { text: T(c.q.replace("\\overline{", "").replace(/\}$/, "")), why: "The complement was simply dropped." },
        { text: T(`\\overline{${c.a}}`), why: "Complemented twice — the result is back where it started." },
      ],
      answer: 0,
      steps: [
        `De Morgan: <b>break the bar and change the sign.</b>`,
        `<span class="math display" data-tex="${c.q} = ${c.a}"></span>`,
        `Each variable picks up its own complement, and every AND becomes an OR (or the reverse). <b>Applying it to a whole expression means doing this at every level of the bar.</b>`,
      ],
    };
  },
});

defineProblem("gate-count", {
  topic: "Universal gates and CMOS cost",
  lookup: "Electrical → Digital → Logic gates and circuits",
  make(rng) {
    const q = rng.pick(["universal", "transistors", "inverter", "static"]);
    const Q = {
      universal: {
        stem: "Which statement about NAND gates is correct?",
        right: "Any Boolean function can be built from NAND gates alone",
        wrong: [
          ["NAND can build AND and OR but not NOT", "NOT is the easy one — <b>tie both NAND inputs together</b> and ¬(A·A) = ¬A."],
          ["NAND is universal only when combined with NOR", "Either one alone is universal. Mixing them is unnecessary."],
          ["Only XOR is universal", "XOR is <b>not</b> universal — no arrangement of XOR gates alone can produce a constant 0 or an AND."],
        ],
        why: "Build NOT by tying the inputs, AND as NAND-then-NOT, and OR by inverting both inputs before NANDing — which is De Morgan. With those three, every function follows.",
      },
      transistors: {
        stem: "How many transistors does a two-input CMOS NAND gate use?",
        right: "4",
        wrong: [
          ["2", "That is an inverter — one PMOS and one NMOS."],
          ["6", "That is a CMOS <b>AND</b>: a NAND (4) plus an inverter (2). There is no direct AND in CMOS."],
          ["8", "More than needed. Each input drives exactly one PMOS and one NMOS."],
        ],
        why: "Two PMOS in parallel pulling up and two NMOS in series pulling down — one pair per input. <b>An AND needs six</b>, because CMOS builds it as a NAND with an inverter on the end, which is why silicon is mostly NAND.",
      },
      inverter: {
        stem: "How do you make an inverter from a single two-input NAND gate?",
        right: "Tie both inputs together",
        wrong: [
          ["Tie one input low", "That forces the output permanently <b>high</b>, since NAND is false only when both inputs are true."],
          ["Tie the output back to an input", "That creates a feedback loop, not an inverter — and an unstable one."],
          ["It cannot be done with one gate", "It can, and it is the first step in proving NAND is universal."],
        ],
        why: "With both inputs at A, the gate computes ¬(A·A) = ¬A. Tying an input <b>high</b> works too, giving ¬(1·A) = ¬A — but tying it <b>low</b> pins the output high instead.",
      },
      static: {
        stem: "Why does a CMOS gate consume almost no power while holding a steady value?",
        right: "The pull-up and pull-down networks are complements, so they never conduct at once",
        wrong: [
          ["MOSFETs have no resistance", "They have plenty when conducting; the point is that a complete path never exists."],
          ["The supply voltage is very low", "Lower voltage reduces <b>switching</b> power, but a bipolar gate at the same voltage would still draw standing current."],
          ["Its capacitance stores the energy", "Capacitance is what costs power when the gate <em>switches</em>, not what saves it at rest."],
        ],
        why: "Exactly one network conducts for any input, so there is never a path from supply to ground. Power is spent only in <b>switching</b>, which is why it goes as CV²f and why clock frequency and supply voltage are the two knobs on a chip's power budget.",
      },
    }[q];

    return {
      stem: Q.stem,
      choices: [{ text: Q.right, why: "" }, ...Q.wrong.map(([t, w]) => ({ text: t, why: w }))],
      answer: 0,
      steps: [`<b>${Q.right}.</b>`, Q.why],
    };
  },
});

defineProblem("logic-block", {
  topic: "Combinational building blocks",
  lookup: "Electrical → Digital → Logic gates and circuits",
  make(rng) {
    const q = rng.pick(["mux", "decoder", "adder", "which"]);

    if (q === "mux" || q === "decoder") {
      const n = rng.pick([2, 3, 4, 5]);
      const isMux = q === "mux";
      const right = isMux ? `${2 ** n} data inputs and 1 output` : `${n} inputs and ${2 ** n} outputs`;
      return {
        stem: isMux
          ? `A multiplexer has ${n} select lines. How many data inputs and outputs does it have?`
          : `A decoder has ${n} input lines. How many outputs does it have?`,
        choices: [
          { text: isMux ? right : `${2 ** n}`, why: "" },
          { text: isMux ? `${n} data inputs and 1 output` : `${n}`, why: "That is the number of <b>select or address</b> lines, not the number of lines they address. The relationship is exponential: n lines select among 2ⁿ things." },
          { text: isMux ? `${2 ** n} data inputs and ${2 ** n} outputs` : `${2 * n}`, why: isMux ? "A multiplexer has exactly <b>one</b> output — choosing one of many is its whole job." : "Doubling is not the rule; each extra input line <b>doubles</b> the outputs." },
          { text: isMux ? `${2 * n} data inputs and 1 output` : `${2 ** n - 1}`, why: isMux ? "The count is 2ⁿ, not 2n." : "All 2ⁿ combinations get an output, including the all-zeros one." },
        ],
        answer: 0,
        steps: [
          `${n} binary lines take ${T(`2^{${n}} = ${2 ** n}`)} distinct values.`,
          isMux
            ? `A multiplexer uses them to pick <b>one of ${2 ** n}</b> data inputs and route it to its single output.`
            : `A decoder asserts <b>exactly one of ${2 ** n}</b> outputs, one for each input combination.`,
          `<b>${isMux ? right : `${2 ** n} outputs`}.</b> A multiplexer and a decoder are mirror images, and the select lines are always the <em>exponent</em>.`,
        ],
      };
    }

    if (q === "adder") {
      const which = rng.pick(["sum", "carry"]);
      return {
        stem: `What gate produces the ${which} output of a half adder?`,
        choices: [
          { text: which === "sum" ? "XOR" : "AND", why: "" },
          { text: which === "sum" ? "AND" : "XOR", why: which === "sum" ? "AND gives the <b>carry</b>. The sum bit is 1 when exactly one input is 1, which is XOR." : "XOR gives the <b>sum</b>. A carry only happens when both inputs are 1, which is AND." },
          { text: "OR", why: "OR would give 1 for the 1+1 case as well as the single-1 cases, which is right for neither output." },
          { text: "NAND", why: "Universal, so it could be built from NANDs — but the direct answer is a single gate." },
        ],
        answer: 0,
        steps: [
          `Write the one-bit addition out: 0+0 = 0 carry 0, 0+1 = 1 carry 0, 1+0 = 1 carry 0, 1+1 = <b>0 carry 1</b>.`,
          `The sum column is 0,1,1,0 — true when the inputs <b>differ</b>, which is ${T("A \\oplus B")}.`,
          `The carry column is 0,0,0,1 — true only when both are 1, which is ${T("A \\cdot B")}.`,
          `<b>${which === "sum" ? "XOR" : "AND"}.</b> A full adder adds a carry-in and becomes ${T("A \\oplus B \\oplus C_{in}")} for the sum.`,
        ],
      };
    }

    const jobs = [
      ["route one of eight sensor signals to a single ADC input", "multiplexer", "It selects one of many inputs — that is exactly what a MUX does."],
      ["activate exactly one of sixteen memory chips from a 4-bit address", "decoder", "One output active per input combination is a decoder's definition."],
      ["turn a set of push-button lines into a binary code", "priority encoder", "An encoder converts one-hot inputs to binary; the priority version also resolves simultaneous presses."],
      ["compare two 4-bit words for equality", "XNOR gates and an AND", "XNOR is a one-bit equality test, and ANDing four of them checks the whole word."],
    ];
    const [job, right, why] = rng.pick(jobs);
    return {
      stem: `Which block would you use to ${job}?`,
      choices: [
        { text: right, why: "" },
        ...jobs.filter((j) => j[1] !== right).slice(0, 3).map((j) => ({
          text: j[1], why: `That block ${j[1] === "multiplexer" ? "selects one of many inputs" : j[1] === "decoder" ? "activates one output per input code" : j[1] === "priority encoder" ? "converts one-hot inputs into binary" : "compares words bit by bit"}, which is not what this task asks for.`,
        })),
      ],
      answer: 0,
      steps: [`<b>${right}.</b>`, why,
        `The four blocks worth recognising on sight: <b>MUX</b> selects, <b>decoder</b> activates one of many, <b>encoder</b> compresses one-hot to binary, and <b>XNOR</b> compares.`],
    };
  },
});

defineReflex([
  {
    part: "gates",
    stem: "A schematic shows an OR gate with bubbles on both inputs. What is it?",
    tool: "De Morgan — that is a NAND",
    because: "Break the bar and change the operator; the two drawings are the same circuit.",
  },
  {
    part: "gates",
    stem: "You have only NAND gates and need an inverter.",
    tool: "tie both inputs together",
    because: "¬(A·A) = ¬A, which is the first step in proving NAND universal.",
  },
  {
    part: "gates",
    stem: "How many transistors in a two-input CMOS NAND?",
    tool: "four — two PMOS in parallel, two NMOS in series",
    because: "AND takes six, because CMOS builds it as a NAND plus an inverter.",
  },
  {
    part: "gates",
    stem: "A multiplexer has 4 select lines. How many data inputs?",
    tool: "2ⁿ = 16",
    because: "Select lines are always the exponent, never the base.",
  },
]);

/* ==========================================================================
   Part 3 — minimisation
   ========================================================================== */

const KVARS = ["A", "B", "C", "D"];

/* The solver lives in lib/boolean.js, shared with the Karnaugh-map plate and
   the state-assignment plate, so a bench answer can never drift from the
   grouping a reader just watched being drawn. Bench text uses A' rather than
   an overbar, since answer strings are set in plain type. */
const kcover = (on, dc, n) => cover(on, dc, n).map((t) => ({ ...t, val: t.value }));
const kterm = (mask, val, n) => termText(mask, val, n, KVARS, "'");
const kliterals = (mask, n) => literals(mask, n);

defineProblem("sop-write", {
  topic: "Canonical SOP and POS",
  lookup: "Electrical → Digital → Logic minimization",
  make(rng) {
    const n = 3;
    const on = rng.sample([0, 1, 2, 3, 4, 5, 6, 7], rng.int(3, 4)).sort((a, b) => a - b);
    const off = [0, 1, 2, 3, 4, 5, 6, 7].filter((m) => !on.includes(m));
    const wantSop = rng.pick([true, false]);

    const sopTerm = (m) => [0, 1, 2].map((i) => KVARS[i] + ((m >> (2 - i)) & 1 ? "" : "'")).join("");
    const posTerm = (m) => "(" + [0, 1, 2].map((i) => KVARS[i] + ((m >> (2 - i)) & 1 ? "'" : "")).join(" + ") + ")";

    const right = wantSop ? on.map(sopTerm).join(" + ") : off.map(posTerm).join("");
    const swapped = wantSop ? off.map(sopTerm).join(" + ") : on.map(posTerm).join("");
    const flipped = wantSop
      ? on.map((m) => [0, 1, 2].map((i) => KVARS[i] + ((m >> (2 - i)) & 1 ? "'" : "")).join("")).join(" + ")
      : off.map((m) => "(" + [0, 1, 2].map((i) => KVARS[i] + ((m >> (2 - i)) & 1 ? "" : "'")).join(" + ") + ")").join("");

    return {
      stem: `A three-variable function is 1 for minterms ${on.join(", ")} and 0 elsewhere. ` +
            `Write its canonical ${wantSop ? "sum of products" : "product of sums"}.`,
      choices: [
        { text: right, why: "" },
        { text: swapped, why: wantSop ? "Those are the rows where the function is <b>0</b>. SOP uses the 1-rows." : "Those are the rows where the function is <b>1</b>. POS uses the <b>0</b>-rows." },
        { text: flipped, why: `The complementing rule is reversed. In <b>${wantSop ? "SOP a variable is complemented when it is 0" : "POS a variable is complemented when it is 1"}</b> in that row — and the two forms use opposite rules, which is where most errors in this topic come from.` },
        { text: wantSop ? off.map(posTerm).join("") : on.map(sopTerm).join(" + "), why: `That is the ${wantSop ? "POS" : "SOP"} form of the same function — correct, but not what was asked for.` },
      ],
      answer: 0,
      steps: [
        wantSop
          ? `Take one AND term for each row where the output is <b>1</b>. Within a term, a variable appears <b>complemented if it is 0</b> in that row.`
          : `Take one OR term for each row where the output is <b>0</b>. Within a term, a variable appears <b>complemented if it is 1</b> in that row — the opposite of the SOP rule.`,
        `<span class="math display" data-tex="${wantSop ? on.join(",\\ ") : off.join(",\\ ")} \\ \\Rightarrow \\ \\text{${right}}"></span>`,
        `<b>${right}.</b> This is canonical, not minimal — every term has all three variables. Part 3's map is what shortens it.`,
      ],
    };
  },
});

defineProblem("kmap-group", {
  topic: "Minimising with a Karnaugh map",
  lookup: "Electrical → Digital → Karnaugh maps",
  make(rng) {
    const sets = [
      { on: [0, 2, 8, 10], dc: [], hint: "the four corners — the edges wrap, so they are one group of four" },
      { on: [0, 1, 4, 5], dc: [], hint: "two pairs of adjacent cells forming one group of four" },
      { on: [10, 11, 12, 13, 14, 15], dc: [], hint: "two overlapping groups of four" },
      { on: [0, 1, 2, 3, 4, 5, 6, 7], dc: [], hint: "an entire half of the map — one variable" },
      { on: [5, 7, 13, 15], dc: [], hint: "a group of four spanning both halves" },
      { on: [1, 3, 5, 7, 9, 11, 13, 15], dc: [], hint: "every odd minterm — one variable again" },
    ];
    const s = rng.pick(sets);
    const g = kcover(s.on, s.dc, 4);
    const answer = g.map((t) => kterm(t.mask, t.val, 4)).join(" + ");
    const lits = g.reduce((a, t) => a + kliterals(t.mask, 4), 0);

    return {
      stem: `Minimise ${T(`F = \\sum m(${s.on.join(", ")})`)} for variables A, B, C, D.`,
      choices: [
        { text: answer, why: "" },
        { text: s.on.map((m) => kterm(15, m, 4)).join(" + "),
          why: `That is the <b>canonical</b> SOP — one four-literal term per minterm, ${s.on.length * 4} literals in all. It is correct but not minimised; the map exists to collapse it to ${lits}.` },
        { text: g.length > 1 ? kterm(g[0].mask, g[0].val, 4) : `${answer} + ${kterm(15, s.on[0], 4)}`,
          why: g.length > 1 ? "Only one group. Every 1 on the map has to end up inside some group, and this leaves some uncovered." : "That adds a redundant term already covered by the group." },
        { text: answer.split(" + ").map((t) => t.replace(/'/g, "")).join(" + "),
          why: "The complements were dropped. A variable stays in the term with a bar when it is <b>0</b> throughout the group." },
      ].filter((c, i, all) => i === 0 || c.text !== all[0].text),
      answer: 0,
      steps: [
        `Plot the on-set and look for the largest legal groups — ${s.hint}.`,
        `Each doubling of a group size deletes one variable: a group of ${T("2^k")} in a four-variable map leaves ${T("4-k")} literals.`,
        `<span class="math display" data-tex="F = \\text{${answer}}"></span>`,
        `<b>${answer}</b> — ${g.length} term${g.length === 1 ? "" : "s"}, ${lits} literal${lits === 1 ? "" : "s"}, down from ${s.on.length * 4}.`,
      ],
    };
  },
});

defineProblem("kmap-size", {
  topic: "Group size and literals",
  lookup: "Electrical → Digital → Karnaugh maps (grouping)",
  make(rng) {
    const n = rng.pick([3, 4]);
    const k = rng.int(1, n - 1);
    const size = 2 ** k;
    const lits = n - k;
    const ask = rng.pick(["lits", "valid"]);

    if (ask === "valid") {
      const bad = rng.pick([3, 5, 6, 7]);
      return {
        stem: `On a Karnaugh map, can ${bad} adjacent 1-cells be grouped as a single term?`,
        choices: [
          { text: "No — groups must be a power of two", why: "" },
          { text: `Yes, giving a term with ${n - Math.log2(bad) | 0} literals`, why: "Group sizes are 1, 2, 4, 8, 16 and nothing else. A group of a non-power-of-two size does not correspond to any product term." },
          { text: "Yes, but only if they include a don't-care", why: "A don't-care could <em>pad</em> the group up to a power of two — but the group itself must still end up at 1, 2, 4, 8 or 16 cells." },
          { text: "Only on maps of four variables or more", why: "The rule is the same on every size of map." },
        ],
        answer: 0,
        steps: [
          `Every doubling of a group deletes exactly one variable, which is why sizes go 1, 2, 4, 8, 16.`,
          `A group of ${bad} does not correspond to any product term — there is no way to fix some variables and leave others free that yields ${bad} cells.`,
          `<b>No.</b> Cover those cells with overlapping power-of-two groups instead; overlap is free, because ${T("A + A = A")}.`,
        ],
      };
    }

    return {
      stem: `On a ${n}-variable Karnaugh map, how many literals does a group of ${size} cells produce?`,
      choices: [
        { text: `${lits}`, why: "" },
        { text: `${n}`, why: "That is a group of <b>one</b> cell — the canonical case, where no variable has been eliminated." },
        { text: `${k}`, why: `That is ${T("\\log_2")} of the group size, which is the number of variables <b>eliminated</b>, not the number left.` },
        { text: `${size}`, why: "That is the number of cells, not literals. Bigger groups give <em>shorter</em> terms." },
      ].filter((c, i, all) => i === 0 || c.text !== all[0].text),
      answer: 0,
      steps: [
        `Each doubling of a group means one more variable takes both values inside it, so that variable drops out:`,
        `<span class="math display" data-tex="\\text{literals} = n - \\log_2(\\text{size}) = ${n} - ${k} = ${lits}"></span>`,
        `<b>${lits}.</b> Which is why the rule is always <b>take the largest group you legally can</b>, even if it overlaps one already drawn.`,
      ],
    };
  },
});

defineProblem("pld-type", {
  topic: "Programmable logic devices",
  lookup: "Electrical → Digital → Programmable logic devices",
  make(rng) {
    const q = rng.pick(["pla", "rom", "fpga", "why"]);
    const Q = {
      pla: {
        stem: "In a PLA, which arrays are programmable?",
        right: "Both the AND array and the OR array",
        wrong: [
          ["Only the AND array", "That is a <b>PAL</b> — cheaper and faster, with each output allocated a fixed set of product rows."],
          ["Only the OR array", "That is a <b>ROM</b>, whose AND array is a fixed full decoder generating every minterm."],
          ["Neither — a PLA is fixed logic", "Programmability is what the P stands for."],
        ],
        why: "The general case: any product term can be formed, and any output can sum any subset of them. That flexibility is what distinguishes it from the PAL, which fixes the OR plane to make the part cheaper.",
      },
      rom: {
        stem: "Why can a ROM implement any Boolean function of its address inputs without minimisation?",
        right: "Its decoder generates every minterm, so the stored data selects which ones to OR",
        wrong: [
          ["ROMs contain a general-purpose processor", "A ROM is a decoder and a memory array, nothing more."],
          ["Because the function is minimised automatically when programmed", "No minimisation happens. The full truth table is simply stored."],
          ["It cannot — a ROM only stores data, not logic", "Storing a truth table <b>is</b> implementing the function; address in, result out."],
        ],
        why: "A full decoder on n address lines produces all 2ⁿ minterms, so the OR plane is just a table of which minterms belong to each output. You store the truth table and are done — at the cost of 2ⁿ rows whether you need them or not.",
      },
      fpga: {
        stem: "What does an FPGA use in place of AND-OR arrays?",
        right: "Lookup tables holding truth tables directly, plus programmable routing",
        wrong: [
          ["A larger PLA on the same die", "FPGAs abandoned the array structure; LUTs and routing scale far better."],
          ["Fixed gates selected by fuses", "That describes early PALs, not FPGAs."],
          ["A microprocessor executing the logic in software", "That is a very different device. An FPGA's logic is genuinely parallel hardware."],
        ],
        why: "A 4- or 6-input LUT is a tiny memory storing the function's truth table — so <b>it does not care whether your expression was minimised</b>. That is why Karnaugh maps matter far less in FPGA design than in discrete logic, and it is worth knowing which world a question is set in.",
      },
      why: {
        stem: "Why minimise an expression before implementing it in a PLA?",
        right: "Fewer terms means fewer product rows, and fewer literals means fewer connections",
        wrong: [
          ["It makes the circuit faster in every case", "Propagation delay through a PLA is largely fixed by the array structure, not by how many rows are used."],
          ["An unminimised expression would give the wrong answer", "It would give the <b>right</b> answer, just using more silicon than necessary."],
          ["PLAs cannot implement unminimised expressions", "They can, up to the number of rows the part provides."],
        ],
        why: "The array structure maps a sum of products onto physical rows, so the term count is literally the row count. Minimisation is a silicon-area argument, and it evaporates the moment you move to an FPGA's lookup tables.",
      },
    }[q];

    return {
      stem: Q.stem,
      choices: [{ text: Q.right, why: "" }, ...Q.wrong.map(([t, w]) => ({ text: t, why: w }))],
      answer: 0,
      steps: [`<b>${Q.right}.</b>`, Q.why],
    };
  },
});

defineReflex([
  {
    part: "minimisation",
    stem: "A 4-variable map has 1s in all four corners. What is the minimal term?",
    tool: "group all four — the edges wrap",
    because: "The map is a torus, so left joins right and top joins bottom; the corners are one group of four.",
  },
  {
    part: "minimisation",
    stem: "A group of eight cells on a 4-variable map. How many literals?",
    tool: "literals = n − log₂(size) = 4 − 3 = 1",
    because: "Every doubling of a group deletes one variable, which is why bigger groups are always better.",
  },
  {
    part: "minimisation",
    stem: "The map has three cells marked ×. What do you do with them?",
    tool: "use them to enlarge groups, ignore them otherwise",
    because: "Don't-cares are free — treating them as 0 by default throws away the only advantage they offer.",
  },
  {
    part: "minimisation",
    stem: "Writing a POS from a truth table: which rows and which sign?",
    tool: "the 0-rows, complementing variables that are 1",
    because: "Both rules are the reverse of the SOP ones, which is where nearly every error in this topic comes from.",
  },
]);

/* ==========================================================================
   Part 4 — flip-flops and counters (15.E)
   ========================================================================== */

/* Characteristic behaviour, in the same order the plate walks it. */
const FF = {
  D:  { ins: ["D"],      next: (q, [d]) => d },
  T:  { ins: ["T"],      next: (q, [t]) => (t ? 1 - q : q) },
  JK: { ins: ["J", "K"], next: (q, [j, k]) => (j && k ? 1 - q : j ? 1 : k ? 0 : q) },
  SR: { ins: ["S", "R"], next: (q, [s, r]) => (s && r ? -1 : s ? 1 : r ? 0 : q) },
};

defineProblem("ff-next", {
  topic: "Characteristic tables",
  lookup: "Electrical → Digital → Flip-flops and counters",
  make(rng) {
    const type = rng.pick(["D", "T", "JK", "JK", "SR"]);   // JK twice: it is the examinable one
    const F = FF[type];
    const q = rng.pick([0, 1]);
    const ins = F.ins.map(() => rng.pick([0, 1]));
    const nq = F.next(q, ins);
    const shown = F.ins.map((n, i) => `${n} = ${ins[i]}`).join(", ");

    if (nq < 0) {
      return {
        stem: `An SR flip-flop is holding Q = ${q}. A clock edge arrives with S = 1, R = 1. What is Q afterwards?`,
        choices: [
          { text: "Undefined — this input combination is forbidden", why: "" },
          { text: "0", why: "Nothing guarantees 0. Both outputs are driven the same way, and which one wins when the inputs are released is a race between two gate delays." },
          { text: "1", why: "Nothing guarantees 1 either, for the same reason." },
          { text: `${q} — it holds`, why: "Hold is S = R = <b>0</b>. Driving both high is the opposite instruction: set and reset at once." },
        ],
        answer: 0,
        steps: [
          `<b>Undefined.</b> S = R = 1 tells the latch to set and reset simultaneously, so both Q and Q̄ go to the same level — they are no longer complements, and the device is not in a legal state.`,
          `Worse than the moment itself is what follows: when the inputs return to 0, whichever gate is fractionally faster wins, so the settled value is <b>unpredictable</b>.`,
          `This forbidden corner is the whole reason the JK exists. The JK takes the same combination and <em>defines</em> it as <b>toggle</b> — which is also what makes a JK able to count.`,
        ],
      };
    }

    const wrong = [];
    const push = (v, w) => { if (v !== nq && !wrong.some((x) => x[0] === v)) wrong.push([v, w]); };
    if (type === "JK") {
      push(1 - nq, ins[0] && ins[1]
        ? "J = K = 1 is <b>toggle</b>, not hold. That is the one combination that separates JK from SR."
        : "Check the table again: J sets, K resets, both low holds, both high toggles.");
      push(q, "That is the hold result, which needs J = K = 0.");
    } else if (type === "T") {
      push(1 - nq, ins[0] ? "T = 1 toggles — the output must change." : "T = 0 holds — the output must not change.");
      push(ins[0], "T is not copied to Q; that is what a <b>D</b> flip-flop does. T says whether to flip.");
    } else if (type === "D") {
      push(1 - nq, "D is copied straight through at the edge, so Q takes D's value.");
      push(q, "That would be a hold, but a D flip-flop has no hold input — every edge loads D.");
    } else {
      push(1 - nq, "S sets to 1, R resets to 0, and both low holds. Re-read which is which.");
      push(q, "That is the hold result, which needs S = R = 0.");
    }
    const choices = [{ text: `${nq}`, why: "" }, ...wrong.map(([v, w]) => ({ text: `${v}`, why: w }))];
    choices.push({ text: "Undefined", why: type === "SR"
      ? "Only S = R = 1 is forbidden on an SR flip-flop. This combination is perfectly legal."
      : `A ${type} flip-flop has no forbidden combination — that is a property of <b>SR</b> alone.` });

    const rule = {
      D: "Q⁺ = D. The edge copies D across; nothing else can happen.",
      T: `Q⁺ = T ⊕ Q. T = 1 toggles, T = 0 holds.`,
      JK: "Q⁺ = J·Q̄ + K̄·Q. J alone sets, K alone resets, both low holds, <b>both high toggles</b>.",
      SR: "Q⁺ = S + R̄·Q, valid only while S·R = 0. S sets, R resets, both low holds.",
    }[type];

    return {
      stem: `A ${type} flip-flop is holding Q = ${q}. A clock edge arrives with ${shown}. What is Q afterwards?`,
      choices,
      answer: 0,
      steps: [
        rule,
        `With Q = ${q} and ${shown}, that gives <b>Q⁺ = ${nq}</b>.`,
        type === "JK" && ins[0] && ins[1]
          ? "J = K = 1 is the combination SR forbids and JK puts to work. A JK wired this way is a T flip-flop, and a chain of them is a counter."
          : "Read the current Q first, then the inputs — the characteristic equation needs both, and reaching for the inputs alone is the usual slip.",
      ],
    };
  },
});

defineProblem("ff-excite", {
  topic: "Excitation tables",
  lookup: "Electrical → Digital → Flip-flops and counters",
  make(rng) {
    const type = rng.pick(["JK", "JK", "D", "T"]);
    const q = rng.pick([0, 1]);
    const nq = rng.pick([0, 1]);
    const label = `${q} → ${nq}`;

    if (type === "D") {
      return {
        stem: `A D flip-flop must make the transition Q = ${label} at the next edge. What must D be?`,
        choices: options(
          { text: `D = ${nq}`, why: "" },
          [
            { text: `D = ${1 - nq}`, why: "D is copied to Q, so D must equal the value you <b>want</b>, not the one you have." },
            { text: "D = Q — hold the present value", why: "A D flip-flop has no hold input. Every edge loads whatever D is showing." },
            { text: "D = ×, either works", why: "A D flip-flop never has a don't-care — every edge loads D, so D is always fully determined." },
          ]),
        answer: 0,
        steps: [
          `The excitation table for a D flip-flop is trivial: <b>D = Q⁺</b>, always.`,
          `So for ${label}, D = <b>${nq}</b>.`,
          `<b>This is why D is the flip-flop state machines are designed with.</b> The excitation logic <em>is</em> the next-state logic — no translation step, and no don't-cares to exploit or get wrong.`,
        ],
      };
    }

    if (type === "T") {
      const t = q === nq ? 0 : 1;
      return {
        stem: `A T flip-flop must make the transition Q = ${label} at the next edge. What must T be?`,
        choices: options(
          { text: `T = ${t}`, why: "" },
          [
            { text: `T = ${1 - t}`, why: q === nq ? "The output must <b>not</b> change, so it must not be told to toggle." : "The output must change, and toggling is the only way a T flip-flop can change it." },
            { text: "T = Q⁺ — copy the target value", why: "That is what a <b>D</b> flip-flop does. T says <em>whether to flip</em>, not what to become." },
            { text: "T = ×, either works", why: "T is fully determined by the transition — a T flip-flop has no don't-cares." },
          ]),
        answer: 0,
        steps: [
          `<b>T = Q ⊕ Q⁺</b> — toggle when the value must change, hold when it must not.`,
          `${label} is ${q === nq ? "no change" : "a change"}, so T = <b>${t}</b>.`,
          `T flip-flops make counters cheap for exactly this reason: a bit that must flip every time simply gets T tied high.`,
        ],
      };
    }

    // JK — the one with don't-cares, and the reason excitation tables are worth a page
    const JK = { "0->0": ["0", "×"], "0->1": ["1", "×"], "1->0": ["×", "1"], "1->1": ["×", "0"] };
    const [j, k] = JK[`${q}->${nq}`];
    const right = `J = ${j}, K = ${k}`;
    const flip = `J = ${k}, K = ${j}`;
    const explain = {
      "0->0": "From 0, staying at 0 needs J = 0 (do not set). K is irrelevant — resetting an output that is already 0 changes nothing.",
      "0->1": "From 0, reaching 1 needs J = 1 (set). K is irrelevant: with J = 1 and K = 1 the flip-flop toggles to 1, and with K = 0 it sets to 1.",
      "1->0": "From 1, reaching 0 needs K = 1 (reset). J is irrelevant: with J = 1 it toggles to 0, with J = 0 it resets to 0.",
      "1->1": "From 1, staying at 1 needs K = 0 (do not reset). J is irrelevant — setting an output that is already 1 changes nothing.",
    }[`${q}->${nq}`];

    return {
      stem: `A JK flip-flop must make the transition Q = ${label} at the next edge. What must J and K be? (× is a don't-care.)`,
      choices: options(
        { text: right, why: "" },
        [
          { text: flip, why: "J and K are swapped. <b>J sets and K resets</b> — take the transition's destination first and ask which one it needs." },
          { text: `J = ${nq}, K = ${1 - nq}`, why: "That is the fully-specified answer you would write for an <b>SR</b> flip-flop. A JK has a don't-care in every row, and throwing it away costs you the simplification it was there to buy." },
          { text: "J = ×, K = ×", why: "Only one of the two is free. The other is what actually forces the transition." },
        ]),
      answer: 0,
      steps: [
        explain,
        `So ${label} needs <b>${right}</b>.`,
        `<b>Every JK row has a don't-care</b>, which is the whole reason the JK excitation table is worth memorising: those × entries drop into the Karnaugh map from Part 3 and routinely halve the input logic. That is the trade — a D flip-flop is simpler to design with, a JK is cheaper once designed.`,
      ],
    };
  },
});

defineProblem("counter-mod", {
  topic: "Counter modulus and frequency division",
  lookup: "Electrical → Digital → Flip-flops and counters",
  make(rng) {
    const q = rng.pick(["bits", "states", "divide", "mod"]);

    if (q === "bits") {
      const mod = rng.pick([10, 12, 24, 60, 100, 1000]);
      const n = Math.ceil(Math.log2(mod));
      return {
        stem: `How many flip-flops does a mod-${mod} counter need?`,
        choices: [
          { text: `${n}`, why: "" },
          { text: `${n - 1}`, why: `${n - 1} flip-flops reach only ${2 ** (n - 1)} states, which is fewer than ${mod}.` },
          { text: `${n + 1}`, why: `More than needed — ${n} already gives ${2 ** n} states, and ${mod} of them are enough.` },
          { text: `${mod}`, why: "That is one flip-flop per count, which is a <b>ring counter</b> — legal, but far more hardware than a binary counter needs." },
        ],
        answer: 0,
        steps: [
          `n flip-flops give 2ⁿ states, so you need the smallest n with ${T(`2^n \\ge ${mod}`)}.`,
          `<span class="math display" data-tex="n = \\lceil \\log_2 ${mod} \\rceil = ${n} \\quad (2^{${n}} = ${2 ** n})"></span>`,
          `<b>${n} flip-flops.</b> ${2 ** n > mod ? `That leaves ${2 ** n - mod} unused states, which the counter must be forced to skip — usually by decoding the count of ${mod} and using it to clear every stage.` : `${mod} is a power of two, so the count wraps on its own with no decoding at all.`}`,
        ],
      };
    }

    if (q === "states") {
      const n = rng.pick([3, 4, 5, 6, 8]);
      return {
        stem: `A binary ripple counter is built from ${n} flip-flops. How many distinct states does it pass through before repeating?`,
        choices: [
          { text: `${2 ** n}`, why: "" },
          { text: `${2 ** n - 1}`, why: "All-zeros is a state like any other. The count runs 0 through " + (2 ** n - 1) + ", which is 2ⁿ values." },
          { text: `${2 * n}`, why: "Two <em>per</em> flip-flop would be right only if they counted independently. They compound, so the states multiply: 2 × 2 × … = 2ⁿ." },
          { text: `${n}`, why: "That is the number of flip-flops, not the number of states." },
        ],
        answer: 0,
        steps: [
          `Each flip-flop contributes an independent bit, so ${n} of them hold ${T(`2^{${n}} = ${2 ** n}`)} distinct patterns.`,
          `<b>${2 ** n} states</b>, counting 0 to ${2 ** n - 1}.`,
          `The same arithmetic backwards is the more common exam question: a mod-N counter needs ⌈log₂N⌉ flip-flops.`,
        ],
      };
    }

    if (q === "divide") {
      const n = rng.pick([3, 4, 5, 6]);
      const fin = rng.pick([1, 2, 4, 8, 16, 32]);   // MHz
      const fout = fin / 2 ** n;
      const fmt = (f) => (f >= 1 ? `${num(f)} MHz` : `${num(f * 1000)} kHz`);
      return {
        stem: `A ${n}-bit binary counter is clocked at ${num(fin)} MHz. What is the frequency at its most significant output?`,
        choices: options(
          { text: fmt(fout), why: "" },
          [
            { text: fmt(fin / 2 ** (n - 1)), why: `That divides by 2^${n - 1}. Count the stages again — the last of ${n} divides by 2^${n}.` },
            { text: fmt(fin / (2 * n)), why: "That divides by 2n instead of 2ⁿ. Each stage <b>halves</b> the one before it, so the divisions multiply rather than add." },
            { text: fmt(fin / 2), why: "That is the <b>first</b> stage's output. Every further stage halves it again." },
          ],
          [
            { text: fmt(fin / 2 ** (n + 1)), why: `One stage too many — there are ${n}, not ${n + 1}.` },
            { text: fmt(fin), why: "That is the clock going in. Every stage divides it." },
            { text: fmt(fin / n), why: "That divides by the number of stages rather than by 2 per stage." },
          ]),
        answer: 0,
        steps: [
          `Every flip-flop in a binary counter toggles once per two edges of the stage before it, so <b>each stage divides by 2</b>.`,
          `<span class="math display" data-tex="f_{out} = \\frac{f_{in}}{2^n} = \\frac{${num(fin)}\\ \\text{MHz}}{2^{${n}}} = ${fout >= 1 ? num(fout) + "\\ \\text{MHz}" : num(fout * 1000) + "\\ \\text{kHz}"}"></span>`,
          `<b>${fmt(fout)}.</b> This is why counters are called dividers — the last stage of an n-bit counter is a divide-by-2ⁿ, and the trap is adding the stages instead of multiplying them.`,
        ],
      };
    }

    const n = rng.pick([3, 4, 5]);
    const mod = rng.pick([5, 6, 10, 12]);
    const dec = mod.toString(2).padStart(n, "0");
    return {
      stem: `A ${n}-bit binary counter is to be made mod-${mod}. Which count must be decoded to reset it?`,
      choices: [
        { text: `${mod} (binary ${dec})`, why: "" },
        { text: `${mod - 1} (binary ${(mod - 1).toString(2).padStart(n, "0")})`, why: `${mod - 1} is the <b>last count you want to keep</b>. Decoding it would clear the counter before that count was ever displayed, giving mod-${mod - 1}.` },
        { text: `${mod + 1} (binary ${(mod + 1).toString(2).padStart(n, "0")})`, why: `One count too late — the counter would show ${mod} as well, making it mod-${mod + 1}.` },
        { text: `0 (binary ${"0".repeat(n)})`, why: "The counter is already at 0 after a reset; decoding it would hold the counter there permanently." },
      ],
      answer: 0,
      steps: [
        `A mod-${mod} counter shows the counts 0 through ${mod - 1} — that is ${mod} states — and must return to 0 <b>on reaching ${mod}</b>.`,
        `So decode ${mod} = ${T(`${dec}_2`)} with an AND of the bits that are 1 there, and feed that into the asynchronous clear.`,
        `<b>Decode ${mod}, not ${mod - 1}.</b> Off-by-one here is the classic error: you decode the first count you do <em>not</em> want. The count of ${mod} does appear, for a few nanoseconds, which is exactly the glitch this technique is known for.`,
      ],
    };
  },
});

defineProblem("counter-timing", {
  topic: "Ripple against synchronous",
  lookup: "Electrical → Digital → Flip-flops and counters",
  make(rng) {
    const q = rng.pick(["fmax", "skew", "glitch", "compare"]);
    const n = rng.pick([4, 6, 8]);
    const tpd = rng.pick([5, 10, 15, 20, 25]);

    if (q === "fmax") {
      const worst = n * tpd;
      const f = 1000 / worst;
      return {
        stem: `A ${n}-bit ripple counter uses flip-flops with ${tpd} ns propagation delay. What is the highest clock frequency at which every output is settled before the next edge?`,
        choices: [
          { text: `${fixed(f, 1)} MHz`, why: "" },
          { text: `${fixed(1000 / tpd, 1)} MHz`, why: `That uses one stage's delay. In a ripple counter the stages are <b>in series</b> — each clocks the next — so the delays add across all ${n}.` },
          { text: `${fixed(1000 / (2 * tpd), 1)} MHz`, why: `That counts two stages. All ${n} of them contribute.` },
          { text: `${fixed(1000 / (tpd * 2 ** n), 2)} MHz`, why: "Delay accumulates once <b>per stage</b>, not once per state. It is n × t<sub>pd</sub>, not 2ⁿ × t<sub>pd</sub>." },
        ].filter((c, i, a) => i === 0 || c.text !== a[0].text),
        answer: 0,
        steps: [
          `Each flip-flop clocks the next, so the top bit does not move until the delay has propagated through all ${n} stages:`,
          `<span class="math display" data-tex="t_{worst} = n \\cdot t_{pd} = ${n} \\times ${tpd}\\ \\text{ns} = ${worst}\\ \\text{ns}"></span>`,
          `<span class="math display" data-tex="f_{max} = \\frac{1}{t_{worst}} = \\frac{1}{${worst}\\ \\text{ns}} = ${fixed(f, 1)}\\ \\text{MHz}"></span>`,
          `<b>${fixed(f, 1)} MHz.</b> Note what this says: <b>widening a ripple counter makes it slower</b>. A synchronous counter built from the same parts would not care about n at all.`,
        ],
      };
    }

    if (q === "skew") {
      const worst = n * tpd;
      return {
        stem: `In a ${n}-bit ripple counter with ${tpd} ns per stage, how long after the clock edge is the most significant bit valid?`,
        choices: [
          { text: `${worst} ns`, why: "" },
          { text: `${tpd} ns`, why: "That is the first stage. The MSB is at the end of the chain and waits for every stage ahead of it." },
          { text: `${(n - 1) * tpd} ns`, why: `Off by one stage — the count is ${n} flip-flops from the clock input to the MSB, not ${n - 1}.` },
          { text: "0 ns — all outputs change together", why: "That describes a <b>synchronous</b> counter. In a ripple counter only the first stage sees the clock." },
        ],
        answer: 0,
        steps: [
          `The clock reaches only the first flip-flop. Its output clocks the second, whose output clocks the third, and so on.`,
          `<span class="math display" data-tex="t_{MSB} = ${n} \\times ${tpd}\\ \\text{ns} = ${worst}\\ \\text{ns}"></span>`,
          `<b>${worst} ns.</b> For that whole window the counter's pins carry values it never actually counted, which is why a ripple counter's output must not be decoded directly.`,
        ],
      };
    }

    if (q === "glitch") {
      return {
        stem: "A 4-bit ripple counter goes from 0111 to 1000. What appears on its outputs in between?",
        choices: [
          { text: "0110, 0100, 0000 — each in turn, as the carry ripples", why: "" },
          { text: "Nothing; all four bits change simultaneously", why: "Only in a <b>synchronous</b> counter. Here each stage waits for the one before it." },
          { text: "1111, briefly", why: "No stage is ever set on the way down. The bits clear one at a time from the least significant end." },
          { text: "The outputs float until the count settles", why: "They are driven throughout — that is the problem. They are driven to <em>wrong</em> values." },
        ],
        answer: 0,
        steps: [
          `Q0 clears first, then its falling edge clocks Q1, which clears and clocks Q2, and only then does Q3 set:`,
          `<span class="math display" data-tex="0111 \\to 0110 \\to 0100 \\to 0000 \\to 1000"></span>`,
          `<b>Every one of those intermediate values is present on the output pins.</b> A decoder watching for, say, 0100 would fire a spurious pulse on this transition — which is why decoded outputs from a ripple counter need either a synchronous counter instead, or a strobe that samples only after the count has settled.`,
        ],
      };
    }

    return {
      stem: "What does a synchronous counter buy over a ripple counter, and what does it cost?",
      choices: [
        { text: "Buys a settling time independent of width; costs steering logic on every stage", why: "" },
        { text: "Buys fewer flip-flops; costs a faster clock", why: "Both counters use one flip-flop per bit. Neither needs a faster clock — the synchronous one <b>tolerates</b> a faster clock." },
        { text: "Buys lower power; costs area", why: "A synchronous counter clocks <b>every</b> flip-flop on every edge, so it generally burns <em>more</em> power, not less." },
        { text: "Buys glitch-free outputs; costs nothing", why: "It does buy glitch-free outputs, but the steering logic is real hardware — an AND of all lower bits at each stage." },
      ],
      answer: 0,
      steps: [
        `In a synchronous counter every flip-flop sees the same clock edge, so the whole count settles in <b>one</b> stage delay no matter how many bits there are — where a ripple counter needs n of them.`,
        `The price is that each stage now needs to be told whether to toggle: stage k toggles only when all bits below it are 1, which is an AND of k inputs.`,
        `<b>Settling time independent of width, paid for in gates.</b> That trade is the reason ripple counters survive at all — for a slow divider where nobody decodes the intermediate outputs, the ripple version is free.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "flipflops",
    stem: "A JK flip-flop with J = K = 1 receives a clock edge. What does Q do?",
    tool: "toggle — Q⁺ = Q̄",
    because: "It is the combination SR forbids, and defining it as toggle is what makes a JK able to count.",
  },
  {
    part: "flipflops",
    stem: "You need Q to go 1 → 0 on a JK flip-flop. What must J and K be?",
    tool: "K = 1, J = don't-care",
    because: "K resets; J is free because with J = 1 the flip-flop toggles to 0 and with J = 0 it resets to 0. Every JK excitation row has a don't-care.",
  },
  {
    part: "flipflops",
    stem: "How many flip-flops does a mod-10 counter need?",
    tool: "⌈log₂10⌉ = 4",
    because: "Four flip-flops give 16 states; the six unused ones are skipped by decoding the count of 10 and clearing.",
  },
  {
    part: "flipflops",
    stem: "A 6-bit ripple counter, 10 ns per stage. When is the MSB valid?",
    tool: "n × t_pd = 60 ns after the edge",
    because: "The stages are in series, so widening a ripple counter directly slows it — a synchronous one settles in one stage delay at any width.",
  },
]);

/* ==========================================================================
   Part 5 — state machines (15.G)
   ========================================================================== */

/* The same 1011 detector the plate runs, so a bench answer and the diagram a
   reader just stepped through can never disagree. */
const DET = {
  states: ["S0", "S1", "S2", "S3"],
  seen: ["nothing useful", "1", "10", "101"],
  next: [[0, 1], [2, 1], [0, 3], [2, 1]],
  emit: [[0, 0], [0, 0], [0, 0], [0, 1]],
};

defineProblem("fsm-type", {
  topic: "Moore against Mealy",
  lookup: "Electrical → Digital → State machine design",
  make(rng) {
    const q = rng.pick(["where", "timing", "states", "glitch"]);
    const Q = {
      where: {
        stem: "In a Moore machine, what does the output depend on?",
        right: "The present state alone",
        wrong: [
          ["The present state and the present input", "That is a <b>Mealy</b> machine. The distinction is exactly this."],
          ["The present input alone", "Then it would not be a state machine at all — it would be combinational logic."],
          ["The next state", "The output is decoded from the state the machine is <em>in</em>, not the one it is heading for."],
        ],
        why: "Moore: output = f(state). Mealy: output = f(state, input). Everything else about the two — the state count, the output timing, the glitch behaviour — follows from that one line.",
      },
      timing: {
        stem: "A Moore and a Mealy machine detect the same pattern. When does each assert its output?",
        right: "Mealy in the same cycle as the final bit; Moore one cycle later",
        wrong: [
          ["Both in the same cycle as the final bit", "The Moore output is decoded from the state, and the machine does not <em>enter</em> the accepting state until the next clock edge."],
          ["Both one cycle after the final bit", "The Mealy output is combinational on the input, so it appears immediately."],
          ["Moore first, Mealy one cycle later", "Backwards. Mealy sees the input directly; Moore has to be clocked into the accepting state first."],
        ],
        why: "The Mealy output is a function of the input, so it responds within the cycle. The Moore output is a function of the state, and the state only changes at the edge — so it is <b>registered, one cycle late, and clean</b>. Which you want depends on whether you need the answer early or need it glitch-free.",
      },
      states: {
        stem: "A Mealy machine needs N states for some task. What can be said about the Moore machine for the same task?",
        right: "It needs N or more states — often exactly one more",
        wrong: [
          ["It needs exactly N states as well", "Sometimes, but not in general. A Moore machine must have a distinct state for each distinct output, which frequently forces an extra one."],
          ["It needs fewer states", "Never. Moore is the more constrained of the two."],
          ["It needs 2N states", "Far too many. The usual penalty is one extra state, not a doubling."],
        ],
        why: "A Moore machine's output is a property of the state, so two situations that need different outputs cannot share a state. A Mealy machine can put the difference on the arrow instead. <b>Mealy is never larger; Moore is never faster.</b>",
      },
      glitch: {
        stem: "Why can a Mealy machine's output glitch when a Moore machine's cannot?",
        right: "The Mealy output is combinational on the input, so it follows every change the input makes",
        wrong: [
          ["Mealy machines use asynchronous flip-flops", "Both are ordinary synchronous machines. The flip-flops are the same."],
          ["Mealy machines have fewer states, so less time to settle", "State count does not set settling time. The output path does."],
          ["Moore machines have a separate output register", "They do not need one — the state register <em>is</em> the output register, which is the point."],
        ],
        why: "A Moore output is decoded from flip-flop outputs, which change only at the clock edge. A Mealy output is decoded from those <b>and the raw input</b>, so if the input twitches mid-cycle the output twitches with it. Registering a Mealy output fixes the glitch and gives away the speed advantage — at which point you have built a Moore machine.",
      },
    }[q];
    return {
      stem: Q.stem,
      choices: [{ text: Q.right, why: "" }, ...Q.wrong.map(([t, w]) => ({ text: t, why: w }))],
      answer: 0,
      steps: [`<b>${Q.right}.</b>`, Q.why],
    };
  },
});

defineProblem("fsm-trace", {
  topic: "Tracing a state machine",
  lookup: "Electrical → Digital → State machine design",
  make(rng) {
    const bits = Array.from({ length: rng.int(4, 6) }, () => rng.pick([0, 1]));
    let s = 0;
    const path = [0];
    const outs = [];
    for (const x of bits) { outs.push(DET.emit[s][x]); s = DET.next[s][x]; path.push(s); }
    const asked = rng.pick(["state", "out"]);
    const seq = bits.join("");

    const table =
      `<div class="table-scroll"><table><thead><tr><th>state</th><th>meaning</th>` +
      `<th class="num">on 0</th><th class="num">on 1</th></tr></thead><tbody>` +
      DET.states.map((n, i) =>
        `<tr><td><b>${n}</b></td><td>has seen ${DET.seen[i]}</td>` +
        `<td class="num">${DET.states[DET.next[i][0]]}</td>` +
        `<td class="num">${DET.states[DET.next[i][1]]}${DET.emit[i][1] ? " · Z=1" : ""}</td></tr>`
      ).join("") + "</tbody></table></div>";

    if (asked === "state") {
      const end = path[path.length - 1];
      const wrong = [0, 1, 2, 3].filter((i) => i !== end);
      return {
        stem: `A Mealy machine detects the pattern <b>1011</b> in a serial stream, overlaps counted. Starting in S0, it receives <b>${seq}</b>. Which state is it in afterwards?${table}`,
        choices: [
          { text: DET.states[end], why: "" },
          { text: DET.states[wrong[0]], why: `Re-trace it: ${path.map((i) => DET.states[i]).join(" → ")}.` },
          { text: DET.states[wrong[1]], why: "One transition off somewhere. The state names mean <em>how much of 1011 the input currently ends with</em> — check the last few bits against that." },
          { text: DET.states[wrong[2]], why: "Not reachable from that sequence. Walk the table one bit at a time rather than pattern-matching the whole string." },
        ],
        answer: 0,
        steps: [
          `Walk it one bit at a time: <b>${path.map((i) => DET.states[i]).join(" → ")}</b>`,
          `Each state means "the longest prefix of 1011 that the input currently ends with", so the answer is readable directly: the stream ends <b>${seq.slice(-3)}</b>, and the longest prefix of 1011 that is a suffix of that is <b>${DET.seen[end] === "nothing useful" ? "empty" : DET.seen[end]}</b>.`,
          `<b>${DET.states[end]}.</b> Reading the state names as meanings rather than as labels turns this from bookkeeping into a one-line check — and it is how you catch a tracing slip under time pressure.`,
        ],
      };
    }

    const n1 = outs.filter(Boolean).length;
    return {
      stem: `The same Mealy 1011 detector receives <b>${seq}</b> from S0. How many times does its output Z go to 1?${table}`,
      choices: options(
        { text: `${n1}`, why: "" },
        [
          { text: `${n1 + 1}`, why: "One too many. Z is asserted only on the transition <b>out of S3 on a 1</b> — no other arrow carries an output." },
          { text: `${n1 - 1}`, why: "One too few — remember that overlaps count, so a match can begin inside the previous one." },
          { text: `${(seq.match(/1/g) || []).length}`, why: "That counts the 1 bits in the input, not the completed patterns." },
        ],
        [
          { text: `${n1 + 2}`, why: "Far too many. Only one arrow in the whole machine carries an output." },
          { text: `${bits.length}`, why: "That is the length of the input, not the number of matches." },
        ]).filter((c) => Number(c.text) >= 0),
      answer: 0,
      steps: [
        `Trace: <b>${path.map((i) => DET.states[i]).join(" → ")}</b>`,
        `Z rises only on <b>S3 with input 1</b> — the arrow labelled 1 / 1. That happens ${n1 === 1 ? "once" : `${n1} times`} here.`,
        `<b>${n1}.</b> Note that the machine goes S3 → S1 rather than S3 → S0 on that arrow: the trailing 1 of a completed match is already the first bit of a possible next one, which is what "overlaps counted" means in hardware.`,
      ],
    };
  },
});

defineProblem("fsm-states", {
  topic: "Sizing a machine",
  lookup: "Electrical → Digital → State machine design",
  make(rng) {
    const q = rng.pick(["ff", "onehot", "unused", "detector"]);

    if (q === "ff") {
      const n = rng.pick([5, 6, 9, 12, 20]);
      const b = Math.ceil(Math.log2(n));
      return {
        stem: `A state machine has ${n} states. Using a binary state assignment, how many flip-flops does it need?`,
        choices: [
          { text: `${b}`, why: "" },
          { text: `${b - 1}`, why: `${b - 1} flip-flops encode only ${2 ** (b - 1)} states, which is fewer than ${n}.` },
          { text: `${n}`, why: `That is <b>one-hot</b>, which is a legitimate choice but not a binary assignment — and it uses ${n} flip-flops to do what ${b} can.` },
          { text: `${b + 1}`, why: "More than needed. Round up from log₂, do not add a safety margin." },
        ],
        answer: 0,
        steps: [
          `A binary assignment gives 2ᵇ distinct codes, so you need the smallest b with ${T(`2^b \\ge ${n}`)}.`,
          `<span class="math display" data-tex="b = \\lceil \\log_2 ${n} \\rceil = ${b}"></span>`,
          `<b>${b} flip-flops</b>, leaving ${2 ** b - n} unused codes. Those unused states are not harmless — <b>noise or a bad power-up can land the machine in one</b>, and a design that does not route them back to a known state can hang there.`,
        ],
      };
    }

    if (q === "onehot") {
      const n = rng.pick([4, 5, 6, 8]);
      return {
        stem: `The same ${n}-state machine is given a one-hot assignment instead. How many flip-flops, and what happens to the logic?`,
        choices: [
          { text: `${n} flip-flops, and the next-state logic becomes much simpler`, why: "" },
          { text: `${Math.ceil(Math.log2(n))} flip-flops, and the logic becomes simpler`, why: "That is the flip-flop count for a <b>binary</b> assignment. One-hot spends one flip-flop per state — that is the trade it is making." },
          { text: `${n} flip-flops, and the logic becomes more complex`, why: "Backwards. Spending the flip-flops is what <em>buys</em> the simple logic: each next-state equation is just an OR of the transitions entering that state." },
          { text: `${n} flip-flops, and the logic is unchanged`, why: "The encoding is exactly what determines the logic, so it cannot be unchanged." },
        ],
        answer: 0,
        steps: [
          `One-hot uses one flip-flop per state with exactly one set, so ${n} states means <b>${n} flip-flops</b>.`,
          `In exchange, <b>no minimisation is needed</b>: D for state j is simply the OR of every transition arriving at j, and each of those terms is a two-input AND of a state bit and an input condition.`,
          `<b>${n} flip-flops, far simpler logic.</b> On an FPGA, where flip-flops come free inside every logic block and routing is the scarce resource, this is usually what the synthesis tool picks — which is why the "minimum flip-flops" answer is a textbook answer rather than a modern one.`,
        ],
      };
    }

    if (q === "unused") {
      return {
        stem: "A 5-state machine is encoded in 3 flip-flops. What should be done about the 3 unused codes?",
        choices: [
          { text: "Route them to a known state, so a stray entry recovers", why: "" },
          { text: "Nothing — the machine can never reach them", why: "It can. <b>Power-up is undefined, and a noise glitch or a setup violation can drop the register into any pattern.</b> A machine with no recovery path can hang there permanently." },
          { text: "Treat them as don't-cares to simplify the logic", why: "Tempting, and it is what a naive minimisation does — but the resulting transitions are then whatever the gates happen to produce, which may be a loop among the unused states." },
          { text: "Add three more states so none are unused", why: "That needs a fourth flip-flop and eight codes, so it does not remove the problem — it enlarges it." },
        ],
        answer: 0,
        steps: [
          `<b>Give them an explicit destination</b> — usually the reset state. The cost is a little extra logic; the benefit is that the machine cannot hang.`,
          `The alternative, treating them as don't-cares, does produce smaller equations, and it is what an exam question on minimisation will usually intend. But it leaves the unused states' behaviour to whatever the simplified gates happen to do.`,
          `A design is called <span class="term">fault-tolerant</span> or <b>self-starting</b> when every unreachable code leads back into the working set. It is worth knowing both answers and which question is being asked.`,
        ],
      };
    }

    const pat = rng.pick(["101", "1101", "0110", "111"]);
    const n = pat.length + 1;
    return {
      stem: `A Moore machine detects the pattern <b>${pat}</b> in a serial stream. What is the minimum number of states?`,
      choices: [
        { text: `${n}`, why: "" },
        { text: `${pat.length}`, why: `That is the Mealy count. A <b>Moore</b> machine needs one more, because "the pattern has just completed" has to be a state of its own for the output to live in.` },
        { text: `${2 ** pat.length}`, why: "That would be remembering the whole history. You only need to remember <b>how much of the pattern the input currently ends with</b>, which is far less." },
        { text: `${n + 1}`, why: `One too many. There are only ${pat.length} + 1 useful amounts of progress: none, one bit, two bits, and so on up to the whole pattern.` },
      ],
      answer: 0,
      steps: [
        `The state must record <b>how much of ${pat} the input currently ends with</b>. For a ${pat.length}-bit pattern the possibilities are none, 1 bit, 2 bits, … up to all ${pat.length} — that is ${n} states.`,
        `A <b>Mealy</b> machine gets away with ${pat.length}, because the completed match can be signalled on the arrow rather than stored in a state.`,
        `<b>${n} states</b>, needing ${T(`\\lceil \\log_2 ${n} \\rceil = ${Math.ceil(Math.log2(n))}`)} flip-flops. The "how much of the pattern I currently end with" reading is worth internalising — it makes the backward arrows obvious instead of something to be worked out.`,
      ],
    };
  },
});

defineProblem("fsm-design", {
  topic: "The design procedure",
  lookup: "Electrical → Digital → State machine design",
  make(rng) {
    const q = rng.pick(["order", "excite", "assign", "reset"]);
    const Q = {
      order: {
        stem: "What is the correct order of steps in synchronous state machine design?",
        right: "State diagram → state table → state assignment → excitation table → minimise → gates",
        wrong: [
          ["State diagram → state assignment → minimise → state table → gates", "The state table has to exist before you can assign codes to its rows or minimise anything."],
          ["Truth table → Karnaugh map → state diagram → gates", "That is combinational design with a state diagram bolted on. Sequential design starts from the <em>behaviour</em>."],
          ["State assignment → state diagram → excitation table → gates", "You cannot assign codes to states you have not identified yet."],
        ],
        why: "Every step consumes the one before it. The diagram captures the behaviour, the table makes it mechanical, the assignment turns states into bit patterns, the excitation table turns transitions into flip-flop inputs, and minimisation turns those into gates. <b>Skipping the table is where most errors get in.</b>",
      },
      excite: {
        stem: "Which flip-flop makes the excitation step trivial, and why?",
        right: "D, because its excitation table is simply D = Q⁺",
        wrong: [
          ["JK, because its excitation table has don't-cares", "The don't-cares make the <em>minimisation</em> cheaper, but they add a translation step that D does not need."],
          ["T, because it toggles", "T = Q ⊕ Q⁺ is easy, but still a translation. D needs none at all."],
          ["SR, because it has a forbidden state", "A forbidden state is a liability in state machine design, not an advantage — one that has to be designed around."],
        ],
        why: "With a D flip-flop the excitation logic <b>is</b> the next-state logic: whatever you want Q to become, that is what D must be. Every other type needs the next-state column translated into inputs first. That is why almost all modern design is D-based, and why every FPGA flip-flop is a D.",
      },
      assign: {
        stem: "Two designs of the same machine differ only in which bit pattern is given to which state. What changes?",
        right: "The amount of combinational logic, but not the behaviour",
        wrong: [
          ["The number of states", "The states are the same states; only their names in binary have changed."],
          ["The behaviour, since the outputs are encoded differently", "The output logic is re-derived from the new assignment, so the machine behaves identically."],
          ["Nothing — the assignment is arbitrary", "It is <b>free</b>, in the sense that any assignment works. It is not <em>arbitrary</em>: the gate count can easily vary by a factor of two."],
        ],
        why: "State assignment is a genuine optimisation problem with no simple rule — which is exactly why synthesis tools search it. Gray coding helps when the machine walks its states in order, one-hot helps when flip-flops are cheaper than routing, and for anything else the only honest answer is to try.",
      },
      reset: {
        stem: "Why does a synchronous state machine need a reset?",
        right: "Flip-flops power up in an undefined state, so the machine must be put into a known one",
        wrong: [
          ["To clear the output register between patterns", "Nothing needs clearing between patterns — the state already encodes everything the machine remembers."],
          ["To synchronise the clock", "Reset has no effect on the clock. Those are separate problems."],
          ["Only asynchronous machines need one", "Synchronous machines need it just as much. The power-up state is undefined either way."],
        ],
        why: "On power-up each flip-flop settles wherever it settles, which may be a valid state, an unused code, or — with more than two flip-flops — anything at all. Without a reset the machine's first few cycles are undefined, and if the unused codes form a loop it may never reach a working state. <b>This is the same argument as designing the unused codes to be self-starting</b>, and a careful design does both.",
      },
    }[q];
    return {
      stem: Q.stem,
      choices: [{ text: Q.right, why: "" }, ...Q.wrong.map(([t, w]) => ({ text: t, why: w }))],
      answer: 0,
      steps: [`<b>${Q.right}.</b>`, Q.why],
    };
  },
});

defineReflex([
  {
    part: "state-machines",
    stem: "A machine's output depends on the state and the current input. Which kind is it?",
    tool: "Mealy — output on the arrow",
    because: "Moore's output is a function of the state alone, which is why it needs one more state and arrives a cycle later.",
  },
  {
    part: "state-machines",
    stem: "A Moore machine detects a 4-bit pattern. Minimum states?",
    tool: "5 — one per amount of progress, plus the match",
    because: "The state records how much of the pattern the input currently ends with: none, 1, 2, 3, or all 4.",
  },
  {
    part: "state-machines",
    stem: "A 9-state machine, one-hot encoded. How many flip-flops?",
    tool: "9 — one per state",
    because: "One-hot spends flip-flops to buy logic that needs no minimisation at all, which is the trade FPGAs prefer.",
  },
  {
    part: "state-machines",
    stem: "Designing with D flip-flops: how do you get the excitation table?",
    tool: "you do not — D = Q⁺",
    because: "The next-state column *is* the D column, which is why D-based design skips the step every other flip-flop needs.",
  },
]);

/* ==========================================================================
   Part 6 — timing and hazards (15.H)
   ========================================================================== */

defineProblem("timing-window", {
  topic: "Setup, hold, and metastability",
  lookup: "Electrical → Digital → Timing",
  make(rng) {
    const q = rng.pick(["what", "violate", "meta", "which"]);
    const Q = {
      what: {
        stem: "What do setup time and hold time specify?",
        right: "How long the data must be steady before the clock edge, and how long after it",
        wrong: [
          ["How long the output takes to change after the clock edge", "That is <b>clock-to-Q</b> propagation delay, a different parameter and an output specification rather than an input requirement."],
          ["The minimum and maximum clock period", "Those follow from setup and hold, but they are not what the two numbers <em>are</em>."],
          ["How long the clock must stay high and low", "That is the minimum pulse width, which is a third specification again."],
        ],
        why: "The two numbers bracket the clock edge and define an <b>aperture</b> the data must not move inside. Setup is the run-up, hold is the follow-through, and the sum of them is the window a flip-flop is genuinely looking through.",
      },
      violate: {
        stem: "A data signal changes inside a flip-flop's setup-and-hold window. What is the result?",
        right: "The output may go metastable — neither 0 nor 1 — for an unbounded time",
        wrong: [
          ["The flip-flop captures the old value", "That is what happens when the data arrives <b>after</b> the window closes. Late is defined; inside is not."],
          ["The flip-flop captures the new value", "That is what happens when the data settles <b>before</b> the window opens."],
          ["The flip-flop output is briefly wrong and then correct on the next edge", "That understates it. The output is not wrong — it is <em>undefined</em>, and it may still be undefined when the next edge arrives."],
        ],
        why: "Both the defined outcomes are fine to design around: early captures the new value, late captures the old one. <b>Inside the window there is no defined outcome at all.</b> The output settles towards a rail eventually, but the time it takes has only a probability attached to it, not a bound.",
      },
      meta: {
        stem: "How is metastability handled in practice?",
        right: "Pass the asynchronous signal through two flip-flops in series before using it",
        wrong: [
          ["Use a faster flip-flop", "It helps — a smaller time constant resolves faster — but it does not remove the failure, only make it rarer. The two-stage synchroniser is the standard answer."],
          ["Add a pull-up resistor to the data line", "Metastability is about <em>when</em> the input changes, not what level it sits at."],
          ["Slow the clock down", "This does help, since it gives more time to resolve — but it slows the whole design to fix one input, where two flip-flops fix that input alone."],
        ],
        why: "The first flip-flop may go metastable; the second gives it <b>a whole extra clock period to resolve before anything reads it</b>. Because MTBF goes as e^(t/τ), that one extra period does not double the mean time between failures — it can turn days into geological time. <b>You cannot eliminate metastability, only make it improbable enough.</b>",
      },
      which: {
        stem: "Which signals need a synchroniser?",
        right: "Any signal that changes without reference to the receiving clock",
        wrong: [
          ["Only signals from a slower clock domain", "Speed is irrelevant. What matters is whether the two clocks are <b>related</b> — a slower unrelated clock is just as dangerous."],
          ["Only mechanical inputs like switches", "Switches need one, but so does anything from another clock domain, and so does an interrupt line from another chip."],
          ["All inputs, including those from the same clock domain", "Signals already synchronous with your clock are covered by static timing analysis. Synchronising them again just adds latency."],
        ],
        why: "A button, a signal from another oscillator, a reset released by hand — each can change at any moment, so <b>eventually one will change inside the aperture</b>. Anything already timed by the same clock is a different problem, solved by timing analysis rather than by extra flip-flops.",
      },
    }[q];
    return {
      stem: Q.stem,
      choices: [{ text: Q.right, why: "" }, ...Q.wrong.map(([t, w]) => ({ text: t, why: w }))],
      answer: 0,
      steps: [`<b>${Q.right}.</b>`, Q.why],
    };
  },
});

defineProblem("timing-fmax", {
  topic: "Maximum clock frequency",
  lookup: "Electrical → Digital → Timing",
  make(rng) {
    const q = rng.pick(["fmax", "fmax", "hold", "skew"]);
    const tcq = rng.pick([2, 3, 4, 5]);
    const tlog = rng.pick([6, 8, 10, 12, 15, 20]);
    const tsu = rng.pick([2, 3, 4]);

    if (q === "fmax") {
      const Tmin = tcq + tlog + tsu;
      const f = 1000 / Tmin;
      return {
        stem: `Two flip-flops are separated by combinational logic. Clock-to-Q is ${tcq} ns, the logic takes ${tlog} ns, and the setup time is ${tsu} ns. What is the maximum clock frequency?`,
        choices: options(
          { text: `${fixed(f, 1)} MHz`, why: "" },
          [
            { text: `${fixed(1000 / (tcq + tlog), 1)} MHz`, why: "The setup time is missing. The data must arrive <b>and be steady</b> before the next edge, so t<sub>su</sub> is part of the budget." },
            { text: `${fixed(1000 / tlog, 1)} MHz`, why: "Only the logic. The launching flip-flop's clock-to-Q delay and the capturing one's setup time are both on the same path." },
            { text: `${fixed(1000 / (tcq + tlog + tsu + tsu), 1)} MHz`, why: "The setup time is counted twice. There is one launching flip-flop and one capturing one." },
          ]),
        answer: 0,
        steps: [
          `The path runs from one flip-flop's clock edge, out through its Q, across the logic, and into the next flip-flop's D — where it must be steady <b>before</b> that flip-flop's setup window opens:`,
          `<span class="math display" data-tex="T_{min} = t_{cq} + t_{logic} + t_{su} = ${tcq} + ${tlog} + ${tsu} = ${Tmin}\\text{ ns}"></span>`,
          `<span class="math display" data-tex="f_{max} = \\frac{1}{${Tmin}\\text{ ns}} = ${fixed(f, 1)}\\text{ MHz}"></span>`,
          `<b>${fixed(f, 1)} MHz.</b> All three terms belong to the same path, and the one people leave out is <b>t<sub>su</sub></b> — the data has to arrive early, not merely arrive.`,
        ],
      };
    }

    if (q === "hold") {
      return {
        stem: "A design has a hold-time violation: the shortest path between two flip-flops delivers new data before the capturing flip-flop's hold time has elapsed. Can it be fixed by slowing the clock?",
        choices: [
          { text: "No — the clock period does not appear in the hold inequality", why: "" },
          { text: "Yes — halving the clock frequency doubles every timing margin",
            why: "It doubles the <em>setup</em> margin. The hold check compares two delays measured from the <b>same</b> clock edge, so the period cancels out of it entirely." },
          { text: "Yes, provided the period is made longer than the hold time",
            why: "No value of the period helps, because the period is not in the inequality at any value." },
          { text: "Only if the two flip-flops share a clock",
            why: "They do share one — that is the case being described, and sharing it is precisely why the period cancels." },
        ],
        answer: 0,
        steps: [
          `Setup is a race against the <b>next</b> edge, so the period is in it: ${T(`T \\ge t_{cq} + t_{logic} + t_{su}`)}`,
          `Hold is a race against the <b>same</b> edge. New data must not reach the capturing flip-flop until its hold time is over:`,
          `<span class="math display" data-tex="t_{cq} + t_{logic,\\,min} \\ge t_{h}"></span>`,
          `<b>No clock period appears.</b> A hold violation therefore cannot be clocked away — it has to be fixed in the circuit, usually by <em>adding</em> delay to the short path. That is one of the few occasions when deliberately slowing a signal down is the right answer.`,
        ],
      };
    }

    const skew = rng.pick([1, 2, 3]);
    const Tmin = tcq + tlog + tsu;
    const help = rng.pick([true, false]);
    const Tnew = help ? Tmin - skew : Tmin + skew;
    return {
      stem: `The same path — ${tcq} ns clock-to-Q, ${tlog} ns of logic, ${tsu} ns setup — but the capturing flip-flop's clock arrives ${skew} ns <b>${help ? "later" : "earlier"}</b> than the launching one's. What is the minimum clock period now?`,
      choices: options(
        { text: `${Tnew} ns`, why: "" },
        [
          { text: `${Tmin} ns`, why: "That ignores the skew. A capture edge that arrives late gives the data more time; one that arrives early gives it less." },
          { text: `${help ? Tmin + skew : Tmin - skew} ns`, why: `The skew has the wrong sign. Clock arriving <b>${help ? "later" : "earlier"}</b> at the capturing flip-flop ${help ? "lengthens" : "shortens"} the time available, so the minimum period ${help ? "falls" : "rises"}.` },
          { text: `${Tmin + 2 * skew} ns`, why: "The skew is counted twice. It is one displacement between two edges." },
        ]),
      answer: 0,
      steps: [
        `Skew shifts the deadline rather than the path. Writing it into the setup inequality:`,
        `<span class="math display" data-tex="T_{min} = t_{cq} + t_{logic} + t_{su} ${help ? "-" : "+"} t_{skew} = ${tcq} + ${tlog} + ${tsu} ${help ? "-" : "+"} ${skew} = ${Tnew}\\text{ ns}"></span>`,
        `<b>${Tnew} ns.</b> A capture clock that arrives late is <em>useful</em> skew for setup — and it eats directly into the hold margin, which is the catch. <b>Skew helps one check exactly as much as it hurts the other</b>, which is why clock trees are built to have as little of it as possible rather than to have helpful amounts of it.`,
      ],
    };
  },
});

defineProblem("hazard-type", {
  topic: "Hazards and races",
  lookup: "Electrical → Digital → Timing",
  make(rng) {
    const q = rng.pick(["static1", "fix", "why", "race"]);
    const Q = {
      static1: {
        stem: "An output that the truth table says is constantly 1 dips briefly to 0 when one input changes. What is this called?",
        right: "A static-1 hazard",
        wrong: [
          ["A static-0 hazard", "That is the mirror image: an output that should stay <b>0</b> pulsing briefly to 1."],
          ["A dynamic hazard", "That is an output that <em>should</em> change once but changes three or more times on the way."],
          ["A race condition", "Related, but a race is about two <b>state variables</b> changing at once and the outcome depending on which wins. A hazard is a momentary glitch in combinational output."],
        ],
        why: "Static means the output was supposed to hold still. The digit says which level it was holding: <b>static-1 dips to 0, static-0 pulses to 1</b>. A dynamic hazard is the third kind — a single intended transition that arrives as three.",
      },
      fix: {
        stem: "How is a static-1 hazard in a sum-of-products expression removed?",
        right: "Add the redundant consensus term that covers the handover",
        wrong: [
          ["Minimise the expression further", "<b>Backwards.</b> Minimisation is what removed the covering term in the first place — a minimal expression is exactly the one most likely to have hazards."],
          ["Add an inverter to equalise the path delays", "Matching delays across every path is not achievable in practice, and it stops being true over temperature and process."],
          ["Register the output with a flip-flop", "That hides the glitch from synchronous logic, and it is a perfectly good engineering answer — but it does not remove the hazard, and anything level-sensitive downstream still sees it."],
        ],
        why: "On a Karnaugh map, a hazard sits wherever two adjacent groups touch without overlapping — the output hands over from one term to the other, and if the timing is unequal it drops in between. <b>Add the group that spans the boundary</b>: it is logically redundant, so the truth table is unchanged, and it holds the output up during the handover.",
      },
      why: {
        stem: "Why is a glitch on a combinational output often harmless?",
        right: "Because synchronous logic only samples at the clock edge, by which time it has settled",
        wrong: [
          ["Because the glitch is too short to carry energy", "Duration has nothing to do with it. A 2 ns glitch into a latch enable is a fault however brief."],
          ["Because gates filter out short pulses", "Some do, at the very short end — but this is not something a design may rely on."],
          ["Because the redundant term always removes it automatically", "Only if somebody added it. Minimisation removes exactly those terms."],
        ],
        why: "Between clock edges the combinational logic may do whatever it likes, and normally does. <b>It matters the moment something level-sensitive is watching</b>: a latch enable, an asynchronous clear, a clock derived from logic. That last one is why deriving a clock from a gate output is a well-known way to build an unreliable circuit.",
      },
      race: {
        stem: "What is a race condition in a sequential circuit?",
        right: "Two or more state variables changing at once, with the result depending on which arrives first",
        wrong: [
          ["Two signals arriving at the same gate at the same time", "That is ordinary operation. A race needs the <b>outcome</b> to depend on the order."],
          ["A clock that is too fast for the logic", "That is a setup violation, which is a timing failure with a defined cause and a defined fix."],
          ["An output glitching while its inputs are stable", "That is a hazard — and inputs that are stable are precisely the case a hazard describes."],
        ],
        why: "If a transition asks two flip-flops to change together and one is faster, the circuit passes through a state the designer never drew — and may settle in the wrong one. A <span class=\"term\">critical race</span> is one where the final state actually differs. <b>This is the argument for Gray-coded state assignments</b>, where adjacent states differ in one bit and there is nothing to race.",
      },
    }[q];
    return {
      stem: Q.stem,
      choices: [{ text: Q.right, why: "" }, ...Q.wrong.map(([t, w]) => ({ text: t, why: w }))],
      answer: 0,
      steps: [`<b>${Q.right}.</b>`, Q.why],
    };
  },
});

defineReflex([
  {
    part: "timing",
    stem: "Data changes inside a flip-flop's setup-and-hold window. What happens?",
    tool: "metastable — undefined for an unbounded time",
    because: "Early captures the new value and late captures the old one; only inside the window is there no defined outcome at all.",
  },
  {
    part: "timing",
    stem: "t_cq 3 ns, logic 12 ns, t_su 3 ns. Maximum clock?",
    tool: "1/(3+12+3) = 55.6 MHz",
    because: "All three are on the same path, and the one usually left out is the setup time — the data must arrive early, not merely arrive.",
  },
  {
    part: "timing",
    stem: "A hold-time violation. Will slowing the clock fix it?",
    tool: "no — the period is not in the hold inequality",
    because: "Hold compares two delays from the same edge, so it must be fixed by adding delay to the short path.",
  },
  {
    part: "timing",
    stem: "An output that should stay at 1 dips to 0 when an input changes.",
    tool: "static-1 hazard — add the consensus term",
    because: "The redundant term covers the handover between two adjacent K-map groups, which is exactly what minimisation deleted.",
  },
]);
