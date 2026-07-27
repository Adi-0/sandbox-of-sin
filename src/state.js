/* ==========================================================================
   state.js — what the tool remembers.

   Progress and results live in localStorage and nowhere else. Nothing is
   sent anywhere. If storage is unavailable (private browsing, a locked-down
   profile) everything still works; it just forgets.
   ========================================================================== */

const KEY = "fe-math-bench/v1";

const BLANK = {
  read: {},        // partId -> true once the part has been scrolled through
  theme: "system", // system | light | dark
  bench: {},       // topicId -> { seen, right, streak, last }
  seeds: {},       // benchId -> last seed, so a set can be resumed
};

let cache = null;

function load() {
  if (cache) return cache;
  try {
    cache = { ...BLANK, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    cache = { ...BLANK };
  }
  return cache;
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* fine */ }
}

export const state = {
  get all() { return load(); },

  markRead(partId) {
    const s = load();
    if (!s.read[partId]) { s.read[partId] = true; save(); listeners.forEach((f) => f(s)); }
  },
  isRead: (partId) => !!load().read[partId],
  readCount: () => Object.keys(load().read).length,

  get theme() { return load().theme; },
  set theme(v) { load().theme = v; save(); },

  /** Record one answered problem against its topic. */
  score(topicId, right) {
    const s = load();
    const t = (s.bench[topicId] ||= { seen: 0, right: 0, streak: 0 });
    t.seen++;
    if (right) { t.right++; t.streak++; } else { t.streak = 0; }
    t.last = Date.now();
    save();
    listeners.forEach((f) => f(s));
  },
  topic: (topicId) => load().bench[topicId] || { seen: 0, right: 0, streak: 0 },

  /** Topics answered wrong more often than right — what to review next. */
  weakest(limit = 5) {
    const s = load();
    return Object.entries(s.bench)
      .filter(([, t]) => t.seen >= 2)
      .map(([id, t]) => ({ id, ...t, rate: t.right / t.seen }))
      .sort((a, b) => a.rate - b.rate)
      .slice(0, limit);
  },

  seed(benchId, value) {
    const s = load();
    if (value != null) { s.seeds[benchId] = value; save(); }
    return s.seeds[benchId];
  },

  reset() {
    cache = { ...BLANK, read: {}, bench: {}, seeds: {} };
    save();
    listeners.forEach((f) => f(cache));
  },
};

const listeners = new Set();
export function onStateChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
