# Echo — an interactive field guide to signals and systems

Signals and systems built from one idea, in order, without skipping: clap
once in a room, and what comes back tells you everything that room will
ever do to any sound. Eleven parts, thirty live figures you turn the knobs
on, sounds rendered on the spot by the same simulation that draws the
curves, and a workbench at the end where you drag poles around a map and
watch four views move together.

No background is assumed beyond arithmetic, ordinary algebra, and having
seen a picture of a sine wave. Not calculus — where an integral is needed
you get an area you can drag a slider through. Not complex numbers — Part 4
builds them from a spinning arrow, because that is what they are.

## Run it

```
python3 serve.py            # then open http://localhost:8000
```

That is the whole setup: no build step, no dependencies, no package
manager. `serve.py` is forty lines of Python standard library. Any static
server works as well (`npx serve`, `php -S`, whatever you have).

The one thing that will *not* work is opening `index.html` off disk: the
guide loads its chapters as separate files and browsers block that over
`file://`. The page says so if you try.

## What's in it

| Part | | Figures |
|---|---|---|
| 1 | **Everything That Varies** — what a signal is, and the four shapes | 1–3 |
| 2 | **The Two Promises** — linearity and time invariance, tested | 4–5 |
| 3 | **One Clap Tells All** — the impulse response, and convolution | 6–9 |
| 4 | **The Spinning Arrow** — why a system cannot bend a sinusoid | 10–12 |
| 5 | **A Stack of Tones** — Fourier series, transform, and the seesaw | 13–16 |
| 6 | **The Room, Tone by Tone** — frequency response, Bode, the payoff | 17–19 |
| 7 | **Poles** — Laplace, the s-plane, block diagrams, stability | 20–23 |
| 8 | **Rooms Built on Purpose** — filters, and what sharpness costs | 24–25 |
| 9 | **Photographs of a Signal** — sampling, aliasing, reconstruction | 26–28 |
| 10 | **Out in the World** — a radio station and a cruise control | 29–30 |
| 11 | **Closing the Loop** — synthesis, cheat sheet, where to go next | — |
| — | **The Bench** — drag poles, hear the result, break things | — |

Progress lives in `localStorage` and nowhere else. Arrow keys move between
parts. The theme button cycles system → light → dark.

## How it's built

```
index.html          app shell
serve.py            local static server

styles/
  tokens.css        design tokens — every colour, light and dark
  base.css          typography, app frame, responsive rules
  components.css    the figure panel, the domain tab, controls, readouts

src/
  app.js            router, chapter loading, figure mounting, progress
  parts.js          the arc — part order, titles, reading times
  state.js          localStorage for progress and theme
  lib/
    lti.js          THE engine — poles/zeros, state space, FFT, sampling
    plot.js         scopes, log axes, stems, s-plane glyphs, block diagrams
    dom.js          element helpers, knobs, readouts, figure assembly
    anim.js         rAF loop manager — pause, reduced motion, visibility
    audio.js        Web Audio rendering, driven by lti.js
  figures/          one module per part, plus the bench
    index.js        name → builder registry that the content HTML refers to

content/
  00-cover.html … 12-bench.html      the prose, as plain HTML
```

Four decisions worth knowing about.

**One engine, four views.** There is exactly one description of a system in
the codebase — a list of zeros, a list of poles, and a gain — and every
other view is derived from it:

```
zeros/poles/gain → b, a coefficients → H(jω)          the Bode plot
                                    → state space     → h(t), step, any input
                                                      → the audio you hear
```

So the curve on screen, the number in the readout and the sound in your
speakers cannot drift apart; they are renderings of one simulation.
Figure 19 leans on this deliberately: its output spectrum is measured by
transforming the simulated waveform, *not* by multiplying the input
spectrum by the gain curve — and it lands on that product to four decimal
places, which is the theorem the chapter is about.

**One cast of numbers.** A room with τ = 1 ms (corner at 1000 rad/s, 159 Hz),
a 100 Hz square wave, a 1 kHz sample rate, a second-order pole pair at
ζ = 0.2. Every consequence the prose quotes — the fundamental keeping 85%,
52.7% overshoot, settling in 20 ms, feedback going unstable at K ≈ 35,
900 Hz aliasing to exactly the 100 Hz fundamental — falls out of those and
is checked against the running simulation rather than written down
separately.

**Nothing you hear is a recording.** Every sound is rendered on click by
`lti.js` at 44.1 kHz. The reverb in Figure 6 convolves a 1.3-second sound
with a 0.6-second hall using the FFT — which is Part 6's central claim,
load-bearing: done directly it would be ~800 million multiplications and
would freeze the page. The guide's reverb could not exist without the
theorem the guide is teaching. Because 100 Hz is beyond a laptop speaker,
ear demos run the whole scene — signal *and* system — four times faster;
scaling time scales every frequency together and leaves every ratio, shape
and decibel identical. This is flagged wherever it applies.

**Prose is HTML, figures are JavaScript.** Chapters are plain HTML with
`<div data-fig="pole-ring">` placeholders that `app.js` hydrates. The text
is written to stand on its own if no figure ever renders, and a figure that
throws is caught and replaced with a note rather than taking the page down.

## The design

Named in one phrase: **engineering vellum and four instrument pens.**

The signature element is the **domain tab** on the top edge of every figure,
naming which room the drawing is made in — `t` for time, `ω` for frequency,
`s` for the pole map. Half of this subject is knowing which room you are
standing in, so the one loud device on the page is the one that tells you.

Colour is vocabulary, and four pens mean the same thing in every figure,
readout and mention in the prose:

| pen | means |
|---|---|
| blue | `x(t)`, `X(jω)` — what goes in |
| vermilion | `y(t)`, `Y(jω)` — what comes out |
| violet | the system itself — `h(t)`, `H(jω)`, `H(s)`, poles and zeros |
| green | one single pure sinusoid — a harmonic, a phasor, a spectral line |

Poles and zeros share the system pen and are told apart by shape (× and ○),
so no fifth colour is needed. Every colour in CSS *and* inside every SVG
resolves through a custom property, which is the entire dark-mode
implementation.

## Adding a figure

1. Write a builder in `src/figures/*.js` returning a DOM node. `figure()`
   from `lib/dom.js` gives you the numbered panel, domain tab, controls
   strip, readouts row and caption.
2. Register it in `src/figures/index.js` under a short name.
3. Drop `<div data-fig="your-name"></div>` into the relevant `content/*.html`.

Anything animated should use `createLoop()` from `lib/anim.js` rather than
its own `requestAnimationFrame` — it supplies the pause button, honours
`prefers-reduced-motion`, and stops simulating when the figure scrolls out
of view. Anything audible should use `listen()` from `lib/audio.js`, which
renders on click and never before.

## Accessibility

Every figure SVG carries an `aria-label` describing what it shows. Controls
are native `<input type="range">` and `<button>`, so they are
keyboard-operable and screen-reader-legible for free; where a figure offers
dragging, a slider does the same job. Focus styles are visible, animation
respects `prefers-reduced-motion`, layout holds down to 360 px, and wide
tables scroll inside their own container rather than the page.
