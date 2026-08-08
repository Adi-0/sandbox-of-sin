/* ==========================================================================
   problems/comms.js — generators for Communications.

   Part 1 (13.B): Fourier transforms. The exam does not ask for the integral.
   It asks whether you can recognise a pair, apply a property, and convert
   between a pulse width and the bandwidth it needs.

   The distractors are the errors that survive into the rest of the module:
   inverting the time-bandwidth relation, forgetting that a frequency shift
   halves the amplitude and produces TWO copies, and confusing a time shift
   (phase only) with a frequency shift (magnitude moves).
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed, sig } from "../lib/fmt.js";

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;
const D = (s) => `<span class="math display" data-tex="${s.replace(/"/g, "&quot;")}"></span>`;

/** Right answer first; duplicates dropped, topped up from `spare`. */
function options(right, wrong, spare = []) {
  const norm = (c) => (typeof c === "string" ? { text: c, why: "" } : c);
  const key = (c) => c.tex ?? c.html ?? String(c.text ?? "");
  const seen = new Set();
  const out = [];
  for (const c of [right, ...wrong, ...spare]) {
    const n = norm(c);
    if (seen.has(key(n))) continue;
    seen.add(key(n));
    out.push(n);
    if (out.length === 4) break;
  }
  return out;
}

/* ==========================================================================
   Part 1 — Fourier transforms and duality
   ========================================================================== */

