# The Bench — plan of record

An interactive educator for the **FE Electrical and Computer** exam, built one
NCEES knowledge area at a time on a single branch, as one compilation.

This file is the durable memory across turns. Read it first.

| Module | NCEES area | Questions | Parts | Plates | Status |
|---|---|---|---|---|---|
| **Mathematics** | 1 | 11–17 | 9 | 1–25 | complete |
| **Circuit Analysis (DC and AC Steady State)** | 6 | 11–17 | 7 | 26–36 | complete |
| **Power Systems** | 10 | 8–12 | 6 | 37–48 | complete |
| **Electronics** | 9 | 7–11 | 7 | 49–62 | complete |
| **Digital Systems** | 15 | 8–12 | 7 | 63–75 | complete |
| **Linear Systems** | 7 | 5–8 | 7 | 76–88 | complete |
| **Control Systems** | 12 | 6–9 | 7 | 89–101 | complete |

Seven of seventeen areas; 56–86 of the 110 questions. A shared orientation part
sits ahead of all of them. Plate numbers run in the order the modules were
built, not in module order — Electronics was written after Power Systems,
Digital Systems after Electronics, and Control Systems after Linear Systems.

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
| 10.A | Power theory (power factor, single and three phase, voltage regulation) | Power 1, Power 2 |
| 10.B | Transmission and distribution (losses, efficiency, voltage drop, delta and wye) | Power 2, Power 3 |
| 10.C | Transformers (single- and three-phase connections, reflected impedance) | Power 4 |
| 10.D | Motors and generators (synchronous, induction, dc) | Power 5 |
| 9.A | Models, biasing and performance of discrete devices | Electronics 1, 3 |
| 9.B | Amplifiers (single-stage/common emitter, differential, biasing) | Electronics 3, 4 |
| 9.C | Operational amplifiers (ideal, nonideal) | Electronics 5 |
| 9.D | Instrumentation (measurements, data acquisition, transducers) | Electronics 6 |
| 9.E | Power electronics (rectifiers, inverters, converters) | Electronics 2 |
| 15.A | Number systems | Digital 1 |
| 15.B | Boolean logic | Digital 2 |
| 15.C | Logic gates and circuits | Digital 2 |
| 15.D | Logic minimization (SOP, POS, Karnaugh maps) | Digital 3 |
| 15.E | Flip-flops and counters | Digital 4 |
| 15.F | Programmable logic devices and gate arrays | Digital 3 |
| 15.G | State machine design | Digital 5 |
| 15.H | Timing (diagrams, asynchronous inputs, race conditions, hazards) | Digital 6 |
| 7.A | Frequency/transient response | Linear 1, 2, 5 |
| 7.B | Resonance | Linear 6 |
| 7.C | Laplace transforms | Linear 3 |
| 7.D | Transfer functions | Linear 4 |
| 12.A | Block diagrams (feedforward, feedback) | Control 1 |
| 12.B | Bode plots | Control 4 |
| 12.C | Closed-loop response, open-loop response, and stability | Control 2, 3 |
| 12.D | Controller performance (steady-state errors, settling time, overshoot) | Control 5, 6 |

**Checked against the PDF, not from memory:** area 10 has no per-unit and no
symmetrical components. Those are PE topics. An earlier draft of this file
listed them as planned work, and they would have been a wasted part. Area 15
is **8–12 questions with eight subtopics**, not the 7–11 an earlier turn of
this file claimed — it is the third-largest area covered here, not the
smallest.

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
| Power 1 | One 120 V branch of a plant: **1728 W, 2304 VAR, 2880 VA** = 576 × (3,4,5) |
| Power 2–5 | The whole plant on **208Y/120**: 24 A, **5184 W, 6912 VAR, 8640 VA** = 1728 × (3,4,5) |
| Power 4 | The **4160 : 208** transformer, a = 20, so a² = 400 and 5 Ω reflects as 2000 Ω |
| Power 5 | The plant is a **4-pole induction motor** at 1764 rpm, 2% slip, 91.3% efficient |
| Electronics 1 | 5 V and 1 kΩ: **5.00 mA** ideal, **4.30 mA** constant-drop, 4.31 mA exact |
| Electronics 5 | Ri 1 kΩ, Rf 4 kΩ: **−4** inverting and **+5** non-inverting, from one pair |

