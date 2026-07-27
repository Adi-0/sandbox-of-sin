/* ==========================================================================
   plot.js — SVG drawing in mathematical coordinates.

   A Plot maps user space (the maths) to view space (pixels) and hands back
   drawing primitives. Every colour argument is a CSS variable name from
   tokens.css, never a literal, so figures follow the theme.

   Repetitive geometry — ticks, grids, arrowheads, sampled curves — is
   generated here so no figure ever hand-authors coordinates.
   ========================================================================== */

import { svg } from "./dom.js";
import { num } from "./fmt.js";

const V = (name) => `var(--${name})`;

let arrowSeq = 0;

export class Plot {
  /**
   * @param {object} o
   * @param {number} o.w,o.h        view size in SVG units (the viewBox)
   * @param {number[]} o.xr,o.yr    user-space ranges [min, max]
   * @param {object} o.pad          {l, r, t, b} margins in SVG units
   */
  constructor({ w = 640, h = 400, xr = [-1, 1], yr = [-1, 1], pad = {}, label = "" } = {}) {
    this.w = w; this.h = h;
    this.xr = xr.slice(); this.yr = yr.slice();
    this.pad = { l: 44, r: 16, t: 16, b: 34, ...pad };
    this.root = svg("svg", {
      viewBox: `0 0 ${w} ${h}`,
      role: "img",
      "aria-label": label,
      preserveAspectRatio: "xMidYMid meet",
      style: { display: "block", width: "100%", height: "auto", overflow: "visible" },
    });
    this.defs = svg("defs");
    this.root.appendChild(this.defs);
    this.layers = {};
    for (const name of ["grid", "shade", "axis", "curve", "mark", "label", "hit"]) {
      this.layers[name] = svg("g", { class: `layer-${name}` });
      this.root.appendChild(this.layers[name]);
    }
  }

  /* --- coordinate mapping ------------------------------------------------- */

  get iw() { return this.w - this.pad.l - this.pad.r; }
  get ih() { return this.h - this.pad.t - this.pad.b; }

  x(v) { return this.pad.l + ((v - this.xr[0]) / (this.xr[1] - this.xr[0])) * this.iw; }
  y(v) { return this.pad.t + this.ih - ((v - this.yr[0]) / (this.yr[1] - this.yr[0])) * this.ih; }
  /** view -> user, for dragging */
  ux(px) { return this.xr[0] + ((px - this.pad.l) / this.iw) * (this.xr[1] - this.xr[0]); }
  uy(py) { return this.yr[0] + ((this.pad.t + this.ih - py) / this.ih) * (this.yr[1] - this.yr[0]); }
  /** length of one user unit along each axis, in view units */
  get sx() { return this.iw / (this.xr[1] - this.xr[0]); }
  get sy() { return this.ih / (this.yr[1] - this.yr[0]); }

  add(layer, node) { this.layers[layer].appendChild(node); return node; }
  clear(...names) {
    for (const n of (names.length ? names : Object.keys(this.layers))) {
      const g = this.layers[n];
      while (g.firstChild) g.removeChild(g.firstChild);
    }
    return this;
  }

  /* --- structure ----------------------------------------------------------- */

  /** Faint ruling behind everything. Steps are in user units. */
  grid({ xStep, yStep, color = "grid" } = {}) {
    const g = this.layers.grid;
    if (xStep) for (const v of ticks(this.xr, xStep)) {
      g.appendChild(svg("line", {
        x1: this.x(v), y1: this.pad.t, x2: this.x(v), y2: this.pad.t + this.ih,
        stroke: V(color), strokeWidth: 1,
      }));
    }
    if (yStep) for (const v of ticks(this.yr, yStep)) {
      g.appendChild(svg("line", {
        x1: this.pad.l, y1: this.y(v), x2: this.pad.l + this.iw, y2: this.y(v),
        stroke: V(color), strokeWidth: 1,
      }));
    }
    return this;
  }

