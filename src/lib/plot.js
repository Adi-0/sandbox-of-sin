/*
 * Plotting primitives for the instrument panels.
 * Grids, ticks and scales are generated from data, never hand-authored.
 * Every colour is a CSS custom property so dark mode comes free.
 */

import { s, fmt } from './dom.js';

function ticksFor(axis) {
  if (axis.ticks) return axis.ticks;
  const step = axis.step || (axis.max - axis.min) / 5;
  const out = [];
  // accumulate in integer multiples to avoid floating-point drift
  for (let i = 0; axis.min + i * step <= axis.max + step * 1e-6; i++) {
    out.push(Number((axis.min + i * step).toPrecision(12)));
  }
  return out;
}

/**
 * scope(svg, {w,h,pad,x,y,xTitle,yTitle,frame})
 * Returns scale functions plus helpers that append into a data layer,
 * so `clear()` wipes the drawing without touching the graticule.
 */
export function scope(root, opts = {}) {
  const W = opts.w ?? 720;
  const H = opts.h ?? 240;
  const pad = { l: 54, r: 16, t: 14, b: 32, ...(opts.pad || {}) };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const x = { min: 0, max: 1, ...(opts.x || {}) };
  const y = { min: 0, max: 1, ...(opts.y || {}) };

  root.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const X = (v) => pad.l + ((v - x.min) / (x.max - x.min)) * iw;
  const Y = (v) => pad.t + ih - ((v - y.min) / (y.max - y.min)) * ih;

  const grid = s('g', { 'stroke-width': 1, fill: 'none' });
  const axes = s('g');
  const data = s('g');
  root.append(grid, axes, data);

  // graticule
  for (const tv of ticksFor(x)) {
    grid.appendChild(s('line', {
      x1: X(tv), x2: X(tv), y1: pad.t, y2: pad.t + ih, stroke: 'var(--grid)',
    }));
  }
  for (const tv of ticksFor(y)) {
    grid.appendChild(s('line', {
      x1: pad.l, x2: pad.l + iw, y1: Y(tv), y2: Y(tv), stroke: 'var(--grid)',
    }));
  }
  if (opts.frame !== false) {
    grid.appendChild(s('rect', {
      x: pad.l, y: pad.t, width: iw, height: ih,
      stroke: 'var(--grid-major)', fill: 'none',
    }));
  }

  // tick labels
  const lab = (t, xx, yy, anchor) => s('text', {
    x: xx, y: yy, 'text-anchor': anchor, fill: 'var(--ink-3)',
    'font-family': 'var(--font-mono)', 'font-size': 10, text: t,
  });
  if (opts.xLabels !== false) {
    for (const tv of ticksFor(x)) {
      axes.appendChild(lab(fmt(tv, x.decimals ?? 0), X(tv), pad.t + ih + 14, 'middle'));
    }
  }
  if (opts.yLabels !== false) {
    for (const tv of ticksFor(y)) {
      axes.appendChild(lab(fmt(tv, y.decimals ?? 0), pad.l - 7, Y(tv) + 3.5, 'end'));
    }
  }
  if (x.title) {
    axes.appendChild(s('text', {
      x: pad.l + iw / 2, y: H - 3, 'text-anchor': 'middle', fill: 'var(--ink-2)',
      'font-family': 'var(--font-mono)', 'font-size': 10,
      'letter-spacing': '0.08em', text: x.title,
    }));
  }
  if (y.title) {
    axes.appendChild(s('text', {
      transform: `rotate(-90 12 ${pad.t + ih / 2})`,
      x: 12, y: pad.t + ih / 2, 'text-anchor': 'middle', fill: 'var(--ink-2)',
      'font-family': 'var(--font-mono)', 'font-size': 10,
      'letter-spacing': '0.08em', text: y.title,
    }));
  }

  const api = {
    root, X, Y, pad, iw, ih, W, H, xr: x, yr: y,
    layer: data,
    clear() { while (data.firstChild) data.removeChild(data.firstChild); },

    /** A polyline you can re-point every frame. */
    path({ color = 'var(--ink)', width = 1.75, dash = null, fill = null, opacity = 1 } = {}) {
      const el = s('path', {
        fill: fill || 'none', stroke: fill ? 'none' : color, 'stroke-width': width,
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
        'stroke-dasharray': dash, opacity,
      });
      data.appendChild(el);
      return {
        el,
        set(xs, ys) {
          if (!xs.length) { el.setAttribute('d', ''); return; }
          let d = '';
          for (let i = 0; i < xs.length; i++) {
            d += (i ? 'L' : 'M') + fmt(X(xs[i]), 2) + ' ' + fmt(Y(ys[i]), 2) + ' ';
          }
          el.setAttribute('d', d);
        },
        setArea(xs, ys, baseline = y.min) {
          if (!xs.length) { el.setAttribute('d', ''); return; }
          let d = 'M' + fmt(X(xs[0]), 2) + ' ' + fmt(Y(baseline), 2) + ' ';
          for (let i = 0; i < xs.length; i++) {
            d += 'L' + fmt(X(xs[i]), 2) + ' ' + fmt(Y(ys[i]), 2) + ' ';
          }
          d += 'L' + fmt(X(xs[xs.length - 1]), 2) + ' ' + fmt(Y(baseline), 2) + ' Z';
          el.setAttribute('d', d);
        },
      };
    },

    hline(v, { color = 'var(--ink-3)', dash = '4 4', label = null, width = 1 } = {}) {
      const g = s('g');
      const line = s('line', {
        x1: pad.l, x2: pad.l + iw, y1: Y(v), y2: Y(v),
        stroke: color, 'stroke-width': width, 'stroke-dasharray': dash,
      });
      g.appendChild(line);
      let txt = null;
      if (label) {
        txt = s('text', {
          x: pad.l + iw - 4, y: Y(v) - 4, 'text-anchor': 'end', fill: color,
          'font-family': 'var(--font-mono)', 'font-size': 10, text: label,
        });
        g.appendChild(txt);
      }
      data.appendChild(g);
      return {
        el: g,
        /** Move the rule and its label together. */
        move(nv, newLabel) {
          line.setAttribute('y1', Y(nv));
          line.setAttribute('y2', Y(nv));
          if (txt) {
            txt.setAttribute('y', Y(nv) - 4);
            if (newLabel !== undefined) txt.textContent = newLabel;
          }
        },
        show(on) { g.style.display = on ? '' : 'none'; },
      };
    },

    vline(v, { color = 'var(--ink-3)', dash = null, width = 1, y0 = y.min, y1 = y.max } = {}) {
      const el = s('line', {
        x1: X(v), x2: X(v), y1: Y(y0), y2: Y(y1),
        stroke: color, 'stroke-width': width, 'stroke-dasharray': dash,
      });
      data.appendChild(el);
      return { el, move(nv) { el.setAttribute('x1', X(nv)); el.setAttribute('x2', X(nv)); } };
    },

    dot(vx, vy, { color = 'var(--ink)', r = 4 } = {}) {
      const el = s('circle', { cx: X(vx), cy: Y(vy), r, fill: color });
      data.appendChild(el);
      return { el, move(nx, ny) { el.setAttribute('cx', X(nx)); el.setAttribute('cy', Y(ny)); } };
    },

    text(vx, vy, str, { color = 'var(--ink-2)', anchor = 'start', size = 10, dy = 0, weight = 400 } = {}) {
      const el = s('text', {
        x: X(vx), y: Y(vy) + dy, 'text-anchor': anchor, fill: color,
        'font-family': 'var(--font-mono)', 'font-size': size,
        'font-weight': weight, text: str,
      });
      data.appendChild(el);
      return { el, set(t) { el.textContent = t; }, move(nx, ny) { el.setAttribute('x', X(nx)); el.setAttribute('y', Y(ny) + dy); } };
    },

    /** Vertical spike marks on a row — the raster idiom. */
    raster(rowY, { color = 'var(--spike)', height = 9, width = 1.8 } = {}) {
      const g = s('g', { stroke: color, 'stroke-width': width, 'stroke-linecap': 'round' });
      data.appendChild(g);
      return {
        el: g,
        set(times) {
          while (g.firstChild) g.removeChild(g.firstChild);
          for (const t of times) {
            if (t < x.min || t > x.max) continue;
            g.appendChild(s('line', {
              x1: X(t), x2: X(t), y1: Y(rowY) - height / 2, y2: Y(rowY) + height / 2,
            }));
          }
        },
      };
    },

    /** Shade a band between two x values. */
    band(x0, x1, { color = 'var(--exc-wash)' } = {}) {
      const el = s('rect', {
        x: X(x0), y: pad.t, width: Math.max(0, X(x1) - X(x0)), height: ih, fill: color,
      });
      data.insertBefore(el, data.firstChild);
      return {
        el,
        set(a, b) { el.setAttribute('x', X(a)); el.setAttribute('width', Math.max(0, X(b) - X(a))); },
      };
    },
  };
  return api;
}

