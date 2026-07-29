/* ==========================================================================
   boolean.js — an exact minimal-SOP solver for small functions.

   Up to five variables, so brute force over all 3ⁿ product terms is instant
   and exact, and nothing here needs Quine-McCluskey's bookkeeping. Terms are
   carried as a {mask, value} pair: mask marks which variables the term fixes,
   value gives what it fixes them to. Bit n−1 is the first variable, bit 0 the
   last, so a 4-variable term reads A B C D from the top down.

   Three plates and one problem generator all need this. Having it in one
   place is what stops a plate's rings and a bench answer from disagreeing.
   ========================================================================== */

/** Every cell a term covers. */
export function cellsOf(mask, value, n) {
  const out = [];
  for (let m = 0; m < 1 << n; m++) if ((m & mask) === value) out.push(m);
  return out;
}

/** Every prime implicant of `on`, free to use `dc` cells to grow. */
export function primeImplicants(on, dc, n) {
  const allowed = new Set([...on, ...dc]);
  const full = (1 << n) - 1;
  const isImp = (mask, value) => cellsOf(mask, value, n).every((m) => allowed.has(m));
  const out = [];
  for (let mask = 0; mask <= full; mask++) {
    for (let value = 0; value <= full; value++) {
      if ((value & ~mask & full) !== 0) continue;      // value must lie inside mask
      if (!isImp(mask, value)) continue;
      // prime: no fixed variable can be dropped and still give an implicant
      let prime = true;
      for (let b = 0; b < n; b++) {
        if (!(mask & (1 << b))) continue;
        const m2 = mask & ~(1 << b);
        if (isImp(m2, value & m2)) { prime = false; break; }
      }
      if (prime) out.push({ mask, value, cells: cellsOf(mask, value, n) });
    }
  }
  return out;
}

/**
 * A minimal cover: essential prime implicants first, then greedy on what is
 * left. Exact for the sizes this guide uses.
 */
export function cover(on, dc, n) {
  if (on.length === 0) return [];
  const pis = primeImplicants(on, dc, n);
  const always = pis.find((p) => p.mask === 0);
  if (always) return [always];                          // the function is 1
  const need = new Set(on);
  const chosen = [];

  for (const m of on) {
    const covering = pis.filter((p) => p.cells.includes(m));
    if (covering.length === 1 && !chosen.includes(covering[0])) chosen.push(covering[0]);
  }
  chosen.forEach((p) => p.cells.forEach((m) => need.delete(m)));

  while (need.size) {
    let best = null, bestN = 0;
    for (const p of pis) {
      if (chosen.includes(p)) continue;
      const k = p.cells.filter((m) => need.has(m)).length;
      if (k > bestN) { best = p; bestN = k; }
    }
    if (!best) break;
    chosen.push(best);
    best.cells.forEach((m) => need.delete(m));
  }
  return chosen;
}

const OVERBAR = "̄";   // U+0304, combining

/**
 * A product term as text. `comp` is what marks a complemented variable: the
 * combining overbar by default, or "'" where the surrounding type cannot be
 * relied on to place an accent — bench answer strings, mostly.
 */
export function termText(mask, value, n, vars, comp = OVERBAR) {
  if (mask === 0) return "1";
  let s = "";
  for (let b = n - 1; b >= 0; b--) {
    if (!(mask & (1 << b))) continue;
    s += vars[n - 1 - b] + (value & (1 << b) ? "" : comp);
  }
  return s;
}

/** How many variables a term fixes — its literal count. */
export function literals(mask, n) {
  let k = 0;
  for (let b = 0; b < n; b++) if (mask & (1 << b)) k++;
  return k;
}

/** A whole expression as text, plus the literal count it costs. */
export function sopText(terms, n, vars) {
  if (!terms.length) return { text: "0", cost: 0 };
  if (terms.length === 1 && terms[0].mask === 0) return { text: "1", cost: 0 };
  return {
    text: terms.map((t) => termText(t.mask, t.value, n, vars)).join(" + "),
    cost: terms.reduce((s, t) => s + literals(t.mask, n), 0),
  };
}

/** Minimal SOP of the function given as an on-set. */
export function minimise(on, dc, n, vars) {
  return sopText(cover(on, dc, n), n, vars);
}
