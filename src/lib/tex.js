/* ==========================================================================
   tex.js — a small TeX subset rendered to themed HTML.

   Why not a maths library: this document must run offline from one folder
   with no build step and no external JavaScript, and every glyph must take
   its colour from the design tokens so dark mode is free. A focused parser
   over the ~40 constructs this subject actually needs is smaller than the
   loader for any library that would do it.

   Supported:
     \frac  \dfrac  \sqrt[n]{}  ^  _  \left( \right)
     \int \oint \sum \prod  (with limits)   \lim_{x \to 0}
     \begin{bmatrix|pmatrix|vmatrix|cases} … \end{…}
     \text{} \mathrm{} \vec{} \hat{} \bar{} \overline{} \dot{}
     Greek, relations, operators, the named functions
     \qx{} \qy{} \qr{} \qb{}  — colour by *quantity*, matching tokens.css

   Every rendered formula also carries an aria-label built from the same
   parse, so a screen reader hears "3 over 4", not "3 4".
   ========================================================================== */

/* --- symbol tables --------------------------------------------------------- */

const GREEK = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε",
  zeta: "ζ", eta: "η", theta: "θ", vartheta: "ϑ", iota: "ι", kappa: "κ",
  lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", pi: "π", rho: "ρ", sigma: "σ",
  tau: "τ", upsilon: "υ", phi: "φ", varphi: "φ", chi: "χ", psi: "ψ", omega: "ω",
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π",
  Sigma: "Σ", Upsilon: "Υ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
};

/* Relations and binary operators get generous space on both sides. */
const RELOPS = {
  cdot: "·", times: "×", div: "÷", pm: "±", mp: "∓", ast: "∗",
  le: "≤", leq: "≤", ge: "≥", geq: "≥", ne: "≠", neq: "≠",
  approx: "≈", equiv: "≡", sim: "∼", propto: "∝", cong: "≅",
  to: "→", rightarrow: "→", longrightarrow: "⟶", leftarrow: "←",
  Rightarrow: "⇒", Leftrightarrow: "⇔", mapsto: "↦",
  gg: "≫", ll: "≪", Longrightarrow: "⟹", Longleftrightarrow: "⟺",
  longleftrightarrow: "⟷", leftrightarrow: "↔", Leftarrow: "⇐",
  longleftarrow: "⟵",
  in: "∈", notin: "∉", subset: "⊂", subseteq: "⊆", supset: "⊃",
  cup: "∪", cap: "∩", setminus: "∖", oplus: "⊕", otimes: "⊗",
  land: "∧", lor: "∨", wedge: "∧", vee: "∨", neg: "¬",
  perp: "⊥", parallel: "∥", star: "⋆",
};

/* Standalone symbols, no extra spacing. */
const SYMS = {
  infty: "∞", partial: "∂", nabla: "∇", angle: "∠", degree: "°",
  circ: "∘", prime: "′", dots: "…", ldots: "…", cdots: "⋯", vdots: "⋮",
  forall: "∀", exists: "∃", emptyset: "∅", therefore: "∴", hbar: "ℏ",
  Re: "Re", Im: "Im", ell: "ℓ", aleph: "ℵ", lbrace: "{", rbrace: "}",
  lceil: "⌈", rceil: "⌉", lfloor: "⌊", rfloor: "⌋",
  langle: "⟨", rangle: "⟩", lVert: "‖", rVert: "‖",
};

const FUNCS = new Set([
  "sin", "cos", "tan", "csc", "sec", "cot", "sinh", "cosh", "tanh",
  "arcsin", "arccos", "arctan", "ln", "log", "exp", "max", "min",
  "det", "dim", "gcd", "mod", "lcm", "adj", "tr", "rank", "arg", "deg",
]);

const BIGOPS = { int: "∫", iint: "∬", oint: "∮", sum: "∑", prod: "∏" };
const UNDEROPS = new Set(["lim", "limsup", "liminf", "argmax", "argmin"]);
const ACCENTS = {
  vec: { mark: "→", say: "vector" }, hat: { mark: "^", say: "unit vector" },
  bar: { mark: null, say: "bar" }, overline: { mark: null, say: "bar" },
  dot: { mark: "˙", say: "d d t of" }, tilde: { mark: "~", say: "tilde" },
};
const COLORS = { qx: "qx", qy: "qy", qr: "qr", qb: "qb" };

