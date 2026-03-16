import { useRef, useCallback } from 'react';
import { useAppState } from '../state/AppContext';
import { formatTime } from '../animation/PlayerGeometry';
import { AudioEngine } from '../audio/AudioEngine';

/**
 * TrackInfo - displays filename, current/total time, and progress bar
 * at the bottom of the 640x720 player area.
 * Supports click and drag seeking on the progress bar.
 */
export function TrackInfo() {
  const { state, dispatch } = useAppState();
  const { audioFile, currentTime, audioDuration } = state;
  const barRef = useRef<HTMLDivElement>(null);

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;
  const fileName = audioFile?.name ?? 'No file loaded';
  const displayName =
    fileName.length > 50 ? fileName.slice(0, 47) + '...' : fileName;

  const seekToPosition = useCallback((clientX: number) => {
    const bar = barRef.current;
    if (!bar || audioDuration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetTime = audioDuration * ratio;
    AudioEngine.getInstance().seek(targetTime);
    dispatch({ type: 'SET_CURRENT_TIME', payload: targetTime });
  }, [audioDuration, dispatch]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    seekToPosition(e.clientX);
    const onMove = (ev: MouseEvent) => seekToPosition(ev.clientX);
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [seekToPosition]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    seekToPosition(e.touches[0].clientX);
    const onMove = (ev: TouchEvent) => {
      ev.preventDefault();
      seekToPosition(ev.touches[0].clientX);
    };
    const onEnd = () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }, [seekToPosition]);

  return (
    <div className="track-info">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          fontFamily: 'ui-monospace, monospace',
          fontSize: 12,
        }}
      >
        <span
          style={{
            color: '#aaa',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '70%',
          }}
          title={audioFile?.name ?? undefined}
        >
          {displayName}
        </span>
        <span style={{ color: '#888', flexShrink: 0 }}>
          {formatTime(currentTime)} / {formatTime(audioDuration)}
        </span>
      </div>
      <div
        ref={barRef}
        className="progress-bar-container"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className="progress-bar-fill"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #4a9eff, #a855f7)',
          }}
        />
      </div>
    </div>
  );
}
