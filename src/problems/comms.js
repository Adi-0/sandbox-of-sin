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
import { amPower, carson, pcmSnrUniform, pcmSnrCompanded } from "../lib/comms.js";

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

/* ==========================================================================
   Part 2 — amplitude modulation

   Three shapes, all of which the exam sets: read the index off an envelope,
   split the power, and choose between the schemes. The distractors are the
   missing square root in the current relation, halving the bandwidth when it
   should be doubled, and treating the carrier as though it carried something.
   ========================================================================== */

defineProblem("am-index", {
  topic: "AM modulation index",
  lookup: "Electrical → Communications → Amplitude modulation",
  make(rng) {
    const ask = rng.pick(["scope", "scope", "amps", "bw"]);

    /* --- index from the envelope, the way it is measured ---------------- */
    if (ask === "scope") {
      const Ac = rng.pick([4, 5, 8, 10, 20]);
      const m = rng.pick([0.25, 0.4, 0.5, 0.6, 0.75, 0.8]);
      const hi = Ac * (1 + m), lo = Ac * (1 - m);
      return {
        stem: `An AM envelope on an oscilloscope swings between <b>${sig(lo, 3)} V</b> and <b>${sig(hi, 3)} V</b>. What is the modulation index?`,
        choices: options(
          { text: fixed(m, 2), why: "" },
          [
            { text: fixed(lo / hi, 3), why: `That is the ratio of the two readings. The index is the <b>difference over the sum</b>, which is what makes it 0 for an unmodulated carrier and 1 when the envelope just touches zero.` },
            { text: fixed((hi - lo) / hi, 3), why: `Divided by the maximum instead of by the sum. Check the limits: with this formula a fully modulated signal (min = 0) would give 1 — correct — but an unmodulated one gives 0 only by coincidence, and every value between is wrong.` },
            { text: fixed(hi - lo, 3), why: `That is a voltage, not an index. <b>m is dimensionless</b> — it has to be, since it multiplies a cosine inside a bracket that is added to 1.` },
            { text: fixed((hi - lo) / (2 * Ac), 3), why: `Correct in form but the denominator has to come from the <em>measurement</em>. Amax + Amin = ${sig(hi + lo, 3)} V, and that is what to divide by.` },
          ]),
        answer: 0,
        steps: [
          D(`m = \\frac{A_{max} - A_{min}}{A_{max} + A_{min}} = \\frac{${sig(hi, 3)} - ${sig(lo, 3)}}{${sig(hi, 3)} + ${sig(lo, 3)}}`),
          D(`= \\frac{${sig(hi - lo, 3)}}{${sig(hi + lo, 3)}} = ${fixed(m, 3)}`),
          `<b>m = ${fixed(m, 2)}.</b> Note what the sum gives you for free: A<sub>max</sub> + A<sub>min</sub> = 2A<sub>c</sub>, so the carrier amplitude is <b>${sig(Ac, 3)} V</b> without needing the transmitter's specification.`,
          `<b>The formula only works for m ≤ 1.</b> Above that the envelope reaches zero, the measured minimum is 0 whatever the real index is, and the ratio returns exactly 1 every time.`,
        ],
      };
    }

    /* --- antenna current, where the square root gets dropped ------------ */
    if (ask === "amps") {
      const Ic = rng.pick([8, 10, 12, 20]);
      /* m = 0.4 is excluded: sqrt(1 + m^2/2) and sqrt(1 + m^2) are then only
         3.6% apart, so the "dropped the /2" distractor is indistinguishable. */
      const m = rng.pick([0.5, 0.6, 0.8, 1.0]);
      const It = Ic * Math.sqrt(1 + (m * m) / 2);
      return {
        stem: `An AM transmitter draws <b>${num(Ic, 0)} A</b> of antenna current unmodulated. What is the current at a modulation index of ${fixed(m, 2)}?`,
        choices: options(
          { text: `${sig(It, 4)} A`, why: "" },
          [
            { text: `${sig(Ic * (1 + (m * m) / 2), 4)} A`, why: `The square root was dropped. That expression is the <b>power</b> ratio; current goes as the square root of power, so I<sub>t</sub> = I<sub>c</sub>√(1 + m²/2).` },
            { text: `${sig(Ic * (1 + m), 4)} A`, why: `That is the peak of the <em>envelope</em>, not the RMS antenna current. The current is set by total power, which depends on m².` },
            { text: `${sig(Ic * Math.sqrt(1 + m * m), 4)} A`, why: `The factor of two under the m² is missing. Both sidebands together carry m²/2 of the carrier power, not m².` },
          ]),
        answer: 0,
        steps: [
          `Power first, because that is what the relation is built on:`,
          D(`\\frac{P_t}{P_c} = 1 + \\frac{m^2}{2} = 1 + \\frac{${fixed(m * m, 3)}}{2} = ${fixed(1 + (m * m) / 2, 4)}`),
          `<b>Current is the square root of power</b> into a fixed antenna resistance:`,
          D(`I_t = I_c\\sqrt{1 + \\frac{m^2}{2}} = ${num(Ic, 0)}\\sqrt{${fixed(1 + (m * m) / 2, 4)}} = ${sig(It, 4)}\\text{ A}`),
          `<b>${sig(It, 4)} A</b> — only ${fixed(100 * (It / Ic - 1), 1)}% above the unmodulated value even at m = ${fixed(m, 2)}. <b>The square root is the whole question</b>, and leaving it out is the standard error.`,
        ],
      };
    }

    /* --- bandwidth ------------------------------------------------------ */
    const fm = rng.pick([3.4, 5, 10, 15]);
    const fc = rng.pick([540, 1000, 1600]);
    return {
      stem: `A ${num(fc, 0)} kHz carrier is amplitude-modulated by a message occupying up to ${num(fm, 1)} kHz. What bandwidth does the transmission occupy, and where?`,
      choices: options(
        { text: `${num(2 * fm, 1)} kHz, from ${num(fc - fm, 1)} to ${num(fc + fm, 1)} kHz`, why: "" },
        [
          { text: `${num(fm, 1)} kHz, from ${num(fc, 0)} to ${num(fc + fm, 1)} kHz`, why: `That is <b>single</b>-sideband. Ordinary AM produces <b>both</b> sidebands, one either side of the carrier, so the occupied band is twice the message width.` },
          { text: `${num(fc + fm, 1)} kHz`, why: `That is the highest frequency present, not the bandwidth. <b>Bandwidth is a width</b> — the span between the edges, not the distance from zero.` },
          { text: `${num(4 * fm, 1)} kHz`, why: `Doubled twice. Each sideband is f<sub>m</sub> wide, and there are two of them: 2f<sub>m</sub> total.` },
        ]),
      answer: 0,
      steps: [
        `Multiplying by the carrier puts a copy of the message spectrum <b>either side</b> of f<sub>c</sub>:`,
        D(`\\text{BW} = 2f_m = 2(${num(fm, 1)}) = ${num(2 * fm, 1)}\\text{ kHz}`),
        `Occupying <b>${num(fc - fm, 1)} to ${num(fc + fm, 1)} kHz</b>.`,
        `<b>This holds however small m is.</b> The index sets how tall the sidebands are, never where they sit — so a lightly modulated station takes exactly as much dial as a heavily modulated one.`,
      ],
    };
  },
});

defineProblem("am-power", {
  topic: "AM power distribution",
  lookup: "Electrical → Communications → AM power and efficiency",
  make(rng) {
    const Pc = rng.pick([1, 2, 5, 10, 50]);              // kW
    const m = rng.pick([0.4, 0.5, 0.6, 0.8]);
    /* m = 1 is excluded here: m squared then equals m, which collapses the
       "no /2" distractor onto the "not squared" one in the total branch, the
       two sideband distractors onto each other, and the efficiency branch's
       "100 m" onto the literal 100%. The 1/3 ceiling is made in the prose. */
    const P = amPower(m);
    const Pt = Pc * P.total;
    const ask = rng.pick(["total", "total", "side", "eff"]);

    if (ask === "side") {
      const each = Pc * P.perSideband;
      return {
        stem: `An AM transmitter has a carrier power of ${num(Pc, 0)} kW and is modulated to m = ${fixed(m, 2)}. What power is in <b>each</b> sideband?`,
        choices: options(
          { text: `${sig(each, 3)} kW`, why: "" },
          [
            { text: `${sig(2 * each, 3)} kW`, why: `That is <b>both</b> sidebands together, m²P<sub>c</sub>/2. The question asks for one of them, so halve it.` },
            { text: `${sig(Pt, 3)} kW`, why: `That is the total transmitted power, carrier included. The sidebands are the part <em>above</em> the carrier.` },
            { text: `${sig(Pc * m / 2, 3)} kW`, why: `The index was not squared. <b>Power goes as amplitude squared</b>, and each sideband has amplitude mA<sub>c</sub>/2 — so its power carries m².` },
          ]),
        answer: 0,
        steps: [
          `Each sideband has amplitude mA<sub>c</sub>/2, and power goes as amplitude squared:`,
          D(`P_{SB} = \\frac{m^2}{4}P_c = \\frac{${fixed(m * m, 3)}}{4}(${num(Pc, 0)}) = ${sig(each, 4)}\\text{ kW}`),
          `<b>${sig(each, 3)} kW each</b>, so ${sig(2 * each, 3)} kW in the pair — and the carrier is still the full ${num(Pc, 0)} kW on top of that.`,
          `<b>Only these two carry the message.</b> Everything else is the carrier, which is unchanged whatever the programme does.`,
        ],
      };
    }

    if (ask === "eff") {
      return {
        stem: `An AM signal is modulated to m = ${fixed(m, 2)}. What fraction of the transmitted power carries information?`,
        choices: options(
          { text: `${fixed(100 * P.efficiency, 1)}%`, why: "" },
          [
            { text: `${fixed(100 * m, 0)}%`, why: `The index is not a percentage of power. <b>Power goes as m²</b>, and the carrier is in the denominator too.` },
            { text: `${fixed(100 * (m * m) / 2, 1)}%`, why: `That is the sideband power as a fraction of the <b>carrier</b>, not of the total. Divide by 1 + m²/2, not by 1.` },
            { text: "100%", why: `That would be DSB-SC or SSB, where the carrier is suppressed. Full-carrier AM always spends most of its power on the carrier — <b>at best a third goes to the sidebands</b>.` },
          ]),
        answer: 0,
        steps: [
          D(`\\eta = \\frac{P_{SB}}{P_t} = \\frac{m^2/2}{1 + m^2/2} = \\frac{m^2}{2 + m^2}`),
          D(`= \\frac{${fixed(m * m, 3)}}{2 + ${fixed(m * m, 3)}} = ${fixed(P.efficiency, 4)}`),
          `<b>${fixed(100 * P.efficiency, 1)}%.</b> ${m >= 0.999 ? "This is the ceiling — <b>exactly 1/3 at m = 1</b>, and m cannot legally go higher." : `And m = 1 would only reach 33.3%, so <b>the ceiling is 1/3 no matter what</b>.`}`,
          `<b>The carrier is the reason.</b> It is a constant sinusoid, identical whether the programme is speech or silence, and it takes ${fixed(100 * (1 - P.efficiency), 1)}% of the transmitter here.`,
        ],
      };
    }

    return {
      stem: `An AM transmitter with a ${num(Pc, 0)} kW carrier is modulated to m = ${fixed(m, 2)}. What is the total transmitted power?`,
      /* At m = 1 the "no /2" and "not squared" distractors are both 2Pc, so
         build the list and keep only the distinct values. */
      choices: options(
        { text: `${sig(Pt, 4)} kW`, why: "" },
        [
          { v: Pc * (1 + m * m), why: `The factor of two under the m² is missing. Both sidebands together are m²/2 of the carrier, not m².` },
          { v: Pc * (1 + m), why: `The index was not squared. <b>Power goes as amplitude squared</b>, so m enters as m².` },
          { v: Pc, why: `That is the carrier alone. Modulating adds the sidebands on top — the carrier does not shrink to make room for them.` },
          { v: Pc * (m * m) / 2, why: `That is the sideband power only. The question asks for the <b>total</b>, which includes the carrier.` },
        ].reduce((acc, c) => {
          const t = `${sig(c.v, 4)} kW`;
          if (t !== `${sig(Pt, 4)} kW` && !acc.some((x) => x.text === t)) acc.push({ text: t, why: c.why });
          return acc;
        }, [])),
      answer: 0,
      steps: [
        D(`P_t = P_c\\left(1 + \\frac{m^2}{2}\\right) = ${num(Pc, 0)}\\left(1 + \\frac{${fixed(m * m, 3)}}{2}\\right)`),
        D(`= ${num(Pc, 0)}(${fixed(P.total, 4)}) = ${sig(Pt, 4)}\\text{ kW}`),
        `<b>${sig(Pt, 4)} kW</b>, of which ${sig(Pt - Pc, 3)} kW is the sidebands and ${num(Pc, 0)} kW is the carrier.`,
        `<b>Modulation only ever adds power.</b> The carrier stays exactly where it was — which is why the efficiency here is just ${fixed(100 * P.efficiency, 1)}%.`,
      ],
    };
  },
});