/* \mathcal{X}, for the handful of letters that are conventionally script. */
const SCRIPT = {
  B: "ℬ", E: "ℰ", F: "ℱ", H: "ℋ", I: "ℐ", L: "ℒ",
  M: "ℳ", R: "ℛ", e: "ℯ", g: "ℊ", o: "ℴ",
};

/* Everything the parser handles by name. An unrecognised command renders as
   *nothing at all*, which is this renderer's worst failure mode: \lceil
   vanishing turns a ceiling into a plain logarithm, \binom turns C(n,r) into
   "nr", and the page looks perfectly fine. `unknownCommands` exists so the
   verification pass can catch that instead of a reader catching it. */
const STRUCTURAL = new Set([
  "frac", "dfrac", "tfrac", "sqrt", "text", "mathrm", "operatorname",
  "mathbf", "boldsymbol", "mathcal", "mathscr", "binom", "dbinom",
  "left", "right", "begin", "end",
  "quad", "qquad", "big", "Big", "bigg", "Bigg",
  "\\", ",", ";", ":", " ", "!", "{", "}", "|", "&", "%", "_", "#", "$",
]);

/** Every TeX command in `src` that this renderer would silently discard. */
export function unknownCommands(src) {
  const known = (v) =>
    v in GREEK || v in RELOPS || v in SYMS || v in BIGOPS || v in ACCENTS ||
    v in COLORS || FUNCS.has(v) || UNDEROPS.has(v) || STRUCTURAL.has(v);
  const out = new Set();
  for (const m of String(src).matchAll(/\\([A-Za-z]+|.)/g))
    if (!known(m[1])) out.add(m[1]);
  return [...out];
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* --- tokenizer ------------------------------------------------------------- */

function lex(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      const m = /^\\([a-zA-Z]+)/.exec(src.slice(i));
      if (m) { out.push({ t: "cmd", v: m[1] }); i += m[0].length; }
      else { out.push({ t: "cmd", v: src[i + 1] }); i += 2; }
    } else if (c === "{" || c === "}" || c === "^" || c === "_" || c === "&") {
      out.push({ t: c }); i++;
    } else if (/\s/.test(c)) {
      // TeX eats whitespace between atoms, but \text{} must keep it, so the
      // token survives here and is discarded by the parser instead
      while (i < src.length && /\s/.test(src[i])) i++;
      out.push({ t: "ws" });
    } else if (/[0-9]/.test(c)) {
      const m = /^[0-9]+(?:\.[0-9]+)?/.exec(src.slice(i));
      out.push({ t: "num", v: m[0] }); i += m[0].length;
    } else {
      out.push({ t: "chr", v: c }); i++;
    }
  }
  return out;
}

/* --- parser ---------------------------------------------------------------- */

const BINCHR = new Set(["+", "=", "<", ">"]);

