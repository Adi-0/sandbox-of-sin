/* ==========================================================================
   circuit.js — schematic drawing on a grid.

   Circuit figures are not plots: they are drawings whose parts sit on a
   lattice and whose wires must meet exactly. So this is a separate primitive
   set from plot.js, working in *grid units* rather than data coordinates —
   `r.resistor([4, 2], "h")` puts a resistor two units wide centred on the
   grid point (4, 2), and a wire drawn to that point will meet its lead.

   Colours are token names, as everywhere else. The convention this module
   adds, and holds to:

     q-x   voltage — sources, node potentials, the + / − markings
     q-y   current — arrows along wires, branch currents
     q-r   the answer being computed: an equivalent, a result, a total
     q-bad the trap being pointed at

   Every element returns its own nodes so a figure can restyle or relabel it
   live without rebuilding the drawing.
   ========================================================================== */

import { svg } from "./dom.js";

const V = (n) => `var(--${n})`;
let seq = 0;

export class Schematic {
  /**
   * @param {object} o
   * @param {number} o.w,o.h    size in grid units
   * @param {number} o.unit     pixels per grid unit
   * @param {string} o.label    aria-label — what the circuit shows
   */
  constructor({ w = 20, h = 10, unit = 26, pad = 22, label = "" } = {}) {
    this.u = unit;
    this.pad = pad;
    this.W = w * unit + pad * 2;
    this.H = h * unit + pad * 2;
    this.root = svg("svg", {
      viewBox: `0 0 ${this.W} ${this.H}`,
      role: "img",
      "aria-label": label,
      preserveAspectRatio: "xMidYMid meet",
      style: { display: "block", width: "100%", height: "auto", overflow: "visible" },
    });
    this.defs = svg("defs");
    this.root.appendChild(this.defs);
    this.layers = {};
    for (const n of ["wire", "body", "mark", "label"]) {
      this.layers[n] = svg("g", { class: `sch-${n}` });
      this.root.appendChild(this.layers[n]);
    }
  }

  /** grid -> pixels */
  px(x) { return this.pad + x * this.u; }
  py(y) { return this.pad + y * this.u; }
  add(layer, node) { this.layers[layer].appendChild(node); return node; }

  arrowhead(color, size = 7) {
    const id = `sah-${color}-${++seq}`;
    this.defs.appendChild(svg("marker", {
      id, viewBox: "0 0 10 10", refX: 8.5, refY: 5,
      markerWidth: size, markerHeight: size,
      orient: "auto-start-reverse", markerUnits: "userSpaceOnUse",
    }, svg("path", { d: "M 0 1 L 9 5 L 0 9 z", fill: V(color) })));
    return id;
  }

  /* --- wires ---------------------------------------------------------------- */

  /** A run of connected segments through grid points. */
  wire(points, { color = "ink", width = 1.75, dash = null, layer = "wire" } = {}) {
    const d = "M " + points.map(([x, y]) => `${this.px(x)} ${this.py(y)}`).join(" L ");
    return this.add(layer, svg("path", {
      d, fill: "none", stroke: V(color), strokeWidth: width,
      strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: dash,
    }));
  }

  /** A filled junction dot. Draw one wherever three or more wires meet. */
  node([x, y], { color = "ink", r = 3.5, label = null, at = "ne", labelColor = "muted" } = {}) {
    const g = svg("g");
    g.appendChild(svg("circle", { cx: this.px(x), cy: this.py(y), r, fill: V(color) }));
    this.add("mark", g);
    if (label != null) this.label([x, y], label, { at, color: labelColor, size: 12 });
    return g;
  }

  /** Open terminal — a hollow ring, for the two ends of a port. */
  terminal([x, y], { color = "ink", label = null, at = "e" } = {}) {
    this.add("mark", svg("circle", {
      cx: this.px(x), cy: this.py(y), r: 4,
      fill: V("plate"), stroke: V(color), strokeWidth: 1.75,
    }));
    if (label != null) this.label([x, y], label, { at, color: "muted", size: 12 });
  }

