export interface VisualizerRenderer {
  resize(width: number, height: number): void;
  render(ctx: CanvasRenderingContext2D, analyser: AnalyserNode, timestamp: number): void;
}
