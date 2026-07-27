/* ==========================================================================
   problems/vectors.js — generators for Part 4.
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed } from "../lib/fmt.js";

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;
const S = (v) => num(v).replace("−", "-");

/** "3i + 4j - 5k", skipping zero components. */
function vecTex(v) {
  const parts = [];
  const names = ["\\hat{i}", "\\hat{j}", "\\hat{k}"];
  v.forEach((c, i) => {
    if (c === 0) return;
    const mag = Math.abs(c) === 1 ? "" : String(Math.abs(c));
    parts.push(`${parts.length === 0 ? (c < 0 ? "-" : "") : c < 0 ? " - " : " + "}${mag}${names[i]}`);
  });
  return parts.length ? parts.join("") : "\\vec{0}";
}

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const mag = (a) => Math.hypot(a[0], a[1], a[2]);

/* ==========================================================================
   Magnitude of a resultant
   ========================================================================== */

defineProblem("vector-magnitude", {
  topic: "Vector magnitude",
  lookup: "Mathematics → Vectors → Addition, magnitude",
  make(rng) {
    const n = rng.int(2, 3);
    const vs = [];
    for (let i = 0; i < n; i++) vs.push([rng.int(-8, 9), rng.int(-8, 9), rng.int(-6, 7)]);
    const R = [0, 1, 2].map((k) => vs.reduce((s, v) => s + v[k], 0));
    const m = mag(R);
    if (m < 2 || m > 40) return this.make(rng);

    return {
      stem:
        `Forces ${vs.map((v) => T(vecTex(v))).join(", ")} act at a single point. ` +
        `What is the magnitude of the resultant, most nearly?`,
      choices: [
        { text: fixed(m, 2), why: "" },
        { text: fixed(vs.reduce((s, v) => s + mag(v), 0), 2),
          why: "You added the individual magnitudes. Vectors that point in different directions partly cancel — you must add <b>components</b> first, then take the magnitude." },
        { text: fixed(Math.abs(R[0]) + Math.abs(R[1]) + Math.abs(R[2]), 2),
          why: "The components were added without squaring. Magnitude is the square root of the sum of squares." },
        { text: fixed(m * m, 2), why: "That is the magnitude squared — the radical was never taken." },
      ],
      answer: 0,
      steps: [
        `Add componentwise. This is the whole reason vectors have components:` +
          `<span class="math display" data-tex="\\vec{R} = ${vecTex(R)}"></span>`,
        `Now the magnitude:` +
          `<span class="math display" data-tex="|\\vec{R}| = \\sqrt{(${S(R[0])})^2 + (${S(R[1])})^2 + (${S(R[2])})^2} = \\sqrt{${R[0] ** 2 + R[1] ** 2 + R[2] ** 2}}"></span>`,
        `= <b>${fixed(m, 2)}</b>. Note it is smaller than the sum of the individual ` +
          `magnitudes (${fixed(vs.reduce((s, v) => s + mag(v), 0), 2)}) — the forces partly cancel, which is the point.`,
      ],
    };
  },
});

/* ==========================================================================
   Angle between two vectors
   ========================================================================== */

defineProblem("dot-angle", {
  topic: "Dot product",
  lookup: "Mathematics → Vectors → Dot product, angle between vectors",
  make(rng) {
    const A = [rng.int(1, 6), rng.int(1, 6), rng.int(0, 4)];
    const B = [rng.int(1, 6), rng.int(1, 6), rng.int(0, 4)];
    const d = dot(A, B);
    const c = d / (mag(A) * mag(B));
    const th = Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI;
    if (th < 4 || th > 86) return this.make(rng);

    return {
      stem:
        `What is the acute angle between ${T(`\\vec{A} = ${vecTex(A)}`)} and ` +
        `${T(`\\vec{B} = ${vecTex(B)}`)}, most nearly?`,
      choices: [
        { text: `${fixed(th, 1)}°`, why: "" },
        { text: `${fixed(90 - th, 1)}°`, why: "The complement. You may have used sine where the dot product wants cosine." },
        { text: `${fixed(Math.acos(Math.max(-1, Math.min(1, d / (mag(A) * mag(A))))) * 180 / Math.PI, 1)}°`,
          why: "One of the magnitudes in the denominator is wrong — it should be |A| times |B|, not a repeat." },
        { text: `${fixed(Math.atan2(mag(cross(A, B)), d) * 180 / Math.PI + 12, 1)}°`,
          why: "Close, but the arithmetic slipped. Recompute the dot product term by term." },
      ],
      answer: 0,
      steps: [
        `Dot product from components — no angle needed yet:` +
          `<span class="math display" data-tex="\\vec{A}\\cdot\\vec{B} = (${A[0]})(${B[0]}) + (${A[1]})(${B[1]}) + (${A[2]})(${B[2]}) = ${d}"></span>`,
        `Magnitudes: ${T(`|\\vec{A}| = \\sqrt{${A[0] ** 2 + A[1] ** 2 + A[2] ** 2}} = ${fixed(mag(A), 3)}`)}, ` +
          `${T(`|\\vec{B}| = \\sqrt{${B[0] ** 2 + B[1] ** 2 + B[2] ** 2}} = ${fixed(mag(B), 3)}`)}`,
        `Set the two forms of the dot product equal and solve for the angle:` +
          `<span class="math display" data-tex="\\cos\\theta = \\frac{${d}}{(${fixed(mag(A), 3)})(${fixed(mag(B), 3)})} = ${fixed(c, 4)}"></span>` +
          `<b>θ = ${fixed(th, 1)}°</b>`,
      ],
    };
  },
});

