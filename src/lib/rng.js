/* ==========================================================================
   rng.js — a seeded random number generator.

   Problems are generated, not stored. A seed makes any generated set
   reproducible, so a student can come back to the exact problem they got
   wrong, and so a bad generator can be debugged from its seed alone.
   ========================================================================== */

/** mulberry32 — small, fast, good enough for picking coefficients. */
export function makeRng(seed) {
  let a = (seed >>> 0) || 0x9e3779b9;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const r = {
    /** float in [0, 1) */
    next,
    /** integer in [lo, hi] inclusive */
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    /** integer in [lo, hi] excluding 0 — coefficients that vanish break problems */
    nz: (lo, hi) => {
      for (let i = 0; i < 40; i++) { const v = r.int(lo, hi); if (v !== 0) return v; }
      return lo || hi || 1;
    },
    /** +1 or −1 */
    sign: () => (next() < 0.5 ? -1 : 1),
    /** one element of an array */
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    /** k distinct elements */
    sample: (arr, k) => r.shuffle(arr.slice()).slice(0, k),
    /** true with probability p */
    chance: (p) => next() < p,
    /** Fisher–Yates, in place, returns the array */
    shuffle: (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
    /** an integer from a set that keeps arithmetic mental */
    friendly: () => r.pick([2, 3, 4, 5, 6, 8, 10, 12]),
  };
  return r;
}

/** A fresh seed. Kept short so it can be shown to the reader and retyped. */
export function newSeed() {
  return Math.floor(Math.random() * 0xffffff) + 1;
}

/** Stable hash of a string, for deriving a seed from a topic name. */
export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
