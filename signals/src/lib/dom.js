/*
 * dom.js — element helpers and the parts every figure is assembled from.
 *
 * The signature device of this guide lives here: figure() stamps a DOMAIN
 * TAB on the top edge of every panel, naming the room the drawing is made
 * in. Time, frequency, or the s-plane. The whole subject is the business
 * of moving between those rooms, so the reader should never have to guess
 * which one they are looking at.
 */

const SVGNS = 'http://www.w3.org/2000/svg';

/** Create an SVG element: s('circle', { cx: 1, cy: 2, r: 3 }) */
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

/** Create an HTML element: h('div', { class: 'x' }, 'hello') */
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

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------------- numbers, always rounded ---------------- */

/** Never leak a floating-point tail into a readout. */
export function fmt(x, digits = 1) {
  if (!isFinite(x)) return '—';
  if (Object.is(x, -0)) x = 0;
  return x.toFixed(digits);
}

/** Sign always shown — for phases, decibels, and pole positions. */
export function sgn(x, digits = 1) {
  if (!isFinite(x)) return '—';
  const v = Number(x.toFixed(digits));
  return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(digits);
}

/** Frequencies and rates across many decades, with an SI-ish prefix. */
export function eng(x, digits = 1) {
  const a = Math.abs(x);
  if (a >= 1e9) return fmt(x / 1e9, digits) + ' G';
  if (a >= 1e6) return fmt(x / 1e6, digits) + ' M';
  if (a >= 1e3) return fmt(x / 1e3, digits) + ' k';
  if (a >= 1 || a === 0) return fmt(x, digits) + ' ';
  if (a >= 1e-3) return fmt(x * 1e3, digits) + ' m';
  return fmt(x * 1e6, digits) + ' µ';
}

/* ---------------- controls ---------------- */

/**
 * One labelled slider. The knob rule: exactly one primary input per
 * figure, an immediately visible consequence, and units on the readout.
 */
export function knob({ id, label, min, max, step, value, format, oninput }) {
  const out = h('output', { for: id, text: format(value) });
  const input = h('input', {
    type: 'range', id, min, max, step, value, 'aria-label': label,
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

/** A row of scenario buttons; exactly one is pressed at a time. */
export function scenarios({ options, value, onchange, label = 'Choose a case' }) {
  const btns = options.map((o) =>
    h('button', {
      type: 'button', class: 'btn', 'data-val': String(o.value),
      'aria-pressed': String(o.value === value), text: o.label,
      onclick: () => { select(o.value); onchange(o.value); },
    })
  );
  function select(v) {
    btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.val === String(v))));
  }
  return { el: h('div', { class: 'scenarios', role: 'group', 'aria-label': label }, btns), select, btns };
}

/** A readout chip. `quantity` tints it with one of the four pens. */
export function readout(key, initial = '—', quantity = null) {
  const v = h('span', { class: 'ro__v', text: initial, 'data-q': quantity });
  return {
    el: h('div', { class: 'ro' }, h('span', { class: 'ro__k', text: key }), v),
    set(text, q) { v.textContent = text; if (q !== undefined) v.setAttribute('data-q', q || ''); },
  };
}

/* ---------------- the figure ---------------- */

const DOMAIN = {
  t: { glyph: 't', name: 'Time domain' },
  w: { glyph: 'ω', name: 'Frequency domain' },
  s: { glyph: 's', name: 'The s-plane' },
  n: { glyph: 'n', name: 'Sampled' },
};

/**
 * Assemble a figure.
 *   n        figure number
 *   title    short title
 *   tag      'interactive' | 'reference' | 'listen'
 *   domains  which rooms this drawing is made in, e.g. ['t'] or ['t','w']
 *   strip    optional mono line inside the panel naming what is plotted
 *   caption  HTML; must add a second insight, never restate the title
 *   aria     description of the drawing for screen readers
 */
export function figure({ n, title, tag = 'interactive', domains = ['t'], strip, caption, aria }) {
  const tabs = h('div', { class: 'tabs' },
    domains.map((d) => {
      const info = DOMAIN[d] || DOMAIN.t;
      return h('span', { class: 'tab', 'data-domain': d },
        h('span', { class: 'tab__glyph', 'aria-hidden': 'true', text: info.glyph }),
        info.name
      );
    })
  );

  const body = h('div', { class: 'panel__body' });
  const panel = h('div', { class: 'panel' });
  let stripEl = null;
  if (strip) {
    stripEl = h('div', { class: 'panel__strip' }, h('span', { text: strip }));
    panel.appendChild(stripEl);
  }
  panel.appendChild(body);

  const root = h('figure', { class: 'figure', id: `fig-${n}` },
    h('div', { class: 'figure__head' },
      h('span', { class: 'figure__num', text: `Figure ${n}` }),
      h('span', { class: 'figure__title', text: title }),
      h('span', { class: 'figure__tag', 'data-tag': tag, text: tag })
    ),
    tabs, panel,
    h('figcaption', { class: 'figure__caption', html: caption })
  );

  return {
    root, panel, body,
    /** Mount an SVG with its accessibility label. */
    svg(viewBox, label) {
      const el = s('svg', {
        viewBox, role: 'img', 'aria-label': label || aria || title,
        preserveAspectRatio: 'xMidYMid meet',
      });
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
    setStrip(text) {
      if (!stripEl) {
        stripEl = h('div', { class: 'panel__strip' }, h('span'));
        panel.insertBefore(stripEl, panel.firstChild);
      }
      stripEl.firstChild.textContent = text;
    },
  };
}

/** The pen key. Used once per part, never per figure. */
export function colorKey(items) {
  return h('div', { class: 'key' },
    items.map(([pen, label]) =>
      h('span', { class: 'key__i' },
        h('span', { class: 'key__sw', style: `background:var(--${pen})` }), label
      )
    )
  );
}

/* ---------------- pointer dragging on an SVG ---------------- */

/**
 * Convert a pointer event to viewBox coordinates. getScreenCTM handles
 * the SVG being scaled to fit its container, which it always is.
 */
export function svgPoint(svg, evt) {
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX; pt.y = evt.clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

/** Make an SVG element draggable. onMove receives viewBox coordinates. */
export function draggable(svg, el, onMove) {
  let active = false;
  const move = (e) => { if (active) { e.preventDefault(); onMove(svgPoint(svg, e)); } };
  el.addEventListener('pointerdown', (e) => {
    active = true; el.setPointerCapture(e.pointerId); onMove(svgPoint(svg, e)); e.preventDefault();
  });
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', () => { active = false; });
  el.addEventListener('pointercancel', () => { active = false; });
  el.style.touchAction = 'none';
}
