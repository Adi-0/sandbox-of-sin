/* ==========================================================================
   problems/complex.js — generators for Part 2.
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed, cplx } from "../lib/fmt.js";

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;
const DEG = 180 / Math.PI;

/** Render a complex number as TeX in the electrical convention. */
function cx(a, b, d = 2) {
  const ar = Number(a.toFixed(d)), br = Number(b.toFixed(d));
  if (br === 0) return num(ar, d).replace("−", "-");
  const mag = Math.abs(br) === 1 ? "" : num(Math.abs(br), d).replace("−", "-");
  if (ar === 0) return `${br < 0 ? "-" : ""}${mag}j`;
  return `${num(ar, d).replace("−", "-")} ${br > 0 ? "+" : "-"} ${mag}j`;
}

const polarTex = (r, thDeg, d = 2) => `${num(r, d).replace("−", "-")}\\angle ${num(thDeg, d).replace("−", "-")}^\\circ`;

/* ==========================================================================
   Adding and multiplying in rectangular form
   ========================================================================== */

defineProblem("complex-arith", {
  topic: "Complex arithmetic",
  lookup: "Mathematics → Complex numbers → Arithmetic (j² = −1)",
  make(rng) {
    const a = rng.nz(-9, 12), b = rng.nz(-9, 12);
    const c = rng.nz(-9, 12), d = rng.nz(-9, 12);
    const mult = rng.chance(0.6);

    if (!mult) {
      const re = a + c, im = b + d;
      return {
        stem: `What is the sum of ${T(cx(a, b))} and ${T(cx(c, d))}?`,
        choices: [
          { tex: cx(re, im), why: "" },
          { tex: cx(a + c, b - d), why: "The imaginary parts were subtracted. Addition is componentwise in both parts." },
          { tex: cx(a * c - b * d, a * d + b * c), why: "That is the <em>product</em>, not the sum." },
          { tex: cx(a - c, b + d), why: "The real parts were subtracted." },
        ],
        answer: 0,
        steps: [
          `Addition is componentwise — this is one of the two operations that is easy in rectangular form.`,
          `Real: ${num(a)} + ${num(c)} = <b>${num(re)}</b>. Imaginary: ${num(b)} + ${num(d)} = <b>${num(im)}</b>.`,
          `So the sum is <b>${T(cx(re, im))}</b>. No conversion to polar is needed or wanted here.`,
        ],
      };
    }

    const re = a * c - b * d, im = a * d + b * c;
    return {
      stem: `What is the product of ${T(cx(a, b))} and ${T(cx(c, d))}?`,
      choices: [
        { tex: cx(re, im), why: "" },
        { tex: cx(a * c + b * d, a * d + b * c), why: `The real part needs a <b>minus</b>: the ${T("j \\cdot j")} term contributes ${T("j^2 = -1")}, which flips its sign.` },
        { tex: cx(a * c, b * d), why: "Only the matching parts were multiplied. Multiplication is not componentwise — every term meets every other term." },
        { tex: cx(re, a * c + b * d), why: "The cross terms in the imaginary part were mixed up with the straight terms." },
      ],
      answer: 0,
      steps: [
        `Multiply it out term by term:` +
          `<span class="math display" data-tex="(${cx(a, b)})(${cx(c, d)}) = ${num(a * c)} ${b * d >= 0 ? "+" : "-"} ${num(Math.abs(b * d))}j^2 + ${num(a * d)}j ${b * c >= 0 ? "+" : "-"} ${num(Math.abs(b * c))}j"></span>`,
        `Replace ${T("j^2")} with ${T("-1")} — that is the only rule that makes this different from ordinary algebra:` +
          `<span class="math display" data-tex="= (${num(a * c)} ${-b * d >= 0 ? "+" : "-"} ${num(Math.abs(b * d))}) + (${num(a * d)} ${b * c >= 0 ? "+" : "-"} ${num(Math.abs(b * c))})j"></span>`,
        `= <b>${T(cx(re, im))}</b>`,
      ],
    };
  },
});

