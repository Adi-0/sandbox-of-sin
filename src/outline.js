/* ==========================================================================
   outline.js — the arc, as data.

   The guide is a compilation: one module per NCEES knowledge area, each a
   sequence of parts. Part ids are unique across the whole compilation, so a
   route is just `#/<part-id>` and cross-module links need no ceremony.

   Within a module the order is pedagogical, not the order NCEES prints its
   subtopics in. Every part names the spec code it satisfies, so coverage can
   be checked against the published blueprint rather than taken on trust.

   Plate numbers run continuously across modules — this is one drawing set,
   and Circuit Analysis genuinely refers back to Mathematics plates.
   ========================================================================== */

export const MODULES = [
  {
    id: "start", dir: "start", area: null,
    title: "Start here", questions: null,
    parts: [
      {
        id: "orientation", n: 0, spec: null,
        title: "What the Exam Actually Tests",
        blurb: "The clock, the handbook, and the one distinction that saves you a month",
        minutes: 6,
        figures: [1],
      },
    ],
  },
  {
    id: "math", dir: "math", area: 1,
    title: "Mathematics", questions: "11–17",
    parts: [
      {
        id: "algebra-trig", n: 1, spec: "1.A",
        title: "Algebra and Trigonometry",
        blurb: "Exponents, logarithms, and the triangle everything else is built on",
        minutes: 26, figures: [2, 3, 4, 5],
      },
      {
        id: "complex", n: 2, spec: "1.B",
        title: "Complex Numbers",
        blurb: "The same triangle, free to rotate — and why AC circuits need it",
        minutes: 20, figures: [6, 7, 8],
      },
      {
        id: "geometry", n: 3, spec: "1.D",
        title: "Analytic Geometry",
        blurb: "Equations become shapes; one parameter walks a circle to a hyperbola",
        minutes: 17, figures: [9, 10],
      },
      {
        id: "vectors", n: 4, spec: "1.H",
        title: "Vectors and Vector Analysis",
        blurb: "Direction made arithmetic — dot, cross, and the three derivatives of a field",
        minutes: 22, figures: [11, 12, 13],
      },
      {
        id: "linear-algebra", n: 5, spec: "1.G",
        title: "Linear Algebra",
        blurb: "A matrix is a machine that moves space; the determinant is what it does to area",
        minutes: 22, figures: [14, 15, 16],
      },
      {
        id: "calculus", n: 6, spec: "1.E",
        title: "Calculus",
        blurb: "Slope, then area, then the discovery that they undo each other",
        minutes: 32, figures: [17, 18, 19, 20],
      },
      {
        id: "odes", n: 7, spec: "1.F",
        title: "Differential Equations",
        blurb: "Where the complex numbers come back and decide whether the circuit rings",
        minutes: 24, figures: [21, 22],
      },
      {
        id: "discrete", n: 8, spec: "1.C",
        title: "Discrete Mathematics",
        blurb: "Counting, logic, and graphs — the half of the syllabus that is computer science",
        minutes: 17, figures: [23, 24],
      },
      {
        id: "synthesis", n: 9, spec: "1.A–1.H",
        title: "Synthesis and the Mixed Bench",
        blurb: "How few ideas were really doing the work, and a set under exam conditions",
        minutes: 12, figures: [25],
      },
    ],
  },
  {
    id: "circuits", dir: "circuits", area: 6,
    title: "Circuit Analysis", questions: "11–17",
    parts: [
      {
        id: "two-laws", n: 1, spec: "6.A",
        title: "The Two Laws",
        blurb: "Charge cannot pile up and energy cannot appear. Everything else is bookkeeping",
        minutes: 22, figures: [26],
      },
      {
        id: "series-parallel", n: 2, spec: "6.B",
        title: "Series, Parallel, and Dividers",
        blurb: "Collapsing a network to one resistor, then splitting what flows through it",
        minutes: 22, figures: [27, 28],
      },
      {
        id: "node-loop", n: 3, spec: "6.D",
        title: "Node and Loop Analysis",
        blurb: "The method that never needs cleverness — and where Part 5's matrices come back",
        minutes: 24, figures: [29],
      },
      {
        id: "thevenin", n: 4, spec: "6.C",
        title: "Thévenin and Norton",
        blurb: "Any linear network is one source and one resistor wearing a disguise",
        minutes: 22, figures: [30, 31],
      },
      {
        id: "waveforms", n: 5, spec: "6.E",
        title: "Waveforms",
        blurb: "Peak, average, RMS — and why the wall socket is really 170 volts",
        minutes: 22, figures: [32, 33],
      },
      {
        id: "phasors", n: 6, spec: "6.F · 6.G",
        title: "Phasors and Impedance",
        blurb: "Ohm's law with an angle, and the 3-4-5 triangle arriving as an impedance",
        minutes: 26, figures: [34, 35],
      },
      {
        id: "circuits-synthesis", n: 7, spec: "6.A–6.G",
        title: "Synthesis and the Mixed Bench",
        blurb: "Two laws did all of it, and a set under exam conditions",
        minutes: 12, figures: [36],
      },
    ],
  },
  {
    id: "electronics", dir: "electronics", area: 9,
    title: "Electronics", questions: "7–11",
    parts: [
      {
        id: "diode", n: 1, spec: "9.A",
        title: "The Diode",
        blurb: "The first component that is not linear, and the method that handles it",
        minutes: 22, figures: [49, 50],
      },
      {
        id: "rectifiers", n: 2, spec: "9.E",
        title: "Rectifiers and Power Conversion",
        blurb: "AC to DC, and the debt Circuit Analysis Part 5 has been holding",
        minutes: 24, figures: [51, 52],
      },
      {
        id: "transistors", n: 3, spec: "9.A · 9.B",
        title: "Transistors",
        blurb: "A valve you can control — BJT and FET, and the region each is in",
        minutes: 28, figures: [53, 54, 55],
      },
      {
        id: "amplifiers", n: 4, spec: "9.B",
        title: "Amplifiers",
        blurb: "Biasing, the load line, and where the gain actually comes from",
        minutes: 26, figures: [56, 57],
      },
      {
        id: "opamps", n: 5, spec: "9.C",
        title: "Operational Amplifiers",
        blurb: "Two rules that make almost every circuit in this part a one-line answer",
        minutes: 26, figures: [58, 59],
      },
      {
        id: "instrumentation", n: 6, spec: "9.D",
        title: "Instrumentation",
        blurb: "Measuring a thing without changing it, and turning the world into volts",
        minutes: 22, figures: [60, 61],
      },
      {
        id: "electronics-synthesis", n: 7, spec: "9.A–9.E",
        title: "Synthesis and the Mixed Bench",
        blurb: "One method ran through all of it, and a set under exam conditions",
        minutes: 12, figures: [62],
      },
    ],
  },
  {
    id: "digital", dir: "digital", area: 15,
    title: "Digital Systems", questions: "8–12",
    parts: [
      {
        id: "numbers", n: 1, spec: "15.A",
        title: "Number Systems",
        blurb: "One quantity, four notations — and the trick that makes subtraction free",
        minutes: 22, figures: [63, 64],
      },
      {
        id: "gates", n: 2, spec: "15.B · 15.C",
        title: "Boolean Logic and Gates",
        blurb: "Mathematics Part 8's algebra, now made of transistors",
        minutes: 24, figures: [65, 66],
      },
      {
        id: "minimisation", n: 3, spec: "15.D · 15.F",
        title: "Minimisation",
        blurb: "Every function is a sum of products, and the map finds the shortest one",
        minutes: 26, figures: [67, 68],
      },
      {
        id: "flipflops", n: 4, spec: "15.E",
        title: "Flip-Flops and Counters",
        blurb: "The moment a circuit acquires a memory, and what that costs",
        minutes: 26, figures: [69, 70],
      },
      {
        id: "state-machines", n: 5, spec: "15.G",
        title: "State Machines",
        blurb: "Memory plus logic is a machine that knows where it has been",
        minutes: 24, figures: [71, 72],
      },
      {
        id: "timing", n: 6, spec: "15.H",
        title: "Timing and Hazards",
        blurb: "Gates take time, and every digital failure mode starts there",
        minutes: 22, figures: [73, 74],
      },
      {
        id: "digital-synthesis", n: 7, spec: "15.A–15.H",
        title: "Synthesis and the Mixed Bench",
        blurb: "Two symbols became a machine, and a set under exam conditions",
        minutes: 12, figures: [75],
      },
    ],
  },
  {
    id: "linear", dir: "linear", area: 7,
    title: "Linear Systems", questions: "5–8",
    parts: [
      {
        id: "transient", n: 1, spec: "7.A",
        title: "Transient Response",
        blurb: "What a circuit does before steady state — one curve, four circuits",
        minutes: 22, figures: [76, 77],
      },
      {
        id: "second-order", n: 2, spec: "7.A",
        title: "Second-Order Response",
        blurb: "Two energy stores argue, and Mathematics Part 7's roots arrive as a circuit that rings",
        minutes: 24, figures: [78, 79],
      },
      {
        id: "laplace", n: 3, spec: "7.C",
        title: "The Laplace Transform",
        blurb: "The trick that turns a differential equation into algebra, and back",
        minutes: 22, figures: [80, 81],
      },
      {
        id: "transfer", n: 4, spec: "7.D",
        title: "Transfer Functions and the s-Plane",
        blurb: "One ratio holds the whole system, and a pole's position is its behaviour",
        minutes: 24, figures: [82, 83],
      },
      {
        id: "frequency", n: 5, spec: "7.A",
        title: "Frequency Response",
        blurb: "Let s become jω and the transfer function becomes a filter",
        minutes: 22, figures: [84, 85],
      },
      {
        id: "resonance", n: 6, spec: "7.B",
        title: "Resonance",
        blurb: "Where the reactances cancel, and how sharply — ω₀, Q, and bandwidth",
        minutes: 22, figures: [86, 87],
      },
      {
        id: "linear-synthesis", n: 7, spec: "7.A–7.D",
        title: "Synthesis and the Mixed Bench",
        blurb: "It was one s-plane the whole time, and a set under exam conditions",
        minutes: 12, figures: [88],
      },
    ],
  },
  {
    id: "control", dir: "control", area: 12,
    title: "Control Systems", questions: "6–9",
    parts: [
      {
        id: "feedback", n: 1, spec: "12.A",
        title: "Feedback and Block Diagrams",
        blurb: "One loop, one formula — and the reason almost everything is built this way",
        minutes: 24, figures: [89, 90],
      },
      {
        id: "closed-loop", n: 2, spec: "12.C",
        title: "The Closed Loop",
        blurb: "Turning the gain up drags the poles somewhere, and where is the whole question",
        minutes: 24, figures: [91, 92],
      },
      {
        id: "stability", n: 3, spec: "12.C",
        title: "Stability and Routh–Hurwitz",
        blurb: "Deciding whether any root is in the right half-plane without finding one",
        minutes: 22, figures: [93, 94],
      },
      {
        id: "margins", n: 4, spec: "12.B",
        title: "Bode Plots and Margins",
        blurb: "How much gain and how much delay a loop has left before it oscillates",
        minutes: 24, figures: [95, 96],
      },
      {
        id: "steady-error", n: 5, spec: "12.D",
        title: "Steady-State Error and System Type",
        blurb: "Count the integrators and you know the error before solving anything",
        minutes: 22, figures: [97, 98],
      },
      {
        id: "pid", n: 6, spec: "12.D",
        title: "Controller Performance and PID",
        blurb: "Three terms, three jobs, and the trade every one of them makes",
        minutes: 24, figures: [99, 100],
      },
      {
        id: "control-synthesis", n: 7, spec: "12.A–12.D",
        title: "Synthesis and the Mixed Bench",
        blurb: "One loop equation ran all of it, and a set under exam conditions",
        minutes: 12, figures: [101],
      },
    ],
  },
  {
    id: "dsp", dir: "dsp", area: 8,
    title: "Signal Processing", questions: "5–8",
    parts: [
      {
        id: "spectra", n: 1, spec: "8.A · 8.B",
        title: "Signals and Spectra",
        blurb: "The same signal written twice — and why a sharp edge is expensive",
        minutes: 20, figures: [102, 103],
      },
    ],
  },
  {
    id: "power", dir: "power", area: 10,
    title: "Power Systems", questions: "8–12",
    parts: [
      {
        id: "power-factor", n: 1, spec: "10.A",
        title: "Power Factor and What It Costs",
        blurb: "The angle from Part 6 turns into money, and a capacitor buys it back",
        minutes: 24, figures: [37, 38],
      },
      {
        id: "three-phase", n: 2, spec: "10.A · 10.B",
        title: "Three-Phase",
        blurb: "Where the √3 comes from, and why 208 volts is really 120 volts",
        minutes: 28, figures: [39, 40, 41],
      },
      {
        id: "transmission", n: 3, spec: "10.B",
        title: "Transmission and Distribution",
        blurb: "Loss falls as the square of voltage — the one fact the whole grid is shaped by",
        minutes: 22, figures: [42, 43],
      },
      {
        id: "transformers", n: 4, spec: "10.C",
        title: "Transformers",
        blurb: "The device that makes the last part possible, and impedance seen through it",
        minutes: 24, figures: [44, 45],
      },
      {
        id: "machines", n: 5, spec: "10.D",
        title: "Motors and Generators",
        blurb: "Synchronous speed, slip, and why the plant's power factor was 0.6 to begin with",
        minutes: 26, figures: [46, 47],
      },
      {
        id: "power-synthesis", n: 6, spec: "10.A–10.D",
        title: "Synthesis and the Mixed Bench",
        blurb: "One plant, followed from its motor to the transmission line, and a set under exam conditions",
        minutes: 12, figures: [48],
      },
    ],
  },
];

