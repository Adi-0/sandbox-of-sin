# Spikes — an interactive field guide to neuromorphic computing

An interactive teaching tool that builds neuromorphic computing from first
principles: a leaky bucket, then a neuron, then a circuit, then a chip. Sixteen
live figures you turn the knobs on, a free-form network bench at the end, and
one simulation engine underneath all of it so the numbers never drift apart.

No background is assumed beyond arithmetic and the idea that electricity flows
through wires. No calculus, no neuroscience, no machine learning.

## Run it

```
python3 serve.py            # then open http://localhost:8000
```

That is the whole setup. No build step, no dependencies, no package manager —
`serve.py` is thirty lines of Python standard library. Any static server works
just as well (`npx serve`, `php -S`, whatever you have).

The one thing that will *not* work is opening `index.html` straight off disk:
the guide loads its chapters as separate files and browsers block that over
`file://`. The page tells you so if you try.

## What's in it

| Part | | Figures |
|---|---|---|
| 1 | **The Wall** — why anyone builds a different kind of computer | 1–2 |
| 2 | **The Leaky Bucket** — one neuron, one analogy, four numbers | 3–5 |
| 3 | **Time Is the Medium** — what a spike carries, and coincidence detection | 6–7 |
| 4 | **Wiring Things Up** — weights, the transmission cliff, winner-take-all | 8–10 |
| 5 | **Learning Without a Teacher** — STDP finds a pattern nobody labelled | 11–12 |
| 6 | **The Silicon** — crossbars, sparsity, address events, real chips | 13–15 |
| 7 | **Where It Wins** — surrogate gradients and the honest scorecard | 16 |
| 8 | **The Bench** — build your own five-neuron network | — |

Progress is stored in `localStorage` and nowhere else. Arrow keys move between
parts. The theme button cycles system → light → dark.

## How it's built

```
index.html          app shell
serve.py            local static server

styles/
  tokens.css        design tokens — every colour, light and dark
  base.css          typography, app frame, responsive rules
  components.css    the figure panel, controls, readouts, checkpoints

src/
  app.js            router, chapter loading, figure mounting, progress
  parts.js          the arc — part order, titles, reading times
  state.js          localStorage for progress and theme
  lib/
    neuron.js       THE simulation engine — LIF, synapses, STDP, networks
    plot.js         scopes, grids, traces, rasters, bar charts
    dom.js          element helpers, sliders, readouts, figure assembly
    anim.js         rAF loop manager — pause control, reduced motion, visibility
  figures/          one module per part, plus the sandbox
    index.js        name → builder registry that content HTML refers to

content/
  00-cover.html … 08-bench.html      the prose, as plain HTML
```

Three decisions worth knowing about:

**One engine, one cast of numbers.** Every figure — from the first leaky bucket
to the sandbox — imports `src/lib/neuron.js`. The membrane time constant is
20 ms, the threshold is 20 mV, the input resistance is 100 MΩ and the refractory
period is 2 ms, *everywhere*. Consequences the guide quotes (rheobase 0.20 nA,
0.4 nA → 63 Hz, an 8.1 ms coincidence window, a 7.87 mV transmission cliff) fall
out of those four numbers and are verified against the running simulation rather
than written down separately. Change a constant in `neuron.js` and all sixteen
figures move together.

**Prose is HTML, figures are JavaScript.** Chapters live in `content/` as plain
HTML with `<div data-fig="leak">` placeholders that `app.js` hydrates. The text
is written to stand on its own if no figure ever renders, and a figure that
throws is caught and replaced with a note rather than taking the page down.

**Colour is vocabulary.** Amber is membrane voltage, magenta is a spike, teal is
excitation, indigo is inhibition — in every figure, every readout and every
mention in the prose. All of it, inside SVG included, resolves through CSS
custom properties, so dark mode is a token override and nothing else.

## Adding a figure

1. Write a builder in `src/figures/*.js` that returns a DOM node. `figure()`
   from `lib/dom.js` gives you the numbered panel, controls strip, readouts row
   and caption.
2. Register it in `src/figures/index.js` under a short name.
3. Drop `<div data-fig="your-name"></div>` into the relevant `content/*.html`.

Anything animated should use `createLoop()` from `lib/anim.js` rather than its
own `requestAnimationFrame` — it supplies the pause button, honours
`prefers-reduced-motion`, and stops simulating when the figure scrolls offscreen.

## Accessibility

Every figure SVG carries an `aria-label` describing what it shows. Controls are
native `<input type="range">` and `<button>`, so they are keyboard-operable and
screen-reader-legible for free. Focus styles are visible, animation respects
`prefers-reduced-motion`, layout holds down to 360 px, and wide tables scroll
inside their own container rather than the page.
