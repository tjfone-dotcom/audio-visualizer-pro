import type { AppState } from '../types/player';
import type { AppAction } from './actions';

export const initialState: AppState = {
  playbackState: 'idle',
  playerStyle: 'turntable',
  animationPhase: 'closed',
  animationProgress: 0,
  audioFile: null,
  audioDuration: 0,
  currentTime: 0,
  volume: 0.75,
  albumArtUrl: null,
  albumArtSource: null,
  recordingState: 'idle',
  recordedBlob: null,
  aiPrompt: '',
  aiGenerating: false,
  error: null,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PLAYBACK_STATE':
      return { ...state, playbackState: action.payload };
    case 'SET_PLAYER_STYLE':
      return { ...state, playerStyle: action.payload };
    case 'SET_ANIMATION_PHASE':
      return { ...state, animationPhase: action.payload };
    case 'SET_ANIMATION_PROGRESS':
      return { ...state, animationProgress: action.payload };
    case 'SET_AUDIO_FILE':
      return { ...state, audioFile: action.payload, error: null };
    case 'SET_AUDIO_DURATION':
      return { ...state, audioDuration: action.payload };
    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: Math.max(0, Math.min(1, action.payload)) };
    case 'SET_ALBUM_ART':
      return { ...state, albumArtUrl: action.payload.url, albumArtSource: action.payload.source };
    case 'SET_RECORDING_STATE':
      return { ...state, recordingState: action.payload };
    case 'SET_RECORDED_BLOB':
      return { ...state, recordedBlob: action.payload };
    case 'SET_AI_PROMPT':
      return { ...state, aiPrompt: action.payload };
    case 'SET_AI_GENERATING':
      return { ...state, aiGenerating: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}
