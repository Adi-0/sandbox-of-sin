/* ==========================================================================
   dom.js — element construction.

   The one thing worth knowing: SVG presentation *attributes* do not accept
   `var(--token)`, but CSS *properties* do. So `svg()` routes stroke, fill
   and friends through element.style, which is what makes every figure in
   this document theme itself for free.
   ========================================================================== */

const SVG_NS = "http://www.w3.org/2000/svg";

/* Paint-ish keys go to .style so they can carry var(--…). */
const STYLE_KEYS = new Set([
  "fill", "stroke", "strokeWidth", "strokeDasharray", "strokeLinecap",
  "strokeLinejoin", "opacity", "fillOpacity", "strokeOpacity", "fontSize",
  "fontWeight", "fontStyle", "fontFamily", "letterSpacing", "textAnchor",
  "dominantBaseline", "transformOrigin", "mixBlendMode", "pointerEvents",
]);

/* SVG has a handful of genuinely camelCase *attributes*. Kebab-casing these
   silently produces `view-box` and `marker-width`, which the renderer ignores —
   the figure then draws at 1:1 with no arrowheads and no clue why. */
const SVG_CAMEL = new Set([
  "viewBox", "preserveAspectRatio", "markerWidth", "markerHeight", "markerUnits",
  "refX", "refY", "patternUnits", "patternContentUnits", "patternTransform",
  "gradientUnits", "gradientTransform", "spreadMethod", "startOffset",
  "clipPathUnits", "maskUnits", "maskContentUnits", "primitiveUnits",
  "filterUnits", "baseFrequency", "numOctaves", "stdDeviation", "tableValues",
  "pathLength", "textLength", "lengthAdjust", "attributeName", "repeatCount",
  "keyTimes", "keySplines", "calcMode",
]);

const kebab = (s) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
const attrName = (s) => (SVG_CAMEL.has(s) ? s : kebab(s));

function applyProps(node, props, isSvg) {
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === "class" || k === "className") node.setAttribute("class", v);
    else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
    else if (k === "style") node.setAttribute("style", v);
    else if (k === "html") node.innerHTML = v;
    else if (k === "text") node.textContent = v;
    else if (k === "dataset") Object.assign(node.dataset, v);
    else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (isSvg && STYLE_KEYS.has(k)) node.style.setProperty(kebab(k), v);
    else if (!isSvg && k in node && k !== "list" && typeof v !== "object") node[k] = v;
    else node.setAttribute(isSvg ? attrName(k) : kebab(k), v);
  }
}

function appendKids(node, kids) {
  for (const c of kids.flat(4)) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === "object" ? c : document.createTextNode(String(c)));
  }
}

/** el("div.card", {…}, child, child) — tag supports .class and #id shorthand. */
export function el(spec, props, ...kids) {
  const m = /^([a-zA-Z0-9-]+)?(#[\w-]+)?((?:\.[\w-]+)*)$/.exec(spec) || [];
  const node = document.createElement(m[1] || "div");
  if (m[2]) node.id = m[2].slice(1);
  if (m[3]) node.className = m[3].slice(1).split(".").join(" ");
  applyProps(node, props, false);
  appendKids(node, kids);
  return node;
}

/** svg("circle", {…}) — same shorthand, SVG namespace, style-routed paint. */
export function svg(spec, props, ...kids) {
  const m = /^([a-zA-Z0-9-]+)?((?:\.[\w-]+)*)$/.exec(spec) || [];
  const node = document.createElementNS(SVG_NS, m[1] || "g");
  if (m[2]) node.setAttribute("class", m[2].slice(1).split(".").join(" "));
  applyProps(node, props, true);
  appendKids(node, kids);
  return node;
}

export const frag = (...kids) => {
  const f = document.createDocumentFragment();
  appendKids(f, kids);
  return f;
};

export const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); return node; };

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ==========================================================================
   Controls
   ========================================================================== */

let uid = 0;
export const nextId = (p = "u") => `${p}-${++uid}`;

/**
 * A labelled slider — the knob. Exactly one primary input per figure.
 * `format(v)` renders the live value shown beside the label.
 * Returns { root, input, set(v), value() }.
 */
