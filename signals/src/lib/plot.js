/*
 * plot.js — the drawing primitives.
 *
 * Graticules, ticks and decade rules are generated from the axis
 * description, never hand-authored, so a figure cannot end up with
 * labels that disagree with its data. Every colour is a CSS custom
 * property, which is the whole of the dark-mode implementation.
 */

import { s, fmt } from './dom.js';

const LOG = Math.log10;

/** 1, 2, 2.5 or 5 times a power of ten — the only step sizes that read
    well on an axis. Without this, an auto-scaled range gives ticks like
    "0, 2, 3, 5, 6" from a step of 1.5, which looks like a mistake. */
export function niceStep(range, want = 5) {
  const raw = Math.abs(range) / want;
  if (!(raw > 0)) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const mult = norm <= 1.2 ? 1 : norm <= 2.5 ? 2 : norm <= 4 ? 2.5 : norm <= 7.5 ? 5 : 10;
  return mult * mag;
}

function linTicks(axis) {
  if (axis.ticks) return axis.ticks;
  const step = axis.step || niceStep(axis.max - axis.min, 5);
  const out = [];
  const first = Math.ceil((axis.min - Math.abs(step) * 1e-6) / step) * step;
  for (let v = first; v <= axis.max + Math.abs(step) * 1e-6; v += step) {
    out.push(Number(v.toPrecision(12)));
  }
  return out;
}

function logTicks(axis) {
  const out = [];
  const lo = Math.floor(LOG(axis.min) + 1e-9);
  const hi = Math.ceil(LOG(axis.max) - 1e-9);
  for (let d = lo; d <= hi; d++) {
    const v = Math.pow(10, d);
    if (v >= axis.min * 0.999 && v <= axis.max * 1.001) out.push(v);
  }
  return out;
}

function logMinor(axis) {
  const out = [];
  const lo = Math.floor(LOG(axis.min) + 1e-9);
  const hi = Math.ceil(LOG(axis.max) - 1e-9);
  for (let d = lo; d <= hi; d++) {
    for (let m = 2; m <= 9; m++) {
      const v = m * Math.pow(10, d);
      if (v > axis.min * 1.001 && v < axis.max * 0.999) out.push(v);
    }
  }
  return out;
}

const defaultLabel = (axis) => (v) => {
  if (axis.label) return axis.label(v);
  if (axis.log) {
    if (v >= 1e6) return `${v / 1e6}M`;
    if (v >= 1e3) return `${v / 1e3}k`;
    if (v >= 1) return String(v);
    return String(Number(v.toPrecision(2)));
  }
  return fmt(v, axis.decimals ?? 0);
};

/**
 * A plotting surface inside an <svg>.
 * Returns scale functions plus helpers that append into a data layer, so
 * clear() wipes the drawing without disturbing the graticule.
 */
