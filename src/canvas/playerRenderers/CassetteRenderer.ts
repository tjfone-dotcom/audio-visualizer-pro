/**
 * CassetteRenderer - Canvas 2D renderer for the cassette player.
 * Simplified canvas version of the CSS CassettePlayer component.
 */

import { CASSETTE, TRACK_INFO, formatTime } from '../../animation/PlayerGeometry';
import {
  drawCircle,
  drawCircleStroke,
  createRadialGradient,
  createLinearGradient,
  drawRoundedRect,
  drawRoundedRectStroke,
  drawText,
  degToRad,
} from '../drawUtils';

export interface CassetteRenderState {
  animationPhase: string;
  albumArtImage: HTMLImageElement | null;
  currentTime: number;
  audioDuration: number;
  leftReelRotation: number;
  rightReelRotation: number;
  audioFileName: string;
}

export class CassetteRenderer {
  render(ctx: CanvasRenderingContext2D, state: CassetteRenderState): void {
    const {
      animationPhase,
      albumArtImage,
      currentTime,
      audioDuration,
      leftReelRotation,
      rightReelRotation,
      audioFileName,
    } = state;

    const isVisible = animationPhase !== 'closed';
    if (!isVisible) return;

    const isSpinning = animationPhase === 'playing';
    const isOpen = animationPhase === 'open' || animationPhase === 'playing';
    const progress = audioDuration > 0 ? currentTime / audioDuration : 0;

    const bodyLeft = CASSETTE.bodyX - CASSETTE.bodyWidth / 2;
    const bodyTop = CASSETTE.bodyY - CASSETTE.bodyHeight / 2;

    // Cassette player body (deck)
    const deckGrad = createLinearGradient(ctx, 0, bodyTop - 80, 0, bodyTop + CASSETTE.bodyHeight + 80, [
      [0, '#2a2a2e'],
      [0.4, '#1e1e22'],
      [1, '#222226'],
    ]);
    drawRoundedRect(ctx, bodyLeft - 60, bodyTop - 80, CASSETTE.bodyWidth + 120, CASSETTE.bodyHeight + 160, 16, deckGrad);

    // Deck border
    drawRoundedRectStroke(ctx, bodyLeft - 60, bodyTop - 80, CASSETTE.bodyWidth + 120, CASSETTE.bodyHeight + 160, 16, 'rgba(255,255,255,0.04)');

    // Amber mood glow around reels
    if (isOpen) {
      ctx.save();
      ctx.shadowColor = 'rgba(255, 170, 50, 0.25)';
      ctx.shadowBlur = 30;
      ctx.globalAlpha = 0.4;
      const glowW = CASSETTE.windowWidth + 40;
      const glowH = CASSETTE.reelRadius * 2 + 60;
      const glowX = CASSETTE.bodyX - glowW / 2;
      const glowY = CASSETTE.reelY - CASSETTE.reelRadius - 30;
      drawRoundedRect(ctx, glowX, glowY, glowW, glowH, 20, 'rgba(255, 170, 50, 0.05)');
      ctx.restore();
    }

    // Cassette shell
    const shellGrad = createLinearGradient(ctx, 0, bodyTop, 0, bodyTop + CASSETTE.bodyHeight, [
      [0, '#3a3a40'],
      [0.5, '#2d2d33'],
      [1, '#252529'],
    ]);
    drawRoundedRect(ctx, bodyLeft, bodyTop, CASSETTE.bodyWidth, CASSETTE.bodyHeight, 12, shellGrad);
    drawRoundedRectStroke(ctx, bodyLeft, bodyTop, CASSETTE.bodyWidth, CASSETTE.bodyHeight, 12, 'rgba(255,255,255,0.06)');

    // Album art label strip at top
    const labelX = bodyLeft + (CASSETTE.bodyWidth - CASSETTE.labelWidth) / 2;
    const labelY = bodyTop + 14;

    if (albumArtImage) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(labelX, labelY, CASSETTE.labelWidth, CASSETTE.labelHeight, 4);
      ctx.clip();
      ctx.drawImage(albumArtImage, labelX, labelY, CASSETTE.labelWidth, CASSETTE.labelHeight);
      ctx.restore();
    } else {
      const labelGrad = createLinearGradient(ctx, labelX, 0, labelX + CASSETTE.labelWidth, 0, [
        [0, '#c4a265'],
        [0.5, '#d4b275'],
        [1, '#c4a265'],
      ]);
      drawRoundedRect(ctx, labelX, labelY, CASSETTE.labelWidth, CASSETTE.labelHeight, 4, labelGrad);
      drawText(ctx, 'AUDIO CASSETTE', CASSETTE.bodyX, labelY + CASSETTE.labelHeight / 2, {
        font: '9px monospace',
        color: '#555',
        align: 'center',
        baseline: 'middle',
      });
    }

    // Label border
    drawRoundedRectStroke(ctx, labelX, labelY, CASSETTE.labelWidth, CASSETTE.labelHeight, 4, 'rgba(0,0,0,0.2)');

    // Tape window
    const winX = bodyLeft + (CASSETTE.bodyWidth - CASSETTE.windowWidth) / 2;
    const winY = bodyTop + CASSETTE.labelHeight + 30;
    const winW = CASSETTE.windowWidth;
    const winH = CASSETTE.windowHeight;

    const winGrad = createLinearGradient(ctx, 0, winY, 0, winY + winH, [
      [0, 'rgba(40,35,30,0.95)'],
      [1, 'rgba(30,25,20,0.95)'],
    ]);
    drawRoundedRect(ctx, winX, winY, winW, winH, 8, winGrad);
    drawRoundedRectStroke(ctx, winX, winY, winW, winH, 8, 'rgba(0,0,0,0.4)');

