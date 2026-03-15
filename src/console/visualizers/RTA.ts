import type { VisualizerRenderer } from './types.js';

const BAR_COUNT = 48;

export class RTA implements VisualizerRenderer {
  private width = 320;
  private height = 360;
  private dataArray: Uint8Array | null = null;
  private smoothedValues: Float32Array = new Float32Array(BAR_COUNT);

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  render(ctx: CanvasRenderingContext2D, analyser: AnalyserNode): void {
    const bufferLength = analyser.frequencyBinCount;
    if (!this.dataArray || this.dataArray.length !== bufferLength) {
      this.dataArray = new Uint8Array(bufferLength);
    }
    analyser.getByteFrequencyData(this.dataArray);

    const w = this.width;
    const h = this.height;

    const padX = 16;
    const padTop = 28;
    const padBottom = 16;
    const graphW = w - padX * 2;
    const graphH = h - padTop - padBottom;

    const barGap = 1;
    const barWidth = (graphW - barGap * (BAR_COUNT - 1)) / BAR_COUNT;

    // Logarithmic frequency mapping
    const minFreq = 20;
    const maxFreq = 20000;
    const sampleRate = analyser.context.sampleRate;
    const nyquist = sampleRate / 2;

    for (let i = 0; i < BAR_COUNT; i++) {
      // Log scale bin edges
      const freqLow = minFreq * Math.pow(maxFreq / minFreq, i / BAR_COUNT);
      const freqHigh = minFreq * Math.pow(maxFreq / minFreq, (i + 1) / BAR_COUNT);

      const binLow = Math.floor((freqLow / nyquist) * bufferLength);
      const binHigh = Math.ceil((freqHigh / nyquist) * bufferLength);

      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, binLow); j < Math.min(binHigh, bufferLength); j++) {
        sum += this.dataArray[j];
        count++;
      }
      const avg = count > 0 ? sum / count : 0;
      const target = avg / 255;

      // Smooth transition
      this.smoothedValues[i] += (target - this.smoothedValues[i]) * 0.3;
      const normalized = this.smoothedValues[i];

      const barH = normalized * graphH;
      const x = padX + i * (barWidth + barGap);
      const y = padTop + graphH - barH;

      // Cyan bar with gradient
      const grad = ctx.createLinearGradient(x, padTop + graphH, x, padTop);
      grad.addColorStop(0, 'rgba(6,182,212,0.6)');    // darker cyan at bottom
      grad.addColorStop(0.5, 'rgba(6,182,212,0.85)');
      grad.addColorStop(1, 'rgba(34,211,238,1)');      // bright cyan at top

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth, barH);

      // Bright top edge
      if (barH > 2) {
        ctx.fillStyle = 'rgba(165,243,252,0.8)';
        ctx.fillRect(x, y, barWidth, 1.5);
      }
    }

    // Horizontal grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 4; i++) {
      const y = padTop + (graphH * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(padX + graphW, y);
      ctx.stroke();
    }

    // dB scale labels on left
    ctx.font = '8px "JetBrains Mono", "Fira Code", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    const dbLabels = ['0', '-12', '-24', '-36', '-48'];
    for (let i = 0; i < dbLabels.length; i++) {
      const y = padTop + (graphH * i) / (dbLabels.length - 1);
      ctx.fillText(dbLabels[i], padX - 4, y);
    }
    ctx.textAlign = 'left';

    // Label
    ctx.font = '10px "JetBrains Mono", "Fira Code", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textBaseline = 'top';
    ctx.fillText('RTA', 8, 8);
  }
}