defineProblem("am-scheme", {
  topic: "Choosing a modulation scheme",
  lookup: "Electrical → Communications → DSB-SC and SSB",
  make(rng) {
    const q = rng.pick(["ssb", "why", "dsb"]);

    if (q === "ssb") {
      const fm = rng.pick([3, 3.4, 5, 15]);
      return {
        stem: `A message occupying up to ${num(fm, 1)} kHz is sent by <b>single-sideband</b>. What bandwidth does it occupy, and what is its transmission efficiency?`,
        choices: options(
          { text: `${num(fm, 1)} kHz, 100% efficient`, why: "" },
          [
            { text: `${num(2 * fm, 1)} kHz, 100% efficient`, why: `That is the bandwidth of <b>DSB-SC</b>, which also suppresses the carrier but keeps both sidebands. SSB throws one away, halving the bandwidth.` },
            { text: `${num(fm, 1)} kHz, 33% efficient`, why: `The 33% ceiling belongs to <b>full-carrier</b> AM. With the carrier suppressed there is nothing left to waste power on.` },
            { text: `${num(2 * fm, 1)} kHz, 33% efficient`, why: `Those are full-carrier AM's figures. SSB improves on both — half the bandwidth <em>and</em> all the power in the sideband.` },
          ]),
        answer: 0,
        steps: [
          `The two sidebands of a real signal are <b>mirror images</b>, so one of them carries no information the other does not.`,
          `Transmit one and the occupied band is just the message width: <b>${num(fm, 1)} kHz</b>, half what AM or DSB-SC would need.`,
          `With no carrier, <b>every watt is in the sideband: 100% efficient</b>.`,
          `<b>The cost is the receiver.</b> Without a carrier to ride on, the envelope no longer resembles the message, so the receiver must regenerate a carrier at the right frequency <em>and phase</em>. That is why SSB is used point-to-point and never for broadcasting.`,
        ],
      };
    }

    if (q === "dsb") {
      return {
        stem: `DSB-SC and full-carrier AM carry the same message over the same bandwidth. What does suppressing the carrier actually change?`,
        choices: options(
          { text: "all the power goes into the sidebands, but the receiver must regenerate the carrier", why: "" },
          [
            { text: "the bandwidth halves", why: `That is <b>SSB</b>, which removes a sideband. DSB-SC removes the <em>carrier</em> and keeps both sidebands, so the occupied band is unchanged at 2f<sub>m</sub>.` },
            { text: "nothing measurable — the carrier held no power", why: `Backwards. The carrier holds <b>most</b> of the power in full-carrier AM — at least two thirds — and none of the information.` },
            { text: "the message can be sent at a lower frequency", why: `The carrier frequency sets where the transmission sits, and suppressing the carrier does not move the sidebands. They stay at f<sub>c</sub> ± f<sub>m</sub>.` },
          ]),
        answer: 0,
        steps: [
          `The carrier is a constant sinusoid: it is identical whether the message is loud, quiet or absent, so it <b>carries no information</b>.`,
          `Removing it means the transmitter spends everything on the sidebands — <b>efficiency goes from at most 33% to 100%</b>.`,
          `<b>The bandwidth does not change</b>, because both sidebands are still there: still 2f<sub>m</sub>.`,
          `<b>What is lost is the envelope.</b> With no carrier the envelope stops resembling the message, so a diode detector no longer works and the receiver must generate its own carrier, correct in both frequency and phase.`,
        ],
      };
    }

    return {
      stem: `Broadcast AM wastes at least two thirds of its transmitted power on the carrier. Why is it still used for broadcasting?`,
      choices: options(
        { text: "the carrier lets the receiver be an envelope detector — a diode and a capacitor", why: "" },
        [
          { text: "it needs less bandwidth than the alternatives", why: `It needs <b>more</b>: 2f<sub>m</sub>, against SSB's f<sub>m</sub>. Bandwidth is not the argument.` },
          { text: "the carrier improves the signal-to-noise ratio at the receiver", why: `The carrier adds no information, so it adds no signal in the sense that matters. Spending the same power on the sidebands would do strictly better.` },
          { text: "suppressed-carrier schemes cannot carry audio", why: `They carry it perfectly well — SSB has carried voice for a century. The difficulty is entirely in the receiver.` },
        ]),
      answer: 0,
      steps: [
        `With the carrier present and m ≤ 1, the <b>envelope is the message plus a constant</b> — so recovering it needs a diode, a capacitor and a resistor.`,
        `Suppress the carrier and that stops being true: the receiver must regenerate a carrier locked in frequency <em>and phase</em>, which is far more circuitry.`,
        `<b>The economics decide it.</b> There is one transmitter and there are millions of receivers, so paying in transmitter power to make every receiver cheap is a good trade.`,
        `<b>Reverse the economics and the answer reverses.</b> Point-to-point links — one transmitter, one receiver, spectrum at a premium — use SSB, and always have.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "am",
    stem: "Reading the modulation index off a scope?",
    tool: "m = (Amax − Amin)/(Amax + Amin)",
    because: "It needs no knowledge of the transmitter — and it silently returns exactly 1 for any overmodulated signal.",
  },
  {
    part: "am",
    stem: "Bandwidth of an AM transmission?",
    tool: "2fm — both sidebands, whatever the index",
    because: "The index sets how tall the sidebands are, never where they sit, so a quiet station takes the same dial as a loud one.",
  },
  {
    part: "am",
    stem: "Total power of an AM transmitter?",
    tool: "Pt = Pc(1 + m²/2)",
    because: "Modulation only adds; the carrier never shrinks to make room for the sidebands.",
  },
  {
    part: "am",
    stem: "Antenna current under modulation?",
    tool: "It = Ic√(1 + m²/2) — note the square root",
    because: "Current goes as the root of power, and dropping the root is the standard error on this one.",
  },
  {
    part: "am",
    stem: "Best possible efficiency of full-carrier AM?",
    tool: "One third, at m = 1",
    because: "η = m²/(2 + m²), and m cannot legally exceed 1.",
  },
  {
    part: "am",
    stem: "What does SSB change relative to DSB-SC?",
    tool: "Halves the bandwidth — both are already 100% efficient",
    because: "The two sidebands are mirror images, so one is redundant. Suppressing the CARRIER is the efficiency; dropping a SIDEBAND is the bandwidth.",
  },
  {
    part: "am",
    stem: "Why keep a carrier that carries no information?",
    tool: "So the receiver can be a diode and a capacitor",
    because: "One transmitter pays so millions of receivers can be cheap. Reverse that and SSB wins.",
  },
]);

/* ==========================================================================
   Part 3 — angle modulation

   The examinable core is Carson's rule and the FM/PM distinction. The
   distractors are dropping the message frequency from Carson (giving 2 Δf),
   inverting the index, and assuming PM behaves like FM when the message
   frequency changes — which is the one thing that separates them.
   ========================================================================== */

defineProblem("fm-index", {
  topic: "FM modulation index",
  lookup: "Electrical → Communications → Frequency modulation",
  make(rng) {
    const ask = rng.pick(["beta", "beta", "dev", "null"]);

    if (ask === "null") {
      return {
        stem: `As the modulation index of an FM signal is increased from zero, the carrier line on a spectrum analyser <b>disappears completely</b> at one point. What index is that, and what does it mean?`,
        choices: options(
          { text: "β = 2.405 — all the power has moved into the sidebands", why: "" },
          [
            { text: "β = 1 — the carrier and first sideband are equal", why: `At β = 1 the carrier is J₀(1) = 0.765 and the first sideband J₁(1) = 0.440, so they are neither equal nor zero. <b>The null is where J₀ crosses zero</b>, which is at 2.405.` },
            { text: "β = 2.405 — the transmitter has run out of power", why: `The index is right, the reason is not. <b>Total power never changes in FM</b> — it is constant at Ac²/2 for every β. The carrier's power has moved into the sidebands, not vanished.` },
            { text: "it never disappears; it only gets smaller", why: `It genuinely reaches zero. J₀ is an oscillating function with real zeros, the first at 2.405, and the effect was used to calibrate deviation meters.` },
          ]),
        answer: 0,
        steps: [
          `The carrier amplitude in an FM spectrum is <b>J₀(β)</b>, the zeroth Bessel function of the index.`,
          `J₀ oscillates and crosses zero — first at <b>β = 2.405</b>, then 5.520, then 8.654.`,
          `<b>At those indices there is no power at the carrier frequency at all.</b> Since the total is fixed at Ac²/2, every watt is in the sidebands.`,
          `<b>This has a practical use.</b> Turn the modulation up until the carrier vanishes on an analyser, and you know β is exactly 2.405 — so Δf = 2.405 f<sub>m</sub>, which calibrates a deviation meter with no other reference.`,
        ],
      };
    }

    if (ask === "dev") {
      /* fm = 1 is excluded: beta*fm and beta/fm are then the same number, so
         the "divided instead of multiplied" distractor becomes the answer. */
      const beta = rng.pick([2, 3, 4, 5, 6]);
      const fm = rng.pick([3, 5, 15]);
      const dev = beta * fm;
      return {
        stem: `An FM signal has a modulation index of ${num(beta, 0)} with a ${num(fm, 0)} kHz message. What is the peak frequency deviation?`,
        choices: options(
          { text: `${num(dev, 0)} kHz`, why: "" },
          [
            { text: `${sig(beta / fm, 3)} kHz`, why: `Divided instead of multiplied. β = Δf/f<sub>m</sub>, so <b>Δf = β f<sub>m</sub></b> — the deviation is larger than the message frequency whenever β exceeds 1.` },
            { text: `${num(fm, 0)} kHz`, why: `That is the message frequency, which is given. The deviation is β times it.` },
            { text: `${num(2 * dev, 0)} kHz`, why: `That is the <b>peak-to-peak</b> swing, or Carson's rule with f<sub>m</sub> dropped. Δf is the deviation <em>either side</em> of the carrier.` },
          ]),
        answer: 0,
        steps: [
          D(`\\beta = \\frac{\\Delta f}{f_m} \\ \\Longrightarrow \\ \\Delta f = \\beta f_m = ${num(beta, 0)}(${num(fm, 0)}) = ${num(dev, 0)}\\text{ kHz}`),
          `<b>${num(dev, 0)} kHz.</b> The carrier swings that far <em>either side</em> of its rest frequency, so it sweeps a total of ${num(2 * dev, 0)} kHz.`,
          `<b>Deviation is set by the message's amplitude, not its pitch.</b> Turn the volume up and Δf grows; play a higher note at the same volume and Δf stays put while β falls.`,
        ],
      };
    }

    /* Drawn so that Δf never equals fm: at beta = 1 the index and its
       reciprocal are the same number and the "upside down" distractor
       collapses onto the answer. */
    const fm = rng.pick([3, 5, 10, 15]);
    const dev = fm * rng.pick([0.25, 2, 3, 5]);
    const beta = dev / fm;
    return {
      stem: `An FM transmitter deviates ±${num(dev, 0)} kHz on a ${num(fm, 0)} kHz message. What is the modulation index?`,
      choices: options(
        { text: fixed(beta, 3), why: "" },
        [
          { text: fixed(fm / dev, 3), why: `Upside down. <b>β = Δf/f<sub>m</sub></b> — deviation on top. A large deviation on a low message frequency gives a <em>large</em> index.` },
          { text: fixed(dev, 0), why: `That is the deviation in kHz. The index is <b>dimensionless</b>, being a ratio of two frequencies.` },
          { text: fixed(2 * (dev + fm), 0), why: `That is Carson's bandwidth in kHz, not the index.` },
        ]),
      answer: 0,
      steps: [
        D(`\\beta = \\frac{\\Delta f}{f_m} = \\frac{${num(dev, 0)}}{${num(fm, 0)}} = ${fixed(beta, 3)}`),
        `<b>β = ${fixed(beta, 3)}</b>, which is ${beta < 0.3 ? "<b>narrowband</b> — the spectrum is essentially AM's, and none of FM's noise advantage is available." : beta > 3 ? "comfortably <b>wideband</b>, so the bandwidth is close to 2Δf and the noise advantage is substantial." : "in the middle: several significant sideband pairs, and Carson's rule earns its keep."}`,
        `<b>β is dimensionless and it is the only number the spectrum depends on.</b> Two transmitters with the same β have the same sideband pattern, whatever their actual frequencies.`,
      ],
    };
  },
});

