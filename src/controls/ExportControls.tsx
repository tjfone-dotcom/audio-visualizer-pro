/**
 * ExportControls - Download UI for recorded WebM video.
 * Shows download button only when a recorded blob exists.
 */

import { useCallback } from 'react';
import { useAppState } from '../state/AppContext';

export function ExportControls() {
  const { state, dispatch } = useAppState();
  const { recordedBlob, recordingState } = state;

  const handleDownload = useCallback(() => {
    if (!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visualization-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Revoke after a short delay to ensure download starts
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [recordedBlob]);

  const handleDiscard = useCallback(() => {
    dispatch({ type: 'SET_RECORDED_BLOB', payload: null });
    dispatch({ type: 'SET_RECORDING_STATE', payload: 'idle' });
  }, [dispatch]);

  if (!recordedBlob || recordingState !== 'done') {
    return null;
  }

  const sizeMB = (recordedBlob.size / (1024 * 1024)).toFixed(1);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleDownload}
        className="
          flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs tracking-wider uppercase
          bg-blue-900/40 border border-blue-600/40 text-blue-300
          hover:bg-blue-800/50 hover:border-blue-500/50
          transition-all duration-200
        "
        aria-label="Download recorded video"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>Download WebM ({sizeMB} MB)</span>
      </button>

      <button
        type="button"
        onClick={handleDiscard}
        className="
          px-3 py-2 rounded-lg font-mono text-xs tracking-wider uppercase
          bg-neutral-800/40 border border-neutral-700/30 text-neutral-500
          hover:bg-neutral-700/50 hover:text-neutral-300
          transition-all duration-200
        "
        aria-label="Discard recording"
        title="Discard this recording"
      >
        Discard
      </button>
    </div>
  );
}