  /**
   * Axes through the origin (default) or along the frame edge.
   * `fmt` controls tick text; pass null to suppress labels on that axis.
   */
  axes({
    xStep = 1, yStep = 1, xLabel = "", yLabel = "",
    xFmt = (v) => num(v, 2), yFmt = (v) => num(v, 2),
    origin = true, arrows = true, skipZero = true,
  } = {}) {
    const ax = this.layers.axis;
    const y0 = origin && this.yr[0] < 0 && this.yr[1] > 0 ? this.y(0) : this.pad.t + this.ih;
    const x0 = origin && this.xr[0] < 0 && this.xr[1] > 0 ? this.x(0) : this.pad.l;

    const head = arrows ? this.arrowhead("ink") : null;

    ax.appendChild(svg("line", {
      x1: this.pad.l - 4, y1: y0, x2: this.pad.l + this.iw + (arrows ? 10 : 0), y2: y0,
      stroke: V("ink"), strokeWidth: 1.25, markerEnd: head ? `url(#${head})` : null,
    }));
    ax.appendChild(svg("line", {
      x1: x0, y1: this.pad.t + this.ih + 4, x2: x0, y2: this.pad.t - (arrows ? 10 : 0),
      stroke: V("ink"), strokeWidth: 1.25, markerEnd: head ? `url(#${head})` : null,
    }));

    if (xStep && xFmt) for (const v of ticks(this.xr, xStep)) {
      if (skipZero && Math.abs(v) < 1e-9) continue;
      ax.appendChild(svg("line", {
        x1: this.x(v), y1: y0 - 3, x2: this.x(v), y2: y0 + 3, stroke: V("ink"), strokeWidth: 1,
      }));
      ax.appendChild(svg("text", {
        class: "lbl", x: this.x(v), y: y0 + 15, textAnchor: "middle",
        fill: V("faint"), text: xFmt(v),
      }));
    }
    if (yStep && yFmt) for (const v of ticks(this.yr, yStep)) {
      if (skipZero && Math.abs(v) < 1e-9) continue;
      ax.appendChild(svg("line", {
        x1: x0 - 3, y1: this.y(v), x2: x0 + 3, y2: this.y(v), stroke: V("ink"), strokeWidth: 1,
      }));
      ax.appendChild(svg("text", {
        class: "lbl", x: x0 - 7, y: this.y(v) + 3.5, textAnchor: "end",
        fill: V("faint"), text: yFmt(v),
      }));
    }

    // these two are placed in view space, not data space
    if (xLabel) this.text(this.pad.l + this.iw, y0 - 10, xLabel,
      { anchor: "end", color: "q-x", italic: true, size: 13, view: true, bg: true });
    if (yLabel) this.text(x0 + 10, this.pad.t + 4, yLabel,
      { anchor: "start", color: "q-y", italic: true, size: 13, view: true, bg: true });
    return this;
  }

  /** A reusable arrowhead marker in the given token colour. */
  arrowhead(color = "ink", size = 7) {
    const id = `ah-${color}-${size}-${++arrowSeq}`;
    const m = svg("marker", {
      id, viewBox: "0 0 10 10", refX: 8.5, refY: 5,
      markerWidth: size, markerHeight: size, orient: "auto-start-reverse",
      markerUnits: "userSpaceOnUse",
    }, svg("path", { d: "M 0 1 L 9 5 L 0 9 z", fill: V(color) }));
    this.defs.appendChild(m);
    return id;
  }

  /* --- marks --------------------------------------------------------------- */

  /** Sampled function curve. `fn` may return null/NaN to break the line. */
  curve(fn, { color = "q-x", width = 2, dash = null, samples = 320, layer = "curve", opacity = 1, clamp = true } = {}) {
    const segs = [];
    let cur = [];
    for (let i = 0; i <= samples; i++) {
      const ux = this.xr[0] + (i / samples) * (this.xr[1] - this.xr[0]);
      const uy = fn(ux);
      const ok = Number.isFinite(uy) && (!clamp || (uy >= this.yr[0] - 1e6 && uy <= this.yr[1] + 1e6));
      // break the path where the curve leaves the frame, so asymptotes do not
      // draw a false vertical line across the plot
      const inside = Number.isFinite(uy) && uy >= this.yr[0] && uy <= this.yr[1];
      if (ok && (inside || cur.length)) {
        cur.push([this.x(ux), this.y(Math.max(this.yr[0] - 0.5, Math.min(this.yr[1] + 0.5, uy)))]);
        if (!inside) { segs.push(cur); cur = []; }
      } else if (cur.length) { segs.push(cur); cur = []; }
    }
    if (cur.length) segs.push(cur);
    const d = segs.filter((s) => s.length > 1)
      .map((s) => "M " + s.map(([a, b]) => `${a.toFixed(2)} ${b.toFixed(2)}`).join(" L "))
      .join(" ");
    return this.add(layer, svg("path", {
      d, fill: "none", stroke: V(color), strokeWidth: width, strokeLinecap: "round",
      strokeLinejoin: "round", strokeDasharray: dash, opacity,
    }));
  }

