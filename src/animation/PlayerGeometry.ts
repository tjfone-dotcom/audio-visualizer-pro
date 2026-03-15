/**
 * PlayerGeometry - Shared geometry calculations for player renderers.
 * Provides positions, sizes, and rotation angles used by both CSS and Canvas renderers.
 */

export interface PlayerGeometryData {
  discPosition: { x: number; y: number };
  discRadius: number;
  discRotation: number;
  artPosition: { x: number; y: number; size: number };
  tonearmAngle?: number;
  glowIntensity?: number;
  reelLeftRotation?: number;
  reelRightRotation?: number;
}

/** Player area dimensions */
export const PLAYER_WIDTH = 640;
export const PLAYER_HEIGHT = 720;
export const PLAYER_CENTER_X = PLAYER_WIDTH / 2;
export const PLAYER_CENTER_Y = PLAYER_HEIGHT / 2 - 40; // offset up for track info

/** Turntable geometry */
export const TURNTABLE = {
  platterRadius: 200,
  vinylRadius: 185,
  labelRadius: 60,
  platterX: PLAYER_CENTER_X,
  platterY: PLAYER_CENTER_Y - 10,
  tonearmPivotX: PLAYER_CENTER_X + 190,
  tonearmPivotY: PLAYER_CENTER_Y - 200,
  tonearmLength: 220,
  tonearmRestAngle: -30,
  tonearmPlayAngle: 5,
  spinDuration: 5, // seconds per rotation
} as const;

/** CD player geometry */
export const CD_PLAYER = {
  discRadius: 160,
  discX: PLAYER_CENTER_X,
  discY: PLAYER_CENTER_Y - 20,
  holeRadius: 20,
  artRadius: 100,
  spinDuration: 5,
} as const;

/** Cassette player geometry */
export const CASSETTE = {
  bodyWidth: 440,
  bodyHeight: 280,
  bodyX: PLAYER_CENTER_X,
  bodyY: PLAYER_CENTER_Y - 10,
  windowWidth: 320,
  windowHeight: 140,
  reelRadius: 45,
  reelHubRadius: 16,
  leftReelX: PLAYER_CENTER_X - 85,
  rightReelX: PLAYER_CENTER_X + 85,
  reelY: PLAYER_CENTER_Y - 20,
  labelWidth: 380,
  labelHeight: 60,
  baseSpinDuration: 2, // seconds per rotation
} as const;

/** Track info area at the bottom of the player */
export const TRACK_INFO = {
  y: PLAYER_HEIGHT - 90,
  height: 80,
  progressBarY: PLAYER_HEIGHT - 30,
  progressBarHeight: 3,
  padding: 30,
} as const;

/**
 * Calculate cassette reel speeds based on playback progress.
 * Supply reel (left) starts fast and slows down.
 * Take-up reel (right) starts slow and speeds up.
 */
export function getCassetteReelSpeeds(progress: number): {
  leftDuration: number;
  rightDuration: number;
} {
  const base = CASSETTE.baseSpinDuration;
  const clampedProgress = Math.max(0, Math.min(1, progress));

  // Left reel: fast at start (small radius), slow at end (large radius)
  // Right reel: slow at start (small radius), fast at end (large radius)
  const leftFactor = 0.5 + clampedProgress * 2.0;
  const rightFactor = 2.5 - clampedProgress * 2.0;

  return {
    leftDuration: base * leftFactor,
    rightDuration: base * rightFactor,
  };
}

/**
 * Calculate tonearm angle based on playback progress.
 */
export function getTonearmAngle(progress: number): number {
  const { tonearmRestAngle, tonearmPlayAngle } = TURNTABLE;
  const range = tonearmPlayAngle - tonearmRestAngle;
  return tonearmRestAngle + range * Math.max(0, Math.min(1, progress));
}

/**
 * Format time as mm:ss
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
