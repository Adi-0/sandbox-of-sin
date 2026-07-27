/* ==========================================================================
   problems/geometry.js — generators for Part 3.
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed } from "../lib/fmt.js";

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;
const S = (v) => num(v).replace("−", "-");     // TeX wants a plain hyphen

/* ==========================================================================
   A line through two points
   ========================================================================== */

defineProblem("line-through", {
  topic: "Straight lines",
  lookup: "Mathematics → Analytic geometry → Straight line (slope, forms, distance)",
  make(rng) {
    const x1 = rng.int(-6, 4), y1 = rng.int(-6, 4);
    const dx = rng.nz(-6, 6), dy = rng.nz(-6, 6);
    const x2 = x1 + dx, y2 = y1 + dy;
    const m = dy / dx;
    const want = rng.pick(["slope", "distance", "perp"]);

    if (want === "distance") {
      const d = Math.hypot(dx, dy);
      return {
        stem: `What is the distance between ${T(`(${S(x1)}, ${S(y1)})`)} and ${T(`(${S(x2)}, ${S(y2)})`)}, most nearly?`,
        choices: [
          { text: fixed(d, 3), why: "" },
          { text: fixed(Math.abs(dx) + Math.abs(dy), 3), why: "You added the legs instead of using Pythagoras. That is the distance walking along the grid, not the straight line." },
          { text: fixed(d * d, 3), why: "That is the distance <em>squared</em> — the radical was never taken." },
          { text: fixed(Math.abs(Math.abs(dx) - Math.abs(dy)), 3), why: "The legs were subtracted. The distance formula squares and adds." },
        ],
        answer: 0,
        steps: [
          `<span class="math display" data-tex="d = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}"></span>`,
          `<span class="math display" data-tex="= \\sqrt{(${S(dx)})^2 + (${S(dy)})^2} = \\sqrt{${dx * dx + dy * dy}}"></span>`,
          `= <b>${fixed(d, 3)}</b>. This is Pythagoras with the legs written as coordinate differences — signs cannot matter, because both get squared.`,
        ],
      };
    }

    if (want === "perp") {
      const mp = -1 / m;
      return {
        stem:
          `A line passes through ${T(`(${S(x1)}, ${S(y1)})`)} and ${T(`(${S(x2)}, ${S(y2)})`)}. ` +
          `What is the slope of any line perpendicular to it?`,
        choices: [
          { text: fixed(mp, 3), why: "" },
          { text: fixed(m, 3), why: "That is the slope of the original line. Perpendicular means the <b>negative reciprocal</b>." },
          { text: fixed(1 / m, 3), why: "You took the reciprocal but not the negative. Both are needed for the product to be −1." },
          { text: fixed(-m, 3), why: "You negated but did not invert." },
        ],
        answer: 0,
        steps: [
          `Slope of the given line: ${T(`m = \\frac{${S(dy)}}{${S(dx)}} = ${fixed(m, 3)}`)}`,
          `Perpendicular slopes multiply to −1, so ${T(`m_\\perp = -\\frac{1}{m}`)}:` +
            `<span class="math display" data-tex="m_\\perp = -\\frac{1}{${fixed(m, 3)}} = ${fixed(mp, 3)}"></span>`,
          `Check: ${fixed(m, 3)} × ${fixed(mp, 3)} = ${fixed(m * mp, 3)} ✓ — <b>${fixed(mp, 3)}</b>.`,
        ],
      };
    }

    return {
      stem: `What is the slope of the line through ${T(`(${S(x1)}, ${S(y1)})`)} and ${T(`(${S(x2)}, ${S(y2)})`)}?`,
      choices: [
        { text: fixed(m, 3), why: "" },
        { text: fixed(dx / dy, 3), why: "Upside down. Slope is <b>rise over run</b> — the change in y on top." },
        { text: fixed(-m, 3), why: "Sign error in one of the differences. Subtract in the same order top and bottom." },
        { text: fixed(-1 / m, 3), why: "That is the slope of a line <em>perpendicular</em> to this one." },
      ],
      answer: 0,
      steps: [
        `<span class="math display" data-tex="m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{${S(y2)} - (${S(y1)})}{${S(x2)} - (${S(x1)})}"></span>`,
        `<span class="math display" data-tex="= \\frac{${S(dy)}}{${S(dx)}} = ${fixed(m, 3)}"></span>`,
        `<b>${fixed(m, 3)}</b>. Subtract the two points in the <em>same order</em> on top and bottom — reversing one and not the other is where the sign errors come from.`,
      ],
    };
  },
});

/* ==========================================================================
   Circle centre from general form — completing the square
   ========================================================================== */

