# The Bench — plan of record

An interactive educator for the **FE Electrical and Computer** exam.
This branch covers **Topic 1: Mathematics** (11–17 of 110 questions).

This file is the durable memory across turns. Read it first.

---

## 1. What the exam actually asks

From the NCEES *FE Electrical and Computer CBT Exam Specifications*
(effective July 2020), knowledge area 1:

| Code | Subtopic | Where it lives here |
|---|---|---|
| 1.A | Algebra and trigonometry | Part 1 |
| 1.B | Complex numbers | Part 2 |
| 1.C | Discrete mathematics | Part 8 |
| 1.D | Analytic geometry | Part 3 |
| 1.E | Calculus (differential, integral, single- and multivariable) | Part 6 |
| 1.F | Ordinary differential equations | Part 7 |
| 1.G | Linear algebra | Part 5 |
| 1.H | Vector analysis | Part 4 |

Exam conditions that shape every design decision:

- **110 questions, 6 hours** → ~2 min 50 s per question, including reading.
- **Closed book with an electronic reference** (the NCEES FE Reference
  Handbook). Formulas are *given*. Recognition and execution are not.
- Answers are multiple choice, usually phrased "most nearly."

So the bottleneck is **not** derivation. It is: read stem → classify problem
type → recall which handbook plate holds the tool → execute arithmetic
without a sign error. Everything in this tool is built to train that loop.

## 2. The one design decision everything follows from

Every formula is stamped **HANDBOOK** or **KNOW COLD**.

- `HANDBOOK` — it is in the reference handbook on exam day. Do not burn
  memory on it. Burn memory on *knowing it exists* and what it is called.
- `KNOW COLD` — it is not in the handbook, or looking it up costs more time
  than the question is worth. This is the actual memorization list, and it
  is much shorter than students fear.

No other FE resource makes that distinction visible. It is the single
highest-leverage thing a student can be told, so it gets to be the
signature element of the design.

## 3. The recurring cast

One object, followed through all eight subtopics. Recognition is retention.

| Part | The cast appears as |
|---|---|
| 1 | The **3-4-5 right triangle**. θ = 36.87°, sin θ = 0.6, cos θ = 0.8 |
| 2 | **z₀ = 3 + 4j** = 5∠36.87°. z₀² = −7 + 24j = 25∠73.74° |
| 3 | The circle **x² + y² = 25** through (3, 4); tangent slope −3/4 |
| 4 | **w = 3i + 4j + 12k**, \|w\| = 13 — the triple nests |
| 5 | **A = [[3, 4], [4, −3]]**, det = −25, eigenvalues **±5** |
| 6 | Implicit d/dx on x² + y² = 25 → dy/dx = −x/y = −3/4 (same tangent) |
| 7 | **y″ + 6y′ + 25y = 0** → roots **−3 ± 4j**, ωₙ = 5, ζ = 0.6 |
| 8 | A 5-node graph; its adjacency matrix returns to Part 5 |

The payoff: the triangle a student drew in Part 1 becomes, in Part 7, the
characteristic root that decides whether a circuit rings or not. Same
numbers, no contrivance.

## 4. The arc

| # | Part | Read | Why it comes here |
|---|---|---|---|
| 0 | Orientation — what the exam really tests | 6 min | Sets the HANDBOOK/KNOW COLD contract |
| 1 | Algebra and Trigonometry | 26 min | Every later part uses ratios and logs |
| 2 | Complex Numbers | 20 min | A rotated triangle; the language of AC |
| 3 | Analytic Geometry | 17 min | Equations become shapes |
| 4 | Vectors and Vector Analysis | 22 min | Direction as arithmetic; grad/div/curl |
| 5 | Linear Algebra | 22 min | Many vectors at once; det and eigenvalues |
| 6 | Calculus | 32 min | Rates and accumulation over those shapes |
| 7 | Differential Equations | 24 min | Calculus + complex roots = system behavior |
| 8 | Discrete Mathematics | 17 min | Counting, logic, graphs — the CS half |
| 9 | Synthesis and mixed bench | 12 min | Exam-condition mixed set |

## 5. Beyond a static guide

1. **Generated problems, not a fixed bank.** Each problem type is a
   seeded generator producing fresh numbers with a fully computed
   worked solution. Distractors come from real error modes (dropped
   sign, degrees for radians, forgetting the ½).
2. **Handbook Reflex drill.** Rapid-fire: given only a stem, name the
   tool in 15 seconds. Trains classification, the real bottleneck.
3. **Live figures.** One knob each, one lesson each, ten seconds to get it.
4. **Pace timer** on every problem set, calibrated to 2:50.
5. **Progress and review** in `localStorage`; missed types resurface.

## 6. Architecture

```
index.html          app shell
serve.py            30-line local static server
build.py            bundles everything into one offline .html

styles/
  tokens.css        every colour and type token, light and dark
  base.css          frame, typography, navigation, responsive rules
  plate.css         THE SIGNATURE ELEMENT — the drawing plate
  math.css          formula renderer output
  bench.css         problem bench, timer, solution steps

src/
  app.js            router, part loading, figure mounting, progress
  outline.js        the arc as data
  state.js          localStorage
  lib/
    dom.js          element + SVG helpers, sliders, readouts
    fmt.js          number formatting — no floating-point tails, ever
    exact.js        Fraction, Complex, Matrix, polynomial roots
    tex.js          compact TeX subset -> themed HTML + speech text
    plot.js         axes, grids, curves, vectors, shading
    figure.js       plate scaffolding, rAF loop, reduced-motion
    rng.js          seeded RNG so a problem set is reproducible
    bench.js        problem engine, MCQ UI, stepped solutions
  figures/          one module per part
  problems/         one generator module per part

content/            one HTML fragment per part
```

Vanilla ES modules. No framework, no build step to run it, no external
JavaScript. One hosted font stylesheet with full system fallbacks.

## 7. Semantic colour — constant in every figure

| Token | Means, everywhere | Examples |
|---|---|---|
| `--q-x` | the input / horizontal / real part | x-axis, cos θ, Re(z), first basis vector |
| `--q-y` | the output / vertical / imaginary part | y-axis, sin θ, Im(z), second basis vector |
| `--q-r` | magnitude / result / accumulated area | hypotenuse, \|z\|, ∫, determinant |
| `--q-bad` | error, trap, discontinuity | asymptotes, wrong-answer traces |

## 8. Status

- [x] Part 0 Orientation
- [x] Part 1 Algebra and Trigonometry
- [x] Part 2 Complex Numbers
- [x] Part 3 Analytic Geometry
- [x] Part 4 Vectors and Vector Analysis
- [x] Part 5 Linear Algebra
- [x] Part 6 Calculus
- [x] Part 7 Differential Equations
- [x] Part 8 Discrete Mathematics
- [x] Part 9 Synthesis

Later turns take other NCEES knowledge areas (Circuit Analysis, Digital
Systems, …) on their own branches, reusing `styles/` and `src/lib/`
unchanged so the compilation reads as one work.