/* ==========================================================================
   Cross product
   ========================================================================== */

defineProblem("cross-product", {
  topic: "Cross product",
  lookup: "Mathematics → Vectors → Cross product (determinant form)",
  make(rng) {
    const A = [rng.nz(-5, 5), rng.nz(-5, 5), rng.int(-4, 4)];
    const B = [rng.nz(-5, 5), rng.nz(-5, 5), rng.int(-4, 4)];
    const C = cross(A, B);
    if (mag(C) < 2) return this.make(rng);

    const signFlip = [C[0], -C[1], C[2]];         // forgetting the middle minus
    return {
      stem: `Find ${T(`\\vec{A} \\times \\vec{B}`)} for ${T(`\\vec{A} = ${vecTex(A)}`)} and ${T(`\\vec{B} = ${vecTex(B)}`)}.`,
      choices: [
        { tex: vecTex(C), why: "" },
        { tex: vecTex(signFlip), why: "The <b>j</b> component of a 3×3 determinant carries a minus sign when you expand along the top row. This is the single most common cross-product error." },
        { tex: vecTex(cross(B, A)), why: `That is ${T("\\vec{B} \\times \\vec{A}")}, which is the negative. Order matters for cross products.` },
        { tex: String(dot(A, B)), why: "That is the dot product — a number. A cross product returns a vector." },
      ],
      answer: 0,
      steps: [
        `Set up the determinant:` +
          `<span class="math display" data-tex="\\begin{vmatrix} \\hat{i} & \\hat{j} & \\hat{k} \\\\ ${A[0]} & ${A[1]} & ${A[2]} \\\\ ${B[0]} & ${B[1]} & ${B[2]} \\end{vmatrix}"></span>`,
        `Expand along the top row, remembering the middle term is <b>subtracted</b>:` +
          `<span class="math display" data-tex="\\hat{i}\\big[(${A[1]})(${B[2]}) - (${A[2]})(${B[1]})\\big] - \\hat{j}\\big[(${A[0]})(${B[2]}) - (${A[2]})(${B[0]})\\big] + \\hat{k}\\big[(${A[0]})(${B[1]}) - (${A[1]})(${B[0]})\\big]"></span>`,
        `= <b>${T(vecTex(C))}</b>. Check it: the result must be perpendicular to both inputs, so ` +
          `${T(`\\vec{A}\\cdot(\\vec{A}\\times\\vec{B}) = ${dot(A, C)}`)} ✓`,
      ],
    };
  },
});

/* ==========================================================================
   Unit vector
   ========================================================================== */

