/* Progress + theme persistence. Deliberately tiny and forgiving:
   if localStorage is unavailable (private windows, file://), the guide
   still works, it just forgets you between visits. */

const KEY = 'spikes.progress.v1';
const THEME = 'spikes.theme.v1';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

let done = new Set(read(KEY, []));
const listeners = new Set();

export const progress = {
  has: (id) => done.has(id),
  get size() { return done.size; },
  all: () => Array.from(done),
  mark(id, value = true) {
    if (value) done.add(id); else done.delete(id);
    write(KEY, Array.from(done));
    listeners.forEach((f) => f());
  },
  reset() { done = new Set(); write(KEY, []); listeners.forEach((f) => f()); },
  onChange(f) { listeners.add(f); return () => listeners.delete(f); },
};

export const theme = {
  get() { return read(THEME, ''); },
  apply() {
    const t = this.get();
    document.documentElement.setAttribute('data-theme', t);
  },
  /** Cycle: system -> light -> dark -> system */
  cycle() {
    const order = ['', 'light', 'dark'];
    const next = order[(order.indexOf(this.get()) + 1) % order.length];
    write(THEME, next);
    this.apply();
    return next || 'system';
  },
};