defineProblem("ft-pair", {
  topic: "Fourier transform pairs",
  lookup: "Electrical → Communications → Fourier transform pairs",
  make(rng) {
    const which = rng.pick(["rect", "delta", "dc", "tri"]);
    const CASES = {
      rect: {
        stem: "A single rectangular pulse of width τ. What is the shape of its magnitude spectrum?",
        right: { text: "a sinc, with nulls at every multiple of 1/τ" },
        wrong: [
          { text: "another rectangle, of width 1/τ", why: `That would be an <b>ideal</b> band-limited spectrum, which no time-limited pulse has. A signal cannot be finite in both time and frequency — this is the duality, and the rectangle is the extreme case of it.` },
          { text: "a sinc, with nulls at every multiple of τ", why: `The nulls are at multiples of <b>1/τ</b>, not τ. Check the units: nulls are a frequency, so they must be a reciprocal time.` },
          { text: "a decaying exponential", why: `That is the transform of a Lorentzian, not of a rectangle. A rectangle's transform rings — it has <b>zero crossings</b> — because the pulse has sharp edges.` },
        ],
        steps: [
          `<b>Recognise, do not integrate.</b> rect ↔ sinc is the pair the exam uses most, because a rectangle is what a single bit looks like.`,
          D(`\\text{rect}(t/\\tau) \\ \\longleftrightarrow \\ \\tau\\,\\text{sinc}(f\\tau)`),
          `<b>Nulls wherever fτ is a whole number</b>, so at f = 1/τ, 2/τ, 3/τ, … The first null is the usual working definition of the pulse's bandwidth.`,
          `Note the tails never stop. <b>A perfectly square pulse needs infinite bandwidth</b>, which is why real systems shape their pulses.`,
        ],
      },
      tri: {
        stem: "A triangular pulse and a rectangular pulse have the same width. How do their spectra differ?",
        right: { text: "same first null; the triangle's tails fall off faster" },
        wrong: [
          { text: "the triangle's first null is at twice the frequency", why: `The first null is set by the pulse <b>width</b>, which is the same for both. What differs is how fast the tails decay beyond it.` },
          { text: "they are identical", why: `A triangle is smoother than a rectangle, and smoother always means a faster-decaying spectrum — sinc² rather than sinc.` },
          { text: "the triangle's spectrum is a rectangle", why: `Nothing time-limited has a rectangular spectrum. The triangle transforms to <b>sinc²</b>.` },
        ],
        steps: [
          `A triangle is two rectangles convolved, and convolution in time is <b>multiplication</b> in frequency — so the transform is the sinc squared.`,
          D(`\\text{tri} \\ \\longleftrightarrow \\ \\tau\\,\\text{sinc}^2(f\\tau)`),
          `<b>Squaring keeps the zeros where they are</b> but pushes the tails down: they now fall as 1/f² instead of 1/f.`,
          `This is the same rule Signal Processing Part 1 gave for periodic waves — <b>a jump costs 1/k, a corner costs 1/k²</b> — restated for a single pulse. The triangle has corners; the rectangle has jumps.`,
        ],
      },
      delta: {
        stem: "What is the Fourier transform of an impulse, δ(t)?",
        right: { text: "a constant — every frequency, equally" },
        wrong: [
          { text: "another impulse, δ(f)", why: `That is the transform of a <b>constant</b>, not of an impulse. The two are duals of each other, and swapping them is the classic slip.` },
          { text: "zero everywhere", why: `An impulse has unit area, so its transform at f = 0 is 1, not 0.` },
          { text: "a sinc", why: `A sinc comes from a rectangle of finite width. An impulse is the limit as that width goes to zero, and the sinc widens to a constant as it does.` },
        ],
        steps: [
          `Substitute into the definition — the sifting property does the integral for you:`,
          D(`X(f) = \\int \\delta(t)e^{-j2\\pi ft}dt = e^{0} = 1`),
          `<b>An instant contains every frequency in equal measure.</b> That is why striking anything sharply excites all of its resonances at once.`,
          `The dual is worth memorising alongside it: <b>a constant transforms to δ(f)</b> — something that never changes contains only DC. These two are the endpoints of the whole duality.`,
        ],
      },
      dc: {
        stem: "A signal is a constant, x(t) = 1 for all time. What is its spectrum?",
        right: { text: "an impulse at f = 0" },
        wrong: [
          { text: "a constant at every frequency", why: `That is the transform of an <b>impulse in time</b>. You have the duality the wrong way round: a signal that never changes contains only DC.` },
          { text: "zero everywhere", why: `A constant is not nothing — it is DC, and DC is a frequency.` },
          { text: "a sinc centred at zero", why: `A sinc comes from a rectangle of finite duration. A constant lasts for ever, which is the limit as that duration grows without bound.` },
        ],
        steps: [
          `Think about what frequencies a constant can contain. <b>It never changes</b>, so nothing oscillates — the only component is DC.`,
          D(`1 \\ \\longleftrightarrow \\ \\delta(f)`),
          `<b>All the energy at one frequency</b>, which is what an impulse in the frequency domain means.`,
          `Pair it with its dual, δ(t) ↔ 1. <b>The more spread out a signal is in one domain, the more concentrated it is in the other</b>, and these two are the extreme case.`,
        ],
      },
    }[which];
    return {
      stem: CASES.stem,
      choices: options(CASES.right, CASES.wrong),
      answer: 0,
      steps: CASES.steps,
    };
  },
});

