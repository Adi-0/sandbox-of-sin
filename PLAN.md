# The Bench — plan of record

An interactive educator for the **FE Electrical and Computer** exam, built one
NCEES knowledge area at a time on a single branch, as one compilation.

This file is the durable memory across turns. Read it first.

| Module | NCEES area | Questions | Parts | Plates | Status |
|---|---|---|---|---|---|
| **Mathematics** | 1 | 11–17 | 9 | 1–25 | complete |
| **Circuit Analysis (DC and AC Steady State)** | 6 | 11–17 | 7 | 26–36 | complete |

Two of seventeen areas; 22–34 of the 110 questions. A shared orientation part
sits ahead of both.

---

## 1. What the exam actually asks

Exam conditions, which shape every design decision in this repository:

- **110 questions, 6 hours** → ~2 min 50 s per question, including reading.
- **Closed book with an electronic reference** (the NCEES FE Reference
  Handbook). Formulas are *given*. Recognition and execution are not.
- Answers are multiple choice, usually phrased "most nearly."

So the bottleneck is **not** derivation. It is: read stem → classify problem
type → recall which handbook plate holds the tool → execute arithmetic
without a sign error. Everything here is built to train that loop.

### Subtopic coverage

From the NCEES *FE Electrical and Computer CBT Exam Specifications*
(effective July 2020):

| Code | Subtopic | Where it lives |
|---|---|---|
| 1.A | Algebra and trigonometry | Maths 1 |
| 1.B | Complex numbers | Maths 2 |
| 1.C | Discrete mathematics | Maths 8 |
| 1.D | Analytic geometry | Maths 3 |
| 1.E | Calculus (differential, integral, single- and multivariable) | Maths 6 |
| 1.F | Ordinary differential equations | Maths 7 |
| 1.G | Linear algebra | Maths 5 |
| 1.H | Vector analysis | Maths 4 |
| 6.A | KCL, KVL | Circuits 1 |
| 6.B | Series/parallel equivalent circuits | Circuits 2 |
| 6.C | Thévenin and Norton theorems | Circuits 4 |
| 6.D | Node and loop analysis | Circuits 3 |
| 6.E | Waveform analysis (RMS, average, frequency, period) | Circuits 5 |
| 6.F | Phasors | Circuits 6 |
| 6.G | Impedance | Circuits 6 |

The order within each module is pedagogical, not the alphabetical order NCEES
prints. Circuits 4 follows Circuits 3 because Thévenin is easiest to *prove*
once node analysis is available, and Circuits 5 precedes Circuits 6 because a
phasor is meaningless until RMS is.

## 2. The one design decision everything follows from

Every formula is stamped **HANDBOOK** or **KNOW COLD**.

- `HANDBOOK` — it is in the reference handbook on exam day. Do not burn
  memory on it. Burn memory on *knowing it exists* and what it is called.
- `KNOW COLD` — it is not in the handbook, or looking it up costs more time
  than the question is worth. This is the actual memorization list, and it
  is much shorter than students fear.

No other FE resource makes that distinction visible. It is the single
highest-leverage thing a student can be told, so it gets to be the
signature element of the design: every plate is a numbered drawing sheet with
a title block, and the stamp sits in it. The stamps are deliberately
monochrome so they stay out of the colour vocabulary (§7).

## 3. The recurring cast

One object, followed through every part of every module. Recognition is
retention, and the numbers are chosen rather than contrived — the FE
literature uses them for the same reason.

| Part | The cast appears as |
|---|---|
| Maths 1 | The **3-4-5 right triangle**. θ = 53.13°, sin θ = 0.8, cos θ = 0.6 |
| Maths 2 | **z₀ = 3 + 4j** = 5∠53.13°. z₀² = −7 + 24j = 25∠106.26° |
| Maths 3 | The circle **x² + y² = 25** through (3, 4); tangent slope −3/4 |
| Maths 4 | **w = 3i + 4j + 12k**, \|w\| = 13 — the triple nests |
| Maths 5 | **A = [[3, 4], [4, −3]]**, det = −25, eigenvalues **±5** |
| Maths 6 | Implicit d/dx on x² + y² = 25 → dy/dx = −x/y = −3/4 (same tangent) |
| Maths 7 | **y″ + 6y′ + 25y = 0** → roots **−3 ± 4j**, ωₙ = 5, ζ = cos 53.13° = 0.6 |
| Maths 8 | A 5-node graph; its adjacency matrix returns to Part 5 |
| Circuits 1–3 | **100 V, 2 Ω, then 12 Ω ∥ 4 Ω** → R = 5 Ω, I = 20 A, node at 60 V, splitting 5 A / 15 A |
| Circuits 4 | **100 V behind 20 Ω, 5 Ω to ground** → V_th = 20 V, R_th = 4 Ω, P_max = 25 W |
| Circuits 5 | The wall outlet: **120 V RMS = 170 V peak = 340 V peak-to-peak** |
| Circuits 6 | **Z = 3 + j4 = 5∠53.13° Ω** at 100 V → **20 A lagging 53.13°** |
| Circuits 6 | The **power triangle**: P = 1200 W, Q = 1600 VAR, S = 2000 VA, pf 0.6 lagging |

