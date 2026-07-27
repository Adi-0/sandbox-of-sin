/* ==========================================================================
   app.js — the shell.

   Routes on the hash, loads one part at a time, then hands the fragment to
   the renderers: formulas first, then figures, then benches. Each mount is
   guarded so one broken plate cannot take the page down with it.
   ========================================================================== */

import { PARTS, byId, indexOfPart, TOTAL_MINUTES } from "./outline.js";
import { state, onStateChange } from "./state.js";
import { el, clear, $ } from "./lib/dom.js";
import { renderMathIn } from "./lib/tex.js";
import { mountFigures, mountFormulas } from "./lib/figure.js";
import { bench, reflexDrill } from "./lib/bench.js";

/* Registering the figure and problem modules is the only reason to import
   them; each one calls register()/defineProblem() at module scope. */
import "./figures/index.js";
import "./problems/index.js";

const reading = $("#reading");
const tocEl = $("#toc");
let teardowns = [];

/* ==========================================================================
   Contents rail
   ========================================================================== */

function buildToc() {
  clear(tocEl);
  PARTS.forEach((p) => {
    const a = el("a", { href: `#/${p.id}` },
      el("span.num", { text: p.n === 0 ? "00" : String(p.n).padStart(2, "0") }),
      el("span.label", { text: p.title }),
      el("span.meta", { text: `${p.spec ? p.spec + " · " : ""}${p.minutes} min` })
    );
    tocEl.appendChild(el("li", null, a));
  });
  paintToc();
}

function paintToc() {
  const cur = currentId();
  tocEl.querySelectorAll("a").forEach((a, i) => {
    const p = PARTS[i];
    a.toggleAttribute("aria-current", p.id === cur);
    if (p.id === cur) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    a.dataset.done = state.isRead(p.id) ? "1" : "0";
  });
  const done = PARTS.filter((p) => state.isRead(p.id)).length;
  const bar = $("#progress-bar");
  const txt = $("#progress-text");
  if (bar) bar.style.width = `${(done / PARTS.length) * 100}%`;
  if (txt) txt.textContent = `${done}/${PARTS.length} parts`;
}

/* ==========================================================================
   Routing
   ========================================================================== */

const currentId = () => {
  const id = location.hash.replace(/^#\/?/, "").split("/")[0];
  return byId(id) ? id : PARTS[0].id;
};

async function route() {
  const id = currentId();
  const part = byId(id);

  teardowns.forEach((fn) => { try { fn(); } catch { /* ignore */ } });
  teardowns = [];

  clear(reading);
  reading.appendChild(el("p.mono", {
    text: "Loading…", style: { color: "var(--faint)", fontSize: "var(--t-small)" },
  }));

  const path = `content/${String(part.n).padStart(2, "0")}-${part.id}.html`;
  let html;
  try {
    // build.py inlines every chapter here, so the single-file bundle needs no
    // server and no network at all
    if (window.__FE_CONTENT && window.__FE_CONTENT[path] != null) {
      html = window.__FE_CONTENT[path];
    } else {
      const res = await fetch(path, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    }
  } catch (err) {
    clear(reading);
    reading.appendChild(el("div.noscript-note", {
      html: `<b>Could not load this part.</b> This tool loads its chapters as separate files, ` +
            `which browsers block when a page is opened straight off disk. Serve the folder ` +
            `instead — <code>python3 serve.py</code> — then open ` +
            `<code>http://localhost:8000</code>.<br><br>Reported: ${err.message}`,
    }));
    return;
  }

  clear(reading);
  const article = el("article.part", { html });
  reading.appendChild(article);

  try { mountFormulas(article); } catch (err) { console.error("formula mount failed", err); }
  try { renderMathIn(article); } catch (err) { console.error("math render failed", err); }
  try { mountFigures(article, teardowns); } catch (err) { console.error("figure mount failed", err); }
  try { mountBenches(article); } catch (err) { console.error("bench mount failed", err); }

  article.appendChild(partNav(id));
  document.title = `${part.n === 0 ? "" : `Part ${part.n} · `}${part.title} — The Bench`;
  paintToc();
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  reading.focus({ preventScroll: true });
  watchForRead(part.id, article);
}

function mountBenches(root) {
  root.querySelectorAll("[data-bench]").forEach((slot) => {
    try {
      slot.replaceWith(bench(JSON.parse(slot.getAttribute("data-bench"))));
    } catch (err) {
      console.error("bench config is not valid JSON", err);
      slot.remove();
    }
  });
  root.querySelectorAll("[data-reflex]").forEach((slot) => {
    try {
      slot.replaceWith(reflexDrill(JSON.parse(slot.getAttribute("data-reflex") || "{}")));
    } catch (err) {
      console.error("reflex config is not valid JSON", err);
      slot.remove();
    }
  });
}

function partNav(id) {
  const i = indexOfPart(id);
  const prev = PARTS[i - 1], next = PARTS[i + 1];
  const nav = el("nav.partnav", { "aria-label": "Between parts" });
  if (prev) nav.appendChild(el("a.prev", { href: `#/${prev.id}` },
    el("span", { text: "← Previous" }), prev.title));
  if (next) nav.appendChild(el("a.next", { href: `#/${next.id}` },
    el("span", { text: "Next →" }), next.title));
  return nav;
}

/** A part counts as read once its last screen has been reached. */
function watchForRead(id, article) {
  if (state.isRead(id)) return;
  const sentinel = el("div", { style: { height: "1px" } });
  article.appendChild(sentinel);
  if (!("IntersectionObserver" in window)) { state.markRead(id); return; }
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { state.markRead(id); io.disconnect(); }
  }, { rootMargin: "0px 0px -20% 0px" });
  io.observe(sentinel);
  teardowns.push(() => io.disconnect());
}

/* ==========================================================================
   Theme
   ========================================================================== */

const THEMES = ["system", "light", "dark"];
function applyTheme() {
  const t = state.theme;
  if (t === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
  const btn = $("#theme-btn");
  if (btn) {
    btn.textContent = t === "system" ? "Theme: auto" : t === "light" ? "Theme: light" : "Theme: dark";
    btn.setAttribute("aria-label", `Colour theme: ${t}. Click to change.`);
  }
}

/* ==========================================================================
   Keyboard
   ========================================================================== */

function keys(ev) {
  const tag = ev.target.tagName;
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || ev.target.isContentEditable) return;
  const i = indexOfPart(currentId());
  if (ev.key === "ArrowRight" || ev.key === "]") {
    if (PARTS[i + 1]) { location.hash = `#/${PARTS[i + 1].id}`; ev.preventDefault(); }
  } else if (ev.key === "ArrowLeft" || ev.key === "[") {
    if (PARTS[i - 1]) { location.hash = `#/${PARTS[i - 1].id}`; ev.preventDefault(); }
  }
}

/* ==========================================================================
   Boot
   ========================================================================== */

function boot() {
  const total = $("#total-time");
  if (total) total.textContent = `${Math.round(TOTAL_MINUTES / 60 * 10) / 10} hours end to end`;

  buildToc();
  applyTheme();

  $("#theme-btn")?.addEventListener("click", () => {
    state.theme = THEMES[(THEMES.indexOf(state.theme) + 1) % THEMES.length];
    applyTheme();
  });
  $("#reset-btn")?.addEventListener("click", () => {
    if (confirm("Clear reading progress and practice scores stored in this browser?")) {
      state.reset();
      paintToc();
    }
  });

  onStateChange(paintToc);
  window.addEventListener("hashchange", route);
  document.addEventListener("keydown", keys);

  if (!location.hash) location.replace("#/orientation");
  route();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