/** A horizontal bar chart of labelled magnitudes, log or linear. */
export function barChart(root, { w = 720, rowH = 34, pad = { l: 132, r: 78, t: 8, b: 8 }, max, log = false }) {
  const rows = [];
  const layer = s('g');
  root.append(layer);
  const iw = w - pad.l - pad.r;
  const scale = (v) => {
    if (!log) return (v / max) * iw;
    const lo = Math.log10(Math.max(v, 1e-3));
    return Math.max(2, ((lo - Math.log10(0.05)) / (Math.log10(max) - Math.log10(0.05))) * iw);
  };
  return {
    add({ label, value, color = 'var(--ink-2)', note = '' }) {
      const i = rows.length;
      const yy = pad.t + i * rowH;
      const g = s('g');
      g.appendChild(s('text', {
        x: pad.l - 10, y: yy + rowH / 2 + 3.5, 'text-anchor': 'end', fill: 'var(--ink-2)',
        'font-family': 'var(--font-mono)', 'font-size': 11, text: label,
      }));
      const bar = s('rect', {
        x: pad.l, y: yy + 7, width: scale(value), height: rowH - 16, fill: color, rx: 1,
      });
      const val = s('text', {
        x: pad.l + scale(value) + 8, y: yy + rowH / 2 + 3.5, fill: 'var(--ink-2)',
        'font-family': 'var(--font-mono)', 'font-size': 11, text: note,
      });
      g.append(bar, val);
      layer.appendChild(g);
      const row = {
        set(v, n) {
          bar.setAttribute('width', scale(v));
          val.setAttribute('x', pad.l + scale(v) + 8);
          if (n !== undefined) val.textContent = n;
        },
        setColor(c) { bar.setAttribute('fill', c); },
      };
      rows.push(row);
      return row;
    },
    height: () => pad.t + rows.length * rowH + pad.b,
    finish() { root.setAttribute('viewBox', `0 0 ${w} ${pad.t + rows.length * rowH + pad.b}`); },
  };
}