export function knob({ label, min, max, step = 1, value, format = (v) => v, onInput }) {
  const id = nextId("knob");
  const val = el("span.val", { text: format(value) });
  const input = el("input", {
    type: "range", id, min, max, step, value,
    oninput: () => {
      const v = Number(input.value);
      val.textContent = format(v);
      onInput?.(v);
    },
  });
  const root = el("div.knob", null, el("label", { htmlFor: id }, el("span", { text: label }), val), input);
  return {
    root, input,
    value: () => Number(input.value),
    set(v, fire = true) {
      input.value = v;
      val.textContent = format(Number(input.value));
      if (fire) onInput?.(Number(input.value));
    },
  };
}

/**
 * A small set of scenario buttons — the other legal knob shape.
 * options: [{ id, label }]. Returns { root, set(id), value() }.
 */
export function scenarios({ label, options, value, onChange }) {
  let cur = value ?? options[0].id;
  const buttons = options.map((o) =>
    el("button", {
      type: "button", text: o.label, title: o.title || "",
      "aria-pressed": String(o.id === cur),
      onclick: () => api.set(o.id),
    })
  );
  const group = el("div.scenarios", { role: "group", "aria-label": label || "Scenario" }, buttons);
  const root = label
    ? el("div.knob", null, el("label", null, el("span", { text: label })), group)
    : group;
  const api = {
    root, value: () => cur,
    set(id, fire = true) {
      cur = id;
      buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(options[i].id === id)));
      if (fire) onChange?.(id);
    },
  };
  return api;
}

/** A readout well. `tone` is one of x | y | r | bad and must match the figure. */
export function readout({ key, value = "—", tone = "", sub = "" }) {
  const v = el("span.v", { html: value + (sub ? `<small>${sub}</small>` : "") });
  const root = el(`div.readout${tone ? "." + tone : ""}`, null, el("span.k", { text: key }), v);
  return {
    root,
    set(text, subText) {
      v.innerHTML = String(text) + (subText ?? sub ? `<small>${subText ?? sub}</small>` : "");
    },
  };
}

export const readouts = (...items) => el("div.readouts", null, items.map((i) => i.root ?? i));

/** Pause / play for anything that moves. Never auto-plays under reduced motion. */
export function motionToggle({ playing = true, onToggle }) {
  const btn = el("button.btn.small", {
    type: "button",
    text: playing ? "Pause" : "Play",
    "aria-pressed": String(playing),
    onclick: () => api.set(!api.playing),
  });
  const api = {
    playing,
    root: el("div.motion", null, btn),
    set(p) {
      api.playing = p;
      btn.textContent = p ? "Pause" : "Play";
      btn.setAttribute("aria-pressed", String(p));
      onToggle?.(p);
    },
  };
  return api;
}

/** True when the reader has asked for less movement. */
export const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/** Pointer/touch dragging on an SVG, reported in user (viewBox) coordinates. */
export function draggable(svgEl, onMove, { onStart, onEnd } = {}) {
  let active = false;
  const pt = (ev) => {
    const r = svgEl.getBoundingClientRect();
    const vb = svgEl.viewBox.baseVal;
    const sx = vb && vb.width ? vb.width / r.width : 1;
    const sy = vb && vb.height ? vb.height / r.height : 1;
    return {
      x: (ev.clientX - r.left) * sx + (vb ? vb.x : 0),
      y: (ev.clientY - r.top) * sy + (vb ? vb.y : 0),
    };
  };
  const down = (ev) => {
    active = true;
    svgEl.setPointerCapture?.(ev.pointerId);
    onStart?.(pt(ev));
    onMove(pt(ev));
    ev.preventDefault();
  };
  const move = (ev) => { if (active) { onMove(pt(ev)); ev.preventDefault(); } };
  const up = (ev) => { if (active) { active = false; onEnd?.(pt(ev)); } };
  svgEl.addEventListener("pointerdown", down);
  svgEl.addEventListener("pointermove", move);
  svgEl.addEventListener("pointerup", up);
  svgEl.addEventListener("pointercancel", up);
  svgEl.style.touchAction = "none";
  return () => {
    svgEl.removeEventListener("pointerdown", down);
    svgEl.removeEventListener("pointermove", move);
    svgEl.removeEventListener("pointerup", up);
    svgEl.removeEventListener("pointercancel", up);
  };
}
