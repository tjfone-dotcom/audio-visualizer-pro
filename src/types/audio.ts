export interface AnalyserConfig {
  fftSize: number;
  smoothingTimeConstant: number;
}

export interface AudioEngineState {
  isInitialized: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  duration: number;
  currentTime: number;
  volume: number;
}

export interface AnalyserNodeSet {
  /** smoothingTimeConstant = 0.8 - Very smooth, good for ambient visuals */
  smooth: AnalyserNode;
  /** smoothingTimeConstant = 0.5 - Medium smoothing, balanced response */
  medium: AnalyserNode;
  /** smoothingTimeConstant = 0.0 - Raw data, no smoothing, highly reactive */
  raw: AnalyserNode;
  /** smoothingTimeConstant = 0.3 - Light smoothing, responsive to beats */
  reactive: AnalyserNode;
}

export const ANALYSER_CONFIGS: Record<keyof AnalyserNodeSet, AnalyserConfig> = {
  smooth: { fftSize: 2048, smoothingTimeConstant: 0.8 },
  medium: { fftSize: 2048, smoothingTimeConstant: 0.5 },
  raw: { fftSize: 2048, smoothingTimeConstant: 0.0 },
  reactive: { fftSize: 2048, smoothingTimeConstant: 0.3 },
};