Every DC cast quantity is an integer, deliberately: a student checking their
arithmetic should never be unsure whether the mismatch is theirs or rounding's.

The payoff arrives twice. In Maths 7 the triangle becomes the characteristic
root that decides whether a circuit rings. In Circuits 6 it becomes the power
triangle — 1200, 1600 and 2000 are 3, 4 and 5 multiplied by 400, and the angle
whose cosine is 0.6 is the power factor. Neither is an analogy; they are the
same three numbers doing the work.

## 4. The arc

### Module 1 — Mathematics (area 1)

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

### Module 6 — Circuit Analysis, DC and AC steady state (area 6)

| # | Part | Read | Why it comes here |
|---|---|---|---|
| 1 | The Two Laws | 22 min | KCL and KVL are conservation; everything after is bookkeeping |
| 2 | Series, Parallel, and Dividers | 22 min | Collapse the network before solving it |
| 3 | Node and Loop Analysis | 24 min | When it will not collapse — Maths 5's matrices doing real work |
| 4 | Thévenin and Norton | 22 min | Any two-terminal box is a source and a resistor |
| 5 | Waveforms — peak, average, RMS | 22 min | Maths 6's integral deciding what a meter reads |
| 6 | Phasors and Impedance | 26 min | Maths 2 turning a differential equation into arithmetic |
| 7 | Synthesis and mixed bench | 12 min | Exam-condition mixed set across 6.A–6.G |

Circuits is the module where the Mathematics module pays. Parts 3, 5 and 6
each open by naming the maths part they are cashing in.

## 5. Beyond a static guide

1. **Generated problems, not a fixed bank.** Each problem type is a
   seeded generator producing fresh numbers with a fully computed
   worked solution. Distractors come from real error modes (dropped
   sign, degrees for radians, forgetting the ½, peak read as RMS), and each
   one says which error it is.
2. **Handbook Reflex drill.** Rapid-fire: given only a stem, name the
   tool in 15 seconds. Trains classification, the real bottleneck.
3. **Live figures.** One knob each, one lesson each, ten seconds to get it.
4. **Pace timer** on every problem set, calibrated to 2:50.
5. **Progress and review** in `localStorage`; missed types resurface.
6. **Figures compute their own numbers.** `circuit.js` ships a Gaussian
   elimination solver, and every schematic plate runs the same node analysis
   the prose teaches. No plate holds a hand-computed constant, so a caption
   cannot drift out of agreement with its drawing when a slider moves.

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
  outline.js        MODULES -> PARTS -> contentPath; the arc as data
  state.js          localStorage
  lib/
    dom.js          element + SVG helpers, sliders, readouts
    fmt.js          number formatting — no floating-point tails, ever
    exact.js        Fraction, Complex, Matrix, polynomial roots
    tex.js          compact TeX subset -> themed HTML + speech text
    plot.js         axes, grids, curves, vectors, shading
    circuit.js      schematics on a grid lattice, plus solve()/series/parallel
    figure.js       plate scaffolding, rAF loop, reduced-motion
    rng.js          seeded RNG so a problem set is reproducible
    bench.js        problem engine, MCQ UI, stepped solutions
  figures/          one module per part, 36 plates
  problems/         one module per part, 63 generators

content/
  start/            orientation
  math/             Mathematics, 9 parts
  circuits/         Circuit Analysis, 7 parts
```

Vanilla ES modules. No framework, no build step to run it, no external
JavaScript. One hosted font stylesheet with full system fallbacks.

**Adding a module** means: a new entry in `MODULES` in `outline.js`, a new
`content/<dir>/` of HTML fragments, one `figures/` module and one `problems/`
module registered in their `index.js`. Nothing in `styles/` or `src/lib/`
should need to change; if it does, that is a signal the new module is breaking
the design rules rather than extending them.

**Schematic conventions** (`circuit.js`, for whoever adds Power or
Electronics): everything is in grid units, component bodies are 2 units long
so wires meet leads exactly, and centres must therefore be ≥ 2 units apart.
`#body` returns `{ node, label }` so a figure can relabel a component's value
live. `current()` chooses its label side from the *sign* of the offset.

