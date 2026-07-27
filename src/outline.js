/* ==========================================================================
   outline.js — the arc, as data.

   Order is pedagogical, not the order NCEES prints its subtopics in. Each
   part names the spec code it satisfies so nothing in the exam blueprint is
   quietly dropped, and so a student can check coverage against the source.
   ========================================================================== */

export const PARTS = [
  {
    id: "orientation", n: 0, spec: null,
    title: "What the Exam Actually Tests",
    blurb: "The clock, the handbook, and the one distinction that saves you a month",
    minutes: 6,
    figures: [1],
  },
  {
    id: "algebra-trig", n: 1, spec: "1.A",
    title: "Algebra and Trigonometry",
    blurb: "Exponents, logarithms, and the triangle everything else is built on",
    minutes: 26,
    figures: [2, 3, 4, 5],
  },
  {
    id: "complex", n: 2, spec: "1.B",
    title: "Complex Numbers",
    blurb: "The same triangle, free to rotate — and why AC circuits need it",
    minutes: 20,
    figures: [6, 7, 8],
  },
  {
    id: "geometry", n: 3, spec: "1.D",
    title: "Analytic Geometry",
    blurb: "Equations become shapes; one parameter walks a circle to a hyperbola",
    minutes: 17,
    figures: [9, 10],
  },
  {
    id: "vectors", n: 4, spec: "1.H",
    title: "Vectors and Vector Analysis",
    blurb: "Direction made arithmetic — dot, cross, and the three derivatives of a field",
    minutes: 22,
    figures: [11, 12, 13],
  },
  {
    id: "linear-algebra", n: 5, spec: "1.G",
    title: "Linear Algebra",
    blurb: "A matrix is a machine that moves space; the determinant is what it does to area",
    minutes: 22,
    figures: [14, 15, 16],
  },
  {
    id: "calculus", n: 6, spec: "1.E",
    title: "Calculus",
    blurb: "Slope, then area, then the discovery that they undo each other",
    minutes: 32,
    figures: [17, 18, 19, 20],
  },
  {
    id: "odes", n: 7, spec: "1.F",
    title: "Differential Equations",
    blurb: "Where the complex numbers come back and decide whether the circuit rings",
    minutes: 24,
    figures: [21, 22],
  },
  {
    id: "discrete", n: 8, spec: "1.C",
    title: "Discrete Mathematics",
    blurb: "Counting, logic, and graphs — the half of the syllabus that is computer science",
    minutes: 17,
    figures: [23, 24],
  },
  {
    id: "synthesis", n: 9, spec: "1.A–1.H",
    title: "Synthesis and the Mixed Bench",
    blurb: "How few ideas were really doing the work, and a set under exam conditions",
    minutes: 12,
    figures: [25],
  },
];

export const byId = (id) => PARTS.find((p) => p.id === id);
export const indexOfPart = (id) => PARTS.findIndex((p) => p.id === id);

/** NCEES knowledge area 1, verbatim, for the coverage table in Part 0. */
export const SPEC = [
  ["1.A", "Algebra and trigonometry", "algebra-trig"],
  ["1.B", "Complex numbers", "complex"],
  ["1.C", "Discrete mathematics", "discrete"],
  ["1.D", "Analytic geometry", "geometry"],
  ["1.E", "Calculus (differential, integral, single-variable, multivariable)", "calculus"],
  ["1.F", "Ordinary differential equations", "odes"],
  ["1.G", "Linear algebra", "linear-algebra"],
  ["1.H", "Vector analysis", "vectors"],
];

export const TOTAL_MINUTES = PARTS.reduce((s, p) => s + p.minutes, 0);
