import { useAppState } from '../state/AppContext';
import { formatTime } from '../animation/PlayerGeometry';

/**
 * TrackInfo - displays filename, current/total time, and progress bar
 * at the bottom of the 640x720 player area.
 */
export function TrackInfo() {
  const { state } = useAppState();
  const { audioFile, currentTime, audioDuration } = state;

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;
  const fileName = audioFile?.name ?? 'No file loaded';
  const displayName =
    fileName.length > 50 ? fileName.slice(0, 47) + '...' : fileName;

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
      <div className="progress-bar-container">
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
