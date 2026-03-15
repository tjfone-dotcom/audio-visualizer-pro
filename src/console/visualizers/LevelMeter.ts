import type { VisualizerRenderer } from './types.js';

const BAR_COUNT = 12;
const PEAK_HOLD_TIME = 1200; // ms before peak starts falling
const PEAK_FALL_RATE = 0.0012; // per ms

export class LevelMeter implements VisualizerRenderer {
  private width = 320;
  private height = 360;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private peaks: number[] = new Array(BAR_COUNT).fill(0);
  private peakTimestamps: number[] = new Array(BAR_COUNT).fill(0);

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  render(ctx: CanvasRenderingContext2D, analyser: AnalyserNode, timestamp: number): void {
    const bufferLength = analyser.frequencyBinCount;
    if (!this.dataArray || this.dataArray.length !== bufferLength) {
      this.dataArray = new Uint8Array(new ArrayBuffer(bufferLength));
    }
    analyser.getByteFrequencyData(this.dataArray);

    const w = this.width;
    const h = this.height;

    // Padding
    const padX = 16;
    const padTop = 28;
    const padBottom = 12;
    const meterW = w - padX * 2;
    const meterH = h - padTop - padBottom;

    const barGap = 4;
    const barWidth = (meterW - barGap * (BAR_COUNT - 1)) / BAR_COUNT;

    // Compute per-band values by averaging frequency bins
    for (let i = 0; i < BAR_COUNT; i++) {
      // Use a slight logarithmic distribution - lower bands get fewer bins
      const startBin = Math.floor((i / BAR_COUNT) * (i / BAR_COUNT) * bufferLength * 0.5);
      const endBin = Math.floor(((i + 1) / BAR_COUNT) * ((i + 1) / BAR_COUNT) * bufferLength * 0.5);
      const count = Math.max(1, endBin - startBin);

      let sum = 0;
      for (let j = startBin; j < Math.min(endBin, bufferLength); j++) {
        sum += this.dataArray[j];
      }
      const avg = sum / count;
      const normalized = avg / 255;

      const barH = normalized * meterH;
      const x = padX + i * (barWidth + barGap);
      const y = padTop + meterH - barH;

      // Draw bar with gradient: green bottom -> yellow middle -> red top
      const grad = ctx.createLinearGradient(x, padTop + meterH, x, padTop);
      grad.addColorStop(0, '#22c55e');    // green
      grad.addColorStop(0.5, '#eab308');  // yellow
      grad.addColorStop(0.8, '#f97316');  // orange
      grad.addColorStop(1, '#ef4444');    // red

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth, barH);

      // Subtle inner glow
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(x + 1, y, barWidth - 2, barH);

      // Segmented look - draw dark lines across the bar
      const segmentHeight = 4;
      const segmentGap = 2;
      for (let sy = padTop; sy < padTop + meterH; sy += segmentHeight + segmentGap) {
        ctx.fillStyle = 'rgba(15,15,15,0.5)';
        ctx.fillRect(x, sy, barWidth, segmentGap);
      }

      // Peak hold indicator
      if (normalized > this.peaks[i]) {
        this.peaks[i] = normalized;
        this.peakTimestamps[i] = timestamp;
      } else {
        const elapsed = timestamp - this.peakTimestamps[i];
        if (elapsed > PEAK_HOLD_TIME) {
          this.peaks[i] -= PEAK_FALL_RATE * (elapsed - PEAK_HOLD_TIME);
          if (this.peaks[i] < 0) this.peaks[i] = 0;
        }
      }

      const peakY = padTop + meterH - this.peaks[i] * meterH;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 4;
      ctx.fillRect(x, peakY - 2, barWidth, 2);
      ctx.shadowBlur = 0;
    }

    // Bottom scale ticks
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i <= 4; i++) {
      const y = padTop + (meterH * i) / 4;
      ctx.fillRect(padX - 4, y, 3, 1);
    }

    // Label
    ctx.font = '10px "JetBrains Mono", "Fira Code", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textBaseline = 'top';
    ctx.fillText('LEVEL', 8, 8);
  }
}