export function scope(root, opts = {}) {
  const W = opts.w ?? 720;
  const H = opts.h ?? 230;
  const pad = { l: 52, r: 16, t: 14, b: 30, ...(opts.pad || {}) };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const x = { min: 0, max: 1, log: false, ...(opts.x || {}) };
  const y = { min: 0, max: 1, log: false, ...(opts.y || {}) };

  root.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const fx = x.log
    ? (v) => pad.l + ((LOG(Math.max(v, 1e-30)) - LOG(x.min)) / (LOG(x.max) - LOG(x.min))) * iw
    : (v) => pad.l + ((v - x.min) / (x.max - x.min)) * iw;
  const fy = y.log
    ? (v) => pad.t + ih - ((LOG(Math.max(v, 1e-30)) - LOG(y.min)) / (LOG(y.max) - LOG(y.min))) * ih
    : (v) => pad.t + ih - ((v - y.min) / (y.max - y.min)) * ih;

  const invX = x.log
    ? (px) => Math.pow(10, LOG(x.min) + ((px - pad.l) / iw) * (LOG(x.max) - LOG(x.min)))
    : (px) => x.min + ((px - pad.l) / iw) * (x.max - x.min);
  const invY = y.log
    ? (py) => Math.pow(10, LOG(y.min) + ((pad.t + ih - py) / ih) * (LOG(y.max) - LOG(y.min)))
    : (py) => y.min + ((pad.t + ih - py) / ih) * (y.max - y.min);

  const grid = s('g', { 'stroke-width': 1, fill: 'none' });
  const axes = s('g');
  const data = s('g');
  root.append(grid, axes, data);

  const xMajor = x.log ? logTicks(x) : linTicks(x);
  const yMajor = y.log ? logTicks(y) : linTicks(y);

  if (opts.grid !== false) {
    if (x.log) for (const v of logMinor(x)) {
      grid.appendChild(s('line', { x1: fx(v), x2: fx(v), y1: pad.t, y2: pad.t + ih, stroke: 'var(--grid)', opacity: 0.55 }));
    }
    if (y.log) for (const v of logMinor(y)) {
      grid.appendChild(s('line', { x1: pad.l, x2: pad.l + iw, y1: fy(v), y2: fy(v), stroke: 'var(--grid)', opacity: 0.55 }));
    }
    for (const v of xMajor) {
      grid.appendChild(s('line', { x1: fx(v), x2: fx(v), y1: pad.t, y2: pad.t + ih, stroke: 'var(--grid)' }));
    }
    for (const v of yMajor) {
      grid.appendChild(s('line', { x1: pad.l, x2: pad.l + iw, y1: fy(v), y2: fy(v), stroke: 'var(--grid)' }));
    }
  }
  if (opts.frame !== false) {
    grid.appendChild(s('rect', { x: pad.l, y: pad.t, width: iw, height: ih, stroke: 'var(--grid-major)', fill: 'none' }));
  }

  const tick = (str, px, py, anchor) => s('text', {
    x: px, y: py, 'text-anchor': anchor, fill: 'var(--ink-3)',
    'font-family': 'var(--font-mono)', 'font-size': 10, text: str,
  });
  if (opts.xLabels !== false) {
    const lab = defaultLabel(x);
    for (const v of xMajor) axes.appendChild(tick(lab(v), fx(v), pad.t + ih + 14, 'middle'));
  }
  if (opts.yLabels !== false) {
    const lab = defaultLabel(y);
    for (const v of yMajor) axes.appendChild(tick(lab(v), pad.l - 7, fy(v) + 3.5, 'end'));
  }
  if (x.title) {
    axes.appendChild(s('text', {
      x: pad.l + iw / 2, y: H - 3, 'text-anchor': 'middle', fill: 'var(--ink-2)',
      'font-family': 'var(--font-mono)', 'font-size': 10, 'letter-spacing': '0.08em', text: x.title,
    }));
  }
  if (y.title) {
    axes.appendChild(s('text', {
      transform: `rotate(-90 11 ${pad.t + ih / 2})`, x: 11, y: pad.t + ih / 2,
      'text-anchor': 'middle', fill: 'var(--ink-2)',
      'font-family': 'var(--font-mono)', 'font-size': 10, 'letter-spacing': '0.08em', text: y.title,
    }));
  }

  const api = {
    root, X: fx, Y: fy, invX, invY, pad, iw, ih, W, H, xr: x, yr: y,
    layer: data, gridLayer: grid, axesLayer: axes,

    clear() { while (data.firstChild) data.removeChild(data.firstChild); },

    /** A polyline you can re-point every frame. */
    path({ color = 'var(--ink)', width = 1.9, dash = null, opacity = 1, fill = null, cap = 'round' } = {}) {
      const el = s('path', {
        fill: fill || 'none', stroke: fill ? 'none' : color, 'stroke-width': fill ? 0 : width,
        'stroke-linejoin': 'round', 'stroke-linecap': cap, 'stroke-dasharray': dash, opacity,
      });
      data.appendChild(el);
      const clip = (v) => Math.max(pad.t - 40, Math.min(pad.t + ih + 40, v));
      return {
        el,
        show(on) { el.style.display = on ? '' : 'none'; },
        setColor(c) { el.setAttribute(fill ? 'fill' : 'stroke', c); },
        set(xs, ys) {
          const n = Math.min(xs.length, ys.length);
          if (!n) { el.setAttribute('d', ''); return; }
          let d = '';
          for (let i = 0; i < n; i++) d += (i ? 'L' : 'M') + fx(xs[i]).toFixed(2) + ' ' + clip(fy(ys[i])).toFixed(2) + ' ';
          el.setAttribute('d', d);
        },
        /** Same, but filled down to a baseline — for shading an overlap. */
        setArea(xs, ys, baseline = 0) {
          const n = Math.min(xs.length, ys.length);
          if (!n) { el.setAttribute('d', ''); return; }
          let d = 'M' + fx(xs[0]).toFixed(2) + ' ' + fy(baseline).toFixed(2) + ' ';
          for (let i = 0; i < n; i++) d += 'L' + fx(xs[i]).toFixed(2) + ' ' + clip(fy(ys[i])).toFixed(2) + ' ';
          d += 'L' + fx(xs[n - 1]).toFixed(2) + ' ' + fy(baseline).toFixed(2) + ' Z';
          el.setAttribute('d', d);
        },
      };
    },

    /** Spectral lines: a stem with a dot on top. The Fourier idiom. */
    stems({ color = 'var(--tone)', width = 2, dot = 3, baseline = 0 } = {}) {
      const g = s('g');
      data.appendChild(g);
      return {
        el: g,
        set(xs, ys) {
          while (g.firstChild) g.removeChild(g.firstChild);
          for (let i = 0; i < xs.length; i++) {
            if (xs[i] < x.min || xs[i] > x.max) continue;
            const px = fx(xs[i]);
            g.appendChild(s('line', {
              x1: px, x2: px, y1: fy(baseline), y2: fy(ys[i]),
              stroke: color, 'stroke-width': width, 'stroke-linecap': 'butt',
            }));
            if (dot) g.appendChild(s('circle', { cx: px, cy: fy(ys[i]), r: dot, fill: color }));
          }
        },
      };
    },

    /** The textbook delta arrow: height means area, not amplitude. */
    impulse(vx, area, { color = 'var(--in)', label = null, height = null } = {}) {
      const g = s('g');
      const top = height ?? (area >= 0 ? y.max * 0.8 : y.min * 0.8);
      const px = fx(vx);
      g.appendChild(s('line', {
        x1: px, x2: px, y1: fy(0), y2: fy(top), stroke: color, 'stroke-width': 2.2,
      }));
      g.appendChild(s('path', {
        d: `M${px} ${fy(top)} l -4.5 ${area >= 0 ? 8 : -8} l 9 0 Z`, fill: color,
      }));
      if (label) {
        g.appendChild(s('text', {
          x: px + 7, y: fy(top) + 4, fill: color, 'font-family': 'var(--font-mono)',
          'font-size': 10, text: label,
        }));
      }
      data.appendChild(g);
      return { el: g, show(on) { g.style.display = on ? '' : 'none'; } };
    },

    dot(vx, vy, { color = 'var(--ink)', r = 4, stroke = null } = {}) {
      const el = s('circle', {
        cx: fx(vx), cy: fy(vy), r, fill: color,
        stroke: stroke, 'stroke-width': stroke ? 1.5 : null,
      });
      data.appendChild(el);
      return {
        el,
        move(nx, ny) { el.setAttribute('cx', fx(nx)); el.setAttribute('cy', fy(ny)); },
        show(on) { el.style.display = on ? '' : 'none'; },
        setColor(c) { el.setAttribute('fill', c); },
      };
    },

    /** Small filled dots at every sample — the sampling idiom. */
    dots({ color = 'var(--out)', r = 2.6 } = {}) {
      const g = s('g');
      data.appendChild(g);
      return {
        el: g,
        set(xs, ys) {
          while (g.firstChild) g.removeChild(g.firstChild);
          for (let i = 0; i < xs.length; i++) {
            if (xs[i] < x.min || xs[i] > x.max) continue;
            g.appendChild(s('circle', { cx: fx(xs[i]), cy: fy(ys[i]), r, fill: color }));
          }
        },
      };
    },

    vline(v, { color = 'var(--ink-3)', dash = null, width = 1, label = null } = {}) {
      const g = s('g');
      const line = s('line', {
        x1: fx(v), x2: fx(v), y1: pad.t, y2: pad.t + ih,
        stroke: color, 'stroke-width': width, 'stroke-dasharray': dash,
      });
      g.appendChild(line);
      let txt = null;
      // a label near the right edge is placed on the other side of the
      // line, so it never runs off the plot
      const place = (px) => (px > pad.l + iw * 0.66
        ? { x: px - 4, anchor: 'end' } : { x: px + 4, anchor: 'start' });
      if (label) {
        const p = place(fx(v));
        txt = s('text', {
          x: p.x, y: pad.t + 11, 'text-anchor': p.anchor, fill: color,
          'font-family': 'var(--font-mono)', 'font-size': 10, text: label,
        });
        g.appendChild(txt);
      }
      data.appendChild(g);
      return {
        el: g,
        move(nv, newLabel) {
          line.setAttribute('x1', fx(nv)); line.setAttribute('x2', fx(nv));
          if (txt) {
            const p = place(fx(nv));
            txt.setAttribute('x', p.x); txt.setAttribute('text-anchor', p.anchor);
            if (newLabel !== undefined) txt.textContent = newLabel;
          }
        },
        show(on) { g.style.display = on ? '' : 'none'; },
      };
    },

    hline(v, { color = 'var(--ink-3)', dash = '4 4', width = 1, label = null } = {}) {
      const g = s('g');
      const line = s('line', {
        x1: pad.l, x2: pad.l + iw, y1: fy(v), y2: fy(v),
        stroke: color, 'stroke-width': width, 'stroke-dasharray': dash,
      });
      g.appendChild(line);
      let txt = null;
      if (label) {
        txt = s('text', {
          x: pad.l + iw - 4, y: fy(v) - 4, 'text-anchor': 'end', fill: color,
          'font-family': 'var(--font-mono)', 'font-size': 10, text: label,
        });
        g.appendChild(txt);
      }
      data.appendChild(g);
      return {
        el: g,
        move(nv, newLabel) {
          line.setAttribute('y1', fy(nv)); line.setAttribute('y2', fy(nv));
          if (txt) { txt.setAttribute('y', fy(nv) - 4); if (newLabel !== undefined) txt.textContent = newLabel; }
        },
        show(on) { g.style.display = on ? '' : 'none'; },
      };
    },

    /** Shade a vertical band — a passband, an overlap, a sample interval. */
    band(x0, x1, { color = 'var(--in-wash)' } = {}) {
      const el = s('rect', {
        x: fx(x0), y: pad.t, width: Math.max(0, fx(x1) - fx(x0)), height: ih, fill: color,
      });
      data.insertBefore(el, data.firstChild);
      return {
        el,
        set(a, b) { el.setAttribute('x', fx(a)); el.setAttribute('width', Math.max(0, fx(b) - fx(a))); },
        show(on) { el.style.display = on ? '' : 'none'; },
      };
    },

    text(vx, vy, str, { color = 'var(--ink-2)', anchor = 'start', size = 10, dy = 0, dx = 0, weight = 400, family = 'var(--font-mono)' } = {}) {
      const el = s('text', {
        x: fx(vx) + dx, y: fy(vy) + dy, 'text-anchor': anchor, fill: color,
        'font-family': family, 'font-size': size, 'font-weight': weight, text: str,
      });
      data.appendChild(el);
      return {
        el,
        set(t) { el.textContent = t; },
        move(nx, ny) { el.setAttribute('x', fx(nx) + dx); el.setAttribute('y', fy(ny) + dy); },
        setColor(c) { el.setAttribute('fill', c); },
        show(on) { el.style.display = on ? '' : 'none'; },
      };
    },

    /** A line segment in data coordinates — phasor arms, construction lines. */
    line(x0, y0, x1, y1, { color = 'var(--ink-2)', width = 1.5, dash = null, arrow = false } = {}) {
      const g = s('g');
      const el = s('line', {
        x1: fx(x0), y1: fy(y0), x2: fx(x1), y2: fy(y1),
        stroke: color, 'stroke-width': width, 'stroke-dasharray': dash, 'stroke-linecap': 'round',
      });
      g.appendChild(el);
      const head = arrow ? s('path', { fill: color }) : null;
      if (head) g.appendChild(head);
      const drawHead = (ax, ay, bx, by) => {
        const a = Math.atan2(fy(by) - fy(ay), fx(bx) - fx(ax));
        const px = fx(bx), py = fy(by), L = 8, wdt = 3.6;
        head.setAttribute('d',
          `M${px} ${py} L${px - L * Math.cos(a) - wdt * Math.sin(a)} ${py - L * Math.sin(a) + wdt * Math.cos(a)} ` +
          `L${px - L * Math.cos(a) + wdt * Math.sin(a)} ${py - L * Math.sin(a) - wdt * Math.cos(a)} Z`);
      };
      if (head) drawHead(x0, y0, x1, y1);
      data.appendChild(g);
      return {
        el: g,
        set(ax, ay, bx, by) {
          el.setAttribute('x1', fx(ax)); el.setAttribute('y1', fy(ay));
          el.setAttribute('x2', fx(bx)); el.setAttribute('y2', fy(by));
          if (head) drawHead(ax, ay, bx, by);
        },
        show(on) { g.style.display = on ? '' : 'none'; },
      };
    },

    /** Axes drawn through the origin — the s-plane and the phasor circle. */
    crosshair({ color = 'var(--grid-major)', width = 1.2 } = {}) {
      const g = s('g');
      g.appendChild(s('line', { x1: pad.l, x2: pad.l + iw, y1: fy(0), y2: fy(0), stroke: color, 'stroke-width': width }));
      g.appendChild(s('line', { x1: fx(0), x2: fx(0), y1: pad.t, y2: pad.t + ih, stroke: color, 'stroke-width': width }));
      axes.appendChild(g);
      return g;
    },
  };
  return api;
}

