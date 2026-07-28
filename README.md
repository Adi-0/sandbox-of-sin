# The Bench — FE Electrical and Computer

An interactive educator for the NCEES *Fundamentals of Engineering (Electrical
and Computer)* exam, built one knowledge area at a time.

**Covered so far — the two largest blocks on the exam, 22 to 34 of the 110
questions:**

| | Module | NCEES | Questions | Parts | Plates |
|---|---|---|---|---|---|
| 1 | **Mathematics** | area 1 | 11–17 | 9 | 1–25 |
| 6 | **Circuit Analysis (DC and AC Steady State)** | area 6 | 11–17 | 7 | 26–36 |

Thirty-six live plates, sixty-three problem generators, and one right triangle
followed from the first plate to the last.

## Run it

```
python3 serve.py            # then open http://localhost:8000
```

That is the whole setup. No build step, no dependencies, no package manager.
Any static server works (`npx serve`, `php -S localhost:8000`, whatever you
have).

Opening `index.html` straight off disk will *not* work — the guide loads its
chapters as separate files and browsers block that over `file://`. For that
case there is a bundle:

```
python3 build.py            # writes dist/the-bench.html
```

One file, 725 KB, opens from disk with no server and no network. Put it on a
tablet and read it on a train.

## The idea it is built around

The FE exam is **closed book with an electronic reference** — the NCEES FE
Reference Handbook, searchable, open in a second window. Almost every formula
in these ten parts is in it.

So the usual approach — flashcard the formulas until they stick — spends your
most expensive resource on the one thing the exam gives away. What the handbook
cannot give you is the knowledge that a particular formula is the one you need.

Every formula here therefore carries a stamp:

| Stamp | Means | What to do |
|---|---|---|
| **HANDBOOK** | It is in the reference on exam day | Know it exists and what it is called. Do not memorise the algebra. |
| **KNOW COLD** | Not in the handbook, or too slow to look up | Memorise it. The whole list is about 25 items. |

That distinction is also the design's signature element: every plate is a
numbered drawing sheet with a title block, and the stamp sits in it.

## The recurring cast

Engineering maths goes badly when every topic arrives as a stranger, so one
object runs through both modules. It is chosen, not contrived — the FE
literature uses these numbers for the same reason.

| Where | The cast appears as | Which gives you |
|---|---|---|
| Maths 1 | the **3-4-5 right triangle** | sin θ = 0.8, cos θ = 0.6, θ = 53.13° |
| Maths 2 | **3 + 4j = 5∠53.13°** | the complex plane |
| Maths 3 | **(3,4)** on x² + y² = 25 | tangent slope −3/4, from perpendicularity |
| Maths 4 | **3i + 4j + 12k**, ∇f = 6i + 8j | magnitude 13; the gradient ⟂ the circle |
| Maths 5 | **[[3, 4], [4, −3]]** | trace 0, det −25, eigenvalues **±5** |
| Maths 6 | d/dx √(25 − x²) at x = 3 | **−3/4 again**, this time from a limit |
| Maths 7 | roots **−3 ± 4j** | ωₙ = 5, ω_d = 4, ζ = 0.6 |
| Circuits 1–3 | 100 V, 2 Ω, then 12 Ω ∥ 4 Ω | 20 A splitting 5 A and 15 A |
| Circuits 4 | 100 V behind 20 Ω and 5 Ω | V_th = 20 V, R_th = 4 Ω, 25 W maximum |
| Circuits 6 | **Z = 3 + j4 = 5∠53.13° Ω** | 20 A lagging 53.13° |
| Circuits 6 | the **power triangle** | 1200 W, 1600 VAR, 2000 VA, pf 0.6 lagging |

The payoff arrives twice. In Mathematics Part 7 the triangle becomes the
characteristic root that decides whether a circuit rings. In Circuit Analysis
Part 6 it becomes the power triangle — 1200, 1600 and 2000 are 3, 4 and 5
multiplied by 400. Neither is an analogy; they are the same three numbers doing
the work.

## What is in it

### Module 1 — Mathematics (NCEES area 1)

| Part | | NCEES | Read | Plates |
|---|---|---|---|---|
| 0 | **What the Exam Actually Tests** — the blueprint, the pace, the handbook contract | — | 6 min | 1 |
| 1 | **Algebra and Trigonometry** | 1.A | 26 min | 2–5 |
| 2 | **Complex Numbers** | 1.B | 20 min | 6–8 |
| 3 | **Analytic Geometry** | 1.D | 17 min | 9–10 |
| 4 | **Vectors and Vector Analysis** | 1.H | 22 min | 11–13 |
| 5 | **Linear Algebra** | 1.G | 22 min | 14–16 |
| 6 | **Calculus** | 1.E | 32 min | 17–20 |
| 7 | **Differential Equations** | 1.F | 24 min | 21–22 |
| 8 | **Discrete Mathematics** | 1.C | 17 min | 23–24 |
| 9 | **Synthesis and the Mixed Bench** | 1.A–1.H | 12 min | 25 |

### Module 6 — Circuit Analysis, DC and AC Steady State (NCEES area 6)

