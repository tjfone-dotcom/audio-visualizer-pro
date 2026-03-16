import { useMemo } from 'react';
import { useAppState } from '../state/AppContext';

/**
 * LyricsDisplay - Shows the current lyric line synced to playback time.
 * Positioned above the progress bar at the bottom of the player area.
 * Only renders when synced lyrics are available.
 */
export function LyricsDisplay() {
  const { state } = useAppState();
  const { lyrics, currentTime, playbackState } = state;

  const currentLine = useMemo(() => {
    if (lyrics.length === 0) return null;
    // Find the last lyric line whose time <= currentTime
    let found: string | null = null;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (lyrics[i].time <= currentTime) {
        found = lyrics[i].text;
        break;
      }
    }
    return found;
  }, [lyrics, currentTime]);

  if (lyrics.length === 0 || !currentLine) return null;
  if (playbackState === 'idle') return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 58,
        left: 0,
        right: 0,
        textAlign: 'center',
        padding: '0 30px',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <span
        key={currentLine}
        style={{
          display: 'inline-block',
          fontFamily: '"Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
          fontSize: 14,
          fontWeight: 500,
          color: 'rgba(255, 255, 255, 0.85)',
          textShadow: '0 1px 4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(0, 0, 0, 0.5)',
          letterSpacing: 0.3,
          lineHeight: 1.4,
          animation: 'lyricFadeIn 0.3s ease-out',
        }}
      >
        {currentLine}
      </span>
    </div>
  );
}
