/* ==========================================================================
   figure.js — the drawing plate, and the animation loop behind it.

   Every figure in the document is a numbered plate with a title block. This
   module builds that frame so no figure has to, and enforces the two rules
   that are easy to forget: an aria-label describing what the drawing shows,
   and a visible pause control on anything that moves.
   ========================================================================== */

import { el, motionToggle, reducedMotion } from "./dom.js";
import { tex } from "./tex.js";

/* --- registry --------------------------------------------------------------
   Content files carry `<div data-figure="unitCircle"></div>`. Figure modules
   register a builder under that name. app.js connects the two.
   -------------------------------------------------------------------------- */

const registry = new Map();

export function register(name, spec) { registry.set(name, spec); }
export function getFigure(name) { return registry.get(name); }

/**
 * Build the plate frame.
 *
 * @param {object} o
 * @param {number|string} o.no       plate number, sequential across the guide
 * @param {string} o.title           short title for the title block
 * @param {"interactive"|"reference"} o.tag
 * @param {string} o.label           aria-label: what the drawing shows
 * @param {Node|Node[]} o.stage      the drawing itself
 * @param {Node} [o.controls]        the knob row
 * @param {Node} [o.readouts]        the readout row
 * @param {string} [o.caption]       HTML. Must add an insight, not restate.
 */
export function plate({ no, title, tag = "reference", label = "", stage, controls, readouts, caption, formula = false, prefix = "Plate" }) {
  const body = el(`div.plate${formula ? ".formula" : ""}`, null,
    el("div.plate-stage", { role: label ? "group" : null, "aria-label": label || null },
      Array.isArray(stage) ? stage : [stage]),
    controls || null,
    readouts || null,
    el("div.titleblock", null,
      el("div.cell.no", { text: `${prefix} ${no}` }),
      el("div.cell.ttl", { text: title }),
      el("div.cell.tag", null, el(`span.stamp.${tag}`, { text: tagLabel(tag) })),
    )
  );
  const fig = el("figure", { style: { margin: "0" } }, body);
  if (caption) {
    fig.appendChild(el("figcaption.caption", { html: `<b>${prefix} ${no}.</b> ${caption}` }));
  }
  return fig;
}

const TAG_TEXT = {
  interactive: "Interactive",
  reference: "Reference",
  handbook: "Handbook",
  know: "Know cold",
};
const tagLabel = (t) => TAG_TEXT[t] || t;

/**
 * A formula plate: the thing the reader must carry away, stamped with
 * whether the exam hands it to them.
 *
 * items: [{ tex, gloss, name }]
 * stamp: "handbook" | "know"
 */
export function formulaPlate({ no, title, stamp = "handbook", items, caption, prefix = "Form" }) {
  const list = el("div.formula-list", null,
    items.map(({ tex: src, gloss, name }) =>
      el("div.item", null,
        name
          ? el("div.named", null,
              el("div", { html: `<span class="math display"><span class="mrow">${stripWrap(tex(src))}</span></span>` }),
              el("div.tag", { text: name }))
          : el("div", { html: displayify(src) }),
        gloss ? el("p.gloss", { html: gloss }) : null
      )
    )
  );
  return plate({
    no, title, tag: stamp, formula: true, stage: list, caption, prefix,
    label: `Formula plate: ${title}`,
  });
}

/**
 * Content files declare formula plates in a compact form so the formulas stay
 * in the prose file that demands them:
 *
 *   <f-plate no="1.1" title="Laws of exponents" stamp="handbook"
 *            caption="…optional…">
 *     <f-row tex="a^m a^n = a^{m+n}" gloss="…" name="…optional…"></f-row>
 *   </f-plate>
 *
 * Unknown element names are legal HTML, so the fallback text inside each row
 * still reads if this never runs.
 */
export function mountFormulas(root) {
  root.querySelectorAll("f-plate").forEach((node) => {
    const items = Array.from(node.querySelectorAll("f-row")).map((r) => ({
      tex: r.getAttribute("tex"),
      gloss: r.getAttribute("gloss") || "",
      name: r.getAttribute("name") || "",
    })).filter((i) => i.tex);
    if (!items.length) { node.remove(); return; }
    try {
      node.replaceWith(formulaPlate({
        no: node.getAttribute("no") || "",
        title: node.getAttribute("title") || "",
        stamp: node.getAttribute("stamp") || "handbook",
        caption: node.getAttribute("caption") || "",
        prefix: node.getAttribute("prefix") || "Form",
        items,
      }));
    } catch (err) {
      console.error("formula plate failed", err);
      node.remove();
    }
  });
}

/* tex() returns an already-wrapped .math span; for display we re-wrap it. */
function stripWrap(html) {
  const m = /^<span class="math"[^>]*>([\s\S]*)<\/span>$/.exec(html);
  return m ? m[1] : html;
}
function displayify(src) {
  const html = tex(src);
  const label = /aria-label="([^"]*)"/.exec(html)?.[1] || "";
  return `<span class="math display" role="math" aria-label="${label}"><span class="mrow">${stripWrap(html)}</span></span>`;
}

/* ==========================================================================
   Animation
   ========================================================================== */

/**
 * A requestAnimationFrame loop with a pause control, reduced-motion respect,
 * and automatic suspension when the plate scrolls out of view. `tick(dt, t)`
 * receives seconds elapsed since the previous frame and total run time.
 */
export function loop(tick, { autoplay = true, node = null } = {}) {
  const reduced = reducedMotion();
  let playing = autoplay && !reduced;
  let raf = null, last = 0, total = 0, visible = true;

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (!playing || !visible) return;
    total += dt;
    tick(dt, total);
  };

  const api = {
    get playing() { return playing; },
    set(p) { playing = p; if (p) last = 0; toggle.set(p); },
    stop() { if (raf) cancelAnimationFrame(raf); raf = null; },
    reset() { total = 0; last = 0; },
  };

  const toggle = motionToggle({ playing, onToggle: (p) => { playing = p; if (p) last = 0; } });
  api.control = toggle.root;

  if (node && "IntersectionObserver" in window) {
    new IntersectionObserver(
      ([e]) => { visible = e.isIntersecting; if (visible) last = 0; },
      { threshold: 0.01 }
    ).observe(node);
  }

  raf = requestAnimationFrame(frame);
  if (reduced) {
    tick(0, 0);                       // draw one honest static frame
    api.control.appendChild(el("span", { text: "motion off", style: { marginLeft: "6px" } }));
  }
  return api;
}

/* ==========================================================================
   Mounting
   ========================================================================== */

/** Replace every `<div data-figure="name">` inside root with its plate. */
export function mountFigures(root, teardowns) {
  root.querySelectorAll("[data-figure]").forEach((slot) => {
    const name = slot.getAttribute("data-figure");
    const spec = registry.get(name);
    if (!spec) {
      console.warn(`figure "${name}" is referenced but not registered`);
      slot.replaceWith(el("div.noscript-note", {
        text: `Plate missing: ${name}. The prose above stands on its own.`,
      }));
      return;
    }
    try {
      const built = spec.build();
      slot.replaceWith(built.node ?? built);
      if (built.destroy) teardowns.push(built.destroy);
    } catch (err) {
      console.error(`figure "${name}" failed to build`, err);
      slot.replaceWith(el("div.noscript-note", {
        text: `Plate ${spec.no ?? ""} could not be drawn in this browser. The prose above stands on its own.`,
      }));
    }
  });
}
