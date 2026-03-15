import { useAppState } from '../state/AppContext';
import type { PlayerStyle } from '../types/player';

const STYLES: { value: PlayerStyle; label: string; icon: string }[] = [
  { value: 'turntable', label: 'Turntable', icon: '\u25CE' },   // BULLSEYE
  { value: 'cd', label: 'CD', icon: '\u25C9' },                  // FISHEYE
  { value: 'cassette', label: 'Cassette', icon: '\u25A3' },      // SQUARE WITH SQUARE
];

/**
 * StyleSelector - Three tab buttons to switch between turntable, CD, and cassette player styles.
 * When switching style during playback, triggers closing -> closed -> opening sequence.
 */
export function StyleSelector() {
  const { state, dispatch } = useAppState();
  const { playerStyle, animationPhase } = state;

  function handleStyleChange(style: PlayerStyle) {
    if (style === playerStyle) return;

    // If currently open/playing, close first then switch
    if (animationPhase === 'open' || animationPhase === 'playing') {
      dispatch({ type: 'SET_ANIMATION_PHASE', payload: 'closing' });
      // After closing animation completes, the player component will set phase to 'closed'.
      // We set the style change with a delay to let closing finish.
      setTimeout(() => {
        dispatch({ type: 'SET_PLAYER_STYLE', payload: style });
      }, 550);
    } else {
      dispatch({ type: 'SET_PLAYER_STYLE', payload: style });
    }
  }

  return (
    <div className="flex gap-1 rounded-lg bg-neutral-800/60 p-1">
      {STYLES.map(({ value, label, icon }) => {
        const isActive = playerStyle === value;
        return (
          <button
            key={value}
            onClick={() => handleStyleChange(value)}
            disabled={animationPhase === 'opening' || animationPhase === 'closing'}
            className={`
              px-3 py-1.5 rounded-md text-xs font-mono tracking-wide
              transition-all duration-200 cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                isActive
                  ? 'bg-neutral-700 text-neutral-200 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/40'
              }
            `}
            aria-pressed={isActive}
            aria-label={`Switch to ${label} player style`}
          >
            <span style={{ marginRight: 4 }}>{icon}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
