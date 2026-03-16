import type { AnalyserNodeSet } from '../types/audio.js';
import type { VisualizerRenderer } from './visualizers/types.js';
import { LevelMeter } from './visualizers/LevelMeter.js';
import { RTA } from './visualizers/RTA.js';
import { Spectrogram } from './visualizers/Spectrogram.js';
import { Waveform } from './visualizers/Waveform.js';

const GRID_COLS = 2;
const GRID_ROWS = 2;
const SEPARATOR_WIDTH = 1;
const BG_COLOR = '#0f0f0f';
const SEPARATOR_COLOR = 'rgba(255,255,255,0.08)';

interface CellConfig {
  renderer: VisualizerRenderer;
  analyserKey: keyof AnalyserNodeSet;
}

export class ConsoleRenderer {
  private width: number;
  private height: number;
  private cellWidth: number;
  private cellHeight: number;
  private cells: CellConfig[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cellWidth = Math.floor(width / GRID_COLS);
    this.cellHeight = Math.floor(height / GRID_ROWS);

    this.cells = [
      { renderer: new LevelMeter(), analyserKey: 'smooth' },     // top-left
      { renderer: new RTA(), analyserKey: 'medium' },            // top-right
      { renderer: new Spectrogram(), analyserKey: 'raw' },       // bottom-left
      { renderer: new Waveform(), analyserKey: 'reactive' },     // bottom-right
    ];

    // Initialize cell sizes
    for (const cell of this.cells) {
      cell.renderer.resize(this.cellWidth, this.cellHeight);
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.cellWidth = Math.floor(width / GRID_COLS);
    this.cellHeight = Math.floor(height / GRID_ROWS);

    for (const cell of this.cells) {
      cell.renderer.resize(this.cellWidth, this.cellHeight);
    }
  }

  /** Render idle state with labels and grid when no audio is loaded. */
  renderIdle(ctx: CanvasRenderingContext2D): void {
    // Background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, this.width, this.height);

    const labels = ['LEVEL', 'RTA', 'SPECTROGRAM', 'WAVEFORM'];

    for (let i = 0; i < 4; i++) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const x = col * this.cellWidth;
      const y = row * this.cellHeight;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, this.cellWidth, this.cellHeight);
      ctx.clip();
      ctx.translate(x, y);

      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '10px "JetBrains Mono", "Fira Code", monospace';
      ctx.fillText(labels[i], 8, 16);

      // Idle visual per cell
      if (i === 0) {
        // Level Meter: empty bar slots
        const barCount = 12;
        const padding = 20;
        const barWidth = (this.cellWidth - padding * 2 - (barCount - 1) * 4) / barCount;
        for (let b = 0; b < barCount; b++) {
          const bx = padding + b * (barWidth + 4);
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          ctx.fillRect(bx, 28, barWidth, this.cellHeight - 40);
        }
      } else if (i === 1) {
        // RTA: horizontal grid lines
        const gridLines = 5;
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 0.5;
        for (let g = 0; g < gridLines; g++) {
          const gy = 28 + g * ((this.cellHeight - 40) / (gridLines - 1));
          ctx.beginPath();
          ctx.moveTo(8, gy);
          ctx.lineTo(this.cellWidth - 8, gy);
          ctx.stroke();
        }
      } else if (i === 2) {
        // Spectrogram: bordered empty area
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(8, 28, this.cellWidth - 16, this.cellHeight - 40);
      } else {
        // Waveform: center reference line
        const centerY = (this.cellHeight - 12) / 2 + 20;
        ctx.strokeStyle = 'rgba(0,255,0,0.15)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(8, centerY);
        ctx.lineTo(this.cellWidth - 8, centerY);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Grid separator lines
    ctx.strokeStyle = SEPARATOR_COLOR;
    ctx.lineWidth = SEPARATOR_WIDTH;

    ctx.beginPath();
    ctx.moveTo(this.cellWidth, 0);
    ctx.lineTo(this.cellWidth, this.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, this.cellHeight);
    ctx.lineTo(this.width, this.cellHeight);
    ctx.stroke();

    // Outer border glow
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, this.width - 1, this.height - 1);
  }

  render(ctx: CanvasRenderingContext2D, analysers: AnalyserNodeSet, timestamp: number): void {
    // Clear with background color
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, this.width, this.height);

    // Render each cell
    for (let i = 0; i < this.cells.length; i++) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const x = col * this.cellWidth;
      const y = row * this.cellHeight;

      const cell = this.cells[i];
      const analyser = analysers[cell.analyserKey];

      ctx.save();
      // Clip to cell region
      ctx.beginPath();
      ctx.rect(x, y, this.cellWidth, this.cellHeight);
      ctx.clip();
      ctx.translate(x, y);

      cell.renderer.render(ctx, analyser, timestamp);

      ctx.restore();
    }

    // Draw separator lines
    ctx.strokeStyle = SEPARATOR_COLOR;
    ctx.lineWidth = SEPARATOR_WIDTH;

    // Vertical separator
    ctx.beginPath();
    ctx.moveTo(this.cellWidth, 0);
    ctx.lineTo(this.cellWidth, this.height);
    ctx.stroke();

    // Horizontal separator
    ctx.beginPath();
    ctx.moveTo(0, this.cellHeight);
    ctx.lineTo(this.width, this.cellHeight);
    ctx.stroke();

    // Subtle outer border glow
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, this.width - 1, this.height - 1);
  }
}
