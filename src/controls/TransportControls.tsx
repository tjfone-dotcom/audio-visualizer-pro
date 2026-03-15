import { useCallback, useEffect } from 'react';
import { useAppState } from '../state/AppContext';
import { AudioEngine } from '../audio/AudioEngine';
import { formatTime } from '../audio/audioUtils';

export function TransportControls() {
  const { state, dispatch } = useAppState();
  const hasFile = state.playbackState !== 'idle';
  const isPlaying = state.playbackState === 'playing';
  const canPlay = hasFile && state.playbackState !== 'loading';

  useEffect(() => {
    const engine = AudioEngine.getInstance();
    const removeTimeUpdate = engine.onTimeUpdate((time) => {
      dispatch({ type: 'SET_CURRENT_TIME', payload: time });
    });
    const removeEnded = engine.onEnded(() => {
      dispatch({ type: 'SET_PLAYBACK_STATE', payload: 'stopped' });
      dispatch({ type: 'SET_CURRENT_TIME', payload: 0 });
    });
    return () => {
      removeTimeUpdate();
      removeEnded();
    };
  }, [dispatch]);

  const handlePlayPause = useCallback(async () => {
    const engine = AudioEngine.getInstance();
    if (isPlaying) {
      engine.pause();
      dispatch({ type: 'SET_PLAYBACK_STATE', payload: 'paused' });
    } else {
      try {
        await engine.play();
        dispatch({ type: 'SET_PLAYBACK_STATE', payload: 'playing' });
      } catch {
        dispatch({
          type: 'SET_ERROR',
          payload: { type: 'audio', message: 'Playback failed' },
        });
      }
    }
  }, [isPlaying, dispatch]);

  const handleStop = useCallback(() => {
    const engine = AudioEngine.getInstance();
    engine.stop();
    dispatch({ type: 'SET_PLAYBACK_STATE', payload: 'stopped' });
    dispatch({ type: 'SET_CURRENT_TIME', payload: 0 });
  }, [dispatch]);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handlePlayPause()}
          disabled={!canPlay}
          className="
            flex items-center justify-center w-10 h-10
            rounded-full bg-neutral-800 text-neutral-300
            hover:bg-neutral-700 hover:text-white
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors
          "
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={handleStop}
          disabled={!hasFile || state.playbackState === 'loading'}
          className="
            flex items-center justify-center w-10 h-10
            rounded-full bg-neutral-800 text-neutral-300
            hover:bg-neutral-700 hover:text-white
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors
          "
          aria-label="Stop"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        </button>
      </div>

      <div className="text-neutral-500 text-xs font-mono tabular-nums min-w-[80px]">
        {formatTime(state.currentTime)} / {formatTime(state.audioDuration)}
      </div>
    </div>
  );
}
