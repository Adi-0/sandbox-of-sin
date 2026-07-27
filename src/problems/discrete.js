/* ==========================================================================
   problems/discrete.js — generators for Part 8.
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num } from "../lib/fmt.js";

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;

const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const P = (n, r) => fact(n) / fact(n - r);
const C = (n, r) => P(n, r) / fact(r);

/* ==========================================================================
   Permutations against combinations
   ========================================================================== */

defineProblem("perm-comb", {
  topic: "Counting",
  lookup: "Mathematics → Discrete mathematics → Permutations and combinations",
  make(rng) {
    const n = rng.int(6, 12), r = rng.int(2, 4);
    const ordered = rng.chance(0.5);

    const scenarios = ordered
      ? [
          `A password uses ${r} distinct characters drawn from a set of ${n}. How many are possible?`,
          `${n} runners finish a race. In how many ways can the first ${r} places be filled?`,
          `${r} distinct tasks are assigned to ${r} of ${n} available processors, one each. How many assignments are there?`,
        ]
      : [
          `A committee of ${r} is chosen from ${n} engineers. How many committees are possible?`,
          `${r} resistors are selected at random from a bin of ${n}. How many different selections are there?`,
          `A test plan picks ${r} of ${n} circuit boards to inspect. How many choices of set are there?`,
        ];

    const right = ordered ? P(n, r) : C(n, r);
    const other = ordered ? C(n, r) : P(n, r);

    return {
      stem: rng.pick(scenarios),
      choices: [
        { text: num(right), why: "" },
        { text: num(other),
          why: ordered
            ? `That is ${T(`C(${n}, ${r})`)}, which treats two different orderings as the same outcome. Here order <b>does</b> matter, so do not divide by ${T(`${r}!`)}.`
            : `That is ${T(`P(${n}, ${r})`)}, which counts each selection ${T(`${r}! = ${fact(r)}`)} times over. Here order does <b>not</b> matter.` },
        { text: num(Math.pow(n, r)),
          why: `That is ${T(`${n}^{${r}}`)} — the count if items could <b>repeat</b>. Each pick here removes one from the pool.` },
        { text: num(n * r), why: "Multiplying the two numbers is not a counting rule for either case." },
      ],
      answer: 0,
      steps: [
        `First decide the only thing that matters: <b>does order matter?</b> ` +
          (ordered
            ? "Yes — the stem distinguishes positions, so two different arrangements of the same items are two different outcomes. <b>Permutation.</b>"
            : "No — the stem asks for a set, so rearranging the same items gives the same outcome. <b>Combination.</b>"),
        ordered
          ? `<span class="math display" data-tex="P(${n}, ${r}) = \\frac{${n}!}{(${n}-${r})!} = ${Array.from({ length: r }, (_, i) => n - i).join(" \\times ")}"></span>`
          : `<span class="math display" data-tex="C(${n}, ${r}) = \\frac{${n}!}{${r}!\\,(${n}-${r})!} = \\frac{${Array.from({ length: r }, (_, i) => n - i).join(" \\times ")}}{${fact(r)}}"></span>`,
        `= <b>${num(right)}</b>. Sanity check: the other reading of this stem would give ${num(other)}, ` +
          `and both numbers are usually offered among the options. <b>The word in the stem is the whole question.</b>`,
      ],
    };
  },
});

/* ==========================================================================
   Inclusion–exclusion
   ========================================================================== */

defineProblem("set-count", {
  topic: "Sets",
  lookup: "Mathematics → Discrete mathematics → Set theory, Venn diagrams",
  make(rng) {
    const both = rng.int(3, 12);
    const a = both + rng.int(4, 20), b = both + rng.int(4, 20);
    const total = a + b - both + rng.int(2, 10);
    const neither = total - (a + b - both);

    const askNeither = rng.chance(0.45);
    const union = a + b - both;

    return {
      stem: askNeither
        ? `Of ${total} students, ${a} passed the written exam and ${b} passed the lab exam. ${both} passed both. How many passed neither?`
        : `In a group of ${total} components, ${a} pass a thermal test and ${b} pass a vibration test, with ${both} passing both. How many pass at least one test?`,
      choices: [
        { text: num(askNeither ? neither : union), why: "" },
        { text: num(askNeither ? total - a - b : a + b),
          why: "The overlap was double-counted. Anything in both sets got added twice, so it must be subtracted back once." },
        { text: num(askNeither ? union : neither),
          why: askNeither
            ? "That is how many passed at least one, which is the complement of what was asked."
            : "That is how many pass neither." },
        { text: num(both), why: "That is the overlap itself, which is given in the stem." },
      ],
      answer: 0,
      steps: [
        `<span class="math display" data-tex="|A \\cup B| = |A| + |B| - |A \\cap B|"></span>` +
          `The subtraction is the whole point: everything in the overlap was counted once in each set.`,
        `<span class="math display" data-tex="|A \\cup B| = ${a} + ${b} - ${both} = ${union}"></span>`,
        askNeither
          ? `Then subtract from the total: ${total} − ${union} = <b>${neither}</b>.`
          : `<b>${union}</b> pass at least one. As a check, ${total} − ${union} = ${neither} pass neither.`,
      ],
    };
  },
});

