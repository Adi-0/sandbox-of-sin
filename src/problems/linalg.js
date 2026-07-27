/* ==========================================================================
   problems/linalg.js — generators for Part 5.
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed } from "../lib/fmt.js";

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;
const S = (v) => num(v).replace("−", "-");

const bmat = (rows) => `\\begin{bmatrix} ${rows.map((r) => r.map(S).join(" & ")).join(" \\\\ ")} \\end{bmatrix}`;
const vmat = (rows) => `\\begin{vmatrix} ${rows.map((r) => r.map(S).join(" & ")).join(" \\\\ ")} \\end{vmatrix}`;

const det2 = (m) => m[0][0] * m[1][1] - m[0][1] * m[1][0];
const det3 = (m) =>
  m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
  m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
  m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

/* ==========================================================================
   Determinants
   ========================================================================== */

defineProblem("determinant", {
  topic: "Determinants",
  lookup: "Mathematics → Linear algebra → Determinants (cofactor expansion)",
  make(rng) {
    const three = rng.chance(0.45);

    if (!three) {
      const m = [[rng.nz(-8, 8), rng.nz(-8, 8)], [rng.nz(-8, 8), rng.nz(-8, 8)]];
      const d = det2(m);
      return {
        stem: `Evaluate the determinant ${T(vmat(m))}.`,
        choices: [
          { text: S(d), why: "" },
          { text: S(m[0][0] * m[1][1] + m[0][1] * m[1][0]), why: "The two products are <b>subtracted</b>, not added." },
          { text: S(m[0][0] * m[0][1] - m[1][0] * m[1][1]), why: "You multiplied along the rows. A 2×2 determinant multiplies along the two <em>diagonals</em>." },
          { text: S(-d), why: "Sign flipped — you took down-left minus down-right instead of the other way round." },
        ],
        answer: 0,
        steps: [
          `<span class="math display" data-tex="${vmat(m)} = ad - bc"></span>`,
          `= (${S(m[0][0])})(${S(m[1][1])}) − (${S(m[0][1])})(${S(m[1][0])}) = ${S(m[0][0] * m[1][1])} − ${S(m[0][1] * m[1][0])}`,
          `= <b>${S(d)}</b>. ` + (d === 0
            ? "Zero, so this matrix is <b>singular</b> — no inverse, and any system built on it has no unique solution."
            : `Geometrically: this matrix scales every area by a factor of ${S(Math.abs(d))}${d < 0 ? ", and flips orientation" : ""}.`),
        ],
      };
    }

    const m = [
      [rng.int(-4, 5), rng.int(-4, 5), rng.int(-4, 5)],
      [rng.int(-4, 5), rng.int(-4, 5), rng.int(-4, 5)],
      [rng.int(-4, 5), rng.int(-4, 5), rng.int(-4, 5)],
    ];
    const d = det3(m);
    const a = m[0][0], b = m[0][1], c = m[0][2];
    const M1 = m[1][1] * m[2][2] - m[1][2] * m[2][1];
    const M2 = m[1][0] * m[2][2] - m[1][2] * m[2][0];
    const M3 = m[1][0] * m[2][1] - m[1][1] * m[2][0];

    return {
      stem: `Evaluate the determinant ${T(vmat(m))}.`,
      choices: [
        { text: S(d), why: "" },
        { text: S(a * M1 + b * M2 + c * M3), why: "The middle cofactor is <b>subtracted</b>. The signs alternate + − + along the top row, and this is the most common 3×3 error by far." },
        { text: S(a * M1 - b * M2), why: "The third term was dropped. All three entries of the expansion row contribute." },
        { text: S(m[0][0] * m[1][1] * m[2][2]), why: "That is only the main diagonal. The diagonal shortcut works for triangular matrices, not general ones." },
      ],
      answer: 0,
      steps: [
        `Expand along the top row, with alternating signs <b>+ − +</b>:` +
          `<span class="math display" data-tex="${S(a)}${vmat([[m[1][1], m[1][2]], [m[2][1], m[2][2]]])} - (${S(b)})${vmat([[m[1][0], m[1][2]], [m[2][0], m[2][2]]])} + (${S(c)})${vmat([[m[1][0], m[1][1]], [m[2][0], m[2][1]]])}"></span>`,
        `The three 2×2 determinants are ${S(M1)}, ${S(M2)} and ${S(M3)}.`,
        `= (${S(a)})(${S(M1)}) − (${S(b)})(${S(M2)}) + (${S(c)})(${S(M3)}) = <b>${S(d)}</b>`,
      ],
    };
  },
});