  /** Parametric curve, for circles, ellipses, spirals, phase portraits. */
  param(fn, tr = [0, 1], { color = "q-r", width = 2, dash = null, samples = 240, close = false, fill = null, layer = "curve", opacity = 1 } = {}) {
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const t = tr[0] + (i / samples) * (tr[1] - tr[0]);
      const [ux, uy] = fn(t);
      if (Number.isFinite(ux) && Number.isFinite(uy)) pts.push([this.x(ux), this.y(uy)]);
    }
    if (!pts.length) return null;
    const d = "M " + pts.map(([a, b]) => `${a.toFixed(2)} ${b.toFixed(2)}`).join(" L ") + (close ? " Z" : "");
    return this.add(layer, svg("path", {
      d, fill: fill ? V(fill) : "none", stroke: color ? V(color) : "none",
      strokeWidth: width, strokeDasharray: dash, strokeLinejoin: "round", opacity,
    }));
  }

  /** Filled region between a curve and the axis — the integral, visually. */
  area(fn, a, b, { color = "q-r-soft", stroke = null, baseline = 0, samples = 160, layer = "shade", opacity = 1 } = {}) {
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const ux = a + (i / samples) * (b - a);
      const uy = fn(ux);
      if (Number.isFinite(uy)) pts.push([this.x(ux), this.y(uy)]);
    }
    if (pts.length < 2) return null;
    const d = `M ${this.x(a).toFixed(2)} ${this.y(baseline).toFixed(2)} L ` +
      pts.map(([p, q]) => `${p.toFixed(2)} ${q.toFixed(2)}`).join(" L ") +
      ` L ${this.x(b).toFixed(2)} ${this.y(baseline).toFixed(2)} Z`;
    return this.add(layer, svg("path", {
      d, fill: V(color), stroke: stroke ? V(stroke) : "none", strokeWidth: 1, opacity,
    }));
  }

  /** Straight segment in user coordinates. */
  line(x1, y1, x2, y2, { color = "ink", width = 1.5, dash = null, layer = "curve", opacity = 1, cap = "round" } = {}) {
    return this.add(layer, svg("line", {
      x1: this.x(x1), y1: this.y(y1), x2: this.x(x2), y2: this.y(y2),
      stroke: V(color), strokeWidth: width, strokeDasharray: dash,
      strokeLinecap: cap, opacity,
    }));
  }

  /** Arrow from (x1,y1) to (x2,y2) — the vector primitive. */
  vector(x1, y1, x2, y2, { color = "q-r", width = 2.25, dash = null, layer = "curve", opacity = 1, head = 8 } = {}) {
    const id = this.arrowhead(color, head);
    return this.add(layer, svg("line", {
      x1: this.x(x1), y1: this.y(y1), x2: this.x(x2), y2: this.y(y2),
      stroke: V(color), strokeWidth: width, strokeDasharray: dash,
      markerEnd: `url(#${id})`, opacity,
    }));
  }

  dot(ux, uy, { color = "ink", r = 4.5, ring = true, layer = "mark", opacity = 1 } = {}) {
    const g = svg("g", { opacity });
    if (ring) g.appendChild(svg("circle", { cx: this.x(ux), cy: this.y(uy), r: r + 2.5, fill: V("plate") }));
    g.appendChild(svg("circle", { cx: this.x(ux), cy: this.y(uy), r, fill: V(color) }));
    return this.add(layer, g);
  }

  /** Hollow marker, for "the value you are comparing against". */
  ring(ux, uy, { color = "muted", r = 5, width = 1.75, layer = "mark", dash = null } = {}) {
    return this.add(layer, svg("circle", {
      cx: this.x(ux), cy: this.y(uy), r, fill: "none",
      stroke: V(color), strokeWidth: width, strokeDasharray: dash,
    }));
  }

  polygon(pts, { fill = "q-r-soft", stroke = null, width = 1.5, dash = null, layer = "shade", opacity = 1 } = {}) {
    const d = "M " + pts.map(([a, b]) => `${this.x(a).toFixed(2)} ${this.y(b).toFixed(2)}`).join(" L ") + " Z";
    return this.add(layer, svg("path", {
      d, fill: fill ? V(fill) : "none", stroke: stroke ? V(stroke) : "none",
      strokeWidth: width, strokeDasharray: dash, opacity, strokeLinejoin: "round",
    }));
  }

  /** Angle wedge at a vertex — used everywhere an angle must be *seen*. */
  angleArc(cx, cy, a0, a1, r, { color = "muted", width = 1.25, fill = null, layer = "mark", label = null, labelColor = "muted" } = {}) {
    const pts = [];
    const steps = Math.max(8, Math.round(Math.abs(a1 - a0) * 24));
    for (let i = 0; i <= steps; i++) {
      const t = a0 + (i / steps) * (a1 - a0);
      pts.push([this.x(cx) + r * Math.cos(t), this.y(cy) - r * Math.sin(t)]);
    }
    const g = svg("g", null,
      svg("path", {
        d: (fill ? `M ${this.x(cx)} ${this.y(cy)} L ` : "M ") +
           pts.map(([a, b]) => `${a.toFixed(2)} ${b.toFixed(2)}`).join(" L ") + (fill ? " Z" : ""),
        fill: fill ? V(fill) : "none", stroke: V(color), strokeWidth: width,
      })
    );
    if (label != null) {
      const mid = (a0 + a1) / 2;
      g.appendChild(svg("text", {
        class: "lbl", x: this.x(cx) + (r + 13) * Math.cos(mid), y: this.y(cy) - (r + 13) * Math.sin(mid) + 4,
        textAnchor: "middle", fill: V(labelColor), text: label,
      }));
    }
    return this.add(layer, g);
  }

  /** The little square that marks a right angle. Small, and worth drawing. */
  rightAngle(cx, cy, dir1, dir2, size = 10, { color = "muted" } = {}) {
    const px = this.x(cx), py = this.y(cy);
    const u = [Math.cos(dir1) * size, -Math.sin(dir1) * size];
    const v = [Math.cos(dir2) * size, -Math.sin(dir2) * size];
    return this.add("mark", svg("path", {
      d: `M ${px + u[0]} ${py + u[1]} L ${px + u[0] + v[0]} ${py + u[1] + v[1]} L ${px + v[0]} ${py + v[1]}`,
      fill: "none", stroke: V(color), strokeWidth: 1.25,
    }));
  }

  /* --- text ---------------------------------------------------------------- */

  text(ux, uy, str, { anchor = "middle", color = "ink", size = 11, dx = 0, dy = 0, italic = false, layer = "label", weight = null, view = false, bg = false } = {}) {
    const px = (view ? ux : this.x(ux)) + dx;
    const py = (view ? uy : this.y(uy)) + dy;
    const t = svg("text", {
      class: italic ? "lbl-it" : "lbl", x: px, y: py, textAnchor: anchor,
      fill: V(color), fontSize: `${size}px`, fontWeight: weight, text: str,
    });
    if (!bg) return this.add(layer, t);
    // a plate-coloured halo so labels stay readable over ruling and curves
    const halo = svg("text", {
      class: italic ? "lbl-it" : "lbl", x: px, y: py, textAnchor: anchor,
      fill: "none", stroke: V("plate"), strokeWidth: 3.5, strokeLinejoin: "round",
      fontSize: `${size}px`, fontWeight: weight, text: str,
    });
    const g = svg("g", null, halo, t);
    return this.add(layer, g);
  }

  /** A label with a leader line back to the thing it names. */
  callout(ux, uy, str, { dx = 24, dy = -18, color = "muted", size = 11, anchor = null } = {}) {
    const x0 = this.x(ux), y0 = this.y(uy);
    this.add("label", svg("line", {
      x1: x0, y1: y0, x2: x0 + dx, y2: y0 + dy,
      stroke: V(color), strokeWidth: 1, opacity: 0.8,
    }));
    this.text(x0 + dx + (dx >= 0 ? 3 : -3), y0 + dy - 3, str, {
      anchor: anchor || (dx >= 0 ? "start" : "end"), color, size, view: true, bg: true,
    });
    return this;
  }

  /* --- misc ---------------------------------------------------------------- */

  /** An invisible rectangle over the plot area to catch pointer events. */
  hitArea() {
    return this.add("hit", svg("rect", {
      x: this.pad.l, y: this.pad.t, width: this.iw, height: this.ih,
      fill: "transparent", style: { cursor: "crosshair" },
    }));
  }

  /** Make one user unit the same size on both axes (circles look like circles). */
  equalize() {
    const kx = this.iw / (this.xr[1] - this.xr[0]);
    const ky = this.ih / (this.yr[1] - this.yr[0]);
    const k = Math.min(kx, ky);
    const cx = (this.xr[0] + this.xr[1]) / 2, cy = (this.yr[0] + this.yr[1]) / 2;
    const halfX = this.iw / (2 * k), halfY = this.ih / (2 * k);
    this.xr = [cx - halfX, cx + halfX];
    this.yr = [cy - halfY, cy + halfY];
    return this;
  }
}

