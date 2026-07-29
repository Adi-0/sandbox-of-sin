# The Bench — FE Electrical and Computer

An interactive educator for the NCEES *Fundamentals of Engineering (Electrical
and Computer)* exam, built one knowledge area at a time.

**Covered so far — 45 to 69 of the 110 questions:**

| | Module | NCEES | Questions | Parts | Plates |
|---|---|---|---|---|---|
| 1 | **Mathematics** | area 1 | 11–17 | 9 | 1–25 |
| 6 | **Circuit Analysis (DC and AC Steady State)** | area 6 | 11–17 | 7 | 26–36 |
| 9 | **Electronics** | area 9 | 7–11 | 7 | 49–62 |
| 10 | **Power Systems** | area 10 | 8–12 | 6 | 37–48 |
| 15 | **Digital Systems** | area 15 | 8–12 | 7 | 63–75 |

Seventy-five live plates, one hundred and thirty problem generators, and one
right triangle followed from the first plate to the last.

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

One file, 1.5 MB, opens from disk with no server and no network. Put it on a
tablet and read it on a train.

## The idea it is built around

The FE exam is **closed book with an electronic reference** — the NCEES FE
Reference Handbook, searchable, open in a second window. Almost every formula
in these thirty-seven parts is in it.

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
| Power 1 | one 120 V branch of a plant | 1728 W, 2304 VAR, 2880 VA — 576 × (3,4,5) |
| Power 2–5 | the **whole plant** on 208Y/120 | 5184 W, 6912 VAR, 8640 VA — 1728 × (3,4,5) |
| Electronics 5 | 1 kΩ and 4 kΩ around an op-amp | −4 inverting and **+5** non-inverting |
| Digital 3 | **Σm(3, 4, 5)** on a Karnaugh map | an honest bad case — 3 has no neighbour |

Electronics is where the numeric cast honestly thins out, and the module says so
rather than forcing it. What carries the continuity there is **structural**:
Circuit Analysis Part 5's RMS integral becomes the rectifier factors, Part 4's
Thévenin becomes the bias divider and meter loading, Power Part 4's reflected
impedance becomes impedance matching, and Mathematics Part 6's exponential
becomes the diode equation.

The payoff arrives three times. In Mathematics Part 7 the triangle becomes the
characteristic root that decides whether a circuit rings. In Circuit Analysis
Part 6 it becomes the power triangle — 1200, 1600 and 2000 are 3, 4 and 5
multiplied by 400. In Power Systems it becomes an actual industrial plant, drawn
end to end on the final plate. None of it is analogy; they are the same three
numbers doing the work, and a 0.6 power factor simply *is* a 53.13° triangle.

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

### Module 10 — Power Systems (NCEES area 10)

| Part | | NCEES | Read | Plates |
|---|---|---|---|---|
| 1 | **Power Factor and What It Costs** — the angle from Circuits, with money on it | 10.A | 24 min | 37–38 |
| 2 | **Three-Phase** — where the √3 comes from, and why 208 V is really 120 V | 10.A · 10.B | 28 min | 39–41 |
| 3 | **Transmission and Distribution** | 10.B | 22 min | 42–43 |
| 4 | **Transformers** | 10.C | 24 min | 44–45 |
| 5 | **Motors and Generators** | 10.D | 26 min | 46–47 |
| 6 | **Synthesis and the Mixed Bench** | 10.A–10.D | 12 min | 48 |

### Module 15 — Digital Systems (NCEES area 15)

| Part | | NCEES | Read | Plates |
|---|---|---|---|---|
| 1 | **Number Systems** — one quantity, four notations, and the trick that makes subtraction free | 15.A | 22 min | 63–64 |
| 2 | **Boolean Logic and Gates** — the algebra, now made of transistors | 15.B · 15.C | 24 min | 65–66 |
| 3 | **Minimisation** — the map that turns algebra into geometry | 15.D · 15.F | 26 min | 67–68 |
| 4 | **Flip-Flops and Counters** — the moment a circuit acquires a memory | 15.E | 26 min | 69–70 |
| 5 | **State Machines** — memory plus logic is a machine that knows where it has been | 15.G | 24 min | 71–72 |
| 6 | **Timing and Hazards** — gates take time, and every digital failure starts there | 15.H | 22 min | 73–74 |
| 7 | **Synthesis and the Mixed Bench** | 15.A–15.H | 12 min | 75 |

### Module 9 — Electronics (NCEES area 9)

| Part | | NCEES | Read | Plates |
|---|---|---|---|---|
| 1 | **The Diode** — the first component Ohm's law cannot solve | 9.A | 22 min | 49–50 |
| 2 | **Rectifiers and Power Conversion** | 9.E | 24 min | 51–52 |
| 3 | **Transistors** — BJT and FET, and the region each is in | 9.A · 9.B | 28 min | 53–55 |
| 4 | **Amplifiers** — biasing, the load line, where gain comes from | 9.B | 26 min | 56–57 |
| 5 | **Operational Amplifiers** | 9.C | 26 min | 58–59 |
| 6 | **Instrumentation** — measuring without disturbing | 9.D | 22 min | 60–61 |
| 7 | **Synthesis and the Mixed Bench** | 9.A–9.E | 12 min | 62 |

Every subtopic of all five published specifications is covered; the order within
each module is pedagogical rather than the alphabetical order NCEES prints.

### Beyond a static guide

- **Problems are generated, not stored.** Each of the 130 types is a seeded
  generator producing fresh numbers with a fully worked solution. "New numbers"
  gives a genuinely new set at the same difficulty.
- **Distractors are the actual mistakes.** A wrong option is built by dropping
  the sign, working in degrees, forgetting the ½, or reading a nameplate ratio as a
  bank ratio — and each one explains which error it represents. A wrong answer is
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
    boolean.js      exact minimal-SOP solver, shared by the plates and the bench
  figures/          one file per part, 75 plates
  problems/         one file per part, 130 generators

content/
  start/            the orientation part
  math/             Mathematics, 9 parts
  circuits/         Circuit Analysis, 7 parts
  electronics/      Electronics, 7 parts
  power/            Power Systems, 6 parts
  digital/          Digital Systems, 7 parts
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
the colour vocabulary entirely. In Circuit Analysis, Power Systems and
Electronics the same three quantity tokens carry over as voltage, current and
result.

**Figures compute their own numbers.** `circuit.js` ships a Gaussian-elimination
solver and every schematic figure runs the same node analysis the prose teaches;
`boolean.js` ships an exact minimal-SOP solver, and the Karnaugh-map plate, the
minimisation bench and the state-assignment plate all call it. Nothing in a plate
is a hand-computed constant, so a caption cannot drift out of agreement with the
drawing when a slider moves — and twice now the solver has contradicted something
the prose asserted, which is the whole reason for the rule.

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

Four of the seventeen NCEES knowledge areas are done. The next ones — Digital
Systems, Linear Systems and Control Systems, Signal Processing — reuse `styles/`
and `src/lib/` unchanged and slot into `outline.js` as further modules, so the
compilation keeps reading as one work.