/* ==========================================================================
   Matrix multiplication
   ========================================================================== */

defineProblem("matrix-multiply", {
  topic: "Matrix multiplication",
  lookup: "Mathematics → Linear algebra → Matrix multiplication",
  make(rng) {
    const A = [[rng.int(-4, 5), rng.int(-4, 5)], [rng.int(-4, 5), rng.int(-4, 5)]];
    const B = [[rng.int(-4, 5), rng.int(-4, 5)], [rng.int(-4, 5), rng.int(-4, 5)]];
    const mul = (X, Y) => [
      [X[0][0] * Y[0][0] + X[0][1] * Y[1][0], X[0][0] * Y[0][1] + X[0][1] * Y[1][1]],
      [X[1][0] * Y[0][0] + X[1][1] * Y[1][0], X[1][0] * Y[0][1] + X[1][1] * Y[1][1]],
    ];
    const AB = mul(A, B), BA = mul(B, A);
    const elem = [[A[0][0] * B[0][0], A[0][1] * B[0][1]], [A[1][0] * B[1][0], A[1][1] * B[1][1]]];
    const same = JSON.stringify(AB) === JSON.stringify(BA);
    if (same) return this.make(rng);

    return {
      stem: `Given ${T(`A = ${bmat(A)}`)} and ${T(`B = ${bmat(B)}`)}, find ${T("AB")}.`,
      choices: [
        { tex: bmat(AB), why: "" },
        { tex: bmat(BA), why: `That is ${T("BA")}. Matrix multiplication does not commute — the order is part of the question.` },
        { tex: bmat(elem), why: "Entries were multiplied position by position. Matrix multiplication is <b>row dotted with column</b>, not elementwise." },
        { tex: bmat([[AB[0][0], AB[1][0]], [AB[0][1], AB[1][1]]]), why: "The result is transposed — rows and columns swapped in the answer." },
      ],
      answer: 0,
      steps: [
        `Each entry is a dot product: entry <span class="math">(i, j)</span> is row <span class="math">i</span> of ${T("A")} dotted with column <span class="math">j</span> of ${T("B")}.`,
        `Top-left: (${S(A[0][0])})(${S(B[0][0])}) + (${S(A[0][1])})(${S(B[1][0])}) = ${S(AB[0][0])}.  ` +
          `Top-right: (${S(A[0][0])})(${S(B[0][1])}) + (${S(A[0][1])})(${S(B[1][1])}) = ${S(AB[0][1])}.`,
        `Repeating for the second row:` +
          `<span class="math display" data-tex="AB = ${bmat(AB)}"></span>` +
          `Check the shape: (2×2)(2×2) → 2×2 ✓`,
      ],
    };
  },
});

/* ==========================================================================
   Cramer's rule
   ========================================================================== */