/** A pole is an ×; a zero is an ○. Every control text ever printed agrees. */
export function poleGlyph(cx, cy, { color = 'var(--sys)', r = 6, width = 2.2 } = {}) {
  const g = s('g');
  g.appendChild(s('line', { x1: cx - r, y1: cy - r, x2: cx + r, y2: cy + r, stroke: color, 'stroke-width': width, 'stroke-linecap': 'round' }));
  g.appendChild(s('line', { x1: cx - r, y1: cy + r, x2: cx + r, y2: cy - r, stroke: color, 'stroke-width': width, 'stroke-linecap': 'round' }));
  return g;
}

export function zeroGlyph(cx, cy, { color = 'var(--sys)', r = 6, width = 2.2 } = {}) {
  return s('circle', { cx, cy, r, fill: 'none', stroke: color, 'stroke-width': width });
}

/**
 * A block-diagram box with a label. Signal flows left to right, which is
 * the one convention this subject never breaks.
 */
export function block(x, y, w, hgt, label, { color = 'var(--sys)', sub = null } = {}) {
  const g = s('g');
  g.appendChild(s('rect', { x, y, width: w, height: hgt, fill: 'var(--vellum)', stroke: color, 'stroke-width': 1.6, rx: 2 }));
  g.appendChild(s('text', {
    x: x + w / 2, y: y + hgt / 2 + (sub ? -1 : 4), 'text-anchor': 'middle',
    fill: 'var(--ink)', 'font-family': 'var(--font-mono)', 'font-size': 13, text: label,
  }));
  if (sub) {
    g.appendChild(s('text', {
      x: x + w / 2, y: y + hgt / 2 + 13, 'text-anchor': 'middle',
      fill: 'var(--ink-3)', 'font-family': 'var(--font-mono)', 'font-size': 9, text: sub,
    }));
  }
  return g;
}

