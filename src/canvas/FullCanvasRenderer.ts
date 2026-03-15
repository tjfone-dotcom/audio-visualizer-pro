/**
 * FullCanvasRenderer - Renders the full 1280x720 recording canvas.
 * Left half (640x720): Player visualization (turntable/CD/cassette)
 * Right half (640x720): Mixing console visualizers (reuses ConsoleRenderer)
 */

import type { AnalyserNodeSet } from '../types/audio';
import type { PlayerStyle } from '../types/player';
import { ConsoleRenderer } from '../console/ConsoleRenderer';
import { TurntableRenderer, type TurntableRenderState } from './playerRenderers/TurntableRenderer';
import { CDRenderer, type CDRenderState } from './playerRenderers/CDRenderer';
import { CassetteRenderer, type CassetteRenderState } from './playerRenderers/CassetteRenderer';
import { getCassetteReelSpeeds, CASSETTE, TURNTABLE, CD_PLAYER } from '../animation/PlayerGeometry';

const TOTAL_WIDTH = 1280;
const TOTAL_HEIGHT = 720;
const HALF_WIDTH = 640;

export interface FullCanvasRenderState {
  playerStyle: PlayerStyle;
  animationPhase: string;
  albumArtImage: HTMLImageElement | null;
  currentTime: number;
  audioDuration: number;
  audioFileName: string;
}

export class FullCanvasRenderer {
  private consoleRenderer: ConsoleRenderer;
  private turntableRenderer: TurntableRenderer;
  private cdRenderer: CDRenderer;
  private cassetteRenderer: CassetteRenderer;

  // Rotation tracking
  private discRotation = 0;
  private leftReelRotation = 0;
  private rightReelRotation = 0;
  private lastTimestamp = 0;

  constructor() {
    this.consoleRenderer = new ConsoleRenderer(HALF_WIDTH, TOTAL_HEIGHT);
    this.turntableRenderer = new TurntableRenderer();
    this.cdRenderer = new CDRenderer();
    this.cassetteRenderer = new CassetteRenderer();
  }

  render(
    ctx: CanvasRenderingContext2D,
    state: FullCanvasRenderState,
    analysers: AnalyserNodeSet | null,
    timestamp: number,
  ): void {
    // Calculate delta time for rotation
    const deltaTime = this.lastTimestamp > 0 ? (timestamp - this.lastTimestamp) / 1000 : 0;
    this.lastTimestamp = timestamp;

    // Update rotations if playing
    if (state.animationPhase === 'playing') {
      this.updateRotations(state, deltaTime);
    }

    // Clear entire canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, TOTAL_WIDTH, TOTAL_HEIGHT);

    // Draw player on left half
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, HALF_WIDTH, TOTAL_HEIGHT);
    ctx.clip();
    this.renderPlayer(ctx, state);
    ctx.restore();

    // Separator line between player and console
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(HALF_WIDTH, 0);
    ctx.lineTo(HALF_WIDTH, TOTAL_HEIGHT);
    ctx.stroke();

    // Draw console on right half
    if (analysers) {
      ctx.save();
      ctx.translate(HALF_WIDTH, 0);
      ctx.beginPath();
      ctx.rect(0, 0, HALF_WIDTH, TOTAL_HEIGHT);
      ctx.clip();
      this.consoleRenderer.render(ctx, analysers, timestamp);
      ctx.restore();
    }
  }

  private updateRotations(state: FullCanvasRenderState, deltaTime: number): void {
    const { playerStyle, currentTime, audioDuration } = state;
    const progress = audioDuration > 0 ? currentTime / audioDuration : 0;

    if (playerStyle === 'turntable' || playerStyle === 'cd') {
      // 5 seconds per rotation
      const degreesPerSecond = 360 / 5;
      this.discRotation = (this.discRotation + degreesPerSecond * deltaTime) % 360;
    }

    if (playerStyle === 'cassette') {
      const reelSpeeds = getCassetteReelSpeeds(progress);
      const leftDegreesPerSecond = 360 / reelSpeeds.leftDuration;
      const rightDegreesPerSecond = 360 / reelSpeeds.rightDuration;
      this.leftReelRotation = (this.leftReelRotation + leftDegreesPerSecond * deltaTime) % 360;
      this.rightReelRotation = (this.rightReelRotation + rightDegreesPerSecond * deltaTime) % 360;
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D, state: FullCanvasRenderState): void {
    // Dark background for player area
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, HALF_WIDTH, TOTAL_HEIGHT);

    switch (state.playerStyle) {
      case 'turntable': {
        const renderState: TurntableRenderState = {
          animationPhase: state.animationPhase,
          albumArtImage: state.albumArtImage,
          currentTime: state.currentTime,
          audioDuration: state.audioDuration,
          rotation: this.discRotation,
          audioFileName: state.audioFileName,
        };
        this.turntableRenderer.render(ctx, renderState);
        break;
      }
      case 'cd': {
        const renderState: CDRenderState = {
          animationPhase: state.animationPhase,
          albumArtImage: state.albumArtImage,
          currentTime: state.currentTime,
          audioDuration: state.audioDuration,
          rotation: this.discRotation,
          audioFileName: state.audioFileName,
        };
        this.cdRenderer.render(ctx, renderState);
        break;
      }
      case 'cassette': {
        const renderState: CassetteRenderState = {
          animationPhase: state.animationPhase,
          albumArtImage: state.albumArtImage,
          currentTime: state.currentTime,
          audioDuration: state.audioDuration,
          leftReelRotation: this.leftReelRotation,
          rightReelRotation: this.rightReelRotation,
          audioFileName: state.audioFileName,
        };
        this.cassetteRenderer.render(ctx, renderState);
        break;
      }
    }
  }

  /** Reset rotation state when starting a new recording */
  resetRotations(): void {
    this.discRotation = 0;
    this.leftReelRotation = 0;
    this.rightReelRotation = 0;
    this.lastTimestamp = 0;
  }
}