defineProblem("fm-bandwidth", {
  topic: "Carson's rule",
  lookup: "Electrical → Communications → Carson's rule / FM bandwidth",
  make(rng) {
    /* Parameterised by beta rather than by an independent deviation: with
       Δf and fm drawn separately, Δf = fm collapses "Δf + fm" onto "2Δf"
       and onto "2fm", and Δf = 25 fm puts 2Δf within 4% of the answer.
       Fixing beta >= 2 rules out every one of those. */
    const fm = rng.pick([3, 5, 10, 15]);
    const beta = rng.pick([2, 3, 4, 5]);
    const dev = beta * fm;
    const bw = carson(dev, fm);
    const ask = rng.pick(["bw", "bw", "vsam"]);

    if (ask === "vsam") {
      const amBw = 2 * fm;
      return {
        stem: `A ${num(fm, 0)} kHz message is sent by FM with ±${num(dev, 0)} kHz deviation. How much more spectrum does it use than plain AM would?`,
        choices: options(
          { text: `${fixed(bw / amBw, 2)} times as much`, why: "" },
          [
            { text: `${fixed(dev / fm, 2)} times as much`, why: `That is the index β, not the bandwidth ratio. Carson's rule adds f<sub>m</sub> to the deviation before doubling, so the ratio is (Δf + f<sub>m</sub>)/f<sub>m</sub> = β + 1.` },
            { text: "the same — both are 2fm", why: `Only if β were far below 1. Here β = ${fixed(beta, 2)}, so the deviation dominates and the bandwidth is much wider.` },
            { text: `${fixed(bw / fm, 2)} times as much`, why: `Divided by f<sub>m</sub> rather than by AM's bandwidth. <b>AM needs 2f<sub>m</sub></b>, not f<sub>m</sub>.` },
          ]),
        answer: 0,
        steps: [
          D(`\\text{FM: } 2(\\Delta f + f_m) = 2(${num(dev, 0)} + ${num(fm, 0)}) = ${num(bw, 0)}\\text{ kHz}`),
          D(`\\text{AM: } 2f_m = ${num(amBw, 0)}\\text{ kHz}`),
          `<b>${fixed(bw / amBw, 2)} times as much</b>, which is just β + 1 = ${fixed(beta, 2)} + 1.`,
          `<b>And that is the trade.</b> The extra spectrum buys a signal-to-noise improvement going roughly as β², so ${fixed(bw / amBw, 2)}× the bandwidth returns about ${fixed(beta * beta, 0)}× the output SNR — at no extra transmitter power.`,
        ],
      };
    }

    return {
      stem: `An FM signal deviates ±${num(dev, 0)} kHz on a message reaching ${num(fm, 0)} kHz. What bandwidth does Carson's rule give?`,
      choices: options(
        { text: `${num(bw, 0)} kHz`, why: "" },
        [
          { text: `${num(2 * dev, 0)} kHz`, why: `The message frequency was dropped. <b>Carson's rule is 2(Δf + f<sub>m</sub>)</b>, not 2Δf — the second term matters whenever β is not large.` },
          { text: `${num(dev + fm, 0)} kHz`, why: `The factor of two is missing. The signal occupies that span <em>either side</em> of the carrier.` },
          { text: `${num(2 * fm, 0)} kHz`, why: `That is AM's bandwidth. FM's is much wider unless β is well below 1, and here β = ${fixed(beta, 2)}.` },
          { text: `${num(2 * dev * fm, 0)} kHz`, why: `Multiplied rather than added. Check the units — you cannot add a product of two frequencies to a bandwidth.` },
        ]),
      answer: 0,
      steps: [
        D(`\\text{BW} = 2(\\Delta f + f_m) = 2(${num(dev, 0)} + ${num(fm, 0)}) = ${num(bw, 0)}\\text{ kHz}`),
        `<b>${num(bw, 0)} kHz</b>, which holds about 98% of the transmitted power — the spectrum genuinely extends further, but not usefully so.`,
        `Equivalently 2f<sub>m</sub>(β + 1) with β = ${fixed(beta, 2)}: ${D(`2(${num(fm, 0)})(${fixed(beta, 2)} + 1) = ${num(bw, 0)}\\text{ kHz}`)}`,
        `<b>Both forms are the same equation</b>, and the exam uses whichever matches the data it gives you.`,
      ],
    };
  },
});

defineProblem("fm-vs-pm", {
  topic: "FM against PM",
  lookup: "Electrical → Communications → Phase modulation",
  make(rng) {
    const q = rng.pick(["pitch", "pitch", "which"]);

    if (q === "pitch") {
      const fm1 = rng.pick([1, 2, 3]);
      const f = rng.pick([2, 3, 4]);
      const fm2 = fm1 * f;
      const isFm = rng.chance(0.5);
      return {
        stem: `A message tone at ${num(fm1, 0)} kHz is replaced by one at ${num(fm2, 0)} kHz <b>at the same amplitude</b>. In a <b>${isFm ? "frequency" : "phase"}</b>-modulated transmitter, what happens to the modulation index?`,
        choices: options(
          { text: isFm ? `it falls by a factor of ${num(f, 0)}` : "it does not change", why: "" },
          [
            { text: isFm ? "it does not change" : `it falls by a factor of ${num(f, 0)}`,
              why: isFm
                ? `That is what <b>phase</b> modulation does. In FM the index is Δf/f<sub>m</sub>, and the deviation is fixed by the message's <em>amplitude</em> — so raising f<sub>m</sub> with the amplitude unchanged divides β by ${num(f, 0)}.`
                : `That is what <b>frequency</b> modulation does. In PM the index is k<sub>p</sub>A<sub>m</sub>, which contains no f<sub>m</sub> at all.` },
            { text: `it rises by a factor of ${num(f, 0)}`, why: `Nothing here rises. In FM β falls with pitch; in PM it is unchanged. <b>What rises with pitch in PM is the deviation</b>, Δf = βf<sub>m</sub>, and hence the bandwidth.` },
            { text: "it depends on the carrier frequency", why: `The carrier frequency never enters the index in either scheme — it only says where on the dial the spectrum sits.` },
          ]),
        answer: 0,
        steps: [
          isFm
            ? `<b>FM: β = Δf/f<sub>m</sub>.</b> The deviation is set by how <em>loud</em> the message is, not how high, so it is unchanged when only the pitch rises.`
            : `<b>PM: β = k<sub>p</sub>A<sub>m</sub>.</b> There is no f<sub>m</sub> in that expression at all — the index depends only on how loud the message is.`,
          isFm
            ? D(`\\beta_2 = \\frac{\\Delta f}{${num(fm2, 0)}} = \\frac{1}{${num(f, 0)}}\\cdot\\frac{\\Delta f}{${num(fm1, 0)}} = \\frac{\\beta_1}{${num(f, 0)}}`)
            : D(`\\beta_2 = k_p A_m = \\beta_1`),
          isFm
            ? `<b>β falls by a factor of ${num(f, 0)}.</b> Note what that does to bandwidth: Carson gives 2(Δf + f<sub>m</sub>), and only the small f<sub>m</sub> term grew — so an FM signal's bandwidth is <b>almost independent of the message pitch</b>.`
            : `<b>The index does not change.</b> But the deviation does: Δf = βf<sub>m</sub> is now ${num(f, 0)} times larger, so Carson's bandwidth grows roughly ${num(f, 0)}-fold. <b>A PM signal's bandwidth rises with message pitch; an FM signal's barely moves.</b>`,
          `<b>This is the distinction the exam tests</b>, and it is the only one that separates two schemes which otherwise produce identical-looking waveforms.`,
        ],
      };
    }

    return {
      stem: `Why can an FM receiver discard amplitude variations entirely, when an AM receiver cannot?`,
      choices: options(
        { text: "because an FM signal's amplitude is constant, so any variation in it is not signal", why: "" },
        [
          { text: "because FM uses a higher carrier frequency", why: `Carrier frequency has nothing to do with it — FM and AM are used across the same bands. It is the <b>constant envelope</b> that matters.` },
          { text: "because FM transmits more power", why: `It does not. FM's total power is Ac²/2 whatever the modulation, exactly as an unmodulated carrier would be.` },
          { text: "because FM sidebands are narrower", why: `They are wider, not narrower — that is the cost of FM, not its mechanism.` },
        ]),
      answer: 0,
      steps: [
        `In FM the message is in the <b>angle</b>, and the amplitude A<sub>c</sub> never changes. So <b>any amplitude variation arriving at the receiver is, by definition, not part of the signal.</b>`,
        `A <b>limiter</b> — a stage that clips the waveform flat — therefore removes noise without removing information. In AM the same stage would remove the message itself.`,
        `<b>Two consequences follow.</b> The capture effect: of two FM signals on one frequency the stronger is demodulated and the weaker almost vanishes, where two AM signals would simply add. And a <b>threshold</b>: below about 10 dB carrier-to-noise the advantage collapses abruptly, which is why weak FM goes silent while weak AM merely gets scratchy.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "fm",
    stem: "Modulation index of an FM signal?",
    tool: "β = Δf/fm — deviation over message frequency",
    because: "It is dimensionless and it is the only thing the sideband pattern depends on.",
  },
  {
    part: "fm",
    stem: "Carson's rule?",
    tool: "BW = 2(Δf + fm) = 2fm(β + 1)",
    because: "Dropping the fm term is the standard error, and it matters whenever β is not large.",
  },
  {
    part: "fm",
    stem: "Message pitch doubles at the same volume. What happens to β?",
    tool: "FM: β halves. PM: β is unchanged",
    because: "This is the only question that distinguishes the two, and it is the one the exam asks.",
  },
  {
    part: "fm",
    stem: "At what index does an FM carrier disappear?",
    tool: "β = 2.405 — the first zero of J₀",
    because: "Total power is unchanged; it has all moved into the sidebands. Used to calibrate deviation meters.",
  },
  {
    part: "fm",
    stem: "How does total transmitted power vary with FM modulation?",
    tool: "It does not — always Ac²/2",
    because: "The amplitude is constant. FM redistributes power among sidebands; AM adds power on top of the carrier.",
  },
  {
    part: "fm",
    stem: "Broadcast FM's deviation, message bandwidth, index and channel width?",
    tool: "75 kHz, 15 kHz, β = 5, BW = 180 kHz in a 200 kHz channel",
    because: "One worked set of numbers to anchor every other FM bandwidth question.",
  },
  {
    part: "fm",
    stem: "Where does FM's noise immunity come from?",
    tool: "Constant envelope — a limiter can throw amplitude away",
    because: "It also gives the capture effect and a hard threshold near 10 dB carrier-to-noise.",
  },
]);

/* ==========================================================================
   Part 4 — PCM and the digital link

   Three questions carry almost all of this part: the bit rate (a
   multiplication), the channel it needs (a division), and the SNR (one
   formula with a condition attached). The distractors are the errors that
   actually happen — confusing the two Nyquist theorems, dropping the 1.76,
   using the number of levels where the number of bits belongs, and treating
   M itself as log2 M.
   ========================================================================== */

defineProblem("pcm-rate", {
  topic: "PCM bit rate and framing",
  lookup: "Electrical → Communications → Pulse code modulation",
  make(rng) {
    const ask = rng.pick(["rate", "rate", "nyq", "t1"]);

    if (ask === "t1") {
      const line = 193 * 8000;
      return {
        stem: `A T1 carrier multiplexes <b>24</b> voice channels. Each is sampled at 8 kHz and coded to 8 bits, and every frame carries one sample from each channel plus a <b>single framing bit</b>. What is the line rate?`,
        choices: options(
          { text: "1.544 Mbit/s", why: "" },
          [
            { text: "1.536 Mbit/s", why: `That is the <b>payload</b>, 24 × 64 kbit/s. It leaves out the framing bit — 8000 more bits a second, which is only 0.52% but is the difference between the two numbers the exam quotes.` },
            { text: "2.048 Mbit/s", why: `That is <b>E1</b>, Europe's carrier: 32 slots of 8 bits at 8000 frames per second, with two whole slots for framing and signalling rather than one bit. Recognising which is which is worth a mark on its own.` },
            { text: "37.056 Mbit/s", why: `Multiplied by 24 twice. The 24 channels are already inside the 193-bit frame; the frame rate is <b>8000</b>, not 24 × 8000.` },
          ]),
        answer: 0,
        steps: [
          D(`\\text{bits per frame} = 24(8) + 1 = 193`),
          `<b>The frame rate is the sample rate.</b> Each channel contributes one sample per frame and is sampled 8000 times a second, so there are 8000 frames per second — not 24 × 8000.`,
          D(`R_b = 193 \\times 8000 = 1{,}544{,}000\\text{ bit/s}`),
          `<b>1.544 Mbit/s exactly</b>, and worth recognising on sight. The framing costs 8 kbit/s, or ${fixed(100 * 8000 / line, 2)}% — cheap for the ability to find the frame boundary at all.`,
        ],
      };
    }

    if (ask === "nyq") {
      /* B is given, not fs: the point is that the sample rate has to be
         derived before the multiplication can happen. */
      const B = rng.pick([4, 5, 10, 20]);
      const n = rng.pick([6, 8, 10, 12]);
      const fs = 2 * B;
      const Rb = fs * n;
      return {
        stem: `A message band-limited to <b>${num(B, 0)} kHz</b> is sampled at the Nyquist rate and each sample is coded to <b>${num(n, 0)} bits</b>. What is the resulting bit rate?`,
        choices: options(
          { text: `${num(Rb, 0)} kbit/s`, why: "" },
          [
            { text: `${num(B * n, 0)} kbit/s`, why: `The message bandwidth was used as the sample rate. <b>Nyquist requires f<sub>s</sub> ≥ 2B</b>, so the sample rate is ${num(fs, 0)} kHz, twice what was used here.` },
            { text: `${num(4 * B * n, 0)} kbit/s`, why: `Doubled twice. f<sub>s</sub> = 2B = ${num(fs, 0)} kHz, and R<sub>b</sub> = n f<sub>s</sub> — there is no second factor of two.` },
            { text: `${num(fs, 0)} kbit/s`, why: `That is the sample rate in <em>samples</em> per second. Each sample carries ${num(n, 0)} bits, so the bit rate is ${num(n, 0)} times larger.` },
          ]),
        answer: 0,
        steps: [
          D(`f_s = 2B = 2(${num(B, 0)}) = ${num(fs, 0)}\\text{ kHz}`),
          D(`R_b = n f_s = ${num(n, 0)}(${num(fs, 0)}) = ${num(Rb, 0)}\\text{ kbit/s}`),
          `<b>${num(Rb, 0)} kbit/s.</b> Note what this does to the spectrum: sent in binary it needs R<sub>b</sub>/2 = ${num(Rb / 2, 0)} kHz of channel, against ${num(B, 0)} kHz as analog — <b>exactly n times wider</b>, which is what binary PCM always costs.`,
        ],
      };
    }

    /* n >= 4 keeps 2^n away from 2n, which would make two distractors the
       same number. */
    const fs = rng.pick([8, 20, 44.1, 48]);
    const n = rng.pick([4, 8, 10, 12, 16]);
    const Rb = fs * n;
    return {
      stem: `An analog-to-digital converter samples at <b>${num(fs, 1)} kHz</b> and produces <b>${num(n, 0)}-bit</b> words. What bit rate must the link carry?`,
      choices: options(
        { text: `${num(Rb, 1)} kbit/s`, why: "" },
        [
          { text: `${num(fs, 1)} kbit/s`, why: `That is the sample rate — the number of <em>samples</em> per second. Each one carries ${num(n, 0)} bits, so the bit rate is ${num(n, 0)} times larger.` },
          { text: `${num(Rb / 2, 1)} kbit/s`, why: `That is the minimum <em>channel bandwidth</em> in kHz for binary signalling, R<sub>b</sub>/2 — a different quantity, and the next step after this one.` },
          { text: `${num(2 * Rb, 1)} kbit/s`, why: `A factor of two too many. The Nyquist factor is already inside f<sub>s</sub>; it does not get applied again to the bit rate.` },
        ]),
      answer: 0,
      steps: [
        D(`R_b = n f_s = ${num(n, 0)} \\times ${num(fs, 1)} = ${num(Rb, 1)}\\text{ kbit/s}`),
        `<b>${num(Rb, 1)} kbit/s.</b> Bits per sample times samples per second, and nothing else enters it.`,
        `<b>The number of levels is a trap here.</b> ${num(n, 0)} bits means ${num(2 ** n, 0)} levels, and the level count is what sets the quantisation error — but what goes down the wire is ${num(n, 0)} bits.`,
      ],
    };
  },
});