/* --- helpers ---------------------------------------------------------------- */

/** Tick values covering a range at a given step, snapped to multiples of step. */
export function ticks([lo, hi], step) {
  const out = [];
  const start = Math.ceil(lo / step - 1e-9) * step;
  for (let v = start; v <= hi + 1e-9; v += step) out.push(Math.abs(v) < 1e-12 ? 0 : v);
  return out;
}

/** Bar chart on its own tiny axis — used for discrete data and spectra. */
export function bars(plot, data, { color = "q-r", width = 0.6, layer = "curve", labels = false } = {}) {
  const g = svg("g");
  data.forEach(({ x, y, color: c }) => {
    const w = width * plot.sx;
    const y0 = plot.y(0), y1 = plot.y(y);
    g.appendChild(svg("rect", {
      x: plot.x(x) - w / 2, y: Math.min(y0, y1), width: w, height: Math.abs(y1 - y0),
      fill: V(c || color),
    }));
    if (labels) {
      g.appendChild(svg("text", {
        class: "lbl", x: plot.x(x), y: y1 + (y >= 0 ? -5 : 12), textAnchor: "middle",
        fill: V("muted"), text: num(y, 2),
      }));
    }
  });
  return plot.add(layer, g);
}

/** A field of little arrows — direction fields and vector fields. */
export function field(plot, fn, { nx = 15, ny = 11, color = "muted", len = 0.7, normalize = true, opacity = 0.85 } = {}) {
  const g = svg("g", { opacity });
  const head = plot.arrowhead(color, 5);
  const dx = (plot.xr[1] - plot.xr[0]) / (nx + 1);
  const dy = (plot.yr[1] - plot.yr[0]) / (ny + 1);
  const step = Math.min(dx * plot.sx, dy * plot.sy) * len;
  for (let i = 1; i <= nx; i++) {
    for (let k = 1; k <= ny; k++) {
      const ux = plot.xr[0] + i * dx, uy = plot.yr[0] + k * dy;
      const v = fn(ux, uy);
      if (!v || !Number.isFinite(v[0]) || !Number.isFinite(v[1])) continue;
      const mag = Math.hypot(v[0], v[1]) || 1;
      const s = normalize ? step / mag : step;
      const px = plot.x(ux), py = plot.y(uy);
      const ex = px + v[0] * s, ey = py - v[1] * s;
      g.appendChild(svg("line", {
        x1: px - (ex - px) / 2, y1: py - (ey - py) / 2, x2: px + (ex - px) / 2, y2: py + (ey - py) / 2,
        stroke: V(color), strokeWidth: 1.25, markerEnd: `url(#${head})`,
      }));
    }
  }
  return plot.add("grid", g);
}