defineProblem("circle-center", {
  topic: "Circles",
  lookup: "Mathematics → Analytic geometry → Conic sections (circle)",
  make(rng) {
    const h = rng.nz(-6, 6), k = rng.nz(-6, 6);
    const r2 = rng.pick([4, 9, 16, 20, 25, 36]);
    const D = -2 * h, E = -2 * k, F = h * h + k * k - r2;
    const term = (c, v) => (c === 0 ? "" : ` ${c > 0 ? "+" : "-"} ${Math.abs(c) === 1 ? "" : Math.abs(c)}${v}`);

    return {
      stem:
        `The equation of a circle is ` +
        T(`x^2 + y^2${term(D, "x")}${term(E, "y")}${F === 0 ? "" : ` ${F > 0 ? "+" : "-"} ${Math.abs(F)}`} = 0`) +
        `. What are the coordinates of its centre?`,
      choices: [
        { text: `(${S(h)}, ${S(k)})`, why: "" },
        { text: `(${S(D)}, ${S(E)})`, why: "Those are the linear coefficients themselves. The centre is <b>half of each, with the sign flipped</b>." },
        { text: `(${S(-h)}, ${S(-k)})`, why: `Both signs are wrong. Completing the square gives ${T(`(x - h)^2`)}, so a <em>plus</em> in the equation means a <em>negative</em> coordinate.` },
        { text: `(${S(D / 2)}, ${S(E / 2)})`, why: "You halved but did not flip the sign." },
      ],
      answer: 0,
      steps: [
        `Complete the square in ${T("x")}: half of ${S(D)} is ${S(D / 2)}, so ` +
          `${T(`x^2 ${D >= 0 ? "+" : "-"} ${Math.abs(D)}x = (x ${D >= 0 ? "+" : "-"} ${Math.abs(D / 2)})^2 - ${(D / 2) ** 2}`)}.`,
        `Same in ${T("y")}: half of ${S(E)} is ${S(E / 2)}, giving ` +
          `${T(`(y ${E >= 0 ? "+" : "-"} ${Math.abs(E / 2)})^2 - ${(E / 2) ** 2}`)}.`,
        `Reassembled: ` +
          `<span class="math display" data-tex="(x ${D >= 0 ? "+" : "-"} ${Math.abs(D / 2)})^2 + (y ${E >= 0 ? "+" : "-"} ${Math.abs(E / 2)})^2 = ${r2}"></span>` +
          `Centre <b>(${S(h)}, ${S(k)})</b>, radius ${fixed(Math.sqrt(r2), 3)}. ` +
          `The shortcut worth trusting: centre = ${T("(-D/2,\\; -E/2)")}.`,
      ],
    };
  },
});

/* ==========================================================================
   Identifying a conic by inspection
   ========================================================================== */

defineProblem("conic-id", {
  topic: "Conic sections",
  lookup: "Mathematics → Analytic geometry → Conic sections",
  make(rng) {
    const kind = rng.pick(["circle", "ellipse", "hyperbola", "parabola"]);
    const a = rng.pick([2, 3, 4]), b = rng.pick([5, 6, 9]);
    const eqs = {
      circle: `${a}x^2 + ${a}y^2 = ${a * b}`,
      ellipse: `${a}x^2 + ${b}y^2 = ${a * b}`,
      hyperbola: `${a}x^2 - ${b}y^2 = ${a * b}`,
      parabola: `y^2 = ${a * 4}x`,
    };
    const whys = {
      circle: "both variables squared, added, and with <b>equal</b> coefficients",
      ellipse: "both variables squared and added, but with <b>unequal</b> coefficients",
      hyperbola: "both variables squared but <b>subtracted</b>",
      parabola: "<b>only one</b> variable is squared",
    };

    return {
      stem: `What kind of curve is ${T(eqs[kind])}?`,
      choices: ["circle", "ellipse", "hyperbola", "parabola"].map((c) => ({
        text: c,
        why: c === kind ? "" : `A ${c} has ${whys[c]}. This one has ${whys[kind]}.`,
      })),
      answer: ["circle", "ellipse", "hyperbola", "parabola"].indexOf(kind),
      steps: [
        `Do not compute anything yet. Look only at the squared terms — that alone settles it:`,
        `<b>Both squared, added, equal coefficients</b> → circle.<br>` +
          `<b>Both squared, added, unequal</b> → ellipse.<br>` +
          `<b>Both squared, subtracted</b> → hyperbola.<br>` +
          `<b>Only one squared</b> → parabola.`,
        `Here: ${whys[kind]}. So it is a <b>${kind}</b>. ` +
          `This classification takes two seconds and usually strikes out half the options.`,
      ],
    };
  },
});

/* ==========================================================================
   Tangent slope on a circle — no calculus needed
   ========================================================================== */