  ground([x, y], { color = "ink" } = {}) {
    const g = svg("g");
    const X = this.px(x), Y = this.py(y);
    g.appendChild(svg("line", { x1: X, y1: Y, x2: X, y2: Y + 8, stroke: V(color), strokeWidth: 1.75 }));
    [11, 7, 3.5].forEach((half, i) => {
      g.appendChild(svg("line", {
        x1: X - half, y1: Y + 8 + i * 4, x2: X + half, y2: Y + 8 + i * 4,
        stroke: V(color), strokeWidth: 1.75, strokeLinecap: "round",
      }));
    });
    return this.add("body", g);
  }

  /* --- two-terminal bodies --------------------------------------------------
     Each occupies 2 grid units along its axis and is centred on the given
     point, so `wire` runs can be drawn straight through the same lattice.
     -------------------------------------------------------------------------- */

  /**
   * Shared frame: leads in from ±1 unit, body drawn in local coordinates.
   * Returns `{ node, label }` — the label node is handed back so a live
   * figure can rewrite a component's value without rebuilding the drawing.
   */
  #body([x, y], dir, draw, { color = "ink", width = 1.75, label, value, at, labelColor } = {}) {
    const X = this.px(x), Y = this.py(y), u = this.u;
    const horiz = dir === "h";
    const g = svg("g", {
      transform: horiz ? `translate(${X} ${Y})` : `translate(${X} ${Y}) rotate(90)`,
    });
    // leads
    g.appendChild(svg("line", { x1: -u, y1: 0, x2: -u * 0.62, y2: 0, stroke: V(color), strokeWidth: width, strokeLinecap: "round" }));
    g.appendChild(svg("line", { x1: u * 0.62, y1: 0, x2: u, y2: 0, stroke: V(color), strokeWidth: width, strokeLinecap: "round" }));
    draw(g, u * 0.62, color, width, horiz ? 0 : 90);
    this.add("body", g);

