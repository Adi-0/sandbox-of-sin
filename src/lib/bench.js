/* ==========================================================================
   bench.js — the problem engine.

   Problems are generated from seeds, not stored. Each generator returns a
   fully worked problem: the stem, four choices, which one is right, why the
   wrong ones are tempting, the solution steps, and where in the reference
   handbook the tool lives.

   Distractors matter as much as the answer. A distractor built by nudging a
   digit teaches nothing. A distractor built by *making the mistake* — losing
   a sign, working in degrees when the formula wants radians, forgetting the
   one-half — turns a wrong answer into a diagnosis.
   ========================================================================== */

import { el, clear } from "./dom.js";
import { tex, renderMathIn, fitDisplayMath } from "./tex.js";
import { clock } from "./fmt.js";
import { makeRng, newSeed } from "./rng.js";
import { state } from "../state.js";

/* --- generator registry ----------------------------------------------------- */

const generators = new Map();

/**
 * @param {string} id        stable topic id — progress is tracked against it
 * @param {object} spec
 * @param {string} spec.topic   human label shown above the stem
 * @param {string} spec.lookup  where the tool lives in the NCEES handbook
 * @param {(rng) => Problem} spec.make
 *
 * A Problem is:
 *   { stem, choices:[{tex|html|text, why}], answer:index, steps:[html],
 *     figure?: () => SVGElement, lookup? }
 */
export function defineProblem(id, spec) { generators.set(id, { id, ...spec }); }
export function getGenerator(id) { return generators.get(id); }
export function hasGenerator(id) { return generators.has(id); }

/** Build one problem, shuffling the choices so the answer is not always (A). */
export function generate(id, seed) {
  const gen = generators.get(id);
  if (!gen) throw new Error(`no problem generator "${id}"`);
  const rng = makeRng(seed);
  const p = gen.make(rng);

  const tagged = p.choices.map((c, i) => ({ ...c, right: i === p.answer }));
  rng.shuffle(tagged);
  return {
    ...p,
    id, seed,
    topic: p.topic || gen.topic,
    lookup: p.lookup || gen.lookup,
    choices: tagged,
    answer: tagged.findIndex((c) => c.right),
  };
}

/* --- rendering one choice --------------------------------------------------- */

const KEYS = ["A", "B", "C", "D"];

function choiceBody(c) {
  if (c.tex) return tex(c.tex);
  if (c.html) return c.html;
  return String(c.text ?? "");
}

/* ==========================================================================
   The bench: a set of problems with an exam-pace clock.
   ========================================================================== */

/**
 * @param {object} o
 * @param {string} o.id            bench id, used to remember the seed
 * @param {string} o.title         shown in the header strip
 * @param {string[]} o.topics      generator ids, cycled through
 * @param {number} [o.count]       how many problems in a set
 * @param {number} [o.pace]        seconds per problem; the real exam gives 170
 */
