/* ==========================================================================
   problems/digital.js — generators for Digital Systems.

   Part 1 (15.A): bases, two's complement, binary arithmetic, codes.
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed } from "../lib/fmt.js";

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;

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
        choices: [
          { text: `${v}`, why: "" },
          { text: `${fromHex ? parseInt(hex(v), 10) : parseInt(bin(v), 10)}`,
            why: `That reads the digits as if they were already decimal. ${fromHex ? "Each hex digit is worth 16 times the one to its right." : "Each binary digit is worth twice the one to its right."}` },
          { text: `${v * 2}`, why: "Doubled — a place-value slip of one position." },
          { text: `${Math.floor(v / 2)}`, why: "Halved — a place-value slip the other way." },
        ].filter((c, i, all) => i === 0 || c.text !== all[0].text),
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