/* ==========================================================================
   Converting between forms
   ========================================================================== */

defineProblem("rect-polar", {
  topic: "Rectangular ↔ polar",
  lookup: "Mathematics → Complex numbers → Polar form, Euler's identity",
  make(rng) {
    const [x, y] = rng.pick([[3, 4], [4, 3], [5, 12], [12, 5], [8, 6], [6, 8], [8, 15], [7, 24]]);
    const sx = rng.sign(), sy = rng.sign();
    const a = x * sx, b = y * sy;
    const r = Math.hypot(a, b);
    const th = Math.atan2(b, a) * DEG;
    const naive = Math.atan(b / a) * DEG;      // what the calculator says, unguarded

    const wrong = [
      { v: naive, why: `That is what ${T("\\arctan(b/a)")} returns without checking the quadrant. The point is in quadrant ${quad(a, b)}, so the answer must lie between ${qRange(a, b)}.` },
      { v: Math.atan2(a, b) * DEG, why: "The ratio is upside down — it is <em>imaginary over real</em>, opposite over adjacent." },
      { v: th + (th > 0 ? -180 : 180), why: "Half a turn out. Sketching the point catches this instantly." },
    ];
    const uniq = [];
    for (const w of wrong) {
      if (Math.abs(w.v - th) > 0.6 && !uniq.some((u) => Math.abs(u.v - w.v) < 0.6)) uniq.push(w);
    }
    while (uniq.length < 3) uniq.push({ v: th + 90 * (uniq.length + 1), why: "Off by a quarter turn." });

    return {
      stem: `Express ${T(cx(a, b, 0))} in polar form. The magnitude and angle are most nearly:`,
      choices: [
        { tex: polarTex(r, th), why: "" },
        ...uniq.slice(0, 3).map((w) => ({ tex: polarTex(r, w.v), why: w.why })),
      ],
      answer: 0,
      steps: [
        `Magnitude first — it is just Pythagoras and it never depends on signs:` +
          `<span class="math display" data-tex="r = \\sqrt{(${num(a)})^2 + (${num(b)})^2} = \\sqrt{${a * a + b * b}} = ${num(r, 2)}"></span>`,
        `<b>Sketch the point before touching the calculator.</b> Real part ${a > 0 ? "positive" : "negative"}, ` +
          `imaginary part ${b > 0 ? "positive" : "negative"} puts it in <b>quadrant ${quad(a, b)}</b>, ` +
          `so the angle must be between ${qRange(a, b)}.`,
        `<span class="math display" data-tex="\\theta = \\arctan\\frac{${num(b)}}{${num(a)}} \\to ${num(th, 2)}^\\circ"></span>` +
          `giving <b>${T(polarTex(r, th))}</b>.` +
          (Math.abs(naive - th) > 1
            ? ` The raw calculator value is ${num(naive, 2)}° — the quadrant check is what fixes it.`
            : ""),
      ],
    };
  },
});

const quad = (a, b) => (a > 0 ? (b >= 0 ? "I" : "IV") : (b >= 0 ? "II" : "III"));
const qRange = (a, b) => (a > 0 ? (b >= 0 ? "0° and 90°" : "−90° and 0°") : (b >= 0 ? "90° and 180°" : "−180° and −90°"));

/* ==========================================================================
   Division
   ========================================================================== */

