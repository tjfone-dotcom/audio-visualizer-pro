/**
 * TurntableRenderer - Canvas 2D renderer for the turntable player.
 * Simplified canvas version of the CSS TurntablePlayer component.
 */

import { TURNTABLE, getTonearmAngle, TRACK_INFO, formatTime } from '../../animation/PlayerGeometry';
import {
  drawCircle,
  drawCircleStroke,
  createRadialGradient,
  createLinearGradient,
  drawRoundedRect,
  drawText,
  drawImageInCircle,
  degToRad,
} from '../drawUtils';

export interface TurntableRenderState {
  animationPhase: string;
  albumArtImage: HTMLImageElement | null;
  currentTime: number;
  audioDuration: number;
  rotation: number;
  audioFileName: string;
}

export class TurntableRenderer {
  render(ctx: CanvasRenderingContext2D, state: TurntableRenderState): void {
    const { animationPhase, albumArtImage, currentTime, audioDuration, rotation, audioFileName } = state;

    const isVisible = animationPhase !== 'closed';
    if (!isVisible) return;

    const isSpinning = animationPhase === 'playing';
    const isOpen = animationPhase === 'open' || animationPhase === 'playing';
    const progress = audioDuration > 0 ? currentTime / audioDuration : 0;
    const tonearmAngle = getTonearmAngle(progress);

    // Wood-tone turntable base
    const baseX = TURNTABLE.platterX - TURNTABLE.platterRadius - 40;
    const baseY = TURNTABLE.platterY - TURNTABLE.platterRadius - 40;
    const baseW = (TURNTABLE.platterRadius + 40) * 2;
    const baseH = (TURNTABLE.platterRadius + 40) * 2;

    const woodGrad = createLinearGradient(ctx, baseX, baseY, baseX + baseW, baseY + baseH, [
      [0, '#5c3a1e'],
      [0.3, '#7a4e2d'],
      [0.6, '#6b3f1f'],
      [1, '#4a2a12'],
    ]);
    drawRoundedRect(ctx, baseX, baseY, baseW, baseH, 16, woodGrad);

    // Subtle border on base
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(baseX, baseY, baseW, baseH, 16);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Platter (metal ring)
    const platterGrad = createRadialGradient(
      ctx,
      TURNTABLE.platterX,
      TURNTABLE.platterY,
      0,
      TURNTABLE.platterRadius,
      [
        [0, '#222'],
        [0.7, '#1a1a1a'],
        [0.85, '#333'],
        [1, '#222'],
      ],
    );
    drawCircle(ctx, TURNTABLE.platterX, TURNTABLE.platterY, TURNTABLE.platterRadius, platterGrad);

    // Vinyl record - draw with rotation
    ctx.save();
    ctx.translate(TURNTABLE.platterX, TURNTABLE.platterY);
    ctx.rotate(degToRad(rotation));

    // Vinyl grooves (concentric rings)
    const vinylR = TURNTABLE.vinylRadius;
    const labelR = TURNTABLE.labelRadius;
    const grooveGrad = createRadialGradient(ctx, 0, 0, labelR, vinylR, [
      [0, '#111'],
      [0.02, '#1a1a1a'],
      [0.15, '#0d0d0d'],
      [0.17, '#1a1a1a'],
      [0.35, '#0f0f0f'],
      [0.37, '#1a1a1a'],
      [0.55, '#0d0d0d'],
      [0.57, '#1a1a1a'],
      [0.75, '#0f0f0f'],
      [0.77, '#1a1a1a'],
      [0.95, '#111'],
      [1, '#222'],
    ]);
    drawCircle(ctx, 0, 0, vinylR, grooveGrad);

    // Vinyl edge highlight
    drawCircleStroke(ctx, 0, 0, vinylR, '#333', 2);

    // Center label
    if (albumArtImage) {
      drawImageInCircle(ctx, albumArtImage, 0, 0, labelR);
    } else {
      const labelGrad = createRadialGradient(ctx, 0, 0, 0, labelR, [
        [0, '#d44'],
        [0.6, '#a22'],
        [1, '#811'],
      ]);
      drawCircle(ctx, 0, 0, labelR, labelGrad);
    }

    // Label border
    drawCircleStroke(ctx, 0, 0, labelR, '#333', 2);

    // Spindle hole
    drawCircle(ctx, 0, 0, 4, '#333');
    drawCircleStroke(ctx, 0, 0, 4, '#555', 1);

    ctx.restore();

    // Tonearm assembly
    const armAngle = isOpen ? tonearmAngle : TURNTABLE.tonearmRestAngle;

    ctx.save();
    ctx.translate(TURNTABLE.tonearmPivotX, TURNTABLE.tonearmPivotY);
    ctx.rotate(degToRad(armAngle));

    // Pivot base
    const pivotGrad = createRadialGradient(ctx, 0, 0, 0, 10, [
      [0, '#888'],
      [1, '#555'],
    ]);
    drawCircle(ctx, 0, 0, 10, pivotGrad);

    // Tonearm bar
    const barGrad = createLinearGradient(ctx, -3, 0, 3, 0, [
      [0, '#999'],
      [0.5, '#ccc'],
      [1, '#999'],
    ]);
    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.roundRect(-3, 0, 6, TURNTABLE.tonearmLength, 3);
    ctx.fill();

    // Headshell
    const headGrad = createLinearGradient(ctx, 0, TURNTABLE.tonearmLength - 5, 0, TURNTABLE.tonearmLength + 19, [
      [0, '#aaa'],
      [1, '#777'],
    ]);
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.roundRect(-8, TURNTABLE.tonearmLength - 5, 16, 24, [2, 2, 4, 4]);
    ctx.fill();

    // Cartridge/stylus
    ctx.fillStyle = '#555';
    ctx.fillRect(-2, TURNTABLE.tonearmLength + 17, 4, 8);

    ctx.restore();

    // Speed indicator label
    drawText(ctx, '33 RPM', 580, 600, {
      font: '10px monospace',
      color: '#665544',
      align: 'right',
    });

    // Power LED
    if (isSpinning) {
      drawCircle(ctx, 60, 600, 3, '#0f0');
      // LED glow
      ctx.save();
      ctx.shadowColor = '#0f0';
      ctx.shadowBlur = 6;
      drawCircle(ctx, 60, 600, 3, '#0f0');
      ctx.restore();
    } else {
      drawCircle(ctx, 60, 600, 3, '#333');
    }

    // Track info
    this.drawTrackInfo(ctx, audioFileName, currentTime, audioDuration);
  }