## 7. Semantic colour — constant in every figure

| Token | Means, everywhere | Maths | Circuits |
|---|---|---|---|
| `--q-x` | input / horizontal / real part | x-axis, cos θ, Re(z) | voltage |
| `--q-y` | output / vertical / imaginary part | y-axis, sin θ, Im(z) | current |
| `--q-r` | magnitude / result / accumulated area | hypotenuse, \|z\|, ∫ | the computed answer |
| `--q-bad` | error, trap, discontinuity | asymptotes, wrong traces | the trap reading |

Both the light and dark sets clear all six checks of the palette validator —
lightness band, chroma floor, adjacent CVD separation, normal-vision
separation, contrast — at the *lowest* chroma that passes, which is what keeps
them reading as drafting ink rather than highlighter. Do not nudge them by eye.

## 8. Status

Seventeen parts, 36 plates, 63 generators, 63 reflex items.

| Module | Part | Plates | Generators |
|---|---|---|---|
| — | 0 Orientation | 1 | — |
| Maths | 1 Algebra and Trigonometry | 2–5 | 6 |
| Maths | 2 Complex Numbers | 6–8 | 5 |
| Maths | 3 Analytic Geometry | 9–10 | 5 |
| Maths | 4 Vectors and Vector Analysis | 11–13 | 5 |
| Maths | 5 Linear Algebra | 14–16 | 5 |
| Maths | 6 Calculus | 17–20 | 6 |
| Maths | 7 Differential Equations | 21–22 | 5 |
| Maths | 8 Discrete Mathematics | 23–24 | 4 |
| Maths | 9 Synthesis and mixed bench | 25 | (reuses 10) |
| Circuits | 1 The Two Laws | 26 | 4 |
| Circuits | 2 Series, Parallel, and Dividers | 27–28 | 4 |
| Circuits | 3 Node and Loop Analysis | 29 | 3 |
| Circuits | 4 Thévenin and Norton | 30–31 | 4 |
| Circuits | 5 Waveforms | 32–33 | 3 |
| Circuits | 6 Phasors and Impedance | 34–35 | 4 |
| Circuits | 7 Synthesis and mixed bench | 36 | (reuses 10) |

### Verified

Run from `scratchpad/` against `python3 serve.py -p 8123`:

- `check.mjs` — all 17 parts load, every figure and formula plate mounts, no
  unrendered `data-tex` survives, no console errors.
- `interact.mjs` — every slider driven to min/mid/max, every scenario button
  clicked, a full bench answered and a reflex drill run, on every part.
- `xref.mjs` — every "Plate N" named in prose resolves, all 36 plate numbers
  are used exactly once with no gaps, every bench topic has a generator.
- `bundle.mjs` — `dist/the-bench.html` (725 KB, 35 modules, 17 chapters) runs
  from `file://` with no server and no network.
- No horizontal scroll at 360 px or 768 px; both themes checked.
- The four quantity colours pass all six checks of the palette validator in
  light *and* dark.

### Known limits, stated honestly

- The reflex drill's wrong options are drawn from the pool of other items'
  tools, so on a small `only:` filter the same distractors recur.
- `build.py` bundles by regex, which is safe only because every module here
  uses named imports and `export function|const|let|class`. It refuses to
  build rather than emit something broken if that stops being true.
- Circuits stops at steady state, as area 6 does. Transient RL/RC response
  belongs to Linear Systems and is deliberately not taught here — Circuits 6
  names the boundary rather than blurring it.

## 9. Next turns

The remaining NCEES areas, in the order that reuses the most:

- **Linear Systems** (5–8 q) + **Control Systems** (6–9 q) — Maths 7 and
  Circuits 6 as transfer functions; the transient half of the RL/RC story.
- **Power Systems** (8–12 q) — Circuits 6's power triangle at three phases.
- **Digital Systems** (7–11 q) — Maths 8's logic as gates and K-maps.
- **Electronics** (7–11 q) — Circuits 4's Thévenin as a small-signal model.
- Then: Signal Processing, Electromagnetics, Computer Systems, Software
  Development, Engineering Economics, Ethics, Probability and Statistics,
  Properties of Electrical Materials.

Each slots into `outline.js` as another module and continues the plate
numbering, so the compilation keeps reading as one work.

Anything added should keep: the HANDBOOK / KNOW COLD stamp, the four quantity
colours, one knob and one lesson per plate, generated problems with distractors
built from real error modes, the cast carried forward, and prose that stands
alone if no figure renders.