defineProblem("unit-vector", {
  topic: "Unit vectors",
  lookup: "Mathematics → Vectors → Unit vector",
  make(rng) {
    const trip = rng.pick([[3, 4, 12], [1, 2, 2], [2, 3, 6], [4, 4, 7], [6, 6, 7], [2, 6, 9]]);
    const A = trip.map((v) => v * rng.sign());
    const m = mag(A);

    return {
      stem: `What is the unit vector in the direction of ${T(vecTex(A))}?`,
      choices: [
        { tex: `\\frac{1}{${fixed(m, 0)}}\\left(${vecTex(A)}\\right)`, why: "" },
        { tex: `\\frac{1}{${A[0] ** 2 + A[1] ** 2 + A[2] ** 2}}\\left(${vecTex(A)}\\right)`,
          why: "You divided by the magnitude <b>squared</b>. That leaves a vector of length 1/|A|, not 1." },
        { tex: `${fixed(m, 0)}\\left(${vecTex(A)}\\right)`, why: "Multiplied instead of divided — this makes the vector longer, not unit length." },
        { tex: vecTex(A), why: "That is the original vector, whose length is " + fixed(m, 0) + ", not 1." },
      ],
      answer: 0,
      steps: [
        `A unit vector keeps the direction and throws away the size, so divide by the size:` +
          `<span class="math display" data-tex="\\hat{a} = \\frac{\\vec{A}}{|\\vec{A}|}"></span>`,
        `<span class="math display" data-tex="|\\vec{A}| = \\sqrt{${A[0] ** 2 + A[1] ** 2 + A[2] ** 2}} = ${fixed(m, 0)}"></span>`,
        `<span class="math display" data-tex="\\hat{a} = \\frac{1}{${fixed(m, 0)}}\\left(${vecTex(A)}\\right)"></span>` +
          `Check: ${T(`\\sqrt{(${S(A[0])}/${fixed(m, 0)})^2 + \\ldots} = 1`)} ✓ — always worth ten seconds.`,
      ],
    };
  },
});

/* ==========================================================================
   Which field operator
   ========================================================================== */

defineProblem("field-operator", {
  topic: "Vector calculus operators",
  lookup: "Mathematics → Vector analysis → Gradient, divergence, curl",
  make(rng) {
    const cases = [
      { q: "the direction of steepest increase of a temperature field", a: "Gradient",
        why: "Scalar field in, vector out — and it points uphill." },
      { q: "whether a fluid velocity field has a source at a point", a: "Divergence",
        why: "Vector field in, number out — positive means the field is spreading from that point." },
      { q: "whether a paddle wheel dropped into a flow would spin", a: "Curl",
        why: "Vector field in, vector out — it measures circulation." },
      { q: "a vector perpendicular to a surface described by f(x, y, z) = c", a: "Gradient",
        why: "The gradient is always perpendicular to the level surface." },
      { q: "the net outward flux per unit volume at a point in an electric field", a: "Divergence",
        why: "That phrase is the definition of divergence." },
    ];
    const c = rng.pick(cases);
    const opts = ["Gradient", "Divergence", "Curl"];
    const whys = {
      Gradient: "Gradient takes a <b>scalar</b> field and returns a vector.",
      Divergence: "Divergence takes a <b>vector</b> field and returns a number.",
      Curl: "Curl takes a <b>vector</b> field and returns a vector measuring circulation.",
    };

    return {
      stem: `Which operator gives ${c.q}?`,
      choices: [
        { text: c.a, why: "" },
        ...opts.filter((o) => o !== c.a).map((o) => ({ text: o, why: `${whys[o]} ${c.why}` })),
        { text: "The Laplacian", why: `That is ${T("\\nabla^2")}, divergence of a gradient. ${c.why}` },
      ],
      answer: 0,
      steps: [
        `Classify by what goes in and what comes out — that alone settles every question of this shape:`,
        `<b>Gradient</b>: scalar in → vector out.<br>` +
          `<b>Divergence</b>: vector in → scalar out.<br>` +
          `<b>Curl</b>: vector in → vector out.`,
        `${c.why} So the answer is <b>${c.a}</b>.`,
      ],
    };
  },
});

/* ==========================================================================
   Handbook Reflex items for Part 4
   ========================================================================== */

defineReflex([
  {
    part: "vectors",
    stem: "A force of 200 N acts at 35° to a 12 m displacement. Find the work done.",
    tool: "Dot product",
    because: "Work is a number, and the cosine picks out the useful part of the force.",
  },
  {
    part: "vectors",
    stem: "Find a vector perpendicular to both 2i + j and i − 3k.",
    tool: "Cross product",
    because: "Perpendicular to two vectors at once is exactly what a cross product returns.",
  },
  {
    part: "vectors",
    stem: "Are the vectors 3i − 2j + k and 2i + 4j + 2k at right angles?",
    tool: "Dot product equals zero",
    because: "A zero dot product is the perpendicularity test — one line of arithmetic.",
  },
  {
    part: "vectors",
    stem: "For f(x, y) = x²y, find the direction of fastest increase at (1, 2).",
    tool: "Gradient",
    because: "Scalar field in, vector out, pointing uphill.",
  },
  {
    part: "vectors",
    stem: "Determine whether the field F = xi + yj + zk has a source at the origin.",
    tool: "Divergence",
    because: "Sources and sinks are what divergence measures.",
  },
]);
