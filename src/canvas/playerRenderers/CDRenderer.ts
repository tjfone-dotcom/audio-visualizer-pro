/**
 * CDRenderer - Canvas 2D renderer for the CD player.
 * Simplified canvas version of the CSS CDPlayer component.
 */

import { CD_PLAYER, TRACK_INFO, formatTime } from '../../animation/PlayerGeometry';
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

export interface CDRenderState {
  animationPhase: string;
  albumArtImage: HTMLImageElement | null;
  currentTime: number;
  audioDuration: number;
  rotation: number;
  audioFileName: string;
  beatActive?: boolean;
}

export class CDRenderer {
  render(ctx: CanvasRenderingContext2D, state: CDRenderState): void {
    const { animationPhase, albumArtImage, currentTime, audioDuration, rotation, audioFileName } = state;

    const isVisible = animationPhase !== 'closed';
    if (!isVisible) return;

    const isSpinning = animationPhase === 'playing';
    const isOpen = animationPhase === 'open' || animationPhase === 'playing';

    // CD Player body
    const bodyX = CD_PLAYER.discX - CD_PLAYER.discRadius - 50;
    const bodyY = CD_PLAYER.discY - CD_PLAYER.discRadius - 50;
    const bodyW = (CD_PLAYER.discRadius + 50) * 2;
    const bodyH = (CD_PLAYER.discRadius + 50) * 2;

    const bodyGrad = createLinearGradient(ctx, bodyX, bodyY, bodyX + bodyW, bodyY + bodyH, [
      [0, '#3a3d4a'],
      [0.3, '#2a2d3a'],
      [0.6, '#1e2030'],
      [1, '#282b38'],
    ]);
    drawRoundedRect(ctx, bodyX, bodyY, bodyW, bodyH, 20, bodyGrad);

    // Body border
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(bodyX, bodyY, bodyW, bodyH, 20);
    ctx.strokeStyle = 'rgba(100,120,180,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Blue mood glow
    if (isOpen) {
      ctx.save();
      ctx.shadowColor = 'rgba(60, 120, 255, 0.3)';
      ctx.shadowBlur = 40;
      ctx.globalAlpha = 0.5;
      drawCircle(ctx, CD_PLAYER.discX, CD_PLAYER.discY, CD_PLAYER.discRadius + 10, 'rgba(60, 120, 255, 0.05)');
      ctx.restore();
    }

    // CD disc with rotation
    ctx.save();
    ctx.translate(CD_PLAYER.discX, CD_PLAYER.discY);
    ctx.rotate(degToRad(rotation));

    const discR = CD_PLAYER.discRadius;

    // Disc base - album art or default silver
    if (albumArtImage) {
      drawImageInCircle(ctx, albumArtImage, 0, 0, discR);
    } else {
      const discGrad = createLinearGradient(ctx, -discR, -discR, discR, discR, [
        [0, '#e8e8f0'],
        [1, '#d0d0e0'],
      ]);
      drawCircle(ctx, 0, 0, discR, discGrad);
    }

    // Holographic rainbow overlay (conic gradient approximation)
    const rainbowColors = [
      { angle: 0, color: 'rgba(255,0,0,0.06)' },
      { angle: 60, color: 'rgba(255,165,0,0.06)' },
      { angle: 120, color: 'rgba(255,255,0,0.06)' },
      { angle: 180, color: 'rgba(0,255,0,0.06)' },
      { angle: 240, color: 'rgba(0,0,255,0.06)' },
      { angle: 300, color: 'rgba(128,0,255,0.06)' },
    ];

    for (const { angle, color } of rainbowColors) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, discR, degToRad(angle), degToRad(angle + 60));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    }

    // Concentric track rings
    for (let r = discR * 0.15; r < discR * 0.95; r += discR * 0.12) {
      drawCircleStroke(ctx, 0, 0, r, 'rgba(255,255,255,0.03)', 0.5);
    }

    // Light reflection streak
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, discR, 0, Math.PI * 2);
    ctx.clip();
    const reflGrad = createLinearGradient(ctx, -discR, -discR, discR, discR, [
      [0, 'rgba(255,255,255,0.12)'],
      [0.4, 'transparent'],
      [0.6, 'transparent'],
      [1, 'rgba(255,255,255,0.04)'],
    ]);
    ctx.fillStyle = reflGrad;
    ctx.fillRect(-discR, -discR, discR * 2, discR * 2);
    ctx.restore();

    // Disc edge
    drawCircleStroke(ctx, 0, 0, discR, 'rgba(200,200,220,0.3)', 3);

    // Center hole
    const holeGrad = createRadialGradient(ctx, 0, 0, 0, CD_PLAYER.holeRadius, [
      [0, '#1e2030'],
      [1, '#282b38'],
    ]);
    drawCircle(ctx, 0, 0, CD_PLAYER.holeRadius, holeGrad);
    drawCircleStroke(ctx, 0, 0, CD_PLAYER.holeRadius, 'rgba(200,200,220,0.2)', 2);

    // Inner ring around hole
    drawCircleStroke(ctx, 0, 0, CD_PLAYER.holeRadius + 8, 'rgba(200,200,220,0.15)', 1);

    ctx.restore();

    // Beat LED + OPTICAL label
    const beat = state.beatActive ?? false;
    const ledX = CD_PLAYER.discX - 30;
    const ledY = 600;

    // LED dot
    ctx.save();
    if (beat) {
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 8;
    }
    drawCircle(ctx, ledX, ledY, 3, beat ? '#ff4444' : '#331111');
    ctx.restore();

    // OPTICAL text
    drawText(ctx, 'OPTICAL', ledX + 14, ledY, {
      font: '10px monospace',
      color: '#556',
      align: 'left',
      baseline: 'middle',
    });

    // Power LED
    if (isSpinning) {
      ctx.save();
      ctx.shadowColor = '#4a9eff';
      ctx.shadowBlur = 8;
      drawCircle(ctx, 60, 600, 3, '#4a9eff');
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

    drawText(ctx, displayName, padding, y, {
      font: '12px monospace',
      color: '#aaa',
      align: 'left',
      baseline: 'top',
    });

    drawText(ctx, timeStr, 640 - padding, y, {
      font: '12px monospace',
      color: '#888',
      align: 'right',
      baseline: 'top',
    });

    const barY = TRACK_INFO.progressBarY;
    const barH = TRACK_INFO.progressBarHeight;
    const barW = 640 - padding * 2;

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(padding, barY, barW, barH);

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