export function bench({ id, title = "Bench", topics, count = 6, pace = 170 }) {
  const root = el("section.bench", { "aria-label": `${title} — practice problems` });

  const live = topics.filter(hasGenerator);
  if (!live.length) {
    root.appendChild(el("div.bench-body", null,
      el("p", { text: "No problem generators are loaded for this part yet." })));
    return root;
  }

  let seed = state.seed(id) || newSeed();
  let queue = [], at = 0, answered = 0, correct = 0;
  const results = [];

  /* --- header --------------------------------------------------------- */
  const clockEl = el("span.clock", { text: clock(pace), role: "timer", "aria-label": "Time on this problem" });
  const countEl = el("span.count");
  const head = el("div.bench-head", null,
    el("span.title", { text: title }),
    el("span.spacer"),
    countEl,
    clockEl
  );

  const bodyEl = el("div.bench-body");
  const tally = el("span.tally");
  const nextBtn = el("button.btn.primary", { type: "button", text: "Start", onclick: () => advance() });
  const skipBtn = el("button.btn", { type: "button", text: "Skip", onclick: () => { record(false, true); advance(); } });
  const newSetBtn = el("button.btn", {
    type: "button", text: "New numbers",
    onclick: () => { seed = newSeed(); state.seed(id, seed); build(); advance(); },
  });
  const foot = el("div.bench-foot", null, nextBtn, skipBtn, el("span.spacer"), tally, newSetBtn);

  root.append(head, bodyEl, foot);

  /* --- clock ---------------------------------------------------------- */
  let left = pace, timer = null, running = false;
  function startClock() {
    stopClock();
    left = pace; running = true; paint();
    timer = setInterval(() => {
      if (!running) return;
      left--; paint();
      if (left <= -60) stopClock();
    }, 1000);
  }
  function stopClock() { if (timer) clearInterval(timer); timer = null; running = false; }
  function paint() {
    clockEl.textContent = left >= 0 ? clock(left) : "−" + clock(-left);
    clockEl.dataset.state = left <= 0 ? "over" : left <= 30 ? "warn" : "ok";
  }

  /* --- the set --------------------------------------------------------- */
  function build() {
    const rng = makeRng(seed);
    queue = [];
    for (let i = 0; i < count; i++) {
      const topicId = live[i % live.length];
      queue.push(generate(topicId, rng.int(1, 0xffffff)));
    }
    at = -1; answered = 0; correct = 0; results.length = 0;
    updateTally();
  }

  function updateTally() {
    tally.innerHTML = answered
      ? `<b>${correct}</b> of <b>${answered}</b> right`
      : `${count} problems · ${Math.round(pace / 60 * 10) / 10} min each`;
    countEl.textContent = at >= 0 && at < queue.length ? `${at + 1} / ${queue.length}` : "";
  }

  function advance() {
    at++;
    if (at >= queue.length) { stopClock(); showScore(); return; }
    show(queue[at]);
    startClock();
    nextBtn.textContent = "Next";
    nextBtn.disabled = true;
    skipBtn.disabled = false;
    updateTally();
  }

  function record(right, skipped = false) {
    if (results[at]) return;
    results[at] = { right, skipped };
    answered++;
    if (right) correct++;
    state.score(queue[at].id, right);
    updateTally();
  }

  /* --- one problem ------------------------------------------------------ */
  function show(p) {
    clear(bodyEl);
    bodyEl.appendChild(el("div.q-topic", { text: p.topic }));
    const stem = el("p.q-stem", { html: p.stem });
    bodyEl.appendChild(stem);
    if (p.figure) {
      try { bodyEl.appendChild(el("div.q-figure", null, p.figure())); }
      catch (err) { console.warn("problem figure failed", err); }
    }

    const choicesEl = el("div.choices", { role: "group", "aria-label": "Answer choices" });
    const buttons = p.choices.map((c, i) =>
      el("button.choice", {
        type: "button",
        onclick: () => answer(i),
      }, el("span.k", { text: KEYS[i] }), el("span", { html: choiceBody(c) }))
    );
    choicesEl.append(...buttons);
    bodyEl.appendChild(choicesEl);
    renderMathIn(bodyEl); fitDisplayMath(bodyEl);

    function answer(i) {
      running = false;
      const right = i === p.answer;
      record(right);
      buttons.forEach((b, k) => {
        b.disabled = true;
        b.dataset.state = k === p.answer ? "right" : k === i ? "wrong" : "";
      });
      const why = right
        ? (p.choices[i].why || "")
        : (p.choices[i].why || "That is one of the standard ways to lose this problem.");
      bodyEl.appendChild(el("div.verdict", { dataset: { ok: right ? "1" : "0" } },
        el("span.mark", { text: right ? "Correct" : "Not this one" }),
        el("span.why", { html: why })
      ));
      bodyEl.appendChild(solutionEl(p));
      renderMathIn(bodyEl); fitDisplayMath(bodyEl);
      nextBtn.disabled = false;
      skipBtn.disabled = true;
      nextBtn.focus();
    }
  }

  function solutionEl(p) {
    const s = el("div.solution", null,
      el("h5", { text: "Worked solution" }),
      el("ol.steps", null, p.steps.map((h) => el("li", { html: h })))
    );
    if (p.lookup) {
      s.appendChild(el("div.lookup", null,
        el("span.k", { text: "In the handbook" }),
        el("span.v", { html: p.lookup })
      ));
    }
    return s;
  }

  /* --- score card -------------------------------------------------------- */
  function showScore() {
    clear(bodyEl);
    const pct = answered ? Math.round((correct / answered) * 100) : 0;
    const card = el("div.scorecard", null,
      el("div.big", { html: `${correct}<small>of ${answered} · ${pct}%</small>` })
    );
    card.appendChild(el("p", {
      html: pct >= 80
        ? "Exam-ready on this material. Keep the pace; press <b>New numbers</b> for a fresh set whenever you want to confirm it holds."
        : pct >= 50
        ? "The ideas are there and the execution is not yet. Re-read the worked solutions for the ones you missed — the error is almost always the same one twice."
        : "Go back through the part before drilling further. Problems only build speed once the method is already right.",
    }));

    const perTopic = {};
    queue.forEach((p, i) => {
      const t = (perTopic[p.topic] ||= { seen: 0, right: 0 });
      t.seen++;
      if (results[i]?.right) t.right++;
    });
    const rows = Object.entries(perTopic).map(([name, t]) => {
      const r = t.right / t.seen;
      return el("div.row", null,
        el("span", { text: name }),
        el("span.bar", null, el("i", {
          style: { width: `${Math.round(r * 100)}%` },
          dataset: { low: r < 0.5 ? "1" : "0" },
        }))
      );
    });
    card.appendChild(el("div.weak", null, rows));
    bodyEl.appendChild(card);

    countEl.textContent = "";
    clockEl.textContent = "done";
    clockEl.dataset.state = "ok";
    nextBtn.textContent = "Run it again";
    nextBtn.disabled = false;
    skipBtn.disabled = true;
    nextBtn.onclick = () => { seed = newSeed(); state.seed(id, seed); build(); advance(); };
  }

  build();
  skipBtn.disabled = true;
  updateTally();
  bodyEl.appendChild(el("div.scorecard", null,
    el("p", {
      html: `<b>${count} problems, ${Math.round(pace / 60 * 10) / 10} minutes each.</b> That is the real exam's pace — ` +
            "110 questions in 6 hours, minus the tutorial and the break. The clock is there to be " +
            "noticed, not obeyed; a problem you solve slowly and correctly is still progress.",
    })
  ));

  return root;
}