defineProblem("pcm-snr", {
  topic: "Quantisation SNR and bit count",
  lookup: "Electrical → Communications → Quantisation noise / companding",
  make(rng) {
    const ask = rng.pick(["direct", "bits", "level", "compand"]);

    if (ask === "level") {
      const n = rng.pick([8, 10, 12]);
      const down = rng.pick([20, 30, 40]);
      const full = pcmSnrUniform(n);
      return {
        stem: `A ${num(n, 0)}-bit uniform quantiser gives ${fixed(full, 1)} dB of signal-to-noise ratio for a full-scale sinusoid. What does it give for a signal <b>${num(down, 0)} dB below full scale</b>?`,
        choices: options(
          { text: `${fixed(full - down, 1)} dB`, why: "" },
          [
            { text: `${fixed(full, 1)} dB — unchanged`, why: `Only if the quantiser were companded. <b>A uniform quantiser's step size is fixed</b>, so the noise stays put while the signal shrinks, and the ratio falls with the signal.` },
            { text: `${fixed(full - down / 6.02, 1)} dB`, why: `The level drop was converted to bits first. It should not be — <b>the SNR falls one decibel per decibel</b>, directly, because the noise power does not move at all.` },
            { text: `${fixed(full + down, 1)} dB`, why: `The wrong way. A quieter signal against the same noise floor is a <em>worse</em> ratio, not a better one.` },
          ]),
        answer: 0,
        steps: [
          `<b>The quantiser's noise does not depend on the signal.</b> The step size Δ is fixed by the full-scale range and the bit count, so the error power Δ²/12 is the same for a whisper as for a shout.`,
          D(`\\text{SNR} = 6.02n + 1.76 + L = ${fixed(full, 2)} - ${num(down, 0)} = ${fixed(full - down, 2)}\\text{ dB}`),
          `<b>${fixed(full - down, 1)} dB</b> — the 6.02n + 1.76 figure is a full-scale number, and that condition is the whole reason companding exists.`,
          `<b>Speech spends almost all its time here</b>, ${num(down, 0)} dB or more below full scale. Optimising the full-scale case optimises a case that never occurs.`,
        ],
      };
    }

    if (ask === "compand") {
      return {
        stem: `Why does telephone PCM compand — µ-law in North America, A-law in Europe — rather than quantise uniformly?`,
        choices: options(
          { text: "to hold the SNR roughly constant as the signal level varies", why: "" },
          [
            { text: "to reduce the bit rate needed for the same quality", why: `The bit rate is unchanged — 8 bits a sample either way. <b>Companding redistributes the same 256 levels</b>; it does not remove any.` },
            { text: "to reduce the channel bandwidth", why: `The bandwidth follows the bit rate, and the bit rate has not moved. Companding is a quantiser decision, not a channel one.` },
            { text: "to prevent aliasing of the high-frequency components", why: `Aliasing is prevented by the anti-alias filter and the sample rate, both settled before the quantiser sees anything. Companding acts on <em>amplitude</em>, not frequency.` },
          ]),
        answer: 0,
        steps: [
          `<b>A uniform quantiser's SNR is a full-scale figure</b>: 6.02n + 1.76, falling a decibel for every decibel the signal drops. At 8 bits that is 49.9 dB at full scale and 19.9 dB thirty decibels down.`,
          `Compressing before the quantiser makes the effective step size small for small signals and large for large ones. <b>At µ = 255 the smallest signals get 1 + µ = 256 times the resolution of the largest.</b>`,
          D(`\\text{SNR} \\approx 6.02n + 4.77 - 20\\log_{10}\\left[\\ln(1+\\mu)\\right] \\approx ${fixed(pcmSnrCompanded(8, 255), 1)}\\text{ dB at } n = 8`),
          `<b>Flat, at about 38 dB, across the whole range.</b> Roughly 12 dB was given up at a full scale nothing reaches, to gain about 18 dB where every conversation actually sits.`,
        ],
      };
    }

    if (ask === "bits") {
      /* Targets chosen so that dropping the 1.76 dB term changes the answer —
         otherwise the commonest error and the correct method agree and the
         distractor is not wrong. */
      const target = rng.pick([31, 43, 49, 61, 73, 85]);
      const right = Math.ceil((target - 1.76) / 6.02);
      const dropped = Math.ceil(target / 6.02);
      const threeDb = Math.ceil((target - 1.76) / 3.01);
      return {
        stem: `A design calls for at least <b>${num(target, 0)} dB</b> of signal-to-noise ratio from a uniform quantiser at full scale. What is the smallest number of bits that will do?`,
        choices: options(
          { text: `${num(right, 0)} bits`, why: "" },
          [
            { text: `${num(dropped, 0)} bits`, why: `The 1.76 dB term was dropped. It is worth almost a third of a bit, and here it is <b>exactly the difference between ${num(right, 0)} bits and ${num(dropped, 0)}</b> — the formula is 6.02n + 1.76, not 6n.` },
            { text: `${num(threeDb, 0)} bits`, why: `Three decibels a bit rather than six. <b>Each bit doubles the number of levels</b>, which halves the step and quarters the noise <em>power</em> — a factor of four, which is 6 dB, not 3.` },
            { text: `${num(right - 1, 0)} bits`, why: `One short: ${num(right - 1, 0)} bits gives ${fixed(pcmSnrUniform(right - 1), 1)} dB, below the ${num(target, 0)} dB required. <b>Round up</b> — you cannot buy a fraction of a bit.` },
          ]),
        answer: 0,
        steps: [
          D(`6.02n + 1.76 \\geq ${num(target, 0)} \\ \\Longrightarrow \\ n \\geq \\frac{${num(target, 0)} - 1.76}{6.02} = ${fixed((target - 1.76) / 6.02, 2)}`),
          `<b>Round up to ${num(right, 0)} bits</b>, giving ${fixed(pcmSnrUniform(right), 1)} dB. ${num(right - 1, 0)} bits would give only ${fixed(pcmSnrUniform(right - 1), 1)} dB.`,
          `<b>Always round up.</b> The formula gives what n bits deliver; a requirement is a floor, so any fractional bit becomes a whole one.`,
        ],
      };
    }

    const n = rng.pick([6, 8, 10, 12, 14]);
    const snr = pcmSnrUniform(n);
    return {
      stem: `What signal-to-noise ratio does a <b>${num(n, 0)}-bit</b> uniform quantiser give a full-scale sinusoid?`,
      choices: options(
        { text: `${fixed(snr, 1)} dB`, why: "" },
        [
          { text: `${fixed(6.02 * n, 1)} dB`, why: `The <b>1.76 dB</b> was dropped. It comes from the ratio between a sinusoid's RMS and the quantiser's full-scale peak, and it is on the handbook page with the rest of the formula.` },
          { text: `${fixed(3.01 * n + 1.76, 1)} dB`, why: `Three decibels a bit. A bit halves the step size, which <b>quarters the error power</b> — a factor of four in power is 6.02 dB.` },
          { text: `${fixed(1.76 * n, 1)} dB`, why: `The two coefficients have been swapped. <b>6.02 multiplies n; 1.76 is a constant offset</b> and does not scale with the bit count.` },
        ]),
      answer: 0,
      steps: [
        D(`\\text{SNR} = 6.02n + 1.76 = 6.02(${num(n, 0)}) + 1.76 = ${fixed(snr, 2)}\\text{ dB}`),
        `<b>${fixed(snr, 1)} dB</b>, and the useful way to hold it is <b>six decibels a bit</b> — ${num(n, 0)} bits, about ${num(6 * n, 0)} dB, plus a couple.`,
        `<b>Read the condition.</b> This is the figure for a sinusoid at <em>full scale</em>. Drop the signal 20 dB and the ratio drops 20 dB with it, because the quantiser's noise never moves.`,
      ],
    };
  },
});