| Part | | NCEES | Read | Plates |
|---|---|---|---|---|
| 1 | **The Two Laws** — charge and energy conservation, and why everything else is bookkeeping | 6.A | 22 min | 26 |
| 2 | **Series, Parallel, and Dividers** | 6.B | 22 min | 27–28 |
| 3 | **Node and Loop Analysis** | 6.D | 24 min | 29 |
| 4 | **Thévenin and Norton** | 6.C | 22 min | 30–31 |
| 5 | **Waveforms** — peak, average, RMS | 6.E | 22 min | 32–33 |
| 6 | **Phasors and Impedance** | 6.F · 6.G | 26 min | 34–35 |
| 7 | **Synthesis and the Mixed Bench** | 6.A–6.G | 12 min | 36 |

Every subtopic of both published specifications is covered; the order within
each module is pedagogical rather than the alphabetical order NCEES prints.

### Beyond a static guide

- **Problems are generated, not stored.** Each of the 63 types is a seeded
  generator producing fresh numbers with a fully worked solution. "New numbers"
  gives a genuinely new set at the same difficulty.
- **Distractors are the actual mistakes.** A wrong option is built by dropping
  the sign, working in degrees, forgetting the ½, or misreading "choose" as
  "arrange" — and each one explains which error it represents. A wrong answer is
  a diagnosis, not a dead end.
- **The Handbook Reflex drill.** A stem, fifteen seconds, name the tool. No
  arithmetic at all. It trains classification, which is the step almost nobody
  practises and the one that costs the most time on exam day.
- **An exam-pace clock** on every set, calibrated to the real 2 min 50 s.
- **Live plates.** One knob each, one lesson each, learnable in ten seconds.

Progress and scores live in `localStorage` and nowhere else. Arrow keys move
between parts; the theme button cycles system → light → dark.

## How it is built

```
index.html          app shell
serve.py            local static server
build.py            bundles everything into one offline .html
PLAN.md             the plan of record — read this first if you are extending it

styles/
  tokens.css        every colour and type token, light and dark
  base.css          frame, typography, navigation, responsive rules
  plate.css         THE SIGNATURE ELEMENT — the numbered drawing plate
  math.css          formula-renderer output
  bench.css         problem bench, timer, stepped solutions

src/
  app.js            router, chapter loading, mounting, progress
  outline.js        the arc as data
  state.js          localStorage
  lib/
    tex.js          a TeX subset compiled to themed HTML + speech labels
    plot.js         axes, grids, curves, vectors, fields, contours
    figure.js       plate scaffolding, rAF loop, reduced-motion
    bench.js        problem engine, MCQ UI, the reflex drill
    dom.js          element and SVG helpers, sliders, readouts
    fmt.js          number formatting — no floating-point tails, ever
    rng.js          seeded RNG, so any problem set is reproducible
    circuit.js      schematic drawing on a grid, plus a network solver
  figures/          one file per part, 36 plates
  problems/         one file per part, 63 generators

content/
  start/            the orientation part
  math/             Mathematics, 9 parts
  circuits/         Circuit Analysis, 7 parts
```

Vanilla ES modules. No framework, no external JavaScript, no maths library.

Three decisions worth knowing about if you extend this:

**`tex.js` instead of MathJax or KaTeX.** The document has to run offline from
one folder with no build step, and every glyph has to take its colour from the
design tokens so dark mode costs the figures nothing. A focused parser over the
~40 constructs this subject actually needs is smaller than the loader for any
library that would do it, and it emits an `aria-label` built from the same
parse — so a screen reader hears "the fraction 3 over 4", not "3 4".

**Colour means a quantity, never a category.** Four tokens hold the same meaning
in every figure of every part: `--q-x` is the input / horizontal / real part,
`--q-y` the output / vertical / imaginary part, `--q-r` the magnitude / result /
accumulated area, `--q-bad` an error or discontinuity. Both the light and dark
sets clear all six checks of a colour-vision validator — lightness band, chroma
floor, adjacent CVD separation, normal-vision separation and contrast — at the
*lowest* chroma that passes, which is what keeps them reading as drafting ink
rather than highlighter. Do not nudge them by eye.

The HANDBOOK / KNOW COLD stamps are deliberately monochrome, so they stay out of
the colour vocabulary entirely. In Circuit Analysis the same three quantity
tokens carry over as voltage, current and result.

**Figures compute their own numbers.** `circuit.js` ships a Gaussian-elimination
solver and every schematic figure runs the same node analysis the prose teaches.
Nothing in a plate is a hand-computed constant, so a caption cannot drift out of
agreement with the drawing when a slider moves.

## Accessibility

Every figure SVG carries an `aria-label` describing what it shows; every control
is labelled; focus is always visible; all controls are native `<input>` and
`<button>` elements, so they are keyboard-operable. Anything that animates has a
visible pause control and never auto-plays under `prefers-reduced-motion`.

The prose stands entirely on its own — no argument in this guide depends on a
figure rendering. That is a deliberate constraint, not a fallback.

Verified with no horizontal scroll down to a 360 px viewport, in both themes.

## Sources

- NCEES, *FE Electrical and Computer CBT Exam Specifications*, effective July
  2020. Question counts and subtopic codes are quoted from it directly.
- Problem difficulty is calibrated against Lindeburg, *FE Electrical and
  Computer Practice Problems* (PPI). No problem is reproduced from it — the
  generators are original, and the book was used only to fix the target level
  and the shape of a typical stem.

---

Two of the seventeen NCEES knowledge areas are done. The next ones — Linear
Systems, Power Systems, Digital Systems, Electronics — reuse `styles/` and
`src/lib/` unchanged and slot into `outline.js` as further modules, so the
compilation keeps reading as one work.
