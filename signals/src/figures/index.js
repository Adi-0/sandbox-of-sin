/*
 * name -> builder registry.
 *
 * The content HTML refers to figures by these short names:
 *   <div data-fig="convolution-slider"></div>
 * Adding a figure is: write the builder, register it here, drop the
 * placeholder into the chapter.
 */

import { oneTrace, buildingBlocks, timeShift } from './signals.js';
import { linearityTest, timeInvariance } from './systems.js';
import { impulseResponseFig, twoClaps, convolutionSlider, squareThroughRoom } from './clap.js';
import { eigenFig, shadowFig, complexFig } from './arrow.js';
import { buildSquare, spectrumFig, seriesToTransform, uncertaintyFig } from './stack.js';
import { sweepFig, bodeFig, multiplyFig } from './response.js';
import { growingToneFig, poleRingFig, blockDiagramFig, feedbackFig } from './poles.js';
import { fourFiltersFig, orderFig } from './filters.js';
import { samplingFig, copiesFig, wagonWheelFig } from './sampling.js';
import { radioFig, cruiseFig } from './world.js';
import { bench } from './bench.js';

export const FIGURES = {
  /* Part 1 — Everything That Varies */
  'one-trace': oneTrace,
  'building-blocks': buildingBlocks,
  'time-shift': timeShift,

  /* Part 2 — The Two Promises */
  'linearity-test': linearityTest,
  'time-invariance': timeInvariance,

  /* Part 3 — One Clap Tells All */
  'impulse-response': impulseResponseFig,
  'two-claps': twoClaps,
  'convolution-slider': convolutionSlider,
  'square-through-room': squareThroughRoom,

  /* Part 4 — The Spinning Arrow */
  'eigen': eigenFig,
  'shadow': shadowFig,
  'complex': complexFig,

  /* Part 5 — A Stack of Tones */
  'build-square': buildSquare,
  'spectrum': spectrumFig,
  'series-to-transform': seriesToTransform,
  'uncertainty': uncertaintyFig,

  /* Part 6 — The Room, Tone by Tone */
  'sweep': sweepFig,
  'bode': bodeFig,
  'multiply': multiplyFig,

  /* Part 7 — Poles */
  'growing-tone': growingToneFig,
  'pole-ring': poleRingFig,
  'block-diagram': blockDiagramFig,
  'feedback': feedbackFig,

  /* Part 8 — Rooms Built on Purpose */
  'four-filters': fourFiltersFig,
  'order': orderFig,

  /* Part 9 — Photographs of a Signal */
  'sampling': samplingFig,
  'copies': copiesFig,
  'wagon-wheel': wagonWheelFig,

  /* Part 10 — Out in the World */
  'radio': radioFig,
  'cruise': cruiseFig,

  /* The Bench */
  'bench': bench,
};