**Electronics is where the numeric cast honestly runs out, and the module says
so rather than forcing a triangle into a transistor.** What carries continuity
there instead is structural, and it is stronger than the numbers would have
been: Circuits 5's RMS integral *is* the rectifier factors, Circuits 4's
Thévenin is the bias divider and the meter load, Power 4's a²Z is impedance
matching, and Maths 6's exponential is the diode equation and r_e. Four debts,
all collected explicitly in the prose.

Every DC cast quantity is an integer, deliberately: a student checking their
arithmetic should never be unsure whether the mismatch is theirs or rounding's.

The payoff arrives three times. In Maths 7 the triangle becomes the
characteristic root that decides whether a circuit rings. In Circuits 6 it
becomes the power triangle — 1200, 1600 and 2000 are 3, 4 and 5 multiplied by
400, and the angle whose cosine is 0.6 is the power factor. In Power it becomes
a real plant, and the final plate draws it end to end. None of it is analogy: a
0.6 power factor simply **is** a 53.13° right triangle.

Power Systems also earns its 208 V: it is 120√3, and the 120 is Circuits Part
5's wall outlet. Students are rarely told where that number comes from.

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

### Module 10 — Power Systems (area 10)

| # | Part | Read | Why it comes here |
|---|---|---|---|
| 1 | Power Factor and What It Costs | 24 min | Picks up Circuits 6's power triangle and attaches money to it |
| 2 | Three-Phase | 28 min | The √3 derived from a phasor subtraction, not asserted |
| 3 | Transmission and Distribution | 22 min | Loss ∝ 1/V² — creates the *need* for the transformer |
| 4 | Transformers | 24 min | The answer to the question Part 3 just raised |
| 5 | Motors and Generators | 26 min | Where the power goes, and why the pf was 0.6 to begin with |
| 6 | Synthesis and mixed bench | 12 min | One plant, drawn end to end across all four subtopics |

**Part 1 is deliberately single-phase.** Three-phase is named in 10.A but is
not taught until Part 2, and using it in Part 1 would break the build-up. The
key result — correcting 0.6 → 0.9 drops the current from 24 A to exactly 16 A
and copper loss to 4/9 — is a ratio, so it survives the rescaling intact.

Part 3 before Part 4 is the module's other ordering decision: T&D ends with
"you cannot transmit at 208 V", and the transformer walks in as the answer.
Part 5 then closes the loop by explaining that the plant's 0.6 power factor was
its own motor's magnetising current all along.

### Module 9 — Electronics (area 9)

| # | Part | Read | Why it comes here |
|---|---|---|---|
| 1 | The Diode | 22 min | The cheapest device with *states*; teaches assume–solve–check |
| 2 | Rectifiers and Power Conversion | 24 min | The diode's real job, and it collects Circuits 5's RMS factors |
| 3 | Transistors | 28 min | The same method on three states instead of two |
| 4 | Amplifiers | 26 min | Making the state you chose *stay* chosen, against a β nobody controls |
| 5 | Operational Amplifiers | 26 min | Enough surplus gain that the state becomes irrelevant |
| 6 | Instrumentation | 22 min | Thévenin's third job in this module |
| 7 | Synthesis and mixed bench | 12 min | One method, six devices |

**The whole module is one method with rising device complexity.** Part 1 exists
mainly so Part 3 is free. Part 4 exists so Part 5's punchline lands — an op-amp
is what happens when feedback can pin the operating point for nothing.

FETs get equal billing with BJTs deliberately. The PPI benchmark asks more
JFET/MOSFET questions than BJT ones and most FE resources under-weight them.

### Module 7 — Linear Systems (area 7)

| # | Part | Read | Why it comes here |
|---|---|---|---|
| 1 | Transient Response | 22 min | The debt Circuit Analysis Part 6 named and deferred |
| 2 | Second-Order Response | 24 min | Two energy stores argue; Maths 7's roots arrive as components |
| 3 | The Laplace Transform | 22 min | The detour that turns out to be shorter |
| 4 | Transfer Functions and the s-Plane | 24 min | The centrepiece — behaviour becomes a position |
| 5 | Frequency Response | 22 min | The same plane restricted to one line |
| 6 | Resonance | 22 min | The one subtopic with its own vocabulary, and Q = 1/2ζ closes the loop |
| 7 | Synthesis and mixed bench | 12 min | One object, four views |