defineProblem("time-bandwidth", {
  topic: "Pulse width and bandwidth",
  lookup: "Electrical → Communications → Time-bandwidth / pulse spectra",
  make(rng) {
    const mode = rng.pick(["bw", "bw", "tau", "scale"]);

    /* --- bandwidth of a pulse of stated width --------------------------- */
    if (mode === "bw") {
      const tau = rng.pick([1, 2, 5, 10, 20, 50]);      // microseconds
      const bw = 1000 / tau;                            // kHz, first null
      return {
        stem: `A rectangular pulse is ${num(tau, 0)} μs wide. Taking the first null as its bandwidth, how much spectrum does it occupy?`,
        choices: options(
          { text: `${sig(bw, 3)} kHz`, why: "" },
          [
            { text: `${sig(tau, 3)} kHz`, why: `That is the pulse <b>width</b> with the units changed, not a bandwidth. Bandwidth is the <em>reciprocal</em> of a time — check by substituting: 1/(${num(tau, 0)} μs) = ${sig(bw, 3)} kHz.` },
            { text: `${sig(bw / 2, 3)} kHz`, why: `Halved. The first null of τ·sinc(fτ) is at f = 1/τ exactly; there is no factor of two in it.` },
            { text: `${sig(bw * 2, 3)} kHz`, why: `Doubled. That would be the <em>second</em> null, or the full width of the main lobe counting both sides of zero — the usual convention is the first null on one side.` },
            { text: `${sig(bw / 1000, 4)} kHz`, why: `A factor of a thousand out — microseconds and kilohertz are reciprocals of each other only after the megahertz conversion. 1/(1 μs) = 1 MHz = 1000 kHz.` },
          ]),
        answer: 0,
        steps: [
          `A rectangle of width τ transforms to a sinc with its first null at <b>f = 1/τ</b>:`,
          D(`B = \\frac{1}{\\tau} = \\frac{1}{${num(tau, 0)} \\times 10^{-6}\\text{ s}} = ${sig(bw * 1000, 4)}\\text{ Hz}`),
          `<b>${sig(bw, 3)} kHz.</b> Worth carrying as a rule of thumb: <b>a 1 μs pulse needs about 1 MHz</b>, and everything else scales from there.`,
          `<b>The relation is reciprocal, always.</b> Shorten the pulse and the spectrum widens in exact proportion — that is the whole of duality, and it is why fast links are expensive in spectrum.`,
        ],
      };
    }

    /* --- the pulse a stated bandwidth allows ---------------------------- */
    if (mode === "tau") {
      /* B = 1 MHz is excluded: it gives τ = 1 μs, so the "carried the number
         across without inverting" distractor becomes the answer. */
      const bw = rng.pick([2, 4, 5, 8, 10]);            // MHz
      const tau = 1 / bw;                               // microseconds
      return {
        stem: `A channel has ${num(bw, 0)} MHz of bandwidth. What is the shortest rectangular pulse it can pass without losing the main lobe?`,
        choices: options(
          { text: `${sig(tau, 3)} μs`, why: "" },
          [
            { text: `${sig(bw, 3)} μs`, why: `The numbers were carried across without inverting. <b>Width and bandwidth are reciprocals</b>: more bandwidth means a <em>shorter</em> pulse, not a longer one.` },
            { text: `${sig(tau * 2, 3)} μs`, why: `Twice as long as necessary — this pulse would fit in half the bandwidth. The relation is τ = 1/B with no factor of two.` },
            { text: `${sig(tau / 2, 3)} μs`, why: `Too short: this pulse's first null is at ${num(2 * bw, 0)} MHz, so its main lobe would be cut in half by the channel.` },
          ]),
        answer: 0,
        steps: [
          D(`\\tau = \\frac{1}{B} = \\frac{1}{${num(bw, 0)} \\times 10^{6}} = ${sig(tau, 3)}\\,\\mu\\text{s}`),
          `<b>${sig(tau, 3)} μs.</b> Read it as the exchange rate: <b>one microsecond costs one megahertz</b>.`,
          `This is the same statement as the bit-rate limit in Part 5, in different clothes. A channel that can pass a ${sig(tau, 3)} μs pulse can carry roughly ${sig(1 / tau, 3)} million of them a second.`,
        ],
      };
    }

    /* --- what scaling does --------------------------------------------- */
    const f = rng.pick([2, 3, 4, 5]);
    return {
      stem: `A pulse is compressed to <b>one ${f === 2 ? "half" : f === 3 ? "third" : f === 4 ? "quarter" : "fifth"}</b> of its original duration. What happens to the bandwidth it occupies?`,
      choices: options(
        { text: `it increases by a factor of ${f}`, why: "" },
        [
          { text: `it decreases by a factor of ${f}`, why: `Backwards. <b>Compressing in time spreads the spectrum</b> — a faster signal contains faster components, so it needs more room, not less.` },
          { text: "it does not change", why: `Then a link could run arbitrarily fast in a fixed bandwidth, and no communication system would have a capacity. The scaling property says the product τ·B is fixed.` },
          { text: `it increases by a factor of ${f * f}`, why: `The relation is reciprocal, not inverse-square. Compress by ${f} and the bandwidth grows by exactly ${f}.` },
        ]),
      answer: 0,
      steps: [
        `The scaling property, which is the whole content of duality:`,
        D(`x(at) \\ \\longleftrightarrow \\ \\frac{1}{|a|}X(f/a)`),
        `Compressing in time by ${f} means a = ${f}, so the spectrum is stretched by ${f} (and its amplitude drops by ${f}, conserving area).`,
        `<b>A factor of ${f} more bandwidth.</b> The product τ·B has not moved, and it never does. <b>Time is what you save and bandwidth is what you pay</b>, at a fixed exchange rate.`,
      ],
    };
  },
});