    let labelNode = null;
    if (label != null || value != null) {
      const side = at || (horiz ? "n" : "e");
      const text = [label, value].filter((v) => v != null).join(" = ");
      labelNode = this.label([x, y], text, {
        at: side, color: labelColor || color, size: 12.5, weight: 500, gap: 16,
      });
    }
    return { node: g, label: labelNode };
  }

  resistor(at, dir = "h", opts = {}) {
    return this.#body(at, dir, (g, half, color, width) => {
      // six-peak zigzag, generated rather than hand-authored
      const n = 6, span = half * 2, step = span / n;
      let d = `M ${-half} 0`;
      for (let i = 0; i < n; i++) {
        d += ` L ${-half + step * (i + 0.5)} ${i % 2 === 0 ? -7 : 7}`;
      }
      d += ` L ${half} 0`;
      g.appendChild(svg("path", {
        d, fill: "none", stroke: V(color), strokeWidth: width,
        strokeLinejoin: "round", strokeLinecap: "round",
      }));
    }, opts);
  }

  /** A generic impedance: the rectangle the handbook uses for a black box. */
  box(at, dir = "h", opts = {}) {
    return this.#body(at, dir, (g, half, color, width) => {
      g.appendChild(svg("rect", {
        x: -half, y: -8, width: half * 2, height: 16, rx: 1,
        fill: V(opts.fill || "plate"), stroke: V(color), strokeWidth: width,
      }));
    }, opts);
  }

  capacitor(at, dir = "h", opts = {}) {
    return this.#body(at, dir, (g, half, color, width) => {
      for (const s of [-3.5, 3.5]) {
        g.appendChild(svg("line", {
          x1: s, y1: -10, x2: s, y2: 10, stroke: V(color), strokeWidth: width + 0.4, strokeLinecap: "round",
        }));
      }
      // the leads stop short of the plates
      g.appendChild(svg("line", { x1: -half, y1: 0, x2: -3.5, y2: 0, stroke: V(color), strokeWidth: width }));
      g.appendChild(svg("line", { x1: 3.5, y1: 0, x2: half, y2: 0, stroke: V(color), strokeWidth: width }));
    }, opts);
  }

  inductor(at, dir = "h", opts = {}) {
    return this.#body(at, dir, (g, half, color, width) => {
      const n = 4, span = half * 2, r = span / (n * 2);
      let d = `M ${-half} 0`;
      for (let i = 0; i < n; i++) {
        const x0 = -half + i * 2 * r;
        d += ` A ${r} ${r} 0 0 1 ${x0 + 2 * r} 0`;
      }
      g.appendChild(svg("path", { d, fill: "none", stroke: V(color), strokeWidth: width, strokeLinecap: "round" }));
    }, opts);
  }

  /**
   * An independent source. `kind` is "dc" (+ / − inside a circle), "ac" (a
   * sine inside a circle), or "i" (a current source: an arrow inside).
   * For dc and ac the + terminal is the one at `dir`-positive end.
   */
  source(at, dir = "v", { kind = "dc", flip = false, ...opts } = {}) {
    return this.#body(at, dir, (g, half, color, width, rot) => {
      g.appendChild(svg("circle", { cx: 0, cy: 0, r: half, fill: V("plate"), stroke: V(color), strokeWidth: width }));
      const sign = flip ? -1 : 1;
      if (kind === "dc") {
        // The terminals lie along the body's own axis — local ∓x — so that a
        // vertical source puts + at the top and − at the bottom. The glyphs
        // are then counter-rotated so they stay upright on the page.
        const t = (s, txt) => {
          const cx = s * half * 0.5;
          return svg("text", {
            x: cx, y: 4.5, textAnchor: "middle",
            class: "lbl", fill: V(color), fontSize: "14px", text: txt,
            transform: rot ? `rotate(${-rot} ${cx} 0)` : null,
          });
        };
        g.appendChild(t(flip ? 1 : -1, "+"));
        g.appendChild(t(flip ? -1 : 1, "−"));
      } else if (kind === "ac") {
        let d = "M -8 0";
        for (let i = 0; i <= 24; i++) {
          const px = -8 + (i / 24) * 16;
          d += ` L ${px} ${-6 * Math.sin((i / 24) * 2 * Math.PI)}`;
        }
        g.appendChild(svg("path", {
          d, fill: "none", stroke: V(color), strokeWidth: 1.5,
          transform: rot ? `rotate(${-rot})` : null,
        }));
      } else if (kind === "i") {
        const head = this.arrowhead(color, 6);
        g.appendChild(svg("line", {
          x1: 0, y1: sign * half * 0.62, x2: 0, y2: -sign * half * 0.62,
          stroke: V(color), strokeWidth: 1.75, markerEnd: `url(#${head})`,
        }));
      }
    }, { color: "q-x", ...opts });
  }

  /* --- annotation ------------------------------------------------------------ */

  /**
   * A text label placed relative to a grid point. `at` is a compass point,
   * so callers say where the label goes rather than computing offsets.
   */
  label([x, y], text, { at = "n", color = "muted", size = 12, weight = null, gap = 13, bg = true, italic = false } = {}) {
    const dirs = {
      n: [0, -gap], s: [0, gap + 4], e: [gap, 4], w: [-gap, 4],
      ne: [gap * 0.8, -gap * 0.7], nw: [-gap * 0.8, -gap * 0.7],
      se: [gap * 0.8, gap], sw: [-gap * 0.8, gap], c: [0, 4],
    };
    const [dx, dy] = dirs[at] || dirs.n;
    const anchor = at.includes("e") ? "start" : at.includes("w") ? "end" : "middle";
    const X = this.px(x) + dx, Y = this.py(y) + dy;
    const attrs = {
      class: italic ? "lbl-it" : "lbl", x: X, y: Y, textAnchor: anchor,
      fontSize: `${size}px`, fontWeight: weight, text,
    };
    const g = svg("g");
    if (bg) {
      g.appendChild(svg("text", {
        ...attrs, fill: "none", stroke: V("plate"), strokeWidth: 3.5, strokeLinejoin: "round",
      }));
    }
    g.appendChild(svg("text", { ...attrs, fill: V(color) }));
    return this.add("label", g);
  }

  /** Rewrite a label built above, keeping its position. */
  static setLabel(node, text) {
    for (const t of node.childNodes) t.textContent = text;
    return node;
  }

  /**
   * A current arrow riding on a wire. `dir` is one of n/s/e/w — the direction
   * the current is *assumed* to flow, which is the thing beginners most need
   * drawn rather than described.
   */
  current([x, y], dir = "e", { label = null, color = "q-y", len = 0.7, offset = 12 } = {}) {
    const head = this.arrowhead(color, 7);
    const u = this.u, X = this.px(x), Y = this.py(y);
    const along = { e: [1, 0], w: [-1, 0], n: [0, -1], s: [0, 1] }[dir];
    const perp = along[0] ? [0, -1] : [1, 0];
    const half = (len * u) / 2;
    const ox = perp[0] * offset, oy = perp[1] * offset;

    const g = svg("g");
    g.appendChild(svg("line", {
      x1: X - along[0] * half + ox, y1: Y - along[1] * half + oy,
      x2: X + along[0] * half + ox, y2: Y + along[1] * half + oy,
      stroke: V(color), strokeWidth: 1.75, markerEnd: `url(#${head})`,
    }));
    this.add("mark", g);
    let lab = null;
    if (label != null) {
      // the label sits further out on whichever side the arrow was offset to,
      // so a negative offset moves both of them together
      const side = along[0]
        ? (offset <= 0 ? "n" : "s")
        : (offset >= 0 ? "e" : "w");
      lab = this.label([x, y], label, {
        at: side, color, size: 12, weight: 500,
        gap: Math.abs(offset) + 13,
      });
    }
    return { arrow: g, label: lab };
  }

  /**
   * A voltage marking across an element: + at one end, − at the other, with
   * the name between them. Signs are drawn, not implied, because the passive
   * sign convention is where most wrong answers on this topic begin.
   */
  voltage([x1, y1], [x2, y2], { label = null, color = "q-x", offset = 20, flip = false } = {}) {
    const A = flip ? [x2, y2] : [x1, y1];
    const B = flip ? [x1, y1] : [x2, y2];
    const horiz = Math.abs(x2 - x1) > Math.abs(y2 - y1);
    const perp = horiz ? [0, -1] : [1, 0];
    const put = (pt, sign) => {
      this.add("label", svg("text", {
        class: "lbl", x: this.px(pt[0]) + perp[0] * offset, y: this.py(pt[1]) + perp[1] * offset + 4,
        textAnchor: "middle", fill: V(color), fontSize: "14px", text: sign,
      }));
    };
    put(A, "+");
    put(B, "−");
    let lab = null;
    if (label != null) {
      lab = this.label([(x1 + x2) / 2, (y1 + y2) / 2], label, {
        at: horiz ? "n" : "e", color, size: 12.5, weight: 500,
        gap: offset + (horiz ? 2 : 6),
      });
    }
    return lab;
  }

  /** A dashed outline around part of the drawing, for "look at this bit". */
  highlight([x1, y1], [x2, y2], { color = "q-r", label = null, pad = 0.4 } = {}) {
    const X = this.px(Math.min(x1, x2) - pad), Y = this.py(Math.min(y1, y2) - pad);
    const W = Math.abs(x2 - x1) * this.u + 2 * pad * this.u;
    const H = Math.abs(y2 - y1) * this.u + 2 * pad * this.u;
    const rect = this.add("mark", svg("rect", {
      x: X, y: Y, width: W, height: H, rx: 3,
      fill: V(`${color}-soft`), stroke: V(color), strokeWidth: 1.5, strokeDasharray: "5 4",
    }));
    if (label != null) {
      this.add("label", svg("text", {
        class: "lbl", x: X + W / 2, y: Y - 7, textAnchor: "middle",
        fill: V(color), fontSize: "11.5px", fontWeight: 500, text: label,
      }));
    }
    return rect;
  }
}

/* ==========================================================================
   Solving small resistive networks

   The figures need real numbers, and hand-computed constants in a figure go
   stale the moment a slider moves. These take the same node-analysis route
   the reader is taught, so the drawing and the prose cannot disagree.
   ========================================================================== */

/** Gaussian elimination with partial pivoting. Returns null if singular. */
export function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < 1e-12) return null;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / M[i][i]);
}

export const parallel = (...r) => 1 / r.reduce((s, v) => s + 1 / v, 0);
export const series = (...r) => r.reduce((s, v) => s + v, 0);
