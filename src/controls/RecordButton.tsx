/**
 * RecordButton - UI button to start/stop recording the visualization.
 * Disabled when no audio is loaded or when playback is stopped.
 */

import { useAppState } from '../state/AppContext';

export function RecordButton() {
  const { state, dispatch } = useAppState();
  const { recordingState, playbackState, audioFile } = state;

  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';
  const canRecord = audioFile !== null && playbackState !== 'idle';
  const isDisabled = !canRecord || isProcessing;

  function handleClick() {
    if (isRecording) {
      // Signal stop: VisualizationArea will handle the actual stop logic
      dispatch({ type: 'SET_RECORDING_STATE', payload: 'processing' });
    } else {
      // Signal start: VisualizationArea will handle the actual start logic
      dispatch({ type: 'SET_RECORDING_STATE', payload: 'recording' });
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs tracking-wider uppercase
        transition-all duration-200 border
        ${isRecording
          ? 'bg-red-900/60 border-red-600/50 text-red-300 hover:bg-red-800/60'
          : isProcessing
            ? 'bg-neutral-800/60 border-neutral-600/30 text-neutral-500 cursor-wait'
            : isDisabled
              ? 'bg-neutral-800/40 border-neutral-700/30 text-neutral-600 cursor-not-allowed'
              : 'bg-neutral-800/60 border-neutral-600/30 text-neutral-300 hover:bg-neutral-700/60 hover:border-neutral-500/40'
        }
      `}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      title={
        !canRecord
          ? 'Load an audio file and play it to enable recording'
          : isProcessing
            ? 'Processing recording...'
            : isRecording
              ? 'Stop recording'
              : 'Start recording visualization'
      }
    >
      {/* Record indicator dot or stop icon */}
      {isRecording ? (
        <span
          className="w-3 h-3 rounded-sm bg-red-500"
          style={{
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ) : isProcessing ? (
        <span className="w-3 h-3 rounded-full border-2 border-neutral-500 border-t-transparent animate-spin" />
      ) : (
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
      )}

      <span>
        {isRecording ? 'Stop' : isProcessing ? 'Processing...' : 'Record'}
      </span>
    </button>
  );
}