function parse(tokens) {
  let p = 0;
  const peek = () => tokens[p];
  const eat = () => tokens[p++];

  function parseGroup(stopAt) {
    const items = [];
    while (p < tokens.length) {
      const tk = peek();
      if (tk.t === "ws") { eat(); continue; }
      if (tk.t === "}") break;
      if (stopAt && tk.t === "cmd" && stopAt.includes(tk.v)) break;
      if (tk.t === "&" || (tk.t === "cmd" && tk.v === "\\")) break;
      items.push(parseAtom());
    }
    return { k: "row", items };
  }

  /** Everything up to the matching brace, verbatim, spaces included. */
  function parseTextArg() {
    if (peek()?.t !== "{") return { k: "raw", v: String(eat()?.v ?? "") };
    eat();
    let out = "", depth = 1;
    while (p < tokens.length) {
      const tk = eat();
      if (tk.t === "{") { depth++; out += "{"; continue; }
      if (tk.t === "}") { if (--depth === 0) break; out += "}"; continue; }
      out += tk.t === "ws" ? " " : (tk.v ?? "");
    }
    return { k: "raw", v: out };
  }

  /** A braced argument, a single token, or an empty row. */
  function parseArg() {
    while (peek()?.t === "ws") eat();
    const tk = peek();
    if (!tk) return { k: "row", items: [] };
    if (tk.t === "{") { eat(); const g = parseGroup(); if (peek()?.t === "}") eat(); return g; }
    return parseAtom();
  }

  function parseAtom() {
    let base = parseBase();
    // Primes bind tighter than any script: y'' is a base, then takes scripts.
    let primes = 0;
    while (peek() && peek().t === "chr" && peek().v === "'") { eat(); primes++; }
    if (primes) base = { k: "primed", base, n: primes };

    // scripts may follow in either order
    let sub = null, sup = null;
    while (peek() && (peek().t === "^" || peek().t === "_")) {
      const which = eat().t;
      const arg = parseArg();
      if (which === "^") sup = arg; else sub = arg;
    }
    if (sub || sup) return { k: "script", base, sub, sup };
    return base;
  }

  function parseBase() {
    while (peek()?.t === "ws") eat();
    const tk = eat();
    if (!tk) return { k: "row", items: [] };

    if (tk.t === "{") { const g = parseGroup(); if (peek()?.t === "}") eat(); return g; }
    if (tk.t === "num") return { k: "num", v: tk.v };
    if (tk.t === "chr") {
      const c = tk.v;
      if (/[a-zA-Z]/.test(c)) return { k: "var", v: c };
      if (BINCHR.has(c)) return { k: "op", v: c };
      if (c === "-") return { k: "op", v: "−" };
      if (c === "*") return { k: "op", v: "∗" };
      if (c === "(" || c === ")" || c === "[" || c === "]" || c === "|")
        return { k: "delim", v: c, size: 1 };
      if (c === ",") return { k: "punct", v: "," };
      if (c === "!" ) return { k: "punct", v: "!" };
      return { k: "sym", v: c };
    }

    // commands
    const v = tk.v;
    if (v === "frac" || v === "dfrac" || v === "tfrac")
      return { k: "frac", num: parseArg(), den: parseArg() };
    if (v === "sqrt") {
      let idx = null;
      if (peek()?.t === "chr" && peek().v === "[") {
        eat();
        const items = [];
        while (peek() && !(peek().t === "chr" && peek().v === "]")) items.push(parseAtom());
        if (peek()) eat();
        idx = { k: "row", items };
      }
      return { k: "sqrt", idx, rad: parseArg() };
    }
    if (v in BIGOPS) return { k: "bigop", sym: BIGOPS[v], tall: v !== "sum" && v !== "prod" };
    if (UNDEROPS.has(v)) return { k: "under", name: v };
    if (FUNCS.has(v)) return { k: "fn", v };
    if (v in ACCENTS)
      return { k: "accent", mark: ACCENTS[v].mark, say: ACCENTS[v].say, body: parseArg() };
    if (v in COLORS) return { k: "color", cls: COLORS[v], body: parseArg() };
    if (v === "text" || v === "mathrm" || v === "operatorname")
      return { k: v === "text" ? "text" : "up", body: parseTextArg() };
    /* Script capitals. Unicode has these as single code points with good font
       coverage, which beats faking a calligraphic face — and ℒ is the one
       this subject actually needs. */
    if (v === "mathcal" || v === "mathscr") {
      const arg = parseTextArg();
      return { k: "raw", v: String(arg.v).replace(/[A-Z]/g, (c) => SCRIPT[c] || c) };
    }
    if (v === "mathbf" || v === "boldsymbol")
      return { k: "bf", body: parseArg() };
    if (v === "binom" || v === "dbinom")
      return { k: "binom", top: parseArg(), bot: parseArg() };
    if (v === "!") return { k: "space", w: "neg" };
    if (v === "left" || v === "right") {
      const d = eat();
      const ch = d ? (d.t === "cmd" ? (d.v === "|" ? "|" : SYMS[d.v] || d.v) : d.v) : ".";
      return { k: v === "left" ? "lopen" : "rclose", v: ch === "." ? "" : ch };
    }
    if (v === "begin" || v === "end") {
      // consume {envname}
      let name = "";
      if (peek()?.t === "{") { eat(); while (peek() && peek().t !== "}") name += eat().v ?? ""; if (peek()) eat(); }
      if (v === "end") return { k: "endenv", name };
      return parseEnv(name);
    }
    if (v === "," || v === ";" || v === ":" || v === " ") return { k: "space", w: "sp" };
    if (v === "quad" || v === "qquad") return { k: "space", w: "qd" };
    if (v === "\\") return { k: "newrow" };
    if (v in GREEK) return { k: "sym", v: GREEK[v], italic: /^[a-z]/.test(v) };
    if (v in RELOPS) return { k: "op", v: RELOPS[v], tight: v === "cdot" || v === "times" };
    if (v in SYMS) return { k: "sym", v: SYMS[v] };
    if (v === "{" || v === "}") return { k: "sym", v };
    return { k: "sym", v: "" };                    // unknown: render nothing
  }

  function parseEnv(name) {
    const rows = [[]];
    while (p < tokens.length) {
      const tk = peek();
      if (tk.t === "cmd" && tk.v === "end") { eat(); if (peek()?.t === "{") { eat(); while (peek() && peek().t !== "}") eat(); if (peek()) eat(); } break; }
      if (tk.t === "ws") { eat(); continue; }
      if (tk.t === "&") { eat(); rows[rows.length - 1].push({ k: "row", items: [] }); continue; }
      if (tk.t === "cmd" && tk.v === "\\") { eat(); rows.push([]); continue; }
      const cur = rows[rows.length - 1];
      if (!cur.length) cur.push({ k: "row", items: [] });
      cur[cur.length - 1].items.push(parseAtom());
    }
    return { k: "matrix", name, rows: rows.filter((r) => r.length) };
  }

  // top level: fold \left … \right into delimited nodes
  const row = parseGroup();
  return foldDelims(row);
}