/** Every part, flattened, each tagged with the module it belongs to. */
export const PARTS = MODULES.flatMap((m) =>
  m.parts.map((p) => ({ ...p, module: m.id, dir: m.dir }))
);

export const byId = (id) => PARTS.find((p) => p.id === id);
export const indexOfPart = (id) => PARTS.findIndex((p) => p.id === id);
export const moduleOf = (id) => MODULES.find((m) => m.id === byId(id)?.module);

/** Where a part's prose lives. */
export const contentPath = (p) =>
  `content/${p.dir}/${String(p.n).padStart(2, "0")}-${p.id}.html`;

/** The knowledge areas this compilation covers so far, for the Part 0 chart. */
export const COVERED_AREAS = MODULES.filter((m) => m.area).map((m) => m.area);

/** NCEES subtopics, verbatim, for the coverage tables. */
export const SPEC = {
  math: [
    ["1.A", "Algebra and trigonometry", "algebra-trig"],
    ["1.B", "Complex numbers", "complex"],
    ["1.C", "Discrete mathematics", "discrete"],
    ["1.D", "Analytic geometry", "geometry"],
    ["1.E", "Calculus (differential, integral, single-variable, multivariable)", "calculus"],
    ["1.F", "Ordinary differential equations", "odes"],
    ["1.G", "Linear algebra", "linear-algebra"],
    ["1.H", "Vector analysis", "vectors"],
  ],
  circuits: [
    ["6.A", "KCL, KVL", "two-laws"],
    ["6.B", "Series/parallel equivalent circuits", "series-parallel"],
    ["6.C", "Thevenin and Norton theorems", "thevenin"],
    ["6.D", "Node and loop analysis", "node-loop"],
    ["6.E", "Waveform analysis (RMS, average, frequency, phase, wavelength)", "waveforms"],
    ["6.F", "Phasors", "phasors"],
    ["6.G", "Impedance", "phasors"],
  ],
  electronics: [
    ["9.A", "Models, biasing, and performance of discrete devices (diodes, transistors, thyristors)", "diode"],
    ["9.B", "Amplifiers (single-stage/common emitter, differential, biasing)", "amplifiers"],
    ["9.C", "Operational amplifiers (ideal, nonideal)", "opamps"],
    ["9.D", "Instrumentation (measurements, data acquisition, transducers)", "instrumentation"],
    ["9.E", "Power electronics (rectifiers, inverters, converters)", "rectifiers"],
  ],
  digital: [
    ["15.A", "Number systems", "numbers"],
    ["15.B", "Boolean logic", "gates"],
    ["15.C", "Logic gates and circuits", "gates"],
    ["15.D", "Logic minimization (SOP, POS, Karnaugh maps)", "minimisation"],
    ["15.E", "Flip-flops and counters", "flipflops"],
    ["15.F", "Programmable logic devices and gate arrays", "minimisation"],
    ["15.G", "State machine design", "state-machines"],
    ["15.H", "Timing (diagrams, asynchronous inputs, race conditions, hazards)", "timing"],
  ],
  linear: [
    ["7.A", "Frequency/transient response", "transient"],
    ["7.B", "Resonance", "resonance"],
    ["7.C", "Laplace transforms", "laplace"],
    ["7.D", "Transfer functions", "transfer"],
  ],
  control: [
    ["12.A", "Block diagrams (feedforward, feedback)", "feedback"],
    ["12.B", "Bode plots", "margins"],
    ["12.C", "Closed-loop response, open-loop response, and stability", "closed-loop"],
    ["12.D", "Controller performance (steady-state errors, settling time, overshoot)", "steady-error"],
  ],
  dsp: [
    ["8.A", "Sampling (aliasing, Nyquist theorem)", "sampling"],
    ["8.B", "Analog filters", "analog-filters"],
    ["8.C", "Digital filters (difference equations, Z-transforms)", "digital-filters"],
  ],
  power: [
    ["10.A", "Power theory (power factor, single and three phase, voltage regulation)", "power-factor"],
    ["10.B", "Transmission and distribution (real and reactive losses, efficiency, voltage drop, delta and wye connections)", "transmission"],
    ["10.C", "Transformers (single-phase and three-phase connections, reflected impedance)", "transformers"],
    ["10.D", "Motors and generators (synchronous, induction, dc)", "machines"],
  ],
};

export const TOTAL_MINUTES = PARTS.reduce((s, p) => s + p.minutes, 0);