defineProblem("pcm-bandwidth", {
  topic: "Channel bandwidth for a PCM link",
  lookup: "Electrical → Communications → Nyquist signalling rate",
  make(rng) {
    const ask = rng.pick(["binary", "binary", "mary", "expand"]);

    if (ask === "mary") {
      /* M = 2 is excluded: log2 M = 1 = M/2 there, which collapses the
         "used M instead of log2 M" distractor onto the answer. */
      const M = rng.pick([4, 8, 16]);
      const Rb = rng.pick([64, 128, 256]);
      const k = Math.log2(M);
      const B = Rb / (2 * k);
      return {
        stem: `A <b>${num(Rb, 0)} kbit/s</b> stream is sent using <b>${num(M, 0)}-level</b> symbols. What is the minimum channel bandwidth?`,
        choices: options(
          { text: `${num(B, 1)} kHz`, why: "" },
          [
            { text: `${num(Rb / 2, 1)} kHz`, why: `That is the <b>binary</b> answer. With ${num(M, 0)} levels each symbol carries log₂${num(M, 0)} = ${num(k, 0)} bits, so the symbol rate — and the bandwidth — is ${num(k, 0)} times lower.` },
            { text: `${num(Rb / (2 * M), 1)} kHz`, why: `M was used where log₂M belongs. <b>${num(M, 0)} levels carry ${num(k, 0)} bits per symbol, not ${num(M, 0)}</b> — the alphabet size and the information per symbol are not the same number.` },
            { text: `${num((Rb * k) / 2, 1)} kHz`, why: `Multiplied instead of divided. More levels per symbol means <em>fewer</em> symbols for the same bits, so the bandwidth goes down.` },
          ]),
        answer: 0,
        steps: [
          `Each ${num(M, 0)}-level symbol carries ${D(`\\log_2 ${num(M, 0)} = ${num(k, 0)}`)} bits, so the symbol rate is ${num(Rb, 0)}/${num(k, 0)} = ${num(Rb / k, 0)} kbaud.`,
          D(`B_{\\min} = \\frac{R_s}{2} = \\frac{R_b}{2\\log_2 M} = \\frac{${num(Rb, 0)}}{2(${num(k, 0)})} = ${num(B, 1)}\\text{ kHz}`),
          `<b>${num(B, 1)} kHz</b>, which is ${num(k, 0)} times narrower than binary would need.`,
          `<b>This looks like a free lunch and it is not.</b> Packing ${num(M, 0)} levels into the same voltage range puts them ${num(M - 1, 0)} gaps apart instead of one, so each is far easier for noise to cross. Bandwidth was traded for signal-to-noise, and Shannon prices that trade.`,
        ],
      };
    }

    if (ask === "expand") {
      const Bm = 3.4, fs = 8, n = 8;
      const Rb = fs * n;
      const Bc = Rb / 2;
      return {
        stem: `Telephone speech occupies <b>3.4 kHz</b> as an analog signal. Digitised at 8 kHz and 8 bits and sent in binary, how much channel bandwidth does the same conversation need?`,
        choices: options(
          { text: `${num(Bc, 0)} kHz — about ${fixed(Bc / Bm, 1)} times as much`, why: "" },
          [
            { text: `${num(Rb, 0)} kHz — about ${fixed(Rb / Bm, 1)} times as much`, why: `The bit rate was used directly as a bandwidth. <b>Nyquist's signalling limit gives 2 bits per second per hertz in binary</b>, so the channel needs only R<sub>b</sub>/2.` },
            { text: `${num(fs, 0)} kHz — the sample rate`, why: `That is the sampling frequency, not a channel bandwidth. Sampling happens at the source; the channel has to carry all ${num(n, 0)} bits of every one of those samples.` },
            { text: `${num(Bm, 1)} kHz — digitising does not change it`, why: `It changes it a great deal. <b>Binary PCM costs a factor of about n</b>, and that expansion is the price paid for regenerative repeaters.` },
          ]),
        answer: 0,
        steps: [
          D(`R_b = n f_s = 8 \\times 8 = 64\\text{ kbit/s}`),
          D(`B_{\\min} = \\frac{R_b}{2} = 32\\text{ kHz}`),
          `<b>${fixed(Bc / Bm, 2)} times the analog channel.</b> A conversation that fitted in 3.4 kHz now wants 32.`,
          `<b>That is the bargain PCM offers.</b> It buys a repeater that regenerates the bits exactly rather than amplifying accumulated noise — so a thousand-mile digital route is as clean as one mile, which no analog link achieves at any bandwidth.`,
        ],
      };
    }

    const fs = rng.pick([8, 20, 44.1]);
    const n = rng.pick([8, 10, 12, 16]);
    const Rb = fs * n;
    const B = Rb / 2;
    return {
      stem: `A PCM link samples at <b>${num(fs, 1)} kHz</b> with <b>${num(n, 0)} bits</b> per sample and signals in binary. What is the minimum channel bandwidth?`,
      choices: options(
        { text: `${num(B, 1)} kHz`, why: "" },
        [
          { text: `${num(Rb, 1)} kHz`, why: `The bit rate quoted as a bandwidth. <b>Nyquist's signalling theorem gives 2B symbols per second in a bandwidth B</b>, so a binary link needs only half its bit rate in hertz.` },
          { text: `${num(2 * Rb, 1)} kHz`, why: `Multiplied by two instead of divided. Doubling appears in the <em>sampling</em> theorem, at the other end of the chain.` },
          { text: `${num(fs / 2, 1)} kHz`, why: `That is half the sample rate — the message bandwidth the sampler was designed for, not the channel the coded bits need. Those differ by a factor of n.` },
        ]),
      answer: 0,
      steps: [
        D(`R_b = n f_s = ${num(n, 0)}(${num(fs, 1)}) = ${num(Rb, 1)}\\text{ kbit/s}`),
        D(`B_{\\min} = \\frac{R_b}{2} = ${num(B, 1)}\\text{ kHz}`),
        `<b>${num(B, 1)} kHz.</b> The two halves of this are two different Nyquist theorems: <b>f<sub>s</sub> ≥ 2B</b> governs the sampler, and <b>R<sub>s</sub> ≤ 2B</b> governs the channel. Mixing them up is the standard way to be out by a factor of two or four.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "pcm",
    stem: "Bit rate of a PCM link?",
    tool: "Rb = n·fs — bits per sample times samples per second",
    because: "Everything else in the part is downstream of this one multiplication.",
  },
  {
    part: "pcm",
    stem: "Minimum channel bandwidth for a bit rate Rb?",
    tool: "Rb/2 binary; Rb/(2 log₂M) with M levels",
    because: "Nyquist's SIGNALLING limit, not his sampling one. Using M instead of log₂M is the standard slip.",
  },
  {
    part: "pcm",
    stem: "How much wider is binary PCM than the analog message?",
    tool: "About n times — n bits each need room",
    because: "A Nyquist-sampled B-hertz message needs nB hertz. Telephony: 3.4 kHz becomes 32 kHz.",
  },
  {
    part: "pcm",
    stem: "DS0, T1 and E1 rates?",
    tool: "64 kbit/s; 193 × 8000 = 1.544 Mbit/s; 2.048 Mbit/s",
    because: "The frame rate is the sample rate, 8000/s. T1 is 24×8+1 bits; E1 is 32 slots of 8.",
  },
  {
    part: "pcm",
    stem: "Quantisation SNR, and its condition?",
    tool: "6.02n + 1.76 dB — at FULL SCALE",
    because: "It falls a decibel per decibel as the signal drops, which is the entire argument for companding.",
  },
  {
    part: "pcm",
    stem: "What does companding do, and what does it cost?",
    tool: "Holds SNR flat at ~38 dB (8 bits); costs ~12 dB at full scale",
    because: "µ = 255 in North America, A = 87.6 in Europe, within 0.11 dB of each other.",
  },
  {
    part: "pcm",
    stem: "Why digitise at all, given the bandwidth cost?",
    tool: "Regenerative repeaters — noise is discarded, not accumulated",
    because: "No analog link can do this at any bandwidth or power. It is the only reason the expansion is worth paying.",
  },
]);

/* ==========================================================================
   Part 5 — digital communications

   Three things carry the part: what a constellation costs, what Shannon
   permits, and which of the two bounds is the binding one. The distractors
   are the errors that actually happen — using S/N in decibels inside
   Shannon's logarithm, dropping the k = log2 M factor between Es/N0 and
   Eb/N0, losing the 2 in Nyquist's 2B log2 M, and taking M where log2 M
   belongs.
   ========================================================================== */

defineProblem("dig-modulation", {
  topic: "Digital modulation and symbol rate",
  lookup: "Electrical → Communications → Digital modulation (ASK, FSK, PSK, QAM)",
  make(rng) {
    const ask = rng.pick(["esn0", "rate", "qpsk", "pick"]);

    if (ask === "qpsk") {
      return {
        stem: `Compared with BPSK at the <b>same E<sub>b</sub>/N<sub>0</sub></b>, what does QPSK achieve?`,
        choices: options(
          { text: "twice the bit rate in the same bandwidth, at the same bit error rate", why: "" },
          [
            { text: "twice the bit rate, at a worse bit error rate", why: `The rate is right and the penalty is not. QPSK's two bits ride on <b>cos and sin of the same carrier</b>, which are orthogonal, so the receiver separates them perfectly. The bit error rate is <em>identical</em> to BPSK's — not close to it.` },
            { text: "the same bit rate at half the error rate", why: `The rate is what changes, not the reliability. Two bits per symbol at the same symbol rate is twice the bits per second.` },
            { text: "twice the bit rate, needing 3 dB more power", why: `That is the cost of going to 8-PSK, where the points genuinely crowd. <b>QPSK is the one step up that is free</b>, because the two carriers do not interfere at all.` },
          ]),
        answer: 0,
        steps: [
          `<b>QPSK is two independent BPSK links sharing one channel.</b> One bit modulates cos(2πf<sub>c</sub>t) and the other sin(2πf<sub>c</sub>t), and those two are orthogonal over a symbol period.`,
          `Because they do not interfere, each is demodulated exactly as if the other were not there — so each sees the BPSK error rate: ${T(`P_b = Q\\!\\left(\\sqrt{2E_b/N_0}\\right)`)}.`,
          `<b>Two bits per symbol at the same symbol rate is twice the bit rate in the same bandwidth, for nothing.</b>`,
          `<b>This is why QPSK is the default.</b> Every step beyond it — 8-PSK, 16-QAM — does cost power, because the constellation points genuinely have to crowd together.`,
        ],
      };
    }

    if (ask === "pick") {
      const q = rng.pick(["envelope", "power"]);
      if (q === "envelope") {
        return {
          stem: `A transmitter uses a <b>saturating (non-linear) power amplifier</b> for efficiency. Which modulation is unsuitable?`,
          choices: options(
            { text: "16-QAM, because its symbols differ in amplitude", why: "" },
            [
              { text: "FSK, because its frequency changes", why: `FSK is fine — its envelope is constant, which is exactly what a saturating amplifier needs. Changing frequency costs bandwidth, not linearity.` },
              { text: "QPSK, because it carries two bits per symbol", why: `QPSK is fine. All four of its symbols have the <b>same amplitude</b>, so clipping does not destroy any information. Bits per symbol has nothing to do with it.` },
              { text: "BPSK, because the phase reverses", why: `A phase reversal is not an amplitude change. BPSK has a constant envelope and is the most robust choice of all.` },
            ]),
          answer: 0,
          steps: [
            `<b>A saturating amplifier flattens amplitude variation.</b> That is harmless if the amplitude carries nothing, and fatal if it does.`,
            `BPSK, QPSK and FSK all have <b>constant envelopes</b> — the information is entirely in phase or frequency, so clipping loses nothing.`,
            `<b>QAM puts information back into the amplitude.</b> Its sixteen points sit at three different radii, so an amplifier that squashes them together destroys the distinction.`,
            `<b>This is the same argument as Part 3's.</b> FM tolerated a limiter because its envelope was constant; AM could not. The digital versions inherit it unchanged.`,
          ],
        };
      }
      return {
        stem: `For a given transmitted power and bit rate, which of ASK, FSK and PSK gives the lowest error rate — and why?`,
        choices: options(
          { text: "PSK — for the same average energy its symbols sit furthest apart", why: "" },
          [
            { text: "ASK — its symbols differ the most, being on and off", why: `Off carries no energy at all, so the average energy is wasted on only half the symbols. <b>For the same average power, PSK's antipodal symbols are further apart</b> than ASK's.` },
            { text: "FSK — different frequencies cannot be confused", why: `Orthogonal FSK is better than ASK but still worse than PSK: orthogonal symbols are √2 apart where antipodal ones are 2 apart, which is a 3 dB difference.` },
            { text: "all three are equal at the same energy per bit", why: `They are not. The error rate depends on the distance between symbols at a given energy, and the three schemes place their symbols differently.` },
          ]),
        answer: 0,
        steps: [
          `<b>Error rate is set by the distance between symbols at a given average energy</b>, so the question is a geometry question.`,
          `Binary PSK's two symbols are <b>antipodal</b> — at +1 and −1 — a distance of 2 apart with unit energy each.`,
          `Binary FSK's two symbols are <b>orthogonal</b>, at right angles, so they are only √2 apart. ASK's are 1 apart at the same average power, because one of them is off.`,
          `<b>PSK, then FSK 3 dB behind, then ASK.</b> This is why nearly every modern system is PSK or a QAM descendant of it.`,
        ],
      };
    }

    if (ask === "rate") {
      /* M = 2 excluded: bits/symbol is then 1 and the "forgot to multiply"
         distractor is the answer. */
      const M = rng.pick([4, 8, 16, 64]);
      const baud = rng.pick([1200, 2400, 4800]);
      const k = Math.log2(M);
      return {
        stem: `A modem signals at <b>${num(baud, 0)} baud</b> using <b>${num(M, 0)}-point QAM</b>. What is its bit rate?`,
        choices: options(
          { text: `${num(baud * k, 0)} bit/s`, why: "" },
          [
            { text: `${num(baud, 0)} bit/s`, why: `That is the <b>symbol</b> rate. Baud counts symbols per second; each ${num(M, 0)}-point symbol carries log₂${num(M, 0)} = ${num(k, 0)} bits.` },
            { text: `${num(baud * M, 0)} bit/s`, why: `M was used where log₂M belongs. <b>${num(M, 0)} points means ${num(k, 0)} bits per symbol</b>, not ${num(M, 0)} — the alphabet size and the information per symbol are different numbers.` },
            { text: `${num(baud / k, 0)} bit/s`, why: `Divided instead of multiplied. More points per symbol means <em>more</em> bits per second at the same symbol rate, not fewer.` },
          ]),
        answer: 0,
        steps: [
          D(`k = \\log_2 M = \\log_2 ${num(M, 0)} = ${num(k, 0)} \\text{ bits per symbol}`),
          D(`R_b = k R_s = ${num(k, 0)} \\times ${num(baud, 0)} = ${num(baud * k, 0)}\\text{ bit/s}`),
          `<b>Baud is not bit/s</b> unless the signalling is binary, and the whole point of QAM is that it is not.`,
          `<b>And the bandwidth did not change.</b> The symbol rate sets the bandwidth, so all ${num(baud * k, 0)} bit/s fit where ${num(baud, 0)} bit/s of binary would — which is exactly the trade Shannon prices.`,
        ],
      };
    }

    const M = rng.pick([4, 8, 16, 64]);
    const k = Math.log2(M);
    const ebDb = rng.pick([6, 8, 10, 12]);
    const esDb = ebDb + 10 * Math.log10(k);
    return {
      stem: `A <b>${num(M, 0)}-point</b> constellation is used on a link with <b>E<sub>b</sub>/N<sub>0</sub> = ${num(ebDb, 0)} dB</b>. What is E<sub>s</sub>/N<sub>0</sub>?`,
      choices: options(
        { text: `${fixed(esDb, 2)} dB`, why: "" },
        [
          { text: `${num(ebDb, 0)} dB — they are the same`, why: `Only for binary signalling. <b>A symbol carrying ${num(k, 0)} bits carries ${num(k, 0)} times the energy</b>, so E<sub>s</sub>/N₀ = k · E<sub>b</sub>/N₀ — and in decibels that is an addition of 10 log₁₀${num(k, 0)} = ${fixed(10 * Math.log10(k), 2)} dB.` },
          { text: `${fixed(ebDb * k, 2)} dB`, why: `The decibel value was multiplied by k. <b>Multiplying a ratio means adding decibels</b>: ×${num(k, 0)} is +${fixed(10 * Math.log10(k), 2)} dB, not ×${num(k, 0)} dB.` },
          { text: `${fixed(ebDb - 10 * Math.log10(k), 2)} dB`, why: `Divided rather than multiplied. The symbol is the <em>larger</em> package — it holds ${num(k, 0)} bits — so its energy is larger.` },
        ]),
      answer: 0,
      steps: [
        D(`k = \\log_2 ${num(M, 0)} = ${num(k, 0)} \\text{ bits per symbol}`),
        D(`\\frac{E_s}{N_0} = k\\,\\frac{E_b}{N_0} \\ \\Longrightarrow \\ ${num(ebDb, 0)} + 10\\log_{10}${num(k, 0)} = ${num(ebDb, 0)} + ${fixed(10 * Math.log10(k), 2)} = ${fixed(esDb, 2)}\\text{ dB}`),
        `<b>${fixed(esDb, 2)} dB.</b> Error-rate formulas are written in E<sub>s</sub>/N₀ and links are specified in E<sub>b</sub>/N₀, so this conversion sits between almost every question and its answer.`,
        `<b>Comparing schemes at equal E<sub>b</sub>/N₀ is the fair comparison</b>, because it charges each one for the energy spent per bit actually delivered rather than per symbol sent.`,
      ],
    };
  },
});

