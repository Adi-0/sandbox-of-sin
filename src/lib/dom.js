/* Tiny DOM/SVG helpers. No framework, no build step. */

const SVGNS = 'http://www.w3.org/2000/svg';

/** Create an SVG element: s('circle', {cx:1, cy:2, r:3}) */
export function s(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(SVGNS, tag);
  for (const k in attrs) {
    const v = attrs[k];
    if (v === null || v === undefined || v === false) continue;
    if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid) el.appendChild(kid);
  return el;
}

/** Create an HTML element: h('div', {class:'x'}, 'hello') */
export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const k in attrs) {
    const v = attrs[k];
    if (v === null || v === undefined || v === false) continue;
    if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  }
  return el;
}

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Round for display. Never leak a floating-point tail to the reader. */
export function fmt(x, digits = 1) {
  if (!isFinite(x)) return '—';
  const r = Number(x.toFixed(digits));
  return digits === 0 ? String(Math.round(x)) : r.toFixed(digits);
}

/** Compact engineering-ish formatting for wide-ranging magnitudes. */
export function eng(x, digits = 1) {
  const a = Math.abs(x);
  if (a >= 1e12) return fmt(x / 1e12, digits) + ' T';
  if (a >= 1e9)  return fmt(x / 1e9,  digits) + ' G';
  if (a >= 1e6)  return fmt(x / 1e6,  digits) + ' M';
  if (a >= 1e3)  return fmt(x / 1e3,  digits) + ' k';
  return fmt(x, digits) + ' ';
}

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const lerp  = (a, b, t) => a + (b - a) * t;

/** Deterministic RNG so every figure looks the same on every load. */
export function rng(seed = 20) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build a labelled slider control.
 * The knob rule: one primary input, immediate consequence, real units.
 */
export function knob({ id, label, min, max, step, value, format, oninput }) {
  const out = h('output', { for: id, text: format(value) });
  const input = h('input', {
    type: 'range', id, min, max, step, value,
    'aria-label': label,
    oninput: (e) => {
      const v = Number(e.target.value);
      out.textContent = format(v);
      oninput(v);
    },
  });
  return {
    el: h('div', { class: 'knob' }, h('label', { for: id, text: label }), input, out),
    input, out,
    set(v) { input.value = v; out.textContent = format(Number(v)); },
    get value() { return Number(input.value); },
  };
}

/** A row of scenario buttons. Exactly one is pressed at a time. */
export function scenarios({ options, value, onchange }) {
  const btns = options.map((o) =>
    h('button', {
      type: 'button', class: 'btn', 'data-val': o.value,
      'aria-pressed': String(o.value === value),
      text: o.label,
      onclick: () => { select(o.value); onchange(o.value); },
    })
  );
  function select(v) {
    btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.val === String(v))));
  }
  return { el: h('div', { class: 'scenarios' }, btns), select };
}

/** A readout chip: key, value, optional semantic colour. */
export function readout(key, initial = '—', quantity = null) {
  const v = h('span', { class: 'ro__v', text: initial, 'data-q': quantity });
  return {
    el: h('div', { class: 'ro' }, h('span', { class: 'ro__k', text: key }), v),
    set(text) { v.textContent = text; },
  };
}

/**
 * Assemble a figure: numbered head, instrument panel with corner title
 * block, optional controls / readouts strip, and a caption.
 */
export function figure({ n, title, tag = 'interactive', block, sweep, caption, aria }) {
  const blockEl = h('div', { class: 'panel__block' },
    h('b', { text: `FIG ${String(n).padStart(2, '0')}` }),
    h('span', { class: 'sep', text: '·' }),
    h('span', { text: block }),
    sweep ? h('span', { class: 'right', text: sweep }) : null
  );
  const body = h('div', { class: 'panel__body' });
  const panel = h('div', { class: 'panel' }, blockEl, body);
  const root = h('figure', { class: 'figure', id: `fig-${n}` },
    h('div', { class: 'figure__head' },
      h('span', { class: 'figure__num', text: `Figure ${n}` }),
      h('span', { class: 'figure__title', text: title }),
      h('span', { class: 'figure__tag', 'data-tag': tag, text: tag })
    ),
    panel,
    h('figcaption', { class: 'figure__caption', html: caption })
  );
  return {
    root, panel, body, blockEl,
    /** Mount an SVG with its accessibility label. */
    svg(viewBox) {
      const el = s('svg', { viewBox, role: 'img', 'aria-label': aria || title,
        preserveAspectRatio: 'xMidYMid meet' });
      body.appendChild(el);
      return el;
    },
    controls(...kids) {
      const el = h('div', { class: 'controls' }, ...kids);
      panel.appendChild(el);
      return el;
    },
    readouts(...kids) {
      const el = h('div', { class: 'readouts' }, ...kids);
      panel.appendChild(el);
      return el;
    },
    setSweep(text) {
      let r = blockEl.querySelector('.right');
      if (!r) { r = h('span', { class: 'right' }); blockEl.appendChild(r); }
      r.textContent = text;
    },
  };
}

/** Colour key strip — used once per part, not per figure. */
export function colorKey(items) {
  return h('div', { class: 'key' },
    items.map(([c, label]) =>
      h('span', { class: 'key__i' },
        h('span', { class: 'key__sw', style: `background:var(--${c})` }),
        label
      )
    )
  );
}
