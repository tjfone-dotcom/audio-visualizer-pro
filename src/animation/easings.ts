/**
 * Easing functions for smooth animations.
 */

export type EasingFn = (t: number) => number;

export const easeLinear: EasingFn = (t) => t;

export const easeInQuad: EasingFn = (t) => t * t;

export const easeOutQuad: EasingFn = (t) => t * (2 - t);

export const easeInOutQuad: EasingFn = (t) =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

export const easeOutCubic: EasingFn = (t) => --t * t * t + 1;

export const easeInOutCubic: EasingFn = (t) =>
  t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

export const easeOutExpo: EasingFn = (t) =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

/** Attempt a smooth decay for peak hold indicators. */
export const peakDecay: EasingFn = (t) => 1 - easeInQuad(t);