**The cast lands here harder than anywhere since Circuit Analysis.** Mathematics
Part 7 solved y'' + 6y' + 25y = 0 for roots −3 ± 4j — ωn = 5, ζ = cos 53.13° =
0.6. Multiply by 2000 and it is a 120 Ω / 10 mH / 1 µF series RLC with poles at
−6000 ± j8000. Plates 78, 82 and 88 all default to it, so the reader meets the
same triangle as a step response, as a point on the s-plane, and as a resonance
curve.

Seven parts is generous for a 5–8 question area, and it is deliberate: Control
Systems (12, 6–9 q) reuses nearly all of it, so this is load-bearing
infrastructure rather than padding. Read times are held to 22–24 minutes rather
than the 26–32 the larger modules use.

### Module 12 — Control Systems (area 12)

| # | Part | Read | Why it comes here |
|---|---|---|---|
| 1 | Feedback and Block Diagrams | 24 min | The loop, its algebra, and the trade that justifies the subject |
| 2 | The Closed Loop | 24 min | Gain drags the poles along a fixed path; the path is the design space |
| 3 | Stability and Routh–Hurwitz | 22 min | Counting bad roots without finding any |
| 4 | Bode Plots and Margins | 24 min | Part 3 gave a yes; this measures how far from no |
| 5 | Steady-State Error and System Type | 22 min | Stable is not the same as correct |
| 6 | Controller Performance and PID | 22 min | The first part that *changes* a loop rather than describing one |
| 7 | Synthesis and mixed bench | 13 min | One loop, four views, and they must agree |

**Built directly on Linear Systems, which is why that module was written
first.** Part 2 needs the s-plane and the pole-position readings of Linear 4;
Part 4 needs the Bode sketching of Linear 5 and does not re-teach it; Part 5
needs the final value theorem of Linear 3.

**One plant runs through Parts 2–4 and 7**: K/[s(s+2)(s+8)]. Its locus crosses
the imaginary axis at ω = 4 rad/s, its Routh array gives K = 160 from the
coefficients, and its Bode plot gives the same two numbers as measurements.
Plate 101 drives all four views from one knob so the agreement is watchable
rather than asserted. **Parts 5 and 6 use a second plant**, 1/[(s+1)(s+2)(s+4)],
chosen because a 5% error specification demands K = 152 on a loop that goes
unstable at K = 90 — so the case for PID is made by a contradiction the earlier
parts produce, not by assertion.

The cast arrives twice more: unity feedback around K/[s(s+6)] at **K = 25**
gives s² + 6s + 25 and the roots −3 ± 4j *chosen* rather than found, and a
phase margin of 59° is ζ = 0.6 wearing frequency-domain clothes.

Root locus *construction* is deliberately underweighted — it is a drawing skill
the exam has no time for. The five counting rules and the reading of a locus
get the space instead.

### Module 15 — Digital Systems (area 15)

| # | Part | Read | Why it comes here |
|---|---|---|---|
| 1 | Number Systems | 22 min | A bit pattern has no meaning until an interpretation is chosen |
| 2 | Boolean Logic and Gates | 24 min | Maths 8's algebra given hardware — and Electronics 3's MOSFETs opened up |
| 3 | Minimisation | 26 min | Computation acquires a price, and geometry pays as little of it as possible |
| 4 | Flip-Flops and Counters | 26 min | The only genuinely new physical idea in the module: a circuit with a past |
| 5 | State Machines | 24 min | Parts 3 and 4 in a loop, which is the general form of every digital system |
| 6 | Timing and Hazards | 22 min | Where the abstraction the first five rest on stops being true |
| 7 | Synthesis and mixed bench | 12 min | Two symbols, six steps |

**Each part adds exactly one capability the part before it lacked** — meaning,
computation, cost, memory, purpose — and Part 6 is different in kind, being the
bill for the abstraction rather than another layer on it. That structure is the
Part 7 plate.

Two of this module's plates compute results the prose then had to be rewritten
around, which is the rule about figures computing their own numbers earning its
keep: the state-assignment search found Gray coding to be the *worst* of the
three two-bit encodings for a sequence detector, and found a hand-picked
"deliberately awkward" assignment beating binary.

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
    tex.js          compact TeX subset -> themed HTML + speech text
    plot.js         axes, grids, curves, vectors, shading
    circuit.js      schematics on a grid lattice, plus solve()/series/parallel
    boolean.js      exact minimal-SOP solver over n variables
    poly.js         polynomial arithmetic, root finder, Routh array, RK4 response
    figure.js       plate scaffolding, rAF loop, reduced-motion
    rng.js          seeded RNG so a problem set is reproducible
    bench.js        problem engine, MCQ UI, stepped solutions
  figures/          one module per part, 101 plates
  problems/         one module per part, 167 generators

