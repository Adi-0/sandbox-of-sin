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

/* --- Power Systems --- */
import "./power-factor.js";  // 37 38
import "./three-phase.js";   // 39 40 41