defineProblem("cramer", {
  topic: "Solving linear systems",
  lookup: "Mathematics → Linear algebra → Cramer's rule, matrix inverse",
  make(rng) {
    const x = rng.nz(-5, 5), y = rng.nz(-5, 5);
    const a1 = rng.nz(-5, 5), b1 = rng.nz(-5, 5);
    let a2 = rng.nz(-5, 5), b2 = rng.nz(-5, 5);
    if (Math.abs(a1 * b2 - b1 * a2) < 1) return this.make(rng);
    const c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y;
    const D = a1 * b2 - b1 * a2;
    const Dx = c1 * b2 - b1 * c2;

    const fmt = (a, b, c) => `${S(a)}x ${b < 0 ? "-" : "+"} ${Math.abs(b)}y = ${S(c)}`;

    return {
      stem:
        `Solve for ${T("x")}: ` +
        `<span class="math display" data-tex="\\begin{cases} ${fmt(a1, b1, c1)} \\\\ ${fmt(a2, b2, c2)} \\end{cases}"></span>`,
      choices: [
        { text: S(x), why: "" },
        { text: S(y), why: `That is ${T("y")}. With Cramer's rule, replacing the <b>first</b> column gives ${T("x")}; the second column gives ${T("y")}.` },
        { text: fixed(D / Dx, 3), why: "The fraction is upside down. It is |Aₓ| over |A|, the replaced determinant on top." },
        { text: S(-x), why: "Sign error — most likely in one of the 2×2 determinants." },
      ],
      answer: 0,
      steps: [
        `Determinant of the coefficient matrix first. It is the go/no-go check:` +
          `<span class="math display" data-tex="|A| = ${vmat([[a1, b1], [a2, b2]])} = ${S(D)}"></span>` +
          `Non-zero, so exactly one solution exists.`,
        `Replace the first column with the right-hand side:` +
          `<span class="math display" data-tex="|A_x| = ${vmat([[c1, b1], [c2, b2]])} = ${S(Dx)}"></span>`,
        `<span class="math display" data-tex="x = \\frac{|A_x|}{|A|} = \\frac{${S(Dx)}}{${S(D)}} = ${S(x)}"></span>` +
          `Check in the second equation: (${S(a2)})(${S(x)}) + (${S(b2)})(${S(y)}) = ${S(c2)} ✓`,
      ],
    };
  },
});

/* ==========================================================================
   Eigenvalues — solvable by trace and determinant
   ========================================================================== */

defineProblem("eigenvalues", {
  topic: "Eigenvalues",
  lookup: "Mathematics → Linear algebra → Eigenvalues, characteristic equation",
  make(rng) {
    const l1 = rng.nz(-6, 6);
    let l2 = rng.nz(-6, 6);
    if (l1 === l2) l2 = l1 + rng.pick([1, 2, -1]);
    // build a matrix with those eigenvalues via a shear-conjugated diagonal
    const k = rng.nz(-2, 2);
    const m = [[l1, k * (l1 - l2)], [0, l2]];
    if (rng.chance(0.5)) { m[1][0] = m[0][1]; m[0][1] = 0; }
    const tr = m[0][0] + m[1][1], dt = det2(m);

    return {
      stem: `What are the eigenvalues of ${T(bmat(m))}?`,
      choices: [
        { text: `${S(Math.min(l1, l2))}, ${S(Math.max(l1, l2))}`, why: "" },
        { text: `${S(-l1)}, ${S(-l2)}`, why: `Both signs flipped. Check against the trace: the eigenvalues must sum to ${S(tr)}.` },
        { text: `${S(m[0][0])}, ${S(m[0][1] + m[1][0])}`, why: "Those are entries of the matrix, not eigenvalues. They happen to coincide only for a diagonal matrix." },
        { text: `${S(l1 + 1)}, ${S(l2 - 1)}`, why: `The sum is right but the product is not: these multiply to ${S((l1 + 1) * (l2 - 1))}, and the determinant is ${S(dt)}.` },
      ],
      answer: 0,
      steps: [
        `You can solve ${T("\\det(A - \\lambda I) = 0")}, but on a multiple-choice exam there is a faster route.`,
        `<b>Trace</b> = ${S(m[0][0])} + ${S(m[1][1])} = ${S(tr)}, so the two eigenvalues must <b>sum</b> to ${S(tr)}.<br>` +
          `<b>Determinant</b> = ${S(dt)}, so they must <b>multiply</b> to ${S(dt)}.`,
        `Only ${S(l1)} and ${S(l2)} satisfy both: ${S(l1)} + ${S(l2)} = ${S(tr)} ✓ and ` +
          `(${S(l1)})(${S(l2)}) = ${S(dt)} ✓. <b>Two multiplications, no quadratic.</b>`,
      ],
    };
  },
});

