import { useCallback } from 'react';
import { useAppState } from '../state/AppContext';
import { AudioEngine } from '../audio/AudioEngine';

export function VolumeSlider() {
  const { state, dispatch } = useAppState();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      dispatch({ type: 'SET_VOLUME', payload: value });
      AudioEngine.getInstance().setVolume(value);
    },
    [dispatch],
  );

  const percentage = Math.round(state.volume * 100);
  const isMuted = state.volume === 0;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          const next = isMuted ? 0.75 : 0;
          dispatch({ type: 'SET_VOLUME', payload: next });
          AudioEngine.getInstance().setVolume(next);
        }}
        className="text-neutral-400 hover:text-neutral-200 transition-colors"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
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
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          {!isMuted && (
            <>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              {state.volume > 0.5 && (
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              )}
            </>
          )}
          {isMuted && (
            <line x1="23" y1="9" x2="17" y2="15" />
          )}
        </svg>
      </button>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={state.volume}
        onChange={handleChange}
        className="
          w-24 h-1 appearance-none bg-neutral-700 rounded-full
          accent-neutral-400 cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-neutral-300
          [&::-webkit-slider-thumb]:cursor-pointer
        "
        aria-label={`Volume: ${percentage}%`}
      />

      <span className="text-neutral-600 text-xs font-mono w-8 text-right">
        {percentage}
      </span>
    </div>
  );
}
