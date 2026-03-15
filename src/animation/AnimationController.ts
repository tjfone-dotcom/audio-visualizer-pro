import type { AnalyserNodeSet } from '../types/audio.js';
import { ConsoleRenderer } from '../console/ConsoleRenderer.js';

export class AnimationController {
  private renderer: ConsoleRenderer;
  private ctx: CanvasRenderingContext2D;
  private getAnalysers: () => AnalyserNodeSet | null;
  private rafId: number | null = null;
  private running = false;

  constructor(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    getAnalysers: () => AnalyserNodeSet | null,
  ) {
    this.ctx = ctx;
    this.getAnalysers = getAnalysers;
    this.renderer = new ConsoleRenderer(width, height);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.tick(performance.now());
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resize(width: number, height: number): void {
    this.renderer.resize(width, height);
  }

  /** Render a single idle frame (dark background with labels) when not playing. */
  renderIdle(): void {
    const analysers = this.getAnalysers();
    if (analysers) {
      this.renderer.render(this.ctx, analysers, performance.now());
    } else {
      // Just clear to background
      this.ctx.fillStyle = '#0f0f0f';
      this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
  }

  private tick = (timestamp: number): void => {
    if (!this.running) return;

    const analysers = this.getAnalysers();
    if (analysers) {
      this.renderer.render(this.ctx, analysers, timestamp);
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  destroy(): void {
    this.stop();
  }
}