content/
  start/            orientation
  math/             Mathematics, 9 parts
  circuits/         Circuit Analysis, 7 parts
  electronics/      Electronics, 7 parts
  power/            Power Systems, 6 parts
  digital/          Digital Systems, 7 parts
  linear/           Linear Systems, 7 parts
  control/          Control Systems, 7 parts
```

Vanilla ES modules. No framework, no build step to run it, no external
JavaScript. One hosted font stylesheet with full system fallbacks.

**Adding a module** means: a new entry in `MODULES` in `outline.js`, a new
`content/<dir>/` of HTML fragments, one `figures/` module and one `problems/`
module registered in their `index.js`. Nothing in `styles/` or `src/lib/`
should need to change; if it does, that is a signal the new module is breaking
the design rules rather than extending them.

**Schematic conventions** (`circuit.js`, for whoever adds Electronics):
everything is in grid units, component bodies are 2 units long so wires meet
leads exactly, and centres must therefore be ≥ 2 units apart. `#body` returns
`{ node, label }` so a figure can relabel a component's value live.
`current()` chooses its label side from the *sign* of the offset.

**Two drawing rules learned the hard way in Power Systems**, both worth
keeping:

- For a one-line diagram, set `xr`/`yr` so **one data unit is one pixel** and
  remember **+y is up**. Plate 42 was first written with the offsets inverted
  and came out upside-down. A schematic is drawn, not plotted.
- For any plate that makes a *geometric* claim — a power triangle, a phasor
  subtraction — the two axis scales must be **equal**, or the angle the reader
  measures will not be the angle in the readout. Plates 37, 38 and 40 are
  scaled that way deliberately.
- `Plot.text(..., { bg: true })` returns a **group** of two `<text>` nodes, not
  a `<text>`. Updating it needs both; see `haloText()` in `three-phase.js`.
  Silently doing nothing is the failure mode.

**Interactive defaults must land on the cast.** Plate 39's knob is the power
factor rather than the load angle purely because 53.13° is unreachable on a
whole-degree step, and a plate reading 5200 W beside prose reading 5184 W is a
defect the reader will notice and not be able to explain.

## 7. Semantic colour — constant in every figure

| Token | Means, everywhere | Maths | Circuits |
|---|---|---|---|
| `--q-x` | input / horizontal / real part | x-axis, cos θ, Re(z) | voltage, real power |
| `--q-y` | output / vertical / imaginary part | y-axis, sin θ, Im(z) | current, reactive power |
| `--q-r` | magnitude / result / accumulated area | hypotenuse, \|z\|, ∫ | the computed answer |
| `--q-bad` | error, trap, discontinuity | asymptotes, wrong traces | the trap reading |

Both the light and dark sets clear all six checks of the palette validator —
lightness band, chroma floor, adjacent CVD separation, normal-vision
separation, contrast — at the *lowest* chroma that passes, which is what keeps
them reading as drafting ink rather than highlighter. Do not nudge them by eye.

## 8. Status

Forty-four parts, 88 plates, 146 generators, 157 reflex items.

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
| Power | 1 Power Factor and What It Costs | 37–38 | 4 |
| Power | 2 Three-Phase | 39–41 | 4 |
| Power | 3 Transmission and Distribution | 42–43 | 4 |
| Power | 4 Transformers | 44–45 | 4 |
| Power | 5 Motors and Generators | 46–47 | 4 |
| Power | 6 Synthesis and mixed bench | 48 | (reuses 12) |
| Electronics | 1 The Diode | 49–50 | 4 |
| Electronics | 2 Rectifiers and Power Conversion | 51–52 | 4 |
| Electronics | 3 Transistors | 53–55 | 4 |
| Electronics | 4 Amplifiers | 56–57 | 4 |
| Electronics | 5 Operational Amplifiers | 58–59 | 4 |
| Electronics | 6 Instrumentation | 60–61 | 4 |
| Electronics | 7 Synthesis and mixed bench | 62 | (reuses 14) |
| Digital | 1 Number Systems | 63–64 | 4 |
| Digital | 2 Boolean Logic and Gates | 65–66 | 4 |
| Digital | 3 Minimisation | 67–68 | 4 |
| Digital | 4 Flip-Flops and Counters | 69–70 | 4 |
| Digital | 5 State Machines | 71–72 | 4 |
| Digital | 6 Timing and Hazards | 73–74 | 3 |
| Digital | 7 Synthesis and mixed bench | 75 | (reuses 12) |
| Linear | 1 Transient Response | 76–77 | 4 |
| Linear | 2 Second-Order Response | 78–79 | 3 |
| Linear | 3 The Laplace Transform | 80–81 | 3 |
| Linear | 4 Transfer Functions and the s-Plane | 82–83 | 2 |
| Linear | 5 Frequency Response | 84–85 | 2 |
| Linear | 6 Resonance | 86–87 | 2 |
| Linear | 7 Synthesis and mixed bench | 88 | (reuses 14) |
| Control | 1 Feedback and Block Diagrams | 89–90 | 4 |
| Control | 2 The Closed Loop | 91–92 | 4 |
| Control | 3 Stability and Routh–Hurwitz | 93–94 | 4 |
| Control | 4 Bode Plots and Margins | 95–96 | 3 |
| Control | 5 Steady-State Error and System Type | 97–98 | 3 |
| Control | 6 Controller Performance and PID | 99–100 | 3 |
| Control | 7 Synthesis and mixed bench | 101 | (reuses 21) |