defineProblem("ft-property", {
  topic: "Fourier transform properties",
  lookup: "Electrical → Communications → Fourier transform properties",
  make(rng) {
    const which = rng.pick(["shiftfreq", "shiftfreq", "shifttime", "linear"]);

    if (which === "shiftfreq") {
      const fc = rng.pick([100, 455, 1000, 10700]);
      const bw = rng.pick([3, 5, 10]);
      return {
        stem: `A baseband signal occupying 0 to ${num(bw, 0)} kHz is multiplied by cos(2πf<sub>c</sub>t) with f<sub>c</sub> = ${num(fc, 0)} kHz. Where does its spectrum end up?`,
        choices: options(
          { text: `two copies, centred at +${num(fc, 0)} and −${num(fc, 0)} kHz, each at half amplitude`, why: "" },
          [
            { text: `one copy, centred at ${num(fc, 0)} kHz, at full amplitude`, why: `A real cosine is <b>two</b> exponentials, so it produces <b>two</b> copies and each gets half the amplitude. A single full-amplitude copy would need a complex exponential, which no real circuit generates on its own.` },
            { text: `one copy, shifted up to ${num(fc + bw, 0)} kHz`, why: `The spectrum is moved <b>bodily</b> to be centred on the carrier, not pushed up by its own width. Its shape is unchanged; only its location moves.` },
            { text: `unchanged in frequency, but doubled in amplitude`, why: `That describes multiplying by a constant. Multiplying by a <b>cosine</b> moves the spectrum — that is precisely what makes modulation possible.` },
          ]),
        answer: 0,
        steps: [
          `The frequency-shift property, which is the single most used line in this module:`,
          D(`x(t)\\cos(2\\pi f_c t) \\ \\longleftrightarrow \\ \\tfrac{1}{2}\\left[X(f-f_c) + X(f+f_c)\\right]`),
          `<b>Two copies, at ±${num(fc, 0)} kHz, each half as tall.</b> The occupied band around the carrier runs from ${num(fc - bw, 0)} to ${num(fc + bw, 0)} kHz — <b>${num(2 * bw, 0)} kHz wide, twice the baseband width</b>, because both sides of the spectrum come along.`,
          `Everything in Part 2 is this line. So is every mixer, and so is the reason a receiver can pick one station out of a crowded dial.`,
        ],
      };
    }

    if (which === "shifttime") {
      const d = rng.pick([1, 2, 5]);
      return {
        stem: `A signal is delayed by ${num(d, 0)} ms. What happens to its Fourier transform?`,
        choices: options(
          { text: "the magnitude is unchanged; only the phase changes", why: "" },
          [
            { text: "the magnitude is shifted along the frequency axis", why: `That is a <b>frequency</b> shift, caused by multiplying by a carrier. A <b>time</b> shift cannot change which frequencies are present — delaying a piece of music does not retune it.` },
            { text: "both magnitude and phase are unchanged", why: `The phase does change, by −2πfT, and that matters: it is a delay that grows with frequency unless the phase is linear, which is exactly the Bessel-filter argument from Signal Processing Part 4.` },
            { text: "the magnitude is scaled down by the delay", why: `A delay does not attenuate. Nothing is lost by waiting.` },
          ]),
        answer: 0,
        steps: [
          D(`x(t - T) \\ \\longleftrightarrow \\ X(f)\\,e^{-j2\\pi fT}`),
          `The factor multiplying X(f) has <b>magnitude exactly 1</b>, so |X(f)| does not move at all. Only the angle does, by −2πfT.`,
          `<b>Magnitude unchanged, phase shifted.</b> Sanity check it physically: a delayed signal contains exactly the frequencies it contained before — <b>waiting cannot create or destroy a frequency</b>.`,
          `Note the phase shift is <b>proportional to f</b>. That is what "linear phase" means, and it is why a linear-phase filter delays every component equally and so preserves a pulse's shape.`,
        ],
      };
    }

    const a = rng.pick([2, 3, 4]);
    return {
      stem: `Two signals with transforms X(f) and Y(f) are added, and the sum is multiplied by ${num(a, 0)}. What is the transform of the result?`,
      choices: options(
        { tex: `${num(a, 0)}\\left[X(f) + Y(f)\\right]`, why: "" },
        [
          { tex: `${num(a, 0)}X(f) \\cdot ${num(a, 0)}Y(f)`, why: `Addition in time stays addition in frequency. <b>Multiplication</b> in one domain becomes convolution in the other — but nothing here was multiplied together.` },
          { tex: `X(f) + Y(f)`, why: `The factor of ${num(a, 0)} carries through. The transform is linear in the signal, so scaling the signal scales the transform.` },
          { tex: `${num(a * a, 0)}\\left[X(f) + Y(f)\\right]`, why: `The scale factor appears once, not squared. It would be squared for <b>power</b>, but the transform is of the signal itself.` },
        ]),
      answer: 0,
      steps: [
        `<b>The transform is linear</b>, which is the property that makes it useful at all:`,
        D(`a\\,x(t) + b\\,y(t) \\ \\longleftrightarrow \\ a\\,X(f) + b\\,Y(f)`),
        `<b>${num(a, 0)}[X(f) + Y(f)].</b>`,
        `Linearity is why a spectrum can be reasoned about piece by piece — the spectrum of a sum is the sum of the spectra, so a signal can be decomposed, handled, and reassembled. <b>Everything in this module assumes it.</b>`,
      ],
    };
  },
});

