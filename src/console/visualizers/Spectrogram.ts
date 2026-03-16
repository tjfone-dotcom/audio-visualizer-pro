import type { VisualizerRenderer } from './types.js';

// Viridis-inspired colormap (dark blue -> teal -> green -> yellow)
const COLORMAP_SIZE = 256;

function buildViridisColormap(): Uint8Array {
  const colors = new Uint8Array(COLORMAP_SIZE * 3);
  // Key stops for viridis approximation
  const stops = [
    { t: 0.0, r: 68, g: 1, b: 84 },
    { t: 0.13, r: 72, g: 36, b: 117 },
    { t: 0.25, r: 56, g: 88, b: 140 },
    { t: 0.38, r: 39, g: 130, b: 142 },
    { t: 0.5, r: 31, g: 158, b: 137 },
    { t: 0.63, r: 53, g: 183, b: 121 },
    { t: 0.75, r: 109, g: 205, b: 89 },
    { t: 0.88, r: 180, g: 222, b: 44 },
    { t: 1.0, r: 253, g: 231, b: 37 },
  ];

  for (let i = 0; i < COLORMAP_SIZE; i++) {
    const t = i / (COLORMAP_SIZE - 1);
    // Find surrounding stops
    let s0 = stops[0];
    let s1 = stops[stops.length - 1];
    for (let j = 0; j < stops.length - 1; j++) {
      if (t >= stops[j].t && t <= stops[j + 1].t) {
        s0 = stops[j];
        s1 = stops[j + 1];
        break;
      }
    }
    const localT = s1.t === s0.t ? 0 : (t - s0.t) / (s1.t - s0.t);
    colors[i * 3] = Math.round(s0.r + (s1.r - s0.r) * localT);
    colors[i * 3 + 1] = Math.round(s0.g + (s1.g - s0.g) * localT);
    colors[i * 3 + 2] = Math.round(s0.b + (s1.b - s0.b) * localT);
  }
  return colors;
}

export class Spectrogram implements VisualizerRenderer {
  private width = 320;
  private height = 360;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private imageData: ImageData | null = null;
  /** Offscreen canvas: putImageData ignores ctx.translate(), so we render here then drawImage. */
  private offscreen: OffscreenCanvas | null = null;
  private offCtx: OffscreenCanvasRenderingContext2D | null = null;
  private colormap: Uint8Array;

  private padX = 16;
  private padTop = 36;
  private padBottom = 16;
  private cornerRadius = 8;

  constructor() {
    this.colormap = buildViridisColormap();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.imageData = null;
    this.offscreen = null;
    this.offCtx = null;
  }

  private getDrawArea() {
    return {
      x: this.padX,
      y: this.padTop,
      w: this.width - this.padX * 2,
      h: this.height - this.padTop - this.padBottom,
    };
  }

  render(ctx: CanvasRenderingContext2D, analyser: AnalyserNode): void {
    const bufferLength = analyser.frequencyBinCount;
    if (!this.dataArray || this.dataArray.length !== bufferLength) {
      this.dataArray = new Uint8Array(new ArrayBuffer(bufferLength));
    }
    analyser.getByteFrequencyData(this.dataArray);

    const area = this.getDrawArea();
    const drawW = area.w;
    const drawH = area.h;

    // Initialize offscreen canvas
    if (!this.offscreen || this.offscreen.width !== drawW || this.offscreen.height !== drawH) {
      this.offscreen = new OffscreenCanvas(drawW, drawH);
      this.offCtx = this.offscreen.getContext('2d');
      this.imageData = null;
    }
    if (!this.offCtx) return;

    if (!this.imageData || this.imageData.width !== drawW || this.imageData.height !== drawH) {
      this.imageData = new ImageData(drawW, drawH);
      const pixels = this.imageData.data;
      for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = 15;
        pixels[i + 1] = 15;
        pixels[i + 2] = 15;
        pixels[i + 3] = 255;
      }
    }

    const pixels = this.imageData.data;

    // Scroll left: shift all pixel rows left by 1 pixel (4 bytes)
    for (let row = 0; row < drawH; row++) {
      const rowStart = row * drawW * 4;
      pixels.copyWithin(rowStart, rowStart + 4, rowStart + drawW * 4);
    }

    // Draw new column on the right edge
    for (let row = 0; row < drawH; row++) {
      const freqRatio = 1 - row / drawH;
      const logRatio = Math.pow(freqRatio, 2);
      const bin = Math.floor(logRatio * (bufferLength - 1));
      const value = this.dataArray[Math.min(bin, bufferLength - 1)];
      const boosted = Math.min(255, Math.floor(value * 1.2));

      const colorIdx = boosted;
      const r = this.colormap[colorIdx * 3];
      const g = this.colormap[colorIdx * 3 + 1];
      const b = this.colormap[colorIdx * 3 + 2];

      const pixelIdx = (row * drawW + (drawW - 1)) * 4;
      pixels[pixelIdx] = r;
      pixels[pixelIdx + 1] = g;
      pixels[pixelIdx + 2] = b;
      pixels[pixelIdx + 3] = 255;
    }

    // Render via offscreen canvas with rounded corner clipping
    this.offCtx.putImageData(this.imageData, 0, 0);

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(area.x, area.y, drawW, drawH, this.cornerRadius);
    ctx.clip();
    ctx.drawImage(this.offscreen, area.x, area.y);
    ctx.restore();

    // Subtle rounded border
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.roundRect(area.x, area.y, drawW, drawH, this.cornerRadius);
    ctx.stroke();

    // Label
    ctx.font = '10px "JetBrains Mono", "Fira Code", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textBaseline = 'top';
    ctx.fillText('SPECTROGRAM', 8, 8);
  }
}