### Verified

Run from `scratchpad/` against `python3 serve.py -p 8123`. All of them now
read the part list from `outline.js`, so they cannot drift as modules are added:

- `check.mjs` — all 44 parts load, every figure and formula plate mounts, no
  unrendered `data-tex` survives, no console errors.
- `interact.mjs` — every slider driven to min/mid/max, every scenario button
  clicked, a full bench answered and a reflex drill run, on every part.
- `xref.mjs` — every "Plate N" named in prose resolves, all 88 plate numbers
  are used exactly once with no gaps, every bench topic has a generator.
- `genall.mjs` — every one of the 146 generators run over 100 seeds, checking
  that no question offers a duplicate option, fewer than three options, a bad
  answer index, an unexpanded template literal or a NaN. **This one earned its
  place immediately**: it found 58 faulty generators on its first run, and the
  three root causes are written up under *Known limits* below.
- `mathfit.mjs` — no display equation overflows its column, and no overbar is
  clipped by the overflow box.
- `texscan.mjs` — every TeX command used anywhere is one the renderer knows.
  An unrecognised command renders as *nothing*, silently, so this is the only
  defence against `\lceil` quietly turning a ceiling into a logarithm.
- `bundle.mjs` — `dist/the-bench.html` runs from `file://` with no server and
  no network.
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
- Plate 46's torque–speed curve is Kloss's approximation, which understates
  starting torque against a real NEMA Design B machine. The plate says so.
- Plate 47's flow band barely narrows at a healthy motor's 2% slip, because
  the losses genuinely are small. The loss *arrows* are scaled instead;
  exaggerating the band would have been a lie about the machine.
- Plate 53's BJT output family uses a smoothed knee so the curve is drawable;
  it is a teaching curve, not a device model.
- Electronics stops where area 9 stops. Semiconductor physics — doping,
  carrier concentrations — appears in the PPI benchmark but belongs to area 5
  (Properties of Electrical Materials) and is deliberately left there.
- Plate 73's metastability MTBF uses the standard exponential model at stated
  rates. τ and t₀ are representative datasheet figures, not measurements of a
  particular part; the plate says which numbers it is using and why.
- Plate 74 models a gate as a fixed delay. Real gates have different rise and
  fall delays and a load-dependent one, which changes the glitch *width* but
  not its existence — the consensus term removes it either way.
- The state-assignment search on plate 72 is exhaustive over 24 assignments
  because four states is small. It says so, and says that a real tool
  heuristically searches a space that is not enumerable.

### Three bugs worth remembering, from `genall.mjs`

Each was invisible on the page and wrong in a way a reader would have paid for.

1. **A duplicated option.** Distractors are computed from the same numbers as
   the answer, so they coincide far more often than they look like they will.
   A reader picking the second copy of the right answer was told they were
   wrong. Fixed centrally in `generate()`, not in ninety generators.
2. **`fixed()` writes U+2212, not a hyphen** — because a minus sign is not a
   hyphen. So `parseFloat` returned NaN on every negative value, and fifteen
   distractor filters of the shape `Math.abs(parseFloat(a) - parseFloat(b)) >
   tol` silently deleted every option they examined. Every inverting op-amp
   gain question was being served with a single choice. `fmt.unfmt()` now
   exists so nothing parses a formatted number by hand again.