/** An arrow between two points, for block diagrams. */
export function arrow(x1, y1, x2, y2, { color = 'var(--ink-2)', width = 1.5, label = null, dash = null } = {}) {
  const g = s('g');
  const a = Math.atan2(y2 - y1, x2 - x1);
  const L = 8, wd = 3.4;
  g.appendChild(s('line', { x1, y1, x2: x2 - 6 * Math.cos(a), y2: y2 - 6 * Math.sin(a), stroke: color, 'stroke-width': width, 'stroke-dasharray': dash }));
  g.appendChild(s('path', {
    d: `M${x2} ${y2} L${x2 - L * Math.cos(a) - wd * Math.sin(a)} ${y2 - L * Math.sin(a) + wd * Math.cos(a)} ` +
       `L${x2 - L * Math.cos(a) + wd * Math.sin(a)} ${y2 - L * Math.sin(a) - wd * Math.cos(a)} Z`,
    fill: color,
  }));
  if (label) {
    g.appendChild(s('text', {
      x: (x1 + x2) / 2, y: y1 === y2 ? y1 - 6 : (y1 + y2) / 2 - 5, 'text-anchor': 'middle',
      fill: color, 'font-family': 'var(--font-mono)', 'font-size': 11, text: label,
    }));
  }
  return g;
}

/** A summing junction: a circle with signs around it. */
export function summer(cx, cy, { r = 12, signs = ['+', '−'], color = 'var(--ink-2)' } = {}) {
  const g = s('g');
  g.appendChild(s('circle', { cx, cy, r, fill: 'var(--vellum)', stroke: color, 'stroke-width': 1.6 }));
  g.appendChild(s('text', {
    x: cx - r - 5, y: cy - 4, 'text-anchor': 'end', fill: color,
    'font-family': 'var(--font-mono)', 'font-size': 11, text: signs[0],
  }));
  g.appendChild(s('text', {
    x: cx + 3, y: cy + r + 12, 'text-anchor': 'middle', fill: color,
    'font-family': 'var(--font-mono)', 'font-size': 11, text: signs[1],
  }));
  return g;
}

/** A free-standing label inside an SVG, positioned in viewBox units. */
export function note(x, y, text, { color = 'var(--ink-2)', size = 10, anchor = 'start', weight = 400 } = {}) {
  return s('text', {
    x, y, 'text-anchor': anchor, fill: color, 'font-family': 'var(--font-mono)',
    'font-size': size, 'font-weight': weight, text,
  });
}