defineReflex([
  {
    part: "fourier",
    stem: "Transform of a rectangular pulse of width τ?",
    tool: "A sinc, with nulls at every multiple of 1/τ",
    because: "A rectangle is what one bit looks like, so this pair sets the bandwidth of every digital link.",
  },
  {
    part: "fourier",
    stem: "δ(t) transforms to what? And what transforms to δ(f)?",
    tool: "δ(t) ↔ 1, and 1 ↔ δ(f)",
    because: "An instant holds every frequency; a constant holds only DC. They are the two extremes of duality.",
  },
  {
    part: "fourier",
    stem: "A pulse is compressed in time by a factor of 4. Its bandwidth?",
    tool: "Four times wider — τ·B is constant",
    because: "Time is what you save and bandwidth is what you pay, at a fixed exchange rate no shaping escapes.",
  },
  {
    part: "fourier",
    stem: "Multiplying a signal by cos(2πfct) does what to its spectrum?",
    tool: "Copies it to +fc AND −fc, each at half amplitude",
    because: "This one line is amplitude modulation, every mixer, and frequency-division multiplexing.",
  },
  {
    part: "fourier",
    stem: "Delaying a signal changes what about its transform?",
    tool: "The phase only — magnitude is untouched",
    because: "Waiting cannot create or destroy a frequency. Confusing this with a frequency shift is the standard error.",
  },
  {
    part: "fourier",
    stem: "Minimum bandwidth to carry a bit rate Rb without intersymbol interference?",
    tool: "Rb/2 — alternating bits are a square wave at half the bit rate",
    because: "Below it the worst-case pattern's fundamental does not get through and the eye closes with no noise present.",
  },
  {
    part: "fourier",
    stem: "Which pulse shape is its own Fourier transform?",
    tool: "The Gaussian",
    because: "It also achieves the smallest possible time-bandwidth product, which is why it is used where spectrum is scarce.",
  },
]);