/** Turn the flat \left / \right markers into nested delimited nodes. */
function foldDelims(node) {
  if (!node || typeof node !== "object") return node;
  if (node.k === "row") {
    const out = [];
    const stack = [];
    for (const raw of node.items) {
      const it = foldDelims(raw);
      if (it.k === "lopen") { stack.push({ open: it.v, items: [] }); continue; }

      // `\right)^2` parses as a script wrapping the closer; the exponent
      // belongs to the whole bracketed group, so unwrap and re-apply it.
      const closer = it.k === "rclose" ? it
        : (it.k === "script" && it.base?.k === "rclose") ? it.base : null;

      if (closer) {
        const top = stack.pop();
        let built = top
          ? { k: "delimited", open: top.open, close: closer.v, body: { k: "row", items: top.items } }
          : { k: "sym", v: closer.v };
        if (it !== closer) built = { k: "script", base: built, sub: it.sub, sup: it.sup };
        (stack.length ? stack[stack.length - 1].items : out).push(built);
        continue;
      }
      (stack.length ? stack[stack.length - 1].items : out).push(it);
    }
    while (stack.length) {                       // unbalanced: keep what we have
      const top = stack.pop();
      (stack.length ? stack[stack.length - 1].items : out)
        .push({ k: "delimited", open: top.open, close: "", body: { k: "row", items: top.items } });
    }
    return { k: "row", items: out };
  }
  for (const key of ["num", "den", "rad", "idx", "body", "base", "sub", "sup"]) {
    if (node[key]) node[key] = foldDelims(node[key]);
  }
  if (node.rows) node.rows = node.rows.map((r) => r.map(foldDelims));
  return node;
}

/* --- height, for sizing delimiters ---------------------------------------- */

function height(n) {
  if (!n || typeof n !== "object") return 1;
  switch (n.k) {
    case "row": return Math.max(1, ...n.items.map(height));
    case "raw": return 1;
    case "frac": return 1 + Math.max(height(n.num), height(n.den)) * 0.9;
    case "binom": return 1 + Math.max(height(n.top), height(n.bot)) * 0.9;
    case "bf": return height(n.body);
    case "sqrt": return height(n.rad) * 1.15;
    case "matrix": return Math.max(1.6, n.rows.length * 1.1);
    case "bigop": return 1.6;
    case "delimited": return height(n.body);
    case "script": return height(n.base) + 0.25;
    case "primed": return height(n.base);
    case "color": case "accent": case "up": case "text": return height(n.body);
    default: return 1;
  }
}