defineProblem("shannon-capacity", {
  topic: "Shannon capacity",
  lookup: "Electrical → Communications → Channel capacity",
  make(rng) {
    const ask = rng.pick(["cap", "cap", "snr", "infinite"]);

    if (ask === "infinite") {
      return {
        stem: `A channel's bandwidth is increased without limit while the transmitted power is held fixed. What happens to its Shannon capacity?`,
        choices: options(
          { text: "it approaches a finite ceiling, because the noise power grows with the bandwidth", why: "" },
          [
            { text: "it grows without limit, since C is proportional to B", why: `C is proportional to B only at fixed S/N. <b>Noise power is N = N₀B</b>, so widening the channel lets in more noise and S/N falls in exact proportion — the logarithm shrinks as fast as the factor in front grows.` },
            { text: "it stops changing once B exceeds the signal bandwidth", why: `Capacity keeps rising as B grows, just with diminishing returns. It converges rather than stopping.` },
            { text: "it falls, because the signal-to-noise ratio drops", why: `S/N does drop, but not fast enough to reduce the capacity. The product B log₂(1 + S/N) increases towards its ceiling; it never turns over.` },
          ]),
        answer: 0,
        steps: [
          `Write the noise as ${T(`N = N_0 B`)}, which is what it physically is — a noise density times the bandwidth admitted.`,
          D(`C = B\\log_2\\!\\left(1 + \\frac{S}{N_0 B}\\right)`),
          `As B grows, the fraction inside shrinks, and ${T(`\\log_2(1+x) \\to x/\\ln 2`)} for small x. The B cancels and <b>C → S/(N₀ ln 2)</b>, a finite ceiling set by power alone.`,
          `<b>Rearranged, that ceiling is E<sub>b</sub>/N₀ = ln 2 = −1.59 dB</b> — the absolute floor below which no communication is possible at any rate, with any bandwidth, using any code.`,
        ],
      };
    }

    if (ask === "snr") {
      /* Efficiency is drawn, not derived from an awkward pair, so 2^eff − 1
         never lands close to a distractor. */
      const eff = rng.pick([4, 6, 8, 10]);
      const B = rng.pick([2, 4, 8]);
      const C = eff * B;
      const snr = 2 ** eff - 1;
      const db = 10 * Math.log10(snr);
      return {
        stem: `A link must carry <b>${num(C, 0)} kbit/s</b> in <b>${num(B, 0)} kHz</b> of bandwidth. What is the minimum signal-to-noise ratio, in decibels, that Shannon permits?`,
        choices: options(
          { text: `${fixed(db, 1)} dB`, why: "" },
          [
            { text: `${fixed(10 * Math.log10(eff), 1)} dB`, why: `The spectral efficiency was quoted as though it were the ratio. <b>C/B = ${num(eff, 0)} bit/s/Hz is the exponent</b>, not the S/N — you have to undo the logarithm: S/N = 2^${num(eff, 0)} − 1.` },
            { text: `${fixed(20 * Math.log10(snr), 1)} dB`, why: `Twenty log, which is for amplitude ratios. <b>Signal-to-noise is a power ratio</b>, so it is 10 log₁₀.` },
            { text: `${fixed(10 * Math.log10(2 ** (eff / 2) - 1), 1)} dB`, why: `Nyquist's factor of two has crept in. Shannon's exponent is C/B, with no 2 — the 2 belongs to <b>C = 2B log₂M</b>, which is the other bound.` },
          ]),
        answer: 0,
        steps: [
          D(`\\frac{C}{B} = \\frac{${num(C, 0)}}{${num(B, 0)}} = ${num(eff, 0)}\\text{ bit/s/Hz}`),
          D(`${num(eff, 0)} = \\log_2\\!\\left(1 + \\frac{S}{N}\\right) \\ \\Longrightarrow \\ \\frac{S}{N} = 2^{${num(eff, 0)}} - 1 = ${num(snr, 0)}`),
          D(`10\\log_{10}(${num(snr, 0)}) = ${fixed(db, 2)}\\text{ dB}`),
          `<b>${fixed(db, 1)} dB, and that is the floor.</b> Shannon says a code achieving it exists; it does not say the code is simple, and finding practical ones took until the 1990s.`,
        ],
      };
    }

    const B = rng.pick([3000, 3400, 4000]);
    const db = rng.pick([20, 25, 30, 35]);
    const snr = 10 ** (db / 10);
    const C = B * Math.log2(1 + snr);
    return {
      stem: `A channel of <b>${num(B, 0)} Hz</b> has a signal-to-noise ratio of <b>${num(db, 0)} dB</b>. What is its capacity?`,
      choices: options(
        { text: `${fixed(C / 1e3, 1)} kbit/s`, why: "" },
        [
          { text: `${fixed((B * Math.log2(1 + db)) / 1e3, 1)} kbit/s`, why: `The decibel value was put straight into the formula. <b>Convert first</b>: ${num(db, 0)} dB is a ratio of 10<sup>${num(db, 0)}/10</sup> = ${sig(snr, 3)}, not ${num(db, 0)}.` },
          { text: `${fixed((2 * C) / 1e3, 1)} kbit/s`, why: `Nyquist's factor of two applied to Shannon's formula. <b>C = B log₂(1 + S/N)</b> has no 2 in it; the 2 belongs to C = 2B log₂M.` },
          { text: `${fixed((B * Math.log10(1 + snr)) / 1e3, 1)} kbit/s`, why: `A base-ten logarithm. The answer is in <b>bits</b>, so the logarithm is base two — divide the log₁₀ by log₁₀2 = 0.301.` },
        ]),
      answer: 0,
      steps: [
        D(`\\frac{S}{N} = 10^{${num(db, 0)}/10} = ${sig(snr, 4)}`),
        D(`C = B\\log_2\\!\\left(1 + \\frac{S}{N}\\right) = ${num(B, 0)}\\log_2(${sig(snr + 1, 4)}) = ${sig(C, 4)}\\text{ bit/s}`),
        `<b>About ${fixed(C / 1e3, 1)} kbit/s.</b> Converting out of decibels first is the step that decides the question — at ${num(db, 0)} dB the difference is a factor of ${sig(snr / db, 2)}.`,
        B === 3400 && db === 30
          ? `<b>These are the telephone line's numbers.</b> 3.4 kHz at 30 dB gives about 34 kbit/s — and V.34, the last analog modem standard, reached 33.6 kbit/s. A commercial product within one percent of an information-theory bound is close to unheard of, and it is why modem speeds stopped climbing.`
          : `<b>Note what this does not depend on.</b> Shannon says nothing about the modulation, the coding, or the receiver — only what the channel permits. A scheme below the bound is allowed, not achieved.`,
      ],
    };
  },
});

