export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped';

export type PlayerStyle = 'turntable' | 'cd' | 'cassette';

export type AnimationPhase = 'closed' | 'opening' | 'open' | 'playing' | 'closing';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'done';

export type AlbumArtSource = 'user' | 'ai' | null;

export type ErrorType = 'audio' | 'recording' | 'ai' | 'ffmpeg';

export interface AppError {
  type: ErrorType;
  message: string;
}

export interface LyricLine {
  time: number; // seconds
  text: string;
}

export interface AppState {
  playbackState: PlaybackState;
  playerStyle: PlayerStyle;
  animationPhase: AnimationPhase;
  animationProgress: number;
  audioFile: File | null;
  audioDuration: number;
  currentTime: number;
  volume: number;
  albumArtUrl: string | null;
  albumArtSource: AlbumArtSource;
  lyrics: LyricLine[];
  recordingState: RecordingState;
  recordedBlob: Blob | null;
  aiPrompt: string;
  aiGenerating: boolean;
  error: AppError | null;
  mediaSwapTrigger: number;
}
