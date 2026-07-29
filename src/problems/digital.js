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