/** Contour lines of a scalar field, by marching squares on a coarse lattice. */
export function contours(plot, f, levels, { color = "muted", width = 1, dash = null, n = 60, opacity = 0.9 } = {}) {
  const g = svg("g", { opacity });
  const [x0, x1] = plot.xr, [y0, y1] = plot.yr;
  const hx = (x1 - x0) / n, hy = (y1 - y0) / n;
  const grid = [];
  for (let i = 0; i <= n; i++) {
    grid[i] = [];
    for (let k = 0; k <= n; k++) grid[i][k] = f(x0 + i * hx, y0 + k * hy);
  }
  const lerp = (a, b, va, vb, L) => a + ((L - va) / (vb - va)) * (b - a);
  for (const L of levels) {
    const segs = [];
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < n; k++) {
        const ax = x0 + i * hx, ay = y0 + k * hy;
        const bx = ax + hx, by = ay + hy;
        const v = [grid[i][k], grid[i + 1][k], grid[i + 1][k + 1], grid[i][k + 1]];
        const corners = [[ax, ay], [bx, ay], [bx, by], [ax, by]];
        const pts = [];
        for (let e = 0; e < 4; e++) {
          const j = (e + 1) % 4;
          const va = v[e], vb = v[j];
          if ((va < L) !== (vb < L) && Number.isFinite(va) && Number.isFinite(vb)) {
            pts.push([
              lerp(corners[e][0], corners[j][0], va, vb, L),
              lerp(corners[e][1], corners[j][1], va, vb, L),
            ]);
          }
        }
        if (pts.length === 2) segs.push(pts);
      }
    }
    const d = segs.map(([a, b]) =>
      `M ${plot.x(a[0]).toFixed(2)} ${plot.y(a[1]).toFixed(2)} L ${plot.x(b[0]).toFixed(2)} ${plot.y(b[1]).toFixed(2)}`
    ).join(" ");
    if (d) g.appendChild(svg("path", { d, fill: "none", stroke: V(color), strokeWidth: width, strokeDasharray: dash }));
  }
  return plot.add("grid", g);
}