defineProblem("nyquist-shannon", {
  topic: "Nyquist against Shannon",
  lookup: "Electrical → Communications → Channel capacity / Nyquist rate",
  make(rng) {
    const ask = rng.pick(["nyq", "both", "mary"]);

    if (ask === "mary") {
      /* M >= 8 keeps 10log10(M²−1) clear of 20log10(M) and of the 6 dB-per-bit
         estimate; at M = 4 all three land within a quarter of a decibel. */
      const M = rng.pick([8, 16, 32, 64]);
      const need = M * M - 1;
      const db = 10 * Math.log10(need);
      return {
        stem: `What signal-to-noise ratio does Shannon require before a channel can carry <b>${num(M, 0)}-ary</b> signalling at Nyquist's ideal rate?`,
        choices: options(
          { text: `${fixed(db, 1)} dB`, why: "" },
          [
            { text: `${fixed(10 * Math.log10(M - 1), 1)} dB`, why: `That is the answer to <b>C = B log₂M</b>, which drops Nyquist's factor of two. With the 2 in place the condition squares: 2log₂M = log₂(1 + S/N) gives <b>1 + S/N = M²</b>.` },
            { text: `${fixed(10 * Math.log10(2 * Math.log2(M)), 1)} dB`, why: `The spectral efficiency, ${num(2 * Math.log2(M), 0)} bit/s/Hz, quoted as if it were a power ratio. It is the <em>exponent</em> — the ratio is 2 raised to it, less one.` },
            { text: `${fixed(20 * Math.log10(need), 1)} dB`, why: `Twenty log, which is for amplitudes. <b>Signal-to-noise is a power ratio</b>, so 10 log₁₀.` },
          ]),
        answer: 0,
        steps: [
          `Nyquist's ideal baseband rate is ${T(`C = 2B\\log_2 M`)}, so the efficiency is ${T(`C/B = 2\\log_2 M = ${num(2 * Math.log2(M), 0)}`)} bit/s/Hz.`,
          `Shannon permits ${T(`C/B = \\log_2(1 + S/N)`)}. Setting them equal:`,
          D(`2\\log_2 M = \\log_2\\!\\left(1 + \\frac{S}{N}\\right) \\ \\Longrightarrow \\ 1 + \\frac{S}{N} = M^2`),
          D(`\\frac{S}{N} = ${num(M, 0)}^2 - 1 = ${num(need, 0)} \\ \\Longrightarrow \\ ${fixed(db, 2)}\\text{ dB}`),
          `<b>1 + S/N = M² is the whole result</b>, and it is worth carrying: every four-fold rise in M costs about 12 dB. Below that ratio the scheme is not difficult — it is impossible, for any code.`,
        ],
      };
    }

    if (ask === "both") {
      /* M and the SNR are drawn as a validated pair, for two reasons. The
         list covers both regimes — the first two make NYQUIST the binding
         bound, the rest Shannon — so the question cannot be answered by
         always picking the same one. And it excludes M = 32 at 15 dB, where
         Shannon's efficiency is 5.03 bit/s/Hz and the "dropped the factor of
         two" distractor B log2 32 = 5B lands within 1% of the answer. */
      const B = rng.pick([3000, 4000]);
      const [M, db] = rng.pick([[4, 20], [4, 25], [16, 15], [16, 20], [32, 20], [32, 25]]);
      const snr = 10 ** (db / 10);
      const nyq = 2 * B * Math.log2(M);
      const sha = B * Math.log2(1 + snr);
      const bind = Math.min(nyq, sha);
      return {
        stem: `A <b>${num(B, 0)} Hz</b> channel with a <b>${num(db, 0)} dB</b> signal-to-noise ratio is used with <b>${num(M, 0)}-level</b> signalling. What is the maximum usable bit rate?`,
        choices: options(
          { text: `${fixed(bind / 1e3, 1)} kbit/s`, why: "" },
          [
            { text: `${fixed(Math.max(nyq, sha) / 1e3, 1)} kbit/s`, why: `That is the <em>other</em> bound, the one that is not binding. Both apply at once, so <b>the answer is always the smaller</b> — Nyquist gives ${fixed(nyq / 1e3, 1)} kbit/s and Shannon ${fixed(sha / 1e3, 1)}.` },
            { text: `${fixed((nyq + sha) / 1e3, 1)} kbit/s`, why: `The two bounds are not additive. They are two separate ceilings on the same quantity; a rate has to clear both.` },
            { text: `${fixed((B * Math.log2(M)) / 1e3, 1)} kbit/s`, why: `Nyquist's factor of two is missing, and Shannon has not been checked at all. <b>C = 2B log₂M</b>.` },
          ]),
        answer: 0,
        steps: [
          D(`\\text{Nyquist: } C = 2B\\log_2 M = 2(${num(B, 0)})(${num(Math.log2(M), 0)}) = ${sig(nyq, 4)}\\text{ bit/s}`),
          D(`\\text{Shannon: } C = B\\log_2\\!\\left(1 + 10^{${num(db, 0)}/10}\\right) = ${sig(sha, 4)}\\text{ bit/s}`),
          `<b>Both apply, so the smaller wins: ${fixed(bind / 1e3, 1)} kbit/s.</b> ${
            nyq < sha
              ? `Here <b>Nyquist binds</b> — the channel is quiet enough to support more levels than are being used, so the alphabet is the thing to raise.`
              : `Here <b>Shannon binds</b> — the alphabet is already asking for more than the noise permits, so raising M further buys nothing at all. More power, or fewer levels.`
          }`,
          `<b>The two bounds answer different questions.</b> Nyquist asks how fast pulses can be sent through a bandwidth without smearing into each other; Shannon asks how much information the noise leaves intact. Neither implies the other.`,
        ],
      };
    }

    /* M = 4 excluded: log2 M = 2 makes B·log2M and 2B the same number. */
    const B = rng.pick([2000, 3000, 4000]);
    const M = rng.pick([8, 16, 32]);
    const k = Math.log2(M);
    const C = 2 * B * k;
    return {
      stem: `Ignoring noise, what is the maximum bit rate a <b>${num(B, 0)} Hz</b> baseband channel can carry using <b>${num(M, 0)}-level</b> signalling?`,
      choices: options(
        { text: `${num(C / 1e3, 1)} kbit/s`, why: "" },
        [
          { text: `${num((B * k) / 1e3, 1)} kbit/s`, why: `The factor of two is missing. <b>Nyquist's signalling theorem allows 2B symbols per second</b> in a bandwidth B, so C = 2B log₂M.` },
          { text: `${num((2 * B * M) / 1e3, 1)} kbit/s`, why: `M was used where log₂M belongs. <b>${num(M, 0)} levels carry ${num(k, 0)} bits per symbol</b>, not ${num(M, 0)}.` },
          { text: `${num((2 * B) / 1e3, 1)} kbit/s`, why: `That is the binary answer — the symbol rate. Each ${num(M, 0)}-level symbol carries ${num(k, 0)} bits, so the bit rate is ${num(k, 0)} times higher.` },
        ]),
      answer: 0,
      steps: [
        D(`C = 2B\\log_2 M = 2(${num(B, 0)})\\log_2 ${num(M, 0)} = 2(${num(B, 0)})(${num(k, 0)}) = ${num(C, 0)}\\text{ bit/s}`),
        `<b>${num(C / 1e3, 1)} kbit/s</b>, and note the word <em>ignoring</em>: this bound knows nothing about noise, which is why it lets you raise M for ever.`,
        `<b>Shannon is the bound that stops that.</b> ${num(M, 0)}-level signalling at this rate needs S/N = ${num(M, 0)}² − 1 = ${num(M * M - 1, 0)}, or ${fixed(10 * Math.log10(M * M - 1), 1)} dB, before it is permitted at all.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "digicomm",
    stem: "What does a digital receiver actually do?",
    tool: "Picks the nearest legal symbol to the received point",
    because: "Error rate is minimum distance against noise, and nothing else. Every formula in the part is that comparison.",
  },
  {
    part: "digicomm",
    stem: "Converting Eb/N0 to Es/N0?",
    tool: "Es/N0 = k · Eb/N0, k = log₂M — add 10log₁₀k in dB",
    because: "Formulas are written in Es/N0 and links are specified in Eb/N0. Dropping k is the commonest error here.",
  },
  {
    part: "digicomm",
    stem: "BPSK against QPSK at the same Eb/N0?",
    tool: "Identical bit error rate; QPSK needs half the bandwidth",
    because: "QPSK is two orthogonal BPSK links in one channel. 9.6 dB gives 10⁻⁵ for both.",
  },
  {
    part: "digicomm",
    stem: "Best of ASK, FSK and PSK for a given power?",
    tool: "PSK — antipodal symbols are 2 apart, orthogonal ones only √2",
    because: "A 3 dB advantage over FSK, more over ASK. QAM beats PSK for large M but needs a linear amplifier.",
  },
  {
    part: "digicomm",
    stem: "The two capacity bounds?",
    tool: "Nyquist C = 2B log₂M; Shannon C = B log₂(1 + S/N)",
    because: "Nyquist ignores noise, Shannon ignores modulation. Both apply — the answer is the smaller.",
  },
  {
    part: "digicomm",
    stem: "Using Shannon with an SNR given in decibels?",
    tool: "Convert first — 30 dB is 1000, not 30",
    because: "The single most expensive slip in the part. 3.4 kHz at 30 dB is 34 kbit/s, not 17.",
  },
  {
    part: "digicomm",
    stem: "SNR needed before M-ary signalling is possible at all?",
    tool: "1 + S/N = M² — about 12 dB per four-fold rise in M",
    because: "Binary 4.8 dB, 4-ary 11.8, 16-ary 24.1. Below it the scheme is impossible, not merely hard.",
  },
]);

/* ==========================================================================
   Part 6 — multiplexing

   The exam asks which scheme is which, and then asks for one of two pieces
   of arithmetic: an FDM band or a TDM frame. The distractors are dropping
   the guard band, dropping the framing bit, confusing the spreading factor
   with a bandwidth, and quoting a processing gain as a ratio where decibels
   were asked for.
   ========================================================================== */

defineProblem("mux-scheme", {
  topic: "Choosing a multiplexing scheme",
  lookup: "Electrical → Communications → Multiplexing (FDM, TDM, CDMA)",
  make(rng) {
    const q = rng.pick(["identify", "common", "overhead", "sync"]);

    if (q === "common") {
      return {
        stem: `FDM, TDM and CDMA all let several users share one channel without interfering. What property do all three rely on?`,
        choices: options(
          { text: "orthogonality — the signals' inner product over a symbol is zero", why: "" },
          [
            { text: "each user transmits at a different power", why: `Power differences do not separate users; they make the problem worse. <b>The near–far effect is a hazard in CDMA</b>, not a mechanism, and FDM and TDM do not use power at all.` },
            { text: "the receiver filters out everything but its own user", why: `A filter is <em>how</em> FDM achieves separation, but it cannot explain TDM or CDMA, where the users share the same band completely. The common property is more general than any one mechanism.` },
            { text: "each user is allocated a different bandwidth", why: `True only of FDM. In TDM every user has the whole bandwidth, and in CDMA every user has all of it all of the time.` },
          ]),
        answer: 0,
        steps: [
          `Two signals share a channel harmlessly when ${T(`\\int_0^T s_i(t)s_j(t)\\,dt = 0`)} for i ≠ j — <b>the receiver's correlator then sees nothing from anyone else</b>.`,
          `<b>TDM</b> makes the product zero by making one signal zero whenever the other is not: disjoint in time.`,
          `<b>FDM</b> makes it zero because distinct sinusoids integrate to zero over a whole number of cycles — the same fact that extracts a Fourier coefficient.`,
          `<b>CDMA</b> makes it zero with signals that overlap completely in both time and frequency and cancel anyway, using codes with zero cross-correlation.`,
          `<b>They are one idea in three costumes</b>, and recognising that is worth more than three separate definitions.`,
        ],
      };
    }

    if (q === "overhead") {
      return {
        stem: `As the number of channels grows, what happens to the fractional overhead of an FDM link and of a TDM link?`,
        choices: options(
          { text: "FDM's stays constant; TDM's falls", why: "" },
          [
            { text: "both stay constant", why: `FDM's does — the guard band is charged per channel, so the percentage never moves. <b>TDM's does not</b>: the framing bit is charged per frame, and a frame holds more payload as channels are added.` },
            { text: "both fall", why: `Only TDM's falls. <b>FDM's guard band is per channel</b>, so adding channels adds guard bands in exact proportion and the fraction is unchanged.` },
            { text: "FDM's falls; TDM's stays constant", why: `Exactly backwards. The framing bit is the thing that amortises; the guard band is the thing that cannot.` },
          ]),
        answer: 0,
        steps: [
          `<b>FDM:</b> N channels each need their own guard band, so the total is N × slot and the wasted fraction is (slot − signal)/slot — <b>the same 15% at any N</b>.`,
          `<b>TDM:</b> a frame is Nb + 1 bits, of which one is framing, so the wasted fraction is ${T(`1/(Nb + 1)`)}.`,
          `At 2 channels of 8 bits that is 1/17 = 5.9%; at 24 it is <b>1/193 = 0.52%</b>.`,
          `<b>One improves with scale and the other cannot.</b> That asymmetry, more than any single number, is why the trunk network went digital and time-division rather than adding more FDM groups.`,
        ],
      };
    }

    if (q === "sync") {
      return {
        stem: `Two CDMA users' chip sequences drift <b>one chip out of alignment</b>. What happens?`,
        choices: options(
          { text: "the codes stop being orthogonal and the users interfere", why: "" },
          [
            { text: "nothing — the codes are orthogonal at any alignment", why: `Orthogonality is a property of <b>aligned</b> codes. A misaligned receiver's window catches the tail of the interferer's previous symbol and the head of the current one — two symbols with unrelated bits, which is not anybody's code.` },
            { text: "the data rate falls but the users stay separated", why: `The rate is unaffected; separation is what fails. A one-chip offset can let an interferer correlate as strongly as the wanted signal.` },
            { text: "the receiver automatically resynchronises", why: `Real receivers do track chip timing, and they have to — but that is a mechanism built to prevent this failure, not a reason the failure does not exist.` },
          ]),
        answer: 0,
        steps: [
          `Aligned Walsh codes have inner product exactly zero, so interfering users cancel term by term in integer arithmetic.`,
          `<b>Misaligned, the receiver's window straddles two of the interferer's symbols</b>, carrying independent bits. That composite sequence is not a code word and is orthogonal to nothing.`,
          `At 8 chips a single misaligned interferer can reach a correlation of <b>8 against a wanted signal of 8</b> — as loud as the signal itself.`,
          `<b>Hence tight chip synchronisation within a cell</b>, and merely <em>near</em>-orthogonal PN codes between cells, where no common clock exists.`,
        ],
      };
    }

    const CASES = [
      {
        stem: "Users share the whole bandwidth but are each given a repeating slot of time",
        right: "TDM", others: ["FDM", "CDMA", "SSB"],
        why: { FDM: "FDM divides the frequency axis, not the time axis — each user keeps a band permanently.", CDMA: "CDMA divides neither; all users occupy the whole band all of the time.", SSB: "SSB is a modulation scheme, not a multiplexing one. It halves one signal's bandwidth; it does not share a channel." },
      },
      {
        stem: "Each user is permanently assigned its own slice of the spectrum, separated by guard bands",
        right: "FDM", others: ["TDM", "CDMA", "PCM"],
        why: { TDM: "TDM gives each user the whole band briefly rather than a slice permanently, and needs framing rather than guard bands.", CDMA: "CDMA assigns no slice at all — the users overlap completely and are separated by code.", PCM: "PCM is a way of digitising one signal, not of sharing a channel between several." },
      },
      {
        stem: "Every user transmits over the whole band at the same time, separated by orthogonal codes",
        right: "CDMA", others: ["TDM", "FDM", "OFDM"],
        why: { TDM: "TDM users are disjoint in time. Here they overlap completely in both time and frequency.", FDM: "FDM users are disjoint in frequency. Here there is no division of the band at all.", OFDM: "OFDM is still frequency division — its subcarriers overlap but each user has its own set. The separation is by frequency, not by code." },
      },
      {
        stem: "Subcarriers overlap in frequency but are spaced so each one's nulls fall on its neighbours' peaks, so no guard bands are needed",
        right: "OFDM", others: ["CDMA", "TDM", "plain FDM"],
        why: { CDMA: "CDMA separates by code, not by frequency. OFDM's users still have distinct subcarriers — they just abut without waste.", TDM: "Nothing here is divided in time; the description is entirely about frequency spacing.", "plain FDM": "Plain FDM needs guard bands precisely because its channels are not arranged to be orthogonal. Removing them is what makes this OFDM." },
      },
    ];
    const c = rng.pick(CASES);
    return {
      stem: `${c.stem}. Which multiplexing scheme is this?`,
      choices: options(
        { text: c.right, why: "" },
        c.others.map((o) => ({ text: o, why: c.why[o] }))),
      answer: 0,
      steps: [
        `<b>Ask what is being kept disjoint</b> — that single question separates all three schemes.`,
        `<b>Disjoint in time → TDM. Disjoint in frequency → FDM. Disjoint in neither, separated by code → CDMA.</b>`,
        `Here the answer is <b>${c.right}</b>.`,
        `<b>All of them work by orthogonality</b>; they differ only in which variable is used to arrange it.`,
      ],
    };
  },
});

