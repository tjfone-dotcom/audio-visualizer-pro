import { useCallback, useRef } from 'react';
import { useAppState } from '../state/AppContext';
import { AudioEngine } from '../audio/AudioEngine';
import { isAudioFile } from '../audio/audioUtils';

export function FileUpload() {
  const { state, dispatch } = useAppState();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!isAudioFile(file)) {
      dispatch({
        type: 'SET_ERROR',
        payload: { type: 'audio', message: 'Unsupported audio format' },
      });
      return;
    }

    dispatch({ type: 'SET_PLAYBACK_STATE', payload: 'loading' });
    dispatch({ type: 'SET_AUDIO_FILE', payload: file });

    try {
      const engine = AudioEngine.getInstance();
      const duration = await engine.loadFile(file);
      dispatch({ type: 'SET_AUDIO_DURATION', payload: duration });
      dispatch({ type: 'SET_CURRENT_TIME', payload: 0 });
      dispatch({ type: 'SET_PLAYBACK_STATE', payload: 'stopped' });
    } catch {
      dispatch({
        type: 'SET_ERROR',
        payload: { type: 'audio', message: 'Failed to load audio file' },
      });
      dispatch({ type: 'SET_PLAYBACK_STATE', payload: 'idle' });
    }
  }, [dispatch]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const isLoading = state.playbackState === 'loading';

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={handleChange}
        className="hidden"
        aria-label="Upload audio file"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        disabled={isLoading}
        className="
          flex items-center justify-center gap-2 px-4 py-3
          border border-dashed border-neutral-700 rounded-lg
          text-neutral-400 text-sm font-mono
          hover:border-neutral-500 hover:text-neutral-300
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors cursor-pointer
          bg-neutral-900/50
        "
        aria-label="Upload audio file or drag and drop"
      >
        {isLoading ? (
          <span>Loading...</span>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>{state.audioFile ? state.audioFile.name : 'Drop audio file or click to upload'}</span>
          </>
        )}
      </button>

      {state.error?.type === 'audio' && (
        <p className="text-red-500 text-xs font-mono" role="alert">
          {state.error.message}
        </p>
      )}
    </div>
  );
}
