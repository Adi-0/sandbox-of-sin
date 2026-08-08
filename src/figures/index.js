/* Importing a figure module is what registers its plates. Order here matches
   plate order through the guide, which makes gaps easy to spot. */

import "./orientation.js";   // 1
import "./trig.js";          // 2 3 4 5
import "./complex.js";       // 6 7 8
import "./geometry.js";      // 9 10
import "./vectors.js";       // 11 12 13
import "./linalg.js";        // 14 15 16
import "./calculus.js";      // 17 18 19 20
import "./odes.js";          // 21 22
import "./discrete.js";      // 23 24
import "./synthesis.js";     // 25

/* --- Circuit Analysis --- */
import "./circuits-dc.js";   // 26 27 28 29 30 31
import "./circuits-ac.js";   // 32 33 34 35 36

/* --- Electronics --- */
import "./diode.js";         // 49 50
import "./rectifiers.js";    // 51 52
import "./transistors.js";   // 53 54 55
import "./amplifiers.js";    // 56 57
import "./opamps.js";        // 58 59
import "./instrumentation.js"; // 60 61
import "./electronics-synthesis.js"; // 62

/* --- Digital Systems --- */
import "./numbers.js";       // 63 64
import "./gates.js";         // 65 66
import "./minimisation.js";  // 67 68
import "./flipflops.js";     // 69 70
import "./state-machines.js"; // 71 72
import "./timing.js";        // 73 74
import "./digital-synthesis.js"; // 75

/* --- Linear Systems --- */
import "./transient.js";     // 76 77
import "./second-order.js";  // 78 79
import "./laplace.js";       // 80 81
import "./transfer.js";      // 82 83
import "./frequency.js";     // 84 85
import "./resonance.js";     // 86 87
import "./linear-synthesis.js"; // 88

/* --- Control Systems --- */
import "./feedback.js";      // 89 90
import "./closed-loop.js";   // 91 92
import "./stability.js";     // 93 94
import "./margins.js";       // 95 96
import "./error.js";         // 97 98
import "./pid.js";           // 99 100
import "./control-synthesis.js"; // 101

/* --- Signal Processing --- */
import "./spectra.js";       // 102 103
import "./sampling.js";      // 104 105
import "./filters.js";       // 106 107
import "./butterworth.js";   // 108 109
import "./digital-filters.js"; // 110 111
import "./ztransform.js";    // 112 113
import "./dsp-synthesis.js"; // 114

/* --- Communications --- */
import "./fourier.js";       // 115 116
import "./am.js";            // 117 118
import "./fm.js";            // 119 120

/* --- Power Systems --- */
import "./power-factor.js";  // 37 38
import "./three-phase.js";   // 39 40 41
import "./transmission.js";  // 42 43
import "./transformers.js";  // 44 45
import "./machines.js";      // 46 47
import "./power-synthesis.js"; // 48
