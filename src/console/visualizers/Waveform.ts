import type { VisualizerRenderer } from './types.js';

export class Waveform implements VisualizerRenderer {
  private width = 320;
  private height = 360;
  private dataArray: Uint8Array | null = null;

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  render(ctx: CanvasRenderingContext2D, analyser: AnalyserNode): void {
    const bufferLength = analyser.fftSize;
    if (!this.dataArray || this.dataArray.length !== bufferLength) {
      this.dataArray = new Uint8Array(bufferLength);
    }
    analyser.getByteTimeDomainData(this.dataArray);

    const w = this.width;
    const h = this.height;

    const padX = 12;
    const padTop = 28;
    const padBottom = 12;
    const graphW = w - padX * 2;
    const graphH = h - padTop - padBottom;
    const centerY = padTop + graphH / 2;

    // Center reference line
    ctx.strokeStyle = 'rgba(0,255,0,0.12)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(padX, centerY);
    ctx.lineTo(padX + graphW, centerY);
    ctx.stroke();

    // Top and bottom boundary lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.moveTo(padX, padTop);
    ctx.lineTo(padX + graphW, padTop);
    ctx.moveTo(padX, padTop + graphH);
    ctx.lineTo(padX + graphW, padTop + graphH);
    ctx.stroke();

    // Horizontal grid lines at 25% and 75%
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.moveTo(padX, padTop + graphH * 0.25);
    ctx.lineTo(padX + graphW, padTop + graphH * 0.25);
    ctx.moveTo(padX, padTop + graphH * 0.75);
    ctx.lineTo(padX + graphW, padTop + graphH * 0.75);
    ctx.stroke();

    // Draw the waveform with glow effect
    // Shadow pass for glow
    ctx.save();
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const sliceWidth = graphW / bufferLength;
    let x = padX;

    for (let i = 0; i < bufferLength; i++) {
      const v = this.dataArray[i] / 128.0; // normalize to 0-2 range, 1 is center
      const y = padTop + (1 - (v - 1)) * (graphH / 2); // map to graph area

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();
    ctx.restore();

    // Second brighter pass without shadow (sharper line on top of glow)
    ctx.strokeStyle = 'rgba(0,255,0,0.9)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    x = padX;
    for (let i = 0; i < bufferLength; i++) {
      const v = this.dataArray[i] / 128.0;
      const y = padTop + (1 - (v - 1)) * (graphH / 2);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();

    // Label
    ctx.font = '10px "JetBrains Mono", "Fira Code", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textBaseline = 'top';
    ctx.fillText('WAVEFORM', 8, 8);
  }
}