/* ==========================================================================
   Logical equivalence
   ========================================================================== */

defineProblem("logic-equiv", {
  topic: "Logic",
  lookup: "Mathematics → Discrete mathematics → Propositional logic, De Morgan's laws",
  make(rng) {
    const kind = rng.pick(["contrapositive", "demorgan", "implication"]);

    if (kind === "contrapositive") {
      return {
        stem: `Which statement is logically equivalent to ${T("p \\Rightarrow q")}?`,
        choices: [
          { tex: "\\neg q \\Rightarrow \\neg p", why: "" },
          { tex: "q \\Rightarrow p", why: "That is the <b>converse</b>, and it is a different claim. &ldquo;If it rains the ground is wet&rdquo; does not give &ldquo;if the ground is wet it rained.&rdquo;" },
          { tex: "\\neg p \\Rightarrow \\neg q", why: "That is the <b>inverse</b>, equivalent to the converse and not to the original." },
          { tex: "p \\land \\neg q", why: `That is the one case in which ${T("p \\Rightarrow q")} is <em>false</em> — its negation, not its equivalent.` },
        ],
        answer: 0,
        steps: [
          `Build the truth table if you are unsure — with two variables it is only four rows and takes under a minute.`,
          `${T("p \\Rightarrow q")} is false in exactly one case: ${T("p")} true and ${T("q")} false. ` +
            `${T("\\neg q \\Rightarrow \\neg p")} is false in exactly the same case. Identical columns, so they are equivalent.`,
          `<b>The contrapositive is always equivalent. The converse is not.</b> ` +
            `That distinction is what this question type exists to test.`,
        ],
      };
    }

    if (kind === "demorgan") {
      return {
        stem: `Simplify ${T("\\neg(p \\land q)")}.`,
        choices: [
          { tex: "\\neg p \\lor \\neg q", why: "" },
          { tex: "\\neg p \\land \\neg q", why: `That is ${T("\\neg(p \\lor q)")} — the other De Morgan law. Negating <b>flips</b> the connective.` },
          { tex: "p \\lor q", why: "The negations on the individual terms are missing." },
          { tex: "\\neg p \\Rightarrow q", why: "An implication is not what De Morgan produces here." },
        ],
        answer: 0,
        steps: [
          `De Morgan: pushing a negation inwards <b>swaps AND with OR</b>.` +
            `<span class="math display" data-tex="\\neg(p \\land q) \\equiv \\neg p \\lor \\neg q"></span>`,
          `In words: &ldquo;not both&rdquo; means &ldquo;at least one of them fails.&rdquo;`,
          `You have met this twice already — as a set identity in Form 8.1, and you will meet it again in Digital Systems as the NAND gate equivalence. <b>One law, three notations.</b>`,
        ],
      };
    }

    return {
      stem: `The statement ${T("p \\Rightarrow q")} is FALSE in which case?`,
      choices: [
        { text: "p is true and q is false", why: "" },
        { text: "p is false and q is true", why: "An implication with a false premise is <b>true</b>. It promises nothing about the case where p does not hold." },
        { text: "p is false and q is false", why: "Also true, for the same reason: the premise never fired." },
        { text: "p is true and q is true", why: "The premise held and so did the conclusion. That is exactly what the implication claimed." },
      ],
      answer: 0,
      steps: [
        `An implication is a promise: <em>if the premise holds, so does the conclusion</em>.`,
        `The promise is broken only when the premise holds and the conclusion fails — <b>p true, q false</b>. In every other row it is kept, including the two where p is false.`,
        `That is why ${T("p \\Rightarrow q \\equiv \\neg p \\lor q")}: either the premise fails, or the conclusion holds. ` +
          `Counter-intuitive on first meeting, and it is exam-tested precisely because of that.`,
      ],
    };
  },
});

/* ==========================================================================
   Graph degrees
   ========================================================================== */