3. **Degenerate parameter draws.** Two equal resistors, a singular matrix, a
   square wave whose RMS is its peak — cases where the distractors collapse
   because the physics collapses. `generate()` re-draws on a stepped seed
   rather than inventing filler options with nothing to say.

### Two more, from building Control Systems

4. **`plot.js` leaked a plate's worth of SVG on every slider move.** `grid()`
   and `axes()` are called from inside a figure's draw function, but neither
   cleared its own layer and `arrowhead()` minted a fresh `<marker>` into
   `defs` on each call — and `clear()` never touches `defs`. Sixty moves on one
   plate added 1,700 dead nodes; a real drag added tens of thousands. Both now
   clear or memoise. **This affected every interactive figure in the
   compilation**, and it was invisible until something counted the nodes.
5. **A readout contradicting the plate above it.** At the critical gain the
   Routh array's s¹ row is all zeros, so `routh()` substitutes the auxiliary
   polynomial's derivative — and plate 101's readout, labelled `(160−K)/10`,
   printed the *substituted* 20 while the note beside it said the entry had
   reached zero. `routh()` now also returns `rawFirst`. The lesson is the
   general one: **a computed readout and hand-written prose about it are two
   sources of truth**, and screenshotting the boundary case is what caught it.

## 9. Next turns

The remaining NCEES areas, in the order that reuses the most:

- **Signal Processing** — NCEES **area 8**, 5–8 q. Its three subtopics are
  sampling, analog filters and digital filters. Reuses Linear 5's Bode
  machinery and `poly.js`; a z-polynomial is a polynomial, so `roots()` and
  `evalComplex()` carry over unchanged. *(An earlier draft of this list called
  it area 5. Area 5 is Properties of Electrical Materials — caught by
  re-reading the PDF, which is the third time that habit has paid.)*
- Then: Electromagnetics, Communications, Computer Networks, Computer Systems,
  Software Development, Engineering Economics, Ethics, Probability and
  Statistics, Properties of Electrical Materials.

Counts above are from the specification PDF. **Read it again before starting a
module** rather than trusting this list — the area 10 per-unit mistake was
caught exactly that way.

### The Signal Processing arc, as planned

Seven parts, plates 102–114. Sampling is the spine: Part 1 exists to make the
frequency axis real before Part 2 folds it, and Parts 3–4 are the filter that
Part 2 proves you cannot do without.

| Part | Spec | Title |
|---|---|---|
| 1 | 8.A · 8.B | Signals and Spectra |
| 2 | 8.A | Sampling and Aliasing |
| 3 | 8.B | Analog Filters |
| 4 | 8.B | Order, Roll-Off and Butterworth |
| 5 | 8.C | Digital Filters and Difference Equations |
| 6 | 8.C | The Z-Transform and the Unit Circle |
| 7 | 8.A–8.C | Synthesis and the Mixed Bench |

**Not this module's job.** Electronics 6 (9.D) already owns LSB, quantisation
error and SNR = 6.02n + 1.76, and states f_s > 2f_max as a rule. This module
owes the *mechanism* behind that rule — where the factor of two comes from,
what the alias frequency actually is, and why no later processing undoes it —
and cross-links rather than restates. Fourier *series* proper belongs to area
13.B (Communications); Part 1 takes only the spectrum idea it needs.

**The cast's three appearances here**, all exact rather than decorative:

- A 5 kHz tone at f_s = 8 kHz folds to **3 kHz**. Nyquist 4, tone 5, alias 3.
- ζ = 0.6 gives √(1−ζ²) = **0.8**, so peak = 1/(2ζ√(1−ζ²)) = 1/0.96 =
  0.355 dB — just on the peaking side of Butterworth's ζ = 0.707. The cast is
  the near-miss that motivates the flat filter.
- **z = 0.6 + 0.8j** has |z| = 1 exactly and ∠z = 53.13° exactly: the triangle,
  normalised, sits precisely on the unit circle, which is precisely the
  marginal case. Pulled to r = 0.9 it gives 1 − 1.08z⁻¹ + 0.81z⁻².

Each slots into `outline.js` as another module and continues the plate
numbering, so the compilation keeps reading as one work.

Anything added should keep: the HANDBOOK / KNOW COLD stamp, the four quantity
colours, one knob and one lesson per plate, generated problems with distractors
built from real error modes, the cast carried forward, and prose that stands
alone if no figure renders.
