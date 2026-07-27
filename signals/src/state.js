/*
 * Progress and theme, persisted in localStorage and nowhere else.
 * Deliberately forgiving: in a private window, or over file://, storage
 * throws — the guide carries on working, it just forgets you.
 */

const KEY = 'echo.progress.v1';
const THEME = 'echo.theme.v1';

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

export const progress = {
  has: (id) => done.has(id),
  get size() { return done.size; },
  mark(id, value = true) {
    if (value) done.add(id); else done.delete(id);
    write(KEY, Array.from(done));
  },
  reset() { done = new Set(); write(KEY, []); },
};

export const theme = {
  get() { return read(THEME, ''); },
  apply() { document.documentElement.setAttribute('data-theme', this.get()); },
  /** system -> light -> dark -> system */
  cycle() {
    const order = ['', 'light', 'dark'];
    const next = order[(order.indexOf(this.get()) + 1) % order.length];
    write(THEME, next);
    this.apply();
    return next || 'system';
  },
};
