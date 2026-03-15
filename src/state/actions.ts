import type { PlaybackState, PlayerStyle, AnimationPhase, RecordingState, AppError, AlbumArtSource } from '../types/player';

export type AppAction =
  | { type: 'SET_PLAYBACK_STATE'; payload: PlaybackState }
  | { type: 'SET_PLAYER_STYLE'; payload: PlayerStyle }
  | { type: 'SET_ANIMATION_PHASE'; payload: AnimationPhase }
  | { type: 'SET_ANIMATION_PROGRESS'; payload: number }
  | { type: 'SET_AUDIO_FILE'; payload: File | null }
  | { type: 'SET_AUDIO_DURATION'; payload: number }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_ALBUM_ART'; payload: { url: string | null; source: AlbumArtSource } }
  | { type: 'SET_RECORDING_STATE'; payload: RecordingState }
  | { type: 'SET_RECORDED_BLOB'; payload: Blob | null }
  | { type: 'SET_AI_PROMPT'; payload: string }
  | { type: 'SET_AI_GENERATING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: AppError | null }
  | { type: 'RESET' };