defineProblem("tangent-slope", {
  topic: "Tangents to circles",
  lookup: "Mathematics → Analytic geometry → Circle; perpendicular slopes",
  make(rng) {
    const [x, y, r] = rng.pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [8, 6, 10], [6, 8, 10]]);
    const sx = rng.sign(), sy = rng.sign();
    const px = x * sx, py = y * sy;
    const mR = py / px, mT = -px / py;

    return {
      stem:
        `The point ${T(`(${S(px)}, ${S(py)})`)} lies on the circle ` +
        `${T(`x^2 + y^2 = ${r * r}`)}. What is the slope of the tangent line there?`,
      choices: [
        { text: fixed(mT, 4), why: "" },
        { text: fixed(mR, 4), why: "That is the slope of the <b>radius</b>. The tangent is perpendicular to it." },
        { text: fixed(-mR, 4), why: "Negated but not inverted — you need the negative <em>reciprocal</em>." },
        { text: fixed(1 / mR, 4), why: "Inverted but not negated." },
      ],
      answer: 0,
      steps: [
        `Check the point really is on the circle: ` +
          `${T(`(${S(px)})^2 + (${S(py)})^2 = ${px * px + py * py} = ${r * r}`)} ✓`,
        `The radius from the origin to that point has slope ` +
          `${T(`\\frac{${S(py)}}{${S(px)}} = ${fixed(mR, 4)}`)}.`,
        `A tangent is perpendicular to the radius, so take the negative reciprocal:` +
          `<span class="math display" data-tex="m = -\\frac{1}{${fixed(mR, 4)}} = -\\frac{${S(px)}}{${S(py)}} = ${fixed(mT, 4)}"></span>` +
          `<b>${fixed(mT, 4)}</b>. Implicit differentiation in Part 6 gives ${T("dy/dx = -x/y")} — the same thing.`,
      ],
    };
  },
});

/* ==========================================================================
   Eliminating a parameter
   ========================================================================== */

defineProblem("parametric-path", {
  topic: "Parametric equations",
  lookup: "Mathematics → Analytic geometry → Parametric and polar forms",
  make(rng) {
    const A = rng.pick([2, 3, 4, 6, 8]);
    const B = rng.pick([2, 3, 4, 5, 6].filter((v) => v !== A));
    const K = A * A * B * B;
    const cA = K / (A * A), cB = K / (B * B);

    return {
      stem:
        `A particle moves so that ${T(`x = ${A}\\sin t`)} and ${T(`y = ${B}\\cos t`)}. ` +
        `Which equation describes its path?`,
      choices: [
        { tex: `${cA}x^2 + ${cB}y^2 = ${K}`, why: "" },
        { tex: `${cA}x^2 - ${cB}y^2 = ${K}`, why: "A minus sign makes it a hyperbola. The Pythagorean identity <b>adds</b> the two squares." },
        { tex: `${cB}x^2 + ${cA}y^2 = ${K}`, why: `The denominators are swapped. ${T("x")} is divided by ${T(String(A))}, so ${T("x^2")} is divided by ${T(String(A * A))}.` },
        { tex: `x^2 + y^2 = ${A * A + B * B}`, why: "That would be a circle. It is only a circle when the two amplitudes are equal, and here they are not." },
      ],
      answer: 0,
      steps: [
        `A sine and a cosine of the same argument means the Pythagorean identity is the way out. Isolate them:` +
          `<span class="math display" data-tex="\\sin t = \\frac{x}{${A}}, \\qquad \\cos t = \\frac{y}{${B}}"></span>`,
        `Substitute into ${T("\\sin^2 t + \\cos^2 t = 1")}, which holds for every ${T("t")} — that is what kills the parameter:` +
          `<span class="math display" data-tex="\\frac{x^2}{${A * A}} + \\frac{y^2}{${B * B}} = 1"></span>`,
        `Multiply through by ${K} to match the answer options:` +
          `<span class="math display" data-tex="${cA}x^2 + ${cB}y^2 = ${K}"></span>` +
          `An <b>ellipse</b> with semi-axes ${A} and ${B}.`,
      ],
    };
  },
});

/* ==========================================================================
   Handbook Reflex items for Part 3
   ========================================================================== */

defineReflex([
  {
    part: "geometry",
    stem: "Given x² + y² − 6x + 10y + 9 = 0, find the radius.",
    tool: "Complete the square",
    because: "General form to standard form is what exposes the centre and radius.",
  },
  {
    part: "geometry",
    stem: "Find the equation of the line perpendicular to 3x + 4y = 12 through (1, 2).",
    tool: "Negative reciprocal slope",
    because: "Read the slope off the general form, invert it, flip its sign, then point-slope.",
  },
  {
    part: "geometry",
    stem: "A curve satisfies 9x² − 4y² = 36. Describe it.",
    tool: "Classify by the squared terms",
    because: "Both squared and subtracted means a hyperbola — no computation needed.",
  },
  {
    part: "geometry",
    stem: "x = 5 cos t, y = 5 sin t. What shape does the particle trace?",
    tool: "Pythagorean identity",
    because: "Equal amplitudes with a sine and cosine pair gives a circle of that radius.",
  },
  {
    part: "geometry",
    stem: "Find the shortest distance from the point (7, 1) to the line 4x − 3y = 2.",
    tool: "Point-to-line distance formula",
    because: "A perpendicular distance from a point to a line is its own handbook entry.",
  },
]);