defineProblem("complex-divide", {
  topic: "Complex division",
  lookup: "Mathematics → Complex numbers → Conjugate, division",
  make(rng) {
    const c = rng.nz(-6, 6), d = rng.nz(-6, 6);
    const a = rng.nz(-9, 9), b = rng.nz(-9, 9);
    const den = c * c + d * d;
    const re = (a * c + b * d) / den, im = (b * c - a * d) / den;

    return {
      stem: `Evaluate ${T(`\\frac{${cx(a, b, 0)}}{${cx(c, d, 0)}}`)}, most nearly.`,
      choices: [
        { tex: cx(re, im, 3), why: "" },
        { tex: cx((a * c - b * d) / den, (b * c + a * d) / den, 3),
          why: "You multiplied by the denominator instead of its <b>conjugate</b>. The conjugate flips the sign of the imaginary part." },
        { tex: cx(a / c, b / d, 3),
          why: "Division is not componentwise. Only addition and subtraction are." },
        { tex: cx(re * den / Math.hypot(c, d), im * den / Math.hypot(c, d), 3),
          why: `The denominator after rationalising is ${T(`c^2 + d^2 = ${den}`)}, not ${T("\\sqrt{c^2+d^2}")}. That is |z|², not |z|.` },
      ],
      answer: 0,
      steps: [
        `Multiply top and bottom by the conjugate of the bottom, ${T(cx(c, -d, 0))}. ` +
          `The point is that a number times its own conjugate is <b>real</b>:` +
          `<span class="math display" data-tex="(${cx(c, d, 0)})(${cx(c, -d, 0)}) = ${c}^2 + ${d}^2 = ${den}"></span>`,
        `Numerator: ${T(`(${cx(a, b, 0)})(${cx(c, -d, 0)}) = ${cx(a * c + b * d, b * c - a * d, 0)}`)}`,
        `Divide both parts by ${den}:` +
          `<span class="math display" data-tex="${cx(re, im, 3)}"></span>` +
          `Check with polar if you like: the magnitude should be ` +
          `${fixed(Math.hypot(a, b), 3)} / ${fixed(Math.hypot(c, d), 3)} = ` +
          `<b>${fixed(Math.hypot(re, im), 3)}</b>, and it is.`,
      ],
    };
  },
});

/* ==========================================================================
   Powers — De Moivre
   ========================================================================== */

defineProblem("complex-power", {
  topic: "De Moivre's theorem",
  lookup: "Mathematics → Complex numbers → De Moivre's theorem",
  make(rng) {
    const r = rng.pick([1, 2, 2, 3]);
    const thDeg = rng.pick([30, 36, 45, 53.13, 60, 90, 120]);
    const n = rng.int(3, 6);
    const R = Math.pow(r, n), TH = wrap(thDeg * n);

    return {
      stem: `If ${T(`z = ${polarTex(r, thDeg)}`)}, what is ${T(`z^{${n}}`)}?`,
      choices: [
        { tex: polarTex(R, TH), why: "" },
        { tex: polarTex(r * n, TH), why: `The magnitude is raised to the power, not multiplied by it: ${T(`${r}^{${n}} = ${R}`)}, not ${T(`${r}\\cdot${n}`)}.` },
        { tex: polarTex(R, wrap(thDeg)), why: "The angle has to be multiplied by n as well — that is the half of De Moivre that does the rotating." },
        { tex: polarTex(R, wrap(Math.pow(thDeg, n) % 360)), why: "The <em>angle</em> is multiplied by n; only the magnitude is raised to the power." },
      ],
      answer: 0,
      steps: [
        `De Moivre: <span class="math display" data-tex="(r\\angle\\theta)^n = r^n\\angle n\\theta"></span>` +
          `Magnitude to the power, angle times the power. It is just "lengths multiply, angles add" applied ${n} times.`,
        `Magnitude: ${T(`${r}^{${n}} = ${R}`)}.  Angle: ${T(`${n} \\times ${num(thDeg, 2)}^\\circ = ${num(thDeg * n, 2)}^\\circ`)}.`,
        (Math.abs(thDeg * n - TH) > 0.01
          ? `Bring the angle into the range −180° to 180° by subtracting full turns: ${num(thDeg * n, 2)}° → <b>${num(TH, 2)}°</b>. `
          : "") + `So ${T(`z^{${n}} = ${polarTex(R, TH)}`)}.`,
      ],
    };
  },
});