/* --- renderer -------------------------------------------------------------- */

/** True for `^\circ` — a degree sign, not an exponent. */
const isDegree = (sup) => {
  const it = sup?.k === "row" ? sup.items[0] : sup;
  return sup && (sup.k !== "row" || sup.items.length === 1) && it?.k === "sym" && it.v === "∘";
};

/** A leading + or − is unary and must not carry full binary spacing. */
function renderRow(items) {
  let prevBinding = true;     // true when the next +/− would be unary
  return items.map((it) => {
    if (it.k === "op" && (it.v === "+" || it.v === "−" || it.v === "±" || it.v === "∓") && prevBinding) {
      prevBinding = true;
      return `<span class="op un">${esc(it.v)}</span>`;
    }
    prevBinding = it.k === "op" || (it.k === "delim" && /[([]/.test(it.v)) ||
                  (it.k === "delimited" && false);
    return render(it);
  }).join("");
}

function render(n) {
  if (!n) return "";
  switch (n.k) {
    case "row":   return renderRow(n.items);
    case "raw":   return esc(n.v);
    case "primed":
      return render(n.base) + `<sup>${"′".repeat(n.n)}</sup>`;
    case "num":   return `<span class="n">${esc(n.v)}</span>`;
    case "var":   return `<i>${esc(n.v)}</i>`;
    case "sym":   return n.italic ? `<i>${esc(n.v)}</i>` : `<span class="n">${esc(n.v)}</span>`;
    case "op":    return `<span class="op${n.tight ? " tight" : ""}">${esc(n.v)}</span>`;
    case "punct": return `<span class="n">${esc(n.v)}</span>`;
    case "fn":    return `<span class="fn">${esc(n.v)}</span>`;
    case "up":    return `<span class="up">${render(n.body)}</span>`;
    case "text":  return `<span class="txt">${render(n.body)}</span>`;
    case "space": return `<span class="${n.w}"></span>`;
    case "delim": return `<span class="delim">${esc(n.v)}</span>`;
    case "color": return `<span class="${n.cls}">${render(n.body)}</span>`;

    case "frac":
      return `<span class="frac"><span class="fnum">${render(n.num)}</span>` +
             `<span class="fden">${render(n.den)}</span></span>`;

    case "binom":
      return `<span class="delim d2">(</span>` +
             `<span class="frac open"><span class="fnum">${render(n.top)}</span>` +
             `<span class="fden">${render(n.bot)}</span></span>` +
             `<span class="delim d2">)</span>`;

    case "bf": return `<span class="bf">${render(n.body)}</span>`;

    case "sqrt": {
      const idx = n.idx ? `<span class="idx">${render(n.idx)}</span>` : "";
      return `<span class="sqrt">${idx}<span class="surd">√</span>` +
             `<span class="rad">${render(n.rad)}</span></span>`;
    }

    case "accent": {
      if (n.mark === null)
        return `<span class="bar">${render(n.body)}</span>`;
      return `<span class="acc"><span class="mark">${esc(n.mark)}</span>` +
             `<span>${render(n.body)}</span></span>`;
    }

    case "delimited": {
      const h = height(n.body);
      const cls = h >= 2.6 ? " d3" : h >= 1.8 ? " d2" : "";
      const o = n.open ? `<span class="delim${cls}">${esc(n.open)}</span>` : "";
      const c = n.close ? `<span class="delim${cls}">${esc(n.close)}</span>` : "";
      return o + render(n.body) + c;
    }

    case "matrix": {
      const cols = Math.max(...n.rows.map((r) => r.length));
      const cells = n.rows.map((r) => r.map((c) => `<span>${render(c)}</span>`).join("")).join("");
      return `<span class="matrix ${esc(n.name)}"><span class="br l"></span>` +
             `<span class="cells" style="grid-template-columns:repeat(${cols},auto)">${cells}</span>` +
             `<span class="br r"></span></span>`;
    }

    case "under":
      return `<span class="under"><span class="fn">${esc(n.name)}</span></span>`;

    case "bigop":
      return `<span class="bigop"><span class="sym${n.tall ? " tall" : ""}">${esc(n.sym)}</span></span>`;

    case "script": {
      const b = n.base;
      // A big operator carries its limits above and below.
      if (b && b.k === "bigop") {
        const lims = `<span class="lims"><span class="hi">${render(n.sup)}</span>` +
                     `<span class="lo">${render(n.sub)}</span></span>`;
        return `<span class="bigop"><span class="sym${b.tall ? " tall" : ""}">${esc(b.sym)}</span>${lims}</span>`;
      }
      // \lim puts its condition underneath.
      if (b && b.k === "under") {
        return `<span class="under"><span class="fn">${esc(b.name)}</span>` +
               `<span class="sub">${render(n.sub)}</span></span>`;
      }
      const base = render(b);
      // 36.87^\circ is an angle, not 36.87 raised to a power.
      if (isDegree(n.sup) && !n.sub) return base + `<span class="n">°</span>`;
      if (n.sub && n.sup)
        return base + `<span class="subsup"><span class="hi">${render(n.sup)}</span>` +
                      `<span class="lo">${render(n.sub)}</span></span>`;
      if (n.sup) return base + `<sup>${render(n.sup)}</sup>`;
      return base + `<sub>${render(n.sub)}</sub>`;
    }

    default: return "";
  }
}

/* --- speech ---------------------------------------------------------------- */

const SPEAK_OP = {
  "+": "plus", "−": "minus", "=": "equals", "·": "times", "×": "times",
  "÷": "divided by", "±": "plus or minus", "≤": "less than or equal to",
  "≥": "greater than or equal to", "≠": "not equal to", "≈": "approximately",
  "→": "goes to", "⇒": "implies", "<": "less than", ">": "greater than",
  "∈": "in", "∪": "union", "∩": "intersect", "∧": "and", "∨": "or",
};

const SPEAK_SYM = {
  "∇": "gradient", "∂": "partial", "∠": "at angle", "∞": "infinity",
  "|": "bar", "°": "degrees", "…": "and so on", "π": "pi", "θ": "theta",
  "ω": "omega", "λ": "lambda", "Δ": "delta", "Σ": "sigma", "σ": "sigma",
  "μ": "mu", "α": "alpha", "β": "beta", "φ": "phi", "ζ": "zeta", "ρ": "rho",
};

function speak(n) {
  if (!n) return "";
  switch (n.k) {
    case "row": return n.items.map(speak).join(" ").replace(/\s+/g, " ").trim();
    case "raw": return n.v;
    case "sym": return SPEAK_SYM[n.v] ?? n.v;
    case "num": case "var": case "punct": return n.v;
    case "op": return SPEAK_OP[n.v] || n.v;
    case "fn": return n.v;
    case "up": case "text": case "color": return speak(n.body);
    case "space": return "";
    case "delim": return n.v === "(" ? "open bracket" : n.v === ")" ? "close bracket" : n.v;
    case "primed": return speak(n.base) + " prime".repeat(n.n);
    case "frac": return `the fraction ${speak(n.num)} over ${speak(n.den)},`;
    case "binom": return `${speak(n.top)} choose ${speak(n.bot)},`;
    case "bf": return speak(n.body);
    case "sqrt": {
      const i = n.idx ? speak(n.idx) : "";
      const name = i === "3" ? "cube root" : i ? `${i}th root` : "square root";
      return `${name} of ${speak(n.rad)},`;
    }
    case "accent": return `${n.say || "vector"} ${speak(n.body)}`;
    case "delimited": return `open bracket ${speak(n.body)} close bracket`;
    case "matrix": return `${n.name.replace("matrix", " matrix")} of ${n.rows.length} rows: ` +
      n.rows.map((r) => r.map(speak).join(", ")).join("; ");
    case "under": return n.name;
    case "bigop": return n.sym === "∫" ? "integral" : n.sym === "∑" ? "sum" : n.sym === "∏" ? "product" : "integral";
    case "script": {
      const b = speak(n.base);
      if (n.base?.k === "bigop") return `${b} from ${speak(n.sub)} to ${speak(n.sup)} of`;
      if (n.base?.k === "under") return `${b} as ${speak(n.sub)},`;
      if (isDegree(n.sup) && !n.sub) return `${b} degrees`;
      const up = n.sup ? (speak(n.sup) === "2" ? " squared" : speak(n.sup) === "3" ? " cubed" : ` to the power ${speak(n.sup)}`) : "";
      const dn = n.sub ? ` sub ${speak(n.sub)}` : "";
      return b + dn + up;
    }
    default: return "";
  }
}

/* --- public API ------------------------------------------------------------ */

const cache = new Map();

function compile(src) {
  if (cache.has(src)) return cache.get(src);
  let res;
  try {
    const ast = parse(lex(src));
    res = { html: render(ast), label: speak(ast) };
  } catch (err) {
    console.warn("tex: could not parse", src, err);
    res = { html: `<span class="n">${esc(src)}</span>`, label: src };
  }
  cache.set(src, res);
  return res;
}

/** Inline formula as an HTML string. */
export function tex(src) {
  const { html, label } = compile(src);
  return `<span class="math" role="math" aria-label="${esc(label)}">${html}</span>`;
}

/** Display formula as an HTML string — its own line, centred, larger. */
export function texd(src) {
  const { html, label } = compile(src);
  return `<span class="math display" role="math" aria-label="${esc(label)}">` +
         `<span class="mrow">${html}</span></span>`;
}

/** Either form as a live element. */
export function texEl(src, { display = false } = {}) {
  const wrap = document.createElement("span");
  wrap.innerHTML = display ? texd(src) : tex(src);
  return wrap.firstElementChild;
}

/** Plain-text reading of a formula — used for figure aria-labels. */
export function texLabel(src) { return compile(src).label; }

/**
 * Replace every `<x data-tex="…">fallback</x>` inside `root`.
 * Content files carry a readable plain-text fallback between the tags so the
 * prose still parses if this never runs.
 */
export function renderMathIn(root) {
  root.querySelectorAll("[data-tex]").forEach((node) => {
    const src = node.getAttribute("data-tex");
    const display = node.hasAttribute("data-display");
    const { html, label } = compile(src);
    node.classList.add("math");
    if (display) node.classList.add("display");
    node.setAttribute("role", "math");
    node.setAttribute("aria-label", label);
    node.innerHTML = display ? `<span class="mrow">${html}</span>` : html;
    node.removeAttribute("data-tex");
  });
}

/* --------------------------------------------------------------------------
   Fitting display maths to the column

   A display equation sets on one line inside a fixed-width column, and a few
   of them — a row of four Boolean identities, three machine formulas side by
   side — are simply wider than it. `overflow-x: auto` keeps them reachable,
   but a reader sees a truncated equation and has no reason to suspect there is
   more of it off to the right. Shrinking the few that overflow is the honest
   fix; below a floor the type would be too small to read, and there scrolling
   really is the better answer.
   -------------------------------------------------------------------------- */

const FIT_FLOOR = 0.68;

function fitOne(n) {
  n.style.removeProperty("font-size");
  const avail = n.clientWidth;
  if (!avail || n.scrollWidth <= avail + 1) return;
  const base = parseFloat(getComputedStyle(n).fontSize);
  let k = Math.max(FIT_FLOOR, (avail / n.scrollWidth) * 0.99);
  n.style.fontSize = `${(base * k).toFixed(2)}px`;
  // Glyph advances do not scale perfectly linearly, so correct once.
  if (n.scrollWidth > n.clientWidth + 1 && k > FIT_FLOOR) {
    k = Math.max(FIT_FLOOR, k * (n.clientWidth / n.scrollWidth) * 0.99);
    n.style.fontSize = `${(base * k).toFixed(2)}px`;
  }
}

/** Shrink any display equation inside `root` that overflows its column. */
export function fitDisplayMath(root = document) {
  root.querySelectorAll?.(".math.display").forEach(fitOne);
}

/* Widths change with the viewport, so re-fit — once per settled resize, and
   once more when the maths face has actually loaded. */
let watching = false;
export function watchDisplayMath() {
  if (watching) return;
  watching = true;
  let t = 0;
  addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => fitDisplayMath(document), 120);
  });
  document.fonts?.ready.then(() => fitDisplayMath(document));
}
