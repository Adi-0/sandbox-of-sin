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
};