/* ==========================================================================
   Shape rule
   ========================================================================== */

defineProblem("matrix-shape", {
  topic: "Matrix dimensions",
  lookup: "Mathematics → Linear algebra → Matrix operations",
  make(rng) {
    const m = rng.int(2, 5), n = rng.int(2, 5), p = rng.int(2, 5);
    const askDefined = rng.chance(0.4);

    if (askDefined) {
      const q = rng.pick([n, n, n + 1]);
      const ok = q === n;
      return {
        stem:
          `${T("A")} is ${m}×${n} and ${T("B")} is ${q}×${p}. What is the product ${T("AB")}?`,
        choices: [
          { text: ok ? `a ${m}×${p} matrix` : "undefined — the dimensions do not match", why: "" },
          { text: ok ? "undefined — the dimensions do not match" : `a ${m}×${p} matrix`,
            why: ok
              ? `The inner dimensions are both ${n}, so the product is defined.`
              : `The inner dimensions are ${n} and ${q}. They differ, so no product exists.` },
          { text: `a ${q}×${n} matrix`, why: "The surviving dimensions are the <b>outer</b> two, in order: rows of the first, columns of the second." },
          { text: `a ${m}×${q} matrix`, why: "The columns of the second matrix set the answer's width, not its row count." },
        ],
        answer: 0,
        steps: [
          `Write the shapes next to each other: (${m}×${n})(${q}×${p}).`,
          `The two <b>inner</b> numbers must be equal — here ${n} and ${q}. ` +
            (ok ? "They match, so the product exists and they cancel." : "They differ, so the product does not exist. Stop."),
          ok
            ? `The two <b>outer</b> numbers survive: the product is <b>${m}×${p}</b>.`
            : `<b>Undefined.</b> No amount of arithmetic fixes a shape mismatch — and this is worth checking before you compute anything.`,
        ],
      };
    }

    return {
      stem: `${T("A")} is ${m}×${n} and ${T("B")} is ${n}×${p}. What are the dimensions of ${T("AB")}?`,
      choices: [
        { text: `${m}×${p}`, why: "" },
        { text: `${n}×${n}`, why: "The inner dimensions cancel — they are what makes the product legal, not what it becomes." },
        { text: `${p}×${m}`, why: "Right numbers, wrong order. Rows come from the first matrix." },
        { text: `${m}×${n}`, why: "That is the shape of A alone. Multiplying by B changes the column count." },
      ],
      answer: 0,
      steps: [
        `(${m}×${n})(${n}×${p}): the inner pair must match, and they do.`,
        `Inner dimensions cancel; outer dimensions survive.`,
        `So ${T("AB")} is <b>${m}×${p}</b>. This rule alone answers several exam questions without any arithmetic.`,
      ],
    };
  },
});

/* ==========================================================================
   Handbook Reflex items for Part 5
   ========================================================================== */

defineReflex([
  {
    part: "linear-algebra",
    stem: "For what value of k does the system 2x + ky = 3, 4x + 6y = 7 fail to have a unique solution?",
    tool: "Set the determinant to zero",
    because: "No unique solution is exactly the singular case.",
  },
  {
    part: "linear-algebra",
    stem: "Three mesh equations in three unknown currents; find only I₂.",
    tool: "Cramer's rule",
    because: "It gives one unknown directly without solving for the other two.",
  },
  {
    part: "linear-algebra",
    stem: "A 2×2 matrix has trace 7 and determinant 12. Find its eigenvalues.",
    tool: "Trace and determinant check",
    because: "Sum 7 and product 12 pins them to 3 and 4 with no characteristic equation.",
  },
  {
    part: "linear-algebra",
    stem: "Find the area of the parallelogram spanned by (3, 1) and (1, 4).",
    tool: "Determinant as area",
    because: "The 2×2 determinant of those two columns is that area.",
  },
  {
    part: "linear-algebra",
    stem: "A is 3×4 and B is 4×2. Can you form AB, and what size is it?",
    tool: "The shape rule",
    because: "Inner dimensions match and cancel; the outer pair survives.",
  },
]);