/* ==========================================================================
   The Handbook Reflex drill.

   No arithmetic. A stem appears, and you name the tool. This trains the step
   students almost never practise and lose the most marks to: deciding, in a
   few seconds, what kind of problem is in front of them.
   ========================================================================== */

const reflexItems = [];
export function defineReflex(items) { reflexItems.push(...items); }
export function reflexPool() { return reflexItems.slice(); }

/**
 * @param {object} o
 * @param {string[]} [o.only]   restrict to items tagged with these part ids
 * @param {number} [o.seconds]  time allowed per stem
 */
export function reflexDrill({ only = null, seconds = 15, count = 8, title = "Handbook Reflex" } = {}) {
  const pool = reflexItems.filter((i) => !only || only.includes(i.part));
  const root = el("section.reflex", { "aria-label": "Handbook reflex drill" });
  if (pool.length < 4) {
    root.appendChild(el("div.bench-body", null, el("p", { text: "Not enough drill items are loaded." })));
    return root;
  }

  const clockEl = el("span.clock");
  const countEl = el("span.count");
  root.appendChild(el("div.bench-head", null,
    el("span.title", { text: title }),
    el("span.spacer"), countEl, clockEl));

  const bar = el("i");
  root.appendChild(el("div.reflex-timer", null, bar));
  const stemEl = el("div.reflex-stem");
  const choicesEl = el("div.reflex-choices");
  const tally = el("span.tally");
  const startBtn = el("button.btn.primary", { type: "button", text: "Start drill", onclick: () => start() });
  root.append(stemEl, choicesEl,
    el("div.bench-foot", null, startBtn, el("span.spacer"), tally));

  let queue = [], at = -1, right = 0, timer = null, left = seconds;

  stemEl.textContent = "Read the stem. Name the tool. No arithmetic — you are only deciding what kind of problem it is.";

  function start() {
    const rng = makeRng(newSeed());
    queue = rng.shuffle(pool.slice()).slice(0, Math.min(count, pool.length));
    at = -1; right = 0;
    startBtn.textContent = "Restart";
    next();
  }

  function next() {
    at++;
    clearInterval(timer);
    if (at >= queue.length) return finish();
    const item = queue[at];
    countEl.textContent = `${at + 1} / ${queue.length}`;
    stemEl.innerHTML = item.stem;
    renderMathIn(stemEl); fitDisplayMath(stemEl);

    // three plausible neighbours plus the right tool
    const rng = makeRng(newSeed());
    const wrong = rng.shuffle(reflexItems.filter((i) => i.tool !== item.tool).map((i) => i.tool))
      .filter((t, i, a) => a.indexOf(t) === i).slice(0, 3);
    const opts = rng.shuffle([item.tool, ...wrong]);

    clear(choicesEl);
    const btns = opts.map((t) => el("button.choice", {
      type: "button", onclick: () => pick(t, btns, item),
    }, el("span", { text: t })));
    choicesEl.append(...btns);

    left = seconds;
    tick();
    timer = setInterval(() => { left -= 0.1; tick(); if (left <= 0) pick(null, btns, item); }, 100);
  }

  function tick() {
    bar.style.width = `${Math.max(0, (left / seconds) * 100)}%`;
    clockEl.textContent = `${Math.max(0, left).toFixed(1)}s`;
    clockEl.dataset.state = left < 4 ? "warn" : "ok";
  }

  function pick(tool, btns, item) {
    clearInterval(timer);
    const ok = tool === item.tool;
    if (ok) right++;
    btns.forEach((b) => {
      b.disabled = true;
      const label = b.textContent;
      b.dataset.state = label === item.tool ? "right" : label === tool ? "wrong" : "";
    });
    tally.innerHTML = `<b>${right}</b> of <b>${at + 1}</b>`;
    stemEl.innerHTML = `${item.stem}<br><span style="color:var(--muted);font-size:0.9em">${item.because}</span>`;
    renderMathIn(stemEl); fitDisplayMath(stemEl);
    setTimeout(next, ok ? 900 : 2600);
  }

  function finish() {
    stemEl.innerHTML = `<span>You named <b>${right}</b> of <b>${queue.length}</b> correctly. ` +
      (right / queue.length >= 0.8
        ? "That reflex is what buys you time on exam day."
        : "Run it again — this is the cheapest skill on the whole exam to improve.") + "</span>";
    clear(choicesEl);
    countEl.textContent = "";
    clockEl.textContent = "done";
    bar.style.width = "0%";
  }

  return root;
}