    // Clip to window for reel drawing
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(winX, winY, winW, winH, 8);
    ctx.clip();

    // Reels are positioned relative to window
    const winCX = winX + winW / 2;
    const winCY = winY + winH / 2;
    const leftReelCX = winCX - 85;
    const rightReelCX = winCX + 85;

    // Tape between reels (horizontal connection)
    ctx.fillStyle = 'rgba(60, 40, 20, 0.6)';
    ctx.fillRect(leftReelCX - CASSETTE.reelRadius, winCY - 2, (85 + CASSETTE.reelRadius) * 2, 4);

    // Tape paths
    ctx.fillStyle = 'rgba(80, 50, 25, 0.4)';
    ctx.fillRect(winX + 20, winCY - CASSETTE.reelRadius - 8, winW - 40, 2);
    ctx.fillRect(winX + 20, winCY + CASSETTE.reelRadius + 6, winW - 40, 2);

    // Left reel (supply)
    const leftTapeRadius = CASSETTE.reelRadius * (1 - progress * 0.6);
    this.drawReel(ctx, leftReelCX, winCY, CASSETTE.reelRadius, CASSETTE.reelHubRadius, leftTapeRadius, leftReelRotation);

    // Right reel (take-up)
    const rightTapeRadius = CASSETTE.reelHubRadius + (CASSETTE.reelRadius - CASSETTE.reelHubRadius) * progress * 0.6 + CASSETTE.reelHubRadius;
    this.drawReel(ctx, rightReelCX, winCY, CASSETTE.reelRadius, CASSETTE.reelHubRadius, rightTapeRadius, rightReelRotation);

    ctx.restore();

    // Screw holes
    const screwPositions = [
      [bodyLeft + 20, bodyTop + 20],
      [bodyLeft + CASSETTE.bodyWidth - 20, bodyTop + 20],
      [bodyLeft + 20, bodyTop + CASSETTE.bodyHeight - 20],
      [bodyLeft + CASSETTE.bodyWidth - 20, bodyTop + CASSETTE.bodyHeight - 20],
      [bodyLeft + CASSETTE.bodyWidth / 2, bodyTop + CASSETTE.bodyHeight - 16],
    ];

    for (const [sx, sy] of screwPositions) {
      const screwGrad = createRadialGradient(ctx, sx, sy, 0, 4, [
        [0, '#444'],
        [1, '#333'],
      ]);
      drawCircle(ctx, sx, sy, 4, screwGrad);
    }

    // Head guide slots at bottom of shell
    const slotsY = bodyTop + CASSETTE.bodyHeight - 18;
    const slotWidths = [28, 20, 40, 20, 28];
    let slotX = bodyLeft + CASSETTE.bodyWidth / 2 - 80;
    for (const w of slotWidths) {
      drawRoundedRect(ctx, slotX, slotsY, w, 14, 2, '#1a1a1e');
      drawRoundedRectStroke(ctx, slotX, slotsY, w, 14, 2, 'rgba(0,0,0,0.3)');
      slotX += w + 6;
    }

    // Chrome trim line
    const trimGrad = createLinearGradient(ctx, bodyLeft - 40, 0, bodyLeft + CASSETTE.bodyWidth + 40, 0, [
      [0, 'transparent'],
      [0.2, 'rgba(200,200,210,0.2)'],
      [0.5, 'rgba(200,200,210,0.4)'],
      [0.8, 'rgba(200,200,210,0.2)'],
      [1, 'transparent'],
    ]);
    ctx.fillStyle = trimGrad;
    ctx.fillRect(bodyLeft - 40, bodyTop + CASSETTE.bodyHeight + 40, CASSETTE.bodyWidth + 80, 2);

    // Power LED
    if (isSpinning) {
      ctx.save();
      ctx.shadowColor = '#ffaa32';
      ctx.shadowBlur = 8;
      drawCircle(ctx, 60, 600, 3, '#ffaa32');
      ctx.restore();
    } else {
      drawCircle(ctx, 60, 600, 3, '#333');
    }

    // Track info
    this.drawTrackInfo(ctx, audioFileName, currentTime, audioDuration);
  }

  private drawReel(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    _radius: number,
    hubRadius: number,
    tapeRadius: number,
    rotation: number,
  ): void {
    // Tape spool
    const tapeGrad = createRadialGradient(ctx, cx, cy, hubRadius, tapeRadius, [
      [0, 'transparent'],
      [0.3, 'rgba(50, 30, 15, 0.6)'],
      [1, 'rgba(60, 35, 18, 0.8)'],
    ]);
    drawCircle(ctx, cx, cy, tapeRadius, tapeGrad);

    // Reel hub
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(degToRad(rotation));

    const hubGrad = createRadialGradient(ctx, 0, 0, 0, hubRadius, [
      [0, '#666'],
      [0.4, '#555'],
      [1, '#444'],
    ]);
    drawCircle(ctx, 0, 0, hubRadius, hubGrad);
    drawCircleStroke(ctx, 0, 0, hubRadius, '#777', 2);

    // Reel spokes
    for (const angle of [0, 120, 240]) {
      ctx.save();
      ctx.rotate(degToRad(angle));
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.roundRect(-2, -(hubRadius - 2), 4, hubRadius - 2, 2);
      ctx.fill();
      ctx.restore();
    }

    // Center spindle
    drawCircle(ctx, 0, 0, 3, '#888');
    drawCircleStroke(ctx, 0, 0, 3, '#999', 1);

    ctx.restore();
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