const wrap = (d) => { let v = ((d % 360) + 360) % 360; return v > 180 ? v - 360 : v; };

/* ==========================================================================
   Roots — the "how many" question
   ========================================================================== */

defineProblem("complex-roots", {
  topic: "Roots of complex numbers",
  lookup: "Mathematics → Complex numbers → Roots (De Moivre)",
  make(rng) {
    const n = rng.int(3, 5);
    const r = rng.pick([1, 8, 16, 32, 81]);
    const thDeg = rng.pick([0, 60, 90, 120, 180]);
    const R = Math.pow(r, 1 / n);
    const first = thDeg / n;
    const step = 360 / n;

    return {
      stem:
        `How many distinct ${ordName(n)} roots does ${T(polarTex(r, thDeg, 0))} have, ` +
        `and what is the angle between neighbouring roots?`,
      choices: [
        { text: `${n} roots, ${num(step, 1)}° apart`, why: "" },
        { text: `1 root, no spacing`, why: `Every non-zero complex number has exactly <b>n</b> distinct nth roots. Only the principal one is usually quoted, but the exam asks about all of them.` },
        { text: `${n} roots, ${num(180 / n, 1)}° apart`, why: `The ${n} roots share a full turn between them, so the spacing is 360°/${n}, not 180°/${n}.` },
        { text: `2 roots, 180° apart`, why: "That is true for square roots only. Here n = " + n + "." },
      ],
      answer: 0,
      steps: [
        `Adding a full turn to the angle lands on the same point, but <b>divided by n it lands somewhere new</b>:` +
          `<span class="math display" data-tex="\\sqrt[${n}]{r\\angle\\theta} = \\sqrt[${n}]{r}\\;\\angle\\frac{\\theta + k\\cdot 360^\\circ}{${n}}"></span>` +
          `for ${T(`k = 0, 1, \\ldots, ${n - 1}`)}. After that the angles start repeating.`,
        `So there are <b>${n}</b> roots. Each increment of ${T("k")} adds ` +
          `${T(`\\frac{360^\\circ}{${n}} = ${num(step, 1)}^\\circ`)} to the angle.`,
        `They all have magnitude ${T(`\\sqrt[${n}]{${r}} = ${num(R, 3)}`)}, so they sit evenly spaced ` +
          `on one circle — like ${n} spokes of a wheel. The first is at ${num(first, 1)}°.`,
      ],
    };
  },
});

const ordName = (n) => ({ 2: "square", 3: "cube", 4: "fourth", 5: "fifth", 6: "sixth" }[n] || `${n}th`);

/* ==========================================================================
   Handbook Reflex items for Part 2
   ========================================================================== */

defineReflex([
  {
    part: "complex",
    stem: "A series circuit has R = 6 Ω and X_C = 8 Ω. Find the magnitude and angle of the impedance.",
    tool: "Rectangular to polar conversion",
    because: "Impedance is 6 − 8j; magnitude and angle is exactly the polar form.",
  },
  {
    part: "complex",
    stem: "Simplify (2 + 5j) / (1 − 3j).",
    tool: "Multiply by the conjugate",
    because: "A complex denominator is cleared by rationalising with its conjugate.",
  },
  {
    part: "complex",
    stem: "Find all values of z satisfying z⁴ = 16.",
    tool: "De Moivre's theorem",
    because: "Four roots, equal magnitude, spaced 90° apart around a circle.",
  },
  {
    part: "complex",
    stem: "Two voltages of the same frequency, 40∠30° V and 25∠−60° V, are in series. Find the total.",
    tool: "Convert to rectangular, then add",
    because: "Addition is componentwise; polar form cannot add directly.",
  },
  {
    part: "complex",
    stem: "Write 5 cos(377t + 20°) as a phasor.",
    tool: "Euler's formula",
    because: "A sinusoid at a fixed frequency is stored as one magnitude and one angle.",
  },
]);