defineProblem("mux-bandwidth", {
  topic: "FDM bandwidth and TDM frame arithmetic",
  lookup: "Electrical → Communications → Multiplexing",
  make(rng) {
    const ask = rng.pick(["fdm", "count", "tdm", "guard"]);

    if (ask === "guard") {
      return {
        stem: `An FDM system gives each <b>3.4 kHz</b> voice channel a <b>4 kHz</b> slot. What fraction of the spectrum is guard band, and how does it change as channels are added?`,
        choices: options(
          { text: "15%, and it does not change", why: "" },
          [
            { text: "15%, falling as channels are added", why: `The fraction is right and the trend is not. <b>Every channel brings its own guard band</b>, so the waste grows in exact proportion to the traffic and the percentage is fixed. <b>Falling overhead is TDM's property</b>, where one framing bit is shared by the whole frame.` },
            { text: "8.5%, and it does not change", why: `That is 0.6/7.06 or some other pairing. The guard is <b>0.6 kHz out of the 4 kHz slot</b>: 0.6/4 = 15%.` },
            { text: "17.6%, and it does not change", why: `That is 0.6/3.4 — the guard measured against the <em>signal</em> rather than against the slot. The question asks what fraction of the spectrum is wasted, and the spectrum consumed per channel is the 4 kHz slot.` },
          ]),
        answer: 0,
        steps: [
          D(`\\frac{4 - 3.4}{4} = \\frac{0.6}{4} = 0.15`),
          `<b>15%, and it is the same at any number of channels</b> — N channels need N slots, so both the total and the waste scale together.`,
          `<b>Set that against TDM</b>, where the overhead is one framing bit per frame: 1/(8N + 1), which is 5.9% at two channels and 0.52% at twenty-four.`,
          `<b>One is a percentage and the other is a constant divided by the traffic.</b> That is why the comparison gets more lopsided as links grow, and why the analog hierarchy was replaced rather than extended.`,
        ],
      };
    }

    if (ask === "count") {
      const B = rng.pick([48, 120, 240, 480]);
      const n = B / 4;
      return {
        stem: `An FDM link of <b>${num(B, 0)} kHz</b> carries voice channels in <b>4 kHz</b> slots. How many channels does it hold?`,
        choices: options(
          { text: `${num(n, 0)}`, why: "" },
          [
            { text: `${num(Math.floor(B / 3.4), 0)}`, why: `Divided by the 3.4 kHz signal rather than the 4 kHz slot. <b>The guard band is part of what each channel consumes</b>, so the slot is the divisor.` },
            { text: `${num(B / 8, 0)}`, why: `An 8 kHz divisor — that is the telephone <em>sample rate</em>, which belongs to the digital chain and has nothing to do with an analog FDM slot.` },
            { text: `${num(B, 0)}`, why: `That is the bandwidth in kHz, not a channel count. Each channel takes 4 kHz of it.` },
          ]),
        answer: 0,
        steps: [
          D(`N = \\frac{${num(B, 0)}}{4} = ${num(n, 0)}\\text{ channels}`),
          `<b>${num(n, 0)} channels.</b> ${n === 12 ? "Twelve in 48 kHz is the ITU <b>group</b>." : n === 60 ? "Sixty in 240 kHz is the ITU <b>supergroup</b>." : "The ITU hierarchy is built from groups of 12 (48 kHz) and supergroups of 60 (240 kHz)."}`,
          `<b>Divide by the slot, not by the signal.</b> Each channel consumes its guard band whether it uses it or not — that is what a guard band is for.`,
        ],
      };
    }

    if (ask === "tdm") {
      /* N is drawn away from 24 as often as onto it, so the T1 answer cannot
         be produced by recognition alone. */
      const N = rng.pick([6, 12, 24, 30]);
      const f = 8000, b = 8;
      const perFrame = N * b + 1;
      const rate = perFrame * f;
      return {
        stem: `A TDM system carries <b>${num(N, 0)}</b> voice channels. Each contributes <b>8 bits</b> per frame, one framing bit is added, and frames are sent <b>8000</b> times a second. What is the line rate?`,
        choices: options(
          { text: `${fixed(rate / 1e6, 3)} Mbit/s`, why: "" },
          [
            { text: `${fixed((N * b * f) / 1e6, 3)} Mbit/s`, why: `The framing bit was left out. That is the <b>payload</b> rate; the line has to carry the framing bit too, so the frame is ${num(N, 0)} × 8 + 1 = ${num(perFrame, 0)} bits.` },
            { text: `${fixed((perFrame * f * N) / 1e6, 3)} Mbit/s`, why: `Multiplied by the channel count twice. <b>The ${num(N, 0)} channels are already inside the ${num(perFrame, 0)}-bit frame</b>, and the frame rate is 8000, not ${num(N, 0)} × 8000.` },
            { text: `${num(perFrame, 0)} kbit/s`, why: `That is the frame length in bits, quoted as a rate. Multiply by the 8000 frames per second.` },
          ]),
        answer: 0,
        steps: [
          D(`\\text{bits per frame} = ${num(N, 0)}(8) + 1 = ${num(perFrame, 0)}`),
          `<b>The frame rate is the sample rate.</b> Each channel contributes one sample per frame and is sampled 8000 times a second, so there are 8000 frames per second — not ${num(N, 0)} × 8000.`,
          D(`R = ${num(perFrame, 0)} \\times 8000 = ${sig(rate, 4)}\\text{ bit/s}`),
          N === 24
            ? `<b>1.544 Mbit/s — this is the T1 exactly</b>, and worth recognising on sight. Framing costs 1/193 = 0.52%.`
            : `<b>${fixed(rate / 1e6, 3)} Mbit/s</b>, with the framing bit costing 1/${num(perFrame, 0)} = ${fixed(100 / perFrame, 2)}%. At 24 channels the same arithmetic gives the T1's 1.544 Mbit/s.`,
        ],
      };
    }

    const N = rng.pick([12, 24, 60]);
    const total = 4 * N;
    return {
      stem: `<b>${num(N, 0)}</b> voice channels of 3.4 kHz each are frequency-division multiplexed, each into a <b>4 kHz</b> slot. What total bandwidth is needed?`,
      choices: options(
        { text: `${num(total, 0)} kHz`, why: "" },
        [
          { text: `${num(3.4 * N, 1)} kHz`, why: `The guard bands were left out. Each channel consumes its whole <b>4 kHz slot</b>, not just the 3.4 kHz its speech occupies — that is the price of keeping neighbours apart.` },
          { text: `${num(8 * N, 0)} kHz`, why: `An 8 kHz slot — that is the telephone <em>sample rate</em>, which belongs to the digital chain in Part 4. An analog FDM slot is <b>4 kHz</b>, and no sampling happens here at all.` },
          { text: `${num(4, 0)} kHz`, why: `That is one channel's slot. Multiply by the ${num(N, 0)} channels.` },
        ]),
      answer: 0,
      steps: [
        D(`B = N \\times B_{\\text{slot}} = ${num(N, 0)} \\times 4 = ${num(total, 0)}\\text{ kHz}`),
        `<b>${num(total, 0)} kHz</b>, of which ${num(3.4 * N, 1)} kHz is speech and ${num(0.6 * N, 1)} kHz is guard band — <b>15%, as it is at every channel count</b>.`,
        N === 12 ? `<b>Twelve channels in 48 kHz is the ITU group</b>, the unit the analog long-distance network was assembled from.` : N === 60 ? `<b>Sixty channels in 240 kHz is the ITU supergroup</b> — five groups of twelve.` : `The ITU hierarchy stacks these: 12 channels make a 48 kHz group, and 5 groups make a 240 kHz supergroup.`,
      ],
    };
  },
});

defineProblem("mux-cdma", {
  topic: "Spread spectrum and processing gain",
  lookup: "Electrical → Communications → Spread spectrum / CDMA",
  make(rng) {
    const ask = rng.pick(["gain", "gain", "chiprate", "why"]);

    if (ask === "why") {
      return {
        stem: `In CDMA every user transmits over the whole band at the same time. How does a receiver recover one user's bits?`,
        choices: options(
          { text: "it multiplies the received sum by that user's code and adds up the chips", why: "" },
          [
            { text: "it filters out the frequencies the other users are using", why: `There are none to filter — every user occupies the entire band. <b>That is what makes CDMA different from FDM</b>, and it is why a filter cannot be the answer.` },
            { text: "it listens only during that user's time slot", why: `There are no time slots. Every user transmits continuously, which is what makes CDMA different from TDM.` },
            { text: "it subtracts the other users' signals, which it decodes first", why: `Successive interference cancellation is a real technique, but it is not what makes basic CDMA work — and it would need the other users' data, which the receiver does not have. <b>Orthogonal codes make the others cancel without being known.</b>` },
          ]),
        answer: 0,
        steps: [
          `The wire carries the plain sum of every user's code times their bit — a waveform that is nobody's code in particular.`,
          `The receiver <b>correlates</b>: multiply that sum by its own code, chip by chip, and add.`,
          `Its own code correlates with itself to give <b>N</b>, the code length. Every other user's code correlates with it to give <b>exactly zero</b>, so they cancel term by term without ever being decoded.`,
          `<b>The result is the wanted bit, times N.</b> Divide by N and the interference from every other user has simply gone.`,
        ],
      };
    }

    if (ask === "chiprate") {
      /* The two sets are kept disjoint: with rb equal to n the "that is the
         bit rate" and "that is the spreading factor" distractors print the
         same number and the option set collapses to three. */
      const rb = rng.pick([9.6, 19.2, 64]);
      const n = rng.pick([32, 128, 256]);
      const rc = rb * n;
      return {
        stem: `A <b>${num(rb, 1)} kbit/s</b> stream is spread with a <b>${num(n, 0)}-chip</b> code. What is the chip rate?`,
        choices: options(
          { text: `${sig(rc / 1e3, 4)} Mchip/s`, why: "" },
          [
            { text: `${sig(rb / n, 3)} kchip/s`, why: `Divided instead of multiplied. <b>Each bit is replaced by ${num(n, 0)} chips</b>, so the chip rate is ${num(n, 0)} times the bit rate — spreading always makes the signalling faster and the spectrum wider.` },
            { text: `${num(rb, 1)} kchip/s`, why: `That is the bit rate. Spreading does not change the information rate, but it does change the rate at which the channel is driven.` },
            { text: `${num(n, 0)} kchip/s`, why: `That is the spreading factor, which is a dimensionless count of chips per bit, not a rate.` },
          ]),
        answer: 0,
        steps: [
          D(`R_{\\text{chip}} = N R_b = ${num(n, 0)} \\times ${num(rb, 1)} = ${sig(rc, 4)}\\text{ kchip/s}`),
          `<b>${sig(rc / 1e3, 4)} Mchip/s.</b> The bandwidth follows the chip rate, so the signal now occupies about ${num(n, 0)} times the spectrum it needed unspread.`,
          `<b>That is the trade, and it is not a loss</b>: ${num(n, 0)} users can share the same widened band using ${num(n, 0)} orthogonal codes, so the spectrum per user is unchanged.`,
        ],
      };
    }

    const n = rng.pick([16, 32, 64, 128, 256]);
    const db = 10 * Math.log10(n);
    return {
      stem: `A spread-spectrum link uses a <b>${num(n, 0)}-chip</b> code per bit. What is its processing gain in decibels?`,
      choices: options(
        { text: `${fixed(db, 1)} dB`, why: "" },
        [
          { text: `${num(n, 0)} dB`, why: `That is the spreading factor as a plain ratio. <b>Processing gain in decibels is 10 log₁₀N</b> — the ratio itself is ${num(n, 0)}, which is ${fixed(db, 1)} dB.` },
          { text: `${fixed(20 * Math.log10(n), 1)} dB`, why: `Twenty log, which is for amplitude ratios. <b>Processing gain is a power ratio</b> — chip rate over bit rate, or equivalently spread bandwidth over unspread — so 10 log₁₀.` },
          { text: `${fixed(10 * Math.log10(Math.log2(n)), 1)} dB`, why: `log₂N is the number of <em>bits</em> needed to index the code, which is a different quantity entirely. The gain is the chip count itself.` },
        ]),
      answer: 0,
      steps: [
        D(`G_p = \\frac{R_{\\text{chip}}}{R_b} = N = ${num(n, 0)}`),
        D(`10\\log_{10}(${num(n, 0)}) = ${fixed(db, 2)}\\text{ dB}`),
        `<b>${fixed(db, 1)} dB.</b> This is how much a narrowband interferer is suppressed when the receiver despreads: the wanted signal collapses back to its original bandwidth while the interferer is spread out and mostly filtered away.`,
        `<b>It is also the number of users the code set can hold</b> — ${num(n, 0)} orthogonal codes of length ${num(n, 0)} — which is why processing gain and capacity are the same parameter looked at twice.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "mux",
    stem: "What do FDM, TDM and CDMA all rely on?",
    tool: "Orthogonality — ∫sᵢsⱼ = 0 for i ≠ j",
    because: "Disjoint in time, disjoint in frequency, or overlapping with zero-correlation codes. One idea, three costumes.",
  },
  {
    part: "mux",
    stem: "FDM bandwidth for N voice channels?",
    tool: "N × 4 kHz — 3.4 kHz of speech plus a 15% guard",
    because: "Group = 12 × 4 = 48 kHz; supergroup = 60 × 4 = 240 kHz. The 15% never amortises.",
  },
  {
    part: "mux",
    stem: "TDM line rate and framing overhead?",
    tool: "fs(Nb + 1); overhead 1/(Nb + 1)",
    because: "T1 is 8000(24×8+1) = 1.544 Mbit/s, framing 0.52% — and the fraction FALLS as channels are added.",
  },
  {
    part: "mux",
    stem: "Which overhead improves with scale?",
    tool: "TDM's. FDM's is fixed at 15%",
    because: "Guard bands are charged per channel; the framing bit is shared by the whole frame. A factor of 29 at 24 channels.",
  },
  {
    part: "mux",
    stem: "CDMA processing gain?",
    tool: "Gp = chip rate / bit rate = N, or 10 log₁₀N dB",
    because: "It is also the number of orthogonal codes available — capacity and interference rejection are the same parameter.",
  },
  {
    part: "mux",
    stem: "What breaks CDMA?",
    tool: "Chip misalignment — shifted codes are not orthogonal",
    because: "At 8 chips a single misaligned interferer can correlate 8 against a wanted 8. Hence tight sync within a cell.",
  },
  {
    part: "mux",
    stem: "What is OFDM, in one line?",
    tool: "FDM with subcarriers spaced so their nulls fall on neighbours' peaks",
    because: "They overlap and stay orthogonal, so the guard bands vanish. Recovers FDM's 15%; used in Wi-Fi and LTE.",
  },
]);