defineProblem("graph-degree", {
  topic: "Graphs",
  lookup: "Mathematics → Discrete mathematics → Graph theory",
  make(rng) {
    const n = rng.int(5, 8);
    const e = rng.int(n, Math.floor((n * (n - 1)) / 2) - 1);
    const ask = rng.pick(["sumdeg", "complete", "odd"]);

    if (ask === "complete") {
      const full = (n * (n - 1)) / 2;
      return {
        stem: `How many edges does a complete graph on ${n} vertices have?`,
        choices: [
          { text: num(full), why: "" },
          { text: num(n * (n - 1)), why: "That counts each edge twice — once from each end. A complete graph has each <em>pair</em> joined once." },
          { text: num(n), why: "That is the number of vertices, not edges." },
          { text: num(n * n), why: `That is the size of the adjacency matrix, which also counts the diagonal and both directions.` },
        ],
        answer: 0,
        steps: [
          `Complete means every pair of distinct vertices is joined exactly once — so this is a <b>counting</b> question: how many pairs are there?`,
          `Order does not matter (the edge A–B is the edge B–A), so it is a combination:` +
            `<span class="math display" data-tex="\\binom{${n}}{2} = \\frac{${n} \\times ${n - 1}}{2} = ${full}"></span>`,
          `<b>${full} edges.</b> Note this reused Part 8's counting rule rather than any new graph formula.`,
        ],
      };
    }

    if (ask === "odd") {
      return {
        stem: `Which of these is impossible for a simple graph?`,
        choices: [
          { text: "Exactly three vertices of odd degree", why: "" },
          { text: "Exactly two vertices of odd degree", why: "Perfectly possible — a simple path has exactly two odd-degree ends." },
          { text: "Every vertex of even degree", why: "Possible — a cycle has every vertex of degree 2." },
          { text: "Exactly four vertices of odd degree", why: "Possible, since four is even." },
        ],
        answer: 0,
        steps: [
          `The handshake lemma: ${T("\\sum \\deg(v) = 2|E|")}, because every edge contributes 1 to each of its two ends.`,
          `The right-hand side is even, so the total degree is always even. The even-degree vertices contribute an even amount, so <b>the odd-degree vertices must also sum to something even</b> — which forces there to be an even <em>number</em> of them.`,
          `Three is odd, so <b>three odd-degree vertices is impossible</b> in any graph whatsoever.`,
        ],
      };
    }

    return {
      stem: `A simple graph has ${n} vertices and ${e} edges. What is the sum of all the vertex degrees?`,
      choices: [
        { text: num(2 * e), why: "" },
        { text: num(e), why: "Each edge contributes to the degree of <b>two</b> vertices, so the total is twice the edge count." },
        { text: num(n + e), why: "Vertices and edges are not added together — degree counts edge-ends only." },
        { text: num(n * (n - 1) / 2), why: "That is the edge count of a <em>complete</em> graph on these vertices, not this graph." },
      ],
      answer: 0,
      steps: [
        `Every edge has two ends, and each end raises the degree of the vertex it touches by one.`,
        `<span class="math display" data-tex="\\sum_{v} \\deg(v) = 2|E| = 2(${e})"></span>`,
        `= <b>${2 * e}</b>. Notice the vertex count never entered — <b>this answer does not depend on ${T("n")} at all</b>, which is worth noticing when a stem hands you a number you do not need.`,
      ],
    };
  },
});

/* ==========================================================================
   Handbook Reflex items for Part 8
   ========================================================================== */

defineReflex([
  {
    part: "discrete",
    stem: "How many 4-digit PINs can be made from the digits 0–9 with no repeats?",
    tool: "Permutation",
    because: "A PIN's order matters — 1234 and 4321 are different PINs.",
  },
  {
    part: "discrete",
    stem: "A quality check pulls 5 boards from a lot of 40 for inspection. How many samples?",
    tool: "Combination",
    because: "The sample is a set; the order they were pulled in is irrelevant.",
  },
  {
    part: "discrete",
    stem: "Simplify NOT (A OR B) into an equivalent expression using AND.",
    tool: "De Morgan's law",
    because: "Negation swaps OR for AND and distributes onto each term.",
  },
  {
    part: "discrete",
    stem: "A network has 12 links. What is the total of all node degrees?",
    tool: "Handshake lemma",
    because: "Total degree is exactly twice the edge count, always.",
  },
  {
    part: "discrete",
    stem: "60 devices support Wi-Fi, 45 support Bluetooth, 25 support both. How many support at least one?",
    tool: "Inclusion–exclusion",
    because: "Adding the two sets double-counts the overlap, so subtract it once.",
  },
]);