  private drawTrackInfo(
    ctx: CanvasRenderingContext2D,
    fileName: string,
    currentTime: number,
    duration: number,
  ): void {
    const progress = duration > 0 ? currentTime / duration : 0;
    const displayName = fileName.length > 50 ? fileName.slice(0, 47) + '...' : fileName;
    const timeStr = `${formatTime(currentTime)} / ${formatTime(duration)}`;

    const y = TRACK_INFO.y;
    const padding = TRACK_INFO.padding;

    // File name
    drawText(ctx, displayName, padding, y, {
      font: '12px monospace',
      color: '#aaa',
      align: 'left',
      baseline: 'top',
    });

    // Time
    drawText(ctx, timeStr, 640 - padding, y, {
      font: '12px monospace',
      color: '#888',
      align: 'right',
      baseline: 'top',
    });

    // Progress bar background
    const barY = TRACK_INFO.progressBarY;
    const barH = TRACK_INFO.progressBarHeight;
    const barW = 640 - padding * 2;

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(padding, barY, barW, barH);

    // Progress bar fill
    if (progress > 0) {
      const fillGrad = createLinearGradient(ctx, padding, 0, padding + barW, 0, [
        [0, '#4a9eff'],
        [1, '#a855f7'],
      ]);
      ctx.fillStyle = fillGrad;
      ctx.fillRect(padding, barY, barW * progress, barH);
    }
  }
}
