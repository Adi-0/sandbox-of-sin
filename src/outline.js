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
};

export const TOTAL_MINUTES = PARTS.reduce((s, p) => s + p.minutes, 0);
